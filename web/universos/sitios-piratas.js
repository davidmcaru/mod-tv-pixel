// sitios-piratas.js — los escenarios de Piratas, dibujados con las piezas de piezas-detalle.js.
(function () {
  const { trama, rampa, rellena, bola, esfera, cilindro, nubarron, cirros, reflejo, espuma, oleaje, montana, loma, estratos, pena, adoquines, cubierta, camino, matas, flores, helecho, sillares, ladrillos, tablas, ventanaArco, torreta, almenas, casaTorcida, casaNieve, tejadoJ, barril, caja, bandera, farolillo, catenaria, humo, sombra, brillo, rotulo } = Det;
  const CIELO = ["#58b0ea", "#84c8f0", "#b8e0f4", "#ecf4e6"], MAR = ["#3f9ad8", "#2f86c6", "#2472b0", "#1c5f98"];
  const MADERA = ["#d8ae80", "#b98a56", "#8a6238", "#5f3f24"], CUBIERTA = ["#b98a56", "#8a6238", "#cda26e", "#5f3f24"], LANA = ["#ffffff", "#f4efe0", "#d8d0ba"];
  const VERDE = ["#a8dc78", "#8cc860", "#74b04e", "#5c9440"], ARENA = ["#f4e2b4", "#e8d09c", "#d8c08a", "#c8ae78"];
  const VEN = ["#ffd27a"];

  const calavera = (k, cx, cy, tela = "#f4efe0", negro = "#26262a") => {
    k.linea(cx - 26, cy - 8, cx + 25, cy + 19, negro, 4); k.linea(cx + 25, cy - 8, cx - 26, cy + 19, negro, 4);
    k.elipse(cx, cy + 1, 14, 13, negro); k.R(cx - 8, cy + 10, 16, 9, negro);
    k.elipse(cx - 5, cy + 2, 3, 3, tela); k.elipse(cx + 5, cy + 2, 3, 3, tela); k.R(cx - 1, cy + 7, 2, 3, tela);
    for (let i = 0; i < 3; i++) k.R(cx - 5 + i * 4, cy + 14, 1, 5, tela);
    k.elipse(cx, cy - 8, 21, 3, "#e8c35a"); k.poli([[cx - 12, cy - 9], [cx + 12, cy - 9], [cx + 9, cy - 20], [cx - 9, cy - 20]], "#e8c35a"); k.R(cx - 12, cy - 13, 24, 3, "#c0392b");
  };
  function vela(k, cx, y0, y1, w, cols, costura) {
    const pts = [], n = 14;
    for (let i = 0; i <= n; i++) { const t = i / n; pts.push([cx - (w / 2) * (0.84 + 0.16 * Math.sin(t * Math.PI)), y0 + (y1 - y0) * t]); }
    for (let i = 1; i < n; i++) { const t = i / n; pts.push([cx - w / 2 * 0.84 + w * 0.84 * t, y1 - 6 * Math.sin(t * Math.PI)]); }
    for (let i = n; i >= 0; i--) { const t = i / n; pts.push([cx + (w / 2) * (0.84 + 0.16 * Math.sin(t * Math.PI)), y0 + (y1 - y0) * t]); }
    rellena(k, pts, (x, y) => (Math.round(x - cx + 1200) % 30 === 0 ? costura : rampa(cols, 0.08 + Math.abs((x - cx) / (w / 2) + 0.3) * 0.5, x, y)));
  }
  function borda(k, alto, y1, cols, paso = 12) {
    for (let x = 6; x < 320; x += paso) { const y = Math.round(alto(x)) + 3; cilindro(k, x, y, 4, y1 - y, cols); }
    for (let x = 0; x < 320; x++) { const y = Math.round(alto(x)); k.R(x, y, 1, 4, cols[1]); k.P(x, y, cols[0]); k.P(x, y + 3, cols[2]); }
  }
  function edificio(k, x, base, w, h, { pared = "#e8d4b0", luz = "#f6e6c8", osc = "#c9b48c", techo = "#c9502f", techoOsc = "#9a3a20", ven = "#ffd27a", marco = "#8a6a4a", paso = 9, alto = 11 } = {}) {
    k.R(x, base - h, w, h, pared); k.R(x, base - h, 2, h, luz); k.R(x + w - 3, base - h, 3, h, osc);
    for (let y = base - h + 6; y < base - 7; y += alto) { for (let vx = x + 4; vx < x + w - 6; vx += paso) ventanaArco(k, vx, y, 4, 6, marco, ven); k.R(x, y + 8, w, 1, osc); }
    k.R(x - 1, base - h - 1, w + 2, 2, osc); k.poli([[x - 3, base - h - 1], [x + w + 3, base - h - 1], [x + w - 4, base - h - 7], [x + 4, base - h - 7]], techo); k.poli([[x + w * 0.6, base - h - 1], [x + w + 3, base - h - 1], [x + w - 4, base - h - 7], [x + w * 0.6, base - h - 7]], techoOsc);
  }
  const mandarino = (k, x, base, t = 1) => { const p = { tronco: "#5b3a24", copa: "#3f8f45", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" }; k.arbolote(x, base, t, p); for (let i = 0; i < 14 * t; i++) k.R(x - 12 * t + k.rnd() * 24 * t, base - 24 * t + k.rnd() * 16 * t, 2, 2, "#f2a23a"); };
  const farolBarco = (k, x, y, r = 28) => { k.R(x + 1, y - 3, 1, 3, "#3a2a20"); k.R(x - 1, y, 5, 7, "#3a2a20"); k.R(x, y + 1, 3, 5, "#ffd27a"); brillo(k, x + 1, y + 3, r, r * 0.8, "#ffcf6a", 0.5); };

  const sitios = {
    1: ["La cubierta del Going Nerry", "El barco de la tripulación, con su cabeza de oveja", (k) => {
      k.banda(CIELO, 0, 88);
      nubarron(k, -16, 54, 92, 20); nubarron(k, 216, 48, 120, 24); cirros(k, 6, 8, 30);
      k.agua(82, 114, MAR, "#bfe6f6", 70); reflejo(k, 84, 114);
      cubierta(k, 116, 180, CUBIERTA, 150);
      const alto = (x) => 100 - 18 * Math.pow(Math.max(0, x - 170) / 150, 2);
      borda(k, alto, 112, MADERA); tablas(k, 0, 111, 320, 6, "#a87444", "#7a5230", "#c0895a", 3);
      [[40, 104], [70, 104], [226, 98], [258, 92]].forEach(([x, y]) => k.linea(147, 8, x, y, "#5f3f24"));
      mandarino(k, 16, 78, 1.1); mandarino(k, 56, 78, 1.2);
      tablas(k, -2, 84, 100, 46, "#a87444", "#7a5230", "#c0895a", 6); k.R(-2, 128, 100, 3, "#6d4628");
      for (let x = 4; x < 96; x += 9) cilindro(k, x, 74, 3, 9, MADERA); k.R(-2, 72, 100, 3, "#c0895a"); k.R(-2, 82, 100, 3, "#8a5a32");
      [[20, 100], [46, 100]].forEach(([x, y]) => { k.elipse(x, y, 7, 7, "#6d4628"); k.elipse(x, y, 5, 5, "#ffd27a"); k.R(x, y - 5, 1, 11, "#6d4628"); k.R(x - 5, y, 11, 1, "#6d4628"); brillo(k, x, y, 16, 14, "#ffcf6a", 0.35); });
      k.elipse(76, 104, 8, 8, "#5f3f24"); k.R(68, 104, 16, 26, "#5f3f24"); k.elipse(76, 104, 6, 6, "#7a5230"); k.R(70, 104, 12, 26, "#7a5230"); k.P(80, 116, "#e8c35a");
      for (let i = 0; i < 7; i++) { const y = 86 + i * 6.3; k.R(98, y, 6 + i * 3.6, 7, i % 2 ? "#a87444" : "#b98a56"); k.R(98, y, 6 + i * 3.6, 1, "#d8ae80"); }
      cilindro(k, 140, 0, 14, 134, MADERA); [6, 74, 110].forEach((y) => k.R(140, y, 14, 2, "#3a2a20")); k.elipse(147, 134, 12, 3, "#5f3f24"); k.elipse(147, 133, 9, 2, "#7a5230");
      k.R(60, 2, 176, 4, "#8a5a32"); k.R(60, 2, 176, 1, "#b98a56");
      vela(k, 147, 6, 72, 172, ["#fbf6e8", "#efe6d0", "#d6cab0"], "#d0c4a8"); calavera(k, 147, 40);
      farolBarco(k, 136, 90);
      const hx = 288, hy = 80;
      [[-16, 2, 7], [-9, -7, 8], [2, -11, 9], [12, -7, 8], [18, 2, 7], [-15, 13, 6], [17, 13, 6]].forEach(([dx, dy, r]) => esfera(k, hx + dx, hy + dy, r, r, LANA));
      [[-13, 6], [15, 6]].forEach(([dx, dy], i) => { for (let a = 0; a < 9; a += 0.2) { const r = 1 + a * 0.78; k.R(hx + dx + (i ? 1 : -1) * Math.cos(a) * r, hy + dy + Math.sin(a) * r, 2, 2, a < 3 ? "#8a6a24" : "#c9a03c"); } });
      esfera(k, hx + 1, hy + 9, 11, 10, ["#fbe6c8", "#f2d8b0", "#d8b080"]); k.R(hx - 5, hy + 5, 3, 4, "#26262a"); k.R(hx + 5, hy + 5, 3, 4, "#26262a"); k.P(hx - 4, hy + 5, "#ffffff"); k.P(hx + 6, hy + 5, "#ffffff");
      k.elipse(hx + 1, hy + 13, 4, 2, "#c98a5a"); k.R(hx - 2, hy + 16, 7, 1, "#a8622a");
      barril(k, 212, 130, 11, 13); barril(k, 224, 133, 11, 13); caja(k, 236, 134, 13, 10);
      k.elipse(52, 172, 13, 4, "#a8926a"); k.elipse(52, 171, 13, 4, "#c8b490"); k.elipse(52, 170, 8, 2, "#8a7450"); k.elipse(52, 169, 4, 1, "#c8b490");
      sombra(k, 218, 134, 18, 2); k.linea(262, 180, 306, 128, "#a87444", 2); k.R(300, 122, 12, 4, "#d8d0ba");
    }, { ven: VEN, tinte: 0.2 }],
    2: ["El Thousand Sonny", "La cubierta de césped, el mástil con su sala redonda y el león de la proa, con su melena de sol", (k) => {
      k.banda(CIELO, 0, 88);
      nubarron(k, -20, 56, 110, 20); nubarron(k, 150, 62, 70, 12); cirros(k, 5, 8, 28);
      k.agua(82, 112, MAR, "#bfe6f6", 70); reflejo(k, 84, 112);
      k.R(0, 110, 320, 70, "#6fbe5a");
      for (let y = 110; y < 180; y++) if (Math.floor(Math.pow((y - 104) / 76, 1.6) * 9) % 2) k.R(0, y, 320, 1, "#65b350");
      k.hierbas(116, 178, 130, ["#4f9a44", "#8cd470"]); matas(k, 134, 178, 18, ["#3f8a3a", "#58a84c", "#7cc860"]); flores(k, 120, 178, 26, ["#ffffff", "#f2d24a", "#e8607a"]);
      const NIN = ["#f2b860", "#e8a050", "#c8803a", "#9a5a28"], alto = (x) => 96 - 34 * Math.pow(Math.max(0, x - 176) / 144, 2);
      rellena(k, [[196, 116], [324, 116], [324, 56], [292, 68], [256, 86], [224, 96]], (x, y) => ((y + (x >> 4)) % 7 === 0 ? "#9a5a28" : rampa(NIN, 0.2 + ((y - 56) / 60) * 0.6, x, y)));
      borda(k, alto, 108, NIN, 11); tablas(k, 0, 106, 196, 8, "#c98a4a", "#9a6430", "#e8a860", 4); k.R(0, 113, 320, 2, "#7a4e2c");
      [[36, 104], [66, 104], [176, 98], [206, 96]].forEach(([x, y]) => k.linea(120, 8, x, y, "#7a4e2c"));
      mandarino(k, 14, 66, 1.1); mandarino(k, 52, 66, 1.2);
      tablas(k, -2, 72, 88, 42, "#f4efe0", "#c8bea8", "#ffffff", 7); k.R(-2, 112, 88, 3, "#a87444"); for (let x = 2; x < 84; x += 8) cilindro(k, x, 62, 3, 10, NIN); k.R(-2, 60, 88, 3, "#e8a050"); k.R(-2, 70, 88, 3, "#c8803a");
      [[14, 90], [40, 90]].forEach(([x, y]) => { k.elipse(x, y, 7, 7, "#c8803a"); k.elipse(x, y, 5, 5, "#ffd27a"); k.R(x, y - 5, 1, 11, "#c8803a"); k.R(x - 5, y, 11, 1, "#c8803a"); brillo(k, x, y, 16, 14, "#ffcf6a", 0.35); });
      k.elipse(66, 92, 7, 7, "#7a4e2c"); k.R(59, 92, 14, 22, "#7a4e2c"); k.elipse(66, 92, 5, 5, "#a87444"); k.R(61, 92, 10, 22, "#a87444"); k.P(69, 104, "#e8c35a");
      for (let i = 0; i < 6; i++) { const y = 74 + i * 7; k.R(86, y, 5 + i * 4, 7, i % 2 ? "#c8803a" : "#e8a050"); k.R(86, y, 5 + i * 4, 1, "#f2b860"); }
      k.poli([[86, 66], [92, 66], [124, 122], [114, 124]], "#e8604a"); k.poli([[92, 66], [95, 67], [127, 121], [124, 122]], "#b8442a");
      const MA = ["#d8ae80", "#c0895a", "#a87444", "#7a4e2c"];
      cilindro(k, 134, 0, 14, 126, MA, 0.3); [40, 92].forEach((y) => k.R(134, y, 14, 2, "#5f3f24"));
      cilindro(k, 112, 6, 58, 22, ["#f2b860", "#e8a050", "#c8803a", "#9a5a28"], 0.3); k.R(109, 26, 64, 3, "#7a4e2c"); k.R(109, 26, 64, 1, "#c98a4a"); k.elipse(141, 6, 29, 5, "#3f8ac0"); k.elipse(138, 5, 20, 3, "#5aa4d8"); k.R(140, -2, 2, 6, "#3a2a20");
      [120, 134, 148, 162].forEach((x) => { k.elipse(x, 16, 3, 3, "#7a4e2c"); k.elipse(x, 16, 2, 2, "#ffd27a"); });
      k.R(58, 30, 166, 4, "#a87444"); vela(k, 141, 34, 96, 164, ["#fbf6e8", "#efe6d0", "#d6cab0"], "#d0c4a8"); calavera(k, 141, 66);
      k.elipse(141, 127, 26, 6, "#7a4e2c"); k.elipse(141, 125, 26, 6, "#c98a4a"); k.elipse(141, 124, 24, 5, "#e8a860"); cilindro(k, 134, 96, 14, 28, MA, 0.3); k.elipse(141, 124, 9, 3, "#7a4e2c");
      k.R(196, 88, 3, 38, "#a87444"); k.R(226, 92, 3, 34, "#a87444"); k.R(196, 88, 33, 3, "#c98a4a"); k.R(206, 91, 1, 22, "#6d4628"); k.R(218, 91, 1, 22, "#6d4628"); k.R(203, 113, 18, 2, "#7a4e2c"); sombra(k, 212, 127, 18, 2);
      barril(k, 246, 132, 12, 14); barril(k, 259, 135, 12, 14); k.R(248, 123, 8, 1, "#c0392b"); sombra(k, 256, 136, 18, 2);
      const lx = 262, ly = 42;
      for (let a = 0; a < 16; a++) { const b = (a / 16) * 6.283, c = ((a + 0.5) / 16) * 6.283, d = ((a - 0.5) / 16) * 6.283, R0 = 44 + (a % 2) * 2; k.poli([[lx + Math.cos(b) * R0, ly + Math.sin(b) * R0], [lx + Math.cos(c) * 27, ly + Math.sin(c) * 27], [lx + Math.cos(d) * 27, ly + Math.sin(d) * 27]], a % 2 ? "#f2a23a" : "#e8762a"); }
      for (let a = 0; a < 16; a++) { const b = ((a + 0.5) / 16) * 6.283, c = ((a + 1) / 16) * 6.283, d = (a / 16) * 6.283; k.poli([[lx + Math.cos(b) * 37, ly + Math.sin(b) * 37], [lx + Math.cos(c) * 24, ly + Math.sin(c) * 24], [lx + Math.cos(d) * 24, ly + Math.sin(d) * 24]], a % 2 ? "#ffc85a" : "#f8b048"); }
      esfera(k, lx, ly, 29, 29, ["#d8862a", "#c0701e", "#9a5414"]);
      [[-20, -19], [20, -19]].forEach(([dx, dy]) => { esfera(k, lx + dx, ly + dy, 6, 6, ["#ffd27a", "#f2a23a", "#c0701e"]); k.elipse(lx + dx, ly + dy + 1, 3, 3, "#9a5414"); });
      esfera(k, lx, ly + 1, 23, 24, ["#ffe08a", "#f8c85a", "#e0a03a"]);
      k.poli([[lx - 17, ly - 11], [lx - 4, ly - 7], [lx - 4, ly - 4], [lx - 18, ly - 8]], "#a86018"); k.poli([[lx + 17, ly - 11], [lx + 4, ly - 7], [lx + 4, ly - 4], [lx + 18, ly - 8]], "#a86018");
      [[-10, -3], [10, -3]].forEach(([dx, dy]) => { k.elipse(lx + dx, ly + dy, 4, 3, "#ffffff"); k.elipse(lx + dx, ly + dy, 2, 3, "#26262a"); k.P(lx + dx - 1, ly + dy - 1, "#ffffff"); });
      k.R(lx - 2, ly - 2, 5, 9, "#f2b860"); esfera(k, lx - 8, ly + 11, 9, 7, ["#fff8e0", "#fbe8b8", "#e8c888"]); esfera(k, lx + 8, ly + 11, 9, 7, ["#fff8e0", "#fbe8b8", "#e8c888"]);
      k.poli([[lx - 6, ly + 2], [lx + 6, ly + 2], [lx + 3, ly + 7], [lx, ly + 9], [lx - 3, ly + 7]], "#5a2a1a"); k.R(lx - 3, ly + 3, 3, 1, "#8a4a30"); k.R(lx, ly + 9, 1, 4, "#5a2a1a");
      k.elipse(lx, ly + 18, 11, 6, "#7a1f1a"); k.elipse(lx, ly + 20, 7, 3, "#c0392b"); k.poli([[lx - 9, ly + 14], [lx - 6, ly + 14], [lx - 7, ly + 20]], "#ffffff"); k.poli([[lx + 9, ly + 14], [lx + 6, ly + 14], [lx + 7, ly + 20]], "#ffffff"); k.R(lx - 4, ly + 13, 8, 1, "#ffffff");
      [[-15, 8], [-13, 12], [15, 8], [13, 12]].forEach(([dx, dy]) => k.P(lx + dx, ly + dy, "#c89858"));
      farolBarco(k, 128, 88, 30); farolBarco(k, 226, 100, 22);
    }, { ven: VEN, tinte: 0.2, dx: -140 }],
    3: ["La villa Faosho", "El pueblo del molino, frente al mar", (k) => {
      k.banda(CIELO, 0, 86);
      nubarron(k, 10, 44, 70, 16); nubarron(k, 120, 26, 40, 8); cirros(k, 6, 6, 30);
      montana(k, 262, 88, 210, 58, { roca: ["#8cc0a0", "#6fa88a", "#558f74", "#447a62"] });
      k.cordillera(90, 16, "#7fb0c0", null, 1);
      k.agua(82, 112, MAR, "#bfe6f6", 60); reflejo(k, 84, 112);
      tablas(k, 248, 102, 76, 5, "#a87444", "#7a5230", "#c0895a", 3); for (let x = 252; x < 320; x += 16) k.R(x, 106, 3, 8, "#6d4628");
      [[226, 106, "#c0392b"], [292, 112, "#2f6fa8"]].forEach(([x, y, c]) => { k.poli([[x - 12, y - 3], [x + 12, y - 3], [x + 8, y + 2], [x - 8, y + 2]], c); k.R(x - 12, y - 4, 24, 1, "#f4efe0"); k.R(x, y - 16, 1, 12, "#6d4628"); k.poli([[x + 1, y - 16], [x + 9, y - 6], [x + 1, y - 6]], "#f4efe0"); });
      loma(k, [[-20, 112], [100, 105], [240, 116], [340, 110]], 180, VERDE, 0.28);
      const mx = 240;
      rellena(k, [[mx - 14, 126], [mx - 9, 74], [mx + 9, 74], [mx + 14, 126]], (x, y) => rampa(["#fbf3de", "#f2e6c8", "#d4c0a0", "#b8a480"], Math.abs((x - mx) / 14 + 0.35) * 0.8, x, y));
      [[92], [108]].forEach(([y]) => { k.R(mx - 12, y, 24, 1, "#c4b08c"); });
      k.elipse(mx, 94, 3, 4, "#6b4a30"); k.R(mx - 3, 94, 6, 6, "#ffd27a"); k.R(mx - 4, 116, 8, 10, "#6b4a30"); k.elipse(mx, 116, 4, 4, "#6b4a30");
      k.poli([[mx - 11, 75], [mx + 11, 75], [mx + 6, 62], [mx, 58], [mx - 6, 62]], "#c0502a"); k.poli([[mx, 75], [mx + 11, 75], [mx + 6, 62], [mx, 58]], "#8a2f22");
      [[-30, -24], [30, -24], [-30, 26], [30, 26]].forEach(([dx, dy]) => { k.linea(mx, 66, mx + dx, 66 + dy, "#6b4a30", 2); for (let t = 0.3; t < 1; t += 0.12) { const x = mx + dx * t, y = 66 + dy * t; k.linea(x - dy * 0.16, y + dx * 0.16, x + dy * 0.16, y - dx * 0.16, "#8a6a40"); } k.poli([[mx + dx * 0.3, 66 + dy * 0.3], [mx + dx, 66 + dy], [mx + dx - dy * 0.22, 66 + dy + dx * 0.22], [mx + dx * 0.3 - dy * 0.22, 66 + dy * 0.3 + dx * 0.22]], "#f4efe0"); });
      k.elipse(mx, 66, 3, 3, "#3a2a20");
      casaTorcida(k, -4, 128, 40, 26, { techo: "#d8703a", chimenea: true });
      casaTorcida(k, 40, 130, 32, 22, { pared: "#f6ecd4", techo: "#3f8ac0", techoLuz: "#5aa4d8", techoOsc: "#2c6c9c", redonda: false });
      casaTorcida(k, 78, 126, 30, 20, { pared: "#e8d6b0", techo: "#b5543a", techoLuz: "#d0704e", techoOsc: "#8a3f2a" });
      casaTorcida(k, 118, 130, 56, 30, { pared: "#efd9b0", techo: "#a84e3a", techoLuz: "#c86a50", techoOsc: "#7a3424", chimenea: true, toldo: "#2f8a5a", redonda: false });
      k.R(127, 104, 38, 8, "#6d4628"); k.R(127, 104, 38, 1, "#a87444"); rotulo(k, 130, 106, "PARTYS", "#ffe9a8");
      casaTorcida(k, 276, 130, 46, 26, { pared: "#f2e0c0", techo: "#c0602a", techoLuz: "#dc7c42", techoOsc: "#984820", redonda: false, chimenea: true });
      camino(k, 132, 180, (f) => 150 + Math.sin(f * 3) * (f * 18), (f) => 6 + f * 18, "#c4ad7c", "#dcc794", "#b89f6c");
      [[192, 140], [204, 142], [216, 144], [228, 146]].forEach(([x, y], i, t) => { k.R(x, y - 7, 2, 8, "#8a6238"); if (i) k.linea(t[i - 1][0], t[i - 1][1] - 4, x, y - 4, "#a87444"); });
      flores(k, 136, 178, 60, ["#ffffff", "#f2d24a", "#e8607a"]); matas(k, 140, 178, 24);
      k.arbolote(14, 158, 1.5); k.arbolote(306, 150, 1.7);
    }, { ven: ["#f2d27a", "#ffd27a"] }],
    4: ["El Baratei", "El restaurante flotante con forma de pez", (k) => {
      k.banda(["#ffb07a", "#ffc88e", "#ffe0a8", "#fff0c8"], 0, 100);
      const CREMA = ["#fff4e0", "#ffd8b0", "#f2b48a"];
      nubarron(k, -10, 60, 80, 16, CREMA); nubarron(k, 244, 52, 96, 18, CREMA); cirros(k, 6, 8, 34, "#fff0d8");
      k.agua(98, 150, MAR, "#ffe0a8", 120); reflejo(k, 100, 150);
      const ESC = ["#f08a54", "#d8683a", "#b84a26", "#8a3418"];
      rellena(k, [[46, 122], [62, 100], [92, 90], [230, 90], [266, 104], [300, 86], [306, 116], [302, 142], [266, 124], [232, 138], [92, 140], [62, 134]], (x, y) => {
        const v = (y - 90) / 50, e = (Math.round(x / 6 + (Math.floor(y / 4) % 2) * 0.5) % 2 === 0 && y % 4 === 0) ? 0.22 : 0;
        return rampa(ESC, v * 0.8 + e, x, y);
      });
      k.linea(50, 124, 84, 128, "#5a2410", 2); k.linea(84, 128, 92, 120, "#5a2410"); [[60, 124], [68, 126], [76, 127]].forEach(([x, y]) => k.poli([[x, y], [x + 5, y], [x + 2, y + 4]], "#f4efe0"));
      k.elipse(84, 108, 9, 9, "#f4efe0"); k.elipse(86, 108, 5, 5, "#26262a"); k.R(84, 105, 2, 2, "#ffffff"); k.elipse(84, 108, 9, 1, "#d8cdb4");
      k.poli([[150, 138], [188, 140], [176, 152], [156, 150]], "#b84a26"); k.poli([[120, 90], [162, 90], [150, 74], [132, 76]], "#d8683a");
      k.alfa(0.4, () => k.R(70, 134, 200, 4, "#4a1a0c"));
      tablas(k, 106, 60, 112, 32, "#f2e6c8", "#d4c4a0", "#fff4e0", 5, true); k.R(206, 60, 12, 32, "#d4c4a0");
      for (let x = 112; x < 204; x += 15) { ventanaArco(k, x, 68, 8, 15, "#7a4e2c", "#ffcf6a"); }
      k.poli([[96, 60], [228, 60], [212, 42], [112, 42]], "#2f7a8a"); k.poli([[96, 60], [150, 60], [150, 42], [112, 42]], "#3f9aa8"); k.R(96, 59, 132, 2, "#1f5a68");
      tablas(k, 128, 24, 68, 19, "#f2e6c8", "#d4c4a0", "#fff4e0", 5, true); for (let x = 134; x < 192; x += 12) k.R(x, 29, 6, 9, "#ffcf6a");
      k.poli([[120, 24], [204, 24], [186, 10], [138, 10]], "#2f7a8a"); k.poli([[120, 24], [158, 24], [158, 10], [138, 10]], "#3f9aa8");
      esfera(k, 162, 7, 13, 6, ["#ffffff", "#f4efe0", "#d8d0ba"]); k.R(152, 8, 20, 3, "#f4efe0");
      k.R(158, 0, 3, 4, "#6d4628"); bandera(k, 161, 0, 17, 7, "#26262a");
      k.R(120, 44, 84, 12, "#6d4628"); k.R(120, 44, 84, 1, "#a87444"); k.R(120, 55, 84, 1, "#3a2a20"); rotulo(k, 148, 47, "BARATEI", "#ffe9a8");
      k.R(0, 137, 320, 3, "#c99a64"); k.R(0, 140, 320, 2, "#8a5a32");
      for (let x = 6; x < 320; x += 13) cilindro(k, x, 140, 3, 10, ["#c99a64", "#a87444", "#7a4e2c"]);
      cubierta(k, 150, 180, ["#a87a4a", "#7a5230", "#c0946a", "#4a3020"], 160); k.R(0, 150, 320, 2, "#d8ae80");
      [[26], [294]].forEach(([x]) => { k.R(x, 114, 3, 37, "#6d4628"); });
      catenaria(k, 27, 114, 295, 114, 12, "#3a2a20", (x, y, i) => { if (i % 22 === 8) { k.elipse(x, y + 2, 2, 2, "#ffcf6a"); brillo(k, x, y + 2, 10, 8, "#ffcf6a", 0.5); } });
      [[218, 150], [62, 150]].forEach(([x, b]) => { k.R(x + 3, b - 16, 2, 16, "#6d4628"); k.elipse(x + 4, b - 16, 12, 2, "#f4efe0"); k.R(x - 8, b - 15, 24, 2, "#e8e0cc"); });
    }, { ven: ["#ffcf6a", "#ffd27a"], tinte: 0.1, fuego: [] }],
    5: ["Orlang Park", "La torre de los hombres-pez, con su boca de tiburón", (k) => {
      k.banda(["#6a8ab0", "#8aa6c4", "#b0c6d4"], 0, 116);
      const GRIS = ["#dfe6ec", "#b8c6d2", "#8ea2b4"];
      nubarron(k, -12, 58, 90, 16, GRIS); nubarron(k, 240, 50, 96, 20, GRIS);
      loma(k, [[-20, 112], [30, 86], [90, 94], [120, 114]], 116, ["#7fa86a", "#648f58", "#4f7a48"], 0.2);
      for (let i = 0; i < 16; i++) k.cumulo(6 + i * 7, 96 + (i % 3) * 5, 4, { tronco: "#5b3a24", copa: "#4f8f4a", borde: "#3a6e3a", luz: "#7fb860", osc: "#3f7a40" });
      for (let i = 0; i < 22; i++) k.P(4 + k.rnd() * 110, 92 + k.rnd() * 16, "#f2a23a");
      k.agua(112, 150, ["#2f7a9a", "#256888"], "#a8dce6", 90); reflejo(k, 114, 150);
      const P = { pared: ["#ecdcb4", "#d8c8a0", "#b5a680", "#8e8060"], tej: { c: "#2f6a8a", luz: "#4a8aa8", osc: "#1f4a64" } };
      cilindro(k, 122, 18, 76, 34, P.pared); cilindro(k, 110, 50, 100, 40, P.pared); cilindro(k, 96, 88, 128, 44, P.pared);
      tejadoJ(k, 160, 22, 92, 18, P.tej, 4); tejadoJ(k, 160, 54, 124, 12, P.tej, 4); tejadoJ(k, 160, 90, 152, 12, P.tej, 5);
      for (let x = 132; x < 188; x += 13) { k.R(x, 30, 7, 9, "#2a4a5a"); k.R(x, 30, 7, 1, "#8e8060"); }
      for (let x = 118; x < 204; x += 14) { k.R(x, 64, 8, 12, "#2a4a5a"); k.R(x, 64, 8, 1, "#8e8060"); }
      k.R(159, 0, 2, 8, "#3a2a20"); bandera(k, 161, 0, 18, 9, "#3a4a5a");
      k.elipse(160, 116, 44, 22, "#54707e"); k.elipse(160, 116, 38, 18, "#16232c"); for (let x = 126; x < 194; x += 9) k.poli([[x, 100 + Math.abs(x - 160) * 0.16], [x + 7, 100 + Math.abs(x - 160) * 0.16], [x + 3, 111]], "#f4efe0");
      for (let x = 130; x < 190; x += 9) k.poli([[x, 133 - Math.abs(x - 160) * 0.12], [x + 7, 133 - Math.abs(x - 160) * 0.12], [x + 3, 122]], "#f4efe0");
      k.elipse(104, 104, 6, 6, "#f4efe0"); k.elipse(216, 104, 6, 6, "#f4efe0"); k.elipse(105, 104, 3, 3, "#26262a"); k.elipse(215, 104, 3, 3, "#26262a");
      const Q = { base: "#b0a890", luz: "#c8c0a8", osc: "#8e8670" };
      sillares(k, 0, 134, 320, 14, Q, 5, 15); k.R(0, 133, 320, 2, "#d8d0b8"); adoquines(k, 148, 180, "#b0a890", "#958d78", "#c0b8a2");
      k.alfa(0.3, () => k.R(0, 148, 320, 3, "#5a5448"));
      [[46, 148], [270, 148]].forEach(([x, b]) => { k.palmera(x, b, 46); sombra(k, x + 2, b, 12, 2); });
      caja(k, 96, 160, 14, 10); barril(k, 212, 160, 11, 13); barril(k, 224, 163, 11, 13); [[24, 136], [298, 136]].forEach(([x, y]) => { k.R(x, y - 26, 2, 26, "#3a2a20"); bandera(k, x + 2, y - 26, 16, 9, "#2f6a8a"); });
    }, { ven: ["#2a4a5a"], tinte: 0.15 }],
    6: ["Alabesta", "La ciudad del desierto, con el palacio al fondo", (k) => {
      k.banda(["#f2b86a", "#f8d08a", "#fde6b0"], 0, 100);
      const DUNA = ["#f4dca0", "#e8c47e", "#d4ae68", "#b89050"], ROCA = ["#ecd2a0", "#d8b880", "#c09a64", "#a07e4e"];
      loma(k, [[-20, 96], [60, 84], [130, 100], [230, 90], [340, 82]], 126, ["#e8c88c", "#d8ae70", "#c49a5c"], 0.24);
      rellena(k, [[62, 122], [84, 62], [236, 62], [258, 122]], estratos(ROCA));
      k.R(84, 60, 152, 3, "#f4e4c0");
      for (let i = 0; i < 12; i++) { const y = 62 + i * 5, a = 11 + i * 2.2; k.R(160 - a, y, 2 * a, 5, i % 2 ? "#ecd8ae" : "#f8ecd0"); k.R(160 - a, y + 4, 2 * a, 1, "#c8a874"); }
      const PAL = ["#fbeed0", "#f2e0b8", "#d4bc90", "#b49c70"], ORO = ["#ffe08a", "#e8c86a", "#c0983e"];
      cilindro(k, 104, 34, 112, 28, PAL, 0.25); for (let x = 112; x < 208; x += 13) ventanaArco(k, x, 42, 7, 16, "#a8845a", "#7a5a3a");
      k.R(100, 32, 120, 3, "#d4bc90"); almenas(k, 100, 32, 120, "#f2e0b8", 7, 4, 3);
      [[116, 18, 8], [204, 18, 8]].forEach(([x, y, r]) => { cilindro(k, x - 6, y + 6, 12, 40, PAL, 0.25); esfera(k, x, y + 2, r, r, ORO); k.poli([[x - 2, y - 4], [x, y - 11], [x + 2, y - 4]], "#c0983e"); });
      esfera(k, 160, 22, 26, 20, ORO); k.R(132, 30, 56, 3, "#d4bc90"); k.R(159, -2, 2, 6, "#c0983e"); cilindro(k, 134, 33, 52, 8, PAL, 0.25); for (let x = 140; x < 180; x += 9) k.R(x, 35, 4, 5, "#7a5a3a");
      const c = (p, t) => ({ pared: p, luz: "#f8ecd0", osc: "#c8a874", techo: "#d8bc88", techoLuz: "#f2e0b8", techoOsc: "#b09468", plano: true, redonda: false, sombra: "#a88c5c" });
      k.suelo(124, "#e8c47e", "#d4ae68", "#f4dca0");
      casaTorcida(k, 2, 128, 42, 34, c("#ecd8ae")); casaTorcida(k, 48, 130, 36, 24, c("#f2e0b8")); casaTorcida(k, 88, 132, 26, 18, c("#e4cc9c"));
      casaTorcida(k, 206, 132, 30, 20, c("#f2e0b8")); casaTorcida(k, 240, 130, 34, 28, c("#ecd8ae")); casaTorcida(k, 278, 128, 44, 36, c("#e4cc9c"));
      [[8, 86], [254, 96]].forEach(([x, y]) => { k.elipse(x + 14, y + 2, 9, 7, "#e8c86a"); k.R(x + 5, y + 2, 18, 3, "#d4bc90"); });
      [[52, "#c0392b", "#f4efe0"], [212, "#2f6fa8", "#f4efe0"], [92, "#d8862a", "#f4efe0"]].forEach(([x, a, b]) => { for (let i = 0; i < 6; i++) k.R(x + i * 4, 112, 4, 3, i % 2 ? b : a); k.R(x, 115, 24, 1, "#7a5a3a"); k.R(x, 115, 1, 14, "#7a5a3a"); k.R(x + 23, 115, 1, 14, "#7a5a3a"); });
      caja(k, 56, 134, 12, 8); barril(k, 216, 134, 8, 9, ["#c9a878", "#a8845a", "#7a5a3a", "#5a4228"]);
      k.palmera(114, 130, 38); k.palmera(196, 132, 34); k.palmera(304, 150, 44); k.palmera(8, 154, 40);
      loma(k, [[-20, 160], [90, 142], [190, 168], [340, 148]], 180, DUNA, 0.4);
      for (let i = 0; i < 26; i++) { const x = k.rnd() * 320, y = 150 + k.rnd() * 28; k.R(x, y, 10 + k.rnd() * 18, 1, "#d4ae68"); }
    }, { tinte: 0.75, ven: VEN }],
    7: ["Skypeia", "Las islas en el cielo, con su mar de nubes blancas", (k) => {
      k.banda(["#3f9ae0", "#6cbcf0", "#a8dcf8", "#e0f4fc"], 0, 130);
      cirros(k, 8, 6, 40);
      nubarron(k, -24, 52, 96, 24); nubarron(k, 96, 76, 90, 16); nubarron(k, 262, 40, 80, 20);
      const LI = ["#8cd070", "#5fae50", "#3f8a3e", "#2a6a30"];
      for (let y = 0; y < 132; y++) { const c = 248 + Math.sin(y / 17) * 12, a = 11 + (y / 132) * 6; for (let x = Math.round(c - a); x <= c + a; x++) k.P(x, y, Math.sin((x - c) / 2 + y / 5) > 0.84 ? LI[3] : rampa(LI, Math.abs((x - c) / a + 0.35) * 0.72, x, y)); }
      [[20, -1], [46, 1], [74, -1], [100, 1]].forEach(([y, d]) => { const x = 248 + Math.sin(y / 17) * 12 + d * 14; k.poli([[x, y + 2], [x + d * 10, y - 7], [x + d * 26, y - 9], [x + d * 40, y - 2], [x + d * 28, y + 8], [x + d * 12, y + 8]], "#5fae50"); k.poli([[x, y + 2], [x + d * 40, y - 2], [x + d * 28, y + 8], [x + d * 12, y + 8]], "#3f8a3e"); k.linea(x, y + 2, x + d * 38, y - 2, "#8cd070"); });
      const PI = ["#efe8da", "#d8cfc0", "#b8ae9c", "#968c7a"], Q = { base: "#d8cfc0", luz: "#efe8da", osc: "#b0a694" };
      sillares(k, 76, 106, 132, 24, Q, 6, 14); k.R(76, 103, 132, 3, "#efe8da");
      [[86, 62], [114, 40], [170, 40], [198, 56]].forEach(([x, top]) => { cilindro(k, x - 5, top, 10, 106 - top, PI); k.R(x - 7, top - 2, 14, 3, "#efe8da"); k.R(x - 7, 102, 14, 3, "#b8ae9c"); [12, 26, 40].forEach((d) => k.R(x - 5, top + d, 10, 1, "#a89e8c")); });
      k.poli([[108, 40], [176, 40], [176, 30], [142, 22], [108, 30]], "#d8cfc0"); k.poli([[108, 40], [176, 40], [176, 37], [108, 37]], "#b8ae9c"); [[112, 30], [168, 30]].forEach(([x, y]) => k.R(x, y, 6, 3, "#efe8da"));
      k.R(141, 40, 2, 8, "#8a6a24");
      const ORO = ["#fff2b0", "#f4d870", "#d8ac40", "#a8842e"];
      rellena(k, [[142, 46], [152, 50], [158, 66], [160, 86], [170, 100], [114, 100], [124, 86], [126, 66], [132, 50]], (x, y) => rampa(ORO, Math.abs((x - 142) / 26 + 0.4) * 0.75, x, y));
      [[60], [72], [92]].forEach(([y]) => { k.R(120 + (y > 80 ? -2 : 8), y, y > 80 ? 44 : 28, 1, "#a8842e"); }); k.elipse(142, 100, 7, 3, "#a8842e");
      const NU = ["#ffffff", "#eaf4fa", "#c4dcec"];
      k.R(0, 128, 320, 52, "#f4f8fa");
      [[-30, 118, 90, 12], [64, 124, 80, 9], [152, 122, 90, 9], [252, 118, 100, 13], [-20, 140, 120, 11], [108, 146, 110, 9], [224, 142, 120, 11], [-16, 164, 140, 11], [140, 168, 120, 9], [262, 164, 90, 11]].forEach(([x, y, w, h]) => nubarron(k, x, y, w, h, NU));
      k.poli([[286, 152], [314, 152], [308, 158], [292, 158]], "#c9a03c"); k.R(299, 134, 1, 18, "#6d4628"); k.poli([[300, 134], [312, 148], [300, 150]], "#f4efe0");
    }, { tinte: 0.45, ven: VEN }],
    8: ["Wetar 7", "La ciudad de los canales: sube por terrazas hasta la gran fuente, y el agua baja de una a otra hasta el mar", (k) => {
      const { h } = Det.cuando(k), cx = 160, AG = ["#e8fbff", "#b8ecfa", "#7fd0f0", "#3fa6d8"], PI = ["#efe2c4", "#d8c8a4", "#b8a67e", "#94845e"];
      k.banda(CIELO, 0, 114);
      const OS = ["#8a96a8", "#6a7488", "#4a5468"];
      nubarron(k, -20, 40, 86, 18, h >= 18 ? OS : undefined); nubarron(k, 258, 30, 84, 16, h >= 18 ? OS : undefined); cirros(k, 6, 4, 26);
      k.agua(88, 136, MAR, "#d8f2fa", 50); reflejo(k, 90, 130);
      if (h >= 18 && h <= 20) [[-1, 0], [1, 320]].forEach(([d, x0]) => {
        const s = (19 - Math.min(h, 19)) * 24, cr = 40 + s, X = (u) => x0 - d * u;
        rellena(k, [[X(-2), 100], [X(-2), cr - 4], [X(30), cr - 10], [X(62), cr + 2], [X(58), cr + 12], [X(48), cr + 10], [X(60), cr + 34], [X(92), 100]], (x, y) => rampa(["#7fd0f0", "#3fa6d8", "#2a7ab0", "#1f5f90"], ((y - cr) / 60) * 0.8 + (Math.sin((x * 0.3 + y) / 6) > 0.7 ? 0.14 : 0), x, y));
        for (let u = 0; u <= 64; u++) { const y = cr - 10 + Math.pow((u - 30) / 30, 2) * 11; k.R(X(u), y, 2, 3 + (u % 5 === 0 ? 2 : 0), "#ffffff"); if (u % 3 === 0) k.P(X(u), y - 2, "#e8fbff"); }
        for (let i = 0; i < 9; i++) k.elipse(X(50 + (i % 3) * 7), cr + 12 + i * 2, 2 + (i % 2), 1, "#ffffff");
      });
      const casita = (x, b, w, a, i) => {
        const P = ["#f6ecd4", "#f2dcc0", "#e8d4b0", "#dce8ec", "#f8e0d0"][i % 5], T = i % 3 ? ["#f08a5a", "#c9502f", "#9a3a20"] : ["#e0704a", "#b8442a", "#8a3220"];
        k.R(x, b - a, w, a, P); k.R(x + w - 3, b - a, 3, a, "#c9b48c"); k.R(x, b - a, 1, a, "#fff8ea");
        for (let f = 0; f * 7 + 6 < a; f++) for (let v = x + 2; v < x + w - 4; v += 5) { k.R(v, b - a + 3 + f * 7, 3, 4, "#ffd27a"); k.P(v + 1, b - a + 2 + f * 7, "#b8a67e"); }
        k.poli([[x - 1, b - a], [x + w + 1, b - a], [x + w - 2, b - a - 6], [x + 2, b - a - 6]], T[1]); k.poli([[x + w * 0.55, b - a], [x + w + 1, b - a], [x + w - 2, b - a - 6], [x + w * 0.55, b - a - 6]], T[2]); k.R(x + 1, b - a - 1, w - 2, 1, T[0]);
      };
      const TER = [[38, 46, 4, 9, 8], [62, 82, 6, 10, 16], [88, 122, 8, 10, 18], [114, 176, 6, 20, 20]];
      TER.forEach(([t, a, s, m, alto], i) => {
        const y = (x) => t + s * ((x - cx) / a) ** 2, paso = 15 + i * 2, hueco = 10 + i * 6, sitio = [];
        for (let x = cx - a + 2; x < cx + a - 4; x += paso) sitio.push(x);
        sitio.sort((p, q) => Math.abs(q - cx) - Math.abs(p - cx));
        sitio.forEach((x, j) => { if (Math.abs(x + paso / 2 - cx) < hueco + paso / 2) return; casita(x, y(x + paso / 2) + 2, paso + 1, alto + ((x * 7) % 5), j); });
        for (let x = Math.max(0, cx - a); x < Math.min(320, cx + a); x++) { const y0 = Math.round(y(x)); for (let yy = y0; yy < y0 + m; yy++) k.P(x, yy, ((yy - y0) % 5 === 4 || (x + ((yy - y0) >> 2) * 6) % 13 === 0) ? PI[3] : rampa(PI, 0.08 + ((x - cx + a) / (2 * a)) * 0.6, x, yy)); k.P(x, y0, "#fff8ea"); k.P(x, y0 + m, "#6a5e44"); }
        if (m > 12) for (let x = 6; x < 320; x += 26) { if (Math.abs(x + 8 - cx) < 40) continue; const y0 = y(x + 8); k.elipse(x + 8, y0 + 10, 8, 6, "#2a5a7a"); k.R(x, y0 + 10, 17, 10, "#2a5a7a"); k.R(x, y0 + 17, 17, 3, "#3fa6d8"); }
        [-0.56, 0.56].forEach((f) => { const x = cx + f * a, y0 = y(x), w = 4 + i; for (let px = 0; px < w; px++) for (let yy = y0; yy < y0 + m + 2; yy++) k.P(x + px - w / 2, yy, (px + yy) % 5 === 0 ? AG[0] : AG[1 + (px % 2)]); k.elipse(x, y0 + m + 2, w, 2, "#ffffff"); });
      });
      rellena(k, [[cx - 24, 40], [cx + 24, 40], [cx + 60, 136], [cx - 60, 136]], (x, y) => (y % 7 === 0 ? PI[3] : (x + (y >> 3) * 6) % 17 === 0 ? PI[2] : rampa(PI, 0.1 + ((x - cx + 60) / 120) * 0.5, x, y)));
      cilindro(k, cx - 38, 34, 76, 26, ["#fbf3de", "#efe2c4", "#d8c8a4", "#b8a67e"], 0.3); for (let x = cx - 33; x < cx + 30; x += 11) { k.elipse(x + 3, 47, 3, 4, "#2a5a7a"); k.R(x, 47, 7, 10, "#2a5a7a"); } k.R(cx - 38, 58, 76, 2, "#94845e"); k.R(cx - 38, 34, 76, 1, "#fff8ea");
      for (let y = 38; y < 136; y++) { const a = 7 + (y - 38) * 0.17; for (let x = Math.round(cx - a); x <= cx + a; x++) k.P(x, y, Math.sin(x * 1.3 + y / 9) > 0.6 ? AG[0] : rampa(AG, ((Math.sin(x * 0.8) + 1) / 2) * 0.8, x, y)); k.P(cx - a - 1, y, PI[0]); k.P(cx + a + 1, y, PI[2]); }
      TER.forEach(([t]) => { k.elipse(cx, t + 9, 10 + (t - 38) * 0.18, 2, "#ffffff"); });
      k.elipse(cx, 37, 46, 8, PI[2]); k.elipse(cx, 35, 46, 8, PI[0]); k.elipse(cx, 35, 41, 6, AG[2]); k.elipse(cx - 6, 34, 30, 3, AG[1]);
      cilindro(k, cx - 8, 16, 16, 20, ["#fbf3de", "#efe2c4", "#d8c8a4", "#b8a67e"], 0.3); k.elipse(cx, 16, 18, 4, PI[2]); k.elipse(cx, 15, 18, 4, PI[0]); k.elipse(cx, 15, 15, 2, AG[2]);
      for (let y = -2; y < 16; y++) { const a = 3 + (y + 2) * 0.1; for (let x = Math.round(cx - a); x <= cx + a; x++) k.P(x, y, (x + y) % 3 ? AG[1] : AG[0]); }
      [-1, 1].forEach((d) => [[42, 3], [32, 2], [22, 2]].forEach(([l, g]) => { for (let t = 0; t <= 1; t += 0.012) k.R(cx + d * t * l - g / 2, 1 + t * t * 33, g, 2, t < 0.2 || t > 0.8 ? AG[0] : AG[1]); k.elipse(cx + d * l, 34, 4, 1, "#ffffff"); }));
      for (let y = 134; y < 150; y++) k.R(0, y, 320, 1, y < 140 ? "#3fa6d8" : y < 146 ? "#2f8fc4" : "#2878ac"); oleaje(k, 136, 149, "#d8f2fa", 36); reflejo(k, 136, 150);
      const PU = { base: "#e0d0ac", luz: "#f0e4c6", osc: "#b8a67e" };
      [[30, 80], [210, 80]].forEach(([x, w]) => { sillares(k, x, 120, w, 26, PU, 4, 9); k.elipse(x + w / 2, 146, w * 0.36, 18, "#2f8fc4"); k.elipse(x + w / 2, 147, w * 0.3, 14, "#2878ac"); k.R(x, 120, w, 2, "#fff8ea"); for (let px = x + 3; px < x + w; px += 8) k.R(px, 113, 2, 7, "#b8a67e"); k.R(x, 112, w, 2, "#e0d0ac"); });
      k.poli([[122, 138], [190, 138], [182, 147], [130, 147]], "#8a5a32"); k.poli([[122, 138], [190, 138], [188, 140], [124, 140]], "#c0895a"); k.R(150, 124, 2, 14, "#6d4628"); k.poli([[134, 126], [168, 126], [160, 120], [142, 120]], "#e8c35a");
      k.linea(190, 140, 208, 128, "#c9502f", 5); esfera(k, 212, 125, 8, 6, ["#f08a5a", "#c9502f", "#9a3a20"]); k.R(214, 122, 3, 3, "#ffffff"); k.R(215, 123, 2, 2, "#26262a"); k.R(217, 127, 3, 1, "#7a2a18"); k.poli([[202, 134], [198, 126], [206, 130]], "#9a3a20");
      const Q = { base: "#d4c098", luz: "#e4d2ac", osc: "#b0a07a" };
      sillares(k, 0, 150, 320, 30, Q, 7, 19); k.R(0, 149, 320, 2, "#f0e4c6"); k.alfa(0.25, () => k.R(0, 151, 320, 2, "#6a5a3a"));
      k.R(300, 72, 5, 78, "#7a5230"); k.R(300, 72, 2, 78, "#a87444"); k.linea(302, 76, 258, 62, "#7a5230", 3); k.linea(302, 96, 268, 63, "#6d4628", 2); k.R(262, 62, 1, 30, "#3a2a20"); k.R(258, 92, 10, 5, "#a87444");
      [[108, 150], [226, 150]].forEach(([x, b]) => { k.R(x, b - 26, 2, 26, "#3a3a44"); k.R(x - 3, b - 32, 8, 6, "#ffd27a"); k.R(x - 4, b - 33, 10, 1, "#3a3a44"); brillo(k, x + 1, b - 29, 18, 16, "#ffcf6a", 0.6); });
      [[26], [294]].forEach(([x]) => { cilindro(k, x - 3, 140, 7, 12, ["#8a8a94", "#6a6a74", "#4a4a54"]); k.R(x - 4, 139, 9, 2, "#a8a8b4"); });
      barril(k, 76, 166, 11, 13); barril(k, 88, 169, 11, 13); caja(k, 244, 170, 14, 11); caja(k, 256, 166, 12, 9);
    }, { ven: ["#3f6f9a", "#ffd27a"], dx: 84 }],
    16: ["Clams Town", "La base de la Marina, con la estatua de Margon y el patio donde tienen atado a Korro", (k) => {
      const { h } = Det.cuando(k);
      k.banda(CIELO, 0, 104);
      nubarron(k, -24, 58, 128, 30); nubarron(k, 214, 56, 132, 34); nubarron(k, 40, 18, 46, 8); nubarron(k, 236, 12, 52, 8);
      k.agua(92, 112, MAR, "#d8f2fa", 34); reflejo(k, 94, 112);
      const blanco = ["#ffffff", "#eef0f2", "#d6dce4", "#b7c2d0"], cx = 160, rx = 52, top = 42, curva = (x) => 5 * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2));
      for (let x = cx - rx; x <= cx + rx; x++) { const t = (x - cx) / rx, v = Math.abs(t + 0.35) / 1.35; for (let y = Math.round(top + curva(x)); y < 118; y++) k.P(x, y, rampa(blanco, v, x, y)); }
      for (let x = cx - rx; x <= cx + rx; x++) { const y = Math.round(top + curva(x)); k.R(x, y + 2, 1, 8, (x - cx) / rx > 0.45 ? "#234a86" : "#2f5fa8"); k.R(x, y + 2, 1, 1, "#5a86c8"); k.R(x, y + 34, 1, 2, "#2f5fa8"); }
      rotulo(k, 148, 50, "MARINE", "#ffffff");
      for (let f = 0; f < 3; f++) for (let a = -1.25; a <= 1.25; a += 0.31) {
        const x = cx + Math.sin(a) * (rx - 2), y = top + 16 + curva(x) + f * 18, w = Math.max(3, Math.round(7 * Math.cos(a)));
        if (f === 2 && Math.abs(x - cx) < 16) continue;
        k.R(x - w / 2, y, w, 11, "#34547e"); k.R(x - w / 2, y, w, 1, "#8fa4bc"); k.R(x - w / 2, y + 11, w + 1, 1, "#9aa8bc"); if (w > 4) k.R(x - w / 2 + 1, y + 1, 2, 4, "#7fb0d8");
      }
      k.R(cx - rx - 2, top - 3, 2 * rx + 4, 3, "#c8d0dc"); for (let x = cx - rx; x < cx + rx; x += 5) k.R(x, top - 7, 1, 4, "#9aa8bc"); k.R(cx - rx - 1, top - 8, 2 * rx + 2, 1, "#9aa8bc");
      const pz = "#a8acb8", pzL = "#c8ccd6", pzO = "#7d818e";
      k.R(149, 36, 22, 4, pzO); k.R(147, 39, 26, 3, pz);
      k.R(152, 28, 7, 8, pzO); k.R(161, 28, 7, 8, pz); k.R(152, 28, 3, 8, pz);
      if (h < 12) { k.R(152, 24, 7, 12, pzO); k.R(161, 24, 7, 12, pz); k.R(152, 24, 3, 12, pz);
      k.poli([[146, 30], [174, 30], [170, 12], [150, 12]], pz); k.poli([[146, 30], [155, 30], [155, 12], [150, 12]], pzL); k.poli([[166, 30], [174, 30], [170, 12], [166, 12]], pzO); k.R(159, 15, 2, 15, pzO); k.poli([[152, 12], [159, 12], [159, 20]], pzL); k.poli([[168, 12], [161, 12], [161, 20]], pzO);
      k.linea(150, 14, 142, 27, pz, 3); k.linea(170, 15, 180, 9, pz, 4); k.elipse(141, 28, 2, 2, pz);
      k.elipse(160, 7, 5, 5, pz); k.poli([[154, 7], [166, 7], [165, 12], [155, 12]], pzL); k.R(155, 9, 10, 1, pzO); k.R(157, 5, 2, 1, "#4a4d58"); k.R(162, 5, 2, 1, "#4a4d58"); k.elipse(160, 2, 6, 2, pzO);
      k.R(180, 5, 3, 7, pzO); k.poli([[182, 2], [190, 0], [197, 4], [199, 10], [197, 16], [190, 19], [182, 15], [186, 9]], pzL); k.poli([[190, 0], [197, 4], [199, 10], [197, 16], [190, 19], [193, 10]], pzO); }
      const muro = "#d9cdb4", muroL = "#efe5cf", muroO = "#b5a88c";
      k.R(0, 104, 320, 24, muro); k.R(0, 102, 320, 3, muroL); k.R(0, 125, 320, 3, muroO);
      for (let y = 108, f = 0; y < 125; y += 5, f++) { k.R(0, y, 320, 1, muroO); for (let x = f % 2 ? 6 : 16; x < 320; x += 20) k.R(x, y, 1, 5, muroO); }
      for (let x = 2; x < 320; x += 12) k.R(x, 99, 7, 4, muroL);
      k.R(138, 98, 44, 30, "#c0b49c"); k.elipse(160, 110, 17, 12, "#6b4a30"); k.R(143, 110, 34, 18, "#6b4a30"); k.R(159, 98, 2, 30, "#4a3020"); for (let x = 146; x < 176; x += 5) k.R(x, 104, 1, 24, "#553722"); [116, 122].forEach((y) => k.R(143, y, 34, 1, "#4a3020"));
      k.R(150, 94, 20, 5, "#2f5fa8"); k.elipse(160, 96, 2, 2, "#ffffff");
      k.suelo(127, "#d0ba88", "#bfa775", "#e0cc9c", 180, 700);
      for (let y = 136; y < 180; y += 9) for (let x = (y % 2 ? 6 : 26); x < 320; x += 38 + (y % 5) * 6) k.R(x, y, 10 + (x % 7), 1, "#bfa775");
      for (let y = 128; y < 134; y++) for (let x = 0; x < 320; x++) if (trama(x, y) < 1 - (y - 128) / 6) k.P(x, y, "#b09a6c");
      k.poli([[142, 128], [178, 128], [196, 180], [124, 180]], "#c4ad7c"); for (let y = 133; y < 180; y += 6) for (let x = 124 + (y % 12 ? 3 : 10); x < 196; x += 13) if (Math.abs(x - 160) < 18 + (y - 128) * 0.7) k.R(x, y, 9, 1, "#b09a6c");
      casaTorcida(k, 4, 128, 44, 30, { chimenea: true, toldo: "#c0392b" });
      casaTorcida(k, 50, 128, 34, 22, { pared: "#e8d6b0", techo: "#c0602a", techoLuz: "#dc7c42", techoOsc: "#984820", redonda: false });
      casaTorcida(k, 232, 128, 36, 24, { pared: "#f6ecd4", techo: "#3f8ac0", techoLuz: "#5aa4d8", techoOsc: "#2c6c9c", toldo: "#3f8ac0", ventana: false });
      casaTorcida(k, 270, 128, 46, 32, { chimenea: true, redonda: false });
      k.alfa(0.4, () => k.elipse(122, 145, 16, 3, "#8a7450"));
      k.R(119, 100, 5, 45, "#6b4a30"); k.R(119, 100, 2, 45, "#8a6440"); k.R(105, 110, 33, 4, "#6b4a30"); k.R(105, 110, 33, 1, "#8a6440"); [[108, 110], [134, 110], [119, 126]].forEach(([x, y]) => k.R(x, y, 5, 3, "#d8c8a0"));
      [[204, 140], [214, 142]].forEach(([x, y]) => { k.R(x, y - 11, 9, 11, "#8a5a32"); k.R(x, y - 8, 9, 1, "#5a3a20"); k.R(x, y - 4, 9, 1, "#5a3a20"); k.R(x + 1, y - 11, 2, 11, "#a87444"); });
      k.R(92, 136, 12, 9, "#a87444"); k.R(92, 136, 12, 1, "#c99a64"); k.R(92, 140, 12, 1, "#7a5230"); k.R(97, 136, 1, 9, "#7a5230");
      if (h >= 12) { esfera(k, 214, 152, 9, 8, ["#c8ccd6", "#a8acb8", "#7d818e"]); k.R(208, 150, 12, 3, "#7d818e"); k.R(210, 146, 3, 2, "#4a4d58"); k.R(217, 146, 3, 2, "#4a4d58"); k.poli([[176, 170], [196, 164], [204, 172], [188, 180]], "#a8acb8"); k.linea(186, 170, 168, 158, "#7d818e", 3); [[150, 150], [232, 166], [120, 168]].forEach(([x, b]) => k.roca(x, b, 12, 6, "#a8acb8", "#c8ccd6", "#7d818e")); }
    }, { ven: ["#3f6f9a", "#ffd27a"], dx: 70 }],
    23: ["El reino de Tambor", "Las montañas en forma de tambor, el castillo en la cumbre y la nieve rosa de Huliluk", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#5f86bc", "#8fb0d6", "#d4e2ee"], 0, 126);
      nubarron(k, -8, 22, 92, 13); nubarron(k, 236, 30, 100, 14); nubarron(k, 96, 62, 26, 5);
      k.cordillera(124, 42, "#c3d1e2", "#eef4f9", 1.3, 1.25);
      const lejos = { roca: ["#c4d1e2", "#b6c5d9", "#a8b9d0", "#9cadc6"], nieve: ["#f4f8fc", "#e2eaf3", "#cfdbe9"], grietas: 4, repisas: 2 };
      const medio = { roca: ["#aebdd2", "#96a7c2", "#7f91b0", "#6c7ea0"], nieve: ["#ffffff", "#e6eef6", "#c9d7e7"], grietas: 7, repisas: 4 };
      tambor(k, 214, 126, 20, 64, lejos); tambor(k, 104, 126, 17, 74, lejos);
      tambor(k, 58, 126, 31, 86, medio); tambor(k, 268, 126, 35, 78, medio);
      const flor = h >= 14, rosa = flor ? ["#ffe9f0", "#fbd0df", "#efb2c9"] : ["#ffffff", "#e6eef6", "#c9d7e7"];
      tambor(k, 160, 128, 49, 54, { roca: ["#9fb0c9", "#8496b5", "#6a7c9f", "#55668a", "#46567a"], nieve: rosa, grietas: 18, repisas: 9 });
      k.linea(116, 48, 70, 84, "#3a4258"); k.R(68, 80, 2, 8, "#3a4258"); k.R(66, 80, 6, 1, "#3a4258");
      k.R(93, 66, 1, 3, "#3a4258"); k.R(89, 69, 9, 6, "#c0392b"); k.R(89, 68, 9, 1, "#8a2820"); k.R(90, 70, 3, 2, "#ffd27a"); k.R(94, 70, 3, 2, "#ffd27a");
      const pal = { piedra: ["#a5b2c8", "#8c9ab6", "#73829f", "#5d6b88"], techo: ["#5f77a8", "#44598a", "#33456e"], nieve: "#f6f9fc" };
      for (let x = 130; x < 190; x++) for (let y = 30; y < 55; y++) k.P(x, y, rampa(pal.piedra, (x - 130) / 62 + 0.05, x, y));
      for (let x = 130; x < 190; x += 6) { k.R(x, 27, 4, 3, pal.piedra[1]); k.R(x, 26, 4, 1, rosa[1]); }
      for (let x = 136; x < 186; x += 11) { k.elipse(x + 2, 40, 2, 2, "#3a4258"); k.R(x, 40, 5, 6, "#3a4258"); k.R(x + 1, 41, 3, 4, "#ffd27a"); }
      k.elipse(160, 49, 7, 7, "#3a2a3a"); k.R(153, 49, 14, 7, "#3a2a3a");
      torreta(k, 149, 32, 22, 16, 10, pal); torreta(k, 118, 55, 15, 30, 13, pal); torreta(k, 187, 55, 15, 26, 12, pal);
      if (flor) { k.R(159, 2, 1, 6, "#3a2a20"); k.poli([[160, 2], [176, 3], [173, 7], [176, 11], [160, 11]], "#2a2630"); k.elipse(167, 6, 2, 2, "#f4efe0"); k.P(165, 5, "#f28aa8"); k.P(169, 5, "#f28aa8"); k.P(167, 3, "#f28aa8"); k.P(167, 9, "#f28aa8"); }
      k.suelo(124, "#eef3f9", "#dfe8f2", "#ffffff", 180, 650);
      k.poli([[0, 128], [0, 116], [34, 110], [76, 118], [112, 126], [112, 130]], "#f6f9fc"); k.poli([[320, 128], [320, 112], [286, 106], [242, 116], [208, 126], [208, 130]], "#f6f9fc");
      k.poli([[60, 130], [76, 118], [112, 126], [112, 130]], "#dbe5f0"); k.poli([[262, 130], [242, 116], [208, 126], [208, 130]], "#dbe5f0");
      const verde = { hoja: "#2f5a4a", hojaOsc: "#1f4238", nieve: ["#ffffff", "#d6e2ef"] }, cerezo = { hoja: "#3a5a52", hojaOsc: "#2a4440", nieve: flor ? ["#ffd9e6", "#f4b6cc"] : ["#ffffff", "#d6e2ef"] };
      [[20, 118, 18, verde], [36, 121, 24, cerezo], [92, 122, 18, cerezo], [108, 125, 22, verde], [216, 125, 22, cerezo], [232, 122, 16, verde], [282, 118, 24, cerezo], [302, 116, 18, verde]].forEach(([x, b, h, p]) => pinoNevado(k, x, b, h, p));
      casaNieve(k, 122, 128, 24, 13); casaNieve(k, 176, 129, 26, 15, false); casaNieve(k, 64, 130, 20, 11, false); casaNieve(k, 238, 130, 22, 12);
      [[44, 142, 62, 6], [254, 146, 74, 7], [118, 172, 96, 6], [296, 170, 58, 5], [12, 170, 52, 5]].forEach(([x, y, a, b]) => { k.elipse(x, y + 2, a, b, "#cdd9e8"); k.elipse(x - 3, y, a - 1, b - 1, "#f8fbfd"); });
      camino(k, 130, 180, (f) => 160 + Math.sin(f * 4.2) * (3 + f * 14), (f) => 7 + f * 20, "#d6e1ee", "#e6edf5", "#a9bbd2");
      [[26, 158], [44, 154], [62, 151], [80, 149]].forEach(([x, y], i, t) => { if (i) k.linea(t[i - 1][0] + 1, t[i - 1][1] - 5, x, y - 5, "#7a5a3c"); k.R(x, y - 8, 2, 9, "#6b4a30"); k.R(x - 1, y - 9, 4, 2, "#ffffff"); });
      [[210, 160, 20, 9], [36, 172, 18, 8], [292, 150, 16, 8]].forEach(([x, b, w, h]) => { k.roca(x, b, w, h, "#7f8eaa", "#a4b1c6", "#5f6e8c"); k.poli([[x + w * 0.1, b - h * 0.5], [x + w * 0.45, b - h - 1], [x + w * 0.86, b - h * 0.55], [x + w * 0.6, b - h * 0.5], [x + w * 0.42, b - h * 0.62]], "#f6f9fc"); });
      pinoNevado(k, 2, 186, 96); pinoNevado(k, 318, 186, 104);
      for (let i = 0; i < 170; i++) k.P(k.rnd() * 320, k.rnd() * 178, flor && i % 3 === 0 ? "#ffc4d8" : "#ffffff");
      for (let i = 0; i < 46; i++) k.R(k.rnd() * 320, k.rnd() * 172, 2, 2, flor && i % 2 === 0 ? "#ffd4e2" : "#ffffff");
    }, { tinte: 0.25, dx: 62, ven: VEN }],
    9: ["Threllir Bark", "La isla de los muertos, con su castillo bajo la luna", (k) => {
      k.banda(["#160f2a", "#241a42", "#3a2a5e"], 0, 120); k.astro(70, 46, 22, "#f2eeb8", "#7a6a9a"); k.estrellas(90, 60);
      [[60, 40, 2], [78, 52, 3], [64, 56, 2], [84, 38, 2]].forEach(([x, y, r]) => k.elipse(x, y, r, r, "#d8d29c"));
      const NIE = ["#4a3f68", "#3a3058", "#2a2244"];
      nubarron(k, 180, 40, 150, 14, NIE); nubarron(k, -24, 74, 110, 12, NIE);
      k.cordillera(122, 34, "#2a1f44", null, 2.4);
      const P = ["#5a4c78", "#463a62", "#352a4e", "#261e3a"];
      const torreT = (x, base, w, h, ladea) => {
        rellena(k, [[x, base], [x + ladea, base - h], [x + w + ladea, base - h], [x + w, base]], (px, py) => rampa(P, ((px - x - ladea * (base - py) / h) / w) * 0.9, px, py));
        rellena(k, [[x + ladea - 4, base - h + 1], [x + w + ladea + 4, base - h + 1], [x + w * 0.7 + ladea * 2, base - h - 14], [x + w * 0.5 + ladea * 3.4, base - h - w * 1.5]], (px, py) => (px < x + ladea + w * 0.4 ? "#2f2448" : "#1f1832"));
        for (let y = base - h + 8; y < base - 8; y += 13) { const vx = x + w * 0.5 + ladea * (base - y) / h; k.R(vx - 2, y, 4, 6, "#ffcf6a"); k.R(vx - 2, y - 1, 4, 1, "#1f1832"); }
      };
      torreT(112, 118, 24, 58, -6); torreT(186, 118, 22, 50, 7); torreT(148, 118, 34, 78, 4);
      rellena(k, [[120, 118], [126, 84], [200, 80], [208, 118]], (px, py) => rampa(P, ((px - 120) / 88) * 0.7 + 0.1, px, py));
      for (let x = 130; x < 198; x += 12) { ventanaArco(k, x, 92 + (x % 3), 6, 12, "#1f1832", "#ffcf6a"); }
      k.elipse(164, 114, 9, 11, "#1a1228"); k.R(155, 114, 18, 6, "#1a1228");
      k.suelo(118, "#2f3a34", "#242e2a", "#3f4a42"); k.hierbas(122, 178, 60, ["#3f5a44", "#1f2a24"]);
      camino(k, 122, 180, (f) => 164 + Math.sin(f * 3.4) * f * 22, (f) => 5 + f * 18, "#2a2832", "#3a3844", "#4a4856");
      [[30, 142, -2], [70, 158, 2], [224, 150, -2], [270, 136, 3], [112, 170, 2], [206, 172, -3]].forEach(([x, y, l]) => { rellena(k, [[x, y], [x + 1 + l, y - 13], [x + 8 + l, y - 13], [x + 9, y]], () => "#6a6878"); k.elipse(x + 5 + l, y - 13, 4, 3, "#7a7888"); k.R(x + 4 + l * 0.6, y - 11, 2, 7, "#47454f"); k.R(x + 2 + l * 0.6, y - 9, 6, 2, "#47454f"); sombra(k, x + 5, y, 8, 2); });
      const seco = (x, b, d) => { rellena(k, [[x - 6, b], [x - 2, b - 40], [x + 3, b - 62], [x + 5, b - 40], [x + 8, b]], (px, py) => (px < x ? "#2a2030" : "#1a1420")); [[-30, 18, 2], [-44, 30, 2], [-52, -16, 2], [-24, -20, 1], [-60, 24, 1]].forEach(([dy, l, g]) => { k.linea(x, b + dy, x + d * Math.abs(l), b + dy - Math.abs(l) * 0.7, "#1a1420", g); k.linea(x + d * Math.abs(l), b + dy - Math.abs(l) * 0.7, x + d * Math.abs(l) * 1.4, b + dy - Math.abs(l) * 0.5, "#1a1420"); }); };
      seco(10, 130, 1); seco(306, 132, -1); seco(-2, 182, 1); seco(322, 184, -1);
      k.niebla(120, 172, "#8a9ab8", 0.14);
      for (let i = 0; i < 7; i++) { const x = 170 + k.rnd() * 120, y = 12 + k.rnd() * 34; k.R(x - 2, y, 2, 1, "#120c20"); k.R(x + 1, y, 2, 1, "#120c20"); k.P(x, y + 1, "#120c20"); }
    }, { base: "noche", astro: "siempre", tinte: 0.6, fuego: ["#ffcf6a"] }],
    10: ["El archipiélago Sobaady", "Manglares gigantes y burbujas que suben del suelo", (k) => {
      k.banda(["#7fd0e6", "#a8e2ee", "#d8f4f0"], 0, 138);
      k.elipse(160, 70, 34, 34, "#c8e8ea"); k.elipse(160, 70, 31, 31, "#a8e2ee"); for (let a = 0; a < 12; a++) { const c = (a / 12) * 6.283, x = 160 + Math.cos(c) * 32, y = 70 + Math.sin(c) * 32; k.linea(160, 70, x, y, "#c8e8ea"); k.R(x - 3, y, 6, 5, ["#e8607a", "#f2c84b", "#3fa6d8"][a % 3]); } k.linea(160, 70, 146, 136, "#b8d8da", 2); k.linea(160, 70, 174, 136, "#b8d8da", 2);
      const COR = ["#c8a47a", "#a8865e", "#8a6a4a", "#6d5238"];
      const mangle = (x, w, num) => {
        for (let px = x; px < x + w; px++) { const t = (px - x) / w; for (let y = 0; y < 136; y++) { const v = Math.sin(px / 2.6 + Math.sin(y / 11) * 1.5) > 0.55 ? 0.3 : 0; k.P(px, y, rampa(COR, Math.abs(t - 0.32) * 1.1 + v, px, y)); } }
        for (let r = -2; r < 6; r++) { const a = x + r * (w / 4) + 2; k.linea(a + 8, 122, a + (r - 1.5) * 12, 146, r % 2 ? "#6d5238" : "#8a6a4a", 4); }
        k.R(x + w / 2 - 13, 70, 26, 11, "#f4efe0"); k.R(x + w / 2 - 13, 70, 26, 1, "#8a6a4a"); rotulo(k, x + w / 2 - 11 + (num.length < 5 ? 2 : 0), 73, num, "#3a2a20");
      };
      mangle(14, 46, "GR 24"); mangle(250, 54, "GR 41"); mangle(92, 30, "GR 13"); mangle(198, 26, "GR 30");
      const H = { tronco: "#5b3a24", copa: "#5fa85a", borde: "#3f8a4a", luz: "#8cd070", osc: "#4f9a4a" };
      for (let x = -6; x < 330; x += 22) k.cumulo(x, 8 + (x % 3) * 3, 15, H); for (let x = 6; x < 330; x += 30) k.cumulo(x, 22 + (x % 4), 9, H);
      k.R(0, 134, 320, 46, "#a8d07a"); loma(k, [[-20, 138], [90, 132], [210, 140], [340, 134]], 180, ["#c8e48c", "#a8d07a", "#8cbc66", "#74a858"], 0.1);
      k.hierbas(140, 178, 90, ["#74a858", "#d8f0a0"]); flores(k, 142, 176, 40, ["#ffffff", "#ffd27a", "#e8a0c0"]);
      casaTorcida(k, 58, 140, 30, 20, { pared: "#f6ecd4", techo: "#3f8ac0", techoLuz: "#5aa4d8", techoOsc: "#2c6c9c", toldo: "#e8607a", ventana: false });
      camino(k, 136, 180, (f) => 158 + Math.sin(f * 3) * 8, (f) => 8 + f * 18, "#c8c088", "#dcd49c");
      for (let i = 0; i < 32; i++) {
        const x = k.rnd() * 320, y = 16 + k.rnd() * 150, r = i % 7 === 0 ? 10 + k.rnd() * 4 : 2 + k.rnd() * 6;
        k.alfa(0.2, () => k.elipse(x, y, r, r, "#ffffff")); k.alfa(0.5, () => { for (let a = 0; a < 6.3; a += 0.3) k.P(x + Math.cos(a) * r, y + Math.sin(a) * r, "#ffffff"); }); k.R(x - r * 0.45, y - r * 0.45, Math.max(1, r * 0.3), Math.max(1, r * 0.25), "#ffffff");
      }
    }, { tinte: 0.45, ven: VEN }],
    11: ["Miraneford", "El cuartel de la Marina, en su bahía", (k) => {
      const { h } = Det.cuando(k);
      k.banda(CIELO, 0, 114);
      nubarron(k, -20, 56, 84, 22); nubarron(k, 262, 48, 80, 24);
      const B = ["#ffffff", "#ececea", "#d0d0ce", "#aeb0b4"], A = { c: "#2f5fa8", luz: "#4a7cc4", osc: "#234a86" };
      const piso = (x, y, w, h) => { cilindro(k, x, y, w, h, B, 0.3); for (let f = 0; f < Math.floor(h / 13); f++) for (let px = x + 7; px < x + w - 9; px += 13) { k.R(px, y + 5 + f * 13, 7, 8, "#3f6f9a"); k.R(px, y + 5 + f * 13, 7, 1, "#9aa8bc"); } };
      piso(60, 62, 200, 50); tejadoJ(k, 160, 64, 214, 10, A, 4); piso(90, 34, 140, 30); tejadoJ(k, 160, 36, 154, 10, A, 4); piso(122, 12, 76, 24); tejadoJ(k, 160, 14, 88, 10, A, 4);
      k.elipse(160, 86, 19, 17, "#2f5fa8"); k.elipse(160, 86, 15, 13, "#ffffff"); k.R(150, 84, 20, 3, "#2f5fa8"); k.R(158, 76, 3, 20, "#2f5fa8"); k.poli([[146, 84], [160, 76], [174, 84]], "#2f5fa8"); k.R(146, 102, 28, 8, "#2f5fa8"); rotulo(k, 148, 104, "MARINE", "#ffffff");
      const Q = { base: "#c8c8c4", luz: "#dcdcd8", osc: "#a4a4a0" };
      sillares(k, 44, 104, 232, 10, Q, 4, 13); almenas(k, 44, 104, 232, "#dcdcd8", 8, 5, 3);
      k.agua(112, 150, ["#2f86c6", "#2472b0", "#1c5f98"], "#bfe6f6", 90); reflejo(k, 114, 150);
      if (h >= 20) { rellena(k, [[-2, 112], [322, 112], [322, 150], [-2, 150]], (x, y) => (Math.sin(x / 7 + y / 2.5) > 0.9 ? "#ffffff" : rampa(["#e8f4fa", "#cfe6f2", "#a8d0e8"], (y - 112) / 44, x, y))); [[28, 40, 34], [76, 28, 22], [244, 30, 24], [292, 42, 36]].forEach(([x, w, a]) => { k.poli([[x - w / 2, 128], [x - w * 0.2, 128 - a], [x + w * 0.1, 128 - a * 0.7], [x + w / 2, 128]], "#c8e4f4"); k.poli([[x + w * 0.1, 128 - a * 0.7], [x + w / 2, 128], [x + w * 0.1, 128]], "#8ac0e0"); }); for (let i = 0; i < 14; i++) { const x = k.rnd() * 320, y = 116 + k.rnd() * 30; k.linea(x, y, x + 16, y + 3, "#8ac0e0"); } }
      [[58, 124], [262, 128]].forEach(([x, y], i) => { const d = i ? -1 : 1; k.poli([[x - 26, y], [x + 26, y], [x + 20 * d + (i ? 6 : -6), y + 10], [x - 20, y + 10]], "#f0f0ec"); k.R(x - 26, y, 52, 2, "#2f5fa8"); k.R(x - 3, y - 26, 3, 26, "#6d4628"); k.poli([[x - 18, y - 24], [x + 15, y - 24], [x + 12, y - 6], [x - 15, y - 6]], "#f4f4f0"); k.elipse(x - 2, y - 15, 5, 4, "#2f5fa8"); });
      espuma(k, 148, 0, 320, "#e8f4fa");
      const S = { base: "#c9c0ac", luz: "#dcd4c0", osc: "#a89f8b" };
      sillares(k, 0, 150, 320, 30, S, 7, 23); k.R(0, 150, 320, 2, "#efe6d2");
      k.R(108, 128, 104, 22, "#6d4628"); tablas(k, 108, 128, 104, 22, "#7a5230", "#5a3a20", "#a87444", 5, true); k.R(104, 126, 112, 3, "#a87444"); [[120], [196]].forEach(([x]) => k.R(x, 98, 4, 30, "#5a3a20")); k.R(116, 96, 88, 4, "#7a5230");
      [[26, 150], [292, 150]].forEach(([x, y], i) => { k.R(x - 8, y - 6, 18, 6, "#4a4a54"); k.linea(x, y - 8, x + (i ? -20 : 20), y - 16, "#2a2a34", 4); k.elipse(x, y - 2, 5, 5, "#3a3a44"); });
      if (h >= 21) { const g = [[70, 182], [94, 170], [84, 162], [116, 156], [130, 150]]; g.forEach((p, i) => { if (i) { k.linea(g[i - 1][0], g[i - 1][1], p[0], p[1], "#26262a", 3); k.linea(g[i - 1][0] + 1, g[i - 1][1], p[0] + 1, p[1], "#6a6458"); } }); [[250, 182], [232, 168], [244, 160], [216, 150]].forEach((p, i, t) => { if (i) k.linea(t[i - 1][0], t[i - 1][1], p[0], p[1], "#26262a", 3); }); }
      if (h === 23) [[150, 166], [186, 172], [120, 176]].forEach(([x, y]) => { k.elipse(x, y, 14, 3, "#8a2418"); k.elipse(x, y, 11, 2, "#e8502a"); k.elipse(x - 2, y, 6, 1, "#ffe06a"); k.llama(x, y, 0.5); });
    }, { ven: ["#3f6f9a", "#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#8a2418"] }],
    12: ["El país de Wona", "Cerezos, un torii rojo y la gran montaña", (k) => {
      k.banda(["#f2a8b8", "#f8c4c8", "#fde0d4", "#fff0dc"], 0, 112);
      const NU = ["#fff4f4", "#fbdcdc", "#eeb8c0"];
      nubarron(k, -20, 46, 80, 14, NU); nubarron(k, 250, 56, 90, 14, NU);
      montana(k, 160, 110, 230, 92, { roca: ["#9a88a8", "#7a6a8a", "#5f5270", "#4a4058"], nieve: ["#ffffff", "#e4dcec"], hasta: 0.3, rugosa: 0.4 });
      nubarron(k, 70, 78, 60, 7, NU); nubarron(k, 194, 84, 60, 6, NU);
      const R = { c: "#3a4a5a", luz: "#55687a", osc: "#26323e" }, B = ["#fbf3e6", "#efe2cc", "#d0c0a4"];
      [[112, 100], [196, 100]].forEach(([x, b]) => { k.R(x, b - 14, 24, 14, "#efe2cc"); k.R(x + 18, b - 14, 6, 14, "#d0c0a4"); tejadoJ(k, x + 12, b - 13, 36, 8, R); });
      cilindro(k, 146, 74, 28, 34, B); tejadoJ(k, 160, 76, 46, 10, R); cilindro(k, 150, 56, 20, 19, B); tejadoJ(k, 160, 58, 34, 9, R); for (let x = 150; x < 170; x += 7) k.R(x, 84, 4, 8, "#3a4a5a"); k.R(149, 96, 22, 1, "#d0c0a4");
      k.suelo(110, "#8cc070", "#74a858", "#a8d488"); k.hierbas(114, 178, 90);
      k.poli([[-4, 124], [36, 112], [52, 112], [-4, 140]], "#6fb4d8");
      for (let i = 0; i < 14; i++) { const y = 176 - i * 5.2, a = 44 - i * 2.2; k.R(160 - a, y, 2 * a, 5, i % 2 ? "#c8bea8" : "#d8cfba"); k.R(160 - a, y + 4, 2 * a, 1, "#a89e88"); }
      const T = ["#e8604a", "#c0392b", "#8a2820"];
      cilindro(k, 128, 64, 9, 62, T); cilindro(k, 183, 64, 9, 62, T); k.R(118, 70, 84, 5, "#c0392b"); k.R(118, 70, 84, 1, "#e8604a");
      for (let x = 108; x <= 212; x++) { const u = Math.abs(x - 160) / 52, y = 52 + Math.pow(u, 3) * -5; k.R(x, y, 1, 4, "#26262a"); k.R(x, y + 4, 1, 4, "#c0392b"); } k.R(154, 58, 12, 12, "#26262a"); rotulo(k, 156, 61, "W", "#e8c35a");
      [[108, 142], [212, 142], [92, 164], [228, 164]].forEach(([x, b], i) => { k.R(x - 2, b - 12, 4, 12, "#a89e88"); k.R(x - 5, b - 13, 10, 2, "#8e8470"); k.R(x - 3, b - 19, 6, 6, "#ffd27a"); k.R(x - 4, b - 20, 8, 1, "#8e8470"); k.poli([[x - 6, b - 20], [x + 6, b - 20], [x, b - 25]], "#8e8470"); });
      const casaW = (x, b, w, h) => { tablas(k, x, b - h, w, h, "#b8966a", "#8a6a44", "#d0ae80", 4, true); k.R(x + 3, b - h + 3, w - 6, h - 9, "#f4ead4"); k.R(x + w / 2, b - h + 3, 1, h - 9, "#8a6a44"); tejadoJ(k, x + w / 2, b - h + 1, w + 12, 9, R); };
      casaW(58, 120, 40, 18); casaW(226, 120, 42, 18);
      const rosa = { tronco: "#5b3a24", copa: "#f2a8c0", borde: "#d87a9a", luz: "#fcd0dc", osc: "#e890ac" };
      k.arbolote(24, 138, 3, rosa); k.arbolote(296, 142, 3.2, rosa); k.arbolote(84, 132, 1.5, rosa); k.arbolote(244, 134, 1.4, rosa);
      k.alfa(0.5, () => { k.elipse(24, 160, 40, 6, "#f2a8c0"); k.elipse(296, 164, 44, 6, "#f2a8c0"); });
      for (let i = 0; i < 80; i++) { const x = k.rnd() * 320, y = 40 + k.rnd() * 138; k.R(x, y, 2, 1, i % 2 ? "#fcd0dc" : "#f2a8c0"); }
    }, { tinte: 0.8, ven: VEN }],
    13: ["La isla Gyijon", "El palacio de coral en el fondo del mar, bajo su gran burbuja", (k) => {
      k.banda(["#0b3a68", "#10527f", "#176f9c", "#2a93b8", "#58bccb"], 0, 128);
      [[60, 22], [128, 30], [206, 24], [268, 18]].forEach(([x, w]) => k.alfa(0.09, () => k.poli([[x, 0], [x + w, 0], [x + w * 2.2, 128], [x - w * 1.1, 128]], "#d8f8ff")));
      const pez = (x, y, d, col) => { k.elipse(x, y, 4, 2, col); k.poli([[x + d * 3, y], [x + d * 7, y - 3], [x + d * 7, y + 3]], col); k.P(x - d * 2, y - 1, "#14202a"); };
      for (let i = 0; i < 12; i++) pez(36 + i * 3 + (i % 3) * 9, 26 + (i % 4) * 7, 1, ["#f2a23a", "#f2c84b"][i % 2]); for (let i = 0; i < 10; i++) pez(238 + i * 4 + (i % 3) * 7, 20 + (i % 3) * 8, -1, ["#e8607a", "#f4f1e8"][i % 2]);
      [[20, 118, 44, 34], [86, 122, 34, 22], [236, 122, 36, 24], [300, 118, 44, 36]].forEach(([x, y, a, b]) => bola(k, x, y, a, b, (px, py) => rampa(["#3fa0b8", "#2a8aa4", "#1f7a94", "#176a84"], ((py - y + b) / (2 * b)) * 0.8 + (Math.sin(px / 4 + py / 3) > 0.7 ? 0.2 : 0), px, py)));
      k.suelo(124, "#ead9b4", "#d8c49c", "#f6ecd0");
      const S = ["#fbdcd2", "#f6cfc4", "#dca69e", "#b8847c"], N = ["#fff4ea", "#fbeee0", "#e0cdbc", "#c4ae9c"], TS = ["#f08aa0", "#e8607a", "#bf3f5c"], TN = ["#f8bc5a", "#f2a23a", "#c97f22"];
      sillares(k, 88, 96, 144, 30, { base: "#f6cfc4", luz: "#fbdcd2", osc: "#dca69e" }, 6, 12); k.R(88, 94, 144, 3, "#fff4ea");
      torreta(k, 100, 112, 22, 54, 20, { piedra: N, techo: TN, paso: 12 }); torreta(k, 198, 112, 22, 54, 20, { piedra: N, techo: TN, paso: 12 });
      torreta(k, 128, 112, 20, 74, 24, { piedra: S, techo: TS, paso: 12 }); torreta(k, 172, 112, 20, 74, 24, { piedra: S, techo: TS, paso: 12 }); torreta(k, 148, 112, 24, 96, 30, { piedra: S, techo: TS, paso: 12 });
      for (let x = 100; x < 222; x += 13) { k.elipse(x + 4, 110, 4, 5, "#2f7f9c"); k.R(x, 110, 8, 6, "#2f7f9c"); k.elipse(x + 4, 104, 2, 2, "#fff4ea"); }
      k.elipse(160, 96, 8, 8, "#7ad8f0"); k.elipse(160, 96, 5, 5, "#f4f1e8"); for (let a = 0; a < 8; a++) k.linea(160, 96, 160 + Math.cos(a * 0.785) * 8, 96 + Math.sin(a * 0.785) * 8, "#dca69e");
      [[24, 122, 22, 15, "#f2b8d0"], [60, 126, 17, 12, "#f8d0a8"], [262, 124, 22, 15, "#f2b8d0"], [298, 126, 16, 12, "#c8e0a0"]].forEach(([x, y, a, b, c]) => { esfera(k, x, y, a, b, ["#fff4ec", c, "#c88aa8"]); for (let i = -2; i <= 2; i++) k.linea(x + i * 3, y - b + 2, x + i * a * 0.4, y + b - 3, "#c88aa8"); k.elipse(x, y + b - 6, 3, 3, "#7a4a5a"); k.R(x - 3, y + b - 6, 7, 6, "#7a4a5a"); k.R(x + a * 0.4, y - 2, 4, 4, "#ffd27a"); sombra(k, x, y + b + 1, a, 2); });
      const coral = (x, y, h, col, osc) => { k.linea(x, y, x, y - h, col, 2); [[-5, 0.45], [5, 0.6], [-3, 0.8], [4, 0.95]].forEach(([d, f]) => { k.linea(x, y - h * (f - 0.3), x + d, y - h * f, col, 2); k.P(x + d, y - h * f - 1, osc); }); };
      [[12, 160, 28, "#e8503a", "#ff9a7a"], [84, 142, 18, "#f2a23a", "#ffe08a"], [236, 146, 20, "#e8607a", "#ffb8c8"], [306, 164, 32, "#e8503a", "#ff9a7a"], [32, 172, 20, "#f2a23a", "#ffe08a"], [284, 174, 18, "#e8607a", "#ffb8c8"]].forEach(([x, y, h, c, o]) => coral(x, y, h, c, o));
      for (let i = 0; i < 26; i++) { const x = i % 2 ? 4 + k.rnd() * 52 : 266 + k.rnd() * 52, y = 168 + k.rnd() * 11; k.linea(x, y, x + 2, y - 8 - k.rnd() * 10, i % 3 ? "#3f9a7a" : "#2f7a64"); }
      camino(k, 126, 180, (f) => 160, (f) => 12 + f * 26, "#ddc9a2", "#f6ecd0", "#e4d2ac");
      [[148, 150], [172, 158], [152, 170]].forEach(([x, y]) => esfera(k, x, y, 4, 2, ["#fff4ea", "#f2b8d0", "#c88aa8"]));
      for (let i = 0; i < 28; i++) { const x = k.rnd() * 320, y = 6 + k.rnd() * 112, r = 1 + k.rnd() * 3; k.alfa(0.4, () => k.elipse(x, y, r, r, "#d8f8ff")); k.P(x - r * 0.4, y - r * 0.4, "#ffffff"); }
      for (let a = 0.12; a < 3.03; a += 0.008) { const x = 160 + Math.cos(a) * 176, y = 134 - Math.sin(a) * 126; k.alfa(0.55, () => k.R(x, y, 2, 1, "#c8f4ff")); }
    }, { cielo: "propio", fuerza: 0.35, ven: VEN }],
    14: ["Drossresa", "La ciudad del amor, con su coliseo, sus tejados naranjas y sus girasoles", (k) => {
      k.banda(CIELO, 0, 106);
      nubarron(k, 96, 40, 60, 10); nubarron(k, -16, 66, 60, 12); cirros(k, 5, 6, 26);
      rellena(k, [[-10, 112], [-10, 62], [14, 44], [104, 44], [126, 66], [150, 112]], estratos(["#d6c29c", "#c0aa84", "#a8926c", "#907a58"])); k.R(14, 43, 90, 2, "#ece0c0");
      const Pz = ["#fff4dc", "#f6e6c8", "#d8c49c", "#b8a47e"], Cu = ["#f89ab0", "#e8607a", "#c03f5c"];
      cilindro(k, 26, 22, 70, 22, Pz); for (let x = 32; x < 90; x += 10) ventanaArco(k, x, 26, 5, 10, "#a88a60", "#7a5a8a"); k.R(24, 21, 74, 2, "#d8c49c");
      [[32, 20, 7], [90, 20, 7], [61, 14, 11]].forEach(([x, y, r]) => { cilindro(k, x - r + 1, y + 2, 2 * r - 2, 10, Pz); esfera(k, x, y, r, r - 1, Cu); k.R(x, y - r - 5, 1, 5, "#c9a03c"); bandera(k, x + 1, y - r - 5, 7, 3, "#f2c84b"); });
      const CO = ["#ecd8ae", "#dcc090", "#bfa276", "#9c8258"]; cilindro(k, 176, 62, 132, 50, CO, 0.25);
      k.elipse(242, 62, 66, 11, "#f0dcb0"); k.elipse(242, 62, 58, 8, "#8a5f3a"); k.elipse(242, 64, 46, 5, "#d8b070"); for (let a = 0; a < 6.28; a += 0.16) k.P(242 + Math.cos(a) * 62, 62 + Math.sin(a) * 9.5, "#bfa276");
      for (let f = 0; f < 2; f++) { for (let x = 182 + f * 6; x < 302; x += 13) { k.elipse(x + 4, 80 + f * 17, 4, 4, "#5a3e2e"); k.R(x, 80 + f * 17, 8, 10, "#5a3e2e"); k.R(x, 90 + f * 17, 9, 1, "#f0dcb0"); } k.R(176, 76 + f * 17, 132, 1, "#9c8258"); }
      [[200, "#e8607a"], [242, "#f2c84b"], [284, "#e8607a"]].forEach(([x, c]) => { k.R(x, 36, 1, 18, "#6a4a3a"); bandera(k, x + 1, 36, 12, 6, c); });
      const co = [["#f8eeda", "#e8743a", "#ff9a5a", "#bf5526"], ["#fbe2c8", "#d8622a", "#f08a4a", "#a84a1c"], ["#fff0e0", "#e8743a", "#ff9a5a", "#bf5526"]];
      k.suelo(116, "#d9c7a3", "#c8b490", "#e8d8b8");
      [[-2, 36, 26], [36, 30, 20], [68, 38, 28], [108, 32, 22], [176, 34, 22], [212, 38, 28], [252, 32, 20], [286, 40, 28]].forEach(([x, w, h], i) => { const c = co[i % 3]; casaTorcida(k, x, 124 + (i % 3), w, h, { pared: c[0], techo: c[1], techoLuz: c[2], techoOsc: c[3], redonda: i % 2 === 0, puerta: true, sombra: "#a89a7e" }); k.R(x + 3, 124 + (i % 3) - h + 13, 9, 2, i % 2 ? "#e8607a" : "#f2c84b"); });
      catenaria(k, 10, 96, 150, 100, 7, "#6a4a3a", (x, y, i) => { if (i % 7 === 0) k.poli([[x - 2, y], [x + 2, y], [x, y + 4]], ["#e8607a", "#f2c84b", "#3fa6d8"][(i / 7) % 3]); });
      adoquines(k, 127, 180, "#d4c098", "#b8a47c", "#e4d2ac");
      k.alfa(0.28, () => k.R(0, 127, 320, 3, "#6a5a3a"));
      const girasol = (x, y, h) => { k.R(x, y - h, 2, h, "#3f8a3a"); k.poli([[x, y - h * 0.5], [x - 7, y - h * 0.62], [x - 2, y - h * 0.42]], "#4fa048"); k.poli([[x + 2, y - h * 0.7], [x + 9, y - h * 0.8], [x + 3, y - h * 0.58]], "#4fa048"); for (let a = 0; a < 6.28; a += 0.62) k.R(x + Math.cos(a) * 6 - 1, y - h + Math.sin(a) * 6 - 1, 3, 3, a % 1.24 < 0.62 ? "#f2c84b" : "#e8a82a"); k.elipse(x + 1, y - h + 1, 4, 4, "#7a4a22"); k.P(x, y - h, "#a8742e"); };
      [[6, 180, 30], [22, 182, 22], [38, 181, 28], [54, 183, 18], [262, 183, 20], [278, 182, 26], [294, 180, 32], [310, 182, 24]].forEach(([x, y, h]) => girasol(x, y, h));
      k.R(86, 140, 2, 12, "#c0392b"); esfera(k, 87, 136, 5, 5, ["#f8e0b8", "#e8c088", "#c89a60"]); k.R(84, 134, 2, 2, "#26262a"); k.R(89, 134, 2, 2, "#26262a"); k.R(82, 142, 11, 2, "#3f6f9a"); k.R(82, 152, 3, 2, "#3f6f9a"); k.R(90, 152, 3, 2, "#3f6f9a");
    }, { ven: ["#f2d27a", "#ffd27a"], tinte: 0.1, dx: 22 }],
    15: ["Albef", "La tierra de los gigantes, con su árbol inmenso y sus casas vikingas", (k) => {
      k.banda(CIELO, 0, 112);
      if (k.luz && k.luz.lit > 0.5) for (let i = 0; i < 3; i++) for (let x = 0; x < 320; x += 2) { const y = 16 + i * 10 + Math.sin(x / 26 + i * 2) * 10, h = 12 + Math.sin(x / 13 + i) * 7; for (let d = 0; d < h; d++) if (Det.trama(x, y + d) < (1 - d / h) * 0.42) k.crudo(x, y + d, 2, 1, i === 1 ? "#6ae8b0" : "#4ac8c8"); }
      nubarron(k, -20, 54, 86, 16); nubarron(k, 258, 44, 90, 18);
      montana(k, 60, 116, 170, 66, { roca: ["#8fa3b8", "#7f93aa", "#667c94", "#55687e"], nieve: ["#ffffff", "#dde6ee"], hasta: 0.4 }); montana(k, 268, 116, 190, 76, { roca: ["#8fa3b8", "#7f93aa", "#667c94", "#55687e"], nieve: ["#ffffff", "#dde6ee"], hasta: 0.4 });
      k.agua(106, 124, ["#3f7fa8", "#2f6c94"], "#bfe0ea", 40); reflejo(k, 108, 124);
      const CO = ["#9a7048", "#83603e", "#6a4a2f", "#523822", "#3f2a18"];
      rellena(k, [[96, 136], [122, 112], [130, 60], [134, 0], [188, 0], [192, 60], [200, 112], [232, 138], [190, 128], [176, 136], [160, 126], [144, 136], [128, 128]], (x, y) => rampa(CO, Math.abs((x - 160) / 50 + 0.35) * 0.74 + (Math.sin(x / 2.8 + Math.sin(y / 15) * 2) > 0.5 ? 0.2 : 0), x, y));
      const hoja = { tronco: "#6a4a2f", copa: "#3f7f4a", borde: "#2a5f38", luz: "#5fa860", osc: "#336a3e" };
      [[84, 22, 30], [122, 8, 34], [160, 2, 38], [200, 8, 34], [238, 24, 30], [106, 34, 20], [214, 36, 20], [160, 28, 22]].forEach(([x, y, r]) => k.cumulo(x, y, r, hoja));
      k.suelo(122, "#7fa860", "#6a9450", "#98c078"); k.hierbas(126, 178, 90, ["#6a9450", "#a8c888"]);
      const salon = (x, base, w, h) => {
        tablas(k, x, base - h, w, h, "#7a5230", "#5a3a20", "#94683e", 6, true);
        k.poli([[x - 9, base - h + 2], [x + w + 9, base - h + 2], [x + w / 2 + 18, base - h - 26], [x + w / 2 - 18, base - h - 26]], "#a87a3e"); k.poli([[x + w / 2 + 18, base - h - 26], [x + w + 9, base - h + 2], [x + w / 2, base - h + 2]], "#8a5f2c");
        for (let y = base - h - 22; y < base - h; y += 5) k.R(x + w / 2 - 16 - (y - base + h + 26) * 0.66, y, 34 + (y - base + h + 26) * 1.3, 1, "#7a5228");
        k.elipse(x + w / 2, base - 13, 7, 7, "#3a2414"); k.R(x + w / 2 - 7, base - 13, 14, 13, "#3a2414"); k.R(x + 6, base - h + 6, 8, 7, "#ffd27a"); k.R(x + w - 14, base - h + 6, 8, 7, "#ffd27a"); brillo(k, x + w / 2, base - 9, 14, 12, "#ffcf6a", 0.5);
        [[x - 9, -1], [x + w + 9, 1]].forEach(([px, d]) => { k.linea(px, base - h + 2, px + d * 6, base - h - 12, "#5a3a20", 2); k.elipse(px + d * 8, base - h - 14, 3, 2, "#5a3a20"); k.P(px + d * 9, base - h - 15, "#ffcf6a"); });
        [[x + 10, "#c0392b"], [x + w - 10, "#2f6fa8"]].forEach(([sx, c]) => { k.elipse(sx, base - 9, 6, 6, "#c8b490"); k.elipse(sx, base - 9, 5, 5, c); k.elipse(sx, base - 9, 2, 2, "#d8d0b8"); });
        sombra(k, x + w / 2, base + 1, w * 0.6, 2);
      };
      salon(16, 134, 66, 28); salon(236, 136, 68, 30);
      [[108, 142], [214, 146]].forEach(([x, y]) => { rellena(k, [[x, y], [x + 1, y - 20], [x + 5, y - 25], [x + 9, y - 20], [x + 10, y]], (px, py) => rampa(["#a8a8b4", "#8d8d98", "#6d6d78"], (px - x) / 11, px, py)); [y - 16, y - 11, y - 6].forEach((v) => { k.R(x + 3, v, 4, 1, "#5fb0c8"); k.P(x + 4, v + 1, "#5fb0c8"); }); sombra(k, x + 5, y, 8, 2); });
      k.linea(46, 178, 66, 150, "#6a4a2f", 3); k.poli([[60, 150], [74, 138], [82, 154], [68, 160]], "#a8a8b4"); k.poli([[60, 150], [66, 146], [70, 158], [68, 160]], "#d0d0d8");
      camino(k, 128, 180, (f) => 160 + Math.sin(f * 2.6) * 8, (f) => 10 + f * 20, "#8e8468", "#a89a78", "#7e745a");
      [[92, 166], [232, 168]].forEach(([x, y]) => { [[-5, 5], [5, -5], [-4, -3]].forEach(([a, b]) => k.linea(x + a, y, x + b, y - 4, "#3a2414", 2)); k.llama(x, y - 2, 0.7); brillo(k, x, y - 6, 24, 20, "#ffb04a", 0.6); });
    }, { ven: ["#f2d27a", "#ffd27a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a"] }],
    17: ["Lemon Town", "El pueblo medio en ruinas, con la gran carpa y la bandera de Vuggy", (k) => {
      k.banda(CIELO, 0, 112);
      nubarron(k, -24, 66, 100, 22); nubarron(k, 240, 60, 104, 26); cirros(k, 5, 6, 30);
      const c = { pared: "#e8b870", luz: "#f6d090", osc: "#c89a58", techo: "#c0602a", techoLuz: "#dc7c42", techoOsc: "#984820", sombra: "#a8926a" };
      casaTorcida(k, -8, 128, 48, 34, { ...c, chimenea: true, redonda: false }); casaTorcida(k, 282, 128, 46, 36, { ...c, pared: "#f0c880", chimenea: true });
      const ruina = (x, b, w, h, d) => {
        rellena(k, [[x, b], [x, b - h], [x + w * 0.16, b - h - 2], [x + w * 0.28, b - h + 3], [x + w * 0.42, b - h + 1], [x + w * 0.52, b - h + 8], [x + w * 0.66, b - h + 6], [x + w * 0.76, b - h + 14], [x + w * 0.9, b - h + 12], [x + w, b - h + 18], [x + w, b]], (px, py) => (Math.sin(px / 2 + py / 3) > 0.9 ? "#c89a58" : (py % 6 === 0 && (px + py) % 7 < 2) ? "#d0a464" : px > x + w - 4 ? "#c89a58" : "#e8b870"));
        k.R(x + w * 0.14, b - h + 8, 9, 10, "#3a2a22"); k.R(x + w * 0.14, b - h + 8, 9, 1, "#7a5230"); k.R(x + w * 0.14 + 4, b - h + 8, 1, 10, "#7a5230");
        k.elipse(x + w * 0.62, b - 12, 9, 10, "#3a2a22"); k.R(x + w * 0.62 - 9, b - 12, 18, 12, "#3a2a22");
        [[0.46, 0.62], [0.62, 0.5], [0.8, 0.46]].forEach(([a, f]) => k.linea(x + w * a, b - h + 10, x + w * (a + 0.2 * d), b - h * f - 8, "#6b4a30", 2));
        [[0.1, 9, 6], [0.46, 14, 9], [0.84, 10, 6]].forEach(([a, w2, h2]) => Det.pena(k, x + w * a - w2 / 2, b + 2, w2 * 1.6, h2, ["#e0c8a0", "#c8ac84", "#94785c"]));
        [[0.3, 2, 0.4], [0.7, 3, -0.3]].forEach(([a, dy, t]) => k.linea(x + w * a - 4, b + dy, x + w * a + 6, b + dy - 4 * t, "#8a5a32", 2));
      };
      ruina(44, 128, 48, 30, 1); ruina(232, 128, 46, 28, -1);
      const RO = ["#e8504a", "#c0392b", "#8a2820"], BL = ["#fbf6e8", "#f4efe0", "#d6cab0"];
      for (let i = 0; i < 10; i++) { const a = 94 + i * 13.2, b = a + 13.2, cols = i % 2 ? BL : RO; rellena(k, [[160, 30], [a + 1, 112], [b + 1, 112]], (x, y) => rampa(cols, ((x - 94) / 132) * 0.5 + (y - 30) / 170, x, y)); }
      for (let x = 92; x < 226; x++) { const y = 112 + Math.sin((x - 92) * 0.235) * 3; k.R(x, y, 1, 5, Math.floor((x - 92) / 13) % 2 ? "#f4efe0" : "#c0392b"); }
      k.R(94, 116, 132, 12, "#7a2a20"); k.R(94, 116, 132, 1, "#a84038"); k.R(146, 110, 28, 18, "#2a1a18"); k.elipse(160, 110, 14, 7, "#2a1a18");
      k.R(159, 8, 2, 24, "#3a2a20"); bandera(k, 161, 8, 30, 15, "#26262a"); k.elipse(174, 15, 4, 4, "#f4efe0"); k.elipse(174, 15, 2, 2, "#c0392b"); k.linea(166, 11, 182, 19, "#f4efe0"); k.linea(182, 11, 166, 19, "#f4efe0");
      catenaria(k, 160, 30, 40, 96, 12, "#6a4a3a", (x, y, i) => { if (i % 13 === 0) k.poli([[x - 3, y], [x + 3, y], [x, y + 5]], i % 26 ? "#c0392b" : "#f2c84b"); });
      catenaria(k, 160, 30, 282, 92, 12, "#6a4a3a", (x, y, i) => { if (i % 13 === 0) k.poli([[x - 3, y], [x + 3, y], [x, y + 5]], i % 26 ? "#c0392b" : "#f2c84b"); });
      humo(k, 66, 94, "#8a8a90", 0.4, 6); humo(k, 256, 96, "#8a8a90", 0.35, 6, -1);
      k.suelo(126, "#d8c08a", "#c8ae78", "#e8d09c"); k.alfa(0.3, () => k.R(0, 127, 320, 2, "#8a7450"));
      k.R(16, 144, 38, 11, "#3a3a44"); k.R(16, 144, 38, 2, "#6a6a78"); k.R(52, 141, 6, 17, "#26262a"); [[26, 158], [46, 158]].forEach(([x, y]) => { k.elipse(x, y, 8, 8, "#6b4a30"); k.elipse(x, y, 5, 5, "#8a6440"); k.elipse(x, y, 2, 2, "#3a2a20"); }); sombra(k, 36, 166, 26, 2);
      esfera(k, 72, 154, 6, 6, ["#6a6a78", "#3a3a44", "#26262a"]); k.R(70, 147, 3, 3, "#c0392b");
      k.R(206, 118, 26, 8, "#f4efe0"); k.R(206, 118, 26, 1, "#c0392b"); rotulo(k, 208, 120, "PETS", "#c0392b");
      esfera(k, 214, 138, 7, 5, LANA); esfera(k, 208, 133, 5, 5, LANA); k.R(205, 131, 2, 2, "#26262a"); k.R(203, 134, 2, 2, "#7a4a30"); k.poli([[208, 126], [212, 124], [212, 132]], "#d8d0ba"); k.R(208, 142, 2, 3, "#d8d0ba"); k.R(218, 142, 2, 3, "#d8d0ba"); sombra(k, 213, 145, 10, 2);
      [[266, 150, 34, 15], [96, 160, 26, 11], [296, 170, 30, 13]].forEach(([x, b, w, h]) => Det.pena(k, x, b, w, h, ["#d0b896", "#b8a07e", "#8a7458"]));
      for (let i = 0; i < 20; i++) k.R(k.rnd() * 320, 130 + k.rnd() * 46, 3, 1, "#a8926a");
    }, { ven: ["#f2d27a", "#ffd27a"] }],
    18: ["Honey Village", "El pueblo de Usupp, con la mansión de Gaya en lo alto de la colina", (k) => {
      k.banda(CIELO, 0, 102);
      nubarron(k, -20, 50, 90, 18); nubarron(k, 240, 44, 96, 20); cirros(k, 5, 6, 26);
      k.agua(92, 118, MAR, "#bfe6f6", 40); reflejo(k, 94, 118);
      loma(k, [[34, 130], [116, 74], [160, 60], [214, 70], [292, 130]], 130, VERDE, 0.26);
      loma(k, [[-10, 108], [40, 96], [100, 118]], 126, ["#98cc70", "#7fb85a", "#669f48"], 0.2); loma(k, [[230, 118], [284, 92], [340, 104]], 126, ["#98cc70", "#7fb85a", "#669f48"], 0.2);
      const Z = [[160, 66], [186, 78], [132, 92], [196, 106], [156, 128]]; for (let i = 0; i + 1 < Z.length; i++) { k.linea(Z[i][0], Z[i][1], Z[i + 1][0], Z[i + 1][1], "#d8c08a", 3 + i); }
      const PA = ["#fff8ea", "#f2ead8", "#d4c8ae", "#b0a488"];
      cilindro(k, 118, 40, 88, 28, PA, 0.2);
      for (let x = 124; x < 200; x += 12) ventanaArco(k, x, 45, 6, 12, "#8a7a60", "#55697c");
      k.poli([[110, 41], [214, 41], [198, 26], [126, 26]], "#3f6f9a"); k.poli([[164, 41], [214, 41], [198, 26], [164, 26]], "#2f5880"); k.R(110, 40, 104, 2, "#2f5880");
      k.poli([[146, 41], [178, 41], [162, 30]], "#f2ead8"); [[148], [156], [168], [176]].forEach(([x]) => cilindro(k, x, 41, 3, 27, PA)); k.R(155, 54, 14, 14, "#6b4a30"); k.elipse(162, 54, 7, 6, "#6b4a30");
      [[124], [190]].forEach(([x]) => { k.R(x, 22, 6, 6, "#c8bea8"); k.R(x - 1, 21, 8, 1, "#a89e88"); });
      for (let x = 112; x < 212; x += 4) k.R(x, 68, 1, 6, "#3a3a44"); k.R(112, 68, 100, 1, "#3a3a44");
      [[96, 96, 1.1], [228, 98, 1.2], [122, 74, 0.7], [202, 76, 0.7]].forEach(([x, b, t]) => k.arbolote(x, b, t));
      const c = [{ pared: "#f2e6c8", techo: "#b5543a", techoLuz: "#d0704e", techoOsc: "#8a3f2a" }, { pared: "#f6ecd4", techo: "#7f6a4a", techoLuz: "#9c8660", techoOsc: "#5f4e36" }, { pared: "#ecdcb8", techo: "#c0602a", techoLuz: "#dc7c42", techoOsc: "#984820" }];
      k.suelo(126, "#8cc860", "#74b04e", "#a8dc78"); k.hierbas(130, 178, 100);
      casaTorcida(k, 0, 130, 40, 26, { ...c[0], chimenea: true }); casaTorcida(k, 46, 128, 34, 22, { ...c[1], redonda: false }); casaTorcida(k, 88, 127, 26, 17, { ...c[2], ventana: false });
      casaTorcida(k, 216, 127, 28, 18, { ...c[1] }); casaTorcida(k, 240, 129, 36, 24, { ...c[2], redonda: false, chimenea: true }); casaTorcida(k, 280, 130, 42, 26, { ...c[0] });
      camino(k, 126, 180, (f) => 158 + Math.sin(f * 3.2) * f * 16, (f) => 6 + f * 22, "#c4ad7c", "#dcc794", "#b89f6c");
      [[24, 150], [44, 148], [64, 146], [84, 145]].forEach(([x, y], i, t) => { k.R(x, y - 9, 3, 10, "#a87444"); k.P(x + 1, y - 10, "#d8ae80"); if (i) { k.linea(t[i - 1][0], t[i - 1][1] - 6, x, y - 6, "#c0895a"); k.linea(t[i - 1][0], t[i - 1][1] - 3, x, y - 3, "#c0895a"); } });
      [[46, 164], [264, 158], [292, 170]].forEach(([x, y]) => { esfera(k, x, y, 7, 5, LANA); esfera(k, x - 7, y - 2, 3, 3, ["#5a4a44", "#3a2a24", "#2a1a14"]); k.R(x - 4, y + 4, 2, 3, "#3a2a24"); k.R(x + 3, y + 4, 2, 3, "#3a2a24"); sombra(k, x, y + 7, 8, 2); });
      flores(k, 136, 178, 50, ["#ffffff", "#f2d24a", "#e8a0c0"]); matas(k, 150, 178, 18);
    }, { ven: ["#f2d27a", "#55697c", "#ffd27a"] }],
    19: ["Logueville", "La ciudad del principio y del fin, con el cadalso de Gol D. Roger", (k) => {
      k.banda(["#4a5a7a", "#7084a0", "#a8b4c4"], 0, 116);
      const TO = ["#a8b0bc", "#7f8898", "#596274", "#434a5a"];
      nubarron(k, -24, 30, 130, 26, TO); nubarron(k, 180, 24, 160, 28, TO); nubarron(k, 76, 12, 120, 16, TO);
      const e = [{ pared: "#c8b8a0", luz: "#dccebc", osc: "#a89880", techo: "#6a4a3a", techoOsc: "#4a3428" }, { pared: "#b8a890", luz: "#ccbeaa", osc: "#988872", techo: "#7a4a3a", techoOsc: "#5a3428" }, { pared: "#d0c0a8", luz: "#e0d4c0", osc: "#ae9e86", techo: "#5a4a4a", techoOsc: "#3a3030" }];
      [[-8, 128, 44, 88, 0], [32, 128, 34, 66, 1], [64, 128, 36, 76, 2], [222, 128, 36, 74, 1], [256, 128, 34, 64, 2], [286, 128, 42, 90, 0]].forEach(([x, b, w, h, i]) => edificio(k, x, b, w, h, { ...e[i], ven: "#ffd27a", marco: "#5a4a3a" }));
      [[6, 30], [298, 28]].forEach(([x, y]) => { k.R(x, y, 7, 12, "#6a5a4a"); k.R(x - 1, y - 2, 9, 2, "#4a3a2a"); });
      const M = ["#8a6440", "#6b4a30", "#4a3220", "#3a2618"];
      tablas(k, 104, 92, 112, 36, "#5a3a22", "#3a2618", "#7a5230", 6, true); for (let x = 104; x < 216; x += 18) k.linea(x, 94, x + 18, 126, "#4a3220", 2); k.R(100, 90, 120, 4, "#7a5230"); k.R(100, 90, 120, 1, "#a87444"); k.R(100, 94, 120, 1, "#3a2618");
      cilindro(k, 122, 20, 7, 72, M); cilindro(k, 192, 20, 7, 72, M); k.R(114, 16, 92, 6, "#6b4a30"); k.R(114, 16, 92, 1, "#a87444"); k.linea(122, 40, 136, 22, "#4a3220", 3); k.linea(198, 40, 184, 22, "#4a3220", 3);
      k.R(146, 22, 28, 4, "#4a3220"); k.R(159, 22, 2, 40, "#6b5a3a");
      for (let i = 0; i < 6; i++) { k.R(142 - i * 2, 100 + i * 5, 36 + i * 4, 5, i % 2 ? "#7a5230" : "#8a6440"); k.R(142 - i * 2, 104 + i * 5, 36 + i * 4, 1, "#3a2618"); }
      adoquines(k, 128, 180, "#a8a090", "#888070", "#b8b0a0");
      k.alfa(0.3, () => k.R(0, 128, 320, 3, "#3a3a44"));
      [[92, 138], [228, 138]].forEach(([x, b]) => { k.R(x, b - 30, 2, 30, "#2a2a34"); k.R(x - 3, b - 36, 8, 7, "#ffd27a"); k.R(x - 4, b - 37, 10, 1, "#2a2a34"); k.R(x - 2, b - 38, 6, 1, "#2a2a34"); brillo(k, x + 1, b - 32, 18, 16, "#ffcf6a", 0.55); });
      caja(k, 34, 142, 14, 10); barril(k, 50, 144, 10, 12); barril(k, 268, 146, 10, 12); caja(k, 280, 148, 14, 10);
    }, { tinte: 0.5, ven: VEN }],
    20: ["Inverse Mountain", "La montaña por la que sube el mar, con la gran ballena Loboan", (k) => {
      k.banda(["#3f6a9a", "#6a9ac0", "#b0d0dc"], 0, 96);
      const NU = ["#ffffff", "#dfe8f0", "#b0c0d0"];
      nubarron(k, -20, 16, 90, 16, NU); nubarron(k, 250, 12, 90, 16, NU);
      const RO = ["#c8806a", "#a8604e", "#8a4a3c", "#6e382e", "#552a24"];
      rellena(k, [[-10, 100], [40, 44], [84, 8], [120, -2], [200, -2], [236, 8], [280, 44], [330, 100]], (x, y) => rampa(RO, Math.abs((x - 160) / 170 + 0.3) * 0.72 + (Math.sin(x / 7 + y / 9) > 0.72 ? 0.18 : 0) + (Math.sin(y / 4 + x / 30) > 0.8 ? 0.1 : 0), x, y));
      const canal = (x0, y0, x1, y1, a0, a1) => rellena(k, [[x0 - a0, y0], [x1 - a1, y1], [x1 + a1, y1], [x0 + a0, y0]], (x, y) => { const t = (y0 - y) / (y0 - y1), c = x0 + (x1 - x0) * t, u = (x - c) / (a0 + (a1 - a0) * t); return Math.sin(y / 2.1 + u * 3) > 0.74 ? "#ffffff" : rampa(["#a8e4f4", "#6ac8e8", "#3fa6d8"], Math.abs(u) * 0.9, x, y); });
      canal(160, 100, 160, -2, 28, 10); canal(62, 100, 118, 10, 12, 3); canal(258, 100, 202, 10, 12, 3);
      [[132, 96], [188, 96]].forEach(([x]) => { for (let y = 6; y < 96; y += 11) { const d = (x < 160 ? 1 : -1) * ((96 - y) * 0.2); k.R(x + d - 2, y, 4, 3, "#7a3a2e"); } });
      [[116, 16], [192, 16]].forEach(([x, w]) => { cilindro(k, x, 60, w, 40, ["#e8604a", "#c0392b", "#8a2820"]); k.R(x - 3, 58, w + 6, 4, "#f4efe0"); });
      k.agua(96, 152, ["#2f86c6", "#2472b0", "#1c5f98"], "#bfe6f6", 120); reflejo(k, 98, 152); espuma(k, 100, 0, 320);
      for (let x = 120; x < 200; x += 3) k.linea(x, 100, x + (x - 160) * 0.2, 114, "#d8f4fa");
      const BA = ["#8a9abe", "#6e7e9e", "#5a6a8a", "#465474"];
      rellena(k, [[232, 118], [262, 92], [270, 108], [286, 94], [276, 128], [236, 132]], (x, y) => rampa(BA, (y - 92) / 44, x, y));
      bola(k, 150, 116, 92, 30, (x, y) => (y > 124 + Math.sin(x / 16) * 2 ? (x % 11 === 0 ? "#94a0ae" : "#b8c4d0") : rampa(BA, ((y - 86) / 44) * 0.8 + ((x - 58) / 184) * 0.3, x, y)));
      k.R(62, 123, 84, 1, "#26262a"); k.linea(146, 123, 170, 118, "#26262a");
      k.elipse(90, 108, 6, 6, "#f4efe0"); k.elipse(89, 108, 3, 4, "#26262a"); k.P(88, 106, "#ffffff"); k.linea(83, 100, 97, 99, "#3a4258", 2);
      [[112, 90, 124, 104], [134, 88, 142, 106], [160, 88, 166, 102], [120, 96, 136, 92], [148, 94, 158, 90]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, "#c8b8b0"); k.linea(a + 1, b, c + 1, d, "#a8988e"); });
      k.elipse(188, 104, 11, 9, "#26262a"); k.elipse(188, 103, 8, 7, "#f4efe0"); k.linea(176, 111, 200, 97, "#26262a", 2); k.linea(176, 97, 200, 111, "#26262a", 2); k.elipse(188, 96, 9, 2, "#26262a");
      k.R(70, 78, 2, 12, "#d8f4fa"); for (let i = -2; i <= 2; i++) k.linea(71, 78, 71 + i * 6, 72 + Math.abs(i) * 2, "#d8f4fa");
      k.suelo(150, "#7fb85a", "#6ca84c", "#98cc70"); espuma(k, 150, 0, 320); k.hierbas(154, 178, 60); flores(k, 154, 176, 26, ["#ffffff", "#f2d24a", "#e8607a"]);
      const FA = ["#ffffff", "#f4efe0", "#d4c8ae"]; cilindro(k, 286, 116, 14, 36, FA); k.R(286, 126, 14, 6, "#c0392b"); k.R(286, 140, 14, 6, "#c0392b"); k.R(283, 112, 20, 4, "#3a3a44"); k.R(287, 104, 12, 8, "#ffd27a"); k.poli([[283, 104], [303, 104], [293, 95]], "#c0392b"); brillo(k, 293, 108, 22, 16, "#ffe6a8", 0.7);
      k.R(226, 138, 2, 22, "#6d4628"); k.poli([[208, 142], [246, 142], [227, 130]], "#e8607a"); k.poli([[227, 130], [246, 142], [234, 142]], "#f4efe0"); k.linea(208, 160, 232, 154, "#c0895a", 2); k.linea(232, 154, 240, 146, "#c0895a", 2);
    }, { tinte: 0.15, ven: VEN }],
    21: ["Brandy Peak", "El pueblo de los cazarrecompensas, entre montañas de cactus llenas de tumbas", (k) => {
      k.banda(["#2a2a5a", "#5a3f7a", "#b0708a", "#e8a070"], 0, 118);
      const NU = ["#b07a9a", "#8a5a8a", "#5f4078"];
      nubarron(k, 40, 30, 70, 8, NU); nubarron(k, 216, 40, 70, 8, NU);
      const C = ["#7ab88e", "#4f8f6c", "#3a7a5a", "#2a5f46", "#1f4a38"];
      const cactus = (x, b, w, h, b1, b2) => {
        const arriba = (cx, yb, wc, hc) => { for (let px = cx; px < cx + wc; px++) { const t = (px - cx) / wc, r = Math.sqrt(Math.max(0, 1 - (2 * t - 1) ** 2)) * wc * 0.5; for (let y = Math.round(yb - hc - r * 0.9); y < yb; y++) k.P(px, y, rampa(C, Math.abs(t - 0.3) * 1.3 + (Math.round(px) % 5 === 0 ? 0.2 : 0), px, y)); } };
        arriba(x, b, w, h);
        if (b1) { k.R(x - w * 0.55, b - h * b1, w * 0.6, 7, C[2]); arriba(x - w * 0.62, b - h * b1 + 7, w * 0.42, h * 0.28); }
        if (b2) { k.R(x + w * 0.9, b - h * b2, w * 0.6, 7, C[3]); arriba(x + w * 1.2, b - h * b2 + 7, w * 0.42, h * 0.22); }
        for (let i = 0; i < w * h * 0.03; i++) { const a = k.rnd(), cx = x + a * w, cy = b - k.rnd() * h * 0.96 - (Math.sin(a * 3.14) * w * 0.4); k.R(cx, cy, 1, 4, "#d8e8d8"); k.R(cx - 1, cy + 1, 3, 1, "#d8e8d8"); }
      };
      cactus(10, 126, 28, 92, 0.6, 0.45); cactus(84, 126, 24, 64, 0.55, 0); cactus(226, 126, 26, 70, 0, 0.5); cactus(286, 126, 30, 96, 0.5, 0.62); cactus(144, 126, 34, 86, 0.5, 0.42);
      const del = (x, b, w, h, col) => { tablas(k, x, b - h, w, h, col, "#6a4a30", "#d8b888", 4); k.R(x - 1, b - h - 3, w + 2, 3, "#6a4a3a"); k.R(x - 2, b - h - 4, w + 4, 1, "#8a6a4a"); k.R(x, b - h + 9, w, 2, "#5a3a22"); for (let px = x; px < x + w; px += 4) k.R(px, b - h + 5, 1, 4, "#5a3a22"); k.R(x, b - h + 5, w, 1, "#5a3a22"); for (let vx = x + 3; vx < x + w - 6; vx += 11) { k.R(vx, b - h + 13, 6, 8, "#5a3a22"); k.R(vx + 1, b - h + 14, 4, 6, "#ffd27a"); } k.R(x + w / 2 - 3, b - 9, 7, 9, "#3a2a22"); sombra(k, x + w / 2, b + 1, w * 0.6, 2); };
      del(-2, 128, 40, 30, "#c8a878"); del(40, 130, 36, 26, "#b89868"); del(78, 128, 30, 30, "#d0b080"); del(212, 128, 32, 28, "#c8a878"); del(246, 130, 36, 28, "#b89868"); del(284, 128, 38, 32, "#d0b080");
      k.suelo(126, "#b8966a", "#a8865a", "#c8a67a"); k.alfa(0.3, () => k.R(0, 128, 320, 3, "#5a4a3a"));
      [[118], [198]].forEach(([x]) => { k.R(x, 68, 4, 60, "#6a4a30"); k.R(x, 68, 1, 60, "#a87444"); }); k.R(112, 66, 96, 14, "#7a5230"); k.R(112, 66, 96, 1, "#c0895a"); k.R(112, 79, 96, 1, "#3a2a20"); rotulo(k, 132, 70, "WELCOME", "#ffd27a"); rotulo(k, 136, 71, "", "#ffd27a");
      const G = ["#ffd27a", "#e8402a", "#7ae8c0"];
      catenaria(k, 0, 88, 118, 84, 10, "#3a2a20", (x, y, i) => { if (i % 11 === 3) { k.R(x - 1, y + 1, 3, 5, G[(i >> 2) % 3]); } }); catenaria(k, 202, 84, 320, 88, 10, "#3a2a20", (x, y, i) => { if (i % 11 === 3) { k.R(x - 1, y + 1, 3, 5, G[(i >> 2) % 3]); } });
      caja(k, 96, 146, 14, 10); barril(k, 212, 146, 11, 13); barril(k, 224, 149, 11, 13); barril(k, 218, 136, 11, 12);
      [[-5, 5], [5, -5], [-4, -3]].forEach(([a, b]) => k.linea(158 + a, 168, 158 + b, 164, "#3a2414", 2)); k.llama(158, 166, 0.9); brillo(k, 158, 160, 30, 26, "#ffb04a", 0.7);
    }, { ven: ["#ffd27a"], tinte: 0.3, fuego: ["#e8402a", "#7ae8c0", "#e8502a", "#ff9a3a", "#ffe06a"] }],
    22: ["Tiny Garden", "La selva prehistórica: helechos gigantes, las costillas de un monstruo y el volcán que marca el duelo de los dos gigantes", (k) => {
      const { h } = Det.cuando(k), erupcion = h === 8 || h === 10, VO = ["#a08c78", "#847264", "#6a5a4a", "#544638"];
      k.banda(["#7fc0a8", "#a8d8b0", "#dcecc0"], 0, 126);
      nubarron(k, -10, 30, 80, 12); nubarron(k, 236, 22, 90, 13);
      rellena(k, [[36, 132], [118, 46], [138, 33], [182, 33], [202, 46], [284, 132]], (x, y) => rampa(VO, Math.abs((x - 160) / 110 + 0.32) * 0.74 + (Math.sin(x / 5 + y / 8) > 0.74 ? 0.16 : 0), x, y));
      k.elipse(160, 35, 22, 5, "#3a2a22"); k.elipse(160, 34, 16, 3, "#e8602a"); k.elipse(160, 34, 9, 1, "#ffb04a");
      [[150, 42, 142, 74], [166, 44, 176, 66], [176, 58, 190, 88], [142, 74, 132, 92]].forEach(([a, b, c, d]) => { k.linea(a, b, c, d, "#e8602a", 2); k.linea(a, b, c, d, "#ffb04a"); });
      if (erupcion) { k.alfa(0.7, () => { [[160, 18, 26, 14], [150, 6, 20, 10], [176, 4, 22, 11]].forEach(([x, y, a, b]) => k.elipse(x, y, a, b, "#5a5048")); }); for (let i = 0; i < 26; i++) { const a = -1.57 + (k.rnd() - 0.5) * 1.3, l = 8 + k.rnd() * 32; k.R(160 + Math.cos(a) * l, 32 + Math.sin(a) * l, 2, 2, i % 2 ? "#ff9a3a" : "#ffe06a"); } k.llama(160, 34, 1.3); } else humo(k, 160, 26, "#8a8a84", 0.5, 7);
      const OS = { tronco: "#4a3222", copa: "#3a7a4a", borde: "#2a6038", luz: "#5a9a5a", osc: "#2f6a40" }, CL = { tronco: "#5b3a24", copa: "#3f8a4a", borde: "#2a6a35", luz: "#74c060", osc: "#2f7a3a" };
      const cuello = (x0, y0, x1, y1, e) => { const G = ["#8ab89a", "#6f9a7a", "#567e62"]; for (let t = 0; t < 1; t += 0.008) { const x = x0 + (x1 - x0) * t + Math.sin(t * 3) * 6 * e, y = y0 + (y1 - y0) * t, r = (6 - t * 2.6) * e; bola(k, x, y, r, r, (px) => rampa(G, 0.3 + ((px - x) / r) * 0.4, px, y)); } esfera(k, x1 + 4 * e, y1 - 1, 7 * e, 4 * e, G); k.P(x1 + 6 * e, y1 - 2, "#26262a"); k.R(x1 + 8 * e, y1 + 1, 3, 1, "#567e62"); };
      cuello(228, 112, 256, 48, 1); cuello(84, 112, 62, 66, -0.8);
      for (let x = -12; x < 336; x += 13) k.cumulo(x, 104 + ((x * 7 + 70) % 5) * 2, 12 + ((x + 12) % 3), OS);
      for (let x = -4; x < 330; x += 15) k.cumulo(x, 115 + ((x + 4) % 4), 10, CL);
      const cica = (x, b, a, e = 1) => { cilindro(k, x - 2, b - a, 5, a, ["#a88a60", "#8a6a44", "#6a4e30"]); for (let y = b - a + 3; y < b; y += 4) k.R(x - 2, y, 5, 1, "#54402a"); helecho(k, x, b - a + 2, 16 * e, "#4f9a4a", "#2f7a3a"); };
      cica(34, 126, 34, 1.2); cica(116, 124, 24); cica(204, 124, 26); cica(286, 126, 36, 1.2);
      k.suelo(122, "#6fa050", "#5c8c44", "#8cb868"); loma(k, [[-20, 128], [80, 122], [200, 128], [340, 122]], 146, ["#7cac58", "#6fa050", "#5c8c44"], 0.1);
      for (let x = -6; x < 330; x += 11) k.cumulo(x, 122 + ((x + 6) % 3), 6, CL);
      k.hierbas(128, 178, 110);
      const HU = ["#fbf4e0", "#efe6d0", "#cfc4aa"];
      for (let i = 0; i < 6; i++) { const x = 112 + i * 18, a = 54 - Math.abs(i - 2.5) * 7; k.elipse(x + 1, 141, 10, 3, "#54442c"); k.elipse(x, 140, 9, 3, "#7a6a44"); for (let t = 0; t < 1; t += 0.022) { const px = x + Math.sin(t * 2.7) * 13, py = 140 - t * a, g = 4.4 - t * 2.4; k.R(px, py, g, 2, t > 0.55 ? HU[0] : HU[1]); k.P(px + g, py, HU[2]); } }
      k.elipse(84, 138, 17, 10, "#7a6a44"); esfera(k, 86, 130, 17, 10, HU); k.elipse(82, 129, 4, 3, "#3a3a34"); k.elipse(94, 130, 3, 3, "#3a3a34"); for (let x = 72; x < 100; x += 4) k.R(x, 137, 2, 3, HU[0]); k.R(70, 138, 34, 2, "#6a5a3a");
      matas(k, 136, 146, 26, ["#2f7a3a", "#4f9a4a", "#74c060"]);
      k.poli([[60, 156], [64, 118], [69, 118], [71, 156]], "#c8ccd6"); k.poli([[66, 156], [66, 118], [69, 118], [71, 156]], "#9a9ea8"); k.R(56, 114, 22, 4, "#6d4628"); k.R(63, 102, 6, 12, "#5f3f24"); k.elipse(66, 100, 4, 4, "#c9a03c"); k.elipse(66, 157, 9, 2, "#54442c");
      k.linea(254, 158, 262, 110, "#6d4628", 3); k.poli([[246, 112], [262, 104], [274, 110], [276, 122], [264, 124]], "#c8ccd6"); k.poli([[262, 104], [274, 110], [276, 122], [266, 120]], "#9a9ea8"); k.elipse(254, 159, 9, 2, "#54442c");
      camino(k, 142, 180, (f) => 160 + Math.sin(f * 4) * f * 18, (f) => 6 + f * 20, "#8c8454", "#a89a68", "#7a7248");
      [[126, 158], [190, 172]].forEach(([x, y]) => { k.elipse(x, y, 12, 4, "#5c7c40"); [-8, -3, 3, 8].forEach((d) => k.elipse(x + d, y - 5, 2, 2, "#5c7c40")); });
      [[96, 164, 22], [232, 168, 26], [52, 176, 30], [268, 178, 32], [12, 178, 36], [308, 180, 38], [196, 178, 16]].forEach(([x, y, a], i) => helecho(k, x, y, a, i % 2 ? "#4f9a4a" : "#3f8a4a", "#2a6a35"));
      k.arbolote(-6, 156, 3, CL); k.arbolote(326, 158, 3.2, CL);
      matas(k, 154, 178, 14, ["#2f7a3a", "#4f9a4a", "#74c060"]);
    }, { tinte: 0.25, fuego: ["#e8602a", "#ffb04a", "#ff9a3a", "#ffe06a", "#e8502a"], dx: 90 }],
    24: ["Yaya", "Mock Town, la ciudad sin ley, y la media casa de Creckit con su fachada de castillo", (k) => {
      const { h } = Det.cuando(k);
      k.banda(CIELO, 0, 104);
      nubarron(k, -20, 44, 96, 16); nubarron(k, 240, 34, 100, 18); cirros(k, 5, 6, 26);
      const SE = { tronco: "#5b3a24", copa: "#3f8f55", borde: "#2a6a42", luz: "#74c080", osc: "#2f7a48" };
      loma(k, [[-20, 110], [34, 58], [90, 74], [132, 112]], 116, ["#6aa878", "#4f9060", "#3f7a50"], 0.24);
      for (let i = 0; i < 16; i++) k.cumulo(4 + i * 8, 62 + Math.abs(i - 5) * 3.2 + (i % 3) * 2, 6 + (i % 2) * 2, SE);
      k.agua(96, 124, MAR, "#bfe6f6", 50); reflejo(k, 98, 124);
      if (h === 9) { for (let y = 0; y < 104; y++) { const a = 9 + Math.sin(y / 6) * 2 + (104 - y) * 0.03; for (let x = Math.round(278 - a); x <= 278 + a; x++) k.P(x, y, Math.sin(x * 1.2 + y / 7) > 0.5 ? "#ffffff" : rampa(["#e8fbff", "#b8ecfa", "#7fd0f0"], (Math.sin(x * 0.7 + y / 11) + 1) * 0.45, x, y)); } k.elipse(278, 102, 26, 5, "#ffffff"); nubarron(k, 250, 104, 56, 5); }
      const c = [{ pared: "#c8a878", luz: "#dcc094", osc: "#a88858", techo: "#6a4a3a", techoLuz: "#86604c", techoOsc: "#4a3428", sombra: "#a8926a" }, { pared: "#b89868", luz: "#ccae80", osc: "#98784c", techo: "#7a5230", techoLuz: "#946a44", techoOsc: "#5a3a20", sombra: "#a8926a" }];
      const palo = (x, y0, y1, w) => { k.R(x, y0, 2, y1 - y0, "#3a2a20"); bandera(k, x + 2, y0, w, w * 0.6, "#26262a"); k.elipse(x + 2 + w * 0.5, y0 + w * 0.26, 3, 3, "#f4efe0"); k.R(x + w * 0.5, y0 + w * 0.4, 5, 1, "#f4efe0"); };
      palo(17, 50, 76, 18); palo(62, 58, 84, 16);
      casaTorcida(k, -6, 130, 44, 34, { ...c[0], chimenea: true, redonda: false, toldo: "#8f1d22" }); casaTorcida(k, 42, 128, 38, 26, { ...c[1] }); casaTorcida(k, 80, 127, 24, 18, { ...c[0], ventana: false });
      k.R(6, 104, 22, 8, "#6d4628"); k.R(6, 104, 22, 1, "#a87444"); rotulo(k, 11, 106, "BAR", "#ffe9a8"); k.R(13, 112, 1, 2, "#3a2a20"); k.R(22, 112, 1, 2, "#3a2a20");
      tablas(k, 44, 110, 34, 4, "#7a5230", "#5a3a20", "#a87444", 2); for (let x = 46; x < 78; x += 5) k.R(x, 106, 1, 4, "#5a3a20"); k.R(44, 105, 34, 1, "#5a3a20");
      const PI = "#f2d8c8", PL = "#fbeadc", PS = "#d8b8a8", AZ = "#7fa8d0", AZO = "#5f88b0";
      k.R(112, 58, 84, 70, PI); [[104, 44, 18], [186, 44, 18], [142, 24, 26]].forEach(([x, y, w]) => { k.R(x, y, w, 128 - y, PI); k.R(x, y, 3, 128 - y, PL); k.R(x + w - 3, y, 3, 128 - y, PS); k.poli([[x - 3, y], [x + w + 3, y], [x + w / 2, y - 20]], AZ); k.poli([[x + w / 2, y - 20], [x + w + 3, y], [x + w / 2, y]], AZO); });
      almenas(k, 112, 58, 84, PI, 8, 5, 4);
      for (let y = 62; y < 124; y += 8) for (let x = 106 + ((y >> 3) % 2) * 6; x < 202; x += 14) k.R(x, y, 9, 1, PS);
      [[120], [172]].forEach(([x]) => ventanaArco(k, x, 72, 10, 16, PS, AZ)); ventanaArco(k, 150, 34, 9, 15, PS, AZ); ventanaArco(k, 108, 56, 7, 12, PS, AZ); ventanaArco(k, 192, 56, 7, 12, PS, AZ);
      k.elipse(155, 106, 15, 15, "#a8785a"); k.R(140, 106, 30, 22, "#a8785a"); k.R(154, 92, 2, 36, "#7a5230"); for (let x = 143; x < 170; x += 6) k.R(x, 96, 1, 32, "#8a6044"); k.elipse(150, 112, 1, 1, "#e8c35a"); k.elipse(160, 112, 1, 1, "#e8c35a");
      for (let x = 104; x < 206; x += 17) k.R(x, 44, 1, 84, "#e4c4b4"); [[128, 100], [178, 66], [116, 118]].forEach(([x, y]) => { k.R(x, y, 7, 3, "#b89878"); k.R(x + 2, y + 3, 3, 2, "#b89878"); });
      [[204, 60, 232, 128], [204, 86, 218, 128], [204, 46, 246, 128]].forEach(([a, b, c2, d]) => { k.linea(a, b, c2, d, "#8a6238", 2); k.linea(a, b - 1, c2, d - 1, "#a87444"); });
      tablas(k, 206, 96, 44, 32, "#a87444", "#7a5230", "#c0895a", 5); k.poli([[204, 96], [256, 96], [238, 76], [204, 76]], "#6d4628"); k.poli([[228, 96], [256, 96], [238, 76]], "#54351f"); for (let f = 80; f < 96; f += 4) k.R(208, f, 26, 1, "#54351f"); k.R(214, 106, 9, 9, "#5a3a22"); k.R(215, 107, 7, 7, "#ffd27a"); k.R(218, 107, 1, 7, "#5a3a22"); k.R(232, 110, 9, 18, "#4a3020"); k.R(242, 66, 6, 12, "#6a5a4a"); humo(k, 245, 62, "#e8e8e0", 0.45, 5);
      k.suelo(126, "#e8d09c", "#d8c08a", "#f4e2b4"); k.alfa(0.3, () => k.R(100, 128, 156, 3, "#a8926a"));
      tablas(k, 262, 118, 62, 5, "#a87444", "#7a5230", "#c0895a", 3); for (let x = 266; x < 320; x += 14) k.R(x, 122, 3, 8, "#6d4628");
      k.poli([[258, 104], [316, 104], [306, 116], [268, 116]], "#7a4e2c"); k.poli([[258, 104], [316, 104], [314, 107], [260, 107]], "#a87444"); k.R(288, 76, 2, 29, "#6d4628"); k.poli([[290, 78], [310, 98], [290, 100]], "#f4efe0"); k.linea(290, 80, 262, 104, "#5f3f24");
      esfera(k, 258, 98, 7, 7, ["#c0895a", "#a87444", "#7a5230"]); esfera(k, 257, 100, 4, 3, ["#fbe6c8", "#f2d8b0", "#d8b080"]); k.R(254, 96, 2, 2, "#26262a"); k.R(259, 96, 2, 2, "#26262a"); k.elipse(250, 96, 2, 3, "#a87444"); k.elipse(265, 96, 2, 3, "#a87444");
      espuma(k, 124, 236, 320); espuma(k, 123, 0, 100);
      k.R(98, 128, 2, 16, "#6d4628"); k.R(92, 128, 14, 2, "#6d4628"); esfera(k, 99, 123, 6, 5, ["#f4efe0", "#d8c8a0", "#a89470"]); k.poli([[103, 123], [110, 126], [103, 127]], "#e8a82a"); k.P(101, 121, "#26262a"); k.poli([[93, 121], [88, 117], [95, 125]], "#a89470");
      esfera(k, 118, 142, 8, 8, ["#f0c070", "#c9903c", "#8a5f24"]); k.elipse(119, 143, 4, 4, "#26323a"); k.P(117, 141, "#a8d8f0"); k.R(110, 149, 16, 2, "#6a4a24"); [[118, 134], [126, 142], [110, 142]].forEach(([x, y]) => k.R(x - 1, y - 1, 3, 3, "#a8842e"));
      k.R(204, 144, 22, 12, "#7a5230"); k.R(204, 144, 22, 4, "#a87444"); k.elipse(215, 144, 11, 4, "#a87444"); k.R(204, 147, 22, 1, "#c9a03c"); k.R(213, 146, 4, 4, "#e8c35a"); for (let i = 0; i < 8; i++) k.P(206 + i * 3, 142 - (i % 2), "#ffe08a"); sombra(k, 215, 157, 14, 2);
      k.poli([[232, 170], [282, 170], [276, 160], [240, 160]], "#8a5a32"); k.poli([[232, 170], [282, 170], [280, 167], [234, 167]], "#6d4628"); for (let x = 240; x < 276; x += 9) k.R(x, 160, 1, 10, "#6d4628"); sombra(k, 256, 171, 28, 2);
      [[84, 140, 42], [306, 152, 54], [14, 160, 46]].forEach(([x, b, a]) => { k.palmera(x, b, a); sombra(k, x + 2, b, 12, 2); });
      for (let i = 0; i < 24; i++) { const x = k.rnd() * 320, y = 136 + k.rnd() * 42; k.R(x, y, 10 + k.rnd() * 16, 1, "#d8c08a"); }
      caja(k, 130, 158, 12, 9); barril(k, 144, 160, 10, 12); [[160, 150], [186, 166]].forEach(([x, y]) => { k.R(x, y, 4, 1, "#c8ae78"); k.R(x + 8, y + 3, 4, 1, "#c8ae78"); });
      [[40, 150], [196, 170], [68, 172]].forEach(([x, y]) => esfera(k, x, y, 3, 2, ["#f8e8c8", "#e8c8a0", "#c8a078"]));
    }, { ven: VEN, dx: -90 }],
    25: ["Ineis Lobby", "La isla sin noche: la Torre de la Justicia, la catarata alrededor y la Puerta de la Justicia", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#6ab0e0", "#9ad0ec", "#d8ecf4"], 0, 100);
      nubarron(k, -24, 46, 100, 22); nubarron(k, 250, 40, 96, 24); cirros(k, 5, 4, 24);
      k.agua(86, 104, ["#3f9ad8", "#2f86c6"], "#d8f2fa", 30);
      const AC = ["#5a6474", "#46505e", "#343c4a", "#262c38"];
      for (let x = 78; x < 242; x++) for (let y = 4; y < 104; y++) k.P(x, y, rampa(AC, 0.2 + Math.abs(x - 160) / 180 + (y / 300), x, y));
      k.R(74, 0, 172, 6, "#6a7484"); k.R(74, 0, 6, 104, "#6a7484"); k.R(240, 0, 6, 104, "#3a4454"); k.R(159, 6, 2, 98, "#14181f");
      for (let y = 22; y < 100; y += 26) { k.R(80, y, 160, 2, "#6a7484"); k.R(80, y + 2, 160, 1, "#1e2430"); } for (let x = 92; x < 236; x += 20) for (let y = 12; y < 100; y += 13) k.R(x, y, 2, 2, "#8a94a4");
      [[122, 54], [198, 54]].forEach(([x, y]) => { k.elipse(x, y, 22, 22, "#c9a03c"); k.elipse(x, y, 18, 18, "#3a4454"); k.elipse(x, y, 13, 13, "#c9a03c"); k.elipse(x, y, 5, 5, "#3a4454"); for (let a = 0; a < 4; a++) { const c = a * 1.571 + 0.785; k.linea(x, y, x + Math.cos(c) * 13, y + Math.sin(c) * 13, "#3a4454", 2); } });
      for (let x = 0; x < 320; x++) { const y0 = 100 + Math.sin(x / 11) * 1.5; for (let y = Math.round(y0); y < 130; y++) { const f = (Math.sin(x * 2.3) + Math.sin(x * 0.9 + y / 12)) * 0.5; k.P(x, y, y < y0 + 2 ? "#ffffff" : rampa(["#ffffff", "#c8ecf8", "#8cd0ec", "#5ab0dc"], (f + 1) * 0.42 + ((y - y0) / 30) * -0.18, x, y)); } }
      k.niebla(118, 132, "#ffffff", 0.34);
      const TO = ["#f4f0e4", "#dcd8cc", "#b4b0a8", "#8c8884"];
      cilindro(k, 134, 34, 52, 92, TO, 0.25); for (let f = 0; f < 5; f++) for (let x = 142; x < 180; x += 10) { k.R(x, 44 + f * 15, 5, 9, "#3f6f9a"); k.R(x, 44 + f * 15, 5, 1, "#8c8884"); } [40, 56, 72, 88, 104].forEach((y) => k.R(134, y, 52, 1, "#a8a49c"));
      k.R(128, 30, 64, 5, "#c8c4b8"); k.R(128, 30, 64, 1, "#fbf8ee"); almenas(k, 128, 30, 64, "#c8c4b8", 7, 4, 3);
      cilindro(k, 148, 12, 24, 18, TO, 0.25); k.poli([[144, 12], [176, 12], [160, 0]], "#2f5fa8"); k.R(159, -2, 2, 6, "#3a2a20");
      k.R(186, 4, 2, 28, "#6a6d80"); if (h < 23) { k.poli([[188, 4], [212, 7], [212, 20], [188, 18]], "#2f6fa8"); k.elipse(200, 12, 5, 5, "#f4f0e4"); k.R(198, 8, 4, 9, "#2f6fa8"); k.R(195, 11, 11, 3, "#2f6fa8"); }
      const JU = (x, w) => { cilindro(k, x, 96, w, 34, TO, 0.3); for (let px = x + 4; px < x + w - 4; px += 10) { cilindro(k, px, 102, 5, 28, TO, 0.3); } k.poli([[x - 5, 100], [x + w + 5, 100], [x + w / 2, 86]], "#e8e4d8"); k.R(x - 5, 100, w + 10, 3, "#b4b0a8"); };
      JU(38, 74); JU(208, 74);
      const Q = { base: "#d8d8d4", luz: "#e8e8e4", osc: "#b0b0ac" };
      sillares(k, 0, 128, 320, 52, Q, 8, 26); k.R(0, 128, 320, 2, "#f4f4f0");
      rellena(k, [[134, 126], [186, 126], [214, 180], [106, 180]], (x, y) => ((y % 8 === 0 || (x + (y >> 3) * 7) % 22 === 0) ? "#a8b4c8" : "#c0c8d8"));
      for (let x = 2; x < 320; x += 11) { if (x > 126 && x < 190) continue; cilindro(k, x, 120, 4, 8, ["#f4f4f0", "#d8d8d4", "#a8a8a4"]); } k.R(0, 118, 128, 3, "#e8e8e4"); k.R(192, 118, 128, 3, "#e8e8e4");
      [[120, 128], [196, 128]].forEach(([x, b]) => { k.R(x - 2, b - 34, 2, 34, "#6a6d80"); bandera(k, x, b - 34, 12, 7, "#2f6fa8"); });
    }, { siempre: 14, ven: ["#3f6f9a"], fuego: [], tinte: 0.2, dx: 90 }],
    26: ["Amazon Rose", "La ciudad de las Kuja: el palacio entre agujas de roca, con dos serpientes gigantes guardando la escalera", (k) => {
      k.banda(["#5ac0e0", "#9ae0e8", "#e0f4e0"], 0, 118);
      nubarron(k, 70, 30, 56, 9); nubarron(k, 196, 20, 50, 8); cirros(k, 4, 2, 20);
      const aguja = (x, b, w, a, cols) => { for (let px = x; px < x + w; px++) { const t = (px - x) / w, top = b - a + Math.abs(Math.sin(px * 0.9)) * 4 + Math.abs(t - 0.5) * 22; for (let y = Math.round(top); y < b; y++) k.P(px, y, rampa(cols, Math.abs(t - 0.28) * 1.1 + (Math.sin(y / 3.1 + px / 9) > 0.74 ? 0.2 : 0), px, y)); } };
      const LE = ["#b8d4d0", "#a4c4c2", "#90b4b4"], CE = ["#c8b8a0", "#a89880", "#8a7a64", "#6e604e"], H = { tronco: "#5b3a24", copa: "#2f9a5a", borde: "#1f7a46", luz: "#5ac07a", osc: "#237f4a" };
      [[92, 22, 84], [120, 18, 96], [146, 20, 88], [176, 18, 98], [204, 22, 84]].forEach(([x, w, a]) => aguja(x, 118, w, a, LE));
      k.niebla(50, 110, "#f0fafa", 0.3);
      [[-10, 40, 112, 8], [24, 34, 96, 24], [52, 30, 70, 44], [238, 30, 74, 40], [262, 34, 100, 20], [292, 40, 116, 6]].forEach(([x, w, a, cima]) => { aguja(x, 124, w, a, CE); k.cumulo(x + w / 2, 124 - a + 8, 10, H); k.cumulo(x + w * 0.3, 124 - a + 13, 7, H); k.cumulo(x + w * 0.7, 124 - a + 12, 7, H); for (let i = 0; i < 4; i++) k.linea(x + 6 + i * (w / 4), 124 - a + 14, x + 5 + i * (w / 4), 124 - a + 30 + (i % 2) * 12, "#2f8a4a"); });
      const OR = ["#ffe9a8", "#f0d07a", "#c8a44a", "#a08438"], RJ = { c: "#c0392b", luz: "#e8604a", osc: "#8a2820" }, BL = ["#fff8ea", "#f4e8d0", "#d8c8a8", "#b8a888"], Q = { base: "#d8cfc0", luz: "#efe8da", osc: "#b0a694" };
      sillares(k, 84, 112, 152, 16, Q, 4, 12); sillares(k, 100, 98, 120, 14, Q, 4, 12); k.R(84, 111, 152, 2, "#fff8ea"); k.R(100, 97, 120, 2, "#fff8ea");
      for (let x = 86; x < 234; x += 6) { k.R(x, 106, 2, 5, "#c0392b"); } k.R(84, 105, 152, 1, "#c0392b");
      cilindro(k, 116, 66, 88, 32, BL, 0.3); for (let x = 120; x < 200; x += 12) { k.R(x, 66, 4, 32, "#c0392b"); k.R(x, 66, 1, 32, "#e8604a"); k.R(x + 5, 72, 6, 20, "#7a3a5a"); k.elipse(x + 8, 72, 3, 3, "#7a3a5a"); }
      tejadoJ(k, 160, 66, 122, 14, RJ, 6); k.R(106, 66, 108, 2, "#f0d07a");
      cilindro(k, 130, 40, 60, 20, BL, 0.3); for (let x = 134; x < 188; x += 11) { k.R(x, 40, 3, 20, "#c0392b"); k.R(x + 4, 44, 5, 12, "#7a3a5a"); }
      tejadoJ(k, 160, 40, 90, 13, RJ, 6); k.R(118, 40, 84, 2, "#f0d07a");
      cilindro(k, 144, 18, 32, 14, OR, 0.3); tejadoJ(k, 160, 18, 56, 12, { c: "#e8c35a", luz: "#ffe08a", osc: "#a8842e" }, 5); k.R(159, -2, 2, 8, "#a8842e"); esfera(k, 160, 4, 3, 3, OR);
      [[100, 44], [220, 44]].forEach(([x, y]) => { k.R(x, y, 2, 54, "#6a4a30"); for (let i = 0; i < 12; i++) { const o = Math.round(Math.sin(i / 3) * 1); k.R(x + (x < 160 ? -11 : 2) + i, y + 2 + o, 1, 20 - Math.abs(i - 6) * 0.5, "#7a3fa8"); } k.elipse(x + (x < 160 ? -5 : 8), y + 12, 3, 4, "#e8c84a"); });
      k.suelo(124, "#d8cfc0", "#c4bbac", "#e8e0d0"); k.alfa(0.25, () => k.R(0, 127, 320, 3, "#6a5a48"));
      for (let i = 0; i < 16; i++) { const y = 96 + i * 5.6, a = 16 + i * 4.2; k.R(160 - a, y, 2 * a, 6, i % 2 ? "#efe8da" : "#fff8ea"); k.R(160 - a, y + 5, 2 * a, 1, "#b0a694"); }
      const SC = ["#b078e0", "#8a4fb8", "#6a3596", "#4a2270"];
      const serpiente = (d) => {
        const X = (t) => 160 + d * (82 - 30 * t + Math.sin(t * 5.4) * 13), Y = (t) => 150 - t * 100, R0 = (t) => 9 - t * 4.4;
        [[0, 10], [1, 7]].forEach(([i, a]) => { k.elipse(160 + d * 84, 160 - i * 7, 26 - i * 6, a, SC[2]); k.elipse(160 + d * 84, 158 - i * 7, 25 - i * 6, a - 1, SC[1]); });
        for (let t = 0; t < 1; t += 0.006) { const x = X(t), y = Y(t), r = R0(t); bola(k, x, y, r, r, (px, py) => { const u = ((px - x) * d) / r; if (u < -0.45) return "#f4e8c8"; return (Math.round(t * 54) % 5 === 0 || (Math.sin(px * 1.4 + py * 1.4) > 0.86)) ? "#e8c84a" : rampa(SC, 0.3 + ((px - x) / r) * 0.3 + ((py - y) / r) * 0.2, px, py); }); }
        const x = X(1) - d * 2, y = Y(1) - 2;
        esfera(k, x - d * 5, y, 12, 8, SC); esfera(k, x + d * 2, y - 3, 8, 6, SC); k.poli([[x - d * 16, y + 1], [x - d * 4, y + 3], [x - d * 4, y + 7], [x - d * 14, y + 5]], "#5a1f4a"); k.poli([[x - d * 14, y + 2], [x - d * 11, y + 2], [x - d * 12, y + 7]], "#ffffff"); k.poli([[x - d * 8, y + 3], [x - d * 5, y + 3], [x - d * 6, y + 8]], "#ffffff");
        k.elipse(x - d * 4, y - 3, 2, 2, "#e8c84a"); k.R(x - d * 4, y - 4, 1, 3, "#26262a"); k.linea(x - d * 16, y + 3, x - d * 24, y + 5, "#e8402a"); k.P(x - d * 25, y + 4, "#e8402a"); k.P(x - d * 25, y + 6, "#e8402a");
        [-5, 0, 5].forEach((dx) => k.poli([[x + dx - 2, y - 8], [x + dx + 2, y - 8], [x + dx, y - 14]], "#e8c84a"));
      };
      serpiente(-1); serpiente(1);
      [[108, 128], [212, 128]].forEach(([x, b]) => { k.R(x - 2, b - 12, 5, 12, "#a08438"); k.elipse(x, b - 12, 7, 3, "#c8a44a"); k.llama(x, b - 13, 0.55); });
      [[26, 156, 34, 8], [294, 158, 34, 8]].forEach(([x, y, a, b]) => { k.elipse(x, y, a + 2, b + 2, "#b0a694"); k.elipse(x, y, a, b, "#3f9ac0"); k.elipse(x - 4, y - 1, a - 10, b - 4, "#6ac0dc"); [[-14, 0], [6, -3], [16, 3], [-4, 4]].forEach(([dx, dy], i) => { k.elipse(x + dx, y + dy, 5, 2, "#3f9a5a"); if (i % 2 === 0) { k.R(x + dx - 2, y + dy - 3, 5, 2, "#f2a8c0"); k.R(x + dx - 1, y + dy - 4, 3, 2, "#fcd0dc"); } }); });
      const bambu = (x, b, a) => { for (let i = 0; i < 3; i++) { const px = x + i * 5; cilindro(k, px, b - a + i * 9, 3, a - i * 9, ["#a8d870", "#7cb850", "#5a9a3a"]); for (let y = b - a + i * 9 + 6; y < b; y += 11) k.R(px, y, 3, 1, "#3f7a30"); k.linea(px + 2, b - a + i * 9 + 8, px + 12, b - a + i * 9 + 4, "#5a9a3a"); } };
      bambu(0, 150, 60); bambu(304, 152, 64); bambu(-4, 180, 54); bambu(310, 180, 50);
      flores(k, 132, 178, 50, ["#e8402a", "#f2a8c0", "#e8c84a", "#c87ae8"]); matas(k, 150, 178, 12, ["#2f9a5a", "#4fb070", "#7cd090"]);
      k.palmera(62, 150, 40); k.palmera(258, 152, 42);
    }, { tinte: 0.15, ven: VEN, fuego: ["#e8502a", "#ff9a3a", "#ffe06a"], dx: 86 }],
    27: ["Empil Down", "La gran prisión bajo el mar: rejas, cadenas y el infierno ardiendo", (k) => {
      k.banda(["#1a1014", "#2a141a", "#3a1a1a"], 0, 134);
      for (let y = 0, f = 0; y < 134; y += 12, f++) { k.R(0, y, 320, 1, "#0e080a"); for (let x = (f % 2 ? 12 : 32); x < 320; x += 40) { k.R(x, y, 1, 12, "#0e080a"); if ((x * 7 + y) % 3 === 0) k.R(x + 1, y + 1, 38, 11, y > 70 ? "#4a2022" : "#2e1a20"); } }
      k.R(90, 18, 140, 116, "#5a4a4a"); k.R(90, 18, 140, 2, "#7a6868"); for (let x = 94; x < 228; x += 10) { k.R(x, 21, 2, 2, "#8a7878"); k.R(x, 129, 2, 2, "#8a7878"); }
      for (let y = 30; y < 126; y += 10) { k.R(93, y, 2, 2, "#8a7878"); k.R(225, y, 2, 2, "#8a7878"); }
      k.R(100, 28, 120, 106, "#0e080a");
      for (let y = 60; y < 134; y++) for (let x = 100; x < 220; x++) { const f = ((y - 60) / 74) * (0.55 + 0.45 * Math.sin((x - 100) / 12) ** 2); if (Det.trama(x, y) < f * 0.9) k.P(x, y, y > 112 ? "#ff9a3a" : "#e8502a"); }
      [[122, 134, 1.6], [160, 134, 2.2], [198, 134, 1.7], [140, 134, 1.1], [180, 134, 1.2]].forEach(([x, y, e]) => k.llama(x, y, e));
      for (let x = 106; x < 218; x += 13) cilindro(k, x, 28, 5, 106, ["#9a9098", "#6e6468", "#4a4044"]); [46, 94].forEach((y) => { k.R(100, y, 120, 5, "#6e6468"); k.R(100, y, 120, 1, "#9a9098"); });
      k.R(130, 4, 60, 13, "#4a3a3a"); k.R(130, 4, 60, 1, "#7a6868"); rotulo(k, 134, 8, "EMPIL DOWN", "#c9a03c");
      [[28, 92], [58, 70], [262, 74], [292, 96]].forEach(([x, h]) => { for (let y = 0; y < h; y += 7) { k.R(x, y, 3, 5, "#6e6468"); k.R(x - 1, y + 4, 5, 3, "#4e4448"); } k.linea(x + 1, h, x - 6, h + 7, "#6e6468", 2); k.linea(x + 1, h, x + 8, h + 7, "#6e6468", 2); });
      [[76, 74], [244, 74]].forEach(([x, y]) => { k.R(x - 1, y, 3, 12, "#3a2a2a"); k.R(x - 3, y - 1, 7, 2, "#4a3a3a"); k.llama(x, y - 1, 0.5); });
      k.suelo(134, "#3a2a2a", "#2e2020", "#4a3636");
      for (let y = 142, f = 0; y < 180; y += 8 + f, f++) { k.R(0, y, 320, 1, "#261a1a"); for (let x = (f % 2) * 20; x < 320; x += 40 + f * 8) k.R(x, y, 1, 8 + f, "#261a1a"); }
      k.alfa(0.5, () => { for (let y = 134; y < 152; y++) { const a = 1 - (y - 134) / 18; k.alfa(0.3 * a, () => k.R(100, y, 120, 1, "#e8502a")); } });
      [[[48, 148], [62, 153], [70, 151], [82, 158], [78, 166], [90, 172], [86, 180]], [[238, 146], [250, 150], [248, 157], [262, 160], [270, 168], [264, 174], [272, 180]]].forEach((t) => t.forEach((p, i) => { if (i) { k.linea(t[i - 1][0], t[i - 1][1], p[0], p[1], "#e8502a", 2); k.linea(t[i - 1][0], t[i - 1][1] - 1, p[0], p[1] - 1, "#ffb04a"); } }));
      [[32, 134, 1.3], [64, 134, 0.8], [258, 134, 0.9], [290, 134, 1.3]].forEach(([x, y, e]) => k.llama(x, y, e));
      [[110, 170], [204, 168]].forEach(([x, y]) => { k.linea(x, y, x + 10, y - 2, "#d8cdb4", 2); k.elipse(x, y, 2, 2, "#d8cdb4"); k.elipse(x + 10, y - 2, 2, 2, "#d8cdb4"); });
      for (let i = 0; i < 50; i++) k.P(k.rnd() * 320, 30 + k.rnd() * 140, "#ffb04a");
    }, { cielo: "propio", fuerza: 0.05, fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a"] }],
    28: ["Funk Hazard", "La isla partida en dos, mitad fuego y mitad hielo", (k) => {
      const { h } = Det.cuando(k);
      k.banda(["#3a4a6a", "#6a7a9a", "#b8b0b0"], 0, 118);
      nubarron(k, -24, 34, 130, 18, ["#a88a80", "#7a5a54", "#4a3438"]); nubarron(k, 222, 28, 120, 20, ["#ffffff", "#dcecf6", "#b0cce0"]);
      const RF = ["#6a3a30", "#4a2622", "#34191a", "#241114"], HI = ["#f4fafe", "#d8ecf6", "#a8d0e8", "#7ab0d0"];
      montana(k, 60, 128, 196, 92, { roca: RF, rugosa: 1.5 });
      k.alfa(0.6, () => { for (let i = 0; i < 5; i++) k.elipse(62 + i * 3, 30 - i * 7, 10 + i * 3, 6 + i * 2, "#3a2a2e"); });
      k.elipse(60, 38, 17, 4, "#1a0c10"); k.elipse(60, 37, 13, 2, "#ff9a3a"); k.elipse(60, 37, 7, 1, "#ffe06a");
      for (let i = 0; i < 16; i++) { const a = -1.57 + (k.rnd() - 0.5) * 1.1, l = 5 + k.rnd() * 22; k.R(60 + Math.cos(a) * l, 36 + Math.sin(a) * l, 2, 2, i % 3 ? "#ff9a3a" : "#ffe06a"); }
      const rio = (p, g0) => p.forEach((q, i) => { if (!i) return; const [a, b] = p[i - 1], [c, d] = q, g = g0 + i * 0.9; k.halo((a + c) / 2, (b + d) / 2, 16, 14, "#e8502a", 0.22); k.linea(a, b, c, d, "#8a2418", g + 2); k.linea(a, b, c, d, "#e8502a", g); k.linea(a, b, c, d, "#ff9a3a", Math.max(1, g - 1)); k.linea(a + 0.5, b, c + 0.5, d, "#ffe06a"); });
      rio([[56, 40], [52, 52], [58, 62], [46, 76], [52, 90], [34, 104], [40, 118], [22, 128]], 1); rio([[64, 40], [70, 56], [62, 68], [76, 84], [72, 98], [92, 112], [88, 126]], 1); rio([[46, 76], [30, 86], [24, 100], [8, 112], [10, 126]], 1); rio([[76, 84], [96, 92], [110, 112], [124, 126]], 1);
      [[16, 124, 16], [104, 126, 14]].forEach(([x, b, a]) => { k.linea(x, b, x + 2, b - a, "#1a0c10", 2); k.linea(x + 1, b - a * 0.6, x - 7, b - a * 0.9, "#1a0c10"); k.linea(x + 2, b - a * 0.7, x + 9, b - a, "#1a0c10"); });
      rellena(k, [[330, 126], [330, 44], [278, 32], [236, 62], [168, 126]], (x, y) => rampa(HI, ((x - y * 0.6) % 34) / 34 * 0.62 + 0.1, x, y));
      [[246, 126, 20, 60], [276, 126, 26, 80], [308, 126, 18, 50], [214, 126, 16, 40], [190, 126, 12, 24]].forEach(([x, b, w, a]) => { k.poli([[x, b], [x + w * 0.4, b - a], [x + w, b]], "#e0f0fa"); k.poli([[x + w * 0.4, b - a], [x + w, b], [x + w * 0.55, b]], "#8ac0e0"); k.linea(x + w * 0.2, b - 4, x + w * 0.4, b - a + 6, "#ffffff"); });
      const LA = ["#f0f0ec", "#d8d8d4", "#b4b4b0", "#8e8e8c"];
      cilindro(k, 124, 62, 72, 64, LA, 0.3); esfera(k, 160, 62, 36, 22, ["#b8e4f4", "#7ac0dc", "#4a8aa8"]); k.R(124, 62, 72, 3, "#8e8e8c"); k.elipse(150, 52, 8, 5, "#e8f8ff");
      for (let f = 0; f < 3; f++) for (let x = 132; x < 186; x += 13) { k.R(x, 72 + f * 15, 8, 9, "#3f6f9a"); k.R(x, 72 + f * 15, 8, 1, "#8e8e8c"); } k.elipse(160, 112, 10, 10, "#3a3a44"); k.R(150, 112, 20, 14, "#3a3a44");
      [[108, 90, 124, 90], [196, 84, 214, 84]].forEach(([a, b, c, d]) => { k.R(Math.min(a, c), b, Math.abs(c - a), 5, "#6a6a74"); k.R(Math.min(a, c), b, Math.abs(c - a), 1, "#9a9aa4"); });
      rellena(k, [[-2, 182], [-2, 122], [162, 122], [172, 138], [176, 152], [186, 166], [196, 182]], (x, y) => { const v = Math.abs(Math.sin(x / 13 + Math.sin(y / 6) * 1.6) * Math.sin(y / 5.5 + Math.sin(x / 11) * 1.8)); return v < 0.05 ? "#ffb04a" : v < 0.11 ? "#e8502a" : rampa(["#4a3030", "#3a2426", "#2a191c"], 0.2 + ((x * 3 + y * 7) % 11) / 20, x, y); });
      [[22, 130, 26, 4], [90, 130, 30, 5], [120, 128, 16, 3]].forEach(([x, y, a, b]) => { k.elipse(x, y, a + 2, b + 1, "#8a2418"); k.elipse(x, y, a, b, "#e8502a"); k.elipse(x - 2, y, a - 5, b - 2, "#ff9a3a"); k.elipse(x - 3, y, a - 11, 1, "#ffe06a"); });
      [[12, 150, 1.1], [104, 164, 0.9], [44, 172, 1.2], [132, 148, 0.7], [72, 150, 0.8]].forEach(([x, y, e]) => k.llama(x, y, e));
      rellena(k, [[160, 122], [330, 122], [330, 182], [196, 182], [186, 166], [176, 152], [172, 138]], (x, y) => (Math.sin(x / 9 + y / 4) > 0.86 ? "#ffffff" : rampa(["#e8f4fa", "#cfe6f2", "#b0d4e8"], ((y - 122) / 58) * 0.8, x, y)));
      k.linea(160, 122, 172, 138, "#1a1420", 2); k.linea(172, 138, 176, 152, "#1a1420", 3); k.linea(176, 152, 186, 166, "#1a1420", 3); k.linea(186, 166, 196, 180, "#1a1420", 4);
      if (h === 14) k.alfa(0.55, () => [[230, 150, 40, 10], [266, 140, 30, 9], [204, 166, 34, 8]].forEach(([x, y, a, b]) => { k.elipse(x, y, a, b, "#8a3fa8"); k.elipse(x - 6, y - 4, a * 0.5, b * 0.6, "#b86ad8"); }));
      for (let i = 0; i < 30; i++) k.P(k.rnd() * 150, 56 + k.rnd() * 116, "#ffb04a"); for (let i = 0; i < 46; i++) k.P(170 + k.rnd() * 150, k.rnd() * 170, "#ffffff");
    }, { tinte: 0.6, ven: ["#3f6f9a"], fuego: ["#e8502a", "#ff9a3a", "#ffe06a", "#ffb04a", "#8a2418"] }],
    29: ["Zuo", "El ducado de los minks, sobre el lomo de un elefante gigante", (k) => {
      k.banda(["#6ab0d8", "#9ad0e4", "#d8ecd8"], 0, 118);
      const NU = ["#ffffff", "#e0ecf2", "#b8ccd8"];
      nubarron(k, -24, 66, 80, 18, NU); nubarron(k, 262, 60, 84, 20, NU);
      const G = ["#b8b8c0", "#9c9ca4", "#808088", "#66666e", "#50505a"];
      for (let t = 0; t < 1; t += 0.006) { const x = 160 + Math.sin(t * 2.6) * 34, y = 44 - t * 46, r = 12 - t * 6; bola(k, x, y, r, r, (px, py) => rampa(G, 0.26 + ((px - x) / r) * 0.32 + (Math.round(t * 170 + py / 3) % 9 === 0 ? 0.3 : 0), px, py)); }
      for (let i = 0; i < 22; i++) { const a = k.rnd() * 2.6 + 0.2, l = 6 + k.rnd() * 26; k.R(189 + Math.cos(a) * l, 2 + Math.sin(a) * l * 0.6, 1, 3, "#d8f4fa"); }
      const oreja = (x, d) => {
        const pts = [[x, 52], [x + d * 22, 26], [x + d * 58, 16], [x + d * 92, 26], [x + d * 106, 52], [x + d * 102, 82], [x + d * 84, 102], [x + d * 62, 108], [x + d * 40, 118], [x + d * 16, 112], [x, 96]];
        rellena(k, pts, (px, py) => { const u = Math.abs(px - x) / 106, v = (py - 16) / 102, r = Math.hypot(u - 0.42, v - 0.5); return r > 0.52 ? G[1] : Math.sin(u * 19 + v * 8) > 0.9 ? G[4] : rampa(["#a88a90", "#94747c", "#7e626c"], r * 1.4 + v * 0.2, px, py); });
      };
      oreja(118, -1); oreja(202, 1);
      [[1, 118], [-1, 202]].forEach(([d, x]) => { for (let t = 0; t < 1; t += 0.02) k.R(x - d * (6 + t * 22) - 2, 106 - Math.sin(t * 2.4) * 22 - t * 4, 5 - t * 3, 3, t > 0.75 ? "#ffffff" : "#efe6d0"); });
      const cab = (x, y, r) => bola(k, x, y, r, r * 1.05, (px, py) => rampa(G, 0.12 + ((px - 160) / 62) * 0.3 + ((py - 66) / 56) * 0.34 + 0.2 + (Math.sin(py / 2.9 + Math.sin(px / 16)) > 0.8 ? 0.14 : 0), px, py));
      cab(138, 66, 34); cab(182, 66, 34); rellena(k, [[104, 118], [112, 80], [208, 80], [216, 118]], (px, py) => rampa(G, 0.3 + ((px - 160) / 62) * 0.3 + (Math.sin(py / 2.9 + Math.sin(px / 16)) > 0.8 ? 0.14 : 0), px, py));
      for (let y = 36; y < 92; y++) k.P(160 + Math.sin(y / 9) * 1.5, y, G[4]);
      const v = { tronco: "#5b3a24", copa: "#4f9a4a", borde: "#357a38", luz: "#7cc060", osc: "#3f8a3e" };
      k.suelo(116, "#7fb85a", "#6ca84c", "#98cc70"); loma(k, [[-20, 122], [90, 114], [220, 120], [340, 112]], 136, ["#98cc70", "#7fb85a", "#6ca84c"], 0.14);
      [[6, 2.6], [54, 2], [268, 2], [312, 2.8]].forEach(([x, t]) => k.arbolote(x, 132, t, v));
      const casita = (x, b, r) => { esfera(k, x, b - r * 0.7, r, r * 0.9, ["#ecc88c", "#d8ac6c", "#b08a50"]); k.poli([[x - r - 3, b - r * 0.8], [x, b - r * 2.1], [x + r + 3, b - r * 0.8]], "#b5543a"); k.poli([[x, b - r * 2.1], [x + r + 3, b - r * 0.8], [x + 2, b - r * 0.8]], "#8a3f2a"); k.elipse(x, b - 4, 3, 4, "#4a3020"); k.R(x - 3, b - 4, 7, 4, "#4a3020"); k.R(x + r * 0.45, b - r * 0.9, 3, 3, "#ffd27a"); k.R(x - r * 0.7, b - r * 0.9, 3, 3, "#ffd27a"); sombra(k, x, b + 1, r + 2, 2); };
      casita(102, 132, 11); casita(126, 128, 8); casita(216, 130, 11); casita(192, 127, 8); casita(240, 134, 9);
      camino(k, 128, 180, (f) => 160 + Math.sin(f * 3) * f * 12, (f) => 6 + f * 22, "#c4ad7c", "#d8c08a", "#b89f6c");
      k.hierbas(134, 178, 90); flores(k, 138, 178, 36, ["#ffffff", "#f2d24a", "#c8a0e8"]); matas(k, 150, 178, 14);
      [[86, 142], [234, 144]].forEach(([x, b]) => { k.R(x, b - 22, 2, 22, "#6d4628"); k.R(x - 3, b - 22, 8, 1, "#6d4628"); farolillo(k, x + 4, b - 18, "#ffd27a", 2); brillo(k, x + 4, b - 18, 16, 14, "#ffcf6a", 0.6); });
    }, { tinte: 0.1, ven: VEN, dx: 70 }],
    30: ["Cupcake Island", "El castillo pastel de Big Mum, entre bosques de dulces", (k) => {
      k.banda(["#f2a8c8", "#f8c8d8", "#fde8e0"], 0, 116);
      const RS = ["#ffffff", "#fff0f6", "#fcd8e4"];
      nubarron(k, -20, 44, 96, 18, RS); nubarron(k, 244, 36, 96, 20, RS);
      const piso = (cx, y, w, h, cols, nata = ["#ffffff", "#fff0e8", "#f4d8cc"]) => {
        cilindro(k, cx - w / 2, y, w, h, cols, 0.28);
        for (let vx = cx - w / 2 + 6; vx < cx + w / 2 - 8; vx += 13) { k.elipse(vx + 3, y + h * 0.5, 3, 3, cols[3]); k.R(vx, y + h * 0.5, 7, h * 0.3, cols[3]); k.R(vx + 1, y + h * 0.5, 5, h * 0.3 - 1, "#ffd27a"); }
        k.elipse(cx, y, w / 2, 3, nata[0]); for (let x = cx - w / 2; x <= cx + w / 2; x++) { const d = 3 + Math.abs(Math.sin(x / 3.6 + y)) * 5 + (Math.sin(x / 7 + y) > 0.7 ? 5 : 0); k.R(x, y, 1, d, x > cx + w * 0.28 ? nata[1] : nata[0]); k.P(x, y + d, nata[2]); }
      };
      piso(160, 96, 136, 30, ["#e8b880", "#d8a070", "#b87e50", "#8a5a38"]); piso(160, 68, 106, 28, ["#fbd8e4", "#f2c8d8", "#d8a0b8", "#a86a88"]); piso(160, 44, 78, 24, ["#f8a0b8", "#e87a9a", "#c0587a", "#8a3a5a"]); piso(160, 24, 50, 20, ["#fff0d0", "#f8e0b0", "#d8b880", "#a8845a"]);
      [[116, 94], [142, 92], [178, 92], [204, 94], [132, 66], [188, 66]].forEach(([x, y]) => { esfera(k, x, y, 4, 4, ["#f0605a", "#c0392b", "#8a2820"]); k.R(x - 1, y - 5, 2, 2, "#3f8a3a"); });
      esfera(k, 160, 15, 11, 10, ["#f0605a", "#c0392b", "#8a2820"]); k.R(157, 3, 7, 3, "#3f8a3a"); for (let i = 0; i < 12; i++) k.P(152 + k.rnd() * 16, 8 + k.rnd() * 14, "#f8e0a0");
      [[132, 22], [188, 22]].forEach(([x, y]) => { k.R(x - 1, y - 10, 3, 12, "#fff0f6"); k.R(x - 1, y - 8, 3, 2, "#e85a8a"); k.R(x - 1, y - 4, 3, 2, "#e85a8a"); k.llama(x, y - 10, 0.28); });
      k.elipse(160, 112, 15, 14, "#6b3a2a"); k.R(145, 112, 30, 14, "#6b3a2a"); k.R(159, 98, 2, 28, "#4a2418"); k.elipse(160, 112, 13, 12, "#8a4a38");
      const piruleta = (x, b, r, c) => { k.R(x - 1, b - r * 4, 3, r * 4, "#f4efe0"); k.R(x + 1, b - r * 4, 1, r * 4, "#d8cdb4"); for (let a = 0; a < 30; a += 0.12) { const e = (a / 30) * r * 1.9, px = x + Math.cos(a) * e, py = b - r * 4 - r * 1.2 + Math.sin(a) * e; k.R(px, py, 2, 2, Math.round(a) % 2 ? c : "#ffe0ec"); } };
      piruleta(30, 126, 9, "#e85a8a"); piruleta(70, 128, 7, "#5ac0d8"); piruleta(250, 128, 7, "#f2a23a"); piruleta(290, 126, 9, "#a87ae8");
      [[8, 116, 18, "#f8b8d8"], [100, 118, 12, "#b8e0f8"], [226, 118, 12, "#f8e0a0"], [312, 116, 18, "#c8f0c8"]].forEach(([x, y, r, c]) => { k.R(x - 2, y, 4, 14, "#c88a5a"); esfera(k, x, y - 4, r, r * 0.8, ["#ffffff", c, c]); });
      k.suelo(126, "#f8e0b8", "#ecd0a4", "#fff0d0"); k.alfa(0.35, () => k.R(0, 127, 320, 2, "#c8a078"));
      k.poli([[-4, 148], [60, 140], [104, 146], [84, 160], [-4, 170]], "#f2a23a"); k.poli([[-4, 150], [58, 143], [92, 148], [76, 158], [-4, 166]], "#f8c04a"); k.R(14, 150, 22, 1, "#ffe08a"); k.R(40, 146, 18, 1, "#ffe08a");
      camino(k, 126, 180, (f) => 160 + Math.sin(f * 3) * f * 10, (f) => 10 + f * 22, "#c88a5a", "#e0a870", "#b87a4a");
      for (let y = 132; y < 180; y += 9) { const f = (y - 126) / 54, c = 160 + Math.sin(f * 3) * f * 10, a = 10 + f * 22; for (let x = c - a + 3; x < c + a - 3; x += 7 + f * 4) k.R(x, y, 2, 1, "#a86a3a"); k.R(c - a, y + 4, 2 * a, 1, "#b87a4a"); }
      [[64, 158], [250, 152], [286, 172], [108, 172]].forEach(([x, y]) => { k.poli([[x - 7, y], [x + 7, y], [x, y + 16]], "#d8a860"); for (let i = 0; i < 4; i++) k.linea(x - 6 + i * 4, y + 1, x + 5 - i * 3, y + 10, "#b88a48"); esfera(k, x, y - 3, 8, 7, ["#ffffff", "#fff0f4", "#f8c8d8"]); esfera(k, x + 1, y - 8, 4, 4, ["#f8c8d8", "#f2a8c8", "#d87a9a"]); k.P(x + 2, y - 11, "#c0392b"); });
      [[120, 142, 12], [216, 146, 14], [24, 174, 16]].forEach(([x, y, r]) => { k.elipse(x, y + 2, r, 4, "#8a5a38"); k.elipse(x, y, r, 4, "#c88a5a"); k.elipse(x, y - 1, r - 3, 2, "#e8b080"); });
      for (let i = 0; i < 46; i++) k.R(k.rnd() * 320, 128 + k.rnd() * 50, 2, 1, ["#e85a8a", "#5ac0d8", "#f2c84b", "#7cc860"][i % 4]);
    }, { tinte: 0.5, ven: VEN, dx: 76 }],
    31: ["Eggbrain", "La isla del futuro, con el laboratorio en forma de huevo", (k) => {
      k.banda(["#3a8ae0", "#7ac0f0", "#c8ecf8"], 0, 118);
      nubarron(k, -24, 58, 92, 20); nubarron(k, 254, 50, 92, 22);
      const ME = ["#e8f0f6", "#c8d4dc", "#a8b4bc", "#84909a"];
      [[18, 20, 86], [44, 16, 60], [66, 14, 74], [242, 14, 70], [262, 22, 92], [290, 16, 58], [308, 16, 78]].forEach(([x, w, h]) => { cilindro(k, x, 126 - h, w, h, ME, 0.3); k.elipse(x + w / 2, 126 - h, w / 2, 4, "#7ae8ff"); k.elipse(x + w / 2, 125 - h, w / 2 - 2, 2, "#d8fbff"); for (let y = 126 - h + 8; y < 122; y += 9) { k.R(x + 2, y, w - 5, 1, "#3ac0e8"); k.R(x + 2, y + 2, w - 5, 2, "#7ae8ff"); } });
      const HU = ["#ffffff", "#f8f4e8", "#e8e2d0", "#c8c2b4"];
      bola(k, 160, 62, 58, 62, (x, y) => rampa(HU, 0.1 + (((x - 160) / 58) * 0.4 + ((y - 62) / 62) * 0.26 + 0.34), x, y));
      rellena(k, [[102, 66], [116, 58], [128, 70], [144, 54], [160, 68], [176, 54], [192, 70], [204, 58], [218, 66], [212, 120], [108, 120]], (x, y) => rampa(["#e4ecf2", "#c8d4dc", "#a8b4bc"], 0.1 + ((x - 102) / 116) * 0.8, x, y));
      for (let x = 102; x < 218; x++) { const y = 92 + Math.sin((x - 102) / 37) * 4; k.R(x, y, 1, 3, "#3ac0e8"); k.P(x, y - 1, "#d8fbff"); } for (let x = 110; x < 212; x++) { const y = 112 + Math.sin((x - 102) / 37) * 3; k.R(x, y, 1, 2, "#3ac0e8"); }
      for (let x = 118; x < 204; x += 13) { k.R(x, 76, 8, 10, "#3a4a5a"); k.R(x + 1, 77, 6, 8, "#7ae8ff"); }
      k.elipse(160, 112, 13, 13, "#3a4a5a"); k.R(147, 112, 26, 14, "#3a4a5a"); k.elipse(160, 112, 10, 10, "#7ae8ff"); k.R(159, 100, 2, 26, "#3a4a5a");
      k.linea(8, 40, 108, 58, "#84909a", 2); k.linea(312, 44, 212, 58, "#84909a", 2);
      const coche = (x, y, c) => { k.elipse(x, y, 9, 3, c); k.elipse(x - 1, y - 2, 5, 3, "#7ae8ff"); k.R(x - 8, y + 2, 4, 1, "#3ac0e8"); k.R(x + 4, y + 2, 4, 1, "#3ac0e8"); };
      coche(92, 26, "#e8607a"); coche(238, 36, "#f2c84b");
      k.suelo(124, "#c8d4dc", "#b8c4cc", "#d8e4ec", 180, 300);
      for (let i = -9; i <= 9; i++) k.linea(160 + i * 20, 124, 160 + i * 52, 180, i % 3 ? "#a8b4bc" : "#3ac0e8");
      for (let y = 128, f = 0; y < 180; y += 4 + f * 2, f++) k.R(0, y, 320, 1, f % 2 ? "#7ae8ff" : "#a8b4bc");
      k.alfa(0.3, () => k.R(0, 124, 320, 3, "#5a6a78"));
      const robot = (x, b) => { sombra(k, x, b + 1, 8, 2); k.R(x - 3, b - 7, 3, 7, "#84909a"); k.R(x + 1, b - 7, 3, 7, "#84909a"); cilindro(k, x - 6, b - 18, 13, 12, ME, 0.3); esfera(k, x, b - 22, 5, 5, ME); k.R(x - 3, b - 23, 7, 2, "#e8402a"); k.R(x - 9, b - 17, 3, 9, "#a8b4bc"); k.R(x + 7, b - 17, 3, 9, "#a8b4bc"); };
      robot(102, 142); robot(218, 142);
      [[40, 158], [276, 156]].forEach(([x, y]) => { esfera(k, x, y, 9, 11, ["#ffffff", "#e8e2d0", "#c8c2b4"]); k.R(x - 9, y, 18, 2, "#3ac0e8"); sombra(k, x, y + 11, 9, 2); });
    }, { tinte: 0.15, ven: ["#7ae8ff"], fuego: ["#3ac0e8"], dx: 0 }],
  };
  function tambor(k, cx, base, rx, top, { roca, nieve, grietas = 10, repisas = 6 }) {
    const ry = Math.max(3, Math.round(rx * 0.2)), borde = (x) => top + ry * Math.sqrt(Math.max(0, 1 - ((x - cx) / rx) ** 2)), osc = roca[roca.length - 1];
    for (let x = cx - rx; x <= cx + rx; x++) { const t = (x - cx) / rx, v = Math.abs(t + 0.42) / 1.42; for (let y = Math.round(borde(x)); y <= base; y++) k.P(x, y, rampa(roca, v + ((y - top) / (base - top)) * 0.1, x, y)); }
    for (let i = 0; i < grietas; i++) { const x0 = cx + rx * (k.rnd() * 1.84 - 0.92), y0 = borde(x0) + 6 + k.rnd() * (base - top) * 0.62, n = 6 + k.rnd() * 24; for (let j = 0; j < n; j++) { const px = x0 + Math.round(Math.sin(j / 3.1 + i) * 1.3); k.P(px, y0 + j, osc); if (j % 3 === 0) k.P(px - 1, y0 + j, roca[0]); } }
    for (let i = 0; i < repisas; i++) { const y = top + ry + 10 + k.rnd() * (base - top - ry - 18), w = 5 + k.rnd() * rx * 0.34, x0 = cx - rx * 0.9 + k.rnd() * (rx * 1.8 - w); k.R(x0 + 1, y - 1, w - 2, 1, nieve[0]); k.R(x0, y, w, 1, nieve[0]); k.R(x0 + 1, y + 1, w - 2, 1, nieve[1]); k.R(x0 + 2, y + 2, w - 4, 1, osc); }
    k.elipse(cx, top, rx, ry, nieve[0]); k.elipse(cx + rx * 0.2, top + 1, rx * 0.7, ry * 0.55, nieve[1]);
    for (let x = cx - rx; x <= cx + rx; x++) { const t = (x - cx) / rx, d = 3 + Math.abs(Math.sin(x / 4.3 + cx)) * 4 + (Math.sin(x / 1.7 + cx) > 0.55 ? 3 : 0), y0 = Math.round(borde(x)); k.R(x, y0 - 1, 1, d, t > 0.5 ? nieve[1] : nieve[0]); k.P(x, y0 - 1 + d, nieve[2]); }
  }
  function pinoNevado(k, x, base, h, { hoja = "#2f5a4a", hojaOsc = "#1f4238", nieve = ["#ffffff", "#d6e2ef"], tronco = "#4a3226" } = {}) {
    k.R(x - 1, base - 4, 3, 4, tronco);
    const pisos = Math.max(3, Math.round(h / (h > 40 ? 13 : 7))), paso = (h - 3) / pisos;
    for (let p = 0; p < pisos; p++) {
      const alto = paso * 1.6, y1 = base - 3 - p * paso, a = 2 + ((pisos - p) / pisos) * h * 0.3;
      for (let i = 0; i < alto; i++) {
        const f = (i + 1) / alto, w = a * f, y = y1 - alto + i, dientes = i > alto * 0.6 && (Math.round(i) % 2 === 0) ? 1 : 0;
        k.R(x - w - dientes, y, 2 * w + 1 + dientes * 2, 1, hoja); k.R(x + w * 0.25, y, w * 0.75 + 1 + dientes, 1, hojaOsc);
        if (f < 0.62) { k.R(x - w, y, 2 * w * (f < 0.42 ? 1 : 0.66) + 1, 1, nieve[0]); if (f > 0.34) k.R(x + w * 0.1, y, w * 0.9 + 1, 1, nieve[1]); }
      }
    }
  }
  Det.sitios("piratas", sitios);
})();
