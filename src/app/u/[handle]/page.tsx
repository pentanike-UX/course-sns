import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import MobileFrame from "@/components/MobileFrame";
import SlideOver from "@/components/SlideOver";
import AppHeader from "@/components/AppHeader";
import RouteCard from "@/components/RouteCard";
import FollowToggle from "@/components/FollowToggle";
import { getUserProfile } from "@/lib/data";

export default async function UserProfilePage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const profile = await getUserProfile(decodeURIComponent(handle));
  if (!profile) notFound();

  return (
    <MobileFrame shell>
      <SlideOver fallback="/">
        <AppHeader back="/" title={`@${profile.handle}`} />

        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        <section className="flex flex-col items-center px-4 pb-2 pt-6">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-full bg-sunset-wash ring-2 ring-sunset/30">
            {profile.avatarUrl ? (
              <Image src={profile.avatarUrl} alt={profile.displayName} fill sizes="80px" className="object-cover" />
            ) : (
              <span className="text-2xl font-black text-sunset">{profile.displayName.charAt(0)}</span>
            )}
          </div>
          <h2 className="mt-3 text-lg font-bold text-ink">{profile.displayName}</h2>
          <p className="text-[13px] text-ink-faint">@{profile.handle}</p>

          {!profile.isMe && profile.followsMe && (
            <p className="mt-2 rounded-full bg-sunset-wash px-3 py-1 text-[12px] font-semibold text-sunset-ink">
              회원님을 팔로우합니다
            </p>
          )}

          <div className="mt-4 flex w-full max-w-sm items-stretch gap-0.5 text-center">
            <Stat label="코스" value={profile.routes.length} />
            <Stat label="따라감" value={profile.totalCopyCount} />
            <Stat label="다녀옴" value={profile.totalCompletionCount} />
            <Stat label="팔로워" value={profile.followerCount} href={`/u/${profile.handle}/followers`} />
            <Stat
              label="팔로우 중"
              value={profile.followingCount}
              href={`/u/${profile.handle}/following`}
            />
          </div>

          {profile.isMe && profile.totalCopyCount > 0 && (
            <p className="mt-3 text-center text-[12px] font-medium text-ink-soft">
              내 코스를 {profile.totalCopyCount}명이 따라갔어요
            </p>
          )}

          <div className="mt-5">
            {profile.isMe ? (
              <Link
                href="/profile/edit"
                className="rounded-full border border-line px-6 py-2 text-[14px] font-semibold text-ink-soft"
              >
                프로필 편집
              </Link>
            ) : (
              <FollowToggle
                followeeId={profile.id}
                initialFollowing={profile.isFollowing}
                followsMe={profile.followsMe}
              />
            )}
          </div>
        </section>

        <section className="px-4 pt-6">
          <h3 className="mb-1 text-[14px] font-bold text-ink">코스 책장</h3>
          <p className="mb-3 text-[12px] text-ink-faint">따라갈 수 있는 공개 코스 {profile.routes.length}</p>
          {profile.routes.length === 0 ? (
            <div className="flex flex-col items-center px-6 py-12 text-center">
              <p className="text-[13px] text-ink-faint">아직 공개한 코스가 없어요.</p>
              {profile.isMe ? (
                <>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                    첫 공개 코스를 올리면 책장에 모여요.
                  </p>
                  <Link
                    href="/routes/new"
                    className="mt-4 rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
                  >
                    코스 만들기
                  </Link>
                </>
              ) : (
                <>
                  <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
                    다른 메이커의 코스를 둘러보고 따라가 보세요.
                  </p>
                  <Link
                    href="/"
                    className="mt-4 rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
                  >
                    다른 코스 둘러보기
                  </Link>
                </>
              )}
            </div>
          ) : (
            <ul className="space-y-4">
              {profile.routes.map((r) => (
                <li key={r.id}>
                  <RouteCard route={r} />
                </li>
              ))}
            </ul>
          )}
        </section>
        </main>
      </SlideOver>
    </MobileFrame>
  );
}

function Stat({
  label,
  value,
  href,
}: {
  label: string;
  value: number;
  href?: string;
}) {
  const inner = (
    <>
      <div className="text-[17px] font-black tabular-nums text-ink">{value}</div>
      <div className="mt-0.5 text-[10px] leading-tight text-ink-faint">{label}</div>
    </>
  );
  if (href) {
    return (
      <Link
        href={href}
        className="min-w-0 flex-1 rounded-xl px-1 py-1.5 transition-colors active:bg-muted"
      >
        {inner}
      </Link>
    );
  }
  return <div className="min-w-0 flex-1 px-1 py-1.5">{inner}</div>;
}
