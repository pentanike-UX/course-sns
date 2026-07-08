import { HomeRoutePanelSkeleton } from "@/components/RouteCardSkeleton";

/**
 * Lightweight stand-in for an off-screen pager neighbour. It mirrors the card
 * rhythm closely enough that swipes do not feel like a layout jump.
 */
export default function PanelSkeleton() {
  return <HomeRoutePanelSkeleton count={2} />;
}
