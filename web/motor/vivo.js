// vivo.js — lo que se mueve en el escenario (el agua, las nubes, las estrellas…), en el mismo cuadro que el fondo.
(function () {
  const W = 320, H = 180, PASO = 250, RAPIDO = 50, QUIETO = 200, SIN_CONTAR = 2000, TARDE = 120, MUESTRA = 60, LENTOS = 24, DESCANSO = 120000;
  const PRUEBA = window.PRUEBA || {};
  const BAYER = [[0, 8, 2, 10], [12, 4, 14, 6], [3, 11, 1, 9], [15, 7, 13, 5]];
  let lienzo = null, c = null, base = null, completo = null, actores = [], cajas = [], reloj = null, t0 = 0, hasta = 0, contarDesde = 0, vistos = 0, lentos = 0;
  let vuelta = null, tAhora = 0, rapido = false, enHora = 0;
  const otros = [], avisos = [];

  function caja(x, y, w, h) {
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; } w = Math.min(w, W - x); h = Math.min(h, H - y);
    if (w > 0 && h > 0) cajas.push([x, y, w, h]);
  }
  function R(x, y, w, h, col, a = 1) {
    x = Math.round(x); y = Math.round(y); w = Math.max(1, Math.round(w)); h = Math.max(1, Math.round(h));
    if (x < 0) { w += x; x = 0; } if (y < 0) { h += y; y = 0; } w = Math.min(w, W - x); h = Math.min(h, H - y);
    if (w <= 0 || h <= 0) return;
    cajas.push([x, y, w, h]);
    c.globalAlpha = a; c.fillStyle = col; c.fillRect(x, y, w, h); c.globalAlpha = 1;
  }
  const P1 = (x, y, col) => { c.fillStyle = col; c.fillRect(x, y, 1, 1); };
  const libre = (m, x, y) => x >= 0 && y >= 0 && x < W && y < H && (!m || m[y * W + x] === 1);
  const vaiven = (t, v, f) => (Math.sin(t * v + f) + 1) / 2;
  const hexa = (col) => [1, 3, 5].map((i) => parseInt(col.slice(i, i + 2), 16));
  const mezclaHex = (a, b, t) => "#" + hexa(a).map((v, i) => Math.round(v + (hexa(b)[i] - v) * t).toString(16).padStart(2, "0")).join("");
  const ruido = (n) => { const s = Math.sin(n * 12.9898 + 78.233) * 43758.5453; return s - Math.floor(s); };
  const enLaHora = (t) => (PRUEBA.deriva ? (t * PRUEBA.deriva) / 3600 : ((enHora + t) % 3600) / 3600);
  const aviso = (tipo, x, y, lejos, dura) => avisos.some((a) => a.tipo === tipo && tAhora - a.t >= 0 && tAhora - a.t < dura && Math.abs(a.x - x) < lejos && Math.abs(a.y - y) < lejos);

  function pajaro(x, y, col, alas) { R(x, y, 1, 1, col); R(x + 1, y + 1, 1, 1, col); R(x + 3, y + 1, 1, 1, col); R(x + 2, y + 1, 1, 1, col); R(x + 4, y, 1, 1, col); if (alas) { R(x - 1, y - 1, 1, 1, col); R(x + 5, y - 1, 1, 1, col); } else { R(x - 1, y + 1, 1, 1, col); R(x + 5, y + 1, 1, 1, col); } }
  function pajarillo(x, y, pica) {
    R(x, y + 1, 5, 3, "#9a7a4a"); R(x + 1, y + 3, 3, 1, "#efe2c4");
    if (pica) { R(x + 4, y + 1, 2, 2, "#9a7a4a"); R(x + 5, y + 1, 1, 1, "#26262a"); R(x + 6, y + 2, 1, 1, "#d8a040"); }
    else { R(x + 4, y, 2, 2, "#9a7a4a"); R(x + 5, y, 1, 1, "#26262a"); R(x + 6, y + 1, 1, 1, "#d8a040"); }
    R(x - 1, y + 1, 1, 2, "#7a5a34"); R(x + 1, y + 4, 1, 1, "#4a3420"); R(x + 3, y + 4, 1, 1, "#4a3420");
  }
  function bola(cx, cy, rx, ry, col, a, luz, m) {
    const x0 = Math.floor(cx - rx), x1 = Math.ceil(cx + rx), y0 = Math.floor(cy - ry), y1 = Math.ceil(cy + ry);
    caja(x0, y0, x1 - x0 + 1, y1 - y0 + 1);
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const u = (x + 0.5 - cx) / rx, v = (y + 0.5 - cy) / ry;
      if (u * u + v * v > 1 || !libre(m, x, y) || BAYER[y & 3][x & 3] >= a * 16) continue;
      P1(x, y, luz && v < -0.35 ? luz : col);
    }
  }

  const TIPOS = {
    humo(a, t) {
      const { x, y, col, n, v } = a;
      if (!a.vivo) { for (let i = 0; i < n; i++) { const f = (t * 0.22 + i / n) % 1, r = 1 + f * n * 0.8; R(x + v * f * f * n * n * 0.7 - r, y - f * n * 5 - r, r * 2, r * 2, col, a.a * (1 - f * 0.7)); } return; }
      for (let i = 0; i < n; i++) {
        const f = (t * 0.13 + i / n) % 1, r = 1.2 + f * 4.4, k = Math.floor(t * 2.2 + i * 1.7) % 3;
        const cx = x + Math.sin(t * 0.6 + i * 2.1) * (0.6 + f * 1.8) + f * f * 14 * v, cy = y - 1 - f * 26;
        bola(cx, cy, r * [1, 1.28, 0.86][k], r * [1, 0.78, 1.14][k], col, (1 - f) * 0.9, a.luz);
      }
    },
    luciernagas(a, t) {
      const [x0, y0, x1, y1] = a.zona;
      for (let i = 0; i < a.n; i++) {
        const luz = Math.sin(t * 1.3 + i * 1.9); if (luz < 0) continue;
        const x = x0 + vaiven(t, 0.11 + i * 0.013, i * 2.1) * (x1 - x0) + (a.grandes ? Math.sin(t * 2.3 + i) : 0), y = y0 + vaiven(t, 0.17 + i * 0.011, i * 1.3) * (y1 - y0) + (a.grandes ? Math.cos(t * 1.9 + i * 0.7) : 0);
        if (!a.grandes) { R(x, y, 1, 1, a.col); if (luz > 0.6) { R(x - 1, y, 1, 1, a.col, 0.35); R(x + 1, y, 1, 1, a.col, 0.35); R(x, y - 1, 1, 1, a.col, 0.35); R(x, y + 1, 1, 1, a.col, 0.35); } continue; }
        if (luz > 0.75) { R(x - 2, y - 2, 5, 5, a.col, 0.1); R(x - 1, y, 3, 1, a.col, 0.45); R(x, y - 1, 1, 3, a.col, 0.45); R(x, y, 2, 2, a.luz || a.col); }
        else if (luz > 0.35) { R(x - 1, y, 3, 1, a.col, 0.35); R(x, y - 1, 1, 3, a.col, 0.35); R(x, y, 1, 1, a.luz || a.col); }
        else R(x, y, 1, 1, a.col, 0.75);
      }
    },
    mariposas(a, t) { const [x0, y0, x1, y1] = a.zona; for (let i = 0; i < a.n; i++) { const x = x0 + vaiven(t, 0.13 + i * 0.03, i * 2.1) * (x1 - x0), y = y0 + vaiven(t, 0.21 + i * 0.02, i * 1.3) * (y1 - y0) + Math.sin(t * 3 + i), col = a.cols[i % a.cols.length]; if (Math.floor(t * 5 + i) % 2) { R(x - 2, y - 1, 2, 2, col); R(x + 1, y - 1, 2, 2, col); } else { R(x - 1, y - 2, 1, 2, col); R(x + 1, y - 2, 1, 2, col); } R(x, y - 1, 1, 2, "#3a2a20"); } },
    bandada(a, t) {
      for (let i = 0; i < a.n; i++) {
        const x = ((t * a.v + i * 17) % 380) - 30, y = a.y + (i % 3) * 5 + Math.sin(t * 0.7 + i) * 2;
        pajaro(a.dir < 0 ? 320 - x : x, y, a.col, Math.floor(t * 4 + i) % 2);
      }
    },
    barco(a, t) {
      const x = Math.round(a.x + a.v * enLaHora(t)), { A, B, O, V } = a.cols, m = a.mascara;
      caja(x - 4, 76, 44, 21);
      const rect = (x0, y0, w, h, col) => { for (let y = y0; y < y0 + h; y++) for (let xx = x0; xx < x0 + w; xx++) if (libre(m, xx, y)) P1(xx, y, col); };
      rect(x - 2, 92, 2, 2, A); rect(x, 91, 36, 4, A); rect(x, 94, 36, 1, O); rect(x + 6, 87, 24, 4, A); rect(x + 10, 85, 14, 2, B); rect(x + 13, 80, 3, 5, O); rect(x + 20, 80, 3, 5, O);
      for (let i = 0; i < 7; i++) if (libre(m, x + 8 + i * 3, 89)) P1(x + 8 + i * 3, 89, V);
      [14, 21].forEach((dx, j) => { for (let i = 0; i < 4; i++) { const f = (t * 0.18 + i / 4 + j * 0.13) % 1, r = 1 + f * 3.2; bola(x + dx + 1 + f * f * 8, 79 - f * 18, r * 1.15, r, a.humo, (1 - f) * 0.75, null, m); } });
    },
    bola(a, t) {
      const { x, y, mapa, cols } = a, ciclo = 22 + ruido(x) * 10, u = PRUEBA.bola !== undefined ? (t >= PRUEBA.bola ? t - PRUEBA.bola : ciclo - 1) : (t + ruido(y) * ciclo) % ciclo, tam = u < 1.8 ? Math.round(Math.sin((u / 1.8) * Math.PI * 6) * 1.2) : 0;
      const destello = u >= 1.9 && u < 2.4;
      if (!tam && !destello) return;
      caja(x - 4, y - 5, 17, 15);
      if (tam) {
        if (a.sinBola) c.putImageData(a.sinBola, x - 4, y - 5);
        mapa.forEach((s, j) => [...s].forEach((ch, i) => { if (cols[ch]) P1(x + i + tam * (j < 3 ? 1 : j < 6 ? 0 : -1), y + j, cols[ch]); }));
      }
      if (destello) { P1(x + 4, y - 3, "#ffffff"); P1(x + 3, y - 3, "#fff2a0"); P1(x + 5, y - 3, "#fff2a0"); P1(x + 4, y - 4, "#fff2a0"); P1(x + 4, y - 2, "#fff2a0"); }
    },
    ola(a, t) { const y0 = a.y - 4; cajas.push([0, y0, W, 10]); for (let x = 0; x < W; x += 2) { const y = a.y + Math.round(2 * Math.sin(x / 9 + t * 0.35) + 1.5 * Math.sin(x / 4 - t * 0.25) + Math.sin(t * 0.4)); c.fillStyle = a.col; c.fillRect(x, y, 2, 2); } },
    fugaz(a, t) {
      if (!a.grande) { const q = t % 37; if (q > 0.9) return; const n = Math.floor(t / 37), x = 60 + ((n * 83) % 180), y = 14 + ((n * 29) % 30); for (let i = 0; i < 14; i++) { const u = q / 0.9 - i * 0.04; if (u > 0 && u < 1) R(x + u * 70, y + u * 26, 1, 1, a.col, 1 - i / 14); } return; }
      if (a.k === undefined) { a.k = 0; a.cuando = PRUEBA.fugaz !== undefined ? PRUEBA.fugaz : 6 + ruido(0.5) * 20; }
      const DURA = 1.1;
      while (t > a.cuando + DURA) { a.k++; a.cuando += 50 + ruido(a.k + 0.17) * 60; }
      if (t < a.cuando) return;
      rapido = true;
      if (a.avisada !== a.k) { a.avisada = a.k; avisos.push({ tipo: "fugaz", x: 160, y: 40, t }); }
      const u = (t - a.cuando) / DURA, dir = ruido(a.k + 0.5) < 0.5 ? 1 : -1, x0 = dir > 0 ? 30 + ruido(a.k + 0.3) * 150 : 290 - ruido(a.k + 0.3) * 150, y0 = 8 + ruido(a.k + 0.7) * 26;
      const hx = x0 + dir * u * 100, hy = y0 + u * 34;
      for (let i = 0; i < 24; i++) { const xx = Math.round(hx - dir * i * 1.4), yy = Math.round(hy - i * 0.48); if (libre(a.mascara, xx, yy)) R(xx, yy, 1, 1, a.col, Math.max(0, (1 - i / 24) * (u < 0.85 ? 1 : (1 - u) / 0.15))); }
      if (u < 0.85 && libre(a.mascara, Math.round(hx), Math.round(hy))) R(hx, hy - 1, 2, 2, "#ffffff");
    },
    llama(a, t) { const { x, y, e } = a; for (let i = -2; i <= 2; i++) { const al = (15 + 6 * Math.sin(t * 7 + i * 1.9 + x)) * e * (1 - Math.abs(i) * 0.24), px = x + i * 3 * e; R(px - e, y - al, 2 * e, al * 0.6, "#e8502a"); R(px - e * 0.5, y - al * 0.55, e, al * 0.35, "#ff9a3a"); if (!i) R(px, y - al * 0.3, e, al * 0.2, "#ffe06a"); } },
    lluvia(a, t) { for (let i = 0; i < a.n; i++) { const y = (i * 53 + t * 150) % 190 - 8, x = (i * 97 - y * 0.3 + 340) % 330; R(x, y, 1, a.largo, a.col, 0.55); } },
    nieve(a, t) { for (let i = 0; i < a.n; i++) R((i * 61) % W + Math.sin(t * 0.8 + i) * 3, (i * 37 + t * 9) % H, 1, 1, a.col); },
  };

  function dibujar(t) {
    if (!lienzo) return;
    tAhora = t; rapido = false;
    cajas.forEach(([x, y, w, h]) => c.drawImage(base, x, y, w, h, x, y, w, h));
    cajas = [];
    actores.forEach((a) => { if (TIPOS[a.tipo]) TIPOS[a.tipo](a, t); });
    otros.forEach((f) => f(t));
    while (avisos.length && t - avisos[0].t > 5) avisos.shift();
  }
  function cuadro() {
    reloj = null;
    const pedido = performance.now();
    requestAnimationFrame(() => {
      if (!lienzo) return;
      const ahora = performance.now();
      if (ahora >= contarDesde) {
        vistos++; if (ahora - pedido > TARDE) lentos++;
        if (vistos >= MUESTRA) { if (lentos >= LENTOS) return descansar(); vistos = lentos = 0; }
      }
      if (ahora >= hasta && !(window.Tele && Tele.menu)) dibujar((ahora - t0) / 1000);
      reloj = setTimeout(cuadro, rapido ? RAPIDO : PASO);
    });
  }
  function descansar() {
    const l = lienzo;
    soltar();
    vuelta = setTimeout(() => { vuelta = null; if (!lienzo && l && l.isConnected) empezar(l); }, DESCANSO);
  }
  function soltar() {
    if (reloj) clearTimeout(reloj);
    reloj = null;
    if (lienzo) {
      if (completo) c.drawImage(completo, 0, 0);
      else cajas.forEach(([x, y, w, h]) => c.drawImage(base, x, y, w, h, x, y, w, h));
      otros.forEach((f) => f(null));
    }
    cajas = []; lienzo = null;
  }
  function parar() {
    if (vuelta) { clearTimeout(vuelta); vuelta = null; }
    soltar();
  }
  function empezar(canvas) {
    parar();
    if (window.Tele && Tele.basico) return;
    if (!canvas || !canvas.actores || !canvas.actores.length) return;
    lienzo = canvas; c = canvas.getContext("2d"); actores = canvas.actores;
    completo = null;
    if (canvas.baseVivo) {
      completo = document.createElement("canvas"); completo.width = W; completo.height = H;
      completo.getContext("2d").drawImage(canvas, 0, 0);
      base = canvas.baseVivo;
      c.drawImage(base, 0, 0);
    } else {
      base = document.createElement("canvas"); base.width = W; base.height = H;
      base.getContext("2d").drawImage(canvas, 0, 0);
    }
    const d = window.Tele && Tele.ahora ? Tele.ahora() : new Date();
    enHora = d.getMinutes() * 60 + d.getSeconds();
    vistos = lentos = 0;
    t0 = performance.now();
    dibujar(0);
    if (!PRUEBA.vivo) reloj = setTimeout(cuadro, PASO);
  }
  document.addEventListener("keydown", () => { const n = performance.now(); hasta = n + QUIETO; contarDesde = n + SIN_CONTAR; }, true);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { contarDesde = performance.now() + SIN_CONTAR; vistos = lentos = 0; } });
  window.Vivo = {
    empezar, parar, dibujar,
    tambien(f) { otros.push(f); },
    tipo(nombre, f) { TIPOS[nombre] = f; },
    piezas: { R, caja, P1, libre, vaiven, ruido, bola, aviso, rapido: () => { rapido = true; }, get t() { return tAhora; },
      imagen(img, x, y, a = 1) { x = Math.round(x); y = Math.round(y); caja(x, y, img.width, img.height); c.globalAlpha = Math.max(0, Math.min(1, a)); c.drawImage(img, x, y); c.globalAlpha = 1; },
      get ctx() { return c; } },
    get en() { return !!lienzo; },
    get apagado() { return !lienzo; },
  };
})();
