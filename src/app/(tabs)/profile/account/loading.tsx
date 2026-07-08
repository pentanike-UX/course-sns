import AppHeader from "@/components/AppHeader";
import { Skeleton } from "@/components/Skeleton";

export default function AccountLoading() {
  return (
    <>
      <AppHeader back="/profile" title="계정 정보" />

      <section className="px-4 pt-4">
        <ul className="overflow-hidden rounded-[var(--radius-card)] border border-line bg-card">
          {Array.from({ length: 3 }).map((_, i) => (
            <li key={i} className="flex items-center justify-between border-b border-line px-4 py-3.5 last:border-0">
              <Skeleton className="h-4 w-20 rounded-full" />
              <Skeleton className="h-4 w-32 rounded-full" />
            </li>
          ))}
        </ul>

        <Skeleton className="mt-5 h-12 w-full rounded-xl bg-card" />
        <Skeleton className="mx-auto mt-8 h-5 w-20 rounded-full" />
      </section>
    </>
  );
}
