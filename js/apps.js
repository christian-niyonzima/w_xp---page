/* Apps that live in XP windows: the folder Explorer (with 3D cube navigation),
 * the Web Explorer links browser, Run, Display Properties and Help. */
(function () {
  const XP = (window.XP = window.XP || {});
  const P = window.PROFILE;
  const A = P.about || {};
  const esc = XP.esc;

  const ACCENTS = ['#3b8cff', '#ff8a1e', '#3fae2a', '#c04bd6', '#e0482f', '#1fb5a8'];
  const ROOT = `C:\\Documents and Settings\\${P.firstName}`;
  const range = (a, b) => [a, b].filter(Boolean).join(' – ');
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const isMail = (url) => /^mailto:/i.test(url);
  const target = (url) => (isMail(url) ? '' : ' target="_blank" rel="noopener"');

  /** Every outbound link: PROFILE.links plus the resume when one is set. */
  XP.links = () => {
    const l = (P.links || []).slice();
    if (P.resume) l.push({ id: 'resume', label: 'Resume', url: P.resume, desc: 'Download my CV (PDF).', icon: 'pdf' });
    return l;
  };

  /* ==================================================================
   * Documents shown inside Explorer windows
   * ================================================================== */
  const icon = (name, size, arg) => XP.icon(name, size, arg);
  const tags = (arr) => (arr && arr.length ? `<div class="tags">${arr.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : '');
  const bullets = (arr) => (arr && arr.length ? `<ul class="doc-list">${arr.map((x) => `<li>${esc(x)}</li>`).join('')}</ul>` : '');
  const linkBtns = (arr) =>
    (arr || []).map((l) => `<a class="xp-btn" href="${esc(l.url)}"${target(l.url)}>${icon(l.icon || 'globe', 16)}<span>${esc(l.label)}</span></a>`).join('');
  const openBtn = (to, label, ic) => `<button class="xp-btn" data-open="${to}">${icon(ic, 16)}<span>${esc(label)}</span></button>`;
  const head = (ic, title, sub, arg) =>
    `<header class="doc-head"><span class="doc-ico">${icon(ic, 48, arg)}</span><div><h1>${esc(title)}</h1>${sub ? `<p class="doc-sub">${esc(sub)}</p>` : ''}</div></header>`;
  const stepper = (label) =>
    `<nav class="doc-step"><button class="xp-btn" data-step="-1">◀ Previous ${label}</button><button class="xp-btn" data-step="1">Next ${label} ▶</button></nav>`;

  function profileDoc() {
    return `<article class="doc">
      <div class="profile-hero">
        <div class="profile-pic">${XP.avatar(96)}</div>
        <div>
          <h1>${esc(P.name)}</h1>
          <p class="doc-sub">${esc(P.title)}</p>
          <p class="profile-meta"><span>${icon('globe', 14)} ${esc(P.location)}</span>${P.status ? `<span class="status-dot">${esc(P.status)}</span>` : ''}</p>
        </div>
      </div>
      <p class="doc-lead">${esc(P.tagline)}</p>
      ${(A.bio || []).map((p) => `<p>${esc(p)}</p>`).join('')}
      <h2>Find me online</h2>
      <div class="doc-actions">${linkBtns(XP.links())}${openBtn('terminal', 'Enter the Matrix', 'terminal')}</div>
    </article>`;
  }

  function skillsDoc() {
    return `<article class="doc">${head('skills', 'Skills', 'What I bring to the team')}
      ${(A.levels || []).length ? `<h2>Comfort level</h2><div class="meters">${A.levels
        .map(([n, v]) => `<div class="meter"><span class="meter-name">${esc(n)}</span><span class="xp-progress"><i style="--v:${+v}%"></i></span><span class="meter-val">${+v}%</span></div>`)
        .join('')}</div>` : ''}
      ${(A.skills || []).map((g) => `<h2>${esc(g.group)}</h2>${tags(g.items)}`).join('')}
    </article>`;
  }

  function factsDoc() {
    return `<article class="doc">${head('bulb', 'Fun Facts', 'The bits that do not fit on a resume')}
      <ul class="facts">${(A.funFacts || []).map((f) => `<li>${icon('bulb', 20)}<span>${esc(f)}</span></li>`).join('')}</ul>
    </article>`;
  }

  function contactDoc() {
    return `<article class="doc">${head('mail', 'Contact', "Let's talk")}
      <p class="doc-lead">The quickest way to reach me is e-mail or LinkedIn. I usually reply within a day or two.</p>
      <div class="contact-list">${XP.links()
        .map((l) => `<a class="contact-row" href="${esc(l.url)}"${target(l.url)}>${icon(l.icon || 'globe', 32)}<span><b>${esc(l.label)}</b><small>${esc(l.url.replace(/^mailto:|^https?:\/\/(www\.)?/g, ''))}</small></span><span class="contact-go">Open ›</span></a>`)
        .join('')}</div>
      ${P.email ? `<div class="doc-actions"><button class="xp-btn" data-copy="${esc(P.email)}">${icon('copy', 16)}<span>Copy e-mail address</span></button></div>` : ''}
    </article>`;
  }

  function resumeDoc() {
    return `<article class="doc">${head('pdf', 'Resume.pdf', 'PDF Document')}
      <p class="doc-lead">The classic one-pager, for when a desktop from 2002 is a bit too much.</p>
      <div class="doc-actions"><a class="xp-btn" href="${esc(P.resume)}" target="_blank" rel="noopener">${icon('pdf', 16)}<span>Open Resume</span></a>
      <a class="xp-btn" href="${esc(P.resume)}" download>${icon('copy', 16)}<span>Download</span></a></div>
    </article>`;
  }

  function projectDoc(p, i) {
    return `<article class="doc">${head('app', p.name, range(p.role, p.year), ACCENTS[i % ACCENTS.length])}
      <p class="doc-lead">${esc(p.summary)}</p>
      ${p.details && p.details.length ? `<h2>Highlights</h2>${bullets(p.details)}` : ''}
      ${p.tech && p.tech.length ? `<h2>Built with</h2>${tags(p.tech)}` : ''}
      ${p.links && p.links.length ? `<div class="doc-actions">${linkBtns(p.links)}</div>` : ''}
      ${stepper('project')}
    </article>`;
  }

  function expDoc(e) {
    return `<article class="doc">${head('briefcase', e.role, `${e.company} · ${range(e.start, e.end)}`)}
      <p class="doc-meta">${[e.location, e.type].filter(Boolean).map((m) => `<span>${esc(m)}</span>`).join('')}</p>
      <p class="doc-lead">${esc(e.summary)}</p>
      ${e.bullets && e.bullets.length ? `<h2>What I did</h2>${bullets(e.bullets)}` : ''}
      ${e.tech && e.tech.length ? `<h2>Tools</h2>${tags(e.tech)}` : ''}
      ${stepper('role')}
    </article>`;
  }

  function studyDoc(s) {
    return `<article class="doc">${head('cap', s.degree, `${s.school} · ${range(s.start, s.end)}`)}
      ${s.location ? `<p class="doc-meta"><span>${esc(s.location)}</span></p>` : ''}
      <p class="doc-lead">${esc(s.summary)}</p>
      ${bullets(s.bullets)}
      ${stepper('entry')}
    </article>`;
  }

  function recycleDoc(f) {
    return `<div class="notepad-wrap">
      <div class="notepad-menu"><span>File</span><span>Edit</span><span>Format</span><span>View</span><span>Help</span></div>
      <pre class="notepad">${esc((f.text || []).join('\n'))}</pre>
      <div class="doc-actions notepad-actions">
        ${(f.actions || []).map((a) => openBtn(a.open, a.label, a.open === 'terminal' ? 'terminal' : 'folder-experience')).join('')}
        <button class="xp-btn" data-act="restore">${icon('recycle', 16)}<span>Restore</span></button>
      </div>
    </div>`;
  }

  /* ==================================================================
   * Folder models
   * ================================================================== */
  const FOLDERS = {
    about: {
      title: 'About Me',
      icon: 'folder-about',
      term: 'about',
      items: () => {
        const top = (A.skills || []).flatMap((g) => g.items).slice(0, 4).join(', ');
        const list = [
          { id: 'profile', name: 'Profile', icon: P.avatar ? 'src:' + P.avatar : 'user', sub: [P.title, P.location], type: 'Profile', render: profileDoc, term: 'about' },
          { id: 'skills', name: 'Skills', icon: 'skills', sub: [`${(A.skills || []).length} skill groups`, top], type: 'Text Document', render: skillsDoc, term: 'skills' },
          { id: 'fun-facts', name: 'Fun Facts', icon: 'bulb', sub: [`${(A.funFacts || []).length} things you did not know`], type: 'Text Document', render: factsDoc },
          { id: 'contact', name: 'Contact', icon: 'mail', sub: [P.email, 'LinkedIn, GitHub & more'], type: 'Contact Card', render: contactDoc, term: 'contact' },
        ];
        if (P.resume) list.push({ id: 'resume', name: 'Resume.pdf', icon: 'pdf', sub: ['PDF Document'], type: 'PDF Document', render: resumeDoc });
        return list;
      },
    },
    projects: {
      title: 'Passion Projects',
      icon: 'folder-projects',
      term: 'projects',
      items: () =>
        (P.projects || []).map((p, i) => ({
          id: slug(p.name) || 'project-' + i,
          name: p.name,
          icon: 'app',
          iconArg: ACCENTS[i % ACCENTS.length],
          sub: [range(p.role, p.year), p.summary],
          type: 'Project',
          date: p.year,
          tags: p.tech,
          links: p.links,
          render: () => projectDoc(p, i),
        })),
    },
    experience: {
      title: 'Experience',
      icon: 'folder-experience',
      term: 'experience',
      items: () =>
        (P.experience || []).map((e, i) => ({
          id: slug(e.company + '-' + e.role) || 'job-' + i,
          name: e.company,
          icon: 'briefcase',
          sub: [e.role, range(e.start, e.end)],
          type: e.type || 'Position',
          date: range(e.start, e.end),
          tags: e.tech,
          render: () => expDoc(e),
        })),
    },
    studies: {
      title: 'Studies',
      icon: 'folder-studies',
      term: 'studies',
      items: () =>
        (P.studies || []).map((s, i) => ({
          id: slug(s.school + '-' + s.degree) || 'study-' + i,
          name: s.school,
          icon: 'cap',
          sub: [s.degree, range(s.start, s.end)],
          type: 'Education',
          date: range(s.start, s.end),
          render: () => studyDoc(s),
        })),
    },
    recycle: {
      title: 'Recycle Bin',
      icon: 'recycle',
      path: 'Recycle Bin',
      items: () =>
        (P.recycleBin || []).map((f) => ({
          id: slug(f.name),
          name: f.name,
          icon: XP.hasIcon(f.icon) ? f.icon : 'txt',
          sub: ['Deleted file'],
          type: { txt: 'Text Document', html: 'HTML Document', exe: 'Application' }[f.icon] || 'File',
          render: () => recycleDoc(f),
        })),
    },
  };
  Object.keys(FOLDERS).forEach((k) => (FOLDERS[k].path = FOLDERS[k].path || `${ROOT}\\${FOLDERS[k].title}`));
  const TOP = ['about', 'projects', 'experience', 'studies'];

  function rootItems() {
    return TOP.concat('recycle')
      .map((k) => ({ id: k, name: FOLDERS[k].title, icon: FOLDERS[k].icon, sub: ['File Folder', `${FOLDERS[k].items().length} items`], type: 'File Folder', nav: { kind: 'folder', key: k } }))
      .concat([
        { id: 'terminal', name: 'Terminal', icon: 'terminal', sub: ['Application', 'Enter the Matrix'], type: 'Application', app: 'terminal' },
        { id: 'browser', name: 'Web Explorer', icon: 'browser', sub: ['Application', 'My links'], type: 'Application', app: 'browser' },
      ]);
  }

  function searchAll(q) {
    q = q.trim().toLowerCase();
    if (!q) return [];
    const out = [];
    TOP.forEach((key) =>
      FOLDERS[key].items().forEach((it) => {
        const hay = [it.name, it.type, ...(it.sub || []), ...(it.tags || []), it.render().replace(/<[^>]+>/g, ' ')].join(' ').toLowerCase();
        if (hay.includes(q)) out.push(Object.assign({}, it, { folder: key, sub: [FOLDERS[key].title, ...(it.sub || []).slice(0, 1)] }));
      })
    );
    return out;
  }

  /* ==================================================================
   * Explorer window
   * ================================================================== */
  const explorers = new Set();
  const rectOf = (el) => (el ? el.getBoundingClientRect() : null);

  class Explorer {
    constructor(state, from) {
      this.hist = [];
      this.pos = -1;
      this.view = XP.mobile() ? 'icons' : 'tiles';
      this.pane = 'tasks';
      this.sel = null;
      this.items = [];
      this.root = XP.html(`<div class="ex">
        <div class="xp-menubar">
          <button data-menu="file">File</button><button data-menu="edit">Edit</button><button data-menu="view">View</button><button data-menu="fav">Favorites</button><button data-menu="tools">Tools</button><button data-menu="help">Help</button>
          <span class="menubar-logo">${icon('pill', 20)}</span>
        </div>
        <div class="xp-toolbar">
          <button class="tool" data-act="back" title="Back">${icon('back', 28)}<span>Back</span></button>
          <button class="tool" data-act="fwd" title="Forward">${icon('forward', 28)}</button>
          <button class="tool" data-act="up" title="Up">${icon('up', 28)}</button>
          <i class="tool-sep"></i>
          <button class="tool" data-act="search" title="Search">${icon('search', 28)}<span>Search</span></button>
          <button class="tool" data-act="folders" title="Folders">${icon('folders', 28)}<span>Folders</span></button>
          <i class="tool-sep"></i>
          <button class="tool" data-act="views" title="Views">${icon('views', 28)}<span class="tool-caret">▾</span></button>
        </div>
        <div class="xp-addressbar">
          <span class="ab-label">Address</span>
          <div class="ab-field"><span class="ab-ico"></span><span class="ab-text"></span><button class="ab-drop" data-act="address" aria-label="Choose location"></button></div>
          <button class="ab-go" data-act="refresh">${icon('go', 18)}<span>Go</span></button>
        </div>
        <div class="ex-main">
          <aside class="ex-tasks xp-scroll"></aside>
          <div class="ex-content"><div class="ex-stage"></div></div>
        </div>
        <div class="xp-statusbar"><span class="sb-cell sb-main"></span><span class="sb-cell sb-zone">${icon('computer', 16)}<span>My Computer</span></span></div>
      </div>`);
      this.stage = this.root.querySelector('.ex-stage');
      this.tasks = this.root.querySelector('.ex-tasks');
      const first = this.describe(state);
      this.win = XP.wm.open({
        title: first.title,
        icon: first.icon,
        content: this.root,
        width: 800,
        height: 560,
        minWidth: 360,
        from,
        className: 'win-explorer',
        onClose: () => explorers.delete(this),
      });
      this.id = this.win.id;
      explorers.add(this);
      this.root.addEventListener('click', (e) => this.onClick(e));
      this.go(state, 'none');
    }

    state() {
      return this.hist[this.pos];
    }

    go(state, dir = 'left') {
      this.hist = this.hist.slice(0, this.pos + 1);
      this.hist.push(state);
      this.pos++;
      this.render(dir);
    }
    back() {
      if (this.pos > 0) {
        this.pos--;
        this.render('right');
      }
    }
    fwd() {
      if (this.pos < this.hist.length - 1) {
        this.pos++;
        this.render('left');
      }
    }
    up() {
      const s = this.state();
      if (s.kind === 'item') this.go({ kind: 'folder', key: s.key }, 'right');
      else if (s.kind !== 'root') this.go({ kind: 'root' }, 'down');
    }

    describe(s) {
      if (s.kind === 'folder') return { title: FOLDERS[s.key].title, icon: FOLDERS[s.key].icon, path: FOLDERS[s.key].path };
      if (s.kind === 'item') {
        const it = FOLDERS[s.key].items().find((i) => i.id === s.id);
        if (it) return { title: it.name, icon: it.icon === 'app' ? 'folder-projects' : it.icon, path: `${FOLDERS[s.key].path}\\${it.name}`, item: it };
        return this.describe({ kind: 'folder', key: s.key });
      }
      if (s.kind === 'search') return { title: 'Search Results', icon: 'search', path: 'Search Results' };
      return { title: 'My Documents', icon: 'folder', path: `${ROOT}\\My Documents` };
    }

    render(dir) {
      const s = this.state();
      const d = this.describe(s);
      this.sel = null;
      this.item = d.item || null;
      let face;
      if (s.kind === 'item' && d.item) {
        this.items = [];
        face = this.docFace(d.item);
        this.status('Done');
      } else if (s.kind === 'search') {
        face = this.searchFace(s);
      } else {
        this.items = s.kind === 'folder' ? FOLDERS[s.key].items() : rootItems();
        face = this.listFace(this.items);
        this.status(`${this.items.length} object${this.items.length === 1 ? '' : 's'}`);
      }
      XP.wm.setTitle(this.id, d.title, d.icon);
      this.root.querySelector('.ab-ico').innerHTML = icon(d.icon, 16);
      this.root.querySelector('.ab-text').textContent = d.path;
      this.root.querySelector('[data-act="back"]').disabled = this.pos <= 0;
      this.root.querySelector('[data-act="fwd"]').disabled = this.pos >= this.hist.length - 1;
      this.root.querySelector('[data-act="up"]').disabled = s.kind === 'root';
      this.root.querySelector('[data-act="search"]').classList.toggle('is-on', s.kind === 'search');
      this.root.querySelector('[data-act="folders"]').classList.toggle('is-on', this.pane === 'folders');
      this.renderPane();
      this.swap(face, dir);
      if (dir !== 'none') XP.busy(500);
    }

    status(text) {
      this.root.querySelector('.sb-main').textContent = text;
    }

    listFace(items) {
      const face = XP.html('<div class="ex-face xp-scroll"></div>');
      const v = this.view;
      if (!items.length) face.innerHTML = '<p class="ex-empty">This folder is empty.</p>';
      else if (v === 'details') {
        face.innerHTML = `<table class="ex-details"><thead><tr><th>Name</th><th>Info</th><th>Type</th><th>Date</th></tr></thead><tbody>${items
          .map(
            (it) =>
              `<tr class="ex-item" tabindex="0" data-id="${esc(it.id)}"><td><span class="ex-name">${icon(it.icon, 16, it.iconArg)}<b>${esc(it.name)}</b></span></td><td>${esc((it.sub || [])[0] || '')}</td><td>${esc(it.type || '')}</td><td>${esc(it.date || '')}</td></tr>`
          )
          .join('')}</tbody></table>`;
      } else {
        face.innerHTML = `<div class="ex-items view-${v}">${items
          .map(
            (it, i) =>
              `<div class="ex-item" tabindex="0" role="button" data-id="${esc(it.id)}" style="--i:${i}"><span class="ex-item-ico">${icon(it.icon, 48, it.iconArg)}</span><span class="ex-item-txt"><b>${esc(it.name)}</b>${(it.sub || [])
                .filter(Boolean)
                .map((x) => `<span>${esc(x)}</span>`)
                .join('')}</span></div>`
          )
          .join('')}</div>`;
      }
      this.bindItems(face, () => this.items);
      return face;
    }

    searchFace(s) {
      const face = XP.html(`<div class="ex-face xp-scroll">
        <form class="ex-search"><label>${icon('search', 24)}<span>Search for skills, projects, companies…</span></label>
        <div class="ex-search-row"><input class="xp-input" type="search" value="${esc(s.q || '')}" placeholder="e.g. React" aria-label="Search"><button class="xp-btn">Search</button></div></form>
        <div class="ex-results"></div>
      </div>`);
      const input = face.querySelector('input');
      const results = face.querySelector('.ex-results');
      const run = () => {
        s.q = input.value;
        this.items = searchAll(s.q);
        results.innerHTML = '';
        if (!s.q.trim()) {
          results.innerHTML = '<p class="ex-empty">Type something to search every folder on this desktop.</p>';
          this.status('Ready');
          return;
        }
        if (!this.items.length) results.innerHTML = `<p class="ex-empty">Search is complete. There are no results to display for “${esc(s.q)}”.</p>`;
        else results.appendChild(this.listFace(this.items).firstElementChild);
        this.status(`${this.items.length} result${this.items.length === 1 ? '' : 's'}`);
      };
      face.querySelector('form').addEventListener('submit', (e) => {
        e.preventDefault();
        run();
      });
      input.addEventListener('input', run);
      this.bindItems(results, () => this.items);
      run();
      setTimeout(() => !XP.mobile() && input.focus(), 720);
      return face;
    }

    bindItems(face, getItems) {
      const find = (el) => getItems().find((i) => i.id === el.dataset.id);
      let pointer = 'mouse';
      face.addEventListener('pointerdown', (e) => (pointer = e.pointerType));
      face.addEventListener('click', (e) => {
        const el = e.target.closest('.ex-item');
        if (!el) return e.target.closest('input,button,a') ? null : this.select(null);
        const it = find(el);
        this.select(it, el);
        if (pointer !== 'mouse') this.openItem(it, el);
      });
      face.addEventListener('dblclick', (e) => {
        const el = e.target.closest('.ex-item');
        if (el && pointer === 'mouse') this.openItem(find(el), el);
      });
      face.addEventListener('keydown', (e) => {
        const el = e.target.closest('.ex-item');
        if (el && e.key === 'Enter') this.openItem(find(el), el);
      });
    }

    select(it, el) {
      this.sel = it || null;
      this.stage.querySelectorAll('.ex-item.is-selected').forEach((x) => x.classList.remove('is-selected'));
      if (el) el.classList.add('is-selected');
      this.renderPane();
    }

    openItem(it, el) {
      if (!it) return;
      if (it.app) return XP.open(it.app, rectOf(el && el.querySelector('.ex-item-ico')));
      if (it.nav) return this.go(it.nav, 'left');
      const s = this.state();
      this.go({ kind: 'item', key: it.folder || s.key, id: it.id }, 'left');
    }

    step(delta) {
      const s = this.state();
      const list = FOLDERS[s.key].items();
      const i = list.findIndex((x) => x.id === s.id);
      const next = list[(i + delta + list.length) % list.length];
      if (next && next.id !== s.id) this.go({ kind: 'item', key: s.key, id: next.id }, delta > 0 ? 'left' : 'right');
    }

    docFace(it) {
      return XP.html(`<div class="ex-face ex-face-doc xp-scroll">${it.render()}</div>`);
    }

    /* 3D cube rotation between the old and the new view. */
    swap(face, dir) {
      const stage = this.stage;
      const old = this.face;
      if (this.anims) this.anims.forEach((a) => a.cancel());
      [...stage.children].forEach((c) => c !== old && c.remove());
      stage.appendChild(face);
      this.face = face;
      if (!old) return;
      if (dir === 'none' || dir === 'fade' || XP.reduced) {
        old.remove();
        if (dir === 'fade') XP.animate(face, [{ opacity: 0 }, { opacity: 1 }], { duration: 180 });
        return;
      }
      const axis = dir === 'up' || dir === 'down' ? 'X' : 'Y';
      const d = (axis === 'Y' ? stage.clientWidth : stage.clientHeight) / 2;
      const out = { left: -90, right: 90, up: 90, down: -90 }[dir];
      const T = (a, pull = 0) => `translateZ(${-d - pull}px) rotate${axis}(${a}deg) translateZ(${d}px)`;
      const opts = { duration: 720, easing: 'cubic-bezier(.65,0,.35,1)' };
      stage.classList.add('is-turning');
      const a1 = XP.animate(
        old,
        [
          { transform: T(0), filter: 'brightness(1)' },
          { transform: T(out / 2, d * 0.35), filter: 'brightness(.8)', offset: 0.5 },
          { transform: T(out), filter: 'brightness(.5)' },
        ],
        opts
      );
      const a2 = XP.animate(
        face,
        [
          { transform: T(-out), filter: 'brightness(.5)' },
          { transform: T(-out / 2, d * 0.35), filter: 'brightness(.8)', offset: 0.5 },
          { transform: T(0), filter: 'brightness(1)' },
        ],
        opts
      );
      this.anims = [a1, a2];
      XP.settle(a1, a2).then(() => {
        if (this.face !== face) return;
        old.remove();
        stage.classList.remove('is-turning');
        this.anims = null;
      });
    }

    renderPane() {
      const s = this.state();
      if (this.pane === 'folders') {
        const cur = s.kind === 'root' ? 'root' : s.key;
        this.tasks.innerHTML = `<div class="tp-tree">
          <div class="tree-head"><span>Folders</span><button data-act="folders" aria-label="Close folders">✕</button></div>
          <ul><li><button class="tree-node${cur === 'root' ? ' is-cur' : ''}" data-nav="root">${icon('folder', 16)}<span>My Documents</span></button>
          <ul>${TOP.concat('recycle')
            .map((k) => `<li><button class="tree-node${cur === k ? ' is-cur' : ''}" data-nav="${k}">${icon(FOLDERS[k].icon, 16)}<span>${FOLDERS[k].title}</span></button></li>`)
            .join('')}</ul></li></ul></div>`;
        return;
      }

      const sec = (title, body, cls = '') =>
        `<section class="tp-sec ${cls}"><button class="tp-head" data-act="collapse"><span>${esc(title)}</span><span class="tp-chev"></span></button><div class="tp-body">${body}</div></section>`;
      const link = (ic, label, attrs) => `<button class="tp-link" ${attrs}>${icon(ic, 16)}<span>${esc(label)}</span></button>`;
      const F = FOLDERS[s.key];
      let tasks = '';
      if (s.kind === 'root') {
        tasks = sec(
          'System Tasks',
          link('terminal', 'Enter the Matrix', 'data-open="terminal"') + link('browser', 'Browse my links', 'data-open="browser"') + link('search', 'Search everything', 'data-act="search"'),
          'special'
        );
      } else if (s.kind === 'folder') {
        let body = '';
        if (this.sel) body += link(this.sel.icon === 'app' ? 'folder-projects' : this.sel.icon, `Open "${this.sel.name}"`, 'data-act="open-sel"');
        if (F.term) body += link('terminal', 'Show in the terminal', `data-term="${F.term}"`);
        if (s.key === 'recycle') body += link('recycle', 'Empty the Recycle Bin', 'data-act="empty"');
        if (s.key === 'about') body += link('mail', 'Get in touch', 'data-goto="about:contact"');
        body += link('search', 'Search these files', 'data-act="search"');
        tasks = sec(s.key === 'recycle' ? 'Recycle Bin Tasks' : 'File and Folder Tasks', body);
      } else if (s.kind === 'item' && this.item) {
        let body = link('up', `Back to ${F.title}`, 'data-act="up"');
        (this.item.links || []).forEach((l) => (body += `<a class="tp-link" href="${esc(l.url)}"${target(l.url)}>${icon('globe', 16)}<span>${esc(l.label)}</span></a>`));
        if (this.item.term) body += link('terminal', 'Show in the terminal', `data-term="${this.item.term}"`);
        tasks = sec('File Tasks', body);
      } else if (s.kind === 'search') {
        tasks = sec('Search Companion', '<p class="tp-note">Searching every folder on this desktop: names, roles, tools and descriptions.</p>', 'special');
      }

      const current = s.kind === 'folder' || s.kind === 'item' ? s.key : null;
      let places = '';
      if (s.kind !== 'root') places += link('folder', 'My Documents', 'data-nav="root"');
      TOP.filter((k) => k !== current).forEach((k) => (places += link(FOLDERS[k].icon, FOLDERS[k].title, `data-nav="${k}"`)));
      places += link('terminal', 'Terminal', 'data-open="terminal"') + link('browser', 'Web Explorer', 'data-open="browser"');

      let details;
      const sel = this.sel || (s.kind === 'item' ? this.item : null);
      if (sel) {
        details = `<b>${esc(sel.name)}</b><span>${esc(sel.type || '')}</span>${(sel.sub || [])
          .filter(Boolean)
          .map((x) => `<span>${esc(x)}</span>`)
          .join('')}${sel.tags && sel.tags.length ? `<span class="tp-tags">${esc(sel.tags.join(' · '))}</span>` : ''}`;
      } else if (s.kind === 'folder' && s.key === 'about') {
        details = `<div class="tp-profile">${XP.avatar(48)}<div><b>${esc(P.name)}</b><span>${esc(P.title)}</span></div></div>`;
      } else {
        const d = this.describe(s);
        details = `<b>${esc(d.title)}</b><span>${s.kind === 'search' ? 'Search' : 'File Folder'}</span>`;
      }

      this.tasks.innerHTML = tasks + sec('Other Places', places) + sec('Details', `<div class="tp-details">${details}</div>`);
    }

    menuItems(which) {
      const go = (v) => () => {
        this.view = v;
        this.render('fade');
      };
      switch (which) {
        case 'file':
          return [
            { label: 'Open', bold: true, disabled: !this.sel, action: () => this.openItem(this.sel) },
            '-',
            { label: 'Close', action: () => XP.wm.close(this.id) },
          ];
        case 'edit':
          return [
            { label: 'Copy e-mail address', icon: 'copy', action: () => copy(P.email, (t) => this.status(t)) },
            { label: 'Select All', disabled: true },
          ];
        case 'view':
          return [
            { label: 'Tiles', checked: this.view === 'tiles', action: go('tiles') },
            { label: 'Icons', checked: this.view === 'icons', action: go('icons') },
            { label: 'Details', checked: this.view === 'details', action: go('details') },
            '-',
            { label: 'Refresh', icon: 'refresh', action: () => this.render('fade') },
          ];
        case 'fav':
          return XP.links().map((l) => ({ label: l.label, icon: l.icon, action: () => XP.openUrl(l.url) }));
        case 'tools':
          return [
            { label: 'Enter the Matrix', icon: 'terminal', action: () => XP.open('terminal') },
            { label: 'Flip 3D', icon: 'flip', action: () => XP.wm.flip3d() },
            { label: 'Display Properties', icon: 'display', action: () => XP.open('display') },
          ];
        case 'help':
          return [
            { label: 'Help and Support', icon: 'help', action: () => XP.open('help') },
            '-',
            { label: `About ${P.firstName} XP`, icon: 'info', action: aboutBox },
          ];
      }
      return [];
    }

    onClick(e) {
      const t = e.target.closest('[data-act],[data-nav],[data-term],[data-step],[data-copy],[data-menu],[data-goto]');
      if (!t || !this.root.contains(t)) return;
      const d = t.dataset;
      if (d.menu) return XP.menu(this.menuItems(d.menu), 0, 0, { anchor: t });
      if (d.nav) return this.go(d.nav === 'root' ? { kind: 'root' } : { kind: 'folder', key: d.nav }, 'up');
      if (d.term) return XP.terminal.enter({ run: d.term });
      if (d.step) return this.step(+d.step);
      if (d.copy) return copy(d.copy, (txt) => this.status(txt));
      if (d.goto) {
        const [key, id] = d.goto.split(':');
        return this.go({ kind: 'item', key, id }, 'left');
      }
      switch (d.act) {
        case 'back':
          return this.back();
        case 'fwd':
          return this.fwd();
        case 'up':
          return this.up();
        case 'refresh':
          return this.render('fade');
        case 'search':
          return this.state().kind === 'search' ? this.back() : this.go({ kind: 'search', q: '' }, 'up');
        case 'folders':
          this.pane = this.pane === 'folders' ? 'tasks' : 'folders';
          this.root.querySelector('[data-act="folders"]').classList.toggle('is-on', this.pane === 'folders');
          return this.renderPane();
        case 'views': {
          const order = ['tiles', 'icons', 'details'];
          return XP.menu(
            order.map((v) => ({ label: v[0].toUpperCase() + v.slice(1), checked: this.view === v, action: () => ((this.view = v), this.render('fade')) })),
            0,
            0,
            { anchor: t }
          );
        }
        case 'address':
          return XP.menu(
            [{ label: 'My Documents', icon: 'folder', action: () => this.go({ kind: 'root' }, 'up') }].concat(
              TOP.concat('recycle').map((k) => ({ label: FOLDERS[k].title, icon: FOLDERS[k].icon, action: () => this.go({ kind: 'folder', key: k }, 'up') }))
            ),
            0,
            0,
            { anchor: t.closest('.ab-field') }
          );
        case 'open-sel':
          return this.openItem(this.sel);
        case 'collapse':
          return t.parentElement.classList.toggle('is-collapsed');
        case 'empty':
          return XP.dialog({ title: 'Confirm Delete', icon: 'warning', message: 'Are you sure you want to delete these memories forever?<br><br>(They are too funny. The Recycle Bin says no.)', buttons: ['Fair enough'] });
        case 'restore':
          return XP.dialog({ title: 'Restore', icon: 'info', message: 'Some things are better left in the Recycle Bin.' });
      }
    }
  }

  function copy(text, done) {
    const ok = () => done && done('Copied to clipboard: ' + text);
    if (navigator.clipboard && window.isSecureContext) navigator.clipboard.writeText(text).then(ok, () => done && done(text));
    else {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        ok();
      } catch (e) {}
      ta.remove();
    }
  }

  function aboutBox() {
    XP.dialog({
      title: `About ${P.firstName} XP`,
      icon: 'pill',
      message: `<b>${esc(P.firstName)} XP</b> · Career Edition<br>Version 2002.${new Date().getFullYear()}<br><br>A portfolio disguised as a Windows XP desktop, with a Matrix terminal hidden inside.<br><br>Made by ${esc(P.name)}.`,
    });
  }

  function openFolder(state, from) {
    if (typeof state === 'string') state = state === 'root' ? { kind: 'root' } : { kind: 'folder', key: state };
    for (const ex of explorers) {
      const s = ex.state();
      if (s && s.kind === state.kind && s.key === state.key && (state.kind !== 'item' || s.id === state.id)) {
        XP.wm.restore(ex.id);
        return ex;
      }
    }
    return new Explorer(state, from);
  }

  /* ==================================================================
   * Web Explorer (links browser)
   * ================================================================== */
  let browser = null;
  const HOME = `http://${slug(P.firstName)}.xp/home`;

  class Browser {
    constructor(from) {
      this.hist = [];
      this.pos = -1;
      this.root = XP.html(`<div class="ie">
        <div class="xp-menubar">
          <button data-menu="file">File</button><button data-menu="edit">Edit</button><button data-menu="view">View</button><button data-menu="fav">Favorites</button><button data-menu="tools">Tools</button><button data-menu="help">Help</button>
          <span class="menubar-logo ie-throbber">${icon('browser', 22)}</span>
        </div>
        <div class="xp-toolbar">
          <button class="tool" data-act="back" title="Back">${icon('back', 28)}<span>Back</span></button>
          <button class="tool" data-act="fwd" title="Forward">${icon('forward', 28)}</button>
          <button class="tool tool-sm" data-act="stop" title="Stop">${icon('stop', 22)}</button>
          <button class="tool tool-sm" data-act="refresh" title="Refresh">${icon('refresh', 22)}</button>
          <button class="tool tool-sm" data-act="home" title="Home">${icon('home', 22)}</button>
          <i class="tool-sep"></i>
          <button class="tool" data-act="search" title="Search">${icon('search', 24)}<span>Search</span></button>
          <button class="tool" data-act="favs" title="Favorites">${icon('favorites', 24)}<span>Favorites</span></button>
          <button class="tool" data-act="history" title="History">${icon('history', 24)}</button>
        </div>
        <form class="xp-addressbar">
          <span class="ab-label">Address</span>
          <div class="ab-field">${icon('browser', 16)}<input class="ab-input" spellcheck="false" autocomplete="off" aria-label="Address"><button type="button" class="ab-drop" data-act="address" aria-label="Typed addresses"></button></div>
          <button class="ab-go">${icon('go', 18)}<span>Go</span></button>
          <button type="button" class="ab-links" data-act="links">Links <b>»</b></button>
        </form>
        <div class="ie-main">
          <aside class="ie-side xp-scroll" hidden></aside>
          <div class="ie-view"><div class="ie-page xp-scroll"></div></div>
        </div>
        <div class="xp-statusbar"><span class="sb-cell sb-main">Done</span><span class="sb-cell sb-progress"><span class="xp-progress"><i></i></span></span><span class="sb-cell sb-zone">${icon('globe', 16)}<span>Internet</span></span></div>
      </div>`);
      this.page = this.root.querySelector('.ie-page');
      this.side = this.root.querySelector('.ie-side');
      this.input = this.root.querySelector('.ab-input');
      this.win = XP.wm.open({
        id: 'browser',
        title: `${P.firstName}'s Links - Web Explorer`,
        icon: 'browser',
        content: this.root,
        width: 880,
        height: 600,
        minWidth: 380,
        from,
        className: 'win-browser',
        onClose: () => (browser = null),
      });
      this.root.addEventListener('click', (e) => this.onClick(e));
      this.root.querySelector('.xp-addressbar').addEventListener('submit', (e) => {
        e.preventDefault();
        this.go(this.input.value);
      });
      this.nav({ page: 'home' });
    }

    nav(state, push = true) {
      if (push) {
        this.hist = this.hist.slice(0, this.pos + 1);
        this.hist.push(state);
        this.pos++;
      }
      const html = state.page === 'home' ? this.home() : this.opening(state);
      this.input.value = state.page === 'home' ? HOME : state.url;
      this.root.querySelector('[data-act="back"]').disabled = this.pos <= 0;
      this.root.querySelector('[data-act="fwd"]').disabled = this.pos >= this.hist.length - 1;
      this.page.innerHTML = html;
      this.page.scrollTop = 0;
      this.load();
      XP.animate(
        this.page,
        [
          { transform: 'perspective(1200px) rotateY(-9deg) translateX(40px) translateZ(-60px)', opacity: 0 },
          { transform: 'perspective(1200px) rotateY(0deg) translateX(0px) translateZ(0px)', opacity: 1 },
        ],
        { duration: 420 }
      );
      if (state.page === 'home') {
        const f = this.page.querySelector('.portal-search');
        f.addEventListener('submit', (e) => {
          e.preventDefault();
          const q = f.querySelector('input').value.trim();
          if (q) this.go(q);
        });
      }
      if (!this.side.hidden) this.renderSide();
    }

    load() {
      const bar = this.root.querySelector('.sb-progress');
      const main = this.root.querySelector('.sb-main');
      const throb = this.root.querySelector('.ie-throbber');
      clearTimeout(this.loadT);
      bar.classList.remove('is-loading');
      void bar.offsetWidth;
      bar.classList.add('is-loading');
      throb.classList.add('is-loading');
      main.textContent = 'Opening page ' + this.input.value + '...';
      this.loadT = setTimeout(() => {
        bar.classList.remove('is-loading');
        throb.classList.remove('is-loading');
        main.textContent = 'Done';
      }, 1100);
    }

    home() {
      let visits = 1;
      try {
        visits = +localStorage.getItem('xp:visits') || 1;
      } catch (e) {}
      const digits = String(1336 + visits).padStart(7, '0');
      const links = XP.links();
      return `<div class="portal">
        <div class="portal-top">
          <div class="portal-logo"><span>${esc(P.firstName)}</span><b>.xp</b></div>
          <form class="portal-search"><input class="xp-input" placeholder="Search the Web..." aria-label="Search the web"><button class="xp-btn">Search</button></form>
        </div>
        <div class="portal-ticker"><span>★ ${esc(P.status || 'Welcome!')} ★ Recruiters welcome ★ Psst: open the Terminal and type "help" ★ Best viewed at 1024×768 ★</span></div>
        <div class="portal-body">
          <main>
            <h2 class="portal-h">Recommended Links</h2>
            <div class="link-cards">${links
              .map(
                (l) => `<a class="link-card" href="${esc(l.url)}"${target(l.url)} data-label="${esc(l.label)}" data-icon="${esc(l.icon || 'globe')}">
                  <span class="lc-ico">${icon(l.icon || 'globe', 40)}</span>
                  <span class="lc-txt"><b>${esc(l.label)}</b><small>${esc(l.url.replace(/^mailto:|^https?:\/\/(www\.)?/g, ''))}</small><span>${esc(l.desc || '')}</span></span>
                  <span class="lc-go">Visit »</span></a>`
              )
              .join('')}</div>
            <h2 class="portal-h">Around This Desktop</h2>
            <ul class="portal-list">
              <li>${icon('folder-about', 16)}<button class="a" data-open="about">About Me</button>: who I am and what I care about</li>
              <li>${icon('folder-projects', 16)}<button class="a" data-open="projects">Passion Projects</button>: things I build for fun</li>
              <li>${icon('folder-experience', 16)}<button class="a" data-open="experience">Experience</button>: where I have worked</li>
              <li>${icon('folder-studies', 16)}<button class="a" data-open="studies">Studies</button>: where I have learned</li>
              <li>${icon('terminal', 16)}<button class="a" data-open="terminal">Enter the Matrix</button>: the same story, as a terminal</li>
            </ul>
          </main>
          <aside>
            <div class="portal-box"><h3>Hot Links</h3><div>${links
              .map((l) => `<a class="hot" href="${esc(l.url)}"${target(l.url)} data-label="${esc(l.label)}" data-icon="${esc(l.icon || 'globe')}">» ${esc(l.label)}</a>`)
              .join('')}</div></div>
            <div class="portal-box"><h3>Status</h3><div><span class="status-dot">${esc(P.status || 'Online')}</span></div></div>
            <div class="portal-box"><h3>Visitor Counter</h3><div class="counter">${[...digits].map((c) => `<i>${c}</i>`).join('')}</div></div>
          </aside>
        </div>
        <footer class="portal-foot">© 2002–${new Date().getFullYear()} ${esc(P.name)} · This page is best viewed in Web Explorer 6.0 · <button class="a" data-open="terminal">webmaster</button></footer>
      </div>`;
    }

    opening(s) {
      return `<div class="ie-opening"><div class="ie-op-card">
        ${icon(s.icon || 'globe', 48)}
        <h2>Opening ${esc(s.label)}…</h2>
        <p class="ie-url">${esc(s.url)}</p>
        <span class="xp-progress is-indeterminate"><i></i></span>
        <p>Pages open in a new tab, so this desktop stays right where you left it.</p>
        <p>Nothing happened? <a href="${esc(s.url)}"${target(s.url)}>Click here</a> to open it.</p>
        <button class="xp-btn" data-act="home">${icon('home', 16)}<span>Back to Home</span></button>
      </div></div>`;
    }

    go(raw) {
      const v = String(raw || '').trim();
      if (!v) return;
      if (/^(about:)?home$/i.test(v) || v === HOME || /\.xp(\/|$)/i.test(v)) return this.nav({ page: 'home' });
      let url = v;
      const looksUrl = /^https?:\/\//i.test(v) || /^mailto:/i.test(v) || /^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(v);
      if (!looksUrl) url = 'https://www.google.com/search?q=' + encodeURIComponent(v);
      else if (!/^(https?|mailto):/i.test(url)) url = 'https://' + url;
      XP.openUrl(url);
      this.nav({ page: 'open', url, label: looksUrl ? url.replace(/^https?:\/\//, '') : `results for “${v}”`, icon: looksUrl ? 'globe' : 'search' });
    }

    renderSide(mode) {
      this.sideMode = mode || this.sideMode || 'favs';
      const links = XP.links();
      if (this.sideMode === 'favs') {
        this.side.innerHTML = `<div class="side-head"><span>Favorites</span><button data-act="close-side" aria-label="Close">✕</button></div>
          <div class="side-tools"><button class="xp-btn" data-act="add-fav">Add...</button><button class="xp-btn" data-act="add-fav">Organize...</button></div>
          <div class="side-list"><button class="side-item" data-act="home">${icon('home', 16)}<span>Home</span></button>
          ${links.map((l) => `<a class="side-item" href="${esc(l.url)}"${target(l.url)} data-label="${esc(l.label)}" data-icon="${esc(l.icon || 'globe')}">${icon(l.icon || 'globe', 16)}<span>${esc(l.label)}</span></a>`).join('')}</div>`;
      } else {
        const seen = this.hist.map((h) => (h.page === 'home' ? HOME : h.url));
        this.side.innerHTML = `<div class="side-head"><span>History</span><button data-act="close-side" aria-label="Close">✕</button></div>
          <div class="side-list"><p class="side-day">${icon('history', 16)} Today</p>${[...new Set(seen)]
            .reverse()
            .map((u) => `<button class="side-item" data-go="${esc(u)}">${icon('globe', 16)}<span>${esc(u.replace(/^https?:\/\//, ''))}</span></button>`)
            .join('')}</div>`;
      }
    }

    toggleSide(mode) {
      const showing = !this.side.hidden && this.sideMode === mode;
      this.side.hidden = showing;
      if (!showing) this.renderSide(mode);
      this.root.querySelector('[data-act="favs"]').classList.toggle('is-on', !this.side.hidden && this.sideMode === 'favs');
      this.root.querySelector('[data-act="history"]').classList.toggle('is-on', !this.side.hidden && this.sideMode === 'history');
    }

    menuItems(which) {
      const links = XP.links().map((l) => ({ label: l.label, icon: l.icon, action: () => this.visit(l) }));
      switch (which) {
        case 'file':
          return [{ label: 'Home Page', icon: 'home', action: () => this.nav({ page: 'home' }) }, '-', { label: 'Close', action: () => XP.wm.close(this.win.id) }];
        case 'fav':
          return links;
        case 'view':
          return [
            { label: 'Favorites bar', checked: !this.side.hidden && this.sideMode === 'favs', action: () => this.toggleSide('favs') },
            { label: 'Refresh', icon: 'refresh', action: () => this.nav(this.hist[this.pos], false) },
          ];
        case 'tools':
          return [{ label: 'Enter the Matrix', icon: 'terminal', action: () => XP.open('terminal') }, { label: 'Internet Options...', disabled: true }];
        case 'help':
          return [{ label: 'Help and Support', icon: 'help', action: () => XP.open('help') }, { label: `About ${P.firstName} XP`, icon: 'info', action: aboutBox }];
        default:
          return [{ label: 'Copy page address', icon: 'copy', action: () => copy(this.input.value, (t) => (this.root.querySelector('.sb-main').textContent = t)) }];
      }
    }

    visit(l) {
      XP.openUrl(l.url);
      this.nav({ page: 'open', url: l.url, label: l.label, icon: l.icon });
    }

    onClick(e) {
      // Links open for real in a new tab (default behaviour); we show the "opening" page alongside.
      const a = e.target.closest('a[href][data-label]');
      if (a && this.root.contains(a)) {
        this.nav({ page: 'open', url: a.getAttribute('href'), label: a.dataset.label, icon: a.dataset.icon });
        return;
      }
      const t = e.target.closest('[data-act],[data-menu],[data-go]');
      if (!t || !this.root.contains(t)) return;
      const d = t.dataset;
      if (d.menu) return XP.menu(this.menuItems(d.menu), 0, 0, { anchor: t });
      if (d.go) return this.go(d.go);
      switch (d.act) {
        case 'back':
          if (this.pos > 0) this.nav(this.hist[--this.pos], false);
          return;
        case 'fwd':
          if (this.pos < this.hist.length - 1) this.nav(this.hist[++this.pos], false);
          return;
        case 'stop':
          clearTimeout(this.loadT);
          this.root.querySelector('.sb-progress').classList.remove('is-loading');
          this.root.querySelector('.ie-throbber').classList.remove('is-loading');
          this.root.querySelector('.sb-main').textContent = 'Done';
          return;
        case 'refresh':
          return this.nav(this.hist[this.pos], false);
        case 'home':
          return this.nav({ page: 'home' });
        case 'search': {
          if (this.hist[this.pos].page !== 'home') this.nav({ page: 'home' });
          const input = this.page.querySelector('.portal-search input');
          if (input) input.focus();
          return;
        }
        case 'favs':
          return this.toggleSide('favs');
        case 'history':
          return this.toggleSide('history');
        case 'close-side':
          this.side.hidden = true;
          this.root.querySelectorAll('[data-act="favs"],[data-act="history"]').forEach((b) => b.classList.remove('is-on'));
          return;
        case 'add-fav':
          return XP.dialog({ title: 'Favorites', icon: 'favorites', message: 'Pro tip: the best way to add me to your favorites is LinkedIn. 😉' });
        case 'address':
          return XP.menu(
            [{ label: HOME, icon: 'home', action: () => this.nav({ page: 'home' }) }].concat(XP.links().map((l) => ({ label: l.url, icon: l.icon, action: () => this.visit(l) }))),
            0,
            0,
            { anchor: t.closest('.ab-field') }
          );
        case 'links':
          return XP.menu(
            XP.links().map((l) => ({ label: l.label, icon: l.icon, action: () => this.visit(l) })),
            0,
            0,
            { anchor: t }
          );
      }
    }
  }

  function openBrowser(from, url) {
    if (!browser) browser = new Browser(from);
    else XP.wm.restore('browser');
    if (url) browser.go(url);
    return browser;
  }

  /* ==================================================================
   * Small system windows
   * ================================================================== */
  function openRun() {
    const content = XP.html(`<form class="run">
      <div class="run-top">${icon('run', 32)}<p>Type the name of a program, folder, document, or Internet resource, and ${esc(P.firstName)} XP will open it for you.</p></div>
      <label class="run-row"><span>Open:</span><input class="xp-input" list="run-list" autocomplete="off" spellcheck="false" placeholder="cmd"></label>
      <datalist id="run-list">${['cmd', 'about', 'projects', 'experience', 'studies', 'iexplore', 'linkedin', 'github', 'display', 'help', 'recycle bin'].map((c) => `<option value="${c}">`).join('')}</datalist>
      <div class="run-btns"><button class="xp-btn">OK</button><button type="button" class="xp-btn" data-r="cancel">Cancel</button><button type="button" class="xp-btn" data-r="browse">Browse...</button></div>
    </form>`);
    const win = XP.wm.open({ id: 'run', title: 'Run', icon: 'run', content, width: 380, height: 'auto', resizable: false, minimizable: false });
    const input = content.querySelector('input');
    setTimeout(() => input.focus(), 80);
    content.addEventListener('submit', (e) => {
      e.preventDefault();
      const v = input.value.trim();
      if (!v) return;
      if (XP.runCommand(v)) XP.wm.close(win.id);
      else
        XP.dialog({
          title: input.value,
          icon: 'error',
          message: `${esc(P.firstName)} XP cannot find '${esc(v)}'. Make sure you typed the name correctly, and then try again.<br><br>Try: <b>cmd</b>, <b>about</b>, <b>projects</b>, <b>experience</b>, <b>studies</b> or <b>iexplore</b>.`,
        });
    });
    content.querySelector('[data-r="cancel"]').addEventListener('click', () => XP.wm.close(win.id));
    content.querySelector('[data-r="browse"]').addEventListener('click', () => {
      XP.wm.close(win.id);
      openFolder('root');
    });
  }

  function openHelp(from) {
    const k = (s) => `<kbd>${s}</kbd>`;
    const content = XP.html(`<div class="help xp-scroll"><article class="doc">
      ${head('help', 'Help and Support Center', `Getting the most out of ${P.firstName} XP`)}
      <h2>Getting around</h2>
      <ul class="doc-list">
        <li>Double-click a folder on the desktop to open it (on phones a single tap is enough).</li>
        <li>Inside a folder, open an item to spin into it. Use <b>Back</b>, <b>Up</b> or <b>Other Places</b> to move around.</li>
        <li>Drag windows by their blue title bar, resize them from the edges, double-click the title bar to maximise.</li>
        <li>Right-click the desktop for more options, like wallpapers and <b>Flip 3D</b>.</li>
      </ul>
      <h2>The Matrix terminal</h2>
      <ul class="doc-list">
        <li>Open <b>Terminal</b> from the desktop, the Start menu or the red/blue pill in the tray, or press ${k('`')}.</li>
        <li>Type ${k('help')} and press ${k('Enter')} to see every command. ${k('Tab')} autocompletes and ${k('↑')} / ${k('↓')} walks through your history.</li>
        <li>Type ${k('exit')} or press ${k('Esc')} to unplug and come back to the desktop.</li>
      </ul>
      <h2>Shortcuts and links</h2>
      <ul class="doc-list">
        <li>Share a link that opens straight into a section: <code>#terminal</code>, <code>#about</code>, <code>#projects</code>, <code>#experience</code>, <code>#studies</code> or <code>#links</code>.</li>
        <li>Start → Run… understands commands like <code>cmd</code>, <code>about</code> and <code>iexplore</code>.</li>
      </ul>
      <div class="doc-actions">${openBtn('terminal', 'Enter the Matrix', 'terminal')}${openBtn('browser', 'Open my links', 'browser')}</div>
    </article></div>`);
    XP.wm.open({ id: 'help', title: 'Help and Support Center', icon: 'help', content, width: 640, height: 560, from });
  }

  /* Display Properties: wallpaper + screen saver. */
  function openDisplay(from) {
    const D = XP.desktop;
    let wall = D.wallpaper();
    let saver = D.saver();
    const content = XP.html(`<div class="dp">
      <div class="xp-tabs" role="tablist"><button class="xp-tab" disabled>Themes</button><button class="xp-tab is-active" data-tab="desk">Desktop</button><button class="xp-tab" data-tab="saver">Screen Saver</button><button class="xp-tab" disabled>Appearance</button><button class="xp-tab" disabled>Settings</button></div>
      <div class="xp-tabpanel">
        <div class="dp-monitor"><div class="dp-screen"><canvas class="dp-rain"></canvas></div><div class="dp-stand"></div></div>
        <div class="dp-pane" data-pane="desk">
          <label class="dp-label">Background:</label>
          <div class="dp-list xp-scroll" role="listbox">${Object.entries(D.WALLPAPERS)
            .map(([k, w]) => `<button class="dp-opt" role="option" data-wall="${k}">${icon(k === 'matrix' ? 'pill' : 'display', 16)}<span>${esc(w.label)}</span></button>`)
            .join('')}</div>
        </div>
        <div class="dp-pane" data-pane="saver" hidden>
          <label class="dp-label">Screen saver:</label>
          <div class="dp-row"><select class="xp-input dp-saver"><option value="matrix">Matrix Digital Rain</option><option value="none">(None)</option></select><button class="xp-btn" data-act="preview">Preview</button></div>
          <div class="dp-row"><label>Wait: <input class="xp-input dp-wait" type="number" min="1" max="60" value="${saver.wait}"> minutes</label></div>
        </div>
      </div>
      <div class="dp-btns"><button class="xp-btn" data-act="ok">OK</button><button class="xp-btn" data-act="cancel">Cancel</button><button class="xp-btn" data-act="apply">Apply</button></div>
    </div>`);
    const win = XP.wm.open({ id: 'display', title: 'Display Properties', icon: 'display', content, width: 420, height: 'auto', resizable: false, minimizable: false, from });
    const screen = content.querySelector('.dp-screen');
    const canvas = content.querySelector('.dp-rain');
    const saverSel = content.querySelector('.dp-saver');
    saverSel.value = saver.type;
    let mini = null;

    const preview = (tab) => {
      if (mini) {
        mini.stop();
        mini = null;
      }
      const showRain = (tab === 'saver' && saverSel.value === 'matrix') || (tab === 'desk' && D.WALLPAPERS[wall].rain);
      canvas.hidden = !showRain;
      screen.style.background = tab === 'saver' ? '#000' : D.WALLPAPERS[wall].css();
      if (showRain) {
        mini = new XP.MatrixRain(canvas, { layers: [{ size: 6, speed: 0.6, alpha: 0.5, share: 1 }, { size: 9, speed: 1, alpha: 1, share: 0.4 }], fps: 24 });
        mini.start();
      }
      content.querySelectorAll('.dp-opt').forEach((b) => b.classList.toggle('is-sel', b.dataset.wall === wall));
    };
    let tab = 'desk';
    preview(tab);
    const apply = () => {
      D.setWallpaper(wall);
      D.setSaver({ type: saverSel.value, wait: Math.max(1, +content.querySelector('.dp-wait').value || 2) });
    };
    content.addEventListener('click', (e) => {
      const t = e.target.closest('[data-tab],[data-wall],[data-act]');
      if (!t) return;
      if (t.dataset.tab) {
        tab = t.dataset.tab;
        content.querySelectorAll('.xp-tab').forEach((b) => b.classList.toggle('is-active', b === t));
        content.querySelectorAll('.dp-pane').forEach((p) => (p.hidden = p.dataset.pane !== tab));
        preview(tab);
      } else if (t.dataset.wall) {
        wall = t.dataset.wall;
        preview(tab);
      } else if (t.dataset.act === 'preview') {
        if (saverSel.value === 'matrix') D.startSaver(true);
      } else if (t.dataset.act === 'apply') apply();
      else if (t.dataset.act === 'ok') {
        apply();
        XP.wm.close(win.id);
      } else if (t.dataset.act === 'cancel') XP.wm.close(win.id);
    });
    saverSel.addEventListener('change', () => preview(tab));
    const stopMini = () => mini && mini.stop();
    win.opts.onClose = stopMini;
  }

  XP.apps = { folder: openFolder, browser: openBrowser, run: openRun, help: openHelp, display: openDisplay, about: aboutBox, FOLDERS, copy };
})();
