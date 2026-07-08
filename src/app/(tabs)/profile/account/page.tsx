import { redirect } from "next/navigation";
import AppHeader from "@/components/AppHeader";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/login/actions";
import { formatDate } from "@/lib/format";
import DeleteAccountButton from "./DeleteAccountButton";

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/profile/account");

  const provider = (user.app_metadata?.provider as string) ?? "email";
  const providerLabel =
    provider === "google" ? "Google" : provider === "email" ? "이메일" : provider;

  return (
    <>
      <AppHeader back="/profile" title="계정 정보" />

      <section className="px-4 pt-4">
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          <Row label="이메일" value={user.email ?? "—"} />
          <Row label="로그인 방식" value={providerLabel} />
          <Row label="가입일" value={user.created_at ? formatDate(user.created_at) : "—"} />
        </ul>

        <form action={signOut} className="mt-5">
          <button
            type="submit"
            className="w-full rounded-xl border border-line bg-card py-3 text-[14px] font-semibold text-ink-soft"
          >
            로그아웃
          </button>
        </form>

        <div className="mt-8">
          <DeleteAccountButton />
        </div>
      </section>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-center justify-between border-b border-line px-4 py-3.5 text-[14px] last:border-0">
      <span className="text-ink-soft">{label}</span>
      <span className="font-medium text-ink">{value}</span>
    </li>
  );
}
