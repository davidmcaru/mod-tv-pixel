// luz.js — la luz de cada hora del día en los colores de los escenarios.
(function () {
  const hex = (c) => (c.length === 4 ? [1, 2, 3].map((i) => parseInt(c[i] + c[i], 16)) : [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16)));
  const aHex = (v) => "#" + v.map((n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0")).join("");
  const mezcla = (a, b, t) => { const A = hex(a), B = hex(b); return aHex(A.map((v, i) => v + (B[i] - v) * t)); };
  const remuestrea = (cols, f) => { const x = f * (cols.length - 1), i = Math.min(cols.length - 2, Math.floor(x)); return cols.length < 2 ? cols[0] : mezcla(cols[i], cols[i + 1], x - i); };

  const GRADO = [
    [0.3, 0.34, 0.56, 0.3], [0.28, 0.32, 0.54, 0.32], [0.28, 0.32, 0.54, 0.32], [0.29, 0.33, 0.55, 0.3], [0.33, 0.37, 0.58, 0.28], [0.48, 0.46, 0.66, 0.22],
    [0.74, 0.62, 0.74, 0.12], [0.92, 0.82, 0.84, 0.04], [1, 0.96, 0.93, 0], [1, 1, 0.98, 0], [1, 1, 1, 0], [1, 1, 1, 0],
    [1, 1, 1, 0], [1, 1, 1, 0], [1, 1, 1, 0], [1, 0.98, 0.94, 0], [1, 0.95, 0.86, 0], [1, 0.9, 0.76, 0],
    [0.98, 0.8, 0.66, 0.02], [0.86, 0.62, 0.6, 0.06], [0.62, 0.47, 0.6, 0.14], [0.44, 0.4, 0.6, 0.22], [0.33, 0.36, 0.57, 0.28], [0.31, 0.35, 0.56, 0.3],
  ];
  const LUZ_VENTANA = "#ffd27a", VIDRIO = "#8496a8";
  const calido = (c) => { const [r, , b] = hex(c); return r > b + 40; };
  const encendido = (h) => (h >= 20 || h <= 5 ? 1 : h === 19 || h === 6 ? 0.6 : 0);

  const AJUSTE = {
    "La aldea de Kanoho": { ven: ["#55697c"] },
    "Achiriku Ramen": { base: "noche", fuego: ["#ffe6a8", "#fff3cf", "#ff8a5a", "#ffcf6a", "#f2d27a"] },
    "El Bosque de la Muerte": { cielo: "propio", fuerza: 0.62 },
    "El monte Myuboko": { tinte: 0.55 },
    "La noche del Nueve Colas": { cielo: "propio", base: "noche", astro: "siempre", luna: [270, 30, 16], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a"] },
    "El piso de Karuto": { cielo: "propio", fuerza: 0.55, ventanal: "#2a3670" },
    "La Academia": { ven: ["#55697c"] },
    "La ciudad de Tunzaka": { ven: ["#ffd27a", "#55697c"], tinte: 0.2, fuego: ["#e8402a"] },
    "Las aguas termales": { tinte: 0.1, fuego: ["#ffd27a"] },
    "Sanugakure": { tinte: 0.45, ven: ["#5a3f2a"] },
    "El puente de las Olas": { tinte: 0.5 },
    "La guarida de Irochomura": { cielo: "propio", fuerza: 0.06, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#6a3fa8"] },
    "El bosque de los Kara": { tinte: 0.1 },
    "Emagakure": { tinte: 0.85, ven: ["#ffd27a"] },
    "Kanoho destruida": { tinte: 0.35 },
    "El barrio Ichuha": { fuego: ["#ff8a5a"] },
    "La cumbre de los Kega": { cielo: "propio", fuerza: 0.15, ventanal: "#8fb4d0" },
    "La isla Tortuga": { tinte: 0.1 },
    "El campamento shinobi": { ven: ["#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a"] },
    "El campo de batalla": { tinte: 0.45 },
    "La luna roja": { cielo: "propio", base: "noche", astro: "siempre" },
    "La guarida de Ukatsaki": { cielo: "propio", base: "noche", astro: "siempre", luna: [236, 44, 24], fuego: ["#d83a3a", "#c0392b", "#f4efe0"] },
    "Clams Town": { ven: ["#3f6f9a"] },
    "Lemon Town": { ven: ["#f2d27a"] },
    "Honey Village": { ven: ["#f2d27a", "#55697c"] },
    "Logueville": { tinte: 0.5, ven: ["#f2d27a"] },
    "Inverse Mountain": { tinte: 0.15, ven: ["#ffd27a"] },
    "Brandy Peak": { ven: ["#ffd27a"], tinte: 0.3, fuego: ["#e8402a", "#7ae8c0"] },
    "Tiny Garden": { tinte: 0.25, fuego: ["#e8602a"] },
    "El reino de Tambor": { tinte: 0.25 },
    "Yaya": { ven: ["#ffd27a", "#55697c"] },
    "Ineis Lobby": { ven: ["#3f6f9a"], fuego: ["#c9a03c"] },
    "Amazon Rose": { tinte: 0.15 },
    "Empil Down": { cielo: "propio", fuerza: 0.05, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a"] },
    "Funk Hazard": { tinte: 0.6, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a"] },
    "Zuo": { tinte: 0.1, ven: ["#ffd27a"] },
    "Cupcake Island": { tinte: 0.5, ven: ["#ffd27a"] },
    "Eggbrain": { tinte: 0.15, ven: ["#7ae8ff"], fuego: ["#3ac0e8"] },
    "La villa Faosho": { ven: ["#f2d27a"] },
    "El Baratei": { ven: ["#ffcf6a"], tinte: 0.1 },
    "Orlang Park": { ven: ["#2a4a5a"], tinte: 0.15 },
    "Alabesta": { tinte: 0.75 },
    "Wetar 7": { ven: ["#3f6f9a"] },
    "Threllir Bark": { base: "noche", astro: "siempre", luna: [70, 46, 23], tinte: 0.6, fuego: ["#ffcf6a"] },
    "El archipiélago Sobaady": { tinte: 0.45 },
    "Miraneford": { ven: ["#3f6f9a"] },
    "La isla Gyijon": { cielo: "propio", fuerza: 0.35 },
    "Drossresa": { ven: ["#f2d27a"], tinte: 0.1, dx: 22 },
    "Albef": { ven: ["#f2d27a"] },
    "El país de Wona": { tinte: 0.8 },
    "Hagworts desde el lago": { ven: ["#ffd27a"], dx: 104 },
    "El Gran Comedor": { fuerza: 0.12, fuego: ["#ffd27a", "#ffcf6a", "#f4efe0"] },
    "Hegsmoade": { ven: ["#ffd27a"], tinte: 0.2 },
    "El Bosque Prohibido": { base: "noche", astro: "fijo", fuego: ["#d8e86a"] },
    "El Callejón Daigon": { ven: ["#ffd27a"], brillo: 0.78 },
    "El andén 8½": { fuerza: 0.4, fuego: ["#ffe6a8"] },
    "Previt Drive": { ven: ["#a8c8dc"] },
    "La sala común de Gryffondir": { fuerza: 0.25, fuego: ["#e86a2a", "#ffcf6a"], ventanal: "#2a3670" },
    "La Madriguera": { ven: ["#ffe6a8"], tinte: 0.15 },
    "La cabaña de Higrad": { ven: ["#ffd27a"], tinte: 0.1 },
    "La Cámara de los Secretos": { cielo: "propio", fuerza: 0.1 },
    "La batalla de Hagworts": { cielo: "propio", fuerza: 0.7, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a", "#3fe87a", "#a8ffc8", "#d8ffe4", "#e83a3a", "#ffb0a0", "#ffe0d8", "#6ac8ff", "#9ad8ff"] },
    "La noche de Previt Drive": { ven: ["#a8c8dc", "#ffe6a8"] },
    "El ajedrez gigante": { cielo: "propio", fuerza: 0.08, fuego: ["#ff9a3a", "#ffe06a"] },
    "El espejo de Eosed": { cielo: "propio", fuerza: 0.06, fuego: ["#a05ae8", "#e0b8ff", "#e8c35a"] },
    "El Autobús Noctámbulo": { ven: ["#ffd27a", "#a8c8dc"], fuerza: 0.72, fuego: ["#ffe6a8"] },
    "La Casa de los Gritos": { tinte: 0.15 },
    "El Mundial de Kuidditch": { ven: ["#ffd27a"], tinte: 0.15, fuego: ["#3fe87a", "#0f3a22", "#ffe6a8"] },
    "El laberinto": { fuego: ["#ffe06a", "#9ad8ff", "#d8f4ff", "#e8c35a", "#c9a03c"] },
    "El cementerio": { tinte: 0.35, fuego: ["#ff9a3a", "#ffe06a", "#c8e8ff"] },
    "Grammiuld Place": { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#f4efe0"] },
    "El despacho de Imbrudge": { cielo: "propio", fuerza: 0.08, ventanal: "#7fb0d8" },
    "El Departamento de Misterios": { cielo: "propio", fuerza: 0, fuego: ["#5fa8e8", "#9ad8ff", "#d8f4ff"] },
    "La clase de Pociones": { cielo: "propio", fuerza: 0.1, fuego: ["#6ae8a0", "#e86a9a", "#6ac8ff", "#e8c84a", "#b08ae8", "#e8904a", "#ff9a3a"] },
    "El despacho de Dombludere": { cielo: "propio", fuerza: 0.15, ventanal: "#2a3672", fuego: ["#d8ecff"] },
    "La cueva": { cielo: "propio", fuerza: 0, fuego: ["#3fe87a", "#a8ffc8"] },
    "La Torre de Astronomía": { ven: ["#ffd27a"], fuego: ["#3fe87a", "#0f3a22"] },
    "El Valle de Gidroc": { ven: ["#ffd27a"], tinte: 0.2 },
    "Grongitts": { cielo: "propio", fuerza: 0.12, fuego: ["#ffe6a8", "#f4efe0"] },
  };

  const fase = (fecha = new Date()) => { const f = (fecha.getTime() / 86400000 + 2440587.5 - 2451550.1) / 29.530588853; return f - Math.floor(f); };
  function sombraLanu(crudo, cx, cy, r, col, f = fase()) {
    const c = Math.cos(2 * Math.PI * f);
    for (let y = -r; y <= r; y++) { const w = Math.sqrt(r * r - y * y), a = f < 0.5 ? -w : -c * w, b = f < 0.5 ? c * w : w; if (b > a) crudo(cx + a, cy + y, b - a, 1, col); }
  }

  function nueva(titulo, h, d = null) {
    const A = AJUSTE[titulo] || {}, hr = h;
    if (A.siempre !== undefined) h = A.siempre;
    const G = GRADO[h], P = Horas.paleta(h), fuerza = A.fuerza ?? 1, nochePintada = A.base === "noche";
    const ven = new Set((A.ven || []).map((c) => c.toLowerCase())), fuego = new Set((A.fuego || []).map((c) => c.toLowerCase()));
    const ventanal = A.ventanal && A.ventanal.toLowerCase();
    const noche = P.nocturna, lit = encendido(h), memo = {};
    function tinta(col) {
      const [r, g, b] = hex(col), l = 0.3 * r + 0.59 * g + 0.11 * b;
      if (nochePintada) {
        const R = GRADO[22];
        return aHex([r, g, b].map((v, i) => v * Math.min(1.7, Math.max(1, G[i] / R[i]))));
      }
      const v = [r, g, b].map((c, i) => (c + (l - c) * G[3] * fuerza) * (1 + (G[i] - 1) * fuerza));
      return aHex(v);
    }
    function color(col) {
      const k = col.toLowerCase();
      if (memo[k]) return memo[k];
      let out;
      if (fuego.has(k)) out = col;
      else if (k === ventanal) out = remuestrea(P.cielo, 0.55);
      else if (ven.has(k)) {
        const on = calido(col) ? col : LUZ_VENTANA, off = tinta(calido(col) ? VIDRIO : col);
        out = mezcla(off, on, lit * (A.brillo ?? 1));
      } else out = tinta(col);
      return (memo[k] = out);
    }
    function sprite(col) {
      const [r, g, b] = hex(col), l = 0.3 * r + 0.59 * g + 0.11 * b, f = 0.55 * fuerza;
      return (memo[`s${col}`] = memo[`s${col}`] || aHex([r, g, b].map((c, i) => (c + (l - c) * G[3] * f) * (1 + (G[i] - 1) * f))));
    }
    const propio = A.cielo === "propio";
    function cielo(pintado) {
      if (propio) return pintado.map(color);
      const t = (A.tinte ?? 0.2) * (noche && !nochePintada ? 0.2 : 1), n = P.cielo.length;
      return P.cielo.map((c, i) => mezcla(c, remuestrea(pintado, i / (n - 1)), t));
    }
    function sobreCielo({ crudo, W, BAYER }, y1) {
      if (propio) return;
      const usa = !A.astro, s = Horas.sol(h);
      s.x += A.dx || 0;
      if (P.estrella.length) {
        let sem = 4242;
        const rnd = () => ((sem = (sem * 1664525 + 1013904223) >>> 0) / 4294967296);
        for (let k = 0; k < 110; k++) {
          const x = Math.floor(rnd() * W), y = Math.floor(Math.pow(rnd(), 1.5) * (y1 - 10)), col = P.estrella[Math.floor(rnd() * P.estrella.length)];
          if (!usa || Math.hypot(x - s.x, y - s.y) >= s.r + 12) crudo(x, y, 1, 1, col);
        }
      }
      if (!usa) return;
      for (let y = s.y - s.r - 9; y <= s.y + s.r + 9; y++) for (let x = s.x - s.r - 9; x <= s.x + s.r + 9; x++) {
        const d = Math.hypot(x - s.x, y - s.y);
        if (d > s.r && d < s.r + 4 && BAYER[y & 3][x & 3] < 7) crudo(x, y, 1, 1, P.halo[1]);
        else if (d >= s.r + 4 && d < s.r + 9 && BAYER[y & 3][x & 3] < 3) crudo(x, y, 1, 1, P.halo[0]);
      }
      for (let y = s.y - s.r; y <= s.y + s.r; y++) for (let x = s.x - s.r; x <= s.x + s.r; x++) {
        if (Math.hypot(x - s.x + 0.5, y - s.y + 0.5) <= s.r) crudo(x, y, 1, 1, Math.hypot(x - (s.x - s.r * 0.3), y - (s.y - s.r * 0.3)) > s.r * 1.06 ? P.astroSombra : P.astro);
      }
      if (noche) { [[-0.35, -0.15, 3], [0.2, 0.25, 4], [-0.1, 0.45, 2], [0.4, -0.4, 2], [-0.45, 0.3, 2]].forEach(([dx, dy, t]) => crudo(s.x + dx * s.r, s.y + dy * s.r, t, t, P.astroCrater)); sombraLanu(crudo, s.x, s.y, s.r, mezcla(P.cielo[1] || "#10183a", P.astro, 0.1)); }
    }
    return { color, sprite, cielo, sobreCielo, noche, h, hr, d, lit, dx: A.dx || 0, luna: A.luna || null, estrellasPropias: propio && noche, astroPropio: A.astro === "siempre" || (A.astro === "fijo" && noche) };
  }
  window.Luz = { nueva, AJUSTE, GRADO, fase, sombraLanu };
})();
