import { notFound, redirect } from "next/navigation";
import RouteForm, { type RouteFormInitial } from "@/components/RouteForm";
import { getRoute, getCurrentProfile, getRouteCopyContext } from "@/lib/data";
import { isPlaceSearchEnabled } from "@/lib/places";
import type { Leg } from "@/lib/types";

export default async function EditRoutePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ followed?: string; draft?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const [route, me, copyContext] = await Promise.all([
    getRoute(id),
    getCurrentProfile(),
    getRouteCopyContext(id),
  ]);
  if (!me) redirect(`/login?next=/routes/${id}/edit`);
  if (!route) notFound();
  if (route.author.id !== me.id) notFound(); // owners only

  const legByFrom = new Map<string, Leg>();
  route.legs.forEach((l) => legByFrom.set(l.fromSpotId, l));

  const initial: RouteFormInitial = {
    title: route.title,
    region: route.region,
    theme: route.theme ?? "",
    mood: route.mood ?? "",
    recommendedFor: route.recommendedFor ?? "",
    bestSeason: route.bestSeason ?? "",
    difficulty: route.difficulty ?? "",
    estCost: route.estCostKrw != null ? String(route.estCostKrw) : "",
    visibility: route.visibility,
    spots: route.spots.map((s) => {
      const leg = legByFrom.get(s.id);
      return {
        title: s.title,
        address: s.address,
        lat: s.lat,
        lng: s.lng,
        body: s.body,
        photos: s.photos
          .filter((p) => p.storagePath)
          .map((p) => ({ preview: p.url, existingPath: p.storagePath as string })),
        legToNext: leg
          ? {
              transport: leg.transport,
              durationMin: leg.durationMin != null ? String(leg.durationMin) : "",
              caution: leg.caution ?? "",
            }
          : undefined,
      };
    }),
  };

  return (
    <RouteForm
      mode="edit"
      routeId={id}
      initial={initial}
      copyContext={copyContext}
      placeSearchEnabled={isPlaceSearchEnabled()}
      followedFromExplore={sp.followed === "1"}
      draftSaved={sp.draft === "1"}
    />
  );
}
