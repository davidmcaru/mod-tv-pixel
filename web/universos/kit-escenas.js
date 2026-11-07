// kit-escenas.js — el lápiz de los escenarios: rectángulos, degradados, tramas y luz, a 320 × 180.
(function () {
  const W = 320, H = 180;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  function azar(semilla) {
    let s = semilla >>> 0;
    return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const VERDE = { tronco: "#5b3a24", copa: "#3f8f45", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" };

  function nuevo(c, semilla = 7, luz = null) {
    const rnd = azar(semilla);
    const crudo = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
    const R = luz ? (x, y, w, h, col) => crudo(x, y, w, h, luz.color(col)) : crudo;
    const P = (x, y, col) => R(x, y, 1, 1, col);
    const alfa = (a, fn) => { c.globalAlpha = a; fn(); c.globalAlpha = 1; };
    let primera = true;
    function tira(cols, y0, y1, pinta) {
      const n = cols.length, alto = (y1 - y0) / n;
      for (let y = y0; y < y1; y++) {
        const f = (y - y0) / alto, i = Math.min(n - 1, Math.floor(f)), t = f - i;
        pinta(0, y, W, 1, cols[i]);
        if (i < n - 1 && t > 0.5) for (let x = 0; x < W; x++) if (BAYER[y & 3][x & 3] / 16 < (t - 0.5) * 2) pinta(x, y, 1, 1, cols[i + 1]);
      }
    }
    function banda(cols, y0 = 0, y1 = H) {
      if (primera && luz) {
        primera = false;
        const hoy = luz.cielo(cols);
        crudo(0, y1, W, H - y1, hoy[hoy.length - 1]);
        tira(hoy, y0, y1, crudo);
        luz.sobreCielo({ crudo, W, BAYER }, y1);
        return;
      }
      if (primera) { primera = false; R(0, y1, W, H - y1, cols[cols.length - 1]); }
      tira(cols, y0, y1, R);
    }
    function estrellas(hasta, n = 90, cols = ["#ffffff", "#c8d4ff", "#8fa0d8"]) {
      if (luz && !luz.estrellasPropias) return;
      for (let k = 0; k < n; k++) crudo(Math.floor(rnd() * W), Math.floor(Math.pow(rnd(), 1.4) * hasta), 1, 1, cols[Math.floor(rnd() * cols.length)]);
    }
    function astro(cx, cy, r, col, halo) {
      if (luz && !luz.astroPropio) return;
      if (halo) for (let y = cy - r - 8; y <= cy + r + 8; y++) for (let x = cx - r - 8; x <= cx + r + 8; x++) { const d = Math.hypot(x - cx, y - cy); if (d > r && d < r + 8 && BAYER[y & 3][x & 3] < (d < r + 4 ? 7 : 3)) crudo(x, y, 1, 1, halo); }
      for (let y = -r; y <= r; y++) { const w = Math.sqrt(r * r - y * y); crudo(cx - w, cy + y, 2 * w, 1, col); }
    }
    function nube(x, y, w, luz = "#ffffff", base = "#dfe9f2") {
      R(x + 6, y, w - 16, 1, luz); R(x + 2, y + 1, w - 6, 1, luz); R(x, y + 2, w, 2, base); R(x + 4, y + 4, w - 10, 1, base); R(x + w * 0.35, y - 2, w * 0.3, 2, luz);
    }
    function cordillera(base, alto, col, luz, fase = 1, frec = 1) {
      let antes = null;
      for (let x = 0; x < W; x++) {
        const v = 0.55 + 0.25 * Math.sin(x / (23 * frec) + fase) + 0.14 * Math.sin(x / (9 * frec) + fase * 2.1) + 0.06 * Math.sin(x / (3.7 * frec) + fase * 3.3);
        const y = Math.round(base - alto * v);
        R(x, y, 1, base - y + 1, col);
        if (luz && antes !== null && y < antes) P(x, y, luz);
        antes = y;
      }
    }
    function suelo(y0, base, osc, luz, y1 = H, n = 900) {
      R(0, y0, W, y1 - y0, base);
      for (let k = 0; k < n; k++) P(Math.floor(rnd() * W), y0 + Math.floor(rnd() * (y1 - y0)), rnd() < 0.5 ? osc : luz);
    }
    function poli(pts, col) {
      const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
      for (let y = y0; y <= y1; y++) {
        const xs = [];
        for (let i = 0; i < pts.length; i++) {
          const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
          if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax));
        }
        xs.sort((a, b) => a - b);
        for (let i = 0; i + 1 < xs.length; i += 2) R(xs[i], y, xs[i + 1] - xs[i], 1, col);
      }
    }
    function elipse(cx, cy, rx, ry, col) {
      for (let y = -ry; y <= ry; y++) { const w = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))); R(cx - w, cy + y, 2 * w, 1, col); }
    }
    function linea(x0, y0, x1, y1, col, g = 1) {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1);
      for (let i = 0; i <= n; i++) R(x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n, g, g, col);
    }
    function arbol(x, base, t = 1, p = VERDE) {
      const w = Math.round(15 * t), h = Math.round(16 * t), top = base - h - 3;
      R(x + w / 2 - 2, base - 5, 4, 5, p.tronco);
      for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) {
        const nx = (xx + 0.5 - w / 2) / (w / 2), ny = (yy + 0.5 - h / 2) / (h / 2), d = (nx * nx) / (ny > 0 ? 1 : 0.82) + ny * ny;
        if (d > 1) continue;
        P(x + xx, top + yy, d > 0.74 ? p.borde : nx + ny * 1.2 < -0.62 ? p.luz : nx + ny > 0.55 ? p.osc : p.copa);
      }
    }
    function cumulo(cx, cy, r, p = VERDE) {
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        const d = Math.hypot(x, y) + (BAYER[(Math.round(y) + 64) & 3][(Math.round(x) + 64) & 3] / 16 - 0.5) * 1.6;
        if (d > r) continue;
        const l = (x + y * 1.2) / r;
        P(cx + x, cy + y, d > r - 1.4 ? p.borde : l < -0.7 ? p.luz : l > 0.62 ? p.osc : p.copa);
      }
    }
    function arbolote(x, base, t = 2, p = VERDE) {
      const h = Math.round(13 * t), g = Math.max(3, Math.round(2.4 * t)), r = Math.round(5.5 * t), oscuro = p.troncoOsc || "#3f2818";
      R(x - g / 2, base - h, g, h, p.tronco); R(x + g / 2 - 1, base - h, 1, h, oscuro);
      linea(x, base - h * 0.55, x - 6 * t, base - h - 1, p.tronco, Math.max(1, Math.round(t / 1.4)));
      linea(x, base - h * 0.65, x + 6 * t, base - h - 2, p.tronco, Math.max(1, Math.round(t / 1.4)));
      [[-1.25, 0.05, 0.8], [1.25, 0, 0.85], [-0.65, -0.65, 1], [0.7, -0.7, 1], [0, 0.1, 1.05], [0, -1.15, 0.8]]
        .forEach(([dx, dy, e]) => cumulo(x + dx * r, base - h - r * 0.2 + dy * r, Math.round(r * e), p));
    }
    function pino(x, base, h, p = { tronco: "#3a2a20", copa: "#23503a", luz: "#2f6a48", osc: "#183a2a" }) {
      R(x - 1, base - 5, 3, 5, p.tronco);
      for (let i = 0; i < h; i++) {
        const w = 1 + ((i % Math.ceil(h / 3)) + i / 3) * 0.9;
        R(x - w, base - h - 3 + i, 2 * w + 1, 1, i % 3 === 0 ? p.luz : p.copa);
        P(x + w, base - h - 3 + i, p.osc);
      }
    }
    function palmera(x, base, h, tronco = "#8a6a3f", hoja = "#3f9a4a", luz = "#6cc060") {
      for (let i = 0; i < h; i++) R(x + Math.sin(i / 7) * 3, base - i, 3, 1, i % 4 ? tronco : "#6d5230");
      const tx = x + Math.sin(h / 7) * 3 + 1, ty = base - h;
      [[-16, 5], [-12, -3], [-5, -7], [6, -7], [13, -3], [17, 5]].forEach(([dx, dy], i) => { linea(tx, ty, tx + dx, ty + dy, i % 2 ? luz : hoja, 2); linea(tx + dx * 0.6, ty + dy * 0.6 + 2, tx + dx, ty + dy + 4, hoja); });
    }
    function casaJ(x, base, w, h, o = {}) {
      const { pared = "#e8dcc0", sombra = "#c4b598", techo = "#b5432f", osc = "#8a2f22", ven = "#55697c", puerta = "#6b4a30" } = o, top = base - h;
      R(x, top, w, h, pared); R(x + w - 2, top, 2, h, sombra);
      for (let vx = x + 3; vx < x + w - 5; vx += 8) R(vx, top + 3, 4, 4, ven);
      R(x + w / 2 - 2, base - 7, 4, 7, puerta);
      const alto = Math.round(w * 0.2) + 3;
      poli([[x - 4, top], [x + w + 4, top], [x + w - 2, top - alto], [x + 2, top - alto]], techo);
      R(x - 4, top, w + 8, 2, osc); R(x + 2, top - alto - 1, w - 4, 1, osc);
    }
    function casa(x, base, w, h, o = {}) {
      const { pared = "#d8c8a8", sombra = "#b5a483", techo = "#7a4a3a", osc = "#5a3428", ven = "#f2d27a", puerta = "#4a3020" } = o, top = base - h;
      R(x, top, w, h, pared); R(x + w - 2, top, 2, h, sombra);
      const alto = Math.round(w * 0.42);
      poli([[x - 2, top], [x + w + 2, top], [x + w / 2, top - alto]], techo);
      poli([[x + w / 2, top - alto], [x + w + 2, top], [x + w - 3, top]], osc);
      R(x + w / 2 - 2, base - 8, 5, 8, puerta);
      const v = h > 30 ? 9 : 5, vy = h > 30 ? top + 9 : top + 3;
      [x + 3, x + w - 3 - v].forEach((vx) => R(vx, vy, v, v, ven));
    }
    function torre(x, base, w, h, o = {}) {
      const { pared = "#6a6d80", sombra = "#4d4f60", techo = "#39406a", osc = "#272c4c", luz = null, alto = w * 1.5 } = o, top = base - h;
      R(x, top, w, h, pared); R(x + w - Math.max(2, w / 4), top, Math.max(2, w / 4), h, sombra);
      poli([[x - 2, top], [x + w + 2, top], [x + w / 2, top - alto]], techo);
      poli([[x + w / 2, top], [x + w + 2, top], [x + w / 2, top - alto]], osc);
      if (luz) for (let y = top + 5; y < base - 6; y += 11) R(x + w / 2 - 1, y, 2, 4, luz);
    }
    function agua(y0, y1, cols, brillo, n = 170) {
      primera = false;
      banda(cols, y0, y1);
      for (let k = 0; k < n; k++) R(Math.floor(rnd() * W), y0 + Math.floor(rnd() * (y1 - y0)), 3 + rnd() * 9, 1, brillo);
    }
    function roca(x, base, w, h, col = "#7d7468", luz = "#a39888", osc = "#57504a") {
      poli([[x, base], [x + w * 0.18, base - h * 0.7], [x + w * 0.45, base - h], [x + w * 0.8, base - h * 0.72], [x + w, base]], col);
      poli([[x + w * 0.18, base - h * 0.7], [x + w * 0.45, base - h], [x + w * 0.42, base - h * 0.55]], luz);
      poli([[x + w * 0.62, base], [x + w * 0.8, base - h * 0.72], [x + w, base]], osc);
    }
    function hierbas(y0, y1, n, cols = ["#2f7a3a", "#74c060"]) {
      for (let k = 0; k < n; k++) { const x = Math.floor(rnd() * W), y = y0 + Math.floor(rnd() * (y1 - y0)), col = cols[k % cols.length]; P(x, y, col); P(x + 1, y - 1, col); P(x + 2, y, col); }
    }
    function farol(x, y, col = "#ffcf6a", palo = "#3a2a20", alto = 16) {
      R(x, y, 1, alto, palo); R(x - 2, y - 4, 5, 5, col); R(x - 3, y - 5, 7, 1, palo);
      alfa(0.2, () => elipse(x, y - 2, 10, 10, col));
    }
    function niebla(y0, y1, col, a = 0.28) {
      alfa(a, () => { for (let k = 0; k < 16; k++) elipse(rnd() * W, y0 + rnd() * (y1 - y0), 30 + rnd() * 40, 4 + rnd() * 5, col); });
    }
    function halo(cx, cy, rx, ry, col, f = 0.5) {
      for (let y = Math.floor(cy - ry); y <= cy + ry; y++) for (let x = Math.floor(cx - rx); x <= cx + rx; x++) {
        const d = Math.hypot((x - cx) / rx, (y - cy) / ry);
        if (d < 1 && BAYER[(y + 64) & 3][(x + 64) & 3] / 16 < (1 - d) * f) P(x, y, col);
      }
    }
    const actores = [];
    function llama(x, y, e = 1) {
      const h = luz ? luz.hr : 0, s = luz ? Math.sin(h * 2.3 + x * 0.7) : 0, a = luz ? 1 + 0.2 * Math.cos(h * 1.7 + x * 0.4) : 1, b = s * 2.4 * e, A = e * a;
      poli([[x - 9 * e, y], [x - 5 * e + b * 0.4, y - 12 * A], [x - 2 * e + b * 0.5, y - 7 * A], [x + 1 * e + b, y - 20 * A], [x + 5 * e + b * 0.5, y - 9 * A], [x + 9 * e, y]], "#e8502a");
      poli([[x - 5 * e, y], [x - 2 * e + b * 0.4, y - 8 * A], [x + 1 * e + b * 0.7, y - 12 * A], [x + 5 * e, y]], "#ff9a3a");
      poli([[x - 2 * e, y], [x + 1 * e + b * 0.4, y - 6 * A], [x + 3 * e, y]], "#ffe06a");
      actores.push({ tipo: "llama", x, y, e });
    }
    return { conLuz: !!luz, luz, crudo, actores, W, H, R, P, alfa, halo, llama, rnd, banda, estrellas, astro, nube, cordillera, suelo, poli, elipse, linea, arbol, cumulo, arbolote, pino, palmera, casaJ, casa, torre, agua, roca, hierbas, farol, niebla };
  }
  window.Kit = { nuevo, VERDE };
})();
