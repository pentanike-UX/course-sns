/**
 * Rasterize official SVG brand assets (sharp).
 * Sources: public/icons/logo-mark-*.svg, logo-full-*.svg
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const iconsDir = join(root, "public", "icons");
const appDir = join(root, "src", "app");

const markLight = readFileSync(join(iconsDir, "logo-mark-light.svg"));
const markDark = readFileSync(join(iconsDir, "logo-mark-dark.svg"));
const fullLight = readFileSync(join(iconsDir, "logo-full-light.svg"));
const fullDark = readFileSync(join(iconsDir, "logo-full-dark.svg"));

async function pngFromSvg(svgBuf, width, height) {
  return sharp(svgBuf, { density: 300 })
    .resize(width, height, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
}

async function main() {
  mkdirSync(iconsDir, { recursive: true });
  mkdirSync(appDir, { recursive: true });

  // App icons / favicon — light mark (works on light & as default)
  writeFileSync(join(iconsDir, "icon-192.png"), await pngFromSvg(markLight, 192, 192));
  writeFileSync(join(iconsDir, "icon-512.png"), await pngFromSvg(markLight, 512, 512));
  writeFileSync(join(iconsDir, "apple-touch-icon.png"), await pngFromSvg(markLight, 180, 180));
  writeFileSync(join(appDir, "icon.png"), await pngFromSvg(markLight, 32, 32));

  // Also keep dark mark raster for splash / dark UI
  writeFileSync(join(iconsDir, "logo-mark-light.png"), await pngFromSvg(markLight, 512, 512));
  writeFileSync(join(iconsDir, "logo-mark-dark.png"), await pngFromSvg(markDark, 512, 512));

  // Full lockups
  writeFileSync(join(iconsDir, "logo-full-light.png"), await pngFromSvg(fullLight, 1102, 280));
  writeFileSync(join(iconsDir, "logo-full-dark.png"), await pngFromSvg(fullDark, 1102, 280));
  // Backward-compatible default (light lockup)
  writeFileSync(join(iconsDir, "logo-full.png"), await pngFromSvg(fullLight, 1102, 280));

  // OG / Twitter — light lockup on white
  const ogW = 1200;
  const ogH = 630;
  const lockup = await sharp(fullLight, { density: 300 })
    .resize(720, null, { fit: "inside" })
    .png()
    .toBuffer();
  const og = await sharp({
    create: {
      width: ogW,
      height: ogH,
      channels: 3,
      background: { r: 255, g: 255, b: 255 },
    },
  })
    .composite([{ input: lockup, gravity: "centre" }])
    .png()
    .toBuffer();
  writeFileSync(join(iconsDir, "og-image.png"), og);
  writeFileSync(join(iconsDir, "twitter-image.png"), og);
  // Next.js metadata file conventions
  writeFileSync(join(appDir, "opengraph-image.png"), og);
  writeFileSync(join(appDir, "twitter-image.png"), og);

  console.log("Brand assets written from official SVG lockups.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
