/* Tiny synthesized sound effects (Web Audio). No audio files, nothing copyrighted. */
(function () {
  const XP = (window.XP = window.XP || {});
  let ctx = null;
  let master = null;
  let bus = null;
  let muted = false;
  try {
    muted = localStorage.getItem('xp:muted') === '1';
  } catch (e) {}

  function audio() {
    // Browsers block audio until the visitor interacts; don't even try before that (e.g. deep links).
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.55;
      master.connect(ctx.destination);
      // One shared echo bus gives everything a bit of "room".
      bus = ctx.createGain();
      const delay = ctx.createDelay();
      const feedback = ctx.createGain();
      const wet = ctx.createGain();
      delay.delayTime.value = 0.19;
      feedback.gain.value = 0.3;
      wet.gain.value = 0.32;
      bus.connect(master);
      bus.connect(delay);
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wet);
      wet.connect(master);
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

  function tone(c, { f, t = 0, d = 0.3, type = 'sine', g = 0.2, a = 0.01, out = master, detune = 0, slide }) {
    const o = c.createOscillator();
    const v = c.createGain();
    const at = c.currentTime + t;
    o.type = type;
    o.frequency.setValueAtTime(f, at);
    if (slide) o.frequency.exponentialRampToValueAtTime(slide, at + d);
    o.detune.value = detune;
    v.gain.setValueAtTime(0.0001, at);
    v.gain.exponentialRampToValueAtTime(g, at + a);
    v.gain.exponentialRampToValueAtTime(0.0001, at + d);
    o.connect(v);
    v.connect(out);
    o.start(at);
    o.stop(at + d + 0.05);
  }

  function noise(c, { t = 0, d = 1, from = 400, to = 4000, g = 0.2, q = 0.9 }) {
    const len = Math.ceil(c.sampleRate * d);
    const buf = c.createBuffer(1, len, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = c.createBufferSource();
    const bp = c.createBiquadFilter();
    const v = c.createGain();
    const at = c.currentTime + t;
    src.buffer = buf;
    bp.type = 'bandpass';
    bp.Q.value = q;
    bp.frequency.setValueAtTime(from, at);
    bp.frequency.exponentialRampToValueAtTime(to, at + d);
    v.gain.setValueAtTime(0.0001, at);
    v.gain.exponentialRampToValueAtTime(g, at + d * 0.4);
    v.gain.exponentialRampToValueAtTime(0.0001, at + d);
    src.connect(bp);
    bp.connect(v);
    v.connect(master);
    src.start(at);
    src.stop(at + d);
  }

  const SOUNDS = {
    startup(c) {
      [[63, 0], [70, 0.16], [75, 0.32], [79, 0.5], [82, 0.86]].forEach(([m, t], i) => {
        tone(c, { f: midi(m), t, d: 2.3 - i * 0.12, type: 'triangle', g: 0.11, a: 0.04, out: bus });
        tone(c, { f: midi(m), t, d: 2, g: 0.07, a: 0.06, out: bus, detune: 8 });
      });
      tone(c, { f: midi(51), d: 2.8, g: 0.12, a: 0.35, out: bus });
    },
    shutdown(c) {
      [[82, 0], [79, 0.18], [75, 0.36], [70, 0.54], [63, 0.8]].forEach(([m, t]) =>
        tone(c, { f: midi(m), t, d: 1.6, type: 'triangle', g: 0.1, a: 0.03, out: bus })
      );
    },
    ding(c) {
      tone(c, { f: midi(84), d: 0.7, g: 0.16, out: bus });
      tone(c, { f: midi(96), d: 0.4, g: 0.04, out: bus });
    },
    error(c) {
      tone(c, { f: midi(69), d: 0.3, type: 'square', g: 0.045 });
      tone(c, { f: midi(62), t: 0.13, d: 0.42, type: 'square', g: 0.045 });
    },
    notify(c) {
      tone(c, { f: midi(81), d: 0.25, g: 0.12, out: bus });
      tone(c, { f: midi(88), t: 0.12, d: 0.55, g: 0.12, out: bus });
    },
    open(c) {
      tone(c, { f: 520, d: 0.12, g: 0.05, slide: 900, out: bus });
    },
    close(c) {
      tone(c, { f: 700, d: 0.12, g: 0.04, slide: 380, out: bus });
    },
    whoosh(c) {
      noise(c, { d: 1.5, from: 260, to: 5200, g: 0.28 });
      tone(c, { f: 140, d: 1.4, type: 'sawtooth', g: 0.035, slide: 38 });
      tone(c, { f: 62, t: 0.95, d: 1.3, g: 0.32, slide: 30 });
    },
    unwhoosh(c) {
      noise(c, { d: 1.1, from: 5200, to: 260, g: 0.22 });
      tone(c, { f: 38, d: 1.1, type: 'sawtooth', g: 0.03, slide: 160 });
    },
    key(c) {
      tone(c, { f: 2200 + Math.random() * 700, d: 0.02, type: 'square', g: 0.008 });
    },
  };

  XP.sound = {
    play(name) {
      if (muted || !SOUNDS[name]) return;
      const c = audio();
      if (!c) return;
      try {
        SOUNDS[name](c);
      } catch (e) {}
    },
    get muted() {
      return muted;
    },
    toggle() {
      muted = !muted;
      try {
        localStorage.setItem('xp:muted', muted ? '1' : '0');
      } catch (e) {}
      return muted;
    },
  };
})();
