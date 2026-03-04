/* eslint-env node */

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Buffer } from 'node:buffer'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const width = 16;
const height = 16;

// ICONDIR
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type=icon
header.writeUInt16LE(1, 4); // count

// BITMAPINFOHEADER (DIB)
const dib = Buffer.alloc(40);
dib.writeUInt32LE(40, 0); // header size

dib.writeInt32LE(width, 4);
dib.writeInt32LE(height * 2, 8); // XOR+AND

dib.writeUInt16LE(1, 12); // planes

dib.writeUInt16LE(32, 14); // bpp

dib.writeUInt32LE(0, 16); // BI_RGB

dib.writeUInt32LE(width * height * 4, 20); // size image

dib.writeInt32LE(0, 24);
dib.writeInt32LE(0, 28);
dib.writeUInt32LE(0, 32);
dib.writeUInt32LE(0, 36);

// XOR pixels (BGRA), bottom-up
const pixels = Buffer.alloc(width * height * 4);
const cx = (width - 1) / 2;
const cy = (height - 1) / 2;
const r = 7;

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const inside = dx * dx + dy * dy <= r * r;

    const alpha = inside ? 255 : 0;

    // Base color #2e7d32 with small highlight.
    let red = 0x2e;
    let green = 0x7d;
    let blue = 0x32;
    if (inside && x + y < 14) {
      red = 0x66;
      green = 0xbb;
      blue = 0x6a;
    }

    const row = height - 1 - y; // bottom-up
    const idx = (row * width + x) * 4;
    pixels[idx + 0] = blue;
    pixels[idx + 1] = green;
    pixels[idx + 2] = red;
    pixels[idx + 3] = alpha;
  }
}

// AND mask (1 bit per pixel), 1 = transparent
const maskRowBytes = (((width + 31) >> 5) << 2); // row aligned to 32 bits
const mask = Buffer.alloc(maskRowBytes * height);

for (let y = 0; y < height; y++) {
  for (let x = 0; x < width; x++) {
    const dx = x - cx;
    const dy = y - cy;
    const inside = dx * dx + dy * dy <= r * r;
    const transparent = !inside;

    const byteIndex = y * maskRowBytes + (x >> 3);
    const bit = 7 - (x & 7);
    if (transparent) mask[byteIndex] |= 1 << bit;
  }
}

const imageData = Buffer.concat([dib, pixels, mask]);

// ICONDIRENTRY
const entry = Buffer.alloc(16);
entry.writeUInt8(width, 0);
entry.writeUInt8(height, 1);
entry.writeUInt8(0, 2); // palette
entry.writeUInt8(0, 3);
entry.writeUInt16LE(1, 4); // planes
entry.writeUInt16LE(32, 6); // bpp
entry.writeUInt32LE(imageData.length, 8);
entry.writeUInt32LE(6 + 16, 12); // offset

const ico = Buffer.concat([header, entry, imageData]);

const outDir = path.join(__dirname, '..', 'public');
const outFile = path.join(outDir, 'favicon.ico');

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, ico);

console.log('Wrote', outFile, 'bytes=', ico.length);
