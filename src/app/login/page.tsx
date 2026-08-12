"use client";

import Link from "next/link";
import { Suspense, useActionState, useState } from "react";
import { useSearchParams } from "next/navigation";
import { BrandLockup } from "@/components/BrandMark";
import MobileFrame from "@/components/MobileFrame";
import { createClient } from "@/lib/supabase/client";
import { safeNextPath } from "@/lib/safe-next";
import { signIn, signUp, type AuthState } from "./actions";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const params = useSearchParams();
  const next = safeNextPath(params.get("next"));
  const authError = params.get("error") === "auth";
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const action = mode === "signin" ? signIn : signUp;
  const [state, formAction, pending] = useActionState<AuthState, FormData>(
    action,
    undefined,
  );

  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);
  const signInWithGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    const supabase = createClient();
    // skipBrowserRedirect + location.replace: drop /login from history so
    // after OAuth → create → detail, Back never returns to the auth screen.
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
        skipBrowserRedirect: true,
      },
    });
    if (error || !data.url) {
      setGoogleLoading(false);
      setGoogleError("Google 로그인을 시작하지 못했어요. 다시 시도해 주세요.");
      return;
    }
    window.location.replace(data.url);
  };

  return (
    <MobileFrame shell>
      <main className="flex flex-1 flex-col justify-center px-7">
        <div className="mb-8 text-center">
          <BrandLockup height={48} theme="light" alt="coursee" className="mx-auto" />
          <p className="mt-5 text-[14px] leading-relaxed text-ink-soft">
            좋은 코스 따라가 보고,
            <br />
            다녀온 팁도 남겨 봐요
          </p>
        </div>

        {(authError || googleError) && (
          <p
            role="alert"
            className="mb-4 rounded-lg bg-error-soft px-3 py-2 text-center text-[13px] text-error"
          >
            {googleError ?? "로그인에 실패했어요. 다시 시도해 주세요."}
          </p>
        )}

        {/* mode tabs */}
        <div className="mb-5 flex rounded-full bg-line p-1">
          {(["signin", "signup"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMode(m)}
              className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition-colors ${
                mode === m ? "bg-card text-ink shadow-sm" : "text-ink-faint"
              }`}
            >
              {m === "signin" ? "로그인" : "회원가입"}
            </button>
          ))}
        </div>

        <form action={formAction} className="space-y-3">
          <input type="hidden" name="next" value={next} />

          {mode === "signup" && (
            <Input name="displayName" placeholder="닉네임" autoComplete="nickname" />
          )}
          <Input
            name="email"
            type="email"
            placeholder="이메일"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            type="password"
            placeholder="비밀번호"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            required
          />

          {state?.error && (
            <p className="rounded-lg bg-error-soft px-3 py-2 text-[13px] text-error" role="alert">
              {state.error}
            </p>
          )}
          {state?.notice && (
            <p className="rounded-lg bg-success-soft px-3 py-2 text-[13px] text-success">
              {state.notice}
            </p>
          )}

          <button
            type="submit"
            disabled={pending}
            className="mt-1 w-full rounded-xl bg-sunset py-3.5 text-[15px] font-semibold text-white disabled:opacity-50"
          >
            {pending ? "처리 중…" : mode === "signin" ? "로그인" : "회원가입"}
          </button>
        </form>

        {/* divider */}
        <div className="my-5 flex items-center gap-3">
          <span className="h-px flex-1 bg-line" />
          <span className="text-[12px] text-ink-faint">또는</span>
          <span className="h-px flex-1 bg-line" />
        </div>

        {/* Google */}
        <button
          type="button"
          onClick={signInWithGoogle}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-line bg-card py-3.5 text-[15px] font-semibold text-ink disabled:opacity-50"
        >
          <GoogleLogo />
          {googleLoading ? "이동 중…" : "Google로 계속하기"}
        </button>

        <p className="mt-6 text-center text-[12px] text-ink-faint">
          coursee · 따라갈 수 있는 이동 코스
        </p>

        <Link
          href="/"
          className="mt-4 block text-center text-[13px] font-semibold text-ink-soft underline-offset-2 hover:underline"
        >
          로그인 없이 둘러보기
        </Link>
      </main>
    </MobileFrame>
  );
}

function GoogleLogo() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
      <path fill="#4285F4" d="M45.12 24.5c0-1.56-.14-3.06-.4-4.5H24v8.51h11.84c-.51 2.75-2.06 5.08-4.39 6.64v5.52h7.11c4.16-3.83 6.56-9.47 6.56-16.17Z" />
      <path fill="#34A853" d="M24 46c5.94 0 10.92-1.97 14.56-5.33l-7.11-5.52c-1.97 1.32-4.49 2.1-7.45 2.1-5.73 0-10.58-3.87-12.31-9.07H4.34v5.7C7.96 41.07 15.4 46 24 46Z" />
      <path fill="#FBBC05" d="M11.69 28.18c-.44-1.32-.69-2.73-.69-4.18s.25-2.86.69-4.18v-5.7H4.34A21.99 21.99 0 0 0 2 24c0 3.55.85 6.91 2.34 9.88l7.35-5.7Z" />
      <path fill="#EA4335" d="M24 10.75c3.23 0 6.13 1.11 8.41 3.29l6.31-6.31C34.91 4.18 29.93 2 24 2 15.4 2 7.96 6.93 4.34 14.12l7.35 5.7c1.73-5.2 6.58-9.07 12.31-9.07Z" />
    </svg>
  );
}

function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-xl border border-line bg-card px-4 py-3 text-[15px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
    />
  );
}
