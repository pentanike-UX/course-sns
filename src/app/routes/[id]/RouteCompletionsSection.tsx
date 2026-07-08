import Image from "next/image";
import Link from "next/link";
import { getRouteCompletions } from "@/lib/data";
import type { RouteCompletion } from "@/lib/types";
import { formatDate } from "@/lib/format";

type Props = {
  routeId: string;
  completionCount: number;
  completionRatingAvg?: number;
};

export default async function RouteCompletionsSection({
  routeId,
  completionCount,
  completionRatingAvg,
}: Props) {
  if (completionCount === 0) return null;

  const completions = await getRouteCompletions(routeId);

  return (
    <section className="px-4 pt-7">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-bold text-ink">다녀온 후기</h2>
          <p className="mt-0.5 text-[12px] leading-relaxed text-ink-faint">
            {completionCount}명이 이 코스를 다녀왔어요
            {completionRatingAvg ? ` · 평균 ${completionRatingAvg}점` : ""}
          </p>
        </div>
        {completionRatingAvg ? (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-sunset-wash px-2.5 py-1 text-[13px] font-bold text-sunset-ink">
            <StarIcon />
            {completionRatingAvg}
          </div>
        ) : null}
      </div>

      {completions.length > 0 && (
        <ul className="mt-4 space-y-3">
          {completions.map((c) => (
            <CompletionCard key={c.id} completion={c} />
          ))}
        </ul>
      )}
    </section>
  );
}

export function RouteCompletionsFallback() {
  return (
    <section className="px-4 pt-7" aria-busy="true">
      <div className="h-5 w-28 animate-pulse rounded-full bg-muted" />
      <div className="mt-2 h-3.5 w-48 animate-pulse rounded-full bg-muted" />
      <div className="mt-4 space-y-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <div className="flex gap-2.5">
              <div className="h-8 w-8 animate-pulse rounded-full bg-muted" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 w-24 animate-pulse rounded-full bg-muted" />
                <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function CompletionCard({ completion }: { completion: RouteCompletion }) {
  const { completer } = completion;

  return (
    <li className="rounded-[var(--radius-card)] border border-line bg-card p-4">
      <div className="flex gap-2.5">
        <Avatar author={completer} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {completer.handle ? (
              <Link href={`/u/${completer.handle}`} className="text-[13px] font-semibold text-ink">
                {completer.displayName}
              </Link>
            ) : (
              <span className="text-[13px] font-semibold text-ink">{completer.displayName}</span>
            )}
            {completion.rating ? (
              <span className="flex items-center gap-0.5 text-[12px] font-semibold text-sunset-ink">
                <StarIcon small />
                {completion.rating}
              </span>
            ) : null}
            <span className="text-[11px] text-ink-faint">{formatDate(completion.createdAt)}</span>
          </div>
          {completion.tip ? (
            <p className="mt-1.5 whitespace-pre-wrap text-[13px] leading-relaxed text-ink-soft">
              {completion.tip}
            </p>
          ) : (
            <p className="mt-1.5 text-[13px] text-ink-faint">다녀왔어요!</p>
          )}
        </div>
      </div>
    </li>
  );
}

function Avatar({ author }: { author: RouteCompletion["completer"] }) {
  return (
    <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full bg-sunset-wash">
      {author.avatarUrl ? (
        <Image src={author.avatarUrl} alt={author.displayName} fill sizes="32px" className="object-cover" />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-[12px] font-bold text-sunset">
          {author.displayName.charAt(0)}
        </span>
      )}
    </div>
  );
}

function StarIcon({ small }: { small?: boolean }) {
  const size = small ? 12 : 14;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden>
      <path
        d="M12 2l2.9 6.6L22 9.8l-5 4.4 1.5 6.8L12 17.8l-6.5 3.2 1.5-6.8-5-4.4 7.1-1.2L12 2z"
        fill="var(--sunset)"
      />
    </svg>
  );
}
