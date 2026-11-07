// universos.js — lo común de las tres sagas: el escenario de cada hora, con su luz y su gente.
(function () {
  const NOMBRE = { ninjas: "Ninjas", piratas: "Piratas", magos: "Magos" };
  const DIAS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
  const LIBROS = ["Las reliquias de la muerte", "La piedra filosofal", "La cámara secreta", "El prisionero de Azkeban", "La copa de fuego", "La Orden del Fénix", "El misterio del príncipe"];
  const FRECUENCIA = [[1, "#ffc53d", "1"], [2, "#c084fc", "2"], [3, "#60a5fa", "3 o 4"], [5, "#4ade80", "De 5 a 9"], [10, "#aeb6c4", "10 o más"]];
  const color = (n) => [...FRECUENCIA].reverse().find(([desde]) => n >= desde)[1];
  const memo = {};
  function sprites(u) {
    return (memo[u] = memo[u] || Object.fromEntries(Personajes[u].flat().map((s) => [s.nombre, s])));
  }
  const base = (nombre) => nombre.split("·")[0];
  const sprite = (u, nombre) => sprites(u)[nombre] || sprites(u)[base(nombre)];
  const sitio = (u, d, h) => HorarioU[u].sitios.find((s) => s.s === HorarioU[u].semana[d][h].s);
  function veces(u) {
    const v = {};
    HorarioU[u].semana.forEach((dia) => dia.forEach(({ p }) => p.forEach(([n]) => (v[base(n)] = (v[base(n)] || 0) + 1))));
    return v;
  }
  function donde(u, s, [nombre, n, px, py]) {
    const sp = sprite(u, nombre), w = sp.m[0].length, alto = sp.m.length, [zx, zy] = n ? s.huecos[n - 1] : [px, py];
    return { x: Math.max(0, Math.min(320 - w, Math.round(zx - w / 2))), y: zy, top: zy - alto - (sp.f || 0), w, alto };
  }
  function pinta(c, sp, x, y, tinte) {
    sp.m.forEach((fila, j) => [...fila].forEach((l, i) => { if (l !== ".") { c.fillStyle = tinte(sp.c[l]); c.fillRect(x + i, y + j, 1, 1); } }));
  }
  const CON_SOMBRA = { magos: [16] };
  function sombraPies(c, x, y, w, flota) {
    const rx = Math.max(4, w * (flota ? 0.3 : 0.42)), ry = flota ? 1.5 : 2.3, cx = x + w / 2, cy = y - 0.5;
    c.fillStyle = `rgba(16, 12, 24, ${flota ? 0.16 : 0.3})`;
    for (let yy = Math.floor(cy - ry); yy <= cy + ry; yy++) for (let xx = Math.floor(cx - rx); xx <= cx + rx; xx++) {
      const q = ((xx + 0.5 - cx) / rx) ** 2 + ((yy + 0.5 - cy) / ry) ** 2;
      if (q < 1 && (q < 0.55 || (xx + yy) % 2 === 0)) c.fillRect(xx, yy, 1, 1);
    }
  }
  function duelo(c, quienes) {
    const v = quienes.find(({ q }) => base(q[0]) === "Valdemoro"), h = quienes.find(({ q }) => base(q[0]) === "Antonio"), k = Kit.nuevo(c, 1);
    if (!v || !h) return;
    const vx = v.x + v.w - 2, vy = v.top + Math.round(v.alto * 0.5), hx = h.x - 4, hy = h.top + Math.round(h.alto * 0.5), mx = Math.round((vx + hx) / 2), my = Math.min(vy, hy) - 12;
    k.linea(h.x + 2, hy + 5, hx, hy, "#6b4a2f");
    k.linea(vx, vy, mx, my, "#3fe87a"); k.linea(vx + 1, vy + 1, mx + 1, my + 1, "#a8ffc8");
    k.linea(hx, hy, mx, my, "#e83a3a"); k.linea(hx - 1, hy + 1, mx - 1, my + 1, "#ffb0a0");
    k.halo(mx, my, 12, 12, "#fff4d8", 0.7); k.elipse(mx, my, 3, 3, "#ffffff");
  }
  function fondo(cv, u, d, h) {
    const s = sitio(u, d, h), [titulo, , escena] = Sitios[u][s.s];
    cv.width = 320; cv.height = 180;
    const c = cv.getContext("2d");
    c.imageSmoothingEnabled = false;
    const luz = Luz.nueva(titulo, h, d), k = Kit.nuevo(c, s.s * 31 + u.length, luz);
    k.gente = HorarioU[u].semana[d][h].p.map((q) => base(q[0]));
    escena(k);
    cv.actores = k.actores;
    const quienes = HorarioU[u].semana[d][h].p.map((q) => ({ q, ...donde(u, s, q) })).sort((a, b) => a.y - b.y);
    const conSombra = (CON_SOMBRA[u] || []).includes(s.s);
    if (window.Momentos) try { Momentos.poner(k, u, s.s, { d, h, c, luz, quienes: quienes.map(({ q, x, y, w, top, alto }) => ({ nombre: q[0], x, y, w, top, alto })) }); } catch (err) { console.error("momentos", err); }
    quienes.forEach(({ q, x, y, w, top }) => { const sp = sprite(u, q[0]); if (conSombra) sombraPies(c, x, y, w, sp.f || 0); pinta(c, sp, x, top, luz.sprite); });
    if (HorarioU[u].semana[d][h].duelo) duelo(c, quienes);
    return c;
  }
  function pintar(u, d, h) {
    const cv = document.createElement("canvas"), c = fondo(cv, u, d, h);
    c.fillStyle = `rgba(0,0,0,${Horas.oscurecer(h)})`;
    c.fillRect(0, 0, 320, 180);
    return cv;
  }
  const mundo = (u) => ({
    icono: (app) => Iconos.de(u, app),
    pintar: (cv, e) => fondo(cv, u, e.dia, e.hora),
    foco: (dia, hora) => ({ escena: { dia, hora }, oscurecer: Horas.oscurecer(hora), escala: 0.72, tarjetaClara: true, saludo: Horas.saludo(hora), hora: `${hora}:00` }),
  });
  function foto(u, nombre) {
    const sp = sprite(u, nombre), cv = document.createElement("canvas");
    cv.width = sp.m[0].length; cv.height = sp.m.length;
    pinta(cv.getContext("2d"), sp, 0, 0, (col) => col);
    return cv.toDataURL();
  }
  window.Universo = { NOMBRE, DIAS, FRECUENCIA, color, sitio, veces, donde, pintar, foto, sprites, sprite, base, mundo };
})();
