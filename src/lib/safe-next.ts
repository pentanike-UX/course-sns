/**
 * Same-origin relative path only — blocks open redirects via `?next=`.
 * Allows `/routes/new`, `/library?tab=saved`; rejects `//evil`, `https://…`.
 */
export function safeNextPath(next: string | null | undefined, fallback = "/"): string {
  if (!next) return fallback;
  const trimmed = next.trim();
  if (!trimmed.startsWith("/") || trimmed.startsWith("//")) return fallback;
  if (trimmed.includes("://")) return fallback;
  return trimmed;
}
