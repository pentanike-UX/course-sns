// Close the drawer when navigating (client-side) to any route that isn't an
// intercepted drawer route, so a stale overlay never lingers.
export default function CatchAll() {
  return null;
}
