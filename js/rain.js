/* Matrix digital rain on a <canvas>, drawn in three depth layers for a parallax / 3D feel. */
(function () {
  const XP = (window.XP = window.XP || {});

  const GLYPHS = 'ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ012345789Z:・."=*+-<>¦|';
  const FONT = '"MS Gothic", "Hiragino Kaku Gothic Pro", "Noto Sans Mono CJK JP", "Noto Sans JP", "Share Tech Mono", monospace';

  const COLORS = {
    green: [0, 255, 102],
    red: [255, 50, 70],
    blue: [60, 170, 255],
    purple: [190, 100, 255],
    gold: [255, 200, 50],
    cyan: [0, 255, 230],
    pink: [255, 90, 200],
    white: [225, 240, 232],
  };

  const DEFAULT_LAYERS = [
    { size: 11, speed: 0.55, alpha: 0.35, share: 1 }, // far away, small and dim
    { size: 16, speed: 0.8, alpha: 0.7, share: 0.55 },
    { size: 24, speed: 1, alpha: 1, share: 0.22, glow: true }, // close to the camera
  ];

  class MatrixRain {
    constructor(canvas, opts = {}) {
      this.canvas = canvas;
      this.ctx = canvas.getContext('2d');
      this.opts = Object.assign({ layers: DEFAULT_LAYERS, fps: 30, fade: 0.085 }, opts);
      this.rgb = COLORS.green;
      this.running = false;
      this.last = 0;
      this.frame = this.frame.bind(this);
      this.resize = this.resize.bind(this);
      this.onVisibility = () => {
        if (document.hidden) cancelAnimationFrame(this.raf);
        else if (this.running) this.raf = requestAnimationFrame(this.frame);
      };
    }

    static colors() {
      return Object.keys(COLORS);
    }

    setColor(name) {
      if (!COLORS[name]) return null;
      this.rgb = COLORS[name];
      return this.rgb;
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = this.canvas.clientWidth || window.innerWidth;
      const h = this.canvas.clientHeight || window.innerHeight;
      this.w = w;
      this.h = h;
      this.canvas.width = Math.round(w * dpr);
      this.canvas.height = Math.round(h * dpr);
      this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      this.ctx.fillStyle = '#000';
      this.ctx.fillRect(0, 0, w, h);
      this.layers = this.opts.layers.map((L) => {
        const count = Math.ceil(w / L.size);
        const rows = Math.ceil(h / L.size);
        const cols = [];
        for (let i = 0; i < count; i++) {
          if (Math.random() > L.share) continue;
          cols.push({
            x: i * L.size,
            row: -Math.floor(Math.random() * rows * 1.5),
            speed: L.speed * (0.55 + Math.random() * 0.75),
            acc: 0,
            prev: null,
          });
        }
        return { ...L, rows, cols };
      });
    }

    start() {
      if (this.running) return;
      this.running = true;
      this.resize();
      window.addEventListener('resize', this.resize);
      document.addEventListener('visibilitychange', this.onVisibility);
      this.raf = requestAnimationFrame(this.frame);
    }

    stop() {
      this.running = false;
      cancelAnimationFrame(this.raf);
      window.removeEventListener('resize', this.resize);
      document.removeEventListener('visibilitychange', this.onVisibility);
    }

    frame(t) {
      if (!this.running) return;
      this.raf = requestAnimationFrame(this.frame);
      if (t - this.last < 1000 / this.opts.fps) return;
      this.last = t;

      const ctx = this.ctx;
      const [r, g, b] = this.rgb;
      ctx.shadowBlur = 0;
      ctx.fillStyle = `rgba(0,0,0,${this.opts.fade})`;
      ctx.fillRect(0, 0, this.w, this.h);
      ctx.textBaseline = 'top';

      for (const L of this.layers) {
        ctx.font = `${L.size}px ${FONT}`;
        const body = `rgba(${r},${g},${b},${L.alpha})`;
        const head = `rgba(${(r + 255 * 2) / 3 | 0},${(g + 255 * 2) / 3 | 0},${(b + 255 * 2) / 3 | 0},${Math.min(1, L.alpha + 0.2)})`;
        for (const col of L.cols) {
          col.acc += col.speed;
          if (col.acc < 1) continue;
          col.acc -= 1;
          col.row += 1;
          if (col.row < 0) continue;

          // Re-colour the previous head so only the newest glyph is bright.
          if (col.prev) {
            const py = (col.row - 1) * L.size;
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000';
            ctx.fillRect(col.x, py, L.size, L.size);
            ctx.fillStyle = body;
            ctx.fillText(col.prev, col.x, py);
          }
          const ch = GLYPHS[(Math.random() * GLYPHS.length) | 0];
          if (L.glow) {
            ctx.shadowColor = `rgb(${r},${g},${b})`;
            ctx.shadowBlur = 10;
          }
          ctx.fillStyle = head;
          ctx.fillText(ch, col.x, col.row * L.size);
          col.prev = ch;

          if (col.row > L.rows && Math.random() > 0.96) {
            col.row = -Math.floor(Math.random() * 12);
            col.prev = null;
          }
        }
      }
    }
  }

  XP.MatrixRain = MatrixRain;
})();
