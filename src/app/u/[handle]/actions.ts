"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export async function toggleFollow(followeeId: string, next: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "로그인이 필요해요.", needsAuth: true };
  if (user.id === followeeId) return { error: "자신은 팔로우할 수 없어요." };

  if (next) {
    const { error } = await supabase
      .from("follows")
      .insert({ follower_id: user.id, followee_id: followeeId });
    if (error && error.code !== "23505") return { error: "잠시 후 다시 시도해 주세요." };
  } else {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", user.id)
      .eq("followee_id", followeeId);
    if (error) return { error: "잠시 후 다시 시도해 주세요." };
  }

  revalidatePath("/u", "layout");
  return { ok: true };
}
