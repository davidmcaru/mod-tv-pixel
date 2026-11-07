// atajos.js — los atajos de la rueda (la consola por HDMI y el pendrive) y cómo se pintan sus dibujos.
(function () {
  const ATAJOS = {
    switch: {
      nombre: "Switch", objeto: "switch", detalle: "HDMI 1",
      etiqueta: "<em>ATAJO</em>La Switch, en el <b>HDMI 1</b>", acciones: ["Abrir", "Quitar el atajo"],
      tarjeta: ["switch", '<i class="joy izq"></i><i class="joy der"></i><div class="atajo-cuerpo"><span>Switch<small>HDMI 1</small></span></div>'],
    },
    usb: {
      nombre: "Pendrive", objeto: "pendrive", detalle: "USB",
      etiqueta: "<em>NUEVO</em>Pendrive enchufado <b>ahora</b>", acciones: ["Abrir con VLC", "Expulsar"],
      tarjeta: ["usb", '<div class="atajo-cuerpo"><canvas class="obj" data-obj="pendrive" data-esc="9"></canvas><span>Pendrive<small>USB · se abre con VLC</small></span></div>'],
    },
  };
  const COLORES = ["#ff3b47", "#ffd23f", "#36d17a"];
  const luces = (n) => `<b class="luces">${COLORES.map((c, i) => `<i style="--c:${c}"${i + 1 === n ? ' class="si"' : ""}></i>`).join("")}</b>`;
  function pintar() {
    document.querySelectorAll("canvas.obj[data-obj]:not([data-pintado])").forEach((c) => {
      c.dataset.pintado = "";
      const D = Objetos, id = c.dataset.obj;
      const { w, h } = D.tam(id), e = Number(c.dataset.esc || 4);
      c.width = w; c.height = h;
      D.pintar(c.getContext("2d"), id, 0, 0, c.dataset.foco !== undefined && D.foco ? D.foco(id) : undefined);
      c.style.width = w * e + "px"; c.style.height = h * e + "px"; c.style.imageRendering = "pixelated";
    });
  }
  const sitio = (el) => {
    const r = el.getBoundingClientRect(), b = document.body.getBoundingClientRect(), k = b.width / 1920 || 1;
    return { x: (r.left - b.left) / k, y: (r.top - b.top) / k, w: r.width / k, h: r.height / k };
  };
  function nuevo(el, anim, dx = 0) {
    const s = sitio(el), ex = Pixel.exclama(5);
    ex.style.left = s.x + s.w / 2 - 27 + dx + "px"; ex.style.top = s.y - 74 + "px";
    document.body.append(ex);
    if (anim) { el.classList.add("entra"); ex.classList.add("sale"); }
    return ex;
  }
  function letrero(el, texto, sub, derecha) {
    const s = sitio(el), d = document.createElement("div");
    d.className = "etiqueta-foco" + (derecha ? " derecha" : ""); d.innerHTML = texto + (sub ? `<small>${sub}</small>` : "");
    d.style.left = (derecha ? s.x + s.w + 20 : s.x + s.w / 2) + "px"; d.style.top = (derecha ? s.y + s.h / 2 : s.y + s.h + 18) + "px";
    document.body.append(d);
    if (!derecha) d.style.left = Math.min(1920 - d.offsetWidth / 2 - 16, s.x + s.w / 2) + "px";
    return d;
  }
  document.addEventListener("click", (e) => {
    if (e.target.closest(".boton-diseno") && window.parent !== window) window.parent.postMessage({ tele: "diseno" }, "*");
  });
  window.Atajos = { ATAJOS, luces, pintar, nuevo, letrero };
})();
