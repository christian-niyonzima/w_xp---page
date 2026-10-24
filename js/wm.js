/* Window manager: XP Luna windows with 3D open / close / minimise animations,
 * plus shared helpers (animation, menus, message boxes) and a "Flip 3D" switcher. */
(function () {
  const XP = (window.XP = window.XP || {});

  XP.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  XP.mobile = () => window.innerWidth <= 720;
  XP.$ = (s, r = document) => r.querySelector(s);
  XP.$$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  XP.esc = (s) =>
    String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  XP.html = (str) => {
    const t = document.createElement('template');
    t.innerHTML = str.trim();
    return t.content.firstElementChild;
  };
  XP.wait = (ms) => new Promise((r) => setTimeout(r, ms));

  /** Web Animations wrapper that becomes a no-op when the user prefers reduced motion. */
  XP.animate = (el, frames, opts = {}) => {
    if (XP.reduced || !el || !el.animate) return { finished: Promise.resolve(), cancel() {} };
    const a = el.animate(frames, Object.assign({ duration: 400, easing: 'cubic-bezier(.2,.8,.2,1)' }, opts));
    a.finished.catch(() => {});
    return a;
  };
  XP.settle = (...anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

  /** Briefly show the XP "working in background" cursor. */
  XP.busy = (ms = 600) => {
    document.documentElement.classList.add('is-busy');
    clearTimeout(XP.busy.t);
    XP.busy.t = setTimeout(() => document.documentElement.classList.remove('is-busy'), ms);
  };

  const wins = new Map();
  let zTop = 20;
  let seq = 0;
  let activeId = null;

  const layer = () => document.getElementById('desk-windows');
  // Layout size of the window area (ignores 3D transforms on the desktop).
  const areaOf = () => ({ width: layer().clientWidth, height: layer().clientHeight });
  const bar = () => document.getElementById('task-buttons');
  const P = (deg) => `perspective(1400px) ${deg}`;

  function open(o) {
    const id = o.id || 'win-' + ++seq;
    const existing = wins.get(id);
    if (existing) {
      if (existing.minimized) restore(id);
      else focus(id);
      return existing;
    }

    const resizable = o.resizable !== false;
    const el = XP.html(`<div class="window ${o.className || ''}" role="dialog" aria-label="${XP.esc(o.title)}">
      <div class="titlebar">
        <span class="tb-icon">${XP.icon(o.icon || 'folder', 16)}</span>
        <span class="tb-title">${XP.esc(o.title)}</span>
        <div class="tb-buttons">
          ${o.minimizable === false ? '' : '<button class="tb-b tb-min" aria-label="Minimize" title="Minimize"></button>'}
          ${resizable ? '<button class="tb-b tb-max" aria-label="Maximize" title="Maximize"></button>' : ''}
          <button class="tb-b tb-close" aria-label="Close" title="Close"></button>
        </div>
      </div>
      <div class="window-body"></div>
      ${resizable ? ['n', 'e', 's', 'w', 'ne', 'nw', 'se', 'sw'].map((d) => `<div class="rz rz-${d}" data-dir="${d}"></div>`).join('') : ''}
    </div>`);
    const body = el.querySelector('.window-body');
    if (typeof o.content === 'string') body.innerHTML = o.content;
    else if (o.content) body.appendChild(o.content);

    const area = areaOf();
    const w = Math.min(o.width || 640, area.width - 16);
    el.style.width = w + 'px';
    if (o.height !== 'auto') el.style.height = Math.min(o.height || 460, area.height - 16) + 'px';
    layer().appendChild(el);

    const h = el.offsetHeight;
    const k = (wins.size % 6) - 2.5;
    const x = o.x != null ? o.x : Math.max(8, (area.width - w) / 2 + k * 26);
    const y = o.y != null ? o.y : Math.max(8, (area.height - h) / 2.4 + k * 22);
    el.style.left = Math.round(x) + 'px';
    el.style.top = Math.round(y) + 'px';

    const win = { id, el, body, title: o.title, icon: o.icon, minimized: false, maximized: false, opts: o };
    wins.set(id, win);

    if (o.taskbar !== false) {
      win.btn = XP.html(`<button class="task-btn" title="${XP.esc(o.title)}">${XP.icon(o.icon || 'folder', 16)}<span>${XP.esc(o.title)}</span></button>`);
      win.btn.addEventListener('click', () => taskClick(id));
      bar().appendChild(win.btn);
    }

    wire(win);
    if ((XP.mobile() && resizable) || o.maximized) maximize(id, false);
    focus(id);

    // 3D "fly out of the icon" entrance.
    const r = el.getBoundingClientRect();
    if (o.from) el.style.transformOrigin = `${o.from.left + o.from.width / 2 - r.left}px ${o.from.top + o.from.height / 2 - r.top}px`;
    const a = XP.animate(
      el,
      [
        { transform: P('rotateX(-62deg) rotateY(22deg) scale(.06)'), opacity: 0 },
        { transform: P('rotateX(7deg) rotateY(-3deg) scale(1.015)'), opacity: 1, offset: 0.72 },
        { transform: P('rotateX(0deg) rotateY(0deg) scale(1)'), opacity: 1 },
      ],
      { duration: o.from ? 640 : 420, easing: 'cubic-bezier(.2,.9,.25,1)' }
    );
    XP.settle(a).then(() => (el.style.transformOrigin = ''));
    if (o.sound !== false) XP.sound.play('open');
    return win;
  }

  function wire(win) {
    const { el, id } = win;
    el.addEventListener('pointerdown', () => !flipping && focus(id), true);
    const tb = el.querySelector('.titlebar');
    tb.addEventListener('pointerdown', (e) => drag(win, e));
    tb.addEventListener('dblclick', (e) => {
      if (!e.target.closest('.tb-b') && win.opts.resizable !== false) toggleMax(id);
    });
    const min = el.querySelector('.tb-min');
    const max = el.querySelector('.tb-max');
    if (min) min.addEventListener('click', () => minimize(id));
    if (max) max.addEventListener('click', () => toggleMax(id));
    el.querySelector('.tb-close').addEventListener('click', () => close(id));
    el.querySelectorAll('.rz').forEach((h) => h.addEventListener('pointerdown', (e) => resize(win, e, h.dataset.dir)));
  }

  function track(onMove, onEnd) {
    const up = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.body.classList.remove('is-dragging-ui');
      onEnd && onEnd();
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    document.body.classList.add('is-dragging-ui');
  }

  function drag(win, e) {
    if (e.button !== 0 || e.target.closest('.tb-b') || win.maximized || XP.mobile() || flipping) return;
    e.preventDefault();
    const el = win.el;
    const area = areaOf();
    const sx = e.clientX, sy = e.clientY, ox = el.offsetLeft, oy = el.offsetTop;
    track((ev) => {
      const nx = Math.min(Math.max(ox + ev.clientX - sx, 70 - el.offsetWidth), area.width - 70);
      const ny = Math.min(Math.max(oy + ev.clientY - sy, 0), area.height - 30);
      el.style.left = nx + 'px';
      el.style.top = ny + 'px';
    });
  }

  function resize(win, e, dir) {
    if (e.button !== 0 || win.maximized || XP.mobile() || flipping) return;
    e.preventDefault();
    e.stopPropagation();
    const el = win.el;
    const sx = e.clientX, sy = e.clientY;
    const s = { l: el.offsetLeft, t: el.offsetTop, w: el.offsetWidth, h: el.offsetHeight };
    const minW = win.opts.minWidth || 320;
    const minH = win.opts.minHeight || 220;
    track((ev) => {
      const dx = ev.clientX - sx, dy = ev.clientY - sy;
      let { l, t, w, h } = s;
      if (dir.includes('e')) w = Math.max(minW, s.w + dx);
      if (dir.includes('s')) h = Math.max(minH, s.h + dy);
      if (dir.includes('w')) {
        w = Math.max(minW, s.w - dx);
        l = s.l + s.w - w;
      }
      if (dir.includes('n')) {
        h = Math.max(minH, s.h - dy);
        t = s.t + s.h - h;
        if (t < 0) {
          t = 0;
          h = s.t + s.h;
        }
      }
      Object.assign(el.style, { left: l + 'px', top: t + 'px', width: w + 'px', height: h + 'px' });
    });
  }

  function geom(el) {
    el.classList.add('is-geom');
    clearTimeout(el._geomT);
    el._geomT = setTimeout(() => el.classList.remove('is-geom'), 260);
  }

  function maximize(id, animate = true) {
    const win = wins.get(id);
    if (!win || win.maximized) return;
    const s = win.el.style;
    win.prev = { left: s.left, top: s.top, width: s.width, height: s.height };
    if (animate) geom(win.el);
    win.maximized = true;
    win.el.classList.add('is-max');
    Object.assign(s, { left: '0px', top: '0px', width: '100%', height: '100%' });
  }

  function unmaximize(id) {
    const win = wins.get(id);
    if (!win || !win.maximized || XP.mobile()) return;
    geom(win.el);
    win.maximized = false;
    win.el.classList.remove('is-max');
    Object.assign(win.el.style, win.prev || {});
  }

  function toggleMax(id) {
    const win = wins.get(id);
    if (!win) return;
    win.maximized ? unmaximize(id) : maximize(id);
  }

  function focus(id) {
    const win = wins.get(id);
    if (!win) return;
    if (activeId !== id || win.el.style.zIndex === '') win.el.style.zIndex = ++zTop;
    activeId = id;
    wins.forEach((w) => {
      const on = w === win;
      w.el.classList.toggle('is-inactive', !on);
      if (w.btn) w.btn.classList.toggle('is-active', on && !w.minimized);
    });
  }

  function focusTop() {
    let best = null;
    wins.forEach((w) => {
      if (!w.minimized && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w;
    });
    if (best) focus(best.id);
    else {
      activeId = null;
      wins.forEach((w) => w.btn && w.btn.classList.remove('is-active'));
    }
  }

  function taskClick(id) {
    const win = wins.get(id);
    if (!win) return;
    if (win.minimized) restore(id);
    else if (activeId === id) minimize(id);
    else focus(id);
  }

  function towardsButton(win) {
    const r = win.el.getBoundingClientRect();
    const t = (win.btn || document.getElementById('start-btn')).getBoundingClientRect();
    return {
      dx: t.left + t.width / 2 - (r.left + r.width / 2),
      dy: t.top + t.height / 2 - (r.top + r.height / 2),
    };
  }

  async function minimize(id) {
    const win = wins.get(id);
    if (!win || win.minimized) return;
    win.minimized = true;
    if (win.btn) win.btn.classList.remove('is-active');
    const { dx, dy } = towardsButton(win);
    const a = XP.animate(
      win.el,
      [
        { transform: P('translate(0,0) rotateX(0deg) scale(1)'), opacity: 1 },
        { transform: P(`translate(${dx}px,${dy}px) rotateX(72deg) scale(.06)`), opacity: 0.15 },
      ],
      { duration: 420, easing: 'cubic-bezier(.55,0,.8,.3)' }
    );
    await XP.settle(a);
    if (win.minimized) win.el.classList.add('is-min');
    focusTop();
  }

  function restore(id) {
    const win = wins.get(id);
    if (!win) return;
    if (win.minimized) {
      win.minimized = false;
      win.el.classList.remove('is-min');
      const { dx, dy } = towardsButton(win);
      XP.animate(
        win.el,
        [
          { transform: P(`translate(${dx}px,${dy}px) rotateX(72deg) scale(.06)`), opacity: 0.15 },
          { transform: P('translate(0,0) rotateX(0deg) scale(1)'), opacity: 1 },
        ],
        { duration: 420, easing: 'cubic-bezier(.2,.8,.3,1)' }
      );
    }
    focus(id);
  }

  async function close(id) {
    const win = wins.get(id);
    if (!win || win.closing) return;
    if (win.opts.onClose && win.opts.onClose() === false) return;
    win.closing = true;
    wins.delete(id);
    if (win.btn) win.btn.remove();
    XP.sound.play('close');
    const a = XP.animate(
      win.el,
      [
        { transform: P('rotateY(0deg) rotateX(0deg) translateZ(0px) scale(1)'), opacity: 1 },
        { transform: P('rotateY(-32deg) rotateX(14deg) translateZ(-300px) scale(.86)'), opacity: 0 },
      ],
      { duration: 360, easing: 'cubic-bezier(.5,0,.75,0)' }
    );
    focusTop();
    await XP.settle(a);
    win.el.remove();
  }

  function setTitle(id, title, icon) {
    const win = wins.get(id);
    if (!win) return;
    win.title = title;
    win.el.querySelector('.tb-title').textContent = title;
    win.el.setAttribute('aria-label', title);
    if (icon) win.el.querySelector('.tb-icon').innerHTML = XP.icon(icon, 16);
    if (win.btn) {
      win.btn.title = title;
      win.btn.querySelector('span').textContent = title;
      if (icon) win.btn.querySelector('svg, img').outerHTML = XP.icon(icon, 16);
    }
  }

  /** Quick Launch "Show Desktop": minimise everything, or bring it all back. */
  function toggleDesktop() {
    const visible = [...wins.values()].filter((w) => !w.minimized);
    if (visible.length) visible.forEach((w) => minimize(w.id));
    else wins.forEach((w) => restore(w.id));
  }

  /** Keep windows reachable after the browser window shrinks. */
  function fit() {
    const area = areaOf();
    wins.forEach((w) => {
      if (XP.mobile() && w.opts.resizable !== false) return maximize(w.id, false);
      if (w.maximized) return;
      const el = w.el;
      if (el.offsetWidth > area.width) el.style.width = area.width - 8 + 'px';
      if (el.offsetHeight > area.height) el.style.height = area.height - 8 + 'px';
      el.style.left = Math.min(Math.max(el.offsetLeft, 0), Math.max(0, area.width - el.offsetWidth)) + 'px';
      el.style.top = Math.min(Math.max(el.offsetTop, 0), Math.max(0, area.height - 30)) + 'px';
    });
  }

  /* ------------------------------------------------------------------
   * Flip 3D: fan every open window out in a 3D stack, pick one.
   * ------------------------------------------------------------------ */
  let flipping = null;
  function flip3d() {
    if (flipping) return flipping.finish();
    const list = [...wins.values()]
      .filter((w) => !w.minimized)
      .sort((a, b) => +b.el.style.zIndex - +a.el.style.zIndex);
    if (list.length === 0) {
      dialog({ title: 'Flip 3D', icon: 'info', message: 'Open a few windows first, then try Flip 3D again.' });
      return;
    }
    const L = layer();
    const area = areaOf();
    const overlay = XP.html('<div class="flip-overlay"><p>Flip 3D · click a window · <b>Tab</b> / scroll to cycle · <b>Esc</b> to cancel</p></div>');
    L.appendChild(overlay);
    L.classList.add('is-flip');
    let order = list.slice();

    const layout = () =>
      order.forEach((w, i) => {
        const el = w.el;
        const ex = el.offsetLeft + el.offsetWidth / 2;
        const ey = el.offsetTop + el.offsetHeight / 2;
        const s = Math.min(1, (area.width * 0.55) / el.offsetWidth, (area.height * 0.6) / el.offsetHeight);
        // Fan the stack out diagonally, each window further back in Z.
        el.style.transform = `perspective(1800px) translate(${area.width / 2 - ex + i * 90 - (order.length - 1) * 35}px, ${area.height / 2 - ey - i * 42 + (order.length - 1) * 16}px) translateZ(${-i * 210}px) rotateY(32deg) scale(${s})`;
        el.style.zIndex = 5000 - i;
        el.style.opacity = Math.max(0.3, 1 - i * 0.16);
      });

    list.forEach((w) => w.el.classList.add('flip-item'));
    requestAnimationFrame(layout);

    const cycle = (d) => {
      order = d > 0 ? order.slice(1).concat(order[0]) : [order[order.length - 1]].concat(order.slice(0, -1));
      layout();
    };
    const onKey = (e) => {
      if (e.key === 'Escape') finish(list[0]);
      else if (e.key === 'Tab' || e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        cycle(e.shiftKey ? -1 : 1);
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') cycle(-1);
      else if (e.key === 'Enter') finish(order[0]);
    };
    const onWheel = (e) => {
      e.preventDefault();
      cycle(e.deltaY > 0 ? 1 : -1);
    };
    const onPick = (e) => {
      const hit = order.find((w) => w.el.contains(e.target));
      e.preventDefault();
      e.stopPropagation();
      finish(hit || order[0]);
    };

    function finish(pick) {
      document.removeEventListener('keydown', onKey, true);
      L.removeEventListener('wheel', onWheel);
      L.removeEventListener('click', onPick, true);
      overlay.remove();
      L.classList.remove('is-flip');
      list.forEach((w) => {
        w.el.style.transform = '';
        w.el.style.opacity = '';
      });
      // Restore stacking order, then raise the picked window.
      list.slice().reverse().forEach((w) => (w.el.style.zIndex = ++zTop));
      if (pick) {
        activeId = null;
        focus(pick.id);
      }
      setTimeout(() => list.forEach((w) => w.el.classList.remove('flip-item')), 600);
      flipping = null;
    }

    document.addEventListener('keydown', onKey, true);
    L.addEventListener('wheel', onWheel, { passive: false });
    L.addEventListener('click', onPick, true);
    flipping = { finish: () => finish(order[0]) };
  }

  /* ------------------------------------------------------------------
   * Message boxes
   * ------------------------------------------------------------------ */
  function dialog({ title = 'Christian XP', icon = 'info', message = '', buttons = ['OK'], from } = {}) {
    return new Promise((resolve) => {
      let answered = false;
      const content = XP.html(`<div class="msgbox">
        <div class="msgbox-row"><span class="msgbox-ico">${XP.icon(icon, 32)}</span><div class="msgbox-text">${message}</div></div>
        <div class="msgbox-btns">${buttons.map((b, i) => `<button class="xp-btn" data-i="${i}">${XP.esc(b)}</button>`).join('')}</div>
      </div>`);
      const win = open({
        title,
        icon,
        content,
        width: 380,
        height: 'auto',
        resizable: false,
        minimizable: false,
        taskbar: false,
        sound: false,
        className: 'is-dialog',
        from,
        onClose: () => {
          if (!answered) resolve(null);
        },
      });
      XP.sound.play(icon === 'error' || icon === 'warning' ? 'error' : 'ding');
      content.querySelectorAll('button').forEach((b) =>
        b.addEventListener('click', () => {
          answered = true;
          resolve(buttons[+b.dataset.i]);
          close(win.id);
        })
      );
      const first = content.querySelector('button');
      if (first) setTimeout(() => first.focus(), 50);
    });
  }

  /* ------------------------------------------------------------------
   * Drop-down / context menus
   * items: [{ label, icon, action, disabled, bold, checked } | '-']
   * ------------------------------------------------------------------ */
  let openMenu = null;
  function menu(items, x, y, { anchor, onClose } = {}) {
    closeMenu();
    const el = XP.html('<div class="ctx-menu" role="menu"></div>');
    items.forEach((it) => {
      if (it === '-') return el.appendChild(XP.html('<div class="ctx-sep"></div>'));
      const b = XP.html(`<button class="ctx-item${it.bold ? ' is-bold' : ''}" role="menuitem" ${it.disabled ? 'disabled' : ''}>
        <span class="ci-ico">${it.checked ? '<span class="ci-check">●</span>' : it.icon ? XP.icon(it.icon, 16) : ''}</span><span class="ci-label">${XP.esc(it.label)}</span>
      </button>`);
      b.addEventListener('click', (e) => {
        e.stopPropagation();
        closeMenu();
        it.action && it.action();
      });
      el.appendChild(b);
    });
    document.getElementById('screen-desktop').appendChild(el);
    const vw = window.innerWidth, vh = window.innerHeight;
    if (anchor) {
      const r = anchor.getBoundingClientRect();
      x = r.left;
      y = r.bottom;
    }
    el.style.left = Math.min(x, vw - el.offsetWidth - 4) + 'px';
    el.style.top = (y + el.offsetHeight > vh - 4 ? Math.max(4, y - el.offsetHeight) : y) + 'px';
    XP.animate(el, [{ opacity: 0, transform: 'perspective(600px) rotateX(-18deg)' }, { opacity: 1, transform: 'perspective(600px) rotateX(0deg)' }], {
      duration: 160,
    });
    const away = (e) => {
      if (!el.contains(e.target)) closeMenu();
    };
    const key = (e) => {
      if (e.key === 'Escape') closeMenu();
    };
    setTimeout(() => {
      document.addEventListener('pointerdown', away, true);
      document.addEventListener('keydown', key);
    });
    openMenu = {
      el,
      done() {
        document.removeEventListener('pointerdown', away, true);
        document.removeEventListener('keydown', key);
        el.remove();
        onClose && onClose();
      },
    };
    return el;
  }
  function closeMenu() {
    if (openMenu) {
      const m = openMenu;
      openMenu = null;
      m.done();
    }
  }

  XP.wm = { open, close, focus, minimize, restore, maximize, toggleMax, setTitle, toggleDesktop, fit, flip3d, get: (id) => wins.get(id), all: () => [...wins.values()] };
  XP.dialog = dialog;
  XP.menu = menu;
  XP.closeMenu = closeMenu;
})();
