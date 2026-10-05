// Lógica de la página de los estudiantes. Sesión 6, taller de medios de vida rurales.
import { URL_APPS_SCRIPT, CURSO, SESION, ACTIVIDAD, CLAVE_SESION } from './config.js';
import { HOGARES, EVENTOS, REGLAS, GLOSARIO, MRA, FUENTES, TEXTOS as T } from './datos.js';
import * as C from './calculos.js';

const CLAVE_ESTADO = 'dr5001462s6_estado';
const CLAVE_COLA = 'dr5001462s6_cola';
const CLAVE_ID = 'dr5001462s6_id';
const MINIMO_CARACTERES = 15;
const REINTENTO_MS = 30000;
const LIMITE_ESPERA_MS = 30000;
const REGISTRO_EN_LINEA = /^https?:\/\//.test(URL_APPS_SCRIPT) && !URL_APPS_SCRIPT.includes('PEGAR_AQUI');

// Secciones. Los trimestres van de la sección 2 a la 5.
const S = { inicio: 0, hogar: 1, t1: 2, anio: 6, proyecto: 7, cierre: 8 };
const seccionDeTrimestre = (t) => t + 1;
const trimestreDeSeccion = (i) => (i >= 2 && i <= 5 ? i - 1 : 0);

// Columnas de la hoja, en orden. fecha_servidor la pone el Apps Script.
const COLUMNAS = ['hora_cliente', 'clave', 'curso', 'sesion', 'actividad', 'id_estudiante', 'estudiante', 'hogar',
  'seccion', 'trimestre', 'cacao', 'huerta', 'jornal', 'oficio', 'proyecto', 'contratadas', 'libres', 'migra',
  'cosecha', 'ingresos', 'gastos', 'saldo', 'decision', 'pregunta', 'texto'];

/* ---------- Almacenamiento local ---------- */

function leerLocal(clave, porDefecto) {
  try {
    const crudo = localStorage.getItem(clave);
    return crudo === null ? porDefecto : JSON.parse(crudo);
  } catch (error) {
    return porDefecto;
  }
}

function guardarLocal(clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor));
  } catch (error) {
    // Sin almacenamiento local, el avance vive solo mientras la página esté abierta.
  }
}

function borrarLocal(clave) {
  try {
    localStorage.removeItem(clave);
  } catch (error) {
    // Nada que borrar.
  }
}

function nuevoId() {
  try {
    const bytes = new Uint8Array(8);
    crypto.getRandomValues(bytes);
    return 'e-' + Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  } catch (error) {
    return 'e-' + Math.random().toString(16).slice(2) + Date.now().toString(16);
  }
}

let idEnMemoria = null;
function idEstudiante() {
  if (!idEnMemoria) idEnMemoria = leerLocal(CLAVE_ID, null);
  if (!idEnMemoria) {
    idEnMemoria = nuevoId();
    guardarLocal(CLAVE_ID, idEnMemoria);
  }
  return idEnMemoria;
}

/* ---------- Estado ---------- */

function estadoInicial() {
  return {
    version: 1,
    nombre: '',
    hogar: 0,
    seccion: 0,
    seccionMax: 0,
    repartos: [1, 2, 3, 4].map(() => C.repartoVacio()),
    iniciados: [false, false, false, false],
    enviados: [false, false, false, false],
    frases: ['', '', '', ''],
    proyecto: '',          // 'toma' o 'no_toma'. Se puede cambiar hasta enviar el trimestre 2.
    razonProyecto: '',
    migra: 0,              // Hogar 2: trimestre en que se fue el hijo. 0 si no se ha ido.
    resumenEnviado: false,
    respuestasProyecto: null,
    cierre: null,
    borradores: {},
    registrado: false
  };
}

function cargarEstado() {
  const guardado = leerLocal(CLAVE_ESTADO, null);
  if (!guardado || guardado.version !== 1) return estadoInicial();
  return Object.assign(estadoInicial(), guardado);
}

let estado = cargarEstado();

function guardarEstado() {
  guardarLocal(CLAVE_ESTADO, estado);
}

function borrador(clave, porDefecto = '') {
  const valor = estado.borradores[clave];
  return valor === undefined ? porDefecto : valor;
}

let relojBorrador = null;
function guardarBorrador(clave, valor) {
  estado.borradores[clave] = valor;
  clearTimeout(relojBorrador);
  relojBorrador = setTimeout(guardarEstado, 300);
}

const hogar = () => HOGARES.find((h) => h.id === estado.hogar) || HOGARES[0];
const toma = () => estado.proyecto === 'toma';
const resultado = () => C.calcular(hogar(), estado.repartos, estado.migra);

/* ---------- Registro en Google Sheets ---------- */

let colaEnMemoria = null;

function leerCola() {
  const cola = leerLocal(CLAVE_COLA, null);
  if (Array.isArray(cola)) return cola;
  return colaEnMemoria || [];
}

function guardarCola(cola) {
  colaEnMemoria = cola;
  guardarLocal(CLAVE_COLA, cola);
}

// Una fila de la hoja con todas las columnas. Las que no aplican quedan vacías.
function fila(datos) {
  const base = {
    hora_cliente: new Date().toISOString(),
    clave: CLAVE_SESION,
    curso: CURSO,
    sesion: SESION,
    actividad: ACTIVIDAD,
    id_estudiante: idEstudiante(),
    estudiante: estado.nombre,
    hogar: estado.hogar
  };
  const completa = { ...base, ...datos };
  const salida = {};
  COLUMNAS.forEach((c) => {
    const v = completa[c];
    salida[c] = v === undefined || v === null ? '' : (typeof v === 'number' ? Math.round(v) : v);
  });
  return salida;
}

// Un envío puede tener varias filas. Se guarda en la cola y se manda junto.
function registrar(filas) {
  if (!REGISTRO_EN_LINEA) return;
  const cola = leerCola();
  cola.push({ id: nuevoId(), carga: { clave: CLAVE_SESION, filas: filas.map(fila) } });
  guardarCola(cola);
}

function pedirConLimite(url, opciones) {
  const control = typeof AbortController === 'function' ? new AbortController() : null;
  const reloj = control ? setTimeout(() => control.abort(), LIMITE_ESPERA_MS) : null;
  const pedido = fetch(url, control ? { ...opciones, signal: control.signal } : opciones);
  return pedido.finally(() => clearTimeout(reloj));
}

async function enviarCarga(carga) {
  const cuerpo = JSON.stringify(carga);
  let respuesta;
  try {
    respuesta = await pedirConLimite(URL_APPS_SCRIPT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: cuerpo
    });
  } catch (error) {
    if (error && error.name === 'AbortError') return false;
    // Segundo intento sin CORS. El navegador no puede leer la respuesta: la fila se marca como enviada.
    try {
      await pedirConLimite(URL_APPS_SCRIPT, {
        method: 'POST',
        mode: 'no-cors',
        body: new URLSearchParams({ data: cuerpo })
      });
      return true;
    } catch (segundoError) {
      return false;
    }
  }
  try {
    const datos = await respuesta.json();
    return Boolean(datos && datos.ok);
  } catch (error) {
    return false;
  }
}

let enviando = false;
async function vaciarCola() {
  if (!REGISTRO_EN_LINEA || enviando) return;
  enviando = true;
  try {
    for (;;) {
      const cola = leerCola();
      if (!cola.length) break;
      const item = cola[0];
      const enviado = await enviarCarga(item.carga);
      if (!enviado) break;
      guardarCola(leerCola().filter((x) => x.id !== item.id));
      if (!estado.registrado) {
        estado.registrado = true;
        guardarEstado();
      }
      pintarIndicador();
    }
  } finally {
    enviando = false;
    pintarIndicador();
  }
}

/* ---------- Utilidades de texto ---------- */

const ENTIDADES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function esc(valor) {
  return String(valor === undefined || valor === null ? '' : valor).replace(/[&<>"']/g, (c) => ENTIDADES[c]);
}

// Texto fijo: evita que "30 %" se parta en dos líneas.
function txt(valor) {
  return esc(valor).replace(/(\d) %/g, '$1&nbsp;%');
}

function t(plantilla, datos = {}) {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => (k in datos ? datos[k] : ''));
}

function cambiarTexto(el, texto) {
  if (el && el.textContent !== texto) el.textContent = texto;
}

const num = (n) => C.formatoNumero(n);
const pesos = (n) => C.formatoPesos(n);
const signo = (n) => (Math.round(n) < 0 ? 'neg' : 'pos');

/* ---------- Piezas de la interfaz ---------- */

function etiquetaIlustrativa(nota = '') {
  return `<span class="etiqueta-ilustrativo"><span class="ilustrativo">${esc(T.valorIlustrativo)}</span>`
    + `${nota ? `<span>${txt(nota)}</span>` : ''}</span>`;
}

function fuente(texto) {
  return `<span class="fuente">${txt(t(T.fuente, { fuente: texto }))}</span>`;
}

function botonEnviar(texto, id = '') {
  return `<div class="acciones"><button type="submit" class="boton"${id ? ` id="${id}"` : ''}>${esc(texto)}</button></div>`;
}

function botonSeguir(accion, texto, id = 'boton-siguiente') {
  return `<div class="acciones"><button type="button" class="boton" id="${id}" data-accion="${accion}">${esc(texto)}</button></div>`;
}

function grupoOpciones({ nombre, leyenda, opciones, elegida }) {
  const idError = 'error-' + nombre;
  const items = opciones.map((o) => {
    const marcada = o.valor === elegida;
    return `<label class="opcion${marcada ? ' elegida' : ''}">
        <input type="radio" name="${nombre}" value="${esc(o.valor)}"${marcada ? ' checked' : ''}>
        <span>${txt(o.texto)}</span>
      </label>`;
  }).join('');
  return `<fieldset aria-describedby="${idError}">
    <legend>${txt(leyenda)}</legend>
    <div class="opciones">${items}</div>
    <p class="error" id="${idError}" hidden></p>
  </fieldset>`;
}

function respuestaFija(etiqueta, valor, id = '') {
  return `<div class="respuesta-fija"${id ? ` id="${id}" tabindex="-1"` : ''}>
    <p class="etiqueta">${txt(etiqueta)}</p>
    <p class="texto">${esc(valor)}</p>
  </div>`;
}

function campoTexto({ id, etiqueta, valorFijo }) {
  if (valorFijo) return respuestaFija(etiqueta, valorFijo);
  return `<label class="campo" for="${id}">${txt(etiqueta)}</label>
    <textarea id="${id}" name="${id}" rows="3" aria-describedby="error-${id}">${esc(borrador(id))}</textarea>
    <p class="error" id="error-${id}" hidden></p>`;
}

function aviso(texto, id = 'aviso') {
  return `<p class="aviso" id="${id}" tabindex="-1">${txt(texto)}</p>`;
}

function listaGlosario() {
  return `<dl class="glosario-lista">${GLOSARIO.map((g) => `<div>
      <dt>${esc(g.termino)}</dt>
      <dd>${txt(g.definicion)}</dd>
    </div>`).join('')}</dl>`;
}

/* ---------- Validación ---------- */

function marcarError(idError, mensaje, campo) {
  const p = document.getElementById(idError);
  if (p) {
    p.textContent = mensaje;
    p.hidden = false;
  }
  if (campo && campo.type !== 'radio') campo.setAttribute('aria-invalid', 'true');
}

function limpiarError(campo) {
  const idError = campo.type === 'radio' ? 'error-' + campo.name : 'error-' + campo.id;
  const p = document.getElementById(idError);
  if (p) {
    p.hidden = true;
    p.textContent = '';
  }
  campo.removeAttribute('aria-invalid');
}

// reglas: { tipo: 'opcion', nombre } | { tipo: 'texto', id }
function validar(form, reglas) {
  form.querySelectorAll('.error').forEach((p) => { p.hidden = true; p.textContent = ''; });
  form.querySelectorAll('[aria-invalid]').forEach((c) => c.removeAttribute('aria-invalid'));
  const valores = {};
  let primero = null;
  for (const regla of reglas) {
    if (regla.tipo === 'opcion') {
      const marcado = form.querySelector(`input[name="${regla.nombre}"]:checked`);
      if (marcado) {
        valores[regla.nombre] = marcado.value;
      } else {
        const primeraOpcion = form.querySelector(`input[name="${regla.nombre}"]`);
        marcarError('error-' + regla.nombre, regla.mensaje || T.errores.opcion, primeraOpcion);
        primero = primero || primeraOpcion;
      }
      continue;
    }
    const campo = form.querySelector('#' + regla.id);
    const valor = campo.value.trim();
    if (valor.length >= MINIMO_CARACTERES) {
      valores[regla.id] = valor;
    } else {
      marcarError('error-' + regla.id, t(T.errores.minimo, { n: valor.length }), campo);
      primero = primero || campo;
    }
  }
  if (primero) {
    primero.focus();
    return null;
  }
  return valores;
}

/* ---------- Cabecera, indicador y reinicio ---------- */

function seccionTerminada(i) {
  const tr = trimestreDeSeccion(i);
  if (tr) return estado.enviados[tr - 1];
  switch (i) {
    case S.inicio: return Boolean(estado.nombre && estado.hogar);
    case S.hogar: return estado.seccionMax > S.hogar;
    case S.anio: return estado.resumenEnviado;
    case S.proyecto: return Boolean(estado.respuestasProyecto);
    default: return Boolean(estado.cierre);
  }
}

function pintarAvance() {
  const lista = document.getElementById('avance');
  lista.innerHTML = T.secciones.map((nombre, i) => {
    const abierta = i <= estado.seccionMax;
    const hecha = seccionTerminada(i);
    const clases = [abierta ? 'abierta' : '', hecha ? 'hecha' : ''].filter(Boolean).join(' ');
    const etiqueta = `${i + 1}. ${nombre}${hecha ? '. Terminada' : ''}`;
    return `<li><button type="button" class="${clases}" data-accion="ir-seccion" data-seccion="${i}"`
      + `${i === estado.seccion ? ' aria-current="step"' : ''}${abierta ? '' : ' disabled'} aria-label="${esc(etiqueta)}">`
      + '<span class="barra" aria-hidden="true"></span>'
      + `<span class="numero" aria-hidden="true">${i + 1}</span>`
      + `<span class="nombre" aria-hidden="true">${esc(T.seccionesCortas[i])}</span>`
      + '</button></li>';
  }).join('');
  cambiarTexto(
    document.getElementById('avance-texto'),
    `${t(T.seccionDe, { n: estado.seccion + 1 })} · ${T.secciones[estado.seccion]}`
  );
}

function pintarIndicador() {
  const el = document.getElementById('indicador');
  let clase = 'indicador';
  let texto = '';
  if (!REGISTRO_EN_LINEA) {
    clase += ' sin-url';
    texto = T.indicador.sinUrl;
  } else if (leerCola().length) {
    clase += ' pendiente';
    texto = T.indicador.pendiente;
  } else if (estado.registrado) {
    clase += ' registrado';
    texto = T.indicador.registrado;
  }
  if (el.className !== clase) el.className = clase;
  cambiarTexto(el, texto);
}

let confirmandoReinicio = false;
function pintarReinicio() {
  const caja = document.getElementById('reinicio');
  if (!estado.nombre) {
    caja.innerHTML = '';
    return;
  }
  caja.innerHTML = confirmandoReinicio
    ? `<p id="pregunta-reinicio">${esc(T.reinicio.pregunta)}</p>
       <div class="acciones">
         <button type="button" class="boton pequeno" data-accion="reiniciar-si">${esc(T.reinicio.si)}</button>
         <button type="button" class="boton secundario pequeno" id="reiniciar-no" data-accion="reiniciar-no">${esc(T.reinicio.no)}</button>
       </div>`
    : `<button type="button" class="boton secundario pequeno" id="reiniciar" data-accion="reiniciar">${esc(T.reinicio.boton)}</button>`;
}

/* ---------- Inicio ---------- */

const nombreHogar = (h) => `Hogar ${h.id}. ${h.nombre}`;

function vistaInicio() {
  const I = T.inicio;
  const cuerpo = estado.nombre
    ? `${respuestaFija(I.campoNombre, estado.nombre)}
       ${respuestaFija(I.hogarElegido, nombreHogar(hogar()))}
       ${botonSeguir('seguir-avance', I.seguir)}`
    : `<form data-accion="empezar" novalidate>
         <label class="campo" for="nombre">${esc(I.campoNombre)}</label>
         <input type="text" id="nombre" name="nombre" autocomplete="name" autocapitalize="words" maxlength="80"
           value="${esc(borrador('nombre'))}" aria-describedby="error-nombre">
         <p class="error" id="error-nombre" hidden></p>
         ${grupoOpciones({
           nombre: 'hogar',
           leyenda: I.campoHogar,
           opciones: HOGARES.map((h) => ({ valor: String(h.id), texto: nombreHogar(h) })),
           elegida: borrador('hogar')
         })}
         ${botonEnviar(I.boton)}
       </form>`;
  return `<h1 id="titulo" tabindex="-1">${esc(I.titulo)}</h1>
    <p>${esc(I.texto)}</p>
    ${cuerpo}`;
}

/* ---------- Hogar ---------- */

function tierraDe(h) {
  const H = T.hogar;
  if (h.ha === 1) return H.tierraUnaHa;
  if (h.ha > 1) return t(H.tierraHa, { ha: h.ha });
  if (h.joven > 0) return t(H.tierraJoven, { joven: h.joven });
  return H.sinTierra;
}

function tarjetaHogar(h) {
  const filas = h.tarjeta.map((x) => `<div>
      <dt>${esc(x.etiqueta)}</dt>
      <dd>${txt(x.texto)}${x.ilustrativo ? etiquetaIlustrativa(x.notaIlustrativo) : ''}${x.fuente ? fuente(x.fuente) : ''}</dd>
    </div>`).join('');
  return `<div class="tarjeta">
    <p class="subtitulo">${esc(t(T.hogar.resumen, { personas: h.personas, fichas: h.fichas, tierra: tierraDe(h) }))}</p>
    <dl class="datos">${filas}</dl>
  </div>`;
}

function listaReglas() {
  return `<ol class="reglas">${REGLAS.map((r) => `<li>${txt(r.texto)}`
    + `${r.ilustrativo ? etiquetaIlustrativa() : ''}${r.fuente ? fuente(r.fuente) : ''}</li>`).join('')}</ol>`;
}

function vistaHogar() {
  const h = hogar();
  const H = T.hogar;
  return `<h1 id="titulo" tabindex="-1">${esc(t(H.titulo, { id: h.id, nombre: h.nombre }))}</h1>
    ${tarjetaHogar(h)}
    <h2>${esc(H.reglas)}</h2>
    ${listaReglas()}
    <details class="glosario">
      <summary>${esc(H.glosario)}</summary>
      ${listaGlosario()}
    </details>
    ${botonSeguir('ir-t1', H.boton)}`;
}

/* ---------- Trimestres ---------- */

function bloqueEvento(tr) {
  const ev = EVENTOS[tr - 1];
  const notas = (ev.notas || []).map((n) => (n.tipo === 'fuente' ? fuente(n.texto) : etiquetaIlustrativa(n.texto))).join('');
  return `<section class="evento" aria-labelledby="evento-titulo">
    <span class="eti">${esc(T.trimestre.evento)}</span>
    <h2 id="evento-titulo">${esc(ev.titulo)}</h2>
    <p>${txt(ev.texto)}</p>
    ${notas}
  </section>`;
}

// Letras de las fichas propias, en orden. Las contratadas reemplazan primero al cacao y luego al proyecto.
function letrasFichas(d) {
  const L = T.actividades.letra;
  const contratadasCacao = Math.min(d.contratadas, d.cacao);
  const contratadasProyecto = d.contratadas - contratadasCacao;
  const propias = {
    cacao: d.cacao - contratadasCacao,
    huerta: d.huerta,
    jornal: d.jornal,
    oficio: d.oficio,
    proyecto: Math.max(0, d.proyecto - contratadasProyecto)
  };
  return Object.keys(propias).flatMap((a) => Array(Math.max(0, propias[a])).fill(L[a]));
}

function fichero(d, fichas) {
  const letras = letrasFichas(d);
  const total = Math.max(fichas, letras.length);
  const fichasHtml = Array.from({ length: total }, (_, i) => {
    if (i >= fichas) return `<li class="ficha falta">${esc(letras[i])}</li>`;
    if (i < letras.length) return `<li class="ficha usada">${esc(letras[i])}</li>`;
    return '<li class="ficha"></li>';
  }).join('');
  return `<ul class="fichero" aria-hidden="true">${fichasHtml}</ul>
    <p class="leyenda-fichas" aria-hidden="true">${esc(T.actividades.leyenda)}</p>`;
}

// Controles que aplican al hogar en el trimestre.
function controlesDe(h, tr, d) {
  const A = T.actividades;
  const max = C.maximos(h, tr, d, toma());
  const lista = [];
  if (max.cacao) {
    const a = h.ha > 0 ? A.cacao : A.cacaoJoven;
    lista.push({ campo: 'cacao', nombre: a.nombre, ayuda: a.ayuda, max: max.cacao });
  }
  if (max.huerta) lista.push({ campo: 'huerta', nombre: A.huerta.nombre, ayuda: A.huerta.ayuda, max: 1 });
  if (max.jornal) lista.push({ campo: 'jornal', nombre: A.jornal.nombre, ayuda: t(A.jornal.ayuda, { max: max.jornal }), max: max.jornal });
  if (max.oficio) {
    lista.push({
      campo: 'oficio', nombre: A.oficio.nombre, max: max.oficio,
      ayuda: t(A.oficio.ayuda, { pago: num(h.pagoOficio), max: max.oficio }), ilustrativo: true
    });
  }
  if (max.proyecto) lista.push({ campo: 'proyecto', nombre: A.proyecto.nombre, ayuda: A.proyecto.ayuda, max: max.proyecto, fijo: true });
  if (max.cacao || max.proyecto) {
    lista.push({ campo: 'contratadas', nombre: A.contratadas.nombre, ayuda: A.contratadas.ayuda, max: max.contratadas });
  }
  return lista;
}

function control(c, d, editable) {
  const valor = d[c.campo];
  const idNombre = 'nombre-' + c.campo;
  const cabeza = `<span class="nombre" id="${idNombre}">${esc(c.nombre)}<span class="ayuda">${txt(c.ayuda)}</span>`
    + `${c.ilustrativo ? etiquetaIlustrativa() : ''}</span>`;
  if (!editable || c.fijo) {
    return `<div class="control" role="group" aria-labelledby="${idNombre}">${cabeza}<span class="valor-fijo">${valor}</span></div>`;
  }
  const A = T.actividades;
  return `<div class="control" role="group" aria-labelledby="${idNombre}">
    ${cabeza}
    <span class="paso">
      <button type="button" id="menos-${c.campo}" data-accion="menos" data-campo="${c.campo}"
        aria-label="${esc(t(A.quitar, { nombre: c.nombre }))}"${valor <= 0 ? ' disabled' : ''}>−</button>
      <output for="menos-${c.campo} mas-${c.campo}" aria-labelledby="${idNombre}">${valor}</output>
      <button type="button" id="mas-${c.campo}" data-accion="mas" data-campo="${c.campo}"
        aria-label="${esc(t(A.poner, { nombre: c.nombre }))}"${valor >= c.max ? ' disabled' : ''}>+</button>
    </span>
  </div>`;
}

function tablaCuentas(x) {
  const F = T.trimestre.filas;
  const filas = [
    [F.saldoInicial, x.saldoInicial, ''],
    [F.cosecha, x.cosecha, 'sep'],
    [F.jornalYOficio, x.jornalYOficio, ''],
    [F.remesaYSubsidio, x.remesa + x.subsidio, ''],
    [F.ingresos, x.ingresos, 'total'],
    [x.conHuerta ? F.gastoHogarHuerta : F.gastoHogar, -x.gastoHogar, 'sep'],
    [F.evento, -(x.evento + x.contratos + x.insumos), ''],
    [F.gastos, -x.gastos, 'total'],
    [F.saldoFinal, x.saldo, 'total sep']
  ];
  return `<table class="cuentas">
    <caption class="oculto">${esc(T.trimestre.cuentas)}. ${esc(T.enPesos)}</caption>
    <tbody>${filas.map(([nombre, valor, clase]) => `<tr${clase ? ` class="${clase}"` : ''}>
      <th scope="row">${esc(nombre)}</th><td>${num(valor)}</td></tr>`).join('')}</tbody>
  </table>`;
}

function saldosDelAnio(r, actual) {
  const items = r.trimestres.map((x) => {
    const enviado = estado.enviados[x.t - 1];
    const valor = enviado
      ? `<b class="${signo(x.saldo)}">${num(x.saldo)}</b>`
      : `<b class="vacio-t">${esc(T.trimestre.sinEnviar)}</b>`;
    return `<li${x.t === actual ? ' class="actual"' : ''}>T${x.t}${valor}</li>`;
  }).join('');
  return `<h3>${esc(T.trimestre.saldos)}</h3><ul class="saldos-anio">${items}</ul>`;
}

function saldoGrande(saldo, rotulo) {
  return `<div class="saldo-grande ${signo(saldo)}">
    <span class="rotulo">${esc(rotulo)}</span>
    <span class="cifra">${esc(pesos(saldo))}</span>
    ${Math.round(saldo) < 0 ? `<span class="debe">${esc(T.trimestre.debe)}</span>` : ''}
  </div>`;
}

// Parte del trimestre que cambia con cada ficha.
function zonaViva(tr) {
  const h = hogar();
  const TR = T.trimestre;
  const r = resultado();
  const x = r.trimestres[tr - 1];
  const d = estado.repartos[tr - 1];
  const editable = !estado.enviados[tr - 1];
  const controles = controlesDe(h, tr, d);
  const alertas = [];
  if (x.libres < 0) {
    alertas.push(`<p class="alerta" id="alerta-fichas">${esc(x.libres === -1 ? TR.faltaUna : t(TR.faltan, { n: -x.libres }))}</p>`);
  }
  const sinFicha = h.ha > 0 ? h.ha - Math.min(d.cacao, h.ha) : 0;
  if (sinFicha > 0) {
    alertas.push(`<p class="alerta suave">${esc(sinFicha === 1 ? TR.sinFichaUna : t(TR.sinFicha, { n: sinFicha }))}</p>`);
  }
  return `<h2>${esc(TR.fichas)}</h2>
    <p>${esc(t(TR.fichasTexto, { personas: x.personas, fichas: x.fichas }))}</p>
    ${fichero(d, x.fichas)}
    <div class="controles-fichas">${controles.map((c) => control(c, d, editable)).join('')}</div>
    <p class="uso">${esc(t(TR.uso, { usadas: x.propias, total: x.fichas, libres: Math.max(0, x.libres) }))}</p>
    <p class="uso-ayuda">${esc(TR.libresAyuda)}</p>
    ${alertas.join('')}
    <h2>${esc(TR.cuentas)}</h2>
    ${tablaCuentas(x)}
    ${fuente(TR.fuenteGasto)}
    ${saldoGrande(x.saldo, TR.saldoFinal)}
    ${toma() && tr >= 2 ? `<p class="deuda">${esc(TR.deuda)}</p>` : ''}
    ${saldosDelAnio(r, tr)}`;
}

function anuncioZona(tr) {
  const x = resultado().trimestres[tr - 1];
  return `${t(T.trimestre.uso, { usadas: x.propias, total: x.fichas, libres: Math.max(0, x.libres) })} `
    + `${T.trimestre.saldoFinal}: ${pesos(x.saldo)}.`;
}

function bloqueTecnico(h) {
  const TE = T.tecnico;
  const ev = EVENTOS[1];
  const enviado = estado.enviados[1];
  const oferta = `<section class="oferta" aria-labelledby="tecnico-titulo">
      <span class="eti" id="tecnico-titulo">${esc(TE.titulo)}</span>
      <blockquote>«${txt(ev.oferta)}»</blockquote>
      ${fuente(ev.fuenteOferta)}
    </section>`;
  if (!h.tierra) {
    return `${oferta}
      <p class="alerta suave">${esc(TE.sinTierra)}</p>
      ${campoTexto({ id: 'razon-proyecto', etiqueta: TE.preguntaSinTierra, valorFijo: enviado ? estado.razonProyecto : '' })}`;
  }
  if (enviado) {
    return `${oferta}
      ${respuestaFija(TE.decision, toma() ? TE.toma : TE.noTomo)}
      ${respuestaFija(TE.razon, estado.razonProyecto)}`;
  }
  const libresT1 = Math.max(0, resultado().trimestres[0].libres);
  return `${oferta}
    ${grupoOpciones({
      nombre: 'proyecto',
      leyenda: TE.pregunta,
      opciones: [{ valor: 'toma', texto: TE.toma }, { valor: 'no_toma', texto: TE.noTomo }],
      elegida: estado.proyecto
    })}
    <p class="pista">${esc(libresT1 === 1 ? TE.pistaUna : t(TE.pista, { n: libresT1 }))}</p>
    ${campoTexto({ id: 'razon-proyecto', etiqueta: TE.porque })}`;
}

function bloqueMigracion(tr) {
  const M = T.migracion;
  if (estado.migra && estado.migra < tr) {
    return `<p class="alerta suave">${esc(t(M.seFue, { t: estado.migra }))} ${esc(t(M.remesa, { t: estado.migra + 1 }))}</p>`;
  }
  if (estado.enviados[tr - 1]) {
    return estado.migra === tr ? `<p class="alerta suave">${esc(t(M.seFue, { t: tr }))}</p>` : '';
  }
  const marcada = estado.migra === tr;
  return `<div class="campo-migra">
    <label class="casilla${marcada ? ' elegida' : ''}">
      <input type="checkbox" id="migra" name="migra"${marcada ? ' checked' : ''} aria-describedby="migra-ayuda">
      <span>${esc(M.casilla)}</span>
    </label>
    <p class="casilla-ayuda" id="migra-ayuda">${txt(M.ayuda)}</p>
    ${avisoMigracion ? `<p class="alerta suave" id="aviso-migra">${esc(M.quitoJornal)}</p>` : ''}
  </div>`;
}

function vistaTrimestre() {
  const tr = trimestreDeSeccion(estado.seccion);
  const h = hogar();
  const TR = T.trimestre;
  const ev = EVENTOS[tr - 1];
  const enviado = estado.enviados[tr - 1];
  const final = enviado
    ? `${respuestaFija(TR.fraseEnviada, estado.frases[tr - 1])}
       ${aviso(TR.registrado, 'aviso-trimestre')}
       ${tr < 4 ? botonSeguir('siguiente-trimestre', TR.siguiente) : botonSeguir('ir-anio', TR.irResumen)}`
    : `${campoTexto({ id: 'frase-t' + tr, etiqueta: TR.frase })}
       <p class="error" id="error-fichas" hidden></p>
       ${botonEnviar(TR.enviar, 'enviar-trimestre')}`;
  return `<h1 id="titulo" tabindex="-1">${esc(t(TR.titulo, { t: tr, meses: ev.meses }))}</h1>
    <p class="subtitulo">${esc(nombreHogar(h))}</p>
    <form data-accion="enviar-trimestre" data-trimestre="${tr}" novalidate>
      ${bloqueEvento(tr)}
      ${tr === 2 ? bloqueTecnico(h) : ''}
      ${h.migra ? bloqueMigracion(tr) : ''}
      ${!enviado && tr > 1 ? `<p class="pista">${esc(TR.copiado)}</p>` : ''}
      <div id="zona-viva" class="zona-viva">${zonaViva(tr)}</div>
      <p class="oculto" id="anuncio" aria-live="polite"></p>
      ${final}
    </form>`;
}

/* ---------- Resumen del año ---------- */

function vistaAnio() {
  const A = T.anio;
  const r = resultado();
  const anchoFinca = (r.parteFinca * 100).toFixed(1);
  const anchoFuera = (r.parteFuera * 100).toFixed(1);
  const cifras = [
    [A.ingresoFinca, pesos(r.ingresoFinca), A.ingresoFincaAyuda],
    [A.ingresoTotal, pesos(r.ingresoTotal), A.ingresoTotalAyuda],
    [A.parteFinca, C.formatoPorcentaje(r.parteFinca), ''],
    [A.parteFuera, C.formatoPorcentaje(r.parteFuera), ''],
    [A.libres, String(r.libresAnio), '']
  ];
  const cubre = `<span class="insignia ${r.cubreLinea ? 'bien' : 'mal'}">${esc(r.cubreLinea ? T.si : T.no)}</span>`;
  const final = estado.resumenEnviado
    ? `${aviso(A.registrado, 'aviso-anio')}${botonSeguir('ir-proyecto', A.siguiente)}`
    : `<form data-accion="enviar-resumen" novalidate>${botonEnviar(A.enviar, 'enviar-resumen')}</form>`;
  return `<h1 id="titulo" tabindex="-1">${esc(A.titulo)}</h1>
    <p class="subtitulo">${esc(nombreHogar(hogar()))}</p>
    <p>${esc(A.intro)}</p>
    ${saldosDelAnio(r, 0)}
    <div class="tarjeta">
      <dl class="cifras">${cifras.map(([n, v, ayuda]) => `<div>
        <dt>${esc(n)}${ayuda ? `<span class="fuente">${esc(ayuda)}</span>` : ''}</dt><dd>${txt(v)}</dd>
      </div>`).join('')}</dl>
      <h3>${esc(A.composicion)}</h3>
      <div class="composicion" aria-hidden="true">
        <span class="finca" style="width:${anchoFinca}%"></span><span class="fuera" style="width:${anchoFuera}%"></span>
      </div>
      <p class="composicion-leyenda"><span class="finca">${esc(A.finca)} ${txt(C.formatoPorcentaje(r.parteFinca))}</span>
        <span class="fuera">${esc(A.fuera)} ${txt(C.formatoPorcentaje(r.parteFuera))}</span></p>
    </div>
    ${saldoGrande(r.saldoFinal, A.saldoFinal)}
    <p class="cubre"><strong>${esc(A.cubre)}</strong> ${cubre}</p>
    <p class="nota">${txt(A.nota1)}</p>
    <p class="nota">${txt(A.nota2)} ${fuente(FUENTES.dane)}</p>
    ${final}`;
}

/* ---------- Proyecto ---------- */

function tablaMRA1() {
  const P = T.proyecto;
  const filas = C.tablaMRA().map((a) => `<tr>
      <th scope="row">${esc(a.anio)}</th>
      <td class="numero">${num(a.manoDeObra)}</td>
      <td class="numero">${num(a.insumos)}</td>
      <td class="numero">${num(a.costoTotal)}</td>
      <td class="numero">${a.kilos ? num(a.kilos) : ''}</td>
      <td class="numero">${num(a.ventas)}</td>
      <td class="numero">${num(a.utilidad)}</td>
    </tr>`).join('');
  return `<div class="tabla-envoltura" tabindex="0" role="region" aria-labelledby="cap-mra1"><table>
    <caption id="cap-mra1" class="oculto">${esc(MRA.tabla1)}</caption>
    <thead><tr>${P.columnas.map((c, i) => `<th scope="col"${i ? ' class="numero"' : ''}>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}

function tablaMRA2() {
  const P = T.proyecto;
  const filas = C.tablaHogar().map((a, i) => `<tr>
      <th scope="row">${esc(a.anioHogar)}</th>
      <td class="numero">${a.jornales}</td>
      <td class="numero">${num(a.ventas)}</td>
      <td class="numero">${num(a.insumos)}${i === 0 ? `<span class="nota-celda">${esc(MRA.insumosCredito)}</span>` : ''}</td>
      <td class="numero">${num(a.abono)}</td>
      <td class="numero destacada">${num(a.quedaLibre)}</td>
      <td class="numero">${num(a.manoDeObra)}</td>
      <td class="numero destacada">${num(a.quedaJornal)}</td>
    </tr>`).join('');
  return `<div class="tabla-envoltura" tabindex="0" role="region" aria-labelledby="cap-mra2"><table>
    <caption id="cap-mra2" class="oculto">${esc(MRA.tabla2)}</caption>
    <thead><tr>${P.columnas2.map((c, i) => `<th scope="col"${i ? ' class="numero"' : ''}>${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}

// Barras a la derecha si queda plata, a la izquierda si el hogar pierde.
function graficoColumna(titulo, campo) {
  const filas = C.tablaHogar();
  const maximo = Math.max(...filas.map((f) => Math.max(Math.abs(f.quedaLibre), Math.abs(f.quedaJornal))));
  const barras = filas.map((f, i) => {
    const v = f[campo];
    const ancho = (Math.abs(v) / maximo) * 50;
    const pos = v >= 0;
    const barra = `<span class="grafico-barra ${pos ? 'pos' : 'neg'}" style="${pos ? 'left:50%' : `right:50%`};width:${ancho.toFixed(1)}%"></span>`;
    const cifra = `<span class="grafico-cifra" style="${pos ? 'right:calc(50% + 6px)' : 'left:calc(50% + 6px)'}">${num(v)}</span>`;
    return `<div class="grafico-fila"><span class="rot">${i < 6 ? f.anioHogar : '7+'}</span>
      <span class="grafico-pista">${barra}${v !== 0 ? cifra : `<span class="grafico-cifra" style="left:calc(50% + 6px)">0</span>`}</span></div>`;
  }).join('');
  return `<h3>${esc(titulo)}</h3><div class="grafico" aria-hidden="true">${barras}</div>`;
}

function vistaProyecto() {
  const P = T.proyecto;
  const r = resultado();
  const h = hogar();
  const enviado = estado.respuestasProyecto;
  const respuestas = enviado || {};
  const libres = r.libresAnio;
  const decision = !h.tierra ? P.noPudo : (toma() ? P.tomo : P.noTomo);
  const preguntas = enviado
    ? `${respuestaFija(P.p1, respuestas.p1)}
       ${respuestaFija(P.p2, P.p2Opciones.find((o) => o.valor === respuestas.p2).texto)}
       ${respuestaFija(P.p2Porque, respuestas.p2texto)}
       ${['p3', 'p4', 'p5', 'p6'].map((p) => respuestaFija(P[p], respuestas[p])).join('')}
       ${aviso(P.registrado, 'aviso-proyecto')}
       ${botonSeguir('ir-cierre', P.siguiente)}`
    : `<form data-accion="enviar-proyecto" novalidate>
         ${campoTexto({ id: 'p1', etiqueta: '1. ' + P.p1 })}
         ${grupoOpciones({ nombre: 'p2', leyenda: '2. ' + P.p2, opciones: P.p2Opciones, elegida: borrador('p2') })}
         ${campoTexto({ id: 'p2texto', etiqueta: P.p2Porque })}
         ${campoTexto({ id: 'p3', etiqueta: '3. ' + P.p3 })}
         ${campoTexto({ id: 'p4', etiqueta: '4. ' + P.p4 })}
         ${campoTexto({ id: 'p5', etiqueta: '5. ' + P.p5 })}
         ${campoTexto({ id: 'p6', etiqueta: '6. ' + P.p6 })}
         ${botonEnviar(P.enviar, 'enviar-proyecto')}
       </form>`;
  return `<h1 id="titulo" tabindex="-1">${esc(MRA.titulo)}</h1>
    <p>${txt(MRA.datos)}</p>
    <p><a href="${esc(MRA.enlace)}" target="_blank" rel="noopener">${esc(P.abrir)}</a></p>
    <h2>${esc(P.citas)}</h2>
    ${MRA.citas.map((c) => `<blockquote class="cita">${txt(c)}</blockquote>`).join('')}
    ${fuente(MRA.fuente)}
    <h2>${esc(MRA.tabla1)}</h2>
    ${tablaMRA1()}
    <p class="desliza">${esc(P.desliza)}</p>
    ${fuente(MRA.fuente)}
    <h2>${esc(MRA.tabla2)}</h2>
    <p>${txt(MRA.tabla2Antes)}</p>
    ${tablaMRA2()}
    <p class="desliza">${esc(P.desliza)}</p>
    ${fuente(MRA.fuente)}
    <p>${txt(t(MRA.tabla2Despues, { perdida: num(-C.perdidaAnios1a6()) }))}</p>
    <div class="tarjeta">
      <h2>${esc(P.grafico)}</h2>
      <p class="nota">${esc(P.graficoAyuda)}</p>
      ${graficoColumna(P.libre, 'quedaLibre')}
      ${graficoColumna(P.jornal, 'quedaJornal')}
    </div>
    <div class="aviso">
      <p>${esc(libres === 1 ? P.suHogarUna : t(P.suHogar, { n: libres }))}</p>
      <p style="margin:0">${esc(decision)}</p>
    </div>
    <h2>${esc(P.preguntas)}</h2>
    ${preguntas}`;
}

/* ---------- Cierre ---------- */

function vistaCierre() {
  const K = T.cierre;
  const cuerpo = estado.cierre
    ? `${['c1', 'c2', 'c3'].map((c, i) => respuestaFija(`${i + 1}. ${K[c]}`, estado.cierre[c])).join('')}
       <p class="aviso final" id="final" tabindex="-1">${esc(K.final)}</p>`
    : `<form data-accion="enviar-cierre" novalidate>
         ${['c1', 'c2', 'c3'].map((c, i) => campoTexto({ id: c, etiqueta: `${i + 1}. ${K[c]}` })).join('')}
         ${botonEnviar(K.enviar, 'enviar-cierre')}
       </form>`;
  return `<h1 id="titulo" tabindex="-1">${esc(K.titulo)}</h1>
    <p>${esc(K.intro)}</p>
    ${cuerpo}`;
}

/* ---------- Pintar ---------- */

const vista = document.getElementById('vista');
let avisoMigracion = false;

function vistaActual() {
  if (trimestreDeSeccion(estado.seccion)) return vistaTrimestre();
  switch (estado.seccion) {
    case S.hogar: return vistaHogar();
    case S.anio: return vistaAnio();
    case S.proyecto: return vistaProyecto();
    case S.cierre: return vistaCierre();
    default: return vistaInicio();
  }
}

// foco: id del elemento que recibe el foco. 'titulo' sube al inicio de la página.
function pintar(foco) {
  pintarAvance();
  pintarIndicador();
  vista.innerHTML = vistaActual();
  pintarReinicio();
  enfocar(foco);
}

function enfocar(foco) {
  const el = foco ? document.getElementById(foco) : null;
  if (!el) return;
  if (foco === 'titulo') window.scrollTo(0, 0);
  else el.scrollIntoView({ block: el.tagName === 'BUTTON' ? 'center' : 'start' });
  el.focus({ preventScroll: true });
}

// Vuelve a pintar solo la parte que cambia con las fichas. Deja el foco en el mismo botón.
function pintarZona(idFoco) {
  const tr = trimestreDeSeccion(estado.seccion);
  const zona = document.getElementById('zona-viva');
  if (!tr || !zona) return;
  zona.innerHTML = zonaViva(tr);
  cambiarTexto(document.getElementById('anuncio'), anuncioZona(tr));
  if (!idFoco) return;
  let el = document.getElementById(idFoco);
  if (!el || el.disabled) el = document.getElementById(idFoco.startsWith('mas-') ? idFoco.replace('mas-', 'menos-') : idFoco.replace('menos-', 'mas-'));
  if (el) el.focus({ preventScroll: true });
}

// Al entrar a un trimestre por primera vez, el reparto empieza igual al del trimestre anterior.
function prepararTrimestre(tr) {
  if (estado.iniciados[tr - 1] || estado.enviados[tr - 1]) return;
  const h = hogar();
  const base = tr > 1 ? estado.repartos[tr - 2] : estado.repartos[0];
  estado.repartos[tr - 1] = C.ajustarReparto(h, tr, base, toma());
  if (estado.migra && estado.migra <= tr) {
    estado.repartos[tr - 1] = C.quitarJornalSiNoCabe(h, tr, estado.repartos[tr - 1], estado.migra);
  }
  estado.iniciados[tr - 1] = true;
}

function irASeccion(i) {
  estado.seccion = i;
  estado.seccionMax = Math.max(estado.seccionMax, i);
  const tr = trimestreDeSeccion(i);
  if (tr) prepararTrimestre(tr);
  avisoMigracion = false;
  guardarEstado();
  pintar('titulo');
}

/* ---------- Acciones ---------- */

function empezar(form) {
  const campo = form.querySelector('#nombre');
  const nombre = campo.value.trim().replace(/\s+/g, ' ');
  form.querySelectorAll('.error').forEach((p) => { p.hidden = true; p.textContent = ''; });
  campo.removeAttribute('aria-invalid');
  const elegido = form.querySelector('input[name="hogar"]:checked');
  let primero = null;
  if (nombre.split(' ').length < 2) {
    marcarError('error-nombre', T.errores.nombre, campo);
    primero = campo;
  }
  if (!elegido) {
    const opcion = form.querySelector('input[name="hogar"]');
    marcarError('error-hogar', T.errores.hogar, opcion);
    primero = primero || opcion;
  }
  if (primero) {
    primero.focus();
    return;
  }
  estado.nombre = nombre;
  estado.hogar = Number(elegido.value);
  registrar([{ seccion: 'inicio' }]);
  vaciarCola();
  irASeccion(S.hogar);
}

function enviarTrimestre(form) {
  const tr = Number(form.dataset.trimestre);
  if (estado.enviados[tr - 1]) return;
  const h = hogar();
  const reglas = [];
  if (tr === 2 && h.tierra) reglas.push({ tipo: 'opcion', nombre: 'proyecto' });
  if (tr === 2) reglas.push({ tipo: 'texto', id: 'razon-proyecto' });
  reglas.push({ tipo: 'texto', id: 'frase-t' + tr });
  const v = validar(form, reglas);
  if (!v) return;
  const x = resultado().trimestres[tr - 1];
  if (x.libres < 0) {
    marcarError('error-fichas', T.errores.fichas);
    const alerta = document.getElementById('alerta-fichas');
    if (alerta) alerta.setAttribute('tabindex', '-1');
    enfocar(alerta ? 'alerta-fichas' : 'error-fichas');
    return;
  }
  const d = estado.repartos[tr - 1];
  estado.enviados[tr - 1] = true;
  estado.frases[tr - 1] = v['frase-t' + tr];
  let decision = '';
  if (tr === 2) {
    estado.razonProyecto = v['razon-proyecto'];
    if (!h.tierra) estado.proyecto = '';
    decision = h.tierra ? (toma() ? 'toma' : 'no_toma') : 'sin_tierra';
  }
  const filas = [{
    seccion: 'trimestre',
    trimestre: tr,
    cacao: d.cacao,
    huerta: d.huerta,
    jornal: d.jornal,
    oficio: d.oficio,
    proyecto: d.proyecto,
    contratadas: d.contratadas,
    libres: x.libres,
    migra: C.migrado(estado.migra, tr) ? estado.migra : '',
    cosecha: x.cosecha,
    ingresos: x.ingresos,
    gastos: x.gastos,
    saldo: x.saldo,
    decision,
    texto: estado.frases[tr - 1]
  }];
  if (tr === 2) filas.push({ seccion: 'trimestre', trimestre: 2, pregunta: 'proyecto_razon', texto: estado.razonProyecto });
  avisoMigracion = false;
  guardarEstado();
  registrar(filas);
  vaciarCola();
  pintar('aviso-trimestre');
}

function enviarResumen() {
  if (estado.resumenEnviado) return;
  const r = resultado();
  estado.resumenEnviado = true;
  guardarEstado();
  registrar([{
    seccion: 'resumen',
    ingresos: r.ingresoTotal,
    cosecha: r.ingresoFinca,
    saldo: r.saldoFinal,
    libres: r.libresAnio,
    decision: r.cubreLinea ? 'cubre' : 'no_cubre'
  }]);
  vaciarCola();
  pintar('aviso-anio');
}

function enviarProyecto(form) {
  const reglas = [
    { tipo: 'texto', id: 'p1' },
    { tipo: 'opcion', nombre: 'p2' },
    { tipo: 'texto', id: 'p2texto' },
    { tipo: 'texto', id: 'p3' },
    { tipo: 'texto', id: 'p4' },
    { tipo: 'texto', id: 'p5' },
    { tipo: 'texto', id: 'p6' }
  ];
  const v = validar(form, reglas);
  if (!v) return;
  estado.respuestasProyecto = v;
  guardarEstado();
  registrar(['p1', 'p2', 'p3', 'p4', 'p5', 'p6'].map((p) => ({
    seccion: 'proyecto',
    pregunta: p,
    decision: p === 'p2' ? v.p2 : '',
    texto: p === 'p2' ? v.p2texto : v[p]
  })));
  vaciarCola();
  pintar('aviso-proyecto');
}

function enviarCierre(form) {
  const v = validar(form, ['c1', 'c2', 'c3'].map((id) => ({ tipo: 'texto', id })));
  if (!v) return;
  estado.cierre = v;
  guardarEstado();
  registrar(['c1', 'c2', 'c3'].map((c) => ({ seccion: 'cierre', pregunta: c, texto: v[c] })));
  vaciarCola();
  pintar('final');
}

function cambiarFicha(boton, delta) {
  const tr = trimestreDeSeccion(estado.seccion);
  if (!tr || estado.enviados[tr - 1]) return;
  const h = hogar();
  const campo = boton.dataset.campo;
  if (campo === 'proyecto') return;
  const d = { ...estado.repartos[tr - 1] };
  const max = C.maximos(h, tr, d, toma());
  const nuevo = d[campo] + delta;
  if (nuevo < 0 || nuevo > max[campo]) return;
  d[campo] = nuevo;
  estado.repartos[tr - 1] = C.ajustarReparto(h, tr, d, toma());
  guardarEstado();
  pintarZona(boton.id);
}

function cambiarProyecto(valor) {
  if (estado.enviados[1]) return;
  estado.proyecto = valor;
  const h = hogar();
  estado.repartos[1] = C.ajustarReparto(h, 2, estado.repartos[1], toma());
  guardarEstado();
  pintarZona();
}

function cambiarMigracion(marcada) {
  const tr = trimestreDeSeccion(estado.seccion);
  if (!tr || estado.enviados[tr - 1] || (estado.migra && estado.migra < tr)) return;
  const h = hogar();
  avisoMigracion = false;
  if (marcada) {
    estado.migra = tr;
    const antes = estado.repartos[tr - 1];
    const despues = C.quitarJornalSiNoCabe(h, tr, antes, tr);
    avisoMigracion = despues.jornal !== antes.jornal;
    estado.repartos[tr - 1] = despues;
  } else {
    estado.migra = 0;
  }
  guardarEstado();
  pintar('migra');
}

const ACCIONES_FORMULARIO = {
  'empezar': empezar,
  'enviar-trimestre': enviarTrimestre,
  'enviar-resumen': enviarResumen,
  'enviar-proyecto': enviarProyecto,
  'enviar-cierre': enviarCierre
};

const ACCIONES_CLIC = {
  'ir-seccion': (boton) => {
    const i = Number(boton.dataset.seccion);
    if (i <= estado.seccionMax) irASeccion(i);
  },
  'seguir-avance': () => irASeccion(estado.seccionMax),
  'ir-t1': () => irASeccion(S.t1),
  'siguiente-trimestre': () => {
    const tr = trimestreDeSeccion(estado.seccion);
    if (tr && tr < 4 && estado.enviados[tr - 1]) irASeccion(seccionDeTrimestre(tr + 1));
  },
  'ir-anio': () => { if (estado.enviados[3]) irASeccion(S.anio); },
  'ir-proyecto': () => { if (estado.resumenEnviado) irASeccion(S.proyecto); },
  'ir-cierre': () => { if (estado.respuestasProyecto) irASeccion(S.cierre); },
  'mas': (boton) => cambiarFicha(boton, 1),
  'menos': (boton) => cambiarFicha(boton, -1),
  'reiniciar': () => {
    confirmandoReinicio = true;
    pintarReinicio();
    document.getElementById('reiniciar-no').focus();
  },
  'reiniciar-no': () => {
    confirmandoReinicio = false;
    pintarReinicio();
    document.getElementById('reiniciar').focus();
  },
  'reiniciar-si': () => {
    // Se conserva la cola: las respuestas pendientes todavía se envían.
    borrarLocal(CLAVE_ESTADO);
    borrarLocal(CLAVE_ID);
    idEnMemoria = null;
    estado = estadoInicial();
    confirmandoReinicio = false;
    avisoMigracion = false;
    pintar('titulo');
  }
};

document.addEventListener('submit', (evento) => {
  const form = evento.target.closest('form[data-accion]');
  if (!form) return;
  evento.preventDefault();
  const accion = ACCIONES_FORMULARIO[form.dataset.accion];
  if (accion) accion(form);
});

document.addEventListener('click', (evento) => {
  const boton = evento.target.closest('button[data-accion]');
  if (!boton) return;
  const accion = ACCIONES_CLIC[boton.dataset.accion];
  if (accion) accion(boton);
});

document.addEventListener('change', (evento) => {
  const el = evento.target;
  if (el.id === 'migra') {
    cambiarMigracion(el.checked);
    return;
  }
  if (el.type === 'radio' && el.name) {
    limpiarError(el);
    document.querySelectorAll(`input[name="${el.name}"]`).forEach((r) => {
      const caja = r.closest('.opcion');
      if (caja) caja.classList.toggle('elegida', r.checked);
    });
    if (el.name === 'proyecto') cambiarProyecto(el.value);
    else guardarBorrador(el.name, el.value);
  }
});

document.addEventListener('input', (evento) => {
  const el = evento.target;
  if (el.tagName === 'TEXTAREA' || (el.tagName === 'INPUT' && el.type === 'text')) {
    guardarBorrador(el.id, el.value);
    if (el.hasAttribute('aria-invalid')) limpiarError(el);
  }
});

window.addEventListener('pagehide', guardarEstado);
window.addEventListener('online', vaciarCola);
setInterval(vaciarCola, REINTENTO_MS);

pintar();
vaciarCola();
