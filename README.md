# Christian XP: career desktop

A career landing page disguised as a **Windows XP desktop**, with a **Matrix terminal** hidden inside and smooth, modern **sweep transitions** (or none at all, if you prefer).

- The classic look: the four-colour flag on the boot screen, log-on screen and Start button, and the "Bliss" wallpaper (`assets/bliss.jpg`).
- **Boot screen → Welcome screen → Desktop**, with the desktop sweeping in over the log-on screen.
- A pixel-art **2002 mouse pointer** (plus the hand for links and the "working in background" hourglass).
- Desktop folders: **About Me**, **Passion Projects**, **Experience**, **Studies**. Opening an item inside a folder sweeps the new view in over the old one.
- **Terminal** icon: a glowing line sweeps the digital rain down over the screen and you are in a Matrix terminal. It nudges visitors to type `help`, and offers clickable commands, tab-completion, history, a fake file system (`ls`, `cd`, `cat`, `tree`) and a few secrets.
- **Web Explorer** icon: a 2002-style portal with your LinkedIn, GitHub, e-mail and other links.
- Real window manager: drag, resize, minimise (windows glide into the taskbar), maximise and close, plus a **Flip 3D** window switcher.
- Start menu, Run…, Display Properties (wallpapers, including live Matrix rain), Matrix screen saver, Recycle Bin jokes, log off / turn off.
- Animations can be switched off entirely (see below). Works on phones (single tap opens things, windows go full screen) and respects "reduce motion".

No frameworks and no build step: plain HTML, CSS and JavaScript. Open `index.html` directly or host it anywhere.

## Make it yours

Everything personal lives in **`js/data.js`**:

| Field | What it does |
| --- | --- |
| `name`, `firstName`, `title`, `tagline`, `location`, `status` | Shown on the welcome screen, Start menu, profile and terminal |
| `avatar` | Path to a square photo, e.g. `assets/me.jpg` (empty = initials) |
| `resume` | Path to your CV, e.g. `assets/resume.pdf` (empty = hidden) |
| `wallpaperImage` | Optional path to a different desktop picture. Empty = `assets/bliss.jpg` (`.png` / `.webp` also work). If that file is ever missing, a hand-drawn look-alike (`assets/wallpaper.jpg`) is shown. |
| `transitions` | `true` for the smooth sweep transitions, `false` for no animations at all. Visitors can also switch them off in Display Properties → Appearance. |
| `email`, `links` | Your LinkedIn / GitHub / e-mail and anything else. **Replace the LinkedIn and e-mail placeholders.** |
| `about` | Bio paragraphs, skill groups, skill levels (XP progress bars) and fun facts |
| `projects`, `experience`, `studies` | One entry per project / job / school. The folders, terminal and search all read from these. |
| `recycleBin` | Joke files for the Recycle Bin |

Drop your photo or PDF into `assets/` and point `avatar` / `resume` at it.

### Change the wallpaper

Replace `assets/bliss.jpg` with any picture of the same name (on GitHub: open `assets` → **Add file** → **Upload files**), or set `wallpaperImage` in `js/data.js` to another file.

## Run it locally

Double-click `index.html`, or serve the folder:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Put it online (GitHub Pages)

1. Push this repository to GitHub.
2. In the repository go to **Settings → Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick your branch and the `/ (root)` folder, then save.
4. After a minute the site is live at `https://<your-user>.github.io/<repo-name>/`.

## Handy links and shortcuts

- Deep links open a section straight away: `#terminal`, `#about`, `#projects`, `#experience`, `#studies`, `#links`, `#contact`, `#desktop`.
- <kbd>`</kbd> opens the terminal, <kbd>Esc</kbd> leaves it, <kbd>Ctrl</kbd>+<kbd>Esc</kbd> opens the Start menu.
- In the terminal: <kbd>Tab</kbd> autocompletes, <kbd>↑</kbd>/<kbd>↓</kbd> walk history, <kbd>Ctrl</kbd>+<kbd>L</kbd> clears.

## Project layout

```
index.html          page shell (boot, welcome, desktop, terminal, shut down)
css/xp.css          Windows XP "Luna" look: windows, taskbar, Start menu, Explorer, dialogs
css/matrix.css      the Matrix terminal
js/data.js          ← your content
js/icons.js         hand-drawn XP-style SVG icons
js/wm.js            window manager, window animations, transitions on/off, menus, message boxes, Flip 3D
js/apps.js          Explorer folders (sweep navigation), Web Explorer, Run, Help, Display Properties
js/terminal.js      Matrix terminal: commands, file system, intro, jack-in / unplug transition
js/rain.js          3-layer digital rain on canvas
js/sound.js         small synthesized sound effects (Web Audio, no audio files)
js/main.js          boot / log on, desktop icons, Start menu, taskbar, wallpapers, screen saver
assets/cursors/     2002-style pointers (regenerate with `node tools/make-cursors.js`)
assets/bliss.jpg    the desktop wallpaper
assets/wallpaper.jpg hand-drawn green-hill fallback wallpaper (source: tools/wallpaper.svg, render with `node tools/make-wallpaper.js`)
```

The icons, cursors and fallback wallpaper are drawn from scratch for this project; the four-colour flag is a homage to the Windows XP logo. This is a personal fan homage to Windows XP and *The Matrix*, with no affiliation to Microsoft or Warner Bros. The "Bliss" photo (`assets/bliss.jpg`) is © Microsoft.
