/* Boot → Welcome → Desktop. Desktop icons, Start menu, taskbar, tray,
 * wallpapers, screen saver, log off / shut down, deep links and shortcuts. */
(function () {
  const XP = (window.XP = window.XP || {});
  const P = window.PROFILE;
  const esc = XP.esc;
  const $ = (s, r = document) => r.querySelector(s);

  const store = {
    get(k, d) {
      try {
        const v = localStorage.getItem(k);
        return v == null ? d : v;
      } catch (e) {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };
  const session = {
    get(k) {
      try {
        return sessionStorage.getItem(k);
      } catch (e) {
        return null;
      }
    },
    set(k, v) {
      try {
        v == null ? sessionStorage.removeItem(k) : sessionStorage.setItem(k, v);
      } catch (e) {}
    },
  };

  /* ==================================================================
   * Screens + the transitions between them
   *   sweep: the new screen slides in over the old one (which drifts back and dims)
   *   fade:  a plain cross-fade
   * ================================================================== */
  const Screens = {
    cur: null,
    el: (id) => document.getElementById('screen-' + id),
    instant(id) {
      if (this.cur) this.el(this.cur).classList.remove('is-active');
      this.el(id).classList.add('is-active');
      this.cur = id;
    },
    async show(id, effect = 'sweep', dir = 1) {
      const from = this.cur ? this.el(this.cur) : null;
      const to = this.el(id);
      if (from === to) return;
      to.classList.add('is-active');
      this.cur = id;
      if (!from || !XP.motion()) {
        if (from) from.classList.remove('is-active');
        return;
      }
      let fo, ti;
      let duration = 800;
      if (effect === 'sweep') {
        fo = [
          { transform: 'translateX(0%)', filter: 'brightness(1)' },
          { transform: `translateX(${-28 * dir}%)`, filter: 'brightness(.5)' },
        ];
        ti = [
          { transform: `translateX(${100 * dir}%)`, boxShadow: `${-dir * 30}px 0 70px rgba(0,0,0,.5)` },
          { transform: 'translateX(0%)', boxShadow: '0px 0 0px rgba(0,0,0,0)' },
        ];
      } else {
        duration = 600;
        fo = [{ opacity: 1 }, { opacity: 0 }];
        ti = [{ opacity: 0 }, { opacity: 1 }];
      }
      from.style.zIndex = '1';
      to.style.zIndex = '2';
      const opts = { duration, easing: XP.EASE };
      await XP.settle(XP.animate(from, fo, opts), XP.animate(to, ti, opts));
      from.classList.remove('is-active');
      from.style.zIndex = to.style.zIndex = '';
    },
  };
  XP.screens = Screens;

  /* ==================================================================
   * Global openers
   * ================================================================== */
  XP.openUrl = (url) => {
    if (/^mailto:/i.test(url)) window.location.href = url;
    else window.open(url, '_blank', 'noopener');
  };

  XP.open = function (t, from) {
    XP.closeMenu();
    closeStart();
    hideBalloon();
    switch (t) {
      case 'about':
      case 'projects':
      case 'experience':
      case 'studies':
      case 'recycle':
      case 'root':
        XP.busy();
        return XP.apps.folder(t, from);
      case 'search':
        return XP.apps.folder({ kind: 'search', q: '' }, from);
      case 'browser':
        XP.busy();
        return XP.apps.browser(from);
      case 'terminal':
        return XP.terminal.enter();
      case 'run':
        return XP.apps.run();
      case 'help':
        return XP.apps.help(from);
      case 'display':
        return XP.apps.display(from);
      case 'flip':
        return XP.wm.flip3d();
      case 'logoff':
        return logoffDialog();
      case 'shutdown':
        return shutdownDialog();
      case 'desktop':
        return;
      default: {
        const l = XP.links().find((x) => x.id === t);
        if (l) XP.openUrl(l.url);
      }
    }
  };

  const RUN = {
    cmd: 'terminal', command: 'terminal', terminal: 'terminal', matrix: 'terminal', powershell: 'terminal', bash: 'terminal', neo: 'terminal',
    iexplore: 'browser', browser: 'browser', internet: 'browser', 'web explorer': 'browser', links: 'browser',
    explorer: 'root', 'my documents': 'root', documents: 'root',
    about: 'about', 'about me': 'about', projects: 'projects', 'passion projects': 'projects',
    experience: 'experience', work: 'experience', studies: 'studies', education: 'studies',
    recycle: 'recycle', 'recycle bin': 'recycle', help: 'help', control: 'display', 'desk.cpl': 'display', display: 'display',
    flip: 'flip', flip3d: 'flip', search: 'search',
  };
  XP.runCommand = function (raw) {
    const s = raw.trim().toLowerCase().replace(/\.exe$/, '');
    if (s === 'winver') return XP.apps.about(), true;
    if (RUN[s]) return XP.open(RUN[s]), true;
    const link = XP.links().find((l) => l.id === s || l.label.toLowerCase() === s);
    if (link) return XP.openUrl(link.url), true;
    if (/^https?:\/\//.test(s) || /^www\./.test(s) || /^[^\s]+\.[a-z]{2,}$/.test(s)) return XP.apps.browser(null, raw.trim()), true;
    return false;
  };

  /* ==================================================================
   * Boot + Welcome
   * ================================================================== */
  function boot() {
    const scr = Screens.el('boot');
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(t);
      document.removeEventListener('keydown', finish);
      scr.removeEventListener('click', finish);
      session.set('xp:booted', '1');
      Screens.show('welcome', 'fade');
    };
    const t = setTimeout(finish, 3600);
    document.addEventListener('keydown', finish);
    // "click", not "pointerdown": otherwise the same tap lands on the welcome screen and logs in.
    scr.addEventListener('click', finish);
  }

  function buildWelcome() {
    const users = [
      { id: 'user', name: P.name, sub: P.title, pic: XP.avatar(64) },
      { id: 'neo', name: 'Neo', sub: 'Jack straight into the Matrix terminal', pic: `<span class="wl-neo">${XP.icon('pill', 52)}</span>`, cls: ' is-neo' },
    ];
    const box = $('#wl-users');
    box.innerHTML = users
      .map(
        (u) => `<button class="wl-user${u.cls || ''}" data-user="${u.id}">
          <span class="wl-pic">${u.pic}</span>
          <span class="wl-txt"><span class="wl-name">${esc(u.name)}</span><span class="wl-sub">${esc(u.sub)}</span></span>
        </button>`
      )
      .join('');
    let busy = false;
    box.addEventListener('click', async (e) => {
      const btn = e.target.closest('.wl-user');
      if (!btn || busy) return;
      busy = true;
      const sub = btn.querySelector('.wl-sub');
      const original = sub.textContent;
      box.classList.add('is-choosing');
      btn.classList.add('is-loading');
      sub.textContent = 'Loading your personal settings...';
      XP.busy(1200);
      await XP.wait(XP.motion() ? 1100 : 300);
      if (btn.dataset.user === 'neo') await XP.terminal.enter({ from: 'welcome' });
      else await toDesktop();
      sub.textContent = original;
      btn.classList.remove('is-loading');
      box.classList.remove('is-choosing');
      busy = false;
    });
    $('#wl-power').addEventListener('click', () => powerOff());
  }

  /* ==================================================================
   * Wallpapers
   * ================================================================== */
  // The real Bliss photo, if the owner uploaded one (any common extension works).
  // Until it is found, the hand-drawn hills are shown.
  let photo = null;
  let photoChecked = false;
  const PHOTOS = () =>
    [P.wallpaperImage, 'assets/bliss.jpg', 'assets/bliss.jpeg', 'assets/bliss.png', 'assets/bliss.webp'].filter((v, i, all) => v && all.indexOf(v) === i);
  function findPhoto(then) {
    photoChecked = true;
    const list = PHOTOS();
    const next = () => {
      const src = list.shift();
      if (!src) return;
      const img = new Image();
      img.onload = () => then(src);
      img.onerror = next;
      img.src = src;
    };
    next();
  }
  const hills = () =>
    [photo, 'assets/wallpaper.jpg']
      .filter(Boolean)
      .map((src) => `url("${src}") center / cover no-repeat`)
      .concat('#3a6ea5')
      .join(', ');

  const WALLPAPERS = {
    bliss: { label: 'Bliss', css: hills },
    matrix: { label: 'Red Pill (live Matrix rain)', css: () => '#000', rain: true },
    azul: {
      label: 'Azul',
      css: () =>
        'radial-gradient(ellipse at 72% 28%, rgba(120,190,255,.85) 0%, transparent 45%), radial-gradient(ellipse at 18% 85%, rgba(0,30,120,.9) 0%, transparent 60%), radial-gradient(ellipse at 40% 50%, rgba(60,140,240,.5) 0%, transparent 55%), linear-gradient(160deg, #2266d8 0%, #0a2f8a 100%)',
    },
    classic: { label: 'Classic Blue', css: () => '#3a6ea5' },
  };
  let wallRain = null;
  function setWallpaper(name) {
    if (!WALLPAPERS[name]) name = 'bliss';
    store.set('xp:wallpaper', name);
    const w = WALLPAPERS[name];
    $('#wallpaper').style.background = w.css();
    if (name === 'bliss' && !photoChecked)
      findPhoto((src) => {
        photo = src;
        if (wallpaper() === 'bliss') $('#wallpaper').style.background = hills();
      });
    const canvas = $('#wallpaper-rain');
    canvas.hidden = !w.rain;
    if (w.rain) {
      wallRain = wallRain || new XP.MatrixRain(canvas, { fps: 20, fade: 0.1, layers: [{ size: 12, speed: 0.6, alpha: 0.35, share: 1 }, { size: 18, speed: 1, alpha: 0.7, share: 0.35 }] });
      wallRain.start();
    } else if (wallRain) wallRain.stop();
  }
  const wallpaper = () => (WALLPAPERS[store.get('xp:wallpaper', 'bliss')] ? store.get('xp:wallpaper', 'bliss') : 'bliss');

  /* ==================================================================
   * Desktop icons
   * ================================================================== */
  const ICONS = [
    { id: 'about', label: 'About Me', icon: 'folder-about', open: 'about', type: 'File Folder' },
    { id: 'projects', label: 'Passion Projects', icon: 'folder-projects', open: 'projects', type: 'File Folder' },
    { id: 'experience', label: 'Experience', icon: 'folder-experience', open: 'experience', type: 'File Folder' },
    { id: 'studies', label: 'Studies', icon: 'folder-studies', open: 'studies', type: 'File Folder' },
    { id: 'terminal', label: 'Terminal', icon: 'terminal', open: 'terminal', type: 'Application (enters the Matrix)' },
    { id: 'browser', label: 'Web Explorer', icon: 'browser', open: 'browser', type: 'Application (links)' },
  ];
  if (P.resume) ICONS.push({ id: 'resume', label: 'Resume.pdf', icon: 'pdf', open: 'resume', type: 'PDF Document' });
  ICONS.push({ id: 'recycle', label: 'Recycle Bin', icon: 'recycle', open: 'recycle', type: 'Recycle Bin', corner: true });

  let iconsEl;
  const pos = new Map();
  let moved = false;

  const grid = () => {
    // offset sizes ignore transforms, so this stays right mid-transition.
    const w = iconsEl.offsetWidth, h = iconsEl.offsetHeight;
    const g = XP.mobile() ? { w: 82, h: 92, px: 4, py: 10 } : { w: 86, h: 92, px: 8, py: 10 };
    return { g, cols: Math.max(1, Math.floor((w - g.px * 2) / g.w)), rows: Math.max(1, Math.floor((h - g.py * 2) / g.h)) };
  };

  function freeCell(c, r, taken, cols, rows) {
    for (let d = 0; d <= Math.max(cols, rows); d++)
      for (let dc = -d; dc <= d; dc++)
        for (let dr = -d; dr <= d; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== d) continue;
          const cc = c + dc, rr = r + dr;
          if (cc >= 0 && rr >= 0 && cc < cols && rr < rows && !taken.has(cc + ',' + rr)) return { c: cc, r: rr };
        }
    return { c, r };
  }

  function place(animate) {
    const { g } = grid();
    ICONS.forEach((ic) => {
      const p = pos.get(ic.id);
      if (animate) ic.el.classList.add('is-snapping');
      ic.el.style.left = g.px + p.c * g.w + 'px';
      ic.el.style.top = g.py + p.r * g.h + 'px';
    });
    if (animate) setTimeout(() => ICONS.forEach((ic) => ic.el.classList.remove('is-snapping')), 260);
  }

  function arrange(animate) {
    const { cols, rows } = grid();
    const mob = XP.mobile();
    const taken = new Set();
    ICONS.filter((i) => !i.corner).forEach((ic, k) => {
      const p = mob ? { c: k % cols, r: Math.floor(k / cols) } : { c: Math.floor(k / rows), r: k % rows };
      pos.set(ic.id, p);
      taken.add(p.c + ',' + p.r);
    });
    ICONS.filter((i) => i.corner).forEach((ic) => {
      const p = freeCell(cols - 1, rows - 1, taken, cols, rows);
      pos.set(ic.id, p);
      taken.add(p.c + ',' + p.r);
    });
    place(animate);
  }

  function reflow() {
    if (!moved) return arrange();
    const { cols, rows } = grid();
    const taken = new Set();
    ICONS.forEach((ic) => {
      let p = pos.get(ic.id);
      if (p.c >= cols || p.r >= rows || taken.has(p.c + ',' + p.r)) p = freeCell(Math.min(p.c, cols - 1), Math.min(p.r, rows - 1), taken, cols, rows);
      pos.set(ic.id, p);
      taken.add(p.c + ',' + p.r);
    });
    place();
  }

  function selectOnly(el) {
    ICONS.forEach((i) => i.el.classList.toggle('is-selected', i.el === el));
  }

  function openIcon(ic) {
    const r = ic.el.querySelector('.d-icon-img').getBoundingClientRect();
    XP.open(ic.open, r);
  }

  function buildIcons() {
    iconsEl = $('#desk-icons');
    iconsEl.innerHTML = '';
    ICONS.forEach((ic) => {
      ic.el = XP.html(`<button class="d-icon" data-id="${ic.id}" role="listitem" aria-label="${esc(ic.label)}">
        <span class="d-icon-img">${XP.icon(ic.icon, 48)}</span><span class="d-icon-label">${esc(ic.label)}</span></button>`);
      iconsEl.appendChild(ic.el);
    });
    arrange();

    iconsEl.addEventListener('pointerdown', (e) => {
      closeStart();
      const el = e.target.closest('.d-icon');
      if (!el) return band(e);
      const ic = ICONS.find((i) => i.el === el);
      if (e.button !== 0) {
        if (!el.classList.contains('is-selected')) selectOnly(el);
        return;
      }
      if (e.ctrlKey || e.metaKey) el.classList.toggle('is-selected');
      else if (!el.classList.contains('is-selected')) selectOnly(el);
      dragIcons(e, ic);
    });
    iconsEl.addEventListener('dblclick', (e) => {
      const el = e.target.closest('.d-icon');
      if (el && lastPointer === 'mouse') openIcon(ICONS.find((i) => i.el === el));
    });
    iconsEl.addEventListener('keydown', (e) => {
      const el = e.target.closest('.d-icon');
      if (!el) return;
      if (e.key === 'Enter') openIcon(ICONS.find((i) => i.el === el));
      if (e.key === 'Delete') deleteJoke(ICONS.find((i) => i.el === el));
    });
    iconsEl.addEventListener('focusin', (e) => {
      const el = e.target.closest('.d-icon');
      if (el && !el.classList.contains('is-selected')) selectOnly(el);
    });
  }

  let lastPointer = 'mouse';
  function dragIcons(e, ic) {
    lastPointer = e.pointerType;
    const sx = e.clientX, sy = e.clientY;
    const sel = ICONS.filter((i) => i.el.classList.contains('is-selected'));
    const start = sel.map((i) => ({ i, l: i.el.offsetLeft, t: i.el.offsetTop }));
    let dragging = false;
    const move = (ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      if (!dragging && Math.hypot(dx, dy) < 6) return;
      if (!dragging) {
        dragging = true;
        sel.forEach((i) => i.el.classList.add('is-dragging'));
      }
      start.forEach((s) => {
        s.i.el.style.left = s.l + dx + 'px';
        s.i.el.style.top = s.t + dy + 'px';
      });
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      if (dragging) {
        const { g, cols, rows } = grid();
        const ids = new Set(sel.map((i) => i.id));
        const taken = new Set([...pos].filter(([id]) => !ids.has(id)).map(([, p]) => p.c + ',' + p.r));
        start.forEach((s) => {
          const c = Math.min(cols - 1, Math.max(0, Math.round((s.i.el.offsetLeft - g.px) / g.w)));
          const r = Math.min(rows - 1, Math.max(0, Math.round((s.i.el.offsetTop - g.py) / g.h)));
          const p = freeCell(c, r, taken, cols, rows);
          taken.add(p.c + ',' + p.r);
          pos.set(s.i.id, p);
          s.i.el.classList.remove('is-dragging');
        });
        moved = true;
        place(true);
      } else if (e.pointerType !== 'mouse') openIcon(ic);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function band(e) {
    if (e.button !== 0) return;
    ICONS.forEach((i) => i.el.classList.remove('is-selected'));
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur();
    const box = $('#desk-select');
    const ox = e.clientX, oy = e.clientY;
    const move = (ev) => {
      const x = Math.min(ox, ev.clientX), y = Math.min(oy, ev.clientY);
      const w = Math.abs(ev.clientX - ox), h = Math.abs(ev.clientY - oy);
      if (w + h < 4) return;
      Object.assign(box.style, { left: x + 'px', top: y + 'px', width: w + 'px', height: h + 'px' });
      box.hidden = false;
      ICONS.forEach((i) => {
        const r = i.el.getBoundingClientRect();
        i.el.classList.toggle('is-selected', r.left < x + w && r.right > x && r.top < y + h && r.bottom > y);
      });
    };
    const up = () => {
      box.hidden = true;
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function enterIcons() {
    ICONS.forEach((ic, i) => {
      ic.el.style.setProperty('--d', i * 70 + 200 + 'ms');
      ic.el.classList.remove('is-entering');
      void ic.el.offsetWidth;
      ic.el.classList.add('is-entering');
    });
    setTimeout(() => ICONS.forEach((ic) => ic.el.classList.remove('is-entering')), 1600);
  }

  function deleteJoke(ic) {
    if (!ic) return;
    XP.dialog({ title: 'Confirm File Delete', icon: 'warning', message: `Are you sure you want to send '${esc(ic.label)}' to the Recycle Bin?`, buttons: ['Yes', 'No'] }).then((a) => {
      if (a === 'Yes') XP.dialog({ title: 'Error Deleting File', icon: 'error', message: `Cannot delete ${esc(ic.label)}: it is load-bearing. This whole career depends on it.` });
    });
  }

  function properties(ic) {
    const F = XP.apps.FOLDERS[ic.open];
    const rows = [
      ['Type:', ic.type],
      ['Location:', `C:\\Documents and Settings\\${esc(P.firstName)}\\Desktop`],
      F ? ['Contains:', `${F.items().length} files`] : null,
      ['Created:', 'Thursday, October 25, 2001'],
    ].filter(Boolean);
    XP.dialog({
      title: `${ic.label} Properties`,
      icon: XP.hasIcon(ic.icon) ? ic.icon : 'info',
      message: `<b>${esc(ic.label)}</b><table class="props">${rows.map(([a, b]) => `<tr><td>${a}</td><td>${b}</td></tr>`).join('')}</table>`,
    });
  }

  /* ==================================================================
   * Context menus
   * ================================================================== */
  function refresh() {
    XP.animate(iconsEl, [{ opacity: 1 }, { opacity: 0.2 }, { opacity: 1 }], { duration: 260 });
  }

  function onContext(e) {
    const icon = e.target.closest('.d-icon');
    const onDesk = e.target === iconsEl || e.target.id === 'wallpaper';
    const onBar = e.target.closest('.taskbar');
    if (!icon && !onDesk && !onBar) return;
    e.preventDefault();
    if (icon) {
      const ic = ICONS.find((i) => i.el === icon);
      selectOnly(icon);
      return XP.menu(
        [
          { label: 'Open', bold: true, action: () => openIcon(ic) },
          ...(XP.apps.FOLDERS[ic.open] ? [{ label: 'Explore', icon: 'folders', action: () => XP.open('root') }] : []),
          '-',
          { label: 'Rename', disabled: true },
          { label: 'Delete', action: () => deleteJoke(ic) },
          '-',
          { label: 'Properties', action: () => properties(ic) },
        ],
        e.clientX,
        e.clientY
      );
    }
    if (onBar)
      return XP.menu(
        [
          { label: 'Show the Desktop', icon: 'desktop', action: () => XP.wm.toggleDesktop() },
          { label: 'Flip 3D', icon: 'flip', action: () => XP.wm.flip3d() },
          '-',
          { label: 'Enter the Matrix', icon: 'terminal', action: () => XP.open('terminal') },
          { label: 'Help and Support', icon: 'help', action: () => XP.open('help') },
        ],
        e.clientX,
        e.clientY
      );
    XP.menu(
      [
        { label: 'Arrange Icons', icon: 'views', action: () => ((moved = false), arrange(true)) },
        { label: 'Refresh', icon: 'refresh', action: refresh },
        '-',
        { label: 'Enter the Matrix', icon: 'terminal', bold: true, action: () => XP.open('terminal') },
        { label: 'Flip 3D', icon: 'flip', action: () => XP.wm.flip3d() },
        { label: 'Open Web Explorer', icon: 'browser', action: () => XP.open('browser') },
        '-',
        { label: 'Properties', icon: 'display', action: () => XP.open('display') },
      ],
      e.clientX,
      e.clientY
    );
  }

  /* ==================================================================
   * Start menu
   * ================================================================== */
  let startOpen = false;
  function buildStart() {
    const item = (open, ic, label, sub) =>
      `<button class="sm-item${sub ? ' sm-pinned' : ''}" data-open="${open}">${XP.icon(ic, sub ? 32 : 30)}<span><b>${esc(label)}</b>${sub ? `<small>${esc(sub)}</small>` : ''}</span></button>`;
    const r = (open, ic, label, cls = '') => `<button class="sm-r ${cls}" data-open="${open}">${XP.icon(ic, 22)}<span>${esc(label)}</span></button>`;
    $('#start-menu').innerHTML = `
      <div class="sm-head"><span class="sm-avatar">${XP.avatar(42)}</span><span class="sm-user">${esc(P.name)}</span></div>
      <div class="sm-body">
        <div class="sm-left">
          ${item('browser', 'browser', 'Internet', 'Web Explorer')}
          ${item('terminal', 'terminal', 'Terminal', 'Enter the Matrix')}
          <hr>
          ${item('about', 'folder-about', 'About Me')}
          ${item('projects', 'folder-projects', 'Passion Projects')}
          ${item('experience', 'folder-experience', 'Experience')}
          ${item('studies', 'folder-studies', 'Studies')}
          <div class="sm-grow"></div>
          <hr>
          <button class="sm-all" data-act="all"><span>All Programs</span><span class="sm-arrow"></span></button>
        </div>
        <div class="sm-right">
          ${r('root', 'folder', 'My Documents')}
          ${r('projects', 'folder-projects', 'My Projects')}
          ${r('experience', 'folder-experience', 'My Experience')}
          <hr>
          ${XP.links().map((l) => r(l.id, l.icon || 'globe', l.label, 'light')).join('')}
          <hr>
          ${r('display', 'display', 'Display Properties', 'light')}
          ${r('help', 'help', 'Help and Support', 'light')}
          ${r('search', 'search', 'Search', 'light')}
          ${r('run', 'run', 'Run...', 'light')}
        </div>
      </div>
      <div class="sm-foot">
        <button class="sm-f" data-open="logoff">${XP.icon('logoff', 22)}<span>Log Off</span></button>
        <button class="sm-f" data-open="shutdown">${XP.icon('power', 22)}<span>Turn Off Computer</span></button>
      </div>`;
    const all = $('#start-menu .sm-all');
    all.addEventListener('click', (e) => {
      e.stopPropagation();
      allPrograms(all);
    });
    all.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && allPrograms(all));
  }

  function allPrograms(anchor) {
    if ($('#sm-flyout')) return;
    const fly = XP.html(`<div class="ctx-menu sm-flyout" id="sm-flyout">${[
      ['browser', 'browser', 'Web Explorer'],
      ['terminal', 'terminal', 'Terminal (Matrix)'],
      ['about', 'folder-about', 'About Me'],
      ['projects', 'folder-projects', 'Passion Projects'],
      ['experience', 'folder-experience', 'Experience'],
      ['studies', 'folder-studies', 'Studies'],
      ['recycle', 'recycle', 'Recycle Bin'],
      ['flip', 'flip', 'Flip 3D'],
      ['display', 'display', 'Display Properties'],
      ['run', 'run', 'Run...'],
    ]
      .map(([o, i, l]) => `<button class="ctx-item" data-open="${o}"><span class="ci-ico">${XP.icon(i, 16)}</span><span class="ci-label">${esc(l)}</span></button>`)
      .join('')}</div>`);
    Screens.el('desktop').appendChild(fly);
    const r = anchor.getBoundingClientRect();
    fly.style.left = Math.min(r.right - 4, window.innerWidth - fly.offsetWidth - 4) + 'px';
    fly.style.top = Math.max(4, r.bottom - fly.offsetHeight) + 'px';
    XP.animate(fly, [{ opacity: 0, transform: 'translateX(-8px)' }, { opacity: 1, transform: 'translateX(0px)' }], { duration: 160 });
  }

  function openStart() {
    const sm = $('#start-menu');
    sm.hidden = false;
    startOpen = true;
    $('#start-btn').classList.add('is-open');
    $('#start-btn').setAttribute('aria-expanded', 'true');
    XP.animate(
      sm,
      [
        { opacity: 0, transform: 'translateY(14px)' },
        { opacity: 1, transform: 'translateY(0px)' },
      ],
      { duration: 220 }
    );
  }
  function closeStart() {
    if (!startOpen) return;
    startOpen = false;
    $('#start-menu').hidden = true;
    const fly = $('#sm-flyout');
    if (fly) fly.remove();
    $('#start-btn').classList.remove('is-open');
    $('#start-btn').setAttribute('aria-expanded', 'false');
  }
  const toggleStart = () => (startOpen ? closeStart() : openStart());

  /* ==================================================================
   * Taskbar + tray + balloon
   * ================================================================== */
  function buildTaskbar() {
    $('#start-btn .start-ico').innerHTML = XP.icon('xpflag', 24);
    $('#start-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      toggleStart();
    });
    const ql = [
      ['desktop', 'Show Desktop', () => XP.wm.toggleDesktop()],
      ['browser', 'Web Explorer', () => XP.open('browser')],
      ['terminal', 'Terminal: enter the Matrix', () => XP.open('terminal')],
      ['flip', 'Flip 3D: switch between windows', () => XP.wm.flip3d()],
    ];
    const q = $('#quick-launch');
    ql.forEach(([ic, title, fn]) => {
      const b = XP.html(`<button class="ql-btn" title="${esc(title)}" aria-label="${esc(title)}">${XP.icon(ic, 18)}</button>`);
      b.addEventListener('click', fn);
      q.appendChild(b);
    });
    const snd = $('#tray-sound');
    const paint = () => {
      snd.innerHTML = XP.icon(XP.sound.muted ? 'mute' : 'speaker', 16);
      snd.title = XP.sound.muted ? 'Sound is off' : 'Sound is on';
    };
    paint();
    snd.addEventListener('click', () => {
      XP.sound.toggle();
      paint();
      XP.sound.play('ding');
    });
    $('#tray-matrix').innerHTML = XP.icon('pill', 16);
    $('#tray-matrix').addEventListener('click', () => XP.open('terminal'));
    const clock = $('#tray-clock');
    const tick = () => {
      const d = new Date();
      clock.textContent = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
      clock.title = d.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    };
    tick();
    setInterval(tick, 10000);
  }

  let balloonT = 0;
  function balloon({ title, html, icon = 'info', timeout = 16000 }) {
    const b = $('#balloon');
    b.innerHTML = `<button class="balloon-x" aria-label="Close">✕</button><div class="balloon-title">${XP.icon(icon, 16)}<span>${esc(title)}</span></div><div class="balloon-body">${html}</div>`;
    b.hidden = false;
    XP.sound.play('notify');
    XP.animate(b, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0px)' }], {
      duration: 380,
    });
    b.querySelector('.balloon-x').addEventListener('click', hideBalloon);
    clearTimeout(balloonT);
    balloonT = setTimeout(hideBalloon, timeout);
  }
  async function hideBalloon() {
    const b = $('#balloon');
    if (b.hidden) return;
    clearTimeout(balloonT);
    await XP.settle(XP.animate(b, [{ opacity: 1 }, { opacity: 0 }], { duration: 220 }));
    b.hidden = true;
  }

  /* ==================================================================
   * Screen saver (Matrix rain)
   * ================================================================== */
  let idleAt = Date.now();
  let saverOn = false;
  let saverAt = 0;
  let saverRain = null;
  const saver = () => ({ type: store.get('xp:saver', 'matrix'), wait: +store.get('xp:saverWait', 2) || 2 });
  function setSaver(s) {
    store.set('xp:saver', s.type);
    store.set('xp:saverWait', s.wait);
  }
  function startSaver() {
    if (saverOn) return;
    const el = $('#screensaver');
    el.hidden = false;
    saverRain = saverRain || new XP.MatrixRain(el.querySelector('canvas'));
    saverRain.start();
    saverOn = true;
    saverAt = Date.now();
    XP.animate(el, [{ opacity: 0 }, { opacity: 1 }], { duration: 900 });
  }
  async function stopSaver() {
    if (!saverOn) return;
    saverOn = false;
    const el = $('#screensaver');
    await XP.settle(XP.animate(el, [{ opacity: 1 }, { opacity: 0 }], { duration: 300 }));
    el.hidden = true;
    saverRain.stop();
  }
  function watchIdle() {
    const wake = () => {
      idleAt = Date.now();
      if (saverOn && Date.now() - saverAt > 900) stopSaver();
    };
    ['pointermove', 'pointerdown', 'keydown', 'wheel', 'touchstart'].forEach((ev) => document.addEventListener(ev, wake, { passive: true, capture: true }));
    setInterval(() => {
      const s = saver();
      if (s.type === 'none' || saverOn || Screens.cur !== 'desktop' || XP.terminal.active || document.hidden) return;
      if (Date.now() - idleAt > s.wait * 60000) startSaver();
    }, 4000);
  }

  /* ==================================================================
   * Desktop lifecycle
   * ================================================================== */
  let built = false;
  let welcomed = false;
  function initDesktop() {
    if (built) return;
    built = true;
    setWallpaper(wallpaper());
    buildIcons();
    buildTaskbar();
    buildStart();
    const desk = Screens.el('desktop');
    desk.addEventListener('contextmenu', onContext);
    desk.addEventListener('pointerdown', (e) => {
      if (startOpen && !e.target.closest('#start-menu, #start-btn, #sm-flyout')) closeStart();
    });
    $('#start-menu').addEventListener('click', (e) => {
      if (e.target.closest('[data-open]')) closeStart();
    });
    // Lay icons out whenever the desktop gets its real size (it starts hidden).
    if (window.ResizeObserver) new ResizeObserver(() => iconsEl.offsetWidth && reflow()).observe(iconsEl);
    let rt = 0;
    window.addEventListener('resize', () => {
      clearTimeout(rt);
      rt = setTimeout(() => {
        reflow();
        XP.wm.fit();
      }, 120);
    });
    watchIdle();
  }

  const touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  function desktopShown() {
    enterIcons();
    if (!welcomed) {
      welcomed = true;
      setTimeout(
        () =>
          balloon({
            title: `Welcome to ${P.firstName} XP`,
            html: `${touch ? 'Tap' : 'Double-click'} a folder to look around, or open the <button class="a" data-open="terminal">Terminal</button> and type <b>help</b> to enter the Matrix.`,
            timeout: XP.mobile() ? 9000 : 16000,
          }),
        1700
      );
    }
  }

  async function toDesktop() {
    initDesktop();
    XP.sound.play('startup');
    await Screens.show('desktop', 'sweep', 1);
    desktopShown();
  }

  XP.desktop = {
    WALLPAPERS,
    wallpaper,
    setWallpaper,
    saver,
    setSaver,
    startSaver,
    closeStart,
    balloon,
    enterUnderMatrix() {
      initDesktop();
      Screens.instant('desktop');
      this.pending = true;
    },
    afterMatrix() {
      if (this.pending) {
        this.pending = false;
        desktopShown();
      }
    },
  };

  /* ==================================================================
   * Log off / Turn off
   * ================================================================== */
  function overlayDialog(title, buttons) {
    return new Promise((resolve) => {
      const ov = XP.html(`<div class="xp-dim"><div class="off-dialog" role="dialog" aria-label="${esc(title)}">
        <div class="off-head"><span>${esc(title)}</span>${XP.icon('xpflag', 30)}</div>
        <div class="off-body">${buttons.map(([id, ic, label]) => `<button class="off-btn" data-off="${id}">${XP.icon(ic, 36)}<span>${esc(label)}</span></button>`).join('')}</div>
        <div class="off-foot"><button class="xp-btn" data-off="cancel">Cancel</button></div>
      </div></div>`);
      Screens.el('desktop').appendChild(ov);
      XP.animate(ov.firstElementChild, [{ opacity: 0, transform: 'translate(-50%,-47%) scale(.97)' }, { opacity: 1, transform: 'translate(-50%,-50%) scale(1)' }], {
        duration: 320,
      });
      const done = (v) => {
        document.removeEventListener('keydown', key);
        ov.remove();
        resolve(v);
      };
      const key = (e) => e.key === 'Escape' && done('cancel');
      document.addEventListener('keydown', key);
      ov.addEventListener('click', (e) => {
        const b = e.target.closest('[data-off]');
        if (b) done(b.dataset.off);
      });
      setTimeout(() => ov.querySelector('.off-btn').focus(), 60);
    });
  }

  function closeAllWindows() {
    XP.wm.all().forEach((w) => XP.wm.close(w.id));
  }

  async function logoffDialog() {
    const a = await overlayDialog(`Log Off ${P.firstName} XP`, [
      ['switch', 'user', 'Switch User'],
      ['logoff', 'logoff', 'Log Off'],
    ]);
    if (a === 'cancel') return;
    XP.sound.play('shutdown');
    closeAllWindows();
    hideBalloon();
    await Screens.show('welcome', 'sweep', -1);
  }

  async function shutdownDialog() {
    const a = await overlayDialog('Turn off computer', [
      ['standby', 'standby', 'Stand By'],
      ['off', 'power', 'Turn Off'],
      ['restart', 'restart', 'Restart'],
    ]);
    if (a === 'standby') startSaver();
    else if (a === 'off') powerOff();
    else if (a === 'restart') powerOff(true);
  }

  async function powerOff(restart) {
    const sd = Screens.el('shutdown');
    sd.classList.remove('is-safe');
    sd.querySelector('.sd-saving-text').textContent = restart ? 'Restarting…' : 'Shutting down…';
    XP.sound.play('shutdown');
    closeStart();
    hideBalloon();
    await Screens.show('shutdown', 'fade');
    closeAllWindows();
    await XP.wait(XP.reduced ? 300 : 2000);
    const reboot = () => {
      sd.removeEventListener('click', reboot);
      document.removeEventListener('keydown', reboot);
      session.set('xp:booted', null);
      Screens.show('boot', 'fade').then(boot);
    };
    if (restart) return reboot();
    sd.classList.add('is-safe');
    sd.addEventListener('click', reboot);
    document.addEventListener('keydown', reboot);
  }

  /* ==================================================================
   * Deep links (#terminal, #about, …), global clicks + keyboard
   * ================================================================== */
  const ROUTES = {
    desktop: () => {},
    terminal: () => XP.terminal.enter(),
    matrix: () => XP.terminal.enter(),
    about: () => XP.open('about'),
    projects: () => XP.open('projects'),
    experience: () => XP.open('experience'),
    studies: () => XP.open('studies'),
    links: () => XP.open('browser'),
    contact: () => XP.apps.folder({ kind: 'item', key: 'about', id: 'contact' }),
  };

  function route() {
    const r = ROUTES[location.hash.slice(1).toLowerCase()];
    if (!r) return false;
    if (Screens.cur !== 'desktop') {
      initDesktop();
      Screens.instant('desktop');
      desktopShown();
    }
    setTimeout(r, 350);
    return true;
  }

  function init() {
    document.querySelectorAll('[data-bind]').forEach((el) => (el.textContent = P[el.dataset.bind] || ''));
    document.querySelectorAll('[data-icon]').forEach((el) => (el.innerHTML = XP.icon(el.dataset.icon, 64)));
    document.title = `${P.firstName} XP · ${P.name}, ${P.title}`;
    store.set('xp:visits', (+store.get('xp:visits', 0) || 0) + 1);
    buildWelcome();

    document.addEventListener('click', (e) => {
      const t = e.target.closest('[data-open]');
      if (!t) return;
      e.preventDefault();
      XP.open(t.dataset.open, t.getBoundingClientRect());
      if (t.closest('#balloon')) hideBalloon();
    });

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Escape' && Screens.cur === 'desktop' && !XP.terminal.active) return toggleStart();
      if (e.key === 'Escape') closeStart();
      if (Screens.cur !== 'desktop' || XP.terminal.active) return;
      const typing = e.target.closest && e.target.closest('input, textarea, select, [contenteditable]');
      if (typing) return;
      if (e.key === '`' || e.key === '~') {
        e.preventDefault();
        XP.terminal.enter();
      }
    });

    window.addEventListener('hashchange', route);

    if (route()) return;
    if (session.get('xp:booted') || XP.reduced) Screens.instant('welcome');
    else {
      Screens.instant('boot');
      boot();
    }
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
