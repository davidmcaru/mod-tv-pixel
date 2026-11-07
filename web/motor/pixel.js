// pixel.js — lo básico para pintar a píxeles en un lienzo de 320 × 180: paletas, capas y dibujos.
(function () {
  if (!HTMLCanvasElement.prototype.getContext.enMemoria) {
    const getContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (tipo, o) { return getContext.call(this, tipo, tipo === "2d" ? { willReadFrequently: true, ...(o || {}) } : o); };
    HTMLCanvasElement.prototype.getContext.enMemoria = true;
  }
  const W = 320, H = 180;
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];

  const PALETAS = {
    noche: {
      cielo: ["#060a1c", "#0a1230", "#101a40", "#16224f", "#1e2b5e", "#28376c"],
      estrella: ["#ffffff", "#cdd8ff", "#7f93d6"],
      astro: "#f2edc8", astroSombra: "#d3cc9c", astroCrater: "#bfb889", halo: ["#1f2b5a", "#2a386c"],
      nube: "#27325f", nubeLuz: "#334077",
      montana1: "#172049", montana1Luz: "#1f2a58", montana2: "#111a3c",
      suelo: "#142c27", sueloOsc: "#0e211d", sueloLuz: "#1b3831",
      arbol: "#113629", arbolLuz: "#1b4e3d", arbolOsc: "#0b261d", arbolBorde: "#05130e", tronco: "#26190f",
      hierba: "#1c4535", hierbaLuz: "#2c6249", hierbaOsc: "#0d271e",
      camino: "#363650", caminoBorde: "#28283d", caminoLuz: "#45455f",
      pared: "#58566f", paredSombra: "#424057", tejado: ["#72232f", "#521823"], tejado2: ["#263f72", "#1b2e57"],
      puerta: "#2a1e24", ventana: "#ffd677", ventanaMorca: "#352c3c", brillo: "#ffcc66", luces: true,
      valla: "#463b37", flor: ["#b9566a", "#c9c9dc"], farola: "#fff0b0",
      bola: { X: "#0c0c12", R: "#b3301a", W: "#c9c9d6", S: "#e8e8f0" },
    },
    atardecer: {
      cielo: ["#2a1b4d", "#4a2466", "#7c2f72", "#b8456f", "#e2665e", "#f39a5a", "#fbc56e"],
      estrella: ["#fff1d6", "#ffd9b0", "#f3b089"],
      astro: "#fff2c2", astroSombra: "#ffe39a", astroCrater: "#ffe39a", halo: ["#f7b35f", "#fbd27c"],
      nube: "#c75a77", nubeLuz: "#f08a7e",
      montana1: "#5a2f68", montana1Luz: "#6e3a78", montana2: "#43245a",
      suelo: "#3e6b3d", sueloOsc: "#30552f", sueloLuz: "#4e7f48",
      arbol: "#2d5e36", arbolLuz: "#4a8a45", arbolOsc: "#1f4428", arbolBorde: "#13291a", tronco: "#4e3221",
      hierba: "#3f7d3f", hierbaLuz: "#7cb85a", hierbaOsc: "#24502a",
      camino: "#c99a64", caminoBorde: "#9c7246", caminoLuz: "#dcb27a",
      pared: "#e8d4b8", paredSombra: "#c4ab8c", tejado: ["#c0392b", "#8e2a20"], tejado2: ["#2f6db0", "#245489"],
      puerta: "#5b3a2a", ventana: "#ffe7a3", ventanaMorca: "#6b4e3a", brillo: "#ffd27a", luces: false,
      valla: "#7a5638", flor: ["#e0556b", "#fff4e6"], farola: "#fff0b0",
      bola: { X: "#1c1418", R: "#e3350d", W: "#f4ece6", S: "#ffffff" },
    },
    dia: {
      cielo: ["#5aa9e6", "#6bb6ec", "#7ec3f0", "#93cff3", "#a8daf5", "#bfe5f7"],
      estrella: [], astro: "#fff7cf", astroSombra: "#fff0a8", astroCrater: "#fff0a8", halo: ["#cdeaf8", "#dff2fb"],
      nube: "#eef8fd", nubeLuz: "#ffffff",
      montana1: "#7aa7c7", montana1Luz: "#8fb7d3", montana2: "#5f93b4",
      suelo: "#6cbf5a", sueloOsc: "#5aa84c", sueloLuz: "#82d06c",
      arbol: "#3c9a4a", arbolLuz: "#6cc35e", arbolOsc: "#2b7a3a", arbolBorde: "#1d5229", tronco: "#7a4e2e",
      hierba: "#4caa48", hierbaLuz: "#8fd96a", hierbaOsc: "#2f7d34",
      camino: "#e6cf9a", caminoBorde: "#c4a670", caminoLuz: "#f2e0b4",
      pared: "#f4ead8", paredSombra: "#d8c8ac", tejado: ["#d8432f", "#a83224"], tejado2: ["#3b7fd0", "#2d64a8"],
      puerta: "#6b4a34", ventana: "#9fd6f2", ventanaMorca: "#6e5a48", brillo: "#ffffff", luces: false,
      valla: "#9a6c44", flor: ["#f2627a", "#ffffff"], farola: "#fff0b0",
      bola: { X: "#1c1418", R: "#e3350d", W: "#f6f6f6", S: "#ffffff" },
    },
    amanecer: {
      cielo: ["#2c3f78", "#4a5a9a", "#7d6fb0", "#c486b0", "#f0a0a0", "#ffc8a0", "#ffe2b8"],
      estrella: ["#ffffff", "#e0e6ff", "#b0b8e0"],
      astro: "#fff4d6", astroSombra: "#ffe2b0", astroCrater: "#ffe2b0", halo: ["#ffcfa6", "#ffe2c2"],
      nube: "#e09ab4", nubeLuz: "#ffd2da",
      montana1: "#6a6aa8", montana1Luz: "#8a84c0", montana2: "#4f5590",
      suelo: "#4f8a5a", sueloOsc: "#40744a", sueloLuz: "#62a06a",
      arbol: "#3a7a52", arbolLuz: "#5c9e6c", arbolOsc: "#2a5a3e", arbolBorde: "#1a3a2a", tronco: "#5a3a2a",
      hierba: "#4a8a50", hierbaLuz: "#8cc878", hierbaOsc: "#2a5a34",
      camino: "#d8b88a", caminoBorde: "#b09060", caminoLuz: "#ecd2a8",
      pared: "#ead8c8", paredSombra: "#c8b0a0", tejado: ["#c0483a", "#8e3428"], tejado2: ["#3a6ab0", "#2a5088"],
      puerta: "#5b3a2a", ventana: "#ffe2a8", ventanaMorca: "#6b4e3a", brillo: "#ffd27a", luces: false,
      valla: "#7a5638", flor: ["#e8607a", "#fff2ea"], farola: "#fff0b0",
      bola: { X: "#1c1418", R: "#e3350d", W: "#f4ece6", S: "#ffffff" },
    },
    mediodia: {
      cielo: ["#3c8ce8", "#4e9aee", "#62a8f2", "#78b6f5", "#90c4f7", "#a8d2f9"],
      estrella: [], astro: "#fffbe0", astroSombra: "#fff4b8", astroCrater: "#fff4b8", halo: ["#bfe0fb", "#d8ecfc"],
      nube: "#f2f9fe", nubeLuz: "#ffffff",
      montana1: "#6f9fc6", montana1Luz: "#86b1d4", montana2: "#5389b4",
      suelo: "#68c254", sueloOsc: "#56ac46", sueloLuz: "#7ed468",
      arbol: "#38a046", arbolLuz: "#68c85a", arbolOsc: "#278036", arbolBorde: "#1a5626", tronco: "#7a4e2e",
      hierba: "#48ae44", hierbaLuz: "#90dc68", hierbaOsc: "#2c8030",
      camino: "#ead39c", caminoBorde: "#c8a86e", caminoLuz: "#f6e4b6",
      pared: "#f6ecda", paredSombra: "#dac9ac", tejado: ["#dc4430", "#ac3426"], tejado2: ["#3c80d4", "#2e66ac"],
      puerta: "#6b4a34", ventana: "#a8daf4", ventanaMorca: "#6e5a48", brillo: "#ffffff", luces: false,
      valla: "#9a6c44", flor: ["#f4627a", "#ffffff"], farola: "#fff0b0",
      bola: { X: "#1c1418", R: "#e3350d", W: "#f6f6f6", S: "#ffffff" },
    },
    tarde: {
      cielo: ["#4a86cc", "#6698d2", "#88acd6", "#aebcd0", "#d8c8b0", "#f0d6a2"],
      estrella: [], astro: "#fff2c4", astroSombra: "#ffe6a0", astroCrater: "#ffe6a0", halo: ["#f4ddb0", "#fae8c6"],
      nube: "#f4e2c8", nubeLuz: "#fff4e4",
      montana1: "#7c8cb0", montana1Luz: "#94a0c0", montana2: "#62729a",
      suelo: "#6aa850", sueloOsc: "#5a9244", sueloLuz: "#80ba60",
      arbol: "#3e8a40", arbolLuz: "#70b05a", arbolOsc: "#2c6a30", arbolBorde: "#1c4622", tronco: "#7a4e2e",
      hierba: "#549a44", hierbaLuz: "#a0cc66", hierbaOsc: "#326c2e",
      camino: "#e2c08a", caminoBorde: "#bc9660", caminoLuz: "#f0d6a8",
      pared: "#f2e2c8", paredSombra: "#d4bc9c", tejado: ["#cc4230", "#9c3224"], tejado2: ["#3a76c4", "#2c5c9c"],
      puerta: "#6b4a34", ventana: "#ffe8b0", ventanaMorca: "#6e5a48", brillo: "#ffe0a0", luces: false,
      valla: "#946640", flor: ["#ee5a72", "#fff6e8"], farola: "#fff0b0",
      bola: { X: "#1c1418", R: "#e3350d", W: "#f6f0e6", S: "#ffffff" },
    },
    gameboy: {
      cielo: ["#0f380f", "#0f380f", "#0f380f", "#163f16", "#1d4a1d", "#245424"],
      estrella: ["#8bac0f", "#9bbc0f", "#306230"],
      astro: "#9bbc0f", astroSombra: "#8bac0f", astroCrater: "#8bac0f", halo: ["#1a4a1a", "#306230"],
      nube: "#245424", nubeLuz: "#306230",
      montana1: "#1d4a1d", montana1Luz: "#306230", montana2: "#183f18",
      suelo: "#306230", sueloOsc: "#245424", sueloLuz: "#3a6e2a",
      arbol: "#306230", arbolLuz: "#8bac0f", arbolOsc: "#1d4a1d", arbolBorde: "#0f380f", tronco: "#0f380f",
      hierba: "#306230", hierbaLuz: "#8bac0f", hierbaOsc: "#0f380f",
      camino: "#8bac0f", caminoBorde: "#306230", caminoLuz: "#9bbc0f",
      pared: "#8bac0f", paredSombra: "#306230", tejado: ["#0f380f", "#306230"], tejado2: ["#0f380f", "#306230"],
      puerta: "#0f380f", ventana: "#9bbc0f", ventanaMorca: "#0f380f", brillo: "#9bbc0f", luces: false,
      valla: "#0f380f", flor: ["#9bbc0f", "#8bac0f"], farola: "#9bbc0f",
      bola: { X: "#0f380f", R: "#306230", W: "#9bbc0f", S: "#9bbc0f" },
    },
  };

  function azar(semilla) {
    let s = (semilla >>> 0) || 1;
    return () => ((s = (Math.imul(s, 1664525) + 1013904223) >>> 0) / 4294967296);
  }
  const dibujo = (c, mapa, col, x, y) => mapa.forEach((s, j) => [...s].forEach((ch, i) => {
    if (col[ch]) { c.fillStyle = col[ch]; c.fillRect(Math.round(x + i), Math.round(y + j), 1, 1); }
  }));
  function exclama(escala = 5) {
    const c = document.createElement("canvas");
    c.width = EXCLAMA[0].length; c.height = EXCLAMA.length;
    dibujo(c.getContext("2d"), EXCLAMA, EX_COL, 0, 0);
    c.className = "exclama"; c.style.width = c.width * escala + "px"; c.style.height = c.height * escala + "px"; c.style.imageRendering = "pixelated";
    return c;
  }
  window.Pixel = { exclama, PALETAS, W, H };
})();
