#!/usr/bin/env node
/*
 * Builds the pixel-art, 2002-era Windows style mouse pointers in assets/cursors/
 * (1x and 2x PNGs). No dependencies: a tiny PNG encoder on top of node's zlib.
 *
 *   node tools/make-cursors.js
 */
'use strict';

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT = path.join(__dirname, '..', 'assets', 'cursors');

const COLORS = {
  B: [0, 0, 0, 255],
  W: [255, 255, 255, 255],
  S: [222, 176, 70, 255], // hourglass sand
};

// The classic arrow: white fill, black outline. Hotspot 0,0.
const ARROW = [
  'B',
  'BB',
  'BWB',
  'BWWB',
  'BWWWB',
  'BWWWWB',
  'BWWWWWB',
  'BWWWWWWB',
  'BWWWWWWWB',
  'BWWWWWWWWB',
  'BWWWWWBBBBB',
  'BWWBWWB',
  'BWB BWWB',
  'BB  BWWB',
  'B    BWWB',
  '     BWWB',
  '      BWWB',
  '      BWWB',
  '       BB',
];

// The "link select" pointing hand. Hotspot 5,0 (tip of the index finger).
const HAND = [
  '     BB',
  '    BWWB',
  '    BWWB',
  '    BWWB',
  '    BWWB',
  '    BWWBBB',
  '    BWWBWWBBB',
  '    BWWBWWBWWBB',
  '    BWWBWWBWWBWB',
  'BBB BWWBWWBWWBWWB',
  'BWWBBWWWWWWWWBWWB',
  'BWWWBWWWWWWWWWWWB',
  ' BWWWWWWWWWWWWWWB',
  '  BWWWWWWWWWWWWWB',
  '  BWWWWWWWWWWWWWB',
  '   BWWWWWWWWWWWB',
  '   BWWWWWWWWWWWB',
  '    BWWWWWWWWWB',
  '    BWWWWWWWWWB',
  '     BWWWWWWWWB',
  '     BBBBBBBBBB',
];

// "Working in background": the arrow with a little hourglass.
const HOURGLASS = [
  'BBBBBBBBBBB',
  'BWWWWWWWWWB',
  'BBBBBBBBBBB',
  ' BWWWWWWWB',
  ' BWWWWWWWB',
  ' BWSSSSSWB',
  '  BWSSSWB',
  '   BWSWB',
  '   BWSWB',
  '  BWWSWWB',
  ' BWWWSWWWB',
  ' BWWSSSWWB',
  ' BWSSSSSWB',
  'BBBBBBBBBBB',
  'BWWWWWWWWWB',
  'BBBBBBBBBBB',
];

function canvas(w, h) {
  return { w, h, data: new Uint8ClampedArray(w * h * 4) };
}

function put(cv, x, y, [r, g, b, a]) {
  if (x < 0 || y < 0 || x >= cv.w || y >= cv.h) return;
  const i = (y * cv.w + x) * 4;
  const d = cv.data;
  const sa = a / 255;
  const da = d[i + 3] / 255;
  const oa = sa + da * (1 - sa);
  if (!oa) return;
  d[i] = (r * sa + d[i] * da * (1 - sa)) / oa;
  d[i + 1] = (g * sa + d[i + 1] * da * (1 - sa)) / oa;
  d[i + 2] = (b * sa + d[i + 2] * da * (1 - sa)) / oa;
  d[i + 3] = oa * 255;
}

// Draws pixel art with the soft lower-right drop shadow XP cursors had.
function stamp(cv, art, ox, oy) {
  const shadow = new Map();
  art.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (!COLORS[ch]) return;
      for (const [dx, dy, a] of [[1, 1, 80], [2, 2, 45]]) {
        const k = `${ox + x + dx},${oy + y + dy}`;
        shadow.set(k, Math.max(shadow.get(k) || 0, a));
      }
    })
  );
  for (const [k, a] of shadow) {
    const [x, y] = k.split(',').map(Number);
    put(cv, x, y, [0, 0, 0, a]);
  }
  art.forEach((row, y) =>
    [...row].forEach((ch, x) => {
      if (COLORS[ch]) put(cv, ox + x, oy + y, COLORS[ch]);
    })
  );
}

function scale(cv, k) {
  const out = canvas(cv.w * k, cv.h * k);
  for (let y = 0; y < out.h; y++) {
    for (let x = 0; x < out.w; x++) {
      const s = ((y / k | 0) * cv.w + (x / k | 0)) * 4;
      const t = (y * out.w + x) * 4;
      out.data.set(cv.data.subarray(s, s + 4), t);
    }
  }
  return out;
}

const CRC = new Int32Array(256).map((_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c;
});

function crc32(buf) {
  let c = -1;
  for (const b of buf) c = CRC[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ -1) >>> 0;
}

function png(cv) {
  const { w, h, data } = cv;
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    Buffer.from(data.buffer, y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
  }
  const chunk = (type, body) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(body.length);
    const tb = Buffer.concat([Buffer.from(type, 'ascii'), body]);
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(crc32(tb));
    return Buffer.concat([len, tb, crc]);
  };
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function build(name, draw) {
  const cv = canvas(32, 32);
  draw(cv);
  fs.writeFileSync(path.join(OUT, `${name}.png`), png(cv));
  fs.writeFileSync(path.join(OUT, `${name}@2x.png`), png(scale(cv, 2)));
  console.log(`  ${name}.png, ${name}@2x.png`);
}

fs.mkdirSync(OUT, { recursive: true });
console.log('Writing cursors to', path.relative(process.cwd(), OUT) || '.');
build('arrow', (cv) => stamp(cv, ARROW, 0, 0));
build('hand', (cv) => stamp(cv, HAND, 0, 0));
build('busy', (cv) => {
  stamp(cv, ARROW, 0, 0);
  stamp(cv, HOURGLASS, 10, 11);
});
