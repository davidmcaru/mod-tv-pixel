// sitios-ninjas.js — los escenarios de Ninjas, dibujados con las piezas de piezas-detalle.js.
(function () {
  const { trama, rampa, rellena, bola, esfera, cilindro, nubarron, cirros, reflejo, espuma, oleaje, montana, loma, estratos, pena, adoquines, cubierta, camino, matas, flores, helecho, sillares, ladrillos, tablas, ventanaArco, torreta, almenas, casaTorcida, tejadoJ, casaJ2, barril, caja, bandera, farolillo, catenaria, humo, sombra, brillo, rotulo } = Det;
  const CIELO = ["#5fa8e0", "#8cc6ea", "#bfe2f0", "#eef0dc"], VERDE = ["#98c870", "#7fb35a", "#6a9e4a", "#558a3c"];
  const ROJO = { c: "#b5432f", luz: "#d8604a", osc: "#8a2f22" }, TIERRA = { c: "#a56a3a", luz: "#c08450", osc: "#7c4c28" }, AZUL = { c: "#3f6f9a", luz: "#5a8cb8", osc: "#2c5070" }, TEJA = { c: "#7a4a3a", luz: "#94604e", osc: "#5a3428" };
  const VEN = ["#ffd27a"];
  const ARBOL = { tronco: "#5b3a24", copa: "#3f8f45", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" };
  const hojaK = (k, x, y, r, col) => { for (let a = 0; a < 13; a += 0.08) { const e = 1 + (a / 13) * r; k.R(x + Math.cos(a) * e, y + Math.sin(a) * e, 2, 2, col); } k.poli([[x + r * 0.9, y - r * 0.6], [x + r * 1.7, y - r * 1.4], [x + r * 1.2, y - r * 0.1]], col); };
  function monteH(k, n, { roca, luz, osc, pelo }) {
    rellena(k, [[-4, 136], [-4, 64], [36, 48], [110, 40], [210, 38], [284, 50], [324, 64], [324, 136]], estratos(roca));
    rellena(k, [[-4, 64], [36, 48], [110, 40], [210, 38], [284, 50], [324, 64], [324, 70], [284, 57], [210, 45], [110, 47], [36, 55], [-4, 71]], () => luz);
    const xs = n === 7 ? [31, 74, 117, 160, 203, 246, 289] : n === 5 ? [50, 104, 158, 212, 266] : [66, 118, 170, 222];
    xs.forEach((x, i) => {
      bola(k, x, 80, 19, 25, (px, py) => rampa(roca, 0.1 + ((px - x) / 19) * 0.3 + ((py - 80) / 25) * 0.34 + 0.22, px, py));
      k.poli([[x - 20, 72 - i], [x - 12, 58 - i], [x, 52 - i], [x + 12, 58 - i], [x + 20, 72 - i], [x + 14, 66], [x, 62], [x - 14, 66]], pelo[i % pelo.length]);
      k.R(x - 11, 74, 8, 2, osc); k.R(x + 3, 74, 8, 2, osc); k.R(x - 10, 77, 5, 2, osc); k.R(x + 5, 77, 5, 2, osc); k.R(x - 1, 78, 3, 9, osc); k.R(x - 2, 87, 5, 1, osc); k.R(x - 7, 94, 14, 2, osc); k.R(x - 15, 98, 30, 1, osc);
    });
  }
  const marco = (k, x, b, t, p = ARBOL) => { k.arbolote(x, b, t, p); sombra(k, x, b + 1, 14 * t, 2); };
  const poste = (k, x, b, h, col = "#5a3f2a") => { k.R(x, b - h, 2, h, col); k.R(x - 5, b - h + 3, 12, 1, col); k.R(x - 3, b - h + 7, 8, 1, col); };

  const sitios = {
    1: ["La aldea de Kanoho", "Tejados rojos y depósitos de agua al pie del monte de los Hakoge", (k) => {
      const { d } = Det.cuando(k);
      k.banda(CIELO, 0, 112);
      nubarron(k, -16, 26, 80, 12); nubarron(k, 244, 20, 90, 14); cirros(k, 5, 4, 24);
      monteH(k, d === 0 ? 7 : 4, { roca: ["#d2ba92", "#c0a57e", "#a68a64", "#8c7250"], luz: "#e4d0aa", osc: "#6d573c", pelo: ["#8a6d4a", "#d8d2c4", "#6b5138", "#c9a03c", "#d8c080", "#c8c8d0", "#f2c84b"] });
      if (d === 1) [66, 118, 170, 222].forEach((x, i) => { const c = ["#e8602a", "#3f8ac0", "#e8402a", "#3f9a4a"][i]; for (let a = 0; a < 9; a += 0.25) k.R(x - 12 + Math.cos(a) * (1 + a * 0.55), 84 + Math.sin(a) * (1 + a * 0.55), 2, 2, c); k.linea(x + 6, 70, x + 13, 74, c, 2); k.linea(x + 6, 78, x + 14, 78, c, 2); k.linea(x - 8, 96, x + 8, 92, c, 2); for (let j = 0; j < 3; j++) k.R(x + 4 + j * 4, 100, 1, 4 + j * 2, c); });
      const P = [ROJO, TIERRA, AZUL, TEJA];
      [[-6, 28], [24, 26], [52, 30], [84, 24], [112, 28], [196, 26], [224, 30], [256, 26], [286, 34]].forEach(([x, w], i) => casaJ2(k, x, 118, w, 14, { techo: P[i % 4], pared: i % 2 ? "#ece0c4" : "#e0d0b0", puerta: false, deposito: i % 3 === 1 }));
      const TR = ["#e0604a", "#c0453a", "#94322a", "#6e241e"];
      cilindro(k, 134, 76, 52, 50, TR, 0.3); k.R(130, 72, 60, 5, "#d8604a"); k.R(130, 76, 60, 1, "#6e241e"); tejadoJ(k, 160, 76, 74, 16, { c: "#8a2f22", luz: "#b5432f", osc: "#5a1f18" }, 4);
      for (let x = 140; x < 180; x += 10) { k.R(x, 86, 6, 8, "#ffd27a"); k.R(x, 94, 6, 1, "#6e241e"); }
      k.elipse(160, 108, 12, 12, "#efe6d0"); k.elipse(160, 108, 10, 10, "#c0392b"); k.R(154, 106, 12, 2, "#efe6d0"); k.R(159, 100, 2, 15, "#efe6d0"); k.linea(159, 106, 153, 113, "#efe6d0"); k.linea(161, 106, 167, 113, "#efe6d0");
      [[-8, 44, 20], [34, 40, 18], [80, 46, 22], [190, 44, 20], [232, 40, 18], [272, 52, 24]].forEach(([x, w, h], i) => casaJ2(k, x, 132, w, h, { techo: P[(i + 1) % 4], deposito: i % 2 === 0, noren: i % 2 ? "#2f6fa8" : "#c0392b", pared: i % 2 ? "#f0e4c8" : "#e8d8b8" }));
      catenaria(k, 86, 96, 216, 100, 9, "#4a3a2a");
      k.suelo(130, "#c9b27e", "#b89f6c", "#dcc794", 180, 500);
      k.alfa(0.25, () => k.R(0, 133, 320, 3, "#5a4a2a"));
      for (let i = 0; i < 26; i++) k.R(k.rnd() * 320, 136 + k.rnd() * 42, 8 + k.rnd() * 14, 1, "#b89f6c");
      poste(k, 34, 150, 44); poste(k, 286, 152, 46); catenaria(k, 35, 110, 287, 110, 12, "#3a2a20");
      catenaria(k, 35, 112, 287, 112, 14, "#3a2a20", (x, y, i) => { if (i % 16 === 4) k.poli([[x - 3, y], [x + 3, y], [x, y + 6]], i % 32 === 4 ? "#c0392b" : "#f4efe0"); });
      marco(k, 2, 170, 2.4); marco(k, 320, 172, 2.6);
      caja(k, 90, 150, 12, 9); barril(k, 216, 152, 10, 12);
    }, { ven: VEN, tinte: 0.2 }],
    2: ["Achiriku Ramen", "El puesto de ramen de noche, con sus cortinas y sus farolillos", (k) => {
      k.banda(["#141a3a", "#1f2a56", "#2f3a6a", "#46508a"], 0, 120); k.estrellas(90, 70);
      const NO = { pared: "#4a4a5e", luz: "#5a5a70", osc: "#38384a", mad: "#3a3048", madL: "#4a405a", madO: "#2a2236", techo: { c: "#3a3048", luz: "#4a405a", osc: "#2a2236" }, ven: "#f2d27a", puerta: false };
      casaJ2(k, 0, 118, 62, 52, NO); casaJ2(k, 258, 118, 62, 48, NO); casaJ2(k, 58, 118, 26, 34, NO); casaJ2(k, 234, 118, 26, 36, NO);
      k.suelo(116, "#4b4453", "#3f3947", "#5a5262", 180, 500); adoquines(k, 118, 180, "#4b4453", "#3a3442", "#565060");
      k.R(90, 56, 140, 66, "#c8a878"); tablas(k, 90, 90, 140, 32, "#b89a68", "#7a5a38", "#d0b080", 8, true);
      k.R(90, 56, 140, 7, "#7a4a2a"); tejadoJ(k, 160, 58, 172, 22, { c: "#8a2f22", luz: "#a83a2c", osc: "#5a1f18" }, 5);
      k.R(96, 64, 128, 30, "#ffe6a8"); k.R(96, 64, 128, 3, "#fff3cf");
      k.R(96, 72, 128, 2, "#a8784a"); for (let x = 102; x < 218; x += 9) { k.R(x, 68, 6, 4, ["#c0392b", "#f4efe0", "#2f6fa8"][x % 3]); }
      [[118, 92], [160, 92], [200, 92]].forEach(([x, y]) => { cilindro(k, x - 9, y - 11, 18, 11, ["#d0d4dc", "#a8acb4", "#787c84"]); k.R(x - 10, y - 12, 20, 2, "#5a5e66"); });
      [[118, 78], [160, 78], [200, 78]].forEach(([x, y]) => k.alfa(0.5, () => { k.elipse(x - 2, y, 3, 3, "#ffffff"); k.elipse(x + 3, y - 4, 3, 3, "#ffffff"); k.elipse(x, y - 8, 2, 2, "#ffffff"); }));
      for (let i = 0; i < 7; i++) { const x = 92 + i * 20; k.R(x, 60, 18, 15, i % 2 ? "#e8e0cc" : "#c0392b"); k.R(x, 60, 18, 2, "#7a2a20"); k.R(x + 17, 60, 1, 15, "#5a2018"); if (i === 3) rotulo(k, x + 3, 65, "RA", "#3a2a20"); if (i === 2) { k.R(x + 6, 65, 6, 6, "#c0392b"); } }
      k.R(86, 98, 148, 8, "#7a4a2a"); k.R(86, 98, 148, 2, "#a06a3c"); k.R(86, 105, 148, 1, "#4a2a18");
      [[108], [134], [160], [186], [212]].forEach(([x]) => { k.R(x, 112, 3, 11, "#5a3a22"); k.elipse(x + 1, 111, 8, 2, "#c0392b"); k.elipse(x + 1, 110, 7, 1, "#e0604a"); });
      [[122, 94], [176, 94]].forEach(([x, y]) => { k.elipse(x, y + 2, 6, 2, "#f4efe0"); k.elipse(x, y + 1, 5, 1, "#e8a040"); k.linea(x + 2, y, x + 7, y - 5, "#c9a03c"); });
      [[84, 66], [236, 66]].forEach(([x, y]) => { k.R(x, y - 8, 1, 60, "#2a2236"); farolillo(k, x, y, "#ff8a5a", 5); k.R(x - 3, y - 2, 7, 1, "#c0502a"); k.R(x - 3, y + 2, 7, 1, "#c0502a"); brillo(k, x, y, 22, 20, "#ff8a5a", 0.6); });
      k.alfa(0.24, () => k.elipse(160, 130, 100, 12, "#ffcf6a")); k.alfa(0.16, () => k.elipse(160, 146, 120, 12, "#ffcf6a"));
      barril(k, 244, 130, 12, 14, ["#6a5a5a", "#54464a", "#3e343a", "#2a2428"]); caja(k, 66, 132, 16, 12, ["#6a5a5a", "#54464a", "#3e343a"]);
    }, { base: "noche", fuego: ["#ffe6a8", "#fff3cf", "#ff8a5a", "#ffcf6a", "#f2d27a", "#ffd27a"] }],
    3: ["El campo de entrenamiento 7", "Los tres postes de madera, en el claro del bosque, y la piedra de los caídos", (k) => {
      k.banda(CIELO, 0, 114);
      nubarron(k, -20, 34, 96, 16); nubarron(k, 240, 26, 100, 18); cirros(k, 5, 4, 24);
      montana(k, 74, 112, 200, 58, { roca: ["#8db4d4", "#7ca4c8", "#6d94bc", "#5e86ae"] }); montana(k, 260, 112, 220, 66, { roca: ["#8db4d4", "#7ca4c8", "#6d94bc", "#5e86ae"] });
      const LE = { tronco: "#4a3424", copa: "#5a9a6a", borde: "#3f8058", luz: "#7cb888", osc: "#4a8a60" };
      for (let x = -6; x < 330; x += 15) k.cumulo(x, 100 + (x % 4) * 2, 11, LE);
      k.suelo(112, "#7fb860", "#6ca450", "#98cc78"); loma(k, [[-20, 118], [100, 112], [230, 122], [340, 114]], 180, ["#98cc78", "#7fb860", "#6ca450", "#5a9244"], 0.08);
      k.hierbas(118, 178, 150); matas(k, 136, 178, 22); flores(k, 124, 178, 34, ["#ffffff", "#f2d24a", "#e8a0c0"]);
      [[-4, 1.8], [36, 2.2], [78, 1.6], [216, 1.8], [258, 2.3], [304, 1.9]].forEach(([x, t], i) => marco(k, x, 120 + (i % 3), t));
      k.alfa(0.6, () => k.elipse(158, 158, 76, 22, "#c8a878")); k.elipse(158, 158, 62, 16, "#c8a878");
      const PO = ["#c09a64", "#8a5f38", "#6c4628", "#4a3020"];
      [[126, 62], [158, 68], [190, 62]].forEach(([x, h]) => { cilindro(k, x, 148 - h, 10, h, PO, 0.3); k.elipse(x + 5, 148 - h, 5, 2, "#c8a878"); k.elipse(x + 5, 148 - h, 3, 1, "#8a5f38"); [122, 130].forEach((y) => { k.R(x - 1, y, 12, 3, "#d8c8a0"); k.R(x - 1, y + 2, 12, 1, "#a89470"); }); k.linea(x + 3, 104, x + 7, 110, "#4a3020"); k.linea(x + 6, 112, x + 2, 116, "#4a3020"); sombra(k, x + 5, 149, 10, 2); });
      rellena(k, [[230, 150], [234, 118], [243, 110], [254, 118], [258, 150]], (x, y) => rampa(["#b8b8c4", "#a0a0ac", "#84848f", "#66666f"], ((x - 230) / 30) * 0.8, x, y)); for (let y = 122; y < 146; y += 4) k.R(238, y, 12, 1, "#66666f"); sombra(k, 244, 151, 18, 2); flores(k, 150, 152, 0, []); [[236, 152, "#ffffff"], [250, 153, "#f2d24a"]].forEach(([x, y, c]) => { k.R(x, y - 3, 1, 3, "#3f8a3a"); k.R(x - 1, y - 4, 3, 2, c); });
      k.R(88, 150, 6, 10, "#6b4a30"); k.R(84, 146, 14, 3, "#8a6440"); k.R(90, 142, 2, 4, "#6b4a30");
      marco(k, 6, 182, 3); marco(k, 322, 184, 3.2);
    }, { tinte: 0.2 }],
    4: ["El Valle del Fin", "La cascada entre las dos estatuas gigantes", (k) => {
      const roto = Det.cuando(k).d === 0;
      k.banda(["#7fb4dc", "#a8cfe6", "#d6e6e6"], 0, 104);
      nubarron(k, 96, 26, 50, 8); nubarron(k, 180, 18, 44, 7); cirros(k, 4, 2, 20);
      const RO = ["#b8ad9c", "#a39888", "#8d8478", "#7d7468", "#6e665c"], RO2 = ["#a8a090", "#8d8478", "#7d7468", "#6e665c", "#5d564e"];
      rellena(k, [[-4, 152], [-4, 96], [76, 100], [116, 104], [120, 152]], estratos(RO)); rellena(k, [[324, 152], [324, 96], [244, 100], [204, 104], [200, 152]], estratos(RO2));
      k.R(0, 96, 118, 3, "#c8bda8"); k.R(204, 98, 116, 3, "#b4a998");
      [[50, 1, RO, "#5d564e"], [270, -1, RO2, "#4a443e"]].forEach(([x, lado, C, pelo], i) => {
        const cuerpo = (px, py) => rampa(C, 0.2 + ((px - (x - 22)) / 44) * 0.6 + (Math.sin(py / 5 + px / 9) > 0.86 ? 0.14 : 0), px, py), cara = (px, py) => rampa(C, 0.12 + ((px - (x - 11)) / 22) * 0.5, px, py);
        if (roto) {  } else if (i) k.poli([[x - 15, 34], [x - 24, 18], [x - 11, 24], [x - 14, 6], [x - 3, 16], [x + 4, 4], [x + 9, 18], [x + 22, 14], [x + 16, 34], [x + 20, 62], [x - 20, 62]], pelo);
        else k.poli([[x - 13, 22], [x + 13, 22], [x + 18, 66], [x + 8, 54], [x - 8, 54], [x - 18, 66]], pelo);
        rellena(k, [[x - 24, 46], [x + 24, 46], [x + 21, 100], [x - 21, 100]], cuerpo);
        k.R(x - 1, 50, 2, 50, C[4]); k.poli([[x - 14, 46], [x, 58], [x + 14, 46]], C[0]); for (let y = 62; y < 98; y += 9) { k.R(x - 20, y, 40, 1, C[3]); }
        k.poli([[x - 24, 48], [x - 30, 56], [x - 22, 68], [x - 16, 58]], C[1]); k.poli([[x + 24, 48], [x + 30, 56], [x + 22, 68], [x + 16, 58]], C[3]);
        if (roto) { [[-22, 4], [-12, 9], [-2, 3], [8, 8], [18, 5]].forEach(([dx, a]) => k.poli([[x + dx, 47], [x + dx + 5, 47 - a], [x + dx + 10, 47]], C[1])); [[x - 34, 102, 22, 10], [x + 14, 104, 26, 12]].forEach(([px, b, w, a]) => pena(k, px, b, w, a, C)); } else {
        rellena(k, [[x + lado * 18, 52], [x + lado * 32, 64], [x + lado * 36, 48], [x + lado * 29, 46], [x + lado * 26, 54], [x + lado * 15, 46]], (px, py) => C[3]); k.R(x + lado * 32 - 3, 30, 7, 18, C[2]); k.R(x + lado * 32 - 1, 30, 2, 18, C[0]);
        bola(k, x, 34, 10, 13, cara); k.R(x - 7, 31, 5, 2, C[4]); k.R(x + 2, 31, 5, 2, C[4]); k.R(x - 1, 34, 2, 5, C[3]); k.R(x - 3, 41, 6, 1, C[4]); k.R(x - 9, 24, 18, 3, C[3]); }
        k.R(x - 22, 100, 44, 5, C[3]); k.R(x - 22, 100, 44, 1, C[0]);
      });
      for (let y = 104; y < 152; y++) { const a = 44 + (y - 104) * 0.2; for (let x = Math.round(160 - a); x <= 160 + a; x++) k.P(x, y, Math.sin(x * 1.7 + y / 13) > 0.5 ? "#e8f8ff" : rampa(["#c8ecf8", "#a8dcf2", "#7fc0e6", "#5aa8d8"], ((Math.sin(x * 0.7) + 1) * 0.5) * 0.9, x, y)); }
      k.R(114, 102, 92, 3, "#ffffff"); espuma(k, 104, 114, 206);
      k.agua(146, 180, ["#3f8fc0", "#2f78a8", "#25648f"], "#a8dcf2", 130); reflejo(k, 150, 180);
      k.niebla(138, 160, "#ffffff", 0.5);
      k.alfa(0.3, () => ["#f27a7a", "#f2d24a", "#7ad88a", "#7ab8f2"].forEach((c, i) => { for (let a = 3.3; a < 6.1; a += 0.01) k.R(160 + Math.cos(a) * (62 - i * 3), 160 + Math.sin(a) * (54 - i * 3), 2, 1, c); }));
      const OR = ["#a39888", "#8d8478", "#6e665c", "#57504a"];
      rellena(k, [[-4, 182], [-4, 148], [40, 152], [84, 150], [104, 158], [96, 170], [120, 182]], estratos(OR)); rellena(k, [[324, 182], [324, 148], [280, 152], [236, 150], [216, 158], [224, 170], [200, 182]], estratos(OR));
      [[20, 170, 30, 14], [66, 176, 24, 10], [236, 176, 26, 11], [286, 170, 32, 14]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, OR));
    }, { tinte: 0.2 }],
    5: ["El Bosque de la Muerte", "Árboles enormes y oscuros tras la valla de alambre", (k) => {
      k.banda(["#26342a", "#2f4634", "#3a5a40"], 0, 144);
      const p = { tronco: "#2a2018", copa: "#1f4a2c", borde: "#143420", luz: "#2f6a3e", osc: "#183c24" }, CO = ["#6a5240", "#4d3a2a", "#3a2a1e", "#2a1e16"];
      [30, 90, 150, 220, 278].forEach((x, i) => { k.R(x, 0, 14 + (i % 2) * 6, 148, "#2f4a38"); k.R(x, 0, 3, 148, "#3a5a44"); });
      k.niebla(60, 130, "#7aa88a", 0.14);
      const tronco = (x, w) => {
        for (let px = x; px < x + w; px++) { const t = (px - x) / w; for (let y = 0; y < 150; y++) k.P(px, y, rampa(CO, Math.abs(t - 0.28) * 1.2 + (Math.sin(px / 2.3 + Math.sin(y / 13) * 2) > 0.6 ? 0.22 : 0), px, y)); }
        [[-20, 158, 6], [-8, 162, 5], [w + 8, 162, 5], [w + 20, 158, 6], [w * 0.5, 164, 4]].forEach(([d, y, g]) => k.linea(x + w / 2 + (d < 0 ? -6 : 6) * 0.4, 128, x + d, y, CO[2], g));
      };
      tronco(-14, 38); tronco(62, 30); tronco(128, 46); tronco(216, 32); tronco(284, 44);
      for (let x = -10; x < 336; x += 19) k.cumulo(x, 8 + (x % 5) * 2, 24, p);
      for (let x = 0; x < 330; x += 23) k.cumulo(x, 34 + (x % 3) * 3, 13, p);
      [[50, 44, 200, 38], [200, 40, 318, 60], [10, 70, 108, 54]].forEach(([a, b, c, d]) => { for (let t = 0; t < 1; t += 0.01) k.R(a + (c - a) * t, b + (d - b) * t + Math.sin(t * 3.14) * 14, 1, 2 + (Math.round(t * 100) % 9 === 0 ? 6 : 0), "#2a5a34"); });
      k.suelo(142, "#2f4a30", "#243a26", "#3f5e3c"); k.hierbas(146, 178, 110, ["#1f4a2c", "#3f6a44"]); matas(k, 150, 178, 18, ["#1f4a2c", "#2f6a3e", "#3f7a4a"]);
      [[40, 170], [210, 174], [120, 164]].forEach(([x, y]) => { k.R(x, y - 5, 2, 5, "#d8cdb4"); k.elipse(x + 1, y - 6, 5, 3, "#a84a8a"); k.P(x - 1, y - 7, "#f0c8e0"); k.P(x + 3, y - 6, "#f0c8e0"); });
      for (let y = 112; y < 158; y += 4) for (let x = (y % 8 ? 2 : 0); x < 320; x += 4) { if (x > 142 && x < 180) continue; k.P(x, y, "#8a8a94"); }
      k.R(0, 110, 142, 2, "#a8a8b4"); k.R(180, 110, 140, 2, "#a8a8b4"); for (let x = 6; x < 320; x += 34) k.R(x, 106, 3, 54, "#6a6a74");
      k.R(142, 104, 4, 56, "#5a5a64"); k.R(176, 104, 4, 56, "#5a5a64"); k.R(138, 98, 46, 8, "#c0392b"); rotulo(k, 156, 100, "44", "#ffffff"); k.linea(146, 112, 176, 156, "#5a5a64"); k.linea(176, 112, 146, 156, "#5a5a64");
      [[64, 128], [250, 130]].forEach(([x, y]) => { k.R(x, y, 26, 14, "#e8c84a"); k.R(x, y, 26, 1, "#26262a"); k.R(x, y + 13, 26, 1, "#26262a"); k.poli([[x + 13, y + 2], [x + 19, y + 12], [x + 7, y + 12]], "#26262a"); k.R(x + 12, y + 5, 2, 4, "#e8c84a"); });
      k.niebla(120, 164, "#9ad0a8", 0.14);
      [[92, 66], [196, 80], [268, 62]].forEach(([x, y]) => { k.P(x, y, "#e8d84a"); k.P(x + 3, y, "#e8d84a"); });
    }, { cielo: "propio", fuerza: 0.62, fuego: ["#e8d84a"] }],
    6: ["El estadio del examen", "La arena de las finales: gradas curvas y llenas, y el palco de los Kega al fondo", (k) => {
      const { h } = Det.cuando(k);
      k.banda(CIELO, 0, 60);
      nubarron(k, 26, 18, 60, 8); nubarron(k, 216, 14, 72, 8);
      k.suelo(90, "#c9a878", "#b5966a", "#dcc094");
      const rim = (u) => 40 - u * u * 26, pie = (u) => 98 + u * u * 34, FILAS = 6;
      for (let x = 0; x < 320; x++) {
        const u = (x - 160) / 165, y0 = Math.round(rim(u)), y1 = Math.round(pie(u));
        for (let y = y0; y < y1; y++) { const f = (y - y0) / (y1 - y0), r = Math.floor(f * FILAS), g = f * FILAS - r; k.P(x, y, g > 0.78 ? "#745a46" : g > 0.66 ? "#c8ae90" : rampa(["#b89a78", "#a8896a", "#8e7056"], 0.2 + Math.abs(u) * 0.5, x, y)); }
        for (let d = 1; d < 5; d++) k.P(x, y0 - d, "#c0392b"); k.P(x, y0 - 5, "#e0604a");
        k.R(x, y1, 1, 3, "#5a4634"); k.P(x, y1, "#94785c");
      }
      for (let r = 0; r < FILAS; r++) for (let u = -1.02; u < 1.02;) {
        const s = 1 + u * u * 1.5, x = 160 + u * 165, y0 = rim(u), y1 = pie(u), y = y0 + ((y1 - y0) * (r + 0.42)) / FILAS, pasillo = [-0.72, -0.4, 0.4, 0.72].some((a) => Math.abs(u - a) < 0.022);
        if (!pasillo && Math.abs(x - 160) > 19 + r * 0.6) { const c = ["#c0392b", "#3f6f9a", "#e8c35a", "#5a9a5a", "#e8e0cc", "#8a5aa8", "#d87a3a"][Math.floor(k.rnd() * 7)]; k.R(x, y, Math.max(1, s * 1.5), Math.max(1, s * 1.5), ["#efc8a0", "#d8a878", "#f2d8b0"][Math.floor(k.rnd() * 3)]); k.R(x - (s > 1.6 ? 1 : 0), y + s * 1.5, Math.max(2, s * 2), Math.max(1, s * 2), c); } else k.rnd();
        u += (0.021 * s) / (1 + u * u * 0.2);
      }
      [-0.72, -0.4, 0.4, 0.72].forEach((u) => { const x = 160 + u * 165; for (let y = rim(u); y < pie(u); y++) { k.R(x - 1, y, 3, 1, "#d8c4a8"); if (y % 4 === 0) k.R(x - 1, y, 3, 1, "#a8896a"); } });
      k.R(143, 30, 34, 36, "#8a2f22"); k.R(143, 30, 3, 36, "#a84038"); k.R(174, 30, 3, 36, "#6a221a"); tejadoJ(k, 160, 31, 46, 9, { c: "#3a2a2a", luz: "#544040", osc: "#241a1a" }, 3);
      k.R(147, 38, 26, 20, "#2a2236"); [[153, "#f4efe0", "#f4efe0"], [167, "#3f6fa8", "#3f6fa8"]].forEach(([x, ropa, gorro]) => { k.R(x - 2, 50, 5, 6, ropa); k.R(x - 1, 47, 3, 3, "#e8c8a0"); k.poli([[x - 3, 47], [x + 3, 47], [x, 44]], gorro); }); k.R(158, 52, 4, 4, "#54402e");
      k.R(146, 58, 28, 3, "#c0392b"); k.R(141, 64, 38, 30, "#8a2f22"); k.R(141, 64, 38, 2, "#a84038"); k.R(141, 92, 38, 2, "#6a221a"); hojaK(k, 158, 79, 7, "#f4efe0");
      k.R(136, 94, 48, 4, "#745a46");
      k.poli([[-4, 182], [-4, 134], [40, 120], [104, 108], [122, 116], [176, 182]], "#9ab060"); k.poli([[144, 182], [198, 116], [216, 108], [280, 120], [324, 134], [324, 182]], "#9ab060");
      k.poli([[82, 182], [126, 116], [194, 116], [238, 182]], "#c9a878"); k.hierbas(112, 178, 80, ["#7a9a4a", "#a8c070"]); matas(k, 130, 178, 14, ["#6e8a42", "#86a050", "#a8c070"]);
      for (let i = 0; i < 24; i++) k.R(84 + k.rnd() * 150, 124 + k.rnd() * 54, 6 + k.rnd() * 10, 1, "#b5966a");
      [[176, 156, 26, 6], [120, 170, 16, 4]].forEach(([x, y, a, b]) => { k.elipse(x, y, a, b, "#a88a60"); k.elipse(x, y + 1, a - 4, b - 2, "#94785a"); });
      marco(k, 34, 138, 1.6); marco(k, 292, 140, 1.8); marco(k, 6, 172, 2.4); marco(k, 318, 174, 2.6);
      [[66, 150, 22, 9], [246, 158, 24, 10]].forEach(([x, b, w, a]) => k.roca(x, b, w, a));
      if (h === 13) for (let i = 0; i < 70; i++) { const x = k.rnd() * 320, y = k.rnd() * 140; k.R(x, y, 3, 1, "#ffffff"); k.P(x + 1, y + 1, "#d8e0e8"); }
    }, { ven: VEN, tinte: 0.2, dx: 80 }],
    7: ["Sanugakure", "La aldea de la Arena, con la gran cúpula del Kezakage entre acantilados", (k) => {
      k.banda(["#e8a860", "#f2c47a", "#f8dfa8"], 0, 110);
      nubarron(k, 90, 16, 54, 8, ["#fff0d8", "#f8d8a8", "#e8b880"]); cirros(k, 6, 4, 34, "#fff0d0");
      const AC = ["#d8ac72", "#c49458", "#a8763f", "#8a5e32"];
      rellena(k, [[-6, 128], [-6, 30], [34, 22], [62, 42], [78, 128]], estratos(AC)); rellena(k, [[326, 128], [326, 26], [284, 18], [254, 44], [240, 128]], estratos(AC));
      k.poli([[-6, 30], [34, 22], [62, 42], [58, 46], [32, 30], [-6, 38]], "#ecc890"); k.poli([[326, 26], [284, 18], [254, 44], [262, 46], [286, 28], [326, 34]], "#ecc890");
      const BA = ["#ecc890", "#d8b07a", "#b58c5a", "#94703f"];
      const casa = (x, b, w, h) => { cilindro(k, x, b - h, w, h, BA, 0.25); k.elipse(x + w / 2, b - h, w / 2, 7, "#e4bc84"); k.elipse(x + w / 2, b - h - 1, w / 2 - 2, 5, "#c79c64"); k.R(x + w / 2 - 2, b - h - 9, 4, 3, "#94703f"); for (let vx = x + 5; vx < x + w - 7; vx += 11) { k.elipse(vx + 2, b - h + 11, 3, 3, "#5a3f2a"); k.R(vx - 1, b - h + 11, 6, 5, "#5a3f2a"); } k.R(x + w / 2 - 4, b - 10, 8, 10, "#4a3020"); k.elipse(x + w / 2, b - 10, 4, 4, "#4a3020"); sombra(k, x + w / 2, b + 1, w * 0.6, 2, "#5a3a1a"); };
      [[64, 112, 30, 26], [98, 110, 22, 20], [198, 110, 24, 22], [226, 112, 30, 28]].forEach(([x, b, w, h]) => casa(x, b, w, h));
      const CU = ["#f2d29c", "#dcb680", "#c79c64", "#a87e48", "#8a6438"];
      cilindro(k, 112, 66, 96, 62, CU, 0.3); bola(k, 160, 66, 49, 40, (x, y) => rampa(CU, 0.1 + ((x - 160) / 49) * 0.34 + ((y - 56) / 40) * 0.3 + 0.2, x, y));
      k.elipse(160, 62, 15, 15, "#7a4a2a"); k.elipse(160, 62, 12, 12, "#efd29c"); k.linea(152, 58, 168, 58, "#7a4a2a", 2); k.linea(150, 62, 170, 62, "#7a4a2a", 2); k.linea(155, 66, 165, 66, "#7a4a2a", 2); k.linea(160, 52, 160, 72, "#7a4a2a", 2);
      for (let a = 0.3; a < 2.9; a += 0.5) { const x = 160 + Math.cos(a) * 42; k.elipse(x, 88, 4, 4, "#4a3020"); k.R(x - 4, 88, 8, 8, "#4a3020"); }
      k.elipse(160, 112, 15, 13, "#4a3020"); k.R(145, 112, 30, 16, "#4a3020"); k.elipse(160, 112, 12, 10, "#2e1f14");
      k.suelo(126, "#e0bc7c", "#cfa866", "#efd29c"); k.alfa(0.3, () => k.R(0, 127, 320, 2, "#8a6438"));
      casa(14, 136, 34, 28); casa(52, 134, 26, 22); casa(236, 134, 28, 24); casa(270, 136, 44, 30);
      catenaria(k, 48, 110, 112, 100, 7, "#6a4a2a"); catenaria(k, 208, 100, 270, 110, 7, "#6a4a2a");
      loma(k, [[-20, 164], [90, 148], [200, 172], [340, 150]], 180, ["#efd29c", "#e0bc7c", "#cfa866", "#b89050"], 0.4);
      for (let i = 0; i < 26; i++) k.R(k.rnd() * 320, 150 + k.rnd() * 28, 10 + k.rnd() * 18, 1, "#cfa866");
      camino(k, 128, 150, (f) => 160, (f) => 12 + f * 8, "#d4ae70", "#e0bc7c"); caja(k, 96, 146, 12, 9); barril(k, 212, 148, 9, 10, ["#c9a878", "#a8845a", "#7a5a3a", "#5a4228"]);
    }, { tinte: 0.45, ven: ["#5a3f2a"], dx: 70 }],
    8: ["El puente de las Olas", "El gran puente sin terminar sobre el mar, perdido entre la niebla", (k) => {
      const acabado = Det.cuando(k).h >= 15;
      k.banda(["#a8c0cc", "#c4d4d8", "#dfe6e2"], 0, 100);
      const NU = ["#eef2f4", "#d4dee2", "#b8c6cc"];
      nubarron(k, -20, 56, 90, 14, NU); nubarron(k, 244, 50, 96, 16, NU);
      montana(k, 60, 100, 170, 34, { roca: ["#a8bcc6", "#92aab6", "#7f98a6", "#6e8896"] }); montana(k, 272, 100, 150, 28, { roca: ["#a8bcc6", "#92aab6", "#7f98a6", "#6e8896"] });
      k.agua(100, 180, ["#6a9ab0", "#4f87a2", "#3f7290", "#2f5f7c"], "#bfe0ea", 200); reflejo(k, 102, 150);
      for (let i = 1; i < 6; i++) { const f = (i / 6) ** 2, y = 96 + 84 * f, a = 18 + 118 * f, h = 4 + 26 * f; [[160 - a - 6 * f], [160 + a]].forEach(([x], j) => { k.R(x, y, 6 + 10 * f, h, j ? "#5f4e3a" : "#6a5842"); k.R(x, y, 2 + 2 * f, h, "#8a7458"); }); }
      const TB = ["#b8a07e", "#9a8466", "#7a664e"];
      rellena(k, [[46, 182], [274, 182], [176, 96], [144, 96]], (x, y) => { const f = (y - 96) / 84, a = 16 + 98 * f, u = (x - 160) / a; return (Math.floor(Math.pow(f, 0.5) * 12) !== Math.floor(Math.pow(f + 0.012, 0.5) * 12)) ? "#6a5842" : Math.abs(Math.round(u * 3) - u * 3) < 0.03 ? "#7a664e" : rampa(TB, 0.3 + u * 0.3, x, y); });
      k.linea(44, 180, 142, 96, "#d0b896", 3); k.linea(276, 180, 178, 96, "#5f4e3a", 3);
      for (let i = 1; i < 7; i++) { const f = (i / 7) ** 2, y = 96 + 84 * f, a = 18 + 104 * f, h = 8 + 50 * f, g = 2 + 3 * f; [[160 - a - g, -1], [160 + a, 1]].forEach(([x, d]) => { k.R(x, y - h, g, h, d < 0 ? "#6a5842" : "#5f4e3a"); k.R(x, y - h, 1, h, "#a89070"); k.linea(x + g / 2, y - h + 3, x - d * a * 0.24, y - h * 0.5, "#5f4e3a"); }); }
      for (let t = 0; t < 1; t += 0.5) { const f1 = 0.1 + t * 0.6, y = 96 + 84 * f1, a = 18 + 104 * f1, h = 8 + 50 * f1; k.linea(160 - a, y - h * 0.8, 150, 88, "#6a5842"); k.linea(160 + a, y - h * 0.8, 170, 88, "#5f4e3a"); }
      if (acabado) { k.R(136, 74, 3, 24, "#5f4e3a"); k.R(181, 74, 3, 24, "#5f4e3a"); k.R(132, 68, 56, 10, "#7a664e"); k.R(132, 68, 56, 1, "#a89070"); rotulo(k, 148, 71, "KARUTO", "#f4efe0"); } else { k.R(146, 76, 3, 22, "#5f4e3a"); k.R(172, 72, 3, 26, "#5f4e3a"); k.R(146, 76, 29, 2, "#5f4e3a"); k.linea(160, 76, 160, 88, "#3a2a20"); k.R(156, 88, 9, 5, "#8a6238"); }
      [[92, 156], [222, 148]].forEach(([x, y]) => { for (let i = 0; i < 4; i++) k.R(x, y - i * 3, 26 - i * 2, 3, i % 2 ? "#c0a070" : "#a88a5c"); sombra(k, x + 12, y + 4, 16, 2); });
      barril(k, 200, 170, 11, 13); caja(k, 120, 176, 14, 11); k.linea(136, 138, 150, 130, "#6a5842", 2);
      k.niebla(86, 136, "#ffffff", 0.36);
      [[40, 118], [256, 124]].forEach(([x, y]) => { k.poli([[x - 12, y], [x + 12, y], [x + 8, y + 5], [x - 8, y + 5]], "#5a4a3a"); k.R(x, y - 12, 1, 12, "#3a2a20"); k.poli([[x + 1, y - 12], [x + 9, y - 3], [x + 1, y - 3]], "#d8d0ba"); });
    }, { tinte: 0.5 }],
    9: ["El monte Myuboko", "La tierra de los sapos, con setas gigantes y cascadas de aceite", (k) => {
      k.banda(["#7fd0c0", "#a8e6c8", "#dcf2c8"], 0, 104);
      const NU = ["#ffffff", "#e4f6e8", "#bce4cc"];
      nubarron(k, -16, 30, 76, 14, NU); nubarron(k, 240, 22, 86, 16, NU);
      const M1 = ["#6cc09a", "#4f9a7a", "#3f8a68", "#2f7458"];
      montana(k, 70, 116, 200, 76, { roca: M1 }); montana(k, 256, 116, 210, 82, { roca: M1 }); montana(k, 160, 116, 180, 54, { roca: ["#57a884", "#3f8a68", "#2f7458", "#246048"] });
      [[52, 116, 26, 78], [106, 116, 18, 52], [214, 116, 20, 56], [266, 116, 28, 84]].forEach(([x, b, w, h]) => rellena(k, [[x, b], [x + w * 0.36, b - h * 0.6], [x + w * 0.6, b - h], [x + w * 0.74, b - h * 0.5], [x + w, b]], (px, py) => rampa(["#d8c080", "#b8a060", "#94804a"], ((px - x) / w) * 0.9, px, py)));
      k.suelo(116, "#7fc060", "#68a84e", "#a0d878"); k.hierbas(122, 178, 130); matas(k, 124, 150, 18, ["#3f8a4a", "#68a84e", "#a0d878"]);
      const AC = ["#fff2b0", "#f2e29a", "#d8c070", "#b8a050"];
      for (let y = 50; y < 130; y++) { const a = 13 + (y - 50) * 0.12; for (let x = Math.round(161 - a); x <= 161 + a; x++) k.P(x, y, rampa(AC, (Math.sin(x * 1.3 + y / 16) + 1) * 0.46, x, y)); }
      k.agua(128, 150, ["#d8c070", "#c9b060", "#b89c4e"], "#fff2b0", 70); espuma(k, 130, 120, 204, "#fff8d0");
      const seta = (x, b, r, h, c) => { cilindro(k, x - r * 0.22, b - h, r * 0.44, h, ["#fff4dc", "#efe2c0", "#cfc29c", "#a89c78"], 0.3); k.R(x - r * 0.3, b - h + 8, r * 0.6, 2, "#cfc29c"); bola(k, x, b - h, r, r * 0.55, (px, py) => (py > b - h + r * 0.28 ? "#efe2c0" : rampa(c, 0.2 + ((px - x) / r) * 0.4 + ((py - b + h) / (r * 0.55)) * 0.3 + 0.2, px, py))); for (let i = 0; i < 5; i++) k.elipse(x - r * 0.7 + i * r * 0.35, b - h - r * 0.2 + (i % 2) * r * 0.2, r * 0.1 + 1, r * 0.08 + 1, "#fff4dc"); sombra(k, x, b + 1, r * 0.8, 2, "#1a3a1a"); };
      const NA = ["#ff9a6a", "#e8704a", "#c8502a"], OC = ["#ffc86a", "#f2a84a", "#c8842a"], RS = ["#f27a9a", "#d84a6a", "#a83050"];
      seta(30, 136, 26, 60, NA); seta(96, 132, 18, 38, OC); seta(228, 132, 22, 50, NA); seta(292, 136, 20, 40, RS); seta(62, 148, 12, 18, RS); seta(260, 150, 11, 16, OC);
      k.suelo(150, "#7fc060", "#68a84e", "#a0d878", 180, 400); k.hierbas(152, 178, 70); flores(k, 152, 178, 40, ["#ffffff", "#f27a9a", "#f2d24a"]);
      const sapo = (x, b, e) => { k.R(x - 9 * e, b - 3, 18 * e, 3, "#8a8a7a"); bola(k, x, b - 11 * e, 11 * e, 9 * e, (px, py) => rampa(["#b8b8a4", "#9a9a86", "#7a7a68"], 0.3 + ((px - x) / (11 * e)) * 0.4, px, py)); esfera(k, x - 6 * e, b - 19 * e, 3 * e, 3 * e, ["#b8b8a4", "#9a9a86", "#7a7a68"]); esfera(k, x + 6 * e, b - 19 * e, 3 * e, 3 * e, ["#b8b8a4", "#9a9a86", "#7a7a68"]); k.R(x - 6 * e, b - 20 * e, 2, 2, "#3a3a34"); k.R(x + 5 * e, b - 20 * e, 2, 2, "#3a3a34"); k.R(x - 6 * e, b - 10 * e, 12 * e, 1, "#5a5a4c"); };
      sapo(92, 158, 1); sapo(232, 160, 1.1);
      camino(k, 150, 180, (f) => 160, (f) => 12 + f * 18, "#b8a070", "#d8c088", "#c4ac74");
      helecho(k, 8, 178, 26, "#3f8a4a", "#2a6a35"); helecho(k, 314, 178, 28, "#3f8a4a", "#2a6a35");
    }, { tinte: 0.55 }],
    11: ["La guarida de Ukatsaki", "Una cueva en la roca bajo una luna roja, con la estatua que guarda dentro", (k) => {
      k.banda(["#1a0d1e", "#2a1228", "#4a1a2a"], 0, 112); k.estrellas(70, 40, ["#a86a7a", "#6a4a5a"]);
      k.astro(236, 44, 22, "#d83a3a", "#7a1f2a"); [[228, 38, 4], [244, 52, 3], [238, 34, 2]].forEach(([x, y, r]) => k.elipse(x, y, r, r, "#a82a30"));
      const NU = ["#5a2a3a", "#3a1a2c", "#2a1224"]; nubarron(k, -20, 34, 110, 12, NU); nubarron(k, 190, 18, 100, 8, NU);
      const R1 = ["#4a3a4e", "#3a2c3e", "#2c2230", "#201826"], R2 = ["#5a4860", "#463a4c", "#3a2c3e", "#2c2230"];
      rellena(k, [[-6, 182], [-6, 72], [60, 54], [120, 74], [180, 58], [250, 84], [326, 72], [326, 182]], estratos(R1));
      rellena(k, [[-6, 182], [-6, 98], [80, 86], [150, 100], [240, 96], [326, 110], [326, 182]], estratos(R2));
      k.elipse(160, 142, 56, 50, "#2a2030"); k.elipse(160, 144, 50, 46, "#120b16"); k.R(110, 144, 100, 40, "#120b16");
      const G = ["#7a6a82", "#5a4a62", "#4a3a52", "#34283c"];
      bola(k, 160, 118, 16, 15, (x, y) => rampa(G, 0.2 + ((x - 160) / 16) * 0.3 + ((y - 118) / 15) * 0.3, x, y)); rellena(k, [[138, 164], [144, 130], [176, 130], [182, 164]], (x, y) => rampa(G, 0.3 + ((x - 160) / 22) * 0.4, x, y));
      k.R(149, 113, 22, 4, "#2a1a30"); [[149, 114], [160, 114], [168, 114], [154, 120], [165, 120]].forEach(([x, y]) => k.R(x, y, 3, 2, "#d83a3a")); k.R(150, 127, 20, 1, "#2a1a30"); for (let i = 0; i < 6; i++) k.R(151 + i * 3, 128, 2, 3, "#c8b8c0");
      [[130, 150], [190, 150]].forEach(([x, y], i) => { for (let f = 0; f < 3; f++) { const px = x + (i ? -1 : 1) * (f * 6 - 4); k.R(px, y - 18 - f * 3, 4, 20 + f * 3, G[1]); k.R(px, y - 18 - f * 3, 1, 20 + f * 3, G[0]); k.R(px, y - 18 - f * 3, 4, 2, "#e8c84a"); } });
      k.linea(100, 96, 220, 96, "#3a2c3e"); k.suelo(158, "#2a2030", "#201826", "#3a2c3e"); k.hierbas(160, 178, 40, ["#4a3a52", "#201826"]);
      [[10, 170, 44, 18], [68, 176, 30, 12], [226, 176, 36, 14], [276, 172, 48, 20]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, R2));
      [[52, 118], [272, 114]].forEach(([x, y]) => { [[-11, 2, 8], [0, -3, 10], [11, 2, 8]].forEach(([dx, dy, r]) => k.elipse(x + dx, y + dy, r + 1, r, "#f4efe0")); [[-11, 2, 7], [0, -3, 9], [11, 2, 7]].forEach(([dx, dy, r]) => k.elipse(x + dx, y + dy, r, r - 1, "#c0392b")); k.R(x - 18, y + 5, 36, 3, "#f4efe0"); k.R(x - 17, y + 5, 34, 2, "#c0392b"); });
    }, { cielo: "propio", base: "noche", astro: "siempre", fuego: ["#d83a3a", "#c0392b", "#f4efe0", "#a82a30"] }],
    12: ["Las puertas de Kanoho", "Las grandes puertas verdes, al final del camino", (k) => {
      k.banda(CIELO, 0, 100);
      nubarron(k, -16, 28, 80, 12); nubarron(k, 244, 22, 88, 13); cirros(k, 4, 2, 20);
      montana(k, 60, 104, 170, 40, { roca: ["#a8c4dc", "#8fb0cc", "#7fa8c8", "#6e98ba"] }); montana(k, 266, 104, 170, 46, { roca: ["#a8c4dc", "#8fb0cc", "#7fa8c8", "#6e98ba"] });
      const MU = { base: "#c0ae92", luz: "#d4c4a8", osc: "#a08c70" };
      sillares(k, 0, 68, 320, 56, MU, 8, 18); k.R(0, 66, 320, 4, "#7a5230"); tejadoJ(k, 30, 67, 120, 7, TEJA, 1); tejadoJ(k, 292, 67, 120, 7, TEJA, 1);
      const VE = ["#4f8f66", "#3f7a55", "#2f6a48", "#1f4a34"];
      for (let x = 92; x < 228; x++) for (let y = 44; y < 124; y++) k.P(x, y, Math.abs(x - 160) < 2 ? "#141c18" : (x % 11 === 0 ? VE[3] : rampa(VE, 0.2 + Math.abs(x - 160) / 180 + (y - 44) / 400, x, y)));
      for (let y = 58; y < 120; y += 26) k.R(92, y, 136, 3, "#2a2a30"); for (let x = 96; x < 226; x += 14) [58, 84, 110].forEach((y) => k.R(x, y + 1, 1, 1, "#a8a8b4"));
      [[126, 92, 1], [194, 92, -1]].forEach(([x, y, d]) => { for (let a = 0; a < 15; a += 0.08) { const r = 1 + a * 0.95; k.R(x + d * Math.cos(a) * r, y + Math.sin(a) * r, 2, 2, "#c0392b"); } k.poli([[x + d * 13, y - 9], [x + d * 22, y - 20], [x + d * 17, y - 3]], "#c0392b"); });
      k.R(84, 34, 152, 11, "#8a2f22"); k.R(84, 34, 152, 2, "#b5432f"); k.R(84, 44, 152, 1, "#5a1f18"); tejadoJ(k, 160, 34, 176, 12, ROJO, 4); rotulo(k, 140, 37, "KANOHO", "#ffe9a8");
      [[84], [228]].forEach(([x]) => { cilindro(k, x - 3, 44, 9, 80, ["#a8604a", "#8a2f22", "#5a1f18"]); });
      k.suelo(124, "#7fb35a", "#6a9e4a", "#98c870"); k.hierbas(128, 178, 90); matas(k, 136, 178, 18); flores(k, 130, 178, 30, ["#ffffff", "#f2d24a"]);
      casaJ2(k, 246, 134, 42, 22, { techo: AZUL, puerta: false, pared: "#f0e4c8" }); k.R(240, 124, 54, 3, "#c9a878"); k.R(238, 127, 58, 7, "#8a6440"); k.R(238, 127, 58, 1, "#a87444"); caja(k, 296, 136, 12, 9);
      rellena(k, [[96, 182], [224, 182], [186, 124], [134, 124]], (x, y) => (((y * 3 + x) % 41 < 2) ? "#b89f6c" : "#c9b27e")); k.linea(134, 124, 96, 180, "#8e7a50"); k.linea(186, 124, 224, 180, "#8e7a50");
      for (let i = 0; i < 24; i++) { const y = 128 + k.rnd() * 50, a = 30 + (y - 124) * 0.8; k.R(160 - a + k.rnd() * 2 * a, y, 6, 1, "#b89f6c"); }
      marco(k, 36, 138, 2); marco(k, 8, 176, 2.8); marco(k, 318, 178, 2.8);
    }, { ven: VEN }],
    13: ["La noche del Nueve Colas", "Kanoho arde la noche en que nace Karuto y ataca el zorro de nueve colas", (k) => {
      k.banda(["#120812", "#2a0f1c", "#5a1a1f", "#a83a1c"], 0, 128); k.estrellas(44, 40, ["#a87a6a", "#7a4a4a"]); k.astro(270, 30, 15, "#f2d8a8", "#7a3a2a");
      const HU = ["#3a1a1c", "#2a1216", "#1f0f14"];
      nubarron(k, -20, 18, 120, 12, HU); nubarron(k, 120, 26, 110, 12, HU);
      monteH(k, 4, { roca: ["#6a3a30", "#5a322a", "#4a2a26", "#361c1c"], luz: "#8a4a3a", osc: "#1f1012", pelo: ["#2f1a1c", "#4a2a26", "#2f1a1c", "#6a4a24"] });
      k.alfa(0.5, () => { for (let i = 0; i < 18; i++) k.elipse(k.rnd() * 320, 26 + k.rnd() * 56, 14 + k.rnd() * 20, 5 + k.rnd() * 5, "#1f0f14"); });
      const t = { pared: "#5a3a34", luz: "#6e4a42", osc: "#42282a", mad: "#3a2422", madL: "#54342e", madO: "#241416", techo: { c: "#6a1f1a", luz: "#8a2f24", osc: "#4a1410" }, ven: "#ffb04a", puerta: false };
      [[-6, 34, 18], [28, 32, 22], [62, 30, 16], [94, 36, 20], [132, 32, 17], [166, 38, 22], [206, 32, 17], [240, 36, 20], [278, 44, 22]].forEach(([x, w, h], i) => casaJ2(k, x, 132, w, h, { ...t, deposito: i % 4 === 1 }));
      [[24, 118, 1.3], [96, 122, 1.5], [176, 116, 1.4], [246, 120, 1.6], [304, 124, 1.3], [60, 124, 0.9], [216, 122, 0.9]].forEach(([x, y, e]) => { k.llama(x, y, e); humo(k, x, y - 24 * e, "#3a2a2a", 0.5, 6); });
      k.suelo(130, "#3a2a24", "#2c1f1c", "#4a362c");
      rellena(k, [[116, 182], [204, 182], [172, 130], [148, 130]], (x, y) => ((x * 3 + y * 7) % 37 < 3 ? "#6a4e3e" : "#5a4234"));
      [[26, 154, 26, 10], [266, 150, 30, 12], [76, 172, 28, 10], [240, 176, 32, 12]].forEach(([x, b, w, h]) => { pena(k, x, b, w, h, ["#5a4238", "#42302a", "#2c1f1c"]); k.linea(x + 4, b - 2, x + w - 2, b - h, "#2a1a14", 2); });
      [[46, 152], [254, 146]].forEach(([x, y]) => k.llama(x, y, 0.5));
      for (let i = 0; i < 46; i++) k.P(k.rnd() * 320, 50 + k.rnd() * 124, "#ffb04a"); for (let i = 0; i < 14; i++) k.R(k.rnd() * 320, 60 + k.rnd() * 100, 2, 2, "#ff9a3a");
    }, { cielo: "propio", base: "noche", astro: "siempre", fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a"] }],
    14: ["El piso de Karuto", "Su cuarto: la cama, los vasos de ramen y la ventana que da al monte de los Hakoge", (k) => {
      const { h } = Det.cuando(k), vasos = Math.max(2, Math.min(12, (h - 1) * 2));
      k.banda(["#cdbb92", "#c4b288", "#b8a67c"], 0, 124);
      tablas(k, 0, 0, 320, 118, "#cdbb92", "#ac9a70", "#dccca4", 22, true);
      k.R(104, 10, 112, 84, "#6b4a30"); k.R(109, 15, 102, 74, "#2a3670");
      rellena(k, [[109, 89], [109, 66], [132, 58], [160, 60], [186, 56], [211, 64], [211, 89]], () => "#5a4e44"); [128, 150, 172, 192].forEach((x) => { k.elipse(x, 72, 7, 8, "#6e6256"); k.R(x - 4, 70, 3, 1, "#3a3028"); k.R(x + 1, 70, 3, 1, "#3a3028"); k.R(x - 1, 72, 2, 3, "#3a3028"); k.R(x - 3, 77, 6, 1, "#3a3028"); });
      for (let i = 0; i < 5; i++) casaJ2(k, 108 + i * 22, 90, 20, 8, { puerta: false, pared: "#7a7264", luz: "#8a8274", osc: "#5a5448", mad: "#4a4238", madL: "#5a5248", madO: "#3a3228", techo: { c: "#5a3a34", luz: "#6e4a42", osc: "#42282a" }, alto: 0.3 });
      k.R(159, 15, 2, 74, "#6b4a30"); k.R(109, 50, 102, 2, "#6b4a30"); k.R(98, 92, 124, 5, "#8a6440"); k.R(98, 92, 124, 1, "#b0885c");
      [[100, 8, 124], [188, 8, 212]].forEach(([x]) => {}); k.poli([[98, 6], [222, 6], [222, 14], [206, 38], [180, 14], [140, 14], [114, 38], [98, 14]], "#f57c1f"); k.poli([[98, 6], [222, 6], [222, 9], [98, 9]], "#c85a10"); for (let x = 104; x < 220; x += 12) k.R(x, 9, 2, 5, "#d86a18");
      k.R(232, 16, 42, 42, "#efe6d0"); k.R(232, 16, 42, 1, "#c8bea8"); k.elipse(253, 37, 15, 15, "#c0392b"); k.elipse(253, 37, 11, 11, "#efe6d0"); k.elipse(253, 37, 7, 7, "#c0392b"); k.elipse(253, 37, 3, 3, "#efe6d0");
      [[248, 30, 254, 36], [262, 40, 256, 38]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, "#3a3a44", 2); });
      k.R(28, 18, 46, 30, "#efe6d0"); k.R(32, 22, 38, 22, "#2f6fa8"); hojaK(k, 48, 33, 5, "#f7d23e");
      k.R(232, 66, 74, 3, "#8a6440"); k.R(232, 69, 74, 1, "#54351f"); [[238, "#c0392b"], [246, "#2f8a5a"], [254, "#f2c84b"], [262, "#3f6f9a"]].forEach(([x, c]) => { k.R(x, 54, 7, 12, c); k.R(x, 54, 1, 12, "#ffffff"); k.R(x + 6, 54, 1, 12, "#26262a"); });
      k.R(280, 58, 11, 8, "#a87444"); k.R(280, 58, 11, 1, "#c99a64"); k.cumulo(285, 52, 7, ARBOL); k.R(284, 44, 2, 4, "#3f8a4a");
      k.R(34, 56, 2, 30, "#5a3a22"); k.poli([[20, 60], [50, 60], [54, 104], [16, 104]], "#f57c1f"); k.R(32, 60, 6, 44, "#26262a"); k.R(20, 60, 30, 3, "#26262a"); k.R(20, 84, 34, 2, "#c85a10");
      k.elipse(296, 40, 7, 8, "#3a8a4a"); k.elipse(296, 40, 5, 6, "#5ab86a"); k.R(292, 37, 2, 2, "#ffffff"); k.R(299, 37, 2, 2, "#ffffff"); k.R(294, 44, 5, 1, "#26262a"); k.R(295, 30, 1, 3, "#c8bea8");
      k.R(0, 116, 320, 8, "#a8926a"); k.R(0, 116, 320, 1, "#c4b288");
      cubierta(k, 124, 180, ["#a87a4a", "#7f5a32", "#b88a58", "#54351f"], 160, 12);
      k.R(0, 106, 88, 46, "#6b4a30"); k.R(0, 98, 86, 28, "#ece4d0"); k.R(0, 118, 86, 14, "#2f5fa8"); k.R(0, 118, 86, 2, "#4a7cc4"); k.R(0, 98, 26, 16, "#ffffff"); k.R(0, 112, 26, 2, "#d8d0ba"); k.R(84, 104, 6, 48, "#54351f");
      k.R(118, 112, 88, 5, "#8a6440"); k.R(118, 112, 88, 1, "#b0885c"); k.R(124, 117, 4, 13, "#54351f"); k.R(196, 117, 4, 13, "#54351f");
      const vaso = (x, y) => { k.R(x, y, 11, 12, "#f4efe0"); k.R(x + 9, y, 2, 12, "#d8cdb4"); k.R(x, y, 11, 3, "#c0392b"); k.R(x + 2, y + 6, 6, 2, "#e8c84a"); };
      [[128, 100], [146, 100], [164, 100], [182, 100]].slice(0, vasos).forEach(([x, y]) => { vaso(x, y); k.R(x + 8, y - 6, 1, 8, "#e8c84a"); k.R(x + 10, y - 6, 1, 8, "#c9a03c"); });
      [[96, 164], [226, 150], [250, 170], [212, 174], [176, 166], [272, 156], [118, 148], [290, 170]].slice(0, Math.max(0, vasos - 4)).forEach(([x, y]) => { vaso(x, y); sombra(k, x + 6, y + 13, 8, 2); });
      k.elipse(150, 164, 10, 4, "#5a4a8a"); k.linea(142, 164, 158, 162, "#7a6aa8");
    }, { cielo: "propio", fuerza: 0.55, ventanal: "#2a3670" }],
    15: ["La Academia", "La escuela de ninjas, con su gran símbolo rojo y el columpio de Karuto", (k) => {
      k.banda(CIELO, 0, 112);
      nubarron(k, -16, 40, 76, 14); nubarron(k, 250, 34, 84, 14); cirros(k, 4, 2, 20);
      loma(k, [[-20, 108], [60, 78], [130, 92], [200, 76], [262, 90], [340, 80]], 126, ["#c8ae88", "#b59a74", "#a08660"], 0.3);
      const PA = ["#ecc8a0", "#d8b088", "#b89270", "#94745a"];
      cilindro(k, 76, 58, 168, 70, PA, 0.2); k.R(76, 80, 168, 4, "#c0392b"); k.R(76, 80, 168, 1, "#e0604a"); k.R(76, 84, 168, 1, "#8a2f22");
      [64, 92].forEach((y) => { for (let x = 88; x < 232; x += 22) { if (y === 92 && x > 136 && x < 172) continue; k.R(x - 1, y - 1, 15, 14, "#94745a"); k.R(x, y, 13, 12, "#55697c"); k.R(x, y, 13, 2, "#7f93a6"); k.R(x + 6, y, 1, 12, "#3f4f60"); k.R(x, y + 6, 13, 1, "#3f4f60"); k.R(x - 2, y + 13, 17, 1, "#f0dcc0"); } });
      k.R(142, 92, 36, 36, "#8a6440"); k.R(146, 96, 28, 32, "#6b4a30"); k.R(159, 96, 2, 32, "#4a3220"); [[152, 112], [166, 112]].forEach(([x, y]) => k.R(x, y, 2, 2, "#e8c35a")); k.R(138, 126, 44, 3, "#c0b49c");
      tejadoJ(k, 160, 58, 196, 15, ROJO, 5);
      k.elipse(160, 32, 21, 21, "#8a2f22"); k.elipse(160, 32, 18, 18, "#f2c46a"); for (let a = 0; a < 13; a += 0.08) { const r = 1 + a * 1.05; k.R(160 + Math.cos(a) * r, 32 + Math.sin(a) * r, 2, 2, "#c0392b"); } k.R(158, 50, 4, 6, "#8a2f22");
      k.suelo(126, "#c9b27e", "#b89f6c", "#dcc794"); k.alfa(0.3, () => k.R(0, 127, 320, 2, "#6a5a3a")); k.hierbas(130, 178, 50, ["#9ab060", "#b89f6c"]);
      marco(k, 40, 136, 2.2); k.R(52, 96, 32, 3, "#5b3a24"); k.R(52, 96, 32, 1, "#7a5230"); k.linea(62, 99, 62, 126, "#3a2a20"); k.linea(76, 99, 76, 126, "#3a2a20"); k.R(59, 126, 20, 3, "#7a5230"); k.R(59, 126, 20, 1, "#a87444"); sombra(k, 68, 136, 12, 2);
      [[104, 148], [226, 150]].forEach(([x, b]) => { k.R(x - 1, b - 14, 3, 14, "#6b4a30"); k.elipse(x, b - 18, 8, 8, "#efe6d0"); k.elipse(x, b - 18, 6, 6, "#c0392b"); k.elipse(x, b - 18, 3, 3, "#efe6d0"); k.elipse(x, b - 18, 1, 1, "#c0392b"); sombra(k, x, b + 1, 7, 1); });
      [[262, 1.8], [302, 2.1]].forEach(([x, t]) => marco(k, x, 136, t));
      for (let x = 0; x < 320; x += 13) { if (x > 40 && x < 268) continue; k.R(x, 142, 2, 10, "#8a6440"); } k.R(0, 145, 40, 2, "#a87444"); k.R(268, 145, 52, 2, "#a87444");
      camino(k, 128, 180, (f) => 160, (f) => 18 + f * 26, "#c4ad7c", "#d6c08e", "#b89f6c");
    }, { ven: ["#55697c", "#ffd27a"], dx: 70 }],
    16: ["La ciudad de Tunzaka", "La ciudad del castillo y los farolillos, donde encuentran a Tsanude", (k) => {
      const roto = Det.cuando(k).h >= 15;
      k.banda(["#e8a860", "#f2c47a", "#f8dfa8"], 0, 116);
      const CR = ["#fff0d8", "#f8d8a8", "#e8b880"];
      nubarron(k, -16, 40, 84, 15, CR); nubarron(k, 246, 34, 86, 16, CR);
      montana(k, 66, 112, 190, 42, { roca: ["#c89c6a", "#b58a5a", "#a07a4e", "#8c6a42"] }); montana(k, 266, 112, 180, 38, { roca: ["#c89c6a", "#b58a5a", "#a07a4e", "#8c6a42"] });
      const BL = ["#fbf4e4", "#efe6d0", "#d4c8ae", "#b4a888"], T = { c: "#3f5f6a", luz: "#5a7c88", osc: "#2c4650" };
      const Q = { base: "#94887a", luz: "#a89c8c", osc: "#74695e" };
      rellena(k, [[86, 128], [98, 90], [222, 90], [234, 128]], (x, y) => rampa(["#a89c8c", "#94887a", "#74695e"], ((x - 86) / 148) * 0.8 + (((x + (y >> 2) * 5) % 14 < 1 || y % 6 === 0) ? 0.2 : 0), x, y));
      cilindro(k, 112, 62, 96, 30, BL, 0.25); tejadoJ(k, 160, 64, 128, 13, T, 5);
      if (roto) { [[116, 66, 30, 18], [150, 68, 34, 24], [186, 66, 26, 16]].forEach(([x, b, w, a]) => pena(k, x, b, w, a, ["#efe6d0", "#d4c8ae", "#94887a", "#74695e"])); k.linea(128, 50, 150, 64, "#3f5f6a", 3); k.linea(176, 44, 192, 62, "#2c4650", 3); humo(k, 160, 42, "#c8bca8", 0.5, 7); } else {
      cilindro(k, 130, 36, 60, 18, BL, 0.25); tejadoJ(k, 160, 38, 84, 12, T, 4); cilindro(k, 146, 16, 28, 12, BL, 0.25); tejadoJ(k, 160, 18, 48, 11, T, 3);
      [144, 168].forEach((x) => k.R(x, 41, 7, 8, "#55697c")); k.R(157, 19, 6, 6, "#55697c");
      [[150, 8, 1], [170, 8, -1]].forEach(([x, y, d]) => k.poli([[x, y], [x + d * 4, y - 5], [x + d * 7, y + 1]], "#c9a03c")); }
      k.poli([[150, 64], [170, 64], [160, 56]], "#efe6d0"); k.poli([[154, 64], [166, 64], [160, 59]], T.c);
      for (let x = 120; x < 202; x += 12) { k.R(x, 70, 7, 9, "#55697c"); k.R(x, 79, 8, 1, "#b4a888"); }
      k.suelo(126, "#b8a58a", "#a8957a", "#c8b59a");
      const c = { pared: "#e8dcc0", luz: "#f6ecd4", osc: "#c4b598", techo: TEJA, ven: "#ffd27a" };
      casaJ2(k, -6, 132, 50, 32, { ...c, noren: "#c0392b", deposito: false }); casaJ2(k, 44, 130, 42, 24, { ...c, noren: "#2f6fa8", techo: TIERRA }); casaJ2(k, 234, 130, 42, 24, { ...c, noren: "#3f8a58", techo: TIERRA }); casaJ2(k, 276, 132, 50, 32, { ...c, noren: "#c0392b" });
      rellena(k, [[110, 182], [210, 182], [176, 126], [144, 126]], (x, y) => ((x + y * 5) % 29 < 2 ? "#b8a58a" : "#d0bda2"));
      [[0, 102, 104, 118], [320, 102, 216, 118]].forEach(([a, b, c2, d]) => catenaria(k, a, b, c2, d, 5, "#3a2a20", (x, y, i) => { if (i % 15 === 7) { farolillo(k, x, y + 4, "#e8402a", 2); k.R(x - 1, y + 3, 3, 1, "#ffb04a"); } }));
      [[96, 150, "#c0392b"], [224, 152, "#2f6fa8"]].forEach(([x, b, col]) => { k.R(x - 12, b - 8, 26, 8, "#8a6440"); k.R(x - 12, b - 8, 26, 1, "#a87444"); k.R(x - 11, b - 24, 2, 16, "#5a3a22"); k.R(x + 11, b - 24, 2, 16, "#5a3a22"); for (let i = 0; i < 7; i++) k.R(x - 14 + i * 4, b - 28, 4, 5, i % 2 ? "#f4efe0" : col); [[-6], [2], [9]].forEach(([d]) => k.elipse(x + d, b - 10, 3, 2, "#f2c84b")); sombra(k, x, b + 1, 16, 2); });
      for (let i = 0; i < 18; i++) k.R(k.rnd() * 320, 134 + k.rnd() * 44, 6 + k.rnd() * 10, 1, "#a8957a");
    }, { ven: ["#ffd27a", "#55697c"], tinte: 0.2, fuego: ["#e8402a", "#ffb04a"], dx: 76 }],
    17: ["Las aguas termales", "El baño de piedra entre vapor, con la valla por la que espía Jariiya", (k) => {
      k.banda(["#2a3670", "#46508a", "#7f86b0"], 0, 88);
      montana(k, 70, 92, 180, 42, { roca: ["#5a6c7c", "#4f6070", "#3f5060", "#344454"] }); montana(k, 260, 92, 180, 48, { roca: ["#5a6c7c", "#4f6070", "#3f5060", "#344454"] });
      for (let x = -8; x < 330; x += 15) k.pino(x, 96 + (x % 3), 30, { tronco: "#2a2018", copa: "#1f4a3a", luz: "#2f5f4a", osc: "#163a2c" });
      for (let x = 0, i = 0; x < 320; x += 8, i++) { cilindro(k, x, 62, 8, 62, ["#d4bc78", "#b8a060", "#a8904f", "#7f6a34"], 0.3); k.elipse(x + 4, 62, 4, 2, "#8a7440"); k.R(x, 84, 8, 1, "#7f6a34"); k.R(x, 104, 8, 1, "#7f6a34"); }
      k.R(0, 76, 320, 3, "#6b4a30"); k.R(0, 76, 320, 1, "#8a6440"); k.R(0, 108, 320, 3, "#6b4a30"); k.R(0, 108, 320, 1, "#8a6440"); k.R(184, 62, 8, 14, "#2a2018"); k.R(186, 66, 2, 2, "#e8e0cc"); k.R(189, 66, 2, 2, "#e8e0cc");
      tejadoJ(k, 40, 60, 104, 10, { c: "#4a3a30", luz: "#5a4a3e", osc: "#2e2420" }, 3); tablas(k, 8, 60, 64, 50, "#6b4a30", "#4a3020", "#8a6440", 6, true); k.R(20, 72, 40, 20, "#ffd27a"); k.R(40, 72, 1, 20, "#4a3020"); k.R(20, 82, 40, 1, "#4a3020"); for (let i = 0; i < 5; i++) k.R(20 + i * 8, 62, 8, 8, i % 2 ? "#f4efe0" : "#2f6fa8"); brillo(k, 40, 80, 24, 20, "#ffcf6a", 0.5);
      k.suelo(122, "#7d7468", "#6e665c", "#8d8478");
      for (let a = 0; a < 6.28; a += 0.12) { const x = 150 + Math.cos(a) * 112, y = 152 + Math.sin(a) * 25; esfera(k, x, y, 8, 5, ["#a39888", "#7d7468", "#57504a"]); }
      k.elipse(150, 152, 104, 21, "#3f84a0"); k.elipse(150, 152, 100, 19, "#4f94b0"); k.elipse(146, 148, 84, 13, "#6fb4cc");
      for (let i = 0; i < 26; i++) { const a = k.rnd() * 6.28, r = k.rnd(), x = 150 + Math.cos(a) * r * 92, y = 152 + Math.sin(a) * r * 16; k.R(x, y, 6 + k.rnd() * 12, 1, "#a8dcea"); }
      [[40, 134, 30, 12], [262, 138, 36, 14], [18, 172, 36, 14], [264, 176, 42, 14]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#a39888", "#8d8478", "#6e665c", "#57504a"]));
      k.linea(240, 118, 214, 134, "#a8904f", 4); k.linea(240, 117, 214, 133, "#d4bc78"); for (let i = 0; i < 10; i++) k.P(212 - (i % 3), 134 + i * 1.6, "#c8ecf8");
      cilindro(k, 90, 172, 15, 12, ["#c0895a", "#a87444", "#7a5230"]); k.R(90, 174, 15, 1, "#3a2a20"); k.R(90, 180, 15, 1, "#3a2a20"); k.R(92, 170, 1, 3, "#7a5230"); k.R(102, 170, 1, 3, "#7a5230"); k.R(92, 169, 11, 1, "#7a5230");
      [[292, 146]].forEach(([x, b]) => { k.R(x - 3, b - 16, 6, 16, "#8d8478"); k.R(x - 7, b - 18, 14, 3, "#a39888"); k.R(x - 5, b - 25, 10, 7, "#ffd27a"); k.R(x - 1, b - 25, 2, 7, "#8d8478"); k.poli([[x - 9, b - 25], [x + 9, b - 25], [x, b - 33]], "#a39888"); brillo(k, x, b - 22, 18, 14, "#ffcf6a", 0.6); });
      k.alfa(0.3, () => { for (let i = 0; i < 20; i++) k.elipse(60 + k.rnd() * 190, 116 + k.rnd() * 48, 12 + k.rnd() * 14, 5 + k.rnd() * 5, "#f4f8fa"); });
    }, { tinte: 0.1, ven: [], fuego: ["#ffd27a"] }],
    18: ["La guarida de Irochomura", "Los túneles de piedra bajo tierra, con antorchas y una serpiente tallada en el arco", (k) => {
      k.banda(["#14121a", "#1c1a24", "#262230"], 0, 134);
      for (let y = 4, f = 0; y < 134; y += 11, f++) { k.R(0, y, 320, 1, "#100e16"); for (let x = (f % 2 ? 8 : 24); x < 320; x += 32) { k.R(x, y, 1, 11, "#100e16"); if ((x + y * 3) % 5 === 0) k.R(x + 1, y + 1, 30, 10, "#2a2632"); } }
      rellena(k, [[96, 134], [96, 44], [120, 16], [200, 16], [224, 44], [224, 134]], (x, y) => rampa(["#5a5468", "#4a4458", "#3a3446", "#2a2636"], 0.1 + ((x - 96) / 128) * 0.7 + (((x * 3 + y) % 23 < 2) ? 0.16 : 0), x, y));
      k.poli([[112, 134], [112, 50], [130, 28], [190, 28], [208, 50], [208, 134]], "#08060c");
      for (let i = 0; i < 5; i++) { const a = 1 - i / 5, w = 92 * a, h = 100 * a; rellena(k, [[160 - w / 2, 134 - i * 8], [160 - w / 2, 134 - i * 8 - h * 0.72], [160 - w * 0.3, 134 - i * 8 - h], [160 + w * 0.3, 134 - i * 8 - h], [160 + w / 2, 134 - i * 8 - h * 0.72], [160 + w / 2, 134 - i * 8]], (x, y) => (Det.trama(x, y) < 0.1 + i * 0.1 ? "#2a1a48" : "#08060c")); }
      k.halo(160, 100, 26, 24, "#6a3fa8", 0.5); k.elipse(160, 100, 5, 7, "#c8a8f8");
      for (let t = 0; t < 110; t++) { const x = 104 + t * 1.02, y = 13 + Math.sin(t / 6) * 5; bola(k, x, y, 3, 3, (px, py) => (((px + py) % 4 < 1) ? "#3f5a42" : rampa(["#7a9a7a", "#5a7a5a", "#46624a"], 0.5 + (py - y) / 6, px, py))); }
      esfera(k, 218, 14, 8, 6, ["#7a9a7a", "#5a7a5a", "#46624a"]); k.R(219, 11, 3, 2, "#e8c84a"); k.R(220, 11, 1, 2, "#26262a"); k.linea(226, 16, 232, 18, "#c0392b"); k.P(233, 17, "#c0392b"); k.P(233, 19, "#c0392b");
      [[84, 66], [236, 66]].forEach(([x, y]) => { k.R(x - 1, y, 3, 16, "#5a3a22"); k.R(x - 3, y - 1, 7, 2, "#7a6a4a"); k.halo(x, y - 6, 18, 18, "#ff9a3a", 0.26); k.llama(x, y, 0.55); });
      [[10, 46], [264, 46]].forEach(([x, w]) => { k.R(x, 62, w, 72, "#0c0a12"); for (let b = x + 3; b < x + w; b += 8) cilindro(k, b, 62, 3, 72, ["#7a7468", "#57504a", "#3a3430"]); k.R(x, 62, w, 4, "#57504a"); k.R(x, 62, w, 1, "#7a7468"); k.R(x, 96, w, 3, "#57504a"); });
      [[108, 118], [204, 118]].forEach(([x, y]) => { k.R(x - 5, y + 14, 12, 2, "#3a3446"); k.R(x - 5, y, 11, 14, "#3a7a5a"); k.R(x - 5, y, 2, 14, "#7ae8b0"); k.R(x - 6, y - 2, 13, 2, "#7a7468"); k.elipse(x, y + 7, 2, 3, "#c8e8d0"); });
      k.suelo(132, "#3a3446", "#302a3c", "#464054"); for (let y = 140, f = 0; y < 180; y += 8 + f * 2, f++) { k.R(0, y, 320, 1, "#2a2434"); for (let x = (f % 2) * 22; x < 320; x += 44 + f * 8) k.R(x, y, 1, 8 + f * 2, "#2a2434"); }
      rellena(k, [[116, 182], [204, 182], [176, 132], [144, 132]], (x, y) => ((x + y * 3) % 31 < 2 ? "#3a3446" : "#4a4458"));
      k.alfa(0.2, () => k.elipse(160, 136, 40, 5, "#6a3fa8"));
      [[66, 170], [254, 164]].forEach(([x, y]) => { for (let a = 0; a < 8; a += 0.3) { const r = 1 + a * 0.9; k.R(x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.7, 3, 2, "#46624a"); } k.R(x + 8, y - 4, 2, 2, "#e8c84a"); });
    }, { cielo: "propio", fuerza: 0.06, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#6a3fa8", "#2a1a48", "#c8a8f8", "#7ae8b0", "#3a7a5a", "#c8e8d0"] }],
    19: ["El bosque de los Kara", "El bosque de los ciervos, con la luz colándose entre los troncos", (k) => {
      k.banda(["#9ac8e0", "#c4e0e0", "#e8efd8"], 0, 134);
      const p = { tronco: "#4a3424", copa: "#3f7a45", borde: "#2a5a35", luz: "#5f9a58", osc: "#2f6a3a" }, CO = ["#7a5a42", "#5e4630", "#4a3424", "#33241a"];
      k.R(0, 58, 320, 76, "#b4d4a0"); for (let x = 0; x < 320; x += 11) k.R(x, 50 + (x % 7) * 3, 5, 84, "#a0c490");
      [[8, 7], [44, 6], [98, 5], [128, 7], [176, 6], [212, 5], [250, 7], [296, 6]].forEach(([x, w]) => k.R(x, 0, w, 134, "#6f8a5a"));
      k.niebla(80, 132, "#e8f0d8", 0.22);
      for (let x = -6; x < 330; x += 17) k.cumulo(x, 6 + (x % 5), 22, p); for (let x = 4; x < 330; x += 24) k.cumulo(x, 28 + (x % 3) * 2, 12, p);
      k.suelo(130, "#6fa050", "#5c8c44", "#8cb868"); k.hierbas(134, 178, 110, ["#5c8c44", "#a8d080"]);
      [[18, 18], [78, 22], [198, 20], [262, 24], [310, 16]].forEach(([x, w]) => { for (let px = x; px < x + w; px++) { const t = (px - x) / w; for (let y = 24; y < 138; y++) k.P(px, y, rampa(CO, Math.abs(t - 0.3) * 1.2 + (Math.sin(px / 1.9 + Math.sin(y / 12) * 2) > 0.6 ? 0.2 : 0), px, y)); } [[-12, 146], [w + 12, 146], [w * 0.5, 148]].forEach(([d, y]) => k.linea(x + w / 2, 130, x + d, y, CO[2], 3)); });
      k.alfa(0.14, () => [[116, 34], [156, 26], [236, 30]].forEach(([x, w]) => k.poli([[x, 30], [x + w, 30], [x + w + 34, 136], [x + 20, 136]], "#fff8d0")));
      k.alfa(0.3, () => [[126, 150, 18], [176, 158, 22], [246, 148, 16]].forEach(([x, y, a]) => k.elipse(x, y, a, 3, "#d8e890")));
      const ciervo = (x, b, d, e = 1) => { const c = "#a87a4a", o = "#7a5230"; k.elipse(x, b - 11 * e, 10 * e, 5 * e, c); k.R(x - 8 * e, b - 8 * e, 2, 8 * e, o); k.R(x - 5 * e, b - 8 * e, 2, 8 * e, c); k.R(x + 4 * e, b - 8 * e, 2, 8 * e, o); k.R(x + 7 * e, b - 8 * e, 2, 8 * e, c); k.linea(x + d * 8 * e, b - 13 * e, x + d * 13 * e, b - 20 * e, c, 3); k.elipse(x + d * 15 * e, b - 22 * e, 4 * e, 3 * e, c); k.P(x + d * 16 * e, b - 23 * e, "#26262a"); [[3, -8], [7, -6], [1, -10]].forEach(([a, h]) => k.linea(x + d * 13 * e, b - 24 * e, x + d * (13 + a) * e, b - (24 - h) * e, "#d8c8a0")); for (let i = 0; i < 4; i++) k.P(x - 4 + i * 3, b - 13 * e + (i % 2), "#f4efe0"); sombra(k, x, b + 1, 10 * e, 2); };
      ciervo(136, 146, 1, 0.8); ciervo(240, 150, -1, 0.9);
      helecho(k, 40, 176, 22, "#4f9a4a", "#2a6a35"); helecho(k, 290, 178, 24, "#4f9a4a", "#2a6a35"); helecho(k, 116, 178, 16, "#4f9a4a", "#2a6a35"); helecho(k, 206, 178, 18, "#4f9a4a", "#2a6a35");
      [[110, 158], [214, 168], [142, 174], [58, 162]].forEach(([x, y]) => { k.R(x, y - 4, 1, 4, "#e8e0cc"); k.elipse(x, y - 5, 3, 2, "#c0392b"); k.P(x - 1, y - 6, "#f4efe0"); });
      for (let i = 0; i < 26; i++) k.P(k.rnd() * 320, 40 + k.rnd() * 110, "#f4f0a8");
    }, { tinte: 0.1, cielo: "propio", fuerza: 0.9 }],
    20: ["Emagakure", "La aldea de la lluvia, con sus torres de hierro y sus tuberías", (k) => {
      k.banda(["#3f4756", "#565e6e", "#727a88"], 0, 128);
      nubarron(k, -24, 10, 170, 12, ["#6a7484", "#545e6e", "#3f4756"]); nubarron(k, 140, 6, 190, 12, ["#6a7484", "#545e6e", "#3f4756"]);
      const M = ["#5a626e", "#3f4652", "#343a46", "#2a303a"];
      [[20, 18, 76], [60, 14, 50], [100, 16, 88], [204, 16, 84], [244, 14, 56], [286, 18, 70]].forEach(([x, w, h]) => { k.R(x, 124 - h, w, h, "#5a6270"); });
      [[0, 30, 92], [34, 24, 64], [62, 26, 110], [234, 26, 104], [264, 24, 70], [292, 30, 96]].forEach(([x, w, h]) => {
        cilindro(k, x, 128 - h, w, h, M, 0.2); k.R(x - 1, 128 - h - 2, w + 2, 3, "#2a303a"); k.R(x + w * 0.3, 128 - h - 10, 2, 9, "#2a303a"); k.R(x + w * 0.7, 128 - h - 6, 2, 5, "#2a303a");
        for (let y = 128 - h + 6; y < 120; y += 12) for (let v = x + 5; v < x + w - 5; v += 8) { k.R(v, y, 3, 5, "#ffd27a"); k.R(v, y + 5, 4, 1, "#2a303a"); }
      });
      cilindro(k, 116, 22, 88, 106, M, 0.25); bola(k, 160, 46, 38, 32, (x, y) => rampa(M, 0.2 + ((x - 160) / 38) * 0.4 + ((y - 46) / 32) * 0.3, x, y));
      k.elipse(146, 42, 8, 7, "#1f242e"); k.elipse(174, 42, 8, 7, "#1f242e"); k.elipse(146, 42, 3, 3, "#e8e0cc"); k.elipse(174, 42, 3, 3, "#e8e0cc"); for (let a = 0; a < 6.3; a += 0.8) { k.P(146 + Math.cos(a) * 6, 42 + Math.sin(a) * 5, "#5a626e"); k.P(174 + Math.cos(a) * 6, 42 + Math.sin(a) * 5, "#5a626e"); }
      for (let i = 0; i < 7; i++) { const x = 134 + i * 8; cilindro(k, x, 60, 6, 14 + (i % 2) * 8 + Math.abs(3 - i) * -1, ["#6a7484", "#454e5c", "#2a303a"]); }
      for (let y = 96; y < 126; y += 10) for (let x = 124; x < 200; x += 12) k.R(x, y, 6, 6, "#ffd27a");
      k.R(148, 108, 24, 20, "#1f242e"); k.elipse(160, 108, 12, 8, "#1f242e");
      [[92, 76, 116, 88], [204, 80, 234, 70], [24, 60, 62, 74], [258, 66, 292, 58]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, "#2a303a", 4); k.linea(a, b - 1, c, d - 1, "#6a7484"); });
      k.R(0, 106, 320, 4, "#5e6674"); k.R(0, 106, 320, 1, "#7a8290"); k.R(0, 118, 320, 3, "#525a66"); for (let x = 12; x < 320; x += 23) k.R(x, 100, 3, 22, "#46505c");
      k.suelo(128, "#454b54", "#3a4048", "#525860");
      for (let y = 134, f = 0; y < 180; y += 8 + f, f++) { k.R(0, y, 320, 1, "#343a42"); for (let x = (f % 2) * 16; x < 320; x += 32 + f * 5) k.R(x, y, 1, 8 + f, "#343a42"); }
      [[110, 150, 44, 5], [196, 166, 58, 6], [60, 170, 38, 4], [270, 146, 32, 4]].forEach(([x, y, a, b]) => { k.elipse(x, y, a, b, "#6a7484"); k.elipse(x - 4, y, a * 0.6, b * 0.5, "#8a94a4"); for (let i = 0; i < 4; i++) k.R(x - a * 0.6 + k.rnd() * a * 1.2, y - 1 + k.rnd() * 2, 6, 1, "#ffd27a"); });
      for (let i = 0; i < 300; i++) { const x = k.rnd() * 320, y = k.rnd() * 176, l = 3 + k.rnd() * 3; k.R(x, y, 1, l, "#9aa4b4"); k.P(x - 1, y + l, "#9aa4b4"); }
      k.niebla(96, 132, "#8a94a4", 0.14);
    }, { tinte: 0.85, ven: ["#ffd27a"] }],
    21: ["Kanoho destruida", "El gran cráter que deja Pian, con la montaña de los Hakoge al fondo", (k) => {
      k.banda(["#7f96ac", "#a0b0bc", "#ccd0cc"], 0, 112);
      const NU = ["#d8dcde", "#c0c4ca", "#9ca2ac"];
      nubarron(k, -20, 30, 110, 16, NU); nubarron(k, 220, 24, 120, 18, NU);
      monteH(k, 5, { roca: ["#c0a57e", "#a68a64", "#8c7250", "#74603f"], luz: "#d2ba92", osc: "#54402a", pelo: ["#8a6d4a", "#d8d2c4", "#6b5138", "#c9a03c", "#d8c080"] });
      humo(k, 90, 120, "#a8a4a0", 0.45, 7); humo(k, 240, 118, "#a8a4a0", 0.45, 7, -1);
      k.suelo(122, "#a08a70", "#8f7a60", "#b09a80");
      bola(k, 160, 164, 210, 46, (x, y) => rampa(["#a08a70", "#8a7660", "#75634f", "#645441", "#54463a"], 0.1 + (1 - Math.hypot((x - 160) / 210, (y - 186) / 66)) * 1.1, x, y));
      for (let i = 0; i < 14; i++) { const a = (i / 14) * 3.14 + 3.14, x0 = 160 + Math.cos(a) * 60, y0 = 178 + Math.sin(a) * 24; k.linea(x0, y0, 160 + Math.cos(a) * 170, 182 + Math.sin(a) * 50, "#54463a"); }
      const ROT = (x, b, w, h) => { rellena(k, [[x, b], [x, b - h], [x + w * 0.3, b - h - 4], [x + w * 0.5, b - h + 6], [x + w * 0.8, b - h + 2], [x + w, b - h + 12], [x + w, b]], (px, py) => ((px + py * 3) % 11 < 1 ? "#a8988a" : "#c8b8a0")); k.R(x + w * 0.2, b - h + 10, w * 0.26, h * 0.3, "#3a3028"); k.linea(x + 2, b - h + 3, x + w, b - 4, "#6b4a30", 2); };
      ROT(10, 132, 34, 22); ROT(58, 126, 26, 16); ROT(224, 124, 30, 16); ROT(272, 132, 42, 24);
      [[8, 134, 44, 16], [60, 128, 26, 10], [216, 126, 34, 12], [270, 134, 50, 18], [-6, 166, 44, 16], [296, 172, 38, 14], [94, 138, 22, 8], [200, 142, 26, 9]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#a39888", "#8d8478", "#6e665c", "#57504a"]));
      [[36, 122], [246, 120]].forEach(([x, b]) => { k.linea(x, b, x + 6, b - 20, "#6b4a30", 2); k.linea(x + 14, b, x + 8, b - 14, "#6b4a30", 2); k.poli([[x - 4, b - 14], [x + 20, b - 20], [x + 16, b - 12]], "#8a2f22"); });
      cilindro(k, 118, 150, 15, 10, ["#b8c4cc", "#8c9aa4", "#6c7a84"]); k.elipse(133, 155, 3, 5, "#6c7a84");
      k.niebla(116, 150, "#d8d0c4", 0.22);
    }, { tinte: 0.35, ven: [] }],
    22: ["El barrio Ichuha", "Las calles vacías bajo la luna, con el abanico de los Ichuha en las paredes", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#141a3a", "#1f2a56", "#2f3a6a"], 0, 112);
      if (h >= 3 && h <= 5) { const s = Horas.sol(h); for (let y = -s.r; y <= s.r; y++) { const w = Math.sqrt(s.r * s.r - y * y); k.crudo(s.x - w, s.y + y, 2 * w, 1, y > 4 ? "#a82a30" : "#d83a3a"); } }
      const a = (x, y, r) => { k.elipse(x, y, r, r, "#efe6d0"); for (let j = -r; j <= 0; j++) { const w = Math.sqrt(r * r - j * j); k.R(x - w, y + j, 2 * w, 1, "#c0392b"); } k.R(x - 1, y + r, 3, r, "#efe6d0"); };
      const m = { pared: "#55525e", luz: "#66636f", osc: "#45424e", mad: "#3a3744", madL: "#4a4754", madO: "#26232e", techo: { c: "#2f2c3a", luz: "#3f3c4a", osc: "#221f2c" }, ven: "#ffd27a" };
      casaJ2(k, 72, 116, 30, 22, { ...m, puerta: false }); casaJ2(k, 218, 116, 30, 22, { ...m, puerta: false });
      tablas(k, 96, 72, 128, 54, "#55525e", "#4a4752", "#66636f", 16, true); k.R(96, 72, 128, 3, "#6a6774"); tejadoJ(k, 160, 72, 156, 16, m.techo, 4); a(160, 92, 15);
      k.R(148, 112, 24, 14, "#1f1c28"); k.R(148, 112, 24, 1, "#3a3744");
      casaJ2(k, -8, 128, 50, 38, { ...m, noren: "#c0392b" }); casaJ2(k, 42, 126, 44, 30, { ...m, noren: "#c0392b" }); casaJ2(k, 234, 126, 44, 30, { ...m, noren: "#c0392b" }); casaJ2(k, 278, 128, 50, 38, { ...m, noren: "#c0392b" });
      a(20, 96, 7); a(300, 96, 7);
      k.suelo(124, "#5a5764", "#4e4b58", "#666370"); adoquines(k, 126, 180, "#55525e", "#46434f", "#625f6c");
      k.alfa(0.3, () => k.R(0, 126, 320, 3, "#1f1c28"));
      [[82, 110], [238, 110]].forEach(([x, y]) => { k.R(x, y, 2, 26, "#221f2c"); k.R(x - 3, y, 8, 1, "#221f2c"); farolillo(k, x + 1, y + 5, "#ff8a5a", 4); k.R(x - 2, y + 3, 7, 1, "#c0502a"); k.R(x - 2, y + 7, 7, 1, "#c0502a"); brillo(k, x + 1, y + 5, 20, 18, "#ff8a5a", 0.6); });
      catenaria(k, 42, 96, 96, 92, 5, "#221f2c"); catenaria(k, 224, 92, 278, 96, 5, "#221f2c");
      barril(k, 100, 142, 11, 14, ["#6a5a5a", "#54464a", "#3e343a", "#2a2428"]); caja(k, 208, 146, 14, 11, ["#6a6774", "#4a4754", "#3a3744"]);
      [[120, 164], [186, 150], [230, 170]].forEach(([x, y]) => { k.R(x, y, 3, 1, "#7a6a4a"); k.P(x + 1, y + 1, "#5a4a3a"); });
    }, { fuego: ["#ff8a5a", "#c0502a"], ven: ["#ffd27a"] }],
    23: ["La cumbre de los Kega", "La sala del País del Hierro, con la gran mesa y los estandartes de las cinco aldeas", (k) => {
      k.banda(["#3a3044", "#463a50", "#52465c"], 0, 134);
      tablas(k, 0, 0, 320, 134, "#463a50", "#2e2638", "#54465e", 20, true);
      rellena(k, [[0, 0], [320, 0], [260, 14], [60, 14]], (x, y) => (x % 26 < 2 ? "#3a2a1e" : "#6b4a30")); k.R(60, 14, 200, 2, "#3a2a1e");
      [[-2, 26], [296, 26]].forEach(([x, w]) => { k.R(x, 0, w, 134, "#54402e"); k.R(x + w - 3, 0, 3, 134, "#3a2a1e"); });
      [[30, 44], [246, 44]].forEach(([x, w]) => { k.R(x, 20, w, 62, "#6b4a30"); k.R(x + 3, 23, w - 6, 56, "#8fb4d0"); montanitas(k, x + 3, 79, w - 6); k.R(x + w / 2 - 1, 23, 2, 56, "#6b4a30"); k.R(x + 3, 44, w - 6, 2, "#6b4a30"); });
      [[86, "#c0392b"], [114, "#2f6fa8"], [146, "#e8c84a"], [178, "#8a5a32"], [208, "#3f8a58"]].forEach(([x, c], i) => {
        k.R(x - 2, 14, 30, 3, "#3a2a1e"); k.R(x, 17, 26, 70, c); k.R(x, 17, 2, 70, "#ffffff30"); k.poli([[x, 87], [x + 13, 98], [x + 26, 87]], c); k.R(x + 24, 17, 2, 70, "#26262a30");
        k.elipse(x + 13, 42, 9, 9, "#efe6d0"); k.elipse(x + 13, 42, 6, 6, c); k.R(x + 8, 62, 10, 1, "#efe6d0"); k.R(x + 8, 66, 10, 1, "#efe6d0");
      });
      cubierta(k, 134, 180, ["#6a5a4a", "#54463a", "#7a6a58", "#3a2e24"], 160, 12);
      k.alfa(0.3, () => k.elipse(160, 146, 120, 8, "#26202c"));
      rellena(k, [[52, 134], [268, 134], [240, 108], [80, 108]], (x, y) => rampa(["#a87444", "#8a5f38", "#7a5230", "#5a3a22"], ((x - 52) / 216) * 0.6 + (y % 7 === 0 ? 0.2 : 0), x, y)); k.R(52, 134, 216, 6, "#5a3a22"); k.R(52, 134, 216, 1, "#a87444");
      [[66, 140], [246, 140]].forEach(([x, y]) => k.R(x, y, 8, 10, "#3a2a1e"));
      [[100, "#c0392b"], [130, "#2f6fa8"], [160, "#e8c84a"], [190, "#8a5a32"], [220, "#3f8a58"]].forEach(([x, c]) => { k.poli([[x - 10, 118], [x + 10, 118], [x, 104]], c); k.poli([[x, 104], [x + 10, 118], [x + 2, 118]], "#26262a"); k.elipse(x, 118, 11, 2, "#efe6d0"); k.elipse(x, 117, 4, 1, c); });
      [[28, 140], [292, 140]].forEach(([x, b]) => { cilindro(k, x - 6, b - 26, 13, 26, ["#7a6a7a", "#5a4a5a", "#3a2e3a"]); k.R(x - 2, b - 34, 5, 8, "#ffe6a8"); k.R(x - 4, b - 35, 9, 2, "#3a2e3a"); });
    }, { cielo: "propio", fuerza: 0.15, ventanal: "#8fb4d0", fuego: ["#ffe6a8"] }],
    24: ["La isla Tortuga", "La isla sobre una tortuga gigante, con la cascada de la verdad en el centro", (k) => {
      k.banda(CIELO, 0, 104);
      nubarron(k, -16, 40, 84, 14); nubarron(k, 246, 34, 86, 16); cirros(k, 4, 2, 20);
      k.agua(100, 134, ["#3f8fc0", "#2f78a8"], "#a8dcf2", 70); reflejo(k, 102, 134);
      const TG = ["#b8c88a", "#9ab070", "#7a9456", "#5e7a40"];
      bola(k, 24, 104, 32, 22, (x, y) => rampa(TG, 0.2 + ((y - 104) / 22) * 0.5 + ((x - 24) / 32) * 0.2, x, y)); k.elipse(32, 98, 6, 6, "#f4f1e8"); k.elipse(33, 98, 3, 4, "#26262a"); k.P(32, 96, "#ffffff"); k.R(-2, 114, 50, 1, "#5e7a40"); for (let i = 0; i < 7; i++) k.R(4 + i * 6, 92 + (i % 2) * 4, 3, 2, "#7a9456");
      k.poli([[286, 110], [320, 96], [320, 124], [296, 126]], TG[2]); for (let i = 0; i < 3; i++) k.linea(292 + i * 8, 112 - i * 4, 300 + i * 8, 124 - i * 3, TG[3]);
      rellena(k, [[52, 136], [96, 72], [134, 44], [186, 44], [226, 74], [268, 136]], (x, y) => rampa(["#8cb07a", "#6e9a62", "#5e7f52", "#4a6a44"], 0.2 + ((x - 52) / 216) * 0.56 + (Math.sin(x / 5 + y / 7) > 0.74 ? 0.14 : 0), x, y));
      for (let i = 0; i < 24; i++) { const y = 54 + k.rnd() * 70, a = 22 + (y - 44) * 0.9, x = 160 + (k.rnd() < 0.5 ? -1 : 1) * (20 + k.rnd() * (a - 18)); k.cumulo(x, y, 6 + k.rnd() * 5, ARBOL); }
      rellena(k, [[52, 136], [268, 136], [262, 142], [58, 142]], (x, y) => ((x % 34 < 2) ? "#3f5a2a" : "#6a8a4a"));
      for (let y = 46; y < 134; y++) { const a = 15 + (y - 46) * 0.12; for (let x = Math.round(160 - a); x <= 160 + a; x++) k.P(x, y, Math.sin(x * 1.6 + y / 14) > 0.4 ? "#e8f8ff" : rampa(["#a8dcf2", "#7fc0e6", "#5aa8d8"], (Math.sin(x * 0.9) + 1) * 0.46, x, y)); }
      pena(k, 130, 56, 20, 12, ["#8d8478", "#6e665c", "#57504a"]); pena(k, 170, 56, 20, 12, ["#8d8478", "#6e665c", "#57504a"]);
      k.suelo(134, "#7fc060", "#68a84e", "#a0d878"); k.hierbas(138, 178, 90); flores(k, 138, 176, 40, ["#ffffff", "#f2d24a", "#e8607a"]);
      k.elipse(160, 142, 56, 8, "#5aa8d8"); k.elipse(160, 141, 50, 6, "#7fc0e6"); k.elipse(156, 140, 34, 3, "#d8f0fa"); k.niebla(128, 142, "#ffffff", 0.34);
      camino(k, 148, 180, (f) => 160, (f) => 14 + f * 18, "#c8bd8c", "#ddd29e", "#b8ac7a");
      [[92, 138, 30, 12], [214, 140, 34, 14]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#a39888", "#8d8478", "#6e665c", "#57504a"]));
      k.palmera(30, 148, 44); k.palmera(292, 150, 48); k.palmera(62, 142, 34);
    }, { tinte: 0.1, dx: 76 }],
    25: ["El campamento shinobi", "Las tiendas de la Alianza y sus hogueras, antes de la gran batalla", (k) => {
      k.banda(["#101a3a", "#1f2a56", "#3a4a7a"], 0, 114);
      const NU = ["#3a4a72", "#2a3660", "#1f2a50"]; nubarron(k, -20, 40, 90, 10, NU); nubarron(k, 240, 30, 96, 12, NU);
      montana(k, 60, 114, 190, 44, { roca: ["#2a3660", "#1f2a50", "#18224a", "#121a3a"] }); montana(k, 262, 114, 200, 50, { roca: ["#2a3660", "#1f2a50", "#18224a", "#121a3a"] });
      k.suelo(112, "#6a7a5a", "#5a6a4e", "#7a8a6a"); k.hierbas(116, 178, 70, ["#5a6a4e", "#8a9a7a"]);
      const t = (x, b, w, h, c, o) => { sombra(k, x + w / 2, b + 1, w * 0.6, 2); k.poli([[x, b], [x + w / 2, b - h], [x + w, b]], c); k.poli([[x + w / 2, b - h], [x + w, b], [x + w * 0.6, b]], o); k.linea(x + w * 0.25, b, x + w / 2, b - h, o); k.poli([[x + w * 0.34, b], [x + w * 0.46, b - h * 0.6], [x + w * 0.56, b]], "#ffd27a"); k.linea(x + w / 2, b - h, x + w / 2, b - h - 4, "#3a3a44"); k.linea(x - 3, b + 1, x + w * 0.2, b - h * 0.45, "#c8bea8"); };
      [[-2, 122, 40, 28], [44, 120, 34, 24], [84, 118, 30, 22], [206, 118, 30, 22], [242, 120, 34, 24], [280, 122, 42, 28]].forEach(([x, b, w, h], i) => t(x, b, w, h, i % 2 ? "#5a6a4a" : "#6a6a5a", "#3f4a36"));
      [[30, 142, 44, 28], [244, 144, 46, 30]].forEach(([x, b, w, h]) => t(x, b, w, h, "#7a7a62", "#4f5a44"));
      k.R(158, 22, 3, 100, "#3a3a44"); k.R(158, 22, 1, 100, "#6a6a78"); k.R(150, 22, 18, 2, "#3a3a44");
      for (let i = 0; i < 46; i++) { const o = Math.round(Math.sin(i / 5) * 1.5); k.R(161 + i, 26 + o, 1, 30, i % 12 > 6 ? "#d8cfba" : "#efe6d0"); }
      k.R(170, 34, 28, 3, "#c0392b"); k.R(182, 30, 3, 12, "#c0392b"); k.R(172, 42, 26, 2, "#c0392b"); k.R(176, 44, 2, 6, "#c0392b"); k.R(186, 44, 2, 7, "#c0392b"); k.R(194, 44, 2, 6, "#c0392b");
      [[96, 132], [220, 134]].forEach(([x, b]) => { caja(k, x, b, 13, 10, ["#8a8a6a", "#6a6a50", "#4a4a38"]); caja(k, x + 13, b, 10, 8, ["#8a8a6a", "#6a6a50", "#4a4a38"]); });
      [[116, 156], [206, 150]].forEach(([x, y]) => { k.halo(x, y - 6, 26, 20, "#ff9a3a", 0.22); [[-7, 6], [7, -6], [-5, -4]].forEach(([a, b]) => k.linea(x + a, y + 1, x + b, y - 3, "#3a2414", 2)); k.llama(x, y, 0.8); brillo(k, x, y - 6, 26, 20, "#ffb04a", 0.6); });
      [[14, 168], [24, 172], [300, 170]].forEach(([x, y], i) => { k.linea(x, y, x + 3 + i, y - 18, "#6a6a78", 2); k.R(x + 2 + i, y - 22, 3, 5, "#a8a8b4"); });
    }, { ven: ["#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffd27a"] }],
    26: ["El campo de batalla", "La llanura arrasada de la guerra, con la estatua del Gedo al fondo", (k) => {
      k.banda(["#8a9ab0", "#b4b4b4", "#dcc8a0"], 0, 116);
      const NU = ["#d8d4cc", "#c0bcb4", "#9c9894"]; nubarron(k, -20, 34, 110, 16, NU); nubarron(k, 226, 26, 120, 18, NU);
      montana(k, 60, 116, 180, 44, { roca: ["#b8a290", "#a08a78", "#8a7664", "#766452"] }); montana(k, 270, 116, 190, 50, { roca: ["#b8a290", "#a08a78", "#8a7664", "#766452"] });
      const G = ["#a4a0ae", "#86828f", "#6e6a7a", "#55515f", "#444050"];
      k.linea(130, 72, 92, 104, G[3], 8); k.linea(190, 72, 228, 104, G[3], 8); k.linea(130, 71, 92, 103, G[1], 2); k.linea(190, 71, 228, 103, G[2], 2);
      [[92, 106, 1], [228, 106, -1]].forEach(([x, y]) => { bola(k, x, y, 11, 8, (px, py) => rampa(G, 0.3 + ((px - x) / 11) * 0.3, px, py)); for (let i = 0; i < 4; i++) k.R(x - 8 + i * 5, y + 5, 3, 7, G[3]); });
      rellena(k, [[120, 118], [126, 62], [194, 62], [200, 118]], (x, y) => rampa(G, 0.2 + ((x - 120) / 80) * 0.6 + (Math.sin(y / 3 + x / 14) > 0.76 ? 0.14 : 0), x, y));
      bola(k, 160, 44, 28, 26, (x, y) => rampa(G, 0.16 + ((x - 160) / 28) * 0.32 + ((y - 44) / 26) * 0.3 + 0.1, x, y));
      k.linea(146, 26, 136, 6, G[3], 4); k.linea(174, 26, 184, 6, G[3], 4); k.linea(145, 26, 135, 6, G[1]); k.R(136, 56, 48, 3, G[4]); for (let i = 0; i < 6; i++) k.R(138 + i * 8, 58, 5, 8, "#d8d0d8");
      [[146, 42], [160, 42], [174, 42], [150, 34], [170, 34], [160, 28], [140, 34], [180, 34], [160, 50]].forEach(([x, y]) => { k.elipse(x, y, 3, 2, "#c8b8e8"); k.P(x, y, "#3a2a5a"); });
      for (let i = 0; i < 6; i++) { k.R(136 + i * 9, 84 + (i % 2) * 8, 6, 5, G[3]); k.R(136 + i * 9, 84 + (i % 2) * 8, 6, 1, G[0]); }
      [[120, 80], [200, 80]].forEach(([x, y]) => { for (let i = 0; i < 6; i++) k.R(x + (x < 160 ? -i * 5 : i * 5), y + i * 3, 4, 3, i % 2 ? "#3a3644" : "#5a5664"); });
      k.suelo(114, "#b09a78", "#a08a68", "#c0aa88");
      loma(k, [[-20, 122], [90, 114], [220, 120], [340, 114]], 180, ["#c0aa88", "#b09a78", "#a08a68", "#8e7856"], 0.1);
      [[60, 150, 46, 8], [262, 166, 54, 9], [160, 172, 42, 6], [250, 130, 30, 5]].forEach(([x, y, a, b]) => { k.elipse(x, y, a, b, "#a08a68"); k.elipse(x, y + 1, a - 3, b - 1, "#8a7458"); k.elipse(x, y + 2, a - 8, b - 3, "#766248"); });
      [[20, 138, 36, 15], [226, 144, 30, 13], [292, 136, 38, 17], [100, 176, 26, 10]].forEach(([x, b, w, h]) => pena(k, x, b, w, h, ["#a39888", "#8d8478", "#6e665c", "#57504a"]));
      [[[44, 118], [58, 126], [76, 134], [70, 150]], [[280, 116], [266, 126], [256, 134]]].forEach((t) => t.forEach((p, i) => { if (i) k.linea(t[i - 1][0], t[i - 1][1], p[0], p[1], "#7a6448", 2); }));
      [[116, 148], [206, 160], [80, 164]].forEach(([x, y], i) => { k.linea(x, y, x + 4, y - 16, "#6a6a78", 2); k.R(x + 3, y - 20, 3, 5, "#a8a8b4"); if (i === 1) { k.R(x + 4, y - 16, 12, 7, "#c8bea8"); k.R(x + 8, y - 13, 4, 2, "#8a7a68"); } });
      k.niebla(100, 128, "#e8dcc8", 0.24);
    }, { tinte: 0.45, fuego: ["#c8b8e8", "#3a2a5a"] }],
    27: ["La luna roja", "El Tsokuyumi Infinito: la luna con el ojo rojo y el Árbol Divino", (k) => {
      k.banda(["#14080f", "#241019", "#3a1626"], 0, 136); k.estrellas(110, 70, ["#a86a7a", "#6a4a5a", "#ffffff"]);
      bola(k, 160, 58, 46, 46, (x, y) => { const d = Math.hypot(x - 160, y - 58); return Math.abs(d - 34) < 0.7 || Math.abs(d - 24) < 0.7 || Math.abs(d - 14) < 0.7 ? "#5a1418" : rampa(["#e8604a", "#c0392b", "#9a2a26", "#7a1f2a"], 0.15 + ((x - 160) / 46) * 0.3 + ((y - 58) / 46) * 0.3 + 0.1, x, y); });
      k.elipse(160, 58, 6, 6, "#1a0a10"); [0, 2.09, 4.19].forEach((b) => { [14, 24, 34].forEach((r) => { const x = 160 + Math.cos(b + r / 30) * r, y = 58 + Math.sin(b + r / 30) * r; k.elipse(x, y, 3, 3, "#1a0a10"); k.linea(x, y, 160 + Math.cos(b + r / 30 + 0.3) * (r + 3), 58 + Math.sin(b + r / 30 + 0.3) * (r + 3), "#1a0a10"); }); });
      for (let a = 0; a < 6.28; a += 0.03) { const r = 48 + Math.sin(a * 7) * 2; if (Det.trama(160 + Math.cos(a) * r, 58 + Math.sin(a) * r) < 0.5) k.crudo(160 + Math.cos(a) * r, 58 + Math.sin(a) * r, 1, 1, "#7a1f2a"); }
      const T = ["#54404a", "#46343c", "#34262c", "#241a20"];
      const raiz = (pts) => rellena(k, pts, (x, y) => rampa(T, 0.2 + (Math.sin(x / 3 + y / 7) > 0.6 ? 0.34 : 0) + (x < 160 ? 0.2 : 0.4), x, y));
      raiz([[-6, 138], [-6, 24], [28, 54], [50, 138]]); raiz([[326, 138], [326, 24], [292, 54], [270, 138]]);
      [[6, 60, 92, 20, 3], [14, 90, 78, 66, 3], [314, 60, 228, 20, 3], [306, 90, 242, 66, 3], [40, 40, 110, 8, 2], [280, 40, 210, 8, 2]].forEach(([a, b, c, d, g]) => { k.linea(a, b, c, d, T[2], g); k.linea(a, b - 1, c, d - 1, T[0]); });
      [[60, 42], [76, 50], [44, 68], [260, 42], [244, 50], [276, 68], [96, 26], [224, 26]].forEach(([x, y]) => { k.R(x, y, 1, 10, T[2]); esfera(k, x, y + 17, 4, 8, ["#f4efe8", "#d8d0c4", "#a89e92"]); k.linea(x - 3, y + 14, x + 3, y + 18, "#b8ae9e"); k.linea(x - 3, y + 20, x + 3, y + 24, "#b8ae9e"); });
      k.suelo(134, "#2a1a24", "#20141c", "#3a2630"); k.hierbas(138, 178, 60, ["#3a2630", "#4a3440"]);
      for (let i = 0; i < 7; i++) { const x = 20 + i * 48, l = 26 + (i % 3) * 18; k.linea(x, 134, x + (i % 2 ? 16 : -16), 134 + l, T[1], 3); k.linea(x, 134, x + (i % 2 ? 16 : -16), 134 + l, T[0]); }
      k.alfa(0.16, () => k.elipse(160, 140, 130, 10, "#c0392b"));
    }, { cielo: "propio", base: "noche", astro: "siempre", fuego: ["#e8604a", "#c0392b", "#9a2a26", "#7a1f2a", "#5a1418", "#1a0a10"] }],
  };
  function montanitas(k, x, b, w) { for (let i = 0; i < 3; i++) { const c = x + w * (0.2 + i * 0.3), h = 18 + (i % 2) * 8; k.poli([[c - 14, b], [c, b - h], [c + 14, b]], "#e8f0f6"); k.poli([[c, b - h], [c + 14, b], [c + 2, b]], "#c0d0dc"); } }
  Det.sitios("ninjas", sitios);
})();
