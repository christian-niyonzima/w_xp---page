#!/usr/bin/env node
/*
 * Renders tools/wallpaper.svg (the hand-drawn rolling hills) to assets/wallpaper.jpg.
 * SVG filters render slightly differently per browser, so the site ships the JPG.
 *
 *   node tools/make-wallpaper.js        (needs Playwright: npm i -D playwright)
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const SRC = path.join(__dirname, 'wallpaper.svg');
const OUT = path.join(__dirname, '..', 'assets', 'wallpaper.jpg');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 2560, height: 1600 } });
  await page.setContent(`<body style="margin:0">${fs.readFileSync(SRC, 'utf8')}</body>`);
  await page.waitForTimeout(300);
  await page.screenshot({ path: OUT, type: 'jpeg', quality: 88 });
  await browser.close();
  console.log('Wrote', path.relative(process.cwd(), OUT), `(${Math.round(fs.statSync(OUT).size / 1024)} KB)`);
})();
