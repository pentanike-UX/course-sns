import exifr from "exifr";

export type PhotoGeo = {
  lat?: number;
  lng?: number;
  /** capture time (ms epoch) — EXIF DateTimeOriginal, else the file's mtime */
  takenAt: number;
};

/**
 * Read GPS + capture time from a photo's EXIF.
 * Returns lat/lng only when present (screenshots, stripped images, etc. won't
 * have GPS), and always a `takenAt` (falls back to the file's last-modified).
 */
/** Resolve to `null` instead of hanging — a huge HEIF can make exifr stall. */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  return Promise.race([
    p,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), ms)),
  ]);
}

export async function readPhotoGeo(file: File): Promise<PhotoGeo> {
  let lat: number | undefined;
  let lng: number | undefined;
  let takenAt = file.lastModified || Date.now();

  try {
    const data = await withTimeout(exifr.parse(file, { gps: true }), 4000);
    if (data && typeof data.latitude === "number" && typeof data.longitude === "number") {
      lat = data.latitude;
      lng = data.longitude;
    }
    const dt = data?.DateTimeOriginal ?? data?.CreateDate;
    if (dt) {
      const t = dt instanceof Date ? dt.getTime() : new Date(dt).getTime();
      if (!Number.isNaN(t)) takenAt = t;
    }
  } catch {
    // non-image / no EXIF — keep the mtime fallback
  }

  return { lat, lng, takenAt };
}
