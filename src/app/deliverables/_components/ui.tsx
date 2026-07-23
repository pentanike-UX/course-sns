import type { ReactNode } from "react";
import Link from "next/link";

export function PageHeader({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <header className="mb-8 border-b border-line pb-6">
      <h1 className="text-2xl font-black tracking-tight sm:text-3xl">{title}</h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">{description}</p>
    </header>
  );
}

export function H2({ children }: { children: ReactNode }) {
  return <h2 className="mt-10 text-lg font-bold tracking-tight text-ink first:mt-0">{children}</h2>;
}

export function H3({ children }: { children: ReactNode }) {
  return <h3 className="mt-6 text-sm font-semibold text-ink">{children}</h3>;
}

export function P({ children }: { children: ReactNode }) {
  return <p className="mt-3 text-sm leading-relaxed text-ink-soft">{children}</p>;
}

export function Ul({ children }: { children: ReactNode }) {
  return <ul className="mt-3 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-ink-soft">{children}</ul>;
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-muted/80 px-4 py-3 text-sm leading-relaxed text-ink-soft ring-1 ring-line">
      {children}
    </div>
  );
}

export function Warn({ children }: { children: ReactNode }) {
  return (
    <div className="mt-4 rounded-xl bg-error-soft px-4 py-3 text-sm leading-relaxed text-[color:var(--error)] ring-1 ring-[color:var(--error)]/15">
      {children}
    </div>
  );
}

export function DocTable({
  headers,
  rows,
}: {
  headers: string[];
  rows: ReactNode[][];
}) {
  return (
    <div className="mt-4 overflow-x-auto rounded-xl ring-1 ring-line">
      <table className="w-full min-w-[520px] border-collapse text-left text-sm">
        <thead>
          <tr className="bg-muted/70">
            {headers.map((h) => (
              <th key={h} className="px-4 py-2.5 text-[12px] font-bold text-ink-soft">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr key={i} className="border-t border-line">
              {row.map((cell, j) => (
                <td key={j} className="px-4 py-3 align-top text-ink-soft">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocCard({
  href,
  title,
  badge,
  children,
}: {
  href: string;
  title: string;
  badge: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-2xl border border-line bg-card p-4 transition hover:bg-muted/40"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="text-[15px] font-bold text-ink">{title}</span>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-ink-soft">
          {badge}
        </span>
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-ink-faint">{children}</p>
    </Link>
  );
}

export function StatusPill({
  tone,
  children,
}: {
  tone: "ok" | "warn" | "todo";
  children: ReactNode;
}) {
  const cls =
    tone === "ok"
      ? "bg-success-soft text-success"
      : tone === "warn"
        ? "bg-sunset-wash text-sunset-ink"
        : "bg-muted text-ink-soft";
  return (
    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-bold ${cls}`}>
      {children}
    </span>
  );
}

export function Code({ children }: { children: ReactNode }) {
  return (
    <code className="rounded bg-muted px-1.5 py-0.5 text-[12px] font-medium text-ink">
      {children}
    </code>
  );
}
