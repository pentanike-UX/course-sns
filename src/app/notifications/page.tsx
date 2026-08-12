import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import MobileFrame from "@/components/MobileFrame";
import SlideOver from "@/components/SlideOver";
import AppHeader from "@/components/AppHeader";
import { getNotifications, getCurrentProfile } from "@/lib/data";
import { formatDate } from "@/lib/format";
import type { AppNotification } from "@/lib/types";
import MarkRead from "./MarkRead";

function isTransfer(type: AppNotification["type"]) {
  return (
    type === "completion" ||
    type === "follow" ||
    type === "copy" ||
    type === "course_publish"
  );
}

export default async function NotificationsPage() {
  const me = await getCurrentProfile();
  if (!me) redirect("/login?next=/notifications");

  const items = await getNotifications();
  const hasUnread = items.some((n) => !n.read);
  const transfer = items.filter((n) => isTransfer(n.type));
  const social = items.filter((n) => !isTransfer(n.type));

  return (
    <MobileFrame shell>
      <SlideOver fallback="/">
        <AppHeader back="/" title="알림" />
        <MarkRead hasUnread={hasUnread} />

        <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
          {items.length === 0 ? (
            <div className="flex flex-col items-center px-8 py-20 text-center">
              <p className="text-[14px] text-ink-faint">
                아직 알림이 없어요.
                <br />
                새 코스·따라가기·완주 후기가 생기면 여기 모여요.
              </p>
              <Link
                href="/"
                className="mt-5 rounded-full bg-sunset px-5 py-2.5 text-[13px] font-semibold text-white"
              >
                코스 둘러보기
              </Link>
            </div>
          ) : (
            <>
              {transfer.length > 0 && (
                <NotificationGroup title="전이 · 구독" items={transfer} />
              )}
              {social.length > 0 && (
                <NotificationGroup
                  title="좋아요 · 댓글"
                  items={social}
                  muted
                  demoted
                />
              )}
            </>
          )}
        </main>
      </SlideOver>
    </MobileFrame>
  );
}

function NotificationGroup({
  title,
  items,
  muted = false,
  demoted = false,
}: {
  title: string;
  items: AppNotification[];
  muted?: boolean;
  /** FOL-03: social sits below transfer — quieter chrome */
  demoted?: boolean;
}) {
  return (
    <section
      className={
        demoted ? "opacity-55" : muted ? "opacity-80" : undefined
      }
    >
      <h2
        className={`sticky top-0 z-[1] bg-paper/95 px-4 pb-1.5 pt-4 text-[12px] font-bold backdrop-blur ${
          demoted ? "text-ink-faint" : "text-ink-soft"
        }`}
      >
        {title}
      </h2>
      <ul>
        {items.map((n) => (
          <li key={n.id}>
            <NotificationRow n={n} />
          </li>
        ))}
      </ul>
    </section>
  );
}

function NotificationRow({ n }: { n: AppNotification }) {
  const href =
    n.type === "follow" ? `/u/${n.actor.handle}` : n.routeId ? `/routes/${n.routeId}` : "/";
  const transfer = isTransfer(n.type);

  const message =
    n.type === "follow" ? (
      <>회원님을 팔로우하기 시작했어요</>
    ) : n.type === "like" ? (
      <>
        회원님의 코스 <b className="font-semibold text-ink">{n.routeTitle ?? ""}</b>를 좋아해요
      </>
    ) : n.type === "completion" ? (
      <>
        회원님의 코스 <b className="font-semibold text-ink">{n.routeTitle ?? ""}</b>를 다녀왔어요
      </>
    ) : n.type === "copy" ? (
      <>
        회원님의 코스 <b className="font-semibold text-ink">{n.routeTitle ?? ""}</b>를 따라가기
        시작했어요
      </>
    ) : n.type === "course_publish" ? (
      <>
        새 코스 <b className="font-semibold text-ink">{n.routeTitle ?? ""}</b>를 올렸어요
      </>
    ) : (
      <>
        회원님의 코스 <b className="font-semibold text-ink">{n.routeTitle ?? ""}</b>에 댓글을 남겼어요
      </>
    );

  return (
    <Link
      href={href}
      className={`flex items-center gap-3 border-b border-line px-4 py-3.5 ${
        !n.read && transfer
          ? "bg-sunset-wash/45"
          : !n.read
            ? "bg-muted/60"
            : ""
      }`}
    >
      <div className="relative h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
        {n.actor.avatarUrl ? (
          <Image src={n.actor.avatarUrl} alt={n.actor.displayName} fill sizes="36px" className="object-cover" />
        ) : (
          <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-ink-soft">
            {n.actor.displayName.charAt(0)}
          </span>
        )}
        <span
          className={`absolute -bottom-1 -right-1 max-w-[3.5rem] truncate rounded px-1 text-[8px] font-black leading-4 tracking-tight ${
            transfer ? "bg-sunset text-white" : "bg-ink/70 text-paper"
          }`}
        >
          {TYPE_LABEL[n.type]}
        </span>
      </div>
      <div className="flex-1 text-[13px] leading-relaxed text-ink-soft">
        <span className="font-semibold text-ink">{n.actor.displayName}</span>님이 {message}
        <div className="mt-0.5 text-[11px] text-ink-faint">{formatDate(n.createdAt)}</div>
      </div>
      {!n.read && (
        <span
          className={`h-2 w-2 shrink-0 rounded-full ${transfer ? "bg-sunset" : "bg-ink-faint"}`}
        />
      )}
    </Link>
  );
}

/** FOL-03: full labels — avoid cryptic「따라/팔로/새코스」. */
const TYPE_LABEL: Record<AppNotification["type"], string> = {
  course_publish: "새 코스",
  copy: "따라가기",
  completion: "완주",
  follow: "팔로우",
  comment: "댓글",
  like: "좋아요",
};
