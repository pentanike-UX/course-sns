// Intercept disabled for soft /profile — 둘러보기 opens profile via
// FeedExplorer's client SlideDrawer (no route change, no skeleton flash).
// Hard navigation to /profile still renders the full page in `children`.
export default function ProfileInterceptDisabled() {
  return null;
}
