import PersonRow from "@/components/PersonRow";
import type { PersonSummary } from "@/lib/data";

/** A vertical list of people, or a friendly empty state. */
export default function PeopleList({
  people,
  emptyTitle,
  emptyBody,
}: {
  people: PersonSummary[];
  emptyTitle: string;
  emptyBody?: string;
}) {
  if (people.length === 0) {
    return (
      <div className="px-8 py-16 text-center">
        <p className="text-[14px] font-semibold text-ink">{emptyTitle}</p>
        {emptyBody && (
          <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
            {emptyBody}
          </p>
        )}
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {people.map((p) => (
        <li key={p.id}>
          <PersonRow person={p} />
        </li>
      ))}
    </ul>
  );
}
