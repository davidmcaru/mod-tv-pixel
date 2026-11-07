// detalles-sitios.js — lo que pasa en cada escenario a su hora y su día: momentos de la historia, guiños y fiestas.
(function () {
  const { rellena, rampa, esfera, humo, rotulo, brillo, sombra, andar } = Det, TAU = Math.PI * 2;

  function trazo(k, pts, col, g = 1) { for (let i = 1; i < pts.length; i++) { const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0), 1); for (let t = 0; t <= n; t++) k.crudo(x0 + ((x1 - x0) * t) / n, y0 + ((y1 - y0) * t) / n, g, g, col); } }
  const bolaC = (k, cx, cy, rx, ry, col) => { for (let y = -ry; y <= ry; y++) { const w = rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))); k.crudo(cx - w, cy + y, 2 * w, 1, col); } };
  function lluvia(k, n = 120, oscura = 0.18, col = "#c8d8ec", largo = 6) {
    const { h } = Det.cuando(k);
    if (oscura) k.alfa(oscura, () => k.crudo(0, 0, 320, 180, "#1c2634"));
    k.alfa(0.55, () => { for (let i = 0; i < n; i++) { const x = (k.rnd() * 330 + h * 41) % 330, y = (k.rnd() * 190 + h * 67) % 190 - 8; for (let j = 0; j < largo; j++) k.crudo(x - j * 0.3, y + j, 1, 1, col); } });
    k.actores.push({ tipo: "lluvia", n: Math.round(n / 3), col, largo });
  }
  function nieve(k, n = 70) { for (let i = 0; i < n; i++) k.crudo(k.rnd() * 320, k.rnd() * 176, 1 + (i % 3 === 0 ? 1 : 0), 1 + (i % 3 === 0 ? 1 : 0), "#ffffff"); k.actores.push({ tipo: "nieve", n: Math.round(n / 3), col: "#ffffff" }); }
  function confeti(k, n = 110) { const C = ["#e8402a", "#f2c84b", "#3f8ac0", "#3fb85a", "#f4efe0", "#e86a9a"]; for (let i = 0; i < n; i++) k.crudo(k.rnd() * 320, k.rnd() * 160, 2, 1 + (i % 2), C[i % 6]); }
  function estallido(k, x, y, r, col) { for (let a = 0; a < TAU - 0.1; a += TAU / 14) { trazo(k, [[x + Math.cos(a) * r * 0.35, y + Math.sin(a) * r * 0.35], [x + Math.cos(a) * r, y + Math.sin(a) * r]], col); k.crudo(x + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2) + 1, 1, 1, "#fff4d0"); } }
  const fuegos = (k, lista) => lista.forEach(([x, y, r, c]) => estallido(k, x, y, r, c));
  const grieta = (k, g, g2 = 2, filo = "#d8c8a4") => g.forEach((p, i) => { if (i) { k.linea(g[i - 1][0], g[i - 1][1], p[0], p[1], "#26262a", g2); k.linea(g[i - 1][0] + g2, g[i - 1][1], p[0] + g2, p[1], filo); } });
  function polvo(k, lista, col = "#c8bca8", a = 0.5) { k.alfa(a, () => lista.forEach(([x, y, r]) => { k.elipse(x, y, r, r * 0.7, col); k.elipse(x + r * 0.8, y - r * 0.4, r * 0.7, r * 0.5, col); })); }
  function murcielagos(k, lista) { lista.forEach(([x, y]) => { k.crudo(x - 1, y, 3, 2, "#14121a"); trazo(k, [[x, y], [x - 4, y - 2], [x - 7, y + 1]], "#14121a"); trazo(k, [[x + 1, y], [x + 5, y - 2], [x + 8, y + 1]], "#14121a"); }); }
  function calabaza(k, x, y) { bolaC(k, x, y, 6, 5, "#e8862a"); [-3, 0, 3].forEach((d) => k.crudo(x + d, y - 5, 1, 10, "#c86a1a")); k.crudo(x - 1, y - 7, 2, 2, "#4a7a3a"); k.crudo(x - 3, y - 2, 2, 2, "#ffe06a"); k.crudo(x + 2, y - 2, 2, 2, "#ffe06a"); k.crudo(x - 3, y + 2, 7, 1, "#ffe06a"); }
  const fiesta = () => { if (window.FIESTA !== undefined) return window.FIESTA; const f = new Date(), m = f.getMonth() + 1, d = f.getDate(); return m === 10 && d === 31 ? "halloween" : m === 12 && d >= 24 && d <= 26 ? "navidad" : (m === 12 && d === 31) || (m === 1 && d === 1) ? "nochevieja" : null; };
  const deNoche = (h) => h >= 20 || h <= 4;
  Det.fiesta = fiesta;

  const PIR = {
    1: (k, { h, d }) => {
      const parche = ([x, y, w, a]) => { k.R(x, y, w, a, "#c99a64"); k.R(x, y, w, 1, "#e0b888"); k.R(x, y + a - 1, w, 1, "#8a6238"); [[1, 1], [w - 2, 1], [1, a - 2], [w - 2, a - 2]].forEach(([i, j]) => k.P(x + i, y + j, "#3a2a20")); };
      [[214, 150, 18, 7], [120, 168, 22, 7], [270, 160, 16, 6], [152, 140, 14, 6], [60, 172, 20, 7], [284, 148, 12, 6], [232, 170, 18, 6]].slice(0, d === 3 ? 3 : d === 4 ? 7 : 0).forEach(parche);
      if (d === 4 && h === 3) { const x = 128, b = 130; brillo(k, x, b - 6, 16, 16, "#ffe6a8", 0.9); k.crudo(x - 3, b - 8, 7, 8, "#e8e0c8"); k.crudo(x - 2, b - 12, 5, 5, "#e8e0c8"); k.crudo(x - 1, b - 10, 3, 2, "#3a3028"); k.crudo(x + 4, b - 9, 1, 6, "#6d4628"); k.crudo(x + 3, b - 10, 3, 2, "#8a8a94"); }
    },
    3: (k, { d }) => {
      if (d === 1) { const x = 192; k.poli([[x - 14, 97], [x + 15, 97], [x + 11, 103], [x - 10, 103]], "#8a2f22"); k.R(x - 14, 96, 29, 1, "#c9a03c"); k.R(x, 76, 1, 20, "#3a2a20"); k.R(x - 8, 79, 17, 12, "#f4efe0"); k.R(x - 8, 90, 17, 1, "#c8bea8"); k.elipse(x, 84, 2, 2, "#26262a"); k.linea(x - 4, 88, x + 4, 80, "#26262a"); k.linea(x - 4, 80, x + 4, 88, "#26262a"); k.R(x + 1, 74, 6, 3, "#26262a"); }
      if (d === 6) { k.R(122, 114, 10, 13, "#efe2c4"); k.R(122, 114, 10, 1, "#c8bea8"); k.R(124, 117, 6, 6, "#a8926a"); k.R(125, 118, 4, 2, "#e8c84a"); k.R(124, 124, 6, 1, "#5a4a3a"); }
      if (fiesta() === "navidad") nieve(k);
      if (fiesta() === "nochevieja" && deNoche(Det.cuando(k).h)) fuegos(k, [[150, 30, 16, "#e8402a"], [210, 22, 14, "#f2c84b"], [100, 40, 12, "#6ac8ff"]]);
    },
    5: (k, { h }) => {
      if (h !== 13) return;
      [[[150, 2], [158, 16], [150, 28], [164, 46], [156, 62], [170, 82]], [[196, 34], [186, 46], [194, 60], [182, 76]], [[126, 44], [136, 54], [128, 70]]].forEach((g) => grieta(k, g));
      polvo(k, [[104, 128, 12], [214, 128, 14], [160, 128, 10]]); [[98, 138, 16, 8], [206, 140, 18, 9], [132, 136, 10, 5]].forEach(([x, b, w, a]) => k.roca(x, b, w, a, "#a8926a", "#c8b48c", "#7a6a4e"));
    },
    6: (k, { h }) => { if (h !== 23) return; lluvia(k, 150, 0.12); [[120, 160, 16], [200, 150, 12], [250, 170, 18], [160, 172, 12]].forEach(([x, y, r]) => k.alfa(0.5, () => k.elipse(x, y, r, 2, "#8aa6c8"))); },
    7: (k, { h }) => { if (h !== 14) return; [38, 54, 72].forEach((r, i) => { for (let a = 0; a < TAU; a += 0.035) { if (Math.sin(a * 12 + i) < -0.3) continue; const x = 142 + Math.cos(a) * r * 1.2, y = 74 + Math.sin(a) * r; if (y < 128) k.crudo(x, y, 1, 1, i === 2 ? "#f4d870" : "#fff2b0"); } }); },
    19: (k, { h }) => {
      if (h < 15 || h > 16) return;
      lluvia(k, h === 16 ? 170 : 90, h === 16 ? 0.26 : 0.14);
      if (h === 16) { const g = [[178, 0], [166, 7], [172, 11], [160, 19]]; k.alfa(0.1, () => k.crudo(0, 0, 320, 180, "#e8f0ff")); k.halo(160, 14, 40, 24, "#d8e8ff", 0.5); trazo(k, g, "#ffffff", 2); trazo(k, g.map(([x, y]) => [x + 2, y]), "#b8d0ff"); k.llama(160, 19, 0.5); k.llama(140, 19, 0.3); k.llama(184, 19, 0.3); }
    },
    18: (k, { h }) => {
      if (h !== 18 && h !== 19) return;
      const x = 56, gato = h === 18;
      k.poli([[x - 17, 86], [x + 18, 86], [x + 13, 94], [x - 12, 94]], gato ? "#2a2630" : "#a87444"); k.R(x - 17, 85, 35, 1, gato ? "#4a4650" : "#c99a64"); k.R(x, 56, 2, 30, "#3a2a20");
      k.poli([[x - 12, 60], [x + 14, 60], [x + 16, 80], [x - 14, 80]], gato ? "#26262a" : "#f4efe0");
      if (gato) { k.elipse(x + 1, 69, 5, 4, "#f4efe0"); k.poli([[x - 4, 67], [x - 3, 61], [x + 1, 65]], "#f4efe0"); k.poli([[x + 6, 67], [x + 5, 61], [x + 1, 65]], "#f4efe0"); k.R(x - 2, 68, 2, 2, "#26262a"); k.R(x + 3, 68, 2, 2, "#26262a"); k.linea(x - 8, 71, x - 4, 70, "#f4efe0"); k.linea(x + 6, 70, x + 10, 71, "#f4efe0"); }
      else { k.elipse(x + 1, 69, 3, 3, "#26262a"); k.linea(x - 5, 75, x + 7, 63, "#26262a"); k.linea(x - 5, 63, x + 7, 75, "#26262a"); esfera(k, x + 19, 83, 3, 3, ["#ffffff", "#efe6d0", "#d4c8ae"]); }
    },
    20: (k, { h }) => { if (h !== 17) return; const x = 160, y = 46; k.alfa(0.7, () => { k.linea(x - 3, y + 5, x - 7, y + 14, "#ffffff"); k.linea(x + 3, y + 5, x + 7, y + 14, "#ffffff"); }); k.poli([[x - 6, y], [x + 6, y], [x + 4, y + 5], [x - 4, y + 5]], "#a87444"); k.R(x, y - 12, 1, 12, "#3a2a20"); k.R(x - 5, y - 11, 11, 8, "#f4efe0"); k.elipse(x, y - 7, 2, 2, "#26262a"); },
    25: (k, { h }) => {
      if (h === 22) { k.llama(198, 20, 0.7); k.llama(207, 20, 0.5); humo(k, 204, 6, "#6a6d80", 0.5, 6); }
      if (h === 23) { k.poli([[188, 4], [196, 5], [193, 11], [188, 10]], "#3a3a3a"); humo(k, 192, 6, "#6a6d80", 0.4, 5); }
    },
    13: (k, { h }) => {
      if (h !== 11) return;
      rellena(k, [[-2, -2], [104, -2], [128, 4], [98, 14], [60, 21], [-2, 34]], (x, y) => rampa(["#a8b0a0", "#88947e", "#68765e", "#4a5844"], (y + x * 0.16) / 42, x, y));
      k.linea(-2, 28, 60, 16, "#d8c060"); k.linea(60, 16, 100, 8, "#d8c060"); for (let x = 12; x < 96; x += 16) k.R(x, 2 + x * 0.04, 8, 3, "#3a4a4c");
      [[30, 28], [70, 19]].forEach(([x, y]) => { for (let i = 0; i < 8; i++) k.R(x + (i % 2), y + i * 3, 2, 2, "#5a6468"); });
    },
    14: (k, { h }) => { if (h < 18) return; const e = 1 - (h - 18) * 0.1; k.alfa(0.5, () => { for (let i = -15; i <= 15; i++) { const xb = 160 + i * 22 * e; for (let y = 0; y < 180; y++) k.crudo(160 + (xb - 160) * Math.sqrt(y / 180), y, 1, 1, "#f0ecff"); } }); },
    12: (k, { h }) => {
      if (h < 16) return;
      const e = h >= 17 ? 1.2 : 1, x = 64, y = 34;
      [-14, -2, 12].forEach((d, i) => { const px = x + d * e, py = y + 12 * e + (i === 1 ? 10 : 0) * e; k.poli([[px - 3, py], [px + 3, py], [px, py + 7 * e]], "#6ac8ff"); k.P(px, py + 2, "#d8f4ff"); });
      rellena(k, [[x - 34 * e, y + 3 * e], [x + 34 * e, y + 3 * e], [x + 24 * e, y + 13 * e], [x + 10 * e, y + 15 * e], [x + 2 * e, y + 24 * e], [x - 8 * e, y + 14 * e], [x - 22 * e, y + 12 * e]], (px, py) => rampa(["#6a5e54", "#544a42", "#3e3630"], (py - y) / (20 * e) + (px > x ? 0.2 : 0), px, py));
      esfera(k, x, y - 8 * e, 17 * e, 13 * e, ["#efe6d0", "#d4c8ae", "#a89e88"]); k.poli([[x - 13 * e, y - 15 * e], [x - 22 * e, y - 26 * e], [x - 7 * e, y - 19 * e]], "#d4c8ae"); k.poli([[x + 13 * e, y - 15 * e], [x + 22 * e, y - 26 * e], [x + 7 * e, y - 19 * e]], "#a89e88");
      k.elipse(x - 6 * e, y - 9 * e, 3.5 * e, 4 * e, "#26262a"); k.elipse(x + 6 * e, y - 9 * e, 3.5 * e, 4 * e, "#26262a"); k.R(x - 1, y - 5 * e, 2, 3, "#26262a"); for (let i = -2; i <= 2; i++) k.R(x + i * 3 * e - 1, y - 1, 2, 3, "#26262a");
    },
    27: (k, { h }) => {
      if (h !== 17) return;
      const M = ["#a85fe0", "#7a35b0", "#4a1a70"];
      for (let i = 0; i < 10; i++) { const x = 104 + i * 12, a = 22 + k.rnd() * 66; k.R(x, 132 - a, 2 + (i % 2), a, M[1]); k.R(x, 132 - a, 1, a, M[0]); }
      [[160, 150, 76, 13], [100, 168, 44, 8], [236, 168, 50, 8]].forEach(([x, y, rx, ry]) => { k.elipse(x, y, rx, ry, M[2]); k.elipse(x, y - 1, rx - 6, ry - 3, M[1]); k.elipse(x - rx * 0.2, y - 2, rx * 0.45, ry * 0.35, M[0]); });
      for (let i = 0; i < 14; i++) k.elipse(k.rnd() * 300 + 10, 138 + k.rnd() * 36, 1.5, 1.5, "#d8b0f8");
      k.alfa(0.14, () => k.crudo(0, 0, 320, 180, "#6a2a9a"));
    },
    30: (k, { h }) => {
      if (h >= 6 && h <= 19) { const s = Horas.sol(k.luz ? k.luz.h : 12), x = s.x + (k.luz ? k.luz.dx : 0), y = s.y, e = s.r / 13; k.crudo(x - 6 * e, y - 4 * e, 3, 4, "#8a4a20"); k.crudo(x + 3 * e, y - 4 * e, 3, 4, "#8a4a20"); for (let i = -6; i <= 6; i++) k.crudo(x + i * e, y + 5 * e - Math.round((1 - (i * i) / 36) * -3), 1, 1, "#8a4a20"); k.crudo(x - 10 * e, y + 1, 3, 2, "#f28aa8"); k.crudo(x + 8 * e, y + 1, 3, 2, "#f28aa8"); }
      const nx = k.luz ? andar(k, -20, 44, 96, 18) : -20, cx = nx + 48, cy = 50; k.R(cx - 9, cy - 3, 3, 4, "#6a7a9a"); k.R(cx + 6, cy - 3, 3, 4, "#6a7a9a"); for (let i = -5; i <= 5; i++) k.P(cx + i, cy + 6 - Math.round(((25 - i * i) / 25) * -2), "#6a7a9a");
    },
    31: (k, { h }) => {
      if (h !== 20) return;
      const x0 = 124, y0 = 16, w = 72, a = 46, C = "#6ae8ff";
      k.alfa(0.14, () => k.poli([[160, 92], [x0, y0 + a], [x0 + w, y0 + a]], C)); k.alfa(0.24, () => k.crudo(x0, y0, w, a, C));
      trazo(k, [[x0, y0], [x0 + w, y0], [x0 + w, y0 + a], [x0, y0 + a], [x0, y0]], C);
      k.alfa(0.85, () => { k.poli([[146, 62], [174, 62], [170, 50], [150, 50]], "#a8ecff"); k.crudo(157, 44, 6, 7, "#d8fbff"); bolaC(k, 160, 29, 12, 14, "#d8fbff"); k.crudo(151, 28, 7, 5, "#26506a"); k.crudo(162, 28, 7, 5, "#26506a"); k.crudo(153, 29, 3, 3, "#d8fbff"); k.crudo(164, 29, 3, 3, "#d8fbff"); k.crudo(158, 30, 4, 1, "#26506a"); k.crudo(155, 38, 10, 1, "#26506a"); for (let x = 150; x < 171; x += 4) k.crudo(x, 16 + Math.abs(x - 160) / 3, 2, 3, "#a8ecff"); });
      k.alfa(0.28, () => { for (let y = y0; y < y0 + a; y += 3) k.crudo(x0, y, w, 1, "#ffffff"); });
    },
  };

  const NIN = {
    2: (k, { h }) => { if (h !== 5) return; const x = 134, b = 123, C = "#8a6a4a"; k.elipse(x, b - 4, 5, 4, C); k.elipse(x + 3, b - 9, 3, 3, C); k.P(x + 1, b - 12, C); k.P(x + 5, b - 12, C); k.linea(x - 5, b - 2, x - 9, b - 8, C); k.R(x - 2, b - 6, 1, 3, "#5a4430"); k.R(x + 1, b - 6, 1, 3, "#5a4430"); k.R(x + 4, b - 13, 2, 2, "#e8402a"); k.crudo(x + 2, b - 10, 1, 1, "#ffe06a"); k.crudo(x + 4, b - 10, 1, 1, "#ffe06a"); },
    3: (k, { h }) => {
      [[172, 139], [177, 141]].forEach(([x, y]) => { k.linea(170, 135, x, y - 2, "#6d4628"); k.elipse(x, y, 2, 2, "#e8c84a"); k.P(x - 1, y - 1, "#fff2b0"); k.P(x, y + 1, "#8a6a20"); });
      const x = 176, y = 155, a = ((h % 12) / 12) * TAU - Math.PI / 2;
      k.R(x - 3, y + 4, 2, 2, "#3a3a44"); k.R(x + 2, y + 4, 2, 2, "#3a3a44"); k.elipse(x - 3, y - 5, 2, 2, "#e8c84a"); k.elipse(x + 3, y - 5, 2, 2, "#e8c84a"); k.elipse(x, y, 5, 5, "#c0392b"); k.elipse(x, y, 4, 4, "#f4efe0"); k.linea(x, y, x, y - 3, "#26262a"); k.linea(x, y, x + Math.cos(a) * 3, y + Math.sin(a) * 3, "#26262a"); sombra(k, x, y + 6, 6, 1);
      if (h === 19) [[-9, -8], [9, -8], [-11, -2], [11, -2]].forEach(([dx, dy]) => k.linea(x + dx, y + dy, x + dx * 1.3, y + dy * 1.3, "#ffe06a"));
    },
    4: (k, { h, d }) => { if (d === 3 && h === 23) lluvia(k, 170, 0.22); },
    7: (k, { h }) => { if (h !== 12) return; const x = 96, y = 30, B = ["#ffffff", "#ece6dc", "#b8b4ac"]; k.poli([[x - 3, y], [x - 24, y - 12], [x - 14, y + 1], [x - 2, y + 3]], B[1]); k.poli([[x + 3, y], [x + 24, y - 12], [x + 14, y + 1], [x + 2, y + 3]], B[2]); esfera(k, x, y + 2, 8, 4, B); k.poli([[x - 8, y + 2], [x - 16, y], [x - 15, y + 5]], B[1]); k.elipse(x + 9, y, 3, 3, B[0]); k.P(x + 12, y, "#c9a03c"); k.P(x + 10, y - 1, "#26262a"); k.R(x - 2, y - 5, 4, 5, "#26262a"); k.P(x - 1, y - 3, "#c0392b"); k.R(x - 2, y - 7, 4, 2, "#e8d080"); },
    21: (k, { h }) => { if (h === 23) confeti(k); },
    24: (k, { h }) => { if (h % 2) { k.elipse(32, 98, 6, 6, "#9ab070"); k.R(27, 98, 11, 1, "#5e7a40"); } },
    1: (k, { h }) => { const f = fiesta(); if (f === "navidad") nieve(k); if (f === "nochevieja" && deNoche(h)) fuegos(k, [[150, 26, 16, "#e8402a"], [214, 34, 13, "#f2c84b"], [90, 30, 12, "#3fb85a"]]); },
  };

  const MAG = {
    1: (k, { h, d }) => {
      if (d === 4 && h === 16) [[126, 146, -1], [140, 148, 1], [152, 146, -1]].forEach(([x, b, s]) => { for (let i = 0; i < 18; i++) { const t = i / 18; k.R(x + s * Math.sin(t * 3) * 5, b - t * 18, 3 - t * 2, 2, i % 3 ? "#6a4a7a" : "#8a6a9a"); } k.alfa(0.6, () => k.elipse(x, b + 1, 6, 1, "#d8ecf8")); });
      if (fiesta() === "nochevieja" && deNoche(h)) fuegos(k, [[70, 26, 14, "#3fe87a"], [130, 16, 12, "#e8402a"], [250, 30, 14, "#f2c84b"]]);
    },
    2: (k) => { const f = fiesta(); if (f === "halloween") { [[24, 34], [70, 22], [116, 44], [160, 20], [204, 44], [250, 22], [296, 34], [46, 58], [274, 58]].forEach(([x, y]) => calabaza(k, x, y)); murcielagos(k, [[92, 14], [140, 30], [226, 16], [186, 8]]); } if (f === "navidad") { [[24, 118], [296, 118]].forEach(([x, b]) => { k.poli([[x - 15, b], [x + 15, b], [x, b - 44]], "#2f7a4a"); k.poli([[x - 11, b - 18], [x + 11, b - 18], [x, b - 58]], "#3f8a5a"); [[-6, -10, "#e8402a"], [5, -14, "#f2c84b"], [-2, -30, "#6ac8ff"], [3, -40, "#e8402a"]].forEach(([dx, dy, c]) => k.crudo(x + dx, b + dy, 2, 2, c)); }); nieve(k, 50); } },
    4: (k, { h, d }) => { const L = [[150, 42], [204, 30], [128, 62], [176, 86], [120, 100], [196, 98], [158, 24], [140, 78], [186, 52], [112, 34], [168, 64]], [x, y] = L[(h * 5 + d * 3) % L.length]; k.alfa(0.5, () => trazo(k, [[x - 12, y + 5], [x - 6, y + 2], [x, y + 1]], "#fff2b0")); k.crudo(x, y, 3, 3, "#ffd23f"); k.crudo(x, y, 1, 1, "#fff4b0"); k.crudo(x - 4, y - 1, 4, 1, "#f4f4ff"); k.crudo(x + 3, y - 1, 4, 1, "#f4f4ff"); k.crudo(x - 3, y, 3, 1, "#c8c8e0"); k.crudo(x + 3, y, 3, 1, "#c8c8e0"); },
    5: (k, { h }) => {
      if (h !== 18) return;
      const x = 172, b = 136, B = "#f4f4ff", O = "#c8c8e0";
      k.halo(x, b - 10, 28, 18, "#d8e4ff", 0.3); bolaC(k, x, b - 9, 9, 4, B); [-7, -4, 4, 7].forEach((d) => k.crudo(x + d, b - 7, 1, 7, d < 0 ? O : B));
      trazo(k, [[x + 7, b - 11], [x + 11, b - 18]], B, 3); k.crudo(x + 10, b - 21, 6, 3, B); trazo(k, [[x + 13, b - 22], [x + 17, b - 29]], "#fff2b0"); trazo(k, [[x + 7, b - 16], [x + 9, b - 21]], O); trazo(k, [[x - 9, b - 10], [x - 13, b - 6], [x - 12, b - 2]], O, 2);
    },
    8: (k, { h }) => {
      if (h >= 8 && h <= 10) { const n = [10, 34, 80][h - 8]; for (let i = 0; i < n; i++) { const x = 46 + (k.rnd() - 0.2) * (50 + (h - 8) * 130), y = 122 - k.rnd() * (34 + (h - 8) * 46); k.R(x, y, 6, 4, "#f4efe0"); k.R(x, y + 3, 6, 1, "#c8bea8"); k.P(x + 2, y + 2, "#c0392b"); k.P(x + 3, y + 2, "#c0392b"); } }
      if (fiesta() === "navidad") nieve(k);
    },
    21: (k, { h }) => { if (h !== 23) return; const cx = 148, ap = 62, b = 170; k.alfa(0.75, () => { for (let i = 0; i < 18; i++) { const th = (i / 18) * TAU; for (let t = 0; t < 1; t += 0.01) { const f = Math.sin((t * Math.PI) / 2); k.crudo(cx + Math.cos(th) * 104 * f, ap + (b + Math.sin(th) * 10 - ap) * t * t, 1, 1, i % 2 ? "#ffe06a" : "#fff4b0"); } } }); k.alfa(0.2, () => k.halo(cx, 120, 110, 60, "#ffe06a", 0.5)); },
    23: (k, { h }) => {
      [[20, 26], [291, 26], [87, 26], [223, 26], [53, 26], [257, 26]].slice(0, Math.max(0, Math.min(6, h - 7))).forEach(([x, y]) => { k.R(x - 10, y - 12, 20, 24, "#c9a03c"); k.R(x - 9, y - 11, 18, 22, "#f4efe0"); k.R(x - 5, y - 9, 10, 2, "#a82a30"); for (let j = 0; j < 5; j++) k.R(x - 7, y - 4 + j * 3, 14, 1, "#6a6a74"); });
      if (h === 13) { fuegos(k, [[60, 56, 16, "#ffe06a"], [250, 56, 14, "#3fe87a"], [124, 96, 12, "#e86a9a"], [208, 100, 13, "#6ac8ff"]]); for (let i = 0; i <= 90; i++) { const t = i / 90, x = 96 + t * 124, y = 150 - t * 42 + Math.sin(t * 11) * 9, g = 1 + Math.round(t * 3); k.crudo(x, y, g, g, i % 9 < 2 ? "#ffe06a" : "#ff9a3a"); if (i % 12 === 6) k.crudo(x, y - 2, 2, 2, "#e8502a"); }
        k.poli([[176, 118], [190, 104], [196, 122]], "#e8502a"); k.poli([[216, 104], [232, 100], [228, 106], [234, 110], [218, 112]], "#ff9a3a"); k.crudo(222, 103, 2, 2, "#fff4d0"); k.poli([[234, 104], [258, 96], [252, 106], [260, 114], [234, 108]], "#ffe06a"); k.poli([[234, 105], [250, 101], [246, 106], [250, 110], [234, 107]], "#fff4d0"); }
    },
    24: (k, { h }) => {
      if (h < 22) return;
      const n = h === 22 ? 10 : 22;
      for (let i = 0; i < n * 3; i++) { const s = i % 2 ? 1 : -1, d = k.rnd(), X = 160 + (s * 160) / (1 + 3 * d), Y = 86 + (24 + 21 * Math.floor(k.rnd() * 6) - 6 - 86) / (1 + 3 * d), r = Math.max(1, 4.5 / (1 + 3 * d)); k.elipse(X, Y, r + 1, r + 1, "#141c40"); }
      k.alfa(0.32, () => { for (let i = 0; i < n; i++) { const x = 16 + k.rnd() * 288, y = 30 + k.rnd() * 110; if (x > 120 && x < 200) continue; for (let j = 0; j < 4; j++) bolaC(k, x + Math.sin(j * 2) * 2, y - j * 5, 3 + j, 2 + j * 0.6, "#d8f4ff"); } });
      for (let i = 0; i < n * 3; i++) { const x = k.rnd() * 320, y = 150 + k.rnd() * 28; k.crudo(x, y, 2, 1, i % 3 ? "#9ad8ff" : "#ffffff"); }
    },
    26: (k, { h }) => { if (h !== 14) return; k.llama(196, 136, 0.9); k.llama(190, 136, 0.5); k.llama(202, 136, 0.5); k.elipse(196, 135, 8, 2, "#6a6a6a"); },
    30: (k, { h }) => {
      if (h !== 9) return;
      [[[160, 176], [146, 160], [152, 146], [134, 132]], [[160, 176], [176, 158], [168, 144], [190, 128]], [[160, 176], [120, 170], [104, 156], [76, 152]], [[160, 176], [204, 168], [224, 150], [250, 146]], [[160, 176], [138, 178]], [[160, 176], [186, 178]]].forEach((g) => grieta(k, g, 2, "#8a8678"));
      polvo(k, [[110, 166, 12], [212, 166, 14], [146, 150, 8], [180, 150, 9]], "#d8d0c0", 0.42); [[96, 176, 16, 7], [226, 178, 18, 8], [130, 150, 8, 4], [192, 148, 9, 4]].forEach(([x, b, w, a]) => k.roca(x, b, w, a, "#c8c0b0", "#e8e0d0", "#8a8678"));
    },
    18: (k) => { if (fiesta() === "halloween") murcielagos(k, [[120, 24], [158, 38], [196, 18], [230, 44], [84, 42]]); },
  };

  Object.entries({ piratas: PIR, ninjas: NIN, magos: MAG }).forEach(([u, lista]) => { if (Sitios[u]) Object.entries(lista).forEach(([s, f]) => { const sitio = Sitios[u][s]; if (!sitio || (sitio[3] && sitio[3].detallesDentro)) return; const pinta = sitio[2]; sitio[2] = (k) => { pinta(k); f(k, Det.cuando(k)); }; }); });
})();
