import Image from "next/image";
import Link from "next/link";
import { getComments } from "@/lib/data";
import type { RouteAuthor } from "@/lib/types";
import { formatDate } from "@/lib/format";
import CommentForm from "./CommentForm";
import DeleteCommentButton from "./DeleteCommentButton";

type Props = {
  routeId: string;
  commentCount: number;
  me: RouteAuthor | null;
  isOwner: boolean;
};

export default async function RouteCommentsSection({
  routeId,
  commentCount,
  me,
  isOwner,
}: Props) {
  const comments = await getComments(routeId);

  return (
    <section className="px-4 pt-7">
      <h2 className="mb-3 text-[16px] font-bold text-ink">
        댓글
        {commentCount > 0 && (
          <span className="ml-1.5 text-[13px] font-medium text-ink-faint">
            {commentCount}
          </span>
        )}
      </h2>

      {comments.length === 0 ? (
        <p className="py-4 text-center text-[13px] text-ink-faint">
          아직 댓글이 없어요. 첫 댓글을 남겨보세요.
        </p>
      ) : (
        <ul className="space-y-4 pb-4">
          {comments.map((c) => {
            const canDelete = isOwner || (!!me && me.id === c.author.id);
            return (
              <li key={c.id} className="flex gap-2.5">
                <Avatar author={c.author} />
                <div className="flex-1">
                  <div className="flex items-center gap-1.5">
                    {c.author.handle ? (
                      <Link
                        href={`/u/${c.author.handle}`}
                        className="text-[13px] font-semibold text-ink"
                      >
                        {c.author.displayName}
                      </Link>
                    ) : (
                      <span className="text-[13px] font-semibold text-ink">
                        {c.author.displayName}
                      </span>
                    )}
                    <span className="text-[11px] text-ink-faint">
                      {formatDate(c.createdAt)}
                    </span>
                    {canDelete && (
                      <span className="ml-auto">
                        <DeleteCommentButton commentId={c.id} routeId={routeId} />
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-soft">
                    {c.body}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {me ? (
        <div className="pt-1">
          <CommentForm routeId={routeId} />
        </div>
      ) : (
        <Link
          href={`/login?next=/routes/${routeId}`}
          className="block rounded-2xl border border-line bg-card py-3 text-center text-[13px] text-ink-faint"
        >
          로그인하고 댓글 남기기
        </Link>
      )}
    </section>
  );
}

export function RouteCommentsFallback({ commentCount }: { commentCount: number }) {
  return (
    <section className="px-4 pt-7" aria-busy="true">
      <h2 className="mb-3 text-[16px] font-bold text-ink">
        댓글
        {commentCount > 0 && (
          <span className="ml-1.5 text-[13px] font-medium text-ink-faint">
            {commentCount}
          </span>
        )}
      </h2>
      <div className="space-y-4 pb-4">
        {Array.from({ length: Math.min(Math.max(commentCount, 1), 3) }).map((_, i) => (
          <div key={i} className="flex gap-2.5">
            <div className="h-8 w-8 shrink-0 animate-pulse rounded-full bg-muted" />
            <div className="min-w-0 flex-1">
              <div className="h-3.5 w-32 animate-pulse rounded-full bg-muted" />
              <div className="mt-2 h-3.5 w-full animate-pulse rounded-full bg-muted" />
              <div className="mt-2 h-3.5 w-2/3 animate-pulse rounded-full bg-muted" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-11 animate-pulse rounded-2xl bg-muted" />
    </section>
  );
}

function Avatar({ author }: { author: { displayName: string; avatarUrl?: string } }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sunset-wash">
      {author.avatarUrl ? (
        <Image
          src={author.avatarUrl}
          alt={author.displayName}
          fill
          sizes="32px"
          className="object-cover"
        />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[13px] font-bold text-sunset">
          {author.displayName.charAt(0)}
        </span>
      )}
    </div>
  );
}
