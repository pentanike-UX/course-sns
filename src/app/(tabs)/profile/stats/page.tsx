import Link from "next/link";
import AppHeader from "@/components/AppHeader";
import { getMyTravelStats } from "@/lib/data";
import { formatDistance } from "@/lib/geo";
import { formatDuration, formatDate } from "@/lib/format";
import { TRANSPORT_LABEL, TRANSPORT_COLOR, type TransportMode } from "@/lib/types";
import StatsMap from "./StatsMap";

const HEATMAP_WEEKS = 26;
const LEVEL_CLASS = ["bg-muted", "bg-sunset/25", "bg-sunset/50", "bg-sunset/75", "bg-sunset"];

function buildHeatmap(daily: { date: string; count: number }[]) {
  const map = new Map(daily.map((d) => [d.date, d.count]));
  const max = Math.max(1, ...daily.map((d) => d.count));
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // first cell = the Sunday (HEATMAP_WEEKS-1) weeks before this week's Sunday
  const start = new Date(today);
  start.setDate(start.getDate() - start.getDay() - (HEATMAP_WEEKS - 1) * 7);

  const key = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

  const weeks: { key: string; count: number; level: number; future: boolean }[][] = [];
  for (let w = 0; w < HEATMAP_WEEKS; w++) {
    const col: { key: string; count: number; level: number; future: boolean }[] = [];
    for (let d = 0; d < 7; d++) {
      const cur = new Date(start);
      cur.setDate(start.getDate() + w * 7 + d);
      const future = cur.getTime() > today.getTime();
      const count = map.get(key(cur)) ?? 0;
      const level = count === 0 ? 0 : Math.min(4, Math.ceil((count / max) * 4));
      col.push({ key: key(cur), count, level, future });
    }
    weeks.push(col);
  }
  return weeks;
}

export default async function TravelStatsPage() {
  const stats = await getMyTravelStats();

  if (!stats || stats.routeCount === 0) {
    return (
      <>
        <AppHeader back="/profile" title="여행 통계" />
        <div className="px-4 py-16 text-center text-[14px] text-ink-faint">
          아직 기록한 루트가 없어요.
          <br />첫 하루를 기록하면 통계가 쌓이기 시작해요.
          <div className="mt-5">
            <Link
              href="/routes/new"
              className="inline-block rounded-full bg-sunset px-5 py-2.5 text-[14px] font-semibold text-white"
            >
              새 루트 기록하기
            </Link>
          </div>
        </div>
      </>
    );
  }

  const weeks = buildHeatmap(stats.daily);
  const moveTotal = stats.transportMix.reduce((s, t) => s + t.count, 0);
  const reactionTotal = stats.likeTotal + stats.copiesReceived;

  return (
    <>
      <AppHeader back="/profile" title="여행 통계" />

      {/* summary */}
      <section className="mx-4 mt-4 grid grid-cols-3 divide-x divide-line rounded-[var(--radius-card)] border border-line bg-card py-4 text-center">
        <SummaryStat label="루트" value={stats.routeCount} />
        <SummaryStat label="스팟" value={stats.spotCount} />
        <SummaryStat label="지역" value={stats.regions.length} />
      </section>

      {/* cumulative milestones */}
      <Section title="누적 기록">
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
          <Tile label="총 이동 거리" value={formatDistance(stats.totalDistanceMeters)} />
          <Tile label="총 이동 시간" value={formatDuration(stats.totalDurationMin) || "—"} />
          <Tile label="기록한 사진" value={`${stats.photoCount}장`} />
          <Tile label="기록한 날" value={`${stats.recordDays}일`} />
        </div>
        {stats.firstRecordAt && (
          <p className="mt-2 text-center text-[12px] text-ink-faint">
            {formatDate(stats.firstRecordAt)}부터 함께한 여행
          </p>
        )}
      </Section>

      {/* transport mix */}
      {moveTotal > 0 && (
        <Section title="이동 수단">
          <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
            <div className="flex h-3 overflow-hidden rounded-full">
              {stats.transportMix.map((t) => (
                <div
                  key={t.transport}
                  style={{
                    width: `${(t.count / moveTotal) * 100}%`,
                    backgroundColor: TRANSPORT_COLOR[t.transport] ?? TRANSPORT_COLOR.other,
                  }}
                />
              ))}
            </div>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
              {stats.transportMix.map((t) => (
                <span key={t.transport} className="flex items-center gap-1.5 text-[12px] text-ink-soft">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: TRANSPORT_COLOR[t.transport] ?? TRANSPORT_COLOR.other }}
                  />
                  {TRANSPORT_LABEL[t.transport as TransportMode]}
                  <span className="font-semibold text-ink">{t.count}</span>
                </span>
              ))}
            </div>
          </div>
        </Section>
      )}

      {/* activity heatmap */}
      <Section title="활동 기록" subtitle="최근 6개월">
        <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
          <div className="flex gap-[3px]">
            {weeks.map((col, w) => (
              <div key={w} className="flex flex-1 flex-col gap-[3px]">
                {col.map((cell) => (
                  <div
                    key={cell.key}
                    title={cell.future ? undefined : `${cell.key} · ${cell.count}개`}
                    className={`aspect-square rounded-[2px] ${
                      cell.future ? "bg-transparent" : LEVEL_CLASS[cell.level]
                    }`}
                  />
                ))}
              </div>
            ))}
          </div>
          <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-ink-faint">
            적음
            {LEVEL_CLASS.map((c, i) => (
              <span key={i} className={`h-2.5 w-2.5 rounded-[2px] ${c}`} />
            ))}
            많음
          </div>
        </div>
      </Section>

      {/* travel style: theme + mood */}
      {(stats.themes.length > 0 || stats.moods.length > 0) && (
        <Section title="여행 스타일">
          <div className="flex flex-wrap gap-2">
            {stats.themes.map((t) => (
              <span
                key={`t-${t.name}`}
                className="rounded-full bg-sunset-wash px-3 py-1.5 text-[13px] font-medium text-sunset-ink"
              >
                # {t.name}
                {t.count > 1 && <span className="ml-1 text-[11px] opacity-70">×{t.count}</span>}
              </span>
            ))}
            {stats.moods.map((m) => (
              <span
                key={`m-${m.name}`}
                className="rounded-full bg-muted px-3 py-1.5 text-[13px] font-medium text-ink-soft"
              >
                {m.name}
                {m.count > 1 && <span className="ml-1 text-[11px] opacity-70">×{m.count}</span>}
              </span>
            ))}
          </div>
        </Section>
      )}

      {/* regions */}
      <Section title="다녀온 지역">
        <div className="flex flex-wrap gap-2">
          {stats.regions.map((r) => (
            <span
              key={r.name}
              className="rounded-full bg-sunset-wash px-3 py-1.5 text-[13px] font-medium text-sunset-ink"
            >
              {r.name}
              {r.count > 1 && <span className="ml-1 text-[11px] opacity-70">×{r.count}</span>}
            </span>
          ))}
        </div>
      </Section>

      {/* reactions received */}
      {reactionTotal > 0 && (
        <Section title="받은 반응">
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-[var(--radius-card)] border border-line bg-line">
            <Tile label="받은 좋아요" value={`♥ ${stats.likeTotal}`} />
            <Tile label="내 루트를 담은 사람" value={`${stats.copiesReceived}명`} />
          </div>
        </Section>
      )}

      {/* visited map */}
      {stats.points.length > 0 && (
        <section className="px-4 pb-10 pt-6">
          <h3 className="text-[14px] font-bold text-ink">내 여행 지도</h3>
          <p className="mb-3 mt-0.5 text-[12px] text-ink-faint">기록한 스팟 {stats.points.length}곳</p>
          <StatsMap points={stats.points} />
        </section>
      )}
    </>
  );
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="px-4 pt-6">
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="text-[14px] font-bold text-ink">{title}</h3>
        {subtitle && <span className="text-[11px] text-ink-faint">{subtitle}</span>}
      </div>
      {children}
    </section>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card px-4 py-3.5">
      <div className="text-[17px] font-black text-ink">{value}</div>
      <div className="mt-0.5 text-[12px] text-ink-faint">{label}</div>
    </div>
  );
}

function SummaryStat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-lg font-black text-ink">{value}</div>
      <div className="text-[12px] text-ink-faint">{label}</div>
    </div>
  );
}
