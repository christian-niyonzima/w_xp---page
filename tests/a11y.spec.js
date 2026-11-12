// Automated accessibility audit (axe-core) of every main view, on desktop and phone.
const { test, expect } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;

const VIEWS = {
  welcome: '/',
  desktop: '/#desktop',
  folder: '/#about',
  document: '/#projects/xp-career-desktop',
  résumé: '/#resume',
  'web explorer': '/#links',
  help: '/#help',
  search: '/#search',
  minesweeper: '/#minesweeper',
};

for (const [name, url] of Object.entries(VIEWS)) {
  test(`no accessibility violations: ${name}`, async ({ page }) => {
    await page.addInitScript(() => {
      sessionStorage.setItem('xp:booted', '1');
      sessionStorage.setItem('xp:checklist', '1');
      localStorage.setItem('xp:motion', '0');
    });
    await page.goto(url);
    await page.waitForTimeout(900); // deep links open their window after a short delay
    const { violations } = await new AxeBuilder({ page }).analyze();
    const report = violations.map((v) => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(', ')}`);
    expect(report).toEqual([]);
  });
}

test('no accessibility violations: terminal', async ({ page }) => {
  await page.addInitScript(() => {
    sessionStorage.setItem('xp:booted', '1');
    localStorage.setItem('xp:motion', '0');
  });
  await page.goto('/#terminal');
  await expect(page.locator('.term-input')).toBeFocused({ timeout: 5000 });
  await page.keyboard.press('x');
  await expect(page.locator('.t-callout')).toBeVisible({ timeout: 5000 });
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
});
