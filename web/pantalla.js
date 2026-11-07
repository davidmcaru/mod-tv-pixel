// pantalla.js — la pantalla de inicio de cada saga: el escenario de esta hora, la rueda de apps, los botones de arriba y el mando; de salvapantallas, un carrusel por las horas de la semana.
(function () {
  const q = new URLSearchParams(location.search), $ = (s) => document.querySelector(s);
  const nuevo = (clase) => { const c = document.createElement("canvas"); if (clase) c.className = clase; return c; };
  const espera = (ms) => new Promise((r) => setTimeout(r, ms));
  const opacidad = (el, v, s) => { el.style.transition = s ? `opacity ${s}s ease` : "none"; el.style.opacity = v; };
  let dia = Tele.ahora().getDay(), h = Tele.ahora().getHours(), min = Tele.ahora().getMinutes(), o = Mundo.foco(dia, h, min), usb = Tele.pendrive();
  const franja = (d) => (Mundo.franja ? Mundo.franja(d.getDay(), d.getHours(), d.getMinutes()) : d.getHours());
  let clave = franja(Tele.ahora());
  let sel = "Netflix", zona = "rueda", iArriba = 0, moviendo = false, sinSel = false, r;
  let orden = Tele.favoritas(), vistos = Tele.atajos();
  const atajos = () => [...(usb ? [Atajos.ATAJOS.usb] : []), ...(vistos.includes("Switch") ? [Atajos.ATAJOS.switch] : [])];
  const ultima = (n) => { const t = Tele.ultimaVez(n); return t ? `Abierta: <b>${t}</b>` : "Aún no la has abierto"; };
  const marcaDe = (id) => ["app", `<img src="${Tele.imagen(Tele.paquete(id))}" alt=""><span>${Tele.nombre(id)}</span>`];
  const opciones = () => ({ ...o, pinta: Mundo.pintar, icono: Mundo.icono, atajos: atajos(), app: sel, apps: orden, mas: true, ultima, acciones: () => [], nombreDe: Tele.nombre, marcaDe, pixel: true,
    bolas: true, negrita: true, fechaArriba: true, ajustada: true, etiquetaSola: true, red: Tele.red(), hora: Tele.hhmm(), fecha: Tele.fecha() });

  r = Foco({ ...opciones(), escena: { ...o.escena, soloFondo: true } });
  $(".botones").insertAdjacentHTML("beforeend", '<div class="boton boton-menu"><canvas class="obj" data-obj="menuG" data-esc="2.5"></canvas></div>');
  Atajos.pintar();
  const escena = $("#escena"), capa = escena.parentElement, oscuro = capa.nextElementSibling;
  escena.classList.add("fundido");
  let fondo = escena;
  const ancla = document.createElement("i");
  ancla.hidden = true; capa.append(ancla);
  const despertar = () => requestAnimationFrame(() => Tele.cristal());

  async function nuevaHora(hn, mn = 0) {
    vuelta++;
    despertar();
    await espera(300);
    h = hn; min = mn; o = Mundo.foco(dia, h, min);
    Vivo.parar();
    const f2 = nuevo("fundido");
    Mundo.pintar(f2, { ...o.escena, soloFondo: true });
    f2.style.opacity = 0;
    capa.insertBefore(f2, ancla);
    f2.getBoundingClientRect();
    f2.style.opacity = 1; fondo.style.opacity = 0;
    if (oscuro && !oscuro.classList.contains("velo")) oscuro.style.opacity = o.oscurecer;
    if (!Tele.salvapantallas) $(".saludo").textContent = o.saludo;
    const fondoViejo = fondo;
    fondo = f2;
    setTimeout(() => { fondoViejo.remove(); Vivo.empezar(fondo); }, 900);
    await espera(500);
    despertar();
  }
  function reloj() {
    const d = Tele.ahora();
    $(".hora").textContent = Tele.hhmm(d);
    if (Tele.apagada() || Tele.salvapantallas) return;
    if (d.getDay() !== dia) return Tele.irA(Tele.pagina);
    const k = franja(d);
    if (k !== clave) { clave = k; nuevaHora(d.getHours(), d.getMinutes()); }
  }
  function ponerHora(hn, mn = 0) {
    Vivo.parar();
    h = hn; min = mn; o = Mundo.foco(dia, h, min);
    Mundo.pintar(fondo, { ...o.escena, soloFondo: true });
    if (oscuro && !oscuro.classList.contains("velo")) oscuro.style.opacity = o.oscurecer;
    $(".saludo").textContent = o.saludo;
  }
  setInterval(reloj, 15000);
  let quinto = -1;
  function cadaCinco(f) {
    if (!Mundo.focoEn || Tele.apagada() || Tele.salvapantallas) return false;
    const d = Tele.ahora(), k = f === undefined ? Math.floor(d.getMinutes() / 5) : -2;
    if (d.getHours() !== h || (f === undefined && k === quinto)) return false;
    quinto = k;
    const oo = Mundo.focoEn(dia, h, f === undefined ? d.getMinutes() / 60 : f);
    Vivo.parar();
    o = { ...o, escena: { ...o.escena, paleta: oo.escena.paleta, sol: oo.escena.sol } };
    Mundo.pintar(fondo, { ...o.escena, soloFondo: true });
    if (oscuro && !oscuro.classList.contains("velo")) oscuro.style.opacity = oo.oscurecer;
    Vivo.empezar(fondo);
    Tele.cristal();
    return true;
  }
  setInterval(cadaCinco, 30000);
  if (window.PRUEBA) window.PRUEBA.cielo = cadaCinco;
  if (Tele.salvapantallas) setInterval(() => {
    const s = Mundo.siguiente ? Mundo.siguiente(dia, h, min) : { dia: h === 23 ? (dia + 1) % 7 : dia, h: (h + 1) % 24, min: 0 };
    dia = s.dia; nuevaHora(s.h, s.min);
  }, Tele.carrusel);

  const FUNDIDO = 700;
  let vuelta = 0;
  async function entrada() {
    const yo = ++vuelta;
    despertar();
    await espera(FUNDIDO + 1900);
    if (yo !== vuelta) return;
    despertar();
    Vivo.empezar(fondo);
  }

  const botones = () => [...document.querySelectorAll(".botones .boton")];
  function marcarFoco() {
    $(".elegida").classList.toggle("sin-foco", zona !== "rueda");
    $(".elegida").classList.toggle("moviendo", moviendo);
    botones().forEach((b, i) => b.classList.toggle("foco", zona === "arriba" && i === iArriba));
  }
  function mover(si) {
    moviendo = si;
    document.querySelectorAll(".pista-mover").forEach((p) => p.remove());
    if (si) document.body.insertAdjacentHTML("beforeend", '<div class="pista-mover">▲▼ para moverla · OK para dejarla</div>');
    else Tele.guardarFavoritas(orden);
    marcarFoco();
  }
  function pintarRueda() { r = Foco.rueda(opciones()); Atajos.pintar(); marcarFoco(); Tele.colocarCristal(); }
  function pulsarArriba(i) {
    const b = botones()[i];
    if (i === 0) Tele.entradas(b);
    else if (i === 1) Tele.ajustesRed();
    else if (i === 2) Tele.ajustes();
    else Tele.opciones(b);
  }
  document.addEventListener("keydown", (e) => {
    const k = e.key, lista = r.nombres, i = lista.indexOf(sel);
    if (!/^Arrow/.test(k)) return;
    e.preventDefault();
    if (sinSel) return nadaElegido(false);
    if (moviendo) {
      const j = orden.indexOf(sel), otra = j + (k === "ArrowDown" ? 1 : k === "ArrowUp" ? -1 : 0);
      if (otra !== j && otra >= 0 && otra < orden.length) { [orden[j], orden[otra]] = [orden[otra], orden[j]]; pintarRueda(); }
      return;
    }
    if (zona === "rueda") {
      if (k === "ArrowDown") { sel = lista[(i + 1) % lista.length]; pintarRueda(); }
      else if (k === "ArrowUp") { sel = lista[(i - 1 + lista.length) % lista.length]; pintarRueda(); }
      else if (k === "ArrowRight") { zona = "arriba"; iArriba = 0; marcarFoco(); }
      else if (k === "ArrowLeft") { zona = "arriba"; iArriba = botones().length - 1; marcarFoco(); }
    } else if (zona === "arriba") {
      const n = botones().length;
      if (k === "ArrowLeft") { if (iArriba > 0) iArriba--; else zona = "rueda"; }
      else if (k === "ArrowRight") { if (iArriba < n - 1) iArriba++; else zona = "rueda"; }
      else if (k === "ArrowDown") zona = "rueda";
      marcarFoco();
    }
  });
  document.addEventListener("okCorto", () => {
    if (sinSel) return nadaElegido(false);
    if (moviendo) return mover(false);
    if (zona === "rueda") Tele.abrir(sel);
    else pulsarArriba(iArriba);
  });
  const menuDe = () => Tele.menuApp(sel, $(".elegida"), { mover: () => mover(true) });
  document.addEventListener("okLargo", () => { if (zona === "rueda" && !moviendo && !sinSel) menuDe(); });

  Tele.on.favoritas = () => {
    orden = Tele.favoritas(); vistos = Tele.atajos();
    const nombres = [...atajos().map((a) => a.nombre), ...orden, "Más apps"];
    if (!nombres.includes(sel)) sel = nombres[Math.min(r.nombres.indexOf(sel), nombres.length - 1)] || "Netflix";
    pintarRueda();
  };
  Tele.on.vista = (v) => {
    if (v === "sin") nadaElegido(true);
    else if (v === "menu") menuDe();
    else if (v === "opciones") { zona = "arriba"; iArriba = botones().length - 1; marcarFoco(); Tele.opciones(botones()[iArriba]); }
    else if (v.startsWith("todas")) { const p = Tele.masApps(); p.elegir(7); if (v === "todas-menu") p.okLargo(); }
  };
  function nadaElegido(si) { sinSel = si; document.body.classList.toggle("sin-seleccion", si); }
  Tele.on.atras = () => { if (moviendo) mover(false); else if (zona !== "rueda") { zona = "rueda"; marcarFoco(); } else nadaElegido(true); };
  Tele.on.inicio = () => { if (moviendo) mover(false); zona = "rueda"; nadaElegido(false); if (sel !== "Netflix") { sel = "Netflix"; pintarRueda(); } else marcarFoco(); };
  if (Tele.salvapantallas) nadaElegido(true);
  Tele.on.encender = () => {
    const d = Tele.ahora();
    $(".hora").textContent = Tele.hhmm(d);
    const k = franja(d);
    if (k !== clave) { clave = k; ponerHora(d.getHours(), d.getMinutes()); }
    entrada();
  };
  Tele.on.volver = () => { reloj(); if (Tele.porDias()) orden = Tele.favoritas(); const u = Tele.pendrive(); if (u !== usb) Tele.on.pendrive(u); else if (!moviendo) pintarRueda(); };
  Tele.on.pendrive = (si) => {
    if (si === usb) return;
    usb = si;
    if (!usb && sel === "Pendrive") sel = "Netflix";
    pintarRueda();
    const p = usb && $('[data-app="Pendrive"]');
    if (p) {
      const rng = document.createRange(); rng.selectNodeContents(p);
      Atajos.nuevo(p, true, rng.getBoundingClientRect().width + 37 - p.getBoundingClientRect().width / 2);
    }
  };

  document.fonts.ready.then(() => {
    if (Tele.intro === "1") entrada();
    else { if (!cadaCinco()) Vivo.empezar(fondo); despertar(); }
  });
})();
