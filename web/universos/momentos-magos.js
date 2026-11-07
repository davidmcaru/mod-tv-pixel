// momentos-magos.js — la animación de cada escenario de Magos: unos segundos de algo de ese sitio.
(function () {
  if (!window.Momentos || !Momentos.util) return;
  const { TAU, suave, sale, entra, tope, lienzo, figura, capa, mascara, trozo, girada, halo, rayo, estallido, aro } = Momentos.util;
  const tramo = (u, a, b) => tope((u - a) / (b - a));
  const env = (u, a, b, c, d) => (u <= a || u >= d ? 0 : u < b ? (u - a) / (b - a) : u <= c ? 1 : (d - u) / (d - c));
  const C = (luz, x) => (luz ? luz.color(x) : x);
  const tinteS = (cols, luz) => Object.fromEntries(Object.entries(cols).map(([k, v]) => [k, luz ? luz.sprite(v) : v]));
  function trazo(P, x0, y0, x1, y1, col, a = 1) {
    const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)))), cc = P.ctx;
    cc.globalAlpha = tope(a); cc.fillStyle = col;
    for (let i = 0; i <= n; i++) cc.fillRect(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), 1, 1);
    cc.globalAlpha = 1;
  }
  function grueso(P, x0, y0, x1, y1, g, col, a = 1) {
    P.caja(Math.min(x0, x1) - g, Math.min(y0, y1) - g, Math.abs(x1 - x0) + 2 * g + 1, Math.abs(y1 - y0) + 2 * g + 1);
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0))), cc = P.ctx;
    cc.globalAlpha = tope(a); cc.fillStyle = col;
    for (let i = 0; i <= n; i++) cc.fillRect(Math.round(x0 + ((x1 - x0) * i) / n - g / 2), Math.round(y0 + ((y1 - y0) * i) / n - g / 2), g, g);
    cc.globalAlpha = 1;
  }
  function chorro(P, x, y, f, n, a0, a1, v, cols, semilla = 0, caida = 30, w = 1) {
    for (let i = 0; i < n; i++) { const an = a0 + (a1 - a0) * P.ruido(semilla + i), vv = v * (0.6 + P.ruido(semilla + i + 50) * 0.6); P.R(x + Math.cos(an) * vv * f, y + Math.sin(an) * vv * f + caida * f * f, w, w, cols[i % cols.length], 1 - f); }
  }

  const JUGADOR = ["......HH........", ".....HSSH.......", ".....SSSS.......", "....RRRRRR......", "...RRRRRRRR.....", "BBBBBBBBBBBBBTTT", "....RR..RR...TTT", "....KK..KK......"];
  const GNOMO = ["..BBB..", ".BBBBB.", "BBKBKBB", "BBBBBBB", ".BBBBB.", "B.BBB.B", "..B.B..", ".BB.BB."];
  const MANO = ["W.W.W", "W.W.W", "WWWWW", "WWWWW", ".WWW.", ".WWW.", ".WWW.", ".WWW."];
  const NOTA = ["..YY.", "..Y.Y", "..Y..", "..Y..", "YYY..", "YYY.."];
  const COPA = ["YYYYY", "YyYYY", ".YYY.", "..Y..", "..Y..", ".YYY."];
  const RANA = [[".KK..KK.", "KCCCCCCK", "CCCCCCCC", ".CCCCCC.", "C.C..C.C"], [".KK..KK.", "KCCCCCCK", "CCCCCCCC", "CCCCCCCC", "C......C"]];
  const BUITRE = ["......GGG.......", ".....GGKG.......", "......GGOO......", ".....DDDDD......", "....DDDDDDD.....", "...DDDDDDDDD....", "....DDDDDDD.....", ".....GG.GG......",
    "....HHHHHHHH....", "....HHHHHHHH....", "....HRRRRRRH....", "..HHHHHHHHHHHH..", ".HHHHHHHHHHHHHH."];
  const LIEBRE = ["........W.W.", "........W.W.", ".......WWWW.", "......WWWKW.", "WWWWWWWWWW..", ".WWWWWWWW...", "..W.....W...", ".W.......W.."];
  const NUTRIA = ["...........WW.", "WWWWWWWWWWWWKW", ".WWWWWWWWWWWW.", "..W..W...W..W."];
  const PERRO = [".........W.", "........WWW", ".......WWKW", "W.....WWWWW", "WWWWWWWWW..", ".WWWWWWWW..", ".W.W...W.W.", ".W.W...W.W."];
  const CISNE = [".......WW...", "......WKW...", ".......W....", ".......W....", "..WWW..W....", "WWWWWWWWW...", ".WWWWWWWW...", "...WWWWW...."];
  const BUHO = [["WW......", ".WW..BB.", "..WWBBEB", "...BBBBB", "..BBBBB.", "...Y.Y.."], ["........", ".....BB.", "...WBBEB", "WWWWBBBB", ".WW.BBB.", "...Y.Y.."]];
  const DRAGON = [
    ["....W.........W.......", "....WW.......WW.......", "....WWW.....WWW.......", "....WWWW...WWWW.......", ".....WWWW.WWWW........", "......WWWWWWW.....HH..", "TTTBBBBBBBBBBBBBBBHHK.", "..TTBBBBBBBBBBBBB..HH.", ".......LL....LL......."],
    ["......................", "......................", "......................", "......................", "......................", "..................HH..", "TTTBBBBBBBBBBBBBBBHHK.", "..TTBBBBBBBBBBBBB..HH.", ".....WWWWW.WWWWW......", "....WWWW.....WWWW.....", "....WW.........WW....."],
  ];
  const CORAZON = lienzo([".PP.PP.", "PPPPPPP", "PWPPPPP", ".PPPPP.", "..PPP..", "...P..."], { P: "#ff5aa0", W: "#ffd0e4" });
  const ARANA_OJOS = [[-2, -1], [2, -1], [-1, -2], [1, -2], [-3, 0], [3, 0]];

  const E = {};

  E[1] = { nombre: "El calamar gigante", dura: 7, detras: true,
    prepara() { return { base: [[150, 134, 1], [172, 136, -1], [194, 133, 1]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const sube = u < 0.25 ? sale(u / 0.25) : u < 0.72 ? 1 : 1 - entra(tramo(u, 0.72, 0.92));
      m.base.forEach(([bx, by, lado], k) => {
        const L = (30 + k * 6) * sube;
        if (L > 1) {
          let x = bx, y = by;
          const N = 16;
          for (let i = 0; i <= N; i++) {
            const f = i / N, an = -Math.PI / 2 + lado * (Math.sin(t * 2.2 + k * 1.7 + f * 2.5) * 0.9 * f), g = Math.max(1, (1 - f) * 5);
            const nx = x + Math.cos(an) * (L / N), ny = y + Math.sin(an) * (L / N);
            P.bola(nx, ny, g, g, "#7a3a4e", 1);
            if (i % 3 === 1 && g > 1.5) P.R(nx - lado * g * 0.6, ny, 1, 1, "#e8b8c4");
            x = nx; y = ny;
          }
        }
        if ((u < 0.3 || (u > 0.7 && u < 0.95))) aro(P, bx, by + 1, 4 + ((t * 8 + k * 3) % 10), 1.5, "#ffffff", 0.7, 0);
      });
    } };

  E[2] = { nombre: "El dragón de fuegos artificiales", dura: 7,
    prepara() { return { cx: 152, cy: 52 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = u > 0.85 ? (1 - u) / 0.15 : 1, pos = (tt) => [m.cx + Math.cos(tt * 1.4) * 70 + Math.sin(tt * 2.8) * 6, m.cy + Math.sin(tt * 1.4) * 26 - Math.cos(tt * 0.9) * 6];
      for (let i = 24; i >= 0; i--) {
        const [x, y] = pos(t - i * 0.05), r = i === 0 ? 6 : Math.max(1.5, 4.5 - i * 0.12), col = i < 3 ? "#fff6c8" : i % 3 === 0 ? "#3fe87a" : i % 3 === 1 ? "#ffb43a" : "#ff6a3a";
        P.bola(x, y, r + 1.5, r + 1.5, col, 0.35 * a * (1 - i / 30)); P.bola(x, y, r, r, col, a * (1 - i / 30));
        if (i % 4 === 0 && i > 0) P.R(x + (P.ruido(i + Math.floor(t * 9)) - 0.5) * 8, y + 3 + P.ruido(i * 3 + Math.floor(t * 9)) * 8, 1, 1, "#fff2a0", a);
      }
      const [hx, hy] = pos(t), [px, py] = pos(t - 0.05), dir = Math.sign(hx - px) || 1;
      P.R(hx + dir * 4, hy - 3, 2, 2, "#ffffff", a); P.R(hx - dir * 2, hy - 8, 1, 3, "#ffe06a", a); P.R(hx + 2, hy - 8, 1, 3, "#ffe06a", a);
      if (Math.floor(t * 3) % 2) for (let k = 0; k < 10; k++) P.R(hx + dir * (7 + k * 2), hy + Math.sin(k + t * 20) * 1.5, 2, 2, k < 4 ? "#ffe06a" : "#ff6a2a", a);
      if (u > 0.85) estallido(P, hx, hy, tramo(u, 0.85, 1), 16, ["#fff6c8", "#3fe87a", "#ffb43a", "#ff6a3a"], "#4a3a3a", 3);
    } };

  E[3] = { nombre: "La pelea de bolas de nieve", dura: 6.5,
    prepara() { return { t: [[0.02, 90, 136, 196, 118], [0.16, 205, 126, 104, 140], [0.3, 96, 140, 186, 132], [0.44, 200, 120, 120, 128], [0.58, 92, 132, 170, 112]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.t.forEach(([u0, x0, y0, x1, y1], i) => {
        const g = tramo(u, u0, u0 + 0.16), f = tramo(u, u0 + 0.16, u0 + 0.32);
        if (g > 0 && g < 1) { const x = x0 + (x1 - x0) * g, y = y0 + (y1 - y0) * g - Math.sin(g * Math.PI) * 60; P.bola(x, y, 5, 5, "#7a8aa8", 1); P.bola(x, y, 4, 4, "#ffffff", 1); P.R(x, y + 1, 3, 2, "#c8d8ec"); for (let k = 1; k < 4; k++) P.R(x - (x1 > x0 ? 1 : -1) * (5 + k * 3), y + 1, 2, 1, "#ffffff", 0.6 - k * 0.15); }
        if (f > 0 && f < 1) { P.bola(x1, y1, 4 + f * 8, 3 + f * 6, "#7a8aa8", (1 - f) * 0.5); P.bola(x1, y1, 3 + f * 7, 2 + f * 5, "#ffffff", (1 - f) * 0.9); chorro(P, x1, y1, f, 20, 0, TAU, 18, ["#ffffff", "#dfeaf6", "#7a8aa8"], i * 9, 14, 2); }
      });
    } };

  E[4] = { nombre: "¡Gol por el aro grande!", dura: 6,
    prepara({ luz }) { return { j: lienzo(JUGADOR, tinteS({ H: "#5a3a20", S: "#f2c8a0", R: "#b8282a", B: "#6a4020", T: "#c8a060", K: "#2a2028" }, luz)), ax: 163, ay: 55 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const g = tramo(u, 0, 0.5), x = 330 - g * 140 + Math.sin(g * Math.PI) * -10, y = 30 + Math.sin(g * Math.PI * 1.5) * 10;
      if (g < 1) girada(P, m.j, x, y, Math.sin(t * 6) * 0.05, 1, 2.2);
      else { const h = tramo(u, 0.5, 0.95); girada(P, m.j, 190 + h * 40, 30 - h * 50, -0.3, 1, 2.2); }
      const b = tramo(u, 0.42, 0.6);
      if (b > 0 && b < 1) { const bx = 178 + (m.ax - 178) * b, by = 34 + (m.ay - 34) * b; P.bola(bx, by, 3.5, 3.5, "#c83a2a", 1); P.R(bx - 1, by - 2, 2, 1, "#ff8a6a"); }
      const f = tramo(u, 0.55, 0.9);
      if (f > 0 && f < 1) { aro(P, m.ax, m.ay, 10, 11, "#fff6a0", 1 - f, 0); aro(P, m.ax, m.ay, 10 + f * 20, 11 + f * 20, "#ffe06a", 1 - f, 1); chorro(P, m.ax, m.ay, f, 16, 0, TAU, 26, ["#ffe06a", "#ffffff"], 5, 10); }
    } };

  E[5] = { nombre: "La araña del bosque", dura: 7,
    prepara() { return { x: 160 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const baja = u < 0.35 ? sale(u / 0.35) : u < 0.7 ? 1 : 1 - entra(tramo(u, 0.7, 0.95)), y = -10 + baja * 74 + Math.sin(t * 1.5) * 2, x = m.x + Math.sin(t * 0.9) * 3;
      P.caja(m.x - 4, 0, 8, y); trazo(P, m.x, 0, x, y - 6, "#d8dce8", 0.6);
      for (let lado = -1; lado <= 1; lado += 2) for (let i = 0; i < 4; i++) {
        const mueve = Math.sin(t * 9 + i + lado) * (u > 0.35 && u < 0.7 ? 1.5 : 0.5), kx = x + lado * (7 + i * 2), ky = y - 6 + i * 3 + mueve, fx = x + lado * (12 + i * 2.5), fy = y + 2 + i * 3.5;
        grueso(P, x + lado * 2, y - 1 + i, kx, ky, 2, "#2a2026"); grueso(P, kx, ky, fx, fy, 1, "#2a2026");
      }
      P.bola(x, y + 3, 7, 6, "#2a2026", 1); P.bola(x, y - 3, 4, 3.5, "#3a2e36", 1); P.R(x - 3, y + 1, 2, 3, "#5a4650");
      ARANA_OJOS.forEach(([dx, dy], i) => P.R(x + dx, y - 3 + dy, 1, 1, (i + Math.floor(t * 3)) % 5 ? "#ff5a3a" : "#ffe0c0"));
    } };

  E[6] = { nombre: "La varita elige", dura: 5.5,
    prepara() { return { x: 115, y: 102 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const f = env(u, 0.05, 0.15, 0.7, 0.9);
      if (f > 0) { halo(P, m.x, m.y, 14, "#ffe06a", f); for (let i = 0; i < 44; i++) { const ff = (t * 0.9 + i / 44) % 1, an = -Math.PI * (0.2 + P.ruido(i) * 0.6), v = 60 + P.ruido(i + 7) * 40; P.R(m.x + Math.cos(an) * v * ff, m.y + Math.sin(an) * v * ff + 40 * ff * ff, 2, 2, i % 3 === 0 ? "#ffffff" : i % 2 ? "#ffd23a" : "#ff4a3a", f * (1 - ff)); } }
      for (let k = 0; k < 4; k++) { const g = tramo(u, 0.15 + k * 0.08, 0.55 + k * 0.08); if (g <= 0 || g >= 1) continue; const x = m.x + (k - 1.5) * 18 * g, y = m.y - 50 * g + 60 * g * g; girada(P, CAJA, x, y, g * 6 * (k % 2 ? 1 : -1), 1 - tramo(g, 0.7, 1), 1.8); }
    } };
  const CAJA = lienzo(["KKKKKKKK", "KbbbbbbK", "KbYbbbbK", "KKKKKKKK"], { K: "#3a2a1a", b: "#c8a878", Y: "#d8b040" });

  E[7] = { nombre: "El silbato del expreso", dura: 6,
    prepara() { return { cx: 302, cy: 40, rx: 226, ry: 26 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      for (let k = 0; k < 10; k++) { const f = tramo(u, k * 0.05, 0.55 + k * 0.05); if (f <= 0 || f >= 1) continue; P.bola(m.cx - f * (150 + k * 8), m.cy - 8 - f * 26 + Math.sin(k) * 8, 6 + f * 14, 5 + f * 10, k % 2 ? "#f4f6f8" : "#ffffff", 1 - f * 0.9); }
      if (u < 0.5 && Math.floor(t * 5) % 2) for (let k = 0; k < 3; k++) for (let j = -2; j <= 2; j++) P.R(m.cx - 6 - k * 4, m.cy - 14 + j * 2 - k, 1, 1, "#ffffff", 0.9 - k * 0.25);
      const g = tramo(u, 0.1, 0.6), an = -Math.PI / 2 + g * TAU * 3;
      P.bola(m.rx, m.ry, 6, 6, "#f8f4e8", 1); trazo(P, m.rx, m.ry, m.rx + Math.cos(an) * 5, m.ry + Math.sin(an) * 5, "#1a1a1a"); trazo(P, m.rx, m.ry, m.rx + Math.cos(-Math.PI / 2 - Math.PI / 6 + g * 0.5) * 3, m.ry + Math.sin(-Math.PI / 2 - Math.PI / 6 + g * 0.5) * 3, "#1a1a1a");
      if (u > 0.6 && u < 0.75) halo(P, m.rx, m.ry, 10, "#ffe06a", 1 - tramo(u, 0.6, 0.75));
    } };

  E[8] = { nombre: "Tía Merga se infla", dura: 7.5,
    prepara({ luz }) { return { k: tinteS({ V: "#7a4a8a", v: "#5a3068", S: "#f2b8a0", H: "#6a4a3a", K: "#2a2028", P: "#9a8070" }, luz), x0: 158, y0: 112 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const infla = tramo(u, 0, 0.3), sube = tramo(u, 0.3, 1), r = 4 + infla * 9, x = m.x0 + sube * 30 + Math.sin(t * 1.5) * 4, y = m.y0 - sube * 150 - infla * 4, k = m.k;
      P.bola(x, y, r, r * 0.95, k.V, 1); P.bola(x + r * 0.3, y + r * 0.3, r * 0.6, r * 0.5, k.v, 1);
      P.bola(x, y - r - 2, 3, 3, k.S, 1); P.R(x - 3, y - r - 5, 6, 2, k.H); P.R(x - 1, y - r - 2, 1, 1, k.K); P.R(x + 1, y - r - 2, 1, 1, k.K);
      [[-1, -0.2], [1, -0.2], [-0.5, 1], [0.5, 1]].forEach(([dx, dy], i) => { const ex = x + dx * (r + 1), ey = y + dy * (r + 1); P.R(ex - 1, ey - 1, 3, 2, i < 2 ? k.S : k.K); });
      if (sube > 0.05) { const px = x + 3, py = y + r + 6 + Math.sin(t * 4) * 1.5; trazo(P, x + 2, y + r + 1, px, py - 2, k.S); P.R(px - 2, py - 2, 6, 3, k.P); P.R(px + 3, py - 3, 2, 2, k.P); P.R(px + 4, py - 3, 1, 1, k.K); P.R(px - 1, py + 1, 1, 2, k.P); P.R(px + 2, py + 1, 1, 2, k.P); }
    } };

  E[9] = { nombre: "La cabeza en la chimenea", dura: 6,
    prepara() { return { x: 160, y: 96 }; },
    dibuja(m, u, t, P) {
      const a = env(u, 0.06, 0.28, 0.72, 0.92);
      if (a < 1) P.rapido();
      if (a <= 0) return;
      P.bola(m.x, m.y - 3, 14, 15, "#3a1a10", 0.85 * a);
      P.bola(m.x, m.y, 10, 12, "#ffb43a", a); P.bola(m.x, m.y + 1, 7, 9, "#ffd06a", a);
      [[-4, -3], [4, -3]].forEach(([dx, dy]) => P.R(m.x + dx - 1, m.y + dy, 3, 2, "#3a1a10", a));
      P.R(m.x - 1, m.y + 1, 3, 3, "#e8902a", a); P.R(m.x - 3, m.y + 7, 7, 2, "#8a3a14", a);
      for (let i = 0; i < 12; i++) { const ff = (t * 1.2 + i / 12) % 1; P.R(m.x - 10 + P.ruido(i) * 20, m.y + 8 - ff * 26, 1, 1, i % 2 ? "#ffe06a" : "#ff8a2a", a * (1 - ff)); }
    } };

  E[10] = { nombre: "Gnomos por los aires", dura: 6.5,
    prepara({ luz }) { return { g: lienzo(GNOMO, tinteS({ B: "#9a6a3a", K: "#1a1410" }, luz)), t: [[0.02, 150, 156], [0.16, 176, 150], [0.3, 130, 160], [0.44, 196, 158], [0.58, 160, 152]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.t.forEach(([u0, x0, y0], i) => {
        const g = tramo(u, u0, u0 + 0.36);
        if (g <= 0 || g >= 1) return;
        const x1 = 40 + i * 8, x = x0 + (x1 - x0) * g, y = y0 - Math.sin(g * Math.PI) * (110 + i * 8) - g * 30;
        girada(P, m.g, x, y, g * 14 * (i % 2 ? 1 : -1), g > 0.85 ? (1 - g) / 0.15 : 1, 2.4);
        if (g < 0.08) chorro(P, x0, y0 + 4, g / 0.08, 8, -Math.PI, 0, 8, ["#6a4a2a", "#8a6a3a"], i * 7, 6);
      });
    } };

  E[13] = { nombre: "El escudo del castillo", dura: 7,
    prepara() { return { cx: 160, cy: 124, rx: 112, ry: 110, g: [[0.15, 120], [0.3, 200], [0.45, 160], [0.58, 100]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.7, 0.78), pt = (an) => [m.cx + Math.cos(an) * m.rx, m.cy - Math.sin(an) * m.ry];
      if (a > 0) {
        P.caja(m.cx - m.rx - 3, m.cy - m.ry - 3, m.rx * 2 + 6, m.ry + 6);
        for (let k = 0; k <= 300; k++) { const an = (k / 300) * Math.PI, [x, y] = pt(an); P.ctx.globalAlpha = 0.85 * a; P.ctx.fillStyle = k % 3 ? "#9ad8ff" : "#ffffff"; P.ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 2, 2); P.ctx.globalAlpha = 1; }
        for (let k = 0; k < 18; k++) { const an = (k / 18) * Math.PI + t * 0.3, [x, y] = pt(an % Math.PI); P.R(x, y + 2, 1, 1, "#d8f4ff", 0.5 * a); }
      }
      m.g.forEach(([u0, gx], i) => {
        const f = tramo(u, u0 - 0.06, u0), h = tramo(u, u0, u0 + 0.12), an = Math.acos(tope((gx - m.cx) / m.rx * 0.5 + 0.5) * 2 - 1), [hx, hy] = pt(an);
        if (f > 0 && f < 1) { const sx = gx + 80 * (1 - f), sy = -10 + (hy + 10) * f; trazo(P, sx, sy, sx + 6, sy - 6, "#3fe87a"); P.bola(sx, sy, 2, 2, "#a8ffc8", 1); }
        if (h > 0 && h < 1) { aro(P, hx, hy, 4 + h * 14, 3 + h * 10, "#ffffff", 1 - h, 0); for (let k = 0; k < 4; k++) { const ag = k * 1.6 + i; trazo(P, hx, hy, hx + Math.cos(ag) * 8 * h, hy + Math.sin(ag) * 8 * h, "#ffffff", 1 - h * 0.5); } }
      });
      const r = tramo(u, 0.7, 1);
      if (r > 0 && r < 1) for (let k = 0; k < 40; k++) { const an = (k / 40) * Math.PI, [x, y] = pt(an); P.R(x + (P.ruido(k) - 0.5) * 30 * r, y + r * r * 80, 2, 1, k % 2 ? "#9ad8ff" : "#ffffff", 1 - r); }
    } };

  E[14] = { nombre: "Las luces de Dombludere", dura: 7.5, vale: ({ quien }) => !!quien("Dombludere"),
    prepara({ u, quien }) {
      const q = quien("Dombludere"), sp = Universo.sprite(u, q.nombre), w = sp.m[0].length, h = sp.m.length;
      let tip = [w - 1, Math.round(h * 0.4)], mejor = -1;
      for (let j = Math.floor(h * 0.15); j < Math.floor(h * 0.7); j++) { const fila = sp.m[j]; for (let i = w - 1; i > mejor; i--) if (fila[i] !== ".") { mejor = i; tip = [i, j]; break; } }
      return { vx: Math.round(q.x) + tip[0], vy: Math.round(q.top) + tip[1], f: [[107, 108], [207, 108]] };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const bola = ([x, y]) => { halo(P, x, y, 4, "#ffe6a0", 1); P.bola(x, y, 1.5, 1.5, "#ffffff", 1); };
      const arco = (g, x0, y0, x1, y1) => [x0 + (x1 - x0) * g, y0 + (y1 - y0) * g - Math.sin(g * Math.PI) * 24];
      const punta = env(u, 0, 0.04, 0.1, 0.16) + env(u, 0.84, 0.9, 0.93, 1);
      if (punta > 0) halo(P, m.vx, m.vy, 5, "#fff6d0", punta);
      m.f.forEach(([x, y], i) => {
        const ida = tramo(u, 0.06 + i * 0.05, 0.28 + i * 0.05), vuelta = tramo(u, 0.64 + i * 0.04, 0.88 + i * 0.03), encendida = env(u, 0.28 + i * 0.05, 0.32 + i * 0.05, 0.62, 0.66 + i * 0.04);
        if (ida > 0 && ida < 1) bola(arco(suave(ida), m.vx, m.vy, x, y));
        if (encendida > 0) { halo(P, x, y, 7, "#ffd27a", encendida); P.bola(x, y, 2, 2, "#fff6d0", encendida); for (let k = 0; k < 6; k++) trazo(P, x, y + 2, x - 8 + k * 3.2, 140, "#ffd27a", 0.12 * encendida); P.caja(x - 10, y, 21, 34); }
        if (vuelta > 0 && vuelta < 1) bola(arco(suave(vuelta), x, y, m.vx, m.vy));
      });
    } };

  E[15] = { nombre: "¡La reina ataca!", dura: 5,
    prepara() { return { x: 170, y: 84 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.08) { halo(P, m.x, m.y, 8 + u * 120, "#ffffff", 1 - u / 0.08); P.R(0, 0, 320, 180, "#ffffff", 0.3 * (1 - u / 0.08)); }
      const f = tramo(u, 0.04, 0.7);
      if (f > 0 && f < 1) for (let i = 0; i < 26; i++) { const an = -Math.PI * (0.05 + P.ruido(i) * 0.9), v = 20 + P.ruido(i + 3) * 40, w = 1 + Math.floor(P.ruido(i + 9) * 3); P.R(m.x + Math.cos(an) * v * f, m.y + Math.sin(an) * v * f + 60 * f * f, w, w, i % 3 ? "#3a3a44" : "#6a6a74", 1); }
      const p = tramo(u, 0.06, 1);
      if (p > 0 && p < 1) for (let k = 0; k < 8; k++) P.bola(m.x - 24 + k * 7, m.y + 20 - p * 16 - (k % 2) * 4, 6 + p * 8, 5 + p * 6, k % 2 ? "#c8c4bc" : "#a8a49c", (1 - p) * 0.95);
    } };

  E[17] = { nombre: "¡BANG!", dura: 4.5,
    prepara() { return {}; },
    dibuja(m, u, t, P) {
      P.rapido();
      [0.04, 0.14].forEach((u0) => { const f = tramo(u, u0, u0 + 0.08); if (f > 0 && f < 1) { P.R(0, 0, 320, 180, "#c87aff", 0.35 * (1 - f)); halo(P, 245, 120, 12 + f * 30, "#e8c8ff", 1 - f); } });
      const g = env(u, 0.12, 0.2, 0.7, 0.9);
      if (g > 0) for (let i = 0; i < 20; i++) { const y = 46 + P.ruido(i) * 104, L = 20 + P.ruido(i + 5) * 40, x = 320 - ((t * 400 + P.ruido(i + 9) * 320) % 400); P.R(x, y, L, 1, "#ffffff", 0.7 * g); }
      if (g > 0) [102, 206].forEach((wx) => { for (let i = 0; i < 6; i++) { const f = (t * 3 + i / 6) % 1; P.R(wx + 4 + f * 20, 150 - f * 8 + f * f * 10, 1, 1, i % 2 ? "#ffe06a" : "#ff8a2a", g * (1 - f)); } });
    } };

  E[18] = { nombre: "La casa grita", dura: 5.5,
    prepara({ c }) { return { casa: trozo(c, 116, 20, 120, 92) }; },
    dibuja(m, u, t, P) {
      const tiembla = env(u, 0.08, 0.12, 0.6, 0.66);
      if (tiembla > 0) { P.rapido(); P.imagen(m.casa, 116 + (Math.floor(t * 24) % 2 ? 1 : -1) * Math.round(tiembla), 20); }
      if (tiembla > 0) for (let k = 0; k < 3; k++) { const f = (t * 1.5 + k / 3) % 1, r = 8 + f * 50; for (let j = -6; j <= 6; j++) { const an = Math.PI * 1.5 + j * 0.16; P.R(175 + Math.cos(an) * r * 1.3, 64 + Math.sin(an) * r * 0.9, 2, 1, "#ffffff", (1 - f) * tiembla * 0.9); } }
      for (let i = 0; i < 6; i++) { const g = tramo(u, 0.1 + i * 0.03, 0.75 + i * 0.03); if (g <= 0 || g >= 1) continue; P.rapido(); const x = 160 + i * 10 - g * (120 + i * 12), y = 24 - g * 30 + Math.sin(g * 10 + i) * 3, ala = Math.floor(t * 8 + i) % 2; P.R(x, y, 3, 1, "#1a1418"); P.R(x - 2, y - (ala ? 2 : -1), 2, 1, "#1a1418"); P.R(x + 3, y - (ala ? 2 : -1), 2, 1, "#1a1418"); }
    } };

  E[19] = { nombre: "El trébol de los leprechauns", dura: 7.5,
    prepara() { return { cx: 148, cy: 44 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const forma = sale(tramo(u, 0.03, 0.35)), a = u > 0.82 ? (1 - u) / 0.18 : 1;
      if (forma > 0) {
        P.caja(m.cx - 52, m.cy - 52, 104, 104);
        for (let h = 0; h < 3; h++) { const rot = -Math.PI / 2 + (h * TAU) / 3; for (let k = 0; k < 60 * forma; k++) { const th = (k / 60) * TAU, hx = 16 * Math.sin(th) ** 3, hy = -(13 * Math.cos(th) - 5 * Math.cos(2 * th) - 2 * Math.cos(3 * th) - Math.cos(4 * th)), s = 1.15, lx = hx * s, ly = hy * s - 12, x = m.cx + lx * Math.cos(rot + Math.PI / 2) - ly * Math.sin(rot + Math.PI / 2), y = m.cy + lx * Math.sin(rot + Math.PI / 2) + ly * Math.cos(rot + Math.PI / 2); P.ctx.globalAlpha = a; P.ctx.fillStyle = (k + Math.floor(t * 12)) % 5 ? "#3fe87a" : "#ffe06a"; P.ctx.fillRect(Math.round(x), Math.round(y), 2, 2); } }
        P.ctx.globalAlpha = 1;
        for (let k = 0; k < 18; k++) P.R(m.cx + 1 + k * 0.7, m.cy + k * 1.8, 2, 2, "#3fe87a", a * forma);
      }
      const lluvia = env(u, 0.3, 0.45, 0.85, 1);
      if (lluvia > 0) for (let i = 0; i < 40; i++) { const x = 84 + P.ruido(i) * 124 + Math.sin(t * 2 + i) * 4, y = m.cy + 20 + ((t * 40 + P.ruido(i + 3) * 120) % 120), g = Math.floor(t * 8 + i) % 3; P.R(x, y, g ? 2 : 1, 2, g === 1 ? "#fff2a0" : "#e8b830", lluvia); }
    } };

  E[21] = { nombre: "El caldero del cementerio", dura: 6.5,
    prepara() { return { x: 214, y: 121 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.8, 1);
      for (let i = 0; i < 8; i++) { const f = (t * 1.6 + i / 8) % 1; P.bola(m.x - 10 + i * 3, m.y - 2 - f * 6, 1.5 + f, 1.5 + f, "#e8f0ff", a * (1 - f)); }
      for (let i = 0; i < 14; i++) { const f = (t * 0.35 + i / 14) % 1, x = m.x - 4 - f * 70 + Math.sin(f * 6 + i) * 6, y = m.y - 6 - f * 100; P.bola(x, y, 4 + f * 9, 3 + f * 6, i % 2 ? "#f4f6fa" : "#d8dce6", a * (1 - f) * 0.9); }
      if (u > 0.2 && u < 0.7) chorro(P, m.x, m.y - 4, (t * 1.3) % 1, 14, -Math.PI * 0.95, -Math.PI * 0.05, 26, ["#ffe06a", "#ff8a2a", "#ffffff"], Math.floor(t * 1.3) * 17, 20);
    } };

  E[22] = { nombre: "El retrato que grita", dura: 5.5,
    prepara() { return { x: 62, y: 46 }; },
    dibuja(m, u, t, P) {
      const abre = u < 0.15 ? sale(u / 0.15) : u < 0.75 ? 1 : 1 - suave(tramo(u, 0.75, 0.9)), w = Math.round(abre * 14);
      if (u < 0.2 || u > 0.7) P.rapido();
      if (w > 0) {
        P.R(m.x - w, 18, w * 2, 52, "#1a1210"); P.R(m.x - w, 18, 1, 52, "#5a1018"); P.R(m.x + w - 1, 18, 1, 52, "#5a1018");
        if (w > 6) { P.bola(m.x, m.y, 6, 8, "#d8c8b0", 1); P.R(m.x - 4, m.y - 9, 8, 3, "#3a3030"); P.R(m.x - 3, m.y - 2, 2, 1, "#1a1210"); P.R(m.x + 1, m.y - 2, 2, 1, "#1a1210"); P.bola(m.x, m.y + 4, 2, 2 + Math.abs(Math.sin(t * 20)), "#3a1010", 1); }
      }
      if (abre > 0.9 && u < 0.75) { P.rapido(); for (let k = 0; k < 3; k++) { const f = (t * 1.6 + k / 3) % 1, r = 10 + f * 120; for (let j = -6; j <= 6; j++) { const an = j * 0.12; P.R(m.x + Math.cos(an) * r, m.y + Math.sin(an) * r * 0.8, 2, 1, "#ffffff", (1 - f) * 0.9); } } }
    } };

  E[23] = { nombre: "Los platos de gatitos", dura: 6,
    prepara({ c }) { const p = [[54, 27], [225, 27], [258, 27], [63, 60], [97, 60], [200, 60], [233, 60]]; return { p: p.map(([x, y]) => ({ x, y, img: trozo(c, x - 13, y - 13, 26, 26) })) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.06, 0.88, 1);
      m.p.forEach((p, i) => {
        const ritmo = Math.sin(t * 7 + i * 1.3), salto = Math.max(0, ritmo) * 2 * a;
        girada(P, p.img, p.x, p.y - salto, ritmo * 0.12 * a, 1, 1);
        const f = (t * 0.7 + i / 7) % 1;
        if (a > 0.5) girada(P, CORAZON, p.x + 10 + Math.sin(f * 6 + i) * 3, p.y - 8 - f * 22, Math.sin(t * 3 + i) * 0.2, 1 - f, 1.6);
      });
    } };

  E[24] = { nombre: "Las profecías rotas", dura: 6.5,
    prepara() { return { o: [[0.02, 92, 34], [0.12, 228, 42], [0.22, 96, 60], [0.32, 234, 30], [0.42, 90, 92]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.o.forEach(([u0, x, y0], i) => {
        const g = tramo(u, u0, u0 + 0.12), suelo = 162, xs = x + (x < 160 ? 14 : -14);
        if (g > 0 && g < 1) { const xx = x + (xs - x) * g, yy = y0 + (suelo - y0) * g * g; halo(P, xx, yy, 7, "#9ad8ff", 0.9); P.bola(xx, yy, 3.5, 3.5, "#d8f4ff", 1); P.R(xx - 1, yy - 2, 2, 1, "#ffffff"); }
        const f = tramo(u, u0 + 0.12, u0 + 0.5);
        if (f > 0 && f < 1) { chorro(P, xs, suelo, tope(f * 3), 14, -Math.PI, 0, 20, ["#ffffff", "#9ad8ff"], i * 11, 24, 2); for (let k = 0; k < 4; k++) P.bola(xs + Math.sin(f * 5 + k) * 6, suelo - f * 70 - k * 8, 5 + k, 4 + f * 4, "#9ad0f4", (1 - f) * 0.75); }
      });
    } };

  E[25] = { nombre: "El caldero que estalla", dura: 5.5,
    prepara() { return { x: 160, y: 118 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.45) { const f = u / 0.45; for (let i = 0; i < 4 + f * 10; i++) { const ff = (t * (1 + f * 2) + i / 10) % 1; P.bola(m.x - 8 + P.ruido(i) * 16, m.y - 2 - ff * (6 + f * 10), 1 + f * 1.5, 1 + f * 1.5, "#c87ae8", 1 - ff); } if (f > 0.7 && Math.floor(t * 20) % 2) P.R(m.x - 10, m.y + 2, 20, 1, "#e8c8ff", 0.6); return; }
      const f = tramo(u, 0.45, 1);
      if (f < 0.05) P.R(0, 0, 320, 180, "#e8c8ff", 0.4);
      estallido(P, m.x, m.y - 4, f, 26, ["#ffffff", "#e8b8ff", "#c87ae8", "#8a3ad0"], "#8a8090", 6);
      for (let i = 0; i < 14; i++) { const an = -Math.PI * (0.05 + P.ruido(i + 30) * 0.9), v = 30 + P.ruido(i + 40) * 40, g = tope(f * 1.4); P.bola(m.x + Math.cos(an) * v * g, m.y - 4 + Math.sin(an) * v * g + 60 * g * g, 2, 2, i % 2 ? "#a84ae0" : "#c87ae8", 1 - tramo(f, 0.8, 1)); }
    } };

  E[27] = { nombre: "Los enfiri", dura: 6.5, detras: true,
    prepara() { return { mano: lienzo(MANO, { W: "#c8d0c4" }), l: capa(10, 20), h: [[96, 152], [118, 158], [140, 150], [168, 156], [190, 150], [206, 160], [128, 146]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.h.forEach(([x, y], i) => {
        const s = u < 0.1 + i * 0.04 ? 0 : u < 0.3 + i * 0.04 ? sale(tramo(u, 0.1 + i * 0.04, 0.3 + i * 0.04)) : u < 0.7 ? 1 : 1 - entra(tramo(u, 0.7, 0.9)), alto = Math.round(s * 14);
        if (alto <= 0) return;
        const L = m.l, cc = L.limpia(); cc.save(); cc.translate(5, 20 - alto); cc.rotate(Math.sin(t * 3 + i) * 0.25); cc.scale(1.5, 1.5); cc.drawImage(m.mano, -2.5, 0); cc.fillStyle = "#b8c0b4"; cc.fillRect(-1.5, 8, 3, 8); cc.restore();
        P.imagen(L.cv, x - 5, y - 20);
        aro(P, x, y + 1, 4 + Math.sin(t * 4 + i) * 1, 1.2, "#3fe87a", 0.6, 0);
      });
    } };

  E[29] = { nombre: "Los villancicos", dura: 7.5,
    prepara() { return { nota: lienzo(NOTA, { Y: "#ffe06a" }), cx: 113, cy: 62 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.85, 1);
      halo(P, 150, 100, 26, "#ffd27a", 0.45 * a);
      const ang = Math.sin(t * 4) * 0.5 * a;
      P.caja(m.cx - 8, m.cy - 6, 16, 14); P.ctx.save(); P.ctx.translate(m.cx, m.cy - 4); P.ctx.rotate(ang); P.ctx.fillStyle = "#e8c050"; P.ctx.fillRect(-3, 0, 6, 5); P.ctx.fillRect(-4, 5, 8, 1); P.ctx.restore();
      if (Math.abs(Math.cos(t * 4)) > 0.95) for (let k = 0; k < 2; k++) aro(P, m.cx, m.cy, 8 + k * 4, 6 + k * 3, "#ffe6a0", 0.7, 1);
      for (let i = 0; i < 9; i++) { const f = (t * 0.25 + i / 9) % 1, x = 120 + P.ruido(i) * 70 + Math.sin(f * 6 + i) * 6, y = 96 - f * 80; girada(P, m.nota, x, y, Math.sin(t * 3 + i) * 0.3, a * Math.sin(f * Math.PI), 1.4); }
    } };

  E[30] = { nombre: "La maldición Gemino", dura: 7, detras: true,
    prepara() { return { copa: lienzo(COPA, { Y: "#e8b830", y: "#fff2a0" }), x: 160, y: 120 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.05, 0.85, 1), n = Math.floor(tramo(u, 0.05, 0.7) * 90);
      for (let i = 0; i < n; i++) {
        const g = tope((u - 0.05 - i * 0.01) / 0.12), an = Math.PI * (0.1 + P.ruido(i) * 0.8), d = 10 + P.ruido(i + 3) * 84, x = m.x + Math.cos(an) * d * g * (P.ruido(i + 7) < 0.5 ? 1 : -1), y = m.y + 6 + Math.sin(an) * d * 0.5 * g - Math.sin(g * Math.PI) * 10;
        if (i % 7 === 0) girada(P, m.copa, x, y - 4, 0, a, 2); else { P.R(x - 1, y, 4, 2, "#b8801a", a); P.R(x - 1, y, 3, 1, "#ffd84a", a); if ((i + Math.floor(t * 10)) % 5 === 0) P.R(x, y - 1, 1, 1, "#ffffff", a); }
      }
      if (u < 0.7) halo(P, m.x, m.y, 10, "#ffe06a", 0.6 * a);
    } };

  E[31] = { nombre: "Lo que enseña el espejo", dura: 7,
    prepara({ u, c, quien, luz }) {
      const m = { cristal: mascara(c, 133, 20, 52, 92, (r, g, b) => b > 170 && g > 170), l: capa(52, 92), x: 159, y: 64 };
      if (quien("Quarrell") || quien("Valdemoro")) return { ...m, piedra: true };
      return { ...m, padres: [figura(u, "Jemas", luz), figura(u, "Rily", luz)] };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.85, 1), L = m.l, cc = L.limpia(), p = env(u, 0.2, 0.36, 0.74, 0.88);
      if (m.padres && p > 0) {
        const [j, l] = m.padres, e = Math.min(1, 48 / (j.width + l.width)), jw = Math.round(j.width * e), jh = Math.round(j.height * e), lw = Math.round(l.width * e), lh = Math.round(l.height * e);
        cc.globalAlpha = 0.92 * p; cc.drawImage(j, 2, 90 - jh, jw, jh); cc.drawImage(l, 50 - lw, 90 - lh, lw, lh); cc.globalAlpha = 1;
      }
      cc.fillStyle = "#ffffff";
      for (let jj = 0; jj < 92; jj += 3) { const x = 26 + Math.sin(jj / 7 + t * 4) * 14; cc.globalAlpha = 0.35; cc.fillRect(Math.round(x) - 6, jj, 12, 1); }
      cc.globalAlpha = 1; L.recorta(m.cristal); P.imagen(L.cv, 133, 20, m.padres ? Math.max(a, p) : a);
      if (m.padres && p > 0) halo(P, m.x, m.y + 10, 24, "#fff6d8", 0.3 * p);
      const pp = m.piedra ? env(u, 0.2, 0.4, 0.75, 0.9) : 0;
      if (pp > 0) { const y = m.y + Math.sin(t * 2) * 3; halo(P, m.x, y, 10, "#ff3a4a", pp); P.bola(m.x, y, 4, 5, "#c8202a", pp); P.R(m.x - 2, y - 3, 2, 2, "#ff9aa8", pp); P.R(m.x + 1, y + 1, 1, 2, "#7a1018", pp); }
    } };

  E[34] = { nombre: "La boa se escapa", dura: 7, detras: true,
    prepara({ c }) { return { cristal: mascara(c, 95, 28, 132, 88, (r, g, b) => g > 150 && g > r + 10), l: capa(132, 88) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const des = env(u, 0.02, 0.1, 0.12, 0.25);
      if (des > 0) { const L = m.l, cc = L.limpia(); cc.fillStyle = "#ffffff"; for (let j = 0; j < 88; j += 2) { const x = (j * 7 + Math.floor(t * 40)) % 140 - 4; cc.fillRect(x, j, 8, 1); } L.recorta(m.cristal); P.imagen(L.cv, 95, 28, des); for (let i = 0; i < 16; i++) P.R(100 + P.ruido(i) * 120, 30 + P.ruido(i + 4) * 80, 1, 1, "#ffffff", des); }
      const g = tramo(u, 0.2, 1);
      if (g <= 0) return;
      const camino = (s) => (s < 37 ? [200 - (14 * s) / 37, 112 + (34 * s) / 37] : [186 - (s - 37), 146 + Math.sin((186 - (s - 37)) / 9 + t * 5) * 3]);
      const cab = g * 280;
      for (let i = 30; i >= 0; i--) { const s = cab - i * 4; if (s < 0) continue; const [x, y] = camino(s), r = 4.5 - i * 0.09; P.bola(x, y, r + 0.5, r, i % 4 < 2 ? "#8a7a3a" : "#5a4a24", 1); if (i % 3 === 0) P.R(x - 1, y - 1, 2, 1, "#c8b878"); }
      const [hx, hy] = camino(cab);
      P.R(hx - 5, hy - 2, 6, 5, "#8a7a3a"); P.R(hx - 3, hy - 1, 1, 1, "#1a1410");
      if (Math.floor(t * 6) % 2) { P.R(hx - 9, hy, 4, 1, "#e83a3a"); P.R(hx - 10, hy - 1, 1, 1, "#e83a3a"); P.R(hx - 10, hy + 1, 1, 1, "#e83a3a"); }
    } };

  E[35] = { nombre: "La rana de chocolate", dura: 6,
    prepara() { return { f: RANA.map((g) => lienzo(g, { K: "#d8a070", C: "#8a5a30" })) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const saltos = [[204, 152], [186, 128], [164, 110], [140, 98], [126, 84], [150, 70]], n = saltos.length - 1, g = tramo(u, 0.05, 0.9) * n, i = Math.min(n - 1, Math.floor(g)), f = g - i;
      const [x0, y0] = saltos[i], [x1, y1] = saltos[i + 1], x = x0 + (x1 - x0) * f, y = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * 12;
      if (u > 0.9) { const h = tramo(u, 0.9, 1); girada(P, m.f[1], 150 + h * 30, 70 - h * 20, 0, 1 - h, 2.4); return; }
      halo(P, x, y, 8, "#fff2c8", 0.4);
      girada(P, m.f[f > 0.1 && f < 0.9 ? 1 : 0], x, y, 0, 1, 2.4);
    } };

  E[36] = { nombre: "Nyrtle se enfada", dura: 5.5, detras: true,
    prepara() { return { x: 94, y: 60 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const f = env(u, 0.05, 0.15, 0.6, 0.75);
      if (f > 0) { P.R(m.x - 2, m.y - 30 * f, 4, 30 * f, "#e8f8ff", 0.85 * f); for (let i = 0; i < 56; i++) { const ff = (t * 1.2 + i / 56) % 1, an = -Math.PI * (0.2 + P.ruido(i) * 0.6); P.R(m.x + Math.cos(an) * 64 * ff, m.y - 30 * f + Math.sin(an) * 40 * ff + 110 * ff * ff, 3, 2, i % 3 ? "#bfe6ff" : "#ffffff", f * (1 - ff * 0.5)); } }
      for (let k = 0; k < 3; k++) { const g = tramo(u, 0.15 + k * 0.15, 0.7 + k * 0.1); if (g > 0 && g < 1) aro(P, 120 + k * 30, 150 + k * 6, 4 + g * 30, 1.5 + g * 6, "#ffffff", 1 - g, 1); }
    } };

  E[37] = { nombre: "¡Ridiculus!", dura: 6.5,
    prepara({ c }) { return { arm: trozo(c, 126, 30, 58, 96), som: lienzo(BUITRE, { G: "#8a8a90", K: "#1a1a1a", O: "#e8a030", D: "#4a3a30", H: "#3a6a3a", R: "#c8282a" }), x: 155, y: 34 }; },
    dibuja(m, u, t, P) {
      const tiembla = env(u, 0.02, 0.06, 0.28, 0.3);
      if (tiembla > 0) { P.rapido(); P.imagen(m.arm, 126 + (Math.floor(t * 20) % 2 ? 1 : -1), 30); }
      const s = u < 0.3 ? 0 : u < 0.42 ? sale(tramo(u, 0.3, 0.42)) : u < 0.75 ? 1 : 1 - entra(tramo(u, 0.75, 0.85));
      if (u > 0.28 && u < 0.86) P.rapido();
      if (s > 0) { girada(P, m.som, m.x, m.y - s * 20 + Math.sin(t * 4) * 1.5, Math.sin(t * 3) * 0.1, 1, 3); if (u > 0.3 && u < 0.4) for (let i = 0; i < 12; i++) { const an = (i / 12) * TAU; P.R(m.x + Math.cos(an) * (10 + s * 18), m.y - 10 + Math.sin(an) * (6 + s * 10), 1, 1, "#ffffff", 1 - s); } }
      const f = tramo(u, 0.85, 1);
      if (f > 0 && f < 1) for (let i = 0; i < 18; i++) { const an = (i / 18) * TAU; P.R(m.x + Math.cos(an) * f * 26, m.y - 14 + Math.sin(an) * f * 18, 1, 1, i % 2 ? "#fff2a0" : "#ffffff", 1 - f); }
    } };

  E[39] = { nombre: "La nieve encantada", dura: 8,
    prepara() { return { luces: [[200, 52], [206, 60], [196, 64], [212, 48], [284, 56], [276, 46], [290, 64], [280, 36]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.85, 1);
      for (let i = 0; i < 60; i++) { const x = 80 + P.ruido(i) * 240 + Math.sin(t * 1.2 + i) * 6, y = -6 + ((t * 14 + P.ruido(i + 5) * 190) % 192), g = Math.floor(t * 4 + i) % 2; P.R(x, y, 2, 2, "#ffffff", a); if (i % 2 === 0) { P.R(x - 1, y + 0.5, 4, 1, g ? "#e8f4ff" : "#ffffff", a * 0.8); P.R(x + 0.5, y - 1, 1, 4, g ? "#ffffff" : "#e8f4ff", a * 0.8); } }
      m.luces.forEach(([x, y], i) => { if ((i + Math.floor(t * 4)) % 3) { halo(P, x, y, 5, ["#ff5a5a", "#ffe06a", "#5ad8ff", "#7aff7a"][i % 4], a); P.R(x, y, 1, 1, "#ffffff", a); } });
    } };

  E[40] = { nombre: "Los potranus del ED", dura: 7.5,
    prepara() { const k = { W: "#e8f4ff", K: "#a8c8f0" }; return { a: [LIEBRE, NUTRIA, PERRO, CISNE].map((g) => lienzo(g, k)) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.a.forEach((img, i) => {
        const u0 = i * 0.1, g = tramo(u, u0, u0 + 0.6), a = env(g, 0, 0.15, 0.75, 1);
        if (a <= 0) return;
        const x = 84 + (i % 2 ? g * 120 : 120 - g * 120) + i * 4, y = 108 + i * 12 - Math.abs(Math.sin(g * Math.PI * 4)) * (i === 0 ? 10 : 4);
        halo(P, x, y, 14, "#9ac8ff", a * 0.7);
        girada(P, i % 2 ? img : lienzoEspejo(img), x, y, 0, a, 2.2);
        for (let k = 0; k < 5; k++) { const f = (t * 1.5 + k / 5) % 1; P.R(x - (i % 2 ? 1 : -1) * (8 + f * 16), y + Math.sin(k * 2 + t) * 3, 1, 1, "#ffffff", a * (1 - f)); }
      });
    } };
  const espejos = new Map();
  function lienzoEspejo(img) { if (!espejos.has(img)) { const l = capa(img.width, img.height); l.c.save(); l.c.scale(-1, 1); l.c.drawImage(img, -img.width, 0); l.c.restore(); espejos.set(img, l.cv); } return espejos.get(img); }

  E[41] = { nombre: "Llamas verdes en la chimenea", dura: 5.5,
    prepara() { return { x: 94, y: 136 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const f = env(u, 0.05, 0.15, 0.55, 0.8);
      if (f > 0) { halo(P, m.x, m.y - 14, 16, "#7aff5a", f); for (let i = 0; i < 28; i++) { const ff = (t * 1.8 + i / 28) % 1, x = m.x - 10 + P.ruido(i) * 20 + Math.sin(ff * 6 + i) * 2; P.R(x, m.y - ff * 46, 2, 3, ["#e8ffc0", "#b0ff80", "#64ec4c", "#2cc03a"][Math.floor(ff * 4)], f * (1 - ff * 0.4)); } }
      const g = env(u, 0.18, 0.3, 0.5, 0.6);
      if (g > 0) { const giro = t * 12; P.caja(m.x - 8, m.y - 40, 16, 40); P.ctx.save(); P.ctx.globalAlpha = g; P.ctx.translate(m.x, m.y - 18); P.ctx.scale(Math.cos(giro), 1); P.ctx.fillStyle = "#2a2a3a"; P.ctx.fillRect(-4, -8, 8, 18); P.ctx.fillStyle = "#f2c8a0"; P.ctx.fillRect(-2, -13, 4, 5); P.ctx.restore(); }
      const c = tramo(u, 0.55, 0.85);
      if (c > 0 && c < 1) for (let i = 0; i < 6; i++) P.bola(m.x - 10 + i * 4, m.y - 4 - c * 18, 3 + c * 4, 2 + c * 3, "#6a6a6a", (1 - c) * 0.7);
    } };

  E[42] = { nombre: "La espada bajo el hielo", dura: 6,
    prepara() { return { x: 195, y: 158 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const brillo = env(u, 0.02, 0.15, 0.3, 0.4);
      if (brillo > 0) { const g = tramo(u, 0.02, 0.35); halo(P, m.x - 10 + g * 20, m.y - 2 + g * 3, 6, "#fff6c8", brillo); trazo(P, m.x - 14, m.y - 4, m.x + 14, m.y + 3, "#fff2a0", brillo); }
      const raja = tramo(u, 0.32, 0.55);
      if (raja > 0) { const a = u > 0.85 ? (1 - u) / 0.15 : 1; P.caja(m.x - 40, m.y - 14, 80, 24); for (let k = 0; k < 8; k++) { const an = (k / 8) * TAU + 0.3, L = (14 + P.ruido(k) * 22) * raja; trazo(P, m.x, m.y, m.x + Math.cos(an) * L, m.y + Math.sin(an) * L * 0.3, "#ffffff", a); if (L > 10) trazo(P, m.x + Math.cos(an) * L * 0.6, m.y + Math.sin(an) * L * 0.18, m.x + Math.cos(an + 0.5) * L * 0.9, m.y + Math.sin(an + 0.5) * L * 0.27, "#e8f4ff", a); } }
      const f = tramo(u, 0.55, 0.95);
      if (f > 0 && f < 1) { chorro(P, m.x, m.y - 2, f, 30, -Math.PI * 0.9, -Math.PI * 0.1, 36, ["#ffffff", "#bfe6ff"], 9, 40, 2); aro(P, m.x, m.y, 6 + f * 20, 2 + f * 5, "#ffffff", 1 - f, 0); }
    } };

  E[43] = { nombre: "Las lechuzas del andén", dura: 7,
    prepara() { return { b: [{ W: "#f4f4f4", B: "#f4f4f4", E: "#1a1a1a", Y: "#e8b040" }, { W: "#a87a4a", B: "#8a5a32", E: "#1a1a1a", Y: "#e8b040" }, { W: "#9a9aa0", B: "#7a7a80", E: "#ffcc40", Y: "#e8b040" }].map((k) => BUHO.map((g) => lienzo(g, k))) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.b.forEach((f, i) => {
        const g = tramo(u, 0.05 + i * 0.12, 0.75 + i * 0.08), x = 160 + Math.sin(g * Math.PI * 1.6 + i) * (30 + i * 10), y = 104 - g * 96;
        if (g <= 0 || g >= 1) return;
        girada(P, f[Math.floor(t * 7 + i) % 2], x, y, 0, g > 0.85 ? (1 - g) / 0.15 : 1, 2.4);
        if (g < 0.1) for (let k = 0; k < 4; k++) P.R(162 + k * 3 - 6, 104 + g * 40, 1, 1, "#ffffff", 1 - g * 10);
      });
    } };

  E[44] = { nombre: "Las burbujas de colores", dura: 7,
    prepara() { return { g: [[96, 116], [130, 116], [190, 116]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.1, 0.85, 1), COLS = ["#ff8ac8", "#8ad8ff", "#fff28a", "#9aff9a", "#c8a8ff"];
      for (let i = 0; i < 30; i++) {
        const [gx, gy] = m.g[i % 3], f = (t * 0.22 + P.ruido(i)) % 1, x = gx + (P.ruido(i + 4) - 0.5) * 40 * f + Math.sin(t * 2 + i) * 3, y = gy + 4 + f * 30 - Math.sin(f * Math.PI) * 40, r = 1.5 + P.ruido(i + 8) * 3;
        if (f > 0.92) { aro(P, x, y, r + 2, r + 2, "#ffffff", a * (1 - f) * 8, 1); continue; }
        aro(P, x, y, r, r, COLS[i % 5], a, 0); P.R(x - r * 0.5, y - r * 0.5, 1, 1, "#ffffff", a);
      }
    } };

  E[45] = { nombre: "El dragón alza el vuelo", dura: 7,
    prepara() { return { f: DRAGON.map((g) => lienzo(g, { W: "#3a2a30", B: "#2a1e22", T: "#2a1e22", H: "#2a1e22", K: "#ffb040", L: "#2a1e22" })) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const g = tramo(u, 0.02, 0.95), x = 184 - g * 200, y = 118 - Math.sin(g * Math.PI * 0.6) * 90 - g * 20;
      if (g <= 0 || g >= 1) return;
      halo(P, x + 12, y + 6, 8, "#ff8a2a", 0.3);
      girada(P, m.f[Math.floor(t * 4) % 2], x, y, -0.25 + g * 0.2, 1, 1.6);
      if (u > 0.4 && u < 0.55) { const f = tramo(u, 0.4, 0.55); for (let i = 0; i < 16; i++) P.R(x - 18 - i * 3, y + 6 + Math.sin(i + t * 20) * (1 + i * 0.2), 2, 2, ["#fff6c8", "#ffd23a", "#ff8a2a"][Math.min(2, i >> 2)], 1 - f * 0.6); }
    } };

  Momentos.escena.magos = E;
})();
