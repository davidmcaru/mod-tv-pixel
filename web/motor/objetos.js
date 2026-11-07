// objetos.js — los dibujos pequeños: los iconos de los botones de arriba y los de cada saga en el panel de opciones.
(function () {
  const O = {
    switch: {
      c: { K: "#202020", R: "#ff4554", D: "#c8283a", B: "#00c3e3", E: "#0089a8", S: "#4a4a56", P: "#1d2230", H: "#7a8cb4" },
      m: [
        ".KKKKKKKKKKKKKKKK.",
        "KRRRKSSSSSSSSKBBBK",
        "KRKRKSPPPPPPSKBKBK",
        "KRRRKSPHHPPPSKBBBK",
        "KRRRKSPHPPPPSKBBBK",
        "KRRRKSPPPPPPSKBBBK",
        "KRKRKSPPPPPPSKBKBK",
        "KRRRKSPPPPPPSKBBBK",
        "KDDDKSSSSSSSSKEEEK",
        ".KKKKKKKKKKKKKKKK.",
      ],
    },
    pendrive: {
      c: { K: "#202020", B: "#6a4ad0", L: "#a48cf4", D: "#46309e", M: "#c8ccd8", N: "#8e94a6" },
      m: [
        ".KKKKKKKKKKK......",
        "KBBBBBBBBBBK......",
        "KBLLBBBBBBBKKKKKK.",
        "KBLBBBBBBBBKMMMMMK",
        "KBBBBBBBBBBKMKKMNK",
        "KBBBBBBBBBBKNNNNNK",
        "KDDDDDDDDDDKKKKKK.",
        ".KKKKKKKKKKK......",
      ],
    },
    apps: {
      c: { K: "#202020", R: "#ff3b47", Y: "#ffd23f", G: "#36d17a", B: "#3a9bff", L: "#ffffff" },
      m: [
        "KKKKKKK..KKKKKKK",
        "KRLRRRK..KYLYYYK",
        "KRRRRRK..KYYYYYK",
        "KRRRRRK..KYYYYYK",
        "KRRRRRK..KYYYYYK",
        "KRRRRRK..KYYYYYK",
        "KKKKKKK..KKKKKKK",
        "................",
        "................",
        "KKKKKKK..KKKKKKK",
        "KGLGGGK..KBLBBBK",
        "KGGGGGK..KBBBBBK",
        "KGGGGGK..KBBBBBK",
        "KGGGGGK..KBBBBBK",
        "KGGGGGK..KBBBBBK",
        "KKKKKKK..KKKKKKK",
      ],
    },
    corazon: {
      c: { K: "#202020", R: "#e8283c", D: "#a3182a", W: "#ffffff" },
      m: [
        "..KKKK...KKKK...",
        ".KRRRRK.KRRRRK..",
        "KRWWRRRKRRRRRDK.",
        "KRWRRRRRRRRRRDK.",
        "KRRRRRRRRRRRRDK.",
        "KRRRRRRRRRRRDDK.",
        ".KRRRRRRRRRRDK..",
        "..KRRRRRRRRDK...",
        "...KRRRRRRDK....",
        "....KRRRRDK.....",
        ".....KRRDK......",
        "......KDK.......",
        ".......K........",
      ],
    },
    mapa: {
      c: { K: "#202020", B: "#3a8ad0", G: "#58b040", D: "#1f5a8a", R: "#e8283c" },
      m: [
        ".KKKKKKKKKKKKKK.",
        "KBBBBDGGGGDBBBBK",
        "KBBGGDGGGGDGBBBK",
        "KBGGGDGGRGDGGBBK",
        "KBGGGDGRRRDGGBBK",
        "KBBGGDGGRGDGGGBK",
        "KBBBGDGGGGDGGGBK",
        "KBBBBDBGGGDGGBBK",
        "KBBBBDBBGGDGBBBK",
        "KBGGBDBBBBDBBBBK",
        "KBGGBDBBBBDBBGBK",
        "KBBBBDBBBBDBBBBK",
        ".KKKKKKKKKKKKKK.",
      ],
    },
    libro: {
      c: { K: "#202020", R: "#e8283c", D: "#a3182a", W: "#f4f4f4" },
      m: [
        ".KKKKKKKKKKKK...",
        "KDRRRRRRRRRRRK..",
        "KDRRRRRRRRRRRK..",
        "KDRRRRKKKRRRRK..",
        "KDRRRKWWWKRRRK..",
        "KDRRKWWKWWKRRK..",
        "KDRRKKKKKKKRRK..",
        "KDRRKWWKWWKRRK..",
        "KDRRRKWWWKRRRK..",
        "KDRRRRKKKRRRRK..",
        "KDRRRRRRRRRRRK..",
        "KDRRRRRRRRRRRK..",
        "KDWWWWWWWWWWWK..",
        ".KKKKKKKKKKKKK..",
      ],
    },
    entradas: {
      c: { W: "#ffffff" },
      m: [
        ".WWWWWWWWWWWWWW.",
        ".W............W.",
        ".W.....W......W.",
        ".W......W.....W.",
        "WWWWWWWWWW....W.",
        ".W......W.....W.",
        ".W.....W......W.",
        ".W............W.",
        ".WWWWWWWWWWWWWW.",
        "......WWWW......",
        "....WWWWWWWW....",
      ],
    },
    wifi: {
      c: { W: "#ffffff" },
      m: [
        "....WWWWWWWW....",
        "..WW........WW..",
        ".W....WWWW....W.",
        "....WW....WW....",
        "...W...WW...W...",
        "......W..W......",
        "................",
        ".......WW.......",
        ".......WW.......",
      ],
    },
    cable: {
      c: { W: "#ffffff" },
      m: [
        "WWWWWWWWWWWW",
        "W..........W",
        "W.WWWWWWWW.W",
        "W.W......W.W",
        "W.W......W.W",
        "W.WWW..WWW.W",
        "W...WWWW...W",
        "W..........W",
        "WWWWWWWWWWWW",
      ],
    },
    cartucho: {
      c: { W: "#ffffff" },
      m: [
        "WWWWWWWWWWW.",
        "W.........WW",
        "W.WWWWWWW..W",
        "W.W.....W..W",
        "W.W.....W..W",
        "W.W.....W..W",
        "W.WWWWWWW..W",
        "W..........W",
        "W..W.W.W.W.W",
        "WWWWWWWWWWWW",
      ],
    },
    antena: {
      c: { W: "#ffffff" },
      m: [
        "W..........W",
        ".W........W.",
        "..W......W..",
        "...W....W...",
        "....W..W....",
        ".....WW.....",
        "...WWWWWW...",
        "..W......W..",
        "..W......W..",
        "..WWWWWWWW..",
      ],
    },
    llave: {
      c: { W: "#ffffff" },
      m: [
        ".........WW.",
        "........W..W",
        "........W.W.",
        ".......W..W.",
        "......W.WW..",
        ".....W.W....",
        "....W.W.....",
        "...W.W......",
        "..W.W.......",
        ".WW.W.......",
        "W..W........",
        ".WW.........",
      ],
    },
    papelera: {
      c: { W: "#ffffff" },
      foco: { W: "#26262c" },
      m: [
        "....WWWW....",
        "WWWWWWWWWWWW",
        "............",
        ".WWWWWWWWWW.",
        ".W..W..W..W.",
        ".W..W..W..W.",
        ".W..W..W..W.",
        ".W..W..W..W.",
        ".W..W..W..W.",
        ".WWWWWWWWWW.",
      ],
    },
    menu: {
      c: { W: "#ffffff" },
      foco: { W: "#26262c" },
      m: [
        "WWWWWWWWWWWWWW",
        "WWWWWWWWWWWWWW",
        "..............",
        "..............",
        "WWWWWWWWWWWWWW",
        "WWWWWWWWWWWWWW",
        "..............",
        "..............",
        "WWWWWWWWWWWWWW",
        "WWWWWWWWWWWWWW",
      ],
    },
    calendario: {
      c: { K: "#26262c", R: "#e8283c", W: "#f4efe0", D: "#55565f" },
      m: [
        "...KK....KK...",
        "...KK....KK...",
        ".KKKKKKKKKKKK.",
        ".KRRRRRRRRRRK.",
        ".KRRRRRRRRRRK.",
        ".KKKKKKKKKKKK.",
        ".KWWWWWWWWWWK.",
        ".KWDDWDDWDDWK.",
        ".KWDDWDDWDDWK.",
        ".KWWWWWWWWWWK.",
        ".KWDDWDDWWWWK.",
        ".KWDDWDDWWWWK.",
        ".KWWWWWWWWWWK.",
        ".KKKKKKKKKKKK.",
      ],
    },
    expulsar: {
      c: { W: "#ffffff" },
      foco: { W: "#26262c" },
      m: [
        ".....WW.....",
        "....WWWW....",
        "...WWWWWW...",
        "..WWWWWWWW..",
        ".WWWWWWWWWW.",
        "WWWWWWWWWWWW",
        "............",
        "WWWWWWWWWWWW",
        "WWWWWWWWWWWW",
      ],
    },
  };
  O.bici = (() => {
    const W = 16, H = 13, g = Array.from({ length: H }, () => Array(W).fill("."));
    const p = (x, y, ch) => { if (x >= 0 && x < W && y >= 0 && y < H) g[y][x] = ch; };
    const linea = (x0, y0, x1, y1, ch) => {
      const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
      for (let i = 0; i <= n; i++) p(Math.round(x0 + ((x1 - x0) * i) / n), Math.round(y0 + ((y1 - y0) * i) / n), ch);
    };
    const rueda = (cx, cy) => {
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const d = Math.hypot(x - cx, y - cy); if (d > 2.4 && d < 3.5) p(x, y, "W"); }
      p(Math.round(cx), Math.round(cy), "W");
    };
    rueda(3.5, 9); rueda(12, 9);
    linea(4, 9, 6, 5, "R"); linea(6, 5, 8, 9, "R"); linea(8, 9, 11, 5, "R"); linea(6, 5, 11, 5, "R"); linea(11, 5, 12, 9, "W");
    linea(5, 3, 7, 3, "W"); linea(6, 3, 6, 4, "W"); linea(11, 2, 11, 4, "W"); linea(10, 2, 13, 2, "W");
    return { c: { W: "#f0f0f6", R: "#e8283c" }, foco: { W: "#34343c" }, m: g.map((f) => f.join("")) };
  })();
  O.corazonVacio = (() => {
    const m = O.corazon.m, H = m.length, W = m[0].length, dentro = (x, y) => y >= 0 && y < H && x >= 0 && x < W && "RWD".includes(m[y][x]);
    const borde = (x, y) => [[1, 0], [-1, 0], [0, 1], [0, -1], [2, 0], [-2, 0], [0, 2], [0, -2], [1, 1], [-1, 1], [1, -1], [-1, -1]].some(([dx, dy]) => !dentro(x + dx, y + dy));
    return { c: { K: "#202020", R: "#e8283c" }, m: m.map((f, y) => [...f].map((ch, x) => (ch === "K" ? "K" : dentro(x, y) && borde(x, y) ? "R" : ".")).join("")) };
  })();
  const rejilla = (w, h, f) => ({ c: { W: "#ffffff" }, m: Array.from({ length: h }, (_, y) => Array.from({ length: w }, (_, x) => (f(x, y) ? "W" : ".")).join("")) });
  const entre = (a, x, b) => x >= a && x <= b;
  O.entradasG = rejilla(21, 15, (x, y) => (entre(3, x, 20) && entre(0, y, 11) && !(entre(5, x, 18) && entre(2, y, 9))) ||
    (entre(0, x, 11) && entre(5, y, 6)) || (entre(8, x, 9) && entre(3, y, 8)) || (entre(10, x, 11) && entre(4, y, 7)) || (x === 12 && entre(5, y, 6)) ||
    (entre(9, x, 14) && y === 12) || (entre(7, x, 16) && entre(13, y, 14)));
  O.wifiG = rejilla(21, 17, (x, y) => {
    const dx = x - 10, dy = y - 15, d = Math.hypot(dx, dy), ang = Math.abs(Math.atan2(dx, -dy));
    return d <= 2.3 || (ang <= 0.82 && [[4.6, 6.8], [9, 11.2], [13.2, 15.6]].some(([a, b]) => d >= a && d <= b));
  });
  O.ajustesG = rejilla(21, 21, (x, y) => {
    const dx = x - 10, dy = y - 10, d = Math.hypot(dx, dy);
    return d >= 4 && d <= (Math.cos(Math.atan2(dy, dx) * 8) > 0.15 ? 10.6 : 7.8);
  });
  O.menuG = rejilla(21, 15, (x, y) => entre(0, y, 2) || entre(6, y, 8) || entre(12, y, 14));
  O.piratas = {
    c: {"Ā": "#1b1b1f", "ā": "#f5d36f", "Ă": "#c2a03c", "ă": "#f2c84b", "Ą": "#a17826", "ą": "#e04f55", "Ć": "#ad1c22", "ć": "#c5a180", "Ĉ": "#f8d4b3", "ĉ": "#f6c9a0", "Ċ": "#914532", "ċ": "#ffffff", "Č": "#9b191e", "č": "#d8232a"},
    m: [
      ".......ĀĀĀĀĀĀĀĀ.......",
      ".....ĀĀāāĂāāāāĂĀĀ.....",
      "....ĀāĂăĂĄāăăĂăāĂĀ....",
      "...ĀāĂĄāăĂăăĂĄāăĂĂĀ...",
      "...ĀĂĂĂĂĂĄĂĂĂĂĂĂĄĂĀ...",
      "...ĀąąąąąąąąąąąąąĆĀ...",
      "...ĀĆĆĆĆĆĆĆĆĆĆĆĆĆĆĀ...",
      ".ĀĀĀāĂāāāāĂāāāāĂāĂĀĀĀ.",
      "ĀĂĂāĂĄāăăĂĄāăăĂĄāăāĂĂĀ",
      "ĀĄĄĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĂĄĄĀ",
      ".ĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀĀ.",
      "...ĀĀĀćĀĀĀĈćĀĀĀćĀĀĀ...",
      "...ĀĀĈććĈĈĉĉĈĈćććĀĀ...",
      "...ĀĈćĀĀćĉĉĉĉćĀĀććĀ...",
      "...ĀćĀĈćĀĈĉĉćĀĈćĀćĀ...",
      "...ĀĈĈĉĉĈĉĉĉĉĈćĊĊćĀ...",
      "...ĀĈćććććććććććććĀ...",
      "...ĀćĀĀĀĀĀĀĀĀĀĀĀĀćĀ...",
      "...ĀćĀċċċċċċċċċċĀćĀ...",
      "....ĀĀČČČČČČČČČČĀĀ....",
      ".....ĀĀĀĀĀĀĀĀĀĀĀĀ.....",
      "....ĀąĆĀĀĈĈĈćĀĀąĆĀ....",
      "...ĀąččĆĀćĉĉćĀąččĆĀ...",
      "...ĀĆĆĆĆĆĀććĀĆĆĆĆĆĀ...",
    ],
  };
  O.ninjas = {
    c: {"Ā": "#1b1b1f", "ā": "#c6a832", "Ă": "#f9db65", "ă": "#f7d23e", "Ą": "#ae841a", "ą": "#5565a5", "Ć": "#223272", "ć": "#d6dbe3", "Ĉ": "#a3a8b0", "ĉ": "#ccd2dc", "Ċ": "#59606d", "ċ": "#8c93a0", "Č": "#f8d4b3", "č": "#c5a180", "Ď": "#f6c9a0", "ď": "#ffffff", "Đ": "#2a6fdb", "đ": "#86604a", "Ē": "#f7964c", "ē": "#c46319", "Ĕ": "#a14c0e"},
    m: [
      ".........Ā..Ā.........",
      ".....Ā..ĀāĀĀāĀ..Ā.....",
      "....ĀāĀĀĂăĂĂăāĀĀāĀ....",
      "..Ā.ĀĂĂāăăăăāăĂĂāĀ.Ā..",
      ".ĀāĀĂăāĄĂăăāĄĂăăăāĀāĀ.",
      "ĀāāāāāāāāāāāāāāāāāāāāĀ",
      "..ĀąąĆĆĆĆĆĆĆĆĆĆĆĆąĆĀ..",
      "..ĀąĆćććĈĈĈĈĈćććĈąĆĀ..",
      "..ĀąĆćĉĈĊĊĊċĊćĉĉĈąĆĀ..",
      "..ĀąĆĈĈĈĈĈĈĊĊĈĈĈĈąĆĀ..",
      "..ĀĆĆĆĆĆĆĆĆĆĆĆĆĆĆĆĆĀ..",
      ".ĀāāČČČČČČČČČČČČČčĂāĀ.",
      "..ĀāČčččĎĎĎĎĎĎččččāĀ..",
      "...ĀčďĐďČĎĎĎĎčďĐďčĀ...",
      "...ĀčďĀďČĎĎĎĎčďĀďčĀ...",
      "..ĀĀđđČČĎĎĎĎĎĎČčđđĀĀ..",
      "..ĀČččĎĎĎĎĎĎĎĎĎĎčččĀ..",
      "..ĀčđđČčĎĎĎĎĎĎččđđčĀ..",
      "...ĀĀČčĀččččččĀČčĀĀ...",
      "...ĀččĎčĀĀĀĀĀĀČĎččĀ...",
      "....ĀĀččČČČČČČččĀĀ....",
      "....ĀĀĀĀčĎĎĎĎčĀĀĀĀ....",
      "...ĀĒēĀĀĀČĎĎčĀĀĀĒēĀ...",
      "..ĀēēēĔēĀččččĀēĔēēēĀ..",
    ],
  };
  O.magos = {
    c: {"Ā": "#1b1b1f", "ā": "#221b26", "Ă": "#554e59", "ă": "#3b324a", "Ą": "#2a2230", "ą": "#c5a180", "Ć": "#f8d4b3", "ć": "#f6c9a0", "Ĉ": "#9a2e22", "ĉ": "#ffffff", "Ċ": "#a54a4e", "ċ": "#72171b", "Č": "#e9c163", "č": "#b68e30"},
    m: [
      ".....ĀĀĀĀĀĀĀĀĀĀ.....",
      "...ĀĀāĂĂĂĂĂĂāĂāĀĀ...",
      "..ĀĂāăĂĄāĄĄāăĂĄāāĀ..",
      ".ĀĂĄāĂĄāăĂĄĄĂāāăĂāĀ.",
      "ĀĂĄāăĂĄĄĂĄĄĄāăĂĂĄĄāĀ",
      "ĀāĄĄāĄĄĄāāĄĄāāĄĄāĄāĀ",
      ".ĀĂāąāāāĆąāāĆąāāąāĀ.",
      ".ĀāĆćĆĆĆąĈĆĆććĆĆąāĀ.",
      ".ĀĆćąąąąĈĈĆćąąąąćąĀ.",
      ".ĀĆąĀĀĀĀąĈĆąĀĀĀĀąąĀ.",
      ".ĀąĀĉĉĉĉĀąąĀĉĉĉĉĀąĀ.",
      ".ĀĀĀĉĀĀĉĀĀĀĀĉĀĀĉĀĀĀ.",
      ".ĀąĀĉĀĀĉĀĆąĀĉĀĀĉĀąĀ.",
      ".ĀąĀĉĉĉĉĀĆąĀĉĉĉĉĀąĀ.",
      ".ĀąąĀĀĀĀĆććąĀĀĀĀĆąĀ.",
      "..ĀĆĆĆĆąąąąąąĆĆĆąĀ..",
      "..ĀąććąĀĀĀĀĀĀĆććąĀ..",
      "...ĀąąćĆĆĆĆĆĆćąąĀ...",
      "....ĀĀąąąąąąąąĀĀ....",
      "...ĀĊċČčĊċČčĊċČčĀ...",
      "..ĀċċččċċččċċččċċĀ..",
      "..ĀččċċččċċččċċččĀ..",
      "...ĀĀĀĀĀĀĀĀĀĀĀĀĀĀ...",
    ],
  };
  function pintar(ctx, id, x, y, colores) {
    const o = O[id], c = { ...o.c, ...(colores || {}) };
    o.m.forEach((fila, j) => [...fila].forEach((ch, i) => { if (c[ch]) { ctx.fillStyle = c[ch]; ctx.fillRect(x + i, y + j, 1, 1); } }));
  }
  const tam = (id) => ({ w: O[id].m[0].length, h: O[id].m.length });
  const foco = (id) => (O[id] && O[id].foco) || null;
  const sumar = (id, dibujo) => { O[id] = dibujo; };
  function canvas(id, escala = 4, colores) {
    const { w, h } = tam(id), c = document.createElement("canvas");
    c.width = w; c.height = h;
    pintar(c.getContext("2d"), id, 0, 0, colores);
    c.className = "objeto"; c.style.width = w * escala + "px"; c.style.height = h * escala + "px"; c.style.imageRendering = "pixelated";
    return c;
  }
  window.Objetos = { pintar, tam, canvas, foco, sumar };
})();
