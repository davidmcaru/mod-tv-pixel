// momentos-ninjas.js — la animación de cada escenario de Ninjas: unos segundos de algo de ese sitio.
(function () {
  if (!window.Momentos || !Momentos.util) return;
  const { TAU, suave, sale, entra, tope, lienzo, figura, capa, mascara, trozo, girada, halo, rayo, estallido, aro } = Momentos.util;
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
  function brochazo(P, pts, col, f, a) {
    const n = pts.length - 1, hasta = f * n;
    for (let i = 0; i < n; i++) { if (i >= hasta) break; const g = Math.min(1, hasta - i), [x0, y0] = pts[i], [x1, y1] = pts[i + 1], xe = x0 + (x1 - x0) * g, ye = y0 + (y1 - y0) * g; trazo(P, x0, y0, xe, ye, col, a); trazo(P, x0, y0 + 1, xe, ye + 1, col, a); }
  }
  const quienX = (q, def) => (q ? { x: q.x + q.w / 2, y: q.y, top: q.top } : def);

  const KUNAI = ["O.KKKKSSSS..", "OKKKKKSSSSSL", "O.KKKKSSSS.."];
  const SHURIKEN = ["...S...", "...S...", "..SSS..", "SSSKSSS", "..SSS..", "...S...", "...S..."];
  const CABEZA_S = ["..........DDDDDDDDDDD.........", ".......DDDPPPPPPPPPPPDDD......", ".....DDPPpPPSPPPPSPPPPPPDD....", "....DPPppppPPPPPPPPPSPPPPPPD..",
    "...DPPpppDDDPPPSPPPPPPPSPPPPD.", "..DPPPPPDYYYDPPPPPPSPPPPPPPPPD", ".DNPPPPDYYKYYDPPSPPPPPPSPPPPPD", "DPPPPPPDYYKYYDPPPPPPSPPPPPPPPD",
    "DPPPPPPPDYYYDPPPSPPPPPPPSPPPPD", "DPPPPPPPPDDDPPPPPPPPSPPPPPPPPD"];
  const CABEZA_S_CERRADA = [...CABEZA_S, "DMMMMMMMMMMMMMMMPPPPPPPSPPPPPD", "DBBBBBBBBBBBBBBBMMPPPPPPPPPPPD", ".DBBBbBBBBBbBBBBBBMMPPPSPPPPPD", "..DBBBBBBbBBBBBBbBBBMMPPPPPPPD",
    "...DDBBBBBBBBBBBBBBBBBMPPPPPD.", ".....DDDBBBBBbBBBBBBBBBMPPPD..", "........DDDDDDBBBBBBBBBBMPD...", "..............DDDDDDDDDDDD...."];
  const CABEZA_S_ABIERTA = [...CABEZA_S, "DMTMMMMMMMMTMMMMPPPPPPPSPPPPPD", ".TKKKKKKKKKTKKKKMMPPPPPPPPPPPD", "..KKKKKKKKKKKKKKKMMPPPSPPPPPD.", "..KKKKRRRRRKKKKKKKMMPPPPPPPD..",
    "..TKKKKKKKKKKKKKTKKMMPPPPPD...", ".DBTBBBBBBBBBBBTBBBBMPPPPD....", "..DBBBBbBBBBBbBBBBBBMPPD......", "...DDBBBBBBBBBBBBBBBMPD.......",
    "......DDDDDDDBBBBBBBMD........", ".............DDDDDDDDD........"];
  const SERPIENTE = ["....DDDDDD....", "..DDPPPPPPDD..", ".DPPPYKPPPPPD.", "DPPPPYYPPPPPPD", "LLPPPPPPPPPPPD", ".DPPPPPPPPPPD.", "..DDPPPPPPDD..", "....DDDDDD...."];
  const DRAGON_AGUA = ["....WWWW........", "..WWBBBBWW..W...", ".WBBBBBBBBWWBW..", "WBBKBBBBBBBBBBW.", "WBBBBBBBBBBBBTTW", ".WBBBBBBBBTTTT..", "..WWBBBBBBBBBW..", "....WWWWWWWWW..."];
  const SAPO = ["....WW........WW......", "...WKKW......WKKW.....", "...WKKWOOOOOOWKKW.....", "..OOWWOOOOOOOOWWOO....", ".OOOOOOOOOOOOOOOOOO...", "OOOOOOOOOOOOOOOOOOOO..",
    "OOMMMMMMMMMMMMMMMMOO..", "OOOOOOOOOOOOOOOOOOOO..", ".OOOOYYYYYYYYYYOOOO...", "..OOOYYYYYYYYYYOOO....", ".OOO.OOOOOOOOOO.OOO...", "OOO...OOO..OOO...OOO.."];
  const HALCON = [
    ["......BB.......", ".....BBB.......", "....BBBb.......", "YKHHBBBBBBBBTT.", "..HHHHHHHHBBTTT", "....WWWW......."],
    ["...............", "...............", "...............", "YKHHBBBBBBBBTT.", "..HHHHHHbBBTTTT", "....WWBBBb.....", "......BBB......", ".......BB......"],
    ["...............", "...............", "...HH..........", "YKHHHBBBBB.....", "..HHWWBBBBBB...", "....WWBBBBBBT..", "......BBBBBTT..", ".......T..T...."],
  ];
  const JARIIYA = ["..W..W.W..W.....", ".WWWWWWWWWWW....", "WWWWWWWWWWWWW...", "WWHHHHHHHHWWWW..", "WWHHRRRRHHWWWW..", "WWSSSSSSSSWWWWW.", "WWSKSSSKSSWWWWW.",
    "WWSRSSSRSSWWWWW.", "WWSSSSSSSSWWWWWW", ".WSSSMMSSSWWWWWW", ".WWSSSSSSWWWWWWW", "..WWWWWWWWWWWWW.", "...WWWWWWWWWWW..", "....WWWWWWWWW..."];
  const CUBO = ["KBBBBBBK", ".BLBBLB.", ".BBBBBB.", ".KKKKKK.", ".BBBBBB.", ".BLBBLB.", "..BBBB.."];
  const CIERVO = [
    ["..............A.A...", "...............AA...", "..............BBB...", ".............BBBBK..", "....BBBBBBBBBBBB....", "..WBBBBWBBBBBBBB....",
      "...BBBBBBBWBBBB.....", "...BBBBBBBBBBBB.....", "..BB.........BB.....", ".BB...........BB....", "BB.............BB...", "B...............B..."],
    ["..............A.A...", "...............AA...", "..............BBB...", ".............BBBBK..", "....BBBBBBBBBBBB....", "..WBBBBWBBBBBBBB....",
      "...BBBBBBBWBBBB.....", "...BBBBBBBBBBBB.....", "....BB....BB........", "....BB....BB........", "...BB....BB.........", "...B.....B.........."],
  ];
  const TINTA = [["K.........K", "KK.......KK", ".KKK...KKK.", "..KKKKKKK..", "....KKK....", ".....K....."], ["...........", "...........", "...KKKKK...", "KKKKKKKKKKK", "K...KKK...K", ".....K....."]];
  const OSCURO = ["..K.K.K..K....", ".KKKKKKKKKK...", "KKKKKKKKKKKK..", ".KKKKKKKKKKK..", ".KKRKKKRKKK...", ".KKKKKKKKKK...", "..KKKKKKKK....", "...KKKKKK.....",
    "..KKKKKKKK....", ".KKKKKKKKKK...", "KKKKKKKKKKKK..", "KK.KKKKKK.KK..", "KK.KKKKKK.KK..", "K..KKKKKK..K..", "...KKKKKK.....", "...KKKKKK.....", "...KK..KK.....",
    "...KK..KK.....", "...KK..KK.....", "..KKK..KKK...."];
  const ESPADA_Z = ["......SSSSSSSSSSSSSSSSSSSSSSSSSSL..", "....SSSSSSSSSSSSSSSSSSSSSSSSSSSSLL.", "KKKKSSSSSSSSSSSSSSSSSSSSSSSS..SSLL",
    "KKKKSSSSSSSSSSSSSSSSSSSSSSSS..SSLL", "....SSSSSSSSSSSSSSSSSSSSSSSSSSSSLL.", "......SSSSSSSSSSSSSSSSSSSSSSSSSSL..", "......................DDDDDD......"];
  const HUKA = ["..KKK..", ".KKKKK.", ".KWWWK.", ".KWRWK.", "..WWW..", ".GGGGG.", "GGGGGGG", "GGGGGGG", ".GGGGG.", ".GGGGG.", ".G...G.", ".K...K."];
  const PESA = ["KOOOOOOOOK", "KOOKOOKOOK", "KOOOOOOOOK", "KOOKOOKOOK", "KOOOOOOOOK", "KKKKKKKKKK"];

  const E = {};

  E[1] = { nombre: "Las caras pintadas", dura: 7,
    prepara() {
      const espiral = []; for (let k = 0; k <= 24; k++) { const an = k * 0.55, r = 0.6 + k * 0.22; espiral.push([115 + Math.cos(an) * r, 64 + Math.sin(an) * r]); }
      const gafa = (cx) => { const p = []; for (let k = 0; k <= 14; k++) { const an = (k / 14) * TAU; p.push([cx + Math.cos(an) * 4, 77 + Math.sin(an) * 3.5]); } return p; };
      return { t: [
        [0.04, "#ff7a1a", [[100, 78], [110, 79]]], [0.08, "#ff7a1a", [[100, 82], [110, 82]]], [0.12, "#ff7a1a", [[100, 86], [110, 85]]],
        [0.16, "#ff7a1a", [[120, 79], [130, 78]]], [0.2, "#ff7a1a", [[120, 82], [130, 82]]], [0.24, "#ff7a1a", [[120, 85], [130, 86]]],
        [0.3, "#e83a3a", espiral], [0.38, "#2a6ae8", [[115, 80], [115, 91]]],
        [0.46, "#2a2a30", gafa(211)], [0.5, "#2a2a30", gafa(225)], [0.54, "#2a2a30", [[215, 77], [221, 77]]],
        [0.6, "#2a2a30", [[208, 89], [212, 87], [218, 88], [224, 87], [228, 89]]], [0.66, "#4ac85a", [[203, 66], [208, 63], [213, 66], [218, 63], [223, 66], [228, 63], [233, 66]]],
      ] };
    },
    dibuja(m, u, t, P) {
      const a = u > 0.86 ? 1 - (u - 0.86) / 0.14 : 1;
      if (u < 0.72) P.rapido();
      P.caja(92, 54, 146, 46);
      m.t.forEach(([u0, col, pts]) => { const f = tramo(u, u0, u0 + 0.05); if (f > 0) brochazo(P, pts, col, f, a); });
      const k = m.t.find(([u0]) => u >= u0 && u < u0 + 0.05);
      if (k) { const [x, y] = k[2][Math.min(k[2].length - 1, Math.floor(tramo(u, k[0], k[0] + 0.05) * (k[2].length - 1)))]; P.R(x - 1, y - 3, 3, 3, k[1]); P.R(x, y - 6, 1, 3, "#a07040"); }
      for (let i = 0; i < 5; i++) { const f = ((t * 0.7 + i / 5) % 1); if (u < 0.7) P.R(102 + i * 6, 92 + f * 14, 1, 2, ["#ff7a1a", "#e83a3a", "#2a6ae8"][i % 3], 1 - f); }
    } };

  E[2] = { nombre: "El vapor del ramen", dura: 6.5,
    prepara() { return { x: 160, y: 92, cy: 24 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      for (let i = 0; i < 8; i++) { const f = (t * 0.5 + i / 8) % 1; if (u > 0.85) continue; P.bola(m.x - 30 + i * 9 + Math.sin(f * 6 + i) * 4, m.y - f * 60, 3 + f * 5, 2 + f * 4, "#f4f4f4", (1 - f) * 0.7); }
      const n = env(u, 0.3, 0.45, 0.8, 0.95);
      if (n <= 0) return;
      const r = 14 * n, rot = t * 1.2;
      P.bola(m.x, m.cy, r + 1, r + 1, "#f8f4ee", 1);
      for (let k = 0; k < 28; k++) { const an = (k / 28) * TAU; if (k % 2) P.R(m.x + Math.cos(an) * (r + 1.5), m.cy + Math.sin(an) * (r + 1.5), 1, 1, "#e8e2d8", 1); }
      for (let k = 0; k < 90; k++) { const th = k * 0.14, rr = (th / (90 * 0.14)) * r * 0.85, an = th + rot; P.R(m.x + Math.cos(an) * rr, m.cy + Math.sin(an) * rr, 2, 2, "#ff6a9a", 1); }
      for (let k = 0; k < 6; k++) { const an = (k / 6) * TAU + t; P.bola(m.x + Math.cos(an) * (r + 6), m.cy + Math.sin(an) * (r + 4), 3, 2, "#ffffff", 0.6 * n); }
    } };

  E[3] = { nombre: "Kunai contra los postes", dura: 5,
    prepara() { const k = lienzo(KUNAI, { O: "#c8c8d0", K: "#2a2a34", S: "#a8b0bc", L: "#ffffff" }); return { kunai: k, shu: lienzo(SHURIKEN, { S: "#9aa2ae", K: "#2a2a34" }), t: [[0.04, 131, 102, "k"], [0.2, 161, 112, "k"], [0.36, 191, 96, "s"]] }; },
    dibuja(m, u, t, P) {
      const a = u > 0.88 ? 1 - (u - 0.88) / 0.12 : 1;
      m.t.forEach(([u0, px, py, tipo]) => {
        const g = tramo(u, u0, u0 + 0.12);
        if (g <= 0) return;
        if (g < 1) { P.rapido(); const x = -10 + (px - 6 + 10) * g, y = 64 + (py - 64) * g - Math.sin(g * Math.PI) * 10; if (tipo === "k") { girada(P, m.kunai, x - 8, y, 0, 1, 1.6); for (let i = 1; i < 5; i++) P.R(x - 18 - i * 4, y, 3, 1, "#ffffff", 0.5 - i * 0.1); } else girada(P, m.shu, x, y, t * 25, 1, 2.2); return; }
        const tras = (u - u0 - 0.12) * m.dura, vib = tras < 0.4 ? Math.round(Math.sin(tras * 50) * (1 - tras / 0.4)) : 0;
        if (tras < 0.4) { P.rapido(); for (let i = 0; i < 5; i++) P.R(px - 2 + Math.cos(i * 1.3) * tras * 18, py + Math.sin(i * 1.3) * tras * 12, 1, 1, "#fff2a0", 1 - tras / 0.4); }
        if (tipo === "k") girada(P, m.kunai, px - 7, py + vib, 0, a, 1.6); else girada(P, m.shu, px, py + vib, 0.3, a, 2.2);
      });
    } };

  E[4] = { nombre: "Resangan contra Chodiri", dura: 5.5,
    prepara() { return { cx: 160, cy: 72 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.36) {
        const g = entra(u / 0.36), xr = 92 + (m.cx - 4 - 92) * g, xc = 228 + (m.cx + 4 - 228) * g, y = m.cy + 4 - g * 4;
        halo(P, xr, y, 8, "#7ac0ff", 0.8); P.bola(xr, y, 5, 5, "#5aa8ff", 1); for (let k = 0; k < 10; k++) { const an = t * 18 + k * 0.63; P.R(xr + Math.cos(an) * 4, y + Math.sin(an) * 4, 1, 1, "#ffffff"); } P.bola(xr, y, 2, 2, "#ffffff", 1);
        halo(P, xc, y, 8, "#bfe6ff", 0.8); P.bola(xc, y, 3, 3, "#ffffff", 1); for (let b = 0; b < 4; b++) { const an = P.ruido(b + Math.floor(t * 20)) * TAU; rayo(P, xc, y, xc + Math.cos(an) * 10, y + Math.sin(an) * 8, Math.floor(t * 20) + b, "#ffffff", "#7ab0ff", 3, 0.6); }
        return;
      }
      const f = tramo(u, 0.36, 1), r = 6 + sale(tope(f * 3)) * 22 * (f > 0.7 ? 1 - (f - 0.7) / 0.3 : 1);
      if (f < 0.05) P.R(0, 0, 320, 180, "#ffffff", 0.6 * (1 - f / 0.05));
      P.bola(m.cx, m.cy, r + 3, r + 3, "#ffffff", 0.5); P.bola(m.cx, m.cy, r, r, "#1a1028", 0.95); P.bola(m.cx, m.cy, r * 0.6, r * 0.6, "#3a2a5a", 0.9);
      aro(P, m.cx, m.cy, r + 1, r + 1, "#bfe6ff", 1, 0);
      if (f < 0.85) for (let b = 0; b < 6; b++) { const an = P.ruido(b + Math.floor(t * 16)) * TAU; rayo(P, m.cx + Math.cos(an) * r, m.cy + Math.sin(an) * r, m.cx + Math.cos(an) * (r + 14), m.cy + Math.sin(an) * (r + 10), Math.floor(t * 16) * 3 + b, "#ffffff", "#7ab0ff", 3, 0.6); }
      if (f < 0.5) aro(P, m.cx, m.cy, r + f * 80, (r + f * 80) * 0.6, "#ffffff", (0.5 - f) * 1.6, 1);
    } };

  E[5] = { nombre: "La serpiente del bosque", dura: 7.5,
    prepara({ luz }) { const k = tinteS({ D: "#3a1a4a", P: "#6a3a8a", L: "#e83a5a" }, luz); return { k, cab: lienzo(SERPIENTE, { ...k, Y: "#ffe040", K: "#1a1018" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const cab = 340 - u * 460, Y = (x) => 66 + Math.sin(x / 22 + t * 2) * 8;
      for (let i = 40; i >= 1; i--) { const x = cab + 8 + i * 4.2, r = 6 - (i / 40) * 3.5, y = Y(x); if (x < -8 || x > 328) continue; P.bola(x, y, r + 0.6, r, m.k.P, 1); P.R(x - 1, y - r + 1, 2, 1, m.k.D, 1); if (i % 3 === 0) P.R(x, y + r - 2, 2, 1, "#9a6aba", 1); }
      girada(P, m.cab, cab, Y(cab + 6), 0, 1, 1.5);
      if (Math.floor(t * 5) % 2) { P.R(cab - 13, Y(cab + 6) + 1, 3, 1, "#e83a5a"); P.R(cab - 15, Y(cab + 6), 1, 1, "#e83a5a"); P.R(cab - 15, Y(cab + 6) + 2, 1, 1, "#e83a5a"); }
      halo(P, cab - 3, Y(cab + 6) - 1, 5, "#ffe040", 0.6);
    } };

  E[6] = { nombre: "Las plumas del gunjetsu", dura: 8,
    prepara() { return {}; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.12, 0.82, 1);
      for (let i = 0; i < 40; i++) {
        const x = 70 + P.ruido(i) * 260 + Math.sin(t * 1.4 + i) * 10, y = -8 + ((t * 20 + P.ruido(i + 5) * 190) % 196), g = Math.floor(t * 3 + i) % 2;
        if (g) { P.R(x - 1, y - 1, 9, 4, "#8a90a0", a * 0.8); P.R(x, y, 7, 2, "#ffffff", a); P.R(x + 1, y + 1, 6, 1, "#e0e4ee", a); P.R(x + 7, y + 1, 2, 1, "#6a7080", a); } else { P.R(x - 1, y - 1, 4, 9, "#8a90a0", a * 0.8); P.R(x, y, 2, 7, "#ffffff", a); P.R(x + 1, y + 1, 1, 6, "#e0e4ee", a); P.R(x + 1, y + 7, 1, 2, "#6a7080", a); }
      }
    } };

  E[7] = { nombre: "El remolino de arena", dura: 6.5, detras: true,
    prepara({ quien }) { const g = quienX(quien("Garaa"), { x: 160, y: 160 }); return { x: g.x, y: g.y }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const sube = tope(u * 1.6), a = u > 0.85 ? (1 - u) / 0.15 : 1, COLS = ["#7a5228", "#f4e2b4", "#9a6a34", "#5a3a1a"];
      for (let i = 0; i < 80; i++) {
        const f = (i / 80), h = f * 96 * sube, r = 8 + f * 22 + Math.sin(t * 2 + i) * 2, an = t * (5 - f * 2) + i * 2.4;
        let x = m.x + Math.cos(an) * r, y = m.y - 6 - h + Math.sin(an) * r * 0.25;
        if (u > 0.75) { const g = (u - 0.75) / 0.25; x += Math.cos(an) * g * 40; y += g * g * 30; }
        P.R(x, y, 2, 2, COLS[i % 4], a);
      }
      if (u < 0.4) P.bola(m.x, m.y - 2, 20 + u * 30, 4, "#d8c090", (0.4 - u) * 2);
    } };

  E[8] = { nombre: "El dragón de agua", dura: 6.5,
    prepara() { return { cab: lienzo(DRAGON_AGUA, { B: "#8ad0f4", W: "#f4fcff", K: "#1a3a6a", T: "#ffffff" }) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const X = (g) => 96 + g * 160, Y = (g) => 124 - Math.sin(g * Math.PI) * 100, g = tramo(u, 0.08, 0.86);
      for (let k = 44; k >= 1; k--) { const gg = g - k * 0.011; if (gg < 0) continue; const r = 6 - k * 0.09, x = X(gg), y = Y(gg); P.bola(x, y, r + 1, r + 1, "#3a8ad0", 1); P.bola(x, y, r, r, "#8ad0f4", 1); if (k % 3 === 0) P.R(x - 1, y - r + 1, 2, 1, "#ffffff"); }
      if (g > 0 && g < 1) { const an = Math.atan2(Y(g + 0.01) - Y(g), X(g + 0.01) - X(g)); girada(P, m.cab, X(g), Y(g), an, 1, 1.6); }
      [[0.06, 96, 124], [0.86, 256, 124]].forEach(([u0, x, y]) => { const f = tramo(u, u0, u0 + 0.16); if (f <= 0 || f >= 1) return; for (let i = 0; i < 16; i++) { const an = -Math.PI * (0.1 + P.ruido(i) * 0.8), d = f * (10 + P.ruido(i + 3) * 18); P.R(x + Math.cos(an) * d, y + Math.sin(an) * d + f * f * 20, 1, 2, "#eafaff", 1 - f); } aro(P, x, y + 2, 4 + f * 18, 1.5 + f * 4, "#ffffff", 1 - f, 0); });
    } };

  E[9] = { nombre: "La invocación del sapo", dura: 6,
    prepara({ luz }) { return { sapo: lienzo(SAPO, { ...tinteS({ O: "#f08a2a", M: "#7a3a10", Y: "#f8d070" }, luz), W: "#ffffff", K: "#1a1a1a" }), x: 160, y: 46 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const humo = tramo(u, 0.02, 0.3);
      if (u < 0.6) {
        let x = m.x, y = m.y;
        if (u > 0.2) { const buche = env(u, 0.32, 0.38, 0.46, 0.52); girada(P, m.sapo, x, y, 0, 1, 1.5); if (buche > 0) P.bola(x - 1, y + 7, 5 * buche + 1, 3 * buche + 1, "#fbe6b0", 1); }
        if (humo > 0 && humo < 1) for (let i = 0; i < 9; i++) { const an = (i / 9) * TAU, d = 6 + humo * 18; P.bola(x + Math.cos(an) * d, y + Math.sin(an) * d * 0.6, 6 + humo * 5, 5 + humo * 4, i % 2 ? "#ffffff" : "#e0e4ea", 1 - humo); }
        return;
      }
      const g = tramo(u, 0.6, 0.92), x = m.x + g * 180, y = m.y - Math.sin(g * Math.PI) * 40 - g * 20;
      girada(P, m.sapo, x, y, g * 0.6, 1, 1.5);
      if (g < 0.2) for (let i = 0; i < 6; i++) P.R(m.x - 10 + i * 4, m.y + 14 + g * 10, 2, 1, "#e0e4ea", 1 - g * 5);
    } };

  E[11] = { nombre: "La estatua abre los ojos", dura: 6, detras: true,
    prepara() { return { ojos: [[149, 123], [171, 123]] }; },
    dibuja(m, u, t, P) {
      const abre = env(u, 0.08, 0.28, 0.78, 0.92);
      if (u < 0.3 || u > 0.76) P.rapido();
      for (let i = 0; i < 10; i++) { const f = (t * 0.3 + i / 10) % 1; P.bola(120 + P.ruido(i) * 80, 150 - f * 50, 4 + f * 6, 3 + f * 4, "#8a5ab0", 0.5 * (1 - f) * env(u, 0, 0.15, 0.85, 1)); }
      if (abre <= 0) return;
      m.ojos.forEach(([x, y]) => {
        const h = Math.max(1, Math.round(4 * abre));
        halo(P, x, y, 9, "#c8a8f8", abre * 0.8);
        P.bola(x, y, 6, h, "#d8c8f8", 1);
        if (abre > 0.5) { aro(P, x, y, 4, Math.min(3, h - 0.5), "#5a3a8a", 1, 0); aro(P, x, y, 2, Math.min(1.6, h - 1), "#5a3a8a", 1, 0); P.R(x, y, 1, 1, "#2a1a4a"); }
      });
    } };

  E[12] = { nombre: "El halcón mensajero", dura: 7,
    prepara({ luz }) { return { f: HALCON.map((g) => lienzo(g, { ...tinteS({ B: "#7a5232", b: "#5a3a20", H: "#d8c8a8", W: "#efe6d4", T: "#e0a830" }, luz), Y: "#e8b840", K: "#1a1a1a" })), x: 158, y: 22 }; },
    dibuja(m, u, t, P) {
      let x, y, f;
      if (u < 0.32) { P.rapido(); const g = sale(u / 0.32); x = 340 - (340 - m.x) * g; y = 4 + (m.y - 4) * g - Math.sin(g * Math.PI) * 8; f = g > 0.9 ? 2 : Math.floor(t / 0.12) % 2; }
      else if (u < 0.7) { x = m.x; y = m.y; f = 2; }
      else { P.rapido(); const g = entra((u - 0.7) / 0.3); x = m.x - g * 200; y = m.y - g * 50; f = Math.floor(t / 0.12) % 2; }
      const mira = u > 0.45 && u < 0.6;
      girada(P, m.f[f], x, y, 0, 1, 2);
      if (f === 2) { P.R(x + 3, y + 1, 8, 3, "#f4ead0"); P.R(x + 3, y + 1, 2, 3, "#c83a3a"); }
    } };

  E[14] = { nombre: "El vaso de ramen", dura: 5.5,
    prepara() { return { x: 166, y: 99 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      for (let i = 0; i < 6; i++) { const f = (t * 0.6 + i / 6) % 1, fuerza = u < 0.5 ? u / 0.5 : 1; P.bola(m.x - 3 + Math.sin(f * 7 + i) * 4, m.y - 3 - f * 34 * fuerza, 2.5 + f * 5, 2 + f * 4, "#ffffff", 1 - f * 0.7); }
      const g = tramo(u, 0.5, 0.8), x = m.x - 4 + g * 6, y = m.y - 1 - Math.sin(g * Math.PI) * 26, ang = g * TAU;
      if (g > 0 && g < 1) { P.caja(x - 7, y - 7, 15, 15); const cc = P.ctx; cc.save(); cc.translate(Math.round(x + 4), Math.round(y)); cc.rotate(ang); cc.fillStyle = "#f8f4ec"; cc.fillRect(-8, -2, 16, 3); cc.fillStyle = "#e83a3a"; cc.fillRect(-3, -2, 6, 1); cc.fillStyle = "#c8c0b0"; cc.fillRect(-8, 1, 16, 1); cc.restore(); }
      if (u > 0.5 && u < 0.58) for (let i = 0; i < 6; i++) P.bola(m.x - 6 + i * 2.5, m.y - 6 - (u - 0.5) * 60, 3, 3, "#ffffff", 0.9);
      if (g >= 1 && u < 0.86) { const f = tramo(u, 0.8, 0.86); for (let i = 0; i < 4; i++) P.R(m.x - 8 + i * 5, m.y - 3 - f * 4, 2, 1, "#ffffff", 1 - f); }
    } };

  E[16] = { nombre: "La serpiente detrás del castillo", dura: 7,
    prepara({ c }) {
      const cols = { D: "#2e1450", P: "#7a4ab0", p: "#9a6ad0", S: "#5a2a90", B: "#e4d0f6", b: "#c4a8e4", Y: "#ffe040", K: "#1a1018", N: "#2a0a3a", M: "#2a0a2a", T: "#ffffff", R: "#e83a5a" };
      return { cielo: mascara(c, 0, 0, 320, 112, (r, g, b) => b > 150 && b > r + 25), l: capa(320, 112), cab: [lienzo(CABEZA_S_CERRADA, cols), lienzo(CABEZA_S_ABIERTA, cols)] };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const sube = u < 0.3 ? sale(u / 0.3) : u < 0.76 ? 1 : 1 - entra(tramo(u, 0.76, 0.96));
      if (sube <= 0) return;
      const L = m.l, cc = L.limpia(), x = 164 + Math.sin(t * 1.4) * 5, y = 112 - sube * 96, abre = u > 0.46 && u < 0.6;
      for (let yy = 112; yy > y + 14; yy -= 2) {
        const ox = x + 16 + Math.sin(yy / 13 + t * 1.6) * 4, r = 10;
        elipseEn(cc, ox, yy, r, 2.6, "#7a4ab0");
        cc.fillStyle = "#e4d0f6"; cc.fillRect(Math.round(ox - r + 1), Math.round(yy - 1), 4, 2);
        cc.fillStyle = "#c4a8e4"; cc.fillRect(Math.round(ox - r + 5), Math.round(yy - 1), 1, 2);
        if ((Math.round(yy) >> 1) % 4 === 0) { cc.fillStyle = "#5a2a90"; [-4, 2, 7].forEach((d) => cc.fillRect(Math.round(ox + d), Math.round(yy - 1), 3, 1)); }
        cc.fillStyle = "#2e1450"; cc.fillRect(Math.round(ox + r - 1), Math.round(yy - 1), 1, 2);
      }
      cc.save(); cc.translate(Math.round(x - 10), Math.round(y)); cc.scale(1.4, 1.4); cc.drawImage(m.cab[abre ? 1 : 0], 0, 0); cc.restore();
      if (!abre && sube > 0.9 && Math.floor(t * 5) % 3 === 0) { const lx = Math.round(x - 10), ly = Math.round(y + 14); cc.fillStyle = "#e83a5a"; cc.fillRect(lx - 7, ly, 7, 1); cc.fillRect(lx - 9, ly - 1, 2, 1); cc.fillRect(lx - 9, ly + 1, 2, 1); }
      L.recorta(m.cielo); P.imagen(L.cv, 0, 0);
      if (abre) for (let k = 0; k < 3; k++) { const f = (t * 2 + k / 3) % 1, r = 6 + f * 22; for (let j = -3; j <= 3; j++) { const an = Math.PI + j * 0.16; P.R(x - 12 + Math.cos(an) * r, y + 18 + Math.sin(an) * r, 2, 1, "#ffffff", (1 - f) * 0.8); } }
    } };

  E[17] = { nombre: "Jariiya espía", dura: 6.5,
    prepara({ luz }) { return { cara: lienzo(JARIIYA, tinteS({ W: "#f4f2ec", H: "#8a8a96", R: "#c83a3a", S: "#f4c8a0", K: "#2a2026", M: "#8a3a3a" }, luz)), cubo: lienzo(CUBO, tinteS({ B: "#a8743c", L: "#c8945a", K: "#5a3a1a" }, luz)), l: capa(40, 24), x: 140, y0: 60 }; },
    dibuja(m, u, t, P) {
      const asoma = u < 0.2 ? sale(u / 0.2) : u < 0.62 ? 1 : 1 - entra(tramo(u, 0.66, 0.8)), L = m.l, cc = L.limpia();
      if (u < 0.22 || u > 0.55) P.rapido();
      const yy = 24 - asoma * 15 + (u > 0.62 && u < 0.66 ? 2 : 0);
      cc.drawImage(m.cara, 8, Math.round(yy * 1.0 - 4), 24, 21); cc.clearRect(0, 20, 40, 4);
      P.imagen(L.cv, m.x - 12, m.y0 - 20);
      if (asoma > 0.9 && u < 0.6) { if (Math.floor(t * 4) % 2) { P.R(m.x - 1, m.y0 - 3, 2, 1, "#ff8aa0"); P.R(m.x + 6, m.y0 - 3, 2, 1, "#ff8aa0"); } if (u > 0.35) P.R(m.x + 3, m.y0 - 4, 1, Math.min(3, 1 + Math.floor((u - 0.35) * 16)), "#e83a3a"); }
      const g = tramo(u, 0.48, 0.62);
      if (g > 0 && g < 1) { P.rapido(); girada(P, m.cubo, 60 + (m.x + 8 - 60) * g, 20 + (m.y0 - 14 - 20) * g - Math.sin(g * Math.PI) * 14, g * 8, 1, 1.5); }
      if (u >= 0.62 && u < 0.84) { const f = tramo(u, 0.62, 0.84); girada(P, m.cubo, m.x + 8 + f * 30, m.y0 - 14 - Math.sin(f * Math.PI) * 18 + f * 30, 2 + f * 6, 1 - f, 1.5); for (let k = 0; k < 5; k++) { const an = t * 6 + k * 1.26; P.R(m.x + 8 + Math.cos(an) * 9, m.y0 - 18 + Math.sin(an) * 3, 1, 1, "#ffe040", 1 - f); } }
    } };

  E[18] = { nombre: "Serpientes en el túnel", dura: 7, detras: true,
    prepara() { return { ojos: [[132, 58], [182, 72], [150, 100], [170, 46], [124, 112]], s: [[-1, 150], [1, 156], [-1, 162]] }; },
    dibuja(m, u, t, P) {
      if (u < 0.45 || u > 0.4) P.rapido();
      m.ojos.forEach(([x, y], i) => { const a = env(u, 0.04 + i * 0.05, 0.1 + i * 0.05, 0.6, 0.7) * (Math.floor(t * 2 + i) % 5 ? 1 : 0); if (a > 0) { P.R(x - 3, y, 2, 1, "#ffe040", a); P.R(x + 2, y, 2, 1, "#ffe040", a); halo(P, x, y, 4, "#ffe040", 0.4 * a); } });
      m.s.forEach(([dir, y], i) => {
        const g = tramo(u, 0.35 + i * 0.08, 0.95), cab = 160 + dir * g * 190;
        if (g <= 0) return;
        for (let k = 0; k < 18; k++) { const x = cab - dir * k * 3, yy = y + Math.sin(x / 7 + t * 8) * 2.5; if ((x - 160) * dir < 0) continue; P.bola(x, yy, 2.2 - k * 0.06, 2, k % 4 ? "#4a8a3a" : "#2a5a2a", 1); }
        P.R(cab - 1, y + Math.sin(cab / 7 + t * 8) * 2.5 - 1, 3, 3, "#3a7a2a"); P.R(cab + dir * 2, y + Math.sin(cab / 7 + t * 8) * 2.5, 2, 1, "#e83a5a");
      });
    } };

  E[19] = { nombre: "El ciervo de los Kara", dura: 5,
    prepara({ luz }) { const k = { ...tinteS({ B: "#b0784a", W: "#f4e8d4", A: "#d8c8a8" }, luz), K: "#1a1a1a" }; return { f: CIERVO.map((g) => lienzo(g, k)) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const x = -30 + u * 380, fase = (u * 3) % 1, y = 140 - Math.sin(fase * Math.PI) * 30;
      girada(P, m.f[fase > 0.15 && fase < 0.85 ? 0 : 1], x, y, (fase - 0.5) * 0.5, 1, 1.6);
      if (fase < 0.06) for (let k = 0; k < 4; k++) P.R(x + 6 + k * 3, 148, 2, 1, "#c8d8a8", 0.8);
    } };

  E[20] = { nombre: "Kanon y sus alas de papel", dura: 8,
    prepara({ u, quien, c, luz }) {
      const q = quien("Kanon"), img = figura(u, q ? q.nombre : "Kanon·3", luz);
      const sitio = q ? { x: Math.round(q.x), y: Math.round(q.top), hueco: trozo(c, Math.round(q.x), Math.round(q.top), q.w, q.alto) } : null;
      return { cx: 160, cy: 62, img, sitio };
    },
    dibuja(m, u, t, P) {
      P.rapido();
      const N = 96, junta = u < 0.4 ? suave(u / 0.4) : u < 0.72 ? 1 : 1 - suave((u - 0.72) / 0.28), ella = env(u, 0.3, 0.42, 0.72, 0.82);
      if (m.sitio && u < 0.97) P.imagen(m.sitio.hueco, m.sitio.x, m.sitio.y, u < 0.06 ? u / 0.06 : u > 0.9 ? (0.97 - u) / 0.07 : 1);
      if (ella > 0) { halo(P, m.cx, m.cy, 16, "#f8f8fc", 0.35 * ella); P.imagen(m.img, m.cx - m.img.width / 2, m.cy - m.img.height / 2 + Math.sin(t * 2) * 1.5, ella); }
      for (let i = 0; i < N; i++) {
        const suelto = [m.cx + Math.cos(i * 2.3 + t * 0.8) * (60 + P.ruido(i) * 100), m.cy + Math.sin(i * 1.7 + t * 0.6) * (40 + P.ruido(i + 9) * 60)];
        let destino;
        if (i < 80) { const lado = i % 2 ? 1 : -1, k = (i >> 1) / 40; destino = [m.cx + lado * (12 + k * 60), m.cy - Math.sin(k * Math.PI * 0.9) * 34 + k * 12 + (k > 0.7 ? (k - 0.7) * 40 : 0)]; }
        else { if (ella > 0.7) continue; destino = [m.cx + (P.ruido(i + 3) - 0.5) * 16, m.cy + (P.ruido(i + 7) - 0.5) * 34]; }
        const x = suelto[0] + (destino[0] - suelto[0]) * junta + Math.sin(t * 6 + i) * 1.5, y = suelto[1] + (destino[1] - suelto[1]) * junta + Math.cos(t * 5 + i) * 1.5, g = Math.floor(t * 6 + i) % 2;
        P.R(x, y, g ? 3 : 2, g ? 2 : 3, "#f8f8fc", 1); P.R(x + (g ? 0 : 1), y + (g ? 1 : 2), g ? 3 : 1, 1, "#c8ccd8", 1);
      }
    } };

  E[21] = { nombre: "El Shanri Tensei", dura: 5,
    prepara() { return { x: 160, y: 108 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.08) { P.R(0, 0, 320, 180, "#f4ecff", 0.6 * (1 - u / 0.08)); halo(P, m.x, m.y, 10 + u * 100, "#ffffff", 1); }
      [0.04, 0.14, 0.24].forEach((u0) => { const g = tramo(u, u0, u0 + 0.5); if (g <= 0 || g >= 1) return; aro(P, m.x, m.y, 6 + g * 200, 4 + g * 120, "#ffffff", 1 - g, 0); aro(P, m.x, m.y, 5 + g * 190, 3 + g * 114, "#c8a8ff", (1 - g) * 0.7, 0); });
      for (let i = 0; i < 26; i++) { const g = tramo(u, 0.05, 0.6), an = P.ruido(i) * TAU, d = sale(g) * (40 + P.ruido(i + 3) * 120); if (g > 0 && g < 1) P.R(m.x + Math.cos(an) * d, m.y + Math.sin(an) * d * 0.6 + g * g * 20, 2, 2, i % 2 ? "#8a6a4a" : "#6a5040", 1 - g); }
      const pol = tramo(u, 0.1, 0.9); if (pol > 0 && pol < 1) for (let i = 0; i < 10; i++) { const an = (i / 10) * TAU; P.bola(m.x + Math.cos(an) * (30 + pol * 90), m.y + 40 + Math.sin(an) * 8, 8 + pol * 8, 4 + pol * 3, "#c8b8a0", (1 - pol) * 0.7); }
    } };

  E[22] = { nombre: "El Mengakyō en la luna", dura: 6.5,
    prepara() { return { x: 155, y: 37, r: 13 }; },
    dibuja(m, u, t, P) {
      const a = env(u, 0.05, 0.25, 0.75, 0.95);
      if (a < 1) P.rapido();
      if (a <= 0) return;
      P.R(0, 0, 320, 180, "#ff1a2a", 0.1 * a);
      halo(P, m.x, m.y, m.r + 8, "#ff3a3a", 0.35 * a);
      P.bola(m.x, m.y, m.r, m.r, "#e8303a", a);
      P.caja(m.x - m.r - 2, m.y - m.r - 2, m.r * 2 + 4, m.r * 2 + 4);
      const rot = t * 0.8;
      for (let k = 0; k < 3; k++) { const a0 = rot + (k * TAU) / 3; for (let j = 0; j <= 10; j++) { const f = j / 10, an = a0 + f * 1.4, rr = 3 + f * (m.r - 4); trazo(P, m.x + Math.cos(an) * rr, m.y + Math.sin(an) * rr, m.x + Math.cos(an + 0.35) * rr * 0.9, m.y + Math.sin(an + 0.35) * rr * 0.9, "#14080a", a); } }
      P.bola(m.x, m.y, 3, 3, "#14080a", a); aro(P, m.x, m.y, m.r - 1, m.r - 1, "#14080a", a, 0);
    } };

  E[23] = { nombre: "El golpe del Riakage", dura: 4.8, detras: true, vale: ({ quien }) => !!quien("Riakage"),
    prepara({ quien }) { const q = quien("Riakage"); return { x: Math.round(q.x + q.w * 0.78), y: 106, q: { x: q.x, w: q.w, top: q.top, y: q.y } }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const { q } = m, cx = q.x + q.w / 2, cy = (q.top + q.y) / 2;
      if (u < 0.34) for (let b = 0; b < 6; b++) { const s = Math.floor(t * 18) + b * 7, an = P.ruido(s) * TAU, x0 = cx + Math.cos(an) * (q.w / 2 + 2), y0 = cy + Math.sin(an) * ((q.y - q.top) / 2 + 2); rayo(P, x0, y0, x0 + Math.cos(an) * 9, y0 + Math.sin(an) * 9, s, "#ffffff", "#7ab0ff", 3, 0.7); }
      if (u >= 0.3 && u < 0.36) { P.R(0, 0, 320, 180, "#ffffff", 0.5); halo(P, m.x, m.y, 20, "#bfe0ff", 1); }
      const g = tramo(u, 0.32, 0.5), a = u > 0.85 ? (1 - u) / 0.15 : 1;
      if (g > 0) {
        const pts = [[m.x, m.y - 6], [m.x - 6, m.y - 2], [m.x - 2, m.y + 2], [m.x - 14, m.y + 6], [m.x - 10, m.y + 12]], pts2 = [[m.x, m.y - 6], [m.x + 8, m.y - 1], [m.x + 4, m.y + 4], [m.x + 18, m.y + 8]];
        P.caja(m.x - 18, m.y - 8, 40, 24); brochazo(P, pts, "#2a1a10", g, a); brochazo(P, pts2, "#2a1a10", g, a);
        const f = tramo(u, 0.32, 0.8);
        for (let i = 0; i < 16; i++) { const an = -Math.PI * (0.1 + P.ruido(i) * 0.8), v = 20 + P.ruido(i + 5) * 30; if (f < 1) P.R(m.x + Math.cos(an) * v * f, m.y + Math.sin(an) * v * f + 40 * f * f, 2, 1, i % 2 ? "#8a5a30" : "#c8945a", 1 - f); }
        for (let i = 0; i < 6; i++) P.bola(m.x - 25 + i * 10, m.y + 4 - f * 10, 4 + f * 8, 3 + f * 5, "#d8d0c4", (1 - f) * 0.8);
      }
    } };

  E[24] = { nombre: "La sombra de la cascada", dura: 6.5,
    prepara() { return { img: lienzo(OSCURO, { K: "#140c18", R: "#ff2a2a" }), x: 160, y: 90 }; },
    dibuja(m, u, t, P) {
      const a = env(u, 0.05, 0.3, 0.7, 0.95);
      if (a <= 0) return;
      if (a < 1) P.rapido();
      girada(P, m.img, m.x, m.y, 0, 0.78 * a, 2);
      for (let k = 0; k < 8; k++) { const f = (t * 0.5 + k / 8) % 1; P.R(m.x - 14 + P.ruido(k) * 28, m.y - 20 + f * 40, 1, 3, "#ffffff", 0.5 * a * (1 - f)); }
      if (Math.floor(t * 3) % 4) { halo(P, m.x - 4, m.y - 12, 3, "#ff3a3a", a); halo(P, m.x + 4, m.y - 12, 3, "#ff3a3a", a); }
    } };

  E[25] = { nombre: "Los pájaros de tinta", dura: 6.5,
    prepara() { return { k: TINTA.map((g) => lienzo(g, { K: "#14141c" })), b: TINTA.map((g) => lienzo(g, { K: "#e8f0ff" })) }; },
    dibuja(m, u, t, P) {
      P.rapido();
      for (let i = 0; i < 6; i++) {
        const g = tramo(u, i * 0.07, 0.6 + i * 0.07);
        if (g <= 0 || g >= 1) continue;
        const x = 90 + g * 240 + Math.sin(g * 6 + i) * 8, y = 96 - g * 80 - i * 6 + Math.sin(t * 3 + i) * 3, f = Math.floor(t / 0.14 + i) % 2;
        girada(P, m.b[f], x, y, 0, 0.7, 1.5); girada(P, m.k[f], x, y + 1, 0, 1, 1.5);
        if (Math.floor(t * 8 + i) % 3 === 0) P.R(x - 9, y + 2, 1, 1, "#14141c", 0.8);
      }
    } };

  E[26] = { nombre: "El meteorito de Nadara", dura: 6,
    prepara() { return { x0: 30, y0: -36, x1: 226, y1: 62 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.56) {
        const g = entra(u / 0.56), x = m.x0 + (m.x1 - m.x0) * g, y = m.y0 + (m.y1 - m.y0) * g, r = 8 + g * 10;
        for (let i = 0; i < 26; i++) { const d = i * 3 + P.ruido(i + Math.floor(t * 12)) * 4; P.R(x - d * 0.9 + (P.ruido(i * 3) - 0.5) * 8, y - d * 0.45 + (P.ruido(i * 5) - 0.5) * 8, 3, 2, ["#fff6c8", "#ffd23a", "#ff8a2a", "#d8401c"][Math.min(3, i >> 2)], 1 - i / 26); }
        halo(P, x, y, r + 8, "#ff8a2a", 0.8); P.bola(x, y, r, r, "#4a3a34", 1); P.bola(x - r * 0.3, y - r * 0.3, r * 0.5, r * 0.5, "#6a5048", 1);
        for (let k = 0; k < 5; k++) { const an = k * 1.3; trazo(P, x + Math.cos(an) * r * 0.2, y + Math.sin(an) * r * 0.2, x + Math.cos(an) * r * 0.9, y + Math.sin(an) * r * 0.9, "#ff8a2a", 0.9); }
        return;
      }
      const f = tramo(u, 0.56, 1);
      if (f < 0.06) P.R(0, 0, 320, 180, "#fff2d8", 0.6 * (1 - f / 0.06));
      estallido(P, m.x1, m.y1, f, 48, undefined, "#7a6a60", 4);
      aro(P, m.x1, m.y1 + 10, 14 + f * 140, 4 + f * 30, "#d8c8b0", (1 - f) * 0.9, 0);
    } };

  E[27] = { nombre: "El Tsokuyumi Infinito", dura: 6.5,
    prepara() { return { x: 160, y: 52 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0.03, 0.2, 0.75, 0.95);
      halo(P, m.x, m.y, 44, "#ff4a3a", 0.55 * a); halo(P, m.x, m.y, 30, "#ffb0a0", 0.4 * a * (0.6 + 0.4 * Math.sin(t * 6)));
      [0.12, 0.3, 0.48].forEach((u0) => { const g = tramo(u, u0, u0 + 0.4); if (g <= 0 || g >= 1) return; aro(P, m.x, m.y, 34 + g * 170, 30 + g * 120, "#ff6a5a", (1 - g) * 0.9, 0); aro(P, m.x, m.y, 33 + g * 160, 29 + g * 112, "#ffd0c8", (1 - g) * 0.5, 1); });
      if (u > 0.2 && u < 0.7) P.R(0, 0, 320, 180, "#ff2a1a", 0.08 * Math.sin(tramo(u, 0.2, 0.7) * Math.PI));
    } };

  E[28] = { nombre: "La espada de Zubaza", dura: 5,
    prepara({ quien }) { const z = quienX(quien("Zubaza"), { x: 150, y: 150, top: 110 }); return { img: lienzo(ESPADA_Z, { S: "#6a7484", L: "#e8f0f8", K: "#2a2020", D: "#4a5260" }), x0: z.x, y0: z.top + 14 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const g = tramo(u, 0.06, 0.9), x = m.x0 + Math.sin(g * TAU) * 40, y = m.y0 - Math.sin(g * Math.PI) * 84;
      for (let i = 0; i < 6; i++) { const f = (t * 0.3 + i / 6) % 1; P.bola(100 + i * 36 + Math.sin(f * 4) * 10, 90 + Math.sin(i) * 20, 14 + f * 8, 6 + f * 3, "#e8eef4", 0.35 * (1 - f) * env(u, 0, 0.1, 0.9, 1)); }
      if (g > 0 && g < 1) { girada(P, m.img, x, y, t * 16, 1, 1.8); for (let k = 0; k < 3; k++) { const an = t * 16 + k * 2.1; P.R(x + Math.cos(an) * 26, y + Math.sin(an) * 26, 2, 1, "#ffffff", 0.6); } }
    } };

  E[29] = { nombre: "Huka entre los espejos", dura: 6.5,
    prepara() { return { img: lienzo(HUKA, { K: "#1a1a24", W: "#f4f4f8", R: "#c83a3a", G: "#4a7a9a" }), e: [[95, 68], [185, 60], [125, 58], [200, 64], [110, 70], [160, 54]] }; },
    dibuja(m, u, t, P) {
      P.rapido();
      m.e.forEach(([x, y], i) => {
        const u0 = 0.04 + i * 0.14, f = tramo(u, u0, u0 + 0.14);
        if (f <= 0 || f >= 1) return;
        const a = f < 0.15 ? f / 0.15 : f > 0.8 ? (1 - f) / 0.2 : 1;
        halo(P, x, y, 12, "#dff4ff", a); girada(P, m.img, x, y, 0, a, 1.5);
        if (f > 0.3) for (let k = 0; k < 3; k++) { const g = tramo(f, 0.3 + k * 0.08, 0.9), tx = 150 + k * 10, ty = 150; if (g > 0 && g < 1) trazo(P, x + (tx - x) * g, y + (ty - y) * g, x + (tx - x) * (g + 0.06), y + (ty - y) * (g + 0.06), "#ffffff", 1); }
        if (f > 0.3) P.caja(Math.min(x, 150) - 2, y - 2, Math.abs(170 - x) + 4, 156 - y);
      });
    } };

  E[31] = { nombre: "Las pesas de Iron Lee", dura: 5,
    prepara({ quien }) { const l = quienX(quien("Iron Lee"), { x: 160, y: 176 }); return { img: lienzo(PESA, { O: "#e8902a", K: "#6a3a10" }), x: Math.max(96, Math.min(300, l.x)), y: l.y }; },
    dibuja(m, u, t, P) {
      [[-12, 0], [12, 0.08]].forEach(([dx, u0]) => {
        const g = tramo(u, u0, u0 + 0.16), x = m.x + dx, yb = m.y - 2;
        if (g <= 0) return;
        if (g < 1) { P.rapido(); girada(P, m.img, x, -14 + (yb - 8 + 14) * entra(g), g * 2, 1, 2); return; }
        const f = tramo(u, u0 + 0.16, u0 + 0.7), a = u > 0.88 ? (1 - u) / 0.12 : 1;
        if (f < 1) P.rapido();
        P.bola(x, yb, 13, 4, "#3a3028", 0.9 * a); girada(P, m.img, x, yb - 4, 0, a, 2);
        for (let k = 0; k < 5; k++) { const an = Math.PI + (k / 4) * Math.PI; trazo(P, x, yb, x + Math.cos(an) * (8 + f * 6), yb + Math.sin(an) * 2 - 1, "#2a2420", a); }
        if (f < 1) { for (let k = 0; k < 7; k++) P.bola(x - 18 + k * 6, yb - 2 - f * 16, 5 + f * 11, 4 + f * 7, "#d8ccb8", 1 - f * 0.8); for (let k = 0; k < 8; k++) { const an = -Math.PI * (0.1 + P.ruido(k + dx) * 0.8); P.R(x + Math.cos(an) * f * 26, yb + Math.sin(an) * f * 20 + f * f * 20, 2, 2, "#a89880", 1 - f); } }
      });
      if (u > 0.16 && u < 0.2) P.R(0, 0, 320, 180, "#ffffff", 0.25);
    } };

  E[32] = { nombre: "La barrera de fuego morado", dura: 6.5,
    prepara() { return { arriba: 40, izq: 20, der: 300 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const a = env(u, 0, 0.15, 0.8, 1), COLS = ["#f0d8ff", "#d8a8ff", "#b070ff", "#8a3ad0"];
      for (let i = 0; i < 70; i++) {
        const f = (t * 1.4 + P.ruido(i)) % 1, al = 5 + P.ruido(i + Math.floor(t * 10)) * 9;
        let x, y;
        if (i < 46) { x = m.izq + 4 + (i / 46) * (m.der - m.izq - 8); y = m.arriba - f * 12; } else { const lado = i % 2 ? m.der : m.izq; x = lado + (P.ruido(i + 3) - 0.5) * 4; y = m.arriba + ((i - 46) / 24) * 130 - f * 12; }
        P.R(x, y - al, 2, al, COLS[Math.floor(f * 4)], a * (1 - f * 0.6)); P.R(x, y - al - 1, 1, 2, "#ffffff", a * (1 - f));
      }
      P.R(m.izq, m.arriba, m.der - m.izq, 1, "#f0d8ff", 0.8 * a * (0.6 + 0.4 * Math.sin(t * 10)));
    } };

  E[33] = { nombre: "El Resanshuriken", dura: 6.5,
    prepara({ quien }) { const n = quien("Karuto"); return n ? { mx: n.x + n.w - 2, my: n.top + n.alto * 0.74, x: n.x + n.w / 2, y: n.top - 18 } : { mx: 172, my: 150, x: 160, y: 70 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u > 0.9) { const f = tramo(u, 0.9, 1); halo(P, 30, 0, 14 * (1 - f), "#e8f8ff", 1 - f); return; }
      const sube = sale(tramo(u, 0.3, 0.5)), vuela = tramo(u, 0.64, 0.9);
      let x = m.mx + (m.x - m.mx) * sube, y = m.my + (m.y - m.my) * sube;
      if (vuela > 0) { x -= entra(vuela) * 150; y -= entra(vuela) * 120; }
      const L = 3 + tramo(u, 0, 0.3) * 9 + sube * 21, rot = t * 22;
      for (let k = 0; k < 4; k++) { const an = rot + (k * TAU) / 4; for (let j = 0; j < 6; j++) { const aa = an + j * 0.09; trazo(P, x + Math.cos(aa) * 4, y + Math.sin(aa) * 4, x + Math.cos(aa) * (L - j * 2), y + Math.sin(aa) * (L - j * 2) * 0.9, j < 2 ? "#ffffff" : "#bfe8ff", 0.95); } }
      P.caja(x - L - 2, y - L - 2, L * 2 + 4, L * 2 + 4);
      aro(P, x, y, L * 0.7, L * 0.62, "#e8f8ff", 0.7, 1);
      halo(P, x, y, 8, "#7ac0ff", 0.9); P.bola(x, y, 4, 4, "#5aa8ff", 1); P.bola(x, y, 2, 2, "#ffffff", 1);
      if (vuela > 0) for (let k = 1; k < 8; k++) P.R(x + k * 6, y + k * 4.7, 2, 2, "#e8f8ff", 0.6 - k * 0.07);
    } };

  E[34] = { nombre: "El Kirin", dura: 4.5, detras: true,
    prepara({ quien }) { const i = quien("Atichi"); return { x0: 232, y0: -6, x1: i ? i.x + i.w / 2 : 150, y1: i ? i.y - 12 : 142 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      const g = tramo(u, 0.02, 0.2), s = Math.floor(t * 30), xe = m.x0 + (m.x1 - m.x0) * sale(g), ye = m.y0 + (m.y1 - m.y0) * sale(g);
      if (u > 0.18 && u < 0.26) P.R(0, 0, 320, 180, "#f4f8ff", 0.8 * (1 - tramo(u, 0.18, 0.26)));
      if (u < 0.5) {
        for (let k = -1; k <= 1; k++) rayo(P, m.x0 + k * 2, m.y0, xe + k * 2, ye, s + k, k ? "#bfe0ff" : "#ffffff", "#5a8aff", 10, 0.3, k ? 0.7 : 1);
        if (g < 1) { rayo(P, xe, ye, xe - 14, ye - 6, s + 5, "#ffffff", "#7ab0ff", 3, 0.5); rayo(P, xe, ye, xe - 8, ye + 10, s + 9, "#ffffff", "#7ab0ff", 3, 0.5); halo(P, xe, ye, 12, "#bfe0ff", 1); }
        else { halo(P, m.x1, m.y1, 22, "#bfe0ff", 1 - tramo(u, 0.2, 0.5)); for (let b = 0; b < 6; b++) { const an = -Math.PI * P.ruido(b + s); rayo(P, m.x1, m.y1, m.x1 + Math.cos(an) * 26, m.y1 + Math.sin(an) * 12, s + b * 3, "#ffffff", "#7ab0ff", 3, 0.6); } }
      }
      const f = tramo(u, 0.22, 1); if (f > 0 && f < 1) for (let i = 0; i < 6; i++) P.bola(m.x1 - 20 + i * 8, m.y1 - f * 30, 5 + f * 9, 4 + f * 6, "#c8ccd8", (1 - f) * 0.7);
    } };

  E[36] = { nombre: "La Bomba con Cola", dura: 6,
    prepara() { return { x: 172, y: 78 }; },
    dibuja(m, u, t, P) {
      P.rapido();
      if (u < 0.46) {
        const g = u / 0.46, r = 2 + g * 9;
        for (let i = 0; i < 20; i++) { const an = P.ruido(i) * TAU, d = (1 - ((g * 2 + P.ruido(i + 7)) % 1)) * 34; P.R(m.x + Math.cos(an) * d, m.y + Math.sin(an) * d * 0.8, 1, 1, i % 2 ? "#ff5a5a" : "#5a8aff", 1); }
        halo(P, m.x, m.y, r + 6, "#8a5ab0", 0.7); P.bola(m.x, m.y, r, r, "#1a1020", 1); aro(P, m.x, m.y, r, r, "#b08ad8", 0.9, 0);
        return;
      }
      if (u < 0.7) { const g = entra(tramo(u, 0.46, 0.7)), x = m.x + g * 30, y = m.y - g * 100; for (let k = 1; k < 8; k++) P.R(x - k * 1.5, y + k * 5, 3, 3, "#5a3a7a", 0.7 - k * 0.08); P.bola(x, y, 9, 9, "#1a1020", 1); aro(P, x, y, 9, 9, "#b08ad8", 1, 0); return; }
      const f = tramo(u, 0.7, 1);
      if (f < 0.06) P.R(0, 0, 320, 180, "#ffffff", 0.45 * (1 - f / 0.06));
      halo(P, m.x + 30, -10, 30 * (1 - f * 0.5), "#e8d8ff", 1 - f); aro(P, m.x + 30, -10, 20 + f * 120, 12 + f * 70, "#ffffff", 1 - f, 0);
    } };

  Momentos.escena.ninjas = E;
})();
