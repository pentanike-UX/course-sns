/**
 * Official coursee brand assets (SVG lockups from design).
 * Light / dark variants follow `html.dark` via Tailwind `dark:` classes.
 */

type Theme = "auto" | "light" | "dark";

function themedSrc(
  theme: Theme,
  light: string,
  dark: string,
): { light?: string; dark?: string; single?: string } {
  if (theme === "light") return { single: light };
  if (theme === "dark") return { single: dark };
  return { light, dark };
}

/** Symbol only — favicon / compact chrome. */
export default function BrandMark({
  size = 32,
  className = "",
  alt = "coursee",
  theme = "auto",
}: {
  size?: number;
  className?: string;
  alt?: string;
  theme?: Theme;
}) {
  const srcs = themedSrc(
    theme,
    "/icons/logo-mark-light.svg",
    "/icons/logo-mark-dark.svg",
  );
  const round = "rounded-[22%]";

  if (srcs.single) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={srcs.single}
        alt={alt}
        width={size}
        height={size}
        className={`${round} ${className}`.trim()}
      />
    );
  }

  return (
    <span
      className={`relative inline-block ${className}`.trim()}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcs.light}
        alt={alt}
        width={size}
        height={size}
        className={`${round} dark:hidden`}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcs.dark}
        alt=""
        width={size}
        height={size}
        className={`absolute inset-0 hidden ${round} dark:block`}
        aria-hidden
      />
    </span>
  );
}

const LOCKUP_RATIO = 551 / 140;

/** Official symbol + wordmark lockup (theme-aware). */
export function BrandLockup({
  height = 36,
  className = "",
  alt = "coursee",
  theme = "auto",
}: {
  height?: number;
  className?: string;
  alt?: string;
  theme?: Theme;
}) {
  const width = Math.round(height * LOCKUP_RATIO);
  const srcs = themedSrc(
    theme,
    "/icons/logo-full-light.svg",
    "/icons/logo-full-dark.svg",
  );

  if (srcs.single) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={srcs.single}
        alt={alt}
        width={width}
        height={height}
        className={className}
      />
    );
  }

  return (
    <span
      className={`relative inline-block ${className}`.trim()}
      style={{ width, height }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcs.light}
        alt={alt}
        width={width}
        height={height}
        className="dark:hidden"
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={srcs.dark}
        alt=""
        width={width}
        height={height}
        className="absolute inset-0 hidden dark:block"
        aria-hidden
      />
    </span>
  );
}

/** Header chrome — official lockup at compact height. */
export function BrandWordmark({
  markSize = 28,
  className = "",
}: {
  /** Kept for call-site compat; maps to lockup height. */
  markSize?: number;
  className?: string;
}) {
  return <BrandLockup height={markSize} className={className} />;
}
