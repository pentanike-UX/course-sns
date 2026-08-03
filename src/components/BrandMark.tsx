/**
 * coursee brand mark (symbol only) — favicon / splash / compact chrome.
 * Full lockup (symbol + wordmark) uses `/icons/logo-full.png` on dark surfaces.
 */
export default function BrandMark({
  size = 32,
  className = "",
  alt = "coursee",
}: {
  size?: number;
  className?: string;
  alt?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/icons/icon-512.png"
      alt={alt}
      width={size}
      height={size}
      className={`rounded-[22%] ${className}`.trim()}
    />
  );
}

/** Symbol + "coursee" wordmark for light UI chrome. */
export function BrandWordmark({
  markSize = 28,
  className = "",
}: {
  markSize?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`.trim()}>
      <BrandMark size={markSize} alt="" />
      <span className="text-[1.05em] font-black tracking-tight text-ink">coursee</span>
    </span>
  );
}
