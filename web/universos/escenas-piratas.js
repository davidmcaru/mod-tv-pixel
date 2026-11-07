// escenas-piratas.js — el dibujo de cada escenario de Piratas (datos).
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
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, humo, rotulo } = Det;
  const { bola, mezcla, encendido, hash, ruido, fbm, celdas, tramos, bezier, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, copa, briznas, fronda, sombra, sombraE, luces, espejo, bruma } = Det6;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);

  const CIELO = ["#4f9fe0", "#7cbcec", "#b4dcf2", "#e8f2ea"], MAR = ["#3c94d2", "#2c80c0", "#226caa", "#1a5a92", "#134a7c"];
  const MAD = ["#e6bf8e", "#cfa26c", "#b07c4a", "#8e6036", "#6e4626", "#4c2e18"], MAD_O = ["#b88a5a", "#9a6c40", "#7c522e", "#5f3c20", "#422814", "#2c1a0c"];
  const LONA = ["#fffaf0", "#f4ecda", "#e6dbc2", "#d2c4a6", "#b8a888"], LANA = ["#ffffff", "#f7f2e6", "#e8dfcc", "#d0c3a8", "#ab9b80"];
  const HIERRO = ["#9a9aa6", "#6a6a76", "#46464f", "#2a2a32"], CUERDA = ["#e8d6a8", "#c8b080", "#9a8258", "#6e5a3a"];
  const LUZ = "#ffcf7a";

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
  function farol(k, x, y) {
    k.R(x + 1, y - 4, 1, 3, HIERRO[2]); k.R(x - 1, y - 2, 5, 1, HIERRO[1]); k.R(x - 1, y - 1, 5, 7, HIERRO[2]); k.R(x, y, 3, 5, "#ffd27a"); k.P(x, y, "#fff3cf"); k.R(x - 1, y + 6, 5, 1, HIERRO[1]);
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
  function velaCuadra(k, x0, x1, y0, y1, { hincha = 4, pal = LONA } = {}) {
    const cx = (x0 + x1) / 2, w = x1 - x0, pts = [];
    for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push([x0 - hincha * Math.sin(t * Math.PI) * 0.8, y0 + (y1 - y0) * t]); }
    for (let i = 1; i < 20; i++) { const t = i / 20; pts.push([x0 + w * t, y1 + hincha * 1.2 * Math.sin(t * Math.PI)]); }
    for (let i = 20; i >= 0; i--) { const t = i / 20; pts.push([x1 + hincha * Math.sin(t * Math.PI) * 0.8, y0 + (y1 - y0) * t]); }
    rellena(k, pts, (x, y) => {
      const nx = (x - cx) / (w / 2), ny = (y - y0) / (y1 - y0);
      if (Math.round(x - x0) % 10 === 0) return pal[2];
      if ([0.2, 0.27].some((f) => Math.abs(ny - f) < 0.012)) return pal[2];
      return rampa(pal, 0.05 + Math.pow(Math.abs(nx + 0.12), 1.8) * 0.66 + ny * 0.14 + (ruido(x * 0.2, y * 0.08, 9) - 0.5) * 0.08, x, y);
    });
    trazo(k, pts.slice(20, 41), pal[4]); trazo(k, pts.slice(0, 21), pal[3]); trazo(k, pts.slice(40), pal[4]);
    for (let x = x0 + 4; x < x1 - 2; x += 5) [0.2, 0.27].forEach((f) => k.P(x, y0 + (y1 - y0) * f + 1, pal[4]));
  }
  function verga(k, x0, x1, y, g, pal = MAD_O) { for (let x = Math.round(x0); x < x1; x++) for (let j = 0; j < g; j++) k.P(x, y + j, rampa(pal, 0.1 + Math.abs(j / (g - 1) - 0.3) * 1.1, x, y + j)); }
  function palo(k, x, y0, y1, w, pal = MAD_O, zunchos = []) {
    rellena(k, [[x, y0], [x + w, y0], [x + w, y1], [x, y1]], corteza(pal, x, w, { s: 17, grieta: 0.74 }));
    zunchos.forEach((y) => { for (let px = x - 1; px <= x + w; px++) { const t = (px - x) / w; k.P(px, y, rampa(HIERRO, 0.05 + Math.abs(t - 0.3), px, y)); k.P(px, y + 1, rampa(HIERRO, 0.4 + Math.abs(t - 0.3), px, y + 1)); } });
  }
  function obenques(k, tx, ty, pies, col = "#3a2a1e") {
    pies.forEach(([x, y]) => { cuerda(k, tx, ty, x, y, 0, col); k.elipse(x, y + 1, 2, 2, MAD_O[2]); k.P(x, y + 1, MAD_O[5]); });
    for (let i = 0; i + 1 < pies.length; i++) {
      const [ax, ay] = pies[i], [bx, by] = pies[i + 1];
      for (let t = 0.45; t < 0.96; t += 0.06) cuerda(k, tx + (ax - tx) * t, ty + (ay - ty) * t, tx + (bx - tx) * t, ty + (by - ty) * t, 0.5, "#4a3828");
    }
  }
  function cubierta(k, canto, fx, fy, pal, { filas = 15, L = 62, s = 3, pisado = null } = {}) {
    suelo3d(k, Math.floor(Math.min(...Array.from({ length: W }, (_, x) => canto(x)))), H, fx, fy, (X, z, x, y) => {
      if (y < canto(x)) return null;
      const fz = z * filas, fila = Math.floor(fz), en = fz - fila, paso = (100 / ((y - fy) * (y - fy))) * filas, off = hash(fila, 0, s) * L, u = X + off - Math.floor((X + off) / L) * L, cola = Math.floor((X + off) / L);
      if (en < paso * 0.9) return pal[5];
      if (u < z * 1.05) return pal[4];
      if ((Math.abs(u - 2.5) < z * 0.6 || Math.abs(u - L + 3) < z * 0.6) && Math.abs(en - 0.5) < Math.max(paso, 0.2)) return "#3a2a1e";
      const tono = (hash(fila, cola, s) - 0.5) * 0.26, veta = ruido(X * 0.035, fila * 5.1 + en * 1.6, s) > 0.74 ? 0.12 : 0, g = pisado ? pisado(x, y) : 0;
      return rampa(pal, 0.28 + tono + veta - g + (en < paso * 2.2 ? -0.1 : 0) + (en > 1 - paso * 1.5 ? 0.1 : 0), x, y);
    });
    for (let x = 0; x < W; x++) { const b = Math.round(canto(x)); for (let j = 0; j < 4; j++) if (Det.trama(x, b + j) < (4 - j) / 6) k.P(x, b + j, pal[5]); }
  }
  function canon(k, x, y) {
    rellena(k, [[x, y + 3], [x + 16, y], [x + 18, y + 6], [x + 2, y + 9]], (px, py) => rampa(HIERRO, 0.05 + ((py - y) / 9) * 0.9, px, py));
    k.elipse(x + 1, y + 6, 3, 3, HIERRO[2]); k.elipse(x + 1, y + 6, 1.5, 1.5, "#101014"); k.R(x + 6, y + 2, 1, 5, HIERRO[0]);
    rellena(k, [[x + 4, y + 8], [x + 22, y + 6], [x + 23, y + 13], [x + 5, y + 15]], madera(MAD_O, { paso: 2, largo: 99, s: x }));
    [[x + 8, y + 15], [x + 20, y + 13]].forEach(([a, b]) => { k.elipse(a, b, 3, 3, MAD_O[4]); k.elipse(a, b, 1, 1, HIERRO[1]); });
    sombraE(k, x + 15, y + 16, 12, 2, 0.45);
  }

  function oveja(k, ox, oy) {
    rellena(k, [[ox - 12, oy + 10], [ox + 4, oy + 12], [ox + 6, oy + 30], [ox + 2, oy + 46], [ox - 20, oy + 46], [ox - 16, oy + 26]], (x, y) => rampa(MAD, 0.15 + ((x - ox + 18) / 24) * 0.55 + (ruido(x * 0.3, y * 0.1, 4) - 0.5) * 0.2, x, y));
    for (let y = oy + 18; y < oy + 46; y += 5) trazo(k, [[ox - 17, y], [ox + 4, y + 2]], MAD[3]);
    const rizos = [];
    for (let i = 0; i < 44; i++) { const a = hash(i, 1, 23) * Math.PI * 2, r = Math.sqrt(hash(i, 2, 23)), x = ox - 7 + Math.cos(a) * r * 15, y = oy + 1 + Math.sin(a) * r * 14; if (x > ox + 6) continue; rizos.push([x, y, 3 + hash(i, 3, 23) * 1.8]); }
    rizos.sort((a, b) => b[1] - a[1]).forEach(([x, y, r]) => { esfera(k, x, y, r, r, LANA, (x - ox) / 40 + (y - oy) / 36 - 0.05); k.P(x - r * 0.45, y - r * 0.5, "#ffffff"); k.P(x + r * 0.2, y + r * 0.6, LANA[4]); });
    const CARA = ["#fff6e2", "#fbe9c6", "#f0d4a2", "#ddb882", "#bf965e"];
    rellena(k, [[ox - 2, oy - 10], [ox + 8, oy - 9], [ox + 16, oy - 4], [ox + 23, oy + 2], [ox + 27, oy + 7], [ox + 26, oy + 12], [ox + 20, oy + 15], [ox + 10, oy + 16], [ox + 2, oy + 13], [ox - 2, oy + 4]], (x, y) => rampa(CARA, 0.1 + ((y - oy + 10) / 26) * 0.5 + ((x - ox) / 30) * 0.08, x, y));
    trazo(k, [[ox + 16, oy - 4], [ox + 23, oy + 2], [ox + 27, oy + 7]], CARA[0]);
    k.elipse(ox + 12, oy - 1, 3, 3.6, "#1e1e24"); k.P(ox + 13, oy - 3, "#ffffff"); k.P(ox + 12, oy - 3, "#ffffff"); k.P(ox + 11, oy + 1, "#3a3a46");
    trazo(k, [[ox + 8, oy - 5], [ox + 12, oy - 6], [ox + 16, oy - 5]], CARA[4]);
    k.R(ox + 24, oy + 5, 2, 2, "#8a5a3a"); k.P(ox + 24, oy + 5, "#b07850");
    trazo(k, [[ox + 18, oy + 11], [ox + 22, oy + 12], [ox + 25, oy + 10]], "#a8622a");
    rellena(k, [[ox + 2, oy - 6], [ox - 2, oy - 8], [ox - 9, oy - 4], [ox - 8, oy - 1], [ox - 1, oy - 2]], (x, y) => rampa(["#fbe9c6", "#f0d4a2", "#ddb882"], 0.2 + ((y - oy + 8) / 8) * 0.5, x, y));
    for (let a = 0; a < 2.2 * Math.PI * 2; a += 0.035) { const r = 1.2 + a * 0.9, x = ox - 4 + Math.cos(a + 2.4) * r, y = oy + 4 + Math.sin(a + 2.4) * r * 1.05, g = 1.6 + a * 0.3, anillo = Math.floor(a * 2.2) % 2; k.R(x - g / 2, y - g / 2, g, g, rampa(["#f6dc8c", "#e2b85a", "#c49640", "#9a7228", "#6e5018"], 0.12 + (Math.sin(a + 3) + 1) * 0.3 + anillo * 0.12, x, y)); }
    [[ox + 2, oy - 11, 3.6], [ox + 7, oy - 12, 3.4], [ox - 3, oy - 10, 3.6]].forEach(([x, y, r]) => { esfera(k, x, y, r, r, LANA, -0.1); k.P(x - r * 0.4, y - r * 0.5, "#ffffff"); });
  }

  function nerry(k) {
    const { h, d } = cuando(k), lit = encendido(k);
    k.banda(CIELO, 0, 86);
    nubarron(k, -24, 46, 96, 18); nubarron(k, 244, 30, 100, 20); cirros(k, 5, 6, 30);
    rellena(k, [[206, 86], [214, 81], [226, 78], [242, 79], [254, 83], [264, 86]], (x, y) => rampa(["#a4c0cc", "#8eacbc", "#7c9aae"], ((x - 206) / 58) * 0.6 + ((y - 78) / 8) * 0.3, x, y));
    k.agua(86, 126, MAR, "#a8d8f0", 0);
    for (let y = 87; y < 126; y++) for (let x = 0; x < W; x++) { const f = (y - 86) / 40, o = ruido(x * (0.1 - f * 0.06), y * 0.75, 3); if (o > 0.72) k.P(x, y, o > 0.86 ? "#c8eaf8" : "#62aee0"); else if (o < 0.2) k.P(x, y, MAR[4]); }
    espejo(k, 86, 86, 126, { mezcla: 0.6, tinte: "#2c74b0", onda: 3, crestas: 0.06 });
    reflejo(k, 87, 126);
    const alto = (x) => 104 - 30 * Math.pow(Math.max(0, x - 140) / 180, 2), canto = (x) => alto(x) + 20;
    for (let x = 0; x < W; x++) {
      const a = Math.round(alto(x)), b = Math.round(canto(x));
      for (let y = a + 13; y < b; y++) k.P(x, y, rampa(MAD, 0.35 + (y - a - 13) * 0.05 + (x % 11 === 0 ? 0.2 : 0) + (hash(Math.floor(x / 11), 9) - 0.5) * 0.12, x, y));
      k.P(x, a + 12, MAD[4]); k.P(x, a + 11, MAD[2]); k.P(x, a + 10, MAD[1]);
    }
    for (let x = 4; x < W; x += 8) {
      const a = Math.round(alto(x));
      for (let y = a + 3; y < a + 10; y++) { const t = (y - a - 3) / 7, g = 1.3 + Math.sin(t * Math.PI) * 1 + (t < 0.2 || t > 0.85 ? 0.6 : 0); for (let px = Math.round(x - g); px <= x + g; px++) k.P(px, y, rampa(MAD, 0.1 + ((px - x + g) / (2 * g)) * 0.7, px, y)); }
    }
    for (let x = 0; x < W; x++) { const a = Math.round(alto(x)); k.P(x, a, MAD[0]); k.P(x, a + 1, MAD[1]); k.P(x, a + 2, MAD[3]); k.P(x, a + 3, MAD[5]); }
    cubierta(k, canto, 150, 64, MAD, { pisado: (x, y) => Math.max(0, 1 - Math.abs(x - 170) / 80) * 0.12 * Math.min(1, (y - 130) / 30) });
    const MAND = ["#a8d878", "#7cb658", "#58963f", "#3b762f", "#245520"];
    copa(k, 22, 50, 22, 16, MAND, { r: 4, s: 41 }); copa(k, 60, 54, 18, 14, MAND, { r: 3.8, s: 43 });
    for (let i = 0; i < 30; i++) { const a = hash(i, 1, 9) * Math.PI * 2, r = Math.sqrt(hash(i, 2, 9)), x = (i % 2 ? 22 : 60) + Math.cos(a) * r * 18, y = (i % 2 ? 50 : 54) + Math.sin(a) * r * 12; k.R(x, y, 2, 2, "#f39a26"); k.P(x, y, "#ffd27a"); k.P(x + 1, y + 1, "#c4611a"); }
    k.R(18, 62, 4, 12, MAD_O[3]); k.R(56, 64, 4, 10, MAD_O[3]);
    for (let x = 0; x < 82; x += 6) { k.R(x, 64, 3, 9, MAD[2]); k.P(x, 64, MAD[0]); k.R(x + 2, 64, 1, 9, MAD[4]); }
    k.R(-2, 62, 84, 2, MAD[1]); k.R(-2, 62, 84, 1, MAD[0]); k.R(-2, 73, 84, 3, MAD[1]); k.R(-2, 73, 84, 1, MAD[0]); k.R(-2, 76, 84, 1, MAD[5]);
    rellena(k, [[-2, 77], [80, 77], [80, 134], [-2, 134]], madera(MAD, { paso: 4, vertical: true, largo: 80, s: 5, veta: 0.6 }));
    k.R(-2, 77, 82, 2, MAD[4]); k.R(-2, 129, 82, 5, MAD[3]); k.R(-2, 129, 82, 1, MAD[1]); k.R(78, 77, 2, 57, MAD[4]);
    [[16, 102], [40, 102]].forEach(([x, y]) => { k.elipse(x, y, 8, 8, "#4a2e18"); bola(k, x, y, 7, 7, (px, py) => rampa(["#f6dc8c", "#d8a845", "#a8842e", "#7a5a20"], 0.15 + ((px - x) + (py - y)) / 14 * 0.45, px, py)); k.elipse(x, y, 5, 5, "#ffd27a"); k.R(x - 5, y, 11, 1, "#8a6a24"); k.R(x, y - 5, 1, 11, "#8a6a24"); k.P(x - 2, y - 2, "#fff3cf"); k.P(x - 3, y - 2, "#fff3cf"); });
    rellena(k, [[57, 134], [57, 98], [59, 93], [63, 90], [69, 90], [73, 93], [75, 98], [75, 134]], (x, y) => (Math.round(x) === 66 ? MAD_O[5] : madera(MAD_O, { paso: 3, vertical: true, largo: 99, s: 6, veta: 0.5 })(x, y)));
    k.R(57, 134, 18, 1, MAD_O[5]); k.P(72, 114, "#e8c35a"); k.P(72, 115, "#a8842e");
    farol(k, 82, 98);
    for (let y = 80; y < 133; y += 5) { k.R(84, y, 9, 1, MAD[1]); k.P(84, y + 1, MAD[4]); } k.R(83, 74, 1, 60, MAD[3]); k.R(93, 74, 1, 60, MAD[4]);
    palo(k, 118, 0, 138, 12, MAD_O, [20, 84, 110]);
    obenques(k, 118, 6, [[96, alto(96)], [104, alto(104)], [112, alto(112)]]);
    obenques(k, 130, 6, [[148, alto(148)], [158, alto(158)], [168, alto(168)]]);
    verga(k, 48, 202, 8, 4);
    velaCuadra(k, 54, 196, 12, 97, { hincha: 6 });
    jollyRoger(k, 125, 44, 1.3);
    for (let x = 56; x < 196; x += 7) k.R(x, 11, 1, 3, "#5a4430");
    cuerda(k, 54, 99, 90, 128, 3, "#5a4430"); cuerda(k, 196, 99, 232, alto(232), 3, "#5a4430"); cuerda(k, 130, 2, 298, 70, 9, "#3a2a1e");
    sombraE(k, 126, 139, 24, 4, 0.5);
    k.R(100, 124, 52, 3, MAD[1]); k.R(100, 124, 52, 1, MAD[0]); k.R(100, 127, 52, 1, MAD[4]);
    [101, 148].forEach((x) => { k.R(x, 124, 3, 15, MAD[2]); k.R(x + 2, 124, 1, 15, MAD[4]); });
    for (let x = 104; x < 147; x += 5) { if (x > 114 && x < 133) continue; k.R(x, 120, 1, 4, MAD_O[1]); k.elipse(x, 130, 2, 3, CUERDA[1]); k.P(x, 128, CUERDA[0]); k.P(x, 132, CUERDA[3]); }
    farol(k, 134, 106);
    barril(k, 212, 144, 12, 15); barril(k, 225, 146, 12, 15); caja(k, 238, 150, 17, 11); caja(k, 241, 139, 11, 9, MAD_O);
    rollo(k, 58, 166, 10);
    k.R(28, 152, 8, 8, HIERRO[1]); k.R(28, 152, 8, 1, HIERRO[0]); k.R(29, 160, 6, 1, HIERRO[3]); trazo(k, [[35, 154], [47, 118]], "#8a6a40"); for (let i = 0; i < 6; i++) k.R(45 + i - 2, 112 + i, 1, 7, "#d8d0ba");
    canon(k, 262, 116);
    rellena(k, [[278, 106], [288, 86], [300, 78], [320, 74], [320, 118], [296, 118]], madera(MAD, { paso: 3, largo: 40, s: 12, veta: 0.5 }));
    oveja(k, 284, 50);
    if (!k.luz || !k.luz.noche) sombra(k, [[60, 126], [198, 124], [220, 142], [76, 148]], 0.2, { borde: 2 });
    luces(k, [{ x: 136, y: 110, r: 58, ry: 42, col: LUZ, f: lit }, { x: 83, y: 102, r: 40, ry: 34, col: LUZ, f: lit * 0.9 }, { x: 28, y: 104, r: 34, ry: 24, col: LUZ, f: lit * 0.6 }]);
    const parche = ([x, y, w, a]) => { rellena(k, [[x, y], [x + w, y], [x + w, y + a], [x, y + a]], madera(["#dcb482", "#c49e68", "#aa8454", "#8e663a", "#6e4828", "#4c2e18"], { paso: 3, largo: 99, s: x, veta: 0.4 })); k.R(x, y, w, 1, "#ecca9a"); [[1, 1], [w - 2, 1], [1, a - 2], [w - 2, a - 2]].forEach(([i, j]) => k.P(x + i, y + j, "#3a2a20")); };
    [[214, 162, 18, 7], [120, 168, 22, 7], [270, 160, 16, 6], [158, 150, 14, 6], [62, 174, 20, 6], [286, 150, 12, 5], [232, 172, 18, 6]].slice(0, d === 3 ? 3 : d === 4 ? 7 : 0).forEach(parche);
    if (d === 4 && h === 3) { const x = 128, b = 134; Det.brillo(k, x, b - 6, 16, 16, "#ffe6a8", 0.9); k.crudo(x - 3, b - 8, 7, 8, "#e8e0c8"); k.crudo(x - 2, b - 12, 5, 5, "#e8e0c8"); k.crudo(x - 1, b - 10, 3, 2, "#3a3028"); k.crudo(x + 4, b - 9, 1, 6, "#6d4628"); k.crudo(x + 3, b - 10, 3, 2, "#8a8a94"); }
  }

  const NIN = ["#ffd08a", "#f4b664", "#e09648", "#c47634", "#9a5626", "#6e3a1a"], CESPED = ["#b6e07c", "#92cc62", "#76b44e", "#5e9a40", "#467c32", "#305c24"];
  function leon(k, cx, cy, R) {
    const mx = cx - R * 0.14, my = cy;
    const capas = [[1, ["#f6b04a", "#e48c30", "#c86c22", "#a04e18", "#743412"], 15], [0.84, ["#ffd070", "#f4ac44", "#de8a2e", "#bc6a20", "#8c4a16"], 13], [0.7, ["#ffe08a", "#ffc458", "#f0a03a", "#d07e28"], 11]];
    capas.forEach(([f, pal, n], c) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + c * 0.23 + (hash(i, c, 3) - 0.5) * 0.18, L = R * f * (0.86 + hash(i, c, 4) * 0.26), w = (Math.PI / n) * 1.3, giro = 0.2, r0 = R * 0.4;
        const p = (aa, rr) => [mx + Math.cos(aa) * rr * 0.78, my + Math.sin(aa) * rr * 0.96];
        const pts = [p(a - w, r0), p(a - w * 0.85 + giro * 0.3, L * 0.7), p(a - w * 0.25 + giro * 0.8, L * 0.95), p(a + giro, L), p(a + w * 0.45 + giro * 0.7, L * 0.9), p(a + w * 0.9 + giro * 0.5, L * 0.66), p(a + w, r0)];
        rellena(k, pts, (x, y) => { const rr = Math.hypot((x - mx) / 0.78, (y - my) / 0.96) / L, lado = Math.sin(Math.atan2(y - my, x - mx) - a); return rampa(pal, 0.1 + (1 - rr) * 0.45 + lado * 0.32 + Math.cos(a + 0.9) * 0.18, x, y); });
        trazo(k, [p(a + w, r0), p(a + w * 0.9 + giro * 0.5, L * 0.66), p(a + giro, L)], pal[pal.length - 1]);
      }
    });
    const PIEL = ["#ffe6a6", "#f8cf80", "#ecb462", "#d6984a", "#b47836"];
    bola(k, cx + R * 0.06, cy, R * 0.44, R * 0.48, (x, y) => rampa(PIEL, 0.16 + ((x - cx) / (R * 0.5)) * -0.1 + ((y - cy) / (R * 0.5)) * 0.3, x, y));
    esfera(k, cx - R * 0.02, cy - R * 0.42, R * 0.12, R * 0.12, ["#f4c070", "#d89a48", "#b0742e"]); k.elipse(cx - R * 0.02, cy - R * 0.41, R * 0.05, R * 0.05, "#8a5422");
    rellena(k, [[cx + R * 0.22, cy - R * 0.14], [cx + R * 0.6, cy - R * 0.1], [cx + R * 0.76, cy + R * 0.02], [cx + R * 0.76, cy + R * 0.2], [cx + R * 0.6, cy + R * 0.32], [cx + R * 0.32, cy + R * 0.34], [cx + R * 0.2, cy + R * 0.16]], (x, y) => rampa(["#fff2c8", "#fbe0a4", "#f0c87e", "#dcaa60"], 0.08 + ((y - cy) / (R * 0.4)) * 0.35 + ((x - cx) / R) * -0.1, x, y));
    trazo(k, [[cx + R * 0.24, cy - R * 0.14], [cx + R * 0.6, cy - R * 0.1]], "#fff6dc");
    k.poli([[cx + R * 0.6, cy - R * 0.08], [cx + R * 0.78, cy - R * 0.03], [cx + R * 0.78, cy + R * 0.1], [cx + R * 0.64, cy + R * 0.08]], "#5a2e1a"); k.P(cx + R * 0.66, cy - R * 0.05, "#8a4a2e");
    trazo(k, [[cx + R * 0.74, cy + R * 0.16], [cx + R * 0.6, cy + R * 0.24], [cx + R * 0.4, cy + R * 0.22], [cx + R * 0.32, cy + R * 0.14]], "#7a1f1a", 2, 1);
    k.poli([[cx + R * 0.56, cy + R * 0.22], [cx + R * 0.6, cy + R * 0.22], [cx + R * 0.58, cy + R * 0.3]], "#fffaf0"); k.poli([[cx + R * 0.44, cy + R * 0.21], [cx + R * 0.48, cy + R * 0.22], [cx + R * 0.46, cy + R * 0.29]], "#fffaf0");
    [[0.4, 0.04], [0.46, 0.08], [0.5, 0.03]].forEach(([dx, dy]) => k.P(cx + R * dx, cy + R * dy, "#c89858"));
    k.elipse(cx + R * 0.3, cy - R * 0.14, R * 0.08, R * 0.07, "#fffaf0"); k.elipse(cx + R * 0.33, cy - R * 0.14, R * 0.045, R * 0.06, "#2a1a10"); k.P(cx + R * 0.31, cy - R * 0.17, "#ffffff");
    trazo(k, [[cx + R * 0.18, cy - R * 0.22], [cx + R * 0.3, cy - R * 0.27], [cx + R * 0.42, cy - R * 0.23]], "#a0642a", 2, 1);
  }
  function sonny(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 88);
    nubarron(k, -20, 44, 104, 18); cirros(k, 5, 6, 30);
    k.agua(88, 126, MAR, "#a8d8f0", 0);
    for (let y = 89; y < 126; y++) for (let x = 0; x < W; x++) { const o = ruido(x * (0.1 - ((y - 88) / 38) * 0.06), y * 0.75, 13); if (o > 0.72) k.P(x, y, o > 0.86 ? "#c8eaf8" : "#62aee0"); else if (o < 0.2) k.P(x, y, MAR[4]); }
    espejo(k, 88, 88, 126, { mezcla: 0.6, tinte: "#2c74b0", onda: 3, crestas: 0.06 });
    reflejo(k, 89, 126);
    const alto = (x) => 104 - 30 * Math.pow(Math.max(0, x - 140) / 180, 2), canto = (x) => alto(x) + 18;
    for (let x = 0; x < W; x++) { const a = Math.round(alto(x)), b = Math.round(canto(x)); for (let y = a + 11; y < b; y++) k.P(x, y, rampa(NIN, 0.35 + (y - a - 11) * 0.06 + (x % 12 === 0 ? 0.2 : 0), x, y)); k.P(x, a + 10, NIN[4]); k.P(x, a + 9, NIN[1]); }
    for (let x = 3; x < W; x += 8) { const a = Math.round(alto(x)); for (let y = a + 3; y < a + 9; y++) { const t = (y - a - 3) / 6, g = 1.3 + Math.sin(t * Math.PI) * 1 + (t < 0.2 || t > 0.85 ? 0.6 : 0); for (let px = Math.round(x - g); px <= x + g; px++) k.P(px, y, rampa(NIN, 0.1 + ((px - x + g) / (2 * g)) * 0.7, px, y)); } }
    for (let x = 0; x < W; x++) { const a = Math.round(alto(x)); k.P(x, a, NIN[0]); k.P(x, a + 1, NIN[1]); k.P(x, a + 2, NIN[3]); k.P(x, a + 3, NIN[5]); }
    suelo3d(k, 100, H, 150, 64, (X, z, x, y) => { if (y < canto(x)) return null; const fz = z * 9, fila = Math.floor(fz), n = fbm(X * 0.05, z * 9, 7); return rampa(CESPED, 0.28 + (fila % 2) * 0.12 + (n - 0.5) * 0.42 + (hash(x, y, 7) - 0.5) * 0.14, x, y); });
    for (let x = 0; x < W; x++) { const b = Math.round(canto(x)); for (let j = 0; j < 4; j++) if (Det.trama(x, b + j) < (4 - j) / 6) k.P(x, b + j, CESPED[5]); }
    briznas(k, 0, W, (x) => canto(x) + 2, [CESPED[4], CESPED[2], CESPED[1]], { n: 520, alto: 3, s: 5, y1: 180 });
    for (let i = 0; i < 70; i++) { const x = hash(i, 1, 8) * W, y = 128 + hash(i, 2, 8) * 50; if (y < canto(x) + 4) continue; const c = ["#ffffff", "#f6d84a", "#f08aa0", "#ffffff"][i % 4]; k.P(x, y, c); k.P(x + 1, y, c); k.P(x, y - 1, c); k.P(x + 1, y - 1, "#fff6c0"); }
    const MAND = ["#a8d878", "#7cb658", "#58963f", "#3b762f", "#245520"];
    copa(k, 20, 44, 21, 15, MAND, { r: 4, s: 51 }); copa(k, 58, 46, 18, 13, MAND, { r: 3.8, s: 53 });
    for (let i = 0; i < 30; i++) { const a = hash(i, 1, 19) * Math.PI * 2, r = Math.sqrt(hash(i, 2, 19)), x = (i % 2 ? 20 : 58) + Math.cos(a) * r * 17, y = (i % 2 ? 44 : 46) + Math.sin(a) * r * 11; k.R(x, y, 2, 2, "#f39a26"); k.P(x, y, "#ffd27a"); k.P(x + 1, y + 1, "#c4611a"); }
    k.R(18, 56, 4, 10, MAD_O[3]); k.R(56, 56, 4, 10, MAD_O[3]);
    for (let x = 0; x < 86; x += 6) { k.R(x, 56, 3, 9, NIN[2]); k.P(x, 56, NIN[0]); k.R(x + 2, 56, 1, 9, NIN[4]); }
    k.R(-2, 54, 88, 2, NIN[1]); k.R(-2, 54, 88, 1, NIN[0]); k.R(-2, 65, 88, 3, NIN[1]); k.R(-2, 65, 88, 1, NIN[0]); k.R(-2, 68, 88, 1, NIN[5]);
    rellena(k, [[-2, 69], [84, 69], [84, 124], [-2, 124]], madera(["#fffaf0", "#f2ead8", "#e2d6bc", "#cfc0a0", "#b4a07e", "#8a7658"], { paso: 5, largo: 90, s: 25, veta: 0.4 }));
    k.R(-2, 69, 86, 2, "#b4a07e"); k.R(-2, 120, 86, 4, NIN[3]); k.R(-2, 120, 86, 1, NIN[1]); k.R(82, 69, 2, 55, "#b4a07e");
    [[14, 92], [36, 92]].forEach(([x, y]) => { k.elipse(x, y, 7, 7, NIN[4]); bola(k, x, y, 6, 6, (px, py) => rampa(["#f6dc8c", "#d8a845", "#a8842e"], 0.15 + ((px - x) + (py - y)) / 12 * 0.45, px, py)); k.elipse(x, y, 4, 4, "#ffd27a"); k.R(x - 4, y, 9, 1, "#8a6a24"); k.R(x, y - 4, 1, 9, "#8a6a24"); k.P(x - 2, y - 2, "#fff3cf"); });
    rellena(k, [[56, 124], [56, 92], [58, 87], [63, 84], [68, 84], [72, 87], [74, 92], [74, 124]], (x, y) => (Math.round(x) === 65 ? NIN[5] : madera(NIN, { paso: 3, vertical: true, largo: 99, s: 26, veta: 0.5 })(x, y)));
    k.P(71, 106, "#fff3cf"); farol(k, 78, 92);
    for (let i = 0; i < 7; i++) { const y = 68 + i * 7.6; k.R(86, y, 6 + i * 3.2, 3, NIN[1]); k.R(86, y, 6 + i * 3.2, 1, NIN[0]); k.R(86, y + 3, 6 + i * 3.2, 1, NIN[4]); }
    rellena(k, [[86, 60], [93, 60], [126, 126], [116, 129]], (x, y) => rampa(["#f47a5a", "#e2543a", "#c03a28", "#8e2618"], 0.15 + ((x - 86 - (y - 60) * 0.5) / 9) * 0.6, x, y)); trazo(k, [[93, 60], [126, 126]], "#7a1c12"); trazo(k, [[86, 61], [116, 128]], "#ff9a7a");
    palo(k, 134, 24, 132, 13, ["#e8b878", "#cc9658", "#ae7640", "#8a5a30", "#644020", "#422814"], [44, 108]);
    bola(k, 140, 28, 32, 6, (x, y) => rampa(NIN, 0.2 + ((x - 108) / 64) * 0.6, x, y));
    rellena(k, [[110, 28], [170, 28], [170, 8], [110, 8]], (x, y) => rampa(["#ffd08a", "#f4b664", "#e09648", "#c47634", "#9a5626"], 0.1 + Math.pow(Math.abs((x - 132) / 38), 1.3) * 0.75, x, y));
    bola(k, 140, 8, 32, 6, (x, y) => rampa(["#7cc0f0", "#4ea0dc", "#3a84c0", "#2c6aa0"], 0.15 + ((x - 108) / 64) * 0.55, x, y)); k.R(139, 0, 2, 3, "#3a2a20");
    [116, 128, 140, 152, 164].forEach((x) => { k.elipse(x, 18, 3.5, 3.5, NIN[5]); k.elipse(x, 18, 2.5, 2.5, "#ffd27a"); k.P(x - 1, 17, "#fff3cf"); });
    k.R(108, 27, 64, 2, NIN[5]); k.R(108, 29, 64, 1, NIN[3]);
    obenques(k, 136, 40, [[112, alto(112)], [120, alto(120)], [128, alto(128)]], "#4a3020"); obenques(k, 146, 40, [[160, alto(160)], [170, alto(170)], [180, alto(180)]], "#4a3020");
    verga(k, 72, 214, 34, 4, MAD_O);
    velaCuadra(k, 78, 208, 38, 102, { hincha: 5 });
    jollyRoger(k, 143, 62, 1.18);
    sombraE(k, 141, 133, 30, 5, 0.45);
    bola(k, 141, 128, 28, 6, (x, y) => rampa(NIN, 0.2 + ((x - 113) / 56) * 0.55, x, y)); bola(k, 141, 126, 26, 5, (x, y) => rampa(["#f4b664", "#e09648", "#c47634"], 0.1 + ((x - 115) / 52) * 0.6, x, y));
    for (let x = 118; x < 166; x += 7) k.R(x, 129, 1, 4, NIN[5]);
    palo(k, 135, 112, 126, 12, ["#e8b878", "#cc9658", "#ae7640", "#8a5a30", "#644020"], []);
    [[216, 90], [244, 94]].forEach(([x, y]) => { k.R(x, y, 3, 130 - y, NIN[3]); k.R(x, y, 1, 130 - y, NIN[1]); });
    k.R(214, 88, 34, 3, NIN[1]); k.R(214, 88, 34, 1, NIN[0]); k.R(214, 91, 34, 1, NIN[5]);
    cuerda(k, 224, 91, 224, 116, 0, "#6e5a3a"); cuerda(k, 236, 91, 236, 116, 0, "#6e5a3a"); k.R(220, 116, 20, 3, MAD[2]); k.R(220, 116, 20, 1, MAD[0]); sombraE(k, 232, 132, 16, 2, 0.4);
    barril(k, 256, 138, 13, 15, MAD); barril(k, 270, 141, 13, 15, MAD); k.R(258, 127, 9, 1, "#c0392b"); k.R(272, 130, 9, 1, "#c0392b");
    rellena(k, [[266, 108], [278, 90], [292, 82], [320, 80], [320, 124], [288, 124]], madera(NIN, { paso: 3, largo: 40, s: 32, veta: 0.5 }));
    leon(k, 278, 58, 31);
    if (!k.luz || !k.luz.noche) sombra(k, [[82, 124], [210, 122], [232, 140], [98, 144]], 0.18, { borde: 2 });
    luces(k, [{ x: 140, y: 18, r: 50, ry: 26, col: LUZ, f: lit * 0.8 }, { x: 78, y: 96, r: 40, ry: 32, col: LUZ, f: lit }, { x: 26, y: 94, r: 34, ry: 24, col: LUZ, f: lit * 0.7 }]);
  }

  const ENLUCIDO = ["#fffaf0", "#f6ecd6", "#eadcbc", "#d6c4a0", "#b8a07c"], VIGA = ["#8a6040", "#6e4a30", "#543620", "#3a2414"];
  const TEJA_R = ["#f49464", "#dc6a40", "#bc4e2c", "#923822", "#682616"], TEJA_A = ["#84c0e6", "#5c9ccf", "#407eb2", "#2e6090", "#20466a"], TEJA_V = ["#9cc888", "#78ac68", "#5a8e50", "#42703c", "#2e522a"];
  const VERDE_F = ["#c4e88c", "#a4d470", "#86bc58", "#6aa046", "#4e8236", "#366228"];
  function ventanaF(k, x, y, w = 7, h = 7, { contra = "#4e8a6a", flores = true } = {}) {
    k.R(x - 1, y - 1, w + 2, h + 2, VIGA[2]); k.R(x, y, w, h, "#ffd27a"); k.R(x + Math.floor(w / 2), y, 1, h, VIGA[1]); k.R(x, y + Math.floor(h / 2), w, 1, VIGA[1]); k.P(x, y, "#fff3cf");
    if (contra) { [x - 4, x + w + 1].forEach((cx) => { k.R(cx, y - 1, 3, h + 2, contra); k.R(cx, y + 1, 3, 1, mezcla(contra, "#000000", 0.35)); k.R(cx, y + h - 2, 3, 1, mezcla(contra, "#000000", 0.35)); }); }
    if (flores) { k.R(x - 1, y + h + 1, w + 2, 2, VIGA[1]); for (let i = 0; i < w + 2; i++) k.P(x - 1 + i, y + h, ["#e8402a", "#3f8a3a", "#f2c84b", "#3f8a3a", "#e86a9a"][i % 5]); }
  }
  function casaF(k, x, base, w, h, { techo = TEJA_R, frente = false, puerta = 0.6, ventanas = [0.2], chimenea = 0.74, contra = "#4e8a6a", s = 1 } = {}) {
    const top = base - h, a = frente ? Math.round(w * 0.42) : Math.round(h * 0.55) + 3, pm = x + w / 2;
    if (chimenea) { const cxm = x + w * chimenea; rellena(k, [[cxm - 3, top - a - 3], [cxm + 3, top - a - 3], [cxm + 3, top], [cxm - 3, top]], Det6.ladrillo(["#cc8060", "#ac6248", "#8c4a36", "#602e20"], { w: 4, h: 2, s })); k.R(cxm - 4, top - a - 5, 8, 2, "#5e4a40"); k.R(cxm - 4, top - a - 5, 8, 1, "#8a766a"); }
    rellena(k, [[x, base], [x, top], [x + w, top], [x + w, base]], (px, py) => rampa(ENLUCIDO, 0.12 + ((px - x) / w) * 0.2 + (fbm(px * 0.22, py * 0.22, s) - 0.5) * 0.3 + Math.max(0, (py - base + 7) / 7) * 0.32, px, py));
    k.R(x, top, 2, h, VIGA[1]); k.R(x + w - 2, top, 2, h, VIGA[2]); k.R(x, base - Math.round(h * 0.55), w, 1, VIGA[1]);
    if (frente) {
      const pts = [[x - 4, top + 1], [pm, top - a], [x + w + 4, top + 1]];
      rellena(k, [[x + 1, top], [pm, top - a + 2], [x + w - 1, top]], (px, py) => rampa(ENLUCIDO, 0.2 + (fbm(px * 0.2, py * 0.2, s + 2) - 0.5) * 0.3, px, py));
      k.R(pm - 2, top - a * 0.5, 4, 4, "#ffd27a"); k.R(pm - 3, top - a * 0.5 - 1, 6, 1, VIGA[2]); k.R(pm - 3, top - a * 0.5 + 4, 6, 1, VIGA[2]);
      for (let i = 0; i < a + 2; i++) { const f = i / (a + 2); [[x - 4 + (pm - x + 4) * f, top + 1 - a * f], [x + w + 4 - (x + w + 4 - pm) * f, top + 1 - a * f]].forEach(([px, py], l) => { k.R(px - 1, py - 1, 3, 3, rampa(techo, 0.15 + l * 0.45 + (i % 3 === 0 ? 0.15 : 0), px, py)); }); }
      k.R(x - 1, top + 1, w + 2, 2, mezcla(techo[4], "#000000", 0.2));
    } else {
      rellena(k, [[x - 5, top + 2], [x + 3, top - a], [x + w - 3, top - a], [x + w + 5, top + 2]], Det6.tejas(techo, { w: 5, h: 3, s, y0: top - a }));
      for (let px = x + 3; px < x + w - 3; px++) { k.P(px, top - a, techo[0]); k.P(px, top - a - 1, techo[3]); }
      k.R(x - 5, top + 2, w + 10, 1, techo[4]);
    }
    k.alfa(0.32, () => k.R(x, top + 2, w, 3, "#2a1a10"));
    ventanas.forEach((f) => ventanaF(k, Math.round(x + w * f), top + 6, 7, 7, { contra }));
    if (puerta) { const px = Math.round(x + w * puerta) - 4; k.R(px - 1, base - 13, 10, 13, VIGA[2]); rellena(k, [[px, base], [px, base - 12], [px + 8, base - 12], [px + 8, base]], madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 2, vertical: true, largo: 99, s: px })); k.P(px + 6, base - 6, "#e8c35a"); k.R(px - 2, base, 12, 2, "#a89880"); k.R(px - 2, base, 12, 1, "#c8baa2"); }
    sombraE(k, x + w / 2 + 3, base + 1, w * 0.62, 2.5, 0.42);
  }
  function molino(k, mx, base, hr) {
    rellena(k, [[mx - 11, base], [mx - 8, base - 46], [mx + 8, base - 46], [mx + 11, base]], (x, y) => piedra(["#f4ead6", "#e2d4b8", "#cbb896", "#ae9874", "#8a7656"], { tx: 6, ty: 4, s: 61 })(x, y) && rampa(["#fbf3e2", "#efe2c8", "#d8c6a4", "#bca684", "#98805e"], 0.15 + Math.abs((x - mx) / 11 + 0.4) * 0.5 + (celdas(x, y, 6, 4, 61).borde < 0.1 ? 0.3 : 0), x, y));
    k.elipse(mx, base - 30, 3, 3.5, VIGA[3]); k.R(mx - 3, base - 30, 6, 6, "#ffd27a"); k.R(mx - 4, base - 12, 8, 12, VIGA[2]); k.elipse(mx, base - 12, 4, 4, VIGA[2]);
    rellena(k, [[mx - 12, base - 45], [mx + 12, base - 45], [mx + 5, base - 58], [mx, base - 61], [mx - 5, base - 58]], Det6.tejas(TEJA_R, { w: 4, h: 3, s: 62, y0: base - 61 }));
    k.R(mx - 13, base - 45, 26, 1, TEJA_R[4]);
    const hx = mx, hy = base - 50, a0 = 0.5 + (hr || 0) * 0.37;
    for (let i = 0; i < 4; i++) {
      const a = a0 + (i * Math.PI) / 2, dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
      trazo(k, [[hx, hy], [hx + dx * 34, hy + dy * 34]], VIGA[2], 2, 1);
      const p = (t, l) => [hx + dx * t + nx * l, hy + dy * t + ny * l];
      rellena(k, [p(8, 1), p(34, 1), p(34, 8), p(8, 8)], (x, y) => { const t = (x - hx) * dx + (y - hy) * dy, l = (x - hx) * nx + (y - hy) * ny; return Math.round(t) % 5 === 0 || Math.round(l) % 4 === 0 ? VIGA[1] : rampa(LONA, 0.1 + l / 8 * 0.4, x, y); });
      trazo(k, [p(8, 8), p(34, 8)], VIGA[2]);
    }
    k.elipse(hx, hy, 2.5, 2.5, VIGA[3]); k.P(hx - 1, hy - 1, VIGA[0]);
  }
  function redForce(k, x, y, lit) {
    const CASCO = ["#9a3a30", "#7e2a24", "#62201c", "#461612"];
    rellena(k, [[x - 30, y - 8], [x + 34, y - 10], [x + 28, y + 2], [x - 24, y + 3]], (px, py) => rampa(CASCO, 0.1 + ((py - y + 10) / 13) * 0.8, px, py));
    rellena(k, [[x + 26, y - 10], [x + 40, y - 16], [x + 38, y - 12], [x + 28, y - 6]], (px, py) => CASCO[1]);
    k.R(x - 30, y - 9, 62, 1, "#d8b050"); k.R(x - 28, y - 5, 56, 1, "#c09038");
    for (let px = x - 22; px < x + 24; px += 6) k.P(px, y - 3, lit ? "#ffd27a" : "#2a1410");
    [[x - 16, 34], [x + 2, 40], [x + 20, 30]].forEach(([mx, hh]) => { k.R(mx, y - 9 - hh, 2, hh, "#5a3a24"); [0.3, 0.6].forEach((f) => { k.R(mx - 9, y - 9 - hh * (1 - f), 20, 1, "#5a3a24"); k.R(mx - 8, y - 8 - hh * (1 - f), 18, 2, "#ece4d0"); }); });
    k.R(x + 3, y - 50, 9, 6, "#1e1e24"); k.P(x + 7, y - 48, "#f4efe0"); k.P(x + 6, y - 47, "#f4efe0"); k.P(x + 8, y - 47, "#f4efe0"); k.P(x + 9, y - 49, "#c8301e");
    k.R(x - 32, y + 3, 70, 1, "#c8e4f0");
  }
  function faosho(k) {
    const { h, d } = cuando(k), lit = encendido(k);
    k.banda(CIELO, 0, 88);
    nubarron(k, 4, 40, 74, 15); nubarron(k, 108, 22, 44, 8); cirros(k, 6, 6, 30);
    rellena(k, [[176, 92], [206, 66], [236, 46], [262, 36], [282, 38], [304, 50], [324, 60], [324, 92]], (x, y) => { const n = fbm(x * 0.09, y * 0.11, 71), roca = n < 0.36 && y < 62; return rampa(roca ? ["#b8c4c0", "#9caca8", "#82948e", "#6a7c76"] : ["#9ccaa0", "#82b48a", "#6a9e76", "#558862", "#44724e"], 0.12 + n * 0.55 + (x - 262) / 200, x, y); });
    for (let i = 0; i < 90; i++) { const x = 180 + hash(i, 1, 72) * 140, y = 60 + hash(i, 2, 72) * 30; if (y < 92 - (x > 262 ? 0 : (262 - x) * 0.6)) continue; Det.cumulo ? 0 : 0; k.elipse(x, y, 3, 2.5, i % 3 ? "#6a9e76" : "#558862"); k.P(x - 1, y - 2, "#9ccaa0"); }
    k.agua(88, 120, MAR, "#a8d8f0", 0);
    for (let y = 89; y < 120; y++) for (let x = 0; x < W; x++) { const o = ruido(x * (0.12 - ((y - 88) / 32) * 0.07), y * 0.8, 23); if (o > 0.74) k.P(x, y, o > 0.87 ? "#c8eaf8" : "#62aee0"); else if (o < 0.2) k.P(x, y, MAR[4]); }
    if (d === 1) redForce(k, 64, 100, lit > 0.3);
    espejo(k, 88, 88, 120, { mezcla: 0.58, tinte: "#2c74b0", onda: 2, crestas: 0.06 });
    reflejo(k, 89, 120);
    for (let x = 4; x < 92; x += 11) { k.R(x, 108, 2, 14, VIGA[2]); k.R(x, 108, 1, 14, VIGA[0]); }
    rellena(k, [[-2, 104], [94, 104], [94, 109], [-2, 109]], madera(MAD, { paso: 2, largo: 14, s: 81, vertical: false }));
    k.R(-2, 104, 96, 1, MAD[0]); k.R(-2, 109, 96, 1, MAD[5]);
    [[40, 116, "#c0392b"], [74, 118, "#2f6fa8"]].forEach(([x, y, c]) => { rellena(k, [[x - 13, y - 4], [x + 13, y - 4], [x + 9, y + 2], [x - 9, y + 2]], (px, py) => rampa([mezcla(c, "#ffffff", 0.3), c, mezcla(c, "#000000", 0.3), mezcla(c, "#000000", 0.5)], ((py - y + 4) / 6) * 0.9, px, py)); k.R(x - 13, y - 5, 26, 1, "#f4efe0"); k.R(x, y - 18, 1, 13, VIGA[2]); rellena(k, [[x + 1, y - 18], [x + 10, y - 7], [x + 1, y - 7]], (px, py) => rampa(LONA, (px - x) / 10 * 0.6, px, py)); });
    rellena(k, [[196, 132], [214, 112], [240, 104], [270, 108], [300, 120], [324, 126], [324, 132]], (x, y) => rampa(VERDE_F, 0.15 + ((y - 104) / 28) * 0.5 + (hash(x, y, 83) - 0.5) * 0.14, x, y));
    molino(k, 252, 112, h);
    casaF(k, 96, 126, 30, 22, { techo: TEJA_A, frente: true, ventanas: [0.18], puerta: 0.68, contra: "#a84a3a", s: 3, chimenea: 0 });
    casaF(k, 186, 128, 34, 24, { techo: TEJA_R, ventanas: [0.18, 0.62], puerta: 0.42, contra: "#3e6e9a", s: 4, chimenea: 0.78 });
    casaF(k, 220, 132, 30, 26, { techo: TEJA_V, frente: true, ventanas: [0.2], puerta: 0.66, contra: "#a87a3a", s: 5, chimenea: 0 });
    casaF(k, 270, 134, 52, 28, { techo: TEJA_R, ventanas: [0.12, 0.42, 0.76], puerta: 0.6, contra: "#4e8a6a", s: 6, chimenea: 0.3 });
    casaF(k, 124, 132, 60, 40, { techo: TEJA_R, ventanas: [0.1, 0.42, 0.74], puerta: 0, contra: "#3e6e9a", s: 7, chimenea: 0.82 });
    rellena(k, [[120, 112], [188, 112], [184, 106], [124, 106]], Det6.tejas(TEJA_R, { w: 4, h: 2, s: 9, y0: 106 })); k.R(120, 112, 68, 1, TEJA_R[4]);
    [126, 154, 182].forEach((x) => { k.R(x, 113, 2, 19, VIGA[1]); k.R(x + 1, 113, 1, 19, VIGA[3]); });
    rellena(k, [[132, 101], [180, 101], [180, 92], [132, 92]], madera(["#8a5a32", "#764a28", "#603a1e", "#4a2a14", "#341c0c"], { paso: 3, largo: 99, s: 91 })); k.R(131, 91, 50, 1, VIGA[3]); k.R(131, 101, 50, 1, VIGA[3]);
    rotulo(k, 137, 94, "PARTYS BAR", "#ffe9a8");
    k.R(148, 116, 14, 16, VIGA[3]); rellena(k, [[149, 132], [149, 120], [161, 120], [161, 132]], (x, y) => (x === 155 ? VIGA[3] : y < 124 ? "#ffd27a" : madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 2, vertical: true, largo: 99, s: 93 })(x, y))); k.R(146, 132, 18, 2, "#a89880");
    if (d === 6) { k.R(168, 118, 10, 13, "#efe2c4"); k.R(168, 118, 10, 1, "#c8bea8"); k.R(170, 121, 6, 6, "#a8926a"); k.R(171, 122, 4, 2, "#e8c84a"); k.R(170, 128, 6, 1, "#5a4a3a"); }
    barril(k, 130, 134, 10, 12); barril(k, 139, 135, 9, 11); caja(k, 166, 134, 12, 8);
    farol(k, 129, 118); farol(k, 179, 118);
    rellena(k, [[-2, 122], [324, 124], [324, 180], [-2, 180]], (x, y) => rampa(VERDE_F, 0.12 + ((y - 122) / 58) * 0.42 + (fbm(x * 0.08, y * 0.2, 95) - 0.5) * 0.4 + (hash(x, y, 95) - 0.5) * 0.12, x, y));
    const cx = (f) => 156 + Math.sin(f * 2.6 + 0.4) * 22 * f, an = (f) => 6 + f * 26;
    for (let y = 132; y < H; y++) { const f = (y - 132) / 48, c = cx(f), w = an(f); for (let x = Math.round(c - w); x <= c + w; x++) { const e = Math.abs(x - c) / w; if (e > 0.94 && hash(x, y, 96) > 0.5) continue; k.P(x, y, rampa(["#ecd6a4", "#dcc08a", "#c8a874", "#ae8e5e", "#8e7048"], 0.2 + e * 0.35 + (fbm(x * 0.15, y * 0.3, 97) - 0.5) * 0.45, x, y)); } }
    for (let i = 0; i < 40; i++) { const f = hash(i, 1, 98), y = 132 + f * 48, x = cx(f) + (hash(i, 2, 98) - 0.5) * an(f) * 1.6; k.R(x, y, 1 + f * 2, 1, "#9a8258"); k.P(x, y - 1, "#f4e4be"); }
    briznas(k, 0, W, 124, [VERDE_F[5], VERDE_F[3], VERDE_F[1]], { n: 420, alto: 4, s: 99, y1: 180 });
    for (let i = 0; i < 90; i++) { const x = hash(i, 1, 100) * W, y = 128 + hash(i, 2, 100) * 52; if (Math.abs(x - cx((y - 132) / 48)) < an((y - 132) / 48) + 2) continue; const c = ["#ffffff", "#f6d84a", "#f08aa0", "#c8a0f0"][i % 4]; k.P(x, y, c); k.P(x + 1, y, c); k.P(x, y - 1, c); k.P(x + 1, y - 1, "#fff6c0"); }
    for (let x = 196; x < 262; x += 10) { k.R(x, 140 + (x - 196) * 0.06, 2, 9, VIGA[1]); k.P(x, 140 + (x - 196) * 0.06, VIGA[0]); }
    trazo(k, [[196, 143], [262, 147]], MAD[2]); trazo(k, [[196, 147], [262, 151]], MAD[3]);
    k.R(214, 128, 2, 22, HIERRO[2]); k.R(213, 149, 4, 2, HIERRO[3]); farol(k, 214, 124);
    Det6.arbol(k, 16, 164, 34, 26, 28, ["#b8e07a", "#8cc45c", "#68a446", "#4a8436", "#305e26"], { g: 7, s: 101, r: 5 });
    Det6.arbol(k, 314, 158, 26, 22, 26, ["#b8e07a", "#8cc45c", "#68a446", "#4a8436", "#305e26"], { g: 6, s: 103, r: 5 });
    luces(k, [{ x: 154, y: 118, r: 44, ry: 30, col: LUZ, f: lit }, { x: 214, y: 126, r: 30, ry: 26, col: LUZ, f: lit }, { x: 106, y: 112, r: 18, ry: 14, col: LUZ, f: lit * 0.6 }, { x: 290, y: 116, r: 22, ry: 14, col: LUZ, f: lit * 0.6 }]);
    if (Det.fiesta() === "navidad") for (let i = 0; i < 70; i++) k.crudo(hash(i, 1, 7) * 320, hash(i, 2, 7) * 176, 1, 1, "#ffffff");
  }

  const ADOBE = ["#fff2d6", "#f6e0b4", "#e8c894", "#d4ac74", "#b48a56", "#8a6640"], ROCA_A = ["#f2d4a0", "#e2bc84", "#cca06a", "#b08454", "#8e6840", "#6a4c2e"];
  const DUNA = ["#fae2a8", "#f0cc8a", "#e2b472", "#cc985a", "#ae7c44", "#8a5e30"], ORO = ["#fff0a8", "#ffd86a", "#e8b440", "#c08a28", "#8e6018"];
  function casaArena(k, x, base, w, h, { cupula = false, toldo = null, ventanas = [0.25, 0.7], puerta = 0.5, s = 1 } = {}) {
    const top = base - h;
    if (cupula) bola(k, x + w * 0.5, top - 2, w * 0.24, w * 0.22, (px, py) => (py > top ? null : rampa(ADOBE, 0.05 + ((px - x - w * 0.3) / (w * 0.5)) * 0.5 + ((py - top + w * 0.2) / (w * 0.3)) * 0.2, px, py)));
    rellena(k, [[x, base], [x, top], [x + w, top], [x + w, base]], (px, py) => rampa(ADOBE, 0.12 + ((px - x) / w) * 0.18 + (fbm(px * 0.2, py * 0.25, s) - 0.5) * 0.24 + Math.max(0, (py - base + 5) / 5) * 0.25 + (px > x + w - 4 ? 0.3 : 0), px, py));
    k.R(x - 1, top - 3, w + 2, 3, ADOBE[1]); k.R(x - 1, top - 3, w + 2, 1, ADOBE[0]); k.R(x - 1, top, w + 2, 1, ADOBE[4]);
    for (let px = x + 2; px < x + w - 2; px += 6) { k.R(px, top + 2, 2, 1, "#6a4a2e"); k.P(px, top + 3, ADOBE[4]); }
    ventanas.forEach((f) => { const vx = Math.round(x + w * f) - 2; k.elipse(vx + 2, top + 9, 2.5, 2.5, ADOBE[5]); k.R(vx - 0.5, top + 9, 5, 6, ADOBE[5]); k.elipse(vx + 2, top + 9, 1.5, 1.5, "#f6c460"); k.R(vx, top + 9, 4, 5, "#f6c460"); k.R(vx - 1, top + 15, 6, 1, ADOBE[0]); });
    if (puerta !== null) { const px = Math.round(x + w * puerta) - 3; k.elipse(px + 3, base - 9, 3.5, 3.5, ADOBE[5]); k.R(px - 0.5, base - 9, 7, 9, ADOBE[5]); k.elipse(px + 3, base - 9, 2.5, 2.5, "#4a3020"); k.R(px + 0.5, base - 9, 5, 9, "#4a3020"); }
    if (toldo) { for (let i = 0; i < w + 4; i += 3) { const c = Math.floor(i / 3) % 2 ? "#fff4e0" : toldo; k.R(x - 2 + i, base - 15, 3, 2, c); k.R(x - 2 + i, base - 13, 3, 1 + ((i / 3) % 2), mezcla(c, "#000000", 0.25)); } k.R(x - 2, base - 15, 1, 15, "#6a4a2e"); k.R(x + w + 1, base - 15, 1, 15, "#6a4a2e"); }
    sombraE(k, x + w / 2 + 4, base + 1, w * 0.62, 2.5, 0.4);
  }
  function palmera(k, x, base, h, { inc = 0.2, s = 1 } = {}) {
    const T = ["#d8b07a", "#b88e5a", "#966e42", "#74522e", "#523820"];
    sombraE(k, x + 6, base + 1, 10, 2.5, 0.4);
    for (let i = 0; i < h; i++) { const t = i / h, px = x + Math.sin(t * 1.8) * h * inc, g = 5 - t * 1.6; for (let j = 0; j < g; j++) k.P(px + j - g / 2, base - i, rampa(T, 0.08 + (j / g) * 0.62 + (i % 4 === 0 ? 0.28 : 0), px + j, base - i)); }
    const tx = x + Math.sin(1.8) * h * inc, ty = base - h, H = ["#a8dc78", "#82c05a", "#62a244", "#468434", "#2e6224"];
    for (let i = 0; i < 6; i++) { const a = -Math.PI * 0.9 + (i / 5) * Math.PI * 0.8; fronda(k, tx, ty - 1, Math.cos(a) * 0.9, Math.sin(a) * 0.7 - 0.2, 12 + hash(i, 3, s) * 4, [H[3], H[2], H[3], H[4]], { caida: 0.5, foliolo: 3 }); }
    for (let i = 0; i < 13; i++) { const a = -Math.PI * 1.05 + (i / 12) * Math.PI * 1.1 + (hash(i, 1, s) - 0.5) * 0.25; fronda(k, tx, ty, Math.cos(a), Math.sin(a) * 0.45 - 0.25, 17 + hash(i, 2, s) * 8, H, { caida: 1.1, foliolo: 4 }); }
    for (let i = 0; i < 6; i++) k.P(tx - 3 + i, ty + 2 + (i % 2), i % 2 ? "#c87a2a" : "#a8622a");
    k.elipse(tx, ty, 3, 2.2, T[3]); k.P(tx - 1, ty - 1, T[1]);
  }
  function alabesta(k) {
    const { h } = cuando(k), lit = encendido(k);
    k.banda(["#5aa0d8", "#8ec2e2", "#d6dcc8", "#f6dcac"], 0, 104);
    nubarron(k, -20, 30, 84, 12, ["#ffffff", "#f6eee0", "#e0d4c0"]); cirros(k, 6, 8, 40, "#fff8ec");
    rellena(k, [[-2, 104], [-2, 92], [40, 86], [90, 90], [140, 84], [200, 88], [250, 82], [300, 86], [322, 84], [322, 104]], (x, y) => rampa(["#f6e0b6", "#ecd2a4", "#e0c290"], 0.1 + ((y - 82) / 22) * 0.6 + (ruido(x * 0.05, y * 0.2, 3) - 0.5) * 0.3, x, y));
    const B = 12, cima = 62 + B, MES = [[50, 128], [62, 98 + B * 0.5], [76, 72 + B * 0.85], [92, cima], [228, cima], [244, 72 + B * 0.85], [258, 98 + B * 0.5], [270, 128]];
    rellena(k, MES, (x, y) => { const capa = Math.sin(y / 3.1 + Math.sin(x / 23) * 1.6), grieta = ruido(x * 0.3, y * 0.05, 7) > 0.78 ? 0.25 : 0, cara = x < 92 ? (92 - x) / 40 * -0.25 : x > 228 ? (x - 228) / 40 * 0.35 : 0; return rampa(ROCA_A, 0.3 + capa * 0.16 + grieta + cara + (hash(x, y, 7) - 0.5) * 0.1, x, y); });
    const pasos = Math.round((128 - cima - 2) / 4);
    for (let i = 0; i < pasos; i++) { const y = cima + 2 + i * 4, a = 12 + i * (39 / (pasos - 1)); rellena(k, [[160 - a, y], [160 + a, y], [160 + a + 1.3, y + 4], [160 - a - 1.3, y + 4]], (x, yy) => rampa(["#fff8e6", "#f6e8c8", "#e8d4a8", "#cfb484"], (yy - y) / 4 * 0.6 + (x > 160 + a - 3 ? 0.3 : 0), x, yy)); k.R(160 - a - 1, y + 3, 2 * a + 2, 1, "#b89a70"); }
    [[160 - 14, cima + 2, 160 - 54, 128], [160 + 14, cima + 2, 160 + 54, 128]].forEach(([ax, ay, bx, by]) => trazo(k, [[ax, ay], [bx, by]], "#f6e8c8", 2, 3));
    const PAL = ["#fffaf0", "#f6ecd6", "#e8d8b8", "#d2bc94", "#b49a70"];
    rellena(k, [[96, 64 + B], [96, 38 + B], [224, 38 + B], [224, 64 + B]], (x, y) => rampa(PAL, 0.12 + ((x - 96) / 128) * 0.25 + (fbm(x * 0.2, y * 0.3, 11) - 0.5) * 0.15 + (y > 58 + B ? 0.15 : 0), x, y));
    for (let x = 102; x < 220; x += 9) { if (Math.abs(x + 2 - 160) < 9) continue; k.elipse(x + 2.5, 47 + B, 3, 3, PAL[4]); k.R(x - 0.5, 47 + B, 6, 10, PAL[4]); k.elipse(x + 2.5, 47 + B, 2, 2, "#6a4a2e"); k.R(x + 0.5, 47 + B, 4, 9, "#6a4a2e"); k.P(x + 1, 48 + B, "#f6c460"); }
    k.elipse(160, 50 + B, 7, 7, PAL[4]); k.R(153, 50 + B, 14, 14, PAL[4]); k.elipse(160, 50 + B, 5.5, 5.5, "#4a3020"); k.R(154.5, 50 + B, 11, 14, "#4a3020"); k.R(159, 44 + B, 2, 20, "#3a2416");
    k.R(94, 36 + B, 132, 3, PAL[1]); k.R(94, 36 + B, 132, 1, PAL[0]); for (let x = 96; x < 224; x += 6) k.R(x, 32 + B, 3, 4, PAL[2]);
    [[104, 18 + B], [216, 18 + B]].forEach(([x, y]) => {
      rellena(k, [[x - 7, 64 + B], [x - 7, y + 8], [x + 7, y + 8], [x + 7, 64 + B]], (px, py) => rampa(PAL, 0.1 + Math.abs((px - x) / 7 + 0.4) * 0.45, px, py));
      for (let py = y + 14; py < 60 + B; py += 10) { k.elipse(x, py, 1.5, 1.5, "#6a4a2e"); k.R(x - 1.5, py, 3, 4, "#6a4a2e"); }
      bola(k, x, y + 4, 8, 9, (px, py) => (py > y + 8 ? null : rampa(ORO, 0.1 + ((px - x + 4) / 12) * 0.5 + ((py - y) / 12) * 0.2 + (Math.round(px - x) % 3 === 0 ? 0.15 : 0), px, py)));
      k.poli([[x - 1, y - 4], [x, y - 10], [x + 1, y - 4]], ORO[3]); k.R(x - 8, y + 8, 16, 2, PAL[3]);
    });
    bola(k, 160, 22 + B, 26, 22, (x, y) => { if (y > 34 + B) return null; const nx = (x - 160) / 26, ny = (y - 22 - B) / 22, nervio = Math.abs(Math.sin(Math.atan2(nx, 1 - ny) * 6)) < 0.12 ? 0.18 : 0; return rampa(ORO, 0.08 + (nx + 0.35) * 0.45 + ny * 0.15 + nervio, x, y); });
    rellena(k, [[156, 2 + B], [164, 2 + B], [161, -6 + B], [159, -6 + B]], () => ORO[2]); k.elipse(160, 2 + B, 3, 2, ORO[1]); k.R(159, -8 + B, 2, 6, ORO[3]);
    k.R(132, 33 + B, 56, 3, PAL[3]); k.R(132, 33 + B, 56, 1, PAL[1]);
    [[104, 4 + B], [216, 4 + B]].forEach(([x, y]) => { k.R(x, y - 10, 1, 12, "#5a4430"); Det.bandera(k, x + 1, y - 10, 9, 5, "#e8e0c8", "#c8bea8"); });
    const fila1 = [[-4, 34, 26, true, null], [30, 26, 20, false, "#c0392b"], [222, 28, 22, false, "#2f6fa8"], [252, 30, 28, true, null], [284, 40, 24, false, "#d8862a"]];
    fila1.forEach(([x, w, hh, cup, toldo], i) => casaArena(k, x, 126, w, hh, { cupula: cup, toldo, s: 20 + i, ventanas: w > 30 ? [0.2, 0.5, 0.78] : [0.3, 0.72], puerta: 0.5 }));
    casaArena(k, 58, 130, 30, 22, { s: 30, toldo: "#3f8a5a", ventanas: [0.25, 0.72] }); casaArena(k, 230, 132, 22, 16, { s: 31, ventanas: [0.5], puerta: null });
    rellena(k, [[-2, 126], [322, 126], [322, 180], [-2, 180]], (x, y) => rampa(DUNA, 0.18 + ((y - 126) / 54) * 0.25 + (fbm(x * 0.07, y * 0.2, 41) - 0.5) * 0.35 + (hash(x, y, 41) - 0.5) * 0.08, x, y));
    for (let i = 0; i < 60; i++) { const x = hash(i, 1, 42) * W, y = 130 + hash(i, 2, 42) * 48; k.R(x, y, 6 + hash(i, 3, 42) * 14, 1, DUNA[3]); k.R(x + 1, y - 1, 4 + hash(i, 3, 42) * 8, 1, DUNA[1]); }
    const duna = (x0, x1, cx, cima, pie) => {
      for (let x = x0; x <= x1; x++) {
        const t = (x - cx) / (x < cx ? cx - x0 : x1 - cx), top = cima + (pie - cima) * (t * t * (3 - 2 * Math.abs(t)) * Math.sign(t) * Math.sign(t)), crestaX = cx + (x < cx ? 0 : 0);
        for (let y = Math.round(top); y < H; y++) { const sombraLado = x > crestaX ? 0.32 : 0, riz = Math.sin(x * 0.35 + y * 1.4 + Math.sin(x * 0.05) * 3) > 0.82 ? 0.12 : 0; k.P(x, y, rampa(DUNA, 0.04 + ((y - top) / 40) * 0.2 + sombraLado + riz + (hash(x, y, 43) - 0.5) * 0.06, x, y)); }
        k.P(x, Math.round(top), DUNA[0]);
      }
    };
    duna(-2, 108, 34, 146, 182); duna(220, 322, 292, 142, 182);
    caja(k, 92, 140, 12, 8, ["#d8b080", "#c09a64", "#a88050", "#8a6238", "#6a4426", "#4c2e18"]); barril(k, 216, 140, 9, 11); barril(k, 206, 142, 9, 10);
    palmera(k, 112, 132, 40, { inc: 0.25, s: 1 }); palmera(k, 204, 134, 34, { inc: -0.2, s: 2 }); palmera(k, 300, 156, 48, { inc: -0.18, s: 3 }); palmera(k, 14, 162, 44, { inc: 0.2, s: 4 });
    [[50, 112], [236, 112]].forEach(([x, y]) => farol(k, x, y));
    luces(k, [{ x: 52, y: 116, r: 34, ry: 24, col: LUZ, f: lit }, { x: 238, y: 116, r: 34, ry: 24, col: LUZ, f: lit }, { x: 160, y: 60, r: 60, ry: 24, col: "#ffe0a0", f: lit * 0.5 }]);
    if (h === 23) {
      k.alfa(0.14, () => k.crudo(0, 0, 320, 180, "#1c2634"));
      k.alfa(0.55, () => { for (let i = 0; i < 150; i++) { const x = hash(i, 1, 51) * 330, y = hash(i, 2, 51) * 190 - 8; for (let j = 0; j < 6; j++) k.crudo(x - j * 0.3, y + j, 1, 1, "#c8d8ec"); } });
      k.actores.push({ tipo: "lluvia", n: 50, col: "#c8d8ec", largo: 6 });
      [[120, 160, 16], [200, 150, 12], [250, 170, 18], [160, 172, 12]].forEach(([x, y, r]) => k.alfa(0.5, () => k.elipse(x, y, r, 2, "#8aa6c8")));
    }
  }

  window.SitiosIt6 = window.SitiosIt6 || {};
  window.SitiosIt6.piratas = {
    1: ["La cubierta del Going Nerry", "El barco de la tripulación, con su cabeza de oveja", nerry, { ven: ["#ffd27a", "#f2d27a"], tinte: 0.2, dx: 70 }],
    2: ["El Thousand Sonny", "La cubierta de césped, el mástil con su sala redonda y el león de la proa, con su melena de sol", sonny, { ven: ["#ffd27a", "#f2d27a"], tinte: 0.2, dx: 70 }],
    3: ["La villa Faosho", "El pueblo del molino, frente al mar", faosho, { ven: ["#ffd27a", "#f2d27a"], tinte: 0.2 }],
    6: ["Alabesta", "La ciudad del desierto, con el palacio al fondo", alabesta, { tinte: 0.6, ven: ["#ffd27a", "#f6c460"], dx: 100 }],
  };
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo } = Det;
  const { bola, mezcla, encendido, hash, ruido, fbm, trazo, cuerda, madera, piedra, tejas, suelo3d, copa, briznas, sombra, sombraE, luces, espejo, bruma, pluma, fuego } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);
  const FUEGO = ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"];

  const MANDARINO = ["#9ad06a", "#6eb04e", "#4e9040", "#357030", "#1f4f22"], PIEDRA = ["#eee4cc", "#d8cbac", "#bcae8c", "#9c8e70", "#7a6e54"];
  const mandarina = (k, x, y, t) => { if (t > 1) { k.R(x, y, 2, 2, "#f39a26"); k.P(x, y, "#ffdc8c"); k.P(x + 1, y + 1, "#c4611a"); } else k.P(x, y, "#f39a26"); };
  function naranjo(k, x, base, rx, ry, s, { frutos = 1 } = {}) {
    sombraE(k, x + 3, base + 1, rx * 0.8, 2.5, 0.4);
    const cy = base - ry * 0.9 - 4;
    trazo(k, [[x, base], [x - 1, base - 4], [x + 1, cy + ry * 0.4]], "#6a4a2e", 3, 2);
    copa(k, x, cy, rx, ry, MANDARINO, { r: Math.max(3, rx / 4.5), s });
    const n = Math.round(((rx * ry) / 9) * frutos);
    for (let i = 0; i < n; i++) { const a = hash(i, 1, s) * Math.PI * 2, r = Math.sqrt(hash(i, 2, s)) * 0.85; mandarina(k, x + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry, rx > 13 ? 2 : 1); }
  }
  function molinillo(k, x, y, hr) {
    k.R(x, y, 1, 13, "#8a6a40"); k.P(x, y + 13, "#5a4430");
    const cols = ["#e8402a", "#f6d84a", "#3f8ae0", "#4ac06a"], a0 = (hr || 0) * 0.8;
    for (let i = 0; i < 4; i++) { const a = a0 + (i * Math.PI) / 2; k.poli([[x, y], [x + Math.cos(a) * 6, y + Math.sin(a) * 6], [x + Math.cos(a + 1) * 4, y + Math.sin(a + 1) * 4]], cols[i]); }
    k.P(x, y, "#ffffff");
  }
  function nerryLejos(k, x, y) {
    rellena(k, [[x - 11, y - 4], [x + 9, y - 4], [x + 7, y + 1], [x - 9, y + 1]], (px, py) => rampa(PAL.MAD, 0.2 + ((py - y + 4) / 5) * 0.6, px, py));
    k.R(x - 11, y - 5, 20, 1, PAL.MAD[0]); k.R(x - 12, y - 7, 5, 3, PAL.MAD[1]); k.P(x - 11, y - 6, "#f2d27a");
    k.R(x - 1, y - 24, 1, 20, PAL.MAD_O[3]); k.R(x - 8, y - 21, 15, 1, PAL.MAD_O[3]);
    rellena(k, [[x - 7, y - 20], [x + 6, y - 20], [x + 7, y - 8], [x - 8, y - 8]], (px, py) => rampa(PAL.LONA, 0.1 + (Math.abs(px - x) / 9) * 0.5, px, py));
    k.R(x - 2, y - 16, 3, 2, "#1c1c22"); k.P(x - 1, y - 17, "#e8c35a"); k.R(x - 3, y - 13, 5, 1, "#1c1c22");
    k.R(x - 1, y - 27, 3, 2, "#1c1c22");
    esfera(k, x + 11, y - 7, 2.6, 2.6, PAL.LANA); k.R(x + 12, y - 7, 3, 2, "#fbe9c6"); k.P(x + 13, y - 7, "#1e1e24");
    k.R(x - 13, y + 1, 23, 1, "#c8e4f0");
  }
  function cacoyosi(k) {
    const { h } = cuando(k), lit = encendido(k), noche = k.luz && k.luz.noche;
    k.banda(PAL.CIELO, 0, 84);
    nubarron(k, 120, 22, 96, 18); nubarron(k, 244, 44, 66, 11); cirros(k, 5, 6, 32);
    rellena(k, [[128, 84], [138, 79], [152, 76], [166, 78], [178, 84]], (x, y) => rampa(["#a8c2d0", "#92b0c2", "#7e9cb2"], ((x - 128) / 50) * 0.6 + ((y - 76) / 8) * 0.3, x, y));
    P.mar(k, 84, 126, PAL.MAR, { s: 33 });
    reflejo(k, 85, 126);
    nerryLejos(k, 168, 103);
    rellena(k, [[198, 126], [206, 114], [220, 105], [240, 97], [264, 89], [290, 82], [322, 77], [322, 126]], (x, y) => rampa(PAL.VERDE, 0.2 + ((y - 77) / 49) * 0.4 + (fbm(x * 0.1, y * 0.14, 34) - 0.5) * 0.4, x, y));
    for (let x = 196; x < 268; x++) { const y = 126 - (x - 198) * 0.46 - Math.max(0, x - 240) * 0.05; for (let j = 0; j < 3; j++) k.P(x - j, y + j, ["#f6e6c0", "#ead6a6", "#d8c290"][j]); if (Det.trama(x, y) < 0.5) k.P(x - 3, y + 3, "#ffffff"); }
    [[266, 92, 16, 9, PAL.TEJA_R, 11, false], [290, 86, 20, 10, PAL.TEJA_A, 12, false], [240, 102, 16, 9, PAL.TEJA_A, 13, true], [302, 103, 22, 12, PAL.TEJA_R, 14, false], [258, 110, 22, 12, PAL.TEJA_R, 15, true], [226, 116, 18, 10, PAL.TEJA_R, 16, false], [282, 118, 28, 13, PAL.TEJA_A, 17, false]]
      .forEach(([x, b, w, hh, techo, s, frente]) => P.casita(k, x, b, w, hh, { techo, s, frente, ventanas: w > 20 ? [0.18, 0.62] : [0.25], puerta: w > 20 ? 0.42 : 0.7 }));
    P.palmera(k, 254, 100, 18, { inc: 0.2, s: 1 }); P.palmera(k, 316, 98, 22, { inc: -0.2, s: 2 }); P.palmera(k, 218, 120, 16, { inc: 0.15, s: 3 });
    rellena(k, [[-2, 56], [24, 53], [56, 58], [84, 68], [108, 82], [124, 96], [136, 110], [144, 126], [-2, 126]], (x, y) => rampa(PAL.VERDE, 0.12 + ((y - 53) / 73) * 0.42 + (fbm(x * 0.09, y * 0.12, 35) - 0.5) * 0.4, x, y));
    naranjo(k, 6, 64, 12, 10, 21); naranjo(k, 68, 70, 12, 10, 22); naranjo(k, 38, 56, 10, 8, 23);
    const cx0 = 12, cb = 92, cw = 42, ch = 21, ct = cb - ch;
    rellena(k, [[cx0 + 30, ct - 14], [cx0 + 35, ct - 14], [cx0 + 35, ct], [cx0 + 30, ct]], Det6.ladrillo(["#cc8060", "#ac6248", "#8c4a36", "#602e20"], { w: 4, h: 2, s: 3 })); k.R(cx0 + 29, ct - 15, 7, 2, "#5e4a40");
    rellena(k, [[cx0, cb], [cx0, ct], [cx0 + cw, ct], [cx0 + cw, cb]], (x, y) => rampa(PAL.ENLUCIDO, 0.1 + ((x - cx0) / cw) * 0.22 + (fbm(x * 0.22, y * 0.22, 36) - 0.5) * 0.3 + Math.max(0, (y - cb + 6) / 6) * 0.3, x, y));
    k.R(cx0, ct, 2, ch, PAL.VIGA[1]); k.R(cx0 + cw - 2, ct, 2, ch, PAL.VIGA[2]);
    rellena(k, [[cx0 - 5, ct + 2], [cx0 + 4, ct - 12], [cx0 + cw - 4, ct - 12], [cx0 + cw + 5, ct + 2]], tejas(PAL.TEJA_R, { w: 5, h: 3, s: 37, y0: ct - 12 }));
    for (let x = cx0 + 4; x < cx0 + cw - 4; x++) { k.P(x, ct - 12, PAL.TEJA_R[0]); k.P(x, ct - 13, PAL.TEJA_R[3]); }
    k.R(cx0 - 5, ct + 2, cw + 10, 1, PAL.TEJA_R[4]); k.alfa(0.3, () => k.R(cx0, ct + 3, cw, 2, "#2a1a10"));
    [[cx0 + 6, ct + 7], [cx0 + 29, ct + 7]].forEach(([x, y]) => { k.R(x - 1, y - 1, 9, 8, PAL.VIGA[2]); k.R(x, y, 7, 6, "#f2d27a"); k.R(x + 3, y, 1, 6, PAL.VIGA[1]); k.R(x, y + 3, 7, 1, PAL.VIGA[1]); k.R(x - 1, y + 7, 9, 2, PAL.VIGA[1]); for (let i = 0; i < 9; i++) k.P(x - 1 + i, y + 6, ["#e8402a", "#3f8a3a", "#f39a26", "#3f8a3a"][i % 4]); });
    k.R(cx0 + 18, cb - 12, 8, 12, PAL.VIGA[2]); rellena(k, [[cx0 + 19, cb], [cx0 + 19, cb - 11], [cx0 + 25, cb - 11], [cx0 + 25, cb]], madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 2, vertical: true, largo: 99, s: 38 })); k.P(cx0 + 23, cb - 6, "#e8c35a");
    rellena(k, [[cx0 + 14, cb - 14], [cx0 + 30, cb - 14], [cx0 + 32, cb - 11], [cx0 + 12, cb - 11]], tejas(PAL.TEJA_R, { w: 3, h: 2, s: 39, y0: cb - 14 })); k.R(cx0 + 14, cb - 11, 1, 11, PAL.VIGA[1]); k.R(cx0 + 29, cb - 11, 1, 11, PAL.VIGA[1]);
    k.R(cx0 + 2, cb - 4, 10, 1, PAL.MAD[2]); k.R(cx0 + 3, cb - 3, 1, 3, PAL.MAD[4]); k.R(cx0 + 10, cb - 3, 1, 3, PAL.MAD[4]);
    sombraE(k, cx0 + cw / 2 + 3, cb + 1, cw * 0.6, 2.5, 0.4);
    k.R(cx0 + 66, 76, 1, 17, PAL.VIGA[1]); cuerda(k, cx0 + cw, 76, cx0 + 66, 77, 3, "#e8e0d0");
    [[cx0 + 46, "#fffaf0", 5, 6], [cx0 + 52, "#f39a26", 5, 7], [cx0 + 58, "#3f6fb8", 4, 5], [cx0 + 63, "#fffaf0", 3, 4]].forEach(([x, c, w, hh], i) => { const y = 77 + Math.sin(((x - cx0 - cw) / 24) * Math.PI) * 3; k.R(x, y, w, hh, c); k.R(x, y, w, 1, mezcla(c, "#000000", 0.15)); if (i === 1) k.R(x, y + 2, w, 1, "#ffffff"); });
    naranjo(k, 84, 98, 11, 9, 24); naranjo(k, 108, 106, 11, 9, 25); naranjo(k, 130, 116, 10, 8, 26);
    naranjo(k, 56, 108, 11, 9, 29); naranjo(k, 80, 116, 11, 9, 30); naranjo(k, 104, 122, 10, 8, 47); naranjo(k, 32, 116, 11, 9, 49);
    rellena(k, [[100, 116], [322, 112], [322, 124], [100, 126]], piedra(["#eee4cc", "#d8cbac", "#bcae8c", "#9c8e70", "#7a6e54"], { tx: 6, ty: 3, s: 31 }));
    for (let x = 100; x < W; x++) { const y = Math.round(116 - (x - 100) * 0.018); k.P(x, y, hash(x, 1, 31) > 0.5 ? PAL.VERDE[2] : PAL.VERDE[3]); if (hash(x, 2, 31) > 0.7) k.P(x, y - 1, PAL.VERDE[1]); }
    rellena(k, [[-2, 124], [322, 123], [322, 180], [-2, 180]], (x, y) => rampa(PAL.VERDE, 0.1 + ((y - 123) / 57) * 0.38 + (fbm(x * 0.07, y * 0.18, 40) - 0.5) * 0.36 + (hash(x, y, 40) - 0.5) * 0.1, x, y));
    const camX = (y) => 34 + (y - 92) * 0.62 + Math.sin(y / 14) * 6, camW = (y) => 2 + (y - 92) * 0.16;
    for (let y = 92; y < H; y++) { const c = camX(y), w = camW(y); for (let x = Math.round(c - w); x <= c + w; x++) { const e = Math.abs(x - c) / w; if (e > 0.9 && hash(x, y, 41) > 0.5) continue; k.P(x, y, rampa(["#ecd6a4", "#dcc08a", "#c8a874", "#ae8e5e", "#8e7048"], 0.2 + e * 0.35 + (fbm(x * 0.15, y * 0.3, 42) - 0.5) * 0.45, x, y)); } }
    briznas(k, 0, W, 124, [PAL.VERDE[5], PAL.VERDE[3], PAL.VERDE[1]], { n: 380, alto: 4, s: 43, y1: 180 });
    for (let i = 0; i < 70; i++) { const x = hash(i, 1, 44) * W, y = 128 + hash(i, 2, 44) * 50; if (Math.abs(x - camX(y)) < camW(y) + 2) continue; if (i % 3 === 0) mandarina(k, x, y, 2); else { const c = ["#ffffff", "#f6d84a", "#f08aa0"][i % 3]; k.P(x, y, c); k.P(x + 1, y, c); k.P(x, y - 1, "#fff6c0"); } }
    naranjo(k, 272, 131, 12, 10, 48);
    const tx = 244, tb = 136;
    sombraE(k, tx + 3, tb + 1, 9, 2, 0.45);
    rellena(k, [[tx - 5, tb], [tx - 5, tb - 9], [tx - 4, tb - 11], [tx - 2, tb - 12], [tx + 2, tb - 12], [tx + 4, tb - 11], [tx + 5, tb - 9], [tx + 5, tb]], (x, y) => rampa(PIEDRA, 0.12 + ((x - tx + 5) / 10) * 0.5 + (hash(x, y, 45) - 0.5) * 0.14, x, y));
    k.R(tx, tb - 10, 1, 7, PIEDRA[4]); k.R(tx - 2, tb - 8, 5, 1, PIEDRA[4]); k.R(tx - 6, tb, 13, 2, PIEDRA[3]);
    [[-4, "#f39a26"], [-2, "#ffffff"], [1, "#e8402a"], [3, "#f39a26"], [5, "#ffffff"]].forEach(([dx, c]) => { k.P(tx + dx, tb + 1, "#3f8a3a"); k.P(tx + dx, tb, c); });
    molinillo(k, tx + 9, tb - 14, h);
    naranjo(k, 300, 160, 22, 18, 27); naranjo(k, 18, 174, 26, 22, 28);
    trazo(k, [[48, 178], [38, 132]], "#a07a50", 1); trazo(k, [[54, 178], [44, 132]], "#a07a50", 1); for (let y = 136; y < 178; y += 6) { const t = (y - 132) / 46; k.R(38 + t * 10, y, 7, 1, "#8a6440"); }
    P.caja(k, 58, 162, 14, 10); for (let i = 0; i < 9; i++) mandarina(k, 60 + (i % 5) * 2.4, 150 + Math.floor(i / 5) * 1.6, 2);
    sombraE(k, 66, 176, 9, 2, 0.4); rellena(k, [[58, 168], [74, 168], [72, 176], [60, 176]], (x, y) => ((x + y) % 3 === 0 ? "#8a6a3a" : rampa(["#e2c08a", "#c8a06a", "#a88050"], (y - 168) / 8 * 0.7, x, y))); for (let i = 0; i < 7; i++) mandarina(k, 60 + i * 2, 166 + (i % 2), 2);
    luces(k, [{ x: cx0 + 10, y: ct + 10, r: 20, ry: 14, col: LUZ, f: lit }, { x: cx0 + 33, y: ct + 10, r: 20, ry: 14, col: LUZ, f: lit }, { x: 270, y: 108, r: 40, ry: 16, col: LUZ, f: lit * 0.5 }]);
    if ([7, 8, 13, 14, 20, 21].includes(h)) Det.humo(k, cx0 + 32, ct - 17, "#eef0f4", 0.4, 6);
    if (noche) for (let i = 0; i < 22; i++) { const x = 70 + hash(i, 1, 46) * 230, y = 96 + hash(i, 2, 46) * 70; k.crudo(x, y, 1, 1, "#e8f87a"); if (i % 3 === 0) k.alfa(0.4, () => k.crudo(x - 1, y - 1, 3, 3, "#c8e85a")); }
  }

  function funeral(k) {
    k.banda(["#4a5472", "#56607e", "#626c8a", "#6e7896", "#7a84a0"], 0, 118);
    for (let y = 0; y < 104; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.016, y * 0.045, 51, 4); if (n > 0.48) k.P(x, y, rampa(["#a4acc4", "#9098b2", "#7c84a0", "#68708c"], 0.1 + (0.74 - n) * 1.7, x, y)); }
    P.mar(k, 118, 180, ["#4a5a7a", "#405070", "#364464", "#2c3858", "#222c4a"], { s: 52, cresta: "#7a8cac", medio: "#5a6a8a", espejo: false });
    const MAD = PAL.MAD, MAD_O = PAL.MAD_O;
    const casco = [[44, 70], [86, 70], [86, 95], [196, 96], [210, 90], [217, 93], [212, 104], [200, 116], [186, 122], [62, 122], [50, 114], [46, 100]];
    rellena(k, casco, (x, y) => { const tabla = Math.floor((y - 70) / 3), en = (y - 70) % 3; return en === 0 ? MAD[5] : rampa(y > 112 ? MAD_O : MAD, 0.22 + (hash(tabla, Math.floor((x + tabla * 13) / 26), 53) - 0.5) * 0.3 + ((y - 70) / 52) * 0.35 + (x < 86 ? -0.06 : 0), x, y); });
    for (let x = 86; x < 212; x++) { const y = x < 196 ? 95 : 95 - (x - 196) * 0.4; k.P(x, y, MAD[0]); k.P(x, y + 1, MAD[2]); }
    k.R(44, 70, 42, 1, MAD[0]); k.R(85, 70, 1, 25, MAD[4]);
    for (let x = 96; x < 196; x += 16) { k.R(x, 103, 4, 3, "#2a1a10"); k.P(x, 103, MAD_O[4]); }
    k.R(42, 68, 46, 2, MAD_O[1]); for (let x = 44; x < 88; x += 5) k.R(x, 62, 2, 6, MAD_O[2]); k.R(42, 61, 46, 2, MAD_O[1]); k.R(42, 61, 46, 1, MAD[1]);
    [[56, 82], [72, 82]].forEach(([x, y]) => { k.elipse(x, y, 4, 4, "#4a2e18"); k.elipse(x, y, 3, 3, "#ffb43a"); k.P(x - 1, y - 1, "#fff0b0"); });
    trazo(k, [[128, 96], [131, 102], [126, 108], [131, 114], [128, 122]], "#120a06", 2, 1); trazo(k, [[129, 97], [132, 103], [127, 109], [132, 115], [129, 121]], "#ff8a2a", 1);
    P.palo(k, 125, 10, 96, 5, MAD_O, [28, 80]);
    P.verga(k, 90, 166, 24, 3, MAD_O);
    const quema = (x, y) => y > 34 && (x < 112 || x > 142 || y > 64) && fbm(x * 0.07, y * 0.09, 55) > 0.6;
    P.velaCuadra(k, 94, 160, 27, 74, { hincha: 3, quema });
    P.jollyRoger(k, 127, 46, 0.5);
    for (let y = 27; y < 80; y++) for (let x = 88; x < 166; x++) { const n = fbm(x * 0.07, y * 0.09, 55); if (y > 34 && (x < 112 || x > 142 || y > 64) && n > 0.57 && n <= 0.6 && x > 92 && x < 162) k.crudo(x, y, 1, 1, n > 0.585 ? "#ffd06a" : "#ff8a2a"); }
    k.R(127, 2, 9, 6, "#1c1c22"); k.P(130, 4, "#f4efe0"); k.P(131, 4, "#e8c35a"); k.R(126, 2, 1, 9, MAD_O[3]);
    cuerda(k, 126, 12, 46, 60, 4, "#3a2a1e"); cuerda(k, 128, 12, 206, 86, 6, "#3a2a1e");
    P.oveja(k, 212, 66, 0.8);
    pluma(k, 118, 34, 34, 32, ["#a49aa4", "#8a8290", "#70687a", "#585266"], { s: 56, viento: -0.7 });
    [[64, 70, 30, 34], [82, 96, 18, 26], [102, 96, 22, 34], [144, 96, 22, 30], [164, 96, 18, 24], [184, 95, 14, 18], [152, 74, 16, 16], [102, 62, 12, 12]].forEach(([x, b, w, hh], i) => fuego(k, x, b, w, hh, { s: 57 + i }));
    P.chispas(k, 122, 66, 150, 66, 80, 58);
    espejo(k, 122, 122, 142, { x0: 30, x1: 240, mezcla: 0.35, tinte: "#2a2030", onda: 3, oscuro: 0.92, crestas: 0.1, s: 59 });
    for (let i = 0; i < 70; i++) { const y = 123 + hash(i, 1, 60) * 18, x = 58 + hash(i, 2, 60) * 150, w = 2 + hash(i, 3, 60) * 6; k.crudo(x, y, w, 1, FUEGO[2 + Math.floor(hash(i, 4, 60) * 3)]); }
    const lejos = (x) => 138 - Math.pow(Math.max(0, x - 236) / 82, 2) * 22, cerca = (x) => 174 - Math.pow(Math.max(0, x - 236) / 82, 2) * 30;
    for (let x = -2; x < W; x++) {
      const a = Math.round(lejos(x)), b = Math.round(cerca(x));
      for (let y = a; y < b; y++) {
        const forro = y < a + 8, fila = Math.floor((y - a - 8) / (3 + (y - a) * 0.06));
        if (forro) k.P(x, y, (x + 4) % 16 === 0 ? MAD_O[4] : rampa(MAD_O, 0.2 + ((y - a) / 8) * 0.45 + ((y - a) % 3 === 0 ? 0.2 : 0), x, y));
        else k.P(x, y, Math.abs(((x - 160) * (1 + (y - a) * 0.004)) % 34) < 1.2 ? MAD_O[3] : (y - a - 8) % (3 + Math.floor((y - a) * 0.06)) === 0 ? MAD_O[4] : rampa(MAD, 0.32 + (hash(fila, Math.floor((x + fila * 17) / 44), 61) - 0.5) * 0.3 + ((y - a) / 40) * 0.2, x, y));
      }
      k.P(x, a - 2, MAD[0]); k.P(x, a - 1, MAD[1]); k.P(x, a, MAD[3]);
      for (let j = 0; j < 6; j++) k.P(x, b + j, j === 0 ? MAD[0] : j < 3 ? MAD[1] : j < 5 ? MAD[3] : MAD_O[4]);
      for (let y = b + 6; y < Math.min(H, 178); y++) k.P(x, y, rampa(MAD_O, 0.3 + ((y - b) / 30) * 0.5 + ((y - b) % 4 === 0 ? 0.25 : 0), x, y));
    }
    rellena(k, [[308, 150], [312, 112], [318, 104], [322, 104], [322, 168], [314, 170]], (x, y) => rampa(MAD, 0.2 + ((x - 308) / 14) * 0.5 + ((y - 104) / 66) * 0.2, x, y));
    trazo(k, [[22, 141], [150, 145]], MAD_O[1], 2); trazo(k, [[150, 145], [168, 146]], MAD_O[2], 3); trazo(k, [[176, 140], [270, 141]], MAD_O[1], 2); trazo(k, [[270, 141], [286, 141]], MAD_O[2], 3);
    P.rollo(k, 262, 160, 7); P.barril(k, 24, 168, 10, 12);
    k.R(12, 94, 2, 50, PAL.VIGA[2]); P.farol(k, 11, 90);
    luces(k, [{ x: 128, y: 80, r: 170, ry: 100, col: "#ff9040", f: 0.9, p: 1.3 }, { x: 127, y: 52, r: 54, ry: 36, col: "#ffb060", f: 0.75 }, { x: 150, y: 158, r: 190, ry: 30, col: "#ff9a50", f: 0.45 }, { x: 12, y: 92, r: 36, ry: 32, col: "#ffcf7a", f: 0.9 }]);
    for (let x = -2; x < 316; x++) { if (hash(x, 1, 62) > 0.4) k.crudo(x, Math.round(lejos(x)) - 3, 1, 1, "#d8e0ee"); if (hash(x, 2, 62) > 0.45) k.crudo(x, Math.round(cerca(x)) - 1, 1, 1, "#d8e0ee"); }
    for (let i = 0; i < 80; i++) { const x = hash(i, 1, 63) * 300, y = lejos(x) + 10 + hash(i, 2, 63) * (cerca(x) - lejos(x) - 12); k.crudo(x, y, 1, 1, "#aab4c8"); }
    P.nieve(k, 260, 64);
  }

  const ROJO_T = ["#d0604e", "#b44a3c", "#963a30", "#782c26", "#5a201c"], ACERO = ["#a4b0bc", "#84909c", "#68747f", "#4e5862", "#363e46"];
  const TIBURON = ["#a8c0d4", "#8aa4bc", "#6e8aa4", "#56708a", "#405870"], VIENTRE = ["#f6f8fa", "#e0e6ec", "#c6ced8"];
  const OLA = ["#c8ece4", "#9cd0c8", "#74b2ac", "#56968f", "#3e7a76", "#2c5e5c"], MAD_N = ["#a08a70", "#8a7660", "#746250", "#5e4e40", "#483c32", "#2e2620"];
  const VENT_T = "#ffe8a0";
  function vagon(k, x0, x1, top, base, s) {
    for (let x = x0; x < x1; x++) for (let y = top; y < top + 6; y++) k.P(x, y, rampa(ACERO, 0.12 + ((y - top) / 6) * 0.65 + (x % 9 === 0 ? 0.12 : 0), x, y));
    k.R(x0 + 3, top - 1, x1 - x0 - 6, 1, ACERO[1]);
    rellena(k, [[x0, top + 6], [x1, top + 6], [x1, base - 6], [x0, base - 6]], (x, y) => rampa(ROJO_T, 0.18 + ((y - top) / (base - top)) * 0.55 + ((x - x0) % 25 === 0 ? 0.3 : 0) + (hash(x, y, s) - 0.5) * 0.08, x, y));
    k.R(x0, base - 19, x1 - x0, 2, "#ece2c8"); k.R(x0, base - 17, x1 - x0, 1, "#b8a888");
    for (let x = x0 + 6; x < x1 - 8; x += 12) { k.R(x - 1, top + 9, 9, 13, ROJO_T[4]); k.R(x, top + 10, 7, 11, VENT_T); k.R(x, top + 10, 7, 1, "#fff6c8"); k.R(x + 3, top + 10, 1, 11, "#c8a860"); k.R(x, top + 15, 7, 1, "#c8a860"); }
    for (let x = x0 + 2; x < x1; x += 5) { k.P(x, top + 7, ROJO_T[0]); k.P(x, base - 8, ROJO_T[0]); }
    k.R(x0, base - 6, x1 - x0, 6, ACERO[4]); k.R(x0, base - 6, x1 - x0, 1, ACERO[2]);
    k.R(x0, top + 6, 1, base - top - 12, ROJO_T[0]); k.R(x1 - 1, top + 6, 1, base - top - 12, ROJO_T[4]);
  }
  function rocketman(k) {
    vagon(k, -8, 94, 82, 128, 71);
    k.R(94, 90, 5, 32, "#2a2a30"); for (let y = 90; y < 122; y += 3) k.R(94, y, 5, 1, "#4a4a54");
    vagon(k, 99, 197, 82, 128, 72);
    k.R(197, 92, 4, 30, "#2a2a30");
    rellena(k, [[201, 76], [236, 76], [236, 122], [201, 122]], (x, y) => rampa(ROJO_T, 0.15 + ((y - 76) / 46) * 0.55 + (x === 201 ? -0.2 : 0), x, y));
    for (let x = 198; x < 240; x++) for (let y = 70; y < 76; y++) k.P(x, y, rampa(ACERO, 0.1 + ((y - 70) / 6) * 0.7, x, y));
    [[206, 82], [221, 82]].forEach(([x, y]) => { k.R(x - 1, y - 1, 11, 14, ROJO_T[4]); k.R(x, y, 9, 12, VENT_T); k.R(x, y, 9, 1, "#fff6c8"); });
    k.R(201, 104, 35, 2, "#ece2c8"); k.R(201, 122, 35, 6, ACERO[4]);
    for (let x = 236; x < 290; x++) for (let y = 90; y < 122; y++) k.P(x, y, rampa(ACERO, 0.08 + Math.abs((y - 101) / 16) * 0.7 + (hash(x, y, 73) - 0.5) * 0.08, x, y));
    [244, 262, 280].forEach((x) => { k.R(x, 90, 2, 32, ACERO[0]); k.R(x + 2, 90, 1, 32, ACERO[3]); });
    for (let x = 238; x < 290; x += 4) { k.P(x, 93, ACERO[0]); k.P(x, 118, ACERO[3]); }
    esfera(k, 250, 90, 6, 4, ACERO, -0.1);
    rellena(k, [[264, 90], [274, 90], [275, 66], [263, 66]], (x, y) => rampa(ACERO, 0.3 + ((x - 263) / 12) * 0.6, x, y));
    rellena(k, [[259, 66], [279, 66], [277, 59], [261, 59]], (x, y) => rampa(ACERO, 0.15 + ((x - 259) / 20) * 0.7, x, y));
    k.R(261, 58, 16, 1, ACERO[3]);
    rellena(k, [[276, 90], [283, 71], [289, 69], [293, 90]], (x, y) => rampa(TIBURON, 0.15 + ((x - 276) / 17) * 0.6, x, y));
    const vientre = (x) => 104 + (x - 290) * 0.05;
    rellena(k, [[288, 86], [300, 84], [311, 89], [319, 97], [319, 106], [310, 114], [296, 122], [288, 122]], (x, y) => (y > vientre(x) ? rampa(VIENTRE, 0.1 + ((y - vientre(x)) / 16) * 0.8, x, y) : rampa(TIBURON, 0.1 + ((y - 84) / 22) * 0.5 + ((x - 288) / 32) * 0.15, x, y)));
    trazo(k, [[294, 111], [304, 109], [314, 106], [319, 104]], "#2a1a1e");
    for (let x = 296; x < 318; x += 3) { const y = 111 - (x - 294) * 0.28; k.poli([[x, y], [x + 2, y], [x + 1, y + 2]], "#ffffff"); }
    for (let x = 297; x < 316; x += 3) { const y = 110 - (x - 294) * 0.28; k.poli([[x, y], [x + 2, y], [x + 1, y - 2]], "#ffffff"); }
    k.elipse(304, 96, 2, 2, "#101418"); k.P(303, 95, "#ffffff");
    [289, 292, 295].forEach((x) => trazo(k, [[x, 95], [x - 1, 103]], TIBURON[4]));
    rellena(k, [[292, 116], [304, 118], [296, 128]], (x, y) => rampa(TIBURON, 0.3 + ((y - 116) / 12) * 0.5, x, y));
    k.R(312, 88, 4, 4, "#fff6c8"); k.P(313, 89, "#ffffff");
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) trazo(k, [[252, 124], [252 + Math.cos(a) * 13, 124 + Math.sin(a) * 13]], "#7a2a20");
    for (let a = 0; a < Math.PI * 2; a += 0.02) { k.P(252 + Math.cos(a) * 13, 124 + Math.sin(a) * 13, "#d04a3a"); k.P(252 + Math.cos(a) * 12, 124 + Math.sin(a) * 12, "#a83a2c"); }
    k.elipse(252, 124, 3, 3, ACERO[2]);
  }
  function aquaLaguna(k) {
    const cresta = (x) => (x < 188 ? 30 + Math.sin(x / 37) * 4 + Math.sin(x / 13) * 1.5 : 30 + Math.pow((x - 188) / 58, 1.8) * 74);
    for (let x = -2; x < 248; x++) {
      const top = Math.round(cresta(x));
      for (let y = top; y < 104; y++) { const t = (y - top) / Math.max(1, 104 - top), veta = t > 0.1 && Math.sin(x * 0.23 + Math.sin(y * 0.05) * 2.6) > 0.8 ? -0.25 : 0; k.P(x, y, rampa(OLA, t * 0.9 + veta + (fbm(x * 0.05, y * 0.08, 74) - 0.5) * 0.2, x, y)); }
    }
    k.elipse(206, 43, 8, 7, OLA[5]); k.elipse(207, 44, 5, 4, "#1e4448");
    for (let x = -2; x < 248; x++) { const top = cresta(x), g = x < 188 ? 9 : Math.max(2, 9 - (x - 188) / 7); for (let j = -3; j < g; j++) { const v = ruido(x * 0.2, j * 0.5 + x * 0.03, 75); if (v > 0.25 + ((j + 3) / (g + 3)) * 0.45) k.P(x, top + j, v > 0.55 ? "#ffffff" : "#d8f0ec"); } }
    for (let a = Math.PI; a < Math.PI * 2 + 0.7; a += 0.015) { const t = (a - Math.PI) / (Math.PI + 0.7), r = 13 - t * 5, x = 204 + Math.cos(a) * r, y = 40 + Math.sin(a) * r, g = 3.6 - t * 1.6; for (let j = 0; j < g; j++) k.P(x - Math.cos(a) * j, y - Math.sin(a) * j, j < 1.5 ? "#ffffff" : "#d8f0ec"); }
    for (let i = 0; i < 360; i++) { const x = hash(i, 1, 76) * 248, cerca = Math.max(0, 1 - Math.abs(x - 206) / 60), y = cresta(Math.min(x, 187)) - 3 - Math.pow(hash(i, 2, 76), 1.3) * (12 + cerca * 22); k.P(x, y, hash(i, 3, 76) > 0.45 ? "#ffffff" : "#c8e8e4"); if (hash(i, 4, 76) > 0.8) k.P(x + 1, y, "#ffffff"); }
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 77) * 240, y = cresta(x) + 12 + hash(i, 2, 77) * 30; if (y > 100) continue; trazo(k, [[x, y], [x + 1, y + 6], [x, y + 12]], "#e0f4f0"); }
  }

  function anden(k) {
    const fx = 160, fy = 46;
    suelo3d(k, 131, H, fx, fy, (X, z, x, y) => {
      const fz = z * 14, fila = Math.floor(fz), en = fz - fila, paso = (100 / ((y - fy) * (y - fy))) * 14, off = hash(fila, 0, 77) * 60, cola = Math.floor((X + off) / 60), u = X + off - cola * 60;
      if (en < paso * 0.9) return MAD_N[5];
      if (u < z * 1.05) return MAD_N[4];
      return rampa(MAD_N, 0.3 + (hash(fila, cola, 77) - 0.5) * 0.26 + (ruido(X * 0.03, fila * 4.1, 77) > 0.72 ? 0.12 : 0), x, y);
    });
    for (let x = 0; x < W; x++) { k.P(x, 128, "#d0ccc4"); k.P(x, 129, "#aca8a0"); k.P(x, 130, "#7e7a74"); }
  }
  function farola(k, x, base) {
    k.R(x - 1, base - 50, 3, 50, "#3a3e46"); k.R(x - 2, base - 5, 5, 5, "#464a52"); k.R(x - 3, base - 1, 7, 1, "#26282e");
    k.R(x - 4, base - 60, 9, 10, "#3a3e46"); k.R(x - 3, base - 59, 7, 8, "#ffd27a"); k.R(x, base - 59, 1, 8, "#e0b860"); k.P(x - 2, base - 58, "#fff3cf");
    k.poli([[x - 6, base - 60], [x + 6, base - 60], [x, base - 66]], "#3a3e46"); k.R(x - 1, base - 68, 3, 2, "#3a3e46");
  }
  function trenMarino(k) {
    k.banda(["#566874", "#5e707a", "#687a82", "#72848a"], 0, 104);
    for (let y = 0; y < 92; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.02, y * 0.05, 78, 4); if (n > 0.46) k.P(x, y, rampa(["#a2aeb4", "#8a969c", "#727e86", "#5c6870", "#48545c"], 0.1 + (0.74 - n) * 1.6 + (y / 92) * 0.2, x, y)); }
    P.mar(k, 100, 132, ["#4e7a84", "#44707a", "#3a646e", "#305862", "#264a54"], { s: 80, cresta: "#c8ece4", medio: "#7aa8ac", espejo: false });
    P.rayo(k, 104, 0, 86, 34, { s: 79, ramas: 3 });
    aquaLaguna(k);
    luces(k, [{ x: 96, y: 30, r: 150, ry: 80, col: "#c8e8ff", f: 0.55 }]);
    pluma(k, 266, 60, 36, 22, ["#c4c0c0", "#a8a4a4", "#8c888a", "#747072"], { s: 81, viento: -1.6 });
    rocketman(k);
    P.chispas(k, 268, 58, 30, 26, 22, 82);
    for (let i = 0; i < 6; i++) k.alfa(0.18, () => k.crudo(316, 86 - i * 0.6, 6, 6 + i * 1.2, "#fff6c8"));
    anden(k);
    const charcos = [[78, 150, 18, 3], [190, 162, 26, 4], [276, 146, 14, 2.5], [132, 174, 22, 3]];
    espejo(k, 130, 131, 180, { dentro: (x, y) => charcos.some(([cx, cy, rx, ry]) => Math.hypot((x - cx) / rx, (y - cy) / ry) < 1), mezcla: 0.35, tinte: "#2a3040", onda: 1, oscuro: 0.85, crestas: 0.04, s: 84 });
    P.barril(k, 6, 168, 12, 14, MAD_N); P.caja(k, 20, 174, 18, 12, MAD_N); P.caja(k, 24, 162, 12, 10, MAD_N);
    farola(k, 64, 152); farola(k, 228, 150);
    const ventanas = [];
    for (let x = -2; x < 94 - 8; x += 12) ventanas.push(x + 3); for (let x = 105; x < 197 - 8; x += 12) ventanas.push(x + 3);
    luces(k, [...ventanas.map((x) => ({ x, y: 128, r: 9, ry: 14, col: "#ffd890", f: 0.55 })), { x: 64, y: 94, r: 46, ry: 60, col: "#ffcf7a", f: 0.9 }, { x: 228, y: 92, r: 56, ry: 64, col: "#ffcf7a", f: 0.9 }, { x: 222, y: 128, r: 18, ry: 14, col: "#ffd890", f: 0.6 }, { x: 300, y: 100, r: 34, ry: 26, col: "#e8f0ff", f: 0.75 }]);
    P.lluvia(k, 200, 83, { col: "#c0d0e0", largo: 8, ang: 0.35, a: 0.4 });
  }

  const BALLENA = ["#ffffff", "#eef2f6", "#d8e0ea", "#bcc8d6", "#9aa8ba", "#768498"];
  const PARED_M = ["#fffaf2", "#f2ece0", "#e2d8c8", "#c8bca8", "#a89a86"], TEJADO_M = ["#8ea4bc", "#7088a2", "#58708a", "#445a72", "#32445a"];
  const LOSA_M = ["#ece6dc", "#ddd5c8", "#cbc2b4", "#b4aa9c", "#988e82", "#7a7268"];
  function gaviota(k, cx, cy, r) {
    k.elipse(cx, cy, r, r, "#f6f8fc"); k.elipse(cx, cy, r, r * 0.15 + 0.5, "#f6f8fc");
    trazo(k, [[cx - r * 0.75, cy + r * 0.15], [cx - r * 0.4, cy - r * 0.4], [cx, cy + r * 0.05]], "#3a6ab8", 1.5); trazo(k, [[cx, cy + r * 0.05], [cx + r * 0.4, cy - r * 0.4], [cx + r * 0.75, cy + r * 0.15]], "#3a6ab8", 1.5);
    k.R(cx - 1, cy + r * 0.2, 2, r * 0.4, "#3a6ab8");
  }
  function cuartelGeneral(k) {
    rellena(k, [[-2, 116], [-2, 76], [110, 76], [122, 116]], piedra(["#d8d0c4", "#c0b8ac", "#a69e94", "#8c867e", "#726c66"], { tx: 8, ty: 5, s: 81 }));
    [[-4, 104, 62, 76], [6, 94, 46, 62], [18, 82, 32, 46]].forEach(([x0, x1, top, base], i) => {
      rellena(k, [[x0, base], [x0, top], [x1, top], [x1, base]], (x, y) => rampa(PARED_M, 0.1 + ((x - x0) / (x1 - x0)) * 0.3 + (fbm(x * 0.2, y * 0.2, 82 + i) - 0.5) * 0.15, x, y));
      for (let x = x0 + 4; x < x1 - 4; x += 6) for (let y = top + 4; y < base - 3; y += 6) { k.R(x, y, 3, 3, "#3f6f9a"); k.P(x, y, "#6a8aa8"); }
      rellena(k, [[x0 - 6, top + 1], [x1 + 6, top + 1], [x1 + 1, top - 5], [x0 - 1, top - 5]], tejas(TEJADO_M, { w: 4, h: 2, s: 83 + i, y0: top - 5 }));
      k.R(x0 - 6, top + 1, x1 - x0 + 12, 1, TEJADO_M[4]); k.R(x0 - 8, top - 1, 3, 2, TEJADO_M[1]); k.R(x1 + 5, top - 1, 3, 2, TEJADO_M[1]);
    });
    rellena(k, [[36, 32], [36, 12], [64, 12], [64, 32]], (x, y) => rampa(PARED_M, 0.15 + ((x - 36) / 28) * 0.3, x, y));
    rellena(k, [[30, 13], [70, 13], [64, 5], [36, 5]], tejas(TEJADO_M, { w: 4, h: 2, s: 86, y0: 5 })); k.R(30, 13, 40, 1, TEJADO_M[4]);
    gaviota(k, 50, 22, 7);
    k.R(34, 49, 34, 9, "#24406e"); k.R(34, 49, 34, 1, "#3a5a8e"); Det.rotulo(k, 39, 51, "MARINE", "#f6f8fc");
    [[38, 5], [62, 5]].forEach(([x, y]) => { k.R(x, y - 12, 1, 12, "#5a5a64"); Det.bandera(k, x + 1, y - 12, 9, 6, "#f6f8fc", "#dfe6f0"); k.P(x + 4, y - 10, "#3a6ab8"); k.P(x + 5, y - 9, "#3a6ab8"); k.P(x + 6, y - 10, "#3a6ab8"); });
    rellena(k, [[96, 116], [101, 74], [123, 74], [128, 116]], piedra(["#e2dacc", "#cac2b4", "#b0a89a", "#968e82", "#7a746a"], { tx: 6, ty: 4, s: 88 }));
    for (let y = 78; y < 116; y += 3) { const t = (y - 74) / 42; k.R(108 - t * 3, y, 8 + t * 6, 1, "#f2ece0"); }
    rellena(k, [[100, 74], [124, 74], [124, 66], [100, 66]], madera(PAL.MAD_O, { paso: 2, largo: 99, s: 89 })); k.R(98, 65, 28, 2, PAL.MAD_O[4]); [101, 122].forEach((x) => k.R(x, 56, 2, 10, PAL.MAD_O[3])); k.R(100, 56, 24, 2, PAL.MAD_O[3]);
  }
  function mobyDick(k) {
    rellena(k, [[198, 62], [322, 54], [322, 124], [198, 124]], (x, y) => { const cubre = 62 - (x - 198) * 0.065, t = (y - cubre) / (124 - cubre); return (Math.round(y - cubre) % 5 === 0 && t > 0.08) ? BALLENA[3] : rampa(BALLENA, 0.1 + Math.pow(t, 1.4) * 0.75 + (fbm(x * 0.1, y * 0.1, 90) - 0.5) * 0.1, x, y); });
    for (let x = 198; x < 322; x++) { const y = Math.round(62 - (x - 198) * 0.065); k.P(x, y, "#6e4626"); k.P(x, y + 1, "#8e6036"); k.P(x, y + 2, BALLENA[3]); for (let j = 3; j < 9; j++) if (x % 6 === 0) k.P(x, y - j + 6, "#6e4626"); k.P(x, y - 4, "#8e6036"); }
    for (let x = 238; x < 320; x += 13) [86, 101].forEach((y) => { const yy = y - (x - 198) * 0.03; k.R(x - 1, yy - 1, 5, 5, "#8e6036"); k.R(x, yy, 3, 3, "#26262e"); });
    k.R(198, 74, 124, 2, "#b0a0d8"); k.R(198, 76, 124, 1, "#8a7ab8");
    [[232, 0, 62], [270, 0, 58], [306, 2, 56]].forEach(([x, top, base]) => P.palo(k, x - 2, top, base, 4, PAL.MAD_O, []));
    P.verga(k, 212, 254, 6, 2); P.verga(k, 250, 292, 4, 2); P.verga(k, 288, 322, 8, 2);
    P.velaCuadra(k, 214, 252, 8, 44, { hincha: 3 }); P.velaCuadra(k, 252, 290, 6, 42, { hincha: 3 }); P.velaCuadra(k, 290, 324, 10, 44, { hincha: 3 });
    P.jollyBarbanieve(k, 233, 25, 0.48); P.jollyBarbanieve(k, 271, 23, 0.48); P.jollyBarbanieve(k, 307, 27, 0.42);
    k.R(222, 0, 9, 6, "#1c1c26"); k.elipse(226, 2, 2, 2, "#f4f0e6"); k.R(223, 4, 7, 1, "#f4f0e6");
    const cabeza = [[146, 102], [148, 90], [156, 78], [168, 69], [184, 63], [204, 61], [220, 66], [229, 74], [229, 124], [156, 124], [148, 114]];
    rellena(k, cabeza, (x, y) => { const boca = 104 + Math.sin(((x - 148) / 76) * Math.PI) * 8; return rampa(BALLENA, 0.04 + ((x - 146) / 83) * 0.2 + ((y - 61) / 63) * 0.36 + (fbm(x * 0.12, y * 0.12, 91) - 0.5) * 0.1 + (y > boca + 1 ? 0.18 : 0), x, y); });
    for (let x = 148; x < 224; x++) { const y = 104 + Math.sin(((x - 148) / 76) * Math.PI) * 8; k.P(x, y, "#4a5464"); k.P(x, y + 1, "#6a7484"); k.P(x, y - 1, BALLENA[0]); }
    trazo(k, [[222, 104], [226, 99]], "#4a5464");
    k.elipse(184, 86, 5.5, 4.6, "#f8fafc"); k.elipse(185, 86.5, 3.2, 3.2, "#1a1c24"); k.R(183, 84, 2, 2, "#ffffff");
    trazo(k, [[177, 81], [184, 79], [192, 81]], BALLENA[4]); trazo(k, [[179, 92], [186, 93], [191, 91]], BALLENA[3]);
    [[160, 80, 168, 76], [158, 86, 166, 83], [196, 70, 206, 68]].forEach(([a, b, c, d]) => trazo(k, [[a, b], [c, d]], BALLENA[3]));
    k.elipse(206, 64, 3, 1.4, BALLENA[4]);
    for (let i = 0; i < 24; i++) { const x = 150 + hash(i, 1, 92) * 172, y0 = 62 + hash(i, 2, 92) * 30, l = 6 + hash(i, 3, 92) * 12; for (let j = 0; j < l && y0 + j < 124; j++) k.P(x + Math.sin(j * 0.5 + i) * 0.6, y0 + j, j % 4 === 3 ? "#ffffff" : "#d8eef8"); }
  }
  function plaza(k, y0, fx, fy, pal, s) {
    suelo3d(k, y0, H, fx, fy, (X, z, x, y) => {
      const fz = z * 12, fila = Math.floor(fz), en = fz - fila, paso = (100 / ((y - fy) * (y - fy))) * 12, ancho = 30, off = (fila % 2) * 15 + hash(fila, 0, s) * 6, col = Math.floor((X + off) / ancho), u = X + off - col * ancho;
      if (en < paso * 1.1) return pal[5];
      if (u < z * 1.2) return pal[4];
      return rampa(pal, 0.22 + (hash(fila, col, s) - 0.5) * 0.24 + (ruido(X * 0.08, fz * 3, s) - 0.5) * 0.12 + (en < paso * 2.8 ? 0.14 : 0) + (u < z * 3 ? -0.08 : 0), x, y);
    });
  }
  function miraneford(k) {
    k.banda(PAL.CIELO, 0, 96);
    nubarron(k, 150, 18, 70, 12); nubarron(k, 10, 2, 60, 8); cirros(k, 6, 8, 40);
    P.mar(k, 96, 132, PAL.MAR, { s: 93 });
    reflejo(k, 97, 132);
    cuartelGeneral(k);
    mobyDick(k);
    for (let x = 132; x < W; x++) for (let j = 0; j < 7; j++) { const y = 118 + j + Math.sin(x * 0.4 + j) * 1.5, v = ruido(x * 0.3, j * 0.8, 94); if (v > 0.35 - j * 0.02) k.P(x, y, v > 0.62 ? "#ffffff" : "#d8eef8"); }
    for (let i = 0; i < 90; i++) { const a = Math.PI * (0.55 + hash(i, 1, 95) * 0.9), r = 6 + hash(i, 2, 95) * 22, x = 150 + Math.cos(a) * r * 1.2, y = 118 - Math.abs(Math.sin(a)) * r; k.P(x, y, hash(i, 3, 95) > 0.4 ? "#ffffff" : "#c8e6f6"); if (r < 14) k.P(x + 1, y, "#ffffff"); }
    for (let i = 0; i < 70; i++) { const x = 160 + hash(i, 1, 98) * 160, y = 120 - Math.pow(hash(i, 2, 98), 1.5) * 18; k.P(x, y, "#ffffff"); }
    [[134, 60, 7], [124, 84, 5], [142, 40, 4], [232, 50, 6], [120, 54, 3], [214, 42, 4]].forEach(([x, y, r]) => { for (let a = 0; a < Math.PI * 2; a += 0.05) k.P(x + Math.cos(a) * r, y + Math.sin(a) * r, a > 3.4 && a < 4.6 ? "#ffffff" : "#bfe6f6"); k.P(x - r * 0.4, y - r * 0.5, "#ffffff"); });
    plaza(k, 130, 160, 50, LOSA_M, 96);
    rellena(k, [[110, 120], [322, 120], [322, 131], [110, 131]], piedra(["#e8e2d6", "#d4ccbe", "#bcb4a6", "#a29a8e", "#868076"], { tx: 7, ty: 4, s: 97 }));
    k.R(108, 119, 214, 2, "#f6f2ea"); k.R(108, 121, 214, 1, "#a29a8e"); k.R(108, 119, 2, 12, "#bcb4a6");
    [[150, 120], [270, 120]].forEach(([x, y]) => { rellena(k, [[x - 6, y], [x + 7, y], [x + 6, y - 4], [x - 5, y - 4]], madera(PAL.MAD_O, { paso: 2, largo: 99, s: x })); trazo(k, [[x - 3, y - 5], [x + 9, y - 10]], "#2a2a32", 4, 3); k.P(x + 9, y - 11, "#101014"); k.elipse(x - 3, y - 1, 2, 2, "#3a2a1e"); k.elipse(x + 5, y - 1, 2, 2, "#3a2a1e"); });
    sombra(k, [[110, 131], [322, 131], [322, 137], [110, 136]], 0.3);
    luces(k, [{ x: 50, y: 50, r: 70, ry: 40, col: LUZ, f: encendido(k) * 0.6 }]);
  }

  const TEJA_O = ["#a4aec2", "#868fa6", "#6a738a", "#525a70", "#3c4256", "#272b3c"], HUESO = ["#f4ead8", "#e0d2bc", "#c8b8a0", "#a89880", "#887860", "#64584a"];
  function tejado(k, y0, { roto = null, s = 1, fy = 70 } = {}) {
    suelo3d(k, y0, H, 160, fy, (X, z, x, y) => {
      if (roto && roto(x, y)) return null;
      const fz = z * 14, fila = Math.floor(fz), en = fz - fila, col = Math.floor(X / 8), u = X / 8 - col;
      if (u < 0.1 || u > 0.92) return TEJA_O[5];
      if (en < 0.1) return TEJA_O[4];
      return rampa(TEJA_O, 0.1 + u * 0.55 + (en < 0.24 ? -0.12 : 0) + (hash(fila, col, s) - 0.5) * 0.14, x, y);
    });
    for (let x = 0; x < W; x++) { for (let j = 0; j < 5; j++) k.P(x, y0 - 5 + j, rampa(TEJA_O, 0.1 + j * 0.16 + (x % 6 === 0 ? 0.15 : 0), x, y0 - 5 + j)); k.P(x, y0 - 6, TEJA_O[1]); }
  }
  function onigawara(k, cx, base) {
    rellena(k, [[cx - 9, base], [cx - 10, base - 10], [cx - 6, base - 15], [cx + 6, base - 15], [cx + 10, base - 10], [cx + 9, base]], (x, y) => rampa(TEJA_O, 0.05 + ((x - cx + 10) / 20) * 0.5, x, y));
    [-1, 1].forEach((s) => { k.poli([[cx + s * 5, base - 14], [cx + s * 9, base - 22], [cx + s * 8, base - 14]], TEJA_O[1]); k.R(cx + s * 4 - (s < 0 ? 2 : 0), base - 10, 3, 2, "#ff6a3a"); k.poli([[cx + s * 3, base - 4], [cx + s * 2, base - 1], [cx + s * 4, base - 1]], "#f4ead8"); });
    k.R(cx - 5, base - 5, 10, 2, TEJA_O[5]);
  }
  function cuerno(k, x0, y0, x1, y1, curva, g, s) {
    const pts = Det6.bezier([x0, y0], [x0 + curva * 0.2, y0 - (y0 - y1) * 0.55], [x1 - curva * 0.9, y1 + (y0 - y1) * 0.25], [x1, y1], 200);
    [1, 0].forEach((borde) => pts.forEach(([x, y], i) => {
      const t = i / (pts.length - 1), r = g * Math.pow(1 - t, 0.8) + 0.8 + borde;
      for (let dx = -r; dx <= r; dx++) k.P(x + dx, y, borde ? "#2a2024" : rampa(HUESO, 0.06 + ((dx + r) / (2 * r)) * 0.75 + (Math.floor(t * 14) % 2 ? 0.1 : 0) + (hash(Math.round(x + dx), Math.round(y), s) - 0.5) * 0.08, x + dx, y));
    }));
  }

  function onigashima(k) {
    k.banda(["#5a4a78", "#6a5080", "#7a5888", "#8a6090", "#9a6890"], 0, 112);
    P.fulgor(k, 56, 34, 34, ["#d8c8a8", "#e8dcc0"], 0.55); k.elipse(56, 34, 20, 20, "#f4ecd0"); [[48, 28, 4], [62, 40, 3], [52, 42, 2], [64, 26, 2]].forEach(([x, y, r]) => k.elipse(x, y, r, r, "#e0d4b0"));
    for (let y = 0; y < 100; y++) for (let x = 0; x < W; x++) { const n = fbm(x * 0.018, y * 0.05, 101, 4); if (n > 0.5 && !(Math.hypot(x - 56, y - 34) < 22)) k.P(x, y, rampa(["#b8a0c0", "#a088b0", "#8870a0", "#705a8c", "#5a4878"], 0.1 + (0.76 - n) * 1.5 + (y / 100) * 0.15, x, y)); }
    rellena(k, [[-2, 112], [-2, 102], [30, 98], [62, 101], [96, 94], [120, 90], [140, 96], [176, 99], [210, 92], [244, 97], [280, 94], [322, 100], [322, 112]], (x, y) => rampa(["#4a3a5a", "#3a2e4a", "#2c2238"], ((y - 90) / 22) * 0.8, x, y));
    [[40, 106], [130, 102], [226, 104], [286, 106]].forEach(([x, y]) => P.fulgor(k, x, y, 5, ["#c8361c", "#f06a24", "#ffb43a"], 0.8));
    P.fulgor(k, 166, 56, 46, ["#5a0c18", "#a01c2c", "#e8243a"], 0.55);
    cuerno(k, -14, 152, 44, 12, 40, 16, 103); cuerno(k, 334, 152, 276, 16, -40, 16, 104);
    pluma(k, 20, 120, 50, 20, ["#7a6a7a", "#625464", "#4c4050", "#3a3040"], { s: 105, viento: 0.4 }); pluma(k, 300, 118, 46, 18, ["#7a6a7a", "#625464", "#4c4050", "#3a3040"], { s: 106, viento: -0.4 });
    tejado(k, 122, { s: 107 });
    onigawara(k, 160, 120);
    [[96, 150], [232, 162], [60, 172]].forEach(([x, y]) => { k.poli([[x, y], [x + 7, y - 2], [x + 8, y + 1], [x + 1, y + 3]], TEJA_O[2]); k.P(x + 1, y, TEJA_O[0]); });
    fuego(k, 8, 186, 44, 40, { s: 108 }); fuego(k, 312, 186, 40, 44, { s: 109 });
    P.chispas(k, 20, 150, 60, 80, 40, 110); P.chispas(k, 300, 150, 60, 80, 40, 111);
    luces(k, [{ x: 166, y: 56, r: 130, ry: 80, col: "#ff4a5a", f: 0.55 }, { x: 10, y: 150, r: 120, ry: 150, col: "#ff8a3a", f: 0.95 }, { x: 312, y: 150, r: 120, ry: 150, col: "#ff8a3a", f: 0.95 }, { x: 56, y: 34, r: 110, ry: 90, col: "#e8e0ff", f: 0.35 }]);
  }

  const PIEL_L = ["#ffe0b8", "#f6c89a", "#e2aa78", "#c48a5c", "#9a6642"], BLANCO = ["#ffffff", "#f8f6f2", "#ebe7e1", "#d4cec6", "#b0aaa2"], NUBE = ["#ffffff", "#fbf4ec", "#f2e6da", "#e2d2c4", "#c8b4a8"];
  const CONTORNO = "#5a3424";
  function bolaC(k, cx, cy, rx, ry, pal, f = 0) { k.elipse(cx, cy, rx + 1, ry + 1, CONTORNO); esfera(k, cx, cy, rx, ry, pal, f); }
  function gear5(k, cx, cy) {
    [-1, 1].forEach((s) => {
      const hombro = [cx + s * 20, cy + 28], codo = [cx + s * 42, cy + 15], mano = [cx + s * 48, cy - 10];
      trazo(k, [hombro, codo, mano], CONTORNO, 11, 9); trazo(k, [hombro, codo, mano], (f, x, y) => rampa(PIEL_L, 0.15 + f * 0.2 + (s > 0 ? 0.2 : 0), x, y), 9, 7);
      bolaC(k, mano[0], mano[1] - 3, 5.5, 5, PIEL_L, 0);
      [[-6, -7], [-2.5, -10], [1.5, -10.5], [5.5, -8], [8, -2]].forEach(([dx, dy]) => { const p = [mano[0] + dx * s, mano[1] - 3 + dy]; trazo(k, [[mano[0], mano[1] - 4], p], CONTORNO, 4.2, 3.4); trazo(k, [[mano[0], mano[1] - 4], p], PIEL_L[1], 2.4, 2); });
      bolaC(k, cx + s * 22, cy + 29, 7, 6, BLANCO, 0);
    });
    rellena(k, [[cx - 25, cy + 26], [cx + 25, cy + 26], [cx + 18, cy + 76], [cx - 18, cy + 76]], (x, y) => rampa(PIEL_L, 0.2 + ((x - cx) / 22) * 0.3, x, y));
    trazo(k, [[cx - 8, cy + 36], [cx + 8, cy + 52]], "#b06a48", 2); trazo(k, [[cx + 8, cy + 36], [cx - 8, cy + 52]], "#b06a48", 2);
    [-1, 1].forEach((s) => { const pts = [[cx + s * 26, cy + 25], [cx + s * 12, cy + 27], [cx + s * 8, cy + 44], [cx + s * 5, cy + 76], [cx + s * 19, cy + 76]]; rellena(k, pts, (x, y) => rampa(BLANCO, 0.1 + ((y - cy - 25) / 51) * 0.4 + (s > 0 ? 0.2 : 0), x, y)); trazo(k, [pts[1], pts[2], pts[3]], CONTORNO); trazo(k, [pts[0], pts[4]], CONTORNO); trazo(k, [pts[1], [cx + s * 15, cy + 36], pts[2]], BLANCO[3]); });
    [[-24, 24, 7], [-14, 22, 8], [-4, 23, 7], [6, 22, 8], [16, 23, 7], [25, 26, 6], [-28, 30, 5], [30, 32, 5]].forEach(([dx, dy, r]) => bolaC(k, cx + dx, cy + dy, r, r * 0.85, NUBE, -0.1));
    [[-20, -12, -32, -30], [-12, -18, -20, -38], [-3, -21, -5, -42], [6, -21, 8, -43], [14, -18, 22, -38], [21, -12, 33, -30], [-24, -2, -38, -12], [24, -2, 38, -13]].forEach(([ax, ay, bx, by], i) => { const pts = []; for (let t = 0; t <= 1.001; t += 0.08) pts.push([cx + ax + (bx - ax) * t + Math.sin(t * Math.PI * 2.2 + i * 1.3) * 2.6 * t, cy + ay + (by - ay) * t]); trazo(k, pts, CONTORNO, 10, 3); trazo(k, pts, (f, x, y) => rampa(BLANCO, 0.02 + f * 0.4, x, y), 8, 1.4); });
    [[-20, -4, 8], [-14, -14, 9], [-4, -19, 9], [7, -18, 9], [16, -12, 8], [21, -2, 7], [-23, 6, 5], [23, 7, 5]].forEach(([dx, dy, r]) => bolaC(k, cx + dx, cy + dy, r, r * 0.9, BLANCO, -0.15));
    [-1, 1].forEach((s) => bolaC(k, cx + s * 15, cy + 4, 3, 4, PIEL_L, 0));
    bolaC(k, cx, cy + 2, 15, 15, PIEL_L, -0.05);
    [[-9, -10, 5], [-1, -12, 5], [8, -10, 5]].forEach(([dx, dy, r]) => bolaC(k, cx + dx, cy + dy, r, r * 0.75, BLANCO, -0.15));
    [-1, 1].forEach((s) => {
      trazo(k, [[cx + s * 2, cy - 3], [cx + s * 7, cy - 6], [cx + s * 12, cy - 4]], CONTORNO, 4); trazo(k, [[cx + s * 2, cy - 3], [cx + s * 7, cy - 6], [cx + s * 12, cy - 4]], "#ffffff", 2.2);
      const ex = cx + s * 6.5, ey = cy + 1;
      k.elipse(ex, ey, 4, 4.6, CONTORNO); k.elipse(ex, ey, 3.2, 3.8, "#ffffff"); k.elipse(ex, ey + 0.3, 2.3, 2.9, "#e03a32"); k.elipse(ex, ey + 0.5, 1.2, 1.7, "#1a1012"); k.P(ex - 1, ey - 1, "#ffffff");
    });
    trazo(k, [[cx + 9, cy + 8], [cx + 12, cy + 8]], "#a8584a"); k.P(cx + 10, cy + 7, "#a8584a"); k.P(cx + 11, cy + 9, "#a8584a");
    rellena(k, [[cx - 11, cy + 6], [cx + 11, cy + 6], [cx + 8, cy + 13], [cx, cy + 15], [cx - 8, cy + 13]], () => "#7a1e1e");
    k.R(cx - 10, cy + 6, 20, 2, "#ffffff"); k.elipse(cx, cy + 12, 5, 2.5, "#e8706a");
    trazo(k, [[cx - 12, cy + 5], [cx - 8, cy + 14], [cx, cy + 16], [cx + 8, cy + 14], [cx + 12, cy + 5]], CONTORNO); trazo(k, [[cx - 12, cy + 5], [cx + 12, cy + 5]], CONTORNO);
    k.P(cx - 1, cy + 3, PIEL_L[3]); k.P(cx + 1, cy + 3, PIEL_L[3]);
  }
  function nubeG(k, x, y, w, h, s) {
    const n = Math.max(3, Math.round(w / (h * 0.9)));
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = h * (0.55 + 0.45 * Math.sin(t * Math.PI)) * (0.8 + hash(i, 1, s) * 0.35); k.elipse(x + t * w, y - r * 0.4, r + 1, r * 0.85 + 1, "#c8a8a0"); }
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n, r = h * (0.55 + 0.45 * Math.sin(t * Math.PI)) * (0.8 + hash(i, 1, s) * 0.35); esfera(k, x + t * w, y - r * 0.4, r, r * 0.85, NUBE, -0.15); }
  }
  function mumonosoke(k, x, y) {
    const pts = []; for (let i = 0; i <= 40; i++) { const t = i / 40; pts.push([x + 14 + t * 92, y + Math.sin(t * Math.PI * 2.2) * 8 - t * 8]); }
    trazo(k, pts, "#a8506a", 11, 4); trazo(k, pts, (f, px, py) => rampa(["#ffd6e4", "#f8acc6", "#ec8cae", "#cc6c90"], 0.15 + f * 0.35, px, py), 9, 2.6);
    for (let i = 3; i < 38; i += 3) { const [px, py] = pts[i]; k.P(px, py + 2, "#fff2c8"); k.P(px + 1, py + 2, "#fff2c8"); }
    for (let i = 2; i < 36; i += 4) { const [px, py] = pts[i]; trazo(k, [[px, py - 3], [px - 2, py - 7]], "#f4f0f6", 1); }
    const [hx, hy] = pts[0];
    rellena(k, [[hx + 4, hy - 6], [hx - 6, hy - 6], [hx - 14, hy - 2], [hx - 15, hy + 2], [hx - 6, hy + 4], [hx + 4, hy + 5]], (px, py) => rampa(["#ffd6e4", "#f8acc6", "#ec8cae", "#cc6c90"], 0.1 + ((py - hy + 6) / 11) * 0.6, px, py));
    trazo(k, [[hx + 4, hy - 6], [hx - 6, hy - 6], [hx - 14, hy - 2], [hx - 15, hy + 2], [hx - 6, hy + 4], [hx + 4, hy + 5]], "#a8506a");
    trazo(k, [[hx - 2, hy - 6], [hx + 4, hy - 14]], "#f4e8c0", 2); trazo(k, [[hx + 2, hy - 6], [hx + 9, hy - 12]], "#f4e8c0", 2);
    trazo(k, [[hx - 13, hy + 1], [hx - 22, hy + 7], [hx - 26, hy + 4]], "#f4e8c0"); trazo(k, [[hx - 12, hy - 3], [hx - 20, hy - 8]], "#f4e8c0");
    k.R(hx - 5, hy - 3, 2, 2, "#1a1012"); k.P(hx - 5, hy - 3, "#ffffff");
    for (let j = 0; j < 5; j++) trazo(k, [[hx + 4, hy - 4 + j * 2], [hx + 10, hy - 6 + j * 3]], "#f4f0f6");
    [[0.25, 7], [0.55, 6], [0.85, 6]].forEach(([t, r]) => { const [px, py] = pts[Math.round(t * 40)]; k.elipse(px, py + 7, r, r * 0.55, "#ff9ab8"); k.elipse(px, py + 6, r * 0.6, r * 0.35, "#ffe0ea"); });
  }
  function gear5Escena(k) {
    k.banda(["#6a8ad0", "#9aa8e0", "#e0b8d0", "#ffd0a8", "#ffe6b0"], 0, 120);
    const sx = 92, sy = 100;
    for (let y = 0; y < 120; y++) for (let x = 0; x < W; x++) { const a = Math.atan2(y - sy, x - sx), cuna = Math.floor(((a + Math.PI) / (Math.PI * 2)) * 24) % 2; if (cuna && Math.hypot(x - sx, y - sy) > 44) k.alfa(0.22, () => k.P(x, y, "#fff4dc")); }
    P.fulgor(k, sx, sy, 74, ["#ffe6b0", "#fff0c8", "#fff8e0"], 0.7);
    k.elipse(sx, sy, 44, 44, "#fff6d8"); k.elipse(sx, sy, 40, 40, "#fffbe8");
    mumonosoke(k, 206, 30);
    gear5(k, sx, 46);
    nubeG(k, -10, 118, 120, 16, 1); nubeG(k, 200, 116, 130, 16, 2); nubeG(k, 90, 122, 140, 14, 3);
    const boquete = (x, y) => Math.hypot((x - 46) / 38, (y - 168) / 13) < 1;
    tejado(k, 132, { roto: boquete, s: 112, fy: 76 });
    for (let y = 154; y < 182; y++) for (let x = 6; x < 86; x++) { const q = Math.hypot((x - 46) / 38, (y - 168) / 13), hondo = (y - 155) / 26; if (q < 1) k.P(x, y, q < 0.45 && hondo > 0.45 ? (Det.trama(x, y) < 0.5 ? "#ff8a2a" : "#e04a1a") : q < 0.7 && hondo > 0.3 ? "#5a1e14" : "#24120e"); }
    for (let i = 0; i < 46; i++) { const a = hash(i, 1, 113) * Math.PI * 2, r = 1 + hash(i, 2, 113) * 0.3, x = 46 + Math.cos(a) * 38 * r, y = 168 + Math.sin(a) * 13 * r; k.poli([[x, y], [x + 3, y - 1], [x + 4, y + 1], [x + 1, y + 2]], TEJA_O[hash(i, 3, 113) > 0.5 ? 2 : 3]); }
    [[150, 150], [240, 168], [282, 146], [118, 172]].forEach(([x, y], i) => { k.poli([[x, y], [x + 6, y - 3], [x + 9, y], [x + 4, y + 3]], HUESO[2 + (i % 2)]); k.P(x + 2, y - 1, HUESO[0]); });
    luces(k, [{ x: 46, y: 168, r: 60, ry: 30, col: "#ff8a3a", f: 0.7 }, { x: 160, y: 120, r: 200, ry: 60, col: "#fff0c8", f: 0.3 }]);
  }

  const REY = ["#b4c482", "#94a866", "#788c4e", "#5e703c", "#46562c", "#323e1e"], VIENTRE_R = ["#f6ecc0", "#e6d8a0", "#ccba7c", "#aa985c"], MAD_P = ["#d8b484", "#c09a68", "#a07c4e", "#7e5e38", "#5e4228", "#402c18"];
  function reyDelMar(k) {
    rellena(k, [[136, 64], [190, 60], [208, 96], [214, 124], [150, 124], [140, 96]], (x, y) => { const vientre = x < 150 + (y - 64) * 0.18; return vientre ? rampa(VIENTRE_R, 0.1 + ((y - 64) / 60) * 0.6, x, y) : rampa(REY, 0.2 + ((x - 140) / 70) * 0.5 + (Math.sin(y * 0.5 + x * 0.1) > 0.75 ? 0.15 : 0), x, y); });
    for (let y = 70; y < 124; y += 5) trazo(k, [[142 + (y - 64) * 0.12, y], [152 + (y - 64) * 0.18, y + 1]], VIENTRE_R[2]);
    for (let i = 0; i < 7; i++) { const x = 152 + i * 9, y = 22 + i * 7 + (i > 3 ? (i - 3) * 4 : 0); k.poli([[x - 4, y + 6], [x + 1, y - 9 + i], [x + 6, y + 6]], REY[2]); trazo(k, [[x + 1, y - 8 + i], [x, y + 5]], REY[4]); }
    rellena(k, [[90, 46], [102, 34], [124, 24], [152, 20], [178, 28], [196, 46], [194, 62], [168, 58], [130, 54], [100, 56]], (x, y) => rampa(REY, 0.08 + ((y - 20) / 42) * 0.45 + ((x - 90) / 106) * 0.2 + (fbm(x * 0.15, y * 0.15, 121) - 0.5) * 0.18, x, y));
    rellena(k, [[100, 66], [132, 70], [168, 72], [190, 66], [188, 82], [160, 88], [126, 84], [104, 76]], (x, y) => rampa(VIENTRE_R, 0.12 + ((y - 66) / 22) * 0.6, x, y));
    rellena(k, [[100, 57], [130, 55], [168, 59], [190, 64], [168, 71], [132, 69], [101, 65]], (x, y) => rampa(["#b84a4a", "#963232", "#742222", "#521616"], 0.2 + ((x - 100) / 90) * 0.6, x, y));
    for (let x = 103; x < 186; x += 5) { const ya = 55 + ((x - 100) / 90) * 7 + (x > 160 ? 2 : 0), yb = 69 + ((x - 100) / 90) * 2; k.poli([[x, ya], [x + 3, ya], [x + 1.5, ya + 4]], "#fffaf0"); k.poli([[x + 2, yb], [x + 5, yb], [x + 3.5, yb - 4]], "#fffaf0"); }
    k.elipse(150, 36, 5, 4, "#2a3018"); k.elipse(150, 36, 4, 3, "#f2d040"); k.R(150, 33, 1, 7, "#1a1a10"); k.P(148, 35, "#fffae0");
    trazo(k, [[142, 31], [150, 28], [158, 30]], REY[4], 2);
    k.elipse(98, 44, 2, 1, REY[5]); k.elipse(104, 40, 2, 1, REY[5]);
    rellena(k, [[184, 54], [210, 40], [214, 58], [206, 74], [190, 70]], (x, y) => (Math.round(x - y * 0.4) % 4 === 0 ? REY[4] : rampa(REY, 0.15 + ((x - 184) / 30) * 0.5, x, y)));
    for (let i = 0; i < 22; i++) { const x = 104 + hash(i, 1, 122) * 104, y0 = 76 + hash(i, 2, 122) * 30, l = 6 + hash(i, 3, 122) * 14; for (let j = 0; j < l && y0 + j < 126; j++) k.P(x + Math.sin(j * 0.6 + i) * 0.6, y0 + j, j % 3 === 2 ? "#ffffff" : "#c8eaf8"); }
  }
  function redForceG(k, x, y, lit) {
    const CASCO = ["#b44a40", "#9a3a32", "#7e2a24", "#62201c", "#461612"];
    rellena(k, [[x - 44, y - 14], [x + 44, y - 16], [x + 56, y - 26], [x + 52, y - 14], [x + 40, y + 2], [x - 38, y + 3]], (px, py) => rampa(CASCO, 0.1 + ((py - y + 16) / 19) * 0.8 + (Math.round(py) % 3 === 0 ? 0.1 : 0), px, py));
    k.R(x - 44, y - 15, 90, 1, "#e8c050"); k.R(x - 40, y - 8, 84, 1, "#c09038");
    for (let px = x - 34; px < x + 40; px += 8) k.R(px, y - 6, 3, 2, lit ? "#ffd27a" : "#2a1410");
    rellena(k, [[x - 48, y - 24], [x - 34, y - 24], [x - 34, y - 14], [x - 46, y - 14]], (px, py) => rampa(CASCO, 0.2 + ((px - x + 48) / 14) * 0.5, px, py)); k.R(x - 45, y - 21, 3, 2, lit ? "#ffd27a" : "#2a1410"); k.R(x - 40, y - 21, 3, 2, lit ? "#ffd27a" : "#2a1410");
    [[x - 22, 50], [x + 4, 58], [x + 28, 46]].forEach(([mx, hh]) => { k.R(mx, y - 15 - hh, 2, hh, "#5a3a24"); [0.25, 0.55, 0.8].forEach((f) => { const w = 26 - f * 10; k.R(mx - w / 2, y - 15 - hh * (1 - f), w + 2, 1, "#5a3a24"); k.R(mx - w / 2 + 1, y - 14 - hh * (1 - f), w, 2, "#f2ead8"); k.R(mx - w / 2 + 1, y - 12 - hh * (1 - f), w, 1, "#c8bea8"); }); });
    k.R(x + 5, y - 82, 14, 9, "#1e1e24"); jollySankPeq(k, x + 12, y - 78);
    cuerda(k, x - 21, y - 64, x - 46, y - 24, 2, "#4a3020"); cuerda(k, x + 29, y - 60, x + 56, y - 26, 2, "#4a3020");
    k.R(x - 46, y + 3, 100, 1, "#d8eef8");
  }
  const jollySankPeq = (k, cx, cy) => { k.elipse(cx, cy, 2.5, 2.2, "#f4efe0"); k.R(cx - 2, cy + 1, 4, 2, "#f4efe0"); k.P(cx - 1, cy, "#1e1e24"); k.P(cx + 1, cy, "#1e1e24"); k.P(cx - 2, cy - 1, "#c8301e"); trazo(k, [[cx - 5, cy + 4], [cx + 5, cy - 3]], "#f4efe0"); trazo(k, [[cx + 5, cy + 4], [cx - 5, cy - 3]], "#f4efe0"); };
  function muelle(k, y0) {
    suelo3d(k, y0, H, 160, 60, (X, z, x, y) => {
      const fz = z * 10, fila = Math.floor(fz), en = fz - fila, paso = (100 / ((y - 60) * (y - 60))) * 10, off = hash(fila, 0, 123) * 50, cola = Math.floor((X + off) / 50), u = X + off - cola * 50;
      if (en < paso * 0.9) return MAD_P[5];
      if (u < z * 1.05) return MAD_P[4];
      if ((Math.abs(u - 2.5) < z * 0.6 || Math.abs(u - 47) < z * 0.6) && Math.abs(en - 0.5) < Math.max(paso, 0.2)) return "#3a2a1e";
      return rampa(MAD_P, 0.28 + (hash(fila, cola, 123) - 0.5) * 0.26 + (ruido(X * 0.03, fila * 4.1, 123) > 0.74 ? 0.12 : 0), x, y);
    });
    for (let x = 0; x < W; x++) { k.P(x, y0 - 1, MAD_P[0]); k.P(x, y0, MAD_P[2]); k.P(x, y0 + 1, MAD_P[4]); }
    for (let x = 6; x < W; x += 40) { rellena(k, [[x, y0 - 6], [x + 6, y0 - 6], [x + 6, y0 + 2], [x, y0 + 2]], (px, py) => rampa(MAD_P, 0.15 + ((px - x) / 6) * 0.6, px, py)); k.elipse(x + 3, y0 - 6, 3, 1.4, MAD_P[1]); }
  }
  function reyEscena(k) {
    const { h } = cuando(k), lit = encendido(k);
    k.banda(PAL.CIELO, 0, 92);
    nubarron(k, 200, 20, 90, 16); nubarron(k, 20, 40, 60, 10); cirros(k, 5, 6, 30);
    rellena(k, [[-2, 92], [-2, 70], [20, 62], [46, 56], [70, 60], [96, 72], [118, 84], [134, 92]], (x, y) => rampa(["#9ccaa0", "#82b48a", "#6a9e76", "#558862"], 0.12 + ((y - 56) / 36) * 0.5 + (fbm(x * 0.1, y * 0.1, 124) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 125) * 120, y = 66 + hash(i, 2, 125) * 22; if (y < 92 - (x > 96 ? (x - 96) * 0.9 : 0)) { k.elipse(x, y, 2.5, 2, i % 3 ? "#6a9e76" : "#558862"); k.P(x - 1, y - 1, "#9ccaa0"); } }
    k.R(60, 76, 4, 10, "#efe2c4"); k.poli([[59, 76], [65, 76], [62, 72]], "#c0503a"); [[0.5], [2.07], [3.64], [5.21]].forEach(([a]) => trazo(k, [[62, 75], [62 + Math.cos(a + (h || 0) * 0.37) * 7, 75 + Math.sin(a + (h || 0) * 0.37) * 7]], "#efe2c4"));
    [[20, 90, 8, 5, "#dc6a40"], [32, 91, 9, 5, "#5c9ccf"], [84, 90, 8, 5, "#dc6a40"]].forEach(([x, b, w, hh, t]) => { k.R(x, b - hh, w, hh, "#f6ecd6"); k.poli([[x - 1, b - hh], [x + w + 1, b - hh], [x + w / 2, b - hh - 4]], t); k.P(x + 2, b - 3, "#f2d27a"); });
    P.mar(k, 92, 134, PAL.MAR, { s: 126 });
    reflejo(k, 93, 134);
    redForceG(k, 266, 110, lit > 0.3);
    espejo(k, 112, 113, 132, { x0: 210, x1: 322, mezcla: 0.5, tinte: "#2c74b0", onda: 2, crestas: 0.06, s: 127 });
    reyDelMar(k);
    for (let x = 128; x < 226; x++) for (let j = 0; j < 6; j++) { const y = 121 + j + Math.sin(x * 0.4 + j) * 1.4, v = ruido(x * 0.3, j * 0.8, 128); if (v > 0.38 - j * 0.02) k.P(x, y, v > 0.62 ? "#ffffff" : "#d8eef8"); }
    for (let i = 0; i < 60; i++) { const x = 120 + hash(i, 1, 129) * 110, y = 120 - Math.pow(hash(i, 2, 129), 1.5) * 16; k.P(x, y, "#ffffff"); }
    rellena(k, [[72, 124], [100, 124], [96, 130], [76, 130]], (x, y) => rampa(MAD_P, 0.2 + ((y - 124) / 6) * 0.6, x, y)); k.R(72, 123, 28, 1, MAD_P[0]); trazo(k, [[80, 122], [96, 114]], MAD_P[3]); k.R(70, 130, 32, 1, "#d8eef8");
    [[110, 30], [124, 36], [238, 50], [60, 22]].forEach(([x, y]) => { k.P(x - 2, y - 1, "#f4f4f4"); k.P(x - 1, y, "#f4f4f4"); k.P(x, y - 1, "#3a3a44"); k.P(x + 1, y, "#f4f4f4"); k.P(x + 2, y - 1, "#f4f4f4"); });
    muelle(k, 136);
    k.R(300, 96, 2, 44, "#5a4430"); P.farol(k, 299, 92);
    P.barril(k, 8, 172, 12, 14, MAD_P); P.barril(k, 18, 166, 11, 13, MAD_P); P.caja(k, 288, 176, 16, 11, MAD_P);
    for (let i = 0; i < 40; i++) { const x = 24 + (i % 10) * 2.4, y = 170 + Math.floor(i / 10) * 2; k.P(x + (Math.floor(i / 10) % 2), y, i % 3 ? "#8a7a5a" : "#b8a880"); }
    luces(k, [{ x: 300, y: 96, r: 30, ry: 26, col: LUZ, f: lit }, { x: 266, y: 104, r: 40, ry: 12, col: LUZ, f: lit * 0.5 }]);
  }

  const ORO_E = ["#fff0a8", "#ffd86a", "#e8b440", "#c08a28", "#8e6018"], PLATA_E = ["#ffffff", "#e6e8f0", "#c4c8d6", "#9aa0b4", "#6e7488"], ROSA_E = ["#ffe0ee", "#f8b4d0", "#e88ab0", "#c86a90", "#9a4a6c"];
  const MOCHI = ["#ffffff", "#f8f4ee", "#ece4da", "#d8ccbe", "#bcae9e"];
  function espejoFlota(k, x, y, w, h, forma, marco, s) {
    const dentro = (px, py, m = 0) => { const nx = (px - x - w / 2) / (w / 2 - m), ny = (py - y - h / 2) / (h / 2 - m); if (forma === "ovalo") return nx * nx + ny * ny <= 1; if (forma === "arco") return Math.abs(nx) <= 1 && (ny >= -0.3 ? ny <= 1 : nx * nx + Math.pow((ny + 0.3) / 0.7, 2) <= 1); return Math.abs(nx) <= 1 && Math.abs(ny) <= 1; };
    sombraE(k, x + w / 2, y + h + 8, w * 0.4, 2, 0.15);
    for (let py = Math.floor(y); py <= y + h; py++) for (let px = Math.floor(x); px <= x + w; px++) {
      if (!dentro(px, py)) continue;
      if (!dentro(px, py, 2.2)) { k.P(px, py, rampa(marco, 0.15 + ((px - x) / w) * 0.4 + ((py - y) / h) * 0.3 + (hash(px, py, s) > 0.85 ? -0.3 : 0), px, py)); continue; }
      const t = (py - y) / h, d = (px - x) / w - t * 0.6, destello = Math.abs(d - 0.05) < 0.06 || Math.abs(d - 0.22) < 0.025;
      k.P(px, py, destello ? "#ffffff" : rampa(["#f4e8ff", "#e4d4f8", "#cdb8ec", "#b8a0e0", "#a088d0"], 0.1 + t * 0.6 + (ruido(px * 0.1, py * 0.1, s) - 0.5) * 0.2, px, py));
    }
    if (w > 16) [[x + w / 2, y - 1], [x - 1, y + h / 2], [x + w + 1, y + h / 2], [x + w / 2, y + h + 1]].forEach(([px, py]) => k.elipse(px, py, 1.6, 1.6, marco[1]));
  }
  function donut(k, cx, cy, r, glas, s) {
    k.elipse(cx, cy, r, r * 0.55, "#c08a50"); k.elipse(cx, cy - 1, r * 0.92, r * 0.48, glas);
    k.elipse(cx, cy - 1, r * 0.32, r * 0.18, "#8a5a30");
    for (let i = 0; i < 6; i++) { const a = hash(i, 1, s) * Math.PI * 2, rr = r * (0.5 + hash(i, 2, s) * 0.3); k.P(cx + Math.cos(a) * rr, cy - 1 + Math.sin(a) * rr * 0.5, ["#ffffff", "#7ad0f0", "#f6e05a", "#e85a8a"][i % 4]); }
  }
  function merienda(k, x, base) {
    rellena(k, [[x - 10, base], [x - 10, base - 34], [x - 6, base - 40], [x + 6, base - 40], [x + 10, base - 34], [x + 10, base]], (px, py) => (Math.hypot(px - x, py - base + 36) < 6 || px < x - 8 || px > x + 8 || py < base - 37 ? rampa(ORO_E, 0.15 + ((px - x + 10) / 20) * 0.6, px, py) : rampa(["#e86a8a", "#c84a6a", "#a8304e", "#80203a"], 0.15 + ((px - x + 10) / 20) * 0.5 + ((py - base + 30) % 8 === 0 ? 0.25 : 0), px, py)));
    k.R(x - 12, base - 14, 24, 4, "#c84a6a"); k.R(x - 12, base - 14, 24, 1, "#f08aa8"); k.R(x - 12, base - 10, 2, 10, ORO_E[2]); k.R(x + 10, base - 10, 2, 10, ORO_E[2]);
    const mx = x + 26;
    k.R(mx - 1, base - 12, 2, 12, ORO_E[3]); k.R(mx - 6, base - 1, 12, 1, ORO_E[3]); k.elipse(mx, base - 13, 10, 3, "#fffaf6"); k.R(mx - 10, base - 13, 20, 4, "#fffaf6"); for (let i = 0; i < 20; i += 3) k.R(mx - 10 + i, base - 9, 2, 1, "#f0d8e0");
    ["#f8b4d0", "#7a4a2a", "#fffaf0", "#f8b4d0", "#e8d070", "#7a4a2a"].forEach((c, i) => donut(k, mx - 2, base - 16 - i * 4, 6 - i * 0.4, c, 130 + i));
    k.elipse(mx + 7, base - 17, 3, 3, "#ffffff"); k.R(mx + 9, base - 19, 3, 1, "#ffffff"); k.R(mx + 5, base - 21, 4, 1, ROSA_E[2]);
  }
  function mundoEspejo(k) {
    k.banda(["#4a3878", "#6a4a98", "#9a6ab8", "#d098c8", "#f4c8d8"], 0, 124);
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, 131) * W, y = hash(i, 2, 131) * 110, t = hash(i, 3, 131) > 0.7 ? 2 : 1; k.P(x, y, "#ffffff"); for (let j = 1; j <= t; j++) { k.P(x - j, y, "#f4e0ff"); k.P(x + j, y, "#f4e0ff"); k.P(x, y - j, "#f4e0ff"); k.P(x, y + j, "#f4e0ff"); } }
    [[30, 26, 12, 18, "ovalo", PLATA_E], [98, 12, 11, 15, "rect", ORO_E], [222, 18, 14, 20, "arco", ROSA_E], [284, 38, 11, 14, "ovalo", ORO_E], [154, 46, 10, 14, "ovalo", PLATA_E],
      [8, 62, 22, 32, "arco", ORO_E], [258, 60, 24, 34, "ovalo", PLATA_E], [180, 30, 18, 26, "rect", ORO_E], [70, 50, 16, 22, "ovalo", ROSA_E], [126, 70, 14, 20, "arco", PLATA_E], [296, 2, 30, 46, "rect", ORO_E], [40, 4, 18, 22, "rect", ROSA_E]]
      .forEach(([x, y, w, h, f, m], i) => espejoFlota(k, x, y, w, h, f, m, 132 + i));
    suelo3d(k, 118, H, 160, 64, (X, z, x, y) => { const a = Math.floor(X / 16), b = Math.floor((100 / z) / 3); return rampa(["#fbf4ff", "#efe2fa", "#ddc8f2", "#c8b0e6"], 0.15 + ((a + b) % 2) * 0.25 + ((y - 118) / 62) * 0.3, x, y); });
    espejo(k, 118, 118, 180, { mezcla: 0.35, tinte: "#e8d8f8", onda: 0, oscuro: 0.95, crestas: 0, paso: 1, s: 133 });
    for (let x = 0; x < W; x++) { k.P(x, 118, "#ffffff"); k.P(x, 119, "#e8d8f8"); }
    for (let i = 0; i < 9; i++) esfera(k, 4 + i * 11, 116 - Math.sin((i / 8) * Math.PI) * 10, 9 - Math.abs(i - 4) * 0.8, 8 - Math.abs(i - 4) * 0.6, MOCHI, -0.1);
    [[40, 150, 34, 6], [292, 142, 26, 5], [310, 172, 22, 6], [12, 172, 20, 5]].forEach(([x, y, rx, ry]) => { k.elipse(x, y, rx, ry, MOCHI[3]); k.elipse(x, y - 1, rx - 1, ry - 1, MOCHI[1]); k.R(x - rx * 0.5, y - ry * 0.5, rx * 0.5, 1, "#ffffff"); });
    [[13, 94], [23, 94]].forEach(([x, y], i) => { k.R(x, y, 2, 6 + i * 3, MOCHI[1]); k.elipse(x + 1, y + 7 + i * 3, 1.6, 2, MOCHI[0]); });
    merienda(k, 206, 124);
    donut(k, 70, 172, 7, "#f8b4d0", 140); donut(k, 260, 170, 6, "#7a4a2a", 141); donut(k, 300, 156, 5, "#e8d070", 142);
    luces(k, [{ x: 220, y: 106, r: 50, ry: 30, col: "#ffe0f0", f: 0.4 }]);
  }

  window.SitiosIt14 = window.SitiosIt14 || {};
  window.SitiosIt14.piratas = {
    32: ["El pueblo Cacoyosi", "Los mandarinos de Bellemere en la loma, su casa y su tumba mirando al mar, y el pueblo abajo, en la costa", cacoyosi, { ven: ["#ffd27a", "#f2d27a"], tinte: 0.2 }],
    33: ["El funeral del Going Nerry", "El Nerry arde en el mar de noche, mientras nieva, y la tripulación lo despide desde la barca", funeral, { cielo: "propio", siempre: 22, fuego: [...FUEGO, "#ffd06a", "#ff8a2a", "#fff3cf", "#ffd27a", "#ffb43a"] }],
    34: ["El Tren Marino", "El Rocketman, con su cabeza de tiburón, en el andén de la estación de Shift, la noche de la Aqua Laguna, camino de Ineis Lobby", trenMarino, { cielo: "propio", siempre: 21, fuego: ["#ffe8a0", "#fff6c8", "#ffd27a", "#fff3cf", "#e0b860", "#ffffff", "#a8c0d4", "#8aa4bc", "#f6f8fa", "#e0e6ec"] }],
    35: ["El Moby Dick en Miraneford", "El barco ballena de Barbanieve sale del fondo de la bahía, frente al cuartel general y el cadalso", miraneford, { ven: ["#3f6f9a"], tinte: 0.25 }],
    36: ["El tejado de Onigashima", "La Cúpula Calavera de noche, entre los cuernos de la isla, con el fuego que sube y los rayos negros del Hika del Rey que parten el cielo", onigashima, { cielo: "propio", siempre: 22, fuego: [...FUEGO, "#f4ead8", "#e0d2bc", "#160608", "#e8243a", "#ffffff", "#ffe0e0", "#7a1020", "#c82a3a", "#ff5a5a", "#f4ecd0", "#e0d4b0", "#d8c8a8", "#e8dcc0", "#ff6a3a"] }],
    37: ["Marcha 5 sobre Onigashima", "Lutty despierta: gigante y blanco, riéndose al amanecer delante del sol, sobre el mar de nubes y el tejado roto de la isla", gear5Escena, { cielo: "propio", siempre: 7, fuego: ["#fff6d8", "#fffbe8", "#ffe6b0", "#fff0c8", "#fff8e0", "#ff8a2a", "#e04a1a"] }],
    38: ["El Rey del Mar del East Bleu", "El Señor de la Costa sale del mar frente al muelle de Faosho, con la Red Force fondeada y la barca de los bandidos a la deriva", reyEscena, { ven: ["#ffd27a", "#f2d27a"], tinte: 0.2, dx: -110 }],
    39: ["El Mundo Espejo", "El mundo de los espejos de Brûlée, donde Kutakari pelea: espejos que flotan, el suelo que lo refleja todo, el mochi y su merienda de donuts", mundoEspejo, { cielo: "propio", fuerza: 0.35 }],
  };
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, tablones, losas3d, copa, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const O = (window.SitiosIt15.piratas = window.SitiosIt15.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const PIEDRA_C = ["#f6efe0", "#e6dcc6", "#d2c6aa", "#b8aa8c", "#988a6e", "#746850"];
  const TEJA_V = ["#7ac4cc", "#56a6b2", "#3c8896", "#2a6a78", "#1c4c58"];

  const ESC = ["#ffc49a", "#f49a64", "#de7444", "#c0542c", "#94381a", "#64240e"];
  function baratei(k) {
    const lit = encendido(k), CREMA = ["#fff4e0", "#ffd8b0", "#f2b48a"];
    k.banda(["#ffb07a", "#ffc88e", "#ffe0a8", "#fff0c8"], 0, 100);
    nubarron(k, -10, 56, 84, 16, CREMA); nubarron(k, 236, 48, 100, 18, CREMA); cirros(k, 6, 8, 34, "#fff0d8");
    P.mar(k, 98, 150, PAL.MAR, { s: 41 }); reflejo(k, 100, 150);
    const casco = [[46, 122], [62, 100], [92, 90], [230, 90], [266, 104], [300, 84], [308, 116], [302, 144], [266, 126], [232, 140], [92, 142], [62, 134]];
    rellena(k, casco, (x, y) => {
      const fila = Math.floor((y - 88) / 4), u = ((x + (fila % 2) * 3) % 6 + 6) % 6, v = (y - 88) % 4, borde = (v === 3 && u > 0 && u < 5) || (v === 2 && (u === 0 || u === 5)), luz = v === 0 && (u === 2 || u === 3);
      const vientre = y > 124 && x < 262 ? -0.22 : 0, cola = x > 268 ? ((Math.round((y - 84) / 3 + x * 0.4) % 4 === 0) ? 0.2 : 0) : 0;
      return rampa(ESC, 0.16 + ((y - 88) / 56) * 0.5 + vientre + (borde ? 0.24 : 0) + (luz ? -0.18 : 0) + cola, x, y);
    });
    rellena(k, [[120, 90], [162, 90], [152, 72], [130, 75]], (x, y) => rampa(ESC, 0.2 + ((x - 120) / 42) * 0.4 + (Math.round(x - y * 0.4) % 5 === 0 ? 0.25 : 0), x, y));
    rellena(k, [[150, 140], [190, 141], [178, 154], [156, 151]], (x, y) => rampa(ESC, 0.45 + ((y - 140) / 14) * 0.4 + (x % 5 === 0 ? 0.2 : 0), x, y));
    trazo(k, [[50, 124], [70, 127], [86, 128], [92, 120]], "#4a1a0a", 2); [[58, 124], [65, 125.5], [72, 126.5], [79, 127]].forEach(([x, y]) => k.poli([[x, y + 1], [x + 5, y + 1], [x + 2, y + 5]], "#f6f0e0"));
    bola(k, 84, 108, 9, 9, (x, y) => rampa(["#ffffff", "#f2ece0", "#dcd2bc", "#b8ac94"], 0.1 + ((x - 84) / 9 + (y - 108) / 9) * 0.3, x, y)); k.elipse(86, 109, 5, 5, "#1c1c22"); k.R(83, 105, 3, 2, "#ffffff"); trazo(k, [[74, 101], [80, 98], [90, 98], [95, 102]], ESC[5], 1);
    [[124, 113], [148, 113], [172, 113], [196, 113], [220, 113]].forEach(([x, y]) => { k.elipse(x, y, 4, 4, "#c8a040"); k.elipse(x, y, 3, 3, "#ffcf6a"); k.P(x - 1, y - 1, "#fff3cf"); });
    [[108, 118], [236, 116]].forEach(([x, y]) => { for (let a = 0; a < Math.PI * 2; a += 0.15) { const c = Math.floor((a / (Math.PI * 2)) * 4) % 2 ? "#e8402a" : "#ffffff"; k.R(x + Math.cos(a) * 4 - 1, y + Math.sin(a) * 4 - 1, 2, 2, c); } });
    k.alfa(0.35, () => k.R(70, 136, 200, 4, "#3a1206"));
    for (let x = 52; x < 300; x++) if (hash(x, 3, 41) > 0.45) k.P(x, 141 + Math.round(Math.sin(x / 5) * 1.2), "#e6f4fa");
    const TABLA = ["#fff8e8", "#f4e8cc", "#e4d4b0", "#ccb890", "#a8946c"];
    T.rect(k, 106, 60, 112, 32, madera(TABLA, { paso: 4, vertical: true, largo: 99, s: 42 })); k.alfa(0.25, () => k.R(196, 60, 22, 32, "#6a4a30"));
    for (let x = 112; x < 206; x += 15) T.ventana(k, x, 68, 8, 15, { arco: true, marco: "#7a4e2c", vidrio: "#ffcf6a", cruz: true });
    rellena(k, [[96, 60], [112, 42], [212, 42], [228, 60]], tejas(TEJA_V, { w: 5, h: 3, s: 43, y0: 42 })); k.R(94, 59, 136, 2, TEJA_V[4]); k.alfa(0.35, () => k.R(106, 61, 112, 2, "#2a1a10"));
    T.rect(k, 128, 24, 68, 19, madera(TABLA, { paso: 4, vertical: true, largo: 99, s: 44 })); for (let x = 134; x < 192; x += 12) T.ventana(k, x, 29, 6, 9, { marco: "#7a4e2c", vidrio: "#ffcf6a" });
    rellena(k, [[120, 24], [138, 10], [186, 10], [204, 24]], tejas(TEJA_V, { w: 5, h: 3, s: 45, y0: 10 })); k.R(118, 23, 88, 2, TEJA_V[4]);
    T.rect(k, 184, 0, 6, 12, Det6.ladrillo(["#cc8060", "#ac6248", "#8c4a36", "#602e20"], { w: 3, h: 2, s: 46 })); Det.humo(k, 187, -1, "#f2eee8", 0.4, 5);
    esfera(k, 160, 8, 14, 6, PAL.LONA); k.R(150, 9, 20, 3, PAL.LONA[1]); k.R(158, -2, 2, 6, "#5a3a20"); Det.bandera(k, 160, -2, 14, 6, "#1c1c22");
    T.rect(k, 124, 43, 76, 14, madera(PAL.MAD_O, { paso: 3, largo: 99, s: 47 })); k.R(124, 43, 76, 1, "#c99a64"); k.R(124, 56, 76, 1, "#2a1a10"); rotuloG(k, 134, 46, "BARATEI", "#ffe08a");
    if (lit > 0) rotulo({ P: (px, py, c) => k.crudo(134 + (px - 134) * 2, 46 + (py - 46) * 2, 2, 2, c) }, 134, 46, "BARATEI", "#ffe6a0");
    for (let x = 0; x < W; x++) { k.P(x, 137, PAL.MAD[0]); k.R(x, 138, 1, 2, PAL.MAD[2]); k.P(x, 140, PAL.MAD[4]); }
    for (let x = 6; x < W; x += 12) Det.cilindro(k, x, 141, 3, 9, [PAL.MAD[1], PAL.MAD[2], PAL.MAD[3], PAL.MAD[4]]);
    suelo3d(k, 150, 180, 160, 96, tablones(PAL.MAD, { pw: 10, L: 50, s: 48, clavo: "#3a2414" })); k.R(0, 150, W, 1, PAL.MAD[0]); k.alfa(0.3, () => k.R(0, 151, W, 2, "#2a1a10"));
    [26, 294].forEach((x) => { T.rect(k, x - 2, 112, 5, 39, Det6.corteza(PAL.MAD_O, x - 2, 5, { s: x })); k.R(x - 3, 111, 7, 2, PAL.MAD_O[4]); });
    const farolillos = [];
    for (let i = 0; i <= 268; i++) { const t = i / 268, x = 27 + 268 * t, y = 114 + Math.sin(t * Math.PI) * 12; k.P(x, y, "#3a2414"); if (i % 24 === 12) farolillos.push([x, y + 3]); }
    farolillos.forEach(([x, y], i) => { k.R(x, y - 3, 1, 2, "#3a2414"); k.elipse(x, y + 1, 2, 3, i % 2 ? "#e8402a" : "#f6ecd8"); k.R(x - 2, y - 2, 5, 1, "#3a2414"); k.R(x - 2, y + 4, 5, 1, "#3a2414"); if (lit > 0) { k.crudo(x - 1, y, 3, 3, i % 2 ? "#ff9a6a" : "#fff0c0"); } });
    T.mesa(k, 34, 172); T.mesa(k, 304, 170); P.barril(k, 8, 168, 10, 13); P.caja(k, 276, 152, 12, 9);
    luces(k, [...farolillos.map(([x, y]) => ({ x, y: y + 6, r: 20, ry: 16, col: "#ffcf7a", f: lit })), { x: 160, y: 84, r: 70, ry: 30, col: LUZ, f: lit * 0.5 }]);
  }
  O[4] = ["El Baratei", "El restaurante flotante con forma de pez", baratei, { ven: ["#ffcf6a", "#ffd27a"], tinte: 0.1, fuego: [] }];

  const PIEDRA_A = ["#f6ecd4", "#e4d6b4", "#cebe98", "#b0a07c", "#8c7e60", "#665a42"];
  const muroCil = (x0, w, s) => (x, y) => { const c = celdas(x, y, 9, 4, s, 0.5); if (c.borde < 0.1) return PIEDRA_A[5]; const t = (x - x0) / w, cil = Math.pow(Math.abs(t - 0.3) / 0.7, 1.3); return rampa(PIEDRA_A, 0.06 + cil * 0.66 + (c.id - 0.5) * 0.2 + (hash(x, y, s) - 0.5) * 0.08 + (c.dy < -0.3 ? -0.08 : 0), x, y); };
  function orlang(k) {
    k.banda(["#6a8ab0", "#8aa6c4", "#b0c6d4"], 0, 116);
    nubarron(k, -14, 54, 96, 18); nubarron(k, 236, 46, 100, 20); cirros(k, 5, 6, 30);
    rellena(k, [[-4, 114], [8, 99], [30, 89], [58, 87], [86, 93], [110, 105], [124, 114]], T.tex(["#a8c890", "#8cb478", "#76a064", "#628a54", "#4e7444"], { v0: 0.25, f: 0.1, g: 0.4, s: 51, dy: 0.4, y0: 87, alto: 27 }));
    for (let i = 0; i < 13; i++) { const x = 8 + i * 8, y = 99 - Math.sin((i / 12) * Math.PI) * 7 + (i % 2) * 3; copa(k, x, y, 5, 4, ["#a8d078", "#7cb05a", "#5a9046", "#3f7036", "#2a5226"], { r: 2.4, s: 60 + i }); for (let j = 0; j < 3; j++) k.P(x - 3 + hash(i, j, 52) * 6, y - 2 + hash(j, i, 52) * 4, "#f2a23a"); }
    P.mar(k, 112, 136, PAL.MAR, { s: 52 }); reflejo(k, 113, 136);
    T.rect(k, 122, 18, 76, 34, muroCil(122, 76, 53)); T.rect(k, 110, 50, 100, 40, muroCil(110, 100, 54)); T.rect(k, 96, 88, 128, 46, muroCil(96, 128, 55));
    for (let x = 132; x < 188; x += 13) T.ventana(k, x, 30, 7, 9, { marco: "#5a4a34", vidrio: "#2a4a5a", alfeizar: PIEDRA_A[4] });
    for (let x = 118; x < 204; x += 14) T.ventana(k, x, 64, 8, 12, { marco: "#5a4a34", vidrio: "#2a4a5a", alfeizar: PIEDRA_A[4] });
    T.tejadoJ(k, 160, 22, 92, 18, TEJA_V, 56, 4); T.tejadoJ(k, 160, 54, 124, 12, TEJA_V, 57, 4); T.tejadoJ(k, 160, 91, 154, 12, TEJA_V, 58, 5);
    k.R(159, 0, 2, 9, "#3a2a20"); Det.bandera(k, 161, 0, 18, 10, "#26324a"); trazo(k, [[164, 7], [167, 3], [170, 7], [173, 3], [176, 7]], "#f4efe0");
    bola(k, 160, 116, 44, 22, (x, y) => rampa(["#7a94a4", "#5e7a8c", "#46606e", "#324650"], 0.2 + ((y - 94) / 44) * 0.6 + (Math.abs(x - 160) / 44) * 0.2, x, y));
    bola(k, 160, 117, 38, 18, (x, y) => rampa(["#3a1e24", "#2a141a", "#1c0c12", "#10060a"], 0.2 + (1 - Math.abs(y - 117) / 18) * 0.6, x, y));
    for (let x = 126; x < 194; x += 8) { const y = 100 + Math.abs(x + 3.5 - 160) * 0.17; k.poli([[x, y], [x + 7, y], [x + 3.5, y + 11]], "#f6f0e0"); k.poli([[x + 3.5, y], [x + 7, y], [x + 3.5, y + 11]], "#d8d0bc"); }
    for (let x = 130; x < 190; x += 8) { const y = 133 - Math.abs(x + 3.5 - 160) * 0.13; k.poli([[x, y], [x + 7, y], [x + 3.5, y - 10]], "#f6f0e0"); k.poli([[x + 3.5, y], [x + 7, y], [x + 3.5, y - 10]], "#d8d0bc"); }
    [[104, 104], [216, 104]].forEach(([x, y], i) => { bola(k, x, y, 7, 7, (px, py) => rampa(["#ffffff", "#ece8dc", "#cfc8b4"], 0.2 + ((px - x) + (py - y)) / 14, px, py)); k.elipse(x + (i ? -1 : 1), y, 3, 4, "#16161c"); k.P(x - 2, y - 3, "#ffffff"); [0, 5, 10].forEach((d) => trazo(k, [[x + (i ? 6 : -6) - (i ? -d * 0.3 : d * 0.3), y + 10 + d], [x + (i ? 1 : -1) * 2, y + 16 + d]], "#465a68", 1)); });
    k.alfa(0.3, () => k.R(96, 132, 128, 2, "#2a2418"));
    T.rect(k, 0, 134, W, 14, piedra(PIEDRA_A, { tx: 13, ty: 5, s: 59 })); k.R(0, 133, W, 2, PIEDRA_A[0]); k.alfa(0.25, () => k.R(0, 146, W, 2, "#3a3020"));
    suelo3d(k, 148, 180, 160, 104, losas3d(["#e8dcc2", "#d6c8aa", "#c0b090", "#a49474", "#857658"], { tx: 9, tz: 6, s: 60 }));
    [[24, 136], [298, 136]].forEach(([x, y]) => { k.R(x, y - 28, 2, 28, "#3a2a20"); Det.bandera(k, x + 2, y - 28, 16, 9, "#26324a"); trazo(k, [[x + 5, y - 23], [x + 8, y - 26], [x + 11, y - 23], [x + 14, y - 26]], "#f4efe0"); });
    P.palmera(k, 46, 150, 42, { inc: 0.25, s: 61 }); sombraE(k, 50, 151, 12, 2.5, 0.4); P.palmera(k, 272, 150, 46, { inc: -0.25, s: 62 }); sombraE(k, 268, 151, 12, 2.5, 0.4);
    P.caja(k, 10, 166, 14, 10); P.caja(k, 14, 156, 10, 8); P.barril(k, 296, 162, 11, 13); P.barril(k, 307, 166, 11, 13);
  }
  O[5] = ["Orlang Park", "La torre de los hombres-pez, con su boca de tiburón", orlang, { ven: ["#2a4a5a"], tinte: 0.15 }];

  const ORO = ["#fff6c4", "#f8e28a", "#ecc65a", "#d4a43a", "#ac7e26", "#7e5a18"];
  const PIEDRA_S = ["#faf4e6", "#ece2cc", "#d8ccb2", "#bcae92", "#9a8c72", "#726652"];
  function skypeia(k) {
    k.banda(["#2a7ad0", "#4f9ae0", "#8cc8f0", "#d0ecfa"], 0, 130);
    cirros(k, 8, 6, 40);
    nubarron(k, -24, 50, 100, 26); nubarron(k, 96, 76, 90, 16); nubarron(k, 262, 36, 84, 20);
    [[22, 104, 40], [196, 100, 30]].forEach(([x, y, w]) => { nubarron(k, x, y, w, 6, ["#ffffff", "#eef6fc", "#d4e6f4"]); for (let i = 0; i < 3; i++) { const px = x + 6 + i * (w / 3); trazo(k, [[px, y - 1], [px + 1, y - 7]], "#8a9a8a"); k.R(px - 2, y - 8, 5, 1, "#7a9a7a"); } });
    const LI = ["#a8e080", "#80c860", "#5aa848", "#3e8a3a", "#2a6a2e", "#1c4c22"];
    for (let y = 0; y < 134; y++) { const c = 248 + Math.sin(y / 17) * 12, a = 11 + (y / 132) * 6; for (let x = Math.round(c - a); x <= c + a; x++) { const u = (x - c) / a; k.P(x, y, rampa(LI, 0.08 + Math.abs(u + 0.35) * 0.6 + (Math.sin(u * 7 + y * 0.12) > 0.6 ? 0.18 : 0) + (fbm(x * 0.2, y * 0.05, 71) - 0.5) * 0.25, x, y)); } }
    [[30, 1], [62, -1], [92, 1], [118, -1]].forEach(([y, d], i) => { const x = 248 + Math.sin(y / 17) * 12 + d * 14; const pts = []; for (let a = 0; a < 9; a += 0.25) pts.push([x + d * (a * 2.2 + Math.cos(a) * (4 - a * 0.3)), y - 4 + Math.sin(a) * (4 - a * 0.3)]); trazo(k, pts, LI[2], 1); });
    [[20, -1], [46, 1], [74, -1], [100, 1]].forEach(([y, d], i) => {
      const x = 248 + Math.sin(y / 17) * 12 + d * 14, hoja = [[x, y + 2], [x + d * 10, y - 7], [x + d * 26, y - 10], [x + d * 40, y - 2], [x + d * 28, y + 9], [x + d * 12, y + 9]];
      rellena(k, hoja, (px, py) => rampa(LI, 0.12 + ((py - y + 10) / 20) * 0.5 + Math.abs(px - x) / 40 * 0.15, px, py));
      trazo(k, [[x, y + 2], [x + d * 20, y - 1], [x + d * 38, y - 2]], LI[4], 1); for (let j = 1; j < 4; j++) { trazo(k, [[x + d * j * 9, y], [x + d * (j * 9 + 6), y - 6]], LI[3]); trazo(k, [[x + d * j * 9, y + 1], [x + d * (j * 9 + 6), y + 6]], LI[3]); }
    });
    T.rect(k, 76, 104, 132, 26, piedra(PIEDRA_S, { tx: 12, ty: 5, s: 72, musgo: { umbral: 0.62, pal: ["#a8d080", "#80b060", "#5a904a", "#3e7036"] } })); k.R(76, 103, 132, 2, PIEDRA_S[0]);
    [[86, 62, true], [114, 40, false], [170, 40, false], [198, 56, true]].forEach(([x, top, rota]) => {
      T.rect(k, x - 5, top, 10, 104 - top, (px, py) => rampa(PIEDRA_S, 0.08 + Math.abs((px - x + 2) / 6) * 0.55 + ((px - x + 5) % 3 === 0 ? 0.2 : 0) + (fbm(px * 0.3, py * 0.1, 73) - 0.5) * 0.2, px, py));
      if (rota) { for (let i = 0; i < 10; i++) k.R(x - 5 + i, top - 1 - Math.round(hash(i, x, 74) * 4), 1, 5, PIEDRA_S[1 + (i % 3)]); } else { k.R(x - 7, top - 3, 14, 3, PIEDRA_S[1]); k.R(x - 6, top - 1, 12, 1, PIEDRA_S[3]); }
      k.R(x - 7, 101, 14, 3, PIEDRA_S[3]);
      if (rota) trazo(k, [[x - 4, 104], [x + 3, 92], [x - 3, 80], [x + 4, 70]], (f) => LI[f < 0.5 ? 3 : 2], 1.5, 1);
    });
    rellena(k, [[108, 40], [176, 40], [176, 29], [142, 20], [108, 29]], T.tex(PIEDRA_S, { v0: 0.2, s: 75, g: 0.3, dx: 0.4, x0: 108, ancho: 68 })); k.R(108, 37, 68, 3, PIEDRA_S[3]); for (let x = 112; x < 174; x += 6) k.R(x, 33, 3, 2, PIEDRA_S[4]);
    trazo(k, [[108, 29], [142, 20], [176, 29]], PIEDRA_S[0], 1);
    k.R(140, 40, 3, 6, "#6a5020");
    const campana = [[142, 45], [151, 49], [157, 64], [159, 84], [168, 98], [170, 102], [114, 102], [116, 98], [125, 84], [127, 64], [133, 49]];
    rellena(k, campana, (x, y) => rampa(ORO, 0.1 + Math.pow(Math.abs((x - 142) / 28 + 0.38), 1.2) * 0.75 + ((y === 60 || y === 72 || y === 92) ? 0.3 : 0) + (y > 94 ? 0.12 : 0), x, y));
    trazo(k, [[136, 54], [133, 66], [132, 82]], ORO[0], 2, 1); bola(k, 142, 101, 28, 3, (x, y) => rampa(ORO, 0.4 + ((y - 99) / 4) * 0.4, x, y)); k.elipse(142, 104, 4, 3, ORO[5]);
    for (let x = 128; x < 158; x += 5) k.P(x, 78, ORO[4]);
    k.R(0, 128, W, 52, "#f4f8fa");
    [[-30, 118, 90, 12], [64, 124, 80, 9], [152, 122, 90, 9], [252, 118, 100, 13], [-20, 140, 120, 11], [108, 146, 110, 9], [224, 142, 120, 11], [-16, 164, 140, 11], [140, 168, 120, 9], [262, 164, 90, 11]].forEach(([x, y, w, h]) => nubarron(k, x, y, w, h, ["#ffffff", "#f0f6fb", "#d6e6f2"]));
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 76) * W, y = 132 + hash(i, 2, 76) * 46; k.alfa(0.5, () => k.R(x, y, 6 + hash(i, 3, 76) * 10, 1, "#c8dcec")); }
    k.poli([[286, 152], [314, 152], [308, 158], [292, 158]], "#c9a03c"); k.R(299, 134, 1, 18, "#6d4628"); k.poli([[300, 134], [312, 148], [300, 150]], "#f4efe0"); k.poli([[300, 140], [308, 148], [300, 149]], "#e6dccb");
    const pez = [[40, 122], [46, 118], [52, 117], [56, 119], [52, 122], [46, 123]]; rellena(k, pez, () => "#8ab0d8"); k.P(53, 119, "#1c1c22"); trazo(k, [[40, 122], [36, 119]], "#6a90c0"); trazo(k, [[40, 122], [36, 125]], "#6a90c0");
  }
  O[7] = ["Skypeia", "Las islas en el cielo, con su mar de nubes blancas", skypeia, { tinte: 0.45, ven: VEN }];

  const AG = ["#f0fcff", "#c4eefa", "#8ad4f0", "#4aaedc", "#2a86bc"], PI8 = ["#f4e8cc", "#e2d2ae", "#c8b68e", "#a8966e", "#847452"];
  function water7(k) {
    const { h } = cuando(k), cx = 160, lit = encendido(k), tormenta = h >= 18 && h <= 20;
    k.banda(OP_CIELO, 0, 114);
    const OS = ["#8a96a8", "#6a7488", "#4a5468"];
    nubarron(k, -20, 40, 86, 18, tormenta ? OS : undefined); nubarron(k, 258, 30, 84, 16, tormenta ? OS : undefined); cirros(k, 6, 4, 26);
    P.mar(k, 88, 136, PAL.MAR, { s: 81 }); reflejo(k, 90, 130);
    T.gaviota(k, 70, 30, 1); T.gaviota(k, 86, 24, 0.8); T.gaviota(k, 236, 52, 1);
    if (tormenta) [[-1, 0], [1, 320]].forEach(([d, x0]) => {
      const s = (19 - Math.min(h, 19)) * 24, cr = 40 + s, X = (u) => x0 - d * u;
      rellena(k, [[X(-2), 100], [X(-2), cr - 4], [X(30), cr - 10], [X(62), cr + 2], [X(58), cr + 12], [X(48), cr + 10], [X(60), cr + 34], [X(92), 100]], (x, y) => rampa(["#7fd0f0", "#3fa6d8", "#2a7ab0", "#1f5f90", "#164a74"], ((y - cr) / 60) * 0.8 + (fbm(x * 0.1, y * 0.2, 82) - 0.5) * 0.3, x, y));
      for (let u = 0; u <= 64; u++) { const y = cr - 10 + Math.pow((u - 30) / 30, 2) * 11; k.R(X(u), y, 2, 3 + (u % 5 === 0 ? 2 : 0), "#ffffff"); if (u % 3 === 0) k.P(X(u), y - 2, "#e8fbff"); }
      for (let i = 0; i < 9; i++) k.elipse(X(50 + (i % 3) * 7), cr + 12 + i * 2, 2 + (i % 2), 1, "#ffffff");
    });
    const PAREDES = [["#fff8ec", "#f6ead2", "#e8d8b8", "#d4c09c", "#b8a07c"], ["#fdf0e6", "#f6dcc8", "#e8c4aa", "#d4a88c", "#b88a70"], ["#f0f6f8", "#dce8ec", "#c4d4dc", "#a8bcc6", "#8aa0ac"], ["#fffaf0", "#f8eed2", "#ecdcb0", "#d8c48e", "#bca670"]];
    const casita = (x, b, w, a, i) => {
      const PA = PAREDES[i % 4], TE = i % 3 ? PAL.TEJA_R : ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"];
      T.rect(k, x, b - a, w, a, (px, py) => rampa(PA, 0.08 + ((px - x) / w) * 0.4 + (fbm(px * 0.3, py * 0.3, 83 + i) - 0.5) * 0.2, px, py));
      for (let f = 0; f * 7 + 6 < a; f++) for (let v = x + 2; v < x + w - 4; v += 5) { k.R(v, b - a + 3 + f * 7, 3, 4, "#3f6f9a"); k.P(v, b - a + 3 + f * 7, "#8ab0d0"); k.R(v - 1, b - a + 7 + f * 7, 5, 1, PA[4]); if (hash(v, f, 84) > 0.7) k.P(v + 1, b - a + 7 + f * 7, "#e8504a"); }
      rellena(k, [[x - 1, b - a + 1], [x + 2, b - a - 6], [x + w - 2, b - a - 6], [x + w + 1, b - a + 1]], tejas(TE, { w: 3, h: 2, s: 85 + i, y0: b - a - 6 })); k.R(x - 1, b - a + 1, w + 2, 1, TE[4]);
    };
    const TER = [[38, 46, 4, 9, 8], [62, 82, 6, 10, 16], [88, 122, 8, 10, 18], [114, 176, 6, 20, 20]];
    TER.forEach(([t, a, s, m, alto], i) => {
      const y = (x) => t + s * ((x - cx) / a) ** 2, paso = 15 + i * 2, hueco = 10 + i * 6, sitio = [];
      for (let x = cx - a + 2; x < cx + a - 4; x += paso) sitio.push(x);
      sitio.sort((p, q) => Math.abs(q - cx) - Math.abs(p - cx));
      sitio.forEach((x, j) => { if (Math.abs(x + paso / 2 - cx) < hueco + paso / 2) return; casita(x, y(x + paso / 2) + 2, paso + 1, alto + ((x * 7) % 5), j + i * 5); });
      for (let x = Math.max(0, cx - a); x < Math.min(320, cx + a); x++) { const y0 = Math.round(y(x)); for (let yy = y0; yy < y0 + m; yy++) { const c = celdas(x, yy - y0, 8, 4, 86 + i, 0.4); k.P(x, yy, c.borde < 0.1 ? PI8[4] : rampa(PI8, 0.06 + ((x - cx + a) / (2 * a)) * 0.5 + (c.id - 0.5) * 0.2, x, yy)); } k.P(x, y0, "#fff8ea"); k.P(x, y0 + m, "#5a4e38"); }
      if (m > 12) for (let x = 6; x < 320; x += 26) { if (Math.abs(x + 8 - cx) < 40) continue; const y0 = y(x + 8); k.elipse(x + 8, y0 + 10, 8, 6, "#26506e"); k.R(x, y0 + 10, 17, 10, "#26506e"); k.R(x, y0 + 17, 17, 3, AG[3]); k.R(x - 1, y0 + 4, 19, 1, PI8[0]); }
      [-0.56, 0.56].forEach((f) => { const x = cx + f * a, y0 = y(x), w = 4 + i; for (let px = 0; px < w; px++) for (let yy = y0; yy < y0 + m + 2; yy++) k.P(x + px - w / 2, yy, (px + yy) % 5 === 0 ? AG[0] : AG[1 + (px % 2)]); k.elipse(x, y0 + m + 2, w, 2, "#ffffff"); });
    });
    rellena(k, [[cx - 24, 40], [cx + 24, 40], [cx + 60, 136], [cx - 60, 136]], (x, y) => (y % 7 === 0 ? PI8[4] : rampa(PI8, 0.08 + ((x - cx + 60) / 120) * 0.5 + (fbm(x * 0.2, y * 0.3, 87) - 0.5) * 0.2 + (y % 7 === 1 ? -0.1 : 0), x, y)));
    Det.cilindro(k, cx - 38, 34, 76, 26, ["#fbf3de", "#efe2c4", "#d8c8a4", "#b8a67e", "#94845e"], 0.3); for (let x = cx - 33; x < cx + 30; x += 11) { k.elipse(x + 3, 47, 3, 4, "#26506e"); k.R(x, 47, 7, 10, "#26506e"); k.R(x, 55, 7, 2, AG[3]); } k.R(cx - 38, 58, 76, 2, "#847452"); k.R(cx - 38, 34, 76, 1, "#fff8ea");
    for (let y = 38; y < 136; y++) { const a = 7 + (y - 38) * 0.17; for (let x = Math.round(cx - a); x <= cx + a; x++) k.P(x, y, Math.sin(x * 1.3 + y / 9) > 0.6 ? AG[0] : rampa(AG, ((Math.sin(x * 0.8) + 1) / 2) * 0.8, x, y)); k.P(cx - a - 1, y, PI8[0]); k.P(cx + a + 1, y, PI8[3]); }
    TER.forEach(([t]) => { k.elipse(cx, t + 9, 10 + (t - 38) * 0.18, 2, "#ffffff"); });
    k.elipse(cx, 37, 46, 8, PI8[2]); k.elipse(cx, 35, 46, 8, PI8[0]); k.elipse(cx, 35, 41, 6, AG[3]); k.elipse(cx - 6, 34, 30, 3, AG[2]);
    Det.cilindro(k, cx - 8, 16, 16, 20, ["#fbf3de", "#efe2c4", "#d8c8a4", "#b8a67e"], 0.3); k.elipse(cx, 16, 18, 4, PI8[2]); k.elipse(cx, 15, 18, 4, PI8[0]); k.elipse(cx, 15, 15, 2, AG[3]);
    for (let y = -2; y < 16; y++) { const a = 3 + (y + 2) * 0.1; for (let x = Math.round(cx - a); x <= cx + a; x++) k.P(x, y, (x + y) % 3 ? AG[1] : AG[0]); }
    [-1, 1].forEach((d) => [[42, 3], [32, 2], [22, 2]].forEach(([l, g]) => { for (let t = 0; t <= 1; t += 0.012) k.R(cx + d * t * l - g / 2, 1 + t * t * 33, g, 2, t < 0.2 || t > 0.8 ? AG[0] : AG[1]); k.elipse(cx + d * l, 34, 4, 1, "#ffffff"); }));
    for (let y = 134; y < 150; y++) k.R(0, y, W, 1, y < 140 ? AG[3] : y < 146 ? "#2f8fc4" : "#2878ac");
    const PU = (x0) => piedra(PI8, { tx: 9, ty: 4, s: 88 + x0 });
    [[30, 80], [210, 80]].forEach(([x, w]) => { T.rect(k, x, 120, w, 26, PU(x)); k.elipse(x + w / 2, 146, w * 0.36, 18, "#2f8fc4"); k.elipse(x + w / 2, 147, w * 0.3, 14, "#2878ac"); k.R(x, 120, w, 2, "#fff8ea"); for (let px = x + 3; px < x + w; px += 8) { k.R(px, 113, 2, 7, PI8[3]); k.P(px, 113, PI8[0]); } k.R(x, 112, w, 2, PI8[1]); });
    espejo(k, 134, 136, 150, { tinte: "#2a7ab0", mezcla: 0.5, onda: 2 });
    rellena(k, [[122, 138], [190, 138], [182, 147], [130, 147]], madera(PAL.MAD_O, { paso: 2, largo: 99, s: 89 })); k.R(122, 138, 68, 2, PAL.MAD[1]); k.R(150, 124, 2, 14, PAL.MAD_O[3]);
    rellena(k, [[134, 126], [168, 126], [160, 120], [142, 120]], (x, y) => rampa(["#f8e090", "#e8c35a", "#c8a040"], (y - 120) / 6, x, y));
    trazo(k, [[190, 140], [198, 136], [206, 130]], "#c9502f", 5, 4); esfera(k, 212, 126, 9, 7, ["#f8a070", "#e07848", "#c0582e", "#90401e"]); k.R(213, 122, 4, 4, "#ffffff"); k.R(214, 123, 2, 3, "#1c1c22"); k.R(217, 128, 4, 1, "#7a2a18"); k.poli([[204, 134], [198, 124], [207, 130]], "#a83e22"); k.poli([[218, 121], [222, 114], [221, 122]], "#a83e22");
    suelo3d(k, 150, 180, 160, 104, losas3d(["#ece0c4", "#dcceac", "#c6b690", "#a89874", "#887858"], { tx: 10, tz: 7, s: 90 })); k.R(0, 149, W, 2, "#fbf0d8"); k.alfa(0.25, () => k.R(0, 151, W, 2, "#5a4a30"));
    T.rect(k, 298, 70, 6, 80, madera(PAL.MAD_O, { paso: 3, vertical: true, largo: 99, s: 91 })); trazo(k, [[302, 76], [258, 62]], PAL.MAD_O[2], 3); trazo(k, [[302, 96], [268, 63]], PAL.MAD_O[3], 2); k.R(262, 62, 1, 30, "#3a2a20"); k.R(258, 92, 10, 5, PAL.MAD[2]); k.R(258, 92, 10, 1, PAL.MAD[0]);
    const L = [T.farola(k, 108, 151, 26), T.farola(k, 226, 151, 26)];
    [[26], [294]].forEach(([x]) => { Det.cilindro(k, x - 3, 140, 7, 12, ["#8a8a94", "#6a6a74", "#4a4a54"]); k.R(x - 4, 139, 9, 2, "#a8a8b4"); });
    P.barril(k, 70, 168, 11, 13); P.barril(k, 82, 171, 11, 13); P.caja(k, 244, 172, 14, 11); P.caja(k, 256, 166, 12, 9);
    luces(k, [...L, { x: 160, y: 100, r: 120, ry: 40, col: LUZ, f: lit * 0.45 }]);
  }
  const OP_CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];
  O[8] = ["Wetar 7", "La ciudad de los canales: sube por terrazas hasta la gran fuente, y el agua baja de una a otra hasta el mar", water7, { ven: ["#3f6f9a", "#ffd27a"], dx: 84 }];

  const MUR9 = ["#7a6c98", "#62567e", "#4c4266", "#3a3252", "#2a2440", "#1c182e"];
  function thriller(k) {
    k.banda(["#160f2a", "#241a42", "#3a2a5e", "#4a3a6e"], 0, 120);
    k.astro(70, 46, 22, "#f2eeb8", "#7a6a9a");
    [[60, 40, 2], [78, 52, 3], [64, 56, 2], [84, 38, 2], [72, 34, 1]].forEach(([x, y, r]) => k.elipse(x, y, r, r, "#d8d29c"));
    for (let i = 0; i < 50; i++) k.crudo(hash(i, 1, 91) * W, hash(i, 2, 91) * 80, 1, 1, i % 4 ? "#c8c0e8" : "#ffffff");
    const NIE = ["#5a4e7a", "#463c66", "#342c52"];
    nubarron(k, 186, 34, 150, 14, NIE); nubarron(k, -24, 76, 110, 12, NIE);
    [[236, 30, 92], [272, 22, 100], [304, 40, 82]].forEach(([x, top, base], i) => { k.R(x, top, 3, base - top, "#241c38"); [0.25, 0.55].forEach((f) => { const y = top + (base - top) * f; k.R(x - 16, y, 35, 2, "#241c38"); rellena(k, [[x - 14, y + 2], [x + 16, y + 2], [x + 13, y + 16], [x + 5, y + 12], [x - 2, y + 18], [x - 12, y + 14]], () => "#2c2444"); }); });
    k.cordillera(122, 34, "#2a1f44", "#3a2e58", 2.4);
    const muro = (x0, w, s) => (px, py) => { const c = celdas(px, py, 7, 4, s, 0.6); if (c.borde < 0.1) return MUR9[5]; return rampa(MUR9, 0.1 + ((px - x0) / w) * 0.6 + (c.id - 0.5) * 0.22 + (hash(px, py, s) - 0.5) * 0.08, px, py); };
    const torreT = (x, base, w, h, ladea, s) => {
      rellena(k, [[x, base], [x + ladea, base - h], [x + w + ladea, base - h], [x + w, base]], muro(x, w + Math.abs(ladea), s));
      rellena(k, [[x + ladea - 4, base - h + 1], [x + w + ladea + 4, base - h + 1], [x + w * 0.7 + ladea * 2, base - h - 14], [x + w * 0.5 + ladea * 3.4, base - h - w * 1.5]], (px, py) => (px < x + ladea + w * 0.45 ? "#33285a" : "#1f1832"));
      for (let y = base - h + 8; y < base - 8; y += 13) { const vx = x + w * 0.5 + ladea * (base - y) / h; k.R(vx - 3, y - 1, 6, 8, "#1a1428"); k.R(vx - 2, y, 4, 6, "#ffcf6a"); k.R(vx - 2, y + 2, 4, 1, "#c8902a"); k.R(vx, y, 1, 6, "#c8902a"); }
    };
    torreT(112, 118, 24, 58, -6, 92); torreT(186, 118, 22, 50, 7, 93); torreT(148, 118, 34, 78, 4, 94);
    rellena(k, [[120, 118], [126, 84], [200, 80], [208, 118]], muro(120, 88, 95));
    for (let x = 130; x < 198; x += 12) T.ventana(k, x, 92 + (x % 3), 6, 12, { arco: true, marco: "#1a1428", vidrio: "#ffcf6a", brillo: "#ffe8a0" });
    k.R(124, 82, 80, 2, MUR9[0]); for (let x = 124; x < 204; x += 6) k.R(x, 79 - (x % 12 === 4 ? 2 : 0), 3, 3, MUR9[2]);
    [[128, 80], [196, 77]].forEach(([x, y], i) => { k.poli([[x - 4, y], [x + 4, y], [x + 2, y - 5], [x - 2, y - 5]], "#1c1628"); k.poli([[x - 2, y - 5], [x - 9 + i * 18, y - 9], [x - 4 + i * 8, y - 3]], "#1c1628"); k.P(x - 1, y - 4, "#ff6a5a"); });
    k.elipse(164, 108, 10, 10, "#140e20"); k.R(154, 108, 20, 10, "#140e20"); k.R(154, 116, 20, 2, "#3a3050"); for (let i = 0; i < 4; i++) k.R(150 - i * 2, 118 + i * 2, 28 + i * 4, 2, MUR9[2 + (i % 2)]);
    rellena(k, [[-2, 118], [322, 118], [322, 180], [-2, 180]], T.tex(["#3e4a44", "#323e38", "#28322e", "#1e2824", "#161e1a"], { v0: 0.2, s: 96, dy: 0.5, y0: 118, alto: 62, g: 0.5 }));
    briznas(k, 0, W, 120, ["#1a2420", "#2a3a32", "#3e5246"], { n: 260, alto: 4, s: 97, y1: 180 });
    for (let y = 122; y < 180; y++) { const f = (y - 122) / 58, c = 164 + Math.sin(f * 3.4) * f * 22, w = 4 + f * 18; for (let x = Math.round(c - w); x <= c + w; x++) { const cel = celdas(x, y * 1.6, 7 + f * 6, 5 + f * 4, 98, 0.6); k.P(x, y, cel.borde < 0.12 ? "#1e1c26" : rampa(["#6a6878", "#56546a", "#44425a", "#34324a"], 0.2 + (cel.id - 0.5) * 0.4 + f * 0.3, x, y)); } }
    for (let x = 0; x < W; x += 5) { if (Math.abs(x - 164) < 14) continue; k.R(x, 120, 1, 9, "#18141e"); k.P(x, 119, "#2a2434"); } k.R(0, 122, 150, 1, "#18141e"); k.R(178, 122, 142, 1, "#18141e");
    [[30, 142, -2], [70, 158, 2], [224, 150, -2], [270, 136, 3], [112, 170, 2], [206, 172, -3], [48, 132, 1]].forEach(([x, y, l], i) => {
      sombraE(k, x + 6, y + 1, 8, 2, 0.5);
      if (i % 2) { rellena(k, [[x, y], [x + 1 + l, y - 13], [x + 8 + l, y - 13], [x + 9, y]], (px, py) => rampa(["#8a8898", "#6e6c7e", "#545266", "#3e3c4e"], 0.15 + (px - x) / 12, px, py)); k.elipse(x + 5 + l, y - 13, 4, 3, "#7a7888"); k.R(x + 3 + l * 0.6, y - 10, 4, 1, "#3e3c4e"); k.R(x + 3 + l * 0.6, y - 7, 4, 1, "#3e3c4e"); }
      else { k.R(x + 4 + l * 0.5, y - 15, 2, 15, "#5a5868"); k.R(x + 1 + l * 0.6, y - 11, 8, 2, "#5a5868"); k.P(x + 4 + l * 0.5, y - 15, "#7a7888"); }
    });
    rellena(k, [[90, 152], [104, 152], [102, 156], [92, 156]], () => "#1a1420"); trazo(k, [[96, 152], [95, 145], [93, 142]], "#7a9a6a", 2); [[91, 141], [93, 140], [95, 141], [97, 142]].forEach(([x, y]) => k.R(x, y - 2, 1, 3, "#8aaa7a"));
    [[244, 166], [58, 170]].forEach(([x, y]) => { esfera(k, x, y, 6, 5, ["#ffb04a", "#e8862a", "#c0601a", "#8a4010"]); k.R(x - 1, y - 7, 2, 2, "#3a5a2a"); k.crudo(x - 3, y - 2, 2, 2, "#ffcf6a"); k.crudo(x + 2, y - 2, 2, 2, "#ffcf6a"); k.crudo(x - 3, y + 2, 7, 1, "#ffcf6a"); });
    const seco = (x, b, d) => { rellena(k, [[x - 6, b], [x - 2, b - 40], [x + 3, b - 62], [x + 5, b - 40], [x + 8, b]], corteza(["#3a3046", "#2e263a", "#221c2e", "#181422", "#100c18"], x - 6, 14, { s: x + 99 })); [[-30, 18, 2], [-44, 30, 2], [-52, -16, 2], [-24, -20, 1], [-60, 24, 1]].forEach(([dy, l, g]) => trazo(k, [[x, b + dy], [x + d * Math.abs(l), b + dy - Math.abs(l) * 0.7], [x + d * Math.abs(l) * 1.4, b + dy - Math.abs(l) * 0.5]], "#1a1420", g, 1)); };
    seco(10, 130, 1); seco(306, 132, -1); seco(-2, 182, 1); seco(322, 184, -1);
    bruma(k, 112, 180, "#8a86b0", 0.5, { s: 100, ey: 0.16 });
    for (let i = 0; i < 9; i++) { const x = 150 + hash(i, 1, 101) * 150, y = 10 + hash(i, 2, 101) * 40; k.R(x - 3, y, 3, 1, "#0e0a18"); k.R(x + 1, y, 3, 1, "#0e0a18"); k.P(x, y + 1, "#0e0a18"); k.P(x - 4, y - 1, "#0e0a18"); k.P(x + 4, y - 1, "#0e0a18"); }
    luces(k, [{ x: 164, y: 100, r: 60, ry: 28, col: "#ffcf7a", f: 0.55 }, { x: 244, y: 164, r: 14, col: "#ffb45a", f: 0.8 }, { x: 58, y: 168, r: 14, col: "#ffb45a", f: 0.8 }]);
  }
  O[9] = ["Threllir Bark", "La isla de los muertos, con su castillo bajo la luna", thriller, { base: "noche", astro: "siempre", tinte: 0.6, fuego: ["#ffcf6a", "#ffe8a0", "#c8902a"] }];

  function sobaady(k) {
    k.banda(["#7fd0e6", "#a8e2ee", "#d8f4f0"], 0, 138);
    for (let i = 0; i < 9; i++) { const x = 10 + i * 38, w = 10 + (i % 3) * 4; T.rect(k, x, 50, w, 90, (px, py) => rampa(["#b8dcd8", "#a4ccc8", "#90bcb8"], 0.2 + (px - x) / w * 0.6, px, py)); copa(k, x + w / 2, 46, 22, 12, ["#c8e8d8", "#b4dcc8", "#a0d0b8", "#8cc0a8", "#78b098"], { r: 5, s: 110 + i }); }
    const nx = 160, ny = 76, nr = 30;
    for (let a = 0; a < Math.PI * 2; a += 0.01) { k.P(nx + Math.cos(a) * nr, ny + Math.sin(a) * nr, "#e8eef4"); k.P(nx + Math.cos(a) * (nr - 3), ny + Math.sin(a) * (nr - 3), "#c8d0dc"); }
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; trazo(k, [[nx, ny], [nx + Math.cos(a) * nr, ny + Math.sin(a) * nr]], "#d0d8e2"); k.R(nx + Math.cos(a) * nr - 2, ny + Math.sin(a) * nr - 1, 4, 4, ["#e8504a", "#f2c84b", "#3f8ac0", "#3fb85a", "#e86a9a", "#9a6ad0"][i % 6]); }
    k.elipse(nx, ny, 3, 3, "#a8b0bc"); trazo(k, [[nx, ny], [nx - 12, 120]], "#b8c0cc", 2); trazo(k, [[nx, ny], [nx + 12, 120]], "#b8c0cc", 2);
    const ola = (x) => 92 + Math.sin(x / 14) * 10; for (let x = 196; x < 300; x++) { k.P(x, ola(x), "#e86a6a"); k.P(x, ola(x) + 1, "#c84a4a"); if (x % 8 === 0) k.R(x, ola(x) + 2, 1, 126 - ola(x), "#d0d8e0"); }
    for (let i = 0; i < 12; i++) copa(k, -10 + i * 30, 6 + (i % 2) * 8, 26, 14, ["#9ade8c", "#76c470", "#58a858", "#3e8a46", "#2a6c36"], { r: 6, s: 120 + i });
    const TR = ["#c8ae94", "#a88e74", "#8a7058", "#6c5440", "#4e3a2a", "#34261a"];
    [[58, 28, "GR 24"], [124, 22, "GR 13"], [206, 24, "GR 30"], [284, 32, "GR 41"]].forEach(([x, w, nombre], i) => {
      rellena(k, [[x - w / 2, 16], [x + w / 2, 16], [x + w / 2 + 2, 120], [x + w / 2 + 10, 140], [x - w / 2 - 10, 140], [x - w / 2 - 2, 120]], corteza(TR, x - w / 2, w, { s: 130 + i, grieta: 0.55, musgo: { umbral: 0.66, pal: ["#a8d088", "#88b870", "#6a9a58", "#4e7c44"] } }));
      [-1.2, -0.6, 0.5, 1.1].forEach((d, j) => trazo(k, Det6.bezier([x + d * w * 0.4, 112 + j * 3], [x + d * w * 0.9, 120], [x + d * w * 1.2, 132], [x + d * w * 1.5, 146 + (j % 2) * 4], 14), (f) => TR[f < 0.5 ? 2 : 3], 4, 1.5));
      k.R(x - 13, 70, 26, 11, "#f4efe0"); k.R(x - 13, 70, 26, 1, "#ffffff"); k.R(x - 13, 80, 26, 1, "#b8b0a0"); rotulo(k, x - 10, 73, nombre, "#26262a");
      for (let j = 0; j < 6; j++) k.P(x - w / 2 + 2 + hash(i, j, 131) * (w - 4), 30 + hash(j, i, 131) * 80, "#e8f8ff");
    });
    T.prado(k, 138, ["#c8ec98", "#a8dc80", "#8cc86a", "#70b058", "#569448", "#3e7838"], 132, { flores: { n: 30, cols: ["#ffffff", "#ffe88a", "#f8a8c8"] } });
    for (let y = 140; y < 180; y++) { const f = (y - 140) / 40, c = 170 + Math.sin(f * 2.6) * 20 * f, w = 3 + f * 12; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#e8dcb8", "#d8c8a0", "#c4b088", "#a89270"], 0.2 + Math.abs(x - c) / w * 0.4 + (hash(x, y, 133) - 0.5) * 0.2, x, y)); }
    T.casa(k, 132, 140, 30, 20, { techo: PAL.TEJA_A, s: 134, ventanas: [0.2], puerta: 0.7, alto: 10 }); k.R(138, 123, 14, 6, "#3a2a20"); rotulo(k, 140, 124, "BAR", "#ffe08a");
    [[40, 150], [96, 146], [230, 148], [270, 152], [300, 140]].forEach(([x, y], i) => { for (let j = 0; j < 3; j++) T.burbuja(k, x + j * 4 - 4, y - j * 5 - 4, 2 + j); });
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, 135) * W, y = 20 + hash(i, 2, 135) * 110, r = 2 + Math.floor(hash(i, 3, 135) * 7); T.burbuja(k, x, y, r); }
  }
  O[10] = ["El archipiélago Sobaady", "Manglares gigantes y burbujas que suben del suelo", sobaady, { tinte: 0.45, ven: VEN }];

  const BLANCO = ["#ffffff", "#eef0f4", "#d8dde6", "#bcc4d0", "#9aa4b4", "#788294"];
  function miraneford(k) {
    const lit = encendido(k);
    k.banda(["#1c2a4a", "#2a3a5e", "#3e5070", "#56688a"], 0, 100);
    nubarron(k, -20, 30, 110, 16, ["#4e5c7a", "#3e4a66", "#303a52"]); nubarron(k, 230, 22, 110, 14, ["#4e5c7a", "#3e4a66", "#303a52"]);
    P.mar(k, 92, 112, ["#2a4a6e", "#24405e", "#1c3450", "#162a42", "#102034"], { s: 141, cresta: "#5a7a9a", medio: "#3a5a7a", espejo: false });
    [[20, 104, 22], [56, 100, 14], [262, 102, 18], [300, 106, 24]].forEach(([x, y, w]) => rellena(k, [[x - w / 2, y + 6], [x - w / 3, y - 4], [x, y - 7], [x + w / 3, y - 3], [x + w / 2, y + 6]], (px, py) => rampa(["#e8f4ff", "#c8e0f4", "#a0c4e0", "#7aa4c8"], 0.1 + ((px - x) / w) * 0.6 + (py - y) * 0.03, px, py)));
    const muro = (x0, w, s) => piedra(BLANCO, { tx: 11, ty: 4, s, jit: 0.4 });
    T.rect(k, 52, 62, 216, 50, muro(52, 216, 142)); T.rect(k, 112, 26, 96, 40, muro(112, 96, 143)); T.rect(k, 136, 6, 48, 24, muro(136, 48, 144));
    k.alfa(0.3, () => { k.R(230, 62, 38, 50, "#3a4a6a"); k.R(184, 26, 24, 40, "#3a4a6a"); });
    [[52, 62, 216], [112, 26, 96], [136, 6, 48]].forEach(([x, y, w]) => { k.R(x - 3, y - 3, w + 6, 3, BLANCO[2]); k.R(x - 3, y - 1, w + 6, 1, BLANCO[4]); for (let px = x - 2; px < x + w + 2; px += 6) k.R(px, y - 6, 3, 3, BLANCO[3]); });
    for (let f = 0; f < 3; f++) for (let x = 58; x < 262; x += 10) { if (f === 2 && x > 128 && x < 192) continue; T.ventana(k, x, 68 + f * 14, 5, 8, { marco: "#5a6478", vidrio: "#3f6f9a" }); }
    for (let f = 0; f < 2; f++) for (let x = 118; x < 204; x += 10) { if (x > 140 && x < 180) continue; T.ventana(k, x, 32 + f * 15, 5, 8, { marco: "#5a6478", vidrio: "#3f6f9a" }); }
    bola(k, 160, 44, 15, 15, (x, y) => rampa(["#4a7ac8", "#3a64b0", "#2c5094", "#203c74"], 0.2 + ((x - 160) + (y - 44)) / 40, x, y)); bola(k, 160, 44, 12, 12, () => "#f4f6fa");
    trazo(k, [[150, 44], [155, 40], [160, 43], [165, 40], [170, 44]], "#2c5094", 2); k.R(159, 44, 2, 7, "#2c5094"); k.R(156, 48, 8, 1, "#2c5094");
    rotuloG(k, 136, 93, "MARINE", "#2c5094", 2);
    [[136, 6], [184, 6]].forEach(([x, y]) => { k.R(x, y - 10, 1, 10, "#4a4a54"); Det.bandera(k, x + 1, y - 10, 10, 6, "#f4f6fa", "#d8dce4"); k.R(x + 4, y - 8, 3, 2, "#3a64b0"); });
    if (lit > 0) rayos(k, [[138, 6, 10, 26, 2, 30], [182, 6, 312, 18, 2, 30]], "#fff6d8", 0.3 * lit);
    suelo3d(k, 112, 180, 160, 98, losas3d(["#c4c8d0", "#aab0bc", "#9298a6", "#7a8090", "#626878"], { tx: 26, tz: 18, s: 148 }));
    rellena(k, [[-2, 96], [40, 104], [52, 134], [-2, 134]], piedra(["#b8c0cc", "#a0a8b6", "#8890a0", "#70788a", "#586072"], { tx: 10, ty: 5, s: 145 })); rellena(k, [[322, 96], [280, 104], [268, 134], [322, 134]], piedra(["#b8c0cc", "#a0a8b6", "#8890a0", "#70788a", "#586072"], { tx: 10, ty: 5, s: 146 }));
    T.canon(k, 30, 152, 1); T.canon(k, 292, 152, -1);
    T.rect(k, 110, 106, 100, 24, madera(PAL.MAD_O, { paso: 4, largo: 30, s: 147 })); k.R(110, 105, 100, 2, PAL.MAD[1]);
    for (let x = 114; x < 210; x += 16) k.R(x, 108, 3, 22, PAL.MAD_O[4]);
    [120, 198].forEach((x) => T.rect(k, x, 82, 4, 24, madera(PAL.MAD_O, { paso: 2, vertical: true, largo: 99, s: x }))); k.R(116, 80, 88, 4, PAL.MAD_O[3]); k.R(116, 80, 88, 1, PAL.MAD[2]);
    for (let i = 0; i < 6; i++) k.R(146 - i * 2, 130 + i * 0, 28 + i * 4, 1, PAL.MAD_O[i % 2 ? 2 : 4]);
    const grieta = (g) => { trazo(k, g, "#141418", 3, 1); trazo(k, g.map(([x, y]) => [x + 2, y]), "#c8ccd6", 1); };
    grieta([[20, 180], [44, 166], [36, 156], [62, 146], [58, 136]]); grieta([[300, 180], [282, 168], [292, 158], [266, 148], [272, 138]]); grieta([[140, 180], [150, 170], [146, 160]]);
    const F = [];
    [[56, 132], [268, 134]].forEach(([x, y]) => { for (let i = 0; i < 5; i++) k.R(x - 8 + i * 4, y - 2 - (i % 2) * 2, 4, 3, ["#5a4a3a", "#3a2a20"][i % 2]); fuego(k, x, y - 2, 8, 12, { s: x }); F.push({ x, y: y - 6, r: 30, ry: 18, col: "#ff9a4a", f: 1 }); });
    trazo(k, [[86, 172], [104, 162]], "#a8acb8", 1); k.R(84, 172, 3, 2, "#5a4a3a"); trazo(k, [[232, 170], [246, 176]], "#a8acb8", 1);
    luces(k, [...F, { x: 160, y: 80, r: 110, ry: 34, col: "#cfe0ff", f: lit * 0.3 }]);
  }
  O[11] = ["Miraneford", "El cuartel de la Marina, en su bahía", miraneford, { ven: ["#3f6f9a", "#ffd27a"], fuego: ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const O = (window.SitiosIt15.piratas = window.SitiosIt15.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];
  const CEREZO = ["#fff0f6", "#fcd2e2", "#f4aac6", "#e084a8", "#b85c84"], TEJA_N = ["#7a8494", "#5e6878", "#46505e", "#323a46", "#20262e"];

  function wona(k) {
    const lit = encendido(k);
    k.banda(["#7ab4e4", "#a6cdee", "#d8e6f2", "#f4ece6"], 0, 112);
    for (let i = 0; i < 4; i++) { const y = 16 + i * 11, x = 120 + hash(i, 1, 201) * 200; k.alfa(0.6, () => { k.R(x, y, 60 + i * 10, 2, "#ffffff"); k.R(x + 8, y + 2, 40, 1, "#eef2f8"); }); }
    nubarron(k, 236, 62, 90, 12, ["#ffffff", "#f6eef2", "#e6d6e0"]);
    montana(k, 160, 112, 210, 92, { roca: ["#b4bccc", "#9aa4b8", "#828ca4", "#6c7690", "#58627c"], nieve: ["#ffffff", "#dfe6f0"], hasta: 0.3 });
    rellena(k, [[-2, 112], [40, 96], [90, 104], [140, 100], [200, 104], [260, 94], [322, 102], [322, 116], [-2, 116]], T.tex(["#8ea6b8", "#7a94a8", "#688298"], { v0: 0.3, s: 202 }));
    T.rect(k, 128, 84, 64, 26, madera(["#f4e6c8", "#e6d4ae", "#d2bc92", "#b49e76", "#8e7a58"], { paso: 3, vertical: true, largo: 99, s: 203 }));
    [130, 146, 174, 188].forEach((x) => Det.cilindro(k, x, 84, 3, 26, ["#e8503a", "#c83a28", "#9a2a1c", "#6a1c12"]));
    T.rect(k, 152, 92, 16, 18, (x, y) => rampa(["#3a2a24", "#2a1e1a", "#1c1410"], (y - 92) / 18, x, y)); k.R(159, 86, 2, 8, "#c8a040"); k.elipse(160, 95, 3, 2, "#e8c35a");
    T.tejadoJ(k, 160, 86, 92, 18, TEJA_N, 204, 5);
    const L = ["#ff7a5a", "#e8503a", "#c83a28", "#9a2a1c", "#6a1c12"];
    [[136, 8], [178, 8]].forEach(([x, w]) => { Det.cilindro(k, x, 52, w, 74, L, 0.28); k.R(x - 2, 122, w + 4, 4, "#26201e"); });
    k.R(126, 62, 68, 5, L[2]); k.R(126, 62, 68, 1, L[0]); k.R(126, 66, 68, 1, L[4]);
    for (let x = 116; x < 205; x++) { const u = (x - 160) / 44, y = 50 - Math.pow(Math.abs(u), 3) * 7; k.R(x, y, 1, 5, "#26201e"); k.P(x, y, "#4a3e3a"); k.R(x, y + 5, 1, 2, L[2]); }
    k.R(155, 55, 10, 11, "#1c1614"); k.R(156, 56, 8, 9, "#2a2220"); k.R(157, 58, 6, 1, "#e8c35a"); k.R(157, 61, 6, 1, "#e8c35a");
    Det.casaJ2(k, 22, 116, 46, 26, { noren: "#3a5a9a", deposito: false }); Det.casaJ2(k, 252, 116, 50, 28, { noren: "#c0392b" });
    T.prado(k, 116, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 205, { flores: { n: 26, cols: ["#ffffff", "#f8b8d0", "#ffe88a"] } });
    for (let y = 124; y < H; y++) { const f = (y - 124) / 56, w = 14 + f * 34, paso = (y - 124) % Math.round(3 + f * 5) === 0; for (let x = Math.round(160 - w); x <= 160 + w; x++) { const c = celdas(x, y, 9 + f * 8, 50, 206, 0.3); k.P(x, y, paso ? "#8a8478" : c.borde < 0.08 ? "#9a9488" : rampa(["#e6e0d4", "#d4cec0", "#c0b8a8", "#a8a090"], 0.2 + f * 0.3 + (c.id - 0.5) * 0.3, x, y)); } }
    const toro = (x, base, e) => { sombraE(k, x + 2, base, 7 * e, 2, 0.4); const ST = ["#e0dacc", "#c8c0b0", "#a8a090", "#888070"]; T.rect(k, x - 2 * e, base - 10 * e, 4 * e, 10 * e, (px, py) => rampa(ST, 0.2 + (px - x) / (4 * e), px, py)); T.rect(k, x - 5 * e, base - 13 * e, 10 * e, 3 * e, (px, py) => rampa(ST, 0.3 + (px - x) / (10 * e), px, py)); T.rect(k, x - 3 * e, base - 19 * e, 6 * e, 6 * e, (px, py) => rampa(ST, 0.2, px, py)); k.R(x - 2 * e, base - 17 * e, 4 * e, 3 * e, "#ffd27a"); rellena(k, [[x - 7 * e, base - 19 * e], [x + 7 * e, base - 19 * e], [x + 2 * e, base - 24 * e], [x - 2 * e, base - 24 * e]], (px, py) => rampa(ST, 0.15 + (px - x + 7 * e) / (14 * e) * 0.6, px, py)); return { x, y: base - 16 * e, r: 18 * e, ry: 14 * e, col: LUZ, f: lit }; };
    const LT = [toro(112, 132, 1), toro(208, 132, 1), toro(70, 168, 1.5), toro(250, 168, 1.5)];
    const tronco = ["#8a6a5a", "#6e5040", "#56382e", "#3e2620", "#2a1814"];
    arbol(k, 30, 124, 26, 36, 26, CEREZO, { tronco, g: 6, s: 207 }); arbol(k, 292, 126, 28, 38, 26, CEREZO, { tronco, g: 6, s: 208 });
    arbol(k, 102, 116, 10, 14, 10, CEREZO, { tronco, g: 3, s: 209 }); arbol(k, 220, 116, 10, 14, 10, CEREZO, { tronco, g: 3, s: 210 });
    for (let i = 0; i < 60; i++) { const x = hash(i, 1, 211) * W, y = 20 + hash(i, 2, 211) * 156; k.P(x, y, CEREZO[1 + (i % 3)]); if (i % 4 === 0) k.P(x + 1, y + 1, CEREZO[2]); }
    luces(k, LT);
  }
  O[12] = ["El país de Wona", "Cerezos, un torii rojo y la gran montaña", wona, { tinte: 0.8, ven: VEN }];

  function gyijon(k) {
    k.banda(["#0e3a6a", "#145088", "#1c68a2", "#2a84b8", "#3aa0c8"], 0, 140);
    rayos(k, [[150, 0, 120, 140, 8, 40], [196, 0, 210, 140, 6, 34], [250, 0, 290, 130, 6, 30], [90, 0, 60, 120, 4, 24]], "#bfeaff", 0.28);
    for (let a = Math.PI * 1.02; a < Math.PI * 1.98; a += 0.003) { const x = 160 + Math.cos(a) * 190, y = 150 + Math.sin(a) * 140; k.crudo(x, y, 1, 1, "#c8f0ff"); if (Math.sin(a * 40) > 0.3) k.crudo(x, y + 1, 1, 1, "#8ad0f0"); }
    k.alfa(0.08, () => k.elipse(160, 150, 186, 136, "#c8f0ff"));
    for (let i = 0; i < 26; i++) { const x = 236 + hash(i, 1, 221) * 70, y = 20 + hash(i, 2, 221) * 26; k.R(x, y, 4, 2, i % 3 ? "#e8f0f8" : "#f0a0a0"); k.P(x - 1, y, "#a0b8d0"); k.P(x + 3, y, "#26262a"); }
    for (let i = 0; i < 16; i++) { const x = 46 + hash(i, 1, 222) * 50, y = 54 + hash(i, 2, 222) * 18; k.R(x, y, 3, 2, "#f4c060"); k.P(x - 1, y, "#c89040"); }
    const CORAL = ["#ffe6ee", "#f8c8d6", "#ecaabe", "#d88aa4", "#b86a86", "#8e4e68"], DOR = ["#fff2b0", "#f4d870", "#d8ac40", "#a8842e"];
    const torre = (x, top, w, s) => { T.rect(k, x, top, w, 134 - top, (px, py) => rampa(CORAL, 0.06 + Math.pow(Math.abs((px - x) / w - 0.3) / 0.7, 1.2) * 0.6 + (fbm(px * 0.25, py * 0.2, s) - 0.5) * 0.2, px, py)); rellena(k, [[x - 2, top], [x + w + 2, top], [x + w / 2, top - w * 1.4]], (px, py) => rampa(DOR, 0.1 + (px - x) / w * 0.6, px, py)); k.P(x + w / 2, top - w * 1.4 - 1, "#fff6d8"); for (let y = top + 6; y < 120; y += 12) T.ventana(k, x + w / 2 - 2, y, 4, 6, { marco: CORAL[5], vidrio: "#ffd27a", cruz: false }); };
    T.rect(k, 104, 86, 112, 48, (x, y) => rampa(CORAL, 0.1 + ((x - 104) / 112) * 0.5 + (fbm(x * 0.2, y * 0.2, 223) - 0.5) * 0.2, x, y)); for (let x = 106; x < 214; x += 6) k.R(x, 82, 4, 4, CORAL[1]);
    torre(116, 54, 14, 224); torre(190, 54, 14, 225); torre(138, 30, 18, 226); torre(166, 34, 16, 227); torre(100, 74, 10, 228); torre(210, 74, 10, 229);
    for (let x = 110; x < 212; x += 12) if (Math.abs(x - 160) > 14) T.ventana(k, x, 100, 5, 8, { arco: true, marco: CORAL[5], vidrio: "#ffd27a" });
    bola(k, 160, 118, 14, 16, (x, y) => (y > 118 ? null : rampa(["#fff6fa", "#f8e0ec", "#ecc4d6", "#d8a4ba"], 0.1 + Math.abs(Math.sin(Math.atan2(y - 118, x - 160) * 5)) * 0.5, x, y))); T.rect(k, 152, 118, 16, 16, () => "#4a2a3a");
    T.rect(k, 0, 132, W, 48, (x, y) => rampa(["#f4ead2", "#e6d8b8", "#d4c4a0", "#bcaa86"], 0.15 + ((y - 132) / 48) * 0.4 + (Math.sin(x * 0.25 + Math.sin(y * 0.3) * 2) > 0.7 ? -0.12 : 0) + (hash(x, y, 230) - 0.5) * 0.1, x, y));
    for (let i = 0; i < 40; i++) { const x = 140 + hash(i, 1, 231) * 40 + (i % 2 ? -1 : 1) * (i * 0.6), y = 134 + (i / 40) * 46; esfera(k, x, y, 1.5 + (y - 134) / 30, 1.2 + (y - 134) / 40, ["#ffffff", "#f4eef6", "#d8d0e0"]); }
    const concha = (x, base, w, h, cols, s) => { sombraE(k, x + 2, base, w * 0.6, 2, 0.4); bola(k, x, base - h / 2, w / 2, h / 2, (px, py) => (py > base ? null : rampa(cols, 0.1 + Math.abs(Math.sin(Math.atan2(py - base, px - x) * 4)) * 0.45 + (py - base + h) / h * 0.25, px, py))); k.elipse(x, base - 4, 3, 4, "#3a2a3a"); k.R(x - 3, base - 4, 6, 4, "#3a2a3a"); k.elipse(x - w * 0.25, base - h * 0.55, 2, 2, "#ffd27a"); };
    concha(36, 140, 40, 26, ["#f8d8ec", "#e8b4d4", "#d090b8", "#a86a92"], 232); concha(76, 142, 30, 20, ["#e8e0fa", "#ccc0ec", "#a898d4", "#8070b0"], 233); concha(256, 140, 40, 26, ["#ffe0d0", "#f8c0a8", "#e09a80", "#b8745e"], 234); concha(292, 144, 30, 20, ["#f8d8ec", "#e8b4d4", "#d090b8", "#a86a92"], 235);
    const coral = (x, base, col, s) => { const rama = (x0, y0, a, l, n) => { const x1 = x0 + Math.cos(a) * l, y1 = y0 + Math.sin(a) * l; trazo(k, [[x0, y0], [x1, y1]], col, Math.max(1, n * 0.8)); if (n > 1) { rama(x1, y1, a - 0.5 + (hash(n, x0 | 0, s) - 0.5) * 0.3, l * 0.72, n - 1); rama(x1, y1, a + 0.45, l * 0.7, n - 1); } }; rama(x, base, -Math.PI / 2, 9, 4); };
    coral(12, 176, "#f07a5a", 236); coral(108, 170, "#e86aa8", 237); coral(214, 172, "#f0a040", 238); coral(306, 176, "#c87ae8", 239);
    for (let i = 0; i < 9; i++) { const x = hash(i, 1, 240) * W, b = 180, l = 16 + hash(i, 2, 240) * 22; const pts = []; for (let j = 0; j <= l; j += 2) pts.push([x + Math.sin(j / 5 + i) * 3, b - j]); trazo(k, pts, i % 2 ? "#3a9a6a" : "#2a7a50", 2, 1); }
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 241) * W, y = 20 + hash(i, 2, 241) * 150; k.alfa(0.7, () => { k.P(x, y, "#e8faff"); if (i % 3 === 0) { k.P(x + 1, y - 2, "#e8faff"); k.P(x - 1, y - 4, "#e8faff"); } }); }
  }
  O[13] = ["La isla Gyijon", "El palacio de coral en el fondo del mar, bajo su gran burbuja", gyijon, { cielo: "propio", fuerza: 0.35, ven: VEN }];

  function drossresa(k) {
    const lit = encendido(k);
    k.banda(["#6aa8e0", "#92c0ea", "#c4dcf0", "#f4ead8"], 0, 104);
    nubarron(k, 60, 30, 70, 12); nubarron(k, 250, 18, 66, 10);
    rellena(k, [[-2, 104], [-2, 34], [10, 28], [100, 26], [118, 34], [130, 104]], (x, y) => rampa(["#ecc890", "#d8b07a", "#c09666", "#a07c52", "#806040"], 0.2 + 0.25 * Math.sin(y / 3.6 + Math.sin(x / 17) * 2) + ((x - 60) / 70) * 0.3 + (y < 34 ? -0.2 : 0), x, y));
    const BL = ["#ffffff", "#f6f2ea", "#e6e0d2", "#ccc4b2", "#aaa290"];
    T.rect(k, 14, 8, 84, 20, (x, y) => rampa(BL, 0.1 + ((x - 14) / 84) * 0.5 + (fbm(x * 0.3, y * 0.3, 251) - 0.5) * 0.15, x, y));
    [[20, 6], [50, 0], [84, 6]].forEach(([x, top], i) => { T.rect(k, x - 5, top, 10, 10, (px, py) => rampa(BL, 0.1 + (px - x + 5) / 10 * 0.6, px, py)); bola(k, x, top, 6, 6, (px, py) => (py > top ? null : rampa(["#ffb07a", "#f08a50", "#d06a36", "#a04e24"], 0.1 + (px - x + 6) / 12 * 0.7, px, py))); k.R(x, top - 9, 1, 3, "#5a4a3a"); });
    for (let x = 18; x < 96; x += 7) T.ventana(k, x, 14, 3, 6, { marco: BL[4], vidrio: "#f2d27a", cruz: false, arco: true });
    const CO = ["#f6dcb0", "#e6c494", "#d0a878", "#b08a5e", "#8a6a44", "#604a2e"];
    bola(k, 256, 46, 66, 12, (x, y) => rampa(["#e8c890", "#d8b07a"], 0.4, x, y)); bola(k, 256, 46, 58, 9, (x, y) => rampa(["#dcb478", "#c89a62", "#b08452"], 0.2 + (y - 37) / 18, x, y));
    T.rect(k, 190, 46, 132, 58, (x, y) => { const u = (x - 256) / 66; return rampa(CO, 0.1 + Math.abs(u + 0.3) * 0.5 + (fbm(x * 0.2, y * 0.2, 252) - 0.5) * 0.2, x, y); });
    for (let f = 0; f < 3; f++) for (let x = 194; x < 320; x += 9) { const y = 52 + f * 17; T.rect(k, x, y, 6, 12, () => CO[5]); k.elipse(x + 3, y, 3, 2, CO[5]); k.R(x - 1, y + 12, 8, 1, CO[0]); }
    for (let x = 192; x < 320; x++) { k.P(x, 46, CO[0]); k.P(x, 104, CO[4]); }
    [[206, 30], [244, 26], [286, 30]].forEach(([x, y], i) => { k.R(x, y, 1, 18, "#5a4a3a"); Det.bandera(k, x + 1, y, 10, 6, ["#e84a6a", "#f2c84b", "#e86a2a"][i]); });
    const PARED = [["#fffaf0", "#f6ecd6", "#eadcbc", "#d6c4a0", "#b8a07c"], ["#fbe8c8", "#f2d6a8", "#e4c08a", "#ccA270", "#a8845a"], ["#fff2e6", "#f8dcc6", "#ecc2a6", "#d6a486", "#b48668"]];
    const vents = [];
    [[-4, 60], [24, 42], [58, 38], [92, 52], [148, 46], [180, 40], [212, 48], [244, 40], [274, 50]].forEach(([x, h], i) => vents.push(...T.casa(k, x, 116, 30 + (i % 3) * 3, h, { pared: PARED[i % 3], techo: PAL.TEJA_R, s: 253 + i, ventanas: [0.2, 0.68], puerta: 0.45, pisos: h > 44 ? 3 : 2, contra: i % 2 ? "#3f8a5a" : "#3a6aa8", ven: "#f2d27a", frente: i % 4 === 1 })));
    for (let i = 0; i < 9; i++) { const x = 6 + i * 36; k.R(x, 96, 14, 1, "#5a4a3a"); for (let j = 0; j < 4; j++) k.P(x + 2 + j * 3, 95, ["#e8402a", "#f6d84a", "#e86aa8", "#ffffff"][(i + j) % 4]); }
    T.banderines(k, 0, 60, 320, 64, 14, ["#e8402a", "#f2c84b", "#3f8ac0", "#3fb85a", "#e86aa8"]); T.banderines(k, 0, 84, 320, 82, 10, ["#f2c84b", "#e8402a", "#ffffff", "#3fb85a"]);
    suelo3d(k, 116, 180, 160, 84, losas3d(["#f2dcb8", "#e2c89e", "#ccb084", "#b0946a", "#8e7450"], { tx: 17, tz: 12, s: 262 })); k.R(0, 116, W, 1, "#fff0d8"); k.alfa(0.3, () => k.R(0, 117, W, 2, "#5a4630"));
    const girasol = (x, base, h, s) => { trazo(k, [[x, base], [x + 1, base - h]], "#4a8a3a", 2); [[-1, 0.4], [1, 0.6]].forEach(([d, f]) => fronda(k, x, base - h * f, d * 0.8, -0.2, 6, ["#8ad070", "#6ab050", "#4a8a3a", "#3a6a2a"], { caida: 0.4, foliolo: 2 })); for (let a = 0; a < Math.PI * 2; a += 0.45) { const px = x + Math.cos(a) * 5, py = base - h + Math.sin(a) * 4.5; k.elipse(px, py, 2, 2, hash(a * 10, s, 263) > 0.5 ? "#f8d030" : "#f0b820"); } k.elipse(x, base - h, 3, 3, "#6a3a1a"); k.P(x - 1, base - h - 1, "#8a5a2a"); };
    [[12, 180, 30], [28, 176, 24], [42, 180, 34], [6, 160, 20], [276, 180, 32], [292, 176, 26], [308, 180, 30], [314, 158, 22]].forEach(([x, b, h], i) => girasol(x, b, h, i));
    const soldado = (x, b) => { sombraE(k, x + 1, b, 4, 1, 0.4); k.R(x, b - 7, 2, 7, "#c8a070"); k.R(x - 3, b - 15, 7, 8, "#e8402a"); k.R(x - 3, b - 12, 7, 1, "#f2c84b"); k.R(x - 2, b - 20, 5, 5, "#e8c4a0"); k.R(x - 3, b - 24, 7, 4, "#26262a"); k.R(x - 1, b - 26, 3, 2, "#26262a"); k.P(x - 1, b - 18, "#26262a"); k.P(x + 1, b - 18, "#26262a"); trazo(k, [[x + 4, b - 14], [x + 9, b - 26]], "#c8c8d0"); };
    soldado(66, 136); const peluche = (x, b, c) => { sombraE(k, x + 1, b, 4, 1, 0.4); esfera(k, x, b - 4, 4, 4, c); esfera(k, x, b - 10, 3.5, 3.5, c); k.elipse(x - 3, b - 13, 1.5, 1.5, c[2]); k.elipse(x + 3, b - 13, 1.5, 1.5, c[2]); k.P(x - 1, b - 11, "#26262a"); k.P(x + 1, b - 11, "#26262a"); };
    peluche(246, 130, ["#e8c8a0", "#d0a878", "#a88050"]); peluche(258, 132, ["#f8d8e8", "#e8b0c8", "#c88aa8"]);
    luces(k, vents.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  O[14] = ["Drossresa", "La ciudad del amor, con su coliseo, sus tejados naranjas y sus girasoles", drossresa, { ven: ["#f2d27a", "#ffd27a"], tinte: 0.1, dx: 22 }];

  function albef(k) {
    const lit = encendido(k);
    k.banda(["#16203a", "#202c4a", "#2e3c5c", "#405070"], 0, 100);
    P.mar(k, 92, 112, ["#2a3a5a", "#24324e", "#1c2a42", "#162236", "#101a2a"], { s: 271, cresta: "#5a6a8a", medio: "#3a4a6a", espejo: false }); reflejo(k, 93, 112);
    montana(k, 52, 100, 120, 40, { roca: ["#4a5670", "#3c4660", "#30384e", "#262c3e"], nieve: ["#c8d4e8", "#a8b6cc"], hasta: 0.2 }); montana(k, 282, 100, 110, 36, { roca: ["#4a5670", "#3c4660", "#30384e", "#262c3e"], nieve: ["#c8d4e8", "#a8b6cc"], hasta: 0.2 });
    const TR = ["#6a5a4a", "#56483a", "#44382e", "#342a22", "#261e18", "#1a140e"];
    rellena(k, [[136, -2], [184, -2], [192, 60], [200, 110], [226, 130], [94, 130], [120, 110], [128, 60]], corteza(TR, 120, 80, { s: 272, grieta: 0.5, musgo: { umbral: 0.68, pal: ["#3a5a3a", "#2e4a30", "#243c26", "#1a2e1c"] } }));
    [[-1, 0], [1, 0], [-0.5, 1], [0.6, 1]].forEach(([d, j]) => trazo(k, Det6.bezier([160 + d * 30, 108 + j * 4], [160 + d * 50, 118], [160 + d * 70, 126], [160 + d * 92, 134 + j * 2], 16), (f) => TR[f < 0.5 ? 2 : 3], 7, 2));
    copa(k, 160, -6, 200, 34, ["#3a5a44", "#2e4a38", "#243c2e", "#1a2e22", "#122018"], { r: 10, s: 273 }); copa(k, 40, 4, 70, 22, ["#3a5a44", "#2e4a38", "#243c2e", "#1a2e22", "#122018"], { r: 8, s: 274 }); copa(k, 290, 6, 70, 22, ["#3a5a44", "#2e4a38", "#243c2e", "#1a2e22", "#122018"], { r: 8, s: 275 });
    const casaLarga = (x, base, w, h, s) => {
      T.rect(k, x, base - h, w, h, madera(["#8a6a4a", "#6e5238", "#563e2a", "#402c1c", "#2c1c10", "#1c1008"], { paso: 4, largo: 99, s }));
      rellena(k, [[x - 8, base - h + 2], [x + w / 2, base - h - w * 0.42], [x + w + 8, base - h + 2]], tejas(["#5a4a3a", "#48392c", "#382c22", "#2a2018", "#1c1610"], { w: 6, h: 3, s: s + 1, y0: base - h - w * 0.42 }));
      [[x - 8, base - h + 2, -1], [x + w + 8, base - h + 2, 1]].forEach(([px, py, d]) => { trazo(k, [[px, py], [px - d * 2, py - 8], [px + d * 2, py - 14]], "#3a2a1c", 2); k.P(px + d * 3, py - 14, "#c8302a"); });
      trazo(k, [[x + w / 2 - 6, base - h - w * 0.42 + 4], [x + w / 2, base - h - w * 0.42 - 6], [x + w / 2 + 6, base - h - w * 0.42 + 4]], "#3a2a1c", 2);
      [0.18, 0.82].forEach((f, i) => { const cx = x + w * f, cy = base - h / 2; bola(k, cx, cy, 7, 7, (px, py) => rampa(i ? ["#e8402a", "#c03020", "#8a2014"] : ["#3f6ac8", "#2c50a0", "#1c3a7a"], 0.2 + ((px - cx) + (py - cy)) / 18, px, py)); k.elipse(cx, cy, 2, 2, "#c8c8d0"); for (let a = 0; a < 6.28; a += 0.2) k.P(cx + Math.cos(a) * 7, cy + Math.sin(a) * 7, "#a8a8b4"); });
      const px = x + w / 2 - 6; k.R(px - 1, base - 22, 14, 22, "#2c1c10"); k.R(px, base - 21, 12, 21, "#ffd27a"); k.R(px + 6, base - 21, 1, 21, "#c8902a");
      for (let i = 0; i <= 40; i++) { const t = i / 40; k.P(x - 8 + (w / 2 + 8) * t, base - h + 2 - (w * 0.42 + 2) * t, "#7a8aa8"); }
      const ant = T.antorcha(k, px - 8, base - 24);
      return [{ x: px + 6, y: base - 6, r: 34, ry: 18, col: "#ffb45a", f: lit }, ant];
    };
    const LZ = [...casaLarga(8, 128, 76, 40, 276), ...casaLarga(236, 128, 80, 42, 277)];
    T.prado(k, 126, ["#6a8a5a", "#5a7a4c", "#4a6a40", "#3a5834", "#2c4628", "#1e341c"], 278);
    for (let y = 128; y < H; y++) { const f = (y - 128) / 52, c = 160 + Math.sin(f * 2.2) * 10, w = 8 + f * 26; for (let x = Math.round(c - w); x <= c + w; x++) { const cel = celdas(x, y * 1.5, 8 + f * 6, 6, 279, 0.6); k.P(x, y, cel.borde < 0.12 ? "#3a3830" : rampa(["#8a8678", "#76726a", "#625e56", "#4e4a44"], 0.2 + (cel.id - 0.5) * 0.4 + f * 0.2, x, y)); } }
    const ACERO = ["#e8eef6", "#c4ccd8", "#98a2b2", "#727c8e", "#4e5668"];
    sombraE(k, 46, 179, 14, 2.5, 0.5); trazo(k, [[40, 179], [56, 120]], (f) => (Math.floor(f * 12) % 3 ? "#6a4a30" : "#3a2a1c"), 4, 3);
    rellena(k, [[50, 126], [64, 114], [80, 112], [86, 126], [82, 144], [70, 152], [56, 146], [58, 136]], (x, y) => rampa(ACERO, 0.12 + ((x - 50) / 36) * 0.45 + (Math.hypot(x - 84, y - 130) < 6 ? -0.2 : 0) + (hash(x, y, 282) - 0.5) * 0.1, x, y));
    trazo(k, [[80, 112], [86, 126], [82, 144], [70, 152]], ACERO[0], 1); k.R(52, 124, 6, 14, "#3a2a1c");
    sombraE(k, 296, 179, 10, 2, 0.5);
    rellena(k, [[291, 180], [290, 112], [298, 112], [297, 180]], (x, y) => rampa(ACERO, 0.1 + ((x - 290) / 8) * 0.7, x, y)); k.R(294, 114, 1, 62, ACERO[3]);
    T.rect(k, 278, 106, 32, 6, (x, y) => rampa(["#e8c35a", "#c8a040", "#9a7a2e", "#6e5620"], 0.2 + (y - 106) / 6 * 0.6, x, y)); T.rect(k, 291, 88, 6, 18, madera(["#8a5a3a", "#6e4428", "#54321c", "#3a2210", "#261608"], { paso: 2, largo: 4, s: 283 })); esfera(k, 294, 86, 4, 4, ["#f8e090", "#e8c35a", "#b08a30"]);
    const F = [];
    [[96, 150], [226, 150]].forEach(([x, b], i) => { k.elipse(x, b + 1, 14, 3, "#2a2420"); for (let j = 0; j < 7; j++) k.R(x - 12 + j * 4, b - 2 - (j % 2), 4, 3, ["#5a4030", "#3a2a1c"][j % 2]); fuego(k, x, b - 2, 16, 22, { s: 280 + i }); P.chispas(k, x, b - 22, 20, 40, 30, 281 + i); F.push({ x, y: b - 10, r: 54, ry: 30, col: "#ffa04a", f: 1 }); });
    luces(k, [...LZ, ...F]);
  }
  O[15] = ["Albef", "La tierra de los gigantes, con su árbol inmenso y sus casas vikingas", albef, { ven: ["#f2d27a", "#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#c8902a"], dx: -93 }];

  function shells(k) {
    const { h } = cuando(k);
    k.banda(CIELO, 0, 104);
    nubarron(k, -24, 58, 128, 30); nubarron(k, 214, 56, 132, 34); nubarron(k, 40, 18, 46, 8); nubarron(k, 236, 12, 52, 8);
    P.mar(k, 92, 112, PAL.MAR, { s: 291 }); reflejo(k, 94, 112); T.gaviota(k, 60, 40, 1); T.gaviota(k, 74, 34, 0.8); T.gaviota(k, 262, 44, 1);
    const blanco = ["#ffffff", "#f2f4f6", "#dfe4ea", "#c4ccd8", "#a4aebe"], cx = 160, rx = 52, top = 42, curva = (x) => 5 * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
    for (let x = cx - rx; x <= cx + rx; x++) { const t = (x - cx) / rx, v = Math.abs(t + 0.35) / 1.35; for (let y = Math.round(top + curva(x)); y < 118; y++) k.P(x, y, rampa(blanco, v * 0.9 + (fbm(x * 0.3, y * 0.3, 292) - 0.5) * 0.15 + (y % 9 === 0 ? 0.1 : 0), x, y)); }
    for (let x = cx - rx; x <= cx + rx; x++) { const y = Math.round(top + curva(x)); k.R(x, y + 2, 1, 8, (x - cx) / rx > 0.45 ? "#234a86" : "#2f5fa8"); k.R(x, y + 2, 1, 1, "#5a86c8"); k.R(x, y + 34, 1, 2, "#2f5fa8"); }
    rotulo(k, 148, 50, "MARINE", "#ffffff");
    for (let f = 0; f < 3; f++) for (let a = -1.25; a <= 1.25; a += 0.31) {
      const x = cx + Math.sin(a) * (rx - 2), y = top + 16 + curva(x) + f * 18, w = Math.max(3, Math.round(7 * Math.cos(a)));
      if (f === 2 && Math.abs(x - cx) < 16) continue;
      k.R(x - w / 2, y, w, 11, "#3f6f9a"); k.R(x - w / 2 - 1, y - 1, w + 2, 1, "#8fa4bc"); k.R(x - w / 2, y + 11, w + 1, 1, "#9aa8bc"); if (w > 4) k.R(x - w / 2 + 1, y + 1, 2, 4, "#8ab8dc");
    }
    k.R(cx - rx - 2, top - 3, 2 * rx + 4, 3, "#c8d0dc"); for (let x = cx - rx; x < cx + rx; x += 5) k.R(x, top - 7, 1, 4, "#9aa8bc"); k.R(cx - rx - 1, top - 8, 2 * rx + 2, 1, "#9aa8bc");
    const pz = "#a8acb8", pzL = "#c8ccd6", pzO = "#7d818e";
    k.R(149, 36, 22, 4, pzO); k.R(147, 39, 26, 3, pz); k.R(147, 39, 26, 1, pzL);
    if (h < 12) {
      k.R(152, 24, 7, 12, pzO); k.R(161, 24, 7, 12, pz); k.R(152, 24, 3, 12, pz);
      k.poli([[146, 30], [174, 30], [170, 12], [150, 12]], pz); k.poli([[146, 30], [155, 30], [155, 12], [150, 12]], pzL); k.poli([[166, 30], [174, 30], [170, 12], [166, 12]], pzO); k.R(159, 15, 2, 15, pzO); k.poli([[152, 12], [159, 12], [159, 20]], pzL); k.poli([[168, 12], [161, 12], [161, 20]], pzO);
      k.linea(150, 14, 142, 27, pz, 3); k.linea(170, 15, 180, 9, pz, 4); k.elipse(141, 28, 2, 2, pz);
      k.elipse(160, 7, 5, 5, pz); k.poli([[154, 7], [166, 7], [165, 12], [155, 12]], pzL); k.R(155, 9, 10, 1, pzO); k.R(157, 5, 2, 1, "#4a4d58"); k.R(162, 5, 2, 1, "#4a4d58"); k.elipse(160, 2, 6, 2, pzO);
      k.R(180, 5, 3, 7, pzO); k.poli([[182, 2], [190, 0], [197, 4], [199, 10], [197, 16], [190, 19], [182, 15], [186, 9]], pzL); k.poli([[190, 0], [197, 4], [199, 10], [197, 16], [190, 19], [193, 10]], pzO); k.P(185, 9, "#ffffff");
    }
    T.rect(k, 0, 102, W, 26, piedra(["#efe5cf", "#e0d4ba", "#cfc2a4", "#b8aa8a", "#9a8c6e"], { tx: 12, ty: 5, s: 293 })); k.R(0, 102, W, 2, "#f6eedc"); for (let x = 2; x < W; x += 12) k.R(x, 98, 7, 4, "#e6dcc4");
    T.rect(k, 138, 96, 44, 32, piedra(["#d8ccb2", "#c4b698", "#ac9e80", "#928466"], { tx: 8, ty: 4, s: 294 }));
    k.elipse(160, 110, 17, 12, "#4a3020"); T.rect(k, 143, 110, 34, 18, madera(["#a87444", "#8a5a32", "#6e4626", "#54321a", "#3a2210"], { paso: 3, vertical: true, largo: 99, s: 295 })); bola(k, 160, 110, 16, 11, (x, y) => (y > 110 ? null : rampa(["#a87444", "#8a5a32", "#6e4626"], 0.3 + (x % 3 === 0 ? 0.4 : 0), x, y)));
    k.R(159, 98, 2, 30, "#3a2210"); [116, 122].forEach((y) => { k.R(143, y, 34, 1, "#3a2a20"); for (let x = 146; x < 176; x += 5) k.P(x, y - 1, "#c8c8d0"); });
    k.R(150, 92, 20, 6, "#2f5fa8"); k.R(150, 92, 20, 1, "#5a86c8"); k.elipse(160, 95, 2, 2, "#ffffff");
    T.rect(k, 0, 127, W, 53, T.tex(["#ead6a8", "#dcc496", "#cab084", "#b49a70", "#9a805a"], { v0: 0.2, s: 296, dy: 0.25, y0: 127, alto: 53 }));
    for (let y = 128; y < 134; y++) for (let x = 0; x < W; x++) if (Det.trama(x, y) < 1 - (y - 128) / 6) k.P(x, y, "#a8926a");
    for (let i = 0; i < 18; i++) { const x = 130 + Math.sin(i * 0.7) * 10 + (i % 2) * 5, y = 140 + i * 2.2; k.R(x, y, 2, 1, "#b49a70"); }
    const vents = [];
    [[4, 128, 44, 30, PAL.TEJA_R, true], [50, 128, 34, 22, ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"], false], [232, 128, 36, 24, PAL.TEJA_A, false], [270, 128, 46, 32, PAL.TEJA_R, true]].forEach(([x, b, w, hh, techo, ch], i) => vents.push(...T.casa(k, x, b, w, hh, { techo, s: 297 + i, chimenea: ch, ventanas: w > 40 ? [0.16, 0.46, 0.76] : [0.24, 0.7], puerta: 0.5, pisos: hh > 26 ? 2 : 1, contra: i % 2 ? "#3a6aa8" : null })));
    sombraE(k, 124, 146, 16, 3, 0.4);
    T.rect(k, 119, 100, 5, 46, madera(["#a87444", "#8a5a32", "#6e4626", "#54321a", "#3a2210"], { paso: 2, vertical: true, largo: 99, s: 298 })); T.rect(k, 105, 110, 33, 4, madera(["#a87444", "#8a5a32", "#6e4626", "#54321a", "#3a2210"], { paso: 2, largo: 99, s: 299 }));
    [[108, 110], [134, 110], [119, 126], [119, 120]].forEach(([x, y]) => { k.R(x, y, 5, 3, "#d8c8a0"); k.P(x + 1, y + 1, "#b8a880"); });
    k.elipse(132, 144, 3, 3, "#ffffff"); k.R(130, 145, 5, 2, "#26302a");
    P.barril(k, 204, 142, 9, 11); P.barril(k, 214, 144, 9, 11); P.caja(k, 90, 145, 12, 9);
    if (h >= 12) { esfera(k, 214, 152, 9, 8, ["#c8ccd6", "#a8acb8", "#7d818e"]); k.R(208, 150, 12, 3, "#7d818e"); k.R(210, 146, 3, 2, "#4a4d58"); k.R(217, 146, 3, 2, "#4a4d58"); k.poli([[176, 170], [196, 164], [204, 172], [188, 180]], "#a8acb8"); k.linea(186, 170, 168, 158, "#7d818e", 3); [[150, 150], [232, 166], [120, 168]].forEach(([x, b]) => k.roca(x, b, 12, 6, "#a8acb8", "#c8ccd6", "#7d818e")); }
  }
  O[16] = ["Clams Town", "La base de la Marina, con la estatua de Margon y el patio donde tienen atado a Korro", shells, { ven: ["#3f6f9a", "#ffd27a"], dx: 70 }];

  function orange(k) {
    k.banda(CIELO, 0, 112);
    nubarron(k, 20, 30, 70, 12); nubarron(k, 232, 22, 80, 14);
    [[70, 104], [250, 100]].forEach(([x, b], i) => pluma(k, x, b, 54, 9, undefined, { s: 301 + i, viento: 0.5 }));
    const ruina = (x, base, w, h, s, rota) => { const vs = T.casa(k, x, base, w, h, { techo: ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"], s, ventanas: [0.24, 0.7], puerta: 0.5 }); if (rota) { rellena(k, [[x + w * 0.3, base - h - 14], [x + w * 0.5, base - h - 2], [x + w * 0.7, base - h - 10], [x + w * 0.8, base - h - 16]], () => "#3a2c24"); k.alfa(0.5, () => bola(k, x + w * 0.6, base - h * 0.6, w * 0.3, h * 0.4, () => "#2a2220")); for (let i = 0; i < 6; i++) k.R(x + hash(i, 1, s) * w, base - 3 - hash(i, 2, s) * 3, 3, 3, "#8a7a6a"); } return vs; };
    ruina(-6, 118, 40, 30, 302, false); ruina(30, 118, 40, 24, 303, true); ruina(228, 118, 38, 26, 304, true); ruina(266, 118, 52, 32, 305, false);
    const cx = 160;
    rellena(k, [[cx, 22], [cx + 70, 96], [cx - 70, 96]], (x, y) => { const a = Math.atan2(x - cx, (y - 22) * 0.9), raya = Math.floor((a + 1.5) * 6) % 2; return rampa(raya ? ["#ff6a5a", "#e8402a", "#c02a1c", "#8a1a10"] : ["#ffffff", "#f2ece4", "#ddd2c4", "#b8ac9c"], 0.1 + Math.max(0, (x - cx) / 70) * 0.6 + ((y - 22) / 74) * 0.2, x, y); });
    T.rect(k, cx - 66, 96, 132, 24, (x, y) => { const raya = Math.floor((x - cx + 66) / 11) % 2; return rampa(raya ? ["#ff6a5a", "#e8402a", "#c02a1c", "#8a1a10"] : ["#ffffff", "#f2ece4", "#ddd2c4", "#b8ac9c"], 0.15 + Math.max(0, (x - cx) / 66) * 0.6, x, y); });
    for (let x = cx - 70; x < cx + 70; x += 4) { k.R(x, 96, 4, 3, "#f2c84b"); k.P(x + 1, 99, "#d8a830"); }
    bola(k, cx, 120, 14, 16, (x, y) => (y > 120 ? null : "#1c1414")); T.rect(k, cx - 14, 104, 28, 16, () => "#1c1414");
    k.R(cx - 1, 6, 2, 17, "#3a2a20"); T.rect(k, cx + 1, 6, 22, 14, () => "#1c1c22");
    k.elipse(cx + 12, 12, 4, 4, "#f4efe0"); k.elipse(cx + 12, 13, 2, 2, "#e8402a"); trazo(k, [[cx + 5, 17], [cx + 19, 8]], "#f4efe0"); trazo(k, [[cx + 5, 8], [cx + 19, 17]], "#f4efe0");
    [[cx - 70, 96, 40, 126], [cx + 70, 96, 280, 126]].forEach(([x0, y0, x1, y1]) => { cuerda(k, cx, 24, x1, y1, 4, "#5a4a3a"); k.R(x1 - 1, y1, 3, 4, "#6a4a30"); });
    T.banderines(k, cx, 24, 32, 90, 8, ["#f2c84b", "#e8402a", "#3f8ac0"]); T.banderines(k, cx, 24, 300, 86, 8, ["#f2c84b", "#e8402a", "#3f8ac0"]);
    T.casa(k, 196, 120, 34, 22, { techo: PAL.TEJA_A, s: 306, ventanas: [0.24], puerta: 0.68, alto: 9 }); k.R(196, 104, 34, 7, "#f4efe0"); rotulo(k, 203, 105, "PETS", "#c0392b");
    sombraE(k, 214, 147, 8, 2, 0.45); esfera(k, 212, 140, 7, 6, ["#ffffff", "#f2eee6", "#d8d0c4", "#b8b0a2"]); esfera(k, 216, 132, 5, 5, ["#ffffff", "#f2eee6", "#d8d0c4", "#b8b0a2"]); k.R(212, 129, 3, 5, "#d8d0c4"); k.R(219, 129, 3, 5, "#d8d0c4"); k.P(215, 131, "#26262a"); k.P(218, 131, "#26262a"); k.R(216, 134, 2, 1, "#26262a"); k.R(207, 144, 3, 3, "#ffffff");
    T.rect(k, 0, 118, W, 62, T.tex(["#ecd6ac", "#dcc496", "#c8ac80", "#b0946a", "#947a56"], { v0: 0.2, s: 307, dy: 0.3, y0: 118, alto: 62 }));
    k.alfa(0.3, () => k.R(0, 119, W, 2, "#5a4630"));
    bola(k, 250, 160, 20, 6, (x, y) => rampa(["#b0946a", "#947a56", "#7a6044", "#5e4834"], 0.3 + (1 - Math.hypot((x - 250) / 20, (y - 160) / 6)) * 0.6, x, y));
    [[80, 150, 16, 7], [108, 168, 12, 5], [298, 152, 14, 7], [200, 176, 18, 6]].forEach(([x, b, w, a]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.4); k.roca(x, b, w, a, "#b8a890", "#d8ccb4", "#8a7c66"); });
    T.canon(k, 40, 160, 1, 1.2); [[56, 172], [62, 172], [59, 168]].forEach(([x, y]) => esfera(k, x, y, 3, 3, ["#5a5a62", "#3a3a44", "#24242c"]));
  }
  const CIELO_DE = (k) => (k.luz ? Horas.paleta(k.luz.h).cielo[2] : CIELO[2]);
  O[17] = ["Lemon Town", "El pueblo medio en ruinas, con la gran carpa y la bandera de Vuggy", orange, { ven: ["#f2d27a", "#ffd27a"] }];

  function syrup(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 92);
    nubarron(k, 150, 26, 80, 14); nubarron(k, 254, 40, 70, 12); cirros(k, 4, 8, 30);
    P.mar(k, 86, 104, PAL.MAR, { s: 311 }); reflejo(k, 87, 104);
    rellena(k, [[-2, 104], [40, 98], [96, 76], [124, 66], [196, 66], [226, 76], [282, 96], [322, 100], [322, 120], [-2, 120]], T.tex(["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444"], { v0: 0.2, s: 312, dy: 0.4, y0: 66, alto: 54 }));
    const MAN = ["#fff4e2", "#f4e4c8", "#e6d0aa", "#d0b88e", "#b09872"], PIZ = ["#7a8aa0", "#5e6e86", "#46566c", "#323e50", "#222a38"];
    T.rect(k, 128, 38, 64, 30, (x, y) => rampa(MAN, 0.1 + ((x - 128) / 64) * 0.4 + (fbm(x * 0.3, y * 0.3, 313) - 0.5) * 0.15, x, y));
    rellena(k, [[122, 39], [134, 28], [186, 28], [198, 39]], tejas(PIZ, { w: 4, h: 2, s: 314, y0: 28 })); k.R(122, 39, 76, 1, PIZ[4]);
    [[136, 22], [180, 22]].forEach(([x, y]) => { T.rect(k, x, y, 4, 8, (px, py) => rampa(["#c88466", "#a86448", "#884c36"], (px - x) / 4, px, py)); k.R(x - 1, y - 1, 6, 1, "#4a3a34"); });
    for (let f = 0; f < 2; f++) for (let x = 132; x < 188; x += 9) { if (f === 1 && Math.abs(x - 158) < 6) continue; T.ventana(k, x, 42 + f * 12, 4, 7, { marco: "#5a4a3a", vidrio: "#55697c", alfeizar: MAN[4] }); }
    rellena(k, [[150, 56], [170, 56], [174, 50], [146, 50]], tejas(PIZ, { w: 3, h: 2, s: 315, y0: 50 })); [151, 168].forEach((x) => Det.cilindro(k, x, 56, 2, 12, ["#ffffff", "#ece4d4", "#cfc4b0"])); k.R(156, 58, 8, 10, "#5a3a24"); k.P(162, 63, "#e8c35a");
    for (let x = 118; x < 202; x += 3) { k.R(x, 66, 1, 5, "#3a3a44"); k.P(x, 65, "#8a8a96"); } k.R(118, 67, 84, 1, "#3a3a44");
    [[112, 70, 9, 10], [208, 70, 9, 10], [100, 80, 7, 8], [222, 82, 8, 9]].forEach(([x, b, rx, ry], i) => arbol(k, x, b, 6, rx, ry, ["#9ad070", "#74b058", "#549446", "#3a7638", "#285828"], { g: 2, s: 316 + i }));
    const camX = (y) => 160 + Math.sin((y - 68) / 16) * (8 + (y - 68) * 0.2), camW = (y) => 2 + (y - 68) * 0.13;
    T.prado(k, 104, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 317, { flores: { n: 30, cols: ["#ffffff", "#f6d84a", "#f08aa0"] }, perfil: (x) => 104 + Math.sin(x / 30) * 2 });
    for (let y = 68; y < H; y++) { const c = camX(y), w = camW(y); for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#ecd6a4", "#dcc08a", "#c8a874", "#ae8e5e"], 0.2 + Math.abs(x - c) / w * 0.35 + (fbm(x * 0.2, y * 0.3, 318) - 0.5) * 0.4, x, y)); }
    const vents = [];
    [[-6, 128, 32, 22, PAL.TEJA_R], [28, 126, 28, 18, PAL.TEJA_A], [64, 120, 28, 20, ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"]], [216, 114, 30, 22, PAL.TEJA_R], [250, 112, 32, 22, ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"]], [286, 116, 36, 24, PAL.TEJA_A]].forEach(([x, b, w, hh, techo], i) => vents.push(...T.casa(k, x, b, w, hh, { techo, s: 319 + i, ventanas: [0.24, 0.7], puerta: 0.48, chimenea: i % 2 === 0, ven: "#f2d27a" })));
    for (let x = 40; x < 120; x += 6) { k.R(x, 148 - (x - 40) * 0.05, 1, 8, "#8a6440"); } trazo(k, [[40, 151], [118, 147]], "#a87a50"); trazo(k, [[40, 154], [118, 150]], "#a87a50");
    const oveja = (x, b) => { sombraE(k, x + 1, b, 6, 1.5, 0.4); for (let i = 0; i < 6; i++) esfera(k, x - 3 + (i % 3) * 3, b - 6 - Math.floor(i / 3) * 3, 2.5, 2.5, ["#ffffff", "#f2eee4", "#d8d0c0"]); k.R(x + 5, b - 9, 3, 4, "#3a3430"); k.R(x - 3, b - 3, 1, 3, "#3a3430"); k.R(x + 2, b - 3, 1, 3, "#3a3430"); };
    oveja(30, 168); oveja(52, 176); oveja(290, 164); oveja(270, 172);
    luces(k, vents.map(([x, y]) => ({ x, y, r: 14, ry: 10, col: LUZ, f: lit * 0.8 })).concat([{ x: 160, y: 50, r: 40, ry: 18, col: LUZ, f: lit * 0.5 }]));
  }
  O[18] = ["Honey Village", "El pueblo de Usupp, con la mansión de Gaya en lo alto de la colina", syrup, { ven: ["#f2d27a", "#55697c", "#ffd27a"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const O = (window.SitiosIt15.piratas = window.SitiosIt15.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const rotuloLuz = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.crudo(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];

  function logueville(k) {
    const lit = encendido(k);
    k.banda(["#8aa4c0", "#a4b8cc", "#c4d0dc", "#e0e6ea"], 0, 96);
    nubarron(k, 212, 8, 120, 18, ["#9aa2b0", "#7e8696", "#626a7a"]); nubarron(k, -20, 20, 90, 14, ["#aab2c0", "#8e96a6", "#727a8a"]); nubarron(k, 120, 2, 80, 10, ["#9aa2b0", "#7e8696", "#626a7a"]);
    const PI = ["#f2e8d8", "#e0d4bc", "#c8b89c", "#ac9a7c", "#8a7a5e"], LA = ["#d89a7a", "#c07c5c", "#a06248", "#7e4a36", "#5a3426"];
    const edificio = (x, base, w, h, mat, s, cartel = null) => {
      T.rect(k, x, base - h, w, h, mat === "ladrillo" ? ladrillo(LA, { w: 6, h: 3, s }) : piedra(PI, { tx: 9, ty: 4, s, jit: 0.4 }));
      k.alfa(0.25, () => k.R(x + w - 4, base - h, 4, h, "#2a2018"));
      k.R(x - 2, base - h - 3, w + 4, 3, PI[2]); k.R(x - 2, base - h - 3, w + 4, 1, PI[0]); k.R(x - 1, base - h, w + 2, 1, PI[4]);
      const vs = [];
      for (let y = base - h + 6; y < base - 14; y += 13) for (let vx = x + 4; vx < x + w - 6; vx += 9) { T.ventana(k, vx, y, 4, 7, { marco: "#4a3a2e", vidrio: "#f2d27a", alfeizar: PI[3] }); k.R(vx - 2, y - 1, 1, 9, "#3f6a5a"); k.R(vx + 5, y - 1, 1, 9, "#3f6a5a"); vs.push([vx + 2, y + 4]); }
      k.R(x + w / 2 - 4, base - 12, 8, 12, "#3a2a20"); k.R(x + w / 2 - 3, base - 11, 6, 11, "#5a4030");
      if (cartel) { k.R(x + 2, base - 19, w - 4, 6, "#3a2a20"); rotulo(k, x + w / 2 - cartel.length * 2, base - 18, cartel, "#ffe08a"); }
      return vs;
    };
    const vs = [...edificio(-6, 128, 46, 92, "piedra", 401), ...edificio(38, 128, 40, 74, "ladrillo", 402, "BAR"), ...edificio(76, 128, 30, 60, "piedra", 403), ...edificio(214, 128, 32, 64, "ladrillo", 404), ...edificio(244, 128, 40, 80, "piedra", 405, "ARMAS"), ...edificio(282, 128, 44, 96, "ladrillo", 406)];
    const MO = PAL.MAD_O;
    T.rect(k, 104, 92, 112, 36, madera(MO, { paso: 4, largo: 36, s: 407 })); k.R(102, 90, 116, 3, PAL.MAD[2]); k.R(102, 90, 116, 1, PAL.MAD[0]);
    for (let x = 108; x < 214; x += 14) k.R(x, 94, 3, 34, MO[4]);
    for (let i = 0; i < 8; i++) { const y = 98 + i * 4; T.rect(k, 140 - i * 2, y, 40 + i * 4, 4, madera(PAL.MAD, { paso: 4, largo: 99, s: 408 + i })); k.R(140 - i * 2, y, 40 + i * 4, 1, PAL.MAD[0]); }
    [[120, 7], [192, 7]].forEach(([x, w]) => { T.rect(k, x, 20, w, 72, madera(MO, { paso: 2, vertical: true, largo: 99, s: x })); k.R(x, 20, 1, 72, MO[1]); });
    T.rect(k, 108, 14, 104, 8, madera(MO, { paso: 3, largo: 99, s: 409 })); k.R(108, 14, 104, 1, PAL.MAD[1]); k.alfa(0.35, () => k.R(108, 22, 104, 2, "#1a1008"));
    [[124, 26], [196, 26]].forEach(([x, y], i) => trazo(k, [[x, y + 10], [x + (i ? -10 : 10), y - 2]], MO[3], 2));
    suelo3d(k, 128, 180, 160, 92, losas3d(["#c8c4bc", "#b4b0a8", "#9c9890", "#84807a", "#6a6662"], { tx: 19, tz: 13, s: 410 })); k.R(0, 128, W, 1, "#e0ddd6");
    espejo(k, 128, 150, 180, { tinte: "#7a8494", mezcla: 0.75, onda: 1, crestas: 0.04, dentro: (x, y) => fbm(x * 0.05, y * 0.12, 411) > 0.58 });
    const L = [T.farola(k, 92, 140, 30), T.farola(k, 228, 140, 30)];
    P.barril(k, 24, 158, 10, 12); P.barril(k, 35, 162, 10, 12); P.caja(k, 280, 160, 14, 10); P.caja(k, 292, 152, 10, 8);
    luces(k, [...L, ...vs.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.7 }))]);
  }
  O[19] = ["Logueville", "La ciudad del principio y del fin, con el cadalso de Gol D. Roger", logueville, { tinte: 0.5, ven: ["#f2d27a", "#ffd27a"] }];

  function reverse(k) {
    const lit = encendido(k);
    k.banda(["#f4a46a", "#f8c08a", "#fbdcaa", "#fff0d0"], 0, 102);
    nubarron(k, -16, 18, 90, 12, ["#fff0e0", "#f8d4bc", "#e8b49a"]); nubarron(k, 244, 10, 90, 12, ["#fff0e0", "#f8d4bc", "#e8b49a"]);
    const ROJA = ["#e88a6a", "#d06a4c", "#b45238", "#8e3e2a", "#6a2e20"];
    rellena(k, [[-2, 104], [-2, 70], [40, 40], [100, 16], [160, 4], [220, 16], [280, 40], [322, 68], [322, 104]], (x, y) => rampa(ROJA, 0.22 + 0.1 * Math.sin(y / 3 + Math.sin(x / 17) * 2.5) + (x > 160 ? (x - 160) / 300 : -(160 - x) / 900) + (fbm(x * 0.06, y * 0.14, 421) - 0.5) * 0.5 + (Math.sin(x * 0.35 + fbm(x * 0.1, y * 0.05, 420) * 4) > 0.86 ? 0.22 : 0), x, y));
    const AG = ["#f0fcff", "#c4eefa", "#8ad4f0", "#4aaedc", "#2a86bc"];
    const canal = (x0, x1, w0, w1, s) => { for (let y = 4; y < 104; y++) { const t = (y - 4) / 100, c = x0 + (x1 - x0) * t, w = w0 + (w1 - w0) * t; for (let x = Math.round(c - w); x <= c + w; x++) { const u = (x - c) / w; k.P(x, y, Math.abs(u) > 0.82 ? AG[0] : rampa(AG, 0.15 + Math.abs(u) * 0.4 + (Math.sin(y * 0.9 + x * 0.3 + s) > 0.6 ? -0.2 : 0.1), x, y)); } k.P(c - w - 1, y, ROJA[4]); k.P(c + w + 1, y, ROJA[4]); } };
    canal(160, 160, 4, 22, 0); canal(150, 60, 2, 12, 2); canal(170, 262, 2, 12, 4);
    [[124, 72], [196, 72]].forEach(([x, y]) => { T.rect(k, x - 5, y, 10, 34, (px, py) => rampa(["#f05a3a", "#d0402a", "#a8301e", "#7a2214"], 0.1 + (px - x + 5) / 10 * 0.7, px, py)); k.R(x - 7, y - 3, 14, 3, "#5a1a10"); });
    k.R(116, 66, 88, 6, "#c8302a"); k.R(116, 66, 88, 1, "#f06a4a"); k.R(116, 71, 88, 1, "#7a2214");
    P.mar(k, 102, 152, PAL.MAR, { s: 422 }); reflejo(k, 104, 152);
    const BAL = ["#9aa8bc", "#7e8ca2", "#64708a", "#4c5670", "#363e54"];
    rellena(k, [[48, 136], [60, 112], [92, 98], [160, 94], [230, 100], [262, 110], [284, 104], [300, 96], [298, 120], [282, 128], [240, 140], [160, 146], [80, 146]], (x, y) => rampa(BAL, 0.12 + ((y - 94) / 52) * 0.6 + (fbm(x * 0.08, y * 0.12, 423) - 0.5) * 0.18 + (y > 132 ? -0.2 : 0), x, y));
    bola(k, 86, 116, 6, 6, (x, y) => rampa(["#ffffff", "#e8e4dc", "#c8c0b0"], 0.2 + ((x - 86) + (y - 116)) / 12, x, y)); k.elipse(87, 117, 3, 3, "#1c1c22"); k.P(85, 114, "#ffffff"); trazo(k, [[76, 108], [84, 104], [94, 106]], BAL[4], 1);
    trazo(k, [[52, 134], [72, 138], [96, 136]], BAL[4], 1);
    [[110, 104, 128, 122], [118, 102, 134, 118], [150, 98, 164, 116]].forEach(([a, b, c, d]) => trazo(k, [[a, b], [c, d]], "#e8e0d4", 2));
    P.jollyRoger(k, 196, 112, 0.42, "#e8eef6");
    for (let x = 50; x < 300; x++) if (hash(x, 1, 424) > 0.5) k.P(x, 146 + Math.round(Math.sin(x / 4) * 1.5), "#ffffff");
    T.prado(k, 150, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 425, { flores: { n: 20, cols: ["#ffffff", "#f6d84a"] }, perfil: (x) => 150 + Math.sin(x / 26) * 3 });
    const fx = 292;
    T.rect(k, fx - 7, 108, 14, 48, (x, y) => rampa(Math.floor((y - 108) / 8) % 2 ? ["#f05a4a", "#d0402e", "#a83022", "#7a2216"] : ["#ffffff", "#f0ece4", "#d8d0c4", "#b8b0a2"], 0.1 + ((x - fx + 7) / 14) * 0.7, x, y));
    k.R(fx - 9, 104, 18, 4, "#3a3a44"); T.rect(k, fx - 5, 94, 10, 10, () => "#ffd27a"); k.R(fx - 5, 94, 1, 10, "#3a3a44"); k.R(fx + 4, 94, 1, 10, "#3a3a44"); k.poli([[fx - 7, 94], [fx + 7, 94], [fx, 86]], "#c0392b");
    if (lit > 0) rayos(k, [[fx, 98, 200, 70, 2, 26]], "#fff6d8", 0.35 * lit);
    sombraE(k, 230, 166, 18, 3, 0.4); trazo(k, [[226, 168], [232, 140]], "#6a5040", 1); rellena(k, [[214, 142], [232, 134], [250, 142]], (x, y) => (Math.floor((x - 214) / 6) % 2 ? "#ffffff" : "#e8402a")); k.R(214, 162, 18, 2, "#8a6440"); k.R(216, 158, 2, 6, "#6a5040"); k.R(230, 158, 2, 6, "#6a5040");
    luces(k, [{ x: fx, y: 98, r: 30, ry: 22, col: "#fff0b0", f: lit }]);
  }
  O[20] = ["Inverse Mountain", "La montaña por la que sube el mar, con la gran ballena Loboan", reverse, { tinte: 0.15, ven: VEN }];

  function whisky(k) {
    const lit = encendido(k);
    k.banda(["#141c34", "#1c2644", "#283454", "#344464"], 0, 120);
    const CAC = ["#4a7a6a", "#3a6656", "#2c5244", "#204036", "#162e28"];
    const cactus = (x, base, w, h, s) => { rellena(k, [[x - w / 2, base], [x - w / 2, base - h + w / 2], [x - w / 3, base - h + w * 0.1], [x, base - h], [x + w / 3, base - h + w * 0.1], [x + w / 2, base - h + w / 2], [x + w / 2, base]], (px, py) => rampa(CAC, 0.1 + Math.abs((px - x) / (w / 2) + 0.3) * 0.5 + (Math.sin((px - x) * 1.1) > 0.5 ? 0.18 : 0) + (fbm(px * 0.2, py * 0.1, s) - 0.5) * 0.2, px, py)); for (let i = 0; i < Math.round(w * h / 90); i++) { const cx = x - w / 2 + 3 + hash(i, 1, s) * (w - 6), cy = base - h + 8 + hash(i, 2, s) * (h - 12); k.R(cx, cy - 2, 1, 5, "#c8d4cc"); k.R(cx - 1, cy - 1, 3, 1, "#c8d4cc"); } };
    cactus(14, 120, 26, 92, 431); cactus(64, 124, 30, 60, 432); cactus(118, 118, 22, 104, 433); cactus(206, 118, 24, 98, 434); cactus(258, 122, 30, 70, 435); cactus(306, 120, 28, 96, 436);
    const MW = ["#a87a54", "#8a6040", "#6e4a30", "#543620", "#3a2414", "#26160a"];
    const casa = (x, base, w, h, s) => { T.rect(k, x, base - h, w, h, madera(MW, { paso: 4, largo: 60, s })); k.R(x - 2, base - h - 4, w + 4, 4, MW[4]); k.R(x - 2, base - h - 4, w + 4, 1, MW[2]); const vs = []; for (let y = base - h + 5; y < base - 12; y += 12) for (let vx = x + 4; vx < x + w - 6; vx += 10) { T.ventana(k, vx, y, 5, 6, { marco: MW[5], vidrio: "#ffd27a" }); vs.push([vx + 2, y + 3]); } k.R(x + w / 2 - 4, base - 11, 8, 11, "#ffd27a"); k.R(x + w / 2 - 5, base - 12, 10, 1, MW[5]); k.R(x, base - 13, w, 2, MW[3]); for (let px = x + 2; px < x + w; px += 6) k.R(px, base - 13, 1, 13, MW[4]); vs.push([x + w / 2, base - 5]); return vs; };
    const vs = [...casa(-4, 132, 42, 40, 437), ...casa(36, 132, 40, 34, 438), ...casa(76, 132, 30, 28, 439), ...casa(214, 132, 32, 30, 440), ...casa(244, 132, 40, 36, 441), ...casa(282, 132, 42, 42, 442)];
    const bombillas = [];
    [[0, 86, 140, 96, 8], [180, 96, 320, 84, 8], [40, 100, 280, 102, 12]].forEach(([x0, y0, x1, y1, cae], j) => { for (let i = 0; i <= 120; i++) { const t = i / 120, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * cae; k.P(x, y, "#2a2018"); if (i % 10 === 5) bombillas.push([x, y + 2, ["#e8402a", "#7ae8c0", "#f2c84b", "#e86aa8"][(i / 10 + j) % 4 | 0]]); } });
    bombillas.forEach(([x, y, c]) => { k.R(x, y - 1, 1, 1, "#2a2018"); if (lit > 0) { k.crudo(x - 1, y, 3, 2, c); k.crudo(x, y, 1, 1, "#ffffff"); } else k.R(x - 1, y, 3, 2, c); });
    [[134, 7], [182, 7]].forEach(([x, w]) => T.rect(k, x, 70, w, 62, madera(MW, { paso: 2, vertical: true, largo: 99, s: x })));
    T.rect(k, 126, 62, 70, 14, madera(MW, { paso: 3, largo: 99, s: 443 })); k.R(126, 62, 70, 1, MW[1]); (lit > 0 ? rotuloLuz : rotuloG)(k, 133, 65, "WELCOME", lit > 0 ? "#ffe6a0" : "#f2d27a", 2);
    T.rect(k, 0, 130, W, 50, T.tex(["#8a7a64", "#766852", "#625642", "#4e4434", "#3a3226"], { v0: 0.25, s: 444, dy: 0.3, y0: 130, alto: 50 }));
    k.alfa(0.3, () => k.R(0, 131, W, 2, "#1a140c"));
    P.barril(k, 20, 158, 11, 13); P.barril(k, 32, 164, 11, 13); P.barril(k, 26, 150, 9, 10); P.barril(k, 292, 160, 11, 13); P.caja(k, 276, 170, 14, 10);
    T.mesa(k, 62, 170, { mantel: ["#d8b080", "#c09060", "#a07448", "#7a5634"], r: 10 }); T.mesa(k, 250, 172, { mantel: ["#d8b080", "#c09060", "#a07448", "#7a5634"], r: 10 });
    const fx = 160, fb = 166; k.elipse(fx, fb + 1, 14, 3, "#2a2018"); for (let j = 0; j < 7; j++) k.R(fx - 12 + j * 4, fb - 2 - (j % 2), 4, 3, ["#5a4030", "#3a2a1c"][j % 2]); fuego(k, fx, fb - 2, 14, 20, { s: 445 }); P.chispas(k, fx, fb - 20, 18, 36, 26, 446);
    luces(k, [...vs.map(([x, y]) => ({ x, y, r: 14, ry: 10, col: LUZ, f: lit * 0.8 })), ...bombillas.map(([x, y, c]) => ({ x, y, r: 8, ry: 6, col: c, f: lit * 0.6 })), { x: fx, y: fb - 8, r: 60, ry: 30, col: "#ffa04a", f: 1 }, { x: 160, y: 69, r: 40, ry: 16, col: "#ffe6a0", f: lit * 0.7 }]);
  }
  O[21] = ["Brandy Peak", "El pueblo de los cazarrecompensas, entre montañas de cactus llenas de tumbas", whisky, { ven: ["#ffd27a"], tinte: 0.3, fuego: ["#e8402a", "#7ae8c0", "#f2c84b", "#e86aa8", "#ffe6a0"] }];

  function littleGarden(k) {
    k.banda(["#6ab0d8", "#90c8e4", "#c0e0ec", "#e8f2e6"], 0, 112);
    nubarron(k, -20, 30, 80, 12); nubarron(k, 246, 22, 90, 14);
    montana(k, 160, 112, 196, 82, { roca: ["#a89888", "#8e7e70", "#76685c", "#5e544a", "#48403a"], rugosa: 1.4 });
    for (let i = 0; i < 4; i++) { let x = 150 + i * 8, y = 34; for (let j = 0; j < 30; j++) { x += (hash(i, j, 451) - 0.5) * 4 + (i - 1.5) * 0.9; y += 2; k.crudo(x, y, 2, 2, j % 4 === 0 ? "#ffb04a" : "#e8602a"); } }
    k.elipse(160, 31, 12, 3, "#e8602a"); k.elipse(160, 31, 8, 2, "#ffb04a");
    pluma(k, 158, 30, 30, 10, ["#b8b0a8", "#9a928a", "#7c766e", "#5e5a54"], { s: 452, viento: 0.6 });
    [[58, 26], [80, 18], [262, 44]].forEach(([x, y]) => { trazo(k, [[x - 8, y - 3], [x - 3, y], [x, y + 1]], "#5a4a4a"); trazo(k, [[x + 8, y - 3], [x + 3, y], [x, y + 1]], "#5a4a4a"); k.R(x, y, 4, 1, "#5a4a4a"); k.P(x + 4, y - 1, "#5a4a4a"); });
    for (let i = 0; i < 14; i++) copa(k, i * 24 - 6, 100 + (i % 3) * 3, 18, 12, ["#8ac078", "#6aa45e", "#50884a", "#3a6c3a", "#28502a"], { r: 5, s: 453 + i });
    const DINO = ["#a8b888", "#8ea070", "#76885c", "#5e6e48", "#465436"];
    trazo(k, Det6.bezier([268, 110], [262, 76], [272, 44], [292, 34], 20), (f) => DINO[f < 0.5 ? 2 : 1], 9, 6);
    bola(k, 296, 34, 9, 5, (x, y) => rampa(DINO, 0.2 + ((y - 29) / 10) * 0.5, x, y)); k.P(298, 32, "#1c1c22"); trazo(k, [[300, 37], [305, 36]], DINO[4]);
    for (let i = 0; i < 10; i++) copa(k, i * 34 + 8, 114, 16, 10, ["#9ad080", "#78b462", "#5a984e", "#427a3e", "#2c5c2e"], { r: 5, s: 470 + i });
    T.prado(k, 118, ["#a8d888", "#8cc46e", "#72aa5a", "#5a904a", "#44763a", "#305a2c"], 480);
    for (let y = 120; y < H; y++) { const f = (y - 120) / 60, c = 166 + Math.sin(f * 2.4) * 18 * f, w = 3 + f * 14; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#c8b48c", "#b49c76", "#9a8262", "#7e6a50"], 0.2 + Math.abs(x - c) / w * 0.4 + (fbm(x * 0.2, y * 0.3, 481) - 0.5) * 0.4, x, y)); }
    const HUE = ["#fffaee", "#f2e8d2", "#dcceb0", "#bcaa8a", "#988668"];
    for (let i = 0; i < 6; i++) { const x = 196 + i * 13, h = 52 - Math.abs(i - 2.5) * 6; const pts = Det6.bezier([x, 140], [x - 6, 140 - h * 0.7], [x + 8, 140 - h], [x + 18, 140 - h * 0.86], 18); trazo(k, pts, (f) => HUE[f < 0.3 ? 2 : f < 0.7 ? 1 : 3], 4, 2); if (i % 2) trazo(k, pts.slice(4, 12).map(([px, py]) => [px + 1, py + 1]), "#5a9a4a", 1); }
    trazo(k, [[190, 140], [280, 132]], HUE[3], 3, 2);
    bola(k, 172, 142, 16, 10, (x, y) => rampa(HUE, 0.1 + ((x - 156) / 32) * 0.4 + ((y - 132) / 20) * 0.3, x, y)); k.elipse(166, 141, 4, 3, "#2a2420"); k.elipse(178, 141, 4, 3, "#2a2420"); for (let i = 0; i < 6; i++) k.R(162 + i * 3, 149, 2, 3, HUE[0]);
    const ACERO = ["#e8eef6", "#c4ccd8", "#98a2b2", "#727c8e", "#4e5668"];
    sombraE(k, 30, 179, 10, 2, 0.5); rellena(k, [[26, 180], [24, 102], [36, 102], [34, 180]], (x, y) => rampa(ACERO, 0.1 + ((x - 24) / 12) * 0.7, x, y)); k.R(29, 104, 2, 72, ACERO[3]);
    T.rect(k, 12, 94, 36, 7, (x, y) => rampa(["#e8c35a", "#c8a040", "#9a7a2e", "#6e5620"], 0.2 + (y - 94) / 7 * 0.6, x, y)); T.rect(k, 27, 70, 7, 24, madera(["#8a5a3a", "#6e4428", "#54321c", "#3a2210", "#261608"], { paso: 2, largo: 4, s: 482 })); esfera(k, 30, 68, 5, 5, ["#f8e090", "#e8c35a", "#b08a30"]);
    sombraE(k, 300, 179, 12, 2, 0.5); trazo(k, [[296, 180], [306, 112]], (f) => (Math.floor(f * 12) % 3 ? "#6a4a30" : "#3a2a1c"), 4, 3);
    rellena(k, [[300, 118], [284, 104], [278, 116], [282, 134], [298, 132]], (x, y) => rampa(ACERO, 0.12 + ((x - 278) / 22) * 0.5, x, y)); trazo(k, [[284, 104], [278, 116], [282, 134]], ACERO[0], 1);
    [[12, 180, -1], [50, 182, 1], [264, 182, -1], [310, 180, 1]].forEach(([x, b, d], i) => { for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.32 * d; fronda(k, x, b, Math.cos(a), Math.sin(a), 26 + hash(i, j, 483) * 12, ["#a8dc78", "#82c05a", "#5a9a44", "#3e7a34"], { caida: 0.45, foliolo: 3.2 }); } });
  }
  O[22] = ["Tiny Garden", "La selva prehistórica: helechos gigantes, las costillas de un monstruo y el volcán que marca el duelo de los dos gigantes", littleGarden, { tinte: 0.25, fuego: ["#e8602a", "#ffb04a"], dx: 90 }];

  function tambor(k) {
    const { h } = cuando(k), flor = h >= 14;
    k.banda(["#5f86bc", "#8fb0d6", "#d4e2ee"], 0, 126);
    nubarron(k, -8, 22, 92, 13); nubarron(k, 236, 30, 100, 14);
    k.cordillera(124, 42, "#c3d1e2", "#eef4f9", 1.3, 1.25);
    const tambor = (cx, base, rx, alto, roca, nieve, s) => {
      const top = base - alto;
      for (let x = Math.round(cx - rx); x <= cx + rx; x++) { const u = (x - cx) / rx, c = Math.sqrt(Math.max(0, 1 - u * u)) * 3; for (let y = Math.round(top + c); y <= base; y++) k.P(x, y, rampa(roca, 0.08 + Math.pow(Math.abs(u + 0.35) / 1.35, 1.2) * 0.75 + (Math.sin(x * 1.7 + Math.sin(y / 7) * 2) > 0.85 ? 0.2 : 0) + (fbm(x * 0.15, y * 0.1, s) - 0.5) * 0.18, x, y)); }
      for (let i = 0; i < 4; i++) { const y = top + 10 + i * (alto / 4.5); for (let x = Math.round(cx - rx); x <= cx + rx; x++) if (fbm(x * 0.1, i * 3.1, s + 1) > 0.5) { k.P(x, y, nieve[1]); k.P(x, y - 1, nieve[0]); } }
      bola(k, cx, top + 2, rx + 2, 5, (x, y) => rampa(nieve, 0.1 + ((x - cx) / rx) * 0.3 + ((y - top + 3) / 10) * 0.4, x, y));
      for (let x = Math.round(cx - rx); x <= cx + rx; x += 3) { const l = 2 + Math.round(hash(x, s, 2) * 5); k.R(x, top + 6, 1, l, nieve[1]); }
    };
    const LEJOS = ["#c4d1e2", "#b6c5d9", "#a8b9d0", "#9cadc6"], MEDIO = ["#aebdd2", "#96a7c2", "#7f91b0", "#6c7ea0", "#5a6c8e"], NIEVE = ["#ffffff", "#e6eef6", "#c9d7e7"];
    const rosa = flor ? ["#ffe9f0", "#fbd0df", "#efb2c9"] : NIEVE;
    tambor(214, 126, 20, 64, LEJOS, NIEVE, 491); tambor(104, 126, 17, 74, LEJOS, NIEVE, 492);
    tambor(58, 126, 31, 86, MEDIO, NIEVE, 493); tambor(268, 126, 35, 78, MEDIO, NIEVE, 494);
    tambor(160, 128, 49, 72, ["#a8b8d0", "#8c9cbc", "#72849f", "#5c6c8a", "#485876"], rosa, 495);
    cuerda(k, 116, 50, 70, 40, 3, "#3a4258"); k.R(85, 44, 1, 3, "#3a4258"); k.R(81, 47, 9, 6, "#c0392b"); k.R(81, 46, 9, 1, "#8a2820"); k.R(82, 48, 3, 2, "#ffd27a"); k.R(86, 48, 3, 2, "#ffd27a");
    const PIE = ["#b4c0d4", "#9eaac2", "#8494ae", "#6c7c98", "#566682"];
    T.rect(k, 130, 30, 60, 26, piedra(PIE, { tx: 7, ty: 4, s: 496 }));
    for (let x = 130; x < 190; x += 6) { k.R(x, 27, 4, 3, PIE[1]); k.R(x, 26, 4, 1, rosa[0]); }
    for (let x = 136; x < 186; x += 11) T.ventana(k, x, 38, 4, 6, { arco: true, marco: "#3a4258", vidrio: "#ffd27a" });
    k.elipse(160, 50, 6, 6, "#3a2a3a"); k.R(154, 50, 12, 6, "#3a2a3a");
    const pal = { piedra: ["#b4c0d4", "#9eaac2", "#8494ae", "#6c7c98"], techo: ["#6a82b4", "#4e649a", "#3a4c7a"], nieve: rosa[0] };
    Det.torreta(k, 149, 32, 22, 16, 10, pal); Det.torreta(k, 118, 56, 15, 30, 13, pal); Det.torreta(k, 187, 56, 15, 26, 12, pal);
    if (flor) { k.R(159, 2, 1, 6, "#3a2a20"); k.poli([[160, 2], [176, 3], [173, 7], [176, 11], [160, 11]], "#2a2630"); k.elipse(167, 6, 2, 2, "#f4efe0"); [[165, 5], [169, 5], [167, 3], [167, 9]].forEach(([x, y]) => k.P(x, y, "#f28aa8")); }
    T.rect(k, 0, 124, W, 56, (x, y) => rampa(["#ffffff", "#f2f6fb", "#e2eaf3", "#cfdbe9", "#b8c8dc"], 0.1 + ((y - 124) / 56) * 0.3 + (fbm(x * 0.05, y * 0.15, 497) - 0.5) * 0.5, x, y));
    const pinoNevado = (x, base, h, s) => { k.R(x - 1, base - 5, 3, 5, "#4a3a30"); for (let i = 0; i < 5; i++) { const t = i / 5, y = base - 4 - h * t, w = (1 - t) * h * 0.38 + 2; rellena(k, [[x - w, y], [x + w, y], [x, y - h * 0.32]], (px, py) => rampa(["#3a6a54", "#2a5442", "#1e4032", "#142e24"], 0.1 + ((px - x + w) / (2 * w)) * 0.7, px, py)); bola(k, x - w * 0.2, y - h * 0.1, w * 0.7, 1.6, (px, py) => (py > y - h * 0.1 ? null : rosa[(px + py) % 3 === 0 ? 1 : 0])); } };
    [[20, 120, 22], [36, 124, 28], [92, 124, 20], [110, 126, 24], [214, 126, 24], [232, 124, 18], [282, 120, 28], [302, 118, 22]].forEach(([x, b, hh], i) => pinoNevado(x, b, hh, 498 + i));
    Det.casaNieve(k, 122, 128, 24, 13); Det.casaNieve(k, 176, 129, 26, 15, false); Det.casaNieve(k, 64, 130, 20, 11, false); Det.casaNieve(k, 238, 130, 22, 12);
    [[44, 142, 62, 6], [254, 146, 74, 7], [118, 172, 96, 6], [296, 170, 58, 5], [12, 170, 52, 5]].forEach(([x, y, a, b]) => { k.elipse(x, y + 2, a, b, "#cdd9e8"); k.elipse(x - 3, y, a - 1, b - 1, "#f8fbfd"); });
    for (let i = 0; i < 22; i++) { const t = i / 22, x = 160 + Math.sin(t * 4.2) * (3 + t * 14) + (i % 2 ? 3 : -3), y = 132 + t * 46; k.R(x, y, 2, 1, "#b8c8dc"); }
    [[26, 158], [44, 154], [62, 151], [80, 149]].forEach(([x, y], i, t) => { if (i) trazo(k, [[t[i - 1][0] + 1, t[i - 1][1] - 5], [x, y - 5]], "#7a5a3c"); k.R(x, y - 8, 2, 9, "#6b4a30"); k.R(x - 1, y - 9, 4, 2, "#ffffff"); });
    pinoNevado(4, 190, 100, 510); pinoNevado(316, 190, 106, 511);
    P.nieve(k, 200, 512, { col: flor ? "#ffd4e2" : "#ffffff", sombra: flor ? "#f4b6cc" : "#c8d4e8" });
    luces(k, [{ x: 160, y: 40, r: 36, ry: 14, col: LUZ, f: encendido(k) * 0.6 }]);
  }
  O[23] = ["El reino de Tambor", "Las montañas en forma de tambor, el castillo en la cumbre y la nieve rosa de Huliluk", tambor, { tinte: 0.25, dx: 62, ven: VEN }];

  function yaya(k) {
    k.banda(CIELO, 0, 92);
    nubarron(k, 20, 40, 70, 12); nubarron(k, 200, 26, 60, 10);
    P.mar(k, 84, 112, PAL.MAR, { s: 521 }); reflejo(k, 86, 112);
    for (let y = 0; y < 100; y++) { const w = 7 + Math.sin(y / 9) * 1.5 + (100 - y) * 0.02; for (let x = Math.round(290 - w); x <= 290 + w; x++) k.P(x, y, rampa(["#ffffff", "#e8f6fc", "#c4e6f4", "#9ad0ea"], 0.1 + Math.abs(x - 290) / w * 0.6 + (Math.sin(y * 0.8 + x) > 0.6 ? -0.15 : 0), x, y)); }
    bruma(k, 70, 104, "#e8f6fc", 0.5, { s: 522, x0: 250, x1: 320 });
    const MW = ["#c8a07a", "#a88058", "#8a6440", "#6c4a2c", "#4e321c", "#341e0e"];
    const choza = (x, base, w, h, s, cartel) => { T.rect(k, x, base - h, w, h, madera(MW, { paso: 3, vertical: true, largo: 99, s })); rellena(k, [[x - 3, base - h + 1], [x + w / 2, base - h - w * 0.36], [x + w + 3, base - h + 1]], tejas(["#b8946a", "#9a7650", "#7e5c3a", "#604428", "#44301a"], { w: 5, h: 2, s: s + 1, y0: base - h - w * 0.36 })); T.ventana(k, x + 4, base - h + 5, 5, 5, { marco: MW[5], vidrio: "#ffd27a" }); k.R(x + w - 10, base - 10, 6, 10, MW[5]); if (cartel) { k.R(x + 2, base - h - 2, w - 4, 6, MW[5]); rotulo(k, x + w / 2 - cartel.length * 2, base - h - 1, cartel, "#ffe08a"); } };
    choza(-4, 114, 30, 26, 523, null); choza(26, 112, 34, 30, 524, "BAR"); choza(62, 114, 28, 22, 525, null);
    [[18, 74], [56, 70]].forEach(([x, y]) => { k.R(x, y, 1, 14, "#3a2a20"); k.R(x + 1, y, 10, 7, "#1c1c22"); k.elipse(x + 6, y + 3, 2, 2, "#f4efe0"); });
    const CA = ["#fbeee6", "#f2dcd0", "#e4c6b6", "#ccaa98", "#ac8a78", "#88685a"];
    T.rect(k, 194, 46, 50, 66, madera(MW, { paso: 3, largo: 99, s: 526 })); rellena(k, [[190, 47], [216, 30], [248, 47]], tejas(["#c8a07a", "#a88058", "#8a6440", "#6c4a2c", "#4e321c"], { w: 5, h: 2, s: 527, y0: 30 })); T.ventana(k, 222, 60, 7, 7, { marco: MW[5], vidrio: "#ffd27a" }); k.R(204, 98, 10, 14, MW[5]);
    T.rect(k, 112, 40, 84, 72, piedra(CA, { tx: 8, ty: 5, s: 528, jit: 0.4 }));
    [[108, 16, 18], [180, 16, 18]].forEach(([x, top, w]) => { T.rect(k, x, top, w, 96, piedra(CA, { tx: 6, ty: 4, s: 529 + x })); rellena(k, [[x - 3, top], [x + w + 3, top], [x + w / 2, top - 22]], (px, py) => rampa(["#9ab0d8", "#7c94c4", "#6078aa", "#48608e"], 0.1 + (px - x) / w * 0.7, px, py)); for (let px = x; px < x + w; px += 5) k.R(px, top - 2, 3, 2, CA[2]); T.ventana(k, x + w / 2 - 2, top + 14, 4, 8, { arco: true, marco: CA[5], vidrio: "#ffd27a" }); });
    for (let x = 112; x < 196; x += 6) k.R(x, 37, 4, 3, CA[1]);
    T.ventana(k, 130, 56, 8, 14, { arco: true, marco: CA[5], vidrio: "#ffd27a" }); T.ventana(k, 170, 56, 8, 14, { arco: true, marco: CA[5], vidrio: "#ffd27a" });
    k.elipse(154, 92, 11, 10, CA[5]); T.rect(k, 143, 92, 22, 20, madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 3, vertical: true, largo: 99, s: 530 })); bola(k, 154, 92, 10, 9, (x, y) => (y > 92 ? null : "#86542e"));
    T.rect(k, 0, 112, W, 68, T.tex(["#fcecc4", "#f2dcaa", "#e4c890", "#d2b278", "#b89660"], { v0: 0.15, s: 531, dy: 0.35, y0: 112, alto: 68 }));
    for (let x = 0; x < W; x++) if (hash(x, 2, 532) > 0.4) k.P(x, 112 + Math.round(Math.sin(x / 6) * 1.2), "#ffffff");
    P.palmera(k, 96, 132, 40, { inc: 0.25, s: 533 }); sombraE(k, 104, 133, 12, 2.5, 0.4); P.palmera(k, 262, 134, 44, { inc: -0.25, s: 534 }); sombraE(k, 254, 135, 12, 2.5, 0.4);
    rellena(k, [[250, 104], [314, 104], [306, 114], [258, 114]], madera(PAL.MAD_O, { paso: 2, largo: 99, s: 535 })); k.R(272, 82, 1, 22, "#4a3020"); k.poli([[273, 82], [290, 98], [273, 100]], "#f4efe0");
    const cofre = (x, b) => { sombraE(k, x + 8, b, 10, 2, 0.45); T.rect(k, x, b - 9, 16, 9, madera(["#a0683c", "#86542e", "#6e4424", "#54321a", "#3c2210"], { paso: 3, largo: 99, s: 536 })); bola(k, x + 8, b - 9, 8, 4, (px, py) => (py > b - 9 ? null : rampa(["#a0683c", "#86542e", "#6e4424"], 0.3, px, py))); k.R(x, b - 9, 16, 1, "#e8c35a"); k.R(x + 7, b - 11, 3, 4, "#e8c35a"); [[2, -12], [6, -13], [10, -12], [13, -11]].forEach(([dx, dy]) => k.R(x + dx, b + dy, 2, 2, "#f8e090")); };
    cofre(18, 166);
    sombraE(k, 300, 168, 9, 2, 0.45); esfera(k, 300, 160, 8, 8, ["#f8e0a0", "#e8c060", "#c09838", "#8a6a20"]); k.elipse(300, 160, 4, 4, "#3a4a5a"); k.elipse(299, 159, 2, 2, "#6a8aa8"); [[-6, 0], [6, 0], [0, -6]].forEach(([dx, dy]) => k.elipse(300 + dx, 160 + dy, 1.5, 1.5, "#8a6a20"));
    P.caja(k, 40, 174, 14, 10); P.caja(k, 280, 176, 12, 9);
  }
  O[24] = ["Yaya", "Mock Town, la ciudad sin ley, y la media casa de Creckit con su fachada de castillo", yaya, { ven: VEN, dx: -90 }];

  function enies(k) {
    k.banda(["#4f9fe0", "#7cbcec", "#b4dcf2", "#e8f2ea"], 0, 96);
    nubarron(k, -20, 30, 90, 14); nubarron(k, 248, 46, 80, 12);
    const HI = ["#7a8494", "#626c7c", "#4c5666", "#3a4250", "#2a303c", "#1c2028"];
    T.rect(k, 70, 0, 180, 92, (x, y) => rampa(HI, 0.2 + ((x - 70) / 180) * 0.5 + (fbm(x * 0.1, y * 0.1, 541) - 0.5) * 0.2 + (x % 30 === 0 ? 0.3 : 0), x, y));
    k.R(159, 0, 2, 92, HI[5]); for (let y = 6; y < 92; y += 10) for (let x = 74; x < 248; x += 10) k.P(x, y, HI[0]);
    [[115, 40], [205, 40]].forEach(([cx, cy]) => { for (let a = 0; a < Math.PI * 2; a += 0.01) { [24, 23, 16, 15].forEach((r, i) => k.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, i < 2 ? "#e8c35a" : "#b08a30")); } trazo(k, [[cx - 14, cy - 14], [cx + 14, cy + 14]], "#e8c35a", 3); trazo(k, [[cx + 14, cy - 14], [cx - 14, cy + 14]], "#e8c35a", 3); k.elipse(cx, cy, 5, 5, "#e8c35a"); });
    for (let y = 88; y < 118; y++) for (let x = 0; x < W; x++) k.P(x, y, rampa(["#ffffff", "#e8f6fc", "#bfe2f2", "#8cc8e6", "#5aa8d4"], 0.1 + ((y - 88) / 30) * 0.6 + (Math.sin(x * 0.7 + y * 0.05) > 0.5 ? -0.15 : 0.1), x, y));
    bruma(k, 98, 122, "#ffffff", 0.6, { s: 542, ey: 0.3 });
    const MA = ["#ffffff", "#f4f2ec", "#e4e0d6", "#ccc6b8", "#aaa496", "#888274"];
    const juzgado = (x, w, s) => { T.rect(k, x, 96, w, 26, piedra(MA, { tx: 10, ty: 4, s, jit: 0.3 })); for (let px = x + 4; px < x + w - 4; px += 10) Det.cilindro(k, px, 100, 5, 20, [MA[0], MA[1], MA[2], MA[3]]); rellena(k, [[x - 4, 98], [x + w / 2, 84], [x + w + 4, 98]], (px, py) => rampa(MA, 0.1 + (px - x) / w * 0.4, px, py)); k.R(x - 4, 97, w + 8, 2, MA[3]); k.R(x - 2, 121, w + 4, 2, MA[3]); };
    juzgado(-10, 116, 543); juzgado(214, 116, 544);
    T.rect(k, 138, 14, 44, 108, piedra(MA, { tx: 9, ty: 4, s: 545, jit: 0.3 })); k.alfa(0.2, () => k.R(170, 14, 12, 108, "#3a4250"));
    for (let y = 22; y < 112; y += 12) for (let x = 142; x < 180; x += 9) T.ventana(k, x, y, 4, 7, { marco: MA[5], vidrio: "#3f6f9a", cruz: false });
    for (let x = 134; x < 186; x += 4) k.R(x, 8, 2, 4, MA[2]); k.R(134, 12, 52, 3, MA[3]); bola(k, 160, 8, 12, 6, (x, y) => (y > 8 ? null : rampa(["#9ab0d8", "#7c94c4", "#6078aa", "#48608e"], 0.1 + (x - 148) / 24 * 0.7, x, y)));
    k.R(188, 2, 1, 26, "#4a4a54"); Det.bandera(k, 189, 4, 20, 12, "#f4f6fa", "#dfe4ea"); k.elipse(198, 10, 3, 3, "#3a64b0"); k.R(197, 8, 2, 4, "#e8c35a");
    suelo3d(k, 122, 180, 160, 96, losas3d(["#f4f2ec", "#e6e2d8", "#d2ccc0", "#b8b2a4", "#9a9486"], { tx: 22, tz: 15, s: 546 })); k.R(0, 122, W, 1, "#ffffff"); k.alfa(0.25, () => k.R(0, 123, W, 2, "#5a5448"));
    [[56, 134], [264, 134]].forEach(([x, b]) => { sombraE(k, x + 2, b, 5, 1.5, 0.4); k.R(x, b - 30, 2, 30, "#4a4a54"); k.R(x + 2, b - 30, 12, 18, "#f4f6fa"); k.R(x + 2, b - 13, 12, 1, "#dfe4ea"); k.elipse(x + 8, b - 22, 3, 3, "#3a64b0"); });
  }
  O[25] = ["Ineis Lobby", "La isla sin noche: la Torre de la Justicia, la catarata alrededor y la Puerta de la Justicia", enies, { siempre: 14, ven: ["#3f6f9a"], fuego: [], tinte: 0.2, dx: 90 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const O = (window.SitiosIt15.piratas = window.SitiosIt15.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];
  const ORO = ["#fff2b0", "#f4d870", "#d8ac40", "#a8842e", "#7a5e1e"];

  function amazon(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 100);
    nubarron(k, 90, 24, 70, 12); nubarron(k, 230, 40, 60, 10);
    const ROCA = ["#ecd8b4", "#d8c098", "#bea47c", "#9e8662", "#7e6a4c"];
    [[-6, 0, 40], [30, 16, 26], [252, 10, 30], [284, 0, 42]].forEach(([x, top, w], i) => { rellena(k, [[x, 140], [x + 2, top + 10], [x + w * 0.3, top], [x + w * 0.7, top + 4], [x + w - 2, top + 12], [x + w, 140]], (px, py) => rampa(ROCA, 0.15 + 0.08 * Math.sin(py / 3.4 + Math.sin(px / 9) * 2) + ((px - x) / w) * 0.45 + (fbm(px * 0.12, py * 0.08, 601 + i) - 0.5) * 0.45 + (Math.sin(px * 0.6 + fbm(px * 0.1, py * 0.04, 600) * 5) > 0.85 ? 0.2 : 0), px, py)); copa(k, x + w / 2, top + 2, w * 0.7, 9, ["#9ad070", "#74b058", "#549446", "#3a7638", "#285828"], { r: 4, s: 602 + i }); for (let j = 0; j < 4; j++) trazo(k, [[x + 4 + j * w / 5, top + 8], [x + 5 + j * w / 5 + Math.sin(j) * 2, top + 30 + j * 6]], "#4a8a3a", 1); });
    const ROJO = ["#f06a5a", "#d8483a", "#b8342a", "#8e241c", "#661812"];
    T.rect(k, 104, 54, 112, 46, (x, y) => rampa(ROJO, 0.15 + ((x - 104) / 112) * 0.45 + (fbm(x * 0.3, y * 0.3, 603) - 0.5) * 0.15, x, y));
    for (let x = 108; x < 214; x += 10) Det.cilindro(k, x, 56, 3, 44, ["#ff8a6a", "#e8503a", "#b8342a", "#7a2016"]);
    for (let x = 114; x < 210; x += 20) T.ventana(k, x, 64, 6, 10, { marco: "#5a1a10", vidrio: "#ffd27a" });
    T.rect(k, 124, 30, 72, 24, (x, y) => rampa(ROJO, 0.15 + ((x - 124) / 72) * 0.45, x, y)); for (let x = 130; x < 192; x += 12) T.ventana(k, x, 36, 5, 8, { marco: "#5a1a10", vidrio: "#ffd27a" });
    T.tejadoJ(k, 160, 56, 136, 12, ORO, 604, 5); T.tejadoJ(k, 160, 32, 96, 12, ORO, 605, 4); T.tejadoJ(k, 160, 16, 56, 10, ORO, 606, 3);
    trazo(k, [[160, 6], [160, -2]], ORO[2], 2); esfera(k, 160, 7, 3, 3, ORO);
    [[112, 40], [208, 40]].forEach(([x, y]) => { k.R(x, y, 1, 18, "#5a4a3a"); T.rect(k, x + 1, y, 9, 14, () => "#7a3a9a"); k.R(x + 1, y + 13, 9, 1, "#5a2a7a"); k.elipse(x + 5, y + 6, 2, 3, ORO[1]); });
    for (let y = 100; y < H; y++) { const f = (y - 100) / 80, w = 26 + f * 40, esc = (y - 100) % Math.round(3 + f * 4); for (let x = Math.round(160 - w); x <= 160 + w; x++) k.P(x, y, esc === 0 ? "#b8b0a0" : rampa(["#fbf8f0", "#eee8dc", "#dcd4c4", "#c4bca8"], 0.1 + f * 0.25 + ((x - 160) / w) * 0.2 + (esc === 1 ? 0.25 : 0), x, y)); }
    const SERP = ["#b07ae0", "#9058c8", "#7240a8", "#542c86", "#3a1c62"];
    [-1, 1].forEach((d) => {
      const pts = Det6.bezier([160 + d * 40, 170], [160 + d * 100, 150], [160 + d * 40, 100], [160 + d * 66, 60], 260);
      pts.forEach(([x, y], i) => { const g = 11 - i * 0.018; for (let j = -g; j <= g; j++) { const px = x + j, v = Math.abs(j / g), esc = (Math.round(px * 0.7 + y) & 3) === 0 ? 0.12 : 0; let c = rampa(SERP, 0.12 + v * 0.55 + (j * d > 0 ? 0.15 : 0) + esc, px, y); const rombo = Math.abs(j) + Math.abs(((y + i * 0.2) % 10) - 5) * 0.9; if (rombo < 4) c = rombo < 2.2 ? ORO[1] : ORO[3]; k.P(px, y, c); } });
      const [hx, hy] = pts[pts.length - 1];
      bola(k, hx, hy - 6, 12, 9, (x, y) => rampa(SERP, 0.1 + ((x - hx) / 12) * d * 0.3 + ((y - hy + 15) / 18) * 0.4, x, y));
      k.elipse(hx - d * 4, hy - 9, 3, 2, "#ffe06a"); k.R(hx - d * 4, hy - 10, 1, 3, "#1c1c22"); trazo(k, [[hx + d * 8, hy - 2], [hx + d * 14, hy]], "#e8402a", 1); k.poli([[hx - 2, hy + 1], [hx, hy + 6], [hx + 2, hy + 1]], "#ffffff");
      for (let i = 0; i < 6; i++) k.R(hx - 8 + i * 3, hy - 14, 2, 1, ORO[2]);
    });
    const estanque = (cx, cy, rx, s) => { bola(k, cx, cy, rx, rx * 0.28, (x, y) => rampa(["#7acce0", "#54b0cc", "#3a90b0", "#2a7090"], 0.2 + (y - cy + rx * 0.28) / (rx * 0.56) * 0.5, x, y)); for (let i = 0; i < 6; i++) { const x = cx - rx * 0.7 + hash(i, 1, s) * rx * 1.4, y = cy - 2 + hash(i, 2, s) * 5; k.elipse(x, y, 4, 1.5, "#5aa858"); if (i % 2) { k.R(x - 1, y - 3, 3, 3, "#f8b8d8"); k.P(x, y - 4, "#ffffff"); } } };
    estanque(28, 158, 32, 607); estanque(292, 160, 32, 608);
    for (let i = 0; i < 10; i++) { const x = i < 5 ? 2 + i * 5 : 296 + (i - 5) * 5, b = 140 + (i % 3) * 4; for (let y = b; y > b - 70; y--) k.P(x, y, (b - y) % 9 === 0 ? "#4a7a3a" : "#7ab060"); fronda(k, x, b - 50 - (i % 3) * 6, i < 5 ? 1 : -1, -0.4, 10, ["#a8d888", "#86bc66", "#5e9a4a", "#40783a"], { caida: 0.5, foliolo: 2, lados: 1 }); }
    const F = [];
    [[110, 112], [210, 112]].forEach(([x, b]) => { k.R(x - 1, b - 14, 3, 14, "#5a4030"); k.R(x - 4, b - 15, 9, 2, "#3a2a1c"); fuego(k, x, b - 15, 7, 10, { s: x }); F.push({ x, y: b - 20, r: 28, ry: 20, col: "#ffa04a", f: 1 }); });
    luces(k, [...F, { x: 160, y: 70, r: 70, ry: 26, col: LUZ, f: lit * 0.5 }]);
  }
  O[26] = ["Amazon Rose", "La ciudad de las Kuja: el palacio entre agujas de roca, con dos serpientes gigantes guardando la escalera", amazon, { tinte: 0.15, ven: VEN, fuego: ["#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"], dx: 86 }];

  function impel(k) {
    T.rect(k, 0, 0, W, 140, (x, y) => { const c = celdas(x, y, 14, 7, 611, 0.3); if (c.borde < 0.08) return "#120a0c"; return rampa(["#6a3a3a", "#56302e", "#442624", "#341c1c", "#261414"], 0.15 + (c.id - 0.5) * 0.3 + (1 - y / 140) * 0.35 + c.dy * -0.2, x, y); });
    T.rect(k, 106, 30, 116, 102, (x, y) => rampa(["#ffb43a", "#f06a24", "#c8361c", "#7a1e14", "#3a0a08"], 0.85 - ((y - 30) / 102) * 0.7 + (fbm(x * 0.08, y * 0.12, 612) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 9; i++) fuego(k, 112 + i * 13, 132, 12, 34 + hash(i, 1, 613) * 26, { s: 614 + i });
    const HI = ["#8a8a96", "#6a6a76", "#4a4a54", "#30303a", "#1c1c24"];
    T.rect(k, 96, 22, 136, 8, (x, y) => rampa(HI, 0.2 + (y - 22) / 8 * 0.6, x, y)); T.rect(k, 96, 22, 10, 118, (x, y) => rampa(HI, 0.2 + (x - 96) / 10 * 0.7, x, y)); T.rect(k, 222, 22, 10, 118, (x, y) => rampa(HI, 0.2 + (x - 222) / 10 * 0.7, x, y));
    for (let y = 26; y < 140; y += 8) { k.P(100, y, HI[0]); k.P(227, y, HI[0]); }
    for (let x = 108; x < 222; x += 12) Det.cilindro(k, x, 30, 4, 102, HI, 0.3);
    [62, 98].forEach((y) => T.rect(k, 106, y, 116, 3, (x, yy) => rampa(HI, 0.2 + (yy - y) / 3 * 0.6, x, yy)));
    T.rect(k, 126, 4, 76, 14, (x, y) => rampa(HI, 0.2 + (y - 4) / 14 * 0.5, x, y)); k.R(126, 4, 76, 1, HI[0]); rotuloG(k, 129, 6, "EMPIL DOWN", "#e8c35a", 2);
    [[30, 0, 70], [60, 0, 46], [262, 0, 52], [292, 0, 76]].forEach(([x, y0, y1]) => { T.cadena(k, x, y0, y1); k.elipse(x, y1 + 3, 4, 3, HI[2]); k.elipse(x, y1 + 3, 2, 1, "#261414"); });
    const F = [T.antorcha(k, 80, 60), T.antorcha(k, 248, 60)];
    suelo3d(k, 138, 180, 160, 100, losas3d(["#5a4444", "#4a3838", "#3c2e2e", "#2e2424", "#201818"], { tx: 15, tz: 10, s: 615, junta: "#1a0e0c" })); k.R(0, 138, W, 2, "#2a1a1a");
    [[[0, 168], [30, 160], [24, 150], [58, 142]], [[320, 164], [288, 158], [296, 148], [262, 142]]].forEach((g) => { trazo(k, g, "#ff8a3a", 2, 1); trazo(k, g, "#ffe06a", 1); });
    [[20, 150], [300, 152]].forEach(([x, b]) => { fuego(k, x, b, 14, 22, { s: x + 7 }); F.push({ x, y: b - 8, r: 40, ry: 24, col: "#ff8a3a", f: 1 }); });
    bruma(k, 120, 180, "#c8a8a8", 0.3, { s: 616 });
    luces(k, [...F, { x: 164, y: 112, r: 120, ry: 50, col: "#ff9a4a", f: 1 }]);
  }
  O[27] = ["Empil Down", "La gran prisión bajo el mar: rejas, cadenas y el infierno ardiendo", impel, { cielo: "propio", fuerza: 0.05, fuego: ["#ffb43a", "#f06a24", "#c8361c", "#7a1e14", "#ff6a2a", "#ff8a3a", "#ffe06a", "#e8c35a"] }];

  function punk(k) {
    k.banda(["#8ab0d8", "#a8c4e0", "#c8d8ea", "#e6eef4"], 0, 110);
    for (let y = 0; y < 110; y++) for (let x = 0; x < 160; x++) { const v = (1 - x / 160) * (0.4 + fbm(x * 0.03, y * 0.05, 621) * 0.5); if (v > 0.35) k.P(x, y, rampa(["#e8a080", "#c87a64", "#a05a4c", "#7a4038"], 0.2 + (1 - v) * 0.8, x, y)); }
    pluma(k, 54, 50, 50, 14, ["#6a5a5a", "#544646", "#3e3434", "#2c2424"], { s: 622, viento: 0.5 });
    montana(k, 54, 112, 140, 70, { roca: ["#5a4040", "#4a3434", "#3a2828", "#2c1e1e", "#201414"], rugosa: 1.4 });
    for (let i = 0; i < 5; i++) { let x = 48 + i * 4, y = 46; for (let j = 0; j < 34; j++) { x += (hash(i, j, 623) - 0.5) * 5 + (i - 2) * 0.8; y += 2; k.crudo(x, y, 2, 2, j % 3 === 0 ? "#ffe06a" : j % 3 === 1 ? "#ff9a3a" : "#e8502a"); } }
    const HIELO = ["#ffffff", "#e8f4fc", "#c8e2f4", "#a4cae8", "#7eacd4", "#5a8cbc"];
    [[200, 112, 50, 66], [244, 112, 60, 86], [292, 112, 56, 72], [320, 112, 40, 50]].forEach(([cx, base, w, h], i) => rellena(k, [[cx - w / 2, base], [cx - w / 6, base - h * 0.7], [cx, base - h], [cx + w / 4, base - h * 0.6], [cx + w / 2, base]], (x, y) => rampa(HIELO, 0.1 + (x > cx + (base - y) * -0.1 ? 0.4 : 0) + ((y - base + h) / h) * 0.3 + (Math.sin((x + y) * 0.6) > 0.8 ? 0.15 : 0), x, y)));
    const GR = ["#e8ecf0", "#ccd2da", "#aab2be", "#8a94a2", "#6c7684"];
    T.rect(k, 124, 64, 72, 50, (x, y) => rampa(GR, 0.1 + ((x - 124) / 72) * 0.5 + (y % 8 === 0 ? 0.15 : 0), x, y));
    bola(k, 160, 64, 30, 22, (x, y) => (y > 64 ? null : rampa(["#bfe4f8", "#8ac8ec", "#5aa6d8", "#3a84b8", "#2a6694"], 0.1 + ((x - 160) / 30) * 0.4 + ((y - 42) / 22) * 0.3 + (Math.round(x - 130) % 8 === 0 ? 0.15 : 0), x, y)));
    for (let f = 0; f < 2; f++) for (let x = 130; x < 192; x += 10) T.ventana(k, x, 72 + f * 14, 6, 7, { marco: GR[4], vidrio: "#3f6f9a" });
    k.R(152, 98, 16, 16, "#4a5260"); k.R(153, 99, 14, 15, "#6a7484");
    trazo(k, [[196, 90], [214, 90], [222, 100], [240, 100]], GR[3], 4); trazo(k, [[124, 84], [104, 84], [98, 96]], GR[3], 4);
    k.poli([[178, 100], [186, 100], [182, 93]], "#f2c84b"); k.P(182, 98, "#1c1c22"); k.P(182, 96, "#1c1c22");
    T.rect(k, 0, 112, W, 68, (x, y) => { const lado = x + (y - 112) * 0.4 < 166; if (lado) { const c = celdas(x, y * 1.4, 12, 8, 624, 0.7); return c.borde < 0.1 ? (c.borde < 0.05 ? "#ffe06a" : "#ff8a3a") : rampa(["#4a3434", "#3a2828", "#2c1e1e", "#201414"], 0.2 + (c.id - 0.5) * 0.4, x, y); } return rampa(["#ffffff", "#f0f6fb", "#dce8f2", "#c4d6e8", "#a8c0d8"], 0.1 + ((y - 112) / 68) * 0.3 + (fbm(x * 0.05, y * 0.15, 625) - 0.5) * 0.5, x, y); });
    bruma(k, 100, 180, "#f0f0f4", 0.6, { s: 626, perfil: (x, y) => Math.max(0, 1 - Math.abs(x + (y - 112) * 0.4 - 166) / 30) });
    [[30, 150], [80, 170]].forEach(([x, b], i) => fuego(k, x, b, 12, 18, { s: 627 + i }));
    P.nieve(k, 70, 628, { y0: 0, y1: 180 });
    luces(k, [{ x: 30, y: 144, r: 34, ry: 20, col: "#ff9a4a", f: 1 }, { x: 80, y: 164, r: 34, ry: 20, col: "#ff9a4a", f: 1 }]);
  }
  O[28] = ["Funk Hazard", "La isla partida en dos, mitad fuego y mitad hielo", punk, { tinte: 0.6, ven: ["#3f6f9a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ff8a3a", "#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];

  function zuo(k) {
    const lit = encendido(k);
    k.banda(["#101a34", "#18244a", "#22305c", "#2e3e6c"], 0, 124);
    const ELE = ["#8a9ab8", "#74849f", "#5e6e88", "#4a5870", "#36425a", "#262f42"];
    bola(k, 190, 64, 100, 72, (x, y) => rampa(ELE, 0.28 + ((x - 190) / 100) * 0.3 + ((y - 64) / 72) * 0.3 + (Math.sin(y * 0.3 + Math.sin(x * 0.04) * 2 + fbm(x * 0.04, y * 0.04, 629) * 4) > 0.93 ? 0.1 : 0) + (fbm(x * 0.05, y * 0.08, 630) - 0.5) * 0.25, x, y));
    if (lit > 0) for (let a = Math.PI * 1.08; a < Math.PI * 1.92; a += 0.004) { const x = 190 + Math.cos(a) * 100, y = 64 + Math.sin(a) * 72; k.alfa(0.7, () => { k.crudo(x, y, 1, 2, "#9aaee0"); }); }
    bola(k, 112, 62, 40, 50, (x, y) => rampa(ELE, 0.42 + ((x - 112) / 40) * -0.25 + (fbm(x * 0.06, y * 0.06, 631) - 0.5) * 0.3, x, y));
    for (let a = 0; a < Math.PI * 2; a += 0.01) { const x = 112 + Math.cos(a) * 40, y = 62 + Math.sin(a) * 50; k.P(x, y, ELE[5]); if (lit > 0 && a > Math.PI * 1.1 && a < Math.PI * 1.7) k.alfa(0.6, () => k.crudo(x, y - 1, 1, 1, "#9aaee0")); }
    k.elipse(164, 50, 7, 4, "#141c2c"); k.elipse(165, 50, 3, 2, "#2a3448"); k.crudo(162, 49, 2, 1, "#d8e4ff"); trazo(k, [[152, 42], [162, 39], [174, 42]], ELE[5], 1);
    const trompa = Det6.bezier([150, 80], [118, 104], [62, 98], [54, 44], 60);
    trazo(k, trompa, (f) => ELE[f < 0.3 ? 2 : f < 0.7 ? 1 : 2], 22, 8);
    trompa.forEach(([x, y], i) => { if (i % 4 === 0 && i > 2) { const g = 10 - i * 0.12; trazo(k, [[x - g * 0.4, y - g * 0.5], [x + g * 0.4, y + g * 0.5]], ELE[4], 1); } if (lit > 0 && i % 2 === 0) k.alfa(0.55, () => k.crudo(x - 4, y - 8 + i * 0.08, 2, 1, "#9aaee0")); });
    k.elipse(54, 42, 4, 3, ELE[4]);
    trazo(k, Det6.bezier([168, 84], [150, 98], [132, 96], [124, 86], 16), (f) => (f < 0.5 ? "#f4efe0" : "#e6dcc8"), 6, 3);
    for (let i = 0; i < 18; i++) copa(k, i * 20 - 4, 106 + (i % 3) * 4, 16, 14, ["#3a6a5a", "#2e5a4c", "#244a3e", "#1a3a30", "#122a22"], { r: 5, s: 632 + i });
    T.prado(k, 118, ["#4a7a5a", "#3e6a4e", "#325a42", "#284a36", "#1e3a2a", "#162c20"], 637, { flores: { n: 22, cols: ["#e8e0ff", "#c8b8f8"] } });
    for (let y = 122; y < H; y++) { const f = (y - 122) / 58, c = 164 + Math.sin(f * 2.6) * 12 * f, w = 4 + f * 18; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#8a8070", "#76705e", "#625c4e", "#4e4a3e"], 0.2 + Math.abs(x - c) / w * 0.4 + (fbm(x * 0.2, y * 0.3, 638) - 0.5) * 0.3, x, y)); }
    const choza = (x, b, r, s) => { sombraE(k, x + 2, b, r, 2, 0.5); bola(k, x, b - r * 0.6, r, r * 0.7, (px, py) => (py > b ? null : rampa(["#c8a07a", "#a88058", "#8a6440", "#6c4a2c"], 0.2 + ((px - x) / r) * 0.3 + ((py - b + r) / r) * 0.3, px, py))); rellena(k, [[x - r - 3, b - r * 0.7], [x, b - r * 1.9], [x + r + 3, b - r * 0.7]], tejas(["#6a8a4a", "#567a3c", "#446630", "#325024", "#223a18"], { w: 4, h: 2, s, y0: b - r * 1.9 })); k.elipse(x, b - 4, 3, 4, "#ffd27a"); k.R(x - 3, b - 4, 6, 4, "#ffd27a"); return [x, b - 4]; };
    const cz = [choza(30, 138, 12, 633), choza(74, 132, 9, 634), choza(250, 132, 10, 635), choza(292, 138, 13, 636)];
    const farolillos = [];
    [[40, 100, 120, 108], [204, 106, 290, 100]].forEach(([x0, y0, x1, y1]) => { for (let i = 0; i <= 80; i++) { const t = i / 80, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 6; k.P(x, y, "#2a2018"); if (i % 16 === 8) farolillos.push([x, y + 3]); } });
    farolillos.forEach(([x, y], i) => { k.elipse(x, y, 2, 3, i % 2 ? "#e8402a" : "#f2c84b"); if (lit > 0) k.crudo(x - 1, y - 1, 2, 3, "#fff0c0"); });
    for (let i = 0; i < 26; i++) { const x = 20 + hash(i, 1, 639) * 280, y = 96 + hash(i, 2, 639) * 70; k.crudo(x, y, 1, 1, "#e8f87a"); if (i % 3 === 0) k.alfa(0.4, () => k.crudo(x - 1, y - 1, 3, 3, "#c8e85a")); }
    luces(k, [...cz.map(([x, y]) => ({ x, y, r: 22, ry: 14, col: LUZ, f: lit })), ...farolillos.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: "#ffcf7a", f: lit * 0.8 }))]);
  }
  O[29] = ["Zuo", "El ducado de los minks, sobre el lomo de un elefante gigante", zuo, { tinte: 0.1, ven: VEN, dx: 70 }];

  function wholeCake(k) {
    const lit = encendido(k);
    k.banda(["#9ad0f4", "#bcdef6", "#e4ecf6", "#fbeef4"], 0, 116);
    nubarron(k, -16, 36, 70, 14, ["#ffffff", "#fbeef6", "#f0d8e8"]); nubarron(k, 220, 60, 60, 10, ["#ffffff", "#fbeef6", "#f0d8e8"]);
    const BIZ = ["#fce8c8", "#f4d4a8", "#e6bc88", "#d0a06a", "#b0844e"], ROSA = ["#ffffff", "#fde8f0", "#f8c8dc", "#ecaac4", "#d488a8"];
    const piso = (cx, base, w, h, nata, s) => { T.rect(k, cx - w / 2, base - h, w, h, (x, y) => rampa(nata, 0.08 + ((x - cx + w / 2) / w) * 0.5 + (fbm(x * 0.3, y * 0.3, s) - 0.5) * 0.15, x, y)); for (let x = Math.round(cx - w / 2); x < cx + w / 2; x++) { const l = 2 + Math.round(Math.max(0, Math.sin(x * 0.7 + s) * 4)); k.R(x, base - h, 1, l, "#ffffff"); k.P(x, base - h + l, "#f0e4e8"); } k.R(cx - w / 2, base - 3, w, 3, BIZ[2]); };
    piso(160, 116, 150, 30, ROSA, 641); piso(160, 86, 118, 26, ["#fff8e8", "#fbecd0", "#f0dcb4", "#e0c69a", "#c8aa80"], 642); piso(160, 60, 84, 24, ROSA, 643); piso(160, 36, 52, 18, ["#fff8e8", "#fbecd0", "#f0dcb4", "#e0c69a", "#c8aa80"], 644);
    const fresa = (x, y, r) => { bola(k, x, y, r, r * 1.1, (px, py) => rampa(["#ff6a6a", "#e8343a", "#c01c28", "#8a1018"], 0.2 + ((px - x) + (py - y)) / (r * 3), px, py)); k.R(x - r * 0.6, y - r - 1, r * 1.2, 2, "#3f9a4a"); for (let i = 0; i < 4; i++) k.P(x - r * 0.4 + hash(i, x | 0, 645) * r * 0.8, y - r * 0.3 + hash(x | 0, i, 645) * r, "#ffe0a0"); };
    fresa(160, 12, 6); [[100, 84], [124, 84], [196, 84], [220, 84], [128, 56], [192, 56], [146, 32], [174, 32]].forEach(([x, y]) => fresa(x, y, 3.5));
    [[136, 18], [184, 18]].forEach(([x, y]) => { T.rect(k, x - 1, y, 3, 10, (px, py) => (py % 3 === 0 ? "#e8402a" : "#ffffff")); fuego(k, x + 0.5, y, 3, 5, { s: x }); });
    for (let f = 0; f < 3; f++) { const y = [94, 66, 42][f], w = [130, 100, 64][f]; for (let x = 160 - w / 2 + 8; x < 160 + w / 2 - 8; x += 14) if (Math.abs(x - 160) > 12) T.ventana(k, x, y, 5, 8, { arco: true, marco: "#c0607a", vidrio: "#ffd27a" }); }
    k.elipse(160, 104, 11, 11, "#5a2e1c"); T.rect(k, 149, 104, 22, 12, () => "#5a2e1c"); bola(k, 160, 104, 9, 9, (x, y) => (y > 104 ? null : rampa(["#8a5034", "#6e3a22", "#542a18"], 0.3 + ((x + y) % 4 === 0 ? 0.3 : 0), x, y))); T.rect(k, 151, 104, 18, 12, (x, y) => rampa(["#8a5034", "#6e3a22", "#542a18"], 0.3 + ((x + y) % 4 === 0 ? 0.3 : 0), x, y));
    const piruleta = (x, b, r, cols, s) => { k.R(x - 1, b - 30, 2, 30, "#f4efe6"); for (let y = -r; y <= r; y++) for (let xx = -r; xx <= r; xx++) { const d = Math.hypot(xx, y); if (d > r) continue; const a = Math.atan2(y, xx) + d * 0.5; k.P(x + xx, b - 30 - r + y, d > r - 1 ? cols[2] : Math.sin(a * 2) > 0 ? cols[0] : cols[1]); } };
    piruleta(20, 120, 12, ["#f8a8d0", "#ffffff", "#c86a9a"], 646); piruleta(54, 126, 9, ["#8ad8f0", "#ffffff", "#4aa0c8"], 647); piruleta(268, 124, 10, ["#f8c870", "#ffffff", "#d09030"], 648); piruleta(304, 120, 13, ["#c8a8f8", "#ffffff", "#8a6ad0"], 649);
    [[84, 128], [238, 128]].forEach(([x, b]) => { for (let y = b; y > b - 34; y--) k.P(x, y, Math.floor((y + x) / 3) % 2 ? "#e8402a" : "#ffffff"); for (let a = 0; a < Math.PI; a += 0.1) k.P(x + 4 - Math.cos(a) * 4, b - 34 - Math.sin(a) * 4, Math.floor(a * 3) % 2 ? "#e8402a" : "#ffffff"); });
    suelo3d(k, 116, 180, 160, 92, losas3d(["#f8e0b0", "#eecc96", "#deb47c", "#c89a64", "#a8804e"], { tx: 24, tz: 16, s: 650, junta: "#b88a5a" }));
    bola(k, 36, 158, 44, 12, (x, y) => rampa(["#fff2b0", "#f8e088", "#ecc860", "#d4a840"], 0.2 + ((y - 146) / 24) * 0.5 + (Math.sin(x * 0.3 + y) > 0.8 ? -0.15 : 0), x, y));
    const helado = (x, b, c) => { sombraE(k, x + 1, b, 5, 1.5, 0.4); rellena(k, [[x - 4, b - 12], [x + 4, b - 12], [x, b]], (px, py) => ((px + py) % 3 === 0 ? "#b08050" : "#e0b070")); esfera(k, x, b - 15, 5, 4.5, c); k.P(x - 2, b - 17, "#ffffff"); };
    helado(98, 172, ["#ffe0ec", "#f8b8d0", "#e090b0"]); helado(226, 174, ["#e0f8e8", "#a8e8c0", "#70c890"]); helado(296, 168, ["#fff4d8", "#f8e0a0", "#e0c070"]);
    [[66, 176, "#f8a8d0"], [256, 178, "#a8d8f8"], [312, 176, "#f8e088"]].forEach(([x, b, c]) => { sombraE(k, x + 1, b, 6, 1.5, 0.4); k.elipse(x, b - 3, 6, 2, c); k.elipse(x, b - 5, 6, 1.5, "#fff8f0"); k.elipse(x, b - 7, 6, 2, c); });
    luces(k, [{ x: 160, y: 80, r: 70, ry: 40, col: LUZ, f: lit * 0.5 }]);
  }
  O[30] = ["Cupcake Island", "El castillo pastel de Big Mum, entre bosques de dulces", wholeCake, { tinte: 0.5, ven: VEN, dx: 76 }];

  function eggbrain(k) {
    k.banda(["#f4a46a", "#f8c08a", "#fbdcaa", "#fff0d0"], 0, 120);
    nubarron(k, -16, 70, 70, 12, ["#fff0e0", "#f8d4bc", "#e8b49a"]); nubarron(k, 250, 60, 70, 12, ["#fff0e0", "#f8d4bc", "#e8b49a"]);
    const MET = ["#f2f4f8", "#d8dce4", "#b8c0cc", "#949eae", "#727c8e", "#545e70"];
    [[14, 20, 16], [46, 34, 12], [262, 26, 14], [292, 14, 18], [228, 46, 10], [84, 50, 10]].forEach(([x, top, w], i) => { Det.cilindro(k, x, top, w, 140 - top, MET, 0.3); for (let y = top + 8; y < 136; y += 14) { k.R(x - 1, y, w + 2, 2, "#3ac0e8"); k.R(x - 1, y + 2, w + 2, 1, "#2a90b8"); } bola(k, x + w / 2, top, w / 2 + 1, 4, (px, py) => (py > top ? null : rampa(MET, 0.2 + (px - x) / w * 0.6, px, py))); });
    cuerda(k, 22, 40, 120, 64, 10, MET[4]); cuerda(k, 200, 64, 300, 30, 10, MET[4]); cuerda(k, 54, 60, 112, 76, 6, MET[4]);
    k.elipse(240, 28, 8, 3, MET[2]); k.elipse(240, 26, 4, 2, "#7ae8ff"); k.R(234, 30, 12, 1, "#3ac0e8");
    const HUEVO = ["#fff4ec", "#fbe2d4", "#f2c8b4", "#e0a894", "#c48878", "#a06a5c"];
    bola(k, 160, 92, 48, 54, (x, y) => (y > 128 ? null : rampa(HUEVO, 0.1 + ((x - 160) / 48) * 0.35 + ((y - 38) / 90) * 0.3 + (Math.round((x - 112) / 8) % 2 === 0 && y % 10 < 1 ? 0.15 : 0) + ((Math.round(Math.atan2(y - 92, x - 160) * 8)) % 2 ? 0.04 : 0), x, y)));
    trazo(k, [[120, 64], [130, 58], [138, 64], [148, 56], [158, 62], [168, 54], [178, 62], [190, 56], [200, 64]], HUEVO[5], 1);
    for (let x = 124; x < 198; x += 10) T.ventana(k, x, 84, 6, 6, { marco: HUEVO[5], vidrio: "#7ae8ff", cruz: false });
    k.R(112, 100, 96, 2, "#3ac0e8"); k.elipse(160, 116, 10, 10, MET[5]); bola(k, 160, 116, 8, 8, (x, y) => (y > 124 ? null : rampa(["#4a5464", "#3a4252", "#2a3040"], 0.3 + (x - 152) / 16 * 0.4, x, y))); k.R(159, 108, 2, 16, "#3ac0e8");
    suelo3d(k, 128, 180, 160, 100, losas3d(["#e4e8ee", "#d0d4dc", "#b8bec8", "#9ea6b2", "#848c9a"], { tx: 34, tz: 22, s: 651, junta: "#6a7484" })); k.R(0, 128, W, 2, "#3ac0e8");
    [-1.2, -0.5, 0.5, 1.2].forEach((d) => { for (let y = 130; y < H; y++) k.crudo(160 + d * (y - 100) * 2.2, y, 1, 1, "#3ac0e8"); }); for (let y = 140; y < H; y += 14) k.crudo(0, y + Math.round((y - 128) * 0.3), W, 1, "#2a90b8");
    const robot = (x, b) => { sombraE(k, x + 1, b, 6, 1.5, 0.45); k.R(x - 3, b - 8, 2, 8, MET[4]); k.R(x + 2, b - 8, 2, 8, MET[4]); T.rect(k, x - 5, b - 20, 11, 12, (px, py) => rampa(MET, 0.2 + (px - x + 5) / 11 * 0.6, px, py)); bola(k, x, b - 24, 5, 4, (px, py) => rampa(MET, 0.2 + (px - x + 5) / 10 * 0.6, px, py)); k.R(x - 3, b - 25, 7, 2, "#3ac0e8"); k.R(x - 7, b - 18, 2, 8, MET[3]); k.R(x + 6, b - 18, 2, 8, MET[3]); };
    robot(74, 142); robot(246, 142);
    [[52, 168], [270, 170]].forEach(([x, b]) => { sombraE(k, x + 1, b, 7, 2, 0.4); esfera(k, x, b - 6, 7, 6, ["#ffe8e0", "#f8c8b8", "#e0a090", "#b87a6a"]); k.R(x - 7, b - 6, 14, 1, "#3ac0e8"); });
    luces(k, [{ x: 160, y: 120, r: 50, ry: 20, col: "#7ae8ff", f: 0.5 }]);
  }
  O[31] = ["Eggbrain", "La isla del futuro, con el laboratorio en forma de huevo", eggbrain, { tinte: 0.15, ven: ["#7ae8ff"], fuego: ["#3ac0e8", "#2a90b8"], dx: 0 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, espuma, loma, rotulo, humo, sombra, bandera } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, losas3d, copa, briznas, fronda, sombraE, luces, espejo, bruma, rayos, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  window.SitiosIt18 = window.SitiosIt18 || {};
  const O = (window.SitiosIt18.piratas = window.SitiosIt18.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const rotuloLuz = (k, x, y, texto, col, e = 1) => rotulo({ P: (px, py, c) => k.crudo(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const flags = (n) => ({ S: n === 2 || n === 4, HI: n >= 3 });
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];
  function pirata(k, x, y, w, { tela = "#1e1c22", hueso = "#f4efe0", sonrisa = false } = {}) {
    const a = Math.round(w * 0.62);
    rellena(k, [[x, y], [x + w, y + 1], [x + w - 1, y + a * 0.5], [x + w + 1, y + a], [x, y + a - 1]], (px, py) => (Math.sin(px * 0.5 + py * 0.3) > 0.7 ? mezcla(tela, "#000000", 0.4) : tela));
    const cx = x + w * 0.5, cy = y + a * 0.42, r = Math.max(2, w * 0.17);
    trazo(k, [[cx - r * 1.6, cy + r * 1.6], [cx + r * 1.6, cy - r * 0.2]], hueso); trazo(k, [[cx - r * 1.6, cy - r * 0.2], [cx + r * 1.6, cy + r * 1.6]], hueso);
    k.elipse(cx, cy, r, r * 0.9, hueso); k.R(cx - r * 0.6, cy + r * 0.5, r * 1.2, r * 0.6, hueso);
    k.P(cx - r * 0.4, cy - 0.5, tela); k.P(cx + r * 0.4, cy - 0.5, tela);
    if (sonrisa) { k.R(cx - r * 0.9, cy + r * 0.45, r * 1.8, 1, tela); for (let i = -1; i <= 1; i++) k.P(cx + i * r * 0.5, cy + r * 0.45 - 1, tela); }
  }
  window.H18 = { rotuloG, rotuloLuz, flags, pirata, CIELO };

  const SELVA = ["#8ac890", "#64ac74", "#4a9060", "#36744c", "#265a3a"], PINT = ["#fff2e8", "#f8e2d4", "#f0d2c2", "#e0bcaa", "#c49e8c"];
  const AZT = ["#a8c8e8", "#7fa8d0", "#5f88b0", "#466c92", "#324e70"], MT = ["#d8b488", "#c09a6c", "#a07c52", "#80603c", "#5e4428", "#3e2c18"];
  const MAD_V = madera(PAL.MAD, { paso: 3, vertical: true, largo: 99, s: 2401 });
  function yaya(k, n, arreglo = false) {
    const { h } = Det.cuando(k), lit = encendido(k), { S, HI } = flags(n);
    k.banda(CIELO, 0, 104);
    nubarron(k, -20, 44, 96, 16); nubarron(k, 240, 34, 100, 18); cirros(k, 5, 6, 26);
    if (S) [[30, 14, 22], [82, 30, 18]].forEach(([x, top, r], i) => {
      rellena(k, [[x - 4, 100], [x - 3, top + r], [x + 3, top + r], [x + 4, 100]], corteza(["#8a6a4a", "#6e5238", "#563e28", "#3e2c1c", "#2a1c10"], x - 4, 8, { s: 2402 + i }));
      copa(k, x, top + r * 0.4, r + 6, r * 0.62, SELVA, { r: 5, s: 2404 + i }); copa(k, x - r * 0.7, top + r * 0.8, r * 0.6, r * 0.4, SELVA, { r: 4, s: 2406 + i }); copa(k, x + r * 0.8, top + r * 0.7, r * 0.6, r * 0.42, SELVA, { r: 4, s: 2408 + i });
    });
    loma(k, [[-20, 110], [34, 58], [90, 74], [132, 112]], 116, ["#6aa878", "#4f9060", "#3f7a50"], 0.24);
    for (let i = 0; i < 16; i++) copa(k, 4 + i * 8, 62 + Math.abs(i - 5) * 3.2 + (i % 3) * 2, 7 + (i % 2) * 2, 6, SELVA, { r: 3, s: 2410 + i });
    P.mar(k, 96, 124, PAL.MAR, { s: 2412 }); reflejo(k, 98, 124);
    if (h === 9) { for (let y = 0; y < 104; y++) { const a = 9 + Math.sin(y / 6) * 2 + (104 - y) * 0.03; for (let x = Math.round(278 - a); x <= 278 + a; x++) k.P(x, y, Math.sin(x * 1.2 + y / 7) > 0.5 ? "#ffffff" : rampa(["#e8fbff", "#b8ecfa", "#7fd0f0"], (Math.sin(x * 0.7 + y / 11) + 1) * 0.45, x, y)); } k.elipse(278, 102, 26, 5, "#ffffff"); nubarron(k, 250, 104, 56, 5); }
    const vents = [];
    const taberna = (x, base, w, hh, s, { techo = PAL.TEJA_R, ladea = 0, pisos = 1, cartel = null } = {}) => {
      T.rect(k, x, base - hh, w, hh, madera(MT, { paso: 3, largo: 30, s }));
      k.alfa(0.25, () => k.R(x + w - 3, base - hh, 3, hh, "#2a1a0c"));
      rellena(k, [[x - 3, base - hh + 1], [x + w + 3, base - hh + 1 + ladea], [x + w - 1, base - hh - 7 + ladea], [x + 2, base - hh - 8]], tejas(techo, { w: 4, h: 2, s, y0: base - hh - 8 }));
      trazo(k, [[x - 3, base - hh + 1], [x + w + 3, base - hh + 1 + ladea]], techo[4]);
      for (let p = 0; p < pisos; p++) for (let vx = x + 4; vx < x + w - 6; vx += 11) { const vy = base - hh + 4 + p * 12; if (p === pisos - 1 && Math.abs(vx - (x + w / 2 - 2)) < 6) continue; T.ventana(k, vx, vy, 5, 6, { marco: MT[5], vidrio: "#ffd27a" }); k.R(vx - 2, vy - 1, 1, 8, "#5a7a4a"); k.R(vx + 6, vy - 1, 1, 8, "#5a7a4a"); vents.push([vx + 2, vy + 3]); }
      k.R(x + w / 2 - 4, base - 10, 8, 10, MT[5]); k.R(x + w / 2 - 3, base - 9, 6, 9, "#ffd27a"); k.R(x + w / 2 - 3, base - 9, 3, 9, MT[3]); vents.push([x + w / 2, base - 5]);
      if (cartel) { k.R(x + 2, base - hh - 1 - 7, cartel.length * 4 + 4, 7, MT[4]); k.R(x + 2, base - hh - 8, cartel.length * 4 + 4, 1, MT[2]); rotulo(k, x + 4, base - hh - 7, cartel, "#ffe9a8"); }
    };
    if (S) { [[2, 104, 18, 13, PAL.TEJA_A], [22, 100, 16, 12, PAL.TEJA_R], [40, 102, 18, 14, ["#c8a070", "#a88050", "#886038", "#684824", "#4a3018"]], [62, 104, 16, 12, PAL.TEJA_A], [80, 106, 18, 12, PAL.TEJA_R]].forEach(([x, b, w, hh, te], i) => taberna(x, b, w, hh, 2420 + i, { techo: te, ladea: i % 2 ? 2 : -1 })); }
    const palo = (x, y0, y1, w, i) => { k.R(x, y0, 2, y1 - y0, "#3a2a20"); pirata(k, x + 2, y0, w, { sonrisa: HI && i === 1 }); };
    palo(17, 50, 76, 18, 0); palo(62, 58, 84, 16, 1); if (S) palo(96, 72, 92, 12, 2);
    taberna(-6, 130, 44, 34, 2430, { pisos: 2, ladea: 2 }); taberna(42, 128, 38, 26, 2431, { techo: PAL.TEJA_A, ladea: -2 }); taberna(80, 127, 24, 18, 2432, { techo: ["#c8a070", "#a88050", "#886038", "#684824", "#4a3018"] });
    T.rect(k, 6, 102, 22, 9, madera(PAL.MAD_O, { paso: 3, largo: 99, s: 2433 })); k.R(6, 102, 22, 1, PAL.MAD[1]); rotulo(k, 11, 104, "BAR", "#ffe9a8"); k.R(13, 111, 1, 3, "#3a2a20"); k.R(22, 111, 1, 3, "#3a2a20");
    T.rect(k, 44, 108, 34, 4, madera(PAL.MAD, { paso: 2, largo: 99, s: 2434 })); for (let x = 46; x < 78; x += 4) k.R(x, 104, 1, 4, "#5a3a20"); k.R(44, 103, 34, 1, "#5a3a20");
    const fachada = (x0, w, s) => (x, y) => {
      const p = fbm(x * 0.09, y * 0.07, s);
      if (p > 0.745) return p > 0.76 ? MAD_V(x, y) : PINT[4];
      const fila = Math.floor((y - 2) / 8);
      if ((y - 2) % 8 === 0 || (x + (fila % 2) * 7) % 14 === 0) return PINT[3];
      if ((x - 104) % 17 === 0) return PINT[2];
      return rampa(PINT, 0.1 + ((x - x0) / w) * 0.3 + (fbm(x * 0.25, y * 0.25, s + 1) - 0.5) * 0.14, x, y);
    };
    T.rect(k, 112, 58, 84, 70, fachada(112, 84, 2440));
    [[104, 44, 18], [186, 44, 18], [142, 24, 26]].forEach(([x, y, w], i) => {
      T.rect(k, x, y, w, 128 - y, fachada(x, w, 2441 + i)); k.R(x, y, 1, 128 - y, PINT[0]); k.alfa(0.3, () => k.R(x + w - 3, y, 3, 128 - y, "#8a5a4a"));
      rellena(k, [[x - 3, y], [x + w + 3, y], [x + w / 2, y - 20]], tejas(AZT, { w: 3, h: 2, s: 2444 + i, y0: y - 20 })); rellena(k, [[x + w / 2, y - 20], [x + w + 3, y], [x + w / 2 + 2, y]], (px, py) => mezcla(tejas(AZT, { w: 3, h: 2, s: 2444 + i, y0: y - 20 })(px, py), "#24344c", 0.35));
      k.R(x - 3, y, w + 6, 1, AZT[4]); k.R(x + w / 2, y - 26, 1, 6, "#5a4a3a"); bandera(k, x + w / 2 + 1, y - 26, 6, 3, "#e8607a");
      k.R(x + w / 2 - 1, y + 8, 2, 7, "#5a4a5a");
    });
    for (let x = 112; x < 196; x += 8) { k.R(x, 53, 5, 5, PINT[1]); k.R(x, 53, 5, 1, PINT[0]); k.alfa(0.35, () => k.R(x + 4, 54, 1, 4, "#8a5a4a")); }
    k.alfa(0.3, () => k.R(112, 58, 84, 2, "#8a5a4a"));
    [[120, 72, 10, 16], [172, 72, 10, 16], [150, 34, 9, 15], [108, 56, 7, 12], [192, 56, 7, 12]].forEach(([x, y, w, hh]) => { T.ventana(k, x, y, w, hh, { arco: true, marco: PINT[4], vidrio: AZT[1], brillo: "#e8f4ff" }); k.R(x - 1, y + hh, w + 2, 1, PINT[4]); });
    rellena(k, [[140, 128], [140, 106], [144, 97], [150, 92], [160, 92], [166, 97], [170, 106], [170, 128]], madera(["#c0885a", "#a87444", "#8a5a32", "#6e4424", "#54321a"], { paso: 5, vertical: true, largo: 99, s: 2447 }));
    trazo(k, [[139, 128], [139, 106], [143, 96], [150, 91], [160, 91], [167, 96], [171, 106], [171, 128]], PINT[4], 2);
    [100, 112, 122].forEach((y) => { k.R(141, y, 28, 2, "#3a3036"); for (let x = 143; x < 168; x += 5) k.P(x, y, "#8a8a92"); });
    k.R(155, 92, 1, 36, "#3a2414"); [[151, 110], [159, 110]].forEach(([x, y]) => { k.elipse(x, y, 2, 2, "#c9a03c"); k.P(x, y, "#3a2414"); });
    [[204, 60, 232, 128], [204, 86, 218, 128], [204, 46, 246, 128]].forEach(([a, b, c2, d]) => trazo(k, [[a, b], [c2, d]], (f) => (f < 0.5 ? PAL.MAD_O[1] : PAL.MAD_O[2]), 2));
    T.rect(k, 206, 96, 44, 32, madera(PAL.MAD, { paso: 4, largo: 44, s: 2448 }));
    rellena(k, [[204, 96], [256, 96], [238, 76], [204, 76]], tejas(["#a07a58", "#80603f", "#62462e", "#46301e", "#2e1e12"], { w: 4, h: 2, s: 2449, y0: 76 }));
    k.alfa(0.35, () => rellena(k, [[228, 96], [256, 96], [238, 76]], () => "#1a1008"));
    for (let y = 77; y < 128; y += 3) k.R(204, y, 2 + (hash(1, y, 2450) * 4 | 0), 1, PAL.MAD[(y / 3) % 2 ? 4 : 5]);
    T.ventana(k, 214, 104, 8, 8, { marco: "#5a3a22", vidrio: "#ffd27a" }); vents.push([218, 108]);
    k.R(232, 110, 9, 18, "#4a3020"); k.R(233, 111, 7, 17, "#6a4428"); k.P(238, 120, "#e8c35a");
    T.rect(k, 242, 64, 6, arreglo ? 22 : 14, (x, y) => rampa(["#9a8a7a", "#7a6a5a", "#5a4a3a"], (x - 242) / 6 + (y % 3 === 0 ? 0.2 : 0), x, y)); if (arreglo) { k.R(241, 64, 8, 2, "#5a4a3a"); k.alfa(0.5, () => k.R(242, 82, 6, 4, "#2a1a10")); } humo(k, 245, 62, "#e8e8e0", 0.45, 5);
    rellena(k, [[-2, 126], [322, 126], [322, 182], [-2, 182]], (x, y) => rampa(["#f8e6bc", "#eed6a2", "#e2c68e", "#d2b47c"], 0.12 + ((y - 126) / 54) * 0.4 + (fbm(x * 0.04, y * 0.1, 2451) - 0.5) * 0.18, x, y));
    k.alfa(0.35, () => k.R(100, 126, 156, 3, "#a8926a")); k.alfa(0.4, () => k.R(236, 124, 84, 3, "#c8a878"));
    espuma(k, 124, 236, 320); espuma(k, 123, 0, 100);
    T.rect(k, 262, 118, 62, 5, madera(PAL.MAD, { paso: 2, largo: 14, s: 2452 })); for (let x = 266; x < 320; x += 14) { k.R(x, 122, 3, 10, PAL.MAD_O[3]); k.R(x, 122, 1, 10, PAL.MAD_O[1]); }
    rellena(k, [[258, 104], [316, 104], [306, 116], [268, 116]], madera(PAL.MAD_O, { paso: 3, largo: 99, s: 2453 })); k.R(258, 104, 58, 2, PAL.MAD[1]); k.R(262, 109, 50, 1, PAL.MAD_O[4]);
    k.R(288, 76, 2, 29, "#6d4628");
    rellena(k, [[290, 78], [310, 98], [290, 100]], (x, y) => (x === 296 || y === 92 ? "#d8cbb4" : rampa(PAL.LONA, 0.1 + (x - 290) / 24, x, y))); k.R(298, 86, 4, 4, "#d8c4a0");
    trazo(k, [[290, 80], [262, 104]], "#5f3f24"); trazo(k, [[289, 77], [316, 104]], "#5f3f24");
    esfera(k, 258, 98, 7, 7, ["#c0895a", "#a87444", "#7a5230"]); esfera(k, 257, 100, 4, 3, ["#fbe6c8", "#f2d8b0", "#d8b080"]); k.R(254, 96, 2, 2, "#26262a"); k.R(259, 96, 2, 2, "#26262a"); k.P(254, 96, "#ffffff"); k.elipse(250, 96, 2, 3, "#a87444"); k.elipse(265, 96, 2, 3, "#a87444"); k.R(255, 102, 4, 1, "#7a4a2c");
    for (let i = 0; i < 4; i++) k.P(252 + i * 3, 91 - (i % 2), "#7a5230");
    if (HI) { trazo(k, [[298, 104], [312, 56]], PAL.MAD_O[3], 3); trazo(k, [[298, 104], [312, 56]], PAL.MAD_O[1], 1); trazo(k, [[310, 57], [318, 60]], PAL.MAD_O[3], 2); k.elipse(317, 61, 2, 2, "#5a5a66"); for (let y = 63; y < 116; y += 2) { k.P(317, y, "#8a8a96"); k.P(318, y + 1, "#5a5a66"); } k.alfa(0.6, () => k.elipse(317, 117, 5, 1, "#ffffff")); }
    k.R(98, 128, 2, 16, "#6d4628"); k.R(92, 128, 14, 2, "#6d4628"); esfera(k, 99, 123, 6, 5, ["#f4efe0", "#d8c8a0", "#a89470"]); k.poli([[103, 123], [110, 126], [103, 127]], "#e8a82a"); k.P(101, 121, "#26262a"); k.poli([[93, 121], [88, 117], [95, 125]], "#a89470"); k.R(96, 118, 4, 1, "#d8c8a0");
    sombraE(k, 120, 151, 12, 2, 0.35); esfera(k, 118, 142, 9, 9, ["#f4c47a", "#d89a48", "#a8702a", "#7a4a18"]); k.elipse(119, 143, 5, 5, "#3a3a44"); k.elipse(119, 143, 4, 4, "#26323a"); k.P(117, 141, "#a8d8f0"); k.P(118, 141, "#e8f8ff");
    [[118, 133], [127, 142], [109, 142], [118, 151]].forEach(([x, y]) => { k.R(x - 1, y - 1, 3, 3, "#a8842e"); k.P(x - 1, y - 1, "#f4d27a"); }); k.R(110, 150, 17, 2, "#6a4a24");
    sombraE(k, 215, 157, 14, 2, 0.4); T.rect(k, 204, 146, 22, 10, madera(["#a87444", "#8a5a32", "#6e4424", "#54321a", "#3a2210"], { paso: 3, largo: 99, s: 2454 })); bola(k, 215, 146, 11, 4, (x, y) => (y > 146 ? null : rampa(["#c0895a", "#a87444", "#8a5a32"], (y - 142) / 4, x, y)));
    [205, 213, 223].forEach((x) => k.R(x, 142, 2, 14, "#c9a03c")); k.R(213, 148, 4, 4, "#e8c35a"); k.P(215, 150, "#3a2210");
    for (let i = 0; i < 12; i++) { const x = 206 + hash(i, 1, 2455) * 20, y = 141 - hash(i, 2, 2455) * 3; k.R(x, y, 2, 1, i % 3 ? "#f2c84b" : "#fff2b0"); }
    for (let i = 0; i < 6; i++) k.R(226 + i * 3, 155 - (i % 2), 2, 1, "#f2c84b");
    if (HI) { sombraE(k, 186, 160, 12, 2, 0.45); rellena(k, [[172, 158], [176, 150], [184, 148], [188, 140], [192, 136], [196, 138], [194, 144], [200, 146], [206, 150], [196, 152], [190, 159]], (x, y) => rampa(["#fff2b0", "#f4d870", "#d8ac40", "#a8842e", "#7a5e1e"], 0.1 + (y - 136) / 30 + (x - 172) / 80, x, y)); k.P(193, 140, "#5a3e10"); trazo(k, [[178, 152], [188, 150]], "#a8842e"); k.crudo(181, 151, 1, 1, "#ffffff"); k.crudo(194, 138, 1, 1, "#ffffff"); }
    sombraE(k, 256, 171, 28, 2, 0.4); rellena(k, [[232, 170], [282, 170], [276, 160], [240, 160]], madera(PAL.MAD_O, { paso: 3, largo: 99, s: 2456 })); k.R(232, 167, 50, 3, PAL.MAD_O[3]); for (let x = 240; x < 276; x += 9) k.R(x, 160, 1, 10, PAL.MAD_O[4]); k.R(244, 160, 26, 1, PAL.MAD[2]);
    [[84, 140, 42], [306, 152, 54], [14, 160, 46]].forEach(([x, b, a], i) => { sombraE(k, x + 4, b, 12, 2, 0.35); P.palmera(k, x, b, a, { s: 2457 + i, inc: i === 1 ? -0.18 : 0.16 }); });
    if (HI) [[88, 118], [309, 126], [18, 136]].forEach(([x, y]) => { k.elipse(x, y + 1, 3, 4, "#a87a18"); k.elipse(x, y + 1, 2, 3, "#d8a42a"); k.P(x - 1, y - 1, "#fff2b0"); k.R(x - 1, y - 3, 2, 1, "#3a2410"); trazo(k, [[x, y - 3], [x, y - 8], [x + 2, y - 10]], "#3a2410"); k.P(x - 1, y - 8, "#3a2410"); [-1, 1].forEach((d) => { trazo(k, [[x + d * 2, y], [x + d * 5, y - 2]], "#3a2410"); trazo(k, [[x + d * 2, y + 3], [x + d * 5, y + 5]], "#3a2410"); }); });
    P.caja(k, 130, 158, 12, 9); P.barril(k, 144, 160, 10, 12);
    for (let i = 0; i < 16; i++) { const x = hash(i, 1, 2458) * 320, y = 136 + hash(i, 2, 2458) * 42; if (x > 196 && x < 286 && y > 140 && y < 174) continue; k.R(x, y, 2, 1, hash(i, 3, 2458) > 0.5 ? "#f8e8c8" : "#e8c8a0"); }
    luces(k, vents.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  O[24] = (n) => ["Yaya", "Mock Town, la ciudad sin ley, y la media casa de Creckit con su fachada de castillo", (k) => yaya(k, n), { ven: VEN, dx: -90 }];
  window.H18.yaya = yaya;

  const MARMOL = ["#fbf8f0", "#ece8dc", "#d8d4c6", "#bcb8aa", "#9a968a"], ACERO = ["#6a7484", "#56606e", "#444c5a", "#343a46", "#262c36", "#1a1e26"];
  const ORO = ["#fff2b0", "#f4d870", "#d8ac40", "#a8842e", "#7a5e1e"];
  function enies(k, n) {
    const { h } = Det.cuando(k), { S, HI } = flags(n);
    k.banda(["#6ab0e0", "#9ad0ec", "#d8ecf4"], 0, 100);
    nubarron(k, -24, 46, 100, 22); nubarron(k, 250, 40, 96, 24); cirros(k, 5, 4, 24);
    k.agua(86, 104, ["#3f9ad8", "#2f86c6"], "#d8f2fa", 30);
    if (S) {
      [[-4, 60, 30, true], [24, 70, 22, false], [276, 66, 24, false], [298, 56, 28, true]].forEach(([x, top, w, cupula], i) => {
        T.rect(k, x, top, w, 100 - top, (px, py) => rampa(MARMOL, 0.1 + ((px - x) / w) * 0.5, px, py));
        if (cupula) { bola(k, x + w / 2, top, w * 0.36, 9, (px, py) => (py > top ? null : rampa(["#7ab0e0", "#4f8ac8", "#2f6fa8", "#235488"], 0.1 + (px - x) / w * 0.7, px, py))); k.R(x + w / 2, top - 13, 1, 4, ORO[2]); }
        else { rellena(k, [[x - 2, top], [x + w + 2, top], [x + w / 2, top - 8]], (px, py) => rampa(MARMOL, 0.1 + (py - top + 8) / 16, px, py)); trazo(k, [[x - 2, top], [x + w / 2, top - 8], [x + w + 2, top]], "#2f6fa8"); }
        k.R(x - 1, top, w + 2, 2, MARMOL[3]); for (let y = top + 6; y < 94; y += 11) for (let vx = x + 4; vx < x + w - 4; vx += 7) T.ventana(k, vx, y, 3, 6, { arco: true, marco: MARMOL[4], vidrio: "#3f6f9a", cruz: false, brillo: "#a8d0f0" });
      });
      for (let x = 0; x < 40; x += 8) { k.R(x, 96, 2, 8, "#8a8a96"); } k.R(0, 95, 40, 2, "#5a5a66"); k.R(0, 94, 40, 1, "#b8b8c4");
    }
    rellena(k, [[78, 4], [242, 4], [242, 104], [78, 104]], (x, y) => { const pan = (Math.abs(x - 160) % 40 < 2 && Math.abs(x - 160) > 4) || ((y - 4) % 26 < 2); return pan ? ACERO[5] : rampa(ACERO, 0.2 + Math.abs(x - 160) / 170 + y / 320 + (fbm(x * 0.1, y * 0.1, 2501) - 0.5) * 0.12, x, y); });
    for (let x = 78; x < 242; x++) { k.P(x, 4, ACERO[0]); } k.R(74, 0, 172, 5, "#7a8494"); k.R(74, 0, 172, 1, "#a8b0bc"); k.R(74, 0, 6, 104, "#7a8494"); k.R(240, 0, 6, 104, "#3a4454"); k.R(159, 5, 2, 99, "#0e1218");
    for (let y = 22; y < 100; y += 26) { k.R(80, y, 160, 1, ACERO[0]); } for (let x = 90; x < 236; x += 10) for (let y = 10; y < 100; y += 13) { k.P(x, y, "#9aa4b4"); k.P(x + 1, y + 1, ACERO[5]); }
    [[122, 54], [198, 54]].forEach(([x, y]) => { bola(k, x, y, 23, 23, (px, py) => rampa(ORO, 0.2 + ((px - x) + (py - y)) / 60, px, py)); k.elipse(x, y, 19, 19, "#3a4454"); bola(k, x, y, 14, 14, (px, py) => rampa(ORO, 0.25 + ((px - x) + (py - y)) / 40, px, py)); k.elipse(x, y, 6, 6, "#3a4454"); k.elipse(x, y, 3, 3, ORO[2]); for (let a = 0; a < 4; a++) { const c = a * 1.571 + 0.785; trazo(k, [[x + Math.cos(c) * 6, y + Math.sin(c) * 6], [x + Math.cos(c) * 14, y + Math.sin(c) * 14]], "#3a4454", 2); } for (let a = 0; a < 6.28; a += 0.39) k.P(x + Math.cos(a) * 21, y + Math.sin(a) * 21, ORO[4]); });
    if (HI) [[100, 0], [220, 1]].forEach(([x, i]) => {
      const d = i ? -1 : 1;
      rellena(k, [[x - 18, 86], [x + 18, 86], [x + 14, 95], [x - 15, 95]], (px, py) => rampa(["#9aa2ae", "#7c8490", "#5e6672", "#444a54"], (py - 86) / 10, px, py)); k.R(x - 18, 86, 36, 1, "#e8e8ec"); k.R(x - 16, 89, 32, 1, "#2f5fa8"); for (let px = x - 13; px < x + 13; px += 5) k.P(px, 92, "#1a1e26");
      [[-7, 46], [7, 52]].forEach(([dx, top]) => { const mx = x + dx * d; k.R(mx, top, 2, 86 - top, "#4a3a2a"); [[top + 3, 12, 10], [top + 16, 15, 12]].forEach(([y, w, a]) => { k.R(mx - w / 2 - 1, y - 1, w + 4, 1, "#5a3a22"); rellena(k, [[mx - w / 2, y], [mx + w / 2 + 2, y], [mx + w / 2 + 3, y + a], [mx - w / 2 - 1, y + a]], (px, py) => rampa(["#ffffff", "#f2f2ee", "#dedad2", "#c4c0b6"], 0.05 + ((px - mx + w / 2) / (w + 3)) * 0.5 + ((py - y) / a) * 0.2, px, py)); trazo(k, [[mx - 3, y + a * 0.55], [mx + 1, y + a * 0.35], [mx + 5, y + a * 0.55]], "#2f5fa8"); }); k.R(mx - 1, top - 3, 4, 3, "#2f5fa8"); });
    });
    for (let x = 0; x < 320; x++) { const y0 = 100 + Math.sin(x / 11) * 1.5; for (let y = Math.round(y0); y < 130; y++) { const f = (Math.sin(x * 2.3) + Math.sin(x * 0.9 + y / 12)) * 0.5, hilo = hash(x, 1, 2502) > 0.86; k.P(x, y, y < y0 + 2 ? "#ffffff" : hilo ? "#ffffff" : rampa(["#ffffff", "#d8f2fa", "#a8dcf0", "#6ab8e0"], (f + 1) * 0.4 + ((y - y0) / 30) * -0.18, x, y)); } }
    k.niebla(118, 132, "#ffffff", 0.4); bruma(k, 112, 132, "#ffffff", 0.3, { s: 2503 });
    T.rect(k, 134, 34, 52, 92, (x, y) => { const v = Math.sin(x * 0.35 + fbm(x * 0.1, y * 0.05, 2504) * 6) > 0.92; return v ? MARMOL[3] : rampa(MARMOL, 0.06 + Math.pow(Math.abs((x - 148) / 38), 1.2) * 0.7, x, y); });
    for (let f = 0; f < 5; f++) { const y = 44 + f * 15; for (let x = 142; x < 180; x += 10) T.ventana(k, x, y, 5, 9, { arco: true, marco: MARMOL[4], vidrio: "#3f6f9a", brillo: "#a8d0f0", cruz: false }); k.R(134, y + 11, 52, 2, MARMOL[2]); k.R(134, y + 11, 52, 1, MARMOL[0]); }
    k.R(128, 30, 64, 5, MARMOL[2]); k.R(128, 30, 64, 1, MARMOL[0]); k.R(128, 34, 64, 1, MARMOL[4]); for (let x = 128; x < 192; x += 7) { k.R(x, 26, 4, 4, MARMOL[1]); k.R(x + 3, 27, 1, 3, MARMOL[3]); }
    T.rect(k, 148, 12, 24, 18, (x, y) => rampa(MARMOL, 0.08 + Math.abs((x - 154) / 18) * 0.7, x, y)); for (let x = 151; x < 170; x += 6) k.R(x, 16, 3, 9, "#3f6f9a");
    rellena(k, [[144, 12], [176, 12], [160, -2]], tejas(["#5a9ad8", "#3f80c0", "#2f6aa8", "#235488", "#1a3e68"], { w: 3, h: 2, s: 2505, y0: -2 })); k.R(144, 12, 32, 1, "#1a3e68");
    k.R(186, 4, 2, 28, "#6a6d80"); if (h < 23) { rellena(k, [[188, 4], [212, 7], [212, 20], [188, 18]], (x, y) => (Math.sin(x * 0.6 + y * 0.2) > 0.75 ? "#285e98" : "#2f6fa8")); k.elipse(200, 12, 5, 5, "#f4f0e4"); k.R(198, 8, 4, 9, "#2f6fa8"); k.R(195, 11, 11, 3, "#2f6fa8"); }
    const JU = (x, w, s) => {
      T.rect(k, x, 96, w, 34, (px, py) => rampa(["#b8b2a4", "#a49e90", "#8e887c", "#78736a"], 0.2 + ((py - 96) / 34) * 0.5, px, py));
      for (let px = x + 4; px < x + w - 4; px += 10) { T.rect(k, px, 104, 6, 24, (qx, qy) => rampa(MARMOL, 0.02 + Math.abs(qx - px - 1.5) * 0.14 + ((qx - px) === 3 ? 0.18 : 0), qx, qy)); k.R(px - 1, 102, 8, 2, MARMOL[0]); k.R(px - 1, 103, 8, 1, MARMOL[3]); k.R(px - 1, 127, 8, 2, MARMOL[1]); }
      k.R(x - 2, 100, w + 4, 3, MARMOL[1]); k.R(x - 2, 102, w + 4, 1, MARMOL[3]); k.R(x - 3, 129, w + 6, 2, MARMOL[0]); k.R(x - 5, 131, w + 10, 1, MARMOL[3]);
      rellena(k, [[x - 5, 100], [x + w + 5, 100], [x + w / 2, 86]], (px, py) => rampa(MARMOL, 0.08 + (py - 86) / 30, px, py)); trazo(k, [[x - 5, 100], [x + w / 2, 86], [x + w + 5, 100]], MARMOL[0]); rellena(k, [[x + 6, 98], [x + w - 6, 98], [x + w / 2, 90]], () => MARMOL[2]); k.elipse(x + w / 2, 95, 3, 2, ORO[2]);
      k.R(x - 5, 100, w + 10, 3, MARMOL[3]); k.R(x - 5, 100, w + 10, 1, MARMOL[1]);
    };
    JU(38, 74, 2506); JU(208, 74, 2507);
    Det.sillares(k, 0, 128, 320, 52, { base: "#dadad6", luz: "#ececea", osc: "#b4b4b0" }, 8, 26); k.R(0, 128, 320, 2, "#f8f8f4");
    k.alfa(0.18, () => { for (let y = 150; y < 180; y += 2) k.R(0, y, 320, 2, "#8a8a96"); });
    rellena(k, [[134, 126], [186, 126], [214, 180], [106, 180]], (x, y) => { const f = (y - 126) / 54, borde = Math.abs(x - 160) > 24 + f * 26; return borde ? "#8a9ab4" : rampa(["#c8d0e0", "#b8c2d4", "#a8b4c8"], ((y - 126) % 9 === 0 ? 0.6 : 0.2) + f * 0.2, x, y); });
    for (let x = 2; x < 320; x += 6) { if (x > 126 && x < 190) continue; k.R(x, 120, 3, 8, MARMOL[1]); k.R(x + 2, 121, 1, 7, MARMOL[3]); k.R(x, 123, 3, 1, MARMOL[3]); } k.R(0, 117, 128, 3, MARMOL[1]); k.R(0, 117, 128, 1, MARMOL[0]); k.R(192, 117, 128, 3, MARMOL[1]); k.R(192, 117, 128, 1, MARMOL[0]);
    [[120, 128], [196, 128]].forEach(([x, b]) => { k.R(x - 2, b - 34, 2, 34, "#6a6d80"); k.R(x - 3, b - 35, 4, 2, ORO[2]); bandera(k, x, b - 34, 12, 7, "#2f6fa8"); k.elipse(x + 6, b - 31, 2, 2, "#f4f0e4"); });
  }
  O[25] = (n) => ["Ineis Lobby", "La isla sin noche: la Torre de la Justicia, la catarata alrededor y la Puerta de la Justicia", (k) => enies(k, n), { siempre: 14, ven: ["#3f6f9a"], fuego: [], tinte: 0.2, dx: 90 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, espuma, rotulo, humo, bandera, sillares, almenas, cilindro } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, copa, briznas, fronda, sombraE, luces, espejo, bruma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, { rotuloG, flags, CIELO } = window.H18;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const O = window.SitiosIt18.piratas;
  const ORO = ["#fff2b0", "#f4d870", "#d8ac40", "#a8842e", "#7a5e1e"];

  const LE = ["#b8d4d0", "#a4c4c2", "#90b4b4"], CE = ["#d4c4aa", "#b8a88c", "#9a8a70", "#7c6e58", "#5e5444"], SELVA = ["#7ad08a", "#4fb06a", "#2f9a5a", "#237f4a", "#1a5e38"];
  const RJ = ["#f47a5a", "#e05a3e", "#c0392b", "#9a2a20", "#6e1c14"], ORO_T = ["#fff0a0", "#f2d070", "#d8b048", "#b08c34", "#806422"], BL = ["#fffaf0", "#f6ecd8", "#e8dcc0", "#d0c0a0", "#b0a080"];
  const SC = ["#c890f0", "#a868d8", "#8a4fb8", "#6a3596", "#4a2270"];
  function amazon(k, n) {
    const lit = encendido(k), { S, HI } = flags(n);
    k.banda(["#5ac0e0", "#9ae0e8", "#e0f4e0"], 0, 118);
    nubarron(k, 70, 30, 56, 9); nubarron(k, 196, 20, 50, 8); cirros(k, 4, 2, 20);
    const aguja = (x, b, w, a, cols, s, cerca) => { for (let px = x; px < x + w; px++) { const t = (px - x) / w, top = b - a + Math.abs(Math.sin(px * 0.9)) * 4 + Math.abs(t - 0.5) * 22; for (let y = Math.round(top); y < b; y++) { const estrato = cerca && Math.sin(y / 3.1 + px / 9 + fbm(px * 0.1, y * 0.05, s) * 3) > 0.8; k.P(px, y, rampa(cols, Math.abs(t - 0.28) * 1.1 + (estrato ? 0.22 : 0) + (cerca ? (fbm(px * 0.15, y * 0.08, s + 1) - 0.5) * 0.2 : 0), px, y)); } } };
    [[92, 22, 84], [120, 18, 96], [146, 20, 88], [176, 18, 98], [204, 22, 84]].forEach(([x, w, a], i) => aguja(x, 118, w, a, LE, 2600 + i, false));
    k.niebla(50, 110, "#f0fafa", 0.3);
    [[-10, 40, 112], [24, 34, 96], [52, 30, 70], [238, 30, 74], [262, 34, 100], [292, 40, 116]].forEach(([x, w, a], i) => {
      aguja(x, 124, w, a, CE, 2610 + i, true);
      copa(k, x + w / 2, 124 - a + 6, w * 0.42, 7, SELVA, { r: 4, s: 2620 + i }); copa(k, x + w * 0.25, 124 - a + 12, w * 0.24, 5, SELVA, { r: 3, s: 2630 + i }); copa(k, x + w * 0.75, 124 - a + 11, w * 0.24, 5, SELVA, { r: 3, s: 2640 + i });
      for (let j = 0; j < 4; j++) { const lx = x + 5 + j * (w / 4), largo = 16 + hash(i, j, 2650) * 22; trazo(k, [[lx, 124 - a + 12], [lx + 1, 124 - a + 12 + largo * 0.5], [lx - 1, 124 - a + 12 + largo]], (f) => SELVA[f < 0.5 ? 3 : 2], 1); }
    });
    const vents = [];
    if (S) [[2, 124, 22, 14], [26, 122, 20, 12], [50, 124, 18, 11], [252, 124, 18, 11], [272, 122, 20, 12], [294, 124, 24, 14]].forEach(([x, b, w, hh], i) => {
      T.rect(k, x, b - hh, w, hh, (px, py) => rampa(BL, 0.1 + ((px - x) / w) * 0.4 + (py > b - 3 ? 0.3 : 0), px, py)); T.tejadoJ(k, x + w / 2, b - hh + 1, w + 8, 6, RJ, 2660 + i, 2);
      k.elipse(x + w * 0.3, b - hh * 0.55, 2, 2, "#7a3a5a"); k.R(x + w * 0.6, b - 7, 4, 7, "#7a3a5a"); vents.push([x + w * 0.3, b - hh * 0.55]);
      k.R(x + w - 2, b - hh - 1, 1, 3, "#3a2a20"); k.elipse(x + w - 2, b - hh + 3, 1.5, 2, "#e8402a"); vents.push([x + w - 2, b - hh + 3]);
    });
    sillares(k, 84, 112, 152, 16, { base: "#e2d8c8", luz: "#f4ece0", osc: "#bcb09c" }, 4, 12); sillares(k, 100, 98, 120, 14, { base: "#e2d8c8", luz: "#f4ece0", osc: "#bcb09c" }, 4, 12); k.R(84, 111, 152, 2, "#fff8ea"); k.R(100, 97, 120, 2, "#fff8ea");
    for (let x = 86; x < 234; x += 5) { k.R(x, 106, 2, 5, RJ[2]); k.P(x, 106, RJ[0]); } k.R(84, 104, 152, 2, RJ[2]); k.R(84, 104, 152, 1, RJ[0]);
    const piso = (x, y, w, hh, paso, s) => {
      T.rect(k, x, y, w, hh, (px, py) => rampa(BL, 0.08 + ((px - x) / w) * 0.4, px, py));
      for (let cx = x + 4; cx < x + w - 4; cx += paso) { T.rect(k, cx, y, 4, hh, (px, py) => rampa(RJ, 0.1 + (px - cx) * 0.22, px, py)); k.R(cx - 1, y, 6, 2, ORO_T[2]); k.R(cx - 1, y + hh - 2, 6, 2, ORO_T[3]); const dx = cx + 5, dw = paso - 6; if (dx + dw < x + w - 2) { T.rect(k, dx, y + 5, dw, hh - 8, (px, py) => ((px - dx) % 3 === 1 && (py - y) % 3 === 1 ? ORO_T[2] : rampa(["#8a4a6a", "#7a3a5a", "#5e2a46"], (py - y) / hh, px, py))); k.elipse(dx + dw / 2, y + 5, dw / 2, 2, "#7a3a5a"); vents.push([dx + dw / 2, y + hh / 2]); } }
      k.R(x, y + hh - 1, w, 1, ORO_T[3]);
    };
    piso(116, 66, 88, 32, 12, 2670); T.tejadoJ(k, 160, 67, 124, 14, RJ, 2671, 6); k.R(104, 66, 112, 2, ORO_T[1]);
    piso(130, 40, 60, 20, 11, 2672); T.tejadoJ(k, 160, 41, 92, 13, RJ, 2673, 6); k.R(116, 40, 88, 2, ORO_T[1]);
    T.rect(k, 144, 18, 32, 14, (px, py) => rampa(ORO_T, 0.1 + ((px - 144) / 32) * 0.6, px, py)); for (let x = 147; x < 174; x += 6) k.R(x, 21, 3, 9, "#7a3a5a");
    T.tejadoJ(k, 160, 19, 58, 12, ORO_T, 2674, 5);
    k.R(159, -4, 2, 10, ORO_T[3]); esfera(k, 160, 3, 3, 3, ORO_T); [[103, 63], [217, 63], [117, 38], [203, 38]].forEach(([x, y]) => { k.elipse(x, y, 2, 2, ORO_T[1]); k.P(x + (x < 160 ? -2 : 2), y - 2, ORO_T[1]); });
    [[100, 44], [220, 44]].forEach(([x, y]) => { k.R(x, y - 2, 2, 56, "#6a4a30"); esfera(k, x + 1, y - 3, 2, 2, ORO_T); const d = x < 160 ? -1 : 1; for (let i = 0; i < 12; i++) { const o = Math.round(Math.sin(i / 3) * 1); k.R(x + (d < 0 ? -11 : 2) + i, y + 2 + o, 1, 22 - Math.abs(i - 6) * 0.5, i % 4 === 0 ? "#6a2f98" : "#7a3fa8"); } const cx = x + d * 6 + 1; trazo(k, [[cx - 2, y + 8], [cx + 2, y + 10], [cx - 2, y + 14], [cx + 2, y + 17]], ORO_T[1], 1); k.P(cx - 2, y + 7, ORO_T[0]); for (let i = 0; i < 12; i += 2) k.P(x + (d < 0 ? -11 : 2) + i, y + 25 + Math.round(Math.sin(i / 3)), ORO_T[2]); });
    rellena(k, [[-2, 124], [322, 124], [322, 182], [-2, 182]], (x, y) => rampa(["#e8e0d0", "#ddd4c2", "#d0c6b2", "#c2b8a2"], 0.1 + ((y - 124) / 56) * 0.6, x, y)); k.alfa(0.25, () => k.R(0, 127, 320, 3, "#6a5a48"));
    if (HI) { for (let i = 0; i < 3; i++) bola(k, 160, 96 - i * 3, 12 - i * 3, 3, (x, y) => rampa(["#f0e0f8", "#d8c0ea", "#b898d8", "#8a6ab0"], 0.2 + (y - 93 + i * 3) / 6 + (Math.sin(x * 0.8) > 0.6 ? 0.2 : 0), x, y)); trazo(k, [[166, 88], [170, 80], [168, 75]], "#d8c0ea", 3, 2); esfera(k, 168, 73, 3, 2.5, ["#f8f0ff", "#ece0f4", "#d8c8e4"]); k.R(166, 69, 5, 3, "#f4f0e6"); k.P(167, 70, "#26262a"); k.P(169, 70, "#26262a"); k.P(171, 74, "#e8402a"); }
    for (let i = 0; i < 16; i++) { const y = 96 + i * 5.6, a = 16 + i * 4.2; k.R(160 - a, y, 2 * a, 6, i % 2 ? "#efe8da" : "#fff8ea"); k.R(160 - a, y, 2 * a, 1, "#ffffff"); k.R(160 - a, y + 5, 2 * a, 1, "#b0a694"); k.alfa(0.25, () => k.R(160 - a, y + 3, 3, 3, "#8a7a64")); k.alfa(0.25, () => k.R(160 + a - 3, y + 3, 3, 3, "#8a7a64")); }
    const serpiente = (d) => {
      const X = (t) => 160 + d * (82 - 30 * t + Math.sin(t * 5.4) * 13), Y = (t) => 150 - t * 100, R0 = (t) => 9 - t * 4.4;
      [[0, 10], [1, 7]].forEach(([i, a]) => { k.elipse(160 + d * 84, 160 - i * 7, 26 - i * 6, a, SC[3]); k.elipse(160 + d * 84, 158 - i * 7, 25 - i * 6, a - 1, SC[2]); for (let j = 0; j < 9; j++) k.P(160 + d * 84 - 20 + i * 6 + j * 5, 158 - i * 7, ORO[2]); });
      for (let t = 0; t < 1; t += 0.006) { const x = X(t), y = Y(t), r = R0(t), anillo = Math.round(t * 54) % 5; bola(k, x, y, r, r, (px, py) => { const u = ((px - x) * d) / r; if (u < -0.45) return Math.round(t * 108) % 3 === 0 ? "#d8c8a0" : "#f4e8c8"; if (anillo === 0) return u > 0.5 ? ORO[3] : ORO[1]; if (anillo === 1) return ORO[4]; if (Math.sin(px * 1.4 + py * 1.4) > 0.86) return u > 0.4 ? ORO[2] : ORO[0]; return rampa(SC, 0.25 + ((px - x) / r) * 0.3 + ((py - y) / r) * 0.2, px, py); }); }
      const x = X(1) - d * 2, y = Y(1) - 2;
      esfera(k, x - d * 5, y, 12, 8, SC); esfera(k, x + d * 2, y - 3, 8, 6, SC); k.poli([[x - d * 16, y + 1], [x - d * 4, y + 3], [x - d * 4, y + 7], [x - d * 14, y + 5]], "#5a1f4a"); k.poli([[x - d * 14, y + 2], [x - d * 11, y + 2], [x - d * 12, y + 7]], "#ffffff"); k.poli([[x - d * 8, y + 3], [x - d * 5, y + 3], [x - d * 6, y + 8]], "#ffffff");
      k.elipse(x - d * 4, y - 3, 2.5, 2, ORO[1]); k.R(x - d * 4, y - 5, 1, 4, "#26262a"); k.P(x - d * 5, y - 4, "#ffffff"); trazo(k, [[x - d * 9, y - 6], [x - d * 1, y - 6]], SC[4]);
      trazo(k, [[x - d * 16, y + 3], [x - d * 24, y + 5]], "#e8402a"); k.P(x - d * 25, y + 4, "#e8402a"); k.P(x - d * 25, y + 6, "#e8402a");
      [-5, 0, 5].forEach((dx) => k.poli([[x + dx - 2, y - 8], [x + dx + 2, y - 8], [x + dx, y - 14]], ORO[1]));
    };
    serpiente(-1); serpiente(1);
    const L = [];
    [[108, 128], [212, 128]].forEach(([x, b]) => { trazo(k, [[x - 5, b], [x - 2, b - 10]], "#7a5e1e", 1); trazo(k, [[x + 5, b], [x + 2, b - 10]], "#7a5e1e", 1); k.R(x - 1, b - 10, 3, 10, "#a08438"); bola(k, x, b - 12, 7, 3, (px, py) => rampa(ORO, 0.3 + (py - b + 15) / 6, px, py)); fuego(k, x, b - 13, 8, 12, { s: x }); L.push({ x, y: b - 18, r: 30, ry: 22, col: "#ffb45a", f: 0.6 + lit * 0.4 }); });
    if (HI) [[52, 146, 1], [270, 148, -1]].forEach(([x, b, d]) => { sombraE(k, x + 2, b, 9, 2, 0.4); k.R(x - 7, b - 6, 14, 6, "#a8a49c"); k.R(x - 7, b - 6, 14, 1, "#d8d4cc"); const G = ["#c8c4bc", "#aeaaa2", "#94908a", "#7a7670"]; k.R(x - 2, b - 14, 2, 8, G[2]); k.R(x + 1, b - 14, 2, 8, G[3]); rellena(k, [[x - 4, b - 14], [x + 4, b - 14], [x + 5, b - 24], [x - 5, b - 24]], (px, py) => rampa(G, 0.1 + (px - x + 5) / 12, px, py)); esfera(k, x, b - 28, 4, 4, G); trazo(k, [[x - 5, b - 23], [x - 8 * d, b - 32]], G[1], 2); trazo(k, [[x + 5, b - 23], [x + 9 * d, b - 30]], G[2], 2); k.P(x - 1, b - 28, G[3]); k.P(x + 1, b - 28, G[3]); k.R(x - 1, b - 26, 2, 1, G[3]); });
    [[26, 156, 34, 8], [294, 158, 34, 8]].forEach(([x, y, a, b], i) => {
      k.elipse(x, y, a + 2, b + 2, "#b0a694"); bola(k, x, y, a, b, (px, py) => rampa(["#7ad0e8", "#4fb0d0", "#3a92b8", "#2a78a0"], 0.2 + (py - y + b) / (b * 2) * 0.6 + (Math.sin(px * 0.5 + py) > 0.85 ? -0.3 : 0), px, py));
      [[-14, 0], [6, -3], [16, 3], [-4, 4], [-22, -2]].forEach(([dx, dy], j) => { bola(k, x + dx, y + dy, 5, 2, (px, py) => rampa(["#7ac07a", "#4f9a5a", "#3a7a48"], 0.2 + (px - x - dx + 5) / 12, px, py)); k.P(x + dx, y + dy, "#2a5a38"); if (j % 2 === 0) { k.poli([[x + dx - 3, y + dy - 1], [x + dx, y + dy - 6], [x + dx + 3, y + dy - 1]], "#f2a8c0"); k.poli([[x + dx - 1, y + dy - 1], [x + dx, y + dy - 5], [x + dx + 1, y + dy - 1]], "#fcd8e4"); k.P(x + dx, y + dy - 2, "#f8d870"); } });
    });
    const bambu = (x, b, a, s) => { for (let i = 0; i < 3; i++) { const px = x + i * 5; cilindro(k, px, b - a + i * 9, 3, a - i * 9, ["#a8d870", "#7cb850", "#5a9a3a"]); for (let y = b - a + i * 9 + 6; y < b; y += 11) { k.R(px - 1, y, 5, 1, "#3f7a30"); if (hash(px, y, s) > 0.55) fronda(k, px + 2, y, (i % 2 ? 1 : -1) * 0.9, -0.3, 8, ["#a8dc78", "#82c05a", "#5a9a44", "#3e7a34"], { caida: 0.5, foliolo: 1.5, lados: 1 }); } } };
    bambu(0, 150, 60, 2680); bambu(304, 152, 64, 2681); bambu(-4, 180, 54, 2682); bambu(310, 180, 50, 2683);
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, 2684) * 320, y = 132 + hash(i, 2, 2684) * 46; if (x > 70 && x < 250 && y < 172) continue; k.P(x, y, ["#e8402a", "#f2a8c0", "#e8c84a", "#c87ae8"][i % 4]); k.P(x + 1, y, "#fff6c0"); }
    P.palmera(k, 62, 150, 40, { s: 2685, inc: 0.12 }); P.palmera(k, 258, 152, 42, { s: 2686, inc: -0.14 });
    luces(k, [...L, ...vents.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.7 }))]);
  }
  O[26] = (n) => ["Amazon Rose", "La ciudad de las Kuja: el palacio entre agujas de roca, con dos serpientes gigantes guardando la escalera", (k) => amazon(k, n), { tinte: 0.15, ven: VEN, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb43a", "#fff0b0", "#f06a24", "#c8361c"], dx: 86 }];

  const AZUL = ["#7aa8e0", "#4f86c8", "#2f6aa8", "#235488", "#1a3e68"], SILLAR = ["#f4f4f0", "#e2e2de", "#cfcfca", "#b8b8b2", "#9a9a94"];
  function miraneford(k, n) {
    const { h } = Det.cuando(k), lit = encendido(k), { S, HI } = flags(n);
    k.banda(CIELO, 0, 114);
    nubarron(k, -20, 56, 84, 22); nubarron(k, 262, 48, 80, 24);
    const vents = [];
    if (S) [[-2, 104, 26, 34], [22, 104, 22, 26], [42, 104, 16, 20], [262, 104, 16, 20], [276, 104, 22, 28], [296, 104, 26, 38]].forEach(([x, b, w, hh], i) => {
      T.rect(k, x, b - hh, w, hh, (px, py) => rampa(SILLAR, 0.1 + ((px - x) / w) * 0.5, px, py)); T.tejado(k, x, x + w, b - hh - 6, b - hh + 1, ["#84b0e0", "#5c8ccf", "#4070b2", "#2e5490", "#203a6a"], 1100 + i, { vuelo: 2 });
      for (let y = b - hh + 4; y < b - 5; y += 8) for (let vx = x + 3; vx < x + w - 4; vx += 6) { k.R(vx, y, 3, 4, "#3f6f9a"); vents.push([vx + 1, y + 2]); }
    });
    const piso = (x, y, w, hh, s) => {
      T.rect(k, x, y, w, hh, (px, py) => { const c = celdas(px, py, 9, 4, s, 0.3); if (c.borde < 0.08) return SILLAR[3]; return rampa(SILLAR, 0.08 + Math.pow(Math.abs((px - x) / w - 0.32) / 0.68, 1.4) * 0.6 + (c.id - 0.5) * 0.08, px, py); });
      for (let f = 0; f < Math.floor(hh / 13); f++) for (let px = x + 7; px < x + w - 9; px += 13) { T.ventana(k, px, y + 5 + f * 13, 7, 8, { marco: "#6a7484", vidrio: "#3f6f9a", brillo: "#a8c8e8" }); vents.push([px + 3, y + 9 + f * 13]); }
      k.R(x - 2, y + hh - 2, w + 4, 2, SILLAR[3]);
    };
    piso(60, 62, 200, 50, 1101); T.tejadoJ(k, 160, 64, 214, 10, AZUL, 1102, 4);
    piso(90, 34, 140, 30, 1103); T.tejadoJ(k, 160, 36, 154, 10, AZUL, 1104, 4);
    piso(122, 12, 76, 24, 1105); T.tejadoJ(k, 160, 14, 88, 10, AZUL, 1106, 4);
    const ex = 160, ey = 74;
    k.elipse(ex, ey, 14, 12, "#1a3e68"); k.elipse(ex, ey, 12, 10, "#ffffff"); k.elipse(ex, ey, 11, 9, "#f2f6fc");
    [-1, 1].forEach((d) => { trazo(k, [[ex + d * 1, ey + 1], [ex + d * 4, ey - 2], [ex + d * 8, ey - 6], [ex + d * 11, ey - 3]], "#2f5fa8", 2, 1); trazo(k, [[ex + d * 3, ey + 1], [ex + d * 6, ey - 1], [ex + d * 9, ey - 2]], "#2f5fa8", 1); });
    k.elipse(ex, ey + 2, 2, 3, "#2f5fa8"); k.elipse(ex, ey - 2, 2, 2, "#2f5fa8"); k.P(ex, ey - 1, "#e8a040"); trazo(k, [[ex - 3, ey + 6], [ex, ey + 4], [ex + 3, ey + 6]], "#2f5fa8"); trazo(k, [[ex - 6, ey + 8], [ex + 6, ey + 8]], "#2f5fa8");
    k.R(134, 87, 52, 13, "#1a3e68"); k.R(135, 88, 50, 11, "#ffffff"); rotuloG(k, 137, 89, "MARINE", "#2f5fa8", 2);
    sillares(k, 44, 104, 232, 10, { base: "#c8c8c4", luz: "#dcdcd8", osc: "#a4a4a0" }, 4, 13); almenas(k, 44, 104, 232, "#dcdcd8", 8, 5, 3); k.alfa(0.3, () => k.R(44, 112, 232, 2, "#4a4a54"));
    const L = [];
    [56, 104, 216, 264].forEach((x) => { k.R(x, 96, 1, 8, "#3a3a44"); k.R(x - 1, 93, 3, 3, "#ffd27a"); L.push({ x, y: 94, r: 14, ry: 10, col: LUZ, f: lit * 0.8 }); });
    P.mar(k, 112, 150, PAL.MAR, { s: 1107, espejo: false });
    if (lit > 0) [56, 104, 216, 264].forEach((x) => { for (let y = 116; y < 146; y += 3) { const w = 2 + hash(x, y, 1115) * 5; k.alfa(0.7 - (y - 116) / 50, () => k.crudo(x - w / 2 + Math.sin(y) * 1.5, y, w, 1, "#ffe6a0")); } });
    if (HI) [[18, 126, 16, 5], [92, 120, 10, 3], [228, 122, 12, 4], [300, 132, 18, 6], [124, 142, 14, 4], [196, 140, 10, 3]].forEach(([x, y, a, b]) => { bola(k, x, y, a, b, (px, py) => (py < y ? rampa(["#ffffff", "#eef8fc", "#d4ecf6"], (py - y + b) / b * 0.6, px, py) : rampa(["#bfe2f2", "#8ac4e0", "#5aa0c8"], (py - y) / b, px, py))); k.alfa(0.35, () => k.elipse(x, y + b + 1, a, 1.5, "#1a4a7a")); });
    const buque = (x, y, d, e, s) => {
      rellena(k, [[x - 26 * e, y], [x + 26 * e, y], [x + 20 * e * d + 6 * e * (d > 0 ? 0 : 0), y + 10 * e], [x - 20 * e, y + 10 * e]], (px, py) => rampa(["#ffffff", "#f0f0ec", "#d8d8d2", "#b8b8b0"], (py - y) / (10 * e) + (px - x) / (60 * e), px, py));
      k.R(x - 26 * e, y + 2, 52 * e, 2, "#2f5fa8"); for (let px = x - 20 * e; px < x + 20 * e; px += 6) k.R(px, y + 5, 2, 2, "#1a1e26");
      const proa = x + d * 26 * e; trazo(k, [[proa, y], [proa + d * 5 * e, y - 4 * e]], "#f4f4f0", 2); k.P(proa + d * 5 * e, y - 5 * e, "#e8a040");
      [-9, 7].forEach((dx, m) => { const mx = x + dx * e; k.R(mx, y - 31 * e, 2, 31 * e, "#6d4628"); [[y - 28 * e, 12 * e, 10 * e], [y - 16 * e, 15 * e, 12 * e]].forEach(([vy, w, a]) => { k.R(mx - w / 2 - 1, vy - 1, w + 4, 1, "#5a3a22"); rellena(k, [[mx - w / 2, vy], [mx + w / 2 + 2, vy], [mx + w / 2 + 3, vy + a], [mx - w / 2 - 1, vy + a]], (px, py) => rampa(["#ffffff", "#f2f2ee", "#dedad2", "#c4c0b6"], 0.05 + ((px - mx + w / 2) / (w + 3)) * 0.5 + ((py - vy) / a) * 0.2, px, py)); trazo(k, [[mx - 3 * e, vy + a * 0.55], [mx + 1, vy + a * 0.35], [mx + 5 * e, vy + a * 0.55]], "#2f5fa8"); }); k.R(mx - 1, y - 34 * e, 5, 3, "#2f5fa8"); });
      k.alfa(0.4, () => k.elipse(x, y + 11 * e, 28 * e, 2, "#1a4a7a")); espuma(k, Math.round(y + 10 * e), x - 30 * e, x + 30 * e, "#e8f4fa");
    };
    buque(58, 124, 1, 1, 1108); buque(262, 128, -1, 1, 1109);
    if (S) { buque(118, 116, 1, 0.55, 1110); buque(206, 118, -1, 0.6, 1111); }
    espuma(k, 148, 0, 320, "#e8f4fa");
    sillares(k, 0, 150, 320, 30, { base: "#cec6b2", luz: "#e2dccc", osc: "#aea590" }, 7, 23); k.R(0, 150, 320, 3, "#ece6d6"); k.R(0, 153, 320, 1, "#9a927e");
    k.alfa(0.16, () => { for (let y = 160; y < 180; y += 2) k.R(0, y, 320, 2, "#5a5446"); });
    [[36, 1], [96, 1], [224, -1], [284, -1]].forEach(([x, d]) => { sombraE(k, x + 2, 158, 5, 1.5, 0.4); k.R(x - 3, 150, 7, 7, "#3a3a44"); k.R(x - 4, 148, 9, 3, "#4a4a54"); k.R(x - 3, 148, 7, 1, "#6a6a76"); trazo(k, [[x + 4 * d, 151], [x + 14 * d, 147], [x + 22 * d, 149]], "#c8b080", 1); });
    [70, 128, 192, 250].forEach((x) => { k.elipse(x, 152, 2, 2, "#5a5a66"); k.P(x, 152, "#cec6b2"); });
    const A = { base: "#bcb4a2", luz: "#d4ccba", osc: "#9a927e" };
    sillares(k, 104, 156, 112, 8, A, 4, 14); k.R(104, 156, 112, 1, "#e2dccc"); sillares(k, 112, 144, 96, 12, A, 4, 12); k.R(112, 144, 96, 1, "#e2dccc"); k.alfa(0.3, () => k.R(112, 154, 96, 2, "#3a3426"));
    [[124, -1], [196, 1]].forEach(([x]) => { T.rect(k, x - 3, 110, 6, 34, (px, py) => rampa(["#d0503a", "#b0402e", "#8a3022", "#6a2418"], 0.1 + (px - x + 3) / 7, px, py)); k.R(x - 4, 140, 8, 4, "#3a3a44"); });
    T.rect(k, 112, 108, 96, 4, madera(PAL.MAD_O, { paso: 2, largo: 99, s: 1112 })); T.tejadoJ(k, 160, 108, 112, 8, ["#6a7484", "#4e5868", "#3a4250", "#2a303c", "#1c2028"], 1113, 4);
    k.R(159, 112, 2, 4, "#3a3a44");
    rellena(k, [[154, 116], [166, 116], [170, 122], [172, 134], [176, 140], [144, 140], [148, 134], [150, 122]], (x, y) => rampa(["#d8b070", "#b8904a", "#8e6a32", "#6a4c22", "#4a3416"], 0.15 + Math.pow(Math.abs((x - 154) / 18), 1.2) * 0.75 + ((y === 124 || y === 132) ? 0.25 : 0), x, y));
    for (let i = 0; i < 3; i++) for (let j = 0; j < 4; j++) k.P(152 + j * 5, 126 + i * 3, "#6a4c22"); bola(k, 160, 140, 16, 2, (x, y) => rampa(["#b8904a", "#8e6a32", "#6a4c22"], (y - 138) / 4, x, y)); k.crudo(151, 120, 1, 6, "#fff2b0");
    trazo(k, [[182, 112], [182, 122]], "#c8b080"); trazo(k, [[198, 112], [198, 122]], "#c8b080"); T.rect(k, 178, 122, 24, 5, madera(["#a87444", "#8a5a32", "#6e4424", "#54321a", "#3a2210"], { paso: 2, largo: 99, s: 1114 })); k.elipse(178, 124, 2, 2, "#c0895a");
    if (HI) [[134, 148], [144, 150], [176, 149], [186, 147]].forEach(([x, y], i) => { trazo(k, [[x, y + 6], [x + 1, y]], "#4a8a3a"); k.elipse(x + 1, y, 2, 2, ["#e8402a", "#ffffff", "#f2c84b", "#e86aa8"][i]); k.P(x + 1, y, "#fff6c0"); });
    T.canon(k, 22, 162, 1, 0.9); T.canon(k, 298, 162, -1, 0.9);
    [[10, 150], [310, 150]].forEach(([x, b]) => { k.R(x, b - 36, 2, 36, "#5a5a66"); rellena(k, [[x + (x < 160 ? 2 : -14), b - 36], [x + (x < 160 ? 16 : 0), b - 35], [x + (x < 160 ? 16 : 0), b - 26], [x + (x < 160 ? 2 : -14), b - 27]], () => "#f4f4f0"); const cx = x + (x < 160 ? 9 : -7); trazo(k, [[cx - 4, b - 31], [cx, b - 33], [cx + 4, b - 31]], "#2f5fa8"); k.P(cx, b - 30, "#2f5fa8"); });
    if (HI) {
      const g = [[-2, 176], [30, 170], [52, 174], [80, 166], [98, 170]], g2 = [[322, 172], [292, 168], [270, 174], [244, 166], [222, 170]];
      [g, g2].forEach((gg) => gg.forEach((p, i) => { if (i) { trazo(k, [gg[i - 1], p], "#1a1820", 3, 2); trazo(k, [[gg[i - 1][0], gg[i - 1][1] - 2], [p[0], p[1] - 2]], "#efe8d8"); } }));
      [[60, 162, 5], [256, 160, 6], [100, 176, 4]].forEach(([x, y, r]) => { k.roca(x - r, y, r * 2, r * 1.4, "#b8b0a0", "#d4ccba", "#8e8676"); });
      if (h === 23) [[70, 170], [250, 168]].forEach(([x, y]) => { k.elipse(x, y, 10, 2, "#8a2418"); fuego(k, x, y, 10, 12, { s: x }); L.push({ x, y: y - 6, r: 26, ry: 18, col: "#ffa04a", f: 1 }); });
    }
    luces(k, [...L, ...vents.map(([x, y]) => ({ x, y, r: 8, ry: 6, col: LUZ, f: lit * 0.6 }))]);
  }
  O[11] = (n) => ["Miraneford", "El cuartel de la Marina, en su bahía", (k) => miraneford(k, n), { ven: ["#3f6f9a", "#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#8a2418", "#ffb43a", "#fff0b0", "#f06a24", "#c8361c", "#7a1e14"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, rotulo, humo, bandera, cilindro, montana, camino } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, copa, arbol, briznas, fronda, sombraE, luces, bruma, fuego, encendido, bezier } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, { rotuloG, flags } = window.H18;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const O = window.SitiosIt18.piratas;

  const FRESA = ["#ff7a70", "#e8403a", "#c02a26", "#8a1c1a"], NATA = ["#ffffff", "#fff4ee", "#f6e0d6", "#e2c8bc"];
  function wholeCake(k, n) {
    const lit = encendido(k), { S, HI } = flags(n);
    k.banda(["#f2a8c8", "#f8c8d8", "#fde8e0"], 0, 116);
    const RS = ["#ffffff", "#fff0f6", "#fcd8e4"];
    nubarron(k, -20, 44, 96, 18, RS); nubarron(k, 244, 36, 96, 20, RS);
    const vents = [];
    if (S) [[50, 60, 15, "#f8b8d8"], [8, 66, 13, "#c8f0c8"], [270, 60, 15, "#f8e0a0"], [312, 66, 13, "#b8e0f8"]].forEach(([x, y, r, c], i) => {
      rellena(k, [[x - 3, 126], [x - 2, y + r * 0.6], [x + 2, y + r * 0.6], [x + 3, 126]], (px, py) => ((py + px) % 5 === 0 ? "#a86a3a" : rampa(["#d8985a", "#c07e44", "#a06630"], (px - x + 3) / 7, px, py)));
      bola(k, x, y, r, r * 0.8, (px, py) => rampa(["#ffffff", c, mezcla(c, "#a06080", 0.25), mezcla(c, "#80406a", 0.4)], 0.1 + ((px - x) + (py - y)) / (r * 3) + (fbm(px * 0.2, py * 0.2, 3000 + i) - 0.5) * 0.3, px, py));
      k.R(x - 5, y - 1, 3, 3, "#3a2030"); k.R(x + 3, y - 1, 3, 3, "#3a2030"); k.P(x - 4, y - 1, "#ffffff"); k.P(x + 4, y - 1, "#ffffff"); trazo(k, [[x - 4, y + 4], [x, y + 6], [x + 4, y + 4]], "#3a2030"); k.R(x - 8, y + 2, 2, 1, "#f27aa0"); k.R(x + 7, y + 2, 2, 1, "#f27aa0");
    });
    const piso = (cx, y, w, hh, cols, s) => {
      cilindro(k, cx - w / 2, y, w, hh, cols, 0.28);
      for (let i = 0; i < (w * hh) / 30; i++) { const px = cx - w / 2 + 2 + hash(i, 1, s) * (w - 4), py = y + 4 + hash(i, 2, s) * (hh - 6); k.P(px, py, hash(i, 3, s) > 0.5 ? mezcla(cols[0], "#ffffff", 0.4) : cols[2]); }
      for (let vx = cx - w / 2 + 7; vx < cx + w / 2 - 9; vx += 13) { T.ventana(k, vx, y + hh * 0.42, 6, hh * 0.38, { arco: true, marco: cols[3], vidrio: "#ffe6a0", brillo: "#ffffff", cruz: false }); vents.push([vx + 3, y + hh * 0.6]); }
      for (let x = cx - w / 2 + 2; x < cx + w / 2 - 1; x += 5) { esfera(k, x, y + hh - 1, 2.5, 2, NATA); k.P(x - 1, y + hh - 2, "#ffffff"); }
      k.elipse(cx, y, w / 2, 3, NATA[0]); for (let x = cx - w / 2; x <= cx + w / 2; x++) { const d = 3 + Math.abs(Math.sin(x / 3.6 + y)) * 5 + (Math.sin(x / 7 + y) > 0.7 ? 5 : 0); k.R(x, y, 1, d, x > cx + w * 0.28 ? NATA[2] : NATA[0]); k.P(x, y + d, NATA[3]); if (Math.sin(x / 7 + y) > 0.7) k.P(x, y + d - 1, "#ffffff"); }
    };
    piso(160, 96, 136, 30, ["#ecc28a", "#dcaa76", "#bc8a58", "#8e623c"], 3010); piso(160, 68, 106, 28, ["#fde0ea", "#f4cede", "#dca6be", "#ac6e8c"], 3011); piso(160, 44, 78, 24, ["#fca6bc", "#ec80a0", "#c45e80", "#8e3e5e"], 3012); piso(160, 24, 50, 20, ["#fff4d6", "#f8e2b4", "#dcbc86", "#ac885e"], 3013);
    const fresa = (x, y, r) => { esfera(k, x, y, r, r, FRESA); for (let i = 0; i < r * 2.4; i++) k.P(x - r * 0.7 + hash(i, x, 3014) * r * 1.4, y - r * 0.5 + hash(i, y, 3015) * r * 1.2, "#ffe08a"); k.poli([[x - r * 0.8, y - r * 0.8], [x, y - r * 0.5], [x + r * 0.8, y - r * 0.8], [x, y - r * 1.3]], "#3f8a3a"); k.P(x - r * 0.3, y - r * 0.3, "#ffd0c8"); };
    [[116, 94, 4], [142, 92, 4], [178, 92, 4], [204, 94, 4], [132, 66, 4], [188, 66, 4], [146, 42, 3], [174, 42, 3]].forEach(([x, y, r]) => fresa(x, y, r));
    fresa(160, 15, 11); k.R(157, 1, 7, 3, "#3f8a3a");
    [[132, 22], [188, 22]].forEach(([x, y]) => { for (let i = 0; i < 12; i++) k.R(x - 1, y - 10 + i, 3, 1, Math.floor(i / 2) % 2 ? "#e85a8a" : "#fff0f6"); k.R(x + 1, y - 10, 1, 12, "#d8b0c0"); k.P(x - 2, y - 7, "#fff0f6"); k.llama(x, y - 10, 0.28); });
    k.elipse(160, 112, 16, 15, NATA[1]); k.R(144, 112, 32, 14, NATA[1]); k.elipse(160, 112, 14, 13, "#5a2e20"); k.R(146, 112, 28, 14, "#5a2e20");
    for (let y = 102; y < 126; y += 6) for (let x = 147; x < 173; x += 7) { if (Math.hypot(x + 3 - 160, y - 112) > 13 && y < 112) continue; k.R(x, y, 6, 5, "#7a4430"); k.R(x, y, 6, 1, "#9a5a40"); }
    k.R(159, 99, 2, 27, "#3a1e14"); k.elipse(156, 116, 1, 1, "#f2c84b"); k.elipse(164, 116, 1, 1, "#f2c84b");
    const piruleta = (x, b, r, c) => { k.R(x - 1, b - r * 4, 3, r * 4, "#f4efe0"); k.R(x + 1, b - r * 4, 1, r * 4, "#d8cdb4"); for (let a = 0; a < 30; a += 0.12) { const e = (a / 30) * r * 1.9, px = x + Math.cos(a) * e, py = b - r * 4 - r * 1.2 + Math.sin(a) * e; k.R(px, py, 2, 2, Math.round(a) % 2 ? c : "#ffe0ec"); } k.alfa(0.8, () => { k.R(x - r * 0.9, b - r * 6.4, 3, 2, "#ffffff"); k.P(x - r * 0.9 + 4, b - r * 6.6, "#ffffff"); }); bandera(k, x + 1, b - r * 4 + 2, 0, 0, c); };
    piruleta(30, 126, 9, "#e85a8a"); piruleta(70, 128, 7, "#5ac0d8"); piruleta(250, 128, 7, "#f2a23a"); piruleta(290, 126, 9, "#a87ae8");
    [[8, 116, 18, "#f8b8d8"], [100, 118, 12, "#b8e0f8"], [226, 118, 12, "#f8e0a0"], [312, 116, 18, "#c8f0c8"]].forEach(([x, y, r, c], i) => { k.R(x - 2, y, 4, 14, "#c88a5a"); k.R(x + 1, y, 1, 14, "#a86a3a"); bola(k, x, y - 4, r, r * 0.8, (px, py) => rampa(["#ffffff", c, mezcla(c, "#a06080", 0.2)], 0.1 + ((px - x) + (py - y + 4)) / (r * 3) + (fbm(px * 0.25, py * 0.25, 3020 + i) - 0.5) * 0.4, px, py)); });
    rellena(k, [[-2, 126], [322, 126], [322, 182], [-2, 182]], (x, y) => rampa(["#fcecc8", "#f6e0b6", "#eed2a2", "#e2c290"], 0.1 + ((y - 126) / 56) * 0.6, x, y)); k.alfa(0.35, () => k.R(0, 127, 320, 2, "#c8a078"));
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 3021) * 320, y = 130 + hash(i, 2, 3021) * 48; k.P(x, y, "#d8b080"); }
    k.poli([[-4, 148], [60, 140], [104, 146], [84, 160], [-4, 170]], "#f2a23a"); k.poli([[-4, 150], [58, 143], [92, 148], [76, 158], [-4, 166]], "#f8c04a"); k.R(14, 150, 22, 1, "#ffe08a"); k.R(40, 146, 18, 1, "#ffe08a"); k.R(8, 158, 14, 1, "#ffe08a"); k.alfa(0.5, () => k.R(30, 154, 10, 1, "#ffffff"));
    if (S) { rellena(k, [[30, 160], [44, 140], [52, 140], [42, 162]], (x, y) => ((y % 4 === 0) ? "#b87a4a" : "#e0a870")); [[31, 158], [37, 150], [43, 142]].forEach(([x, y]) => k.P(x + 4, y, "#7a4430")); }
    camino(k, 126, 180, (f) => 160 + Math.sin(f * 3) * f * 10, (f) => 10 + f * 22, "#c88a5a", "#e0a870", "#b87a4a");
    for (let y = 132; y < 180; y += 9) { const f = (y - 126) / 54, c = 160 + Math.sin(f * 3) * f * 10, a = 10 + f * 22; for (let x = c - a + 3; x < c + a - 3; x += 7 + f * 4) { k.R(x, y, 2, 2, "#6a3a24"); k.P(x, y, "#8a5a3a"); } k.R(c - a, y + 4, 2 * a, 1, "#b87a4a"); }
    if (S) for (let i = 0; i < 6; i++) { const y = 132 + i * 8, f = (y - 126) / 54, c = 160 + Math.sin(f * 3) * f * 10, a = 10 + f * 22 + 6; [-1, 1].forEach((d) => { const x = c + d * a; for (let j = 0; j < 10; j++) k.P(x, y - j, Math.floor(j / 2) % 2 ? "#e8402a" : "#ffffff"); k.P(x + d, y - 10, "#e8402a"); k.P(x + d * 2, y - 9, "#ffffff"); }); }
    if (HI) [[118, 142], [202, 142]].forEach(([x, b], i) => {
      sombraE(k, x, b + 9, 24, 2, 0.35); k.R(x - 22, b, 44, 3, "#ffffff"); rellena(k, [[x - 23, b + 3], [x + 23, b + 3], [x + 24, b + 9], [x - 24, b + 9]], (px, py) => ((px - x) % 6 === 0 ? "#ecdcd8" : "#fff6f4")); for (let px = x - 22; px < x + 24; px += 4) k.P(px, b + 9, "#f2a8c8");
      [[-14, 3], [12, 2]].forEach(([dx, pisos]) => { for (let p = 0; p < pisos; p++) { const w = 10 - p * 3; k.R(x + dx - w / 2, b - 4 - p * 4, w, 4, p % 2 ? "#fde0ea" : "#ecc28a"); k.R(x + dx - w / 2, b - 4 - p * 4, w, 1, "#ffffff"); } k.P(x + dx, b - 5 - pisos * 4, "#e8402a"); });
      esfera(k, x, b - 3, 4, 3, ["#ffffff", "#e8eef6", "#c8d4e4"]); trazo(k, [[x + 4, b - 4], [x + 7, b - 6]], "#c8d4e4"); k.R(x - 1, b - 7, 2, 1, "#c8d4e4");
      [[-6, 0], [6, 0]].forEach(([dx]) => { k.R(x + dx - 1, b - 2, 3, 2, "#ffffff"); k.P(x + dx + 2, b - 2, "#e8b8c8"); });
    });
    [[64, 158], [250, 152], [286, 172], [108, 172]].forEach(([x, y]) => { k.poli([[x - 7, y], [x + 7, y], [x, y + 16]], "#d8a860"); for (let i = 0; i < 4; i++) { trazo(k, [[x - 6 + i * 4, y + 1], [x + 5 - i * 3, y + 10]], "#b88a48"); trazo(k, [[x + 6 - i * 4, y + 1], [x - 5 + i * 3, y + 10]], "#c89a58"); } esfera(k, x, y - 3, 8, 7, ["#ffffff", "#fff0f4", "#f8c8d8"]); esfera(k, x + 1, y - 8, 4, 4, ["#f8c8d8", "#f2a8c8", "#d87a9a"]); fresa(x + 2, y - 12, 2); });
    [[120, 152, 12], [216, 156, 14], [24, 174, 16]].forEach(([x, y, r]) => { if (HI && Math.abs(x - 160) < 70 && y < 160) return; k.elipse(x, y + 2, r, 4, "#6a3a24"); k.elipse(x, y, r, 4, "#8a5a38"); k.elipse(x, y - 1, r - 3, 2, "#a86a48"); k.R(x - r * 0.4, y - 1, r * 0.3, 1, "#c88a68"); });
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, 3022) * 320, y = 130 + hash(i, 2, 3022) * 48; k.R(x, y, 2, 1, ["#e85a8a", "#5ac0d8", "#f2c84b", "#7cc860"][i % 4]); }
    luces(k, vents.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.7 })));
  }
  O[30] = (n) => ["Cupcake Island", "El castillo pastel de Big Mum, entre bosques de dulces", (k) => wholeCake(k, n), { tinte: 0.5, ven: ["#ffd27a", "#ffe6a0"], dx: 76 }];

  const TEJA_N = ["#7a8494", "#5e6878", "#46505e", "#323a46", "#20262e"], SAK = ["#fff0f6", "#fcd2e2", "#f4aac6", "#e084a8", "#b85c84"], ROJO_T = ["#f06a50", "#d84a36", "#b8362a", "#8a2820", "#5e1a14"];
  function wona(k, n) {
    const lit = encendido(k), { S, HI } = flags(n);
    k.banda(["#f2a8b8", "#f8c4c8", "#fde0d4", "#fff0dc"], 0, 112);
    const NU = ["#fff4f4", "#fbdcdc", "#eeb8c0"];
    nubarron(k, -20, 46, 80, 14, NU); nubarron(k, 250, 56, 90, 14, NU);
    montana(k, 160, 110, 230, 92, { roca: ["#9a88a8", "#7a6a8a", "#5f5270", "#4a4058"], nieve: ["#ffffff", "#e4dcec"], hasta: 0.3, rugosa: 0.4 });
    nubarron(k, 70, 78, 60, 7, NU); nubarron(k, 194, 84, 60, 6, NU);
    const vents = [];
    if (S) { [[0, 104, 26], [22, 100, 24], [44, 104, 22], [210, 104, 22], [230, 100, 24], [252, 104, 26], [276, 102, 24], [298, 104, 24]].forEach(([x, b, w], i) => { T.rect(k, x, b - 10, w, 10, (px, py) => rampa(["#fbf3e6", "#efe2cc", "#d0c0a4"], (px - x) / w, px, py)); T.tejadoJ(k, x + w / 2, b - 9, w + 8, 6, TEJA_N, 1200 + i, 2); k.R(x + 4, b - 7, 4, 4, "#3a4a5a"); k.R(x + w - 9, b - 7, 4, 4, "#3a4a5a"); vents.push([x + 6, b - 5]); }); for (let i = 0; i < 2; i++) { const [x0, x1] = i ? [214, 318] : [2, 108]; for (let j = 0; j <= 8; j++) { const x = x0 + (x1 - x0) * (j / 8), y = 88 + Math.sin((j / 8) * Math.PI) * 4; k.P(x, y, "#3a2a20"); if (j % 2) { k.elipse(x, y + 2, 1.5, 2, "#e8402a"); vents.push([x, y + 2]); } } } }
    const B = ["#fbf3e6", "#efe2cc", "#d0c0a4"];
    rellena(k, [[140, 108], [143, 96], [177, 96], [180, 108]], piedra(["#c8bca8", "#b0a490", "#988c78", "#807462", "#665c4e"], { tx: 6, ty: 3, s: 1210 }));
    [[112, 100], [196, 100]].forEach(([x, b], i) => { T.rect(k, x, b - 14, 24, 14, (px, py) => rampa(B, ((px - x) / 24) * 0.8, px, py)); for (let px = x + 3; px < x + 21; px += 5) k.R(px, b - 10, 2, 4, "#3a4a5a"); T.tejadoJ(k, x + 12, b - 13, 36, 8, TEJA_N, 1211 + i, 3); });
    cilindro(k, 146, 74, 28, 22, B); T.tejadoJ(k, 160, 76, 46, 10, TEJA_N, 1213, 4); cilindro(k, 150, 56, 20, 19, B); T.tejadoJ(k, 160, 58, 34, 9, TEJA_N, 1214, 4);
    for (let x = 150; x < 170; x += 7) { k.R(x, 82, 4, 8, "#3a4a5a"); k.R(x, 82, 4, 1, "#d0c0a4"); } for (let x = 153; x < 168; x += 6) k.R(x, 62, 3, 6, "#3a4a5a");
    [[137, 72], [183, 72], [143, 54], [177, 54]].forEach(([x, y]) => { k.R(x - 1, y - 3, 3, 3, "#e8c35a"); k.P(x + (x < 160 ? -1 : 2), y - 4, "#e8c35a"); });
    T.prado(k, 110, ["#a8d488", "#8cc070", "#74a858", "#5e9048", "#4a7838", "#38602a"], 1215, { flores: { n: 24, cols: ["#fcd2e2", "#ffffff"] } });
    rellena(k, [[-4, 124], [36, 112], [52, 112], [-4, 140]], (x, y) => rampa(["#9ad4ec", "#6fb4d8", "#4f98c4"], 0.2 + (y - 112) / 30 + (Math.sin(x * 0.6 + y) > 0.85 ? -0.3 : 0), x, y));
    trazo(k, bezier([4, 128], [12, 118], [26, 114], [36, 116], 14), ROJO_T[2], 3); trazo(k, bezier([4, 126], [12, 116], [26, 112], [36, 114], 14), ROJO_T[0], 1); [[8, 122], [16, 118], [24, 116], [32, 116]].forEach(([x, y]) => k.R(x, y - 4, 1, 4, ROJO_T[3]));
    for (let i = 0; i < 14; i++) { const y = 176 - i * 5.2, a = 44 - i * 2.2; T.rect(k, 160 - a, y, 2 * a, 5, (px, py) => rampa(["#e4dccc", "#d8cfba", "#c8bea8", "#a89e88"], 0.1 + (py - y) / 6 + (fbm(px * 0.3, py * 0.5, 1216) - 0.5) * 0.3, px, py)); k.R(160 - a, y, 2 * a, 1, "#f0e8d8"); k.R(160 - a, y + 4, 2 * a, 1, "#8e8470"); for (let j = 0; j < 3; j++) { const mx = 160 - a + hash(i, j, 1217) * 2 * a; k.P(mx, y + 4, "#7a9a5a"); k.P(mx + 1, y + 4, "#5a7a42"); } }
    [[128], [183]].forEach(([x]) => { T.rect(k, x, 64, 9, 62, (px, py) => rampa(ROJO_T, 0.1 + ((px - x) / 9) * 0.8, px, py)); k.R(x - 1, 118, 11, 8, "#26262a"); k.R(x - 1, 118, 11, 1, "#4a4a54"); });
    T.rect(k, 118, 70, 84, 5, (px, py) => rampa(ROJO_T, 0.1 + (py - 70) / 6, px, py)); k.R(118, 70, 84, 1, ROJO_T[0]);
    for (let x = 108; x <= 212; x++) { const u = Math.abs(x - 160) / 52, y = 52 + Math.pow(u, 3) * -5; k.R(x, y, 1, 4, "#26262a"); k.P(x, y, "#4a4a54"); k.R(x, y + 4, 1, 4, ROJO_T[2]); k.P(x, y + 7, ROJO_T[3]); }
    k.R(153, 57, 14, 16, "#26262a"); k.R(154, 58, 12, 14, "#1a1a20"); k.R(153, 57, 14, 1, "#e8c35a"); k.R(153, 72, 14, 1, "#e8c35a");
    const G = "#e8c35a"; trazo(k, [[156, 60], [158, 59]], G); trazo(k, [[155, 62], [159, 62]], G); trazo(k, [[157, 60], [157, 70]], G); trazo(k, [[157, 64], [155, 68]], G); trazo(k, [[157, 64], [159, 67]], G); k.R(161, 63, 4, 1, G); k.R(161, 63, 1, 5, G); k.R(164, 63, 1, 5, G); k.R(161, 67, 4, 1, G);
    [[108, 142], [212, 142], [92, 164], [228, 164]].forEach(([x, b], i) => { const ST = ["#c8bea8", "#a89e88", "#8e8470", "#6e6656"]; k.R(x - 2, b - 12, 4, 12, ST[1]); k.R(x - 1, b - 12, 1, 12, ST[0]); k.R(x - 5, b - 13, 10, 2, ST[2]); k.R(x - 3, b - 19, 6, 6, ST[1]); k.R(x - 2, b - 18, 4, 4, "#ffd27a"); k.R(x - 1, b - 18, 1, 4, ST[2]); k.R(x - 4, b - 20, 8, 1, ST[2]); k.poli([[x - 6, b - 20], [x + 6, b - 20], [x, b - 25]], ST[2]); k.P(x, b - 26, ST[1]); sombraE(k, x, b, 6, 1.5, 0.35); vents.push([x, b - 16]); });
    const casaW = (x, b, w, hh, s) => { T.rect(k, x, b - hh, w, hh, madera(["#d0ae80", "#b8966a", "#9a7a50", "#7a5e3a", "#5a4228"], { paso: 3, vertical: true, largo: 99, s })); T.rect(k, x + 3, b - hh + 3, w - 6, hh - 9, (px, py) => ((px - x) % 3 === 0 || (py - b) % 3 === 0 ? "#8a6a44" : "#f4ead4")); vents.push([x + w / 2, b - hh + 6]); T.tejadoJ(k, x + w / 2, b - hh + 1, w + 12, 9, TEJA_N, s + 1, 3); k.R(x + w / 2 - 6, b - 7, 12, 7, "#3a2a20"); for (let i = 0; i < 3; i++) k.R(x + w / 2 - 6 + i * 4, b - 7, 3, 5, i % 2 ? "#f4f0e6" : "#2f4f8a"); };
    casaW(58, 120, 40, 18, 1220); casaW(226, 120, 42, 18, 1222);
    if (HI) { [[100, 150], [220, 150], [84, 172], [236, 172]].forEach(([x, b], i) => { k.R(x, b - 34, 1, 34, "#3a2a20"); k.R(x + 1, b - 34, 7, 1, "#3a2a20"); rellena(k, [[x + 1, b - 33], [x + 8, b - 33], [x + 8, b - 12], [x + 1, b - 12]], (px, py) => ((py - b) % 6 === 0 ? "#f4f0e6" : i % 2 ? "#7a3fa8" : "#c0392b")); k.elipse(x + 4.5, b - 27, 2, 2, "#f4f0e6"); k.P(x + 4, b - 27, "#e8c35a"); });
      [[30, 128], [42, 128], [36, 121]].forEach(([x, b]) => { sombraE(k, x, b, 6, 1.5, 0.3); T.rect(k, x - 5, b - 9, 10, 9, (px, py) => ((px + py) % 3 === 0 ? "#c8b890" : "#e8dcc0")); k.R(x - 5, b - 9, 10, 1, "#a89870"); k.R(x - 3, b - 7, 6, 4, "#c0392b"); k.P(x - 1, b - 6, "#f4f0e6"); }); }
    const rosa = { tronco: "#5b3a24", copa: "#f2a8c0", borde: "#d87a9a", luz: "#fcd0dc", osc: "#e890ac" };
    [[24, 138, 3], [296, 142, 3.2], [84, 132, 1.5], [244, 134, 1.4]].forEach(([x, b, t], i) => { k.arbolote(x, b, t, rosa); for (let j = 0; j < 40 * t; j++) { const px = x + (hash(i, j, 1224) - 0.5) * 26 * t, py = b - 13 * t - 6 * t + (hash(i, j, 1225) - 0.5) * 14 * t; k.P(px, py, hash(i, j, 1226) > 0.5 ? "#ffffff" : "#fcd0dc"); } });
    k.alfa(0.5, () => { k.elipse(24, 160, 40, 6, "#f2a8c0"); k.elipse(296, 164, 44, 6, "#f2a8c0"); });
    if (HI) [[30, 104, 124, 96], [196, 96, 290, 104]].forEach(([x0, y0, x1, y1]) => { for (let i = 0; i <= 60; i++) { const t = i / 60, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 7; k.P(x, y, "#2a2018"); if (i % 10 === 5) { k.elipse(x, y + 3, 2, 3, i % 20 === 5 ? "#e8402a" : "#f4f0e6"); k.R(x - 1, y + 1, 3, 1, "#2a2018"); vents.push([x, y + 3]); } } });
    for (let i = 0; i < 80; i++) { const x = hash(i, 1, 1227) * 320, y = 40 + hash(i, 2, 1227) * 138; k.R(x, y, 2, 1, i % 2 ? "#fcd0dc" : "#f2a8c0"); }
    luces(k, vents.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  O[12] = (n) => ["El país de Wona", "Cerezos, un torii rojo y la gran montaña", (k) => wona(k, n), { tinte: 0.8, ven: ["#ffd27a", "#f4ead4"], fuego: [] }];

  const ME = ["#eef4f8", "#d0dae2", "#aebac4", "#8a96a2", "#6a7682"], NEON = ["#d8fbff", "#7ae8ff", "#3ac0e8", "#2a8ab8"];
  function eggbrain(k, n) {
    const lit = encendido(k), { S, HI } = flags(n);
    k.banda(["#3a8ae0", "#7ac0f0", "#c8ecf8"], 0, 118);
    nubarron(k, -24, 58, 92, 20); nubarron(k, 254, 50, 92, 22);
    if (S) {
      [[4, 96, 10, 0], [56, 90, 8, 1], [84, 100, 12, 0], [224, 98, 10, 1], [252, 92, 8, 0], [300, 96, 12, 1]].forEach(([x, top, w, cup]) => { T.rect(k, x, top, w, 126 - top, (px, py) => rampa(ME, 0.15 + (px - x) / w * 0.6, px, py)); if (cup) bola(k, x + w / 2, top, w / 2 + 2, 5, (px, py) => (py > top ? null : rampa(["#bff4ff", "#7ae8ff", "#3ac0e8"], (px - x) / w, px, py))); else { k.R(x + w / 2, top - 10, 1, 10, ME[3]); k.crudo(x + w / 2, top - 11, 1, 1, "#e8402a"); } for (let y = top + 4; y < 120; y += 6) k.R(x + 2, y, w - 4, 1, "#3ac0e8"); });
    }
    [[18, 20, 86], [44, 16, 60], [66, 14, 74], [242, 14, 70], [262, 22, 92], [290, 16, 58], [308, 16, 78]].forEach(([x, w, hh], i) => {
      cilindro(k, x, 126 - hh, w, hh, ME, 0.3); k.elipse(x + w / 2, 126 - hh, w / 2, 4, NEON[1]); k.elipse(x + w / 2, 125 - hh, w / 2 - 2, 2, NEON[0]);
      for (let y = 126 - hh + 8; y < 122; y += 9) { k.R(x + 2, y, w - 5, 1, NEON[2]); k.R(x + 2, y + 2, w - 5, 2, NEON[1]); for (let vx = x + 3; vx < x + w - 4; vx += 4) k.P(vx, y + 5, "#3a4a5a"); }
      k.R(x + w / 2, 126 - hh - 9, 1, 6, ME[3]); k.crudo(x + w / 2, 126 - hh - 10, 1, 1, i % 2 ? "#e8402a" : "#7ae8ff");
    });
    if (S) { const my = (x) => 100 + Math.sin(x / 50) * 5; for (let x = 0; x < 320; x++) { if (x > 98 && x < 222) continue; const y = my(x); k.R(x, y, 1, 3, ME[3]); k.P(x, y, ME[0]); k.P(x, y + 3, NEON[2]); if (x % 26 === 0) { k.R(x - 1, y + 3, 3, 124 - y - 3, ME[3]); k.R(x - 1, y + 3, 1, 124 - y - 3, ME[1]); } } for (let i = 0; i < 3; i++) { const tx = 22 + i * 17, ty = my(tx) - 4; bola(k, tx, ty, 8, 4, (px, py) => rampa(["#ffffff", "#eef4f8", "#d0dae2", "#aebac4"], (py - ty + 4) / 8, px, py)); k.R(tx - 5, ty - 1, 10, 2, NEON[1]); k.crudo(tx - 4, ty - 1, 2, 1, NEON[0]); } }
    if (HI) { const bx = 54, by = 24; nubarron(k, bx - 30, by + 6, 60, 8, ["#ffffff", "#eef4fa", "#d4e2ee"]); bola(k, bx, by, 20, 13, (px, py) => { const surco = Math.sin(px * 0.7 + Math.sin(py * 0.5) * 2) > 0.7 || Math.sin(py * 0.9 + px * 0.2) > 0.85; return surco ? "#b87a92" : rampa(["#ffe0ea", "#f8c4d4", "#e8a4bc", "#c8849e"], 0.1 + ((px - bx) + (py - by)) / 50, px, py); }); k.R(bx - 1, by - 13, 2, 26, "#b87a92"); trazo(k, [[bx + 10, by + 12], [bx + 30, by + 30], [104, 58]], ME[3], 1); trazo(k, [[bx + 4, by + 13], [bx + 20, by + 34], [102, 66]], ME[3], 1); }
    const HU = ["#ffffff", "#f8f4e8", "#e8e2d0", "#c8c2b4"];
    bola(k, 160, 62, 58, 62, (x, y) => { const lat = Math.abs(((y - 62) / 62 * 9) % 1) < 0.06, lon = Math.abs((Math.asin(Math.max(-1, Math.min(1, (x - 160) / 58 / Math.max(0.2, Math.sqrt(1 - ((y - 62) / 62) ** 2))))) * 6 / Math.PI) % 1) < 0.06; return (lat || lon) && y < 60 ? HU[3] : rampa(HU, 0.1 + (((x - 160) / 58) * 0.4 + ((y - 62) / 62) * 0.26 + 0.34), x, y); });
    rellena(k, [[102, 66], [116, 58], [128, 70], [144, 54], [160, 68], [176, 54], [192, 70], [204, 58], [218, 66], [212, 120], [108, 120]], (x, y) => { const c = celdas(x, y, 12, 8, 3100, 0.2); return c.borde < 0.08 ? "#8a96a2" : rampa(["#e4ecf2", "#c8d4dc", "#a8b4bc", "#8a96a2"], 0.1 + ((x - 102) / 116) * 0.7 + (c.id - 0.5) * 0.1, x, y); });
    trazo(k, [[102, 66], [116, 58], [128, 70], [144, 54], [160, 68], [176, 54], [192, 70], [204, 58], [218, 66]], "#5a6672", 1); trazo(k, [[102, 65], [116, 57], [128, 69], [144, 53], [160, 67], [176, 53], [192, 69], [204, 57], [218, 65]], "#ffffff", 1);
    for (let x = 102; x < 218; x++) { const y = 92 + Math.sin((x - 102) / 37) * 4; k.R(x, y, 1, 3, NEON[2]); k.crudo(x, y - 1, 1, 1, NEON[0]); } for (let x = 110; x < 212; x++) { const y = 112 + Math.sin((x - 102) / 37) * 3; k.R(x, y, 1, 2, NEON[2]); }
    const vents = [];
    for (let x = 118; x < 204; x += 13) { k.R(x - 1, 75, 10, 12, "#5a6672"); k.R(x, 76, 8, 10, "#3a4a5a"); k.R(x + 1, 77, 6, 8, NEON[1]); k.R(x + 1, 77, 2, 8, NEON[0]); vents.push([x + 4, 81]); }
    k.elipse(160, 112, 14, 14, "#5a6672"); k.elipse(160, 112, 13, 13, "#3a4a5a"); k.R(146, 112, 28, 14, "#3a4a5a"); k.elipse(160, 112, 10, 10, NEON[1]); k.R(150, 112, 20, 14, NEON[1]); k.R(159, 100, 2, 26, "#3a4a5a"); vents.push([160, 114]);
    trazo(k, [[8, 40], [108, 58]], ME[3], 2); trazo(k, [[8, 39], [108, 57]], ME[1], 1); trazo(k, [[312, 44], [212, 58]], ME[3], 2); trazo(k, [[312, 43], [212, 57]], ME[1], 1);
    const coche = (x, y, c) => { k.elipse(x, y, 10, 3, c); k.elipse(x, y + 1, 9, 2, mezcla(c, "#000000", 0.2)); k.elipse(x - 1, y - 2, 5, 3, NEON[1]); k.P(x - 3, y - 3, "#ffffff"); k.R(x - 9, y + 2, 4, 1, NEON[2]); k.R(x + 5, y + 2, 4, 1, NEON[2]); k.crudo(x + 9, y, 1, 1, "#fff2b0"); k.crudo(x - 10, y, 1, 1, "#ff6a5a"); };
    coche(92, 26, "#e8607a"); coche(238, 36, "#f2c84b");
    rellena(k, [[-2, 124], [322, 124], [322, 182], [-2, 182]], (x, y) => rampa(["#d8e4ec", "#c8d4dc", "#b8c4cc", "#a8b4bc"], 0.1 + ((y - 124) / 56) * 0.6, x, y));
    for (let i = -9; i <= 9; i++) trazo(k, [[160 + i * 20, 124], [160 + i * 52, 180]], i % 3 ? "#a8b4bc" : NEON[2]);
    for (let y = 128, f = 0; y < 180; y += 4 + f * 2, f++) k.R(0, y, 320, 1, f % 2 ? NEON[1] : "#a8b4bc");
    k.alfa(0.3, () => k.R(0, 124, 320, 3, "#5a6a78")); for (let a = 0; a < Math.PI; a += 0.02) k.crudo(160 + Math.cos(a) * 66, 126 + Math.sin(a) * 6, 1, 1, NEON[1]);
    const robot = (x, b) => { sombraE(k, x, b + 1, 8, 2, 0.4); k.R(x - 3, b - 7, 3, 7, ME[3]); k.R(x + 1, b - 7, 3, 7, ME[3]); cilindro(k, x - 6, b - 18, 13, 12, ME, 0.3); k.R(x - 5, b - 14, 11, 1, NEON[2]); esfera(k, x, b - 22, 5, 5, ME); k.R(x - 4, b - 23, 9, 2, "#26262a"); k.crudo(x - 3, b - 23, 7, 1, "#e8402a"); k.R(x - 9, b - 17, 3, 9, ME[2]); k.R(x + 7, b - 17, 3, 9, ME[2]); k.R(x - 1, b - 30, 1, 4, ME[3]); k.crudo(x - 1, b - 31, 1, 1, NEON[1]); };
    robot(102, 142); robot(218, 142);
    [[40, 158], [276, 156]].forEach(([x, y]) => { sombraE(k, x, y + 11, 9, 2, 0.4); esfera(k, x, y, 9, 11, ["#ffffff", "#e8e2d0", "#c8c2b4"]); k.elipse(x - 1, y - 3, 5, 5, NEON[1]); k.elipse(x - 2, y - 4, 2, 2, NEON[0]); k.R(x - 9, y + 2, 18, 2, NEON[2]); });
    luces(k, vents.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: "#7ae8ff", f: lit * 0.7 })));
  }
  O[31] = (n) => ["Eggbrain", "La isla del futuro, con el laboratorio en forma de huevo", (k) => eggbrain(k, n), { tinte: 0.15, ven: ["#7ae8ff", "#d8fbff"], fuego: ["#3ac0e8", "#7ae8ff", "#d8fbff", "#e8402a", "#ff6a5a", "#fff2b0"], dx: 0 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, losas3d, copa, arbol, briznas, fronda, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido, bezier } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const O = window.SitiosIt18.piratas;
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"];

  function barcoSyrup(k, x, b, gato) {
    const casco = gato ? ["#4a4650", "#36323c", "#26222c", "#18161e"] : ["#d8ae80", "#b98a56", "#8a6238", "#5f3f24"];
    rellena(k, [[x - 19, b - 8], [x + 19, b - 8], [x + 14, b], [x - 14, b]], (px, py) => rampa(casco, (py - b + 8) / 9 + (px - x) / 80, px, py)); k.R(x - 19, b - 9, 38, 1, gato ? "#5a5660" : "#e6c08e");
    [[-7, 34], [7, 30]].forEach(([dx, a]) => { const mx = x + dx; k.R(mx, b - 8 - a, 1, a, "#3a2a20"); [[b - 6 - a, 9], [b - a + 6, 11]].forEach(([vy, w]) => { rellena(k, [[mx - w / 2, vy], [mx + w / 2 + 1, vy], [mx + w / 2 + 2, vy + 9], [mx - w / 2 - 1, vy + 9]], (px, py) => (gato ? rampa(["#3a3640", "#2a2630", "#1e1a24"], (px - mx + w) / (w * 2), px, py) : rampa(PAL.LONA, 0.05 + (px - mx + w) / (w * 2.4), px, py))); }); });
    const cx = x + 7, cy = b - 22;
    if (gato) { k.elipse(cx, cy, 4, 3, "#f4efe0"); k.poli([[cx - 4, cy - 1], [cx - 3, cy - 6], [cx - 1, cy - 2]], "#f4efe0"); k.poli([[cx + 4, cy - 1], [cx + 3, cy - 6], [cx + 1, cy - 2]], "#f4efe0"); k.P(cx - 2, cy, "#26262a"); k.P(cx + 2, cy, "#26262a"); trazo(k, [[cx - 7, cy + 3], [cx - 3, cy + 2]], "#f4efe0"); trazo(k, [[cx + 3, cy + 2], [cx + 7, cy + 3]], "#f4efe0"); }
    else { k.elipse(cx, cy, 3, 3, "#26262a"); k.R(cx - 4, cy - 3, 8, 1, "#e8c35a"); trazo(k, [[cx - 5, cy + 5], [cx + 5, cy - 1]], "#26262a"); trazo(k, [[cx - 5, cy - 1], [cx + 5, cy + 5]], "#26262a"); esfera(k, x + 20, b - 10, 3, 3, ["#ffffff", "#efe6d0", "#d4c8ae"]); k.P(x + 21, b - 11, "#26262a"); }
    k.alfa(0.45, () => k.elipse(x, b + 1, 20, 1.5, "#ffffff"));
  }
  function syrup(k, barco = barcoSyrup) {
    const { h } = Det.cuando(k), lit = encendido(k);
    k.banda(CIELO, 0, 92);
    nubarron(k, 150, 26, 80, 14); nubarron(k, 254, 40, 70, 12); cirros(k, 4, 8, 30);
    P.mar(k, 86, 104, PAL.MAR, { s: 311 }); reflejo(k, 87, 104);
    if (h === 18 || h === 19) barco(k, 34, 96, h === 18);
    rellena(k, [[-2, 104], [40, 98], [96, 76], [124, 66], [196, 66], [226, 76], [282, 96], [322, 100], [322, 120], [-2, 120]], T.tex(["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444"], { v0: 0.2, s: 312, dy: 0.4, y0: 66, alto: 54 }));
    const MAN = ["#fff4e2", "#f4e4c8", "#e6d0aa", "#d0b88e", "#b09872"], PIZ = ["#7a8aa0", "#5e6e86", "#46566c", "#323e50", "#222a38"];
    T.rect(k, 128, 38, 64, 30, (x, y) => rampa(MAN, 0.1 + ((x - 128) / 64) * 0.4 + (fbm(x * 0.3, y * 0.3, 313) - 0.5) * 0.15, x, y));
    rellena(k, [[122, 39], [134, 28], [186, 28], [198, 39]], tejas(PIZ, { w: 4, h: 2, s: 314, y0: 28 })); k.R(122, 39, 76, 1, PIZ[4]);
    [[136, 22], [180, 22]].forEach(([x, y]) => { T.rect(k, x, y, 4, 8, (px, py) => rampa(["#c88466", "#a86448", "#884c36"], (px - x) / 4, px, py)); k.R(x - 1, y - 1, 6, 1, "#4a3a34"); });
    for (let f = 0; f < 2; f++) for (let x = 132; x < 188; x += 9) { if (f === 1 && Math.abs(x - 158) < 6) continue; T.ventana(k, x, 42 + f * 12, 4, 7, { marco: "#5a4a3a", vidrio: "#55697c", alfeizar: MAN[4] }); }
    rellena(k, [[150, 56], [170, 56], [174, 50], [146, 50]], tejas(PIZ, { w: 3, h: 2, s: 315, y0: 50 })); [151, 168].forEach((x) => Det.cilindro(k, x, 56, 2, 12, ["#ffffff", "#ece4d4", "#cfc4b0"])); k.R(156, 58, 8, 10, "#5a3a24"); k.P(162, 63, "#e8c35a");
    for (let x = 118; x < 202; x += 3) { k.R(x, 66, 1, 5, "#3a3a44"); k.P(x, 65, "#8a8a96"); } k.R(118, 67, 84, 1, "#3a3a44");
    [[112, 70, 9, 10], [208, 70, 9, 10], [100, 80, 7, 8], [222, 82, 8, 9]].forEach(([x, b, rx, ry], i) => arbol(k, x, b, 6, rx, ry, ["#9ad070", "#74b058", "#549446", "#3a7638", "#285828"], { g: 2, s: 316 + i }));
    const camX = (y) => 160 + Math.sin((y - 68) / 16) * (8 + (y - 68) * 0.2), camW = (y) => 2 + (y - 68) * 0.13;
    T.prado(k, 104, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 317, { flores: { n: 30, cols: ["#ffffff", "#f6d84a", "#f08aa0"] }, perfil: (x) => 104 + Math.sin(x / 30) * 2 });
    for (let y = 68; y < H; y++) { const c = camX(y), w = camW(y); for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#ecd6a4", "#dcc08a", "#c8a874", "#ae8e5e"], 0.2 + Math.abs(x - c) / w * 0.35 + (fbm(x * 0.2, y * 0.3, 318) - 0.5) * 0.4, x, y)); }
    const vents = [];
    [[-6, 128, 32, 22, PAL.TEJA_R], [28, 126, 28, 18, PAL.TEJA_A], [64, 120, 28, 20, ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"]], [216, 114, 30, 22, PAL.TEJA_R], [250, 112, 32, 22, ["#f4a074", "#e07c50", "#c0603a", "#984a2c", "#6c321c"]], [286, 116, 36, 24, PAL.TEJA_A]].forEach(([x, b, w, hh, techo], i) => vents.push(...T.casa(k, x, b, w, hh, { techo, s: 319 + i, ventanas: [0.24, 0.7], puerta: 0.48, chimenea: i % 2 === 0, ven: "#f2d27a" })));
    for (let x = 40; x < 120; x += 6) { k.R(x, 148 - (x - 40) * 0.05, 1, 8, "#8a6440"); } trazo(k, [[40, 151], [118, 147]], "#a87a50"); trazo(k, [[40, 154], [118, 150]], "#a87a50");
    const oveja = (x, b) => { sombraE(k, x + 1, b, 6, 1.5, 0.4); for (let i = 0; i < 6; i++) esfera(k, x - 3 + (i % 3) * 3, b - 6 - Math.floor(i / 3) * 3, 2.5, 2.5, ["#ffffff", "#f2eee4", "#d8d0c0"]); k.R(x + 5, b - 9, 3, 4, "#3a3430"); k.R(x - 3, b - 3, 1, 3, "#3a3430"); k.R(x + 2, b - 3, 1, 3, "#3a3430"); };
    oveja(30, 168); oveja(52, 176); oveja(290, 164); oveja(270, 172);
    luces(k, vents.map(([x, y]) => ({ x, y, r: 14, ry: 10, col: LUZ, f: lit * 0.8 })).concat([{ x: 160, y: 50, r: 40, ry: 18, col: LUZ, f: lit * 0.5 }]));
  }
  O[18] = ["Honey Village", "El pueblo de Usupp, con la mansión de Gaya en lo alto de la colina", (k) => syrup(k), { ven: ["#f2d27a", "#55697c", "#ffd27a"], detallesDentro: true }];
  window.H18.syrup = syrup;

  const ROJA = ["#ec9474", "#d8745a", "#bc5a42", "#9a4432", "#743224", "#52241a"], AG = ["#f0fcff", "#c4eefa", "#8ad4f0", "#4aaedc", "#2a86bc"];
  const BAL = ["#7484a0", "#5c6a86", "#48546e", "#363f56", "#262d40", "#181d2c"];
  function reverse(k, cumbre = false) {
    const { h } = Det.cuando(k), lit = encendido(k);
    k.banda(["#f4a46a", "#f8c08a", "#fbdcaa", "#fff0d0"], 0, 102);
    const cresta = (x) => 10 + Math.abs(x - 160) * 0.05 + Math.sin(x / 13) * 2 + Math.sin(x / 4.7) * 1;
    for (let x = 0; x < W; x++) for (let y = Math.round(cresta(x)); y < 104; y++) { const capa = Math.sin(y / 2.6 + Math.sin(x / 23) * 1.4 + fbm(x * 0.03, y * 0.1, 2001) * 2); const grieta = fbm(x * 0.09, y * 0.02, 2002) > 0.66 && Math.abs(Math.sin(x * 0.31 + fbm(x * 0.05, y * 0.05, 2007) * 9)) < 0.08; k.P(x, y, grieta ? ROJA[5] : rampa(ROJA, 0.18 + (capa > 0.6 ? 0.18 : capa < -0.7 ? -0.1 : 0) + (x - 160) / 900 + ((y - 10) / 94) * 0.25 + (fbm(x * 0.06, y * 0.12, 2003) - 0.5) * 0.3, x, y)); }
    const nubes = () => [[-30, 8, 110, 12], [70, 2, 90, 10], [170, 4, 100, 12], [250, 8, 100, 14], ...(cumbre ? [[116, 3, 88, 14]] : [])].forEach(([x, y, w, hh]) => nubarron(k, x, y, w, hh, ["#fff4ec", "#f8dccc", "#e8bca8"]));
    const canal = (y0) => { for (let y = y0; y < 104; y++) { const t = Math.max(0, (y - 14) / 90), c = 160, w = 3 + t * 15; for (let x = Math.round(c - w); x <= c + w; x++) { const u = (x - c) / w; k.P(x, y, Math.abs(u) > 0.84 ? AG[0] : rampa(AG, 0.1 + Math.abs(u) * 0.4 + (Math.sin(y * 0.8 - x * 0.4) > 0.6 ? -0.2 : 0.12), x, y)); } k.P(c - w - 1, y, ROJA[5]); k.P(c + w + 1, y, ROJA[5]); } };
    if (cumbre) { canal(Math.floor(cresta(160)) + 2); nubes(); } else { nubes(); canal(14); }
    if (h === 17) { const mx = 160, my = 54; k.alfa(0.8, () => { k.elipse(mx, my + 4, 8, 2, "#ffffff"); }); rellena(k, [[mx - 5, my], [mx + 5, my], [mx + 4, my + 4], [mx - 4, my + 4]], () => "#a87444"); k.R(mx, my - 12, 1, 12, "#3a2a20"); k.R(mx - 5, my - 11, 11, 8, "#f4efe0"); k.elipse(mx, my - 7, 2, 2, "#26262a"); k.R(mx - 2, my - 9, 5, 1, "#e8c35a"); esfera(k, mx, my + 1, 2, 2, ["#ffffff", "#efe6d0", "#d4c8ae"]); }
    [[132, 70], [188, 70]].forEach(([x, y]) => { T.rect(k, x - 5, y, 10, 34, (px, py) => rampa(["#f05a3a", "#d0402a", "#a8301e", "#7a2214"], 0.1 + ((px - x + 5) / 10) * 0.7, px, py)); k.R(x - 7, y - 3, 14, 3, "#5a1a10"); k.R(x - 6, 100, 12, 4, "#3a3a44"); });
    k.R(122, 64, 76, 6, "#c8302a"); k.R(122, 64, 76, 1, "#f06a4a"); k.R(122, 69, 76, 1, "#7a2214"); k.R(118, 60, 84, 4, "#26262a"); k.R(118, 60, 84, 1, "#4a4a54");
    P.mar(k, 102, 152, ["#7ccaf0", "#5ab4e6", "#3f9ad8", "#2f86c6", "#2472b0"], { s: 2004, espejo: false }); reflejo(k, 104, 152);
    const lx = 84, ly = 142, rx = 72, ry = 46;
    bola(k, lx, ly, rx + 1, ry + 1, (x, y) => (y > 147 ? null : BAL[5]));
    bola(k, lx, ly, rx, ry, (x, y) => (y > 147 ? null : rampa(BAL, 0.15 + ((x - lx) / rx) * 0.25 + ((y - ly + ry) / (ry * 2)) * 0.5 + (fbm(x * 0.08, y * 0.1, 2005) - 0.5) * 0.12, x, y)));
    for (let a = Math.PI * 1.05; a < Math.PI * 1.95; a += 0.01) { const x = lx + Math.cos(a) * (rx - 1), y = ly + Math.sin(a) * (ry - 1); k.P(x, y, a > Math.PI * 1.5 ? "#e8a080" : "#b4a8b8"); }
    [[[44, 112], [58, 120], [70, 116]], [[96, 108], [110, 116]], [[120, 120], [134, 112], [140, 118]], [[30, 128], [44, 124]], [[60, 104], [68, 110]]].forEach((g) => { trazo(k, g, "#a89aa8", 1); trazo(k, g.map(([x, y]) => [x, y + 1]), BAL[4], 1); });
    P.jollyRoger(k, lx, ly - 22, 0.62, "#f4f0e6");
    [[lx - 58, 1], [lx + 58, -1]].forEach(([ex]) => { k.elipse(ex, 134, 4, 3, "#e8ecf4"); k.elipse(ex, 134, 2, 2, "#141824"); k.P(ex - 1, 133, "#ffffff"); trazo(k, [[ex - 6, 129], [ex + 6, 129]], BAL[4]); });
    for (let x = lx - 62; x < lx + 62; x++) { const y = 143 + Math.round(Math.abs(x - lx) / 30); k.R(x, y, 1, 147 - y, "#a8b4c8"); } trazo(k, [[lx - 62, 142], [lx - 30, 141], [lx, 142], [lx + 30, 141], [lx + 62, 142]], BAL[5], 1);
    for (let x = lx - rx - 4; x < lx + rx + 4; x++) if (hash(x, 1, 2006) > 0.3) k.P(x, 147 + Math.round(Math.sin(x / 3) * 1), "#ffffff");
    k.alfa(0.7, () => { trazo(k, [[lx - 4, 100], [lx - 8, 86], [lx - 12, 80]], "#e8f8ff", 2); trazo(k, [[lx + 4, 100], [lx + 8, 86], [lx + 12, 80]], "#e8f8ff", 2); });
    T.prado(k, 150, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 425, { flores: { n: 20, cols: ["#ffffff", "#f6d84a"] }, perfil: (x) => 150 + Math.sin(x / 26) * 3 });
    const fx = 306, base = 160, top = 44, BL = ["#ffffff", "#f0ece4", "#d8d0c4", "#b8b0a2"], RO = ["#f05a4a", "#d0402e", "#a83022", "#7a2216"];
    for (let y = top; y < base; y++) { const a = 15 + ((y - top) / (base - top)) * 5, rojo = Math.floor((y - top) / 16) % 2; for (let x = Math.round(fx - a); x <= Math.min(W - 1, Math.round(fx + a)); x++) k.P(x, y, rampa(rojo ? RO : BL, 0.08 + ((x - fx + a) / (2 * a)) * 0.75, x, y)); }
    [86, 118].forEach((y) => { k.R(fx - 3, y, 6, 8, "#3a3a44"); k.R(fx - 3, y, 6, 1, "#5a5a66"); });
    k.R(fx - 5, base - 16, 10, 16, "#4a3a2e"); k.R(fx - 5, base - 16, 10, 1, "#6a5040"); k.R(fx - 6, base - 17, 12, 1, "#3a3a44");
    k.R(fx - 21, top - 4, 42, 4, "#3a3a44"); k.R(fx - 21, top - 4, 42, 1, "#5a5a66"); for (let x = fx - 20; x < fx + 21; x += 4) k.R(x, top - 10, 1, 6, "#3a3a44"); k.R(fx - 21, top - 10, 42, 1, "#3a3a44");
    T.rect(k, fx - 11, top - 26, 22, 16, () => "#ffd27a"); [fx - 11, fx - 4, fx + 3, fx + 10].forEach((x) => k.R(x, top - 26, 1, 16, "#3a3a44"));
    k.R(fx - 13, top - 28, 26, 2, "#3a3a44"); k.poli([[fx - 14, top - 28], [fx + 14, top - 28], [fx, top - 40]], "#c0392b"); k.poli([[fx, top - 40], [fx + 14, top - 28], [fx + 3, top - 28]], "#8a2a1e"); k.R(fx - 1, top - 44, 2, 5, "#3a3a44");
    sombraE(k, fx - 6, base + 1, 26, 3, 0.4);
    if (lit > 0) rayos(k, [[fx - 6, top - 18, 170, 6, 2, 30]], "#fff6d8", 0.35 * lit);
    sombraE(k, 238, 174, 32, 4, 0.4);
    trazo(k, [[240, 136], [236, 172]], "#6a5040", 2);
    rellena(k, [[204, 146], [222, 136], [240, 132], [258, 136], [276, 146]], (x, y) => rampa(Math.floor((x - 204) / 8) % 2 ? BL : RO, (y - 132) / 16, x, y));
    for (let x = 204; x < 276; x += 8) { const c = Math.floor((x - 204) / 8) % 2 ? "#d8d0c4" : "#b83020"; k.R(x + 1, 146, 6, 1, c); k.R(x + 2, 147, 4, 1, c); }
    k.R(239, 129, 2, 3, "#6a5040");
    trazo(k, [[216, 176], [224, 168], [254, 168], [260, 176]], "#6a5040", 2);
    rellena(k, [[214, 160], [222, 156], [228, 166], [258, 166], [258, 170], [224, 170]], (x, y) => (Math.floor((x + y) / 5) % 2 ? "#3f8ac0" : "#f4efe6"));
    trazo(k, [[214, 160], [222, 156], [228, 166], [258, 166]], "#2a5a8a", 1);
    luces(k, [{ x: fx, y: top - 18, r: 40, ry: 30, col: "#fff0b0", f: lit }]);
  }
  O[20] = ["Inverse Mountain", "La montaña por la que sube el mar, con la gran ballena Loboan", (k) => reverse(k), { tinte: 0.15, ven: VEN, detallesDentro: true }];
  window.H18.reverse = reverse;

  const HUE = ["#fffaee", "#f2e8d2", "#dcceb0", "#bcaa8a", "#988668", "#6e5e48"];
  function littleGarden(k) {
    k.banda(["#6ab0d8", "#90c8e4", "#c0e0ec", "#e8f2e6"], 0, 112);
    nubarron(k, -20, 30, 80, 12); nubarron(k, 246, 22, 90, 14);
    const VX = 160, VT = 36, VB = 112, R0 = 15, R1 = 102, ROC = ["#b4a494", "#9a8a7c", "#827468", "#6a5e54", "#544a42", "#3e3632"];
    pluma(k, VX - 2, VT - 2, 34, 12, ["#c8c0b8", "#a8a098", "#8a827a", "#6a645e"], { s: 2201, viento: 0.55 });
    for (let y = VT; y < VB; y++) { const t = (y - VT) / (VB - VT), w = R0 + (R1 - R0) * Math.pow(t, 1.7); for (let x = Math.round(VX - w); x <= VX + w; x++) { const u = (x - VX) / w, barranco = Math.sin(u * 11 + fbm(x * 0.05, y * 0.03, 2202) * 3) > 0.72; k.P(x, y, rampa(ROC, 0.15 + (u + 1) * 0.3 + (barranco ? 0.2 : 0) + (fbm(x * 0.12, y * 0.12, 2203) - 0.5) * 0.18 - (1 - t) * 0.1, x, y)); } }
    k.halo(VX, VT - 2, 24, 10, "#ffb04a", 0.4);
    bola(k, VX, VT, R0 + 2, 4, (x, y) => rampa(["#d4c4b4", "#b4a494", "#9a8a7c"], 0.1 + (y - VT + 4) / 8, x, y)); k.elipse(VX, VT, R0 - 2, 2, "#3a1c14"); k.elipse(VX, VT, R0 - 6, 1, "#e8602a"); k.crudo(VX - 3, VT, 6, 1, "#ffd06a");
    const colada = (x0, d, s, largo) => { let x = x0, y = VT + 2; const pts = [[x, y]]; for (let j = 0; j < largo; j++) { y += 3; x += d * (0.8 + j * 0.05) + Math.sin(j * 0.9 + s) * 1.8 + (hash(j, s, 2204) - 0.5) * 1.6; pts.push([x, y]); if (y > VB - 4) break; } trazo(k, pts, (f) => (f < 0.7 ? "#7a2a18" : "#3a2420"), 3, 4); trazo(k, pts.slice(0, Math.round(pts.length * 0.8)), (f) => (f < 0.6 ? "#e8602a" : "#a83a22"), 2, 1); trazo(k, pts.slice(0, Math.round(pts.length * 0.55)), "#ffb04a", 1, 1); k.alfa(0.5, () => trazo(k, pts.slice(0, 6), "#fff0a0", 1)); return pts; };
    const c1 = colada(VX - 6, -1.5, 1, 22); colada(VX + 4, 0.5, 2, 14); colada(VX + 9, 1.7, 3, 22); { const [bx, by] = c1[6]; let x = bx, y = by; const rama = [[x, y]]; for (let j = 0; j < 8; j++) { y += 3; x += 1.2 + Math.sin(j) * 1.2; rama.push([x, y]); } trazo(k, rama, "#7a2a18", 2, 2); trazo(k, rama.slice(0, 5), "#e8602a", 1); }
    [[118, 104, 9], [196, 106, 8], [146, 100, 6]].forEach(([x, y, r]) => k.alfa(0.7, () => k.elipse(x, y, r, 2, "#3a302c")));
    [[58, 26], [80, 18], [262, 44]].forEach(([x, y]) => { trazo(k, [[x - 8, y - 3], [x - 3, y], [x, y + 1]], "#5a4a4a"); trazo(k, [[x + 8, y - 3], [x + 3, y], [x, y + 1]], "#5a4a4a"); k.R(x, y, 4, 1, "#5a4a4a"); k.P(x + 4, y - 1, "#5a4a4a"); });
    for (let i = 0; i < 14; i++) copa(k, i * 24 - 6, 100 + (i % 3) * 3, 18, 12, ["#8ac078", "#6aa45e", "#50884a", "#3a6c3a", "#28502a"], { r: 5, s: 453 + i });
    const DINO = ["#a8b888", "#8ea070", "#76885c", "#5e6e48", "#465436"];
    trazo(k, bezier([268, 110], [262, 76], [272, 44], [292, 34], 20), (f) => DINO[f < 0.5 ? 2 : 1], 9, 6);
    bola(k, 296, 34, 9, 5, (x, y) => rampa(DINO, 0.2 + ((y - 29) / 10) * 0.5, x, y)); k.P(298, 32, "#1c1c22"); trazo(k, [[300, 37], [305, 36]], DINO[4]);
    for (let i = 0; i < 10; i++) copa(k, i * 34 + 8, 114, 16, 10, ["#9ad080", "#78b462", "#5a984e", "#427a3e", "#2c5c2e"], { r: 5, s: 470 + i });
    T.prado(k, 118, ["#a8d888", "#8cc46e", "#72aa5a", "#5a904a", "#44763a", "#305a2c"], 480);
    for (let y = 120; y < H; y++) { const f = (y - 120) / 60, c = 166 + Math.sin(f * 2.4) * 18 * f, w = 3 + f * 14; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#c8b48c", "#b49c76", "#9a8262", "#7e6a50"], 0.2 + Math.abs(x - c) / w * 0.4 + (fbm(x * 0.2, y * 0.3, 481) - 0.5) * 0.4, x, y)); }
    const col = bezier([186, 136], [216, 126], [256, 124], [300, 130], 30);
    col.forEach(([x, y], i) => { if (i % 3 === 0) { const h0 = 7 - Math.abs(i - 12) * 0.25; trazo(k, [[x + 1, y - 18], [x + 3, y - 18 - h0]], HUE[3], 2, 1); } });
    for (let i = 3; i < 25; i += 3) { const [x, y] = col[i], hh = 36 - Math.abs(i - 12) * 1.4; trazo(k, bezier([x, y - 16], [x + 8, y - 16 - hh * 0.3], [x + 14, y - hh * 0.15], [x + 12, y + 10], 14), (f) => HUE[f < 0.5 ? 4 : 5], 2, 1); }
    col.forEach(([x, y], i) => { bola(k, x, y - 17, 3, 2.4, (px, py) => rampa(HUE, 0.1 + (py - y + 19) / 6, px, py)); if (i % 2 === 0) k.P(x, y - 15, HUE[5]); });
    for (let i = 3; i < 25; i += 3) { const [x, y] = col[i], hh = 36 - Math.abs(i - 12) * 1.4; const pts = bezier([x, y - 17], [x - 10, y - 17 - hh * 0.45], [x - 16, y - hh * 0.1], [x - 8, y + 14], 16); trazo(k, pts, (f) => HUE[f < 0.25 ? 1 : f < 0.7 ? 0 : 2], 3, 2); trazo(k, pts.map(([px, py]) => [px + 1, py + 1]), (f) => HUE[3], 1); if (i % 6 === 0) trazo(k, pts.slice(5, 11).map(([px, py]) => [px + 1, py + 2]), "#5a9a4a", 1); }
    const sx = 168, sy = 134;
    bola(k, sx + 6, sy - 8, 15, 10, (x, y) => rampa(HUE, 0.1 + ((x - sx + 9) / 30) * 0.4 + ((y - sy + 18) / 20) * 0.3, x, y));
    rellena(k, [[sx - 6, sy - 14], [sx - 26, sy - 8], [sx - 30, sy - 2], [sx - 6, sy + 2]], (x, y) => rampa(HUE, 0.1 + ((y - sy + 14) / 16) * 0.5, x, y));
    k.elipse(sx + 2, sy - 9, 4, 3, "#2a2420"); k.elipse(sx + 2, sy - 9, 2, 2, "#120e0c"); k.elipse(sx - 24, sy - 6, 2, 1, "#2a2420");
    for (let x = sx - 28; x < sx - 4; x += 3) k.poli([[x, sy + 1], [x + 2, sy + 1], [x + 1, sy + 5]], HUE[0]);
    rellena(k, [[sx - 4, sy + 4], [sx - 28, sy + 10], [sx - 26, sy + 13], [sx - 2, sy + 9]], (x, y) => rampa(HUE, 0.3 + (y - sy - 4) / 10, x, y)); for (let x = sx - 26; x < sx - 4; x += 3) k.poli([[x, sy + 8], [x + 2, sy + 8], [x + 1, sy + 4]], HUE[0]);
    trazo(k, bezier([sx + 12, sy - 14], [sx + 20, sy - 26], [sx + 30, sy - 30], [sx + 34, sy - 26], 12), (f) => HUE[f < 0.5 ? 2 : 1], 3, 1); trazo(k, bezier([sx + 4, sy - 16], [sx + 8, sy - 28], [sx + 16, sy - 34], [sx + 22, sy - 32], 12), (f) => HUE[f < 0.5 ? 3 : 2], 2, 1);
    trazo(k, [[sx - 10, sy - 13], [sx - 4, sy - 11], [sx + 2, sy - 16]], "#5a9a4a", 1); sombraE(k, 240, 141, 70, 4, 0.3);
    const ACERO = ["#e8eef6", "#c4ccd8", "#98a2b2", "#727c8e", "#4e5668"];
    sombraE(k, 30, 179, 10, 2, 0.5); rellena(k, [[26, 180], [24, 102], [36, 102], [34, 180]], (x, y) => rampa(ACERO, 0.1 + ((x - 24) / 12) * 0.7, x, y)); k.R(29, 104, 2, 72, ACERO[3]);
    T.rect(k, 12, 94, 36, 7, (x, y) => rampa(["#e8c35a", "#c8a040", "#9a7a2e", "#6e5620"], 0.2 + (y - 94) / 7 * 0.6, x, y)); T.rect(k, 27, 70, 7, 24, madera(["#8a5a3a", "#6e4428", "#54321c", "#3a2210", "#261608"], { paso: 2, largo: 4, s: 482 })); esfera(k, 30, 68, 5, 5, ["#f8e090", "#e8c35a", "#b08a30"]);
    sombraE(k, 300, 179, 12, 2, 0.5); trazo(k, [[296, 180], [306, 112]], (f) => (Math.floor(f * 12) % 3 ? "#6a4a30" : "#3a2a1c"), 4, 3);
    rellena(k, [[300, 118], [284, 104], [278, 116], [282, 134], [298, 132]], (x, y) => rampa(ACERO, 0.12 + ((x - 278) / 22) * 0.5, x, y)); trazo(k, [[284, 104], [278, 116], [282, 134]], ACERO[0], 1);
    [[12, 180, -1], [50, 182, 1], [264, 182, -1], [310, 180, 1]].forEach(([x, b, d], i) => { for (let j = 0; j < 7; j++) { const a = -Math.PI / 2 + (j - 3) * 0.32 * d; fronda(k, x, b, Math.cos(a), Math.sin(a), 26 + hash(i, j, 483) * 12, ["#a8dc78", "#82c05a", "#5a9a44", "#3e7a34"], { caida: 0.45, foliolo: 3.2 }); } });
  }
  O[22] = ["Tiny Garden", "La selva prehistórica: helechos gigantes, las costillas de un monstruo y el volcán que marca el duelo de los dos gigantes", littleGarden, { tinte: 0.25, fuego: ["#e8602a", "#ffb04a", "#ffd06a", "#fff0a0", "#5a2018", "#a83a22"], dx: 90 }];

  const ORO7 = ["#fff6c4", "#f8e28a", "#ecc65a", "#d4a43a", "#ac7e26", "#7e5a18"], PIEDRA_S = ["#faf4e6", "#ece2cc", "#d8ccb2", "#bcae92", "#9a8c72", "#726652"];
  function skypeia(k) {
    k.banda(["#2a7ad0", "#4f9ae0", "#8cc8f0", "#d0ecfa"], 0, 130);
    cirros(k, 8, 6, 40);
    nubarron(k, -24, 50, 100, 26); nubarron(k, 96, 76, 90, 16); nubarron(k, 262, 36, 84, 20);
    [[22, 104, 40], [196, 100, 30]].forEach(([x, y, w]) => { nubarron(k, x, y, w, 6, ["#ffffff", "#eef6fc", "#d4e6f4"]); for (let i = 0; i < 3; i++) { const px = x + 6 + i * (w / 3); trazo(k, [[px, y - 1], [px + 1, y - 7]], "#8a9a8a"); k.R(px - 2, y - 8, 5, 1, "#7a9a7a"); } });
    const LI = ["#a8e080", "#80c860", "#5aa848", "#3e8a3a", "#2a6a2e", "#1c4c22"];
    for (let y = 0; y < 134; y++) { const c = 248 + Math.sin(y / 17) * 12, a = 11 + (y / 132) * 6; for (let x = Math.round(c - a); x <= c + a; x++) { const u = (x - c) / a; k.P(x, y, rampa(LI, 0.08 + Math.abs(u + 0.35) * 0.6 + (Math.sin(u * 7 + y * 0.12) > 0.6 ? 0.18 : 0) + (fbm(x * 0.2, y * 0.05, 71) - 0.5) * 0.25, x, y)); } }
    [[30, 1], [62, -1], [92, 1], [118, -1]].forEach(([y, d]) => { const x = 248 + Math.sin(y / 17) * 12 + d * 14; const pts = []; for (let a = 0; a < 9; a += 0.25) pts.push([x + d * (a * 2.2 + Math.cos(a) * (4 - a * 0.3)), y - 4 + Math.sin(a) * (4 - a * 0.3)]); trazo(k, pts, LI[2], 1); });
    [[20, -1], [46, 1], [74, -1], [100, 1]].forEach(([y, d]) => { const x = 248 + Math.sin(y / 17) * 12 + d * 14, hoja = [[x, y + 2], [x + d * 10, y - 7], [x + d * 26, y - 10], [x + d * 40, y - 2], [x + d * 28, y + 9], [x + d * 12, y + 9]]; rellena(k, hoja, (px, py) => rampa(LI, 0.12 + ((py - y + 10) / 20) * 0.5 + Math.abs(px - x) / 40 * 0.15, px, py)); trazo(k, [[x, y + 2], [x + d * 20, y - 1], [x + d * 38, y - 2]], LI[4], 1); for (let j = 1; j < 4; j++) { trazo(k, [[x + d * j * 9, y], [x + d * (j * 9 + 6), y - 6]], LI[3]); trazo(k, [[x + d * j * 9, y + 1], [x + d * (j * 9 + 6), y + 6]], LI[3]); } });
    T.rect(k, 76, 104, 132, 26, piedra(PIEDRA_S, { tx: 12, ty: 5, s: 72, musgo: { umbral: 0.62, pal: ["#a8d080", "#80b060", "#5a904a", "#3e7036"] } })); k.R(76, 103, 132, 2, PIEDRA_S[0]);
    [[86, 62, true], [114, 40, false], [170, 40, false], [198, 56, true]].forEach(([x, top, rota]) => { T.rect(k, x - 5, top, 10, 104 - top, (px, py) => rampa(PIEDRA_S, 0.08 + Math.abs((px - x + 2) / 6) * 0.55 + ((px - x + 5) % 3 === 0 ? 0.2 : 0) + (fbm(px * 0.3, py * 0.1, 73) - 0.5) * 0.2, px, py)); if (rota) { for (let i = 0; i < 10; i++) k.R(x - 5 + i, top - 1 - Math.round(hash(i, x, 74) * 4), 1, 5, PIEDRA_S[1 + (i % 3)]); } else { k.R(x - 7, top - 3, 14, 3, PIEDRA_S[1]); k.R(x - 6, top - 1, 12, 1, PIEDRA_S[3]); } k.R(x - 7, 101, 14, 3, PIEDRA_S[3]); if (rota) trazo(k, [[x - 4, 104], [x + 3, 92], [x - 3, 80], [x + 4, 70]], (f) => LI[f < 0.5 ? 3 : 2], 1.5, 1); });
    rellena(k, [[108, 40], [176, 40], [176, 29], [142, 20], [108, 29]], T.tex(PIEDRA_S, { v0: 0.2, s: 75, g: 0.3, dx: 0.4, x0: 108, ancho: 68 })); k.R(108, 37, 68, 3, PIEDRA_S[3]); for (let x = 112; x < 174; x += 6) k.R(x, 33, 3, 2, PIEDRA_S[4]);
    trazo(k, [[108, 29], [142, 20], [176, 29]], PIEDRA_S[0], 1);
    k.R(140, 40, 3, 6, "#6a5020");
    const campana = [[142, 45], [151, 49], [157, 64], [159, 84], [168, 98], [170, 102], [114, 102], [116, 98], [125, 84], [127, 64], [133, 49]];
    rellena(k, campana, (x, y) => rampa(ORO7, 0.1 + Math.pow(Math.abs((x - 142) / 28 + 0.38), 1.2) * 0.75 + ((y === 60 || y === 72 || y === 92) ? 0.3 : 0) + (y > 94 ? 0.12 : 0), x, y));
    trazo(k, [[136, 54], [133, 66], [132, 82]], ORO7[0], 2, 1); bola(k, 142, 101, 28, 3, (x, y) => rampa(ORO7, 0.4 + ((y - 99) / 4) * 0.4, x, y)); k.elipse(142, 104, 4, 3, ORO7[5]);
    for (let x = 128; x < 158; x += 5) k.P(x, 78, ORO7[4]);
    k.R(0, 128, W, 52, "#f4f8fa");
    [[-30, 118, 90, 12], [64, 124, 80, 9], [152, 122, 90, 9], [252, 118, 100, 13], [-20, 140, 120, 11], [108, 146, 110, 9], [224, 142, 120, 11], [-16, 164, 140, 11], [140, 168, 120, 9], [262, 164, 90, 11]].forEach(([x, y, w, hh]) => nubarron(k, x, y, w, hh, ["#ffffff", "#f0f6fb", "#d6e6f2"]));
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 76) * W, y = 132 + hash(i, 2, 76) * 46; k.alfa(0.5, () => k.R(x, y, 6 + hash(i, 3, 76) * 10, 1, "#c8dcec")); }
    const wx = 276, wy = 154;
    k.alfa(0.75, () => { for (let i = 0; i < 34; i++) { const x = wx - 22 - i * 2.4, y = wy + 3 + Math.sin(i * 0.45) * 2, w = 4 - i * 0.08; k.R(x, y - 1, w, 1, "#ffffff"); k.R(x, y + 2, w, 1, "#c8dcec"); } });
    sombraE(k, wx, wy + 8, 22, 2, 0.25);
    rellena(k, [[wx - 18, wy], [wx + 12, wy - 3], [wx + 24, wy + 2], [wx + 12, wy + 6], [wx - 18, wy + 6]], (x, y) => rampa(["#ffffff", "#e8eef6", "#c4d0e0", "#8ea0bc"], 0.1 + (y - wy + 3) / 10, x, y)); k.R(wx - 18, wy + 3, 38, 1, "#3f7ac0"); trazo(k, [[wx - 18, wy], [wx + 12, wy - 3], [wx + 24, wy + 2]], "#ffffff");
    k.R(wx + 6, wy - 11, 2, 9, "#5a5a66"); k.R(wx + 2, wy - 12, 9, 2, "#5a5a66"); k.P(wx + 2, wy - 11, "#3a3a44"); k.P(wx + 10, wy - 11, "#3a3a44");
    esfera(k, wx - 16, wy + 2, 5, 4, ["#fff0d8", "#e8c8a0", "#b8946a"]); for (let a = 0; a < 6; a++) k.P(wx - 16 + Math.cos(a) * 3, wy + 2 + Math.sin(a) * 2, "#a88458"); k.alfa(0.7, () => { k.elipse(wx - 24, wy + 2, 4, 3, "#ffffff"); k.elipse(wx - 30, wy + 3, 3, 2, "#ffffff"); });
  }
  O[7] = ["Skypeia", "Las islas en el cielo, con su mar de nubes blancas", skypeia, { tinte: 0.45, ven: VEN }];

  const MUR9 = ["#7a6c98", "#62567e", "#4c4266", "#3a3252", "#2a2440", "#1c182e"];
  function thriller(k) {
    k.banda(["#160f2a", "#241a42", "#3a2a5e", "#4a3a6e"], 0, 120);
    k.astro(70, 46, 22, "#f2eeb8", "#7a6a9a");
    [[60, 40, 2], [78, 52, 3], [64, 56, 2], [84, 38, 2], [72, 34, 1]].forEach(([x, y, r]) => k.elipse(x, y, r, r, "#d8d29c"));
    for (let i = 0; i < 50; i++) k.crudo(hash(i, 1, 91) * W, hash(i, 2, 91) * 80, 1, 1, i % 4 ? "#c8c0e8" : "#ffffff");
    const NIE = ["#5a4e7a", "#463c66", "#342c52"];
    nubarron(k, 186, 34, 150, 14, NIE); nubarron(k, -24, 76, 110, 12, NIE);
    [[236, 30], [272, 22], [304, 40]].forEach(([x, top]) => { k.R(x, top, 3, 100 - top, "#241c38"); k.R(x, top, 1, 100 - top, "#342a4c"); [0.2, 0.48].forEach((f) => { const y = top + (96 - top) * f; k.R(x - 16, y, 35, 2, "#241c38"); rellena(k, [[x - 14, y + 2], [x + 16, y + 2], [x + 13, y + 16], [x + 5, y + 12], [x - 2, y + 18], [x - 12, y + 14]], () => "#2c2444"); trazo(k, [[x - 14, y + 2], [x - 20, y + 30]], "#1c1630"); trazo(k, [[x + 16, y + 2], [x + 22, y + 30]], "#1c1630"); }); });
    const regala = (x) => 88 - Math.pow((x - 160) / 160, 2) * 14;
    for (let x = 0; x < W; x++) for (let y = Math.round(regala(x)); y < 106; y++) { const tabla = Math.round(y - regala(x)) % 4 === 0; k.P(x, y, tabla ? "#1a1428" : rampa(["#4a3e62", "#3c3252", "#2e2642", "#221c34"], 0.2 + (y - regala(x)) / 22 + (fbm(x * 0.05, y * 0.2, 2901) - 0.5) * 0.3, x, y)); }
    for (let x = 0; x < W; x++) { const y = Math.round(regala(x)); k.P(x, y - 1, "#6a5e88"); k.P(x, y - 2, "#2a2240"); if (x % 8 === 0) k.R(x, y - 5, 1, 4, "#2a2240"); k.P(x, y - 5, "#4a3e62"); }
    for (let x = 8; x < W; x += 22) { const y = regala(x) + 6; k.R(x, y, 7, 5, "#120e1c"); k.R(x + 1, y + 1, 5, 3, "#3a2a14"); k.crudo(x + 2, y + 2, 3, 1, "#ffcf6a"); k.R(x + 2, y + 3, 4, 1, "#0a0812"); }
    k.cordillera(122, 34, "#2a1f44", "#3a2e58", 2.4);
    const muro = (x0, w, s) => (px, py) => { const c = celdas(px, py, 7, 4, s, 0.6); if (c.borde < 0.1) return MUR9[5]; return rampa(MUR9, 0.1 + ((px - x0) / w) * 0.6 + (c.id - 0.5) * 0.22 + (hash(px, py, s) - 0.5) * 0.08, px, py); };
    const torreT = (x, base, w, hh, ladea, s) => { rellena(k, [[x, base], [x + ladea, base - hh], [x + w + ladea, base - hh], [x + w, base]], muro(x, w + Math.abs(ladea), s)); rellena(k, [[x + ladea - 4, base - hh + 1], [x + w + ladea + 4, base - hh + 1], [x + w * 0.7 + ladea * 2, base - hh - 14], [x + w * 0.5 + ladea * 3.4, base - hh - w * 1.5]], (px, py) => (px < x + ladea + w * 0.45 ? "#33285a" : "#1f1832")); for (let y = base - hh + 8; y < base - 8; y += 13) { const vx = x + w * 0.5 + ladea * (base - y) / hh; k.R(vx - 3, y - 1, 6, 8, "#1a1428"); k.R(vx - 2, y, 4, 6, "#ffcf6a"); k.R(vx - 2, y + 2, 4, 1, "#c8902a"); k.R(vx, y, 1, 6, "#c8902a"); } };
    torreT(112, 118, 24, 58, -6, 92); torreT(186, 118, 22, 50, 7, 93); torreT(148, 118, 34, 78, 4, 94);
    rellena(k, [[120, 118], [126, 84], [200, 80], [208, 118]], muro(120, 88, 95));
    for (let x = 130; x < 198; x += 12) T.ventana(k, x, 92 + (x % 3), 6, 12, { arco: true, marco: "#1a1428", vidrio: "#ffcf6a", brillo: "#ffe8a0" });
    k.R(124, 82, 80, 2, MUR9[0]); for (let x = 124; x < 204; x += 6) k.R(x, 79 - (x % 12 === 4 ? 2 : 0), 3, 3, MUR9[2]);
    [[128, 80], [196, 77]].forEach(([x, y], i) => { k.poli([[x - 4, y], [x + 4, y], [x + 2, y - 5], [x - 2, y - 5]], "#1c1628"); k.poli([[x - 2, y - 5], [x - 9 + i * 18, y - 9], [x - 4 + i * 8, y - 3]], "#1c1628"); k.P(x - 1, y - 4, "#ff6a5a"); });
    k.elipse(164, 108, 10, 10, "#140e20"); k.R(154, 108, 20, 10, "#140e20"); k.R(154, 116, 20, 2, "#3a3050"); for (let i = 0; i < 4; i++) k.R(150 - i * 2, 118 + i * 2, 28 + i * 4, 2, MUR9[2 + (i % 2)]);
    rellena(k, [[-2, 118], [322, 118], [322, 180], [-2, 180]], T.tex(["#3e4a44", "#323e38", "#28322e", "#1e2824", "#161e1a"], { v0: 0.2, s: 96, dy: 0.5, y0: 118, alto: 62, g: 0.5 }));
    briznas(k, 0, W, 120, ["#1a2420", "#2a3a32", "#3e5246"], { n: 260, alto: 4, s: 97, y1: 180 });
    for (let y = 122; y < 180; y++) { const f = (y - 122) / 58, c = 164 + Math.sin(f * 3.4) * f * 22, w = 4 + f * 18; for (let x = Math.round(c - w); x <= c + w; x++) { const cel = celdas(x, y * 1.6, 7 + f * 6, 5 + f * 4, 98, 0.6); k.P(x, y, cel.borde < 0.12 ? "#1e1c26" : rampa(["#6a6878", "#56546a", "#44425a", "#34324a"], 0.2 + (cel.id - 0.5) * 0.4 + f * 0.3, x, y)); } }
    for (let x = 0; x < W; x += 5) { if (Math.abs(x - 164) < 14) continue; k.R(x, 120, 1, 9, "#18141e"); k.P(x, 119, "#2a2434"); } k.R(0, 122, 150, 1, "#18141e"); k.R(178, 122, 142, 1, "#18141e");
    [[30, 142, -2], [70, 158, 2], [224, 150, -2], [270, 136, 3], [112, 170, 2], [206, 172, -3], [48, 132, 1]].forEach(([x, y, l], i) => { sombraE(k, x + 6, y + 1, 8, 2, 0.5); if (i % 2) { rellena(k, [[x, y], [x + 1 + l, y - 13], [x + 8 + l, y - 13], [x + 9, y]], (px, py) => rampa(["#8a8898", "#6e6c7e", "#545266", "#3e3c4e"], 0.15 + (px - x) / 12, px, py)); k.elipse(x + 5 + l, y - 13, 4, 3, "#7a7888"); k.R(x + 3 + l * 0.6, y - 10, 4, 1, "#3e3c4e"); k.R(x + 3 + l * 0.6, y - 7, 4, 1, "#3e3c4e"); } else { k.R(x + 4 + l * 0.5, y - 15, 2, 15, "#5a5868"); k.R(x + 1 + l * 0.6, y - 11, 8, 2, "#5a5868"); k.P(x + 4 + l * 0.5, y - 15, "#7a7888"); } });
    rellena(k, [[90, 152], [104, 152], [102, 156], [92, 156]], () => "#1a1420"); trazo(k, [[96, 152], [95, 145], [93, 142]], "#7a9a6a", 2); [[91, 141], [93, 140], [95, 141], [97, 142]].forEach(([x, y]) => k.R(x, y - 2, 1, 3, "#8aaa7a"));
    [[244, 166], [58, 170]].forEach(([x, y]) => { esfera(k, x, y, 6, 5, ["#ffb04a", "#e8862a", "#c0601a", "#8a4010"]); k.R(x - 1, y - 7, 2, 2, "#3a5a2a"); k.crudo(x - 3, y - 2, 2, 2, "#ffcf6a"); k.crudo(x + 2, y - 2, 2, 2, "#ffcf6a"); k.crudo(x - 3, y + 2, 7, 1, "#ffcf6a"); });
    const seco = (x, b, d) => { rellena(k, [[x - 6, b], [x - 2, b - 40], [x + 3, b - 62], [x + 5, b - 40], [x + 8, b]], corteza(["#3a3046", "#2e263a", "#221c2e", "#181422", "#100c18"], x - 6, 14, { s: x + 99 })); [[-30, 18, 2], [-44, 30, 2], [-52, -16, 2], [-24, -20, 1], [-60, 24, 1]].forEach(([dy, l, g]) => trazo(k, [[x, b + dy], [x + d * Math.abs(l), b + dy - Math.abs(l) * 0.7], [x + d * Math.abs(l) * 1.4, b + dy - Math.abs(l) * 0.5]], "#1a1420", g, 1)); };
    seco(10, 130, 1); seco(306, 132, -1); seco(-2, 182, 1); seco(322, 184, -1);
    bruma(k, 112, 180, "#8a86b0", 0.5, { s: 100, ey: 0.16 });
    for (let i = 0; i < 9; i++) { const x = 150 + hash(i, 1, 101) * 150, y = 10 + hash(i, 2, 101) * 40; k.R(x - 3, y, 3, 1, "#0e0a18"); k.R(x + 1, y, 3, 1, "#0e0a18"); k.P(x, y + 1, "#0e0a18"); k.P(x - 4, y - 1, "#0e0a18"); k.P(x + 4, y - 1, "#0e0a18"); }
    luces(k, [{ x: 164, y: 100, r: 60, ry: 28, col: "#ffcf7a", f: 0.55 }, { x: 244, y: 164, r: 14, col: "#ffb45a", f: 0.8 }, { x: 58, y: 168, r: 14, col: "#ffb45a", f: 0.8 }]);
  }
  O[9] = ["Threllir Bark", "La isla de los muertos, con su castillo bajo la luna", thriller, { base: "noche", astro: "siempre", tinte: 0.6, fuego: ["#ffcf6a", "#ffe8a0", "#c8902a"] }];

  function punk(k) {
    k.banda(["#8ab0d8", "#a8c4e0", "#c8d8ea", "#e6eef4"], 0, 110);
    for (let y = 0; y < 110; y++) for (let x = 0; x < 160; x++) { const v = (1 - x / 160) * (0.4 + fbm(x * 0.03, y * 0.05, 621) * 0.5); if (v > 0.35) k.P(x, y, rampa(["#e8a080", "#c87a64", "#a05a4c", "#7a4038"], 0.2 + (1 - v) * 0.8, x, y)); }
    pluma(k, 54, 50, 50, 14, ["#6a5a5a", "#544646", "#3e3434", "#2c2424"], { s: 622, viento: 0.5 });
    montana(k, 54, 112, 140, 70, { roca: ["#5a4040", "#4a3434", "#3a2828", "#2c1e1e", "#201414"], rugosa: 1.4 });
    for (let i = 0; i < 5; i++) { let x = 48 + i * 4, y = 46; for (let j = 0; j < 34; j++) { x += (hash(i, j, 623) - 0.5) * 5 + (i - 2) * 0.8; y += 2; k.crudo(x, y, 2, 2, j % 3 === 0 ? "#ffe06a" : j % 3 === 1 ? "#ff9a3a" : "#e8502a"); } }
    const HI = ["#ffffff", "#ecf6fc", "#d4eaf6", "#b4d6ec", "#8cbcdc", "#6a9cc4", "#4a7aa8"];
    const macizo = [[330, 114], [330, 30], [300, 22], [278, 20], [256, 34], [236, 50], [214, 76], [190, 98], [176, 114]];
    rellena(k, macizo, (x, y) => { const d = x - y * 0.6, u = ((d % 26) + 26) % 26 / 26, cara = Math.floor(d / 26), grieta = u > 0.96 && fbm(x * 0.05, y * 0.05, 2801) > 0.45; return grieta ? HI[6] : rampa(HI, 0.06 + u * 0.55 + (cara % 2 ? 0.1 : 0) + ((y - 20) / 94) * 0.15 + (fbm(x * 0.08, y * 0.08, 2802) - 0.5) * 0.1, x, y); });
    for (let i = 1; i < macizo.length - 1; i++) { const [ax, ay] = macizo[i], [bx, by] = macizo[i + 1]; trazo(k, [[ax, ay], [bx, by]], "#ffffff", 2); trazo(k, [[ax, ay + 2], [bx, by + 2]], HI[2], 1); }
    [[262, 40], [244, 56], [222, 78], [298, 34], [312, 48]].forEach(([x, y], i) => { for (let j = 0; j < 4; j++) { const l = 3 + hash(i, j, 2803) * 6; k.poli([[x + j * 3, y], [x + j * 3 + 2, y], [x + j * 3 + 1, y + l]], j % 2 ? HI[1] : HI[3]); } });
    [[246, 114, 20, 56], [276, 114, 26, 74], [308, 114, 18, 46], [214, 114, 16, 36], [192, 114, 12, 22]].forEach(([x, b, w, a]) => { rellena(k, [[x - 1, b], [x + w * 0.4, b - a - 1], [x + w + 1, b]], () => HI[6]); rellena(k, [[x, b], [x + w * 0.4, b - a], [x + w * 0.55, b]], (px, py) => rampa(HI, (py - b + a) / a * 0.2, px, py)); rellena(k, [[x + w * 0.4, b - a], [x + w, b], [x + w * 0.55, b]], (px, py) => rampa(HI, 0.5 + (py - b + a) / a * 0.3, px, py)); trazo(k, [[x + w * 0.2, b - 4], [x + w * 0.38, b - a + 6]], "#ffffff"); });
    const GR = ["#e8ecf0", "#ccd2da", "#aab2be", "#8a94a2", "#6c7684"];
    T.rect(k, 124, 64, 72, 50, (x, y) => rampa(GR, 0.1 + ((x - 124) / 72) * 0.5 + (y % 8 === 0 ? 0.15 : 0), x, y));
    bola(k, 160, 64, 30, 22, (x, y) => (y > 64 ? null : rampa(["#bfe4f8", "#8ac8ec", "#5aa6d8", "#3a84b8", "#2a6694"], 0.1 + ((x - 160) / 30) * 0.4 + ((y - 42) / 22) * 0.3 + (Math.round(x - 130) % 8 === 0 ? 0.15 : 0), x, y)));
    for (let f = 0; f < 2; f++) for (let x = 130; x < 192; x += 10) T.ventana(k, x, 72 + f * 14, 6, 7, { marco: GR[4], vidrio: "#3f6f9a" });
    k.R(152, 98, 16, 16, "#4a5260"); k.R(153, 99, 14, 15, "#6a7484");
    trazo(k, [[196, 90], [214, 90], [222, 100], [240, 100]], GR[3], 4); trazo(k, [[124, 84], [104, 84], [98, 96]], GR[3], 4);
    k.poli([[178, 100], [186, 100], [182, 93]], "#f2c84b"); k.P(182, 98, "#1c1c22"); k.P(182, 96, "#1c1c22");
    T.rect(k, 0, 112, W, 68, (x, y) => { const lado = x + (y - 112) * 0.4 < 166; if (lado) { const c = celdas(x, y * 1.4, 12, 8, 624, 0.7); return c.borde < 0.1 ? (c.borde < 0.05 ? "#ffe06a" : "#ff8a3a") : rampa(["#4a3434", "#3a2828", "#2c1e1e", "#201414"], 0.2 + (c.id - 0.5) * 0.4, x, y); } return Math.sin(x / 9 + y / 4) > 0.88 ? "#ffffff" : rampa(["#f0f8fc", "#dcecf6", "#c4dcee", "#a8c8e2"], 0.1 + ((y - 112) / 68) * 0.6, x, y); });
    for (let i = 0; i < 6; i++) { const x0 = 200 + i * 20, y0 = 120 + (i % 3) * 16; trazo(k, [[x0, y0], [x0 + 6, y0 + 3], [x0 + 4, y0 + 8], [x0 + 10, y0 + 12]], HI[5], 1); }
    bruma(k, 100, 180, "#f0f0f4", 0.6, { s: 626, perfil: (x, y) => Math.max(0, 1 - Math.abs(x + (y - 112) * 0.4 - 166) / 30) });
    [[30, 150], [80, 170]].forEach(([x, b], i) => fuego(k, x, b, 12, 18, { s: 627 + i }));
    P.nieve(k, 70, 628, { y0: 0, y1: 180 });
    luces(k, [{ x: 30, y: 144, r: 34, ry: 20, col: "#ff9a4a", f: 1 }, { x: 80, y: 164, r: 34, ry: 20, col: "#ff9a4a", f: 1 }]);
  }
  O[28] = ["Funk Hazard", "La isla partida en dos, mitad fuego y mitad hielo", punk, { tinte: 0.6, ven: ["#3f6f9a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ff8a3a", "#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];

  function drossresa(k) {
    const lit = encendido(k), B = 16;
    k.banda(["#6aa8e0", "#92c0ea", "#c4dcf0", "#f4ead8"], 0, 104);
    nubarron(k, 60, 30, 70, 12); nubarron(k, 250, 18, 66, 10);
    rellena(k, [[-2, 104], [-2, 34 + B], [10, 28 + B], [100, 26 + B], [118, 34 + B], [130, 104]], (x, y) => rampa(["#ecc890", "#d8b07a", "#c09666", "#a07c52", "#806040"], 0.2 + 0.25 * Math.sin(y / 3.6 + Math.sin(x / 17) * 2) + ((x - 60) / 70) * 0.3 + (y < 34 + B ? -0.2 : 0), x, y));
    const BL = ["#ffffff", "#f6f2ea", "#e6e0d2", "#ccc4b2", "#aaa290"];
    T.rect(k, 14, 8 + B, 84, 20, (x, y) => rampa(BL, 0.1 + ((x - 14) / 84) * 0.5 + (fbm(x * 0.3, y * 0.3, 251) - 0.5) * 0.15, x, y));
    [[20, 6 + B], [50, 0 + B], [84, 6 + B]].forEach(([x, top]) => { T.rect(k, x - 5, top, 10, 10, (px, py) => rampa(BL, 0.1 + (px - x + 5) / 10 * 0.6, px, py)); bola(k, x, top, 6, 6, (px, py) => (py > top ? null : rampa(["#ffb07a", "#f08a50", "#d06a36", "#a04e24"], 0.1 + (px - x + 6) / 12 * 0.7, px, py))); k.R(x, top - 9, 1, 3, "#5a4a3a"); Det.bandera(k, x + 1, top - 9, 4, 2, "#e84a6a"); });
    for (let x = 18; x < 96; x += 7) T.ventana(k, x, 14 + B, 3, 6, { marco: BL[4], vidrio: "#f2d27a", cruz: false, arco: true });
    const CO = ["#f6dcb0", "#e6c494", "#d0a878", "#b08a5e", "#8a6a44", "#604a2e"];
    bola(k, 256, 46, 66, 12, (x, y) => rampa(["#e8c890", "#d8b07a"], 0.4, x, y)); bola(k, 256, 46, 58, 9, (x, y) => rampa(["#dcb478", "#c89a62", "#b08452"], 0.2 + (y - 37) / 18, x, y));
    T.rect(k, 190, 46, 132, 58, (x, y) => { const u = (x - 256) / 66; return rampa(CO, 0.1 + Math.abs(u + 0.3) * 0.5 + (fbm(x * 0.2, y * 0.2, 252) - 0.5) * 0.2, x, y); });
    for (let f = 0; f < 3; f++) for (let x = 194; x < 320; x += 9) { const y = 52 + f * 17; T.rect(k, x, y, 6, 12, () => CO[5]); k.elipse(x + 3, y, 3, 2, CO[5]); k.R(x - 1, y + 12, 8, 1, CO[0]); }
    for (let x = 192; x < 320; x++) { k.P(x, 46, CO[0]); k.P(x, 104, CO[4]); }
    [[206, 30], [244, 26], [286, 30]].forEach(([x, y], i) => { k.R(x, y, 1, 18, "#5a4a3a"); Det.bandera(k, x + 1, y, 10, 6, ["#e84a6a", "#f2c84b", "#e86a2a"][i]); });
    const PARED = [["#fffaf0", "#f6ecd6", "#eadcbc", "#d6c4a0", "#b8a07c"], ["#fbe8c8", "#f2d6a8", "#e4c08a", "#cca270", "#a8845a"], ["#fff2e6", "#f8dcc6", "#ecc2a6", "#d6a486", "#b48668"]];
    const vents = [];
    [[-4, 60], [24, 42], [58, 38], [92, 52], [148, 46], [180, 40], [212, 48], [244, 40], [274, 50]].forEach(([x, hh], i) => vents.push(...T.casa(k, x, 116, 30 + (i % 3) * 3, hh, { pared: PARED[i % 3], techo: PAL.TEJA_R, s: 253 + i, ventanas: [0.2, 0.68], puerta: 0.45, pisos: hh > 44 ? 3 : 2, contra: i % 2 ? "#3f8a5a" : "#3a6aa8", ven: "#f2d27a", frente: i % 4 === 1 })));
    for (let i = 0; i < 9; i++) { const x = 6 + i * 36; k.R(x, 96, 14, 1, "#5a4a3a"); for (let j = 0; j < 4; j++) k.P(x + 2 + j * 3, 95, ["#e8402a", "#f6d84a", "#e86aa8", "#ffffff"][(i + j) % 4]); }
    T.banderines(k, 0, 60, 320, 64, 14, ["#e8402a", "#f2c84b", "#3f8ac0", "#3fb85a", "#e86aa8"]); T.banderines(k, 0, 84, 320, 82, 10, ["#f2c84b", "#e8402a", "#ffffff", "#3fb85a"]);
    suelo3d(k, 116, 180, 160, 84, losas3d(["#f2dcb8", "#e2c89e", "#ccb084", "#b0946a", "#8e7450"], { tx: 17, tz: 12, s: 262 })); k.R(0, 116, W, 1, "#fff0d8"); k.alfa(0.3, () => k.R(0, 117, W, 2, "#5a4630"));
    const girasol = (x, base, hh, s) => { trazo(k, [[x, base], [x + 1, base - hh]], "#4a8a3a", 2); [[-1, 0.4], [1, 0.6]].forEach(([d, f]) => fronda(k, x, base - hh * f, d * 0.8, -0.2, 6, ["#8ad070", "#6ab050", "#4a8a3a", "#3a6a2a"], { caida: 0.4, foliolo: 2 })); for (let a = 0; a < Math.PI * 2; a += 0.45) { const px = x + Math.cos(a) * 5, py = base - hh + Math.sin(a) * 4.5; k.elipse(px, py, 2, 2, hash(a * 10, s, 263) > 0.5 ? "#f8d030" : "#f0b820"); } k.elipse(x, base - hh, 3, 3, "#6a3a1a"); k.P(x - 1, base - hh - 1, "#8a5a2a"); };
    [[12, 180, 30], [28, 176, 24], [42, 180, 34], [6, 160, 20], [276, 180, 32], [292, 176, 26], [308, 180, 30], [314, 158, 22]].forEach(([x, b, hh], i) => girasol(x, b, hh, i));
    const soldado = (x, b) => { sombraE(k, x + 1, b, 4, 1, 0.4); k.R(x, b - 7, 2, 7, "#c8a070"); k.R(x - 3, b - 15, 7, 8, "#e8402a"); k.R(x - 3, b - 12, 7, 1, "#f2c84b"); k.R(x - 2, b - 20, 5, 5, "#e8c4a0"); k.R(x - 3, b - 24, 7, 4, "#26262a"); k.R(x - 1, b - 26, 3, 2, "#26262a"); k.P(x - 1, b - 18, "#26262a"); k.P(x + 1, b - 18, "#26262a"); trazo(k, [[x + 4, b - 14], [x + 9, b - 26]], "#c8c8d0"); };
    soldado(66, 136); const peluche = (x, b, c) => { sombraE(k, x + 1, b, 4, 1, 0.4); esfera(k, x, b - 4, 4, 4, c); esfera(k, x, b - 10, 3.5, 3.5, c); k.elipse(x - 3, b - 13, 1.5, 1.5, c[2]); k.elipse(x + 3, b - 13, 1.5, 1.5, c[2]); k.P(x - 1, b - 11, "#26262a"); k.P(x + 1, b - 11, "#26262a"); };
    peluche(246, 130, ["#e8c8a0", "#d0a878", "#a88050"]); peluche(258, 132, ["#f8d8e8", "#e8b0c8", "#c88aa8"]);
    luces(k, vents.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  O[14] = ["Drossresa", "La ciudad del amor, con su coliseo, sus tejados naranjas y sus girasoles", drossresa, { ven: ["#f2d27a", "#ffd27a"], tinte: 0.1, dx: 22 }];

  const ELE = ["#9aa8c4", "#8494b2", "#6e7e9c", "#5a6886", "#465270", "#323c56", "#232a40"];
  function zuo(k) {
    const lit = encendido(k);
    k.banda(["#101a34", "#18244a", "#22305c", "#2e3e6c"], 0, 124);
    for (let i = 0; i < 60; i++) k.crudo(hash(i, 1, 2951) * W, hash(i, 2, 2951) * 70, 1, 1, i % 5 ? "#c8d4ff" : "#ffffff");
    const luna = (x, y) => lit > 0 && hash(x, y, 2952) > 0.2;
    for (let t = 0; t < 1; t += 0.006) { const x = 160 + Math.sin(t * 2.6) * 34, y = 44 - t * 46, r = 12 - t * 6; bola(k, x, y, r, r, (px, py) => rampa(ELE, 0.3 + ((px - x) / r) * 0.32 + (Math.round(t * 170 + py / 3) % 9 === 0 ? 0.3 : 0), px, py)); if (Math.round(t * 1000) % 30 === 0) k.crudo(x + r * 0.6, y - r * 0.4, 1, 1, "#b8c8ec"); }
    for (let i = 0; i < 22; i++) { const a = hash(i, 1, 2953) * 2.6 + 0.2, l = 6 + hash(i, 2, 2953) * 26; k.crudo(189 + Math.cos(a) * l, 2 + Math.sin(a) * l * 0.6, 1, 3, "#d8f4fa"); }
    const oreja = (x, d) => {
      const pts = [[x, 52], [x + d * 22, 26], [x + d * 58, 16], [x + d * 92, 26], [x + d * 106, 52], [x + d * 102, 82], [x + d * 84, 102], [x + d * 62, 108], [x + d * 40, 118], [x + d * 16, 112], [x, 96]];
      rellena(k, pts, (px, py) => { const u = Math.abs(px - x) / 106, v = (py - 16) / 102, r = Math.hypot(u - 0.42, v - 0.5); if (r > 0.52) return ELE[2]; const vena = Math.sin(u * 19 + v * 8 + Math.sin(v * 12) * 0.8) > 0.9; return vena ? ELE[5] : rampa(["#8a7a98", "#76668a", "#62567a", "#4e4468"], r * 1.4 + v * 0.2, px, py); });
      for (let i = 1; i < pts.length - 1; i++) { trazo(k, [pts[i - 1], pts[i]], ELE[6], 1); if (i < 5 && lit > 0) trazo(k, [[pts[i - 1][0], pts[i - 1][1] - 1], [pts[i][0], pts[i][1] - 1]], "#9aaee0", 1); }
    };
    oreja(118, -1); oreja(202, 1);
    [[1, 112], [-1, 208]].forEach(([d, x]) => { for (let t = 0; t < 1; t += 0.02) { const px = x - d * (4 + t * 24), py = 104 - Math.sin(t * 2.2) * 28 - t * 6, g = 6 - t * 4; k.R(px - g / 2, py, g, 3, t > 0.8 ? "#ffffff" : t > 0.4 ? "#f4ecd8" : "#ddd2b8"); k.P(px + d * g / 2, py + 2, "#a89c84"); } });
    const cab = (x, y, r) => bola(k, x, y, r, r * 1.05, (px, py) => { const arruga = Math.sin(py / 2.9 + Math.sin(px / 16) * 1.3) > 0.82; return rampa(ELE, 0.16 + ((px - 160) / 62) * 0.3 + ((py - 66) / 56) * 0.34 + 0.2 + (arruga ? 0.16 : 0), px, py); });
    cab(160, 64, 46);
    rellena(k, [[104, 118], [112, 80], [208, 80], [216, 118]], (px, py) => rampa(ELE, 0.34 + ((px - 160) / 62) * 0.3 + (Math.sin(py / 2.9 + Math.sin(px / 16)) > 0.8 ? 0.14 : 0), px, py));
    for (let y = 30; y < 74; y++) k.alfa(0.5, () => k.P(160 + Math.sin(y / 9) * 1.5, y, ELE[5]));
    if (lit > 0) for (let a = Math.PI * 1.12; a < Math.PI * 1.88; a += 0.01) k.alfa(0.7, () => k.crudo(160 + Math.cos(a) * 45, 64 + Math.sin(a) * 48, 1, 1, "#9aaee0"));
    for (let i = 0; i < 18; i++) copa(k, i * 20 - 4, 106 + (i % 3) * 4, 16, 14, ["#3a6a5a", "#2e5a4c", "#244a3e", "#1a3a30", "#122a22"], { r: 5, s: 632 + i });
    T.prado(k, 118, ["#4a7a5a", "#3e6a4e", "#325a42", "#284a36", "#1e3a2a", "#162c20"], 637, { flores: { n: 22, cols: ["#e8e0ff", "#c8b8f8"] } });
    for (let y = 122; y < H; y++) { const f = (y - 122) / 58, c = 164 + Math.sin(f * 2.6) * 12 * f, w = 4 + f * 18; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(["#8a8070", "#76705e", "#625c4e", "#4e4a3e"], 0.2 + Math.abs(x - c) / w * 0.4 + (fbm(x * 0.2, y * 0.3, 638) - 0.5) * 0.3, x, y)); }
    const vents = [];
    const casa = (x, b, r, s) => {
      sombraE(k, x + 2, b + 1, r + 3, 2, 0.5);
      T.rect(k, x - r, b - r, r * 2, r, (px, py) => { const tronco = (px - x + r) % 3 === 0; return tronco ? "#5a3e28" : rampa(["#c89a6a", "#a87c50", "#8a603a", "#6a4628"], 0.15 + ((px - x + r) / (r * 2)) * 0.6 + (py - b + r) / (r * 4), px, py); });
      rellena(k, [[x - r - 4, b - r + 1], [x, b - r * 2.3], [x + r + 4, b - r + 1]], (px, py) => { const paja = Math.sin(px * 1.3 + py * 0.4) > 0.5; return rampa(["#b8a060", "#9a8448", "#7c6a36", "#5e5028"], 0.15 + ((px - x) / r) * 0.25 + (paja ? 0.15 : 0), px, py); });
      for (let i = 0; i <= r * 2 + 8; i++) { const px = x - r - 4 + i; k.P(px, b - r + 1 + (i % 2), "#5e5028"); }
      if (lit > 0) trazo(k, [[x - r - 4, b - r + 1], [x, b - r * 2.3]], "#c8d0f0", 1);
      k.R(x - 2, b - 7, 5, 7, "#3a2414"); k.R(x - 1, b - 6, 3, 6, "#ffd27a"); vents.push([x, b - 4]);
      k.elipse(x + r * 0.55, b - r * 0.55, 2, 2, "#3a2414"); k.elipse(x + r * 0.55, b - r * 0.55, 1.5, 1.5, "#ffd27a"); vents.push([x + r * 0.55, b - r * 0.55]);
      k.R(x - r * 0.65, b - 9, 1, 4, "#3a2a20"); k.elipse(x - r * 0.65, b - 4, 1.5, 2, "#e8402a"); vents.push([x - r * 0.65, b - 4]);
    };
    casa(30, 140, 13, 633); casa(76, 134, 10, 634); casa(248, 134, 11, 635); casa(292, 140, 14, 636);
    const farolillos = [];
    [[40, 100, 120, 108], [204, 106, 290, 100]].forEach(([x0, y0, x1, y1]) => { for (let i = 0; i <= 80; i++) { const t = i / 80, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 6; k.P(x, y, "#2a2018"); if (i % 16 === 8) farolillos.push([x, y + 3]); } });
    farolillos.forEach(([x, y], i) => { k.elipse(x, y, 2, 3, i % 2 ? "#e8402a" : "#f2c84b"); if (lit > 0) k.crudo(x - 1, y - 1, 2, 3, "#fff0c0"); });
    for (let i = 0; i < 26; i++) { const x = 20 + hash(i, 1, 639) * 280, y = 96 + hash(i, 2, 639) * 70; k.crudo(x, y, 1, 1, "#e8f87a"); if (i % 3 === 0) k.alfa(0.4, () => k.crudo(x - 1, y - 1, 3, 3, "#c8e85a")); }
    luces(k, [...vents.map(([x, y]) => ({ x, y, r: 16, ry: 11, col: LUZ, f: lit })), ...farolillos.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: "#ffcf7a", f: lit * 0.8 }))]);
  }
  O[29] = ["Zuo", "El ducado de los minks, sobre el lomo de un elefante gigante", zuo, { tinte: 0.1, ven: VEN, dx: 70 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, rotulo, humo, cilindro, bandera } = Det;
  const { bola, mezcla, hash, fbm, celdas, trazo, madera, piedra, copa, briznas, fronda, sombraE, luces, bruma, pluma, encendido, bezier } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15;
  const W = 320, H = 180;
  window.SitiosIt19 = window.SitiosIt19 || {};
  const O = (window.SitiosIt19.piratas = window.SitiosIt19.piratas || {});
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const rotuloLuz = (k, x, y, texto, col, e = 1) => rotulo({ P: (px, py, c) => k.crudo(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const ROSA = ["#ffe6f0", "#fcc8dc", "#f4a0c0", "#dc7aa0", "#b0527a", "#7c3456"], TUBO = ["#6a7aaa", "#4a5888", "#33406a", "#232c4c", "#161c34"];
  const NUBE = ["#ffffff", "#f6f9fc", "#e2ecf6", "#c4d4e8"], NEON = ["#e0fcff", "#7ae8ff", "#3ac0e8", "#2a8ab8"], BLANCO = ["#ffffff", "#f2f4f8", "#dfe4ec", "#c4ccd8", "#a4aebc"];
  const SELVA = ["#8ad890", "#5cbc6c", "#3e9c54", "#2c7c44", "#1e5c34"], ARENA = ["#fff0d0", "#f6e2b4", "#ead098", "#d8b880"];
  const CIELO = ["#3a86d8", "#62a8e8", "#9ccaf0", "#d8ecf8"];

  function nubeGrande(k, cx, cy, w, h, s) {
    const n = Math.round(w / 9);
    for (let i = 0; i < n; i++) { const t = i / (n - 1), x = cx - w + t * w * 2, r = h * (0.55 + 0.45 * Math.sin(t * Math.PI)) * (0.8 + hash(i, 1, s) * 0.4), y = cy - r * 0.35 + hash(i, 2, s) * 4; bola(k, x, y, r, r * 0.82, (px, py) => rampa(NUBE, 0.05 + ((py - y + r) / (r * 2)) * 0.7 + ((px - x) / r) * 0.12, px, py)); }
    bola(k, cx, cy + h * 0.25, w, h * 0.55, (px, py) => rampa(NUBE, 0.35 + ((py - cy) / h) * 0.5, px, py));
  }
  function anillo(k, cx, cy, rx, ry, frente) {
    for (let a = 0; a < Math.PI * 2; a += 0.004) { const delante = Math.sin(a) > 0; if (delante !== frente) continue; const x = cx + Math.cos(a) * rx, y = cy + Math.sin(a) * ry; k.alfa(frente ? 0.9 : 0.5, () => k.crudo(x, y, 1, 1, NEON[1])); if (Math.round(a * 100) % 40 === 0) k.crudo(x - 1, y - 1, 3, 1, NEON[0]); }
  }
  function labophase(k, cx, cy, rx, ry, { letrero = 1, s = 1 } = {}) {
    const corona = (x) => cy - ry * 0.58 + Math.abs((((x - cx) / (rx * 0.17)) % 2 + 2) % 2 - 1) * ry * 0.2;
    bola(k, cx, cy - ry * 0.58, rx * 0.8, ry * 0.14, (x, y) => rampa(["#b0527a", "#8a3e62", "#6a2c4a"], 0.2 + (y - cy + ry * 0.7) / (ry * 0.3), x, y));
    for (let i = 0; i < 9; i++) { const x = cx - rx * 0.62 + i * (rx * 1.24 / 8); copa(k, x, cy - ry * 0.64 + (i % 2) * 2, rx * 0.12, ry * 0.07, SELVA, { r: 2, s: s + i }); }
    bola(k, cx, cy, rx, ry, (x, y) => (y < corona(x) ? null : rampa(ROSA, 0.12 + ((x - cx) / rx) * 0.38 + ((y - cy) / ry) * 0.22 + (fbm(x * 0.1, y * 0.1, s) - 0.5) * 0.06, x, y)));
    for (let x = Math.round(cx - rx); x <= cx + rx; x++) { const y = corona(x), dentro = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1; if (dentro) { k.P(x, y, ROSA[0]); k.P(x, y + 1, ROSA[3]); } }
    for (let f = 0; f < 2; f++) { const fy = cy + ry * (0.05 + f * 0.28), ancho = rx * Math.sqrt(1 - ((fy - cy) / ry) ** 2) * 0.86; for (let x = cx - ancho; x < cx + ancho; x += Math.max(5, rx * 0.16)) { k.elipse(x, fy, Math.max(1.5, rx * 0.04), Math.max(1.5, rx * 0.04), TUBO[3]); k.crudo(x - 0.5, fy - 0.5, Math.max(1, rx * 0.04), Math.max(1, rx * 0.04), NEON[1]); } }
    const g = Math.max(2, Math.round(rx * 0.09));
    [[bezier([cx - rx * 1.05, cy + ry * 0.7], [cx - rx * 1.3, cy - ry * 0.2], [cx - rx * 0.3, cy - ry * 0.95], [cx + rx * 0.35, cy - ry * 0.62], 30)], [bezier([cx + rx * 1.02, cy + ry * 0.5], [cx + rx * 1.35, cy - ry * 0.4], [cx + rx * 0.6, cy - ry * 1.0], [cx - rx * 0.1, cy - ry * 0.7], 30)]].forEach(([pts]) => { trazo(k, pts, TUBO[3], g + 1, g + 1); trazo(k, pts, (f) => TUBO[f < 0.5 ? 1 : 2], g, g); trazo(k, pts.map(([x, y]) => [x - g * 0.3, y - g * 0.3]), TUBO[0], 1); });
    if (letrero) { const texto = "PUNK RECORDS", e = letrero, ancho = texto.length * 4 * e, x0 = Math.round(cx - ancho / 2), y0 = Math.round(cy - ry * 0.36); k.R(x0 - 2 * e, y0 - 2 * e, ancho + 3 * e, 9 * e, ROSA[4]); k.R(x0 - 2 * e, y0 - 2 * e, ancho + 3 * e, e, ROSA[2]); rotuloLuz(k, x0, y0, texto, "#ffffff", e); }
  }
  function buque(k, x, y, d, e, s) {
    rellena(k, [[x - 22 * e, y], [x + 22 * e, y], [x + 17 * e, y + 8 * e], [x - 17 * e, y + 8 * e]], (px, py) => rampa(BLANCO, 0.1 + (py - y) / (9 * e), px, py)); k.R(x - 22 * e, y + 2 * e, 44 * e, Math.max(1, e * 1.5), "#2f5fa8");
    [-8, 6].forEach((dx) => { const mx = x + dx * e * d; k.R(mx, y - 30 * e, Math.max(1, e * 1.4), 30 * e, "#6d4628"); [[y - 27 * e, 11 * e, 9 * e], [y - 15 * e, 14 * e, 11 * e]].forEach(([vy, w, a]) => { rellena(k, [[mx - w / 2, vy], [mx + w / 2 + 1, vy], [mx + w / 2 + 2, vy + a], [mx - w / 2 - 1, vy + a]], (px, py) => rampa(["#ffffff", "#f2f2ee", "#dedad2", "#c4c0b6"], 0.05 + ((px - mx + w / 2) / (w + 3)) * 0.5, px, py)); trazo(k, [[mx - 3 * e, vy + a * 0.55], [mx, vy + a * 0.35], [mx + 3 * e, vy + a * 0.55]], "#2f5fa8"); }); });
    k.alfa(0.4, () => k.elipse(x, y + 9 * e, 24 * e, 1.5, "#ffffff"));
  }
  const palma = (k, x, b, a, s, inc = 0.15) => { sombraE(k, x + 4, b, 12, 2, 0.35); P.palmera(k, x, b, a, { s, inc }); };
  function robot(k, x, b) { const ME = ["#eef4f8", "#d0dae2", "#aebac4", "#8a96a2", "#6a7682"]; sombraE(k, x, b + 1, 8, 2, 0.4); k.R(x - 3, b - 7, 3, 7, ME[3]); k.R(x + 1, b - 7, 3, 7, ME[3]); cilindro(k, x - 6, b - 18, 13, 12, ME, 0.3); k.R(x - 5, b - 14, 11, 1, NEON[2]); esfera(k, x, b - 22, 5, 5, ME); k.R(x - 4, b - 23, 9, 2, "#26262a"); k.crudo(x - 3, b - 23, 7, 1, "#e8402a"); k.R(x - 9, b - 17, 3, 9, ME[2]); k.R(x + 7, b - 17, 3, 9, ME[2]); k.R(x - 1, b - 30, 1, 4, ME[3]); k.crudo(x - 1, b - 31, 1, 1, NEON[1]); }
  function paneles(k, y0, fy = 60) { rellena(k, [[-2, y0], [322, y0], [322, 182], [-2, 182]], (x, y) => rampa(BLANCO, 0.12 + ((y - y0) / (180 - y0)) * 0.5, x, y)); for (let i = -10; i <= 10; i++) trazo(k, [[160 + i * 16, y0], [160 + i * 44, 180]], i % 3 ? BLANCO[3] : NEON[2]); for (let y = y0 + 4, f = 0; y < 180; y += 4 + f * 2, f++) k.R(0, y, 320, 1, f % 2 ? BLANCO[3] : NEON[1]); k.alfa(0.25, () => k.R(0, y0, 320, 2, "#5a6a78")); }

  function v1(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 112);
    nubarron(k, -20, 74, 96, 16, NUBE); nubarron(k, 252, 66, 96, 18, NUBE); nubarron(k, 236, 14, 80, 12, NUBE); nubarron(k, 6, 20, 64, 10, NUBE);
    anillo(k, 160, 78, 124, 13, false);
    nubeGrande(k, 160, 70, 104, 24, 3110);
    labophase(k, 160, 36, 34, 32, { letrero: 1, s: 3111 });
    anillo(k, 160, 78, 124, 13, true);
    P.mar(k, 100, 128, PAL.MAR, { s: 3112, espejo: false });
    buque(k, 38, 112, 1, 0.62, 1); buque(k, 290, 114, -1, 0.66, 2); buque(k, 82, 118, 1, 0.42, 3); buque(k, 246, 120, -1, 0.44, 4);
    rellena(k, [[94, 126], [104, 108], [122, 98], [146, 92], [174, 92], [198, 98], [216, 108], [228, 126]], (x, y) => { const capa = Math.sin(y / 2.4 + Math.sin(x / 11) * 1.2) > 0.7; return rampa(["#f0dcae", "#dcc08a", "#c4a46e", "#a88a56"], 0.15 + ((x - 160) / 70) * 0.3 + (capa ? 0.15 : 0) + ((y - 92) / 34) * 0.2, x, y); });
    for (let i = 0; i < 12; i++) copa(k, 106 + i * 10, 96 + Math.abs(i - 5.5) * 1.6, 9, 6, SELVA, { r: 3, s: 3113 + i });
    [[124, 96, 22, 0.2], [146, 92, 28, -0.1], [172, 92, 26, 0.15], [196, 98, 20, -0.2], [158, 94, 18, 0.05]].forEach(([x, b, a, inc], i) => P.palmera(k, x, b, a, { s: 3125 + i, inc }));
    rellena(k, [[-2, 126], [322, 126], [322, 182], [-2, 182]], (x, y) => rampa(ARENA, 0.1 + ((y - 126) / 54) * 0.6 + (fbm(x * 0.05, y * 0.12, 3130) - 0.5) * 0.12, x, y));
    k.alfa(0.5, () => { for (let x = 0; x < 320; x++) k.P(x, 126 + Math.round(Math.sin(x / 9) * 1.2), "#ffffff"); }); k.alfa(0.25, () => k.R(0, 128, 320, 3, "#c8a878"));
    for (let i = 0; i < 18; i++) { const x = hash(i, 1, 3131) * 320, y = 134 + hash(i, 2, 3131) * 44; k.R(x, y, 2, 1, i % 2 ? "#fff6e4" : "#e8c8a0"); }
    palma(k, 14, 178, 64, 3132, 0.22); palma(k, 306, 176, 60, 3133, -0.22);
    luces(k, [{ x: 160, y: 30, r: 30, ry: 24, col: "#ffb8d8", f: lit * 0.6 }]);
  }

  function v2(k, o = {}) {
    const lit = encendido(k);
    k.banda(["#2a78d0", "#4f98e0", "#86c0ee", "#c8e4f8"], 0, 124);
    nubarron(k, -24, 30, 90, 14, NUBE); nubarron(k, 262, 20, 90, 16, NUBE); cirros(k, 6, 4, 30);
    anillo(k, 160, 104, 168, 12, false);
    labophase(k, 160, 70, 76, 62, { letrero: 2, s: 3140 });
    k.elipse(160, 118, 14, 12, ROSA[5]); k.R(146, 118, 28, 10, ROSA[5]); k.elipse(160, 118, 11, 10, NEON[2]); k.R(149, 118, 22, 10, NEON[2]); k.crudo(150, 110, 2, 18, NEON[0]); k.R(159, 108, 2, 20, ROSA[5]);
    for (let i = 0; i < 16; i++) { const x = i * 22 - 6 + (i % 2) * 6, y = 122 + (i % 3) * 2; bola(k, x, y, 16, 9, (px, py) => rampa(NUBE, 0.05 + ((py - y + 9) / 18) * 0.6, px, py)); }
    rellena(k, [[-2, 128], [322, 128], [322, 182], [-2, 182]], (x, y) => rampa(NUBE, 0.15 + ((y - 128) / 52) * 0.5 + (fbm(x * 0.04, y * 0.1, 3141) - 0.5) * 0.25, x, y));
    for (let i = 0; i < 10; i++) { const x = hash(i, 1, 3142) * 320, y = 140 + hash(i, 2, 3142) * 36; k.alfa(0.5, () => k.elipse(x, y, 14 + hash(i, 3, 3142) * 10, 2, NUBE[3])); }
    anillo(k, 160, 104, 168, 12, true);
    if (o.pacifistas) pacifistas(k); else if (!o.gorosei) { robot(k, 104, 140); robot(k, 218, 140); }
    if (o.gorosei) gorosei(k);
    luces(k, [{ x: 160, y: 118, r: 40, ry: 26, col: NEON[1], f: 0.5 + lit * 0.4 }]);
  }

  function v3(k) {
    const lit = encendido(k);
    k.banda(["#4a90dc", "#78b4ea", "#b4d8f4", "#e4f0f8"], 0, 120);
    nubeGrande(k, 262, 30, 34, 9, 3150); labophase(k, 262, 14, 10, 11, { letrero: 0, s: 3151 });
    const vents = [];
    [[0, 56, 70], [64, 70, 56], [236, 64, 58], [286, 50, 40]].forEach(([x, top, w], i) => {
      T.rect(k, x, top, w, 124 - top, (px, py) => rampa(BLANCO, 0.08 + ((px - x) / w) * 0.45, px, py)); bola(k, x + w / 2, top, w / 2, 8, (px, py) => (py > top ? null : rampa(ROSA, 0.2 + (px - x) / w * 0.6, px, py)));
      k.R(x, top + 8, w, 3, ROSA[3]); for (let y = top + 16; y < 116; y += 10) for (let vx = x + 4; vx < x + w - 6; vx += 9) { k.R(vx, y, 6, 4, "#3a4a5a"); k.crudo(vx + 1, y + 1, 4, 2, NEON[1]); vents.push([vx + 3, y + 2]); }
      const cx = x + w * 0.7; cilindro(k, cx, top - 26, 7, 26, BLANCO, 0.3); k.R(cx, top - 26, 7, 2, ROSA[3]); pluma(k, cx + 3, top - 27, 20, 7, ["#ffffff", "#f8eef4", "#ead8e4", "#d4c0d0"], { s: 3152 + i, viento: 0.5 });
    });
    [[118], [196]].forEach(([x]) => { T.rect(k, x, 34, 8, 92, (px, py) => (Math.floor((py + px) / 4) % 2 ? "#f2c84b" : "#2a2a30")); });
    T.rect(k, 112, 28, 98, 8, (px, py) => (Math.floor((px + py) / 4) % 2 ? "#f2c84b" : "#2a2a30")); k.R(112, 36, 98, 1, "#1a1a20");
    trazo(k, [[160, 36], [160, 52]], "#5a5a66", 2); const PA = ["#b8bec8", "#9aa0ac", "#7c8290", "#5e6472", "#424854"];
    rellena(k, [[142, 60], [178, 60], [184, 86], [176, 104], [144, 104], [136, 86]], (px, py) => rampa(PA, 0.1 + ((px - 136) / 48) * 0.6, px, py)); esfera(k, 160, 54, 9, 8, PA); k.R(153, 52, 14, 3, "#26262a"); k.crudo(154, 53, 12, 1, "#e8402a"); k.R(148, 72, 24, 2, PA[4]); k.R(156, 80, 8, 8, PA[4]); k.crudo(158, 82, 4, 4, NEON[1]);
    [[138, 62, 124, 92], [182, 62, 196, 92]].forEach(([a, b, c, d]) => { trazo(k, [[a, b], [c, d]], PA[2], 4); trazo(k, [[a, b], [c, d]], PA[1], 2); });
    for (let i = 0; i < 6; i++) { const x = 140 + i * 8; k.R(x, 104, 2, 6, "#3a3a44"); }
    [[0, 112, 112], [208, 112, 112]].forEach(([x, y, w]) => { k.R(x, y, w, 5, "#3a3a44"); k.R(x, y, w, 1, "#6a6a76"); for (let rx = x + 2; rx < x + w; rx += 7) k.elipse(rx, y + 6, 2, 2, "#5a5a66"); for (let px = x + 6; px < x + w - 8; px += 20) { const t = hash(px, y, 3156); if (t > 0.5) Det.caja(k, px, y, 10, 7, ["#e8eef4", "#c8d4dc", "#a8b4bc"]); else { esfera(k, px + 4, y - 4, 4, 4, PA); k.R(px + 1, y - 5, 6, 1, "#26262a"); } } });
    paneles(k, 124);
    for (let x = 0; x < 320; x += 8) k.R(x, 124, 4, 2, x % 16 ? "#2a2a30" : "#f2c84b");
    robot(k, 92, 160); robot(k, 236, 164);
    luces(k, vents.map(([x, y]) => ({ x, y, r: 8, ry: 6, col: NEON[1], f: lit * 0.5 })));
  }

  function v4(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 92);
    nubarron(k, -20, 50, 90, 14, NUBE); nubeGrande(k, 236, 32, 40, 10, 3160); labophase(k, 236, 14, 11, 12, { letrero: 0, s: 3161 });
    rellena(k, [[-2, 92], [-2, 80], [30, 74], [70, 78], [96, 86], [104, 92]], (x, y) => rampa(SELVA, 0.2 + (y - 74) / 30, x, y)); [[10, 60, 8], [26, 54, 10], [48, 64, 8], [70, 70, 7]].forEach(([x, top, w]) => { cilindro(k, x, top, w, 92 - top, BLANCO, 0.3); k.elipse(x + w / 2, top, w / 2, 2, NEON[1]); });
    P.mar(k, 92, 132, PAL.MAR, { s: 3162, espejo: false });
    for (let x = 0; x < 320; x++) { const y = 56 + Math.sin(x / 70) * 4; k.R(x, y, 1, 3, BLANCO[3]); k.P(x, y, BLANCO[0]); k.crudo(x, y + 3, 1, 1, NEON[2]); if (x % 40 === 20) { k.R(x - 1, y + 3, 3, 130 - y, BLANCO[3]); k.R(x - 1, y + 3, 1, 130 - y, BLANCO[1]); } }
    for (let i = 0; i < 4; i++) { const tx = 40 + i * 17, ty = 56 + Math.sin(tx / 70) * 4 - 5; bola(k, tx, ty, 8, 4, (px, py) => rampa(BLANCO, (py - ty + 4) / 8, px, py)); k.R(tx - 5, ty - 1, 10, 2, NEON[1]); k.crudo(tx - 4, ty - 1, 2, 1, NEON[0]); }
    rellena(k, [[226, 106], [320, 106], [320, 126], [238, 126]], (x, y) => rampa(BLANCO, 0.1 + (y - 106) / 22, x, y)); k.R(226, 112, 94, 2, NEON[2]); rellena(k, [[250, 106], [306, 106], [300, 92], [262, 92]], (x, y) => rampa(BLANCO, 0.05 + (x - 250) / 70, x, y)); for (let x = 266; x < 298; x += 7) { k.R(x, 96, 5, 4, "#3a4a5a"); k.crudo(x + 1, 97, 3, 2, NEON[1]); } k.R(280, 78, 2, 14, BLANCO[3]); k.crudo(280, 77, 2, 2, "#e8402a");
    paneles(k, 130);
    k.R(0, 128, 320, 3, BLANCO[1]); k.R(0, 131, 320, 1, BLANCO[4]); for (let x = 12; x < 320; x += 34) { k.R(x - 2, 124, 5, 6, "#3a3a44"); k.crudo(x - 1, 124, 3, 1, NEON[1]); }
    [[118], [196]].forEach(([x]) => { cilindro(k, x, 66, 8, 66, BLANCO, 0.3); k.R(x, 70, 8, 2, NEON[2]); k.R(x, 120, 8, 2, NEON[2]); });
    for (let x = 112; x <= 210; x++) { const y = 62 - Math.sin(((x - 112) / 98) * Math.PI) * 8; k.R(x, y, 1, 10, x < 160 ? BLANCO[1] : BLANCO[2]); k.crudo(x, y + 10, 1, 1, NEON[1]); }
    k.R(127, 57, 68, 14, ROSA[5]); rotuloLuz(k, 130, 59, "EGGBRAIN", "#ff6aa8", 2);
    [[40, 164], [280, 166]].forEach(([x, b], i) => { T.rect(k, x - 9, b - 8, 18, 8, (px, py) => rampa(ROSA, 0.2 + (py - b + 8) / 10, px, py)); palma(k, x, b - 8, 46, 3163 + i, i ? -0.18 : 0.18); });
    luces(k, [{ x: 160, y: 62, r: 50, ry: 18, col: NEON[1], f: lit * 0.6 }]);
  }

  function v5(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 104);
    nubarron(k, -20, 30, 90, 14, NUBE); nubarron(k, 250, 24, 90, 14, NUBE);
    nubeGrande(k, 160, 34, 46, 11, 3170); labophase(k, 160, 16, 12, 13, { letrero: 0, s: 3171 });
    P.mar(k, 96, 124, PAL.MAR, { s: 3172, espejo: false });
    [[30, 104, 1, 0.55], [92, 100, 1, 0.4], [224, 100, -1, 0.42], [288, 104, -1, 0.58]].forEach(([x, y, d, e], i) => buque(k, x, y, d, e, 3173 + i));
    [[56, 74], [118, 64], [206, 66], [262, 76]].forEach(([x, y]) => { k.alfa(0.7, () => { k.elipse(x, y, 7, 5, "#d8d0c8"); k.elipse(x + 5, y - 3, 5, 4, "#e8e2dc"); }); });
    const borde = (x) => 108 - Math.sqrt(Math.max(0, 1 - ((x - 160) / 176) ** 2)) * 112;
    for (let x = 0; x < W; x++) for (let y = Math.max(0, Math.round(borde(x))); y < 112; y++) { const e = 10 + (112 - y) * 0.12, hx = x / e, hy = y / (e * 0.87), q = Math.round(hx - (Math.round(hy) % 2) * 0.5), dx = Math.abs(hx - (q + (Math.round(hy) % 2) * 0.5)), dy = Math.abs(hy - Math.round(hy)); if (dx > 0.46 || dy > 0.44) k.alfa(0.32, () => k.crudo(x, y, 1, 1, NEON[1])); }
    for (let x = 0; x < W; x++) { const y = borde(x); if (y > 0) k.alfa(0.8, () => k.crudo(x, y, 1, 1, NEON[0])); }
    [[70, 58], [128, 44], [214, 48], [252, 64]].forEach(([x, y]) => { k.halo(x, y, 9, 7, "#fff0b0", 0.7); k.crudo(x - 1, y - 1, 3, 3, "#ffffff"); trazo(k, [[x - 5, y], [x + 5, y]], "#fff6c0"); trazo(k, [[x, y - 4], [x, y + 4]], "#fff6c0"); });
    for (let x = 0; x < 320; x += 6) { k.R(x, 118, 2, 8, BLANCO[3]); } k.R(0, 116, 320, 2, BLANCO[1]); k.crudo(0, 118, 320, 1, NEON[2]);
    paneles(k, 126);
    const L = [];
    [[64], [256]].forEach(([x]) => { k.R(x, 96, 2, 34, BLANCO[3]); k.R(x - 4, 94, 10, 3, BLANCO[2]); k.crudo(x - 3, 97, 8, 1, NEON[1]); L.push({ x, y: 98, r: 18, ry: 12, col: NEON[1], f: lit * 0.7 }); });
    palma(k, 22, 172, 54, 3178, 0.2); palma(k, 300, 174, 52, 3179, -0.2);
    luces(k, L);
  }

  function v6(k, o = {}) {
    const lit = encendido(k);
    k.banda(["#e8f0f8", "#dce6f0", "#ccd8e6"], 0, 124);
    rellena(k, [[-2, -2], [322, -2], [322, 126], [-2, 126]], (x, y) => { const panel = (x % 40 === 0) || (y % 30 === 0); return panel ? BLANCO[3] : rampa(BLANCO, 0.06 + Math.abs(x - 160) / 400 + (y / 126) * 0.2, x, y); });
    for (let x = 20; x < 320; x += 40) k.crudo(x, 4, 20, 2, NEON[0]);
    bola(k, 160, 52, 38, 34, () => ROSA[3]); bola(k, 160, 52, 34, 30, (x, y) => rampa(["#4a96e0", "#78b6ea", "#b4d8f4", "#e8f4fa"], (y - 22) / 60, x, y));
    nubarron(k, 128, 58, 40, 6, NUBE); nubarron(k, 168, 42, 30, 5, NUBE); for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) trazo(k, [[160 + Math.cos(a) * 34, 52 + Math.sin(a) * 30], [160 + Math.cos(a) * 38, 52 + Math.sin(a) * 34]], ROSA[5], 2);
    [[8, 20], [244, 20]].forEach(([x, y], i) => { k.R(x - 2, y - 2, 70, 46, "#3a4a5a"); k.R(x, y, 66, 42, "#0e2a3a"); for (let gy = y + 4; gy < y + 40; gy += 6) k.crudo(x + 2, gy, 62, 1, "#164a5e"); if (i === 0) { const sx = x + 22, sy = y + 4; trazo(k, [[sx - 5, sy + 2], [sx + 5, sy + 2], [sx + 6, sy + 9], [sx - 6, sy + 9], [sx - 5, sy + 2]], NEON[1]); trazo(k, [[sx - 4, sy + 5], [sx + 4, sy + 5]], "#e8402a"); trazo(k, [[sx - 12, sy + 11], [sx + 12, sy + 11], [sx + 10, sy + 26], [sx - 10, sy + 26], [sx - 12, sy + 11]], NEON[1]); trazo(k, [[sx - 12, sy + 12], [sx - 17, sy + 26]], NEON[1]); trazo(k, [[sx + 12, sy + 12], [sx + 17, sy + 26]], NEON[1]); trazo(k, [[sx - 6, sy + 26], [sx - 7, sy + 36]], NEON[1]); trazo(k, [[sx + 6, sy + 26], [sx + 7, sy + 36]], NEON[1]); k.crudo(sx - 2, sy + 15, 4, 4, NEON[0]); for (let j = 0; j < 4; j++) k.crudo(x + 40, y + 8 + j * 8, 18 - j * 3, 3, j % 2 ? NEON[2] : "#f49cbc"); } else { for (let j = 0; j < 30; j++) { const px = x + 4 + j * 2, py = y + 30 - Math.sin(j / 4) * 10 - j * 0.3; k.crudo(px, py, 2, 1, NEON[1]); } rotuloLuz(k, x + 6, y + 4, "VAGEPUNK", NEON[0]); } });
    const tanque = (x, b) => { k.R(x - 9, b - 6, 18, 6, "#5a6672"); k.R(x - 9, b - 52, 18, 5, "#5a6672"); k.alfa(0.85, () => k.R(x - 8, b - 47, 16, 41, "#5ae8c8")); k.alfa(0.5, () => k.R(x - 8, b - 47, 4, 41, "#d8fff4")); k.alfa(0.55, () => { k.poli([[x - 1, b - 32], [x - 7, b - 42], [x - 6, b - 30]], "#2a5a5a"); k.poli([[x + 1, b - 32], [x + 7, b - 42], [x + 6, b - 30]], "#2a5a5a"); }); k.elipse(x, b - 36, 2.5, 2.5, "#1e3a3a"); k.elipse(x, b - 29, 3, 4, "#1e3a3a"); k.elipse(x + 1, b - 23, 3, 3, "#1e3a3a"); k.R(x - 2, b - 21, 5, 2, "#1e3a3a"); trazo(k, [[x - 3, b - 28], [x - 1, b - 24]], "#1e3a3a"); trazo(k, [[x, b - 18], [x + 2, b - 14]], "#1e3a3a"); k.alfa(0.5, () => trazo(k, [[x, b - 40], [x, b - 47]], "#d8fff4")); for (let i = 0; i < 5; i++) k.crudo(x - 5 + hash(i, x, 3180) * 10, b - 44 + i * 7, 1, 1, "#ffffff"); };
    tanque(30, 122); tanque(58, 122); tanque(262, 122); tanque(290, 122);
    [[100, 1], [220, -1]].forEach(([x, d]) => { trazo(k, [[x, 0], [x, 18], [x + d * 14, 34], [x + d * 8, 52]], BLANCO[4], 4); trazo(k, [[x, 0], [x, 18], [x + d * 14, 34], [x + d * 8, 52]], BLANCO[2], 2); [[x, 18], [x + d * 14, 34]].forEach(([jx, jy]) => esfera(k, jx, jy, 3, 3, BLANCO)); trazo(k, [[x + d * 8, 52], [x + d * 5, 58]], "#3a3a44"); trazo(k, [[x + d * 8, 52], [x + d * 11, 58]], "#3a3a44"); });
    if (o.satelites) satelites(k);
    rellena(k, [[96, 112], [224, 112], [232, 126], [88, 126]], (x, y) => rampa(BLANCO, 0.1 + (y - 112) / 16, x, y)); k.R(96, 112, 128, 1, "#ffffff");
    for (let x = 100; x < 220; x += 12) { k.R(x, 104, 10, 8, "#3a4a5a"); k.crudo(x + 1, 105, 8, 6, x % 24 ? NEON[2] : "#f49cbc"); }
    for (let x = 100; x < 220; x += 3) k.crudo(x, 116 + (x % 6 === 0 ? 1 : 0), 2, 1, x % 9 === 0 ? "#f2c84b" : NEON[1]);
    paneles(k, 126);
    luces(k, [{ x: 160, y: 108, r: 70, ry: 20, col: NEON[1], f: 0.4 }, { x: 44, y: 98, r: 34, ry: 30, col: "#5ae8c8", f: 0.4 }, { x: 276, y: 98, r: 34, ry: 30, col: "#5ae8c8", f: 0.4 }]);
  }

  function v7(k, o = {}) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 100);
    nubarron(k, 200, 24, 90, 14, NUBE); nubeGrande(k, 70, 30, 40, 10, 3190); labophase(k, 70, 12, 11, 12, { letrero: 0, s: 3191 });
    P.mar(k, 96, 124, PAL.MAR, { s: 3192, espejo: false });
    for (let i = 0; i < 10; i++) copa(k, i * 14 - 4, 104 + (i % 3) * 4, 12, 9, SELVA, { r: 4, s: 3193 + i }); [[18, 112, 40], [44, 114, 34], [76, 116, 30]].forEach(([x, b, a], i) => P.palmera(k, x, b, a, { s: 3203 + i, inc: 0.18 }));
    rellena(k, [[-2, 124], [322, 124], [322, 182], [-2, 182]], (x, y) => rampa(ARENA, 0.1 + ((y - 124) / 56) * 0.6 + (fbm(x * 0.05, y * 0.12, 3216) - 0.5) * 0.12, x, y));
    k.alfa(0.5, () => { for (let x = 0; x < 180; x++) k.P(x, 124 + Math.round(Math.sin(x / 9) * 1.2), "#ffffff"); });
    sombraE(k, 244, 154, 70, 5, 0.4);
    const HI = ["#a8826a", "#8a6650", "#6e4e3c", "#54382a", "#3a261c"], OX = "#c0703a";
    const fierro = (x0, w, s) => (x, y) => { const rem = (Math.round(x * 0.5) % 6 === 0 && Math.round(y * 0.5) % 5 === 0); const ox = fbm(x * 0.08, y * 0.08, s) > 0.62; const musgo = fbm(x * 0.06, y * 0.09, s + 1) > 0.7 && y < 120; return musgo ? SELVA[3] : rem ? HI[4] : ox ? OX : rampa(HI, 0.1 + ((x - x0) / w) * 0.6, x, y); };
    rellena(k, [[196, 132], [184, 108], [190, 74], [214, 60], [270, 60], [294, 74], [300, 108], [292, 132]], fierro(184, 116, 3210));
    for (let y = 70; y < 128; y += 12) trazo(k, [[194, y], [296, y]], HI[4], 1); for (let x = 214; x < 290; x += 22) trazo(k, [[x, 64], [x, 128]], HI[4], 1);
    k.R(228, 84, 30, 22, HI[3]); k.R(230, 86, 26, 18, HI[2]); k.elipse(243, 95, 6, 6, HI[4]); k.elipse(243, 95, 4, 4, "#3a2a1a");
    [[196, 66, -1], [288, 66, 1]].forEach(([x, y, d]) => bola(k, x, y, 16, 10, fierro(x - 16, 32, 3219 + d)));
    bola(k, 242, 44, 27, 23, () => HI[4]); bola(k, 242, 44, 26, 22, fierro(216, 52, 3211)); k.R(222, 38, 40, 10, HI[4]); k.R(224, 40, 36, 6, "#2a1c14"); k.elipse(250, 44, 8, 7, "#2a1c14"); if (o.estado === "dormido") { k.elipse(250, 44, 5, 4, "#4a3a2a"); k.P(248, 42, "#6a5a4a"); } else { const fuerte = o.estado === "despierto"; k.halo(250, 44, fuerte ? 20 : 12, fuerte ? 15 : 10, "#ffe08a", (fuerte ? 0.75 : 0.4) + lit * 0.4); k.crudo(247, 41, 6, 6, "#ffe08a"); k.crudo(248, 42, 2, 2, "#ffffff"); }
    k.R(222, 24, 4, 8, HI[3]); k.R(260, 22, 4, 9, HI[3]); trazo(k, [[218, 52], [232, 60]], HI[4], 2);
    rellena(k, [[188, 80], [168, 112], [176, 132], [194, 130], [200, 100]], fierro(168, 32, 3212)); rellena(k, [[292, 80], [314, 104], [318, 132], [302, 132], [292, 104]], fierro(292, 26, 3213));
    rellena(k, [[200, 120], [178, 140], [196, 152], [236, 150], [240, 132]], fierro(178, 62, 3214)); rellena(k, [[250, 132], [256, 150], [298, 152], [312, 140], [290, 120]], fierro(250, 62, 3215));
    for (let i = 0; i < 5; i++) trazo(k, bezier([206 + i * 18, 64], [204 + i * 18, 80], [212 + i * 18, 96], [208 + i * 18, 110], 12), SELVA[3], 1);
    if (o.estado === "dormido") { [[204, 64, 7], [282, 62, 7], [236, 24, 9], [214, 96, 5]].forEach(([x, y, r], i) => copa(k, x, y, r, r * 0.6, SELVA, { r: 2, s: 3320 + i })); [[230, 20], [252, 21]].forEach(([x, y]) => { k.elipse(x, y, 3, 2, "#f6f6f2"); k.P(x + 2, y - 1, "#e8a040"); k.P(x - 1, y - 1, "#26262a"); }); }
    else { const pajaros = o.estado === "despierto" ? [[214, 22], [266, 20], [196, 12], [282, 8], [236, 6], [300, 24]] : [[214, 22], [266, 20]]; pajaros.forEach(([x, y]) => { trazo(k, [[x - 4, y - 2], [x - 1, y], [x, y + 1]], "#f6f6f2"); trazo(k, [[x + 4, y - 2], [x + 1, y], [x, y + 1]], "#f6f6f2"); }); }
    if (o.estado === "despierto") { [[194, 70], [294, 70], [243, 106]].forEach(([x, y]) => { trazo(k, [[x - 10, y], [x + 10, y]], "#ffe08a", 1); k.alfa(0.8, () => k.crudo(x - 10, y, 20, 1, "#ffe08a")); }); [[188, 58], [300, 60]].forEach(([x, y], i) => pluma(k, x, y, 22, 7, ["#ffffff", "#eef0f2", "#d8dce0", "#b8bec4"], { s: 3330 + i, viento: 0.3 })); for (let i = 0; i < 10; i++) k.R(200 + hash(i, 1, 3331) * 100, 136 + hash(i, 2, 3331) * 18, 2, 2, SELVA[2]); k.alfa(0.45, () => k.elipse(244, 152, 66, 6, "#e8d4a8")); }
    for (let i = 0; i < 16; i++) { const x = hash(i, 1, 3217) * 320, y = 134 + hash(i, 2, 3217) * 44; k.R(x, y, 2, 1, i % 2 ? "#fff6e4" : "#e8c8a0"); }
    palma(k, 12, 178, 58, 3218, 0.24);
  }

  function v8(k) {
    const lit = encendido(k);
    k.banda(["#9cb8d8", "#b8cce4", "#d4e0ee", "#eef2f6"], 0, 100);
    for (let i = 0; i < 60; i++) k.crudo(hash(i, 1, 3220) * 320, hash(i, 2, 3220) * 70, 1, 1, "#ffffff");
    nubeGrande(k, 228, 28, 40, 10, 3221); labophase(k, 228, 10, 11, 12, { letrero: 0, s: 3222 });
    P.mar(k, 92, 126, ["#5a7aa0", "#46668c", "#365478", "#284462", "#1e3650"], { s: 3223, espejo: false });
    [[26, 92, 40, 22], [292, 92, 46, 26], [118, 92, 26, 12]].forEach(([x, b, w, a]) => { rellena(k, [[x - w / 2, b], [x - w * 0.2, b - a], [x + w * 0.1, b - a * 0.8], [x + w / 2, b]], (px, py) => (py < b - a * 0.55 ? "#ffffff" : rampa(["#8a96a8", "#6e7a8e", "#566276"], (px - x + w / 2) / w, px, py))); });
    [[60, 104, 10, 3], [176, 100, 8, 2], [210, 110, 12, 3], [250, 104, 7, 2]].forEach(([x, y, a, b]) => { bola(k, x, y, a, b, (px, py) => (py < y ? "#ffffff" : "#bfe2f2")); k.alfa(0.35, () => k.elipse(x, y + b + 1, a, 1, "#1e3650")); });
    for (let i = 0; i < 12; i++) copa(k, i * 28 - 6, 120 + (i % 3) * 3, 18, 10, SELVA, { r: 4, s: 3224 + i });
    [[86, 70, 12], [104, 82, 9], [214, 76, 11], [232, 64, 13]].forEach(([x, top, w]) => { cilindro(k, x, top, w, 126 - top, BLANCO, 0.3); bola(k, x + w / 2, top, w / 2 + 2, 6, (px, py) => (py > top ? null : rampa(ROSA, 0.2 + (px - x) / w * 0.6, px, py))); for (let y = top + 6; y < 120; y += 7) k.crudo(x + 2, y, w - 4, 1, NEON[1]); });
    T.prado(k, 128, ["#b8e890", "#98d474", "#7cbc5c", "#64a44c", "#4e8a3e", "#3a7030"], 3236, { flores: { n: 60, cols: ["#ff5a7a", "#ffffff", "#ffd23a", "#ff8ac8"] } });
    for (let y = 128; y < H; y++) { const f = (y - 128) / 52, c = 160 + Math.sin(f * 2.4) * 10 * f, w = 6 + f * 20; for (let x = Math.round(c - w); x <= c + w; x++) k.P(x, y, rampa(ARENA, 0.15 + Math.abs(x - c) / w * 0.4, x, y)); }
    const hibisco = (x, y, c) => { for (let a = 0; a < Math.PI * 2; a += Math.PI * 0.4) k.elipse(x + Math.cos(a) * 2.5, y + Math.sin(a) * 2.5, 2, 2, c); k.P(x, y, "#ffe06a"); };
    [[40, 150, "#ff3a5a"], [58, 164, "#ff8ac8"], [262, 152, "#ff3a5a"], [282, 166, "#ffd23a"], [24, 172, "#ff8ac8"], [300, 140, "#ff3a5a"]].forEach(([x, y, c]) => { fronda(k, x, y + 4, -0.6, -0.5, 8, SELVA, { caida: 0.4, foliolo: 2 }); fronda(k, x, y + 4, 0.6, -0.5, 8, SELVA, { caida: 0.4, foliolo: 2 }); hibisco(x, y, c); });
    palma(k, 16, 176, 62, 3237, 0.22); palma(k, 304, 178, 60, 3238, -0.22);
    luces(k, [{ x: 228, y: 12, r: 20, ry: 16, col: "#ffb8d8", f: lit * 0.5 }]);
  }

  function pacifista(k, x, b, e = 1) {
    const C = ["#5a5a68", "#464654", "#34343f", "#24242c"], PIEL = "#e6c4a4";
    sombraE(k, x, b + 1, 14 * e, 2, 0.4);
    k.R(x - 7 * e, b - 12 * e, 5 * e, 12 * e, C[2]); k.R(x + 2 * e, b - 12 * e, 5 * e, 12 * e, C[2]); k.R(x - 8 * e, b - 2 * e, 7 * e, 2 * e, "#16161c"); k.R(x + 1 * e, b - 2 * e, 7 * e, 2 * e, "#16161c");
    rellena(k, [[x - 13 * e, b - 11 * e], [x + 13 * e, b - 11 * e], [x + 11 * e, b - 34 * e], [x - 11 * e, b - 34 * e]], (px, py) => rampa(C, 0.1 + ((px - x + 13 * e) / (26 * e)) * 0.6, px, py));
    k.elipse(x, b - 21 * e, 3.5 * e, 3 * e, "#d8d4cc"); [-3, -1, 1, 3].forEach((i) => k.elipse(x + i * e * 1.3, b - 26.5 * e, 0.9 * e, 0.9 * e, "#d8d4cc"));
    k.R(x - 16 * e, b - 33 * e, 4 * e, 19 * e, C[1]); k.R(x + 12 * e, b - 33 * e, 4 * e, 19 * e, C[1]); k.elipse(x - 14 * e, b - 13 * e, 3 * e, 3 * e, PIEL); k.elipse(x + 14 * e, b - 13 * e, 3 * e, 3 * e, PIEL);
    k.elipse(x, b - 39 * e, 7 * e, 6 * e, PIEL); k.R(x - 7 * e, b - 37 * e, 14 * e, 2 * e, "#3a2a24");
    k.R(x - 7 * e, b - 47 * e, 14 * e, 5 * e, "#f2f2ee"); k.R(x - 8 * e, b - 43 * e, 16 * e, 1, "#c8c8c4"); k.elipse(x - 6 * e, b - 48 * e, 2.5 * e, 2.5 * e, "#f2f2ee"); k.elipse(x + 6 * e, b - 48 * e, 2.5 * e, 2.5 * e, "#f2f2ee");
    k.crudo(x - 4 * e, b - 41 * e, 3 * e, Math.max(1, e), "#ff6a3a"); k.crudo(x + 1 * e, b - 41 * e, 3 * e, Math.max(1, e), "#ff6a3a"); k.halo(x, b - 41 * e, 9 * e, 4 * e, "#ff8a5a", 0.3);
  }
  function pacifistas(k) { pacifista(k, 62, 152, 1.05); pacifista(k, 120, 142, 0.85); pacifista(k, 200, 142, 0.85); pacifista(k, 262, 154, 1.1); }
  function gorosei(k) {
    const S = ["#4a2c56", "#36203f", "#24152c", "#160c1c"], HUESO = ["#efe6d6", "#d4c8b4", "#a89a84"], OJO = "#ff4a3a";
    const aura = (x, y, rx, ry) => k.halo(x, y, rx, ry, "#a04ad8", 0.45);
    trazo(k, [[126, 58], [134, 70], [130, 82], [138, 94]], "#3a1a2a", 1); trazo(k, [[196, 70], [188, 84], [194, 96]], "#3a1a2a", 1);
    [[116, 44], [200, 58], [150, 92]].forEach(([x, y], i) => { pluma(k, x, y, 34, 10, ["#6a5e66", "#544a52", "#3e363e", "#2a242a"], { s: 3300 + i, viento: 0.4 }); k.halo(x, y, 16, 12, "#ffb04a", 0.85); k.crudo(x - 2, y - 2, 5, 5, "#fff0b0"); });
    aura(52, 108, 36, 24); for (let i = 0; i < 6; i++) { const a = -2.6 + i * 0.42, kx = 52 + Math.cos(a) * 22, ky = 104 + Math.sin(a) * 10 - 10; trazo(k, [[52, 108], [kx, ky], [kx + (i < 3 ? -6 : 6), 128]], S[2], 2, 1); }
    k.elipse(56, 108, 15, 9, S[1]); k.elipse(54, 106, 10, 5, S[0]); k.elipse(38, 100, 8, 7, S[1]); trazo(k, [[33, 95], [27, 88], [30, 83]], HUESO[1], 2, 1); trazo(k, [[43, 95], [49, 88], [46, 83]], HUESO[1], 2, 1); k.crudo(34, 99, 2, 2, OJO); k.crudo(40, 99, 2, 2, OJO);
    aura(266, 34, 42, 22); rellena(k, [[238, 34], [262, 20], [300, 14], [282, 34], [302, 46], [262, 42]], (x, y) => rampa(S, 0.2 + (y - 14) / 40, x, y)); trazo(k, bezier([256, 34], [244, 26], [236, 30], [230, 22], 10), S[1], 4, 2); k.poli([[230, 22], [222, 24], [230, 25]], HUESO[2]); k.crudo(231, 21, 2, 1, OJO);
    aura(276, 116, 32, 18); k.elipse(278, 116, 22, 12, S[1]); k.elipse(274, 112, 16, 7, S[0]); k.elipse(256, 116, 9, 8, S[1]); trazo(k, [[250, 120], [244, 112], [246, 106]], HUESO[0], 2, 1); trazo(k, [[256, 121], [252, 113]], HUESO[0], 2, 1); k.crudo(252, 112, 2, 2, OJO); for (let i = 0; i < 4; i++) k.R(264 + i * 9, 124, 3, 6, S[2]);
    aura(56, 36, 46, 26); k.alfa(0.6, () => k.elipse(56, 38, 34, 14, S[2])); trazo(k, [[28, 34], [74, 30]], HUESO[1], 3, 2); for (let i = 0; i < 7; i++) trazo(k, bezier([34 + i * 6, 34], [32 + i * 6, 42], [36 + i * 6, 48], [38 + i * 6, 50], 6), HUESO[2], 1); trazo(k, [[74, 30], [84, 16]], HUESO[1], 3, 2); rellena(k, [[82, 12], [96, 10], [100, 16], [92, 20], [84, 20]], (x, y) => rampa(HUESO, 0.1 + (y - 10) / 12, x, y)); k.crudo(88, 13, 2, 2, OJO); trazo(k, [[28, 34], [18, 30], [14, 36]], HUESO[2], 2, 1); [[34, 1], [70, -1]].forEach(([x, d]) => { trazo(k, [[x, 36], [x - 6 * d, 50], [x - 12 * d, 56]], HUESO[1], 2, 1); trazo(k, [[x + 6, 36], [x + 4, 52], [x + 8, 58]], HUESO[1], 2, 1); });
    aura(98, 104, 20, 32); trazo(k, bezier([104, 132], [100, 116], [92, 100], [96, 84], 14), (f) => S[f < 0.5 ? 1 : 0], 11, 9); for (let i = 0; i < 6; i++) { const [x, y] = bezier([104, 132], [100, 116], [92, 100], [96, 84], 6)[i]; trazo(k, [[x - 5, y], [x + 5, y]], S[2], 1); } k.elipse(96, 82, 6, 4, "#1a0a14"); for (let a = 0; a < Math.PI * 2; a += 0.7) k.P(96 + Math.cos(a) * 5, 82 + Math.sin(a) * 3, HUESO[0]);
  }
  function satelites(k) {
    const SAT = [["#e8402a", "pico"], ["#2a2a34", "lazo"], ["#f2c84b", "bombilla"], ["#3f8ac0", "redondo"], ["#e86aa8", "coleta"], ["#3fb85a", "gordo"]];
    SAT.forEach(([col, tipo], i) => {
      const x = 100 + i * 24, b = 126, ancho = tipo === "gordo" ? 10 : 8, PIEL = "#f0d2b4";
      rellena(k, [[x - ancho, b], [x + ancho, b], [x + ancho - 1, b - 22], [x - ancho + 1, b - 22]], (px, py) => rampa(["#ffffff", "#eef0f4", "#d4d8e0"], 0.1 + (px - x + ancho) / (ancho * 2) * 0.5, px, py)); k.R(x - 1, b - 22, 3, 22, col); k.R(x - ancho + 1, b - 22, ancho * 2 - 2, 2, "#c4c8d0");
      k.elipse(x, b - 29, 7, 7, PIEL); k.R(x - 3, b - 30, 2, 2, "#26262a"); k.R(x + 2, b - 30, 2, 2, "#26262a"); k.R(x - 1, b - 25, 3, 1, "#a86a5a");
      if (tipo === "pico") { k.poli([[x - 8, b - 32], [x, b - 50], [x + 8, b - 32]], "#f4f0e6"); k.R(x - 7, b - 34, 14, 3, col); }
      else if (tipo === "lazo") { k.R(x - 8, b - 38, 16, 6, "#2a2a34"); k.R(x - 8, b - 32, 3, 13, "#2a2a34"); k.R(x + 5, b - 32, 3, 13, "#2a2a34"); k.R(x - 4, b - 41, 8, 3, "#e8402a"); k.R(x - 4, b - 31, 8, 2, "#c8d8e8"); }
      else if (tipo === "bombilla") { k.elipse(x, b - 43, 8, 8, "#fff2a0"); k.R(x - 4, b - 36, 8, 3, "#a8a8b0"); k.crudo(x - 3, b - 46, 3, 3, "#ffffff"); }
      else if (tipo === "redondo") { k.elipse(x, b - 37, 9, 5, "#3f8ac0"); k.R(x - 5, b - 31, 4, 3, "#26262a"); k.R(x + 1, b - 31, 4, 3, "#26262a"); k.R(x - 1, b - 30, 2, 1, "#26262a"); }
      else if (tipo === "coleta") { k.R(x - 7, b - 38, 14, 6, "#e86aa8"); trazo(k, [[x + 7, b - 35], [x + 13, b - 28], [x + 12, b - 20]], "#e86aa8", 3, 2); }
      else { k.R(x - 7, b - 38, 14, 6, "#3fb85a"); k.elipse(x + 9, b - 12, 3, 3, "#e8402a"); k.P(x + 9, b - 15, "#3f8a3a"); }
    });
  }

  const VARIANTES = [v1, v2, v3, v4, v5, v6, v7, v8];
  window.E19 = { v2, v6, v7 };
  O[31] = (n) => ["Eggbrain", "La isla del futuro, con el laboratorio en forma de huevo", (k) => VARIANTES[n - 1](k), { tinte: 0.15, ven: ["#7ae8ff", "#e0fcff", "#3ac0e8", "#5ae8c8"], fuego: ["#3ac0e8", "#7ae8ff", "#e0fcff", "#e8402a", "#ffe08a", "#ffffff", "#5ae8c8", "#f49cbc"], dx: 0 }];
})();

(function () {
  const H = window.H18, VEN = ["#ffd27a"];
  const esfera = Det.esfera;
  window.SitiosIt19 = window.SitiosIt19 || {};
  const O = (window.SitiosIt19.piratas = window.SitiosIt19.piratas || {});
  function barcoViejo(k, x, b, gato) {
    const dy = b - 94;
    k.poli([[x - 17, 86 + dy], [x + 18, 86 + dy], [x + 13, 94 + dy], [x - 12, 94 + dy]], gato ? "#2a2630" : "#a87444"); k.R(x - 17, 85 + dy, 35, 1, gato ? "#4a4650" : "#c99a64"); k.R(x, 56 + dy, 2, 30, "#3a2a20");
    k.poli([[x - 12, 60 + dy], [x + 14, 60 + dy], [x + 16, 80 + dy], [x - 14, 80 + dy]], gato ? "#26262a" : "#f4efe0");
    if (gato) { k.elipse(x + 1, 69 + dy, 5, 4, "#f4efe0"); k.poli([[x - 4, 67 + dy], [x - 3, 61 + dy], [x + 1, 65 + dy]], "#f4efe0"); k.poli([[x + 6, 67 + dy], [x + 5, 61 + dy], [x + 1, 65 + dy]], "#f4efe0"); k.R(x - 2, 68 + dy, 2, 2, "#26262a"); k.R(x + 3, 68 + dy, 2, 2, "#26262a"); k.linea(x - 8, 71 + dy, x - 4, 70 + dy, "#f4efe0"); k.linea(x + 6, 70 + dy, x + 10, 71 + dy, "#f4efe0"); }
    else { k.elipse(x + 1, 69 + dy, 3, 3, "#26262a"); k.linea(x - 5, 75 + dy, x + 7, 63 + dy, "#26262a"); k.linea(x - 5, 63 + dy, x + 7, 75 + dy, "#26262a"); esfera(k, x + 19, 83 + dy, 3, 3, ["#ffffff", "#efe6d0", "#d4c8ae"]); }
    k.alfa(0.45, () => k.elipse(x, b + 1, 20, 1.5, "#ffffff"));
  }
  O[18] = ["Honey Village", "El pueblo de Usupp, con la mansión de Gaya en lo alto de la colina", (k) => H.syrup(k, barcoViejo), { ven: ["#f2d27a", "#55697c", "#ffd27a"], detallesDentro: true }];
  O[20] = ["Inverse Mountain", "La montaña por la que sube el mar, con la gran ballena Loboan", (k) => H.reverse(k, true), { tinte: 0.15, ven: VEN, detallesDentro: true }];
  O[24] = ["Yaya", "Mock Town, la ciudad sin ley, y la media casa de Creckit con su fachada de castillo", (k) => H.yaya(k, 1, true), { ven: VEN, dx: -90 }];
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
  const u = "piratas";
  const F = { it6: window.SitiosIt6, it14: window.SitiosIt14, it15: window.SitiosIt15, it18: window.SitiosIt18, it19: window.SitiosIt19, it20: window.SitiosIt20, it21: window.SitiosIt21, it22: window.SitiosIt22, it27: window.SitiosIt27, it28: window.SitiosIt28, it29: window.SitiosIt29, it30: window.SitiosIt30 };
  const poner = (s, e, dentro) => {
    const ajuste = { ...(e[3] || {}) };
    if (dentro) ajuste.detallesDentro = true;
    Sitios[u][s] = [e[0], e[1], e[2], ajuste];
    Luz.AJUSTE[e[0]] = ajuste;
  };
  [[1,"it6",0,1],[2,"it6",0,1],[3,"it6",0,1],[6,"it6",0,1],[4,"it15"],[5,"it15"],[8,"it15"],[10,"it15"],[13,"it15"],[15,"it15"],[16,"it15"],[17,"it15"],[19,"it15"],[21,"it15"],[23,"it15"],[27,"it15"],[7,"it18"],[9,"it18"],[14,"it18"],[22,"it18"],[28,"it18"],[29,"it18"],[18,"it19"],[20,"it19"],[24,"it19"],[25,"it18",1],[26,"it18",2],[11,"it18",2],[30,"it18",2],[12,"it18",3],[32,"it14"],[33,"it14"],[34,"it14"],[35,"it14"],[36,"it14"],[37,"it14"],[38,"it14"],[39,"it14"]].forEach(([s, it, variante, dentro]) => {
    const x = F[it] && F[it][u] && F[it][u][s], e = typeof x === "function" ? x(variante) : x;
    if (!e) throw new Error("escenas-piratas.js: falta el escenario " + s + " de la " + it);
    poner(s, e, dentro);
  });
  const egg = F.it20.piratas[31], momentos = [1, 2, 3, 4, 5].map((n) => egg(n)), e1 = momentos[0];
  poner(31, [e1[0], e1[1], (k) => momentos[Math.max(0, Math.min(4, Det.cuando(k).h - 18))][2](k), e1[3]]);
})();
