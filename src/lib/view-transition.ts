import * as React from "react";
import type { ComponentType, ReactNode } from "react";

/**
 * React's <ViewTransition> ships in the canary React that Next bundles for the
 * App Router (enabled via `experimental.viewTransition`), but @types/react
 * doesn't declare it and the *server* React runtime doesn't expose it. Resolve
 * it defensively: prefer the stable name, then the unstable one, and fall back
 * to a passthrough that just renders children (no morph, no crash) wherever the
 * component isn't available — so the effect is pure progressive enhancement.
 */
type ViewTransitionProps = {
  name?: string;
  share?: string;
  children?: ReactNode;
};

const R = React as unknown as {
  ViewTransition?: ComponentType<ViewTransitionProps>;
  unstable_ViewTransition?: ComponentType<ViewTransitionProps>;
};

const Passthrough = ({ children }: ViewTransitionProps) => children;

export const ViewTransition: ComponentType<ViewTransitionProps> =
  R.ViewTransition ?? R.unstable_ViewTransition ?? (Passthrough as ComponentType<ViewTransitionProps>);
