// Intercept disabled for soft /feed — 둘러보기 opens 내 일기 via
// FeedExplorer's client SlideDrawer (no route change, no skeleton flash).
// Hard navigation to /feed still renders the full page in `children`.
export default function FeedInterceptDisabled() {
  return null;
}
