/**
 * routdiary core domain types.
 *
 * A user records a REGION as a diary entry = one Route.
 * A Route is an ordered list of Spots (places visited), with Legs describing
 * how you moved between consecutive spots. Route-level metadata captures the
 * "diary" framing: theme, mood, who it's for, when to go, expected cost.
 *
 * Phase 1: routes are private by default. Phase 2 flips `visibility` to public
 * and the social layer (likes/bookmarks/follows) is layered on top.
 */

export type Visibility = "private" | "public";
export type CopyPurpose = "plan" | "record";

export type TransportMode =
  | "walk"
  | "bus"
  | "subway"
  | "car"
  | "taxi"
  | "bike"
  | "train"
  | "other";

export const TRANSPORT_LABEL: Record<TransportMode, string> = {
  walk: "도보",
  bus: "버스",
  subway: "지하철",
  car: "자가용",
  taxi: "택시",
  bike: "자전거",
  train: "기차",
  other: "기타",
};

/** Per-mode accent color, shared by the route map lines and the timeline icons. */
export const TRANSPORT_COLOR: Record<TransportMode, string> = {
  walk: "#2f9e57",
  bike: "#0f9b8e",
  car: "#e8662a",
  taxi: "#eab308",
  bus: "#3b82f6",
  subway: "#7c3aed",
  train: "#64748b",
  other: "#9ca3af",
};

export interface Photo {
  id: string;
  url: string;
  /** raw storage object path (needed to re-reference on edit) */
  storagePath?: string;
  /** order within a spot's gallery */
  orderIndex: number;
  alt?: string;
}

export interface Spot {
  id: string;
  orderIndex: number;
  title: string;
  body: string;
  address: string;
  lat?: number;
  lng?: number;
  photos: Photo[];
}

/** Movement from one spot to the next (legs.length === spots.length - 1). */
export interface Leg {
  id: string;
  fromSpotId: string;
  toSpotId: string;
  transport: TransportMode;
  durationMin?: number;
  caution?: string;
}

export interface RouteAuthor {
  id: string;
  handle: string;
  displayName: string;
  avatarUrl?: string;
}

export interface Comment {
  id: string;
  body: string;
  createdAt: string; // ISO
  author: RouteAuthor;
}

export type NotificationType = "like" | "comment" | "follow";

export interface AppNotification {
  id: string;
  type: NotificationType;
  read: boolean;
  createdAt: string; // ISO
  actor: RouteAuthor;
  routeId?: string;
  routeTitle?: string;
}

export interface Route {
  id: string;
  author: RouteAuthor;
  title: string;
  region: string;
  theme?: string;
  mood?: string;
  /** who this route is recommended for */
  recommendedFor?: string;
  /** best time/season to visit */
  bestSeason?: string;
  /** walking/movement intensity key: "easy" | "normal" | "hard" */
  difficulty?: string;
  /** rough expected cost, in KRW */
  estCostKrw?: number;
  visibility: Visibility;
  coverPhotoUrl?: string;
  spots: Spot[];
  legs: Leg[];
  createdAt: string; // ISO
  /** social counters (phase 2) */
  likeCount: number;
  bookmarkCount: number;
  commentCount: number;
  /** how many people have "따라가기"-copied this course */
  copyCount: number;
  liked?: boolean;
  bookmarked?: boolean;
}

export type RouteThumbnailPoint = {
  title: string;
  lat: number;
  lng: number;
  orderIndex: number;
};

/** Compact shape for list/feed cards. */
export interface RouteSummary {
  id: string;
  author: RouteAuthor;
  title: string;
  region: string;
  theme?: string;
  mood?: string;
  /** who this course is recommended for (comma-joined) — used by explore facet */
  recommendedFor?: string;
  /** walking/movement intensity key: "easy" | "normal" | "hard" */
  difficulty?: string;
  coverPhotoUrl?: string;
  spotCount: number;
  visibility: Visibility;
  createdAt: string;
  likeCount: number;
  /** how many people have "따라가기"-copied this course */
  copyCount: number;
  liked?: boolean;
  copyPurpose?: CopyPurpose;
  thumbnailPoints?: RouteThumbnailPoint[];
}
