# Christian XP: career desktop

[![CI](https://github.com/christian-niyonzima/w_xp---page/actions/workflows/ci.yml/badge.svg)](https://github.com/christian-niyonzima/w_xp---page/actions/workflows/ci.yml)

A career landing page disguised as a **Windows XP desktop**, with a **Matrix terminal** hidden inside, smooth modern **sweep transitions** (or none at all, if you prefer), and a clean **printable résumé** for visitors in a hurry.

- **Boot screen → Welcome screen → Desktop**, with the classic four-colour flag, the "Bliss" wallpaper and a pixel-art 2002 mouse pointer.
- Desktop folders: **About Me**, **Passion Projects**, **Experience**, **Studies**. Opening an item sweeps the new view in over the old one.
- **Résumé**: everything on one clean page, built from your data. **Print / Save as PDF** gives recruiters a tidy PDF, and printing the site from anywhere (<kbd>Ctrl</kbd>+<kbd>P</kbd>) prints the résumé instead of a picture of the desktop.
- **Terminal**: a glowing line sweeps the digital rain over the screen and you are in a Matrix terminal with clickable commands, tab-completion, history, a fake file system (`ls`, `cd`, `cat`, `tree`), `neofetch`, `share`, rain colours and a few secrets.
- **Web Explorer**: a 2002-style portal with your LinkedIn, GitHub, e-mail and other links. **New Message** (Outlook Express style) hands a ready-made e-mail to the visitor's own mail program.
- **Shareable addresses**: the address bar follows what is on screen (`#projects/xp-career-desktop`), and every folder has **Copy link to this page**.
- A real window manager (drag, resize, minimise, maximise, **Flip 3D**), Start menu, Run…, Display Properties (wallpapers, live Matrix rain), screen saver, **Minesweeper**, Recycle Bin jokes, log off / turn off, and a "page cannot be found" 404 page.
- **Accessible** (zero axe-core violations, Lighthouse accessibility 100): full keyboard support (arrow keys on the desktop and in folders, <kbd>Ctrl</kbd>+<kbd>Esc</kbd> Start menu, menu key / <kbd>Shift</kbd>+<kbd>F10</kbd> context menus, <kbd>Esc</kbd> closes dialogs), focus that moves into new windows and back, screen-reader labels, a "skip to the plain résumé" link, and "reduce motion" respected.
- **Phones**: a single tap opens things and windows go full screen.
- **Link previews**: a social card image and Open Graph tags, so a shared link shows a proper preview on LinkedIn, Slack, X or WhatsApp. Installable as an app and works offline once visited.

No frameworks and no build step: plain HTML, CSS and JavaScript. Open `index.html` directly or host it anywhere. (Node.js is only needed for the optional checks and tests below.)

## Make it yours

Everything personal lives in **`js/data.js`**:

| Field | What it does |
| --- | --- |
| `name`, `firstName`, `title`, `tagline`, `location`, `status` | Shown on the welcome screen, Start menu, profile, résumé and terminal |
| `avatar` | Path to a square photo, e.g. `assets/me.jpg` (empty = initials) |
| `resume` | Optional PDF, e.g. `assets/resume.pdf`. The built-in résumé then also offers **Download PDF**. |
| `email`, `links` | Your e-mail, LinkedIn, GitHub and anything else. Add `hideOnResume: true` to a link to keep it off the printed résumé. |
| `siteUrl` | The public address of the site. Printed on the résumé and used by "Copy link". |
| `wallpaperImage` | Optional path to a different desktop picture. Empty = `assets/bliss.jpg`. |
| `transitions` | `true` for the sweep transitions, `false` for no animations at all. Visitors can also switch them off in Display Properties → Appearance. |
| `about` | `summary` (top of the résumé), bio paragraphs, skill groups, skill levels (XP progress bars) and fun facts |
| `projects`, `experience`, `studies` | One entry per project / job / school. The folders, terminal, search and résumé all read from these. |
| `recycleBin` | Joke files for the Recycle Bin |

Drop your photo or PDF into `assets/` and point `avatar` / `resume` at it.

**Template text never reaches visitors as a broken link**: while the LinkedIn URL or e-mail are still the placeholders, those links are simply left out.

### What is left to fill in?

Open the site locally (double-click `index.html`, or `npm start`) and a balloon tells you how many placeholders are left; the browser console lists them. Or run:

```bash
npm run check          # lists template text, broken links and missing files
```

### Link previews (LinkedIn & co.)

The `<head>` of `index.html` holds your name and the site address for link previews. If the site lives somewhere other than `https://christian-niyonzima.github.io/w_xp---page/`, update the URLs there (and `siteUrl` in `js/data.js`). After changing your name, title or photo, refresh the preview image and icons with `npm run images`.

### Change the wallpaper

Replace `assets/bliss.jpg` with any picture of the same name (on GitHub: open `assets` → **Add file** → **Upload files**), or set `wallpaperImage` in `js/data.js` to another file.

## Run it locally

Double-click `index.html`, or serve the folder:

```bash
npm start              # http://localhost:8000  (or: python3 -m http.server 8000)
```

## Put it online (GitHub Pages)

1. Push this repository to GitHub.
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your branch and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-user>.github.io/<repo-name>/`.

## Handy links and shortcuts

- Deep links open a section straight away: `#about`, `#projects`, `#experience`, `#studies`, `#resume`, `#terminal`, `#links`, `#contact`, `#message`, `#recycle`, `#minesweeper`, `#desktop`, or a single item such as `#projects/xp-career-desktop`.
- <kbd>`</kbd> opens the terminal, <kbd>Esc</kbd> leaves it, <kbd>Ctrl</kbd>+<kbd>Esc</kbd> opens the Start menu, <kbd>Ctrl</kbd>+<kbd>P</kbd> prints the résumé.
- In the terminal: <kbd>Tab</kbd> autocompletes, <kbd>↑</kbd>/<kbd>↓</kbd> walk history, <kbd>Ctrl</kbd>+<kbd>L</kbd> clears. Try `help`, `resume`, `color blue`…

## Checks and tests

```bash
npm install            # once: ESLint + Playwright (dev tools only, the site itself has no dependencies)
npx playwright install chromium
npm run verify         # profile check + lint + end-to-end and accessibility tests (desktop and phone)
```

The tests (`tests/`) walk through boot and log-on, folders and deep links, the résumé and printing, the terminal, Minesweeper, keyboard use, and run an axe-core accessibility audit on every view.

The same checks run on every push via GitHub Actions (`.github/workflows/ci.yml`).

## Project layout

```
index.html            page shell (boot, welcome, desktop, terminal, shut down) + link-preview tags
404.html              "The page cannot be found" for mistyped addresses
manifest.webmanifest  install as an app;  sw.js  offline support (network first, so edits show at once)
css/xp.css            Windows XP "Luna" look: windows, taskbar, Start menu, Explorer, dialogs, résumé, print
css/matrix.css        the Matrix terminal
js/data.js            ← your content
js/icons.js           hand-drawn XP-style SVG icons
js/wm.js              window manager, animations, focus handling, menus, message boxes, Flip 3D
js/apps.js            Explorer folders (sweep navigation, search, share links), Web Explorer, Run, Help, Display Properties
js/office.js          printable résumé and the New Message composer
js/games.js           Minesweeper
js/terminal.js        Matrix terminal: commands, file system, intro, jack-in / unplug transition
js/rain.js            3-layer digital rain on canvas
js/sound.js           small synthesized sound effects (Web Audio, no audio files)
js/main.js            boot / log on, desktop icons, Start menu, taskbar, wallpapers, screen saver, deep links
js/profile-check.js   the "what is left to fill in" checklist (only loaded locally)
assets/               wallpaper, cursors, icons, social card, self-hosted terminal font
tools/                serve.js, check-profile.js, make-share-images.js, make-cursors.js, make-wallpaper.js
tests/                Playwright end-to-end tests
```

The icons, cursors and fallback wallpaper are drawn from scratch for this project; the four-colour flag is a homage to the Windows XP logo. The terminal font is Share Tech Mono (SIL Open Font License, `assets/fonts/OFL.txt`). This is a personal fan homage to Windows XP and *The Matrix*, with no affiliation to Microsoft or Warner Bros. The "Bliss" photo (`assets/bliss.jpg`) is © Microsoft.
