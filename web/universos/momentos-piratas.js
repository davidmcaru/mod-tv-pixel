// momentos-piratas.js — la animación de cada escenario de Piratas: unos segundos de algo de ese sitio.
(function () {
  if (!window.Momentos || !Momentos.util) return;
  const { TAU, suave, sale, entra, tope, lienzo, linea, capa, mascara, trozo, girada, halo, rayo, estallido, aro } = Momentos.util;
  const tramo = (u, a, b) => tope((u - a) / (b - a));
  const env = (u, a, b, c, d) => (u <= a || u >= d ? 0 : u < b ? (u - a) / (b - a) : u <= c ? 1 : (d - u) / (d - c));
  const C = (luz, x) => (luz ? luz.color(x) : x);
  const tinteC = (cols, luz) => Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, C(luz, v)]));
  const tinteS = (cols, luz) => Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, luz ? luz.sprite(v) : v]));
  function trazo(P, x0, y0, x1, y1, col, a = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), cc = P.ctx;
    cc.globalAlpha = tope(a); cc.fillStyle = col;
    for (let i = 0; i <= n; i++) cc.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
    cc.globalAlpha = 1;
  }
  function elipseEn(cc, cx, cy, rx, ry, col) {
    cc.fillStyle = col;
    for (let y = Math.ceil(cy - ry); y <= Math.floor(cy + ry); y++) { const v = (y + 0.5 - cy) / ry, hw = rx * Math.sqrt(Math.max(0, 1 - v * v)); if (hw >= 0.5) cc.fillRect(Math.round(cx - hw), y, Math.max(1, Math.round(hw * 2)), 1); }
  }
  const hueco = (quienes, xs, ancho) => xs.find((x) => !quienes.some((q) => q.x < x + ancho / 2 && q.x + q.w > x - ancho / 2)) ?? xs[0];

  const KLAB = [
    ["..........MM..", "..........MMm.", "....HHH...S...", "...HHHHH..S...", "..HHhhhHH.S...", "..HhFFFhH.S...", "..HFEFEFH.S...", "..HhFFFhHSS...", "..HHHHHHHS....",
      "..CCCCCCC.....", ".CCcCCCcCC....", ".CCcCCCcCC....", ".CCcCCCcCC....", "..CCCCCCC.....", "..CcCCCcC.....", "..CC...CC.....", "..BB...BB.....", ".BBB...BBB...."],
    ["..............", "..............", "....HHH.......", "...HHHHH......", "..HHhhhHH.....", "..HhFFFhH.....", "..HFEFEFH.....", "..HhFFFhH.....", "..HHHHHHH.....",
      "..CCCCCCCS....", ".CCcCCCcC.S...", ".CCcCCCcC..S..", ".CCcCCCcC..S..", "..CCCCCCC...S.", "..CcCCCcC..MMM", "..CC...CC..MMm", "..BB...BB..MMm", ".BBB...BBB...."],
  ];
  const SOMBRERO = ["......KKKKK......", ".....KYYYYYK.....", "....KYYYyYYYK....", "....KRRRRRRRK....", ".KKKyrrrrrrryKKK.", "KYYYYYYYYYYYYYYYK", ".KKyyyyyyyyyyyKK.", "...KKKKKKKKKKK..."];
  const BELL = [
    ["B...............B", "BB.............BB", ".BB...........BB.", "..BBB...H...BBB..", "...BBBBHHHBBBB...", "....bBBWWWBBb....", "......bWWWb......", ".......TTT.......", "......T...T......"],
    [".................", ".................", "........H........", "...BBBBHHHBBBB...", "..BBBBBWWWBBBBB..", ".BB..bBWWWBb..BB.", "BB....bWWWb....BB", "B......TTT......B", "......T...T......"],
  ];
  const FANTASMA = [
    ["....GGGGG....", "..GGGGGGGGG..", ".GGGGGGGGGGG.", ".GGKKGGGKKGG.", "GGGKKGGGKKGGG", "GGGGGGGGGGGGG", "GGGGMMMMMGGGG", "GGGGMTTTMGGGG", "gGGGGTTTGGGGg",
      ".gGGGGTGGGGg.", ".gGGgGGGgGGg.", "..gG.gGg.Gg..", "...g..g..g..."],
    ["....GGGGG....", "..GGGGGGGGG..", ".GGGGGGGGGGG.", ".GGKKGGGKKGG.", "GGGKKGGGKKGGG", "GGGGGGGGGGGGG", "GGGGMMMMMGGGG", "GGGGMTTTMGGGG", "gGGGGTTTGGGGg",
      ".gGGGGTGGGGg.", "gGGgGGGgGGg..", ".Gg.gGg.Gg.g.", "..g..g..g...."],
  ];
  const CABEZA_DRAGON = ["..........C....C..", "...........C..C...", "......BBBBBCCB....", "....BBBBBBBBBBBB..", "..BBBBBBEEBBBBBBB.", ".BBBBBBBEKBBBBBBBB",
    "BBBBBBBBBBBBBBBBBB", "LLLLLBBBBBBBBBBBB.", ".TTTLLLLLBBBBBBB..", "..WTTTTLLLLLBBB...", "WW...WWW..........", "..........WWW....."];
  const LANA = ["......wWWWw.....", "....wWWWWWWWw...", "..KKwWWWWWWWWw..", ".KKKKWWWWWWWWWw.", "KEKKKWWWWWWWWWWw", "KKKKwWWWWWWWWWWw", ".KK.wWWWWWWWWWw.", ".....wwWWWWWww.."];
  const OVEJA = [
    [...LANA, "......K.K..K.K..", "......K.K..K.K..", "......K.K..K.K.."],
    [...LANA, ".......K.K..K.K.", "......K...KK...K", ".....K....K....K"],
    [...LANA, "......KK...KK...", "................", "................"],
  ];
  const SOLDADO = ["....KKKK....", "....KYYK....", "....KKKK....", "....KKKK....", "...KKKKKK...", "....SSSS....", "....SESE....", "....SSSS....", "...RRRRRR.L.",
    "..RRWRRWRRL.", "..RRRRRRRRL.", "..SRWRRWRSL.", "...RRRRRR...", "...YYYYYY...", "...BBBBBB...", "....BB......", "....BB......", "....BB......", "...KKK......"];
  const CORAZON = [".WW...WW.", "WPPW.WPPW", "WPLPWPPPW", "WPPPPPPPW", ".WPPPPPW.", "..WPPPW..", "...WPW...", "....W...."];
  const HIDRA = ["........DDDD............", "......DDPPPPDD..DD......", "....DDPPPPPPPPDDPPD.....", "...DPPPPPPLPPPPPPPPD....", "..DPPPEEPPPPPPPPPPPPD...",
    ".DPPPPEKPPPPPPLPPPPPPD..", "DPPPPPPPPPPPPPPPPPPPPPD.", "TTPPPPPPPPPPPPPPPPPPPPPD", ".TTTPPKKKKKPPPPPPPPPPPPD", "..KKKKKKKKKKKPPPPPPPPPD.", ".TTTKKKKKKKPPPPPPPPPPD..",
    "TTPPPPPPPPPPPPPPPPPPD...", "DPPPPPPPPPPPPPPPPPPD....", ".DDPPPPPPPPPPPPPPDD.....", "...DDDDPPPPPPPDD........", ".......DDDDDDD.........."];
  const ZEUS = ["..........WWWWW.........", "......WWWWWWWWWWWW......", "....WWWWWWWWWWWWWWWW....", "..WWWWWWKKWWWWWKKWWWWW..", ".WWWWWWWKKWWWWWKKWWWWWW.",
    "WWWWWWWWWWWWWWWWWWWWWWWW", "WWWWWKTTTTTTTTTTTKWWWWWW", "WWWWWWKTTTTTTTTTKWWWWWWW", ".GWWWWWKKKKKKKKKWWWWWWG.", "..GGWWWWWWWWWWWWWWWGG...", "....GGGDDGGGGDDGGG......"];
  const ESTRELLA = ["..W..", "..W..", "WWYWW", "..W..", "..W.."];
  const GOTA = [".L.", "LWL", "LLL", ".L."];
  const EXCLAMA = ["RR", "RR", "RR", "RR", "RR", "..", "RR"];
  const espada = (mango, rombo) => lienzo([".HHH.", ".HKH.", ".HHH.", ".HKH.", ".HHH.", ".HKH.", "GGGGG", ...Array(14).fill("..SL."), "..S..", "..s.."],
    { H: mango, K: rombo, G: "#e8c040", S: "#c8ccd4", L: "#ffffff", s: "#9aa0aa" });

  const E = {};

  E[1] = { nombre: "El Klabautermann", dura: 5.5,
    prepara({ luz }) {
      return { x: 184, y: 82, f: KLAB.map((g) => lienzo(g, { H: "#ece4cc", h: "#c4b896", F: "#3a3026", E: "#ffe680", C: "#f2ecd8", c: "#cfc4a6", M: "#a0703c", m: "#6e4a28", S: "#c89a62", B: "#5a4a3a" })) };
    },
    dibuja(m, u, t, P) {
      const a = u < 0.12 ? u / 0.12 : u > 0.86 ? (1 - u) / 0.14 : 1;
      if (u < 0.16 || u > 0.8) P.rapido();
      halo(P, m.x + 7, m.y + 9, 14, "#fff2c8", 0.45 * a);
      let f = 0, golpe = -1;
      if (u > 0.18 && u < 0.78) { const ci = ((u - 0.18) / 0.6) * 3, r = ci - Math.floor(ci); f = r > 0.7 ? 1 : 0; golpe = r > 0.7 ? (r - 0.7) / 0.3 : -1; P.rapido(); }
      P.imagen(m.f[f], m.x, m.y, a);
      if (golpe >= 0 && golpe < 0.7) { const g = golpe / 0.7, hx = m.x + 12, hy = m.y + 17; for (let i = 0; i < 7; i++) { const an = -Math.PI * (0.1 + i * 0.13); P.R(hx + Math.cos(an) * (2 + g * 7), hy + Math.sin(an) * (2 + g * 6), 1, 1, i % 2 ? "#fff2a0" : "#ffffff", 1 - g); } }
      if (u > 0.8) for (let i = 0; i < 12; i++) { const g = (u - 0.8) / 0.2; P.R(m.x + 2 + P.ruido(i) * 11, m.y + 16 - g * (8 + P.ruido(i + 5) * 16), 1, 1, i % 2 ? "#fff2a0" : "#cfe0ff", 1 - g); }
    } };

  E[2] = { nombre: "El Goan Cannon", dura: 5,
    prepara() { return { x: 303, y: 61 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const { x, y } = m;
      if (u < 0.38) {
        const g = u / 0.38;
        for (let i = 0; i < 20; i++) { const an = Math.PI * (0.6 + P.ruido(i) * 0.85), d = (1 - ((g * 2.2 + P.ruido(i + 9)) % 1)) * 44; P.R(x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, 1, 1, i % 3 ? "#9af0ff" : "#ffffff", 0.95); }
        halo(P, x, y, 3 + g * 9, "#9af0ff", 0.9); P.bola(x, y, 1 + g * 3, 1 + g * 3, "#ffffff", 1);
        return;
      }
      const g = tramo(u, 0.38, 1), a = g < 0.15 ? 1 : 1 - (g - 0.15) / 0.85;
      if (g < 0.06) P.R(0, 0, 320, 180, "#ffffff", 0.55 * (1 - g / 0.06));
      P.caja(0, 0, 320, 180);
      for (let k = 0; k < 15; k++) { const an = Math.PI * (0.55 + (k / 14) * 0.95) + Math.sin(t * 3 + k) * 0.02, L = (70 + P.ruido(k) * 170) * sale(tope(g * 3)); trazo(P, x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, k % 2 ? "#d8f8ff" : "#ffffff", a * (0.45 + P.ruido(k + 3) * 0.45)); }
      const gr = 6 * (1 - g * 0.5);
      P.R(x, y - gr, 320 - x, gr * 2, "#7ae0ff", 0.5 * a); P.R(x, y - gr * 0.5, 320 - x, gr, "#ffffff", 0.9 * a);
      halo(P, x, y, 18 * (1 - g * 0.5), "#bff4ff", a);
      aro(P, x, y, 8 + g * 44, 6 + g * 32, "#ffffff", 0.7 * (1 - g), 1);
    } };

  E[3] = { nombre: "El sombrero de paja, con el viento", dura: 6,
    prepara({ luz }) {
      return { img: lienzo(SOMBRERO, tinteS({ K: "#7a5420", Y: "#f2c84a", y: "#d8a838", R: "#c8282a", r: "#9a1c20" }, luz)), viento: C(luz, "#ffffff"), hojas: ["#5ea43c", "#7cc050", "#a8d860"].map((x) => C(luz, x)) };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const x = -24 + u * 368, y = 52 - Math.sin(u * Math.PI) * 22 + Math.sin(u * TAU * 2.2) * 7;
      girada(P, m.img, x, y, t * 5.5 + Math.sin(t * 3) * 0.8, 1, 2);
      for (let k = 0; k < 6; k++) { const f = (t * 0.9 + k / 6) % 1, wx = 50 + f * 290, wy = 16 + k * 12 + Math.sin(k * 2.1) * 4; P.R(wx, wy, 10 + (k % 3) * 6, 1, m.viento, 0.55 * Math.sin(f * Math.PI)); }
      for (let i = 0; i < 7; i++) { const f = tope(u * 1.3 - i * 0.05), hx = 70 + f * 260 + Math.sin(t * 4 + i) * 6, hy = 62 + i * 8 - f * 44 + Math.cos(t * 3 + i) * 5; if (f > 0 && f < 1) { const g = Math.floor(t * 8 + i) % 2; P.R(hx, hy, g ? 2 : 1, g ? 1 : 2, m.hojas[i % 3], 1); } }
    } };

  E[4] = { nombre: "El tajo de Mahawk", dura: 5, detras: true,
    prepara({ c }) {
      const x0 = 70, y0 = 46, x1 = 330, y1 = 60, linea_y = (x) => y0 + ((x - x0) * (y1 - y0)) / (x1 - x0);
      const todo = c.getImageData(0, 0, 320, 180), arriba = capa(320, 180), abajo = capa(320, 180), ia = arriba.c.createImageData(320, 180), ib = abajo.c.createImageData(320, 180);
      for (let y = 0; y < 180; y++) for (let x = 0; x < 320; x++) { const i = (y * 320 + x) * 4, dst = y < linea_y(x) ? ia : ib; for (let k = 0; k < 4; k++) dst.data[i + k] = todo.data[i + k]; }
      arriba.c.putImageData(ia, 0, 0); abajo.c.putImageData(ib, 0, 0);
      return { x0, y0, x1, y1, arriba: arriba.cv, abajo: abajo.cv };
    },
    dibuja(m, u, t, P) {
      const g = sale(tramo(u, 0, 0.2)), xt = m.x0 + (m.x1 - m.x0) * g, yt = m.y0 + (m.y1 - m.y0) * g;
      const abre = u < 0.2 ? 0 : u < 0.32 ? sale(tramo(u, 0.2, 0.32)) : u < 0.7 ? 1 : u < 0.9 ? 1 - suave(tramo(u, 0.7, 0.9)) : 0;
      if (u < 0.36 || (u > 0.68 && u < 0.92)) P.rapido();
      if (abre > 0) { const d = abre * 3, dy = (d * (m.y1 - m.y0)) / (m.x1 - m.x0); P.imagen(m.abajo, -d, -dy); P.imagen(m.arriba, d, dy); }
      const brillo = u < 0.2 ? 1 : 1 - tramo(u, 0.2, 0.55);
      if (brillo > 0) {
        P.caja(m.x0 - 2, m.y0 - 6, m.x1 - m.x0 + 4, m.y1 - m.y0 + 12);
        trazo(P, m.x0, m.y0 - 1, xt, yt - 1, "#7ae8d0", 0.6 * brillo); trazo(P, m.x0, m.y0 + 1, xt, yt + 1, "#7ae8d0", 0.6 * brillo); trazo(P, m.x0, m.y0, xt, yt, "#ffffff", brillo);
      }
      if (u < 0.22) { for (let k = -3; k <= 3; k++) { const w = 4 - Math.abs(k); P.R(xt - w * 2, yt + k, w * 3, 1, Math.abs(k) < 2 ? "#ffffff" : "#bff8ea", 0.95); } halo(P, xt, yt, 6, "#d8fff4", 0.8); }
    } };

  E[5] = { nombre: "La boca de Orlang Park", dura: 3.6, detras: true,
    prepara({ c }) {
      const X = 118, Y = 98, W = 84, H = 36, boca = c.getImageData(X, Y, W, H), cx = 160 - X, cy = 116 - Y, rx = 39, ry = 15;
      const forma = capa(W, H); elipseEn(forma.c, cx, cy, rx, ry, "#ffffff");
      const dientes = (j0, j1) => { const l = capa(W, j1 - j0), img = l.c.createImageData(W, j1 - j0);
        for (let j = j0; j < j1; j++) for (let i = 0; i < W; i++) { const s = ((j - Y) * W + i) * 4, o = ((j - j0) * W + i) * 4, d = boca.data; if (d[s] > 170 && d[s + 1] > 160) { img.data[o] = d[s]; img.data[o + 1] = d[s + 1]; img.data[o + 2] = d[s + 2]; img.data[o + 3] = 255; } }
        l.c.putImageData(img, 0, 0); return l.cv; };
      const px = (x, y) => { const d = c.getImageData(x, y, 1, 1).data; return `rgb(${d[0]},${d[1]},${d[2]})`; };
      return { X, Y, W, H, forma: forma.cv, arriba: dientes(100, 115), abajo: dientes(116, 133), oscuro: px(160, 116), labio: px(160, 97), l: capa(W, H) };
    },
    dibuja(m, u, t, P) {
      const k = u < 0.08 ? 0 : u < 0.2 ? entra(tramo(u, 0.08, 0.2)) : u < 0.32 ? 1 : u < 0.42 ? 1 - sale(tramo(u, 0.32, 0.42)) : u < 0.5 ? 0 : u < 0.6 ? entra(tramo(u, 0.5, 0.6)) : u < 0.74 ? 1 : u < 0.86 ? 1 - sale(tramo(u, 0.74, 0.86)) : 0;
      if (u > 0.05 && u < 0.9) P.rapido();
      if (k <= 0) return;
      const L = m.l, cc = L.limpia(), d = Math.round(k * 7), tiembla = k > 0.98 ? (Math.floor(t * 30) % 2) : 0;
      cc.fillStyle = m.oscuro; cc.fillRect(0, 0, m.W, m.H);
      cc.fillStyle = m.labio; cc.fillRect(0, 0, m.W, 2 + d); cc.fillRect(0, m.H - 1 - d, m.W, 1 + d);
      cc.drawImage(m.abajo, tiembla, 18 - d); cc.drawImage(m.arriba, -tiembla, 2 + d);
      L.recorta(m.forma);
      P.imagen(L.cv, m.X, m.Y);
      if (k > 0.98) for (let s = 0; s < 2; s++) { const lado = s ? 1 : -1, bx = 160 + lado * 44, by = 116; for (let i = 0; i < 3; i++) P.R(bx + lado * (2 + i * 3), by - 5 + i * 5, 3, 1, "#ffffff", 0.85); }
    } };

  E[6] = { nombre: "Bell y la bomba", dura: 6,
    prepara({ luz }) { return { f: BELL.map((g) => lienzo(g, tinteS({ B: "#7a5232", b: "#5a3a20", H: "#4a3218", W: "#efe6d4", T: "#e0a830" }, luz))) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.5) {
        const g = u / 0.5, x = 165 - g * 37 + Math.sin(g * TAU * 1.5) * 10, y = 70 - g * 48, esc = g < 0.5 ? 2 : 1;
        girada(P, m.f[Math.floor(t / 0.12) % 2], x, y, 0, 1, esc);
        const by = y + 9 * esc, rb = 2 + esc * 1.5; P.bola(x, by, rb, rb, "#26262c", 1); P.R(x - 1, by - rb + 1, 1, 1, "#8a8a96");
        if (Math.floor(t * 12) % 2) P.R(x + 2, by - rb - 1, 1, 1, "#ffe06a");
        return;
      }
      const f = tramo(u, 0.5, 1);
      if (f < 0.05) P.R(0, 0, 320, 180, "#fff6dc", 0.4 * (1 - f / 0.05));
      estallido(P, 128, 24, f, 40, ["#fff6c8", "#ffd23a", "#ff8a2a", "#d8401c"], "#6a5a50", 2);
      if (f > 0.08 && f < 0.7) { aro(P, 128, 24, 12 + f * 100, 7 + f * 56, "#fff2c8", (0.7 - f) * 1.4, 0); aro(P, 128, 24, 10 + f * 92, 6 + f * 50, "#ffd23a", 0.7 - f, 1); }
    } };

  E[7] = { nombre: "La campana de Shondara", dura: 5.5,
    prepara({ c }) {
      const X = 110, Y = 40, W = 64, H = 68, oro = mascara(c, X, Y, W, H, (r, g, b) => r > 170 && g > 120 && b < 130 && r - b > 70);
      return { X, Y, W, H, oro, brillo: capa(W, H), cx: 142, cy: 76 };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const golpes = [0.06, 0.38, 0.7];
      golpes.forEach((u0, i) => {
        const f = tramo(u, u0, u0 + 0.42);
        if (f <= 0 || f >= 1) return;
        aro(P, m.cx, m.cy, 14 + f * 130, 9 + f * 74, "#ffd84a", 1 - f, 0);
        aro(P, m.cx, m.cy, 15 + f * 130, 10 + f * 74, "#fff6d0", (1 - f) * 0.9, 0);
        aro(P, m.cx, m.cy, 10 + f * 118, 6 + f * 66, "#ffe48a", (1 - f) * 0.7, 1);
        if (f < 0.5) for (let k = 0; k < 8; k++) { const an = P.ruido(k + i * 9) * TAU, d = 30 + P.ruido(k + 40 + i) * 26; if ((k + Math.floor(t * 10)) % 2) P.R(m.cx + Math.cos(an) * d, m.cy + Math.sin(an) * d * 0.7, 1, 1, "#ffffff", 1 - f * 2); }
        if (f < 0.3) for (let s = 0; s < 2; s++) { const lado = s ? 1 : -1; for (let k = 0; k < 2; k++) { const r = 4 + k * 4 + f * 10; for (let j = -3; j <= 3; j++) P.R(m.cx + lado * (24 + r), m.cy + j * 2, 1, 1, "#fff2a0", 1 - f / 0.3); } }
        if (f < 0.45) halo(P, m.cx, m.cy, 28, "#fff2a0", (1 - f / 0.45) * 0.8);
      });
      const g = (u * 2.2) % 1, L = m.brillo, cc = L.limpia();
      cc.fillStyle = "#ffffff";
      for (let j = 0; j < m.H; j++) { const x = -20 + g * (m.W + 40) - j * 0.5; cc.fillRect(Math.round(x), j, 4, 1); cc.globalAlpha = 0.55; cc.fillRect(Math.round(x) + 4, j, 4, 1); cc.globalAlpha = 1; }
      L.recorta(m.oro); P.imagen(L.cv, m.X, m.Y, 1);
    } };

  E[8] = { nombre: "La gran fuente y el arcoíris", dura: 6.5,
    prepara() {
      const arco = capa(160, 80), COLS = ["#ff5a5a", "#ffa040", "#ffe060", "#6ad870", "#5ab0ff", "#8a6aff"];
      COLS.forEach((col, i) => { const r = 70 - i * 2; arco.c.fillStyle = col; for (let k = 0; k <= 400; k++) { const an = Math.PI + (k / 400) * Math.PI; arco.c.fillRect(Math.round(80 + Math.cos(an) * r), Math.round(78 + Math.sin(an) * r * 0.9), 1, 2); } });
      return { arco: arco.cv, x: 159, y: 38 };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const fuerza = env(u, 0.02, 0.2, 0.75, 0.92);
      if (u > 0.25) P.imagen(m.arco, 79, 22, 0.48 * env(u, 0.25, 0.45, 0.85, 1));
      for (let j = 0; j < 8; j++) {
        const lado = j % 2 ? 1 : -1, vx = lado * (0.45 + (j >> 1) * 0.28), vy = 1.4 + (j % 3) * 0.25;
        for (let i = 0; i < 16; i++) {
          const s = ((t * 1.3 + i / 16) % 1) * 40, x = m.x + vx * s, y = m.y - vy * s + 0.055 * s * s;
          if (s / 40 > fuerza) continue;
          P.R(x, y, 2, 2, i % 3 ? "#ffffff" : "#4aa8e8", 1);
        }
      }
      if (fuerza > 0.3) { halo(P, m.x, m.y - 2, 5, "#e8f8ff", fuerza); P.R(m.x - 1, m.y - 14 * fuerza, 3, 14 * fuerza, "#e8f8ff", 0.9); }
    } };

  E[9] = { nombre: "Los fantasmas de Porena", dura: 6.5,
    prepara() {
      const cols = { G: "#f4f6ff", g: "#c8d0e8", K: "#2a2a3a", M: "#5a3040", T: "#e8789a" };
      return { der: FANTASMA.map((f) => lienzo(f, cols)), izq: FANTASMA.map((f) => lienzo(f, cols, true)) };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      for (let i = 0; i < 3; i++) {
        const sale0 = u > 0.82 ? entra((u - 0.82) / 0.18) : 0, nace = tope((u - i * 0.06) / 0.14);
        if (nace <= 0) continue;
        const x = 160 + (Math.sin(t * 1.3 + i * 2.1) * 55 + Math.sin(t * 2.7 + i) * 10) * nace, y = 64 + (Math.sin(t * 1.9 + i * 1.3) * 22 + Math.cos(t * 3.1 + i) * 4) * nace - sale0 * (90 + i * 20);
        const vx = Math.cos(t * 1.3 + i * 2.1), f = (vx > 0 ? m.der : m.izq)[Math.floor(t * 5 + i) % 2], a = 0.9 * nace * (1 - sale0 * 0.6), esc = i < 2 ? 2 : 1;
        girada(P, f, x - vx * 6, y, 0, a * 0.25, esc);
        girada(P, f, x, y, 0, a, esc);
        if (Math.floor(t * 3 + i) % 3 === 0) P.R(x + 7 * esc, y - 7 * esc, 1, 1, "#ffb8d0", a);
      }
    } };

  E[10] = { nombre: "La burbuja gigante", dura: 6.5, detras: true,
    prepara() { return { x: 174, y0: 138, y1: 34 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const sube = tope(u / 0.8), x = m.x + Math.sin(t * 2.2) * 5, y = m.y0 - (m.y0 - m.y1) * suave(sube), r = 5 + tope(u / 0.25) * 13 + Math.sin(t * 6) * 0.6;
      for (let i = 0; i < 5; i++) { const f = (t * 0.35 + i / 5) % 1; if (u < 0.85) aro(P, m.x + Math.sin(i * 2 + t) * 14, m.y0 - f * 90, 1.5, 1.5, "#eafcff", 0.8 * (1 - f), 0); }
      if (u < 0.8) {
        aro(P, x, y, r + 1, r + 1, "#3a90c0", 0.7, 0);
        aro(P, x, y, r, r * (1 + Math.sin(t * 5) * 0.05), "#ffffff", 1, 0);
        aro(P, x, y, r - 1, r - 1, "#dff6ff", 0.8, 0);
        aro(P, x, y, r - 1, r - 1, "#a8e8ff", 0.4, 1);
        for (let k = 0; k < 18; k++) { const an = 0.3 + k * 0.12 + t * 0.6; P.R(x + Math.cos(an) * (r - 1), y + Math.sin(an) * (r - 1), 1, 1, k % 3 === 0 ? "#ffb8e8" : k % 3 === 1 ? "#b8f0ff" : "#fff2a8", 0.95); }
        P.R(x - r * 0.45, y - r * 0.6, 4, 1, "#ffffff"); P.R(x - r * 0.62, y - r * 0.42, 1, 4, "#ffffff"); P.R(x + r * 0.4, y + r * 0.45, 2, 1, "#ffffff", 0.7);
      } else {
        const g = (u - 0.8) / 0.2;
        for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU, d = r + g * 16; P.R(x + Math.cos(an) * d, y + Math.sin(an) * d + g * g * 8, 1, 1, i % 2 ? "#ffffff" : "#b8f0ff", 1 - g); }
        aro(P, x, y, r + g * 7, r + g * 7, "#ffffff", (1 - g) * 0.6, 2);
      }
    } };

  E[11] = { nombre: "El terremoto de Barbanieve", dura: 4.8,
    prepara() {
      const cx = 150, cy = 40, seg = [];
      let sem = 7;
      const rnd = () => { sem = (sem * 9301 + 49297) % 233280; return sem / 233280; };
      for (let b = 0; b < 9; b++) {
        let an = (b / 9) * TAU + rnd() * 0.5, x = cx, y = cy, d = 0;
        const L = 24 + rnd() * 36, l = L / 7;
        for (let i = 0; i < 7; i++) {
          an += (rnd() - 0.5) * 0.9;
          const nx = x + Math.cos(an) * l, ny = y + Math.sin(an) * l * 0.8;
          seg.push([x, y, nx, ny, d]); d += l;
          if (i === 3 && rnd() < 0.75) { let a2 = an + (rnd() < 0.5 ? 0.8 : -0.8), x2 = nx, y2 = ny, d2 = d; for (let j = 0; j < 3; j++) { a2 += (rnd() - 0.5) * 0.6; const n2x = x2 + Math.cos(a2) * l * 0.8, n2y = y2 + Math.sin(a2) * l * 0.6; seg.push([x2, y2, n2x, n2y, d2]); d2 += l; x2 = n2x; y2 = n2y; } }
          x = nx; y = ny;
        }
      }
      return { cx, cy, seg };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const crece = sale(tramo(u, 0.04, 0.24)) * 62, a = u > 0.7 ? 1 - (u - 0.7) / 0.3 : 1;
      if (u < 0.06) P.R(0, 0, 320, 180, "#ffffff", 0.35 * (1 - u / 0.06));
      P.caja(m.cx - 70, m.cy - 60, 140, 120);
      m.seg.forEach(([x0, y0, x1, y1, d]) => { if (d > crece) return; trazo(P, x0 + 1, y0, x1 + 1, y1, "#9ad8ff", 0.5 * a); trazo(P, x0, y0, x1, y1, "#ffffff", a); });
      halo(P, m.cx, m.cy, 6 + Math.sin(t * 20), "#e0f4ff", a);
      const g = tramo(u, 0.08, 0.68);
      if (g > 0 && g < 1) { aro(P, m.cx, m.cy, 8 + g * 160, 5 + g * 96, "#ffffff", (1 - g) * 0.85, 0); aro(P, m.cx, m.cy, 4 + g * 148, 3 + g * 88, "#bfe6ff", (1 - g) * 0.5, 1); }
      if (u > 0.2 && u < 0.92) for (let i = 0; i < 28; i++) { const x = 80 + ((i * 47 + t * 70) % 140), y = 108 + (i % 7) * 5 + Math.sin(t * 6 + i) * 1.5; P.R(x, y, 3 + (i % 3), 1, "#e8f6ff", 0.75 * a); }
    } };

  E[12] = { nombre: "El dragón azul", dura: 8, vale: ({ quien }) => !quien("Kiado"),
    prepara({ luz }) {
      const k = tinteC({ B: "#3a62c8", L: "#bcd8f4", C: "#e8e0a8", T: "#1a2450", W: "#f4f0e0", K: "#d8202a", e: "#2a4696" }, luz);
      return { k, cabeza: lienzo(CABEZA_DRAGON, { ...k, E: "#ffe060" }) };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const N = 44, cabeza = 380 - u * 600, Y = (x) => 34 + Math.sin(x / 30 + t * 1.6) * 10 + Math.sin(x / 70) * 6;
      for (let i = N - 1; i >= 1; i--) {
        const x = cabeza + 14 + i * 5, r = 8 - (i / N) * 5, y = Y(x);
        if (x < -12 || x > 332) continue;
        P.bola(x, y, r + 0.8, r, m.k.B, 1);
        P.R(x - 2, y + r - 2.5, 4, 2.5, m.k.L, 1);
        if (i % 2 === 0) P.R(x, y - r * 0.4, 1, 1, m.k.e, 1);
        if (i % 4 === 1) { P.R(x, y - r - 2, 1, 3, m.k.C, 1); P.R(x + 1, y - r - 1, 1, 2, m.k.C, 1); }
        if (i === 9 || i === 30) { P.R(x - 2, y + r, 1, 4, m.k.B); P.R(x - 3, y + r + 3, 3, 1, m.k.C); }
        if (i === N - 1) { P.R(x + 4, y - 3, 4, 1, m.k.C); P.R(x + 4, y + 2, 4, 1, m.k.C); }
      }
      girada(P, m.cabeza, cabeza - 4, Y(cabeza + 14) - 3, 0, 1, 2);
    } };

  E[13] = { nombre: "La sombra del Rey del Mar", dura: 8,
    prepara({ c }) { return { agua: mascara(c, 0, 0, 320, 90, (r, g, b) => b > 80 && r < 80 && b > g && g < 140), l: capa(320, 90) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const L = m.l, cc = L.limpia(), cab = -50 + u * 420, Y = (x) => 46 + Math.sin(x / 30 - t * 1.4) * 6;
      for (let i = 34; i >= 0; i--) {
        const x = cab - i * 4.5, r = i < 3 ? 8 : 8 - (i / 34) * 5.5;
        elipseEn(cc, x, Y(x), r + 1, r, "#0a1630");
        if (i % 4 === 1) elipseEn(cc, x, Y(x) - r - 1, 1.5, 3, "#0a1630");
      }
      elipseEn(cc, cab + 7, Y(cab) + 1, 9, 6, "#0a1630");
      cc.fillStyle = "#ffe46a"; cc.fillRect(Math.round(cab + 8), Math.round(Y(cab) - 3), 2, 2); cc.fillRect(Math.round(cab + 3), Math.round(Y(cab) - 3), 2, 2);
      L.recorta(m.agua);
      P.imagen(L.cv, 0, 0, 0.72 * env(u, 0, 0.1, 0.9, 1));
    } };

  E[14] = { nombre: "El soldadito de juguete", dura: 7, detras: true,
    prepara({ luz }) { return { img: lienzo(SOLDADO, tinteS({ K: "#1e1c24", Y: "#f2c84b", S: "#f4d2b0", E: "#2a2028", R: "#c8282a", W: "#ffffff", B: "#2a4a9a", L: "#dfe4ec" }, luz)) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const x = -16 + u * 352, salto = Math.abs(Math.sin(t * 7)), y = 150 - salto * 8;
      girada(P, m.img, x + 6, y + 10, Math.sin(t * 7) * 0.08, 1, 1.5);
      if (salto < 0.2) for (let k = 0; k < 3; k++) P.R(x + 2 + k * 3, 174, 2, 1, "#e8d8b0", 0.85);
    } };

  E[15] = { nombre: "La aurora sobre Albef", dura: 9,
    prepara({ c }) { return { cielo: mascara(c, 0, 0, 320, 100, (r, g, b) => b > r + 6 && b >= g - 4 && r + g + b < 360 && b > 30), l: capa(320, 100) }; },
    dibuja(m, u, t, P) {
      const L = m.l, cc = L.limpia();
      for (let x = 0; x < 320; x += 2) {
        const I = 0.5 + 0.5 * Math.sin(x / 23 + t * 0.7) * Math.sin(x / 57 - t * 0.45), yt = 10 + 10 * Math.sin(x / 40 + t * 0.5), alto = 22 + 22 * I;
        [["#a070ff", 0, 0.35], ["#4ae0d0", 0.3, 0.6], ["#5aff9a", 0.62, 1]].forEach(([col, a0, a1]) => { cc.globalAlpha = (0.25 + 0.6 * I) * (a0 < 0.3 ? 0.6 : 1); cc.fillStyle = col; cc.fillRect(x, Math.round(yt + alto * a0), 2, Math.max(1, Math.round(alto * (a1 - a0)))); });
        if (I > 0.82) { cc.globalAlpha = 0.5; cc.fillStyle = "#d8fff0"; cc.fillRect(x, Math.round(yt + alto * 0.4), 1, Math.round(alto * 0.6)); }
      }
      cc.globalAlpha = 1;
      L.recorta(m.cielo);
      P.imagen(L.cv, 0, 0, 0.88 * env(u, 0, 0.2, 0.8, 1));
    } };

  E[16] = { nombre: "Las tres espadas de Korro", dura: 5, detras: true,
    prepara({ quienes }) {
      const x = hueco(quienes, [196, 90, 150, 124, 176], 30);
      return { x, s: [espada("#f2f2ee", "#2a2a3a"), espada("#c83a3a", "#1a1a1a"), espada("#2a2a34", "#c8a040")] };
    },
    dibuja(m, u, t, P) {
      m.s.forEach((img, i) => {
        const u0 = 0.04 + i * 0.09, g = tramo(u, u0, u0 + 0.3), lx = m.x - 10 + i * 10, ly = 153, a = u > 0.88 ? (1 - u) / 0.12 : 1;
        if (g <= 0) return;
        if (g < 1) {
          P.rapido();
          const sx = 340 + i * 10, sy = 34 + i * 8, x = sx + (lx - sx) * g, y = sy + (ly - 15 - sy) * g - Math.sin(g * Math.PI) * 40;
          girada(P, img, x, y, t * 14 + i, a, 1.5);
          return;
        }
        const tras = (u - u0 - 0.3) * m.dura, vib = tras < 0.5 ? Math.sin(tras * 40) * 0.06 * (1 - tras / 0.5) : 0;
        if (tras < 0.5) P.rapido();
        girada(P, img, lx + Math.sin(vib) * 15, ly - 15, (i - 1) * 0.12 + vib, a, 1.5);
        if (tras < 0.45) for (let k = 0; k < 5; k++) P.bola(lx - 4 + k * 2, ly + 1 - tras * 6, 2 + tras * 5, 1.5 + tras * 3, "#e8d8b0", (0.45 - tras) * 1.8);
      });
    } };

  E[17] = { nombre: "La bala de Vuggy", dura: 5,
    prepara() { return { x0: 82, y0: 118, x1: 204, y1: 52 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.36) {
        const g = u / 0.36, X = (gg) => m.x0 + (m.x1 - m.x0) * gg, Y = (gg) => m.y0 + (m.y1 - m.y0) * gg - Math.sin(gg * Math.PI) * 70;
        for (let k = 1; k < 7; k++) { const gg = g - k * 0.025; if (gg > 0) P.bola(X(gg), Y(gg), 1.5 + k * 0.3, 1.5 + k * 0.3, "#8a8088", 0.6 - k * 0.08); }
        P.bola(X(g), Y(g), 4.5, 4.5, "#24222a", 1); P.R(X(g) - 2, Y(g) - 3, 2, 1, "#9a96a8");
        if (Math.floor(t * 14) % 2) { P.R(X(g) + 3, Y(g) - 5, 1, 1, "#ffe06a"); P.R(X(g) + 4, Y(g) - 6, 1, 1, "#ff8a2a"); }
        return;
      }
      const f = tramo(u, 0.36, 1);
      if (f < 0.05) P.R(0, 0, 320, 180, "#fff2d0", 0.45 * (1 - f / 0.05));
      estallido(P, m.x1, m.y1, f, 40, undefined, "#6a6062", 5);
      if (f > 0.08 && f < 0.6) aro(P, m.x1, m.y1, 12 + f * 90, 8 + f * 60, "#fff2c8", (0.6 - f) * 1.5, 0);
      for (let i = 0; i < 10; i++) { const an = -Math.PI * (0.1 + P.ruido(i + 40) * 0.8), v = 30 + P.ruido(i + 50) * 30, x = m.x1 + Math.cos(an) * v * f, y = m.y1 + Math.sin(an) * v * f + 50 * f * f; P.R(x, y, 2, 1, i % 2 ? "#a8442c" : "#7a4a30", 1 - f); }
    } };

  E[18] = { nombre: "La oveja que salta", dura: 6,
    prepara({ luz }) {
      const cols = tinteC({ W: "#f4f2ea", w: "#d8d4c8", K: "#2a2624", E: "#f4f4f4" }, luz);
      return { izq: OVEJA.map((g) => lienzo(g, cols)), der: OVEJA.map((g) => lienzo(g, cols, true)), suelo: 176 };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      let x, y = m.suelo - 11, f = Math.floor(t * 8) % 2, mira = m.izq, bala = false;
      if (u < 0.15) x = 330 - (u / 0.15) * 38;
      else if (u < 0.3) { const g = (u - 0.15) / 0.15; x = 292 - g * 46; y -= Math.sin(g * Math.PI) * 26; f = 2; }
      else if (u < 0.4) x = 246 - ((u - 0.3) / 0.1) * 24;
      else if (u < 0.62) { x = 228; f = 0; bala = true; }
      else { x = 228 + ((u - 0.62) / 0.38) * 112; mira = m.der; }
      P.imagen(mira[f], x, y);
      if (bala) { const g = ((u - 0.4) / 0.22) * 2 % 1; for (let k = 0; k < 3; k++) { const r = 3 + k * 4 + g * 4; for (let j = -3; j <= 3; j++) P.R(x - r, y + 4 + j * 1.5, 1, 1, "#ffffff", 0.95 - k * 0.25); } }
    } };

  E[19] = { nombre: "El rayo en el cadalso", dura: 3.8,
    prepara() { return { x: 162, y: 15 }; },
    dibuja(m, u, t, P) {
      if (u < 0.5) P.rapido();
      const destello = u < 0.08 ? 1 - u / 0.08 : u > 0.18 && u < 0.24 ? 0.6 * (1 - (u - 0.18) / 0.06) : 0;
      if (destello > 0) P.R(0, 0, 320, 180, "#f4f8ff", 0.7 * destello);
      if (u < 0.12 || (u > 0.18 && u < 0.28)) { const s = Math.floor(t * 30); rayo(P, m.x + 14, -2, m.x, m.y, s, "#ffffff", "#bfe0ff", 8, 0.5); rayo(P, 132, -4, 126, 94, s + 3, "#ffffff", "#bfe0ff", 12, 0.35); rayo(P, 129, 40, 104, 70, s + 9, "#e8f4ff", "#9ad0ff", 4, 0.4, 0.8); halo(P, 126, 94, 7, "#e8f4ff", 0.9); }
      const g = tramo(u, 0.05, 0.95);
      if (u > 0.05) for (let i = 0; i < 3; i++) { const fx = m.x - 18 + i * 18, al = (4 + P.ruido(i + Math.floor(t * 10)) * 4) * (1 - g * 0.8); for (let k = 0; k < 4; k++) P.R(fx + k - 1, m.y - al * (1 - k * 0.15), 1, al * (1 - k * 0.2), ["#ffe06a", "#ff9a3a", "#e8502a"][k % 3], 0.95 * (1 - g)); }
      if (u > 0.05 && u < 0.4) for (let i = 0; i < 12; i++) { const gg = (u - 0.05) / 0.35, an = Math.PI + P.ruido(i) * Math.PI, d = gg * (10 + P.ruido(i + 3) * 16); P.R(m.x + Math.cos(an) * d, m.y + Math.sin(an) * d * 0.6 + gg * gg * 12, 1, 1, "#fff2a0", 1 - gg); }
      if (u > 0.4) for (let i = 0; i < 4; i++) { const f = (t * 0.6 + i / 4) % 1; P.bola(m.x - 10 + i * 7 + f * 6, m.y - 4 - f * 18, 2 + f * 3, 2 + f * 2, "#9a96a0", (1 - f) * 0.5 * (1 - g)); }
    } };

  E[20] = { nombre: "El resoplido de Loboan", dura: 6,
    prepara() { return { x: 85, y: 99 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const fuerza = env(u, 0.06, 0.2, 0.62, 0.8);
      for (let i = 0; i < 64; i++) {
        const tau = ((t * 0.9 + i / 64) % 1) * 1.6, x = m.x + (P.ruido(i) - 0.5) * 44 * tau, y = m.y - 120 * tau + 58 * tau * tau;
        if (tau / 1.6 > fuerza + 0.05 || fuerza <= 0) continue;
        P.R(x, y, 2, 2, i % 3 ? "#ffffff" : "#8acfee", 0.95);
      }
      if (fuerza > 0.2) { P.R(m.x - 2, m.y - 40 * fuerza, 4, 40 * fuerza, "#eafaff", 0.85); halo(P, m.x, m.y - 2, 4, "#ffffff", fuerza); }
      [0.3, 0.45, 0.6].forEach((u0) => { const f = tramo(u, u0, u0 + 0.35); if (f <= 0 || f >= 1) return; const r = 12 + f * 70; for (let k = 0; k < 22; k++) { const an = -1.25 + (k / 22) * 1.1; if (k % 2) P.R(m.x + 10 + Math.cos(an) * r, m.y + 8 + Math.sin(an) * r, 2, 1, "#ffffff", (1 - f) * 0.8); } });
    } };

  E[21] = { nombre: "Los fuegos de la bienvenida", dura: 7,
    prepara() { return { c: [[0.02, 120, 30, "#e8402a", "#7ae8c0"], [0.2, 196, 24, "#f2c84b", "#e86aa8"], [0.36, 152, 46, "#7ae8c0", "#ffe6a0"], [0.52, 222, 38, "#e86aa8", "#f2c84b"]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.c.forEach(([u0, bx, by, c1, c2], k) => {
        const sube = (u - u0) / 0.1;
        if (sube >= 0 && sube < 1) for (let i = 0; i < 6; i++) { const s = Math.max(0, sube - i * 0.04); P.R(155 + (bx - 155) * s, 132 + (by - 132) * suave(s), 1, i ? 1 : 2, i ? "#ffb43a" : "#fff2c8", 1 - i * 0.15); }
        const f = (u - u0 - 0.1) / 0.34;
        if (f < 0 || f >= 1) return;
        if (f < 0.1) halo(P, bx, by, 9, "#fff6d8", 1 - f / 0.1);
        for (let i = 0; i < 36; i++) {
          const an = (i / 36) * TAU + k, v = 36 * (0.75 + P.ruido(i + k * 30) * 0.4), d = v * sale(f), x = bx + Math.cos(an) * d, y = by + Math.sin(an) * d + f * f * 16, col = i % 2 ? c1 : c2, a = f > 0.7 ? (1 - f) / 0.3 : 1;
          P.R(x, y, 2, 2, col, a); for (let q = 1; q <= 3; q++) P.R(x - Math.cos(an) * q * 2, y - Math.sin(an) * q * 2, 1, 1, col, a * (0.7 - q * 0.18));
          if (f > 0.55 && (i + Math.floor(t * 12)) % 3 === 0) P.R(x, y, 1, 1, "#ffffff", a);
        }
      });
    } };

  E[22] = { nombre: "La erupción del volcán", dura: 6.5,
    prepara() { return { x: 160, y: 36 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = u > 0.85 ? (1 - u) / 0.15 : 1, g = tramo(u, 0.12, 0.27);
      halo(P, m.x, m.y, 7 + tope(u / 0.15) * 6 + Math.sin(t * 15), "#ffb43a", a);
      if (u > 0.12) for (let i = 0; i < 12; i++) { const f = (t * 0.45 + i / 12) % 1; if (f > g) continue; P.bola(m.x + Math.sin(f * 5 + i) * 5 + f * 22, m.y - 4 - f * 64, 5 + f * 14, 4 + f * 11, f < 0.3 ? "#4a3a3a" : "#6a6068", (1 - f * 0.55) * a); }
      if (u > 0.15 && u < 0.8) for (let i = 0; i < 18; i++) { const f = (t * 1.8 + i / 18) % 1; P.R(m.x - 4 + P.ruido(i) * 8 + (P.ruido(i + 4) - 0.5) * f * 20, m.y - f * 24 + f * f * 14, 2, 2, f < 0.5 ? "#fff0a0" : "#ff8a2a", 1 - f); }
      for (let i = 0; i < 9; i++) {
        const t0 = 0.15 + i * 0.07, f = (u - t0) / 0.28;
        if (f < 0 || f > 1) continue;
        const vx = (P.ruido(i + 11) - 0.5) * 80, vy = 30 + P.ruido(i + 21) * 18, X = (ff) => m.x + vx * ff, Y = (ff) => m.y - vy * ff * 1.6 + 60 * ff * ff;
        for (let k = 1; k < 5; k++) { const ff = f - k * 0.03; if (ff > 0) P.R(X(ff), Y(ff), 1, 1, "#8a7070", 0.6 - k * 0.1); }
        P.bola(X(f), Y(f), 2.6, 2.6, "#ff6a2a", 1); P.R(X(f) - 1, Y(f) - 1, 2, 1, "#ffe06a");
      }
    } };

  E[23] = { nombre: "Los cerezos de Huliluk", dura: 8.5, detras: true,
    prepara({ c }) {
      const nieve = mascara(c, 0, 0, 320, 180, (r, g, b) => r > 205 && g > 205 && b > 205), rosa = capa(320, 180);
      rosa.c.fillStyle = "#ff9acb"; rosa.c.fillRect(0, 0, 320, 180); rosa.recorta(nieve);
      return { rosa: rosa.cv, x: 163, y: 8 };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const tinte = env(u, 0.18, 0.4, 0.82, 1);
      if (tinte > 0) P.imagen(m.rosa, 0, 0, 0.45 * tinte);
      if (u < 0.12) { const g = u / 0.12; P.R(m.x, 22 - g * 14, 1, 3, "#ffb8d8"); halo(P, m.x, 22, 3, "#ffffff", 1 - g); }
      const b = tramo(u, 0.1, 0.32);
      if (b > 0 && b < 1) { halo(P, m.x, m.y, 6 + b * 14, "#ffc8e4", 1 - b); for (let i = 0; i < 24; i++) { const an = (i / 24) * TAU, d = sale(b) * 26; P.R(m.x + Math.cos(an) * d, m.y + Math.sin(an) * d * 0.7 + b * b * 8, 1, 1, i % 2 ? "#ff8ac0" : "#ffffff", 1 - b); } }
      const lluvia = env(u, 0.14, 0.3, 0.86, 1);
      if (lluvia > 0) for (let i = 0; i < 80; i++) {
        const x = P.ruido(i) * 340 - 10 + Math.sin(t * 1.3 + i) * 8, y = -6 + ((t * 18 + P.ruido(i + 3) * 190) % 192), g = Math.floor(t * 4 + i) % 2;
        if (y > 30 + (1 - lluvia) * 150) continue;
        P.R(x, y, g ? 2 : 1, g ? 1 : 2, ["#ffb8d8", "#ff8ac0", "#ffe0ee"][i % 3], 0.95);
      }
    } };

  E[24] = { nombre: "El Kick Up Stream", dura: 7,
    prepara({ c }) { return { X: 186, cielo: mascara(c, 186, 0, 76, 130, (r, g, b) => b > 180 && b - r > 30), l: capa(76, 130) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const L = m.l, cc = L.limpia(), sube = sale(tramo(u, 0.04, 0.3)), arriba = 128 - sube * 140, a = env(u, 0, 0.05, 0.78, 1), cx = 36;
      for (let y = Math.max(0, Math.floor(arriba)); y < 130; y++) {
        const w = 9 + (128 - y) * 0.14 + Math.sin(y / 5 + t * 6);
        for (let x = Math.round(cx - w); x <= Math.round(cx + w); x++) { const v = (Math.abs(x - cx) * 7 + Math.floor((y + t * 70) / 5) * (x % 3 ? 1 : 2)) % 6, borde = Math.abs(x - cx) > w - 2; cc.fillStyle = borde ? "#3a8ad0" : v < 2 ? "#ffffff" : v < 4 ? "#c8ecff" : "#6ab8e8"; cc.fillRect(x, y, 1, 1); }
      }
      if (sube > 0.9) for (let i = 0; i < 26; i++) { const f = (t * 0.8 + i / 26) % 1, an = Math.PI * (1.05 + P.ruido(i) * 0.9), x = cx + Math.cos(an) * (6 + f * 26), y = Math.max(0, arriba) + 4 + Math.sin(an) * 6 + f * f * 40; cc.fillStyle = i % 2 ? "#ffffff" : "#bfe6ff"; cc.fillRect(Math.round(x), Math.round(y), 1, 2); }
      L.recorta(m.cielo);
      P.imagen(L.cv, m.X, 0, a);
    } };

  E[25] = { nombre: "La bandera quemada", dura: 5.5,
    prepara({ c }) {
      const X = 186, Y = 3, W = 32, H = 22, d = c.getImageData(X, Y, W, H).data, pts = [];
      const azul = (r, g, b) => b > 120 && b > r + 40;
      for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) { const k = (j * W + i) * 4; if (azul(d[k], d[k + 1], d[k + 2])) pts.push([X + i, Y + j]); }
      const ceniza = capa(W, H); ceniza.c.fillStyle = "#1a1210"; ceniza.c.fillRect(0, 0, W, H); ceniza.recorta(mascara(c, X, Y, W, H, azul));
      if (!pts.length) return null;
      return { X, Y, pts, ceniza: ceniza.cv, cx: 201, cy: 13 };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.3) {
        const g = u / 0.3, X = (gg) => 88 + (m.cx - 88) * gg, Y = (gg) => 118 + (m.cy - 118) * gg - Math.sin(gg * Math.PI) * 30;
        for (let k = 1; k < 8; k++) { const gg = g - k * 0.02; if (gg > 0) P.R(X(gg), Y(gg), 1, 1, k < 3 ? "#ffd23a" : "#ff6a2a", 0.9 - k * 0.1); }
        halo(P, X(g), Y(g), 6, "#ff9a3a", 1); P.bola(X(g), Y(g), 3, 3, "#fff2a0", 1);
        return;
      }
      const f = tramo(u, 0.3, 1);
      if (f < 0.08) halo(P, m.cx, m.cy, 8 + f * 60, "#ffd23a", 1 - f / 0.08);
      const quema = f < 0.5 ? f / 0.5 : f < 0.8 ? 1 : 1 - (f - 0.8) / 0.2;
      P.imagen(m.ceniza, m.X, m.Y, 0.85 * quema);
      if (f < 0.75) { halo(P, m.cx, m.cy, 12, "#ff8a2a", 0.6 * (1 - f / 0.75)); for (let i = 0; i < 34; i++) { const [px, py] = m.pts[(i * 37 + Math.floor(t * 9) * 5) % m.pts.length], al = 3 + P.ruido(i + Math.floor(t * 12)) * 7; P.R(px, py - al, 1, al, ["#ffe06a", "#ff9a3a", "#e8502a"][i % 3], 0.95 * (1 - f / 0.75)); } }
      if (f > 0.4) for (let i = 0; i < 5; i++) { const g = (t * 0.5 + i / 5) % 1; P.bola(m.cx - 8 + i * 4 + g * 6, m.cy - 6 - g * 16, 2 + g * 3, 2 + g * 2, "#6a6468", (1 - g) * 0.6 * (1 - tramo(f, 0.85, 1))); }
    } };

  E[26] = { nombre: "Los corazones de Hencock", dura: 5.5,
    prepara() { return { cx: 160, cy: 54, cor: lienzo(CORAZON, { P: "#ff4aa0", L: "#ffc0e0", W: "#ffffff" }), cor2: lienzo(CORAZON, { P: "#ff7ac0", L: "#ffe0f0", W: "#ffffff" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.42) {
        const g = u / 0.42, late = 1 + 0.18 * Math.max(0, Math.sin(t * 9)), s = (3 + g * 13) * late;
        halo(P, m.cx, m.cy, s * 1.6, "#ff9ad0", 0.7);
        [[0, "#ffffff"], [1, "#ff4aa0"], [2, "#ff7ac0"], [3, "#ff9ad0"]].forEach(([dd, col]) => { const ss = s - dd; if (ss < 1) return; for (let k = 0; k < 120; k++) { const th = (k / 120) * TAU, hx = 16 * Math.sin(th) ** 3, hy = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)); P.R(m.cx + (hx * ss) / 16, m.cy + (hy * ss) / 16, 1, 1, col, 1); } });
        return;
      }
      const f = tramo(u, 0.42, 1);
      if (f < 0.08) halo(P, m.cx, m.cy, 24, "#ffd0ea", 1 - f / 0.08);
      for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU + 0.2, d = 8 + sale(f) * (70 + P.ruido(i) * 50), x = m.cx + Math.cos(an) * d, y = m.cy + Math.sin(an) * d * 0.7 - f * 10; girada(P, i % 2 ? m.cor : m.cor2, x, y, Math.sin(t * 4 + i) * 0.25, 1 - f * f, i % 3 ? 1 : 2); if ((i + Math.floor(t * 10)) % 4 === 0) P.R(x + 6, y - 5, 1, 1, "#ffffff", 1 - f); }
    } };

  E[27] = { nombre: "La hidra de veneno", dura: 6.5, detras: true,
    prepara() { return { cx: 155, cy: 152, cab: lienzo(HIDRA, { P: "#9a4ae0", D: "#5a1a9a", L: "#c890ff", E: "#e8ff6a", K: "#2a0a40", T: "#f0e8ff" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.14) { for (let i = 0; i < 8; i++) { const f = (t * 1.5 + i / 8) % 1; P.bola(m.cx - 20 + P.ruido(i) * 40, m.cy - f * 6, 1.5, 1.5, "#c890ff", 1 - f); } return; }
      const sube = u < 0.4 ? sale(tramo(u, 0.14, 0.4)) : u < 0.66 ? 1 : 1 - entra(tramo(u, 0.66, 0.86));
      if (sube <= 0) { const f = tramo(u, 0.86, 1); aro(P, m.cx, m.cy, 6 + f * 30, 2 + f * 8, "#c890ff", 1 - f, 0); return; }
      const hy = m.cy - 34 - sube * 88, ruge = u > 0.42 && u < 0.64, hx = m.cx - 30 + Math.sin(t * 2.4) * 5 + (ruge ? Math.sin(t * 30) : 0);
      for (let y = m.cy; y > hy + 24; y -= 3) { const f = (m.cy - y) / (m.cy - hy), x = m.cx + 8 + Math.sin(f * 3 + t * 2.4) * 5 * f; P.bola(x, y, 11 - f * 3, 4, "#8a3ad0", 0.95); P.R(x - 7, y, 3, 1, "#c890ff", 0.8); P.R(x + 6, y, 2, 1, "#5a1a9a", 0.8); }
      girada(P, m.cab, hx + 24, hy + 16, 0, 1, 2);
      if (ruge) for (let k = 0; k < 3; k++) { const f = (t * 1.6 + k / 3) % 1, r = 8 + f * 40; for (let j = -5; j <= 5; j++) { const an = Math.PI + j * 0.12; P.R(hx + 2 + Math.cos(an) * r, hy + 18 + Math.sin(an) * r, 2, 1, "#e8d0ff", (1 - f) * 0.9); } }
      for (let i = 0; i < 8; i++) { const f = (t * 1.1 + i / 8) % 1; P.R(hx + 8 + i * 5, hy + 30 + f * 40, 1, 3, "#b06aff", (1 - f) * 0.9); }
      P.R(m.cx - 18, m.cy - 1, 36, 2, "#c890ff", 0.6);
    } };

  E[30] = { nombre: "Zeus, la nube del trueno", dura: 6.5,
    prepara({ luz }) { return { img: lienzo(ZEUS, { ...tinteC({ W: "#e8eef8", G: "#b8c4d8", D: "#8a96b0" }, luz), K: "#2a2a3a", T: "#ffffff" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      let x, y = 24 + Math.sin(t * 3) * 2;
      if (u < 0.3) x = -30 + (u / 0.3) * 168;
      else if (u < 0.62) { x = 138; if (u < 0.45) y -= Math.abs(Math.sin(t * 14)) * 2; }
      else x = 138 + ((u - 0.62) / 0.38) * 210;
      girada(P, m.img, x + 24, y + 11, 0, 1, 2);
      if (u > 0.3 && u < 0.45) for (let k = 0; k < 3; k++) P.R(x + 52 + k * 3, y + 2 + k * 5, 5, 1, "#ffffff", 0.9);
      if (u > 0.45 && u < 0.6) {
        const s = Math.floor(t * 25);
        if (u < 0.48) P.R(0, 0, 320, 180, "#fffbe0", 0.3);
        rayo(P, x + 30, y + 20, 214, 64, s, "#fff6a0", "#ffd23a", 6, 0.45);
        halo(P, 214, 64, 5, "#fff6a0", 1);
      }
      for (let i = 0; i < 4; i++) if ((Math.floor(t * 6) + i) % 3 === 0) P.R(x + 8 + i * 10, y + 22, 1, 3, "#ffe040", 0.9);
    } };

  E[31] = { nombre: "El robot gigante despierta", dura: 5.5,
    prepara() { return { x0: 223, x1: 262, y0: 39, y1: 47 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = u > 0.8 ? (1 - u) / 0.2 : 1, h = m.y1 - m.y0;
      if (u < 0.36) { const g = (u / 0.36) * 2 % 1, x = m.x0 + (m.x1 - m.x0) * (Math.floor(u / 0.18) % 2 ? 1 - g : g); P.R(m.x0, m.y0 + 2, m.x1 - m.x0, h - 4, "#ff3a5a", 0.25); P.R(x - 2, m.y0 + 1, 4, h - 2, "#ff8aa0", 0.9); P.R(x - 1, m.y0 + 2, 2, h - 4, "#ffffff", 1); return; }
      P.R(m.x0, m.y0 + 1, m.x1 - m.x0, h - 2, "#ff5a7a", 0.75 * a); P.R(m.x0 + 2, m.y0 + 3, m.x1 - m.x0 - 4, h - 6, "#ffd0da", a);
      if (u < 0.42) { P.R(0, 0, 320, 180, "#ffe0e8", 0.3 * (1 - tramo(u, 0.36, 0.42))); return; }
      const g = tramo(u, 0.42, 0.8), sx = m.x0 + 3, sy = m.y0 + 4, ex = sx - 150 * sale(tope(g * 3)), ey = sy - 56 * sale(tope(g * 3)), gr = g < 0.7 ? 1 : 1 - (g - 0.7) / 0.3;
      if (g > 0) {
        P.caja(Math.min(sx, ex) - 5, Math.min(sy, ey) - 5, Math.abs(ex - sx) + 10, Math.abs(ey - sy) + 10);
        for (let k = -3; k <= 3; k++) trazo(P, sx, sy + k, ex, ey + k, Math.abs(k) < 1 ? "#ffffff" : Math.abs(k) < 2 ? "#ffb0c0" : "#ff3a5a", (Math.abs(k) < 2 ? 1 : 0.6) * gr * a);
        halo(P, sx, sy, 9, "#ff8aa0", gr * a); halo(P, ex, ey, 6, "#ffd0da", gr * a);
      }
    } };

  E[32] = { nombre: "El molinillo de Gonze", dura: 6,
    prepara({ quien }) { const g = quien("Gonze"); return g ? { x0: g.x + g.w / 2, y0: g.top - 2 } : { x0: 110, y0: 100 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const g = suave(u), x = m.x0 + g * (336 - m.x0), y = m.y0 - g * (m.y0 - 10) + Math.sin(u * TAU * 1.5) * 10, rot = t * 14, COLS = ["#e83a3a", "#f2c84b", "#3a7ae8", "#4ac85a"];
      const tumba = Math.sin(t * 2.4) * 0.6;
      trazo(P, x, y, x + Math.sin(tumba) * 14, y + Math.cos(tumba) * 14, "#9a6a3a"); P.caja(x - 15, y - 15, 31, 31);
      COLS.forEach((col, k) => { const a0 = rot + (k * Math.PI) / 2; for (let j = 0; j <= 6; j++) { const an = a0 + j * 0.2, L = 10 - j * 0.9; trazo(P, x, y, x + Math.cos(an) * L, y + Math.sin(an) * L, col); } });
      P.R(x, y, 1, 1, "#ffffff");
      for (let k = 0; k < 5; k++) { const f = (t * 0.9 + k / 5) % 1; P.R(60 + f * 280, 16 + k * 14, 10 + (k % 3) * 5, 1, "#ffffff", 0.5 * Math.sin(f * Math.PI)); }
    } };

  E[33] = { nombre: "El adiós del Nerry", dura: 7.5,
    prepara() { return {}; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.15, 0.8, 1);
      for (let i = 0; i < 38; i++) {
        const f = (t * 0.16 + P.ruido(i)) % 1, x = 70 + P.ruido(i + 7) * 160 + Math.sin(f * 5 + i) * (6 + f * 10), y = 112 - f * 124, tw = 0.6 + 0.4 * Math.sin(t * 6 + i);
        P.R(x, y, i % 3 ? 1 : 2, i % 3 ? 1 : 2, i % 3 ? "#ffe6a0" : "#fff6d8", a * tw * (1 - f * 0.6));
        if (i % 3 === 0) { P.R(x - 1, y, 1, 1, "#ffd27a", 0.5 * a * (1 - f)); P.R(x + 2, y + 1, 1, 1, "#ffd27a", 0.5 * a * (1 - f)); }
      }
    } };

  E[34] = { nombre: "El pitido del Rocketman", dura: 5.5,
    prepara() { return { x: 246, y: 66 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      [0.04, 0.24, 0.44, 0.62].forEach((u0) => { const f = tramo(u, u0, u0 + 0.38); if (f <= 0 || f >= 1) return; for (let k = 0; k < 3; k++) P.bola(m.x - f * 40 + k * 4, m.y - 4 - f * 52 - k * 4, (5 + f * 16 - k) * (f > 0.75 ? 1 - (f - 0.75) * 2 : 1), (4 + f * 12 - k) * (f > 0.75 ? 1 - (f - 0.75) * 2 : 1), k ? "#d8dde4" : "#f8fafc", 1); });
      if (u < 0.7 && Math.floor(t * 4) % 2) for (let k = 0; k < 3; k++) { const r = 4 + k * 4; for (let j = -2; j <= 2; j++) P.R(m.x + 8 + r, m.y - 10 + j * 2 - k, 1, 1, "#ffffff", 0.9 - k * 0.25); }
    } };

  E[36] = { nombre: "El choque de Hika", dura: 4.2,
    prepara() { return { x: 163, y: 57 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = u > 0.7 ? (1 - u) / 0.3 : 1, sem = Math.floor(t * 12);
      if (u < 0.1) halo(P, m.x, m.y, 4 + u * 80, "#ffffff", 1 - u / 0.1);
      if (u > 0.05 && u < 0.85) for (let b = 0; b < 8; b++) { const an = (b / 8) * TAU + P.ruido(b + sem) * 0.5, L = 50 + P.ruido(b + sem * 3) * 60; rayo(P, m.x, m.y, m.x + Math.cos(an) * L, m.y + Math.sin(an) * L * 0.7, sem * 7 + b * 13, b % 2 ? "#1a0a10" : "#ff2a3a", b % 2 ? "#ff3a4a" : "#3a0a12", 6, 0.5, a); }
      const g = tramo(u, 0.1, 0.6);
      if (g > 0 && g < 1) { aro(P, m.x, m.y, 10 + g * 160, 7 + g * 110, "#0a0408", (1 - g) * 0.9, 0); aro(P, m.x, m.y, 8 + g * 150, 6 + g * 100, "#ff3a4a", (1 - g) * 0.6, 1); }
      if (u < 0.6) P.R(0, 0, 320, 180, "#ff1a2a", 0.09 * (0.5 + 0.5 * Math.sin(t * 25)) * a);
    } };

  E[37] = { nombre: "Los tambores de la liberación", dura: 6,
    prepara() { return { x: 98, y: 66 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      [0.06, 0.13, 0.36, 0.43, 0.66, 0.73].forEach((u0) => {
        const f = tramo(u, u0, u0 + 0.26);
        if (f <= 0 || f >= 1) return;
        if (f < 0.08) P.R(0, 0, 320, 180, "#ffffff", 0.14 * (1 - f / 0.08));
        aro(P, m.x, m.y, 9 + f * 112, 8 + f * 82, "#ffffff", (1 - f) * 0.8, 0);
        aro(P, m.x, m.y, 7 + f * 110, 6 + f * 80, "#5a3a7a", (1 - f) * 0.6, 0); aro(P, m.x, m.y, 6 + f * 110, 5 + f * 80, "#ffffff", 1 - f, 0); aro(P, m.x, m.y, 5 + f * 108, 4 + f * 78, "#ffd86a", (1 - f) * 0.8, 0);
        if (f < 0.25) halo(P, m.x, m.y, 8, "#ffffff", 1 - f / 0.25);
      });
      if (Math.floor(t * 4) % 2) for (let k = 0; k < 8; k++) { const an = -Math.PI * (0.15 + (k / 7) * 0.7), r0 = 30, r1 = 38; trazo(P, m.x - 5 + Math.cos(an) * r0, 40 + Math.sin(an) * r0 * 0.8, m.x - 5 + Math.cos(an) * r1, 40 + Math.sin(an) * r1 * 0.8, "#ffffff", 0.8); }
      P.caja(m.x - 50, 0, 100, 50);
    } };

  E[38] = { nombre: "La mirada de Sank", dura: 5.5,
    prepara({ quien, luz }) { const s = quien("Sank"); return { x: s ? s.x + s.w / 2 : 240, y: s ? s.top + 8 : 64, gota: lienzo(GOTA, { L: "#8ad0f4", W: "#ffffff" }), excl: lienzo(EXCLAMA, { R: "#e8302a" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = u > 0.85 ? (1 - u) / 0.15 : 1;
      if (u > 0.06 && u < 0.5) { const s = Math.floor(t * 20); for (let b = 0; b < 4; b++) { const an = P.ruido(b + s) * TAU; rayo(P, m.x, m.y, m.x + Math.cos(an) * 12, m.y + Math.sin(an) * 10, s + b * 5, "#ff3a4a", "#2a0a14", 3, 0.6); } }
      if (u > 0.08 && u < 0.5) P.R(0, 0, 320, 180, "#2a0a30", 0.14 * Math.sin(tramo(u, 0.08, 0.5) * Math.PI));
      [0.1, 0.2, 0.3].forEach((u0) => { const g = tramo(u, u0, u0 + 0.36); if (g <= 0 || g >= 1) return; aro(P, m.x, m.y, 6 + g * 170, 4 + g * 110, "#1a0a20", (1 - g) * 0.9, 0); aro(P, m.x, m.y, 4 + g * 160, 3 + g * 104, "#c82a3a", (1 - g) * 0.6, 1); });
      if (u > 0.42) {
        const f = tramo(u, 0.42, 0.95);
        P.R(145, 33, 10, 7, "#ffffff", a); P.R(146, 32, 8, 1, "#ffffff", a); P.R(149, 35, 2, 2, "#1a1a1a", a);
        girada(P, m.excl, 164, 10 + (f < 0.1 ? -Math.sin((f / 0.1) * Math.PI) * 4 : 0), 0, a, 2);
        girada(P, m.gota, 178, 26 + f * 14, 0, a, 2);
        if (Math.floor(t * 10) % 2) { P.R(116, 26, 3, 1, "#ffffff", 0.8 * a); P.R(114, 32, 3, 1, "#ffffff", 0.8 * a); P.R(198, 40, 3, 1, "#ffffff", 0.8 * a); P.R(200, 46, 3, 1, "#ffffff", 0.8 * a); }
      }
    } };

  E[39] = { nombre: "La luz entre los espejos", dura: 5.5,
    prepara() {
      const pts = [[176, -10], [188, 40], [103, 18], [78, 62], [160, 52], [228, 30], [258, -10]], seg = [];
      let L = 0; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], L, l]); L += l; }
      return { pts, seg, L, estrella: lienzo(ESTRELLA, { W: "#ffffff", Y: "#fff6c8" }) };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const pos = (d) => { for (const [a, b, L0, l] of m.seg) if (d <= L0 + l) { const f = (d - L0) / l; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f]; } return m.pts[m.pts.length - 1]; };
      const d = tramo(u, 0.04, 0.8) * m.L;
      if (d > 0 && d < m.L) for (let k = 0; k < 30; k++) { const [x, y] = pos(Math.max(0, d - k * 1.2)); P.R(x - (k < 8 ? 1 : 0), y - (k < 8 ? 1 : 0), k < 8 ? 3 : 2, k < 8 ? 3 : 2, k < 3 ? "#ffffff" : "#fff2c8", 1 - k / 30); }
      if (d > 0 && d < m.L) { const [x, y] = pos(d); halo(P, x, y, 6, "#fff6d8", 0.9); }
      m.seg.forEach(([a, , L0], i) => { if (i === 0) return; const f = (d - L0) / 70; if (f < 0 || f > 1) return; halo(P, a[0], a[1], 8 + f * 10, "#fff6d8", 1 - f); girada(P, m.estrella, a[0], a[1], f * 2, 1 - f, 2); });
    } };

  Momentos.escena.piratas = E;
})();
