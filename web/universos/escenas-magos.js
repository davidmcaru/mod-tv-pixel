// escenas-magos.js — el dibujo de cada escenario de Magos (datos).
(function () {
  const { trama, rampa, rellena } = Det;
  const W = 320, H = 180;
  function bola(k, cx, cy, rx, ry, color) { for (let y = Math.round(cy - ry); y <= cy + ry; y++) { const w = rx * Math.sqrt(Math.max(0, 1 - ((y - cy) * (y - cy)) / (ry * ry))); for (let x = Math.round(cx - w); x <= cx + w; x++) { const c = color(x, y); if (c) k.P(x, y, c); } } }

  const nuevoKit = Kit.nuevo;
  Kit.nuevo = (c, semilla, luz) => Object.assign(nuevoKit(c, semilla, luz), { ctx: c });

  const hex = (c) => (c.length === 4 ? [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  const aHex = (v) => "#" + v.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
  const mezcla = (a, b, t) => { const A = hex(a), B = hex(b); return aHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const tonos = (cols, n) => Array.from({ length: n }, (_, i) => { const f = (i / (n - 1)) * (cols.length - 1), j = Math.min(cols.length - 2, Math.floor(f)); return mezcla(cols[j], cols[j + 1], f - j); });
  const encendido = (k) => (k.luz ? k.luz.lit : 0);
  const deNoche = (k) => !!(k.luz && k.luz.noche);

  function hash(x, y, s = 0) { let h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263) + Math.imul(s | 0, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296; }
  function ruido(x, y, s = 0) {
    const xi = Math.floor(x), yi = Math.floor(y), u = x - xi, v = y - yi, a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    const U = u * u * (3 - 2 * u), V = v * v * (3 - 2 * v);
    return a + (b - a) * U + (c - a) * V + (a - b - c + d) * U * V;
  }
  function fbm(x, y, s = 0, oct = 3) { let v = 0, a = 1, n = 0, f = 1; for (let i = 0; i < oct; i++) { v += a * ruido(x * f, y * f, s + i * 31); n += a; a *= 0.5; f *= 2; } return v / n; }
  function celdas(x, y, tx, ty = tx, s = 0, jit = 0.85) {
    const gx = Math.floor(x / tx), gy = Math.floor(y / ty);
    let d1 = 1e9, d2 = 1e9, id = 0, cx = 0, cy = 0;
    for (let j = -1; j <= 1; j++) for (let i = -1; i <= 1; i++) {
      const X = gx + i, Y = gy + j, px = (X + 0.5 + (hash(X, Y, s) - 0.5) * jit) * tx, py = (Y + 0.5 + (hash(X, Y, s + 7) - 0.5) * jit) * ty, d = Math.hypot((x - px) / tx, (y - py) / ty);
      if (d < d1) { d2 = d1; d1 = d; id = hash(X, Y, s + 3); cx = px; cy = py; } else if (d < d2) d2 = d;
    }
    return { borde: d2 - d1, id, dx: (x - cx) / tx, dy: (y - cy) / ty };
  }

  function tramos(pts, fn) {
    const ys = pts.map((p) => p[1]), y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(H - 1, Math.ceil(Math.max(...ys)));
    for (let y = y0; y <= y1; y++) {
      const xs = [];
      for (let i = 0; i < pts.length; i++) { const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length]; if ((ay <= y + 0.5 && by > y + 0.5) || (by <= y + 0.5 && ay > y + 0.5)) xs.push(ax + ((y + 0.5 - ay) / (by - ay)) * (bx - ax)); }
      xs.sort((a, b) => a - b);
      for (let i = 0; i + 1 < xs.length; i += 2) { const a = Math.max(0, Math.round(xs[i])), b = Math.min(W, Math.round(xs[i + 1])); if (b > a) fn(y, a, b); }
    }
  }
  function bezier(p0, p1, p2, p3, n = 16) { const r = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; r.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return r; }
  function trazo(k, pts, col, g0 = 1, g1 = g0) {
    for (let i = 1; i < pts.length; i++) {
      const [ax, ay] = pts[i - 1], [bx, by] = pts[i], n = Math.max(1, Math.ceil(Math.hypot(bx - ax, by - ay)));
      for (let j = 0; j <= n; j++) { const t = j / n, f = (i - 1 + t) / (pts.length - 1), g = g0 + (g1 - g0) * f, c = typeof col === "function" ? col(f, ax + (bx - ax) * t, ay + (by - ay) * t) : col; k.R(ax + (bx - ax) * t - g / 2, ay + (by - ay) * t - g / 2, Math.max(1, g), Math.max(1, g), c); }
    }
  }
  function cuerda(k, x0, y0, x1, y1, cae, col, luz = null) {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    for (let i = 0; i <= n; i++) { const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cae; k.P(x, y, luz && i % 3 === 0 ? luz : col); }
  }

  function madera(pal, { paso = 5, vertical = false, largo = 44, s = 1, clavo = null, veta = 1, gastado = null } = {}) {
    const n = pal.length - 1;
    return (x, y) => {
      const a = vertical ? x : y, b = vertical ? y : x, fila = Math.floor(a / paso), en = a - fila * paso, desf = hash(fila, 0, s) * largo, col = Math.floor((b + desf) / largo), u = b + desf - col * largo;
      if (en === 0) return pal[n];
      if (u < 1) return pal[n - 1];
      if (clavo && (Math.round(u) === 2 || Math.round(u) === largo - 3) && en === Math.ceil(paso / 2)) return clavo;
      const tono = (hash(fila, col, s) - 0.5) * 0.28, v = (ruido(b * 0.09, a * 1.3 + fila * 7.3, s) - 0.5) * 0.42 * veta, nudo = ruido(b * 0.35 + 50, a * 0.9, s + 5) > 0.86 ? 0.22 : 0;
      const g = gastado ? gastado(x, y) : 0;
      return rampa(pal, 0.34 + tono + v + nudo - g + (en === 1 ? -0.16 : 0) + (en === paso - 1 ? 0.14 : 0), x, y);
    };
  }
  function piedra(pal, { tx = 7, ty = 5, s = 2, junta = null, jit = 0.85, musgo = null } = {}) {
    const n = pal.length - 1;
    return (x, y) => {
      const c = celdas(x, y, tx, ty, s, jit);
      if (c.borde < 0.09) return junta || pal[n];
      const vol = c.dx * 0.5 + c.dy * 0.7, grano = (hash(x, y, s + 9) - 0.5) * 0.12;
      if (musgo && fbm(x * 0.12, y * 0.12, s + 4) > musgo.umbral && c.dy < 0.1) return rampa(musgo.pal, 0.3 + vol * 0.5 + grano, x, y);
      return rampa(pal, 0.3 + (c.id - 0.5) * 0.36 + vol * 0.42 + grano + (c.borde < 0.17 ? 0.16 : 0), x, y);
    };
  }
  function ladrillo(pal, { w = 6, h = 3, s = 4, junta = null } = {}) {
    const n = pal.length - 1;
    return (x, y) => {
      const f = Math.floor(y / h), ex = x + (f % 2) * (w / 2), c = Math.floor(ex / w);
      if (y % h === 0 || Math.floor(ex) % w === 0) return junta || pal[n];
      return rampa(pal, 0.25 + (hash(c, f, s) - 0.5) * 0.4 + (y % h === 1 ? -0.1 : 0) + (hash(x, y, s) - 0.5) * 0.1, x, y);
    };
  }
  function tejas(pal, { w = 5, h = 3, s = 6, curva = true, x0 = 0, y0 = 0 } = {}) {
    const n = pal.length - 1;
    return (x, y) => {
      const yy = y - y0, f = Math.floor(yy / h), ty = yy - f * h, ex = x - x0 + (f % 2) * (w / 2), c = Math.floor(ex / w), tx = ex - c * w;
      if (ty === h - 1) return pal[n];
      const lomo = curva ? Math.abs(tx / w - 0.5) * 0.5 : 0;
      return rampa(pal, 0.2 + (ty / h) * 0.4 + lomo + (hash(c, f, s) - 0.5) * 0.2, x, y);
    };
  }
  function corteza(pal, x0, w, { s = 8, musgo = null, grieta = 0.6 } = {}) {
    return (x, y) => {
      const t = (x - x0) / Math.max(1, w), cil = Math.pow(Math.abs(t - 0.3) / 0.7, 1.2), g = ruido(x * 0.7, y * 0.05, s), raja = g > grieta ? 0.28 : 0;
      if (musgo && fbm(x * 0.2, y * 0.08, s + 3) > musgo.umbral && t < 0.6) return rampa(musgo.pal, cil * 0.8 + (hash(x, y, s) - 0.5) * 0.2, x, y);
      return rampa(pal, 0.1 + cil * 0.7 + raja + (ruido(x * 0.4, y * 0.3, s + 1) - 0.5) * 0.2, x, y);
    };
  }

  function suelo3d(k, y0, y1, fx, fy, color, { x0 = 0, x1 = W, dentro = null } = {}) {
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(H, y1); y++) {
      const z = 100 / Math.max(0.5, y - fy);
      for (let x = Math.max(0, x0); x < Math.min(W, x1); x++) { if (dentro && !dentro(x, y)) continue; const c = color((x - fx) * z, z, x, y); if (c) k.P(x, y, c); }
    }
  }
  function tablones(pal, { pw = 9, L = 46, s = 11, clavo = null, gastado = null } = {}) {
    const n = pal.length - 1;
    return (X, z, x, y) => {
      const fila = Math.floor(X / pw), u = X - fila * pw, Z = 100 / z, dZ = (z * z) / 100, off = hash(fila, 0, s) * L, cola = Math.floor((Z * 10 + off) / L), v = (Z * 10 + off) - cola * L;
      const junta = u < Math.max(0.6, z * 0.9) ? Math.min(1, 1.2 - z / pw) : 0, cabeza = v < dZ * 10 * 1.2 ? 1 : 0;
      if (junta > 0.5) return pal[n];
      if (cabeza && z < 1.2) return pal[n - 1];
      if (clavo && z < 0.9 && (Math.abs(v - 2) < dZ * 10 || Math.abs(v - (L - 3)) < dZ * 10) && Math.abs(u - pw / 2 + 1.5) < z * 0.8) return clavo;
      const tono = (hash(fila, cola, s) - 0.5) * 0.3, veta = (ruido(u * 0.6 + fila * 9, Z * 3.4, s) - 0.5) * 0.3, g = gastado ? gastado(x, y, X, Z) : 0, lejos = Math.max(0, 1 - z) * 0;
      return rampa(pal, 0.36 + tono + veta - g + lejos + (u < z * 2 + 0.5 ? 0.14 : 0), x, y);
    };
  }
  function losas3d(pal, { tx = 10, tz = 7, s = 12, junta = null, charcos = null } = {}) {
    const n = pal.length - 1;
    return (X, z, x, y) => {
      const Z = 1000 / z, c = celdas(X, Z, tx, tz, s, 0.7);
      if (c.borde < 0.08 + z * 0.06) return junta || pal[n];
      return rampa(pal, 0.32 + (c.id - 0.5) * 0.34 + c.dy * -0.3 + (hash(x, y, s) - 0.5) * 0.1, x, y);
    };
  }

  function copa(k, cx, cy, rx, ry, pal, { r = 5, n = null, s = 3, hojas = 1, dentro = null, masa = true } = {}) {
    const N = n || Math.round(((rx * ry) / (r * r)) * 2.2);
    if (masa) bola(k, cx, cy + ry * 0.05, rx * 0.86, ry * 0.84, (x, y) => (!dentro || dentro(x, y) ? (ruido(x * 0.4, y * 0.4, s) > 0.6 ? pal[4] : pal[3]) : null));
    const rac = [];
    for (let i = 0; i < N; i++) { const a = hash(i, 1, s) * Math.PI * 2, d = Math.pow(hash(i, 2, s), 0.6), x = cx + Math.cos(a) * d * rx * 0.92, y = cy + Math.sin(a) * d * ry * 0.92; rac.push([x, y, r * (0.65 + hash(i, 3, s) * 0.6), i]); }
    rac.sort((a, b) => b[1] - a[1]);
    rac.forEach(([x0, y0, rr, i]) => {
      const alto = (y0 - (cy - ry)) / (2 * ry), lado = (x0 - cx) / rx;
      for (let y = Math.floor(y0 - rr); y <= y0 + rr; y++) for (let x = Math.floor(x0 - rr); x <= x0 + rr; x++) {
        const dx = (x - x0) / rr, dy = (y - y0) / rr, d = Math.hypot(dx, dy), borde = 0.82 + (ruido(x * 0.9, y * 0.9, s + i) - 0.5) * 0.5 * hojas;
        if (d > borde || x < 0 || x >= W || y < 0 || y >= H) continue;
        if (dentro && !dentro(x, y)) continue;
        const l = dx * 0.62 + dy * 0.78, v = 0.12 + alto * 0.5 + lado * 0.12 + l * 0.34 + (d > borde - 0.2 ? 0.12 : 0) + (hash(x, y, s) - 0.5) * 0.14;
        k.P(x, y, rampa(pal, v, x, y));
      }
      if (alto < 0.55 && hash(i, 9, s) > 0.4) k.P(x0 - rr * 0.35, y0 - rr * 0.45, pal[0]);
    });
  }
  function arbol(k, x, base, alto, rx, ry, pal, { tronco = ["#a07a58", "#80603f", "#62462e", "#46301e", "#2e1e12"], g = 5, s = 1, r = null } = {}) {
    const cy = base - alto - ry * 0.6;
    sombraE(k, x + 4, base + 1, Math.max(g * 3, rx * 0.8), 3, 0.42);
    [[-1, 0.75], [1, 0.7], [-0.25, 1.05]].forEach(([dx, dy]) => trazo(k, [[x, base - alto * 0.6], [x + dx * rx * 0.35, cy + ry * 0.2], [x + dx * rx * 0.7, cy - dy * ry * 0.25]], (f) => tronco[f < 0.5 ? 2 : 3], g * 0.7, 1.5));
    rellena(k, [[x - g * 0.5, cy + ry * 0.3], [x + g * 0.5, cy + ry * 0.3], [x + g * 0.55, base - 5], [x + g * 1.5, base], [x - g * 1.5, base], [x - g * 0.55, base - 5]], corteza(tronco, x - g * 0.6, g * 1.2, { s }));
    [[-1.5, 0.6], [1.6, 0.5]].forEach(([dx, dy]) => trazo(k, [[x + dx * g * 0.4, base - 3], [x + dx * g, base], [x + dx * g * 1.4, base + dy]], tronco[3], 2, 1));
    copa(k, x, cy, rx, ry, pal, { r: r || Math.max(3.5, rx / 5), s });
  }
  function briznas(k, x0, x1, base, pal, { n = 120, alto = 4, s = 21, y1 = null } = {}) {
    for (let i = 0; i < n; i++) {
      const x = x0 + hash(i, 1, s) * (x1 - x0), b = typeof base === "function" ? base(x) : base, y = y1 === null ? b : b + hash(i, 2, s) * (y1 - b), f = y1 === null ? 1 : (y - b) / Math.max(1, y1 - b), h = Math.round(alto * (0.5 + hash(i, 3, s) * 0.8) * (0.6 + f * 0.8)), inc = (hash(i, 4, s) - 0.5) * 0.9;
      for (let j = 0; j < h; j++) k.P(x + inc * j, y - j, pal[Math.min(pal.length - 1, Math.floor((j / h) * pal.length * 0.999))]);
    }
  }
  function fronda(k, x, y, dx, dy, largo, pal, { caida = 0.4, foliolo = 4, lados = 2 } = {}) {
    const n = Math.ceil(largo);
    for (let i = 0; i < n; i++) {
      const t = i / n, px = x + dx * largo * t, py = y + dy * largo * t + caida * largo * t * t, f = Math.sin(t * Math.PI) * foliolo + 0.5;
      k.P(px, py, pal[2]);
      if (i % 2 === 0) for (let l = -1; l <= 1; l += 2) { if (lados === 1 && l > 0) continue; const nx = -dy * l, ny = dx * l; for (let j = 1; j < f; j++) k.P(px + nx * j + dx * j * 0.4, py + ny * j * 0.7 + j * 0.5, pal[j < f * 0.4 ? 1 : l < 0 ? 0 : 3]); }
    }
  }

  function pase(k, fn, x0 = 0, y0 = 0, x1 = W, y1 = H) {
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(W, Math.ceil(x1)); y1 = Math.min(H, Math.ceil(y1));
    if (x1 <= x0 || y1 <= y0 || !k.ctx) return;
    const img = k.ctx.getImageData(x0, y0, x1 - x0, y1 - y0), d = img.data, w = x1 - x0;
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) fn(x, y, d, ((y - y0) * w + (x - x0)) * 4);
    k.ctx.putImageData(img, x0, y0);
  }
  function sombra(k, pts, a = 0.38, { borde = 0 } = {}) {
    if (!k.ctx) return;
    const f = a * (1 - 0.55 * encendido(k)), ys = pts.map((p) => p[1]), xs = pts.map((p) => p[0]);
    const img = k.ctx.getImageData(0, 0, W, H), d = img.data;
    tramos(pts, (y, xa, xb) => { for (let x = xa; x < xb; x++) { const e = borde ? Math.min(1, (x - xa) / borde, (xb - 1 - x) / borde) : 1, q = e >= 1 ? 1 : trama(x, y) < e ? 1 : 0.5, i = (y * W + x) * 4, m = 1 - f * q; d[i] *= m * 0.96; d[i + 1] *= m * 0.98; d[i + 2] *= Math.min(1, m * 1.06); } });
    k.ctx.putImageData(img, 0, 0);
    return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
  }
  function sombraE(k, cx, cy, rx, ry, a = 0.4) {
    const f = a * (1 - 0.5 * encendido(k));
    pase(k, (x, y, d, i) => { const q = Math.hypot((x - cx) / rx, (y - cy) / ry); if (q >= 1) return; const m = 1 - f * (q < 0.6 ? 1 : trama(x, y) < 1 - q ? 0.75 : 0.45); d[i] *= m * 0.96; d[i + 1] *= m * 0.98; d[i + 2] *= Math.min(1, m * 1.05); }, cx - rx, cy - ry, cx + rx + 1, cy + ry + 1);
  }
  function luces(k, lista, pasos = 3) {
    const L = lista.filter((l) => l && l.f > 0.03).map((l) => ({ ...l, ry: l.ry || l.r, c: hex(l.col) }));
    if (!L.length) return;
    const x0 = Math.min(...L.map((l) => l.x - l.r)), x1 = Math.max(...L.map((l) => l.x + l.r)), y0 = Math.min(...L.map((l) => l.y - l.ry)), y1 = Math.max(...L.map((l) => l.y + l.ry));
    pase(k, (x, y, d, i) => {
      let f = 0, cr = 0, cg = 0, cb = 0;
      for (const l of L) { const q = Math.hypot((x - l.x) / l.r, (y - l.y) / l.ry); if (q >= 1) continue; const v = Math.pow(1 - q, l.p || 1.2) * l.f; f += v; cr += l.c[0] * v; cg += l.c[1] * v; cb += l.c[2] * v; }
      if (f <= 0) return;
      cr /= f; cg /= f; cb /= f;
      const q = Math.floor(Math.min(1, f) * pasos + trama(x, y) * 0.999) / pasos;
      if (q <= 0) return;
      const r = d[i], g = d[i + 1], b = d[i + 2], lum = r * 0.3 + g * 0.59 + b * 0.11;
      d[i] = r + (lum * 1.15 * (cr / 255) + cr * 0.3 - r) * q * 0.92;
      d[i + 1] = g + (lum * 1.15 * (cg / 255) + cg * 0.3 - g) * q * 0.92;
      d[i + 2] = b + (lum * 1.15 * (cb / 255) + cb * 0.3 - b) * q * 0.92;
    }, x0, y0, x1 + 1, y1 + 1);
  }
  function espejo(k, eje, y0, y1, { x0 = 0, x1 = W, tinte = "#1e3a5a", mezcla: m = 0.45, onda = 2, oscuro = 0.82, crestas = 0.18, s = 31, paso = 1, dentro = null } = {}) {
    if (!k.ctx) return;
    const src = k.ctx.getImageData(0, 0, W, H).data, T = hex(k.luz ? k.luz.color(tinte) : tinte), hr = k.luz ? k.luz.hr : 0;
    pase(k, (x, y, d, i) => {
      if (dentro && !dentro(x, y)) return;
      const dy = y - eje, cerca = (y - y0) / Math.max(1, y1 - y0), ola = ruido(x * 0.08, y * 0.9 + hr, s), ox = Math.round((ola - 0.5) * onda * 2 * (0.4 + cerca)), sy = Math.round(eje - 1 - dy * paso), sx = Math.min(W - 1, Math.max(0, x + ox));
      if (sy < 0 || sy >= H) return;
      const j = (sy * W + sx) * 4, cresta = ruido(x * 0.12, y * 1.6 + hr * 3, s + 5) > 1 - crestas * (0.5 + cerca) ? 1.18 : 1;
      d[i] = (src[j] * oscuro * (1 - m) + T[0] * m) * cresta; d[i + 1] = (src[j + 1] * oscuro * (1 - m) + T[1] * m) * cresta; d[i + 2] = (src[j + 2] * oscuro * (1 - m) + T[2] * m) * cresta;
    }, x0, y0, x1, y1);
  }
  function bruma(k, y0, y1, col, a = 0.35, { s = 5, ex = 0.035, ey = 0.12, perfil = null, x0 = 0, x1 = W, pasos = 3 } = {}) {
    const C = hex(k.luz ? k.luz.color(col) : col), hr = k.luz ? k.luz.hr : 0;
    pase(k, (x, y, d, i) => {
      const p = perfil ? perfil(x, y) : Math.sin(((y - y0) / (y1 - y0)) * Math.PI), v = Math.max(0, fbm(x * ex + hr * 0.7, y * ey, s) - 0.38) * 1.6 * p * a, q = Math.floor(Math.min(1, v) * pasos + trama(x, y) * 0.999) / pasos;
      if (q <= 0) return;
      d[i] += (C[0] - d[i]) * q; d[i + 1] += (C[1] - d[i + 1]) * q; d[i + 2] += (C[2] - d[i + 2]) * q;
    }, x0, y0, x1, y1);
  }
  function rayos(k, lista, col, a = 0.3) {
    const C = hex(k.luz ? k.luz.color(col) : col);
    lista.forEach(([xa, ya, xb, yb, w0, w1]) => {
      const pts = [[xa - w0 / 2, ya], [xa + w0 / 2, ya], [xb + w1 / 2, yb], [xb - w1 / 2, yb]];
      const img = k.ctx.getImageData(0, 0, W, H), d = img.data;
      tramos(pts, (y, xl, xr) => { const t = (y - ya) / Math.max(1, yb - ya), m = xl + (xr - xl) / 2; for (let x = xl; x < xr; x++) { const c = 1 - Math.abs(x - m) / ((xr - xl) / 2 + 0.01), v = a * c * (1 - t * 0.7), q = Math.floor(v * 3 + trama(x, y) * 0.999) / 3; if (q <= 0) continue; const i = (y * W + x) * 4; d[i] += (C[0] - d[i]) * q; d[i + 1] += (C[1] - d[i + 1]) * q; d[i + 2] += (C[2] - d[i + 2]) * q; } });
      k.ctx.putImageData(img, 0, 0);
    });
  }

  function pluma(k, x, base, alto, ancho, cols = ["#9a948e", "#7c7670", "#5e5a56", "#46423e"], { s = 1, viento = 0.35 } = {}) {
    const hr = k.luz ? k.luz.hr : 0;
    for (let y = Math.round(base - alto); y < base; y++) {
      const t = (base - y) / alto, c = x + viento * t * t * alto, w = ancho * (0.22 + t * 0.85);
      for (let px = Math.round(c - w); px <= c + w; px++) {
        const n = fbm(px * 0.11 - hr * 0.3, y * 0.1 + hr * 0.5, s, 3), v = n * 0.9 + (1 - Math.pow(Math.abs(px - c) / w, 2)) * 0.45 * (1 - t * 0.6) - t * t * 0.35;
        if (v < 0.5) continue;
        k.P(px, y, rampa(cols, 0.1 + (1.2 - v) * 0.8 + ((px - c) / w) * 0.25, px, y));
      }
    }
  }
  function fuego(k, cx, base, w, h, { s = 41, humo = false } = {}) {
    const hr = k.luz ? k.luz.hr : 0, cols = ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"];
    for (let y = Math.floor(base - h * 1.15); y <= base; y++) for (let x = Math.floor(cx - w * 0.75); x <= cx + w * 0.75; x++) {
      const t = (base - y) / h, lado = Math.abs(x - cx) / (w / 2), n = fbm(x * 0.22, y * 0.16 + hr * 1.7, s, 3), v = (1 - t) * 1.25 - lado * lado * 0.9 + (n - 0.5) * 1.15;
      if (v < 0.12) continue;
      k.crudo(x, y, 1, 1, cols[Math.min(4, Math.floor((v - 0.12) * 4.4))]);
    }
    if (humo) Det.humo(k, cx, base - h * 1.1, "#3a3238", 0.5, 7);
  }

  window.Det6 = { bola, hex, aHex, mezcla, tonos, encendido, deNoche, hash, ruido, fbm, celdas, tramos, bezier, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, pase, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego };
})();

(function () {
  const { rampa, rellena, esfera } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, corteza, tejas, sombraE, espejo } = Det6;
  const W = 320, H = 180;

  const PAL = {
    CIELO: ["#4f9fe0", "#7cbcec", "#b4dcf2", "#e8f2ea"], MAR: ["#3c94d2", "#2c80c0", "#226caa", "#1a5a92", "#134a7c"],
    MAD: ["#e6bf8e", "#cfa26c", "#b07c4a", "#8e6036", "#6e4626", "#4c2e18"], MAD_O: ["#b88a5a", "#9a6c40", "#7c522e", "#5f3c20", "#422814", "#2c1a0c"],
    LONA: ["#fffaf0", "#f4ecda", "#e6dbc2", "#d2c4a6", "#b8a888"], LANA: ["#ffffff", "#f7f2e6", "#e8dfcc", "#d0c3a8", "#ab9b80"],
    HIERRO: ["#9a9aa6", "#6a6a76", "#46464f", "#2a2a32"], CUERDA: ["#e8d6a8", "#c8b080", "#9a8258", "#6e5a3a"],
    ENLUCIDO: ["#fffaf0", "#f6ecd6", "#eadcbc", "#d6c4a0", "#b8a07c"], VIGA: ["#8a6040", "#6e4a30", "#543620", "#3a2414"],
    TEJA_R: ["#f49464", "#dc6a40", "#bc4e2c", "#923822", "#682616"], TEJA_A: ["#84c0e6", "#5c9ccf", "#407eb2", "#2e6090", "#20466a"],
    VERDE: ["#c4e88c", "#a4d470", "#86bc58", "#6aa046", "#4e8236", "#366228"], MAND: ["#a8d878", "#7cb658", "#58963f", "#3b762f", "#245520"],
    FUEGO: ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"],
  };
  const LUZ = "#ffcf7a";
  const { MAD, MAD_O, LONA, LANA, HIERRO, CUERDA, ENLUCIDO, VIGA } = PAL;

  function barril(k, x, base, w, h, pal = MAD) {
    sombraE(k, x + w / 2 + 2, base, w * 0.75, 2.5, 0.45);
    for (let px = x; px < x + w; px++) {
      const t = (px - x) / (w - 1), duela = Math.floor((px - x) / 3);
      for (let py = base - h; py < base; py++) k.P(px, py, rampa(pal, 0.12 + Math.pow(Math.abs(t - 0.32) / 0.68, 1.3) * 0.72 + ((px - x) % 3 === 2 ? 0.14 : 0) + (hash(duela, 3) - 0.5) * 0.1, px, py));
    }
    [2, Math.round(h * 0.4), Math.round(h * 0.62), h - 3].forEach((dd) => { for (let px = x; px < x + w; px++) { const t = (px - x) / (w - 1); k.P(px, base - h + dd, rampa(HIERRO, 0.15 + Math.abs(t - 0.3) * 1.1, px, base - h + dd)); } });
    k.R(x + 1, base - h - 1, w - 2, 2, pal[1]); k.R(x + 2, base - h - 1, w - 4, 1, pal[3]);
  }
  function caja(k, x, base, w, h, pal = MAD) {
    sombraE(k, x + w / 2 + 2, base, w * 0.7, 2.5, 0.45);
    rellena(k, [[x, base], [x, base - h], [x + w, base - h], [x + w, base]], madera(pal, { paso: 3, largo: 99, s: x, veta: 0.5 }));
    k.R(x, base - h, w, 1, pal[0]); k.R(x, base - h, 1, h, pal[1]); k.R(x + w - 1, base - h, 1, h, pal[4]); k.R(x, base - 1, w, 1, pal[5]);
    trazo(k, [[x + 1, base - 2], [x + w - 2, base - h + 1]], pal[4]);
  }
  function rollo(k, cx, cy, r) {
    sombraE(k, cx + 2, cy + 1, r + 2, r * 0.42 + 1, 0.4);
    for (let a = 0; a < 5 * Math.PI * 2; a += 0.04) { const e = r * (1 - (a / (5 * Math.PI * 2)) * 0.8), x = cx + Math.cos(a) * e, y = cy + Math.sin(a) * e * 0.42; k.P(x, y, CUERDA[Math.sin(a) > 0.3 ? 2 : Math.sin(a) < -0.5 ? 0 : 1]); }
  }
  function farol(k, x, y, luz = "#ffd27a") {
    k.R(x + 1, y - 4, 1, 3, HIERRO[2]); k.R(x - 1, y - 2, 5, 1, HIERRO[1]); k.R(x - 1, y - 1, 5, 7, HIERRO[2]); k.R(x, y, 3, 5, luz); k.P(x, y, "#fff3cf"); k.R(x - 1, y + 6, 5, 1, HIERRO[1]);
  }
  function jollyRoger(k, cx, cy, e = 1, tela = LONA[1]) {
    const N = "#1c1c22", N2 = "#30303a";
    const hueso = (ax, ay, bx, by) => {
      trazo(k, [[ax, ay], [bx, by]], N, 3.6 * e, 3.6 * e);
      const l = Math.hypot(bx - ax, by - ay), nx = -(by - ay) / l, ny = (bx - ax) / l;
      [[ax, ay], [bx, by]].forEach(([px, py]) => { k.elipse(px + nx * 2.3 * e, py + ny * 2.3 * e, 2.7 * e, 2.7 * e, N); k.elipse(px - nx * 2.3 * e, py - ny * 2.3 * e, 2.7 * e, 2.7 * e, N); });
    };
    hueso(cx - 24 * e, cy - 1 * e, cx + 24 * e, cy + 27 * e); hueso(cx + 24 * e, cy - 1 * e, cx - 24 * e, cy + 27 * e);
    bola(k, cx, cy + 4 * e, 13.5 * e, 12.5 * e, () => N);
    rellena(k, [[cx - 12.5 * e, cy + 8 * e], [cx + 12.5 * e, cy + 8 * e], [cx + 11 * e, cy + 14 * e], [cx + 7.5 * e, cy + 19.5 * e], [cx - 7.5 * e, cy + 19.5 * e], [cx - 11 * e, cy + 14 * e]], () => N);
    [[-1], [1]].forEach(([s]) => rellena(k, [[cx + s * 1.8 * e, cy + 3 * e], [cx + s * 8.5 * e, cy + 1.5 * e], [cx + s * 10 * e, cy + 6 * e], [cx + s * 7 * e, cy + 10 * e], [cx + s * 2.6 * e, cy + 8.6 * e]], () => tela));
    k.poli([[cx, cy + 10.5 * e], [cx - 2.2 * e, cy + 14 * e], [cx + 2.2 * e, cy + 14 * e]], tela);
    k.R(cx - 6.5 * e, cy + 15.5 * e, 13 * e, 1, tela); for (let i = -2; i <= 2; i++) k.R(cx + i * 2.7 * e, cy + 15.5 * e, 1, 3.6 * e, tela);
    for (let i = -3; i <= 3; i++) k.P(cx + i * 3 * e, cy + 17 * e, N2);
    const P = ["#fbe6a0", "#f0cc6c", "#dcae4c", "#b88a34", "#8e6824"];
    bola(k, cx, cy - 5 * e, 10.5 * e, 7.5 * e, (x, y) => (y > cy - 4 * e ? null : rampa(P, 0.12 + ((x - cx) / (10.5 * e)) * 0.35 + (Math.round(x + y * 2) % 4 === 0 ? 0.25 : 0), x, y)));
    k.R(cx - 10.5 * e, cy - 6.5 * e, 21 * e, 2.8 * e, "#c8301e"); k.R(cx - 10.5 * e, cy - 6.5 * e, 21 * e, 1, "#e85a40");
    bola(k, cx, cy - 2 * e, 21.5 * e, 3.6 * e, (x, y) => rampa(P, 0.08 + ((y - (cy - 2 * e)) / (3.6 * e)) * 0.55 + (Math.round(x * 0.5 + y) % 3 === 0 ? 0.2 : 0), x, y));
    k.R(cx - 12 * e, cy + 1.6 * e, 24 * e, 1, N2);
  }
  function velaCuadra(k, x0, x1, y0, y1, { hincha = 4, pal = LONA, quema = null } = {}) {
    const cx = (x0 + x1) / 2, w = x1 - x0, pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([x0 - hincha * Math.sin(t * Math.PI) * 0.8, y0 + (y1 - y0) * t]); }
    for (let i = 1; i < 20; i++) { const t = i / 20; pts.push([x0 + w * t, y1 + hincha * 1.2 * Math.sin(t * Math.PI)]); }
    for (let i = 20; i >= 0; i--) { const t = i / 20; pts.push([x1 + hincha * Math.sin(t * Math.PI) * 0.8, y0 + (y1 - y0) * t]); }
    rellena(k, pts, (x, y) => {
      if (quema && quema(x, y)) return null;
      const nx = (x - cx) / (w / 2), ny = (y - y0) / (y1 - y0);
      if (Math.round(x - x0) % 10 === 0) return pal[2];
      return rampa(pal, 0.05 + Math.pow(Math.abs(nx + 0.12), 1.8) * 0.66 + ny * 0.14 + (ruido(x * 0.2, y * 0.08, 9) - 0.5) * 0.08, x, y);
    });
    if (!quema) { trazo(k, pts.slice(20, 41), pal[4]); trazo(k, pts.slice(0, 21), pal[3]); trazo(k, pts.slice(40), pal[4]); }
    return pts;
  }
  function verga(k, x0, x1, y, g, pal = MAD_O) { for (let x = Math.round(x0); x < x1; x++) for (let j = 0; j < g; j++) k.P(x, y + j, rampa(pal, 0.1 + Math.abs(j / (g - 1) - 0.3) * 1.1, x, y + j)); }
  function palo(k, x, y0, y1, w, pal = MAD_O, zunchos = []) {
    rellena(k, [[x, y0], [x + w, y0], [x + w, y1], [x, y1]], corteza(pal, x, w, { s: 17, grieta: 0.74 }));
    zunchos.forEach((y) => { for (let px = x - 1; px <= x + w; px++) { const t = (px - x) / w; k.P(px, y, rampa(HIERRO, 0.05 + Math.abs(t - 0.3), px, y)); k.P(px, y + 1, rampa(HIERRO, 0.4 + Math.abs(t - 0.3), px, y + 1)); } });
  }
  function oveja(k, ox, oy, e = 1) {
    const X = (d) => ox + d * e, Y = (d) => oy + d * e;
    rellena(k, [[X(-12), Y(10)], [X(4), Y(12)], [X(6), Y(30)], [X(2), Y(46)], [X(-20), Y(46)], [X(-16), Y(26)]], (x, y) => rampa(MAD, 0.15 + ((x - X(-18)) / (24 * e)) * 0.55 + (ruido(x * 0.3, y * 0.1, 4) - 0.5) * 0.2, x, y));
    const rizos = [];
    for (let i = 0; i < 44; i++) { const a = hash(i, 1, 23) * Math.PI * 2, r = Math.sqrt(hash(i, 2, 23)), x = X(-7) + Math.cos(a) * r * 15 * e, y = Y(1) + Math.sin(a) * r * 14 * e; if (x > X(6)) continue; rizos.push([x, y, (3 + hash(i, 3, 23) * 1.8) * e]); }
    rizos.sort((a, b) => b[1] - a[1]).forEach(([x, y, r]) => { esfera(k, x, y, r, r, LANA, (x - ox) / 40 + (y - oy) / 36 - 0.05); k.P(x - r * 0.45, y - r * 0.5, "#ffffff"); k.P(x + r * 0.2, y + r * 0.6, LANA[4]); });
    const CARA = ["#fff6e2", "#fbe9c6", "#f0d4a2", "#ddb882", "#bf965e"];
    rellena(k, [[X(-2), Y(-10)], [X(8), Y(-9)], [X(16), Y(-4)], [X(23), Y(2)], [X(27), Y(7)], [X(26), Y(12)], [X(20), Y(15)], [X(10), Y(16)], [X(2), Y(13)], [X(-2), Y(4)]], (x, y) => rampa(CARA, 0.1 + ((y - Y(-10)) / (26 * e)) * 0.5 + ((x - ox) / (30 * e)) * 0.08, x, y));
    k.elipse(X(12), Y(-1), 3 * e, 3.6 * e, "#1e1e24"); k.P(X(13), Y(-3), "#ffffff"); k.P(X(12), Y(-3), "#ffffff");
    trazo(k, [[X(8), Y(-5)], [X(12), Y(-6)], [X(16), Y(-5)]], CARA[4]);
    k.R(X(24), Y(5), 2 * e, 2 * e, "#8a5a3a");
    trazo(k, [[X(18), Y(11)], [X(22), Y(12)], [X(25), Y(10)]], "#a8622a");
    rellena(k, [[X(2), Y(-6)], [X(-2), Y(-8)], [X(-9), Y(-4)], [X(-8), Y(-1)], [X(-1), Y(-2)]], (x, y) => rampa(["#fbe9c6", "#f0d4a2", "#ddb882"], 0.2 + ((y - Y(-8)) / (8 * e)) * 0.5, x, y));
    for (let a = 0; a < 2.2 * Math.PI * 2; a += 0.035) { const r = (1.2 + a * 0.9) * e, x = X(-4) + Math.cos(a + 2.4) * r, y = Y(4) + Math.sin(a + 2.4) * r * 1.05, g = (1.6 + a * 0.3) * e, anillo = Math.floor(a * 2.2) % 2; k.R(x - g / 2, y - g / 2, g, g, rampa(["#f6dc8c", "#e2b85a", "#c49640", "#9a7228", "#6e5018"], 0.12 + (Math.sin(a + 3) + 1) * 0.3 + anillo * 0.12, x, y)); }
    [[X(2), Y(-11), 3.6], [X(7), Y(-12), 3.4], [X(-3), Y(-10), 3.6]].forEach(([x, y, r]) => { esfera(k, x, y, r * e, r * e, LANA, -0.1); k.P(x - r * 0.4, y - r * 0.5, "#ffffff"); });
  }

  function mar(k, y0, y1, pal = PAL.MAR, { s = 3, cresta = "#c8eaf8", medio = "#62aee0", espejo: esp = true, tinte = "#2c74b0", x0 = 0, x1 = W } = {}) {
    for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) {
      const f = (y - y0) / Math.max(1, y1 - y0), o = ruido(x * (0.1 - f * 0.06), y * 0.75, s);
      k.P(x, y, o > 0.72 ? (o > 0.86 ? cresta : medio) : o < 0.2 ? pal[pal.length - 1] : rampa(pal, 0.1 + f * 0.75 + (o - 0.5) * 0.3, x, y));
    }
    if (esp) espejo(k, y0, y0, y1, { mezcla: 0.6, tinte, onda: 3, crestas: 0.06, x0, x1 });
  }
  function nieve(k, n = 220, s = 5, { y0 = 0, y1 = H, col = "#f4f8ff", sombra = "#c8d4e8" } = {}) {
    for (let i = 0; i < n; i++) {
      const x = hash(i, 1, s) * W, y = y0 + hash(i, 2, s) * (y1 - y0), cerca = hash(i, 3, s) > 0.82;
      if (cerca) { k.crudo(x, y, 2, 2, col); k.crudo(x + 1, y + 1, 1, 1, sombra); } else k.crudo(x, y, 1, 1, hash(i, 4, s) > 0.5 ? col : sombra);
    }
    k.actores.push({ tipo: "nieve", n: Math.round(n / 4), col });
  }
  function lluvia(k, n = 160, s = 7, { col = "#9ab0c8", largo = 7, ang = 0.4, a = 0.5 } = {}) {
    k.alfa(a, () => { for (let i = 0; i < n; i++) { const x = hash(i, 1, s) * (W + 60) - 30, y = hash(i, 2, s) * (H + 20) - 10, l = largo * (0.6 + hash(i, 3, s) * 0.8); for (let j = 0; j < l; j++) k.crudo(x - j * ang, y + j, 1, 1, col); } });
    k.actores.push({ tipo: "lluvia", n: Math.round(n / 3), col, largo });
  }
  function rayo(k, x0, y0, x1, y1, { s = 1, col = "#ffffff", halo = "#9ad8ff", borde = null, ramas = 3, g = 1, quiebro = 0.22 } = {}) {
    const seg = (ax, ay, bx, by, n, sem, gg) => {
      const pts = [[ax, ay]];
      for (let i = 1; i < n; i++) { const t = i / n, l = Math.hypot(bx - ax, by - ay); pts.push([ax + (bx - ax) * t + (hash(i, 1, sem) - 0.5) * l * quiebro, ay + (by - ay) * t + (hash(i, 2, sem) - 0.5) * l * quiebro * 0.4]); }
      pts.push([bx, by]);
      for (let i = 1; i < pts.length; i++) {
        const [ax2, ay2] = pts[i - 1], [bx2, by2] = pts[i], m = Math.max(1, Math.ceil(Math.hypot(bx2 - ax2, by2 - ay2)));
        for (let j = 0; j <= m; j++) { const x = ax2 + (bx2 - ax2) * (j / m), y = ay2 + (by2 - ay2) * (j / m); if (borde) k.crudo(x - gg, y - gg, gg * 2 + 1, gg * 2 + 1, borde); else if (halo) { k.crudo(x - 1, y, 1, 1, halo); k.crudo(x + gg, y, 1, 1, halo); } }
        for (let j = 0; j <= m; j++) { const x = ax2 + (bx2 - ax2) * (j / m), y = ay2 + (by2 - ay2) * (j / m); k.crudo(x, y, gg, gg, col); }
      }
      return pts;
    };
    const tronco = seg(x0, y0, x1, y1, 7, s, g);
    for (let r = 0; r < ramas; r++) { const i = 1 + Math.floor(hash(r, 5, s) * (tronco.length - 2)), [ax, ay] = tronco[i], l = Math.hypot(x1 - x0, y1 - y0) * (0.25 + hash(r, 6, s) * 0.25), a = Math.atan2(y1 - y0, x1 - x0) + (hash(r, 7, s) - 0.5) * 1.8; seg(ax, ay, ax + Math.cos(a) * l, ay + Math.sin(a) * l, 4, s + r * 13, Math.max(1, g - 1)); }
  }
  function chispas(k, cx, cy, w, h, n = 40, s = 9) {
    for (let i = 0; i < n; i++) { const t = hash(i, 1, s), x = cx + (hash(i, 2, s) - 0.5) * w * (0.4 + t), y = cy - t * h; k.crudo(x, y, 1, 1, t < 0.4 ? "#fff0b0" : t < 0.75 ? "#ffb43a" : "#f06a24"); if (hash(i, 3, s) > 0.8) k.crudo(x + 1, y, 1, 1, "#c8361c"); }
    k.actores.push({ tipo: "chispas", x: cx, y: cy, w, h, n: Math.round(n / 3) });
  }
  function fulgor(k, cx, cy, r, cols, f = 0.6) {
    for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r); x <= cx + r; x++) {
      const d = Math.hypot(x - cx, y - cy) / r;
      if (d >= 1) continue;
      const v = Math.pow(1 - d, 1.6) * f * cols.length + Det.trama(x, y) * 0.999;
      const i = Math.floor(v) - 1;
      if (i >= 0) k.crudo(x, y, 1, 1, cols[Math.min(cols.length - 1, i)]);
    }
  }

  function jollyBarbanieve(k, cx, cy, e = 1, tela = "#f4f0e6", tinta = "#1c1c26") {
    trazo(k, [[cx - 20 * e, cy - 12 * e], [cx + 20 * e, cy + 18 * e]], tinta, 4 * e, 4 * e); trazo(k, [[cx + 20 * e, cy - 12 * e], [cx - 20 * e, cy + 18 * e]], tinta, 4 * e, 4 * e);
    [[-20, -12], [20, 18], [20, -12], [-20, 18]].forEach(([dx, dy]) => { k.elipse(cx + dx * e - 2 * e, cy + dy * e, 2.4 * e, 2.4 * e, tinta); k.elipse(cx + dx * e + 2 * e, cy + dy * e, 2.4 * e, 2.4 * e, tinta); });
    bola(k, cx, cy, 12 * e, 11.5 * e, () => tinta);
    rellena(k, [[cx - 9 * e, cy + 6 * e], [cx + 9 * e, cy + 6 * e], [cx + 6 * e, cy + 15 * e], [cx - 6 * e, cy + 15 * e]], () => tinta);
    [-1, 1].forEach((s) => k.elipse(cx + s * 5 * e, cy + 1 * e, 3.2 * e, 3.4 * e, tela));
    k.poli([[cx, cy + 5 * e], [cx - 1.6 * e, cy + 8 * e], [cx + 1.6 * e, cy + 8 * e]], tela);
    for (let a = 0.12; a < Math.PI - 0.12; a += 0.02) { const x = cx + Math.cos(a) * 15 * e * -1, y = cy + 6 * e + Math.sin(a) * 6 * e - Math.pow(Math.cos(a), 2) * 9 * e, g = (1 + Math.sin(a) * 2.6) * e; k.R(x - g / 2, y - g / 2, g, g, tela); }
  }
  function jollySank(k, cx, cy, e = 1, tela = "#f4f0e6", tinta = "#1c1c26") {
    trazo(k, [[cx - 14 * e, cy + 14 * e], [cx + 13 * e, cy - 8 * e]], tela, 1.6 * e); trazo(k, [[cx + 14 * e, cy + 14 * e], [cx - 13 * e, cy - 8 * e]], tela, 1.6 * e);
    bola(k, cx, cy, 7 * e, 6.5 * e, () => tela); k.R(cx - 4 * e, cy + 4 * e, 8 * e, 4 * e, tela);
    [-1, 1].forEach((s) => k.elipse(cx + s * 3 * e, cy, 1.6 * e, 1.8 * e, tinta));
    for (let i = 0; i < 3; i++) trazo(k, [[cx - 6 * e + i * 1.4 * e, cy - 4 * e], [cx - 3 * e + i * 1.4 * e, cy + 4 * e]], "#c8301e", Math.max(1, e * 0.8));
  }

  function casita(k, x, base, w, h, { techo = PAL.TEJA_R, s = 1, ventanas = [0.25], puerta = 0.65, ven = "#f2d27a", frente = false } = {}) {
    const top = base - h, a = frente ? Math.round(w * 0.42) : Math.round(h * 0.5) + 2;
    rellena(k, [[x, base], [x, top], [x + w, top], [x + w, base]], (px, py) => rampa(ENLUCIDO, 0.1 + ((px - x) / w) * 0.22 + (fbm(px * 0.25, py * 0.25, s) - 0.5) * 0.25 + Math.max(0, (py - base + 4) / 4) * 0.3, px, py));
    k.R(x + w - 1, top, 1, h, ENLUCIDO[4]);
    if (frente) {
      const pm = x + w / 2;
      for (let i = 0; i < a + 2; i++) { const f = i / (a + 2); [[x - 2 + (pm - x + 2) * f, top + 1 - a * f], [x + w + 2 - (x + w + 2 - pm) * f, top + 1 - a * f]].forEach(([px, py], l) => k.R(px - 1, py - 1, 2, 2, rampa(techo, 0.15 + l * 0.45, px, py))); }
      rellena(k, [[x + 1, top], [pm, top - a + 2], [x + w - 1, top]], (px, py) => rampa(ENLUCIDO, 0.2, px, py));
    } else {
      rellena(k, [[x - 3, top + 1], [x + 2, top - a], [x + w - 2, top - a], [x + w + 3, top + 1]], tejas(techo, { w: 4, h: 2, s, y0: top - a }));
      k.R(x - 3, top + 1, w + 6, 1, techo[4]);
    }
    ventanas.forEach((f) => { const vx = Math.round(x + w * f); k.R(vx - 1, top + 3, 5, 5, VIGA[2]); k.R(vx, top + 4, 3, 3, ven); k.P(vx + 1, top + 4, VIGA[1]); });
    if (puerta !== null) { const px = Math.round(x + w * puerta) - 2; k.R(px, base - 7, 4, 7, VIGA[2]); k.R(px, base - 7, 4, 1, VIGA[3]); }
    sombraE(k, x + w / 2 + 2, base + 1, w * 0.6, 2, 0.35);
  }
  function palmera(k, x, base, h, { inc = 0.2, s = 1, hoja = ["#a8dc78", "#82c05a", "#62a244", "#468434", "#2e6224"] } = {}) {
    const T = ["#d8b07a", "#b88e5a", "#966e42", "#74522e", "#523820"];
    for (let i = 0; i < h; i++) { const t = i / h, px = x + Math.sin(t * 1.8) * h * inc, g = 4 - t * 1.4; for (let j = 0; j < g; j++) k.P(px + j - g / 2, base - i, rampa(T, 0.08 + (j / g) * 0.62 + (i % 4 === 0 ? 0.28 : 0), px + j, base - i)); }
    const tx = x + Math.sin(1.8) * h * inc, ty = base - h;
    for (let i = 0; i < 9; i++) { const a = -Math.PI * 1.02 + (i / 8) * Math.PI * 1.04 + (hash(i, 1, s) - 0.5) * 0.2; Det6.fronda(k, tx, ty, Math.cos(a), Math.sin(a) * 0.5 - 0.15, 10 + hash(i, 2, s) * 5, hoja, { caida: 0.5, foliolo: 2.6 }); }
    k.elipse(tx, ty, 2.2, 1.6, T[3]);
  }

  window.OP14P = { PAL, LUZ, barril, caja, rollo, farol, jollyRoger, velaCuadra, verga, palo, oveja, mar, nieve, lluvia, rayo, chispas, fulgor, jollyBarbanieve, jollySank, casita, palmera };
})();

(function () {
  const { rampa, rellena, esfera, trama } = Det;
  const { bola, mezcla, hash, ruido, fbm, trazo, cuerda, madera, piedra, tejas, corteza, copa, briznas, sombraE, encendido } = Det6;
  const W = 320, H = 180;

  const tex = (pal, { v0 = 0.3, f = 0.08, g = 0.4, s = 1, dy = 0, y0 = 0, alto = 60, grano = 0.1, dx = 0, x0 = 0, ancho = 320 } = {}) => (x, y) =>
    rampa(pal, v0 + ((y - y0) / alto) * dy + ((x - x0) / ancho) * dx + (fbm(x * f, y * f * 1.6, s) - 0.5) * g + (hash(x, y, s) - 0.5) * grano, x, y);
  const rect = (k, x, y, w, h, fn) => rellena(k, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], fn);

  function ventana(k, x, y, w, h, { marco = "#5a3f2a", vidrio = "#ffd27a", cruz = true, alfeizar = null, arco = false, brillo = "#fff3cf" } = {}) {
    if (arco) { k.elipse(x + w / 2, y + w / 2, w / 2 + 1, w / 2 + 1, marco); k.elipse(x + w / 2, y + w / 2, w / 2, w / 2, vidrio); }
    k.R(x - 1, y + (arco ? w / 2 : -1), w + 2, h + 2 - (arco ? w / 2 : 0), marco);
    k.R(x, y + (arco ? w / 2 : 0), w, h - (arco ? w / 2 : 0), vidrio);
    if (cruz) { k.R(x + Math.floor(w / 2), y, 1, h, marco); if (h > 5) k.R(x, y + Math.floor(h * 0.45), w, 1, marco); }
    k.P(x, y + (arco ? w / 2 : 0), brillo);
    if (alfeizar) k.R(x - 2, y + h + 1, w + 4, 1, alfeizar);
  }
  function farola(k, x, base, alto = 26, { hierro = ["#5a5a66", "#3a3a44", "#24242c"], globo = "#ffd27a", r = 30 } = {}) {
    sombraE(k, x + 2, base, 5, 1.5, 0.4);
    k.R(x - 1, base - 3, 4, 3, hierro[1]); k.R(x, base - alto, 2, alto - 2, hierro[1]); k.P(x, base - alto, hierro[0]); k.R(x + 1, base - alto, 1, alto - 2, hierro[2]);
    k.R(x - 3, base - alto - 1, 8, 1, hierro[1]); k.R(x - 2, base - alto - 7, 6, 6, globo); k.R(x - 2, base - alto - 7, 1, 6, hierro[1]); k.R(x + 3, base - alto - 7, 1, 6, hierro[1]);
    k.R(x - 3, base - alto - 8, 8, 1, hierro[0]); k.R(x - 1, base - alto - 10, 4, 2, hierro[1]); k.P(x - 1, base - alto - 6, "#fff3cf");
    return { x: x + 1, y: base - alto - 4, r, ry: r * 0.75, col: "#ffcf7a", f: encendido(k) };
  }
  function gaviota(k, x, y, e = 1, col = "#f6f6f2", punta = "#7a8088") {
    trazo(k, [[x - 5 * e, y - 2 * e], [x - 2 * e, y], [x, y + 1]], col, 1); trazo(k, [[x + 5 * e, y - 2 * e], [x + 2 * e, y], [x, y + 1]], col, 1);
    k.P(x - 5 * e, y - 2 * e, punta); k.P(x + 5 * e, y - 2 * e, punta); k.P(x, y + 1, col); k.P(x + 1, y + 1, "#e8a040");
  }
  function banderines(k, x0, y0, x1, y1, cae, cols, { paso = 6, alto = 4, cuerdaCol = "#3a2a20" } = {}) {
    const n = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0)));
    let j = 0;
    for (let i = 0; i <= n; i++) {
      const t = i / n, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cae;
      k.P(x, y, cuerdaCol);
      if (i % paso === 0 && i < n - 2) { const c = cols[j++ % cols.length]; k.poli([[x, y + 1], [x + paso * 0.8, y + 1], [x + paso * 0.4, y + 1 + alto]], c); }
    }
  }
  function tejado(k, x0, x1, top, base, pal, s = 1, { vuelo = 3, alero = true } = {}) {
    rellena(k, [[x0 - vuelo, base], [x0 + 2, top], [x1 - 2, top], [x1 + vuelo, base]], tejas(pal, { w: 5, h: 3, s, y0: top }));
    for (let x = x0 + 2; x < x1 - 2; x++) { k.P(x, top, pal[0]); k.P(x, top - 1, pal[3]); }
    if (alero) { k.R(x0 - vuelo, base, x1 - x0 + vuelo * 2, 1, pal[4]); k.alfa(0.3, () => k.R(x0, base + 1, x1 - x0, 2, "#1a1008")); }
  }
  function tejadoJ(k, cx, y, w, h, pal, s = 1, puntas = 3) {
    const med = w / 2, pts = [];
    for (let i = 0; i <= 24; i++) { const u = -1 + (i / 24) * 2; pts.push([cx + u * med, y - puntas * Math.pow(Math.abs(u), 4)]); }
    for (let i = 24; i >= 0; i--) { const u = -1 + (i / 24) * 2; pts.push([cx + u * med * 0.62, y - h * (1 - Math.pow(Math.abs(u), 1.6) * 0.15)]); }
    rellena(k, pts, tejas(pal, { w: 4, h: 2, s, y0: y - h }));
    for (let i = 0; i < 24; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1]; trazo(k, [[ax, ay + 1], [bx, by + 1]], pal[4]); }
    k.R(cx - med * 0.62, y - h - 1, med * 1.24, 2, pal[4]); k.R(cx - med * 0.62 - 1, y - h - 3, 3, 3, pal[4]); k.R(cx + med * 0.62 - 2, y - h - 3, 3, 3, pal[4]);
  }
  function casa(k, x, base, w, h, { pared = ["#fffaf0", "#f6ecd6", "#eadcbc", "#d6c4a0", "#b8a07c"], techo = OP14P.PAL.TEJA_R, s = 1, ventanas = [0.22, 0.7], puerta = 0.45, ven = "#ffd27a", marco = "#5a3f2a", alto = null, pisos = 1, chimenea = false, frente = false, contra = null } = {}) {
    const top = base - h, a = alto ?? Math.round(Math.min(w * 0.36, 14));
    rect(k, x, top, w, h, (px, py) => rampa(pared, 0.08 + ((px - x) / w) * 0.26 + (fbm(px * 0.25, py * 0.25, s) - 0.5) * 0.22 + Math.max(0, (py - base + 4) / 4) * 0.3, px, py));
    k.R(x + w - 1, top, 1, h, pared[4]); k.R(x, top, 1, h, pared[0]);
    if (chimenea) { rect(k, x + w * 0.7, top - a - 4, 4, a, (px, py) => rampa(["#c88466", "#a86448", "#884c36", "#5e3424"], 0.2 + (px - x - w * 0.7) * 0.15 + (py % 3 === 0 ? 0.3 : 0), px, py)); k.R(x + w * 0.7 - 1, top - a - 5, 6, 2, "#4a3a34"); }
    if (frente) {
      const pm = x + w / 2;
      rellena(k, [[x - 2, top + 1], [pm, top - a], [x + w + 2, top + 1]], tejas(techo, { w: 4, h: 2, s, y0: top - a }));
      rellena(k, [[x + 2, top], [pm, top - a + 3], [x + w - 2, top]], (px, py) => rampa(pared, 0.2, px, py));
      trazo(k, [[x - 3, top + 1], [pm, top - a - 1], [x + w + 3, top + 1]], techo[4], 1);
    } else tejado(k, x, x + w, top - a, top + 1, techo, s, { vuelo: 3 });
    const vs = [];
    for (let p = 0; p < pisos; p++) ventanas.forEach((f) => { const vx = Math.round(x + w * f), vy = top + 3 + p * Math.round((h - 4) / pisos); if (p === pisos - 1 && puerta !== null && Math.abs(vx - (x + w * puerta)) < 6) return; ventana(k, vx, vy, 4, 5, { marco, vidrio: ven, alfeizar: pared[4] }); if (contra) { k.R(vx - 3, vy - 1, 2, 7, contra); k.R(vx + 5, vy - 1, 2, 7, contra); } vs.push([vx + 2, vy + 3]); });
    if (puerta !== null) { const px = Math.round(x + w * puerta) - 2; k.R(px - 1, base - 9, 7, 9, marco); rect(k, px, base - 8, 5, 8, madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 2, vertical: true, largo: 99, s: s + 3 })); k.P(px + 4, base - 4, "#e8c35a"); }
    sombraE(k, x + w / 2 + 2, base + 1, w * 0.6, 2, 0.35);
    return vs;
  }
  function prado(k, y0, pal, s = 1, { y1 = H, flores = null, n = 360, x0 = 0, x1 = W, perfil = null } = {}) {
    const top = (x) => (perfil ? perfil(x) : y0);
    for (let x = x0; x < x1; x++) for (let y = Math.round(top(x)); y < y1; y++) k.P(x, y, rampa(pal, 0.1 + ((y - y0) / (y1 - y0)) * 0.36 + (fbm(x * 0.07, y * 0.18, s) - 0.5) * 0.36 + (hash(x, y, s) - 0.5) * 0.1, x, y));
    briznas(k, x0, x1, perfil || y0, [pal[pal.length - 1], pal[3] || pal[2], pal[1]], { n, alto: 4, s: s + 1, y1 });
    if (flores) for (let i = 0; i < flores.n; i++) { const x = x0 + hash(i, 1, s + 2) * (x1 - x0), y = Math.max(top(x) + 3, y0 + 4 + hash(i, 2, s + 2) * (y1 - y0 - 4)), c = flores.cols[i % flores.cols.length]; k.P(x, y, c); k.P(x + 1, y, c); k.P(x, y - 1, "#fff6c0"); }
  }
  function burbuja(k, x, y, r) {
    for (let a = 0; a < Math.PI * 2; a += 0.6 / Math.max(2, r)) { const px = x + Math.cos(a) * r, py = y + Math.sin(a) * r, c = ["#ffffff", "#e8f8ff", "#f8e8ff", "#e8fff0"][Math.floor((a / (Math.PI * 2)) * 8) % 4]; k.alfa(a > 0.6 && a < 2.6 ? 0.9 : 0.55, () => k.P(px, py, c)); }
    k.alfa(0.12, () => k.elipse(x, y, r - 1, r - 1, "#ffffff"));
    k.P(x - r * 0.45, y - r * 0.45, "#ffffff"); if (r > 4) { k.P(x - r * 0.45 + 1, y - r * 0.45, "#ffffff"); k.P(x - r * 0.45, y - r * 0.45 + 1, "#ffffff"); }
  }
  function antorcha(k, x, y, { r = 26 } = {}) {
    k.R(x - 1, y, 3, 6, "#3a2a20"); k.R(x - 2, y + 5, 5, 2, "#24242c"); k.R(x - 2, y - 1, 5, 2, "#24242c");
    Det6.fuego(k, x + 0.5, y - 1, 5, 8, { s: Math.round(x * 7 + y) });
    return { x, y: y - 4, r, ry: r * 0.8, col: "#ffb45a", f: 1 };
  }
  function cadena(k, x, y0, y1, col = ["#8a8a96", "#5a5a66", "#34343c"]) { for (let y = y0, i = 0; y < y1; y += 3, i++) { if (i % 2) { k.R(x - 1, y, 3, 3, col[1]); k.P(x, y + 1, col[2]); k.P(x - 1, y, col[0]); } else { k.R(x, y, 1, 3, col[0]); k.P(x, y + 2, col[2]); } } }
  function canon(k, x, base, dir = 1, e = 1) {
    sombraE(k, x + 2, base, 14 * e, 2.5, 0.45);
    const BR = ["#5a5a62", "#44444c", "#30303a", "#1e1e26"];
    for (let i = 0; i < 22 * e; i++) { const px = x + dir * (i - 6 * e), r = (4.2 - i * 0.07 / e) * e; for (let j = -r; j <= r; j++) k.P(px, base - 9 * e - i * 0.25 * e + j, rampa(BR, 0.15 + (j / r + 1) * 0.4, px, base - 9 * e + j)); }
    k.elipse(x + dir * 16 * e, base - 13 * e, 2 * e, 3 * e, "#141418");
    rect(k, x - 8 * e, base - 7 * e, 16 * e, 5 * e, madera(OP14P.PAL.MAD_O, { paso: 3, largo: 99, s: 77 }));
    [-5, 5].forEach((d) => { k.elipse(x + d * e, base - 2 * e, 3 * e, 3 * e, "#3a2a20"); k.elipse(x + d * e, base - 2 * e, 1, 1, "#8a8a96"); });
  }
  function mesa(k, x, base, { mantel = ["#ffffff", "#f2eee4", "#dcd6c8", "#b8b0a0"], r = 12 } = {}) {
    sombraE(k, x + 3, base + 1, r + 3, 2.5, 0.45);
    k.R(x - 1, base - 9, 3, 9, "#4a3020"); k.R(x - 4, base - 1, 9, 1, "#3a2414");
    bola(k, x, base - 11, r, 3, (px, py) => rampa(mantel, 0.1 + ((px - x) / r) * 0.25 + (py - base + 11) * 0.12, px, py));
    rellena(k, [[x - r, base - 11], [x + r, base - 11], [x + r - 1, base - 6], [x - r + 1, base - 6]], (px, py) => rampa(mantel, 0.3 + ((px - x) / r) * 0.35 + ((px & 3) === 0 ? 0.15 : 0), px, py));
    k.elipse(x - 5, base - 12, 3, 1, "#f8f8ff"); k.elipse(x + 5, base - 12, 3, 1, "#f8f8ff"); k.P(x - 5, base - 12, "#e8a040"); k.P(x + 5, base - 12, "#c84a2a");
    k.R(x, base - 17, 2, 6, "#3f7a4a"); k.R(x, base - 18, 2, 1, "#2a5a34"); k.P(x, base - 16, "#a8e0b0");
  }
  function barcoLejos(k, x, y, { casco = ["#8a5a32", "#6a4224", "#4a2c16"], vela = ["#fffaf0", "#e6dbc2", "#c8b896"], bandera = "#1c1c22", e = 1 } = {}) {
    rellena(k, [[x - 12 * e, y - 3 * e], [x + 12 * e, y - 3 * e], [x + 9 * e, y + 2 * e], [x - 10 * e, y + 2 * e]], (px, py) => rampa(casco, ((py - y + 3 * e) / (5 * e)) * 0.9, px, py));
    [[-5, 16], [4, 19]].forEach(([dx, a]) => { k.R(x + dx * e, y - a * e, 1, a * e - 3 * e, "#4a3020"); rellena(k, [[x + dx * e - 5 * e, y - (a - 2) * e], [x + dx * e + 5 * e, y - (a - 2) * e], [x + dx * e + 6 * e, y - 6 * e], [x + dx * e - 6 * e, y - 6 * e]], (px, py) => rampa(vela, Math.abs(px - x - dx * e) / (6 * e) * 0.8, px, py)); });
    k.R(x + 4 * e, y - 22 * e, 4 * e, 2 * e, bandera);
  }

  window.P15 = { tex, rect, ventana, farola, gaviota, banderines, tejado, tejadoJ, casa, prado, burbuja, antorcha, cadena, canon, mesa, barcoLejos };
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, humo, rotulo } = Det;
  const { bola, mezcla, encendido, hash, ruido, fbm, celdas, tramos, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego } = Det6;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);
  const LUZ = "#ffcf7a", VEN = "#ffd27a";
  const MAD = ["#c89c6c", "#a87e52", "#8a643e", "#6c4c2c", "#4e341e", "#342212"], HIERRO = ["#a0a0ac", "#74747e", "#4e4e58", "#30303a"];
  const VERDE = ["#b4dc84", "#94c46a", "#78aa54", "#5e8e42", "#467232", "#305424"];

  function ventana(k, x, y, w = 6, h = 7, marco = MAD[4]) { k.R(x - 1, y - 1, w + 2, h + 2, marco); k.R(x, y, w, h, VEN); k.R(x + Math.floor(w / 2), y, 1, h, marco); k.R(x, y + Math.floor(h / 2), w, 1, marco); k.P(x, y, "#fff3cf"); }

  function madriguera(k) {
    const { h } = cuando(k), lit = encendido(k);
    k.banda(["#5aa0dc", "#88bee6", "#bcdcec", "#e8eedc"], 0, 112);
    nubarron(k, -20, 30, 92, 15); nubarron(k, 236, 22, 96, 15); cirros(k, 5, 4, 26);
    rellena(k, [[-2, 112], [-2, 90], [50, 84], [110, 92], [170, 86], [230, 80], [290, 88], [322, 84], [322, 112]], (x, y) => rampa(["#a8c8a0", "#94b88c", "#80a678"], 0.1 + ((y - 80) / 32) * 0.6 + (ruido(x * 0.05, y * 0.2, 3) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 14; i++) { const x = 10 + i * 23 + hash(i, 1, 4) * 10, y = 90 + hash(i, 2, 4) * 6; copa(k, x, y - 3, 5, 4, ["#9cc084", "#84aa6e", "#6c925a", "#567a48", "#40603a"], { r: 2.4, s: 40 + i }); }
    rellena(k, [[-2, 118], [-2, 104], [70, 98], [150, 106], [210, 100], [270, 96], [322, 102], [322, 118]], (x, y) => rampa(["#9cc47c", "#86b068", "#709c56", "#5c8646"], 0.1 + ((y - 96) / 22) * 0.6 + (ruido(x * 0.07, y * 0.2, 5) - 0.5) * 0.3, x, y));
    rellena(k, [[-2, 114], [322, 114], [322, 180], [-2, 180]], (x, y) => rampa(VERDE, 0.15 + ((y - 114) / 66) * 0.35 + (fbm(x * 0.07, y * 0.18, 6) - 0.5) * 0.4 + (hash(x, y, 6) - 0.5) * 0.12, x, y));
    const PIE = ["#d8ccb4", "#c4b69a", "#aa9a7e", "#8e7e64", "#70624c"], ENL = ["#f2e2c4", "#e4d0ac", "#d0b890", "#b89c74", "#987c58"], TAB = ["#d4a070", "#bc8656", "#a06e42", "#845832", "#664024"];
    const TEJ = ["#d8704a", "#bc5434", "#9c4028", "#7a2e1c", "#561e12"];
    const pisos = [[124, 132, 58, 24, PIE, "piedra", 0], [126, 108, 52, 20, ENL, "enlucido", 3], [130, 88, 44, 18, TAB, "tablas", -4], [134, 70, 34, 16, ENL, "enlucido", 4], [138, 54, 26, 14, TAB, "tablas", -2]];
    [[132, 40, 30], [172, 76, 18], [158, 22, 18]].forEach(([x, y, a], i) => { rellena(k, [[x, y], [x + 6, y], [x + 6 + (i - 1), y + a], [x + (i - 1), y + a]], ladrillo(["#c47c5c", "#a86246", "#8a4c36", "#663624"], { w: 4, h: 2, s: 10 + i })); k.R(x - 1, y - 2, 8, 2, "#5a463c"); humo(k, x + 3, y - 4, "#e8e4dc", 0.45, 6); });
    pisos.forEach(([x, base, w, hh, pal, mat, inc], i) => {
      const top = base - hh, pts = [[x, base], [x + inc, top], [x + w + inc, top], [x + w, base]];
      const col = mat === "piedra" ? piedra(pal, { tx: 6, ty: 4, s: 20 + i }) : mat === "tablas" ? madera(pal, { paso: 3, largo: 30, s: 20 + i, veta: 0.5 }) : (px, py) => rampa(pal, 0.15 + (fbm(px * 0.2, py * 0.2, 20 + i) - 0.5) * 0.3 + ((px - x) / w) * 0.2, px, py);
      rellena(k, pts, col);
      trazo(k, [[x + w, base], [x + w + inc, top]], pal[4]); k.R(Math.min(x, x + inc), base - 1, w + Math.abs(inc), 1, pal[4]);
      const vs = w > 40 ? [0.14, 0.44, 0.72] : w > 28 ? [0.2, 0.65] : [0.38];
      vs.forEach((f) => ventana(k, Math.round(x + w * f + inc * 0.5), top + 4, 6, Math.min(8, hh - 8)));
      if (i > 0) { rellena(k, [[x - 3 + inc, top + 1], [x + w + 3 + inc, top + 1], [x + w + 1 + inc, top - 2], [x - 1 + inc, top - 2]], (px, py) => rampa(TEJ, 0.2 + (py - top + 2) / 3 * 0.5, px, py)); }
    });
    rellena(k, [[132, 41], [170, 41], [152, 16]], tejas(TEJ, { w: 4, h: 3, s: 30, y0: 16 })); trazo(k, [[152, 16], [170, 41]], TEJ[4]); k.R(132, 41, 38, 1, TEJ[4]);
    ventana(k, 148, 30, 5, 6);
    rellena(k, [[176, 92], [198, 90], [198, 74], [176, 74]], madera(TAB, { paso: 3, largo: 30, s: 31, veta: 0.5 })); ventana(k, 186, 78, 6, 7); rellena(k, [[174, 74], [200, 74], [194, 64], [180, 64]], tejas(TEJ, { w: 4, h: 2, s: 32, y0: 64 }));
    trazo(k, [[196, 92], [200, 132]], MAD[3], 2, 2); trazo(k, [[180, 92], [196, 112]], MAD[3], 1, 1);
    rellena(k, [[100, 132], [100, 112], [124, 104], [124, 132]], madera(MAD, { paso: 4, vertical: true, largo: 99, s: 33, veta: 0.5 })); rellena(k, [[96, 113], [126, 102], [126, 106], [96, 117]], (px, py) => rampa(TEJ, 0.3, px, py));
    ventana(k, 106, 118, 6, 6);
    k.R(147, 114, 14, 18, MAD[5]); rellena(k, [[148, 132], [148, 116], [160, 116], [160, 132]], madera(["#6a8a4a", "#567a3c", "#44662e", "#345222", "#243c16"], { paso: 2, vertical: true, largo: 99, s: 34 })); k.P(158, 124, "#e8c35a");
    k.R(144, 112, 20, 2, TEJ[2]); k.R(145, 114, 1, 18, MAD[3]); k.R(162, 114, 1, 18, MAD[3]); k.R(143, 132, 22, 2, PIE[2]);
    trazo(k, [[86, 150], [88, 128]], MAD[3], 2, 2); rellena(k, [[72, 128], [104, 124], [105, 133], [73, 137]], madera(["#e8d8b0", "#d8c49a", "#c4ac80", "#a89068", "#8a7450"], { paso: 3, largo: 99, s: 35, veta: 0.3 }));
    rotulo(k, 76, 129, "THE BURROW", "#5a3a22");
    rellena(k, [[222, 134], [222, 114], [252, 114], [252, 134]], madera(MAD, { paso: 3, vertical: true, largo: 99, s: 36, veta: 0.5 })); rellena(k, [[218, 115], [256, 115], [250, 106], [224, 106]], tejas(["#9a8a7a", "#847466", "#6e6054", "#584c42", "#423830"], { w: 4, h: 2, s: 37, y0: 106 }));
    k.R(232, 120, 10, 14, MAD[5]); trazo(k, [[244, 133], [248, 116]], "#a8845a"); for (let i = 0; i < 5; i++) k.R(247 + i * 0.3, 114 + i, 1, 4, "#c8a050");
    sombraE(k, 240, 135, 18, 2.5, 0.4);
    [[26, 124], [62, 124]].forEach(([x, y]) => { k.R(x, y - 26, 2, 26, MAD[3]); k.R(x, y - 26, 1, 26, MAD[1]); });
    cuerda(k, 27, 100, 63, 100, 4, "#e8e0d0", null);
    [[34, "#c0392b"], [42, "#2f6fa8"], [52, "#e8c35a"], [58, "#8a5ab8"]].forEach(([x, c], i) => { const y = 101 + Math.sin(((x - 27) / 36) * Math.PI) * 4; k.R(x, y, 5, 7 + (i % 2), c); k.R(x, y, 5, 1, mezcla(c, "#ffffff", 0.3)); k.R(x + 4, y, 1, 7 + (i % 2), mezcla(c, "#000000", 0.3)); });
    [[250, 156], [272, 162], [44, 168]].forEach(([x, y]) => { sombraE(k, x + 1, y + 3, 5, 1.2, 0.4); esfera(k, x, y, 4, 3, ["#fffaf0", "#f0e8d8", "#d8ccb8"]); esfera(k, x + 3, y - 3, 2, 2, ["#fffaf0", "#f0e8d8", "#d8ccb8"]); k.P(x + 5, y - 3, "#e8a82a"); k.P(x + 3, y - 5, "#c0392b"); k.R(x - 1, y + 3, 1, 2, "#e8a82a"); k.R(x + 1, y + 3, 1, 2, "#e8a82a"); });
    [[110, 152], [212, 172]].forEach(([x, y]) => { sombraE(k, x + 1, y, 4, 1, 0.4); k.R(x - 2, y - 6, 5, 6, "#a87e5a"); esfera(k, x, y - 8, 3, 3, ["#e0c0a0", "#c8a888", "#a88868"]); k.P(x - 3, y - 9, "#c8a888"); k.P(x + 3, y - 9, "#c8a888"); k.P(x - 1, y - 9, "#26262a"); k.P(x + 1, y - 9, "#26262a"); });
    for (let y = 134; y < H; y++) { const f = (y - 134) / 46, c = 154 - f * 30, w = 6 + f * 18; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#e2d0a4", "#d0bc8c", "#b8a274", "#9c865c"], 0.2 + (Math.abs(x - c) / w) * 0.4 + (fbm(x * 0.2, y * 0.3, 38) - 0.5) * 0.4, x, y)); }
    bola(k, 280, 150, 26, 8, (x, y) => rampa(["#7aa8c8", "#5a8cb0", "#44729a", "#325a7e"], 0.2 + ((y - 142) / 16) * 0.6, x, y)); espejo(k, 143, 143, 158, { x0: 254, x1: 306, mezcla: 0.5, tinte: "#3a6488", onda: 1, dentro: (x, y) => Math.hypot((x - 280) / 26, (y - 150) / 8) < 1 });
    for (let i = 0; i < 12; i++) { const x = 256 + i * 4.5, y = 147 + Math.sin(i) * 3; trazo(k, [[x, y + 6], [x + (i % 2 ? 1 : -1), y - 6]], i % 2 ? "#6a8a3a" : "#4e7030"); if (i % 3 === 0) k.R(x, y - 8, 2, 3, "#6a4a2a"); }
    [[62, 150], [90, 160], [196, 152]].forEach(([x, y]) => { sombraE(k, x + 2, y + 5, 7, 1.5, 0.4); esfera(k, x, y, 6, 5, ["#ffb050", "#f08a2a", "#c86a1a", "#9a4e10"]); [-2, 1, 3].forEach((dd) => k.R(x + dd, y - 4, 1, 9, "#b85e14")); k.R(x - 1, y - 7, 2, 3, "#4a7a3a"); });
    briznas(k, 0, W, 118, [VERDE[5], VERDE[3], VERDE[1]], { n: 420, alto: 4, s: 39, y1: 180 });
    luces(k, [{ x: 154, y: 100, r: 76, ry: 70, col: LUZ, f: lit * 0.75, p: 1.3 }, { x: 154, y: 124, r: 40, ry: 24, col: LUZ, f: lit }]);
  }

  function bosquePro(k) {
    const { h } = cuando(k), dia = !k.luz || (k.luz.h >= 7 && k.luz.h <= 18);
    const CO = ["#7a6a5a", "#5c4e42", "#463a30", "#302820", "#1e1812"], HO = ["#5e8a5a", "#486e46", "#365636", "#264028", "#182a1a"], MUSGO = ["#86a85a", "#6a8c46", "#507036", "#385226"];
    k.banda(["#3e5a4a", "#4a6a56", "#587a62"], 0, 150);
    for (let i = 0; i < 11; i++) { const x = hash(i, 1, 50) * 320, w = 6 + hash(i, 2, 50) * 8; rellena(k, [[x, 0], [x + w, 0], [x + w + 1, 152], [x - 1, 152]], corteza(["#5e7466", "#526a5c", "#466052", "#3c5448"], x, w, { s: 50 + i })); }
    bruma(k, 30, 150, "#a8c4b0", 0.8, { s: 51, ex: 0.03, ey: 0.06, perfil: () => 0.75 });
    const tronco = (x, w, s, inc) => {
      for (let y = -2; y < 150; y++) {
        const t = y / 150, o = Math.sin(y / 23 + s) * 5 + inc * t * 10, a = w / 2 + (y > 120 ? Math.pow((y - 120) / 30, 2) * 14 : 0);
        for (let px = Math.round(x + o - a); px <= x + o + a; px++) k.P(px, y, corteza(CO, x + o - a, 2 * a, { s, musgo: { pal: MUSGO, umbral: 0.6 }, grieta: 0.6 })(px, y));
      }
      k.elipse(x + Math.sin(80 / 23 + s) * 5 + inc * 5, 80, 3, 4, CO[4]);
      [[-1, 46], [1, 30]].forEach(([sd, y]) => trazo(k, [[x + sd * w * 0.3, y], [x + sd * (w + 16), y - 18], [x + sd * (w + 30), y - 24]], (f, px, py) => rampa(CO, 0.3 + f * 0.4, px, py), 5, 2));
      [[-20, 160], [-8, 164], [w * 0.6 + 6, 164], [w * 0.6 + 18, 160]].forEach(([dd, yy], i) => trazo(k, [[x + (dd < 0 ? -w * 0.25 : w * 0.25), 140], [x + dd * 0.6, 152], [x + dd, yy]], (f, px, py) => rampa(CO, 0.25 + f * 0.4, px, py), 5, 2));
    };
    tronco(16, 30, 52, 0.3); tronco(84, 22, 53, -0.4); tronco(232, 26, 54, 0.4); tronco(300, 34, 55, -0.3);
    copa(k, 50, 6, 74, 24, HO, { r: 7, s: 56 }); copa(k, 270, 6, 76, 24, HO, { r: 7, s: 57 }); copa(k, 160, -6, 60, 18, HO, { r: 6, s: 58 });
    [[40, 22, 26], [102, 18, 20], [222, 20, 30], [286, 24, 22]].forEach(([x, y, l]) => { for (let j = 0; j < l; j++) { k.P(x + Math.sin(j / 5) * 1.5, y + j, j % 4 ? "#7a9a5a" : "#5e7e46"); if (j % 3 === 0) k.P(x + 1 + Math.sin(j / 5) * 1.5, y + j, "#9aba6a"); } });
    if (dia) rayos(k, [[150, 0, 132, 156, 8, 36], [196, 0, 214, 156, 6, 26], [120, 0, 90, 150, 4, 18]], "#ffe8b0", 0.42);
    rellena(k, [[-2, 148], [322, 148], [322, 180], [-2, 180]], (x, y) => rampa(["#6a7a46", "#56663a", "#44542e", "#344224", "#26321a"], 0.25 + ((y - 148) / 32) * 0.2 + (fbm(x * 0.1, y * 0.25, 59) - 0.5) * 0.5 + (hash(x, y, 59) - 0.5) * 0.14, x, y));
    for (let y = 146; y < H; y++) { const f = (y - 146) / 34, c = 160 + Math.sin(f * 3) * 12, w = 4 + f * 20; for (let x = Math.round(c - w); x <= c + w; x++) if (hash(x, y, 60) > 0.15) k.P(x, y, rampa(["#a08a64", "#8a7452", "#745e42", "#5e4a34"], 0.2 + (Math.abs(x - c) / w) * 0.5 + (fbm(x * 0.2, y * 0.3, 60) - 0.5) * 0.4, x, y)); }
    for (let i = 0; i < 70; i++) { const x = hash(i, 1, 61) * W, y = 150 + hash(i, 2, 61) * 30; k.R(x, y, 2, 1, ["#a87a3a", "#8a6a2a", "#c8943a"][i % 3]); }
    [[24, 178], [298, 178], [110, 172], [206, 176], [60, 166], [262, 168]].forEach(([x, y], i) => { for (let j = 0; j < 7; j++) { const a = -Math.PI * 0.95 + (j / 6) * Math.PI * 0.9; fronda(k, x, y, Math.cos(a), Math.sin(a) * 0.8, 11 + (i % 3) * 4, ["#8aba6a", "#6a9a54", "#507e40", "#3a622e"], { caida: 0.5, foliolo: 3 }); } });
    [[52, 160], [190, 166], [272, 158], [128, 170]].forEach(([x, y]) => { k.R(x, y - 4, 2, 4, "#c8e0d8"); bola(k, x + 1, y - 5, 4, 2.5, (px, py) => (py > y - 4 ? null : "#5ae8c8")); k.crudo(x, y - 6, 1, 1, "#c8fff0"); });
    [[46, 60], [254, 70]].forEach(([x, y]) => { for (let a = 0; a < 6.28; a += 0.785) trazo(k, [[x, y], [x + Math.cos(a) * 13, y + Math.sin(a) * 13]], "#c8d0c8"); for (let r = 4; r < 13; r += 3) for (let a = 0; a < 6.28; a += 0.18) k.P(x + Math.cos(a) * r, y + Math.sin(a) * r, "#a8b0a8"); });
    [[120, 108], [204, 116], [286, 96]].forEach(([x, y]) => { k.crudo(x, y, 2, 1, "#d8e86a"); k.crudo(x + 5, y, 2, 1, "#d8e86a"); });
    if (h === 18) {
      const x = 176, y = 152, U = ["#ffffff", "#f0f4ff", "#d8e0f0"];
      Det.brillo(k, x, y - 12, 34, 26, "#f4f8ff", 0.9); luces(k, [{ x, y: y - 12, r: 46, ry: 34, col: "#e8f0ff", f: 0.8 }]);
      k.alfa(0.35, () => k.elipse(x, y + 1, 14, 1.5, "#1e2a1a"));
      esfera(k, x, y - 14, 13, 7, U); [[-9, 0], [-5, 1], [6, 0], [10, 1]].forEach(([dx]) => k.R(x + dx, y - 9, 2, 10, U[1]));
      trazo(k, [[x + 10, y - 18], [x + 15, y - 26]], U[0], 5, 4); esfera(k, x + 17, y - 28, 5, 3.5, U); trazo(k, [[x + 18, y - 31], [x + 22, y - 39]], "#ffe8a0");
      trazo(k, [[x + 9, y - 22], [x + 6, y - 14]], "#e8eeff", 2, 1); trazo(k, [[x - 13, y - 15], [x - 18, y - 6]], "#e8eeff", 2, 1);
    }
    bruma(k, 140, 180, "#c8dcd0", 0.45, { s: 62, ex: 0.03, ey: 0.12 });
  }

  function castillo(k, base, { quemado = false, s = 1 } = {}) {
    const P = ["#a8a4b0", "#8c8898", "#74707e", "#5c5866", "#46424e", "#322e3a"], T = ["#5a6290", "#444a74", "#343a5c", "#262a44", "#1a1e32"];
    const muro = (pts, l = 0) => rellena(k, pts, (x, y) => { const c = celdas(x, y, 5, 3, s, 0.6); return rampa(P, 0.25 + l + (c.borde < 0.1 ? 0.22 : 0) + (c.id - 0.5) * 0.18 + (ruido(x * 0.1, y * 0.1, s) - 0.5) * 0.2, x, y); });
    const torre = (x, w, alto, cono, l = 0) => {
      rellena(k, [[x, base], [x, base - alto], [x + w, base - alto], [x + w, base]], (px, py) => { const c = celdas(px, py, 4, 3, s + x, 0.6); return rampa(P, 0.15 + l + Math.pow(Math.abs((px - x) / w - 0.3) / 0.7, 1.2) * 0.5 + (c.borde < 0.1 ? 0.18 : 0), px, py); });
      for (let y = base - alto + 6; y < base - 8; y += 10) { k.R(x + w / 2 - 1, y, 2, 4, VEN); k.R(x + w / 2 - 1, y - 1, 2, 1, P[5]); }
      for (let i = 0; i < cono; i++) { const a = ((cono - i) / cono) * (w / 2 + 2), y = base - alto - i; for (let px = Math.round(x + w / 2 - a); px <= x + w / 2 + a; px++) k.P(px, y, rampa(T, 0.1 + ((px - x - w / 2 + a) / (2 * a + 0.01)) * 0.75 + (i % 3 === 0 ? 0.1 : 0), px, y)); }
      k.R(x - 1, base - alto, w + 2, 1, P[5]);
    };
    rellena(k, [[20, base + 22], [40, base - 2], [80, base - 6], [140, base - 2], [210, base - 4], [262, base], [300, base + 22]], (x, y) => rampa(["#6a6a74", "#56565e", "#44444c", "#34343a", "#26262c"], 0.3 + Math.sin(y / 3 + Math.sin(x / 17) * 2) * 0.15 + (ruido(x * 0.3, y * 0.1, s) > 0.74 ? 0.2 : 0), x, y));
    muro([[52, base], [52, base - 30], [268, base - 30], [268, base]]); for (let x = 52; x < 268; x += 6) k.R(x, base - 34, 3, 4, P[3]);
    torre(60, 12, 48, 20); torre(98, 12, 64, 24); torre(220, 12, 70, 26); torre(254, 11, 52, 20);
    muro([[110, base - 30], [110, base - 58], [196, base - 58], [196, base - 30]], -0.05);
    rellena(k, [[104, base - 58], [202, base - 58], [192, base - 76], [114, base - 76]], (x, y) => rampa(T, 0.1 + ((x - 104) / 98) * 0.6 + (Math.round(y) % 3 === 0 ? 0.12 : 0), x, y));
    for (let x = 116; x < 192; x += 11) { k.elipse(x + 3, base - 50, 3, 3, P[5]); k.R(x, base - 50, 6, 14, P[5]); k.elipse(x + 3, base - 50, 2, 2, VEN); k.R(x + 1, base - 50, 4, 13, VEN); k.R(x + 3, base - 52, 1, 15, P[5]); }
    torre(84, 18, 76, 26, -0.02); torre(140, 20, 86, 26); torre(176, 16, 82, 24); torre(232, 20, 86, 28); torre(122, 12, 62, 22); torre(204, 12, 60, 22);
    for (let x = 30; x < 52; x += 7) { k.R(x, base - 10, 7, 10, P[3]); k.elipse(x + 3.5, base - 4, 2.5, 4, P[5]); }
    for (let x = 56; x < 262; x += 11) k.R(x, base - 22, 3, 5, VEN);
  }
  function batalla(k) {
    const { h } = cuando(k), amanece = h === 23;
    k.banda(amanece ? ["#3a3e5a", "#6a5a6a", "#b4806a", "#f0b07a", "#ffd8a0"] : ["#1e1c2c", "#36283a", "#5a3236", "#8a4430", "#c06a34"], 0, 128);
    if (amanece) { Det.brillo(k, 292, 62, 60, 46, "#ffe6a8", 0.9); k.elipse(292, 62, 14, 14, "#ffe6a8"); k.elipse(292, 62, 11, 11, "#fff4d0"); }
    const HU = amanece ? ["#8a7a80", "#6a5e66", "#4e464e"] : ["#4a3e46", "#342c34", "#241e26"];
    nubarron(k, -24, 18, 130, 16, HU); nubarron(k, 196, 12, 150, 18, HU);
    if (!amanece) k.actores.push({ tipo: "hechizos", caja: [24, 8, 296, 110], colores: ["#3fe87a", "#e83a3a", "#6ac8ff"], escudo: "#9ad8ff" });
    Det.montana(k, 40, 128, 200, 44, { roca: ["#2e2c3c", "#24222e", "#1e1c28", "#16141e"] }); Det.montana(k, 284, 128, 200, 48, { roca: ["#2e2c3c", "#24222e", "#1e1c28", "#16141e"] });
    castillo(k, 120, { quemado: !amanece, s: 3 });
    [[96, 52, 10], [150, 44, 12], [228, 40, 10], [176, 60, 8]].forEach(([x, y, r]) => { bola(k, x, y, r, r * 0.8, (px, py) => (fbm(px * 0.3, py * 0.3, 7) > 0.35 ? (py > y ? "#2a1a18" : "#1a1214") : null)); });
    if (!amanece) { pluma(k, 96, 52, 50, 16, ["#6a5258", "#523e46", "#3c2e36", "#2a2028"], { s: 8, viento: 0.3 }); pluma(k, 150, 44, 40, 18, ["#6a5258", "#523e46", "#3c2e36", "#2a2028"], { s: 9, viento: 0.4 }); pluma(k, 230, 42, 40, 16, ["#6a5258", "#523e46", "#3c2e36", "#2a2028"], { s: 10, viento: 0.35 }); }
    if (!amanece) [[96, 62, 14, 16], [150, 54, 12, 14], [228, 52, 14, 18], [176, 68, 10, 12], [118, 96, 12, 12], [212, 100, 10, 12]].forEach(([x, y, w, hh], i) => fuego(k, x, y, w, hh, { s: 70 + i }));
    rellena(k, [[-2, 124], [322, 124], [322, 180], [-2, 180]], (x, y) => { const c = celdas(x, (y - 124) * 2 + 124, 16, 14, 11, 0.7); return c.borde < 0.07 ? "#26242a" : rampa(["#8a8690", "#74707a", "#5e5a64", "#4a4650", "#36323c"], 0.3 + (c.id - 0.5) * 0.3 + ((y - 124) / 56) * 0.15 + (hash(x, y, 11) - 0.5) * 0.1, x, y); });
    const RO = ["#9a96a0", "#7e7a86", "#66626e", "#4e4a56", "#38343e"];
    [[10, 152, 42, 22], [66, 172, 34, 14], [240, 160, 44, 22], [146, 178, 28, 10], [290, 178, 36, 16], [92, 140, 20, 9], [200, 140, 22, 10]].forEach(([x, b, w, hh]) => { sombraE(k, x + w * 0.6, b, w * 0.55, 3, 0.4); Det.pena(k, x, b, w, hh, RO); for (let j = 0; j < 4; j++) k.P(x + w * 0.25 + j * 3, b - hh * 0.55 + j, RO[0]); });
    rellena(k, [[110, 158], [150, 150], [154, 158], [114, 166]], (x, y) => rampa(RO, 0.2 + ((y - 150) / 16) * 0.6, x, y)); esfera(k, 156, 151, 6, 5, RO); k.R(152, 146, 8, 2, RO[3]); trazo(k, [[104, 166], [96, 150]], HIERRO[1], 2, 1);
    bola(k, 186, 168, 36, 6, (x, y) => rampa(["#4a4650", "#36323c", "#26222c"], 0.2 + (1 - Math.hypot((x - 186) / 36, (y - 168) / 6)) * 0.6, x, y));
    [[124, 140], [262, 146]].forEach(([x, y]) => trazo(k, [[x, y], [x + 7, y - 2]], "#5a3a22"));
    for (let i = 0; i < 46; i++) k.crudo(hash(i, 1, 12) * 320, 30 + hash(i, 2, 12) * 140, 1, 1, i % 3 ? "#ffb04a" : "#ffe06a");
    luces(k, amanece ? [] : [{ x: 96, y: 60, r: 40, ry: 40, col: "#ff8a3a", f: 0.7 }, { x: 228, y: 50, r: 44, ry: 44, col: "#ff8a3a", f: 0.7 }, { x: 150, y: 54, r: 34, ry: 34, col: "#ff8a3a", f: 0.6 }, { x: 160, y: 130, r: 170, ry: 40, col: "#ff9a4a", f: 0.35, p: 1 }]);
  }

  function autobus(k) {
    const { h } = cuando(k), lit = encendido(k);
    k.banda(["#3a64a0", "#6a8cbc", "#a8c0d4", "#d8e2e0"], 0, 132);
    nubarron(k, -18, 26, 80, 12); cirros(k, 4, 6, 30);
    const LAD = ["#c48a6c", "#ac7258", "#925e46", "#784a36", "#5c3828"], PIZ = ["#7a7e8e", "#626674", "#4e525e", "#3c3f4a", "#2c2e36"];
    const casa = (x, w, alto, s) => {
      const base = 132, top = base - alto;
      rellena(k, [[x, base], [x, top], [x + w, top], [x + w, base]], ladrillo(LAD, { w: 5, h: 2, s }));
      rellena(k, [[x - 2, top + 1], [x + w + 2, top + 1], [x + w - 4, top - 12], [x + 4, top - 12]], tejas(PIZ, { w: 4, h: 2, s, y0: top - 12 }));
      k.R(x + w * 0.7, top - 20, 7, 10, LAD[3]); k.R(x + w * 0.7 - 1, top - 21, 9, 2, "#4a3a32"); [0, 3].forEach((d) => k.R(x + w * 0.7 + 1 + d, top - 24, 2, 3, "#c87a5a"));
      [[0.18, top + 6], [0.6, top + 6], [0.18, top + 24]].forEach(([f, y]) => { const vx = Math.round(x + w * f); k.R(vx - 1, y - 1, 10, 13, "#f0ece0"); k.R(vx, y, 8, 11, VEN); k.R(vx, y + 5, 8, 1, "#f0ece0"); k.R(vx + 4, y, 1, 11, "#e0dcd0"); k.R(vx - 2, y + 12, 12, 1, "#d8d4c8"); });
      const px = Math.round(x + w * 0.62); k.R(px - 1, base - 16, 11, 16, "#f0ece0"); k.R(px, base - 15, 9, 15, ["#2a4a7a", "#7a2a2a", "#2a5a3a"][s % 3]); k.elipse(px + 4.5, base - 16, 5, 3, "#f0ece0"); k.elipse(px + 4.5, base - 16, 4, 2, VEN); k.P(px + 7, base - 7, "#e8c35a");
      k.R(x, base - 2, w, 2, "#8a867c");
    };
    casa(-10, 56, 52, 1); casa(46, 50, 50, 2); casa(96, 50, 54, 3); casa(146, 50, 50, 4); casa(196, 50, 52, 5); casa(246, 50, 54, 6); casa(296, 50, 50, 7);
    rellena(k, [[-2, 132], [322, 132], [322, 144], [-2, 144]], (x, y) => { const L = 12, u = (x + (y > 138 ? 6 : 0)) % L; return u === 0 || y === 138 ? "#7a7670" : rampa(["#c8c2b8", "#b4aea4", "#a09a90", "#8a847a"], 0.3 + (hash(Math.floor(x / L), y > 138 ? 1 : 0, 3) - 0.5) * 0.3, x, y); });
    k.R(-2, 144, 324, 2, "#d8d4cc"); k.R(-2, 146, 324, 1, "#5a5a60");
    rellena(k, [[-2, 147], [322, 147], [322, 180], [-2, 180]], (x, y) => rampa(["#5e5e68", "#4e4e58", "#40404a", "#34343c", "#28282e"], 0.35 + (fbm(x * 0.06, y * 0.3, 13) - 0.5) * 0.5 + (hash(x, y, 13) - 0.5) * 0.12, x, y));
    for (let x = 0; x < W; x += 34) k.R(x, 170, 18, 2, "#d8d4c8");
    [[26, 132], [292, 132]].forEach(([x, b]) => { k.R(x, b - 34, 2, 34, HIERRO[3]); k.R(x - 1, b - 2, 4, 2, HIERRO[2]); rellena(k, [[x - 3, b - 40], [x + 4, b - 40], [x + 3, b - 34], [x - 2, b - 34]], () => "#ffe6a8"); k.R(x - 4, b - 41, 9, 1, HIERRO[3]); k.R(x - 1, b - 43, 3, 2, HIERRO[3]); });
    k.R(56, 122, 8, 12, "#c8301e"); k.R(56, 122, 2, 12, "#e85a40"); k.elipse(60, 122, 4, 2, "#c8301e"); k.R(57, 126, 6, 1, "#26262a"); sombraE(k, 62, 134, 6, 1.5, 0.4);
    const x0 = 72, x1 = 242, M = ["#b484f0", "#9a62e0", "#7e44c4", "#62309e", "#48227a", "#321656"];
    sombraE(k, 160, 154, 96, 5, 0.5);
    rellena(k, [[x0 + 8, 152], [x0, 140], [x0, 56], [x0 + 6, 46], [x1 - 4, 46], [x1, 52], [x1, 152]], (x, y) => rampa(M, 0.18 + ((x - x0) / (x1 - x0)) * 0.22 + (y > 140 ? 0.25 : 0) + (x < x0 + 5 ? -0.1 : 0) + (ruido(x * 0.05, y * 0.4, 14) - 0.5) * 0.06, x, y));
    k.R(x0 + 4, 47, x1 - x0 - 8, 2, M[0]);
    const DENTRO = [["lampara", "cortina", "pasajero", "oscura", "lampara", "cortina"], ["cama", "lampara", "cama", "pasajero", "cortina", "cama"], ["cama", "cama", "pasajero", "cama", "lampara", "cama"]];
    [[56, 0], [86, 1], [116, 2]].forEach(([y, piso]) => {
      for (let x = x0 + 26, i = 0; x < x1 - 14; x += 22, i++) {
        const t = DENTRO[piso][i % 6];
        k.R(x - 1, y - 1, 20, 22, M[5]);
        if (t === "oscura") {
          rellena(k, [[x, y], [x + 18, y], [x + 18, y + 20], [x, y + 20]], (px, py) => rampa(["#4a4a6e", "#3a3a5a", "#2c2c48", "#20203a"], 0.2 + ((py - y) / 20) * 0.7, px, py));
          trazo(k, [[x + 3, y + 14], [x + 10, y + 3]], "#6e6e96"); trazo(k, [[x + 6, y + 16], [x + 13, y + 5]], "#5a5a80");
        } else {
          k.R(x, y, 18, 20, "#ffd890");
          if (t === "cama") { k.R(x + 2, y + 12, 14, 4, "#c84a4a"); k.R(x + 2, y + 15, 14, 1, "#8a2a2a"); k.R(x + 2, y + 11, 5, 2, "#f4efe0"); k.R(x + 1, y + 8, 1, 10, "#c8a040"); k.R(x + 16, y + 10, 1, 8, "#c8a040"); k.R(x + 1, y + 8, 5, 1, "#c8a040"); k.P(x + 1, y + 7, "#ffe88a"); }
          if (t === "lampara") { k.R(x + 8, y, 1, 3, "#8a6a2a"); k.R(x + 4, y + 3, 9, 2, "#e8c060"); k.R(x + 5, y + 5, 7, 1, "#a8842e"); [x + 4, x + 8, x + 12].forEach((cx) => { k.P(cx, y + 2, "#fff8c0"); }); k.R(x + 3, y + 16, 12, 1, "#7a5230"); k.R(x + 4, y + 17, 1, 3, "#7a5230"); k.R(x + 13, y + 17, 1, 3, "#7a5230"); }
          if (t === "pasajero") { k.elipse(x + 11, y + 8, 3, 3, "#4a2e3e"); k.R(x + 6, y + 12, 11, 8, "#4a2e3e"); k.R(x + 2, y + 10, 7, 6, "#f4efe0"); k.R(x + 3, y + 11, 5, 1, "#a8a8b4"); k.R(x + 3, y + 13, 4, 1, "#a8a8b4"); }
          if (t === "cortina") { for (let j = 0; j < 9; j++) k.R(x + j, y, 1, 20, j % 3 === 0 ? "#6a1c2a" : "#a83040"); k.R(x + 9, y, 1, 20, "#5a1622"); k.R(x + 6, y + 10, 4, 1, "#e8c060"); }
          k.P(x + 1, y + 1, "#fff4d0");
        }
        k.R(x + 9, y, 1, 20, M[5]);
      }
      k.R(x0, y + 23, x1 - x0, 2, "#e8c84a"); k.R(x0, y + 23, x1 - x0, 1, "#fff0a0");
    });
    k.R(x0 + 3, 56, 18, 18, "#ffd890"); k.R(x0 + 3, 86, 18, 18, "#ffd890"); rellena(k, [[x0 + 2, 116], [x0 + 20, 116], [x0 + 20, 136], [x0 + 6, 136]], () => "#b8dce8"); k.R(x0 + 10, 124, 6, 8, "#3a2a22");
    rellena(k, [[x0 + 40, 36], [x0 + 130, 36], [x0 + 130, 46], [x0 + 40, 46]], (x, y) => rampa(["#3a3a44", "#2a2a32", "#1e1e24"], (y - 36) / 10, x, y)); k.R(x0 + 42, 38, 86, 6, "#e8c84a"); rotulo(k, x0 + 66, 39, "NIGHT BUS", "#26262a");
    k.R(x0 - 2, 140, x1 - x0 + 4, 12, M[5]); k.R(x0 - 2, 140, x1 - x0 + 4, 1, M[2]);
    [[x0 + 32, 150], [x1 - 34, 150]].forEach(([x, y]) => { k.elipse(x, y, 12, 12, "#16161a"); k.elipse(x, y, 10, 10, "#26262c"); bola(k, x, y, 6, 6, (px, py) => rampa(["#e8e8f0", "#b8b8c4", "#888894", "#5e5e68"], 0.1 + ((px - x) + (py - y)) / 12 * 0.5, px, py)); k.elipse(x, y, 2, 2, "#3a3a44"); });
    k.elipse(x0 + 1, 132, 3, 3, "#ffe6a8"); k.elipse(x0 + 1, 145, 3, 3, "#ffe6a8"); k.P(x0, 131, "#ffffff");
    if (lit > 0.3) k.alfa(0.24, () => k.poli([[x0, 128], [x0, 150], [0, 180], [0, 150]], "#ffe6a8"));
    for (let i = 0; i < 5; i++) k.R(x1 + 6 + i * 9, 158 + i, 7, 1, "#26262c");
    humo(k, x1 + 4, 142, "#a8a8b0", 0.4, 5);
    espejo(k, 147, 147, 180, { mezcla: 0.55, tinte: "#34343c", onda: 1, crestas: 0.05, paso: 0.55, oscuro: 0.7 });
    luces(k, [{ x: 160, y: 96, r: 120, ry: 70, col: "#ffd890", f: lit * 0.5, p: 1 }, { x: 26, y: 96, r: 30, ry: 40, col: "#ffe6a8", f: lit }, { x: 292, y: 96, r: 30, ry: 40, col: "#ffe6a8", f: lit }, { x: 20, y: 150, r: 70, ry: 26, col: "#ffe6a8", f: lit * 0.8 }]);
  }

  window.SitiosIt6 = window.SitiosIt6 || {};
  window.SitiosIt6.magos = {
    10: ["La Madriguera", "La casa torcida de los Waesley, entre el campo", madriguera, { ven: [VEN], tinte: 0.2 }],
    5: ["El Bosque Prohibido", "Árboles retorcidos, niebla y ojos entre las sombras", bosquePro, { cielo: "propio", fuerza: 0.75, fuego: ["#d8e86a", "#5ae8c8", "#c8fff0"] }],
    13: ["La batalla de Hagworts", "El castillo asediado, entre llamas, humo y hechizos", batalla, { cielo: "propio", fuerza: 0.7, ven: [VEN], fuego: ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0", "#ffb04a", "#ffe06a", "#3fe87a", "#e83a3a", "#6ac8ff", "#9ad8ff", "#d8f4ff", "#ffffff", "#fff4d0", "#ffe6a8"] }],
    17: ["El Autobús Noctámbulo", "El autobús morado de tres pisos, que frena de golpe en plena noche", autobus, { ven: [VEN, "#ffd890"], fuerza: 0.85, fuego: ["#ffe6a8"] }],
  };
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro, pena } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, bezier, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const MAG = (window.SitiosIt15.magos = window.SitiosIt15.magos || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const PIEDRA_H = ["#c8c0b4", "#b0a89c", "#968e84", "#7c766e", "#625e58", "#4a4642"];
  const PINOS = ["#5a8a6a", "#467a5a", "#346a4a", "#245a3c", "#184a30"];
  const CASAS = { G: ["#c8302a", "#e8b83a"], S: ["#2a7a4a", "#c8c8d0"], R: ["#2a4a8a", "#b08a50"], H: ["#e8c040", "#2a2a30"] };

  const TEJ_H = ["#6a7a9a", "#566688", "#445474", "#344260", "#26324c"];
  function torre(k, x, base, w, h, { techo = 1.6, s = 1, pal = PIEDRA_H, tej = TEJ_H, ven = "#ffd27a", alto = null, cada = 10 } = {}) {
    x = Math.round(x); w = Math.round(w); base = Math.round(base); h = Math.round(h);
    T.rect(k, x, base - h, w, h, (px, py) => { const c = celdas(px, py, 6, 4, s, 0.4); return c.borde < 0.1 ? pal[5] : rampa(pal, 0.12 + Math.pow(Math.abs((px - x) / w - 0.3) / 0.7, 1.2) * 0.6 + (c.id - 0.5) * 0.15, px, py); });
    const vs = [], vw = w >= 9 ? 3 : 2;
    for (let y = base - h + 5; y < base - 6; y += cada) { const vx = Math.round(x + w / 2 - vw / 2); T.ventana(k, vx, y, vw, vw + 2, { arco: true, marco: pal[5], vidrio: ven, cruz: false }); vs.push([vx + vw / 2, y + 2]); }
    const a = alto ?? w * techo, top = base - h;
    k.R(x - 1, top - 1, w + 2, 2, pal[4]);
    for (let i = 0; i < a; i++) { const r = ((a - i) / a) * (w / 2 + 1.5), y = top - 1 - i; for (let px = Math.round(x + w / 2 - r); px <= x + w / 2 + r; px++) k.P(px, y, rampa(tej, 0.1 + ((px - x - w / 2 + r) / (2 * r + 0.01)) * 0.7 + (i % 3 === 0 ? 0.08 : 0), px, y)); }
    return vs;
  }
  function castillo(k, cx, base, e = 1, { s = 1, ven = "#ffd27a" } = {}) {
    const vs = [], X = (d) => Math.round(cx + d * e), L = (d) => Math.round(d * e);
    const muro = (x0, x1, h, sm) => {
      T.rect(k, x0, base - h, x1 - x0, h, (px, py) => { const c = celdas(px, py, 7, 4, sm, 0.4); return c.borde < 0.1 ? PIEDRA_H[5] : rampa(PIEDRA_H, 0.2 + ((px - x0) / (x1 - x0)) * 0.35 + (c.id - 0.5) * 0.15, px, py); });
      for (let px = x0; px < x1; px += 4) k.R(px, base - h - 2, 2, 2, PIEDRA_H[3]);
      for (let fy = base - h + 5; fy < base - 4; fy += 8) for (let px = x0 + 3; px < x1 - 3; px += 6) { T.ventana(k, px, fy, 2, 4, { arco: true, marco: PIEDRA_H[5], vidrio: ven, cruz: false }); vs.push([px + 1, fy + 2]); }
    };
    [[-75, -46, 18], [-47, -5, 24], [-8, 24, 32], [22, 52, 24], [50, 76, 16]].forEach(([a, b, h], i) => muro(X(a), X(b), L(h), s + i));
    rellena(k, [[X(-48), base - L(24)], [X(-42), base - L(36)], [X(-11), base - L(36)], [X(-4), base - L(24)]], tejas(TEJ_H, { w: 3, h: 2, s, y0: base - L(36) }));
    [[-72, 10, 30, 1.8], [-56, 9, 36, 2.2], [-30, 8, 44, 2.4], [-2, 13, 46, 1.7], [12, 9, 54, 2.4], [30, 11, 42, 2.0], [44, 8, 68, 2.6], [62, 10, 32, 1.9]].forEach(([dx, w, h, t], i) => vs.push(...torre(k, X(dx), base, L(w), L(h), { techo: t, s: s + 10 + i, ven })));
    return vs;
  }
  function acantilado(k, x0, x1, top, base, s = 1) {
    const ROCA = ["#aaa294", "#908878", "#767066", "#5e5952", "#47443f", "#33312e"], m = (x0 + x1) / 2;
    const poly = [[x0 - 34, base], [x0 - 22, base - 6], [x0 - 14, top + 18], [x0 - 6, top + 9], [x0, top], [x1, top], [x1 + 4, top + 8], [x1 + 10, top + 12], [x1 + 16, base - 9], [x1 + 30, base]];
    rellena(k, poly, (x, y) => { const c = celdas(x, y, 4, 12, s, 0.7), f = (y - top) / (base - top); return c.borde < 0.14 ? ROCA[5] : rampa(ROCA, 0.08 + (x > m ? 0.28 : 0) + (Math.abs(x - m) / (x1 - x0)) * 0.2 + f * 0.3 + (c.id - 0.5) * 0.25, x, y); });
  }
  const velaFlota = (k, x, y) => { k.R(x, y, 1, 4, "#f4efe6"); k.crudo(x, y - 2, 1, 2, "#ffcf6a"); k.crudo(x, y - 1, 1, 1, "#fff4c0"); };
  function estandarte(k, x, y, w, h, casa, s = 1) {
    const [c, d] = CASAS[casa];
    rellena(k, [[x, y], [x + w, y], [x + w, y + h], [x + w / 2, y + h + w * 0.4], [x, y + h]], (px, py) => rampa([mezcla(c, "#ffffff", 0.2), c, mezcla(c, "#000000", 0.25), mezcla(c, "#000000", 0.45)], 0.15 + ((px - x) / w) * 0.45 + (Math.round(px) % 5 === 0 ? 0.12 : 0), px, py));
    k.R(x - 1, y - 1, w + 2, 2, "#5a4030"); bola(k, x + w / 2, y + h * 0.45, w * 0.3, w * 0.34, () => d);
  }
  const pino = (k, x, b, h, nieve = false) => { for (let j = 0; j < 5; j++) { const t = j / 5, y = b - 4 - h * t, w = (1 - t) * h * 0.36 + 2; rellena(k, [[x - w, y], [x + w, y], [x, y - h * 0.3]], (px, py) => rampa(PINOS, 0.1 + ((px - x + w) / (2 * w)) * 0.7, px, py)); if (nieve) bola(k, x - w * 0.2, y - h * 0.08, w * 0.7, 1.6, (px, py) => (py > y - h * 0.08 ? null : "#ffffff")); } k.R(x - 1, b - 4, 3, 4, "#3a2a20"); };
  window.H17 = { torre, castillo, acantilado, velaFlota, estandarte, pino, CASAS, PIEDRA_H, PINOS, TEJ_H };

  function hagwortsLago(k) {
    const lit = encendido(k);
    k.banda(["#3a5a9a", "#5a7ab0", "#8aa4c8", "#c8d4e0"], 0, 112);
    nubarron(k, 20, 20, 80, 10); nubarron(k, 236, 34, 60, 9);
    montana(k, 30, 112, 130, 50, { roca: ["#5a6a80", "#4c5c72", "#404e64", "#344256"] }); montana(k, 296, 112, 130, 44, { roca: ["#5a6a80", "#4c5c72", "#404e64", "#344256"] });
    acantilado(k, 104, 222, 80, 113, 801);
    [[112, 92, 10, 8], [200, 90, 14, 10]].forEach(([x, y, w, h], i) => { T.rect(k, x, y, w, h, (px, py) => rampa(PIEDRA_H, 0.3 + ((px - x) / w) * 0.4, px, py)); for (let px = x; px < x + w; px += 4) k.R(px, y - 2, 2, 2, PIEDRA_H[3]); T.ventana(k, x + w / 2 - 1, y + 3, 2, 3, { marco: PIEDRA_H[5], vidrio: "#ffd27a", cruz: false }); });
    const vs = castillo(k, 162, 82, 0.8, { s: 802 });
    T.rect(k, 0, 112, W, 46, (x, y) => rampa(["#3a5a8a", "#2e4c7a", "#243e6a", "#1c325a"], 0.2 + ((y - 112) / 46) * 0.6, x, y));
    espejo(k, 112, 112, 158, { tinte: "#1e3a6a", mezcla: 0.4, onda: 2, crestas: 0.1 });
    [[-6, 150, 44], [18, 156, 38], [298, 150, 46], [318, 156, 40]].forEach(([x, b, h]) => pino(k, x, b, h));
    T.prado(k, 156, ["#7aa070", "#628a5c", "#4c744a", "#3a5e3a", "#2a4a2c", "#1c3820"], 803, { perfil: (x) => 156 + Math.sin(x / 24) * 2 });
    for (let x = 0; x < W; x++) if (hash(x, 1, 804) > 0.5) k.P(x, 155 + Math.round(Math.sin(x / 24) * 2), "#c8d8e8");
    luces(k, vs.map(([x, y]) => ({ x, y, r: 8, ry: 6, col: LUZ, f: lit * 0.7 })));
  }
  MAG[1] = ["Hagworts desde el lago", "El castillo sobre su acantilado, reflejado en el agua", hagwortsLago, { ven: VEN, dx: 104 }];

  function comedor(k) {
    const lit = encendido(k), FX = 160, FY = 66, f = (y) => (y - FY) / 100, sx = (X, y) => FX + X * f(y);
    const MURO = ["#b8ae9c", "#a49a88", "#8e8474", "#787060", "#625a4e"];
    const muro = (x, y, s, v) => { const c = celdas(x, y, 9, 5, s, 0.3); return c.borde < 0.08 ? "#4a443c" : rampa(MURO, v + (c.id - 0.5) * 0.3, x, y); };
    T.rect(k, 0, 0, W, 72, () => "#2a3670");
    if (lit > 0.5) for (let i = 0; i < 50; i++) k.crudo(hash(i, 1, 811) * W, hash(i, 2, 811) * 46, 1, 1, "#e8ecff");
    rellena(k, [[0, 0], [106, 38], [106, 100], [0, 152]], (x, y) => muro(x, y, 812, 0.12 + (x / 106) * 0.3));
    rellena(k, [[W, 0], [214, 38], [214, 100], [W, 152]], (x, y) => muro(x, y, 813, 0.32 + ((W - x) / 106) * 0.2));
    T.rect(k, 106, 38, 108, 62, (x, y) => muro(x, y, 814, 0.28));
    for (const t of [0.3, 0.5, 0.68, 0.84, 1]) { const lx = 106 * t, ly = 38 * t, rx = W - lx, ap = ly - (rx - lx) * 0.18; trazo(k, bezier([lx, ly], [lx + (rx - lx) * 0.08, ap], [rx - (rx - lx) * 0.08, ap], [rx, ly], 28), "#5a4230", t < 0.6 ? 2 : 1); }
    for (const t of [0.1, 0.36, 0.58, 0.77]) [1, -1].forEach((lado) => { const q = (u, v) => { const tx = t + u * 0.07, wx = 106 * tx, top = 38 * tx, bot = 152 - 52 * tx; return [lado > 0 ? wx : W - wx, top + (bot - top) * v]; }; rellena(k, [q(0, 0.16), q(1, 0.16), q(1, 0.6), q(0, 0.6)], (x, y) => (Math.round(y) % 5 === 0 ? "#5a4a38" : "#2a3670")); });
    const VIT = ["#e8402a", "#3a6ac8", "#e8c040", "#3a9a5a", "#9a5ac8"];
    bola(k, 160, 56, 21, 15, (x, y) => (y > 56 ? null : "#4a3a2a")); T.rect(k, 139, 56, 42, 32, () => "#4a3a2a");
    bola(k, 160, 56, 19, 13, (x, y) => (y > 56 ? null : VIT[(Math.floor(x / 4) + Math.floor(y / 4)) % 5])); T.rect(k, 141, 56, 38, 30, (x, y) => VIT[(Math.floor(x / 4) + Math.floor(y / 4)) % 5]);
    for (let x = 141; x < 180; x += 4) k.R(x, 42, 1, 44, "#4a3a2a"); for (let y = 60; y < 86; y += 4) k.R(141, y, 38, 1, "#4a3a2a");
    [["G", 24], ["H", 66], ["R", 236], ["S", 278]].forEach(([c, x], i) => estandarte(k, x, 14 + (i % 2) * 10, 18, 40, c, 815 + i));
    suelo3d(k, 100, 180, FX, FY, losas3d(["#a49a88", "#8e8474", "#787060", "#625a4e", "#4c463c"], { tx: 32, tz: 22, s: 817 })); k.R(106, 99, 108, 2, "#4c463c");
    for (let x = 118; x < 204; x += 7) T.rect(k, x, 84, 5, 10, () => (Math.abs(x + 2 - 160) < 4 ? "#c8a040" : "#4a3020"));
    T.rect(k, 156, 78, 9, 16, (x, y) => rampa(["#f8e090", "#e8c050", "#b88a30"], (x - 156) / 9, x, y));
    T.rect(k, 114, 92, 92, 5, madera(PAL.MAD_O, { paso: 2, largo: 99, s: 816 })); T.rect(k, 114, 97, 92, 4, () => "#7a2a2a"); for (let x = 118; x < 204; x += 6) k.R(x, 91, 2, 1, "#e8c040");
    T.rect(k, 158, 100, 4, 8, () => "#c8a040"); bola(k, 160, 98, 4, 3, () => "#e8c050");
    const MESA = ["#c08a54", "#a87444", "#8e5e36", "#744a2a", "#5a3820"], y0 = 104, y1 = 166;
    const caja = (X, w, alto, pal, lado, mesa = false) => {
      const p = (XX, y, a) => [sx(XX, y), y - a * f(y)], ix = lado > 0 ? X + w : X - w, q = alto / 100;
      rellena(k, [p(ix, y0, mesa ? alto * 0.6 : 0), p(ix, y0, alto), p(ix, y1, alto), p(ix, y1, mesa ? alto * 0.6 : 0)], (x, y) => rampa(pal, 0.72 + (y % 3 === 0 ? 0.08 : 0), x, y));
      if (mesa) for (let z = 2.6; z > 100 / (y1 - FY); z -= 0.55) { const y = FY + 100 / z, [lx, ly] = p(ix, y, alto); k.R(lx - (lado > 0 ? 1 : 0), ly, Math.max(1, Math.round(1.4 * f(y))), alto * f(y), pal[4]); }
      const [ax, ay] = p(X - w, y1, alto), [bx] = p(X + w, y1, alto), hh = alto * f(y1), g = Math.max(1, Math.round(1.6 * f(y1)));
      if (mesa) { k.R(ax, ay, bx - ax, Math.max(1, Math.round(hh * 0.4)), pal[3]); k.R(ax, ay, g, hh, pal[4]); k.R(bx - g, ay, g, hh, pal[4]); } else k.R(ax, ay, bx - ax, hh, pal[3]);
      rellena(k, [p(X - w, y0, alto), p(X + w, y0, alto), p(X + w, y1, alto), p(X - w, y1, alto)], (x, y) => {
        const yf = (y - q * FY) / (1 - q), Xw = (x - FX) / f(yf), u = Xw - (X - w);
        if (u < 0.9 || u > 2 * w - 0.9) return pal[3];
        return rampa(pal, 0.18 + (Math.floor(u / 3) % 2 ? 0.1 : 0) + (lado > 0 ? (2 * w - u) : u) / (2 * w) * 0.12, x, y);
      });
    };
    [-104, -38, 38, 104].forEach((X, i) => {
      const lado = X < 0 ? 1 : -1;
      [-16, 16].forEach((b) => caja(X + b, 3, 4, ["#7a5a3a", "#664a30", "#523a24", "#3e2a1a", "#2a1c10"], lado));
      caja(X, 11, 8, MESA, lado, true);
      for (let z = 2.8; z > 100 / (y1 - FY) + 0.05; z -= 0.2) { const y = FY + 100 / z, a = 8 * f(y), g = f(y) > 0.75 ? 2 : 1; [-6, 6].forEach((d) => { k.R(sx(X + d, y) - g / 2, y - a, g + 1, 1, "#e8c040"); k.R(sx(X + d * 0.4, y), y - a - g, 1, g, "#f2d27a"); }); }
    });
    const L = [];
    for (let i = 0; i < 40; i++) {
      const X = (hash(i, 1, 818) - 0.5) * 300, Y = 70 + hash(i, 2, 818) * 50, yf = 104 + Math.pow(hash(i, 3, 818), 0.8) * 76, e = f(yf), x = sx(X, yf), y = yf - Y * e;
      if (y < 4 || x < 4 || x > W - 4) continue;
      const g = e > 0.95 ? 2 : 1, h = Math.round(2 + 3 * e);
      k.R(x, y, g, h, "#f4efe6"); k.crudo(x, y - g, g, g, "#ffcf6a"); if (g > 1) k.crudo(x, y - g - 1, 1, 1, "#fff4c0");
      L.push({ x: x + g / 2, y: y - 1, r: 3 + 4 * e, col: "#ffcf7a", f: 0.5 });
    }
    luces(k, [{ x: 160, y: 60, r: 170, ry: 60, col: "#ffcf7a", f: 0.35 }, { x: 160, y: 140, r: 140, ry: 40, col: "#ffcf7a", f: 0.25 }, ...L]);
  }
  MAG[2] = ["El Gran Comedor", "Las velas flotando bajo el techo que enseña el cielo de fuera", comedor, { fuerza: 0.12, ventanal: "#2a3670", fuego: ["#ffd27a", "#ffcf6a", "#ffe6a8", "#f4efe0", "#e8c040", "#fff4c0"] }];

  function hegsmoade(k) {
    const lit = encendido(k);
    k.banda(["#8aa8c8", "#a8bcd4", "#c8d4e0", "#e4e8ee"], 0, 104);
    nubarron(k, 200, 16, 90, 12, ["#f4f6fa", "#e2e8f0", "#c8d2e0"]);
    montana(k, 70, 104, 170, 64, { roca: ["#a8b4c8", "#94a2b8", "#8090a8", "#6e7e98"], nieve: ["#ffffff", "#e2eaf3"], hasta: 0.4 }); montana(k, 250, 104, 180, 72, { roca: ["#a8b4c8", "#94a2b8", "#8090a8", "#6e7e98"], nieve: ["#ffffff", "#e2eaf3"], hasta: 0.4 });
    const vs = [];
    const casaH = (x, base, w, h, s, letrero) => {
      T.rect(k, x, base - h, w, h, (px, py) => rampa(["#f4ead4", "#e6d8bc", "#d4c2a0", "#bca884"], 0.1 + ((px - x) / w) * 0.4 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.15, px, py));
      for (let px = x; px < x + w; px += 8) k.R(px, base - h, 2, h, "#5a3a24"); k.R(x, base - h, w, 2, "#5a3a24"); k.R(x, base - Math.round(h / 2), w, 2, "#5a3a24"); trazo(k, [[x, base - h / 2], [x + 8, base - h]], "#5a3a24", 1);
      for (let vx = x + 3; vx < x + w - 5; vx += 8) { T.ventana(k, vx, base - h + 4, 4, 5, { marco: "#5a3a24", vidrio: "#ffd27a" }); vs.push([vx + 2, base - h + 6]); }
      rellena(k, [[x - 4, base - h + 1], [x + w / 2, base - h - w * 0.4], [x + w + 4, base - h + 1]], (px, py) => rampa(["#ffffff", "#f2f6fb", "#dfe8f2", "#c8d4e4"], 0.1 + (px - x) / w * 0.5, px, py));
      for (let px = x - 3; px < x + w + 3; px += 3) k.R(px, base - h + 2, 1, 1 + (px % 3), "#c8d8ec");
      T.rect(k, x + w * 0.7, base - h - w * 0.36, 5, 10, Det6.ladrillo(["#c88466", "#a86448", "#884c36", "#5e3424"], { w: 3, h: 2, s: s + 1 })); Det.humo(k, x + w * 0.7 + 2, base - h - w * 0.36 - 1, "#eef0f4", 0.4, 5);
      k.R(x + w / 2 - 3, base - 10, 6, 10, "#4a2e1c");
      if (letrero) { k.R(x + 2, base - h / 2 - 6, w - 4, 7, "#3a2a20"); rotulo(k, x + w / 2 - letrero.length * 2, base - h / 2 - 5, letrero, "#f2d27a"); }
    };
    casaH(-6, 124, 46, 40, 821, "PUB"); casaH(42, 122, 38, 34, 822, null); casaH(84, 120, 30, 30, 823, null); casaH(210, 120, 32, 30, 824, null); casaH(246, 122, 40, 36, 825, "DULCES"); casaH(288, 124, 40, 40, 826, null);
    T.rect(k, 0, 122, W, 58, (x, y) => rampa(["#ffffff", "#f2f6fb", "#e2eaf3", "#cfdbe9", "#b8c8dc"], 0.1 + ((y - 122) / 58) * 0.3 + (fbm(x * 0.05, y * 0.15, 827) - 0.5) * 0.5, x, y));
    for (let y = 124; y < H; y++) { const f = (y - 124) / 56, c = 160 + Math.sin(f * 2) * 10, w = 8 + f * 30; for (let x = Math.round(c - w); x <= c + w; x++) if (hash(x, y, 828) > 0.4) k.P(x, y, "#d8e2ee"); }
    const L = [T.farola(k, 120, 140, 28), T.farola(k, 204, 140, 28)];
    [[26, 170, 30], [300, 172, 34]].forEach(([x, b, h]) => { for (let j = 0; j < 5; j++) { const t = j / 5, y = b - 4 - h * t, w = (1 - t) * h * 0.38 + 2; rellena(k, [[x - w, y], [x + w, y], [x, y - h * 0.32]], (px, py) => rampa(PINOS, 0.1 + ((px - x + w) / (2 * w)) * 0.7, px, py)); bola(k, x - w * 0.2, y - h * 0.08, w * 0.7, 1.6, (px, py) => (py > y - h * 0.08 ? null : "#ffffff")); } k.R(x - 1, b - 4, 3, 4, "#3a2a20"); });
    P.nieve(k, 160, 829);
    luces(k, [...L, ...vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 }))]);
  }
  MAG[3] = ["Hegsmoade", "El pueblo nevado, con sus ventanas encendidas", hegsmoade, { ven: VEN, tinte: 0.2 }];

  function kuidditch(k) {
    k.banda(CIELO, 0, 110);
    nubarron(k, 30, 26, 80, 12); nubarron(k, 230, 16, 90, 14);
    montana(k, 60, 112, 180, 46, { roca: ["#8aa4c0", "#7a96b4", "#6a88a8", "#5c7a9c"] }); montana(k, 260, 112, 170, 40, { roca: ["#8aa4c0", "#7a96b4", "#6a88a8", "#5c7a9c"] });
    const torreG = (x, w, h, casa, s) => { const [c, d] = CASAS[casa]; T.rect(k, x, 112 - h, w, h, madera(["#c8a070", "#ac8456", "#8e6a40", "#70502c", "#523818"], { paso: 3, vertical: true, largo: 99, s })); for (let y = 112 - h + 10; y < 112; y += 10) trazo(k, [[x, y], [x + w, y + 8]], "#523818", 1); T.rect(k, x - 2, 112 - h - 12, w + 4, 12, (px, py) => (Math.floor((px - x) / 4) % 2 ? c : d)); rellena(k, [[x - 4, 112 - h - 12], [x + w / 2, 112 - h - 24], [x + w + 4, 112 - h - 12]], (px, py) => rampa([mezcla(c, "#ffffff", 0.2), c, mezcla(c, "#000000", 0.3)], (px - x) / w * 0.6, px, py)); k.R(x + w / 2, 112 - h - 32, 1, 8, "#3a2a20"); Det.bandera(k, x + w / 2 + 1, 112 - h - 32, 8, 5, c); };
    [[8, 26, 70, "G"], [46, 24, 64, "R"], [90, 22, 60, "H"], [208, 22, 60, "S"], [250, 24, 64, "G"], [290, 26, 70, "R"]].forEach(([x, w, h, c], i) => torreG(x, w, h, c, 831 + i));
    T.rect(k, 0, 110, W, 70, (x, y) => rampa(["#9ad070", "#84bc5c", "#70a84c", "#5c923e"], 0.15 + ((y - 110) / 70) * 0.3 + (Math.floor((x + (y - 110) * 0.6) / 22) % 2 ? 0.12 : 0) + (hash(x, y, 837) - 0.5) * 0.1, x, y));
    for (let a = 0; a < Math.PI * 2; a += 0.01) k.P(160 + Math.cos(a) * 48, 156 + Math.sin(a) * 10, "#f4f8ec");
    [[132, 70], [160, 56], [188, 70]].forEach(([x, top]) => { T.rect(k, x - 1, top, 2, 112 - top + 18, (px, py) => rampa(["#f8e090", "#e8c050", "#b88a30"], (px - x + 1) / 2, px, py)); for (let a = 0; a < Math.PI * 2; a += 0.02) { k.P(x + Math.cos(a) * 8, top - 8 + Math.sin(a) * 9, "#e8c050"); k.P(x + Math.cos(a) * 7, top - 8 + Math.sin(a) * 8, "#b88a30"); } });
  }
  MAG[4] = ["El campo de Kuidditch", "Las torres de las casas y los tres aros", kuidditch, { tinte: 0.2 }];

  function daigon(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 104);
    nubarron(k, 214, 8, 70, 9);
    const vs = [];
    const GB = ["#ffffff", "#f2f0ea", "#dcd8ce", "#c4beb0", "#a8a294"];
    T.rect(k, 128, 36, 64, 64, (x, y) => rampa(GB, 0.1 + ((x - 128) / 64) * 0.4 + (y > 90 ? 0.12 : 0), x, y));
    rellena(k, [[123, 38], [160, 20], [197, 38]], (x, y) => rampa(GB, 0.05 + ((x - 123) / 74) * 0.5, x, y)); trazo(k, [[123, 38], [160, 20], [197, 38]], GB[4], 1); k.R(123, 38, 74, 3, GB[3]);
    for (let x = 131; x < 190; x += 8) Det.cilindro(k, x, 42, 4, 50, GB.slice(0, 4));
    k.R(153, 70, 14, 30, "#5a3a1a"); k.R(154, 71, 12, 29, "#b07a3a"); k.R(159, 71, 2, 29, "#6a4020"); [156, 163].forEach((x) => k.R(x, 84, 1, 2, "#f2d27a"));
    suelo3d(k, 100, 180, 160, 92, losas3d(["#c8c0b4", "#b4ac9e", "#9c9486", "#847c70", "#6a645a"], { tx: 9, tz: 6, s: 847 }));
    k.R(126, 92, 68, 2, GB[3]); for (let i = 0; i < 4; i++) k.R(124 - i * 3, 100 + i * 2, 72 + i * 6, 2, GB[1 + (i % 2) * 2]);
    const tienda = (x, base, w, h, lad, pared, cartel, s) => {
      rellena(k, [[x, base], [x + lad, base - h], [x + w + lad, base - h], [x + w, base]], (px, py) => rampa(pared, 0.1 + ((px - x) / w) * 0.4 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.15, px, py));
      rellena(k, [[x + lad - 3, base - h + 1], [x + lad + w / 2, base - h - w * 0.5], [x + lad + w + 3, base - h + 1]], tejas(["#7a6a6a", "#665656", "#524444", "#3e3434", "#2a2424"], { w: 4, h: 2, s: s + 1, y0: base - h - w * 0.5 }));
      const esc = Math.max(8, Math.round(h * 0.22)), pv = w > 24 ? 9 : 7;
      for (let y = base - h + 5; y < base - esc - 8; y += 10) for (let vx = x + 3; vx < x + w - 5; vx += pv) { const dx = (lad * (base - y)) / h; T.ventana(k, vx + dx, y, 4, 5, { marco: "#3a2a20", vidrio: "#ffd27a" }); vs.push([vx + dx + 2, y + 3]); }
      T.rect(k, x + 2, base - esc, w - 4, esc - 3, () => "#ffe6a8"); for (let i = 0; i < 5; i++) k.R(x + 4 + (i * (w - 8)) / 5, base - 6 - (i % 3) * 2, 2, 3, ["#c8302a", "#3a6ac8", "#e8c040", "#3a9a5a", "#9a5ac8"][i]);
      if (cartel) { k.R(x + 1, base - esc - 5, w - 2, 5, "#3a2a20"); rotulo(k, Math.max(1, Math.min(W - cartel.length * 4 - 1, x + w / 2 - cartel.length * 2)), base - esc - 4, cartel, "#f2d27a"); }
      k.R(x, base - 3, w, 3, "#4a3a2a");
    };
    const PAREDES = [["#c8a8d8", "#b490c8", "#9c78b0", "#806098"], ["#a8c0d8", "#90aac8", "#7894b0", "#607c98"], ["#d8c0a0", "#c4aa88", "#ac9070", "#90765a"], ["#a8d0a8", "#90bc90", "#78a478", "#608a60"], ["#e0a890", "#cc9078", "#b07862", "#946050"], ["#d0b8a0", "#bca088", "#a48870", "#886e5a"]];
    [[84, 40, 26], [104, 52, 24], [194, 50, 24], [216, 42, 26]].forEach(([x, h, w], i) => tienda(x, 104, w, h, i % 2 ? 1 : -1, PAREDES[(i + 2) % 6], null, 840 + i));
    [[38, 70, 30, "OWLS"], [66, 62, 26, null], [228, 64, 26, null], [252, 72, 30, "WISEACRE"]].forEach(([x, h, w, c], i) => tienda(x, 122, w, h, i % 2 ? -2 : 2, PAREDES[(i + 4) % 6], c, 850 + i));
    tienda(-6, 152, 48, 132, -3, PAREDES[0], "ILLOVANDER", 861); tienda(282, 152, 44, 130, 3, PAREDES[3], "FLUORISH", 862);
    T.banderines(k, 30, 50, 290, 52, 12, ["#e8402a", "#f2c84b", "#3f8ac0", "#3fb85a", "#e86aa8"]);
    [[98, 162], [108, 164], [103, 156]].forEach(([x, b]) => { sombraE(k, x + 1, b, 6, 1.5, 0.4); bola(k, x, b - 4, 6, 5, (px, py) => rampa(["#5a5a64", "#3a3a44", "#24242c"], 0.2 + ((px - x + 6) / 12) * 0.6, px, py)); k.R(x - 6, b - 9, 12, 2, "#2a2a30"); });
    P.barril(k, 214, 160, 10, 12); [[228, 156], [238, 158]].forEach(([x, b]) => { sombraE(k, x + 3, b, 5, 1.5, 0.4); k.R(x, b - 10, 7, 10, "#8a6a40"); for (let px = x; px < x + 7; px += 2) k.R(px, b - 10, 1, 10, "#3a2a20"); k.R(x - 1, b - 11, 9, 1, "#3a2a20"); k.R(x + 2, b - 7, 3, 3, "#f4efe6"); });
    luces(k, vs.map(([x, y]) => ({ x, y, r: 9, ry: 7, col: LUZ, f: lit * 0.8 })));
  }
  MAG[6] = ["El Callejón Daigon", "La calle de las tiendas, torcidas y apretadas, hasta Grongitts", daigon, { ven: VEN, brillo: 0.78, tinte: 0.3, dx: -62 }];

  function anden(k) {
    T.rect(k, 0, 0, W, 120, ladrillo(["#c88a6a", "#b0745a", "#965e48", "#7a4a38", "#5e382a"], { w: 6, h: 3, s: 851 }));
    for (let x = 0; x < W; x += 30) { k.R(x, 0, 4, 120, "#5a5a64"); k.R(x + 1, 0, 1, 120, "#8a8a96"); }
    for (let i = 0; i < 4; i++) { const cx = 40 + i * 80; bola(k, cx, 50, 24, 20, (x, y) => (y > 50 ? null : "#c8d8e4")); T.rect(k, cx - 24, 50, 48, 24, () => "#c8d8e4"); for (let x = cx - 24; x < cx + 24; x += 6) k.R(x, 30, 1, 44, "#5a5a64"); k.R(cx - 24, 62, 48, 1, "#5a5a64"); }
    k.elipse(286, 30, 10, 10, "#3a3a44"); k.elipse(286, 30, 8, 8, "#f4f0e6"); trazo(k, [[286, 30], [286, 24]], "#2a2a30"); trazo(k, [[286, 30], [290, 31]], "#2a2a30"); T.rect(k, 120, 6, 54, 14, () => "#2a2a36"); rotuloG(k, 124, 9, "8 1/2", "#f4efe6", 2);
    const RO = ["#e8504a", "#c8302a", "#a8241e", "#801a16"];
    T.rect(k, -4, 96, 214, 48, (x, y) => rampa(RO, 0.15 + ((y - 96) / 48) * 0.5 + (x % 70 < 2 ? 0.3 : 0), x, y)); k.R(-4, 94, 214, 3, "#3a2a2a"); k.R(-4, 130, 214, 2, "#e8c050");
    for (let x = 4; x < 206; x += 18) T.ventana(k, x, 104, 12, 12, { marco: "#5a1a14", vidrio: "#ffe6a8" });
    rotulo(k, 60, 134, "HAGWORTS EXPRESS", "#e8c050");
    T.rect(k, 210, 92, 100, 52, (x, y) => rampa(["#4a4a54", "#3a3a44", "#2a2a32", "#1c1c22"], 0.15 + ((y - 92) / 52) * 0.6, x, y)); T.rect(k, 214, 80, 40, 30, (x, y) => rampa(RO, 0.2 + (y - 80) / 30 * 0.5, x, y)); T.rect(k, 280, 66, 12, 26, (x, y) => rampa(["#4a4a54", "#3a3a44", "#2a2a32"], (x - 280) / 12, x, y)); k.R(278, 64, 16, 3, "#2a2a32");
    bola(k, 300, 118, 14, 14, (x, y) => rampa(RO, 0.3, x, y)); k.elipse(300, 118, 8, 8, "#e8c050"); k.elipse(300, 118, 3, 3, "#3a3a44");
    [[40, 146], [90, 146], [150, 146], [230, 148], [270, 148]].forEach(([x, y]) => { k.elipse(x, y, 9, 9, "#2a2a30"); k.elipse(x, y, 6, 6, "#5a5a64"); k.elipse(x, y, 2, 2, "#c8302a"); });
    pluma(k, 286, 64, 50, 12, ["#f4f6f8", "#e2e6ea", "#c8ced4", "#aab2ba"], { s: 852, viento: -0.6 });
    suelo3d(k, 152, 180, 160, 110, losas3d(["#c8c4bc", "#b4b0a8", "#9c9890", "#84807a", "#6a6662"], { tx: 18, tz: 12, s: 853 })); k.R(0, 152, W, 2, "#e8c050");
    bruma(k, 130, 170, "#f4f6f8", 0.6, { s: 854 });
    const carrito = (x, b, s) => { sombraE(k, x + 9, b, 11, 2, 0.45); T.rect(k, x, b - 14, 18, 10, madera(["#8a5a32", "#6e4626", "#54321a", "#3a2210", "#261608"], { paso: 3, largo: 99, s })); k.R(x + 2, b - 12, 14, 1, "#c8a040"); T.rect(k, x + 4, b - 22, 8, 8, () => "#d8d0c0"); for (let px = x + 4; px < x + 12; px += 2) k.R(px, b - 22, 1, 8, "#5a4a3a"); k.elipse(x + 8, b - 18, 2, 2, "#f4f4f8"); k.R(x - 2, b - 4, 22, 2, "#5a5a64"); [x + 2, x + 16].forEach((px) => k.elipse(px, b - 1, 2, 2, "#2a2a30")); };
    carrito(30, 170, 855); carrito(274, 172, 856);
  }
  MAG[7] = ["El andén 8½", "El expreso rojo, envuelto en vapor", anden, { fuerza: 0.4, fuego: ["#ffe6a8", "#e8c050"] }];

  function privet(k) {
    k.banda(CIELO, 0, 100);
    nubarron(k, 20, 20, 80, 12); nubarron(k, 220, 16, 90, 12);
    [-38, 42, 122, 202, 282].forEach((x, i) => casaPrivet(k, x, 861 + i * 5, i === 2));
    privetCalle(k);
    const cx = 250; sombraE(k, cx + 18, 170, 26, 3, 0.45); rellena(k, [[cx, 168], [cx, 158], [cx + 8, 156], [cx + 14, 148], [cx + 30, 148], [cx + 38, 156], [cx + 44, 158], [cx + 44, 168]], (x, y) => rampa(["#4a6aa8", "#3a5a94", "#2e4a7c", "#223a64"], 0.2 + ((y - 148) / 20) * 0.5, x, y)); T.rect(k, cx + 16, 150, 12, 6, () => "#a8c8dc"); [cx + 9, cx + 35].forEach((x) => { k.elipse(x, 168, 5, 5, "#2a2a30"); k.elipse(x, 168, 2, 2, "#8a8a96"); });
  }
  function casaPrivet(k, x, s, cuatro, { vidrio = "#a8c8dc" } = {}) {
    T.rect(k, x, 66, 76, 30, (px, py) => rampa(["#fffaf2", "#f4ece0", "#e2d8c8", "#ccc0ac"], 0.1 + ((px - x) / 76) * 0.3 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.1, px, py));
    T.rect(k, x, 96, 76, 34, ladrillo(["#c88466", "#ac6a50", "#8e543e", "#6e3e2e"], { w: 6, h: 3, s: s + 1 }));
    rellena(k, [[x - 4, 67], [x + 6, 44], [x + 70, 44], [x + 80, 67]], tejas(["#a8786a", "#8e6254", "#744e42", "#5a3a30", "#402820"], { w: 5, h: 3, s: s + 2, y0: 44 })); k.R(x - 4, 67, 84, 1, "#402820");
    T.rect(k, x + 56, 38, 6, 10, ladrillo(["#c88466", "#ac6a50", "#8e543e", "#6e3e2e"], { w: 3, h: 2, s: s + 3 }));
    const vs = [[x + 8, 72], [x + 42, 72], [x + 8, 104]];
    vs.forEach(([vx, vy]) => T.ventana(k, vx, vy, 18, 12, { marco: "#f4f4f8", vidrio }));
    k.R(x + 32, 106, 10, 24, cuatro ? "#2a4a8a" : "#5a3a2a"); k.R(x + 32, 104, 10, 2, "#f4f4f8"); k.P(x + 40, 118, "#e8c050"); if (cuatro) { k.R(x + 35, 108, 4, 5, "#e8c050"); rotulo(k, x + 36, 108, "4", "#2a2a30"); }
    T.rect(k, x + 50, 108, 24, 22, (px, py) => rampa(["#f4f4f8", "#e2e2ea", "#c8c8d4"], 0.1 + ((py - 108) % 4) * 0.1, px, py));
    return vs.map(([vx, vy]) => [vx + 9, vy + 6]);
  }
  function privetCalle(k) {
    T.rect(k, 0, 130, W, 14, (x, y) => rampa(["#9ad070", "#84bc5c", "#70a84c"], 0.2 + (hash(x, y, 862) - 0.5) * 0.4, x, y));
    for (let x = 0; x < W; x += 20) if (x % 80 !== 20) copa(k, x + 8, 128, 9, 5, ["#7ab05a", "#5e9a48", "#46803a", "#32662c", "#224c20"], { r: 3, s: 863 + x });
    T.rect(k, 0, 144, W, 6, (x, y) => rampa(["#e2e2e6", "#cacace", "#b0b0b6"], (y - 144) / 6, x, y));
    T.rect(k, 0, 150, W, 30, (x, y) => rampa(["#7a7e86", "#6a6e76", "#5a5e66", "#4a4e56"], 0.2 + ((y - 150) / 30) * 0.4 + (hash(x, y, 864) - 0.5) * 0.1, x, y)); for (let x = 10; x < W; x += 34) k.R(x, 165, 16, 2, "#f4f4f0");
  }
  window.H17.casaPrivet = casaPrivet; window.H17.privetCalle = privetCalle;
  MAG[8] = ["Previt Drive", "La calle de casas iguales de los Dursley", privet, { ven: ["#a8c8dc"], dx: 60 }];
})();

(function () {
  const { rampa, rellena, nubarron, rotulo, montana } = Det;
  const { bola, mezcla, hash, fbm, celdas, bezier, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, tablones, losas3d, copa, briznas, sombraE, luces, espejo, bruma, rayos, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, Q = window.H17;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  window.SitiosIt15 = window.SitiosIt15 || {};
  const MAG = (window.SitiosIt15.magos = window.SitiosIt15.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const ROJO = ["#e05a4a", "#c8323a", "#a02830", "#781c22", "#561418"];
  const VERDES = ["#9ad070", "#84bc5c", "#70a84c", "#5c923e", "#4a7c32", "#386428"];
  const gira = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);

  function salaComun(k) {
    const lit = encendido(k);
    T.rect(k, 0, 0, W, 112, (x, y) => { const u = (x + (Math.floor(y / 12) % 2) * 6) % 12, v = y % 12, d = Math.abs(u - 6) + Math.abs(v - 6); if (d === 0) return "#c89a3a"; return rampa(["#b8323a", "#9a2830", "#7e1f26", "#62171c"], 0.25 + (d < 4 ? -0.12 : 0) + (y / 112) * 0.3 + (fbm(x * 0.2, y * 0.2, 901) - 0.5) * 0.12, x, y); });
    T.rect(k, 0, 86, W, 26, madera(["#8a5a32", "#74482a", "#5e3820", "#482a16", "#321c0e"], { paso: 3, vertical: true, largo: 99, s: 902 }));
    for (let x = 0; x < W; x += 22) k.R(x, 86, 2, 26, "#321c0e"); k.R(0, 85, W, 2, "#c89a3a"); k.R(0, 111, W, 2, "#321c0e");
    bola(k, 34, 30, 20, 16, (x, y) => (y > 30 ? null : "#5a3a24")); T.rect(k, 14, 30, 40, 58, () => "#5a3a24");
    bola(k, 34, 30, 18, 14, (x, y) => (y > 30 ? null : "#2a3670")); T.rect(k, 16, 30, 36, 56, () => "#2a3670");
    if (lit > 0.5) for (let i = 0; i < 12; i++) k.crudo(17 + hash(i, 1, 903) * 34, 18 + hash(i, 2, 903) * 60, 1, 1, "#e8ecff");
    k.R(33, 16, 2, 70, "#5a3a24"); for (let y = 30; y < 86; y += 14) k.R(16, y, 36, 1, "#5a3a24"); k.R(12, 86, 44, 3, "#7a5034");
    [[6, 1], [62, -1]].forEach(([x, s]) => { rellena(k, [[x, 8], [x + s * 10, 8], [x + s * 6, 94], [x - s * 2, 94]], (px, py) => rampa(ROJO, 0.15 + (Math.sin(px * 1.4) * 0.25 + 0.25), px, py)); k.R(x + s * 2 - (s < 0 ? 4 : 0), 54, 5, 2, "#e8c050"); });
    k.R(2, 6, 70, 3, "#5a3a24");
    [[78, 14, "#3a5a3a", "#c8a080"], [222, 16, "#3a3a5a", "#d8b090"]].forEach(([x, y, fondo, cara]) => { T.rect(k, x, y, 24, 32, () => "#c89a3a"); T.rect(k, x + 2, y + 2, 20, 28, () => fondo); bola(k, x + 12, y + 12, 4, 5, () => cara); rellena(k, [[x + 4, y + 30], [x + 6, y + 19], [x + 18, y + 19], [x + 20, y + 30]], () => mezcla(fondo, "#000000", 0.4)); k.R(x, y, 24, 1, "#f2d27a"); });
    T.rect(k, 116, 0, 88, 42, piedra(["#c8bca8", "#b0a490", "#968a78", "#7e7262", "#645a4c"], { tx: 10, ty: 6, s: 904 }));
    T.rect(k, 104, 46, 112, 66, piedra(["#c8bca8", "#b0a490", "#968a78", "#7e7262", "#645a4c"], { tx: 10, ty: 6, s: 905 }));
    T.rect(k, 98, 40, 124, 7, (x, y) => rampa(["#e2d6c2", "#c8bca8", "#b0a490", "#968a78"], (y - 40) / 7, x, y)); k.R(98, 47, 124, 1, "#4a4038");
    bola(k, 160, 70, 30, 14, (x, y) => (y > 70 ? null : "#4a4038")); T.rect(k, 130, 70, 60, 42, () => "#4a4038");
    bola(k, 160, 72, 27, 12, (x, y) => (y > 72 ? null : "#140e0a")); T.rect(k, 133, 72, 54, 40, (x, y) => rampa(["#3a2418", "#2a1a12", "#1c120c", "#140e0a"], 0.2 + (y - 72) / 40, x, y));
    k.R(140, 104, 40, 5, "#3a2416"); trazo(k, [[142, 104], [178, 100]], "#5a3a22", 3); trazo(k, [[144, 100], [176, 106]], "#6a4428", 3);
    fuego(k, 160, 104, 36, 30, { s: 906 });
    [138, 181].forEach((x) => { k.R(x, 96, 2, 14, "#2a2a30"); k.elipse(x + 1, 95, 2, 2, "#c89a3a"); });
    rellena(k, [[148, 6], [172, 6], [172, 24], [160, 34], [148, 24]], (x, y) => rampa(["#d8423a", "#b8323a", "#8e2228"], 0.2 + ((x - 148) / 24) * 0.4, x, y)); trazo(k, [[148, 6], [172, 6], [172, 24], [160, 34], [148, 24], [148, 6]], "#e8c050", 1);
    bola(k, 160, 18, 6, 6, () => "#e8c050"); bola(k, 160, 19, 3.5, 3.5, () => "#c89a3a"); k.P(158, 18, "#5a3a14"); k.P(161, 18, "#5a3a14"); k.R(159, 21, 2, 1, "#5a3a14");
    const velas = [106, 118, 202, 214].map((x) => { k.R(x, 32, 2, 8, "#f4efe6"); k.R(x - 1, 39, 4, 1, "#c89a3a"); k.crudo(x, 29, 2, 3, "#ffcf6a"); k.crudo(x, 30, 1, 1, "#fff4c0"); return { x: x + 1, y: 30, r: 10, col: "#ffcf7a", f: 0.5 }; });
    for (let i = 0; i < 11; i++) { const x = 252 + i * 7, y = 112 - i * 8; T.rect(k, x, y - 8, 9, 8, madera(["#a06a3e", "#8a5a32", "#744a28", "#5e3a1e", "#482c16"], { paso: 2, largo: 99, s: 907 + i })); k.R(x, y - 8, 9, 1, "#c08a54"); }
    trazo(k, [[250, 90], [326, 4]], "#5e3a1e", 2); for (let i = 0; i < 11; i++) k.R(253 + i * 7, 104 - i * 8 - 16, 1, 14, "#482c16");
    suelo3d(k, 112, 180, 160, 60, tablones(["#a06a3e", "#8a5a32", "#744a28", "#5e3a1e", "#482c16"], { pw: 10, L: 50, s: 908 }));
    bola(k, 160, 152, 116, 22, (x, y) => { const q = Math.hypot((x - 160) / 116, (y - 152) / 22); return q > 0.94 ? "#c89a3a" : q > 0.88 ? "#8e2228" : q > 0.84 ? "#e8c050" : rampa(["#c8323a", "#b02a32", "#94222a"], 0.15 + (fbm(x * 0.2, y * 0.4, 909) - 0.5) * 0.4 + q * 0.3, x, y); });
    const sillon = (x, b, s) => {
      sombraE(k, x, b, 22, 3, 0.4);
      rellena(k, [[x - 18, b - 8], [x - 16, b - 36], [x - 8, b - 42], [x + 8, b - 42], [x + 16, b - 36], [x + 18, b - 8]], (px, py) => rampa(ROJO, 0.15 + (Math.abs(px - x) / 18) * 0.35 + ((py - b + 42) / 34) * 0.25, px, py));
      for (let i = -1; i <= 1; i++) for (let j = 0; j < 2; j++) k.P(x + i * 7, b - 34 + j * 9, ROJO[4]);
      T.rect(k, x - 15, b - 16, 30, 8, (px, py) => rampa(ROJO, 0.05 + ((py - b + 16) / 8) * 0.5, px, py));
      [-1, 1].forEach((d) => { T.rect(k, x + d * 17 - 5, b - 20, 10, 16, (px, py) => rampa(ROJO, 0.2 + ((px - x - d * 17 + 5) / 10) * 0.5, px, py)); bola(k, x + d * 17, b - 21, 5, 4, (px, py) => rampa(ROJO, 0.05 + ((px - x - d * 17 + 5) / 10) * 0.4, px, py)); });
      k.R(x - 16, b - 4, 3, 4, "#3a2416"); k.R(x + 13, b - 4, 3, 4, "#3a2416");
    };
    sillon(48, 156, 910); sillon(272, 158, 911);
    sombraE(k, 96, 150, 12, 2, 0.4); T.rect(k, 86, 136, 20, 3, madera(PAL.MAD_O, { paso: 2, largo: 99, s: 912 })); k.R(88, 139, 2, 11, "#3a2416"); k.R(102, 139, 2, 11, "#3a2416");
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) k.R(88 + i * 4, 134 + j, 4, 1, (i + j) % 2 ? "#f4efe6" : "#2a2a30"); k.R(90, 131, 1, 3, "#f4efe6"); k.R(99, 131, 1, 3, "#2a2a30");
    luces(k, [{ x: 160, y: 96, r: 170, ry: 80, col: "#ffa860", f: 0.6 }, ...velas]);
  }
  MAG[9] = ["La sala común de Gryffondir", "La chimenea, los sillones rojos y las escaleras", salaComun, { fuerza: 0.25, fuego: ["#e86a2a", "#ffcf6a", "#fff4c0"], ventanal: "#2a3670" }];

  function cabana(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 104);
    nubarron(k, 30, 14, 80, 12); nubarron(k, 214, 24, 64, 9);
    rellena(k, [[180, 108], [214, 84], [262, 76], [306, 80], [330, 96], [330, 108]], (x, y) => rampa(["#7aa070", "#628a5c", "#4c744a"], 0.2 + ((y - 76) / 32) * 0.5, x, y));
    Q.castillo(k, 266, 80, 0.34, { s: 911 });
    T.rect(k, 0, 92, 200, 22, (x, y) => rampa(["#2a3a2a", "#1e2c20", "#141e16"], ((y - 92) / 22) * 0.8, x, y));
    for (let i = 0; i < 22; i++) { const x = i * 10 - 4 + hash(i, 1, 912) * 6; if (x > 200) break; copa(k, x, 84 + hash(i, 2, 912) * 8, 9, 14, ["#3a6a4a", "#2c5a3c", "#204a30", "#163c26", "#0e2e1c"], { r: 4, s: 913 + i }); }
    for (let i = 0; i < 18; i++) { const x = i * 12 + hash(i, 3, 912) * 8; if (x > 196) break; k.R(x, 98, 2, 16, "#1c140e"); copa(k, x + 1, 96 + hash(i, 4, 912) * 6, 8, 10, ["#4a7a52", "#386a44", "#2a5a36", "#1e4a2a", "#143c20"], { r: 3, s: 940 + i }); }
    T.prado(k, 110, VERDES, 914, { perfil: (x) => 110 + Math.sin(x / 26) * 2 });
    for (let x = 0; x < 196; x++) { const y1 = 110 + Math.sin(x / 26) * 2 + 2 - Math.max(0, x - 176) * 0.15; for (let y = 104; y < y1; y++) k.P(x, y, rampa(["#2a3a2a", "#1e2c20", "#141e16"], 0.5 + (hash(x, y, 990) - 0.5) * 0.3, x, y)); }
    for (let x = 196; x < W; x++) { const y1 = 110 + Math.sin(x / 26) * 2 + 2; for (let y = 105; y < y1; y++) k.P(x, y, rampa(["#7aa070", "#628a5c", "#4c744a"], 0.7 + (hash(x, y, 991) - 0.5) * 0.2, x, y)); }
    for (let y = 130; y < H; y++) { const f = (y - 130) / 50, c = 130 + f * 30, w = 6 + f * 22; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#c8a878", "#b09060", "#96784c"], 0.2 + (hash(x, y, 915) - 0.5) * 0.4 + (Math.abs(x - c) / w) * 0.3, x, y)); }
    const cx = 132, b = 132, r = 30, hh = 30;
    sombraE(k, cx + 4, b, r + 8, 4, 0.4);
    T.rect(k, cx - r, b - hh, 2 * r, hh, (x, y) => { const c = celdas(x, y, 7, 5, 916, 0.5), u = (x - cx) / r; return c.borde < 0.12 ? "#4a4038" : rampa(["#d0c0a8", "#b8a890", "#9e8e78", "#847460", "#6a5a48"], 0.1 + (u + 1) * 0.22 + Math.pow(Math.abs(u), 4) * 0.3 + (c.id - 0.5) * 0.2, x, y); });
    T.rect(k, cx + 12, 50, 9, 26, piedra(["#b8a890", "#9e8e78", "#847460", "#6a5a48", "#504436"], { tx: 4, ty: 3, s: 917 })); k.R(cx + 11, 49, 11, 2, "#504436");
    rellena(k, [[cx - r - 9, b - hh + 5], [cx - 2, 54], [cx + 2, 54], [cx + r + 9, b - hh + 5]], (x, y) => { const u = (x - cx) / (r + 9); return rampa(["#e0c078", "#c8a860", "#ae904c", "#92763c", "#765e2e"], 0.12 + (u + 1) * 0.28 + (Math.floor((x - cx) / 2 + y * 0.6) % 3 === 0 ? 0.1 : 0) + (hash(Math.floor(x), Math.floor(y / 2), 918) - 0.5) * 0.15, x, y); });
    for (let x = cx - r - 9; x < cx + r + 9; x++) if (hash(x, 1, 919) > 0.3) k.R(x, b - hh + 4, 1, 2 + Math.floor(hash(x, 2, 919) * 3), "#92763c");
    Det.humo(k, cx + 16, 48, "#e8e8ec", 0.45, 6);
    bola(k, cx - 3, b - 18, 8, 6, (x, y) => (y > b - 18 ? null : "#3a2818")); T.rect(k, cx - 11, b - 18, 16, 18, () => "#3a2818");
    bola(k, cx - 3, b - 18, 6, 5, (x, y) => (y > b - 18 ? null : "#8a5a32")); T.rect(k, cx - 9, b - 18, 12, 18, madera(["#a06a3e", "#8a5a32", "#744a28", "#5e3a1e", "#482c16"], { paso: 3, vertical: true, largo: 99, s: 920 }));
    [b - 14, b - 5].forEach((y) => k.R(cx - 9, y, 8, 1, "#2a2a30")); k.P(cx + 1, b - 9, "#c89a3a");
    const vs = [[cx - 24, b - 22], [cx + 12, b - 22]].map(([x, y]) => { T.ventana(k, x, y, 8, 7, { marco: "#5a3a24", vidrio: "#ffd27a" }); return [x + 4, y + 3]; });
    for (let i = 0; i < 6; i++) { const x = cx + 34 + (i % 3) * 5, y = b - 3 - Math.floor(i / 3) * 5; k.elipse(x, y, 2.5, 2.5, "#8a5a32"); k.elipse(x, y, 1.5, 1.5, "#c8a070"); }
    trazo(k, [[cx - 40, b], [cx - 36, b - 22]], "#5a3a24", 2); trazo(k, [[cx - 44, b - 14], [cx - 31, b - 16]], "#3a2a20", 1); trazo(k, [[cx - 44, b - 14], [cx - 38, b - 19], [cx - 31, b - 16]], "#c8c0a8", 1);
    for (let x = 186; x < 300; x += 12) { k.R(x, 132, 2, 12, "#7a5a3a"); } k.R(184, 134, 118, 2, "#8a6a40"); k.R(184, 140, 118, 2, "#8a6a40");
    const calabaza = (x, b2, r2, s) => { sombraE(k, x, b2, r2 * 1.1, r2 * 0.25, 0.35); bola(k, x, b2 - r2 * 0.8, r2 * 1.15, r2 * 0.85, (px, py) => { const t = Math.abs(Math.sin(((px - x) / r2) * 2.4)); return rampa(["#ffb04a", "#f0902a", "#d8761e", "#b05a14", "#80400c"], 0.12 + ((px - x + r2) / (2 * r2)) * 0.35 + t * 0.18 + ((py - b2 + r2 * 1.6) / (r2 * 1.7)) * 0.2, px, py); }); k.R(x - 1, b2 - r2 * 1.6 - 2, 2, 3, "#5a6a2a"); };
    [[202, 160, 9], [232, 166, 12], [266, 158, 8], [292, 168, 11], [214, 150, 5], [250, 150, 6], [280, 148, 5]].forEach(([x, b2, r2], i) => calabaza(x, b2, r2, 921 + i));
    for (let i = 0; i < 14; i++) { const x = 190 + hash(i, 1, 922) * 110, y = 146 + hash(i, 2, 922) * 26; bola(k, x, y, 4, 2.5, (px, py) => rampa(["#7ab05a", "#5e9a48", "#46803a"], (px - x + 4) / 8, px, py)); }
    luces(k, vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  MAG[11] = ["La cabaña de Higrad", "La casa de piedra junto al bosque, con sus calabazas", cabana, { ven: VEN, tinte: 0.1 }];

  function camara(k) {
    const FX = 160, FY = 92, f = (y) => (y - FY) / 100;
    const PG = ["#7a8a7e", "#66766a", "#526258", "#404e46", "#2e3a34", "#1e2824"];
    T.rect(k, 0, 0, W, 112, (x, y) => rampa(["#26322c", "#1e2824", "#161e1a", "#101612"], 0.3 + (fbm(x * 0.05, y * 0.05, 931) - 0.5) * 0.4 + Math.abs(x - 160) / 320, x, y));
    T.rect(k, 104, 0, 112, 112, piedra(PG.slice(1), { tx: 14, ty: 9, s: 932 }));
    rellena(k, [[132, 62], [190, 62], [198, 112], [124, 112]], (x, y) => (Math.floor((x + Math.sin(y / 6) * 2) / 3) % 2 ? "#5e6e64" : "#4a5850"));
    rellena(k, [[128, 72], [124, 30], [132, 10], [160, 4], [188, 10], [196, 30], [192, 72]], (x, y) => rampa(["#8a9a8e", "#76867a", "#627268", "#4e5c54", "#3a4640"], 0.15 + (Math.abs(x - 160) / 36) * 0.4 + (fbm(x * 0.15, y * 0.15, 933) - 0.5) * 0.2, x, y));
    trazo(k, [[134, 30], [154, 35]], "#2e3a34", 3); trazo(k, [[186, 30], [166, 35]], "#2e3a34", 3);
    k.elipse(145, 39, 5, 2, "#141c18"); k.elipse(175, 39, 5, 2, "#141c18");
    rellena(k, [[157, 36], [163, 36], [168, 54], [152, 54]], (x, y) => rampa(["#8a9a8e", "#76867a", "#627268"], (x - 152) / 16, x, y));
    rellena(k, [[136, 56], [184, 56], [192, 76], [128, 76]], (x, y) => (Math.floor((x + Math.sin(y / 5) * 2) / 3) % 2 ? "#6a7a70" : "#56665c"));
    bola(k, 160, 70, 14, 10, () => "#0a100c"); k.R(146, 70, 28, 1, "#2e3a34");
    T.rect(k, 0, 112, W, 68, (x, y) => rampa(["#2a4a42", "#203c36", "#18302a", "#10241e"], 0.3 + ((y - 112) / 68) * 0.4 + (Math.sin(x * 0.3 + y * 1.7) > 0.92 ? -0.3 : 0), x, y));
    suelo3d(k, 112, 180, FX, FY, losas3d(["#7a8a7e", "#66766a", "#526258", "#404e46", "#2e3a34"], { tx: 20, tz: 14, s: 935, charcos: 0.2 }), { dentro: (x, y) => Math.abs(x - FX) < 16 + (y - 112) * 0.62 });
    const ojos = [], PC = ["#9aaa9e", "#86968a", "#728276", "#5e6c62", "#4a564e", "#36403a"];
    [0.32, 0.44, 0.6, 0.84, 1.2, 1.7].forEach((e, i) => [-1, 1].forEach((lado) => {
      const yb = Math.min(FY + e * 100, 196), x = FX + lado * 100 * e, w = Math.round(22 * e), top = Math.max(0, yb - 210 * e);
      k.alfa(0.35, () => T.rect(k, x - w / 2, yb, w, Math.min(40 * e, H - yb), (px, py) => (Math.sin(py * 1.3 + px * 0.2) > -0.4 ? PC[3] : null)));
      T.rect(k, x - w / 2, top, w, yb - top, (px, py) => { const c = celdas(px, py, 6, 4, 934 + i, 0.4); return c.borde < 0.1 ? PC[5] : rampa(PC, 0.15 + ((px - x + w / 2) / w) * 0.5 + (c.id - 0.5) * 0.15 + (lado > 0 ? 0.08 : 0), px, py); });
      for (let py = Math.max(top, yb - 160 * e); py < yb - 4; py++) { const o = Math.sin(py * (0.25 / e)) * w * 0.36, g = Math.max(1, Math.round(3.5 * e)); if (Math.cos(py * (0.25 / e)) > -0.2) k.R(x + o - g / 2, py, g, 1, Math.cos(py * (0.25 / e)) > 0.6 ? "#8ab08a" : "#5a7a5e"); }
      const hy = yb - 168 * e; if (hy > top + 2) { bola(k, x, hy, 5 * e + 1, 3 * e + 1, () => "#6a8a6e"); ojos.push([x - 2 * e, hy - 1], [x + 2 * e, hy - 1]); }
      if (yb < H) k.R(x - w / 2 - 1, yb - 3, w + 2, 3, PC[4]);
    }));
    ojos.forEach(([x, y]) => k.crudo(x, y, 1, 1, "#c8e86a"));
    trazo(k, bezier([30, 176], [70, 150], [40, 128], [92, 120], 30), "#9aa48a", 5, 2); trazo(k, bezier([30, 176], [70, 150], [40, 128], [92, 120], 30), "#c8cca8", 1);
    [[176, 150], [140, 162], [188, 170]].forEach(([x, y], i) => { k.R(x, y, 6, 1, "#e8e4d4"); k.R(x - 1, y - 1, 2, 3, "#e8e4d4"); k.R(x + 5, y - 1, 2, 3, "#e8e4d4"); });
    bola(k, 150, 146, 3, 2.5, () => "#e8e4d4"); k.P(149, 146, "#2e3a34"); k.P(151, 146, "#2e3a34");
    luces(k, [{ x: 160, y: 60, r: 120, ry: 80, col: "#9ae8a0", f: 0.35 }, ...ojos.map(([x, y]) => ({ x, y, r: 5, col: "#c8e86a", f: 0.6 }))]);
  }
  MAG[12] = ["La Cámara de los Secretos", "La gran sala de piedra, con la cara de Slythiren, sus serpientes y el agua", camara, { cielo: "propio", fuerza: 0.1, fuego: ["#c8e86a"] }];

  function privetNoche(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 100);
    nubarron(k, 30, 18, 70, 10);
    [-38, 42, 122, 202, 282].forEach((x, i) => Q.casaPrivet(k, x, 941 + i * 5, i === 2, { vidrio: "#4a5a72" }));
    T.ventana(k, 50, 72, 18, 12, { marco: "#f4f4f8", vidrio: "#ffe6a8" });
    Q.privetCalle(k);
    T.rect(k, 60, 122, 40, 9, ladrillo(["#c88466", "#ac6a50", "#8e543e", "#6e3e2e"], { w: 5, h: 3, s: 942 })); k.R(59, 121, 42, 2, "#d8d0c8");
    const gx = 80, gy = 121; bola(k, gx, gy - 5, 5, 5, (x, y) => rampa(["#c8a070", "#a8804e", "#86623a"], 0.2 + ((x - gx + 5) / 10) * 0.5 + (Math.floor(y) % 3 === 0 ? 0.2 : 0), x, y)); bola(k, gx + 1, gy - 12, 4, 3.5, () => "#b08a58");
    k.poli([[gx - 2, gy - 15], [gx - 1, gy - 18], [gx + 1, gy - 15]], "#86623a"); k.poli([[gx + 2, gy - 15], [gx + 3, gy - 18], [gx + 4, gy - 15]], "#86623a");
    k.R(gx - 2, gy - 13, 2, 2, "#3a2a1a"); k.R(gx + 2, gy - 13, 2, 2, "#3a2a1a"); k.crudo(gx - 1, gy - 12, 1, 1, "#e8d84a"); k.crudo(gx + 3, gy - 12, 1, 1, "#e8d84a"); trazo(k, [[gx + 5, gy - 2], [gx + 9, gy - 4], [gx + 10, gy + 2]], "#86623a", 2);
    const bx = 159, by = 131; sombraE(k, bx, by, 9, 1.5, 0.4); bola(k, bx, by - 2, 8, 3, (x, y) => (Math.floor(x + y) % 2 ? "#a8804e" : "#86623a")); bola(k, bx, by - 5, 6, 3, () => "#f4f4f8"); bola(k, bx - 2, by - 6, 2, 2, () => "#f0c8a8"); k.R(bx + 2, by - 7, 4, 3, "#f4efe0"); k.P(bx + 4, by - 6, "#a82a30");
    const noche = lit > 0.5, L = [];
    [[24, 146], [108, 146], [212, 146], [298, 146]].forEach(([x, b2], i) => { const l = T.farola(k, x, b2, 30, { globo: noche && i > 0 && i < 3 ? "#3a3a44" : "#ffd27a" }); if (!(noche && i > 0 && i < 3)) L.push(l); });
    if (noche) [[120, 108], [136, 112], [196, 104], [180, 114]].forEach(([x, y]) => { k.halo(x, y, 6, 6, "#ffe6a8", 0.5); k.crudo(x - 1, y - 1, 2, 2, "#fff4c0"); });
    const mx = 236, my = 34;
    if (noche) k.alfa(0.25, () => k.poli([[mx + 30, my - 4], [mx + 90, my - 22], [mx + 90, my + 16]], "#fff4c0"));
    [[mx, my + 8], [mx + 26, my + 8]].forEach(([x, y]) => { k.elipse(x, y, 5, 5, "#1c1c22"); k.elipse(x, y, 4, 4, "#8a8a96"); k.elipse(x, y, 3, 3, "#2a2a32"); trazo(k, [[x - 3, y], [x + 3, y]], "#8a8a96", 1); trazo(k, [[x, y - 3], [x, y + 3]], "#8a8a96", 1); k.P(x, y, "#c8c8d0"); });
    trazo(k, [[mx, my + 8], [mx + 8, my + 2], [mx + 20, my + 2], [mx + 26, my + 8]], "#5a5a64", 2); trazo(k, [[mx + 8, my + 2], [mx + 12, my + 8]], "#5a5a64", 1);
    bola(k, mx + 16, my, 5, 3, (x, y) => rampa(["#7a7a86", "#4a4a54", "#2a2a32"], (y - my + 3) / 6, x, y)); k.R(mx + 4, my - 1, 8, 3, "#1c1c22");
    trazo(k, [[mx + 22, my + 2], [mx + 24, my - 6], [mx + 21, my - 8]], "#8a8a96", 1); k.crudo(mx + 26, my - 3, 3, 3, "#ffe6a8");
    bola(k, mx + 12, my + 12, 10, 3, (x, y) => rampa(["#4a6a4a", "#3a5a3a", "#2a4a2a"], (y - my - 9) / 6, x, y)); k.R(mx + 4, my + 10, 3, 1, "#8a8a96");
    luces(k, L);
  }
  MAG[14] = ["La noche de Previt Drive", "La noche en que dejan a Antonio bebé en la puerta de los Dursley", privetNoche, { ven: ["#a8c8dc", "#ffe6a8"], tinte: 0.2 }];

  function ajedrez(k) {
    const FX = 160, FY = 70, f = (y) => (y - FY) / 100, sx = (X, y) => FX + X * f(y);
    T.rect(k, 0, 0, W, 106, piedra(["#565662", "#484854", "#3a3a46", "#2e2e38", "#22222a"], { tx: 16, ty: 9, s: 951 }));
    k.alfa(0.5, () => T.rect(k, 0, 0, W, 30, (x, y) => (y < 30 - (hash(x, 1, 952) * 6) ? "#0c0c12" : null)));
    bola(k, 160, 62, 14, 10, (x, y) => (y > 62 ? null : "#2a2a32")); T.rect(k, 146, 62, 28, 44, () => "#2a2a32"); bola(k, 160, 64, 11, 8, (x, y) => (y > 64 ? null : "#0e0e14")); T.rect(k, 149, 64, 22, 42, () => "#0e0e14");
    const L = [[34, 58], [102, 50], [218, 50], [286, 58]].map(([x, y]) => T.antorcha(k, x, y, { r: 34 }));
    suelo3d(k, 104, 180, FX, FY, (X, z) => {
      const i = Math.floor(X / 26), j = Math.floor(z / 0.32), ux = X / 26 - i, uz = z / 0.32 - j, blanca = (i + j) % 2 === 0;
      if (ux < 0.04 || uz < 0.05) return "#1a1a20";
      const vena = Math.abs(Math.sin(X * 0.3 + z * 9 + fbm(X * 0.05, z * 2, 953) * 6)) < 0.08;
      return blanca ? (vena ? "#c8c4bc" : rampa(["#f4f2ec", "#e4e0d8"], 0.3, X, z)) : vena ? "#5a5a64" : "#26262e";
    });
    const pieza = (X, yb, tipo, blanca) => {
      const e = f(yb) * 1.25, x = sx(X, yb), L2 = (v) => v * e, pal = blanca ? ["#ffffff", "#e8e6e0", "#cac6bc", "#a8a49a", "#86827a"] : ["#6a6a76", "#50505c", "#3a3a46", "#28282f", "#16161c"];
      sombraE(k, x, yb, L2(14), L2(3), 0.5);
      T.rect(k, x - L2(13), yb - L2(8), L2(26), L2(8), (px, py) => rampa(pal, 0.12 + ((px - x + L2(13)) / L2(26)) * 0.6, px, py));
      bola(k, x, yb - L2(8), L2(13), L2(3), (px, py) => rampa(pal, 0.05 + ((px - x + L2(13)) / L2(26)) * 0.5, px, py));
      const top = yb - L2(tipo === "peon" ? 46 : tipo === "rey" ? 92 : tipo === "reina" ? 86 : 76);
      rellena(k, [[x - L2(10), yb - L2(9)], [x - L2(5), top + L2(14)], [x + L2(5), top + L2(14)], [x + L2(10), yb - L2(9)]], (px, py) => rampa(pal, 0.1 + ((px - x + L2(10)) / L2(20)) * 0.65, px, py));
      T.rect(k, x - L2(8), top + L2(12), L2(16), L2(4), (px, py) => rampa(pal, 0.05 + ((px - x + L2(8)) / L2(16)) * 0.6, px, py));
      const cab = (px, py) => rampa(pal, 0.08 + ((px - x + L2(10)) / L2(20)) * 0.6, px, py);
      if (tipo === "torre") { T.rect(k, x - L2(9), top, L2(18), L2(13), cab); for (let i = 0; i < 3; i++) T.rect(k, x - L2(9) + i * L2(7), top - L2(4), L2(4), L2(4), cab); }
      else if (tipo === "caballo") rellena(k, [[x - L2(8), top + L2(13)], [x - L2(9), top + L2(1)], [x - L2(4), top - L2(9)], [x - L2(2), top - L2(14)], [x + L2(1), top - L2(9)], [x + L2(11), top - L2(2)], [x + L2(12), top + L2(4)], [x + L2(4), top + L2(4)], [x + L2(7), top + L2(13)]], cab);
      else if (tipo === "alfil") { bola(k, x, top + L2(2), L2(7), L2(11), cab); trazo(k, [[x + L2(1), top - L2(4)], [x + L2(4), top + L2(4)]], pal[4], Math.max(1, L2(1.5))); bola(k, x, top - L2(10), L2(2), L2(2), cab); }
      else if (tipo === "reina") { bola(k, x, top + L2(4), L2(9), L2(9), cab); for (let i = -2; i <= 2; i++) bola(k, x + i * L2(4), top - L2(5) + Math.abs(i) * L2(1), L2(1.6), L2(1.6), cab); }
      else if (tipo === "rey") { bola(k, x, top + L2(6), L2(9), L2(8), cab); T.rect(k, x - L2(1.5), top - L2(10), L2(3), L2(12), cab); T.rect(k, x - L2(5), top - L2(6), L2(10), L2(3), cab); }
      else bola(k, x, top + L2(6), L2(7), L2(7), cab);
    };
    ["torre", "caballo", "alfil", "reina", "rey", "alfil", "caballo", "torre"].forEach((t, i) => pieza(-91 + i * 26, 108, t, false));
    [[-65, "peon"], [-13, "peon"], [39, "peon"], [65, "peon"]].forEach(([X, t]) => pieza(X, 116, t, false));
    [[-117, 160, "caballo"], [104, 166, "torre"], [-40, 132, "peon"]].forEach(([X, yb, t]) => pieza(X, yb, t, true));
    [[96, 150, 10, 5], [222, 140, 8, 4], [140, 172, 12, 5], [60, 134, 6, 3]].forEach(([x, b2, w, a]) => k.roca(x, b2, w, a, "#cac6bc", "#f4f2ec", "#86827a"));
    luces(k, L);
  }
  MAG[15] = ["El ajedrez gigante", "El tablero de piedra bajo la trampilla, con sus piezas enormes", ajedrez, { cielo: "propio", fuerza: 0.08, fuego: ["#ffcf6a", "#ff9a3a", "#fff4c0", "#ffd27a"] }];

  function sauce(k) {
    k.banda(CIELO, 0, 112);
    nubarron(k, 30, 20, 80, 12); nubarron(k, 252, 30, 60, 9);
    montana(k, 50, 112, 170, 42, { roca: ["#8aa4c0", "#7a96b4", "#6a88a8", "#5c7a9c"] }); montana(k, 296, 112, 140, 36, { roca: ["#8aa4c0", "#7a96b4", "#6a88a8", "#5c7a9c"] });
    rellena(k, [[-4, 114], [-4, 96], [40, 88], [104, 92], [150, 114]], (x, y) => rampa(["#7aa070", "#628a5c", "#4c744a"], 0.2 + ((y - 88) / 26) * 0.5, x, y));
    Q.castillo(k, 62, 92, 0.36, { s: 961 });
    T.prado(k, 110, VERDES, 962, { perfil: (x) => 110 + Math.sin(x / 30) * 2 });
    const tx = 204, tb = 154;
    sombraE(k, tx, tb, 46, 6, 0.4);
    [[-1, 30], [1, 34], [-1, 18], [1, 16]].forEach(([s, l], i) => trazo(k, bezier([tx + s * 6, tb - 4], [tx + s * l * 0.4, tb - 2], [tx + s * l * 0.8, tb + 2], [tx + s * l, tb + 4 - i], 16), "#5e4430", 4 - (i > 1 ? 1 : 0), 1));
    rellena(k, [[tx - 18, tb], [tx - 12, tb - 26], [tx - 16, tb - 48], [tx - 8, tb - 60], [tx + 8, tb - 58], [tx + 14, tb - 44], [tx + 12, tb - 24], [tx + 20, tb]], corteza(["#8a6a4e", "#74583e", "#5e4630", "#4a3624", "#36261a"], tx - 18, 38, { s: 963, grieta: 0.7 }));
    bola(k, tx + 2, tb - 34, 4, 7, () => "#1c140e");
    const ramas = [[[tx - 6, tb - 56], [tx - 30, tb - 92], [tx - 70, tb - 104], [tx - 100, tb - 96]], [[tx - 10, tb - 50], [tx - 40, tb - 62], [tx - 70, tb - 52], [tx - 96, tb - 64]], [[tx, tb - 58], [tx + 6, tb - 100], [tx - 12, tb - 124], [tx - 2, tb - 146]], [[tx + 6, tb - 56], [tx + 34, tb - 90], [tx + 60, tb - 104], [tx + 92, tb - 100]], [[tx + 10, tb - 50], [tx + 46, tb - 56], [tx + 76, tb - 46], [tx + 104, tb - 58]]];
    const puntas = [];
    ramas.forEach((r, i) => { const pts = bezier(...r, 30); trazo(k, pts, "#4a3624", 8, 2); trazo(k, pts.map(([x, y]) => [x - 1, y - 1]), "#74583e", 3, 1); puntas.push(r[3]); });
    ramas.forEach((r, i) => { const pts = bezier(...r, 30); for (let j = 6; j < 30; j += 2) { const [x, y] = pts[j], l = 8 + hash(i, j, 964) * 18, d = hash(j, i, 966) > 0.5 ? 1 : -1; for (let t = 0; t < l; t++) { const px = x + Math.sin(t / 5 + i + j) * 2, py = y + 2 + t; k.P(px, py, t % 3 ? "#6aa84e" : "#4e8a3c"); if (t % 2 === 0) k.P(px + d, py, t % 4 ? "#9ac870" : "#7ab05a"); } } });
    k.alfa(0.4, () => puntas.forEach(([x, y], i) => { trazo(k, bezier([x, y], [x + (i % 2 ? 14 : -14), y - 10], [x + (i % 2 ? 22 : -22), y + 6], [x + (i % 2 ? 16 : -16), y + 18], 14), "#f4f8ec", 1); }));
    const ahora = Det.cuando(k);
    if (ahora.d !== 2 || ahora.h >= 11) {
      const cx = 120, cy = 50, a = -0.32, car = (pts) => gira(pts, cx, cy, a);
      rellena(k, car([[cx - 18, cy + 6], [cx - 18, cy - 2], [cx - 10, cy - 4], [cx - 6, cy - 11], [cx + 8, cy - 11], [cx + 12, cy - 4], [cx + 18, cy - 2], [cx + 18, cy + 6]]), (x, y) => rampa(["#9ad8e8", "#7ac0d8", "#5aa4c4", "#3e88a8"], 0.2 + ((y - cy + 11) / 17) * 0.6, x, y));
      rellena(k, car([[cx - 5, cy - 4], [cx - 3, cy - 9], [cx + 7, cy - 9], [cx + 10, cy - 4]]), () => "#d8eef4"); k.poli(car([[cx + 2, cy - 9], [cx + 3, cy - 9], [cx + 3, cy - 4], [cx + 2, cy - 4]]), "#3e88a8");
      car([[cx - 11, cy + 6], [cx + 11, cy + 6]]).forEach(([x, y]) => { k.elipse(x, y, 3, 3, "#1c1c22"); k.elipse(x, y, 1, 1, "#c8c8d0"); });
      const [fx, fy] = car([[cx + 18, cy + 1]])[0]; k.crudo(fx - 1, fy - 1, 2, 2, "#fff4c0"); k.alfa(0.2, () => k.poli([[fx, fy], [fx + 30, fy - 20], [fx + 36, fy + 4]], "#fff4c0"));
      trazo(k, bezier([tx - 30, tb - 92], [cx + 20, cy + 20], [cx, cy + 14], [cx - 20, cy + 10], 16), "#4a3624", 3, 1);
    }
    for (let i = 0; i < 24; i++) { const x = 90 + hash(i, 1, 965) * 220, y = 30 + hash(i, 2, 965) * 120; k.R(x, y, 2, 1, i % 3 ? "#7ab05a" : "#c8b048"); }
    [[150, 162], [252, 170], [176, 172]].forEach(([x, y]) => trazo(k, [[x, y], [x + 10, y - 2], [x + 14, y - 5]], "#5e4430", 1));
  }
  MAG[16] = ["El Sauce Boxeador", "El árbol furioso, con el coche volador de los Waesley entre sus ramas", sauce, { tinte: 0.2, dx: -60 }];

  function casaGritos(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 112);
    nubarron(k, 30, 22, 90, 12, ["#e8e4e8", "#ccc6d0", "#aaa4b4"]);
    montana(k, 60, 114, 180, 46, { roca: ["#8a8aa0", "#7a7a92", "#6a6a84", "#5c5c76"] }); montana(k, 270, 114, 160, 38, { roca: ["#8a8aa0", "#7a7a92", "#6a6a84", "#5c5c76"] });
    const vs = [];
    for (let i = 0; i < 9; i++) { const x = 6 + i * 13, b2 = 116 + (i % 3), h = 8 + (i % 3) * 2; T.rect(k, x, b2 - h, 10, h, () => (i % 2 ? "#c8b8a0" : "#b8a88c")); rellena(k, [[x - 1, b2 - h], [x + 5, b2 - h - 5], [x + 11, b2 - h]], () => (i % 2 ? "#6a5a5a" : "#5a4a4a")); k.R(x + 3, b2 - h + 3, 2, 2, "#ffd27a"); vs.push([x + 4, b2 - h + 4]); }
    rellena(k, [[-4, 180], [-4, 128], [60, 118], [130, 100], [200, 98], [270, 112], [324, 124], [324, 180]], (x, y) => rampa(["#b8a878", "#a09064", "#887a52", "#706442", "#5a5034"], 0.12 + ((y - 98) / 82) * 0.5 + (fbm(x * 0.08, y * 0.1, 971) - 0.5) * 0.35, x, y));
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 972) * W, y = 120 + hash(i, 2, 972) * 56; bola(k, x, y, 6 + hash(i, 3, 972) * 8, 1.5, () => "#7a6a4a"); }
    const cx = 168, b = 104, a = -0.06, gr = (pts) => gira(pts, cx, b, a);
    rellena(k, gr([[cx - 44, b], [cx - 44, b - 34], [cx + 40, b - 34], [cx + 40, b]]), (x, y) => rampa(["#9a8a7a", "#847464", "#6e6052", "#5a4e42", "#463c32"], 0.15 + ((x - cx + 44) / 84) * 0.4 + (Math.floor(x / 4) % 2 ? 0.08 : 0) + (hash(Math.floor(x / 4), Math.floor(y / 9), 973) - 0.5) * 0.2, x, y));
    rellena(k, gr([[cx - 50, b - 33], [cx - 30, b - 60], [cx + 24, b - 62], [cx + 46, b - 33]]), (x, y) => rampa(["#6a5a52", "#5a4a44", "#4a3c38", "#3a2e2c"], 0.15 + ((y - b + 62) / 29) * 0.4 + (Math.floor(x / 3 + y / 2) % 3 === 0 ? 0.12 : 0), x, y));
    k.poli(gr([[cx - 8, b - 52], [cx + 4, b - 56], [cx + 6, b - 46], [cx - 6, b - 44]]), "#1c1614");
    rellena(k, gr([[cx + 18, b - 58], [cx + 18, b - 74], [cx + 27, b - 76], [cx + 27, b - 66]]), ladrillo(["#8a6a5a", "#74584a", "#5e463a", "#46342a"], { w: 3, h: 2, s: 974 }));
    [[cx - 34, b - 28], [cx - 4, b - 28], [cx + 22, b - 28], [cx - 34, b - 14], [cx + 22, b - 14]].forEach(([x, y]) => { const pts = gr([[x, y], [x + 12, y], [x + 12, y + 10], [x, y + 10]]); k.poli(pts, "#1c1614"); const [p0, p1, p2, p3] = pts; trazo(k, [p0, p2], "#a08a6a", 2); trazo(k, [p1, p3], "#a08a6a", 2); });
    const pu = gr([[cx - 18, b], [cx - 18, b - 18], [cx - 8, b - 18], [cx - 8, b]]); k.poli(pu, "#2a201a"); trazo(k, [pu[1], pu[3]], "#8a7458", 2);
    k.R(cx - 48, b - 2, 94, 3, "#3a3028");
    [[54, 132, 1], [272, 128, -1], [110, 112, 1]].forEach(([x, b2, s], i) => { const pts = [[x, b2], [x + s * 4, b2 - 20], [x - s * 2, b2 - 34], [x + s * 6, b2 - 52]]; trazo(k, bezier(...pts, 20), "#3a2e26", 4 - (i > 1 ? 2 : 0), 1); [[0.4, -1], [0.6, 1], [0.8, -1], [0.95, 1]].forEach(([t, d], j) => { const [px, py] = bezier(...pts, 20)[Math.round(t * 20)]; trazo(k, [[px, py], [px + d * 10, py - 8], [px + d * 16, py - 6]], "#3a2e26", 2, 1); }); });
    for (let x = 6; x < 150; x += 14) { const y = 150 - x * 0.12; trazo(k, [[x, y + 12], [x + (x % 28 === 6 ? 2 : 0), y]], "#5a4636", 2); } trazo(k, [[6, 146], [146, 130]], "#6a5444", 1); trazo(k, [[6, 152], [80, 144]], "#6a5444", 1);
    k.R(119, 128, 2, 14, "#5a4636"); k.R(103, 119, 33, 10, "#7a6046"); k.R(103, 119, 33, 1, "#9a7a5a"); k.R(103, 128, 33, 1, "#4a3828"); rotulo(k, 106, 122, "PELIGRO", "#2a2018");
    [[60, 30], [84, 22], [230, 18], [250, 26]].forEach(([x, y]) => trazo(k, [[x - 4, y - 2], [x, y], [x + 4, y - 2]], "#1c1614", 1));
    k.R(cx - 30, b - 64, 4, 3, "#1c1614"); k.P(cx - 27, b - 65, "#1c1614");
    luces(k, vs.map(([x, y]) => ({ x, y, r: 6, col: LUZ, f: lit * 0.7 })));
  }
  MAG[18] = ["La Casa de los Gritos", "La casa más encantada de Gran Bretaña, tapiada y torcida en lo alto de la colina", casaGritos, { tinte: 0.15, dx: 80, ven: VEN }];
})();

(function () {
  const { rampa, rellena, nubarron, rotulo, montana } = Det;
  const { bola, mezcla, hash, fbm, celdas, bezier, trazo, madera, piedra, ladrillo, tejas, suelo3d, tablones, losas3d, copa, sombraE, luces, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, Q = window.H17;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  window.SitiosIt15 = window.SitiosIt15 || {};
  const MAG = (window.SitiosIt15.magos = window.SitiosIt15.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const SETO = ["#5a8a4a", "#4a7a3e", "#3c6a34", "#2e5a2a", "#224a20", "#183a18"];
  function marca(k, x, y, e = 1) {
    k.halo(x, y + 6 * e, 30 * e, 26 * e, "#3fe87a", 0.35);
    const V = "#7af0a0", O = "#2a8a4a";
    bola(k, x, y, 11 * e, 10 * e, () => V); k.crudo(x - 6 * e, y + 6 * e, 12 * e, 6 * e, V);
    k.crudo(x - 6 * e, y - 2 * e, 4 * e, 4 * e, O); k.crudo(x + 2 * e, y - 2 * e, 4 * e, 4 * e, O); k.crudo(x - 1 * e, y + 3 * e, 2 * e, 2 * e, O);
    for (let i = -2; i <= 2; i++) k.crudo(x + i * 2.4 * e, y + 8 * e, 1, 3 * e, O);
    const pts = bezier([x, y + 12 * e], [x + 14 * e, y + 22 * e], [x - 14 * e, y + 32 * e], [x + 6 * e, y + 44 * e], 30);
    pts.forEach(([px, py], i) => k.crudo(px - 1, py, Math.max(1, 3 * e - i / 14), 2, V)); k.crudo(pts[29][0] + 1, pts[29][1], 3 * e, 2 * e, V);
  }
  window.H17.marca = marca;

  function mundial(k) {
    const lit = encendido(k), noche = lit > 0.5;
    k.banda(CIELO, 0, 112);
    nubarron(k, 40, 20, 70, 10);
    montana(k, 60, 112, 200, 36, { roca: ["#6a8a74", "#5a7a66", "#4c6c58", "#3e5e4a"] });
    const tope = (x) => 40 + Math.pow((x - 330) / 170, 2) * 18;
    for (let x = 160; x < W; x++) for (let y = Math.round(tope(x)); y < 112; y++) k.P(x, y, rampa(["#e8c878", "#d4b060", "#b8964a", "#9a7a3a", "#7c602c"], 0.15 + ((330 - x) / 170) * 0.35 + (y > tope(x) + 4 ? 0.1 : 0), x, y));
    const vs = [];
    for (let x = 166; x < W; x += 9) [0, 1].forEach((p) => { const y = tope(x) + 8 + p * 22, h = 14; if (y + h > 110) return; T.ventana(k, x, y, 5, h, { arco: true, marco: "#7c602c", vidrio: "#ffd27a", cruz: false }); vs.push([x + 2, y + 6]); });
    for (let x = 160; x < W; x++) k.P(x, Math.round(tope(x)), "#fff0b8");
    for (let x = 172; x < W; x += 22) { const y = tope(x); k.R(x, y - 12, 1, 12, "#5a4a3a"); Det.bandera(k, x + 1, y - 12, 7, 5, (x / 22) % 2 < 1 ? "#3fb85a" : "#e8402a"); }
    if (noche) rayos(k, [[150, 0, 180, tope(180) - 2, 34, 4], [276, 0, 300, tope(300) - 2, 34, 4]], "#fff4c0", 0.22);
    const tienda = (x, b, w, col, s, raya = null) => { const h = w * 0.8; rellena(k, [[x - w / 2, b], [x, b - h], [x + w / 2, b]], (px, py) => (raya && Math.floor((px - x) / 2) % 2 ? raya : rampa([mezcla(col, "#ffffff", 0.25), col, mezcla(col, "#000000", 0.3)], 0.15 + ((px - x + w / 2) / w) * 0.6, px, py))); k.poli([[x - w * 0.12, b], [x, b - h * 0.55], [x + w * 0.12, b]], mezcla(col, "#000000", 0.55)); k.R(x, b - h - 2, 1, 2, "#5a4a3a"); return [x, b - h * 0.25]; };
    const COLS = ["#3fb85a", "#e8402a", "#3f8ac0", "#f2c84b", "#9a5ac8", "#e8e4dc"];
    for (let fila = 0; fila < 4; fila++) { const b = 116 + fila * 10, w = 12 + fila * 4; for (let i = 0; i < 12 - fila * 2; i++) { const x = 6 + i * (26 + fila * 6) + (fila % 2) * 10 + hash(i, fila, 981) * 6; if (fila < 2 && x > 168 && x < 300) continue; vs.push(tienda(x, b, w, COLS[(i + fila) % COLS.length], 982 + i, (i + fila) % 4 === 0 ? "#f4f4f8" : null)); } }
    T.rect(k, 120, 86, 22, 30, (x, y) => (Math.floor(x / 3) % 2 ? "#e8402a" : "#f4efe0")); rellena(k, [[116, 86], [131, 72], [146, 86]], () => "#c8302a"); k.R(136, 66, 3, 10, "#5a4a3a"); Det.humo(k, 137, 64, "#d8d8dc", 0.4, 5); T.ventana(k, 124, 92, 4, 5, { marco: "#5a3a24", vidrio: "#ffd27a" }); vs.push([126, 94]);
    T.prado(k, 150, ["#7aa070", "#628a5c", "#4c744a", "#3a5e3a", "#2a4a2c"], 983, { perfil: (x) => 150 + Math.sin(x / 30) * 1.5 });
    for (let y = 112; y < H; y++) { const f = (y - 112) / 68, c = 196 - f * 40, w = 3 + f * 16; for (let x = Math.round(c - w); x <= c + w; x++) if (y > 146) k.P(x, y, rampa(["#b09060", "#96784c", "#7c6040"], 0.2 + (hash(x, y, 984) - 0.5) * 0.4, x, y)); }
    const fuegos = [[52, 158], [262, 162]].map(([x, b]) => { k.R(x - 6, b - 1, 12, 2, "#5a3a22"); fuego(k, x, b - 1, 10, 12, { s: x }); return { x, y: b - 6, r: 26, col: "#ffb45a", f: 0.8 }; });
    if (noche) marca(k, 84, 22, 1.5);
    luces(k, [...fuegos, ...vs.map(([x, y]) => ({ x, y, r: 8, ry: 6, col: LUZ, f: lit * 0.7 }))]);
  }
  MAG[19] = ["El Mundial de Kuidditch", "Las tiendas del campamento y el gran estadio, con la Marca Tenebrosa en el cielo", mundial, { ven: ["#ffd27a"], tinte: 0.15, fuego: ["#7af0a0", "#2a8a4a", "#ffcf6a", "#fff4c0"] }];

  function laberinto(k) {
    const FX = 160, FY = 96;
    k.banda(CIELO, 0, 80);
    const seto = (x, y, sombra, s) => { const c = celdas(x, y, 3, 3, s, 0.9); return rampa(SETO, 0.12 + sombra + (c.id - 0.5) * 0.35 + (c.borde < 0.12 ? 0.25 : 0), x, y); };
    rellena(k, [[0, 0], [130, 62], [130, 108], [0, 196]], (x, y) => seto(x, y, (y / 180) * 0.35 + (1 - x / 130) * 0.1, 991));
    rellena(k, [[W, 0], [190, 62], [190, 108], [W, 196]], (x, y) => seto(x, y, (y / 180) * 0.35 + 0.12, 992));
    T.rect(k, 130, 62, 60, 46, (x, y) => (Math.abs(x - 160) < 12 && y > 72 ? null : seto(x, y, 0.3, 993)));
    T.rect(k, 148, 72, 24, 36, (x, y) => rampa(["#c8e8f8", "#9ad0f0", "#6ab0e0"], (Math.abs(x - 160) / 12) * 0.6 + ((y - 72) / 36) * 0.3, x, y));
    k.R(156, 98, 8, 10, "#c8c0b0"); k.R(154, 96, 12, 2, "#e8e0d0");
    k.crudo(155, 84, 10, 6, "#f8d860"); k.crudo(156, 90, 8, 2, "#e8c040"); k.crudo(159, 92, 2, 3, "#e8c040"); k.crudo(157, 95, 6, 1, "#f8d860"); k.crudo(153, 85, 2, 4, "#e8c040"); k.crudo(165, 85, 2, 4, "#e8c040"); k.crudo(156, 85, 2, 2, "#fff4c0");
    for (let i = 0; i < 14; i++) k.crudo(146 + hash(i, 1, 994) * 28, 70 + hash(i, 2, 994) * 30, 1, 1, "#fff4c0");
    suelo3d(k, 108, 180, FX, FY, (X, z, x, y) => rampa(["#7a9a5a", "#6a8a4c", "#5a7a40", "#4a6a34"], 0.2 + (hash(Math.floor(X / 3), Math.floor(z * 30), 995) - 0.5) * 0.5 + (Math.abs(X) > 34 ? 0.3 : 0), x, y), { dentro: (x, y) => x > 130 - (y - 108) * 1.9 && x < 190 + (y - 108) * 1.9 });
    bruma(k, 120, 180, "#e8eef4", 0.4, { s: 996 });
    luces(k, [{ x: 160, y: 88, r: 70, ry: 60, col: "#9ad8ff", f: 0.7 }]);
  }
  MAG[20] = ["El laberinto", "Los setos altísimos de la tercera prueba, con la copa brillando al fondo", laberinto, { fuego: ["#f8d860", "#e8c040", "#fff4c0", "#c8e8f8", "#9ad0f0", "#6ab0e0"] }];

  function cementerio(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 118);
    nubarron(k, 30, 16, 90, 12, ["#c8c8d8", "#a8a8bc", "#88889c"]);
    rellena(k, [[190, 120], [230, 92], [290, 86], [330, 96], [330, 120]], (x, y) => rampa(["#5a6a5a", "#4a5a4c", "#3c4c40"], 0.2 + ((y - 86) / 34) * 0.5, x, y));
    T.rect(k, 246, 66, 50, 26, (x, y) => rampa(["#7a7480", "#686270", "#56505e", "#443e4c"], 0.2 + ((x - 246) / 50) * 0.4, x, y)); rellena(k, [[242, 67], [271, 50], [300, 67]], tejas(["#5a5464", "#4a4454", "#3a3444", "#2a2634"], { w: 4, h: 2, s: 1001, y0: 50 })); T.rect(k, 284, 52, 5, 12, () => "#4a4454");
    [[252, 72], [264, 72], [278, 72], [288, 72], [252, 82], [288, 82]].forEach(([x, y], i) => T.ventana(k, x, y, 5, 6, { marco: "#2a2634", vidrio: i === 2 ? "#ffd27a" : "#3a3a50" }));
    for (let x = 0; x < W; x += 5) { k.R(x, 112, 1, 10, "#2a2a32"); k.P(x, 111, "#5a5a66"); } k.R(0, 114, W, 1, "#2a2a32");
    T.prado(k, 120, ["#5a7a5a", "#4c6c4e", "#3e5e42", "#304e36", "#24402a"], 1002, { perfil: (x) => 120 + Math.sin(x / 40) * 2 });
    k.R(22, 70, 10, 54, "#3a2e26"); copa(k, 26, 60, 32, 28, ["#3a5a42", "#2e4c36", "#22402c", "#183422", "#0e2818"], { r: 6, s: 1003 }); copa(k, 10, 84, 20, 16, ["#3a5a42", "#2e4c36", "#22402c", "#183422", "#0e2818"], { r: 5, s: 1004 });
    const tx = 64, tb = 150;
    T.rect(k, tx - 16, tb - 22, 32, 22, piedra(["#a8a49c", "#929088", "#7c7a72", "#66645e", "#504e4a"], { tx: 8, ty: 5, s: 1005 })); k.R(tx - 18, tb - 24, 36, 3, "#b8b4ac"); rotulo(k, tx - 10, tb - 15, "RODDLE", "#3a3836");
    rellena(k, [[tx - 10, tb - 24], [tx - 8, tb - 50], [tx - 4, tb - 62], [tx + 4, tb - 64], [tx + 9, tb - 56], [tx + 10, tb - 24]], (x, y) => rampa(["#b0aca4", "#9a968e", "#84807a", "#6e6a64", "#585450"], 0.15 + ((x - tx + 10) / 20) * 0.5, x, y));
    k.poli([[tx - 3, tb - 60], [tx + 4, tb - 60], [tx + 3, tb - 52], [tx - 2, tb - 52]], "#2a2826");
    trazo(k, [[tx + 12, tb - 24], [tx + 14, tb - 74]], "#6e6a64", 2); trazo(k, [[tx + 14, tb - 74], [tx + 4, tb - 80], [tx - 8, tb - 76]], "#9a968e", 2);
    rellena(k, [[tx - 22, tb - 58], [tx - 30, tb - 40], [tx - 10, tb - 46]], (x, y) => rampa(["#9a968e", "#84807a", "#6e6a64"], (y - tb + 58) / 18, x, y)); rellena(k, [[tx + 22, tb - 58], [tx + 30, tb - 40], [tx + 10, tb - 46]], (x, y) => rampa(["#9a968e", "#84807a", "#6e6a64"], (y - tb + 58) / 18 + 0.2, x, y));
    [[16, 152, 10, 14, 0], [100, 136, 8, 12, 1], [120, 160, 10, 15, 0], [186, 134, 7, 10, 2], [262, 156, 11, 16, 1], [298, 140, 8, 12, 0], [226, 126, 6, 8, 2]].forEach(([x, b, w, h, t], i) => {
      const pal = ["#a8a49c", "#929088", "#7c7a72", "#66645e"];
      sombraE(k, x + 2, b, w * 0.7, 1.5, 0.4);
      if (t === 2) { T.rect(k, x - 1, b - h, 3, h, (px, py) => rampa(pal, 0.2 + (px - x + 1) / 3 * 0.5, px, py)); T.rect(k, x - w / 2, b - h + 3, w, 3, (px, py) => rampa(pal, 0.2 + (py - b + h - 3) / 3 * 0.4, px, py)); return; }
      bola(k, x, b - h + w / 2, w / 2, w / 2, (px, py) => (py > b - h + w / 2 ? null : rampa(pal, 0.15 + ((px - x + w / 2) / w) * 0.5, px, py)));
      T.rect(k, x - w / 2, b - h + w / 2, w, h - w / 2, (px, py) => rampa(pal, 0.15 + ((px - x + w / 2) / w) * 0.5 + (hash(px, py, 1006 + i) > 0.86 ? 0.25 : 0), px, py));
      k.R(x - w / 2, b - 3, w, 3, "#4c6a42"); k.R(x - 2, b - h + w / 2 + 2, 4, 1, "#504e4a");
    });
    const cx = 226, cb = 168;
    k.R(cx - 14, cb - 2, 28, 3, "#3a2416"); fuego(k, cx, cb - 1, 26, 14, { s: 1007 });
    bola(k, cx, cb - 14, 16, 10, (x, y) => rampa(["#7a7a84", "#5a5a64", "#3a3a44", "#24242c"], 0.15 + ((x - cx + 16) / 32) * 0.6, x, y)); k.R(cx - 17, cb - 24, 34, 3, "#8a8a96"); k.R(cx - 15, cb - 23, 30, 1, "#c8d8e8");
    Det6.pluma(k, cx, cb - 24, 40, 12, ["#e8eef4", "#d0d8e0", "#b8c2cc", "#a0aab4"], { s: 1008, viento: 0.2 });
    bruma(k, 136, 180, "#c8d0e0", 0.3, { s: 1009 });
    luces(k, [{ x: cx, y: cb - 6, r: 60, ry: 34, col: "#ffa850", f: 0.9 }, { x: 278, y: 75, r: 8, col: LUZ, f: lit * 0.8 }]);
  }
  MAG[21] = ["El cementerio", "El cementerio de Pequeño Hangleton, donde vuelve Valdemoro", cementerio, { tinte: 0.35, ven: ["#ffd27a"], fuego: ["#ffcf6a", "#ff9a3a", "#fff4c0", "#e86a2a"] }];

  function grammiuld(k) {
    T.rect(k, 0, 0, W, 116, (x, y) => { const u = (x + (Math.floor(y / 14) % 2) * 7) % 14, v = y % 14, d = Math.abs(u - 7) + Math.abs(v - 7), roto = fbm(x * 0.05, y * 0.05, 1011) > 0.76; return roto ? rampa(["#8a7a64", "#74664e"], 0.4, x, y) : rampa(["#3a5a4a", "#2e4c3e", "#244034", "#1a342a"], 0.25 + (d < 3 ? -0.1 : 0) + (y / 116) * 0.3, x, y); });
    T.rect(k, 0, 88, W, 28, madera(["#4a3a30", "#3a2e26", "#2e241e", "#221a16", "#16100c"], { paso: 3, vertical: true, largo: 99, s: 1012 })); k.R(0, 87, W, 2, "#6a5a40");
    T.rect(k, 14, 14, 74, 6, () => "#5a4a30"); rellena(k, [[16, 20], [86, 20], [84, 92], [18, 92]], (x, y) => (hash(x, y, 1013) > 0.97 ? "#1a1010" : rampa(["#9a3a3a", "#7e2a2c", "#621e22", "#481618"], 0.15 + (Math.sin(x * 0.9) * 0.25 + 0.25) + (y / 92) * 0.2, x, y))); k.R(48, 20, 2, 72, "#481618");
    for (let i = 0; i < 12; i++) { const x = 196 + i * 11, y = 132 - i * 10; T.rect(k, x, y - 10, 12, 10, madera(["#5a4636", "#4a382a", "#3a2c20", "#2c2018", "#1e1610"], { paso: 2, largo: 99, s: 1014 + i })); k.R(x, y - 10, 12, 1, "#7a6248"); }
    trazo(k, [[190, 104], [330, -10]], "#2c2018", 3); for (let i = 0; i < 12; i++) k.R(199 + i * 11, 104 - i * 10 - 12, 1, 14, "#2c2018");
    [[214, 46], [242, 30], [270, 14], [180, 60]].forEach(([x, y]) => { bola(k, x, y, 9, 7, () => "#6a4a2a"); bola(k, x, y, 7, 5, () => "#8a6a3a"); bola(k, x, y + 1, 4, 4, () => "#c8b098"); k.poli([[x - 4, y - 1], [x - 9, y - 4], [x - 4, y + 2]], "#b8a088"); k.poli([[x + 4, y - 1], [x + 9, y - 4], [x + 4, y + 2]], "#b8a088"); k.P(x - 2, y, "#2a1a10"); k.P(x + 1, y, "#2a1a10"); });
    k.R(130, 0, 1, 14, "#3a3a32"); for (let i = 0; i < 5; i++) { const a = (i / 5) * Math.PI; trazo(k, bezier([130, 14], [130 + Math.cos(a) * 14, 16], [130 + Math.cos(a) * 20, 22], [130 + Math.cos(a) * 22, 26], 10), "#5a6a4a", 1); k.crudo(130 + Math.cos(a) * 22 - 1, 23, 2, 3, "#c8e070"); }
    const lamparas = [[108, 54], [152, 54]].map(([x, y]) => { k.R(x - 1, y, 3, 8, "#3a3a32"); k.crudo(x - 2, y - 4, 4, 4, "#c8e070"); return { x, y: y - 2, r: 18, col: "#c8e070", f: 0.6 }; });
    rellena(k, [[100, 140], [112, 108], [118, 108], [122, 140]], (x, y) => rampa(["#8a8a6a", "#6e6e54", "#545440"], 0.2 + ((x - 100) / 22) * 0.5 + (hash(x, y, 1015) > 0.85 ? 0.2 : 0), x, y)); k.R(110, 98, 2, 12, "#2a2a32"); k.R(116, 96, 2, 14, "#2a2a32"); k.elipse(111, 97, 2, 2, "#3a2a3a");
    suelo3d(k, 116, 180, 160, 60, tablones(["#5a4636", "#4a382a", "#3a2c20", "#2c2018", "#1e1610"], { pw: 10, L: 50, s: 1016 }));
    suelo3d(k, 116, 180, 160, 60, (X, z, x, y) => (Math.abs(X) < 34 ? (Math.abs(X) > 30 ? "#c8a040" : rampa(["#8a2a2a", "#742224", "#5e1a1c"], 0.2 + (hash(Math.floor(X / 4), Math.floor(z * 20), 1017) - 0.5) * 0.4, x, y)) : null));
    luces(k, [{ x: 130, y: 24, r: 90, ry: 60, col: "#c8e070", f: 0.4 }, ...lamparas]);
  }
  MAG[22] = ["Grammiuld Place", "El cuartel de la Orden: la casa oscura de los Bleck, con sus cabezas de elfo", grammiuld, { cielo: "propio", fuerza: 0.1, fuego: ["#c8e070"] }];

  function imbrudge(k) {
    T.rect(k, 0, 0, W, 120, (x, y) => rampa(["#f8d8e4", "#f0c4d4", "#e4aec4", "#d498b2"], 0.15 + (Math.floor(x / 6) % 2 ? 0.12 : 0) + (y / 120) * 0.25, x, y));
    for (let x = 0; x < W; x += 4) { bola(k, x + 2, 8, 2, 2, () => "#ffffff"); } k.R(0, 4, W, 3, "#ffffff"); k.R(0, 100, W, 3, "#ffffff"); for (let x = 0; x < W; x += 4) bola(k, x + 2, 104, 2, 2, (px, py) => (py < 104 ? null : "#ffffff"));
    T.rect(k, 0, 104, W, 16, (x, y) => rampa(["#e4aec4", "#d498b2", "#c4849e"], 0.3 + (Math.floor(x / 10) % 2 ? 0.1 : 0), x, y));
    T.rect(k, 128, 14, 64, 58, () => "#ffffff"); T.rect(k, 132, 18, 56, 50, () => "#7fb0d8"); k.R(159, 18, 2, 50, "#ffffff"); k.R(132, 42, 56, 2, "#ffffff");
    [[120, 1], [200, -1]].forEach(([x, s]) => { rellena(k, [[x, 10], [x + s * 16, 10], [x + s * 6, 50], [x + s * 4, 76], [x - s * 2, 76]], (px, py) => rampa(["#f4a8c4", "#e88ab0", "#d4709c", "#b85a84"], 0.15 + (Math.sin(px * 1.2) * 0.25 + 0.25), px, py)); k.R(x + s * 3 - (s < 0 ? 4 : 0), 48, 5, 2, "#ffffff"); });
    rellena(k, [[116, 6], [204, 6], [196, 18], [124, 18]], (x, y) => rampa(["#f4a8c4", "#e88ab0", "#d4709c"], (y - 6) / 12, x, y)); for (let x = 124; x < 196; x += 6) bola(k, x + 3, 18, 3, 2, (px, py) => (py < 18 ? null : "#e88ab0"));
    const plato = (x, y, r, i) => { bola(k, x, y, r + 1, r + 1, () => "#e8c8d4"); bola(k, x, y, r, r, () => "#ffffff"); const c = ["#d8a878", "#a8a8b0", "#f4f0e8", "#b88858", "#686068"][i % 5]; bola(k, x, y + 1, r * 0.55, r * 0.5, () => c); k.poli([[x - r * 0.5, y - 1], [x - r * 0.4, y - r * 0.6], [x - r * 0.15, y - 2]], c); k.poli([[x + r * 0.5, y - 1], [x + r * 0.4, y - r * 0.6], [x + r * 0.15, y - 2]], c); k.P(x - 2, y, "#2a2a30"); k.P(x + 2, y, "#2a2a30"); k.P(x, y + 2, "#e86a9a"); for (let a = 0; a < 6.28; a += 0.5) k.P(x + Math.cos(a) * (r - 1), y + Math.sin(a) * (r - 1), "#f4a8c4"); };
    [20, 53, 87, 223, 257, 291].forEach((x, i) => plato(x, 26, 9, i));
    [36, 70, 104, 216, 250, 284].forEach((x, i) => plato(x, 60, 8, i + 2));
    T.rect(k, 106, 92, 108, 32, madera(["#f4c4d4", "#e8aac0", "#d890ac", "#c07898", "#a86084"], { paso: 3, vertical: true, largo: 99, s: 1021 })); k.R(104, 88, 112, 5, "#ffffff"); for (let x = 104; x < 216; x += 4) bola(k, x + 2, 93, 2, 2, (px, py) => (py < 93 ? null : "#ffffff"));
    bola(k, 130, 84, 6, 4, () => "#ffffff"); k.R(124, 84, 12, 4, "#ffffff"); k.R(135, 82, 4, 1, "#ffffff"); k.R(122, 82, 2, 3, "#ffffff"); k.P(130, 82, "#e86a9a");
    [[146, 86], [156, 86]].forEach(([x, y]) => { k.R(x - 3, y, 6, 3, "#ffffff"); k.R(x - 4, y + 3, 8, 1, "#f0c4d4"); });
    trazo(k, [[186, 88], [194, 72]], "#c82a5a", 1); k.R(178, 84, 8, 4, "#f4efe0"); bola(k, 204, 82, 4, 6, () => "#f4f0f8"); k.R(203, 72, 2, 6, "#3a8a4a"); bola(k, 204, 70, 3, 3, () => "#e8507a");
    T.rect(k, 64, 104, 22, 30, (x, y) => rampa(["#f4a8c4", "#e88ab0", "#d4709c", "#b85a84"], 0.2 + ((x - 64) / 22) * 0.4, x, y)); bola(k, 75, 104, 11, 6, (x, y) => (y > 104 ? null : "#f4a8c4")); k.R(66, 120, 18, 4, "#e88ab0"); k.R(66, 134, 3, 6, "#a86084"); k.R(81, 134, 3, 6, "#a86084");
    T.rect(k, 0, 120, W, 60, (x, y) => rampa(["#e8b8c8", "#dca4b8", "#d090a8", "#c47c98"], 0.2 + ((y - 120) / 60) * 0.4 + (hash(x, y, 1022) - 0.5) * 0.12, x, y));
    bola(k, 160, 156, 112, 18, (x, y) => { const q = Math.hypot((x - 160) / 112, (y - 156) / 18); return q > 0.93 ? "#ffffff" : q > 0.87 ? "#f4a8c4" : rampa(["#fce4ec", "#f8d4e0", "#f0c0d0"], 0.2 + q * 0.4, x, y); });
    bola(k, 254, 132, 4, 5, () => "#ffffff"); bola(k, 254, 125, 3, 3, () => "#ffffff"); k.P(253, 125, "#2a2a30"); k.P(255, 125, "#2a2a30"); k.poli([[252, 123], [252, 120], [254, 123]], "#ffffff"); k.poli([[256, 123], [256, 120], [254, 123]], "#ffffff"); k.R(252, 128, 5, 1, "#e86a9a");
  }
  MAG[23] = ["El despacho de Imbrudge", "Todo rosa, con encajes y platos de gatitos en la pared", imbrudge, { cielo: "propio", fuerza: 0.08, ventanal: "#7fb0d8" }];

  function misterios(k) {
    const VX = 160, VY = 86, en = (lado, d, y) => [VX + (lado * 160) / (1 + 3 * d), VY + (y - VY) / (1 + 3 * d)];
    T.rect(k, 0, 0, W, H, (x, y) => rampa(["#1a2048", "#141a3c", "#0e1430", "#0a0e24"], 0.2 + (Math.abs(y - VY) / 90) * 0.5 + (Math.abs(x - VX) / 160) * 0.2, x, y));
    T.rect(k, 124, 96, 72, 8, (x, y) => rampa(["#6a6a7a", "#5a5a6a", "#4a4a58"], (y - 96) / 8, x, y));
    rellena(k, [[136, 98], [138, 60], [160, 42], [182, 60], [184, 98], [176, 98], [176, 62], [160, 50], [144, 62], [144, 98]], (x, y) => rampa(["#9a9aa8", "#848494", "#6e6e80", "#5a5a6a"], 0.15 + ((x - 136) / 48) * 0.5, x, y));
    rellena(k, [[145, 62], [160, 51], [175, 62], [175, 98], [145, 98]], (x, y) => (Math.sin(x * 0.8 + y * 0.15) > 0.3 ? "#0a0a12" : "#1c1c2a"));
    const orbes = [];
    [-1, 1].forEach((lado) => {
      for (let b = 0; b < 6; b++) { const y = 24 + 21 * b; const [x0, y0] = en(lado, 0, y), [x1, y1] = en(lado, 1.9, y); trazo(k, [[x0, y0], [x1, y1]], "#4a5a8a", 2, 1); trazo(k, [[x0, y0 + 2], [x1, y1 + 0.5]], "#2a3460", 1); for (let i = 0; i < 26; i++) { const d = (i / 26) * 1.85 + hash(i, b, 1031 + lado) * 0.05, [ox, oy] = en(lado, d, y - 6), r = Math.max(1, 4.5 / (1 + 3 * d)); orbes.push([ox, oy, r]); } }
      for (let i = 0; i <= 8; i++) { const d = i * 0.24, [x0, y0] = en(lado, d, 10), [, y1] = en(lado, d, 136); k.R(x0 - Math.max(1, 3 / (1 + 3 * d)) / 2, y0, Math.max(1, 3 / (1 + 3 * d)), y1 - y0, "#3a4878"); }
    });
    orbes.forEach(([x, y, r]) => { k.elipse(x, y, r, r, "#5a8ac8"); k.crudo(x - r * 0.4, y - r * 0.4, Math.max(1, r * 0.6), Math.max(1, r * 0.6), "#d8f4ff"); });
    T.rect(k, 0, 136, W, 44, (x, y) => rampa(["#1c2450", "#161e44", "#101838", "#0c122c"], 0.2 + ((y - 136) / 44) * 0.5, x, y));
    suelo3d(k, 104, 180, VX, VY, (X, z, x, y) => (Math.abs(X) < 50 ? rampa(["#2a3468", "#222c5c", "#1c2450", "#161e44"], 0.3 + (Math.floor(X / 12 + 50) % 2 ? 0.1 : 0) + (Math.floor(z * 6) % 2 ? 0.08 : 0), x, y) : null));
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 1032) * W, y = 140 + hash(i, 2, 1032) * 40; k.crudo(x, y, 1, 1, "#9ad8ff"); }
    luces(k, [{ x: 50, y: 70, r: 90, ry: 90, col: "#9ad8ff", f: 0.35 }, { x: 270, y: 70, r: 90, ry: 90, col: "#9ad8ff", f: 0.35 }, { x: 160, y: 76, r: 40, ry: 40, col: "#d8f4ff", f: 0.3 }]);
  }
  MAG[24] = ["El Departamento de Misterios", "La sala de las profecías y el arco del velo", misterios, { cielo: "propio", fuerza: 0, fuego: ["#d8f4ff", "#9ad8ff"] }];

  function pociones(k) {
    T.rect(k, 0, 0, W, 120, piedra(["#6a6e6a", "#5a5e5a", "#4c504c", "#3e423e", "#303430"], { tx: 14, ty: 8, s: 1041, musgo: 0.1 }));
    for (let x = -40; x < W + 40; x += 80) trazo(k, bezier([x, 30], [x + 10, 0], [x + 70, 0], [x + 80, 30], 24), "#2a2e2a", 3);
    T.rect(k, 116, 22, 88, 50, () => "#5a3a24"); T.rect(k, 119, 25, 82, 44, (x, y) => rampa(["#2e4a3a", "#26402e", "#1e3626"], 0.3 + (fbm(x * 0.1, y * 0.1, 1042) - 0.5) * 0.4, x, y));
    [[124, 30, 50], [124, 36, 64], [124, 42, 40], [124, 50, 70], [124, 56, 30], [158, 56, 36], [124, 62, 56]].forEach(([x, y, w]) => { for (let i = 0; i < w; i += 3) if (hash(i, y, 1043) > 0.25) k.R(x + i, y, 2, 1, "#d8e0d8"); });
    const frasco = (x, b, i) => { const c = ["#e8402a", "#3fb85a", "#3f8ac0", "#f2c84b", "#9a5ac8", "#e86aa8", "#7ae8d8", "#c8a070"][i % 8], t = i % 3; if (t === 0) { T.rect(k, x, b - 7, 5, 7, (px, py) => (py < b - 4 ? mezcla(c, "#ffffff", 0.3) : c)); k.R(x + 1, b - 9, 3, 2, "#8a7a6a"); } else if (t === 1) { bola(k, x + 3, b - 3, 3, 3, () => c); k.R(x + 2, b - 9, 2, 4, mezcla(c, "#ffffff", 0.4)); k.R(x + 2, b - 10, 2, 1, "#5a3a24"); } else { T.rect(k, x, b - 9, 6, 9, () => "#c8d8c0"); bola(k, x + 3, b - 4, 2, 2, () => "#e8e0c8"); k.R(x, b - 10, 6, 1, "#5a5a50"); } k.crudo(x + 1, b - 6, 1, 1, "#ffffff"); };
    [[6, 30, 100], [6, 54, 100], [6, 78, 100], [214, 30, 100], [214, 54, 100], [214, 78, 100]].forEach(([x0, y, w], j) => { T.rect(k, x0, y, w, 3, madera(["#7a5a3a", "#664a30", "#523a24", "#3e2a1a", "#2a1c10"], { paso: 2, largo: 99, s: 1044 + j })); k.R(x0, y + 3, w, 1, "#1e1610"); for (let i = 0, x = x0 + 2; x < x0 + w - 6; i++) { frasco(x, y, i + j * 7); x += 7 + (hash(i, j, 1045) > 0.6 ? 2 : 0); } });
    const L = [[108, 46], [212, 46]].map(([x, y]) => T.antorcha(k, x, y, { r: 30 }));
    suelo3d(k, 120, 180, 160, 70, losas3d(["#7a7e78", "#6a6e68", "#5a5e58", "#4a4e48", "#3a3e38"], { tx: 22, tz: 15, s: 1046 }));
    const vapores = [];
    [[56, 140, "#7ae87a"], [160, 136, "#c87ae8"], [264, 140, "#e8a050"]].forEach(([x, b, c], i) => {
      sombraE(k, x, b + 2, 34, 3, 0.4); T.rect(k, x - 32, b - 10, 64, 5, madera(["#8a6a48", "#74583a", "#5e462e", "#483422", "#322416"], { paso: 2, largo: 99, s: 1047 + i })); k.R(x - 30, b - 5, 3, 9, "#3a2a1a"); k.R(x + 27, b - 5, 3, 9, "#3a2a1a");
      k.R(x - 8, b - 12, 16, 2, "#3a2416"); fuego(k, x, b - 11, 10, 6, { s: 1048 + i });
      bola(k, x, b - 20, 11, 8, (px, py) => rampa(["#5a5a64", "#3a3a44", "#24242c", "#16161c"], 0.15 + ((px - x + 11) / 22) * 0.6, px, py)); k.R(x - 12, b - 28, 24, 2, "#4a4a54");
      bola(k, x, b - 27, 10, 2, () => c); [[-4, 0], [3, -1], [6, 0]].forEach(([d, e]) => k.crudo(x + d, b - 28 + e, 2, 2, mezcla(c, "#ffffff", 0.5)));
      Det.humo(k, x, b - 30, mezcla(c, "#ffffff", 0.5), 0.45, 6);
      [[x - 26, b - 10], [x + 18, b - 10]].forEach(([fx, fy], j) => frasco(fx, fy, i * 3 + j));
      vapores.push({ x, y: b - 26, r: 22, col: c, f: 0.5 });
    });
    luces(k, [...L, ...vapores]);
  }
  MAG[25] = ["La clase de Pociones", "La mazmorra de los calderos, con sus estantes de frascos", pociones, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#ff9a3a", "#fff4c0", "#7ae87a", "#c87ae8", "#e8a050"] }];
})();

(function () {
  const { rampa, rellena, nubarron, rotulo, montana } = Det;
  const { bola, mezcla, hash, fbm, celdas, bezier, trazo, madera, piedra, ladrillo, tejas, suelo3d, tablones, losas3d, copa, sombraE, luces, espejo, bruma, rayos, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, Q = window.H17;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  window.SitiosIt15 = window.SitiosIt15 || {};
  const MAG = (window.SitiosIt15.magos = window.SitiosIt15.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const ORO = ["#f8e090", "#e8c050", "#c89a3a", "#a07a28", "#7a5a1a"];
  const LIBROS = ["#a82a30", "#2a5a9a", "#3a8a4a", "#c89a3a", "#6a3a8a", "#8a5a32", "#2a2a30", "#c8c0a8"];
  const libros = (k, x0, x1, b, s) => { for (let x = x0, i = 0; x < x1 - 2; i++) { const w = 2 + Math.floor(hash(i, 1, s) * 2), h = 8 + Math.floor(hash(i, 2, s) * 5), c = LIBROS[Math.floor(hash(i, 3, s) * LIBROS.length)]; k.R(x, b - h, w, h, c); k.R(x, b - h + 2, w, 1, mezcla(c, "#ffffff", 0.35)); x += w + (hash(i, 4, s) > 0.85 ? 2 : 0); } };

  function despacho(k) {
    T.rect(k, 0, 0, W, 116, madera(["#7a4a2a", "#683e22", "#56321a", "#442814", "#321c0e"], { paso: 4, vertical: true, largo: 99, s: 1051 }));
    for (let x = 0; x < W; x += 26) k.R(x, 0, 2, 116, "#2a180c");
    [[4, 112], [208, 316]].forEach(([x0, x1], j) => { T.rect(k, x0, 50, x1 - x0, 64, () => "#2a180c"); [62, 78, 94, 110].forEach((b, i) => { libros(k, x0 + 2, x1 - 2, b, 1052 + j * 10 + i); k.R(x0, b, x1 - x0, 2, "#8a5a32"); }); });
    [[10, 8, "#3a5a3a"], [40, 6, "#5a3a5a"], [72, 10, "#3a3a5a"], [222, 8, "#5a4a3a"], [254, 6, "#3a5a5a"], [286, 10, "#5a3a3a"]].forEach(([x, y, f], i) => { T.rect(k, x, y, 24, 32, (px, py) => rampa(ORO, 0.2 + ((px - x) / 24) * 0.5, px, py)); T.rect(k, x + 2, y + 2, 20, 28, () => f); bola(k, x + 12, y + 12, 4, 5, () => "#d8b090"); rellena(k, [[x + 4, y + 30], [x + 6, y + 19], [x + 18, y + 19], [x + 20, y + 30]], () => mezcla(f, "#000000", 0.45)); if (i % 2) { bola(k, x + 12, y + 18, 3, 4, () => "#e8e4dc"); } k.R(x + 9, y + 11, 2, 1, "#3a2a1a"); k.R(x + 13, y + 11, 2, 1, "#3a2a1a"); });
    bola(k, 160, 34, 34, 26, (x, y) => (y > 34 ? null : "#c89a3a")); T.rect(k, 126, 34, 68, 60, () => "#c89a3a");
    bola(k, 160, 34, 31, 23, (x, y) => (y > 34 ? null : "#2a3672")); T.rect(k, 129, 34, 62, 58, () => "#2a3672");
    k.R(159, 11, 2, 81, "#c89a3a"); k.R(129, 52, 62, 2, "#c89a3a"); [[144, 30], [176, 30], [144, 70], [176, 70]].forEach(([x, y]) => { k.R(x - 3, y, 7, 1, "#e8c050"); k.R(x, y - 3, 1, 7, "#e8c050"); k.P(x - 2, y - 2, "#e8c050"); k.P(x + 2, y + 2, "#e8c050"); k.P(x + 2, y - 2, "#e8c050"); k.P(x - 2, y + 2, "#e8c050"); });
    rellena(k, [[96, 48], [106, 24], [110, 26], [104, 34], [116, 48]], (x, y) => rampa(["#9a7a58", "#806444", "#664e34", "#4c3826"], 0.2 + ((x - 96) / 20) * 0.4, x, y)); k.R(92, 47, 28, 2, "#664e34"); k.R(102, 38, 6, 1, "#3a2a1a");
    suelo3d(k, 116, 180, 160, 60, tablones(["#8a5a32", "#744a28", "#5e3a1e", "#482c16", "#321e0e"], { pw: 10, L: 50, s: 1053 }));
    bola(k, 160, 154, 120, 20, (x, y) => { const q = Math.hypot((x - 160) / 120, (y - 154) / 20); return q > 0.95 ? "#c89a3a" : q > 0.9 ? "#1a2a5a" : hash(x, y, 1054) > 0.985 ? "#f2d27a" : rampa(["#2a3a7a", "#24326a", "#1e2a5a"], 0.2 + q * 0.4, x, y); });
    T.rect(k, 116, 102, 88, 8, madera(["#9a6a3e", "#845a32", "#6e4a28", "#583a1e", "#422c16"], { paso: 2, largo: 99, s: 1055 })); T.rect(k, 120, 110, 80, 18, madera(["#845a32", "#6e4a28", "#583a1e", "#422c16", "#2e1e0e"], { paso: 3, vertical: true, largo: 99, s: 1056 }));
    [122, 196].forEach((x) => { k.R(x, 128, 3, 6, "#422c16"); k.R(x - 1, 133, 5, 2, ORO[2]); });
    [[128, 98], [140, 96], [184, 97]].forEach(([x, y], i) => { k.R(x, y, 1, 6, "#c8c8d0"); bola(k, x, y, 3, 3, () => (i === 1 ? "#d8d8e0" : "#a8a8b4")); k.crudo(x - 1, y - 1, 1, 1, "#ffffff"); });
    k.R(160, 98, 6, 4, "#2a2a30"); trazo(k, [[164, 98], [170, 90]], "#f4efe0", 1); k.R(150, 100, 8, 2, "#f4efe0");
    T.rect(k, 40, 118, 10, 22, (x, y) => rampa(["#b8b4ac", "#9a968e", "#7c7a72"], (x - 40) / 10, x, y)); k.R(36, 138, 18, 3, "#7c7a72");
    bola(k, 45, 116, 17, 6, (x, y) => rampa(["#c8c4bc", "#a8a49c", "#8a867e"], 0.2 + ((x - 28) / 34) * 0.5, x, y)); bola(k, 45, 114, 14, 3, () => "#d8ecff"); for (let i = 0; i < 5; i++) k.crudo(36 + i * 4, 113 + (i % 2), 3, 1, "#ffffff");
    k.alfa(0.35, () => { for (let i = 0; i < 6; i++) trazo(k, bezier([38 + i * 3, 112], [34 + i * 4, 100], [46 + i * 2, 92], [40 + i * 3, 80], 12), "#d8ecff", 1); });
    k.R(195, 138, 2, 34, ORO[2]); k.R(190, 170, 12, 3, ORO[3]); k.R(184, 136, 24, 2, ORO[1]); bola(k, 184, 137, 1.5, 1.5, () => ORO[0]); bola(k, 208, 137, 1.5, 1.5, () => ORO[0]);
    bola(k, 196, 128, 5, 7, (x, y) => rampa(["#f05a2a", "#d8402a", "#b02a20"], 0.2 + ((x - 191) / 10) * 0.5, x, y)); bola(k, 198, 120, 3, 3, () => "#e8502a"); k.P(199, 119, "#2a1a10"); k.R(201, 120, 2, 1, ORO[1]);
    trazo(k, [[193, 132], [188, 142], [186, 150]], "#e8b040", 2); trazo(k, [[195, 133], [192, 146]], "#f05a2a", 1); k.poli([[196, 118], [198, 114], [199, 118]], ORO[1]);
    luces(k, [{ x: 45, y: 110, r: 40, ry: 30, col: "#d8ecff", f: 0.6 }, { x: 160, y: 50, r: 80, ry: 60, col: "#fff4d8", f: 0.25 }]);
  }
  MAG[26] = ["El despacho de Dombludere", "El despacho redondo, con el pensatorio, la percha de Fewkas y los retratos", despacho, { cielo: "propio", fuerza: 0.15, ventanal: "#2a3672", fuego: ["#d8ecff", "#ffffff"] }];

  function cueva(k) {
    T.rect(k, 0, 0, W, H, (x, y) => rampa(["#2a3038", "#22262e", "#1a1e24", "#12161c", "#0c0e12"], 0.3 + (fbm(x * 0.04, y * 0.06, 1061) - 0.5) * 0.5 + Math.abs(x - 160) / 400, x, y));
    rellena(k, [[0, 0], [W, 0], [W, 30], [0, 30]], (x, y) => rampa(["#4a4e56", "#3a3e46", "#2e3238", "#22262c"], 0.2 + (y / 30) * 0.4 + (fbm(x * 0.1, y * 0.1, 1062) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 26; i++) { const x = i * 13 + hash(i, 1, 1063) * 8, l = 10 + hash(i, 2, 1063) * 30, w = 3 + hash(i, 3, 1063) * 5; rellena(k, [[x - w, 28], [x + w, 28], [x, 28 + l]], (px, py) => rampa(["#5a5e66", "#4a4e56", "#3a3e46", "#2e3238"], 0.15 + ((px - x + w) / (2 * w)) * 0.5, px, py)); }
    [[[0, 20], [60, 60], [40, 120], [70, 150], [0, 150]], [[W, 20], [W - 60, 60], [W - 40, 120], [W - 70, 150], [W, 150]]].forEach((pts) => rellena(k, pts, (x, y) => rampa(["#4a4e56", "#3a3e46", "#2e3238", "#22262c"], 0.2 + (fbm(x * 0.08, y * 0.08, 1064) - 0.5) * 0.5, x, y)));
    T.rect(k, 0, 110, W, 70, (x, y) => rampa(["#1a2a2a", "#142222", "#0e1a1a", "#0a1212"], 0.3 + ((y - 110) / 70) * 0.4 + (Math.sin(x * 0.25 + y * 1.3) > 0.94 ? -0.25 : 0), x, y));
    rellena(k, [[110, 116], [124, 104], [196, 104], [212, 116], [200, 122], [120, 122]], (x, y) => rampa(["#5a5e66", "#4a4e56", "#3a3e46", "#2e3238"], 0.2 + ((y - 104) / 18) * 0.5 + (fbm(x * 0.2, y * 0.2, 1065) - 0.5) * 0.3, x, y));
    T.rect(k, 154, 90, 12, 14, (x, y) => rampa(["#8a8e96", "#6e727a", "#565a62"], (x - 154) / 12, x, y)); bola(k, 160, 88, 16, 5, (x, y) => rampa(["#9a9ea6", "#7e828a", "#62666e"], 0.2 + ((x - 144) / 32) * 0.5, x, y));
    bola(k, 160, 86, 13, 3, () => "#7ae87a"); k.crudo(152, 85, 6, 1, "#c8ffc8"); k.crudo(163, 86, 4, 1, "#c8ffc8");
    k.alfa(0.4, () => { for (let y = 124; y < 176; y += 2) { const w = 10 + (y - 124) * 0.5; k.R(160 - w / 2 + Math.sin(y) * 3, y, w, 1, "#4ac85a"); } });
    rellena(k, [[60, 150], [104, 150], [98, 158], [66, 158]], (x, y) => rampa(["#6a5a46", "#56483a", "#42382e"], (y - 150) / 8, x, y)); k.R(60, 149, 44, 2, "#8a7458"); trazo(k, [[104, 152], [140, 128], [150, 118]], "#4a8a5a", 1);
    [[30, 140], [130, 160], [214, 150], [252, 168], [282, 138], [92, 172], [190, 174]].forEach(([x, y], i) => { k.R(x, y - 8, 2, 8, "#c8ccc0"); for (let d = -1; d <= 2; d++) k.R(x + d, y - 11 - (d === 0 || d === 1 ? 1 : 0), 1, 3, "#d8dcd0"); k.alfa(0.5, () => k.R(x - 2, y, 6, 1, "#8a9a8a")); });
    rellena(k, [[-4, 180], [-4, 166], [60, 164], [140, 170], [200, 166], [270, 170], [324, 164], [324, 180]], (x, y) => rampa(["#4a4e56", "#3a3e46", "#2e3238", "#22262c"], 0.15 + ((y - 164) / 16) * 0.4 + (fbm(x * 0.12, y * 0.2, 1066) - 0.5) * 0.4, x, y));
    luces(k, [{ x: 160, y: 86, r: 120, ry: 70, col: "#7ae87a", f: 0.7 }]);
  }
  MAG[27] = ["La cueva", "El lago negro de los enfiri y la vasija de poción verde en su isla", cueva, { cielo: "propio", fuerza: 0, fuego: ["#7ae87a", "#c8ffc8", "#4ac85a"] }];

  function astronomia(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 120);
    nubarron(k, 250, 30, 70, 10);
    const vs = [];
    [[14, 74, 14, 2], [44, 84, 10, 2.4], [250, 78, 12, 2.2], [282, 70, 16, 1.8], [306, 88, 10, 2.4]].forEach(([x, top, w, t], i) => vs.push(...Q.torre(k, x, 128, w, 128 - top, { techo: t, s: 1071 + i })));
    T.rect(k, 0, 104, W, 24, (x, y) => rampa(["#9a9488", "#847e72", "#6e685e", "#58534a"], 0.3 + ((y - 104) / 24) * 0.4, x, y));
    suelo3d(k, 128, 180, 160, 80, losas3d(["#a8a090", "#948c7e", "#80786c", "#6c655a", "#58524a"], { tx: 24, tz: 16, s: 1072 }));
    T.rect(k, 0, 116, W, 16, piedra(["#b8b0a0", "#a49c8e", "#90887a", "#7c7468", "#686056"], { tx: 10, ty: 5, s: 1073 }));
    for (let x = 0; x < W; x += 22) T.rect(k, x, 104, 12, 12, piedra(["#b8b0a0", "#a49c8e", "#90887a", "#7c7468", "#686056"], { tx: 6, ty: 4, s: 1074 + x }));
    const tx = 236, tb = 150; [[-8, 0], [0, 2], [8, 0]].forEach(([d, e]) => trazo(k, [[tx, tb - 22], [tx + d, tb + e]], "#5a4a3a", 1)); trazo(k, [[tx - 10, tb - 16], [tx + 18, tb - 34]], ORO[2], 3); trazo(k, [[tx - 9, tb - 17], [tx + 17, tb - 34]], ORO[0], 1); k.R(tx + 16, tb - 37, 4, 4, ORO[3]);
    const ax = 86, ab = 146; k.R(ax - 1, ab - 14, 3, 14, "#5a4a3a"); k.R(ax - 5, ab - 2, 11, 2, "#5a4a3a"); for (let a = 0; a < 6.28; a += 0.05) { k.P(ax + Math.cos(a) * 10, ab - 24 + Math.sin(a) * 10, ORO[2]); k.P(ax + Math.cos(a) * 10, ab - 24 + Math.sin(a) * 4, ORO[1]); k.P(ax + Math.cos(a) * 4, ab - 24 + Math.sin(a) * 10, ORO[3]); } bola(k, ax, ab - 24, 2, 2, () => ORO[0]);
    const { h, d } = Det.cuando(k);
    if (d === 6 && h === 23) Q.marca(k, 150, 26, 1.5);
    luces(k, vs.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.8 })));
  }
  MAG[28] = ["La Torre de Astronomía", "Lo más alto del castillo, con la Marca Tenebrosa sobre las almenas", astronomia, { ven: VEN, fuego: ["#7af0a0", "#2a8a4a"] }];

  function valle(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 112);
    nubarron(k, 220, 18, 90, 12, ["#f4f6fa", "#e2e8f0", "#c8d2e0"]);
    montana(k, 60, 112, 200, 40, { roca: ["#a8b4c8", "#94a2b8", "#8090a8", "#6e7e98"], nieve: ["#ffffff", "#e2eaf3"], hasta: 0.5 });
    const vs = [];
    const casa = (x, b, w, h, s) => { T.rect(k, x, b - h, w, h, (px, py) => rampa(["#f0e6d0", "#e0d2b8", "#ccbc9e", "#b4a284"], 0.15 + ((px - x) / w) * 0.4, px, py)); for (let px = x; px < x + w; px += 7) k.R(px, b - h, 1, h, "#5a3a24"); k.R(x, b - Math.round(h / 2), w, 1, "#5a3a24"); rellena(k, [[x - 3, b - h + 1], [x + w / 2, b - h - w * 0.4], [x + w + 3, b - h + 1]], (px, py) => rampa(["#ffffff", "#f2f6fb", "#dfe8f2", "#c8d4e4"], 0.1 + ((px - x) / w) * 0.5, px, py)); for (let vx = x + 3; vx < x + w - 4; vx += 8) { T.ventana(k, vx, b - h + 4, 4, 4, { marco: "#5a3a24", vidrio: "#ffd27a" }); vs.push([vx + 2, b - h + 6]); } k.R(x + w / 2 - 2, b - 8, 4, 8, "#4a2e1c"); };
    casa(4, 124, 34, 24, 1081); casa(40, 122, 26, 20, 1082); casa(250, 124, 30, 22, 1083);
    T.rect(k, 120, 58, 22, 64, piedra(["#c8c0b4", "#b0a89c", "#968e84", "#7c766e", "#625e58"], { tx: 6, ty: 4, s: 1084 })); rellena(k, [[117, 59], [131, 30], [145, 59]], (x, y) => rampa(["#ffffff", "#e2eaf3", "#c8d4e4"], (x - 117) / 28, x, y)); k.R(130, 22, 2, 9, "#5a5a64"); k.R(127, 25, 8, 2, "#5a5a64");
    T.rect(k, 142, 80, 64, 42, piedra(["#c8c0b4", "#b0a89c", "#968e84", "#7c766e", "#625e58"], { tx: 7, ty: 4, s: 1085 })); rellena(k, [[138, 81], [174, 62], [210, 81]], (x, y) => rampa(["#ffffff", "#f2f6fb", "#dfe8f2", "#c8d4e4"], 0.1 + ((x - 138) / 72) * 0.5, x, y));
    [[150, 88], [166, 88], [182, 88], [196, 88], [128, 70]].forEach(([x, y], i) => { bola(k, x + 3, y, 3, 3, (px, py) => (py > y ? null : "#5a5a64")); T.rect(k, x, y, 6, 14, () => "#5a5a64"); T.rect(k, x + 1, y, 4, 13, (px, py) => ["#e8402a", "#3a6ac8", "#e8c040", "#3a9a5a"][(px + py + i) % 4]); vs.push([x + 3, y + 6]); });
    k.R(169, 108, 10, 14, "#4a2e1c");
    T.rect(k, 214, 92, 36, 32, (x, y) => rampa(["#e0d2b8", "#ccbc9e", "#b4a284", "#9a8a6c"], 0.2 + ((x - 214) / 36) * 0.4, x, y));
    rellena(k, [[212, 93], [220, 80], [228, 86], [234, 72], [242, 84], [252, 93]], (x, y) => rampa(["#5a4a3a", "#4a3c2e", "#3a2e22"], (y - 72) / 21, x, y)); k.poli([[222, 92], [228, 86], [236, 90], [232, 100], [224, 100]], "#1c1612");
    for (let i = 0; i < 40; i++) k.P(214 + hash(i, 1, 1086) * 36, 100 + hash(i, 2, 1086) * 24, i % 2 ? "#4a7a4a" : "#3a6a3a"); T.ventana(k, 238, 104, 6, 6, { marco: "#5a3a24", vidrio: "#3a3a44" }); k.R(220, 112, 6, 12, "#3a2a1a");
    T.rect(k, 0, 122, W, 58, (x, y) => rampa(["#ffffff", "#f2f6fb", "#e2eaf3", "#cfdbe9", "#b8c8dc"], 0.1 + ((y - 122) / 58) * 0.3 + (fbm(x * 0.05, y * 0.15, 1087) - 0.5) * 0.5, x, y));
    for (let y = 124; y < H; y++) { const f = (y - 124) / 56, c = 176 + f * 24, w = 4 + f * 20; for (let x = Math.round(c - w); x <= c + w; x++) if (hash(x, y, 1088) > 0.45) k.P(x, y, "#d0dce8"); }
    [[96, 140], [112, 150], [130, 138], [80, 158], [246, 148], [272, 140], [288, 156]].forEach(([x, b], i) => { bola(k, x, b - 8, 4, 4, (px, py) => (py > b - 8 ? null : "#8a8a96")); T.rect(k, x - 4, b - 8, 8, 8, (px, py) => rampa(["#9a9aa6", "#84848e", "#6e6e78"], (px - x + 4) / 8, px, py)); bola(k, x, b - 12, 4, 1.5, () => "#ffffff"); });
    T.rect(k, 54, 120, 8, 30, (x, y) => rampa(["#c8c0b4", "#b0a89c", "#968e84"], (x - 54) / 8, x, y)); k.poli([[54, 120], [58, 112], [62, 120]], "#b0a89c"); k.R(50, 148, 16, 4, "#968e84"); bola(k, 58, 112, 3, 1.5, () => "#ffffff");
    P.nieve(k, 140, 1089);
    luces(k, vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  MAG[29] = ["El Valle de Gidroc", "El pueblo nevado, con su iglesia, su cementerio y la casa en ruinas de los Petter", valle, { ven: ["#ffd27a", "#e8402a", "#3a6ac8", "#e8c040", "#3a9a5a"], tinte: 0.2 }];

  function grongitts(k) {
    const FX = 160, FY = 82, f = (y) => (y - FY) / 100;
    const MAR = ["#ffffff", "#f4f2ec", "#e4e0d6", "#ccc8bc", "#b0aca0"];
    T.rect(k, 0, 0, W, 112, (x, y) => rampa(MAR, 0.15 + (Math.abs(x - FX) / 160) * 0.3 + (Math.abs(Math.sin(x * 0.07 + y * 0.03 + fbm(x * 0.03, y * 0.03, 1091) * 5)) < 0.05 ? 0.35 : 0), x, y));
    T.rect(k, 140, 44, 40, 60, (x, y) => rampa(ORO, 0.15 + ((x - 140) / 40) * 0.5 + (Math.abs(x - 160) < 1 ? 0.4 : 0), x, y)); rellena(k, [[134, 45], [160, 30], [186, 45]], (x, y) => rampa(ORO, 0.1 + ((x - 134) / 52) * 0.5, x, y)); [[150, 74], [170, 74]].forEach(([x, y]) => bola(k, x, y, 2, 2, () => ORO[4]));
    [0.35, 0.55, 0.8, 1.2].forEach((e) => [-1, 1].forEach((lado) => { const x = FX + lado * 130 * e, w = 14 * e, yb = FY + 40 * e; Det.cilindro(k, x - w / 2, 0, w, yb, MAR.slice(0, 4)); k.R(x - w / 2 - 2 * e, yb - 4 * e, w + 4 * e, 4 * e, MAR[3]); }));
    const L = [[110, 24], [210, 24], [160, 14]].map(([x, y]) => { k.R(x, 0, 1, y - 4, ORO[3]); bola(k, x, y, 12, 3, (px, py) => rampa(ORO, 0.2 + ((px - x + 12) / 24) * 0.5, px, py)); for (let i = -2; i <= 2; i++) { k.R(x + i * 5, y - 5, 1, 3, "#f4efe6"); k.crudo(x + i * 5, y - 7, 1, 2, "#ffcf6a"); } return { x, y: y - 4, r: 40, ry: 26, col: "#ffcf7a", f: 0.6 }; });
    suelo3d(k, 104, 180, FX, FY, (X, z, x, y) => { const i = Math.floor(X / 24), j = Math.floor(z / 0.3), blanca = (i + j) % 2 === 0, vena = Math.abs(Math.sin(X * 0.2 + z * 7 + fbm(X * 0.04, z, 1092) * 5)) < 0.06; return blanca ? (vena ? "#c8c4bc" : "#f4f2ec") : vena ? "#5a5a64" : "#2a2a32"; });
    const mostrador = (lado) => {
      const p = (X, y, a) => [FX + X * f(y), y - a * f(y)], X0 = lado * 70, X1 = lado * 96, y0 = 108, y1 = 186;
      rellena(k, [p(X0, y0, 0), p(X0, y0, 36), p(X0, y1, 36), p(X0, y1, 0)], (x, y) => rampa(["#8a5a32", "#744a28", "#5e3a1e", "#482c16"], 0.3 + (Math.floor(x / 3) % 2 ? 0.08 : 0), x, y));
      rellena(k, [p(X0, y0, 36), p(X1, y0, 36), p(X1, y1, 36), p(X0, y1, 36)], (x, y) => rampa(["#b07a4a", "#9a6a3e", "#845a32"], 0.3, x, y));
      for (let z = 2.2; z > 0.9; z -= 0.42) { const y = FY + 100 / z, e = f(y), [x, ty] = p(X0 + lado * 12, y, 36);
        bola(k, x, ty - 6 * e, 5 * e, 6 * e, () => "#3a3a44"); bola(k, x, ty - 16 * e, 4 * e, 4 * e, () => "#b8c8a0"); k.poli([[x - 4 * e, ty - 17 * e], [x - 10 * e, ty - 21 * e], [x - 3 * e, ty - 14 * e]], "#a8b890"); k.poli([[x + 4 * e, ty - 17 * e], [x + 10 * e, ty - 21 * e], [x + 3 * e, ty - 14 * e]], "#a8b890"); k.R(x - 2 * e, ty - 17 * e, 1, 1, "#2a2a30"); k.R(x + 1 * e, ty - 17 * e, 1, 1, "#2a2a30");
        const [bx, by] = p(X0 - lado * 4, y, 36); k.R(bx - 4 * e, by - 2 * e, 8 * e, 2 * e, "#e8e0c8"); k.R(bx - 6 * e * lado, by - 1, 2 * e, 1, ORO[1]); k.crudo(bx + 3 * e * lado, by - 2, 2, 1, ORO[0]); }
    };
    mostrador(-1); mostrador(1);
    luces(k, L);
  }
  MAG[30] = ["Grongitts", "El gran vestíbulo de mármol del banco de los duendes", grongitts, { cielo: "propio", fuerza: 0.12, fuego: ["#ffcf6a", "#fff4c0"] }];

  function eosed(k) {
    T.rect(k, 0, 0, W, 132, piedra(["#4a4656", "#3e3a4a", "#32303e", "#262432", "#1c1a26"], { tx: 16, ty: 9, s: 1101 }));
    const puerta = (x, cols, s) => { bola(k, x, 74, 22, 18, (px, py) => (py > 74 ? null : "#5a566a")); T.rect(k, x - 22, 74, 44, 58, () => "#5a566a"); bola(k, x, 76, 18, 15, (px, py) => (py > 76 ? null : "#0a0a10")); T.rect(k, x - 18, 76, 36, 56, () => "#0a0a10"); for (let i = 0; i < 9; i++) { const fx = x - 16 + i * 4, h = 14 + hash(i, 1, s) * 22; rellena(k, [[fx - 3, 132], [fx + Math.sin(i) * 2, 132 - h], [fx + 3, 132]], (px, py) => rampa(cols, 0.1 + ((132 - py) / h) * 0.8, px, py)); } };
    puerta(42, ["#a87aff", "#7a4ae8", "#4a2aa8", "#2a1a5a"], 1102); puerta(278, ["#9a7ab8", "#6a4a8a", "#3a2a5a", "#1a1028"], 1103);
    [[96, 126, 128], [104, 120, 112], [112, 114, 96]].forEach(([x, y, w]) => T.rect(k, x, y, w, 7, (px, py) => rampa(["#7a7686", "#666272", "#524e5e", "#3e3a4a"], 0.2 + ((py - y) / 7) * 0.5, px, py)));
    bola(k, 160, 30, 34, 24, (x, y) => (y > 30 ? null : rampa(ORO, 0.1 + ((x - 126) / 68) * 0.5, x, y))); T.rect(k, 126, 30, 68, 80, (x, y) => rampa(ORO, 0.12 + ((x - 126) / 68) * 0.5, x, y));
    bola(k, 160, 32, 27, 18, (x, y) => (y > 32 ? null : "#c8d8f0")); T.rect(k, 133, 32, 54, 74, (x, y) => rampa(["#e8f0ff", "#c8d8f0", "#a8bcdc", "#8aa0c8"], 0.15 + ((x - 133) / 54) * 0.5 + (Math.abs(((x - 133) - (y - 32) * 0.6) % 24 - 6) < 3 ? -0.15 : 0), x, y));
    for (let i = 0; i < 7; i++) if (i < 2 || i > 4) k.crudo(126 + i * 11, 16 - Math.sin((i / 6) * Math.PI) * 10, 3, 3, ORO[0]);
    k.R(143, 2, 35, 10, ORO[3]); k.R(144, 3, 33, 8, ORO[1]); k.R(144, 3, 33, 1, ORO[0]); rotulo(k, 151, 5, "EOSED", ORO[4]);
    [[126, 110], [190, 110]].forEach(([x, y]) => { k.R(x, y, 6, 4, ORO[2]); k.R(x - 1, y + 4, 8, 2, ORO[3]); [0, 3, 6].forEach((d) => k.P(x - 1 + d, y + 6, ORO[4])); });
    suelo3d(k, 132, 180, 160, 80, losas3d(["#6a6676", "#5a5666", "#4a4656", "#3a3646", "#2a2636"], { tx: 24, tz: 16, s: 1104 }));
    luces(k, [{ x: 42, y: 110, r: 50, ry: 40, col: "#a87aff", f: 0.6 }, { x: 278, y: 110, r: 50, ry: 40, col: "#9a7ab8", f: 0.4 }, { x: 160, y: 70, r: 70, ry: 60, col: "#e8f0ff", f: 0.35 }]);
  }
  MAG[31] = ["El espejo de Eosed", "La última sala de la piedra: el espejo de pie, entre llamas negras y moradas", eosed, { cielo: "propio", fuerza: 0.06, fuego: ["#a87aff", "#7a4ae8", "#9a7ab8", "#e8f0ff", "#c8d8f0"] }];
})();

(function () {
  const { rampa, rellena, nubarron, rotulo, montana } = Det;
  const { bola, mezcla, hash, fbm, celdas, bezier, trazo, cuerda, madera, piedra, ladrillo, tejas, suelo3d, tablones, losas3d, copa, briznas, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, Q = window.H17;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  window.SitiosIt15 = window.SitiosIt15 || {};
  const MAG = (window.SitiosIt15.magos = window.SitiosIt15.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const ORO = ["#f8e090", "#e8c050", "#c89a3a", "#a07a28", "#7a5a1a"];
  const MAR = ["#ffffff", "#f4f2ec", "#e4e0d6", "#ccc8bc", "#b0aca0"];
  const ROJO = ["#e05a4a", "#c8323a", "#a02830", "#781c22", "#561418"];
  function dragon(k, x, b, e, pal, { ala = 0.5, mira = 1, llama = null, s = 1 } = {}) {
    const L = (v) => v * e, X = (v) => x + mira * L(v), col = (px, py) => rampa(pal, 0.15 + ((py - b + L(40)) / L(40)) * 0.5 + (fbm(px * 0.2, py * 0.2, s) - 0.5) * 0.2, px, py);
    trazo(k, bezier([X(-20), b - L(14)], [X(-44), b - L(10)], [X(-56), b - L(2)], [X(-70), b - L(8)], 20), pal[2], L(6), 1); for (let i = 0; i < 6; i++) { const [px, py] = bezier([X(-20), b - L(14)], [X(-44), b - L(10)], [X(-56), b - L(2)], [X(-70), b - L(8)], 6)[i]; k.poli([[px - 2, py - 2], [px, py - L(6)], [px + 2, py - 2]], pal[3]); }
    rellena(k, [[X(-24), b - L(10)], [X(-18), b - L(26)], [X(10), b - L(30)], [X(22), b - L(18)], [X(18), b - L(8)]].map(([a, c]) => [a, c]), col);
    [[-14, 0], [12, 0]].forEach(([d]) => { k.R(Math.min(X(d), X(d + 6)), b - L(10), L(6), L(10), pal[3]); k.R(Math.min(X(d - 1), X(d + 7)), b - L(2), L(8), L(2), pal[4]); });
    const S = [X(2), b - L(26)], E = [X(-14 - 20 * ala), b - L(40 + 40 * ala)], Pt = [X(12 + 10 * ala), b - L(52 + 40 * ala)], mid = (A, B, t, d) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + L(d)];
    const M1 = mid(Pt, S, 0.3, 10), M2 = mid(Pt, S, 0.65, 8);
    rellena(k, [S, E, Pt, M1, mid(Pt, S, 0.48, 4), M2, S], (px, py) => rampa(pal, 0.3 + ((py - Pt[1]) / Math.max(1, S[1] - Pt[1])) * 0.35, px, py));
    trazo(k, [S, E, Pt], pal[4], Math.max(1, L(2))); trazo(k, [E, M1], pal[4], 1); trazo(k, [E, M2], pal[4], 1);
    trazo(k, bezier([X(16), b - L(24)], [X(26), b - L(36)], [X(30), b - L(48)], [X(40), b - L(52)], 16), pal[1], L(7), L(5));
    rellena(k, [[X(36), b - L(56)], [X(54), b - L(54)], [X(56), b - L(48)], [X(40), b - L(46)]], col);
    k.poli([[X(38), b - L(56)], [X(32), b - L(64)], [X(42), b - L(57)]], pal[4]); k.poli([[X(44), b - L(56)], [X(42), b - L(64)], [X(48), b - L(56)]], pal[4]);
    k.crudo(X(46), b - L(53), Math.max(1, L(2)), Math.max(1, L(2)), "#ffd23f");
    if (llama) { const [lx, ly] = [X(56), b - L(51)], FU = ["#fff4c0", "#ffe08a", "#ffcf6a", "#ff9a3a", "#e8502a", "#b8321e"]; for (let i = 59; i >= 0; i--) { const t = i / 60, j = (hash(i, 2, s) - 0.5) * L(8) * t, r = L(1.5 + t * 9) * (0.6 + hash(i, 3, s) * 0.6), c = FU[Math.min(5, Math.floor(t * 5 + hash(i, 1, s) * 1.2))], px = lx + mira * L(t * llama[0]) + j, py = ly + L(t * llama[1]) + j * 0.5; k.alfa(t > 0.6 ? 0.75 : 1, () => bola(k, px, py, r, r * 0.85, () => c)); } }
  }

  function roca(k) {
    T.rect(k, 0, 0, W, 112, (x, y) => rampa(["#3a4458", "#2e384a", "#242c3c", "#1a2030"], 0.2 + (y / 112) * 0.4 + (fbm(x * 0.03, y * 0.05, 1111) - 0.5) * 0.5, x, y));
    nubarron(k, 20, 10, 120, 18, ["#5a6478", "#4a5468", "#3a4458"]); nubarron(k, 180, 24, 130, 16, ["#5a6478", "#4a5468", "#3a4458"]);
    P.rayo(k, 250, 0, 276, 92, { s: 1112, ramas: 3 });
    P.mar(k, 112, 180, ["#3a5068", "#2e4258", "#243648", "#1a2a3a", "#121e2c"], { s: 1113, cresta: "#c8d8e8", medio: "#5a7890", tinte: "#1a2a3a" });
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 1114) * W, y = 116 + hash(i, 2, 1114) * 60; k.R(x, y, 6 + hash(i, 3, 1114) * 10, 1, "#e8f0f8"); }
    rellena(k, [[90, 132], [104, 104], [126, 92], [196, 92], [214, 104], [232, 134], [200, 140], [120, 140]], (x, y) => rampa(["#6a6a72", "#58585e", "#46464c", "#34343a", "#24242a"], 0.15 + ((x - 90) / 142) * 0.4 + ((y - 92) / 48) * 0.3 + (fbm(x * 0.12, y * 0.12, 1115) - 0.5) * 0.3, x, y));
    T.rect(k, 136, 66, 52, 28, piedra(["#8a8478", "#76706a", "#625c56", "#4e4a46", "#3c3936"], { tx: 6, ty: 4, s: 1116 }));
    rellena(k, [[132, 67], [140, 52], [184, 52], [192, 67]], tejas(["#5a4a3a", "#4a3c2e", "#3a2e22", "#2a2018"], { w: 4, h: 2, s: 1117, y0: 52 }));
    T.rect(k, 176, 44, 6, 12, () => "#4e4a46"); Det.humo(k, 179, 42, "#8a8a96", 0.35, 5);
    k.R(146, 76, 10, 8, "#5a3a24"); k.crudo(147, 77, 8, 6, "#ffcf6a"); k.R(150, 77, 1, 6, "#5a3a24");
    k.R(166, 74, 12, 20, "#1c1410"); k.crudo(167, 76, 10, 18, "#ffb050"); rellena(k, [[160, 94], [176, 92], [180, 96], [164, 98]], madera(["#7a5a3a", "#664a30", "#523a24", "#3e2a1a", "#2a1c10"], { paso: 2, largo: 99, s: 1118 }));
    rellena(k, [[222, 140], [252, 140], [248, 146], [226, 146]], (x, y) => rampa(["#7a5a3a", "#5a4228", "#3e2a1a"], (y - 140) / 6, x, y)); trazo(k, [[222, 140], [206, 128]], "#8a7458", 1);
    P.lluvia(k, 220, 1119, { col: "#9ab0c8", largo: 8, ang: 0.5, a: 0.6 });
    luces(k, [{ x: 172, y: 84, r: 30, ry: 22, col: "#ffb050", f: 0.9 }, { x: 151, y: 80, r: 16, col: "#ffcf6a", f: 0.7 }]);
  }
  MAG[32] = ["La cabaña de la roca", "La choza en lo alto de la roca, en medio del mar, la noche de la tormenta en que llega Higrad", roca, { cielo: "propio", fuerza: 0.2, fuego: ["#ffcf6a", "#ffb050", "#ffffff", "#9ad8ff"] }];

  function barcas(k) {
    const lit = encendido(k);
    k.banda(["#3a5a9a", "#5a7ab0", "#8aa4c8", "#c8d4e0"], 0, 104);
    montana(k, 40, 104, 160, 40, { roca: ["#4a5a70", "#3e4e64", "#344256", "#2a364a"] }); montana(k, 290, 104, 150, 36, { roca: ["#4a5a70", "#3e4e64", "#344256", "#2a364a"] });
    Q.acantilado(k, 100, 226, 66, 105, 1121);
    const vs = Q.castillo(k, 164, 68, 0.72, { s: 1122 });
    T.rect(k, 0, 104, W, 76, (x, y) => rampa(["#2a4a7a", "#22406a", "#1a345a", "#142a4a"], 0.2 + ((y - 104) / 76) * 0.6, x, y));
    espejo(k, 104, 104, 176, { tinte: "#16305a", mezcla: 0.45, onda: 2, crestas: 0.08 });
    const L = [];
    [[60, 128, 0.5], [118, 122, 0.4], [200, 126, 0.45], [252, 134, 0.6], [92, 150, 0.85], [196, 158, 1]].forEach(([x, y, e], i) => {
      k.alfa(0.4, () => { trazo(k, [[x - 30 * e, y + 2 * e], [x - 12 * e, y + 1]], "#c8d8f0", 1); trazo(k, [[x - 30 * e, y + 5 * e], [x - 12 * e, y + 3 * e]], "#c8d8f0", 1); });
      rellena(k, [[x - 14 * e, y - 3 * e], [x + 14 * e, y - 3 * e], [x + 10 * e, y + 2 * e], [x - 11 * e, y + 2 * e]], (px, py) => rampa(["#8a6a48", "#6e5236", "#523c26"], (py - y + 3 * e) / (5 * e), px, py));
      k.R(x + 12 * e, y - 12 * e, 1, 9 * e, "#3a2a1a"); k.crudo(x + 11 * e, y - 14 * e, Math.max(2, 3 * e), Math.max(2, 3 * e), "#ffd27a");
      L.push({ x: x + 12 * e, y: y - 13 * e, r: 10 + 10 * e, col: "#ffcf7a", f: 0.8 });
    });
    luces(k, [...L, ...vs.map(([x, y]) => ({ x, y, r: 6, col: LUZ, f: lit * 0.7 }))]);
  }
  MAG[33] = ["Las barcas del lago", "Los de primero cruzan el lago en barcas con farolillos, hacia el castillo encendido", barcas, { ven: VEN, dx: 104, fuego: ["#ffd27a"] }];

  function serpiente(k) {
    T.rect(k, 0, 0, W, 130, (x, y) => rampa(["#5a6a5a", "#4a5a4c", "#3c4c40", "#2e3e34"], 0.2 + (y / 130) * 0.4 + (Math.floor(x / 40) % 2 ? 0.05 : 0), x, y));
    k.R(0, 0, W, 10, "#2a3a2e"); for (let x = 0; x < W; x += 40) k.R(x, 0, 3, 130, "#2a3a2e");
    const terrario = (x, y, w, h, s, bicho) => { T.rect(k, x - 3, y - 3, w + 6, h + 6, () => "#3a2a1a"); T.rect(k, x, y, w, h, (px, py) => rampa(["#9ad8a0", "#7ac088", "#5aa870", "#3a8a58"], 0.15 + ((py - y) / h) * 0.6, px, py)); T.rect(k, x, y + h - 8, w, 8, (px, py) => rampa(["#b8946a", "#9a7a54", "#7c6040"], hash(px, py, s), px, py)); for (let i = 0; i < 3; i++) { const fx = x + 4 + i * (w / 3); trazo(k, [[fx, y + h - 6], [fx - 3, y + h - 18], [fx - 6, y + h - 24]], "#2a6a3a", 2, 1); } bicho(x + w / 2, y + h - 8); k.alfa(0.3, () => trazo(k, [[x + 3, y + 3], [x + 12, y + h - 6]], "#ffffff", 1)); };
    terrario(14, 40, 58, 44, 1131, (x, b) => { bola(k, x, b - 3, 6, 3, () => "#8a9a4a"); k.R(x + 5, b - 5, 4, 2, "#8a9a4a"); k.P(x + 7, b - 5, "#2a2a30"); });
    terrario(248, 40, 58, 44, 1132, (x, b) => { trazo(k, [[x - 12, b - 2], [x - 4, b - 6], [x + 4, b - 2], [x + 12, b - 5]], "#c8a040", 2); k.P(x + 12, b - 6, "#2a2a30"); });
    T.rect(k, 92, 22, 136, 92, () => "#3a2a1a"); T.rect(k, 96, 26, 128, 84, (px, py) => rampa(["#c8e8b0", "#a8d890", "#88c070", "#68a858"], 0.15 + ((py - 26) / 84) * 0.6, px, py));
    T.rect(k, 96, 96, 128, 14, (px, py) => rampa(["#c8a878", "#b09060", "#96784c"], 0.3 + (hash(px, py, 1133) - 0.5) * 0.5, px, py));
    k.roca(112, 104, 22, 12, "#8a8478", "#a8a294", "#625c56"); k.roca(208, 106, 18, 10, "#8a8478", "#a8a294", "#625c56");
    trazo(k, [[180, 104], [214, 92]], "#7a5a3a", 6, 5); trazo(k, [[180, 102], [214, 90]], "#9a7a54", 1);
    const piel = (px, py, cy, g) => ((Math.floor(px / 3) + Math.floor(py / 3)) % 3 === 0 ? "#6a5430" : rampa(["#d8b878", "#c0a060", "#a0844c", "#7c6438"], 0.15 + ((py - cy + g) / (2 * g)) * 0.6, px, py));
    [[160, 102, 30, 7, 5], [158, 94, 24, 6, 5], [160, 87, 17, 5, 4]].forEach(([cx, cy, rx, ry, g]) => [Math.PI, 0].forEach((a0) => { for (let a = a0; a < a0 + Math.PI; a += 0.04) { const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; bola(k, x, y, g, g * 0.8, (px, py) => piel(px, py, y, g)); } }));
    const cuello = bezier([170, 86], [182, 74], [176, 60], [190, 52], 30); cuello.forEach(([x, y], i) => { const g = 4 - i / 15; bola(k, x, y, g, g, (px, py) => piel(px, py, y, g)); });
    bola(k, 194, 50, 6, 4, (px, py) => rampa(["#d8b878", "#c0a060", "#a0844c"], 0.2 + ((py - 46) / 8) * 0.5, px, py)); k.P(195, 48, "#1a1a10"); k.crudo(196, 48, 1, 1, "#e8d84a"); trazo(k, [[200, 51], [204, 51], [206, 49]], "#c82a30", 1); trazo(k, [[204, 51], [206, 53]], "#c82a30", 1);
    T.rect(k, 128, 112, 64, 10, () => "#e8e4d4"); rotulo(k, 132, 115, "BOA CONSTRICTOR", "#2a2a30");
    T.rect(k, 0, 130, W, 50, (x, y) => rampa(["#8a8478", "#76706a", "#625c56", "#4e4a46"], 0.2 + ((y - 130) / 50) * 0.4 + (hash(x, y, 1134) - 0.5) * 0.12, x, y));
    k.R(0, 128, W, 3, "#5a5a64"); for (let x = 6; x < W; x += 24) k.R(x, 128, 2, 14, "#5a5a64"); k.R(0, 140, W, 2, "#5a5a64");
    luces(k, [{ x: 160, y: 66, r: 120, ry: 70, col: "#c8f0b0", f: 0.5 }, { x: 43, y: 62, r: 50, col: "#9ad8a0", f: 0.4 }, { x: 277, y: 62, r: 50, col: "#9ad8a0", f: 0.4 }]);
  }
  MAG[34] = ["El cristal de la serpiente", "La casa de los reptiles del zoo, con la boa detrás de su cristal", serpiente, { cielo: "propio", fuerza: 0.1, fuego: ["#c8e8b0", "#a8d890", "#9ad8a0", "#7ac088"] }];

  function expreso(k) {
    T.rect(k, 0, 0, W, 130, madera(["#9a6a3e", "#845a32", "#6e4a28", "#583a1e", "#422c16"], { paso: 4, vertical: true, largo: 99, s: 1141 }));
    T.rect(k, 40, 20, 176, 74, () => "#5a3a24"); T.rect(k, 44, 24, 168, 66, () => "#7fb0d8");
    rellena(k, [[44, 70], [80, 54], [120, 62], [170, 48], [212, 60], [212, 90], [44, 90]], (x, y) => rampa(["#7a9a6a", "#6a8a5a", "#5a7a4c"], 0.2 + ((y - 48) / 42) * 0.5, x, y));
    rellena(k, [[44, 80], [100, 72], [160, 78], [212, 70], [212, 90], [44, 90]], (x, y) => rampa(["#5a8a4a", "#4a7a3e", "#3c6a34"], 0.2 + (hash(x, y, 1142) - 0.5) * 0.4, x, y));
    for (let i = 0; i < 12; i++) { const x = 50 + i * 14, y = 82 - (i % 3) * 3; k.R(x, y - 6, 1, 6, "#3a2a1a"); bola(k, x, y - 8, 3, 3, () => "#3c6a34"); }
    k.alfa(0.3, () => { for (let y = 26; y < 88; y += 7) trazo(k, [[44, y], [212, y - 6]], "#ffffff", 1); });
    k.R(127, 24, 2, 66, "#5a3a24"); k.R(40, 92, 176, 4, "#7a5034");
    k.R(0, 8, W, 2, "#c8a040"); k.R(0, 4, W, 1, "#c8a040"); [[20, 26], [70, 30], [228, 24]].forEach(([x, w], i) => { T.rect(k, x, -6, w, 13, (px, py) => rampa(["#8a4a2a", "#743e22", "#5e321a"], (py + 6) / 13, px, py)); k.R(x + w / 2 - 2, 1, 4, 3, "#c8a040"); });
    T.rect(k, 120, -4, 14, 12, () => "#c8a040"); for (let x = 121; x < 134; x += 3) k.R(x, -4, 1, 12, "#7a5a1a"); bola(k, 127, 4, 4, 3, () => "#f4f4f8"); k.P(126, 3, "#2a2a30");
    [[0, 1], [W, -1]].forEach(([x0, s]) => { const x1 = x0 + s * 56; rellena(k, [[x0, 70], [x1, 74], [x1, 130], [x0, 130]], (x, y) => rampa(ROJO, 0.15 + (Math.abs(x - x0) / 56) * 0.35 + (Math.abs(x - x0) % 9 < 1 ? 0.22 : 0) + ((y - 70) % 12 < 1 ? 0.12 : 0), x, y)); k.R(Math.min(x0, x1), 68, 56, 3, ROJO[3]); rellena(k, [[x0, 124], [x1 + s * 10, 126], [x1 + s * 10, 140], [x0, 140]], (x, y) => rampa(ROJO, 0.1 + ((y - 124) / 16) * 0.5, x, y)); });
    T.rect(k, 230, 24, 54, 106, () => "#5a3a24"); T.rect(k, 234, 28, 46, 102, (x, y) => rampa(["#c8a878", "#b09060", "#96784c"], 0.2 + ((y - 28) / 102) * 0.4, x, y));
    const cx = 238, cb = 132; T.rect(k, cx, cb - 40, 38, 36, madera(["#9a6a3e", "#845a32", "#6e4a28", "#583a1e", "#422c16"], { paso: 3, largo: 99, s: 1143 })); k.R(cx - 2, cb - 42, 42, 3, "#c8a040");
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { const c = ["#7a4a8a", "#e8402a", "#3f8ac0", "#f2c84b", "#3fb85a", "#e86aa8"][(i + j * 2) % 6], x = cx + 2 + i * 6, y = cb - 50 - j * 7; k.R(x, y, 5, 6, c); k.R(x + 1, y + 1, 3, 1, mezcla(c, "#ffffff", 0.5)); }
    [[cx + 4, cb - 2], [cx + 34, cb - 2]].forEach(([x, y]) => { k.elipse(x, y, 3, 3, "#2a2a30"); k.elipse(x, y, 1, 1, "#8a8a96"); });
    T.rect(k, 0, 130, W, 50, (x, y) => rampa(["#7a4a3a", "#683e30", "#563226", "#44261c"], 0.2 + ((y - 130) / 50) * 0.4 + (Math.floor(x / 10 + y / 4) % 2 ? 0.06 : 0), x, y));
    [[0, 1], [W, -1]].forEach(([x0, s]) => { const x1 = x0 + s * 66; rellena(k, [[x0, 124], [x1, 126], [x1, 142], [x0, 142]], (x, y) => rampa(ROJO, 0.1 + ((y - 124) / 18) * 0.5, x, y)); k.R(Math.min(x0, x1), 141, 66, 2, ROJO[4]); });
  }
  MAG[35] = ["El Expreso por dentro", "El compartimento, la ventana al campo y el carrito de los dulces", expreso, { cielo: "propio", fuerza: 0.45, ventanal: "#7fb0d8" }];

  function nyrtle(k) {
    T.rect(k, 0, 0, W, 124, (x, y) => (x % 10 === 0 || y % 10 === 0 ? "#8a9a92" : rampa(["#d8e4dc", "#c4d4ca", "#b0c2b8", "#9cb0a6"], 0.2 + (y / 124) * 0.3 + (hash(Math.floor(x / 10), Math.floor(y / 10), 1151) - 0.5) * 0.2, x, y)));
    k.R(0, 60, W, 4, "#4a7a6a");
    bola(k, 160, 24, 22, 16, (x, y) => (y > 24 ? null : "#5a6a62")); T.rect(k, 138, 24, 44, 26, () => "#5a6a62"); bola(k, 160, 24, 19, 13, (x, y) => (y > 24 ? null : "#7fb0d8")); T.rect(k, 141, 24, 38, 24, () => "#7fb0d8"); k.R(159, 11, 2, 37, "#5a6a62"); k.R(141, 34, 38, 1, "#5a6a62");
    [[0, 1], [W, -1]].forEach(([x0, s]) => { for (let i = 0; i < 3; i++) { const x = s > 0 ? x0 + i * 30 : x0 - (i + 1) * 30; T.rect(k, x, 52, 30, 76, () => "#4a3626"); T.rect(k, x + 2, 56, 26, 72, madera(["#9a7a58", "#866848", "#72583a", "#5e482e", "#4a3822"], { paso: 3, vertical: true, largo: 99, s: 1152 + i })); k.R(x + (s > 0 ? 22 : 4), 90, 3, 2, "#c8c8d0"); } });
    T.rect(k, 132, 70, 56, 58, (x, y) => rampa(["#e8e4dc", "#d4d0c8", "#bcb8b0", "#a4a098"], 0.15 + ((x - 132) / 56) * 0.5, x, y));
    [[136, 88], [160, 86], [184, 88]].forEach(([x, y], i) => { bola(k, x, y, 10, 4, (px, py) => rampa(["#ffffff", "#f0f0ec", "#d8d8d4"], (px - x + 10) / 20, px, py)); bola(k, x, y - 1, 7, 2, () => "#a8b8c0"); k.R(x - 1, y - 9, 2, 6, "#b87a4a"); k.R(x - 1, y - 9, 5, 2, "#b87a4a"); });
    trazo(k, [[158, 72], [160, 74], [158, 76], [160, 78]], "#3a8a4a", 1); k.P(161, 72, "#3a8a4a");
    suelo3d(k, 124, 180, 160, 60, (X, z, x, y) => (Math.floor(X / 14 + 100) % 2 === Math.floor(z * 5) % 2 ? "#c4d4ca" : "#8a9a92"));
    [[120, 150, 30, 5], [214, 164, 36, 6], [70, 170, 24, 4]].forEach(([x, y, rx, ry]) => k.alfa(0.55, () => bola(k, x, y, rx, ry, (px, py) => (Math.sin(px * 0.5 + py) > 0.6 ? "#e8f4ff" : "#9ac0d8"))));
    k.alfa(0.4, () => { bola(k, 230, 42, 6, 7, () => "#d8f0f4"); rellena(k, [[222, 50], [238, 50], [242, 74], [234, 70], [228, 76], [220, 72]], () => "#c8e8f0"); });
    k.alfa(0.6, () => { k.R(226, 40, 3, 2, "#8aa8b0"); k.R(232, 40, 3, 2, "#8aa8b0"); });
  }
  MAG[36] = ["El baño de Nyrtle", "Los lavabos en corro, con el grifo de la serpiente, y los cubículos", nyrtle, { cielo: "propio", fuerza: 0.25, ventanal: "#7fb0d8" }];

  function boggart(k) {
    T.rect(k, 0, 0, W, 118, madera(["#7a5a3a", "#684c30", "#563e26", "#44301c", "#322214"], { paso: 4, vertical: true, largo: 99, s: 1161 }));
    for (let x = 0; x < W; x += 32) T.rect(k, x + 4, 14, 24, 60, (px, py) => rampa(["#8a6a48", "#74583a", "#5e462e"], 0.2 + ((px - x - 4) / 24) * 0.4, px, py));
    T.rect(k, 30, 16, 40, 56, () => "#4a3626"); T.rect(k, 33, 19, 34, 50, () => "#7fb0d8"); k.R(49, 19, 2, 50, "#4a3626"); k.R(33, 42, 34, 2, "#4a3626");
    T.rect(k, 252, 22, 38, 28, () => ORO[2]); T.rect(k, 255, 25, 32, 22, (x, y) => rampa(["#5a7a5a", "#4a6a4c", "#3c5c40"], (y - 25) / 22, x, y)); montana(k, 271, 47, 30, 14, { roca: ["#8a9aa8", "#7a8a98", "#6a7a88", "#5a6a78"] });
    suelo3d(k, 118, 180, 160, 60, tablones(["#8a5a32", "#744a28", "#5e3a1e", "#482c16", "#321e0e"], { pw: 10, L: 50, s: 1163 }));
    k.R(0, 117, W, 2, "#2a1a10");
    k.alfa(0.3, () => { T.rect(k, 128, 34, 64, 96, () => "#1a120c"); });
    const ax = 132, ab = 130;
    T.rect(k, ax - 2, ab - 98, 60, 6, (x, y) => rampa(["#7a5034", "#62402a", "#4a3020"], (y - ab + 98) / 6, x, y));
    T.rect(k, ax, ab - 92, 56, 90, madera(["#8a5a32", "#744a28", "#5e3a1e", "#482c16", "#321e0e"], { paso: 3, vertical: true, largo: 99, s: 1162 }));
    k.R(ax + 27, ab - 90, 2, 86, "#2a1a10"); [[ax + 6, ab - 84, 18, 36], [ax + 32, ab - 84, 18, 36], [ax + 6, ab - 42, 18, 34], [ax + 32, ab - 42, 18, 34]].forEach(([x, y, w, h]) => T.rect(k, x, y, w, h, (px, py) => rampa(["#9a6a3e", "#845a32", "#6e4a28"], 0.2 + ((px - x) / w) * 0.5, px, py)));
    k.R(ax + 24, ab - 50, 2, 4, ORO[1]); k.R(ax + 30, ab - 50, 2, 4, ORO[1]); k.R(ax + 2, ab - 2, 6, 4, "#2a1a10"); k.R(ax + 48, ab - 2, 6, 4, "#2a1a10");
    k.crudo(ax + 28, ab - 70, 1, 30, "#0a0a0e"); [[ax - 6, ab - 60], [ax + 62, ab - 40], [ax - 4, ab - 20], [ax + 64, ab - 76]].forEach(([x, y], i) => trazo(k, [[x, y], [x + (i % 2 ? 4 : -4), y - 2], [x, y - 4]], "#f4efe6", 1));
    k.R(54, 112, 26, 14, "#5a3a24"); k.R(58, 108, 18, 4, "#2a2a30"); trazo(k, [[66, 108], [70, 96]], ORO[2], 1); rellena(k, [[68, 98], [84, 82], [92, 90], [72, 100]], (x, y) => rampa(ORO, 0.2 + ((x - 68) / 24) * 0.5, x, y));
    const silla = (x, b, c) => { T.rect(k, x, b - 28, 3, 28, () => c); T.rect(k, x + 14, b - 14, 3, 14, () => c); T.rect(k, x, b - 15, 17, 3, () => mezcla(c, "#ffffff", 0.2)); T.rect(k, x + 1, b - 26, 2, 11, () => mezcla(c, "#000000", 0.2)); k.R(x + 1, b - 4, 2, 4, c); };
    silla(22, 146, "#6a4a2a"); silla(232, 150, "#5a3a3a"); silla(276, 144, "#4a5a3a");
  }
  MAG[37] = ["La clase del boggart", "La sala de profesores, con el armario viejo que se mueve", boggart, { cielo: "propio", fuerza: 0.3, ventanal: "#7fb0d8" }];

  function prueba(k) {
    k.banda(CIELO, 0, 80);
    nubarron(k, 40, 14, 100, 14, ["#e8ecf0", "#ccd4dc", "#aab4c0"]); nubarron(k, 220, 20, 90, 12, ["#e8ecf0", "#ccd4dc", "#aab4c0"]);
    rellena(k, [[0, 40], [W, 40], [W, 98], [0, 98]], (x, y) => { const fila = Math.floor((y - 40) / 6), v = (y - 40) % 6, d = Math.floor((x + fila * 2) / 3); if (v === 0) return "#5a4030"; if (v < 3) return (x + fila * 2) % 3 === 1 ? ["#f0c8a8", "#d8a880", "#a87850", "#f4dcc0"][Math.floor(hash(d, fila, 1170) * 4)] : "#6a5040"; return mezcla(["#c8302a", "#2a4a8a", "#e8c040", "#2a7a4a", "#e8e4dc", "#6a3a8a", "#2a2a30", "#c8a070"][Math.floor(hash(d, fila, 1171) * 8)], "#7a7060", 0.3 + (fila % 2) * 0.1); });
    for (let x = 0; x < W; x += 40) { k.R(x, 22, 1, 18, "#5a4030"); Det.bandera(k, x + 1, 22, 9, 6, ["#c8302a", "#2a4a8a", "#e8c040", "#2a7a4a"][(x / 40) % 4]); }
    k.R(0, 98, W, 4, "#5a4030");
    T.rect(k, 0, 102, W, 78, (x, y) => rampa(["#b8a888", "#a09070", "#887a5c", "#706448", "#5a5038"], 0.15 + ((y - 102) / 78) * 0.4 + (fbm(x * 0.06, y * 0.1, 1172) - 0.5) * 0.4, x, y));
    [[30, 140, 40, 22], [270, 132, 44, 26], [210, 168, 30, 14], [70, 176, 34, 12]].forEach(([x, b, w, h]) => k.roca(x, b, w, h, "#8a8478", "#a8a294", "#625c56"));
    bola(k, 112, 150, 26, 7, (x, y) => (Math.floor(x + y) % 3 ? "#7a6a4a" : "#5a4a34")); [[100, 146], [110, 144], [122, 146]].forEach(([x, y]) => bola(k, x, y, 4, 5, () => "#c8c0b0")); bola(k, 116, 146, 4, 5, () => ORO[1]); k.crudo(114, 143, 2, 2, ORO[0]);
    dragon(k, 200, 150, 1.1, ["#5a5a5a", "#46464a", "#36363a", "#26262a", "#18181c"], { ala: 0.7, mira: -1, llama: [70, -40], s: 1173 });
    luces(k, [{ x: 150, y: 70, r: 80, ry: 60, col: "#ffb050", f: 0.5 }]);
  }
  MAG[38] = ["La primera prueba", "El cercado de rocas con el Cuernacola, que guarda el huevo de oro", prueba, { tinte: 0.15, fuego: ["#fff4c0", "#ffcf6a", "#ff9a3a", "#e8502a", "#ffd23f"] }];

  function baile(k) {
    T.rect(k, 0, 0, W, 50, () => "#2a3670");
    for (let i = 0; i < 40; i++) k.crudo(hash(i, 1, 1181) * W, hash(i, 2, 1181) * 46, 1, 1, "#e8ecff");
    T.rect(k, 0, 40, W, 74, (x, y) => rampa(["#c8d8ec", "#acc0dc", "#94acd0", "#7c98c4", "#6884b4"], 0.15 + ((y - 40) / 74) * 0.5 + (fbm(x * 0.1, y * 0.1, 1182) - 0.5) * 0.35, x, y));
    for (let x = 0; x < W; x += 5) { const l = 4 + hash(x, 1, 1183) * 10; rellena(k, [[x, 40], [x + 4, 40], [x + 2, 40 + l]], () => "#f4f8ff"); }
    for (let i = 0; i < 6; i++) { const x0 = i * 56 - 8; trazo(k, bezier([x0, 54], [x0 + 18, 66], [x0 + 38, 66], [x0 + 56, 54], 20), ORO[1], 2); bola(k, x0 + 56, 54, 2, 2, () => ORO[0]); }
    [[24, 112], [296, 112]].forEach(([x, b]) => { for (let j = 0; j < 6; j++) { const t = j / 6, y = b - 4 - 60 * t, w = (1 - t) * 22 + 2; rellena(k, [[x - w, y], [x + w, y], [x, y - 18]], (px, py) => rampa(["#4a7a5a", "#3a6a4a", "#2a5a3a", "#1e4a2e"], 0.1 + ((px - x + w) / (2 * w)) * 0.6, px, py)); bola(k, x, y - 3, w * 0.8, 1.5, () => "#ffffff"); } for (let i = 0; i < 16; i++) k.crudo(x - 18 + hash(i, x, 1184) * 36, b - 60 + hash(i, 2, 1184) * 56, 1, 1, ["#ffd27a", "#e8402a", "#9ad8ff", "#f2c84b"][i % 4]); k.crudo(x - 2, b - 70, 4, 4, ORO[0]); });
    [[96, 108], [224, 108]].forEach(([x, b]) => { k.alfa(0.7, () => { rellena(k, [[x - 8, b], [x - 6, b - 24], [x, b - 34], [x + 6, b - 24], [x + 8, b]], (px, py) => rampa(["#e8f8ff", "#c8e8f8", "#a8d0e8"], (px - x + 8) / 16, px, py)); bola(k, x, b - 36, 5, 5, () => "#e8f8ff"); }); });
    T.rect(k, 128, 80, 64, 30, (x, y) => rampa(["#3a3a48", "#2e2e3a", "#22222c"], (y - 80) / 30, x, y)); k.R(126, 108, 68, 4, "#5a5a6a"); [[140, 98], [160, 96], [180, 98]].forEach(([x, y]) => { k.R(x - 2, y, 4, 10, "#5a5a6a"); k.crudo(x - 4, y - 6, 8, 6, "#9a5ac8"); });
    suelo3d(k, 112, 180, 160, 70, (X, z, x, y) => rampa(["#d0e0f0", "#b0c8e4", "#94b0d8", "#7c98c8", "#6884b8"], 0.25 + (Math.floor(X / 20 + 100) % 2 === Math.floor(z * 4) % 2 ? 0.25 : 0) + (hash(x, y, 1185) > 0.97 ? -0.4 : 0), x, y));
    const L = [];
    [[30, 150, 0.9], [290, 152, 0.9], [62, 128, 0.6], [258, 128, 0.6], [6, 172, 1.2], [314, 174, 1.2]].forEach(([x, b, e]) => { sombraE(k, x, b, 16 * e, 3 * e, 0.3); bola(k, x, b - 10 * e, 16 * e, 4 * e, () => "#f4f8ff"); T.rect(k, x - 16 * e, b - 10 * e, 32 * e, 6 * e, () => "#dce8f4"); k.R(x - 1, b - 18 * e, 3, 6 * e, "#c8d8f0"); k.crudo(x - 1, b - 22 * e, 3, 4 * e, "#ffd27a"); L.push({ x, y: b - 20 * e, r: 20 * e, col: "#ffcf7a", f: 0.7 }); });
    P.nieve(k, 120, 1186, { y1: 140 });
    luces(k, [...L, { x: 160, y: 90, r: 60, ry: 30, col: "#c8a0ff", f: 0.4 }]);
  }
  MAG[39] = ["El Baile de Navidad", "El Gran Comedor de plata y hielo, con sus abetos y la pista de baile", baile, { cielo: "propio", fuerza: 0.1, ventanal: "#2a3670", fuego: ["#ffd27a", "#e8402a", "#9ad8ff", "#f2c84b", "#f8e090", "#9a5ac8", "#e8ecff"] }];

  function menesteres(k) {
    T.rect(k, 0, 0, W, 120, piedra(["#a89c88", "#948874", "#807462", "#6c6252", "#585042"], { tx: 14, ty: 8, s: 1191 }));
    const L = [[28, 40], [292, 40], [120, 34], [200, 34]].map(([x, y]) => T.antorcha(k, x, y, { r: 34 }));
    [[40, 104], [216, 280]].forEach(([x0, x1], j) => { T.rect(k, x0, 50, x1 - x0, 70, () => "#3a2416"); [66, 84, 102, 120].forEach((b, i) => { for (let x = x0 + 2, n = 0; x < x1 - 3; n++) { const w = 2 + Math.floor(hash(n, b, 1192 + j) * 2), h = 8 + Math.floor(hash(n, 2, 1192 + b) * 6); k.R(x, b - h, w, h, ["#a82a30", "#2a5a9a", "#3a8a4a", "#c89a3a", "#6a3a8a", "#8a5a32"][Math.floor(hash(n, 3, b) * 6)]); x += w; } k.R(x0, b, x1 - x0, 2, "#6a4a2a"); }); });
    T.rect(k, 132, 44, 56, 60, (x, y) => rampa(["#f4ecd0", "#e8dcbc", "#d8c8a4"], 0.2 + (fbm(x * 0.1, y * 0.1, 1193) - 0.5) * 0.4, x, y)); k.R(130, 42, 60, 3, "#8a5a32"); k.R(130, 103, 60, 3, "#8a5a32");
    rotulo(k, 136, 48, "EJERCITO", "#3a2a1a"); rotulo(k, 136, 55, "DOMBLUDERE", "#3a2a1a"); for (let i = 0; i < 6; i++) for (let j = 0; j < 2; j++) { const x = 136 + j * 26; for (let c = 0; c < 18; c += 3) if (hash(i, c + j, 1194) > 0.3) k.R(x + c, 64 + i * 6, 2, 1, "#5a3a2a"); }
    T.rect(k, 16, 70, 16, 24, () => ORO[2]); T.rect(k, 18, 72, 12, 20, (x, y) => rampa(["#5a6a7a", "#4a5a6a", "#3a4a5a"], (y - 72) / 20, x, y)); k.alfa(0.5, () => { bola(k, 22, 80, 2, 3, () => "#1a1a22"); bola(k, 27, 84, 2, 3, () => "#1a1a22"); });
    k.R(290, 100, 20, 3, "#6a4a2a"); k.R(298, 103, 3, 16, "#6a4a2a"); bola(k, 300, 92, 6, 7, (x, y) => rampa(["#e8f0f8", "#c8d8e8", "#a8bcd0"], (x - 294) / 12, x, y)); k.R(299, 84, 2, 2, ORO[1]);
    suelo3d(k, 120, 180, 160, 70, losas3d(["#a89c88", "#948874", "#807462", "#6c6252", "#585042"], { tx: 24, tz: 16, s: 1195 }));
    [[60, 140, "#a82a30"], [96, 156, "#2a5a9a"], [140, 166, "#c89a3a"], [190, 150, "#3a8a4a"], [236, 162, "#6a3a8a"], [276, 146, "#a82a30"], [118, 136, "#3a8a4a"], [214, 132, "#c89a3a"]].forEach(([x, y, c]) => { sombraE(k, x, y + 2, 9, 2, 0.3); bola(k, x, y - 2, 9, 4, (px, py) => rampa([mezcla(c, "#ffffff", 0.3), c, mezcla(c, "#000000", 0.3)], (py - y + 6) / 8, px, py)); k.P(x, y - 2, mezcla(c, "#000000", 0.4)); });
    [[44, 136], [276, 130]].forEach(([x, b]) => { sombraE(k, x, b, 7, 2, 0.4); k.R(x - 1, b - 30, 3, 30, "#8a6a48"); bola(k, x, b - 32, 5, 6, () => "#d8c8a8"); T.rect(k, x - 7, b - 26, 14, 14, () => "#c8b898"); trazo(k, [[x - 7, b - 22], [x - 12, b - 16]], "#c8b898", 2); trazo(k, [[x + 7, b - 22], [x + 12, b - 28]], "#c8b898", 2); k.R(x - 2, b - 21, 4, 4, "#a82a30"); });
    luces(k, L);
  }
  MAG[40] = ["La Sala de los Menesteres", "La sala del ED, con sus cojines, sus libros y sus muñecos de práctica", menesteres, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#ff9a3a", "#fff4c0", "#ffd27a"] }];

  function atrio(k) {
    const FX = 160, FY = 78;
    rellena(k, [[0, 0], [W, 0], [214, 46], [106, 46]], (x, y) => rampa(["#2a6a8a", "#22587a", "#1a4a6a", "#143c5a"], 0.2 + (y / 46) * 0.5, x, y));
    for (let i = 0; i < 26; i++) { const x = 20 + hash(i, 1, 1201) * 280, y = 4 + hash(i, 2, 1201) * 36; if (y > 46 * Math.min(x / 106, (W - x) / 106, 1)) continue; k.crudo(x, y, 3, 1, ORO[0]); k.crudo(x + 1, y - 1, 1, 3, ORO[0]); }
    const muro = (x, y, v) => rampa(["#4a3020", "#3c2618", "#2e1c12", "#22140c"], v + (Math.floor(x / 3) % 2 ? 0.05 : 0), x, y);
    rellena(k, [[0, 0], [106, 46], [106, 100], [0, 168]], (x, y) => muro(x, y, 0.2 + (x / 106) * 0.3)); rellena(k, [[W, 0], [214, 46], [214, 100], [W, 168]], (x, y) => muro(x, y, 0.3 + ((W - x) / 106) * 0.2)); T.rect(k, 106, 46, 108, 54, (x, y) => muro(x, y, 0.4));
    const L = [];
    [0.12, 0.34, 0.54, 0.72].forEach((t) => [1, -1].forEach((lado) => { const q = (u, v) => { const tx = t + u * 0.09, wx = 106 * tx, top = 46 * tx, bot = 168 - 68 * tx; return [lado > 0 ? wx : W - wx, top + (bot - top) * v]; }; rellena(k, [q(-0.1, 0.3), q(1.1, 0.3), q(1.1, 0.4), q(-0.1, 0.4)], () => "#6a4a2a"); rellena(k, [q(0, 0.4), q(1, 0.4), q(1, 1), q(0, 1)], () => "#1a1410"); rellena(k, [q(0.12, 0.5), q(0.88, 0.5), q(0.88, 1), q(0.12, 1)], (x, y) => rampa(["#c8ff8a", "#7ae85a", "#3ac83a", "#1a8a2a"], 0.2 + hash(Math.floor(x), Math.floor(y), 1202) * 0.5, x, y)); const [cx, cy] = q(0.5, 0.85); L.push({ x: cx, y: cy, r: 22 * (1 - t * 0.6), col: "#7ae85a", f: 0.7 }); }));
    suelo3d(k, 100, 180, FX, FY, tablones(["#5a3a24", "#4a2e1c", "#3c2416", "#2e1a10", "#22120a"], { pw: 12, L: 60, s: 1203 }));
    bola(k, 160, 138, 54, 12, (x, y) => rampa(["#e8e4dc", "#c8c4bc", "#a8a49c"], 0.2 + ((y - 126) / 24) * 0.5, x, y)); bola(k, 160, 136, 48, 9, (x, y) => rampa(["#5a9ac8", "#4a8ab8", "#3a7aa8"], 0.2 + (Math.sin(x * 0.5 + y) > 0.6 ? -0.2 : 0), x, y));
    const oro = (x0, w) => (px, py) => rampa(ORO, 0.1 + ((px - x0) / w) * 0.6, px, py);
    const figura = (x, b, h, sombrero) => { rellena(k, [[x - h * 0.2, b], [x - h * 0.1, b - h * 0.62], [x + h * 0.1, b - h * 0.62], [x + h * 0.2, b]], oro(x - h * 0.2, h * 0.4)); bola(k, x, b - h * 0.7, h * 0.08, h * 0.09, oro(x - h * 0.08, h * 0.16)); if (sombrero) rellena(k, [[x - h * 0.12, b - h * 0.76], [x + h * 0.02, b - h * 0.98], [x + h * 0.12, b - h * 0.76]], oro(x - h * 0.12, h * 0.24)); trazo(k, [[x + h * 0.08, b - h * 0.55], [x + h * 0.18, b - h * 0.8], [x + h * 0.2, b - h * 0.95]], ORO[1], 2, 1); };
    figura(146, 132, 52, false); figura(164, 132, 46, true);
    bola(k, 188, 124, 12, 6, oro(176, 24)); [[180, 1], [184, 1], [194, 1], [198, 1]].forEach(([x]) => k.R(x, 126, 2, 8, ORO[2])); rellena(k, [[182, 122], [184, 102], [190, 102], [192, 122]], oro(182, 10)); bola(k, 187, 98, 4, 4, oro(183, 8)); trazo(k, [[198, 124], [204, 130]], ORO[3], 2, 1);
    [[128, 134, 20], [136, 134, 16]].forEach(([x, b, h]) => { rellena(k, [[x - 4, b], [x - 3, b - h * 0.6], [x + 3, b - h * 0.6], [x + 4, b]], oro(x - 4, 8)); bola(k, x, b - h * 0.72, 3.5, 3.5, oro(x - 4, 8)); k.poli([[x - 3, b - h * 0.74], [x - 8, b - h * 0.9], [x - 2, b - h * 0.68]], ORO[2]); k.poli([[x + 3, b - h * 0.74], [x + 8, b - h * 0.9], [x + 2, b - h * 0.68]], ORO[2]); });
    trazo(k, [[163, 94], [160, 80]], ORO[1], 1); trazo(k, [[183, 89], [190, 78]], ORO[1], 1);
    k.alfa(0.5, () => { [[160, 80], [190, 78]].forEach(([x, y]) => { for (let i = 0; i < 12; i++) k.P(x + Math.sin(i) * (i / 3), y + i * 4, "#c8e8ff"); }); });
    luces(k, [...L, { x: 160, y: 110, r: 70, ry: 40, col: "#f8e090", f: 0.35 }]);
  }
  MAG[41] = ["El atrio del Ministerio", "El vestíbulo de madera oscura, las chimeneas verdes y la fuente dorada", atrio, { cielo: "propio", fuerza: 0.1, fuego: ["#c8ff8a", "#7ae85a", "#3ac83a", "#1a8a2a", "#f8e090", "#e8c050"] }];

  function dean(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 104);
    for (let fila = 0; fila < 3; fila++) for (let i = 0; i < 9; i++) { const x = i * 38 + fila * 13 + hash(i, fila, 1211) * 10, w = 4 + fila * 3, c = ["#4a4a54", "#3a3a44", "#2a2a32"][fila]; k.R(x, 0, w, 120 + fila * 12, c); k.R(x, 0, 1, 120 + fila * 12, mezcla(c, "#ffffff", 0.3)); for (let j = 0; j < 3; j++) { const y = 20 + j * 28 + hash(i, j, 1212) * 10; trazo(k, [[x + w, y], [x + w + 10, y - 6]], c, 2, 1); k.R(x + w + 2, y - 4, 6, 1, "#ffffff"); } }
    T.rect(k, 0, 120, W, 60, (x, y) => rampa(["#ffffff", "#f2f6fb", "#e2eaf3", "#cfdbe9"], 0.15 + ((y - 120) / 60) * 0.3 + (fbm(x * 0.06, y * 0.15, 1213) - 0.5) * 0.4, x, y));
    bola(k, 180, 150, 46, 11, (x, y) => rampa(["#c8e0f0", "#a8c8e0", "#88b0d0", "#6a98c0"], 0.2 + (Math.abs(Math.sin(x * 0.2 - y * 0.4)) < 0.1 ? -0.3 : 0) + ((y - 139) / 22) * 0.4, x, y));
    trazo(k, [[164, 154], [194, 148]], "#c8c8d0", 2); k.R(160, 152, 5, 4, "#c89a3a"); k.crudo(168, 152, 1, 1, "#e8402a");
    for (let i = 0; i < 6; i++) trazo(k, [[150 + i * 10, 142 + (i % 2) * 6], [156 + i * 10, 146 + (i % 3) * 4]], "#ffffff", 1);
    const cx = 90, cb = 152, e = 1.6, D = (v) => v * e;
    k.halo(cx, cb - D(20), D(40), D(34), "#d8f0ff", 0.55);
    bola(k, cx, cb - D(18), D(14), D(7), (x, y) => (y < cb - D(21) ? "#f4fcff" : "#e8f8ff")); trazo(k, [[cx + D(10), cb - D(22)], [cx + D(16), cb - D(36)]], "#e8f8ff", D(4), D(3)); bola(k, cx + D(18), cb - D(38), D(4), D(3), () => "#f4fcff");
    rellena(k, [[cx + D(20), cb - D(39)], [cx + D(27), cb - D(36)], [cx + D(21), cb - D(34)]], () => "#e8f8ff"); rellena(k, [[cx + D(14), cb - D(41)], [cx + D(15), cb - D(47)], [cx + D(18), cb - D(41)]], () => "#e8f8ff"); rellena(k, [[cx + D(18), cb - D(41)], [cx + D(20), cb - D(46)], [cx + D(21), cb - D(40)]], () => "#d8f0ff");
    [[-10, 0], [-6, 1], [6, 1], [10, 0]].forEach(([d]) => k.R(cx + D(d), cb - D(14), D(2), D(14), "#d8f0ff")); rellena(k, [[cx - D(14), cb - D(20)], [cx - D(18), cb - D(24)], [cx - D(14), cb - D(16)]], () => "#e8f8ff");
    k.crudo(cx + D(18), cb - D(39), 2, 2, "#1a2a4a");
    P.nieve(k, 120, 1214);
    luces(k, [{ x: cx, y: cb - 20, r: 70, ry: 40, col: "#d8f0ff", f: 0.8 }]);
  }
  MAG[42] = ["El bosque de Dean", "El bosque nevado de noche, la cierva de plata y la poza helada con la espada", dean, { tinte: 0.25, fuego: ["#ffffff", "#f4fcff", "#e8f8ff", "#d8f0ff", "#1a2a4a"] }];

  function andenDespues(k) {
    const FX = 196, FY = 74;
    T.rect(k, 0, 0, W, 90, () => "#7fb0d8");
    for (let i = 0; i < 9; i++) { const t = i / 9, x0 = FX - (FX + 40) * (1 - t), x1 = FX + (W - FX + 40) * (1 - t), y = FY - 80 * (1 - t); trazo(k, bezier([x0, y + 40 * (1 - t)], [x0 + 20, y], [x1 - 20, y], [x1, y + 40 * (1 - t)], 20), "#4a4a54", 2, 1); }
    for (let x = -20; x < W + 20; x += 40) trazo(k, [[x, 0], [FX + (x - FX) * 0.1, FY]], "#4a4a54", 1);
    rellena(k, [[W, 0], [228, 50], [228, 104], [W, 150]], ladrillo(["#c88a6a", "#b0745a", "#965e48", "#7a4a38"], { w: 7, h: 3, s: 1221 }));
    rellena(k, [[300, 70], [270, 76], [270, 128], [300, 140]], () => "#3a2a22"); k.R(256, 54, 40, 10, "#2a2a36"); rotulo(k, 260, 57, "8 1/2", "#f4efe6");
    k.elipse(246, 40, 7, 7, "#3a3a44"); k.elipse(246, 40, 5, 5, "#f4f0e6"); trazo(k, [[246, 40], [246, 36]], "#2a2a30"); trazo(k, [[246, 40], [249, 41]], "#2a2a30");
    rellena(k, [[0, 60], [FX - 30, FY + 2], [FX - 30, FY + 14], [0, 150]], (x, y) => rampa(["#e8504a", "#c8302a", "#a8241e", "#801a16"], 0.2 + (x / 166) * 0.3 + (Math.floor((x / 166) * 10) % 2 && y % 6 === 0 ? 0.15 : 0), x, y));
    for (let i = 0; i < 14; i++) { const t = i / 14, x = t * (FX - 36), y0 = 60 + (FY + 2 - 60) * (x / (FX - 30)), y1 = 150 + (FY + 14 - 150) * (x / (FX - 30)), h = (y1 - y0) * 0.3, w = Math.max(1, 10 * (1 - t)); k.R(x + 2, y0 + (y1 - y0) * 0.2, w, h, "#ffe6a8"); }
    k.R(0, 104, FX - 30, 1, "#e8c050");
    pluma(k, FX - 34, FY + 2, 50, 20, ["#f4f6f8", "#e2e6ea", "#c8ced4", "#aab2ba"], { s: 1222, viento: 0.3 });
    suelo3d(k, FY + 14, 180, FX, FY, losas3d(["#c8c4bc", "#b4b0a8", "#9c9890", "#84807a", "#6a6662"], { tx: 18, tz: 12, s: 1223 }), { dentro: (x, y) => y > 150 - 62 * Math.max(0, Math.min(1, x / 166)) && (x < 228 || y > 104 + (x - 228) * 0.5) });
    [[110, 156, 1], [222, 140, 0.7], [174, 128, 0.5]].forEach(([x, b, e]) => { sombraE(k, x + 9 * e, b, 12 * e, 2 * e, 0.4); T.rect(k, x, b - 14 * e, 18 * e, 10 * e, madera(["#8a5a32", "#6e4626", "#54321a", "#3a2210", "#261608"], { paso: 3, largo: 99, s: 1224 })); T.rect(k, x + 3 * e, b - 22 * e, 9 * e, 8 * e, () => "#d8d0c0"); for (let px = x + 3 * e; px < x + 12 * e; px += 2) k.R(px, b - 22 * e, 1, 8 * e, "#5a4a3a"); k.R(x - 2 * e, b - 4 * e, 22 * e, 2, "#5a5a64"); });
    bruma(k, 140, 180, "#f4f6f8", 0.45, { s: 1225 });
  }
  MAG[43] = ["El andén, diecinueve años después", "El andén 8½ una mañana de septiembre, con el expreso listo para salir", andenDespues, { cielo: "propio", fuerza: 0.5, ventanal: "#7fb0d8", fuego: ["#ffe6a8"] }];

  function prefectos(k) {
    T.rect(k, 0, 0, W, 118, (x, y) => rampa(MAR, 0.12 + (y / 118) * 0.3 + (Math.abs(Math.sin(x * 0.05 + y * 0.02 + fbm(x * 0.02, y * 0.02, 1231) * 4)) < 0.04 ? 0.35 : 0), x, y));
    bola(k, 160, 30, 30, 22, (x, y) => (y > 30 ? null : ORO[2])); T.rect(k, 130, 30, 60, 50, () => ORO[2]);
    bola(k, 160, 30, 27, 19, (x, y) => (y > 30 ? null : rampa(["#9ad8f0", "#6ab8e0", "#4a98c8"], (y - 11) / 40, x, y))); T.rect(k, 133, 30, 54, 47, (x, y) => rampa(["#6ab8e0", "#4a98c8", "#3a7ab0"], (y - 30) / 47, x, y));
    rellena(k, [[150, 70], [148, 50], [156, 36], [164, 40], [166, 56], [176, 66], [166, 74]], (x, y) => (y < 54 ? "#f0c8a8" : rampa(["#3fb8a0", "#2a9a88", "#1e7a6c"], (x - 148) / 28, x, y))); bola(k, 158, 36, 5, 5, () => "#f0c8a8"); rellena(k, [[152, 32], [164, 32], [168, 52], [150, 50]], (x, y) => (Math.floor(y / 3) % 2 ? "#e8c040" : "#c89a3a"));
    for (let x = 133; x < 187; x += 9) k.R(x, 30, 1, 47, ORO[3]);
    const L = [[40, 40], [280, 40]].map(([x, y]) => { k.R(x - 1, y, 3, 70, ORO[2]); k.R(x - 10, y, 20, 2, ORO[1]); for (let i = -2; i <= 2; i++) { k.R(x + i * 4, y - 6, 2, 6, "#f4efe6"); k.crudo(x + i * 4, y - 9, 2, 3, "#ffcf6a"); } return { x, y: y - 6, r: 40, ry: 30, col: "#ffcf7a", f: 0.7 }; });
    suelo3d(k, 116, 180, 160, 70, losas3d(MAR, { tx: 28, tz: 18, s: 1232 }));
    rellena(k, [[40, 124], [280, 124], [300, 172], [20, 172]], () => "#d8d4cc");
    rellena(k, [[46, 128], [274, 128], [292, 168], [28, 168]], (x, y) => rampa(["#9ad8f0", "#7ac0e8", "#5aa8d8", "#3a90c8"], 0.2 + ((y - 128) / 40) * 0.5 + (Math.sin(x * 0.3 + y * 0.8) > 0.8 ? -0.2 : 0), x, y));
    [[90, 140, "#f4a8c4"], [150, 150, "#c8f0ff"], [216, 138, "#f8e8a0"], [250, 156, "#c8a8f4"], [60, 158, "#a8f0c8"]].forEach(([x, y, c], i) => { for (let j = 0; j < 9; j++) bola(k, x + Math.cos(j) * 12, y + Math.sin(j * 1.7) * 4, 4 + (j % 3), 3, () => (j % 2 ? c : mezcla(c, "#ffffff", 0.5))); });
    for (let i = 0; i < 30; i++) { const x = 40 + hash(i, 1, 1233) * 240, y = 20 + hash(i, 2, 1233) * 100; k.elipse(x, y, 1.5, 1.5, "#e8f4ff"); k.crudo(x - 1, y - 1, 1, 1, "#ffffff"); }
    for (let x = 48; x < 276; x += 12) { k.R(x, 118, 2, 6, ORO[1]); k.R(x - 1, 117, 4, 2, ORO[2]); k.crudo(x, 116, 2, 1, ["#e8402a", "#3a6ac8", "#3a9a5a", "#c87ae8"][(x / 12) % 4]); }
    bola(k, 252, 120, 6, 7, (x, y) => rampa(ORO, 0.1 + ((x - 246) / 12) * 0.6, x, y)); trazo(k, [[246, 120], [258, 120]], ORO[4], 1); k.crudo(249, 116, 2, 2, ORO[0]);
    luces(k, [...L, { x: 160, y: 60, r: 50, ry: 40, col: "#9ad8f0", f: 0.35 }]);
  }
  MAG[44] = ["El baño de los prefectos", "La bañera como una piscina, los grifos de oro, la sirena del vitral y el huevo de oro", prefectos, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#f4efe6", "#e8f4ff", "#ffffff", "#f8e090", "#e8402a", "#3a6ac8", "#3a9a5a", "#c87ae8"] }];

  function dragones(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 110);
    for (let i = 0; i < 30; i++) { const x = i * 11 - 4 + hash(i, 1, 1241) * 6, y = 92 + hash(i, 2, 1241) * 12; copa(k, x, y, 10, 18, ["#2c4a34", "#223e2a", "#183220", "#102618", "#081a10"], { r: 4, s: 1242 + i }); }
    T.rect(k, 0, 104, W, 76, (x, y) => rampa(["#7a6a4a", "#685a3e", "#564a32", "#443a26"], 0.15 + ((y - 104) / 76) * 0.4 + (fbm(x * 0.08, y * 0.1, 1243) - 0.5) * 0.4, x, y));
    dragon(k, 64, 120, 0.55, ["#6aa86a", "#4e8a52", "#3a6c3e", "#2a522e", "#1c3a20"], { ala: 0.3, mira: 1, s: 1244 });
    dragon(k, 262, 118, 0.5, ["#e8604a", "#c8402a", "#a02a20", "#781e18", "#501410"], { ala: 0.4, mira: -1, s: 1245 });
    dragon(k, 186, 160, 1, ["#5a5a5a", "#46464a", "#36363a", "#26262a", "#18181c"], { ala: 0.8, mira: -1, llama: [40, -70], s: 1246 });
    for (let x = 0; x < W; x += 16) { k.R(x, 130, 3, 24, "#5a4030"); } trazo(k, [[0, 136], [W, 134]], "#8a8a96", 1); trazo(k, [[0, 144], [W, 142]], "#8a8a96", 1);
    [[18, 166, 26, "#c8b890"], [292, 170, 28, "#b8a880"]].forEach(([x, b, w, c]) => { rellena(k, [[x - w / 2, b], [x, b - w * 0.8], [x + w / 2, b]], (px, py) => rampa([mezcla(c, "#ffffff", 0.2), c, mezcla(c, "#000000", 0.3)], 0.15 + ((px - x + w / 2) / w) * 0.6, px, py)); k.poli([[x - 3, b], [x, b - w * 0.4], [x + 3, b]], "#ffcf6a"); });
    const L = [[40, 130], [110, 128], [240, 128], [300, 130]].map(([x, y]) => T.antorcha(k, x, y, { r: 30 }));
    luces(k, [...L, { x: 150, y: 60, r: 120, ry: 90, col: "#ffb050", f: 0.9 }, { x: 186, y: 120, r: 70, ry: 50, col: "#ff9a3a", f: 0.7 }]);
  }
  MAG[45] = ["Los dragones de noche", "El claro del bosque donde Higrad enseña los dragones, con su fuego en la noche", dragones, { tinte: 0.2, fuego: ["#fff4c0", "#ffcf6a", "#ff9a3a", "#e8502a", "#ffd23f"] }];
})();

(function () {
  const { rampa, rellena, esfera } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, sombraE, luces, encendido, bezier } = Det6;
  const T = window.P15, E = window.E19;
  const W = 320, H = 180;
  window.SitiosIt20 = window.SitiosIt20 || {};
  const OP = (window.SitiosIt20.piratas = window.SitiosIt20.piratas || {});
  const MAG = (window.SitiosIt20.magos = window.SitiosIt20.magos || {});

  const MOMENTOS = [(k) => E.v7(k, { estado: "dormido" }), (k) => E.v2(k, { pacifistas: true }), (k) => E.v6(k, { satelites: true }), (k) => E.v2(k, { gorosei: true }), (k) => E.v7(k, { estado: "despierto" })];
  OP[31] = (n) => ["Eggbrain", "La isla del futuro, con el laboratorio en forma de huevo", (k) => MOMENTOS[n - 1](k), { tinte: 0.15, ven: ["#7ae8ff", "#e0fcff", "#3ac0e8", "#5ae8c8"], fuego: ["#3ac0e8", "#7ae8ff", "#e0fcff", "#e8402a", "#ffe08a", "#ffffff", "#5ae8c8", "#f49cbc", "#ff6a3a", "#ff4a3a", "#ffb04a", "#fff0b0", "#a04ad8"], dx: 0 }];

  const MAD = ["#a87444", "#8e5e36", "#764c2a", "#5e3c20", "#462c16"], MARCO = "#3a2616", CREMA = ["#f6ecd6", "#ecdcbc", "#dcc8a0", "#c4ac80"], LATON = ["#f4d880", "#d8b450", "#a8842e"];
  function campo(k, x0, y0, w, h, s) {
    T.rect(k, x0, y0, w, h, () => "#7fb0d8");
    rellena(k, [[x0, y0 + h * 0.6], [x0 + w * 0.25, y0 + h * 0.42], [x0 + w * 0.55, y0 + h * 0.5], [x0 + w * 0.8, y0 + h * 0.36], [x0 + w, y0 + h * 0.46], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(["#8aaa76", "#749664", "#5e8252"], 0.2 + ((y - y0 - h * 0.36) / (h * 0.64)) * 0.6, x, y));
    rellena(k, [[x0, y0 + h * 0.78], [x0 + w * 0.4, y0 + h * 0.7], [x0 + w * 0.7, y0 + h * 0.76], [x0 + w, y0 + h * 0.68], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(["#5e9050", "#4c7e42", "#3e6c36"], 0.2 + (hash(x, y, s) - 0.5) * 0.3, x, y));
    for (let i = 0; i < Math.round(w / 12); i++) { const x = x0 + 4 + i * 12 + hash(i, 1, s) * 4, y = y0 + h * 0.72 - (i % 3) * 2; k.R(x, y - 4, 1, 4, "#3a2a1a"); bola(k, x, y - 6, 2.5, 2.5, () => "#3c6a34"); }
    k.alfa(0.25, () => { for (let y = y0 + 4; y < y0 + h; y += 8) trazo(k, [[x0, y + 6], [x0 + w * 0.4, y]], "#ffffff", 1); });
  }
  const aplique = (k, x, y, L) => { k.R(x - 1, y, 3, 5, LATON[2]); k.elipse(x, y - 2, 5, 4, "#fff4d8"); k.elipse(x, y - 1, 4, 2, "#f8e0a8"); k.R(x - 4, y - 2, 9, 1, LATON[1]); L.push({ x, y: y - 2, r: 22, ry: 16, col: "#ffe2a0", f: 0.5 }); };
  const reloj = (k, x, y) => { k.elipse(x, y, 5, 5, LATON[2]); k.elipse(x, y, 4, 4, "#f8f4ea"); trazo(k, [[x, y], [x, y - 3]], "#26262a"); trazo(k, [[x, y], [x + 2, y]], "#26262a"); };
  const cuadro = (k, x, y, w, h) => { k.R(x, y, w, h, LATON[2]); k.R(x + 1, y + 1, w - 2, h - 2, "#c8d4c0"); rellena(k, [[x + 1, y + h - 2], [x + w * 0.4, y + h * 0.5], [x + w - 1, y + h - 3], [x + w - 1, y + h - 1], [x + 1, y + h - 1]], () => "#7a9a6a"); };
  const cuadros = (base, s) => (x, y) => { const lx = (x % 6 === 0), ly = (y % 6 === 0); return rampa(base, 0.15 + (lx ? 0.3 : 0) + (ly ? 0.25 : 0) + (lx && ly ? 0.2 : 0) + (fbm(x * 0.2, y * 0.2, s) - 0.5) * 0.12, x, y); };
  const AZULT = ["#9aaab8", "#8494a4", "#6e7e90", "#5a6a7c", "#46566a"], VERDET = ["#5a7a6a", "#4a6a5a", "#3c5a4c", "#2e4a3e", "#223a30"];

  function frente(k) {
    const L = [];
    T.rect(k, 0, 0, W, 134, madera(MAD, { paso: 4, vertical: true, largo: 99, s: 3501 }));
    rellena(k, [[-2, -2], [322, -2], [322, 10], [240, 15], [160, 17], [80, 15], [-2, 10]], (x, y) => rampa(CREMA, 0.1 + y / 22, x, y));
    T.rect(k, 92, 22, 136, 90, () => MARCO); campo(k, 96, 26, 128, 82, 3502);
    T.rect(k, 96, 44, 128, 3, () => MARCO); [128, 160, 192].forEach((x) => k.R(x - 1, 26, 3, 18, MARCO)); k.R(92, 110, 136, 4, "#5a3a22"); k.R(92, 110, 136, 1, "#8a6040");
    T.rect(k, 92, 114, 136, 20, madera(["#7a5030", "#664226", "#54361e", "#422a16", "#321e0e"], { paso: 3, largo: 34, s: 3503 }));
    [[1], [-1]].forEach(([d]) => {
      const X = (v) => (d > 0 ? v : W - v);
      rellena(k, [[X(0), 32], [X(84), 50], [X(84), 128], [X(0), 142]], cuadros(AZULT, 3504 + d));
      trazo(k, [[X(84), 50], [X(84), 128]], AZULT[4], 2); trazo(k, [[X(0), 32], [X(84), 50]], AZULT[0], 1);
      for (let i = 1; i < 4; i++) trazo(k, [[X(i * 21), 36 + i * 4.5], [X(i * 21), 138 - i * 3]], AZULT[3], 1);
      rellena(k, [[X(0), 142], [X(84), 128], [X(96), 134], [X(0), 160]], cuadros(AZULT, 3506 + d)); trazo(k, [[X(0), 160], [X(96), 134]], AZULT[0], 1);
      rellena(k, [[X(0), 160], [X(96), 134], [X(96), 142], [X(0), 172]], (x, y) => rampa(MAD, 0.3 + (y - 134) / 40, x, y));
      cuadro(k, d > 0 ? 10 : W - 34, 38, 24, 14); reloj(k, d > 0 ? 78 : W - 78, 34); aplique(k, d > 0 ? 50 : W - 50, 30, L);
      k.R(d > 0 ? 0 : W - 80, 13, 80, 2, LATON[1]); k.R(d > 0 ? 0 : W - 80, 17, 80, 1, LATON[2]);
    });
    [[8, 26], [40, 30], [262, 24]].forEach(([x, w], i) => { T.rect(k, x, 0, w, 12, (px, py) => rampa(["#8a4a2a", "#743e22", "#5e321a"], py / 12, px, py)); k.R(x + w / 2 - 2, 4, 4, 3, LATON[1]); });
    T.rect(k, 292, 0, 14, 12, () => LATON[1]); for (let x = 293; x < 306; x += 3) k.R(x, 0, 1, 12, LATON[2]); bola(k, 299, 8, 4, 3, () => "#f4f4f8"); k.P(298, 7, "#2a2a30");
    rellena(k, [[96, 134], [224, 134], [322, 182], [-2, 182]], (x, y) => { const f = (y - 134) / 46, u = (x - 160) / (64 + f * 100); return rampa(["#8a5a3a", "#744a2e", "#5e3c24", "#4a2e1a"], 0.2 + f * 0.4 + (Math.round(u * 8) % 2 ? 0.08 : 0), x, y); });
    luces(k, L);
  }
  function puerta(k) {
    const L = [];
    rellena(k, [[-2, -2], [322, -2], [322, 134], [-2, 134]], (x, y) => rampa(CREMA, 0.1 + (y / 134) * 0.3, x, y));
    T.rect(k, 0, 96, W, 38, madera(MAD, { paso: 4, vertical: true, largo: 99, s: 3511 })); k.R(0, 94, W, 3, "#5a3a22");
    T.rect(k, 26, 14, 82, 124, () => MARCO); T.rect(k, 30, 18, 74, 120, (x, y) => rampa(CREMA, 0.3 + (y / 120) * 0.3, x, y)); campo(k, 34, 24, 66, 46, 3512); T.rect(k, 34, 44, 66, 2, () => MARCO); k.R(66, 24, 2, 46, MARCO); k.R(30, 72, 74, 3, "#5a3a22");
    const cx = 52, cb = 136; T.rect(k, cx, cb - 30, 40, 26, madera(MAD, { paso: 3, largo: 99, s: 3513 })); k.R(cx - 2, cb - 32, 44, 3, LATON[1]);
    for (let j = 0; j < 3; j++) for (let i = 0; i < 6; i++) { const c = ["#7a4a8a", "#e8402a", "#3f8ac0", "#f2c84b", "#3fb85a", "#e86aa8"][(i + j * 2) % 6], x = cx + 2 + i * 6, y = cb - 40 - j * 6; k.R(x, y, 5, 5, c); k.P(x + 1, y + 1, mezcla(c, "#ffffff", 0.5)); }
    [[cx + 4, cb - 2], [cx + 36, cb - 2]].forEach(([x, y]) => { k.elipse(x, y, 3, 3, "#2a2a30"); k.elipse(x, y, 1, 1, "#8a8a96"); });
    T.rect(k, 112, 18, 64, 116, () => MARCO); T.rect(k, 116, 22, 56, 108, (x, y) => rampa(["#b8c8c8", "#a0b4b4", "#8aa0a0"], 0.2 + (y - 22) / 140, x, y)); k.alfa(0.35, () => { trazo(k, [[120, 40], [140, 26]], "#ffffff", 3); trazo(k, [[124, 64], [156, 40]], "#ffffff", 2); }); k.R(170, 70, 3, 14, LATON[1]);
    cuadro(k, 206, 30, 34, 22); k.R(258, 24, 30, 30, LATON[2]); k.R(260, 26, 26, 26, "#c8d8e0"); k.alfa(0.4, () => trazo(k, [[262, 46], [276, 28]], "#ffffff", 2));
    [[196, 34], [300, 32]].forEach(([x, y]) => { k.R(x - 1, y, 3, 6, LATON[2]); k.elipse(x, y - 3, 5, 5, "#ffffff"); k.elipse(x - 1, y - 4, 2, 2, "#fffaf0"); L.push({ x, y: y - 3, r: 24, ry: 18, col: "#fff0c8", f: 0.5 }); });
    k.R(184, 12, 136, 2, LATON[1]); k.R(184, 16, 136, 1, LATON[2]); T.rect(k, 230, 0, 40, 12, (px, py) => rampa(["#8a4a2a", "#743e22", "#5e321a"], py / 12, px, py)); k.R(248, 4, 4, 3, LATON[1]);
    rellena(k, [[184, 60], [322, 56], [322, 136], [184, 128]], cuadros(VERDET, 3514)); trazo(k, [[184, 60], [184, 128]], VERDET[4], 2); for (let i = 1; i < 6; i++) trazo(k, [[184 + i * 24, 59.5 - i * 0.5], [184 + i * 24, 129 + i * 1.3]], VERDET[3], 1);
    rellena(k, [[176, 128], [322, 136], [322, 158], [168, 146]], cuadros(VERDET, 3515)); trazo(k, [[168, 146], [322, 158]], VERDET[0], 1); rellena(k, [[168, 146], [322, 158], [322, 170], [168, 156]], (x, y) => rampa(MAD, 0.3 + (y - 146) / 30, x, y));
    [[200, 132, "#7a4a8a"], [214, 134, "#e8402a"], [232, 136, "#3f8ac0"], [250, 137, "#f2c84b"], [270, 138, "#3fb85a"], [222, 130, "#e86aa8"]].forEach(([x, y, c], i) => { if (i % 2) { k.R(x - 4, y - 3, 8, 5, c); k.R(x - 4, y - 3, 8, 1, mezcla(c, "#ffffff", 0.5)); } else { rellena(k, [[x - 3, y], [x, y - 6], [x + 3, y]], () => c); k.P(x, y - 4, "#ffffff"); } });
    rellena(k, [[-2, 120], [30, 128], [30, 182], [-2, 182]], cuadros(AZULT, 3516));
    rellena(k, [[-2, 138], [322, 138], [322, 182], [-2, 182]], (x, y) => { const f = (y - 138) / 44; return rampa(["#8a5a3a", "#744a2e", "#5e3c24", "#4a2e1a"], 0.2 + f * 0.4 + (Math.floor((x - 160) / (14 + f * 20)) % 2 ? 0.08 : 0), x, y); });
    rellena(k, [[-2, 120], [30, 128], [30, 182], [-2, 182]], cuadros(AZULT, 3517));
    luces(k, L);
  }
  const EXPRESO = [frente, puerta];
  MAG[35] = (n) => ["El Expreso por dentro", "El compartimento, la ventana al campo y el carrito de los dulces", (k) => EXPRESO[n - 1](k), { cielo: "propio", fuerza: 0.45, ventanal: "#7fb0d8", ven: ["#fff4d8", "#ffffff"] }];
})();

(function () {
  const { rampa, rellena, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, luces, bruma, sombraE } = Det6;
  const T = window.P15, P14 = window.OP14P;
  const W = 320, H = 180;
  window.SitiosIt21 = window.SitiosIt21 || {};
  const MAG = (window.SitiosIt21.magos = window.SitiosIt21.magos || {});

  const VX = 160, VY = 92, K = 320 / 136 - 1, HN = (118 * 320) / 136, OJO = (134 - VY) / 118;
  const esc = (t) => 1 / (1 + t * K);
  const P = (X, Y, t) => { const s = esc(t); return [VX + X * 160 * s, VY + (OJO - Y) * HN * s]; };
  const tDe = (s) => (1 / s - 1) / K;
  const enPared = (X, x, y) => { const s = (x - VX) / (X * 160); return { s, t: tDe(s), Y: OJO - (y - VY) / (HN * s) }; };
  const enPlano = (Y, x, y) => { const s = (y - VY) / ((OJO - Y) * HN); return { s, t: tDe(s), X: (x - VX) / (160 * s) }; };
  const dentro = (fn) => (x, y) => (x < 0 || x >= W || y < 0 || y >= H ? null : fn(x, y));
  const lado = (pts) => pts.map(([X, Y, t]) => P(X, Y, t));
  const muestra = (fn, t0, t1, n = 30) => Array.from({ length: n + 1 }, (_, i) => fn(t0 + ((t1 - t0) * i) / n));
  const entre = (a, b, v) => Math.max(a, Math.min(b, v));

  const MAD = ["#a87444", "#8e5e36", "#764c2a", "#5e3c20", "#462c16"], MARCO = "#3a2616", CREMA = ["#f6ecd6", "#ecdcbc", "#dcc8a0", "#c4ac80"], LATON = ["#f4d880", "#d8b450", "#a8842e"];
  const TELA = ["#a8b6c4", "#909eb0", "#7a8a9c", "#647488", "#4e5c72", "#3c475c"], BASE = ["#6e4628", "#5a3820", "#482c18", "#382212", "#28180c"], SUELO = ["#8a5a3a", "#744a2e", "#5e3c24", "#4a2e1a", "#3a2414"];

  const B = { respaldo: 0.95, pliegue: 0.9, borde: 0.585, base: 0.6, asiento: 0.183, cojin: 0.13, alto: 0.5, desde: -0.2, plaza: 0.4, cerca: -0.5 };
  const plazaDe = (t) => { const q = (t - B.desde) / B.plaza; return { i: Math.floor(q), g: q - Math.floor(q) }; };
  const arriba = (t) => B.alto + 0.032 * Math.sin(Math.PI * plazaDe(t).g);
  function cuadros(u, v, nu, nv) {
    const fu = u - Math.floor(u), fv = v - Math.floor(v);
    const su = fu < 0.32 ? nu : 0, sv = fv < 0.32 ? nv : 0;
    const hilo = Math.max(Math.abs(fu - 0.66) < 0.07 ? nu : 0, Math.abs(fv - 0.66) < 0.07 ? nv : 0);
    return (su + sv) * 0.13 + su * sv * 0.09 - hilo * 0.09;
  }
  const nitidez = (px) => entre(0, 1, (px - 2.6) / 2.4);

  const respaldo = (d) => dentro((x, y) => {
    const { s, t, Y } = enPared(d * 0.92, x, y);
    if (!(s > 0)) return null;
    const { g } = plazaDe(t), alto = (Y - B.asiento) / (arriba(t) - B.asiento);
    let f = 0.4 - Math.sin(Math.PI * g) * 0.12 - t * 0.05;
    if (alto < 0.14) f += (0.14 - alto) * 2.2;
    if (alto > 0.8) f -= (alto - 0.8) * 0.7;
    if (g < 0.06 || g > 0.94) f += 0.1;
    f += cuadros((t - B.desde) / 0.055, Y / 0.04, nitidez(0.055 * 0.92 * 160 * K * s * s), nitidez(0.04 * HN * s));
    return rampa(TELA, f, x, y);
  });
  const asiento = (d) => dentro((x, y) => {
    const { s, t, X } = enPlano(B.asiento, x, y);
    if (!(s > 0)) return null;
    const { g } = plazaDe(t), ax = (Math.abs(X) - B.borde) / (B.pliegue - B.borde);
    let f = 0.18 - Math.sin(Math.PI * g) * 0.1 - t * 0.04;
    if (ax > 0.7) f += (ax - 0.7) * 1.1;
    if (ax < 0.12) f -= (0.12 - ax) * 0.8;
    if (g < 0.05 || g > 0.95) f += 0.12;
    f += cuadros((t - B.desde) / 0.055, Math.abs(X) / 0.04, nitidez(0.055 * (OJO - B.asiento) * HN * K * s * s), nitidez(0.04 * 160 * s));
    return rampa(TELA, f, x, y);
  });
  const frenteCojin = (d) => dentro((x, y) => {
    const { s, t, Y } = enPared(d * B.borde, x, y);
    if (!(s > 0)) return null;
    const { g } = plazaDe(t), fy = (B.asiento - Y) / (B.asiento - B.cojin);
    let f = 0.5 + fy * 0.2 - Math.sin(Math.PI * g) * 0.06;
    if (fy < 0.2) f -= 0.25;
    f += cuadros((t - B.desde) / 0.055, Y / 0.04, nitidez(0.055 * B.borde * 160 * K * s * s), nitidez(0.04 * HN * s));
    return rampa(TELA, f, x, y);
  });
  const base = (d) => dentro((x, y) => {
    const { s, t, Y } = enPared(d * B.base, x, y);
    if (!(s > 0)) return null;
    const fy = (B.cojin - Y) / B.cojin, tb = (t + 1) / 0.1, i = Math.floor(tb), px = 0.1 * B.base * 160 * K * s * s;
    let f = 0.45 + (hash(i, 3, 3611) - 0.5) * 0.12 - fy * 0.1;
    if (fy < 0.25) f += (0.25 - fy) * 1.6;
    if (px > 3 && (tb - i) * px < 1) f += 0.25;
    return rampa(BASE, f, x, y);
  });
  const pared = (d) => dentro((x, y) => {
    const { s, t, Y } = enPared(d, x, y);
    if (!(s > 0)) return null;
    const tb = (t + 1) / 0.06, i = Math.floor(tb), px = 0.06 * 160 * K * s * s;
    let f = 0.3 + (hash(i, 5, 3621) - 0.5) * 0.16 + (fbm(i * 2.3, Y * 40, 3622) - 0.5) * 0.12 - t * 0.04;
    if (px > 2.5 && (tb - i) * px < 1) f += 0.3;
    return rampa(MAD, f, x, y);
  });
  const suelo = () => dentro((x, y) => {
    const { s, t, X } = enPlano(0, x, y);
    if (!(s > 0)) return null;
    const xb = (X + 1) / 0.12, i = Math.floor(xb), tj = (t + hash(i, 4, 3632)) / 0.3;
    let f = 0.25 + (hash(i, 9, 3631) - 0.5) * 0.12 + (1 - t) * 0.08;
    if ((xb - i) * 0.12 * 160 * s < 1) f += 0.22;
    if ((tj - Math.floor(tj)) * 0.3 * OJO * HN * K * s * s < 1) f += 0.15;
    if (Math.abs(X) > 0.48) f += (Math.abs(X) - 0.48) * 1.6;
    f -= Math.max(0, t - 0.6) * 0.25;
    return rampa(SUELO, f, x, y);
  });

  function caja(k, X0, X1, Y0, Y1, t0, t1, C) {
    const Xi = Math.abs(X0) < Math.abs(X1) ? X0 : X1, Yv = OJO > Y1 ? Y1 : OJO < Y0 ? Y0 : null;
    if (Yv !== null) rellena(k, lado([[X0, Yv, t0], [X1, Yv, t0], [X1, Yv, t1], [X0, Yv, t1]]), dentro((x, y) => rampa(C, Yv === Y1 ? 0.12 : 0.78, x, y)));
    rellena(k, lado([[Xi, Y0, t0], [Xi, Y1, t0], [Xi, Y1, t1], [Xi, Y0, t1]]), dentro((x, y) => rampa(C, 0.45, x, y)));
    rellena(k, lado([[X0, Y0, t0], [X1, Y0, t0], [X1, Y1, t0], [X0, Y1, t0]]), dentro((x, y) => rampa(C, 0.22, x, y)));
  }
  function maleta(k, X0, X1, Y0, Y1, t0, t1, C, baul) {
    caja(k, X0, X1, Y0, Y1, t0, t1, C);
    const Xi = Math.abs(X0) < Math.abs(X1) ? X0 : X1, [ax, ay] = P(X0, Y0, t0), [bx, by] = P(X1, Y1, t0);
    const xa = Math.min(ax, bx), xb = Math.max(ax, bx), ya = Math.min(ay, by), yb = Math.max(ay, by);
    [0.28, 0.72].forEach((f) => { const t = t0 + (t1 - t0) * f; trazo(k, [P(Xi, Y0, t), P(Xi, Y1, t)], baul ? LATON[2] : C[4], 1); });
    k.R(Math.round((xa + xb) / 2) - 1, Math.round(ya) + 2, 2, 2, LATON[1]);
    if (baul) [[xa, ya], [xb - 2, ya], [xa, yb - 2], [xb - 2, yb - 2]].forEach(([x, y]) => k.R(x, y, 2, 2, LATON[1]));
    else k.R(xa, yb - 1, xb - xa, 1, C[4]);
  }
  function jaula(k, X0, X1, Y0, Y1, t0, t1) {
    const Xi = Math.abs(X0) < Math.abs(X1) ? X0 : X1, [ax, ay] = P(X0, Y0, t0), [bx, by] = P(X1, Y1, t0);
    const xa = Math.round(Math.min(ax, bx)), xb = Math.round(Math.max(ax, bx)), ya = Math.round(Math.min(ay, by)), yb = Math.round(Math.max(ay, by));
    rellena(k, lado([[Xi, Y0, t0], [Xi, Y1, t0], [Xi, Y1, t1], [Xi, Y0, t1]]), dentro((x, y) => rampa(["#4a3a2a", "#3a2c20", "#2c2018"], 0.4 + hash(x, y, 3661) * 0.3, x, y)));
    k.R(xa, ya, xb - xa, yb - ya, "#3a2c20");
    const w = xb - xa, cx = Math.round((xa + xb) / 2), cy = Math.round(ya + (yb - ya) * 0.56), ry = Math.round(w * 0.34);
    bola(k, cx, cy, Math.round(w * 0.26), ry, (x, y) => rampa(["#fafafc", "#eeeef4", "#dcdee6", "#c4c8d4"], 0.12 + (y - cy) / (ry * 3) + (hash(x, y, 3662) < 0.1 ? 0.35 : 0), x, y));
    const cab = cy - ry + 1, rc = Math.max(2, Math.round(w * 0.2));
    bola(k, cx, cab, rc, Math.max(2, Math.round(rc * 0.85)), () => "#f8f8fc");
    k.P(cx - Math.round(rc * 0.45), cab, "#e8a020"); k.P(cx + Math.round(rc * 0.45), cab, "#e8a020"); k.P(cx, cab + 1, "#4a4a52");
    k.R(cx - 2, yb - 3, 2, 1, "#4a4a52"); k.R(cx + 1, yb - 3, 2, 1, "#4a4a52");
    for (let x = xa; x <= xb; x += 4) k.R(x, ya, 1, yb - ya, LATON[1]);
    for (let i = 0; i <= 4; i++) trazo(k, [P(Xi, Y0, t0 + ((t1 - t0) * i) / 4), P(Xi, Y1, t0 + ((t1 - t0) * i) / 4)], LATON[2], 1);
    trazo(k, [P(Xi, Y1, t0), P(Xi, Y1, t1)], LATON[2], 1);
    k.R(xa - 1, yb - 1, xb - xa + 3, 2, LATON[2]); k.R(xa, ya, xb - xa + 1, 1, LATON[1]);
    trazo(k, bezierQ([xa, ya], [(xa + xb) / 2, ya - w * 0.5], [xb, ya], 14), LATON[1], 1);
    trazo(k, bezierQ([xa + w * 0.3, ya], [(xa + xb) / 2, ya - w * 0.42], [xb - w * 0.3, ya], 8), LATON[2], 1);
    k.R(cx - 1, Math.round(ya - w * 0.25) - 3, 3, 3, LATON[2]); k.P(cx, Math.round(ya - w * 0.25) - 2, "#2a1c12");
  }
  const bezierQ = (a, c, b, n) => Array.from({ length: n + 1 }, (_, i) => { const u = i / n, v = 1 - u; return [v * v * a[0] + 2 * u * v * c[0] + u * u * b[0], v * v * a[1] + 2 * u * v * c[1] + u * u * b[1]]; });
  function portaequipajes(k, d) {
    const fin = 0.75;
    if (d < 0) {
      maleta(k, -0.98, -0.85, 0.82, 0.885, 0.44, 0.6, ["#b4723f", "#9a5e34", "#7e4a28", "#62381e", "#482812"], false);
      maleta(k, -0.97, -0.86, 0.82, 0.875, 0.62, 0.74, ["#d4a46a", "#bc8e56", "#9e7444", "#7e5a34", "#5e4226"], false);
    } else maleta(k, 0.85, 0.98, 0.82, 0.905, 0.5, 0.73, ["#8a4030", "#723428", "#5c2a20", "#462018", "#321610"], true);
    k.alfa(0.5, () => rellena(k, lado([[d, 0.82, 0.3], [d * 0.83, 0.82, 0.3], [d * 0.83, 0.82, fin], [d, 0.82, fin]]), dentro(() => "#2a1c12")));
    for (let i = 0; i <= 9; i++) { const t = 0.3 + ((fin - 0.3) * i) / 9; trazo(k, [P(d, 0.82, t), P(d * 0.83, 0.82, t)], "#4a3624", 1); }
    trazo(k, muestra((t) => P(d, 0.82, t), 0.3, fin), LATON[2], 1);
    trazo(k, muestra((t) => P(d * 0.83, 0.82, t), 0.3, fin), LATON[1], 2);
    trazo(k, [P(d, 0.78, fin), P(d * 0.83, 0.82, fin)], LATON[2], 1);
  }
  function cuadroPared(k, d, t0, t1, Y0, Y1, s) {
    const X = d * 0.995, mt = (t1 - t0) * 0.09, mY = (Y1 - Y0) * 0.13;
    rellena(k, lado([[X, Y0, t0], [X, Y1, t0], [X, Y1, t1], [X, Y0, t1]]), dentro((x, y) => rampa(LATON, 0.55 + hash(x, y, 3671) * 0.3, x, y)));
    rellena(k, lado([[X, Y0 + mY, t0 + mt], [X, Y1 - mY, t0 + mt], [X, Y1 - mY, t1 - mt], [X, Y0 + mY, t1 - mt]]), dentro((x, y) => {
      const q = enPared(X, x, y), u = (q.t - t0) / (t1 - t0), v = (q.Y - Y0) / (Y1 - Y0), loma = 0.45 + Math.sin(u * 5 + s) * 0.1;
      return v < loma ? rampa(["#8aa070", "#6e8a5a", "#56704a"], 0.3 + (loma - v) * 1.4, x, y) : rampa(["#e4ead8", "#c8d4c0", "#aab8a8"], 0.2 + (1 - v) * 0.5, x, y);
    }));
  }
  function aplique(k, d, t, Y, L) {
    const [wx, wy] = P(d, Y, t), [gx, gy] = P(d * 0.935, Y, t);
    k.R(Math.round(wx) - (d < 0 ? 0 : 1), Math.round(wy) - 1, 2, 5, LATON[2]);
    trazo(k, [[wx, wy + 2], [gx, gy + 3]], LATON[2], 1);
    k.elipse(gx, gy, 3.5, 3.5, "#fff4d8"); k.elipse(gx - 1, gy - 1, 1.6, 1.6, "#ffffff"); k.R(gx - 2, gy + 3, 4, 1, LATON[1]);
    L.push({ x: gx, y: gy, r: 28, ry: 22, col: "#ffe2a0", f: 0.5 });
  }
  const reloj = (k, x, y) => { k.elipse(x, y, 5, 5, LATON[2]); k.elipse(x, y, 4, 4, "#f8f4ea"); trazo(k, [[x, y], [x, y - 3]], "#26262a"); trazo(k, [[x, y], [x + 2, y]], "#26262a"); };
  function campo(k, x0, y0, w, h, s) {
    T.rect(k, x0, y0, w, h, () => "#7fb0d8");
    rellena(k, [[x0, y0 + h * 0.6], [x0 + w * 0.25, y0 + h * 0.42], [x0 + w * 0.55, y0 + h * 0.5], [x0 + w * 0.8, y0 + h * 0.36], [x0 + w, y0 + h * 0.46], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(["#8aaa76", "#749664", "#5e8252"], 0.2 + ((y - y0 - h * 0.36) / (h * 0.64)) * 0.6, x, y));
    rellena(k, [[x0, y0 + h * 0.78], [x0 + w * 0.4, y0 + h * 0.7], [x0 + w * 0.7, y0 + h * 0.76], [x0 + w, y0 + h * 0.68], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(["#5e9050", "#4c7e42", "#3e6c36"], 0.2 + (hash(x, y, s) - 0.5) * 0.3, x, y));
    for (let i = 0; i < Math.round(w / 12); i++) { const x = x0 + 4 + i * 12 + hash(i, 1, s) * 4, y = y0 + h * 0.72 - (i % 3) * 2; k.R(x, y - 4, 1, 4, "#3a2a1a"); bola(k, x, y - 6, 2.5, 2.5, () => "#3c6a34"); }
    k.alfa(0.25, () => { for (let y = y0 + 4; y < y0 + h; y += 8) trazo(k, [[x0, y + 6], [x0 + w * 0.4, y]], "#ffffff", 1); });
  }

  function banco(k, d) {
    const ts = muestra((t) => t, B.cerca, 1, 80), c = B.cerca;
    rellena(k, lado([[d * B.base, B.cojin, c], [d * B.base, B.cojin, 1], [d * B.base, 0, 1], [d * B.base, 0, c]]), base(d));
    rellena(k, lado([[d * B.borde, B.asiento, c], [d * B.borde, B.asiento, 1], [d * B.borde, B.cojin, 1], [d * B.borde, B.cojin, c]]), frenteCojin(d));
    rellena(k, lado([[d * B.pliegue, B.asiento, c], [d * B.pliegue, B.asiento, 1], [d * B.borde, B.asiento, 1], [d * B.borde, B.asiento, c]]), asiento(d));
    rellena(k, [...ts.map((t) => P(d * B.respaldo, arriba(t), t)), ...[...ts].reverse().map((t) => P(d * B.pliegue, B.asiento, t))], respaldo(d));
    for (let i = 0; i < 3; i++) {
      const t = B.desde + i * B.plaza;
      trazo(k, [P(d * B.pliegue, B.asiento, t), P(d * B.respaldo, arriba(t), t)], TELA[5], 1);
      trazo(k, [P(d * B.pliegue, B.asiento + 0.01, t + 0.014), P(d * B.respaldo, arriba(t + 0.014) - 0.012, t + 0.014)], TELA[1], 1);
      trazo(k, [P(d * B.pliegue, B.asiento, t), P(d * B.borde, B.asiento, t)], TELA[4], 1);
      trazo(k, [P(d * B.borde, B.asiento, t), P(d * B.borde, B.cojin, t)], TELA[5], 1);
    }
    trazo(k, ts.map((t) => P(d * B.borde, B.asiento, t)), TELA[0], 1);
    trazo(k, ts.map((t) => P(d * B.respaldo, arriba(t) - 0.014, t)), TELA[1], 1);
    trazo(k, ts.map((t) => P(d * 0.915, 0.36, t)), TELA[4], 1);
    caja(k, d * B.pliegue, d * B.borde, B.asiento, 0.255, 0.93, 1, TELA);
  }

  function frente(k) {
    const L = [];
    rellena(k, lado([[-1, 1, 1], [1, 1, 1], [1, 1, -0.3], [-1, 1, -0.3]]), dentro((x, y) => rampa(CREMA, 0.1 + (Math.max(0, 16 - y) / 16) * 0.16, x, y)));
    { const [ax, ay] = P(-1, 1, 0.86), [bx] = P(1, 1, 0.86); k.R(Math.round(ax), Math.round(ay), Math.round(bx - ax), 1, CREMA[3]); }
    T.rect(k, 92, 16, 136, 118, madera(MAD, { paso: 4, vertical: true, largo: 99, s: 3701 }));
    T.rect(k, 92, 100, 136, 34, madera(["#7a5030", "#664226", "#54361e", "#422a16", "#321e0e"], { paso: 3, largo: 34, s: 3702 }));
    T.rect(k, 106, 22, 108, 78, () => MARCO); campo(k, 110, 26, 100, 70, 3703);
    T.rect(k, 110, 42, 100, 3, () => MARCO); [135, 160, 185].forEach((x) => k.R(x - 1, 26, 3, 16, MARCO));
    k.R(104, 96, 112, 4, "#5a3a22"); k.R(104, 96, 112, 1, "#8a6040");
    reloj(k, 100, 34); reloj(k, 220, 34);
    [-1, 1].forEach((d) => {
      rellena(k, lado([[d, 1, 1], [d, 1, -0.3], [d, 0, -0.3], [d, 0, 1]]), pared(d));
      trazo(k, muestra((t) => P(d, 0.56, t), -0.3, 1), LATON[2], 1);
      cuadroPared(k, d, 0.34, 0.6, 0.6, 0.73, d > 0 ? 2 : 0);
      aplique(k, d, 0.86, 0.68, L);
      portaequipajes(k, d);
    });
    rellena(k, lado([[-B.base, 0, 1], [B.base, 0, 1], [B.base, 0, -0.3], [-B.base, 0, -0.3]]), suelo());
    banco(k, -1); banco(k, 1);
    caja(k, -0.79, -0.66, B.asiento, 0.212, 0.3, 0.41, ["#9a3a2e", "#7e2e24", "#64241c", "#4a1a14", "#341210"]);
    trazo(k, [P(-0.66, 0.2, 0.3), P(-0.66, 0.2, 0.41)], "#e8dcc0", 1);
    k.alfa(0.35, () => rellena(k, lado([[0.6, B.asiento, 0.28], [0.84, B.asiento, 0.28], [0.84, B.asiento, 0.48], [0.6, B.asiento, 0.48]]), dentro(() => "#26303e")));
    jaula(k, 0.62, 0.8, B.asiento, 0.385, 0.3, 0.46);
    luces(k, L);
  }

  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const NIEVE = ["#eef3fa", "#dde6f1", "#c8d4e6", "#aebcd4", "#8e9ebc"], HIELO = ["#d8ecf6", "#bcd8ec", "#9cc0e0", "#7ea6d0", "#6088b8"], PLATA = ["#f4fcff", "#e8f8ff", "#d8f0ff"];
  function tronco(k, x, b, w, c, cl, s, ramas, luzDcha) {
    T.rect(k, x, 0, w, b, (px, py) => (hash(px, Math.floor(py / 3), s) < 0.2 ? mezcla(c, "#000000", 0.25) : c));
    k.R(luzDcha ? x + w - 1 : x, 0, 1, b, cl);
    for (let j = 0; j < ramas; j++) {
      const y = 8 + j * (b / (ramas + 1)) + hash(j, 1, s) * 12, dir = hash(j, 2, s) < 0.5 ? -1 : 1, L = w * 2.2 + 6 + hash(j, 3, s) * 10;
      const x0 = dir > 0 ? x + w - 1 : x, x1 = x0 + dir * L, y1 = y - L * 0.55;
      trazo(k, [[x0, y], [x1, y1]], c, Math.max(1, Math.round(w * 0.3)), 1);
      trazo(k, [[x0 + dir, y - 2], [x1, y1 - 1.5]], "#e2eaf4", 1);
    }
    k.elipse(x + w / 2, b, w * 0.9 + 1, 2, NIEVE[1]);
  }
  function deanRehecho(k) {
    k.banda(CIELO, 0, 118);
    for (let i = 0; i < 17; i++) { const x = i * 20 + hash(i, 1, 4201) * 12 - 4, w = hash(i, 2, 4201) < 0.5 ? 3 : 2; k.R(x, 0, w, 114, "#5a6680"); k.R(x, 0, 1, 114, "#6c7894"); }
    bruma(k, 56, 120, "#c4d0e2", 0.4, { s: 4202 });
    T.rect(k, 0, 114, W, 66, (x, y) => rampa(NIEVE, 0.16 + ((y - 114) / 66) * 0.22 + (fbm(x * 0.05, y * 0.2, 4220) - 0.5) * 0.3 + (Math.sin(x * 0.04 + y * 0.3) > 0.92 ? -0.12 : 0), x, y));
    for (let i = 0; i < 8; i++) { const x = 6 + i * 41 + hash(i, 3, 4203) * 16, w = 4 + Math.floor(hash(i, 4, 4203) * 3); tronco(k, x, 120, w, "#323a4e", "#56627e", 4204 + i, 3, x < 104); }
    const qx = 214, qy = 152, bajo = (c) => mezcla(c, HIELO[2], 0.2);
    bola(k, qx, qy + 2, 57, 15, () => NIEVE[3]);
    bola(k, qx, qy, 53, 13, (x, y) => rampa(HIELO, 0.22 + ((y - qy + 13) / 26) * 0.45 + (Math.abs(Math.sin(x * 0.09 + y * 0.45)) < 0.05 ? -0.25 : 0), x, y));
    trazo(k, [[198, 156], [240, 146]], bajo("#f4f8fc"), 2); trazo(k, [[199, 157.5], [240, 147.5]], bajo("#5a6a80"), 1); k.crudo(239, 146, 2, 1, "#f4fcff");
    trazo(k, [[195, 150], [199, 161]], bajo("#f0c850"), 2); trazo(k, [[189, 158.5], [196, 156.5]], bajo("#6a4a2a"), 2);
    k.R(187, 158, 3, 3, bajo("#f0c850")); k.crudo(197, 155, 1, 2, "#ff3a2a"); k.crudo(192, 157, 1, 1, "#ff3a2a");
    [[[212, 150], [186, 145]], [[212, 150], [234, 144]], [[212, 150], [220, 161]], [[212, 150], [244, 156]], [[212, 150], [202, 162]], [[186, 145], [178, 149]]].forEach((s) => trazo(k, s, "#f2f8fc", 1));
    k.alfa(0.5, () => { trazo(k, [[172, 147], [186, 143]], "#fafcfe", 1); trazo(k, [[236, 158], [252, 154]], "#fafcfe", 1); });
    for (let i = 0; i < 9; i++) { const f = i / 8, x = 46 + 116 * f, y = 177 - 22 * f + Math.sin(f * 3) * 2; k.R(Math.round(x + (i % 2 ? 2 : -2)), Math.round(y), 2, 1, NIEVE[4]); }
    const cx = 100, cb = 150, e = 1.5, D = (v) => v * e;
    [[46, 32, 0.1], [34, 24, 0.12], [24, 17, 0.16]].forEach(([rx, ry, a]) => k.alfa(a, () => k.elipse(cx + D(5), cb - D(24), D(rx), D(ry), "#d8f0ff")));
    [[-10, -1], [-6, -1], [9, 1], [12, 1]].forEach(([x0, s]) => trazo(k, [[cx + D(x0), cb - D(17)], [cx + D(x0) + (s > 0 ? D(1) : -D(1.6)), cb - D(8)], [cx + D(x0) + (s > 0 ? D(0.4) : D(0.4)), cb]], PLATA[2], D(1.5), D(1)));
    bola(k, cx, cb - D(21), D(14), D(6.5), (x, y) => (y < cb - D(23) ? PLATA[0] : PLATA[1]));
    bola(k, cx + D(10), cb - D(22), D(6), D(7), () => PLATA[1]);
    trazo(k, [[cx + D(11), cb - D(24)], [cx + D(15), cb - D(32)], [cx + D(18), cb - D(37)]], PLATA[1], D(5), D(3.2));
    bola(k, cx + D(20), cb - D(39), D(3.6), D(3), () => PLATA[0]);
    rellena(k, [[cx + D(21), cb - D(41)], [cx + D(27), cb - D(38)], [cx + D(26), cb - D(36.5)], [cx + D(21), cb - D(37)]], () => PLATA[1]);
    rellena(k, [[cx + D(17.5), cb - D(41)], [cx + D(14.5), cb - D(47)], [cx + D(19), cb - D(42)]], () => PLATA[1]);
    rellena(k, [[cx + D(19.5), cb - D(41.5)], [cx + D(19.5), cb - D(48)], [cx + D(21.5), cb - D(42)]], () => PLATA[0]);
    rellena(k, [[cx - D(13), cb - D(25)], [cx - D(17), cb - D(28)], [cx - D(14), cb - D(22)]], () => PLATA[0]);
    k.crudo(cx + D(21), cb - D(40), 1, 1, "#1a2a4a"); k.crudo(cx + D(26.4), cb - D(37.6), 1, 1, "#1a2a4a");
    for (let i = 0; i < 16; i++) k.crudo(cx - D(18) + hash(i, 1, 4230) * D(50), cb - D(50) + hash(i, 2, 4230) * D(48), 1, 1, i % 3 ? "#e8f8ff" : "#f4fcff");
    [[-6, 17, 3], [36, 9, 2], [280, 10, 2], [302, 18, 3]].forEach(([x, w, r], i) => tronco(k, x, 182, w, "#1c202c", "#2e3448", 4210 + i, r, x < 104));
    P14.nieve(k, 140, 4240);
    luces(k, [{ x: cx + D(5), y: cb - D(18), r: 96, ry: 52, col: "#d8f0ff", f: 0.85 }, { x: qx, y: qy, r: 60, ry: 16, col: "#d8f0ff", f: 0.3 }]);
  }

  const AX = 180, AY = 82, AF = 200, AOJO = 1.6, NIEBLA = "#dfe4e4";
  const A = (X, Y, z) => [AX + (X * AF) / z, AY + ((AOJO - Y) * AF) / z];
  const ROJOE = ["#dc4a3c", "#c4342a", "#a42820", "#841e18", "#621410"], ORO2 = "#e0b048";
  const lejos = (col, z) => mezcla(col, NIEBLA, Math.min(0.85, z / 110));
  function cajaA(k, X0, X1, Y0, Y1, z0, z1, C) {
    const q = (pts) => pts.map(([X, Y, z]) => A(X, Y, z));
    if (Y1 < AOJO) rellena(k, q([[X0, Y1, z0], [X1, Y1, z0], [X1, Y1, z1], [X0, Y1, z1]]), dentro((x, y) => rampa(C, 0.12, x, y)));
    if (X0 > 0) rellena(k, q([[X0, Y0, z0], [X0, Y1, z0], [X0, Y1, z1], [X0, Y0, z1]]), dentro((x, y) => rampa(C, 0.55, x, y)));
    if (X1 < 0) rellena(k, q([[X1, Y0, z0], [X1, Y1, z0], [X1, Y1, z1], [X1, Y0, z1]]), dentro((x, y) => rampa(C, 0.55, x, y)));
    rellena(k, q([[X0, Y0, z0], [X1, Y0, z0], [X1, Y1, z0], [X0, Y1, z0]]), dentro((x, y) => rampa(C, 0.3, x, y)));
  }
  function carrito(k, Xc, z, jaulaEncima, s) {
    const X0 = Xc - 0.32, X1 = Xc + 0.32, z1 = z + 1, m = AF / z, [sx, sy] = A(Xc, 0, z + 0.5);
    sombraE(k, sx, sy, 0.5 * m, Math.max(1, 0.1 * m), 0.35);
    cajaA(k, X0, X1, 0.18, 0.25, z, z1, ["#8a8a94", "#6a6a74", "#4a4a54", "#3a3a44"]);
    [X0 + 0.04, X1 - 0.04].forEach((X) => { const [wx, wy] = A(X, 0.08, z); k.elipse(wx, wy, Math.max(1, 0.08 * m), Math.max(1, 0.08 * m), "#26262c"); });
    cajaA(k, X0 + 0.02, X1 - 0.02, 0.25, 0.7, z + 0.05, z1 - 0.1, ["#9a5a32", "#804826", "#66381c", "#4c2812", "#361c0c"]);
    const [ax, ay] = A(X0 + 0.02, 0.25, z + 0.05), [bx, by] = A(X1 - 0.02, 0.7, z + 0.05);
    k.R(Math.round(ax), Math.round(by), Math.round(bx - ax), 1, ORO2); k.R(Math.round((ax + bx) / 2) - 1, Math.round(by) + 2, 2, 2, ORO2);
    [[ax, by], [bx - 2, by], [ax, ay - 2], [bx - 2, ay - 2]].forEach(([x, y]) => k.R(Math.round(x), Math.round(y), 2, 2, ORO2));
    if (jaulaEncima) {
      const [jx0, jy0] = A(Xc - 0.16, 0.7, z + 0.3), [jx1, jy1] = A(Xc + 0.16, 1.08, z + 0.3), w = jx1 - jx0, cx = (jx0 + jx1) / 2;
      k.R(Math.round(jx0), Math.round(jy1), Math.round(w), Math.round(jy0 - jy1), "#3a2c20");
      bola(k, cx, (jy0 + jy1) / 2 + 1, w * 0.28, (jy0 - jy1) * 0.34, () => (s % 2 ? "#f0f0f4" : "#a8885a"));
      k.P(Math.round(cx - w * 0.12), Math.round((jy0 + jy1) / 2 - (jy0 - jy1) * 0.15), "#e8a020"); k.P(Math.round(cx + w * 0.12), Math.round((jy0 + jy1) / 2 - (jy0 - jy1) * 0.15), "#e8a020");
      for (let x = Math.round(jx0); x <= jx1; x += 3) k.R(x, Math.round(jy1), 1, Math.round(jy0 - jy1), LATON[1]);
      trazo(k, bezierQ([jx0, jy1], [cx, jy1 - w * 0.5], [jx1, jy1], 10), LATON[1], 1);
    } else cajaA(k, X0 + 0.08, X1 - 0.12, 0.7, 0.92, z + 0.2, z1 - 0.3, ["#c8a070", "#b08a5a", "#906e44", "#70542e"]);
    const [h0x, h0y] = A(X0, 0.25, z), [h1x, h1y] = A(X0, 1.0, z), [h2x, h2y] = A(X1, 1.0, z), [h3x, h3y] = A(X1, 0.25, z);
    trazo(k, [[h0x, h0y], [h1x, h1y], [h2x, h2y], [h3x, h3y]], "#5a5a64", 1);
  }
  function andenRehecho(k) {
    T.rect(k, 0, 0, W, H, (x, y) => {
      const dx = (x + 0.5 - AX) / AF, dy = (AY - y - 0.5) / AF;
      if (dy > 0) {
        const a = dx / 9, b = dy / 8, c = (AOJO - 8) / 8, qa = a * a + b * b, qb = 2 * b * c, disc = qb * qb - 4 * qa * (c * c - 1);
        if (qa > 0 && disc >= 0) {
          const z = (-qb + Math.sqrt(disc)) / (2 * qa), Y = AOJO + dy * z;
          if (z > 0 && z < 168 && Y >= 8) { const th = Math.atan2((Y - 8) / 8, (dx * z) / 9), i = Math.floor(z / 7), j = Math.floor(th / (Math.PI / 14)); return hash(i, j, 4320) < 0.3 ? lejos("#c4d0d6", z) : "#7fb0d8"; }
        }
      }
      if (dx !== 0) {
        const z = (dx < 0 ? -9 : 9) / dx, Y = AOJO + dy * z;
        if (z > 0 && z < 168 && Y >= 0 && Y < 8) { const m = z / 7 - Math.floor(z / 7), ventana = m > 0.3 && m < 0.7 && Y > 2.4 && Y < 6.4; return lejos(ventana ? "#e8eef0" : rampa(["#a87a5e", "#94684e", "#7c5640"], 0.35 + hash(Math.floor(z * 2), Math.floor(Y * 4), 4321) * 0.3, x, y), z); }
      }
      return dy > 0 ? rampa(["#f6f8f4", "#eaeeec", "#dde4e6"], 0.2 + dy * 3, x, y) : "#cfd6d6";
    });
    for (let z = 14; z < 168; z += 7) trazo(k, muestra((th) => A(9 * Math.cos(th), 8 + 8 * Math.sin(th), z), 0, Math.PI, 48), "#3c4440", Math.max(1, Math.min(3, Math.round((0.3 * AF) / z))));
    for (let j = 1; j < 14; j++) { const th = (j * Math.PI) / 14, X = 9 * Math.cos(th), Y = 8 + 8 * Math.sin(th); trazo(k, [A(X, Y, 7), A(X, Y, 168)], "#4e5652", 1); }
    for (let X = -8; X <= 8; X += 2) trazo(k, [A(X, 0, 168), A(X, 8 + 8 * Math.sqrt(Math.max(0, 1 - (X / 9) ** 2)), 168)], "#a4acae", 1);
    T.rect(k, 0, AY + 1, W, H - AY - 1, (x, y) => {
      const z = (AOJO * AF) / (y + 0.5 - AY), X = ((x + 0.5 - AX) * z) / AF, pz = (AOJO * AF) / (z * z), px = AF / z;
      let col;
      if (X < -2.15) col = X > -2.7 ? "#2a2420" : rampa(["#6a5e54", "#544a42", "#3e3630"], 0.3 + hash(Math.floor(X * 3), Math.floor(z * 3), 4330) * 0.4, x, y);
      else if (X < -1.95) col = "#e6dfcc";
      else if (X < -1.85) col = "#e8c84a";
      else {
        const fx = X - Math.floor(X), fz = z - Math.floor(z);
        let f = 0.28 + (hash(Math.floor(X), Math.floor(z), 4331) - 0.5) * 0.18;
        if ((fx * px < 1 && px > 2.2) || (fz * pz < 1 && pz > 2.2)) f += 0.28;
        col = rampa(["#cdc8be", "#bab5ac", "#a6a198", "#8e8a82", "#76726c"], f, x, y);
      }
      return lejos(col, z);
    });
    rellena(k, [A(4.5, 6.4, 2.6), A(4.5, 6.4, 36), A(4.5, 0, 36), A(4.5, 0, 2.6)], dentro((x, y) => {
      const z = (4.5 * AF) / (x + 0.5 - AX), Y = AOJO - ((y + 0.5 - AY) * z) / AF, px = AF / z, pl = (0.48 * 4.5 * AF) / (z * z);
      if (!(z > 0)) return null;
      const u = (z - 15) / 1.6, techo = 2.3 + 0.9 * Math.sqrt(Math.max(0, 1 - u * u));
      if (Math.abs(u) < 1 && Y < techo) return lejos(rampa(["#3a2a24", "#2a1e1a", "#1e1612"], 0.3 + Y * 0.2, x, y), z);
      if (Y > 6.15) return lejos(Y > 6.3 ? "#d8d0c0" : "#a89c8a", z);
      const anillo = Math.abs(u) < 1.22 && Y > 1.8 && Y < techo + 0.32, fila = Math.floor(Y / 0.22), fy = Y / 0.22 - fila, lz = (z + (fila % 2) * 0.24) / 0.48, fz = lz - Math.floor(lz);
      if ((fy * 0.22 * px < 0.8 && 0.22 * px > 2) || (fz * pl < 0.8 && pl > 2.2)) return lejos("#cfc4b2", z);
      return lejos(rampa(["#c88a6a", "#b0745a", "#965e48", "#7a4a38"], 0.35 + (hash(Math.floor(lz), fila, 4340) - 0.5) * 0.4 + (anillo ? 0.25 : 0), x, y), z);
    }));
    rellena(k, [A(-2.5, 3.25, 2), A(-2.5, 3.25, 66), A(-2.5, 0, 66), A(-2.5, 0, 2)], dentro((x, y) => {
      const z = (-2.5 * AF) / (x + 0.5 - AX), Y = AOJO - ((y + 0.5 - AY) * z) / AF, px = AF / z, pl = (2.5 * AF) / (z * z);
      if (!(z > 0)) return null;
      const v = (z - 2) / 21, m = (v - Math.floor(v)) * 21, L = (c) => lejos(c, z);
      if (m > 20.1) return L(Y > 0.4 && Y < 3.0 ? "#24161a" : "#1a1214");
      if (Y > 3.0) return L(Y > 3.12 ? "#2a1c1a" : "#4a2a22");
      if (Y < 0.35) return L("#1e1618");
      if (Math.abs(Y - 1.32) * px < 0.6 || Math.abs(Y - 2.84) * px < 0.6) return L(ORO2);
      for (const [a, b] of [[0.4, 1.3], [18.8, 19.7]]) {
        if (m < a - 0.05 || m > b + 0.05) continue;
        if (Math.min(m - a, b - m) * pl < 0.8) return L("#5a1a14");
        if (Y > 2.0 && Y < 2.6 && m > a + 0.15 && m < b - 0.15) return z > 30 ? L("#ffe6a8") : "#ffe6a8";
        if (Math.abs(Y - 1.55) * px < 1 && m > b - 0.28 && m < b - 0.12) return L(ORO2);
        return L(rampa(ROJOE, 0.32 + (Y < 1.32 ? 0.12 : 0), x, y));
      }
      if (m > 2 && m < 18.4) {
        const w = (m - 2) % 2.05;
        if (w < 1.45 && Y > 1.5 && Y < 2.62) {
          if (Math.min(w, 1.45 - w) * pl < 0.8 || Math.min(Y - 1.5, 2.62 - Y) * px < 0.8) return L("#4a1a14");
          return Y > 1.95 ? (z > 30 ? L("#ffe6a8") : "#ffe6a8") : L("#c8925a");
        }
      }
      return L(rampa(ROJOE, 0.22 + (Y < 1.32 ? 0.14 : 0) + (Y > 2.84 ? -0.06 : 0), x, y));
    }));
    [15, 23, 33].forEach((z) => { const [lx, ly] = A(0.8, 5.2, z), r = Math.max(1.5, (0.24 * AF) / z); trazo(k, [[lx, 0], [lx, ly - r]], "#3c4440", 1); k.elipse(lx, ly, r, r * 1.25, lejos("#f0e8d0", z)); k.R(Math.round(lx - r), Math.round(ly - r * 1.25), Math.round(r * 2), 1, "#3c4440"); });
    { const [rx, ry] = A(2.6, 4.7, 17), rr = Math.max(3, (0.55 * AF) / 17); trazo(k, [[rx, 0], [rx, ry - rr]], "#3c4440", 1); k.elipse(rx, ry, rr + 1, rr + 1, "#2a2e30"); k.elipse(rx, ry, rr, rr, "#f4f0e6"); trazo(k, [[rx, ry], [rx - rr * 0.35, ry - rr * 0.5]], "#26262a", 1); trazo(k, [[rx, ry], [rx, ry - rr * 0.8]], "#26262a", 1); }
    { const [x0, y0] = A(2.7, 3.95, 13.6), [x1, y1] = A(4.45, 3.35, 13.6), [wx, wy] = A(4.5, 4.6, 13.6); trazo(k, [[x0 + 3, y0], [wx, wy]], "#3c4440", 1); trazo(k, [[x1 - 2, y0], [wx, wy]], "#3c4440", 1); k.R(Math.round(x0), Math.round(y0), Math.round(x1 - x0), Math.round(y1 - y0), "#1e1e26"); k.R(Math.round(x0) + 1, Math.round(y0) + 1, Math.round(x1 - x0) - 2, 1, "#5a5a66"); rotulo(k, Math.round(x0) + 3, Math.round(y0) + 2, "8 1/2", "#f4efe6"); }
    carrito(k, 3.0, 15, false, 1); carrito(k, -0.9, 10.5, true, 2); carrito(k, 1.6, 6, true, 1);
    [[172, 72, 5, 4], [168, 64, 8, 6], [161, 55, 12, 8], [150, 45, 17, 10], [135, 36, 23, 12], [114, 28, 29, 13], [88, 21, 35, 14], [190, 66, 9, 5], [204, 60, 13, 7]].forEach(([x, y, rx, ry]) => { k.alfa(0.3, () => k.elipse(x, y, rx, ry, "#e8ecf0")); k.alfa(0.25, () => k.elipse(x - rx * 0.2, y - ry * 0.3, rx * 0.7, ry * 0.6, "#fafcfc")); });
    bruma(k, 84, 104, "#eef2f4", 0.3, { s: 4310 }); bruma(k, 150, 180, "#f4f6f8", 0.3, { s: 4311 });
  }

  const EXPRESO = [frente];
  MAG[35] = (n) => ["El Expreso por dentro", "El compartimento, con los dos asientos frente a frente y la ventana al campo", (k) => EXPRESO[Math.min(n, EXPRESO.length) - 1](k), { cielo: "propio", fuerza: 0.45, ventanal: "#7fb0d8", ven: ["#fff4d8", "#ffffff"] }];
  MAG[42] = ["El bosque de Dean", "El bosque nevado de noche, la cierva de plata y la poza helada con la espada", deanRehecho, { tinte: 0.25, fuego: ["#ffffff", "#f4fcff", "#e8f8ff", "#d8f0ff", "#1a2a4a"] }];
  MAG[43] = ["El andén, diecinueve años después", "El andén 8½ una mañana de septiembre, con el expreso listo para salir", andenRehecho, { cielo: "propio", fuerza: 0.5, ventanal: "#7fb0d8", fuego: ["#ffe6a8"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const N = (window.SitiosIt15.ninjas = window.SitiosIt15.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const TEJAS = { rojo: ["#e8806a", "#cc5a44", "#a8402e", "#7e2e20", "#561e14"], azul: ["#7aa6cc", "#5686b0", "#3e6a92", "#2c4e70", "#1e3650"], tierra: ["#d8a070", "#bc8050", "#9a6238", "#764826", "#523018"], teja: ["#b07a68", "#946050", "#76483a", "#583428", "#3c2218"] };
  const HOJAS = { v: ["#a8dc88", "#84c46a", "#62a452", "#468440", "#2e6430"], o: ["#8cc08a", "#6aa46e", "#4e8a58", "#386e46", "#244e32"] };

  const hojaK = (k, x, y, r, col) => { for (let a = 0; a < 13; a += 0.06) { const e = 0.6 + (a / 13) * r; k.R(x + Math.cos(a) * e, y + Math.sin(a) * e, 1.6, 1.6, col); } k.poli([[x + r * 0.9, y - r * 0.6], [x + r * 1.7, y - r * 1.4], [x + r * 1.2, y - r * 0.1]], col); };
  function casaK(k, x, base, w, h, { techo = TEJAS.rojo, s = 1, deposito = false, noren = null, pared = ["#fbf4e2", "#f0e4c8", "#e2d2b0", "#ccb890", "#ac9670"], ven = "#ffd27a" } = {}) {
    const top = base - h, z = Math.round(h * 0.34);
    T.rect(k, x, top, w, h, (px, py) => rampa(pared, 0.08 + ((px - x) / w) * 0.4 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.18, px, py));
    T.rect(k, x, base - z, w, z, madera(["#a87a50", "#8a6040", "#6e4a30", "#543620", "#3a2414"], { paso: 3, vertical: true, largo: 99, s: s + 1 })); k.R(x, base - z - 1, w, 1, "#4a3020");
    const vs = [];
    for (let vx = x + 4; vx < x + w - 8; vx += 12) { T.ventana(k, vx, top + 4, 6, Math.max(4, Math.min(7, h - z - 7)), { marco: "#4a3020", vidrio: ven }); vs.push([vx + 3, top + 6]); }
    if (noren) { const px = x + w * 0.62; k.R(px - 5, base - 11, 10, 11, "#2a1e16"); for (let i = 0; i < 3; i++) k.R(px - 5 + i * 3.4, base - 12, 3, 6, i % 2 ? "#f4efe0" : noren); }
    T.tejadoJ(k, x + w / 2, top + 1, w + 10, Math.max(7, w * 0.24), techo, s + 2, 3);
    if (deposito) { const dx = x + w * 0.22, dy = top - Math.max(7, w * 0.24) * 0.7; k.R(dx + 1, dy - 2, 2, 7, "#4a3a2e"); k.R(dx + 10, dy - 2, 2, 7, "#4a3a2e"); cilindro(k, dx, dy - 12, 13, 11, ["#e4eaee", "#c4ccd4", "#9aa4ae", "#788290"]); k.elipse(dx + 6.5, dy - 12, 6.5, 2, "#9aa4ae"); k.R(dx, dy - 7, 13, 1, "#6a7480"); }
    sombraE(k, x + w / 2 + 2, base + 1, w * 0.6, 2, 0.35);
    return vs;
  }
  const ROCA_H = ["#ead6ae", "#d6be92", "#c0a47a", "#a48862", "#866c4c", "#68523a"];
  function monteHakoge(k, n, { y0 = 40, base = 136, pinta = null } = {}) {
    rellena(k, [[-4, base], [-4, y0 + 26], [36, y0 + 10], [110, y0 + 2], [210, y0], [284, y0 + 12], [324, y0 + 26], [324, base]], (x, y) => rampa(ROCA_H, 0.3 + 0.18 * Math.sin(y / 3.4 + Math.sin(x / 19) * 2.2) + (fbm(x * 0.06, y * 0.12, 301) - 0.5) * 0.35 + (Math.sin(x / 6.3 + y / 11) > 0.8 ? 0.2 : 0), x, y));
    for (let x = -4; x < 324; x++) { const t = (x + 4) / 328, y = y0 + 26 - Math.sin(t * Math.PI) * 26 + Math.sin(x / 9) * 1.5; k.P(x, y, ROCA_H[0]); k.P(x, y + 1, ROCA_H[1]); }
    const xs = n === 7 ? [31, 74, 117, 160, 203, 246, 289] : n === 5 ? [50, 104, 158, 212, 266] : [66, 118, 170, 222];
    const PELO = [[[-20, 74], [-18, 60], [-8, 50], [8, 50], [18, 60], [20, 74], [24, 96], [14, 72], [-14, 72], [-24, 96]], [[-20, 70], [-16, 56], [-10, 58], [-6, 50], [0, 56], [6, 50], [12, 58], [18, 56], [20, 70]], [[-19, 68], [-12, 56], [0, 52], [12, 56], [19, 68]], [[-21, 72], [-24, 58], [-14, 60], [-12, 48], [-4, 56], [2, 46], [8, 56], [16, 48], [16, 60], [24, 58], [21, 72]], [[-20, 76], [-18, 58], [-6, 50], [8, 50], [18, 58], [20, 76], [10, 64], [-10, 64]], [[-20, 70], [-22, 54], [-12, 58], [-8, 44], [2, 54], [12, 42], [14, 58], [24, 52], [20, 70]], [[-21, 72], [-26, 60], [-16, 58], [-14, 46], [-4, 54], [2, 44], [8, 54], [16, 46], [16, 58], [26, 60], [21, 72]]];
    xs.forEach((x, i) => {
      const cy = y0 + 40;
      bola(k, x, cy, 20, 26, () => ROCA_H[5]);
      bola(k, x, cy, 19, 25, (px, py) => rampa(ROCA_H, 0.02 + ((px - x) / 19) * 0.3 + ((py - cy) / 25) * 0.22 + (fbm(px * 0.2, py * 0.2, 302 + i) - 0.5) * 0.12, px, py));
      const pelo = (n === 7 ? PELO : n === 5 ? PELO.slice(0, 5) : PELO.slice(0, 4))[i] || PELO[2];
      rellena(k, pelo.map(([dx, dy]) => [x + dx, y0 - 34 + dy]), (px, py) => rampa(ROCA_H, 0.3 + ((px - x) / 24) * 0.3 + (Math.round(px * 0.6 + py) % 4 === 0 ? 0.3 : 0), px, py));
      trazo(k, pelo.map(([dx, dy]) => [x + dx, y0 - 34 + dy]), ROCA_H[5], 1);
      const oy = cy - 4;
      [[-1], [1]].forEach(([s]) => { k.R(x + s * 7 - 4, oy - 3, 8, 2, ROCA_H[5]); trazo(k, [[x + s * 7 - 3, oy + 1], [x + s * 7, oy + 2], [x + s * 7 + 3, oy + 1]], ROCA_H[5], 1); });
      rellena(k, [[x - 1, oy + 3], [x + 2, oy + 3], [x + 3, oy + 12], [x - 2, oy + 12]], (px, py) => rampa(ROCA_H, 0.25 + (px - x + 2) / 5 * 0.4, px, py)); k.R(x - 3, oy + 12, 7, 1, ROCA_H[5]);
      trazo(k, [[x - 6, oy + 19], [x, oy + 20], [x + 6, oy + 19]], ROCA_H[5], 1);
      if (i === 2 && n !== 7) trazo(k, [[x - 3, oy + 24], [x, oy + 28], [x + 3, oy + 24]], ROCA_H[4], 1);
      if (pinta) pinta(x, cy, i);
      sombra(k, [[x + 12, cy - 18], [x + 21, cy], [x + 15, cy + 22], [x + 6, cy + 28]], 0.25, { borde: 2 });
    });
  }
  window.N16 = { hojaK, casaK, monteHakoge, TEJAS, HOJAS };

  function kanoho(k) {
    const { d } = cuando(k), lit = encendido(k);
    k.banda(CIELO, 0, 112);
    nubarron(k, -16, 26, 80, 12); nubarron(k, 244, 20, 90, 14); cirros(k, 5, 4, 24);
    const pintadas = d === 1 ? (x, cy, i) => { const c = ["#e8602a", "#3f8ac0", "#e8402a", "#3f9a4a"][i]; for (let a = 0; a < 9; a += 0.25) k.R(x - 12 + Math.cos(a) * (1 + a * 0.55), cy + Math.sin(a) * (1 + a * 0.55), 2, 2, c); trazo(k, [[x + 6, cy - 10], [x + 13, cy - 6]], c, 2); trazo(k, [[x - 8, cy + 14], [x + 8, cy + 10]], c, 2); } : null;
    monteHakoge(k, d === 0 ? 7 : 4, { pinta: pintadas });
    const fila1 = [[-6, 28, "rojo"], [24, 26, "tierra"], [52, 30, "azul"], [84, 24, "teja"], [112, 28, "rojo"], [196, 26, "azul"], [224, 30, "tierra"], [256, 26, "rojo"], [286, 34, "teja"]];
    const vs = [];
    fila1.forEach(([x, w, t], i) => vs.push(...casaK(k, x, 118, w, 16, { techo: TEJAS[t], s: 310 + i, deposito: i % 3 === 1 })));
    const TR = ["#f07a5a", "#d85a44", "#b0402e", "#842e22", "#5c1e16"];
    cilindro(k, 134, 74, 52, 52, TR, 0.3); for (let y = 82; y < 124; y += 12) { k.R(132, y, 56, 2, "#5c1e16"); for (let x = 136; x < 184; x += 4) k.R(x, y - 3, 1, 3, "#5c1e16"); }
    for (let x = 140; x < 182; x += 10) T.ventana(k, x, 86, 5, 7, { marco: "#5c1e16", vidrio: "#ffd27a" });
    T.tejadoJ(k, 160, 76, 76, 16, TEJAS.rojo, 320, 4);
    k.elipse(160, 109, 12, 12, "#f4ecd8"); k.elipse(160, 109, 10, 10, "#c0392b"); k.R(154, 107, 12, 2, "#f4ecd8"); k.R(159, 101, 2, 15, "#f4ecd8"); trazo(k, [[159, 107], [153, 114]], "#f4ecd8"); trazo(k, [[161, 107], [167, 114]], "#f4ecd8");
    [[-8, 44, 22], [34, 40, 20], [80, 46, 24], [190, 44, 22], [232, 40, 20], [272, 52, 26]].forEach(([x, w, h], i) => vs.push(...casaK(k, x, 132, w, h, { techo: TEJAS[["azul", "rojo", "teja", "tierra"][i % 4]], s: 330 + i, deposito: i % 2 === 0, noren: i % 2 ? "#2f6fa8" : "#c0392b" })));
    T.rect(k, 0, 130, W, 50, T.tex(["#e4cf9e", "#d4bc88", "#c0a674", "#a88e5e", "#8c744a"], { v0: 0.2, s: 340, dy: 0.3, y0: 130, alto: 50 }));
    k.alfa(0.3, () => k.R(0, 132, W, 2, "#5a4a2a"));
    for (let i = 0; i < 24; i++) { const x = hash(i, 1, 341) * W, y = 138 + hash(i, 2, 341) * 40; k.R(x, y, 6 + hash(i, 3, 341) * 12, 1, "#b49c6c"); }
    [[34, 150, 46], [286, 152, 48]].forEach(([x, b, h]) => { sombraE(k, x + 2, b, 5, 1.5, 0.4); T.rect(k, x, b - h, 3, h, madera(["#8a6a4a", "#6e5038", "#543a26", "#3a2818", "#26180c"], { paso: 1, vertical: true, largo: 99, s: x })); k.R(x - 6, b - h + 3, 15, 1, "#3a2818"); k.R(x - 4, b - h + 7, 11, 1, "#3a2818"); });
    cuerda(k, 35, 108, 287, 108, 12, "#3a2a20");
    for (let i = 0; i <= 252; i++) { const t = i / 252, x = 35 + 252 * t, y = 110 + Math.sin(t * Math.PI) * 14; k.P(x, y, "#3a2a20"); if (i % 16 === 8) { k.poli([[x - 2, y + 1], [x + 2, y + 1], [x + 2, y + 8], [x, y + 6], [x - 2, y + 8]], i % 32 === 8 ? "#f4efe0" : "#e8c8a0"); k.P(x, y + 3, "#c0392b"); } }
    arbol(k, 4, 172, 26, 26, 22, HOJAS.v, { g: 5, s: 342 }); arbol(k, 316, 174, 28, 28, 22, HOJAS.v, { g: 5, s: 343 });
    P.caja(k, 92, 152, 12, 9); P.barril(k, 216, 154, 10, 12);
    luces(k, vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })).concat([{ x: 160, y: 92, r: 30, ry: 16, col: LUZ, f: lit * 0.6 }]));
  }
  N[1] = ["La aldea de Kanoho", "Tejados rojos y depósitos de agua al pie del monte de los Hakoge", kanoho, { ven: VEN, tinte: 0.2 }];

  function campo7(k) {
    k.banda(CIELO, 0, 114);
    nubarron(k, -20, 34, 96, 16); nubarron(k, 240, 26, 100, 18); cirros(k, 5, 4, 24);
    montana(k, 74, 112, 200, 58, { roca: ["#9cc0dc", "#8ab0d0", "#7aa0c4", "#6a90b6", "#5c82a8"] }); montana(k, 260, 112, 220, 66, { roca: ["#9cc0dc", "#8ab0d0", "#7aa0c4", "#6a90b6", "#5c82a8"] });
    for (let i = 0; i < 22; i++) copa(k, -6 + i * 15, 102 + (i % 3) * 2, 11, 9, HOJAS.o, { r: 4, s: 350 + i });
    T.prado(k, 112, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 351, { flores: { n: 40, cols: ["#ffffff", "#f2d24a", "#e8a0c0"] } });
    [[-4, 120, 1.8], [36, 122, 2.2], [78, 121, 1.6], [216, 121, 1.8], [258, 122, 2.3], [304, 121, 1.9]].forEach(([x, b, t], i) => arbol(k, x, b, 10 * t, 9 * t, 8 * t, HOJAS.v, { g: 3 * t, s: 352 + i }));
    bola(k, 158, 158, 76, 22, (x, y) => rampa(["#e2c89c", "#d0b488", "#bca074", "#a48a60"], 0.2 + Math.hypot((x - 158) / 76, (y - 158) / 22) * 0.45 + (fbm(x * 0.1, y * 0.2, 353) - 0.5) * 0.3, x, y));
    const PO = ["#d8b080", "#bc9264", "#9a744c", "#7a5836", "#583e24"];
    [[126, 62], [158, 68], [190, 62]].forEach(([x, h], i) => {
      sombraE(k, x + 6, 149, 10, 2.5, 0.45);
      T.rect(k, x, 148 - h, 10, h, (px, py) => rampa(PO, 0.08 + Math.pow(Math.abs((px - x) / 10 - 0.3) / 0.7, 1.2) * 0.6 + (Math.sin(px * 1.4 + py * 0.08) > 0.6 ? 0.14 : 0) + (fbm(px * 0.4, py * 0.06, 354 + i) - 0.5) * 0.2, px, py));
      k.elipse(x + 5, 148 - h, 5, 2, PO[1]); k.elipse(x + 5, 148 - h, 3, 1, PO[3]);
      [122, 129].forEach((y) => { for (let px = x - 1; px < x + 11; px++) { k.P(px, y, "#e8dcc0"); k.P(px, y + 1, (px + y) % 3 ? "#d4c4a0" : "#b8a880"); k.P(px, y + 2, "#a89470"); } });
      [[104, 3], [112, -3], [96, 2]].forEach(([y, d2]) => trazo(k, [[x + 3, y], [x + 7, y + d2 + 3]], PO[4], 1));
    });
    sombraE(k, 246, 151, 18, 2.5, 0.45);
    rellena(k, [[230, 150], [233, 120], [243, 108], [254, 118], [258, 150]], (x, y) => { const c = celdas(x, y, 9, 7, 355, 0.6); return rampa(["#d0d0da", "#b8b8c4", "#a0a0ac", "#84848f", "#66666f"], 0.15 + ((x - 230) / 30) * 0.55 + (c.borde < 0.08 ? 0.25 : 0) + (hash(x, y, 355) - 0.5) * 0.1, x, y); });
    for (let y = 122; y < 146; y += 3) for (let x = 237; x < 251; x += 2) if (hash(x, y, 356) > 0.35) k.P(x, y, "#5a5a64");
    [[236, 152, "#ffffff"], [242, 153, "#e8402a"], [250, 153, "#f2d24a"]].forEach(([x, y, c]) => { k.R(x, y - 4, 1, 4, "#3f8a3a"); k.R(x - 1, y - 5, 3, 2, c); });
    k.R(88, 150, 6, 10, "#6b4a30"); k.R(84, 146, 14, 3, "#8a6440"); k.R(90, 142, 2, 4, "#6b4a30");
    arbol(k, 6, 182, 36, 30, 26, HOJAS.v, { g: 7, s: 357 }); arbol(k, 322, 184, 38, 32, 26, HOJAS.v, { g: 7, s: 358 });
  }
  N[3] = ["El campo de entrenamiento 7", "Los tres postes de madera, en el claro del bosque, y la piedra de los caídos", campo7, { tinte: 0.2 }];

  function estadio(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 40);
    nubarron(k, 20, 6, 70, 10); nubarron(k, 230, 2, 80, 12);
    const graderio = (y0, y1) => { for (let y = y0; y < y1; y++) for (let x = 0; x < W; x++) { const fila = Math.floor((y - y0) / 5), en = (y - y0) % 5, u = (x + fila * 2) % 4, c = ((x + fila * 2) / 4) | 0, vacio = hash(c, fila, 360) < 0.12; if (en === 4) k.P(x, y, "#8a7660"); else if (vacio || u === 3) k.P(x, y, en < 2 ? "#a89276" : "#9a846a"); else if (en === 0) k.P(x, y, u === 1 ? ["#f2d0a8", "#e8c098", "#d0a078", "#a87850"][hash(c, fila, 361) * 4 | 0] : "#9a846a"); else k.P(x, y, ["#b8584a", "#4a7aa8", "#5a9a5a", "#d8b45a", "#8a6ab0", "#e8e0d0", "#5a5a64", "#d88a4a"][hash(c, fila, 362) * 8 | 0]); } };
    const curva = (x) => 40 + Math.pow((x - 160) / 160, 2) * -14;
    for (let x = 0; x < W; x++) { const y0 = Math.round(curva(x)); k.R(x, y0 - 6, 1, 6, "#c8a878"); k.P(x, y0 - 6, "#e8d4a8"); }
    graderio(34, 96);
    for (let x = 0; x < W; x += 40) { T.rect(k, x, 34, 6, 62, piedra(["#e8d8b8", "#d4c4a0", "#bca884", "#a08c6a"], { tx: 6, ty: 4, s: 363 + x })); }
    T.rect(k, 0, 96, W, 22, piedra(["#e8d8b8", "#d4c4a0", "#bca884", "#a08c6a", "#84725a"], { tx: 12, ty: 5, s: 364 })); k.R(0, 96, W, 2, "#f4e8cc");
    T.rect(k, 136, 18, 48, 70, (x, y) => rampa(["#e86a4a", "#c84a34", "#a03828", "#782a1e"], 0.2 + ((x - 136) / 48) * 0.5, x, y)); T.tejadoJ(k, 160, 20, 60, 12, TEJAS.rojo, 365, 3);
    T.rect(k, 142, 28, 36, 20, () => "#2a1e1a"); [[150, 34], [168, 34]].forEach(([x, y], i) => { k.R(x - 2, y + 3, 5, 10, i ? "#f4efe0" : "#3a5a9a"); k.R(x - 2, y - 1, 5, 4, "#f2d0a8"); k.poli([[x - 4, y], [x + 4, y], [x, y - 5]], i ? "#3a8a5a" : "#c0392b"); });
    k.elipse(160, 66, 10, 10, "#f4ecd8"); hojaK(k, 160, 66, 6, "#c0392b");
    suelo3d(k, 118, 180, 160, 90, (X, z, x, y) => rampa(["#ecd8a8", "#dcc494", "#c8ae7e", "#b09668", "#947c52"], 0.25 + (fbm(x * 0.06, y * 0.15, 366) - 0.5) * 0.5 + (hash(x, y, 366) - 0.5) * 0.12, x, y));
    [[120, 150, 16, 4], [214, 162, 20, 5], [70, 172, 14, 3]].forEach(([x, y, rx, ry]) => { bola(k, x, y, rx, ry, (px, py) => rampa(["#b09668", "#947c52", "#7a6442", "#5e4c32"], 0.3 + (1 - Math.hypot((px - x) / rx, (py - y) / ry)) * 0.5 + ((py - y) / ry) * -0.2, px, py)); });
    trazo(k, [[150, 180], [158, 168], [152, 160], [160, 150]], "#7a6442", 2, 1);
    [[30, 180, 1], [292, 180, -1]].forEach(([x, b], i) => arbol(k, x, b, 30, 30, 24, HOJAS.v, { g: 6, s: 367 + i }));
    [[46, 130, 16, 7], [264, 132, 18, 8]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.4); k.roca(x, b, w, h, "#a8a090", "#c8c0b0", "#7e776a"); });
  }
  N[6] = ["El estadio del examen", "La arena de las finales: gradas curvas y llenas, y el palco de los Kega al fondo", estadio, { ven: VEN, tinte: 0.2, dx: 80 }];

  const ADOBE = ["#f6e2bc", "#ead0a2", "#d8b886", "#c09c6a", "#a07e52", "#7e6040"];
  function suna(k) {
    const lit = encendido(k);
    k.banda(["#7ab4e0", "#a0cceb", "#d0e4ec", "#f4ead2"], 0, 104);
    nubarron(k, 60, 18, 70, 10, ["#fff8ee", "#f4e8d8", "#e0d0bc"]);
    rellena(k, [[-2, 130], [-2, 30], [30, 26], [62, 40], [80, 70], [76, 130]], (x, y) => rampa(["#e8c890", "#d4ae78", "#bc9464", "#9e784e", "#7e5e3c"], 0.2 + 0.2 * Math.sin(y / 3.6 + Math.sin(x / 13) * 2) + ((x + 2) / 82) * 0.35 + (fbm(x * 0.08, y * 0.1, 371) - 0.5) * 0.3, x, y));
    rellena(k, [[322, 130], [322, 24], [292, 22], [262, 38], [244, 70], [248, 130]], (x, y) => rampa(["#e8c890", "#d4ae78", "#bc9464", "#9e784e", "#7e5e3c"], 0.3 + 0.2 * Math.sin(y / 3.6 + Math.sin(x / 13) * 2) + ((322 - x) / 80) * -0.1 + 0.25 + (fbm(x * 0.08, y * 0.1, 372) - 0.5) * 0.3, x, y));
    const cx = 160, cy = 104;
    bola(k, cx, cy, 52, 60, (x, y) => (y > cy ? null : rampa(ADOBE, 0.1 + ((x - cx) / 52 + 0.35) * 0.4 + ((y - 44) / 60) * 0.2 + (fbm(x * 0.2, y * 0.2, 373) - 0.5) * 0.15, x, y)));
    T.rect(k, cx - 52, cy, 104, 26, (x, y) => rampa(ADOBE, 0.15 + ((x - cx + 52) / 104) * 0.45 + (fbm(x * 0.2, y * 0.2, 374) - 0.5) * 0.15, x, y));
    for (let i = 0; i < 6; i++) { const x = cx - 40 + i * 16; k.elipse(x, cy + 2, 4, 5, "#4a3424"); k.elipse(x, cy + 2, 3, 4, "#5a3f2a"); }
    k.elipse(cx, 70, 14, 14, ADOBE[4]); k.elipse(cx, 70, 12, 12, ADOBE[1]); k.poli([[cx - 8, 62], [cx + 8, 62], [cx, 70]], "#8a3a2a"); k.poli([[cx - 8, 78], [cx + 8, 78], [cx, 70]], "#8a3a2a"); k.R(cx - 9, 61, 18, 2, "#8a3a2a"); k.R(cx - 9, 77, 18, 2, "#8a3a2a"); k.P(cx, 66, ADOBE[1]); k.P(cx, 74, ADOBE[1]);
    bola(k, cx, cy + 14, 13, 13, (x, y) => (y > cy + 14 ? null : "#2a1e16")); k.R(cx - 13, cy + 14, 26, 12, "#2a1e16");
    const casaR = (x, base, w, h, s) => { T.rect(k, x, base - h, w, h, (px, py) => rampa(ADOBE, 0.1 + ((px - x) / w) * 0.5 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.18, px, py)); bola(k, x + w / 2, base - h, w / 2 + 1, 5, (px, py) => (py > base - h ? null : rampa(ADOBE, 0.2 + (px - x) / w * 0.4, px, py))); const vs = []; for (let vx = x + 4; vx < x + w - 6; vx += 9) { k.elipse(vx + 2, base - h + 7, 2.5, 3, "#4a3424"); k.elipse(vx + 2, base - h + 7, 1.6, 2, "#5a3f2a"); vs.push([vx + 2, base - h + 7]); } k.R(x + w / 2 - 3, base - 10, 6, 10, "#3a2a1c"); sombraE(k, x + w / 2 + 2, base + 1, w * 0.6, 2, 0.4); return vs; };
    const vs = [...casaR(18, 128, 30, 24, 375), ...casaR(50, 126, 24, 20, 376), ...casaR(82, 130, 22, 16, 377), ...casaR(216, 130, 24, 18, 378), ...casaR(240, 126, 26, 22, 379), ...casaR(272, 128, 32, 26, 380)];
    cuerda(k, 48, 108, 74, 110, 3, "#5a4a3a"); cuerda(k, 240, 108, 266, 106, 3, "#5a4a3a"); [[54, "#e8c040"], [62, "#c0392b"], [246, "#3f6fa8"], [254, "#f4efe0"]].forEach(([x, c]) => k.R(x, 110, 4, 4, c));
    T.rect(k, 0, 128, W, 52, (x, y) => rampa(["#f8e4b8", "#ecd2a0", "#dcbe88", "#c8a670", "#ac8a58"], 0.15 + ((y - 128) / 52) * 0.3 + (Math.sin(x * 0.18 + Math.sin(y * 0.3) * 3) > 0.7 ? 0.15 : 0) + (hash(x, y, 381) - 0.5) * 0.1, x, y));
    k.alfa(0.3, () => k.R(0, 129, W, 2, "#7e6040"));
    bruma(k, 100, 150, "#f4e0b8", 0.35, { s: 382 });
    P.caja(k, 100, 150, 12, 9, ["#d8b886", "#c09c6a", "#a07e52", "#7e6040", "#5e4430", "#3e2c1e"]); P.barril(k, 216, 152, 10, 12, ["#d8b886", "#c09c6a", "#a07e52", "#7e6040", "#5e4430", "#3e2c1e"]);
    luces(k, vs.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.8 })));
  }
  N[7] = ["Sanugakure", "La aldea de la Arena, con la gran cúpula del Kezakage entre acantilados", suna, { tinte: 0.45, ven: ["#5a3f2a"], dx: 70 }];

  function puente(k) {
    k.banda(["#8ab0cc", "#a8c4d8", "#c8d8e2", "#e4ecee"], 0, 96);
    nubarron(k, 120, 22, 90, 12, ["#f4f6f8", "#e2e8ec", "#c8d2da"]);
    montana(k, 80, 98, 170, 40, { roca: ["#a8b8c8", "#98aabc", "#8a9cb0", "#7c8ea4"] }); montana(k, 262, 98, 150, 34, { roca: ["#a8b8c8", "#98aabc", "#8a9cb0", "#7c8ea4"] });
    P.mar(k, 96, 180, ["#5a8cb0", "#4a7ca0", "#3e6c90", "#325c80", "#284c6e"], { s: 391, cresta: "#c8dce8", medio: "#7aa4c4" });
    T.barcoLejos(k, 52, 112, { e: 0.8, bandera: "#7a8a9a" }); T.barcoLejos(k, 270, 116, { e: 0.9, bandera: "#7a8a9a" });
    const borde = (y) => 30 + (y - 92) * 1.6;
    for (let y = 92; y < 180; y++) { const a = borde(y); for (let x = Math.round(160 - a - 6); x < 160 - a; x++) k.P(x, y, rampa(["#8a7a68", "#6e6052", "#56483c"], (y - 92) / 88 * 0.8, x, y)); for (let x = Math.round(160 + a); x < 160 + a + 6; x++) k.P(x, y, rampa(["#7a6a58", "#5e5042", "#463a2e"], (y - 92) / 88 * 0.8, x, y)); }
    suelo3d(k, 92, 180, 160, 72, tablones(["#d8c4a4", "#c4ac88", "#ac9470", "#927a58", "#766046", "#584430"], { pw: 12, L: 60, s: 392, clavo: "#4a3a2a" }), { dentro: (x, y) => Math.abs(x - 160) < borde(y) });
    for (let i = 0; i < 9; i++) { const y = 96 + i * i * 1.1, a = borde(y), g = 1 + i * 0.4; [-1, 1].forEach((s) => { const x = 160 + s * (a + 3); k.R(x - g / 2, y - 6 - i * 1.4, g, 8 + i * 1.6, "#5a4a3a"); }); }
    [-1, 1].forEach((s) => { trazo(k, [[160 + s * 33, 88], [160 + s * 152, 166]], "#6e5a46", 1); trazo(k, [[160 + s * 33, 85], [160 + s * 152, 156]], "#6e5a46", 1); });
    k.R(132, 54, 3, 38, "#5a4a3a"); trazo(k, [[133, 56], [178, 50]], "#5a4a3a", 2); k.R(176, 50, 1, 16, "#3a3028"); k.R(173, 66, 6, 4, "#7a6a58");
    [[118, 150], [204, 146]].forEach(([x, b], i) => { P.barril(k, x, b, 9, 11); });
    P.caja(k, 196, 172, 14, 10); P.caja(k, 110, 170, 12, 9);
    bruma(k, 80, 160, "#e8eef2", 0.7, { s: 393, ey: 0.1 });
  }
  N[8] = ["El puente de las Olas", "El gran puente sin terminar sobre el mar, perdido entre la niebla", puente, { tinte: 0.5 }];

  function myoboku(k) {
    k.banda(["#7ac4e0", "#a0d4e8", "#cce6ea", "#eef0dc"], 0, 112);
    nubarron(k, 120, 20, 70, 12);
    montana(k, 60, 112, 140, 60, { roca: ["#8ab890", "#74a07c", "#5e8a68", "#4a7456"] }); montana(k, 270, 112, 150, 66, { roca: ["#8ab890", "#74a07c", "#5e8a68", "#4a7456"] });
    [[90, 112, 18, 80], [128, 112, 12, 54], [234, 112, 16, 70], [300, 112, 14, 60]].forEach(([x, base, w, h], i) => rellena(k, [[x - w / 2, base], [x - w * 0.1, base - h * 0.7], [x, base - h], [x + w * 0.15, base - h * 0.6], [x + w / 2, base]], (px, py) => rampa(["#e8d090", "#d4b878", "#bc9e62", "#a0844e"], 0.15 + (px > x ? 0.4 : 0) + (Math.sin(py * 0.5) > 0.8 ? 0.15 : 0), px, py)));
    for (let y = 30; y < 118; y++) { const a = 13 + (y - 30) * 0.05; for (let x = Math.round(200 - a); x <= 200 + a; x++) k.P(x, y, rampa(["#fff2b0", "#f8dc80", "#e8c058", "#d0a040", "#b08430"], 0.1 + Math.abs(x - 200) / a * 0.5 + (Math.sin(x * 1.3 + y * 0.2) > 0.6 ? -0.15 : 0.1), x, y)); }
    bola(k, 200, 120, 34, 6, (x, y) => rampa(["#fff2b0", "#f8dc80", "#e8c058"], 0.2 + Math.abs(x - 200) / 34 * 0.5, x, y)); bruma(k, 106, 130, "#fff6d8", 0.5, { s: 401, x0: 150, x1: 250 });
    T.prado(k, 118, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 402, { flores: { n: 30, cols: ["#ffffff", "#f8a8c8", "#ffe88a"] } });
    for (let y = 124; y < H; y++) { const f = (y - 124) / 56, w = 4 + f * 16, c = 160; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#e8dcb0", "#d8c898", "#c4b080"], 0.2 + Math.abs(x - c) / w * 0.4 + (hash(x, y, 403) - 0.5) * 0.2, x, y)); }
    const seta = (x, base, h, r, cols, s) => { sombraE(k, x + 3, base + 1, r * 0.6, 2.5, 0.4); T.rect(k, x - r * 0.18, base - h, r * 0.36, h, (px, py) => rampa(["#fffaee", "#f2ead6", "#dcd0b8", "#bcae94"], 0.1 + (px - x + r * 0.18) / (r * 0.36) * 0.6, px, py)); bola(k, x, base - h, r, r * 0.55, (px, py) => (py > base - h + 2 ? null : rampa(cols, 0.12 + ((px - x) / r) * 0.35 + ((py - base + h + r * 0.55) / (r * 0.55)) * 0.25, px, py))); for (let i = 0; i < 7; i++) { const a = Math.PI * (1.1 + hash(i, 1, s) * 0.8), d = hash(i, 2, s) * 0.8; k.elipse(x + Math.cos(a) * r * d, base - h + Math.sin(a) * r * 0.5 * d, Math.max(1.5, r * 0.12), Math.max(1, r * 0.08), "#fff6ee"); } k.R(x - r * 0.9, base - h + 1, r * 1.8, 1, cols[3]); };
    seta(30, 132, 40, 22, ["#f88a6a", "#e8604a", "#c84434", "#982e24"], 404); seta(74, 124, 26, 13, ["#f8c870", "#e8a840", "#c88a2a", "#9a6a1c"], 405); seta(258, 128, 34, 19, ["#f88a6a", "#e8604a", "#c84434", "#982e24"], 406); seta(300, 134, 24, 14, ["#e888c8", "#d060a8", "#a8448a", "#7e2e66"], 407); seta(116, 150, 14, 8, ["#e888c8", "#d060a8", "#a8448a", "#7e2e66"], 408);
    const sapo = (x, base, e) => { sombraE(k, x + 2, base + 1, 10 * e, 2, 0.45); const PI = ["#c8ccc0", "#aeb2a6", "#94988c", "#7a7e72"]; bola(k, x, base - 6 * e, 10 * e, 7 * e, (px, py) => rampa(PI, 0.15 + ((px - x) / (10 * e)) * 0.4 + ((py - base) / (7 * e)) * 0.2, px, py)); [-1, 1].forEach((s) => { k.elipse(x + s * 5 * e, base - 12 * e, 3 * e, 3 * e, PI[1]); k.elipse(x + s * 5 * e, base - 12 * e, 1.5 * e, 1.5 * e, PI[3]); }); trazo(k, [[x - 6 * e, base - 6 * e], [x + 6 * e, base - 6 * e]], PI[3], 1); };
    sapo(124, 146, 1.2); sapo(214, 148, 1.2);
    arbol(k, -2, 178, 24, 22, 18, HOJAS.v, { g: 5, s: 409 }); arbol(k, 322, 180, 26, 22, 18, HOJAS.v, { g: 5, s: 410 });
  }
  N[9] = ["El monte Myuboko", "La tierra de los sapos, con setas gigantes y cascadas de aceite", myoboku, { tinte: 0.55 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, loma, camino, casaJ2 } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, suelo3d, tablones, tejas, copa, arbol, briznas, sombraE, luces, encendido } = Det6;
  const T = window.P15, K = window.N16;
  const W = 320, H = 180;
  window.SitiosIt22 = window.SitiosIt22 || {};
  const N = (window.SitiosIt22.ninjas = window.SitiosIt22.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const MADO = ["#8a6240", "#74502f", "#5e4024", "#48301a", "#342212"], MADC = ["#c8a070", "#b08a5a", "#967048", "#7a5836", "#5e4226"];

  const BEIGE = ["#e4d4ac", "#d6c49a", "#c6b286", "#b09c72", "#94805a"], ROCA = ["#8a7a66", "#746652", "#605442", "#4c4234", "#3a3228"], CARA = ["#d8ccb6", "#c4b69e", "#ac9e86", "#948670"];
  function vaso(k, x, y, palillos) {
    T.rect(k, x, y, 11, 12, (px, py) => rampa(["#fbf6ea", "#efe6d2", "#d8ccb2"], 0.1 + ((px - x) / 11) * 0.5, px, py));
    k.R(x, y, 11, 3, "#c8302a"); k.R(x, y, 11, 1, "#e85a4a"); k.R(x + 2, y + 6, 6, 2, "#e8c84a"); k.R(x + 3, y + 6, 1, 2, "#c8302a");
    k.R(x - 1, y - 1, 13, 1, "#f4efe4"); k.R(x + 8, y - 3, 4, 2, "#f4efe4");
    if (palillos) { trazo(k, [[x + 7, y], [x + 9, y - 8]], "#d8b070", 1); trazo(k, [[x + 9, y], [x + 11, y - 8]], "#b89050", 1); }
  }
  function caraH(k, x, y, i) {
    const PELO = [[[-8, -3], [-9, -9], [-5, -12], [0, -13], [5, -12], [9, -9], [8, -3], [10, 6], [6, -2], [-6, -2], [-10, 6]], [[-8, -4], [-7, -10], [-3, -8], [0, -12], [3, -8], [7, -10], [8, -4]], [[-8, -4], [-5, -10], [0, -11], [5, -10], [8, -4]], [[-8, -4], [-10, -9], [-6, -9], [-5, -13], [-1, -10], [2, -14], [4, -10], [8, -13], [7, -8], [10, -8], [8, -4]]][i];
    bola(k, x + 1, y + 1, 8.5, 10, () => ROCA[4]);
    bola(k, x, y, 8, 9.5, (px, py) => rampa(CARA, 0.08 + ((px - x) / 8) * 0.28 + ((py - y) / 9.5) * 0.18 + (fbm(px * 0.3, py * 0.3, 4410 + i) - 0.5) * 0.1, px, py));
    rellena(k, PELO.map(([dx, dy]) => [x + dx, y + dy]), (px, py) => rampa(CARA, 0.25 + ((px - x) / 10) * 0.3 + ((Math.round(px * 0.7 + py) % 3) === 0 ? 0.18 : 0), px, py));
    k.R(x - 5, y - 2, 3, 1, ROCA[4]); k.R(x + 2, y - 2, 3, 1, ROCA[4]); k.R(x - 5, y - 1, 3, 1, ROCA[1]); k.R(x + 2, y - 1, 3, 1, ROCA[1]);
    k.R(x, y, 1, 3, ROCA[3]); k.R(x - 2, y + 4, 5, 1, ROCA[4]);
    k.alfa(0.35, () => rellena(k, [[x + 4, y - 7], [x + 8, y], [x + 6, y + 7], [x + 3, y + 8]], () => "#2a2420"));
  }
  function pisoBase(k, mas) {
    const { h } = Det.cuando(k), lit = encendido(k), vasos = Math.max(2, Math.min(12, (h - 1) * 2));
    T.rect(k, 0, 0, W, 117, (x, y) => {
      const i = Math.floor(x / 22), fx = x - i * 22;
      let f = 0.28 + (hash(i, 1, 4401) - 0.5) * 0.14 + (fbm(x * 0.08, y * 0.02 + i * 7, 4402) - 0.5) * 0.2 + Math.max(0, (16 - y) / 16) * 0.3 + Math.max(0, (y - 96) / 20) * 0.12;
      if (fx === 0) f += 0.42; else if (fx === 1) f -= 0.1;
      return rampa(BEIGE, f, x, y);
    });
    T.rect(k, 0, 116, W, 8, madera(MADC, { paso: 4, largo: 99, s: 4404 })); k.R(0, 116, W, 1, "#e8cc9c"); k.R(0, 123, W, 1, "#6a4c2e");
    suelo3d(k, 124, 180, 160, 70, tablones(["#c89a68", "#b08456", "#966c44", "#7a5634", "#5e4026", "#442c18"], { pw: 14, L: 70, s: 4405 }));
    k.alfa(0.35, () => k.R(0, 124, W, 2, "#2a1a10"));
    T.rect(k, 104, 10, 112, 84, madera(MADO, { paso: 3, largo: 99, s: 4406 }));
    T.rect(k, 109, 15, 102, 74, () => "#2a3670");
    if (lit > 0.4) for (let i = 0; i < 14; i++) k.crudo(110 + hash(i, 1, 4407) * 100, 16 + hash(i, 2, 4407) * 30, 1, 1, "#f4f0e0");
    rellena(k, [[109, 89], [109, 64], [130, 56], [160, 58], [188, 54], [211, 62], [211, 89]], (x, y) => rampa(ROCA, 0.4 + 0.12 * Math.sin(y / 2.6 + Math.sin(x / 9) * 2) + (fbm(x * 0.12, y * 0.2, 4408) - 0.5) * 0.22, x, y));
    [128, 150, 172, 194].forEach((x, i) => caraH(k, x, 72, i));
    for (let i = 0; i < 5; i++) casaJ2(k, 108 + i * 22, 90, 20, 8, { puerta: false, pared: "#7a7264", luz: "#8a8274", osc: "#5a5448", mad: "#4a4238", madL: "#5a5248", madO: "#3a3228", techo: { c: "#5a3a34", luz: "#6e4a42", osc: "#42282a" }, alto: 0.3 });
    if (lit > 0.3) [114, 128, 141, 158, 172, 186, 200].forEach((x, i) => { if (hash(i, 3, 4409) < 0.7) k.crudo(x, 86 + (i % 2), 2, 1, "#ffd27a"); });
    T.rect(k, 159, 15, 2, 74, () => MADO[2]); T.rect(k, 109, 50, 102, 2, () => MADO[2]); k.R(109, 15, 102, 1, MADO[4]); k.R(109, 15, 1, 74, MADO[4]);
    k.alfa(0.14, () => { trazo(k, [[114, 44], [132, 20]], "#ffffff", 2); trazo(k, [[166, 46], [180, 28]], "#ffffff", 1); trazo(k, [[120, 84], [136, 58]], "#ffffff", 1); });
    T.rect(k, 98, 92, 124, 5, madera(MADC, { paso: 2, largo: 99, s: 4411 })); k.R(98, 92, 124, 1, "#e0bc88"); k.alfa(0.35, () => k.R(98, 97, 124, 2, "#3a2a1a"));
    k.R(92, 3, 136, 3, "#4a3020"); k.R(92, 3, 136, 1, "#6a4830"); k.elipse(92, 4, 2.5, 2.5, "#4a3020"); k.elipse(228, 4, 2.5, 2.5, "#4a3020");
    rellena(k, [[98, 6], [222, 6], [222, 14], [206, 38], [180, 14], [140, 14], [114, 38], [98, 14]], (x, y) => rampa(["#ffb050", "#f57c1f", "#d8641a", "#b04e14"], 0.15 + (Math.sin(x * 0.9) + 1) * 0.18 + (y > 12 ? 0.08 : 0) + (y < 9 ? 0.2 : 0), x, y));
    k.R(98, 9, 124, 1, "#b04e14"); for (let x = 104; x < 220; x += 12) k.R(x, 10, 2, 4, "#d06418");
    k.alfa(0.25, () => k.R(30, 20, 46, 30, "#3a2a1a")); k.R(28, 18, 46, 30, "#efe6d0"); k.R(28, 18, 46, 1, "#fbf6ea"); k.R(28, 47, 46, 1, "#c8bea8");
    T.rect(k, 32, 22, 38, 22, (x, y) => rampa(["#4a8ac8", "#2f6fa8", "#225a8c"], (y - 22) / 22, x, y)); K.hojaK(k, 51, 33, 6, "#f7d23e"); k.R(50, 18, 2, 2, "#c0392b");
    k.R(33, 54, 4, 3, "#3a2a1a"); k.R(33, 54, 4, 1, "#6a5a4a");
    rellena(k, [[20, 60], [50, 60], [54, 104], [16, 104]], (x, y) => rampa(["#ff9a3c", "#f57c1f", "#d8641a", "#b04e14"], 0.15 + ((x - 18) / 36) * 0.4 + (Math.sin(y * 0.5 + x * 0.2) > 0.85 ? 0.15 : 0), x, y));
    k.R(31, 60, 6, 44, "#26262a"); k.R(33, 60, 1, 44, "#3a3a44"); k.R(20, 60, 30, 3, "#26262a"); k.R(26, 58, 18, 3, "#f4efe6"); k.R(20, 84, 34, 2, "#c85a10"); k.R(16, 102, 38, 2, "#26262a");
    for (let a = 0; a < 9; a += 0.25) { const e = 0.5 + a * 0.45; k.P(Math.round(44 + Math.cos(a) * e), Math.round(74 + Math.sin(a) * e), "#c0392b"); }
    k.alfa(0.25, () => k.R(234, 18, 42, 42, "#3a2a1a")); k.R(232, 16, 42, 42, "#efe6d0"); k.R(232, 16, 42, 1, "#fbf6ea");
    [[15, "#c0392b"], [12, "#efe6d0"], [9, "#c0392b"], [6, "#efe6d0"], [3, "#c0392b"]].forEach(([r, c]) => k.elipse(253, 37, r, r, c));
    [[246, 29, 1], [262, 42, -1]].forEach(([x, y, s]) => { rellena(k, [[x, y], [x + 4 * s, y + 3], [x + 6 * s, y + 6], [x + 3 * s, y + 4]], () => "#8a8e98"); trazo(k, [[x - 1 * s, y - 1], [x - 6 * s, y - 5]], "#2a2a30", 2); k.elipse(x - 7 * s, y - 6, 1.5, 1.5, "#8a8e98"); });
    T.rect(k, 232, 66, 74, 3, madera(MADC, { paso: 1, largo: 99, s: 4412 })); k.R(232, 69, 74, 1, "#54351f"); k.R(236, 70, 2, 4, "#54351f"); k.R(300, 70, 2, 4, "#54351f");
    const LIB = mas ? [[236, "#c0392b"], [244, "#2f8a5a"], [252, "#f2c84b"]] : [[238, "#c0392b"], [246, "#2f8a5a"], [254, "#f2c84b"], [262, "#3f6f9a"]];
    LIB.forEach(([x, c], i) => { const hl = 12 - (i % 2); k.R(x, 66 - hl, 7, hl, c); k.R(x, 66 - hl, 1, hl, mezcla(c, "#ffffff", 0.35)); k.R(x + 6, 66 - hl, 1, hl, mezcla(c, "#000000", 0.35)); k.R(x + 1, 66 - hl + 3, 5, 1, mezcla(c, "#ffffff", 0.5)); });
    T.rect(k, 280, 58, 11, 8, (x, y) => rampa(["#d08a58", "#b06e44", "#8a5434"], (x - 280) / 11, x, y)); k.R(279, 58, 13, 1, "#e0a070");
    esfera(k, 285, 51, 7, 6, ["#8ad070", "#62b04e", "#448a3c", "#2e6a2a"]); trazo(k, [[285, 46], [284, 40], [287, 37]], "#3f8a4a", 1); k.elipse(288, 37, 2, 1.2, "#62b04e");
    k.R(295, 29, 1, 4, "#c8bea8"); k.elipse(296, 40, 7, 8, "#3a8a4a"); k.elipse(296, 42, 5, 5, "#6ac07a"); k.elipse(293, 36, 2, 2, "#ffffff"); k.elipse(299, 36, 2, 2, "#ffffff"); k.P(293, 36, "#26262a"); k.P(299, 36, "#26262a"); k.R(293, 44, 7, 1, "#26262a");
    T.rect(k, -2, 104, 92, 48, madera(MADO, { paso: 3, largo: 99, s: 4413 })); k.R(-2, 104, 92, 1, "#a07850");
    T.rect(k, -2, 96, 88, 24, (x, y) => rampa(["#f8f4ea", "#ece4d0", "#d8ccb4"], 0.1 + (y - 96) / 40 + (Math.sin(x * 0.4) > 0.9 ? 0.15 : 0), x, y));
    T.rect(k, -2, 116, 88, 16, (x, y) => rampa(["#5a8ad8", "#4070c0", "#2e58a0", "#204480"], 0.2 + (y - 116) / 30 + (fbm(x * 0.15, y * 0.3, 4414) - 0.5) * 0.35 + (Math.round(x * 0.5 + y) % 9 === 0 ? 0.15 : 0), x, y));
    k.R(-2, 116, 88, 2, "#7aa2e4"); k.R(-2, 124, 88, 1, "#2e58a0");
    esfera(k, 12, 104, 13, 7, ["#ffffff", "#f2f2f6", "#dcdce6", "#c4c4d2"]); k.R(2, 108, 22, 1, "#c4c4d2");
    esfera(k, 18, 96, 8, 6, ["#f8f8f8", "#e8e8f0", "#c8c8d4"]); k.R(11, 99, 15, 3, "#3a6ac8"); k.elipse(15, 94, 1.6, 1.6, "#1c1c22"); k.elipse(21, 94, 1.6, 1.6, "#1c1c22"); k.R(16, 89, 4, 2, "#f8f8f8"); k.elipse(14, 88, 2.2, 2.2, "#f8f8f8");
    T.rect(k, 84, 102, 6, 50, madera(MADO, { paso: 1, vertical: true, largo: 99, s: 4415 })); k.R(84, 102, 6, 2, "#a07850"); k.elipse(87, 101, 3.5, 2, "#a07850");
    sombraE(k, 46, 154, 46, 3, 0.4);
    T.rect(k, 118, 112, 88, 5, madera(MADO, { paso: 2, largo: 99, s: 4416 })); k.R(118, 112, 88, 1, "#c89a68"); k.R(118, 116, 88, 1, "#241608");
    [124, 196].forEach((x) => T.rect(k, x, 117, 4, 14, madera(MADO, { paso: 1, vertical: true, largo: 99, s: x }))); sombraE(k, 162, 132, 46, 3, 0.35);
    [[126, 100], [144, 100], [162, 100], [180, 100]].slice(0, vasos).forEach(([x, y], i) => vaso(k, x, y, i % 2 === 0));
    [[96, 164], [226, 150], [250, 170], [212, 174], [176, 166], [272, 156], [118, 148], [290, 170]].slice(0, Math.max(0, vasos - 4)).forEach(([x, y]) => { sombraE(k, x + 6, y + 13, 8, 2, 0.4); vaso(k, x, y, false); });
    esfera(k, 150, 164, 11, 4.5, ["#8a7ac8", "#6a5aa8", "#4e4088", "#3a2e68"]); k.R(141, 163, 18, 1, "#9a8ad8");
    if (mas) {
      k.R(78, 18, 18, 24, "#f4efe6"); k.R(78, 18, 18, 5, "#c0392b"); k.R(78, 18, 18, 1, "#e05a4a");
      for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = 80 + i * 4, y = 25 + j * 4; k.R(x, y, 3, 3, "#d8d0c0"); if (j * 4 + i < 9) { k.P(x, y, "#c0392b"); k.P(x + 2, y + 2, "#c0392b"); k.P(x + 1, y + 1, "#c0392b"); } }
      T.rect(k, 264, 52, 13, 14, () => "#a87444"); k.R(265, 53, 11, 12, "#a8c8e0"); [[267, "#f2c84b"], [270, "#3a3a44"], [273, "#f08ac0"]].forEach(([x, c]) => { k.R(x, 58, 2, 5, c); k.R(x, 56, 2, 2, "#f2d0a8"); });
      trazo(k, [[83, 105], [87, 111], [93, 105]], "#26262a", 1); k.elipse(84, 110, 2.6, 2.6, "#26262a"); k.elipse(91, 110, 2.6, 2.6, "#26262a"); k.elipse(84, 110, 1.8, 1.8, "#8ad0f0"); k.elipse(91, 110, 1.8, 1.8, "#8ad0f0"); k.P(83, 109, "#f4fcff"); k.P(90, 109, "#f4fcff");
      trazo(k, [[36, 121], [60, 120]], "#2a4a8a", 2); T.rect(k, 42, 117, 10, 6, (x, y) => rampa(["#e4e8ee", "#c4cad4", "#9aa2ae"], (y - 117) / 6, x, y)); k.R(42, 117, 10, 1, "#f4f8fc"); K.hojaK(k, 47, 120, 1.8, "#6a7280");
      T.rect(k, 190, 98, 8, 14, (x, y) => (y < 101 ? "#f4f4f8" : rampa(["#f4f4f8", "#dfe6f0"], (x - 190) / 8, x, y))); k.R(190, 104, 8, 3, "#3a7ac8"); rellena(k, [[190, 98], [194, 95], [198, 98]], () => "#e4e8f0");
      sombraE(k, 100, 142, 6, 1.5, 0.4); esfera(k, 100, 136, 5, 5, ["#e86a5a", "#c8402a", "#9a2a1c"]); k.elipse(100, 136, 3.4, 3.4, "#f8f4ea"); k.R(100, 134, 1, 3, "#26262a"); k.R(100, 136, 2, 1, "#26262a"); k.elipse(96, 131, 2, 2, "#e8c050"); k.elipse(104, 131, 2, 2, "#e8c050"); k.R(97, 140, 1, 2, "#3a2a1a"); k.R(103, 140, 1, 2, "#3a2a1a");
      const sx = 238, sy = 140; [[0, -4], [4, 0], [0, 4], [-4, 0]].forEach(([dx, dy]) => rellena(k, [[sx, sy], [sx + dx + dy * 0.4, sy + dy - dx * 0.4], [sx + dx * 0.4 - dy * 0.3, sy + dy * 0.4 + dx * 0.3]], () => "#8a8e98")); k.P(sx, sy, "#3a3a44"); sombraE(k, sx, sy + 3, 4, 1, 0.35);
    }
    luces(k, [{ x: 160, y: 132, r: 92, ry: 34, col: "#c8d8ff", f: 0.18 + lit * 0.12 }, { x: 160, y: 52, r: 70, ry: 50, col: "#c8d8ff", f: 0.12 }]);
  }
  N[14] = (n) => ["El piso de Karuto", "Su cuarto: la cama, los vasos de ramen y la ventana que da al monte de los Hakoge", (k) => pisoBase(k, n > 1), { cielo: "propio", fuerza: 0.55, ventanal: "#2a3670" }];

  const PA = ["#f6dab6", "#ecc8a0", "#dcb48a", "#c49a76", "#a47e60"], ROJ = ["#e86a50", "#c8402e", "#a03024", "#7a2218"];
  function academiaBase(k, mas) {
    const lit = encendido(k), L = [];
    k.banda(CIELO, 0, 112);
    nubarron(k, -16, 40, 76, 14); nubarron(k, 250, 34, 84, 14); cirros(k, 4, 2, 20);
    loma(k, [[-20, 108], [60, 78], [130, 92], [200, 76], [262, 90], [340, 80]], 126, ["#c8ae88", "#b59a74", "#a08660"], 0.3);
    for (let i = 0; i < 9; i++) { const x = i < 4 ? 4 + i * 16 : 222 + (i - 4) * 18, y = 110 + (i % 2) * 3; copa(k, x + hash(i, 1, 4501) * 6, y, 8, 5, K.HOJAS.o, { r: 3, s: 4502 + i }); }
    const curva = (x) => Math.cos(((x - 76) / 167 - 0.38) * Math.PI);
    T.rect(k, 76, 58, 168, 70, (x, y) => rampa(PA, 0.12 + (1 - curva(x)) * 0.5 + (fbm(x * 0.15, y * 0.15, 4510) - 0.5) * 0.14 + (hash(x, y, 4511) < 0.02 ? 0.12 : 0) + (y > 122 ? 0.12 : 0), x, y));
    T.rect(k, 76, 80, 168, 4, (x, y) => rampa(ROJ, 0.15 + (1 - curva(x)) * 0.5 + (y === 83 ? 0.35 : 0), x, y)); k.R(76, 80, 168, 1, "#f07a5a"); k.R(76, 84, 168, 1, "#6a2018");
    k.alfa(0.25, () => k.R(76, 58, 168, 3, "#5a3a2a"));
    [64, 92].forEach((y) => { for (let x = 88; x < 232; x += 22) {
      if (y === 92 && x > 136 && x < 172) continue;
      k.R(x - 1, y - 1, 15, 14, "#7a5a44"); k.R(x, y, 13, 12, "#55697c"); k.R(x + 1, y + 1, 5, 4, "#6a7e92"); k.P(x + 2, y + 2, "#9ab0c4"); k.P(x + 3, y + 1, "#9ab0c4");
      k.R(x + 6, y, 1, 12, "#3f4f60"); k.R(x, y + 6, 13, 1, "#3f4f60"); k.R(x - 2, y + 13, 17, 2, "#f6e4c8"); k.alfa(0.3, () => k.R(x - 2, y + 15, 17, 1, "#5a3a2a"));
      L.push({ x: x + 6, y: y + 6, r: 13, ry: 10, col: "#ffd27a", f: lit * 0.8 });
    } });
    T.rect(k, 142, 92, 36, 36, () => "#7a5638"); T.rect(k, 146, 96, 28, 32, madera(["#8a6440", "#74522f", "#5e4024", "#48301a", "#342212"], { paso: 2, vertical: true, largo: 99, s: 4512 }));
    k.R(159, 96, 2, 32, "#342212"); [[148, 100], [162, 100], [148, 114], [162, 114]].forEach(([x, y]) => { k.R(x, y, 10, 10, "#5e4024"); k.R(x, y, 10, 1, "#9a7450"); k.R(x, y, 1, 10, "#9a7450"); });
    [[156, 112], [164, 112]].forEach(([x, y]) => { k.R(x, y, 1, 3, "#e8c35a"); k.P(x, y, "#fff0b0"); });
    k.R(140, 90, 40, 3, "#c0392b"); k.R(140, 90, 40, 1, "#e0604a");
    T.rect(k, 138, 126, 44, 3, (x, y) => rampa(["#e0d8c4", "#c8bea8", "#a89e88"], (y - 126) / 3, x, y)); T.rect(k, 134, 129, 52, 2, (x, y) => rampa(["#d4cab4", "#b8ae98"], (y - 129) / 2, x, y));
    rellena(k, [[96, 44], [224, 44], [250, 56], [258, 49], [261, 53], [250, 61], [70, 61], [59, 53], [62, 49], [70, 56]], tejas(K.TEJAS.rojo, { w: 5, h: 3, s: 4513, y0: 44 }));
    k.R(96, 42, 128, 3, "#6a2018"); k.R(96, 42, 128, 1, "#a8402e"); trazo(k, [[70, 60], [250, 60]], "#5a1a12", 1); trazo(k, [[62, 49], [70, 56], [96, 44]], "#e8806a", 1); trazo(k, [[224, 44], [250, 56], [258, 49]], "#7e2e20", 1);
    k.alfa(0.3, () => k.R(78, 61, 164, 2, "#3a2418"));
    T.rect(k, 157, 46, 6, 10, madera(MADO, { paso: 1, vertical: true, largo: 99, s: 4514 }));
    k.elipse(160, 30, 23, 23, "#5a1a12"); k.elipse(160, 30, 22, 22, "#c0392b"); k.elipse(160, 30, 22, 22, "#c0392b");
    bola(k, 160, 30, 18, 18, (x, y) => rampa(["#fbe2a0", "#f2c46a", "#e0a850"], 0.15 + ((x - 160) / 18) * 0.25 + ((y - 30) / 18) * 0.25, x, y));
    for (let a = 0; a < 13; a += 0.06) { const r = 1 + a * 1.05; k.R(160 + Math.cos(a) * r, 30 + Math.sin(a) * r, 2, 2, "#c0392b"); }
    k.alfa(0.4, () => trazo(k, [[146, 18], [152, 12], [160, 9]], "#ffffff", 1));
    T.rect(k, 0, 126, W, 54, T.tex(["#e4cc98", "#d6bc88", "#c8ae7e", "#b89a6c", "#9c825a"], { v0: 0.15, s: 4515, dy: 0.35, y0: 126, alto: 54 }));
    k.alfa(0.32, () => { k.R(0, 127, W, 2, "#6a5a3a"); rellena(k, [[76, 128], [244, 128], [252, 134], [70, 134]], () => "#6a5a3a"); });
    camino(k, 131, 180, () => 160, (f) => 20 + f * 26, "#c4ad7c", "#d6c08e", "#b89f6c");
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 4516) * W, y = 132 + hash(i, 2, 4516) * 46; if (Math.abs(x - 160) < 22 + (y - 131) * 0.55) continue; k.R(x, y, 2, 1, "#9a8a76"); k.P(x, y - 1, "#c8baa4"); }
    briznas(k, 0, 70, 178, K.HOJAS.v, { n: 70, alto: 4, s: 4517, y1: 140 }); briznas(k, 250, 320, 178, K.HOJAS.v, { n: 70, alto: 4, s: 4518, y1: 140 });
    arbol(k, 40, 138, 46, 30, 22, K.HOJAS.v, { g: 6, s: 4520 });
    trazo(k, [[44, 98], [66, 95], [88, 97]], "#6e4a2e", 3, 2); trazo(k, [[44, 97], [66, 94], [88, 96]], "#9a7050", 1);
    [62, 78].forEach((x) => trazo(k, [[x, 96], [x, 126]], "#c8a878", 1)); T.rect(k, 58, 126, 24, 3, madera(MADC, { paso: 1, largo: 99, s: 4521 })); k.R(58, 126, 24, 1, "#e0bc88"); sombraE(k, 70, 138, 13, 2, 0.35);
    sombraE(k, 40, 140, 22, 3, 0.35);
    [[104, 148], [226, 150]].forEach(([x, b], i) => { sombraE(k, x + 2, b + 1, 7, 1.5, 0.4); T.rect(k, x - 1, b - 14, 3, 14, madera(MADO, { paso: 1, vertical: true, largo: 99, s: x })); [[8, "#efe6d0"], [6, "#c0392b"], [4, "#efe6d0"], [2, "#c0392b"]].forEach(([r, c]) => k.elipse(x, b - 18, r, r, c)); k.alfa(0.3, () => k.elipse(x + 2, b - 16, 7, 7, "#5a3a2a")); [[8, "#efe6d0"], [6, "#c0392b"], [4, "#efe6d0"], [2, "#c0392b"]].forEach(([r, c]) => k.elipse(x, b - 18, r, r, c)); trazo(k, [[x + 1 + i, b - 19], [x + 5 + i, b - 23]], "#3a3a44", 1); k.elipse(x + 6 + i, b - 24, 1, 1, "#8a8e98"); });
    arbol(k, 270, 138, 40, 24, 18, K.HOJAS.v, { g: 5, s: 4522 }); arbol(k, 306, 140, 46, 26, 20, K.HOJAS.v, { g: 6, s: 4523 });
    for (let x = 0; x < W; x += 13) { if (x > 40 && x < 268) continue; sombraE(k, x + 2, 153, 2, 1, 0.3); T.rect(k, x, 142, 3, 11, madera(MADO, { paso: 1, vertical: true, largo: 99, s: 4524 + x })); k.P(x + 1, 141, "#9a7450"); }
    T.rect(k, 0, 145, 42, 2, madera(MADC, { paso: 1, largo: 99, s: 4525 })); T.rect(k, 266, 145, 54, 2, madera(MADC, { paso: 1, largo: 99, s: 4526 }));
    if (mas) {
      [124, 196].forEach((x) => { sombraE(k, x + 1, 141, 4, 1, 0.35); k.R(x, 104, 2, 37, "#4a3020"); k.elipse(x + 1, 103, 1.5, 1.5, "#e8c35a"); rellena(k, [[x + 2, 106], [x + 12, 106], [x + 12, 128], [x + 7, 124], [x + 2, 128]], (px, py) => rampa(["#f08050", "#d8582e", "#b04020"], 0.2 + ((px - x) / 12) * 0.4, px, py)); K.hojaK(k, x + 7, 114, 2.6, "#f8e0a0"); });
      sombraE(k, 116, 141, 9, 1.5, 0.35); [109, 123].forEach((x) => k.R(x, 120, 2, 21, "#5e4024")); T.rect(k, 106, 112, 20, 12, madera(MADC, { paso: 2, largo: 99, s: 4527 })); [[108, 114, 6, 7], [116, 113, 7, 5], [117, 119, 6, 4]].forEach(([x, y, w, hh]) => { k.R(x, y, w, hh, "#f4efe6"); k.R(x + 1, y + 1, w - 2, 1, "#a8a090"); k.P(x + Math.round(w / 2), y, "#c0392b"); });
      sombraE(k, 32, 152, 16, 2, 0.35); T.rect(k, 18, 144, 28, 3, madera(MADC, { paso: 1, largo: 99, s: 4528 })); [20, 42].forEach((x) => k.R(x, 147, 2, 5, "#5e4024"));
      [[236, 146, 22], [248, 150, 26], [260, 147, 20]].forEach(([x, b, hh], i) => { sombraE(k, x + 2, b, 4, 1, 0.35); T.rect(k, x - 2, b - hh, 5, hh, madera(MADO, { paso: 1, vertical: true, largo: 99, s: 4530 + i })); k.elipse(x, b - hh, 2.5, 1, "#a07850"); trazo(k, [[x - 2, b - hh * 0.6], [x + 2, b - hh * 0.55]], "#e8dcc0", 1); });
    }
    luces(k, L);
  }
  N[15] = (n) => ["La Academia", "La escuela de ninjas, con su gran símbolo rojo y el columpio de Karuto", (k) => academiaBase(k, n > 1), { ven: ["#55697c", "#ffd27a"], dx: 70 }];

  const MAG = (window.SitiosIt22.magos = window.SitiosIt22.magos || {});
  const ORO = ["#f8e090", "#e8c050", "#c89a3a", "#a07a28", "#7a5a1a"], MARMOL = ["#f6f2ea", "#ebe5d9", "#ddd5c6", "#c9bfad", "#b0a690"];
  function vela(k, x, y) { k.R(x - 1, y - 6, 2, 6, "#f4efe6"); k.crudo(x - 1, y - 9, 2, 3, "#ffcf6a"); k.crudo(x, y - 10, 1, 1, "#fff4c0"); }
  function espumita(k, cx, cy, c, s) {
    for (let j = 0; j < 14; j++) { const a = hash(j, 1, s) * Math.PI * 2, d = hash(j, 2, s) * 11, x = cx + Math.cos(a) * d * 1.4, y = cy + Math.sin(a) * d * 0.5, r = 1.6 + hash(j, 3, s) * 2.4;
      k.elipse(x, y, r, r * 0.8, mezcla(c, "#ffffff", 0.15 + hash(j, 4, s) * 0.4)); k.crudo(Math.round(x - r * 0.4), Math.round(y - r * 0.4), 1, 1, "#ffffff"); }
  }
  function prefectosRehecho(k) {
    const L = [];
    T.rect(k, 0, 0, W, 112, (x, y) => rampa(MARMOL, 0.12 + (y / 112) * 0.2 + (Math.abs(Math.sin(x * 0.045 + y * 0.025 + fbm(x * 0.02, y * 0.03, 4601) * 5)) < 0.025 ? 0.35 : 0) + (fbm(x * 0.05, y * 0.05, 4602) - 0.5) * 0.1, x, y));
    [[54, 12], [254, 12]].forEach(([x, w]) => { T.rect(k, x, 14, w, 94, (px, py) => rampa(MARMOL, 0.05 + ((px - x) % 3 === 0 ? 0.25 : 0) + ((px - x) / w) * 0.2, px, py)); T.rect(k, x - 2, 14, w + 4, 5, (px, py) => rampa(ORO, 0.2 + (py - 14) / 6, px, py)); T.rect(k, x - 2, 102, w + 4, 6, (px, py) => rampa(MARMOL, 0.3 + (py - 102) / 8, px, py)); });
    T.rect(k, 0, 9, W, 3, (x, y) => rampa(ORO, 0.2 + (y - 9) / 4, x, y)); T.rect(k, 0, 106, W, 4, (x, y) => rampa(ORO, 0.3 + (y - 106) / 5, x, y));
    const dentroArco = (x, y, r, cx, cy, y1) => (y >= cy ? x >= cx - r && x <= cx + r && y <= y1 : Math.hypot(x - cx, y - cy) <= r);
    T.rect(k, 128, 6, 64, 80, (x, y) => (dentroArco(x, y, 31, 160, 36, 84) ? rampa(ORO, 0.25 + (Math.hypot(x - 160, y - 36) > 29.5 || x < 131 || x > 189 ? 0.35 : 0), x, y) : null));
    T.rect(k, 128, 6, 64, 80, (x, y) => (dentroArco(x, y, 27, 160, 36, 80) ? (y < 48 ? rampa(["#bce6f4", "#9ad4ec", "#78c0e2"], 0.1 + (y - 9) / 50, x, y) : rampa(["#4aa0d0", "#3a88bc", "#2c70a4"], 0.1 + (y - 48) / 40 + (Math.sin(x * 0.5 + y) > 0.85 ? -0.2 : 0), x, y)) : null));
    k.elipse(148, 22, 6, 6, "#f8e090"); k.crudo(146, 20, 2, 2, "#fff8d0");
    rellena(k, [[146, 80], [150, 66], [162, 62], [176, 68], [180, 80]], (x, y) => rampa(["#a89a88", "#8a7c6a", "#6a5e50"], 0.2 + (x - 146) / 40, x, y));
    trazo(k, [[160, 64], [168, 70], [176, 66], [182, 60]], "#3fb8a0", 4, 2); rellena(k, [[180, 62], [186, 55], [184, 63], [188, 60]], () => "#2a9a88");
    for (let i = 0; i < 4; i++) k.P(164 + i * 4, 67 + (i % 2), "#7ad8c4");
    rellena(k, [[154, 64], [156, 52], [160, 48], [164, 52], [163, 64]], () => "#f0c8a8"); bola(k, 159, 45, 4, 4, () => "#f0c8a8");
    rellena(k, [[154, 42], [163, 41], [165, 46], [166, 58], [161, 54], [156, 60], [152, 52]], (x, y) => (Math.floor(y / 2 + x * 0.3) % 2 ? "#f2c840" : "#e0a830"));
    trazo(k, [[163, 52], [167, 46]], "#f0c8a8", 2); k.P(158, 45, "#2a2a30"); k.P(160, 45, "#2a2a30");
    k.alfa(0.55, () => [[[133, 30], [187, 30]], [[133, 48], [187, 48]], [[134, 70], [146, 70]], [[178, 70], [186, 70]], [[147, 9], [147, 48]], [[173, 9], [173, 48]], [[160, 6], [160, 30]]].forEach((s) => trazo(k, s, "#3a3a44", 1)));
    [[34], [286]].forEach(([x]) => { sombraE(k, x, 112, 10, 2, 0.35); k.R(x - 6, 108, 12, 3, ORO[2]); trazo(k, [[x - 6, 110], [x - 10, 113]], ORO[3], 2); trazo(k, [[x + 6, 110], [x + 10, 113]], ORO[3], 2); T.rect(k, x - 1, 44, 3, 64, (px, py) => rampa(ORO, 0.15 + (px - x + 1) / 3 * 0.5, px, py)); [60, 80].forEach((y) => k.elipse(x, y, 3, 1.5, ORO[2])); trazo(k, [[x - 10, 44], [x - 10, 38], [x - 10, 44], [x + 10, 44], [x + 10, 38]], ORO[2], 1); k.R(x - 10, 43, 21, 2, ORO[1]); [-10, -5, 0, 5, 10].forEach((d) => vela(k, x + d, 42 - (d === 0 ? 2 : 0))); L.push({ x, y: 34, r: 30, ry: 24, col: "#ffcf7a", f: 0.5 }); });
    suelo3d(k, 110, 180, 160, 60, Det6.losas3d(MARMOL, { tx: 26, tz: 16, s: 4603 }));
    rellena(k, [[44, 118], [276, 118], [308, 174], [12, 174]], (x, y) => rampa(MARMOL, 0.05 + (y - 118) / 200, x, y));
    rellena(k, [[50, 122], [270, 122], [272, 128], [48, 128]], (x, y) => rampa(["#c8d8dc", "#a8bec4", "#8aa4ac"], 0.2 + (y - 122) / 8, x, y));
    rellena(k, [[48, 128], [272, 128], [300, 170], [20, 170]], (x, y) => rampa(["#a8e0f4", "#86c8ea", "#64acd8", "#4a90c4", "#3a78ae"], 0.18 + (1 - Math.abs(x - 160) / 150) * 0.25 + ((y - 128) / 42) * 0.2 + (Math.sin(x * 0.22 + y * 0.9) > 0.86 ? -0.22 : 0) + (Math.sin(x * 0.07 - y * 0.5) > 0.95 ? -0.15 : 0), x, y));
    k.alfa(0.28, () => { trazo(k, [[158, 130], [162, 136], [158, 142], [162, 148], [159, 154]], "#e8f4ff", 2); trazo(k, [[52, 132], [56, 138], [52, 144]], "#ffcf7a", 2); trazo(k, [[268, 132], [264, 138], [268, 144]], "#ffcf7a", 2); });
    k.R(44, 118, 232, 1, "#fbf8f2"); trazo(k, [[12, 174], [308, 174]], "#b0a690", 1);
    for (let x = 56; x < 266; x += 13) { k.R(x, 113, 3, 6, ORO[1]); k.R(x - 1, 112, 5, 2, ORO[2]); k.R(x + 2, 117, 3, 2, ORO[2]); k.crudo(x + 1, 111, 1, 1, ["#e8402a", "#3a6ac8", "#3a9a5a", "#c87ae8"][Math.round((x - 56) / 13) % 4]); k.alfa(0.5, () => k.R(x + 3, 119, 1, 5, "#e8f4ff")); }
    [[86, 140, "#f4a8c4", 1], [150, 152, "#c8f0ff", 2], [214, 138, "#f8e8a0", 3], [252, 158, "#c8a8f4", 4], [62, 158, "#a8f0c8", 5], [186, 162, "#f4a8c4", 6]].forEach(([x, y, c, i]) => espumita(k, x, y, c, 4610 + i));
    k.alfa(0.12, () => { for (let i = 0; i < 8; i++) k.elipse(40 + i * 34, 124 + (i % 3) * 6, 30, 5, "#ffffff"); });
    for (let i = 0; i < 26; i++) { const x = 40 + hash(i, 1, 4620) * 240, y = 16 + hash(i, 2, 4620) * 98, r = 1 + hash(i, 3, 4620) * 2; k.alfa(0.5, () => k.elipse(x, y, r, r, "#e8f4ff")); k.crudo(Math.round(x - r * 0.5), Math.round(y - r * 0.5), 1, 1, "#ffffff"); }
    [[22, 166, "#f4f0ea"], [24, 162, "#e8f0f8"], [21, 158, "#f8ecf0"]].forEach(([x, y, c]) => { T.rect(k, x, y, 18, 5, (px, py) => rampa([c, mezcla(c, "#a8a090", 0.3)], (py - y) / 5, px, py)); k.R(x, y, 18, 1, "#ffffff"); });
    sombraE(k, 254, 172, 8, 2, 0.4); bola(k, 254, 165, 6, 7, (x, y) => rampa(ORO, 0.05 + ((x - 248) / 12) * 0.55 + ((y - 158) / 14) * 0.2, x, y)); trazo(k, [[248, 165], [260, 165]], ORO[4], 1); k.crudo(251, 161, 2, 2, "#fff8d0");
    luces(k, [...L, { x: 160, y: 50, r: 46, ry: 40, col: "#9ad8f0", f: 0.3 }, { x: 160, y: 148, r: 150, ry: 30, col: "#9ad8f0", f: 0.15 }]);
  }
  MAG[44] = ["El baño de los prefectos", "La bañera como una piscina, los grifos de oro, la sirena del vitral y el huevo de oro", prefectosRehecho, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#f4efe6", "#e8f4ff", "#ffffff", "#f8e090", "#e8402a", "#3a6ac8", "#3a9a5a", "#c87ae8", "#fff4c0", "#fff8d0"] }];

  function dragon(k, x, b, e, pal, { ala = 0.5, mira = 1, s = 1, pincho = null, borde = "#ffb050" } = {}) {
    const L = (v) => v * e, X = (v) => x + mira * L(v), col = (px, py) => rampa(pal, 0.12 + ((py - b + L(40)) / L(40)) * 0.45 + (fbm(px * 0.2, py * 0.2, s) - 0.5) * 0.2, px, py);
    const cola = Det6.bezier([X(-20), b - L(14)], [X(-44), b - L(10)], [X(-56), b - L(2)], [X(-70), b - L(8)], 20);
    trazo(k, cola, pal[2], L(6), 1); for (let i = 0; i < 6; i++) { const [px, py] = Det6.bezier([X(-20), b - L(14)], [X(-44), b - L(10)], [X(-56), b - L(2)], [X(-70), b - L(8)], 6)[i]; k.poli([[px - 2, py - 2], [px, py - L(6)], [px + 2, py - 2]], pincho || pal[3]); }
    rellena(k, [[X(-24), b - L(10)], [X(-18), b - L(26)], [X(10), b - L(30)], [X(22), b - L(18)], [X(18), b - L(8)]], col);
    for (let i = 0; i < 5; i++) { const px = X(-16 + i * 7), py = b - L(27 + (i === 2 ? 2 : 0)); k.poli([[px - L(2), py + 1], [px, py - L(5)], [px + L(2), py + 1]], pincho || pal[3]); }
    [[-14], [12]].forEach(([d]) => { k.R(Math.min(X(d), X(d + 6)), b - L(10), L(6), L(10), pal[3]); k.R(Math.min(X(d - 1), X(d + 7)), b - L(2), L(8), L(2), pal[4]); });
    const S = [X(2), b - L(26)], E = [X(-14 - 20 * ala), b - L(40 + 40 * ala)], Pt = [X(12 + 10 * ala), b - L(52 + 40 * ala)], mid = (A, B, t, d) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t + L(d)];
    const M1 = mid(Pt, S, 0.3, 10), M2 = mid(Pt, S, 0.65, 8);
    rellena(k, [S, E, Pt, M1, mid(Pt, S, 0.48, 4), M2, S], (px, py) => rampa(pal, 0.25 + ((py - Pt[1]) / Math.max(1, S[1] - Pt[1])) * 0.35, px, py));
    trazo(k, [S, E, Pt], pal[4], Math.max(1, L(2))); trazo(k, [E, M1], pal[4], 1); trazo(k, [E, M2], pal[4], 1);
    const cuello = Det6.bezier([X(16), b - L(24)], [X(26), b - L(36)], [X(30), b - L(48)], [X(40), b - L(52)], 16);
    trazo(k, cuello, pal[1], L(7), L(5));
    rellena(k, [[X(36), b - L(56)], [X(54), b - L(54)], [X(56), b - L(48)], [X(40), b - L(46)]], col);
    k.poli([[X(38), b - L(56)], [X(32), b - L(64)], [X(42), b - L(57)]], pincho || pal[4]); k.poli([[X(44), b - L(56)], [X(42), b - L(64)], [X(48), b - L(56)]], pincho || pal[4]);
    k.crudo(X(46), b - L(53), Math.max(1, L(2)), Math.max(1, L(2)), "#ffd23f");
    trazo(k, [[X(-18), b - L(26)], [X(10), b - L(30)]], borde, 1); trazo(k, cuello.slice(0, 12).map(([px, py]) => [px, py - L(3)]), borde, 1); trazo(k, [[X(36), b - L(56)], [X(54), b - L(54)]], borde, 1);
    return [X(55), b - L(51)];
  }
  function llamarada(k, x0, y0, x1, y1, ancho, s) {
    const n = 30;
    for (let i = n; i >= 0; i--) {
      const f = i / n, x = x0 + (x1 - x0) * f + Math.sin(f * 7 + s) * 4 * f, y = y0 + (y1 - y0) * f, r = (1.5 + ancho * Math.pow(f, 0.8)) * (1 + 0.22 * Math.sin(f * 23 + s));
      k.alfa(0.5, () => k.elipse(x, y, r * 1.3, r * 1.05, "#e8502a")); k.elipse(x, y, r, r * 0.8, "#ff9a3a"); k.elipse(x, y, r * 0.6, r * 0.48, "#ffcf6a"); k.elipse(x, y, r * 0.28, r * 0.22, "#fff4c0");
    }
    for (let i = 0; i < 6; i++) k.alfa(0.22, () => k.elipse(x1 + (x1 - x0) * 0.06 * i + (hash(i, 4, s) - 0.5) * 10, y1 + (y1 - y0) * 0.05 * i - i * 2, ancho * (0.9 + i * 0.25), ancho * (0.6 + i * 0.15), "#6a5a52"));
    for (let i = 0; i < 40; i++) { const f = hash(i, 1, s), x = x0 + (x1 - x0) * f + (hash(i, 2, s) - 0.5) * ancho * 2.6 * f, y = y0 + (y1 - y0) * f + (hash(i, 3, s) - 0.5) * ancho * 2 * f; k.crudo(Math.round(x), Math.round(y), 1, 1, i % 3 ? "#ffcf6a" : "#fff4c0"); }
  }
  function dragonesRehecho(k) {
    const lit = encendido(k), Lz = [];
    k.banda(CIELO, 0, 108);
    if (lit > 0.4) for (let i = 0; i < 40; i++) k.crudo(hash(i, 1, 4701) * W, hash(i, 2, 4701) * 70, 1, 1, "#e8ecf4");
    for (let i = 0; i < 30; i++) { const x = i * 11 - 4 + hash(i, 1, 4702) * 6, y = 94 + hash(i, 2, 4702) * 10; copa(k, x, y, 10, 16, ["#2e4c36", "#24402c", "#1a3422", "#122818", "#0a1c10"], { r: 4, s: 4703 + i }); }
    [[8, 96], [24, 84], [296, 90], [312, 100]].forEach(([x, top], i) => { for (let j = 0; j < 6; j++) { const y = top + j * 12, w = 6 + j * 3; rellena(k, [[x - w, y + 14], [x, y], [x + w, y + 14]], (px, py) => rampa(["#24402c", "#1a3422", "#122818", "#0a1c10"], 0.3 + ((px - x + w) / (2 * w)) * 0.5, px, py)); } k.R(x - 1, top + 70, 3, 40, "#1e1612"); });
    T.rect(k, 0, 106, W, 74, (x, y) => rampa(["#8a7454", "#76623e", "#625232", "#4e4226", "#3a321c"], 0.2 + ((y - 106) / 74) * 0.35 + (fbm(x * 0.08, y * 0.1, 4704) - 0.5) * 0.35 - Math.max(0, 1 - Math.hypot((x - 176) / 120, (y - 150) / 40)) * 0.3, x, y));
    for (let x = -2; x < W; x += 9) { const hh = 22 + (x % 18 === 0 ? 3 : 0); T.rect(k, x, 122 - hh, 6, hh, madera(["#7a5a3a", "#5e442a", "#48341e", "#342414", "#22180c"], { paso: 2, vertical: true, largo: 99, s: 4705 + x })); k.poli([[x, 122 - hh], [x + 3, 118 - hh], [x + 6, 122 - hh]], "#5e442a"); }
    trazo(k, [[0, 110], [W, 108]], "#3a2a1a", 2); trazo(k, [[0, 117], [W, 116]], "#3a2a1a", 2);
    dragon(k, 70, 140, 0.6, ["#8ad08a", "#6ab06e", "#4e9054", "#38703e", "#24502a"], { ala: 0.2, mira: 1, s: 4706, borde: "#ffd090" });
    dragon(k, 262, 140, 0.58, ["#ff7a5a", "#e8503a", "#c0382a", "#90261e", "#601812"], { ala: 0.35, mira: -1, s: 4707, pincho: "#f0c050", borde: "#ffd890" });
    const boca = dragon(k, 182, 168, 1.05, ["#9a8e84", "#7a706a", "#5e5854", "#46423e", "#2c2a28"], { ala: 0.5, mira: -1, s: 4708, pincho: "#d8a65a", borde: "#ffb050" });
    [[[96, 112], [104, 160]], [[236, 112], [226, 160]], [[150, 120], [146, 176]]].forEach(([a, c]) => { trazo(k, [a, c], "#8a8a96", 1); k.R(c[0] - 1, c[1] - 6, 3, 7, "#4a3a2a"); });
    llamarada(k, boca[0] - 2, boca[1] - 2, 96, 44, 10, 4709);
    [[20, 168, 30, "#c8b890"], [298, 172, 32, "#b8a880"]].forEach(([x, b, w, c]) => { rellena(k, [[x - w / 2, b], [x, b - w * 0.8], [x + w / 2, b]], (px, py) => rampa([mezcla(c, "#ffffff", 0.2), c, mezcla(c, "#000000", 0.3), mezcla(c, "#000000", 0.5)], 0.15 + ((px - x + w / 2) / w) * 0.6, px, py)); trazo(k, [[x, b - w * 0.8], [x, b - w * 0.8 - 5]], "#4a3a2a", 1); k.poli([[x - 4, b], [x, b - w * 0.42], [x + 4, b]], "#ffcf6a"); Lz.push({ x, y: b - 6, r: 26, ry: 14, col: "#ffcf7a", f: 0.6 }); });
    [[42, 132], [112, 130], [240, 130], [296, 132]].forEach(([x, y]) => Lz.push(T.antorcha(k, x, y, { r: 30 })));
    luces(k, [...Lz, { x: 120, y: 70, r: 120, ry: 80, col: "#ffb050", f: 0.8 }, { x: 170, y: 128, r: 150, ry: 56, col: "#ff9a3a", f: 0.8 }]);
  }
  MAG[45] = ["Los dragones de noche", "El claro del bosque donde Higrad enseña los dragones, con su fuego en la noche", dragonesRehecho, { tinte: 0.2, fuego: ["#fff4c0", "#ffcf6a", "#ff9a3a", "#e8502a", "#ffd23f"] }];
})();

(function () {
  const { trama, rampa, rellena, esfera, cilindro, nubarron, cirros, reflejo, espuma, montana, ventanaArco, bandera, catenaria, rotulo, brillo } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, madera, ladrillo, suelo3d, tablones, briznas, pase, sombra, sombraE, luces, espejo, rayos, encendido } = Det6;
  const T = window.P15;
  const W = 320, H = 180;
  window.SitiosIt27 = window.SitiosIt27 || {};
  const MAG = (window.SitiosIt27.magos = window.SitiosIt27.magos || {});
  const VEN = ["#ffd27a"], CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const ORO = ["#ffe08a", "#e8c35a", "#c9a03c", "#a8842e", "#7a5f20"];

  const tonos5 = (c, l = 0.24, o = 0.5) => [mezcla(c, "#ffffff", l), mezcla(c, "#ffffff", l / 2), c, mezcla(c, "#000000", o / 2), mezcla(c, "#000000", o)];
  const grano = (k, x0, y0, x1, y1, s, f = 16, dentro = null) => pase(k, (x, y, d, i) => { if (dentro && !dentro(x, y)) return; const v = (fbm(x * 0.32, y * 0.32, s) - 0.5) * f; d[i] += v; d[i + 1] += v * 0.92; d[i + 2] += v * 0.8; }, x0, y0, x1, y1);
  const granoMonte = (k, cx, base, w, h, s, f = 14) => grano(k, cx - w / 2, base - h, cx + w / 2, base, s, f, (x, y) => Math.abs(x - cx) < (w / 2) * ((y - (base - h)) / h) * 0.96);
  const sillar = (pal, { ah = 6, an = 12, s = 1, x0 = 0, y0 = 0 } = {}) => { const n = pal.length - 1; return (x, y) => {
    const yy = Math.round(y - y0), f = Math.floor(yy / ah), v = yy - f * ah, xx = Math.round(x - x0) + (((f % 2) + 2) % 2) * Math.round(an / 2), c = Math.floor(xx / an), u = xx - c * an;
    if (v === 0 || u === 0) return pal[n];
    return rampa(pal, 0.3 + (hash(c, f, s) - 0.5) * 0.3 + (v === 1 || u === 1 ? -0.18 : 0) + (v === ah - 1 || u === an - 1 ? 0.16 : 0) + (hash(x, y, s + 1) - 0.5) * 0.1, x, y);
  }; };
  const glifo = (k, x, y, filas, col) => filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch === "1") k.P(x + i, y + j, typeof col === "function" ? col(i, j) : col); }));
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);

  function torreR(k, x, base, w, h, alto, { pal, techo, ven = "#ffd27a", paso = 9, s = 1, nieve = null } = {}) {
    const n = pal.length - 1, top = base - h, t0 = Math.floor(top), c = x + w / 2, vs = [];
    for (let py = t0; py < base; py++) {
      const fila = Math.floor((py - t0) / 3), junta = (py - t0) % 3 === 0;
      for (let px = Math.floor(x); px < x + w; px++) {
        const t = (px - x) / Math.max(1, w - 1), b = Math.floor((px - x + (fila % 2) * 2) / 4);
        k.P(px, py, rampa(pal, Math.abs(t - 0.3) * 1.2 + (hash(b, fila, s) - 0.5) * 0.18 + (junta ? 0.2 : 0) + (hash(px, py, s + 1) - 0.5) * 0.06, px, py));
      }
    }
    if (ven) for (let y = top + 5; y < base - 4; y += paso) { const vx = Math.round(c - 1), vy = Math.round(y); k.R(vx - 1, vy - 1, 4, 5, pal[n]); k.R(vx, vy - 2, 2, 1, pal[n]); k.R(vx, vy, 2, 3, ven); k.R(vx - 1, vy + 4, 4, 1, pal[1]); vs.push([vx + 1, vy + 1]); }
    k.R(x - 1, top, w + 2, 2, pal[n]); k.R(x - 1, top, w + 2, 1, pal[Math.max(0, n - 2)]); for (let px = Math.round(x); px < x + w; px += 2) k.P(px, top + 2, pal[n]);
    for (let i = 0; i < alto; i++) {
      const a = ((alto - i) / alto) * (w / 2 + 2), y = Math.round(base - h - 1 - i);
      for (let px = Math.round(c - a); px <= c + a; px++) { const u = (px - c) / (a + 0.01); k.P(px, y, rampa(techo, 0.06 + Math.abs(u + 0.45) * 0.6 + (i % 2 === 0 ? 0.12 : 0) + ((px + (i >> 1)) % 3 === 0 && i % 2 ? 0.08 : 0), px, y)); }
    }
    k.R(c - 0.5, base - h - alto - 3, 1, 3, techo[techo.length - 1]);
    if (nieve) { k.poli([[c - 2, base - h - alto * 0.5], [c, base - h - alto], [c + 2, base - h - alto * 0.5]], nieve); k.R(x - 2, base - h - 1, w + 4, 1, nieve); }
    return vs;
  }
  const PIEDRA = ["#8a8ca4", "#6e7090", "#5e6078", "#44465c", "#34364c"], PIZ = ["#5c66a0", "#4a5488", "#3a4270", "#2f3560", "#22264a"];
  function castillo27(k, base, { e = 1, pal = PIEDRA, techo = PIZ, ven = "#ffd27a", s = 1 } = {}) {
    const n = pal.length - 1, X = (x) => 160 + (x - 160) * e, vs = [];
    const t = (x, w, h, a, i) => vs.push(...torreR(k, X(x), base, w * e, h * e, a * e, { pal, techo, ven, paso: 11, s: s + i }));
    t(62, 12, 48, 20, 1); t(100, 12, 66, 24, 2); t(216, 12, 72, 26, 3); t(252, 12, 52, 20, 4);
    const mx = X(52), mw = 216 * e, mt = base - 30 * e;
    rellena(k, [[mx, mt], [mx + mw, mt], [mx + mw, base], [mx, base]], (px, py) => { const cc = celdas(px, py, 6, 3, s + 20, 0.45); if (cc.borde < 0.1) return pal[n]; return rampa(pal, Math.abs((px - mx) / mw - 0.22) * 1.1 + (cc.id - 0.5) * 0.22 + cc.dy * 0.2 + (py < mt + 2 ? 0.25 : 0), px, py); });
    for (let px = mx; px < mx + mw; px += 7) { k.R(px, mt - 3, 4, 3, pal[1]); k.R(px, mt - 3, 4, 1, pal[0]); k.R(px + 3, mt - 3, 1, 3, pal[3]); }
    const g0 = X(110), g1 = X(196), gb = base - 34 * e, gt = base - 58 * e, rt = base - 74 * e;
    rellena(k, [[g0, gb], [g0, gt], [g1, gt], [g1, gb]], (px, py) => { const cc = celdas(px, py, 5, 3, s + 21, 0.4); return cc.borde < 0.1 ? pal[n] : rampa(pal, 0.14 + ((px - g0) / (g1 - g0)) * 0.6 + (cc.id - 0.5) * 0.18, px, py); });
    for (let x = 116; x < 186; x += 13) { k.R(X(x) + 6 * e + 1, gt + 2, 2, gb - gt - 2, pal[1]); k.R(X(x) + 6 * e + 3, gt + 2, 1, gb - gt - 2, pal[3]); }
    rellena(k, [[X(104), gt], [X(202), gt], [X(192), rt], [X(114), rt]], (px, py) => rampa(techo, 0.18 + (px > X(156) ? 0.34 : 0) + (Math.round(py - rt) % 2 === 0 ? 0.12 : 0) + ((px + Math.floor((py - rt) / 2) * 2) % 4 === 0 ? 0.06 : 0) + (hash(px, py, s + 22) - 0.5) * 0.08, px, py));
    k.R(X(114), rt, X(192) - X(114), 1, techo[0]); k.R(X(104), gt - 1, X(202) - X(104), 1, techo[4]);
    if (ven) for (let x = 116; x < 192; x += 13) { ventanaArco(k, X(x), base - 54 * e, 6 * e, 16 * e, pal[n], ven); k.R(X(x), base - 54 * e + 9 * e, 6 * e, 1, pal[n]); k.R(X(x) - 1, base - 38 * e, 6 * e + 2, 1, pal[1]); vs.push([X(x) + 3 * e, base - 46 * e]); }
    t(84, 18, 76, 26, 5); t(140, 20, 92, 28, 6); t(176, 16, 80, 24, 7); t(232, 20, 84, 28, 8); t(120, 12, 62, 22, 9); t(204, 12, 58, 22, 10);
    for (let x = 56; x < 262; x += 15) { const ax = X(x), aw = 10 * e, ay = base - 8 * e; k.elipse(ax + aw / 2, ay, aw / 2 + 1, 6 * e + 1, pal[2]); k.R(ax - 1, ay, aw + 2, 8 * e, pal[2]); k.elipse(ax + aw / 2, ay, aw / 2, 6 * e, "#22243a"); k.R(ax, ay, aw, 8 * e, "#22243a"); k.R(ax + aw / 2 - 0.5, ay - 6 * e - 1, 1, 1, pal[0]); }
    if (ven) for (let x = 62; x < 258; x += 11) { k.R(X(x) - 1, base - 24 * e - 1, 3 * e + 2, 5 * e + 2, pal[n]); k.R(X(x), base - 24 * e, 3 * e, 5 * e, ven); }
    return vs;
  }
  const NIEVE = ["#ffffff", "#f4f8fc", "#e4ecf4", "#d4dee8", "#bccad8"];
  function casaT27(k, x, base, w, h, { pared = "#e8dcc0", viga = "#4a3428", techo = "#7a5a4a", techoO = "#5e4436", nieve = false, ven = "#ffd27a", puerta = "#5a3a22", chimenea = true, lad = 0, s = 1, luz = 1 } = {}) {
    const top = base - h, a = Math.round(w * 0.46) + 3, pm = x + w / 2, L = [];
    const PW = tonos5(pared, 0.22, 0.36), VG = tonos5(viga, 0.22, 0.5), TJ = [mezcla(techo, "#ffffff", 0.15), techo, mezcla(techo, techoO, 0.5), techoO, mezcla(techoO, "#000000", 0.35)];
    if (chimenea) { const cx = Math.round(x + w * 0.68), ch = Math.round(a * 0.9); T.rect(k, cx, top - ch, 6, ch, ladrillo(["#8a6058", "#7a5048", "#6a4a40", "#54382e", "#3a2620"], { w: 3, h: 2, s: s + 1 })); k.R(cx - 1, top - ch - 1, 8, 2, "#4a3430"); k.R(cx - 1, top - ch - 1, 8, 1, "#6a4a40"); k.R(cx + 1, top - ch - 3, 2, 2, "#9a6a4a"); k.R(cx + 4, top - ch - 3, 1, 2, "#8a5a3a"); if (nieve) k.R(cx - 1, top - ch - 2, 8, 1, "#f4f8fc"); }
    rellena(k, [[x, base], [x + lad, top], [x + w + lad, top], [x + w, base]], (px, py) => { const f = (base - py) / h, ex = px - lad * f; if (ex > x + w - 3) return VG[3]; return rampa(PW, 0.16 + (fbm(px * 0.35, py * 0.35, s + 2) - 0.5) * 0.36 + (py < top + 3 ? 0.36 : 0) + (base - py < 3 ? 0.2 : 0) + ((ex - x) / w) * 0.16 + (hash(px, py, s + 3) - 0.5) * 0.06, px, py); });
    const hz = (yy, xx, ww) => { k.R(xx, yy, ww, 2, VG[2]); k.R(xx, yy, ww, 1, VG[1]); };
    hz(base - 2, x, w); hz(top, x + lad, w); hz(top + h * 0.5, x + lad * 0.5, w);
    [0.02, 0.5, 0.96].forEach((f) => { k.linea(x + w * f, base, x + w * f + lad, top, VG[2], 2); k.linea(x + w * f, base, x + w * f + lad, top, VG[1]); });
    k.linea(x + 2, base - 2, x + w * 0.5 - 1, top + h * 0.5, VG[2], 2); k.linea(x + w - 2, base - 2, x + w * 0.5 + 1, top + h * 0.5, VG[2], 2);
    [x + w * 0.1, x + w * 0.6].forEach((vx0) => {
      const vx = Math.round(vx0 + lad * 0.7), vy = Math.round(top + 4), plomo = mezcla(VG[3], ven, 0.2);
      k.R(vx, vy, 9, 8, VG[3]); k.R(vx, vy, 9, 1, VG[2]);
      for (let gy = 0; gy < 6; gy++) for (let gx = 0; gx < 7; gx++) k.P(vx + 1 + gx, vy + 1 + gy, (gx + gy) % 4 === 0 || (gx - gy + 12) % 4 === 0 ? plomo : ven);
      k.R(vx + 4, vy + 1, 1, 6, VG[3]); k.R(vx + 1, vy + 3, 7, 1, VG[3]);
      k.R(vx - 1, vy + 8, 11, 1, nieve ? "#f4f8fc" : VG[1]);
      L.push({ x: vx + 4, y: vy + 4, r: 16, ry: 12, col: "#ffcf7a", f: luz });
    });
    const dx = Math.round(pm - 4);
    k.R(dx, base - 12, 8, 12, VG[3]); T.rect(k, dx + 1, base - 11, 6, 11, madera(tonos5(puerta, 0.2, 0.5), { paso: 2, vertical: true, largo: 99, s: s + 4 }));
    k.R(dx + 1, base - 11, 6, 1, VG[4]); k.R(dx + 1, base - 8, 3, 1, "#26262a"); k.R(dx + 1, base - 4, 3, 1, "#26262a"); k.P(dx + 5, base - 5, "#e8c35a");
    k.R(dx - 1, base, 10, 1, nieve ? "#e4ecf4" : "#8a8478");
    const ax = pm + lad * 1.4, ay = top - a, bx = pm + 3 + lad, by = top + 1;
    rellena(k, [[x - 4 + lad, top + 1], [x + w + 4 + lad, top + 1], [ax, ay]], (px, py) => {
      const xl = ax + ((bx - ax) * (py - ay)) / (by - ay), der = px > xl, ty = py - ay, f = Math.floor(ty / 3), tt = ty - f * 3, c = Math.floor((px + (f % 2) * 2.5) / 5);
      return rampa(TJ, 0.12 + (der ? 0.42 : 0) + (tt >= 2 ? 0.22 : 0) + (hash(c, f, s + 5) - 0.5) * 0.2 + (hash(px, py, s + 6) - 0.5) * 0.06, px, py);
    });
    k.linea(x - 4 + lad, top + 1, ax, ay, TJ[0]); k.R(x - 4 + lad, top + 1, w + 8, 1, TJ[4]);
    if (nieve) {
      rellena(k, [[x - 5 + lad, top + 1], [x + w + 5 + lad, top + 1], [ax, ay - 1]], (px, py) => { const xl = ax + ((bx - ax) * (py - ay)) / (by - ay); return rampa(NIEVE, (px > xl ? 0.5 : 0.04) + (fbm(px * 0.3, py * 0.5, s + 7) - 0.5) * 0.3 + (py > top - 1 ? 0.22 : 0), px, py); });
      for (let i = Math.round(x - 4); i < x + w + 4; i++) { if (hash(i, 1, s + 8) < 0.4) k.P(i + lad, top + 2, "#f4f8fc"); const l = Math.floor(hash(i, 2, s + 8) * 4); if (l > 1 && i % 2 === 0) { k.R(i + lad, top + 2, 1, l, "#c8dcec"); k.P(i + lad, top + 1 + l, "#ffffff"); } }
    }
    sombraE(k, pm + 2, base + 1, w * 0.62, 2.5, 0.32);
    return L;
  }
  function tumba27(k, x, b, w, h, c = ["#868a94", "#6a6e78", "#4a4e58"], nieve = false, s = 1) {
    const P = [mezcla(c[0], "#ffffff", 0.14), c[0], c[1], c[2], mezcla(c[2], "#000000", 0.3)];
    if (!nieve) sombraE(k, x + w / 2 + 2, b + 1, w * 0.75, 2, 0.4);
    rellena(k, [[x, b], [x, b - h + w / 2], [x + w * 0.16, b - h + w * 0.12], [x + w / 2, b - h], [x + w * 0.84, b - h + w * 0.12], [x + w, b - h + w / 2], [x + w, b]], (px, py) => rampa(P, 0.08 + ((px - x) / w) * 0.72 + (fbm(px * 0.4, py * 0.4, s) - 0.5) * 0.36 + (hash(px, py, s + 1) - 0.5) * 0.08, px, py));
    k.R(x, b - h + w / 2, 1, h - w / 2, P[0]);
    for (let j = 0; j < 3; j++) { const y = Math.round(b - h * 0.62 + j * h * 0.13), x0 = Math.round(x + 3), x1 = Math.round(x + w - 3 - (j === 2 ? 2 : 0)); if (x1 > x0) { k.R(x0, y, x1 - x0, 1, P[3]); k.R(x0, y + 1, x1 - x0, 1, P[1]); } }
    if (hash(Math.round(x), Math.round(b), s) > 0.5) trazo(k, [[x + w * 0.7, b - h + 3], [x + w * 0.6, b - h * 0.6], [x + w * 0.66, b - h * 0.4]], P[4], 1);
    if (nieve) { k.elipse(x + w / 2, b - h + 1, w / 2, 2, "#ffffff"); k.R(x + 1, b - h + 2, w - 2, 1, "#e4ecf4"); k.elipse(x + w / 2, b, w, 2, "#ffffff"); }
    else for (let i = 0; i < w; i++) if (hash(i, 3, s) < 0.6) k.P(x + i, b - 1 - Math.floor(hash(i, 4, s) * 3), ["#4a6a3a", "#5a7a48", "#3a5a30"][i % 3]);
  }
  function marca27(k, x, y) {
    const V = ["#d8ffe8", "#a8ffc8", "#3fe87a", "#24b45a", "#0f3a22"], C = (px, py, w, h, col) => k.crudo(px, py, w, h, col);
    const elC = (cx, cy, rx, ry, col) => { for (let py = Math.floor(cy - ry); py <= cy + ry; py++) { const w = rx * Math.sqrt(Math.max(0, 1 - ((py - cy) / ry) ** 2)); C(cx - w, py, 2 * w, 1, col); } };
    k.halo(x, y + 8, 42, 44, "#3fe87a", 0.28);
    for (let py = Math.floor(y - 12); py <= y + 16; py++) for (let px = Math.floor(x - 13); px <= x + 13; px++) {
      const dc = Math.hypot((px - x) / 13, (py - y) / 12), mand = py >= y + 6 && Math.abs(px - x) <= 8.5 - (py - y - 6) * 0.15;
      if (dc > 1 && !mand) continue;
      C(px, py, 1, 1, V[Math.min(3, Math.floor((0.1 + (Math.hypot(px - x + 5, py - y + 5) / 26) * 0.9) * 4))]);
    }
    elC(x - 5, y - 1, 3, 4, V[4]); elC(x + 5, y - 1, 3, 4, V[4]); C(x - 6, y - 3, 1, 1, V[3]); C(x + 4, y - 3, 1, 1, V[3]);
    C(x - 1, y + 5, 3, 3, V[4]); C(x - 7, y + 10, 15, 1, V[4]); for (let i = 0; i < 4; i++) C(x - 6 + i * 4, y + 11, 1, 5, V[4]);
    for (let t = 0; t < 40; t++) { const sx = x + Math.sin(t / 5) * (4 + t * 0.35), sy = y + 16 + t * 0.7; C(sx, sy, 3, 3, t % 4 < 2 ? V[2] : V[1]); C(sx + 2, sy + 1, 1, 2, V[3]); }
    const hx = x + Math.sin(39 / 5) * 18, hy = y + 44; elC(hx, hy, 4, 3, V[2]); C(hx - 2, hy - 1, 1, 1, V[4]); C(hx + 2, hy - 1, 1, 1, V[4]); C(hx - 1, hy + 3, 1, 2, "#e8402a");
  }
  const PINO = ["#5a9a6a", "#3f7a55", "#2f6a48", "#23503a", "#183a2a", "#0f2a1e"];
  function abeto(k, x, base, h, pal = PINO, { nieve = null, s = 1, tronco = "#3a2a20" } = {}) {
    sombraE(k, x + 3, base + 1, h * 0.35, 2, 0.35);
    k.R(x - 1, base - 5, 3, 5, tronco); k.P(x - 1, base - 5, mezcla(tronco, "#ffffff", 0.2));
    const pisos = Math.max(2, Math.round(h / 13)), y0 = base - h - 3;
    for (let p = pisos - 1; p >= 0; p--) {
      const pt = y0 + (p / pisos) * h * 0.82, pb = y0 + ((p + 1) / pisos) * h + 1, wb = 1 + ((pb - y0) / h) * h * 0.6;
      for (let py = Math.floor(pt); py < pb; py++) {
        const f = (py - pt) / (pb - pt), ww = 1 + f * wb;
        for (let px = Math.round(x - ww); px <= x + ww; px++) {
          const u = (px - x) / ww;
          if (Math.abs(u) > 0.78 && hash(px, py, s) < 0.45) continue;
          if (nieve && f < 0.55 && hash(px, py, s + 2) < (1 - f * 1.6) * (u < 0.25 ? 0.95 : 0.35)) { k.P(px, py, nieve[u < -0.2 ? 0 : 1]); continue; }
          k.P(px, py, rampa(pal, 0.12 + (u + 1) * 0.27 + (1 - f) * 0.28 + (hash(px >> 1, py, s + 1) - 0.5) * 0.26, px, py));
        }
      }
    }
  }
  function jaula(k, x, b, lechuza = ["#ffffff", "#f4efe0", "#d8d0ba"]) {
    sombraE(k, x + 6, b + 1, 7, 1.6, 0.4);
    esfera(k, x + 5, b - 5, 2.5, 3.5, lechuza); k.P(x + 4, b - 7, "#e8b83a"); k.P(x + 6, b - 7, "#e8b83a"); k.P(x + 5, b - 6, "#5a4a2a"); if (lechuza[0] === "#ffffff") { k.P(x + 4, b - 4, "#5a5a64"); k.P(x + 6, b - 3, "#5a5a64"); }
    for (let px = x; px <= x + 10; px += 2) k.R(px, b - 11, 1, 10, px === x || px === x + 10 ? "#8a6a24" : "#c9a03c");
    k.elipse(x + 5, b - 11, 5, 2, "#c9a03c"); k.elipse(x + 5, b - 12, 4, 1, "#e8c35a"); k.R(x + 4, b - 15, 3, 1, "#c9a03c"); k.P(x + 4, b - 14, "#c9a03c"); k.P(x + 6, b - 14, "#c9a03c");
    k.R(x - 1, b - 1, 12, 2, "#8a6a24"); k.R(x - 1, b - 1, 12, 1, "#e8c35a");
  }
  function vapor(k, cx, cy, r, a = 0.6, s = 707) {
    const V = ["#ffffff", "#f4f4f0", "#e2e4e4", "#ccd0d4", "#b0b6bc"];
    k.alfa(a, () => {
      for (let y = Math.floor(cy - r); y <= cy + r; y++) for (let x = Math.floor(cx - r * 1.3); x <= cx + r * 1.3; x++) {
        const d = Math.hypot((x - cx) / 1.3, y - cy) / r, borde = 1 - (fbm(x * 0.2, y * 0.2, s) - 0.5) * 0.4;
        if (d > borde || (d > borde - 0.14 && trama(x, y) > 0.5)) continue;
        k.P(x, y, rampa(V, 0.04 + (Math.hypot(x - cx + r * 0.5, y - cy + r * 0.6) / (r * 2.2)) * 0.9, x, y));
      }
    });
  }
  window.MAG27 = { tonos5, grano, granoMonte, sillar, glifo, rotuloG, torreR, castillo27, casaT27, tumba27, marca27, abeto, jaula, vapor, NIEVE, PIEDRA, PIZ, PINO, ORO };

  const MARMOL = ["#ffffff", "#f6f2e8", "#e8e2d4", "#d4ccbc", "#b8b0a0", "#9a9284"];
  const marmol = (x, y, v, s) => rampa(MARMOL, v + (fbm(x * 0.12, y * 0.12, s) - 0.5) * 0.24 + (Math.abs(fbm(x * 0.05 + y * 0.03, y * 0.06, s + 1) - 0.5) < 0.02 ? 0.3 : 0) + (hash(x, y, s + 2) - 0.5) * 0.05, x, y);
  function escaparate(k, i, x, y, w, h) {
    const b = y + h;
    if (i === 0) [b - 9, b - 1].forEach((sy, j) => { k.R(x, sy, w, 1, "#5a3a22"); for (let fx = x + 2 + j * 2; fx < x + w - 3; fx += 5) { const col = ["#3f8a58", "#8f55d8", "#c0392b", "#2f6fa8", "#e8a83a"][Math.floor(hash(fx, j, 650) * 5)], hh = 4 + Math.floor(hash(fx, j, 651) * 3); k.R(fx, sy - hh, 3, hh, col); k.R(fx, sy - hh, 1, hh - 1, mezcla(col, "#ffffff", 0.35)); k.P(fx + 1, sy - hh - 1, "#d8c8a8"); } });
    else if (i === 1) for (let fx = x + 5; fx < x + w - 4; fx += 10) { const col = ["#26262a", "#5a1a2a", "#2a2a5a"][(fx >> 3) % 3]; k.poli([[fx - 4, b], [fx + 4, b], [fx + 2, b - 11], [fx - 2, b - 11]], col); k.R(fx - 3, b - 11, 7, 1, mezcla(col, "#ffffff", 0.22)); k.R(fx, b - 10, 1, 9, mezcla(col, "#ffffff", 0.12)); k.R(fx - 1, b - 14, 3, 3, "#c8b8a0"); k.R(fx, b - 15, 1, 1, "#8a7a60"); }
    else if (i === 2) { for (let fx = x + 1; fx < x + w - 9; fx += 8) for (let j = 0; j < 4; j++) { const col = ["#6a4426", "#8a5a32", "#4a2e18", "#a87444"][(fx + j) % 4]; k.R(fx + (j % 2), b - 3 - j * 3, 7, 2, col); k.R(fx + (j % 2), b - 3 - j * 3, 7, 1, mezcla(col, "#ffffff", 0.25)); k.P(fx + 5 + (j % 2), b - 2 - j * 3, "#e8c35a"); } k.R(x + w - 8, b - 6, 7, 2, "#5a1a2a"); k.R(x + w - 8, b - 7, 7, 1, "#8f2a3a"); k.linea(x + w - 8, b - 8, x + w - 2, b - 10, "#3a2a1a"); k.P(x + w - 2, b - 10, "#e8e0c8"); }
    else if (i === 3) { for (let fx = x + 1; fx < x + w - 10; fx += 7) { let yy = b; for (let j = 0; j < 3 + ((fx >> 2) % 2); j++) { const col = ["#8f1d22", "#2f6a4a", "#2a4a8a", "#c9a03c", "#6a3f9a"][(fx + j * 3) % 5]; k.R(fx + (j % 2), yy - 2, 6, 2, col); k.R(fx + (j % 2), yy - 2, 6, 1, mezcla(col, "#ffffff", 0.3)); yy -= 2; } } const ox = x + w - 9; k.poli([[ox, b - 6], [ox + 4, b - 8], [ox + 8, b - 6], [ox + 8, b - 1], [ox, b - 1]], "#f4efe0"); k.R(ox + 4, b - 8, 1, 7, "#c8bea8"); k.R(ox + 1, b - 5, 2, 1, "#8a8478"); k.R(ox + 5, b - 5, 2, 1, "#8a8478"); }
    else if (i === 4) { k.linea(x + 5, b - 3, x + w - 5, b - 16, "#6a4426", 2); k.linea(x + 5, b - 4, x + w - 5, b - 17, "#a87444"); for (let j = 0; j < 5; j++) k.linea(x + 5, b - 3, x + 1 + j, b - j * 0.6, j % 2 ? "#c9a03c" : "#a8842e"); k.R(x + 4, b - 5, 2, 3, "#5a3a22"); esfera(k, x + w - 7, b - 4, 3, 3, ["#e0604a", "#c0392b", "#8f1d22"]); }
    else { k.R(x + 1, b - 8, w - 2, 1, "#5a3a22"); for (let fx = x + 4; fx < x + w - 3; fx += 8) { const col = [["#f4f1e8", "#c8c2b4"], ["#a87a4a", "#6a4a2a"], ["#8a8a90", "#5a5a62"]][(fx >> 3) % 3]; esfera(k, fx, b - 12, 3, 4, [col[0], col[0], col[1]]); k.P(fx - 1, b - 13, "#e8b83a"); k.P(fx + 1, b - 13, "#e8b83a"); k.P(fx, b - 12, "#5a4a2a"); k.R(fx - 1, b - 8, 1, 1, "#3a2a1a"); k.R(fx + 1, b - 8, 1, 1, "#3a2a1a"); } }
  }
  function daigon(k) {
    const lit = encendido(k), L = [], base = 130;
    k.banda(["#5a6a9a", "#7a8ab0", "#a8b4c8"], 0, 134);
    const NU = ["#d8dee8", "#b8c2d0", "#8a96a8"]; nubarron(k, -16, 6, 110, 8, NU); nubarron(k, 200, 4, 120, 8, NU);
    const AD = ["#b8b2a2", "#a49e90", "#8e887a", "#7a7466", "#666052", "#524e42"];
    for (let y = 112, fila = 0, al = 1; y < base; y += Math.round(al), al += 0.25, fila++) {
      const ha = Math.max(1, Math.round(al)), wd = 3 + ha * 2, off = (fila % 2) * Math.round(wd / 2);
      for (let py = y; py < Math.min(base, y + ha); py++) for (let x = 126; x < 194; x++) { const c = Math.floor((x + off) / wd), u = x + off - c * wd; k.P(x, py, py === y || u === 0 ? AD[5] : rampa(AD, 0.3 + (hash(c, fila, 600) - 0.5) * 0.3 + ((py - y) / ha) * 0.3, x, py)); }
    }
    rellena(k, [[136, 112], [132, 34], [190, 30], [186, 112]], (x, y) => marmol(x, y, 0.08 + ((x - 132) / 58) * 0.5, 601));
    rellena(k, [[137, 100], [136, 41], [187, 37], [186, 100]], (x, y) => marmol(x, y, 0.5 + ((x - 136) / 51) * 0.3, 602));
    [[155, 160], [165, 170]].forEach(([a, b]) => { T.rect(k, a, 76, b - a, 24, (x, y) => rampa(["#d8a04a", "#b8823a", "#a8742a", "#7a4f1a", "#5a3a12"], 0.25 + ((x - a) / (b - a)) * 0.5 + ((y - 76) % 8 === 0 ? 0.3 : 0), x, y)); k.R(a, 76, b - a, 1, "#5a3a12"); k.P(b - 2, 88, "#e8c35a"); });
    for (let cx = 140; cx < 184; cx += 10) {
      for (let y = 41; y < 97; y++) for (let x = cx; x < cx + 5; x++) k.P(x, y, marmol(x, y, Math.abs((x - cx) / 4 - 0.3) * 0.7 + ((x - cx) % 2 === 1 ? 0.12 : 0), 603));
      k.R(cx - 1, 38, 7, 3, MARMOL[1]); k.R(cx - 1, 40, 7, 1, MARMOL[3]); k.R(cx - 1, 97, 7, 3, MARMOL[2]); k.R(cx - 1, 99, 7, 1, MARMOL[4]);
    }
    rellena(k, [[132, 34], [190, 30], [190, 36], [132, 40]], (x, y) => marmol(x, y, 0.1, 604));
    for (let x = 134; x < 189; x += 3) k.R(x, Math.round(39 - ((x - 132) * 4) / 58), 2, 1, MARMOL[4]);
    k.poli([[128, 34], [194, 30], [162, 12]], MARMOL[1]); k.poli([[162, 12], [194, 30], [168, 31]], MARMOL[3]);
    rellena(k, [[138, 32], [186, 29], [162, 17]], (x, y) => marmol(x, y, 0.4, 605));
    k.linea(128, 34, 162, 12, MARMOL[0]); k.linea(162, 12, 194, 30, MARMOL[4]); esfera(k, 162, 26, 3, 3, ORO); k.P(161, 25, "#ffe08a");
    [[136, 100, 50], [134, 104, 54], [132, 108, 58]].forEach(([x, y, w]) => { T.rect(k, x, y, w, 4, (px, py) => marmol(px, py, py === y ? 0.02 : 0.34, 606)); k.R(x, y + 3, w, 1, MARMOL[4]); });
    const TIENDAS = [[0, 52, 92, "#7a4a3a", "#c0392b", "POTIONS"], [48, 46, 104, "#4a5a7a", "#c9a03c", "ROBES"], [90, 44, 84, "#6a7a4a", "#2f5fa8", ""], [186, 44, 88, "#8a6a3a", "#c0392b", ""], [226, 46, 106, "#4a6a6a", "#c9a03c", "BROOMS"], [270, 52, 94, "#8a4a4a", "#2f5fa8", "OWLS"]];
    const TJ = ["#5a5068", "#4a4058", "#3a3040", "#2a2230", "#1e1824"];
    TIENDAS.forEach(([x, w, h, c, sc, nombre], i) => {
      const top = base - h, inc = i < 3 ? 6 : -6, lean = (py) => (inc * (base - py)) / h, P = tonos5(c, 0.22, 0.6), S = tonos5(sc, 0.25, 0.55);
      rellena(k, [[x, base], [x + w, base], [x + w + inc, top], [x + inc, top]], (px, py) => {
        const ex = px - lean(py), u = (ex - x) / w, ao = Math.max(0, 0.16 - u * 0.5) + Math.max(0, (u - 0.82) * 0.9) + (py < top + 6 ? 0.22 : 0) + u * 0.16;
        if (i % 2 === 0) { const f = Math.floor(py / 3), bx = ex + (f % 2) * 3, ci = Math.floor(bx / 6); if (py % 3 === 0 || Math.floor(bx) % 6 === 0) return P[4]; return rampa(P, 0.16 + (hash(ci, f, 610 + i) - 0.5) * 0.34 + ao, px, py); }
        const cc = celdas(ex, py, 9, 5, 610 + i, 0.35); if (cc.borde < 0.1) return P[4];
        return rampa(P, 0.18 + (cc.id - 0.5) * 0.28 + cc.dy * 0.22 + ao + (hash(px, py, 7) - 0.5) * 0.08, px, py);
      });
      const ax = x + w / 2 + inc * 1.8, ay = top - 18, mx = x + w / 2 + inc;
      rellena(k, [[x - 4 + inc, top + 1], [x + w + 4 + inc, top + 1], [ax, ay]], (px, py) => { const xl = ax + ((mx - ax) * (py - ay)) / (top + 1 - ay), ty = py - ay, f = Math.floor(ty / 3); return rampa(TJ, 0.1 + (px > xl ? 0.4 : 0) + (ty - f * 3 === 2 ? 0.2 : 0) + (hash(Math.floor((px + (f % 2) * 2.5) / 5), f, 620 + i) - 0.5) * 0.18, px, py); });
      k.linea(x - 4 + inc, top + 1, ax, ay, TJ[0]); k.R(x - 4 + inc, top + 1, w + 8, 1, TJ[4]); k.R(x - 3 + inc, top + 2, w + 6, 1, "#6a6a72");
      if (i === 1 || i === 4) { const dx = Math.round(x + w / 2 + inc * 1.3 - 4), dy = top - 9; k.R(dx, dy, 8, 8, P[2]); k.poli([[dx - 2, dy + 1], [dx + 10, dy + 1], [dx + 4, dy - 5]], TJ[1]); k.poli([[dx + 4, dy - 5], [dx + 10, dy + 1], [dx + 5, dy + 1]], TJ[3]); k.R(dx + 2, dy + 2, 4, 5, "#ffd27a"); k.R(dx + 4, dy + 2, 1, 5, P[4]); k.R(dx + 1, dy + 7, 6, 1, P[0]); }
      const chx = Math.round(x + w * 0.2 + inc * 0.6); T.rect(k, chx, top - 16, 6, 16, ladrillo(["#7a6a6a", "#6a5a5a", "#5a4a4a", "#4a3a3a", "#2e2424"], { w: 3, h: 2, s: 630 + i })); k.R(chx - 1, top - 17, 8, 2, "#3a2e2e"); k.R(chx - 1, top - 17, 8, 1, "#6a5a5a"); k.R(chx + 1, top - 19, 2, 2, "#9a6a4a"); k.R(chx + 4, top - 19, 1, 2, "#8a5a3a");
      for (let y = top + 9; y < base - 54; y += 15) for (let v = x + 8; v < x + w - 8; v += 14) {
        const vx = Math.round(v + lean(y)), vy = Math.round(y), cort = ["#8f1d22", "#2f6a4a", "#6a3f9a", "#c9a03c"][Math.floor(hash(vx, vy, 640) * 4)];
        k.R(vx - 1, vy - 2, 9, 2, P[0]); k.R(vx, vy, 7, 9, "#26262a"); k.R(vx + 1, vy + 1, 5, 7, "#ffd27a"); k.R(vx + 3, vy + 1, 1, 7, "#26262a"); k.R(vx + 1, vy + 4, 5, 1, "#26262a");
        if (hash(vx, vy, 641) < 0.55) { k.R(vx + 1, vy + 1, 1, 7, cort); k.R(vx + 5, vy + 1, 1, 7, cort); }
        k.R(vx - 1, vy + 9, 9, 1, P[0]); k.R(vx, vy + 10, 7, 1, P[4]);
      }
      k.R(x + 2, base - 46, w - 4, 9, S[2]); k.R(x + 2, base - 46, w - 4, 1, S[0]); k.R(x + 2, base - 38, w - 4, 1, S[4]); k.R(x + 3, base - 45, w - 6, 1, mezcla(sc, "#e8c35a", 0.5));
      if (nombre) rotulo(k, Math.round(x + w / 2 - nombre.length * 2), base - 43, nombre, "#ffe9a8"); else for (let vx = x + 7; vx < x + w - 10; vx += 7) k.R(vx, base - 43, 4, 3, "#e8c35a");
      const ex0 = x + 4, ey0 = base - 36, ew = w - 8;
      k.R(ex0, ey0, ew, 25, S[4]); k.R(ex0, ey0, ew, 1, S[1]); k.R(ex0 + 1, ey0 + 1, ew - 2, 23, "#ffd27a");
      escaparate(k, i, ex0 + 1, ey0 + 8, ew - 2, 16);
      const tercio = Math.round((ew - 2) / 3); for (let gx = ex0 + 1 + tercio; gx < ex0 + ew - 3; gx += tercio) k.R(gx, ey0 + 1, 1, 7, S[4]);
      k.R(ex0 + 1, ey0 + 7, ew - 2, 1, S[4]); k.R(ex0 + Math.round(ew / 2), ey0 + 8, 1, 16, S[4]);
      if (lit < 0.5) k.alfa(0.22, () => { for (let d = 0; d < 2; d++) k.linea(ex0 + 5 + d * 12, ey0 + 21, ex0 + 13 + d * 12, ey0 + 3, "#ffffff"); });
      k.R(ex0, base - 11, ew, 11, S[3]); k.R(ex0 + 2, base - 9, ew - 4, 7, S[4]); k.R(ex0 + 2, base - 9, ew - 4, 1, S[2]); k.R(ex0, base - 11, ew, 1, S[1]);
      L.push({ x: x + w / 2, y: base + 3, r: w * 0.55, ry: 9, col: "#ffcf7a", f: lit * 0.75 });
    });
    const letrero = (x0, y0, w0, fondo, txt, col) => { const F = tonos5(fondo, 0.3, 0.5); k.R(x0 - 1, y0 - 1, w0 + 2, 10, "#1e1a14"); k.R(x0, y0, w0, 8, F[2]); k.R(x0, y0, w0, 1, F[0]); k.R(x0, y0 + 7, w0, 1, F[4]); k.R(x0 + 6, y0 - 4, 1, 3, "#3a3a44"); k.R(x0 + w0 - 7, y0 - 4, 1, 3, "#3a3a44"); rotulo(k, x0 + 4, y0 + 2, txt, col); };
    letrero(92, 96, 46, "#2f5fa8", "ILLOVANDER", "#ffe9a8"); letrero(188, 88, 42, "#26262a", "FLUORISH", "#e8c35a");
    [[52, 72], [267, 72]].forEach(([fx, fy]) => { k.R(fx - 6, fy, 7, 1, "#26262a"); k.linea(fx, fy + 4, fx - 4, fy, "#26262a"); const lx = fx - 7; k.R(lx - 2, fy + 1, 5, 1, "#3a3a44"); k.R(lx - 2, fy + 2, 5, 7, "#3a3a44"); k.R(lx - 1, fy + 3, 3, 5, "#ffd27a"); k.R(lx - 3, fy + 9, 7, 1, "#26262a"); L.push({ x: lx, y: fy + 6, r: 24, ry: 20, col: "#ffcf7a", f: lit * 0.9 }); });
    catenaria(k, 96, 72, 226, 76, 8, "#3a3040", (x, y, i) => { if (i % 10 === 2) { const col = ["#c0392b", "#c9a03c", "#2f5fa8"][(i >> 1) % 3]; k.poli([[x - 3, y], [x + 3, y], [x, y + 6]], col); k.poli([[x, y], [x + 3, y], [x, y + 6]], mezcla(col, "#000000", 0.25)); k.P(x - 2, y + 1, mezcla(col, "#ffffff", 0.3)); } });
    const AD2 = ["#b4ae9e", "#a09a8c", "#8a8478", "#76705f", "#625c4e", "#4e4a3e"];
    for (let y0 = base, alto = 2, fila = 0; y0 < H; y0 += Math.round(alto), alto = Math.min(6.5, alto + 0.5), fila++) {
      const ha = Math.round(alto), wd = 5 + ha * 2, off = (fila % 2) * Math.round(wd / 2);
      for (let y = y0; y < Math.min(H, y0 + ha); y++) for (let x = 0; x < W; x++) { const c = Math.floor((x + off) / wd), u = x + off - c * wd, v = y - y0, esquina = ha > 2 && (u === 1 || u === wd - 1) && (v === 1 || v === ha - 1); k.P(x, y, v === 0 || u === 0 ? AD2[5] : esquina ? AD2[4] : rampa(AD2, 0.28 + (hash(c, fila, 660) - 0.5) * 0.32 + (u / wd - 0.5) * 0.3 + (v / ha - 0.5) * 0.45 + (hash(x, y, 661) - 0.5) * 0.08, x, y)); }
    }
    sombra(k, [[0, base], [136, base], [136, base + 4], [0, base + 4]], 0.3); sombra(k, [[186, base], [W, base], [W, base + 4], [186, base + 4]], 0.3);
    const caldero = (cx, cy, r) => { sombraE(k, cx + 1, cy + r * 0.85, r + 1, 1.8, 0.4); bola(k, cx, cy, r, r * 0.86, (px, py) => rampa(["#8a8a96", "#6a6a74", "#4e4e58", "#3a3a44", "#26262c"], 0.1 + (Math.hypot(px - cx + r * 0.45, py - cy + r * 0.45) / (r * 1.7)) * 0.85, px, py)); k.R(cx - r, cy - r * 0.86 - 1, r * 2 + 1, 2, "#5a5a64"); k.R(cx - r + 1, cy - r * 0.86 - 1, r * 2 - 1, 1, "#9a9aa6"); k.R(cx - r + 2, cy - r * 0.86, r * 2 - 3, 1, "#1a1a20"); k.P(cx - r - 1, cy - r * 0.4, "#3a3a44"); k.P(cx + r + 1, cy - r * 0.4, "#3a3a44"); };
    caldero(56, 141, 7); caldero(68, 143, 7); caldero(62, 134, 6);
    jaula(k, 248, 138); jaula(k, 262, 140, ["#c8a070", "#a87a4a", "#6a4a2a"]);
    sombraE(k, 98, 151, 9, 2, 0.4); T.rect(k, 90, 139, 14, 11, madera(["#d8aa74", "#c99a64", "#a87444", "#7a5230", "#5a3a20"], { paso: 4, largo: 99, s: 670 })); k.R(90, 139, 14, 1, "#e0b880"); k.R(103, 139, 1, 11, "#5a3a20"); k.linea(91, 140, 102, 148, "#7a5230", 2); [[91, 140], [102, 140], [91, 148], [102, 148]].forEach(([a, b]) => k.P(a, b, "#3a3a44"));
    sombraE(k, 222, 151, 8, 2, 0.4); cilindro(k, 216, 137, 11, 13, ["#d0996a", "#b88050", "#9a6438", "#7a4c28", "#5a3418"], 0.3); for (let px = 218; px < 227; px += 2) k.R(px, 138, 1, 11, "#6a4224"); [139, 146].forEach((y) => { k.R(216, y, 11, 2, "#4a4a52"); k.R(216, y, 11, 1, "#8a8a96"); }); k.elipse(221.5, 137, 5, 1.5, "#c0895a"); k.R(217, 137, 9, 1, "#e0a878");
    luces(k, L);
  }
  MAG[6] = ["El Callejón Daigon", "La calle de las tiendas, torcidas y apretadas", daigon, { ven: VEN, brillo: 0.78, tinte: 0.3 }];

  function anden(k) {
    const { h } = Det.cuando(k), lit = encendido(k), L = [];
    k.banda(["#6a7a8a", "#8a98a4", "#b0bac0"], 0, 60);
    pase(k, (x, y, d, i) => { const bar = x % 10 === 0 || y % 5 === 4, m = bar ? 0.3 : 0.55; d[i] = d[i] * m + 26; d[i + 1] = d[i + 1] * m + 26; d[i + 2] = d[i + 2] * m + 32; }, 0, 0, W, 14);
    for (let x = 0; x < W; x += 30) { k.linea(x, 15, x + 15, 0, "#26262a", 2); k.linea(x + 30, 15, x + 15, 0, "#26262a", 2); k.linea(x + 1, 14, x + 15, 1, "#5a5a66"); for (let j = 3; j < 15; j += 4) k.P(x + j, 14 - j, "#8a8a96"); }
    k.R(0, 13, W, 3, "#3a3a44"); k.R(0, 13, W, 1, "#6a6a76"); for (let x = 2; x < W; x += 4) k.P(x, 14, "#8a8a96");
    const LAD = ["#c0a080", "#a8886a", "#957558", "#7f6048", "#664a36", "#4a3426"];
    T.rect(k, 0, 16, W, 74, (x, y) => { const f = Math.floor(y / 3), bx = x + (f % 2) * 3, c = Math.floor(bx / 6); if (y % 3 === 0 || Math.floor(bx) % 6 === 0) return LAD[5]; const hollin = Math.max(0, 1 - (y - 16) / 26) * 0.32 + Math.max(0, (x - 210) / 110) * Math.max(0, 1 - (y - 16) / 60) * 0.3; return rampa(LAD, 0.18 + (hash(c, f, 701) - 0.5) * 0.36 + hollin + (y % 3 === 1 ? -0.06 : 0), x, y); });
    [7, 67, 127, 187, 247, 307].forEach((px) => { T.rect(k, px - 3, 18, 6, 48, (x, y) => { const f = Math.floor(y / 3); if (y % 3 === 0 || (x - px + 3 + (f % 2) * 3) % 6 === 0) return LAD[4]; return rampa(LAD, 0.04 + (hash(x >> 2, f, 702) - 0.5) * 0.2 + (x === px + 2 ? 0.25 : 0), x, y); }); k.R(px - 4, 16, 8, 2, "#b8a890"); k.R(px - 4, 16, 8, 1, "#d8c8b0"); });
    for (let x = 26; x < W; x += 60) {
      k.elipse(x + 11, 35, 14, 14, "#b8a890"); k.R(x - 3, 35, 28, 27, "#b8a890"); for (let a = Math.PI + 0.2; a < Math.PI * 2; a += 0.33) k.linea(x + 11 + Math.cos(a) * 12, 35 + Math.sin(a) * 12, x + 11 + Math.cos(a) * 14, 35 + Math.sin(a) * 14, "#8a7a68"); k.R(x + 9, 20, 5, 4, "#d8c8b0");
      ventanaArco(k, x, 24, 22, 36, "#3a3a44", "#d8e0e4");
      k.alfa(0.3, () => k.R(x, 36, 22, 6, "#ffffff")); [41, 49, 55].forEach((y) => k.R(x, y, 22, 1, "#4a4a54")); [x + 5, x + 16].forEach((gx) => k.R(gx, 30, 1, 30, "#4a4a54"));
      if (lit < 0.5) k.alfa(0.2, () => k.linea(x + 2, 58, x + 9, 38, "#ffffff"));
      k.R(x - 3, 61, 28, 2, "#d8c8b0"); k.R(x - 3, 63, 28, 1, "#5a4434");
    }
    k.R(0, 66, W, 3, "#6a5040"); k.R(0, 66, W, 1, "#8a6a54"); k.R(0, 69, W, 1, "#3a2a20");
    k.R(122, 8, 1, 10, "#26262a"); k.R(162, 8, 1, 10, "#26262a");
    k.R(111, 17, 62, 24, "#14141a"); k.R(112, 18, 60, 22, "#26262a"); k.R(114, 20, 56, 18, "#3a3a44"); k.R(114, 20, 56, 1, "#4a4a56"); k.R(112, 18, 60, 1, "#c9a03c"); k.R(112, 39, 60, 1, "#8a6a24"); k.R(112, 18, 1, 22, "#c9a03c"); k.R(171, 18, 1, 22, "#8a6a24");
    [[114, 20], [169, 20], [114, 37], [169, 37]].forEach(([a, b]) => k.P(a, b, "#e8c35a"));
    rotuloG(k, 123, 25, "8 1/2", "#3a2a10"); rotuloG(k, 122, 24, "8 1/2", "#e8c35a");
    k.R(224, 8, 1, 6, "#26262a"); k.R(222, 12, 5, 2, "#3a3a44");
    esfera(k, 224, 26, 12, 12, ["#e8c35a", "#c9a03c", "#8a6a24"]); esfera(k, 224, 26, 10, 10, ["#ffffff", "#fff8e8", "#e8e0cc"]);
    for (let j = 0; j < 12; j++) { const a = (j / 12) * Math.PI * 2, l = j % 3 === 0 ? 2 : 1; k.linea(224 + Math.cos(a) * (9 - l), 26 + Math.sin(a) * (9 - l), 224 + Math.cos(a) * 9, 26 + Math.sin(a) * 9, "#26262a"); }
    const ah = ((h % 12) / 12) * 6.283 - 1.571; k.linea(224, 26, 224 + Math.cos(ah) * 5, 26 + Math.sin(ah) * 5, "#26262a"); k.linea(224, 26, 224, 18, "#26262a"); k.P(224, 26, "#c9a03c");
    const RO = ["#e8705a", "#d8503e", "#c03a30", "#a8282a", "#8f1d22", "#6a1418"];
    k.R(0, 71, 222, 3, "#4a4a54"); k.R(0, 71, 222, 1, "#7a7a86"); k.R(0, 73, 222, 1, "#2a2a30"); for (let x = 6; x < 222; x += 22) k.R(x, 70, 4, 1, "#5a5a66");
    T.rect(k, 0, 74, 222, 54, (x, y) => rampa(RO, 0.12 + ((y - 74) / 54) * 0.55 + (y < 78 ? -0.1 : 0) + (hash(x >> 3, y >> 2, 703) - 0.5) * 0.06, x, y));
    k.R(0, 78, 222, 1, "#5a1218");
    for (let x = 7; x < 222; x += 34) { k.R(x, 79, 1, 49, RO[5]); k.R(x + 1, 79, 1, 49, RO[1]); for (let y = 81; y < 126; y += 4) k.P(x - 1, y, RO[0]); }
    k.R(0, 112, 222, 3, "#c9a03c"); k.R(0, 112, 222, 1, "#e8c35a"); k.R(0, 115, 222, 1, "#7a5f20"); k.R(0, 128, 222, 1, "#5a1218");
    for (let x = 12; x < 212; x += 34) {
      k.R(x - 1, 85, 26, 22, "#3a1216"); k.R(x, 86, 24, 20, "#ffe6a8");
      k.R(x, 92, 24, 1, "#c8a070"); k.R(x + 2, 98, 8, 8, "#d8b080"); k.R(x + 14, 98, 8, 8, "#d8b080"); k.R(x + 2, 98, 8, 1, "#e8c890"); k.R(x + 14, 98, 8, 1, "#e8c890");
      k.R(x, 86, 24, 3, "#c8a878"); k.R(x, 86, 3, 20, "#a8282a"); k.R(x + 21, 86, 3, 20, "#a8282a"); k.R(x + 1, 86, 1, 20, "#c03a30"); k.R(x + 22, 86, 1, 20, "#c03a30"); k.R(x + 11, 86, 2, 20, "#3a1216");
      [[x - 1, 85], [x + 24, 85], [x - 1, 106], [x + 24, 106]].forEach(([a, b]) => k.P(a, b, RO[3]));
      k.R(x + 2, 116, 20, 12, "#7f1a1e"); k.R(x + 2, 116, 20, 1, RO[5]); k.R(x + 2, 127, 20, 1, RO[2]); k.R(x + 4, 118, 16, 8, "#8f1d22"); k.R(x + 4, 118, 16, 1, "#6a1418");
    }
    rotulo(k, 73, 119, "HAGWORTS EXPRESS", "#4a1010"); rotulo(k, 72, 118, "HAGWORTS EXPRESS", "#e8c35a");
    k.R(0, 129, 222, 13, "#1f1a1c"); k.R(0, 129, 222, 2, "#3a3034"); for (let x = 4; x < 222; x += 34) { k.R(x, 132, 12, 2, "#4a4448"); k.R(x, 132, 12, 1, "#6a6468"); }
    [[40, 96], [152, 208]].forEach(([a, b]) => { k.R(a - 10, 133, b - a + 20, 4, "#2a2628"); k.R(a - 10, 133, b - a + 20, 1, "#4a4448"); const m = (a + b) / 2; for (let j = 0; j < 3; j++) k.R(m - 9 + j * 2, 130 + j, 18 - j * 4, 1, "#5a5458"); });
    k.R(0, 142, W, 6, "#1b1b1f"); k.R(0, 141, W, 1, "#8a8a96");
    const rueda = (cx, cy, r) => { k.elipse(cx, cy, r, r, "#2a2a30"); k.elipse(cx, cy, r - 1, r - 1, "#4a4a56"); k.elipse(cx, cy, r - 3, r - 3, "#2e2e36"); for (let a = 0; a < 6.28; a += 0.785) k.linea(cx, cy, cx + Math.cos(a) * (r - 3), cy + Math.sin(a) * (r - 3), "#5a5a66"); k.elipse(cx, cy, 3, 3, "#6a6a76"); k.P(cx - 1, cy - 1, "#9a9aa6"); for (let a = 3.6; a < 5.4; a += 0.1) k.P(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), "#8a8a96"); };
    [40, 96, 152, 208].forEach((x) => { rueda(x, 142, 12); k.R(x - 2, 136, 5, 4, "#5a5a66"); k.R(x - 2, 136, 5, 1, "#8a8a96"); });
    k.R(30, 140, 190, 2, "#6a6a78");
    const NE = ["#7a7a86", "#5a5a66", "#3a3a44", "#26262a", "#16161a"];
    T.rect(k, 222, 62, 98, 38, (x, y) => rampa(NE, 0.06 + Math.abs((y - 75) / 24) * 0.78, x, y));
    for (let x = 290; x < W; x += 14) { k.R(x, 62, 2, 38, "#c9a03c"); k.R(x, 62, 1, 38, "#e8c35a"); }
    for (let x = 287; x < W; x += 4) { k.P(x, 65, "#8a8a96"); k.P(x, 97, "#5a5a66"); }
    T.rect(k, 222, 100, 98, 42, (x, y) => rampa(NE, 0.55 + ((y - 100) / 42) * 0.3 + (hash(x >> 1, y >> 1, 705) - 0.5) * 0.08, x, y));
    const CAB = ["#c03a30", "#a8282a", "#8f1d22", "#6a1418", "#4a0e10"];
    T.rect(k, 228, 52, 56, 24, (x, y) => rampa(CAB, 0.15 + ((x - 228) / 56) * 0.35 + (hash(x >> 2, y >> 2, 706) - 0.5) * 0.08, x, y)); k.R(228, 52, 56, 2, CAB[0]);
    [234, 254].forEach((x) => { k.R(x - 1, 59, 16, 14, "#3a1216"); k.R(x, 60, 14, 12, "#ffe6a8"); k.R(x, 60, 14, 2, "#e8c890"); k.R(x + 6, 60, 1, 12, "#3a1216"); });
    k.R(224, 50, 64, 3, "#26262a"); k.R(224, 50, 64, 1, "#4a4a56"); k.R(282, 53, 2, 23, CAB[4]); for (let y = 56; y < 76; y += 4) k.P(230, y, CAB[0]);
    cilindro(k, 296, 40, 13, 24, NE, 0.3); k.R(294, 37, 17, 3, "#3a3a44"); k.R(294, 37, 17, 1, "#7a7a86"); k.R(293, 36, 19, 1, "#c9a03c"); k.elipse(302.5, 37, 7, 1.5, "#14141a");
    [240, 262].forEach((x) => { cilindro(k, x, 45, 7, 7, ORO, 0.3); k.elipse(x + 3.5, 45, 3.5, 2.5, "#e8c35a"); k.P(x + 2, 44, "#ffe08a"); k.R(x - 1, 51, 9, 1, "#7a5f20"); });
    k.R(222, 99, 98, 3, "#c0392b"); k.R(222, 99, 98, 1, "#e0604a"); k.R(222, 102, 98, 1, "#5a1218");
    k.R(311, 82, 9, 13, "#26262a"); k.R(312, 83, 7, 10, "#ffe6a8"); k.R(312, 83, 7, 2, "#fff8e0"); k.R(310, 95, 11, 2, "#3a3a44"); L.push({ x: 316, y: 88, r: 26, ry: 18, col: "#ffe6a8", f: 0.4 + lit * 0.5 });
    const rueda2 = (cx, cy, r) => {
      k.elipse(cx, cy, r, r, "#2a2a32"); for (let a = 3.5; a < 5.6; a += 0.05) k.P(cx + Math.cos(a) * (r - 1), cy + Math.sin(a) * (r - 1), "#7a7a86");
      k.elipse(cx, cy, r - 3, r - 3, "#8a6a24"); k.elipse(cx, cy, r - 4, r - 4, "#c9a03c");
      for (let a = 0; a < 6.28; a += 6.28 / 14) k.linea(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, cx + Math.cos(a) * (r - 4), cy + Math.sin(a) * (r - 4), "#7a5f20");
      if (r > 12) for (let a = 0.7; a < 2.4; a += 0.06) for (let rr = r - 9; rr < r - 4; rr++) k.P(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr, "#8a6a24");
      k.elipse(cx, cy, 4, 4, "#e8c35a"); k.elipse(cx, cy, 2, 2, "#7a5f20"); k.P(cx - 1, cy - 1, "#ffe08a");
    };
    rueda2(276, 122, 19); rueda2(310, 131, 10);
    k.R(298, 110, 22, 10, "#3a3a44"); k.R(298, 110, 22, 1, "#6a6a76"); k.R(298, 119, 22, 1, "#1a1a20");
    k.linea(285, 126, 302, 115, "#9a9aa6", 2); k.linea(285, 125, 302, 114, "#d8d8e4"); k.elipse(285, 126, 2, 2, "#c9a03c");
    [[300, 28, 9], [290, 19, 12], [314, 22, 11], [276, 15, 13], [308, 9, 14], [258, 25, 11], [324, 32, 12], [286, 42, 9]].forEach(([x, y, r], i) => vapor(k, x, y, r, 0.72, 720 + i));
    [[26, 146, 8], [70, 148, 10], [118, 145, 9], [170, 147, 10], [214, 146, 9], [262, 144, 12], [302, 146, 10]].forEach(([x, y, r], i) => vapor(k, x, y, r, 0.38, 730 + i));
    const AND = ["#c4c0b4", "#b4b0a4", "#a8a498", "#948f82", "#807b6e", "#6a665a"];
    k.R(0, 148, W, 2, "#8a867a"); k.R(0, 148, W, 1, "#d8d4c8");
    T.rect(k, 0, 150, W, 30, (x, y) => { if (y < 153) return hash(x >> 1, y, 711) < 0.12 ? "#c8a848" : y === 150 ? "#f2d06a" : "#e8c35a"; const f = Math.floor((y - 153) / 8.5), yy = y - 153 - f * 8.5, c = Math.floor((x + (f % 2) * 13) / 26), u = x + (f % 2) * 13 - c * 26; if (yy < 1 || u < 1) return AND[5]; return rampa(AND, 0.22 + (hash(c, f, 708) - 0.5) * 0.25 + (fbm(x * 0.15, y * 0.3, 709) - 0.5) * 0.25 + (yy < 2 ? -0.08 : 0), x, y); });
    const baul = (x, y, c) => { const B = tonos5(c, 0.2, 0.5); sombraE(k, x + 12, y + 1, 13, 2, 0.4); T.rect(k, x, y - 10, 22, 10, (px, py) => rampa(B, 0.2 + ((py - y + 10) / 10) * 0.4 + (fbm(px * 0.4, py * 0.4, 710) - 0.5) * 0.2, px, py)); k.R(x, y - 10, 22, 2, B[0]); k.R(x, y - 8, 22, 1, B[4]); [4, 16].forEach((d) => { k.R(x + d, y - 10, 2, 10, "#3a2a20"); k.R(x + d, y - 10, 1, 10, "#5a4a3a"); }); k.R(x + 10, y - 7, 3, 2, "#e8c35a"); [[x, y - 10], [x + 20, y - 10], [x, y - 2], [x + 20, y - 2]].forEach(([a, b]) => k.R(a, b, 2, 2, "#c9a03c")); k.R(x + 8, y - 11, 6, 1, "#3a2a20"); };
    baul(34, 164, "#7a5230"); baul(52, 170, "#8a3a2a");
    jaula(k, 263, 164);
    luces(k, L);
  }
  MAG[7] = ["El andén 8½", "El expreso rojo, envuelto en vapor", anden, { fuerza: 0.4, fuego: ["#ffe6a8"] }];

  function hagwortsLago(k) {
    const lit = encendido(k), L = [];
    k.banda(CIELO, 0, 118);
    nubarron(k, -20, 52, 96, 18); nubarron(k, 252, 44, 96, 20); cirros(k, 5, 4, 26);
    const MT = ["#8aa0b8", "#6f86a0", "#5e7490", "#4e6280"];
    montana(k, 44, 122, 170, 56, { roca: MT }); montana(k, 282, 122, 170, 62, { roca: MT });
    granoMonte(k, 44, 122, 170, 56, 101); granoMonte(k, 282, 122, 170, 62, 102);
    for (let x = -4; x < W + 4; x += 4) { if (x > 58 && x < 262) continue; const hh = 7 + hash(x, 1, 103) * 8; k.poli([[x - 3, 121], [x + 3, 121], [x, 121 - hh]], "#3a5a5c"); k.poli([[x, 121 - hh], [x + 3, 121], [x + 1, 121]], "#2a4648"); }
    const ROCA = ["#8a8c98", "#7a7c88", "#62646f", "#50525c", "#3e4048", "#2e3038"];
    rellena(k, [[46, 122], [70, 94], [250, 94], [276, 122]], (x, y) => { const est = Math.sin(y * 0.9 + Math.sin(x * 0.08) * 2.2), cc = celdas(x * 0.6, y, 5, 4, 104, 0.8); return rampa(ROCA, 0.1 + ((y - 94) / 28) * 0.45 + (est > 0.75 ? 0.22 : 0) + (cc.borde < 0.08 ? 0.25 : 0) + (fbm(x * 0.1, y * 0.2, 105) - 0.5) * 0.25 + (x > 250 ? 0.18 : x < 70 ? -0.08 : 0), x, y); });
    for (let x = 70; x < 250; x++) { if (hash(x, 1, 106) < 0.55) k.P(x, 94, "#5a8a4a"); if (hash(x, 2, 106) < 0.25) k.P(x, 95, "#4a7a3a"); }
    castillo27(k, 98, { e: 0.8, s: 110 });
    k.agua(120, 152, ["#4f9ad0", "#3f86c0", "#2f70a8"], "#bfe6f6", 60);
    espejo(k, 120, 121, 152, { tinte: "#3f86c0", mezcla: 0.52, onda: 1.5, oscuro: 0.92, crestas: 0.14, s: 105 });
    reflejo(k, 122, 152);
    for (let i = 0; i < 26; i++) { const x = 66 + k.rnd() * 190; if (lit > 0.3) k.crudo(x, 124 + k.rnd() * 24, 3 + k.rnd() * 5, 1, "#ffd27a"); }
    espuma(k, 121, 30, 292, "#d8ecf4");
    [[62, 142, "#6b4a30"], [254, 138, "#6b4a30"], [236, 146, "#7a5230"]].forEach(([x, y, c]) => { const B = tonos5(c, 0.22, 0.5); k.alfa(0.35, () => k.R(x - 8, y + 4, 16, 1, "#1e3a5a")); k.poli([[x - 9, y], [x + 9, y], [x + 6, y + 3], [x - 6, y + 3]], B[2]); k.R(x - 9, y, 18, 1, B[0]); k.R(x - 7, y + 1, 14, 1, B[4]); k.R(x - 6, y + 2, 12, 1, B[3]); k.R(x - 10, y + 3, 2, 1, "#d8ecf4"); k.R(x + 9, y + 3, 2, 1, "#d8ecf4"); k.R(x + 6, y - 6, 1, 6, "#3a2a20"); k.R(x + 5, y - 9, 3, 3, "#ffd27a"); k.P(x + 6, y - 10, "#3a2a20"); L.push({ x: x + 6, y: y - 7, r: 14, ry: 9, col: "#ffcf7a", f: lit }); });
    T.prado(k, 152, ["#9ad080", "#86c070", "#6aa85a", "#5a9a4c", "#4a8a44"], 106, { flores: { n: 30, cols: ["#ffffff", "#f2d24a"] }, n: 200 });
    for (let x = 0; x < W; x++) { const o = Math.round(Math.sin(x / 6) * 1.2); k.P(x, 152 + o, "#7a7a6a"); if (hash(x, 1, 107) < 0.5) k.P(x, 153 + o, ["#a8a490", "#7a7a6a", "#c8c4b0"][x % 3]); }
    espuma(k, 151, 0, 320, "#bfe6f6");
    for (let i = 0; i < 22; i++) { const x = i % 2 ? 6 + hash(i, 1, 108) * 60 : 256 + hash(i, 2, 108) * 60, hh = 7 + hash(i, 3, 108) * 6, inc = (hash(i, 4, 108) - 0.5) * 3; k.linea(x, 155, x + inc, 155 - hh, "#4a7a3a"); k.R(x + inc - 0.5, 155 - hh - 1, 1, 3, "#7a5a3a"); k.linea(x + 1, 155, x + 3 + inc, 155 - hh * 0.6, "#5a8a44"); }
    [[20, 152, 40], [298, 154, 44], [-2, 182, 56], [320, 184, 58]].forEach(([x, b, hh], i) => abeto(k, x, b, hh, PINO, { s: 111 + i }));
    luces(k, L);
  }
  MAG[1] = ["Hagworts desde el lago", "El castillo sobre su acantilado, reflejado en el agua", hagwortsLago, { ven: VEN, dx: 104 }];

  const GLIFOS = { leon: [".111....", "11111...", "1.1111..", "111111.1", ".111111.", "..1111..", ".11..11.", ".1....1."], aguila: ["...11...", "1..11..1", "11.11.11", "11111111", ".111111.", "...11...", "..1..1..", "........"], serpiente: ["....111.", "...1.111", "...1....", "....11..", "......1.", ".1....1.", "..1111..", "1......."], tejon: ["..1111..", ".1.11.1.", "1..11..1", "1.1111.1", "11111111", ".111111.", "..1111..", "........"] };
  function comedor(k, emblema = null) {
    const VX = 160, VY = 96;
    k.banda(["#101a44", "#1a2660", "#26347a"], 0, 96);
    nubarron(k, 40, 18, 70, 8, ["#6a74a8", "#46508a", "#2f3a70"]); nubarron(k, 200, 26, 70, 7, ["#6a74a8", "#46508a", "#2f3a70"]);
    const SU = ["#a8987e", "#9a8a74", "#8a7a68", "#7a6a58", "#6d5d4c", "#5a4a3c"];
    T.rect(k, 0, 108, W, 74, (x, y) => { const dy = y - VY, zz = 400 / dy, XX = ((x - VX) / dy) * 40, cc = celdas(XX, zz, 9, 1.5, 201, 0.2), lejos = dy < 22; if (!lejos && cc.borde < 0.07) return SU[5]; return rampa(SU, 0.34 + (cc.id - 0.5) * 0.28 + (lejos ? 0.08 : -cc.dy * 0.2) + (hash(x, y, 202) - 0.5) * 0.08, x, y); });
    const Q = ["#9a8a76", "#8a7a68", "#7a6a58", "#6a5a4a", "#574838", "#463828"];
    const pared = (x, y, lado) => {
      const xx = lado ? 320 - x : x, u = xx / 104, top = -4 + 48 * u, bot = 158 - 48 * u, hg = bot - top, v = (y - top) / hg, Z = 1 / (1 - 0.5926 * u), dZ = 0.5926 / (104 * (1 - 0.5926 * u) ** 2), fila = Math.floor(v * 24);
      if ((v * 24) % 1 < 24 / hg) return Q[5];
      const zz = Z / 0.08 + (fila % 2) * 0.5; if (zz % 1 < dZ / 0.08) return Q[5];
      return rampa(Q, 0.14 + u * 0.3 + (lado ? 0.2 : 0) + (hash(Math.floor(zz), fila, 203 + lado) - 0.5) * 0.24 + (v > 0.9 ? 0.2 : 0) + (hash(x, y, 205) - 0.5) * 0.06, x, y);
    };
    rellena(k, [[0, -4], [104, 44], [104, 110], [0, 158]], (x, y) => pared(x, y, 0)); rellena(k, [[320, -4], [216, 44], [216, 110], [320, 158]], (x, y) => pared(x, y, 1));
    [[0, 26], [30, 21], [56, 17], [78, 13]].forEach(([x, w], i) => [0, 1].forEach((s) => {
      const px = s ? 320 - x - w : x, t = 8 + i * 13, b = 126 - i * 8, pts = s ? [[px, b - (i + 1) * 3], [px, t + 20], [px + w * 0.5, t], [px + w, t + 18 - i], [px + w, b]] : [[px, b], [px, t + 18 - i], [px + w * 0.5, t], [px + w, t + 20], [px + w, b - (i + 1) * 3]];
      const cx0 = px + w / 2, cy0 = (t + b) / 2, sx = 1 + 4 / w, sy = 1 + 5 / (b - t);
      rellena(k, pts.map(([a, bb]) => [cx0 + (a - cx0) * sx, cy0 + (bb - cy0) * sy]), () => Q[1]);
      rellena(k, pts, (qx, qy) => { const gx = Math.round(qx - px), gy = Math.round(qy - t); if (gx % 6 === 0 || gy % 9 === 0) return "#574838"; return ["#ffe6a8", "#ffd27a", "#ffcf6a"][Math.min(2, Math.floor(((qy - t) / (b - t)) * 3))]; });
      if (w > 15) k.R(Math.round(px + w / 2) - 1, t + 5, 2, b - t - 8, Q[2]);
    }));
    [["#8f1d22", "#e8c35a", 40, 40, 30, "leon"], ["#2f5fa8", "#c9a03c", 74, 60, 22, "aguila"], ["#2f7a4a", "#c8c8d0", 246, 60, 22, "serpiente"], ["#c9a03c", "#26262a", 276, 40, 30, "tejon"]].forEach(([c, l, x, y, w, g]) => {
      const C = tonos5(c, 0.22, 0.5);
      rellena(k, [[x - w / 2, y], [x + w / 2, y], [x + w / 2, y + 44], [x, y + 54], [x - w / 2, y + 44]], (px, py) => rampa(C, 0.16 + (Math.sin(((px - x) / w) * 10) * 0.5 + 0.5) * 0.3 + ((px - x) / w) * 0.25 + ((py - y) / 54) * 0.12, px, py));
      k.R(x - w / 2, y, 2, 44, l); k.R(x + w / 2 - 2, y, 2, 44, l); k.linea(x - w / 2, y + 44, x, y + 54, l, 2); k.linea(x + w / 2 - 1, y + 44, x, y + 54, l, 2);
      k.R(x - w / 2 - 3, y - 2, w + 6, 2, "#c9a03c"); k.R(x - w / 2 - 3, y - 2, w + 6, 1, "#e8c35a"); k.R(x - w / 2 - 4, y - 3, 2, 4, "#e8c35a"); k.R(x + w / 2 + 2, y - 3, 2, 4, "#e8c35a");
      const ex = Math.round(x), ey = Math.round(y + 20), r = w * 0.28;
      if (emblema) emblema(k, ex, ey, w, g, l, C); else { k.elipse(ex, ey, r + 1, r * 1.15 + 1, l); k.elipse(ex, ey, r, r * 1.15, C[3]); glifo(k, ex - 4, ey - 4, GLIFOS[g], l); }
      k.R(x - 1, y + 54, 2, 3, l); k.R(x - 1, y + 57, 2, 1, mezcla(l, "#000000", 0.3));
    });
    T.rect(k, 104, 44, 112, 66, sillar(["#9a8874", "#8a7864", "#7a6854", "#6a5a48", "#5f5040", "#4a3e30"], { ah: 7, an: 15, s: 206, x0: 104, y0: 44 }));
    sombra(k, [[104, 44], [112, 44], [112, 110], [104, 110]], 0.3); sombra(k, [[208, 44], [216, 44], [216, 110], [208, 110]], 0.3);
    const VIT = ["#c0392b", "#2f6fa8", "#e8c35a", "#3f8a58", "#8f55d8"];
    rellena(k, [[120, 100], [120, 66], [160, 38], [200, 66], [200, 100]], () => "#a89880");
    rellena(k, [[122, 98], [122, 66], [160, 40], [198, 66], [198, 98]], (x, y) => {
      if (y >= 64 && (Math.abs(x - 141) < 1.5 || Math.abs(x - 160) < 1.5 || Math.abs(x - 179) < 1.5)) return x % 2 ? "#7a6854" : "#6a5a48";
      if (y < 64) { const r = Math.hypot(x - 160, y - 55), a = Math.atan2(y - 55, x - 160); if (Math.abs(r - 8.5) < 0.8 || (r < 8 && r > 3 && Math.abs(((a + Math.PI) / (Math.PI / 4)) % 1 - 0.5) > 0.42)) return "#3a2a1e"; return r < 3 ? "#e8c35a" : r < 8 ? VIT[Math.floor((a + Math.PI) / (Math.PI / 4)) % 5] : VIT[(x + y) % 3 === 0 ? 2 : 1]; }
      if ((x + y) % 5 === 0 || (x - y + 200) % 5 === 0) return "#3a2a1e";
      const lan = x < 141 ? 0 : x < 160 ? 1 : x < 179 ? 2 : 3, cx = [131, 150, 169, 188][lan], fila = Math.floor((y - 64) / 8);
      if (Math.abs(x - cx) < 4 && y > 70 && y < 94) return y < 76 ? "#e8c35a" : VIT[(lan + 2) % 5];
      return VIT[(lan + fila) % 5 === 2 ? 1 : (lan + fila) % 5];
    });
    [[124, "#2f6a4a", 0], [146, "#6a3f9a", 1], [174, "#26262a", 2], [196, "#5a3a22", 3]].forEach(([x, robe, j]) => {
      const g = j === 3 ? 1 : 0;
      k.R(x - 3 - g, 91 - g, 7 + g * 2, 9 + g, robe); k.R(x - 3 - g, 91 - g, 1, 9 + g, mezcla(robe, "#ffffff", 0.2));
      k.elipse(x, 89 - g, 3 + g, 3 + g, j === 3 ? "#3a2414" : "#e8c8a0"); if (j === 3) k.R(x - 1, 88 - g, 3, 2, "#d8b090");
      if (j < 2) { k.poli([[x - 4, 87], [x + 4, 87], [x + 1, 80]], robe); k.R(x - 4, 87, 9, 1, mezcla(robe, "#000000", 0.3)); }
      if (j === 1) k.R(x - 2, 90, 5, 6, "#f4f1e8");
      if (j === 2) { k.R(x - 3, 86, 7, 2, "#14141a"); k.R(x - 3, 87, 2, 5, "#14141a"); k.R(x + 2, 87, 2, 5, "#14141a"); }
    });
    k.R(112, 99, 96, 2, "#f4efe0"); k.R(112, 101, 96, 7, "#e8e0cc"); for (let x = 116; x < 208; x += 8) k.R(x, 101, 1, 7, "#d4cab4"); k.R(112, 104, 96, 1, "#c9a03c"); k.R(112, 108, 96, 4, "#5a3a22"); k.R(112, 108, 96, 1, "#3a2414");
    for (let x = 118; x < 206; x += 9) { k.P(x, 98, "#e8c35a"); k.P(x + 3, 98, "#f4efe0"); }
    k.R(158, 86, 5, 14, "#c9a03c"); k.R(158, 86, 1, 14, "#e8c35a"); k.R(156, 98, 9, 2, "#a8842e");
    k.elipse(160, 84, 6, 5, "#e8c35a"); k.poli([[154, 82], [146, 74], [150, 72], [158, 80]], "#e8c35a"); k.poli([[166, 82], [174, 74], [170, 72], [162, 80]], "#c9a03c"); for (let j = 0; j < 3; j++) { k.P(150 + j * 2, 75 + j * 2, "#a8842e"); k.P(170 - j * 2, 75 + j * 2, "#a8842e"); } k.P(158, 83, "#3a2a1e"); k.P(162, 83, "#3a2a1e"); k.P(160, 85, "#a8842e");
    const X = (x0, y) => VX + (x0 - VX) * ((y - VY) / 84), Hh = (y) => 13 * ((y - VY) / 84), MESA = ["#c08a54", "#a87444", "#8e5e36", "#744a2a", "#5a3820"], BAN = ["#6a4426", "#5a3a20", "#4a2e18", "#3a2414", "#2a1a0e"];
    [58, 122, 198, 262].forEach((x0, mi) => {
      rellena(k, [[X(x0, 182) - Hh(182) - 6, 182], [X(x0, 182) + Hh(182) + 6, 182], [X(x0, 116) + Hh(116) + 1.5, 116], [X(x0, 116) - Hh(116) - 1.5, 116]], (x, y) => { const d = Math.abs(x - X(x0, y)) - Hh(y); if (d < 0) return null; return rampa(BAN, 0.2 + (d / (6 * ((y - VY) / 84) + 0.01)) * 0.5 + (Math.round(y) % 7 === 0 ? 0.15 : 0), x, y); });
      rellena(k, [[X(x0, 182) - Hh(182), 182], [X(x0, 182) + Hh(182), 182], [X(x0, 116) + Hh(116), 116], [X(x0, 116) - Hh(116), 116]], (x, y) => { const q = (x - X(x0, y)) / (Hh(y) + 0.01); if (Math.abs(Math.abs(q) - 0.33) < 0.5 / (Hh(y) + 0.5)) return MESA[4]; const tabla = q < -0.33 ? 0 : q < 0.33 ? 1 : 2; return rampa(MESA, 0.14 + (q + 1) * 0.16 + (hash(tabla, mi, 210) - 0.5) * 0.2 + (ruido(q * 3 + tabla * 5, y * 0.25, 211) - 0.5) * 0.25, x, y); });
      let j = 0;
      for (let y = 122; y < 180; y += 7 + (y - 120) * 0.12, j++) {
        const s = Hh(y) * 0.5, e = Math.max(0.6, (y - VY) / 84), xc = X(x0, y);
        k.elipse(xc - s, y, 1.4 + s * 0.3, 0.8 + s * 0.12, "#e8c35a"); k.elipse(xc - s, y, 1 + s * 0.26, 0.6 + s * 0.1, "#f4efe0");
        k.R(xc + s - e, y - 3 * e, 2 * e, 3 * e, "#c9a03c"); k.R(xc + s - e * 1.5, y - 3 * e - 1, 3 * e, 1, "#e8c35a");
        if (j % 2) { const col = ["#a8642a", "#c0392b", "#d8b070"][j % 3]; k.elipse(xc, y - 1, 1 + s * 0.2, 0.8 + s * 0.12, col); k.P(xc - s * 0.1, y - 1 - s * 0.08, mezcla(col, "#ffffff", 0.35)); }
      }
    });
    if (encendido(k) < 0.5) rayos(k, [[150, 72, 128, 182, 12, 50], [172, 72, 196, 182, 12, 50]], "#ffe6a8", 0.1);
    luces(k, [{ x: 160, y: 150, r: 210, ry: 46, col: "#ffcf7a", f: 0.3 }]);
    for (let i = 0; i < 46; i++) { const y = 20 + k.rnd() * 66, f = (y - 10) / 80, x = 160 + (k.rnd() * 2 - 1) * (40 + f * 120), g = f > 0.6 ? 1 : 0, hh = 4 + g * 2; k.R(x, y, 1 + g, hh, "#f4efe0"); if (g) k.R(x + 1, y, 1, hh, "#d8cdb4"); k.P(x, y + 1, "#ffe6a8"); k.P(x, y - 1, "#ffcf6a"); k.P(x, y - 2, "#ffe6a8"); k.alfa(0.22, () => k.elipse(x + 0.5, y - 2, 3 + g, 3 + g, "#ffcf6a")); }
  }
  MAG[2] = ["El Gran Comedor", "Las velas flotando bajo el techo que enseña el cielo de fuera", (k) => comedor(k), { fuerza: 0.12, fuego: ["#ffd27a", "#ffcf6a", "#ffe6a8", "#f4efe0", "#d8cdb4", "#c0392b", "#2f6fa8", "#e8c35a", "#3f8a58", "#8f55d8"] }];

  function salaComun(k, escudo = null) {
    const { h } = Det.cuando(k), f = h >= 3 && h <= 6 ? 0.55 : 1, L = [];
    const RJ = ["#9a4440", "#8a3a36", "#7a2e2e", "#6a2828", "#5a2222", "#401818"];
    T.rect(k, 0, 0, W, 124, (x, y) => {
      const col = Math.floor(x / 26), u = x - col * 26, fila = y < 59 ? 0 : 1, y0 = fila ? 60 : 10, y1 = fila ? 110 : 58;
      if (u === 0 || y === 59) return RJ[5];
      if (u < 3 || u > 22 || y < y0 + 2 || y > y1 - 2) return rampa(RJ, 0.18 + (u === 1 ? -0.1 : 0) + (ruido(x * 0.1, y * 0.8, 901) - 0.5) * 0.2, x, y);
      return rampa(RJ, 0.36 + (u === 3 || y === y0 + 2 ? -0.18 : u === 22 || y === y1 - 2 ? 0.2 : 0) + (ruido(x * 0.6, y * 0.05 + col * 7, 902) - 0.5) * 0.3, x, y);
    });
    k.R(0, 0, W, 8, "#c9a03c"); k.R(0, 0, W, 1, "#e8c35a"); for (let x = 2; x < W; x += 6) { k.R(x, 3, 3, 2, "#8a6a24"); k.P(x + 1, 3, "#e8c35a"); } k.R(0, 8, W, 2, "#7a5a22"); k.R(0, 10, W, 1, "#401818");
    T.rect(k, 0, 112, W, 12, madera(["#7a5230", "#6a4428", "#5a3a22", "#4a2a1e", "#2e1a12"], { paso: 12, largo: 52, s: 903 })); k.R(0, 112, W, 2, "#7a5230"); k.R(0, 112, W, 1, "#a87444"); k.R(0, 123, W, 1, "#2e1a12");
    const wx = 18, ww = 44;
    k.R(wx - 3, 24, ww + 6, 66, "#7a5a22"); k.R(wx - 3, 24, ww + 6, 1, "#a8842e"); k.R(wx - 3, 89, ww + 6, 1, "#4a3414");
    ventanaArco(k, wx, 28, ww, 60, "#7a5a22", "#2a3670");
    T.rect(k, wx, 28, ww, 60, (x, y) => ((y >= 50 || Math.hypot(x - 40, y - 50) < 21.5) && ((x - wx + y) % 6 === 0 || (x - wx - y + 120) % 6 === 0) ? "#3a2a14" : null));
    k.R(wx + ww / 2 - 1, 28, 2, 60, "#7a5a22"); k.R(wx, 58, ww, 2, "#7a5a22");
    const CORT = ["#b02a36", "#8f1d22", "#7a1820", "#5a1218", "#3a0c10"];
    rellena(k, [[wx - 6, 22], [wx + ww + 6, 22], [wx + ww + 6, 32], [wx + ww - 6, 58], [wx + ww * 0.6, 28], [wx + ww * 0.4, 28], [wx + 6, 58], [wx - 6, 32]], (x, y) => rampa(CORT, 0.15 + (Math.sin(x / 2.2 + y / 14) * 0.5 + 0.5) * 0.45 + ((y - 22) / 36) * 0.15, x, y));
    k.R(wx - 6, 22, ww + 12, 2, "#c9a03c"); k.R(wx - 6, 22, ww + 12, 1, "#e8c35a"); for (let x = wx - 5; x < wx + ww + 6; x += 3) k.P(x, 24, "#a8842e");
    [[wx + 6, 58], [wx + ww - 6, 58]].forEach(([x, y]) => { k.R(x - 2, y - 2, 4, 2, "#c9a03c"); k.R(x - 1, y, 2, 4, "#e8c35a"); k.R(x - 2, y + 4, 4, 2, "#a8842e"); });
    const retrato = (x, y, w, hh, c, s) => {
      k.R(x - 1, y - 1, w + 2, hh + 2, "#5a4214"); T.rect(k, x, y, w, hh, (px, py) => { const b = Math.min(px - x, x + w - 1 - px, py - y, y + hh - 1 - py); return b < 2 ? rampa(ORO, b === 0 ? 0.1 : 0.45, px, py) : null; });
      [[x, y], [x + w - 2, y], [x, y + hh - 2], [x + w - 2, y + hh - 2]].forEach(([a, b]) => k.R(a, b, 2, 2, "#ffe08a"));
      T.rect(k, x + 2, y + 2, w - 4, hh - 4, (px, py) => rampa(["#3a4a3a", "#2a3a2e", "#222a24", "#1a201c"], 0.2 + ((py - y) / hh) * 0.5 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.3, px, py));
      k.poli([[x + 5, y + hh - 2], [x + w / 2, y + hh * 0.5], [x + w - 5, y + hh - 2]], c); k.poli([[x + w / 2, y + hh * 0.5], [x + w - 5, y + hh - 2], [x + w / 2 + 2, y + hh - 2]], mezcla(c, "#000000", 0.3));
      k.elipse(x + w / 2, y + hh * 0.42, 3.5, 4, "#d8b890"); k.P(x + w / 2 - 2, y + hh * 0.42, "#3a2a20"); k.P(x + w / 2 + 1, y + hh * 0.42, "#3a2a20"); k.R(x + w / 2 - 2, y + hh * 0.42 + 3, 4, 3, "#e8e0d0");
      k.poli([[x + w / 2 - 5, y + hh * 0.32], [x + w / 2 + 5, y + hh * 0.32], [x + w / 2 + 1, y + 4]], mezcla(c, "#000000", 0.4));
      k.alfa(0.16, () => k.linea(x + 3, y + hh - 4, x + w - 4, y + 3, "#ffffff"));
    };
    retrato(74, 22, 24, 30, "#2f5fa8", 904); retrato(226, 20, 26, 32, "#6a3f9a", 905);
    const CH = ["#a8a6b8", "#8e8c9e", "#7a788a", "#666476", "#5a5868", "#3e3c4a"];
    T.rect(k, 106, 34, 108, 90, sillar(CH, { ah: 7, an: 13, s: 906, x0: 106, y0: 34 }));
    k.R(98, 28, 124, 8, CH[1]); k.R(98, 28, 124, 1, "#c4c2d2"); k.R(98, 31, 124, 1, CH[2]); k.R(100, 34, 120, 2, CH[4]); k.R(102, 36, 116, 2, "#4a4858");
    [100, 212].forEach((x) => { k.R(x, 36, 8, 6, CH[2]); k.R(x, 36, 8, 1, CH[1]); k.R(x + 1, 42, 6, 1, CH[4]); });
    k.elipse(160, 94, 35, 31, CH[1]); for (let a = Math.PI + 0.12; a < Math.PI * 2; a += 0.26) k.linea(160 + Math.cos(a) * 32, 94 + Math.sin(a) * 28, 160 + Math.cos(a) * 35, 94 + Math.sin(a) * 31, CH[5]); k.R(156, 62, 8, 5, CH[0]); k.R(156, 66, 8, 1, CH[4]);
    k.R(125, 94, 70, 30, CH[1]);
    bola(k, 160, 94, 32, 28, (x, y) => (y <= 94 ? rampa(["#3a2420", "#2a1818", "#1f1414", "#140e0e"], 0.3 + ((94 - y) / 28) * 0.6, x, y) : null));
    T.rect(k, 128, 94, 64, 26, (x, y) => { const ff = Math.floor(y / 3), bx = x + (ff % 2) * 2; return y % 3 === 0 || bx % 5 === 0 ? "#140e0e" : rampa(["#3a2420", "#2a1818", "#1f1414"], 0.3 + ((120 - y) / 26) * 0.4, x, y); });
    k.R(124, 120, 72, 4, CH[2]); k.R(124, 120, 72, 1, CH[0]);
    k.elipse(160, 118, 28, 6, "#e86a2a"); for (let i = 0; i < 70; i++) { const a = hash(i, 1, 912) * 6.28, r = Math.sqrt(hash(i, 2, 912)), x = 160 + Math.cos(a) * r * 26, y = 118 + Math.sin(a) * r * 5; k.crudo(x, y, 1, 1, ["#ffb43a", "#c8361c", "#7a1e14", "#f06a24"][i % 4]); }
    [[-6, 6], [6, -6]].forEach(([a, b]) => { k.linea(160 + a * 3, 122, 160 + b * 3, 117, "#3a2414", 3); k.linea(160 + a * 3, 121, 160 + b * 3, 116, "#5a3a22"); k.crudo(160 + b * 3 - 1, 116, 2, 2, "#ffb43a"); });
    [134, 184].forEach((x) => { k.R(x, 112, 2, 10, "#26262a"); k.R(x - 2, 121, 6, 1, "#26262a"); k.R(x - 1, 110, 4, 3, "#c9a03c"); k.P(x - 1, 110, "#e8c35a"); });
    k.llama(146, 120, 1.3 * f); k.llama(172, 120, 1.3 * f); k.llama(160, 120, 1.9 * f);
    brillo(k, 160, 106, 40, 30, "#ff9a3a", 0.6);
    L.push({ x: 160, y: 120, r: 150, ry: 66, col: "#ffa850", f: 0.5 * f });
    if (escudo) escudo(k);
    else {
      k.poli([[141, 41], [179, 41], [179, 58], [160, 69], [141, 58]], "#8a6a24"); k.poli([[142, 42], [178, 42], [178, 58], [160, 68], [142, 58]], "#c9a03c");
      rellena(k, [[144, 44], [176, 44], [176, 57], [160, 66], [144, 57]], (x, y) => rampa(["#c0392b", "#a8282a", "#8f1d22", "#6a1418"], 0.15 + ((x - 144) / 32) * 0.5 + ((y - 44) / 22) * 0.2, x, y));
      glifo(k, 155, 46, ["....11....", "...1111...", "..111111..", "..11.111.1", "...111111.", "..1111111.", ".11.1111..", ".1..11.11.", "....1...1.", "...11..11."], (i, j) => (j < 3 ? "#ffe08a" : "#e8c35a"));
      k.R(142, 42, 18, 1, "#ffe08a");
    }
    [126, 190].forEach((x) => { k.R(x - 1, 26, 6, 2, "#c9a03c"); k.R(x, 25, 4, 1, "#e8c35a"); k.R(x, 20, 4, 5, "#f4efe0"); k.R(x + 3, 20, 1, 5, "#d8cdb4"); k.P(x + 1, 19, "#ffcf6a"); k.P(x + 1, 18, "#ffe6a8"); k.P(x + 2, 19, "#ffe06a"); k.alfa(0.25, () => k.elipse(x + 2, 18, 4, 4, "#ffcf6a")); });
    suelo3d(k, 124, 180, 160, 70, tablones(["#a8784e", "#9a6a46", "#8a5a3a", "#6a4228", "#4a2e1a"], { pw: 12, L: 60, s: 907 }));
    bola(k, 160, 152, 122, 23, (x, y) => { const q = Math.hypot((x - 160) / 122, (y - 152) / 23); if (q > 0.93) return "#8f1d22"; if (q > 0.86) return Math.floor((x - 160) / 4 + (y > 152 ? 1 : 0)) % 2 ? "#c9a03c" : "#a8842e"; if (q > 0.82) return "#8f1d22"; if (q < 0.3) return q > 0.25 ? "#c9a03c" : rampa(["#c0392b", "#a8282a"], hash(x >> 1, y, 908), x, y); return rampa(["#b83030", "#a8282a", "#962424", "#8a2020"], 0.2 + (fbm(x * 0.2, y * 0.4, 909) - 0.5) * 0.4 + q * 0.3, x, y); });
    for (let y = 145; y < 160; y += 2) { k.R(36, y, 2, 1, "#e8d8b0"); k.R(282, y, 2, 1, "#e8d8b0"); }
    const sillon = (x, y, d) => {
      const R = ["#e05a48", "#c83a34", "#a82a2a", "#8a2224", "#601618"];
      sombraE(k, x + 21, y + 38, 26, 3, 0.45);
      T.rect(k, x, y, 42, 22, (px, py) => rampa(R, 0.15 + Math.abs((px - x) / 42 - (d > 0 ? 0.3 : 0.7)) * 0.9 + ((py - y) / 22) * 0.2, px, py));
      for (let by = y + 5; by < y + 20; by += 6) for (let bx = x + 6 + ((by - y) % 12 ? 4 : 0); bx < x + 38; bx += 8) { k.P(bx, by, R[4]); k.P(bx - 1, by - 1, R[0]); }
      T.rect(k, x + 4, y + 16, 34, 12, (px, py) => rampa(R, 0.08 + ((py - y - 16) / 12) * 0.5 + Math.abs((px - x - 21) / 34) * 0.3, px, py)); k.R(x + 4, y + 16, 34, 1, R[0]);
      esfera(k, x - 1, y + 14, 6, 11, [R[0], R[1], R[2], R[3]]); esfera(k, x + 43, y + 14, 6, 11, [R[0], R[1], R[2], R[3]]);
      k.R(x, y + 28, 42, 6, R[3]); k.R(x, y + 28, 42, 1, R[2]); k.R(x, y + 34, 5, 4, "#3a2414"); k.R(x + 37, y + 34, 5, 4, "#3a2414"); k.P(x, y + 34, "#6a4428"); k.P(x + 37, y + 34, "#6a4428");
    };
    sombraE(k, 122, 165, 26, 2.5, 0.4);
    T.rect(k, 100, 150, 44, 4, madera(["#c08a54", "#a87444", "#8a5a32", "#6a4426", "#4a2e18"], { paso: 2, largo: 99, s: 910 })); k.R(100, 150, 44, 1, "#d8a46a"); k.R(100, 153, 44, 1, "#4a2e18");
    [104, 137].forEach((x) => { k.R(x, 154, 3, 10, "#4a2e18"); k.P(x, 154, "#6a4426"); k.R(x - 1, 158, 5, 1, "#6a4426"); });
    for (let j = 0; j < 2; j++) for (let i = 0; i < 8; i++) k.P(105 + i, 150 + j, (i + j) % 2 ? "#f4efe0" : "#3a3a44"); k.P(106, 149, "#f4efe0"); k.P(107, 148, "#f4efe0"); k.P(111, 149, "#3a3a44"); k.P(111, 148, "#3a3a44");
    k.R(118, 147, 12, 3, "#8f1d22"); k.R(119, 146, 10, 1, "#f4efe0"); k.R(118, 147, 12, 1, "#b02a36"); k.R(132, 148, 8, 2, "#f4efe0"); k.linea(134, 148, 139, 143, "#e8e0d0"); k.P(139, 143, "#c8c0b0");
    for (let i = 0; i < 7; i++) { const x = 274 + i * 7, y = 124 - i * 11; T.rect(k, x, y, 60, 11, madera(["#9a7450", "#86603e", "#7a5a3e", "#6a4a32", "#4a3222"], { paso: 3, largo: 40, s: 911 + i })); k.R(x, y, 60, 1, "#b88e64"); k.R(x, y + 1, 60, 1, "#5a3e28"); k.alfa(0.35, () => k.R(x, y + 2, 3, 9, "#000000")); }
    for (let i = 0; i < 7; i++) { const x = 276 + i * 7, y = 124 - i * 11, by = 112 - (x - 272) * 1.44; k.R(x, by, 1, y - by, "#3f2616"); k.P(x, (y + by) / 2, "#6a4426"); }
    k.linea(272, 112, 322, 40, "#3f2616", 2); k.linea(272, 111, 322, 39, "#7a5230");
    k.R(270, 106, 4, 18, "#4a2e18"); k.R(270, 106, 1, 18, "#6a4426"); k.R(269, 104, 6, 3, "#6a4426"); k.R(270, 103, 4, 1, "#a87444");
    sillon(38, 108, 1); sillon(226, 108, -1);
    luces(k, L);
  }
  window.MAG27.comedor = comedor; window.MAG27.salaComun = salaComun;
  MAG[9] = ["La sala común de Gryffondir", "La chimenea, los sillones rojos y las escaleras", (k) => salaComun(k), { fuerza: 0.25, fuego: ["#e86a2a", "#ffcf6a", "#e8502a", "#ff9a3a", "#ffe06a", "#ffe6a8"], ventanal: "#2a3670" }];

  function kuidditch(k) {
    k.banda(["#5fa8e0", "#8cc6ea", "#d4e6ee"], 0, 120);
    nubarron(k, -20, 34, 90, 14); nubarron(k, 96, 22, 66, 10); nubarron(k, 240, 30, 96, 16);
    montana(k, 160, 118, 360, 34, { roca: ["#8fb0c8", "#7ca0b8", "#6e92aa", "#60849c"] }); granoMonte(k, 160, 118, 360, 34, 401, 10);
    const TAL = ["#7cbc66", "#6aa85a", "#5c9c4c", "#4e8a42", "#407a38"];
    T.rect(k, 0, 113, W, 7, (x, y) => rampa(TAL, 0.3 + ((y - 113) / 7) * 0.4 + (fbm(x * 0.2, y * 0.5, 402) - 0.5) * 0.3, x, y)); briznas(k, 0, W, 113, [TAL[4], TAL[2], TAL[0]], { n: 160, alto: 3, s: 403 });
    const CES = ["#9ad880", "#86c86c", "#74b460", "#62a052", "#548e46"];
    T.rect(k, 0, 120, W, 60, (x, y) => rampa(CES, 0.22 + (Math.floor(((x - 160) / (y + 10)) * 6.4 + 100) % 2) * 0.18 + ((y - 120) / 60) * 0.12 + (fbm(x * 0.15, y * 0.3, 404) - 0.5) * 0.25 + (hash(x, y, 405) - 0.5) * 0.08, x, y));
    [[8, "#8f1d22", "#c9a03c"], [54, "#c9a03c", "#26262a"], [100, "#2f5fa8", "#c9a03c"], [176, "#2f7a4a", "#c8c8d0"], [222, "#8f1d22", "#c9a03c"], [268, "#2f5fa8", "#c9a03c"]].forEach(([x, c, l], i) => {
      const hh = 54 + (i % 3) * 9, top = 118 - hh, pie = 123, C = tonos5(c, 0.22, 0.5), cuerpo = pie - 4 - (top + 12);
      sombraE(k, x + 25, pie + 1, 23, 3, 0.45);
      T.rect(k, x + 4, pie - 4, 34, 5, sillar(["#c8c0b0", "#b0a898", "#988f80", "#7c766a", "#5e5a50"], { ah: 3, an: 7, s: 410 + i, x0: x + 4, y0: pie - 4 })); k.R(x + 4, pie - 4, 34, 1, "#d8d0c0");
      T.rect(k, x + 7, top + 12, 28, cuerpo, madera(["#b8946a", "#a8865e", "#8a6a44", "#6a5034", "#4a3620"], { paso: 5, vertical: true, largo: 99, s: 420 + i }));
      k.R(x + 6, top + 12, 2, cuerpo, "#4a3620"); k.R(x + 34, top + 12, 2, cuerpo, "#4a3620");
      [0.38, 0.68].forEach((fr) => { const ya = top + 12 + cuerpo * fr, yb = ya + cuerpo * 0.26; k.linea(x + 8, ya, x + 34, yb, "#5a4228", 2); k.linea(x + 34, ya, x + 8, yb, "#5a4228", 2); k.linea(x + 8, ya - 1, x + 34, yb - 1, "#a8865e"); k.R(x + 7, ya - 1, 28, 2, "#6a5034"); k.R(x + 7, ya - 1, 28, 1, "#8a6a44"); });
      k.alfa(0.3, () => k.R(x + 7, top + 15, 28, 4, "#000000"));
      briznas(k, x + 2, x + 40, pie + 1, [TAL[4], TAL[2], TAL[1]], { n: 18, alto: 3, s: 450 + i });
      k.R(x + 2, top, 38, 13, "#22222a");
      for (let px = x + 4; px < x + 38; px += 5) { const piel = ["#e8c8a0", "#d8a878", "#a87850", "#f0d0b0"][Math.floor(hash(px, i, 430) * 4)], pelo = ["#3a2414", "#c87a3a", "#e8c870", "#1a1a1e"][Math.floor(hash(px, i, 431) * 4)]; k.R(px, top + 9, 3, 4, c); k.R(px, top + 10, 3, 1, l); k.R(px, top + 5, 3, 3, piel); k.R(px, top + 4, 3, 1, pelo); if (hash(px, i, 432) < 0.3) k.R(px + (hash(px, i, 433) < 0.5 ? -1 : 3), top + 2, 1, 4, piel); }
      k.R(x + 2, top + 13, 38, 2, l); k.R(x + 2, top + 13, 38, 1, mezcla(l, "#ffffff", 0.3));
      for (let j = 0; j < 8; j++) { k.R(x + 2 + j * 5, top + 15, 3, 3, j % 2 ? c : l); k.R(x + 5 + j * 5, top + 15, 2, 3, mezcla(j % 2 ? l : c, "#000000", 0.2)); }
      rellena(k, [[x, top], [x + 42, top], [x + 21, top - 18]], (px, py) => rampa(C, 0.12 + (Math.floor((px - x) / 4) % 2 ? 0.25 : 0) + (px > x + 21 ? 0.25 : 0), px, py));
      for (let px = x; px < x + 42; px += 4) k.elipse(px + 2, top + 1, 2, 1.5, C[2]);
      k.R(x + 20, top - 24, 1, 7, "#26262a"); bandera(k, x + 21, top - 24, 12, 5, l);
    });
    bola(k, 160, 152, 56, 14, (x, y) => (Math.hypot((x - 160) / 56, (y - 152) / 14) > 0.94 ? "#e8f4e0" : null));
    briznas(k, 0, W, 122, ["#548e46", "#74b460", "#9ad880"], { n: 140, alto: 3, s: 440, y1: 180 });
    [[159, 134, 70], [144, 136, 52], [174, 136, 56]].forEach(([x, b, hh]) => {
      sombraE(k, x + 3, b + 1, 6, 1.6, 0.45); k.elipse(x + 1, b, 3, 1, "#3a5a2a");
      cilindro(k, x, b - hh, 3, hh, ORO, 0.3);
      const cx = x + 1, cy = b - hh - 9;
      for (let a = 0; a < 6.28; a += 0.03) { const px = cx + Math.cos(a) * 10, py = cy + Math.sin(a) * 10; k.R(px - 1, py - 1, 3, 3, rampa(ORO, 0.3 + (0.5 - Math.cos(a + 2.3) * 0.5) * 0.6, px, py)); }
      for (let a = 0; a < 6.28; a += 0.03) if (Math.cos(a + 2.3) > 0.5) k.P(cx + Math.cos(a) * 10 - 1, cy + Math.sin(a) * 10 - 1, ORO[0]);
    });
    esfera(k, 92, 44, 3, 3, ["#7a7a86", "#4a4a54", "#26262a"]); k.P(91, 43, "#b0b0bc");
    k.P(200, 70, "#ffe08a"); k.P(199, 69, "#ffffff"); k.P(201, 69, "#ffffff");
    sombraE(k, 119, 160, 4, 1, 0.4); esfera(k, 118, 157, 3, 3, ["#e0604a", "#c0392b", "#8f1d22"]); k.P(117, 156, "#f08a70");
    [[86, 174], [230, 176]].forEach(([x, y]) => { sombraE(k, x + 9, y + 7, 11, 1.8, 0.4); T.rect(k, x, y, 16, 3, madera(["#b88a5a", "#a87444", "#8a5a32", "#6a4426", "#4a2e18"], { paso: 3, largo: 99, s: x })); k.R(x, y, 16, 1, "#c99a64"); k.R(x + 1, y + 3, 2, 4, "#5a3a22"); k.R(x + 13, y + 3, 2, 4, "#5a3a22"); });
  }
  MAG[4] = ["El campo de Kuidditch", "Las torres de las casas y los tres aros", kuidditch, { tinte: 0.2 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, montana, loma, camino, matas, bandera, rotulo, brillo } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, madera, suelo3d, tablones, briznas, pase, sombra, sombraE, luces, bruma, rayos, fuego, encendido } = Det6;
  const T = window.P15, { tonos5, granoMonte, sillar, glifo, casaT27, tumba27, marca27, abeto, NIEVE, ORO } = window.MAG27;
  const W = 320;
  const MAG = (window.SitiosIt27.magos = window.SitiosIt27.magos || {});
  const VEN = ["#ffd27a"];

  function ajedrez(k) {
    const L = [];
    T.rect(k, 0, 0, W, 100, sillar(["#3e384a", "#322c3e", "#282334", "#1f1b2a", "#17141f", "#0e0d14"], { ah: 13, an: 32, s: 150, x0: 8, y0: 4 }));
    pase(k, (x, y, d, i) => { const m = 0.72 + 0.28 * (y / 100); d[i] *= m; d[i + 1] *= m; d[i + 2] *= m; }, 0, 0, W, 100);
    for (let i = 0; i < 90; i++) { const x = hash(i, 1, 154) * W, y = 84 + hash(i, 2, 154) * 15; k.P(x, y, ["#26342a", "#2e3e30"][i % 2]); }
    k.R(144, 0, 32, 3, "#0a0a10"); k.R(146, 0, 28, 2, "#5a5470");
    rayos(k, [[160, 0, 160, 100, 26, 140]], "#d8d0ff", 0.16);
    for (let i = 0; i < 34; i++) { const t = hash(i, 1, 155), y = t * 98, a = 13 + t * 57, x = 160 + (hash(i, 2, 155) - 0.5) * 2 * a; k.crudo(x, y, 1, 1, "#d8d0ff"); }
    [[26, 50], [294, 50], [100, 44], [220, 44]].forEach(([x, y]) => {
      k.halo(x, y - 6, 22, 22, "#ff9a3a", 0.3);
      k.R(x - 4, y + 6, 9, 2, "#3a3a44"); k.R(x - 4, y + 6, 9, 1, "#5a5a66");
      k.R(x - 1, y, 3, 13, "#5a3a22"); k.R(x - 1, y, 1, 13, "#7a5232"); for (let j = 2; j < 12; j += 3) k.R(x - 1, y + j, 3, 1, "#3a2414");
      k.R(x - 3, y - 1, 7, 2, "#7a6a4a"); k.R(x - 3, y - 1, 7, 1, "#9a8a6a");
      k.llama(x, y, 0.5);
      L.push({ x, y: y - 4, r: 46, ry: 40, col: "#ff9a3a", f: 0.55 });
    });
    const BLc = ["#f4f0e6", "#e6e0d2", "#d8d2c4", "#c0baac", "#a8a294"], NEc = ["#5a5664", "#4a4652", "#3a3642", "#2e2a36", "#221f28"];
    T.rect(k, 0, 100, W, 80, (x, y) => {
      const f = Math.pow(Math.max(0.001, y - 100) / 80, 1 / 1.5), cw = 32 + 58 * f, cf = (x - 160) / cw, c = Math.floor(cf), r = Math.floor(f * 8), cl = (r + c + 64) % 2, u = cf - c, v = f * 8 - r;
      const vena = Math.abs(fbm(x * 0.07 + c * 5, y * 0.12 + r * 5, 151 + cl) - 0.5) < 0.03, borde = v < 0.06 || u < 0.012 ? 0.3 : v > 0.94 ? -0.12 : 0;
      return rampa(cl ? BLc : NEc, 0.3 + (vena ? 0.3 : 0) + borde + (fbm(x * 0.2, y * 0.3, 152) - 0.5) * 0.2 + (hash(c, r, 153) - 0.5) * 0.12, x, y);
    });
    k.R(0, 99, W, 2, "#0e0d14");
    luces(k, L);
    const pieza = (x, b, t, e, C) => {
      const [l, c1, c, o, oo] = C;
      sombraE(k, x + 4 * e, b + 1, 17 * e, 3 * e, 0.5);
      rellena(k, [[x - 13 * e, b], [x + 13 * e, b], [x + 9 * e, b - 8 * e], [x - 9 * e, b - 8 * e]], (px, py) => rampa(C, 0.05 + Math.abs((px - x) / (13 * e) + 0.4) * 0.6 + ((py - b + 8 * e) / (8 * e)) * 0.2, px, py));
      k.R(x - 9 * e, b - 8 * e, 18 * e, 1, l); k.R(x - 13 * e, b - 1, 26 * e, 1, oo); k.R(x - 11 * e, b - 4 * e, 22 * e, 1, o);
      Det.cilindro(k, x - 6 * e, b - 34 * e, 12 * e, 27 * e, C, 0.3); k.R(x - 4 * e, b - 32 * e, 1, 22 * e, l);
      k.R(x - 9 * e, b - 37 * e, 18 * e, 3 * e, c1); k.R(x - 9 * e, b - 37 * e, 18 * e, 1, l); k.R(x - 9 * e, b - 34 * e, 18 * e, 1, oo);
      if (t === "torre") { Det.cilindro(k, x - 9 * e, b - 52 * e, 18 * e, 15 * e, C, 0.3); k.R(x - 7 * e, b - 50 * e, 1, 12 * e, l); k.R(x - 1, b - 48 * e, 2, 5 * e, oo); [-9, -3, 4].forEach((d, j) => { k.R(x + d * e, b - 58 * e, 5 * e, 6 * e, [c1, c, o][j]); k.R(x + d * e, b - 58 * e, 5 * e, 1, l); }); }
      if (t === "reina") { esfera(k, x, b - 44 * e, 8 * e, 9 * e, C); [-8, -4, 0, 4, 8].forEach((d) => k.poli([[x + (d - 2) * e, b - 50 * e], [x + (d + 2) * e, b - 50 * e], [x + d * 1.2 * e, b - 62 * e]], d < 0 ? c1 : d > 0 ? o : c)); esfera(k, x, b - 63 * e, 2 * e, 2 * e, C); k.P(x - 3 * e, b - 47 * e, l); }
      if (t === "rey") { esfera(k, x, b - 44 * e, 8 * e, 9 * e, C); k.R(x - e, b - 66 * e, 3 * e, 14 * e, c); k.R(x - 5 * e, b - 62 * e, 11 * e, 3 * e, c); k.R(x - e, b - 66 * e, 1, 14 * e, l); k.R(x - 5 * e, b - 62 * e, 11 * e, 1, l); k.P(x - 3 * e, b - 47 * e, l); }
      if (t === "alfil") { esfera(k, x, b - 46 * e, 7 * e, 11 * e, C); esfera(k, x, b - 59 * e, 2 * e, 2 * e, C); k.linea(x + 1 * e, b - 52 * e, x + 5 * e, b - 44 * e, oo); k.P(x - 3 * e, b - 50 * e, l); }
      if (t === "caballo") { rellena(k, [[x - 8 * e, b - 36 * e], [x - 6 * e, b - 50 * e], [x + 2 * e, b - 58 * e], [x + 5 * e, b - 64 * e], [x + 7 * e, b - 56 * e], [x + 15 * e, b - 46 * e], [x + 12 * e, b - 41 * e], [x + 3 * e, b - 44 * e], [x + 7 * e, b - 36 * e]], (px, py) => rampa(C, 0.05 + ((px - x + 8 * e) / (23 * e)) * 0.75, px, py)); for (let j = 0; j < 5; j++) k.linea(x - 7 * e + j * 0.6 * e, b - 40 * e - j * 4 * e, x - 4 * e + j * 1.2 * e, b - 44 * e - j * 4 * e, oo); k.R(x + 4 * e, b - 54 * e, 2 * e, 2 * e, oo); k.P(x + 13 * e, b - 45 * e, oo); k.P(x - 4 * e, b - 48 * e, l); }
      k.P(x + 5 * e, b - 30 * e, "#ff9a3a");
    };
    const NE = ["#7a7886", "#5a5866", "#4a4852", "#3a3842", "#26242c"], BL = ["#ffffff", "#efeade", "#d8d2c4", "#b8b2a4", "#9a9486"];
    ["torre", "caballo", "alfil", "reina", "rey", "alfil", "caballo", "torre"].forEach((t, i) => pieza(20 + i * 40, 112, t, 1, NE));
    pieza(34, 172, "caballo", 1.25, BL); pieza(290, 174, "torre", 1.25, BL);
    const escombro = (x, b, w, h, C, s) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.45); rellena(k, [[x, b], [x + w * 0.15, b - h * 0.7], [x + w * 0.45, b - h], [x + w * 0.8, b - h * 0.65], [x + w, b]], (px, py) => rampa(C, 0.1 + ((px - x) / w) * 0.6 + ((py - b + h) / h) * 0.2 + (hash(px, py, s) - 0.5) * 0.15, px, py)); k.linea(x + w * 0.15, b - h * 0.7, x + w * 0.45, b - h, C[0]); for (let j = 0; j < 4; j++) { const cx = x + hash(j, 1, s) * w * 1.4 - w * 0.2, cy = b - hash(j, 2, s) * 2; k.R(cx, cy - 1, 2, 2, C[1]); k.P(cx + 1, cy, C[3]); } };
    escombro(52, 130, 18, 7, NE, 160); escombro(256, 136, 22, 8, BL, 161); escombro(216, 160, 24, 9, BL, 162);
  }
  MAG[15] = ["El ajedrez gigante", "El tablero de piedra bajo la trampilla, con sus piezas enormes", ajedrez, { cielo: "propio", fuerza: 0.08, fuego: ["#ff9a3a", "#ffe06a", "#e8502a"] }];

  function hegsmoade(k) {
    const lit = encendido(k), L = [];
    k.banda(["#3a4a7a", "#5a6a9a", "#8a9abc", "#b8c4d8"], 0, 130);
    const NU = ["#ffffff", "#e0e6f0", "#b8c4d8"]; nubarron(k, -24, 28, 100, 14, NU); nubarron(k, 240, 22, 100, 14, NU);
    const MR = ["#a8b4c8", "#8a98b0", "#74829c", "#5e6c86"], MN = ["#ffffff", "#dde6f0"];
    montana(k, 70, 130, 240, 84, { roca: MR, nieve: MN, hasta: 0.6 }); montana(k, 262, 130, 220, 72, { roca: MR, nieve: MN, hasta: 0.6 });
    granoMonte(k, 70, 130, 240, 84, 301, 9); granoMonte(k, 262, 130, 220, 72, 302, 9);
    k.poli([[145, 108], [157, 108], [156, 99], [146, 98]], "#4a3a34"); k.poli([[143, 99], [159, 100], [151, 92]], "#3a2e2a"); k.poli([[143, 99], [159, 100], [151, 93]], "#e8eef4"); k.R(148, 101, 3, 3, "#1a1414"); k.linea(147, 101, 151, 104, "#6a5a4a"); k.R(153, 102, 2, 5, "#1a1414"); k.R(155, 93, 2, 4, "#3a2e2a"); k.R(144, 108, 14, 1, "#c4d0dc");
    const c = (p, t) => ({ pared: p, viga: "#3a2a22", nieve: true, techo: t, techoO: "#4a3a30", puerta: "#3a2a22" });
    [[2, 128, 40, 26, c("#c8a888", "#6a5a4a")], [46, 130, 36, 30, { ...c("#e0c8a8", "#7a4a3a"), lad: -3 }], [90, 128, 44, 34, { ...c("#d8b898", "#6a4a3a"), lad: 3 }], [186, 128, 42, 32, { ...c("#e0c8a8", "#5a4a4a"), lad: -3 }], [234, 130, 36, 26, c("#c8a888", "#7a5a3a")], [276, 128, 46, 30, { ...c("#d8b898", "#6a5a4a"), lad: 3 }]]
      .forEach(([x, b, w, h, o], i) => L.push(...casaT27(k, x, b, w, h, { ...o, s: 310 + i * 10, luz: lit * 0.8 })));
    k.R(99, 115, 24, 13, "#5a3a22"); k.R(100, 116, 22, 11, "#ffd27a");
    for (let i = 0; i < 6; i++) { const jx = Math.round(102 + i * 3.4), col = ["#e85a8a", "#5ac0d8", "#f2c84b", "#8ad85a", "#c85ae8", "#ff8a4a"][i]; k.R(jx, 121, 2, 5, col); k.R(jx, 120, 2, 1, "#f4efe6"); k.P(jx, 122, mezcla(col, "#ffffff", 0.4)); }
    k.R(100, 120, 22, 1, "#8a5a32"); for (let i = 0; i < 5; i++) { const lx = 103 + i * 4; k.P(lx, 117, ["#e85a8a", "#f2c84b", "#5ac0d8"][i % 3]); k.P(lx, 118, "#f4efe6"); }
    k.R(111, 116, 1, 11, "#5a3a22");
    for (let x = 97; x < 125; x++) k.R(x, 111, 1, 4, Math.floor((x - 97) / 3) % 2 ? "#f4f0f4" : "#e85a8a"); for (let x = 97; x < 125; x += 3) k.elipse(x + 1, 115, 1.5, 1, "#e85a8a"); k.R(97, 111, 28, 1, "#f4f8fc");
    k.R(232, 92, 12, 2, "#3a2a22"); k.R(232, 92, 12, 1, "#5a4a3a"); k.R(234, 94, 1, 3, "#26262a"); k.R(241, 94, 1, 3, "#26262a");
    T.rect(k, 232, 97, 12, 9, madera(["#7a5232", "#6a4426", "#5a3a22", "#4a2e18", "#2e1a0e"], { paso: 3, largo: 99, s: 330 })); k.R(232, 97, 12, 1, "#f4f8fc");
    k.linea(234, 104, 242, 99, "#e8c35a"); k.linea(234, 99, 242, 104, "#e8c35a"); k.R(233, 104, 2, 2, "#c9a03c"); k.R(241, 104, 2, 2, "#c9a03c");
    T.rect(k, 0, 128, W, 52, (x, y) => rampa(NIEVE, 0.08 + (fbm(x * 0.05, y * 0.12, 303) - 0.5) * 0.5 + ((y - 128) / 52) * 0.1, x, y));
    for (let i = 0; i < 70; i++) k.P(hash(i, 1, 304) * W, 130 + hash(i, 2, 304) * 50, "#ffffff");
    k.alfa(0.5, () => { k.elipse(40, 150, 76, 5, "#c8d4e0"); k.elipse(280, 158, 76, 5, "#c8d4e0"); });
    camino(k, 128, 180, (f) => 160 + Math.sin(f * 3) * f * 14, (f) => 12 + f * 28, "#b8c4d4", "#c8d2de", "#a4b4c8");
    for (let y = 130; y < 180; y++) { const f = (y - 128) / 52, cx = 160 + Math.sin(f * 3) * f * 14, a = 12 + f * 28; k.P(cx - a * 0.45, y, "#a4b4c8"); k.P(cx + a * 0.45, y, "#a4b4c8"); }
    for (let i = 0; i < 18; i++) { const f = i / 18, y = 132 + f * 46, cx = 160 + Math.sin(f * 3) * f * 14 + (i % 2 ? 3 : -3) * (1 + f); k.R(cx, y, 1 + f, 1, "#98a8bc"); }
    [[112, 136], [210, 136]].forEach(([x, b]) => {
      sombraE(k, x + 3, b + 1, 5, 1.5, 0.4);
      k.R(x - 1, b - 2, 4, 2, "#26262a"); k.R(x, b - 22, 2, 20, "#3a3a44"); k.R(x, b - 22, 1, 20, "#5a5a66");
      k.R(x - 3, b - 29, 8, 8, "#26262a"); k.R(x - 2, b - 28, 6, 6, "#ffd27a"); k.R(x + 1, b - 28, 1, 6, "#26262a"); k.R(x - 2, b - 25, 6, 1, "#26262a");
      k.R(x - 4, b - 30, 10, 1, "#26262a"); k.poli([[x - 4, b - 30], [x + 5, b - 30], [x + 1, b - 34]], "#f4f8fc"); k.R(x, b - 35, 2, 1, "#26262a");
      brillo(k, x + 1, b - 25, 20, 18, "#ffcf6a", 0.6); L.push({ x: x + 1, y: b - 25, r: 34, ry: 26, col: "#ffcf7a", f: lit });
    });
    const PN = ["#4a7a6a", "#3a6a5a", "#2f5a4a", "#244a3e", "#1a3a30", "#102a22"];
    [[36, 158, 34], [288, 166, 38], [0, 186, 66], [320, 186, 70]].forEach(([x, b, hh], i) => abeto(k, x, b, hh, PN, { nieve: NIEVE, s: 340 + i }));
    luces(k, L);
    for (let i = 0; i < 90; i++) k.P(k.rnd() * 320, k.rnd() * 170, "#ffffff"); for (let i = 0; i < 26; i++) { const x = k.rnd() * 320, y = k.rnd() * 170; k.R(x, y, 2, 2, "#e8f0f8"); k.P(x, y, "#ffffff"); }
  }
  MAG[3] = ["Hegsmoade", "El pueblo nevado, con sus ventanas encendidas", hegsmoade, { ven: VEN, tinte: 0.2 }];

  function mundial(k) {
    const { h } = Det.cuando(k), lit = encendido(k), L = [];
    k.banda(["#1f2a5a", "#3a4a7a", "#6a7aa0"], 0, 112);
    const VM = ["#3f5a50", "#2f4a40", "#263e36", "#1f342c"];
    montana(k, 80, 116, 200, 26, { roca: VM }); montana(k, 260, 116, 180, 22, { roca: VM }); granoMonte(k, 80, 116, 200, 26, 191, 10); granoMonte(k, 260, 116, 180, 22, 192, 10);
    const OR2 = ["#f0d070", "#e8c35a", "#c9a03c", "#b8902f", "#8a6a1f", "#6a4f1a"];
    T.rect(k, 172, 58, 150, 42, (x, y) => { const t = (x - 172) / 150, f = Math.floor((y - 58) / 4), bx = x + (f % 2) * 4, junta = (y - 58) % 4 === 0 || bx % 8 === 0; return rampa(OR2, Math.abs(t - 0.2) * 1.1 + (junta ? 0.18 : 0) + (hash(bx >> 3, f, 193) - 0.5) * 0.14, x, y); });
    k.elipse(247, 58, 75, 12, "#e8c35a"); k.elipse(247, 58, 74, 11, "#c9a03c"); k.elipse(247, 58, 70, 10, "#6a4f1a");
    bola(k, 247, 58, 70, 10, (x, y) => (Math.hypot((x - 247) / 70, (y - 58) / 10) < 0.8 ? null : hash(x, y, 194) < 0.55 ? ["#3f9a4a", "#c0392b", "#e8c8a0", "#f4efe0", "#2f7a3a", "#ffd27a"][Math.floor(hash(x, y, 195) * 6)] : "#5a4214"));
    k.elipse(247, 59, 57, 6, "#2f6a3a"); k.elipse(247, 60, 55, 5, "#3f7a4a"); k.R(246, 56, 1, 8, "#8ac08a");
    for (let f = 0; f < 2; f++) for (let x = 178 + f * 6; x < 318; x += 13) { const y0 = 72 + f * 15, ah = 12; k.elipse(x + 3.5, y0, 4.5, 3.5, "#e8c35a"); k.R(x - 1, y0, 9, ah, "#e8c35a"); k.elipse(x + 3.5, y0, 3.5, 3, "#4a3410"); k.R(x, y0, 7, ah, "#4a3410"); k.R(x, y0, 2, ah, "#3a280c"); if (lit > 0.3 && hash(x, f, 196) < 0.45) k.R(x + 2, y0 + 3, 4, ah - 3, "#ffd27a"); }
    for (let x = 180; x < 318; x += 13) k.R(x, 66, 3, 3, "#ffe6a8");
    T.rect(k, 168, 100, 154, 12, sillar(["#a88a4a", "#8a6a2a", "#7a5a22", "#6a4a1a", "#4a3410", "#2e200a"], { ah: 4, an: 10, s: 197, x0: 168, y0: 100 }));
    k.R(168, 100, 154, 1, "#c9a03c"); k.R(168, 101, 154, 1, "#4a3410");
    [196, 246, 296].forEach((x) => { k.R(x - 6, 104, 12, 8, "#2e200a"); k.elipse(x, 104, 6, 3, "#2e200a"); k.R(x - 7, 102, 1, 10, "#c9a03c"); k.R(x + 6, 102, 1, 10, "#8a6a2a"); if (lit > 0.2) k.R(x - 4, 106, 8, 6, "#ffd27a"); L.push({ x, y: 110, r: 16, ry: 8, col: "#ffcf7a", f: lit * 0.7 }); });
    [[196, "#3f9a4a"], [238, "#c0392b"], [280, "#3f9a4a"]].forEach(([x, c]) => { k.R(x, 30, 1, 22, "#26262a"); k.P(x, 29, "#e8c35a"); bandera(k, x + 1, 30, 14, 8, c, mezcla(c, "#000000", 0.25)); });
    [[186, 46], [310, 46]].forEach(([x, y]) => { k.R(x, y, 2, 14, "#26262a"); k.R(x - 3, y - 3, 8, 3, "#3a3a44"); k.R(x - 2, y - 3, 6, 2, "#ffe6a8"); brillo(k, x + 1, y - 2, 16, 12, "#ffe6a8", 0.7); });
    if (h >= 5 && h <= 9) marca27(k, 88, 34);
    else [[60, 30, "#3fe87a"], [120, 22, "#ffe6a8"], [150, 46, "#e8502a"], [32, 54, "#ffe6a8"]].forEach(([x, y, c], i) => {
      const px = x + ((h * 23 + i * 40) % 40), r = 10 + ((h + i) % 4) * 3, claro = mezcla(c, "#ffffff", 0.5);
      for (let a = 0; a < 6.28; a += 0.45) { for (let t = 0.3; t <= 1; t += 0.1) k.crudo(px + Math.cos(a) * r * t, y + Math.sin(a) * r * t + t * t * 2, 1, 1, t > 0.8 ? claro : c); k.crudo(px + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2) + 3, 1, 1, "#ffe6a8"); k.crudo(px + Math.cos(a) * (r + 3), y + Math.sin(a) * (r + 3) + 6, 1, 1, c); }
      k.crudo(px - 1, y - 1, 3, 3, claro);
    });
    T.prado(k, 112, ["#74a460", "#5a8a4c", "#4a7a40", "#3f6a38", "#345a30"], 198, { n: 220 });
    sombra(k, [[168, 112], [322, 112], [322, 115], [168, 115]], 0.35);
    matas(k, 134, 178, 14, ["#3f6a38", "#5a8a4c", "#74a460"]);
    camino(k, 128, 180, (f) => 162 + Math.sin(f * 3) * 6, (f) => 11 + f * 22, "#94845c", "#a8966a", "#887850");
    for (let y = 129; y < 180; y++) { const f = (y - 128) / 52, cx = 162 + Math.sin(f * 3) * 6, a = 11 + f * 22; if (y % 2 === 0) { k.P(cx - a * 0.4, y, "#7a6a48"); k.P(cx + a * 0.4, y, "#7a6a48"); } if (hash(y, 1, 199) < 0.3) k.R(cx + (hash(y, 2, 199) - 0.5) * a * 1.4, y, 2, 1, "#c4b48a"); }
    const tienda = (x, b, w, hh, c, o, s) => {
      const C = tonos5(c, 0.2, 0.45), ax = x + w / 2, ay = b - hh;
      sombraE(k, ax + 3, b + 1, w * 0.62, 2.2, 0.45);
      rellena(k, [[x, b], [ax, ay], [x + w, b]], (px, py) => { const der = px > ax + w * 0.16 * ((py - ay) / hh), seam = Math.abs(((((px - ax) / Math.max(1, py - ay)) * 5) % 1 + 1) % 1 - 0.5) > 0.46; return rampa(C, 0.12 + (der ? 0.42 : 0) + (seam ? 0.15 : 0) + ((py - ay) / hh) * 0.12 + (hash(px >> 1, py >> 1, s) - 0.5) * 0.06, px, py); });
      k.linea(x, b, ax, ay, C[0]);
      k.poli([[x + w * 0.36, b], [x + w * 0.45, b - hh * 0.6], [x + w * 0.56, b]], "#ffd27a"); k.linea(x + w * 0.36, b, x + w * 0.45, b - hh * 0.6, C[3]); k.linea(x + w * 0.56, b, x + w * 0.45, b - hh * 0.6, C[4]);
      L.push({ x: x + w * 0.46, y: b - 2, r: w * 0.4, ry: 6, col: "#ffcf7a", f: lit * 0.6 });
      k.R(ax, ay - 8, 1, 8, "#26262a"); k.poli([[ax + 1, ay - 8], [ax + 8, ay - 6], [ax + 1, ay - 4]], o);
      k.linea(x - 4, b + 1, x + w * 0.16, b - hh * 0.3, "#c8bea8"); k.linea(x + w + 4, b + 1, x + w * 0.84, b - hh * 0.3, "#c8bea8"); k.P(x - 4, b + 1, "#3a2a1a"); k.P(x + w + 4, b + 1, "#3a2a1a");
    };
    [[6, 126, 34, 22, "#3f9a4a", "#2f7a3a"], [46, 124, 30, 20, "#c0392b", "#92281e"], [84, 126, 34, 22, "#e8dcc0", "#c4b598"], [122, 124, 26, 18, "#3f9a4a", "#2f7a3a"], [178, 124, 28, 14, "#2f5fa8", "#234a86"], [212, 124, 30, 15, "#c0392b", "#92281e"], [248, 126, 34, 16, "#3f9a4a", "#2f7a3a"], [288, 124, 30, 15, "#e8c35a", "#c09a2a"]].forEach(([x, b, w, hh, c, o], i) => tienda(x, b, w, hh, c, o, 180 + i));
    [[-8, 150, 46, 28, "#c0392b", "#92281e"], [48, 148, 42, 26, "#3f9a4a", "#2f7a3a"], [206, 148, 42, 26, "#e8dcc0", "#c4b598"], [262, 150, 46, 28, "#2f5fa8", "#234a86"]].forEach(([x, b, w, hh, c, o], i) => tienda(x, b, w, hh, c, o, 188 + i));
    [[108, 168], [214, 170]].forEach(([x, y]) => { sombraE(k, x, y + 1, 9, 2, 0.4); for (let a = 0; a < 6.28; a += 0.7) k.R(x + Math.cos(a) * 7 - 1, y + Math.sin(a) * 2 - 1, 3, 2, Math.round(a * 3) % 2 ? "#8a8478" : "#6a6458"); [[-5, 5], [5, -5], [-4, -3]].forEach(([a, b]) => k.linea(x + a, y, x + b, y - 3, "#3a2414", 2)); k.llama(x, y - 1, 0.5); brillo(k, x, y - 5, 16, 14, "#ffb04a", 0.6); L.push({ x, y: y - 3, r: 30, ry: 18, col: "#ffa850", f: 0.3 + lit * 0.6 }); });
    luces(k, L);
  }
  MAG[19] = ["El Mundial de Kuidditch", "Las tiendas del campamento y el gran estadio, con la Marca Tenebrosa en el cielo", mundial, { ven: ["#ffd27a"], tinte: 0.15, fuego: ["#3fe87a", "#a8ffc8", "#0f3a22", "#ffe6a8", "#e8502a", "#ff9a3a", "#ffe06a"] }];

  function laberinto(k) {
    k.banda(["#2a2f5a", "#4a4a7a", "#8a7a9a"], 0, 96);
    const SE = ["#5a9a62", "#4a8a54", "#3a7a48", "#2f6a3e", "#1f4a2c", "#143420", "#0a1a10"];
    const hoja = (x, y, esc, s) => { const cc = celdas(x / esc, y / esc, 3, 2.4, s, 0.9); return cc.borde < 0.12 ? 0.45 : cc.dx * 0.3 + cc.dy * 0.5 + (cc.id - 0.5) * 0.3; };
    T.rect(k, 118, 52, 84, 80, (x, y) => (y < 58 + 4 * (1 - Math.abs(Math.sin((x - 118) * 0.35))) ? null : rampa(SE, 0.45 + hoja(x, y, 0.7, 251) * 0.5 + ((y - 62) / 70) * 0.25, x, y)));
    k.R(150, 88, 20, 44, "#0a1a10"); k.elipse(160, 88, 10, 8, "#0a1a10"); k.R(154, 122, 12, 10, "#14241a"); k.R(156, 126, 8, 6, "#1a2e20");
    const topeL = (x) => 6 + ((x + 4) / 126) * 56, baseL = (x) => 190 - ((x + 4) / 126) * 58;
    const muro = (x, y, xm, extra, s) => { const f = (xm + 4) / 126, bump = Math.abs(Math.sin(xm / (2 + f * 2))) * (9 - f * 5) * 0.6; if (y < topeL(xm) - bump || y > baseL(xm)) return null; return rampa(SE, 0.04 + extra + hoja(x, y, 1.7 - f * 1.1, s) * 0.55 + f * 0.26 + (y > baseL(xm) - 8 * (1 - f * 0.6) ? 0.25 : 0), x, y); };
    T.rect(k, -4, 0, 127, 190, (x, y) => muro(x, y, x, 0, 252)); T.rect(k, 198, 0, 126, 190, (x, y) => muro(x, y, 320 - x, 0.14, 253));
    rellena(k, [[-4, 190], [324, 190], [198, 132], [122, 132]], (x, y) => { const dy = y - 120, XX = ((x - 160) / dy) * 30, ZZ = 600 / dy, cc = celdas(XX, ZZ * 3, 3, 3, 255, 0.9); return rampa(["#8a8a64", "#7a7a58", "#6a6a48", "#5a5a3c", "#4a4a30", "#3a3a24"], 0.3 + (cc.borde < 0.1 ? 0.25 : 0) + (hash(Math.floor(XX), Math.floor(ZZ * 2), 254) < 0.08 ? -0.2 : 0) + (fbm(x * 0.1, y * 0.2, 256) - 0.5) * 0.3, x, y); });
    sombra(k, [[-4, 190], [50, 190], [134, 132], [122, 132]], 0.35); sombra(k, [[324, 190], [270, 190], [186, 132], [198, 132]], 0.4);
    [[60, 178, 92, 160], [260, 176, 226, 158], [110, 168, 126, 152]].forEach(([a, b, c, d]) => { trazo(k, [[a, b], [(a + c) / 2, (b + d) / 2 + 2], [c, d]], (f) => (f < 0.5 ? "#4a3a24" : "#3a2e1e"), 3, 1); trazo(k, [[a, b - 1], [(a + c) / 2, (b + d) / 2 + 1], [c, d - 1]], "#6a5434", 1); });
    for (let i = 0; i < 26; i++) { const y = 140 + hash(i, 1, 257) * 40, x = 160 + (hash(i, 2, 257) - 0.5) * (y - 120) * 2.4; k.R(x, y, 2, 1, ["#8a6a2a", "#a8842e", "#6a5a2a"][i % 3]); }
    k.halo(160, 112, 36, 36, "#9ad8ff", 0.45);
    T.rect(k, 152, 127, 16, 5, sillar(["#9a9aa2", "#7a7a82", "#6a6a72", "#5a5a62", "#4a4a52", "#3a3a42"], { ah: 3, an: 6, s: 258, x0: 152, y0: 127 })); k.R(150, 126, 20, 2, "#a8a8b0"); k.R(150, 126, 20, 1, "#c8c8d0");
    k.R(153, 123, 14, 3, "#c9a03c"); k.R(153, 123, 14, 1, "#e8c35a"); k.R(158, 116, 4, 7, "#e8c35a"); k.R(158, 116, 1, 7, "#ffe08a"); k.R(157, 118, 6, 2, "#c9a03c");
    rellena(k, [[150, 104], [170, 104], [166, 116], [154, 116]], (x, y) => rampa(ORO, ((x - 150) / 20) * 0.8 + ((y - 104) / 12) * 0.15, x, y)); k.R(150, 103, 20, 2, "#ffe08a"); k.R(152, 104, 16, 1, "#a8842e");
    k.linea(150, 106, 145, 111, "#e8c35a"); k.linea(145, 111, 152, 115, "#e8c35a"); k.linea(170, 106, 175, 111, "#c9a03c"); k.linea(175, 111, 168, 115, "#c9a03c");
    k.P(153, 107, "#d8f4ff"); k.P(154, 108, "#ffffff"); k.R(155, 110, 1, 3, "#ffe08a");
    for (let i = 0; i < 22; i++) { const x = 136 + hash(i, 1, 259) * 48, y = 92 + hash(i, 2, 259) * 38; k.P(x, y, i % 3 ? "#d8f4ff" : "#ffe08a"); if (i % 5 === 0) { k.P(x - 1, y, "#9ad8ff"); k.P(x + 1, y, "#9ad8ff"); k.P(x, y - 1, "#9ad8ff"); k.P(x, y + 1, "#9ad8ff"); } }
    bruma(k, 138, 176, "#e8c35a", 0.4, { s: 260, perfil: (x, y) => Math.max(0, 1 - Math.hypot((x - 88) / 50, (y - 150) / 9)) + Math.max(0, 1 - Math.hypot((x - 240) / 56, (y - 160) / 9)) });
  }
  MAG[20] = ["El laberinto", "Los setos altísimos de la tercera prueba, con la copa brillando al fondo", laberinto, { fuego: ["#ffe06a", "#9ad8ff", "#d8f4ff", "#e8c35a", "#c9a03c", "#ffe08a", "#a8842e", "#7a5f20"] }];

  function cementerio(k) {
    k.banda(["#101a2e", "#1f2a40", "#3a4a58"], 0, 118);
    const NU = ["#3a465a", "#2a3448", "#1f2838"]; nubarron(k, -20, 38, 90, 10, NU); nubarron(k, 96, 28, 80, 8, NU);
    loma(k, [[180, 124], [250, 92], [340, 118]], 124, ["#2a3442", "#1f2834", "#18202c"], 0.2);
    [[[300, 106], [298, 92], [302, 80]], [[299, 94], [290, 86], [286, 80]], [[301, 88], [310, 82], [314, 74]], [[302, 80], [300, 72]], [[290, 86], [284, 86]]].forEach((p, i) => trazo(k, p, "#14181f", i === 0 ? 3 : 2, 1));
    casaT27(k, 234, 96, 46, 30, { pared: "#2e3442", viga: "#14181f", techo: "#141a26", techoO: "#0e1420", ven: "#1a2230", puerta: "#0c1018", s: 212, luz: 0 });
    T.prado(k, 118, ["#4a5a46", "#3a4a38", "#2c3a2c", "#243024", "#1a2418"], 213, { n: 200 });
    for (let x = 0; x < W; x += 7) { k.R(x, 111, 1, 13, "#14181f"); k.poli([[x - 1, 112], [x + 2, 112], [x + 0.5, 108]], "#14181f"); k.P(x, 110, "#3a4252"); }
    k.R(0, 114, W, 1, "#14181f"); k.R(0, 113, W, 1, "#2a3040"); k.R(0, 121, W, 1, "#14181f");
    matas(k, 130, 178, 16, ["#26342a", "#3a4a38", "#5a6a54"]);
    [[20, 132, 12, 18], [146, 126, 10, 14], [176, 130, 12, 18], [206, 128, 10, 14], [238, 134, 12, 16], [288, 134, 12, 18], [128, 140, 14, 20], [272, 148, 12, 16], [54, 124, 9, 12], [300, 156, 13, 18]].sort((a, b) => a[1] - b[1]).forEach(([x, b, w, hh], i) => tumba27(k, x, b, w, hh, undefined, false, 220 + i));
    const PIE = ["#9a9ea8", "#7a7e88", "#5e626c", "#44464e", "#2e3038"], tex = (px, py, v) => rampa(PIE, v + (fbm(px * 0.3, py * 0.3, 230) - 0.5) * 0.3 + (hash(px, py, 231) - 0.5) * 0.08, px, py);
    [[44, 128], [120, 124]].forEach(([x, b]) => { sombraE(k, x + 4, b + 1, 7, 1.5, 0.4); T.rect(k, x, b - 18, 4, 18, (px, py) => tex(px, py, 0.3)); T.rect(k, x - 5, b - 13, 14, 4, (px, py) => tex(px, py, 0.25)); k.R(x, b - 18, 1, 18, PIE[0]); k.R(x - 5, b - 13, 14, 1, PIE[0]); k.P(x + 1, b - 2, "#4a6a3a"); k.P(x + 2, b - 1, "#3a5a30"); });
    const x = 84;
    sombraE(k, x + 4, 153, 30, 3, 0.45);
    T.rect(k, x - 24, 148, 48, 5, (px, py) => tex(px, py, 0.35)); k.R(x - 24, 148, 48, 1, PIE[0]);
    T.rect(k, x - 20, 138, 40, 10, (px, py) => tex(px, py, 0.2 + ((px - x + 20) / 40) * 0.4)); k.R(x - 20, 138, 40, 1, PIE[0]);
    rotulo(k, x - 16, 142, "T RODDLE", PIE[1]); rotulo(k, x - 16, 141, "T RODDLE", PIE[4]);
    [[-1, 1], [1, 2]].forEach(([d, j0]) => { for (let j = 0; j < 4; j++) trazo(k, [[x + d * 9, 112 - j * 3], [x + d * (12 + j * 2), 104 - j * 4], [x + d * (25 - j), 94 - j * 2]], PIE[Math.min(4, j0 + (j % 2))], 4 - j * 0.5, 2); });
    rellena(k, [[x - 14, 138], [x + 14, 138], [x + 9, 88], [x, 76], [x - 9, 88]], (px, py) => tex(px, py, 0.05 + ((px - x + 14) / 28) * 0.6 + (Math.sin((px - x) * 1.1) > 0.6 ? 0.18 : 0)));
    k.elipse(x, 83, 9, 10, PIE[1]); k.elipse(x + 3, 84, 6, 9, PIE[2]); k.elipse(x - 1, 85, 5, 6, "#23262e"); k.P(x - 3, 78, PIE[0]);
    trazo(k, [[x - 4, 120], [x - 2, 112], [x - 5, 104]], PIE[4], 1); for (let i = 0; i < 10; i++) k.P(x - 20 + hash(i, 1, 232) * 40, 146 - hash(i, 2, 232) * 6, ["#4a6a3a", "#3a5a30"][i % 2]);
    k.linea(x + 15, 148, x + 17, 62, "#3a3e48", 2); k.linea(x + 15, 148, x + 17, 62, "#5a5e68");
    rellena(k, [[x + 17, 62], [x - 20, 54], [x - 8, 72], [x + 17, 68]], (px, py) => rampa(["#e0e4ee", "#c0c4ce", "#a8acb6", "#7a7e88"], ((px - x + 20) / 37) * 0.7 + ((py - 54) / 18) * 0.2, px, py)); k.linea(x - 8, 72, x + 17, 68, "#e8ecf4"); k.linea(x - 20, 54, x + 17, 62, "#6a6e78");
    bruma(k, 122, 178, "#8a9ab8", 0.32, { s: 234 });
    [[-8, 4], [8, -4]].forEach(([a, b]) => { k.linea(214 + a * 2, 154, 214 + b * 2, 150, "#3a2414", 3); k.linea(214 + a * 2, 153, 214 + b * 2, 149, "#5a3a22"); });
    fuego(k, 214, 153, 36, 16, { s: 233 });
    brillo(k, 214, 146, 30, 24, "#ff9a3a", 0.6);
    bola(k, 214, 132, 19, 16, (px, py) => rampa(["#5a5a66", "#44444e", "#34343c", "#26262e", "#18181e"], 0.05 + (Math.hypot(px - 214 + 8, py - 132 + 7) / 30) * 0.95, px, py));
    for (let a = 0.3; a < 2.9; a += 0.45) k.P(214 + Math.cos(a) * 15, 132 + Math.sin(a) * 12, "#6a6a76");
    for (let a = 2.3; a < 4.1; a += 0.06) k.P(214 + Math.cos(a) * 18, 132 + Math.sin(a) * 15, "#6a6a78");
    k.alfa(0.55, () => k.elipse(214, 146, 13, 2, "#ff9a3a"));
    k.elipse(214, 118, 19, 4, "#2a2a32"); k.elipse(214, 118, 18, 3.5, "#4a4a56"); k.elipse(214, 118, 15, 2, "#c8e8ff"); k.R(206, 117, 6, 1, "#ffffff");
    k.alfa(0.4, () => { k.elipse(216, 108, 8, 5, "#c8e8ff"); k.elipse(211, 98, 10, 6, "#c8e8ff"); k.elipse(218, 86, 12, 7, "#c8e8ff"); });
    luces(k, [{ x: 214, y: 150, r: 70, ry: 30, col: "#ff9a3a", f: 0.7 }, { x: 214, y: 114, r: 40, ry: 24, col: "#c8e8ff", f: 0.45 }]);
  }
  MAG[21] = ["El cementerio", "El cementerio de Pequeño Hangleton, donde vuelve Valdemoro", cementerio, { tinte: 0.35, fuego: ["#ff9a3a", "#ffe06a", "#c8e8ff"] }];

  function grammiuld(k) {
    const { h } = Det.cuando(k), L = [];
    const PAP = ["#3e564c", "#34483f", "#2a3a34", "#22302a", "#1a2420"], LIS = ["...1...", "..111..", ".1.1.1.", "1..1..1", "1.111.1", ".11111.", "...1...", "..111..", "...1..."];
    T.rect(k, 0, 0, W, 100, (x, y) => { const fy = Math.floor(y / 14), gx = ((x + (fy % 2) * 8) % 16) - 4, gy = y - fy * 14 - 2, motivo = gx >= 0 && gx < 7 && gy >= 0 && gy < 9 && LIS[gy][gx] === "1"; return rampa(PAP, 0.3 + (motivo ? -0.22 : 0) + (fbm(x * 0.04, y * 0.05, 241) - 0.5) * 0.5 + (y < 14 ? 0.15 : 0), x, y); });
    k.R(0, 0, W, 5, "#1a2420"); k.R(0, 5, W, 2, "#7a5a2a"); k.R(0, 5, W, 1, "#a8842e"); k.R(0, 7, W, 1, "#141c18");
    T.rect(k, 0, 100, W, 26, madera(["#4a3628", "#3a2a22", "#30221a", "#241812", "#18100c"], { paso: 26, largo: 80, s: 242 }));
    k.R(0, 100, W, 2, "#5a4232"); k.R(0, 100, W, 1, "#7a5a42");
    for (let x = 8; x < W; x += 30) { k.R(x, 106, 22, 16, "#33241c"); k.R(x, 106, 22, 1, "#1f140e"); k.R(x, 106, 1, 16, "#1f140e"); k.R(x, 121, 22, 1, "#4a3628"); k.R(x + 21, 106, 1, 16, "#4a3628"); k.R(x + 3, 109, 16, 10, "#2e2018"); }
    T.rect(k, 24, 14, 76, 76, (x, y) => { const b = Math.min(x - 24, 99 - x, y - 14, 89 - y); return b < 2 ? rampa(["#c9a03c", "#a8842e", "#8a6a32", "#6a5226", "#4a3818"], b === 0 ? 0.6 : 0.2, x, y) : b < 5 ? rampa(["#8a6a32", "#6a5232", "#5a4428"], (b - 2) / 3 + (hash(x, y, 243) - 0.5) * 0.2, x, y) : null; });
    [[24, 14], [94, 14], [24, 84], [94, 84]].forEach(([a, b]) => { k.R(a, b, 6, 6, "#c9a03c"); k.R(a + 1, b + 1, 4, 4, "#e8c35a"); k.P(a + 2, b + 2, "#8a6a32"); });
    T.rect(k, 29, 19, 66, 66, (x, y) => rampa(["#3a2e2a", "#2e2422", "#241c1c", "#1a1414"], 0.3 + ((y - 19) / 66) * 0.4 + (fbm(x * 0.15, y * 0.15, 244) - 0.5) * 0.3, x, y));
    rellena(k, [[42, 85], [48, 60], [76, 60], [82, 85]], (x, y) => rampa(["#2a2a34", "#1e1e26", "#14141a"], 0.3 + ((x - 42) / 40) * 0.5, x, y));
    k.R(54, 58, 16, 3, "#d8d0c0"); for (let x = 54; x < 70; x += 2) k.P(x, 61, "#d8d0c0");
    k.elipse(62, 46, 11, 13, "#d8c8b0"); k.elipse(65, 47, 7, 11, "#c4b49c"); k.elipse(62, 34, 13, 7, "#14141a"); k.elipse(62, 30, 6, 4, "#1e1e26");
    k.R(55, 44, 5, 2, "#26262a"); k.R(65, 44, 5, 2, "#26262a"); k.P(57, 44, "#8a2a2a"); k.P(67, 44, "#8a2a2a"); k.R(55, 41, 5, 1, "#14141a"); k.R(64, 41, 5, 1, "#14141a");
    k.elipse(62, 54, 4, 3, "#3a1414"); k.R(60, 52, 5, 1, "#e8e0d0"); k.R(53, 48, 1, 4, "#a8987c"); k.R(71, 48, 1, 4, "#a8987c");
    esfera(k, 62, 66, 3, 3, ORO);
    const COR = ["#8a2a3c", "#6a2030", "#5a1a28", "#4a1620", "#3a1018"];
    const cor = (d, x0) => rellena(k, d > 0 ? [[x0, 10], [x0 + 32, 10], [x0 + 24, 34], [x0 + 14, 60], [x0, 76]] : [[x0, 10], [x0 - 32, 10], [x0 - 24, 34], [x0 - 14, 60], [x0, 76]], (x, y) => rampa(COR, 0.15 + (Math.sin(x / 2.4 + y / 16) * 0.5 + 0.5) * 0.5 + (hash(x, y, 245) < 0.015 ? 0.6 : 0), x, y));
    cor(1, 18); cor(-1, 106);
    if (h !== 2 && h !== 5) rellena(k, [[18, 10], [106, 10], [106, 90], [18, 90]], (x, y) => rampa(COR, 0.15 + (Math.sin(x / 2.4) * 0.5 + 0.5) * 0.5 + ((y - 10) / 80) * 0.15 + (hash(x, y, 246) < 0.012 ? 0.6 : 0), x, y));
    k.R(16, 8, 92, 3, "#c9a03c"); k.R(16, 8, 92, 1, "#e8c35a"); k.R(14, 7, 3, 5, "#e8c35a"); k.R(107, 7, 3, 5, "#e8c35a"); k.R(16, 60, 6, 3, "#c9a03c"); k.R(100, 60, 6, 3, "#c9a03c");
    k.R(160, 0, 2, 22, "#3a3a34"); for (let y = 1; y < 22; y += 3) k.P(161, y, "#5a5a50");
    k.elipse(161, 26, 24, 4, "#4a4a40"); k.elipse(161, 25, 20, 2, "#6a6a5a"); k.elipse(161, 28, 22, 1.5, "#2e2e28");
    [-1, 1].forEach((d) => { trazo(k, [[161 + d * 20, 26], [161 + d * 28, 24], [161 + d * 27, 17], [161 + d * 22, 19]], "#4a4a40", 2, 1); k.R(161 + d * 22 - 1, 18, 3, 2, "#4a4a40"); k.P(161 + d * 22, 18, "#8a2a2a"); });
    [-20, -10, 0, 10, 20].forEach((dd) => { k.R(160 + dd, 17, 2, 6, "#f4efe0"); k.R(161 + dd, 17, 1, 6, "#d8cdb4"); k.alfa(0.22, () => k.elipse(161 + dd, 14, 6, 6, "#ffcf6a")); k.P(160 + dd, 16, "#ffcf6a"); k.P(160 + dd, 15, "#f4efe0"); });
    L.push({ x: 161, y: 18, r: 90, ry: 50, col: "#ffcf6a", f: 0.45 });
    const elfo = (x, y, s) => {
      bola(k, x, y + 1, 14, 12, (px, py) => rampa(["#9a6a46", "#7a5438", "#5a3a22", "#3a2414", "#24160c"], Math.hypot((px - x) / 14, (py - y - 1) / 12) > 0.86 ? 0.78 : 0.2 + ((px - x + 14) / 28) * 0.45 + (ruido(px * 0.5, py * 0.12, s) - 0.5) * 0.3, px, py));
      k.poli([[x - 3, y - 2], [x - 15, y - 9], [x - 4, y + 2]], "#a89a7a"); k.poli([[x - 5, y - 2], [x - 12, y - 7], [x - 5, y]], "#b8a096");
      k.poli([[x + 3, y - 2], [x + 15, y - 9], [x + 4, y + 2]], "#8e8060"); k.poli([[x + 5, y - 2], [x + 12, y - 7], [x + 5, y]], "#9a8478");
      esfera(k, x, y, 5, 6, ["#d8caa8", "#c8ba9a", "#a89a7a", "#8a7c5e"]);
      k.R(x - 3, y - 1, 2, 1, "#4a3e2a"); k.R(x + 2, y - 1, 2, 1, "#4a3e2a"); k.R(x, y, 1, 3, "#8a7c5e"); k.P(x, y + 3, "#a89a7a"); k.R(x - 2, y + 4, 4, 1, "#6a5c40"); k.P(x - 3, y - 4, "#e8dcc0"); k.R(x - 2, y - 5, 4, 1, "#a89a7a");
    };
    elfo(128, 62, 247); elfo(156, 62, 248); elfo(214, 46, 249); elfo(244, 24, 250);
    [[0, 8, 1], [319, 8, -1]].forEach(([x0, y0, d]) => { for (let a = 0; a < 1.6; a += 0.4) k.linea(x0, y0, x0 + d * Math.cos(a) * 16, y0 + Math.sin(a) * 16, "#6a7a72"); for (let r = 5; r < 16; r += 5) for (let a = 0; a < 1.6; a += 0.1) k.P(x0 + d * Math.cos(a) * r, y0 + Math.sin(a) * r, "#5a6a62"); });
    suelo3d(k, 126, 180, 160, 60, tablones(["#4a3a30", "#3a2e28", "#30261f", "#241c16", "#18120e"], { pw: 10, L: 50, s: 251 }));
    const RUN = ["#6a2430", "#5a1e28", "#4a1c24", "#3a141c", "#2a0e14"];
    T.rect(k, 0, 142, W, 24, (x, y) => { if (y < 144 || y > 163) return y === 142 || y === 165 ? "#5a4214" : "#7a5a2a"; const rombo = Math.abs((((x % 18) + 18) % 18) - 9) + Math.abs(y - 154) * 1.2; return rombo < 3 ? "#7a5a2a" : rombo < 4 ? "#3a141c" : rampa(RUN, 0.3 + (fbm(x * 0.2, y * 0.3, 252) - 0.5) * 0.4 + (hash(x, y, 253) < 0.02 ? 0.4 : 0), x, y); });
    for (let i = 0; i < 11; i++) { const x = 188 + i * 13, y = 116 - i * 11; T.rect(k, x, y, 146, 11, madera(["#6a5240", "#5a4434", "#4a362a", "#3a2a20", "#24180f"], { paso: 3, largo: 50, s: 254 + i })); k.R(x, y, 146, 1, "#7a6250"); k.R(x, y + 9, 146, 2, "#33241c"); k.alfa(0.4, () => k.R(x, y + 1, 4, 10, "#000000")); }
    for (let i = 0; i < 11; i++) { k.R(194 + i * 13, 94 - i * 11, 2, 22, "#2a1c16"); k.P(194 + i * 13, 104 - i * 11, "#4a3628"); }
    k.linea(190, 98, 322, -14, "#2a1c16", 3); k.linea(190, 97, 322, -15, "#5a4232");
    k.R(186, 92, 5, 26, "#2a1c16"); k.R(186, 92, 1, 26, "#4a3628"); k.R(185, 89, 7, 3, "#3a2a20"); k.R(186, 88, 5, 1, "#5a4232");
    rellena(k, [[110, 128], [112, 106], [126, 106], [128, 128]], (x, y) => rampa(["#8a8270", "#7a7260", "#6a6250", "#4a4438", "#34302a"], 0.1 + ((x - 110) / 18) * 0.7 + (fbm(x * 0.4, y * 0.3, 255) - 0.5) * 0.3 + (Math.sin(y * 1.3 + x * 0.2) > 0.85 ? 0.2 : 0), x, y));
    k.elipse(119, 106, 8, 2, "#4a4438"); k.elipse(119, 106, 6, 1, "#26221e");
    [0, 6, 12].forEach((d) => { k.R(112 + d, 125, 5, 3, "#8a8270"); k.R(112 + d, 125, 5, 1, "#a8a090"); k.R(113 + d, 125, 2, 1, "#c8c0b0"); });
    k.linea(116, 106, 112, 86, "#26262a", 2); k.R(110, 84, 3, 2, "#5a3a22"); k.linea(122, 106, 126, 84, "#1e3a2a", 2); k.R(125, 82, 4, 2, "#5a3a22");
    luces(k, L);
  }
  MAG[22] = ["Grammiuld Place", "El cuartel de la Orden: la casa oscura de los Bleck, con sus cabezas de elfo", grammiuld, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#f4efe0"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, montana, camino, rotulo, brillo, pena, ventanaArco } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, madera, pase, sombraE, luces, bruma, encendido } = Det6;
  const T = window.P15, { granoMonte, sillar, casaT27, tumba27, NIEVE, ORO } = window.MAG27;
  const W = 320;
  const MAG = (window.SitiosIt27.magos = window.SitiosIt27.magos || {});
  const VEN = ["#ffd27a"];

  function imbrudge(k) {
    const ROSA = ["#fbe0e8", "#f6c8d6", "#f2b8ca", "#e8a8bc", "#d890a8"];
    T.rect(k, 0, 0, W, 104, (x, y) => rampa(ROSA, 0.25 + (Math.floor(x / 8) % 2) * 0.22 + (x % 8 === 0 ? 0.2 : 0) + (fbm(x * 0.1, y * 0.1, 271) - 0.5) * 0.12, x, y));
    for (let y = 10; y < 104; y += 12) for (let x = y % 24 ? 4 : 12; x < W; x += 16) { k.P(x, y, "#e87aa0"); k.P(x + 1, y, "#f08ab4"); k.P(x, y + 1, "#c85a80"); k.P(x - 1, y + 2, "#7ab07a"); k.P(x + 1, y + 2, "#8ac08a"); }
    k.R(0, 0, W, 6, "#ec7aa8"); k.R(0, 0, W, 1, "#f49ac0"); k.R(0, 6, W, 2, "#fbe0e8"); for (let x = 0; x < W; x += 4) { k.elipse(x + 2, 8, 2, 1.5, "#ffffff"); k.P(x + 2, 9, "#f6c8d6"); }
    T.rect(k, 0, 104, W, 22, madera(["#f6b8cc", "#ec9ab8", "#e08aaa", "#d87a9c", "#c06a8a"], { paso: 24, vertical: true, largo: 99, s: 272 }));
    for (let x = 4; x < W; x += 24) { k.R(x, 108, 16, 14, "#e898b4"); k.R(x, 108, 16, 1, "#c87a96"); k.R(x, 108, 1, 14, "#c87a96"); k.R(x, 121, 16, 1, "#fbd0e0"); k.R(x + 15, 108, 1, 14, "#fbd0e0"); }
    k.R(0, 104, W, 2, "#fbe0e8"); k.R(0, 104, W, 1, "#ffffff"); k.R(0, 106, W, 1, "#d87a9c");
    k.R(134, 16, 52, 62, "#fbe0e8"); k.R(134, 16, 52, 1, "#ffffff"); k.R(185, 16, 1, 62, "#e8c0d0");
    k.R(138, 20, 44, 54, "#7fb0d8"); k.R(159, 20, 2, 54, "#fbe0e8"); k.R(138, 44, 44, 2, "#fbe0e8");
    k.alfa(0.32, () => k.R(138, 52, 44, 22, "#ffffff")); k.alfa(0.5, () => { for (let x = 140; x < 182; x += 4) k.R(x, 53, 1, 21, "#ffffff"); }); for (let x = 138; x < 182; x += 3) k.elipse(x + 1, 52, 1.5, 1, "#ffffff");
    k.R(130, 78, 60, 4, "#fbe0e8"); k.R(130, 78, 60, 1, "#ffffff"); k.R(130, 81, 60, 1, "#d8a0b8");
    k.R(172, 73, 6, 5, "#c86a8a"); k.R(172, 73, 6, 1, "#e88aa8"); k.R(174, 70, 1, 3, "#3f7a4a"); k.elipse(174.5, 69, 2, 2, "#f08ab4"); k.P(174, 68, "#fbe0e8");
    rellena(k, [[130, 14], [190, 14], [190, 26], [176, 44], [166, 20], [154, 20], [144, 44], [130, 26]], (x, y) => rampa(["#f8a0c4", "#f08ab4", "#ec7aa8", "#d86a98"], 0.15 + (Math.sin(x / 2.2) * 0.5 + 0.5) * 0.55 + ((y - 14) / 30) * 0.15, x, y));
    for (let x = 130; x < 190; x += 5) k.elipse(x + 2, 14, 3, 2, "#ffffff"); k.R(128, 12, 64, 2, "#e8c35a");
    [[136, 40], [184, 40]].forEach(([x, y]) => { k.poli([[x, y], [x - 7, y - 4], [x - 7, y + 4]], "#f8c8dc"); k.poli([[x, y], [x + 7, y - 4], [x + 7, y + 4]], "#f8c8dc"); k.poli([[x, y], [x - 7, y - 4], [x - 4, y]], "#fbe0e8"); k.R(x - 1, y - 1, 3, 3, "#ec7aa8"); k.R(x - 1, y + 2, 1, 5, "#ec7aa8"); k.R(x + 1, y + 2, 1, 4, "#e87aa0"); });
    const plato = (x, y, c, i) => {
      k.alfa(0.25, () => k.elipse(x + 1, y + 1, 12, 12, "#c87a96"));
      k.elipse(x, y, 12, 12, "#e8c35a"); k.elipse(x, y, 11, 11, "#ffffff"); k.elipse(x, y, 9, 9, "#fdeef3");
      for (let a = 0; a < 6.28; a += 0.52) k.P(x + Math.cos(a) * 10, y + Math.sin(a) * 10, "#ec7aa8"); k.P(x - 7, y - 7, "#ffffff");
      const o = mezcla(c, "#000000", 0.25), cl = mezcla(c, "#ffffff", 0.3);
      k.elipse(x, y + 2, 6, 5, c); k.elipse(x - 1, y + 1, 4, 3, cl);
      k.poli([[x - 6, y - 1], [x - 5, y - 7], [x - 1, y - 3]], c); k.poli([[x + 6, y - 1], [x + 5, y - 7], [x + 1, y - 3]], o); k.P(x - 4, y - 4, "#f4a8c0"); k.P(x + 4, y - 4, "#f4a8c0");
      k.P(x - 2, y + 1, "#26262a"); k.P(x + 2, y + 1, "#26262a"); k.P(x - 2, y, "#ffffff"); k.P(x + 2, y, "#ffffff");
      k.P(x, y + 3, "#e87a9a"); k.linea(x - 7, y + 3, x - 3, y + 3, "#b8a8b0"); k.linea(x + 3, y + 3, x + 7, y + 3, "#b8a8b0");
      k.R(x - 3, y + 6, 7, 2, i % 3 === 0 ? "#7fb0d8" : "#ec7aa8"); k.P(x, y + 6, i % 3 === 0 ? "#5a90b8" : "#c85a80");
    };
    const G = ["#e8a860", "#c8c8d0", "#8a7a6a", "#f4f1e8", "#d8b090"];
    for (let f = 0; f < 3; f++) for (let c = 0; c < 9; c++) { const x = 20 + c * 34 + (f % 2) * 10, y = 26 + f * 28; if (x < 122 || x > 198) plato(x, y, G[(f * 3 + c) % 5], f * 9 + c); }
    T.rect(k, 0, 126, W, 54, (x, y) => rampa(["#f2b8c8", "#e8a8b8", "#dc98aa", "#d088a0"], 0.3 + (fbm(x * 0.3, y * 0.5, 274) - 0.5) * 0.3 + (hash(x, y, 275) - 0.5) * 0.15 + ((y - 126) / 54) * 0.1, x, y)); k.R(0, 126, W, 1, "#c87a96");
    bola(k, 160, 158, 142, 19, (x, y) => { const q = Math.hypot((x - 160) / 142, (y - 158) / 19); if (q > 0.95) return "#ec7aa8"; if (q > 0.9) return "#fbe0e8"; if (q < 0.45 && q > 0.41) return "#ec7aa8"; return rampa(["#fbe0e8", "#f6c8d6", "#f2b8ca"], 0.3 + (fbm(x * 0.15, y * 0.4, 276) - 0.5) * 0.4, x, y); });
    for (let a = 0; a < 6.28; a += 0.2) k.elipse(160 + Math.cos(a) * 138, 158 + Math.sin(a) * 18, 2, 1, "#ffffff");
    for (let i = 0; i < 16; i++) { const a = (i / 16) * 6.28, x = 160 + Math.cos(a) * 96, y = 158 + Math.sin(a) * 12; k.P(x, y, "#e87aa0"); k.P(x + 1, y, "#c85a80"); k.P(x - 1, y + 1, "#7ab07a"); }
    sombraE(k, 160, 130, 70, 3, 0.35);
    T.rect(k, 92, 100, 136, 5, madera(["#e88aa8", "#d87898", "#c86a8a", "#b05a78", "#904868"], { paso: 2, largo: 99, s: 277 })); k.R(92, 100, 136, 1, "#f4a8c0");
    T.rect(k, 96, 105, 128, 24, madera(["#b86a88", "#a85a78", "#9a5070", "#8f4a66", "#703850"], { paso: 24, vertical: true, largo: 99, s: 278 }));
    [[98, 46], [174, 46]].forEach(([x, w]) => [107, 117].forEach((y) => { k.R(x, y, w, 9, "#9a5070"); k.R(x, y, w, 1, "#c87a98"); k.R(x, y + 8, w, 1, "#703850"); k.R(x + w / 2 - 2, y + 4, 4, 1, "#e8c35a"); }));
    k.R(148, 110, 24, 15, "#7a3e5a"); k.R(148, 110, 24, 1, "#5a2a40");
    for (let x = 96; x < 224; x += 6) { k.elipse(x + 3, 105, 3, 2, "#ffffff"); k.P(x + 3, 107, "#ffffff"); k.P(x + 1, 106, "#f6e0e8"); }
    esfera(k, 112, 95, 8, 6, ["#ffffff", "#f8f4f0", "#e8dcd8", "#d0c0c0"]); k.R(105, 95, 15, 1, "#e8c35a"); k.P(109, 93, "#ec7aa8"); k.P(114, 96, "#ec7aa8"); k.P(110, 97, "#7ab07a");
    k.linea(120, 94, 125, 90, "#f4efe0", 2); k.R(110, 88, 4, 2, "#ec7aa8"); k.R(111, 87, 2, 1, "#e8c35a"); k.elipse(104, 95, 2, 3, "#f4efe0"); k.elipse(104, 95, 1, 2, "#f6c8d6");
    [[128, 96], [138, 97]].forEach(([x, y]) => { k.R(x - 1, y + 3, 9, 1, "#f4efe0"); k.R(x, y, 6, 3, "#ffffff"); k.R(x, y, 6, 1, "#e8c35a"); k.P(x + 6, y + 1, "#f4efe0"); k.P(x + 2, y + 1, "#ec7aa8"); });
    k.R(148, 96, 24, 4, "#f4efe0"); k.R(150, 95, 20, 1, "#ffffff"); for (let j = 0; j < 3; j++) k.R(151, 96 + j, 14 - j * 3, 1, "#c8c0b8"); k.R(166, 96, 3, 2, "#c0392b");
    k.R(178, 96, 4, 4, "#3a2a3a"); k.R(178, 96, 4, 1, "#6a5a6a"); k.linea(180, 96, 188, 86, "#ec7aa8"); k.linea(181, 96, 189, 87, "#f8c8dc");
    k.R(198, 92, 6, 8, "#e8f0f8"); k.R(198, 92, 1, 8, "#ffffff"); k.R(200, 86, 2, 7, "#3f7a4a"); k.elipse(201, 84, 5, 4, "#ec7aa8"); k.elipse(200, 83, 2, 2, "#f8c8dc"); k.P(199, 89, "#5a9a5a");
    k.elipse(214, 94, 4, 5, "#f0c8d8"); k.P(212, 92, "#ffffff"); k.R(213, 88, 2, 2, "#3f7a4a");
    sombraE(k, 76, 151, 18, 2, 0.35);
    T.rect(k, 60, 114, 28, 18, (x, y) => ((x * 7 + y * 13) % 17 === 0 ? "#ffffff" : (x * 5 + y * 3) % 23 === 0 ? "#7ab07a" : rampa(["#f8a8c8", "#f08ab4", "#ec7aa8", "#d86a98"], 0.2 + ((x - 60) / 28) * 0.4 + ((y - 114) / 18) * 0.1, x, y)));
    k.R(60, 114, 28, 2, "#fbe0e8"); T.rect(k, 60, 130, 28, 12, (x, y) => ((x * 7 + y * 13) % 17 === 0 ? "#ffffff" : rampa(["#f08ab4", "#ec7aa8", "#d86a98", "#b85a80"], 0.2 + ((y - 130) / 12) * 0.5, x, y))); k.R(60, 130, 28, 1, "#f8a8c8");
    for (let x = 60; x < 88; x += 3) k.elipse(x + 1, 142, 1.5, 2, "#f8c8dc"); k.R(62, 143, 3, 7, "#a85a78"); k.R(83, 143, 3, 7, "#a85a78");
    sombraE(k, 263, 150, 7, 1.5, 0.35); esfera(k, 262, 142, 6, 7, ["#ffffff", "#f4f1e8", "#d8c8c0"]); esfera(k, 262, 132, 5, 5, ["#ffffff", "#f4f1e8", "#d8c8c0"]); k.poli([[258, 129], [259, 124], [262, 128]], "#f4f1e8"); k.poli([[266, 129], [265, 124], [262, 128]], "#e8dcd8");
    k.P(260, 132, "#5a6a8a"); k.P(264, 132, "#5a6a8a"); k.P(262, 134, "#f4a8c0"); k.R(259, 137, 7, 2, "#ec7aa8"); k.P(262, 137, "#c85a80"); k.R(258, 148, 9, 2, "#c86a8a"); k.R(258, 148, 9, 1, "#e88aa8");
  }
  MAG[23] = ["El despacho de Imbrudge", "Todo rosa, con encajes y platos de gatitos en la pared", imbrudge, { cielo: "propio", fuerza: 0.08, ventanal: "#7fb0d8" }];

  function misterios(k) {
    k.banda(["#070b1c", "#0c1430", "#131d44"], 0, 130);
    const VY = 86, B = "#2a3a6a";
    const pasillo = (s) => {
      const X = (d) => 160 + (s * 160) / (1 + 3 * d), Y = (y, d) => VY + (y - VY) / (1 + 3 * d);
      rellena(k, [[X(0), Y(0, 0)], [X(1), Y(0, 1)], [X(1), Y(150, 1)], [X(0), Y(150, 0)]], (x, y) => { const d = (160 / Math.max(1, Math.abs(x - 160)) - 1) / 3; return rampa(["#1e2a58", "#1a244e", "#141c40", "#101838", "#0c1230"], 0.3 + d * 0.45 + (((d * 12) % 1) < 0.08 ? 0.3 : 0) + (hash(x, y, 241) - 0.5) * 0.08, x, y); });
      for (let y = 24; y <= 150; y += 21) {
        k.poli([[X(0), Y(y, 0)], [X(1), Y(y, 1)], [X(1), Y(y + 3, 1)], [X(0), Y(y + 3, 0)]], B); k.poli([[X(0), Y(y, 0)], [X(1), Y(y, 1)], [X(1), Y(y + 1, 1)], [X(0), Y(y + 1, 0)]], "#4a5a90");
        for (let n = 22; n >= 0; n--) {
          const d = n / 22, r = Math.max(1, 4.5 / (1 + 3 * d)), v = k.rnd(), col = v < 0.6 ? "#5fa8e8" : v < 0.9 ? "#9ad8ff" : "#d8f4ff", x = X(d), yy = Y(y - 6, d);
          if (r > 2.5) for (let a = 0; a < 6.28; a += 0.4) if (hash(n, Math.round(a * 10), y + s) < 0.5) k.crudo(x + Math.cos(a) * (r + 2), yy + Math.sin(a) * (r + 2), 1, 1, "#2f6aa8");
          k.elipse(x, yy, r, r, col); if (r > 2) { k.elipse(x + r * 0.2, yy + r * 0.2, r * 0.6, r * 0.6, mezcla(col, "#2f6aa8", 0.35)); k.P(x - r * 0.4, yy - r * 0.4, "#ffffff"); k.R(x - r * 0.6, Y(y + 1, d), r * 1.2, 1, "#c8d4e8"); }
        }
      }
      [0.02, 0.2, 0.45, 0.75, 1].forEach((d) => { const w = Math.max(1, 5 / (1 + 3 * d)); k.R(X(d) - 1, Y(6, d), w, Y(150, d) - Y(6, d), B); k.R(X(d) - 1, Y(6, d), 1, Y(150, d) - Y(6, d), "#4a5a90"); if (w > 2) for (let yy = Y(10, d); yy < Y(150, d); yy += 9) k.P(X(d), yy, "#6a7ab0"); });
    };
    pasillo(-1); pasillo(1);
    k.R(120, 66, 80, 36, "#0a1026"); bruma(k, 60, 104, "#2a4a8a", 0.4, { s: 242, x0: 110, x1: 210 });
    rellena(k, [[-2, 150], [120, 102], [200, 102], [322, 150], [322, 182], [-2, 182]], (x, y) => { const dy = y - 90, cc = celdas(((x - 160) / dy) * 40, 900 / dy, 10, 6, 243, 0.3); return rampa(["#2e3654", "#262c46", "#1c2238", "#161a2e", "#10141f"], 0.4 + (cc.borde < 0.08 ? 0.3 : 0) + (cc.id - 0.5) * 0.2 + (hash(x, y, 244) - 0.5) * 0.06, x, y); });
    for (let i = 0; i < 4; i++) { const y = 150 + i * 8; k.R(0, y, W, 1, "#141a2e"); k.R(0, y + 1, W, 1, "#3a4468"); }
    luces(k, [{ x: 40, y: 150, r: 70, ry: 24, col: "#5fa8e8", f: 0.35 }, { x: 280, y: 150, r: 70, ry: 24, col: "#5fa8e8", f: 0.35 }]);
    [[70, 12, "#2a3250"], [56, 9, "#343e60"], [44, 6, "#3e4a70"]].forEach(([rx, ry, c], i) => { k.elipse(160, 128 - i * 2.5, rx, ry, mezcla(c, "#000000", 0.3)); k.elipse(160, 127 - i * 2.5, rx, ry - 1, c); k.elipse(160, 126 - i * 2.5 - ry * 0.5, rx * 0.7, 1, mezcla(c, "#ffffff", 0.15)); });
    k.halo(160, 90, 54, 58, "#9ad8ff", 0.34);
    k.poli([[148, 66], [160, 56], [172, 66], [176, 124], [144, 124]], "#0a0a14");
    for (let x = 145; x < 176; x++) { const i = x - 145, fin = 114 + Math.round(hash(i, 1, 245) * 9), osc = Math.sin(i * 0.9) > 0; for (let y = 62; y < fin; y++) { const dx = Math.round(Math.sin(y * 0.15 + i * 0.5) * 1.2); k.P(x + dx, y, osc ? "#20202e" : (y + i) % 9 === 0 ? "#4a4a66" : "#34344a"); } if (hash(i, 2, 245) < 0.2) k.crudo(x, fin - 4, 1, 1, "#9ad8ff"); }
    rellena(k, [[134, 124], [138, 60], [160, 44], [182, 60], [186, 124], [176, 124], [172, 66], [160, 56], [148, 66], [144, 124]], (x, y) => { const a = Math.atan2(y - 66, x - 160), junta = y < 70 ? Math.abs(((a + Math.PI) / 0.3) % 1 - 0.5) > 0.44 : (y - 60) % 11 === 0; return rampa(["#b8b8c8", "#a8a8b8", "#8a8a9a", "#6a6a7a", "#4a4a5a"], ((x - 134) / 52) * 0.9 + (junta ? 0.3 : 0) + (fbm(x * 0.3, y * 0.3, 246) - 0.5) * 0.3, x, y); });
    trazo(k, [[140, 90], [142, 98], [139, 106]], "#3a3a4a", 1); trazo(k, [[181, 74], [179, 82], [182, 90]], "#3a3a4a", 1); k.R(158, 45, 4, 3, "#c8c8d8");
    [[120, 150], [200, 158], [92, 170]].forEach(([x, y]) => { k.elipse(x, y, 3, 3, "#9ad8ff"); k.P(x - 1, y - 1, "#ffffff"); k.R(x - 5, y + 3, 11, 1, "#34405e"); k.P(x + 5, y + 1, "#d8f4ff"); k.P(x + 7, y + 2, "#9ad8ff"); k.P(x - 6, y + 1, "#d8f4ff"); });
    for (let i = 0; i < 30; i++) k.P(hash(i, 1, 247) * 320, hash(i, 2, 247) * 176, "#d8f4ff");
  }
  MAG[24] = ["El Departamento de Misterios", "La sala de las profecías y el arco del velo", misterios, { cielo: "propio", fuerza: 0, fuego: ["#5fa8e8", "#9ad8ff", "#d8f4ff", "#ffffff"] }];

  function cueva(k) {
    const { h } = Det.cuando(k);
    T.rect(k, 0, 0, W, 104, (x, y) => { const cc = celdas(x, y * 1.4, 9, 6, 281, 0.9); return rampa(["#1a2230", "#151c28", "#10161f", "#0c1018", "#080b12"], 0.35 + cc.dy * 0.3 + (cc.borde < 0.1 ? 0.3 : 0) + (fbm(x * 0.06, y * 0.08, 282) - 0.5) * 0.4, x, y); });
    for (let i = 0; i < 34; i++) { const x = hash(i, 1, 283) * 320, w = 6 + hash(i, 2, 283) * 12, hh = 14 + hash(i, 3, 283) * 44; rellena(k, [[x - w, 0], [x + w, 0], [x + 1, hh]], (px, py) => { const a = w * (1 - py / hh) + 0.01; return rampa(["#2e3848", "#222c3a", "#18202c", "#10161f", "#0a0e16"], 0.08 + ((px - x + a) / (2 * a)) * 0.7 + (fbm(px * 0.3, py * 0.15, 284) - 0.5) * 0.3, px, py); }); k.linea(x - w * 0.55, 0, x + 1, hh - 1, "#3a4658"); if (hash(i, 4, 283) < 0.4) k.P(x + 1, hh + 2, "#5a8a8a"); }
    k.agua(100, 158, ["#0a1418", "#0c1a20", "#0e2026"], "#2a5a54", 80);
    k.halo(176, 100, 90, 46, "#3fe87a", 0.3);
    bola(k, 176, 120, 54, 11, (x, y) => rampa(["#3a404a", "#2e343e", "#262c34", "#1c2026", "#14181e"], 0.2 + ((y - 109) / 22) * 0.5 + (celdas(x, y * 2, 6, 4, 285, 0.8).borde < 0.1 ? 0.3 : 0) + (fbm(x * 0.2, y * 0.3, 286) - 0.5) * 0.3, x, y));
    bola(k, 176, 116, 46, 7, (x, y) => rampa(["#4a525e", "#3e4650", "#343a44", "#2a3038"], 0.2 + (fbm(x * 0.2, y * 0.4, 287) - 0.5) * 0.4 + ((x - 130) / 92) * 0.3, x, y));
    T.rect(k, 170, 113, 12, 6, (x, y) => rampa(["#7a808a", "#5a606a", "#4a505a", "#3a404a"], ((x - 170) / 12) * 0.8, x, y));
    rellena(k, [[160, 100], [192, 100], [185, 114], [167, 114]], (x, y) => rampa(["#9aa0aa", "#7a808a", "#5a606a", "#3a404a"], ((x - 160) / 32) * 0.85 + (hash(x, y, 288) - 0.5) * 0.1, x, y));
    for (let x = 166; x < 186; x += 3) k.crudo(x, 105, 2, 1, "#3fe87a");
    k.elipse(176, 100, 16, 4, "#5a606a"); k.elipse(176, 100, 15, 3.5, "#3fe87a"); k.elipse(176, 100, 10, 2, "#a8ffc8"); k.P(171, 99, "#ffffff"); k.R(178, 100, 4, 1, "#a8ffc8");
    for (let i = 0; i < 30; i++) { const y = 98 - hash(i, 1, 289) * 30, x = 176 + (hash(i, 2, 289) - 0.5) * (16 - (98 - y) * 0.3); k.crudo(x, y, 1, 1, i % 3 ? "#3fe87a" : "#a8ffc8"); }
    for (let y = 122; y < 152; y += 2) { const t = (y - 122) / 30, w = 30 - t * 14; for (let i = 0; i < 3; i++) k.crudo(176 + (hash(y, i, 290) - 0.5) * 2 * w, y, 2 + hash(y, i + 5, 290) * 6, 1, t < 0.4 ? "#a8ffc8" : "#3fe87a"); }
    k.alfa(0.25, () => k.elipse(176, 134, 34, 10, "#3fe87a"));
    rellena(k, [[66, 132], [118, 132], [110, 140], [76, 140]], (x, y) => rampa(["#3a4a3e", "#2e3a30", "#242e26", "#1a221c"], ((y - 132) / 8) * 0.8 + (y % 3 === 0 ? 0.2 : 0), x, y));
    k.R(66, 131, 52, 2, "#4a5a4a"); k.R(66, 131, 52, 1, "#6a7a6a"); k.linea(88, 132, 100, 118, "#3a3028"); k.linea(92, 138, 62, 146, "#3a3028");
    for (let i = 0; i < 9; i++) k.P(119 + i * 0.7, 134 + i * 2, i % 2 ? "#5a606a" : "#8a909a"); k.alfa(0.4, () => k.R(70, 141, 44, 1, "#2a5a54"));
    [[34, 146], [96, 152], [136, 148], [226, 142], [262, 150], [296, 144], [58, 154], [200, 156], [244, 134]].slice(0, Math.max(3, Math.min(9, 3 + (h - 17) * 2))).forEach(([x, y]) => {
      for (let a = 0; a < 6.28; a += 0.3) k.P(x + 2 + Math.cos(a) * 7, y + Math.sin(a) * 1.5, "#2a5a54");
      k.R(x, y - 7, 5, 7, "#b4bcac"); k.R(x + 4, y - 7, 1, 7, "#8a9488"); [0, 2, 4].forEach((d) => { k.R(x + d, y - 11, 1, 4, "#c4ccbc"); k.P(x + d, y - 11, "#e0e8d8"); }); k.R(x - 1, y - 8, 1, 3, "#b4bcac"); k.R(x, y - 6, 5, 1, "#8a9488");
      k.alfa(0.5, () => k.elipse(x + 2, y, 6, 1, "#2a5a54"));
    });
    T.rect(k, 0, 158, W, 22, (x, y) => { const cc = celdas(x, y * 1.5, 7, 5, 291, 0.8); return cc.borde < 0.1 ? "#14181e" : rampa(["#3a404a", "#2e343e", "#262a32", "#1c2026"], 0.3 + cc.dy * 0.3 + (cc.id - 0.5) * 0.3, x, y); });
    k.R(0, 157, W, 1, "#3a5a54");
    [[-4, 166, 56, 22], [50, 172, 40, 14], [262, 168, 62, 24], [222, 174, 42, 14]].forEach(([x, b, w, hh]) => pena(k, x, b, w, hh, ["#3a404a", "#2a2e36", "#1c2026", "#14181e"]));
    luces(k, [{ x: 176, y: 104, r: 120, ry: 60, col: "#3fe87a", f: 0.45 }]);
    bruma(k, 96, 124, "#3f8a6a", 0.3, { s: 292 });
  }
  MAG[27] = ["La cueva", "El lago negro de los enfiri y la vasija de poción verde en su isla", cueva, { cielo: "propio", fuerza: 0, fuego: ["#3fe87a", "#a8ffc8", "#ffffff"] }];

  function valleGidroc(k) {
    const lit = encendido(k), L = [];
    k.banda(["#3a4a7a", "#5a6a9a", "#8a9abc", "#b8c4d8"], 0, 126);
    const NU = ["#ffffff", "#e0e6f0", "#b8c4d8"]; nubarron(k, -20, 40, 100, 14, NU); nubarron(k, 244, 34, 90, 14, NU);
    const MR = ["#d8e2ee", "#c8d4e4", "#b4c2d6", "#a0b0c8"], MN = ["#ffffff", "#e8eef4"];
    montana(k, 66, 128, 200, 44, { roca: MR, nieve: MN, hasta: 0.7 }); montana(k, 270, 128, 180, 40, { roca: MR, nieve: MN, hasta: 0.7 }); granoMonte(k, 66, 128, 200, 44, 391, 8); granoMonte(k, 270, 128, 180, 40, 392, 8);
    const c = (p, t) => ({ pared: p, viga: "#3a2a22", nieve: true, techo: t, techoO: "#4a3a30", puerta: "#3a2a22" });
    [[6, 128, 40, 26, c("#c8a888", "#6a5a4a")], [50, 130, 34, 22, c("#d8b898", "#7a4a3a")], [204, 128, 36, 24, c("#c8a888", "#6a5a4a")]].forEach(([x, b, w, hh, o], i) => L.push(...casaT27(k, x, b, w, hh, { ...o, s: 400 + i * 10, luz: lit * 0.8 })));
    const IG = ["#a8a294", "#9c9688", "#8a8478", "#7a7468", "#6e6a60", "#4e4a42"];
    T.rect(k, 124, 86, 64, 42, sillar(IG, { ah: 6, an: 11, s: 410, x0: 124, y0: 86 }));
    [147, 165, 183].forEach((x) => { k.R(x, 90, 3, 38, IG[1]); k.R(x, 90, 1, 38, IG[0]); k.R(x + 2, 90, 1, 38, IG[4]); k.R(x - 1, 89, 5, 2, "#ffffff"); });
    rellena(k, [[118, 88], [194, 88], [180, 68], [132, 68]], (x, y) => rampa(NIEVE, (x > 160 ? 0.5 : 0.05) + (fbm(x * 0.3, y * 0.4, 411) - 0.5) * 0.3 + (y > 86 ? 0.2 : 0), x, y));
    k.R(118, 88, 76, 1, "#5a5a64"); for (let i = 118; i < 194; i += 3) { k.R(i, 89, 1, 1 + ((i * 7) % 4), "#c8dcec"); }
    T.rect(k, 98, 62, 28, 66, sillar(["#9a9488", "#8a8478", "#7a7468", "#6a665a", "#605c52", "#44403a"], { ah: 6, an: 9, s: 412, x0: 98, y0: 62 }));
    [[103, 66], [116, 66]].forEach(([x, y]) => { k.R(x - 1, y - 1, 7, 10, "#4e4a42"); k.elipse(x + 2.5, y + 1, 2.5, 2, "#1a1a20"); k.R(x, y + 1, 5, 7, "#1a1a20"); }); k.R(103, 70, 4, 3, "#a8842e"); k.P(104, 70, "#e8c35a");
    rellena(k, [[94, 62], [130, 62], [112, 26]], (x, y) => { const der = x > 112 + (y - 26) * 0.12; const slate = der && fbm(x * 0.3, y * 0.3, 413) > 0.55; return slate ? rampa(["#7a8094", "#5a6070", "#4a5060", "#3a4050"], 0.3 + ((y - 26) % 3 === 0 ? 0.25 : 0), x, y) : rampa(NIEVE, (der ? 0.5 : 0.08) + (fbm(x * 0.3, y * 0.5, 414) - 0.5) * 0.3, x, y); });
    k.R(92, 62, 40, 1, "#4e4a42"); k.R(111, 16, 3, 12, "#3a3a44"); k.R(107, 20, 11, 2, "#3a3a44"); k.R(111, 16, 1, 12, "#6a6a76"); k.R(107, 20, 11, 1, "#6a6a76"); k.R(111, 15, 3, 1, "#ffffff");
    [[134, 98], [152, 98], [170, 98], [108, 84]].forEach(([x, y]) => { ventanaArco(k, x, y, 9, 18, "#4a4a44", "#ffd27a"); k.R(x, y + 10, 9, 1, "#c0392b"); k.R(x + 2, y + 5, 2, 2, "#2f6fa8"); k.R(x + 6, y + 7, 2, 2, "#3f8a58"); k.R(x + 1, y + 13, 3, 2, "#2f6fa8"); k.R(x + 5, y + 14, 3, 2, "#c0392b"); k.R(x - 1, y + 18, 11, 1, "#ffffff"); brillo(k, x + 4, y + 8, 14, 16, "#ffd27a", 0.5); L.push({ x: x + 4, y: y + 10, r: 18, ry: 14, col: "#ffcf7a", f: lit * 0.8 }); });
    k.R(105, 114, 14, 14, "#4e4a42"); k.elipse(112, 114, 7, 5, "#4e4a42"); T.rect(k, 106, 112, 12, 16, madera(["#7a5232", "#6a4426", "#5a3a22", "#4a2e18", "#2e1a0e"], { paso: 3, vertical: true, largo: 99, s: 415 })); k.elipse(112, 113, 6, 4, "#5a3a22"); k.R(106, 118, 5, 1, "#26262a"); k.R(106, 123, 5, 1, "#26262a"); k.P(115, 121, "#e8c35a"); k.R(104, 128, 16, 1, "#ffffff");
    rellena(k, [[250, 128], [250, 84], [262, 74], [274, 92], [288, 70], [300, 88], [312, 80], [312, 128]], (x, y) => { const cc = celdas(x, y * 1.4, 6, 5, 416, 0.7); return cc.borde < 0.1 ? "#3e342c" : rampa(["#8a7a6e", "#7a6a5e", "#6a5a4e", "#5a4a40", "#4a3c34"], 0.25 + (cc.id - 0.5) * 0.3 + ((x - 250) / 62) * 0.25 + (fbm(x * 0.2, y * 0.2, 417) - 0.5) * 0.2, x, y); });
    k.poli([[276, 128], [276, 104], [284, 96], [294, 104], [294, 128]], "#2a2230"); k.R(256, 96, 10, 12, "#2a2230"); k.R(256, 96, 10, 1, "#4a3c34"); k.R(255, 108, 12, 1, "#ffffff");
    k.poli([[242, 90], [266, 70], [272, 80], [250, 96]], "#e8eef4"); k.linea(250, 85, 262, 75, "#ffffff"); k.linea(274, 92, 288, 71, "#e8eef4"); k.linea(288, 71, 300, 88, "#d8e2ee"); k.linea(300, 88, 312, 81, "#e8eef4");
    [[284, 96, 292, 78], [296, 104, 306, 86], [272, 90, 306, 78]].forEach(([a, b, c2, d]) => { k.linea(a, b, c2, d, "#3a2a22", 2); k.linea(a, b - 1, c2, d - 1, "#5a4232"); k.P(c2, d - 1, "#ffffff"); });
    for (let i = 0; i < 40; i++) { const x = 250 + hash(i, 1, 418) * 14, y = 100 + hash(i, 2, 418) * 28; k.P(x, y, ["#3a5a3a", "#4a6a40", "#2f4a30"][i % 3]); }
    k.R(244, 124, 1, 8, "#5a4232"); k.R(239, 121, 11, 5, "#a8885a"); k.R(239, 121, 11, 1, "#ffffff"); k.R(240, 123, 8, 1, "#6a5034"); k.R(240, 125, 6, 1, "#6a5034");
    T.rect(k, 0, 128, W, 52, (x, y) => rampa(NIEVE, 0.08 + (fbm(x * 0.05, y * 0.12, 419) - 0.5) * 0.5 + ((y - 128) / 52) * 0.1, x, y));
    for (let i = 0; i < 60; i++) k.P(hash(i, 1, 420) * W, 130 + hash(i, 2, 420) * 50, "#ffffff");
    [[232, 130, 22], [316, 128, 16]].forEach(([x, y, rx]) => { k.elipse(x, y, rx, 4, "#2f4a3a"); k.elipse(x - 2, y - 1, rx - 3, 2.5, "#3f5a48"); k.elipse(x, y - 3, rx - 4, 1.5, "#ffffff"); });
    k.alfa(0.5, () => { k.elipse(60, 164, 70, 5, "#c8d4e0"); k.elipse(276, 168, 66, 5, "#c8d4e0"); });
    k.R(0, 134, 118, 2, "#3a3e48"); k.R(0, 133, 118, 1, "#ffffff"); k.R(0, 130, 118, 1, "#3a3e48");
    for (let x = 2; x < 118; x += 3) k.R(x, 129, 1, 7, "#3a3e48");
    for (let x = 6; x < 118; x += 14) { k.R(x, 127, 3, 10, "#2a2e36"); k.R(x - 1, 126, 5, 2, "#ffffff"); }
    [[20, 150, 11, 15], [44, 146, 10, 13], [66, 152, 11, 15], [92, 148, 10, 13]].sort((a, b) => a[1] - b[1]).forEach(([x, b, w, hh], i) => tumba27(k, x, b, w, hh, ["#a8acb4", "#8a8e98", "#5a5e68"], true, 430 + i));
    tumba27(k, 128, 156, 16, 22, ["#f4f6fa", "#dfe4ea", "#a8acb4"], true, 440);
    for (let a = 0; a < 6.28; a += 0.5) k.P(136 + Math.cos(a) * 3, 145 + Math.sin(a) * 3, a % 1.5 < 0.5 ? "#2f6a3a" : "#3f8a4a"); [[134, 143], [138, 146], [135, 147]].forEach(([x, y]) => k.P(x, y, "#c0392b")); k.P(137, 142, "#ffffff");
    [[132, 158], [138, 159]].forEach(([x, y]) => { k.R(x, y, 2, 2, "#c0392b"); k.P(x + 1, y - 1, "#e8607a"); }); k.R(133, 160, 6, 1, "#3f8a3a");
    camino(k, 132, 180, (f) => 196 + Math.sin(f * 3) * 8, (f) => 7 + f * 16, "#c0ccd8", "#d0dae4", "#a4b4c8");
    for (let i = 0; i < 14; i++) { const f = i / 14, y = 134 + f * 44, cx = 196 + Math.sin(f * 3) * 8 + (i % 2 ? 2 : -2) * (1 + f); k.R(cx, y, 1 + f, 1, "#98a8bc"); }
    luces(k, L);
    for (let i = 0; i < 100; i++) k.P(k.rnd() * 320, k.rnd() * 176, "#ffffff"); for (let i = 0; i < 26; i++) { const x = k.rnd() * 320, y = k.rnd() * 170; k.R(x, y, 2, 2, "#e8f0f8"); k.P(x, y, "#ffffff"); }
  }
  MAG[29] = ["El Valle de Gidroc", "El pueblo nevado, con su iglesia, su cementerio y la casa en ruinas de los Petter", valleGidroc, { ven: VEN, tinte: 0.2 }];

  function grongitts(k) {
    const L = [];
    const MAR = ["#ece6d8", "#e0dacc", "#d8d2c4", "#c8c0b0", "#b8b0a0", "#a8a090"];
    T.rect(k, 0, 0, W, 124, (x, y) => { const yy = y - 12, f = Math.floor(yy / 14), v = yy - f * 14, xx = x + (f % 2 ? 20 : 0), c = Math.floor(xx / 40), u = xx - c * 40; if (y >= 12 && (v === 0 || u === 0)) return MAR[4]; return rampa(MAR, 0.25 + (hash(c, f, 302) - 0.5) * 0.2 + (Math.abs(fbm(x * 0.05 + c, y * 0.07 + f, 301) - 0.5) < 0.018 ? 0.35 : 0) + (fbm(x * 0.2, y * 0.2, 303) - 0.5) * 0.12, x, y); });
    k.R(0, 0, W, 8, "#b8b0a0"); k.R(0, 0, W, 1, "#c8c0b0"); for (let x = 2; x < W; x += 5) k.R(x, 4, 3, 2, "#a8a090"); k.R(0, 8, W, 1, "#c9a03c"); k.R(0, 9, W, 1, "#8a7a5a");
    const BR = ["#e8b860", "#d8a04a", "#b8823a", "#a8742a", "#7a4f1a", "#5a3a12"];
    k.R(132, 40, 56, 84, "#c9a03c"); k.R(133, 41, 54, 83, "#efeade");
    T.rect(k, 136, 44, 48, 80, (x, y) => rampa(BR, 0.1 + ((x - 136) / 48) * 0.6 + (fbm(x * 0.3, y * 0.2, 304) - 0.5) * 0.2, x, y));
    k.R(159, 48, 2, 76, BR[5]); k.R(161, 48, 1, 76, BR[1]);
    [[140, 50], [163, 50], [140, 75], [163, 75], [140, 100], [163, 100]].forEach(([x, y]) => { k.R(x, y, 17, 20, BR[3]); k.R(x, y, 17, 1, BR[0]); k.R(x, y, 1, 20, BR[0]); k.R(x, y + 19, 17, 1, BR[5]); k.R(x + 16, y, 1, 20, BR[5]); k.R(x + 3, y + 3, 11, 14, BR[2]); k.R(x + 3, y + 3, 11, 1, BR[4]); for (let j = 0; j < 4; j++) k.P(x + 2 + j * 4, y + 1, BR[0]); });
    [[150, 86], [170, 86]].forEach(([x, y]) => { k.R(x - 1, y - 1, 3, 2, "#e8c35a"); for (let a = 0; a < 6.28; a += 0.3) k.P(x + Math.cos(a) * 3, y + 4 + Math.sin(a) * 3, a > 3.4 && a < 5.8 ? "#ffe08a" : "#a8842e"); });
    k.poli([[128, 44], [192, 44], [160, 24]], "#c9a03c"); k.poli([[160, 24], [192, 44], [166, 44]], "#a8842e"); k.linea(128, 44, 160, 24, "#e8c35a");
    k.poli([[136, 42], [184, 42], [160, 29]], "#efeade"); k.poli([[160, 29], [184, 42], [164, 42]], "#d8d0c0");
    esfera(k, 160, 38, 3, 3, ORO); k.R(152, 38, 5, 1, "#c9a03c"); k.R(164, 38, 5, 1, "#c9a03c"); k.R(153, 37, 3, 1, "#e8c35a"); k.R(165, 37, 3, 1, "#e8c35a");
    k.R(128, 44, 64, 2, "#a8842e"); k.R(128, 44, 64, 1, "#e8c35a");
    const MA = ["#fbf8f0", "#efeade", "#d8d0c0", "#b8b0a0", "#9a9284"];
    [[14, 20], [70, 18], [232, 18], [286, 20]].forEach(([x, w]) => {
      for (let px = x; px < x + w; px++) { const t = (px - x) / (w - 1), estria = (px - x) % 4 === 0; for (let py = 16; py < 116; py++) k.P(px, py, rampa(MA, Math.abs(t - 0.3) * 1.2 + (estria ? 0.22 : 0) + (Math.abs(fbm(px * 0.1, py * 0.05, 305) - 0.5) < 0.02 ? 0.3 : 0), px, py)); }
      k.R(x - 3, 8, w + 6, 6, "#c9a03c"); k.R(x - 3, 8, w + 6, 1, "#e8c35a"); k.R(x - 2, 14, w + 4, 2, "#a8842e");
      [[x - 3, 11], [x + w + 1, 11]].forEach(([vx, vy]) => { k.elipse(vx + 1, vy + 1, 2.5, 2.5, "#e8c35a"); k.P(vx + 1, vy + 1, "#7a5f20"); });
      for (let px = x; px < x + w; px += 3) k.P(px + 1, 12, "#ffe08a");
      k.R(x - 3, 116, w + 6, 8, "#bfb7a6"); k.R(x - 3, 116, w + 6, 1, "#d8d0c0"); k.R(x - 2, 119, w + 4, 1, "#a8a090"); k.R(x - 3, 123, w + 6, 1, "#9a9284");
    });
    [[112, 22], [208, 22]].forEach(([x, y]) => {
      for (let j = 0; j < y - 3; j += 2) k.P(x, j, j % 4 ? "#a8842e" : "#e8c35a");
      k.elipse(x, y, 13, 3, "#c9a03c"); k.elipse(x, y - 1, 11, 1, "#e8c35a"); k.elipse(x, y + 2, 9, 1.5, "#a8842e"); esfera(k, x, y + 4, 2, 2, ORO);
      for (let d = -12; d <= 12; d += 3) { k.P(x + d, y + 3, "#e8f0f8"); k.P(x + d, y + 4, "#ffffff"); }
      [-10, -5, 0, 5, 10].forEach((d) => { k.R(x + d, y - 6, 1, 5, "#f4efe0"); k.alfa(0.3, () => k.elipse(x + d, y - 8, 3, 3, "#ffe6a8")); k.P(x + d, y - 7, "#ffe6a8"); });
      L.push({ x, y: y - 4, r: 60, ry: 40, col: "#ffe6a8", f: 0.45 });
    });
    T.rect(k, 0, 124, W, 56, (x, y) => { const f = Math.pow(Math.max(0.001, y - 124) / 58, 1 / 1.5), cw = 22 + 34 * f, cf = (x - 160) / cw, c = Math.floor(cf), r = Math.floor(f * 7), cl = (r + c + 64) % 2, vena = Math.abs(fbm(x * 0.08 + c * 3, y * 0.15 + r * 3, 306 + cl) - 0.5) < 0.025; return cl ? rampa(["#f4f0e6", "#ece6d8", "#dcd6c8", "#c8c2b4"], 0.3 + (vena ? 0.4 : 0) + (hash(c, r, 307) - 0.5) * 0.15, x, y) : rampa(["#5a5864", "#4a4852", "#3e3c46", "#32303a"], 0.3 + (vena ? -0.3 : 0) + (hash(c, r, 308) - 0.5) * 0.15, x, y); });
    if (k.ctx) { const src = k.ctx.getImageData(0, 0, W, 124).data; pase(k, (x, y, d, i) => { const sy = 123 - (y - 124); if (sy < 0) return; const j = (sy * W + x) * 4, a = 0.2 * (1 - (y - 124) / 56); d[i] += (src[j] - d[i]) * a; d[i + 1] += (src[j + 1] - d[i + 1]) * a; d[i + 2] += (src[j + 2] - d[i + 2]) * a; }, 0, 124, W, 180); }
    const mostrador = (x, w, s) => {
      for (let i = 0; i < 3; i++) {
        const c = x + 18 + i * 34;
        k.R(c - 7, 99, 14, 7, "#2a2a3a"); k.R(c - 7, 99, 14, 1, "#4a4a5a"); k.R(c - 2, 99, 4, 3, "#f4efe0"); k.P(c, 101, "#8a2a2a");
        esfera(k, c, 93, 6, 7, ["#e8d0a8", "#d8b890", "#c4a07a", "#a88464"]);
        k.poli([[c - 5, 91], [c - 14, 86], [c - 5, 95]], "#d8b890"); k.poli([[c - 6, 91], [c - 11, 88], [c - 6, 93]], "#c49a7a");
        k.poli([[c + 5, 91], [c + 14, 86], [c + 5, 95]], "#b89470"); k.poli([[c + 6, 91], [c + 11, 88], [c + 6, 93]], "#a07a5a");
        k.R(c - 4, 89, 3, 1, "#5a4a3a"); k.R(c + 2, 89, 3, 1, "#5a4a3a"); k.P(c - 3, 91, "#26262a"); k.P(c + 3, 91, "#26262a"); k.R(c, 91, 1, 4, "#c4a07a"); k.P(c + 1, 95, "#a88464"); k.R(c - 2, 97, 5, 1, "#8a6a4a"); k.P(c - 2, 86, "#a88464"); k.P(c + 2, 86, "#a88464");
        if ((i + s) % 3 === 0) { k.R(c - 5, 90, 4, 3, "#e8c35a"); k.R(c + 1, 90, 4, 3, "#e8c35a"); k.R(c - 4, 91, 2, 1, "#c8e0f0"); k.R(c + 2, 91, 2, 1, "#c8e0f0"); k.R(c - 1, 90, 2, 1, "#e8c35a"); }
      }
      T.rect(k, x, 104, w, 5, madera(["#c99a64", "#a87444", "#8a5a32", "#6a4426", "#4a2e18"], { paso: 2, largo: 99, s })); k.R(x, 104, w, 1, "#d8aa74");
      T.rect(k, x, 109, w, 30, madera(["#7a5230", "#6a4426", "#5a381e", "#4a2e18", "#2e1a0e"], { paso: 22, vertical: true, largo: 99, s: s + 1 }));
      for (let c = x + 6; c < x + w - 12; c += 22) { k.R(c, 114, 16, 20, "#5a381e"); k.R(c, 114, 16, 1, "#3f2614"); k.R(c, 114, 1, 20, "#3f2614"); k.R(c, 133, 16, 1, "#7a5230"); k.R(c + 15, 114, 1, 20, "#7a5230"); k.R(c + 3, 117, 10, 14, "#6a4426"); }
      k.R(x, 108, w, 1, "#c9a03c");
      const m = x + w / 2; k.R(m, 96, 2, 8, "#c9a03c"); k.R(m - 9, 96, 20, 1, "#e8c35a"); k.linea(m - 9, 96, m - 9, 101, "#a8842e"); k.elipse(m - 9, 102, 3, 1, "#c9a03c"); k.linea(m + 10, 96, m + 10, 101, "#a8842e"); k.elipse(m + 10, 102, 3, 1, "#c9a03c"); k.P(m - 9, 101, "#ffe08a");
      for (let i = 0; i < 6; i++) { k.R(x + 8 + i * 2, 102 - (i % 3), 3, 2, "#e8c35a"); k.P(x + 8 + i * 2, 102 - (i % 3), "#ffe08a"); }
      k.R(x + w - 26, 101, 12, 3, "#f4efe0"); k.R(x + w - 20, 101, 1, 3, "#c8c0b0"); for (let j = 0; j < 2; j++) { k.R(x + w - 25, 102 + j, 4, 1, "#8a8478"); k.R(x + w - 18, 102 + j, 3, 1, "#8a8478"); }
      k.R(x + w - 10, 101, 3, 3, "#26262a"); k.linea(x + w - 9, 101, x + w - 5, 93, "#f4efe0");
      k.P(x + 22, 103, "#c0392b"); k.P(x + 24, 103, "#3f9a4a");
    };
    mostrador(0, 112, 310); mostrador(208, 112, 320);
    luces(k, L);
  }
  MAG[30] = ["Grongitts", "El gran vestíbulo de mármol del banco de los duendes", grongitts, { cielo: "propio", fuerza: 0.12, fuego: ["#ffe6a8", "#f4efe0"] }];
})();

(function () {
  const ANIMAL = {
    leon: [
      ".....cccc.......",
      "....caaaab......",
      "...caaaaaab.....",
      "..caakaaaab.....",
      ".caaaaaaabb.....",
      "ccaaaaaabbb..cc.",
      ".kkkaabbb....cab",
      "..ccaab.......ab",
      "cc..aaab......ab",
      ".ccaaaaab....ab.",
      "...caaaaab..ab..",
      ".cca.aaaaabab...",
      ".....aaaaaab....",
      "....aab..aab....",
      "...aab....aab...",
      "...ab......ab...",
      "..aab......aab..",
      ".caab.....caab..",
    ],
    aguila: [
      "c..............c",
      "ac............ca",
      "aac....cc....caa",
      "aaac..cakc..caaa",
      "aaaac.kaaac.aaaa",
      "baaaacaaaacaaaab",
      ".baaaaaaaaaaaab.",
      "..baaaaaaaaaab..",
      "...bbaaaaaabb...",
      ".....baaaab.....",
      ".....caaaac.....",
      "......aaaa......",
      ".....k.aa.k.....",
      "....k..aa..k....",
      ".....baaaab.....",
      "....bab..bab....",
    ],
    serpiente: [
      "........cccc....",
      ".......caakac...",
      "........aaaa.rr.",
      "...........ab..r",
      "........caab....",
      ".....caab.......",
      "....cab.........",
      "....ab..........",
      ".....aab........",
      "......caab......",
      "..........aab...",
      "...........ab...",
      "...........ab...",
      "..........cab...",
      ".......caab.....",
      "....caab........",
      "..cab...........",
      ".cb.............",
    ],
    tejon: [
      "................",
      "..wwww..........",
      ".wkawwaaaaaa....",
      "wwaawwaaaaaaaa..",
      "kaawwaaaaaaaaaa.",
      ".aawaaaaaaaaaaa.",
      "..aabbbbbbbbaaa.",
      "...aabbbbbbaaa..",
      "...aa.aa..aa.aa.",
      "...aa.aa..aa.aa.",
      "..kk.kk..kk.kk..",
    ],
  };
  const PEQ = {
    leon: [
      "...cca....",
      "..caaab...",
      ".cakaab...",
      "ckkaabb..c",
      "..caab...a",
      "cc.aaab.ab",
      ".caaaaab..",
      "...aaaab..",
      "..ab..ab..",
      ".cab..cab.",
    ],
    aguila: [
      "c........c",
      "ac..cc..ca",
      "aac.kac.aa",
      "baacaaacab",
      ".baaaaaab.",
      "..baaaab..",
      "...caac...",
      "...kaak...",
      "...baab...",
    ],
    serpiente: [
      "....ccc...",
      "....akar..",
      ".......ab.",
      "....caab..",
      "..cab.....",
      "..ab......",
      "...aab....",
      ".....aab..",
      "......ab..",
      "...caab...",
      ".cab......",
    ],
    tejon: [
      ".ww.......",
      "wkwwaaaa..",
      "kawaaaaaa.",
      ".aabbbbaa.",
      ".aa.a.a.aa",
      ".kk.k.k.kk",
    ],
  };
  const CASA = {
    leon: { campo: ["#c0392b", "#8f1d22", "#6a1418"], a: "#e8c35a", b: "#a8842e", c: "#ffe08a", k: "#5a1a10" },
    aguila: { campo: ["#3a6ab8", "#2f5fa8", "#1f3f78"], a: "#c8945a", b: "#8a5a2a", c: "#e8b87a", k: "#1a1a2a" },
    serpiente: { campo: ["#3f9a5a", "#2f7a4a", "#1f5a34"], a: "#d8dce4", b: "#9aa0aa", c: "#ffffff", k: "#1a3a2a" },
    tejon: { campo: ["#f2d050", "#e8c040", "#c09a20"], a: "#26262a", b: "#5a5a62", c: "#3a3a42", k: "#14141a" },
  };
  function animal(k, x, y, cual, { peq = false, col = null } = {}) {
    const m = (peq ? PEQ : ANIMAL)[cual], C = { ...CASA[cual], w: "#f4f1e8", r: "#c0392b", ...(col || {}) };
    m.forEach((fila, j) => [...fila].forEach((ch, i) => { if (ch !== ".") k.P(x + i, y + j, C[ch]); }));
    return { w: m[0].length, h: m.length };
  }
  const tam = (cual, peq = false) => { const m = (peq ? PEQ : ANIMAL)[cual]; return { w: m[0].length, h: m.length }; };
  function escudo(k, x, y, w, h, cual, borde) {
    const C = CASA[cual], cx = x + w / 2;
    const dentro = (px, py) => { if (py < y || px < x || px >= x + w) return false; if (py < y + h * 0.55) return true; const t = (py - y - h * 0.55) / (h * 0.45); return Math.abs(px + 0.5 - cx) < (w / 2) * Math.sqrt(Math.max(0, 1 - t * t)); };
    for (let py = Math.floor(y - 1); py <= y + h; py++) for (let px = Math.floor(x - 1); px <= x + w; px++) {
      if (dentro(px, py)) k.P(px, py, Det.rampa(C.campo, 0.2 + ((px - x) / w) * 0.5 + ((py - y) / h) * 0.2, px, py));
      else if (dentro(px + 1, py) || dentro(px - 1, py) || dentro(px, py + 1) || dentro(px, py - 1)) k.P(px, py, borde);
    }
    const t = tam(cual, true); animal(k, Math.round(cx - t.w / 2), Math.round(y + (h - t.h) * 0.42), cual, { peq: true });
  }
  function hagworts(k, x, y, w, h) {
    const cx = x + w / 2, cy = y + h * 0.48;
    const dentro = (px, py) => { if (py < y || px < x || px >= x + w) return false; if (py < y + h * 0.6) return true; const t = (py - y - h * 0.6) / (h * 0.4); return Math.abs(px + 0.5 - cx) < (w / 2) * Math.sqrt(Math.max(0, 1 - t * t)); };
    const cuartel = (px, py) => (py < cy ? (px < cx ? "leon" : "serpiente") : px < cx ? "tejon" : "aguila");
    for (let py = Math.floor(y - 1); py <= y + h; py++) for (let px = Math.floor(x - 1); px <= x + w; px++) {
      if (dentro(px, py)) { const C = CASA[cuartel(px, py)]; k.P(px, py, Det.rampa(C.campo, 0.2 + ((px - x) / w) * 0.4, px, py)); }
      else if (dentro(px + 1, py) || dentro(px - 1, py) || dentro(px, py + 1) || dentro(px, py - 1)) k.P(px, py, "#a8842e");
    }
    [["leon", x + w * 0.25, y + h * 0.24], ["serpiente", x + w * 0.75, y + h * 0.24], ["tejon", x + w * 0.27, y + h * 0.7], ["aguila", x + w * 0.73, y + h * 0.68]].forEach(([cual, ax, ay]) => { const t = tam(cual, true); animal(k, Math.round(ax - t.w / 2), Math.round(ay - t.h / 2), cual, { peq: true }); });
    k.R(Math.round(cx) - 1, y, 2, h, "#c9a03c"); k.R(x, Math.round(cy) - 1, w, 2, "#c9a03c");
    const hx = Math.round(cx) - 3, hy = Math.round(cy) - 4; k.R(hx - 1, hy - 1, 8, 10, "#7a5f20"); k.R(hx, hy, 6, 8, "#e8c35a"); k.R(hx + 2, hy, 2, 3, "#7a5f20"); k.R(hx + 2, hy + 5, 2, 3, "#7a5f20"); k.R(hx, hy, 1, 8, "#ffe08a");
  }
  window.EMB = { ANIMAL, PEQ, CASA, animal, tam, escudo, hagworts };
})();

(function () {
  const { comedor, salaComun } = window.MAG27, E = window.EMB, antes = window.SitiosIt27.magos;
  window.SitiosIt28 = window.SitiosIt28 || {};
  const MAG = (window.SitiosIt28.magos = window.SitiosIt28.magos || {});
  const solo = (k, x, y, w, casa) => { const t = E.tam(casa); E.animal(k, Math.round(x - t.w / 2), Math.round(y - t.h / 2), casa); };
  const enEscudo = (k, x, y, w, casa, ribete) => { const ew = w > 25 ? 18 : 16, eh = ew + 4; E.escudo(k, Math.round(x - ew / 2), Math.round(y - eh / 2), ew, eh, casa, ribete); };
  MAG[2] = (v) => { const e = antes[2]; return [e[0], e[1], (k) => comedor(k, v === 2 ? enEscudo : solo), e[3]]; };
  const hagworts = (k) => E.hagworts(k, 142, 41, 36, 28);
  const gryffondir = (k) => {
    k.poli([[141, 41], [179, 41], [179, 58], [160, 69], [141, 58]], "#8a6a24"); k.poli([[142, 42], [178, 42], [178, 58], [160, 68], [142, 58]], "#c9a03c");
    Det.rellena(k, [[144, 44], [176, 44], [176, 57], [160, 66], [144, 57]], (x, y) => Det.rampa(["#c0392b", "#a8282a", "#8f1d22", "#6a1418"], 0.15 + ((x - 144) / 32) * 0.5 + ((y - 44) / 22) * 0.2, x, y));
    k.R(142, 42, 18, 1, "#ffe08a");
    E.animal(k, 152, 44, "leon");
  };
  MAG[9] = (v) => { const e = antes[9]; return [e[0], e[1], (k) => salaComun(k, v === 2 ? gryffondir : hagworts), e[3]]; };
})();

(function () {
  const { rampa, rellena } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, luces, bruma, sombraE, suelo3d, tablones, rayos } = Det6;
  const T = window.P15;
  const W = 320, H = 180;
  window.SitiosIt29 = window.SitiosIt29 || {};
  const MAG = (window.SitiosIt29.magos = window.SitiosIt29.magos || {});

  const MAD = ["#a87444", "#8e5e36", "#764c2a", "#5e3c20", "#462c16"], MADO = ["#7a5030", "#664226", "#54361e", "#422a16", "#321e0e"];
  const MARCO = "#3a2616", CREMA = ["#f6ecd6", "#ecdcbc", "#dcc8a0", "#c4ac80"], LATON = ["#f4d880", "#d8b450", "#a8842e"];
  const TELA = ["#a8b6c4", "#909eb0", "#7a8a9c", "#647488", "#4e5c72", "#3c475c"], CORT = ["#b02a36", "#8f1d22", "#7a1820", "#5a1218", "#3a0c10"];
  const VERDET = ["#3f8a5a", "#2f7048", "#245a3a", "#1a442c", "#10301e"];
  const ALF = ["#a8303a", "#8f2430", "#761c26", "#5a141c", "#3e0e14"], ORO = "#c9a03c", ORO2 = "#a8842e";
  const SUELO = ["#8a5a3a", "#744a2e", "#5e3c24", "#4a2e1a", "#3a2414"];
  const ROJO = ["#d0382e", "#b02a26", "#8f1f1e", "#6e1616", "#4e0e0e"], NEGRO = ["#5a5a64", "#44444c", "#33333a", "#24242a", "#16161a"];
  const CIELO = "#7fb0d8";
  const HIERBA = ["#8aaa76", "#749664", "#5e8252"], HIERBA2 = ["#5e9050", "#4c7e42", "#3e6c36"], PIEDRA = ["#b4aca0", "#9c9488", "#867e72", "#6e675c", "#58524a"];
  const CUERO = [["#b4723f", "#9a5e34", "#7e4a28", "#62381e", "#482812"], ["#d4a46a", "#bc8e56", "#9e7444", "#7e5a34", "#5e4226"],
    ["#8a4030", "#723428", "#5c2a20", "#462018", "#321610"], ["#3a4a6a", "#2e3c58", "#243048", "#1a2438", "#121a28"], ["#4a6a3a", "#3c5a2e", "#2e4824", "#22361a", "#162412"]];

  function campo(k, x0, y0, w, h, s) {
    T.rect(k, x0, y0, w, h, () => CIELO);
    rellena(k, [[x0, y0 + h * 0.6], [x0 + w * 0.25, y0 + h * 0.42], [x0 + w * 0.55, y0 + h * 0.5], [x0 + w * 0.8, y0 + h * 0.36], [x0 + w, y0 + h * 0.46], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(HIERBA, 0.2 + ((y - y0 - h * 0.36) / (h * 0.64)) * 0.6, x, y));
    rellena(k, [[x0, y0 + h * 0.78], [x0 + w * 0.4, y0 + h * 0.7], [x0 + w * 0.7, y0 + h * 0.76], [x0 + w, y0 + h * 0.68], [x0 + w, y0 + h], [x0, y0 + h]], (x, y) => rampa(HIERBA2, 0.2 + (hash(x, y, s) - 0.5) * 0.3, x, y));
    for (let i = 0; i < Math.round(w / 12); i++) { const x = x0 + 4 + i * 12 + hash(i, 1, s) * 4, y = y0 + h * 0.72 - (i % 3) * 2; k.R(x, y - 4, 1, 4, "#3a2a1a"); bola(k, x, y - 6, 2.5, 2.5, () => "#3c6a34"); }
    vidrio(k, x0, y0, w, h);
  }
  const vidrio = (k, x0, y0, w, h, a = 0.22) => k.alfa(a, () => { for (let y = y0 + 4; y < y0 + h; y += 9) trazo(k, [[x0, Math.min(y0 + h - 1, y + 6)], [Math.min(x0 + w - 1, x0 + w * 0.4), y]], "#ffffff", 1); });
  function paisaje(k, yh, s, { lago = null, y1 = H, montes = 1 } = {}) {
    T.rect(k, 0, 0, W, y1, () => CIELO);
    Det.nubarron(k, 64, 14 + (s % 5), 44, 10); Det.nubarron(k, 236, 22, 36, 9); Det.cirros(k, 6, 8, 40);
    const sierra = (x) => yh - (14 + Math.abs(Math.sin(x * 0.019 + s)) * 24 + Math.sin(x * 0.071 + s * 2) * 4) * montes;
    T.rect(k, 0, Math.max(0, yh - 52), W, 54, (x, y) => { const t = sierra(x); if (y < t || y > yh + 2) return null; return y < t + 3 && t < yh - 26 ? "#eef2f8" : rampa(["#a4b0c8", "#909cb6", "#7c88a2", "#6a7690"], 0.18 + (y - t) / 46 + (hash(x, y, s) - 0.5) * 0.08, x, y); });
    const loma = (x) => yh - 4 - Math.sin(x * 0.031 + s * 3) * 6 - Math.sin(x * 0.012 + s) * 5;
    T.rect(k, 0, yh - 20, W, y1 - yh + 20, (x, y) => (y < loma(x) ? null : rampa(HIERBA, 0.15 + (y - loma(x)) / 34 + (fbm(x * 0.08, y * 0.2, s) - 0.5) * 0.25, x, y)));
    if (lago) T.rect(k, lago[0], yh + 2, lago[1] - lago[0], 9, (x, y) => { const e = Math.min(x - lago[0], lago[1] - x) / 18; if (e < 0.4 && (y - yh - 2) / 9 > e * 2.4) return null; return rampa(["#bcd4ea", "#9cbcdc", "#80a4cc", "#6a8cb8"], 0.2 + (y - yh) / 12 + (Math.sin(x * 0.7 + y * 2) > 0.9 ? -0.3 : 0), x, y); });
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, s) * W, y = yh + 4 + hash(i, 2, s) * (y1 - yh - 8), r = 2 + hash(i, 3, s) * 3; if (lago && x > lago[0] - 4 && x < lago[1] + 4 && y < yh + 14) continue; k.R(x, y, 1, r + 1, "#3a2a1a"); bola(k, x, y - r * 0.6, r, r * 1.1, (px, py) => rampa(["#4c7e42", "#3c6a34", "#2e5428"], 0.2 + (py - y + r) / (r * 2.4) + (hash(px, py, s) - 0.5) * 0.2, px, py)); }
  }
  function techo(k, y1, s) {
    T.rect(k, 0, 0, W, y1, (x, y) => rampa(CREMA, 0.08 + (Math.abs(x - 160) / 160) * 0.22 + (1 - y / y1) * 0.16 + (x % 46 < 2 ? 0.3 : 0) + (hash(x, y, s) - 0.5) * 0.05, x, y));
    k.R(0, y1 - 3, W, 3, MADO[2]); k.R(0, y1 - 3, W, 1, LATON[1]);
  }
  function lampara(k, x, y, L) {
    k.R(x, y - 8, 1, 6, LATON[2]); k.R(x - 4, y - 2, 9, 1, LATON[1]);
    bola(k, x, y + 2, 4, 3.5, (px, py) => (py < y + 1 ? "#fffaf0" : "#f4e4c4")); k.crudo(x - 1, y + 1, 2, 1, "#ffffff");
    L.push({ x, y: y + 2, r: 44, ry: 30, col: "#ffe2a0", f: 0.55 });
  }
  function aplique(k, x, y, L) {
    k.R(x - 1, y, 3, 5, LATON[2]); k.R(x - 3, y - 1, 7, 1, LATON[1]);
    bola(k, x, y - 4, 3.5, 3.5, () => "#fff4d8"); k.crudo(x - 1, y - 5, 1, 1, "#ffffff");
    L.push({ x, y: y - 4, r: 30, ry: 22, col: "#ffe2a0", f: 0.5 });
  }
  function paneles(k, x0, y0, x1, y1, p, pal, s) {
    T.rect(k, x0, y0, x1 - x0, y1 - y0, (x, y) => {
      const u = (((x - x0) % p) + p) % p, b = Math.min(u, p - 1 - u, y - y0, y1 - 1 - y);
      if (u === 0 || y === y0) return pal[4];
      if (b < 3) return rampa(pal, 0.18 + (b === 0 ? 0.22 : 0) + (hash(x, y, s) - 0.5) * 0.1, x, y);
      return rampa(pal, 0.36 + (u === 3 || y === y0 + 3 ? -0.16 : u === p - 4 || y === y1 - 4 ? 0.22 : 0) + (fbm(x * 0.5, y * 0.05 + Math.floor((x - x0) / p) * 7, s) - 0.5) * 0.3, x, y);
    });
  }
  function cortina(k, x, y, w, h, d, pal = CORT) {
    const m = d > 0 ? x + w * 0.62 : x + w * 0.38;
    rellena(k, [[x, y], [x + w, y], [d > 0 ? x + w : m + w * 0.18, y + h * 0.5], [m, y + h * 0.56], [m + (d > 0 ? w * 0.2 : -w * 0.2), y + h], [d > 0 ? x + w * 0.3 : x + w * 0.7, y + h], [d > 0 ? m - w * 0.18 : x, y + h * 0.5]],
      (px, py) => rampa(pal, 0.12 + (Math.sin((px - x) / 1.5 + (py - y) * 0.04) * 0.5 + 0.5) * 0.45 + ((py - y) / h) * 0.12, px, py));
    k.R(Math.round(m) - 2, Math.round(y + h * 0.52), 4, 2, ORO); k.P(Math.round(m), Math.round(y + h * 0.52) + 2, ORO2);
  }
  function ventanilla(k, x, y, w, h, s, { travesano = true, cortinas = CORT } = {}) {
    k.R(x - 3, y - 3, w + 6, h + 6, MARCO); k.R(x - 3, y - 3, w + 6, 1, "#5a3c22");
    campo(k, x, y, w, h, s);
    if (travesano) { const ty = y + Math.round(h * 0.24); k.R(x, ty, w, 2, MARCO); for (let i = 1; i < 4; i++) k.R(x + Math.round((w * i) / 4) - 1, y, 2, ty - y, MARCO); }
    k.R(x - 5, y + h + 2, w + 10, 3, LATON[2]); k.R(x - 5, y + h + 2, w + 10, 1, LATON[0]);
    if (cortinas) { cortina(k, x - 7, y - 5, 12, h + 2, -1, cortinas); cortina(k, x + w - 5, y - 5, 12, h + 2, 1, cortinas); }
  }
  function alfombra(k, y0, a0, a1, s, { fy = 46, pal = ALF } = {}) {
    const tabla = tablones(SUELO, { pw: 12, L: 54, s });
    suelo3d(k, y0, H, 160, fy, (X, z, x, y) => {
      if (y < a0 || y > a1) return tabla(X, z, x, y);
      if (y < a0 + 2 || y > a1 - 2) return pal[4];
      if (y < a0 + 4 || y > a1 - 4) return Math.floor(X / 5) % 2 ? ORO : ORO2;
      return rampa(pal, 0.28 + (hash(Math.floor(X / 6), Math.floor(y / 4), s) - 0.5) * 0.1 + ((Math.floor(X / 18) + Math.floor((y - a0) / 9)) % 2 ? 0.1 : 0), x, y);
    });
    T.rect(k, 0, y0, W, 3, () => "#2a1a10"); k.alfa(0.35, () => k.R(0, y0 + 3, W, 3, "#1a100a"));
  }
  function maleta(k, x, y, w, h, C, baul = false) {
    T.rect(k, x, y, w, h, (px, py) => rampa(C, 0.25 + ((py - y) / h) * 0.35 + (hash(px, py, 77) - 0.5) * 0.12, px, py));
    k.R(x, y, w, 1, C[0]); k.R(x, y + h - 1, w, 1, C[4]);
    [0.28, 0.72].forEach((f) => k.R(x + Math.round(w * f), y, 1, h, baul ? LATON[2] : C[4]));
    k.R(x + Math.round(w / 2) - 2, y - 2, 4, 2, C[4]); k.R(x + Math.round(w / 2) - 1, y + 2, 2, 2, LATON[1]);
    if (baul) [[x, y], [x + w - 2, y], [x, y + h - 2], [x + w - 2, y + h - 2]].forEach(([a, b]) => k.R(a, b, 2, 2, LATON[1]));
  }
  function jaula(k, x, y, w, h, blanca = true) {
    k.R(x, y, w, h, "#3a2c20");
    const cx = x + w / 2, cy = y + h * 0.58, r = w * 0.3;
    bola(k, cx, cy, r, r * 1.15, (px, py) => rampa(blanca ? ["#fafafc", "#eeeef4", "#dcdee6", "#c4c8d4"] : ["#c8a070", "#a8804e", "#8a6438", "#6a4a28"], 0.15 + (py - cy) / (r * 3) + (hash(px, py, 81) < 0.12 ? 0.35 : 0), px, py));
    bola(k, cx, cy - r * 0.9, r * 0.75, r * 0.65, () => (blanca ? "#f8f8fc" : "#b48858"));
    k.P(cx - 2, cy - r * 0.9, "#e8a020"); k.P(cx + 1, cy - r * 0.9, "#e8a020"); k.P(cx - 0.5, cy - r * 0.9 + 1, "#4a4a52");
    for (let px = x; px <= x + w; px += 3) k.R(px, y, 1, h, LATON[1]);
    k.R(x - 1, y + h - 1, w + 3, 2, LATON[2]); k.R(x, y, w + 1, 1, LATON[1]);
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.12) k.P(cx + Math.cos(a) * (w / 2), y + Math.sin(a) * (w * 0.45), LATON[1]);
    k.R(cx - 1, y - w * 0.45 - 3, 3, 3, LATON[2]);
  }
  function rejilla(k, x0, x1, y) {
    k.alfa(0.55, () => k.R(x0, y, x1 - x0, 3, "#2a1c12"));
    for (let x = x0; x < x1; x += 3) k.P(x, y + 1, "#5a4630");
    k.R(x0, y - 1, x1 - x0, 1, LATON[1]); k.R(x0, y + 3, x1 - x0, 1, LATON[2]);
    [x0, x1 - 1].forEach((x) => k.R(x, y - 1, 1, 6, LATON[2]));
  }
  function bancoPerfil(k, x, base, d, f = 1) {
    const a = (v) => Math.round(v * f), xs = d > 0 ? x : x - a(22);
    T.rect(k, xs, base - a(7), a(22), a(7), (px, py) => rampa(MADO, 0.3 + (hash(px, py, 61) - 0.5) * 0.1, px, py));
    T.rect(k, xs, base - a(12), a(22), a(5), (px, py) => rampa(TELA, 0.2 + ((py - base + a(12)) / a(5)) * 0.3, px, py));
    const xb = d > 0 ? x : x - a(7);
    T.rect(k, xb, base - a(34), a(7), a(23), (px, py) => rampa(TELA, 0.3 + Math.abs((px - xb) / a(7) - 0.4) * 0.5 + ((py - base + a(34)) % 4 === 0 ? 0.1 : 0), px, py));
    k.R(xb, base - a(34), a(7), 1, TELA[0]); k.R(xs, base - a(12), a(22), 1, TELA[0]);
  }

  function pasillo(k) {
    const L = [];
    techo(k, 40, 2901);
    T.rect(k, 0, 40, W, 92, madera(MAD, { paso: 4, vertical: true, largo: 90, s: 2902 }));
    ventanilla(k, 118, 54, 84, 34, 2903, { cortinas: null });
    T.rect(k, 92, 108, 136, 20, (x, y) => rampa(SUELO, 0.4 + (hash(x >> 2, y, 2904) - 0.5) * 0.12, x, y));
    rejilla(k, 96, 140, 58); rejilla(k, 180, 224, 58);
    maleta(k, 100, 48, 22, 10, CUERO[0]); maleta(k, 124, 50, 14, 8, CUERO[1]); maleta(k, 186, 46, 28, 12, CUERO[2], true);
    bancoPerfil(k, 96, 122, 1); bancoPerfil(k, 224, 122, -1);
    jaula(k, 204, 96, 12, 14); k.R(102, 108, 10, 3, "#7e2e24"); k.R(102, 108, 10, 1, "#9a3a2e");
    paneles(k, 0, 96, 92, 128, 23, MADO, 2905); paneles(k, 228, 96, 320, 128, 23, MADO, 2906);
    T.rect(k, 0, 44, 92, 52, (x, y) => rampa(["#efe4cc", "#e2d4b4", "#d2c09c", "#bfa880"], 0.25 + (y % 3 === 0 ? 0.15 : 0) + (x % 23 < 2 ? 0.3 : 0), x, y));
    T.rect(k, 228, 44, 92, 52, (x, y) => rampa(["#efe4cc", "#e2d4b4", "#d2c09c", "#bfa880"], 0.25 + (y % 3 === 0 ? 0.15 : 0) + ((x - 228) % 23 < 2 ? 0.3 : 0), x, y));
    k.alfa(0.16, () => k.R(92, 44, 48, 84, "#d8ecf4")); k.alfa(0.16, () => k.R(180, 44, 48, 84, "#d8ecf4")); vidrio(k, 92, 44, 48, 52, 0.18); vidrio(k, 180, 44, 48, 52, 0.18);
    [0, 46, 90, 138, 180, 226, 274, 318].forEach((x) => { k.R(x, 40, 3, 88, MADO[3]); k.R(x, 40, 1, 88, MADO[1]); });
    k.R(0, 94, W, 3, MADO[3]); k.R(0, 94, W, 1, MADO[0]); k.R(0, 42, W, 2, MADO[4]);
    k.R(180, 44, 3, 84, MADO[3]); k.R(224, 44, 3, 84, MADO[3]); k.R(214, 82, 2, 8, LATON[1]); k.P(214, 81, LATON[0]);
    k.R(152, 34, 16, 6, LATON[2]); k.R(153, 35, 14, 4, LATON[1]); k.R(159, 35, 2, 4, MARCO);
    aplique(k, 46, 70, L); aplique(k, 274, 70, L);
    lampara(k, 70, 26, L); lampara(k, 250, 26, L);
    alfombra(k, 128, 140, 170, 2907);
    luces(k, L);
  }

  function ventanillas(k) {
    const L = [];
    paisaje(k, 74, 2912, { lago: [150, 250], y1: 100 });
    techo(k, 34, 2911);
    const huecos = [[84, 48, 66, 48], [160, 48, 66, 48], [236, 48, 66, 48]];
    T.rect(k, 0, 34, W, 66, (x, y) => (huecos.some(([hx, hy, hw, hh]) => x >= hx && x < hx + hw && y >= hy && y < hy + hh) ? null : madera(MAD, { paso: 4, vertical: true, largo: 90, s: 2913 })(x, y)));
    huecos.forEach(([hx, hy, hw, hh], i) => {
      k.R(hx - 2, hy - 2, hw + 4, 2, MARCO); k.R(hx - 2, hy + hh, hw + 4, 2, MARCO); k.R(hx - 2, hy, 2, hh, MARCO); k.R(hx + hw, hy, 2, hh, MARCO);
      k.R(hx, hy + 12, hw, 2, MARCO); vidrio(k, hx, hy, hw, hh, 0.18);
      cortina(k, hx - 8, hy - 6, 12, hh + 4, -1); cortina(k, hx + hw - 4, hy - 6, 12, hh + 4, 1);
    });
    paneles(k, 0, 100, W, 128, 38, MADO, 2914);
    k.R(0, 102, W, 2, LATON[2]); k.R(0, 102, W, 1, LATON[0]); for (let x = 20; x < W; x += 76) k.R(x, 102, 2, 6, LATON[2]);
    lampara(k, 50, 22, L); lampara(k, 160, 22, L); lampara(k, 270, 22, L);
    alfombra(k, 128, 138, 172, 2915);
    k.alfa(0.2, () => huecos.forEach(([hx]) => rellena(k, [[hx + 6, 130], [hx + 60, 130], [hx + 76, 176], [hx + 18, 176]], () => "#fff4c8")));
    luces(k, L);
  }

  function carrito(k) {
    const L = [];
    techo(k, 34, 2921);
    T.rect(k, 0, 34, W, 66, madera(MAD, { paso: 4, vertical: true, largo: 90, s: 2922 }));
    paneles(k, 0, 98, W, 128, 30, MADO, 2923);
    [[34, 1], [138, 2], [242, 3]].forEach(([x, n]) => {
      k.R(x - 2, 40, 48, 88, MARCO); T.rect(k, x, 42, 44, 86, madera(MADO, { paso: 3, largo: 40, s: 2924 + n }));
      T.rect(k, x + 4, 46, 36, 40, (px, py) => rampa(["#f2ead8", "#e4d8bc", "#d2c29c", "#bca880"], 0.2 + (py % 3 === 0 ? 0.12 : 0) + (hash(px, py, 2930 + n) - 0.5) * 0.1, px, py));
      k.alfa(0.18, () => bola(k, x + 16 + n * 3, 72, 6, 9, () => "#5a4a3a")); k.alfa(0.14, () => bola(k, x + 30 - n, 76, 5, 8, () => "#5a4a3a"));
      k.R(x + 4, 86, 36, 2, MARCO); k.R(x + 38, 96, 2, 8, LATON[1]); k.P(x + 38, 95, LATON[0]);
      k.R(x + 16, 36, 12, 5, LATON[2]); k.R(x + 17, 37, 10, 3, LATON[1]); k.R(x + 21, 37, 2, 3, MARCO);
    });
    [[96, 52, "#2f5fa8"], [200, 52, "#6a3f9a"]].forEach(([x, y, c]) => {
      k.R(x - 1, y - 1, 26, 30, "#5a4214"); k.R(x, y, 24, 28, ORO); k.R(x + 2, y + 2, 20, 24, "#2a3a2e");
      k.poli([[x + 5, y + 26], [x + 12, y + 13], [x + 19, y + 26]], c); k.elipse(x + 12, y + 11, 3.5, 4, "#d8b890"); k.poli([[x + 7, y + 8], [x + 17, y + 8], [x + 12, y + 1]], mezcla(c, "#000000", 0.4));
      aplique(k, x + 12, y + 40, L);
    });
    alfombra(k, 128, 138, 172, 2925);
    const cx = 148, cb = 136;
    sombraE(k, cx + 22, cb + 2, 26, 3, 0.45);
    T.rect(k, cx, cb - 22, 44, 18, madera(["#b88a5a", "#a07448", "#865e38", "#6a482a", "#4e341e"], { paso: 3, largo: 44, s: 2926 }));
    k.R(cx, cb - 22, 44, 1, "#d8aa74"); k.R(cx + 2, cb - 14, 40, 1, "#5a3e24");
    [cx + 4, cx + 36].forEach((x) => { bola(k, x + 2, cb - 2, 2.5, 2.5, () => "#26262a"); k.P(x + 2, cb - 2, LATON[1]); });
    k.R(cx - 2, cb - 34, 1, 12, LATON[2]); k.R(cx + 45, cb - 34, 1, 12, LATON[2]); k.R(cx - 2, cb - 34, 48, 1, LATON[1]); k.R(cx + 46, cb - 32, 6, 1, LATON[2]);
    for (let i = 0; i < 4; i++) { const x = cx + 2 + i * 10, y = cb - 30; k.poli([[x, y + 8], [x, y + 3], [x + 4, y], [x + 8, y + 3], [x + 8, y + 8]], i % 2 ? "#6a3a9a" : "#5a2e86"); k.R(x + 3, y + 4, 2, 2, ORO); }
    for (let i = 0; i < 3; i++) { const x = cx + 4 + i * 13, y = cb - 40; k.R(x, y, 9, 10, "#f4efe0"); for (let j = 0; j < 10; j += 3) k.R(x, y + j, 9, 1, i === 1 ? "#3a6ac8" : "#c83a3a"); k.R(x + 2, y - 1, 5, 1, "#c8c0b0"); }
    [[cx + 2, cb - 46], [cx + 30, cb - 46]].forEach(([x, y]) => { bola(k, x + 4, y + 3, 4, 3, () => "#d88a2a"); k.R(x + 1, y + 2, 6, 1, "#a85e1a"); });
    [[cx + 15, cb - 47], [cx + 22, cb - 47]].forEach(([x, y]) => { bola(k, x + 2, y + 3, 3, 2.5, () => "#26262a"); k.R(x, y + 1, 5, 1, "#3a3a44"); k.P(x + 2, y, "#c89a5a"); });
    lampara(k, 86, 22, L); lampara(k, 238, 22, L);
    luces(k, L);
  }

  function corte(k) {
    const L = [];
    paisaje(k, 54, 2931, { y1: 70, montes: 0.55 });
    [[300, 20, 18, 9], [268, 16, 22, 10], [232, 12, 26, 11], [192, 10, 22, 9], [156, 12, 16, 7]].forEach(([x, y, rx, ry]) => { k.alfa(0.42, () => bola(k, x, y + 30, rx, ry, (px, py) => rampa(["#ffffff", "#eef0f4", "#d8dce4"], 0.2 + (py - y - 30 + ry) / (ry * 2.4), px, py))); });
    rellena(k, [[0, 66], [W, 66], [W, 58], [290, 54], [30, 54], [0, 58]], (x, y) => rampa(NEGRO, 0.25 + (y - 54) / 14, x, y));
    k.R(0, 66, W, 4, ROJO[3]); k.R(0, 66, W, 1, ROJO[1]); k.R(0, 70, W, 2, "#1a1014");
    T.rect(k, 0, 72, W, 8, (x, y) => rampa(CREMA, 0.15 + (x % 46 < 2 ? 0.3 : 0), x, y));
    T.rect(k, 0, 80, W, 54, madera(MAD, { paso: 4, vertical: true, largo: 90, s: 2932 }));
    for (let i = 0; i < 4; i++) {
      const x = 4 + i * 80;
      ventanilla(k, x + 22, 86, 36, 22, 2933 + i, { travesano: false, cortinas: null });
      bancoPerfil(k, x + 6, 126, 1, 0.75); bancoPerfil(k, x + 74, 126, -1, 0.75);
      rejilla(k, x + 6, x + 24, 88); rejilla(k, x + 56, x + 74, 88);
      maleta(k, x + 8, 80, 14, 7, CUERO[i % 4]); maleta(k, x + 57, 79, 16, 8, CUERO[(i + 2) % 4], i === 1);
      if (i === 1) jaula(k, x + 60, 104, 9, 11);
      k.R(x - 2, 80, 4, 56, MADO[3]); k.R(x - 2, 80, 1, 56, MADO[1]);
    }
    k.alfa(0.14, () => k.R(0, 80, W, 34, "#e8f4fa"));
    paneles(k, 0, 114, W, 136, 40, MADO, 2934); k.R(0, 112, W, 2, MADO[3]);
    for (let i = 0; i < 4; i++) { const x = 4 + i * 80; k.R(x + 34, 82, 2, 54, MADO[3]); k.R(x + 46, 98, 2, 6, LATON[1]); }
    aplique(k, 84, 96, L); aplique(k, 164, 96, L); aplique(k, 244, 96, L);
    alfombra(k, 136, 144, 172, 2935, { fy: 80 });
    luces(k, L);
  }

  function plataforma(k) {
    const L = [], fy = 94;
    paisaje(k, 92, 2941, { lago: [20, 110], y1: 140 });
    rellena(k, [[150, fy], [170, fy], [300, 140], [20, 140]], (x, y) => rampa(["#9a9088", "#847a72", "#6e665e", "#5a524c"], 0.25 + (hash(x, y, 2942) - 0.5) * 0.4, x, y));
    for (let y = fy + 2, i = 0; y < 140; y += 1 + i * 0.35, i++) { const t = (y - fy) / (140 - fy), x0 = 160 - (12 + t * 118), x1 = 160 + (12 + t * 118); if (i % 2) k.R(x0 + 4, Math.round(y), x1 - x0 - 8, Math.max(1, Math.round(t * 3)), "#5a3e28"); }
    [-1, 1].forEach((d) => { trazo(k, [[160 + d * 4, fy], [160 + d * 72, 140]], "#c8c8d0", 1); trazo(k, [[160 + d * 4, fy + 1], [160 + d * 72, 141]], "#4a4a52", 1); });
    suelo3d(k, 138, H, 160, 60, tablones(["#9a6a46", "#865a3a", "#6e4a2e", "#5a3a24", "#40281a"], { pw: 11, L: 60, s: 2943 }));
    k.R(0, 136, W, 3, NEGRO[3]); k.R(0, 136, W, 1, NEGRO[1]);
    for (let x = 6; x < W; x += 9) { k.R(x, 110, 2, 26, NEGRO[3]); k.P(x, 110, NEGRO[1]); }
    k.R(0, 108, W, 3, NEGRO[2]); k.R(0, 108, W, 1, NEGRO[0]); k.R(0, 122, W, 1, NEGRO[3]);
    [[140, 110], [180, 110]].forEach(([x, y]) => { k.R(x, y - 4, 3, 30, NEGRO[4]); k.R(x - 1, y - 6, 5, 2, NEGRO[2]); });
    k.R(286, 92, 3, 18, NEGRO[4]); k.R(282, 84, 11, 9, NEGRO[3]); k.crudo(284, 86, 7, 5, "#e8402a"); k.crudo(285, 87, 3, 2, "#ffb0a0");
    L.push({ x: 288, y: 88, r: 22, ry: 16, col: "#ff6a4a", f: 0.5 });
    T.rect(k, 0, 0, W, 10, (x, y) => rampa(NEGRO, 0.3 + y / 14, x, y)); k.R(0, 10, W, 2, ROJO[2]); k.R(0, 10, W, 1, ROJO[0]);
    lampara(k, 160, 18, L);
    luces(k, L);
  }

  function furgon(k) {
    const L = [];
    T.rect(k, 0, 0, W, 22, (x, y) => rampa(["#5a4632", "#4a3828", "#3a2c20", "#2c2018"], 0.2 + y / 30 + (x % 40 < 4 ? 0.25 : 0), x, y));
    T.rect(k, 0, 22, W, 108, madera(["#9a7a54", "#846644", "#6e5236", "#5a422a", "#46321e"], { paso: 5, vertical: true, largo: 120, s: 2951 }));
    for (let x = 0; x < W; x += 40) { k.R(x, 22, 4, 108, "#4a3626"); k.R(x, 22, 1, 108, "#6a5038"); }
    ventanilla(k, 116, 40, 88, 66, 2952, { travesano: false, cortinas: null });
    k.R(204, 34, 30, 96, "#6a5036"); k.R(204, 34, 30, 2, "#3a2a1c"); for (let y = 40; y < 128; y += 22) k.R(206, y, 26, 2, "#4a3626");
    k.R(110, 32, 128, 3, NEGRO[2]); k.R(110, 32, 128, 1, NEGRO[0]);
    suelo3d(k, 128, H, 160, 50, tablones(["#a8845a", "#94704a", "#7a5c3c", "#62482e", "#4a3420"], { pw: 13, L: 70, s: 2953 }));
    T.rect(k, 0, 128, W, 2, () => "#3a2a1c");
    k.alfa(0.22, () => rellena(k, [[118, 130], [204, 130], [236, 176], [104, 176]], () => "#fff4c8"));
    const pila = (x, b, lista) => { let y = b; lista.forEach(([w, h, c, baul]) => { y -= h; maleta(k, x + (60 - w) / 2 - 30, y, w, h, CUERO[c], baul); }); };
    pila(84, 132, [[40, 16, 2, true], [34, 12, 0, false], [28, 10, 3, false]]); pila(272, 132, [[44, 18, 1, true], [36, 14, 4, true], [24, 10, 0, false]]);
    jaula(k, 92, 78, 12, 15, false); jaula(k, 230, 70, 12, 15, true);
    rellena(k, [[100, 132], [118, 132], [116, 120], [102, 120]], (x, y) => rampa(["#d8b884", "#c4a06a", "#a8844e"], 0.2 + ((x + y) % 3 === 0 ? 0.3 : 0), x, y)); k.R(101, 119, 16, 2, "#8a6a3e");
    [[232, 72], [238, 74]].forEach(([x, y], i) => { trazo(k, [[x, y + 54], [x + 6, y]], "#8a5a32", 2); rellena(k, [[x - 2, y + 54], [x + 4, y + 54], [x + 2, y + 40], [x - 1, y + 42]], () => (i ? "#c8a050" : "#b08a40")); });
    lampara(k, 60, 14, L); lampara(k, 260, 14, L);
    luces(k, L);
  }

  function prefectos(k) {
    const L = [];
    paisaje(k, 72, 2962, { y1: 96 });
    techo(k, 30, 2961);
    const huecos = [[18, 42, 80, 52], [120, 42, 80, 52], [222, 42, 80, 52]];
    T.rect(k, 0, 30, W, 70, (x, y) => (huecos.some(([hx, hy, hw, hh]) => x >= hx && x < hx + hw && y >= hy && y < hy + hh) ? null : rampa(VERDET, 0.3 + (x % 34 < 2 ? 0.3 : 0) + (fbm(x * 0.2, y * 0.1, 2963) - 0.5) * 0.25, x, y)));
    huecos.forEach(([hx, hy, hw, hh]) => { k.R(hx - 2, hy - 2, hw + 4, 2, ORO2); k.R(hx - 2, hy + hh, hw + 4, 2, ORO2); k.R(hx - 2, hy, 2, hh, ORO2); k.R(hx + hw, hy, 2, hh, ORO2); vidrio(k, hx, hy, hw, hh, 0.16); cortina(k, hx - 8, hy - 6, 12, hh + 4, -1, VERDET); cortina(k, hx + hw - 4, hy - 6, 12, hh + 4, 1, VERDET); });
    paneles(k, 0, 100, W, 130, 34, MAD, 2964);
    k.R(136, 33, 48, 7, ORO2); k.R(137, 34, 46, 5, "#1e3a2a"); for (let x = 140; x < 180; x += 3) k.P(x, 36, "#e8c35a");
    const butaca = (x, d) => {
      const R = ["#4a8a5a", "#3a7048", "#2c5a3a", "#20442c", "#14301e"];
      sombraE(k, x + d * 8, 131, 12, 2, 0.4);
      T.rect(k, d > 0 ? x : x - 18, 114, 18, 10, (px, py) => rampa(R, 0.2 + (py - 114) / 14, px, py));
      T.rect(k, d > 0 ? x - 2 : x - 4, 94, 6, 30, (px, py) => rampa(R, 0.3 + Math.abs(py - 104) / 40, px, py));
      bola(k, d > 0 ? x + 1 : x - 1, 95, 4, 3, () => R[1]); k.R(d > 0 ? x : x - 18, 124, 18, 4, R[3]); k.R(d > 0 ? x + 1 : x - 3, 128, 2, 3, MARCO); k.R(d > 0 ? x + 15 : x - 17, 128, 2, 3, MARCO);
    };
    huecos.forEach(([hx, , hw]) => {
      const c = hx + hw / 2; butaca(c - 30, 1); butaca(c + 30, -1);
      k.R(c - 8, 110, 16, 2, MAD[1]); k.R(c - 1, 112, 3, 18, MAD[3]); k.R(c - 5, 129, 11, 2, MAD[3]);
      k.R(c - 1, 102, 2, 8, LATON[2]); rellena(k, [[c - 5, 102], [c + 5, 102], [c + 3, 97], [c - 3, 97]], () => "#2f7048"); L.push({ x: c, y: 102, r: 24, ry: 16, col: "#ffe2a0", f: 0.4 });
    });
    lampara(k, 110, 18, L); lampara(k, 210, 18, L);
    alfombra(k, 130, 140, 172, 2965, { pal: ["#3a7a5a", "#2e6448", "#245038", "#1a3c2a", "#10281c"] });
    luces(k, L);
  }

  function viaducto(k) {
    const L = [];
    paisaje(k, 70, 2972, { lago: [0, 320], y1: 112 });
    techo(k, 28, 2971);
    const curva = (t) => [40 + t * 260, 76 - Math.sin(t * Math.PI) * 10 + t * 8], alto = (t) => 6 + t * 16;
    for (let i = 0; i <= 120; i++) { const t = i / 120, [x, y] = curva(t), a = alto(t); k.R(x, y, 3, a, rampa(PIEDRA, 0.25 + t * 0.2, x, y)); }
    for (let j = 0; j < 14; j++) { const t0 = (j + 0.18) / 14, t1 = (j + 0.82) / 14, [x0, y0] = curva(t0), [x1, y1] = curva(t1), a = alto((t0 + t1) / 2); rellena(k, [[x0, y0 + a], [x0, y0 + a * 0.45], [(x0 + x1) / 2, Math.min(y0, y1) + a * 0.25], [x1, y1 + a * 0.45], [x1, y1 + a]], () => CIELO); }
    for (let i = 0; i <= 120; i++) { const t = i / 120, [x, y] = curva(t); k.R(x, y - 1, 3, 2, PIEDRA[3]); }
    const tren = (t, loco) => { const [x, y] = curva(t), e = 0.6 + t * 0.5; k.R(x, y - 9 * e, 16 * e, 8 * e, loco ? ROJO[1] : ROJO[2]); k.R(x, y - 10 * e, 16 * e, 2 * e, NEGRO[3]); if (loco) { k.R(x + 12 * e, y - 14 * e, 3 * e, 5 * e, NEGRO[3]); } else for (let w = 2; w < 14; w += 4) k.R(x + w * e, y - 7 * e, 2 * e, 2 * e, "#ffe6a8"); };
    tren(0.5, false); tren(0.56, false); tren(0.62, true);
    [[0.66, -14, 6], [0.62, -22, 9], [0.56, -30, 12], [0.48, -36, 14]].forEach(([t, dy, r]) => { const [x, y] = curva(t); k.alfa(0.5, () => bola(k, x + 10, y + dy, r, r * 0.7, () => "#f4f6f8")); });
    const vx = 56, vy = 38, vw = 208, vh = 74;
    T.rect(k, 0, 28, W, 84, (x, y) => (x >= vx && x < vx + vw && y >= vy && y < vy + vh ? null : madera(MAD, { paso: 4, vertical: true, largo: 90, s: 2973 })(x, y)));
    k.R(vx - 3, vy - 3, vw + 6, 3, MARCO); k.R(vx - 3, vy, 3, vh, MARCO); k.R(vx + vw, vy, 3, vh, MARCO);
    T.rect(k, vx, vy + vh - 8, vw, 8, (x, y) => rampa(["#d8ecf4", "#c4dce8", "#a8c4d4"], 0.3 + (y - vy - vh + 8) / 10, x, y)); k.R(vx, vy + vh - 9, vw, 2, MARCO);
    vidrio(k, vx, vy, vw, vh - 9, 0.12);
    cortina(k, vx - 10, vy - 6, 14, vh + 2, -1); cortina(k, vx + vw - 4, vy - 6, 14, vh + 2, 1);
    paneles(k, 0, 112, W, 130, 40, MADO, 2974); k.R(0, 112, W, 2, LATON[2]); k.R(0, 112, W, 1, LATON[0]);
    lampara(k, 86, 16, L); lampara(k, 234, 16, L);
    alfombra(k, 130, 140, 172, 2975);
    luces(k, L);
  }

  const EXPRESO = [pasillo, ventanillas, carrito, corte, plataforma, furgon, prefectos, viaducto];
  const NOMBRES = ["El pasillo, ante el compartimento abierto", "El pasillo de las ventanillas", "El pasillo con el carrito de los dulces", "El vagón en corte, por el campo",
    "La plataforma del último vagón", "El furgón de los equipajes", "El coche de los prefectos", "El pasillo junto al viaducto"];
  MAG[35] = (n) => ["El Expreso por dentro", NOMBRES[Math.min(n, 8) - 1], (k) => EXPRESO[Math.min(n, 8) - 1](k), { cielo: "propio", fuerza: 0.45, ventanal: "#7fb0d8", ven: ["#fff4d8", "#ffffff"] }];
  window.SitiosIt29.NOMBRES = NOMBRES;
})();

(function () {
  const { rampa, rellena, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, luces, sombraE, suelo3d, tablones, espejo, rayos } = Det6;
  const T = window.P15, W = 320, H = 180;
  window.SitiosIt29 = window.SitiosIt29 || {};
  const MAG = (window.SitiosIt29.magos = window.SitiosIt29.magos || {});
  const ORO = ["#f8e090", "#e8c050", "#c89a3a", "#a07a28", "#7a5a1a"];
  const PAVO = ["#2e8aa8", "#257494", "#1d6080", "#164e6c", "#103c56"];
  const MADN = ["#6a4430", "#583826", "#482c1e", "#3a2216", "#2a180e"];
  const VERDE = ["#e8ffc0", "#b0ff80", "#64ec4c", "#2cc03a", "#14922a"];
  const MARMOL = ["#f2eee6", "#dedad2", "#c4c0b8", "#a8a49c", "#8c8880"];
  const AGUA = ["#9ad0f0", "#76b8e4", "#5aa0d4", "#4688c0", "#3672a8"];

  const GLIFOS = [["0110", "1001", "1001", "0110"], ["010", "111", "010"], ["0110", "1000", "1000", "0110"], ["101", "010", "101"], ["00100", "01110", "11111"], ["01110", "10101", "01110"], ["111", "101", "111"], ["1001", "0110", "1001"]];
  function simbolos(k, dentro, n, s) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(hash(i, 1, s) * W), y = Math.round(hash(i, 2, s) * H);
      if (!dentro(x, y)) continue;
      const g = GLIFOS[Math.floor(hash(i, 3, s) * GLIFOS.length)], c = hash(i, 4, s) > 0.4 ? ORO[0] : ORO[1];
      g.forEach((f, j) => [...f].forEach((b, col) => { if (b === "1") k.crudo(x + col, y + j, 1, 1, c); }));
    }
  }
  const techoPavo = (k, pts, s) => { rellena(k, pts, (x, y) => rampa(PAVO, 0.2 + (fbm(x * 0.05, y * 0.12, s) - 0.5) * 0.35 + (y / 60) * 0.25, x, y)); };
  function chimenea(k, x, b, w, h, L, { mago = false, s = 1 } = {}) {
    const cx = x + w / 2, top = b - h;
    T.rect(k, x - 3, top + w * 0.25, w + 6, h - w * 0.25, (px, py) => rampa(ORO, 0.22 + ((px - x) / w) * 0.4 + (hash(px >> 1, py >> 1, s) - 0.5) * 0.12, px, py));
    bola(k, cx, top + w * 0.25, w / 2 + 3, w * 0.3, (px, py) => (py > top + w * 0.25 ? null : rampa(ORO, 0.18 + ((px - x) / w) * 0.4, px, py)));
    k.R(Math.round(cx) - 2, top - Math.round(w * 0.08) - 3, 4, 4, ORO[1]); k.P(Math.round(cx), top - Math.round(w * 0.08) - 4, ORO[0]);
    T.rect(k, x, top + w * 0.3, w, h - w * 0.3, () => "#0e0b0a");
    bola(k, cx, top + w * 0.3, w / 2, w * 0.24, (px, py) => (py > top + w * 0.3 ? null : "#0e0b0a"));
    const hr = k.luz ? k.luz.hr : 0, hmax = (h - w * 0.3) * 0.46;
    for (let px = Math.ceil(x + 1); px < x + w - 1; px++) {
      const u = (px - x) / w, lado = Math.abs(u - 0.5) * 2, lengua = 0.5 + 0.5 * Math.abs(Math.sin(u * Math.PI * 3 + hr * 2 + s)), alto = hmax * lengua * (1 - lado * lado * 0.65);
      for (let py = 0; py < alto; py++) k.crudo(px, b - 1 - py, 1, 1, VERDE[Math.min(4, Math.floor((py / Math.max(1, alto)) * 3.2 + lado * 1.4))]);
    }
    if (mago) { const mh = Math.min(h * 0.62, 22); rellena(k, [[cx - mh * 0.24, b - 1], [cx - mh * 0.12, b - mh * 0.85], [cx + mh * 0.12, b - mh * 0.85], [cx + mh * 0.24, b - 1]], () => "#1a2a1c"); bola(k, cx, b - mh * 0.92, mh * 0.11, mh * 0.12, () => "#1a2a1c"); rellena(k, [[cx - mh * 0.14, b - mh * 0.98], [cx + mh * 0.04, b - mh * 1.25], [cx + mh * 0.14, b - mh * 0.98]], () => "#1a2a1c"); }
    k.R(x - 4, b, w + 8, 2, ORO[3]); k.R(x - 4, b, w + 8, 1, ORO[1]);
    L.push({ x: cx, y: b - h * 0.25, r: w * 1.8 + 8, ry: h * 0.9, col: "#7ae85a", f: 0.7 });
  }
  function fuente(k, cx, b, e, L, s = 1) {
    const E = (v) => v * e, oro = (x0, w) => (px, py) => rampa(ORO, 0.06 + ((px - x0) / Math.max(1, w)) * 0.62 + (hash(px, py, s) - 0.5) * 0.08, px, py);
    sombraE(k, cx, b + E(2), E(66), E(10), 0.4);
    bola(k, cx, b - E(4), E(62), E(13), (x, y) => rampa(MARMOL, 0.1 + ((y - b + E(17)) / E(26)) * 0.55 + (hash(x, y, s) - 0.5) * 0.06, x, y));
    bola(k, cx, b - E(7), E(56), E(9), (x, y) => rampa(AGUA, 0.15 + ((y - b + E(16)) / E(18)) * 0.45 + (Math.sin(x * 0.55 + y * 1.4) > 0.75 ? -0.3 : 0), x, y));
    T.rect(k, cx - E(18), b - E(20), E(36), E(12), (x, y) => rampa(MARMOL, 0.15 + ((x - cx + E(18)) / E(36)) * 0.5, x, y)); k.R(cx - E(19), b - E(21), E(38), Math.max(1, E(2)), MARMOL[0]);
    const pb = b - E(20);
    rellena(k, [[cx - E(40), pb], [cx - E(40), pb - E(14)], [cx - E(20), pb - E(16)], [cx - E(20), pb]], oro(cx - E(40), E(20)));
    [[-40], [-35], [-25], [-21]].forEach(([d]) => k.R(cx + E(d), pb - E(2), Math.max(1, E(2)), E(10), ORO[3]));
    rellena(k, [[cx - E(24), pb - E(14)], [cx - E(22), pb - E(34)], [cx - E(16), pb - E(34)], [cx - E(16), pb - E(14)]], oro(cx - E(24), E(8)));
    bola(k, cx - E(19), pb - E(37), E(3.5), E(4), oro(cx - E(23), E(8)));
    trazo(k, [[cx - E(28), pb - E(44)], [cx - E(31), pb - E(32)], [cx - E(28), pb - E(20)]], ORO[2], Math.max(1, E(1.2)), 1); trazo(k, [[cx - E(16), pb - E(30)], [cx - E(28), pb - E(32)]], ORO[1], 1);
    rellena(k, [[cx - E(30), pb], [cx - E(28), pb - E(12)], [cx - E(22), pb - E(12)], [cx - E(20), pb]], oro(cx - E(30), E(10)));
    bola(k, cx - E(25), pb - E(15), E(3.5), E(3), oro(cx - E(29), E(8))); k.poli([[cx - E(28), pb - E(16)], [cx - E(34), pb - E(21)], [cx - E(27), pb - E(14)]], ORO[2]); k.poli([[cx - E(22), pb - E(16)], [cx - E(16), pb - E(21)], [cx - E(23), pb - E(14)]], ORO[2]);
    rellena(k, [[cx + E(20), pb], [cx + E(22), pb - E(14)], [cx + E(30), pb - E(14)], [cx + E(32), pb]], oro(cx + E(20), E(12)));
    bola(k, cx + E(26), pb - E(17), E(4), E(3.5), oro(cx + E(22), E(8))); rellena(k, [[cx + E(22), pb - E(19)], [cx + E(27), pb - E(29)], [cx + E(31), pb - E(19)]], oro(cx + E(22), E(9)));
    const mx = cx - E(5);
    rellena(k, [[mx - E(10), pb], [mx - E(6), pb - E(38)], [mx + E(6), pb - E(38)], [mx + E(10), pb]], oro(mx - E(10), E(20)));
    bola(k, mx, pb - E(42), E(4.5), E(5), oro(mx - E(5), E(10))); rellena(k, [[mx - E(3), pb - E(40)], [mx + E(3), pb - E(40)], [mx, pb - E(31)]], () => ORO[2]);
    trazo(k, [[mx + E(5), pb - E(33)], [mx + E(9), pb - E(46)], [mx + E(10), pb - E(60)]], ORO[1], Math.max(1, E(2)), 1);
    const bx = cx + E(11);
    rellena(k, [[bx - E(8), pb], [bx - E(4), pb - E(30)], [bx + E(4), pb - E(30)], [bx + E(8), pb]], oro(bx - E(8), E(16)));
    bola(k, bx, pb - E(33), E(4), E(4.5), oro(bx - E(4), E(8))); rellena(k, [[bx - E(6), pb - E(36)], [bx + E(1), pb - E(49)], [bx + E(6), pb - E(36)]], oro(bx - E(6), E(12)));
    trazo(k, [[bx + E(3), pb - E(25)], [bx + E(10), pb - E(36)]], ORO[1], Math.max(1, E(1.5)), 1);
    const chorro = (x0, y0, dx) => k.alfa(0.7, () => { for (let i = 0; i < 26; i++) { const t = i / 25, x = x0 + dx * t * E(18), y = y0 - Math.sin(t * Math.PI) * E(8) + t * (b - E(9) - y0); k.crudo(x, y, 1, 1, i % 3 ? "#d8f0ff" : "#ffffff"); } });
    chorro(mx + E(10), pb - E(60), 1.2); chorro(bx + E(10), pb - E(36), 1); chorro(cx - E(28), pb - E(44), -1.1); chorro(cx + E(27), pb - E(29), 0.9); chorro(cx - E(34), pb - E(21), -0.7); chorro(cx - E(16), pb - E(21), 0.5);
    L.push({ x: cx, y: pb - E(20), r: E(70), ry: E(46), col: "#f8e090", f: 0.35 });
  }
  function silueta(k, x, b, h, col = "#22201e", sombrero = true) {
    rellena(k, [[x - h * 0.22, b], [x - h * 0.12, b - h * 0.72], [x + h * 0.12, b - h * 0.72], [x + h * 0.22, b]], () => col);
    bola(k, x, b - h * 0.8, h * 0.1, h * 0.11, () => col);
    if (sombrero) rellena(k, [[x - h * 0.14, b - h * 0.86], [x + h * 0.03, b - h * 1.12], [x + h * 0.14, b - h * 0.86]], () => col);
  }
  const memo = (k, x, y, d = 1) => { k.poli([[x, y], [x + d * 7, y + 2], [x, y + 4]], "#c8b0e8"); k.poli([[x, y + 2], [x + d * 7, y + 2], [x + d * 2, y + 4]], "#a890d0"); };
  function sueloPulido(k, y0, fy, s, refleja = true) {
    suelo3d(k, y0, H, 160, fy, tablones(MADN, { pw: 13, L: 64, s }));
    if (refleja) espejo(k, y0, y0, H, { tinte: "#2a1810", mezcla: 0.62, onda: 0.3, oscuro: 0.75, crestas: 0.02, s });
  }

  function frente(k) {
    const L = [], s = 4101;
    techoPavo(k, [[0, 0], [W, 0], [224, 30], [96, 30]], s);
    simbolos(k, (x, y) => y > 2 && y < 30 * Math.min(1, x / 96, (W - x) / 96) - 2, 140, s);
    k.R(96, 29, 128, 2, ORO[2]);
    const pared = (lado) => (x, y) => { const t = lado > 0 ? x / 96 : (W - x) / 96, u = Math.floor(t * 12); return rampa(MADN, 0.12 + t * 0.35 + ((t * 12) % 1 < 0.08 ? 0.3 : 0) + (fbm(u, y * 0.1, s) - 0.5) * 0.15, x, y); };
    rellena(k, [[0, 0], [96, 30], [96, 104], [0, 172]], pared(1)); rellena(k, [[W, 0], [224, 30], [224, 104], [W, 172]], pared(-1));
    [0.1, 0.3, 0.5, 0.7, 0.86].forEach((t, i) => [1, -1].forEach((lado) => {
      const q = (u, v) => { const tt = t + u * 0.1, x = 96 * tt, top = 30 * tt, bot = 172 - 68 * tt; return [lado > 0 ? x : W - x, top + (bot - top) * v]; };
      rellena(k, [q(-0.12, 0.38), q(1.12, 0.38), q(1.12, 1), q(-0.12, 1)], (x, y) => rampa(ORO, 0.3 + (hash(x, y, s + i) - 0.5) * 0.15, x, y));
      rellena(k, [q(0, 0.46), q(1, 0.46), q(1, 1), q(0, 1)], () => "#0e0b0a");
      rellena(k, [q(0.06, 0.62), q(0.94, 0.62), q(0.94, 1), q(0.06, 1)], (x, y) => { const [, yb] = q(0.5, 1), [, yt] = q(0.5, 0.62), f = (yb - y) / Math.max(1, yb - yt); return f > 0.85 + hash(Math.floor(x), 2, s) * 0.15 ? null : VERDE[Math.min(4, Math.floor(f * 4.4 + hash(Math.floor(x), Math.floor(y), s) * 0.8))]; });
      if ((i + (lado > 0 ? 0 : 1)) % 3 === 0) { const [mx, mb] = q(0.5, 0.98), [, mt] = q(0.5, 0.62); silueta(k, mx, mb, (mb - mt) * 1.1, "#1a2a1c"); }
      const [lx, ly] = q(0.5, 0.85); L.push({ x: lx, y: ly, r: 26 * (1 - t * 0.55), ry: 22 * (1 - t * 0.5), col: "#7ae85a", f: 0.75 });
    }));
    T.rect(k, 96, 30, 128, 74, (x, y) => rampa(MADN, 0.4 + (fbm(x * 0.1, y * 0.1, s) - 0.5) * 0.2, x, y));
    T.rect(k, 132, 40, 56, 64, () => "#fff0c8"); bola(k, 160, 40, 28, 14, (x, y) => (y > 40 ? null : "#fff0c8"));
    for (let x = 134; x < 188; x += 4) k.R(x, 40, 1, 64, ORO[2]); for (let y = 52; y < 104; y += 12) k.R(132, y, 56, 1, ORO[3]);
    k.R(130, 38, 60, 3, ORO[1]); k.R(158, 26, 4, 14, ORO[1]);
    L.push({ x: 160, y: 80, r: 50, ry: 40, col: "#fff0c8", f: 0.5 });
    sueloPulido(k, 104, 66, s);
    fuente(k, 160, 142, 0.92, L, s);
    for (let i = 0; i < 6; i++) memo(k, 60 + hash(i, 1, s) * 200, 36 + hash(i, 2, s) * 24, i % 2 ? 1 : -1);
    luces(k, L);
  }

  function cerca(k) {
    const L = [], s = 4201;
    techoPavo(k, [[0, 0], [W, 0], [W, 28], [0, 28]], s);
    simbolos(k, (x, y) => y > 2 && y < 24, 120, s);
    k.R(0, 26, W, 3, ORO[2]); k.R(0, 26, W, 1, ORO[0]);
    paredPaneles(k, 29, 132, s);
    [18, 74, 194, 250].forEach((x, i) => chimenea(k, x, 132, 30, 48, L, { mago: i === 1 || i === 2, s: s + i }));
    sueloPulido(k, 132, 70, s);
    fuente(k, 160, 140, 1.25, L, s);
    for (let i = 0; i < 4; i++) memo(k, 90 + hash(i, 1, s) * 140, 34 + hash(i, 2, s) * 14, i % 2 ? 1 : -1);
    luces(k, L);
  }
  function paredPaneles(k, y0, y1, s, pal = MADN) {
    T.rect(k, 0, y0, W, y1 - y0, (x, y) => { const u = x % 32; if (u < 2) return pal[4]; if (u === 2 || u === 29) return pal[1]; return rampa(pal, 0.25 + (fbm(x * 0.4, y * 0.04 + Math.floor(x / 32) * 9, s) - 0.5) * 0.3 + ((y - y0) / (y1 - y0)) * 0.15, x, y); });
    k.R(0, y0, W, 2, ORO[3]); k.R(0, y1 - 6, W, 6, pal[3]); k.R(0, y1 - 6, W, 1, ORO[3]);
  }

  function chimeneas(k) {
    const L = [], s = 4301;
    techoPavo(k, [[0, 0], [W, 0], [W, 34], [0, 34]], s);
    simbolos(k, (x, y) => y > 2 && y < 30, 150, s);
    k.R(0, 32, W, 3, ORO[2]); k.R(0, 32, W, 1, ORO[0]);
    paredPaneles(k, 35, 136, s);
    [[10, false], [70, true], [130, false], [190, true], [250, false]].forEach(([x, m], i) => chimenea(k, x, 136, 44, 66, L, { mago: m, s: s + i }));
    [[146, 136, 20], [158, 137, 22], [170, 136, 19]].forEach(([x, b, h]) => silueta(k, x, b, h, "#2a2622"));
    sueloPulido(k, 136, 76, s);
    for (let i = 0; i < 7; i++) memo(k, 20 + hash(i, 1, s) * 280, 40 + hash(i, 2, s) * 40, i % 2 ? 1 : -1);
    luces(k, L);
  }

  function puertas(k) {
    const L = [], s = 4401;
    techoPavo(k, [[0, 0], [W, 0], [W, 26], [0, 26]], s);
    simbolos(k, (x, y) => y > 2 && y < 22, 110, s);
    k.R(0, 24, W, 3, ORO[2]);
    paredPaneles(k, 27, 134, s);
    T.rect(k, 120, 44, 104, 90, () => "#fff2cc"); bola(k, 172, 44, 52, 20, (x, y) => (y > 44 ? null : "#fff2cc"));
    for (let x = 122; x < 224; x += 5) k.R(x, 36, 1, 98, ORO[2]); for (let y = 60; y < 134; y += 16) k.R(120, y, 104, 1, ORO[3]);
    for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) { k.P(172 + Math.cos(a) * 52, 44 + Math.sin(a) * 20, ORO[1]); k.P(172 + Math.cos(a) * 50, 44 + Math.sin(a) * 18, ORO[3]); }
    k.R(116, 42, 4, 92, ORO[2]); k.R(224, 42, 4, 92, ORO[2]); k.R(116, 42, 1, 92, ORO[0]);
    rotulo(k, 150, 28, "ASCENSORES", ORO[0]);
    L.push({ x: 172, y: 96, r: 70, ry: 50, col: "#fff0c8", f: 0.55 });
    sombraE(k, 100, 136, 26, 3, 0.4);
    T.rect(k, 78, 112, 44, 24, (x, y) => rampa(MADN, 0.2 + ((x - 78) / 44) * 0.4 + (y === 112 ? -0.2 : 0), x, y)); k.R(76, 110, 48, 3, ORO[3]); k.R(76, 110, 48, 1, ORO[1]);
    T.rect(k, 76, 80, 48, 9, () => ORO[3]); T.rect(k, 77, 81, 46, 7, () => "#2a1a10"); rotulo(k, 82, 82, "SEGURIDAD", ORO[0]); k.R(84, 89, 1, 21, ORO[3]); k.R(115, 89, 1, 21, ORO[3]);
    k.R(112, 102, 2, 8, ORO[3]); rellena(k, [[108, 102], [118, 102], [116, 98], [110, 98]], () => "#2c8a4a"); L.push({ x: 113, y: 104, r: 18, ry: 12, col: "#ffe2a0", f: 0.5 });
    silueta(k, 92, 112, 18, "#3a2a20", false);
    sueloPulido(k, 134, 72, s);
    fuente(k, 268, 150, 0.8, L, s);
    for (let i = 0; i < 5; i++) memo(k, 120 + hash(i, 1, s) * 100, 30 + hash(i, 2, s) * 20, i % 2 ? 1 : -1);
    luces(k, L);
  }

  function pelicula(k) {
    const L = [], s = 4501;
    const AZ = ["#2c5a44", "#22483a", "#1a3a2e", "#122c22", "#0a1e16"];
    T.rect(k, 0, 0, W, 136, (x, y) => { const tx = Math.floor(x / 6), ty = Math.floor(y / 4), u = x % 6, v = y % 4; if (u === 0 || v === 0) return "#08120c"; const negro = (tx + ty) % 7 === 0; return rampa(negro ? ["#2a2c30", "#222428", "#1a1c20", "#121418", "#0a0c10"] : AZ, 0.2 + (u === 1 || v === 1 ? -0.18 : 0) + (hash(tx, ty, s) - 0.5) * 0.2 + (y / 136) * 0.2, x, y); });
    techoPavo(k, [[0, 0], [W, 0], [W, 14], [0, 14]], s); simbolos(k, (x, y) => y > 1 && y < 12, 80, s);
    k.R(0, 14, W, 2, ORO[2]); k.R(0, 60, W, 2, ORO[3]);
    [40, 280].forEach((x) => { T.rect(k, x - 12, 18, 24, 56, (px, py) => rampa(["#7a3a9a", "#64307e", "#4e2664", "#3a1c4a"], 0.15 + ((px - x + 12) / 24) * 0.5, px, py)); k.poli([[x - 12, 74], [x, 82], [x + 12, 74]], "#4e2664"); k.R(x - 13, 16, 26, 2, ORO[1]); rotulo(k, x - 2, 38, "M", ORO[0]); k.R(x - 8, 30, 16, 1, ORO[2]); k.R(x - 8, 50, 16, 1, ORO[2]); });
    [[70, 64, 30], [126, 64, 30], [182, 64, 30], [238, 64, 30]].forEach(([x, , w], i) => {
      T.rect(k, x - 4, 76, w + 8, 60, (px, py) => ((px + py) % 5 === 0 ? "#2a2c30" : "#16181c"));
      chimenea(k, x, 136, w, 54, L, { mago: i === 1, s: s + i });
    });
    sueloPulido(k, 136, 74, s);
    fuente(k, 160, 144, 0.7, L, s);
    luces(k, L);
  }

  function diagonal(k) {
    const L = [], s = 4601;
    techoPavo(k, [[0, 0], [W, 0], [W, 24], [150, 44], [0, 44]], s);
    simbolos(k, (x, y) => y > 2 && y < (x > 150 ? 44 - ((x - 150) / 170) * 20 : 44) - 2, 140, s);
    paredPaneles(k, 44, 120, s);
    T.rect(k, 40, 70, 40, 50, () => "#fff0c8"); for (let x = 42; x < 80; x += 4) k.R(x, 64, 1, 56, ORO[2]); k.R(38, 64, 44, 3, ORO[1]); L.push({ x: 60, y: 96, r: 36, ry: 30, col: "#fff0c8", f: 0.45 });
    rellena(k, [[150, 44], [W, 24], [W, 176], [150, 120]], (x, y) => rampa(MADN, 0.2 + ((x - 150) / 170) * 0.2 + ((x % 22) < 2 ? 0.3 : 0) + (fbm(x * 0.2, y * 0.05, s) - 0.5) * 0.2, x, y));
    [0.12, 0.38, 0.66].forEach((t, i) => {
      const q = (u, v) => { const tt = t + u * 0.18, x = 150 + 170 * tt, top = 44 - 20 * tt, bot = 120 + 56 * tt; return [x, top + (bot - top) * v]; };
      rellena(k, [q(-0.08, 0.36), q(1.08, 0.36), q(1.08, 1), q(-0.08, 1)], (x, y) => rampa(ORO, 0.3 + (hash(x, y, s + i) - 0.5) * 0.15, x, y));
      rellena(k, [q(0, 0.44), q(1, 0.44), q(1, 1), q(0, 1)], () => "#0e0b0a");
      rellena(k, [q(0.06, 0.62), q(0.94, 0.62), q(0.94, 1), q(0.06, 1)], (x, y) => { const [, yb] = q(0.5, 1), [, yt] = q(0.5, 0.62), f = (yb - y) / Math.max(1, yb - yt); return f > 0.85 + hash(Math.floor(x), 2, s) * 0.15 ? null : VERDE[Math.min(4, Math.floor(f * 4.4 + hash(Math.floor(x), Math.floor(y), s) * 0.8))]; });
      if (i !== 1) { const [mx, mb] = q(0.5, 0.98), [, mt] = q(0.5, 0.6); silueta(k, mx, mb, (mb - mt) * 1.1, "#1a2a1c"); }
      const [lx, ly] = q(0.5, 0.85); L.push({ x: lx, y: ly, r: 30 + t * 30, ry: 24 + t * 20, col: "#7ae85a", f: 0.75 });
    });
    suelo3d(k, 120, H, 150, 80, tablones(MADN, { pw: 13, L: 64, s }), { dentro: (x, y) => y >= 120 + Math.max(0, (x - 150) / 170) * 56 });
    espejo(k, 120, 120, H, { tinte: "#2a1810", mezcla: 0.62, onda: 0.3, oscuro: 0.75, crestas: 0.02, s, x1: 150 });
    fuente(k, 104, 132, 0.62, L, s);
    [[30, 130, 16], [52, 128, 14], [180, 126, 15], [136, 124, 13]].forEach(([x, b, h], i) => silueta(k, x, b, h, i % 2 ? "#2a2622" : "#3a2a24", i !== 2));
    for (let i = 0; i < 10; i++) memo(k, 20 + hash(i, 1, s) * 280, 30 + hash(i, 2, s) * 50, i % 2 ? 1 : -1);
    luces(k, L);
  }

  const ATRIO = [frente, cerca, chimeneas, puertas, pelicula, diagonal];
  const NOMBRES = ["De frente, con más detalle", "La fuente, de cerca", "La fila de chimeneas", "Las puertas doradas y el control de seguridad", "Como en la película", "En diagonal, con los magos que llegan"];
  MAG[41] = (n) => ["El atrio del Ministerio", NOMBRES[Math.min(n, 6) - 1], (k) => ATRIO[Math.min(n, 6) - 1](k), { cielo: "propio", fuerza: 0.1, fuego: ["#c8ff8a", "#7ae85a", "#3ac83a", "#1a8a2a", "#f8e090", "#e8c050", "#e8ffc0", "#b0ff80", "#64ec4c", "#2cc03a", "#14922a", "#fff0c8", "#fff2cc"] }];
})();

(function () {
  const { rampa, rellena, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, luces, sombraE, suelo3d, losas3d, espejo, bruma, rayos } = Det6;
  const T = window.P15, P = window.OP14P, W = 320, H = 180;
  window.SitiosIt29 = window.SitiosIt29 || {};
  const MAG = (window.SitiosIt29.magos = window.SitiosIt29.magos || {});
  const ORO = ["#f8e090", "#e8c050", "#c89a3a", "#a07a28", "#7a5a1a"];
  const NOCHE = "#2a3670";
  const ESCARCHA = ["#e4eef8", "#cadbee", "#acc4e2", "#90acd4", "#7896c4", "#5f7eb0"];
  const HIELO = ["#f2faff", "#d8ecfa", "#b8d8f0", "#96c0e4", "#78a6d4"];
  const ABETO = ["#4a8a5e", "#3a7650", "#2c6242", "#204e34", "#163c28"];
  const LUCES = ["#ffd27a", "#e8402a", "#9ad8ff", "#f2c84b", "#c8a0ff"];

  function techoNoche(k, pts, s) {
    rellena(k, pts, () => NOCHE);
    for (let i = 0; i < 60; i++) { const x = hash(i, 1, s) * W, y = hash(i, 2, s) * 70; k.crudo(x, y, 1, 1, i % 7 ? "#e8ecff" : "#ffffff"); }
  }
  const escarcha = (s, y0, alto) => (x, y) => rampa(ESCARCHA, 0.12 + ((y - y0) / alto) * 0.45 + (fbm(x * 0.09, y * 0.11, s) - 0.5) * 0.4 + (fbm(x * 0.5, y * 0.5, s + 1) > 0.78 ? -0.18 : 0), x, y);
  function carambanos(k, x0, x1, y, s, largo = 10) { k.R(x0, y - 2, x1 - x0, 3, HIELO[1]); for (let x = x0; x < x1; x += 3) { const l = 2 + hash(x, 1, s) * largo; rellena(k, [[x, y], [x + 3, y], [x + 1.5, y + l]], (px, py) => rampa(HIELO, 0.05 + ((py - y) / l) * 0.5, px, py)); } }
  function guirnalda(k, x0, x1, y, cae, s) {
    for (let i = 0; i <= 60; i++) { const t = i / 60, x = x0 + (x1 - x0) * t, yy = y + Math.sin(t * Math.PI) * cae; k.R(x, yy, 2, 2, i % 3 ? "#2c6a3a" : "#3e8a4a"); if (i % 9 === 4) { k.crudo(x, yy + 2, 2, 2, "#e8402a"); } if (i % 15 === 0) bola(k, x + 1, yy + 4, 1.5, 1.5, () => ORO[1]); }
  }
  function ventanaGotica(k, x, y, w, h, s) {
    const cx = x + w / 2;
    rellena(k, [[x - 2, y + h], [x - 2, y + w * 0.6], [cx, y - 3], [x + w + 2, y + w * 0.6], [x + w + 2, y + h]], () => "#5a6a88");
    rellena(k, [[x, y + h], [x, y + w * 0.6], [cx, y], [x + w, y + w * 0.6], [x + w, y + h]], (px, py) => rampa(["#3a4a80", "#2e3c6c", "#24305a"], 0.2 + ((py - y) / h) * 0.6 + (fbm(px * 0.3, py * 0.3, s) > 0.62 ? -0.3 : 0), px, py));
    k.R(cx - 1, y + 2, 2, h - 2, "#5a6a88"); for (let yy = y + w; yy < y + h; yy += 10) k.R(x, yy, w, 1, "#5a6a88");
    for (let i = 0; i < 10; i++) k.crudo(x + hash(i, 1, s) * w, y + w * 0.6 + hash(i, 2, s) * (h - w * 0.6), 1, 1, "#ffffff");
  }
  function abeto(k, x, b, h, s, L) {
    sombraE(k, x, b + 1, h * 0.36, 3, 0.4);
    k.R(x - 2, b - h * 0.12, 4, h * 0.12, "#5a3a22");
    for (let j = 0; j < 6; j++) {
      const t = j / 6, y = b - h * 0.1 - h * 0.86 * t, w = (1 - t) * h * 0.36 + 3;
      rellena(k, [[x - w, y], [x + w, y], [x, y - h * 0.3]], (px, py) => rampa(ABETO, 0.08 + ((px - x + w) / (2 * w)) * 0.55 + (hash(px, py, s) - 0.5) * 0.15, px, py));
      bola(k, x - w * 0.15, y - 2, w * 0.75, 1.6, () => "#f4f8ff");
    }
    for (let i = 0; i < Math.round(h * 0.4); i++) { const t = hash(i, 1, s), y = b - h * 0.14 - t * h * 0.78, w = (1 - (b - h * 0.1 - y) / (h * 0.86)) * h * 0.32; const px = x + (hash(i, 2, s) - 0.5) * 2 * w; k.crudo(px, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2, LUCES[i % 5]); }
    k.crudo(x - 2, b - h * 1.02, 5, 5, ORO[0]); k.crudo(x - 1, b - h * 1.06, 3, 9, ORO[1]); k.crudo(x - 4, b - h * 1.0, 9, 1, ORO[1]);
    L.push({ x, y: b - h * 0.5, r: h * 0.6, ry: h * 0.6, col: "#ffd27a", f: 0.45 });
  }
  function mesita(k, x, b, e, L) {
    sombraE(k, x, b, 16 * e, 3 * e, 0.3);
    T.rect(k, x - 14 * e, b - 10 * e, 28 * e, 8 * e, (px, py) => rampa(["#f8fbff", "#e4eef8", "#ccdcec"], 0.1 + ((py - b + 10 * e) / (8 * e)) * 0.5, px, py));
    bola(k, x, b - 10 * e, 14 * e, 3.5 * e, () => "#f8fbff");
    k.R(x - 1, b - 2 * e, 2, 2 * e, "#a8b8c8");
    k.R(x - 2 * e, b - 18 * e, 4 * e, 6 * e, "#c8d8f0"); k.crudo(x - 1, b - 17 * e, 2, 4 * e, "#ffd27a"); k.R(x - 2 * e, b - 19 * e, 4 * e, 1, ORO[2]);
    L.push({ x, y: b - 16 * e, r: 22 * e, col: "#ffcf7a", f: 0.75 });
  }
  function pareja(k, x, b, h, a = "#22283a", c = "#c8a0d8") {
    rellena(k, [[x - h * 0.24, b], [x - h * 0.12, b - h * 0.7], [x, b - h * 0.7], [x + h * 0.02, b]], () => a);
    rellena(k, [[x - h * 0.02, b], [x + h * 0.06, b - h * 0.66], [x + h * 0.16, b - h * 0.66], [x + h * 0.34, b]], () => c);
    bola(k, x - h * 0.06, b - h * 0.8, h * 0.1, h * 0.11, () => "#e0b898"); bola(k, x + h * 0.12, b - h * 0.76, h * 0.09, h * 0.1, () => "#e8c0a0");
  }
  function pista(k, y0, fy, s, refleja = true) {
    suelo3d(k, y0, H, 160, fy, losas3d(["#dcecf8", "#c0d8ee", "#a4c0e2", "#8aa8d4", "#7090c4"], { tx: 26, tz: 18, s }));
    if (refleja) espejo(k, y0, y0, H, { tinte: "#a8c0e0", mezcla: 0.5, onda: 0.2, oscuro: 0.92, crestas: 0.03, s });
  }
  function escultura(k, x, b, tipo, e = 1) {
    const col = (px, py) => rampa(HIELO, 0.08 + ((px - x + 12 * e) / (24 * e)) * 0.5 + (hash(px, py, 7) > 0.92 ? -0.2 : 0), px, py);
    k.alfa(0.85, () => {
      T.rect(k, x - 8 * e, b - 6 * e, 16 * e, 6 * e, col);
      if (tipo === "cisne") { bola(k, x, b - 12 * e, 10 * e, 6 * e, col); trazo(k, [[x + 6 * e, b - 14 * e], [x + 9 * e, b - 26 * e], [x + 5 * e, b - 32 * e]], HIELO[1], Math.max(1, 3 * e), Math.max(1, 2 * e)); rellena(k, [[x - 10 * e, b - 14 * e], [x - 2 * e, b - 26 * e], [x + 2 * e, b - 14 * e]], col); }
      else { T.rect(k, x - 10 * e, b - 22 * e, 18 * e, 9 * e, col); [-8, -3, 3, 7].forEach((d) => k.R(x + d * e, b - 13 * e, Math.max(1, 2 * e), 8 * e, HIELO[2])); trazo(k, [[x + 7 * e, b - 20 * e], [x + 11 * e, b - 30 * e]], HIELO[1], Math.max(1, 3 * e)); bola(k, x + 12 * e, b - 31 * e, 3.5 * e, 3 * e, col); trazo(k, [[x + 11 * e, b - 34 * e], [x + 8 * e, b - 42 * e], [x + 4 * e, b - 44 * e]], HIELO[0], 1); trazo(k, [[x + 13 * e, b - 34 * e], [x + 17 * e, b - 41 * e], [x + 21 * e, b - 42 * e]], HIELO[0], 1); }
    });
  }
  const nieve = (k, n, s, y1 = 140) => P.nieve(k, n, s, { y1 });
  const AJ = { cielo: "propio", fuerza: 0.1, ventanal: NOCHE, fuego: ["#ffd27a", "#e8402a", "#9ad8ff", "#f2c84b", "#c8a0ff", "#f8e090", "#e8c050", "#ffcf7a", "#e8ecff", "#ffffff", "#9a5ac8", "#5ae8c8"] };

  function frente(k) {
    const L = [], s = 3901;
    techoNoche(k, [[0, 0], [W, 0], [W, 40], [0, 40]], s);
    T.rect(k, 0, 36, W, 82, escarcha(s, 36, 82));
    [24, 70, 214, 260].forEach((x, i) => ventanaGotica(k, x, 44, 26, 52, s + i));
    carambanos(k, 0, W, 38, s, 12);
    for (let i = 0; i < 6; i++) guirnalda(k, i * 56 - 8, i * 56 + 48, 52, 12, s + i);
    T.rect(k, 112, 66, 96, 44, (x, y) => rampa(["#4a2a6a", "#3c2258", "#2e1a46", "#221236"], 0.15 + Math.abs(Math.sin(x / 3)) * 0.3, x, y));
    k.R(108, 62, 104, 4, ORO[2]); k.R(108, 62, 104, 1, ORO[0]); k.R(106, 108, 108, 4, "#6a7a98"); k.R(106, 108, 108, 1, "#a8b8d0");
    [[132, 108], [150, 108], [168, 108], [188, 108]].forEach(([x, b], i) => { rellena(k, [[x - 4, b], [x - 2, b - 16], [x + 2, b - 16], [x + 4, b]], () => "#14101c"); bola(k, x, b - 18, 2.5, 2.5, () => "#14101c"); k.crudo(x - 5, 66, 10, 4, i % 2 ? "#c8a0ff" : "#9a5ac8"); });
    rayos(k, [[132, 66, 140, 108, 2, 14], [168, 66, 160, 108, 2, 14]], "#c8a0ff", 0.25);
    abeto(k, 34, 118, 74, s, L); abeto(k, 286, 118, 74, s + 1, L);
    escultura(k, 92, 116, "cisne", 1); escultura(k, 232, 116, "reno", 1);
    pista(k, 116, 70, s);
    [[30, 150, 0.9], [290, 152, 0.9], [8, 176, 1.2], [312, 176, 1.2]].forEach(([x, b, e]) => mesita(k, x, b, e, L));
    nieve(k, 110, s);
    luces(k, [...L, { x: 160, y: 90, r: 60, ry: 30, col: "#c8a0ff", f: 0.4 }]);
  }

  function vals(k) {
    const L = [], s = 3911;
    techoNoche(k, [[0, 0], [W, 0], [W, 34], [0, 34]], s);
    T.rect(k, 0, 30, W, 88, escarcha(s, 30, 88));
    carambanos(k, 0, W, 32, s, 10);
    T.rect(k, 70, 92, 180, 22, (x, y) => rampa(["#d8e4f0", "#bccce0", "#a0b4d0", "#8aa0c0"], 0.1 + ((y - 92) / 22) * 0.6, x, y)); k.R(68, 90, 184, 3, HIELO[0]);
    const plata = (x0, w) => (px, py) => rampa(["#ffffff", "#e8f0f8", "#c8d8ec", "#a8bcd8"], 0.05 + ((px - x0) / w) * 0.6, px, py);
    rellena(k, [[96, 92], [100, 54], [114, 50], [118, 92]], plata(96, 22)); for (let x = 101; x < 116; x += 2) k.R(x, 56 + (x - 101) * 0.3, 1, 36 - (x - 101) * 0.3, "#ffffff");
    bola(k, 220, 78, 9, 12, plata(211, 18)); k.R(219, 54, 2, 26, "#e8f0f8"); k.R(219, 90, 2, 4, "#c8d8ec");
    [[140, 92], [160, 92], [182, 92], [200, 92]].forEach(([x, b], i) => { rellena(k, [[x - 4, b], [x - 2, b - 16], [x + 2, b - 16], [x + 4, b]], () => "#1c2034"); bola(k, x, b - 18, 2.5, 2.5, () => "#e0b898"); k.R(x + 4, b - 12, 4, 1, "#e8f0f8"); k.R(x + 5, b - 11, 1, 8, "#a8bcd8"); });
    silueta(k, 160, 92, 22); trazo(k, [[163, 74], [170, 66]], "#ffffff", 1);
    for (let i = -6; i <= 6; i++) { const x = 160 + i * 7, l = 18 - Math.abs(i) * 2; rellena(k, [[x - 2, 2], [x + 2, 2], [x, 2 + l]], (px, py) => rampa(HIELO, (py - 2) / l, px, py)); k.crudo(x, 2 + l, 1, 2, "#fff4d8"); }
    L.push({ x: 160, y: 18, r: 70, ry: 30, col: "#fff4d8", f: 0.6 });
    abeto(k, 30, 116, 80, s, L); abeto(k, 290, 116, 80, s + 1, L);
    pista(k, 114, 66, s);
    [[70, 120, 20, "#22283a", "#e8a0b8"], [250, 120, 20, "#2a2420", "#a0c8e8"], [108, 118, 18, "#3a2a20", "#f0e0a0"], [214, 118, 18, "#22283a", "#c8a0d8"]].forEach(([x, b, h, a, c]) => pareja(k, x, b, h, a, c));
    nieve(k, 70, s, 120);
    luces(k, L);
  }
  function silueta(k, x, b, h, col = "#14101c") { rellena(k, [[x - h * 0.2, b], [x - h * 0.12, b - h * 0.72], [x + h * 0.12, b - h * 0.72], [x + h * 0.2, b]], () => col); bola(k, x, b - h * 0.8, h * 0.1, h * 0.11, () => "#e0b898"); }

  function mesitas(k) {
    const L = [], s = 3921;
    techoNoche(k, [[0, 0], [W, 0], [W, 30], [0, 30]], s);
    T.rect(k, 0, 26, W, 92, escarcha(s, 26, 92));
    [12, 64, 116, 168, 220, 272].forEach((x, i) => ventanaGotica(k, x, 38, 28, 52, s + i));
    carambanos(k, 0, W, 28, s, 9);
    guirnalda(k, 0, 160, 34, 16, s); guirnalda(k, 160, W, 34, 16, s + 1);
    pista(k, 116, 64, s, false);
    [30, 82, 134, 186, 238, 290].forEach((x, i) => mesita(k, x, 120, 0.55, L));
    [16, 70, 250, 304].forEach((x) => mesita(k, x, 140, 0.8, L));
    [[42, 132, 18, "#22283a", "#e8a0b8"], [276, 132, 18, "#2a2420", "#a0c8e8"]].forEach(([x, b, h, a, c]) => pareja(k, x, b, h, a, c));
    nieve(k, 90, s, 116);
    luces(k, L);
  }

  function entrada(k) {
    const L = [], s = 3931;
    T.rect(k, 0, 0, W, 132, Det6.piedra(["#9a948c", "#86807a", "#726c66", "#5e5854", "#4a4642"], { tx: 18, ty: 9, s }));
    const ax = 160, ab = 132, aw = 64;
    bola(k, ax, 50, aw + 6, 40, (x, y) => (y > 50 ? null : "#6a645e")); T.rect(k, ax - aw - 6, 50, (aw + 6) * 2, ab - 50, () => "#6a645e");
    bola(k, ax, 52, aw, 36, (x, y) => (y > 52 ? null : rampa(ESCARCHA, 0.1 + (y / 52) * 0.3, x, y))); T.rect(k, ax - aw, 52, aw * 2, ab - 52, (x, y) => rampa(ESCARCHA, 0.15 + ((y - 52) / 80) * 0.4 + (fbm(x * 0.1, y * 0.1, s) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 40; i++) k.crudo(ax - aw + hash(i, 1, s) * aw * 2, 20 + hash(i, 2, s) * 90, 1, 1, "#ffffff");
    abeto(k, ax - 30, 124, 60, s, L); abeto(k, ax + 34, 124, 56, s + 1, L);
    [[ax - 4, 126, 16, "#22283a", "#e8a0b8"], [ax + 10, 124, 14, "#2a2420", "#a0c8e8"]].forEach(([x, b, h, a, c]) => pareja(k, x, b, h, a, c));
    L.push({ x: ax, y: 90, r: 90, ry: 60, col: "#e8f0ff", f: 0.5 });
    [[ax - aw, -1], [ax + aw, 1]].forEach(([x, d]) => { rellena(k, [[x, 52], [x - d * 14, 58], [x - d * 14, 130], [x, ab]], (px, py) => rampa(["#7a5232", "#664428", "#52361e", "#3e2816"], 0.2 + (Math.floor(px / 3) % 2 ? 0.1 : 0), px, py)); for (let y = 62; y < 130; y += 20) trazo(k, [[x, y], [x - d * 14, y + 4]], "#2a2a30", 1); });
    [[64, 64], [256, 64]].forEach(([x, y]) => L.push(T.antorcha(k, x, y, { r: 36 })));
    guirnalda(k, ax - aw - 6, ax + aw + 6, 14, 10, s);
    for (let i = 0; i < 6; i++) T.rect(k, 0, 132 - i * 8, 60 - i * 9, 8, (x, y) => rampa(["#f0ece4", "#dcd8d0", "#c4c0b8", "#aca8a0"], 0.15 + (y % 8) / 10, x, y));
    suelo3d(k, 132, H, 160, 80, losas3d(["#b0aaa2", "#9a948c", "#847e78", "#6e6a64", "#58544e"], { tx: 22, tz: 15, s }));
    nieve(k, 50, s, 128);
    luces(k, L);
  }

  function jardin(k) {
    const L = [], s = 3941;
    T.rect(k, 0, 0, W, 100, () => NOCHE);
    for (let i = 0; i < 70; i++) k.crudo(hash(i, 1, s) * W, hash(i, 2, s) * 70, 1, 1, i % 9 ? "#e8ecff" : "#ffffff");
    const H17 = window.H17;
    if (H17 && H17.castillo) H17.castillo(k, 160, 98, 0.62, { s: s + 1 });
    for (let i = 0; i < 26; i++) { const x = 70 + hash(i, 1, s + 2) * 180, y = 40 + hash(i, 2, s + 2) * 50; k.crudo(x, y, 1, 2, "#ffd27a"); }
    T.rect(k, 0, 96, W, 84, (x, y) => rampa(["#eef3fa", "#dde6f1", "#c8d4e6", "#aebcd4"], 0.15 + ((y - 96) / 84) * 0.25 + (fbm(x * 0.05, y * 0.2, s) - 0.5) * 0.3, x, y));
    rellena(k, [[140, 100], [180, 100], [250, 180], [70, 180]], (x, y) => rampa(["#c8bca8", "#b0a490", "#988c78"], 0.2 + (hash(x, y, s) - 0.5) * 0.4, x, y));
    const cenador = (x, b, w, h, i) => {
      for (let a = Math.PI; a <= Math.PI * 2; a += 0.04) { const px = x + Math.cos(a) * w / 2, py = b - h + Math.sin(a) * h * 0.6; bola(k, px, py, 3, 3, (qx, qy) => rampa(["#4a7a4a", "#3a6a3e", "#2a5a32"], 0.2 + hash(qx, qy, s + i) * 0.5, qx, qy)); }
      [[x - w / 2, 1], [x + w / 2, -1]].forEach(([px]) => T.rect(k, px - 3, b - h, 6, h, (qx, qy) => rampa(["#4a7a4a", "#3a6a3e", "#2a5a32"], 0.2 + hash(qx, qy, s + i) * 0.5, qx, qy)));
      for (let j = 0; j < 56; j++) { const a = Math.PI + hash(j, 1, s + i) * Math.PI, px = x + Math.cos(a) * w / 2 + (hash(j, 2, s) - 0.5) * 6, py = b - h + Math.sin(a) * h * 0.6 + (hash(j, 3, s) - 0.5) * 6; k.R(px, py, 2, 2, ["#e8406a", "#ff7a9a", "#c82a4a", "#ffffff"][j % 4]); }
      for (let j = 0; j < 20; j++) { const lado = j % 2 ? x - w / 2 : x + w / 2; k.R(lado - 2 + hash(j, 6, s + i) * 4, b - h + hash(j, 7, s + i) * h, 2, 2, ["#e8406a", "#ff7a9a"][j % 2]); }
      for (let j = 0; j < 14; j++) k.crudo(x - w / 2 + hash(j, 4, s + i) * w, b - h * 1.4 + hash(j, 5, s + i) * h * 1.2, 1, 1, ["#fff4a0", "#a0ffe0", "#ffb0f0"][j % 3]);
      L.push({ x, y: b - h, r: w * 0.9, ry: h * 0.9, col: "#ffe8b0", f: 0.5 });
    };
    cenador(52, 140, 40, 40, 0); cenador(268, 140, 40, 40, 1); cenador(100, 112, 26, 26, 2); cenador(220, 112, 26, 26, 3);
    const pie = (x, b) => { T.rect(k, x - 8, b - 6, 16, 6, () => "#9a948c"); };
    pie(160, 124); bola(k, 160, 118, 9, 3, () => "#b8d0e8"); trazo(k, [[160, 116], [160, 104]], "#e8f4ff", 1); k.alfa(0.6, () => { for (let i = 0; i < 8; i++) k.P(160 + Math.sin(i) * i * 0.6, 104 + i * 1.5, "#ffffff"); });
    nieve(k, 60, s, 140);
    luces(k, L);
  }

  function concierto(k) {
    const L = [], s = 3951;
    techoNoche(k, [[0, 0], [W, 0], [W, 50], [0, 50]], s);
    T.rect(k, 0, 44, W, 74, escarcha(s, 44, 74));
    carambanos(k, 0, W, 46, s, 8);
    T.rect(k, 60, 72, 200, 34, (x, y) => rampa(["#2a2234", "#221c2c", "#1a1622", "#121018"], 0.2 + ((y - 72) / 34) * 0.5, x, y));
    k.R(56, 104, 208, 6, "#3a3448"); k.R(56, 104, 208, 1, "#8a84a0");
    [[72, 84], [236, 84]].forEach(([x, y]) => { T.rect(k, x - 10, y, 20, 20, () => "#1a1a20"); bola(k, x, y + 7, 5, 5, () => "#3a3a44"); bola(k, x, y + 15, 3, 3, () => "#3a3a44"); });
    bola(k, 160, 92, 10, 5, () => "#c8302a"); bola(k, 160, 92, 7, 3, () => "#e8e4dc"); k.R(146, 86, 6, 1, ORO[1]); k.R(168, 86, 6, 1, ORO[1]);
    [[120, 104, "#3a2a40"], [196, 104, "#2a3a40"], [140, 104, "#402a2a"], [180, 104, "#2a2a40"]].forEach(([x, b, c], i) => { rellena(k, [[x - 4, b], [x - 3, b - 18], [x + 3, b - 18], [x + 4, b]], () => c); bola(k, x, b - 21, 3, 3, () => "#e0b898"); bola(k, x, b - 22, 4, 4, (px, py) => (py > b - 21 ? null : "#1a1418")); trazo(k, [[x - 5, b - 10], [x + 6, b - 14]], i % 2 ? "#8a5a32" : "#c8302a", 2); });
    rayos(k, [[90, 46, 120, 104, 3, 30], [160, 46, 160, 104, 3, 30], [230, 46, 196, 104, 3, 30]], "#c8a0ff", 0.35);
    rayos(k, [[124, 46, 140, 104, 2, 20], [196, 46, 180, 104, 2, 20]], "#5ae8c8", 0.3);
    [[90, 46, "#c8a0ff"], [124, 46, "#5ae8c8"], [160, 46, "#c8a0ff"], [196, 46, "#5ae8c8"], [230, 46, "#c8a0ff"]].forEach(([x, y, c]) => { k.R(x - 3, y - 4, 6, 4, "#2a2a30"); k.crudo(x - 2, y, 4, 2, c); });
    pista(k, 110, 62, s);
    for (let i = 0; i < 9; i++) { const x = 72 + i * 22 + hash(i, 1, s) * 8, b = 120 + (i % 2) * 3, h = 16 + hash(i, 2, s) * 4; rellena(k, [[x - h * 0.22, b], [x - h * 0.12, b - h * 0.7], [x + h * 0.12, b - h * 0.7], [x + h * 0.22, b]], () => ["#22283a", "#3a2a40", "#2a3a2e", "#402a2a"][i % 4]); bola(k, x, b - h * 0.8, h * 0.1, h * 0.11, () => "#2a2024"); if (i % 3 === 0) trazo(k, [[x + 2, b - h * 0.7], [x + 5, b - h * 1.05]], "#2a2024", 1); }
    L.push({ x: 160, y: 90, r: 110, ry: 50, col: "#c8a0ff", f: 0.5 });
    nieve(k, 70, s, 104);
    luces(k, L);
  }

  const BAILE = [frente, vals, mesitas, entrada, jardin, concierto];
  const NOMBRES = ["De frente, con más detalle", "El vals de los campeones", "Las mesitas con sus farolillos", "La entrada al Gran Comedor", "Los rosales encantados del jardín", "El concierto de las Brujas de Macbeth"];
  MAG[39] = (n) => ["El Baile de Navidad", NOMBRES[Math.min(n, 6) - 1], (k) => BAILE[Math.min(n, 6) - 1](k), AJ];
})();

(function () {
  const { rampa, rellena, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, luces, sombraE, suelo3d, espejo, bruma, rayos } = Det6;
  const T = window.P15, W = 320, H = 180;
  window.SitiosIt29 = window.SitiosIt29 || {};
  const MAG = (window.SitiosIt29.magos = window.SitiosIt29.magos || {});
  const AZU = ["#eef4f0", "#dce8e2", "#c8d8d0", "#b0c4ba", "#98aca2"], VERDE = ["#5a9a82", "#4a8a72", "#3a7862", "#2c6452", "#205040"];
  const PIEDRA = ["#e8e4dc", "#d4d0c8", "#bcb8b0", "#a4a098", "#8c8880"], COBRE = ["#e8a878", "#c8845a", "#a8683e", "#86502c"];
  const MAD = ["#9a7a58", "#866848", "#72583a", "#5e482e", "#4a3822"];
  const FANTASMA = ["#f0fcff", "#d8f4fa", "#bce8f2", "#a0d8e8"];

  function azulejos(k, x0, y0, x1, y1, s, { cenefa = null } = {}) {
    T.rect(k, x0, y0, x1 - x0, y1 - y0, (x, y) => {
      const u = (x - x0) % 8, v = (y - y0) % 8, tx = Math.floor((x - x0) / 8), ty = Math.floor((y - y0) / 8);
      if (u === 0 || v === 0) return "#8a9a92";
      const verde = cenefa && y >= cenefa[0] && y < cenefa[1];
      const roto = hash(tx, ty, s) > 0.965 && (u + v) % 5 === 0;
      return rampa(verde ? VERDE : AZU, 0.12 + (u === 1 || v === 1 ? -0.1 : 0) + (u === 6 && v === 2 ? -0.2 : 0) + (hash(tx, ty, s) - 0.5) * 0.18 + ((y - y0) / (y1 - y0)) * 0.12 + (roto ? 0.4 : 0), x, y);
    });
  }
  function ventana(k, cx, top, w, h) {
    bola(k, cx, top + w / 2, w / 2 + 3, w / 2 + 3, (x, y) => (y > top + w / 2 ? null : "#4a5a52")); T.rect(k, cx - w / 2 - 3, top + w / 2, w + 6, h - w / 2 + 3, () => "#4a5a52");
    bola(k, cx, top + w / 2, w / 2, w / 2, (x, y) => (y > top + w / 2 ? null : "#7fb0d8")); T.rect(k, cx - w / 2, top + w / 2, w, h - w / 2, () => "#7fb0d8");
    for (let x = cx - w / 2 + 6; x < cx + w / 2; x += 6) k.R(x, top + 2, 1, h - 2, "#4a5a52"); for (let y = top + w / 2; y < top + h; y += 8) k.R(cx - w / 2, y, w, 1, "#4a5a52");
    k.alfa(0.25, () => trazo(k, [[cx - w / 2 + 2, top + h - 4], [cx + w / 4, top + w / 2]], "#ffffff", 1));
  }
  function cubiculo(k, x, b, w, h, s, { abierta = false, cartel = false } = {}) {
    T.rect(k, x, b - h, w, h, () => "#3a2a1c");
    if (abierta) {
      T.rect(k, x + 2, b - h + 2, w - 4, h - 2, (px, py) => rampa(["#4a5a52", "#3a4842", "#2c3832"], 0.2 + ((py - b + h) / h) * 0.6, px, py));
      bola(k, x + w / 2, b - 8, 7, 4, () => "#e8ecea"); T.rect(k, x + w / 2 - 5, b - 20, 10, 10, () => "#dce4e0"); k.R(x + w / 2 - 6, b - 21, 12, 2, "#c8d0cc");
      rellena(k, [[x + w - 2, b - h + 2], [x + w + 8, b - h + 6], [x + w + 8, b - 6], [x + w - 2, b - 4]], madera(MAD, { paso: 3, vertical: true, largo: 99, s }));
    } else {
      T.rect(k, x + 2, b - h + 4, w - 4, h - 10, madera(MAD, { paso: 3, vertical: true, largo: 99, s }));
      k.R(x + 3, b - h + 10, 2, 3, "#c8c8d0"); k.R(x + 3, b - 14, 2, 3, "#c8c8d0"); k.R(x + w - 6, b - h * 0.55, 3, 2, "#c8c8d0");
      k.alfa(0.5, () => k.R(x + 2, b - 6, w - 4, 6, "#1a1410"));
    }
    if (cartel) { const cx = Math.round(x + w / 2); k.R(cx - 17, b - h + 14, 35, 9, "#f4ecd8"); k.R(cx - 17, b - h + 14, 35, 1, "#c8b898"); k.R(cx - 17, b - h + 22, 35, 1, "#a89878"); rotulo(k, cx - 15, b - h + 16, "AVERIADO", "#8a2a2a"); }
  }
  function lavabos(k, cx, b, e, s, { abierto = false } = {}) {
    const E = (v) => v * e;
    if (abierto) {
      bola(k, cx, b - E(4), E(26), E(9), () => "#1a1c1c"); bola(k, cx, b - E(4), E(22), E(7), (x, y) => rampa(["#2a3430", "#1a2220", "#0c1210"], 0.2 + ((y - b + E(11)) / E(14)) * 0.7, x, y));
      for (let a = 0; a < Math.PI * 2; a += 0.1) k.P(cx + Math.cos(a) * E(23), b - E(4) + Math.sin(a) * E(8), "#4a5a52");
      [[-1], [1]].forEach(([d]) => { T.rect(k, cx + d * E(34) - E(9), b - E(46), E(18), E(42), (x, y) => rampa(PIEDRA, 0.15 + ((x - cx - d * E(34) + E(9)) / E(18)) * 0.5, x, y)); bola(k, cx + d * E(34), b - E(30), E(10), E(4), (x, y) => rampa(["#ffffff", "#f0f0ec", "#d8d8d4"], (x - cx - d * E(34) + E(10)) / E(20), x, y)); k.R(cx + d * E(34) - 1, b - E(40), 2, E(7), COBRE[1]); });
      k.crudo(cx - 1, b - E(8), 3, 3, "#3ac85a"); L0.push({ x: cx, y: b - E(6), r: E(30), ry: E(14), col: "#3ac85a", f: 0.4 });
      return;
    }
    T.rect(k, cx - E(28), b - E(58), E(56), E(58), (x, y) => rampa(PIEDRA, 0.12 + ((x - cx + E(28)) / E(56)) * 0.5 + (hash(x >> 1, y >> 1, s) - 0.5) * 0.08, x, y));
    k.R(cx - E(30), b - E(60), E(60), Math.max(1, E(3)), PIEDRA[0]); k.R(cx - E(28), b - E(2), E(56), Math.max(1, E(2)), PIEDRA[4]);
    [[-18], [0], [18]].forEach(([d]) => { T.rect(k, cx + E(d) - E(7), b - E(56), E(14), E(16), () => "#7a8a84"); T.rect(k, cx + E(d) - E(6), b - E(55), E(12), E(14), (x, y) => rampa(["#d8e4e8", "#bccad0", "#a0b0b8"], 0.2 + ((x - cx - E(d)) / E(12)) * 0.5 + (fbm(x * 0.4, y * 0.4, s) > 0.6 ? 0.2 : 0), x, y)); });
    [[-22, 36], [0, 34], [22, 36]].forEach(([d, h]) => { bola(k, cx + E(d), b - E(h), E(11), E(4), (x, y) => rampa(["#ffffff", "#f0f0ec", "#d8d8d4", "#c0c0bc"], (x - cx - E(d) + E(11)) / E(22), x, y)); bola(k, cx + E(d), b - E(h) - 1, E(8), E(2), () => "#a8b8c0"); k.R(cx + E(d) - 1, b - E(h) - E(9), 2, E(6), COBRE[1]); k.R(cx + E(d) - 1, b - E(h) - E(9), E(5), 2, COBRE[0]); });
    trazo(k, [[cx - E(2), b - E(48)], [cx, b - E(46)], [cx - E(2), b - E(44)], [cx, b - E(42)]], "#3a8a4a", 1); k.P(cx + 1, b - E(48), "#3a8a4a");
  }
  let L0 = [];
  function nyrtle(k, x, y, e = 1, llora = false) {
    const E = (v) => v * e;
    k.alfa(0.55, () => {
      rellena(k, [[x - E(7), y + E(6)], [x + E(7), y + E(6)], [x + E(10), y + E(30)], [x + E(4), y + E(26)], [x, y + E(32)], [x - E(5), y + E(27)], [x - E(10), y + E(30)]], (px, py) => rampa(FANTASMA, 0.1 + ((py - y) / E(30)) * 0.6, px, py));
      bola(k, x, y, E(6), E(7), () => FANTASMA[0]);
      [[-1], [1]].forEach(([d]) => { bola(k, x + d * E(8), y + E(2), E(2), E(4), () => FANTASMA[1]); });
    });
    k.alfa(0.75, () => { [[-3], [3]].forEach(([d]) => { for (let a = 0; a < 6.28; a += 0.5) k.P(x + E(d) + Math.cos(a) * E(2.2), y + Math.sin(a) * E(2.2), "#6a8a92"); }); k.R(x - E(1), y, E(2), 1, "#6a8a92"); });
    if (llora) k.alfa(0.7, () => { [[-3], [3]].forEach(([d]) => { for (let i = 0; i < 4; i++) k.P(x + E(d), y + E(3) + i * 2, "#c8f0ff"); }); });
  }
  function sueloMojado(k, y0, fy, s, charcos) {
    suelo3d(k, y0, H, 160, fy, (X, z, x, y) => (Math.floor(X / 14 + 100) % 2 === Math.floor(z * 5) % 2 ? rampa(AZU, 0.25 + (hash(x, y, s) - 0.5) * 0.1, x, y) : rampa(["#9aaca4", "#8a9a92", "#7a8a82"], 0.3 + (hash(x, y, s) - 0.5) * 0.1, x, y)));
    charcos.forEach(([x, y, rx, ry], i) => espejo(k, y0, y - ry, y + ry, { x0: x - rx, x1: x + rx, tinte: "#9ac0d8", mezcla: 0.35, onda: 1, oscuro: 0.85, crestas: 0.08, s: s + i, dentro: (px, py) => Math.hypot((px - x) / rx, (py - y) / ry) < 1 }));
  }
  const AJ = { cielo: "propio", fuerza: 0.25, ventanal: "#7fb0d8", fuego: ["#3ac85a"] };

  function frente(k) {
    const s = 3601; L0 = [];
    azulejos(k, 0, 0, W, 126, s, { cenefa: [56, 64] });
    ventana(k, 160, 6, 40, 44);
    rayos(k, [[150, 40, 140, 126, 10, 40], [172, 40, 186, 126, 8, 32]], "#e8f4ff", 0.18);
    [0, 30, 60].forEach((x, i) => cubiculo(k, x, 126, 30, 76, s + i, { abierta: i === 1 }));
    [230, 260, 290].forEach((x, i) => cubiculo(k, x, 126, 30, 76, s + 3 + i, { cartel: i === 0 }));
    sueloMojado(k, 126, 60, s, [[118, 150, 30, 5], [214, 164, 36, 6], [70, 172, 24, 4]]);
    lavabos(k, 160, 128, 1, s);
    nyrtle(k, 236, 40, 1.1);
    luces(k, L0);
  }

  function camara(k) {
    const s = 3611; L0 = [];
    azulejos(k, 0, 0, W, 126, s, { cenefa: [56, 64] });
    ventana(k, 160, 6, 40, 44);
    [0, 30, 60].forEach((x, i) => cubiculo(k, x, 126, 30, 76, s + i));
    [230, 260, 290].forEach((x, i) => cubiculo(k, x, 126, 30, 76, s + 3 + i, { abierta: i === 1 }));
    sueloMojado(k, 126, 60, s, [[96, 168, 26, 4], [230, 170, 30, 5]]);
    lavabos(k, 160, 140, 1, s, { abierto: true });
    k.alfa(0.5, () => { for (let i = 0; i < 18; i++) bola(k, 160 + (hash(i, 1, s) - 0.5) * 50, 140 + (hash(i, 2, s) - 0.5) * 12, 2 + hash(i, 3, s) * 3, 1, () => "#3a6a4a"); });
    nyrtle(k, 60, 42, 1.0);
    luces(k, L0);
  }

  function inundado(k) {
    const s = 3621; L0 = [];
    azulejos(k, 0, 0, W, 120, s, { cenefa: [50, 58] });
    ventana(k, 286, 8, 28, 40); ventana(k, 34, 8, 28, 40);
    for (let i = 0; i < 8; i++) cubiculo(k, 4 + i * 26, 120, 26, 70, s + i, { abierta: i === 3, cartel: i === 3 });
    lavabos(k, 270, 122, 0.8, s);
    suelo3d(k, 120, H, 160, 50, (X, z, x, y) => (Math.floor(X / 14 + 100) % 2 === Math.floor(z * 5) % 2 ? AZU[2] : "#8a9a92"));
    espejo(k, 120, 120, H, { tinte: "#7ab0d0", mezcla: 0.38, onda: 1.5, oscuro: 0.86, crestas: 0.1, s });
    k.alfa(0.4, () => { for (let i = 0; i < 14; i++) trazo(k, [[86 + hash(i, 1, s) * 16, 120 + i * 4], [96 + hash(i, 2, s) * 30, 124 + i * 4]], "#e8f8ff", 1); });
    nyrtle(k, 96, 70, 1.0, true);
    luces(k, L0);
  }

  const BANO = [frente, camara, inundado];
  const NOMBRES = ["De frente, con más detalle", "La entrada a la Cámara", "El baño inundado"];
  MAG[36] = (n) => ["El baño de Nyrtle", NOMBRES[Math.min(n, 3) - 1], (k) => BANO[Math.min(n, 3) - 1](k), AJ];
})();

(function () {
  const { rampa, rellena, nubarron, montana, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, bezier, madera, luces, sombraE, suelo3d, tablones, bruma, rayos, encendido } = Det6;
  const T = window.P15, P = window.OP14P, W = 320, H = 180;
  window.SitiosIt29 = window.SitiosIt29 || {};
  const MAG = (window.SitiosIt29.magos = window.SitiosIt29.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const TABLA = ["#9a8a7a", "#847464", "#6e6052", "#5a4e42", "#463c32"], TEJA = ["#6a5a52", "#5a4a44", "#4a3c38", "#3a2e2c"];
  const PAPEL = ["#8a7a5a", "#7a6a4c", "#6a5a40", "#5a4c36", "#4a3e2c"], POLVO = "#c8bca0";
  const gira = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
  const VEN = ["#ffd27a"];

  function tapiada(k, pts, s, luz = false) {
    k.poli(pts, "#1c1614");
    const [p0, p1, p2, p3] = pts;
    trazo(k, [p0, p2], "#a08a6a", 2); trazo(k, [p1, p3], "#a08a6a", 2);
    trazo(k, [[(p0[0] + p3[0]) / 2, (p0[1] + p3[1]) / 2], [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2]], "#8a7458", 2);
    if (luz) k.alfa(0.5, () => { k.R(Math.min(p0[0], p3[0]) + 2, Math.min(p0[1], p1[1]) + 2, 2, 2, "#ffe8b0"); k.R(Math.max(p1[0], p2[0]) - 4, Math.max(p2[1], p3[1]) - 4, 2, 2, "#ffe8b0"); });
  }
  const cuervos = (k, lista) => lista.forEach(([x, y]) => trazo(k, [[x - 4, y - 2], [x, y], [x + 4, y - 2]], "#1c1614", 1));
  function telarana(k, x, y, r, d = 1) { for (let a = 0; a <= Math.PI / 2; a += Math.PI / 8) trazo(k, [[x, y], [x + d * Math.cos(a) * r, y + Math.sin(a) * r]], "#c8c0b0", 1); for (let q = r / 4; q < r; q += r / 4) for (let a = 0; a <= Math.PI / 2; a += 0.08) k.P(x + d * Math.cos(a) * q, y + Math.sin(a) * q, "#b0a898"); }
  const motas = (k, x0, y0, w, h, n, s) => { for (let i = 0; i < n; i++) k.crudo(x0 + hash(i, 1, s) * w, y0 + hash(i, 2, s) * h, 1, 1, "#fff4d8"); };

  function colina(k) {
    const s = 1801, lit = encendido(k), vs = [];
    k.banda(CIELO, 0, 112);
    nubarron(k, 30, 22, 90, 12, ["#e8e4e8", "#ccc6d0", "#aaa4b4"]); nubarron(k, 240, 14, 70, 10, ["#e8e4e8", "#ccc6d0", "#aaa4b4"]);
    montana(k, 60, 112, 180, 46, { roca: ["#8a8aa0", "#7a7a92", "#6a6a84", "#5c5c76"] }); montana(k, 280, 112, 160, 38, { roca: ["#8a8aa0", "#7a7a92", "#6a6a84", "#5c5c76"] });
    for (let i = 0; i < 10; i++) { const x = 4 + i * 12, b2 = 114 + (i % 3), h = 8 + (i % 3) * 2; T.rect(k, x, b2 - h, 10, h, () => (i % 2 ? "#c8b8a0" : "#b8a88c")); rellena(k, [[x - 1, b2 - h], [x + 5, b2 - h - 5], [x + 11, b2 - h]], () => (i % 2 ? "#6a5a5a" : "#5a4a4a")); k.R(x + 3, b2 - h + 3, 2, 2, "#ffd27a"); vs.push([x + 4, b2 - h + 4]); }
    rellena(k, [[-4, 180], [-4, 130], [60, 120], [130, 98], [200, 96], [270, 112], [324, 124], [324, 180]], (x, y) => rampa(["#b8a878", "#a09064", "#887a52", "#706442", "#5a5034"], 0.1 + ((y - 96) / 84) * 0.5 + (fbm(x * 0.08, y * 0.1, s) - 0.5) * 0.35, x, y));
    for (let i = 0; i < 60; i++) { const x = hash(i, 1, s) * W, y = 116 + hash(i, 2, s) * 60; trazo(k, [[x, y], [x + (hash(i, 3, s) - 0.5) * 3, y - 3 - hash(i, 4, s) * 3]], i % 2 ? "#8a7a4a" : "#c8b880", 1); }
    const cx = 176, b = 102, a = -0.07, gr = (pts) => gira(pts, cx, b, a);
    rellena(k, gr([[cx - 50, b], [cx - 50, b - 40], [cx + 46, b - 40], [cx + 46, b]]), (x, y) => rampa(TABLA, 0.12 + ((x - cx + 50) / 96) * 0.4 + (Math.floor(x / 4) % 2 ? 0.08 : 0) + (hash(Math.floor(x / 4), Math.floor(y / 9), s) - 0.5) * 0.25 + (fbm(x * 0.3, y * 0.3, s) > 0.7 ? 0.2 : 0), x, y));
    for (let y = b - 36; y < b; y += 6) trazo(k, gr([[cx - 50, y], [cx + 46, y]]), "#3a3028", 1);
    rellena(k, gr([[cx - 58, b - 39], [cx - 36, b - 70], [cx + 28, b - 72], [cx + 54, b - 39]]), (x, y) => rampa(TEJA, 0.12 + ((y - b + 72) / 33) * 0.4 + (Math.floor(x / 3 + y / 2) % 3 === 0 ? 0.12 : 0), x, y));
    k.poli(gr([[cx - 10, b - 60], [cx + 4, b - 64], [cx + 8, b - 52], [cx - 8, b - 50]]), "#1c1614"); trazo(k, gr([[cx - 10, b - 60], [cx + 2, b - 56]]), "#5a4a40", 1);
    rellena(k, gr([[cx + 20, b - 68], [cx + 18, b - 86], [cx + 29, b - 89], [cx + 30, b - 74]]), Det6.ladrillo(["#8a6a5a", "#74584a", "#5e463a", "#46342a"], { w: 3, h: 2, s }));
    [[cx - 40, b - 32], [cx - 8, b - 32], [cx + 24, b - 32], [cx - 40, b - 16], [cx + 24, b - 16]].forEach(([x, y], i) => tapiada(k, gr([[x, y], [x + 13, y], [x + 13, y + 11], [x, y + 11]]), s + i));
    rellena(k, gr([[cx - 46, b - 32], [cx - 42, b - 32], [cx - 44, b - 20], [cx - 48, b - 21]]), () => "#5a4a3c");
    const pu = gr([[cx - 20, b], [cx - 20, b - 20], [cx - 9, b - 20], [cx - 9, b]]); k.poli(pu, "#2a201a"); trazo(k, [pu[1], pu[3]], "#8a7458", 2);
    rellena(k, gr([[cx - 30, b - 22], [cx + 2, b - 22], [cx + 6, b - 18], [cx - 34, b - 18]]), () => "#6a5a4a"); trazo(k, gr([[cx - 30, b - 18], [cx - 30, b]]), "#4a3c30", 1); trazo(k, gr([[cx + 4, b - 18], [cx + 8, b - 2]]), "#4a3c30", 1);
    k.R(cx - 54, b - 2, 102, 3, "#3a3028");
    [[44, 134, 1], [276, 128, -1], [118, 112, 1]].forEach(([x, b2, sg], i) => { const pts = [[x, b2], [x + sg * 4, b2 - 22], [x - sg * 2, b2 - 38], [x + sg * 6, b2 - 58]]; trazo(k, bezier(...pts, 20), "#3a2e26", 4 - (i > 1 ? 2 : 0), 1); [[0.4, -1], [0.6, 1], [0.8, -1], [0.95, 1]].forEach(([t, d]) => { const [px, py] = bezier(...pts, 20)[Math.round(t * 20)]; trazo(k, [[px, py], [px + d * 10, py - 8], [px + d * 16, py - 6]], "#3a2e26", 2, 1); }); });
    for (let x = 80; x < 240; x += 14) { const y = 128 - Math.abs(x - 160) * 0.06; trazo(k, [[x, y + 12], [x + ((x / 14) % 3 === 0 ? 2 : 0), y]], "#5a4636", 2); }
    trazo(k, [[80, 126], [240, 126]], "#6a5444", 1); trazo(k, [[80, 132], [180, 130]], "#6a5444", 1);
    k.R(98, 104, 2, 22, "#5a4636"); k.R(84, 96, 33, 10, "#7a6046"); k.R(84, 96, 33, 1, "#9a7a5a"); k.R(84, 105, 33, 1, "#4a3828"); rotulo(k, 87, 99, "PELIGRO", "#2a2018");
    cuervos(k, [[60, 30], [84, 22], [230, 18], [250, 26], [cx - 28, b - 76]]);
    bruma(k, 96, 140, "#d8d4cc", 0.3, { s });
    luces(k, vs.map(([x, y]) => ({ x, y, r: 6, col: "#ffd27a", f: lit * 0.7 })));
  }

  function dormitorio(k) {
    const s = 1811, L = [];
    T.rect(k, 0, 0, W, 132, (x, y) => { const u = Math.floor(x / 9), raya = (x % 9) < 1, roto = fbm(x * 0.06, y * 0.05, s) > 0.62; return roto ? rampa(TABLA, 0.3 + (Math.floor(x / 4) % 2 ? 0.1 : 0) + (hash(u, y >> 3, s) - 0.5) * 0.2, x, y) : rampa(PAPEL, 0.25 + (raya ? 0.2 : 0) + ((x % 9) === 4 && (y % 6) < 2 ? -0.15 : 0) + (y / 132) * 0.2, x, y); });
    T.rect(k, 0, 0, W, 14, madera(["#5a4a3c", "#4a3c30", "#3a2e24", "#2c221a", "#1e1610"], { paso: 4, largo: 80, s }));
    [40, 120, 200, 280].forEach((x) => { k.R(x, 14, 6, 4, "#3a2e24"); });
    [[30, 60], [250, 40], [150, 30]].forEach(([x, y], i) => { for (let j = 0; j < 4; j++) trazo(k, [[x + j * 3, y], [x + j * 3 + 4, y + 18]], "#2a201a", 1); });
    telarana(k, 0, 14, 22, 1); telarana(k, W - 1, 14, 22, -1);
    T.rect(k, 238, 34, 44, 54, () => "#1c1614");
    for (let i = 0; i < 5; i++) { const y = 38 + i * 10; T.rect(k, 236, y, 48, 6, madera(TABLA, { paso: 2, largo: 99, s: s + i })); k.alfa(0.7, () => k.R(240, y + 6, 40, 1, "#ffe8b0")); }
    rayos(k, [[260, 50, 190, 150, 30, 70]], "#ffe8b0", 0.22);
    const bx = 120, bb = 132;
    [bx - 46, bx + 46].forEach((x, i) => { T.rect(k, x - 3, bb - 92, 6, 92, madera(["#6a4a30", "#5a3e28", "#4a3220", "#3a2618", "#2a1a10"], { paso: 2, vertical: true, largo: 99, s: s + 10 + i })); });
    rellena(k, [[bx - 50, bb - 92], [bx + 50, bb - 88], [bx + 50, bb - 82], [bx - 50, bb - 86]], () => "#3a2618");
    [[bx - 44, -1], [bx + 44, 1]].forEach(([x, d], i) => { for (let j = 0; j < 7; j++) { const px = x + d * j * 2, l = 30 + hash(j, i, s) * 40; rellena(k, [[px, bb - 86], [px + 2, bb - 86], [px + 1 + Math.sin(j) * 2, bb - 86 + l]], () => (j % 2 ? "#7a2a34" : "#5a1a24")); } });
    T.rect(k, bx - 44, bb - 36, 88, 20, (x, y) => rampa(["#d8ccb4", "#c4b89e", "#a89c84", "#8c806a"], 0.2 + ((y - bb + 36) / 20) * 0.5 + (fbm(x * 0.2, y * 0.3, s) > 0.65 ? 0.3 : 0), x, y));
    for (let i = 0; i < 10; i++) bola(k, bx - 36 + hash(i, 1, s) * 72, bb - 36 + hash(i, 2, s) * 6, 2, 1.5, () => "#f0e8d8");
    T.rect(k, bx - 46, bb - 16, 92, 16, madera(["#6a4a30", "#5a3e28", "#4a3220", "#3a2618", "#2a1a10"], { paso: 3, largo: 99, s: s + 12 }));
    trazo(k, [[40, 132], [46, 112]], "#5a3e28", 2); trazo(k, [[52, 132], [50, 118]], "#5a3e28", 2); rellena(k, [[38, 118], [56, 116], [56, 120], [38, 122]], () => "#6a4a30");
    rellena(k, gira([[196, 40], [222, 40], [222, 64], [196, 64]], 209, 52, 0.12), () => "#8a6a3a"); rellena(k, gira([[199, 43], [219, 43], [219, 61], [199, 61]], 209, 52, 0.12), () => "#3a3a2e");
    suelo3d(k, 132, H, 160, 70, tablones(["#7a6a56", "#685a48", "#56483a", "#44382c", "#322a20"], { pw: 12, L: 60, s }));
    k.alfa(0.35, () => { for (let i = 0; i < 40; i++) bola(k, hash(i, 1, s) * W, 136 + hash(i, 2, s) * 44, 6 + hash(i, 3, s) * 10, 1.5, () => POLVO); });
    k.alfa(0.5, () => { for (let i = 0; i < 8; i++) k.R(150 + i * 9 + (i % 2) * 3, 176 - i * 5, 3, 2, "#3a2e24"); });
    motas(k, 190, 60, 90, 90, 40, s);
    luces(k, [{ x: 220, y: 120, r: 80, ry: 50, col: "#ffe8b0", f: 0.35 }]);
  }

  function planta(k) {
    const s = 1821;
    T.rect(k, 0, 0, W, 132, (x, y) => { const roto = fbm(x * 0.05, y * 0.06, s) > 0.6; return roto ? rampa(TABLA, 0.3 + (Math.floor(x / 4) % 2 ? 0.1 : 0), x, y) : rampa(["#6a7a6a", "#5a6a5a", "#4a5a4c", "#3c4a3e", "#2e3a30"], 0.25 + ((x % 11) < 1 ? 0.2 : 0) + (y / 132) * 0.25, x, y); });
    T.rect(k, 0, 0, W, 12, madera(["#5a4a3c", "#4a3c30", "#3a2e24", "#2c221a", "#1e1610"], { paso: 4, largo: 80, s }));
    telarana(k, 0, 12, 20, 1);
    for (let i = 0; i < 9; i++) { const x = 226 + i * 10, y = 132 - i * 12; T.rect(k, x, y, W - x, 12, madera(["#7a6a56", "#685a48", "#56483a", "#44382c", "#322a20"], { paso: 3, largo: 40, s: s + i })); k.R(x, y, W - x, 1, "#9a8a72"); if (i === 3) k.R(x + 6, y + 2, 10, 4, "#1c1614"); }
    trazo(k, [[222, 96], [300, 6]], "#4a3c30", 2); for (let i = 0; i < 6; i++) { const x = 228 + i * 13; if (i === 2) continue; k.R(x, 132 - i * 15 - 24, 2, 24, "#5a4a3c"); }
    [[30, 34], [84, 34]].forEach(([x, y], i) => tapiada(k, [[x, y], [x + 28, y], [x + 28, y + 36], [x, y + 36]], s + i, true));
    rellena(k, [[130, 132], [176, 120], [180, 126], [134, 138]], () => "#5a3e28"); trazo(k, [[150, 126], [146, 108]], "#4a3220", 2); trazo(k, [[168, 122], [170, 104]], "#4a3220", 2);
    T.rect(k, 180, 92, 40, 40, (x, y) => rampa(["#3a2a20", "#2e2018", "#221810"], 0.2 + (y - 92) / 60, x, y)); k.R(182, 106, 36, 3, "#e8e0d0"); for (let x = 184; x < 218; x += 3) k.R(x, 106, 1, 2, "#1a1410");
    suelo3d(k, 132, H, 160, 70, tablones(["#7a6a56", "#685a48", "#56483a", "#44382c", "#322a20"], { pw: 12, L: 60, s }));
    rellena(k, [[40, 150], [86, 150], [92, 166], [34, 166]], () => "#0c0a08"); rellena(k, [[40, 150], [86, 150], [82, 136], [44, 136]], madera(TABLA, { paso: 3, largo: 99, s }));
    for (let i = 0; i < 4; i++) k.R(46 + i * 10, 152 + i * 3, 6, 1, "#3a2e24");
    k.alfa(0.35, () => { for (let i = 0; i < 40; i++) bola(k, hash(i, 1, s) * W, 136 + hash(i, 2, s) * 44, 6 + hash(i, 3, s) * 10, 1.5, () => POLVO); });
    motas(k, 20, 30, 100, 100, 30, s);
    luces(k, [{ x: 60, y: 60, r: 60, ry: 50, col: "#ffe8b0", f: 0.3 }]);
  }

  const GRITOS = [colina, dormitorio, planta];
  const NOMBRES = ["La casa en la colina, con más detalle", "Por dentro: el dormitorio de arriba", "Por dentro: la planta baja"];
  MAG[18] = (n) => ["La Casa de los Gritos", NOMBRES[Math.min(n, 3) - 1], (k) => GRITOS[Math.min(n, 3) - 1](k), n === 1 ? { tinte: 0.15, dx: 80, ven: VEN } : { cielo: "propio", fuerza: 0.3, ventanal: "#7fb0d8" }];
})();

(function () {
  const { rampa, rellena, nubarron, montana, rotulo } = Det;
  const { bola, hash, trazo, bezier, corteza, sombraE, bruma, ladrillo } = Det6;
  const T = window.P15, Q = window.H17, W = 320;
  window.SitiosIt30 = window.SitiosIt30 || {};
  const MAG = (window.SitiosIt30.magos = window.SitiosIt30.magos || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const VERDES = ["#9ad070", "#84bc5c", "#70a84c", "#5c923e", "#4a7c32", "#386428"];
  const CORTEZA = ["#8a6a4e", "#74583e", "#5e4630", "#4a3624", "#36261a"];
  const HOJA = ["#b4de84", "#94c868", "#76b052", "#5a9442", "#447832"];
  const MUSGO = { umbral: 0.62, pal: ["#94b25a", "#7a9a48", "#62803a", "#4c662e"] };
  const MONTE = { roca: ["#8aa4c0", "#7a96b4", "#6a88a8", "#5c7a9c"] };
  const COLINA_LEJOS = ["#9cb894", "#88a682", "#769470"], COLINA = ["#7aa070", "#628a5c", "#4c744a", "#3e6440"];
  const HIERRO = "#2c4438", HIERRO_L = "#4e6e5c";
  const LADRILLO = ["#bc7450", "#a4623f", "#8c5233", "#744428"];
  const BARRO = ["#d8925e", "#bc6c40", "#9a5432", "#7a4026"];
  const gira = (pts, cx, cy, a) => pts.map(([x, y]) => [cx + (x - cx) * Math.cos(a) - (y - cy) * Math.sin(a), cy + (x - cx) * Math.sin(a) + (y - cy) * Math.cos(a)]);
  const conCoche = (k) => { const { h, d } = Det.cuando(k); return d !== 2 || h >= 11; };

  function fondo(k, s) {
    k.banda(CIELO, 0, 106);
    nubarron(k, 150 + (s % 5) * 3, 14, 76, 11); nubarron(k, 268, 30, 52, 8); nubarron(k, 18, 26, 44, 7);
    montana(k, 44, 104, 190, 46, MONTE); montana(k, 206, 104, 120, 24, MONTE); montana(k, 300, 104, 150, 36, MONTE);
  }
  function colina(k, s, { cx = 40, base = 90, e = 0.36, alta = 0, camino = false } = {}) {
    const A = alta;
    rellena(k, [[-4, 108], [-4, 94 - A], [20, 88 - A], [cx + 30, base - 2 - A * 0.3], [118, 94], [162, 108]], (x, y) => rampa(COLINA_LEJOS, 0.15 + ((y - 86 + A) / 22) * 0.5, x, y));
    Q.castillo(k, cx, base, e, { s });
    rellena(k, [[-4, 110], [-4, 98], [26, 95], [70, 97], [118, 100], [168, 104], [176, 110]], (x, y) => rampa(COLINA, 0.15 + ((y - 95) / 15) * 0.55, x, y));
    if (camino) trazo(k, bezier([cx + 4, base + 1], [cx + 26, base + 6], [cx - 6, 100], [cx + 30, 108], 22), (f, x, y) => rampa(["#d8c8a0", "#c4b088", "#ae9a72"], 0.2 + f * 0.4, x, y), 1, 3);
    [[4, 101, 13], [13, 100, 16], [22, 102, 11], [64, 102, 14], [74, 103, 17], [84, 104, 12], [126, 105, 12], [138, 106, 15]].forEach(([x, b, h]) => Q.pino(k, x, b, h));
    bruma(k, 82, 100, "#e4ecf0", 0.22, { s, x0: 0, x1: 150 });
  }
  function sotos(k, s) {
    for (let x = 150; x < 330; x += 7) { const h = 5 + hash(x, 1, s) * 6; bola(k, x, 104 - h * 0.4, 5 + hash(x, 2, s) * 2, h * 0.6, (px, py) => rampa(["#6c9a5a", "#5a864c", "#48723e"], 0.2 + ((py - 104 + h) / h) * 0.6, px, py)); }
  }
  function cesped(k, y0, s) {
    T.prado(k, y0, VERDES, s, { perfil: (x) => y0 + Math.sin(x / 30) * 2, flores: { n: 30, cols: ["#ffffff", "#f8e070", "#f4c8e0"] } });
    [[150, 160], [252, 170], [176, 172], [96, 168], [220, 150]].forEach(([x, y]) => trazo(k, [[x, y], [x + 10, y - 2], [x + 14, y - 5]], CORTEZA[2], 1));
    for (let i = 0; i < 26; i++) { const x = 30 + hash(i, 5, s) * 170, y = 150 + hash(i, 6, s) * 26; k.R(x, y, 2, 1, i % 3 ? HOJA[2] : "#c8b048"); }
  }

  function sauce(k, tx, tb, e, s, { furia = 1, rayas = true, libre = [], izq = 1 } = {}) {
    const E = (v) => v * e, F = furia, I = (v) => v * izq;
    sombraE(k, tx, tb, E(60), E(7), 0.42);
    [[-1, 34], [1, 38], [-1, 20], [1, 18], [-1, 48], [1, 52], [-1, 28], [1, 30]].forEach(([d, l], i) => {
      const pts = bezier([tx + d * E(8), tb - E(6)], [tx + d * E(l) * 0.4, tb - E(3)], [tx + d * E(l) * 0.8, tb + E(1)], [tx + d * E(l), tb + E(4 - (i % 3))], 16);
      trazo(k, pts, CORTEZA[3], Math.max(1, E(6 - (i > 3 ? 2 : 0))), 1); trazo(k, pts.map(([x, y]) => [x, y - 1]), CORTEZA[1], 1);
    });
    const tronco = [[tx - E(24), tb], [tx - E(15), tb - E(28)], [tx - E(20), tb - E(52)], [tx - E(10), tb - E(70)], [tx + E(10), tb - E(68)], [tx + E(17), tb - E(48)], [tx + E(14), tb - E(26)], [tx + E(26), tb]];
    rellena(k, tronco, corteza(CORTEZA, tx - E(24), E(50), { s, grieta: 0.64, musgo: MUSGO }));
    [[tx - E(7), tb - E(46), E(4)], [tx + E(7), tb - E(20), E(3)], [tx - E(4), tb - E(12), E(2)]].forEach(([x, y, r]) => { bola(k, x, y, r + 1, r + 1, () => CORTEZA[4]); bola(k, x, y, r, r * 0.8, () => CORTEZA[2]); k.P(x - 1, y - 1, CORTEZA[0]); });
    bola(k, tx + E(3), tb - E(33), E(5), E(8), () => CORTEZA[4]); bola(k, tx + E(3), tb - E(33), E(4), E(7), () => "#1a120c");
    for (let i = 0; i < 4; i++) trazo(k, bezier([tx - E(14) + i * E(8), tb - E(2)], [tx - E(4) + i * E(6), tb - E(24)], [tx - E(12) + i * E(5), tb - E(44)], [tx - E(4) + i * E(4), tb - E(64)], 18), CORTEZA[4], 1);
    const sube = (1 - izq) * E(26);
    const ramas = [[[tx - E(7), tb - E(66)], [tx - I(E(34)), tb - E(102) - F * E(6)], [tx - I(E(78)), tb - E(114)], [tx - I(E(112)), tb - E(100) + F * E(10)]],
      [[tx - E(11), tb - E(60)], [tx - I(E(44)), tb - E(70) - sube * 0.5], [tx - I(E(78)), tb - E(58) - sube], [tx - I(E(104)), tb - E(72) - F * E(6) - sube]],
      [[tx, tb - E(68)], [tx + E(6), tb - E(110)], [tx - E(14), tb - E(136)], [tx - E(2), tb - E(162)]],
      [[tx + E(7), tb - E(66)], [tx + E(38), tb - E(100) - F * E(6)], [tx + E(68), tb - E(114)], [tx + E(102), tb - E(106) + F * E(8)]],
      [[tx + E(11), tb - E(60)], [tx + E(50), tb - E(64)], [tx + E(84), tb - E(54)], [tx + E(114), tb - E(66) - F * E(6)]]];
    ramas.forEach((r, i) => {
      const pts = bezier(...r, 34);
      trazo(k, pts, CORTEZA[4], Math.max(2, E(10)), Math.max(1, E(2))); trazo(k, pts.map(([x, y]) => [x - 1, y - 1]), CORTEZA[1], Math.max(1, E(3)), 1);
      for (let j = 6; j < 32; j += 5) { const [x, y] = pts[j], d = (j + i) % 2 ? 1 : -1, l = E(8 + hash(i, j, s) * 8); trazo(k, [[x, y], [x + d * l * 0.6, y - l], [x + d * l, y - l * 0.8]], CORTEZA[3], Math.max(1, E(2)), 1); k.P(x + d * l, y - l * 0.8 - 1, CORTEZA[2]); }
    });
    const tapa = (x, y) => libre.some(([x0, x1, y0, y1]) => x >= x0 && x <= x1 && y >= y0 && y <= y1);
    ramas.forEach((r, i) => {
      const pts = bezier(...r, 34);
      for (let j = i === 2 ? 26 : 6; j < 34; j += 2) {
        const [x, y] = pts[j], l = E(10 + hash(i, j, s) * 24);
        if (tapa(x, y + l / 2)) continue;
        for (let t = 0; t < l; t++) {
          const px = x + Math.sin(t / 5 + i + j) * 2 + t * 0.08 * F * (i % 2 ? 1 : -1), py = y + 2 + t;
          k.P(px, py, rampa(HOJA, 0.12 + (t / l) * 0.55 + (hash(Math.round(px), Math.round(py), s) - 0.5) * 0.3, px, py));
          if (t % 2 === 0) k.P(px + ((j + t) % 4 < 2 ? 1 : -1), py, rampa(HOJA, 0.05 + (t / l) * 0.4, px, py));
        }
      }
    });
    if (rayas) k.alfa(0.42, () => ramas.forEach((r, i) => { if (i === 2) return; const [x, y] = r[3]; trazo(k, bezier([x, y], [x + (i % 2 ? 16 : -16), y - 12], [x + (i % 2 ? 26 : -26), y + 4], [x + (i % 2 ? 18 : -18), y + 20], 16), "#f4f8ec", 1); }));
    for (let i = 0; i < 44; i++) { const x = tx - E(120) + hash(i, 1, s) * E(260), y = tb - E(150) + hash(i, 2, s) * E(150); if (!tapa(x, y)) k.R(x, y, 2, 1, i % 4 ? HOJA[1] : "#c8b048"); }
    return ramas;
  }

  function coche(k, cx, cy, a, e = 1, { puerta = false } = {}) {
    const E = (v) => v * e, car = (pts) => gira(pts.map(([x, y]) => [cx + E(x), cy + E(y)]), cx, cy, a);
    const AZUL = ["#bfeaf2", "#9ad8e6", "#76c2d6", "#58a8c0", "#3e8aa4", "#2c6c84"];
    rellena(k, car([[-23, 6], [-24, 1], [-22, -3], [-19, -4], [-8, -3], [11, -3], [19, -2], [23, 0], [24, 4], [23, 6]]), (x, y) => { const [, v] = gira([[x, y]], cx, cy, -a)[0]; return rampa(AZUL, 0.1 + ((v - cy + E(4)) / E(10)) * 0.75, x, y); });
    rellena(k, car([[-7, -3], [-11, -12], [5, -12], [11, -3]]), (x, y) => rampa(AZUL, 0.05 + (hash(Math.round(x), Math.round(y), 3) - 0.5) * 0.1, x, y));
    rellena(k, car([[-10, -11], [-7, -4], [-2, -4], [-2, -11]]), () => "#dff2f8");
    rellena(k, car([[0, -11], [0, -4], [9, -4], [5, -11]]), () => "#e8f6fa");
    k.poli(car([[-11, -12], [-10, -12], [-6, -3], [-7, -3]]), AZUL[5]);
    k.poli(car([[-2, -11], [0, -11], [0, -4], [-2, -4]]), AZUL[4]);
    [[-6, -10], [3, -10]].forEach(([x, y]) => { const [p] = car([[x, y]]); k.P(p[0], p[1], "#ffffff"); k.P(p[0] + 1, p[1] + 1, "#ffffff"); });
    k.poli(car([[-23, 1], [23, 1], [23, 2], [-23, 2]]), "#e4ecf0");
    k.poli(car([[-1, -3], [0, -3], [0, 5], [-1, 5]]), AZUL[5]);
    k.poli(car([[2, -1], [4, -1], [4, 0], [2, 0]]), "#f4f8fa");
    k.poli(car([[22, 3], [26, 3], [26, 5], [22, 5]]), "#d8e2e8"); k.poli(car([[-26, 3], [-22, 3], [-22, 5], [-26, 5]]), "#d8e2e8");
    car([[-13, 6], [13, 6]]).forEach(([x, y]) => { bola(k, x, y - E(1), E(5), E(3.4), () => AZUL[5]); bola(k, x, y, E(4), E(4), () => "#1c1c22"); bola(k, x, y, E(1.8), E(1.8), () => "#c8ccd4"); k.P(x - 1, y - 1, "#ffffff"); });
    const [f] = car([[23, -1]]); bola(k, f[0], f[1], E(1.6), E(1.6), () => "#fff6c8");
    k.alfa(0.22, () => k.poli([[f[0], f[1]], [f[0] + E(34) * Math.cos(a - 0.45), f[1] + E(34) * Math.sin(a - 0.45)], [f[0] + E(38) * Math.cos(a + 0.25), f[1] + E(38) * Math.sin(a + 0.25)]], "#fff4c0"));
    const [p] = car([[-23, -1]]); k.R(p[0] - 1, p[1], 2, 2, "#e04030");
    if (puerta) { rellena(k, car([[0, -3], [11, -3], [13, 8], [3, 9]]), (x, y) => rampa(AZUL, 0.45 + (hash(Math.round(x), Math.round(y), 5) - 0.5) * 0.1, x, y)); rellena(k, car([[2, -2], [9, -2], [10, 3], [3, 3]]), () => "#e8f6fa"); }
  }

  function invernadero(k, x, b, w, hg, s, { numero = null, puerta = true } = {}) {
    const top = b - 4 - hg, rh = Math.round(w * 0.32), cxp = x + w / 2;
    T.rect(k, x, top, w, hg, (px, py) => rampa(["#a8ccbc", "#92bcaa", "#7eaa98", "#6c9886"], 0.12 + ((py - top) / hg) * 0.6, px, py));
    const baldas = [b - 6, b - 6 - Math.round(hg * 0.45)];
    baldas.forEach((by, j) => {
      for (let px = x + 3; px < x + w - 4; px += 8) {
        if (puerta && Math.abs(px + 3 - cxp) < 9) continue;
        const tipo = Math.floor(hash(px, j + 7, s) * 5), m = px + 2;
        k.R(px, by - 3, 6, 3, BARRO[1]); k.R(px, by - 3, 6, 1, BARRO[0]); k.R(px + 5, by - 2, 1, 2, BARRO[3]);
        if (tipo === 0 || tipo === 1) { bola(k, m + 1, by - 6, 3, 2.4, (qx, qy) => rampa(["#7cc060", "#5ea448", "#468a38"], 0.2 + ((qy - by + 8) / 5) * 0.5, qx, qy)); k.R(m, by - 4, 2, 1, "#e6c4a4"); k.P(m + 1, by - 9, "#5ea448"); }
        else if (tipo === 2) { for (let i = 0; i < 4; i++) trazo(k, [[m + 1, by - 3], [m - 2 + i * 2, by - 10 - (i % 2) * 2]], i % 2 ? "#6aa84e" : "#4e8a3c", 1); }
        else if (tipo === 3) { trazo(k, bezier([m + 1, by - 3], [m - 3, by - 8], [m + 5, by - 10], [m, by - 14], 10), "#8a5aa8", 1); k.P(m, by - 14, "#c88ae0"); k.P(m + 3, by - 9, "#c88ae0"); }
        else { bola(k, m + 1, by - 5, 3.2, 2.2, () => "#b8d878"); k.P(m + 1, by - 6, "#e8f4c0"); }
      }
      k.R(x + 2, by, w - 4, 1, "#6a4a30"); for (let px = x + 4; px < x + w - 4; px += 10) k.R(px, by + 1, 1, j ? Math.round(hg * 0.45) - 1 : 2, "#5a3c26");
    });
    rellena(k, [[x + 2, top + 3], [x + 9, top + 1], [x + 12, top + 6], [x + 6, top + 12], [x + 2, top + 10]], (px, py) => rampa(["#7ab860", "#5e9c4a", "#46803a"], 0.2 + ((px - x) / 12) * 0.5, px, py));
    trazo(k, [[x + 3, top + 10], [x + 10, top + 3]], "#3e7034", 1);
    k.alfa(0.3, () => T.rect(k, x, top, w, hg, (px, py) => rampa(["#f6fcfd", "#e0eef2", "#c8e2e8"], ((py - top) / hg) * 0.9, px, py)));
    for (let px = x; px <= x + w; px += 7) k.R(px, top, 1, hg, HIERRO);
    for (let py = top; py < b - 4; py += 8) k.R(x, py, w + 1, 1, HIERRO);
    k.R(x - 1, top - 1, 2, hg + 5, HIERRO); k.R(x + w - 1, top - 1, 2, hg + 5, HIERRO); k.R(x - 1, top - 1, w + 2, 1, HIERRO_L);
    T.rect(k, x - 1, b - 4, w + 2, 4, ladrillo(LADRILLO, { w: 5, h: 2, s }));
    k.R(x - 2, b - 5, w + 4, 1, "#a8a898"); k.R(x - 2, b - 5, w + 4, 1, "#bcbcac");
    rellena(k, [[x - 2, top - 1], [cxp, top - 1 - rh], [x + w + 2, top - 1]], (px, py) => rampa(["#f0f9fa", "#d8ecf0", "#c0dce4", "#a8ccd8"], 0.08 + ((py - top + rh) / rh) * 0.45 + ((px - x) / w) * 0.25, px, py));
    for (let i = 1; i < 6; i++) trazo(k, [[x + (w * i) / 6, top - 1], [cxp, top - 1 - rh]], HIERRO, 1);
    trazo(k, [[x - 2, top - 1], [cxp, top - 1 - rh], [x + w + 2, top - 1]], HIERRO, 1);
    const vx = x + w * 0.66, vy = top - rh * 0.4;
    rellena(k, [[vx, vy], [vx + 7, vy + 3], [vx + 7, vy - 1], [vx + 1, vy - 4]], () => "#e6f4f8"); trazo(k, [[vx, vy], [vx + 7, vy + 3], [vx + 7, vy - 1], [vx + 1, vy - 4], [vx, vy]], HIERRO, 1);
    for (let i = -2; i <= 2; i++) { const px = cxp + i * 3; k.R(px, top - 2 - rh + Math.abs(i) * 2 - 2, 1, 2, HIERRO); }
    k.R(cxp, top - rh - 8, 1, 7, HIERRO); k.R(cxp - 3, top - rh - 7, 7, 1, HIERRO); k.P(cxp + 3, top - rh - 8, HIERRO); k.R(cxp - 1, top - rh - 9, 3, 1, "#c8a040");
    if (puerta) {
      const dw = 12, dh = Math.min(16, hg - 2), dx = Math.round(cxp - dw / 2), dy = b - 4 - dh;
      k.R(dx - 1, dy - 1, dw + 2, dh + 1, HIERRO);
      T.rect(k, dx, dy, dw, dh, (px, py) => rampa(["#bcdcd6", "#a4cac2", "#8cb8b0"], 0.2 + ((py - dy) / dh) * 0.5, px, py));
      k.R(dx + 6, dy, 1, dh, HIERRO); k.R(dx, dy + Math.round(dh / 2), dw, 1, HIERRO); k.R(dx + 7, dy, 2, dh, "#2a3a34");
      k.P(dx + 4, dy + Math.round(dh / 2) + 2, "#d8b048"); k.P(dx + 9, dy + Math.round(dh / 2) + 2, "#d8b048");
      k.R(dx - 2, b - 4, dw + 4, 2, "#b4b0a0"); k.R(dx - 2, b - 4, dw + 4, 1, "#cfcabb");
      if (numero !== null) { k.R(dx + 3, dy - 8, 7, 7, "#3a2a1a"); k.R(dx + 4, dy - 7, 5, 5, "#efe4c4"); rotulo(k, dx + 5, dy - 7, String(numero), "#3a2a1a"); }
    }
    k.alfa(0.38, () => { for (let i = 0; i < Math.floor(w / 18); i++) trazo(k, [[x + 4 + i * 18, b - 6], [x + 12 + i * 18, top + 2]], "#ffffff", 1); });
    for (let i = 0; i < w / 4; i++) { const px = x + 1 + hash(i, 9, s) * (w - 2), py = top + 1 + hash(i, 10, s) * (hg - 6); k.P(px, py, "#f0faf8"); }
  }
  function aperos(k, xp, b, s) {
    rellena(k, [[xp - 7, b - 3], [xp + 7, b - 3], [xp + 14, b + 12], [xp - 12, b + 12]], (x, y) => rampa(["#d4c8aa", "#c0b294", "#a89a7c"], 0.2 + hash(x, y, s) * 0.5, x, y));
    const rx = xp + 20, ry = b + 3; bola(k, rx, ry, 4, 3, () => "#6aa088"); k.R(rx - 4, ry, 8, 3, "#5a8c76"); trazo(k, [[rx + 3, ry], [rx + 8, ry - 4]], "#5a8c76", 1); k.R(rx + 8, ry - 5, 2, 1, "#7ab8a0"); trazo(k, [[rx - 3, ry - 3], [rx - 1, ry - 6], [rx + 2, ry - 3]], "#4a7a66", 1);
    const cx = xp - 28, cy = b + 6; rellena(k, [[cx - 8, cy - 5], [cx + 6, cy - 5], [cx + 4, cy], [cx - 6, cy]], () => "#8a8e94"); bola(k, cx - 1, cy - 6, 6, 2, () => "#5a3e28"); bola(k, cx + 7, cy + 1, 2, 2, () => "#2a2a2e"); trazo(k, [[cx - 8, cy - 4], [cx - 14, cy + 1]], "#7a5a3a", 1); k.R(cx - 4, cy, 1, 3, "#5a4a3a");
    [[0, 0], [3, 0], [1.5, -3]].forEach(([dx, dy]) => { const px = xp + 32 + dx * 2, py = b + 4 + dy; k.R(px, py, 5, 3, BARRO[1]); k.R(px, py, 5, 1, BARRO[0]); });
    const tx = xp - 44, ty = b + 2; k.R(tx, ty - 9, 9, 10, "#7a5232"); k.R(tx, ty - 9, 9, 1, "#5a8cb0"); k.R(tx, ty - 6, 9, 1, "#4a4a4a"); k.R(tx, ty - 2, 9, 1, "#4a4a4a"); k.R(tx + 7, ty - 8, 1, 8, "#5c3c24");
    trazo(k, [[xp + 44, b - 2], [xp + 48, b - 16]], "#8a6a44", 1); k.R(xp + 42, b - 3, 4, 3, "#9aa0a6");
    trazo(k, [[xp + 52, b - 2], [xp + 55, b - 17]], "#8a6a44", 1); k.R(xp + 53, b - 18, 5, 1, "#7a7e84"); for (let i = 0; i < 3; i++) k.P(xp + 53 + i * 2, b - 17, "#7a7e84");
  }

  function escena(k, o, s) {
    fondo(k, s);
    colina(k, s, o.castillo);
    sotos(k, s);
    cesped(k, 106, s);
    o.inv.forEach(([x, b, w, hg, numero], i) => invernadero(k, x, b, w, hg, s + i * 7, { numero }));
    const [x0, b0, w0] = o.inv[0]; aperos(k, x0 + w0 / 2, b0, s);
    const [tx, tb, e] = o.arbol, con = conCoche(k), [cx, cy, a, ec, puerta] = o.coche;
    const libre = con ? [[cx - 30 * ec, cx + 30 * ec, cy - 16 * ec, cy + 12 * ec]] : [];
    if (o.castillo.verlo) libre.push(o.castillo.verlo);
    const [, , , hg0] = o.inv[0]; libre.push([x0 - 3, x0 + w0 + 3, b0 - 4 - hg0 - w0 * 0.32 - 2, b0]);
    const ramas = sauce(k, tx, tb, e, s, { furia: 1.1, libre, izq: o.izq || 1 });
    if (con) {
      coche(k, cx, cy, a, ec, { puerta });
      const [r] = o.coche.rama ? [o.coche.rama] : [ramas[3]];
      trazo(k, bezier(r[1], [cx - 4 * ec, cy + 12 * ec], [cx + 6 * ec, cy + 9 * ec], [cx + 24 * ec, cy + 4 * ec], 18), CORTEZA[4], Math.max(2, 3 * ec), 1);
      trazo(k, bezier(r[1], [cx - 4 * ec, cy + 12 * ec], [cx + 6 * ec, cy + 9 * ec], [cx + 24 * ec, cy + 4 * ec], 18).map(([x, y]) => [x, y - 1]), CORTEZA[1], 1);
      for (let i = 0; i < 4; i++) { const hx = cx - 14 * ec + i * 9 * ec, hy = cy + 7 * ec; for (let t = 0; t < 6 + i * 2; t++) k.P(hx + Math.sin(t / 3 + i) * 1.5, hy + t, rampa(HOJA, 0.2 + t * 0.05, hx, hy + t)); }
    }
  }
  const AJ = (dx) => ({ tinte: 0.2, dx });
  const V = [
    { nombre: "Como lo pediste", aj: 70, izq: 0.6, castillo: { cx: 36, base: 89, e: 0.36, verlo: [0, 70, 50, 96] }, arbol: [112, 156, 1.16], coche: [204, 52, -0.28, 1.35], inv: [[162, 131, 62, 24, 3], [238, 127, 56, 20, null]] },
    { nombre: "El castillo más cerca, con su camino", aj: 70, izq: 0.5, castillo: { cx: 44, base: 92, e: 0.5, alta: 8, camino: true, verlo: [0, 92, 36, 100] }, arbol: [124, 158, 1.16], coche: [212, 50, -0.26, 1.35], inv: [[168, 131, 60, 24, 3], [242, 127, 54, 20, null]] },
    { nombre: "El coche aún más grande, con la puerta abierta", aj: 70, izq: 0.6, castillo: { cx: 36, base: 89, e: 0.36, verlo: [0, 70, 50, 96] }, arbol: [112, 156, 1.2], coche: [196, 52, -0.4, 1.65, true], inv: [[162, 131, 62, 24, 3], [238, 127, 56, 20, null]] },
    { nombre: "Los invernaderos más cerca", aj: 70, izq: 0.6, castillo: { cx: 32, base: 89, e: 0.34, verlo: [0, 64, 50, 96] }, arbol: [104, 156, 1.12], coche: [186, 48, -0.3, 1.3], inv: [[150, 140, 80, 30, 3], [250, 131, 62, 22, null]] },
  ];
  MAG[16] = (n) => { const o = V[Math.min(n, 4) - 1]; return ["El Sauce Boxeador", o.nombre, (k) => escena(k, o, 1661 + n), AJ(o.aj)]; };
  window.SitiosIt30.NOMBRES_SAUCE = V.map((o) => o.nombre);
})();

(function () {
  const u = "magos";
  const F = { it6: window.SitiosIt6, it14: window.SitiosIt14, it15: window.SitiosIt15, it18: window.SitiosIt18, it19: window.SitiosIt19, it20: window.SitiosIt20, it21: window.SitiosIt21, it22: window.SitiosIt22, it27: window.SitiosIt27, it28: window.SitiosIt28, it29: window.SitiosIt29, it30: window.SitiosIt30 };
  const poner = (s, e, dentro) => {
    const ajuste = { ...(e[3] || {}) };
    if (dentro) ajuste.detallesDentro = true;
    Sitios[u][s] = [e[0], e[1], e[2], ajuste];
    Luz.AJUSTE[e[0]] = ajuste;
  };
  [[5,"it6",0,1],[10,"it6",0,1],[13,"it6",0,1],[17,"it6",0,1],[14,"it15"],[8,"it15"],[11,"it15"],[25,"it15"],[31,"it15"],[12,"it15"],[26,"it15"],[28,"it15"],[32,"it15"],[33,"it15"],[34,"it15"],[37,"it15"],[38,"it15"],[40,"it15"],[42,"it21"],[43,"it21"],[44,"it22"],[45,"it22"],[35,"it29",1],[41,"it29",2],[39,"it29",1],[36,"it29",3],[18,"it29",1],[16,"it30",2],[6,"it27"],[7,"it27"],[1,"it27"],[4,"it27"],[15,"it27"],[3,"it27"],[19,"it27"],[20,"it27"],[21,"it27"],[22,"it27"],[23,"it27"],[24,"it27"],[27,"it27"],[29,"it27"],[30,"it27"],[2,"it28",2],[9,"it28",2]].forEach(([s, it, variante, dentro]) => {
    const x = F[it] && F[it][u] && F[it][u][s], e = typeof x === "function" ? x(variante) : x;
    if (!e) throw new Error("escenas-magos.js: falta el escenario " + s + " de la " + it);
    poner(s, e, dentro);
  });
})();
