import RouteMap, { type MapSpot, type MapLeg } from "@/components/RouteMap";
import { getLegPath } from "@/lib/directions";
import type { Leg, Route } from "@/lib/types";

/**
 * The "지도에서 보기" section. Kept as its own async server component so the
 * external driving-directions lookup streams in via <Suspense> instead of
 * blocking the rest of the route detail on first load.
 */
export default async function RouteMapSection({ route }: { route: Route }) {
  const located = route.spots.filter(
    (s) => typeof s.lat === "number" && typeof s.lng === "number",
  );
  if (located.length === 0) return null;

  const legByFrom = new Map<string, Leg>();
  route.legs.forEach((l) => legByFrom.set(l.fromSpotId, l));

  const mapSpots: MapSpot[] = located.map((s) => ({
    title: s.title,
    lat: s.lat as number,
    lng: s.lng as number,
    label: s.orderIndex + 1,
    address: s.address,
    body: s.body,
    photos: s.photos,
  }));

  // Road-based modes (car/taxi/bus/train) are snapped to real roads via the
  // directions API (driving snapped to roads; walk/bike via TMAP pedestrian);
  // subway/other draw as straight connectors.
  const mapLegs: MapLeg[] = await Promise.all(
    located.slice(0, -1).map(async (a, i) => {
      const b = located[i + 1];
      const leg = legByFrom.get(a.id);
      const transport = leg?.transport ?? "other";
      const from = { lat: a.lat as number, lng: a.lng as number };
      const to = { lat: b.lat as number, lng: b.lng as number };
      const path = (await getLegPath(transport, from, to)) ?? undefined;
      return { from, to, transport, path, durationMin: leg?.durationMin };
    }),
  );

  return (
    <section className="px-4 pt-6">
      <h2 className="mb-3 text-[16px] font-bold text-ink">지도에서 보기</h2>
      <RouteMap spots={mapSpots} legs={mapLegs} />
    </section>
  );
}
