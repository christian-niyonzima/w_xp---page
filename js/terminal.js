/* The Matrix terminal: a full-screen command line over digital rain.
 * Entering and leaving it is a 3D "jack in / unplug" transition. */
(function () {
  const XP = (window.XP = window.XP || {});
  const P = window.PROFILE;
  const A = P.about || {};
  const esc = XP.esc;
  const host = `${String(P.firstName || 'neo').toLowerCase().replace(/[^a-z0-9]/g, '')}-xp`;

  let el = null;
  let rain = null;
  let active = false;
  let moving = false;
  let booted = false;
  let busy = false;
  let skip = false;
  let usedHelp = false;
  let idleT = 0;
  let cwd = [];
  const history = [];
  let hpos = 0;

  /* ---------- tiny formatting helpers ---------- */
  const cmd = (c, label) => `<span class="cmd" data-cmd="${esc(c)}" role="button" tabindex="0">${esc(label || c)}</span>`;
  const link = (url, label) => `<a href="${esc(url)}"${/^mailto:/i.test(url) ? '' : ' target="_blank" rel="noopener"'}>${esc(label || url)}</a>`;
  const dim = (s) => `<span class="t-dim">${s}</span>`;
  const hi = (s) => `<span class="t-hi">${s}</span>`;
  const warn = (s) => `<span class="t-warn">${s}</span>`;
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  const title = (s) => [`<span class="t-title">${esc(s.toUpperCase())}</span>`, dim('─'.repeat(Math.min(48, s.length + 8)))];
  const range = (a, b) => [a, b].filter(Boolean).join(' — ');
  const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');

  /* ---------- 5-row block font for the banner ---------- */
  const FONT = {
    A: [' ### ', '#   #', '#####', '#   #', '#   #'], B: ['#### ', '#   #', '#### ', '#   #', '#### '],
    C: [' ####', '#    ', '#    ', '#    ', ' ####'], D: ['#### ', '#   #', '#   #', '#   #', '#### '],
    E: ['#####', '#    ', '#### ', '#    ', '#####'], F: ['#####', '#    ', '#### ', '#    ', '#    '],
    G: [' ####', '#    ', '#  ##', '#   #', ' ####'], H: ['#   #', '#   #', '#####', '#   #', '#   #'],
    I: ['###', ' # ', ' # ', ' # ', '###'], J: ['  ###', '   # ', '   # ', '#  # ', ' ##  '],
    K: ['#   #', '#  # ', '###  ', '#  # ', '#   #'], L: ['#    ', '#    ', '#    ', '#    ', '#####'],
    M: ['#   #', '## ##', '# # #', '#   #', '#   #'], N: ['#   #', '##  #', '# # #', '#  ##', '#   #'],
    O: [' ### ', '#   #', '#   #', '#   #', ' ### '], P: ['#### ', '#   #', '#### ', '#    ', '#    '],
    Q: [' ### ', '#   #', '# # #', '#  # ', ' ## #'], R: ['#### ', '#   #', '#### ', '#  # ', '#   #'],
    S: [' ####', '#    ', ' ### ', '    #', '#### '], T: ['#####', '  #  ', '  #  ', '  #  ', '  #  '],
    U: ['#   #', '#   #', '#   #', '#   #', ' ### '], V: ['#   #', '#   #', '#   #', ' # # ', '  #  '],
    W: ['#   #', '#   #', '# # #', '## ##', '#   #'], X: ['#   #', ' # # ', '  #  ', ' # # ', '#   #'],
    Y: ['#   #', ' # # ', '  #  ', '  #  ', '  #  '], Z: ['#####', '   # ', '  #  ', ' #   ', '#####'],
    ' ': ['  ', '  ', '  ', '  ', '  '], '-': ['    ', '    ', '### ', '    ', '    '],
  };
  function banner(text) {
    const chars = [...text.toUpperCase()].filter((c) => FONT[c]);
    // Gaps are transparent blocks too, so every cell has the same width whatever font draws "█".
    const rows = [0, 1, 2, 3, 4].map((r) => chars.map((c) => FONT[c][r]).join(' ').replace(/#/g, '█').replace(/ /g, '<i>█</i>'));
    return `<div class="t-banner" role="img" aria-label="${esc(text)}">${rows.join('\n')}</div>`;
  }

  /* ---------- content ---------- */
  const L = {
    help() {
      // Narrow screens get the description on its own indented line instead of a ragged wrap.
      const row = (c, d, label) =>
        '  ' + cmd(c, label) + (XP.mobile() ? '\n      ' : ' '.repeat(Math.max(1, 15 - (label || c).length))) + dim(esc(d));
      return [
        ...title('Available commands'),
        hi('  get to know me'),
        row('about', `who is ${P.firstName}?`),
        row('experience', "where I've worked"),
        row('projects', 'things I build for fun'),
        row('studies', "where I've learned"),
        row('skills', "what I'm good at"),
        row('contact', 'how to reach me'),
        row('links', 'LinkedIn, GitHub & more'),
        ...(P.resume ? [row('resume', 'grab my resume')] : []),
        '',
        hi('  explore'),
        row('ls', 'list files (try: ls, cd projects, cat …)', 'ls / cd / cat'),
        row('tree', 'show every file at once'),
        row('open about', 'open a folder on the XP desktop', 'open <folder>'),
        '',
        hi('  system'),
        row('clear', 'clear the screen'),
        row('color red', 'recolour the rain: ' + XP.MatrixRain.colors().join(', '), 'color <name>'),
        row('history', 'commands you have typed'),
        row('exit', 'unplug and return to the desktop'),
        '',
        dim('  Tip: click any command · ↑/↓ for history · TAB to autocomplete.'),
        dim('  There are a few hidden commands too. Curiosity is rewarded.'),
      ];
    },
    about() {
      return [
        ...title('Profile'),
        `  ${pad('name', 10)}${hi(esc(P.name))}`,
        `  ${pad('role', 10)}${esc(P.title)}`,
        `  ${pad('location', 10)}${esc(P.location)}`,
        ...(P.status ? [`  ${pad('status', 10)}<span class="t-ok">●</span> ${esc(P.status)}`] : []),
        '',
        `  <span class="t-quote">"${esc(P.tagline)}"</span>`,
        '',
        ...(A.bio || []).map((p) => '  ' + esc(p)),
        '',
        dim(`  next → ${cmd('skills')} · ${cmd('projects')} · ${cmd('contact')} · ${cmd('open about')}`),
      ];
    },
    skills() {
      const out = [...title('Skills')];
      (A.levels || []).forEach(([n, v]) => {
        const full = Math.round(v / 5);
        out.push(`  ${esc(pad(n, 14))}<span class="t-bar">${'█'.repeat(full)}</span>${dim('░'.repeat(20 - full))} ${v}%`);
      });
      (A.skills || []).forEach((g) => {
        out.push('', hi('  ' + esc(g.group.toLowerCase())), '  ' + g.items.map((s) => `[${esc(s)}]`).join(' '));
      });
      return out;
    },
    facts() {
      return [...title('Fun facts'), ...(A.funFacts || []).map((f) => `  ✦ ${esc(f)}`)];
    },
    experience() {
      const out = [...title('Experience')];
      (P.experience || []).forEach((e, i, all) => {
        const last = i === all.length - 1;
        out.push(`  ${hi('┌')} ${hi(esc(range(e.start, e.end)))}`);
        out.push(`  │  <b>${esc(e.role)}</b> @ ${esc(e.company)}${e.location ? dim(' · ' + esc(e.location)) : ''}`);
        if (e.summary) out.push(`  │  ${esc(e.summary)}`);
        (e.bullets || []).forEach((b) => out.push(`  │    ▸ ${esc(b)}`));
        if (e.tech && e.tech.length) out.push(`  │  ${dim(e.tech.map((t) => `[${esc(t)}]`).join(' '))}`);
        out.push(last ? `  ${hi('└')}` : '  │');
      });
      out.push(dim(`  more → ${cmd('open experience')}`));
      return out;
    },
    projects() {
      const out = [...title('Passion projects')];
      (P.projects || []).forEach((p, i) => {
        out.push(`  ${hi(`[${String(i + 1).padStart(2, '0')}]`)} <b>${esc(p.name)}</b> ${dim(`(${esc(p.year)})`)}`);
        out.push(`       ${esc(p.summary)}`);
        if (p.tech && p.tech.length) out.push(`       ${dim('stack:')} ${esc(p.tech.join(', '))}`);
        (p.links || []).forEach((l) => out.push(`       ↗ ${link(l.url, l.label)}`));
        out.push('');
      });
      out.push(dim(`  details → ${cmd('cd projects', 'cd projects')} then ${cmd('ls')} · or ${cmd('open projects')}`));
      return out;
    },
    studies() {
      const out = [...title('Studies')];
      (P.studies || []).forEach((s) => {
        out.push(`  ${hi('◆')} <b>${esc(s.degree)}</b>`);
        out.push(`    ${esc(s.school)}${dim(' · ' + esc(range(s.start, s.end)))}`);
        if (s.summary) out.push(`    ${esc(s.summary)}`);
        (s.bullets || []).forEach((b) => out.push(`      ▸ ${esc(b)}`));
        out.push('');
      });
      return out;
    },
    contact() {
      return [
        ...title('Contact'),
        ...(P.email ? [`  ${pad('email', 10)}${link('mailto:' + P.email, P.email)}`] : []),
        ...XP.links()
          .filter((l) => !/^mailto:/i.test(l.url))
          .map((l) => `  ${esc(pad(l.label.toLowerCase(), 10))}${link(l.url, l.url.replace(/^https?:\/\/(www\.)?/, ''))}`),
        '',
        dim('  The red pill: send me a message. I would love to hear from you.'),
      ];
    },
    links() {
      return [
        ...title('Links'),
        ...XP.links().map((l) => `  ↗ ${link(l.url, l.label)}${l.desc ? dim('  ' + esc(l.desc)) : ''}`),
        '',
        dim(`  or browse them the 2002 way → ${cmd('open browser')}`),
      ];
    },
    readme() {
      return [
        `Welcome to ${esc(P.firstName)}'s corner of the Matrix.`,
        '',
        `Everything here is also on the XP desktop: this is just the cooler way in.`,
        `Start with ${cmd('cat about_me/profile.txt')} or type ${cmd('help')}.`,
      ];
    },
  };

  function projectFile(p) {
    return [
      `<b>${esc(p.name)}</b> ${dim(`(${esc(p.year)} · ${esc(p.role)})`)}`,
      '',
      esc(p.summary),
      '',
      ...(p.details || []).map((d) => `  ▸ ${esc(d)}`),
      ...(p.tech && p.tech.length ? ['', dim('stack: ') + esc(p.tech.join(', '))] : []),
      ...(p.links || []).map((l) => `↗ ${link(l.url, l.label)}`),
    ];
  }
  function expFile(e) {
    return [
      `<b>${esc(e.role)}</b> @ ${esc(e.company)}`,
      dim(esc([range(e.start, e.end), e.location, e.type].filter(Boolean).join(' · '))),
      '',
      esc(e.summary),
      ...(e.bullets || []).map((b) => `  ▸ ${esc(b)}`),
      ...(e.tech && e.tech.length ? ['', dim('tools: ') + esc(e.tech.join(', '))] : []),
    ];
  }
  function studyFile(s) {
    return [`<b>${esc(s.degree)}</b>`, dim(esc([s.school, range(s.start, s.end), s.location].filter(Boolean).join(' · '))), '', esc(s.summary), ...(s.bullets || []).map((b) => `  ▸ ${esc(b)}`)];
  }

  /* ---------- virtual file system ---------- */
  let FS = null;
  function fs() {
    if (FS) return FS;
    const dir = (entries) => ({ type: 'dir', entries });
    const file = (lines) => ({ type: 'file', lines });
    const many = (list, name, render) => {
      const out = {};
      (list || []).forEach((x) => (out[slug(name(x)) + '.txt'] = file(() => render(x))));
      return dir(out);
    };
    FS = dir({
      about_me: dir({
        'profile.txt': file(L.about),
        'skills.txt': file(L.skills),
        'fun_facts.txt': file(L.facts),
        'contact.txt': file(L.contact),
      }),
      projects: many(P.projects, (p) => p.name, projectFile),
      experience: many(P.experience, (e) => e.company + '_' + e.role, expFile),
      studies: many(P.studies, (s) => s.school, studyFile),
      'links.txt': file(L.links),
      'README.txt': file(L.readme),
      '.white_rabbit': file(() => ['Follow the white rabbit…', `…it is hiding behind ${cmd('redpill')}.`]),
    });
    return FS;
  }

  function resolve(path) {
    const parts = path.startsWith('/') || path.startsWith('~') ? [] : cwd.slice();
    path
      .replace(/^~\/?/, '')
      .split('/')
      .filter((x) => x && x !== '.')
      .forEach((x) => (x === '..' ? parts.pop() : parts.push(x)));
    let node = fs();
    for (const p of parts) {
      if (!node || node.type !== 'dir' || !node.entries[p]) return null;
      node = node.entries[p];
    }
    return { node, parts };
  }
  const cwdStr = () => '~' + (cwd.length ? '/' + cwd.join('/') : '');
  const promptHTML = () => `<span class="t-user">visitor@${host}</span>:<span class="t-path">${esc(cwdStr())}</span>$`;

  function lsLines(target, flags) {
    const r = resolve(target || '.');
    if (!r) return [warn(`ls: cannot access '${esc(target)}': No such file or directory`)];
    if (r.node.type === 'file') return [esc(target)];
    const base = r.parts.length ? r.parts.join('/') + '/' : '';
    const rel = (name) => {
      const here = cwd.join('/');
      const full = base + name;
      return here && full.startsWith(here + '/') ? full.slice(here.length + 1) : '~/' + full;
    };
    const names = Object.keys(r.node.entries).filter((n) => flags.includes('a') || !n.startsWith('.'));
    const fmt = (n) => {
      const isDir = r.node.entries[n].type === 'dir';
      const path = rel(n);
      return isDir ? cmd(`cd ${path} && ls`, n + '/') : cmd(`cat ${path}`, n);
    };
    if (flags.includes('l'))
      return names.map((n) => {
        const isDir = r.node.entries[n].type === 'dir';
        return `${dim(isDir ? 'drwxr-xr-x' : '-rw-r--r--')}  visitor  ${dim('Oct 25  2001')}  ${fmt(n)}`;
      });
    return [names.map(fmt).join('   ')];
  }

  function treeLines(node = fs(), prefix = '', path = '') {
    const out = path ? [] : [hi('~')];
    const names = Object.keys(node.entries).filter((n) => !n.startsWith('.'));
    names.forEach((n, i) => {
      const last = i === names.length - 1;
      const child = node.entries[n];
      const full = path ? path + '/' + n : n;
      out.push(`${prefix}${last ? '└── ' : '├── '}${child.type === 'dir' ? cmd(`cd ~/${full} && ls`, n + '/') : cmd(`cat ~/${full}`, n)}`);
      if (child.type === 'dir') out.push(...treeLines(child, prefix + (last ? '    ' : '│   '), full));
    });
    return out;
  }

  /* ---------- commands ---------- */
  const OPEN = {
    about: 'about', about_me: 'about', me: 'about', profile: 'about',
    projects: 'projects', project: 'projects', passion: 'projects', passion_projects: 'projects',
    experience: 'experience', exp: 'experience', work: 'experience',
    studies: 'studies', education: 'studies', edu: 'studies', school: 'studies',
    recycle: 'recycle', bin: 'recycle', trash: 'recycle',
    browser: 'browser', explorer: 'browser', web: 'browser', internet: 'browser', iexplore: 'browser',
    help: 'help', display: 'display', desktop: 'desktop',
  };

  const COMMANDS = {
    help: { run: () => ((usedHelp = true), markHelpUsed(), L.help()) },
    about: { alias: ['bio', 'me', 'profile'], run: L.about },
    experience: { alias: ['exp', 'work', 'jobs', 'career'], run: L.experience },
    projects: { alias: ['proj', 'passion', 'portfolio'], run: L.projects },
    studies: { alias: ['education', 'edu', 'school', 'study'], run: L.studies },
    skills: { alias: ['stack', 'skill'], run: L.skills },
    contact: { alias: ['email', 'mail', 'hire'], run: L.contact },
    links: { alias: ['social', 'socials', 'link'], run: L.links },
    resume: {
      alias: ['cv'],
      run: () => {
        if (!P.resume) return [dim('No resume uploaded yet. Meanwhile: ') + cmd('links') + dim(' or ') + cmd('contact')];
        XP.openUrl(P.resume);
        return ['Opening resume in a new tab… ' + link(P.resume, 'click here if it did not open')];
      },
    },
    ls: { alias: ['dir', 'll'], run: (a) => lsLines(a.filter((x) => !x.startsWith('-'))[0], (a.find((x) => x.startsWith('-')) || '') + (a._name === 'll' ? 'la' : '')) },
    cd: {
      run: (a) => {
        const r = resolve(a[0] || '~');
        if (!r) return [warn(`cd: ${esc(a[0])}: No such file or directory`)];
        if (r.node.type !== 'dir') return [warn(`cd: ${esc(a[0])}: Not a directory`)];
        cwd = r.parts;
        updatePrompt();
        return [];
      },
    },
    cat: {
      alias: ['type', 'less', 'more'],
      run: (a) => {
        if (!a[0]) return [warn('cat: missing file operand. Try: ') + cmd('ls')];
        const r = resolve(a[0]);
        if (!r) return [warn(`cat: ${esc(a[0])}: No such file or directory`)];
        if (r.node.type === 'dir') return [warn(`cat: ${esc(a[0])}: Is a directory. Try `) + cmd(`cd ${a[0]} && ls`)];
        return r.node.lines();
      },
    },
    pwd: { run: () => ['/home/visitor' + cwdStr().slice(1)] },
    tree: { run: () => treeLines() },
    open: {
      alias: ['start', 'xdg-open'],
      run: (a) => {
        const what = (a[0] || '').toLowerCase().replace(/\/$/, '');
        const out = XP.links().find((l) => l.id === what || l.label.toLowerCase() === what);
        if (out) {
          XP.openUrl(out.url);
          return [`Opening ${esc(out.label)}…`];
        }
        const to = OPEN[what];
        if (!to) return [warn(`open: don't know how to open '${esc(what || '')}'.`), dim('  try: ') + ['about', 'projects', 'experience', 'studies', 'browser', 'linkedin'].map((x) => cmd('open ' + x, x)).join(' ')];
        setTimeout(() => exit(() => to !== 'desktop' && XP.open(to)), 350);
        return [`Unplugging… opening ${hi(esc(what))} on the desktop.`];
      },
    },
    clear: { alias: ['cls', 'reset'], run: () => (clear(), []) },
    history: { run: () => history.map((h, i) => `  ${dim(String(i + 1).padStart(3))}  ${esc(h)}`) },
    color: {
      alias: ['colour', 'rain'],
      run: (a) => {
        const c = (a[0] || '').toLowerCase();
        if (!c) return ['usage: color <name>   ' + XP.MatrixRain.colors().map((x) => cmd('color ' + x, x)).join(' ')];
        const rgb = rain.setColor(c);
        if (!rgb) return [warn(`color: unknown colour '${esc(c)}'. Options: `) + XP.MatrixRain.colors().map((x) => cmd('color ' + x, x)).join(' ')];
        el.style.setProperty('--mx-rgb', rgb.join(','));
        return [`The Matrix is now ${hi(esc(c))}.`];
      },
    },
    exit: { alias: ['quit', 'logout', 'q', ':q', 'desktop', 'unplug'], run: () => (setTimeout(() => exit(), 250), ['Unplugging…']) },

    // ---- secrets ----
    whoami: { secret: true, run: () => ['visitor', dim(`(a curious human). Type ${cmd('about')} to find out who I am.`)] },
    sudo: { secret: true, run: () => [warn('Permission denied.'), dim('Nice try, Mr. Anderson.')] },
    rm: { secret: true, run: (a) => (a.join(' ').includes('-rf') ? [warn('rm: refusing to delete the Matrix.'), dim('Agent Smith would be proud though.')] : [warn('rm: permission denied')]) },
    hack: { secret: true, run: () => hack() },
    redpill: {
      secret: true,
      alias: ['red', 'red_pill'],
      run: () => [
        `<span class="t-red">You take the red pill.</span>`,
        'You stay in Wonderland, and I show you how deep the rabbit hole goes.',
        '',
        ...L.facts(),
        '',
        dim(`Still curious? ${cmd('hack')}`),
      ],
    },
    bluepill: {
      secret: true,
      alias: ['blue', 'blue_pill'],
      run: () => (setTimeout(() => exit(), 1600), [`<span class="t-blue">You take the blue pill.</span>`, 'The story ends. You wake up at your desktop and believe whatever you want to believe…']),
    },
    matrix: { secret: true, run: () => ['<span class="t-quote">"Unfortunately, no one can be told what the Matrix is. You have to see it for yourself."</span>', dim('— Morpheus')] },
    neo: { secret: true, alias: ['anderson'], run: () => ['Wake up, Neo…', dim(`(also: try ${cmd('redpill')} or ${cmd('bluepill')})`)] },
    morpheus: { secret: true, run: () => ['<span class="t-quote">"I can only show you the door. You\'re the one that has to walk through it."</span>'] },
    trinity: { secret: true, run: () => ['<span class="t-quote">"The answer is out there, and it\'s looking for you."</span>'] },
    spoon: { secret: true, run: () => ['There is no spoon.'] },
    coffee: { secret: true, alias: ['tea', 'java'], run: () => ['      ( (', '       ) )', '    ........', '    |      |]', '    \\      /', "     `----'", dim('  Brewing… done. Fuel for the next project.')] },
    hello: { secret: true, alias: ['hi', 'hey', 'hallo', 'yo'], run: () => [`Hello, visitor. 👋  I'm ${esc(P.firstName)}'s terminal. Type ${cmd('help')} to see what I can do.`] },
    date: { secret: true, alias: ['time'], run: () => [new Date().toString()] },
    echo: { secret: true, run: (a) => [esc(a.join(' '))] },
    banner: { secret: true, run: () => print([banner(P.firstName)], { instant: true }) },
    ping: { secret: true, run: () => ['pong'] },
    xp: { secret: true, alias: ['windows', 'win'], run: () => ['Ah, Windows XP. Bliss wallpaper, the start button, the sound of a dial-up modem…', dim(`Back to it → ${cmd('exit')}`)] },
    vim: { secret: true, alias: ['vi', 'emacs', 'nano'], run: () => ['You are now trapped in an editor forever.', dim(`Just kidding. (${cmd(':q')})`)] },
    reboot: { secret: true, alias: ['restart'], run: () => (setTimeout(() => location.reload(), 900), ['Rebooting the Matrix…']) },
    flip: { secret: true, run: () => (setTimeout(() => exit(() => XP.wm.flip3d()), 250), ['Flipping windows in 3D…']) },
  };

  const NAMES = {};
  Object.entries(COMMANDS).forEach(([k, c]) => {
    NAMES[k] = k;
    (c.alias || []).forEach((a) => (NAMES[a] = k));
  });

  function suggest(word) {
    let best = null;
    let bestD = 3;
    Object.keys(NAMES).forEach((n) => {
      if (COMMANDS[NAMES[n]].secret) return;
      const d = lev(word, n);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    });
    return best;
  }
  function lev(a, b) {
    const m = Array.from({ length: a.length + 1 }, (_, i) => [i]);
    for (let j = 1; j <= b.length; j++) m[0][j] = j;
    for (let i = 1; i <= a.length; i++)
      for (let j = 1; j <= b.length; j++) m[i][j] = Math.min(m[i - 1][j] + 1, m[i][j - 1] + 1, m[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    return m[a.length][b.length];
  }

  async function run(raw) {
    for (const part of raw.split('&&')) {
      const words = part.trim().split(/\s+/).filter(Boolean);
      if (!words.length) continue;
      const name = words[0].toLowerCase();
      const key = NAMES[name];
      if (!key) {
        const s = suggest(name);
        await print([warn(`command not found: ${esc(name)}`) + (s ? `  did you mean ${cmd(s)}?` : ''), dim(`type ${cmd('help')} to see what you can do.`)]);
        continue;
      }
      const args = words.slice(1);
      args._name = name;
      const out = COMMANDS[key].run(args);
      if (out && typeof out.then === 'function') await out;
      else if (out && out.length) await print(out);
    }
  }

  /* ---------- output ---------- */
  function line(html, cls) {
    const d = document.createElement('div');
    d.className = 't-line' + (cls ? ' ' + cls : '');
    d.innerHTML = html;
    el.out.appendChild(d);
    return d;
  }
  const scroll = () => (el.screen.scrollTop = el.screen.scrollHeight);

  /** Print lines with a fast typewriter effect (any key skips). Time-based, so slow frames don't drag it out. */
  function print(lines, { instant = false, cls } = {}) {
    const nodes = lines.map((l) => line(l, cls));
    announce(nodes.map((n) => (n.querySelector('.t-banner') ? P.firstName : n.textContent)).join('\n'));
    if (instant || XP.reduced) return scroll(), Promise.resolve();
    const texts = [];
    nodes.forEach((n) => {
      const w = document.createTreeWalker(n, NodeFilter.SHOW_TEXT);
      let t;
      while ((t = w.nextNode())) {
        texts.push([t, t.nodeValue]);
        t.nodeValue = '';
      }
    });
    const total = texts.reduce((sum, [, v]) => sum + v.length, 0);
    const duration = Math.min(900, 120 + total * 2.2);
    const start = performance.now();
    skip = false;
    busy = true;
    return new Promise((resolve) => {
      let shown = 0;
      let i = 0;
      let j = 0;
      const step = (now) => {
        const target = skip ? total : Math.ceil((total * (now - start)) / duration);
        let budget = target - shown;
        while (budget > 0 && i < texts.length) {
          const [node, full] = texts[i];
          const take = Math.min(budget, full.length - j);
          node.nodeValue = full.slice(0, j + take);
          j += take;
          shown += take;
          budget -= take;
          if (j >= full.length) {
            i++;
            j = 0;
          }
        }
        while (i < texts.length && texts[i][1].length === 0) i++;
        scroll();
        if (i < texts.length) requestAnimationFrame(step);
        else {
          busy = false;
          resolve();
        }
      };
      requestAnimationFrame(step);
    });
  }

  /** Slow, dramatic typing for the intro. */
  function slow(text, ms = 65, cls = 't-intro') {
    const d = line('', cls);
    busy = true;
    return new Promise((resolve) => {
      let k = 0;
      const tick = () => {
        if (skip || XP.reduced) k = text.length;
        else k++;
        d.textContent = text.slice(0, k);
        if (k % 2 === 0) XP.sound.play('key');
        if (k < text.length) setTimeout(tick, ms * (0.6 + Math.random() * 0.8));
        else resolve();
      };
      tick();
    });
  }
  const pause = (ms) => (skip || XP.reduced ? Promise.resolve() : XP.wait(ms));

  function clear() {
    el.out.innerHTML = '';
  }

  function announce(text) {
    el.live.textContent = '';
    el.live.textContent = text.slice(0, 2000);
  }

  /* ---------- input line ---------- */
  function renderInput() {
    const v = el.input.value;
    const p = el.input.selectionStart == null ? v.length : el.input.selectionStart;
    el.before.textContent = v.slice(0, p);
    el.caret.textContent = v[p] || ' ';
    el.after.textContent = v.slice(p + 1);
    el.ghost.hidden = v.length > 0 || usedHelp;
  }
  function updatePrompt() {
    el.prompt.innerHTML = promptHTML();
    el.title.textContent = `visitor@${host}: ${cwdStr()}`;
  }
  function echo(raw) {
    line(`${promptHTML()} ${esc(raw)}`, 't-echo');
  }

  /** Everything that prints goes through one queue, so nothing interleaves or gets lost. */
  let queue = Promise.resolve();
  function enqueue(fn) {
    queue = queue.then(fn, fn);
    return queue;
  }

  async function submit(raw) {
    clearTimeout(idleT);
    echo(raw);
    const v = raw.trim();
    if (v) {
      if (history[history.length - 1] !== v) history.push(v);
      hpos = history.length;
      await run(v);
    }
    scroll();
  }

  function complete() {
    const v = el.input.value;
    const parts = v.split(' ');
    const last = parts[parts.length - 1];
    let options;
    if (parts.length === 1) {
      options = Object.keys(COMMANDS).filter((c) => !COMMANDS[c].secret && c.startsWith(last.toLowerCase()));
    } else if (/^(open|start)$/i.test(parts[0])) {
      options = ['about', 'projects', 'experience', 'studies', 'browser', 'recycle', ...XP.links().map((l) => l.id)].filter((o) => o.startsWith(last.toLowerCase()));
    } else if (/^(color|colour|rain)$/i.test(parts[0])) {
      options = XP.MatrixRain.colors().filter((o) => o.startsWith(last.toLowerCase()));
    } else {
      const slash = last.lastIndexOf('/');
      const dirPart = slash >= 0 ? last.slice(0, slash + 1) : '';
      const r = resolve(dirPart || '.');
      if (!r || r.node.type !== 'dir') return;
      const stem = last.slice(slash + 1);
      options = Object.keys(r.node.entries)
        .filter((n) => n.startsWith(stem) && (stem.startsWith('.') || !n.startsWith('.')))
        .map((n) => dirPart + n + (r.node.entries[n].type === 'dir' ? '/' : ''));
    }
    if (!options.length) return;
    if (options.length === 1) {
      parts[parts.length - 1] = options[0] + (options[0].endsWith('/') ? '' : ' ');
    } else {
      let common = options[0];
      options.forEach((o) => {
        while (!o.startsWith(common)) common = common.slice(0, -1);
      });
      if (common.length > last.length) parts[parts.length - 1] = common;
      else {
        echo(v);
        print([options.map((o) => esc(o)).join('   ')]);
      }
    }
    el.input.value = parts.join(' ');
    el.input.setSelectionRange(el.input.value.length, el.input.value.length);
    renderInput();
  }

  function onKey(e) {
    if (busy) skip = true;
    if (e.key === 'Escape' || (e.key === '`' && !el.input.value)) {
      e.preventDefault();
      return exit();
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      const v = el.input.value;
      el.input.value = '';
      renderInput();
      enqueue(() => submit(v));
    } else if (e.key === 'Tab') {
      e.preventDefault();
      complete();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      if (!history.length) return;
      hpos = Math.min(history.length, Math.max(0, hpos + (e.key === 'ArrowUp' ? -1 : 1)));
      el.input.value = history[hpos] || '';
      requestAnimationFrame(() => {
        el.input.setSelectionRange(el.input.value.length, el.input.value.length);
        renderInput();
      });
    } else if (e.ctrlKey && (e.key === 'l' || e.key === 'L')) {
      e.preventDefault();
      clear();
    } else if (e.ctrlKey && (e.key === 'c' || e.key === 'C') && !String(window.getSelection())) {
      e.preventDefault();
      echo(el.input.value + '^C');
      el.input.value = '';
    }
    requestAnimationFrame(renderInput);
  }

  function runClicked(c) {
    if (busy) skip = true;
    focusInput();
    el.input.value = '';
    renderInput();
    enqueue(() => submit(c));
  }

  function focusInput() {
    el.input.focus({ preventScroll: true });
  }

  function markHelpUsed() {
    el.root.classList.add('help-used');
  }

  function idleHint() {
    clearTimeout(idleT);
    if (usedHelp) return;
    idleT = setTimeout(() => {
      if (active && !busy && !usedHelp && !el.input.value) print([`<span class="t-hint">» psst… not sure where to start? type ${cmd('help')} and press ENTER</span>`]);
    }, 9000);
  }

  async function hack() {
    const steps = ['Initializing neural handshake', 'Bypassing ICE firewall', 'Decrypting resume.db', 'Injecting curiosity', 'Compiling reasons to hire'];
    busy = true;
    for (const s of steps) {
      const d = line('');
      for (let p = 0; p <= 20; p++) {
        d.innerHTML = `${esc(pad(s, 30))} <span class="t-bar">${'█'.repeat(p)}</span>${dim('░'.repeat(20 - p))} ${String(p * 5).padStart(3)}%`;
        scroll();
        if (!skip) await XP.wait(14 + Math.random() * 30);
      }
      d.innerHTML += ' <span class="t-ok">[ OK ]</span>';
    }
    busy = false;
    await print(['', '<span class="t-granted">ACCESS GRANTED</span>', '', `Conclusion: ${esc(P.firstName)} would be a great addition to your team.`, `Next step → ${cmd('contact')}`]);
  }

  /* ---------- intro ---------- */
  async function intro() {
    clear();
    skip = false;
    await slow('Wake up, visitor...');
    await pause(900);
    await slow('The Matrix has you...');
    await pause(900);
    await slow('Follow the white rabbit.', 55);
    await pause(700);
    await slow('Knock, knock.', 95);
    await pause(650);
    clear();
    busy = false;
    await print([banner(P.firstName)], { instant: true });
    await print([
      dim(`${esc(host.toUpperCase())} // career construct v2.0 · secure connection established`),
      '',
      `Welcome. Everything about ${esc(P.firstName)} is one command away.`,
      '',
      `<span class="t-callout">→ Type ${cmd('help')} and press <span class="t-key">ENTER</span> to see what you can do.</span>`,
    ]);
    booted = true;
    idleHint();
  }

  /* ---------- enter / exit (3D) ---------- */
  function build() {
    if (el) return;
    const root = document.getElementById('screen-matrix');
    el = {
      root,
      term: root.querySelector('.term'),
      screen: root.querySelector('.term-screen'),
      out: root.querySelector('.term-out'),
      live: root.querySelector('.term-live'),
      prompt: root.querySelector('.term-prompt'),
      title: root.querySelector('.term-title'),
      before: root.querySelector('.term-before'),
      caret: root.querySelector('.term-caret'),
      after: root.querySelector('.term-after'),
      ghost: root.querySelector('.term-ghost'),
      input: root.querySelector('.term-input'),
      chips: root.querySelector('.term-chips'),
    };
    el.style = root.style;
    rain = new XP.MatrixRain(root.querySelector('.matrix-rain'));
    if (XP.mobile()) el.ghost.textContent = 'type help ↵';
    updatePrompt();
    renderInput();

    const chipList = ['help', 'about', 'experience', 'projects', 'studies', 'skills', 'contact', 'links', 'exit'];
    el.chips.innerHTML = chipList.map((c) => `<button class="chip${c === 'help' ? ' chip-help' : ''}" data-cmd="${c}">${c}</button>`).join('');

    el.input.addEventListener('keydown', onKey);
    el.input.addEventListener('input', () => {
      renderInput();
      clearTimeout(idleT);
      if (!el.input.value) idleHint();
    });
    el.input.addEventListener('focus', () => root.classList.add('is-focused'));
    el.input.addEventListener('blur', () => root.classList.remove('is-focused'));
    document.addEventListener('selectionchange', () => active && document.activeElement === el.input && renderInput());
    root.addEventListener('click', (e) => {
      const c = e.target.closest('[data-cmd]');
      if (c) return runClicked(c.dataset.cmd);
      if (e.target.closest('a, .term-exit')) return;
      if (!String(window.getSelection())) focusInput();
    });
    root.addEventListener('keydown', (e) => {
      const c = e.target.closest && e.target.closest('.cmd');
      if (c && e.key === 'Enter') runClicked(c.dataset.cmd);
    });
    root.querySelector('.term-exit').addEventListener('click', () => exit());
  }

  function glitch() {
    const g = document.getElementById('glitch');
    g.classList.remove('is-on');
    void g.offsetWidth;
    g.classList.add('is-on');
  }

  // Grayscale + a green "multiply" layer, so the desktop turns Matrix-green without odd hues mid-way.
  const DESK_OUT = [
    { transform: 'perspective(900px) rotateX(0deg) translateY(0%) scale(1)', filter: 'grayscale(0) brightness(1)', opacity: 1 },
    { transform: 'perspective(900px) rotateX(14deg) translateY(0%) scale(.93)', filter: 'grayscale(.8) brightness(.95)', opacity: 1, offset: 0.3 },
    { transform: 'perspective(900px) rotateX(70deg) translateY(30%) scale(.72)', filter: 'grayscale(1) brightness(.35)', opacity: 0 },
  ];
  const TINT = [{ opacity: 0 }, { opacity: 0.9, offset: 0.3 }, { opacity: 1 }];
  const reverse = (frames) => frames.slice().reverse().map((k, i) => Object.assign({}, k, { offset: k.offset != null ? 1 - k.offset : i === 0 ? 0 : 1 }));

  async function enter(opts = {}) {
    build();
    if (moving) return;
    if (active) {
      if (opts.run) runClicked(opts.run);
      return;
    }
    moving = true;
    active = true;
    XP.closeMenu && XP.closeMenu();
    XP.desktop && XP.desktop.closeStart && XP.desktop.closeStart();
    const desk = document.getElementById('screen-desktop');
    const from = opts.from === 'welcome' ? document.getElementById('screen-welcome') : desk;
    el.root.classList.add('is-active');
    rain.start();
    XP.sound.play('whoosh');
    glitch();

    const outOpts = { duration: 1150, easing: 'cubic-bezier(.6,0,.4,1)', fill: 'forwards' };
    const outA = XP.animate(from, DESK_OUT, outOpts);
    const tint = from.querySelector('.desk-tint');
    const tintA = XP.animate(tint, TINT, outOpts);
    const rainA = XP.animate(el.root, [{ opacity: 0 }, { opacity: 1 }], { duration: 900, delay: 250, fill: 'both', easing: 'ease-out' });
    const termA = XP.animate(
      el.term,
      [
        { transform: 'perspective(1000px) translateZ(-1400px) rotateX(38deg)', opacity: 0 },
        { transform: 'perspective(1000px) translateZ(70px) rotateX(-4deg)', opacity: 1, offset: 0.75 },
        { transform: 'perspective(1000px) translateZ(0px) rotateX(0deg)', opacity: 1 },
      ],
      { duration: 950, delay: 800, fill: 'both', easing: 'cubic-bezier(.2,.8,.2,1)' }
    );
    await XP.settle(outA, tintA, rainA, termA);
    if (opts.from === 'welcome') XP.desktop.enterUnderMatrix();
    desk.classList.add('is-under-matrix');
    outA.cancel();
    tintA.cancel();
    rainA.cancel();
    termA.cancel();
    moving = false;
    focusInput();

    if (!booted) enqueue(intro);
    else if (!opts.run) enqueue(() => print([dim(`reconnected · ${new Date().toLocaleTimeString()} · type ${cmd('help')} if you get lost`)]).then(idleHint));
    if (opts.run) runClicked(opts.run);
  }

  async function exit(then) {
    if (!active || moving) return;
    moving = true;
    skip = true;
    clearTimeout(idleT);
    el.input.blur();
    const desk = document.getElementById('screen-desktop');
    XP.sound.play('unwhoosh');
    glitch();
    desk.classList.remove('is-under-matrix');
    const termA = XP.animate(
      el.term,
      [
        { transform: 'perspective(1000px) translateZ(0px) rotateX(0deg)', opacity: 1 },
        { transform: 'perspective(1000px) translateZ(520px) rotateX(-12deg)', opacity: 0 },
      ],
      { duration: 450, fill: 'forwards', easing: 'cubic-bezier(.5,0,.75,0)' }
    );
    const rainA = XP.animate(el.root, [{ opacity: 1 }, { opacity: 0 }], { duration: 700, delay: 250, fill: 'forwards' });
    const backOpts = { duration: 1050, delay: 200, fill: 'backwards', easing: 'cubic-bezier(.3,.7,.2,1)' };
    const deskA = XP.animate(desk, reverse(DESK_OUT), backOpts);
    const tintA = XP.animate(desk.querySelector('.desk-tint'), reverse(TINT), backOpts);
    await XP.settle(termA, rainA, deskA, tintA);
    el.root.classList.remove('is-active');
    termA.cancel();
    rainA.cancel();
    rain.stop();
    active = false;
    moving = false;
    XP.desktop && XP.desktop.afterMatrix();
    if (typeof then === 'function') then();
  }

  function toggle() {
    active ? exit() : enter();
  }

  XP.terminal = {
    enter,
    exit,
    toggle,
    get active() {
      return active || moving;
    },
  };
})();
