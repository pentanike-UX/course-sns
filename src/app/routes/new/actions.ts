"use server";

import { redirect, RedirectType } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicUrl } from "@/lib/data";
import type { CopyPurpose, TransportMode, Visibility } from "@/lib/types";

const BUCKET = "route-photos";

export type PhotoUploadItem = { spotIndex: number; key: string; ext: string };
export type SignedUpload = {
  spotIndex: number;
  key: string;
  path: string;
  token: string;
};

/**
 * Mint signed upload URLs for a route's photos using the service role.
 *
 * The browser can't upload with its own session because Storage rejects this
 * project's ES256 user tokens; instead we sign paths server-side (validating
 * ownership: every path is rooted at the caller's uid) and the client uploads
 * via `uploadToSignedUrl`, which needs no user auth.
 */
export async function signPhotoUploads(
  routeUid: string,
  items: PhotoUploadItem[],
): Promise<{ signed?: SignedUpload[]; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  // routeUid is client-generated; keep it to a uuid shape so paths stay sane.
  if (!/^[0-9a-f-]{36}$/i.test(routeUid)) return { error: "잘못된 요청이에요." };

  const admin = createAdminClient();
  const signed: SignedUpload[] = [];

  for (const it of items) {
    const safeExt = (it.ext || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
    const safeKey = it.key.replace(/[^a-z0-9-]/gi, "").slice(0, 40) || crypto.randomUUID();
    // key (a client uuid) keeps new uploads collision-free, incl. on edit
    const path = `${user.id}/${routeUid}/${it.spotIndex}/${safeKey}.${safeExt}`;
    const { data, error } = await admin.storage
      .from(BUCKET)
      .createSignedUploadUrl(path, { upsert: true });
    if (error || !data) return { error: "사진 업로드 준비에 실패했어요." };
    signed.push({ spotIndex: it.spotIndex, key: it.key, path, token: data.token });
  }

  return { signed };
}

export type SpotInput = {
  title: string;
  body: string;
  address: string;
  lat?: number;
  lng?: number;
  photoPaths: string[];
};

export type LegInput = {
  fromIndex: number;
  toIndex: number;
  transport: TransportMode;
  durationMin?: number;
  caution?: string;
};

export type CreateRouteInput = {
  title: string;
  region: string;
  theme?: string;
  mood?: string;
  recommendedFor?: string;
  bestSeason?: string;
  difficulty?: string;
  estCostKrw?: number;
  visibility: Visibility;
  coverPath?: string;
  copyPurpose?: CopyPurpose;
  spots: SpotInput[];
  legs: LegInput[];
  /**
   * Where to land after a successful save.
   * - `detail` (default): route detail — used by "완료"
   * - `edit`: stay in the editor — used by plan "임시저장" so title/meta aren't skipped
   */
  afterSave?: "detail" | "edit";
};

export async function createRoute(input: CreateRouteInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // 1. route
  const { data: route, error: routeErr } = await supabase
    .from("routes")
    .insert({
      author_id: user.id,
      title: input.title,
      region: input.region,
      theme: input.theme || null,
      mood: input.mood || null,
      recommended_for: input.recommendedFor || null,
      best_season: input.bestSeason || null,
      difficulty: input.difficulty || null,
      est_cost_krw: input.estCostKrw ?? null,
      visibility: input.visibility,
      cover_photo_url: input.coverPath ? publicUrl(input.coverPath) : null,
    })
    .select("id")
    .single();

  if (routeErr || !route) {
    return { error: "코스 저장에 실패했어요. 다시 시도해 주세요." };
  }

  const childErr = await insertChildren(supabase, route.id, input.spots, input.legs);
  if (childErr) return { error: childErr };

  if (input.copyPurpose === "plan") {
    const { error: copyErr } = await supabase.from("route_copies").insert({
      original_route_id: null,
      copied_route_id: route.id,
      copier_id: user.id,
      purpose: "plan",
    });
    if (copyErr) {
      await supabase.from("routes").delete().eq("id", route.id);
      return { error: "계획 초안 정보를 저장하지 못했어요. 다시 시도해 주세요." };
    }
  }

  revalidatePath("/");
  revalidatePath("/feed");
  if (input.afterSave === "edit") {
    redirect(`/routes/${route.id}/edit?draft=1`, RedirectType.replace);
  }
  redirect(`/routes/${route.id}?created=1`, RedirectType.replace);
}

/** Insert a route's spots, photos and legs. Returns an error message or null. */
async function insertChildren(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  routeId: string,
  spots: SpotInput[],
  legs: LegInput[],
): Promise<string | null> {
  const { data: spotRows, error: spotErr } = await supabase
    .from("spots")
    .insert(
      spots.map((s, i) => ({
        route_id: routeId,
        order_index: i,
        title: s.title,
        body: s.body,
        address: s.address,
        lat: s.lat ?? null,
        lng: s.lng ?? null,
      })),
    )
    .select("id, order_index");

  if (spotErr || !spotRows) return "스팟 저장에 실패했어요.";

  const idByIndex = new Map<number, string>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  spotRows.forEach((r: any) => idByIndex.set(r.order_index, r.id));

  const photoRows = spots.flatMap((s, i) =>
    s.photoPaths.map((path, order) => ({
      spot_id: idByIndex.get(i)!,
      storage_path: path,
      order_index: order,
    })),
  );
  if (photoRows.length) {
    await supabase.from("spot_photos").insert(photoRows);
  }

  const legRows = legs
    .filter((l) => idByIndex.has(l.fromIndex) && idByIndex.has(l.toIndex))
    .map((l) => ({
      route_id: routeId,
      from_spot_id: idByIndex.get(l.fromIndex)!,
      to_spot_id: idByIndex.get(l.toIndex)!,
      transport: l.transport,
      duration_min: l.durationMin ?? null,
      caution: l.caution || null,
    }));
  if (legRows.length) {
    await supabase.from("legs").insert(legRows);
  }

  return null;
}

export type UpdateRouteInput = CreateRouteInput & { id: string };

/** Replace a route's contents (owner only). Cleans up orphaned storage files. */
export async function updateRoute(input: UpdateRouteInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // ownership check
  const { data: existing } = await supabase
    .from("routes")
    .select("id, author_id")
    .eq("id", input.id)
    .single();
  if (!existing || existing.author_id !== user.id) {
    return { error: "수정 권한이 없어요." };
  }

  // paths currently in storage for this route (to prune removed ones later)
  const { data: oldPhotoRows } = await supabase
    .from("spot_photos")
    .select("storage_path, spots!inner(route_id)")
    .eq("spots.route_id", input.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const oldPaths: string[] = (oldPhotoRows ?? []).map((r: any) => r.storage_path);

  // update route meta
  const { error: routeErr } = await supabase
    .from("routes")
    .update({
      title: input.title,
      region: input.region,
      theme: input.theme || null,
      mood: input.mood || null,
      recommended_for: input.recommendedFor || null,
      best_season: input.bestSeason || null,
      difficulty: input.difficulty || null,
      est_cost_krw: input.estCostKrw ?? null,
      visibility: input.visibility,
      cover_photo_url: input.coverPath ? publicUrl(input.coverPath) : null,
    })
    .eq("id", input.id);
  if (routeErr) return { error: "코스 수정에 실패했어요." };

  // replace children (cascade deletes legs + photos with the spots)
  await supabase.from("spots").delete().eq("route_id", input.id);
  const childErr = await insertChildren(supabase, input.id, input.spots, input.legs);
  if (childErr) return { error: childErr };

  // prune storage objects no longer referenced
  const newPaths = new Set(input.spots.flatMap((s) => s.photoPaths));
  const orphans = oldPaths.filter((p) => !newPaths.has(p));
  if (orphans.length) {
    try {
      await createAdminClient().storage.from(BUCKET).remove(orphans);
    } catch {
      // best-effort cleanup; ignore failures
    }
  }

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/routes/${input.id}`);
  if (input.afterSave === "edit") {
    redirect(`/routes/${input.id}/edit?draft=1`, RedirectType.replace);
  }
  redirect(`/routes/${input.id}?saved=1`, RedirectType.replace);
}

/** Delete a route and its photos (owner only). */
export async function deleteRoute(routeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: existing } = await supabase
    .from("routes")
    .select("id, author_id")
    .eq("id", routeId)
    .single();
  if (!existing || existing.author_id !== user.id) {
    return { error: "삭제 권한이 없어요." };
  }

  const { data: photoRows } = await supabase
    .from("spot_photos")
    .select("storage_path, spots!inner(route_id)")
    .eq("spots.route_id", routeId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const paths: string[] = (photoRows ?? []).map((r: any) => r.storage_path);

  const { error } = await supabase.from("routes").delete().eq("id", routeId);
  if (error) return { error: "삭제에 실패했어요." };

  if (paths.length) {
    try {
      await createAdminClient().storage.from(BUCKET).remove(paths);
    } catch {
      // best-effort
    }
  }

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath("/library");
  redirect("/");
}
