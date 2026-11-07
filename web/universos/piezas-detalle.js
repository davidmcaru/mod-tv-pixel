// piezas-detalle.js — las piezas con detalle que comparten los escenarios: montañas, casas, nubes, agua, letreros…
(function () {
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  const W = 320, H = 180;
  const trama = (x, y) => BAYER[(Math.round(y) + 64) & 3][(Math.round(x) + 64) & 3] / 16;
  const rampa = (cols, v, x, y) => { const f = Math.max(0, Math.min(0.999, v)) * (cols.length - 1), i = Math.floor(f), u = (f - i - 0.32) / 0.36; return u > trama(x, y) ? cols[i + 1] : cols[i]; };

  function rellena(k, pts, color) {
    const ys = pts.map((p) => p[1]), y0 = Math.floor(Math.min(...ys)), y1 = Math.ceil(Math.max(...ys));
    for (let y = y0; y <= y1; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) for (let x = Math.round(xs[i]); x < Math.round(xs[i + 1]); x++) { const c = color(x, y); if (c) k.P(x, y, c); }
    }
  }
  function bola(k, cx, cy, rx, ry, color) {
    for (let y = Math.round(cy - ry); y <= cy + ry; y++) { const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) * (y - cy)) / (ry * ry))); for (let x = Math.round(cx - w); x <= cx + w; x++) k.P(x, y, color(x, y)); }
  }
  const esfera = (k, cx, cy, rx, ry, cols, f = 0) => bola(k, cx, cy, rx, ry, (x, y) => rampa(cols, 0.42 + f + (((x - cx) / rx) * 0.5 + ((y - cy) / ry) * 0.62) * 0.62, x, y));
  function cilindro(k, x, y, w, h, cols, luz = 0.3) { for (let px = x; px < x + w; px++) { const t = (px - x) / Math.max(1, w - 1); for (let py = y; py < y + h; py++) k.P(px, py, rampa(cols, Math.abs(t - luz) * 1.28, px, py)); } }

  function andar(k, x, y, w, h) {
    const hr = k.luz.hr, v = 5 + (Math.round(y) % 4), ciclo = W + w + 2 * h + 24;
    let nx = ((x + h + 12 + hr * v) % ciclo + ciclo) % ciclo - h - 12;
    const s = k.luz.luna ? { x: k.luz.luna[0], y: k.luz.luna[1], r: k.luz.luna[2] } : (() => { const o = Horas.sol(k.luz.h); return { x: o.x + (k.luz.dx || 0), y: o.y, r: o.r }; })();
    if (nx - h < s.x + s.r + 3 && nx + w + h > s.x - s.r - 3 && y - h < s.y + s.r + 3 && y + h > s.y - s.r - 3) nx = s.x + s.r + h + 4;
    return nx;
  }
  function nubarron(k, x, y, w, h, cols = ["#ffffff", "#e4edf6", "#bfcfe2"]) {
    if (k.luz && y < 100) x = andar(k, x, y, w, h);
    const n = Math.max(3, Math.round(w / (h * 0.75))), bolas = [];
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = h * (0.42 + 0.58 * Math.sin(t * Math.PI)) * (0.8 + k.rnd() * 0.3); bolas.push([x + t * w, y + h - r * 0.75, r]); }
    for (let py = y - h; py <= y + h; py++) for (let px = x - h; px <= x + w + h; px++) {
      let mejor = null, hondo = 0;
      bolas.forEach((b) => { const d = b[2] - Math.hypot(px - b[0], py - b[1]); if (d > hondo) { hondo = d; mejor = b; } });
      if (!mejor) continue;
      const [cx, cy, r] = mejor, l = ((px - cx) + (py - cy) * 1.5) / r;
      k.P(px, py, rampa(cols, 0.28 + l * 0.32 + ((py - y) / h) * 0.34, px, py));
    }
  }
  function cirros(k, n, y0, y1, col = "#f4f8fc") { k.alfa(0.55, () => { for (let i = 0; i < n; i++) { const x = k.rnd() * W, y = y0 + k.rnd() * (y1 - y0), w = 18 + k.rnd() * 40; k.R(x, y, w, 1, col); k.R(x + w * 0.2, y + 1, w * 0.5, 1, col); } }); }

  function reflejo(k, y0, y1) {
    if (!k.luz) return;
    const s = Horas.sol(k.luz.h), P = Horas.paleta(k.luz.h), col = P.astro, x0 = s.x + (k.luz.dx || 0);
    for (let y = y0; y < y1; y += 2) { const t = (y - y0) / Math.max(1, y1 - y0), a = 6 + t * 26, n = 2 + Math.floor(t * 3); for (let i = 0; i < n; i++) { const w = 3 + k.rnd() * (6 + t * 12); k.crudo(x0 - a + k.rnd() * 2 * a - w / 2, y, w, 1, col); } }
  }
  function espuma(k, y, x0 = 0, x1 = W, col = "#ffffff") { for (let x = x0; x < x1; x++) { const o = Math.round(Math.sin(x / 6) * 1.5 + Math.sin(x / 2.3) * 0.7); k.P(x, y + o, col); if (Math.sin(x / 3.1) > 0.3) k.P(x, y + o + 1, col); } }
  function oleaje(k, y0, y1, col, n = 60) { for (let i = 0; i < n; i++) { const t = k.rnd(), y = y0 + t * (y1 - y0), w = 4 + t * 16, x = k.rnd() * W; k.R(x, y, w, 1, col); k.R(x + 1 + t * 2, y - 1, w * 0.4, 1, col); } }

  function montana(k, cx, base, w, h, { roca, nieve = null, hasta = 0.26, rugosa = 1 }) {
    const f1 = k.rnd() * 6, f2 = k.rnd() * 6, top = base - h;
    for (let y = top; y <= base; y++) {
      const t = (y - top) / h, a = (w / 2) * Math.pow(t, 0.92), l = cx - a * (1 + 0.1 * Math.sin(y / 5 + f1) * rugosa), r = cx + a * (1 + 0.1 * Math.sin(y / 4 + f2) * rugosa), cresta = cx + Math.sin(y / 9 + f1) * 5 * t;
      for (let x = Math.round(l); x <= r; x++) {
        const v = x < cresta ? 0.16 + ((cresta - x) / (a + 1)) * 0.14 : 0.52 + ((x - cresta) / (a + 1)) * 0.44, surco = Math.sin(x / 3.3 + y / 1.9 + f2) > 0.82 ? 0.16 : 0;
        k.P(x, y, rampa(roca, v + surco, x, y));
        if (nieve && t < hasta + Math.sin(x / 2.5 + f1) * 0.05) k.P(x, y, x < cresta ? nieve[0] : nieve[1]);
      }
    }
  }
  function loma(k, pts, y1, cols, fx = 0.5) {
    const perfil = (x) => { for (let i = 0; i + 1 < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; if (x >= ax && x <= bx) { const t = (x - ax) / (bx - ax), s = t * t * (3 - 2 * t); return ay + (by - ay) * s; } } return null; };
    const x0 = Math.max(0, pts[0][0]), x1 = Math.min(W - 1, pts[pts.length - 1][0]);
    for (let x = x0; x <= x1; x++) {
      const top = perfil(x), sig = perfil(x + 6);
      if (top === null) continue;
      const cara = sig === null ? 0 : Math.max(0, Math.min(1, 0.5 - ((sig - top) / 6) * 4));
      for (let y = Math.round(top); y <= y1; y++) k.P(x, y, rampa(cols, ((y - top) / (y1 - top + 1)) * 0.46 + 0.06 + cara * fx * 0.6, x, y));
    }
  }
  const estratos = (cols) => (x, y) => rampa(cols, 0.34 + 0.3 * Math.sin(y / 3.4 + Math.sin(x / 19) * 2.2) + (Math.sin(x / 6.3 + y / 11) > 0.72 ? 0.3 : 0), x, y);
  function pena(k, x, base, w, h, cols) {
    const c = x + w * 0.42, pts = [[x, base], [x + w * 0.1, base - h * 0.55], [x + w * 0.3, base - h * 0.9], [c, base - h], [x + w * 0.7, base - h * 0.78], [x + w * 0.92, base - h * 0.45], [x + w, base]];
    rellena(k, pts, (px, py) => rampa(cols, px < c + (base - py) * -0.12 ? 0.12 + (Math.sin(px / 2 + py) > 0.8 ? 0.2 : 0) : 0.62 + ((px - c) / w) * 0.5, px, py));
  }
  const grano = (k, y0, base, osc, luz, y1 = H, n = 700) => k.suelo(y0, base, osc, luz, y1, n);
  function adoquines(k, y0, y1, base, junta, luz) {
    k.R(0, y0, W, y1 - y0, base);
    for (let y = y0, f = 0, alto = 2; y < y1; y += alto, f++, alto = Math.min(6, alto + 0.5)) {
      const h = Math.round(alto), w = 5 + h * 2;
      k.R(0, y, W, 1, junta);
      for (let x = (f % 2) * Math.round(w / 2) - w; x < W; x += w) { k.R(x, y, 1, h, junta); if (k.rnd() < 0.3) k.R(x + 1, y + 1, w - 2, Math.max(1, h - 2), luz); }
    }
  }
  function cubierta(k, y0, y1, cols, fx = 160, n = 15) {
    const [base, junta, luz, clavo] = cols;
    for (let y = y0; y < y1; y++) k.R(0, y, W, 1, base);
    const dy = y1 - y0, alto = dy * 0.9;
    for (let i = -n; i <= n; i++) for (let y = y0; y < y1; y++) { const t = (y - y0 + alto * 0.4) / (dy + alto * 0.4), x = fx + (i * 34 + 9) * t * 1.15; k.P(x, y, junta); if (i % 3 === 0) k.P(x + 2, y, luz); }
    for (let y = y0 + 6, f = 0; y < y1; y += 6 + f * 2, f++) for (let x = (f % 2) * 22; x < W; x += 44 + f * 6) { k.R(x, y, 16 + f * 3, 1, junta); k.P(x + 2, y + 1, clavo || junta); }
  }
  function camino(k, y0, y1, cx, a, borde, dentro, marca = null) {
    for (let y = y0; y < y1; y++) { const f = (y - y0) / (y1 - y0), c = cx(f), w = a(f); k.R(c - w, y, 2 * w, 1, borde); k.R(c - w + 1 + f * 2, y, 2 * w - 2 - f * 4, 1, dentro); if (marca) { if (y % 5 === 0) k.R(c - w * 0.4, y, 2 + f * 2, 1, marca); if (y % 7 === 2) k.R(c + w * 0.3, y, 2 + f * 2, 1, marca); } }
  }
  function matas(k, y0, y1, n, cols = ["#2f7a3a", "#4f9a4a", "#74c060"]) {
    for (let i = 0; i < n; i++) { const x = k.rnd() * W, y = y0 + k.rnd() * (y1 - y0), e = 1 + ((y - y0) / (y1 - y0)) * 2; for (let b = -2; b <= 2; b++) k.linea(x + b, y, x + b * 2, y - (3 + (2 - Math.abs(b)) * 1.3) * e, cols[(i + b + 5) % cols.length]); }
  }
  function flores(k, y0, y1, n, cols) { for (let i = 0; i < n; i++) { const x = k.rnd() * W, y = y0 + k.rnd() * (y1 - y0), c = cols[i % cols.length]; k.P(x, y, c); k.P(x + 1, y, c); k.P(x, y + 1, c); k.P(x + 1, y + 1, "#ffe9a8"); } }
  function helecho(k, x, y, h, col = "#3f8a4a", osc = "#2a6a35") { [[-1, 0.8], [-0.6, 1], [-0.25, 1.1], [0.25, 1.1], [0.6, 1], [1, 0.8]].forEach(([d, l], i) => { const px = x + d * h * 0.9, py = y - l * h; for (let t = 0; t < 1; t += 0.04) { const qx = x + (px - x) * t, qy = y + (py - y) * t + t * t * h * 0.42, g = Math.sin(t * Math.PI) * 2.5 + 0.5; k.R(qx - g / 2, qy, g, 1, i % 2 ? col : osc); } }); }

  function sillares(k, x, y, w, h, { base, luz, osc }, ah = 5, an = 11) {
    k.R(x, y, w, h, base);
    for (let f = 0, yy = y; yy < y + h; yy += ah, f++) {
      k.R(x, yy, w, 1, osc);
      for (let xx = x + (f % 2 ? Math.round(an / 2) - an : 0); xx < x + w; xx += an) { if (xx >= x) k.R(xx, yy, 1, Math.min(ah, y + h - yy), osc); if (k.rnd() < 0.22) { const a = Math.max(xx + 1, x), b = Math.min(xx + an, x + w); if (b > a) k.R(a, yy + 1, b - a, Math.min(ah - 1, y + h - yy - 1), luz); } }
    }
  }
  const ladrillos = (k, x, y, w, h, base, junta, claro) => sillares(k, x, y, w, h, { base, luz: claro, osc: junta }, 3, 6);
  function tablas(k, x, y, w, h, base, junta, luz, paso = 5, vertical = false) {
    k.R(x, y, w, h, base);
    if (vertical) for (let xx = x; xx < x + w; xx += paso) { k.R(xx, y, 1, h, junta); if (k.rnd() < 0.4) k.R(xx + 2, y + k.rnd() * h * 0.6, 1, 3 + k.rnd() * 7, luz); }
    else for (let yy = y; yy < y + h; yy += paso) { k.R(x, yy, w, 1, junta); if (k.rnd() < 0.5) k.R(x + k.rnd() * w * 0.7, yy + 2, 4 + k.rnd() * 10, 1, luz); }
  }
  function ventanaArco(k, x, y, w, h, marco, vidrio) { k.elipse(x + w / 2, y + w / 2, w / 2 + 1, w / 2 + 1, marco); k.R(x - 1, y + w / 2, w + 2, h - w / 2 + 1, marco); k.elipse(x + w / 2, y + w / 2, w / 2, w / 2, vidrio); k.R(x, y + w / 2, w, h - w / 2, vidrio); k.R(x + w / 2, y + 1, 1, h - 1, marco); }
  function torreta(k, x, base, w, h, alto, { piedra, techo, nieve = null, ventanas = "#ffd27a", paso = 9 }) {
    cilindro(k, x, base - h, w, h, piedra);
    if (ventanas) for (let y = base - h + 5; y < base - 4; y += paso) { k.R(x + w / 2 - 1, y, 2, 3, ventanas); k.R(x + w / 2 - 1, y - 1, 2, 1, piedra[piedra.length - 1]); }
    k.R(x - 1, base - h, w + 2, 2, piedra[piedra.length - 1]);
    const c = x + w / 2;
    for (let i = 0; i < alto; i++) { const a = ((alto - i) / alto) * (w / 2 + 2), y = base - h - 1 - i; for (let px = Math.round(c - a); px <= c + a; px++) k.P(px, y, rampa(techo, (px - c + a) / (2 * a + 0.01), px, y)); }
    if (nieve) { k.poli([[c - 2, base - h - alto * 0.5], [c, base - h - alto], [c + 2, base - h - alto * 0.5]], nieve); k.R(x - 2, base - h - 1, w + 4, 1, nieve); }
  }
  const almenas = (k, x, y, w, col, paso = 6, ancho = 4, alto = 3) => { for (let px = x; px < x + w; px += paso) k.R(px, y - alto, ancho, alto, col); };

  function casaTorcida(k, x, base, w, h, { pared = "#f2e6c8", luz = "#fbf3de", osc = "#d4c0a0", techo = "#d8703a", techoLuz = "#ee8d52", techoOsc = "#a84e24", marco = "#7a5230", redonda = true, ventana = true, chimenea = false, toldo = null, curva = 2, sombra = "#a8926a", plano = false, puerta = true } = {}) {
    const lado = (t) => Math.sin(t * Math.PI) * 1.5, top = base - h;
    for (let y = top; y < base; y++) { const t = (y - top) / h, d = lado(t), x0 = x - d, x1 = x + w + d; k.R(x0, y, x1 - x0, 1, pared); k.R(x0, y, 2, 1, luz); k.R(x1 - 3, y, 3, 1, osc); }
    k.R(x - 1, top, w + 2, 2, osc);
    const pm = x + w / 2, a = Math.round(w * 0.42) + 3;
    if (plano) { k.R(x - 2, top - 2, w + 4, 3, techo); k.R(x - 2, top - 3, w + 4, 1, techoLuz); k.R(x - 2, top + 1, w + 4, 1, techoOsc); } else {
      if (chimenea) { k.R(x + w * 0.72, top - a - 2, 5, a, marco); k.R(x + w * 0.72 - 1, top - a - 3, 7, 2, osc); }
      k.poli([[x - 4, top + 1], [x + w + 4, top + 1], [x + w * 0.86, top - a * 0.56], [pm + curva, top - a - 2], [x + w * 0.14, top - a * 0.5 + curva]], techo);
      k.poli([[pm + 1, top + 1], [x + w + 4, top + 1], [x + w * 0.86, top - a * 0.56], [pm + curva, top - a - 2]], techoOsc);
      k.poli([[x - 4, top + 1], [x + 1, top + 1], [pm - 2, top - a + 1], [x + w * 0.14, top - a * 0.5 + curva]], techoLuz);
      for (let f = 3; f < a - 2; f += 4) for (let tx = x - 2 + (f % 8); tx < x + w + 2; tx += 7) if (Math.abs(tx - pm) < (w / 2 + 3) * (1 - f / a)) k.R(tx, top - f + 1, 3, 1, techoOsc);
      k.R(x - 5, top + 1, w + 10, 1, techoOsc);
    }
    const px = x + (w > 30 ? w * 0.62 : w * 0.5) - 3;
    if (puerta) { k.elipse(px + 3, base - 9, 3, 3, marco); k.R(px, base - 9, 7, 9, marco); k.elipse(px + 3, base - 9, 2, 2, "#4a3020"); k.R(px + 1, base - 9, 5, 9, "#4a3020"); k.P(px + 5, base - 4, "#e8c35a"); k.R(px - 1, base - 1, 9, 2, "#b8a890"); }
    const vy = top + 8;
    if (ventana && redonda) { k.elipse(x + w * 0.27, vy, 4, 4, marco); k.elipse(x + w * 0.27, vy, 3, 3, "#ffd27a"); k.R(x + w * 0.27, vy - 3, 1, 7, marco); k.R(x + w * 0.27 - 3, vy, 7, 1, marco); }
    else if (ventana) { k.R(x + 4, vy - 3, 8, 8, marco); k.R(x + 5, vy - 2, 6, 6, "#ffd27a"); k.R(x + 8, vy - 2, 1, 6, marco); k.R(x + 3, vy + 5, 10, 1, osc); }
    if (toldo) { for (let tx = 0; tx < w - 4; tx += 4) k.R(x + 2 + tx, base - 15, 4, 3, tx % 8 ? "#f4efe0" : toldo); k.R(x + 2, base - 12, w - 4, 1, osc); }
    k.alfa(0.5, () => k.R(x - 2, base + 1, w + 6, 2, sombra));
  }
  function casaNieve(k, x, base, w, h, humo = true) {
    const pared = "#a8805a", osc = "#7d5a3c", luz = "#c49c70", n = ["#f8fbfe", "#d9e4f0"];
    k.R(x, base - h, w, h, pared); k.R(x, base - h, 2, h, luz); k.R(x + w - 3, base - h, 3, h, osc);
    for (let y = base - h + 3; y < base; y += 4) k.R(x, y, w, 1, osc);
    k.R(x + w / 2 - 3, base - 8, 6, 8, "#4a3020"); k.R(x + w / 2 - 3, base - 9, 6, 1, "#6b4a30"); k.P(x + w / 2 + 1, base - 4, "#e8c35a");
    [x + 3, x + w - 8].forEach((vx) => { k.R(vx - 1, base - h + 5, 7, 6, "#5a3f2a"); k.R(vx, base - h + 6, 5, 4, "#ffd27a"); k.R(vx + 2, base - h + 6, 1, 4, "#5a3f2a"); });
    k.R(x + w - 8, base - h - 10, 4, 8, "#6a5560"); k.R(x + w - 9, base - h - 11, 6, 2, "#f8fbfe");
    k.poli([[x - 5, base - h + 1], [x + w + 5, base - h + 1], [x + w + 3, base - h - 4], [x + w * 0.7, base - h - 8], [x + w * 0.3, base - h - 8], [x - 3, base - h - 4]], n[0]);
    k.poli([[x + w * 0.45, base - h + 1], [x + w + 5, base - h + 1], [x + w + 3, base - h - 4], [x + w * 0.74, base - h - 7]], n[1]); k.R(x - 5, base - h + 1, w + 10, 1, "#bccde0");
    for (let i = x - 3; i < x + w + 3; i += 3) k.R(i, base - h + 2, 1, 1 + ((i >> 1) % 3), "#bcd4e8");
    if (humo) k.alfa(0.4, () => [[-6, -14, 1], [-5, -18, 2], [-2, -23, 2], [2, -28, 3]].forEach(([dx, dy, r]) => k.elipse(x + w + dx, base - h + dy, r, r, "#f2f5f9")));
  }
  function tejadoJ(k, cx, y, w, h, { c, luz, osc }, puntas = 3) {
    const med = w / 2;
    for (let x = -med; x <= med; x++) {
      const u = Math.abs(x) / med, top = y - h * (1 - Math.pow(u, 1.5)) * 0.92 - h * 0.08, bajo = y - puntas * Math.pow(u, 4), px = cx + x;
      for (let py = Math.round(top); py <= bajo; py++) k.P(px, py, (Math.round(px) & 3) === 0 ? osc : x < -med * 0.3 ? luz : x > med * 0.45 ? osc : c);
      k.P(px, Math.round(bajo) + 1, osc);
    }
    k.R(cx - med * 0.34, y - h - 1, med * 0.68, 2, osc); k.R(cx - med * 0.34, y - h - 2, 3, 2, osc); k.R(cx + med * 0.34 - 3, y - h - 2, 3, 2, osc);
  }

  function casaJ2(k, x, base, w, h, { pared = "#e8dcc0", luz = "#f6ecd4", osc = "#c4b598", mad = "#7a5230", madL = "#a87444", madO = "#54351f", techo = { c: "#b5432f", luz: "#d8604a", osc: "#8a2f22" }, ven = "#ffd27a", noren = null, deposito = false, alto = 0.24, puerta = true } = {}) {
    const top = base - h, zocalo = Math.round(h * 0.38), vh = Math.max(4, Math.min(8, Math.round(h * 0.3)));
    k.R(x, top, w, h, pared); k.R(x, top, 2, h, luz); k.R(x + w - 3, top, 3, h, osc);
    tablas(k, x, base - zocalo, w, zocalo, mad, madO, madL, 4, true); k.R(x, base - zocalo - 2, w, 2, madO);
    for (let vx = x + 4; vx < x + w - 9; vx += 13) { k.R(vx, top + 4, 9, vh, madO); k.R(vx + 1, top + 5, 7, vh - 2, ven); k.R(vx + 4, top + 5, 1, vh - 2, madO); }
    if (puerta) { const px = x + w * 0.62; k.R(px - 4, base - 10, 9, 10, "#2e2018"); if (noren) for (let i = 0; i < 3; i++) k.R(px - 4 + i * 3, base - 11, 3, 5, i % 2 ? "#f4efe0" : noren); }
    tejadoJ(k, x + w / 2, top + 1, w + 10, Math.max(7, w * alto), techo, 3);
    if (deposito) { const dx = x + w * 0.2, dy = top - Math.max(7, w * alto) * 0.7; k.R(dx + 1, dy - 2, 2, 6, madO); k.R(dx + 9, dy - 2, 2, 6, madO); cilindro(k, dx, dy - 12, 12, 11, ["#d8e0e4", "#b8c4cc", "#8c9aa4", "#6c7a84"]); k.elipse(dx + 6, dy - 12, 6, 2, "#8c9aa4"); }
    k.alfa(0.25, () => k.R(x - 2, base + 1, w + 6, 2, "#2a1f14"));
  }

  function barril(k, x, base, w = 9, h = 11, cols = ["#c0895a", "#a87444", "#8a5a32", "#6d4628"]) { cilindro(k, x, base - h, w, h, cols); [2, h - 3].forEach((d) => k.R(x, base - h + d, w, 1, "#4a3020")); k.R(x + 1, base - h, w - 2, 1, "#d8ae80"); }
  function caja(k, x, base, w = 11, h = 9, cols = ["#c99a64", "#a87444", "#7a5230"]) { k.R(x, base - h, w, h, cols[1]); k.R(x, base - h, w, 1, cols[0]); k.R(x, base - h, 1, h, cols[0]); k.R(x, base - 1, w, 1, cols[2]); k.R(x + w - 1, base - h, 1, h, cols[2]); k.linea(x + 1, base - h + 1, x + w - 2, base - 2, cols[2]); }
  function bandera(k, x, y, w, h, col, osc = null) { for (let i = 0; i < w; i++) { const o = Math.round(Math.sin(i / 3.2) * 1.3), a = h - (i / w) * h * 0.25; k.R(x + i, y + o, 1, a, osc && i % 6 > 2 ? osc : col); } }
  function farolillo(k, x, y, col, r = 2) { k.R(x, y - r - 1, 1, 1, "#26262a"); k.elipse(x, y, r, r + 1, col); k.R(x - r + 1, y - r - 1, 2 * r - 1, 1, "#26262a"); k.R(x - r + 1, y + r + 1, 2 * r - 1, 1, "#26262a"); }
  function catenaria(k, x0, y0, x1, y1, cae, col, en = null) {
    const n = Math.max(2, Math.abs(x1 - x0));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cae; k.P(x, y, col); if (en) en(x, y, i); }
  }
  function humo(k, x, y, col = "#d8dde4", a = 0.45, n = 5, viento = 1) { const hr = k.luz ? k.luz.hr : 0, v = viento * (0.7 + 0.5 * Math.sin(hr * 1.3)); k.alfa(a, () => { for (let i = 0; i < n; i++) { const r = 1 + i * 0.8; k.elipse(x + v * i * i * 0.7, y - i * 5, r, r, col); } }); k.actores.push({ tipo: "humo", x, y, col: k.luz ? k.luz.color(col) : col, a, n, v }); }
  const sombra = (k, cx, y, rx, ry = 2, col = "#00000f", a = 0.22) => k.alfa(a, () => k.elipse(cx, y, rx, ry, col));
  function brillo(k, cx, cy, rx, ry, col, f = 0.6) { if (!k.luz || k.luz.lit <= 0) return; const a = Math.min(rx, 16) / rx; for (let y = Math.floor(cy - ry * a); y <= cy + ry * a; y++) for (let x = Math.floor(cx - rx * a); x <= cx + rx * a; x++) { const d = Math.hypot((x - cx) / (rx * a), (y - cy) / (ry * a)); if (d < 1 && trama(x, y) < (1 - d) * (1 - d) * f * 0.7 * k.luz.lit) k.crudo(x, y, 1, 1, col); } }

  const LETRAS = { A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", J: "001001001101010", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", Q: "010101101110011", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", X: "101101010101101", Y: "101101010010010", Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110", 4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001110", " ": "000000000000000", "!": "010010010000010", "/": "001001010100100", ".": "000000000000010" };
  function rotulo(k, x, y, texto, col) { [...texto].forEach((l, i) => [...(LETRAS[l] || LETRAS[" "])].forEach((b, j) => { if (b === "1") k.P(x + i * 4 + (j % 3), y + Math.floor(j / 3), col); })); }

  window.Det = { W, H, BAYER, trama, rampa, rellena, bola, esfera, cilindro, nubarron, cirros, reflejo, espuma, oleaje, montana, loma, estratos, pena, grano, adoquines, cubierta, camino, matas, flores, helecho, sillares, ladrillos, tablas, ventanaArco, torreta, almenas, casaTorcida, casaNieve, tejadoJ, casaJ2, barril, caja, bandera, farolillo, catenaria, humo, sombra, brillo, rotulo };
  window.Sitios = {};
  window.Det.andar = andar;
  window.Det.mezcla = (a, b, t) => { const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)), A = hex(a), B = hex(b); return "#" + A.map((v, i) => Math.round(v + (B[i] - v) * t).toString(16).padStart(2, "0")).join(""); };
  window.Det.cuando = (k) => (k.luz ? { h: k.luz.hr, d: k.luz.d } : { h: 12, d: 1 });
  window.Det.sprite = (k, u, nombre, x, y, tinte = (c) => c) => { const sp = window.Personajes && Personajes[u].flat().find((s) => s.nombre === nombre); if (!sp) return; sp.m.forEach((fila, j) => [...fila].forEach((l, i) => { if (l !== ".") k.crudo(x + i, y + j, 1, 1, tinte(sp.c[l])); })); };
  window.Det.sitios = (u, lista) => { Sitios[u] = lista; Object.values(lista).forEach(([titulo, , , ajuste]) => { if (ajuste) Luz.AJUSTE[titulo] = { ...(Luz.AJUSTE[titulo] || {}), ...ajuste }; }); };
})();
