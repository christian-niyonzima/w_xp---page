/* Window manager: XP Luna windows with smooth open / close / minimise animations,
 * plus shared helpers (animation, menus, message boxes) and a "Flip 3D" switcher. */
(function () {
  const XP = (window.XP = window.XP || {});

  XP.reduced = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* Transitions can be switched off: by the owner (PROFILE.transitions = false),
   * by each visitor (Display Properties → Appearance), or by the OS "reduce motion" setting. */
  const motionPref = () => {
    try {
      const v = localStorage.getItem('xp:motion');
      if (v === '0' || v === '1') return v === '1';
    } catch (e) {}
    return (window.PROFILE || {}).transitions !== false;
  };
  XP.motion = () => !XP.reduced && motionPref();
  XP.setMotion = (on) => {
    try {
      localStorage.setItem('xp:motion', on ? '1' : '0');
    } catch (e) {}
    document.documentElement.classList.toggle('no-motion', !XP.motion());
  };
  document.documentElement.classList.toggle('no-motion', !XP.motion());

  // Modern easing: fast start, long soft landing.
  XP.EASE = 'cubic-bezier(.22,1,.36,1)';
  XP.EASE_IN = 'cubic-bezier(.55,0,.75,.2)';
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

  /* Was the last interaction a key press? Menus then highlight their first item, like XP. */
  let lastInput = 'pointer';
  document.addEventListener('keydown', () => (lastInput = 'key'), true);
  document.addEventListener('pointerdown', () => (lastInput = 'pointer'), true);
  XP.byKeyboard = () => lastInput === 'key';
  const usable = (n) => n && n.isConnected && n !== document.body && n.offsetParent !== null;

  /** Web Animations wrapper that becomes a no-op when the user prefers reduced motion. */
  XP.animate = (el, frames, opts = {}) => {
    if (!XP.motion() || !el || !el.animate) return { finished: Promise.resolve(), cancel() {} };
    const a = el.animate(frames, Object.assign({ duration: 400, easing: XP.EASE }, opts));
    a.finished.catch(() => {});
    return a;
  };
  XP.settle = (...anims) => Promise.all(anims.map((a) => a.finished.catch(() => {})));

  /**
   * Arrow-key navigation over a set of items laid out in 2D (desktop icons, folder tiles,
   * menus). Moves focus to the nearest item in the pressed direction; returns true if handled.
   */
  XP.arrowNav = (e, items, current) => {
    const dirs = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
    const d = dirs[e.key];
    if (!d && e.key !== 'Home' && e.key !== 'End') return false;
    const list = items.filter((x) => x.offsetParent !== null && !x.disabled);
    if (!list.length) return false;
    let next = null;
    if (e.key === 'Home') next = list[0];
    else if (e.key === 'End') next = list[list.length - 1];
    else {
      const c = current.getBoundingClientRect();
      const cx = c.left + c.width / 2, cy = c.top + c.height / 2;
      let best = Infinity;
      list.forEach((x) => {
        if (x === current) return;
        const r = x.getBoundingClientRect();
        const dx = r.left + r.width / 2 - cx, dy = r.top + r.height / 2 - cy;
        const along = dx * d[0] + dy * d[1];
        if (along <= 2) return; // not in that direction
        const across = Math.abs(dx * d[1]) + Math.abs(dy * d[0]);
        const score = along + across * 2.5;
        if (score < best) {
          best = score;
          next = x;
        }
      });
    }
    e.preventDefault();
    if (next) next.focus();
    return true;
  };

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

  function open(o) {
    const id = o.id || 'win-' + ++seq;
    const existing = wins.get(id);
    if (existing) {
      if (existing.minimized) restore(id);
      else focus(id);
      return existing;
    }

    const resizable = o.resizable !== false;
    const opener = document.activeElement;
    const el = XP.html(`<div class="window ${o.className || ''}" role="dialog" aria-label="${XP.esc(o.title)}" tabindex="-1">
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

    const win = { id, el, body, title: o.title, icon: o.icon, minimized: false, maximized: false, opts: o, opener: usable(opener) ? opener : null };
    wins.set(id, win);

    if (o.taskbar !== false) {
      win.btn = XP.html(`<button class="task-btn" aria-pressed="false" title="${XP.esc(o.title)}">${XP.icon(o.icon || 'folder', 16)}<span>${XP.esc(o.title)}</span></button>`);
      win.btn.addEventListener('click', () => taskClick(id));
      bar().appendChild(win.btn);
    }

    wire(win);
    if ((XP.mobile() && resizable) || o.maximized) maximize(id, false);
    focus(id);
    // Keyboard and screen-reader users land inside the new window (apps may move focus further in).
    requestAnimationFrame(() => !el.contains(document.activeElement) && el.isConnected && el.focus({ preventScroll: true }));

    // Sweep out of the icon that opened it (or a soft zoom-in when there is no icon).
    const r = el.getBoundingClientRect();
    if (o.from) el.style.transformOrigin = `${o.from.left + o.from.width / 2 - r.left}px ${o.from.top + o.from.height / 2 - r.top}px`;
    const a = XP.animate(
      el,
      [
        { transform: o.from ? 'translateY(0px) scale(.25)' : 'translateY(12px) scale(.96)', opacity: 0 },
        { transform: 'translateY(0px) scale(1)', opacity: 1 },
      ],
      { duration: o.from ? 420 : 260 }
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
      if (w.btn) {
        w.btn.classList.toggle('is-active', on && !w.minimized);
        w.btn.setAttribute('aria-pressed', String(on && !w.minimized));
      }
    });
    syncHash();
  }

  /** Keep the address bar's #hash in step with the window in front, so any view can be shared. */
  function syncHash() {
    if (!XP.setHash || (XP.terminal && XP.terminal.active)) return;
    const w = wins.get(activeId);
    if (w && /\bis-dialog\b/.test(w.opts.className || '')) return; // message boxes leave it alone
    XP.setHash(w && !w.minimized && w.opts.hash ? w.opts.hash : '');
  }

  function focusTop() {
    let best = null;
    wins.forEach((w) => {
      if (!w.minimized && (!best || +w.el.style.zIndex > +best.el.style.zIndex)) best = w;
    });
    if (best) focus(best.id);
    else {
      activeId = null;
      wins.forEach((w) => {
        if (!w.btn) return;
        w.btn.classList.remove('is-active');
        w.btn.setAttribute('aria-pressed', 'false');
      });
      syncHash();
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
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: `translate(${dx}px,${dy}px) scale(.16)`, opacity: 0 },
      ],
      { duration: 300, easing: XP.EASE_IN }
    );
    const hadFocus = win.el.contains(document.activeElement);
    await XP.settle(a);
    if (win.minimized) win.el.classList.add('is-min');
    focusTop();
    if (hadFocus) {
      const top = wins.get(activeId);
      (top ? top.el : win.btn || document.getElementById('start-btn')).focus({ preventScroll: true });
    }
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
          { transform: `translate(${dx}px,${dy}px) scale(.16)`, opacity: 0 },
          { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        ],
        { duration: 380 }
      );
    }
    focus(id);
    if (!win.el.contains(document.activeElement)) win.el.focus({ preventScroll: true });
  }

  async function close(id) {
    const win = wins.get(id);
    if (!win || win.closing) return;
    if (win.opts.onClose && win.opts.onClose() === false) return;
    win.closing = true;
    const hadFocus = win.el.contains(document.activeElement);
    wins.delete(id);
    if (win.btn) win.btn.remove();
    XP.sound.play('close');
    const a = XP.animate(
      win.el,
      [
        { transform: 'translateY(0px) scale(1)', opacity: 1 },
        { transform: 'translateY(10px) scale(.95)', opacity: 0 },
      ],
      { duration: 180, easing: XP.EASE_IN }
    );
    win.el.style.pointerEvents = 'none';
    focusTop();
    if (hadFocus) {
      // Give focus back to whatever opened the window (raising its window too), or else to
      // the window now on top.
      const top = wins.get(activeId);
      const back = usable(win.opener) && !win.el.contains(win.opener) ? win.opener : top ? top.el : null;
      const owner = back && [...wins.values()].find((w) => w.el.contains(back));
      if (owner) focus(owner.id);
      if (back) back.focus({ preventScroll: true });
      else document.activeElement.blur();
    }
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

  /* Esc closes small dialog windows (message boxes, Run, Display Properties), like XP. */
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape' || e.ctrlKey || e.altKey || e.metaKey || e.defaultPrevented || openMenu || flipping) return;
    if ((XP.terminal && XP.terminal.active) || document.querySelector('.xp-dim')) return;
    if (XP.desktop && XP.desktop.isStartOpen && XP.desktop.isStartOpen()) return;
    const w = wins.get(activeId);
    // Only when the keyboard is in that window (or nowhere in particular), not e.g. on the desktop.
    const here = !document.activeElement || document.activeElement === document.body || (w && w.el.contains(document.activeElement));
    if (w && w.opts.escClose && !w.minimized && here) {
      e.preventDefault();
      close(w.id);
    }
  });

  /* ------------------------------------------------------------------
   * Message boxes
   * ------------------------------------------------------------------ */
  function dialog({ title = 'Christian XP', icon = 'info', message = '', buttons = ['OK'], from } = {}) {
    return new Promise((resolve) => {
      let answered = false;
      const textId = 'msg-' + ++seq;
      const content = XP.html(`<div class="msgbox">
        <div class="msgbox-row"><span class="msgbox-ico">${XP.icon(icon, 32)}</span><div class="msgbox-text" id="${textId}">${message}</div></div>
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
        escClose: true,
        from,
        onClose: () => {
          if (!answered) resolve(null);
        },
      });
      win.el.setAttribute('role', 'alertdialog');
      win.el.setAttribute('aria-describedby', textId);
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
  function menu(items, x, y, { anchor, onClose, label } = {}) {
    closeMenu();
    const opener = document.activeElement;
    const el = XP.html(`<div class="ctx-menu" role="menu" tabindex="-1"${label ? ` aria-label="${XP.esc(label)}"` : ''}></div>`);
    items.forEach((it) => {
      if (it === '-') return el.appendChild(XP.html('<div class="ctx-sep" role="separator"></div>'));
      const b = XP.html(`<button class="ctx-item${it.bold ? ' is-bold' : ''}" role="${it.checked != null ? 'menuitemradio' : 'menuitem'}"${it.checked != null ? ` aria-checked="${!!it.checked}"` : ''} ${it.disabled ? 'disabled' : ''}>
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
    XP.animate(el, [{ opacity: 0, transform: 'translateY(-4px)' }, { opacity: 1, transform: 'translateY(0px)' }], { duration: 140 });
    const away = (e) => {
      if (!el.contains(e.target)) closeMenu();
    };
    const key = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
      }
    };
    el.addEventListener('keydown', (e) => {
      const list = [...el.querySelectorAll('.ctx-item:not(:disabled)')];
      const i = list.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        // Handled here as well: the document-level listener is only attached a tick after opening.
        e.preventDefault();
        e.stopPropagation();
        closeMenu();
      } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        const n = e.key === 'ArrowDown' ? (i + 1) % list.length : (i <= 0 ? list.length : i) - 1;
        if (list[n]) list[n].focus();
      } else if (e.key === 'Home' || e.key === 'End') {
        e.preventDefault();
        if (list.length) list[e.key === 'Home' ? 0 : list.length - 1].focus();
      } else if (e.key === 'Tab') {
        e.preventDefault();
        closeMenu();
      }
    });
    // From the keyboard the first item lights up; with the mouse the menu just takes focus.
    const first = el.querySelector('.ctx-item:not(:disabled)');
    (XP.byKeyboard() && first ? first : el).focus({ preventScroll: true });
    setTimeout(() => {
      document.addEventListener('pointerdown', away, true);
      document.addEventListener('keydown', key);
    });
    openMenu = {
      el,
      done() {
        document.removeEventListener('pointerdown', away, true);
        document.removeEventListener('keydown', key);
        const hadFocus = el.contains(document.activeElement);
        el.remove();
        if (hadFocus && usable(opener)) opener.focus({ preventScroll: true });
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

  XP.wm = { open, close, focus, minimize, restore, maximize, toggleMax, setTitle, toggleDesktop, fit, flip3d, syncHash, get: (id) => wins.get(id), all: () => [...wins.values()] };
  XP.dialog = dialog;
  XP.menu = menu;
  XP.closeMenu = closeMenu;
})();
