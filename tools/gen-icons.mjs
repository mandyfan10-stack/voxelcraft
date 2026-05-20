// tools/gen-icons.mjs — Generate PNG app icons with zero npm dependencies.
//
// Writes icon-180.png (apple-touch-icon), icon-192.png, icon-512.png.
// Uses only node:fs + node:zlib + a hand-written PNG encoder so no binary
// blobs need to be committed and no extra deps slow down CI.
//
// Style: dark VoxelFear background + stenciled bone "V" + a single blood
// drip at the apex. Matches the in-game distress palette.

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const BG     = [10, 9, 8];       // var(--ink)
const FG     = [216, 210, 196];  // var(--bone)
const ACCENT = [204, 34, 0];     // var(--blood)

// CRC-32 — required by PNG chunk format.
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

function rgbToPng(rgb, size) {
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8]  = 8;   // 8-bit depth
  ihdr[9]  = 2;   // color type 2 = RGB
  ihdr[10] = 0;   // compression: deflate
  ihdr[11] = 0;   // filter: adaptive
  ihdr[12] = 0;   // interlace: none

  const rowLen = size * 3;
  const raw = Buffer.alloc((rowLen + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (rowLen + 1)] = 0;  // filter byte (None)
    rgb.copy(raw, y * (rowLen + 1) + 1, y * rowLen, (y + 1) * rowLen);
  }
  const compressed = deflateSync(raw, { level: 9 });

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function lineDist(px, py, x0, y0, x1, y1) {
  const dx = x1 - x0, dy = y1 - y0;
  const len2 = dx * dx + dy * dy;
  let t = ((px - x0) * dx + (py - y0) * dy) / len2;
  if (t < 0) t = 0; else if (t > 1) t = 1;
  const qx = x0 + t * dx, qy = y0 + t * dy;
  return Math.hypot(px - qx, py - qy);
}

function paintIcon(size) {
  const buf = Buffer.alloc(size * size * 3);

  const cx = size / 2;
  const apexY = size * 0.80;
  const wingTopY = size * 0.20;
  const wingDx = size * 0.32;
  const stroke = size * 0.13;
  const apexHalo = stroke * 0.7;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 3;

      // Distance to either V leg.
      const dL = lineDist(x, y, cx - wingDx, wingTopY, cx, apexY);
      const dR = lineDist(x, y, cx + wingDx, wingTopY, cx, apexY);
      const d  = Math.min(dL, dR);

      let r, g, b;
      if (d < stroke) {
        // The "V" — bone with a faint inner highlight.
        const t = 1 - d / stroke;
        const hi = Math.floor(t * 10);
        r = Math.min(255, FG[0] + hi);
        g = Math.min(255, FG[1] + hi);
        b = Math.min(255, FG[2] + hi);
      } else {
        // Background with a soft radial vignette → corners darker.
        const fromCenter = Math.hypot(x - cx, y - cx) / cx;
        const tint = Math.max(0, 6 - Math.floor(fromCenter * 6));
        r = BG[0] + tint; g = BG[1] + tint; b = BG[2] + tint;
      }

      // Blood drip below the apex.
      const dApex = Math.hypot(x - cx, y - apexY);
      if (y > apexY && dApex < apexHalo + (y - apexY) * 0.4 && (y - apexY) < size * 0.12) {
        r = ACCENT[0]; g = ACCENT[1]; b = ACCENT[2];
      }

      buf[i] = r; buf[i + 1] = g; buf[i + 2] = b;
    }
  }
  return buf;
}

const SIZES = [180, 192, 512];
for (const size of SIZES) {
  const rgb = paintIcon(size);
  const png = rgbToPng(rgb, size);
  const path = new URL('../icon-' + size + '.png', import.meta.url);
  writeFileSync(path, png);
  console.log('wrote icon-' + size + '.png (' + png.length + ' bytes)');
}
