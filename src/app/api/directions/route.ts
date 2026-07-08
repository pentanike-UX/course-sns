import { getLegPath } from "@/lib/directions";
import { getAuthUser } from "@/lib/supabase/auth";
import type { TransportMode } from "@/lib/types";

const MAX_LEGS = 12;
const TRANSPORTS: ReadonlySet<string> = new Set([
  "walk",
  "bike",
  "car",
  "taxi",
  "bus",
  "subway",
  "train",
  "other",
]);

type DirectionLegInput = {
  from: { lat: number; lng: number };
  to: { lat: number; lng: number };
  transport: TransportMode;
};

/**
 * POST /api/directions
 *
 * Client maps cannot import the server-only directions helper because it uses
 * private API credentials. This endpoint bridges that gap and returns road
 * geometry for routable legs that were assembled on the client, such as feed
 * detail sheets and route draft previews.
 */
export async function POST(request: Request) {
  const user = await getAuthUser();
  if (!user) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }

  const rawLegs = Array.isArray((body as { legs?: unknown })?.legs)
    ? (body as { legs: unknown[] }).legs
    : null;
  if (!rawLegs) {
    return Response.json({ error: "legs must be an array" }, { status: 400 });
  }
  if (rawLegs.length > MAX_LEGS) {
    return Response.json({ error: `too many legs; max ${MAX_LEGS}` }, { status: 400 });
  }

  const legs: DirectionLegInput[] = [];
  for (const raw of rawLegs) {
    const leg = parseLeg(raw);
    if (!leg) {
      return Response.json({ error: "invalid leg" }, { status: 400 });
    }
    legs.push(leg);
  }

  const paths = await Promise.all(
    legs.map((leg) => getLegPath(leg.transport, leg.from, leg.to)),
  );

  return Response.json({ paths });
}

function parseLeg(raw: unknown): DirectionLegInput | null {
  const leg = raw as Partial<DirectionLegInput> | null;
  if (!leg || !isTransport(leg.transport)) return null;
  if (!isPoint(leg.from) || !isPoint(leg.to)) return null;
  return {
    from: { lat: leg.from.lat, lng: leg.from.lng },
    to: { lat: leg.to.lat, lng: leg.to.lng },
    transport: leg.transport,
  };
}

function isTransport(value: unknown): value is TransportMode {
  return typeof value === "string" && TRANSPORTS.has(value);
}

function isPoint(value: unknown): value is { lat: number; lng: number } {
  if (!value || typeof value !== "object") return false;
  const point = value as { lat?: unknown; lng?: unknown };
  return isCoordinate(point.lat, 90) && isCoordinate(point.lng, 180);
}

function isCoordinate(value: unknown, absMax: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= absMax;
}
