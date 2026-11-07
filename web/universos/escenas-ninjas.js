// escenas-ninjas.js — el dibujo de cada escenario de Ninjas (datos).
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
  const { rampa, rellena, esfera, nubarron, cirros, humo, rotulo, estratos } = Det;
  const { bola, mezcla, encendido, hash, ruido, fbm, celdas, tramos, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos } = Det6;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);
  const LUZ = "#ffcf7a";
  const MAD = ["#d8b484", "#bc9462", "#9c7446", "#7c5832", "#5c3e22", "#3c2614"], MAD_O = ["#9a7454", "#7e5a3e", "#62442c", "#48301e", "#302012", "#1e140a"];
  const HIERRO = ["#a0a0ac", "#74747e", "#4e4e58", "#30303a"];

  function tejado(k, cx, y, w, h, c, { s = 1 } = {}) {
    const med = w / 2;
    for (let x = -med; x <= med; x++) {
      const u = Math.abs(x) / med, top = y - h * (1 - Math.pow(u, 1.6)) * 0.9 - h * 0.1, bajo = y + 1 - 3 * Math.pow(u, 5), px = Math.round(cx + x);
      for (let py = Math.round(top); py <= bajo; py++) { const fila = Math.floor((py - top) / 2.5), teja = Math.floor((px + fila * 2) / 4); k.P(px, py, (px + fila * 2) % 4 === 0 ? c[4] : rampa(c, 0.15 + (x / med) * 0.3 + ((py - top) / (bajo - top + 1)) * 0.3 + (hash(teja, fila, s) - 0.5) * 0.15, px, py)); }
      k.P(px, Math.round(bajo) + 1, c[4]);
    }
    k.R(cx - med * 0.36, y - h - 1, med * 0.72, 2, c[4]); k.R(cx - med * 0.36, y - h - 1, med * 0.72, 1, c[2]);
  }
  function deposito(k, x, y) { k.R(x + 1, y + 10, 1, 5, HIERRO[2]); k.R(x + 9, y + 10, 1, 5, HIERRO[2]); for (let px = x; px < x + 11; px++) for (let py = y; py < y + 10; py++) k.P(px, py, rampa(["#e2e8ec", "#c2ccd2", "#9aa6ae", "#76828a", "#56626a"], 0.1 + Math.abs((px - x) / 10 - 0.3) * 1.1 + (py % 4 === 0 ? 0.15 : 0), px, py)); k.elipse(x + 5, y, 5.5, 1.5, "#a8b2b8"); }
  function casaK(k, x, base, w, h, { techo, pared = ["#f4ead6", "#e6d8bc", "#d4c29e", "#b8a47e"], deposito: dep = false, s = 1, noren = null } = {}) {
    const top = base - h, z = Math.round(h * 0.42);
    rellena(k, [[x, base], [x, top], [x + w, top], [x + w, base]], (px, py) => rampa(pared, 0.15 + ((px - x) / w) * 0.25 + (fbm(px * 0.25, py * 0.25, s) - 0.5) * 0.22, px, py));
    rellena(k, [[x, base], [x, base - z], [x + w, base - z], [x + w, base]], madera(MAD_O, { paso: 3, vertical: true, largo: 99, s, veta: 0.5 }));
    k.R(x, base - z - 2, w, 2, MAD_O[3]); k.R(x, top, 2, h, MAD_O[2]); k.R(x + w - 2, top, 2, h, MAD_O[4]);
    for (let vx = x + 4; vx < x + w - 9; vx += 12) { k.R(vx, top + 4, 9, 7, MAD_O[3]); k.R(vx + 1, top + 5, 7, 5, "#ffd27a"); for (let i = 0; i < 7; i += 2) k.R(vx + 1 + i, top + 5, 1, 5, MAD_O[2]); k.R(vx + 1, top + 7, 7, 1, MAD_O[2]); }
    if (noren) { const px = x + w * 0.6; k.R(px - 5, base - z - 1, 12, z + 1, "#1e140a"); for (let i = 0; i < 3; i++) k.R(px - 5 + i * 4, base - z, 4, 6, i % 2 ? "#f4efe0" : noren); }
    tejado(k, x + w / 2, top + 1, w + 12, Math.max(7, w * 0.22), techo, { s });
    if (dep) deposito(k, x + w * 0.22, top - Math.max(7, w * 0.22) * 0.8 - 12);
    k.alfa(0.3, () => k.R(x, top + 2, w, 2, "#1e140a"));
  }
  function monteHakoge(k, base, { d = 1, cy = 70, caras: lista = null, r: radio = null } = {}) {
    const ROCA = ["#d8c4a0", "#c4ac86", "#ac926c", "#927854", "#785f40"];
    rellena(k, [[-4, base], [-4, cy - 4], [30, cy - 16], [96, cy - 26], [180, cy - 28], [250, cy - 22], [324, cy - 10], [324, base]], (x, y) => rampa(ROCA, 0.3 + Math.sin(y / 3.3 + Math.sin(x / 19) * 2) * 0.16 + (ruido(x * 0.3, y * 0.06, 2) > 0.76 ? 0.25 : 0) + (hash(x, y, 2) - 0.5) * 0.1, x, y));
    const caras = lista || (d === 0 ? [40, 80, 120, 160, 200, 240, 280] : [70, 126, 182, 238]), pelo = ["#8a6d4a", "#d8d2c4", "#6b5138", "#e0c870", "#d8c080", "#c8c8d0", "#f2c84b"];
    caras.forEach((x, i) => {
      const r = radio || (d === 0 ? 15 : 19), y = cy;
      bola(k, x, y, r, r * 1.25, (px, py) => rampa(ROCA, 0.1 + ((px - x) / r) * 0.32 + ((py - y) / (r * 1.25)) * 0.3, px, py));
      k.poli([[x - r - 1, y - 4], [x - r * 0.6, y - 18], [x, y - 24], [x + r * 0.6, y - 18], [x + r + 1, y - 4], [x + r * 0.7, y - 10], [x, y - 14], [x - r * 0.7, y - 10]], pelo[i % pelo.length]);
      k.R(x - r * 0.55, y - 4, r * 0.4, 2, ROCA[4]); k.R(x + r * 0.15, y - 4, r * 0.4, 2, ROCA[4]); k.R(x - r * 0.5, y, r * 0.25, 2, ROCA[4]); k.R(x + r * 0.25, y, r * 0.25, 2, ROCA[4]);
      k.R(x - 1, y, 2, r * 0.45, ROCA[3]); k.R(x - r * 0.3, y + r * 0.7, r * 0.6, 1, ROCA[4]);
    });
  }
  function chochin(k, x, y, col = "#d83a2a", alto = 9) {
    k.R(x, y - alto / 2 - 3, 1, 3, "#1e140a"); k.R(x - 2, y - alto / 2 - 1, 5, 1, "#1e140a"); k.R(x - 2, y + alto / 2, 5, 1, "#1e140a");
    bola(k, x + 0.5, y, 3.5, alto / 2, (px, py) => (Math.round(py - y) % 2 === 0 ? mezcla(col, "#000000", 0.25) : px < x ? mezcla(col, "#ffffff", 0.25) : col));
  }
  function kanjiAchiriku(k, x, y, col) {
    k.R(x, y + 4, 8, 1, col);
    const g = x + 11; k.R(g + 3, y, 1, 3, col); k.R(g, y + 1, 2, 1, col); k.R(g + 5, y + 1, 2, 1, col); k.R(g + 1, y + 3, 5, 1, col); k.R(g + 1, y + 2, 1, 2, col); k.R(g + 5, y + 2, 1, 2, col); k.R(g, y + 5, 8, 1, col); k.R(g + 3, y + 4, 1, 6, col); k.P(g + 2, y + 7, col); k.P(g + 1, y + 8, col); k.P(g + 4, y + 7, col); k.P(g + 5, y + 8, col); k.P(g + 6, y + 9, col);
  }
  function katakanaRamen(k, x, y, col) {
    const P = (px, py) => k.P(px, py, col(px)), R = (px, py, w, h) => { for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) P(px + i, py + j); };
    R(x, y, 4, 1); R(x, y + 2, 4, 1); R(x + 3, y + 2, 1, 2); P(x + 2, y + 4); P(x + 1, y + 5);
    R(x + 6, y + 3, 4, 1);
    P(x + 14, y); P(x + 14, y + 1); P(x + 13, y + 2); P(x + 12, y + 3); P(x + 11, y + 4); P(x + 12, y + 1); P(x + 13, y + 3); P(x + 14, y + 4);
    P(x + 17, y); P(x + 18, y + 1); P(x + 20, y + 4); P(x + 21, y + 3); P(x + 22, y + 2); P(x + 23, y + 1); P(x + 19, y + 5); P(x + 18, y + 5);
  }

  function achiriku(k) {
    const { h, d } = cuando(k), lit = encendido(k);
    k.banda(["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"], 0, 112);
    nubarron(k, -16, 22, 80, 12); cirros(k, 5, 4, 24);
    monteHakoge(k, 112, { d, cy: 50, caras: d === 0 ? [30, 72, 114, 206, 248, 290, 160] : [52, 104, 216, 268], r: d === 0 ? 14 : 17 });
    const TR = ["#d86a50", "#bc4e3a", "#9a3a2c", "#782a20", "#561c16"], TT = ["#a08070", "#866656", "#6c5042", "#543c30", "#3c2a20"], TA = ["#7aa4c8", "#5a88b0", "#446e94", "#325676", "#223e58"];
    casaK(k, -6, 122, 50, 44, { techo: TT, deposito: true, s: 1 }); casaK(k, 44, 122, 40, 36, { techo: TR, s: 2 });
    casaK(k, 236, 122, 40, 38, { techo: TA, s: 3, deposito: true }); casaK(k, 276, 122, 50, 46, { techo: TR, s: 4 });
    trazo(k, [[0, 70], [40, 76], [80, 74]], "#2a2018"); cuerda(k, 80, 72, 240, 74, 8, "#2a2018"); cuerda(k, 240, 74, 320, 70, 5, "#2a2018");
    for (let i = 0; i < 12; i++) { const t = (i + 0.5) / 12, x = 80 + 160 * t, y = 72 + 2 * t + Math.sin(t * Math.PI) * 8; chochin(k, x, y + 6, i % 3 === 1 ? "#f4e0b0" : "#d83a2a", 6); }
    suelo3d(k, 116, H, 160, 70, (X, z, x, y) => {
      const fz = z * 13, fila = Math.floor(fz), en = fz - fila, paso = (100 / ((y - 70) * (y - 70))) * 13, L = 22, off = (fila % 2) * L * 0.5 + hash(fila, 0, 5) * 6, col = Math.floor((X + off) / L), u = X + off - col * L;
      if (en < paso * 0.95 || u < z * 1.1) return "#6c6252";
      return rampa(["#d6ccb6", "#c4b8a0", "#b0a48c", "#9a8e78", "#80766a"], 0.3 + (hash(fila, col, 5) - 0.5) * 0.36 + (en < paso * 2.2 ? -0.14 : 0) + (u > L - z * 2 ? 0.14 : 0) - Math.max(0, 1 - Math.abs(x - 160) / 90) * 0.08, x, y);
    });
    const X0 = 86, X1 = 234;
    [X0, X1 - 4].forEach((x) => { k.R(x, 54, 4, 70, MAD[2]); k.R(x, 54, 1, 70, MAD[0]); k.R(x + 3, 54, 1, 70, MAD[4]); });
    rellena(k, [[X0 + 4, 120], [X0 + 4, 64], [X1 - 4, 64], [X1 - 4, 120]], (x, y) => rampa(["#fff0c8", "#ffe2a4", "#f8cc80", "#e8b466", "#c8945a"], 0.1 + ((y - 64) / 56) * 0.5 + (hash(x, y, 9) - 0.5) * 0.1, x, y));
    for (let x = X0 + 8; x < X1 - 8; x += 6) { k.R(x, 66, 4, 2, ["#c0392b", "#f4efe0", "#2f6fa8", "#e8c35a"][(x / 6) % 4 | 0]); k.R(x, 68, 4, 1, "#a8784a"); }
    k.R(X0 + 4, 69, X1 - X0 - 8, 2, "#8a5a32");
    for (let x = X0 + 10; x < X1 - 10; x += 8) { k.R(x, 74, 5, 4, ["#d8d4cc", "#c8a070", "#d8d4cc"][(x / 8) % 3 | 0]); k.P(x, 74, "#ffffff"); }
    [[112, 104], [160, 104], [206, 104]].forEach(([x, y], i) => {
      for (let px = x - 10; px < x + 10; px++) for (let py = y - 12; py < y; py++) k.P(px, py, rampa(["#f0f2f6", "#c8ccd4", "#a0a4ae", "#787c86", "#585c66"], 0.1 + Math.abs((px - x + 10) / 20 - 0.3) * 1.1, px, py));
      k.R(x - 11, y - 13, 22, 2, "#5a5e66"); k.R(x - 11, y - 13, 22, 1, "#a0a4ae"); k.elipse(x, y - 13, 9, 1.5, i === 1 ? "#e8b860" : "#c88850");
      k.alfa(0.42, () => { for (let j = 0; j < 6; j++) k.elipse(x - 2 + Math.sin(j * 1.7 + h) * 3, y - 18 - j * 6, 3 + j * 0.8, 2.4 + j * 0.5, "#ffffff"); });
    });
    tejado(k, 160, 60, 172, 20, ["#c04a34", "#a83a28", "#8a2e20", "#6a2218", "#4a1610"], { s: 7 });
    rellena(k, [[124, 54], [196, 54], [196, 40], [124, 40]], madera(["#f4e8cc", "#e8d8b4", "#d4c098", "#bca67c", "#9a8460"], { paso: 3, largo: 99, s: 8, veta: 0.4 }));
    k.R(123, 39, 74, 1, MAD[5]); k.R(123, 54, 74, 1, MAD[5]); k.R(122, 40, 1, 15, MAD[5]); k.R(197, 40, 1, 15, MAD[5]);
    kanjiAchiriku(k, 151, 42, "#b02a1e");
    for (let i = 0; i < 7; i++) {
      const x = X0 + 4 + i * 21, c = i % 2 ? "#f4efe0" : "#c8301e";
      rellena(k, [[x, 62], [x + 20, 62], [x + 20, 80 + (i % 2)], [x, 80 + (i % 2)]], (px, py) => rampa([mezcla(c, "#ffffff", 0.3), c, mezcla(c, "#000000", 0.18), mezcla(c, "#000000", 0.35)], 0.15 + ((px - x) / 20) * 0.35 + (Math.round(px - x) % 7 === 0 ? 0.25 : 0), px, py));
      k.R(x + 20, 62, 1, 19, "#3a1a10");
    }
    const sobrePano = (px) => (Math.floor((px - X0 - 4) / 21) % 2 ? "#b02a1e" : "#f4efe0");
    katakanaRamen(k, X0 + 4 + 21 + 8, 70, sobrePano); katakanaRamen(k, X0 + 4 + 21 * 4 + 8, 70, sobrePano);
    k.R(X0 + 2, 61, X1 - X0 - 4, 2, "#5a2a18");
    rellena(k, [[X0 - 2, 108], [X1 + 2, 108], [X1 + 2, 116], [X0 - 2, 116]], madera(MAD, { paso: 3, largo: 70, s: 10, veta: 0.5 }));
    k.R(X0 - 2, 106, X1 - X0 + 4, 2, MAD[0]); k.R(X0 - 2, 108, X1 - X0 + 4, 1, MAD[4]);
    rellena(k, [[X0 - 2, 116], [X1 + 2, 116], [X1 + 2, 124], [X0 - 2, 124]], madera(MAD_O, { paso: 4, vertical: true, largo: 99, s: 11, veta: 0.4 }));
    [[122, 94], [176, 94], [198, 94]].forEach(([x, y]) => { k.elipse(x, y + 12, 6, 2, "#f4efe0"); k.elipse(x, y + 11, 5, 1, "#e8a040"); k.R(x - 3, y + 10, 2, 1, "#f4c8a0"); k.P(x + 2, y + 10, "#3f8a3a"); trazo(k, [[x + 3, y + 10], [x + 8, y + 5]], "#c9a03c"); });
    [104, 130, 156, 182, 208].forEach((x) => { sombraE(k, x + 3, 129, 7, 2, 0.4); k.R(x, 117, 2, 12, "#3a2a1e"); k.R(x + 4, 117, 2, 12, "#2a1e14"); bola(k, x + 3, 116, 7, 2.5, (px, py) => rampa(["#f06a50", "#d83a2a", "#a82a1e", "#781c14"], 0.1 + ((py - 113.5) / 5) * 0.8, px, py)); });
    chochin(k, X0 - 6, 74, "#d83a2a", 12); chochin(k, X1 + 6, 74, "#d83a2a", 12);
    sombraE(k, 252, 135, 9, 2, 0.4); for (let px = 246; px < 258; px++) for (let py = 122; py < 135; py++) k.P(px, py, rampa(["#8a7a6a", "#6a5a4e", "#4e4038", "#362c26"], 0.1 + Math.abs((px - 246) / 11 - 0.3) * 1.1, px, py)); k.R(246, 125, 12, 1, "#26201c"); k.R(246, 131, 12, 1, "#26201c");
    if (h === 5) { const x = 134, b = 114, C = "#8a6a4a"; k.elipse(x, b - 4, 5, 4, C); k.elipse(x + 3, b - 9, 3, 3, C); k.P(x + 1, b - 12, C); k.P(x + 5, b - 12, C); k.linea(x - 5, b - 2, x - 9, b - 8, C); k.R(x + 4, b - 13, 2, 2, "#e8402a"); k.crudo(x + 2, b - 10, 1, 1, "#ffe06a"); k.crudo(x + 4, b - 10, 1, 1, "#ffe06a"); }
    luces(k, [{ x: 160, y: 96, r: 120, ry: 58, col: "#ffd890", f: 0.35 + lit * 0.65, p: 1 }, { x: X0 - 6, y: 76, r: 30, ry: 26, col: "#ff8a5a", f: lit }, { x: X1 + 6, y: 76, r: 30, ry: 26, col: "#ff8a5a", f: lit }, { x: 160, y: 80, r: 120, ry: 26, col: "#ff9a6a", f: lit * 0.45 }]);
  }

  function gedo(k, cx, base) {
    const G = ["#c8c0d0", "#aaa2b6", "#8c849a", "#70687e", "#565066", "#3e384c"];
    const piel = (x, y, l = 0) => rampa(G, 0.24 + l + ((x - cx) / 44) * 0.34 + (fbm(x * 0.2, y * 0.14, 61) - 0.5) * 0.28 + (ruido(x * 0.7, y * 0.3, 62) > 0.8 ? 0.16 : 0), x, y);
    [[-1, cx - 62], [1, cx + 62]].forEach(([s, x]) => {
      rellena(k, [[x - 2, base + 8], [x + 2, base + 8], [x + 1 + s * 6, base - 34], [x - 1 + s * 6, base - 36]], (px, py) => rampa(["#4a4452", "#322e3a", "#22202a"], 0.2 + ((px - x) * s + 2) / 6 * 0.6, px, py));
      for (let i = 0; i < 12; i++) { const t = i / 12, px = cx + s * 30 + (x - cx - s * 30) * t, py = base - 40 + 36 * t + Math.sin(t * Math.PI) * 8; k.elipse(px, py, 1.8, 1.3, i % 2 ? HIERRO[1] : HIERRO[2]); k.P(px - 0.5, py - 0.5, HIERRO[0]); }
    });
    [[-1], [1]].forEach(([s]) => {
      trazo(k, [[cx + s * 22, base - 74], [cx + s * 31, base - 56], [cx + s * 30, base - 36]], (f, px, py) => piel(px, py, 0.08 + f * 0.1), 9, 7);
      for (let i = -2; i <= 2; i++) trazo(k, [[cx + s * 30 + i * 2, base - 30], [cx + s * 30 + i * 2.6, base - 18], [cx + s * 30 + i * 3, base - 12]], (f, px, py) => piel(px, py, 0.15), 2, 1);
      bola(k, cx + s * 30, base - 30, 6, 5, (px, py) => piel(px, py, 0.1));
      for (let px = cx + s * 30 - 7; px < cx + s * 30 + 7; px++) for (let py = base - 42; py < base - 35; py++) k.P(px, py, rampa(HIERRO, 0.05 + ((py - base + 42) / 7) * 0.8 + (px === cx + s * 30 - 4 ? -0.1 : 0), px, py));
    });
    rellena(k, [[cx - 26, base - 78], [cx - 14, base - 84], [cx + 14, base - 84], [cx + 26, base - 78], [cx + 20, base - 52], [cx + 13, base - 18], [cx + 15, base], [cx - 15, base], [cx - 13, base - 18], [cx - 20, base - 52]], (x, y) => piel(x, y));
    for (let i = 0; i < 4; i++) { const y = base - 70 + i * 6; [-1, 1].forEach((s) => { trazo(k, [[cx + s * (17 - i), y], [cx + s * 10, y + 3], [cx + s * 3, y + 2]], G[4]); trazo(k, [[cx + s * (16 - i), y - 1], [cx + s * 10, y + 2]], G[1]); }); }
    k.R(cx - 1, base - 74, 2, 28, G[4]); sombra(k, [[cx - 12, base - 44], [cx + 12, base - 44], [cx + 10, base - 22], [cx - 10, base - 22]], 0.2);
    rellena(k, [[cx - 7, base - 86], [cx + 7, base - 86], [cx + 6, base - 80], [cx - 6, base - 80]], (x, y) => piel(x, y, 0.15));
    bola(k, cx, base - 102, 17, 17, (x, y) => piel(x, y, -0.06));
    [[-12, -10], [-4, -13], [4, -13], [12, -10], [-15, -2], [15, -2], [0, -8]].forEach(([dx, dy]) => { const x = cx + dx, y = base - 102 + dy; trazo(k, [[x - 2, y], [x, y + 1], [x + 2, y]], G[5]); k.P(x, y - 1, G[1]); });
    [[-7, -1], [7, -1]].forEach(([dx, dy]) => { const x = cx + dx, y = base - 102 + dy; k.elipse(x, y, 3.5, 3, G[5]); k.elipse(x, y, 3, 2.5, "#cbbce8"); k.elipse(x, y, 2, 1.6, "#9a88c8"); k.elipse(x, y, 1, 0.8, "#cbbce8"); k.P(x, y, "#2a1e46"); });
    k.R(cx - 11, base - 106, 8, 1, G[4]); k.R(cx + 3, base - 106, 8, 1, G[4]);
    rellena(k, [[cx - 10, base - 94], [cx + 10, base - 94], [cx + 8, base - 88], [cx - 8, base - 88]], () => G[5]);
    for (let i = -8; i <= 8; i += 2) k.R(cx + i, base - 94, 1, 6, i % 4 === 0 ? G[1] : G[2]);
  }
  function campoBatalla(k) {
    const { h } = cuando(k);
    k.banda(["#7c9cbc", "#a8b8c4", "#cfc8b4", "#e2cfa4"], 0, 118);
    const NU = ["#ece6da", "#d4ccbe", "#b4ac9e"]; nubarron(k, -24, 30, 120, 16, NU); nubarron(k, 220, 22, 130, 18, NU);
    [[60, 118, 190, 46, ["#c4b8ac", "#b0a498", "#9c9084", "#887c70"]], [270, 118, 200, 52, ["#b8aca0", "#a49888", "#908474", "#7c7062"]]].forEach(([c, b, w, hh, roca]) => Det.montana(k, c, b, w, hh, { roca }));
    Det6.pluma(k, 252, 118, 100, 30, ["#c8c2b8", "#aca69c", "#908a82", "#76706a"], { s: 66, viento: 0.3 }); Det6.pluma(k, 66, 118, 88, 26, ["#ccc6bc", "#b0aaa0", "#948e86", "#7a746e"], { s: 67, viento: 0.25 });
    gedo(k, 160, 124);
    bruma(k, 84, 128, "#e8dcc4", 0.9, { s: 3, ex: 0.03, ey: 0.15 });
    rellena(k, [[-2, 116], [322, 116], [322, 180], [-2, 180]], (x, y) => { const c = celdas(x, y * 2.2, 22, 22, 63, 0.9), grieta = c.borde < 0.04 && y > 124 ? 0.4 : 0; return rampa(["#e2cca4", "#ccb48a", "#b49a72", "#9a805c", "#7c6448", "#5c4834"], 0.22 + ((y - 116) / 64) * 0.22 + (fbm(x * 0.06, y * 0.15, 64) - 0.5) * 0.4 + grieta + (hash(x, y, 64) - 0.5) * 0.1, x, y); });
    [[56, 152, 40, 8], [262, 168, 46, 9], [168, 174, 34, 6], [244, 134, 26, 5]].forEach(([x, y, a, b]) => {
      bola(k, x, y, a, b, (px, py) => { const q = Math.hypot((px - x) / a, (py - y) / b), fondo = (py - y) / b; return rampa(["#e2cca4", "#ccb48a", "#b49a72", "#9a805c", "#7c6448", "#5c4834"], q > 0.82 ? 0.1 : 0.45 + fondo * -0.25 + (1 - q) * 0.2, px, py); });
      sombra(k, [[x - a * 0.8, y - b * 0.2], [x + a * 0.2, y - b * 0.8], [x + a * 0.6, y - b * 0.4], [x - a * 0.4, y + b * 0.4]], 0.25);
    });
    const RO = ["#c4bcb0", "#a8a094", "#8c8478", "#706a60", "#56504a"];
    [[14, 140, 38, 18], [222, 146, 32, 14], [290, 138, 40, 20], [96, 178, 28, 11], [124, 134, 16, 8]].forEach(([x, b, w, hh], i) => { sombraE(k, x + w * 0.6, b, w * 0.6, 3, 0.4); Det.pena(k, x, b, w, hh, RO); for (let j = 0; j < 3; j++) k.P(x + w * 0.3 + j * 3, b - hh * 0.6 + j, RO[0]); });
    [[116, 150], [206, 162], [80, 166], [184, 140], [300, 160]].forEach(([x, y], i) => { sombraE(k, x + 3, y, 4, 1, 0.4); trazo(k, [[x, y], [x + 3, y - 12]], HIERRO[2], 1); k.R(x + 2, y - 15, 3, 4, HIERRO[0]); k.P(x + 3, y - 16, "#ffffff"); k.elipse(x + 1, y - 2, 2, 1, "#5a4a3a"); });
    trazo(k, [[234, 160], [238, 128]], "#5a4430", 2, 2); for (let j = 0; j < 12; j++) { const t = j / 12; k.R(239, 129 + j, 14 - j * 0.3 + Math.sin(j) * 1.5, 1, j % 3 === 0 ? "#2a3a5a" : "#3a4a6a"); } k.R(242, 132, 6, 4, "#c8c8d0"); k.R(243, 133, 4, 1, "#3a4a6a");
    for (let i = 0; i < 26; i++) { const x = hash(i, 1, 65) * W, y = 124 + hash(i, 2, 65) * 54, c = i % 3 ? HIERRO[1] : "#3a3a44"; k.P(x, y, c); k.P(x + 1, y, c); if (i % 2) k.P(x + 1, y - 1, HIERRO[0]); }
    bruma(k, 120, 180, "#f0e4cc", 0.5, { s: 9, ex: 0.025, ey: 0.08 });
    if (h >= 20) luces(k, [{ x: 70, y: 150, r: 40, ry: 20, col: "#ff8a4a", f: 0.6 }, { x: 250, y: 160, r: 40, ry: 20, col: "#ff8a4a", f: 0.6 }]);
    if (h >= 20) { k.llama(70, 150, 0.7); k.llama(250, 160, 0.8); }
  }

  function bosqueMuerte(k) {
    const lit = encendido(k), noche = k.luz && k.luz.noche;
    const CO = ["#7a6250", "#5e4a3a", "#46362a", "#30241c", "#1e1610"], HO = ["#4a7a4e", "#38643e", "#2a5032", "#1e3c26", "#14281a"], MUSGO = ["#7a9a4a", "#5e7e3a", "#46622c", "#30461e"];
    k.banda(["#2a4232", "#34503c", "#3e5e46"], 0, 150);
    for (let i = 0; i < 9; i++) { const x = 10 + i * 36 + hash(i, 1, 70) * 14, w = 10 + hash(i, 2, 70) * 8; rellena(k, [[x, 0], [x + w, 0], [x + w + 2, 152], [x - 2, 152]], corteza(["#4e6656", "#46604e", "#3e5646", "#364c3e"], x, w, { s: 70 + i })); }
    bruma(k, 40, 150, "#8ab49a", 0.75, { s: 71, ex: 0.03, ey: 0.06, perfil: (x, y) => 0.7 });
    const tronco = (x, w, s) => {
      rellena(k, [[x, -2], [x + w, -2], [x + w + 2, 128], [x + w + 10, 150], [x - 10, 150], [x - 2, 128]], corteza(CO, x - 4, w + 8, { s, musgo: { pal: MUSGO, umbral: 0.62 }, grieta: 0.62 }));
      [[-18, 156, 6], [-6, 160, 5], [w + 6, 160, 5], [w + 18, 156, 6]].forEach(([dd, y, g]) => trazo(k, [[x + w / 2 + (dd < 0 ? -w * 0.3 : w * 0.3), 128], [x + dd * 0.6, (128 + y) / 2 - 4], [x + dd, y]], (f, px, py) => rampa(CO, 0.25 + f * 0.4 + (hash(Math.round(px), Math.round(py), s) - 0.5) * 0.2, px, py), g + 3, g - 1));
    };
    tronco(-16, 40, 72); tronco(70, 30, 73); tronco(214, 34, 74); tronco(282, 44, 75);
    copa(k, 40, 10, 70, 26, HO, { r: 7, s: 76 }); copa(k, 160, 4, 80, 24, HO, { r: 7, s: 77 }); copa(k, 284, 10, 66, 26, HO, { r: 7, s: 78 });
    [[52, 20, 64], [118, 16, 52], [196, 22, 74], [250, 18, 58], [300, 22, 48]].forEach(([x, y, l], i) => { for (let j = 0; j < l; j++) { const px = x + Math.sin(j / 9 + i) * 2.5; k.P(px, y + j, j % 5 === 0 ? MUSGO[1] : "#2e4a2a"); if (j % 7 === 3) { k.P(px - 1, y + j, HO[2]); k.P(px + 1, y + j + 1, HO[1]); } } });
    if (noche) rayos(k, [[150, 0, 132, 150, 6, 30], [222, 0, 238, 150, 4, 22]], "#b8d0e8", 0.38);
    rellena(k, [[-2, 146], [322, 146], [322, 180], [-2, 180]], (x, y) => rampa(["#5a6a3e", "#4a5a32", "#3a4a28", "#2c3a1e", "#202c16"], 0.25 + ((y - 146) / 34) * 0.2 + (fbm(x * 0.1, y * 0.25, 79) - 0.5) * 0.5 + (hash(x, y, 79) - 0.5) * 0.14, x, y));
    for (let i = 0; i < 60; i++) { const x = hash(i, 1, 80) * W, y = 150 + hash(i, 2, 80) * 30; k.R(x, y, 2, 1, ["#8a6a3a", "#6a7a3a", "#a87a3a"][i % 3]); }
    [[20, 178], [300, 178], [118, 170], [196, 172]].forEach(([x, y], i) => { for (let j = 0; j < 7; j++) { const a = -Math.PI * 0.95 + (j / 6) * Math.PI * 0.9; fronda(k, x, y, Math.cos(a), Math.sin(a) * 0.8, 12 + (i % 2) * 5, ["#6a9a5a", "#4e7e46", "#3a6236", "#2a4a28"], { caida: 0.5, foliolo: 3 }); } });
    [[46, 170], [212, 174], [140, 166], [270, 168]].forEach(([x, y]) => { k.R(x, y - 5, 2, 5, "#e0d8c4"); bola(k, x + 1, y - 6, 5, 3, (px, py) => (py > y - 5 ? null : rampa(["#e070b0", "#b84a8a", "#8a3068"], 0.1 + ((px - x + 4) / 10) * 0.6, px, py))); k.P(x - 1, y - 7, "#f8d0e8"); k.P(x + 3, y - 6, "#f8d0e8"); });
    for (let y = 110; y < 158; y++) for (let x = 0; x < W; x++) { if (x > 140 && x < 180) continue; if ((x + y) % 5 === 0 || (x - y + 500) % 5 === 0) k.P(x, y, (x + y) % 10 === 0 ? "#b4b4be" : "#7e7e88"); }
    for (let x = 4; x < W; x += 32) { if (x > 136 && x < 184) continue; k.R(x, 102, 3, 58, HIERRO[2]); k.R(x, 102, 1, 58, HIERRO[0]); }
    k.R(0, 108, 140, 2, HIERRO[1]); k.R(180, 108, 140, 2, HIERRO[1]); k.R(0, 108, 140, 1, HIERRO[0]); k.R(180, 108, 140, 1, HIERRO[0]);
    for (let x = 0; x < W; x += 3) { const y = 104 + Math.sin(x * 0.7) * 1.5; k.P(x, y, HIERRO[0]); if (x % 9 === 0) { k.P(x - 1, y - 1, HIERRO[0]); k.P(x + 1, y - 1, HIERRO[0]); } }
    [138, 178].forEach((x) => { k.R(x, 96, 5, 64, HIERRO[2]); k.R(x, 96, 2, 64, HIERRO[0]); k.R(x + 4, 96, 1, 64, HIERRO[3]); });
    for (let y = 104; y < 158; y++) for (let x = 143; x < 178; x++) if ((x + y) % 5 === 0 || (x - y + 500) % 5 === 0) k.P(x, y, "#8a8a94");
    k.R(143, 104, 35, 2, HIERRO[1]); k.R(143, 156, 35, 2, HIERRO[1]); k.R(160, 104, 1, 54, HIERRO[2]); trazo(k, [[144, 106], [177, 156]], HIERRO[1]); trazo(k, [[177, 106], [144, 156]], HIERRO[1]);
    for (let i = 0; i < 10; i++) { const x = 150 + i * 2.2, y = 126 + Math.sin(i * 0.5) * 3; k.elipse(x, y, 1.6, 1, HIERRO[i % 2 ? 1 : 0]); } k.R(158, 128, 5, 5, "#c8a040"); k.R(159, 126, 3, 2, HIERRO[1]); k.P(160, 130, "#3a2a10");
    rellena(k, [[136, 86], [184, 86], [184, 97], [136, 97]], (x, y) => rampa(["#e05040", "#c03a2e", "#9a2a22"], (y - 86) / 11 * 0.6, x, y)); k.R(136, 86, 48, 1, "#f08070"); rotulo(k, 152, 89, "44", "#ffffff");
    [[60, 124], [252, 126]].forEach(([x, y]) => { k.R(x - 1, y - 1, 28, 18, "#26262a"); k.R(x, y, 26, 16, "#f0d04a"); k.poli([[x + 13, y + 2], [x + 20, y + 13], [x + 6, y + 13]], "#26262a"); k.R(x + 12, y + 5, 2, 5, "#f0d04a"); k.P(x + 12, y + 11, "#f0d04a"); k.R(x + 2, y + 15, 22, 1, "#c0a030"); });
    bruma(k, 132, 180, "#a8d0b4", 0.55, { s: 81, ex: 0.03, ey: 0.12 });
    [[112, 72], [196, 88], [268, 66], [40, 92], [312, 80]].forEach(([x, y]) => { k.crudo(x, y, 2, 1, "#f0e04a"); k.crudo(x + 4, y, 2, 1, "#f0e04a"); });
    for (let i = 0; i < 24; i++) { const x = 20 + hash(i, 1, 82) * 280, y = 60 + hash(i, 2, 82) * 100; if (lit > 0.3) k.crudo(x, y, 1, 1, "#e8f87a"); }
    luces(k, [{ x: 160, y: 120, r: 56, ry: 48, col: "#c8e0ff", f: noche ? 0.35 : 0, p: 1 }]);
  }

  function estatua(k, x, base, lado, { erizado = false, rota = false, s = 1 } = {}) {
    const P = ["#dcd4c4", "#c4bcaa", "#aaa290", "#908878", "#766e60", "#5a5448"], M = ["#9aa86a", "#7c8a4e", "#5e6c3a"];
    const roca = (px, py, l = 0) => { const mus = fbm(px * 0.14, py * 0.14, s + 9) > 0.68 && ruido(px * 0.5, py * 0.5, s) > 0.45; if (mus) return rampa(M, 0.2 + l, px, py); return rampa(P, 0.2 + l + ((px - x) / 52) * 0.4 + (fbm(px * 0.22, py * 0.16, s) - 0.5) * 0.22 + (ruido(px * 0.9, py * 0.18, s + 1) > 0.84 ? 0.22 : 0), px, py); };
    const Y = (f) => base - f;
    if (!rota) {
      if (erizado) rellena(k, [[x - 12, Y(96)], [x - 30, Y(70)], [x - 24, Y(68)], [x - 34, Y(46)], [x - 24, Y(50)], [x - 30, Y(24)], [x - 18, Y(36)], [x - 16, Y(58)], [x + 16, Y(58)], [x + 18, Y(36)], [x + 30, Y(24)], [x + 24, Y(50)], [x + 34, Y(46)], [x + 24, Y(68)], [x + 30, Y(70)], [x + 12, Y(96)]], (px, py) => roca(px, py, 0.26 + (Math.round(px * 0.6 - py * 0.4) % 4 === 0 ? 0.16 : 0)));
      else rellena(k, [[x - 12, Y(96)], [x - 18, Y(70)], [x - 20, Y(30)], [x - 12, Y(34)], [x + 12, Y(34)], [x + 20, Y(30)], [x + 18, Y(70)], [x + 12, Y(96)]], (px, py) => roca(px, py, 0.26 + (Math.round(px) % 3 === 0 ? 0.12 : 0)));
    }
    rellena(k, [[x - 21, Y(-4)], [x - 22, Y(40)], [x - 24, Y(62)], [x + 24, Y(62)], [x + 22, Y(40)], [x + 21, Y(-4)]], (px, py) => roca(px, py, Math.round(py) % 6 === 0 && py > Y(40) ? 0.12 : 0));
    rellena(k, [[x - 14, Y(58)], [x + 14, Y(58)], [x + 12, Y(36)], [x, Y(32)], [x - 12, Y(36)]], (px, py) => roca(px, py, -0.08));
    trazo(k, [[x - 12, Y(36)], [x, Y(32)], [x + 12, Y(36)]], P[4]); k.R(x - 22, Y(10), 44, 3, P[4]); k.R(x - 22, Y(10), 44, 1, P[1]);
    [[-1], [1]].forEach(([sd]) => { rellena(k, [[x + sd * 20, Y(64)], [x + sd * 36, Y(60)], [x + sd * 38, Y(38)], [x + sd * 24, Y(40)]], (px, py) => roca(px, py, 0.04 + (Math.round(py) % 5 === 0 ? 0.18 : 0))); trazo(k, [[x + sd * 20, Y(64)], [x + sd * 36, Y(60)]], P[1]); });
    trazo(k, [[x - lado * 30, Y(40)], [x - lado * 32, Y(20)], [x - lado * 31, Y(-2)]], (f, px, py) => roca(px, py, 0.08), 9, 8);
    trazo(k, [[x + lado * 30, Y(40)], [x + lado * 32, Y(22)]], (f, px, py) => roca(px, py, 0.1), 9, 8);
    trazo(k, [[x + lado * 32, Y(22)], [x + lado * 16, Y(30)], [x + lado * 9, Y(44)]], (f, px, py) => roca(px, py, 0.04), 8, 7);
    rellena(k, [[x + lado * 4, Y(42)], [x + lado * 13, Y(42)], [x + lado * 13, Y(52)], [x + lado * 4, Y(52)]], (px, py) => roca(px, py, -0.02));
    rellena(k, [[x + lado * 5, Y(52)], [x + lado * 8, Y(52)], [x + lado * 8, Y(63)], [x + lado * 5, Y(63)]], (px, py) => roca(px, py, -0.1));
    rellena(k, [[x + lado * 8, Y(52)], [x + lado * 11, Y(52)], [x + lado * 11, Y(62)], [x + lado * 8, Y(62)]], (px, py) => roca(px, py, 0.1));
    if (!rota) {
      rellena(k, [[x - 6, Y(58)], [x + 6, Y(58)], [x + 6, Y(68)], [x - 6, Y(68)]], (px, py) => roca(px, py, 0.18));
      bola(k, x, Y(80), 11, 13, (px, py) => roca(px, py, -0.1));
      k.R(x - 8, Y(85), 5, 1, P[5]); k.R(x + 3, Y(85), 5, 1, P[5]); k.R(x - 7, Y(83), 3, 1, P[4]); k.R(x + 4, Y(83), 3, 1, P[4]);
      k.R(x - 1, Y(83), 2, 6, P[3]); k.P(x + 1, Y(77), P[5]); k.R(x - 4, Y(73), 8, 1, P[5]); k.R(x + 8, Y(86), 2, 12, P[4]);
      if (erizado) rellena(k, [[x - 12, Y(80)], [x - 16, Y(92)], [x - 9, Y(90)], [x - 8, Y(100)], [x - 2, Y(93)], [x + 3, Y(102)], [x + 7, Y(92)], [x + 15, Y(98)], [x + 13, Y(88)], [x + 17, Y(84)], [x + 12, Y(80)], [x + 9, Y(88)], [x - 9, Y(88)]], (px, py) => roca(px, py, 0.2));
      else rellena(k, [[x - 12, Y(76)], [x - 12, Y(88)], [x - 6, Y(94)], [x, Y(95)], [x + 6, Y(94)], [x + 12, Y(88)], [x + 12, Y(76)], [x + 9, Y(86)], [x + 1, Y(90)], [x - 1, Y(90)], [x - 9, Y(86)]], (px, py) => roca(px, py, 0.22 + (Math.round(px) % 3 === 0 ? 0.1 : 0)));
    } else {
      [[-12, 4], [-5, 9], [2, 3], [8, 7]].forEach(([dx, a]) => k.poli([[x + dx, Y(60)], [x + dx + 4, Y(60) - a], [x + dx + 7, Y(60)]], P[3]));
    }
  }
  function valleDelFin(k) {
    const { h, d } = cuando(k), rotas = d === 0;
    k.banda(["#6aa6d8", "#98c4e2", "#c8dee6", "#e6eee2"], 0, 104);
    nubarron(k, 92, 24, 50, 8); nubarron(k, 178, 16, 44, 7); cirros(k, 4, 2, 20);
    const RO = ["#c8bca8", "#b0a490", "#988c78", "#807462", "#665c4c", "#4c443a"], M = ["#8ca064", "#6e844c", "#526838"];
    const acant = (pts, s) => rellena(k, pts, (x, y) => { const mus = fbm(x * 0.1, y * 0.2, s) > 0.62 && (y % 9 < 3); return mus ? rampa(M, 0.2 + (hash(x, y, s) - 0.5) * 0.3, x, y) : rampa(RO, 0.3 + Math.sin(y / 3.4 + Math.sin(x / 19) * 2.2) * 0.18 + (ruido(x * 0.4, y * 0.08, s) > 0.74 ? 0.25 : 0) + (hash(x, y, s) - 0.5) * 0.1, x, y); });
    estatua(k, 62, 104, 1, { erizado: false, rota: rotas, s: 93 }); estatua(k, 258, 104, -1, { erizado: true, rota: rotas, s: 94 });
    acant([[-4, 160], [-4, 100], [40, 96], [92, 98], [124, 104], [126, 160]], 91); acant([[324, 160], [324, 98], [280, 96], [228, 98], [196, 104], [194, 160]], 92);
    for (let y = 104; y < 150; y++) { const a = 36 + (y - 104) * 0.18; for (let x = Math.round(160 - a); x <= 160 + a; x++) { const v = ruido(x * 0.6, y * 0.06 - (k.luz ? k.luz.hr : 0) * 0.3, 95); k.P(x, y, v > 0.7 ? "#f4fcff" : rampa(["#d4f0fa", "#b0e0f4", "#88c8ea", "#62a8d8", "#4a8cc0"], 0.15 + v * 0.55 + Math.abs(x - 160) / a * 0.2, x, y)); } }
    k.R(124, 102, 72, 3, "#ffffff"); k.R(124, 102, 72, 1, "#d0f0ff");
    k.agua(146, 180, ["#3a86b8", "#2e74a4", "#24628e", "#1c527a"], "#a8dcf2", 0);
    espejo(k, 146, 146, 180, { mezcla: 0.45, tinte: "#245a86", onda: 3, crestas: 0.12, paso: 1.6 });
    Det.reflejo(k, 152, 180);
    for (let x = 116; x < 204; x++) { const y = 147 + Math.round(Math.sin(x / 4) * 1.5); k.P(x, y, "#ffffff"); if (hash(x, 1, 96) > 0.4) k.P(x, y + 1, "#e8f8ff"); }
    bruma(k, 120, 168, "#ffffff", 0.95, { s: 97, ex: 0.05, ey: 0.15, x0: 90, x1: 230 });
    if (!k.luz || (k.luz.h >= 8 && k.luz.h <= 17)) k.alfa(0.28, () => ["#f27a7a", "#f2d24a", "#7ad88a", "#7ab8f2"].forEach((c, i) => { for (let a = 3.4; a < 6.0; a += 0.01) k.R(160 + Math.cos(a) * (58 - i * 3), 166 + Math.sin(a) * (50 - i * 3), 2, 1, c); }));
    acant([[-4, 182], [-4, 150], [38, 154], [80, 152], [104, 160], [98, 172], [118, 182]], 98); acant([[324, 182], [324, 150], [282, 154], [240, 152], [216, 160], [222, 172], [202, 182]], 99);
    [[20, 172, 30, 14], [64, 178, 24, 10], [238, 178, 26, 11], [288, 172, 32, 14]].forEach(([x, b, w, hh]) => Det.pena(k, x, b, w, hh, RO));
    if (d === 3 && h === 23) {
      k.alfa(0.22, () => k.crudo(0, 0, 320, 180, "#1c2634"));
      k.alfa(0.55, () => { for (let i = 0; i < 170; i++) { const x = hash(i, 1, 52) * 330, y = hash(i, 2, 52) * 190 - 8; for (let j = 0; j < 6; j++) k.crudo(x - j * 0.3, y + j, 1, 1, "#c8d8ec"); } });
      k.actores.push({ tipo: "lluvia", n: 57, col: "#c8d8ec", largo: 6 });
    }
  }

  window.SitiosIt6 = window.SitiosIt6 || {};
  window.SitiosIt6.ninjas = {
    2: ["Achiriku Ramen", "El puesto de ramen de noche, con sus cortinas y sus farolillos", achiriku, { ven: ["#ffd27a"], tinte: 0.2, fuego: ["#fff0c8", "#ffe2a4", "#f8cc80", "#e8b466", "#c8945a"] }],
    26: ["El campo de batalla", "La llanura arrasada de la guerra, con la estatua del Gedo al fondo", campoBatalla, { tinte: 0.45, fuego: ["#c8b8e8", "#3a2a5a", "#ece4ff"] }],
    5: ["El Bosque de la Muerte", "Árboles enormes y oscuros tras la valla de alambre", bosqueMuerte, { cielo: "propio", fuerza: 0.7, fuego: ["#f0e04a", "#e8f87a"] }],
    4: ["El Valle del Fin", "La cascada entre las dos estatuas gigantes", valleDelFin, { tinte: 0.2 }],
  };
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
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, K = window.N16;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const N = (window.SitiosIt15.ninjas = window.SitiosIt15.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const rotuloG = (k, x, y, texto, col, e = 2) => rotulo({ P: (px, py, c) => k.R(x + (px - x) * e, y + (py - y) * e, e, e, c) }, x, y, texto, col);
  const nubeUkatsaki = (k, x, y, e = 1) => { [[0, 0, 7], [-7, 2, 5], [7, 2, 5], [-3, -4, 5], [4, -4, 5]].forEach(([dx, dy, r]) => k.elipse(x + dx * e, y + dy * e, (r + 1.4) * e, (r + 1.4) * e * 0.8, "#f4efe0")); [[0, 0, 7], [-7, 2, 5], [7, 2, 5], [-3, -4, 5], [4, -4, 5]].forEach(([dx, dy, r]) => k.elipse(x + dx * e, y + dy * e, r * e, r * e * 0.8, "#c0302a")); k.R(x - 12 * e, y + 5 * e, 24 * e, 1.5 * e, "#c0302a"); };

  function guarida(k) {
    k.banda(["#1a0e18", "#2a1424", "#3e1c2e", "#521e30"], 0, 104);
    for (let i = 0; i < 60; i++) k.crudo(hash(i, 1, 411) * W, hash(i, 2, 411) * 70, 1, 1, i % 3 ? "#e8c8d8" : "#ffffff");
    P.fulgor(k, 236, 44, 40, ["#5a1a24", "#7a2430", "#9a2e36"], 0.5);
    bola(k, 236, 44, 24, 24, (x, y) => (Math.hypot(x - 228, y - 36) > 26 ? "#a82a30" : rampa(["#f05a4a", "#d83a3a", "#c0302a", "#a02428"], 0.1 + Math.hypot(x - 228, y - 36) / 40 + (fbm(x * 0.15, y * 0.15, 412) - 0.5) * 0.4, x, y)));
    [[228, 38, 4], [242, 50, 5], [232, 54, 3], [246, 36, 3]].forEach(([x, y, r]) => k.elipse(x, y, r, r * 0.8, "#a02428"));
    nubarron(k, -20, 60, 120, 10, ["#4a2434", "#3a1c2a", "#2a1420"]); nubarron(k, 120, 70, 90, 8, ["#4a2434", "#3a1c2a", "#2a1420"]);
    rellena(k, [[-2, 180], [-2, 92], [40, 80], [100, 84], [160, 74], [220, 86], [280, 78], [322, 90], [322, 180]], (x, y) => rampa(["#342a3a", "#2a2230", "#201a28", "#18141e", "#100c14"], 0.2 + 0.15 * Math.sin((y + x * 0.4) / 4 + Math.sin(x / 15) * 2) + (fbm(x * 0.06, y * 0.1, 413) - 0.5) * 0.4, x, y));
    nubeUkatsaki(k, 52, 118, 1.4); nubeUkatsaki(k, 268, 116, 1.4);
    bola(k, 160, 164, 66, 66, (x, y) => { const d = Math.hypot((x - 160) / 66, (y - 164) / 66); if (d > 0.86) { const c = celdas(Math.atan2(y - 164, x - 160) * 30, d * 40, 6, 5, 414, 0.4); return c.borde < 0.12 ? "#120c14" : rampa(["#463c4a", "#382f3c", "#2a2430", "#1e1a24"], 0.2 + (c.id - 0.5) * 0.4, x, y); } return rampa(["#2a1e2c", "#1e1622", "#140e18", "#0c080e"], 0.3 + (1 - d) * 0.6, x, y); });
    const G = ["#6a6270", "#56505e", "#46404e", "#36303e", "#28242e"];
    rellena(k, [[140, 112], [180, 112], [184, 128], [178, 150], [142, 150], [136, 128]], (x, y) => rampa(G, 0.15 + ((x - 160) / 24) * 0.35 + ((y - 130) / 20) * 0.25 + (fbm(x * 0.3, y * 0.3, 417) - 0.5) * 0.2, x, y));
    for (let i = 0; i < 9; i++) { const x = 146 + (i % 5) * 7, y = 122 + Math.floor(i / 5) * 5; k.R(x - 2, y, 5, 1, "#1e1a22"); k.crudo(x, y - 1, 1, 1, "#c8a8e8"); }
    T.rect(k, 140, 134, 40, 8, (x, y) => rampa(["#8a7a6a", "#6e6052", "#56483c"], (y - 134) / 8, x, y)); for (let x = 142; x < 180; x += 4) trazo(k, [[x, 134], [x + 3, 142]], "#3a3028");
    [[110, 120], [122, 112], [134, 118], [186, 118], [198, 112], [210, 120], [102, 132], [218, 132]].forEach(([x, top], i) => { T.rect(k, x - 2, top, 5, 170 - top, (px, py) => rampa(G, 0.2 + (px - x + 2) / 5 * 0.5, px, py)); k.elipse(x + 0.5, top, 3, 1.5, G[0]); if (i < 6) k.crudo(x - 1, top - 3, 3, 2, "#c8a8e8"); });
    bruma(k, 120, 180, "#6a3a5a", 0.4, { s: 415 });
    T.rect(k, 0, 162, W, 18, (x, y) => { const c = celdas(x, y * 1.6, 9, 6, 416, 0.7); return c.borde < 0.12 ? "#140e16" : rampa(["#5a4e5e", "#463c4c", "#342c3a", "#241e2a"], 0.2 + (c.id - 0.5) * 0.5 + ((y - 162) / 18) * 0.2, x, y); });
    luces(k, [{ x: 160, y: 120, r: 70, ry: 40, col: "#c8a8e8", f: 0.35 }, { x: 236, y: 44, r: 70, ry: 60, col: "#ff6a5a", f: 0.25 }]);
  }
  N[11] = ["La guarida de Ukatsaki", "Una cueva en la roca bajo una luna roja, con la estatua que guarda dentro", guarida, { cielo: "propio", base: "noche", astro: "siempre", luna: [236, 44, 24], fuego: ["#d83a3a", "#c0392b", "#f4efe0", "#a82a30", "#c0302a", "#f05a4a", "#c0302a", "#a02428", "#c8a8e8"] }];

  function puertas(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 106);
    nubarron(k, -16, 20, 90, 14); nubarron(k, 230, 30, 90, 12); cirros(k, 4, 4, 24);
    for (let i = 0; i < 22; i++) copa(k, -10 + i * 16, 98 + (i % 2) * 3, 14, 10, K.HOJAS.o, { r: 4, s: 421 + i });
    [[-2, 100], [220, 104]].forEach(([x, w]) => { T.rect(k, x, 98, w, 32, (px, py) => rampa(["#fbf2dc", "#efe2c4", "#dccaa6", "#c4ae86", "#a48e68"], 0.1 + (fbm(px * 0.2, py * 0.3, 422) - 0.5) * 0.25 + Math.max(0, (py - 124) / 6) * 0.4, px, py)); rellena(k, [[x - 2, 99], [x + 2, 92], [x + w - 2, 92], [x + w + 2, 99]], tejas(K.TEJAS.teja, { w: 4, h: 2, s: 423 + x, y0: 92 })); k.R(x - 2, 99, w + 4, 1, K.TEJAS.teja[4]); });
    const L = ["#e86a4a", "#c84a34", "#a03828", "#782a1e", "#521c12"];
    [[100, 8], [212, 8]].forEach(([x, w]) => cilindro(k, x, 22, w, 110, L, 0.3));
    T.tejadoJ(k, 160, 22, 150, 16, K.TEJAS.rojo, 424, 4); T.rect(k, 104, 22, 112, 6, (x, y) => rampa(L, 0.2 + (y - 22) / 6 * 0.6, x, y));
    T.rect(k, 140, 26, 40, 9, madera(["#5a4030", "#4a3424", "#3a281a", "#2a1c10", "#1c1208"], { paso: 3, largo: 99, s: 425 })); rotulo(k, 147, 28, "KANOHO", "#f2d27a");
    const VER = ["#5aa070", "#468a5c", "#367448", "#285c38", "#1c4428"];
    [[108, 52], [160, 52]].forEach(([x, w], i) => { T.rect(k, x, 36, w, 96, madera(VER, { paso: 4, vertical: true, largo: 99, s: 426 + i })); [52, 86, 118].forEach((y) => { k.R(x, y, w, 3, "#2a3a30"); for (let px = x + 3; px < x + w; px += 6) k.P(px, y + 1, "#8a9a90"); }); k.alfa(0.25, () => k.R(x + (i ? 0 : w - 3), 36, 3, 96, "#0e1c14")); K.hojaK(k, x + w / 2 + (i ? -2 : 2), 80, 11, "#c8302a"); });
    k.R(159, 36, 2, 96, "#1c2a20");
    T.prado(k, 128, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 427, { flores: { n: 24, cols: ["#ffffff", "#f2d24a"] } });
    for (let y = 130; y < H; y++) { const f = (y - 130) / 50, w = 26 + f * 40; for (let x = Math.round(160 - w); x <= 160 + w; x++) k.P(x, y, rampa(["#ead6a8", "#dcc494", "#c8ae7e", "#b09668"], 0.15 + Math.abs(x - 160) / w * 0.35 + (fbm(x * 0.15, y * 0.3, 428) - 0.5) * 0.35, x, y)); }
    T.casa(k, 236, 132, 40, 20, { techo: K.TEJAS.azul, s: 429, ventanas: [0.2, 0.7], puerta: null, alto: 9 }); T.rect(k, 238, 120, 36, 4, madera(PAL.MAD, { paso: 2, largo: 99, s: 430 })); k.R(240, 117, 4, 3, "#f4efe0"); k.R(262, 117, 6, 3, "#e8c040");
    arbol(k, 30, 160, 30, 28, 22, K.HOJAS.v, { g: 6, s: 431 }); arbol(k, 302, 166, 30, 26, 22, K.HOJAS.v, { g: 6, s: 432 });
    sombraE(k, 72, 150, 4, 1.5, 0.4); T.rect(k, 70, 124, 3, 26, madera(PAL.MAD_O, { paso: 1, vertical: true, largo: 99, s: 433 })); T.rect(k, 62, 126, 20, 6, madera(PAL.MAD, { paso: 2, largo: 99, s: 434 })); rotulo(k, 64, 127, "AQUI", "#3a2414");
    luces(k, [{ x: 256, y: 116, r: 20, ry: 12, col: LUZ, f: lit * 0.7 }]);
  }
  N[12] = ["Las puertas de Kanoho", "Las grandes puertas verdes, al final del camino", puertas, { ven: VEN }];

  function nuevecolas(k) {
    k.banda(["#1a0a0e", "#2e1014", "#4a1a18", "#6a2a1e", "#8a3a22"], 0, 130);
    k.astro(270, 30, 16, "#f4ead0", "#8a4a3a");
    for (let i = 0; i < 40; i++) k.crudo(hash(i, 1, 441) * W, hash(i, 2, 441) * 50, 1, 1, "#e8c8b8");
    const zorro = !(k.gente || []).includes("Karuma");
    const Z = ["#ffb850", "#f0902e", "#d06a1e", "#a84e16", "#7a3610"];
    if (zorro) {
    for (let i = 0; i < 9; i++) { const a0 = -0.2 - i * 0.34, p0 = [262, 70], p3 = [262 + Math.cos(a0) * 120, 70 + Math.sin(a0) * 90], p1 = [262 + Math.cos(a0 + 0.6) * 40, 70 + Math.sin(a0 + 0.6) * 40], p2 = [p3[0] - Math.cos(a0 - 0.9) * 40, p3[1] - Math.sin(a0 - 0.9) * 40]; trazo(k, Det6.bezier(p0, p1, p2, p3, 30), (f) => Z[f < 0.2 ? 3 : f < 0.6 ? 2 : f < 0.85 ? 1 : 0], 16, 5); }
    bola(k, 238, 74, 62, 30, (x, y) => rampa(Z, 0.3 + ((x - 238) / 62) * 0.3 + ((y - 74) / 30) * 0.3 + (fbm(x * 0.12, y * 0.12, 442) - 0.5) * 0.3, x, y));
    const cara = [[198, 34], [214, 42], [246, 42], [262, 34], [258, 54], [244, 66], [234, 76], [226, 76], [216, 66], [202, 54]];
    rellena(k, cara, (x, y) => rampa(Z, 0.05 + ((x - 230) / 32) * 0.35 + ((y - 34) / 42) * 0.3 + (fbm(x * 0.2, y * 0.2, 443) - 0.5) * 0.2, x, y));
    trazo(k, cara.concat([cara[0]]), Z[4], 1);
    [[198, 34, 202, 6, 214, 40], [262, 34, 258, 6, 246, 40]].forEach(([ax, ay, bx, by, cx2, cy2]) => { k.poli([[ax, ay], [bx, by], [cx2, cy2]], Z[1]); k.poli([[ax + (cx2 - ax) * 0.25, ay + 1], [bx + (cx2 > ax ? 2 : -2), by + 8], [cx2 - (cx2 - ax) * 0.25, cy2 - 1]], "#5a1a0e"); });
    [[218, 50, -1], [242, 50, 1]].forEach(([x, y, s]) => { k.poli([[x - 7 * s, y - 3], [x + 6 * s, y + 1], [x + 3 * s, y + 4], [x - 6 * s, y + 2]], "#fff0a0"); k.crudo(x - 1, y - 2, 2, 6, "#c0302a"); k.crudo(x, y - 1, 1, 4, "#1c0a08"); });
    k.elipse(230, 68, 4, 3, "#1c0a08"); trazo(k, [[214, 70], [222, 74], [238, 74], [246, 70]], "#3a0a0a", 2, 1); for (let i = 0; i < 5; i++) k.poli([[218 + i * 6, 73], [221 + i * 6, 73], [219.5 + i * 6, 77]], "#fff6e8");
    }
    K.monteHakoge(k, 4, { y0: 70, base: 150 });
    const vs = [];
    [[-6, 28, "rojo"], [24, 26, "tierra"], [52, 30, "azul"], [84, 24, "teja"], [112, 28, "rojo"], [196, 26, "azul"], [224, 30, "tierra"], [256, 26, "rojo"], [286, 34, "teja"]].forEach(([x, w, t], i) => vs.push(...K.casaK(k, x, 140, w, 16, { techo: K.TEJAS[t], s: 443 + i, deposito: i % 3 === 1 })));
    const F = [];
    [[30, 126, 10, 18], [78, 124, 12, 22], [120, 128, 9, 16], [206, 126, 11, 20], [250, 124, 12, 24], [300, 128, 10, 18]].forEach(([x, b, w, h], i) => { pluma(k, x, b - h, 40, 8, ["#5a3a3a", "#4a2e2e", "#3a2424", "#2a1a1a"], { s: 444 + i, viento: 0.4 }); fuego(k, x, b, w, h, { s: 450 + i }); F.push({ x, y: b - h / 2, r: 40, ry: 26, col: "#ff8a3a", f: 1 }); });
    T.rect(k, 0, 140, W, 40, T.tex(["#8a6a5a", "#76584a", "#62483c", "#4e3830", "#3a2a24"], { v0: 0.3, s: 456, dy: 0.3, y0: 140, alto: 40 }));
    P.chispas(k, 160, 140, 300, 120, 60, 457);
    luces(k, zorro ? [...F, { x: 214, y: 60, r: 80, ry: 50, col: "#ff9a4a", f: 0.5 }] : F);
  }
  N[13] = ["La noche del Nueve Colas", "Kanoho arde la noche en que nace Karuto y ataca el zorro de nueve colas", nuevecolas, { cielo: "propio", base: "noche", astro: "siempre", luna: [270, 30, 16], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a", "#f8a040", "#e8802a", "#fff0a0", "#c0302a", "#fff6e8"] }];

  function piso(k) {
    const lit = encendido(k);
    T.rect(k, 0, 0, W, 120, (x, y) => rampa(["#f2e4c8", "#e4d2b0", "#d0bc96", "#b8a27c", "#9a8462"], 0.2 + (fbm(x * 0.2, y * 0.2, 461) - 0.5) * 0.2 + (x % 40 === 0 ? 0.3 : 0), x, y));
    T.rect(k, 0, 96, W, 24, madera(["#b88a5a", "#9a6e44", "#7c5634", "#5e3e24", "#422a16"], { paso: 4, vertical: true, largo: 99, s: 462 })); k.R(0, 95, W, 2, "#5e3e24");
    T.rect(k, 104, 12, 112, 70, () => "#2a3670");
    rellena(k, [[104, 82], [104, 52], [140, 46], [180, 44], [216, 50], [216, 82]], (x, y) => rampa(["#7a6a5a", "#665848", "#544838", "#42382c"], 0.3 + (fbm(x * 0.2, y * 0.2, 463) - 0.5) * 0.4, x, y));
    [124, 148, 172, 196].forEach((x) => { bola(k, x, 62, 8, 10, () => "#6a5a4a"); k.R(x - 4, 60, 3, 1, "#3a3028"); k.R(x + 1, 60, 3, 1, "#3a3028"); });
    for (let x = 104; x < 216; x += 14) { k.R(x, 74, 13, 8, "#3a2e28"); k.poli([[x - 1, 74], [x + 6, 70], [x + 14, 74]], "#4a3a32"); k.R(x + 4, 76, 3, 3, "#ffd27a"); }
    k.R(100, 8, 120, 4, "#7a5434"); k.R(100, 82, 120, 4, "#7a5434"); k.R(100, 8, 4, 78, "#7a5434"); k.R(216, 8, 4, 78, "#7a5434"); k.R(159, 12, 2, 70, "#7a5434"); k.R(104, 46, 112, 2, "#7a5434");
    [[[86, 4], [110, 4], [108, 60], [92, 66]], [[210, 4], [234, 4], [228, 66], [212, 60]]].forEach((pts) => rellena(k, pts, (px, py) => rampa(["#ffb060", "#f08a3a", "#d06a24", "#a8501a"], 0.15 + (Math.sin(px * 0.8) + 1) * 0.25, px, py)));
    k.R(84, 2, 152, 3, "#5a3a24");
    T.rect(k, 238, 14, 34, 34, () => "#f4efe6"); k.elipse(255, 31, 13, 13, "#c0392b"); k.elipse(255, 31, 9, 9, "#f4efe6"); k.elipse(255, 31, 5, 5, "#c0392b"); k.elipse(255, 31, 2, 2, "#f4efe6"); trazo(k, [[248, 24], [258, 30]], "#3a3a44", 1);
    T.rect(k, 230, 58, 66, 4, madera(PAL.MAD, { paso: 2, largo: 99, s: 464 })); k.R(232, 62, 2, 6, "#6a4a30"); k.R(292, 62, 2, 6, "#6a4a30");
    k.R(272, 48, 12, 10, "#c8784a"); esfera(k, 278, 44, 7, 6, ["#8ad070", "#62b04e", "#448a3c", "#2e6a2a"]); k.P(276, 43, "#1c1c22"); k.P(280, 43, "#1c1c22"); k.R(277, 46, 3, 1, "#2e6a2a");
    T.rect(k, 244, 46, 12, 12, () => "#c8a878"); k.R(245, 47, 10, 10, "#8ab0d0"); [[247, 52, "#f2c84b"], [250, 52, "#3a3a44"], [253, 52, "#f08ac0"]].forEach(([x, y, c]) => { k.R(x, y, 2, 4, c); k.R(x, y - 2, 2, 2, "#f2d0a8"); });
    suelo3d(k, 120, 180, 160, 70, tablones(["#d0a070", "#b8885a", "#9c7046", "#7e5834", "#604226", "#442e18"], { pw: 14, L: 70, s: 465 }));
    k.alfa(0.3, () => k.R(0, 120, W, 2, "#2a1a10"));
    T.rect(k, -2, 100, 70, 42, madera(PAL.MAD_O, { paso: 4, largo: 99, s: 466 })); T.rect(k, -2, 96, 66, 12, (x, y) => rampa(["#f4f4f8", "#e4e4ec", "#ccccd8"], (y - 96) / 12, x, y));
    T.rect(k, -2, 106, 70, 22, (x, y) => rampa(["#5a8ad8", "#4070c0", "#2e58a0", "#204480"], 0.2 + (fbm(x * 0.2, y * 0.3, 467) - 0.5) * 0.4 + (Math.round(x + y) % 9 === 0 ? 0.2 : 0), x, y));
    esfera(k, 18, 94, 8, 6, ["#f8f8f8", "#e8e8f0", "#c8c8d4"]); k.elipse(16, 92, 2, 2, "#1c1c22"); k.elipse(21, 92, 2, 2, "#1c1c22"); k.R(14, 86, 9, 3, "#3a6ac8");
    T.rect(k, 92, 108, 64, 4, madera(PAL.MAD, { paso: 2, largo: 99, s: 468 })); [[96], [150]].forEach(([x]) => k.R(x, 112, 3, 16, "#6a4a30")); sombraE(k, 126, 130, 34, 2.5, 0.35);
    [[100, 106], [112, 106], [124, 106], [138, 106]].forEach(([x, y]) => { rellena(k, [[x - 4, y - 8], [x + 4, y - 8], [x + 3, y], [x - 3, y]], (px, py) => (py < y - 5 ? "#f4efe0" : "#d8302a")); k.R(x - 3, y - 6, 6, 1, "#f4efe0"); });
    trazo(k, [[146, 104], [154, 98]], "#c8a060"); trazo(k, [[148, 104], [156, 99]], "#c8a060");
    [[60, 150], [196, 166], [250, 140], [212, 136]].forEach(([x, y]) => { sombraE(k, x + 1, y + 1, 4, 1, 0.4); rellena(k, [[x - 4, y - 8], [x + 4, y - 8], [x + 3, y], [x - 3, y]], (px, py) => (py < y - 5 ? "#f4efe0" : "#d8302a")); });
    T.rect(k, 270, 112, 30, 4, madera(PAL.MAD, { paso: 2, largo: 99, s: 469 })); k.R(272, 116, 2, 18, "#6a4a30"); k.R(296, 116, 2, 18, "#6a4a30"); rellena(k, [[272, 100], [298, 100], [302, 116], [268, 116]], (x, y) => rampa(["#ffa050", "#f0802a", "#d06420"], (y - 100) / 16 + (x === 285 ? 0.4 : 0), x, y)); k.R(280, 100, 10, 3, "#2a2a3a");
    esfera(k, 172, 168, 7, 5, ["#a8d880", "#80c060", "#5a9a44", "#3e7a32"]); k.R(168, 165, 2, 2, "#1c1c22"); k.R(175, 165, 2, 2, "#1c1c22");
    luces(k, [{ x: 160, y: 50, r: 120, ry: 80, col: "#c8d8ff", f: 0.25 }]);
  }
  N[14] = ["El piso de Karuto", "Su cuarto: la cama, los vasos de ramen y la ventana que da al monte de los Hakoge", piso, { cielo: "propio", fuerza: 0.55, ventanal: "#2a3670" }];

  function academia(k) {
    const lit = encendido(k);
    k.banda(CIELO, 0, 110);
    nubarron(k, -16, 40, 80, 12); nubarron(k, 246, 30, 80, 12);
    for (let i = 0; i < 22; i++) copa(k, -10 + i * 16, 104 + (i % 2) * 2, 13, 9, K.HOJAS.o, { r: 4, s: 471 + i });
    const PA = ["#fbe4c4", "#f2d0a4", "#e4ba88", "#ccA06e", "#ac8456"];
    T.rect(k, 96, 52, 128, 70, (x, y) => rampa(PA, 0.1 + ((x - 96) / 128) * 0.4 + (fbm(x * 0.2, y * 0.2, 472) - 0.5) * 0.18 + (y === 86 ? 0.3 : 0), x, y));
    k.R(96, 86, 128, 2, "#c86a3a");
    const vs = [];
    for (let f = 0; f < 2; f++) for (let x = 102; x < 220; x += 14) { if (f === 1 && x > 146 && x < 172) continue; T.ventana(k, x, 58 + f * 32, 8, 10, { marco: "#7a4a2a", vidrio: "#55697c" }); vs.push([x + 4, 63 + f * 32]); }
    T.tejado(k, 92, 228, 40, 53, K.TEJAS.rojo, 473, { vuelo: 5 });
    T.rect(k, 150, 98, 20, 24, madera(["#a87444", "#8a5a32", "#6e4626", "#54321a", "#3a2210"], { paso: 3, vertical: true, largo: 99, s: 474 })); k.R(159, 98, 2, 24, "#3a2210"); k.R(146, 96, 28, 3, "#7a4a2a");
    k.elipse(160, 26, 17, 17, "#e8b040"); k.elipse(160, 26, 15, 15, "#f8d070"); for (let a = 0; a < 12; a += 0.07) { const e = 1 + (a / 12) * 11; k.R(160 + Math.cos(a) * e, 26 + Math.sin(a) * e, 2, 2, "#e8602a"); } k.R(158, 40, 4, 12, "#7a4a2a");
    T.rect(k, 0, 122, W, 58, T.tex(["#ead6a8", "#dcc494", "#c8ae7e", "#b09668", "#947c52"], { v0: 0.15, s: 475, dy: 0.35, y0: 122, alto: 58 }));
    k.alfa(0.3, () => k.R(0, 123, W, 2, "#5a4a2a"));
    for (let y = 124; y < H; y++) { const f = (y - 124) / 56, w = 12 + f * 30; for (let x = Math.round(160 - w); x <= 160 + w; x++) if (hash(x, y, 476) > 0.3) k.P(x, y, rampa(["#f2e2bc", "#e2cea4"], 0.3, x, y)); }
    arbol(k, 60, 148, 30, 28, 22, K.HOJAS.v, { g: 6, s: 477 });
    trazo(k, [[60, 116], [86, 108]], "#6e4a2e", 3, 2); [80, 92].forEach((x) => trazo(k, [[x, 112], [x - 2, 146]], "#8a6a4a", 1)); T.rect(k, 76, 144, 18, 3, madera(PAL.MAD, { paso: 2, largo: 99, s: 478 }));
    arbol(k, 286, 150, 30, 28, 22, K.HOJAS.v, { g: 6, s: 479 });
    [[112, 152], [212, 150]].forEach(([x, b]) => { sombraE(k, x + 2, b, 6, 1.5, 0.4); T.rect(k, x - 1, b - 22, 3, 22, madera(PAL.MAD_O, { paso: 1, vertical: true, largo: 99, s: x })); k.elipse(x, b - 26, 8, 8, "#f4efe0"); k.elipse(x, b - 26, 6, 6, "#c0392b"); k.elipse(x, b - 26, 3, 3, "#f4efe0"); k.elipse(x, b - 26, 1, 1, "#c0392b"); trazo(k, [[x + 2, b - 27], [x + 6, b - 31]], "#5a5a64"); });
    for (let x = 0; x < W; x += 6) { if (x > 30 && x < 290) continue; k.R(x, 150, 2, 12, "#8a6440"); } k.R(0, 152, 32, 1, "#a87a50"); k.R(288, 152, 32, 1, "#a87a50");
    luces(k, vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })));
  }
  N[15] = ["La Academia", "La escuela de ninjas, con su gran símbolo rojo y el columpio de Karuto", academia, { ven: ["#55697c", "#ffd27a"], dx: 70 }];

  function tunzaka(k) {
    const lit = encendido(k);
    k.banda(["#80b4dc", "#a6cae4", "#d0e0e8", "#f4ead8"], 0, 104);
    nubarron(k, 30, 26, 70, 12); nubarron(k, 250, 20, 70, 12);
    montana(k, 60, 104, 150, 44, { roca: ["#c8a888", "#b49474", "#a08062", "#8a6c52"] }); montana(k, 270, 104, 160, 50, { roca: ["#c8a888", "#b49474", "#a08062", "#8a6c52"] });
    rellena(k, [[90, 108], [120, 80], [200, 80], [230, 108]], piedra(["#c8c0b0", "#b0a898", "#988f80", "#7e766a", "#645e54"], { tx: 9, ty: 5, s: 481 }));
    const BL = ["#ffffff", "#f4f2ea", "#e2ded2", "#c8c2b2"];
    T.rect(k, 124, 54, 72, 26, (x, y) => rampa(BL, 0.1 + ((x - 124) / 72) * 0.5, x, y)); for (let x = 130; x < 192; x += 10) T.ventana(k, x, 62, 4, 6, { marco: "#5a5a64", vidrio: "#55697c", cruz: false });
    T.tejadoJ(k, 160, 56, 92, 12, ["#8aa6a0", "#6e8c86", "#56726c", "#405852", "#2c403c"], 482, 4);
    T.rect(k, 136, 34, 48, 20, (x, y) => rampa(BL, 0.1 + ((x - 136) / 48) * 0.5, x, y)); T.tejadoJ(k, 160, 36, 64, 12, ["#8aa6a0", "#6e8c86", "#56726c", "#405852", "#2c403c"], 483, 4);
    rellena(k, [[176, 30], [190, 22], [198, 36], [192, 56], [182, 50]], () => "#5a5048"); for (let i = 0; i < 8; i++) k.R(180 + hash(i, 1, 484) * 16, 50 + hash(i, 2, 484) * 8, 3, 2, "#8a8070");
    pluma(k, 188, 30, 30, 8, ["#9a948e", "#7c7670", "#5e5a56", "#46423e"], { s: 485, viento: 0.6 });
    const vs = [];
    [[-6, 34, "rojo"], [28, 30, "teja"], [60, 32, "tierra"], [224, 32, "azul"], [256, 30, "rojo"], [286, 36, "teja"]].forEach(([x, w, t], i) => vs.push(...K.casaK(k, x, 130, w, 26, { techo: K.TEJAS[t], s: 486 + i, noren: i % 2 ? "#c0392b" : "#3a5a9a" })));
    const farolillos = [];
    [[0, 96, 150, 104], [170, 104, 320, 96]].forEach(([x0, y0, x1, y1]) => { for (let i = 0; i <= 150; i++) { const t = i / 150, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * 6; k.P(x, y, "#3a2a20"); if (i % 15 === 7) farolillos.push([x, y + 4]); } });
    farolillos.forEach(([x, y], i) => { Det.farolillo(k, x, y, i % 3 ? "#e8402a" : "#f2c84b", 2); if (lit > 0) k.crudo(x - 1, y - 1, 2, 2, "#fff0c0"); });
    const puesto = (x, base, col, s) => { sombraE(k, x + 12, base, 14, 2, 0.4); T.rect(k, x, base - 12, 24, 12, madera(PAL.MAD, { paso: 3, largo: 99, s })); k.R(x - 1, base - 13, 26, 2, PAL.MAD[0]); k.R(x + 1, base - 26, 2, 14, PAL.MAD_O[3]); k.R(x + 21, base - 26, 2, 14, PAL.MAD_O[3]); for (let i = 0; i < 7; i++) k.R(x - 2 + i * 4, base - 30, 4, 5, i % 2 ? "#f4efe0" : col); [[4, "#e8c040"], [10, "#c0392b"], [16, "#f4efe0"]].forEach(([dx, c]) => k.R(x + dx, base - 16, 4, 3, c)); };
    T.rect(k, 0, 128, W, 52, T.tex(["#e4cfa0", "#d4bc88", "#c0a674", "#a88e5e", "#8c744a"], { v0: 0.2, s: 489, dy: 0.3, y0: 128, alto: 52 }));
    k.alfa(0.3, () => k.R(0, 129, W, 2, "#5a4a2a"));
    puesto(40, 150, "#c0392b", 487); puesto(254, 152, "#3a6ac8", 488);
    luces(k, [...vs.map(([x, y]) => ({ x, y, r: 12, ry: 9, col: LUZ, f: lit * 0.8 })), ...farolillos.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: "#ffb45a", f: lit * 0.7 }))]);
  }
  N[16] = ["La ciudad de Tunzaka", "La ciudad del castillo y los farolillos, donde encuentran a Tsanude", tunzaka, { ven: ["#ffd27a", "#55697c"], tinte: 0.2, fuego: ["#e8402a", "#ffb04a", "#fff0c0"], dx: 76 }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, ladrillo, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, K = window.N16;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const N = (window.SitiosIt15.ninjas = window.SitiosIt15.ninjas || {});
  const abanico = (k, x, y, r) => { bola(k, x, y, r, r * 1.1, (px, py) => (py < y ? "#c8302a" : "#f4efe6")); k.R(x - 1, y + r * 1.1 - 1, 2, r * 0.7, "#5a3a2a"); for (let a = 0; a < Math.PI * 2; a += 0.05) k.P(x + Math.cos(a) * r, y + Math.sin(a) * r * 1.1, "#3a2a24"); };

  function termales(k) {
    const lit = encendido(k);
    k.banda(["#1a2244", "#24305a", "#34446e", "#4a5a80"], 0, 96);
    nubarron(k, 200, 14, 90, 10, ["#4a5478", "#3a4466", "#2e3654"]);
    montana(k, 200, 96, 160, 38, { roca: ["#3a4462", "#323a56", "#2a3048", "#22283c"] });
    T.rect(k, 0, 66, W, 44, madera(["#8a6a50", "#74583e", "#5e4630", "#4a3624", "#362618", "#24180e"], { paso: 5, vertical: true, largo: 99, s: 491 }));
    k.R(0, 64, W, 3, "#4a3624"); k.R(0, 86, W, 2, "#4a3624"); for (let x = 2; x < W; x += 10) k.R(x, 62, 3, 3, "#5e4630");
    k.R(200, 76, 4, 6, "#1a120c"); k.P(201, 78, "#e8e0c8");
    T.rect(k, -2, 50, 72, 60, madera(["#b8946a", "#9c7a54", "#806240", "#644c30", "#4a3620"], { paso: 4, largo: 99, s: 492 })); T.tejado(k, -6, 74, 40, 51, K.TEJAS.teja, 493, { vuelo: 4 });
    T.rect(k, 12, 64, 30, 22, () => "#ffd27a"); for (let x = 12; x < 42; x += 6) k.R(x, 64, 1, 22, "#8a6440"); for (let y = 64; y < 86; y += 6) k.R(12, y, 30, 1, "#8a6440"); k.R(10, 62, 34, 2, "#4a3620"); k.R(10, 86, 34, 2, "#4a3620");
    for (let i = 0; i < 6; i++) { const x = 272 + i * 8; for (let y = 110; y > 30 + (i % 3) * 8; y--) k.P(x, y, (110 - y) % 10 === 0 ? "#2a4a2e" : "#4a7a4a"); fronda(k, x, 40 + (i % 3) * 8, i % 2 ? 1 : -1, -0.2, 9, ["#7ab070", "#5a9058", "#3e7044", "#2a5432"], { caida: 0.4, foliolo: 2 }); }
    suelo3d(k, 108, 180, 160, 70, losas3d(["#8a8e9a", "#767a86", "#626672", "#4e525e", "#3c3e48"], { tx: 15, tz: 10, s: 494 }));
    const cx = 128, cy = 132;
    bola(k, cx, cy, 86, 22, (x, y) => { const d = Math.hypot((x - cx) / 86, (y - cy) / 22); if (d > 0.84) { const c = celdas(Math.atan2(y - cy, x - cx) * 40, d * 30, 7, 5, 495, 0.5); return c.borde < 0.12 ? "#3a3c44" : rampa(["#c8ccd4", "#aeb2bc", "#9498a2", "#7a7e88"], 0.15 + (c.id - 0.5) * 0.4 + ((y - cy) / 22) * 0.2, x, y); } return rampa(["#9ad0e8", "#7ab8d8", "#5ea0c4", "#4688ac"], 0.15 + ((y - cy + 22) / 44) * 0.6, x, y); });
    espejo(k, 110, cy - 18, cy + 18, { tinte: "#3a6488", mezcla: 0.55, onda: 2, dentro: (x, y) => Math.hypot((x - cx) / 72, (y - cy) / 18) < 1 });
    bruma(k, 96, 150, "#e8eef6", 0.75, { s: 496, x0: 30, x1: 240, perfil: (x, y) => Math.max(0, 1 - Math.hypot((x - cx) / 100, (y - cy + 6) / 30)) });
    const toro = (x, base) => { sombraE(k, x + 2, base, 7, 2, 0.45); const ST = ["#a8a8a8", "#8c8c8c", "#707070", "#585858"]; T.rect(k, x - 2, base - 12, 4, 12, (px, py) => rampa(ST, 0.2 + (px - x + 2) / 4 * 0.6, px, py)); T.rect(k, x - 6, base - 15, 12, 3, (px, py) => rampa(ST, 0.3, px, py)); T.rect(k, x - 4, base - 22, 8, 7, (px, py) => rampa(ST, 0.2, px, py)); k.R(x - 2, base - 20, 4, 3, "#ffd27a"); rellena(k, [[x - 8, base - 22], [x + 8, base - 22], [x + 2, base - 27], [x - 2, base - 27]], (px, py) => rampa(ST, 0.15 + (px - x + 8) / 16 * 0.6, px, py)); };
    toro(246, 140); toro(40, 122); toro(214, 120);
    [[226, 150], [236, 154]].forEach(([x, b]) => { sombraE(k, x + 2, b, 6, 1.5, 0.45); Det.cilindro(k, x - 4, b - 7, 9, 7, ["#c8a070", "#a88050", "#86603a", "#644628"]); k.R(x - 4, b - 5, 9, 1, "#5a4030"); });
    k.R(214, 160, 14, 3, "#f4f0e8"); k.R(214, 162, 14, 1, "#c8c0b0");
    luces(k, [{ x: 27, y: 75, r: 34, ry: 26, col: "#ffcf7a", f: 0.9 }, { x: 246, y: 120, r: 26, ry: 18, col: "#ffcf7a", f: lit }, { x: 40, y: 102, r: 30, ry: 20, col: "#ffcf7a", f: lit }, { x: 214, y: 100, r: 30, ry: 20, col: "#ffcf7a", f: lit }, { x: 128, y: 132, r: 90, ry: 24, col: "#ffe6b0", f: lit * 0.45 }]);
  }
  N[17] = ["Las aguas termales", "El baño de piedra entre vapor, con la valla por la que espía Jariiya", termales, { tinte: 0.1, ven: [], fuego: ["#ffd27a"] }];

  function irocho(k) {
    T.rect(k, 0, 0, W, 130, (x, y) => { const c = celdas(x, y, 13, 7, 501, 0.25); if (c.borde < 0.08) return "#0e0c14"; return rampa(["#4e4a5a", "#3e3a4a", "#302c3c", "#22202e", "#16141e"], 0.2 + (c.id - 0.5) * 0.4 + c.dy * -0.2 + (y / 130) * 0.2, x, y); });
    bola(k, 160, 100, 52, 62, (x, y) => { const d = Math.hypot((x - 160) / 52, (y - 100) / 62); if (d > 0.82) { const c = celdas(Math.atan2(y - 100, x - 160) * 26, d * 30, 5, 6, 502, 0.3); return c.borde < 0.12 ? "#0e0c14" : rampa(["#7a7488", "#64607a", "#504c64", "#3e3a50"], 0.2 + (c.id - 0.5) * 0.3, x, y); } return rampa(["#2a1a48", "#1e1238", "#140c28", "#0a0618"], 0.2 + (1 - d) * 0.7, x, y); });
    T.rect(k, 108, 100, 104, 30, (x, y) => { const d = Math.abs(x - 160) / 52; return d > 0.82 ? rampa(["#7a7488", "#64607a", "#504c64", "#3e3a50"], 0.3, x, y) : rampa(["#2a1a48", "#1e1238", "#140c28", "#0a0618"], 0.3, x, y); });
    P.fulgor(k, 160, 100, 30, ["#3a2a6a", "#5a3a98", "#8a5ac8", "#c8a8f8"], 0.7);
    for (let i = 0; i < 4; i++) { const w = 30 - i * 6, h = 34 - i * 7; for (let a = Math.PI; a <= Math.PI * 2; a += 0.02) k.crudo(160 + Math.cos(a) * w, 120 + Math.sin(a) * h, 1, 1, "#3a2a6a"); }
    const SV = ["#7ac890", "#5aa870", "#3e8856", "#2a683e"];
    const cuerpo = []; for (let i = 0; i <= 40; i++) { const t = i / 40; cuerpo.push([104 + t * 112, 30 - Math.sin(t * Math.PI * 3) * 5 - Math.sin(t * Math.PI) * 6]); }
    trazo(k, cuerpo, (f) => SV[Math.floor(f * 8) % 2 ? 1 : 2], 6, 4); bola(k, 218, 28, 7, 5, (x, y) => rampa(SV, 0.2 + (y - 23) / 10 * 0.5, x, y)); k.crudo(220, 26, 2, 1, "#ffe06a"); trazo(k, [[224, 30], [230, 32], [232, 29]], "#c0302a");
    [[18, 60, 64], [238, 60, 64]].forEach(([x, y, w]) => { T.rect(k, x, y, w, 66, () => "#0c0a12"); for (let px = x + 3; px < x + w; px += 8) Det.cilindro(k, px, y, 3, 66, ["#8a8a96", "#6a6a76", "#4a4a54", "#30303a"]); k.R(x - 2, y - 3, w + 4, 4, "#3a3644"); k.R(x - 2, y + 64, w + 4, 3, "#3a3644"); });
    const F = [T.antorcha(k, 98, 54), T.antorcha(k, 222, 54)];
    suelo3d(k, 130, 180, 160, 96, losas3d(["#4e4a5a", "#423e4e", "#363244", "#2a2838", "#201e2c"], { tx: 15, tz: 10, s: 503 })); k.R(0, 130, W, 2, "#16141e");
    [[60, 162, 1], [250, 168, -1], [118, 172, 1]].forEach(([x, y, d], i) => { const pts = []; for (let t = 0; t <= 1; t += 0.05) pts.push([x + d * t * 22, y + Math.sin(t * Math.PI * 3) * 3]); trazo(k, pts, SV[1], 2, 1); k.elipse(x + d * 23, y, 2, 1.5, SV[0]); k.P(x + d * 24, y - 1, "#ffe06a"); });
    bruma(k, 140, 180, "#5a4a7a", 0.4, { s: 504 });
    luces(k, [...F, { x: 160, y: 104, r: 70, ry: 40, col: "#a07ae8", f: 0.6 }]);
  }
  N[18] = ["La guarida de Irochomura", "Los túneles de piedra bajo tierra, con antorchas y una serpiente tallada en el arco", irocho, { cielo: "propio", fuerza: 0.06, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#6a3fa8", "#2a1a48", "#c8a8f8", "#7ae8b0", "#3a7a5a", "#c8e8d0", "#3a2a6a", "#5a3a98", "#8a5ac8", "#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];

  function kara(k) {
    const lit = encendido(k), noche = k.luz && k.luz.noche;
    k.banda(["#4a6a5a", "#5a7a66", "#6a8a72", "#7a9a7e"], 0, 130);
    for (let i = 0; i < 14; i++) { const x = 6 + i * 23 + (i % 2) * 6, w = 6 + (i % 3) * 2; T.rect(k, x, 0, w, 130, (px, py) => rampa(["#9aae9e", "#8aa08e", "#7a907e", "#6a806e"], 0.2 + (px - x) / w * 0.6, px, py)); }
    bruma(k, 40, 130, "#c8d8c8", 0.6, { s: 511 });
    const TR = ["#8a7a6a", "#6e6052", "#56483c", "#40342a", "#2c241c", "#1c160e"];
    [[30, 26], [96, 20], [210, 22], [272, 28]].forEach(([x, w], i) => { rellena(k, [[x - w / 2, -2], [x + w / 2, -2], [x + w / 2 + 2, 128], [x + w / 2 + 10, 144], [x - w / 2 - 10, 144], [x - w / 2 - 2, 128]], corteza(TR, x - w / 2, w, { s: 512 + i, grieta: 0.5, musgo: { umbral: 0.6, pal: ["#8ab070", "#6a9a58", "#4e7e44", "#386234"] } })); [-1, 1].forEach((d) => trazo(k, Det6.bezier([x + d * w * 0.4, 130], [x + d * w * 0.8, 136], [x + d * w, 140], [x + d * w * 1.3, 146], 10), TR[3], 4, 1)); });
    copa(k, 160, -10, 220, 26, ["#5a8a5a", "#4a7a4c", "#3a6840", "#2c5434", "#1e4026"], { r: 9, s: 516 });
    if (!noche) rayos(k, [[120, 0, 100, 140, 4, 30], [180, 0, 196, 140, 3, 24], [250, 0, 236, 130, 3, 20]], "#fff4c8", 0.3);
    T.prado(k, 132, ["#9ac080", "#7eaa6a", "#649456", "#4e7e44", "#3a6834", "#2a5226"], 517, { flores: { n: 16, cols: ["#ffffff", "#e8d8f8"] } });
    [[20, 172], [70, 168], [244, 174], [300, 170]].forEach(([x, b], i) => { for (let j = 0; j < 6; j++) { const a = -Math.PI / 2 + (j - 2.5) * 0.4; fronda(k, x, b, Math.cos(a), Math.sin(a), 14 + hash(i, j, 518) * 6, ["#8ac070", "#6aa458", "#4a8444", "#346634"], { caida: 0.5, foliolo: 2.4 }); } });
    [[120, 160], [196, 164], [88, 150]].forEach(([x, b]) => { k.R(x, b - 4, 2, 4, "#f0e8d8"); k.elipse(x + 1, b - 5, 3, 2, "#c84a3a"); k.P(x, b - 6, "#ffffff"); });
    const ciervo = (x, b, d, s) => { sombraE(k, x, b + 1, 9, 2, 0.45); const C = ["#d8a878", "#c08c5c", "#a07046", "#7a5434"]; bola(k, x, b - 12, 9, 5, (px, py) => rampa(C, 0.2 + (py - b + 17) / 10 * 0.5, px, py)); [-6, -3, 4, 7].forEach((dx) => k.R(x + dx, b - 8, 1.5, 8, C[2])); trazo(k, [[x + d * 7, b - 14], [x + d * 10, b - 22]], C[1], 3, 2); bola(k, x + d * 12, b - 24, 3.5, 3, (px, py) => rampa(C, 0.3, px, py)); k.P(x + d * 13, b - 25, "#1c1c22"); trazo(k, [[x + d * 11, b - 27], [x + d * 9, b - 34], [x + d * 6, b - 37]], "#e8dcc0"); trazo(k, [[x + d * 9, b - 32], [x + d * 13, b - 35]], "#e8dcc0"); trazo(k, [[x + d * 13, b - 27], [x + d * 16, b - 33]], "#e8dcc0"); for (let i = 0; i < 4; i++) k.P(x - 4 + i * 3, b - 15, "#f4ead8"); };
    ciervo(58, 152, 1, 519); ciervo(262, 158, -1, 520);
    if (lit > 0) for (let i = 0; i < 26; i++) { const x = hash(i, 1, 521) * W, y = 60 + hash(i, 2, 521) * 110; k.crudo(x, y, 1, 1, "#e8f87a"); if (i % 3 === 0) k.alfa(0.4, () => k.crudo(x - 1, y - 1, 3, 3, "#c8e85a")); }
  }
  N[19] = ["El bosque de los Kara", "El bosque de los ciervos, con la luz colándose entre los troncos", kara, { tinte: 0.1, cielo: "propio", fuerza: 0.9 }];

  function ame(k) {
    const lit = encendido(k);
    k.banda(["#6a7480", "#7a848e", "#8a949c", "#9aa2a8"], 0, 120);
    nubarron(k, -20, 10, 160, 18, ["#8a929a", "#727a84", "#5c646e"]); nubarron(k, 160, 4, 180, 16, ["#8a929a", "#727a84", "#5c646e"]);
    const HI = ["#9aa2aa", "#828a94", "#6a727c", "#545c66", "#40464e", "#2e3238"];
    const torre = (x, top, w, s) => { T.rect(k, x, top, w, 140 - top, (px, py) => rampa(HI, 0.2 + ((px - x) / w) * 0.5 + (Math.round(py) % 10 === 0 ? 0.2 : 0) + (fbm(px * 0.2, py * 0.1, s) - 0.5) * 0.2, px, py)); const vs = []; for (let y = top + 6; y < 130; y += 10) for (let vx = x + 3; vx < x + w - 4; vx += 7) { k.R(vx, y, 3, 5, "#ffd27a"); k.R(vx, y + 5, 3, 1, HI[5]); vs.push([vx + 1, y + 2]); } return vs; };
    const vs = [...torre(-4, 30, 34, 531), ...torre(34, 50, 26, 532), ...torre(268, 24, 36, 533), ...torre(236, 46, 28, 534), ...torre(304, 60, 20, 535)];
    T.rect(k, 122, 40, 76, 100, (px, py) => rampa(HI, 0.25 + ((px - 122) / 76) * 0.45 + (Math.round(py) % 12 === 0 ? 0.2 : 0), px, py));
    bola(k, 160, 50, 30, 26, (x, y) => rampa(HI, 0.15 + ((x - 160) / 30) * 0.4 + ((y - 50) / 26) * 0.3, x, y));
    [[148, 46], [172, 46]].forEach(([x, y]) => { k.elipse(x, y, 6, 5, "#1c2028"); k.elipse(x, y, 3, 3, "#ffd27a"); k.crudo(x - 1, y - 1, 1, 1, "#fff6d0"); });
    for (let i = 0; i < 7; i++) T.rect(k, 140 + i * 6, 60, 4, 16, (px, py) => rampa(HI, 0.2 + (px - 140 - i * 6) / 4 * 0.6, px, py));
    [[-1, 122, 70], [1, 198, 70]].forEach(([d, x, y]) => { trazo(k, [[x, y], [x + d * 26, y + 4], [x + d * 40, y + 24], [x + d * 52, y + 30]], HI[3], 5, 4); trazo(k, [[x, y - 2], [x + d * 26, y + 2], [x + d * 40, y + 22], [x + d * 52, y + 28]], HI[1], 1); });
    for (let y = 80; y < 140; y += 12) for (let x = 128; x < 194; x += 9) { k.R(x, y, 4, 6, "#ffd27a"); vs.push([x + 2, y + 3]); }
    suelo3d(k, 136, 180, 160, 100, losas3d(["#7a828a", "#6a727a", "#5a626a", "#4a525a", "#3a4048"], { tx: 18, tz: 12, s: 536 })); k.R(0, 136, W, 1, "#9aa2aa");
    espejo(k, 136, 140, 180, { tinte: "#4a5a6a", mezcla: 0.4, onda: 2, dentro: (x, y) => fbm(x * 0.05, y * 0.14, 537) > 0.55 });
    bruma(k, 60, 140, "#a8b0b8", 0.4, { s: 538 });
    P.lluvia(k, 220, 539, { col: "#c8d4e0", largo: 8, ang: 0.3, a: 0.55 });
    luces(k, vs.map(([x, y]) => ({ x, y, r: 8, ry: 6, col: LUZ, f: lit * 0.7 })));
  }
  N[20] = ["Emagakure", "La aldea de la lluvia, con sus torres de hierro y sus tuberías", ame, { tinte: 0.85, ven: ["#ffd27a"] }];

  function destruida(k) {
    k.banda(["#6a7ab0", "#8a90b8", "#b0a8b8", "#d8c8b8"], 0, 104);
    nubarron(k, -20, 18, 100, 12, ["#d8c8c8", "#c0acb0", "#a08c94"]); nubarron(k, 220, 10, 110, 12, ["#d8c8c8", "#c0acb0", "#a08c94"]);
    K.monteHakoge(k, 5, { y0: 44, base: 120 });
    const cx = 160, cy = 150;
    bola(k, cx, cy, 170, 40, (x, y) => { const d = Math.hypot((x - cx) / 170, (y - cy) / 40); return rampa(["#c8a888", "#b09070", "#96785a", "#7c6248", "#624c38"], 0.15 + (1 - d) * 0.5 + (Math.sin(d * 30) > 0.6 ? 0.15 : 0) + (fbm(x * 0.06, y * 0.15, 541) - 0.5) * 0.3, x, y); });
    T.rect(k, 0, 112, W, 12, (x, y) => rampa(["#a89078", "#907860", "#78624c"], (y - 112) / 12 + (fbm(x * 0.1, y, 542) - 0.5) * 0.4, x, y));
    for (let i = 0; i < 9; i++) { const x = 10 + i * 36 + hash(i, 1, 543) * 10, b = 118 + hash(i, 2, 543) * 6, w = 12 + hash(i, 3, 543) * 12; rellena(k, [[x, b], [x, b - 8 - hash(i, 4, 543) * 6], [x + w * 0.3, b - 12 - hash(i, 5, 543) * 8], [x + w * 0.55, b - 6], [x + w * 0.8, b - 14 - hash(i, 6, 543) * 6], [x + w, b - 4], [x + w, b]], madera(["#d8b488", "#c09a6c", "#a07c52", "#7e603e", "#5a422a"], { paso: 3, vertical: true, largo: 99, s: 544 + i })); trazo(k, [[x - 2, b - 2], [x + w + 3, b - 9]], "#6e5034", 2); }
    [[[60, 180], [76, 160], [70, 146], [88, 136]], [[250, 180], [236, 162], [244, 150], [226, 140]], [[150, 176], [158, 164], [152, 156]]].forEach((g) => { trazo(k, g, "#3a2a1e", 3, 1); trazo(k, g.map(([x, y]) => [x + 2, y]), "#e0c8a8", 1); });
    [[40, 150, 14, 6], [110, 166, 10, 5], [216, 164, 16, 7], [290, 152, 12, 6], [180, 140, 8, 4]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.45); k.roca(x, b, w, h, "#a89a8a", "#c8bcac", "#7a6e62"); });
    [[30, 112], [290, 116]].forEach(([x, b], i) => pluma(k, x, b, 40, 8, ["#9a948e", "#7c7670", "#5e5a56", "#46423e"], { s: 546 + i, viento: 0.4 }));
  }
  N[21] = ["Kanoho destruida", "El gran cráter que deja Pian, con la montaña de los Hakoge al fondo", destruida, { tinte: 0.35, ven: [] }];

  function ichuha(k) {
    const lit = encendido(k);
    k.banda(["#141a34", "#1c2444", "#283258", "#36406a"], 0, 112);
    nubarron(k, 30, 20, 90, 8, ["#3a4466", "#2e3654", "#222a44"]);
    T.rect(k, 116, 50, 88, 62, madera(["#5a4a46", "#4a3c3a", "#3a2e2e", "#2c2224", "#1e1618"], { paso: 4, vertical: true, largo: 99, s: 551 }));
    T.tejadoJ(k, 160, 52, 118, 18, ["#4a4c5e", "#3a3c4e", "#2c2e3e", "#20222e", "#141620"], 552, 4);
    abanico(k, 160, 76, 14);
    const vs = [];
    [[-6, 40], [36, 36], [74, 38], [206, 38], [246, 36], [284, 40]].forEach(([x, w], i) => { vs.push(...K.casaK(k, x, 120, w, 26, { techo: ["#4a4c5e", "#3a3c4e", "#2c2e3e", "#20222e", "#141620"], s: 553 + i, pared: ["#c8c0b8", "#b4aca4", "#a0988e", "#8a827a", "#706860"] })); abanico(k, x + w / 2, 104, 4); });
    const F = [];
    [[100, 112], [220, 112]].forEach(([x, b]) => { k.R(x, b - 30, 2, 30, "#2a1e1a"); k.R(x - 4, b - 31, 10, 1, "#2a1e1a"); k.elipse(x + 1, b - 26, 3, 4, "#c0502a"); k.R(x - 2, b - 30, 6, 1, "#2a1e1a"); k.R(x - 2, b - 22, 6, 1, "#2a1e1a"); if (lit > 0) k.crudo(x, b - 27, 2, 3, "#ff8a5a"); F.push({ x: x + 1, y: b - 24, r: 28, ry: 20, col: "#ff8a5a", f: lit }); });
    suelo3d(k, 120, 180, 160, 96, losas3d(["#6a6e80", "#5a5e70", "#4a4e60", "#3c4050", "#2e3240"], { tx: 15, tz: 10, s: 559 })); k.R(0, 120, W, 1, "#8a8ea0");
    for (let x = 0; x < W; x += 3) if (Math.abs(x - 160) > 50) k.R(x, 120, 2, 2, "#2a2e3a");
    luces(k, [...F, ...vs.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.6 }))]);
  }
  N[22] = ["El barrio Ichuha", "Las calles vacías bajo la luna, con el abanico de los Ichuha en las paredes", ichuha, { fuego: ["#ff8a5a", "#c0502a"], ven: ["#ffd27a"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro, pena } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, K = window.N16;
  const W = 320, H = 180;
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const N = (window.SitiosIt15.ninjas = window.SitiosIt15.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];

  function cumbre(k) {
    T.rect(k, 0, 0, W, 120, madera(["#7a5a4a", "#664a3c", "#523a30", "#402c24", "#2e1e18", "#1e1210"], { paso: 6, vertical: true, largo: 99, s: 561 }));
    [[0, 10], [80, 8], [232, 8], [310, 10]].forEach(([x, w]) => Det.cilindro(k, x, 0, w, 120, ["#8a6a54", "#6e5242", "#543e32", "#3e2c22"], 0.3));
    k.R(0, 0, W, 6, "#2e1e18"); for (let x = 0; x < W; x += 20) k.R(x, 2, 12, 2, "#5a4234");
    [[20, 50], [252, 50]].forEach(([x, w]) => { T.rect(k, x, 18, w, 40, () => "#8fb4d0"); [[x + 4, 58, 14, 14], [x + 18, 58, 18, 22], [x + 34, 58, 14, 16]].forEach(([mx, b, mw, mh]) => { k.poli([[mx, b], [mx + mw / 2, b - mh], [mx + mw, b]], "#e8f0f6"); k.poli([[mx + mw / 2, b - mh], [mx + mw, b], [mx + mw * 0.55, b]], "#b8c8d8"); }); k.R(x - 2, 16, w + 4, 3, "#3a2a20"); k.R(x - 2, 57, w + 4, 3, "#3a2a20"); k.R(x - 2, 16, 3, 44, "#3a2a20"); k.R(x + w - 1, 16, 3, 44, "#3a2a20"); k.R(x + w / 2 - 1, 18, 2, 40, "#3a2a20"); });
    [["#c8302a", "#f4efe0"], ["#3f8a5a", "#f4efe0"], ["#3a6ac8", "#f4efe0"], ["#e8c040", "#3a2a20"], ["#8a5a32", "#f4efe0"]].forEach(([c, s], i) => { const x = 92 + i * 28; k.R(x - 1, 8, 24, 3, "#3a2a20"); rellena(k, [[x, 10], [x + 22, 10], [x + 22, 66], [x + 11, 74], [x, 66]], (px, py) => rampa([mezcla(c, "#ffffff", 0.2), c, mezcla(c, "#000000", 0.25), mezcla(c, "#000000", 0.45)], 0.15 + (px - x) / 22 * 0.4 + (Math.round(px) % 7 === 0 ? 0.15 : 0), px, py)); for (let a = 0; a < Math.PI * 2; a += 0.05) k.P(x + 11 + Math.cos(a) * 6, 30 + Math.sin(a) * 6, s); k.R(x + 6, 44, 10, 1, s); k.R(x + 6, 48, 10, 1, s); });
    suelo3d(k, 120, 180, 160, 80, losas3d(["#8a8478", "#76706a", "#625c56", "#4e4a44", "#3a3632"], { tx: 18, tz: 12, s: 562 })); k.R(0, 120, W, 2, "#2e2a26");
    bola(k, 160, 112, 120, 16, (x, y) => (y < 104 ? null : rampa(["#a87a54", "#8a6040", "#6e4a30", "#543620"], 0.15 + ((y - 104) / 24) * 0.5 + (Math.round(x * 0.3) % 9 === 0 ? 0.15 : 0), x, y)));
    T.rect(k, 44, 112, 232, 14, madera(["#8a6040", "#6e4a30", "#543620", "#3a2414", "#26160a"], { paso: 3, largo: 99, s: 563 })); sombraE(k, 160, 130, 120, 4, 0.4);
    [["#c8302a"], ["#3f8a5a"], ["#3a6ac8"], ["#e8c040"], ["#8a5a32"]].forEach(([c], i) => { const x = 82 + i * 39; rellena(k, [[x - 12, 108], [x + 12, 108], [x, 96]], (px, py) => rampa(["#ffffff", "#f2eee6", "#dcd6ca", "#bcb4a6"], 0.1 + (px - x + 12) / 24 * 0.6, px, py)); k.R(x - 9, 104, 18, 2, c); k.R(x - 2, 98, 4, 3, c); });
    [[56, 104], [264, 104]].forEach(([x, y]) => { k.R(x - 2, y - 8, 4, 8, "#f4efe6"); Det6.fuego(k, x, y - 8, 3, 5, { s: x }); });
    luces(k, [{ x: 56, y: 92, r: 34, ry: 24, col: "#ffcf7a", f: 0.8 }, { x: 264, y: 92, r: 34, ry: 24, col: "#ffcf7a", f: 0.8 }, { x: 45, y: 38, r: 50, ry: 40, col: "#cfe0ff", f: 0.35 }, { x: 277, y: 38, r: 50, ry: 40, col: "#cfe0ff", f: 0.35 }]);
  }
  N[23] = ["La cumbre de los Kega", "La sala del País del Hierro, con la gran mesa y los estandartes de las cinco aldeas", cumbre, { cielo: "propio", fuerza: 0.15, ventanal: "#8fb4d0", fuego: ["#ffe6a8", "#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];

  function tortuga(k) {
    k.banda(CIELO, 0, 104);
    nubarron(k, -16, 40, 84, 14); nubarron(k, 246, 34, 86, 16); cirros(k, 4, 2, 20);
    P.mar(k, 100, 136, PAL.MAR, { s: 571 }); reflejo(k, 102, 134);
    const TG = ["#c8d89a", "#aec280", "#94aa68", "#7a9054", "#607640", "#485a30"];
    bola(k, 24, 104, 32, 22, (x, y) => { const c = celdas(x, y, 6, 5, 572, 0.6); return rampa(TG, 0.15 + ((y - 104) / 22) * 0.4 + ((x - 24) / 32) * 0.2 + (c.borde < 0.12 ? 0.25 : 0) + (c.id - 0.5) * 0.15, x, y); });
    k.elipse(32, 98, 6, 6, "#f4f1e8"); k.elipse(33, 98, 3, 4, "#26262a"); k.P(32, 96, "#ffffff"); trazo(k, [[26, 92], [32, 90], [38, 92]], TG[5], 1);
    trazo(k, [[-2, 114], [20, 116], [48, 113]], TG[5], 1);
    rellena(k, [[286, 110], [320, 96], [322, 124], [296, 126]], (x, y) => { const c = celdas(x, y, 5, 4, 573, 0.6); return rampa(TG, 0.3 + (c.borde < 0.12 ? 0.3 : 0), x, y); });
    rellena(k, [[52, 140], [268, 140], [262, 146], [58, 146]], (x, y) => { const c = celdas(x, y * 2, 16, 8, 574, 0.3); return c.borde < 0.1 ? "#3f5a2a" : rampa(["#8aa86a", "#6e8c54", "#587440"], 0.3 + (c.id - 0.5) * 0.4, x, y); });
    rellena(k, [[52, 140], [96, 72], [134, 44], [186, 44], [226, 74], [268, 140]], (x, y) => rampa(["#8cb07a", "#6e9a62", "#5e7f52", "#4a6a44"], 0.2 + ((x - 52) / 216) * 0.5 + (fbm(x * 0.08, y * 0.1, 575) - 0.5) * 0.3, x, y));
    for (let i = 0; i < 26; i++) { const y = 54 + hash(i, 1, 576) * 70, a = 22 + (y - 44) * 0.9, x = 160 + (hash(i, 2, 576) < 0.5 ? -1 : 1) * (22 + hash(i, 3, 576) * (a - 20)); copa(k, x, y, 7 + hash(i, 4, 576) * 5, 6 + hash(i, 5, 576) * 3, ["#9ad07e", "#76b462", "#58984e", "#427a3e", "#2c5c2e"], { r: 3.5, s: 577 + i }); }
    for (let y = 46; y < 136; y++) { const a = 15 + (y - 46) * 0.12; for (let x = Math.round(160 - a); x <= 160 + a; x++) k.P(x, y, Math.sin(x * 1.6 + y / 14) > 0.4 ? "#f0faff" : rampa(["#c8eaf8", "#a0d6f0", "#7ac0e6", "#5aa8d8"], (Math.sin(x * 0.9) + 1) * 0.4 + (y - 46) / 90 * 0.3, x, y)); }
    pena(k, 128, 58, 22, 13, ["#a8a090", "#8d8478", "#6e665c", "#57504a"]); pena(k, 170, 58, 22, 13, ["#a8a090", "#8d8478", "#6e665c", "#57504a"]);
    T.prado(k, 136, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 578, { flores: { n: 40, cols: ["#ffffff", "#f2d24a", "#e8607a"] } });
    bola(k, 160, 144, 58, 9, (x, y) => rampa(["#d8f0fa", "#9ad0ec", "#6ab4e0", "#4a98cc"], 0.2 + Math.hypot((x - 160) / 58, (y - 144) / 9) * 0.6, x, y)); espejo(k, 135, 136, 153, { tinte: "#4a98cc", mezcla: 0.4, dentro: (x, y) => Math.hypot((x - 160) / 56, (y - 144) / 8) < 1 });
    bruma(k, 120, 150, "#ffffff", 0.6, { s: 579, x0: 100, x1: 220 });
    for (let y = 152; y < H; y++) { const f = (y - 152) / 28, w = 14 + f * 18; for (let x = Math.round(160 - w); x <= 160 + w; x++) k.P(x, y, rampa(["#e8dcb0", "#d8c898", "#c4b080"], 0.2 + Math.abs(x - 160) / w * 0.4 + (hash(x, y, 580) - 0.5) * 0.2, x, y)); }
    [[92, 140, 30, 12], [214, 142, 34, 14]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.4); pena(k, x, b, w, h, ["#b8b0a0", "#a39888", "#8d8478", "#6e665c", "#57504a"]); });
    P.palmera(k, 30, 150, 44, { inc: 0.25, s: 581 }); P.palmera(k, 292, 152, 48, { inc: -0.25, s: 582 }); P.palmera(k, 62, 144, 34, { inc: 0.2, s: 583 });
  }
  N[24] = ["La isla Tortuga", "La isla sobre una tortuga gigante, con la cascada de la verdad en el centro", tortuga, { tinte: 0.1, dx: 76 }];

  function campamento(k) {
    const lit = encendido(k);
    k.banda(["#141a34", "#1c2444", "#283258", "#36406a"], 0, 110);
    montana(k, 80, 110, 200, 50, { roca: ["#2a3048", "#242a40", "#1e2236", "#181c2e"] }); montana(k, 250, 110, 220, 60, { roca: ["#2a3048", "#242a40", "#1e2236", "#181c2e"] });
    k.R(200, 20, 2, 100, "#4a3a2e"); rellena(k, [[202, 22], [246, 24], [244, 50], [202, 48]], (x, y) => rampa(["#f4f0e6", "#e2dccc", "#c8c0ac"], 0.1 + (x - 202) / 44 * 0.5 + Math.sin(x * 0.3) * 0.1, x, y));
    trazo(k, [[216, 28], [230, 28]], "#c0302a", 2); trazo(k, [[224, 26], [222, 38]], "#c0302a", 2); trazo(k, [[214, 42], [218, 36], [222, 44], [226, 36], [232, 42]], "#c0302a", 2);
    const vs = [];
    const tienda = (x, base, w, h, s) => { sombraE(k, x + 2, base, w * 0.6, 2, 0.45); rellena(k, [[x - w / 2, base], [x, base - h], [x + w / 2, base]], (px, py) => rampa(["#d8ccb0", "#c0b294", "#a4967a", "#867a60"], 0.15 + ((px - x) / w) * 0.8 + (Math.round(px - x) % 6 === 0 ? 0.15 : 0), px, py)); rellena(k, [[x - w * 0.14, base], [x, base - h * 0.5], [x + w * 0.14, base]], () => "#ffd27a"); trazo(k, [[x, base - h], [x - w * 0.7, base + 2]], "#5a4a3a", 1); trazo(k, [[x, base - h], [x + w * 0.7, base + 2]], "#5a4a3a", 1); vs.push([x, base - h * 0.2]); };
    [[24, 118, 30, 24], [70, 114, 26, 20], [116, 116, 28, 22], [156, 112, 22, 18], [262, 114, 26, 20], [300, 118, 30, 24]].forEach(([x, b, w, h], i) => tienda(x, b, w, h, 591 + i));
    T.prado(k, 116, ["#4a5a4a", "#3e4e40", "#324236", "#28362c", "#1e2a22", "#161e18"], 592);
    const F = [];
    [[96, 146], [226, 150]].forEach(([x, b], i) => { k.elipse(x, b + 1, 12, 3, "#2a2420"); for (let j = 0; j < 6; j++) k.R(x - 10 + j * 4, b - 2 - (j % 2), 4, 3, ["#5a4030", "#3a2a1c"][j % 2]); fuego(k, x, b - 2, 12, 18, { s: 593 + i }); P.chispas(k, x, b - 18, 14, 30, 22, 595 + i); F.push({ x, y: b - 8, r: 50, ry: 28, col: "#ffa04a", f: 1 }); });
    [[40, 160], [282, 164]].forEach(([x, b], i) => { sombraE(k, x + 8, b, 12, 2, 0.45); T.rect(k, x, b - 18, 16, 2, madera(PAL.MAD_O, { paso: 1, largo: 99, s: 596 + i })); [x + 1, x + 13].forEach((px) => k.R(px, b - 18, 2, 18, "#4a3424")); for (let j = 0; j < 4; j++) trazo(k, [[x + 3 + j * 3, b - 1], [x + 4 + j * 3, b - 24]], "#a8acb8", 1); });
    P.caja(k, 140, 170, 14, 10); P.caja(k, 154, 172, 12, 8);
    luces(k, [...F, ...vs.map(([x, y]) => ({ x, y, r: 16, ry: 10, col: LUZ, f: lit * 0.8 }))]);
  }
  N[25] = ["El campamento shinobi", "Las tiendas de la Alianza y sus hogueras, antes de la gran batalla", campamento, { ven: ["#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffd27a", "#7a1e14", "#c8361c", "#f06a24", "#ffb43a", "#fff0b0"] }];

  function lunaRoja(k) {
    k.banda(["#3a0e14", "#521418", "#6a1c1e", "#7e2622", "#8a2e24"], 0, 140);
    P.fulgor(k, 160, 62, 66, ["#6a1a1e", "#8a2424", "#a82e2a"], 0.6);
    bola(k, 160, 62, 44, 44, (x, y) => rampa(["#f06a5a", "#d84a40", "#c03832", "#a02a28"], 0.15 + Math.hypot(x - 152, y - 54) / 70 + (fbm(x * 0.1, y * 0.1, 601) - 0.5) * 0.2, x, y));
    [10, 20, 30, 39].forEach((r) => { for (let a = 0; a < Math.PI * 2; a += 0.01) k.crudo(160 + Math.cos(a) * r, 62 + Math.sin(a) * r, 1, 1, "#3a0a0e"); });
    k.elipse(160, 62, 4, 4, "#1c0608");
    [15, 25, 35].forEach((r, j) => { for (let i = 0; i < 3; i++) { const a = (i / 3) * Math.PI * 2 + j * 0.5, x = 160 + Math.cos(a) * r, y = 62 + Math.sin(a) * r; k.elipse(x, y, 2.5, 2.5, "#1c0608"); trazo(k, [[x, y], [x + Math.cos(a + 1.5) * 4, y + Math.sin(a + 1.5) * 4]], "#1c0608", 1); } });
    const TR = ["#7a6a64", "#64544e", "#4e403c", "#3a2e2c", "#28201e"];
    [[[-10, 20], [40, 30], [80, 60], [120, 70]], [[-10, 60], [30, 70], [60, 90], [90, 96]], [[330, 16], [280, 30], [240, 58], [200, 68]], [[330, 64], [290, 72], [262, 90], [232, 98]]].forEach((p, i) => { const pts = Det6.bezier(p[0], p[1], p[2], p[3], 30); trazo(k, pts, (f) => TR[f < 0.3 ? 3 : f < 0.7 ? 2 : 1], 14 - i, 4); pts.forEach(([x, y], j) => { if (j % 6 === 3) { const l = 10 + hash(j, i, 602) * 12; trazo(k, [[x, y], [x, y + l]], "#e8e0d0", 1); bola(k, x, y + l + 5, 3.5, 6, (px, py) => rampa(["#ffffff", "#f2ece0", "#d8d0c0", "#b8ae9a"], 0.1 + ((px - x) / 3.5) * 0.3 + ((py - y - l) / 12) * 0.3 + (Math.round(py * 0.8 + px * 0.3) % 3 === 0 ? 0.15 : 0), px, py)); } }); });
    T.rect(k, 0, 140, W, 40, T.tex(["#5a2a26", "#4a2220", "#3a1a1a", "#2c1414", "#200e0e"], { v0: 0.2, s: 603, dy: 0.3, y0: 140, alto: 40 }));
    [[[0, 150], [40, 146], [80, 156], [110, 152]], [[320, 148], [280, 152], [246, 146], [214, 154]], [[140, 180], [150, 166], [170, 160], [186, 150]]].forEach((p, i) => trazo(k, Det6.bezier(p[0], p[1], p[2], p[3], 20), TR[2], 6 - i, 2));
    [[[60, 180], [70, 168], [66, 160]], [[250, 180], [242, 166], [248, 158]]].forEach((g) => trazo(k, g, "#1a0808", 2, 1));
    luces(k, [{ x: 160, y: 62, r: 140, ry: 110, col: "#ff6a5a", f: 0.25 }]);
  }
  N[27] = ["La luna roja", "El Tsokuyumi Infinito: la luna con el ojo rojo y el Árbol Divino", lunaRoja, { cielo: "propio", base: "noche", astro: "siempre", fuego: ["#e8604a", "#c0392b", "#9a2a26", "#7a1f2a", "#5a1418", "#1a0a10", "#3a0a0e", "#1c0608"] }];
})();

(function () {
  const { rampa, rellena, esfera, nubarron, cirros, reflejo, rotulo, montana, estratos, cilindro, pena } = Det;
  const { bola, mezcla, hash, ruido, fbm, celdas, trazo, cuerda, madera, piedra, tejas, corteza, suelo3d, tablones, losas3d, copa, arbol, briznas, fronda, sombra, sombraE, luces, espejo, bruma, rayos, pluma, fuego, encendido } = Det6;
  const P = window.OP14P, { PAL, LUZ } = P, T = window.P15, K = window.N16;
  const W = 320, H = 180, VEN = ["#ffd27a"];
  const cuando = (k) => Det.cuando(k);
  window.SitiosIt15 = window.SitiosIt15 || {};
  const N = (window.SitiosIt15.ninjas = window.SitiosIt15.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"];
  const figurita = (k, x, b, { pelo = "#f2c84b", ropa = "#f08a2a", piel = "#f2d0a8", e = 1 } = {}) => { k.R(x - 1 * e, b - 3 * e, 1 * e, 3 * e, "#2a2a3a"); k.R(x + 1 * e, b - 3 * e, 1 * e, 3 * e, "#2a2a3a"); k.R(x - 1.5 * e, b - 7 * e, 4 * e, 4 * e, ropa); k.R(x - 1 * e, b - 10 * e, 3 * e, 3 * e, piel); k.R(x - 1.5 * e, b - 11 * e, 4 * e, 2 * e, pelo); };

  function lago(k) {
    k.banda(["#a8b8c8", "#bcc8d4", "#d0d8e0", "#e4e8ea"], 0, 96);
    montana(k, 70, 96, 180, 36, { roca: ["#b8c4d0", "#acb8c6", "#a0acba", "#94a0b0"] }); montana(k, 260, 96, 160, 30, { roca: ["#b8c4d0", "#acb8c6", "#a0acba", "#94a0b0"] });
    P.mar(k, 94, 150, ["#8aa4b8", "#7a96ac", "#6a88a0", "#5c7a92", "#4e6c84"], { s: 611, cresta: "#c8d8e4", medio: "#9ab4c8" });
    [[30, 112, 40], [292, 110, 46], [250, 116, 30]].forEach(([x, b, h], i) => { T.rect(k, x - 2, b - h, 4, h, corteza(["#6a6a70", "#5a5a60", "#4a4a50", "#3a3a40"], x - 2, 4, { s: 612 + i })); [[-0.6, 0.3], [0.7, 0.5], [-0.4, 0.7]].forEach(([d, f]) => trazo(k, [[x, b - h * f], [x + d * 16, b - h * f - 10], [x + d * 22, b - h * f - 8]], "#4a4a50", 2, 1)); });
    const zx = 172, zb = 118;
    k.alfa(0.55, () => { k.R(zx - 2, zb - 6, 2, 6, "#3a4250"); k.R(zx + 1, zb - 6, 2, 6, "#3a4250"); k.R(zx - 3, zb - 15, 7, 9, "#3a4250"); k.R(zx - 2, zb - 20, 5, 5, "#3a4250"); trazo(k, [[zx - 10, zb - 26], [zx + 12, zb - 14]], "#4a5262", 3, 3); rellena(k, [[zx + 6, zb - 20], [zx + 16, zb - 14], [zx + 13, zb - 10], [zx + 4, zb - 16]], () => "#5a6272"); });
    k.alfa(0.4, () => k.elipse(zx, zb + 1, 6, 1, "#c8d8e4"));
    bruma(k, 70, 150, "#e8eef2", 0.85, { s: 613, ey: 0.08 });
    T.prado(k, 140, ["#9ab890", "#80a078", "#688a64", "#527452", "#3e5e40", "#2c4630"], 614, { perfil: (x) => 140 + Math.sin(x / 30) * 3 });
    for (let x = 0; x < W; x++) if (hash(x, 1, 615) > 0.6) k.P(x, 139 + Math.round(Math.sin(x / 30) * 3), "#d8e4ea");
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 616) * W, b = 140 + hash(i, 2, 616) * 8, h = 8 + hash(i, 3, 616) * 10; trazo(k, [[x, b], [x + (hash(i, 4, 616) - 0.5) * 4, b - h]], "#5a7a4a", 1); }
    [[60, 160, 18, 8], [250, 166, 22, 9], [124, 172, 12, 5]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.4); k.roca(x, b, w, h, "#8a8e94", "#a8acb2", "#6a6e74"); });
    bruma(k, 130, 180, "#e8eef2", 0.35, { s: 617 });
  }
  N[28] = ["El lago de la niebla", "La orilla del lago donde aparece Zubaza, de pie sobre el agua, entre la niebla", lago, { tinte: 0.5 }];

  function espejosHielo(k) {
    k.banda(["#a8bccc", "#bccad6", "#d0dae2", "#e2e8ec"], 0, 96);
    P.mar(k, 94, 180, ["#6a90ac", "#5a809c", "#4c708c", "#40627e", "#345470"], { s: 621, cresta: "#c8dce8", medio: "#8aaac4" });
    const borde = (y) => 40 + (y - 90) * 1.8;
    suelo3d(k, 90, 180, 160, 70, tablones(["#d8c4a4", "#c4ac88", "#ac9470", "#927a58", "#766046", "#584430"], { pw: 12, L: 60, s: 622, clavo: "#4a3a2a" }), { dentro: (x, y) => Math.abs(x - 160) < borde(y) });
    [-1, 1].forEach((s) => trazo(k, [[160 + s * 40, 88], [160 + s * 200, 178]], "#6e5a46", 1));
    bruma(k, 40, 150, "#eef4f8", 0.55, { s: 651, ey: 0.1 });
    const espejoHielo = (x, y, w, h, s) => { sombraE(k, x + w / 2 + 2, y + h + 1, w * 0.6, 2, 0.4); T.rect(k, x - 1, y - 1, w + 2, h + 2, () => "#2a6a9a"); T.rect(k, x, y, w, h, (px, py) => rampa(["#e8f8ff", "#b8e2f6", "#88c8ec", "#5aa8dc", "#3a88c4"], 0.25 + ((px - x) / w) * 0.4 + (Math.abs(((px - x) / w) - ((py - y) / h)) < 0.1 ? -0.4 : 0) + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.25, px, py)); for (let px = x; px < x + w; px++) k.P(px, y, "#ffffff"); for (let py = y; py < y + h; py++) k.P(x, py, "#ffffff"); k.crudo(x + 2, y + 2, 2, 1, "#ffffff"); };
    const espejos = [];
    for (let i = 0; i < 11; i++) { const a = Math.PI * (1.05 + (i / 10) * 0.9), x = 160 + Math.cos(a) * 118, y = 128 + Math.sin(a) * 70; espejos.push([x - 9, y - 16, 18, 30, 623 + i]); }
    for (let i = 0; i < 7; i++) { const a = Math.PI * (1.15 + (i / 6) * 0.7), x = 160 + Math.cos(a) * 70, y = 92 + Math.sin(a) * 30; espejos.push([x - 7, y - 12, 14, 24, 640 + i]); }
    espejos.sort((a, b) => a[1] - b[1]).forEach(([x, y, w, h, s]) => espejoHielo(x, y, w, h, s));
    const [mx, my] = [espejos[3][0] + 7, espejos[3][1] + 10]; k.elipse(mx + 2, my, 4, 5, "#f8f8f4"); k.R(mx, my - 1, 2, 1, "#2a2a30"); k.R(mx + 3, my - 1, 2, 1, "#2a2a30"); k.R(mx + 1, my + 2, 1, 2, "#c0302a"); k.R(mx + 3, my + 2, 1, 2, "#c0302a");
    for (let i = 0; i < 40; i++) { const x = hash(i, 1, 650) * W, y = 40 + hash(i, 2, 650) * 120; k.crudo(x, y, 1, 1, "#ffffff"); }
    bruma(k, 150, 180, "#eef4f8", 0.3, { s: 652 });
  }
  N[29] = ["Los espejos de hielo", "La cúpula de espejos de hielo de Huka sobre el puente de las Olas, entre la niebla", espejosHielo, { tinte: 0.5 }];

  function tejados(k) {
    const lit = encendido(k);
    k.banda(["#f4a46a", "#f8c08a", "#fbdcaa", "#fff0d0"], 0, 100);
    nubarron(k, -10, 30, 90, 12, ["#fff0e0", "#f8d4bc", "#e8b49a"]); nubarron(k, 250, 20, 80, 10, ["#fff0e0", "#f8d4bc", "#e8b49a"]);
    K.monteHakoge(k, 4, { y0: 34, base: 116 });
    const vs = [];
    for (let i = 0; i < 14; i++) { const x = -10 + i * 24, h = 12 + (i % 3) * 3; vs.push(...K.casaK(k, x, 110, 24, h, { techo: K.TEJAS[["rojo", "azul", "tierra", "teja"][i % 4]], s: 661 + i, deposito: i % 3 === 0 })); }
    const tejadoCerca = (x0, x1, y0, y1, pal, s) => { rellena(k, [[x0, y1], [x0 + 10, y0], [x1 - 10, y0], [x1, y1]], tejas(pal, { w: 9, h: 5, s, y0 })); for (let x = x0 + 10; x < x1 - 10; x++) { k.P(x, y0, pal[0]); k.P(x, y0 - 1, pal[4]); k.P(x, y0 + 1, pal[1]); } k.R(x0, y1, x1 - x0, 2, pal[4]); };
    tejadoCerca(-20, 190, 126, 180, K.TEJAS.rojo, 680); tejadoCerca(170, 340, 132, 180, K.TEJAS.azul, 681);
    cilindro(k, 274, 104, 22, 22, ["#e4eaee", "#c4ccd4", "#9aa4ae", "#788290"]); k.elipse(285, 104, 11, 3, "#9aa4ae"); k.R(276, 124, 3, 8, "#4a3a2e"); k.R(290, 124, 3, 8, "#4a3a2e");
    luces(k, vs.map(([x, y]) => ({ x, y, r: 10, ry: 8, col: LUZ, f: lit * 0.7 })));
  }
  N[30] = ["Los tejados al atardecer", "Kanoho desde los tejados, con el monte de los Hakoge encendido por el sol de la tarde", tejados, { tinte: 0.3, ven: VEN }];

  function preliminares(k) {
    T.rect(k, 0, 0, W, 130, (x, y) => { const c = celdas(x, y, 16, 8, 671, 0.2); return c.borde < 0.06 ? "#5a5248" : rampa(["#d8ccb8", "#c8bca6", "#b4a890", "#9e927a"], 0.2 + (c.id - 0.5) * 0.3 + (y / 130) * 0.2, x, y); });
    [[0, 90], [230, 90]].forEach(([x, w]) => { T.rect(k, x, 56, w, 8, madera(PAL.MAD_O, { paso: 2, largo: 99, s: 672 + x })); for (let px = x + 3; px < x + w; px += 6) k.R(px, 44, 2, 12, PAL.MAD_O[2]); k.R(x, 42, w, 3, PAL.MAD_O[1]); });
    T.rect(k, 120, 4, 80, 30, () => "#f4ecd8"); k.R(116, 2, 88, 3, "#8a5a32"); k.R(116, 33, 88, 3, "#8a5a32");
    trazo(k, [[136, 12], [152, 12]], "#2a2a30", 2); trazo(k, [[134, 20], [154, 20]], "#2a2a30", 2); trazo(k, [[144, 12], [138, 28]], "#2a2a30", 2); trazo(k, [[144, 20], [152, 28]], "#2a2a30", 2);
    trazo(k, [[162, 15], [168, 15]], "#2a2a30", 2); trazo(k, [[165, 10], [165, 25]], "#2a2a30", 2); trazo(k, [[161, 27], [169, 23]], "#2a2a30", 2);
    trazo(k, [[171, 15], [184, 13], [184, 20], [182, 21]], "#2a2a30", 2); trazo(k, [[178, 9], [178, 23]], "#2a2a30", 2); trazo(k, [[172, 12], [172, 26], [186, 27], [186, 23]], "#2a2a30", 2);
    const PI = ["#bcb09a", "#a49882", "#8c806a", "#746854", "#5c5240"];
    [[-1], [1]].forEach(([s]) => { rellena(k, [[160 + s * 4, 128], [160 + s * 34, 128], [160 + s * 40, 96], [160 + s * 30, 70], [160 + s * 14, 66], [160 + s * 6, 80]], (x, y) => rampa(PI, 0.15 + Math.abs(x - 160) / 40 * 0.5 + (fbm(x * 0.2, y * 0.2, 673) - 0.5) * 0.2, x, y)); for (let i = 0; i < 3; i++) { trazo(k, [[160 + s * (10 + i * 7), 70 + i * 2], [160 + s * (12 + i * 7), 48 + i * 3]], PI[4], 7, 6); trazo(k, [[160 + s * (10 + i * 7), 70 + i * 2], [160 + s * (12 + i * 7), 48 + i * 3]], PI[1 + (i % 2)], 5, 4); } trazo(k, [[160 + s * 4, 128], [160 + s * 34, 128], [160 + s * 40, 96], [160 + s * 30, 70], [160 + s * 14, 66]], PI[4], 1); });
    T.rect(k, 156, 34, 8, 40, (x, y) => rampa(PI, 0.1 + (x - 156) / 8 * 0.6, x, y));
    suelo3d(k, 128, 180, 160, 96, losas3d(["#d8d0c0", "#c8bea8", "#b4aa92", "#9e937c", "#857a64"], { tx: 26, tz: 18, s: 674 })); k.R(0, 128, W, 2, "#9e937c");
    trazo(k, [[60, 180], [74, 164], [70, 154], [84, 144]], "#5a5248", 2, 1);
    luces(k, [{ x: 160, y: 60, r: 120, ry: 60, col: "#fff4d8", f: 0.3 }]);
  }
  N[31] = ["La torre del examen", "La sala de las preliminares, en la torre del Bosque de la Muerte, con las manos gigantes de piedra", preliminares, { cielo: "propio", fuerza: 0.35 }];

  function invasion(k) {
    k.banda(CIELO, 0, 100);
    nubarron(k, 30, 20, 80, 12, ["#c8c4c0", "#aaa6a2", "#8c8884"]);
    const vs = [];
    for (let i = 0; i < 14; i++) vs.push(...K.casaK(k, -10 + i * 24, 108, 24, 12 + (i % 3) * 3, { techo: K.TEJAS[["rojo", "azul", "tierra", "teja"][i % 4]], s: 681 + i, deposito: i % 3 === 0 }));
    const SV = ["#a888c8", "#8a6ab0", "#6c4e94", "#523876", "#3a2458"];
    trazo(k, Det6.bezier([250, 110], [230, 60], [290, 40], [270, 14], 30), (f) => SV[f < 0.5 ? 2 : 1], 18, 12);
    bola(k, 266, 14, 14, 9, (x, y) => rampa(SV, 0.2 + (y - 5) / 18 * 0.5, x, y)); k.crudo(260, 11, 3, 2, "#ffe06a"); trazo(k, [[254, 18], [246, 22], [244, 18]], "#c0302a");
    [[60, 100], [200, 104]].forEach(([x, b], i) => pluma(k, x, b, 50, 10, ["#9a948e", "#7c7670", "#5e5a56", "#46423e"], { s: 690 + i, viento: 0.5 }));
    rellena(k, [[-10, 180], [10, 128], [310, 128], [330, 180]], tejas(["#9a7a68", "#80604f", "#664a3c", "#4e362c", "#36241c"], { w: 8, h: 4, s: 691, y0: 128 })); k.R(10, 127, 300, 2, "#36241c");
    [[70, 128], [250, 128]].forEach(([x, b], i) => { trazo(k, Det6.bezier([x, b], [x - 10, b - 30], [x + 12, b - 50], [x, b - 70], 20), "#8a6a48", 6, 3); copa(k, x, b - 72, 18, 12, ["#a8dc88", "#84c46a", "#62a452", "#468440", "#2e6430"], { r: 5, s: 692 + i }); });
    [[20, 300]].forEach(([x0, x1]) => { k.alfa(0.55, () => { k.crudo(x0, 40, 2, 140, "#b070ff"); k.crudo(x1, 40, 2, 140, "#b070ff"); k.crudo(x0, 40, x1 - x0 + 2, 2, "#b070ff"); }); k.alfa(0.2, () => { k.crudo(x0, 40, 16, 140, "#c890ff"); k.crudo(x1 - 14, 40, 16, 140, "#c890ff"); k.crudo(x0, 40, x1 - x0, 10, "#c890ff"); }); for (let y = 44; y < 180; y += 14) [x0 + 1, x1 + 1].forEach((x) => { k.crudo(x - 2, y, 4, 4, "#d8a8ff"); k.crudo(x - 1, y - 3, 2, 3, "#f0d8ff"); }); });
    luces(k, [{ x: 20, y: 110, r: 24, ry: 70, col: "#c890ff", f: 0.5 }, { x: 300, y: 110, r: 24, ry: 70, col: "#c890ff", f: 0.5 }]);
  }
  N[32] = ["La invasión de Kanoho", "El tejado donde el Tercero se enfrenta a Irochomura, dentro de la barrera morada", invasion, { tinte: 0.3, ven: VEN, fuego: ["#b070ff", "#c890ff", "#d8a8ff", "#f0d8ff"] }];

  function cascada(k) {
    k.banda(CIELO, 0, 100);
    nubarron(k, 40, 20, 70, 10); nubarron(k, 230, 30, 80, 12);
    rellena(k, [[90, 128], [100, 20], [130, 10], [190, 10], [220, 20], [230, 128]], (x, y) => rampa(["#a89a88", "#8e8270", "#766a5a", "#5e5446"], 0.2 + 0.2 * Math.sin(y / 4 + Math.sin(x / 13) * 2) + (x > 160 ? 0.3 : 0), x, y));
    for (let y = 12; y < 130; y++) { const a = 16 + (y - 12) * 0.08; for (let x = Math.round(160 - a); x <= 160 + a; x++) k.P(x, y, Math.sin(x * 1.5 + y / 12) > 0.4 ? "#f0faff" : rampa(["#c8eaf8", "#a0d6f0", "#7ac0e6", "#5aa8d8"], (Math.sin(x * 0.9) + 1) * 0.4, x, y)); }
    [[10, 132, 40], [44, 134, 30], [78, 132, 46], [242, 132, 44], [276, 134, 30], [306, 132, 42]].forEach(([x, b, h], i) => arbol(k, x, b, h, 18, 14, ["#a8dc88", "#84c46a", "#62a452", "#468440", "#2e6430"], { g: 4, s: 701 + i }));
    bola(k, 160, 136, 70, 10, (x, y) => rampa(["#d8f0fa", "#9ad0ec", "#6ab4e0", "#4a98cc"], 0.2 + Math.hypot((x - 160) / 70, (y - 136) / 10) * 0.6, x, y)); bruma(k, 110, 146, "#ffffff", 0.6, { s: 702, x0: 90, x1: 230 });
    T.prado(k, 140, ["#b8e098", "#9cd07e", "#80b866", "#68a054", "#528444", "#3c6834"], 703, { flores: { n: 20, cols: ["#ffffff", "#f2d24a"] } });
    [[96, 132, 20, 10], [214, 134, 22, 11], [40, 150, 18, 8], [280, 152, 20, 9]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.4); pena(k, x, b, w, h, ["#b8b0a0", "#a39888", "#8d8478", "#6e665c", "#57504a"]); });
    [[100, 122], [106, 122], [112, 123], [218, 123], [224, 122], [230, 123], [46, 142], [52, 142], [286, 144], [292, 144], [124, 34], [196, 34], [110, 60], [210, 62], [94, 90], [226, 92], [130, 112], [190, 112], [60, 128], [264, 130], [24, 130], [300, 132]].forEach(([x, b], i) => { figurita(k, x, b); if (i % 2 === 0) k.crudo(x + 2, b - 8, 2, 1, "#6ab04e"); });
    for (let i = 0; i < 20; i++) { const x = hash(i, 1, 704) * W, y = 20 + hash(i, 2, 704) * 120; k.R(x, y, 2, 1, "#7ac060"); k.P(x + 1, y - 1, "#9ad078"); }
  }
  N[33] = ["La cascada del entrenamiento", "La cascada donde Karuto aprende el chakra de viento, con cientos de clones cortando hojas", cascada, { tinte: 0.2 }];

  function escondite(k) {
    k.banda(["#3a3a4a", "#4a4a5a", "#5a5a6a", "#6a6a78"], 0, 110);
    nubarron(k, -20, 6, 160, 20, ["#5a5a6a", "#46465a", "#34344a"]); nubarron(k, 160, 2, 180, 22, ["#5a5a6a", "#46465a", "#34344a"]);
    P.rayo(k, 200, 14, 168, 96, { s: 711, col: "#ffffff", halo: "#9ad8ff", ramas: 4, g: 2 });
    k.alfa(0.12, () => k.crudo(0, 0, W, 110, "#d8e8ff"));
    montana(k, 60, 110, 160, 40, { roca: ["#5a6070", "#4c5262", "#3e4454", "#323846"] }); montana(k, 270, 110, 140, 34, { roca: ["#5a6070", "#4c5262", "#3e4454", "#323846"] });
    const PI = ["#a8a8b4", "#90909c", "#787884", "#62626e", "#4c4c58"];
    rellena(k, [[8, 120], [8, 60], [20, 54], [34, 66], [50, 58], [62, 72], [62, 120]], piedra(PI, { tx: 10, ty: 5, s: 712 })); rellena(k, [[258, 120], [258, 66], [272, 56], [286, 64], [300, 52], [312, 62], [312, 120]], piedra(PI, { tx: 10, ty: 5, s: 713 }));
    bola(k, 285, 88, 12, 13, (x, y) => (y < 88 ? "#b8302a" : "#e8e4dc")); k.R(284, 101, 2, 9, "#4a3a2a");
    [[90, 120, 54], [230, 120, 40], [130, 120, 26]].forEach(([x, b, h], i) => { Det.cilindro(k, x - 4, b - h, 9, h, PI, 0.3); for (let j = 0; j < 9; j++) k.R(x - 4 + j, b - h - Math.round(hash(j, i, 714) * 5), 1, 5, PI[1 + (j % 3)]); });
    suelo3d(k, 120, 180, 160, 90, losas3d(["#9a9aa6", "#868692", "#72727e", "#5e5e6a", "#4a4a56"], { tx: 18, tz: 12, s: 715 })); k.R(0, 120, W, 2, "#3a3a46");
    [[[30, 180], [50, 160], [44, 148], [62, 136]], [[290, 180], [272, 164], [280, 150], [262, 138]]].forEach((g) => trazo(k, g, "#2a2a34", 2, 1));
    [[70, 156, 16, 7], [246, 160, 18, 8], [160, 170, 10, 4]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b, w * 0.6, 2, 0.45); k.roca(x, b, w, h, PI[1], PI[0], PI[3]); });
    espejo(k, 120, 128, 180, { tinte: "#5a5a6a", mezcla: 0.5, dentro: (x, y) => fbm(x * 0.05, y * 0.14, 716) > 0.58 });
    P.lluvia(k, 200, 717, { col: "#c8d4e0", largo: 8, ang: 0.35, a: 0.55 });
  }
  N[34] = ["El escondite Ichuha", "La azotea en ruinas donde se enfrentan Susake e Atichi, bajo la tormenta y el rayo", escondite, { tinte: 0.7, fuego: ["#ffffff", "#9ad8ff", "#d8e8ff"] }];

  function kugaya(k) {
    k.banda(["#1a2440", "#243256", "#34446c", "#4a5a82", "#6a7a9e"], 0, 110);
    for (let i = 0; i < 80; i++) k.crudo(hash(i, 1, 721) * W, hash(i, 2, 721) * 90, 1, 1, i % 4 ? "#c8d4ff" : "#ffffff");
    P.fulgor(k, 230, 40, 60, ["#3a4a6a", "#4a5a7e", "#5a6a92"], 0.5);
    bola(k, 230, 40, 40, 40, (x, y) => rampa(["#f4f6fa", "#dce4ee", "#c0ccdc", "#a0aec4", "#8090aa"], 0.1 + Math.hypot(x - 218, y - 28) / 70 + (fbm(x * 0.1, y * 0.1, 722) - 0.5) * 0.25, x, y));
    const HI = ["#ffffff", "#e8f4fc", "#c8e2f4", "#a4cae8", "#7eacd4", "#5a8cbc"];
    [[30, 130, 30, 110], [70, 130, 20, 70], [110, 130, 16, 46], [214, 130, 18, 56], [254, 130, 26, 94], [298, 130, 30, 120], [160, 130, 12, 30]].forEach(([cx, base, w, h], i) => rellena(k, [[cx - w / 2, base], [cx - w * 0.15, base - h * 0.75], [cx, base - h], [cx + w * 0.2, base - h * 0.6], [cx + w / 2, base]], (x, y) => rampa(HI, 0.1 + (x > cx + (base - y) * -0.08 ? 0.4 : 0) + ((y - base + h) / h) * 0.3 + (Math.sin((x + y) * 0.7) > 0.85 ? 0.15 : 0), x, y)));
    T.rect(k, 0, 128, W, 52, (x, y) => rampa(["#e8f4fc", "#d0e6f4", "#b4d4ec", "#98c0e0", "#7aaad2"], 0.1 + ((y - 128) / 52) * 0.4 + (fbm(x * 0.06, y * 0.15, 723) - 0.5) * 0.3, x, y));
    espejo(k, 128, 130, 180, { tinte: "#8ab0d8", mezcla: 0.45, onda: 1, crestas: 0.02 });
    [[[40, 180], [60, 162], [54, 150], [80, 138]], [[280, 180], [262, 160], [270, 148], [244, 136]]].forEach((g) => { trazo(k, g, "#6a8cb4", 1); trazo(k, g.map(([x, y]) => [x + 1, y]), "#ffffff", 1); });
    for (let i = 0; i < 30; i++) k.crudo(hash(i, 1, 724) * W, 30 + hash(i, 2, 724) * 140, 1, 1, "#ffffff");
  }
  N[35] = ["La dimensión de hielo de Kugaya", "La dimensión helada de Kugaya, con sus agujas de hielo y el planeta pálido, donde luchan Karuto y Susake", kugaya, { cielo: "propio", fuerza: 0.25, fuego: ["#ffffff", "#c8d4ff"] }];

  function ochoColas(k) {
    k.banda(CIELO, 0, 100);
    nubarron(k, 180, 20, 90, 14); cirros(k, 4, 4, 24);
    P.mar(k, 96, 140, PAL.MAR, { s: 731 }); reflejo(k, 98, 140);
    const OC = ["#d8a894", "#c08a76", "#a46e5c", "#865446", "#683c32"];
    for (let i = 0; i < 8; i++) { const x0 = 22 + i * 18 + (i > 3 ? 20 : 0), alto = 50 + hash(i, 1, 738) * 30, d = i < 4 ? -1 : 1, pts = []; for (let t = 0; t <= 1; t += 0.03) pts.push([x0 + d * Math.sin(t * 3.2) * 10 * t + d * t * 10, 112 - t * alto + Math.sin(t * 6) * 3]); trazo(k, pts, (f) => OC[f < 0.3 ? 3 : f < 0.7 ? 2 : 1], 8, 2); pts.forEach(([x, y], j) => { if (j % 4 === 1 && j < 28) k.P(x - d * 2, y, "#f4e4d4"); }); }
    bola(k, 96, 104, 46, 22, (x, y) => (y > 112 ? null : rampa(OC, 0.25 + ((x - 96) / 46) * 0.3 + ((y - 82) / 30) * 0.3 + (fbm(x * 0.1, y * 0.1, 739) - 0.5) * 0.2, x, y)));
    bola(k, 96, 70, 20, 17, (x, y) => rampa(OC, 0.15 + ((x - 96) / 20) * 0.3 + ((y - 70) / 17) * 0.3, x, y));
    bola(k, 96, 80, 11, 7, (x, y) => rampa(["#f0d0c0", "#e0b8a8", "#c89c8a"], 0.2 + (y - 73) / 14 * 0.5, x, y)); k.R(91, 80, 2, 2, "#3a1a14"); k.R(99, 80, 2, 2, "#3a1a14"); trazo(k, [[90, 85], [96, 86], [102, 85]], "#5a2a20", 1);
    [[-1], [1]].forEach(([s]) => trazo(k, [[96 + s * 14, 62], [96 + s * 28, 52], [96 + s * 30, 36], [96 + s * 24, 28]], (f) => (f < 0.5 ? "#e8dcc8" : "#fbf4e8"), 5, 2));
    [[87, 66], [105, 66]].forEach(([x, y]) => { k.elipse(x, y, 3, 2, "#fff6d0"); k.crudo(x, y - 1, 2, 3, "#1c1418"); });
    for (let x = 40; x < 152; x++) if (hash(x, 2, 740) > 0.35) k.P(x, 111 + Math.round(Math.sin(x / 3)), "#ffffff");
    for (let x = 50; x < 150; x++) if (hash(x, 1, 732) > 0.4) k.P(x, 112 + Math.round(Math.sin(x / 4)), "#ffffff");
    rellena(k, [[240, 140], [250, 60], [270, 40], [322, 34], [322, 140]], (x, y) => rampa(["#b8a888", "#a09070", "#86785c", "#6e624a"], 0.2 + 0.2 * Math.sin(y / 4 + Math.sin(x / 11) * 2) + (x - 240) / 82 * 0.3, x, y));
    for (let i = 0; i < 8; i++) copa(k, 256 + i * 9, 40 + (i % 3) * 4, 10, 7, ["#9ad07e", "#76b462", "#58984e", "#427a3e", "#2c5c2e"], { r: 3.5, s: 733 + i });
    T.rect(k, 0, 138, W, 42, T.tex(["#fcecc4", "#f2dcaa", "#e4c890", "#d2b278", "#b89660"], { v0: 0.15, s: 734, dy: 0.35, y0: 138, alto: 42 }));
    for (let x = 0; x < W; x++) if (hash(x, 2, 735) > 0.4) k.P(x, 138 + Math.round(Math.sin(x / 6) * 1.2), "#ffffff");
    sombraE(k, 52, 168, 18, 3, 0.45); pena(k, 34, 168, 36, 22, ["#b8b0a0", "#a39888", "#8d8478", "#6e665c", "#57504a"]); trazo(k, [[52, 148], [56, 132]], "#c8ccd8", 2, 1); k.R(50, 146, 8, 2, "#3a2a20");
    P.palmera(k, 286, 150, 44, { inc: -0.25, s: 736 }); P.palmera(k, 220, 148, 36, { inc: 0.2, s: 737 });
  }
  N[36] = ["Kellir Bee y el Ocho Colas", "La playa de la isla Tortuga donde entrena Kellir Bee, con el Ocho Colas saliendo del mar", ochoColas, { tinte: 0.1 }];
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
  const { rampa, rellena, esfera, cilindro, nubarron, cirros, montana, loma, pena, camino, matas, barril, caja, bandera, farolillo, catenaria, humo, brillo, rotulo } = Det;
  const { bola, mezcla, hash, fbm, trazo, madera, piedra, briznas, arbol, pase, sombraE, luces, bruma, encendido } = Det6;
  const T = window.P15, K = window.N16;
  const W = 320;
  window.SitiosIt27 = window.SitiosIt27 || {};
  const N = (window.SitiosIt27.ninjas = window.SitiosIt27.ninjas || {});
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"], VEN = ["#ffd27a"];
  const MADO = ["#8a6240", "#74502f", "#5e4024", "#48301a", "#342212"], MADC = ["#c8a070", "#b08a5a", "#967048", "#7a5836", "#5e4226"];
  const PRADO = ["#a8d880", "#8cc46a", "#74b058", "#5e9a48", "#48803a"];
  const grano = (k, x0, y0, x1, y1, s, f = 16) => pase(k, (x, y, d, i) => { const v = (fbm(x * 0.32, y * 0.32, s) - 0.5) * f; d[i] += v; d[i + 1] += v * 0.92; d[i + 2] += v * 0.8; }, x0, y0, x1, y1);

  const VE = ["#6aaa80", "#4f8f66", "#3f7a55", "#2f6a48", "#1f4a34"], ROJ = ["#e8806a", "#cc5a44", "#a8402e", "#7e2e20", "#561e14"];
  const MURO = ["#e2d4b8", "#d0c0a2", "#bcaa8a", "#a49272", "#867658"];
  function puertas(k) {
    const lit = encendido(k), L = [];
    k.banda(CIELO, 0, 100);
    nubarron(k, -16, 28, 80, 12); nubarron(k, 244, 22, 88, 13); cirros(k, 4, 2, 20);
    const LEJOS = ["#a8c4dc", "#8fb0cc", "#7fa8c8", "#6e98ba"];
    montana(k, 60, 104, 170, 40, { roca: LEJOS }); montana(k, 266, 104, 170, 46, { roca: LEJOS });
    bruma(k, 72, 104, "#e4eef6", 0.3);
    T.rect(k, 0, 68, W, 56, piedra(MURO, { tx: 18, ty: 8, s: 1201, junta: "#8a7a5e" }));
    k.alfa(0.28, () => k.R(0, 69, W, 3, "#3a2a1a")); k.alfa(0.18, () => k.R(0, 114, W, 10, "#3a2a1a"));
    T.rect(k, 0, 64, W, 5, madera(MADO, { paso: 5, largo: 64, s: 1202 })); k.R(0, 64, W, 1, "#a87a50"); k.R(0, 68, W, 1, "#2a1a10");
    T.tejadoJ(k, 30, 67, 120, 7, K.TEJAS.teja, 1203, 1); T.tejadoJ(k, 292, 67, 120, 7, K.TEJAS.teja, 1204, 1);
    const tabla = madera(VE, { paso: 11, vertical: true, largo: 99, s: 1205 });
    T.rect(k, 92, 44, 136, 80, (x, y) => (Math.abs(x - 159.5) < 1 ? "#101814" : tabla(x, y)));
    k.alfa(0.25, () => { k.R(92, 44, 136, 5, "#08100c"); k.R(152, 44, 16, 80, "#0c140f"); k.R(92, 116, 136, 8, "#0c140f"); });
    [58, 84, 110].forEach((y) => { k.R(92, y, 136, 3, "#2a2a30"); k.R(92, y, 136, 1, "#62626e"); k.R(92, y + 3, 136, 1, "#1a2a20"); for (let x = 96; x < 226; x += 14) { k.P(x, y + 1, "#d8d8e4"); k.P(x + 1, y + 2, "#1a1a20"); } });
    [[126, 92, 1], [194, 92, -1]].forEach(([x, y, d]) => {
      for (let a = 0; a < 15; a += 0.07) { const r = 1 + a * 0.95; k.R(x + d * Math.cos(a) * r + 1, y + Math.sin(a) * r + 1, 2, 2, "#5a1610"); }
      for (let a = 0; a < 15; a += 0.07) { const r = 1 + a * 0.95, px = x + d * Math.cos(a) * r, py = y + Math.sin(a) * r; k.R(px, py, 2, 2, Math.sin(a) < -0.55 ? "#e05a44" : "#c0392b"); }
      k.poli([[x + d * 13, y - 9], [x + d * 22, y - 20], [x + d * 17, y - 3]], "#c0392b"); k.poli([[x + d * 14, y - 10], [x + d * 20, y - 18], [x + d * 16, y - 9]], "#e05a44");
    });
    [[152, 98], [168, 98]].forEach(([x, y]) => { k.R(x - 1, y - 7, 3, 3, "#3a3a44"); for (let a = 0; a < 6.3; a += 0.25) k.P(x + Math.cos(a) * 3.5, y + Math.sin(a) * 3.5, a > 3.6 && a < 5.6 ? "#c8c8d4" : "#5a5a66"); });
    T.rect(k, 84, 34, 152, 11, madera(ROJ, { paso: 4, largo: 76, s: 1206 })); k.R(84, 34, 152, 1, "#f09a80"); k.R(84, 44, 152, 1, "#3a120c");
    T.tejadoJ(k, 160, 34, 176, 12, K.TEJAS.rojo, 1207, 4);
    k.R(133, 35, 54, 9, "#2a120a"); k.R(134, 36, 52, 7, "#5a2a18"); k.R(134, 36, 52, 1, "#7a3a24"); rotulo(k, 140, 37, "KANOHO", "#ffe9a8");
    [84, 228].forEach((x) => {
      cilindro(k, x - 3, 44, 9, 80, ["#e0705a", "#b5432f", "#8a2f22", "#5a1f18"], 0.3);
      T.rect(k, x - 6, 118, 15, 6, piedra(MURO, { tx: 8, ty: 3, s: x })); k.R(x - 6, 118, 15, 1, "#efe2c8");
      [46, 114].forEach((y) => { k.R(x - 4, y, 11, 2, "#c9a03c"); k.R(x - 4, y, 11, 1, "#f2d06a"); });
      farolillo(k, x + 1, 64, lit > 0.3 ? "#ffcf6a" : "#e8402a", 3);
      L.push({ x: x + 1, y: 64, r: 30, ry: 26, col: "#ffb04a", f: lit * 0.75 });
    });
    T.prado(k, 124, PRADO, 1208, { flores: { n: 50, cols: ["#ffffff", "#f2d24a", "#f27a9a"] }, n: 260 });
    rellena(k, [[96, 182], [224, 182], [186, 124], [134, 124]], (x, y) => rampa(["#ecd8a8", "#dcc694", "#ccb482", "#b49c6c"], 0.22 + (fbm(x * 0.12, y * 0.3, 1209) - 0.5) * 0.5 + (Math.abs(Math.abs(x - 160) - (12 + (y - 124) * 0.5)) < 1.3 ? 0.4 : 0), x, y));
    trazo(k, [[134, 124], [96, 180]], "#9a8458", 1); trazo(k, [[186, 124], [224, 180]], "#9a8458", 1);
    for (let i = 0; i < 26; i++) { const y = 128 + hash(i, 1, 1210) * 50, a = 28 + (y - 124) * 0.6, x = 160 - a + hash(i, 2, 1210) * 2 * a; k.R(x, y, 2, 1, "#9a8a70"); k.P(x, y - 1, "#f4e8cc"); }
    briznas(k, 0, 92, 124, ["#5e9a48", "#74b058", "#8cc46a"], { n: 50, alto: 4, s: 1211 }); briznas(k, 228, W, 124, ["#5e9a48", "#74b058", "#8cc46a"], { n: 50, alto: 4, s: 1212 });
    sombraE(k, 160, 126, 74, 4, 0.3);
    K.casaK(k, 246, 134, 42, 22, { techo: K.TEJAS.azul, s: 1213 }).forEach(([x, y]) => L.push({ x, y, r: 12, ry: 9, col: "#ffd27a", f: lit * 0.6 }));
    T.rect(k, 238, 124, 58, 3, madera(MADC, { paso: 1, largo: 99, s: 1214 })); k.R(238, 124, 58, 1, "#e0bc88");
    T.rect(k, 238, 127, 58, 7, madera(MADO, { paso: 2, vertical: true, largo: 99, s: 1215 })); k.alfa(0.3, () => k.R(238, 127, 58, 1, "#2a1a10"));
    k.R(250, 122, 9, 2, "#f4efe6"); k.R(251, 121, 7, 1, "#fbf8f0"); k.R(264, 121, 6, 3, "#c8bea8"); k.R(276, 120, 3, 4, "#4a6a9a");
    sombraE(k, 268, 135, 30, 2.5, 0.35); caja(k, 296, 136, 12, 9);
    arbol(k, 36, 138, 18, 17, 14, K.HOJAS.v, { g: 5, s: 1216 }); arbol(k, 8, 176, 26, 24, 20, K.HOJAS.v, { g: 7, s: 1217 }); arbol(k, 318, 178, 28, 24, 20, K.HOJAS.v, { g: 7, s: 1218 });
    luces(k, L);
  }
  N[12] = ["Las puertas de Kanoho", "Las grandes puertas verdes, al final del camino", puertas, { ven: VEN, fuego: ["#ffcf6a"] }];

  function estadio(k) {
    const { h } = Det.cuando(k);
    k.banda(CIELO, 0, 60);
    nubarron(k, 26, 18, 60, 8); nubarron(k, 216, 14, 72, 8);
    T.rect(k, 0, 90, W, 90, T.tex(["#dcc094", "#c9a878", "#b5966a", "#9c7e58"], { s: 601, y0: 90, alto: 90 }));
    const rim = (u) => 40 - u * u * 26, pie = (u) => 98 + u * u * 34, FILAS = 6;
    for (let x = 0; x < W; x++) {
      const u = (x - 160) / 165, y0 = Math.round(rim(u)), y1 = Math.round(pie(u));
      for (let y = y0; y < y1; y++) { const f = (y - y0) / (y1 - y0), r = Math.floor(f * FILAS), g = f * FILAS - r; k.P(x, y, g > 0.8 ? "#5e4838" : g > 0.68 ? "#dcc4a4" : rampa(["#c4a888", "#b0927a", "#987a64", "#806450"], 0.15 + Math.abs(u) * 0.45 + (1 - g) * 0.12 + (fbm(x * 0.2, y * 0.5, 602) - 0.5) * 0.2, x, y)); }
      for (let d = 1; d < 5; d++) k.P(x, y0 - d, d === 4 ? "#e8604a" : d === 1 ? "#8a2218" : "#c0392b"); k.P(x, y0 - 5, "#f08a70");
      if (x % 9 === 0) k.R(x, y0 - 8, 1, 3, "#8a2218");
      k.R(x, y1, 1, 3, "#4a3828"); k.P(x, y1, "#a8886c");
    }
    const PIEL = ["#f2d0a8", "#e0b088", "#c89068"], PELO = ["#2a1e16", "#5a3a22", "#e8c35a", "#c8402e", "#3a3a44", "#f0f0e8"], ROPA = ["#c0392b", "#3f6f9a", "#e8c35a", "#5a9a5a", "#e8e0cc", "#8a5aa8", "#d87a3a", "#2a2a34", "#5a7a9a"];
    let n = 0;
    for (let r = 0; r < FILAS; r++) for (let u = -1.02; u < 1.02;) {
      const s = 1 + u * u * 1.5, x = 160 + u * 165, y0 = rim(u), y1 = pie(u), y = y0 + ((y1 - y0) * (r + 0.42)) / FILAS, pasillo = [-0.72, -0.4, 0.4, 0.72].some((a) => Math.abs(u - a) < 0.022);
      if (!pasillo && Math.abs(x - 160) > 19 + r * 0.6) {
        n++; const t = Math.max(1, s * 1.5);
        k.R(x - (s > 1.6 ? 1 : 0), y + s * 1.5, Math.max(2, s * 2), Math.max(1, s * 2), ROPA[Math.floor(hash(n, 1, 603) * ROPA.length)]);
        k.R(x, y, t, t, PIEL[Math.floor(hash(n, 2, 603) * 3)]); if (s > 1.3) k.R(x, y, t, Math.max(1, t * 0.45), PELO[Math.floor(hash(n, 3, 603) * PELO.length)]);
        if (s > 1.8 && hash(n, 4, 603) < 0.18) k.R(x + t, y - 1, 1, t, PIEL[0]);
      }
      u += (0.021 * s) / (1 + u * u * 0.2);
    }
    [-0.72, -0.4, 0.4, 0.72].forEach((u) => { const x = 160 + u * 165; for (let y = rim(u); y < pie(u); y++) { k.R(x - 1, y, 3, 1, "#e0ccb0"); if (y % 4 === 0) k.R(x - 1, y, 3, 1, "#a8896a"); } });
    [[-0.86, "#c0392b"], [-0.55, "#3f6f9a"], [0.55, "#e8c35a"], [0.86, "#5a9a5a"]].forEach(([u, col]) => { const x = Math.round(160 + u * 165), y = rim(u) - 6; k.R(x, y - 14, 1, 14, "#3a2a20"); bandera(k, x + 1, y - 14, 10, 6, col); });
    T.rect(k, 143, 30, 34, 36, madera(["#b04e3a", "#8a2f22", "#74261c", "#5a1d16", "#3a120c"], { paso: 3, vertical: true, largo: 99, s: 604 }));
    T.tejadoJ(k, 160, 31, 46, 9, ["#5a4444", "#463434", "#3a2a2a", "#2a1e1e", "#1a1212"], 605, 3);
    T.rect(k, 147, 38, 26, 20, (x, y) => rampa(["#3a3046", "#2a2236", "#1e1828"], (y - 38) / 20, x, y));
    [[153, "#f4efe0"], [167, "#3f6fa8"]].forEach(([x, ropa]) => { k.R(x - 2, 50, 5, 6, ropa); k.R(x - 2, 50, 1, 6, mezcla(ropa, "#ffffff", 0.4)); k.R(x - 1, 47, 3, 3, "#e8c8a0"); k.poli([[x - 4, 47], [x + 4, 47], [x, 43]], ropa); k.R(x - 3, 46, 7, 1, mezcla(ropa, "#000000", 0.3)); });
    k.R(158, 52, 4, 4, "#54402e"); k.R(147, 56, 26, 2, "#6a4a34");
    k.R(146, 58, 28, 3, "#c0392b"); k.R(146, 58, 28, 1, "#e0604a");
    T.rect(k, 141, 64, 38, 30, (x, y) => rampa(["#c04a36", "#a83a2a", "#8a2f22", "#6a221a"], 0.12 + Math.abs(x - 160) / 42 + (Math.sin(x * 0.8) > 0.7 ? 0.15 : 0) + (y > 88 ? 0.12 : 0), x, y));
    k.R(141, 64, 38, 2, "#c9a03c"); k.R(141, 64, 38, 1, "#f2d06a"); k.R(141, 92, 38, 2, "#c9a03c"); K.hojaK(k, 158, 79, 7, "#f4efe0");
    k.R(136, 94, 48, 4, "#5e4838"); k.R(136, 94, 48, 1, "#a8886c");
    const verde = (s) => (x, y) => rampa(PRADO, 0.22 + (fbm(x * 0.1, y * 0.2, s) - 0.5) * 0.6 + (y - 108) / 300, x, y);
    rellena(k, [[-4, 182], [-4, 134], [40, 120], [104, 108], [122, 116], [176, 182]], verde(606)); rellena(k, [[144, 182], [198, 116], [216, 108], [280, 120], [324, 134], [324, 182]], verde(607));
    rellena(k, [[82, 182], [126, 116], [194, 116], [238, 182]], (x, y) => rampa(["#e4cc9c", "#d4b888", "#c4a474", "#ac8c60"], 0.25 + (fbm(x * 0.14, y * 0.3, 608) - 0.5) * 0.5, x, y));
    k.hierbas(112, 178, 80, ["#7a9a4a", "#a8c070"]); matas(k, 130, 178, 14, ["#6e8a42", "#86a050", "#a8c070"]);
    for (let i = 0; i < 30; i++) { const x = 92 + hash(i, 1, 609) * 136, y = 124 + hash(i, 2, 609) * 54; k.R(x, y, 3 + hash(i, 3, 609) * 7, 1, "#b09468"); }
    [[176, 156, 26, 6], [120, 170, 16, 4]].forEach(([x, y, a, b]) => {
      for (let j = 0; j < 8; j++) { const t = (j / 8) * 6.28; trazo(k, [[x + Math.cos(t) * a, y + Math.sin(t) * b], [x + Math.cos(t) * (a + 7), y + Math.sin(t) * (b + 3)]], "#a08058", 1); }
      k.elipse(x, y - 1, a + 2, b + 1, "#ecd8ac"); k.elipse(x, y, a, b, "#a88a60"); k.elipse(x, y + 1, a - 4, b - 2, "#94785a"); k.elipse(x + 2, y + 2, a - 9, b - 3, "#7e6446");
    });
    [[104, 140], [214, 150], [150, 132]].forEach(([x, y]) => { sombraE(k, x + 2, y + 1, 3, 1, 0.4); trazo(k, [[x, y], [x + 1, y - 6]], "#3a3a44", 1); k.P(x + 1, y - 7, "#d8d8e4"); k.P(x + 2, y - 8, "#8a8a96"); });
    arbol(k, 34, 138, 16, 15, 13, K.HOJAS.v, { g: 4, s: 610 }); arbol(k, 292, 140, 17, 16, 14, K.HOJAS.v, { g: 5, s: 611 });
    arbol(k, 6, 172, 26, 22, 20, K.HOJAS.v, { g: 6, s: 612 }); arbol(k, 318, 174, 28, 24, 21, K.HOJAS.v, { g: 7, s: 613 });
    [[66, 150, 22, 9], [246, 158, 24, 10]].forEach(([x, b, w, a]) => { sombraE(k, x + w / 2 + 3, b + 1, w * 0.6, 2, 0.4); pena(k, x, b, w, a, ["#c8c0b0", "#a39888", "#8d8478", "#6e665c"]); });
    if (h === 13) for (let i = 0; i < 70; i++) { const x = hash(i, 1, 614) * W, y = hash(i, 2, 614) * 140; k.R(x, y, 3, 1, "#ffffff"); k.P(x + 1, y + 1, "#d8e0e8"); k.P(x - 1, y - 1, "#f4f8fc"); }
  }
  N[6] = ["El estadio del examen", "La arena de las finales: gradas curvas y llenas, y el palco de los Kega al fondo", estadio, { ven: VEN, tinte: 0.2, dx: 80 }];

  const BLANCO = ["#fffaf0", "#f4ead6", "#e2d4b8", "#c8b898", "#a89878"], PIZARRA = ["#7a9ca8", "#5a7c88", "#3f5f6a", "#2c4650", "#1c3038"];
  function tunzaka(k) {
    const roto = Det.cuando(k).h >= 15, lit = encendido(k), L = [];
    k.banda(["#e8a860", "#f2c47a", "#f8dfa8"], 0, 116);
    const CR = ["#fff0d8", "#f8d8a8", "#e8b880"], MO = ["#c89c6a", "#b58a5a", "#a07a4e", "#8c6a42"];
    nubarron(k, -16, 40, 84, 15, CR); nubarron(k, 246, 34, 86, 16, CR);
    montana(k, 66, 112, 190, 42, { roca: MO }); montana(k, 266, 112, 180, 38, { roca: MO });
    bruma(k, 84, 116, "#f8e0b8", 0.3);
    const talud = piedra(["#c0b4a4", "#a89c8c", "#94887a", "#7a6e60", "#62584c"], { tx: 14, ty: 6, s: 1601, junta: "#5a5044" });
    rellena(k, [[86, 128], [98, 90], [222, 90], [234, 128]], (x, y) => { const c = talud(x, y); return x > 172 ? mezcla(c, "#3a3028", 0.2) : c; });
    k.R(98, 90, 124, 1, "#d8ccbc");
    const enlucido = (x0, w) => (x, y) => rampa(BLANCO, 0.08 + ((x - x0) / w) * 0.45 + (fbm(x * 0.3, y * 0.3, 1602) - 0.5) * 0.12, x, y);
    T.rect(k, 112, 62, 96, 30, enlucido(112, 96)); k.alfa(0.3, () => k.R(112, 62, 96, 3, "#3a3028"));
    T.tejadoJ(k, 160, 64, 128, 13, PIZARRA, 1603, 5);
    if (roto) {
      [[116, 66, 30, 18], [150, 68, 34, 24], [186, 66, 26, 16]].forEach(([x, b, w, a]) => pena(k, x, b, w, a, ["#efe6d0", "#d4c8ae", "#94887a", "#74695e"]));
      trazo(k, [[128, 50], [150, 64]], "#3f5f6a", 3); trazo(k, [[176, 44], [192, 62]], "#2c4650", 3); trazo(k, [[140, 46], [146, 62]], "#7a5836", 2); trazo(k, [[168, 40], [162, 58]], "#5e4226", 2);
      for (let i = 0; i < 14; i++) { const x = 116 + hash(i, 1, 1604) * 88, y = 28 + hash(i, 2, 1604) * 34; k.R(x, y, 3, 2, PIZARRA[2 + (i % 2)]); k.P(x, y, PIZARRA[1]); }
      humo(k, 160, 42, "#c8bca8", 0.5, 7); bruma(k, 40, 92, "#e8dcc8", 0.35, { x0: 100, x1: 220 });
    } else {
      T.rect(k, 130, 36, 60, 18, enlucido(130, 60)); T.tejadoJ(k, 160, 38, 84, 12, PIZARRA, 1605, 4);
      T.rect(k, 146, 16, 28, 12, enlucido(146, 28)); T.tejadoJ(k, 160, 18, 48, 11, PIZARRA, 1606, 3);
      [144, 168].forEach((x) => T.ventana(k, x, 41, 7, 8, { marco: "#3a4a52", vidrio: "#55697c" })); T.ventana(k, 157, 19, 6, 6, { marco: "#3a4a52", vidrio: "#55697c", cruz: false });
      [[150, 8, 1], [170, 8, -1]].forEach(([x, y, d]) => { k.poli([[x, y], [x + d * 4, y - 5], [x + d * 7, y + 1]], "#c9a03c"); k.poli([[x + d, y - 1], [x + d * 4, y - 4], [x + d * 5, y]], "#f2d06a"); });
    }
    k.poli([[150, 64], [170, 64], [160, 56]], "#efe6d0"); k.poli([[154, 64], [166, 64], [160, 59]], PIZARRA[2]);
    for (let x = 120; x < 202; x += 12) { T.ventana(k, x, 70, 7, 9, { marco: "#3a4a52", vidrio: "#55697c" }); k.R(x - 1, 79, 9, 1, "#b4a888"); }
    T.rect(k, 0, 126, W, 54, T.tex(["#d8c5aa", "#c8b59a", "#b8a58a", "#a48f74"], { s: 1607, y0: 126, alto: 54 }));
    [[-6, 132, 50, 32, "#c0392b", K.TEJAS.teja], [44, 130, 42, 24, "#2f6fa8", K.TEJAS.tierra], [234, 130, 42, 24, "#3f8a58", K.TEJAS.tierra], [276, 132, 50, 32, "#c0392b", K.TEJAS.teja]]
      .forEach(([x, b, w, hh, noren, techo], i) => K.casaK(k, x, b, w, hh, { techo, s: 1610 + i, noren }).forEach(([vx, vy]) => L.push({ x: vx, y: vy, r: 12, ry: 9, col: "#ffd27a", f: lit * 0.7 })));
    rellena(k, [[110, 182], [210, 182], [176, 126], [144, 126]], (x, y) => {
      const f = Math.pow((y - 126) / 56, 0.7) * 9, fila = Math.floor(f), a = 16 + ((y - 126) / 56) * 34, col = Math.floor(((x - 160) / a + 1) * (2 + fila * 0.5));
      return f - fila > 0.86 ? "#9c8a70" : rampa(["#e4d2b8", "#d4c1a6", "#c4b096"], 0.15 + hash(fila, col, 1614) * 0.55, x, y);
    });
    [[0, 102, 104, 118], [320, 102, 216, 118]].forEach(([a, b, c2, d]) => catenaria(k, a, b, c2, d, 5, "#3a2a20", (x, y, i) => { if (i % 15 === 7) { farolillo(k, x, y + 4, "#e8402a", 2); k.R(x - 1, y + 3, 3, 1, "#ffb04a"); L.push({ x, y: y + 4, r: 12, ry: 10, col: "#ff9a5a", f: 0.12 + lit * 0.6 }); } }));
    [[96, 150, "#c0392b"], [224, 152, "#2f6fa8"]].forEach(([x, b, col], i) => {
      sombraE(k, x, b + 1, 17, 2.5, 0.4);
      T.rect(k, x - 12, b - 8, 26, 8, madera(MADO, { paso: 2, largo: 99, s: 1615 + i })); k.R(x - 12, b - 8, 26, 1, "#c89a68");
      [x - 11, x + 11].forEach((px, j) => T.rect(k, px, b - 24, 2, 16, madera(MADO, { paso: 1, vertical: true, largo: 99, s: 1617 + i * 2 + j })));
      for (let j = 0; j < 7; j++) { k.R(x - 14 + j * 4, b - 28, 4, 5, j % 2 ? "#f4efe0" : col); k.R(x - 14 + j * 4, b - 24, 4, 1, j % 2 ? "#c8bea8" : mezcla(col, "#000000", 0.35)); }
      k.R(x - 14, b - 29, 28, 1, mezcla(col, "#ffffff", 0.3));
      [-7, -2, 3, 8].forEach((d, j) => { k.elipse(x + d, b - 10, 2, 2, j % 2 ? "#f2c84b" : "#e8402a"); k.P(x + d - 1, b - 11, "#fff4d0"); });
      k.R(x - 9, b - 20, 4, 5, "#f4efe0"); k.P(x - 8, b - 18, "#26262a"); k.P(x - 6, b - 18, "#26262a"); k.R(x + 5, b - 20, 4, 5, "#e8c35a"); k.P(x + 6, b - 18, "#26262a"); k.P(x + 8, b - 18, "#26262a");
      L.push({ x, y: b - 12, r: 20, ry: 14, col: "#ffcf6a", f: lit * 0.6 });
    });
    for (let i = 0; i < 18; i++) k.R(hash(i, 1, 1620) * W, 134 + hash(i, 2, 1620) * 44, 6 + hash(i, 3, 1620) * 10, 1, "#a8957a");
    luces(k, L);
  }
  N[16] = ["La ciudad de Tunzaka", "La ciudad del castillo y los farolillos, donde encuentran a Tsanude", tunzaka, { ven: ["#ffd27a", "#55697c"], tinte: 0.2, fuego: ["#e8402a", "#ffb04a"], dx: 76 }];

  const ARENA = ["#f6dcaa", "#ecc890", "#d8b07a", "#c09060", "#a07648"];
  function suna(k) {
    const lit = encendido(k), L = [];
    k.banda(["#e8a860", "#f2c47a", "#f8dfa8"], 0, 110);
    nubarron(k, 90, 16, 54, 8, ["#fff0d8", "#f8d8a8", "#e8b880"]); cirros(k, 6, 4, 34, "#fff0d0");
    const AC = ["#ecc488", "#d8ac72", "#c49458", "#a8763f", "#8a5e32", "#6e4826"];
    const roca = (x, y) => rampa(AC, 0.22 + 0.2 * Math.sin(y / 3.1 + Math.sin(x / 13) * 1.6) + (fbm(x * 0.08, y * 0.25, 701) - 0.5) * 0.4 + (Math.sin(x / 4.7 + y / 9) > 0.88 ? 0.25 : 0), x, y);
    rellena(k, [[-6, 128], [-6, 30], [34, 22], [62, 42], [78, 128]], roca); rellena(k, [[326, 128], [326, 26], [284, 18], [254, 44], [240, 128]], roca);
    k.poli([[-6, 30], [34, 22], [62, 42], [58, 46], [32, 30], [-6, 38]], "#f6daa4"); k.poli([[326, 26], [284, 18], [254, 44], [262, 46], [286, 28], [326, 34]], "#f6daa4");
    k.alfa(0.2, () => { rellena(k, [[46, 128], [62, 42], [78, 128]], () => "#5a3a1a"); rellena(k, [[300, 128], [326, 40], [326, 128]], () => "#5a3a1a"); });
    [[20, 60, 30], [290, 70, 26]].forEach(([x, y, l]) => trazo(k, [[x, y], [x + 4, y + l * 0.4], [x + 1, y + l]], "#6e4826", 1));
    const BA = ["#f4d8a0", "#ecc890", "#d8b07a", "#b58c5a", "#94703f"];
    const casa = (x, b, w, h, i) => {
      cilindro(k, x, b - h, w, h, BA, 0.25); grano(k, x, b - h, x + w, b, 702 + i);
      k.elipse(x + w / 2, b - h, w / 2, 7, "#ecc890"); k.elipse(x + w / 2, b - h - 1, w / 2 - 2, 5, "#d8ae74"); k.elipse(x + w / 2 - 3, b - h - 2, w / 4, 2, "#f4d8a0");
      k.R(x + w / 2 - 2, b - h - 9, 4, 3, "#94703f"); k.R(x + w / 2 - 2, b - h - 9, 1, 3, "#c49a62");
      for (let vx = x + 5; vx < x + w - 7; vx += 11) { k.elipse(vx + 2, b - h + 11, 3, 3, "#5a3f2a"); k.R(vx - 1, b - h + 11, 6, 5, "#5a3f2a"); k.R(vx - 1, b - h + 16, 6, 1, "#f6dcaa"); k.R(vx + 3, b - h + 10, 1, 6, "#3a2414"); }
      k.R(x + w / 2 - 4, b - 10, 8, 10, "#4a3020"); k.elipse(x + w / 2, b - 10, 4, 4, "#4a3020"); k.R(x + w / 2 - 4, b - 10, 1, 10, "#2a1a10");
      sombraE(k, x + w / 2 + 3, b + 1, w * 0.6, 2, 0.4);
    };
    [[64, 112, 30, 26], [98, 110, 22, 20], [198, 110, 24, 22], [226, 112, 30, 28]].forEach(([x, b, w, h], i) => casa(x, b, w, h, i));
    const CU = ["#f8e0b0", "#f2d29c", "#dcb680", "#c79c64", "#a87e48", "#8a6438"];
    cilindro(k, 112, 66, 96, 62, CU, 0.3);
    bola(k, 160, 66, 49, 40, (x, y) => rampa(CU, 0.08 + ((x - 160) / 49) * 0.34 + ((y - 56) / 40) * 0.3 + 0.18, x, y));
    grano(k, 111, 26, 210, 128, 703, 14);
    k.R(112, 96, 96, 2, "#a87e48"); k.R(112, 96, 96, 1, "#f2d29c");
    k.elipse(160, 62, 16, 16, "#5a3a1e"); k.elipse(160, 62, 15, 15, "#7a4a2a"); k.elipse(160, 62, 12, 12, "#efd29c"); k.elipse(158, 60, 8, 8, "#f8e4b8");
    trazo(k, [[152, 58], [168, 58]], "#7a4a2a", 2); trazo(k, [[150, 62], [170, 62]], "#7a4a2a", 2); trazo(k, [[155, 66], [165, 66]], "#7a4a2a", 2); trazo(k, [[160, 52], [160, 72]], "#7a4a2a", 2);
    for (let a = 0.3; a < 2.9; a += 0.5) { const x = 160 + Math.cos(a) * 42; k.elipse(x, 88, 4, 4, "#5a3f2a"); k.R(x - 4, 88, 8, 8, "#5a3f2a"); k.R(x - 4, 96, 8, 1, "#f2d29c"); k.R(x + 2, 86, 2, 10, "#3a2414"); }
    k.elipse(160, 112, 16, 14, "#7a5432"); k.elipse(160, 112, 15, 13, "#4a3020"); k.R(145, 112, 30, 16, "#4a3020"); k.elipse(160, 112, 12, 10, "#2e1f14"); k.R(148, 112, 24, 16, "#2e1f14");
    [0, 1, 2].forEach((i) => k.R(142 - i * 3, 122 + i * 2, 36 + i * 6, 2, i % 2 ? "#dcb680" : "#ecc890"));
    T.rect(k, 0, 126, W, 54, T.tex(ARENA.slice(1), { s: 705, y0: 126, alto: 54 }));
    k.alfa(0.3, () => k.R(0, 127, W, 2, "#8a6438"));
    casa(14, 136, 34, 28, 4); casa(52, 134, 26, 22, 5); casa(236, 134, 28, 24, 6); casa(270, 136, 44, 30, 7);
    const ROPA = ["#c0392b", "#3f6f9a", "#f4efe0", "#e8c35a", "#5a9a5a"];
    catenaria(k, 48, 110, 112, 100, 7, "#6a4a2a", (x, y, i) => { if (i % 9 === 4) { const c = ROPA[i % 5]; k.R(x - 2, y, 5, 6, c); k.R(x - 2, y + 5, 5, 1, mezcla(c, "#000000", 0.3)); } });
    catenaria(k, 208, 100, 270, 110, 7, "#6a4a2a", (x, y, i) => { if (i % 9 === 4) { const c = ROPA[(i + 2) % 5]; k.R(x - 2, y, 5, 6, c); k.R(x - 2, y + 5, 5, 1, mezcla(c, "#000000", 0.3)); } });
    loma(k, [[-20, 164], [90, 148], [200, 172], [340, 150]], 180, ARENA.slice(0, 4), 0.4);
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 706) * W, y = 150 + hash(i, 2, 706) * 28; k.R(x, y, 10 + hash(i, 3, 706) * 18, 1, "#d0a866"); k.R(x + 2, y - 1, 6, 1, "#f8e2b4"); }
    camino(k, 128, 150, () => 160, (f) => 12 + f * 8, "#d4ae70", "#e4c288");
    for (let i = 0; i < 10; i++) k.R(157 + (i % 2) * 4, 131 + i * 2, 2, 1, "#b48c58");
    sombraE(k, 102, 147, 8, 2, 0.4); caja(k, 96, 146, 12, 9); sombraE(k, 216, 149, 6, 1.5, 0.4); barril(k, 212, 148, 9, 10, ["#c9a878", "#a8845a", "#7a5a3a", "#5a4228"]);
    bruma(k, 132, 180, "#f2d8a8", 0.28);
    L.push({ x: 160, y: 116, r: 40, ry: 22, col: "#ffcf6a", f: lit * 0.4 });
    luces(k, L);
  }
  N[7] = ["Sanugakure", "La aldea de la Arena, con la gran cúpula del Kezakage entre acantilados", suna, { tinte: 0.45, ven: ["#5a3f2a"], dx: 70 }];

  function guarida(k) {
    const L = [];
    const muro = piedra(["#3a3646", "#322e3e", "#2a2636", "#221e2c", "#18141e"], { tx: 32, ty: 11, s: 1801, junta: "#0e0c14" });
    T.rect(k, 0, 0, W, 134, (x, y) => { const c = muro(x, y); return fbm(x * 0.08, y * 0.08, 1802) > 0.66 ? mezcla(c, "#2a3a2e", 0.35) : c; });
    for (let i = 0; i < 22; i++) { const x = Math.round(hash(i, 1, 1803) * W), y = hash(i, 2, 1803) * 120; trazo(k, [[x, y], [x, y + 6 + hash(i, 3, 1803) * 12]], "#3e4a5a", 1); }
    const arco = piedra(["#6e687c", "#5e586c", "#4e485c", "#3e384a", "#2c2838"], { tx: 12, ty: 9, s: 1804, junta: "#1e1a26" });
    rellena(k, [[96, 134], [96, 44], [120, 16], [200, 16], [224, 44], [224, 134]], (x, y) => { const c = arco(x, y); return x > 176 ? mezcla(c, "#0e0c14", 0.2 + (x - 176) / 160) : c; });
    rellena(k, [[150, 16], [170, 16], [166, 30], [154, 30]], (x, y) => rampa(["#8a8498", "#7a7488", "#6a6478"], (x - 150) / 20, x, y)); k.R(150, 16, 20, 1, "#a8a2b8");
    k.poli([[112, 134], [112, 50], [130, 28], [190, 28], [208, 50], [208, 134]], "#08060c");
    for (let i = 0; i < 5; i++) { const a = 1 - i / 5, w = 92 * a, h = 100 * a; rellena(k, [[160 - w / 2, 134 - i * 8], [160 - w / 2, 134 - i * 8 - h * 0.72], [160 - w * 0.3, 134 - i * 8 - h], [160 + w * 0.3, 134 - i * 8 - h], [160 + w / 2, 134 - i * 8 - h * 0.72], [160 + w / 2, 134 - i * 8]], (x, y) => (Det.trama(x, y) < 0.1 + i * 0.1 ? "#2a1a48" : "#08060c")); }
    k.halo(160, 100, 26, 24, "#6a3fa8", 0.5); k.elipse(160, 100, 5, 7, "#c8a8f8"); k.elipse(160, 99, 2, 3, "#f0e4ff");
    L.push({ x: 160, y: 100, r: 64, ry: 52, col: "#8a5ad8", f: 0.35 });
    for (let t = 0; t < 110; t++) { const x = 104 + t * 1.02, y = 13 + Math.sin(t / 6) * 5; bola(k, x, y, 3, 3, (px, py) => (((px + py) % 4 < 1) ? "#3f5a42" : rampa(["#8aaa8a", "#7a9a7a", "#5a7a5a", "#46624a"], 0.4 + (py - y) / 6, px, py))); }
    for (let t = 0; t < 110; t += 3) k.P(104 + t * 1.02, 11 + Math.sin(t / 6) * 5, "#b4d0aa");
    esfera(k, 218, 14, 8, 6, ["#8aaa8a", "#7a9a7a", "#5a7a5a", "#46624a"]); k.R(219, 11, 3, 2, "#e8c84a"); k.R(220, 11, 1, 2, "#26262a"); trazo(k, [[226, 16], [232, 18]], "#c0392b", 1); k.P(233, 17, "#c0392b"); k.P(233, 19, "#c0392b");
    [[84, 66], [236, 66]].forEach(([x, y]) => { k.R(x - 1, y, 3, 16, "#5a3a22"); k.R(x - 3, y - 1, 7, 2, "#7a6a4a"); k.R(x - 3, y + 6, 7, 1, "#3a3430"); k.halo(x, y - 6, 18, 18, "#ff9a3a", 0.26); k.llama(x, y, 0.55); L.push({ x, y: y - 4, r: 42, ry: 38, col: "#ff9a4a", f: 0.55 }); });
    [[10, 46], [264, 46]].forEach(([x, w]) => {
      k.R(x, 62, w, 72, "#0c0a12"); k.alfa(0.5, () => k.R(x + 4, 104, w - 8, 28, "#1a1624"));
      trazo(k, [[x + 10, 66], [x + 15, 84], [x + 11, 100]], "#4a4650", 1); k.R(x + 9, 100, 4, 3, "#5a5660");
      for (let b = x + 3; b < x + w; b += 8) cilindro(k, b, 62, 3, 72, ["#8a8478", "#6a6458", "#4a443e", "#2e2a26"]);
      k.R(x, 62, w, 4, "#57504a"); k.R(x, 62, w, 1, "#8a8478"); k.R(x, 96, w, 3, "#57504a"); k.R(x, 96, w, 1, "#7a7468");
    });
    [[108, 118], [204, 118]].forEach(([x, y]) => { k.R(x - 5, y + 14, 12, 2, "#3a3446"); k.R(x - 5, y, 11, 14, "#3a7a5a"); k.R(x - 5, y, 2, 14, "#7ae8b0"); k.R(x + 4, y, 2, 14, "#2a5a42"); k.R(x - 6, y - 2, 13, 2, "#7a7468"); k.elipse(x, y + 7, 2, 3, "#c8e8d0"); k.P(x - 1, y + 5, "#f4fff8"); L.push({ x, y: y + 7, r: 18, ry: 14, col: "#7ae8b0", f: 0.3 }); });
    T.rect(k, 0, 132, W, 48, (x, y) => {
      const f = Math.pow((y - 132) / 48, 0.8) * 7, fila = Math.floor(f), w = 44 + fila * 8, off = (fila % 2) * 22, col = Math.floor((x + off) / w);
      return f - fila < 0.08 || (x + off) % w < 1 ? "#221e2c" : rampa(["#4e485c", "#443e52", "#3a3446", "#302a3c"], 0.2 + hash(fila, col, 1805) * 0.5 + (fbm(x * 0.2, y * 0.3, 1806) - 0.5) * 0.3, x, y);
    });
    rellena(k, [[116, 182], [204, 182], [176, 132], [144, 132]], (x, y) => ((x + y * 3) % 31 < 2 ? "#3a3446" : rampa(["#5a5468", "#4e485c", "#443e52"], 0.3 + (fbm(x * 0.2, y * 0.3, 1807) - 0.5) * 0.4, x, y)));
    [[134, 150, 16, 2], [186, 164, 20, 3], [62, 170, 14, 2]].forEach(([x, y, a, b]) => { k.elipse(x, y, a, b, "#2a2040"); k.elipse(x - 2, y, a * 0.6, b * 0.5, "#5a3f8a"); k.P(x - 4, y, "#c8a8f8"); });
    k.alfa(0.2, () => k.elipse(160, 136, 40, 5, "#6a3fa8"));
    [[66, 170], [254, 164]].forEach(([x, y]) => { for (let a = 0; a < 8; a += 0.3) { const r = 1 + a * 0.9; k.R(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.7, 3, 2, "#46624a"); k.P(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.7 - 1, "#6a8a6a"); } k.R(x + 8, y - 4, 2, 2, "#e8c84a"); });
    luces(k, L);
  }
  N[18] = ["La guarida de Irochomura", "Los túneles de piedra bajo tierra, con antorchas y una serpiente tallada en el arco", guarida,
    { cielo: "propio", fuerza: 0.06, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#6a3fa8", "#2a1a48", "#c8a8f8", "#7ae8b0", "#3a7a5a", "#c8e8d0", "#f0e4ff", "#f4fff8"] }];

  const PG = ["#7a7784", "#6a6774", "#5a5764", "#4a4754", "#3a3744"], TG = ["#4f4c5c", "#3f3c4a", "#2f2c3a", "#221f2c", "#16131e"];
  function ichuha(k) {
    const { h } = Det.cuando(k), lit = encendido(k), L = [];
    k.banda(["#141a3a", "#1f2a56", "#2f3a6a"], 0, 112);
    for (let i = 0; i < 40; i++) k.crudo(hash(i, 1, 2201) * W, hash(i, 2, 2201) * 70, 1, 1, i % 5 ? "#c8d4ff" : "#ffffff");
    if (h >= 3 && h <= 5) { const s = Horas.sol(h); k.halo(s.x, s.y, s.r + 10, s.r + 10, "#7a1f2a", 0.5); for (let y = -s.r; y <= s.r; y++) { const w = Math.sqrt(s.r * s.r - y * y); k.crudo(s.x - w, s.y + y, 2 * w, 1, y > 4 ? "#a82a30" : "#d83a3a"); } }
    const abanico = (x, y, r) => { k.elipse(x + 1, y + 1, r, r, "#16131e"); k.elipse(x, y, r, r, "#efe6d0"); for (let j = -r; j <= 0; j++) { const w = Math.sqrt(r * r - j * j); k.R(x - w, y + j, 2 * w, 1, j < -r * 0.72 ? "#d84a3a" : "#c0392b"); } k.elipse(x - r * 0.35, y + r * 0.4, r * 0.22, r * 0.16, "#fffaf0"); k.R(x - 1, y + r, 3, r, "#efe6d0"); k.R(x + 1, y + r, 1, r, "#bdb3a0"); };
    [[72, 116, 30, 22], [218, 116, 30, 22]].forEach(([x, b, w, hh], i) => K.casaK(k, x, b, w, hh, { techo: TG, pared: PG, s: 2202 + i }).forEach(([vx, vy]) => L.push({ x: vx, y: vy, r: 10, ry: 8, col: "#ffd27a", f: lit * 0.6 })));
    T.rect(k, 96, 72, 128, 54, madera(["#66636f", "#5a5764", "#4e4b58", "#45424e", "#2e2b38"], { paso: 16, vertical: true, largo: 99, s: 2204 }));
    k.R(96, 72, 128, 3, "#6a6774"); k.alfa(0.3, () => k.R(96, 75, 128, 3, "#0e0c14"));
    T.tejadoJ(k, 160, 72, 156, 16, TG, 2205, 4);
    abanico(160, 92, 15);
    T.rect(k, 148, 112, 24, 14, madera(["#2a2834", "#221f2c", "#1a1824", "#141220", "#0e0c14"], { paso: 3, vertical: true, largo: 99, s: 2206 })); k.R(148, 112, 24, 1, "#3a3744");
    [[-8, 128, 50, 38], [42, 126, 44, 30], [234, 126, 44, 30], [278, 128, 50, 38]].forEach(([x, b, w, hh], i) => K.casaK(k, x, b, w, hh, { techo: TG, pared: PG, s: 2207 + i, noren: "#c0392b" }).forEach(([vx, vy]) => L.push({ x: vx, y: vy, r: 12, ry: 9, col: "#ffd27a", f: lit * 0.55 })));
    abanico(20, 96, 7); abanico(300, 96, 7);
    T.rect(k, 0, 124, W, 56, (x, y) => {
      const f = Math.pow((y - 124) / 56, 0.75) * 12, fila = Math.floor(f), w = 10 + fila * 2.2, off = (fila % 2) * w * 0.5, col = Math.floor((x + off) / w), u = x + off - col * w;
      if (u < 1 || f - fila < 0.09) return "#2e2b38";
      return rampa(["#6e6b78", "#625f6c", "#565360", "#4a4754"], 0.12 + hash(fila, col, 2211) * 0.6 + (u < 2 || f - fila < 0.22 ? -0.14 : 0), x, y);
    });
    k.alfa(0.3, () => k.R(0, 126, W, 3, "#14121c"));
    [[82, 110], [238, 110]].forEach(([x, y]) => {
      k.R(x, y, 2, 26, "#221f2c"); k.R(x - 3, y, 8, 1, "#221f2c"); farolillo(k, x + 1, y + 5, "#ff8a5a", 4); k.R(x - 2, y + 3, 7, 1, "#c0502a"); k.R(x - 2, y + 7, 7, 1, "#c0502a"); brillo(k, x + 1, y + 5, 20, 18, "#ff8a5a", 0.6);
      L.push({ x: x + 1, y: y + 6, r: 34, ry: 28, col: "#ff8a5a", f: 0.5 });
      k.alfa(0.4, () => { k.R(x - 1, 146, 4, 1, "#ff8a5a"); k.R(x, 150, 2, 1, "#ff8a5a"); k.R(x - 2, 154, 5, 1, "#c0502a"); k.R(x, 158, 2, 1, "#c0502a"); });
    });
    catenaria(k, 42, 96, 96, 92, 5, "#221f2c"); catenaria(k, 224, 92, 278, 96, 5, "#221f2c");
    sombraE(k, 106, 143, 8, 2, 0.45); barril(k, 100, 142, 11, 14, ["#6a5a5a", "#54464a", "#3e343a", "#2a2428"]);
    sombraE(k, 215, 147, 9, 2, 0.45); caja(k, 208, 146, 14, 11, ["#6a6774", "#4a4754", "#3a3744"]); caja(k, 211, 135, 9, 7, ["#5a5764", "#45424e", "#2e2b38"]);
    [[120, 164], [186, 150], [230, 170], [146, 140], [262, 156]].forEach(([x, y], i) => { k.R(x, y, 3, 1, i % 2 ? "#7a6a4a" : "#8a5a3a"); k.P(x + 1, y + 1, "#5a4a3a"); });
    luces(k, L);
  }
  N[22] = ["El barrio Ichuha", "Las calles vacías bajo la luna, con el abanico de los Ichuha en las paredes", ichuha, { fuego: ["#ff8a5a", "#c0502a"], ven: ["#ffd27a"] }];
})();

(function () {
  const { rampa, rellena, esfera, cilindro, nubarron, cirros, espuma, montana, pena, camino, matas, helecho, caja, brillo } = Det;
  const { bola, mezcla, hash, fbm, trazo, piedra, pase, sombraE, luces, bruma, pluma } = Det6, sombraP = Det6.sombra;
  const T = window.P15;
  const W = 320;
  window.SitiosIt27 = window.SitiosIt27 || {};
  const N = (window.SitiosIt27.ninjas = window.SitiosIt27.ninjas || {});
  const PRADO = ["#a8e080", "#8cc86a", "#74b058", "#5e9a48", "#48803a"];

  function myoboku(k) {
    k.banda(["#7fd0c0", "#a8e6c8", "#dcf2c8"], 0, 104);
    const NU = ["#ffffff", "#e4f6e8", "#bce4cc"];
    nubarron(k, -16, 30, 76, 14, NU); nubarron(k, 240, 22, 86, 16, NU); cirros(k, 4, 4, 26, "#f4fff8");
    const M1 = ["#6cc09a", "#4f9a7a", "#3f8a68", "#2f7458"];
    montana(k, 70, 116, 200, 76, { roca: M1 }); montana(k, 256, 116, 210, 82, { roca: M1 }); montana(k, 160, 116, 180, 54, { roca: ["#57a884", "#3f8a68", "#2f7458", "#246048"] });
    bruma(k, 70, 116, "#e8f8ec", 0.35);
    [[52, 116, 26, 78], [106, 116, 18, 52], [214, 116, 20, 56], [266, 116, 28, 84]].forEach(([x, b, w, h], i) => rellena(k, [[x, b], [x + w * 0.36, b - h * 0.6], [x + w * 0.6, b - h], [x + w * 0.74, b - h * 0.5], [x + w, b]],
      (px, py) => rampa(["#ecd894", "#d8c080", "#b8a060", "#94804a", "#76663a"], ((px - x) / w) * 0.85 + (Math.sin(py / 2.4 + px / 7) > 0.75 ? 0.18 : 0) + (fbm(px * 0.2, py * 0.1, 901 + i) - 0.5) * 0.2, px, py)));
    T.prado(k, 116, PRADO, 902, { y1: 150, n: 200 });
    matas(k, 124, 150, 18, ["#3f8a4a", "#68a84e", "#a0d878"]);
    for (let y = 50; y < 130; y++) { const a = 13 + (y - 50) * 0.12; for (let x = Math.round(161 - a); x <= 161 + a; x++) { const u = (x - 161) / a; k.P(x, y, Math.abs(u) > 0.88 ? "#b8a050" : rampa(["#fff6c0", "#f2e29a", "#d8c070", "#b8a050"], (Math.sin(x * 1.3 + y / 16) + 1) * 0.42 + Math.abs(u) * 0.2, x, y)); } }
    for (let i = 0; i < 18; i++) { const x = 150 + hash(i, 1, 903) * 22, y = 52 + hash(i, 2, 903) * 74; trazo(k, [[x, y], [x, y + 5 + hash(i, 3, 903) * 6]], "#fffbe0", 1); }
    k.agua(128, 150, ["#d8c070", "#c9b060", "#b89c4e"], "#fff2b0", 70); espuma(k, 130, 120, 204, "#fff8d0");
    bruma(k, 118, 140, "#fff4c8", 0.4, { x0: 120, x1: 204 });
    const seta = (x, b, r, h, c, s) => {
      sombraE(k, x + 2, b + 1, r * 0.8, 2.5, 0.4);
      cilindro(k, x - r * 0.22, b - h, r * 0.44, h, ["#fff8e4", "#efe2c0", "#cfc29c", "#a89c78"], 0.3);
      k.R(x - r * 0.3, b - h + 8, r * 0.6, 2, "#cfc29c"); k.R(x - r * 0.3, b - h + 8, r * 0.6, 1, "#fff4dc");
      bola(k, x, b - h + 1, r * 0.92, r * 0.18, () => "#c8b48a");
      bola(k, x, b - h, r, r * 0.55, (px, py) => (py > b - h + r * 0.24 ? null : rampa(c, 0.15 + ((px - x) / r) * 0.38 + ((py - b + h) / (r * 0.55)) * 0.3 + 0.2 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.12, px, py)));
      for (let i = 0; i < 6; i++) esfera(k, x - r * 0.75 + i * r * 0.3, b - h - r * 0.2 + (i % 2) * r * 0.18, r * 0.1 + 1, r * 0.08 + 1, ["#fffaec", "#f2e6c8", "#d8c8a4"]);
      k.alfa(0.35, () => trazo(k, [[x - r * 0.7, b - h - r * 0.3], [x - r * 0.3, b - h - r * 0.48]], "#ffffff", 1));
    };
    const NA = ["#ffb08a", "#ff9a6a", "#e8704a", "#c8502a"], OC = ["#ffd88a", "#ffc86a", "#f2a84a", "#c8842a"], RS = ["#f89ab4", "#f27a9a", "#d84a6a", "#a83050"];
    seta(30, 136, 26, 60, NA, 904); seta(96, 132, 18, 38, OC, 905); seta(228, 132, 22, 50, NA, 906); seta(292, 136, 20, 40, RS, 907); seta(62, 148, 12, 18, RS, 908); seta(260, 150, 11, 16, OC, 909);
    T.prado(k, 150, PRADO, 910, { flores: { n: 46, cols: ["#ffffff", "#f27a9a", "#f2d24a"] }, n: 220 });
    const sapo = (x, b, e, s) => {
      sombraE(k, x + 2, b + 1, 11 * e, 2.5, 0.45);
      T.rect(k, x - 10 * e, b - 4, 20 * e, 4, piedra(["#a8a894", "#949480", "#7e7e6a", "#686856", "#525244"], { tx: 6, ty: 2, s }));
      bola(k, x, b - 11 * e, 11 * e, 9 * e, (px, py) => { const c = rampa(["#c4c4b0", "#a8a894", "#8c8c78", "#707060"], 0.25 + ((px - x) / (11 * e)) * 0.4 + ((py - b + 11 * e) / (9 * e)) * 0.2, px, py); return fbm(px * 0.4, py * 0.4, s) > 0.66 ? mezcla(c, "#5a7a4a", 0.5) : c; });
      [-6, 6].forEach((d) => { esfera(k, x + d * e, b - 19 * e, 3.2 * e, 3 * e, ["#c4c4b0", "#a8a894", "#7e7e6a"]); k.R(x + d * e - 1, b - 20 * e, 2, 2, "#3a3a34"); });
      k.R(x - 6 * e, b - 10 * e, 12 * e, 1, "#4a4a3e"); k.R(x - 4 * e, b - 9 * e, 8 * e, 1, "#8c8c78");
    };
    sapo(92, 158, 1, 911); sapo(232, 160, 1.1, 912);
    camino(k, 150, 180, () => 160, (f) => 12 + f * 18, "#b8a070", "#d8c088", "#c4ac74");
    for (let i = 0; i < 12; i++) { const y = 154 + hash(i, 1, 913) * 24, a = 12 + ((y - 150) / 30) * 18, x = 160 - a + hash(i, 2, 913) * 2 * a; k.R(x, y, 2, 1, "#9a8458"); k.P(x, y - 1, "#ecd8a8"); }
    helecho(k, 8, 178, 26, "#3f8a4a", "#2a6a35"); helecho(k, 314, 178, 28, "#3f8a4a", "#2a6a35"); helecho(k, 128, 178, 14, "#4f9a4a", "#2a6a35"); helecho(k, 196, 178, 16, "#4f9a4a", "#2a6a35");
  }
  N[9] = ["El monte Myuboko", "La tierra de los sapos, con setas gigantes y cascadas de aceite", myoboku, { tinte: 0.55 }];

  const HIERRO = ["#6a727e", "#5a626e", "#4a525e", "#3f4652", "#343a46", "#2a303a"];
  function ame(k) {
    const L = [];
    k.banda(["#3f4756", "#565e6e", "#727a88"], 0, 128);
    nubarron(k, -24, 10, 170, 12, ["#6a7484", "#545e6e", "#3f4756"]); nubarron(k, 140, 6, 190, 12, ["#6a7484", "#545e6e", "#3f4756"]);
    [[20, 18, 76], [60, 14, 50], [100, 16, 88], [204, 16, 84], [244, 14, 56], [286, 18, 70]].forEach(([x, w, h], i) => { T.rect(k, x, 124 - h, w, h, (px, py) => rampa(["#66707e", "#5a6270", "#4e5664"], 0.2 + ((px - x) / w) * 0.5, px, py)); for (let y = 124 - h + 6; y < 120; y += 9) for (let v = x + 3; v < x + w - 3; v += 6) if (hash(v, y, 2001 + i) > 0.45) k.R(v, y, 2, 3, "#9aa0a8"); });
    bruma(k, 40, 124, "#8a94a4", 0.35);
    [[0, 30, 92], [34, 24, 64], [62, 26, 110], [234, 26, 104], [264, 24, 70], [292, 30, 96]].forEach(([x, w, h], i) => {
      cilindro(k, x, 128 - h, w, h, HIERRO.slice(0, 4), 0.2);
      for (let y = 128 - h + 3; y < 128; y += 10) { k.R(x, y, w, 1, "#2a303a"); for (let v = x + 2; v < x + w; v += 5) k.P(v, y + 1, "#7a828e"); }
      pase(k, (px, py, d, j) => { if (fbm(px * 0.15, py * 0.08, 2002 + i) > 0.68) { d[j] += 22; d[j + 1] += 6; d[j + 2] -= 8; } }, x, 128 - h, x + w, 128);
      k.R(x - 1, 128 - h - 2, w + 2, 3, "#2a303a"); k.R(x + w * 0.3, 128 - h - 10, 2, 9, "#2a303a"); k.R(x + w * 0.7, 128 - h - 6, 2, 5, "#2a303a"); k.crudo(x + w * 0.3, 128 - h - 11, 2, 1, "#e85a4a");
      for (let y = 128 - h + 6; y < 120; y += 12) for (let v = x + 5; v < x + w - 5; v += 8) { k.R(v, y, 3, 5, "#ffd27a"); k.R(v, y + 5, 4, 1, "#2a303a"); if (hash(v, y, 2003) < 0.25) L.push({ x: v + 1, y: y + 2, r: 8, ry: 6, col: "#ffd27a", f: 0.35 }); }
    });
    cilindro(k, 116, 22, 88, 106, HIERRO.slice(0, 4), 0.25);
    bola(k, 160, 46, 38, 32, (x, y) => rampa(HIERRO, 0.15 + ((x - 160) / 38) * 0.4 + ((y - 46) / 32) * 0.3 + (fbm(x * 0.15, y * 0.15, 2004) - 0.5) * 0.15, x, y));
    for (let a = 0; a < 6.3; a += 0.4) k.P(160 + Math.cos(a) * 36, 46 + Math.sin(a) * 30, "#7a828e");
    [146, 174].forEach((ex) => { k.elipse(ex, 42, 8, 7, "#1f242e"); k.elipse(ex, 42, 3, 3, "#e8e0cc"); for (let a = 0; a < 6.3; a += 0.5) k.P(ex + Math.cos(a) * 6, 42 + Math.sin(a) * 5, "#8a94a4"); k.P(ex - 1, 41, "#ffffff"); });
    for (let i = 0; i < 7; i++) { const x = 134 + i * 8, l = 14 + (i % 2) * 8 - Math.abs(3 - i); cilindro(k, x, 60, 6, l, ["#7a8494", "#5a6474", "#3a4250", "#2a303a"]); k.R(x, 60 + l - 2, 6, 2, "#2a303a"); k.R(x + 1, 60 + l - 1, 4, 1, "#9aa4b4"); }
    for (let y = 96; y < 126; y += 10) for (let x = 124; x < 200; x += 12) { k.R(x, y, 6, 6, "#ffd27a"); L.push({ x: x + 3, y: y + 3, r: 10, ry: 8, col: "#ffd27a", f: 0.3 }); }
    k.R(148, 108, 24, 20, "#1f242e"); k.elipse(160, 108, 12, 8, "#1f242e");
    [[92, 76, 116, 88], [204, 80, 234, 70], [24, 60, 62, 74], [258, 66, 292, 58]].forEach(([a, b, c, d]) => { trazo(k, [[a, b], [c, d]], "#2a303a", 4); trazo(k, [[a, b - 1], [c, d - 1]], "#6a7484", 1); for (let t = 0.2; t < 1; t += 0.3) k.R(a + (c - a) * t - 1, b + (d - b) * t - 2, 3, 4, "#3a4250"); });
    T.rect(k, 0, 106, W, 4, (x, y) => rampa(["#7a8290", "#5e6674", "#46505c"], (y - 106) / 4, x, y)); T.rect(k, 0, 118, W, 3, (x, y) => rampa(["#6a727e", "#525a66"], (y - 118) / 3, x, y));
    for (let x = 12; x < W; x += 23) { k.R(x, 100, 3, 22, "#46505c"); k.R(x, 100, 1, 22, "#6a727e"); }
    T.rect(k, 0, 128, W, 52, (x, y) => { const f = Math.pow((y - 128) / 52, 0.8) * 8, fila = Math.floor(f), w = 32 + fila * 5, off = (fila % 2) * 16, col = Math.floor((x + off) / w); return f - fila < 0.08 || (x + off) % w < 1 ? "#343a42" : rampa(["#525860", "#4a5058", "#42484f", "#3a4048"], 0.2 + hash(fila, col, 2005) * 0.5, x, y); });
    [[110, 150, 44, 5], [196, 166, 58, 6], [60, 170, 38, 4], [270, 146, 32, 4]].forEach(([x, y, a, b]) => {
      k.elipse(x, y, a, b, "#6a7484"); k.elipse(x - 4, y, a * 0.6, b * 0.5, "#8a94a4");
      for (let i = 0; i < 5; i++) k.R(x - a * 0.6 + hash(i, x, 2006) * a * 1.2, y - 1 + hash(i, y, 2006) * 2, 5, 1, "#ffd27a");
      for (let i = 0; i < 4; i++) { const sx = x - a * 0.5 + hash(i, 7, x) * a; k.P(sx, y - 2, "#c8d0dc"); k.P(sx - 1, y - 1, "#c8d0dc"); k.P(sx + 1, y - 1, "#c8d0dc"); }
    });
    for (let i = 0; i < 300; i++) { const x = hash(i, 1, 2007) * W, y = hash(i, 2, 2007) * 176, l = 3 + hash(i, 3, 2007) * 3; k.R(x, y, 1, l, i % 4 ? "#9aa4b4" : "#c8d0dc"); k.P(x - 1, y + l, "#9aa4b4"); }
    k.niebla(96, 132, "#8a94a4", 0.14);
    luces(k, L);
  }
  N[20] = ["Emagakure", "La aldea de la lluvia, con sus torres de hierro y sus tuberías", ame, { tinte: 0.85, ven: ["#ffd27a"] }];

  function monteH(k) {
    const ROCA = ["#d0b890", "#c0a57e", "#a68a64", "#8c7250", "#74603f"], OSC = "#54402a";
    const PELO = [["#a8885e", "#8a6d4a", "#6a5236"], ["#f0ece0", "#d8d2c4", "#b4ae9e"], ["#8a6c50", "#6b5138", "#4e3a28"], ["#e8c050", "#c9a03c", "#a07c28"], ["#f0d898", "#d8c080", "#b09a5c"]];
    rellena(k, [[-4, 136], [-4, 64], [36, 48], [110, 40], [210, 38], [284, 50], [324, 64], [324, 136]], (x, y) => rampa(ROCA, 0.25 + 0.2 * Math.sin(y / 3.4 + Math.sin(x / 19) * 2.2) + (fbm(x * 0.06, y * 0.12, 2111) - 0.5) * 0.35 + (Math.sin(x / 6.3 + y / 11) > 0.82 ? 0.2 : 0), x, y));
    rellena(k, [[-4, 64], [36, 48], [110, 40], [210, 38], [284, 50], [324, 64], [324, 70], [284, 57], [210, 45], [110, 47], [36, 55], [-4, 71]], (x, y) => (y % 3 ? "#d2ba92" : "#e2cca4"));
    [50, 104, 158, 212, 266].forEach((x, i) => {
      bola(k, x + 1, 81, 20, 26, () => OSC);
      bola(k, x, 80, 19, 25, (px, py) => rampa(ROCA, 0.1 + ((px - x) / 19) * 0.3 + ((py - 80) / 25) * 0.34 + 0.18 + (fbm(px * 0.2, py * 0.2, 2112 + i) - 0.5) * 0.12, px, py));
      const P = PELO[i];
      rellena(k, [[x - 20, 72 - i], [x - 12, 58 - i], [x, 52 - i], [x + 12, 58 - i], [x + 20, 72 - i], [x + 14, 66], [x, 62], [x - 14, 66]], (px, py) => P[Math.round(px * 0.7 + py * 0.3) % 3 === 0 ? 2 : px < x - 4 ? 0 : 1]);
      k.R(x - 11, 74, 8, 2, OSC); k.R(x + 3, 74, 8, 2, OSC); k.R(x - 10, 77, 5, 2, OSC); k.R(x + 5, 77, 5, 2, OSC); k.R(x - 1, 78, 3, 9, OSC); k.R(x - 2, 87, 5, 1, OSC); k.R(x - 7, 94, 14, 2, OSC); k.R(x - 15, 98, 30, 1, OSC);
      k.R(x, 78, 1, 9, "#e2cca4");
      sombraP(k, [[x + 12, 62], [x + 20, 80], [x + 15, 102], [x + 6, 106]], 0.25, { borde: 2 });
      if (i % 2 === 0) trazo(k, [[x - 8 + i, 60], [x - 4 + i, 72], [x - 9 + i, 84], [x - 6 + i, 96]], OSC, 1);
    });
  }
  function destruida(k) {
    k.banda(["#7f96ac", "#a0b0bc", "#ccd0cc"], 0, 112);
    const NU = ["#d8dcde", "#c0c4ca", "#9ca2ac"];
    nubarron(k, -20, 30, 110, 16, NU); nubarron(k, 220, 24, 120, 18, NU);
    monteH(k);
    const HUMO = ["#a8a4a0", "#8c8884", "#706c68", "#545050"];
    pluma(k, 90, 122, 64, 18, HUMO, { s: 2101, viento: 0.3 }); pluma(k, 240, 120, 68, 20, HUMO, { s: 2102, viento: -0.3 });
    T.rect(k, 0, 122, W, 58, T.tex(["#b8a288", "#a08a70", "#8f7a60", "#7a664e"], { s: 2103, y0: 122, alto: 58 }));
    bola(k, 160, 164, 210, 46, (x, y) => { const q = Math.hypot((x - 160) / 210, (y - 186) / 66); return rampa(["#b09a80", "#a08a70", "#8a7660", "#75634f", "#645441", "#54463a"], 0.1 + (1 - q) * 1.15 + (Math.sin(q * 38) > 0.86 ? 0.12 : 0) + (fbm(x * 0.1, y * 0.2, 2104) - 0.5) * 0.2, x, y); });
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * 3.14 + 3.14, x0 = 160 + Math.cos(a) * 60, y0 = 178 + Math.sin(a) * 24, xm = 160 + Math.cos(a + 0.05) * 110, ym = 180 + Math.sin(a) * 36;
      trazo(k, [[x0, y0], [xm, ym], [160 + Math.cos(a) * 170, 182 + Math.sin(a) * 50]], "#54463a", 1); trazo(k, [[x0 + 1, y0], [xm + 1, ym]], "#c8b498", 1);
    }
    const ruina = (x, b, w, h, s) => {
      rellena(k, [[x, b], [x, b - h], [x + w * 0.3, b - h - 4], [x + w * 0.5, b - h + 6], [x + w * 0.8, b - h + 2], [x + w, b - h + 12], [x + w, b]], (px, py) => rampa(["#e0d0b4", "#c8b8a0", "#b0a088", "#988870"], 0.15 + ((px - x) / w) * 0.4 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.3, px, py));
      k.R(x + w * 0.2, b - h + 10, w * 0.26, h * 0.3, "#3a3028"); k.R(x + w * 0.2, b - h + 10, w * 0.26, 1, "#6b4a30");
      trazo(k, [[x + 2, b - h + 3], [x + w, b - 4]], "#6b4a30", 2); trazo(k, [[x + 2, b - h + 2], [x + w, b - 5]], "#8a6440", 1);
      for (let i = 0; i < 4; i++) k.R(x + hash(i, 1, s) * w, b - 2 - hash(i, 2, s) * 3, 3, 2, ["#a8402e", "#7e2e20"][i % 2]);
      sombraE(k, x + w / 2 + 3, b + 1, w * 0.6, 2, 0.35);
    };
    ruina(10, 132, 34, 22, 2105); ruina(58, 126, 26, 16, 2106); ruina(224, 124, 30, 16, 2107); ruina(272, 132, 42, 24, 2108);
    [[8, 134, 44, 16], [60, 128, 26, 10], [216, 126, 34, 12], [270, 134, 50, 18], [-6, 166, 44, 16], [296, 172, 38, 14], [94, 138, 22, 8], [200, 142, 26, 9]].forEach(([x, b, w, h]) => { sombraE(k, x + w / 2 + 2, b + 1, w * 0.55, 2, 0.35); pena(k, x, b, w, h, ["#b8b0a0", "#a39888", "#8d8478", "#6e665c"]); });
    [[36, 122], [246, 120]].forEach(([x, b]) => { trazo(k, [[x, b], [x + 6, b - 20]], "#6b4a30", 2); trazo(k, [[x + 14, b], [x + 8, b - 14]], "#6b4a30", 2); k.poli([[x - 4, b - 14], [x + 20, b - 20], [x + 16, b - 12]], "#8a2f22"); k.poli([[x - 2, b - 14], [x + 14, b - 18], [x + 12, b - 15]], "#b5432f"); });
    sombraE(k, 128, 161, 12, 2, 0.4); cilindro(k, 118, 150, 15, 10, ["#d0dae0", "#b8c4cc", "#8c9aa4", "#6c7a84"]); k.elipse(133, 155, 3, 5, "#6c7a84"); k.elipse(133, 155, 2, 4, "#3a444c"); k.R(118, 153, 15, 1, "#5a6670");
    for (let i = 0; i < 30; i++) { const x = hash(i, 1, 2109) * W, y = 128 + hash(i, 2, 2109) * 50; k.R(x, y, 2, 1, "#6e665c"); k.P(x, y - 1, "#c8c0b0"); }
    k.niebla(116, 150, "#d8d0c4", 0.22);
  }
  N[21] = ["Kanoho destruida", "El gran cráter que deja Pian, con la montaña de los Hakoge al fondo", destruida, { tinte: 0.35, ven: [] }];

  function campamento(k) {
    const L = [];
    k.banda(["#101a3a", "#1f2a56", "#3a4a7a"], 0, 114); k.estrellas(80, 70);
    const NU = ["#3a4a72", "#2a3660", "#1f2a50"]; nubarron(k, -20, 40, 90, 10, NU); nubarron(k, 240, 30, 96, 12, NU);
    const MO = ["#2a3660", "#1f2a50", "#18224a", "#121a3a"];
    montana(k, 60, 114, 190, 44, { roca: MO }); montana(k, 262, 114, 200, 50, { roca: MO });
    T.prado(k, 112, ["#7a8a6a", "#6a7a5a", "#5a6a4e", "#4a5a40", "#3a4a34"], 2501, { n: 160 });
    const tienda = (x, b, w, h, c, o, s) => {
      sombraE(k, x + w / 2 + 2, b + 1, w * 0.62, 2.5, 0.4);
      rellena(k, [[x, b], [x + w / 2, b - h], [x + w, b]], (px, py) => rampa(c, 0.15 + ((px - x) / w) * 0.55 + (fbm(px * 0.3, py * 0.3, s) - 0.5) * 0.12, px, py));
      k.poli([[x + w / 2, b - h], [x + w, b], [x + w * 0.6, b]], o);
      trazo(k, [[x + w * 0.25, b], [x + w / 2, b - h]], o, 1); trazo(k, [[x + w * 0.75, b], [x + w / 2, b - h]], o, 1);
      k.poli([[x + w * 0.34, b], [x + w * 0.46, b - h * 0.6], [x + w * 0.56, b]], "#ffd27a"); k.poli([[x + w * 0.4, b], [x + w * 0.46, b - h * 0.4], [x + w * 0.52, b]], "#fff0b0");
      L.push({ x: x + w * 0.46, y: b - 2, r: w * 0.6, ry: 6, col: "#ffb04a", f: 0.45 });
      trazo(k, [[x + w / 2, b - h], [x + w / 2, b - h - 4]], "#3a3a44", 1);
      trazo(k, [[x - 4, b + 1], [x + w * 0.2, b - h * 0.45]], "#c8bea8", 1); trazo(k, [[x + w + 4, b + 1], [x + w * 0.8, b - h * 0.45]], "#c8bea8", 1);
      k.R(x - 5, b, 2, 2, "#6a5040"); k.R(x + w + 4, b, 2, 2, "#6a5040");
    };
    const C1 = ["#7a7a62", "#6a6a5a", "#5a5a4a", "#4a4a3e"], C2 = ["#6a7a5a", "#5a6a4a", "#4a5a3e", "#3a4a32"];
    [[-2, 122, 40, 28], [44, 120, 34, 24], [84, 118, 30, 22], [206, 118, 30, 22], [242, 120, 34, 24], [280, 122, 42, 28]].forEach(([x, b, w, h], i) => tienda(x, b, w, h, i % 2 ? C2 : C1, "#3f4a36", 2502 + i));
    [[30, 142, 44, 28], [244, 144, 46, 30]].forEach(([x, b, w, h], i) => tienda(x, b, w, h, ["#8a8a72", "#7a7a62", "#6a6a52", "#5a5a46"], "#4f5a44", 2510 + i));
    k.R(158, 22, 3, 100, "#3a3a44"); k.R(158, 22, 1, 100, "#6a6a78"); k.R(150, 22, 18, 2, "#3a3a44"); k.elipse(159, 21, 2, 2, "#c9a03c");
    for (let i = 0; i < 46; i++) { const o = Math.round(Math.sin(i / 5) * 1.5); k.R(161 + i, 26 + o, 1, 30, rampa(["#f8f2e4", "#efe6d0", "#d8cfba", "#c0b6a0"], 0.15 + (Math.cos(i / 5) + 1) * 0.3, 161 + i, 26)); }
    k.R(170, 34, 28, 3, "#c0392b"); k.R(182, 30, 3, 12, "#c0392b"); k.R(172, 42, 26, 2, "#c0392b"); k.R(176, 44, 2, 6, "#c0392b"); k.R(186, 44, 2, 7, "#c0392b"); k.R(194, 44, 2, 6, "#c0392b");
    [[96, 132], [220, 134]].forEach(([x, b]) => { sombraE(k, x + 12, b + 1, 14, 2, 0.4); caja(k, x, b, 13, 10, ["#9a9a7a", "#7a7a5a", "#5a5a40"]); caja(k, x + 13, b, 10, 8, ["#9a9a7a", "#7a7a5a", "#5a5a40"]); caja(k, x + 4, b - 10, 9, 7, ["#8a8a6a", "#6a6a50", "#4a4a38"]); });
    [[116, 156], [206, 150]].forEach(([x, y]) => {
      for (let a = 0; a < 6.3; a += 0.7) esfera(k, x + Math.cos(a) * 9, y + 1 + Math.sin(a) * 2.5, 2, 1.5, ["#8a8478", "#6a6458", "#4a443e"]);
      k.halo(x, y - 6, 26, 20, "#ff9a3a", 0.22); [[-7, 6], [7, -6], [-5, -4]].forEach(([a, b]) => trazo(k, [[x + a, y + 1], [x + b, y - 3]], "#3a2414", 2)); k.llama(x, y, 0.8); brillo(k, x, y - 6, 26, 20, "#ffb04a", 0.6);
      L.push({ x, y: y - 4, r: 46, ry: 26, col: "#ff9a4a", f: 0.6 });
    });
    [[14, 168], [24, 172], [300, 170]].forEach(([x, y], i) => { sombraE(k, x + 2, y + 1, 4, 1, 0.4); trazo(k, [[x, y], [x + 3 + i, y - 18]], "#6a6a78", 2); k.R(x + 2 + i, y - 22, 3, 5, "#a8a8b4"); k.P(x + 2 + i, y - 22, "#d8d8e4"); });
    luces(k, L);
  }
  N[25] = ["El campamento shinobi", "Las tiendas de la Alianza y sus hogueras, antes de la gran batalla", campamento, { ven: ["#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffd27a", "#fff0b0"] }];

  function lunaRoja(k) {
    k.banda(["#14080f", "#241019", "#3a1626"], 0, 136); k.estrellas(110, 70, ["#a86a7a", "#6a4a5a", "#ffffff"]);
    k.halo(160, 58, 62, 62, "#7a1f2a", 0.5);
    bola(k, 160, 58, 46, 46, (x, y) => { const d = Math.hypot(x - 160, y - 58); return Math.abs(d - 34) < 0.7 || Math.abs(d - 24) < 0.7 || Math.abs(d - 14) < 0.7 ? "#5a1418" : rampa(["#f07a5a", "#e8604a", "#c0392b", "#9a2a26", "#7a1f2a"], 0.15 + ((x - 160) / 46) * 0.3 + ((y - 58) / 46) * 0.3 + 0.1 + (fbm(x * 0.12, y * 0.12, 2701) > 0.62 ? 0.15 : 0), x, y); });
    k.elipse(160, 58, 6, 6, "#1a0a10");
    [0, 2.09, 4.19].forEach((b) => [14, 24, 34].forEach((r) => { const x = 160 + Math.cos(b + r / 30) * r, y = 58 + Math.sin(b + r / 30) * r; k.elipse(x, y, 3, 3, "#1a0a10"); trazo(k, [[x, y], [160 + Math.cos(b + r / 30 + 0.3) * (r + 3), 58 + Math.sin(b + r / 30 + 0.3) * (r + 3)]], "#1a0a10", 1); }));
    for (let a = 0; a < 6.28; a += 0.03) { const r = 48 + Math.sin(a * 7) * 2; if (Det.trama(160 + Math.cos(a) * r, 58 + Math.sin(a) * r) < 0.5) k.crudo(160 + Math.cos(a) * r, 58 + Math.sin(a) * r, 1, 1, "#7a1f2a"); }
    const TR = ["#6a5260", "#54404a", "#46343c", "#34262c", "#241a20"];
    const raiz = (pts, s) => rellena(k, pts, (x, y) => rampa(TR, 0.15 + (Math.sin(x / 3 + y / 7 + fbm(x * 0.1, y * 0.05, s) * 3) > 0.55 ? 0.3 : 0) + (x < 160 ? 0.15 : 0.35), x, y));
    raiz([[-6, 138], [-6, 24], [28, 54], [50, 138]], 2702); raiz([[326, 138], [326, 24], [292, 54], [270, 138]], 2703);
    [[6, 60, 92, 20, 3], [14, 90, 78, 66, 3], [314, 60, 228, 20, 3], [306, 90, 242, 66, 3], [40, 40, 110, 8, 2], [280, 40, 210, 8, 2]].forEach(([a, b, c, d, g]) => { trazo(k, [[a, b], [c, d]], TR[3], g + 1); trazo(k, [[a, b - 1], [c, d - 1]], TR[1], 1); trazo(k, [[a, b + g], [c, d + g]], TR[4], 1); });
    [[60, 42], [76, 50], [44, 68], [260, 42], [244, 50], [276, 68], [96, 26], [224, 26]].forEach(([x, y]) => {
      k.R(x, y, 1, 10, TR[2]);
      esfera(k, x, y + 17, 4, 8, ["#fbf6ee", "#f4efe8", "#d8d0c4", "#a89e92"]);
      [[14, 18], [20, 24], [8, 12]].forEach(([y0, y1]) => trazo(k, [[x - 3, y + y0], [x + 3, y + y1]], "#b8ae9e", 1));
      k.P(x - 2, y + 12, "#ffffff");
    });
    T.rect(k, 0, 134, W, 46, T.tex(["#3a2630", "#2a1a24", "#20141c", "#180e14"], { s: 2704, y0: 134, alto: 46 }));
    k.hierbas(138, 178, 60, ["#3a2630", "#4a3440"]);
    for (let i = 0; i < 7; i++) { const x = 20 + i * 48, l = 26 + (i % 3) * 18; trazo(k, [[x, 134], [x + (i % 2 ? 16 : -16), 134 + l]], TR[2], 4, 2); trazo(k, [[x, 134], [x + (i % 2 ? 16 : -16), 134 + l]], TR[0], 1); }
    bruma(k, 120, 160, "#7a1f2a", 0.4);
    k.alfa(0.16, () => k.elipse(160, 140, 130, 10, "#c0392b"));
  }
  N[27] = ["La luna roja", "El Tsokuyumi Infinito: la luna con el ojo rojo y el Árbol Divino", lunaRoja, { cielo: "propio", base: "noche", astro: "siempre", fuego: ["#f07a5a", "#e8604a", "#c0392b", "#9a2a26", "#7a1f2a", "#5a1418", "#1a0a10"] }];
})();

(function () {
  const u = "ninjas";
  const F = { it6: window.SitiosIt6, it14: window.SitiosIt14, it15: window.SitiosIt15, it18: window.SitiosIt18, it19: window.SitiosIt19, it20: window.SitiosIt20, it21: window.SitiosIt21, it22: window.SitiosIt22, it27: window.SitiosIt27, it28: window.SitiosIt28, it29: window.SitiosIt29, it30: window.SitiosIt30 };
  const poner = (s, e, dentro) => {
    const ajuste = { ...(e[3] || {}) };
    if (dentro) ajuste.detallesDentro = true;
    Sitios[u][s] = [e[0], e[1], e[2], ajuste];
    Luz.AJUSTE[e[0]] = ajuste;
  };
  [[2,"it6",0,1],[4,"it6",0,1],[5,"it6",0,1],[26,"it6",0,1],[13,"it15"],[1,"it15"],[3,"it15"],[8,"it15"],[17,"it15"],[19,"it15"],[11,"it15"],[23,"it15"],[24,"it15"],[14,"it22",1],[15,"it22",1],[12,"it27"],[6,"it27"],[16,"it27"],[7,"it27"],[18,"it27"],[22,"it27"],[9,"it27"],[20,"it27"],[21,"it27"],[25,"it27"],[27,"it27"],[28,"it15"],[29,"it15"],[30,"it15"],[31,"it15"],[32,"it15"],[33,"it15"],[34,"it15"],[35,"it15"],[36,"it15"]].forEach(([s, it, variante, dentro]) => {
    const x = F[it] && F[it][u] && F[it][u][s], e = typeof x === "function" ? x(variante) : x;
    if (!e) throw new Error("escenas-ninjas.js: falta el escenario " + s + " de la " + it);
    poner(s, e, dentro);
  });
})();
