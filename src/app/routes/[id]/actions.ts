"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { CopyPurpose, TransportMode } from "@/lib/types";

type ToggleResult = { ok?: true; error?: string; needsAuth?: boolean };

async function toggle(
  table: "likes" | "bookmarks",
  routeId: string,
  next: boolean,
): Promise<ToggleResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요.", needsAuth: true };

  if (next) {
    const { error } = await supabase
      .from(table)
      .insert({ user_id: user.id, route_id: routeId });
    // 23505 = already exists; treat as success (idempotent toggle)
    if (error && error.code !== "23505") return { error: "잠시 후 다시 시도해 주세요." };
  } else {
    const { error } = await supabase
      .from(table)
      .delete()
      .eq("user_id", user.id)
      .eq("route_id", routeId);
    if (error) return { error: "잠시 후 다시 시도해 주세요." };
  }

  revalidatePath(`/routes/${routeId}`);
  revalidatePath("/feed");
  revalidatePath("/");
  revalidatePath("/library");
  return { ok: true };
}

export async function toggleLike(routeId: string, next: boolean) {
  return toggle("likes", routeId, next);
}

export async function toggleBookmark(routeId: string, next: boolean) {
  return toggle("bookmarks", routeId, next);
}

type CopySpotRow = {
  id: string;
  order_index: number;
  title: string;
  address: string;
  lat: number | null;
  lng: number | null;
};
type CopyLegRow = {
  from_spot_id: string;
  to_spot_id: string;
  transport: TransportMode;
  duration_min: number | null;
  caution: string | null;
};

function isCopyPurpose(value: string): value is CopyPurpose {
  return value === "plan" || value === "record";
}

/**
 * "이 루트 따라가기" — copy a visible route into my diary as a private draft,
 * then land on its edit page. Copies the practical bones (meta, spots'
 * names/addresses/coords, legs' transport/time/caution) but deliberately NOT
 * the original author's photos, diary text (body), or mood.
 */
export async function copyRoute(routeId: string, purpose: CopyPurpose) {
  if (!isCopyPurpose(purpose)) return { error: "가져올 목적을 선택해 주세요." };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요.", needsAuth: true as const };

  // RLS already limits this to public-or-mine; FK hints needed (junction ambiguity)
  const { data: src } = await supabase
    .from("routes")
    .select(
      "id, author_id, title, region, theme, recommended_for, best_season, est_cost_krw, spots!spots_route_id_fkey(id, order_index, title, address, lat, lng), legs!legs_route_id_fkey(from_spot_id, to_spot_id, transport, duration_min, caution)",
    )
    .eq("id", routeId)
    .single();
  if (!src) return { error: "루트를 찾을 수 없어요." };
  if (src.author_id === user.id) return { error: "내 루트는 이미 내 코스에 있어요." };

  const { data: newRoute, error: routeErr } = await supabase
    .from("routes")
    .insert({
      author_id: user.id,
      title: src.title,
      region: src.region,
      theme: src.theme,
      recommended_for: src.recommended_for,
      best_season: src.best_season,
      est_cost_krw: src.est_cost_krw,
      visibility: "private",
    })
    .select("id")
    .single();
  if (routeErr || !newRoute) return { error: "루트 복제에 실패했어요. 다시 시도해 주세요." };

  const cleanupDraft = async () => {
    await supabase.from("routes").delete().eq("id", newRoute.id);
  };

  const srcSpots = ((src.spots as CopySpotRow[] | null) ?? [])
    .slice()
    .sort((a, b) => a.order_index - b.order_index);

  if (srcSpots.length) {
    const { data: spotRows, error: spotErr } = await supabase
      .from("spots")
      .insert(
        srcSpots.map((s, i) => ({
          route_id: newRoute.id,
          order_index: i,
          title: s.title,
          body: "",
          address: s.address,
          lat: s.lat,
          lng: s.lng,
        })),
      )
      .select("id, order_index");
    if (spotErr || !spotRows) {
      await cleanupDraft();
      return { error: "스팟 복제에 실패했어요." };
    }

    // old spot id → new spot id (via shared order)
    const newIdByOldId = new Map<string, string>();
    srcSpots.forEach((s, i) => {
      const created = spotRows.find((r) => r.order_index === i);
      if (created) newIdByOldId.set(s.id, created.id);
    });

    const legRows = (((src.legs as CopyLegRow[] | null) ?? []) )
      .filter((l) => newIdByOldId.has(l.from_spot_id) && newIdByOldId.has(l.to_spot_id))
      .map((l) => ({
        route_id: newRoute.id,
        from_spot_id: newIdByOldId.get(l.from_spot_id)!,
        to_spot_id: newIdByOldId.get(l.to_spot_id)!,
        transport: l.transport,
        duration_min: l.duration_min,
        caution: l.caution,
      }));
    if (legRows.length) {
      const { error: legErr } = await supabase.from("legs").insert(legRows);
      if (legErr) {
        await cleanupDraft();
        return { error: "이동 정보 복제에 실패했어요." };
      }
    }
  }

  const { error: copyErr } = await supabase.from("route_copies").insert({
    original_route_id: routeId,
    copied_route_id: newRoute.id,
    copier_id: user.id,
    purpose,
  });
  if (copyErr) {
    await cleanupDraft();
    return { error: "초안 연결 정보를 저장하지 못했어요. 다시 시도해 주세요." };
  }

  revalidatePath("/");
  revalidatePath("/feed");
  revalidatePath(`/routes/${routeId}`);
  redirect(`/routes/${newRoute.id}/edit`);
}

export async function convertPlanDraftToRecord(routeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요.", needsAuth: true as const };

  const { data, error } = await supabase
    .from("route_copies")
    .update({ purpose: "record" })
    .eq("copied_route_id", routeId)
    .eq("copier_id", user.id)
    .eq("purpose", "plan")
    .select("copied_route_id")
    .maybeSingle();

  if (error || !data) {
    return { error: "기록 모드로 전환하지 못했어요. 다시 시도해 주세요." };
  }

  revalidatePath(`/routes/${routeId}`);
  revalidatePath(`/routes/${routeId}/edit`);
  revalidatePath("/");
  revalidatePath("/feed");
  return { ok: true };
}

export async function addComment(routeId: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요.", needsAuth: true };

  const text = body.trim();
  if (!text) return { error: "내용을 입력해 주세요." };
  if (text.length > 1000) return { error: "댓글이 너무 길어요 (1000자 이내)." };

  const { error } = await supabase
    .from("comments")
    .insert({ route_id: routeId, author_id: user.id, body: text });
  if (error) return { error: "댓글 등록에 실패했어요." };

  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}

export async function deleteComment(commentId: string, routeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  // RLS enforces author-or-route-owner; this just runs the delete
  const { error } = await supabase.from("comments").delete().eq("id", commentId);
  if (error) return { error: "삭제에 실패했어요." };

  revalidatePath(`/routes/${routeId}`);
  return { ok: true };
}
