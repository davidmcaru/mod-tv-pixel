// tele.js — lo común de las tres pantallas: habla con la app de Android (window.Android) o, en el ordenador, la imita; guarda las apps favoritas y abre los menús de cristal y el panel de opciones.
(function () {
  const A = window.Android || null, q = new URLSearchParams(location.search);
  const PAGINA = location.pathname.split("/").pop().split(".")[0];
  const PAQUETES = {
    "Netflix": "com.netflix.ninja", "Crunchyroll": "com.crunchyroll.crunchyroid", "HBO Max": "com.wbd.stream",
    "Disney+": "com.disney.disneyplus", "YouTube": "com.google.android.youtube.tv", "Prime Video": "com.amazon.amazonvideo.livingroom",
    "VLC": "org.videolan.vlc", "Play Store": "com.android.vending",
  };
  const NOMBRE_DE = Object.fromEntries(Object.entries(PAQUETES).map(([n, p]) => [p, n]));
  const FAVORITAS = ["Netflix", "Crunchyroll", "HBO Max", "Disney+", "YouTube", "Prime Video", "VLC", "Play Store"];
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const MESES = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  if (q.has("salvapantallas")) document.documentElement.classList.add("salvapantallas");

  function ahora() {
    const d = new Date();
    if (q.has("dia")) d.setDate(d.getDate() + ((Number(q.get("dia")) - d.getDay() + 7) % 7));
    if (q.has("h")) d.setHours(Number(q.get("h")), Number(q.get("min") || 0));
    return d;
  }
  const local = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } return null; };
  const BASICO = q.has("salvapantallas") || q.get("graficos") === "basico" || ((A && A.graficos ? A.graficos() : local("modtvpixel.graficos")) === "basico");
  if (BASICO) document.documentElement.classList.add("basico");
  const leer = (clave) => { try { return JSON.parse((A ? A.orden(clave) : local("modtvpixel.orden." + clave)) || "null"); } catch (e) { return null; } };
  const guardar = (clave, lista) => { const j = JSON.stringify(lista); if (A) A.guardarOrden(clave, j); else local("modtvpixel.orden." + clave, j); };
  let ultimas = null, apps = null;
  const manuales = () => { const g = leer("favoritas"); return Array.isArray(g) ? g : [...FAVORITAS]; };
  const abierta = (id) => {
    if (!ultimas) { try { ultimas = JSON.parse((A ? A.ultimas() : local("modtvpixel.ultimas")) || "{}"); } catch (e) { ultimas = {}; } }
    return ultimas[Tele.paquete(id)] || 0;
  };
  const extra = () => ["h", "min", "dia", "usb", "salvapantallas", "graficos"].filter((k) => q.has(k)).map((k) => `${k}=${q.get(k)}`).join("&");
  const on = {};
  const avisar = () => on.favoritas && on.favoritas();

  const EJEMPLO = [["Netflix", "com.netflix.ninja"], ["YouTube", "com.google.android.youtube.tv"], ["YouTube Music", "com.google.android.youtube.tvmusic"],
    ["Disney+", "com.disney.disneyplus"], ["Prime Video", "com.amazon.amazonvideo.livingroom"], ["Max", "com.wbd.stream"], ["Crunchyroll", "com.crunchyroll.crunchyroid"],
    ["VLC", "org.videolan.vlc"], ["Google Play Store", "com.android.vending"], ["Spotify", "com.spotify.tv.android"], ["Twitch", "tv.twitch.android.app"],
    ["Plex", "com.plexapp.android"], ["Kodi", "org.xbmc.kodi"], ["RTVE Play", "com.rtve.androidtv"], ["Movistar Plus+", "es.plus.yomvi"],
    ["Pluto TV", "tv.pluto.android"], ["Filmin", "com.filmin.androidtv"], ["SkyShowtime", "com.skyshowtime.skyshowtime.google"]];
  const dibujos = {};
  function ejemplo(paquete, tipo) {
    const k = tipo + paquete;
    if (dibujos[k]) return dibujos[k];
    const nombre = (EJEMPLO.find((e) => e[1] === paquete) || [paquete])[0], tono = [...nombre].reduce((s, c) => s + c.charCodeAt(0), 0) % 360;
    const c = document.createElement("canvas"), x = c.getContext("2d"), icono = tipo === "icono";
    c.width = icono ? 144 : 320; c.height = icono ? 144 : 180;
    const g = x.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, `hsl(${tono},62%,46%)`); g.addColorStop(1, `hsl(${(tono + 40) % 360},70%,28%)`);
    x.fillStyle = g; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = "#fff"; x.textAlign = "center"; x.textBaseline = "middle";
    x.font = icono ? "700 64px Outfit, sans-serif" : "700 34px Outfit, sans-serif";
    x.fillText(icono ? nombre[0] : nombre, c.width / 2, c.height / 2);
    return (dibujos[k] = c.toDataURL());
  }

  const Tele = {
    on, enLaTele: !!A, pagina: PAGINA,
    intro: q.get("intro"),
    vista: q.get("vista"),
    salvapantallas: q.has("salvapantallas"),
    carrusel: 20000,
    basico: BASICO,
    apagada: () => raiz.classList.contains("apagada"),
    ahora,
    hhmm: (d = ahora()) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`,
    fecha: (d = ahora()) => `${DIAS[d.getDay()]} ${d.getDate()} de ${MESES[d.getMonth()]}`,
    dia: (d = ahora()) => DIAS[d.getDay()],
    diaMes: (d = ahora()) => `${d.getDate()} de ${MESES[d.getMonth()]}`,
    red: () => (A ? A.red() : "MiWifi"),
    pendrive: () => (A ? A.pendrive() : q.get("usb") === "1"),
    diseno: () => (A ? A.diseno() : local("modtvpixel.diseno") || "piratas"),

    apps() {
      if (!apps) { try { apps = A ? JSON.parse(A.apps()) : EJEMPLO.map(([nombre, paquete]) => ({ paquete, nombre, cartel: true })); } catch (e) { apps = []; } }
      return apps;
    },
    imagen: (paquete, tipo = "cartel") => (A ? `https://modtvpixel.local/${tipo}/${paquete}.png` : ejemplo(paquete, tipo)),
    idDe: (paquete) => NOMBRE_DE[paquete] || paquete,
    paquete: (id) => PAQUETES[id] || id,
    conocida: (id) => !!PAQUETES[id],
    nombre(id) {
      if (PAQUETES[id] || ["Switch", "Pendrive", "Más apps"].includes(id)) return id;
      const a = Tele.apps().find((x) => x.paquete === id);
      return a ? a.nombre : id;
    },

    favoritas() {
      const f = manuales();
      if (!Tele.porDias()) return f;
      return [...f.filter((id) => id !== "Play Store").sort((a, b) => abierta(b) - abierta(a)), ...f.filter((id) => id === "Play Store")];
    },
    guardarFavoritas(lista) { guardar("favoritas", lista); },
    porDias: () => leer("modoOrden") === "dias",
    cambiarOrden() {
      const dias = !Tele.porDias();
      guardar("modoOrden", dias ? "dias" : "manual");
      Tele.aviso(`Orden: ${dias ? "Días" : "Manual"}`);
      avisar();
    },
    esFavorita: (id) => manuales().includes(id),
    alternarFavorita(id) {
      const f = manuales(), i = f.indexOf(id);
      if (i >= 0) f.splice(i, 1); else f.push(id);
      Tele.guardarFavoritas(f);
      Tele.aviso(i >= 0 ? `${Tele.nombre(id)}, fuera de favoritas` : `${Tele.nombre(id)}, en favoritas`);
      avisar();
    },
    atajos() { const g = leer("atajos"); return Array.isArray(g) ? g : ["Switch"]; },
    quitarAtajo(n) { guardar("atajos", Tele.atajos().filter((x) => x !== n)); Tele.aviso(`${n}, fuera del inicio · vuelve desde Todas las apps`); avisar(); },
    ponerAtajo(n) { guardar("atajos", [...new Set([n, ...Tele.atajos()])]); Tele.aviso(`${n}, otra vez en el inicio`); avisar(); },

    ultimaVez(id) {
      const t = abierta(id);
      if (!t) return A ? "" : "Hoy a las 20:01";
      const d = new Date(t), hoy = ahora(), dias = Math.round((new Date(hoy.toDateString()) - new Date(d.toDateString())) / 864e5);
      if (dias <= 0) return `Hoy a las ${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
      return `${d.getDate()} de ${MESES[d.getMonth()]} (${dias} ${dias === 1 ? "día" : "días"})`;
    },

    abrir(id) {
      if (id === "Más apps") return Tele.masApps();
      if (id === "Switch") return A ? A.hdmi(1) : Tele.aviso("Aquí se abriría la Switch (HDMI 1)");
      const p = id === "Pendrive" ? PAQUETES.VLC : Tele.paquete(id);
      A ? A.abrir(p) : Tele.aviso(`Aquí se abriría ${Tele.nombre(id)}`);
    },
    info(id) { A ? A.info(Tele.paquete(id)) : Tele.aviso(`Aquí se abriría la info de ${Tele.nombre(id)}`); },
    ajustes() { A ? A.ajustes() : Tele.aviso("Aquí se abrirían los ajustes"); },
    ajustesRed() { A ? A.ajustesRed() : Tele.aviso("Aquí se abrirían los ajustes de red"); },

    cambiar(pagina) {
      if (A) A.guardarDiseno(pagina); else local("modtvpixel.diseno", pagina);
      cerrarTodo();
      raiz.classList.add("saliendo");
      raiz.classList.remove("visible");
      setTimeout(() => location.replace(`${pagina}.html?${extra()}`), SALIDA);
    },
    irA: (pagina, intro) => location.replace(`${pagina}.html?${[intro ? `intro=${intro === true ? 1 : intro}` : "", extra()].filter(Boolean).join("&")}`),
    ponerGraficos(valor) {
      if (A && A.guardarGraficos) A.guardarGraficos(valor); else local("modtvpixel.graficos", valor);
      q.delete("graficos");
      Tele.cambiar(PAGINA);
    },

    aviso(texto) {
      document.querySelectorAll(".aviso").forEach((a) => a.remove());
      const d = document.createElement("div");
      d.className = "aviso"; d.textContent = texto;
      document.body.append(d);
      setTimeout(() => d.classList.add("fuera"), 2200);
      setTimeout(() => d.remove(), 2700);
    },

    menu: null,

    menuApp(id, ancla, o = {}) {
      let items;
      if (id === "Más apps") return;
      if (id === "Switch") items = o.enPanel ? [{ icono: "corazonVacio", texto: "Poner en el inicio", hacer: () => Tele.ponerAtajo("Switch") }]
        : [{ icono: "papelera", texto: "Quitar del inicio", hacer: () => Tele.quitarAtajo("Switch") }];
      else if (id === "Pendrive") items = [{ icono: "expulsar", texto: "Expulsar", hacer: () => Tele.aviso("Para quitarlo, sácalo sin más") }];
      else {
        const fav = Tele.esFavorita(id), dias = Tele.porDias();
        items = [
          ...(o.fija ? [] : [{ icono: fav ? "corazon" : "corazonVacio", texto: fav ? "Quitar Fav" : "Añadir Fav", hacer: () => Tele.alternarFavorita(id) }]),
          ...(o.mover && fav ? [{ icono: "bici", texto: "Mover", hacer: o.mover, apagado: dias },
            { icono: "calendario", texto: `Orden: ${dias ? "Días" : "Manual"}`, sub: "OK para cambiar", hacer: Tele.cambiarOrden }] : []),
          { icono: "mapa", texto: "Info de la app", hacer: () => Tele.info(id) },
        ];
      }
      return listaCristal("menu-app", Tele.nombre(id).toUpperCase(), items, ancla, o.lado);
    },
    opciones(ancla, { solo = false } = {}) {
      const fila = solo ? [ancla] : [...ancla.parentElement.children], a = sitio(fila[0]), z = sitio(fila[fila.length - 1]);
      const hueco = solo ? 20 : Math.round(sitio(fila[1]).x - a.x - a.w), ancho = solo ? 428 : Math.round(z.x + z.w - a.x);
      const lado = Math.floor((ancho - 3 - 4 * hueco) / 3);
      const m = document.createElement("div");
      m.className = "menu-cristal menu-app caja-opciones";
      m.style.cssText = `left:${Math.round(a.x)}px;top:${Math.round(a.y + a.h + hueco)}px;width:${ancho}px;padding:${hueco}px;gap:${hueco}px`;
      m.innerHTML = CASILLAS.map((c) => {
        const { w, h } = Objetos.tam(c.obj), esc = Math.floor((lado * 0.84) / Math.max(w, h));
        return `<div class="co-casilla${c.pagina === PAGINA ? " ahora" : ""}"><canvas class="obj" data-obj="${c.obj}" data-esc="${esc}"></canvas></div>`;
      }).join("") + '<b class="co-titulo">GRÁFICOS</b><div class="co-graficos">' +
        GRAFICOS.map((g) => `<div class="co-op${(g.valor === "basico") === BASICO ? " ahora" : ""}">${g.nombre}</div>`).join("") + "</div>";
      document.body.append(m);
      Atajos.pintar();
      const els = [...m.querySelectorAll(".co-casilla, .co-op")];
      let i = Math.max(0, CASILLAS.findIndex((c) => c.pagina !== PAGINA));
      const marcar = () => els.forEach((el, j) => el.classList.toggle("foco", j === i));
      marcar();
      const yo = {
        tecla(k) {
          if (i >= 3) {
            if (k === "ArrowRight" && i === 3) i = 4;
            else if (k === "ArrowLeft" && i === 4) i = 3;
            else if (k === "ArrowUp") i = i === 3 ? 0 : 2;
            else return;
          } else if (k === "ArrowRight" && i % 3 < 2) i++;
          else if (k === "ArrowLeft" && i % 3 > 0) i--;
          else if (k === "ArrowDown") i = i === 0 ? 3 : i === 2 ? 4 : BASICO ? 3 : 4;
          else return;
          marcar();
        },
        ok() {
          if (i >= 3) {
            const { valor } = GRAFICOS[i - 3];
            yo.cerrar();
            if ((valor === "basico") !== BASICO) Tele.ponerGraficos(valor);
            return;
          }
          const { pagina } = CASILLAS[i];
          yo.cerrar();
          if (pagina !== PAGINA) Tele.cambiar(pagina);
        },
        cerrar() { m.remove(); quitar(yo); },
        elegir(n) { i = n; marcar(); },
      };
      return poner(yo);
    },
    entradas(ancla) {
      const lista = A ? JSON.parse(A.entradas()) : [{ id: "h1", nombre: "HDMI 1" }, { id: "h2", nombre: "HDMI 2" }, { id: "h3", nombre: "HDMI 3" }, { id: "av", nombre: "AV" }];
      if (!lista.length) return Tele.aviso("No encuentro las entradas");
      return listaCristal("entradas", "ENTRADAS", lista.map((e) => ({ texto: e.nombre, sub: /hdmi\s*1\b/i.test(e.nombre) || /HW4$/.test(e.id) ? "la Switch" : "",
        hacer: () => (A ? A.entrada(e.id) : Tele.aviso(`Aquí se abriría ${e.nombre}`)) })), ancla, "abajo");
    },

    masApps() {
      const items = [...(Tele.atajos().includes("Switch") ? [] : [{ id: "Switch", nombre: "Switch" }]),
        ...Tele.apps().map((a) => ({ id: Tele.idDe(a.paquete), nombre: a.nombre, paquete: a.paquete }))];
      const m = document.createElement("div");
      m.className = "todas";
      m.innerHTML = `<div class="ta-panel"><div class="ta-cab"><b class="ta-titulo">TODAS LAS APPS <span>${items.length}</span></b></div><div class="ta-ventana"><div class="ta-rejilla">` +
        items.map((a, i) => `<div class="ta-app${i ? "" : " foco"}" data-id="${a.id}"><span class="ta-cartel">` +
          (a.id === "Switch" ? '<i class="ta-sw"></i>' : `<img data-src="${Tele.imagen(a.paquete)}" alt="">`) +
          `</span><span class="ta-nom">${a.nombre}</span><canvas class="obj ta-fav" data-obj="corazon" data-esc="2"></canvas></div>`).join("") +
        '</div></div><div class="ta-pista">OK, abrirla · manteniendo OK, sus opciones · Atrás, cerrar</div></div>';
      document.body.append(m);
      Atajos.pintar();
      const panel = m.querySelector(".ta-panel"), copia = copiaDesenfocada();
      if (copia) {
        const s = sitio(panel);
        copia.className = "ta-fondo"; copia.style.left = -Math.round(s.x) + "px"; copia.style.top = -Math.round(s.y) + "px";
        panel.prepend(copia); panel.classList.add("ta-copia");
      }
      const els = [...m.querySelectorAll(".ta-app")], rejilla = m.querySelector(".ta-rejilla"), COL = 5;
      const fila = els.length > COL ? els[COL].offsetTop - els[0].offsetTop : 0;
      let cargados = 0;
      const cargar = (hasta) => {
        for (; cargados < Math.min(els.length, hasta); cargados++) { const img = els[cargados].querySelector("img[data-src]"); if (img) { img.src = img.dataset.src; img.removeAttribute("data-src"); } }
      };
      cargar(COL * 4);
      const marcarFav = () => els.forEach((el) => el.classList.toggle("favorita", el.dataset.id === "Switch" ? false : Tele.esFavorita(el.dataset.id)));
      marcarFav();
      let i = 0;
      const mover = (n) => {
        i = Math.max(0, Math.min(els.length - 1, n));
        els.forEach((el, j) => el.classList.toggle("foco", j === i));
        rejilla.style.transform = `translateY(${-Math.max(0, Math.floor(i / COL) - 1) * fila}px)`;
        cargar((Math.floor(i / COL) + 3) * COL);
      };
      const yo = {
        tecla(k) {
          if (k === "ArrowRight" && i % COL < COL - 1) mover(i + 1);
          if (k === "ArrowLeft" && i % COL > 0) mover(i - 1);
          if (k === "ArrowDown" && i + COL < els.length) mover(i + COL);
          if (k === "ArrowUp" && i >= COL) mover(i - COL);
        },
        ok() {
          const id = els[i].dataset.id;
          yo.cerrar();
          Tele.abrir(id);
        },
        okLargo() { Tele.menuApp(els[i].dataset.id, els[i].querySelector(".ta-cartel"), { enPanel: true, lado: "alineado" }); },
        cerrar() { if (copia) copia.remove(); m.remove(); quitar(yo); },
        alCambiar: marcarFav,
        elegir: mover,
        elementos: els,
      };
      return poner(yo);
    },
  };

  const pila = [];
  function poner(m) { if (Tele.menu) pila.push(Tele.menu); Tele.menu = m; return m; }
  function quitar(m) {
    if (Tele.menu === m) Tele.menu = pila.pop() || null;
    else { const k = pila.indexOf(m); if (k >= 0) pila.splice(k, 1); }
  }
  function cerrarTodo() {
    for (let n = 0; Tele.menu && n < 20; n++) { const m = Tele.menu; m.cerrar(); if (Tele.menu === m) quitar(m); }
    pila.length = 0; Tele.menu = null;
  }
  const JUNTA = document.createElement("canvas"), COPIA = document.createElement("canvas");
  function escenaDesenfocada(c, radio) {
    const escena = document.getElementById("escena");
    if (!escena) return false;
    const W = 320, H = 180, capa = escena.parentElement, junta = JUNTA, j = junta.getContext("2d");
    junta.width = W; junta.height = H;
    [...capa.querySelectorAll("canvas")].forEach((l) => {
      const st = getComputedStyle(l);
      if (!l.width || st.visibility === "hidden" || st.display === "none") return;
      j.globalAlpha = Number(st.opacity); j.drawImage(l, 0, 0, W, H);
    });
    const x = c.getContext("2d"), m = 2 * radio;
    c.width = W; c.height = H;
    x.filter = `blur(${radio}px)`; x.drawImage(junta, -m, -m * 0.625, W + 2 * m, H + 1.25 * m); x.filter = "none";
    for (let s = capa.nextElementSibling; s && s.classList.contains("capa"); s = s.nextElementSibling) {
      if (s.classList.contains("velo")) {
        const g1 = x.createLinearGradient(0, 0, W, 0), g2 = x.createLinearGradient(0, H, 0, 0);
        [[0, 0.58], [0.34, 0.26], [0.56, 0], [1, 0]].forEach(([p, a]) => g1.addColorStop(p, `rgba(0,0,0,${a})`));
        [[0, 0.3], [0.26, 0], [1, 0]].forEach(([p, a]) => g2.addColorStop(p, `rgba(0,0,0,${a})`));
        x.fillStyle = g1; x.fillRect(0, 0, W, H); x.fillStyle = g2; x.fillRect(0, 0, W, H);
      } else { x.globalAlpha = Number(getComputedStyle(s).opacity); x.fillStyle = "#000"; x.fillRect(0, 0, W, H); x.globalAlpha = 1; }
    }
    return true;
  }
  function copiaDesenfocada() {
    const c = COPIA;
    if (!escenaDesenfocada(c, 4)) return null;
    const x = c.getContext("2d");
    x.fillStyle = "rgba(4, 6, 12, 0.35)"; x.fillRect(0, 0, 320, 180);
    x.fillStyle = "rgba(22, 24, 38, 0.45)"; x.fillRect(0, 0, 320, 180);
    return c;
  }

  const CRISTALES = ".botones .boton, .elegida, .losa, .debajo .etiqueta", CRISTAL = document.createElement("canvas");
  let urlCristal = null, haciendo = false, otraVez = false;
  function colocarCristal() {
    if (!urlCristal) return;
    document.querySelectorAll(CRISTALES).forEach((el) => {
      const s = sitio(el), k = s.w / (el.offsetWidth || s.w) || 1, px = (v) => Math.round(v / k) + "px";
      el.style.setProperty("--cx", px(-s.x)); el.style.setProperty("--cy", px(-s.y));
      el.style.setProperty("--cw", px(1920)); el.style.setProperty("--ch", px(1080));
    });
  }
  async function cristal() {
    if (Tele.salvapantallas) return;
    if (haciendo) { otraVez = true; return; }
    if (!escenaDesenfocada(CRISTAL, 2)) return;
    haciendo = true;
    try {
      const b = await new Promise((r) => CRISTAL.toBlob(r, "image/jpeg", 0.92));
      if (!b) return;
      const url = URL.createObjectURL(b), img = new Image();
      img.src = url;
      await img.decode();
      const vieja = urlCristal;
      urlCristal = url;
      colocarCristal();
      raiz.style.setProperty("--copia", `url("${url}")`);
      raiz.classList.add("cristal-quieto");
      if (vieja) setTimeout(() => URL.revokeObjectURL(vieja), 3000);
    } catch (e) {
    } finally {
      haciendo = false;
      if (otraVez) { otraVez = false; cristal(); }
    }
  }
  Tele.cristal = cristal;
  Tele.colocarCristal = colocarCristal;
  const dibujo = (id, esc = 3) => (Objetos.foco(id) ? `<canvas class="obj en-foco" data-obj="${id}" data-esc="${esc}" data-foco></canvas>` : "") +
    `<canvas class="obj" data-obj="${id}" data-esc="${esc}"></canvas>`;
  function sitio(el) {
    const r = el.getBoundingClientRect(), b = document.body.getBoundingClientRect(), k = b.width / 1920 || 1;
    return { x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k };
  }
  const CASILLAS = [{ obj: "piratas", pagina: "piratas" }, { obj: "ninjas", pagina: "ninjas" }, { obj: "magos", pagina: "magos" }];
  const GRAFICOS = [{ valor: "basico", nombre: "Básico" }, { valor: "detallado", nombre: "Detallado" }];
  function listaCristal(clase, titulo, items, ancla, lado) {
    const m = document.createElement("div");
    m.className = "menu-cristal " + clase + (lado === "alineado" ? " alineado" : "");
    m.innerHTML = (titulo ? `<b class="mc-titulo">${titulo}</b>` : "") + items.map((it) => `<div class="mc-item${it.apagado ? " apagado" : ""}">${it.icono ? `<i class="mc-ico">${dibujo(it.icono)}</i>` : ""}` +
      `<span>${it.texto}${it.sub ? `<small>${it.sub}</small>` : ""}</span></div>`).join("");
    document.body.append(m);
    Atajos.pintar();
    const r = ancla ? sitio(ancla) : { x: 960, y: 400, w: 0, h: 0 };
    if (lado === "alineado") m.style.height = Math.round(r.h) + "px";
    const w = m.offsetWidth, h = m.offsetHeight, hueco = 22;
    let x, y;
    if (lado === "abajo") { x = r.x + r.w - w; y = r.y + r.h + hueco; }
    else { x = r.x + r.w + w + hueco <= 1880 ? r.x + r.w + hueco : r.x - w - hueco; y = r.y + r.h / 2 - h / 2; }
    m.style.left = Math.round(Math.max(40, Math.min(1880 - w, x))) + "px";
    m.style.top = Math.round(Math.max(40, Math.min(1040 - h, y))) + "px";
    const els = [...m.querySelectorAll(".mc-item")];
    let i = 0;
    const marcar = () => els.forEach((el, j) => el.classList.toggle("foco", j === i));
    marcar();
    const yo = {
      tecla(k) {
        const paso = k === "ArrowDown" ? 1 : k === "ArrowUp" ? els.length - 1 : 0;
        if (!paso) return;
        for (let n = 1; n < els.length; n++) { const j = (i + paso * n) % els.length; if (!items[j].apagado) { i = j; break; } }
        marcar();
      },
      ok() {
        const it = items[i];
        yo.cerrar();
        if (it.hacer) it.hacer();
        if (Tele.menu && Tele.menu.alCambiar) Tele.menu.alCambiar();
      },
      cerrar() { m.remove(); quitar(yo); },
      elegir(n) { i = n; marcar(); },
    };
    return poner(yo);
  }

  const raiz = document.documentElement, DIA = ahora().getDay(), SALIDA = 250;
  const aparecer = () => requestAnimationFrame(() => requestAnimationFrame(() => raiz.classList.add("visible")));
  document.addEventListener("DOMContentLoaded", () => document.fonts.ready.then(aparecer));
  function encendida() {
    if (!Tele.apagada()) return;
    if (ahora().getDay() !== DIA) return Tele.irA(PAGINA, true);
    raiz.classList.remove("apagada");
    if (on.encender) on.encender();
    aparecer();
  }
  if (q.get("vista")) document.addEventListener("DOMContentLoaded", () => document.fonts.ready.then(() => setTimeout(() => on.vista && on.vista(q.get("vista")), 120)));

  let pulsado = null;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" || e.key === "Backspace") { e.preventDefault(); window.alAtras(); return; }
    if (e.key === "Enter") {
      e.preventDefault(); e.stopImmediatePropagation();
      if (e.repeat || pulsado) return;
      pulsado = setTimeout(() => {
        pulsado = "largo";
        if (!Tele.menu) document.dispatchEvent(new Event("okLargo"));
        else if (Tele.menu.okLargo) Tele.menu.okLargo();
      }, 600);
      return;
    }
    if (Tele.menu) { e.preventDefault(); e.stopImmediatePropagation(); Tele.menu.tecla(e.key); }
  }, true);
  document.addEventListener("keyup", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    const largo = pulsado === "largo";
    if (pulsado && !largo) clearTimeout(pulsado);
    pulsado = null;
    if (largo) return;
    if (Tele.menu) Tele.menu.ok(); else document.dispatchEvent(new Event("okCorto"));
  }, true);
  window.alAtras = () => { if (Tele.menu) Tele.menu.cerrar(); else if (on.atras) on.atras(); };
  window.alPendrive = (si) => on.pendrive && on.pendrive(!!si);
  window.alEncender = encendida;
  window.alApagar = () => { window.alInicio(); raiz.classList.add("apagada"); raiz.classList.remove("visible"); if (window.Vivo) Vivo.parar(); };
  window.alVolver = () => { encendida(); ultimas = null; apps = null; if (on.volver) on.volver(); };
  window.alInicio = () => { cerrarTodo(); if (on.inicio) on.inicio(); };
  window.alAviso = (t) => Tele.aviso(t);
  window.Tele = Tele;
})();
