// horas.js — la luz, el saludo y lo oscuro de cada hora del día.
(function () {
  const hex = (c) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const mezclaColor = (a, b, t) => "#" + hex(a).map((v, i) => Math.round(v + (hex(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
  const reparte = (lista, n) => Array.from({ length: n }, (_, i) => {
    const f = (i * (lista.length - 1)) / (n - 1), k = Math.floor(f);
    return k + 1 < lista.length ? mezclaColor(lista[k], lista[k + 1], f - k) : lista[k];
  });
  const esColor = (v) => typeof v === "string" && v[0] === "#";
  function mezcla(A, B, t) {
    const out = {};
    for (const k of Object.keys(A)) {
      const a = A[k], b = B[k];
      if (esColor(a) && esColor(b)) out[k] = mezclaColor(a, b, t);
      else if (Array.isArray(a) && Array.isArray(b) && a.length && b.length && esColor(a[0])) {
        const n = Math.max(a.length, b.length), ra = reparte(a, n), rb = reparte(b, n);
        out[k] = ra.map((c, i) => mezclaColor(c, rb[i], t));
      } else if (a && b && typeof a === "object" && typeof b === "object" && !Array.isArray(a)) out[k] = mezcla(a, b, t);
      else out[k] = t < 0.5 ? a : b;
    }
    return out;
  }
  const oscurece = (P, t) => mezcla(P, JSON.parse(JSON.stringify(P).replace(/#[0-9a-fA-F]{6}/g, "#000000")), t);

  const MAR = {
    noche: { mar: ["#141d44", "#111939", "#0d1430", "#0a1027"], marLuz: "#2a3a73", roca: "#070a18", rocaLuz: "#1c2650", arena: "#151520", arenaLuz: "#22222f", espuma: "#8fa0d8" },
    amanecer: { mar: ["#6a6aa8", "#5a5c98", "#4a4e88", "#3c4078"], marLuz: "#f0b0c0", roca: "#2a2440", rocaLuz: "#7a6a98", arena: "#c8a890", arenaLuz: "#dcc0a8", espuma: "#ffe2e2" },
    dia: { mar: ["#3a8ad0", "#2f78bc", "#2766a8", "#205694"], marLuz: "#a8dcf6", roca: "#3a3a4c", rocaLuz: "#6e6e88", arena: "#e2cc9e", arenaLuz: "#f0dcb4", espuma: "#ffffff" },
    mediodia: { mar: ["#3c92dc", "#3080c8", "#286eb4", "#205ea0"], marLuz: "#b8e4fa", roca: "#3c3c50", rocaLuz: "#74748e", arena: "#ead6a8", arenaLuz: "#f6e6c0", espuma: "#ffffff" },
    tarde: { mar: ["#4a86c4", "#3e74b0", "#34649c", "#2a5488"], marLuz: "#f2d6a0", roca: "#3a3446", rocaLuz: "#7a6e84", arena: "#dcc092", arenaLuz: "#ecd2a8", espuma: "#fff4e0" },
    atardecer: { mar: ["#5a3b6e", "#4a3160", "#3b2852", "#2d2044"], marLuz: "#c97b8a", roca: "#1d1328", rocaLuz: "#5b3150", arena: "#2a2230", arenaLuz: "#3a3042", espuma: "#f2c9b8" },
  };
  const base = (n) => ({ ...Pixel.PALETAS[n], M: MAR[n] });

  const PLAN = [
    ["noche", "noche", 0, 0.3], ["noche", "noche", 0, 0.35], ["noche", "noche", 0, 0.35], ["noche", "noche", 0, 0.25], ["noche", "amanecer", 0.18],
    ["noche", "amanecer", 0.55], ["amanecer", "amanecer", 0], ["amanecer", "dia", 0.5], ["dia", "dia", 0], ["dia", "mediodia", 0.15],
    ["dia", "mediodia", 0.4], ["dia", "mediodia", 0.7], ["mediodia", "mediodia", 0], ["mediodia", "mediodia", 0.08], ["mediodia", "tarde", 0.35],
    ["mediodia", "tarde", 0.7], ["tarde", "tarde", 0], ["tarde", "atardecer", 0.35], ["tarde", "atardecer", 0.7], ["atardecer", "atardecer", 0],
    ["atardecer", "noche", 0.35], ["atardecer", "noche", 0.7], ["noche", "noche", 0], ["noche", "noche", 0, 0.12],
  ];
  const deDia = (h) => h >= 6 && h <= 20;

  function paleta(h) {
    const [a, b, t, sombra] = PLAN[h];
    let P = mezcla(base(a), base(b), t);
    if (sombra) P = oscurece(P, sombra);
    P.nocturna = !deDia(h);
    P.luces = h >= 19 || h <= 6;
    P.pajaros = h >= 18 && h <= 20;
    P.estrella = P.nocturna ? Pixel.PALETAS.noche.estrella : h === 20 || h === 6 ? ["#fff1d6"] : [];
    return P;
  }
  function sol(h) {
    if (deDia(h)) {
      const f = (h - 6) / 14, s = Math.sin(Math.PI * f);
      return { x: Math.round(148 + f * 44), y: Math.round(94 - s * 78), r: Math.round(18 - s * 6) };
    }
    const f = (((h - 21) + 24) % 24) / 8, s = Math.sin(Math.PI * f);
    return { x: Math.round(198 - f * 58), y: Math.round(74 - s * 50), r: 13 };
  }
  const saludo = (h) => (h >= 6 && h <= 12 ? "Buenos días" : h >= 13 && h <= 20 ? "Buenas tardes" : "Buenas noches");
  const oscurecer = (h) => ([12, 13].includes(h) ? 0.28 : [9, 10, 11, 14, 15].includes(h) ? 0.24 : [8, 16, 17].includes(h) ? 0.18 : 0.12);

  const MOMENTO = (h) => (h <= 4 || h >= 22 ? "noche" : h <= 7 ? "amanecer" : h <= 11 ? "mañana" : h <= 14 ? "mediodía" : h <= 17 ? "tarde" : h <= 20 ? "atardecer" : "noche");
  function paletaEn(h, f) {
    const A = paleta(h), P = mezcla(A, paleta((h + 1) % 24), f);
    return Object.assign(P, { nocturna: A.nocturna, luces: A.luces, pajaros: A.pajaros, estrella: A.estrella });
  }
  const solEn = (h, f) => (deDia(h) === deDia((h + 1) % 24) ? sol(h + f) : sol(h));
  window.Horas = { paleta, paletaEn, sol, solEn, saludo, oscurecer, MOMENTO, deDia };
})();
