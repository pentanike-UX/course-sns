/**
 * Build coursee brand assets from generated lockup/mark PNGs.
 * Symbol-only → favicon / app icons. Full lockup → OG / Twitter.
 */
import sharp from "sharp";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const MARK = path.join(ROOT, "public/brand/coursee-mark-black.png");
const LOCKUP = path.join(ROOT, "public/brand/coursee-lockup-black.png");
const ICONS = path.join(ROOT, "public/icons");
const APP = path.join(ROOT, "public");
const APP_DIR = path.join(ROOT, "src/app");

/** Crisp SVG mark — white ring + C + red motion dots on black (512). */
const MARK_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" fill="#000000"/>
  <!-- outer white ring -->
  <circle cx="256" cy="256" r="198" stroke="#FFFFFF" stroke-width="28" fill="none"/>
  <!-- geometric C -->
  <path
    d="M 318 142
       A 148 148 0 1 0 318 370"
    stroke="#FFFFFF"
    stroke-width="56"
    stroke-linecap="round"
    fill="none"
  />
  <!-- motion trail (left → right, growing) -->
  <circle cx="286" cy="256" r="14" fill="#FF0000" fill-opacity="0.28"/>
  <circle cx="318" cy="256" r="18" fill="#FF0000" fill-opacity="0.55"/>
  <circle cx="354" cy="256" r="22" fill="#FF0000"/>
</svg>
`;

/** Full lockup SVG for dark surfaces (wordmark coursee). */
const LOCKUP_SVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="400" viewBox="0 0 1200 400" fill="none">
  <rect width="1200" height="400" fill="#000000"/>
  <g transform="translate(80,48)">
    <circle cx="152" cy="152" r="140" stroke="#FFFFFF" stroke-width="20" fill="none"/>
    <path
      d="M 196 72
         A 104 104 0 1 0 196 232"
      stroke="#FFFFFF"
      stroke-width="40"
      stroke-linecap="round"
      fill="none"
    />
    <circle cx="170" cy="152" r="10" fill="#FF0000" fill-opacity="0.28"/>
    <circle cx="192" cy="152" r="13" fill="#FF0000" fill-opacity="0.55"/>
    <circle cx="218" cy="152" r="16" fill="#FF0000"/>
  </g>
  <text
    x="440" y="230"
    fill="#FFFFFF"
    font-family="Inter, Arial, Helvetica, sans-serif"
    font-size="120"
    font-weight="700"
    letter-spacing="-2"
  >coursee</text>
</svg>
`;

async function pngFromSvg(svg, size) {
  return sharp(Buffer.from(svg)).resize(size, size).png().toBuffer();
}

async function main() {
  await mkdir(ICONS, { recursive: true });
  await writeFile(path.join(ICONS, "icon.svg"), MARK_SVG);
  await writeFile(path.join(ICONS, "logo-full.svg"), LOCKUP_SVG);

  // Prefer generated raster mark when available; fall back to SVG render.
  let markBuf;
  try {
    markBuf = await readFile(MARK);
  } catch {
    markBuf = await pngFromSvg(MARK_SVG, 1024);
  }

  const sizes = [
    ["icon-512.png", 512],
    ["icon-192.png", 192],
    ["apple-touch-icon.png", 180],
  ];
  for (const [name, size] of sizes) {
    await sharp(markBuf)
      .resize(size, size, { fit: "cover" })
      .png()
      .toFile(path.join(ICONS, name));
    console.log("wrote", name);
  }

  // favicon.ico via multi-size PNG pack (16/32/48) — write PNG favicon + ico-compatible
  // Prefer app/icon.png (Next file convention). Skip .ico — Turbopack is strict about PNG-in-ICO RGBA.
  await sharp(markBuf)
    .ensureAlpha()
    .resize(32, 32)
    .png()
    .toFile(path.join(APP_DIR, "icon.png"));
  await sharp(markBuf)
    .ensureAlpha()
    .resize(32, 32)
    .png()
    .toFile(path.join(APP, "favicon.png"));
  console.log("wrote icon.png + favicon.png");

  // Full lockup → OG / Twitter (1200x630)
  let lockupBuf;
  try {
    lockupBuf = await readFile(LOCKUP);
  } catch {
    lockupBuf = await sharp(Buffer.from(LOCKUP_SVG)).png().toBuffer();
  }

  const og = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 3,
      background: "#000000",
    },
  })
    .composite([
      {
        input: await sharp(lockupBuf)
          .resize({ width: 980, height: 420, fit: "inside" })
          .png()
          .toBuffer(),
        gravity: "center",
      },
    ])
    .png()
    .toBuffer();

  await sharp(og).toFile(path.join(APP_DIR, "opengraph-image.png"));
  await sharp(og).toFile(path.join(APP_DIR, "twitter-image.png"));
  await sharp(lockupBuf)
    .resize({ width: 800 })
    .png()
    .toFile(path.join(ICONS, "logo-full.png"));
  console.log("wrote opengraph/twitter + logo-full.png");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
