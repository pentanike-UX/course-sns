"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  rectSortingStrategy,
  useSortable,
  arrayMove,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import MobileFrame from "@/components/MobileFrame";
import AppHeader from "@/components/AppHeader";
import ActionBottomSheet from "@/components/ActionBottomSheet";
import GlassCircle from "@/components/GlassCircle";
import SpotLocationPicker from "@/components/SpotLocationPicker";
import RouteMap, { type MapLeg, type MapSpot } from "@/components/RouteMap";
import RoutePlanThumbnail from "@/components/RoutePlanThumbnail";
import { createClient } from "@/lib/supabase/client";
import { readPhotoGeo } from "@/lib/exif";
import { compressImage, mapWithConcurrency } from "@/lib/image";
import { loadNaverMaps, NAVER_MAP_KEY, reverseGeocodeDetail } from "@/lib/naver";
import ChipSheet from "@/components/ChipSheet";
import MoodSheet from "@/components/MoodSheet";
import { THEME_OPTIONS, RECOMMEND_OPTIONS, DIFFICULTY_OPTIONS, moodByLabel } from "@/lib/meta-options";
import { createRoute, updateRoute, signPhotoUploads } from "@/app/routes/new/actions";
import { convertPlanDraftToRecord } from "@/app/routes/[id]/actions";
import type { RouteCopyContext } from "@/lib/data";
import {
  TRANSPORT_LABEL,
  type RouteThumbnailPoint,
  type TransportMode,
  type Visibility,
} from "@/lib/types";
import { haversineMeters, formatDistance } from "@/lib/geo";
import { hasInAppHistory } from "@/lib/nav-history";

type DraftLeg = { transport: TransportMode; durationMin: string; caution: string };

/** A photo is either a freshly picked File or one already stored (existingPath). */
type DraftPhoto = {
  key: string;
  preview: string;
  file?: File;
  existingPath?: string;
};

type DraftSpot = {
  key: string;
  title: string;
  address: string;
  lat?: number;
  lng?: number;
  /** location came from a photo's GPS EXIF */
  fromPhoto?: boolean;
  body: string;
  photos: DraftPhoto[];
  legToNext: DraftLeg;
};

type PlaceHit = {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
};

export type RouteFormInitial = {
  title: string;
  region: string;
  theme: string;
  mood: string;
  recommendedFor: string;
  bestSeason: string;
  difficulty: string;
  estCost: string;
  visibility: Visibility;
  spots: {
    title: string;
    address: string;
    lat?: number;
    lng?: number;
    body: string;
    photos: { preview: string; existingPath: string }[];
    legToNext?: { transport: TransportMode; durationMin: string; caution: string };
  }[];
};

type Props = (
  | {
      mode: "create";
      routeId?: undefined;
      initial?: undefined;
      defaultVisibility?: Visibility;
      intent?: "record" | "plan";
    }
  | {
      mode: "edit";
      routeId: string;
      initial: RouteFormInitial;
      defaultVisibility?: undefined;
      intent?: undefined;
    }
) & {
  /** Whether the keyword place-search proxy is configured (server-checked). */
  placeSearchEnabled?: boolean;
  /** Present when this edit draft was created from another public route. */
  copyContext?: RouteCopyContext | null;
};

const emptyLeg = (): DraftLeg => ({ transport: "walk", durationMin: "", caution: "" });

const emptySpot = (): DraftSpot => ({
  key: crypto.randomUUID(),
  title: "",
  address: "",
  body: "",
  photos: [],
  legToNext: emptyLeg(),
});

const draftPhotoFromFile = (file: File): DraftPhoto => ({
  key: crypto.randomUUID(),
  file,
  preview: URL.createObjectURL(file),
});

/**
 * Full-viewport frame for the map planner. Unlike MobileFrame (min-h-dvh, lets
 * the page scroll), this is a fixed flex column: the header takes its natural
 * height and the body fills the rest via flex-1 — so we never hardcode
 * "100dvh − header", which mis-measures because iOS/Android disagree on whether
 * 100dvh includes the top safe-area. The planner's bottom sheet then sits at the
 * real viewport bottom (no overflow clipping, no leftover gap under the map).
 *
 * Anchored with top-0 + bottom-0 (not h-dvh): a fixed `h-dvh` element can stop
 * short of the real bottom when the browser's layout viewport disagrees with the
 * dynamic viewport, leaving an empty strip under the sheet. Pinning both edges
 * makes the height definite AND flush to the true bottom on every device.
 */
function PlannerFrame({ header, children }: { header: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-0 top-0 z-40 mx-auto flex w-full max-w-[430px] flex-col overflow-hidden bg-paper shadow-[0_0_60px_rgba(0,0,0,0.08)]">
      {header}
      {children}
    </div>
  );
}

function initialToSpots(initial?: RouteFormInitial): DraftSpot[] {
  if (!initial || initial.spots.length === 0) return [emptySpot()];
  return initial.spots.map((s) => ({
    key: crypto.randomUUID(),
    title: s.title,
    address: s.address,
    lat: s.lat,
    lng: s.lng,
    body: s.body,
    photos: s.photos.map((p) => ({
      key: crypto.randomUUID(),
      preview: p.preview,
      existingPath: p.existingPath,
    })),
    legToNext: s.legToNext ?? emptyLeg(),
  }));
}

function draftSpotsToThumbnailPoints(spots: DraftSpot[]): RouteThumbnailPoint[] {
  return spots
    .map((spot, index) => ({ spot, index }))
    .filter(({ spot }) => typeof spot.lat === "number" && typeof spot.lng === "number")
    .map(({ spot, index }) => ({
      title: spot.title || `스팟 ${index + 1}`,
      lat: spot.lat as number,
      lng: spot.lng as number,
      orderIndex: index,
    }));
}

const STEP_LABELS = ["사진", "장소", "이동", "이야기", "공개"];

// Edit mode mirrors the wizard's section order on one scrollable page.
// 사진(photo ingest) is create-only — in edit, photos live inside each spot
// card, so it folds into 장소.
const EDIT_SECTIONS = [
  { id: "place", label: "장소" },
  { id: "move", label: "이동" },
  { id: "story", label: "이야기" },
  { id: "share", label: "공개" },
] as const;

const PLAN_EDIT_SECTIONS = [
  { id: "map", label: "지도" },
  ...EDIT_SECTIONS,
] as const;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DragHandle = { attributes: any; listeners: any };

export default function RouteForm({
  mode,
  routeId,
  initial,
  defaultVisibility,
  intent = "record",
  placeSearchEnabled,
  copyContext,
}: Props) {
  const router = useRouter();
  const isEdit = mode === "edit";
  const isPlanDraft = intent === "plan" || copyContext?.purpose === "plan";
  const isDirectPlanCreate = !isEdit && intent === "plan";
  const editSections = isPlanDraft ? PLAN_EDIT_SECTIONS : EDIT_SECTIONS;
  const selfPath = isEdit
    ? `/routes/${routeId}/edit`
    : isDirectPlanCreate
      ? "/routes/new?type=plan"
      : "/routes/new";

  const [title, setTitle] = useState(initial?.title ?? "");
  const [region, setRegion] = useState(initial?.region ?? "");
  const [theme, setTheme] = useState(initial?.theme ?? "");
  const [mood, setMood] = useState(initial?.mood ?? "");
  const [recommendedFor, setRecommendedFor] = useState(initial?.recommendedFor ?? "");
  const [bestSeason, setBestSeason] = useState(initial?.bestSeason ?? "");
  const [difficulty, setDifficulty] = useState(initial?.difficulty ?? "");
  const [estCost, setEstCost] = useState(initial?.estCost ?? "");
  const [visibility, setVisibility] = useState<Visibility>(
    initial?.visibility ?? defaultVisibility ?? "private",
  );

  const [spots, setSpots] = useState<DraftSpot[]>(() =>
    isDirectPlanCreate ? [] : initialToSpots(initial),
  );
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [convertingRecord, setConvertingRecord] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [bulkNote, setBulkNote] = useState<string | null>(null);
  const [sheet, setSheet] = useState<"theme" | "mood" | "recommend" | null>(null);
  const [step, setStep] = useState(1); // wizard step (create mode)
  const [confirmExit, setConfirmExit] = useState(false); // "저장 안 하고 나가기?" sheet

  // edit-mode section-jump nav (single page, scrollspy). MobileFrame is
  // min-h-dvh, so the document (viewport) scrolls — observe against it (root:null).
  const sectionEls = useRef<Record<string, HTMLElement | null>>({});
  const [activeSection, setActiveSection] = useState<string>(editSections[0].id);

  useEffect(() => {
    if (!isEdit) return;
    // Active = the last section whose top has passed just under the pinned nav.
    // A scroll scan (vs IntersectionObserver) stays correct on short pages where
    // trailing sections can't reach the very top before the page bottoms out.
    const onScroll = () => {
      const line = 80; // px below the viewport top (just under the pinned nav)
      const doc = document.documentElement;
      if (window.innerHeight + window.scrollY >= doc.scrollHeight - 2) {
        setActiveSection(editSections[editSections.length - 1].id);
        return;
      }
      let current: string = editSections[0].id;
      for (const s of editSections) {
        const el = sectionEls.current[s.id];
        if (el && el.getBoundingClientRect().top <= line) current = s.id;
      }
      setActiveSection(current);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [editSections, isEdit]);

  const jumpToSection = (id: string) =>
    sectionEls.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" });

  const splitCsv = (s: string) => s.split(",").map((x) => x.trim()).filter(Boolean);
  const moodLevel = moodByLabel(mood);
  const moodDisplay = mood ? (moodLevel ? `${moodLevel.emoji} ${moodLevel.label}` : mood) : "";

  const updateSpot = (key: string, patch: Partial<DraftSpot>) =>
    setSpots((prev) => prev.map((s) => (s.key === key ? { ...s, ...patch } : s)));

  const updateLeg = (key: string, patch: Partial<DraftLeg>) =>
    setSpots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, legToNext: { ...s.legToNext, ...patch } } : s)),
    );

  const addPhotos = (key: string, files: FileList | null) => {
    if (!files) return;
    const list = Array.from(files);
    const added = list.map(draftPhotoFromFile);
    setSpots((prev) =>
      prev.map((s) => (s.key === key ? { ...s, photos: [...s.photos, ...added] } : s)),
    );
    void autofillFromPhotos(key, list);
  };

  const handleSpotPhotoInput = (key: string, e: ChangeEvent<HTMLInputElement>) => {
    addPhotos(key, e.currentTarget.files);
    e.currentTarget.value = "";
  };

  const handleBulkPhotoInput = (e: ChangeEvent<HTMLInputElement>) => {
    void buildFromPhotos(e.currentTarget.files);
    e.currentTarget.value = "";
  };

  const setVisitFromTime = (takenAt: number) =>
    setBestSeason((prev) => prev || formatVisit(takenAt));

  const autofillFromPhotos = async (key: string, files: File[]) => {
    const geos = await Promise.all(files.map(readPhotoGeo));
    const minT = Math.min(...geos.map((g) => g.takenAt));
    if (Number.isFinite(minT)) setVisitFromTime(minT);

    const g = geos.find((x) => typeof x.lat === "number" && typeof x.lng === "number");
    if (!g) return;
    await loadNaverMaps().catch(() => {});
    const detail = await reverseGeocodeDetail(g.lat!, g.lng!);
    const r = deriveRegion([{ area1: detail.area1, area2: detail.area2 }]);
    if (r) setRegion((prev) => prev || r);
    setSpots((prev) =>
      prev.map((s) => {
        if (s.key !== key || typeof s.lat === "number") return s; // don't override
        return {
          ...s,
          lat: g.lat,
          lng: g.lng,
          fromPhoto: true,
          ...(detail.place && !s.title.trim() ? { title: detail.place } : {}),
          ...(detail.address && !s.address.trim() ? { address: detail.address } : {}),
        };
      }),
    );
  };

  const removePhoto = (spotKey: string, photoKey: string) =>
    setSpots((prev) =>
      prev.map((s) =>
        s.key === spotKey ? { ...s, photos: s.photos.filter((p) => p.key !== photoKey) } : s,
      ),
    );

  // Reorder photos within a single spot (drag). The route cover is the very
  // first photo of the first spot that has any, so dragging a photo to the
  // front of spot #1 also makes it the "대표" cover.
  const reorderPhotos = (spotKey: string, fromKey: string, toKey: string) =>
    setSpots((prev) =>
      prev.map((s) => {
        if (s.key !== spotKey) return s;
        const from = s.photos.findIndex((p) => p.key === fromKey);
        const to = s.photos.findIndex((p) => p.key === toKey);
        return from === -1 || to === -1 ? s : { ...s, photos: arrayMove(s.photos, from, to) };
      }),
    );

  // Bulk: build spots automatically from a batch of geotagged photos.
  const buildFromPhotos = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list = Array.from(files);
    // One DraftPhoto per file, shared by the instant preview and any spots we
    // build below (so we don't create a second object URL for the same blob).
    const draftFor = new Map<File, DraftPhoto>(list.map((f) => [f, draftPhotoFromFile(f)]));

    // Show the photos right away. Selecting must always give visible feedback —
    // previously we only added them after reading every photo's EXIF, so on a
    // large Android/HEIF batch (slow or memory-heavy to parse) the picker looked
    // like it did nothing. Read metadata afterward.
    setSpots((prev) => {
      const base = prev.length ? prev : [emptySpot()];
      return base.map((spot, index) =>
        index === 0
          ? { ...spot, photos: [...spot.photos, ...list.map((f) => draftFor.get(f)!)] }
          : spot,
      );
    });

    setBulkBusy(true);
    setBulkNote(null);
    try {
      // Bounded concurrency: decoding many large photos at once can OOM a mobile tab.
      const read = await mapWithConcurrency(list, 4, async (f) => ({
        file: f,
        ...(await readPhotoGeo(f)),
      }));
      const minT = Math.min(...read.map((r) => r.takenAt));
      if (Number.isFinite(minT)) setBestSeason((prev) => prev || formatVisit(minT));

      const geo = read
        .filter((r) => typeof r.lat === "number" && typeof r.lng === "number")
        .sort((a, b) => a.takenAt - b.takenAt);
      const noGeo = read.filter((r) => typeof r.lat !== "number");

      if (geo.length === 0) {
        // The photos are already on the first spot — just explain the manual step.
        setBulkNote(
          `사진 ${list.length}장을 추가했어요. 위치 정보가 없어 다음 단계에서 장소를 직접 지정해 주세요.`,
        );
        return;
      }

      type Cluster = { lat: number; lng: number; t: number; files: File[] };
      const clusters: Cluster[] = [];
      for (const r of geo) {
        const last = clusters[clusters.length - 1];
        if (last && distMeters(last, { lat: r.lat!, lng: r.lng! }) < 120) {
          last.files.push(r.file);
        } else {
          clusters.push({ lat: r.lat!, lng: r.lng!, t: r.takenAt, files: [r.file] });
        }
      }

      for (const r of noGeo) {
        let best = clusters[0];
        let bestGap = Infinity;
        for (const c of clusters) {
          const gap = Math.abs(c.t - r.takenAt);
          if (gap < bestGap) {
            bestGap = gap;
            best = c;
          }
        }
        best?.files.push(r.file);
      }

      await loadNaverMaps().catch(() => {});
      const built: DraftSpot[] = [];
      const regionParts: { area1?: string; area2?: string }[] = [];
      for (const c of clusters) {
        const detail = await reverseGeocodeDetail(c.lat, c.lng);
        regionParts.push({ area1: detail.area1, area2: detail.area2 });
        built.push({
          key: crypto.randomUUID(),
          // building/landmark name when available, else fall back to the
          // 시·군·구 (or 시·도) so a located spot is never left title-less
          title: detail.place || detail.area2 || detail.area1 || "",
          address: detail.address ?? "",
          lat: c.lat,
          lng: c.lng,
          fromPhoto: true,
          body: "",
          photos: c.files.map((f) => draftFor.get(f)!),
          legToNext: emptyLeg(),
        });
      }

      setSpots(built);
      const r = deriveRegion(regionParts);
      if (r) setRegion((prev) => prev || r);
      const skipped = noGeo.length;
      setBulkNote(
        `사진 ${list.length}장에서 스팟 ${built.length}곳을 만들었어요.` +
          (skipped ? ` (위치 없는 ${skipped}장은 가까운 스팟에 묶었어요)` : ""),
      );
    } finally {
      setBulkBusy(false);
    }
  };

  const addSpot = () => setSpots((prev) => [...prev, emptySpot()]);
  const addSpotFromPlace = (place: PlaceHit) => {
    const key = crypto.randomUUID();
    const added: DraftSpot = {
      key,
      title: place.name,
      address: place.address,
      lat: place.lat,
      lng: place.lng,
      fromPhoto: false,
      body: "",
      photos: [],
      legToNext: emptyLeg(),
    };
    setSpots((prev) => {
      const first = prev[0];
      const firstIsBlank =
        prev.length === 1 &&
        first &&
        !first.title.trim() &&
        !first.address.trim() &&
        !first.body.trim() &&
        first.photos.length === 0 &&
        !hasCoords(first);
      return firstIsBlank ? [added] : [...prev, added];
    });
    void reverseGeocodeDetail(place.lat, place.lng).then((detail) => {
      const r = deriveRegion([{ area1: detail.area1, area2: detail.area2 }]);
      if (r) setRegion((prev) => prev || r);
      // First place anchors the plan: tentatively fill the title from its city
      // (e.g. 강릉시 → "강릉 여행 계획") so the plan reads as a plan, not a form.
      const short = shortRegionName(detail.area2 ?? detail.area1);
      if (short) setTitle((prev) => prev || `${short} 여행 계획`);
    });
    return key;
  };
  const removeSpot = (key: string) =>
    setSpots((prev) => (prev.length > 1 ? prev.filter((s) => s.key !== key) : prev));
  const moveSpot = (key: string, delta: -1 | 1) =>
    setSpots((prev) => {
      const from = prev.findIndex((s) => s.key === key);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= prev.length) return prev;
      return arrayMove(prev, from, to);
    });
  const optimizeSpotOrder = () =>
    setSpots((prev) => optimizeByNearestNeighbor(prev));
  const fillEstimatedDurations = () =>
    setSpots((prev) =>
      prev.map((spot, index) => {
        const next = prev[index + 1];
        if (!next || spot.legToNext.durationMin.trim()) return spot;
        const estimated = estimateLegMinutes(spot, next, spot.legToNext.transport);
        if (!estimated) return spot;
        return {
          ...spot,
          legToNext: { ...spot.legToNext, durationMin: String(estimated) },
        };
      }),
    );

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) {
      setSpots((prev) => {
        const from = prev.findIndex((s) => s.key === active.id);
        const to = prev.findIndex((s) => s.key === over.id);
        return from === -1 || to === -1 ? prev : arrayMove(prev, from, to);
      });
    }
  };

  // Photo reorder uses a press-and-hold (delay) activation instead of distance:
  // a quick swipe still scrolls the page, but holding a thumbnail picks it up to
  // drag. This keeps vertical scrolling usable even though each photo is itself
  // draggable (no dedicated handle on the small 80px tiles).
  const photoSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 180, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
  const onPhotoDragEnd = (spotKey: string, e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) reorderPhotos(spotKey, String(active.id), String(over.id));
  };

  // The cover ("대표") photo = the first photo of the first spot that has any,
  // mirroring `spotPhotoPaths.flat()[0]` used when saving.
  const coverPhotoKey = useMemo(() => {
    for (const s of spots) {
      if (s.photos.length > 0) return s.photos[0].key;
    }
    return null;
  }, [spots]);

  const spotsValid = spots.some((s) => s.title.trim());
  const canSave = title.trim() && region.trim() && spotsValid;
  const allPhotos = spots.flatMap((s) => s.photos);
  const draftMap = useMemo(() => buildDraftRouteMap(spots), [spots]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    // Tell the user exactly what's missing instead of silently doing nothing.
    if (!title.trim() || !region.trim()) {
      setSaveError("제목과 지역을 입력해 주세요. ‘제목과 일정’ 단계에서 채울 수 있어요.");
      return;
    }
    if (!spotsValid) {
      setSaveError("스팟을 한 곳 이상 추가해 주세요.");
      return;
    }
    setSaving(true);
    setSaveError(null);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(selfPath)}`);
        return;
      }

      const routeUid = routeId ?? crypto.randomUUID();

      const picked = spots.flatMap((s, i) =>
        s.photos
          .filter((p) => p.file)
          .map((p) => ({ spotIndex: i, key: p.key, file: p.file! })),
      );
      // downscale/re-encode before signing so the path ext matches the payload
      // (EXIF was already read from the originals at selection time)
      const uploads = await mapWithConcurrency(picked, 3, async (u) => {
        const file = await compressImage(u.file);
        return { ...u, file, ext: file.name.split(".").pop() ?? "jpg" };
      });

      const pathByKey = new Map<string, string>();
      if (uploads.length) {
        const { signed, error } = await signPhotoUploads(
          routeUid,
          uploads.map(({ spotIndex, key, ext }) => ({ spotIndex, key, ext })),
        );
        if (error || !signed) {
          setSaveError(error ?? "사진 업로드 준비에 실패했어요.");
          setSaving(false);
          return;
        }
        for (const s of signed) {
          const file = uploads.find((u) => u.key === s.key)!.file;
          const { error: upErr } = await supabase.storage
            .from("route-photos")
            .uploadToSignedUrl(s.path, s.token, file, { upsert: true });
          if (upErr) throw upErr;
          pathByKey.set(s.key, s.path);
        }
      }

      const spotPhotoPaths = spots.map((s) =>
        s.photos
          .map((p) => (p.file ? pathByKey.get(p.key) : p.existingPath))
          .filter((p): p is string => !!p),
      );
      const coverPath = spotPhotoPaths.flat()[0];

      const payload = {
        title: title.trim(),
        region: region.trim(),
        theme: theme.trim() || undefined,
        mood: mood.trim() || undefined,
        recommendedFor: recommendedFor.trim() || undefined,
        bestSeason: bestSeason.trim() || undefined,
        difficulty: difficulty || undefined,
        estCostKrw: estCost ? Number(estCost.replace(/[^0-9]/g, "")) : undefined,
        visibility,
        coverPath,
        copyPurpose: isDirectPlanCreate ? ("plan" as const) : undefined,
        spots: spots.map((s, i) => ({
          title: s.title.trim(),
          body: s.body.trim(),
          address: s.address.trim(),
          lat: s.lat,
          lng: s.lng,
          photoPaths: spotPhotoPaths[i],
        })),
        legs: spots.slice(0, -1).map((s, i) => ({
          fromIndex: i,
          toIndex: i + 1,
          transport: s.legToNext.transport,
          durationMin: s.legToNext.durationMin ? Number(s.legToNext.durationMin) : undefined,
          caution: s.legToNext.caution.trim() || undefined,
        })),
      };

      const result = isEdit
        ? await updateRoute({ id: routeId, ...payload })
        : await createRoute(payload);

      if (result?.error) {
        setSaveError(result.error);
        setSaving(false);
      }
    } catch {
      setSaveError("저장 중 문제가 발생했어요. 다시 시도해 주세요.");
      setSaving(false);
    }
  };

  const handleConvertToRecord = async () => {
    if (!routeId || convertingRecord) return;
    setConvertingRecord(true);
    setConvertError(null);
    const res = await convertPlanDraftToRecord(routeId);
    if (res?.error) {
      setConvertError(res.error);
      setConvertingRecord(false);
      return;
    }
    router.refresh();
  };

  // ── unsaved-changes guard (plan planner) ──────────────────────────────
  // Snapshot the editable state and diff against what we mounted with, so
  // 뒤로가기 can warn before discarding. useState(initial) captures the first
  // render's snapshot once (no ref read during render).
  const formSnapshot = JSON.stringify({
    title,
    region,
    theme,
    mood,
    recommendedFor,
    bestSeason,
    difficulty,
    estCost,
    visibility,
    spots: spots.map((s) => ({
      title: s.title,
      address: s.address,
      lat: s.lat,
      lng: s.lng,
      body: s.body,
      photos: s.photos.map((p) => p.existingPath ?? `f:${p.key}`),
      leg: [s.legToNext.transport, s.legToNext.durationMin, s.legToNext.caution],
    })),
  });
  const [initialSnapshot] = useState(formSnapshot);
  const isDirty = formSnapshot !== initialSnapshot;

  const planBackHref = isDirectPlanCreate ? "/feed?tab=plan" : `/routes/${routeId}`;
  const leavePlanner = () => {
    setConfirmExit(false);
    if (hasInAppHistory()) router.back();
    else router.replace(planBackHref);
  };
  const requestExitPlanner = () => {
    if (isDirty) setConfirmExit(true);
    else leavePlanner();
  };

  // Planner header controls: a close (X) that confirms when there are unsaved
  // edits, and a 임시저장 that submits the form (saves the draft).
  const plannerCloseButton = (
    <button
      type="button"
      onClick={requestExitPlanner}
      aria-label="닫기"
      className="flex h-11 w-11 items-center justify-center"
    >
      <GlassCircle>
        <CloseIcon />
      </GlassCircle>
    </button>
  );
  const tempSaveButton = (
    <button
      form="route-form"
      type="submit"
      disabled={saving}
      className="rounded-full bg-sunset px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
    >
      {saving ? "저장 중…" : "임시저장"}
    </button>
  );
  const exitConfirmSheet = (
    <ActionBottomSheet
      open={confirmExit}
      title="저장하지 않고 나가시겠습니까?"
      description="변경한 내용이 저장되지 않아요. 상단의 ‘임시저장’으로 보관할 수 있어요."
      primaryLabel="나가기"
      primaryTone="danger"
      onPrimary={leavePlanner}
      secondaryLabel="계속 편집"
      onClose={() => setConfirmExit(false)}
      ariaLabel="저장하지 않고 나가기 확인"
    />
  );

  // ── shared render pieces ──────────────────────────────────────────────

  const spotCard = (spot: DraftSpot, idx: number, handle: DragHandle) => (
    <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="flex items-center gap-2 text-[14px] font-bold text-ink">
          <button
            type="button"
            {...handle.attributes}
            {...handle.listeners}
            aria-label="순서 변경 (드래그)"
            className="-ml-1 cursor-grab touch-none p-1 text-ink-faint active:cursor-grabbing"
          >
            <DragIcon />
          </button>
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sunset text-[12px] text-white">
            {idx + 1}
          </span>
          스팟 {idx + 1}
        </span>
        {spots.length > 1 && (
          <button type="button" onClick={() => removeSpot(spot.key)} className="text-[12px] text-ink-faint">
            삭제
          </button>
        )}
      </div>

      <Field
        label="장소 이름"
        value={spot.title}
        onChange={(v) => updateSpot(spot.key, { title: v })}
        placeholder="예: 세화 해변"
      />
      <Field
        label="주소"
        value={spot.address}
        onChange={(v) => updateSpot(spot.key, { address: v })}
        placeholder="지도를 탭하면 자동으로 채워져요"
      />

      <label className="mb-1.5 block text-[12px] font-medium text-ink-soft">
        위치
        {typeof spot.lat === "number" && (
          <span className="ml-1.5 font-normal text-leaf">
            {spot.fromPhoto ? "· 사진에서 자동 지정됨" : "· 지정됨"}
          </span>
        )}
      </label>
      <SpotLocationPicker
        lat={spot.lat}
        lng={spot.lng}
        searchEnabled={placeSearchEnabled}
        onPick={({ lat, lng, address, place }) =>
          updateSpot(spot.key, {
            lat,
            lng,
            fromPhoto: false,
            // explicit search pick: its address is authoritative; a typed-in
            // title is still respected, map taps keep the fill-if-empty rule
            ...(place && !spot.title.trim() ? { title: place } : {}),
            ...(address && (place || !spot.address.trim()) ? { address } : {}),
          })
        }
      />

      {!isPlanDraft && (
        <>
          <label className="mb-1.5 mt-3 flex items-center gap-1.5 text-[12px] font-medium text-ink-soft">
            사진
            {spot.photos.length > 1 && (
              <span className="font-normal text-ink-faint">· 길게 눌러 순서 변경</span>
            )}
          </label>
          <DndContext
            id={`photos-${spot.key}`}
            sensors={photoSensors}
            collisionDetection={closestCenter}
            onDragEnd={(e) => onPhotoDragEnd(spot.key, e)}
          >
            <SortableContext items={spot.photos.map((p) => p.key)} strategy={rectSortingStrategy}>
              <div className="flex flex-wrap gap-2">
                {spot.photos.map((ph) => (
                  <SortablePhoto
                    key={ph.key}
                    id={ph.key}
                    preview={ph.preview}
                    isCover={ph.key === coverPhotoKey}
                    onRemove={() => removePhoto(spot.key, ph.key)}
                  />
                ))}
                <label className="relative flex h-20 w-20 cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed border-line text-ink-faint">
                  <span className="text-xl leading-none">＋</span>
                  <span className="text-[11px]">사진</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    aria-label={`스팟 ${idx + 1} 사진 추가`}
                    className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                    onChange={(e) => handleSpotPhotoInput(spot.key, e)}
                  />
                </label>
              </div>
            </SortableContext>
          </DndContext>
        </>
      )}

      <label className="mb-1.5 mt-3 block text-[12px] font-medium text-ink-soft">
        {isPlanDraft ? "계획 메모" : "기록"}
      </label>
      <textarea
        value={spot.body}
        onChange={(e) => updateSpot(spot.key, { body: e.target.value })}
        placeholder={isPlanDraft ? "예약 시간, 영업시간, 꼭 확인할 것을 적어보세요." : "이곳에서의 순간을 코스 메모처럼 적어보세요."}
        rows={3}
        className="w-full resize-none rounded-xl border border-line bg-paper px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
      />
    </div>
  );

  const legFields = (spot: DraftSpot) => (
    <div className="rounded-xl bg-card p-3 ring-1 ring-line">
      <div className="mb-2 text-[12px] font-semibold text-sky">다음 스팟까지 이동</div>
      <div className="grid grid-cols-2 gap-2">
        <select
          value={spot.legToNext.transport}
          onChange={(e) => updateLeg(spot.key, { transport: e.target.value as TransportMode })}
          className="rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-sunset"
        >
          {(Object.keys(TRANSPORT_LABEL) as TransportMode[]).map((m) => (
            <option key={m} value={m}>
              {TRANSPORT_LABEL[m]}
            </option>
          ))}
        </select>
        <input
          value={spot.legToNext.durationMin}
          onChange={(e) => updateLeg(spot.key, { durationMin: e.target.value })}
          placeholder="소요(분)"
          inputMode="numeric"
          className="rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
        />
      </div>
      <input
        value={spot.legToNext.caution}
        onChange={(e) => updateLeg(spot.key, { caution: e.target.value })}
        placeholder="주의사항 (예: 주차 협소)"
        className="mt-2 w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
      />
    </div>
  );

  // Dedicated legs list (one block per consecutive spot pair). Shared by the
  // wizard's 이동 step and edit mode's 이동 section.
  const legsBlock =
    spots.length < 2 ? (
      <p className="py-14 text-center text-[13px] text-ink-faint">
        스팟이 2곳 이상이면 이동 정보를 입력할 수 있어요.
      </p>
    ) : (
      <div className="space-y-3">
        {spots.slice(0, -1).map((spot, idx) => (
          <div key={spot.key} className="rounded-[var(--radius-card)] border border-line bg-card p-3.5">
            <div className="mb-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-ink">
              <SpotDot n={idx + 1} /> <span className="truncate">{spot.title || `스팟 ${idx + 1}`}</span>
              <ChevronRightIcon className="h-3.5 w-3.5 shrink-0 text-ink-faint" />
              <SpotDot n={idx + 2} /> <span className="truncate">{spots[idx + 1].title || `스팟 ${idx + 2}`}</span>
            </div>
            {legFields(spot)}
          </div>
        ))}
      </div>
    );

  const spotsBlock = (
    <DndContext id="spots-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={spots.map((s) => s.key)} strategy={verticalListSortingStrategy}>
        {spots.map((spot, idx) => (
          <SortableSpot key={spot.key} id={spot.key}>
            {(handle) => spotCard(spot, idx, handle)}
          </SortableSpot>
        ))}
      </SortableContext>
    </DndContext>
  );

  const addSpotButton = (
    <button
      type="button"
      onClick={addSpot}
      className="mt-3 flex w-full items-center justify-center gap-2 rounded-[var(--radius-card)] border-2 border-dashed border-line py-4 text-[14px] font-semibold text-ink-soft"
    >
      <span className="text-lg leading-none">＋</span> 스팟 추가
    </button>
  );

  const metaSelectors = (
    <>
      <div className="grid grid-cols-2 gap-3">
        <SelectTrigger label="테마" placeholder="테마 선택" value={theme} onClick={() => setSheet("theme")} />
        <SelectTrigger label="감정" placeholder="감정 선택" value={moodDisplay} onClick={() => setSheet("mood")} />
      </div>
      <SelectTrigger
        label="추천 대상"
        placeholder="추천 대상 선택"
        value={recommendedFor}
        onClick={() => setSheet("recommend")}
      />
      <div>
        <div className="mb-1.5 text-[12px] font-medium text-ink-faint">난이도</div>
        <div className="flex gap-2">
          {DIFFICULTY_OPTIONS.map((d) => {
            const active = difficulty === d.key;
            return (
              <button
                key={d.key}
                type="button"
                aria-pressed={active}
                onClick={() => setDifficulty(active ? "" : d.key)}
                className={`flex-1 rounded-xl border px-2 py-2.5 text-center transition-colors ${
                  active ? "border-sunset bg-sunset-wash" : "border-line bg-paper"
                }`}
              >
                <span className={`block text-[13px] font-bold ${active ? "text-sunset-ink" : "text-ink"}`}>
                  {d.label}
                </span>
                <span className="mt-0.5 block text-[11px] text-ink-faint">{d.desc}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <ReadonlyField
          label={isPlanDraft ? "여행 예정" : "방문 시점"}
          value={bestSeason}
          placeholder={isPlanDraft ? "미정" : "사진에서 자동 기입"}
        />
        <Field
          label={isPlanDraft ? "예상 비용(원)" : "지출 비용(원)"}
          value={estCost}
          onChange={setEstCost}
          placeholder="65000"
          inputMode="numeric"
        />
      </div>
    </>
  );

  const visibilityBox = (
    <div className="flex items-center justify-between rounded-xl border border-line bg-card px-4 py-3.5">
      <div>
        <div className="text-[14px] font-semibold text-ink">
          {visibility === "private" ? "비공개 코스" : "공개 코스"}
        </div>
        <div className="text-[12px] text-ink-faint">
          {visibility === "private"
            ? "나만 볼 수 있어요"
            : "둘러보기에 공유돼 다른 사람이 따라갈 수 있어요"}
        </div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={visibility === "public"}
        onClick={() => setVisibility((v) => (v === "private" ? "public" : "private"))}
        className={`relative h-7 w-12 rounded-full transition-colors ${visibility === "public" ? "bg-sunset" : "bg-line"}`}
      >
        <span
          className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all ${visibility === "public" ? "left-[22px]" : "left-0.5"}`}
        />
      </button>
    </div>
  );

  const sheets = (
    <>
      <ChipSheet
        open={sheet === "theme"}
        title="테마 선택"
        options={THEME_OPTIONS}
        value={splitCsv(theme)}
        onApply={(v) => {
          setTheme(v.join(", "));
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <ChipSheet
        open={sheet === "recommend"}
        title="추천 대상 선택"
        options={RECOMMEND_OPTIONS}
        value={splitCsv(recommendedFor)}
        onApply={(v) => {
          setRecommendedFor(v.join(", "));
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
      <MoodSheet
        open={sheet === "mood"}
        value={mood}
        onApply={(label) => {
          setMood(label);
          setSheet(null);
        }}
        onClose={() => setSheet(null)}
      />
    </>
  );

  const savingOverlay = saving && (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/30">
      <div className="rounded-2xl bg-card px-6 py-5 text-center shadow-xl">
        <div className="text-2xl">⏳</div>
        <p className="mt-1 text-[14px] font-semibold text-ink">루트를 저장하는 중…</p>
        <p className="text-[12px] text-ink-faint">
          {isPlanDraft ? "동선 정보를 저장하고 있어요" : "사진 업로드 중일 수 있어요"}
        </p>
      </div>
    </div>
  );

  const planInfoPanel = (
    <div className="space-y-1">
      <Field label="계획 제목" value={title} onChange={setTitle} placeholder="예: 제주 동쪽 바람 코스" required />
      <Field label="지역" value={region} onChange={setRegion} placeholder="예: 제주 구좌·성산" required />
      {metaSelectors}
      {visibilityBox}
      {isDirectPlanCreate ? (
        <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
          <div className="text-[14px] font-bold text-ink">어디로 갈지 먼저 정해요</div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
            제목과 지역을 잡아두면 스팟을 추가하면서 계획의 기준점이 흐려지지 않아요.
          </p>
        </div>
      ) : (
        <div className="rounded-[var(--radius-card)] border border-line bg-card p-4">
          <div className="text-[14px] font-bold text-ink">다녀온 뒤 기록으로 전환</div>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
            여행을 마쳤다면 사진과 감상을 중심으로 쓰는 기록 화면으로 바꿀 수 있어요.
          </p>
          {convertError && (
            <p className="mt-2 rounded-lg bg-sunset-wash px-3 py-2 text-[12px] text-sunset-ink">
              {convertError}
            </p>
          )}
          <button
            type="button"
            onClick={handleConvertToRecord}
            disabled={convertingRecord}
            className="mt-3 w-full rounded-xl bg-ink px-3 py-2.5 text-[13px] font-bold text-paper disabled:opacity-40"
          >
            {convertingRecord ? "전환 중…" : "여행 기록으로 전환"}
          </button>
        </div>
      )}
    </div>
  );

  if (isDirectPlanCreate) {
    return (
      <PlannerFrame
        header={<AppHeader left={plannerCloseButton} right={tempSaveButton} title="새 여행 계획" />}
      >
        <form
          id="route-form"
          onSubmit={handleSave}
          className="relative flex min-h-0 flex-1 overflow-hidden"
        >
          <PlanRoutePlanner
            spots={spots}
            placeSearchEnabled={placeSearchEnabled}
            copyContext={null}
            planInfoPanel={planInfoPanel}
            initialSheet={{ type: "summary" }}
            saving={saving}
            onUpdateSpot={updateSpot}
            onUpdateLeg={updateLeg}
            onAddSpotFromPlace={addSpotFromPlace}
            onRemoveSpot={removeSpot}
            onMoveSpot={moveSpot}
            onOptimizeOrder={optimizeSpotOrder}
            onFillEstimatedDurations={fillEstimatedDurations}
          />
          {saveError && (
            <p className="absolute left-4 right-4 top-3 z-20 rounded-xl bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink shadow">
              {saveError}
            </p>
          )}
        </form>
        {savingOverlay}
        {sheets}
        {exitConfirmSheet}
      </PlannerFrame>
    );
  }

  if (isEdit && isPlanDraft) {
    return (
      <PlannerFrame
        header={<AppHeader left={plannerCloseButton} right={tempSaveButton} title="지도 플래너" />}
      >
        <form
          id="route-form"
          onSubmit={handleSave}
          className="relative flex min-h-0 flex-1 overflow-hidden"
        >
          <PlanRoutePlanner
            spots={spots}
            placeSearchEnabled={placeSearchEnabled}
            copyContext={copyContext}
            planInfoPanel={planInfoPanel}
            saving={saving}
            onUpdateSpot={updateSpot}
            onUpdateLeg={updateLeg}
            onAddSpotFromPlace={addSpotFromPlace}
            onRemoveSpot={removeSpot}
            onMoveSpot={moveSpot}
            onOptimizeOrder={optimizeSpotOrder}
            onFillEstimatedDurations={fillEstimatedDurations}
          />
          {saveError && (
            <p className="absolute left-4 right-4 top-3 z-20 rounded-xl bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink shadow">
              {saveError}
            </p>
          )}
        </form>
        {savingOverlay}
        {sheets}
        {exitConfirmSheet}
      </PlannerFrame>
    );
  }

  // ── EDIT: single-page layout ──────────────────────────────────────────
  if (isEdit) {
    return (
      <MobileFrame>
        <AppHeader
          back={`/routes/${routeId}`}
          closeButton
          title="루트 수정"
          right={
            <button
              form="route-form"
              type="submit"
              disabled={!canSave || saving}
              className="rounded-full bg-sunset px-4 py-1.5 text-[13px] font-semibold text-white disabled:opacity-40"
            >
              {saving ? "저장 중…" : "완료"}
            </button>
          }
        />
        {/* section-jump nav — mirrors the wizard's order on one page; pins on scroll */}
        <nav className="no-scrollbar sticky top-0 z-20 flex gap-2 overflow-x-auto border-b border-line bg-paper/95 px-4 py-2 backdrop-blur">
          {editSections.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => jumpToSection(s.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] font-semibold transition-colors ${
                activeSection === s.id ? "bg-sunset text-white" : "bg-card text-ink-soft"
              }`}
            >
              {s.label}
            </button>
          ))}
        </nav>

        <form id="route-form" onSubmit={handleSave} className="px-4 pb-28">
          <CopyContextBanner context={copyContext} />

          {isPlanDraft && (
            <section data-section="map" ref={(el) => { sectionEls.current.map = el; }} className="scroll-mt-16 pt-4">
              <PlanDraftMapSection
                spots={draftMap.spots}
                legs={draftMap.legs}
                totalCount={spots.length}
              />
            </section>
          )}

          <section
            data-section="place"
            ref={(el) => { sectionEls.current.place = el; }}
            className={`${isPlanDraft ? "mt-8 border-t border-line pt-6" : "pt-4"} scroll-mt-16`}
          >
            <StepHeading
              title={isPlanDraft ? "스팟을 내 일정에 맞게 다듬어요" : "어디에서의 하루였나요?"}
              desc={isPlanDraft ? "장소 이름, 주소, 위치, 순서를 확인해 실제 여행 계획으로 정리해 주세요." : "지역과 다녀온 장소들을 확인하고 다듬어 주세요."}
            />
            <Field label="지역" value={region} onChange={setRegion} placeholder="예: 제주 구좌·성산" required />
            {spotsBlock}
            {addSpotButton}
          </section>

          <section data-section="move" ref={(el) => { sectionEls.current.move = el; }} className="mt-9 scroll-mt-16 border-t border-line pt-6">
            <StepHeading
              title="스팟 사이의 이동"
              desc={isPlanDraft ? "예상 이동 수단과 시간을 넣어 하루 동선의 무리를 미리 확인해 보세요." : "이동 수단과 소요 시간을 남기면 지도에 동선이 그려져요."}
            />
            {legsBlock}
          </section>

          <section data-section="story" ref={(el) => { sectionEls.current.story = el; }} className="mt-9 scroll-mt-16 border-t border-line pt-6">
            <StepHeading
              title={isPlanDraft ? "계획의 조건을 정리해요" : "이 하루의 이야기"}
              desc={isPlanDraft ? "제목, 테마, 추천 대상, 예상 비용을 정리하면 여행 전에도 꺼내 보기 쉬워요." : "제목과 테마·감정을 남기면 코스다워져요."}
            />
            <Field label="제목" value={title} onChange={setTitle} placeholder="예: 제주 동쪽, 바람의 하루" required />
            {metaSelectors}
          </section>

          <section data-section="share" ref={(el) => { sectionEls.current.share = el; }} className="mt-9 scroll-mt-16 border-t border-line pt-6">
            <StepHeading
              title="공개 범위"
              desc={isPlanDraft ? "계획 단계에서는 비공개로 다듬고, 준비가 되면 공개로 바꿀 수 있어요." : "나만의 코스로 둘지, 다른 사람과 나눌지 선택하세요."}
            />
            {visibilityBox}
          </section>

          {saveError && (
            <p className="mt-4 rounded-lg bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink">{saveError}</p>
          )}
        </form>
        {savingOverlay}
        {sheets}
      </MobileFrame>
    );
  }

  // ── CREATE: 5-step wizard ─────────────────────────────────────────────
  const canNext = step === 2 ? region.trim() && spotsValid : step === 4 ? !!title.trim() : true;

  return (
    <MobileFrame>
      <AppHeader back="/" closeButton title="새 루트 기록" />
      <Stepper steps={STEP_LABELS} current={step} />

      <form id="route-form" onSubmit={handleSave} className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        {step === 1 && (
          <>
            <StepHeading title="그날의 사진을 올려주세요" desc="위치가 담긴 사진을 올리면 장소·순서·경로를 자동으로 만들어요." />
            <label className="relative block overflow-hidden rounded-[var(--radius-card)] border-2 border-dashed border-sunset/40 bg-sunset-wash/40 p-6 text-center">
              <span className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-sunset text-white">
                <CameraIcon />
              </span>
              <span className="block text-[14px] font-bold text-ink">사진 올리기</span>
              <span className="mt-0.5 block text-[12px] text-ink-soft">여러 장을 한 번에 선택할 수 있어요</span>
              <input
                type="file"
                accept="image/*"
                multiple
                aria-label="사진 올리기"
                className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
                disabled={bulkBusy}
                onChange={handleBulkPhotoInput}
              />
            </label>
            {bulkBusy && <p className="mt-3 text-center text-[13px] text-sunset-ink">사진을 분석하는 중…</p>}
            {bulkNote && !bulkBusy && (
              <p className="mt-3 rounded-lg bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink">{bulkNote}</p>
            )}
            {allPhotos.length > 0 && (
              <div className="mt-4 grid grid-cols-4 gap-2">
                {allPhotos.map((ph) => (
                  <div key={ph.key} className="relative aspect-square overflow-hidden rounded-lg bg-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={ph.preview} alt="" className="h-full w-full object-cover" />
                    {ph.key === coverPhotoKey && <CoverBadge />}
                  </div>
                ))}
              </div>
            )}
            <p className="mt-5 text-center text-[12px] text-ink-faint">
              사진이 없다면 다음 단계에서 직접 추가할 수 있어요.
            </p>
          </>
        )}

        {step === 2 && (
          <>
            <StepHeading
              title={region ? `${region}에서의 하루, 맞나요?` : "어디에서의 하루인가요?"}
              desc={bestSeason ? `${bestSeason}의 기록을 정리하고 있어요. 장소를 확인하고 다듬어 주세요.` : "사진으로 만든 장소를 확인하고 다듬어 주세요."}
            />
            <Field label="지역" value={region} onChange={setRegion} placeholder="예: 서울 종로" required />
            {spotsBlock}
            {addSpotButton}
          </>
        )}

        {step === 3 && (
          <>
            <StepHeading title="스팟 사이, 어떻게 이동했나요?" desc="이동 수단과 소요 시간을 남기면 지도에 동선이 그려져요." />
            {legsBlock}
          </>
        )}

        {step === 4 && (
          <>
            <StepHeading title="이 하루를 한마디로" desc="제목과 테마·감정을 남기면 코스다워져요." />
            <Field label="제목" value={title} onChange={setTitle} placeholder="예: 제주 동쪽, 바람의 하루" required />
            {metaSelectors}
          </>
        )}

        {step === 5 && (
          <>
            <StepHeading title="마지막! 공개 범위를 정해요" desc="나만의 코스로 둘지, 다른 사람과 나눌지 선택하세요." />
            <div className="mb-4 rounded-[var(--radius-card)] border border-line bg-card p-4">
              <div className="text-[12px] text-ink-faint">{region} · {bestSeason || "날짜 미정"}</div>
              <div className="mt-0.5 text-[17px] font-black text-ink">{title || "제목 없음"}</div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {theme && <PreviewChip>{theme}</PreviewChip>}
                {moodDisplay && <PreviewChip>{moodDisplay}</PreviewChip>}
                <span className="ml-auto text-[12px] text-ink-faint">스팟 {spots.length}곳</span>
              </div>
            </div>
            {visibilityBox}
            {saveError && (
              <p className="mt-4 rounded-lg bg-sunset-wash px-3 py-2 text-center text-[13px] text-sunset-ink">{saveError}</p>
            )}
          </>
        )}
      </form>

      {/* footer nav */}
      <div className="flex gap-3 border-t border-line bg-card px-4 py-3 pb-[max(env(safe-area-inset-bottom),12px)]">
        {step > 1 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            className="rounded-xl border border-line bg-card px-5 py-3 text-[15px] font-semibold text-ink-soft"
          >
            이전
          </button>
        )}
        {step < 5 ? (
          <button
            type="button"
            onClick={() => canNext && setStep((s) => s + 1)}
            disabled={!canNext}
            className="flex-1 rounded-xl bg-sunset py-3 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            다음
          </button>
        ) : (
          <button
            form="route-form"
            type="submit"
            disabled={!canSave || saving}
            className="flex-1 rounded-xl bg-sunset py-3 text-[15px] font-semibold text-white disabled:opacity-40"
          >
            {saving ? "저장 중…" : "완료"}
          </button>
        )}
      </div>

      {savingOverlay}
      {sheets}
    </MobileFrame>
  );
}

/** Height (px) of the plan sheet that stays visible when collapsed — the drag handle strip. */
const SHEET_PEEK_PX = 36;

type PlannerSheet =
  | { type: "summary" }
  | { type: "spot"; key: string }
  | { type: "add" }
  | { type: "legs"; index?: number }
  | { type: "info" };

type PlannerMapMode = "route" | "time";

function PlanRoutePlanner({
  spots,
  placeSearchEnabled,
  copyContext,
  planInfoPanel,
  initialSheet = { type: "summary" },
  saving,
  onUpdateSpot,
  onUpdateLeg,
  onAddSpotFromPlace,
  onRemoveSpot,
  onMoveSpot,
  onOptimizeOrder,
  onFillEstimatedDurations,
}: {
  spots: DraftSpot[];
  placeSearchEnabled?: boolean;
  copyContext?: RouteCopyContext | null;
  planInfoPanel: React.ReactNode;
  initialSheet?: PlannerSheet;
  saving?: boolean;
  onUpdateSpot: (key: string, patch: Partial<DraftSpot>) => void;
  onUpdateLeg: (key: string, patch: Partial<DraftLeg>) => void;
  onAddSpotFromPlace: (place: PlaceHit) => string;
  onRemoveSpot: (key: string) => void;
  onMoveSpot: (key: string, delta: -1 | 1) => void;
  onOptimizeOrder: () => void;
  onFillEstimatedDurations: () => void;
}) {
  const mapEl = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markerRefs = useRef<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const lineRefs = useRef<any[]>([]);
  const sheetRef = useRef<PlannerSheet>({ type: "summary" });
  const onUpdateSpotRef = useRef(onUpdateSpot);
  const lastAutoFitKeyRef = useRef<string | null>(null);

  const [sheet, setSheet] = useState<PlannerSheet>(initialSheet);
  const [mapError, setMapError] = useState<string | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [mapTilesReady, setMapTilesReady] = useState(false);
  const [mapMode, setMapMode] = useState<PlannerMapMode>("route");

  // collapsible plan sheet: tap the handle to toggle, or drag it down/up.
  // While dragging, the live offset (px) overrides the snapped position.
  // Map-style draggable sheet with three detents: peek (handle only) / mid (hugs
  // content) / full (fills the surface). Height is explicit so it eases smoothly
  // when the step's content changes size, and the handle drags between detents.
  const [detent, setDetent] = useState<"peek" | "mid" | "full">("mid");
  const [dragH, setDragH] = useState<number | null>(null);
  // Soft-keyboard height (px). The sheet is bottom-anchored, so a focused search
  // field would otherwise hide behind the keyboard; lift the sheet by this much.
  const [kbInset, setKbInset] = useState(0);
  const [frameH, setFrameH] = useState(0);
  const [contentH, setContentH] = useState(0);
  const sheetEl = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const sheetDrag = useRef<{ pointerId: number; startY: number; startH: number } | null>(null);

  // Open a sheet at the comfortable middle detent (also lifts a tucked-away sheet).
  const openSheet = useCallback((next: PlannerSheet) => {
    setSheet(next);
    setDetent("mid");
  }, []);

  const bottomOffset = kbInset > 0 ? kbInset + 12 : 46;
  const availH = Math.max(frameH - bottomOffset - 8, 140);
  // peek shows the handle + the sheet's title/back row (not just a bare handle),
  // so you can tell which step you're on while the map is maximised.
  const peekH = SHEET_PEEK_PX + 52;
  const fullH = availH;
  const midH = Math.min(Math.max(contentH + SHEET_PEEK_PX, peekH), Math.round(availH * 0.62));
  const detentH = detent === "peek" ? peekH : detent === "full" ? fullH : midH;
  const sheetH = dragH ?? detentH;

  const onHandlePointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    sheetDrag.current = { pointerId: e.pointerId, startY: e.clientY, startH: detentH };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = sheetDrag.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    const next = drag.startH + (drag.startY - e.clientY); // drag up → taller
    setDragH(Math.min(Math.max(next, peekH), fullH));
  };

  const onHandlePointerEnd = (e: React.PointerEvent<HTMLButtonElement>) => {
    const drag = sheetDrag.current;
    if (!drag || e.pointerId !== drag.pointerId) return;
    sheetDrag.current = null;
    const landed = dragH ?? drag.startH;
    const dy = e.clientY - drag.startY;
    setDragH(null);
    if (Math.abs(dy) < 8) {
      setDetent((d) => (d === "peek" ? "mid" : "peek")); // a tap toggles peek
      return;
    }
    const targets = [
      { d: "peek" as const, h: peekH },
      { d: "mid" as const, h: midH },
      { d: "full" as const, h: fullH },
    ];
    const nearest = targets.reduce((a, b) => (Math.abs(b.h - landed) < Math.abs(a.h - landed) ? b : a));
    setDetent(nearest.d);
  };

  const selectedSpot = sheet.type === "spot" ? spots.find((s) => s.key === sheet.key) : undefined;
  const selectedSpotIndex = selectedSpot ? spots.findIndex((s) => s.key === selectedSpot.key) : -1;
  const selectedLegIndex = sheet.type === "legs" ? sheet.index : undefined;
  const locatedCount = spots.filter((s) => typeof s.lat === "number" && typeof s.lng === "number").length;
  const analysis = useMemo(() => analyzePlan(spots), [spots]);
  const previewPoints = useMemo(() => draftSpotsToThumbnailPoints(spots), [spots]);
  const mapRenderKey = spots
    .map((s, i) => `${i}:${s.key}:${s.title}:${s.lat ?? ""}:${s.lng ?? ""}:${s.legToNext.transport}`)
    .join("|");

  useEffect(() => {
    sheetRef.current = sheet;
  }, [sheet]);

  // Measure the surface and the sheet's content so the detent heights are right.
  // Measure the content's *inner* element (not the scroll box, whose scrollHeight
  // would echo the box height when the sheet is tall — a feedback loop). Re-runs on
  // navigation so the observer tracks the freshly mounted step's content.
  useEffect(() => {
    const frameNode = sheetEl.current?.parentElement;
    const inner = contentRef.current?.firstElementChild as HTMLElement | null;
    const measure = () => {
      if (frameNode) setFrameH(frameNode.clientHeight);
      if (inner) setContentH(inner.offsetHeight);
    };
    measure();
    const ro = new ResizeObserver(measure);
    if (frameNode) ro.observe(frameNode);
    if (inner) ro.observe(inner);
    return () => ro.disconnect();
  }, [sheet, spots]);

  // Keep the bottom sheet above the soft keyboard. Only react while a field in
  // the sheet is focused — the visual viewport also shifts during plain map
  // panning, and reacting then would jump the sheet. (Same approach as the
  // explore map overlay.)
  useEffect(() => {
    const vv = window.visualViewport;
    const el = sheetEl.current;
    if (!vv || !el) return;
    let focused = false;
    const apply = () => {
      setKbInset(focused ? Math.max(0, window.innerHeight - vv.height - vv.offsetTop) : 0);
    };
    const isField = (n: EventTarget | null) =>
      n instanceof HTMLElement && (n.tagName === "INPUT" || n.tagName === "TEXTAREA");
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) {
        focused = true;
        apply();
      }
    };
    const onFocusOut = () => {
      window.setTimeout(() => {
        if (!isField(document.activeElement)) {
          focused = false;
          apply();
        }
      }, 60);
    };
    el.addEventListener("focusin", onFocusIn);
    el.addEventListener("focusout", onFocusOut);
    vv.addEventListener("resize", apply);
    vv.addEventListener("scroll", apply);
    return () => {
      el.removeEventListener("focusin", onFocusIn);
      el.removeEventListener("focusout", onFocusOut);
      vv.removeEventListener("resize", apply);
      vv.removeEventListener("scroll", apply);
    };
  }, []);

  useEffect(() => {
    onUpdateSpotRef.current = onUpdateSpot;
  }, [onUpdateSpot]);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any = null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const listeners: any[] = [];
    let resizeObserver: ResizeObserver | null = null;
    let resizeTimer: number | null = null;
    let fallbackTimer: number | null = null;
    const extraTimers: number[] = [];
    let onWinResize: (() => void) | null = null;

    async function initMap() {
      try {
        await loadNaverMaps();
        const el = mapEl.current;
        if (cancelled || !el) return;
        await waitForVisibleMapContainer(el);
        if (cancelled || !mapEl.current) return;
        const naver = window.naver;
        const firstLocated = spots.find(
          (s) => typeof s.lat === "number" && typeof s.lng === "number",
        );
        setMapTilesReady(false);
        map = new naver.maps.Map(mapEl.current, {
          center: new naver.maps.LatLng(
            firstLocated?.lat ?? 37.5665,
            firstLocated?.lng ?? 126.978,
          ),
          zoom: firstLocated ? 13 : 11,
          scaleControl: false,
          mapDataControl: false,
          zoomControl: true,
          zoomControlOptions: { position: naver.maps.Position.RIGHT_CENTER },
          logoControlOptions: { position: naver.maps.Position.BOTTOM_LEFT },
        });
        mapRef.current = map;
        setMapReady(true);

        const refreshMapSize = () => {
          if (cancelled || !map) return;
          // Force the map canvas to the container's real pixel size. Triggering
          // "resize" alone sometimes leaves the tiles short of the bottom (a strip
          // of container bg shows through); setSize pins it exactly.
          const box = mapEl.current;
          if (box) {
            try {
              map.setSize?.(new naver.maps.Size(box.clientWidth, box.clientHeight));
            } catch {
              /* older SDKs: fall back to the resize event below */
            }
          }
          naver.maps.Event.trigger(map, "resize");
        };
        const markTilesReady = () => {
          if (cancelled) return;
          refreshMapSize();
          setMapTilesReady(true);
        };

        listeners.push(naver.maps.Event.addListener(map, "tilesloaded", markTilesReady));
        listeners.push(naver.maps.Event.addListener(map, "idle", markTilesReady));
        window.requestAnimationFrame(refreshMapSize);
        resizeTimer = window.setTimeout(refreshMapSize, 350);
        fallbackTimer = window.setTimeout(markTilesReady, 2500);

        resizeObserver = new ResizeObserver(refreshMapSize);
        resizeObserver.observe(mapEl.current);
        // Belt-and-suspenders: re-fit the tiles after late layout settles (safe-area
        // env values, fonts) and on viewport changes, so the map never leaves a gap
        // of container background under it.
        if (mapEl.current.parentElement) resizeObserver.observe(mapEl.current.parentElement);
        extraTimers.push(window.setTimeout(refreshMapSize, 700));
        extraTimers.push(window.setTimeout(refreshMapSize, 1500));
        onWinResize = () => refreshMapSize();
        window.addEventListener("resize", onWinResize);
        window.addEventListener("orientationchange", onWinResize);

        listeners.push(naver.maps.Event.addListener(
          map,
          "click",
          async (e: { coord: { lat(): number; lng(): number } }) => {
            const current = sheetRef.current;
            if (current.type !== "spot") return;
            const lat = e.coord.lat();
            const lng = e.coord.lng();
            const detail = await reverseGeocodeDetail(lat, lng);
            onUpdateSpotRef.current(current.key, {
              lat,
              lng,
              fromPhoto: false,
              ...(detail.address ? { address: detail.address } : {}),
              ...(detail.place ? { title: detail.place } : {}),
            });
          },
        ));
      } catch (err) {
        if (!cancelled) {
          setMapError(err instanceof Error ? err.message : "지도를 불러오지 못했어요");
        }
      }
    }

    initMap();

    return () => {
      cancelled = true;
      const naver = window.naver;
      listeners.forEach((listener) => naver?.maps?.Event?.removeListener?.(listener));
      resizeObserver?.disconnect();
      if (resizeTimer) window.clearTimeout(resizeTimer);
      if (fallbackTimer) window.clearTimeout(fallbackTimer);
      extraTimers.forEach((t) => window.clearTimeout(t));
      if (onWinResize) {
        window.removeEventListener("resize", onWinResize);
        window.removeEventListener("orientationchange", onWinResize);
      }
      markerRefs.current.forEach((marker) => marker.setMap?.(null));
      lineRefs.current.forEach((line) => line.setMap?.(null));
      markerRefs.current = [];
      lineRefs.current = [];
      map?.destroy?.();
      mapRef.current = null;
    };
    // Initialize the map once. Spot changes are rendered by the overlay effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const naver = window.naver;
    const map = mapRef.current;
    if (!mapReady || !naver?.maps || !map) return;

    markerRefs.current.forEach((marker) => marker.setMap?.(null));
    lineRefs.current.forEach((line) => line.setMap?.(null));
    markerRefs.current = [];
    lineRefs.current = [];

    const located = spots
      .map((spot, index) => ({ spot, index }))
      .filter(({ spot }) => typeof spot.lat === "number" && typeof spot.lng === "number");
    if (located.length === 0) return;

    const hasFocusedLeg = typeof selectedLegIndex === "number";
    const focusedSpotKeys =
      hasFocusedLeg && selectedLegIndex! >= 0 && selectedLegIndex! < spots.length - 1
        ? new Set([spots[selectedLegIndex!].key, spots[selectedLegIndex! + 1].key])
        : sheet.type === "spot"
          ? new Set([sheet.key])
          : null;

    spots.slice(0, -1).forEach((spot, index) => {
      const next = spots[index + 1];
      if (
        typeof spot.lat !== "number" ||
        typeof spot.lng !== "number" ||
        typeof next.lat !== "number" ||
        typeof next.lng !== "number"
      ) {
        return;
      }
      const selected = selectedLegIndex === index;
      const dimmed = hasFocusedLeg && !selected;
      const color = selected ? "#f07a4a" : "#64748b";
      const line = new naver.maps.Polyline({
        map,
        path: [
          new naver.maps.LatLng(spot.lat, spot.lng),
          new naver.maps.LatLng(next.lat, next.lng),
        ],
        strokeColor: color,
        strokeWeight: selected ? 5 : 3,
        strokeOpacity: dimmed ? 0.18 : 0.86,
        strokeStyle: selected ? "solid" : "shortdash",
        strokeLineCap: "round",
        strokeLineJoin: "round",
      });
      lineRefs.current.push(line);
    });

    located.forEach(({ spot, index }) => {
      const focused = focusedSpotKeys?.has(spot.key) ?? false;
      const dimmed = !!focusedSpotKeys && !focused;
      const band = timeBandForIndex(index, spots.length);
      const marker = new naver.maps.Marker({
        position: new naver.maps.LatLng(spot.lat as number, spot.lng as number),
        map,
        title: spot.title || `스팟 ${index + 1}`,
        zIndex: focused ? 20 : 10,
        icon: {
          content: plannerMarkerHtml(index + 1, focused, dimmed, mapMode === "time" ? band.color : undefined),
          anchor: new naver.maps.Point(focused ? 18 : 15, focused ? 18 : 15),
        },
      });
      naver.maps.Event.addListener(marker, "click", () => openSheet({ type: "spot", key: spot.key }));
      markerRefs.current.push(marker);
    });

    let fitKey = `route:${located
      .map(({ spot }) => `${spot.key}:${spot.lat}:${spot.lng}`)
      .join("|")}`;
    let fitPoints = located.map(({ spot }) => ({
      lat: spot.lat as number,
      lng: spot.lng as number,
    }));

    if (hasFocusedLeg) {
      const a = spots[selectedLegIndex!];
      const b = spots[selectedLegIndex! + 1];
      if (
        a &&
        b &&
        typeof a.lat === "number" &&
        typeof a.lng === "number" &&
        typeof b.lat === "number" &&
        typeof b.lng === "number"
      ) {
        fitKey = `leg:${selectedLegIndex}:${a.lat}:${a.lng}:${b.lat}:${b.lng}`;
        fitPoints = [
          { lat: a.lat, lng: a.lng },
          { lat: b.lat, lng: b.lng },
        ];
      }
    } else if (
      sheet.type === "spot" &&
      selectedSpot &&
      typeof selectedSpot.lat === "number" &&
      typeof selectedSpot.lng === "number"
    ) {
      fitKey = `spot:${selectedSpot.key}:${selectedSpot.lat}:${selectedSpot.lng}`;
      fitPoints = [{ lat: selectedSpot.lat, lng: selectedSpot.lng }];
    }

    if (lastAutoFitKeyRef.current !== fitKey) {
      fitPlannerMap(naver, map, fitPoints);
      lastAutoFitKeyRef.current = fitKey;
    }
  }, [mapMode, mapReady, mapRenderKey, openSheet, selectedLegIndex, selectedSpot, sheet, spots]);

  const openAddedSpot = (place: PlaceHit) => {
    onAddSpotFromPlace(place);
    // After adding a place, land on the summary so the spot shows on the map and
    // the list — with "새 스팟 추가" ready — instead of jumping into detail editing.
    openSheet({ type: "summary" });
  };

  if (!NAVER_MAP_KEY || mapError) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <MapPinIcon />
        <h2 className="mt-3 text-[18px] font-black text-ink">지도 플래너를 열 수 없어요</h2>
        <p className="mt-1 text-[13px] leading-relaxed text-ink-faint">
          {mapError ? `지도를 불러오지 못했어요. (${mapError})` : "지도 키 설정이 필요해요."}
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-0 w-full flex-1 overflow-hidden bg-line">
      <div ref={mapEl} data-route-plan-map className="rd-map absolute inset-0 z-0 h-full w-full" />
      <RoutePlanThumbnail
        points={previewPoints}
        className={`pointer-events-none absolute inset-0 z-[1] transition-opacity duration-300 ${
          mapTilesReady ? "opacity-0" : "opacity-60"
        }`}
      />

      <div className="pointer-events-none absolute left-3 right-3 top-3 z-10 flex items-start justify-between gap-2">
        <div className="rounded-2xl bg-card/90 px-3 py-2 shadow-sm ring-1 ring-line/70 backdrop-blur">
          <div className="text-[11px] font-semibold text-ink-faint">여행 계획</div>
          <div className="mt-0.5 text-[14px] font-black text-ink">
            스팟 {spots.length}곳
            <span className="ml-1 text-[12px] font-semibold text-ink-faint">
              {analysis.totalLabel}
            </span>
          </div>
        </div>
        <div className="pointer-events-auto flex gap-1 rounded-full bg-card/90 p-1 shadow-sm ring-1 ring-line/70 backdrop-blur">
          {(["route", "time"] as PlannerMapMode[]).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setMapMode(mode)}
              className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                mapMode === mode ? "bg-sunset text-white" : "text-ink-soft"
              }`}
            >
              {mode === "route" ? "동선" : "시간대"}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={sheetEl}
        className="absolute inset-x-3 z-10 flex flex-col overflow-hidden rounded-[var(--radius-card)] bg-paper/96 shadow-2xl ring-1 ring-black/10 backdrop-blur"
        style={{
          // sit above the home-indicator / gesture bar at rest; when the keyboard
          // is up its inset already covers the bottom area.
          bottom: kbInset > 0 ? kbInset + 12 : "calc(env(safe-area-inset-bottom) + 12px)",
          height: sheetH,
          transition:
            dragH === null
              ? "height 320ms cubic-bezier(0.22,1,0.36,1), bottom 280ms ease-out"
              : "none",
        }}
      >
        <button
          type="button"
          aria-expanded={detent !== "peek"}
          aria-label={detent === "peek" ? "여행 계획 시트 펼치기" : "여행 계획 시트 접기"}
          className="flex h-9 w-full shrink-0 touch-none items-center justify-center"
          onPointerDown={onHandlePointerDown}
          onPointerMove={onHandlePointerMove}
          onPointerUp={onHandlePointerEnd}
          onPointerCancel={onHandlePointerEnd}
        >
          <span
            className={`h-1 w-10 rounded-full transition-colors ${
              detent === "peek" ? "bg-sunset" : "bg-line"
            }`}
          />
        </button>
        {/* the single scroll container — branch contents must not cap their own height.
            flex-auto (basis: content), not flex-1 (basis: 0): with the sheet sized by
            max-height (no fixed height), a basis-0 child collapses to ~0 on WebKit when
            the content is shorter than the cap (e.g. the short "새 스팟 추가" panel),
            leaving only the handle peeking. basis: content keeps short panels full and
            still shrinks + scrolls when the content exceeds the cap. */}
        <div ref={contentRef} className="min-h-0 flex-auto overflow-y-auto overscroll-contain">
        <PlannerSheetContent
          sheet={sheet}
          spots={spots}
          selectedSpot={selectedSpot}
          selectedSpotIndex={selectedSpotIndex}
          analysis={analysis}
          mapMode={mapMode}
          locatedCount={locatedCount}
          placeSearchEnabled={placeSearchEnabled}
          copyContext={copyContext}
          planInfoPanel={planInfoPanel}
          saving={saving}
          onSheetChange={openSheet}
          onUpdateSpot={onUpdateSpot}
          onUpdateLeg={onUpdateLeg}
          onAddSpotFromPlace={openAddedSpot}
          onRemoveSpot={(key) => {
            onRemoveSpot(key);
            setSheet({ type: "summary" });
          }}
          onMoveSpot={onMoveSpot}
          onOptimizeOrder={onOptimizeOrder}
          onFillEstimatedDurations={onFillEstimatedDurations}
        />
        </div>
      </div>
    </div>
  );
}

function PlannerSheetContent({
  sheet,
  spots,
  selectedSpot,
  selectedSpotIndex,
  analysis,
  mapMode,
  locatedCount,
  placeSearchEnabled,
  copyContext,
  planInfoPanel,
  saving,
  onSheetChange,
  onUpdateSpot,
  onUpdateLeg,
  onAddSpotFromPlace,
  onRemoveSpot,
  onMoveSpot,
  onOptimizeOrder,
  onFillEstimatedDurations,
}: {
  sheet: PlannerSheet;
  spots: DraftSpot[];
  selectedSpot?: DraftSpot;
  selectedSpotIndex: number;
  analysis: PlanAnalysis;
  mapMode: PlannerMapMode;
  locatedCount: number;
  placeSearchEnabled?: boolean;
  copyContext?: RouteCopyContext | null;
  planInfoPanel: React.ReactNode;
  saving?: boolean;
  onSheetChange: (sheet: PlannerSheet) => void;
  onUpdateSpot: (key: string, patch: Partial<DraftSpot>) => void;
  onUpdateLeg: (key: string, patch: Partial<DraftLeg>) => void;
  onAddSpotFromPlace: (place: PlaceHit) => void;
  onRemoveSpot: (key: string) => void;
  onMoveSpot: (key: string, delta: -1 | 1) => void;
  onOptimizeOrder: () => void;
  onFillEstimatedDurations: () => void;
}) {
  if (sheet.type === "add") {
    return (
      <div className="p-4 pt-3">
        <SheetHeader title="새 스팟 추가" onBack={() => onSheetChange({ type: "summary" })} />
        <PlaceSearchPanel
          enabled={placeSearchEnabled}
          placeholder="장소 검색"
          autoFocus
          onSelect={onAddSpotFromPlace}
        />
      </div>
    );
  }

  if (sheet.type === "info") {
    return (
      <div className="p-4 pt-3">
        <SheetHeader title="제목과 일정" onBack={() => onSheetChange({ type: "summary" })} />
        {planInfoPanel}
        <button
          form="route-form"
          type="submit"
          disabled={saving}
          className="mt-4 flex w-full items-center justify-center rounded-xl bg-sunset px-3 py-3.5 text-[15px] font-bold text-white disabled:opacity-50"
        >
          {saving ? "저장 중…" : "완료"}
        </button>
      </div>
    );
  }

  if (sheet.type === "spot") {
    if (!selectedSpot) {
      return (
        <div className="p-4 pt-3">
          <SheetHeader title="스팟" onBack={() => onSheetChange({ type: "summary" })} />
          <p className="py-8 text-center text-[13px] text-ink-faint">스팟을 찾을 수 없어요.</p>
        </div>
      );
    }

    return (
      <div className="p-4 pt-3">
        <SheetHeader title={`스팟 ${selectedSpotIndex + 1}`} onBack={() => onSheetChange({ type: "summary" })} />
        <div className="mb-3 flex gap-2">
          <button
            type="button"
            disabled={selectedSpotIndex <= 0}
            onClick={() => onMoveSpot(selectedSpot.key, -1)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-card px-3 py-2 text-[13px] font-semibold text-ink-soft disabled:opacity-35"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            앞으로
          </button>
          <button
            type="button"
            disabled={selectedSpotIndex >= spots.length - 1}
            onClick={() => onMoveSpot(selectedSpot.key, 1)}
            className="flex flex-1 items-center justify-center gap-1 rounded-xl border border-line bg-card px-3 py-2 text-[13px] font-semibold text-ink-soft disabled:opacity-35"
          >
            뒤로
            <ChevronRightIcon className="h-4 w-4" />
          </button>
        </div>
        <Field
          label="장소 이름"
          value={selectedSpot.title}
          onChange={(v) => onUpdateSpot(selectedSpot.key, { title: v })}
          placeholder="예: 세화 해변"
        />
        <Field
          label="주소"
          value={selectedSpot.address}
          onChange={(v) => onUpdateSpot(selectedSpot.key, { address: v })}
          placeholder="장소를 검색하거나 지도에서 지정"
        />
        <label className="mb-3 block">
          <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">계획 메모</span>
          <textarea
            value={selectedSpot.body}
            onChange={(e) => onUpdateSpot(selectedSpot.key, { body: e.target.value })}
            placeholder="예약 시간, 영업시간, 체크할 것을 적어보세요."
            rows={3}
            className="w-full resize-none rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] leading-relaxed text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
          />
        </label>
        <PlaceSearchPanel
          enabled={placeSearchEnabled}
          placeholder="다른 장소로 바꾸기"
          compact
          onSelect={(place) =>
            onUpdateSpot(selectedSpot.key, {
              title: place.name,
              address: place.address,
              lat: place.lat,
              lng: place.lng,
              fromPhoto: false,
            })
          }
        />
        <button
          type="button"
          disabled={spots.length <= 1}
          onClick={() => onRemoveSpot(selectedSpot.key)}
          className="mt-3 w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] font-bold text-sunset-ink disabled:opacity-35"
        >
          스팟 삭제
        </button>
      </div>
    );
  }

  if (sheet.type === "legs") {
    return (
      <div className="p-4 pt-3">
        <SheetHeader title="이동 정하기" onBack={() => onSheetChange({ type: "summary" })} />
        {spots.length < 2 ? (
          <p className="py-8 text-center text-[13px] text-ink-faint">
            스팟을 2곳 이상 추가하면 이동수단을 정할 수 있어요.
          </p>
        ) : (
          <>
            <PlanInsightPanel analysis={analysis} />
            <div className="mt-3 space-y-2.5">
              {spots.slice(0, -1).map((spot, index) => (
                <LegPlannerCard
                  key={spot.key}
                  spot={spot}
                  next={spots[index + 1]}
                  index={index}
                  insight={analysis.legs[index]}
                  selected={sheet.index === index}
                  onSelect={() => onSheetChange({ type: "legs", index })}
                  onUpdate={(patch) => onUpdateLeg(spot.key, patch)}
                />
              ))}
            </div>
            {/* Only surface reordering when it actually helps, with a plain-language
                explanation of what it does. */}
            {analysis.canOptimize && (
              <button
                type="button"
                onClick={onOptimizeOrder}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-sunset/40 bg-sunset-wash/60 px-3 py-2.5 text-[13px] font-bold text-sunset-ink"
              >
                <SortIcon className="h-4 w-4" />
                가까운 순서로 정렬 · 이동 거리 줄이기
              </button>
            )}
            {analysis.estimatableLegCount > 0 && (
              <button
                type="button"
                onClick={onFillEstimatedDurations}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2.5 text-[13px] font-bold text-ink-soft"
              >
                <ArrowDownIcon className="h-4 w-4" />
                비어 있는 예상 시간 자동 채우기
              </button>
            )}
            <TimeBandOverview spots={spots} active={mapMode === "time"} />
          </>
        )}
        <button
          type="button"
          onClick={() => onSheetChange({ type: "info" })}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sunset px-3 py-3.5 text-[14px] font-bold text-white"
        >
          다음 · 제목과 일정
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 pt-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[17px] font-black leading-tight text-ink">지도 위 여행 계획</h2>
          <p className="mt-0.5 text-[12px] text-ink-faint">
            {spots.length === 0
              ? "가고 싶은 곳을 검색해 첫 스팟을 추가해 보세요."
              : `스팟 ${spots.length}곳 · 지도 ${locatedCount}곳 · ${analysis.totalLabel}`}
          </p>
        </div>
        {copyContext?.original && (
          <Link
            href={`/routes/${copyContext.original.id}`}
            className="max-w-[42%] truncate rounded-full bg-sunset-wash px-2.5 py-1 text-[11px] font-bold text-sunset-ink"
          >
            원본 보기
          </Link>
        )}
      </div>
      {/* Spots in a grid; the "새 스팟 추가" tile is always last (full-width while
          the plan is empty). Keep adding spots freely — itinerary controls move
          to the next step. */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {spots.map((spot, index) => (
          <button
            key={spot.key}
            type="button"
            onClick={() => onSheetChange({ type: "spot", key: spot.key })}
            className="rounded-xl border border-line bg-card px-3 py-2.5 text-left"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-sunset text-[11px] font-bold text-white">
              {index + 1}
            </span>
            <span className="mt-1.5 block truncate text-[12px] font-bold text-ink">
              {spot.title || `스팟 ${index + 1}`}
            </span>
            <span className="mt-0.5 block truncate text-[10px] text-ink-faint">
              {spot.address || "위치 미정"}
            </span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => onSheetChange({ type: "add" })}
          aria-label="새 스팟 추가"
          className={`flex min-h-[70px] flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-line bg-card text-ink-soft ${
            spots.length === 0 ? "col-span-2 py-6" : ""
          }`}
        >
          <PlusIcon className="h-5 w-5" />
          <span className="text-[12px] font-bold">새 스팟 추가</span>
        </button>
      </div>
      {spots.length >= 1 && (
        <button
          type="button"
          onClick={() => onSheetChange({ type: "legs" })}
          className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-sunset px-3 py-3.5 text-[14px] font-bold text-white"
        >
          다음 · 이동 정하기
          <ChevronRightIcon className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

function LegPlannerCard({
  spot,
  next,
  index,
  insight,
  selected,
  onSelect,
  onUpdate,
}: {
  spot: DraftSpot;
  next: DraftSpot;
  index: number;
  insight?: PlanLegInsight;
  selected: boolean;
  onSelect: () => void;
  onUpdate: (patch: Partial<DraftLeg>) => void;
}) {
  return (
    <div className={`rounded-[var(--radius-card)] border bg-card ${selected ? "border-sunset" : "border-line"}`}>
      <button type="button" onClick={onSelect} className="flex w-full items-center gap-2 px-3 py-3 text-left">
        <SpotDot n={index + 1} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
          {spot.title || `스팟 ${index + 1}`}
        </span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
        <SpotDot n={index + 2} />
        <span className="min-w-0 flex-1 truncate text-[13px] font-bold text-ink">
          {next.title || `스팟 ${index + 2}`}
        </span>
      </button>
      <div className="flex flex-wrap gap-1.5 px-3 pb-2">
        <MiniMetric>{insight?.distanceLabel ?? "거리 —"}</MiniMetric>
        <MiniMetric>{spot.legToNext.durationMin ? `${spot.legToNext.durationMin}분` : insight?.estimateLabel ?? "시간 미정"}</MiniMetric>
        {insight?.severity === "hard" && <MiniMetric tone="warn">빡빡</MiniMetric>}
      </div>
      {selected && (
        <div className="border-t border-line px-3 pb-3 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <select
              value={spot.legToNext.transport}
              onChange={(e) => onUpdate({ transport: e.target.value as TransportMode })}
              className="rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-sunset"
            >
              {(Object.keys(TRANSPORT_LABEL) as TransportMode[]).map((mode) => (
                <option key={mode} value={mode}>
                  {TRANSPORT_LABEL[mode]}
                </option>
              ))}
            </select>
            <select
              value={spot.legToNext.durationMin}
              onChange={(e) => onUpdate({ durationMin: e.target.value })}
              className="rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none focus:border-sunset"
            >
              <option value="">예상 시간</option>
              {(() => {
                const cur = Number(spot.legToNext.durationMin);
                return (
                  spot.legToNext.durationMin &&
                  cur > 0 &&
                  cur % 5 !== 0 && <option value={spot.legToNext.durationMin}>{spot.legToNext.durationMin}분</option>
                );
              })()}
              {Array.from({ length: 36 }, (_, i) => (i + 1) * 5).map((m) => (
                <option key={m} value={String(m)}>
                  {m}분
                </option>
              ))}
            </select>
          </div>
          <input
            value={spot.legToNext.caution}
            onChange={(e) => onUpdate({ caution: e.target.value })}
            placeholder="이동 메모"
            className="mt-2 w-full rounded-lg border border-line bg-paper px-2.5 py-2 text-[13px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
          />
          {insight?.estimatedMin && !spot.legToNext.durationMin.trim() && (
            <button
              type="button"
              onClick={() => onUpdate({ durationMin: String(Math.round(insight.estimatedMin! / 5) * 5) })}
              className="mt-2 rounded-full bg-sunset-wash px-3 py-1.5 text-[12px] font-bold text-sunset-ink"
            >
              예상 {Math.round(insight.estimatedMin / 5) * 5}분 넣기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

type PlanLegInsight = {
  distanceMeters?: number;
  distanceLabel: string;
  estimatedMin?: number;
  estimateLabel: string;
  effectiveMin?: number;
  severity: "ok" | "watch" | "hard" | "missing";
};

type PlanAnalysis = {
  legs: PlanLegInsight[];
  warnings: { title: string; body: string; tone: "ok" | "watch" | "hard" }[];
  totalMin: number;
  totalLabel: string;
  totalDistanceMeters: number;
  estimatableLegCount: number;
  canOptimize: boolean;
};

function PlanInsightPanel({ analysis }: { analysis: PlanAnalysis }) {
  const headline =
    analysis.warnings.find((w) => w.tone === "hard") ??
    analysis.warnings.find((w) => w.tone === "watch") ??
    analysis.warnings[0];

  if (!headline) return null;

  const toneClass =
    headline.tone === "hard"
      ? "border-sunset/35 bg-sunset-wash/70 text-sunset-ink"
      : headline.tone === "watch"
        ? "border-warning/30 bg-warning-soft text-warning"
        : "border-line bg-card text-ink-soft";

  return (
    <div className={`mt-4 rounded-[var(--radius-card)] border p-3 ${toneClass}`}>
      <div className="text-[13px] font-black">{headline.title}</div>
      <p className="mt-0.5 text-[12px] leading-relaxed">{headline.body}</p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        <MiniMetric>이동 {analysis.totalLabel}</MiniMetric>
        <MiniMetric>{formatDistance(analysis.totalDistanceMeters)}</MiniMetric>
      </div>
    </div>
  );
}

function TimeBandOverview({ spots, active }: { spots: DraftSpot[]; active: boolean }) {
  if (spots.length === 0) return null;
  const grouped = TIME_BANDS.map((band) => ({
    ...band,
    spots: spots.filter((_, index) => timeBandForIndex(index, spots.length).label === band.label),
  })).filter((band) => band.spots.length > 0);

  return (
    <div className={`mt-3 rounded-[var(--radius-card)] border ${active ? "border-sunset/40" : "border-line"} bg-card p-3`}>
      <div className="flex items-center justify-between">
        <div className="text-[13px] font-black text-ink">시간대별 흐름</div>
        <div className="text-[11px] font-semibold text-ink-faint">
          {active ? "지도 색상 표시 중" : "시간대 보기로 확인"}
        </div>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {grouped.map((band) => (
          <div key={band.label} className="rounded-xl bg-paper px-2.5 py-2">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-ink-soft">
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: band.color }} />
              {band.label}
            </div>
            <div className="mt-1 truncate text-[12px] font-semibold text-ink">
              {band.spots.map((s) => s.title || "이름 없음").join(", ")}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MiniMetric({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone?: "warn";
}) {
  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${
        tone === "warn" ? "bg-sunset-wash text-sunset-ink" : "bg-paper text-ink-faint"
      }`}
    >
      {children}
    </span>
  );
}

function PlaceSearchPanel({
  enabled,
  placeholder,
  compact,
  autoFocus,
  onSelect,
}: {
  enabled?: boolean;
  placeholder: string;
  compact?: boolean;
  autoFocus?: boolean;
  onSelect: (place: PlaceHit) => void;
}) {
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<{ q: string; places: PlaceHit[] } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Open the keyboard right away when the sheet wants search front-and-center.
  useEffect(() => {
    if (autoFocus) inputRef.current?.focus();
  }, [autoFocus]);

  const q = query.trim();
  const active = q.length >= 2;
  const results = active && hits?.q === q ? hits.places : null;
  const searching = active && results === null;

  useEffect(() => {
    if (!enabled || q.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/places?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as { places?: PlaceHit[] };
        setHits({ q, places: data.places ?? [] });
      } catch {
        if (!controller.signal.aborted) setHits({ q, places: [] });
      }
    }, 280);
    return () => {
      controller.abort();
      window.clearTimeout(timer);
    };
  }, [enabled, q]);

  const pick = (place: PlaceHit) => {
    setQuery("");
    setHits(null);
    onSelect(place);
  };

  if (!enabled) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-card px-3 py-3 text-[12px] text-ink-faint">
        장소 검색 설정이 필요해요.
      </div>
    );
  }

  return (
    <div className={`overflow-hidden rounded-xl border border-line bg-card ${compact ? "mt-1" : ""}`}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <SearchSmallIcon />
        <input
          ref={inputRef}
          type="text"
          autoFocus={autoFocus}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && e.preventDefault()}
          placeholder={placeholder}
          className="w-full bg-transparent text-[14px] text-ink outline-none placeholder:text-ink-faint"
        />
        {query && (
          <button
            type="button"
            aria-label="검색어 지우기"
            onClick={() => setQuery("")}
            className="text-[12px] text-ink-faint"
          >
            ✕
          </button>
        )}
      </div>
      {(searching || results !== null) && (
        <div className="max-h-48 overflow-y-auto border-t border-line">
          {searching ? (
            <p className="px-3 py-2 text-[12px] text-ink-faint">검색 중…</p>
          ) : results && results.length > 0 ? (
            <ul>
              {results.map((place, i) => (
                <li key={`${place.lat},${place.lng},${i}`}>
                  <button
                    type="button"
                    onClick={() => pick(place)}
                    className="block w-full px-3 py-2 text-left active:bg-line/50"
                  >
                    <span className="block truncate text-[13px] font-bold text-ink">{place.name}</span>
                    <span className="block truncate text-[11px] text-ink-faint">
                      {[place.category, place.address].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-3 py-2 text-[12px] text-ink-faint">검색 결과가 없어요</p>
          )}
        </div>
      )}
    </div>
  );
}

function SheetHeader({ title, onBack }: { title: string; onBack: () => void }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <button
        type="button"
        onClick={onBack}
        aria-label="이전"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-card text-ink-soft ring-1 ring-line"
      >
        <ChevronLeftIcon className="h-[18px] w-[18px]" />
      </button>
      <h2 className="min-w-0 flex-1 truncate text-[16px] font-black text-ink">{title}</h2>
    </div>
  );
}

function fitPlannerMap(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  naver: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  map: any,
  points: { lat: number; lng: number }[],
) {
  if (points.length === 0) return;
  if (points.length === 1) {
    map.setCenter(new naver.maps.LatLng(points[0].lat, points[0].lng));
    map.setZoom(15);
    return;
  }
  const bounds = new naver.maps.LatLngBounds(
    new naver.maps.LatLng(points[0].lat, points[0].lng),
    new naver.maps.LatLng(points[0].lat, points[0].lng),
  );
  points.forEach((point) => bounds.extend(new naver.maps.LatLng(point.lat, point.lng)));
  map.fitBounds(bounds, { top: 96, right: 48, bottom: 260, left: 48 });
}

function waitForVisibleMapContainer(el: HTMLElement): Promise<void> {
  const rect = el.getBoundingClientRect();
  if (rect.width > 0 && rect.height > 0) return Promise.resolve();

  return new Promise((resolve) => {
    let frame = 0;
    let timeout: number | null = null;
    let observer: ResizeObserver | null = null;

    const done = () => {
      observer?.disconnect();
      window.cancelAnimationFrame(frame);
      if (timeout) window.clearTimeout(timeout);
      resolve();
    };

    const check = () => {
      const nextRect = el.getBoundingClientRect();
      if (nextRect.width > 0 && nextRect.height > 0) {
        done();
        return;
      }
      frame = window.requestAnimationFrame(check);
    };

    observer = new ResizeObserver(check);
    observer.observe(el);
    frame = window.requestAnimationFrame(check);
    timeout = window.setTimeout(done, 1200);
  });
}

function plannerMarkerHtml(index: number, focused: boolean, dimmed: boolean, color?: string) {
  const size = focused ? 36 : 30;
  const font = focused ? 15 : 13;
  const opacity = dimmed ? 0.32 : 1;
  const bg = color ?? (focused ? "#f07a4a" : "#16a34a");
  return `<div class="rd-mk" style="display:flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;border-radius:999px;background:${bg};color:#fff;font-size:${font}px;font-weight:800;box-shadow:0 2px 10px rgba(0,0,0,.32);opacity:${opacity};border:2px solid rgba(255,255,255,.92)">${index}</div>`;
}

const TIME_BANDS = [
  { label: "오전", color: "#2563eb" },
  { label: "점심", color: "#f59e0b" },
  { label: "오후", color: "#16a34a" },
  { label: "저녁", color: "#7c3aed" },
] as const;

function timeBandForIndex(index: number, total: number) {
  if (total <= 1) return TIME_BANDS[0];
  const bandIndex = Math.min(
    TIME_BANDS.length - 1,
    Math.floor((index / total) * TIME_BANDS.length),
  );
  return TIME_BANDS[bandIndex];
}

function optimizeByNearestNeighbor(spots: DraftSpot[]) {
  const located = spots.filter(hasCoords);
  if (located.length < 3) return spots;

  const unlocated = spots.filter((spot) => !hasCoords(spot));
  const start = hasCoords(spots[0]) ? spots[0] : located[0];
  const ordered: typeof located = [start];
  const remaining = located.filter((spot) => spot.key !== start.key);

  while (remaining.length > 0) {
    const current = ordered[ordered.length - 1];
    let bestIndex = 0;
    let bestDistance = Infinity;
    remaining.forEach((candidate, index) => {
      const distance = haversineMeters(current, candidate);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    });
    ordered.push(remaining.splice(bestIndex, 1)[0]);
  }

  return [...ordered, ...unlocated];
}

function analyzePlan(spots: DraftSpot[]): PlanAnalysis {
  const legs = spots.slice(0, -1).map((spot, index) => buildLegInsight(spot, spots[index + 1]));
  const totalMin = legs.reduce((sum, leg) => sum + (leg.effectiveMin ?? 0), 0);
  const totalDistanceMeters = legs.reduce((sum, leg) => sum + (leg.distanceMeters ?? 0), 0);
  const missingCoords = spots.filter((spot) => !hasCoords(spot)).length;
  const missingDurations = spots.slice(0, -1).filter((spot) => !spot.legToNext.durationMin.trim()).length;
  const hardLegs = legs.filter((leg) => leg.severity === "hard").length;
  const currentDistance = routeDistance(spots);
  const optimizedDistance = routeDistance(optimizeByNearestNeighbor(spots));
  const canOptimize =
    spots.filter(hasCoords).length >= 3 &&
    Number.isFinite(currentDistance) &&
    Number.isFinite(optimizedDistance) &&
    optimizedDistance < currentDistance * 0.9;

  const warnings: PlanAnalysis["warnings"] = [];
  if (spots.length >= 7) {
    warnings.push({
      tone: "hard",
      title: "하루 일정이 꽤 빡빡해요",
      body: `스팟 ${spots.length}곳은 이동과 대기 시간을 고려하면 피로도가 높을 수 있어요.`,
    });
  } else if (spots.length >= 5) {
    warnings.push({
      tone: "watch",
      title: "여유 시간을 조금 남겨두면 좋아요",
      body: "스팟 수가 많은 편이라 식사나 대기 시간을 일정에 넣어두는 편이 좋아요.",
    });
  }
  if (totalMin >= 180) {
    warnings.push({
      tone: "hard",
      title: "이동 시간이 길어요",
      body: `입력/예상 이동만 ${formatMinutes(totalMin)} 정도예요. 핵심 스팟을 줄이는 것도 좋아요.`,
    });
  } else if (totalMin >= 120) {
    warnings.push({
      tone: "watch",
      title: "이동 비중이 높은 편이에요",
      body: `이동 시간이 ${formatMinutes(totalMin)} 정도라 중간 휴식 지점을 생각해두면 좋아요.`,
    });
  }
  if (hardLegs > 0) {
    warnings.push({
      tone: "watch",
      title: "긴 이동 구간이 있어요",
      body: `${hardLegs}개 구간은 1시간 안팎으로 예상돼요. 지도에서 해당 구간을 눌러 확인해 보세요.`,
    });
  }
  if (canOptimize) {
    warnings.push({
      tone: "watch",
      title: "동선을 더 단순하게 만들 수 있어요",
      body: "가까운 순서로 정렬하면 이동 거리를 줄일 가능성이 있어요.",
    });
  }
  if (missingCoords > 0) {
    warnings.push({
      tone: "watch",
      title: "지도에 빠진 스팟이 있어요",
      body: `${missingCoords}곳은 위치가 없어 동선 계산에서 빠졌어요.`,
    });
  }
  if (missingDurations > 0) {
    warnings.push({
      tone: "ok",
      title: "예상 시간을 채워볼 수 있어요",
      body: "비어 있는 이동시간은 거리와 이동수단 기준으로 먼저 가늠해볼 수 있어요.",
    });
  }
  // Only judge "balance" once there's an actual itinerary (2+ spots, i.e. a leg
  // to evaluate). At 0–1 spots a positive verdict reads as premature/misleading.
  if (warnings.length === 0 && spots.length >= 2) {
    warnings.push({
      tone: "ok",
      title: "일정 균형이 좋아 보여요",
      body: "스팟 수와 이동 흐름이 무난해 보여요. 실제 운영시간만 한 번 더 확인해 보세요.",
    });
  }

  return {
    legs,
    warnings,
    totalMin,
    totalLabel: totalMin > 0 ? formatMinutes(totalMin) : "시간 미정",
    totalDistanceMeters,
    estimatableLegCount: legs.filter((leg, index) => leg.estimatedMin && !spots[index].legToNext.durationMin.trim()).length,
    canOptimize,
  };
}

function buildLegInsight(spot: DraftSpot, next: DraftSpot): PlanLegInsight {
  if (!hasCoords(spot) || !hasCoords(next)) {
    return {
      distanceLabel: "거리 —",
      estimateLabel: "시간 미정",
      severity: "missing",
    };
  }

  const distanceMeters = haversineMeters(spot, next);
  const estimatedMin = estimateLegMinutes(spot, next, spot.legToNext.transport);
  const entered = Number(spot.legToNext.durationMin);
  const effectiveMin = Number.isFinite(entered) && entered > 0 ? entered : estimatedMin;
  return {
    distanceMeters,
    distanceLabel: formatDistance(distanceMeters),
    estimatedMin,
    estimateLabel: estimatedMin ? `예상 ${estimatedMin}분` : "시간 미정",
    effectiveMin,
    severity: effectiveMin && effectiveMin >= 70 ? "hard" : effectiveMin && effectiveMin >= 45 ? "watch" : "ok",
  };
}

function estimateLegMinutes(spot: DraftSpot, next: DraftSpot, mode: TransportMode) {
  if (!hasCoords(spot) || !hasCoords(next)) return undefined;
  const meters = haversineMeters(spot, next);
  const speedKmh: Record<TransportMode, number> = {
    walk: 4,
    bike: 12,
    car: 28,
    taxi: 30,
    bus: 22,
    subway: 34,
    train: 42,
    other: 18,
  };
  const detourFactor: Record<TransportMode, number> = {
    walk: 1.18,
    bike: 1.22,
    car: 1.36,
    taxi: 1.34,
    bus: 1.45,
    subway: 1.55,
    train: 1.5,
    other: 1.3,
  };
  const minutes = ((meters / 1000) * detourFactor[mode]) / speedKmh[mode] * 60;
  return Math.max(3, Math.round(minutes / 5) * 5);
}

function routeDistance(spots: DraftSpot[]) {
  let total = 0;
  for (let i = 0; i < spots.length - 1; i += 1) {
    const a = spots[i];
    const b = spots[i + 1];
    if (!hasCoords(a) || !hasCoords(b)) continue;
    total += haversineMeters(a, b);
  }
  return total;
}

function hasCoords(spot: DraftSpot): spot is DraftSpot & { lat: number; lng: number } {
  return typeof spot.lat === "number" && typeof spot.lng === "number";
}

function formatMinutes(min: number) {
  if (min < 60) return `${min}분`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}시간 ${m}분` : `${h}시간`;
}

function PlanDraftMapSection({
  spots,
  legs,
  totalCount,
}: {
  spots: MapSpot[];
  legs: MapLeg[];
  totalCount: number;
}) {
  const locatedCount = spots.length;

  return (
    <>
      <StepHeading
        title="지도에서 전체 동선을 먼저 봐요"
        desc="스팟이 모두 보이도록 지도가 자동으로 맞춰져요. 위치와 순서를 먼저 확인한 뒤 세부 일정을 다듬어 보세요."
      />

      {locatedCount > 0 ? (
        <RouteMap spots={spots} legs={legs} />
      ) : (
        <div className="rounded-[var(--radius-card)] border border-dashed border-line bg-card px-4 py-10 text-center">
          <MapPinIcon />
          <p className="mt-3 text-[14px] font-bold text-ink">지도에 표시할 위치가 아직 없어요</p>
          <p className="mt-1 text-[12px] leading-relaxed text-ink-faint">
            아래 스팟에서 장소를 검색하거나 지도를 탭하면 전체 동선 지도가 만들어져요.
          </p>
        </div>
      )}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <PlanMapMetric label="전체 스팟" value={`${totalCount}곳`} />
        <PlanMapMetric label="지도 표시" value={`${locatedCount}곳`} />
      </div>
    </>
  );
}

function buildDraftRouteMap(spots: DraftSpot[]): { spots: MapSpot[]; legs: MapLeg[] } {
  const located = spots
    .map((spot, index) => ({ spot, index }))
    .filter(
      ({ spot }) => typeof spot.lat === "number" && typeof spot.lng === "number",
    );

  const mapSpots: MapSpot[] = located.map(({ spot, index }) => ({
    title: spot.title || `스팟 ${index + 1}`,
    lat: spot.lat as number,
    lng: spot.lng as number,
    label: index + 1,
  }));

  const mapLegs: MapLeg[] = located.slice(0, -1).map(({ spot, index }, i) => {
    const next = located[i + 1];
    const isConsecutive = next.index === index + 1;
    return {
      from: { lat: spot.lat as number, lng: spot.lng as number },
      to: { lat: next.spot.lat as number, lng: next.spot.lng as number },
      transport: isConsecutive ? spot.legToNext.transport : "other",
    };
  });

  return { spots: mapSpots, legs: mapLegs };
}

function PlanMapMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-card px-3 py-2.5">
      <div className="text-[11px] font-semibold text-ink-faint">{label}</div>
      <div className="mt-0.5 text-[15px] font-black text-ink">{value}</div>
    </div>
  );
}

function formatVisit(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}년 ${d.getMonth() + 1}월`;
}

/** Top-level region from reverse-geocoded parts: "시도 시군구" if uniform, else 시/도. */
/** Trim administrative suffixes so "강릉시" → "강릉", "강원특별자치도" → "강원". */
function shortRegionName(area?: string): string {
  if (!area) return "";
  const trimmed = area.replace(
    /(특별자치도|특별자치시|특별시|광역시|자치시|자치구|시|군|구|도)$/u,
    "",
  );
  return trimmed || area;
}

function deriveRegion(parts: { area1?: string; area2?: string }[]): string {
  const a1s = parts.map((p) => p.area1).filter((x): x is string => !!x);
  const distinct = [...new Set(a1s)];
  if (distinct.length === 0) return "";
  if (distinct.length > 1) return distinct.join("·");
  const a1 = distinct[0];
  const a2s = [
    ...new Set(
      parts.filter((p) => p.area1 === a1).map((p) => p.area2).filter((x): x is string => !!x),
    ),
  ];
  return a2s.length === 1 ? `${a1} ${a2s[0]}` : a1;
}

function distMeters(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la = (a.lat * Math.PI) / 180;
  const x = dLng * Math.cos(la);
  return Math.sqrt(x * x + dLat * dLat) * R;
}

function Stepper({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex border-b border-line bg-card px-2 py-2.5">
      {steps.map((label, i) => {
        const n = i + 1;
        const active = n === current;
        const done = n < current;
        return (
          <div key={label} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex w-full items-center">
              <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : n <= current ? "bg-sunset" : "bg-line"}`} />
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${
                  active ? "bg-sunset text-white" : done ? "bg-sunset/20 text-sunset" : "bg-muted text-ink-faint"
                }`}
              >
                {done ? "✓" : n}
              </span>
              <span className={`h-0.5 flex-1 ${i === steps.length - 1 ? "bg-transparent" : n < current ? "bg-sunset" : "bg-line"}`} />
            </div>
            <span className={`text-[10px] ${active ? "font-bold text-ink" : "text-ink-faint"}`}>{label}</span>
          </div>
        );
      })}
    </div>
  );
}

function StepHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="pb-4 pt-5">
      <h2 className="text-[19px] font-black leading-snug text-ink">{title}</h2>
      <p className="mt-1 text-[13px] leading-relaxed text-ink-soft">{desc}</p>
    </div>
  );
}

function CopyContextBanner({ context }: { context?: RouteCopyContext | null }) {
  if (!context) return null;

  const isPlan = context.purpose === "plan";
  return (
    <section className="mt-4 rounded-[var(--radius-card)] border border-sunset/25 bg-sunset-wash/60 p-4">
      <div className="inline-flex rounded-full bg-card px-2.5 py-1 text-[11px] font-bold text-sunset-ink ring-1 ring-sunset/15">
        {isPlan ? "여행 계획 초안" : "여행 기록 초안"}
      </div>
      <h2 className="mt-3 text-[18px] font-black leading-tight text-ink">
        {isPlan ? "여행 계획 초안이 만들어졌어요" : "내 여행 기록으로 가져왔어요"}
      </h2>
      <p className="mt-1.5 text-[13px] leading-relaxed text-ink-soft">
        {isPlan
          ? "원본 루트의 장소와 이동 정보를 바탕으로, 지도에서 동선을 먼저 확인하고 내 일정에 맞게 다듬어 보세요."
          : "이미 다녀온 장소에 사진과 그날의 감상을 채워 나만의 코스 기록으로 완성해 보세요."}
      </p>
      {context.original && (
        <Link
          href={`/routes/${context.original.id}`}
          className="mt-3 block truncate text-[12px] font-semibold text-sunset-ink underline-offset-2 hover:underline"
        >
          {context.original.author.displayName}님의 ‘{context.original.title}’에서 시작
        </Link>
      )}
    </section>
  );
}

function MapPinIcon() {
  return (
    <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-muted text-ink-soft" aria-hidden>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
        <path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" stroke="currentColor" strokeWidth="1.8" />
        <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    </span>
  );
}

function SearchSmallIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 text-ink-faint">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
      <path d="m20 20-3.5-3.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SpotDot({ n }: { n: number }) {
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sunset text-[11px] font-bold text-white">
      {n}
    </span>
  );
}

function PreviewChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-sunset-wash px-2.5 py-1 text-[11px] font-medium text-sunset-ink">{children}</span>
  );
}

function SortableSpot({
  id,
  children,
}: {
  id: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  children: (handle: { attributes: any; listeners: any }) => React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.85 : 1,
    position: "relative",
    zIndex: isDragging ? 20 : undefined,
  };
  return (
    <div ref={setNodeRef} style={style}>
      {children({ attributes, listeners })}
    </div>
  );
}

function DragIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 6h.01M15 6h.01M9 12h.01M15 12h.01M9 18h.01M15 18h.01" />
    </svg>
  );
}

/** "대표" cover label — top-left so it never overlaps the top-right ✕ delete. */
function CoverBadge() {
  return (
    <span className="pointer-events-none absolute left-1 top-1 rounded-md bg-ink/85 px-1.5 py-0.5 text-[10px] font-bold leading-none text-paper shadow-sm">
      대표
    </span>
  );
}

/**
 * A reorderable photo thumbnail. The whole tile is the drag handle (the tiles
 * are too small for a separate grip); press-and-hold to pick it up. The ✕ delete
 * stops pointer propagation so a tap removes instead of starting a drag.
 */
function SortablePhoto({
  id,
  preview,
  isCover,
  onRemove,
}: {
  id: string;
  preview: string;
  isCover: boolean;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 30 : undefined,
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="relative h-20 w-20 cursor-grab overflow-hidden rounded-lg bg-line active:cursor-grabbing"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="" className="pointer-events-none h-full w-full object-cover" draggable={false} />
      {isCover && <CoverBadge />}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/55 text-[11px] text-white"
        aria-label="사진 삭제"
      >
        ✕
      </button>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 8a2 2 0 0 1 2-2h2l1.2-1.6a1 1 0 0 1 .8-.4h6a1 1 0 0 1 .8.4L19 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8Z" />
      <circle cx="12" cy="12.5" r="3.2" />
    </svg>
  );
}

function ChevronLeftIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="m15 5-7 7 7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ChevronRightIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M6 6 18 18M18 6 6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function SortIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M7 4v15m0 0-3-3m3 3 3-3M17 20V5m0 0-3 3m3-3 3 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ArrowDownIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path d="M12 4v14m0 0-5-5m5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  required,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  inputMode?: "numeric" | "text";
}) {
  return (
    <label className="mb-3 block">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">
        {label}
        {required && <span className="text-sunset"> *</span>}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="w-full rounded-xl border border-line bg-card px-3 py-2.5 text-[14px] text-ink outline-none placeholder:text-ink-faint focus:border-sunset"
      />
    </label>
  );
}

/** Tappable field that opens a sheet; shows the selected value or a placeholder. */
function SelectTrigger({
  label,
  value,
  placeholder,
  onClick,
}: {
  label: string;
  value: string;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <div className="mb-3">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">{label}</span>
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-between rounded-xl border border-line bg-card px-3 py-2.5 text-left text-[14px]"
      >
        <span className={value ? "text-ink" : "text-ink-faint"}>{value || placeholder}</span>
        <ChevronRightIcon className="h-4 w-4 shrink-0 text-ink-faint" />
      </button>
    </div>
  );
}

/** Non-editable display field (e.g. auto-filled visit time). */
function ReadonlyField({
  label,
  value,
  placeholder,
}: {
  label: string;
  value: string;
  placeholder: string;
}) {
  return (
    <div className="mb-3">
      <span className="mb-1.5 block text-[12px] font-medium text-ink-soft">{label}</span>
      <div className="w-full rounded-xl border border-line bg-muted px-3 py-2.5 text-[14px]">
        <span className={value ? "text-ink" : "text-ink-faint"}>{value || placeholder}</span>
      </div>
    </div>
  );
}
