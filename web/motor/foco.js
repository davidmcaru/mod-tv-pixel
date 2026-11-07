// foco.js — la rueda de apps y su tarjeta, encima del escenario.
(function () {
  const ICONO = {
    entradas: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="13" height="14" rx="2"/><path d="M10 12h11M18 9l3 3-3 3"/></svg>',
    wifi: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M2.5 9a14 14 0 0 1 19 0"/><path d="M5.6 12.6a9.6 9.6 0 0 1 12.8 0"/><path d="M8.8 16.1a5 5 0 0 1 6.4 0"/><circle cx="12" cy="19.4" r="1.3" fill="#fff" stroke="none"/></svg>',
    ajustes: '<svg viewBox="0 0 24 24" fill="none" stroke="#fff"><circle cx="12" cy="12" r="7.4" stroke-width="3.4" stroke-dasharray="2.9 2.9"/><circle cx="12" cy="12" r="5.6" stroke-width="1.8"/><circle cx="12" cy="12" r="2.2" stroke-width="1.8"/></svg>',
  };
  const APPS = ["Netflix", "Crunchyroll", "HBO Max", "Disney+", "YouTube", "Prime Video"];
  const TAM = [[44, 0.86], [44, 0.74], [36, 0.5], [30, 0.32], [28, 0.17]];
  const TAM_ANTES = [[36, 0.55], [28, 0.3]];
  const MARCA = {
    "Más apps": ["mas", '<canvas class="obj" data-obj="apps" data-esc="8"></canvas><span>Más apps</span>'],
  };

  const dibujo = (id, esc) => (window.Objetos && Objetos.foco(id) ? `<canvas class="obj en-foco" data-obj="${id}" data-esc="${esc}" data-foco></canvas>` : "") +
    `<canvas class="obj" data-obj="${id}" data-esc="${esc}"></canvas>`;

  function rueda(o) {
    let h = "";
    const atajos = o.atajos || [], nombres = [...atajos.map((a) => a.nombre), ...(o.apps || APPS), ...(o.mas ? ["Más apps"] : [])];
    const k = Math.max(0, nombres.indexOf(o.app || "Netflix")), elegida = nombres[k], atajo = atajos.find((a) => a.nombre === elegida);
    const antes = atajos.length ? nombres.slice(Math.max(0, k - 2), k) : [], nom = (id) => (o.nombreDe ? o.nombreDe(id) : id);
    const despues = atajos.length ? nombres.slice(k + 1, k + 6) : [...nombres.slice(k + 1), ...nombres.slice(0, k)];
    if (antes.length) h += '<div class="antes">' + antes.map((a, i) => {
      const [tam, op] = TAM_ANTES[antes.length - 1 - i];
      return `<div class="otra" data-app="${a}" style="font-size:${tam}px;opacity:${op}">${nom(a)}</div>`;
    }).join("") + "</div>";
    h += `<div class="lista"><div class="elegida" data-app="${elegida}"><i></i><span>${nom(elegida)}</span></div>` +
      despues.map((a, i) => `<div class="otra" data-app="${a}" style="font-size:${TAM[i][0]}px;opacity:${TAM[i][1]};margin-top:${i ? 18 : 30}px">${nom(a)}</div>`).join("") + "</div>";
    const dos = (n) => String(n).padStart(2, "0");
    h += `<div class="pie">FAVORITAS<b>${dos(k + 1)} / ${dos(nombres.length)}</b></div>`;
    const e = o.escala || 1;
    const losa = `transform:scale(${e});` + (o.losaClara ? "background:rgba(255,255,255,.025);border-color:rgba(255,255,255,.3);backdrop-filter:blur(3px)" : "");
    const [clase, marca] = atajo ? atajo.tarjeta : MARCA[elegida] || (o.marcaDe ? o.marcaDe(elegida) : ["", `<span>${nom(elegida)}</span>`]);
    const tarjeta = o.losaClara ? 'style="left:120px;right:120px;top:80px;bottom:80px"' : "";
    h += `<div class="losa" style="${losa}"><div class="tarjeta ${clase}${o.tarjetaClara ? " clara" : ""}" ${tarjeta}>${marca}</div></div>`;
    const debajo = e < 1 ? `left:${1850 - 786 * e}px;top:${755 - (1 - e) * 0}px;margin-top:13px` : "";
    const mas = elegida === "Más apps";
    const etiqueta = atajo ? atajo.etiqueta : mas ? "<em>APPS</em>Todas las de la tele"
      : `<em>FAVORITA</em>${o.ultima ? o.ultima(elegida) : "Abierta por última vez <b>hoy a las 20:01</b>"}`;
    const acciones = o.acciones ? o.acciones(elegida, atajo) : atajo ? atajo.acciones : mas ? ["Abrir"] : ["Abrir", "Quitar de favoritas", "Info de la app"];
    const et = o.etiquetaSola ? etiqueta.replace(/<em>.*?<\/em>/, "") : etiqueta;
    h += `<div class="debajo" style="${debajo}"><div class="etiqueta">${et}</div>` + (acciones.length
      ? `<div class="acciones">${acciones.map((a) => `<span>${o.iconos && o.iconos[a] ? dibujo(o.iconos[a], 3) : ""}${a}</span>`).join("")}</div>` : "") + "</div>";
    return { h, elegida, atajo, nombres };
  }
  function marcar(o, r) {
    if (r.atajo && window.Objetos) document.querySelector(".elegida i").replaceWith(Objetos.canvas(r.atajo.objeto, 4));
    else if (r.elegida === "Más apps" && window.Objetos) document.querySelector(".elegida i").replaceWith(Objetos.canvas("apps", 4));
    else if (o.icono && window.Objetos) document.querySelector(".elegida i").replaceWith(Objetos.canvas(o.icono(r.elegida), 3));
  }

  window.Foco = function (o = {}) {
    let h = "";
    const CLASES = { negrita: "negrita", esmerilado: "esmerilado", bolas: "bolas", fechaArriba: "fecha-arriba", ajustada: "ajustada", etiquetaSola: "etiqueta-sola", pixel: "pixel" };
    Object.entries(CLASES).forEach(([k, c]) => { if (o[k]) document.body.classList.add(c); });
    if (o.escena) h += '<div class="capa"><canvas id="escena"></canvas></div>';
    if (o.oscurecer) h += `<div class="capa" style="background:#000;opacity:${o.oscurecer}"></div>`;
    h += '<div class="capa velo"></div>';
    if (o.marca) h += `<div class="marca${o.marcaPixel ? " pixel" : ""}">${o.marca}</div>`;
    h += `<div class="saludo">${o.saludo || "Buenas noches"}</div><div class="hora">${o.hora || "21:36"}</div><div class="fecha">${o.fecha || "Viernes 30 de octubre"}</div>`;
    const red = o.red || "MiWifi";
    h += o.pixel
      ? `<div class="botones"><div class="boton">${dibujo("entradasG", 2.5)}</div>` +
        `<div class="boton${/sin red/i.test(red) ? " apagado" : ""}">${dibujo("wifiG", 2.5)}</div>` +
        `<div class="boton">${dibujo("ajustesG", 2.5)}</div></div>`
      : `<div class="botones"><div class="boton">${ICONO.entradas}Entradas</div><div class="boton">${ICONO.wifi}${red}</div><div class="boton redondo">${ICONO.ajustes}</div></div>`;
    const r = rueda(o);
    document.body.insertAdjacentHTML("afterbegin", h + r.h);
    if (o.escena) (o.pinta || Pixel.pintar)(document.getElementById("escena"), o.escena);
    marcar(o, r);
    return r;
  };
  window.Foco.rueda = function (o = {}) {
    const r = rueda(o), t = document.createElement("div"), $ = (s) => document.querySelector(s), n = (s) => t.querySelector(s);
    t.innerHTML = r.h;
    const a = $(".antes"), b = n(".antes");
    if (a && b) a.replaceWith(b); else if (a) a.remove(); else if (b) $(".lista").before(b);
    const lista = $(".lista"), elegida = $(".elegida"), nueva = n(".elegida");
    elegida.innerHTML = nueva.innerHTML; elegida.dataset.app = nueva.dataset.app;
    lista.querySelectorAll(".otra").forEach((e) => e.remove());
    lista.append(...n(".lista").querySelectorAll(".otra"));
    $(".pie").replaceWith(n(".pie"));
    const losa = $(".losa"), losaN = n(".losa");
    losa.innerHTML = losaN.innerHTML; losa.style.cssText = losaN.style.cssText;
    const debajo = $(".debajo"), debajoN = n(".debajo");
    debajo.style.cssText = debajoN.style.cssText;
    debajo.querySelector(".etiqueta").innerHTML = debajoN.querySelector(".etiqueta").innerHTML;
    const acc = debajo.querySelector(".acciones"), accN = debajoN.querySelector(".acciones");
    if (acc && accN) acc.replaceWith(accN); else if (acc) acc.remove(); else if (accN) debajo.append(accN);
    marcar(o, r);
    return r;
  };
})();
