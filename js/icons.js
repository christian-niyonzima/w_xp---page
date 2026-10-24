/* XP-flavoured icon set, drawn as inline SVG (48×48 grid, scaled as needed). */
(function () {
  const XP = (window.XP = window.XP || {});
  let n = 0;
  const uid = () => 'i' + (++n).toString(36);

  const stops = (s) => s.map(([o, c, a]) => `<stop offset="${o}" stop-color="${c}"${a != null ? ` stop-opacity="${a}"` : ''}/>`).join('');
  const lin = (id, s, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops(s)}</linearGradient>`;
  const rad = (id, s, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops(s)}</radialGradient>`;

  const initials = () =>
    String((window.PROFILE && window.PROFILE.name) || 'XP')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

  /* ---------- folder badges ---------- */
  const BADGE = {
    user: () =>
      `<circle cx="24" cy="26.6" r="3.8" fill="#3b78d8" stroke="#1d4fa8"/><path d="M16.6 37.4c.7-4.4 3.8-6.7 7.4-6.7s6.7 2.3 7.4 6.7z" fill="#3b78d8" stroke="#1d4fa8"/>`,
    star: () =>
      `<path d="M24 22.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#ff8a1e" stroke="#b44f00" stroke-linejoin="round"/>`,
    case: () =>
      `<path d="M21 26.5v-2a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" fill="none" stroke="#5e3a17" stroke-width="1.6"/><rect x="16" y="26.5" width="16" height="11" rx="1.6" fill="#9a6331" stroke="#5e3a17"/><path d="M16 31h16" stroke="#5e3a17"/><rect x="22.5" y="29.8" width="3" height="2.4" fill="#f4c542" stroke="#8a6a12" stroke-width=".6"/>`,
    cap: () =>
      `<path d="M18.5 29.3v4.2c0 1.6 2.5 2.9 5.5 2.9s5.5-1.3 5.5-2.9v-4.2L24 31.6z" fill="#2d3b5e" stroke="#0b1222"/><path d="M24 23l10 4.2-10 4.2-10-4.2z" fill="#1f2a44" stroke="#0b1222" stroke-linejoin="round"/><path d="M33.2 27.6v6.2" stroke="#f2b632" stroke-width="1.2"/><circle cx="33.2" cy="34.6" r="1.2" fill="#f2b632"/>`,
  };

  function folder(badge) {
    const a = uid(), b = uid();
    return `<defs>${lin(a, [[0, '#f3c95b'], [1, '#d69a26']])}${lin(b, [[0, '#fff1b8'], [0.45, '#fbd462'], [1, '#efb22c']])}</defs>
      <path d="M3 12a3 3 0 0 1 3-3h11.2l4 4H42a3 3 0 0 1 3 3v22a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3z" fill="url(#${a})" stroke="#b07a14"/>
      <rect x="7" y="15" width="34" height="16" rx="1" fill="#fff" stroke="#d8d2c0"/>
      <path d="M2.2 21.6A2.5 2.5 0 0 1 4.7 19h38.8a2.4 2.4 0 0 1 2.4 2.8l-2.5 16.6A3 3 0 0 1 40.4 41H7.3a3 3 0 0 1-3-2.6z" fill="url(#${b})" stroke="#c08a1c"/>
      <path d="M5 20.6h38.4" stroke="#fff" stroke-opacity=".8"/>${badge ? BADGE[badge]() : ''}`;
  }

  /* ---------- documents ---------- */
  function doc(kind) {
    const g = uid();
    const band = {
      pdf: ['#d93a2b', 'PDF'],
      html: ['#2a6fd6', 'HTM'],
      exe: ['#6b4fbb', 'EXE'],
      txt: null,
      unknown: ['#7a7a7a', '???'],
    }[kind || 'txt'];
    return `<defs>${lin(g, [[0, '#ffffff'], [1, '#e9eef5']], 1, 1)}</defs>
      <path d="M10 4h20l9 9v31H10z" fill="url(#${g})" stroke="#7a8fa6"/>
      <path d="M30 4v9h9" fill="#dfe7f1" stroke="#7a8fa6" stroke-linejoin="round"/>
      <path d="M15 19h18M15 23h18M15 27h18M15 31h12" stroke="#9fb3c8" stroke-width="1.4"/>
      ${band ? `<rect x="7" y="33" width="26" height="9" rx="1.5" fill="${band[0]}"/><text x="20" y="40.2" text-anchor="middle" font-family="Tahoma,Verdana,sans-serif" font-size="7" font-weight="700" fill="#fff">${band[1]}</text>` : ''}`;
  }

  const RAW = {
    folder: () => folder(),
    'folder-about': () => folder('user'),
    'folder-projects': () => folder('star'),
    'folder-experience': () => folder('case'),
    'folder-studies': () => folder('cap'),

    txt: () => doc('txt'),
    html: () => doc('html'),
    exe: () => doc('exe'),
    pdf: () => doc('pdf'),
    unknown: () => doc('unknown'),

    terminal: () => {
      const t = uid(), s = uid();
      return `<defs>${lin(t, [[0, '#4f9bff'], [1, '#0a49d6']])}${rad(s, [[0, '#0b2a12'], [1, '#000']])}</defs>
        <rect x="3.5" y="7.5" width="41" height="33" rx="3" fill="#10161a" stroke="#0d3a8a"/>
        <path d="M3.5 10.5a3 3 0 0 1 3-3h35a3 3 0 0 1 3 3V14h-41z" fill="url(#${t})"/>
        <rect x="38.6" y="9" width="3.6" height="3.4" rx=".7" fill="#e55b2f" stroke="#fff" stroke-width=".5"/>
        <rect x="6" y="15.5" width="36" height="22.5" fill="url(#${s})"/>
        <g fill="#00ff66"><rect x="27" y="17" width="1.8" height="1.8" opacity=".25"/><rect x="27" y="20" width="1.8" height="1.8" opacity=".45"/><rect x="27" y="23" width="1.8" height="1.8" opacity=".7"/><rect x="27" y="26" width="1.8" height="1.8" fill="#d6ffe4"/>
        <rect x="31.5" y="17" width="1.8" height="1.8" opacity=".5"/><rect x="31.5" y="20" width="1.8" height="1.8" opacity=".8"/><rect x="31.5" y="23" width="1.8" height="1.8" fill="#d6ffe4"/>
        <rect x="36" y="20" width="1.8" height="1.8" opacity=".3"/><rect x="36" y="23" width="1.8" height="1.8" opacity=".55"/><rect x="36" y="26" width="1.8" height="1.8" opacity=".8"/><rect x="36" y="29" width="1.8" height="1.8" opacity=".95"/><rect x="36" y="32" width="1.8" height="1.8" fill="#d6ffe4"/></g>
        <path d="M9.5 24l4.2 3.2-4.2 3.2" fill="none" stroke="#3dff7a" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        <rect x="15.5" y="29.4" width="6.5" height="2" fill="#3dff7a"/>`;
    },

    browser: () => {
      const s = uid(), r = uid(), c = uid();
      return `<defs>${rad(s, [[0, '#e0f4ff'], [0.45, '#5aaaf0'], [1, '#0b4aa8']], 0.35, 0.3, 0.75)}${lin(r, [[0, '#ffe680'], [1, '#e08a00']], 1, 1)}
        <clipPath id="${c}"><rect x="-10" y="25" width="70" height="30"/></clipPath></defs>
        <g transform="rotate(-24 24 25)"><ellipse cx="24" cy="25" rx="22" ry="7" fill="none" stroke="url(#${r})" stroke-width="2.8"/></g>
        <circle cx="24" cy="25" r="15" fill="url(#${s})" stroke="#0a3d8f"/>
        <path d="M15 17c3-2 6-1.5 7 0s-1 3 .5 4.5 4 .5 4 3-3 3-4 5-1 4-3 3.5-2-3-3.5-4.5S13 26 13 23s0-4.5 2-6z" fill="#4bb33c" stroke="#2c7a22" stroke-width=".6"/>
        <path d="M28 13.5c2.5.3 5 1.6 6.5 3.5-1 .5-2.5 0-3.5 1s.5 2.5-1 3-2.5-1.5-3-3 0-3 1-4.5z" fill="#4bb33c" stroke="#2c7a22" stroke-width=".6"/>
        <path d="M30 28c2-1 4.5-.5 5 1.5s-1 4.5-3 5.5-3-.5-3-2.5 0-3.5 1-4.5z" fill="#4bb33c" stroke="#2c7a22" stroke-width=".6"/>
        <ellipse cx="19" cy="17.5" rx="7" ry="3.6" fill="#fff" opacity=".4" transform="rotate(-25 19 17.5)"/>
        <g transform="rotate(-24 24 25)" clip-path="url(#${c})"><ellipse cx="24" cy="25" rx="22" ry="7" fill="none" stroke="url(#${r})" stroke-width="2.8"/></g>`;
    },

    recycle: () => {
      const b = uid();
      return `<defs>${lin(b, [[0, '#f6f9fc'], [0.5, '#d5e1ea'], [1, '#9fb4c4']], 1, 0)}</defs>
        <path d="M17 12.5l3-5 5 2.5 4.5-3 3.5 4.5" fill="#fff" stroke="#9aa7b0" stroke-linejoin="round"/>
        <path d="M21 13l4-3.5 4 3" fill="#f4f0dc" stroke="#9aa7b0"/>
        <path d="M11.5 14h25l-2.7 27.3a2.5 2.5 0 0 1-2.5 2.2H16.7a2.5 2.5 0 0 1-2.5-2.2z" fill="url(#${b})" stroke="#5f7686"/>
        <path d="M18 17.5l1 24M24 17.5v24.5M30 17.5l-1 24" stroke="#8aa1b1" stroke-width=".8"/>
        <ellipse cx="24" cy="14" rx="12.7" ry="2.9" fill="#e3ecf3" stroke="#5f7686"/>
        <g fill="none" stroke="#2f9a3a" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21.5 25.5l2.5-4 2.5 4"/><path d="M27.8 27.8l2 3.4h-4.6"/><path d="M20 31.2h-1.8l2-3.4"/></g>`;
    },

    user: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#69b8ff'], [1, '#1d5fd1']], 1, 1)}</defs>
        <rect x="5" y="5" width="38" height="38" rx="5" fill="url(#${g})" stroke="#fff" stroke-width="2.5"/>
        <text x="24" y="30.5" text-anchor="middle" font-family="Trebuchet MS,Tahoma,sans-serif" font-size="16" font-weight="700" fill="#fff">${initials()}</text>`;
    },

    skills: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#acedad'], [0.5, '#2ed330'], [1, '#8fe791']])}</defs>
        <rect x="5" y="7" width="38" height="34" rx="3" fill="#fff" stroke="#7a8fa6"/>
        <rect x="9" y="12" width="26" height="6" rx="1" fill="url(#${g})" stroke="#3a8a3a" stroke-width=".7"/>
        <rect x="9" y="21" width="20" height="6" rx="1" fill="url(#${g})" stroke="#3a8a3a" stroke-width=".7"/>
        <rect x="9" y="30" width="30" height="6" rx="1" fill="url(#${g})" stroke="#3a8a3a" stroke-width=".7"/>`;
    },

    bulb: () => {
      const g = uid();
      return `<defs>${rad(g, [[0, '#fffbd6'], [0.6, '#ffe14d'], [1, '#f2b500']], 0.4, 0.35, 0.7)}</defs>
        <path d="M24 5a12 12 0 0 0-7 21.8c1.3 1 2 2.3 2 3.7V33h10v-2.5c0-1.4.7-2.7 2-3.7A12 12 0 0 0 24 5z" fill="url(#${g})" stroke="#b58a00"/>
        <path d="M20.5 26l2-6.5 1.5 4.2 1.5-4.2 2 6.5" fill="none" stroke="#c77700" stroke-width="1.2"/>
        <rect x="19" y="33" width="10" height="3" rx=".6" fill="#c9cfd4" stroke="#7b858c"/><rect x="19.5" y="36" width="9" height="3" rx=".6" fill="#b3bac0" stroke="#7b858c"/>
        <path d="M21 39h6l-1 2.5h-4z" fill="#7b858c"/>
        <path d="M8 16H5M43 16h-3M11 6.5 9 4.5M37 6.5l2-2" stroke="#f2b500" stroke-width="1.6" stroke-linecap="round"/>`;
    },

    mail: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#fffdf0'], [1, '#eedfa8']])}</defs>
        <rect x="4.5" y="11.5" width="39" height="27" rx="2" fill="url(#${g})" stroke="#8a7a4a"/>
        <path d="M5 37.5l14.5-12.5M43 37.5 28.5 25" stroke="#c4b27a"/>
        <path d="M5 12.5l19 14.5 19-14.5" fill="none" stroke="#8a7a4a" stroke-linejoin="round"/>
        <rect x="35" y="14.5" width="5.5" height="6.5" fill="#e0482f" stroke="#fff" stroke-width=".8"/>`;
    },

    app: (accent = '#3b8cff') => {
      const t = uid();
      return `<defs>${lin(t, [[0, '#4f9bff'], [1, '#0a49d6']])}</defs>
        <rect x="4" y="8" width="40" height="32" rx="3" fill="#ece9d8" stroke="#0a3fb8"/>
        <path d="M4 11a3 3 0 0 1 3-3h34a3 3 0 0 1 3 3v3H4z" fill="url(#${t})"/>
        <rect x="38" y="9.2" width="3.6" height="3.2" rx=".6" fill="#e55b2f"/>
        <rect x="8" y="18" width="14" height="17" rx="1" fill="${accent}"/>
        <path d="M11 30l3.5-5 2.5 3 2-2 2 4z" fill="#fff" opacity=".85"/>
        <rect x="25" y="18" width="15" height="2.6" rx="1" fill="#7f8fa6"/><rect x="25" y="23" width="12" height="2.2" rx="1" fill="#b8c3d3"/><rect x="25" y="27.4" width="14" height="2.2" rx="1" fill="#b8c3d3"/>
        <rect x="25" y="31.8" width="8" height="3.2" rx="1" fill="${accent}"/>`;
    },

    briefcase: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#b77a3e'], [1, '#7a4a1f']])}</defs>
        <path d="M18 14v-3a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v3" fill="none" stroke="#4e2f12" stroke-width="2.4"/>
        <rect x="5" y="14" width="38" height="26" rx="3" fill="url(#${g})" stroke="#4e2f12"/>
        <path d="M5 24.5h38" stroke="#4e2f12" stroke-width="1.2"/>
        <rect x="21" y="21.5" width="6" height="6" rx="1" fill="#f4c542" stroke="#8a6a12"/>
        <path d="M8 16.5h32" stroke="#fff" stroke-opacity=".25"/>`;
    },

    cap: () =>
      `<path d="M12.5 24v8.5c0 3.2 5.1 5.8 11.5 5.8s11.5-2.6 11.5-5.8V24L24 29z" fill="#2d3b5e" stroke="#0b1222"/>
       <path d="M24 10l21 9-21 9-21-9z" fill="#1f2a44" stroke="#0b1222" stroke-linejoin="round"/>
       <path d="M24 10l21 9-21 9" fill="none" stroke="#3d4f7a" stroke-width=".8"/>
       <path d="M40 21v11" stroke="#f2b632" stroke-width="1.8"/><path d="M38.2 32h3.6l-.6 5h-2.4z" fill="#f2b632"/>`,

    linkedin: () =>
      `<rect x="4" y="4" width="40" height="40" rx="7" fill="#0a66c2"/>
       <circle cx="15" cy="15" r="3.3" fill="#fff"/><rect x="12" y="20.5" width="6" height="15.5" fill="#fff"/>
       <path d="M22 20.5h5.6v2.3c.9-1.6 2.8-2.8 5.4-2.8 4.5 0 5.6 2.9 5.6 6.9V36h-6v-8.3c0-2-.4-3.4-2.4-3.4s-2.6 1.6-2.6 3.4V36H22z" fill="#fff"/>`,

    github: () =>
      `<rect x="3" y="3" width="42" height="42" rx="9" fill="#fff" stroke="#d0d7de"/>
       <path transform="translate(5 5) scale(2.375)" fill="#1f2328" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"/>`,

    globe: () => {
      const s = uid();
      return `<defs>${rad(s, [[0, '#e0f4ff'], [0.5, '#5aaaf0'], [1, '#0b4aa8']], 0.35, 0.3, 0.75)}</defs>
        <circle cx="24" cy="24" r="19" fill="url(#${s})" stroke="#0a3d8f"/>
        <g fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="1.3"><ellipse cx="24" cy="24" rx="8" ry="19"/><path d="M5 24h38M8 14h32M8 34h32"/></g>`;
    },

    help: () => {
      const s = uid();
      return `<defs>${rad(s, [[0, '#8fc4ff'], [1, '#1652c4']], 0.35, 0.3, 0.8)}</defs>
        <circle cx="24" cy="24" r="19" fill="url(#${s})" stroke="#0c3a94"/>
        <text x="24" y="32.5" text-anchor="middle" font-family="Georgia,serif" font-size="25" font-weight="700" fill="#fff">?</text>`;
    },
    info: () => {
      const s = uid();
      return `<defs>${rad(s, [[0, '#9fd0ff'], [1, '#1a5fd0']], 0.35, 0.3, 0.8)}</defs>
        <circle cx="24" cy="24" r="19" fill="url(#${s})" stroke="#0c3a94"/>
        <circle cx="24" cy="14.5" r="2.8" fill="#fff"/><rect x="21.4" y="20" width="5.2" height="15" rx="1.2" fill="#fff"/>`;
    },
    error: () => {
      const s = uid();
      return `<defs>${rad(s, [[0, '#ff9a8a'], [1, '#c5160b']], 0.35, 0.3, 0.8)}</defs>
        <circle cx="24" cy="24" r="19" fill="url(#${s})" stroke="#7d0d05"/>
        <path d="M17 17l14 14M31 17L17 31" stroke="#fff" stroke-width="4.4" stroke-linecap="round"/>`;
    },
    warning: () => {
      const s = uid();
      return `<defs>${lin(s, [[0, '#fff27a'], [1, '#f2b600']])}</defs>
        <path d="M24 5l20 36H4z" fill="url(#${s})" stroke="#8a6500" stroke-linejoin="round"/>
        <rect x="21.8" y="16" width="4.4" height="13" rx="1.2"/><circle cx="24" cy="34.5" r="2.5"/>`;
    },

    power: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#ff8c6a'], [0.5, '#e2401c'], [1, '#b02a0d']])}</defs>
        <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#${g})" stroke="#7a1a00"/>
        <path d="M16.5 15.5a11 11 0 1 0 15 0" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M24 10.5v13" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>`;
    },
    standby: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#ffe58a'], [0.5, '#f2b51c'], [1, '#c98a00']])}</defs>
        <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#${g})" stroke="#7a5400"/>
        <path d="M16.5 15.5a11 11 0 1 0 15 0" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M24 10.5v13" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>`;
    },
    restart: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#a8e98a'], [0.5, '#3fae2a'], [1, '#22801a']])}</defs>
        <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#${g})" stroke="#155a10"/>
        <path d="M33.5 21A10.5 10.5 0 1 0 31 31.5" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round"/>
        <path d="M35.5 12.5v9.5H26" fill="none" stroke="#fff" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    logoff: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#ffe58a'], [0.5, '#f2b51c'], [1, '#c98a00']])}</defs>
        <rect x="4" y="4" width="40" height="40" rx="8" fill="url(#${g})" stroke="#7a5400"/>
        <circle cx="18" cy="21" r="6.5" fill="none" stroke="#fff" stroke-width="3.4"/>
        <path d="M23 25.5l12 10M30 31.5l3-3.5M33.5 34.5l2.5-3" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>`;
    },

    back: () => {
      const g = uid();
      return `<defs>${rad(g, [[0, '#9be27a'], [1, '#2f8f1a']], 0.35, 0.3, 0.8)}</defs>
        <circle cx="24" cy="24" r="20" fill="url(#${g})" stroke="#1e6a0f"/>
        <path d="M26 14L16 24l10 10M16.5 24H33" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    forward: () => {
      const g = uid();
      return `<defs>${rad(g, [[0, '#9be27a'], [1, '#2f8f1a']], 0.35, 0.3, 0.8)}</defs>
        <circle cx="24" cy="24" r="20" fill="url(#${g})" stroke="#1e6a0f"/>
        <path d="M22 14l10 10-10 10M31.5 24H15" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    up: () =>
      `${folder()}<circle cx="34" cy="16" r="9" fill="#3fae2a" stroke="#1e6a0f"/><path d="M34 21.5v-10M29.5 15.5 34 11l4.5 4.5" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    search: () =>
      `<circle cx="20" cy="20" r="12" fill="#dff0ff" fill-opacity=".7" stroke="#3d5f8a" stroke-width="4"/>
       <path d="M14 15a8 8 0 0 1 6-3.5" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
       <path d="M29 29l11 11" stroke="#7a4a1f" stroke-width="6.5" stroke-linecap="round"/>`,
    folders: () =>
      `<g transform="translate(14 14) scale(.68)">${folder()}</g><path d="M8 8v28h7M8 22h7" fill="none" stroke="#7f7f7f" stroke-width="1.6" stroke-dasharray="2 1.5"/><g transform="translate(2 1) scale(.42)">${folder()}</g>`,
    views: () =>
      `<g fill="#fff" stroke="#4a6fb5" stroke-width="1.5"><rect x="6" y="6" width="15" height="15" rx="1.5"/><rect x="27" y="6" width="15" height="15" rx="1.5"/><rect x="6" y="27" width="15" height="15" rx="1.5"/><rect x="27" y="27" width="15" height="15" rx="1.5"/></g>
       <g fill="#4f9bff"><rect x="9" y="9" width="9" height="9"/><rect x="30" y="9" width="9" height="9"/><rect x="9" y="30" width="9" height="9"/><rect x="30" y="30" width="9" height="9"/></g>`,
    refresh: () =>
      `<path d="M37 19a14 14 0 0 0-25.5-3.5" fill="none" stroke="#2f9a3a" stroke-width="5" stroke-linecap="round"/>
       <path d="M11 29a14 14 0 0 0 25.5 3.5" fill="none" stroke="#2f9a3a" stroke-width="5" stroke-linecap="round"/>
       <path d="M41 9.5v11H30z" fill="#2f9a3a"/><path d="M7 38.5v-11h11z" fill="#2f9a3a"/>`,
    stop: () => RAW.error(),
    home: () =>
      `<path d="M24 6L4 23h6v19h11V31h6v11h11V23h6z" fill="#fff4d6" stroke="#8a5a20" stroke-linejoin="round"/>
       <path d="M24 6L4 23h6l14-12 14 12h6z" fill="#d6452b" stroke="#8a2210" stroke-linejoin="round"/>
       <rect x="31" y="8" width="5" height="9" fill="#a0522d" stroke="#5e2c12"/>`,
    favorites: () =>
      `<path d="M24 4l6 12.4 13.6 2-9.8 9.5 2.3 13.5L24 35l-12.1 6.4 2.3-13.5-9.8-9.5 13.6-2z" fill="#ffd23f" stroke="#b07800" stroke-linejoin="round"/>
       <path d="M24 10l3.6 7.6" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`,
    history: () =>
      `<circle cx="25" cy="25" r="17" fill="#fff" stroke="#2f9a3a" stroke-width="4"/>
       <path d="M25 14v11.5l7.5 5" fill="none" stroke="#333" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
       <path d="M3 13l8 2-2 8" fill="none" stroke="#2f9a3a" stroke-width="3.6" stroke-linecap="round" stroke-linejoin="round"/>`,
    go: () => {
      const g = uid();
      return `<defs>${lin(g, [[0, '#8fe06a'], [1, '#2a8a17']])}</defs>
        <rect x="4" y="4" width="40" height="40" rx="7" fill="url(#${g})" stroke="#1e6a0f"/>
        <path d="M14 24h18M24 15l9 9-9 9" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    run: () => {
      const t = uid();
      return `<defs>${lin(t, [[0, '#4f9bff'], [1, '#0a49d6']])}</defs>
        <rect x="4" y="9" width="32" height="26" rx="2" fill="#fff" stroke="#0a3fb8"/><path d="M4 11a2 2 0 0 1 2-2h28a2 2 0 0 1 2 2v3H4z" fill="url(#${t})"/>
        <path d="M22 29l18 0M33 22l7 7-7 7" fill="none" stroke="#2f9a3a" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round"/>`;
    },
    display: () => {
      const s = uid();
      return `<defs>${lin(s, [[0, '#2a6fd6'], [0.6, '#7ab8f5'], [0.61, '#5fb32c'], [1, '#2f7d17']])}</defs>
        <rect x="4" y="6" width="40" height="29" rx="2.5" fill="#d9d6cb" stroke="#6f6c62"/>
        <rect x="8" y="10" width="32" height="21" fill="url(#${s})"/>
        <path d="M18 35l-2 6h16l-2-6z" fill="#c4c0b3" stroke="#6f6c62"/><rect x="12" y="41" width="24" height="3" rx="1" fill="#c4c0b3" stroke="#6f6c62"/>`;
    },
    computer: () => RAW.display(),
    desktop: () => {
      const s = uid();
      return `<defs>${lin(s, [[0, '#2a6fd6'], [1, '#7ab8f5']])}</defs>
        <rect x="4" y="8" width="40" height="30" rx="2" fill="url(#${s})" stroke="#0a3fb8"/>
        <rect x="4" y="33" width="40" height="5" fill="#245ddb"/><rect x="5" y="33.5" width="9" height="4" rx="2" fill="#3fae2a"/>
        <rect x="9" y="12" width="6" height="5" fill="#ffd23f"/><rect x="9" y="20" width="6" height="5" fill="#fff"/>`;
    },
    flip: () => {
      const t = uid();
      return `<defs>${lin(t, [[0, '#4f9bff'], [1, '#0a49d6']])}</defs>
        <g transform="skewY(-12) translate(0 6)"><rect x="18" y="8" width="24" height="18" rx="1.5" fill="#ece9d8" stroke="#0a3fb8" opacity=".55"/>
        <rect x="11" y="14" width="24" height="18" rx="1.5" fill="#ece9d8" stroke="#0a3fb8" opacity=".8"/>
        <rect x="4" y="20" width="24" height="18" rx="1.5" fill="#ece9d8" stroke="#0a3fb8"/><rect x="4" y="20" width="24" height="4" fill="url(#${t})"/></g>`;
    },
    speaker: () =>
      `<path d="M8 18h8l10-8v28l-10-8H8z" fill="#f2f2f2" stroke="#3a3a3a" stroke-width="2" stroke-linejoin="round"/>
       <path d="M31 17a9 9 0 0 1 0 14M35.5 12.5a15 15 0 0 1 0 23" fill="none" stroke="#f2f2f2" stroke-width="3" stroke-linecap="round"/>`,
    mute: () =>
      `<path d="M8 18h8l10-8v28l-10-8H8z" fill="#f2f2f2" stroke="#3a3a3a" stroke-width="2" stroke-linejoin="round"/>
       <circle cx="36" cy="24" r="8.5" fill="#e2401c" stroke="#fff" stroke-width="1.6"/><path d="M31.5 28.5l9-9" stroke="#fff" stroke-width="2.6"/>`,
    pill: () => {
      const r = uid(), b = uid();
      return `<defs>${lin(r, [[0, '#ff8a8a'], [0.5, '#e01b1b'], [1, '#8a0000']])}${lin(b, [[0, '#8ab8ff'], [0.5, '#1b5fe0'], [1, '#00238a']])}</defs>
        <g transform="rotate(-40 24 24)"><path d="M24 15h-9a9 9 0 0 0 0 18h9z" fill="url(#${r})" stroke="#4a0000"/>
        <path d="M24 15h9a9 9 0 0 1 0 18h-9z" fill="url(#${b})" stroke="#001450"/>
        <path d="M10 19.5h26" stroke="#fff" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/></g>`;
    },
    key: () => RAW.logoff(),
    copy: () =>
      `<rect x="14" y="4" width="26" height="32" rx="2" fill="#fff" stroke="#7a8fa6"/><rect x="8" y="12" width="26" height="32" rx="2" fill="#fff" stroke="#7a8fa6"/>
       <path d="M13 20h16M13 25h16M13 30h11" stroke="#9fb3c8" stroke-width="1.6"/>`,
  };

  /**
   * XP.icon('folder-about', 32) → inline <svg> string.
   * Anything with a "src:" prefix renders an <img> instead (used for photos).
   */
  XP.icon = function (name, size = 48, arg) {
    if (name && name.startsWith('src:')) {
      return `<img class="ico ico-img" src="${name.slice(4)}" width="${size}" height="${size}" alt="">`;
    }
    const draw = RAW[name] || RAW.unknown;
    return `<svg class="ico" width="${size}" height="${size}" viewBox="0 0 48 48" aria-hidden="true" focusable="false">${draw(arg)}</svg>`;
  };
  XP.hasIcon = (name) => !!RAW[name];

  /** The visitor's avatar: their photo if PROFILE.avatar is set, otherwise initials. */
  XP.avatar = function (size = 48) {
    const p = window.PROFILE || {};
    return p.avatar ? XP.icon('src:' + p.avatar, size) : XP.icon('user', size);
  };
})();
