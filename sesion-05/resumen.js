// Lógica de la vista del profesor. Lee las respuestas del Apps Script y las resume por pestaña.
import { URL_APPS_SCRIPT, CURSO, SESION, ACTIVIDAD, CLAVE_SESION } from './config.js';
import { FICHAS, TEXTOS as T } from './datos.js';
import * as C from './calculos.js';

const RV = T.resumenVista;
const ACTUALIZAR_MS = 20000;
const REGISTRO_EN_LINEA = /^https?:\/\//.test(URL_APPS_SCRIPT) && !URL_APPS_SCRIPT.includes('PEGAR_AQUI');
const PEDIDO_EVENTO_GERENTE = { cambiar: 'grandeEvento', seguir: 'asociacion', igualar: 'asociacionIguala' };

const PESTANAS = [
  ...FICHAS.map((f) => ({ id: f.id, etiqueta: `${f.numero}. ${f.corto}` })),
  { id: 'productor', etiqueta: T.secciones[2] },
  { id: 'gerente', etiqueta: T.secciones[3] },
  { id: 'evaluacion', etiqueta: T.secciones[4] }
];

const campoFecha = document.getElementById('fecha');
const estadoCarga = document.getElementById('estado');
const contPestanas = document.getElementById('pestanas');
const panel = document.getElementById('panel');

let filas = null;
let pestana = PESTANAS[0].id;

/* ---------- Utilidades ---------- */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(valor) {
  return String(valor === undefined || valor === null ? '' : valor).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

function t(plantilla, datos = {}) {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => (k in datos ? datos[k] : ''));
}

function fechaLocal(fecha) {
  const a = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${a}-${m}-${d}`;
}

function horaLocal() {
  return new Date().toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
}

function mostrarEstado(texto, error = false) {
  estadoCarga.className = 'estado-carga' + (error ? ' error' : '');
  if (estadoCarga.textContent !== texto) estadoCarga.textContent = texto;
}

// Etiqueta guardada en la hoja → id de la opción.
function idDeEtiqueta(opciones, etiqueta) {
  const o = opciones.find((x) => x.etiqueta === etiqueta);
  return o ? o.id : null;
}

/* ---------- Lectura y armado de registros ---------- */

// El Apps Script de la sesión 4 guarda una fila por campo. Las filas de un envío comparten
// marca temporal, estudiante y grupo. Si un campo se repite, empieza otro registro.
function armarRegistros(lista) {
  const grupos = new Map();
  const registros = [];
  for (const f of lista) {
    const clave = `${f.marca_temporal}|${f.estudiante}|${f.grupo}`;
    let actual = grupos.get(clave);
    if (!actual || Object.prototype.hasOwnProperty.call(actual.campos, f.pregunta)) {
      actual = { marca: f.marca_temporal, estudianteHoja: f.estudiante, campos: {} };
      grupos.set(clave, actual);
      registros.push(actual);
    }
    actual.campos[f.pregunta] = f.respuesta;
  }
  return registros.map((r) => ({
    ...r.campos,
    marca: r.marca,
    estudiante: r.campos.estudiante || r.estudianteHoja
  }));
}

// Deja un registro por estudiante y pregunta: el más reciente.
function ultimos(registros) {
  const mapa = new Map();
  for (const r of registros) {
    const clave = [r.id_estudiante, r.seccion, r.ficha, r.ronda, r.pregunta].join('|');
    const previo = mapa.get(clave);
    if (!previo || r.marca >= previo.marca) mapa.set(clave, r);
  }
  return [...mapa.values()];
}

function porEstudiante(registros) {
  const estudiantes = new Map();
  for (const r of registros) {
    const id = r.id_estudiante || r.estudiante;
    if (!estudiantes.has(id)) estudiantes.set(id, { id, nombre: r.estudiante, marca: r.marca, r: {} });
    const e = estudiantes.get(id);
    if (r.marca >= e.marca) {
      e.nombre = r.estudiante || e.nombre;
      e.marca = r.marca;
    }
    const clave = r.seccion === 'casos' ? `casos|${r.ficha}|${r.pregunta}` : `${r.seccion}|${r.ronda}|${r.pregunta}`;
    e.r[clave] = r;
    if (r.seccion === 'productor' && r.pregunta === 'finca') e.finca = r.ficha;
  }
  return [...estudiantes.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function estudiantesDelDia() {
  const fecha = campoFecha.value;
  const delDia = armarRegistros(filas || []).filter((r) => {
    if (r.clave !== CLAVE_SESION) return false;
    const momento = new Date(r.marca);
    return !Number.isNaN(momento.getTime()) && fechaLocal(momento) === fecha;
  });
  return porEstudiante(ultimos(delDia));
}

async function cargar() {
  if (!REGISTRO_EN_LINEA) {
    mostrarEstado(RV.error, true);
    pintarPanel();
    return;
  }
  const url = URL_APPS_SCRIPT + (URL_APPS_SCRIPT.includes('?') ? '&' : '?')
    + new URLSearchParams({ curso: CURSO, sesion: SESION, actividad: ACTIVIDAD }).toString();
  try {
    const respuesta = await fetch(url, { method: 'GET' });
    const datos = await respuesta.json();
    if (!datos || !datos.ok || !Array.isArray(datos.filas)) throw new Error('Respuesta inválida');
    filas = datos.filas;
    mostrarEstado(t(RV.actualizado, { hora: horaLocal() }));
  } catch (error) {
    mostrarEstado(RV.error, true);
  }
  pintarPanel();
}

/* ---------- Piezas ---------- */

function barras(opciones, valores) {
  const cuentas = new Map(opciones.map((o) => [o, 0]));
  valores.filter(Boolean).forEach((v) => cuentas.set(v, (cuentas.get(v) || 0) + 1));
  const total = [...cuentas.values()].reduce((s, n) => s + n, 0);
  const filasBarras = [...cuentas.entries()].map(([opcion, n]) => {
    const ancho = total ? (n / total) * 100 : 0;
    return `<div class="barra-fila">
      <span>${esc(opcion)}</span>
      <div class="barra-pista" aria-hidden="true"><div class="barra-relleno" style="width:${ancho.toFixed(1)}%"></div></div>
      <span class="barra-cuenta">${n}</span>
    </div>`;
  }).join('');
  return `<div class="barras">${filasBarras}</div>`;
}

function respondieron(n) {
  return `<p>${esc(n === 1 ? RV.respondioUno : t(RV.respondieron, { n }))}</p>`;
}

function tabla(columnas, filasTabla) {
  if (!filasTabla.length) return `<p class="vacio">${esc(RV.sinRespuestas)}</p>`;
  return `<div class="tabla-envoltura"><table>
    <thead><tr>${columnas.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${filasTabla.map((f) => `<tr>${f.map((celda, i) => (i === 0
      ? `<th scope="row">${esc(celda)}</th>`
      : `<td class="texto-libre">${esc(celda)}</td>`)).join('')}</tr>`).join('')}</tbody>
  </table></div>`;
}

const sinDato = (valor) => (valor === undefined || valor === null || valor === '' ? RV.sinDato : valor);
const nombreFinca = (id) => {
  const f = FICHAS.find((x) => x.id === id);
  return f ? f.corto : RV.sinDato;
};
const siNo = (valor) => (valor ? RV.si : RV.no);

/* ---------- Pestañas de fichas ---------- */

function panelFicha(ficha, estudiantes) {
  const K = T.casos;
  const lista = estudiantes.filter((e) => e.r[`casos|${ficha.id}|alcanza`] || e.r[`casos|${ficha.id}|limita`]);
  const alcanza = (e) => e.r[`casos|${ficha.id}|alcanza`] || {};
  const limita = (e) => e.r[`casos|${ficha.id}|limita`] || {};
  const razon = (opcion) => (opcion && opcion.startsWith('Otra') ? 'Otra' : opcion);
  const explicaciones = lista.map((e) => `<li>
      <p class="quien">${esc(e.nombre)}</p>
      <p><strong>${esc(RV.alcanza)} ${esc(sinDato(alcanza(e).opcion))}.</strong> <span class="texto-libre">${esc(alcanza(e).texto)}</span></p>
      <p><strong>${esc(RV.limita)} ${esc(sinDato(limita(e).opcion))}.</strong> <span class="texto-libre">${esc(limita(e).texto)}</span></p>
    </li>`).join('');
  return `<h2>${esc(`${ficha.numero}. ${ficha.nombre}`)}</h2>
    ${respondieron(lista.length)}
    <h3>${esc(K.p1)}</h3>
    ${barras(K.p1Opciones, lista.map((e) => alcanza(e).opcion))}
    <h3>${esc(K.p2)}</h3>
    ${barras(K.p2Opciones, lista.map((e) => razon(limita(e).opcion)))}
    <h3>${esc(RV.explicaciones)}</h3>
    ${lista.length ? `<ul class="lista-respuestas">${explicaciones}</ul>` : `<p class="vacio">${esc(RV.sinRespuestas)}</p>`}`;
}

/* ---------- Pestaña Productor ---------- */

function panelProductor(estudiantes) {
  const P = T.productor;
  const lista = estudiantes.filter((e) => Object.keys(e.r).some((k) => k.startsWith('productor|')));
  const dato = (e, ronda, pregunta) => e.r[`productor|${ronda}|${pregunta}`] || {};
  const pesos = (valor) => (valor === undefined || valor === '' ? RV.sinDato : C.formatoPesos(Number(valor)));

  const ronda1 = lista.map((e) => [
    e.nombre,
    nombreFinca(e.finca),
    sinDato(dato(e, '1', 'decision').opcion),
    pesos(dato(e, '1', 'decision').valor),
    sinDato(dato(e, '1', 'frase').texto)
  ]);
  const ronda2 = lista.map((e) => {
    const antes = dato(e, '2', 'decision');
    const despues = dato(e, 'evento', 'decision');
    const familia = despues.valor !== undefined && despues.valor !== ''
      ? `${pesos(antes.valor)} → ${pesos(despues.valor)}`
      : pesos(antes.valor);
    return [e.nombre, sinDato(antes.opcion), sinDato(despues.opcion), familia, sinDato(dato(e, '2', 'frase').texto)];
  });
  const ronda3 = lista.map((e) => [e.nombre, sinDato(dato(e, '3', 'ley').texto)]);

  return `<h2>${esc(P.titulo)}</h2>
    ${respondieron(lista.length)}
    <h3>${esc(P.ronda1.titulo)}</h3>
    ${tabla([RV.estudiante, RV.finca, RV.decision, RV.familia, RV.frase], ronda1)}
    <h3>${esc(P.ronda2.titulo)}</h3>
    ${tabla([RV.estudiante, RV.decision, RV.despuesEvento, RV.familia, RV.frase], ronda2)}
    <h3>${esc(P.ronda3.titulo)}</h3>
    ${tabla([RV.estudiante, P.ronda3.pregunta], ronda3)}`;
}

/* ---------- Pestaña Gerente ---------- */

function panelGerente(estudiantes) {
  const G = T.gerente;
  const lista = estudiantes.filter((e) => Object.keys(e.r).some((k) => k.startsWith('gerente|')));
  const dato = (e, ronda, pregunta) => e.r[`gerente|${ronda}|${pregunta}`] || {};
  const resultado = (pedido) => (pedido ? C.resultadoPedido(C.pedidoGerente(pedido)) : null);
  const ganancia = (r) => (r ? C.formatoPesos(r.gananciaPorKilo) : RV.sinDato);
  const meta = (r) => (r ? siNo(r.cumpleMeta) : RV.sinDato);

  const ronda1 = lista.map((e) => {
    const d = dato(e, '1', 'decision');
    const r = resultado(idDeEtiqueta(G.ronda1.opciones, d.opcion));
    return [e.nombre, sinDato(d.opcion), ganancia(r), meta(r), sinDato(dato(e, '1', 'frase').texto)];
  });
  const ronda2 = lista.map((e) => {
    const d = dato(e, '2', 'decision');
    const ev = dato(e, 'evento', 'decision');
    const idEvento = idDeEtiqueta(G.ronda2.eventoOpciones, ev.opcion);
    const r = idEvento
      ? resultado(PEDIDO_EVENTO_GERENTE[idEvento])
      : resultado(idDeEtiqueta(G.ronda2.opciones, d.opcion));
    return [e.nombre, sinDato(d.opcion), sinDato(ev.opcion), ganancia(r), meta(r), sinDato(dato(e, '2', 'frase').texto)];
  });
  const ronda3 = lista.map((e) => {
    const d = dato(e, '3', 'kilos_asociacion');
    const kilos = d.valor === undefined || d.valor === '' ? null : Number(d.valor);
    const x = Number.isFinite(kilos) ? C.repartoContrato(kilos) : null;
    return [
      e.nombre,
      x ? C.formatoNumero(x.kilosAsociacion) : RV.sinDato,
      x ? C.formatoPorcentaje(x.participacion) : RV.sinDato,
      x ? siNo(x.cumpleLey) : RV.sinDato,
      ganancia(x),
      meta(x),
      sinDato(dato(e, '3', 'costo_ley').texto)
    ];
  });

  return `<h2>${esc(G.titulo)}</h2>
    ${respondieron(lista.length)}
    <h3>${esc(G.ronda1.titulo)}</h3>
    ${tabla([RV.estudiante, RV.decision, RV.ganancia, RV.meta, RV.frase], ronda1)}
    <h3>${esc(G.ronda2.titulo)}</h3>
    ${tabla([RV.estudiante, RV.decision, RV.despuesEvento, RV.ganancia, RV.meta, RV.frase], ronda2)}
    <h3>${esc(G.ronda3.titulo)}</h3>
    ${tabla([RV.estudiante, RV.kilos, RV.participacion, RV.ley, RV.ganancia, RV.meta, G.ronda3.pregunta], ronda3)}`;
}

/* ---------- Pestaña Evaluación ---------- */

function panelEvaluacion(estudiantes) {
  const E = T.evaluacion;
  const lista = estudiantes.filter((e) => Object.keys(e.r).some((k) => k.startsWith('evaluacion|')));
  const dato = (e, pregunta) => e.r[`evaluacion||${pregunta}`] || {};
  const bloques = E.preguntas.map((q) => {
    const items = lista.map((e) => `<li>
        <p class="quien">${esc(e.nombre)}</p>
        <p class="texto-libre">${esc(sinDato(dato(e, q.id).texto))}</p>
      </li>`).join('');
    return `<h3>${esc(q.texto)}</h3>
      ${lista.length ? `<ul class="lista-respuestas">${items}</ul>` : `<p class="vacio">${esc(RV.sinRespuestas)}</p>`}`;
  }).join('');
  const canales = lista.map((e) => `<li>
      <p class="quien">${esc(e.nombre)}</p>
      <p><strong>${esc(sinDato(dato(e, 'canal_final').opcion))}</strong></p>
      <p class="texto-libre">${esc(sinDato(dato(e, 'canal_final').texto))}</p>
    </li>`).join('');
  return `<h2>${esc(E.titulo)}</h2>
    ${respondieron(lista.length)}
    <h3>${esc(E.canal)}</h3>
    ${barras(E.canalOpciones, lista.map((e) => dato(e, 'canal_final').opcion))}
    ${lista.length ? `<ul class="lista-respuestas">${canales}</ul>` : ''}
    ${bloques}`;
}

/* ---------- Pintar ---------- */

function pintarPestanas() {
  contPestanas.innerHTML = PESTANAS.map((p) => `<button type="button" role="tab" class="pestana"
      id="pestana-${p.id}" data-pestana="${p.id}" aria-controls="panel">${esc(p.etiqueta)}</button>`).join('');
  marcarPestana();
}

// Cambia solo los atributos, para que el botón activo conserve el foco.
function marcarPestana() {
  contPestanas.querySelectorAll('[data-pestana]').forEach((boton) => {
    const activa = boton.dataset.pestana === pestana;
    boton.setAttribute('aria-selected', String(activa));
    boton.tabIndex = activa ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', 'pestana-' + pestana);
}

function pintarPanel() {
  // Sin datos, la línea de estado dice si está cargando o si la lectura falló.
  if (!filas) {
    panel.innerHTML = '';
    return;
  }
  const estudiantes = estudiantesDelDia();
  const ficha = FICHAS.find((f) => f.id === pestana);
  if (ficha) panel.innerHTML = panelFicha(ficha, estudiantes);
  else if (pestana === 'productor') panel.innerHTML = panelProductor(estudiantes);
  else if (pestana === 'gerente') panel.innerHTML = panelGerente(estudiantes);
  else panel.innerHTML = panelEvaluacion(estudiantes);
}

function elegirPestana(id, enfocar = false) {
  pestana = id;
  marcarPestana();
  pintarPanel();
  if (enfocar) document.getElementById('pestana-' + id).focus();
}

contPestanas.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-pestana]');
  if (boton) elegirPestana(boton.dataset.pestana);
});

contPestanas.addEventListener('keydown', (evento) => {
  const i = PESTANAS.findIndex((p) => p.id === pestana);
  let destino = null;
  if (evento.key === 'ArrowRight') destino = (i + 1) % PESTANAS.length;
  else if (evento.key === 'ArrowLeft') destino = (i - 1 + PESTANAS.length) % PESTANAS.length;
  else if (evento.key === 'Home') destino = 0;
  else if (evento.key === 'End') destino = PESTANAS.length - 1;
  if (destino === null) return;
  evento.preventDefault();
  elegirPestana(PESTANAS[destino].id, true);
});

campoFecha.value = fechaLocal(new Date());
campoFecha.addEventListener('change', pintarPanel);
document.getElementById('actualizar').addEventListener('click', () => {
  mostrarEstado(RV.cargando);
  cargar();
});

pintarPestanas();
pintarPanel();
cargar();
setInterval(cargar, ACTUALIZAR_MS);
