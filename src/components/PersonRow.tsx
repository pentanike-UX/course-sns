import Link from "next/link";
import Image from "next/image";
import FollowToggle from "@/components/FollowToggle";
import type { PersonSummary } from "@/lib/data";

/** A tappable person entry: avatar + name + @handle, with a follow toggle. */
export default function PersonRow({ person }: { person: PersonSummary }) {
  return (
    <div className="flex items-center gap-3 rounded-[var(--radius-card)] border border-line bg-card p-2.5">
      <Link
        href={`/u/${person.handle}`}
        className="flex min-w-0 flex-1 items-center gap-3"
      >
        <span className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-sunset-wash ring-1 ring-sunset/20">
          {person.avatarUrl ? (
            <Image
              src={person.avatarUrl}
              alt=""
              fill
              sizes="44px"
              className="object-cover"
            />
          ) : (
            <span className="text-[15px] font-black text-sunset">
              {person.displayName.charAt(0)}
            </span>
          )}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[14px] font-bold text-ink">
            {person.displayName}
          </span>
          <span className="block truncate text-[12px] text-ink-faint">
            @{person.handle}
          </span>
        </span>
      </Link>
      {!person.isMe && (
        <FollowToggle
          followeeId={person.id}
          initialFollowing={person.isFollowing}
          size="sm"
        />
      )}
    </div>
  );
}
