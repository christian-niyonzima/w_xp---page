/* Minesweeper, written from scratch for this desktop (Start → All Programs → Games).
 * Left click / tap opens a square, right click (or flag mode on phones) plants a flag,
 * clicking a number whose flags are all placed opens its neighbours. Fully playable by
 * keyboard: arrow keys move, Space/Enter opens, F flags. The first click is always safe. */
(function () {
  const XP = (window.XP = window.XP || {});
  const esc = XP.esc;

  const LEVELS = {
    beginner: { label: 'Beginner', cols: 9, rows: 9, mines: 10 },
    intermediate: { label: 'Intermediate', cols: 16, rows: 16, mines: 40 },
    expert: { label: 'Expert', cols: 30, rows: 16, mines: 99 },
  };
  const store = {
    get: (k, d) => {
      try {
        return localStorage.getItem(k) || d;
      } catch (e) {
        return d;
      }
    },
    set: (k, v) => {
      try {
        localStorage.setItem(k, v);
      } catch (e) {}
    },
  };

  // The smiley button, drawn as SVG so it looks the same everywhere.
  const FACES = {
    smile: '<path d="M16 28c2.5 3.5 13.5 3.5 16 0" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><circle cx="18" cy="20" r="2.4"/><circle cx="30" cy="20" r="2.4"/>',
    oh: '<circle cx="24" cy="30" r="3.6" fill="none" stroke="#000" stroke-width="2.4"/><circle cx="18" cy="19" r="2.6"/><circle cx="30" cy="19" r="2.6"/>',
    cool: '<path d="M16 29c2.5 3 13.5 3 16 0" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><path d="M9 17h30l-2 6h-9l-2-3h-4l-2 3h-9z"/>',
    dead: '<path d="M16 32c3-3.5 13-3.5 16 0" fill="none" stroke="#000" stroke-width="2.4" stroke-linecap="round"/><path d="M15 16l6 6M21 16l-6 6M27 16l6 6M33 16l-6 6" stroke="#000" stroke-width="2.2"/>',
  };
  const face = (k) => `<svg viewBox="0 0 48 48" width="26" height="26" aria-hidden="true"><circle cx="24" cy="24" r="19" fill="#ffd400" stroke="#000" stroke-width="2"/>${FACES[k]}</svg>`;
  const MINE = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6v36M6 24h36M11 11l26 26M37 11L11 37" stroke="#000" stroke-width="4"/><circle cx="24" cy="24" r="12"/><circle cx="20" cy="20" r="3.5" fill="#fff"/></svg>';
  const FLAG = '<svg viewBox="0 0 48 48" aria-hidden="true"><path d="M26 8v24" stroke="#000" stroke-width="3"/><path d="M26 8L10 15l16 7z" fill="#e00"/><path d="M14 36h22v4H14zM19 32h12v4H19z"/></svg>';

  function open(from) {
    if (XP.wm.get('mines')) return XP.wm.restore('mines');
    const touch = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
    let level = LEVELS[store.get('xp:mines:level', 'beginner')] ? store.get('xp:mines:level', 'beginner') : 'beginner';
    if (XP.mobile() && level === 'expert') level = 'intermediate';

    const root = XP.html(`<div class="ms">
      <div class="xp-menubar"><button data-menu="game">Game</button><button data-menu="help">Help</button></div>
      <div class="ms-body">
        <div class="ms-top">
          <span class="ms-led" data-led="mines" role="status" aria-label="Mines left">010</span>
          <span class="ms-mid">
            <button class="ms-face" data-act="new" aria-label="New game">${face('smile')}</button>
            ${touch ? '<button class="ms-flagmode" data-act="flagmode" aria-pressed="false" aria-label="Flag mode">' + FLAG + '</button>' : ''}
          </span>
          <span class="ms-led" data-led="time" aria-label="Seconds">000</span>
        </div>
        <div class="ms-grid" role="grid" aria-label="Minefield"></div>
      </div>
      <div class="ms-live sr-only" aria-live="polite"></div>
    </div>`);
    const grid = root.querySelector('.ms-grid');
    const faceBtn = root.querySelector('.ms-face');
    // Only redraw the face when it changes: replacing it mid-click would swallow the click.
    let faceNow = 'smile';
    const setFace = (k) => {
      if (k === faceNow) return;
      faceNow = k;
      faceBtn.innerHTML = face(k);
    };
    const led = (k, n) => (root.querySelector(`[data-led="${k}"]`).textContent = String(Math.max(-99, Math.min(999, n))).padStart(3, '0'));
    const say = (t) => (root.querySelector('.ms-live').textContent = t);

    let cells = [];
    let L, started, over, flags, opened, timer, t0, flagMode = false, focusIdx = 0;

    const win = XP.wm.open({ id: 'mines', title: 'Minesweeper', icon: 'mine', content: root, width: 240, height: 'auto', resizable: false, from, className: 'win-mines', onClose: () => clearInterval(timer) });

    function size() {
      const cell = XP.mobile() ? Math.floor(Math.min(34, (window.innerWidth - 44) / L.cols)) : 22;
      root.style.setProperty('--ms-cell', cell + 'px');
      if (!win.maximized) win.el.style.width = L.cols * cell + 34 + 'px';
    }

    function neighbours(i) {
      const r = Math.floor(i / L.cols), c = i % L.cols, out = [];
      for (let dr = -1; dr <= 1; dr++)
        for (let dc = -1; dc <= 1; dc++) {
          const rr = r + dr, cc = c + dc;
          if ((dr || dc) && rr >= 0 && cc >= 0 && rr < L.rows && cc < L.cols) out.push(rr * L.cols + cc);
        }
      return out;
    }

    function label(i) {
      const x = cells[i], r = Math.floor(i / L.cols) + 1, c = (i % L.cols) + 1;
      const state = x.open ? (x.mine ? 'mine' : x.n ? `${x.n} mine${x.n === 1 ? '' : 's'} around` : 'empty') : x.flag ? 'flagged' : 'hidden';
      return `Row ${r}, column ${c}: ${state}`;
    }

    function paint(i) {
      const x = cells[i], el = x.el;
      el.className = 'ms-cell' + (x.open ? ' is-open' : '') + (x.boom ? ' is-boom' : '') + (x.wrong ? ' is-wrong' : '') + (x.open && x.n ? ' n' + x.n : '');
      el.innerHTML = x.open ? (x.mine ? MINE : x.n || '') : x.flag ? FLAG : '';
      el.setAttribute('aria-label', label(i));
    }

    function newGame(lv) {
      if (lv) {
        level = lv;
        store.set('xp:mines:level', lv);
      }
      L = LEVELS[level];
      clearInterval(timer);
      started = over = false;
      flags = opened = 0;
      focusIdx = 0;
      led('mines', L.mines);
      led('time', 0);
      setFace('smile');
      grid.style.gridTemplateColumns = `repeat(${L.cols}, var(--ms-cell))`;
      grid.innerHTML = '';
      let row = null;
      cells = Array.from({ length: L.cols * L.rows }, (_, i) => {
        if (i % L.cols === 0) {
          row = document.createElement('div');
          row.className = 'ms-row';
          row.setAttribute('role', 'row');
          grid.appendChild(row);
        }
        const el = document.createElement('button');
        el.type = 'button';
        el.dataset.i = i;
        el.setAttribute('role', 'gridcell');
        el.tabIndex = i === 0 ? 0 : -1;
        row.appendChild(el);
        return { el, mine: false, open: false, flag: false, n: 0 };
      });
      cells.forEach((_, i) => paint(i));
      size();
      say(`New ${L.label} game: ${L.cols} by ${L.rows}, ${L.mines} mines.`);
    }

    function plant(safe) {
      const avoid = new Set([safe, ...neighbours(safe)]);
      const spots = cells.map((_, i) => i).filter((i) => !avoid.has(i));
      for (let k = 0; k < L.mines; k++) {
        const j = k + Math.floor(Math.random() * (spots.length - k));
        [spots[k], spots[j]] = [spots[j], spots[k]];
        cells[spots[k]].mine = true;
      }
      cells.forEach((x, i) => (x.n = neighbours(i).filter((j) => cells[j].mine).length));
      started = true;
      t0 = Date.now();
      timer = setInterval(() => led('time', Math.floor((Date.now() - t0) / 1000)), 250);
    }

    function reveal(i) {
      if (over) return;
      const x = cells[i];
      if (x.flag) return;
      if (x.open) return chord(i);
      if (!started) plant(i);
      if (x.mine) return lose(i);
      // Flood fill from empty squares.
      const stack = [i];
      while (stack.length) {
        const j = stack.pop(), y = cells[j];
        if (y.open || y.flag) continue;
        y.open = true;
        opened++;
        paint(j);
        if (!y.n) neighbours(j).forEach((k) => !cells[k].open && stack.push(k));
      }
      XP.sound.play('key');
      if (opened === cells.length - L.mines) winGame();
    }

    function chord(i) {
      const x = cells[i];
      if (!x.n) return;
      const around = neighbours(i);
      if (around.filter((j) => cells[j].flag).length !== x.n) return;
      around.forEach((j) => !cells[j].open && !cells[j].flag && reveal(j));
    }

    function flag(i) {
      if (over) return;
      const x = cells[i];
      if (x.open) return;
      x.flag = !x.flag;
      flags += x.flag ? 1 : -1;
      led('mines', L.mines - flags);
      paint(i);
    }

    function lose(i) {
      over = true;
      clearInterval(timer);
      cells[i].boom = true;
      cells.forEach((x) => {
        if (x.mine && !x.flag) x.open = true;
        if (!x.mine && x.flag) x.wrong = true;
      });
      cells.forEach((_, j) => paint(j));
      setFace('dead');
      XP.sound.play('error');
      say('Boom. You hit a mine. Press the face or F2 for a new game.');
    }

    function winGame() {
      over = true;
      clearInterval(timer);
      const secs = Math.max(1, Math.round((Date.now() - t0) / 1000));
      led('time', secs);
      cells.forEach((x, j) => {
        if (x.mine && !x.flag) {
          x.flag = true;
          paint(j);
        }
      });
      led('mines', 0);
      setFace('cool');
      XP.sound.play('notify');
      const key = 'xp:mines:best:' + level;
      const best = +store.get(key, 0);
      const record = !best || secs < best;
      if (record) store.set(key, secs);
      say(`You win in ${secs} seconds!`);
      setTimeout(
        () =>
          XP.dialog({
            title: record ? 'Best Time' : 'Minesweeper',
            icon: 'info',
            message: `${record ? `You have the fastest time for ${L.label.toLowerCase()} level!` : 'Cleared!'}<br><br>Time: <b>${secs} seconds</b>${!record ? `<br>Best: ${best} seconds` : ''}<br><br>Clearing minefields is fun. Clearing bugs is ${esc(window.PROFILE.firstName)}'s day job.`,
          }),
        450
      );
    }

    function bestTimes() {
      const rows = Object.entries(LEVELS)
        .map(([k, v]) => `<tr><td>${v.label}:</td><td>${+store.get('xp:mines:best:' + k, 0) ? store.get('xp:mines:best:' + k) + ' seconds' : '—'}</td></tr>`)
        .join('');
      XP.dialog({ title: 'Fastest Mine Sweepers', icon: 'mine', message: `<table class="props">${rows}</table>` });
    }

    const at = (e) => {
      const el = e.target.closest('.ms-cell');
      return el ? +el.dataset.i : -1;
    };
    grid.addEventListener('click', (e) => {
      const i = at(e);
      if (i < 0) return;
      cells[focusIdx].el.tabIndex = -1; // the clicked square becomes the keyboard position
      focusIdx = i;
      cells[i].el.tabIndex = 0;
      flagMode && !cells[i].open ? flag(i) : reveal(i);
    });
    grid.addEventListener('contextmenu', (e) => {
      const i = at(e);
      if (i < 0) return;
      e.preventDefault();
      e.stopPropagation();
      cells[i].open ? chord(i) : flag(i);
    });
    grid.addEventListener('pointerdown', (e) => !over && e.button === 0 && at(e) >= 0 && setFace('oh'));
    window.addEventListener('pointerup', function up() {
      if (!root.isConnected) return window.removeEventListener('pointerup', up);
      if (!over) setFace('smile');
    });
    grid.addEventListener('keydown', (e) => {
      const i = at(e);
      if (i < 0) return;
      const r = Math.floor(i / L.cols), c = i % L.cols;
      const move = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key];
      if (move) {
        e.preventDefault();
        const rr = Math.min(L.rows - 1, Math.max(0, r + move[0])), cc = Math.min(L.cols - 1, Math.max(0, c + move[1]));
        focusCell(rr * L.cols + cc);
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        reveal(i);
        say(label(i));
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        flag(i);
        say(label(i));
      }
    });
    function focusCell(i) {
      cells[focusIdx].el.tabIndex = -1;
      focusIdx = i;
      cells[i].el.tabIndex = 0;
      cells[i].el.focus();
    }
    root.addEventListener('keydown', (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        newGame();
      }
    });
    root.addEventListener('click', (e) => {
      const t = e.target.closest('[data-act],[data-menu]');
      if (!t) return;
      if (t.dataset.act === 'new') newGame();
      if (t.dataset.act === 'flagmode') {
        flagMode = !flagMode;
        t.setAttribute('aria-pressed', String(flagMode));
        t.classList.toggle('is-on', flagMode);
      }
      if (t.dataset.menu === 'game')
        XP.menu(
          [
            { label: 'New      F2', bold: true, action: () => newGame() },
            '-',
            ...Object.entries(LEVELS).map(([k, v]) => ({ label: v.label, checked: level === k, disabled: k === 'expert' && XP.mobile(), action: () => newGame(k) })),
            '-',
            { label: 'Best Times...', action: bestTimes },
            '-',
            { label: 'Exit', action: () => XP.wm.close(win.id) },
          ],
          0,
          0,
          { anchor: t }
        );
      if (t.dataset.menu === 'help')
        XP.menu(
          [
            {
              label: 'How to Play',
              icon: 'help',
              action: () =>
                XP.dialog({
                  title: 'How to Play',
                  icon: 'mine',
                  message:
                    'Open every square that has no mine.<br><br>A number tells you how many mines touch that square. <b>Right-click</b> (or use the flag button on phones) to flag a mine; click a number whose mines are all flagged to open its neighbours.<br><br>Keyboard: arrow keys move, <b>Space</b> opens, <b>F</b> flags, <b>F2</b> starts over.',
                }),
            },
            { label: 'Best Times...', action: bestTimes },
          ],
          0,
          0,
          { anchor: t }
        );
    });

    newGame();
    return win;
  }

  XP.games = { minesweeper: open };
})();
