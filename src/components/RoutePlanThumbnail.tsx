import type { RouteThumbnailPoint } from "@/lib/types";

type Props = {
  points?: RouteThumbnailPoint[];
  className?: string;
  showBase?: boolean;
  /** small corner label so the schematic reads as a route map, not a blank tile */
  showLabel?: boolean;
  onPointClick?: (point: RouteThumbnailPoint) => void;
};

/**
 * SVG route schematic for cards / plan heroes — NOT Naver Maps tiles.
 * The home map tab uses the real Maps JS API; cards stay lightweight.
 */
export default function RoutePlanThumbnail({
  points = [],
  className = "",
  showBase = true,
  showLabel = true,
  onPointClick,
}: Props) {
  const plotted = plotPoints(points);
  const empty = plotted.length === 0;

  return (
    <div
      className={`relative overflow-hidden ${showBase ? "bg-[#f4f4f5]" : "bg-transparent"} ${className}`}
    >
      {/*
        "slice" covers the container while scaling UNIFORMLY — the old "none"
        stretched this portrait artboard into wide layouts (16/10 큰 이미지) and
        squished the pins/route into ovals. Points are plotted inside a central
        safe band (see plotPoints) so the slice crop never clips a pin.
      */}
      <svg
        viewBox="0 0 100 125"
        preserveAspectRatio="xMidYMid slice"
        className="h-full w-full"
        aria-hidden={onPointClick ? undefined : true}
      >
        {showBase && (
          <>
            <rect width="100" height="125" fill="#f4f4f5" />
            {/* subtle grid — neutral (course), not diary green */}
            <path
              d="M-10 23H110M-10 52H110M-10 82H110M-10 111H110"
              stroke="#e4e4e7"
              strokeWidth="0.7"
            />
            <path d="M15 -10V135M43 -10V135M72 -10V135" stroke="#e4e4e7" strokeWidth="0.7" />
            {/* soft “road” ribbons */}
            <path
              d="M-8 32 C18 18 34 42 52 32 S82 18 108 38"
              fill="none"
              stroke="#ffffff"
              strokeWidth="9"
              strokeLinecap="round"
            />
            <path
              d="M-8 32 C18 18 34 42 52 32 S82 18 108 38"
              fill="none"
              stroke="#d4d4d8"
              strokeWidth="1.3"
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
            <path
              d="M10 128 C24 100 37 94 54 78 S79 47 106 56"
              fill="none"
              stroke="#ffffff"
              strokeWidth="11"
              strokeLinecap="round"
            />
            <path
              d="M10 128 C24 100 37 94 54 78 S79 47 106 56"
              fill="none"
              stroke="#d4d4d8"
              strokeWidth="1.4"
              strokeLinecap="round"
            />
          </>
        )}
        {plotted.length > 1 && (
          <polyline
            points={plotted.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="#dc2626"
            strokeWidth={showBase ? "2.8" : "3.6"}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}
        {plotted.map((p) => (
          <g
            key={`${p.point.orderIndex}-${p.point.lat}-${p.point.lng}`}
            onClick={onPointClick ? () => onPointClick(p.point) : undefined}
            onKeyDown={
              onPointClick
                ? (event) => {
                    if (event.key !== "Enter" && event.key !== " ") return;
                    event.preventDefault();
                    onPointClick(p.point);
                  }
                : undefined
            }
            role={onPointClick ? "button" : undefined}
            aria-label={
              onPointClick ? `${p.point.orderIndex + 1}번 스팟 ${p.point.title}` : undefined
            }
            tabIndex={onPointClick ? 0 : undefined}
            style={{
              cursor: onPointClick ? "pointer" : undefined,
              pointerEvents: onPointClick ? "auto" : undefined,
            }}
          >
            <circle cx={p.x} cy={p.y} r="5.6" fill="#ffffff" />
            <circle cx={p.x} cy={p.y} r="4.4" fill="#dc2626" />
            <text
              x={p.x}
              y={p.y + 1.7}
              textAnchor="middle"
              fontSize="6"
              fontWeight="800"
              fill="#ffffff"
            >
              {p.point.orderIndex + 1}
            </text>
          </g>
        ))}
      </svg>

      {showLabel && !empty && (
        <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/45 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm">
          동선 {plotted.length}
        </span>
      )}

      {showBase && empty && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-1.5 px-4 text-center">
          <MapGlyph />
          <span className="text-[11px] font-semibold text-ink-faint">위치가 없어 동선을 그릴 수 없어요</span>
        </div>
      )}
    </div>
  );
}

function MapGlyph() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden className="text-ink-faint">
      <path
        d="M9 4.5 3.5 6.5v13l5.5-2 6 2 5.5-2v-13L15 6.5l-6-2Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path d="M9 4.5v13M15 6.5v13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function plotPoints(points: RouteThumbnailPoint[]) {
  const sorted = points
    .filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng))
    .slice()
    .sort((a, b) => a.orderIndex - b.orderIndex);

  if (sorted.length === 0) return [];

  const lats = sorted.map((p) => p.lat);
  const lngs = sorted.map((p) => p.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const latRange = maxLat - minLat || 0.01;
  const lngRange = maxLng - minLng || 0.01;

  // Keep points inside a central safe band of the 100×125 artboard so that when
  // the SVG is "slice"-cropped to fill wide cards (up to ~16/10) no pin is
  // clipped: a 1.6 aspect crop keeps roughly y∈[31,94], so x∈[22,78], y∈[36,88].
  return sorted.map((point) => ({
    point,
    x: 22 + ((point.lng - minLng) / lngRange) * 56,
    y: 88 - ((point.lat - minLat) / latRange) * 52,
  }));
}

/** Prefer schematic route map over photo for plans / cover-less courses. */
export function shouldUseRouteMapCover(route: {
  coverPhotoUrl?: string;
  copyPurpose?: "plan" | "record";
  thumbnailPoints?: RouteThumbnailPoint[];
}): boolean {
  const geocoded =
    route.thumbnailPoints?.filter((p) => Number.isFinite(p.lat) && Number.isFinite(p.lng)) ??
    [];
  if (route.copyPurpose === "plan" && geocoded.length > 0) return true;
  return !route.coverPhotoUrl;
}
