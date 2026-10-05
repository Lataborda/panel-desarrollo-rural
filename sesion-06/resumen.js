// Lógica de la vista del profesor. Lee los registros del Apps Script de la sesión 6 y los resume por pestaña.
import { URL_APPS_SCRIPT, CURSO, SESION, ACTIVIDAD, CLAVE_SESION } from './config.js';
import { HOGARES, FUENTES, TEXTOS as T } from './datos.js';
import * as C from './calculos.js';

const RV = T.resumenVista;
const P = T.proyecto;
const K = T.cierre;
const ACTUALIZAR_MS = 20000;
const LIMITE_ESPERA_MS = 20000;
const REGISTRO_EN_LINEA = /^https?:\/\//.test(URL_APPS_SCRIPT) && !URL_APPS_SCRIPT.includes('PEGAR_AQUI');

const PESTANAS = ['trimestres', 'proyecto', 'anio', 'mra', 'cierre'].map((id, i) => ({ id, etiqueta: RV.pestanas[i] }));

const campoFecha = document.getElementById('fecha');
const estadoCarga = document.getElementById('estado');
const contPestanas = document.getElementById('pestanas');
const panel = document.getElementById('panel');

let filas = null;
let pestana = PESTANAS[0].id;
const abiertos = new Set();

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

const vacio = (v) => v === undefined || v === null || v === '';
const numero = (v) => (vacio(v) ? null : Number(v));
const cifra = (v) => (numero(v) === null || Number.isNaN(numero(v)) ? RV.sinDato : C.formatoNumero(numero(v)));
const claseSaldo = (v) => (numero(v) !== null && numero(v) < 0 ? 'neg' : 'pos');
const nombreHogar = (id) => {
  const h = HOGARES.find((x) => String(x.id) === String(id));
  return h ? `${h.id}. ${h.nombre}` : RV.sinDato;
};

/* ---------- Lectura ---------- */

function urlLectura(extra = {}) {
  const parametros = new URLSearchParams({ curso: CURSO, sesion: SESION, actividad: ACTIVIDAD, fecha: campoFecha.value, ...extra });
  return URL_APPS_SCRIPT + (URL_APPS_SCRIPT.includes('?') ? '&' : '?') + parametros.toString();
}

async function leerConFetch() {
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = control ? setTimeout(() => control.abort(), LIMITE_ESPERA_MS) : null;
  try {
    const respuesta = await fetch(urlLectura(), control ? { signal: control.signal } : {});
    return await respuesta.json();
  } finally {
    clearTimeout(reloj);
  }
}

let contadorJsonp = 0;
function leerConJsonp() {
  return new Promise((resolver, rechazar) => {
    contadorJsonp += 1;
    const nombre = `drSesion6Datos${Date.now()}${contadorJsonp}`;
    const script = document.createElement('script');
    const limpiar = () => {
      clearTimeout(reloj);
      delete window[nombre];
      script.remove();
    };
    const reloj = setTimeout(() => {
      limpiar();
      rechazar(new Error('Tiempo de espera agotado'));
    }, LIMITE_ESPERA_MS);
    window[nombre] = (datos) => {
      limpiar();
      resolver(datos);
    };
    script.onerror = () => {
      limpiar();
      rechazar(new Error('No se pudo cargar el script'));
    };
    script.src = urlLectura({ callback: nombre });
    document.head.appendChild(script);
  });
}

const valido = (datos) => Boolean(datos && datos.ok && Array.isArray(datos.filas));

let cargando = false;
async function cargar() {
  if (!REGISTRO_EN_LINEA) {
    mostrarEstado(RV.error, true);
    pintarPanel();
    return;
  }
  if (cargando) return;
  cargando = true;
  try {
    let datos = null;
    try {
      datos = await leerConFetch();
    } catch (error) {
      datos = null;
    }
    if (!valido(datos)) datos = await leerConJsonp();
    if (!valido(datos)) throw new Error('Respuesta inválida');
    filas = datos.filas;
    mostrarEstado(t(RV.actualizado, { hora: horaLocal() }));
  } catch (error) {
    mostrarEstado(RV.error, true);
  } finally {
    cargando = false;
  }
  pintarPanel();
}

/* ---------- Armado por estudiante ---------- */

// Filas del día con la clave de la sesión. Si una sección se envió dos veces, queda la última fila.
function ultimasFilas() {
  const fecha = campoFecha.value;
  const mapa = new Map();
  (filas || []).forEach((f, orden) => {
    if (String(f.clave) !== CLAVE_SESION) return;
    const momento = new Date(f.fecha_servidor);
    if (Number.isNaN(momento.getTime()) || fechaLocal(momento) !== fecha) return;
    const clave = [f.id_estudiante, f.seccion, f.trimestre, f.pregunta].join('|');
    const previa = mapa.get(clave);
    if (!previa || momento.getTime() >= previa.momento) mapa.set(clave, { ...f, momento: momento.getTime(), orden });
  });
  return [...mapa.values()];
}

function estudiantes() {
  const lista = new Map();
  for (const f of ultimasFilas()) {
    const id = f.id_estudiante || f.estudiante;
    if (!lista.has(id)) {
      lista.set(id, { id, nombre: f.estudiante, hogar: f.hogar, momento: f.momento, trimestres: {}, razon: null, resumen: null, proyecto: {}, cierre: {} });
    }
    const e = lista.get(id);
    if (f.momento >= e.momento) {
      e.nombre = f.estudiante || e.nombre;
      e.hogar = vacio(f.hogar) ? e.hogar : f.hogar;
      e.momento = f.momento;
    }
    if (f.seccion === 'trimestre' && f.pregunta === 'proyecto_razon') e.razon = f;
    else if (f.seccion === 'trimestre') e.trimestres[Number(f.trimestre)] = f;
    else if (f.seccion === 'resumen') e.resumen = f;
    else if (f.seccion === 'proyecto') e.proyecto[f.pregunta] = f;
    else if (f.seccion === 'cierre') e.cierre[f.pregunta] = f;
  }
  return [...lista.values()].sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'));
}

/* ---------- Piezas ---------- */

function barras(opciones, valores) {
  const total = valores.filter(Boolean).length;
  const filasBarras = opciones.map((o) => {
    const n = valores.filter((v) => v === o.valor).length;
    const ancho = total ? (n / total) * 100 : 0;
    return `<div class="barra-fila">
      <span>${esc(o.texto)}</span>
      <div class="barra-pista" aria-hidden="true"><div class="barra-relleno" style="width:${ancho.toFixed(1)}%"></div></div>
      <span class="barra-cuenta">${n}</span>
    </div>`;
  }).join('');
  return `<div class="barras">${filasBarras}</div>`;
}

function respondieron(n) {
  return `<p>${esc(n === 1 ? RV.respondioUno : t(RV.respondieron, { n }))}</p>`;
}

const sinRespuestas = () => `<p class="vacio">${esc(RV.sinRespuestas)}</p>`;

function tabla(columnas, cuerpo) {
  return `<div class="tabla-envoltura"><table>
    <thead><tr>${columnas.map((c, i) => `<th scope="col"${c.numero ? ' class="numero"' : ''}>${esc(c.texto || c)}</th>`).join('')}</tr></thead>
    <tbody>${cuerpo}</tbody>
  </table></div>`;
}

function repartoDe(f) {
  const partes = ['cacao', 'huerta', 'jornal', 'oficio', 'proyecto', 'contratadas']
    .filter((a) => numero(f[a]) > 0)
    .map((a) => `${a} ${numero(f[a])}`);
  partes.push(`libres ${cifra(f.libres)}`);
  return partes.join(' · ');
}

/* ---------- Pestañas ---------- */

function panelTrimestres(lista) {
  if (!lista.length) return sinRespuestas();
  const columnas = [RV.estudiante, RV.hogar, ...[1, 2, 3, 4].map((n) => ({ texto: 'T' + n, numero: true })), RV.reparto];
  const cuerpo = lista.map((e) => {
    const enviados = [1, 2, 3, 4].filter((n) => e.trimestres[n]);
    const ultimo = enviados.length ? e.trimestres[enviados[enviados.length - 1]] : null;
    const abierto = abiertos.has(e.id);
    const idFrases = 'frases-' + encodeURIComponent(e.id).replace(/%/g, '');
    const saldos = [1, 2, 3, 4].map((n) => {
      const f = e.trimestres[n];
      return `<td class="numero saldo-celda ${f ? claseSaldo(f.saldo) : ''}">${f ? cifra(f.saldo) : ''}</td>`;
    }).join('');
    const frases = enviados.map((n) => {
      const f = e.trimestres[n];
      const migra = !vacio(f.migra) && Number(f.migra) === n ? ` (${t(RV.migra, { t: n })})` : '';
      return `<li><strong>T${n}${esc(migra)}.</strong> <span class="texto-libre">${esc(f.texto)}</span></li>`;
    }).join('');
    return `<tr>
        <th scope="row"><button type="button" class="boton-enlace" data-abrir="${esc(e.id)}" aria-expanded="${abierto}"
          aria-controls="${idFrases}">${esc(e.nombre)}</button></th>
        <td>${esc(nombreHogar(e.hogar))}</td>
        ${saldos}
        <td>${ultimo ? esc(t(RV.repartoEn, { t: ultimo.trimestre, reparto: repartoDe(ultimo) })) : ''}</td>
      </tr>
      <tr class="frases" id="${idFrases}"${abierto ? '' : ' hidden'}><td colspan="7">
        <p><strong>${esc(RV.frases)}</strong></p>
        ${frases ? `<ul>${frases}</ul>` : `<p class="vacio">${esc(RV.sinRespuestas)}</p>`}
      </td></tr>`;
  }).join('');
  return `<h2>${esc(RV.pestanas[0])}</h2>${respondieron(lista.length)}${tabla(columnas, cuerpo)}`;
}

function panelProyecto(lista) {
  const conDecision = lista.filter((e) => e.trimestres[2]);
  if (!conDecision.length) return `<h2>${esc(RV.pestanas[1])}</h2>${sinRespuestas()}`;
  const etiqueta = { toma: RV.toma, no_toma: RV.noToma, sin_tierra: RV.sinTierra };
  const conteo = (v) => conDecision.filter((e) => e.trimestres[2].decision === v).length;
  const cuerpo = conDecision.map((e) => `<tr>
      <th scope="row">${esc(e.nombre)}</th>
      <td>${esc(nombreHogar(e.hogar))}</td>
      <td>${esc(etiqueta[e.trimestres[2].decision] || RV.sinDato)}</td>
      <td class="texto-libre">${esc(e.razon ? e.razon.texto : '')}</td>
    </tr>`).join('');
  return `<h2>${esc(RV.pestanas[1])}</h2>
    <div class="conteos">
      <span>${esc(RV.toma)}: ${conteo('toma')}</span>
      <span>${esc(RV.noToma)}: ${conteo('no_toma')}</span>
      <span>${esc(RV.sinTierra)}: ${conteo('sin_tierra')}</span>
    </div>
    ${tabla([RV.estudiante, RV.hogar, RV.decision, RV.razon], cuerpo)}`;
}

function panelAnio(lista) {
  const conResumen = lista.filter((e) => e.resumen);
  if (!conResumen.length) return `<h2>${esc(RV.pestanas[2])}</h2>${sinRespuestas()}`;
  const cubren = conResumen.filter((e) => e.resumen.decision === 'cubre').length;
  const cuerpo = conResumen.map((e) => {
    const r = e.resumen;
    const total = numero(r.ingresos);
    const parte = total ? numero(r.cosecha) / total : 0;
    const cubre = r.decision === 'cubre';
    return `<tr>
      <th scope="row">${esc(e.nombre)}</th>
      <td>${esc(nombreHogar(e.hogar))}</td>
      <td class="numero">${cifra(r.cosecha)}</td>
      <td class="numero">${cifra(total)}</td>
      <td class="numero">${esc(C.formatoPorcentaje(parte))}</td>
      <td class="numero">${cifra(r.libres)}</td>
      <td><span class="insignia ${cubre ? 'bien' : 'mal'}">${esc(cubre ? T.si : T.no)}</span></td>
    </tr>`;
  }).join('');
  const columnas = [RV.estudiante, RV.hogar, { texto: RV.ingresoFinca, numero: true }, { texto: RV.ingresoTotal, numero: true },
    { texto: RV.parteFinca, numero: true }, { texto: RV.libres, numero: true }, RV.cubre];
  return `<h2>${esc(RV.pestanas[2])}</h2>
    ${tabla(columnas, cuerpo)}
    <p class="conteos"><span>${esc(t(RV.cubrieron, { n: cubren, total: conResumen.length }))}</span></p>
    <p class="dato-dane">${esc(RV.dane)}</p>
    <p class="fuente">${esc(t(T.fuente, { fuente: FUENTES.dane }))}</p>`;
}

function listaRespuestas(items) {
  if (!items.length) return sinRespuestas();
  return `<ul class="lista-respuestas">${items.map((i) => `<li>
      <p class="quien">${esc(i.nombre)}${i.extra ? ` · ${esc(i.extra)}` : ''}</p>
      <p class="texto-libre">${esc(i.texto)}</p>
    </li>`).join('')}</ul>`;
}

function panelMRA(lista) {
  const preguntas = ['p1', 'p2', 'p3', 'p4', 'p5', 'p6'];
  const conRespuestas = lista.filter((e) => preguntas.some((p) => e.proyecto[p]));
  const opcion = (v) => (P.p2Opciones.find((o) => o.valor === v) || {}).texto || '';
  const bloques = preguntas.map((p, i) => {
    const items = conRespuestas.filter((e) => e.proyecto[p]).map((e) => ({
      nombre: e.nombre,
      extra: p === 'p2' ? opcion(e.proyecto[p].decision) : nombreHogar(e.hogar),
      texto: e.proyecto[p].texto
    }));
    const grafico = p === 'p2' ? barras(P.p2Opciones, conRespuestas.map((e) => e.proyecto.p2 && e.proyecto.p2.decision)) : '';
    return `<h3>${esc(`${i + 1}. ${P[p]}`)}</h3>${grafico}${listaRespuestas(items)}`;
  }).join('');
  return `<h2>${esc(RV.pestanas[3])}</h2>${respondieron(conRespuestas.length)}${bloques}`;
}

function panelCierre(lista) {
  const preguntas = ['c1', 'c2', 'c3'];
  const conRespuestas = lista.filter((e) => preguntas.some((c) => e.cierre[c]));
  const bloques = preguntas.map((c, i) => {
    const items = conRespuestas.filter((e) => e.cierre[c]).map((e) => ({ nombre: e.nombre, extra: nombreHogar(e.hogar), texto: e.cierre[c].texto }));
    return `<h3>${esc(`${i + 1}. ${K[c]}`)}</h3>${listaRespuestas(items)}`;
  }).join('');
  return `<h2>${esc(RV.pestanas[4])}</h2>${respondieron(conRespuestas.length)}${bloques}`;
}

/* ---------- Pestañas y pintura ---------- */

function pintarPestanas() {
  contPestanas.innerHTML = PESTANAS.map((p) => `<button type="button" role="tab" class="pestana" id="pestana-${p.id}"
      data-pestana="${p.id}" aria-controls="panel">${esc(p.etiqueta)}</button>`).join('');
  marcarPestana();
}

function marcarPestana() {
  contPestanas.querySelectorAll('[data-pestana]').forEach((b) => {
    const activa = b.dataset.pestana === pestana;
    b.setAttribute('aria-selected', String(activa));
    b.tabIndex = activa ? 0 : -1;
  });
  panel.setAttribute('aria-labelledby', 'pestana-' + pestana);
}

function pintarPanel() {
  // Sin datos, la línea de estado dice si está cargando o si la lectura falló.
  if (!filas) {
    panel.innerHTML = '';
    return;
  }
  const lista = estudiantes();
  const paneles = { trimestres: panelTrimestres, proyecto: panelProyecto, anio: panelAnio, mra: panelMRA, cierre: panelCierre };
  panel.innerHTML = paneles[pestana](lista);
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

// Al tocar el nombre de un estudiante se abren sus frases de reparto.
panel.addEventListener('click', (evento) => {
  const boton = evento.target.closest('[data-abrir]');
  if (!boton) return;
  const id = boton.dataset.abrir;
  if (abiertos.has(id)) abiertos.delete(id);
  else abiertos.add(id);
  const abierto = abiertos.has(id);
  boton.setAttribute('aria-expanded', String(abierto));
  const filaFrases = document.getElementById(boton.getAttribute('aria-controls'));
  if (filaFrases) filaFrases.hidden = !abierto;
});

campoFecha.value = fechaLocal(new Date());
campoFecha.addEventListener('change', () => {
  mostrarEstado(RV.cargando);
  cargar();
});
document.getElementById('actualizar').addEventListener('click', () => {
  mostrarEstado(RV.cargando);
  cargar();
});

pintarPestanas();
pintarPanel();
cargar();
setInterval(cargar, ACTUALIZAR_MS);
