// momentos-sagas.js — los momentos de las sagas: cada dos o tres minutos, unos segundos de algo que pasa en la escena.
(function () {
  const TAU = Math.PI * 2;
  const PR = () => window.PRUEBA || {};
  const base = (n) => n.split("·")[0];
  const entre = (h, a, b) => h >= a && h <= b;
  const deNoche = (h) => h >= 20 || h <= 5;
  const suave = (x) => x * x * (3 - 2 * x), sale = (x) => 1 - (1 - x) * (1 - x), entra = (x) => x * x;
  const tope = (x) => Math.max(0, Math.min(1, x));

  const CIELO = {
    piratas: [1, 2, 3, 4, 5, 6, 7, 8, 11, 12, 14, 16, 17, 18, 19, 21, 22, 23, 24, 25, 26, 28, 29, 30, 31, 32, 35, 38],
    ninjas: [1, 2, 3, 4, 6, 7, 8, 9, 12, 15, 16, 17, 21, 22, 24, 25, 26, 28, 29, 30, 32, 33, 36],
    magos: [1, 3, 4, 6, 7, 8, 10, 11, 16, 17, 18, 19, 20, 21, 28, 29, 33, 38, 45],
  };
  const FUERA_NA = [1, 3, 4, 5, 8, 9, 12, 15, 16, 19, 21, 22, 25, 26, 28, 30, 32, 33];
  const MAR_OP = { 20: { x: 192, y: 122, mira: -1 }, 31: { x: 116, y: 118, mira: 1, hasta: 18 } };
  const DENTRO_MAG = [2, 9, 22, 23, 25, 26, 35, 37, 40];
  const LISTA = {
    piratas: [
      ["gaviota", 6, ({ s, h }) => CIELO.piratas.includes(s) && entre(h, 7, 19)],
      ["reyMar", 6.5, ({ s, h }) => !!MAR_OP[s] && h <= (MAR_OP[s].hasta === undefined ? 23 : MAR_OP[s].hasta)],
      ["pistola", 2.6, ({ quien }) => !!quien("Lutty")],
      ["perdido", 4.6, ({ quien }) => !!quien("Korro")],
    ],
    ninjas: [
      ["clones", 4.2, ({ quien }) => !!quien("Karuto")],
      ["chodiri", 3.4, ({ quien }) => !!(quien("Susake") || quien("Kikasha"))],
      ["ninja", 3, ({ s, h }) => CIELO.ninjas.includes(s) && entre(h, 6, 20)],
      ["hojas", 4.2, ({ s, h }) => FUERA_NA.includes(s) && entre(h, 6, 20)],
    ],
    magos: [
      ["snatch", 4.2, ({ h }) => entre(h, 8, 21)],
      ["lechuza", 6, ({ s, h }) => CIELO.magos.includes(s) && entre(h, 7, 19)],
      ["potranus", 4.8, ({ h }) => deNoche(h)],
      ["vociferador", 5.2, ({ s, h }) => DENTRO_MAG.includes(s) && entre(h, 7, 22)],
    ],
  };

  function lienzo(filas, cols, espejo = false) {
    const w = Math.max(...filas.map((f) => f.length)), h = filas.length, cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    filas.forEach((f, j) => [...f].forEach((ch, i) => { if (ch !== "." && cols[ch]) { c.fillStyle = cols[ch]; c.fillRect(espejo ? w - 1 - i : i, j, 1, 1); } }));
    return cv;
  }
  const tinte = (cols, luz) => Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, luz ? luz.color(v) : v]));
  function figura(u, nombre, luz, espejo = false) {
    const sp = Universo.sprite(u, nombre), w = sp.m[0].length, h = sp.m.length, cv = document.createElement("canvas");
    cv.width = w; cv.height = h;
    const c = cv.getContext("2d");
    sp.m.forEach((fila, j) => [...fila].forEach((l, i) => { if (l !== ".") { c.fillStyle = luz ? luz.sprite(sp.c[l]) : sp.c[l]; c.fillRect(espejo ? w - 1 - i : i, j, 1, 1); } }));
    return cv;
  }
  function linea(P, x0, y0, x1, y1, col, a = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
    P.caja(Math.min(x0, x1) - 1, Math.min(y0, y1) - 1, Math.abs(x1 - x0) + 3, Math.abs(y1 - y0) + 3);
    P.ctx.globalAlpha = a; P.ctx.fillStyle = col;
    for (let i = 0; i <= n; i++) P.ctx.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
    P.ctx.globalAlpha = 1;
  }

  const GAVIOTA = [
    ["..GG...........", "..WGG..........", "...WGG....BBB..", "....WWG..BBBBB.", "..GWWWWWWWWKWYY", ".GGWWWWWWWWWWY.", "...WWWWWNNN....", ".....O.ONNN....", "..............."],
    ["...............", "...............", "..........BBB..", ".........BBBBB.", "..GWWWWWWWWKWYY", ".GGWWWWWWWWWWY.", "...WWGGWNNN....", "...WGG.ONNN....", "...GG.........."],
  ];
  const PERIODICO = [["NNNNNN", "NDDDDN", "NDNNDN", "NNNNNN"], ["NNN", "NDN", "NDN", "NDN", "NNN"], ["NNNNNN", "NDNNDN", "NDDDDN", "NNNNNN"], ["..NN..", ".NDDN.", "NNNNNN", ".NDDN.", "..NN.."]];
  function reyMar(abierta) {
    const cab = ["......F...F...F.......", ".....FF..FF..FF.......", "....DDDDDDDDDDDD......", "...DMMMMMMMMMMMMDD....", "..DMMMMNMMMMMMMMMMD...",
      "..DMMMMMMMMMMMEEMMMD..", "..DMMMNMMMMMMEKKEMMMD.", "..DMMMMMMMMMMMEEMMMMMD", "..DMMMMMMMMMMMMMMMMMMD"];
    const boca = abierta
      ? ["..DMMMMMMMMMTTTTTTTTTD", "..DLLLLLLLLDRRRRRRRRD.", "..DLLLLLLLLDRRRRRRD...", "..DLLLLLLLLLTTTTTD....", "..DLLLLLLLLLLDDD......"]
      : ["..DMMMMMMMMLLLLLLLLLLD", "..DLLLLLLLDTDTDTDTDTD.", "..DLLLLLLLLLLLLLLLLD..", "..DLLLLLLLLLLLLLDDD...", "..DLLLLLLLLLLMMMD....."];
    const cuello = [];
    for (let j = 0; j < 22; j++) { const o = Math.round(Math.sin(j / 4) * 1); cuello.push((".".repeat(2 + o) + "D" + (j % 5 === 2 ? "LLLLLNMMMMMD" : "LLLLLMMMMMMD") + ".".repeat(22)).slice(0, 22)); }
    return [...cab, ...boca, ...cuello];
  }
  const PUNO = [".SSS.", "SSSSS", "SKSKS", "SSSSS", ".SSS."];
  const PREGUNTA = ["..KKK..", ".KWWWK.", "KWWKWWK", ".KK.KWK", "...KWWK", "..KWWK.", "..KWK..", "...K...", "..KWK..", "...K..."];
  const GOTA = [".L.", "LWL", "LLL", ".L."];
  const NINJA = [
    ["..........DDD...", ".........DHHHD..", ".........DDDDD..", "SSSS....DDDDD...", "...SSSDDDDDDDDDD", ".......DDDDDD...", "......DDDDDD....",
      ".....DDDDD......", "....DDD.DDD.....", "...DDD...DDD....", "..DD.......DD...", ".DD.........D..."],
    ["................", "................", "..........DDD...", ".........DHHHD..", "SSS......DDDDD..", "..SSS..DDDDDDD..", "....SSDDDDDDDD..",
      "......DDDDDDD...", "......DDDDDD....", ".....DDD.DDD....", "....DDD...DD....", "................"],
  ];
  const LECHUZA = [
    ["..WW...........", "..WWW....WWWW..", "...WWW..WEWEWB.", "....WWWWWWWWW..", "...WWWWWWWWWW..", "..SWWKWWKWWW...", "....SWWWWWS....", "......LLL......", "......LRL......"],
    [".........WWWW..", "........WEWEWB.", "..WWWWWWWWWWW..", ".SWWWWWWWWWWW..", "..SSWWKWWKWW...", "...SS.WWWWS....", "..SS..LLL......", "......LRL......", "..............."],
  ];
  const CIERVO = (() => {
    const arriba = ["..................A....A....", ".................A.A..A.A...", "..................A.AA.A....", "...................AAAA.....",
      "....................AA......", "...................CCCC.....", "..................CCCCCC....", "..................CCLCCCCC..", "...................CCC..CC..",
      "..................CCC.......", ".................CCC........", "....CCCCCCCCCCCCCCCC........", "..CCCLLLLLLLLLLLLCCC........",
      ".CCCLLLLLLLLLLLLLCCC........", "CC.CCCLLLLLLLLLLCCC.........", "....CCCCCCCCCCCCCC.........."];
    return [
      [...arriba, "....CCC.........CCC.........", "...CC.CC.......CC.CC........", "..CC...CC.....CC...CC.......", ".CC.....C....CC.....C.......", ".C......C....C.......C......"],
      [...arriba, ".....CCC.....CCC............", ".....CCC.....CCC............", "....CC.C....CC.C............", "....C..C....C..C............", "....C..CC...C..CC..........."],
    ];
  })();
  const SOBRE = ["RRRRRRRRRRRRRRRRRR", "RDRRRRRRRRRRRRRRDR", "RRDRRRRRRRRRRRRDRR", "RRRDRRRRRRRRRRDRRR", "RRRRDRRRRRRRRDRRRR", "RRRRRDDRRRRDDRRRRR",
    "RRRRRRRDSSDRRRRRRR", "RRRRRRRRSSRRRRRRRR", "RRRRRRRRRRRRRRRRRR", "RRRRRRRRRRRRRRRRRR", "RRRRRRRRRRRRRRRRRR", "RDDDDDDDDDDDDDDDDR"];
  const BOCA = [
    ["..................", "...RRRRRRRRRRRR...", ".RRRDDDDDDDDDDRRR.", "RRDDTTTTTTTTTTDDRR", "RDTTTTTTTTTTTTTTDR", "RDKKKKKKKKKKKKKKDR", "RDTTTTTTTTTTTTTTDR",
      "RRDDTTTTTTTTTTDDRR", ".RRRDDDDDDDDDDRRR.", "...RRRRRRRRRRRR...", ".................."],
    ["...RRRRRRRRRRRR...", ".RRDDDDDDDDDDDDRR.", "RDDTTTTTTTTTTTTDDR", "RDTTKKKKKKKKKKTTDR", "RDKKKKKKKKKKKKKKDR", "RDKKKKKKPPKKKKKKDR", "RDKKKKKPPPPKKKKKDR",
      "RDKKKKPPPPPPKKKKDR", "RDTTKKKKKKKKKKTTDR", "RDDTTTTTTTTTTTTDDR", ".RRDDDDDDDDDDDDRR.", "...RRRRRRRRRRRR..."],
  ];

  const PREPARA = {
    gaviota({ s, luz }) {
      const cols = tinte({ W: "#ffffff", G: "#aab6c2", B: "#2f5fb0", Y: "#f4b42c", K: "#1a1a1a", N: "#efe4c8", O: "#e88a3a", D: "#9a9080" }, luz), dir = s % 2 ? 1 : -1;
      return { dir, y: 14 + (s % 4) * 4, f: GAVIOTA.map((g) => lienzo(g, cols, dir < 0)), p: PERIODICO.map((g) => lienzo(g, cols)) };
    },
    reyMar({ s, luz }) {
      const o = MAR_OP[s]; if (!o) return null;
      const cols = tinte({ D: "#2e2448", M: "#6a4aa8", N: "#54388e", L: "#c0b0e6", F: "#e0508a", E: "#ffffff", K: "#14101c", T: "#ffffff", R: "#a0283a" }, luz);
      return { ...o, cerrada: lienzo(reyMar(false), cols, o.mira < 0), abierta: lienzo(reyMar(true), cols, o.mira < 0), espuma: luz ? luz.color("#ffffff") : "#ffffff", agua: luz ? luz.color("#bfe6f4") : "#bfe6f4" };
    },
    pistola({ u, quien, c, luz }) {
      const q = quien("Lutty"), x = Math.round(q.x), y = Math.round(q.top), w = q.w, h = q.alto, der = q.x + q.w / 2 < 150;
      const ancho = Math.round(w * 0.29), j0 = Math.round(h * 0.51), j1 = Math.round(h * 0.79);
      const sx = der ? x + w - 1 - ancho : x + ancho, sy = y + j0 + 1;
      const L = der ? Math.min(124, 208 - sx) : Math.min(124, sx - 84);
      if (L < 30) return null;
      const t = (col) => (luz ? luz.sprite(col) : col), sp = Universo.sprite(u, q.nombre);
      const sin = document.createElement("canvas"); sin.width = w; sin.height = h;
      const sc = sin.getContext("2d"); sc.putImageData(c.getImageData(x, y, w, h), 0, 0);
      sp.m.forEach((fila, j) => [...fila].forEach((l, i) => { if (l === "." || (j >= j0 && j <= j1 && (der ? i >= w - 1 - ancho : i <= ancho))) return; sc.fillStyle = t(sp.c[l]); sc.fillRect(i, j, 1, 1); }));
      return { der, x, y, sin, sx, sy, L, luz: t("#f2d1b1"), piel: t("#eab98c"), sombra: t("#d89d77"), manga: t("#a42f3a"), puno: lienzo(PUNO, { S: t("#eab98c"), K: t("#b27257") }) };
    },
    perdido({ u, quien, c, luz }) {
      const q = quien("Korro"), w = q.w, h = q.alto, x = Math.round(q.x), y = Math.round(q.top);
      const vuelto = document.createElement("canvas"); vuelto.width = w; vuelto.height = h;
      const vc = vuelto.getContext("2d"); vc.putImageData(c.getImageData(x, y, w, h), 0, 0); vc.drawImage(figura(u, q.nombre, luz, true), 0, 0);
      return { x, y, w, vuelto, preg: lienzo(PREGUNTA, { K: "#1a1a22", W: "#ffffff" }), gota: lienzo(GOTA, { L: "#8ad0f4", W: "#ffffff" }) };
    },
    clones({ u, quien, luz }) {
      const q = quien("Karuto"), x = Math.round(q.x), w = q.w, sitio = (p) => p >= 82 && p + w <= 208;
      const pos = [x - w - 2, x + w + 2].filter(sitio);
      if (pos.length < 2) { const otro = pos.length ? (pos[0] < x ? pos[0] - w - 2 : pos[0] + w + 2) : null; if (otro !== null && sitio(otro)) pos.push(otro); }
      if (!pos.length) return null;
      return { pos, y: Math.round(q.top), w, alto: q.alto, img: figura(u, q.nombre, luz), humo: luz ? luz.color("#f4f4f8") : "#f4f4f8", humo2: luz ? luz.color("#c4c8d6") : "#c4c8d6" };
    },
    chodiri({ quien }) {
      const q = quien("Susake") || quien("Kikasha"), der = q.x + q.w / 2 < 150;
      return { hx: der ? q.x + q.w + 1 : q.x - 2, hy: q.top + Math.round(q.alto * 0.62), suelo: q.y };
    },
    ninja({ s, luz }) {
      const cols = tinte({ D: "#1c2030", H: "#b8c4d4", S: "#c83a3a" }, luz), dir = s % 2 ? -1 : 1;
      return { dir, y0: 44 + (s % 3) * 5, f: NINJA.map((g) => lienzo(g, cols, dir < 0)) };
    },
    hojas({ s, luz }) {
      return { cx: 118 + ((s * 37) % 70), b: 166, cols: ["#7cc050", "#5ea43c", "#a8d860", "#d8c048", "#4e8a34"].map((c) => (luz ? luz.color(c) : c)), polvo: luz ? luz.color("#d8ccb0") : "#d8ccb0" };
    },
    snatch({ s, d }) { return { semilla: s * 1.7 + d, lado: s % 2 ? 1 : -1 }; },
    lechuza({ s, luz }) {
      const cols = tinte({ W: "#ffffff", S: "#cfd6e2", K: "#3a3a44", E: "#f2c030", B: "#3a3030", L: "#efe2c0", R: "#c0282a" }, luz), dir = s % 2 ? -1 : 1;
      return { dir, y: 16 + (s % 3) * 5, f: LECHUZA.map((g) => lienzo(g, cols, dir < 0)) };
    },
    potranus({ quien }) {
      const q = quien("Antonio"), cols = { C: "#d8eeff", L: "#ffffff", A: "#bfe0ff" };
      if (q) {
        const dir = q.x + q.w / 2 < 230 ? 1 : -1, vx = dir > 0 ? q.x + q.w + 1 : q.x - 2, vy = q.top + Math.round(q.alto * 0.5);
        return { dir, vara: [vx, vy], x0: dir > 0 ? vx + 2 : vx - 30, y: q.y - 21, f: CIERVO.map((g) => lienzo(g, cols, dir < 0)) };
      }
      return { dir: 1, vara: null, x0: 84, y: 138, f: CIERVO.map((g) => lienzo(g, cols)) };
    },
    vociferador({ quien, luz }) {
      const q = quien("Juan") || quien("Nivelle") || quien("Antonio"), cols = tinte({ R: "#c8282a", D: "#8a181c", T: "#ffffff", K: "#2a0a0c", P: "#e86a7a", S: "#e8b040" }, luz);
      const hx = q ? (q.x + q.w / 2 < 150 ? q.x + q.w + 6 : q.x - 24) : 140, hy = q ? q.top - 2 : 76;
      return { hx: Math.max(84, Math.min(190, hx)), hy, sobre: lienzo(SOBRE, cols), boca: BOCA.map((g) => lienzo(g, cols)), fuego: ["#ffe06a", "#ff9a3a", "#e8502a"], ceniza: luz ? luz.color("#6a6470") : "#6a6470" };
    },
  };

  const DIBUJA = {
    gaviota(m, u, t, P) {
      P.rapido();
      const X = (uu) => (m.dir > 0 ? -18 + uu * 356 : 338 - uu * 356);
      P.imagen(m.f[Math.floor(t / 0.16) % 2], X(u), m.y + Math.sin(u * TAU * 2) * 2);
      const tc = t - 0.4 * m.dura;
      if (tc > 0 && tc < 1.9) {
        const x = X(0.4) + 6 + m.dir * tc * 12 + Math.sin(tc * 5) * 4, y = m.y + 8 + tc * 16 + tc * tc * 14;
        P.imagen(m.p[Math.floor(tc / 0.16) % 4], x, y, tc > 1.4 ? (1.9 - tc) / 0.5 : 1);
      }
    },
    reyMar(m, u, t, P) {
      const sube = u < 0.12 ? 0 : u < 0.32 ? sale((u - 0.12) / 0.2) : u < 0.7 ? 1 : u < 0.88 ? 1 - entra((u - 0.7) / 0.18) : 0;
      const img = u > 0.52 && u < 0.66 ? m.abierta : m.cerrada, w = img.width, hv = Math.round(sube * 32 + (u > 0.32 && u < 0.7 ? Math.sin(t * 3) : 0));
      const x = Math.round(m.x - w / 2), yw = m.y;
      if (u < 0.2 || (u > 0.6 && u < 0.98)) P.rapido();
      const ondas = u < 0.32 ? u / 0.32 : u > 0.7 ? (u - 0.7) / 0.3 : -1;
      if (ondas >= 0) for (let i = 0; i < 3; i++) { const f = (ondas * 1.6 + i / 3) % 1, rx = 4 + f * 26, a = (1 - f) * 0.8; for (let k = 0; k < 40; k++) { const an = (k / 40) * TAU, px = m.x + Math.cos(an) * rx, py = yw + Math.sin(an) * rx * 0.18; if (k % 2) P.R(px, py, 1, 1, m.espuma, a); } }
      if (hv > 0) { P.caja(x, yw - hv, w, hv); P.ctx.drawImage(img, 0, 0, w, hv, x, yw - hv, w, hv); }
      if (hv > 0) { P.R(x - 2, yw - 1, w + 4, 2, m.espuma, 0.85); P.R(x - 5, yw, w + 10, 1, m.agua, 0.7); }
      if ((u > 0.14 && u < 0.36) || (u > 0.7 && u < 0.86)) for (let i = 0; i < 12; i++) { const f = ((u * 9 + i / 12) % 1), px = m.x + Math.cos(i * 2.4) * (6 + f * 18), py = yw - 4 - Math.sin(f * Math.PI) * (10 + (i % 4) * 4); P.R(px, py, 1, 1, m.espuma, 1 - f * 0.6); }
    },
    pistola(m, u, t, P) {
      P.rapido();
      const ext = u < 0.12 ? 0 : u < 0.3 ? sale((u - 0.12) / 0.18) : u < 0.6 ? 1 : u < 0.84 ? 1 - entra((u - 0.6) / 0.24) : 0;
      const d = m.der ? 1 : -1, len = ext * m.L, fx = m.sx + d * len;
      if (u < 0.12) { const f = u / 0.12; for (let i = 0; i < 3; i++) P.R(m.sx - d * (3 + i * 3), m.sy - 3 + i * 3, 2, 1, "#ffffff", 0.6 * f); }
      if (len > 3) {
        const x0 = Math.min(m.sx, fx), w = Math.abs(fx - m.sx);
        P.imagen(m.sin, m.x, m.y);
        P.R(x0, m.sy, w, 1, m.luz); P.R(x0, m.sy + 1, w, 1, m.piel); P.R(x0, m.sy + 2, w, 1, m.sombra);
        P.R(m.der ? m.sx - 1 : m.sx - 1, m.sy - 1, 2, 4, m.manga);
        P.imagen(m.puno, m.der ? fx : fx - 5, m.sy - 1);
        if (u > 0.12 && u < 0.34) for (let i = 0; i < 4; i++) P.R(fx - d * (10 + i * 10), m.sy - 5 + i * 4, 7, 1, "#ffffff", 0.75);
        if (u >= 0.28 && u < 0.5) { const cx = fx + d * 4, cy = m.sy + 1, r = 4 + ((u - 0.28) / 0.22) * 5; for (let k = 0; k < 8; k++) { const an = (k / 8) * TAU + 0.2; linea(P, cx + Math.cos(an) * r, cy + Math.sin(an) * r, cx + Math.cos(an) * (r + 4), cy + Math.sin(an) * (r + 4), k % 2 ? "#fff2a0" : "#ffffff", 0.95); } }
      }
      if (u > 0.84 && u < 0.98) { const f = (u - 0.84) / 0.14; P.bola(m.sx, m.sy, 3 + f * 4, 3 + f * 3, "#ffffff", (1 - f) * 0.8); }
    },
    perdido(m, u, t, P) {
      if ((u > 0.22 && u < 0.42) || (u > 0.58 && u < 0.72)) P.imagen(m.vuelto, m.x, m.y);
      if (u < 0.86) { const salta = u < 0.1 ? Math.sin((u / 0.1) * Math.PI) * 3 : 0; if (u < 0.1) P.rapido(); P.imagen(m.preg, m.x + m.w / 2 - 3, m.y - 13 - salta, u > 0.76 ? (0.86 - u) / 0.1 : 1); }
      if (u > 0.72) { const g = (u - 0.72) / 0.28; P.rapido(); P.imagen(m.gota, m.x + m.w - 3, m.y + 5 + g * 7, 1 - Math.max(0, g - 0.7) / 0.3); }
    },
    clones(m, u, t, P) {
      if (u < 0.14) { P.rapido(); m.pos.forEach((x) => P.bola(x + m.w / 2, m.y + m.alto * 0.5, 6, 10, "#ffa040", 0.25 * Math.sin((u / 0.14) * Math.PI))); }
      if (u > 0.2 && u < 0.84) m.pos.forEach((x, i) => P.imagen(m.img, x, m.y - (Math.floor(t * 3 + i * 2) % 5 === 0 ? 1 : 0)));
      [[0.14, 0.2], [0.8, 0.18]].forEach(([u0, du]) => {
        const f = (u - u0) / du; if (f < 0 || f > 1) return;
        P.rapido();
        m.pos.forEach((x) => { const cx = x + m.w / 2, cy = m.y + m.alto * 0.55; for (let i = 0; i < 6; i++) { const an = (i / 6) * TAU + f * 2; P.bola(cx + Math.cos(an) * (5 + f * 9), cy + Math.sin(an) * (6 + f * 10), 4 + f * 4, 3 + f * 3, i % 2 ? m.humo : m.humo2, (1 - f) * 0.95); } P.bola(cx, cy, 6 + f * 7, 9 + f * 8, m.humo, (1 - f) * 0.9); });
      });
    },
    chodiri(m, u, t, P) {
      P.rapido();
      const f = u < 0.15 ? u / 0.15 : u > 0.85 ? (1 - u) / 0.15 : 1, cuadro = Math.floor(t * 20), r = (i) => P.ruido(cuadro * 13.7 + i * 7.1);
      if (u < 0.15) for (let i = 0; i < 10; i++) { const an = r(i) * TAU, d = (1 - f) * 16; P.R(m.hx + Math.cos(an) * d, m.hy + Math.sin(an) * d, 1, 1, "#bfe6ff"); }
      P.bola(m.hx, m.hy, 3 + 9 * f, 3 + 8 * f, "#3a78ff", 0.45 * f);
      P.bola(m.hx, m.hy, 2 + 4 * f, 2 + 4 * f, "#8ac8ff", 0.85 * f);
      P.bola(m.hx, m.hy, 1 + 1.6 * f, 1 + 1.6 * f, "#ffffff", 1);
      if (u > 0.1 && u < 0.9) for (let b = 0; b < 6; b++) {
        let x = m.hx, y = m.hy;
        const a0 = b === 5 ? Math.PI / 2 : r(b) * TAU, L = b === 5 ? m.suelo - m.hy : 7 + r(b + 20) * 13;
        for (let k = 0; k < 4; k++) { const an = a0 + (r(b * 4 + k + 40) - 0.5) * 1.4, nx = x + (Math.cos(an) * L) / 4, ny = y + (Math.sin(an) * L) / 4; linea(P, x, y, nx, ny, k < 2 ? "#ffffff" : "#9ad0ff"); x = nx; y = ny; }
        if (b === 5) P.R(x - 2, m.suelo - 1, 5, 1, "#bfe6ff", 0.8);
      }
    },
    ninja(m, u, t, P) {
      P.rapido();
      const X = (uu) => (m.dir > 0 ? -14 + uu * 348 : 334 - uu * 348), Y = (uu) => { const s = uu * 3, fr = s - Math.floor(s); return m.y0 - Math.sin(fr * Math.PI) * 20; };
      for (let i = 2; i >= 1; i--) { const uu = u - i * 0.025; if (uu > 0) P.imagen(m.f[0], X(uu), Y(uu), 0.22 / i); }
      const fr = u * 3 - Math.floor(u * 3);
      P.imagen(fr < 0.1 || fr > 0.9 ? m.f[1] : m.f[0], X(u), Y(u));
    },
    hojas(m, u, t, P) {
      P.rapido();
      if (u < 0.3) P.bola(m.cx, m.b, 10 + u * 30, 3, m.polvo, (0.3 - u) * 2);
      const N = 36, alfa = u > 0.86 ? (1 - u) / 0.14 : u < 0.06 ? u / 0.06 : 1;
      for (let i = 0; i < N; i++) {
        const f = i / N, fase = f * TAU * 3.7, sube = tope(u * 1.4 + f * 0.12), r = 3 + sube * 24 + f * 5, an = fase + t * (6 - sube * 2.5);
        let x = m.cx + Math.cos(an) * r, y = m.b - sube * 92 - f * 12 + Math.sin(an) * r * 0.22;
        if (u > 0.76) { const g = (u - 0.76) / 0.24; x += Math.cos(fase) * g * 80 + g * 30; y -= g * 18 - g * g * 34; }
        const giro = Math.floor(t * 8 + i) % 4, col = m.cols[i % m.cols.length], ner = m.cols[4];
        if (giro === 0) { P.R(x, y, 2, 1, col, alfa); P.R(x + 1, y + 1, 2, 1, col, alfa); P.R(x + 1, y, 1, 1, ner, alfa); }
        else if (giro === 1) { P.R(x + 1, y, 2, 1, col, alfa); P.R(x, y + 1, 2, 1, col, alfa); P.R(x + 1, y + 1, 1, 1, ner, alfa); }
        else if (giro === 2) { P.R(x, y, 1, 3, col, alfa); P.R(x + 1, y + 1, 1, 1, col, alfa); }
        else { P.R(x, y, 3, 1, col, alfa); P.R(x + 1, y + 1, 1, 1, ner, alfa); }
      }
      if (u > 0.05 && u < 0.8) for (let k = 0; k < 3; k++) for (let i = 0; i < 16; i++) {
        const f = i / 16, an = t * 5.5 + k * 2.1 + f * 2.4, r = 6 + (tope(u * 1.4) * 24) * (0.5 + f * 0.5), y = m.b - tope(u * 1.4) * 70 - f * 26 - k * 8;
        P.R(m.cx + Math.cos(an) * r, y + Math.sin(an) * r * 0.22, 1, 1, "#ffffff", 0.55 * (1 - f) * alfa);
      }
    },
    snatch(m, u, t, P) {
      P.rapido();
      const fx = (tt) => 148 + Math.sin(tt * 2.3 + m.semilla) * 42 + Math.sin(tt * 5.1 + m.semilla * 2) * 14, fy = (tt) => 80 + Math.sin(tt * 1.7 + m.semilla * 3) * 28 + Math.cos(tt * 4.3) * 10;
      const quieta = u > 0.56 && u < 0.66, tq = quieta ? 0.56 * m.dura : t;
      let x = fx(tq), y = fy(tq) + (quieta ? Math.sin(t * 12) * 0.6 : 0);
      const huye = u > 0.8 ? entra((u - 0.8) / 0.2) : 0;
      x += huye * 240 * m.lado; y -= huye * 50;
      const a = u < 0.06 ? u / 0.06 : 1;
      if (!quieta) for (let i = 1; i <= 4; i++) { const tt = t - i * 0.045; P.R(fx(tt) + huye * 240 * m.lado - i * m.lado * huye * 8, fy(tt) - huye * 50, 1, 1, "#ffe080", (0.6 / i) * a); }
      const ala = Math.floor(t * 24) % 2, alas = ala ? [[-3, -2], [-4, -3], [-5, -3], [-6, -4], [-7, -4], [-5, -4]] : [[-3, 1], [-4, 2], [-5, 2], [-6, 3], [-7, 3], [-5, 3]];
      alas.forEach(([dx, dy]) => { P.R(x + dx, y + dy, 1, 1, "#f4f8ff", 0.95 * a); P.R(x - dx + 1, y + dy, 1, 1, "#f4f8ff", 0.95 * a); });
      P.R(x - 2, y - 2, 4, 4, "#e8b830", a); P.R(x - 2, y - 1, 1, 2, "#f2c84a", a); P.R(x - 1, y - 2, 2, 1, "#fff2a8", a); P.R(x + 1, y + 1, 1, 1, "#a07818", a); P.R(x - 1, y, 2, 1, "#c8962a", a);
      if (quieta) P.bola(x, y, 6, 6, "#fff2a8", 0.35);
    },
    lechuza(m, u, t, P) {
      P.rapido();
      const x = m.dir > 0 ? -18 + u * 356 : 338 - u * 356, y = m.y + Math.sin(u * Math.PI) * 6 + Math.sin(t * 6) * 1;
      P.imagen(m.f[Math.floor(t / 0.2) % 2], x, y);
    },
    potranus(m, u, t, P) {
      P.rapido();
      const desde = m.vara ? 0.18 : 0;
      if (m.vara && u < 0.24) {
        const f = tope(u / 0.18), [vx, vy] = m.vara, ex = vx + m.dir * f * 22, ey = vy - f * 6;
        linea(P, vx, vy, ex, ey, "#e8f6ff", 0.9); P.bola(ex, ey, 2 + f * 6, 2 + f * 6, "#bfe0ff", 0.6);
        for (let i = 0; i < 6; i++) P.R(vx + m.dir * P.ruido(i + Math.floor(t * 10)) * 22, vy - 3 + P.ruido(i * 3 + Math.floor(t * 10)) * 6, 1, 1, "#ffffff", 0.8);
        if (u < desde) return;
      }
      const g = tope((u - desde) / (1 - desde)), x = m.x0 + m.dir * g * 210, y = m.y - Math.abs(Math.sin(g * Math.PI * 6)) * 2;
      const a = g > 0.74 ? (1 - g) / 0.26 : g < 0.12 ? g / 0.12 : 1;
      P.bola(x + 14, y + 11, 17, 13, "#7ab4ff", 0.2 * a); P.bola(x + 14, y + 11, 11, 9, "#bfe0ff", 0.22 * a);
      P.imagen(m.f[Math.floor(t * 8) % 2], x, y, a);
      for (let i = 0; i < 14; i++) { const tt = (t * 1.6 + i / 14) % 1, sx = x + 14 - m.dir * (8 + tt * 40), sy = y + 8 + Math.sin(i * 2.1) * 7 + tt * 6; P.R(sx, sy, 1, 1, i % 3 ? "#e8f6ff" : "#ffffff", (1 - tt) * a); }
    },
    vociferador(m, u, t, P) {
      P.rapido();
      if (u < 0.2) { const f = sale(u / 0.2), x = 330 + (m.hx - 330) * f, y = m.hy - 20 + 20 * f + Math.sin(t * 9) * 2; P.imagen(m.sobre, x, y); return; }
      const tiembla = u > 0.3 && u < 0.76 ? (Math.floor(t * 20) % 2 ? 1 : -1) : 0, x = m.hx + tiembla, y = m.hy;
      if (u < 0.3) { P.imagen(m.sobre, x, y + 1, 1 - (u - 0.2) / 0.1); P.imagen(m.boca[0], x, y, (u - 0.2) / 0.1); return; }
      if (u < 0.76) {
        P.imagen(m.boca[Math.floor(t / 0.12) % 2], x, y);
        for (let k = 0; k < 3; k++) { const f = (t * 1.8 + k / 3) % 1, r = 12 + f * 26; for (let i = -5; i <= 5; i++) { const an = i * 0.12; [1, -1].forEach((lado) => P.R(x + 9 + lado * Math.cos(an) * r, y + 6 + Math.sin(an) * r * 0.9, 2, 1, "#ffffff", (1 - f) * 0.95)); } }
        return;
      }
      if (u < 0.88) {
        const f = (u - 0.76) / 0.12;
        P.imagen(m.boca[0], x, y + f * 2, 1 - f);
        for (let i = 0; i < 12; i++) { const fx = x + 1 + i * 1.4, al = 3 + P.ruido(i + Math.floor(t * 12)) * 7; P.R(fx, y + 10 - al - f * 2, 1.5, al, m.fuego[i % 3], 0.95); }
        return;
      }
      const f = (u - 0.88) / 0.12;
      for (let i = 0; i < 18; i++) P.R(x + 1 + P.ruido(i) * 16, y + 8 + f * (8 + P.ruido(i + 9) * 10), 1, 1, m.ceniza, 1 - f);
    },
  };

  function capa(w, h) {
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const cc = cv.getContext("2d"); cc.imageSmoothingEnabled = false;
    return { cv, c: cc, w, h, limpia() { cc.clearRect(0, 0, w, h); return cc; },
      recorta(m) { cc.globalCompositeOperation = "destination-in"; cc.drawImage(m, 0, 0); cc.globalCompositeOperation = "source-over"; } };
  }
  function mascara(c, x0, y0, w, h, prueba) {
    const d = c.getImageData(x0, y0, w, h).data, m = capa(w, h), img = m.c.createImageData(w, h);
    for (let i = 0; i < w * h; i++) if (prueba(d[i * 4], d[i * 4 + 1], d[i * 4 + 2], x0 + (i % w), y0 + Math.floor(i / w))) { img.data[i * 4 + 3] = 255; img.data[i * 4] = img.data[i * 4 + 1] = img.data[i * 4 + 2] = 255; }
    m.c.putImageData(img, 0, 0);
    return m.cv;
  }
  function trozo(c, x0, y0, w, h) { const m = capa(w, h); m.c.putImageData(c.getImageData(x0, y0, w, h), 0, 0); return m.cv; }
  function girada(P, img, cx, cy, ang = 0, a = 1, esc = 1) {
    const w = img.width * esc, h = img.height * esc, r = Math.ceil(Math.hypot(w, h) / 2) + 2;
    P.caja(cx - r, cy - r, 2 * r, 2 * r);
    const cc = P.ctx; cc.save(); cc.globalAlpha = tope(a); cc.translate(Math.round(cx), Math.round(cy)); cc.rotate(ang);
    cc.drawImage(img, -Math.round(w / 2), -Math.round(h / 2), Math.round(w), Math.round(h)); cc.restore();
  }
  function halo(P, cx, cy, r, col, a = 1) { P.bola(cx, cy, r, r, col, 0.3 * a); P.bola(cx, cy, r * 0.55, r * 0.55, col, 0.6 * a); }
  function rayo(P, x0, y0, x1, y1, semilla, nucleo = "#ffffff", borde = "#9ad0ff", tramos = 7, quiebro = 0.35, a = 1) {
    const L = Math.hypot(x1 - x0, y1 - y0), nx = -(y1 - y0) / (L || 1), ny = (x1 - x0) / (L || 1);
    let px = x0, py = y0;
    for (let i = 1; i <= tramos; i++) {
      const f = i / tramos, off = i === tramos ? 0 : (P.ruido(semilla + i * 3.1) - 0.5) * L * quiebro / Math.sqrt(tramos);
      const qx = x0 + (x1 - x0) * f + nx * off, qy = y0 + (y1 - y0) * f + ny * off;
      linea(P, px + 1, py, qx + 1, qy, borde, 0.7 * a); linea(P, px - 1, py, qx - 1, qy, borde, 0.7 * a); linea(P, px, py, qx, qy, nucleo, a);
      px = qx; py = qy;
    }
  }
  function estallido(P, cx, cy, f, r, cols = ["#fff6c8", "#ffd23a", "#ff8a2a", "#d8401c"], humo = "#5a5058", semilla = 1) {
    if (f < 0.12) { const g = f / 0.12; halo(P, cx, cy, r * (0.4 + g * 0.6), "#ffffff", 1); P.bola(cx, cy, r * 0.5 * g + 2, r * 0.5 * g + 2, "#ffffff", 1); return; }
    const g = (f - 0.12) / 0.88, rr = r * (0.55 + sale(g) * 0.45);
    for (let i = 0; i < 7; i++) { const an = (i / 7) * TAU + semilla, d = rr * (0.3 + g * 0.6); P.bola(cx + Math.cos(an) * d * 0.8, cy + Math.sin(an) * d * 0.5 - g * r * 0.7, rr * 0.45, rr * 0.38, humo, (1 - g) * 0.85); }
    if (g < 0.75) { const h = 1 - g / 0.75; cols.forEach((col, i) => P.bola(cx + Math.sin(semilla + i) * 2, cy - g * r * 0.4, rr * (1 - i * 0.2) * h, rr * (0.86 - i * 0.18) * h, col, 0.95)); }
    for (let i = 0; i < 14; i++) { const an = P.ruido(semilla + i) * TAU, d = r * (0.4 + sale(g) * 1.1) * (0.6 + P.ruido(semilla + i * 2) * 0.6); P.R(cx + Math.cos(an) * d, cy + Math.sin(an) * d + g * g * 14, 1, 1, cols[i % 3], 1 - g); }
  }
  function aro(P, cx, cy, rx, ry, col, a = 1, paso = 1) {
    const n = Math.max(12, Math.round((rx + ry) * 3));
    for (let k = 0; k < n; k++) if (k % (paso + 1) === 0) { const an = (k / n) * TAU; P.R(cx + Math.cos(an) * rx, cy + Math.sin(an) * ry, 1, 1, col, a); }
  }
  const gentePara = (u, quienes, luz) => quienes.map((q) => ({ img: figura(u, q.nombre, luz), x: Math.round(q.x), y: Math.round(q.top) }));
  const ESCENA = {};

  function poner(k, u, s, { d, h, quienes, c, luz }) {
    const lista = LISTA[u];
    if (!lista || !window.Vivo || !Vivo.piezas.imagen) return;
    const quien = (n) => quienes.find((q) => base(q.nombre) === n || (n === "Karuto" && /^Karuto (Hakoge|Karuma)$/.test(base(q.nombre))));
    const forzado = PR().momento, CON_PERSONAJE = ["pistola", "perdido", "clones", "chodiri"], ctx = { u, s, d, h, quien, quienes, c, luz };
    const seguro = (f) => { try { return f(); } catch (err) { console.error("momento", s, h, err); return null; } };
    const e = (ESCENA[u] || {})[s], ide = "e" + s;
    const propio = e && seguro(() => (forzado ? forzado === ide : !e.vale || e.vale(ctx))) ? seguro(() => {
      const m = e.prepara(ctx);
      return m && { id: ide, dura: e.dura, ...m, dibuja: e.dibuja, gente: e.detras ? gentePara(u, quienes, luz) : null };
    }) : null;
    const hechos = [propio, ...lista.filter(([id, , vale]) => seguro(() => (forzado ? id === forzado && (!CON_PERSONAJE.includes(id) || vale({ s, d, h, quien })) : vale({ s, d, h, quien }))))
      .map(([id, dura]) => seguro(() => { const m = PREPARA[id](ctx); return m && { id, dura, ...m, dibuja: DIBUJA[id] }; }))]
      .filter(Boolean);
    if (hechos.length) k.actores.push({ tipo: "momentos", lista: hechos, semilla: s * 7.3 + h * 1.9 + d });
  }
  if (window.Vivo && Vivo.tipo) Vivo.tipo("momentos", (a, t) => {
    const P = Vivo.piezas, prueba = !!PR().momento;
    if (!a.lista.length) return;
    if (a.k === undefined) { a.k = 0; a.cuando = prueba ? 0.6 : 30 + P.ruido(a.semilla) * 30; }
    for (;;) { const m = a.lista[a.k % a.lista.length]; if (t <= a.cuando + m.dura) break; a.cuando += m.dura + (prueba ? 2.4 : 100 + P.ruido(a.k * 1.7 + a.semilla) * 80); a.k++; }
    if (t < a.cuando) return;
    const m = a.lista[a.k % a.lista.length];
    try { m.dibuja(m, (t - a.cuando) / m.dura, t - a.cuando, P); if (m.gente) m.gente.forEach((g) => P.imagen(g.img, g.x, g.y)); }
    catch (err) { console.error("momento", m.id, err); a.lista = a.lista.filter((x) => x !== m); }
  });
  window.Momentos = { poner, LISTA, escena: ESCENA,
    util: { TAU, suave, sale, entra, tope, entre, deNoche, base, lienzo, tinte, figura, linea, capa, mascara, trozo, girada, halo, rayo, estallido, aro } };
})();
