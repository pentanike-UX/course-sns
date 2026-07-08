"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";

/** Best-effort request origin (works on localhost and behind Vercel's proxy). */
async function requestOrigin(): Promise<string> {
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export type AuthState = { error?: string; notice?: string } | undefined;

export async function signIn(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/") || "/";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "이메일 또는 비밀번호가 올바르지 않아요." };

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signUp(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim();
  const next = String(formData.get("next") ?? "/") || "/";

  if (password.length < 6) return { error: "비밀번호는 6자 이상이어야 해요." };
  if (!displayName) return { error: "닉네임을 입력해 주세요." };

  const origin = await requestOrigin();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // confirmation link returns to THIS deployment's callback (not localhost)
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
      data: {
        display_name: displayName,
        handle: email.split("@")[0],
      },
    },
  });
  if (error) {
    return {
      error: error.message.includes("already")
        ? "이미 가입된 이메일이에요."
        : "가입에 실패했어요. 잠시 후 다시 시도해 주세요.",
    };
  }

  // Email confirmation enabled → no session yet. Tell the user to confirm.
  if (!data.session) {
    return {
      notice: "확인 메일을 보냈어요. 메일의 링크로 인증한 뒤 로그인해 주세요.",
    };
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
