// sitios-magos.js — los escenarios de Magos, dibujados con las piezas de piezas-detalle.js.
(function () {
  const { trama, rampa, rellena, bola, esfera, cilindro, nubarron, cirros, reflejo, espuma, oleaje, montana, loma, estratos, pena, adoquines, cubierta, camino, matas, flores, helecho, sillares, ladrillos, tablas, ventanaArco, torreta, almenas, casaTorcida, tejadoJ, barril, caja, bandera, farolillo, catenaria, humo, sombra, brillo, rotulo } = Det;
  const NOCHE = ["#0f1636", "#1a2452", "#2a3670", "#3f4a8a"], CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"], VEN = ["#ffd27a"];
  const PIEDRA = ["#8a8ca4", "#6e7090", "#5e6078", "#44465c", "#34364c"], PIZ = ["#4a5488", "#2f3560", "#22264a"], VERDE = ["#98d470", "#7fbe5a", "#6cab4c", "#5a9440"];
  const OSCURO = { tronco: "#1f1a1a", copa: "#16302a", borde: "#0e2220", luz: "#20443a", osc: "#10261f" };
  const ORO = ["#ffe08a", "#e8c35a", "#c9a03c", "#a8842e", "#7a5f20"], MAD = ["#a87444", "#8a5a32", "#6a4426", "#4a2e18"];
  function castillo(k, base, { piedra = PIEDRA, techo = PIZ, ven = "#ffd27a", e = 1 } = {}) {
    const X = (x) => 160 + (x - 160) * e, t = (x, w, h, a) => torreta(k, X(x), base, w * e, h * e, a * e, { piedra, techo, ventanas: ven, paso: 11 });
    t(62, 12, 48, 20); t(100, 12, 66, 24); t(216, 12, 72, 26); t(252, 12, 52, 20);
    const lienzo = (x, w, h) => { cilindro(k, X(x), base - h * e, w * e, h * e, piedra, 0.22); almenas(k, X(x), base - h * e, w * e, piedra[1], 7, 4, 3); };
    lienzo(52, 216, 30);
    rellena(k, [[X(110), base - 34 * e], [X(110), base - 58 * e], [X(196), base - 58 * e], [X(196), base - 34 * e]], (x, y) => rampa(piedra, 0.14 + ((x - X(110)) / (86 * e)) * 0.6, x, y)); k.poli([[X(104), base - 58 * e], [X(202), base - 58 * e], [X(192), base - 74 * e], [X(114), base - 74 * e]], techo[1]); k.poli([[X(156), base - 58 * e], [X(202), base - 58 * e], [X(192), base - 74 * e], [X(156), base - 74 * e]], techo[2]);
    if (ven) for (let x = 116; x < 192; x += 13) ventanaArco(k, X(x), base - 54 * e, 6 * e, 16 * e, piedra[3], ven);
    t(84, 18, 76, 26); t(140, 20, 92, 28); t(176, 16, 80, 24); t(232, 20, 84, 28); t(120, 12, 62, 22); t(204, 12, 58, 22);
    for (let x = 56; x < 262; x += 15) { k.elipse(X(x + 5), base - 8 * e, 5 * e, 6 * e, piedra[4]); k.R(X(x), base - 8 * e, 10 * e, 8 * e, piedra[4]); }
    if (ven) for (let x = 62; x < 258; x += 11) k.R(X(x), base - 24 * e, 3 * e, 5 * e, ven);
  }
  function marca(k, x, y) {
    const V = "#3fe87a", O = "#0f3a22";
    k.halo(x, y + 8, 42, 44, V, 0.28); k.elipse(x, y, 13, 12, V); k.R(x - 8, y + 8, 17, 8, V);
    k.elipse(x - 5, y - 1, 3, 4, O); k.elipse(x + 5, y - 1, 3, 4, O); k.R(x - 1, y + 5, 3, 3, O); for (let i = 0; i < 4; i++) k.R(x - 6 + i * 4, y + 11, 1, 5, O);
    for (let t = 0; t < 40; t++) k.R(x + Math.sin(t / 5) * (4 + t * 0.35), y + 16 + t * 0.7, 3, 3, t % 4 < 2 ? V : "#a8ffc8"); k.elipse(x + Math.sin(39 / 5) * 18, y + 44, 4, 3, V);
  }
  function casaT(k, x, base, w, h, { pared = "#e8dcc0", viga = "#4a3428", techo = "#7a5a4a", techoO = "#5e4436", nieve = false, ven = "#ffd27a", puerta = "#5a3a22", chimenea = true, sombraC = "#2a2018", plano = false, lad = 0 } = {}) {
    const top = base - h, a = Math.round(w * 0.46) + 3, pm = x + w / 2;
    if (chimenea) { k.R(x + w * 0.68, top - a * 0.9, 6, a * 0.9, "#6a4a40"); k.R(x + w * 0.68 - 1, top - a * 0.9 - 1, 8, 2, "#4a3430"); }
    rellena(k, [[x, base], [x + lad, top], [x + w + lad, top], [x + w, base]], (px, py) => (px > x + w - 3 + lad * (base - py) / h ? viga : pared));
    k.R(x, base - 2, w, 2, viga); k.R(x + lad, top, w, 2, viga); k.R(x + lad * 0.5, top + h * 0.5, w, 2, viga); [[0.02], [0.5], [0.96]].forEach(([f]) => k.linea(x + w * f, base, x + w * f + lad, top, viga, 2));
    k.linea(x + 2, base - 2, x + w * 0.5 - 1, top + h * 0.5, viga); k.linea(x + w - 2, base - 2, x + w * 0.5 + 1, top + h * 0.5, viga);
    [[x + w * 0.1], [x + w * 0.6]].forEach(([vx]) => { k.R(vx + lad * 0.7, top + 4, 9, 8, viga); k.R(vx + 1 + lad * 0.7, top + 5, 7, 6, ven); k.R(vx + 4 + lad * 0.7, top + 5, 1, 6, viga); k.R(vx + 1 + lad * 0.7, top + 7, 7, 1, viga); });
    k.R(pm - 4, base - 12, 8, 12, viga); k.R(pm - 3, base - 11, 6, 11, puerta); k.P(pm + 1, base - 5, "#e8c35a");
    k.poli([[x - 4 + lad, top + 1], [x + w + 4 + lad, top + 1], [pm + lad * 1.4, top - a]], techo); k.poli([[pm + lad * 1.4, top - a], [x + w + 4 + lad, top + 1], [pm + 3 + lad, top + 1]], techoO);
    for (let f = 3; f < a - 2; f += 4) for (let tx = x - 2 + (f % 8); tx < x + w + 2; tx += 7) if (Math.abs(tx - pm) < (w / 2 + 3) * (1 - f / a)) k.R(tx + lad, top - f + 1, 3, 1, techoO);
    if (nieve) { k.poli([[x - 5 + lad, top + 1], [x + w + 5 + lad, top + 1], [pm + lad * 1.4, top - a - 1]], "#f4f8fc"); k.poli([[pm + lad * 1.4, top - a - 1], [x + w + 5 + lad, top + 1], [pm + 3 + lad, top + 1]], "#d4dee8"); for (let i = x - 3; i < x + w + 3; i += 3) k.R(i + lad, top + 2, 1, 1 + ((i >> 1) % 3), "#c8dcec"); }
    k.alfa(0.28, () => k.R(x - 2, base, w + 6, 2, sombraC));
  }
  const tumba = (k, x, b, w, h, c = ["#868a94", "#6a6e78", "#4a4e58"], nieve = false) => { rellena(k, [[x, b], [x, b - h + w / 2], [x + w * 0.16, b - h + w * 0.12], [x + w / 2, b - h], [x + w * 0.84, b - h + w * 0.12], [x + w, b - h + w / 2], [x + w, b]], (px, py) => rampa(c, ((px - x) / w) * 0.9, px, py)); k.R(x + 3, b - h * 0.55, w - 6, 1, c[2]); k.R(x + 3, b - h * 0.4, w - 6, 1, c[2]); if (nieve) { k.elipse(x + w / 2, b - h + 1, w / 2, 2, "#ffffff"); k.elipse(x + w / 2, b, w, 2, "#ffffff"); } else sombra(k, x + w / 2, b, w * 0.8, 2); };
  const libros = (k, x, y, w, alto = 12, cols = ["#8f1d22", "#2f6a4a", "#2a4a8a", "#c9a03c", "#6a3f9a", "#5a3a22"]) => { for (let px = x; px < x + w - 3;) { const a = Math.round(alto * (0.7 + k.rnd() * 0.3)), g = 3 + Math.floor(k.rnd() * 3), c = cols[Math.floor(k.rnd() * cols.length)]; k.R(px, y - a, g, a, c); k.R(px, y - a, 1, a, "#ffffff30"); k.R(px + 0, y - a + 3, g, 1, "#e8c35a"); px += g; } k.R(x - 2, y, w + 4, 3, "#3f2616"); k.R(x - 2, y, w + 4, 1, "#6a4426"); };
  const velaF = (k, x, y) => { k.R(x, y, 2, 5, "#f4efe0"); k.R(x + 1, y, 1, 5, "#d8cdb4"); k.P(x, y - 1, "#ffcf6a"); k.P(x, y - 2, "#ffe6a8"); k.alfa(0.22, () => k.elipse(x, y - 2, 3, 3, "#ffcf6a")); };

  const sitios = {
    1: ["Hagworts desde el lago", "El castillo sobre su acantilado, reflejado en el agua", (k) => {
      k.banda(CIELO, 0, 118);
      nubarron(k, -20, 52, 96, 18); nubarron(k, 252, 44, 96, 20); cirros(k, 5, 4, 26);
      montana(k, 44, 122, 170, 56, { roca: ["#8aa0b8", "#6f86a0", "#5e7490", "#4e6280"] }); montana(k, 282, 122, 170, 62, { roca: ["#8aa0b8", "#6f86a0", "#5e7490", "#4e6280"] });
      rellena(k, [[46, 122], [70, 94], [250, 94], [276, 122]], estratos(["#7a7c88", "#62646f", "#50525c", "#3e4048"]));
      castillo(k, 98, { e: 0.8 });
      k.agua(120, 152, ["#4f9ad0", "#3f86c0", "#2f70a8"], "#bfe6f6", 60); reflejo(k, 122, 152);
      k.alfa(0.28, () => { k.poli([[50, 121], [270, 121], [240, 150], [84, 150]], "#3a4a68"); [[92, 18], [148, 22], [234, 20]].forEach(([x, w]) => k.R(x, 121, w, 26, "#2a3858")); });
      for (let i = 0; i < 26; i++) { const x = 66 + k.rnd() * 190; if (k.luz && k.luz.lit > 0.3) k.crudo(x, 124 + k.rnd() * 24, 3 + k.rnd() * 5, 1, "#ffd27a"); }
      espuma(k, 121, 30, 292, "#d8ecf4");
      [[62, 142, "#6b4a30"], [254, 138, "#6b4a30"], [236, 146, "#7a5230"]].forEach(([x, y, c]) => { k.poli([[x - 9, y], [x + 9, y], [x + 6, y + 3], [x - 6, y + 3]], c); k.R(x - 1, y - 2, 2, 2, "#ffd27a"); });
      k.suelo(152, "#6aa85a", "#5a9a4c", "#86c070"); espuma(k, 152, 0, 320, "#bfe6f6"); k.hierbas(155, 178, 70, ["#86c070", "#5a9a4c"]); matas(k, 156, 178, 16, ["#4a8a44", "#6aa85a", "#86c070"]); flores(k, 156, 178, 24, ["#ffffff", "#f2d24a"]);
      [[20, 152, 40], [298, 154, 44], [-2, 182, 56], [320, 184, 58]].forEach(([x, b, h]) => k.pino(x, b, h));
      for (let i = 0; i < 16; i++) { const x = i % 2 ? 6 + k.rnd() * 60 : 256 + k.rnd() * 60; k.linea(x, 154, x + 1, 146, "#4a7a3a"); k.P(x + 1, 145, "#7a5a3a"); }
    }, { ven: VEN, dx: 104 }],
    2: ["El Gran Comedor", "Las velas flotando bajo el techo que enseña el cielo de fuera", (k) => {
      k.banda(["#101a44", "#1a2660", "#26347a"], 0, 96);
      nubarron(k, 40, 18, 70, 8, ["#6a74a8", "#46508a", "#2f3a70"]); nubarron(k, 200, 26, 70, 7, ["#6a74a8", "#46508a", "#2f3a70"]);
      const VX = 160, VY = 96, Q = ["#8a7a68", "#6a5a4a", "#574838", "#463828"];
      rellena(k, [[0, -4], [104, 44], [104, 110], [0, 158]], (x, y) => rampa(Q, 0.14 + (x / 104) * 0.3 + ((Math.round(y + (x - 52) * ((y - VY) / (x - VX + 0.01)) * 0.1) % 11 < 1) ? 0.3 : 0), x, y)); rellena(k, [[320, -4], [216, 44], [216, 110], [320, 158]], (x, y) => rampa(Q, 0.34 + ((320 - x) / 104) * 0.3 + ((Math.round(y) % 11 < 1) ? 0.3 : 0), x, y));
      [[0, 26], [30, 21], [56, 17], [78, 13]].forEach(([x, w], i) => [0, 1].forEach((s) => { const px = s ? 320 - x - w : x, t = 8 + i * 13, b = 126 - i * 8; rellena(k, s ? [[px, b - (i + 1) * 3], [px, t + 20], [px + w * 0.5, t], [px + w, t + 18 - i], [px + w, b]] : [[px, b], [px, t + 18 - i], [px + w * 0.5, t], [px + w, t + 20], [px + w, b - (i + 1) * 3]], (qx, qy) => (Math.round(qx) % 7 === 0 || Math.round(qy) % 12 === 0 ? "#574838" : "#ffd27a")); }));
      sillares(k, 104, 44, 112, 66, { base: "#7a6854", luz: "#8a7864", osc: "#5f5040" }, 7, 15);
      rellena(k, [[122, 98], [122, 66], [160, 40], [198, 66], [198, 98]], (x, y) => (Math.round(x) % 9 === 0 || Math.round(y) % 9 === 0 ? "#3a2a1e" : ["#c0392b", "#2f6fa8", "#e8c35a", "#3f8a58", "#8f55d8"][Math.abs(Math.round(x / 9) + Math.round(y / 9)) % 5]));
      k.R(112, 100, 96, 4, "#7a5230"); k.R(112, 100, 96, 1, "#a87444"); k.R(112, 104, 96, 8, "#5a3a22"); [[124], [146], [174], [196]].forEach(([x]) => { k.R(x - 3, 92, 7, 8, "#6a3f9a"); k.elipse(x, 90, 3, 3, "#e8c8a0"); }); k.R(158, 86, 5, 14, "#c9a03c"); k.elipse(160, 84, 6, 5, "#e8c35a"); k.poli([[154, 82], [150, 76], [158, 80]], "#e8c35a"); k.poli([[166, 82], [170, 76], [162, 80]], "#e8c35a");
      [["#8f1d22", "#e8c35a", 40, 40, 30], ["#2f5fa8", "#c9a03c", 74, 60, 22], ["#2f7a4a", "#c8c8d0", 246, 60, 22], ["#c9a03c", "#26262a", 276, 40, 30]].forEach(([c, l, x, y, w]) => { k.R(x - w / 2, y, w, 44, c); k.R(x - w / 2, y, 2, 44, l); k.R(x + w / 2 - 2, y, 2, 44, l); k.poli([[x - w / 2, y + 44], [x, y + 54], [x + w / 2, y + 44]], c); k.elipse(x, y + 20, w * 0.26, w * 0.3, l); });
      rellena(k, [[-2, 182], [322, 182], [322, 158], [216, 110], [104, 110], [-2, 158]], (x, y) => ((y + (x >> 3)) % 13 < 1 ? "#6d5d4c" : "#8a7a68"));
      const X = (x0, y) => VX + (x0 - VX) * ((y - VY) / 84), H = (y) => 13 * ((y - VY) / 84);
      [58, 122, 198, 262].forEach((x0) => {
        rellena(k, [[X(x0, 182) - H(182) - 5, 182], [X(x0, 182) + H(182) + 5, 182], [X(x0, 116) + H(116) + 1, 116], [X(x0, 116) - H(116) - 1, 116]], (x, y) => (Math.abs(x - X(x0, y)) > H(y) ? "#3f2616" : "#6a4426"));
        rellena(k, [[X(x0, 182) - H(182), 182], [X(x0, 182) + H(182), 182], [X(x0, 116) + H(116), 116], [X(x0, 116) - H(116), 116]], (x, y) => rampa(MAD, 0.14 + ((x - X(x0, y) + H(y)) / (2 * H(y) + 0.1)) * 0.4 + (y % 9 === 0 ? 0.2 : 0), x, y));
        for (let y = 122; y < 180; y += 8 + (y - 120) * 0.1) { const s = H(y) * 0.5; k.elipse(X(x0, y) - s, y, 1 + s * 0.26, 1 + s * 0.1, "#f4efe0"); k.elipse(X(x0, y) + s, y + 3, 1 + s * 0.26, 1 + s * 0.1, "#e8c35a"); }
      });
      for (let i = 0; i < 46; i++) { const y = 20 + k.rnd() * 66, f = (y - 10) / 80, x = 160 + (k.rnd() * 2 - 1) * (40 + f * 120); velaF(k, x, y); }
    }, { fuerza: 0.12, fuego: ["#ffd27a", "#ffcf6a", "#ffe6a8", "#f4efe0", "#d8cdb4", "#c0392b", "#2f6fa8", "#e8c35a", "#3f8a58", "#8f55d8"] }],
    3: ["Hegsmoade", "El pueblo nevado, con sus ventanas encendidas", (k) => {
      k.banda(["#3a4a7a", "#5a6a9a", "#8a9abc", "#b8c4d8"], 0, 130);
      const NU = ["#ffffff", "#e0e6f0", "#b8c4d8"]; nubarron(k, -24, 28, 100, 14, NU); nubarron(k, 240, 22, 100, 14, NU);
      montana(k, 70, 130, 240, 84, { roca: ["#a8b4c8", "#8a98b0", "#74829c", "#5e6c86"], nieve: ["#ffffff", "#dde6f0"], hasta: 0.6 }); montana(k, 262, 130, 220, 72, { roca: ["#a8b4c8", "#8a98b0", "#74829c", "#5e6c86"], nieve: ["#ffffff", "#dde6f0"], hasta: 0.6 });
      const c = (p, t) => ({ pared: p, viga: "#3a2a22", nieve: true, techo: t, techoO: "#4a3a30", puerta: "#3a2a22" });
      casaT(k, 2, 128, 40, 26, c("#c8a888", "#6a5a4a")); casaT(k, 46, 130, 36, 30, { ...c("#e0c8a8", "#7a4a3a"), lad: -3 }); casaT(k, 90, 128, 44, 34, { ...c("#d8b898", "#6a4a3a"), lad: 3 });
      casaT(k, 186, 128, 42, 32, { ...c("#e0c8a8", "#5a4a4a"), lad: -3 }); casaT(k, 234, 130, 36, 26, c("#c8a888", "#7a5a3a")); casaT(k, 276, 128, 46, 30, { ...c("#d8b898", "#6a5a4a"), lad: 3 });
      k.R(100, 116, 22, 11, "#ffd27a"); k.R(100, 116, 22, 1, "#3a2a22"); k.R(111, 116, 1, 11, "#3a2a22"); for (let i = 0; i < 12; i++) k.P(101 + k.rnd() * 20, 118 + k.rnd() * 8, ["#e85a8a", "#5ac0d8", "#f2c84b"][i % 3]);
      k.R(232, 92, 12, 2, "#3a2a22"); k.R(236, 94, 1, 3, "#3a2a22"); k.R(232, 97, 12, 9, "#5a3a22"); k.linea(234, 104, 242, 99, "#c9a03c"); k.linea(234, 99, 242, 104, "#c9a03c");
      k.suelo(128, "#e8eef4", "#d0dae4", "#ffffff", 180, 500);
      k.alfa(0.5, () => { k.elipse(40, 150, 76, 5, "#c8d4e0"); k.elipse(280, 158, 76, 5, "#c8d4e0"); });
      camino(k, 128, 180, (f) => 160 + Math.sin(f * 3) * f * 14, (f) => 12 + f * 28, "#b8c4d4", "#c8d2de", "#a4b4c8");
      [[112, 136], [210, 136]].forEach(([x, b]) => { k.R(x, b - 22, 2, 22, "#26262a"); k.R(x - 3, b - 28, 8, 7, "#ffd27a"); k.R(x - 4, b - 29, 10, 1, "#26262a"); k.poli([[x - 4, b - 29], [x + 5, b - 29], [x + 1, b - 33]], "#f4f8fc"); brillo(k, x + 1, b - 25, 20, 18, "#ffcf6a", 0.6); });
      k.pino(36, 158, 34, { tronco: "#3a2a20", copa: "#2f5a4a", luz: "#e8eef4", osc: "#1f4a3a" }); k.pino(288, 166, 38, { tronco: "#3a2a20", copa: "#2f5a4a", luz: "#e8eef4", osc: "#1f4a3a" });
      [[0, 186, 66], [320, 186, 70]].forEach(([x, b, h]) => k.pino(x, b, h, { tronco: "#3a2a20", copa: "#2f5a4a", luz: "#f4f8fc", osc: "#1f4a3a" }));
      for (let i = 0; i < 90; i++) k.P(k.rnd() * 320, k.rnd() * 170, "#ffffff"); for (let i = 0; i < 26; i++) k.R(k.rnd() * 320, k.rnd() * 170, 2, 2, "#ffffff");
    }, { ven: VEN, tinte: 0.2 }],
    4: ["El campo de Kuidditch", "Las torres de las casas y los tres aros", (k) => {
      k.banda(["#5fa8e0", "#8cc6ea", "#d4e6ee"], 0, 120);
      nubarron(k, -20, 34, 90, 14); nubarron(k, 96, 22, 66, 10); nubarron(k, 240, 30, 96, 16);
      montana(k, 160, 118, 360, 34, { roca: ["#8fb0c8", "#7ca0b8", "#6e92aa", "#60849c"] });
      [[8, "#8f1d22", "#c9a03c"], [54, "#c9a03c", "#26262a"], [100, "#2f5fa8", "#c9a03c"], [176, "#2f7a4a", "#c8c8d0"], [222, "#8f1d22", "#c9a03c"], [268, "#2f5fa8", "#c9a03c"]].forEach(([x, c, l], i) => {
        const h = 54 + (i % 3) * 9, top = 118 - h;
        tablas(k, x + 7, top + 12, 28, h - 12, "#8a6a44", "#5a4228", "#a8865e", 5, true); [0.4, 0.7].forEach((f) => { k.linea(x + 8, top + 12 + (h - 12) * f, x + 34, top + 12 + (h - 12) * (f + 0.25), "#5a4228"); k.linea(x + 34, top + 12 + (h - 12) * f, x + 8, top + 12 + (h - 12) * (f + 0.25), "#5a4228"); });
        k.R(x + 2, top, 38, 13, "#2a2a30"); for (let px = x + 4; px < x + 38; px += 5) { k.R(px, top + 6, 3, 3, "#e8c8a0"); k.R(px, top + 9, 3, 4, c); }
        k.R(x + 2, top + 13, 38, 2, l); for (let j = 0; j < 8; j++) k.R(x + 2 + j * 5, top + 15, 3, 3, j % 2 ? c : l);
        k.poli([[x, top], [x + 42, top], [x + 21, top - 18]], c); k.poli([[x + 21, top - 18], [x + 42, top], [x + 25, top]], "#26262a30"); k.R(x + 20, top - 24, 1, 7, "#26262a"); bandera(k, x + 21, top - 24, 12, 5, l);
      });
      k.suelo(118, "#6fb05a", "#5c9c4c", "#8ccc70"); for (let x = 0; x < 320; x += 40) rellena(k, [[x, 118], [x + 20, 118], [x + 20 + (x - 150) * 0.5, 182], [x + (x - 170) * 0.5, 182]], () => "#74b460");
      k.hierbas(122, 178, 60, ["#5c9c4c", "#8ccc70"]); for (let a = 2.7; a < 3.6; a += 0.01) k.R(160 + Math.cos(a - 1.57) * 0, 0, 0, 0, "#ffffff"); k.elipse(160, 152, 56, 14, "#74b460"); for (let a = 0; a < 6.28; a += 0.02) k.P(160 + Math.cos(a) * 56, 152 + Math.sin(a) * 14, "#e8f4e0");
      [[159, 134, 70], [144, 136, 52], [174, 136, 56]].forEach(([x, b, h]) => { cilindro(k, x, b - h, 3, h, ORO); for (let a = 0; a < 6.28; a += 0.04) { const px = x + 1 + Math.cos(a) * 10, py = b - h - 9 + Math.sin(a) * 10; k.R(px, py, 2, 2, Math.cos(a) < 0 ? ORO[1] : ORO[3]); } sombra(k, x + 2, b + 1, 8, 2); });
      k.linea(226, 40, 248, 34, "#6a4426", 2); [[226, 40], [224, 38], [223, 43]].forEach(([x, y]) => k.linea(x, y, x - 8, y + 3, "#c9a03c")); esfera(k, 92, 44, 3, 3, ["#6a6a78", "#3a3a44", "#26262a"]);
      esfera(k, 118, 160, 3, 3, ["#c0604a", "#8f1d22", "#5a1218"]); [[86, 174], [230, 176]].forEach(([x, y]) => { k.R(x, y, 16, 7, "#7a5230"); k.R(x, y, 16, 1, "#a87444"); });
    }, { tinte: 0.2 }],
    5: ["El Bosque Prohibido", "Árboles retorcidos, niebla y ojos entre las sombras", (k) => {
      k.banda(["#0c1420", "#141f2e", "#1f2e3a"], 0, 152); k.astro(160, 36, 13, "#c8d4c8", "#3f5a5a");
      for (let x = 0; x < 320; x += 16) if (Math.abs(x - 160) > 34) { k.R(x, 44, 7, 110, "#121c26"); }
      k.niebla(60, 130, "#3a5a5a", 0.16);
      for (let x = -8; x < 332; x += 15) if (Math.abs(x - 160) > 36) k.cumulo(x, 22 + (x % 4) * 3, 20, OSCURO);
      const CO = ["#3a2e24", "#25201a", "#17140f", "#0f0c0a"];
      [[12, 28], [70, 22], [128, 30], [202, 24], [262, 30]].forEach(([x, w]) => {
        for (let y = 40; y < 154; y++) { const o = Math.sin(y / 17 + x) * 4, a = w / 2 + (y > 130 ? (y - 130) * 0.7 : 0) + Math.sin(y / 7 + x) * 1.2; for (let px = Math.round(x + w / 2 + o - a); px <= x + w / 2 + o + a; px++) k.P(px, y, rampa(CO, (px - (x + w / 2 + o - a)) / (2 * a) * 0.8 + (Math.sin(px / 2 + y / 13) > 0.7 ? 0.2 : 0), px, y)); }
        k.linea(x + w / 2, 84, x - 22, 56, CO[2], 4); k.linea(x - 22, 56, x - 34, 58, CO[2], 2); k.linea(x + w / 2, 72, x + w + 20, 44, CO[2], 4); k.linea(x + w + 20, 44, x + w + 30, 34, CO[2], 2); k.elipse(x + w / 2, 104, 4, 5, "#0a0806");
      });
      k.suelo(150, "#1f3028", "#17241e", "#2a4034"); k.hierbas(152, 178, 70, ["#2a4034", "#121c18"]); matas(k, 154, 178, 16, ["#16302a", "#20443a", "#2a4034"]);
      [[50, 92], [176, 104], [244, 86], [108, 118], [292, 112]].forEach(([x, y]) => { k.R(x, y, 2, 2, "#d8e86a"); k.R(x + 5, y, 2, 2, "#d8e86a"); });
      [[34, 60], [228, 70]].forEach(([x, y]) => { for (let a = 0; a < 6.28; a += 0.785) k.linea(x, y, x + Math.cos(a) * 14, y + Math.sin(a) * 14, "#8a9a9a"); for (let r = 4; r < 14; r += 4) for (let a = 0; a < 6.28; a += 0.2) k.P(x + Math.cos(a) * r, y + Math.sin(a) * r, "#6a7a7a"); });
      [[64, 166], [196, 170], [264, 162], [130, 174]].forEach(([x, y]) => { k.R(x, y - 4, 2, 4, "#8ac0b0"); k.elipse(x + 1, y - 5, 4, 2, "#5ae8c8"); });
      camino(k, 152, 180, (f) => 160 + Math.sin(f * 3) * 10, (f) => 8 + f * 22, "#1a2620", "#26342c", "#32443a");
      helecho(k, 18, 178, 22, "#20443a", "#16302a"); helecho(k, 304, 178, 24, "#20443a", "#16302a");
      k.niebla(120, 172, "#a8c8c0", 0.13);
    }, { base: "noche", astro: "fijo", tinte: 0.8, fuego: ["#d8e86a", "#5ae8c8"] }],
    6: ["El Callejón Daigon", "La calle de las tiendas, torcidas y apretadas", (k) => {
      k.banda(["#5a6a9a", "#7a8ab0", "#a8b4c8"], 0, 134);
      const NU = ["#d8dee8", "#b8c2d0", "#8a96a8"]; nubarron(k, -16, 6, 110, 8, NU); nubarron(k, 200, 4, 120, 8, NU);
      rellena(k, [[136, 112], [132, 34], [190, 30], [186, 112]], (x, y) => rampa(["#fbf6ea", "#efeade", "#c8c0b0"], ((x - 132) / 58) * 0.9, x, y)); k.poli([[128, 34], [194, 30], [162, 12]], "#efeade"); k.poli([[162, 12], [194, 30], [168, 31]], "#c8c0b0"); for (let x = 140; x < 184; x += 10) k.R(x, 40, 5, 60, "#e4dccc");
      const T = [[0, 52, 92, "#7a4a3a", "#c0392b"], [48, 46, 104, "#4a5a7a", "#c9a03c"], [90, 44, 84, "#6a7a4a", "#2f5fa8"], [186, 44, 88, "#8a6a3a", "#c0392b"], [226, 46, 106, "#4a6a6a", "#c9a03c"], [270, 52, 94, "#8a4a4a", "#2f5fa8"]];
      T.forEach(([x, w, h, c, s], i) => {
        const base = 130, top = base - h, inc = i < 3 ? 6 : -6, cl = (px, py) => (((px + (py >> 3) * 5) % 13 < 1 || py % 8 === 0) ? c : rampa([c, c, "#2a2230"], ((px - x) / w) * 0.5, px, py));
        rellena(k, [[x, base], [x + w, base], [x + w + inc, top], [x + inc, top]], cl);
        k.poli([[x - 4 + inc, top + 1], [x + w + 4 + inc, top + 1], [x + w / 2 + inc * 1.8, top - 18]], "#3a3040"); k.poli([[x + w / 2 + inc * 1.8, top - 18], [x + w + 4 + inc, top + 1], [x + w / 2 + inc, top + 1]], "#2a2230");
        k.R(x + 4, base - 36, w - 8, 25, "#26262a"); k.R(x + 5, base - 35, w - 10, 23, "#ffd27a"); k.R(x + w / 2 - 1, base - 35, 2, 23, "#26262a"); for (let vx = x + 8; vx < x + w - 6; vx += 7) { k.R(vx, base - 18, 4, 6, ["#c0392b", "#2f6fa8", "#3f8a58", "#8f55d8"][(vx + i) % 4]); }
        k.R(x + 2, base - 46, w - 4, 9, s); k.R(x + 2, base - 46, w - 4, 1, "#ffffff30"); for (let vx = x + 7; vx < x + w - 10; vx += 7) k.R(vx, base - 43, 4, 3, "#ffe9a8");
        for (let y = top + 9; y < base - 54; y += 15) for (let v = x + 8; v < x + w - 8; v += 14) { const dx = inc * (base - y) / h; k.R(v + dx, y, 7, 9, "#26262a"); k.R(v + 1 + dx, y + 1, 5, 7, "#ffd27a"); k.R(v + 3 + dx, y + 1, 1, 7, "#26262a"); }
        k.R(x + w * 0.2 + inc * 0.6, top - 16, 6, 16, "#5a4a4a");
      });
      k.R(92, 96, 46, 8, "#2f5fa8"); rotulo(k, 96, 98, "ILLOVANDER", "#ffe9a8"); k.R(188, 88, 42, 8, "#26262a"); rotulo(k, 192, 90, "FLUORISH", "#e8c35a");
      k.suelo(130, "#8a8478", "#76705f", "#a09a8c"); adoquines(k, 130, 180, "#8a8478", "#6a6456", "#9c9688");
      k.alfa(0.32, () => k.R(0, 130, 320, 3, "#2a2420"));
      [[56, 146], [68, 148], [62, 140]].forEach(([x, y]) => { esfera(k, x, y - 5, 7, 6, ["#5a5a64", "#3a3a44", "#26262a"]); k.elipse(x, y - 10, 6, 1, "#6a6a74"); });
      [[248, 138], [262, 140]].forEach(([x, y]) => { k.R(x, y - 12, 10, 12, "#a8842e"); for (let px = x + 1; px < x + 10; px += 3) k.R(px, y - 12, 1, 12, "#6a5a20"); k.elipse(x + 5, y - 12, 5, 2, "#c9a03c"); esfera(k, x + 5, y - 5, 2, 3, ["#f4efe0", "#d8cdb4", "#a89e88"]); });
      caja(k, 90, 150, 14, 11); barril(k, 216, 150, 11, 13); catenaria(k, 96, 72, 226, 76, 8, "#3a3040", (x, y, i) => { if (i % 10 === 2) k.poli([[x - 3, y], [x + 3, y], [x, y + 5]], ["#c0392b", "#c9a03c", "#2f5fa8"][(i >> 1) % 3]); });
    }, { ven: VEN, brillo: 0.78, tinte: 0.3 }],
    7: ["El andén 8½", "El expreso rojo, envuelto en vapor", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#6a7a8a", "#8a98a4", "#b0bac0"], 0, 60);
      k.R(0, 0, 320, 16, "#3a3a44"); for (let x = 0; x < 320; x += 30) { k.linea(x, 16, x + 15, 0, "#26262a", 2); k.linea(x + 30, 16, x + 15, 0, "#26262a", 2); k.R(x, 14, 30, 2, "#54545e"); }
      ladrillos(k, 0, 16, 320, 74, "#a8886a", "#7f6048", "#b89878"); for (let x = 26; x < 320; x += 60) ventanaArco(k, x, 24, 22, 36, "#6a5040", "#d8e0e4");
      k.R(0, 66, 320, 3, "#6a5040");
      k.R(112, 18, 60, 22, "#26262a"); k.R(114, 20, 56, 18, "#3a3a44"); k.R(112, 18, 60, 1, "#c9a03c"); rotulo(k, 118, 24, "8 1/2", "#e8c35a"); k.R(122, 8, 1, 10, "#26262a"); k.R(162, 8, 1, 10, "#26262a");
      k.R(224, 8, 1, 10, "#26262a"); esfera(k, 224, 26, 11, 11, ["#fff8e8", "#f4efe0", "#d8cdb4"]); k.linea(224, 26, 224, 18, "#26262a"); k.linea(224, 26, 224 + Math.cos(((h % 12) / 12) * 6.283 - 1.571) * 6, 26 + Math.sin(((h % 12) / 12) * 6.283 - 1.571) * 6, "#26262a"); for (let a = 0; a < 6.28; a += 0.524) k.P(224 + Math.cos(a) * 9, 26 + Math.sin(a) * 9, "#26262a");
      const RO = ["#d84a3a", "#a8282a", "#8f1d22", "#5a1218"];
      cilindro(k, 0, 74, 222, 68, RO, 0.35); k.R(0, 74, 222, 4, "#e8604a"); k.R(0, 78, 222, 1, "#5a1218"); k.R(0, 112, 222, 3, "#c9a03c"); k.R(0, 128, 222, 1, "#5a1218");
      for (let x = 12; x < 212; x += 34) { k.R(x - 1, 85, 26, 22, "#3a1216"); k.R(x, 86, 24, 20, "#ffe6a8"); k.R(x, 86, 24, 3, "#c8a878"); k.R(x + 11, 86, 2, 20, "#3a1216"); k.R(x + 2, 116, 20, 12, "#7f1a1e"); } rotulo(k, 72, 118, "HAGWORTS EXPRESS", "#e8c35a");
      const NE = ["#5a5a64", "#3a3a44", "#26262a", "#14141a"];
      for (let x = 222; x < 320; x++) for (let y = 62; y < 142; y++) k.P(x, y, rampa(NE, 0.14 + Math.abs((y - 100) / 42) * 0.8, x, y));
      k.R(228, 52, 56, 24, "#8f1d22"); k.R(228, 52, 56, 3, "#c0392b"); k.R(234, 60, 14, 12, "#ffe6a8"); k.R(254, 60, 14, 12, "#ffe6a8"); k.R(224, 50, 64, 3, "#26262a");
      cilindro(k, 296, 38, 13, 26, NE); k.elipse(302, 38, 10, 4, "#3a3a44"); [[240], [262]].forEach(([x]) => { k.R(x, 44, 7, 8, "#c9a03c"); k.elipse(x + 3, 44, 3, 2, "#e8c35a"); });
      k.elipse(276, 108, 19, 19, "#3a3a44"); k.elipse(276, 108, 12, 12, "#c9a03c"); k.elipse(276, 108, 4, 4, "#8a6a24"); for (let a = 0; a < 6.28; a += 0.785) k.linea(276, 108, 276 + Math.cos(a) * 12, 108 + Math.sin(a) * 12, "#8a6a24"); k.R(236, 124, 86, 3, "#c0392b"); k.R(314, 96, 7, 12, "#ffe6a8");
      k.R(0, 142, 320, 6, "#1b1b1f"); [40, 96, 152, 208].forEach((x) => { k.elipse(x, 142, 12, 12, "#3a3a44"); k.elipse(x, 142, 8, 8, "#5a5a64"); k.elipse(x, 142, 3, 3, "#26262a"); }); k.R(30, 140, 190, 2, "#6a6a78");
      k.suelo(150, "#a8a498", "#948f82", "#bcb8ac"); k.R(0, 150, 320, 3, "#e8c35a"); for (let y = 158; y < 180; y += 8) k.R(0, y, 320, 1, "#8a8678");
      k.alfa(0.5, () => { for (let i = 0; i < 22; i++) k.elipse(250 + k.rnd() * 80, 12 + k.rnd() * 56, 10 + k.rnd() * 12, 7 + k.rnd() * 7, "#f0f0ec"); });
      k.alfa(0.34, () => { for (let i = 0; i < 12; i++) k.elipse(k.rnd() * 320, 138 + k.rnd() * 16, 16 + k.rnd() * 18, 4 + k.rnd() * 3, "#f0f0ec"); });
      [[34, 164, "#7a5230"], [52, 170, "#8a3a2a"]].forEach(([x, y, c]) => { k.R(x, y - 10, 22, 10, c); k.R(x, y - 10, 22, 2, "#a87444"); k.R(x + 4, y - 10, 2, 10, "#3a2a20"); k.R(x + 16, y - 10, 2, 10, "#3a2a20"); k.R(x + 10, y - 7, 3, 2, "#e8c35a"); sombra(k, x + 11, y, 14, 2); });
      k.R(262, 150, 12, 14, "#a8842e"); for (let px = 263; px < 274; px += 3) k.R(px, 150, 1, 14, "#6a5a20"); k.elipse(268, 150, 6, 2, "#c9a03c"); esfera(k, 268, 158, 3, 4, ["#ffffff", "#f4efe0", "#d8d0ba"]);
    }, { fuerza: 0.4, fuego: ["#ffe6a8"] }],
    8: ["Previt Drive", "La calle de casas iguales de los Dursley", (k) => {
      k.banda(["#6fb0e0", "#a0cce8", "#dcecf0"], 0, 118);
      nubarron(k, 20, 40, 76, 12); nubarron(k, 206, 32, 88, 14); cirros(k, 4, 2, 20);
      k.suelo(116, "#7fbe5a", "#6cab4c", "#98d470");
      [[6, 0], [84, 1], [162, 2], [240, 3]].forEach(([x, i]) => {
        const w = 74, b = 124, c = ["#c0392b", "#3f6f9a", "#3f8a58", "#c9a03c"][i];
        k.R(x, b - 46, w, 24, "#f2ecdc"); k.R(x, b - 46, 2, 24, "#fff8ea"); k.R(x + w - 3, b - 46, 3, 24, "#ccc2ae"); ladrillos(k, x, b - 22, w, 22, "#b5624a", "#8a4634", "#c8755a");
        k.poli([[x - 5, b - 45], [x + w + 5, b - 45], [x + w - 8, b - 70], [x + 8, b - 70]], "#7a5a4a"); k.poli([[x + w * 0.5, b - 45], [x + w + 5, b - 45], [x + w - 8, b - 70], [x + w * 0.5, b - 70]], "#5e4436"); for (let y = b - 66; y < b - 46; y += 4) k.R(x + 4, y, w - 8, 1, "#5e4436");
        k.R(x + w * 0.74, b - 78, 8, 18, "#8a4634"); k.R(x + w * 0.74 - 1, b - 79, 10, 2, "#6a3424");
        [[x + 8], [x + 44]].forEach(([vx]) => { k.R(vx, b - 42, 22, 15, "#ffffff"); k.R(vx + 1, b - 41, 20, 13, "#a8c8dc"); k.R(vx + 10, b - 41, 2, 13, "#ffffff"); k.R(vx + 1, b - 36, 20, 1, "#ffffff"); k.R(vx - 1, b - 27, 24, 2, "#d4c8b4"); });
        k.R(x + 6, b - 18, 22, 11, "#ffffff"); k.R(x + 7, b - 17, 20, 9, "#a8c8dc"); k.R(x + 16, b - 17, 2, 9, "#ffffff"); k.R(x + 4, b - 7, 26, 2, "#3f8a3a");
        k.R(x + 34, b - 21, 15, 21, "#ffffff"); k.R(x + 36, b - 19, 11, 19, c); k.R(x + 41, b - 16, 1, 16, "#26262a30"); k.P(x + 45, b - 9, "#e8c35a"); k.R(x + 32, b, 19, 2, "#c8c0ac"); k.R(x + 38, b - 15, 7, 4, "#f4efe0");
        k.R(x + 54, b - 16, 18, 16, "#e8e4d8"); for (let y = b - 13; y < b; y += 3) k.R(x + 54, y, 18, 1, "#c8c4b8");
        k.R(x, b, w, 3, "#c8c0ac"); k.R(x + 32, b + 2, 19, 10, "#c8c0ac");
      });
      k.R(0, 136, 320, 44, "#7a7a80"); k.R(0, 132, 320, 4, "#d0d0cc"); k.R(0, 135, 320, 1, "#a8a8a4"); for (let x = 8; x < 320; x += 40) k.R(x, 156, 20, 2, "#e8e8e0");
      for (let y = 138; y < 180; y += 3) for (let x = (y * 7) % 11; x < 320; x += 23) k.P(x, y, "#6e6e74");
      [[78, 130], [156, 130], [234, 130]].forEach(([x, b]) => { k.cumulo(x, b - 9, 8, { tronco: "#5b3a24", copa: "#3f8f45", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" }); k.R(x - 8, b - 6, 18, 6, "#3f8f45"); });
      k.R(30, 118, 3, 14, "#3a3a44"); k.R(26, 112, 12, 8, "#2f5fa8"); rotulo(k, 28, 114, "4", "#ffffff");
      const cx = 256, cy = 152; k.poli([[cx - 30, cy], [cx - 28, cy - 8], [cx - 16, cy - 10], [cx - 8, cy - 18], [cx + 12, cy - 18], [cx + 20, cy - 10], [cx + 30, cy - 8], [cx + 30, cy]], "#2a3a5a"); k.poli([[cx - 6, cy - 16], [cx + 3, cy - 16], [cx + 3, cy - 10], [cx - 12, cy - 10]], "#a8c8dc"); k.poli([[cx + 6, cy - 16], [cx + 11, cy - 16], [cx + 17, cy - 10], [cx + 6, cy - 10]], "#a8c8dc"); [[cx - 18], [cx + 18]].forEach(([x]) => { k.elipse(x, cy, 6, 6, "#1b1b1f"); k.elipse(x, cy, 3, 3, "#a8a8b4"); }); k.R(cx + 28, cy - 6, 3, 3, "#ffe6a8"); k.alfa(0.3, () => k.elipse(cx, cy + 6, 34, 2, "#26262a"));
      flores(k, 126, 132, 40, ["#e8607a", "#f2d24a", "#ffffff"]);
    }, { ven: ["#a8c8dc"], dx: 60 }],
    9: ["La sala común de Gryffondir", "La chimenea, los sillones rojos y las escaleras", (k) => {
      const { h } = Det.cuando(k), f = h >= 3 && h <= 6 ? 0.55 : 1;
      k.R(0, 0, 320, 180, "#6a2a2a"); tablas(k, 0, 0, 320, 124, "#7a2e2e", "#5a2222", "#8a3a36", 26, true);
      k.R(0, 0, 320, 8, "#c9a03c"); k.R(0, 8, 320, 2, "#7a5a22"); k.R(0, 112, 320, 12, "#4a2a1e"); k.R(0, 112, 320, 2, "#7a5230");
      [[18, 44]].forEach(([x, w]) => { k.R(x - 3, 24, w + 6, 66, "#7a5a22"); ventanaArco(k, x, 28, w, 60, "#7a5a22", "#2a3670"); k.R(x + w / 2 - 1, 28, 2, 60, "#7a5a22"); k.R(x, 58, w, 2, "#7a5a22"); k.poli([[x - 6, 22], [x + w + 6, 22], [x + w + 6, 32], [x + w - 6, 58], [x + w * 0.6, 28], [x + w * 0.4, 28], [x + 6, 58], [x - 6, 32]], "#8f1d22"); });
      [[74, 22, 24, 30, "#2f5fa8"], [226, 20, 26, 32, "#6a3f9a"]].forEach(([x, y, w, h, c]) => { k.R(x, y, w, h, "#c9a03c"); k.R(x + 2, y + 2, w - 4, h - 4, "#2a3040"); k.poli([[x + 5, y + h - 2], [x + w / 2, y + h * 0.5], [x + w - 5, y + h - 2]], c); k.elipse(x + w / 2, y + h * 0.4, 4, 4, "#d8b890"); });
      const CH = { base: "#7a788a", luz: "#8e8c9e", osc: "#5a5868" };
      sillares(k, 106, 34, 108, 90, CH, 7, 13); k.R(98, 28, 124, 8, "#8e8c9e"); k.R(98, 28, 124, 1, "#b0aec0"); k.R(102, 36, 116, 2, "#4a4858"); k.elipse(160, 94, 32, 28, "#2a1818"); k.R(128, 94, 64, 30, "#1f1414");
      k.elipse(160, 118, 28, 6, "#e86a2a"); k.llama(146, 120, 1.3 * f); k.llama(172, 120, 1.3 * f); k.llama(160, 120, 1.9 * f);
      [[-6, 6], [6, -6]].forEach(([a, b]) => k.linea(160 + a * 3, 122, 160 + b * 3, 118, "#3a2414", 3));
      brillo(k, 160, 106, 40, 30, "#ff9a3a", 0.6);
      k.poli([[142, 42], [178, 42], [178, 58], [160, 68], [142, 58]], "#c9a03c"); k.poli([[145, 45], [175, 45], [175, 57], [160, 65], [145, 57]], "#8f1d22"); k.elipse(160, 52, 5, 6, "#e8c35a"); k.poli([[156, 48], [164, 48], [160, 44]], "#e8c35a"); k.R(152, 56, 4, 2, "#e8c35a"); k.R(164, 56, 4, 2, "#e8c35a");
      [[126, 28], [190, 28]].forEach(([x]) => { k.R(x, 22, 4, 6, "#f4efe0"); k.P(x + 1, 21, "#ffcf6a"); k.P(x + 2, 20, "#ffe6a8"); });
      cubierta(k, 124, 180, ["#8a5a3a", "#6a4228", "#9a6a46", "#4a2e1a"], 160, 12);
      k.elipse(160, 152, 122, 23, "#8f1d22"); k.elipse(160, 152, 112, 19, "#c9a03c"); k.elipse(160, 152, 108, 17, "#8f1d22"); k.elipse(160, 152, 70, 10, "#a8282a");
      const sillon = (x, y, d) => { const R = ["#d84a3a", "#a02a2a", "#7f1f22", "#5a1418"]; cilindro(k, x, y, 42, 34, R, d > 0 ? 0.3 : 0.7); k.R(x + 4, y + 16, 34, 12, "#c03a3a"); k.R(x + 4, y + 16, 34, 2, "#e0604a"); esfera(k, x - 1, y + 14, 6, 11, R); esfera(k, x + 43, y + 14, 6, 11, R); k.R(x, y + 34, 5, 4, "#3a2414"); k.R(x + 37, y + 34, 5, 4, "#3a2414"); sombra(k, x + 21, y + 38, 26, 2); };
      sillon(38, 108, 1); sillon(238, 108, -1);
      k.R(100, 150, 44, 4, "#7a5230"); k.R(100, 150, 44, 1, "#a87444"); k.R(104, 154, 3, 10, "#4a2e1a"); k.R(137, 154, 3, 10, "#4a2e1a"); k.R(110, 146, 12, 4, "#8f1d22"); k.R(112, 145, 10, 1, "#f4efe0"); k.R(126, 147, 8, 3, "#f4efe0");
      for (let i = 0; i < 7; i++) { k.R(274 + i * 7, 124 - i * 11, 60, 11, i % 2 ? "#6a4a32" : "#7a5a3e"); k.R(274 + i * 7, 124 - i * 11, 60, 1, "#a87e5a"); } k.linea(272, 112, 322, 40, "#3f2616", 2);
    }, { fuerza: 0.25, fuego: ["#e86a2a", "#ffcf6a", "#e8502a", "#ff9a3a", "#ffe06a", "#ffe6a8"], ventanal: "#2a3670" }],
    10: ["La Madriguera", "La casa torcida de los Waesley, entre el campo", (k) => {
      k.banda(["#f2b06a", "#f8d08a", "#fde8b8"], 0, 114);
      const CR = ["#fff4e0", "#fbdcb4", "#f0b88a"]; nubarron(k, -20, 34, 92, 16, CR); nubarron(k, 236, 24, 100, 16, CR);
      loma(k, [[-20, 112], [60, 92], [150, 108], [240, 90], [340, 104]], 120, ["#b8c888", "#a0b070", "#88985c"], 0.2);
      k.suelo(112, "#a0c060", "#88a84e", "#b8d478"); k.hierbas(116, 178, 130, ["#88a84e", "#d8c86a"]); matas(k, 130, 178, 20, ["#7a9a44", "#a0c060", "#c8d478"]);
      const pisos = [[130, 66, 28, -3, "#c98a5a", "#e0a878"], [136, 54, 24, 4, "#b5784a", "#c88e60"], [126, 58, 22, -4, "#d49a6a", "#e8b488"], [138, 44, 20, 3, "#a86a42", "#bc8058"], [130, 32, 18, -2, "#c98a5a", "#dca078"]]; let y = 134;
      pisos.forEach(([x, w, h, inc, c, l], i) => {
        rellena(k, [[x, y], [x + w, y], [x + w + inc, y - h], [x + inc, y - h]], (px, py) => (py % 6 === 0 ? "#7a5230" : px < x + 3 + inc * (y - py) / h ? l : px > x + w - 3 + inc * (y - py) / h ? "#7a5230" : c));
        [[8], [w - 16]].forEach(([d]) => { k.R(x + d - 1 + inc * 0.5, y - h + 5, 9, 10, "#5a3a22"); k.R(x + d + inc * 0.5, y - h + 6, 7, 8, "#ffe6a8"); k.R(x + d + 3 + inc * 0.5, y - h + 6, 1, 8, "#5a3a22"); k.R(x + d + inc * 0.5, y - h + 9, 7, 1, "#5a3a22"); });
        if (i < 3) k.poli([[x - 5 + (i ? 0 : -2), y - h + 2], [x + 2, y - h + 2], [x + 2, y - h - 6]], "#8f3a2a"); y -= h;
      });
      k.R(158, 118, 13, 16, "#6a4426"); k.R(160, 120, 9, 14, "#8a5a32"); k.P(166, 126, "#e8c35a");
      k.poli([[120, y + 1], [176, y + 1], [148, y - 18]], "#8f3a2a"); k.poli([[148, y - 18], [176, y + 1], [152, y + 1]], "#6a2a1e"); for (let f = 4; f < 16; f += 4) k.R(130 + f, y - f + 1, 36 - 2 * f, 1, "#6a2a1e"); k.R(158, y - 18, 6, 18, "#6a5a4a"); k.R(157, y - 19, 8, 2, "#4a3a30"); humo(k, 161, y - 22, "#f4f0e8", 0.5, 6);
      casaTorcida(k, 196, 134, 26, 16, { pared: "#a87444", luz: "#c0895a", osc: "#7a5230", techo: "#7a5a4a", techoLuz: "#94745e", techoOsc: "#5e4436", ventana: false, sombra: "#6a7a3a" });
      [[92], [120]].forEach(([x]) => { k.R(x, 104, 2, 30, "#6a4426"); }); catenaria(k, 92, 106, 120, 106, 3, "#f4efe0", (x, y, i) => { if (i % 7 === 2) k.R(x - 2, y, 5, 7, ["#c0392b", "#2f6fa8", "#c9a03c"][(i >> 2) % 3]); });
      k.R(0, 134, 104, 3, "#7a5a3a"); for (let x = 6; x < 104; x += 16) { k.R(x, 124, 3, 12, "#7a5a3a"); k.P(x + 1, 123, "#a87e5a"); }
      k.arbolote(262, 134, 2.2, { tronco: "#5b3a24", copa: "#5a9a3a", borde: "#3f7a2a", luz: "#8cc060", osc: "#4a8a30" }); k.arbolote(306, 128, 1.6, { tronco: "#5b3a24", copa: "#5a9a3a", borde: "#3f7a2a", luz: "#8cc060", osc: "#4a8a30" });
      camino(k, 134, 180, (f) => 164 - f * 24, (f) => 7 + f * 18, "#b8a870", "#d0c088", "#a8986a");
      [[52, 150], [84, 164], [230, 158]].forEach(([x, y2]) => { k.elipse(x, y2, 7, 6, "#e8862a"); k.elipse(x - 3, y2, 2, 5, "#c96a1a"); k.elipse(x + 3, y2, 2, 5, "#c96a1a"); k.R(x - 1, y2 - 8, 2, 3, "#3f7a2a"); sombra(k, x, y2 + 6, 7, 1); });
      [[110, 150], [212, 172]].forEach(([x, y]) => { k.R(x - 2, y - 6, 5, 6, "#a87e5a"); k.elipse(x, y - 8, 3, 3, "#c8a888"); k.P(x - 3, y - 9, "#c8a888"); k.P(x + 3, y - 9, "#c8a888"); k.R(x - 1, y - 9, 1, 1, "#26262a"); k.R(x + 1, y - 9, 1, 1, "#26262a"); });
      [[250, 152], [272, 160], [40, 170]].forEach(([x, y]) => { k.elipse(x, y, 4, 3, "#f4efe0"); k.elipse(x + 3, y - 3, 2, 2, "#f4efe0"); k.P(x + 5, y - 3, "#e8a82a"); k.R(x, y + 2, 1, 2, "#e8a82a"); k.P(x + 3, y - 5, "#c0392b"); });
    }, { ven: ["#ffe6a8"], tinte: 0.15, dx: 90 }],
    11: ["La cabaña de Higrad", "La casa de piedra junto al bosque, con sus calabazas", (k) => {
      k.banda(["#5a78a8", "#8aa4c0", "#c4d0d0"], 0, 96);
      const NU = ["#f0f4f4", "#d8e0e4", "#b0bcc4"]; nubarron(k, -20, 34, 100, 15, NU); nubarron(k, 232, 28, 100, 16, NU);
      montana(k, 60, 108, 180, 44, { roca: ["#6a8a90", "#567880", "#4a6a70", "#3e5c62"] }); montana(k, 270, 108, 170, 50, { roca: ["#6a8a90", "#567880", "#4a6a70", "#3e5c62"] });
      for (let x = -6; x < 330; x += 13) k.pino(x, 112 + (x % 3), 40, { tronco: "#2a2018", copa: "#1f4a3a", luz: "#2f5f4a", osc: "#163a2c" });
      k.suelo(112, "#7a9a5a", "#68884c", "#92b06c"); k.hierbas(116, 178, 100, ["#68884c", "#a8c078"]); matas(k, 130, 178, 18, ["#567a40", "#7a9a5a", "#a8c078"]);
      const PI = ["#a39888", "#8d8478", "#7d7468", "#68605a", "#57504a"];
      bola(k, 150, 118, 48, 40, (x, y) => (y > 134 ? "#7a9a5a" : (Math.round(y) % 6 === 0 || (Math.round(x) + (Math.round(y / 6) % 2) * 5) % 11 === 0) ? PI[4] : rampa(PI, 0.1 + ((x - 150) / 48) * 0.5 + 0.3 + (((x * 7 + y * 3) % 17) / 40), x, y)));
      rellena(k, [[92, 100], [120, 76], [150, 56], [180, 76], [208, 100], [186, 104], [150, 106], [114, 104]], (x, y) => (((x * 3 + y * 5) % 9 < 2) ? "#6d5e36" : rampa(["#b8a860", "#a8985a", "#8a7a4a", "#6d5e36"], 0.2 + ((x - 92) / 116) * 0.5 + ((y - 56) / 50) * 0.2, x, y)));
      cilindro(k, 172, 56, 11, 30, PI); k.R(171, 55, 13, 2, PI[4]); humo(k, 177, 50, "#e8e8e0", 0.5, 6);
      k.elipse(150, 112, 13, 14, "#3f2616"); k.R(137, 112, 26, 22, "#3f2616"); k.elipse(150, 112, 11, 12, "#6a4426"); k.R(139, 112, 22, 22, "#6a4426"); for (let x = 141; x < 160; x += 5) k.R(x, 102, 1, 32, "#3f2616"); k.R(155, 120, 3, 3, "#8a8a94"); [[114, 110], [176, 110]].forEach(([x, y]) => { k.R(x - 1, y - 1, 16, 14, PI[4]); k.R(x, y, 14, 12, "#ffd27a"); k.R(x + 7, y, 1, 12, PI[4]); k.R(x, y + 5, 14, 1, PI[4]); });
      k.R(128, 134, 44, 3, "#a39888"); sombra(k, 150, 137, 54, 3);
      const cal = (x, y, r) => { esfera(k, x, y, r, r - 2, ["#ffa84a", "#e8862a", "#c0601a"]); for (let d = -2; d <= 2; d++) if (d) k.linea(x + d * r * 0.3, y - r + 3, x + d * r * 0.42, y + r - 3, "#c0601a"); k.R(x - 1, y - r - 1, 2, 4, "#3f7a2a"); k.linea(x, y - r, x + 5, y - r - 2, "#5a9a3a"); sombra(k, x, y + r - 1, r, 2); };
      [[44, 148, 10], [70, 162, 13], [226, 152, 11], [258, 166, 14], [96, 170, 9], [24, 170, 8], [284, 150, 9]].forEach(([x, y, r]) => cal(x, y, r));
      for (let i = 0; i < 6; i++) k.linea(30 + i * 42, 146 + (i % 3) * 8, 42 + i * 42, 152 + (i % 2) * 8, "#4f8a3a");
      [[188, 140], [204, 140]].forEach(([x, b]) => { k.R(x - 5, b - 8, 8, 8, "#5a3a22"); k.R(x - 8, b - 3, 12, 4, "#4a2e18"); });
      k.linea(240, 128, 270, 128, "#6a4426", 2); k.linea(255, 118, 255, 138, "#6a4426", 2); k.linea(240, 128, 255, 118, "#c8bea8"); k.linea(240, 128, 255, 138, "#c8bea8");
    }, { ven: VEN, tinte: 0.1 }],
    12: ["La Cámara de los Secretos", "La gran sala de piedra, con la cara de Slythiren, sus serpientes y el agua", (k) => {
      k.banda(["#0f1e1c", "#16302a", "#1f4238"], 0, 140);
      for (let y = 0; y < 140; y += 12) { k.R(0, y, 320, 1, "#0c1a18"); for (let x = (y % 24 ? 14 : 2); x < 320; x += 26) k.R(x, y, 1, 12, "#0c1a18"); }
      const CA = ["#6a8e7e", "#4a6e60", "#3a5e50", "#2a4a40", "#1f352f"];
      rellena(k, [[116, 140], [114, 60], [130, 20], [190, 20], [206, 60], [204, 140]], (x, y) => rampa(CA, 0.3 + ((x - 114) / 92) * 0.5, x, y));
      bola(k, 160, 44, 28, 30, (x, y) => rampa(CA, 0.08 + ((x - 160) / 28) * 0.34 + ((y - 44) / 30) * 0.2 + 0.1, x, y));
      k.R(144, 38, 13, 6, "#0a1412"); k.R(163, 38, 13, 6, "#0a1412"); k.R(146, 40, 2, 2, "#c8e86a"); k.R(172, 40, 2, 2, "#c8e86a"); k.R(158, 44, 5, 13, CA[3]); k.R(142, 32, 14, 3, CA[4]); k.R(164, 32, 14, 3, CA[4]); k.R(151, 56, 18, 2, CA[4]);
      k.poli([[132, 62], [188, 62], [180, 124], [160, 140], [140, 124]], CA[1]); for (let x = 138; x < 184; x += 5) k.linea(x, 64, 160 + (x - 160) * 0.5, 132, CA[3]); k.poli([[132, 62], [146, 62], [150, 128], [140, 124]], CA[0]);
      k.elipse(160, 74, 13, 9, "#0a1412"); k.elipse(160, 74, 11, 7, "#060c0a"); for (let i = -2; i <= 2; i++) k.R(158 + i * 5, 66, 3, 3, CA[1]);
      const CO = ["#54786a", "#3f5e54", "#2f4a42", "#1f352f"];
      [[12, 44], [68, 36], [216, 36], [268, 44]].forEach(([x, w]) => {
        cilindro(k, x, 0, w, 140, CO, 0.3); k.R(x - 3, 130, w + 6, 10, CO[2]); k.R(x - 3, 130, w + 6, 1, CO[0]);
        for (let t = 0; t < 130; t += 0.5) { const u = (Math.sin(t / 7) + 1) / 2, px = x + u * (w - 5), py = t; k.R(px, py, 5, 3, Math.cos(t / 7) > 0 ? "#3a7a5a" : "#254a3c"); }
        k.poli([[x + w / 2, 28], [x + w - 2, 42], [x + w / 2, 58], [x + 2, 42]], "#3a5e50"); k.R(x + w / 2 - 7, 40, 4, 3, "#c8e86a"); k.R(x + w / 2 + 3, 40, 4, 3, "#c8e86a"); k.R(x + w / 2 - 1, 52, 2, 8, "#c0392b");
      });
      k.agua(138, 180, ["#1f4a42", "#16382f", "#102a24"], "#5a9a80", 120);
      rellena(k, [[22, 182], [298, 182], [206, 138], [114, 138]], (x, y) => { const f = (y - 138) / 44, u = (x - 160) / (46 + f * 92); return (Math.round(u * 5) !== Math.round((x + 1 - 160) / (46 + f * 92) * 5) || Math.floor(f * f * 7) !== Math.floor(((y + 1 - 138) / 44) ** 2 * 7)) ? "#2a4a40" : rampa(["#54786a", "#3f5e54", "#35524a"], Math.abs(u) * 1, x, y); });
      [[120, 158, 20, 3], [204, 170, 26, 3]].forEach(([x, y, a, b]) => k.elipse(x, y, a, b, "#1f4a42"));
      k.linea(74, 176, 92, 170, "#d8d0b8", 2); k.elipse(74, 176, 3, 2, "#d8d0b8"); [[226, 160], [236, 164]].forEach(([x, y]) => k.linea(x, y, x + 10, y + 2, "#d8d0b8", 2)); esfera(k, 216, 172, 4, 4, ["#f4efe0", "#d8d0b8", "#a8a088"]); k.P(214, 171, "#26262a"); k.P(217, 171, "#26262a");
      k.niebla(120, 150, "#7fc0a0", 0.12);
    }, { cielo: "propio", fuerza: 0.1, fuego: ["#c8e86a"] }],
    13: ["La batalla de Hagworts", "El castillo asediado, entre llamas, humo y hechizos", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#2e2a3e", "#4a3844", "#74463c", "#a85c34", "#d08a44"], 0, 126);
      if (h === 23) { k.halo(292, 60, 70, 50, "#ffe6a8", 0.5); k.elipse(292, 60, 15, 15, "#ffe6a8"); k.elipse(292, 60, 12, 12, "#fff4d0"); }
      const HU = ["#5a4a50", "#3a3238", "#2a2630"];
      nubarron(k, -24, 22, 130, 16, HU); nubarron(k, 190, 16, 150, 18, HU); nubarron(k, 86, 34, 120, 12, HU);
      for (let a = 0.35; a < 2.8; a += 0.006) { if (Math.sin(a * 37) > 0.55) continue; const x = 160 + Math.cos(a) * 158, y = 126 - Math.sin(a) * 116; k.alfa(0.6, () => k.R(x, y, 2, 1, "#9ad8ff")); }
      montana(k, 40, 126, 190, 40, { roca: ["#2a2838", "#1f1e2c", "#1c1a28", "#14121e"] }); montana(k, 280, 126, 190, 44, { roca: ["#2a2838", "#1f1e2c", "#1c1a28", "#14121e"] });
      castillo(k, 126, { piedra: ["#6a6a7e", "#4a4a5e", "#3e3e52", "#34344a", "#26263a"], techo: ["#3a3e5a", "#262a4a", "#1a1e38"], ven: "#ffb04a" });
      [[92, 22], [152, 26], [222, 18]].forEach(([x, w]) => k.poli([[x - w, 30], [x + w, 30], [x + w * 0.5, 54], [x + 2, 40], [x - w * 0.4, 58]], "#5a3a34"));
      [[76, 64], [146, 36], [176, 60], [246, 72], [116, 92], [216, 100]].forEach(([x, y], i) => { k.alfa(0.55, () => { for (let j = 0; j < 7; j++) k.elipse(x + j * (i % 2 ? 3 : -3) + k.rnd() * 4, y - 16 - j * 11, 7 + j * 2.4, 5 + j * 1.6, "#34303a"); }); if (h < 23 || i === 3) k.llama(x, y, h < 23 ? 0.9 + (i % 3) * 0.2 : 0.5); });
      k.suelo(126, "#4a4a4a", "#3a3a3c", "#5e5a58"); k.hierbas(130, 178, 50, ["#2f2f30", "#6e6a64"]);
      [[12, 150, 44, 22], [70, 170, 36, 15], [246, 160, 46, 24], [150, 176, 30, 10], [292, 178, 38, 18], [96, 142, 22, 10], [204, 142, 24, 11]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#7a7a80", "#5a5a60", "#46464c", "#34343a"]));
      k.elipse(186, 168, 40, 6, "#34343a"); k.elipse(186, 169, 34, 4, "#26262c");
      [[120, 158], [216, 150]].forEach(([x, b]) => { k.linea(x, b, x + 22, b - 8, "#8a8a94", 5); k.elipse(x + 24, b - 9, 5, 5, "#9a9aa4"); });
      if (h < 23) [[40, 142], [228, 138], [292, 146], [136, 150]].forEach(([x, y]) => k.llama(x, y, 0.8));
      for (let i = 0; i < 40; i++) k.P(k.rnd() * 320, 36 + k.rnd() * 130, "#ffb04a");
      for (let i = 0; i < (h < 23 ? 6 : 0); i++) { const x = 30 + k.rnd() * 260, y = 30 + k.rnd() * 60, d = i % 2 ? "#3fe87a" : "#e83a3a"; k.linea(x, y, x + 12, y + 7, d); }
    }, { cielo: "propio", fuerza: 0.7, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a", "#3fe87a", "#a8ffc8", "#d8ffe4", "#e83a3a", "#ffb0a0", "#ffe0d8", "#6ac8ff", "#9ad8ff", "#fff4d0", "#ffe6a8"] }],
    14: ["La noche de Previt Drive", "La noche en que dejan a Antonio bebé en la puerta de los Dursley", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#6fb0e0", "#a0cce8", "#dcecf0"], 0, 118);
      nubarron(k, -20, 44, 86, 10); nubarron(k, 250, 36, 90, 12);
      k.suelo(116, "#7fbe5a", "#6cab4c", "#98d470");
      const casa = (x, b, w, h) => { k.R(x, b - h, w, h * 0.5, "#f0ead8"); ladrillos(k, x, b - h * 0.5, w, h * 0.5, "#a85a44", "#7f4232", "#bc6e54"); k.poli([[x - 6, b - h + 1], [x + w + 6, b - h + 1], [x + w - 10, b - h - w * 0.36], [x + 10, b - h - w * 0.36]], "#6a4e42"); k.poli([[x + w / 2, b - h + 1], [x + w + 6, b - h + 1], [x + w - 10, b - h - w * 0.36], [x + w / 2, b - h - w * 0.36]], "#52392e"); };
      casa(-34, 118, 64, 40); casa(212, 118, 64, 40); casa(276, 118, 64, 40);
      [[6, 90], [232, 90], [292, 90]].forEach(([x, y]) => { k.R(x, y, 14, 12, "#ffffff"); k.R(x + 1, y + 1, 12, 10, "#a8c8dc"); k.R(x + 6, y + 1, 1, 10, "#ffffff"); });
      casa(92, 124, 112, 62);
      [[102, 70], [172, 70], [102, 100], [172, 100]].forEach(([x, y]) => { k.R(x, y, 20, 15, "#ffffff"); k.R(x + 1, y + 1, 18, 13, "#a8c8dc"); k.R(x + 9, y + 1, 2, 13, "#ffffff"); k.R(x + 1, y + 7, 18, 1, "#ffffff"); k.R(x - 1, y + 15, 22, 2, "#d4c8b4"); });
      k.R(138, 92, 22, 32, "#ffffff"); k.R(140, 94, 18, 30, "#5a3a2a"); k.R(142, 96, 14, 28, "#6a4632"); k.R(145, 99, 8, 5, "#c0ccd4"); k.R(153, 110, 2, 2, "#e8c35a"); k.R(146, 86, 8, 6, "#e8e0cc"); rotulo(k, 148, 87, "4", "#26262a");
      k.R(134, 124, 30, 3, "#b8b0a0"); k.R(134, 124, 30, 1, "#d0c8b8"); k.R(130, 127, 38, 3, "#a8a090"); k.R(130, 127, 38, 1, "#c0b8a8");
      k.R(0, 126, 136, 4, "#b89a78"); k.R(162, 126, 158, 4, "#b89a78"); k.R(0, 126, 136, 1, "#d0b290"); k.R(162, 126, 158, 1, "#d0b290"); for (let x = 0; x < 320; x += 8) if (x < 130 || x > 162) k.R(x, 126, 1, 4, "#967a5c");
      [[0, 122], [174, 122]].forEach(([x], i) => { for (let px = x + (i ? 40 : 6); px < (i ? 310 : 120); px += 11) k.cumulo(px, 120, 5, { tronco: "#5b3a24", copa: "#3f8f45", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" }); });
      k.R(0, 136, 320, 44, "#6e6e74"); k.R(0, 132, 320, 4, "#c8c8c4"); k.R(0, 135, 320, 1, "#a0a09c"); for (let x = 8; x < 320; x += 40) k.R(x, 158, 20, 2, "#e0e0d8"); for (let y = 138; y < 180; y += 3) for (let x = (y * 7) % 11; x < 320; x += 23) k.P(x, y, "#62626a");
      [[64, 132], [250, 132]].forEach(([x, b], i) => { const apagada = h >= 2 + i && h <= 5; k.R(x, b - 36, 2, 36, "#2a2a30"); k.R(x - 3, b - 39, 8, 3, "#2a2a30"); k.R(x - 2, b - 36, 6, 4, apagada ? "#3a3a44" : "#ffe6a8"); k.R(x - 1, b - 2, 4, 2, "#2a2a30"); if (!apagada && k.luz && k.luz.lit > 0) { k.alfa(0.14, () => k.elipse(x + 1, b - 30, 18, 16, "#ffe6a8")); k.alfa(0.1, () => k.poli([[x - 2, b - 32], [x + 4, b - 32], [x + 22, b + 8], [x - 20, b + 8]], "#ffe6a8")); } });
      [[118, 44], [176, 42], [270, 62]].forEach(([x, y]) => { esfera(k, x, y, 3, 4, ["#c8b8a0", "#a89880", "#786858"]); k.P(x - 1, y - 2, "#ffe6a8"); k.P(x + 1, y - 2, "#ffe6a8"); });
      const X = 222, Y = 168;
      [[X], [X + 40]].forEach(([x]) => { k.elipse(x, Y, 9, 9, "#26262a"); k.elipse(x, Y, 5, 5, "#3a3a44"); k.elipse(x, Y, 4, 4, "#9a9aa4"); for (let a = 0; a < 6.28; a += 0.785) k.linea(x, Y, x + Math.cos(a) * 4, Y + Math.sin(a) * 4, "#5a5a64"); });
      k.poli([[X + 2, Y - 8], [X + 30, Y - 12], [X + 42, Y - 2], [X + 36, Y + 1], [X + 12, Y + 2]], "#3a3a44"); k.poli([[X + 2, Y - 8], [X + 30, Y - 12], [X + 32, Y - 9], [X + 6, Y - 5]], "#5a5a64"); k.R(X + 10, Y - 14, 18, 5, "#26262a"); k.R(X + 8, Y - 10, 24, 2, "#6a2a2a");
      k.linea(X + 36, Y - 4, X + 44, Y - 22, "#9a9aa4", 2); k.linea(X + 44, Y - 22, X + 50, Y - 24, "#26262a", 2); k.elipse(X + 46, Y - 16, 3, 3, "#ffe6a8"); k.R(X + 2, Y - 3, 12, 2, "#9a9aa4"); k.elipse(X - 4, Y - 6, 10, 6, "#5a2a2a"); k.elipse(X - 5, Y - 7, 7, 3, "#7a3a3a");
    }, { ven: ["#a8c8dc", "#ffe6a8"], tinte: 0.2 }],
    15: ["El ajedrez gigante", "El tablero de piedra bajo la trampilla, con sus piezas enormes", (k) => {
      k.banda(["#15131d", "#1f1b29", "#2b2536"], 0, 100);
      for (let y = 4, f = 0; y < 100; y += 13, f++) { k.R(0, y, 320, 1, "#0e0d14"); for (let x = (f % 2 ? 8 : 24); x < 320; x += 32) { k.R(x, y, 1, 13, "#0e0d14"); if ((x + y) % 3 === 0) k.R(x + 1, y + 1, 30, 12, "#26212f"); } }
      k.alfa(0.1, () => k.poli([[146, 0], [174, 0], [230, 100], [90, 100]], "#d8d0ff"));
      [[26, 50], [294, 50], [100, 44], [220, 44]].forEach(([x, y]) => { k.halo(x, y - 6, 22, 22, "#ff9a3a", 0.3); k.R(x - 1, y, 3, 13, "#5a3a22"); k.R(x - 3, y - 1, 7, 2, "#7a6a4a"); k.llama(x, y, 0.5); });
      const fila = (f) => 100 + 80 * Math.pow(f, 1.5), col = (c, f) => 160 + c * (32 + 58 * f);
      for (let r = 0; r < 8; r++) for (let c = -7; c < 7; c++) { const a = r / 8, b = (r + 1) / 8, cl = (r + c + 64) % 2; rellena(k, [[col(c, a), fila(a)], [col(c + 1, a), fila(a)], [col(c + 1, b), fila(b)], [col(c, b), fila(b)]], (x, y) => (cl ? (((x * 3 + y * 7) % 23 < 1) ? "#c0baac" : "#d8d2c4") : (((x * 3 + y * 7) % 23 < 1) ? "#4a4652" : "#3a3642"))); }
      k.R(0, 99, 320, 2, "#0e0d14");
      const pieza = (x, b, t, e, C) => {
        const c = C[1], l = C[0], o = C[3];
        sombra(k, x, b + 1, 15 * e, 3 * e);
        rellena(k, [[x - 13 * e, b], [x + 13 * e, b], [x + 9 * e, b - 8 * e], [x - 9 * e, b - 8 * e]], (px, py) => rampa(C, ((px - x + 13 * e) / (26 * e)) * 0.9, px, py));
        cilindro(k, x - 6 * e, b - 34 * e, 12 * e, 27 * e, C, 0.3); k.R(x - 9 * e, b - 37 * e, 18 * e, 3 * e, l); k.R(x - 9 * e, b - 34 * e, 18 * e, 1, o);
        if (t === "torre") { cilindro(k, x - 9 * e, b - 52 * e, 18 * e, 15 * e, C, 0.3); [-9, -3, 4].forEach((d) => k.R(x + d * e, b - 58 * e, 5 * e, 6 * e, c)); }
        if (t === "reina") { esfera(k, x, b - 44 * e, 8 * e, 9 * e, C); [-8, -4, 0, 4, 8].forEach((d) => k.poli([[x + (d - 2) * e, b - 50 * e], [x + (d + 2) * e, b - 50 * e], [x + d * 1.2 * e, b - 62 * e]], c)); }
        if (t === "rey") { esfera(k, x, b - 44 * e, 8 * e, 9 * e, C); k.R(x - 1 * e, b - 66 * e, 3 * e, 14 * e, c); k.R(x - 5 * e, b - 62 * e, 11 * e, 3 * e, c); }
        if (t === "alfil") { esfera(k, x, b - 46 * e, 7 * e, 11 * e, C); esfera(k, x, b - 59 * e, 2 * e, 2 * e, C); k.linea(x + 1 * e, b - 52 * e, x + 5 * e, b - 44 * e, o); }
        if (t === "caballo") { rellena(k, [[x - 8 * e, b - 36 * e], [x - 6 * e, b - 50 * e], [x + 2 * e, b - 58 * e], [x + 5 * e, b - 64 * e], [x + 7 * e, b - 56 * e], [x + 15 * e, b - 46 * e], [x + 12 * e, b - 41 * e], [x + 3 * e, b - 44 * e], [x + 7 * e, b - 36 * e]], (px, py) => rampa(C, ((px - x + 8 * e) / (23 * e)) * 0.8, px, py)); k.R(x + 4 * e, b - 54 * e, 2 * e, 2 * e, o); }
      };
      const NE = ["#6e6c78", "#4a4852", "#3a3842", "#26242c"], BL = ["#ffffff", "#efeade", "#c8c2b4", "#9a9486"];
      ["torre", "caballo", "alfil", "reina", "rey", "alfil", "caballo", "torre"].forEach((t, i) => pieza(20 + i * 40, 112, t, 1, NE));
      pieza(34, 172, "caballo", 1.25, BL); pieza(290, 174, "torre", 1.25, BL);
      k.roca(52, 130, 18, 7, "#4a4852", "#6e6c78", "#34323a"); k.roca(256, 136, 22, 8, "#efeade", "#ffffff", "#c8c2b4"); k.roca(216, 160, 24, 9, "#efeade", "#ffffff", "#c8c2b4");
    }, { cielo: "propio", fuerza: 0.08, fuego: ["#ff9a3a", "#ffe06a", "#e8502a"] }],
    16: ["El Sauce Boxeador", "El árbol furioso, con el coche volador de los Waesley entre sus ramas", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#5fa8e0", "#8cc6ea", "#d4e6ee"], 0, 112);
      nubarron(k, 20, 34, 80, 12); nubarron(k, 240, 22, 80, 12); cirros(k, 4, 4, 20);
      montana(k, 60, 114, 180, 34, { roca: ["#9ab4c8", "#7f9ab0", "#6e8aa0", "#5e7a90"] }); montana(k, 250, 114, 200, 30, { roca: ["#9ab4c8", "#7f9ab0", "#6e8aa0", "#5e7a90"] });
      const g = { piedra: ["#9a9cb0", "#7a7c90", "#6a6c80", "#5e6072"], techo: ["#5a6490", "#3f4570", "#2f3458"], ventanas: null };
      [[14, 10, 26, 12], [28, 12, 38, 14], [44, 9, 22, 10], [56, 13, 34, 14], [72, 10, 24, 10]].forEach(([x, w, h, a]) => torreta(k, x, 112, w, h, a, g)); k.R(14, 102, 68, 10, "#7a7c90"); almenas(k, 14, 102, 68, "#7a7c90", 6, 3, 2);
      k.suelo(110, "#6fb05a", "#5c9c4c", "#8ccc70"); k.hierbas(114, 178, 110); matas(k, 124, 178, 18); flores(k, 120, 178, 24, ["#ffffff", "#f2d24a"]);
      const CO = ["#9a7a5a", "#77593f", "#5a4230", "#46331f", "#33241a"], V = { tronco: "#5b3a24", copa: "#5a9a4a", borde: "#3f7a3a", luz: "#86c070", osc: "#4a8a3e" };
      k.elipse(186, 150, 66, 9, "#4f8f44");
      const rama = (x0, y0, x1, y1, x2, y2, g2 = 5) => { k.linea(x0, y0, x1, y1, CO[3], g2); k.linea(x0, y0 - 1, x1, y1 - 1, CO[1], 1); k.linea(x1, y1, x2, y2, CO[3], Math.max(2, g2 - 2)); k.cumulo(x2, y2, 7, V); k.cumulo((x1 + x2) / 2, (y1 + y2) / 2 - 2, 5, V); };
      rama(178, 78, 132, 44, 92, 62); rama(182, 74, 150, 24, 110, 12); rama(190, 70, 196, 20, 226, 6); rama(170, 86, 126, 92, 96, 116);
      rellena(k, [[160, 152], [174, 108], [166, 80], [188, 62], [212, 78], [204, 108], [220, 152]], (x, y) => rampa(CO, 0.1 + ((x - 160) / 60) * 0.8 + (Math.sin(x / 2.1 + Math.sin(y / 11) * 2.4) > 0.5 ? 0.2 : 0), x, y));
      k.elipse(190, 104, 6, 8, CO[4]); k.elipse(190, 104, 3, 5, "#1f140c");
      [[164, 148, 138, 160], [216, 148, 244, 160], [178, 148, 162, 164], [204, 148, 220, 166], [190, 150, 192, 170]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, CO[3], 4); k.linea(a, b - 1, c, d - 1, CO[1]); });
      if (h >= 11) { k.poli([[226, 80], [284, 66], [292, 80], [236, 94]], "#6fc8c4"); k.poli([[226, 80], [284, 66], [286, 70], [228, 84]], "#a8e4de"); k.poli([[234, 94], [292, 80], [292, 84], [236, 98]], "#3f8a88");
      k.poli([[240, 76], [248, 60], [270, 55], [278, 68]], "#f4f1e8"); k.poli([[244, 75], [250, 63], [259, 61], [258, 72]], "#bfe6f0"); k.poli([[261, 71], [262, 60], [269, 58], [274, 68]], "#bfe6f0");
      [[243, 93], [280, 84]].forEach(([x, y]) => { k.elipse(x, y, 7, 7, "#26262a"); k.elipse(x, y, 3, 3, "#c8c8d0"); }); k.R(287, 71, 6, 5, "#ffe6a8"); k.R(226, 84, 4, 4, "#e8402a"); k.linea(232, 96, 300, 80, "#c8c8d0"); }
      rama(200, 72, 240, 50, 304, 40, 6); rama(206, 82, 244, 106, 300, 106, 5);
    }, { tinte: 0.2, dx: -60 }],
    17: ["El Autobús Noctámbulo", "El autobús morado de tres pisos, que frena de golpe en plena noche", (k) => {
      k.banda(["#2f4f80", "#5a7aa8", "#a0b8cc"], 0, 128);
      const c = (pared, t) => ({ pared, viga: "#4a3a32", techo: t, techoO: "#3a2e2e", ven: "#a8c8dc", puerta: "#4a3a32" });
      casaT(k, -14, 126, 60, 40, c("#b8a890", "#5a4a4a")); casaT(k, 44, 126, 44, 36, c("#a89880", "#6a5a4a")); casaT(k, 232, 126, 42, 38, c("#b8a890", "#5a4a4a")); casaT(k, 274, 126, 60, 42, c("#a89880", "#6a5a4a"));
      k.R(0, 124, 320, 10, "#a8a89c"); k.R(0, 124, 320, 1, "#c8c8bc"); k.R(0, 133, 320, 2, "#86867c"); k.R(0, 135, 320, 45, "#55555e"); for (let x = 6; x < 320; x += 42) k.R(x, 166, 22, 2, "#d8d8d0"); for (let y = 137; y < 180; y += 3) for (let x = (y * 7) % 11; x < 320; x += 23) k.P(x, y, "#4a4a52");
      [[34, 128], [288, 128]].forEach(([x, b]) => { k.R(x, b - 30, 2, 30, "#26262a"); k.R(x - 3, b - 35, 8, 6, "#ffe6a8"); k.R(x - 4, b - 36, 10, 1, "#26262a"); brillo(k, x + 1, b - 32, 18, 16, "#ffe6a8", 0.6); });
      const x0 = 84, x1 = 254, M = ["#a878e8", "#8f55d8", "#6a2fb0", "#4f2288", "#3a1a66"];
      k.R(x0 + 40, 50, 90, 9, "#26262a"); k.R(x0 + 44, 52, 82, 5, "#e8c84a"); rotulo(k, x0 + 54, 53, "NIGHT BUS", "#26262a");
      for (let x = x0; x < x1; x++) for (let y = 58; y < 148; y++) k.P(x, y, rampa(M, 0.2 + ((x - x0) / (x1 - x0)) * 0.3 + (y / 400), x, y));
      k.R(x0, 58, x1 - x0, 3, "#a878e8"); k.R(x1 - 7, 58, 7, 90, "#4f2288");
      [65, 92, 119].forEach((y, f) => { for (let x = x0 + 24; x < x1 - 20; x += 23) { k.R(x - 1, y - 1, 19, 17, "#3a1a66"); k.R(x, y, 17, 15, "#ffd27a"); k.R(x + 2, y + 9, 13, 3, "#c84a4a"); k.R(x + 2, y + 8, 4, 2, "#f4efe0"); k.R(x + 8, y, 1, 15, "#3a1a66"); } k.R(x0, y + 19, x1 - x0, 2, "#e8c84a"); });
      k.R(x0 + 4, 119, 14, 15, "#bfe0ea"); k.R(x0 + 4, 92, 14, 15, "#ffd27a"); k.R(x0 + 4, 65, 14, 15, "#ffd27a"); k.R(x0 + 2, 134, 18, 14, "#3a1a66");
      k.R(x0 - 3, 138, x1 - x0 + 6, 12, "#3a1a66"); k.R(x0 - 3, 138, x1 - x0 + 6, 1, "#6a2fb0");
      [[x0 + 30, 148], [x1 - 36, 148]].forEach(([x, y]) => { k.elipse(x, y, 12, 12, "#1b1b1f"); k.elipse(x, y, 6, 6, "#a8a8b4"); k.elipse(x, y, 2, 2, "#26262a"); for (let a = 0; a < 6.28; a += 1.05) k.linea(x, y, x + Math.cos(a) * 5, y + Math.sin(a) * 5, "#6a6a78"); });
      k.alfa(0.25, () => k.elipse(170, 160, 92, 4, "#14141a"));
      if (k.luz && k.luz.lit > 0.3) k.alfa(0.22, () => k.poli([[x0, 137], [x0, 146], [0, 178], [0, 150]], "#ffe6a8")); k.elipse(x0, 141, 4, 4, "#ffe6a8");
      for (let i = 0; i < 4; i++) { k.R(x1 + 6 + i * 8, 158 + i, 6, 1, "#8a8a94"); } humo(k, x1 + 6, 142, "#a8a8b0", 0.4, 5);
    }, { ven: ["#ffd27a", "#a8c8dc"], fuerza: 0.72, fuego: ["#ffe6a8"] }],
    18: ["La Casa de los Gritos", "La casa más encantada de Gran Bretaña, tapiada y torcida en lo alto de la colina", (k) => {
      k.banda(["#5a6a9a", "#8a98b8", "#c8ccd0"], 0, 116);
      const NU = ["#e8ecf0", "#c8d0da", "#98a4b4"]; nubarron(k, -20, 40, 96, 16, NU); nubarron(k, 240, 34, 96, 16, NU);
      montana(k, 50, 118, 170, 34, { roca: ["#8a9aa8", "#6a7a8a", "#5a6a7a", "#4e5e6e"] }); montana(k, 270, 118, 170, 38, { roca: ["#8a9aa8", "#6a7a8a", "#5a6a7a", "#4e5e6e"] });
      loma(k, [[10, 150], [106, 98], [226, 94], [320, 150]], 150, ["#a0a884", "#8a9470", "#7f8a6a", "#6a7458"], 0.3);
      for (let i = 0; i < 14; i++) k.elipse(70 + k.rnd() * 190, 112 + k.rnd() * 30, 8 + k.rnd() * 14, 2 + k.rnd() * 2, "#e8eef4");
      const P = "#5e4c40", O = "#3f332c", T = "#2f2a30", L = "#a8987a", N = "#1f1a1c";
      rellena(k, [[92, 104], [134, 100], [132, 62], [94, 66]], (x, y) => (y % 5 === 0 ? "#2a2220" : O)); k.poli([[86, 68], [138, 62], [124, 44], [100, 48]], T); k.R(104, 76, 14, 12, N); k.linea(104, 79, 118, 84, L, 2);
      rellena(k, [[124, 102], [222, 96], [216, 42], [130, 48]], (x, y) => (((y + (x - 124) * 0.06) | 0) % 6 === 0 ? O : (x * 7 + y * 3) % 41 < 1 ? "#6e5a4c" : P));
      for (let x = 136; x < 216; x += 22) k.linea(x, 100, x - 2, 46, O);
      rellena(k, [[118, 50], [226, 42], [204, 14], [142, 20]], (x, y) => ((x * 3 + y * 5) % 29 < 2 ? "#443c44" : (x > 176 ? "#26222a" : T))); k.poli([[118, 50], [142, 20], [150, 20], [134, 49]], "#443c44"); k.poli([[160, 30], [176, 28], [172, 38]], N); for (let i = 0; i < 6; i++) k.linea(160 + i * 3, 30, 158 + i * 3, 38, "#3a2c28");
      k.poli([[190, 20], [202, 18], [208, -2], [196, 0]], "#4a3a34"); k.R(194, -2, 16, 3, "#3a2c28");
      [[140, 56], [176, 54], [142, 78], [196, 72]].forEach(([x, y]) => { k.R(x, y, 18, 14, N); k.linea(x - 1, y + 3, x + 19, y + 6, L, 2); k.linea(x - 1, y + 10, x + 19, y + 7, L, 2); k.linea(x + 3, y - 1, x + 7, y + 15, L, 2); });
      k.poli([[166, 100], [184, 99], [184, 76], [166, 77]], N); k.linea(164, 82, 186, 86, L, 2); k.linea(164, 92, 186, 90, L, 2);
      const seco = (x, b, h) => { k.linea(x, b, x + 3, b - h, "#2a2420", 3); k.linea(x + 2, b - h * 0.5, x - 12, b - h * 0.8, "#2a2420", 2); k.linea(x + 2, b - h * 0.65, x + 16, b - h * 0.95, "#2a2420", 2); k.linea(x - 12, b - h * 0.8, x - 18, b - h * 0.76, "#2a2420"); k.linea(x + 16, b - h * 0.95, x + 22, b - h * 1.04, "#2a2420"); };
      seco(58, 128, 46); seco(262, 126, 52); seco(26, 150, 62);
      k.suelo(134, "#8a9070", "#78805f", "#a0a888");
      for (let i = 0; i < 16; i++) k.elipse(k.rnd() * 320, 146 + k.rnd() * 32, 10 + k.rnd() * 16, 2 + k.rnd() * 2, "#e8eef4");
      [[130, 138], [190, 138]].forEach(() => {}); for (let x = 8; x < 320; x += 26) if (x < 150 || x > 190) { const l = Math.sin(x) * 3; k.linea(x, 146, x + l, 126, "#3a2c22", 3); } k.linea(0, 132, 148, 134, "#4a3a2e", 2); k.linea(192, 134, 320, 130, "#4a3a2e", 2); k.linea(0, 140, 80, 138, "#4a3a2e", 2); k.linea(240, 138, 320, 142, "#4a3a2e", 2);
      k.R(204, 118, 2, 18, "#3a2c22"); k.R(196, 112, 20, 9, "#6a5a48"); k.R(198, 115, 16, 1, "#3a2c22"); k.R(198, 118, 12, 1, "#3a2c22");
    }, { tinte: 0.15, dx: 80 }],
    19: ["El Mundial de Kuidditch", "Las tiendas del campamento y el gran estadio, con la Marca Tenebrosa en el cielo", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#1f2a5a", "#3a4a7a", "#6a7aa0"], 0, 112);
      montana(k, 80, 116, 200, 26, { roca: ["#3f5a50", "#2f4a40", "#263e36", "#1f342c"] }); montana(k, 260, 116, 180, 22, { roca: ["#3f5a50", "#2f4a40", "#263e36", "#1f342c"] });
      const OR2 = ["#e8c35a", "#c9a03c", "#b8902f", "#8a6a1f", "#6a4f1a"];
      cilindro(k, 172, 58, 150, 58, OR2, 0.2); k.elipse(247, 58, 75, 12, "#e8c35a"); k.elipse(247, 58, 66, 8, "#6a4f1a"); k.elipse(247, 60, 56, 5, "#3f7a4a");
      for (let f = 0; f < 2; f++) for (let x = 178 + f * 6; x < 320; x += 13) { k.R(x, 74 + f * 19, 7, 15, "#5a4214"); k.elipse(x + 3, 74 + f * 19, 4, 3, "#5a4214"); k.R(x + 2, 66, 3, 3, "#ffe6a8"); }
      [[196, "#3f9a4a"], [238, "#c0392b"], [280, "#3f9a4a"]].forEach(([x, c]) => { k.R(x, 30, 1, 22, "#26262a"); bandera(k, x + 1, 30, 14, 8, c); });
      [[186, 46], [310, 46]].forEach(([x, y]) => { k.R(x, y, 2, 14, "#26262a"); k.R(x - 3, y - 3, 8, 3, "#ffe6a8"); });
      if (h >= 5 && h <= 9) marca(k, 88, 34);
      else [[60, 30, "#3fe87a"], [120, 22, "#ffe6a8"], [150, 46, "#e8502a"], [32, 54, "#ffe6a8"]].forEach(([x, y, c], i) => { const px = x + ((h * 23 + i * 40) % 40), r = 10 + ((h + i) % 4) * 3; for (let a = 0; a < 6.28; a += 0.45) { k.linea(px + Math.cos(a) * r * 0.3, y + Math.sin(a) * r * 0.3, px + Math.cos(a) * r, y + Math.sin(a) * r, c); k.P(px + Math.cos(a) * (r + 2), y + Math.sin(a) * (r + 2) + 1, "#ffe6a8"); } });
      k.suelo(112, "#5a8a4c", "#4a7a40", "#74a460"); k.hierbas(116, 178, 80); matas(k, 134, 178, 14, ["#3f6a38", "#5a8a4c", "#74a460"]);
      camino(k, 128, 180, (f) => 162 + Math.sin(f * 3) * 6, (f) => 11 + f * 22, "#94845c", "#a8966a", "#887850");
      const tienda = (x, b, w, h, c, o) => { sombra(k, x + w / 2, b + 1, w * 0.6, 2); k.poli([[x, b], [x + w / 2, b - h], [x + w, b]], c); k.poli([[x + w / 2, b - h], [x + w, b], [x + w * 0.66, b]], o); k.linea(x + w * 0.25, b, x + w / 2, b - h, o); k.poli([[x + w * 0.36, b], [x + w * 0.45, b - h * 0.6], [x + w * 0.56, b]], "#ffd27a"); k.R(x + w / 2, b - h - 8, 1, 8, "#26262a"); k.poli([[x + w / 2 + 1, b - h - 8], [x + w / 2 + 8, b - h - 6], [x + w / 2 + 1, b - h - 4]], o); k.linea(x - 4, b + 1, x + w * 0.16, b - h * 0.3, "#c8bea8"); k.linea(x + w + 4, b + 1, x + w * 0.84, b - h * 0.3, "#c8bea8"); };
      [[6, 126, 34, 22, "#3f9a4a", "#2f7a3a"], [46, 124, 30, 20, "#c0392b", "#92281e"], [84, 126, 34, 22, "#e8dcc0", "#c4b598"], [122, 124, 26, 18, "#3f9a4a", "#2f7a3a"], [178, 124, 28, 18, "#2f5fa8", "#234a86"], [212, 124, 30, 20, "#c0392b", "#92281e"], [248, 126, 34, 22, "#3f9a4a", "#2f7a3a"], [288, 124, 30, 20, "#e8c35a", "#c09a2a"]].forEach(([x, b, w, h, c, o]) => tienda(x, b, w, h, c, o));
      [[-8, 150, 46, 28, "#c0392b", "#92281e"], [48, 148, 42, 26, "#3f9a4a", "#2f7a3a"], [206, 148, 42, 26, "#e8dcc0", "#c4b598"], [262, 150, 46, 28, "#2f5fa8", "#234a86"]].forEach(([x, b, w, h, c, o]) => tienda(x, b, w, h, c, o));
      [[108, 168], [214, 170]].forEach(([x, y]) => { [[-5, 5], [5, -5], [-4, -3]].forEach(([a, b]) => k.linea(x + a, y, x + b, y - 3, "#3a2414", 2)); k.llama(x, y - 1, 0.5); brillo(k, x, y - 5, 16, 14, "#ffb04a", 0.6); });
    }, { ven: ["#ffd27a"], tinte: 0.15, fuego: ["#3fe87a", "#a8ffc8", "#0f3a22", "#ffe6a8", "#e8502a", "#ff9a3a", "#ffe06a"] }],
    20: ["El laberinto", "Los setos altísimos de la tercera prueba, con la copa brillando al fondo", (k) => {
      k.banda(["#2a2f5a", "#4a4a7a", "#8a7a9a"], 0, 96);
      const S = "#1f4a2c", L = "#2f6a3e", O = "#143420", V = { tronco: "#5b3a24", copa: S, borde: O, luz: L, osc: O };
      k.R(118, 62, 84, 70, O); k.R(150, 88, 20, 44, "#0a1a10"); k.elipse(160, 88, 10, 8, "#0a1a10");
      for (let x = 122; x < 200; x += 9) k.cumulo(x, 62, 6, V);
      const hojas = (x, y) => ((Math.sin(x * 1.31 + y * 0.37) + Math.sin(y * 1.73 - x * 0.61) + Math.sin((x + y) * 0.47)) / 3 + 1) * 0.5;
      rellena(k, [[-4, 6], [122, 62], [122, 132], [-4, 190]], (x, y) => rampa(["#3f7a4a", L, S, O], 0.06 + hojas(x, y) * 0.62 + (x / 122) * 0.26, x, y));
      rellena(k, [[324, 6], [198, 62], [198, 132], [324, 190]], (x, y) => rampa([L, S, O, "#0e2a18"], 0.06 + hojas(x, y) * 0.62 + ((320 - x) / 122) * 0.2, x, y));
      for (let i = 0; i <= 26; i++) { const f = i / 26, x = -4 + f * 126, y = 6 + f * 56, r = 9 - f * 5; k.cumulo(x, y, r, V); k.cumulo(320 - x, y, r, V); }
      for (let i = 0; i < 900; i++) { const f = k.rnd(), x = -4 + f * 126, a = 6 + f * 56, b = 190 - f * 58, y = a + k.rnd() * (b - a); k.P(x, y, k.rnd() < 0.5 ? L : O); k.P(320 - x, y, k.rnd() < 0.5 ? S : "#0e2a18"); }
      rellena(k, [[-4, 190], [324, 190], [198, 132], [122, 132]], (x, y) => (((x * 5 + y * 11) % 31 < 3) ? "#5a5a3c" : ((x * 3 + y * 7) % 37 < 3) ? "#7a7a58" : "#6a6a48"));
      [[60, 178, 92, 160], [260, 176, 226, 158], [110, 168, 126, 152]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, "#3a2e1e", 3); k.linea(a, b - 1, c, d - 1, "#5a4830"); });
      k.halo(160, 112, 36, 36, "#9ad8ff", 0.45);
      k.R(152, 128, 16, 4, "#6a6a72"); k.R(158, 120, 4, 8, "#e8c35a"); k.R(153, 126, 14, 3, "#c9a03c"); rellena(k, [[150, 104], [170, 104], [166, 120], [154, 120]], (x, y) => rampa(ORO, ((x - 150) / 20) * 0.8, x, y)); k.linea(150, 106, 145, 112, "#e8c35a"); k.linea(170, 106, 175, 112, "#e8c35a"); k.linea(145, 112, 152, 116, "#e8c35a"); k.linea(175, 112, 168, 116, "#e8c35a");
      for (let i = 0; i < 18; i++) k.P(136 + k.rnd() * 48, 94 + k.rnd() * 34, "#d8f4ff");
      k.alfa(0.14, () => { k.elipse(88, 150, 44, 7, "#e8c35a"); k.elipse(240, 160, 50, 7, "#e8c35a"); });
    }, { fuego: ["#ffe06a", "#9ad8ff", "#d8f4ff", "#e8c35a", "#c9a03c", "#ffe08a", "#a8842e", "#7a5f20"] }],
    21: ["El cementerio", "El cementerio de Pequeño Hangleton, donde vuelve Valdemoro", (k) => {
      k.banda(["#101a2e", "#1f2a40", "#3a4a58"], 0, 118);
      const NU = ["#3a465a", "#2a3448", "#1f2838"]; nubarron(k, -20, 38, 90, 10, NU); nubarron(k, 96, 28, 80, 8, NU);
      loma(k, [[180, 124], [250, 92], [340, 118]], 124, ["#2a3442", "#1f2834", "#18202c"], 0.2);
      casaT(k, 234, 96, 46, 30, { pared: "#2e3442", viga: "#14181f", techo: "#141a26", techoO: "#0e1420", ven: "#0c1018", puerta: "#0c1018", sombraC: "#0c1018" });
      k.suelo(118, "#3a4a38", "#2c3a2c", "#4a5a46"); k.hierbas(122, 178, 80, ["#2c3a2c", "#5a6a54"]); matas(k, 130, 178, 16, ["#26342a", "#3a4a38", "#5a6a54"]);
      [[20, 132, 12, 18], [146, 126, 10, 14], [176, 130, 12, 18], [206, 128, 10, 14], [238, 134, 12, 16], [288, 134, 12, 18], [128, 140, 14, 20], [272, 148, 12, 16], [54, 124, 9, 12], [300, 156, 13, 18]].forEach(([x, b, w, h]) => tumba(k, x, b, w, h));
      [[44, 128], [120, 124]].forEach(([x, b]) => { k.R(x, b - 18, 4, 18, "#5a5e68"); k.R(x - 5, b - 13, 14, 4, "#5a5e68"); k.R(x, b - 18, 1, 18, "#7a7e88"); });
      for (let x = 0; x < 320; x += 7) { k.R(x, 112, 1, 12, "#14181f"); k.P(x, 111, "#2a3040"); } k.R(0, 114, 320, 1, "#14181f"); k.R(0, 121, 320, 1, "#14181f");
      const x = 84;
      k.R(x - 20, 138, 40, 12, "#5a5e68"); k.R(x - 24, 148, 48, 5, "#4a4e58"); k.R(x - 20, 138, 40, 1, "#7a7e88"); k.R(x - 14, 142, 28, 1, "#34363e");
      rellena(k, [[x - 14, 138], [x + 14, 138], [x + 9, 88], [x, 76], [x - 9, 88]], (px, py) => rampa(["#9a9ea8", "#7a7e88", "#5e626c", "#44464e"], ((px - x + 14) / 28) * 0.9, px, py));
      k.linea(x - 14, 110, x - 26, 92, "#7a7e88", 5); k.linea(x + 12, 110, x + 25, 92, "#5e626c", 5);
      k.elipse(x, 83, 9, 10, "#7a7e88"); k.elipse(x - 1, 85, 5, 6, "#23262e"); k.linea(x + 15, 148, x + 17, 62, "#3a3e48", 2); rellena(k, [[x + 17, 62], [x - 20, 54], [x - 8, 72], [x + 17, 68]], (px, py) => rampa(["#d0d4de", "#a8acb6", "#7a7e88"], ((px - x + 20) / 37) * 0.8, px, py));
      k.elipse(214, 152, 24, 5, "#ff9a3a"); k.poli([[194, 152], [204, 136], [214, 148], [224, 136], [234, 152]], "#ff9a3a"); k.poli([[204, 152], [214, 142], [224, 152]], "#ffe06a"); brillo(k, 214, 146, 30, 24, "#ff9a3a", 0.6);
      esfera(k, 214, 132, 19, 16, ["#3a3a44", "#26262e", "#14141a"]); k.elipse(214, 118, 18, 4, "#34343e"); k.elipse(214, 118, 15, 2, "#c8e8ff");
      k.alfa(0.4, () => { k.elipse(216, 108, 8, 5, "#c8e8ff"); k.elipse(211, 98, 10, 6, "#c8e8ff"); k.elipse(218, 86, 12, 7, "#c8e8ff"); });
      k.niebla(124, 172, "#8a9ab8", 0.14);
    }, { tinte: 0.35, fuego: ["#ff9a3a", "#ffe06a", "#c8e8ff"] }],
    22: ["Grammiuld Place", "El cuartel de la Orden: la casa oscura de los Bleck, con sus cabezas de elfo", (k) => {
      const { h } = Det.cuando(k);
      k.R(0, 0, 320, 126, "#2a3a34");
      for (let y = 12; y < 100; y += 14) for (let x = y % 28 === 12 ? 4 : 12; x < 320; x += 16) { k.P(x, y, "#3a5046"); k.P(x - 1, y + 1, "#3a5046"); k.P(x + 1, y + 1, "#3a5046"); k.P(x, y + 2, "#3a5046"); k.P(x, y + 1, "#2f4238"); }
      k.R(0, 0, 320, 5, "#1a2420"); k.R(0, 5, 320, 2, "#7a5a2a"); tablas(k, 0, 100, 320, 26, "#3a2a22", "#241812", "#4a3628", 26, true); k.R(0, 100, 320, 2, "#5a4232"); for (let x = 8; x < 320; x += 30) { k.R(x, 106, 22, 16, "#33241c"); k.R(x, 106, 22, 1, "#1f140e"); }
      k.R(24, 14, 76, 76, "#8a6a32"); k.R(26, 16, 72, 72, "#6a5232"); k.R(29, 19, 66, 66, "#241c1c");
      rellena(k, [[42, 85], [48, 60], [76, 60], [82, 85]], () => "#14141a"); k.elipse(62, 46, 11, 13, "#d8c8b0"); k.elipse(62, 38, 13, 8, "#14141a"); k.R(56, 46, 4, 2, "#26262a"); k.R(65, 46, 4, 2, "#26262a"); k.R(58, 53, 9, 2, "#7a2a2a"); k.elipse(62, 66, 3, 3, "#c9a03c");
      const cor = (d, x0) => rellena(k, d > 0 ? [[x0, 10], [x0 + 32, 10], [x0 + 24, 34], [x0 + 14, 60], [x0, 76]] : [[x0, 10], [x0 - 32, 10], [x0 - 24, 34], [x0 - 14, 60], [x0, 76]], (x, y) => (Math.sin(x / 2.4 + y / 16) > 0.2 ? "#6a2030" : "#4a1620"));
      cor(1, 18); cor(-1, 106); if (h !== 2 && h !== 5) rellena(k, [[18, 10], [106, 10], [106, 90], [18, 90]], (x) => (Math.sin(x / 2.4) > 0.2 ? "#6a2030" : "#4a1620")); k.R(16, 8, 92, 3, "#c9a03c"); for (let i = 0; i < 14; i++) { k.P(20 + k.rnd() * 16, 14 + k.rnd() * 44, "#3a141c"); k.P(90 + k.rnd() * 14, 14 + k.rnd() * 44, "#3a141c"); } k.R(16, 60, 6, 3, "#c9a03c"); k.R(100, 60, 6, 3, "#c9a03c");
      k.R(160, 0, 2, 22, "#3a3a34"); k.elipse(161, 26, 24, 4, "#4a4a40"); k.elipse(161, 25, 20, 2, "#6a6a5a"); k.linea(136, 26, 146, 20, "#4a4a40", 2); k.linea(186, 26, 176, 20, "#4a4a40", 2);
      [-20, -10, 0, 10, 20].forEach((d) => { k.R(160 + d, 17, 2, 6, "#f4efe0"); k.alfa(0.22, () => k.elipse(161 + d, 14, 6, 6, "#ffcf6a")); k.P(160 + d, 16, "#ffcf6a"); });
      const elfo = (x, y) => { k.elipse(x, y + 1, 14, 12, "#3a2414"); k.elipse(x, y, 13, 11, "#5a3a22"); k.elipse(x, y, 11, 9, "#7a5438"); k.poli([[x - 3, y - 2], [x - 14, y - 8], [x - 4, y + 2]], "#a89a7a"); k.poli([[x + 3, y - 2], [x + 14, y - 8], [x + 4, y + 2]], "#8e8060"); esfera(k, x, y, 5, 6, ["#c8ba9a", "#a89a7a", "#8a7c5e"]); k.R(x - 3, y - 1, 2, 1, "#26262a"); k.R(x + 2, y - 1, 2, 1, "#26262a"); k.R(x, y + 1, 1, 3, "#8a7c5e"); };
      elfo(128, 62); elfo(156, 62); elfo(214, 46); elfo(244, 24);
      k.suelo(126, "#3a2e28", "#30261f", "#463830"); for (let y = 134; y < 180; y += 9) k.R(0, y, 320, 1, "#2a2018");
      k.R(0, 142, 320, 24, "#4a1c24"); k.R(0, 142, 320, 2, "#7a5a2a"); k.R(0, 164, 320, 2, "#7a5a2a"); for (let x = 6; x < 320; x += 18) { k.P(x, 150, "#7a5a2a"); k.P(x + 1, 151, "#7a5a2a"); k.P(x, 152, "#7a5a2a"); k.P(x - 1, 151, "#7a5a2a"); }
      for (let i = 0; i < 11; i++) { k.R(188 + i * 13, 116 - i * 11, 146, 11, i % 2 ? "#4a362a" : "#55402f"); k.R(188 + i * 13, 116 - i * 11, 146, 1, "#6a5240"); k.R(188 + i * 13, 125 - i * 11, 146, 2, "#33241c"); }
      for (let i = 0; i < 11; i++) k.R(194 + i * 13, 94 - i * 11, 2, 22, "#2a1c16"); k.linea(190, 98, 322, -14, "#2a1c16", 3); k.linea(190, 97, 322, -15, "#5a4232");
      rellena(k, [[110, 128], [112, 106], [126, 106], [128, 128]], (x, y) => rampa(["#7a7260", "#6a6250", "#4a4438"], ((x - 110) / 18) * 0.9, x, y)); k.elipse(119, 106, 8, 2, "#4a4438"); [[0, 128], [6, 128], [12, 128]].forEach(([d, b]) => k.R(112 + d, b - 2, 4, 2, "#8a8270")); k.linea(116, 106, 112, 86, "#26262a", 2); k.linea(122, 106, 126, 84, "#26262a", 2);
    }, { cielo: "propio", fuerza: 0.1, fuego: ["#ffcf6a", "#f4efe0"] }],
    23: ["El despacho de Imbrudge", "Todo rosa, con encajes y platos de gatitos en la pared", (k) => {
      k.R(0, 0, 320, 126, "#f6c8d6"); for (let x = 0; x < 320; x += 16) k.R(x, 0, 8, 126, "#f2b8ca");
      for (let y = 10; y < 104; y += 12) for (let x = (y % 24 ? 4 : 12); x < 320; x += 16) { k.P(x, y, "#fbe0e8"); k.P(x + 1, y + 1, "#fbe0e8"); k.P(x - 1, y + 1, "#fbe0e8"); k.P(x, y + 2, "#fbe0e8"); }
      k.R(0, 0, 320, 6, "#ec7aa8"); k.R(0, 6, 320, 2, "#fbe0e8"); tablas(k, 0, 104, 320, 22, "#ec9ab8", "#d87a9c", "#f6b8cc", 24, true); k.R(0, 104, 320, 2, "#fbe0e8");
      k.R(134, 16, 52, 62, "#fbe0e8"); k.R(138, 20, 44, 54, "#7fb0d8"); k.R(159, 20, 2, 54, "#fbe0e8"); k.R(138, 44, 44, 2, "#fbe0e8"); k.R(130, 78, 60, 4, "#fbe0e8");
      rellena(k, [[130, 14], [190, 14], [190, 26], [176, 44], [166, 20], [154, 20], [144, 44], [130, 26]], (x, y) => (Math.sin(x / 2.2) > 0.3 ? "#f08ab4" : "#ec7aa8")); for (let x = 130; x < 190; x += 5) k.elipse(x + 2, 14, 3, 2, "#ffffff"); [[136, 40], [184, 40]].forEach(([x, y]) => { k.poli([[x, y], [x - 7, y - 4], [x - 7, y + 4]], "#f8c8dc"); k.poli([[x, y], [x + 7, y - 4], [x + 7, y + 4]], "#f8c8dc"); k.R(x - 1, y - 1, 3, 3, "#ec7aa8"); });
      const plato = (x, y, c) => { k.elipse(x, y, 12, 12, "#c8a8b8"); k.elipse(x, y, 11, 11, "#ffffff"); k.elipse(x, y, 9, 9, "#fdeef3"); for (let a = 0; a < 6.28; a += 0.52) k.P(x + Math.cos(a) * 10, y + Math.sin(a) * 10, "#ec7aa8"); k.elipse(x, y + 2, 6, 5, c); k.poli([[x - 6, y - 1], [x - 5, y - 7], [x - 1, y - 3]], c); k.poli([[x + 6, y - 1], [x + 5, y - 7], [x + 1, y - 3]], c); k.P(x - 2, y + 1, "#26262a"); k.P(x + 2, y + 1, "#26262a"); k.P(x, y + 3, "#e87a9a"); k.R(x - 3, y + 6, 7, 2, "#ec7aa8"); };
      const G = ["#e8a860", "#c8c8d0", "#8a7a6a", "#f4f1e8", "#d8b090"];
      for (let f = 0; f < 3; f++) for (let c = 0; c < 9; c++) { const x = 20 + c * 34 + (f % 2) * 10, y = 26 + f * 28; if (x < 122 || x > 198) plato(x, y, G[(f * 3 + c) % 5]); }
      k.suelo(126, "#e8a8b8", "#dc98aa", "#f2b8c8");
      k.elipse(160, 158, 142, 19, "#ec7aa8"); k.elipse(160, 158, 134, 16, "#fbe0e8"); k.elipse(160, 158, 128, 14, "#f6c8d6"); for (let a = 0; a < 6.28; a += 0.2) k.elipse(160 + Math.cos(a) * 138, 158 + Math.sin(a) * 18, 2, 1, "#ffffff");
      k.R(92, 100, 136, 5, "#c86a8a"); k.R(92, 100, 136, 1, "#e88aa8"); tablas(k, 96, 105, 128, 24, "#a85a78", "#8f4a66", "#b86a88", 16, true); k.R(148, 110, 24, 15, "#8f4a66"); for (let x = 96; x < 224; x += 6) { k.elipse(x + 3, 105, 3, 2, "#ffffff"); k.P(x + 3, 107, "#ffffff"); }
      esfera(k, 112, 95, 8, 6, ["#ffffff", "#f4f1e8", "#d8c8c0"]); k.linea(120, 94, 125, 90, "#f4f1e8", 2); k.R(110, 88, 4, 2, "#ec7aa8"); k.elipse(106, 95, 3, 3, "#ec7aa8"); k.R(128, 96, 8, 4, "#f4f1e8"); k.R(136, 97, 2, 2, "#f4f1e8"); k.R(148, 96, 24, 4, "#f4efe0"); k.R(150, 95, 20, 1, "#ffffff");
      k.R(200, 86, 2, 14, "#3f7a4a"); k.elipse(201, 84, 5, 4, "#ec7aa8"); k.linea(176, 100, 186, 88, "#c0392b"); k.elipse(214, 94, 4, 5, "#f0c8d8"); k.R(213, 88, 2, 2, "#3f7a4a");
      k.R(60, 130, 28, 12, "#ec7aa8"); k.R(60, 114, 28, 18, "#f08ab4"); k.R(60, 114, 28, 2, "#fbe0e8"); k.R(62, 142, 3, 8, "#a85a78"); k.R(83, 142, 3, 8, "#a85a78"); esfera(k, 262, 142, 6, 7, ["#ffffff", "#f4f1e8", "#d8c8c0"]); esfera(k, 262, 132, 5, 5, ["#ffffff", "#f4f1e8", "#d8c8c0"]); k.poli([[258, 129], [259, 124], [262, 128]], "#f4f1e8"); k.poli([[266, 129], [265, 124], [262, 128]], "#f4f1e8"); k.R(258, 148, 9, 2, "#c86a8a");
    }, { cielo: "propio", fuerza: 0.08, ventanal: "#7fb0d8" }],
    24: ["El Departamento de Misterios", "La sala de las profecías y el arco del velo", (k) => {
      k.banda(["#070b1c", "#0c1430", "#131d44"], 0, 130);
      const VY = 86, A = "#141c40", B = "#2a3a6a";
      const pasillo = (s) => {
        const X = (d) => 160 + s * 160 / (1 + 3 * d), Y = (y, d) => VY + (y - VY) / (1 + 3 * d);
        k.poli([[X(0), Y(0, 0)], [X(1), Y(0, 1)], [X(1), Y(150, 1)], [X(0), Y(150, 0)]], A);
        for (let y = 24; y <= 150; y += 21) {
          k.poli([[X(0), Y(y, 0)], [X(1), Y(y, 1)], [X(1), Y(y + 3, 1)], [X(0), Y(y + 3, 0)]], B); k.poli([[X(0), Y(y, 0)], [X(1), Y(y, 1)], [X(1), Y(y + 1, 1)], [X(0), Y(y + 1, 0)]], "#4a5a90");
          for (let n = 22; n >= 0; n--) { const d = n / 22, r = Math.max(1, 4.5 / (1 + 3 * d)), v = k.rnd(); k.elipse(X(d), Y(y - 6, d), r, r, v < 0.6 ? "#5fa8e8" : v < 0.9 ? "#9ad8ff" : "#d8f4ff"); if (r > 2) k.P(X(d) - r * 0.4, Y(y - 6, d) - r * 0.4, "#ffffff"); }
        }
        [0.02, 0.2, 0.45, 0.75, 1].forEach((d) => k.R(X(d) - 1, Y(6, d), Math.max(1, 5 / (1 + 3 * d)), Y(150, d) - Y(6, d), B));
      };
      pasillo(-1); pasillo(1);
      k.R(120, 66, 80, 36, "#0a1026");
      rellena(k, [[-2, 150], [120, 102], [200, 102], [322, 150], [322, 182], [-2, 182]], (x, y) => (((x * 3 + y * 7) % 19 < 2) ? "#141a2e" : ((x * 5 + y * 3) % 23 < 2) ? "#2a3250" : "#1c2238"));
      for (let i = 0; i < 4; i++) { const y = 150 + i * 8; k.R(0, y, 320, 1, "#141a2e"); }
      k.elipse(160, 128, 70, 12, "#2a3250"); k.elipse(160, 125, 56, 9, "#343e60"); k.elipse(160, 123, 44, 6, "#3e4a70");
      k.halo(160, 90, 54, 58, "#9ad8ff", 0.34);
      k.poli([[148, 66], [160, 56], [172, 66], [176, 124], [144, 124]], "#0a0a14");
      for (let i = 0; i < 12; i++) { const x0 = 146 + i * 2.6; k.linea(x0, 64, x0 + Math.sin(i) * 2.5, 122, i % 2 ? "#20202e" : "#34344a"); }
      rellena(k, [[134, 124], [138, 60], [160, 44], [182, 60], [186, 124], [176, 124], [172, 66], [160, 56], [148, 66], [144, 124]], (x, y) => rampa(["#a8a8b8", "#8a8a9a", "#6a6a7a", "#4a4a5a"], ((x - 134) / 52) * 0.9 + (((x * 3 + y) % 13 < 1) ? 0.2 : 0), x, y));
      [[120, 150], [200, 158], [92, 170]].forEach(([x, y]) => { k.elipse(x, y, 3, 3, "#9ad8ff"); k.P(x - 1, y - 1, "#ffffff"); k.R(x - 5, y + 3, 11, 1, "#34405e"); });
      for (let i = 0; i < 30; i++) k.P(k.rnd() * 320, k.rnd() * 176, "#d8f4ff");
    }, { cielo: "propio", fuerza: 0, fuego: ["#5fa8e8", "#9ad8ff", "#d8f4ff", "#ffffff"] }],
    25: ["La clase de Pociones", "La mazmorra de los calderos, con sus estantes de frascos", (k) => {
      sillares(k, 0, 0, 320, 124, { base: "#3e4248", luz: "#4a4e54", osc: "#30343a" }, 9, 28);
      for (let x = 0; x < 320; x += 106) { k.linea(x, 0, x + 53, 26, "#2a2e34", 4); k.linea(x + 106, 0, x + 53, 26, "#2a2e34", 4); }
      const T = ["#6ae8a0", "#e86a9a", "#6ac8ff", "#e8c84a", "#b08ae8", "#e8904a"];
      const frascos = (x, y, n) => { k.R(x, y, n * 10 + 6, 3, "#5a3a22"); k.R(x, y, n * 10 + 6, 1, "#7a5230"); for (let i = 0; i < n; i++) { const c = T[Math.floor(k.rnd() * 6)], a = Math.round(8 + k.rnd() * 7), r = i % 3; if (r === 0) { k.R(x + 3 + i * 10, y - a, 7, a, c); k.R(x + 5 + i * 10, y - a - 3, 3, 3, "#c8c0b0"); k.R(x + 4 + i * 10, y - a + 1, 1, a - 2, "#ffffff"); } else if (r === 1) { esfera(k, x + 7 + i * 10, y - 5, 5, 5, ["#ffffff", c, c]); k.R(x + 6 + i * 10, y - 12, 3, 3, "#c8c0b0"); } else { rellena(k, [[x + 2 + i * 10, y], [x + 11 + i * 10, y], [x + 8 + i * 10, y - a], [x + 5 + i * 10, y - a]], () => c); k.R(x + 5 + i * 10, y - a - 2, 3, 2, "#c8c0b0"); } } };
      [[10, 34], [10, 66], [10, 98], [218, 34], [218, 66], [218, 98]].forEach(([x, y]) => frascos(x, y, 9));
      k.R(118, 18, 84, 58, "#5a3a22"); k.R(118, 18, 84, 2, "#7a5230"); k.R(122, 22, 76, 50, "#1f3a2e"); for (let i = 0; i < 6; i++) k.R(128, 28 + i * 7, 34 + k.rnd() * 28, 1, "#dfe9e2"); k.R(128, 28, 30, 2, "#dfe9e2"); k.R(130, 76, 60, 3, "#5a3a22"); k.R(136, 75, 8, 2, "#f4efe0");
      [[108, 64], [212, 64]].forEach(([x, y]) => { k.R(x - 1, y, 3, 12, "#5a3a22"); k.llama(x, y, 0.45); });
      k.suelo(124, "#55555c", "#48484e", "#64646a"); for (let y = 132, f = 0; y < 180; y += 8 + f, f++) { k.R(0, y, 320, 1, "#3e3e44"); for (let x = (f % 2) * 20; x < 320; x += 40 + f * 6) k.R(x, y, 1, 8 + f, "#3e3e44"); }
      [[60, 136, 0], [160, 132, 1], [260, 136, 2]].forEach(([x, y, n]) => {
        const c = T[(n + Det.cuando(k).h) % 6];
        k.R(x - 40, y, 80, 5, "#7a5230"); k.R(x - 40, y, 80, 1, "#a87444"); k.R(x - 36, y + 5, 4, 12, "#4a2e18"); k.R(x + 32, y + 5, 4, 12, "#4a2e18");
        k.poli([[x - 9, y], [x - 5, y - 8], [x, y - 3], [x + 5, y - 8], [x + 9, y]], "#ff9a3a");
        esfera(k, x, y - 13, 15, 12, ["#4a4a54", "#26262a", "#14141a"]); k.elipse(x, y - 22, 14, 3, "#3a3a44"); k.elipse(x, y - 22, 12, 2, c); k.P(x - 3, y - 22, "#ffffff"); k.P(x + 5, y - 22, "#ffffff");
        k.alfa(0.35, () => { k.elipse(x + 2, y - 31, 7, 4, c); k.elipse(x - 3, y - 40, 9, 5, c); k.elipse(x + 4, y - 50, 11, 6, c); });
        [[-24, 4], [20, 3]].forEach(([d, h]) => { k.R(x + d, y - 8 - h, 5, 8 + h, T[(x + d) % 6 < 0 ? 0 : Math.abs(x + d) % 6]); k.R(x + d + 1, y - 11 - h, 3, 3, "#c8c0b0"); });
      });
    }, { cielo: "propio", fuerza: 0.1, fuego: ["#6ae8a0", "#e86a9a", "#6ac8ff", "#e8c84a", "#b08ae8", "#e8904a", "#ff9a3a", "#e8502a", "#ffe06a"] }],
    26: ["El despacho de Dombludere", "El despacho redondo, con el pensatorio, la percha de Fewkas y los retratos", (k) => {
      tablas(k, 0, 0, 320, 126, "#6a3f3a", "#5a3430", "#7a4a44", 18, true); k.R(0, 0, 320, 4, "#c9a03c"); k.R(0, 4, 320, 1, "#7a5a22");
      rellena(k, [[124, 96], [124, 30], [160, 6], [196, 30], [196, 96]], (x, y) => rampa(ORO, ((x - 124) / 72) * 0.8, x, y)); rellena(k, [[129, 96], [129, 32], [160, 12], [191, 32], [191, 96]], () => "#2a3672");
      k.R(159, 12, 2, 84, "#c9a03c"); k.R(129, 54, 62, 2, "#c9a03c"); [[144, 32], [176, 32]].forEach(([x, y]) => { for (let a = 0; a < 6.28; a += 0.785) k.linea(x, y, x + Math.cos(a) * 7, y + Math.sin(a) * 7, "#c9a03c"); });
      const retrato = (x, y, w, h, c) => { k.R(x - 1, y - 1, w + 2, h + 2, "#7a5a22"); k.R(x, y, w, h, "#c9a03c"); k.R(x + 2, y + 2, w - 4, h - 4, "#2a3040"); k.poli([[x + w * 0.18, y + h - 2], [x + w / 2, y + h * 0.5], [x + w * 0.82, y + h - 2]], c); k.elipse(x + w / 2, y + h * 0.4, w * 0.2, h * 0.2, "#d8b890"); k.poli([[x + w * 0.34, y + h * 0.5], [x + w * 0.66, y + h * 0.5], [x + w / 2, y + h * 0.78]], "#d8d8d0"); k.P(x + w * 0.42, y + h * 0.38, "#26262a"); k.P(x + w * 0.58, y + h * 0.38, "#26262a"); };
      [[10, 10, 26, 32, "#6a3f9a"], [44, 6, 30, 36, "#2f6a4a"], [84, 12, 26, 30, "#8f1d22"], [210, 12, 26, 30, "#2a4a8a"], [246, 6, 30, 36, "#6a3f9a"], [284, 10, 26, 32, "#c9a03c"]].forEach(([x, y, w, h, c]) => retrato(x, y, w, h, c));
      [[6, 70], [6, 94], [214, 70], [214, 94]].forEach(([x, y]) => libros(k, x, y, 100, 15));
      k.R(36, 51, 32, 3, "#3f2e20"); rellena(k, [[40, 52], [64, 52], [56, 38], [51, 28], [47, 40]], (x, y) => rampa(["#7a5e44", "#5a4230", "#3f2e20"], ((x - 40) / 24) * 0.9, x, y)); k.R(46, 45, 10, 1, "#2a1c14"); k.linea(45, 42, 50, 44, "#2a1c14");
      k.suelo(126, "#7a5a3a", "#6a4c30", "#8a6a46"); for (let y = 134; y < 180; y += 9) k.R(0, y, 320, 1, "#5a4028");
      k.elipse(160, 156, 124, 19, "#2a3a70"); k.elipse(160, 156, 114, 15, "#c9a03c"); k.elipse(160, 156, 110, 13, "#2a3a70"); for (let a = 0; a < 6.28; a += 0.26) k.R(160 + Math.cos(a) * 86, 156 + Math.sin(a) * 9, 2, 2, "#e8c35a");
      k.R(112, 104, 96, 5, "#a87444"); k.R(112, 104, 96, 1, "#c99a64"); tablas(k, 116, 109, 88, 19, "#6a4426", "#4a2e18", "#7a5230", 14, true); k.R(154, 112, 12, 16, "#55351e");
      esfera(k, 130, 97, 6, 6, ORO); k.R(129, 98, 3, 7, "#a8842e"); k.R(186, 92, 2, 12, "#a8842e"); esfera(k, 187, 90, 5, 5, ORO); for (let a = 0; a < 6.28; a += 0.2) k.P(187 + Math.cos(a) * 8, 90 + Math.sin(a) * 3, "#c9a03c"); k.R(150, 100, 22, 4, "#f4efe0"); k.R(152, 99, 18, 1, "#ffffff"); k.linea(170, 98, 176, 90, "#f4efe0");
      rellena(k, [[34, 140], [62, 140], [56, 128], [40, 128]], (x, y) => rampa(["#9a9aa8", "#7a7a88", "#5a5a68"], ((x - 34) / 28) * 0.9, x, y)); cilindro(k, 44, 114, 8, 14, ["#8a8a98", "#6a6a78", "#4a4a58"]); esfera(k, 48, 113, 19, 6, ["#a8a8b8", "#8a8a98", "#6a6a78"]); k.elipse(48, 111, 15, 4, "#d8ecff"); k.halo(48, 100, 18, 20, "#d8ecff", 0.4); for (let i = 0; i < 6; i++) k.R(38 + i * 4, 111, 3, 1, "#ffffff");
      k.R(182, 136, 28, 3, "#c9a03c"); k.R(182, 136, 28, 1, "#e8c35a"); k.R(195, 139, 3, 22, "#a8842e"); k.R(186, 161, 21, 3, "#a8842e"); k.R(186, 161, 21, 1, "#c9a03c");
    }, { cielo: "propio", fuerza: 0.15, ventanal: "#2a3672", fuego: ["#d8ecff"] }],
    27: ["La cueva", "El lago negro de los enfiri y la vasija de poción verde en su isla", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#05070d", "#090d15", "#0f1520"], 0, 104);
      for (let i = 0; i < 34; i++) { const x = k.rnd() * 320, w = 6 + k.rnd() * 12, h = 14 + k.rnd() * 44; rellena(k, [[x - w, 0], [x + w, 0], [x + 1, h]], (px, py) => (px < x ? "#1f2836" : "#10161f")); }
      for (let y = 0; y < 100; y += 5) for (let x = (y % 2) * 7; x < 320; x += 19) k.R(x, y, 3, 1, "#1a2230");
      k.agua(100, 158, ["#0a1418", "#0c1a20", "#0e2026"], "#2a5a54", 80);
      k.halo(176, 100, 90, 46, "#3fe87a", 0.3); k.elipse(176, 120, 54, 11, "#1c2026"); k.elipse(176, 118, 52, 11, "#262c34"); k.elipse(176, 116, 46, 8, "#343a44");
      rellena(k, [[162, 100], [190, 100], [184, 116], [168, 116]], (x, y) => rampa(["#8a909a", "#5a606a", "#3a404a"], ((x - 162) / 28) * 0.9, x, y)); k.R(170, 116, 12, 3, "#5a606a"); k.elipse(176, 100, 15, 4, "#3fe87a"); k.elipse(176, 100, 10, 2, "#a8ffc8"); k.P(172, 100, "#ffffff");
      k.alfa(0.3, () => { k.elipse(176, 134, 34, 10, "#3fe87a"); });
      k.poli([[66, 132], [118, 132], [110, 140], [76, 140]], "#2a2420"); k.R(66, 131, 52, 2, "#3a3028"); k.linea(88, 132, 100, 118, "#3a3028"); k.linea(92, 138, 62, 146, "#3a3028");
      [[34, 146], [96, 152], [136, 148], [226, 142], [262, 150], [296, 144], [58, 154], [200, 156], [244, 134]].slice(0, Math.max(3, Math.min(9, 3 + (h - 17) * 2))).forEach(([x, y]) => { k.R(x, y - 7, 5, 7, "#b4bcac"); [0, 2, 4].forEach((d) => k.R(x + d, y - 11, 1, 4, "#b4bcac")); k.R(x - 1, y - 8, 1, 3, "#b4bcac"); k.alfa(0.5, () => k.elipse(x + 2, y, 6, 1, "#2a5a54")); });
      k.suelo(158, "#2a2e36", "#20242c", "#343a44", 180, 300);
      [[-4, 166, 56, 22], [50, 172, 40, 14], [262, 168, 62, 24], [222, 174, 42, 14]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#3a404a", "#2a2e36", "#1c2026", "#14181e"]));
      k.niebla(96, 118, "#3f8a6a", 0.1);
    }, { cielo: "propio", fuerza: 0, fuego: ["#3fe87a", "#a8ffc8", "#ffffff"] }],
    28: ["La Torre de Astronomía", "Lo más alto del castillo, con la Marca Tenebrosa sobre las almenas", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#1a2452", "#2a3670", "#3f4a8a"], 0, 124);
      const NU = ["#5a64a0", "#3f4a8a", "#2a3670"]; nubarron(k, 200, 34, 120, 10, NU); nubarron(k, -24, 66, 90, 10, NU);
      k.cordillera(126, 26, "#20264a", null, 2);
      const o = { piedra: ["#6a6c8c", "#4e5070", "#3a3c58", "#2a2c44"], techo: ["#3a3e60", "#262a4a", "#1a1e38"], ventanas: "#ffd27a", paso: 11 };
      [[24, 14, 46, 18], [52, 18, 60, 20], [84, 12, 38, 16], [246, 14, 44, 18], [272, 18, 58, 20], [300, 12, 40, 16]].forEach(([x, w, h, a]) => torreta(k, x, 126, w, h, a, o));
      if (h === 23) for (let i = 0; i < 46; i++) { const x = k.rnd() * 320, y = 40 + k.rnd() * 76; k.R(x, y, 1, 2, "#d8ecff"); k.P(x, y - 1, "#ffffff"); } else marca(k, 112, 36);
      const Q = { base: "#7a7a88", luz: "#8e8e9c", osc: "#5a5a68" };
      sillares(k, 0, 118, 320, 14, { base: "#6a6a7a", luz: "#7a7a8a", osc: "#54545f" }, 5, 15); for (let x = 0; x < 320; x += 26) { sillares(k, x, 104, 15, 14, { base: "#7a7a8a", luz: "#8a8a9a", osc: "#5a5a6a" }, 5, 8); k.R(x, 104, 15, 2, "#9a9aaa"); }
      sillares(k, 0, 130, 320, 50, Q, 10, 34); k.alfa(0.3, () => k.R(0, 130, 320, 4, "#26263a"));
      k.linea(262, 128, 274, 96, "#a8842e", 2); k.linea(286, 128, 276, 96, "#a8842e", 2); k.linea(274, 128, 275, 96, "#a8842e", 2); k.linea(254, 84, 292, 102, "#c9a03c", 5); k.linea(254, 83, 292, 101, "#e8c35a"); k.R(252, 82, 6, 8, "#e8c35a"); k.R(286, 98, 8, 8, "#a8842e");
      k.R(38, 128, 13, 3, "#a8842e"); k.R(43, 124, 3, 5, "#a8842e"); for (let a = 0; a < 6.28; a += 0.08) { k.P(44 + Math.cos(a) * 10, 114 + Math.sin(a) * 10, "#c9a03c"); k.P(44 + Math.cos(a) * 10, 114 + Math.sin(a) * 3, "#e8c35a"); k.P(44 + Math.cos(a) * 3, 114 + Math.sin(a) * 10, "#a8842e"); }
      esfera(k, 44, 114, 3, 3, ORO); [[106, 142], [214, 138]].forEach(([x, y]) => { k.R(x, y, 6, 12, "#3a3a4a"); k.R(x + 1, y, 1, 12, "#5a5a6a"); k.R(x - 4, y + 12, 14, 2, "#3a3a4a"); });
    }, { ven: VEN, fuego: ["#3fe87a", "#0f3a22", "#a8ffc8"] }],
    29: ["El Valle de Gidroc", "El pueblo nevado, con su iglesia, su cementerio y la casa en ruinas de los Petter", (k) => {
      k.banda(["#3a4a7a", "#5a6a9a", "#8a9abc", "#b8c4d8"], 0, 126);
      const NU = ["#ffffff", "#e0e6f0", "#b8c4d8"]; nubarron(k, -20, 40, 100, 14, NU); nubarron(k, 244, 34, 90, 14, NU);
      montana(k, 66, 128, 200, 44, { roca: ["#d8e2ee", "#c8d4e4", "#b4c2d6", "#a0b0c8"], nieve: ["#ffffff", "#e8eef4"], hasta: 0.7 }); montana(k, 270, 128, 180, 40, { roca: ["#d8e2ee", "#c8d4e4", "#b4c2d6", "#a0b0c8"], nieve: ["#ffffff", "#e8eef4"], hasta: 0.7 });
      const c = (p, t) => ({ pared: p, viga: "#3a2a22", nieve: true, techo: t, techoO: "#4a3a30", puerta: "#3a2a22" });
      casaT(k, 6, 128, 40, 26, c("#c8a888", "#6a5a4a")); casaT(k, 50, 130, 34, 22, c("#d8b898", "#7a4a3a")); casaT(k, 204, 128, 36, 24, c("#c8a888", "#6a5a4a"));
      const IG = { base: "#8a8478", luz: "#9c9688", osc: "#6e6a60" };
      sillares(k, 124, 86, 64, 42, IG, 6, 11); k.poli([[118, 88], [194, 88], [180, 68], [132, 68]], "#e8eef4"); k.poli([[160, 88], [194, 88], [180, 68], [160, 68]], "#c4d0dc"); for (let i = 118; i < 194; i += 4) k.R(i, 88, 1, 2 + (i % 3), "#c8dcec");
      sillares(k, 98, 62, 28, 66, { base: "#7a7468", luz: "#8a8478", osc: "#605c52" }, 6, 9); k.poli([[94, 62], [130, 62], [112, 26]], "#e8eef4"); k.poli([[112, 26], [130, 62], [118, 62]], "#c4d0dc"); k.R(111, 16, 3, 12, "#3a3a44"); k.R(107, 20, 11, 2, "#3a3a44");
      [[134, 98], [152, 98], [170, 98], [108, 84]].forEach(([x, y]) => { ventanaArco(k, x, y, 9, 18, "#4a4a44", "#ffd27a"); k.R(x, y + 10, 9, 1, "#c0392b"); k.R(x + 2, y + 5, 2, 2, "#2f6fa8"); k.R(x + 6, y + 7, 2, 2, "#3f8a58"); brillo(k, x + 4, y + 8, 14, 16, "#ffd27a", 0.5); });
      rellena(k, [[250, 128], [250, 84], [262, 74], [274, 92], [288, 70], [300, 88], [312, 80], [312, 128]], (x, y) => (((x + (y >> 3) * 5) % 11 < 1 || y % 8 === 0) ? "#54463c" : "#6a5a4e")); k.poli([[276, 128], [276, 104], [284, 96], [294, 104], [294, 128]], "#2a2230"); k.R(256, 96, 10, 12, "#2a2230"); k.poli([[242, 90], [266, 70], [272, 80], [250, 96]], "#e8eef4");
      k.linea(284, 96, 292, 78, "#3a2a22", 2); k.linea(296, 104, 306, 86, "#3a2a22", 2); k.linea(272, 90, 306, 78, "#3a2a22", 2);
      k.suelo(128, "#e8eef4", "#d0dae4", "#ffffff", 180, 500);
      k.elipse(232, 130, 22, 4, "#2f4a3a"); k.elipse(316, 128, 16, 4, "#2f4a3a"); k.alfa(0.5, () => { k.elipse(60, 164, 70, 5, "#c8d4e0"); k.elipse(276, 168, 66, 5, "#c8d4e0"); });
      [[20, 150, 11, 15], [44, 146, 10, 13], [66, 152, 11, 15], [92, 148, 10, 13]].forEach(([x, b, w, h]) => tumba(k, x, b, w, h, ["#a8acb4", "#8a8e98", "#5a5e68"], true)); tumba(k, 128, 156, 16, 22, ["#f4f6fa", "#dfe4ea", "#a8acb4"], true);
      [[132, 158], [138, 159]].forEach(([x, y]) => { k.R(x, y, 2, 2, "#c0392b"); k.P(x + 1, y - 1, "#e8607a"); }); k.R(133, 160, 6, 1, "#3f8a3a");
      k.R(0, 134, 118, 3, "#a8aeb8"); k.R(0, 134, 118, 1, "#c8ced8"); for (let x = 6; x < 118; x += 14) { k.R(x, 129, 3, 8, "#a8aeb8"); k.R(x - 1, 128, 5, 2, "#ffffff"); }
      camino(k, 132, 180, (f) => 196 + Math.sin(f * 3) * 8, (f) => 7 + f * 16, "#c0ccd8", "#d0dae4", "#a4b4c8");
      for (let i = 0; i < 100; i++) k.P(k.rnd() * 320, k.rnd() * 176, "#ffffff"); for (let i = 0; i < 26; i++) k.R(k.rnd() * 320, k.rnd() * 170, 2, 2, "#ffffff");
    }, { ven: VEN, tinte: 0.2 }],
    30: ["Grongitts", "El gran vestíbulo de mármol del banco de los duendes", (k) => {
      k.R(0, 0, 320, 124, "#d8d2c4"); for (let y = 12; y < 124; y += 14) { k.R(0, y, 320, 1, "#c4bdae"); for (let x = (y % 28 === 12 ? 20 : 0); x < 320; x += 40) k.R(x, y, 1, 14, "#c4bdae"); }
      k.R(0, 0, 320, 8, "#b8b0a0"); k.R(0, 8, 320, 1, "#c9a03c");
      rellena(k, [[136, 44], [184, 44], [184, 124], [136, 124]], (x, y) => rampa(["#d8a04a", "#b8823a", "#a8742a", "#7a4f1a"], ((x - 136) / 48) * 0.8, x, y)); k.R(159, 48, 2, 76, "#7a4f1a"); for (let y = 54; y < 124; y += 16) { k.R(140, y, 18, 1, "#7a4f1a"); k.R(162, y, 18, 1, "#7a4f1a"); } k.elipse(150, 86, 3, 3, "#e8c35a"); k.elipse(170, 86, 3, 3, "#e8c35a");
      k.poli([[128, 44], [192, 44], [160, 24]], "#c9a03c"); k.poli([[136, 42], [184, 42], [160, 29]], "#efeade"); esfera(k, 160, 38, 3, 3, ORO);
      const MA = ["#fbf8f0", "#efeade", "#d8d0c0", "#b8b0a0"];
      [[14, 20], [70, 18], [232, 18], [286, 20]].forEach(([x, w]) => { cilindro(k, x, 8, w, 116, MA, 0.3); for (let px = x + 3; px < x + w; px += 5) k.R(px, 16, 1, 100, "#d0c8b8"); k.R(x - 3, 8, w + 6, 6, "#c9a03c"); k.R(x - 3, 8, w + 6, 1, "#e8c35a"); k.R(x - 2, 14, w + 4, 2, "#a8842e"); k.R(x - 3, 116, w + 6, 8, "#bfb7a6"); k.R(x - 3, 116, w + 6, 1, "#d8d0c0"); });
      [[112, 22], [208, 22]].forEach(([x, y]) => { k.R(x, 0, 1, y, "#8a6a1f"); k.elipse(x, y, 13, 3, "#c9a03c"); k.elipse(x, y - 1, 11, 1, "#e8c35a"); [-10, -5, 0, 5, 10].forEach((d) => { k.R(x + d, y - 5, 1, 5, "#f4efe0"); k.alfa(0.3, () => k.elipse(x + d, y - 7, 3, 3, "#ffe6a8")); k.P(x + d, y - 6, "#ffe6a8"); }); });
      const fila = (f) => 124 + 58 * Math.pow(f, 1.5), col = (c, f) => 160 + c * (22 + 34 * f);
      for (let r = 0; r < 7; r++) for (let c = -9; c < 9; c++) { const a = r / 7, b = (r + 1) / 7; k.poli([[col(c, a), fila(a)], [col(c + 1, a), fila(a)], [col(c + 1, b), fila(b)], [col(c, b), fila(b)]], (r + c + 64) % 2 ? "#ece6d8" : "#4a4852"); }
      const mostrador = (x, w) => {
        for (let i = 0; i < 3; i++) { const c = x + 18 + i * 34; k.R(c - 7, 100, 14, 6, "#3a2a3a"); esfera(k, c, 94, 6, 7, ["#e8c8a0", "#d8b890", "#b89470"]); k.poli([[c - 5, 92], [c - 14, 87], [c - 5, 96]], "#d8b890"); k.poli([[c + 5, 92], [c + 14, 87], [c + 5, 96]], "#b89470"); k.R(c - 3, 92, 2, 1, "#26262a"); k.R(c + 2, 92, 2, 1, "#26262a"); k.R(c - 2, 98, 5, 1, "#8a6a4a"); }
        k.R(x, 104, w, 5, "#a87444"); k.R(x, 104, w, 1, "#c99a64"); tablas(k, x, 109, w, 30, "#6a4426", "#4a2e18", "#7a5230", 22, true); for (let c = x + 6; c < x + w - 12; c += 22) { k.R(c, 114, 16, 20, "#5a381e"); k.R(c, 114, 16, 1, "#3f2614"); }
        k.R(x + w / 2, 96, 2, 8, "#c9a03c"); k.R(x + w / 2 - 9, 96, 20, 1, "#c9a03c"); k.linea(x + w / 2 - 9, 96, x + w / 2 - 9, 101, "#a8842e"); k.elipse(x + w / 2 - 9, 102, 3, 1, "#c9a03c"); k.linea(x + w / 2 + 10, 96, x + w / 2 + 10, 101, "#a8842e"); k.elipse(x + w / 2 + 10, 102, 3, 1, "#c9a03c");
        for (let i = 0; i < 6; i++) k.R(x + 8 + i * 2, 102 - (i % 3), 3, 2, "#e8c35a");
      };
      mostrador(0, 112); mostrador(208, 112);
    }, { cielo: "propio", fuerza: 0.12, fuego: ["#ffe6a8", "#f4efe0"] }],
    31: ["El espejo de Eosed", "La última sala de la piedra: el espejo de pie, entre llamas negras y moradas", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#16131e", "#1f1a2a", "#2b2438"], 0, 122);
      for (let y = 4, f = 0; y < 122; y += 12, f++) { k.R(0, y, 320, 1, "#100e18"); for (let x = (f % 2 ? 6 : 22); x < 320; x += 32) { k.R(x, y, 1, 12, "#100e18"); if ((x + y * 3) % 7 === 0) k.R(x + 1, y + 1, 30, 11, "#262032"); } }
      const puerta = (x, c, l) => {
        rellena(k, [[x - 22, 124], [x - 22, 70], [x, 48], [x + 22, 70], [x + 22, 124]], (px, py) => rampa(["#5a5468", "#4a4458", "#3a3446", "#2a2636"], ((px - x + 22) / 44) * 0.8 + (((px * 3 + py) % 13 < 1) ? 0.2 : 0), px, py)); k.poli([[x - 15, 124], [x - 15, 72], [x, 57], [x + 15, 72], [x + 15, 124]], "#08060c");
        k.halo(x, 100, 26, 30, c, 0.3);
        [[-11, 10], [-5, 18], [1, 13], [7, 20], [12, 11]].forEach(([d, h]) => { k.poli([[x + d - 5, 124], [x + d, 124 - h - 8], [x + d + 5, 124]], c); k.poli([[x + d - 2, 124], [x + d, 124 - h * 0.7], [x + d + 2, 124]], l); });
      };
      puerta(44, "#14101c", "#a05ae8"); puerta(276, "#a05ae8", "#e0b8ff");
      k.suelo(124, "#3a3446", "#302a3c", "#464054"); for (let y = 132, f = 0; y < 180; y += 8 + f, f++) { k.R(0, y, 320, 1, "#2a2434"); for (let x = (f % 2) * 22; x < 320; x += 44 + f * 8) k.R(x, y, 1, 8 + f, "#2a2434"); }
      k.R(104, 112, 112, 6, "#4a4458"); k.R(96, 118, 128, 7, "#3e3a4c"); k.R(104, 112, 112, 1, "#5a5468"); k.R(96, 118, 128, 1, "#4e485c");
      k.halo(160, 62, 64, 60, "#e8c35a", 0.2);
      rellena(k, [[122, 110], [122, 38], [131, 21], [160, 6], [189, 21], [198, 38], [198, 110]], (x, y) => rampa(ORO, ((x - 122) / 76) * 0.9, x, y));
      rellena(k, [[130, 106], [130, 40], [137, 27], [160, 15], [183, 27], [190, 40], [190, 106]], (x, y) => rampa(["#b8d4e0", "#a8c8d6", "#8fb4c8", "#7a9eb4"], ((x + y) / 300) + 0.1, x, y));
      k.poli([[130, 84], [130, 62], [168, 19], [178, 24]], "#c8e0ea"); k.poli([[148, 106], [190, 58], [190, 72], [160, 106]], "#b8d4e0");
      if (h === 21) { const tinte = (c) => Det.mezcla(c, "#dcecf4", 0.2), b = 105; [["Jemas", 128], ["Rily", 167], ["Antonio", 147]].forEach(([n, x]) => { const sp = window.Personajes && Personajes.magos.flat().find((s) => s.nombre === n); if (sp) Det.sprite(k, "magos", n, x, b - sp.m.length, tinte); }); k.halo(160, 76, 34, 34, "#fff4d0", 0.16); }
      for (let i = 0; i < 16; i++) { const x = 136 + i * 3.3, y = 30 - Math.abs(i - 8) * -0.6; k.R(x, 25 + Math.abs(i - 8) * 1.1, 2, 1, "#7a5f20"); }
      k.R(120, 106, 80, 6, "#a8842e"); k.R(120, 106, 80, 2, "#e8c35a");
      [[126, 112], [190, 112]].forEach(([x, y]) => { k.R(x - 3, y, 10, 3, "#a8842e"); k.R(x - 5, y + 2, 3, 2, "#8a6a1f"); k.R(x + 2, y + 2, 3, 2, "#8a6a1f"); k.R(x + 6, y + 2, 3, 2, "#8a6a1f"); });
      esfera(k, 160, 10, 5, 4, ORO); k.R(156, 12, 8, 2, "#8a6a1f");
      for (let i = 0; i < 26; i++) { const x = i % 2 ? 20 + k.rnd() * 60 : 240 + k.rnd() * 60; k.P(x, 60 + k.rnd() * 70, i % 2 ? "#a05ae8" : "#e0b8ff"); }
    }, { cielo: "propio", fuerza: 0.06, fuego: ["#a05ae8", "#e0b8ff", "#e8c35a", "#ffe08a", "#c9a03c", "#a8842e", "#7a5f20", "#b8d4e0", "#a8c8d6", "#8fb4c8", "#7a9eb4", "#c8e0ea"] }],
  };
  Det.sitios("magos", sitios);
})();
