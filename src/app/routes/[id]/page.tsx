import { notFound } from "next/navigation";
import { Suspense } from "react";
import MobileFrame from "@/components/MobileFrame";
import SaveNotice from "@/components/SaveNotice";
import type { Metadata, Viewport } from "next";
import {
  getRoute,
  getCurrentProfile,
  getRouteMeta,
  getRouteCopyContext,
  getViewerCompletionState,
} from "@/lib/data";
import RouteView from "./RouteView";
import RouteMapSection from "./RouteMapSection";
import RouteCommentsSection, { RouteCommentsFallback } from "./RouteCommentsSection";
import RouteCopyLineageSection, {
  RouteCopyLineageFallback,
} from "./RouteCopyLineageSection";
import RouteCompletionsSection, {
  RouteCompletionsFallback,
} from "./RouteCompletionsSection";

export const viewport: Viewport = {
  themeColor: "#101815",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const r = await getRouteMeta(id);
  if (!r) return { title: "코스" };

  const description = [r.region, r.theme, r.mood].filter(Boolean).join(" · ") || "코스 기록";
  const images = r.coverPhotoUrl ? [r.coverPhotoUrl] : undefined;
  return {
    title: `${r.title} · 코스`,
    description,
    openGraph: { title: r.title, description, type: "article", images },
    twitter: {
      card: images ? "summary_large_image" : "summary",
      title: r.title,
      description,
      images,
    },
  };
}

export default async function RouteDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; saved?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;
  const noticeKind = sp.created === "1" ? "created" : sp.saved === "1" ? "saved" : null;
  const [route, me, copyContext, viewerCompletion] = await Promise.all([
    getRoute(id),
    getCurrentProfile(),
    getRouteCopyContext(id),
    getViewerCompletionState(id),
  ]);
  if (!route) notFound();
  const isOwner = !!me && me.id === route.author.id;

  return (
    <MobileFrame shell immersive>
      <SaveNotice kind={noticeKind} />
      <main className="no-scrollbar min-h-0 flex-1 overflow-y-auto pb-10">
        <RouteView
          route={route}
          isOwner={isOwner}
          copyContext={copyContext}
          viewerCompletion={viewerCompletion}
          lineageSlot={
            isOwner ? (
              <Suspense fallback={<RouteCopyLineageFallback />}>
                <RouteCopyLineageSection routeId={route.id} />
              </Suspense>
            ) : null
          }
          mapSlot={
            <Suspense fallback={<div className="mx-4 mt-6 h-52 animate-pulse rounded-[var(--radius-card)] bg-line" />}>
              <RouteMapSection route={route} />
            </Suspense>
          }
        />

        {route.visibility === "public" && route.completionCount > 0 && (
          <Suspense fallback={<RouteCompletionsFallback />}>
            <RouteCompletionsSection
              routeId={route.id}
              completionCount={route.completionCount}
              completionRatingAvg={route.completionRatingAvg}
            />
          </Suspense>
        )}

        <Suspense fallback={<RouteCommentsFallback commentCount={route.commentCount} />}>
          <RouteCommentsSection
            routeId={route.id}
            commentCount={route.commentCount}
            me={me}
            isOwner={isOwner}
          />
        </Suspense>
      </main>
    </MobileFrame>
  );
}
