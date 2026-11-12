#!/usr/bin/env node
/*
 * Renders the images other sites use to show this page:
 *   assets/social-card.jpg        1200×630 link preview (LinkedIn, Slack, X, WhatsApp…)
 *   assets/icons/icon-192.png     home-screen / install icons (also "maskable")
 *   assets/icons/icon-512.png
 *   assets/icons/apple-touch-icon.png (180×180)
 *
 *   node tools/make-share-images.js     (needs Playwright: npm install)
 *
 * Re-run it after changing your name, title or photo in js/data.js.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { pathToFileURL } = require('url');
const { chromium } = require('playwright');

const ROOT = path.join(__dirname, '..');
const ICONS = path.join(ROOT, 'assets', 'icons');
const flag = fs.readFileSync(path.join(ROOT, 'assets', 'favicon.svg'), 'utf8');

// The four-colour flag on a Luna-blue tile. The flag stays inside the central 60%,
// so the same picture also works as a "maskable" icon that phones crop into circles.
const iconHTML = (size) => `<body style="margin:0">
  <div style="width:${size}px;height:${size}px;display:grid;place-items:center;
    background:radial-gradient(circle at 30% 25%,#5aa0ff 0%,#2563df 45%,#0a3fb8 100%)">
    <div style="width:${size * 0.6}px;height:${size * 0.6}px;filter:drop-shadow(0 ${size / 64}px ${size / 40}px rgba(0,0,0,.35))">
      ${flag.replace('<svg ', '<svg width="100%" height="100%" ')}
    </div>
  </div></body>`;

(async () => {
  fs.mkdirSync(ICONS, { recursive: true });
  const browser = await chromium.launch();

  for (const [file, size] of [['icon-192.png', 192], ['icon-512.png', 512], ['apple-touch-icon.png', 180]]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(iconHTML(size));
    await page.screenshot({ path: path.join(ICONS, file) });
    await page.close();
    console.log('Wrote', path.join('assets', 'icons', file));
  }

  // The real desktop with the profile open, exactly as visitors will see it.
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.addInitScript(() => {
    sessionStorage.setItem('xp:checklist', '1'); // no owner checklist balloon in the picture
    localStorage.setItem('xp:motion', '0'); // no half-finished animations either
  });
  await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + '#about/profile');
  await page.waitForSelector('.win-explorer .profile-hero');
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    document.getElementById('balloon').hidden = true;
    const win = document.querySelector('.win-explorer');
    win.style.left = '230px'; // clear of the second column of desktop icons
    document.querySelectorAll('.d-icon.is-selected').forEach((d) => d.classList.remove('is-selected'));
  });
  const out = path.join(ROOT, 'assets', 'social-card.jpg');
  await page.screenshot({ path: out, type: 'jpeg', quality: 85 });
  console.log('Wrote', path.relative(ROOT, out), `(${Math.round(fs.statSync(out).size / 1024)} KB)`);
  await browser.close();
})();
