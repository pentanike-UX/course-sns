import Link from "next/link";
import GlassCircle from "@/components/GlassCircle";

/** Bell matching the nav-bar icon language: 1.8 rounded stroke, a compact dome
 *  whose skirt sits right above the clapper (no awkward floating gap). Sits in a
 *  36pt glass container inside a 44pt touch target. */
export default function NotificationBell({ count }: { count: number }) {
  return (
    <Link
      href="/notifications"
      aria-label="알림"
      className="relative flex h-11 w-11 items-center justify-center"
    >
      <GlassCircle>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path
            d="M12 3a5.4 5.4 0 0 0-5.4 5.4c0 3.7-.9 5.3-1.7 6.2-.55.6-.12 1.55.7 1.55h12.8c.82 0 1.25-.95.7-1.55-.8-.9-1.7-2.5-1.7-6.2A5.4 5.4 0 0 0 12 3Z"
            stroke="var(--ink-soft)"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
          <path
            d="M9.9 19a2.2 2.2 0 0 0 4.2 0"
            stroke="var(--ink-soft)"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </GlassCircle>
      {count > 0 && (
        <span className="absolute right-1.5 top-1.5 flex min-w-[16px] items-center justify-center rounded-full bg-sunset px-1 text-[10px] font-bold leading-[16px] text-white ring-2 ring-paper">
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
