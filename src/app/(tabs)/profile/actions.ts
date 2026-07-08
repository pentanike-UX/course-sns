"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { publicUrl } from "@/lib/data";
import type { Visibility } from "@/lib/types";

const BUCKET = "route-photos";

/**
 * Permanently delete the current user's account.
 * Removes storage objects (not cascaded by the DB), then deletes the auth user
 * — which cascades profiles → routes → spots/photos/legs/likes/bookmarks/
 * follows/comments/notifications via ON DELETE CASCADE.
 */
export async function deleteAccount() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const admin = createAdminClient();

  // collect storage paths: route photos + avatar
  const paths: string[] = [];
  const { data: routeRows } = await supabase
    .from("routes")
    .select("id")
    .eq("author_id", user.id);
  const routeIds = (routeRows ?? []).map((r) => r.id);
  if (routeIds.length) {
    const { data: photoRows } = await supabase
      .from("spot_photos")
      .select("storage_path, spots!inner(route_id)")
      .in("spots.route_id", routeIds);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const p of (photoRows as any[]) ?? []) paths.push(p.storage_path);
  }
  const { data: prof } = await supabase
    .from("profiles")
    .select("avatar_url")
    .eq("id", user.id)
    .maybeSingle();
  if (prof?.avatar_url?.includes("/route-photos/")) {
    paths.push(prof.avatar_url.split("/route-photos/")[1]);
  }
  if (paths.length) {
    try {
      await admin.storage.from(BUCKET).remove(paths);
    } catch {
      /* best-effort */
    }
  }

  // delete the auth user (cascades all DB data)
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { error: "계정 삭제에 실패했어요. 잠시 후 다시 시도해 주세요." };

  await supabase.auth.signOut();
  redirect("/login");
}

/** Update the user's default visibility for new routes. */
export async function setDefaultVisibility(value: Visibility) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  const { error } = await supabase
    .from("profiles")
    .update({ default_visibility: value })
    .eq("id", user.id);
  if (error) return { error: "저장에 실패했어요." };

  revalidatePath("/profile");
  return { ok: true };
}

/** Sign an avatar upload URL (service role; path rooted at the user's uid). */
export async function signAvatarUpload(ext: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요." };

  const safeExt = (ext || "jpg").replace(/[^a-z0-9]/gi, "").slice(0, 5) || "jpg";
  const path = `${user.id}/avatar/${crypto.randomUUID()}.${safeExt}`;
  const { data, error } = await createAdminClient()
    .storage.from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });
  if (error || !data) return { error: "이미지 업로드 준비에 실패했어요." };
  return { path, token: data.token };
}

export async function updateProfile(input: {
  displayName: string;
  handle: string;
  avatarPath?: string | null;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const displayName = input.displayName.trim();
  const handle = input.handle.trim().toLowerCase();
  if (!displayName) return { error: "닉네임을 입력해 주세요." };
  if (!/^[a-z0-9_]{2,20}$/.test(handle)) {
    return { error: "핸들은 영문 소문자·숫자·_ 2~20자로 입력해 주세요." };
  }

  const patch: { display_name: string; handle: string; avatar_url?: string | null } = {
    display_name: displayName,
    handle,
  };
  if (input.avatarPath !== undefined) {
    patch.avatar_url = input.avatarPath ? publicUrl(input.avatarPath) : null;
  }

  const { error } = await supabase.from("profiles").update(patch).eq("id", user.id);
  if (error) {
    if (error.code === "23505") return { error: "이미 사용 중인 핸들이에요." };
    return { error: "저장에 실패했어요. 다시 시도해 주세요." };
  }

  revalidatePath("/profile");
  redirect("/profile");
}
