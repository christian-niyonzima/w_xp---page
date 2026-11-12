// @ts-check
const { test, expect } = require('@playwright/test');
const path = require('path');

/** Skip the boot screen, animations and the owner checklist, and fail on any script error. */
async function prepare(page, { motion = false, booted = true } = {}) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
  await page.addInitScript(
    ({ motion, booted }) => {
      if (booted) sessionStorage.setItem('xp:booted', '1');
      sessionStorage.setItem('xp:checklist', '1');
      localStorage.setItem('xp:motion', motion ? '1' : '0');
    },
    { motion, booted }
  );
  return errors;
}

const activeTitle = (page) => page.locator('.window:not(.is-inactive):not(.is-min) .tb-title').first();

test('boots, logs on and shows the desktop', async ({ page }) => {
  const errors = await prepare(page, { motion: true, booted: false });
  await page.goto('/');
  await expect(page.locator('#screen-boot')).toBeVisible();
  await page.locator('#screen-boot').click(); // click to skip
  await expect(page.locator('#screen-welcome')).toBeVisible();
  await page.locator('.wl-user[data-user="user"]').click();
  await expect(page.locator('#screen-desktop')).toBeVisible({ timeout: 8000 });
  await expect(page.locator('.d-icon')).toHaveCount(8);
  await expect(page.locator('.d-icon[data-id="resume"]')).toBeVisible();
  await expect(page.locator('#taskbar')).toBeVisible();
  expect(errors).toEqual([]);
});

test('folders open items and keep the address bar shareable', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#about');
  await expect(activeTitle(page)).toHaveText('About Me');
  await page.locator('.ex-item[data-id="profile"]').focus();
  await page.keyboard.press('Enter');
  await expect(activeTitle(page)).toHaveText('Profile');
  await expect(page).toHaveURL(/#about\/profile$/);
  await page.locator('.win-explorer .tool[data-act="up"]').click();
  await expect(page).toHaveURL(/#about$/);
  await page.locator('.win-explorer .tb-close').click();
  await expect(page).not.toHaveURL(/#/);
  expect(errors).toEqual([]);
});

test('deep links open a single project', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#projects/xp-career-desktop');
  await expect(page.locator('.ex-face-doc h1')).toHaveText('XP Career Desktop');
  await page.locator('.doc-step [data-step="1"]').click();
  await expect(page).toHaveURL(/#projects\/(?!xp-career-desktop)[a-z0-9-]+$/);
  expect(errors).toEqual([]);
});

test('the résumé opens, and printing always prints it', async ({ page, browserName }) => {
  const errors = await prepare(page);
  await page.goto('/#resume');
  const win = page.locator('.win-resume');
  await expect(win.locator('.cv h1')).toHaveText('Christian Niyonzima');
  await expect(win.locator('.cv-sec h2')).toContainText(['Profile', 'Experience', 'Projects', 'Education', 'Skills']);
  await page.evaluate(() => window.dispatchEvent(new Event('beforeprint')));
  await expect(page.locator('#print-root .cv')).toHaveCount(1);
  await expect(page).toHaveTitle(/Résumé/);
  await page.evaluate(() => window.dispatchEvent(new Event('afterprint')));
  await expect(page.locator('#print-root')).toHaveCount(0);
  if (browserName === 'chromium') expect((await page.pdf({ format: 'A4' })).length).toBeGreaterThan(10_000);
  expect(errors).toEqual([]);
});

test('the Matrix terminal runs commands', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#terminal');
  const term = page.locator('#screen-matrix');
  await expect(term).toBeVisible();
  await expect(page.locator('.term-input')).toBeFocused({ timeout: 5000 });
  await page.keyboard.press('x'); // skips the intro without typing it
  await expect(page.locator('.t-callout')).toBeVisible({ timeout: 5000 });
  await expect(page.locator('.term-input')).toHaveValue('');
  await page.keyboard.type('help');
  await page.keyboard.press('Enter');
  await expect(term.locator('.t-title').filter({ hasText: 'AVAILABLE COMMANDS' })).toBeVisible();
  await page.keyboard.type('cd projects && ls');
  await page.keyboard.press('Enter');
  await expect(term.locator('.term-title')).toHaveText(/~\/projects$/);
  await expect(term.locator('.term-out')).toContainText('xp_career_desktop.txt');
  await page.keyboard.type('exit');
  await page.keyboard.press('Enter');
  await expect(term).toBeHidden({ timeout: 5000 });
  expect(errors).toEqual([]);
});

test('placeholder links never reach visitors', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#contact');
  await expect(page.locator('.contact-list')).toBeVisible();
  await page.evaluate(() => XP.open('browser'));
  await expect(page.locator('.link-card').first()).toBeVisible();
  const hrefs = await page.$$eval('a[href]', (as) => as.map((a) => a.getAttribute('href')));
  expect(hrefs.length).toBeGreaterThan(3);
  for (const h of hrefs) expect(h).not.toMatch(/your-profile|@example\.com/);
  expect(errors).toEqual([]);
});

test('search finds things across folders', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#search');
  await page.locator('.ex-search input').fill('python');
  await expect(page.locator('.ex-results .ex-item').first()).toBeVisible();
  await page.locator('.ex-search input').fill('zzzz-nothing');
  await expect(page.locator('.ex-results .ex-empty')).toContainText('no results');
  expect(errors).toEqual([]);
});

test('Display Properties is single-instance and changes the wallpaper', async ({ page }) => {
  const errors = await prepare(page);
  await page.goto('/#desktop');
  await page.evaluate(() => {
    XP.open('display');
    XP.open('display');
  });
  await expect(page.locator('.window')).toHaveCount(1);
  await page.locator('.dp-opt[data-wall="azul"]').click();
  await page.locator('.dp-btns [data-act="ok"]').click();
  await expect(page.locator('.window')).toHaveCount(0);
  expect(await page.locator('#wallpaper').evaluate((el) => el.style.background)).toContain('gradient');
  expect(errors).toEqual([]);
});

test('Minesweeper: the first click is always safe, flags count down', async ({ page, isMobile }) => {
  const errors = await prepare(page);
  await page.goto('/#minesweeper');
  await expect(page.locator('.ms-cell')).toHaveCount(81);
  await page.locator('.ms-cell[data-i="40"]').click();
  await expect(page.locator('.ms-cell.is-open').first()).toBeVisible();
  await expect(page.locator('.ms-cell.is-boom')).toHaveCount(0);
  const hidden = page.locator('.ms-cell:not(.is-open)').first();
  if (isMobile) {
    await page.locator('.ms-flagmode').click();
    await hidden.click();
  } else await hidden.click({ button: 'right' });
  await expect(page.locator('[data-led="mines"]')).toHaveText('009');
  await page.locator('.ms-face').click();
  await expect(page.locator('.ms-cell.is-open')).toHaveCount(0);
  expect(errors).toEqual([]);
});

test.describe('keyboard', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard flows are for desktop');

  test('desktop icons, Start menu, menus and message boxes', async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('/#desktop');
    await page.locator('.d-icon[data-id="about"]').focus();
    await page.keyboard.press('ArrowDown');
    await expect(page.locator('.d-icon[data-id="projects"]')).toBeFocused();
    await page.keyboard.press('Control+Escape');
    await expect(page.locator('#start-menu')).toBeVisible();
    await expect(page.locator('#start-menu .sm-item').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('#start-menu')).toBeHidden();
    await expect(page.locator('#start-btn')).toBeFocused();

    await page.locator('.d-icon[data-id="studies"]').focus();
    await page.keyboard.press('Shift+F10');
    await expect(page.locator('.ctx-menu .ctx-item').first()).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(page.locator('.ctx-menu')).toHaveCount(0);
    await expect(page.locator('.d-icon[data-id="studies"]')).toBeFocused();

    await page.keyboard.press('Delete');
    await expect(page.locator('.is-dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('.is-dialog')).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test('every visible button has an accessible name', async ({ page }) => {
    await prepare(page);
    await page.goto('/#about');
    await page.locator('#start-btn').click();
    const nameless = await page.$$eval('button', (bs) =>
      bs.filter((b) => b.offsetParent !== null && !(b.getAttribute('aria-label') || b.title || b.textContent.trim())).map((b) => b.outerHTML.slice(0, 80))
    );
    expect(nameless).toEqual([]);
  });
});

test.describe('phone', () => {
  test.skip(({ isMobile }) => !isMobile, 'phone only');

  test('a single tap opens a full-screen window', async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('/#desktop');
    await page.locator('.d-icon[data-id="experience"]').tap();
    const win = page.locator('.win-explorer');
    await expect(win).toBeVisible();
    await expect(win).toHaveClass(/is-max/);
    expect(errors).toEqual([]);
  });
});

test.describe('regressions', () => {
  test('printing twice in a row still restores the tab title', async ({ page }) => {
    await prepare(page);
    await page.goto('/#desktop');
    const before = await page.title();
    await page.evaluate(() => {
      window.dispatchEvent(new Event('beforeprint'));
      window.dispatchEvent(new Event('beforeprint'));
      window.dispatchEvent(new Event('afterprint'));
    });
    await expect(page).toHaveTitle(before);
  });

  test('#recycle links open the Recycle Bin, and a stray % does not break the page', async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('/#recycle');
    await expect(activeTitle(page)).toHaveText('Recycle Bin');
    await page.goto('/?x=1#100%');
    await expect(page.locator('#screen-welcome')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('a minimised window releases its taskbar button', async ({ page }) => {
    await prepare(page);
    await page.goto('/#about');
    const btn = page.locator('.task-btn').first();
    await expect(btn).toHaveAttribute('aria-pressed', 'true');
    await page.locator('.win-explorer .tb-min').click();
    await expect(btn).toHaveAttribute('aria-pressed', 'false');
  });
});

test.describe('regressions (keyboard)', () => {
  test.skip(({ isMobile }) => isMobile, 'keyboard flows are for desktop');

  test('Ctrl+Esc opens Start without closing the dialog in front', async ({ page }) => {
    await prepare(page);
    await page.goto('/#desktop');
    await page.evaluate(() => {
      void XP.apps.about();
    });
    await expect(page.locator('.is-dialog')).toBeVisible();
    await page.keyboard.press('Control+Escape');
    await expect(page.locator('#start-menu')).toBeVisible();
    await expect(page.locator('.is-dialog')).toBeVisible();
  });

  test('Enter in the message subject moves to the text instead of sending', async ({ page }) => {
    await prepare(page);
    await page.goto('/#desktop');
    await page.evaluate(() => {
      PROFILE.email = 'someone@example.org';
      void XP.open('compose');
    });
    await page.locator('.oe-subject').fill('Hello');
    await page.locator('.oe-subject').press('Enter');
    await expect(page.locator('.oe-body')).toBeFocused();
    await expect(page.locator('.win-compose .sb-main')).not.toContainText('Handed over');
  });

  test('Home/End in a menu without enabled items does not throw', async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('/#about');
    await page.locator('.win-explorer [data-menu="edit"]').click();
    await page.keyboard.press('End');
    await page.keyboard.press('Home');
    expect(errors).toEqual([]);
  });
});

test('unknown addresses get the XP-style 404 page', async ({ page }) => {
  const res = await page.goto('/this/page/does/not/exist');
  expect(res.status()).toBe(404);
  await expect(page.locator('h1')).toContainText('The page cannot be found');
  await expect(page.locator('a.home').first()).toHaveAttribute('href', '/');
});

test.describe('regressions (round 2)', () => {
  test('Minesweeper: too many flags reads -01, and Ctrl+F does not flag', async ({ page, isMobile }) => {
    test.skip(isMobile, 'right-click flags are a desktop thing');
    await prepare(page);
    await page.goto('/#minesweeper');
    for (let i = 0; i < 11; i++) await page.locator(`.ms-cell[data-i="${i}"]`).click({ button: 'right' });
    await expect(page.locator('[data-led="mines"]')).toHaveText('-01');
    await page.locator('.ms-cell[data-i="80"]').focus();
    await page.keyboard.press('Control+f');
    await expect(page.locator('.ms-cell[data-i="80"] svg')).toHaveCount(0);
  });

  test('Minesweeper: F2 keeps the keyboard on the board, and the window stays on screen', async ({ page, isMobile }) => {
    await prepare(page);
    await page.goto('/#minesweeper');
    if (!isMobile) {
      await page.locator('.ms-cell[data-i="10"]').focus();
      await page.keyboard.press('F2');
      await expect(page.locator('.ms-cell[data-i="0"]')).toBeFocused();
    }
    await page.evaluate(() => localStorage.setItem('xp:mines:level', 'intermediate'));
    await page.locator('.win-mines .tb-close').click();
    await page.evaluate(() => XP.open('minesweeper'));
    const box = await page.locator('.win-mines').boundingBox();
    const vw = page.viewportSize().width;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(vw + 1);
  });

  test('"constructor" is just an unknown terminal command', async ({ page }) => {
    const errors = await prepare(page);
    await page.goto('/#terminal');
    await expect(page.locator('.term-input')).toBeFocused({ timeout: 5000 });
    await page.keyboard.press('x');
    await expect(page.locator('.t-callout')).toBeVisible({ timeout: 5000 });
    await page.keyboard.type('constructor');
    await page.keyboard.press('Enter');
    await expect(page.locator('.term-out')).toContainText('command not found: constructor');
    expect(errors).toEqual([]);
  });

  test('the dev server refuses paths outside the project and survives odd ones', async ({ request }) => {
    expect((await request.get('/..%2f..%2fetc%2fpasswd')).status()).toBe(403);
    expect((await request.get('/..%2fw_xp---page-secret%2fx.txt')).status()).toBe(403); // look-alike sibling folder
    expect((await request.get('/a%00b')).status()).toBe(403);
    expect((await request.get('/')).status()).toBe(200);
  });
});

test('js/data.js passes the profile check', () => {
  const vm = require('vm');
  const fs = require('fs');
  const root = path.join(__dirname, '..');
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(path.join(root, 'js/data.js'), 'utf8'), sandbox);
  const issues = require(path.join(root, 'js/profile-check.js'))(sandbox.window.PROFILE);
  expect(issues.filter((i) => i.level === 'error')).toEqual([]);
});
