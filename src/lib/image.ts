"use client";

/**
 * Client-side image downscale + WebP re-encode before upload.
 *
 * Phone photos are routinely 3–10MB; the app renders them at ~430px width,
 * so re-encoding at a bounded edge cuts Storage usage and upload/LCP time
 * by an order of magnitude. EXIF is stripped by the canvas — callers that
 * need GPS/타임스탬프 (RouteForm autofill) must read it from the *original*
 * file before compressing; uploads happen after, so nothing is lost.
 *
 * Every failure path returns the original file — a photo the browser can't
 * decode (e.g. HEIC on some engines) still uploads as-is.
 */

type CompressOptions = {
  /** longest edge of the output, px */
  maxEdge?: number;
  /** WebP quality 0..1 */
  quality?: number;
};

const DEFAULT_MAX_EDGE = 1600;
const DEFAULT_QUALITY = 0.82;
/** below this size re-encoding rarely pays for itself */
const SKIP_BELOW_BYTES = 200 * 1024;

export async function compressImage(
  file: File,
  opts: CompressOptions = {},
): Promise<File> {
  const { maxEdge = DEFAULT_MAX_EDGE, quality = DEFAULT_QUALITY } = opts;

  if (!file.type.startsWith("image/")) return file;
  // animation would be flattened / vectors gain nothing
  if (file.type === "image/gif" || file.type === "image/svg+xml") return file;
  if (file.size < SKIP_BELOW_BYTES) return file;

  let bitmap: ImageBitmap;
  try {
    // createImageBitmap applies EXIF orientation, so the pixels are upright
    bitmap = await createImageBitmap(file);
  } catch {
    return file;
  }

  try {
    const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
    const w = Math.max(1, Math.round(bitmap.width * scale));
    const h = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/webp", quality),
    );
    // keep the original when webp isn't supported or didn't actually shrink it
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;

    const base = file.name.replace(/\.[^.]+$/, "") || "photo";
    return new File([blob], `${base}.webp`, { type: "image/webp" });
  } catch {
    return file;
  } finally {
    bitmap.close();
  }
}

/** Map with bounded concurrency — image decode/encode is memory-heavy. */
export async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const i = next++;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}
