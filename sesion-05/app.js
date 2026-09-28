// Lógica de la página de los estudiantes. Sesión 5, taller de fincas pequeñas.
import { URL_APPS_SCRIPT, CURSO, SESION, ACTIVIDAD, CLAVE_SESION } from './config.js';
import { FICHAS, GLOSARIO, REFERENCIAS, VALORES, TEXTOS as T } from './datos.js';
import * as C from './calculos.js';

const CLAVE_ESTADO = 'dr5001462s5_estado';
const CLAVE_COLA = 'dr5001462s5_cola';
const CLAVE_ID = 'dr5001462s5_id';
const MINIMO_CARACTERES = 15;
const REINTENTO_MS = 30000;
const LIMITE_ESPERA_MS = 30000;
const REGISTRO_EN_LINEA = /^https?:\/\//.test(URL_APPS_SCRIPT) && !URL_APPS_SCRIPT.includes('PEGAR_AQUI');

// Opción del evento del gerente → pedido que resulta.
const PEDIDO_EVENTO_GERENTE = { cambiar: 'grandeEvento', seguir: 'asociacion', igualar: 'asociacionIguala' };

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
    seccion: 0,
    seccionMax: 0,
    casos: { paso: 0, fichas: {} },
    productor: { finca: null, ronda: 1, rondaMax: 1, r1: {}, r2: {}, r3: {} },
    gerente: { ronda: 1, rondaMax: 1, r1: {}, r2: {}, r3: {} },
    evaluacion: { enviada: false, respuestas: {} },
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

const finca = () => estado.productor.finca || '';
const fichaPorId = (id) => FICHAS.find((f) => f.id === id);
const etiquetaDe = (opciones, id) => (opciones.find((o) => o.id === id) || {}).etiqueta || id;
const gananciaDe = (pedido) => C.resultadoPedido(C.pedidoGerente(pedido)).gananciaPorKilo;

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

// Un texto que empieza con =, +, - o @ se volvería fórmula en la hoja. El apóstrofo lo deja como texto.
function comoTexto(valor) {
  return typeof valor === 'string' && /^[=+\-@]/.test(valor) ? "'" + valor : valor;
}

// Un registro por pregunta. Con el Apps Script de la sesión 4, cada campo queda en una fila.
function registrar(datos) {
  if (!REGISTRO_EN_LINEA) return;
  const respuestas = {
    clave: CLAVE_SESION,
    sesion: SESION,
    id_estudiante: idEstudiante(),
    estudiante: estado.nombre,
    seccion: datos.seccion,
    ficha: datos.ficha || '',
    ronda: datos.ronda || '',
    pregunta: datos.pregunta,
    opcion: datos.opcion || '',
    texto: datos.texto || '',
    valor: Number.isFinite(datos.valor) ? Math.round(datos.valor) : '',
    hora_cliente: new Date().toISOString()
  };
  Object.keys(respuestas).forEach((k) => { respuestas[k] = comoTexto(respuestas[k]); });
  const carga = {
    curso: CURSO,
    sesion: SESION,
    actividad: ACTIVIDAD,
    estudiante: comoTexto(estado.nombre),
    grupo: respuestas.ficha,
    respuestas
  };
  const cola = leerCola();
  cola.push({ id: nuevoId(), carga });
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
    // Segundo intento, igual que en la sesión 4. El navegador no puede confirmar la escritura.
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
  return esc(valor).replace(/(\d) %/g, '$1 %');
}

function t(plantilla, datos = {}) {
  return plantilla.replace(/\{(\w+)\}/g, (_, k) => (k in datos ? datos[k] : ''));
}

function cambiarTexto(el, texto) {
  if (el && el.textContent !== texto) el.textContent = texto;
}

/* ---------- Piezas de la interfaz ---------- */

function etiquetaIlustrativa() {
  return `<span class="ilustrativo">${esc(T.valorIlustrativo)}</span>`;
}

function fuente(texto) {
  return `<p class="fuente">${esc(t(T.fuente, { fuente: texto }))}</p>`;
}

function botonEnviar(texto, id = '') {
  return `<div class="acciones"><button type="submit" class="boton"${id ? ` id="${id}"` : ''}>${esc(texto)}</button></div>`;
}

function grupoOpciones({ nombre, leyenda, leyendaOculta = false, opciones, elegida, bloqueado = false, ilustrativo = false }) {
  const idError = 'error-' + nombre;
  const items = opciones.map((o) => {
    const marcada = o.valor === elegida;
    const clases = ['opcion', marcada ? 'elegida' : '', bloqueado ? 'bloqueada' : ''].filter(Boolean).join(' ');
    return `<label class="${clases}">
        <input type="radio" name="${nombre}" value="${esc(o.valor)}"${marcada ? ' checked' : ''}${bloqueado ? ' disabled' : ''}>
        <span>${txt(o.texto)}</span>
      </label>`;
  }).join('');
  return `<fieldset aria-describedby="${idError}">
    <legend${leyendaOculta ? ' class="oculto"' : ''}>${txt(leyenda)}</legend>
    ${ilustrativo ? etiquetaIlustrativa() : ''}
    <div class="opciones">${items}</div>
    <p class="error" id="${idError}" hidden></p>
  </fieldset>`;
}

function respuestaFija(etiqueta, valor) {
  return `<div class="respuesta-fija">
    <p class="etiqueta">${txt(etiqueta)}</p>
    <p class="texto">${esc(valor)}</p>
  </div>`;
}

function campoTexto({ id, etiqueta, valorFijo }) {
  if (valorFijo !== undefined && valorFijo !== null) return respuestaFija(etiqueta, valorFijo);
  return `<label class="campo" for="${id}">${txt(etiqueta)}</label>
    <textarea id="${id}" name="${id}" rows="3" aria-describedby="error-${id}">${esc(borrador(id))}</textarea>
    <p class="error" id="error-${id}" hidden></p>`;
}

// Campo de texto con su propio botón de envío, o la respuesta fija si ya se envió.
function bloqueTexto({ accion, id, etiqueta, valorFijo }) {
  if (valorFijo) return respuestaFija(etiqueta, valorFijo);
  return `<form data-accion="${accion}" novalidate>
    ${campoTexto({ id, etiqueta })}
    ${botonEnviar(T.enviar)}
  </form>`;
}

function listaGlosario() {
  return `<dl class="glosario-lista">${GLOSARIO.map((g) => `<div>
      <dt>${esc(g.termino)}</dt>
      <dd>${txt(g.definicion)}${g.fuente ? fuente(g.fuente) : ''}</dd>
    </div>`).join('')}</dl>`;
}

function glosarioDesplegable() {
  return `<details class="glosario">
    <summary>${esc(T.casos.queSignifica)}</summary>
    ${listaGlosario()}
  </details>`;
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

// reglas: { tipo: 'opcion', nombre } | { tipo: 'texto', id } | { tipo: 'corto', id, mensaje }
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
        marcarError('error-' + regla.nombre, T.errores.opcion, primeraOpcion);
        primero = primero || primeraOpcion;
      }
      continue;
    }
    const campo = form.querySelector('#' + regla.id);
    const valor = campo.value.trim();
    const minimo = regla.tipo === 'corto' ? 1 : MINIMO_CARACTERES;
    if (valor.length >= minimo) {
      valores[regla.id] = valor;
    } else {
      const mensaje = regla.tipo === 'corto' ? regla.mensaje : t(T.errores.minimo, { n: valor.length });
      marcarError('error-' + regla.id, mensaje, campo);
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
  switch (i) {
    case 0: return Boolean(estado.nombre);
    case 1: return FICHAS.every((f) => estado.casos.fichas[f.id]);
    case 2: return Boolean(estado.productor.r3.texto);
    case 3: return Boolean(estado.gerente.r3.texto);
    default: return estado.evaluacion.enviada;
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
      + `<span class="nombre" aria-hidden="true">${esc(nombre)}</span>`
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

function vistaInicio() {
  const I = T.inicio;
  const cuerpo = estado.nombre
    ? `${respuestaFija(I.campoNombre, estado.nombre)}
       <div class="acciones"><button type="button" class="boton" data-accion="seguir-avance">${esc(T.seguir)}</button></div>`
    : `<form data-accion="empezar" novalidate>
         <label class="campo" for="nombre">${esc(I.campoNombre)}</label>
         <input type="text" id="nombre" name="nombre" autocomplete="name" autocapitalize="words" maxlength="80"
           value="${esc(borrador('nombre'))}" aria-describedby="error-nombre">
         <p class="error" id="error-nombre" hidden></p>
         ${botonEnviar(I.boton)}
       </form>`;
  return `<h1 id="titulo" tabindex="-1">${esc(I.titulo)}</h1>
    <p>${esc(I.texto)}</p>
    ${cuerpo}`;
}

/* ---------- Estudio de casos ---------- */

function vistaCasos() {
  const paso = estado.casos.paso;
  return paso < FICHAS.length ? vistaFicha(FICHAS[paso]) : vistaCierreCasos();
}

function vistaFicha(f) {
  const K = T.casos;
  const r = estado.casos.fichas[f.id];
  const bloqueada = Boolean(r);
  const opcionLimita = bloqueada ? r.limita.opcion : borrador(`${f.id}-limita`);
  const cual = bloqueada
    ? (r.limita.cual ? respuestaFija(K.p2Cual, r.limita.cual) : '')
    : `<div id="${f.id}-cual-caja"${opcionLimita === 'Otra' ? '' : ' hidden'}>
        <label class="campo" for="${f.id}-cual">${esc(K.p2Cual)}</label>
        <input type="text" id="${f.id}-cual" name="${f.id}-cual" maxlength="80"
          value="${esc(borrador(`${f.id}-cual`))}" aria-describedby="error-${f.id}-cual">
        <p class="error" id="error-${f.id}-cual" hidden></p>
      </div>`;
  const ultima = f.numero === FICHAS.length;
  return `<p class="antetitulo">${esc(K.titulo)} · ${esc(t(K.fichaDe, { n: f.numero }))}</p>
    <h1 id="titulo" tabindex="-1">${esc(f.nombre)}</h1>
    <article class="tarjeta" aria-labelledby="titulo">
      <dl class="datos">
        <div><dt>${esc(K.lugar)}</dt><dd>${txt(f.lugar)}</dd></div>
        <div><dt>${esc(K.produce)}</dt><dd>${txt(f.produce)}</dd></div>
        <div><dt>${esc(K.tierra)}</dt><dd>${txt(f.tierra)}</dd></div>
        <div><dt>${esc(K.ingreso)}</dt><dd>${txt(f.ingreso)}</dd></div>
      </dl>
      ${fuente(f.fuenteDatos)}
      <section class="lecturas" aria-labelledby="lecturas-${f.id}">
        <h2 id="lecturas-${f.id}">${esc(K.recuadro)}</h2>
        <p>${txt(f.lecturas)}</p>
        ${fuente(f.fuenteLecturas)}
      </section>
      ${glosarioDesplegable()}
    </article>
    <form data-accion="enviar-ficha" data-ficha="${f.id}" novalidate>
      ${grupoOpciones({
        nombre: `${f.id}-alcanza`,
        leyenda: K.p1,
        opciones: K.p1Opciones.map((o) => ({ valor: o, texto: o })),
        elegida: bloqueada ? r.alcanza.opcion : borrador(`${f.id}-alcanza`),
        bloqueado: bloqueada
      })}
      ${campoTexto({ id: `${f.id}-alcanza-texto`, etiqueta: K.p1Explique, valorFijo: bloqueada ? r.alcanza.texto : undefined })}
      ${grupoOpciones({
        nombre: `${f.id}-limita`,
        leyenda: K.p2,
        opciones: K.p2Opciones.map((o) => ({ valor: o, texto: o })),
        elegida: opcionLimita,
        bloqueado: bloqueada
      })}
      ${cual}
      ${campoTexto({ id: `${f.id}-limita-texto`, etiqueta: K.p2Explique, valorFijo: bloqueada ? r.limita.texto : undefined })}
      ${bloqueada ? '' : botonEnviar(K.boton)}
    </form>
    ${bloqueada ? `<p class="aviso" id="aviso-ficha" tabindex="-1">${esc(K.enviado)}</p>` : ''}
    <div class="acciones">
      ${f.numero > 1 ? `<button type="button" class="boton secundario" data-accion="ficha-anterior">${esc(K.anterior)}</button>` : ''}
      ${bloqueada ? `<button type="button" class="boton" id="boton-siguiente" data-accion="ficha-siguiente">${esc(ultima ? T.seguir : K.siguiente)}</button>` : ''}
    </div>`;
}

function vistaCierreCasos() {
  const K = T.casos;
  return `<p class="antetitulo">${esc(K.titulo)}</p>
    <h1 id="titulo" tabindex="-1">${esc(K.glosario)}</h1>
    <div class="tarjeta">${listaGlosario()}</div>
    <h2>${esc(K.referencias)}</h2>
    <ul class="referencias">${REFERENCIAS.map((r) => `<li>${esc(r)}</li>`).join('')}</ul>
    <p class="aviso">${esc(K.cierre)}</p>
    <div class="acciones">
      <button type="button" class="boton secundario" data-accion="ficha-anterior">${esc(K.anterior)}</button>
      <button type="button" class="boton" data-accion="ir-productor">${esc(K.irProductor)}</button>
    </div>`;
}

/* ---------- Productor ---------- */

function filasProductor() {
  const P = T.productor;
  const p = estado.productor;
  const intermediario = { canal: P.canales.intermediario, pesos: C.ingresoIntermediario(), pago: P.pagos.contado };
  const filas = [null, null, null, null];
  if (p.r1.opcion) {
    filas[0] = p.r1.opcion === 'supermercado' ? { ...intermediario, canal: P.canales.rechazo } : intermediario;
  }
  if (p.r2.opcion) {
    filas[1] = p.r2.opcion === 'asociacion'
      ? { canal: P.canales.asociacion, pesos: C.ingresoAsociacion(VALORES.precioAsociacion), pago: P.pagos.plazo }
      : intermediario;
  }
  if (p.r2.evento) {
    filas[2] = p.r2.evento === 'seguir'
      ? { canal: P.canales.asociacion, pesos: C.ingresoAsociacion(C.precioIgualarGrande()), pago: P.pagos.plazo }
      : intermediario;
  }
  if (p.rondaMax >= 3) {
    filas[3] = { canal: P.canales.contrato, pesos: C.ingresoProductorRonda3(), pago: P.pagos.contado };
  }
  return filas;
}

function tablaProductor() {
  const P = T.productor;
  const cuerpo = filasProductor().map((f, i) => (f
    ? `<tr><th scope="row"><span class="ronda">${esc(P.filas[i])}</span>${esc(f.canal)}</th>
        <td class="numero">${C.formatoNumero(f.pesos)}</td><td>${esc(f.pago)}</td></tr>`
    : `<tr class="vacia"><th scope="row"><span class="ronda">${esc(P.filas[i])}</span>${esc(P.pendiente)}</th>
        <td class="numero">—</td><td>—</td></tr>`)).join('');
  return `<div class="tarjeta con-tabla">
    <div class="tabla-envoltura">
      <table>
        <caption>${esc(P.tabla)} ${etiquetaIlustrativa()}</caption>
        <thead><tr>
          <th scope="col">${esc(P.columnas[0])}</th>
          <th scope="col" class="numero">${esc(P.columnas[1])}</th>
          <th scope="col">${esc(P.columnas[2])}</th>
        </tr></thead>
        <tbody>${cuerpo}</tbody>
      </table>
    </div>
  </div>`;
}

function encabezadoProductor(ronda, titulo) {
  const P = T.productor;
  return `<p class="antetitulo">${esc(P.titulo)} · ${esc(t(T.rondaDe, { n: ronda }))}</p>
    <h1 id="titulo" tabindex="-1">${esc(titulo)}</h1>
    <div class="tarjeta">
      <p><strong>${esc(P.suFinca)}:</strong> ${esc(fichaPorId(finca()).nombre)}</p>
      ${etiquetaIlustrativa()}
      <p>${txt(P.consigna)}</p>
      <p class="nota">${esc(P.notaIlustrativa)}</p>
    </div>
    ${tablaProductor()}`;
}

function navegacionRondas(ronda, completa) {
  const productor = estado.seccion === 2;
  const X = productor ? T.productor : T.gerente;
  const ultima = ronda === 3;
  const accion = ultima ? (productor ? 'ir-gerente' : 'ir-evaluacion') : 'ronda-siguiente';
  const texto = ultima ? (productor ? X.irGerente : X.irEvaluacion) : X.siguiente;
  return `<div class="acciones">
    ${ronda > 1 ? `<button type="button" class="boton secundario" data-accion="ronda-anterior">${esc(X.anterior)}</button>` : ''}
    ${completa ? `<button type="button" class="boton" id="boton-siguiente" data-accion="${accion}">${esc(texto)}</button>` : ''}
  </div>`;
}

function opcionesDe(lista) {
  return lista.map((o) => ({ valor: o.id, texto: o.texto }));
}

function vistaElegirFinca() {
  const P = T.productor;
  return `<p class="antetitulo">${esc(P.titulo)}</p>
    <h1 id="titulo" tabindex="-1">${esc(P.titulo)}</h1>
    <p class="nota">${esc(P.notaIlustrativa)}</p>
    <form data-accion="confirmar-finca" novalidate>
      ${grupoOpciones({
        nombre: 'finca',
        leyenda: P.elegirFinca,
        opciones: FICHAS.map((f) => ({ valor: f.id, texto: `${f.nombre}. ${f.lugar}` })),
        elegida: borrador('finca')
      })}
      ${botonEnviar(P.botonFinca)}
    </form>`;
}

function vistaProductorRonda1() {
  const P = T.productor;
  const R = P.ronda1;
  const r = estado.productor.r1;
  const decidido = Boolean(r.opcion);
  return `${encabezadoProductor(1, R.titulo)}
    <form data-accion="prod-r1-decision" novalidate>
      ${grupoOpciones({ nombre: 'prod-r1', leyenda: R.titulo, leyendaOculta: true, opciones: opcionesDe(R.opciones),
        elegida: decidido ? r.opcion : borrador('prod-r1'), bloqueado: decidido, ilustrativo: true })}
      ${decidido ? '' : botonEnviar(P.botonDecision)}
    </form>
    ${decidido ? `<div class="resultado" id="resultado-prod-r1" tabindex="-1">
        ${etiquetaIlustrativa()}
        <p>${txt(R.resultado[r.opcion])}</p>
      </div>
      ${bloqueTexto({ accion: 'prod-r1-frase', id: 'prod-r1-frase', etiqueta: P.frase, valorFijo: r.frase })}` : ''}
    ${navegacionRondas(1, Boolean(r.frase))}`;
}

function vistaProductorRonda2() {
  const P = T.productor;
  const R = P.ronda2;
  const r = estado.productor.r2;
  const decidido = Boolean(r.opcion);
  const eventoDecidido = Boolean(r.evento);
  const evento = decidido ? `<section class="evento" id="evento-prod-r2" tabindex="-1" aria-labelledby="evento-prod-r2-titulo">
        <h2 id="evento-prod-r2-titulo">${esc(R.eventoTitulo)}</h2>
        ${etiquetaIlustrativa()}
        <p>${txt(R.evento)}</p>
      </section>
      <form data-accion="prod-r2-evento" novalidate>
        ${grupoOpciones({ nombre: 'prod-r2-evento', leyenda: R.eventoTitulo, leyendaOculta: true, opciones: opcionesDe(R.eventoOpciones),
          elegida: eventoDecidido ? r.evento : borrador('prod-r2-evento'), bloqueado: eventoDecidido })}
        ${eventoDecidido ? '' : botonEnviar(P.botonDecision)}
      </form>` : '';
  const casoReal = eventoDecidido ? `<section class="caso-real" id="caso-real" tabindex="-1" aria-labelledby="caso-real-titulo">
        <h2 id="caso-real-titulo">${esc(R.casoRealTitulo)}</h2>
        <p>${txt(R.casoReal)}</p>
        ${fuente(R.casoRealFuente)}
      </section>
      ${bloqueTexto({ accion: 'prod-r2-frase', id: 'prod-r2-frase', etiqueta: P.frase, valorFijo: r.frase })}` : '';
  return `${encabezadoProductor(2, R.titulo)}
    <div class="tarjeta">${etiquetaIlustrativa()}<p>${txt(R.texto)}</p></div>
    <form data-accion="prod-r2-decision" novalidate>
      ${grupoOpciones({ nombre: 'prod-r2', leyenda: R.titulo, leyendaOculta: true, opciones: opcionesDe(R.opciones),
        elegida: decidido ? r.opcion : borrador('prod-r2'), bloqueado: decidido, ilustrativo: true })}
      ${decidido ? '' : botonEnviar(P.botonDecision)}
    </form>
    ${evento}
    ${casoReal}
    ${navegacionRondas(2, Boolean(r.frase))}`;
}

function vistaProductorRonda3() {
  const P = T.productor;
  const R = P.ronda3;
  const r = estado.productor.r3;
  return `${encabezadoProductor(3, R.titulo)}
    <div class="tarjeta">${etiquetaIlustrativa()}<p>${txt(R.texto)}</p>${fuente(R.fuente)}</div>
    <div class="resultado">${etiquetaIlustrativa()}<p>${txt(R.resultado)}</p></div>
    ${bloqueTexto({ accion: 'prod-r3', id: 'prod-r3-texto', etiqueta: R.pregunta, valorFijo: r.texto })}
    ${navegacionRondas(3, Boolean(r.texto))}`;
}

function vistaProductor() {
  const p = estado.productor;
  if (!p.finca) return vistaElegirFinca();
  return [vistaProductorRonda1, vistaProductorRonda2, vistaProductorRonda3][p.ronda - 1]();
}

/* ---------- Gerente de compras ---------- */

function encabezadoGerente(ronda, titulo) {
  const G = T.gerente;
  return `<p class="antetitulo">${esc(G.titulo)} · ${esc(t(T.rondaDe, { n: ronda }))}</p>
    <h1 id="titulo" tabindex="-1">${esc(titulo)}</h1>
    <div class="tarjeta">
      ${etiquetaIlustrativa()}
      <p>${txt(G.consigna)}</p>
      <p class="formula">${esc(G.explicacion)}</p>
      <p class="nota">${esc(T.productor.notaIlustrativa)}</p>
    </div>`;
}

function insignia(cumple, si, no) {
  return `<span class="insignia ${cumple ? 'bien' : 'mal'}">${esc(cumple ? si : no)}</span>`;
}

function bloqueResultadoGerente(r, id, antes = '') {
  const G = T.gerente;
  return `<div class="resultado" id="${id}" tabindex="-1">
    ${etiquetaIlustrativa()}
    ${antes}
    <dl class="cifras">
      <div><dt>${esc(G.costoTotal)}</dt><dd>${C.formatoPesos(r.costoTotal)}</dd></div>
      <div><dt>${esc(G.costoPorKilo)}</dt><dd>${C.formatoPesos(r.costoPorKilo)}</dd></div>
      <div><dt>${esc(G.gananciaPorKilo)}</dt><dd>${C.formatoPesos(r.gananciaPorKilo)}</dd></div>
    </dl>
    <p class="insignias">${insignia(r.cumpleMeta, G.cumpleMeta, G.noCumpleMeta)}</p>
  </div>`;
}

function vistaGerenteRonda1() {
  const G = T.gerente;
  const R = G.ronda1;
  const r = estado.gerente.r1;
  const decidido = Boolean(r.opcion);
  return `${encabezadoGerente(1, R.titulo)}
    <form data-accion="ger-r1-decision" novalidate>
      ${grupoOpciones({ nombre: 'ger-r1', leyenda: R.titulo, leyendaOculta: true, opciones: opcionesDe(R.opciones),
        elegida: decidido ? r.opcion : borrador('ger-r1'), bloqueado: decidido, ilustrativo: true })}
      ${decidido ? '' : botonEnviar(G.botonDecision)}
    </form>
    ${decidido ? `${bloqueResultadoGerente(C.resultadoPedido(C.pedidoGerente(r.opcion)), 'resultado-ger-r1')}
      ${bloqueTexto({ accion: 'ger-r1-frase', id: 'ger-r1-frase', etiqueta: G.frase, valorFijo: r.frase })}` : ''}
    ${navegacionRondas(1, Boolean(r.frase))}`;
}

function vistaGerenteRonda2() {
  const G = T.gerente;
  const R = G.ronda2;
  const r = estado.gerente.r2;
  const decidido = Boolean(r.opcion);
  const eventoDecidido = Boolean(r.evento);
  const evento = decidido ? `${bloqueResultadoGerente(C.resultadoPedido(C.pedidoGerente(r.opcion)), 'resultado-ger-r2')}
      <section class="evento" id="evento-ger-r2" tabindex="-1" aria-labelledby="evento-ger-r2-titulo">
        <h2 id="evento-ger-r2-titulo">${esc(R.eventoTitulo)}</h2>
        ${etiquetaIlustrativa()}
        <p>${txt(R.evento)}</p>
      </section>
      <form data-accion="ger-r2-evento" novalidate>
        ${grupoOpciones({ nombre: 'ger-r2-evento', leyenda: R.eventoTitulo, leyendaOculta: true, opciones: opcionesDe(R.eventoOpciones),
          elegida: eventoDecidido ? r.evento : borrador('ger-r2-evento'), bloqueado: eventoDecidido })}
        ${eventoDecidido ? '' : botonEnviar(G.botonDecision)}
      </form>` : '';
  const final = eventoDecidido ? `${bloqueResultadoGerente(
        C.resultadoPedido(C.pedidoGerente(PEDIDO_EVENTO_GERENTE[r.evento])),
        'resultado-ger-evento',
        r.evento === 'igualar' ? `<p>${txt(R.igualar)}</p>` : ''
      )}
      ${bloqueTexto({ accion: 'ger-r2-frase', id: 'ger-r2-frase', etiqueta: G.frase, valorFijo: r.frase })}` : '';
  return `${encabezadoGerente(2, R.titulo)}
    <form data-accion="ger-r2-decision" novalidate>
      ${grupoOpciones({ nombre: 'ger-r2', leyenda: R.titulo, leyendaOculta: true, opciones: opcionesDe(R.opciones),
        elegida: decidido ? r.opcion : borrador('ger-r2'), bloqueado: decidido, ilustrativo: true })}
      ${decidido ? '' : botonEnviar(G.botonDecision)}
    </form>
    ${evento}
    ${final}
    ${navegacionRondas(2, Boolean(r.frase))}`;
}

function vistaGerenteRonda3() {
  const G = T.gerente;
  const R = G.ronda3;
  const r = estado.gerente.r3;
  const confirmado = Number.isFinite(r.kilos);
  const kilos = confirmado ? r.kilos : C.ajustarKilos(borrador('ger-r3-kilos', 0));
  const x = C.repartoContrato(kilos);
  const bloqueo = confirmado ? ' disabled' : '';
  return `${encabezadoGerente(3, R.titulo)}
    <div class="tarjeta">${etiquetaIlustrativa()}<p>${txt(R.texto)}</p>${fuente(R.fuente)}</div>
    <form data-accion="ger-r3-reparto" novalidate>
      <p class="campo" id="control-kilos">${esc(R.control)}</p>
      <div class="reparto">
        <input type="range" id="kilos-deslizador" min="0" max="600" step="10" value="${kilos}"
          aria-labelledby="control-kilos" aria-valuetext="${kilos} kilos"${bloqueo}>
        <div>
          <label class="oculto" for="kilos-numero">${esc(R.numero)}</label>
          <input type="number" id="kilos-numero" min="0" max="600" step="10" inputmode="numeric" value="${kilos}"${bloqueo}>
        </div>
      </div>
      <div class="resultado" id="reparto-vivo" tabindex="-1">
        ${etiquetaIlustrativa()}
        <dl class="cifras">
          <div><dt>${esc(R.kilosAsociacion)}</dt><dd id="rv-asociacion">${C.formatoNumero(x.kilosAsociacion)}</dd></div>
          <div><dt>${esc(R.kilosGrande)}</dt><dd id="rv-grande">${C.formatoNumero(x.kilosGrande)}</dd></div>
          <div><dt>${esc(R.participacion)}</dt><dd id="rv-participacion">${C.formatoPorcentaje(x.participacion)}</dd></div>
          <div><dt>${esc(G.costoPorKilo)}</dt><dd id="rv-costo">${C.formatoPesos(x.costoPorKilo)}</dd></div>
          <div><dt>${esc(G.gananciaPorKilo)}</dt><dd id="rv-ganancia">${C.formatoPesos(x.gananciaPorKilo)}</dd></div>
        </dl>
        <p class="insignias" aria-live="polite">
          <span id="rv-ley">${insignia(x.cumpleLey, R.cumpleLey, R.noCumpleLey)}</span>
          <span id="rv-meta">${insignia(x.cumpleMeta, G.cumpleMeta, G.noCumpleMeta)}</span>
        </p>
      </div>
      <p class="formula">${txt(R.nota)}</p>
      ${confirmado ? '' : botonEnviar(R.boton)}
    </form>
    ${confirmado ? bloqueTexto({ accion: 'ger-r3-texto', id: 'ger-r3-texto', etiqueta: R.pregunta, valorFijo: r.texto }) : ''}
    ${navegacionRondas(3, Boolean(r.texto))}`;
}

// Actualiza las cifras del reparto sin volver a pintar la página.
function actualizarReparto(kilos) {
  const G = T.gerente;
  const R = G.ronda3;
  const x = C.repartoContrato(kilos);
  cambiarTexto(document.getElementById('rv-asociacion'), C.formatoNumero(x.kilosAsociacion));
  cambiarTexto(document.getElementById('rv-grande'), C.formatoNumero(x.kilosGrande));
  cambiarTexto(document.getElementById('rv-participacion'), C.formatoPorcentaje(x.participacion));
  cambiarTexto(document.getElementById('rv-costo'), C.formatoPesos(x.costoPorKilo));
  cambiarTexto(document.getElementById('rv-ganancia'), C.formatoPesos(x.gananciaPorKilo));
  const ley = document.getElementById('rv-ley');
  const meta = document.getElementById('rv-meta');
  if (ley) ley.innerHTML = insignia(x.cumpleLey, R.cumpleLey, R.noCumpleLey);
  if (meta) meta.innerHTML = insignia(x.cumpleMeta, G.cumpleMeta, G.noCumpleMeta);
  const deslizador = document.getElementById('kilos-deslizador');
  if (deslizador) deslizador.setAttribute('aria-valuetext', `${kilos} kilos`);
}

function vistaGerente() {
  return [vistaGerenteRonda1, vistaGerenteRonda2, vistaGerenteRonda3][estado.gerente.ronda - 1]();
}

/* ---------- Evaluación ---------- */

// En las tablas angostas, "pesos" puede pasar a la línea siguiente.
const pesosEnTabla = (n) => `${C.formatoNumero(n)} pesos`;

function filasResumenProductor() {
  const P = T.productor;
  const E = T.evaluacion;
  const p = estado.productor;
  const pago = (f) => t(E.familiaSemana, { pesos: pesosEnTabla(f.pesos), pago: f.pago });
  const tabla = filasProductor();
  const decisiones = [
    p.r1.opcion ? (p.r1.opcion === 'supermercado' ? E.rechazo : etiquetaDe(P.ronda1.opciones, p.r1.opcion)) : null,
    p.r2.opcion ? etiquetaDe(P.ronda2.opciones, p.r2.opcion) : null,
    p.r2.evento ? etiquetaDe(P.ronda2.eventoOpciones, p.r2.evento) : null,
    p.rondaMax >= 3 ? E.contrato : null
  ];
  return decisiones.map((d, i) => [P.filas[i], d || E.pendiente, tabla[i] ? pago(tabla[i]) : T.resumenVista.sinDato]);
}

function filasResumenGerente() {
  const P = T.productor;
  const G = T.gerente;
  const E = T.evaluacion;
  const g = estado.gerente;
  const celda = (ganancia) => t(E.gananciaMeta, {
    pesos: pesosEnTabla(ganancia),
    meta: C.cumpleMeta(ganancia) ? G.cumpleMeta : G.noCumpleMeta
  });
  const filas = [];
  filas.push(g.r1.opcion
    ? [P.filas[0], etiquetaDe(G.ronda1.opciones, g.r1.opcion), celda(gananciaDe(g.r1.opcion))]
    : [P.filas[0], E.pendiente, T.resumenVista.sinDato]);
  filas.push(g.r2.opcion
    ? [P.filas[1], etiquetaDe(G.ronda2.opciones, g.r2.opcion), celda(gananciaDe(g.r2.opcion))]
    : [P.filas[1], E.pendiente, T.resumenVista.sinDato]);
  filas.push(g.r2.evento
    ? [P.filas[2], etiquetaDe(G.ronda2.eventoOpciones, g.r2.evento), celda(gananciaDe(PEDIDO_EVENTO_GERENTE[g.r2.evento]))]
    : [P.filas[2], E.pendiente, T.resumenVista.sinDato]);
  if (Number.isFinite(g.r3.kilos)) {
    const x = C.repartoContrato(g.r3.kilos);
    const decision = t(E.repartoResumen, {
      reparto: t(G.ronda3.reparto, { a: C.formatoNumero(x.kilosAsociacion), g: C.formatoNumero(x.kilosGrande) }),
      porcentaje: C.formatoPorcentaje(x.participacion),
      ley: x.cumpleLey ? G.ronda3.cumpleLey : G.ronda3.noCumpleLey
    });
    filas.push([P.filas[3], decision, celda(x.gananciaPorKilo)]);
  } else {
    filas.push([P.filas[3], E.pendiente, T.resumenVista.sinDato]);
  }
  return filas;
}

function tablaResumen(columnas, filas) {
  return `<div class="tabla-envoltura"><table>
    <thead><tr>${columnas.map((c) => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead>
    <tbody>${filas.map((f) => `<tr><th scope="row">${esc(f[0])}</th><td>${txt(f[1])}</td><td>${txt(f[2])}</td></tr>`).join('')}</tbody>
  </table></div>`;
}

function vistaEvaluacion() {
  const E = T.evaluacion;
  const ev = estado.evaluacion;
  const enviada = ev.enviada;
  const fija = (clave) => (enviada ? ev.respuestas[clave] : undefined);
  const suFinca = fichaPorId(finca());
  return `<h1 id="titulo" tabindex="-1">${esc(E.titulo)}</h1>
    <section class="tarjeta con-tabla" aria-labelledby="resumen-decisiones">
      <h2 id="resumen-decisiones">${esc(E.resumen)}</h2>
      ${etiquetaIlustrativa()}
      <h3>${esc(E.comoProductor)}</h3>
      ${suFinca ? `<p><strong>${esc(T.productor.suFinca)}:</strong> ${esc(suFinca.nombre)}</p>` : ''}
      ${tablaResumen(E.columnasProductor, filasResumenProductor())}
      <h3>${esc(E.comoGerente)}</h3>
      ${tablaResumen(E.columnasGerente, filasResumenGerente())}
    </section>
    <form data-accion="enviar-evaluacion" novalidate>
      ${E.preguntas.map((q) => campoTexto({ id: 'ev-' + q.id, etiqueta: q.texto, valorFijo: fija(q.id) })).join('')}
      ${grupoOpciones({
        nombre: 'ev-canal',
        leyenda: E.canal,
        opciones: E.canalOpciones.map((o) => ({ valor: o, texto: o })),
        elegida: enviada ? ev.respuestas.canal : borrador('ev-canal'),
        bloqueado: enviada
      })}
      ${campoTexto({ id: 'ev-porque', etiqueta: E.porque, valorFijo: fija('porque') })}
      ${enviada ? '' : botonEnviar(E.boton)}
    </form>
    ${enviada ? `<p class="aviso final" id="final" tabindex="-1">${esc(E.final)}</p>` : ''}`;
}

/* ---------- Pintar ---------- */

const VISTAS = [vistaInicio, vistaCasos, vistaProductor, vistaGerente, vistaEvaluacion];
const vista = document.getElementById('vista');

// foco: id del elemento que recibe el foco. 'titulo' sube al inicio de la página.
function pintar(foco) {
  pintarAvance();
  pintarIndicador();
  vista.innerHTML = VISTAS[estado.seccion]();
  pintarReinicio();
  const el = foco ? document.getElementById(foco) : null;
  if (!el) return;
  if (foco === 'titulo') window.scrollTo(0, 0);
  else el.scrollIntoView({ block: el.tagName === 'BUTTON' ? 'center' : 'start' });
  el.focus({ preventScroll: true });
}

function irASeccion(i) {
  estado.seccion = i;
  estado.seccionMax = Math.max(estado.seccionMax, i);
  guardarEstado();
  pintar('titulo');
}

/* ---------- Acciones ---------- */

function enviarOpcion(form, nombre, guardar, datosRegistro, foco) {
  const v = validar(form, [{ tipo: 'opcion', nombre }]);
  if (!v) return;
  guardar(v[nombre]);
  guardarEstado();
  registrar(datosRegistro(v[nombre]));
  vaciarCola();
  pintar(foco);
}

function enviarTexto(form, id, guardar, datosRegistro, foco = 'boton-siguiente') {
  const v = validar(form, [{ tipo: 'texto', id }]);
  if (!v) return;
  guardar(v[id]);
  guardarEstado();
  registrar(datosRegistro(v[id]));
  vaciarCola();
  pintar(foco);
}

function empezar(form) {
  const campo = form.querySelector('#nombre');
  const nombre = campo.value.trim().replace(/\s+/g, ' ');
  if (nombre.split(' ').length < 2) {
    marcarError('error-nombre', T.errores.nombre, campo);
    campo.focus();
    return;
  }
  estado.nombre = nombre;
  irASeccion(1);
}

function enviarFicha(form) {
  const id = form.dataset.ficha;
  const elegida = form.querySelector(`input[name="${id}-limita"]:checked`);
  const otra = Boolean(elegida && elegida.value === 'Otra');
  const reglas = [
    { tipo: 'opcion', nombre: `${id}-alcanza` },
    { tipo: 'texto', id: `${id}-alcanza-texto` },
    { tipo: 'opcion', nombre: `${id}-limita` }
  ];
  if (otra) reglas.push({ tipo: 'corto', id: `${id}-cual`, mensaje: T.errores.cual });
  reglas.push({ tipo: 'texto', id: `${id}-limita-texto` });
  const v = validar(form, reglas);
  if (!v) return;
  const cual = otra ? v[`${id}-cual`] : '';
  estado.casos.fichas[id] = {
    alcanza: { opcion: v[`${id}-alcanza`], texto: v[`${id}-alcanza-texto`] },
    limita: { opcion: v[`${id}-limita`], cual, texto: v[`${id}-limita-texto`] }
  };
  guardarEstado();
  registrar({ seccion: 'casos', ficha: id, pregunta: 'alcanza', opcion: v[`${id}-alcanza`], texto: v[`${id}-alcanza-texto`] });
  registrar({
    seccion: 'casos',
    ficha: id,
    pregunta: 'limita',
    opcion: otra ? `Otra: ${cual}` : v[`${id}-limita`],
    texto: v[`${id}-limita-texto`]
  });
  vaciarCola();
  pintar('aviso-ficha');
}

function confirmarFinca(form) {
  const v = validar(form, [{ tipo: 'opcion', nombre: 'finca' }]);
  if (!v) return;
  const p = estado.productor;
  p.finca = v.finca;
  p.ronda = 1;
  p.rondaMax = Math.max(p.rondaMax, 1);
  guardarEstado();
  registrar({ seccion: 'productor', ficha: p.finca, pregunta: 'finca', opcion: fichaPorId(p.finca).nombre });
  vaciarCola();
  pintar('titulo');
}

function confirmarReparto() {
  const kilos = C.ajustarKilos(document.getElementById('kilos-numero').value);
  estado.gerente.r3.kilos = kilos;
  guardarEstado();
  registrar({
    seccion: 'gerente',
    ficha: finca(),
    ronda: '3',
    pregunta: 'kilos_asociacion',
    opcion: t(T.gerente.ronda3.reparto, { a: kilos, g: VALORES.pedidoSemanal - kilos }),
    valor: kilos
  });
  vaciarCola();
  pintar('reparto-vivo');
}

function enviarEvaluacion(form) {
  const E = T.evaluacion;
  const reglas = E.preguntas.map((q) => ({ tipo: 'texto', id: 'ev-' + q.id }));
  reglas.push({ tipo: 'opcion', nombre: 'ev-canal' }, { tipo: 'texto', id: 'ev-porque' });
  const v = validar(form, reglas);
  if (!v) return;
  const respuestas = { canal: v['ev-canal'], porque: v['ev-porque'] };
  E.preguntas.forEach((q) => { respuestas[q.id] = v['ev-' + q.id]; });
  estado.evaluacion = { enviada: true, respuestas };
  guardarEstado();
  E.preguntas.forEach((q) => registrar({ seccion: 'evaluacion', ficha: finca(), pregunta: q.id, texto: respuestas[q.id] }));
  registrar({ seccion: 'evaluacion', ficha: finca(), pregunta: 'canal_final', opcion: respuestas.canal, texto: respuestas.porque });
  vaciarCola();
  pintar('final');
}

const datosProductor = (extra) => ({ seccion: 'productor', ficha: finca(), ...extra });
const datosGerente = (extra) => ({ seccion: 'gerente', ficha: finca(), ...extra });
const P = T.productor;
const G = T.gerente;

const ACCIONES_FORMULARIO = {
  'empezar': empezar,
  'enviar-ficha': enviarFicha,
  'confirmar-finca': confirmarFinca,
  'prod-r1-decision': (f) => enviarOpcion(f, 'prod-r1', (v) => { estado.productor.r1.opcion = v; },
    (v) => datosProductor({ ronda: '1', pregunta: 'decision', opcion: etiquetaDe(P.ronda1.opciones, v), valor: C.ingresoIntermediario() }),
    'resultado-prod-r1'),
  'prod-r1-frase': (f) => enviarTexto(f, 'prod-r1-frase', (v) => { estado.productor.r1.frase = v; },
    (v) => datosProductor({ ronda: '1', pregunta: 'frase', texto: v })),
  'prod-r2-decision': (f) => enviarOpcion(f, 'prod-r2', (v) => { estado.productor.r2.opcion = v; },
    (v) => datosProductor({
      ronda: '2', pregunta: 'decision', opcion: etiquetaDe(P.ronda2.opciones, v),
      valor: v === 'asociacion' ? C.ingresoAsociacion(VALORES.precioAsociacion) : C.ingresoIntermediario()
    }),
    'evento-prod-r2'),
  'prod-r2-evento': (f) => enviarOpcion(f, 'prod-r2-evento', (v) => { estado.productor.r2.evento = v; },
    (v) => datosProductor({
      ronda: 'evento', pregunta: 'decision', opcion: etiquetaDe(P.ronda2.eventoOpciones, v),
      valor: v === 'seguir' ? C.ingresoAsociacion(C.precioIgualarGrande()) : C.ingresoIntermediario()
    }),
    'caso-real'),
  'prod-r2-frase': (f) => enviarTexto(f, 'prod-r2-frase', (v) => { estado.productor.r2.frase = v; },
    (v) => datosProductor({ ronda: '2', pregunta: 'frase', texto: v })),
  'prod-r3': (f) => enviarTexto(f, 'prod-r3-texto', (v) => { estado.productor.r3.texto = v; },
    (v) => datosProductor({ ronda: '3', pregunta: 'ley', texto: v, valor: C.ingresoProductorRonda3() })),
  'ger-r1-decision': (f) => enviarOpcion(f, 'ger-r1', (v) => { estado.gerente.r1.opcion = v; },
    (v) => datosGerente({ ronda: '1', pregunta: 'decision', opcion: etiquetaDe(G.ronda1.opciones, v), valor: gananciaDe(v) }),
    'resultado-ger-r1'),
  'ger-r1-frase': (f) => enviarTexto(f, 'ger-r1-frase', (v) => { estado.gerente.r1.frase = v; },
    (v) => datosGerente({ ronda: '1', pregunta: 'frase', texto: v })),
  'ger-r2-decision': (f) => enviarOpcion(f, 'ger-r2', (v) => { estado.gerente.r2.opcion = v; },
    (v) => datosGerente({ ronda: '2', pregunta: 'decision', opcion: etiquetaDe(G.ronda2.opciones, v), valor: gananciaDe(v) }),
    'resultado-ger-r2'),
  'ger-r2-evento': (f) => enviarOpcion(f, 'ger-r2-evento', (v) => { estado.gerente.r2.evento = v; },
    (v) => datosGerente({
      ronda: 'evento', pregunta: 'decision', opcion: etiquetaDe(G.ronda2.eventoOpciones, v),
      valor: gananciaDe(PEDIDO_EVENTO_GERENTE[v])
    }),
    'resultado-ger-evento'),
  'ger-r2-frase': (f) => enviarTexto(f, 'ger-r2-frase', (v) => { estado.gerente.r2.frase = v; },
    (v) => datosGerente({ ronda: '2', pregunta: 'frase', texto: v })),
  'ger-r3-reparto': confirmarReparto,
  'ger-r3-texto': (f) => enviarTexto(f, 'ger-r3-texto', (v) => { estado.gerente.r3.texto = v; },
    (v) => datosGerente({ ronda: '3', pregunta: 'costo_ley', texto: v })),
  'enviar-evaluacion': enviarEvaluacion
};

function rondaCompleta(seccion, ronda) {
  const s = estado[seccion];
  if (ronda === 3) return Boolean(s.r3.texto);
  return Boolean(s['r' + ronda].frase);
}

function seccionConRondas() {
  return estado.seccion === 2 ? 'productor' : 'gerente';
}

const ACCIONES_CLIC = {
  'ir-seccion': (boton) => {
    const i = Number(boton.dataset.seccion);
    if (i <= estado.seccionMax) irASeccion(i);
  },
  'seguir-avance': () => irASeccion(estado.seccionMax),
  'ficha-anterior': () => {
    estado.casos.paso = Math.max(0, estado.casos.paso - 1);
    guardarEstado();
    pintar('titulo');
  },
  'ficha-siguiente': () => {
    const actual = FICHAS[estado.casos.paso];
    if (!actual || !estado.casos.fichas[actual.id]) return;
    estado.casos.paso += 1;
    guardarEstado();
    pintar('titulo');
  },
  'ir-productor': () => irASeccion(2),
  'ronda-anterior': () => {
    const s = estado[seccionConRondas()];
    if (s.ronda > 1) {
      s.ronda -= 1;
      guardarEstado();
      pintar('titulo');
    }
  },
  'ronda-siguiente': () => {
    const nombre = seccionConRondas();
    const s = estado[nombre];
    if (s.ronda < 3 && rondaCompleta(nombre, s.ronda)) {
      s.ronda += 1;
      s.rondaMax = Math.max(s.rondaMax, s.ronda);
      guardarEstado();
      pintar('titulo');
    }
  },
  'ir-gerente': () => irASeccion(3),
  'ir-evaluacion': () => irASeccion(4),
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
  if (el.type === 'radio' && el.name) {
    guardarBorrador(el.name, el.value);
    limpiarError(el);
    document.querySelectorAll(`input[name="${el.name}"]`).forEach((r) => {
      const caja = r.closest('.opcion');
      if (caja) caja.classList.toggle('elegida', r.checked);
    });
    if (el.name.endsWith('-limita')) {
      const caja = document.getElementById(el.name.replace(/-limita$/, '-cual-caja'));
      if (caja) caja.hidden = el.value !== 'Otra';
    }
  }
  if (el.id === 'kilos-numero') {
    const kilos = C.ajustarKilos(el.value);
    el.value = kilos;
    document.getElementById('kilos-deslizador').value = kilos;
    guardarBorrador('ger-r3-kilos', kilos);
    actualizarReparto(kilos);
  }
});

document.addEventListener('input', (evento) => {
  const el = evento.target;
  if (el.id === 'kilos-deslizador') {
    const kilos = C.ajustarKilos(el.value);
    document.getElementById('kilos-numero').value = kilos;
    guardarBorrador('ger-r3-kilos', kilos);
    actualizarReparto(kilos);
    return;
  }
  if (el.id === 'kilos-numero') {
    if (el.value === '') return;
    const kilos = C.ajustarKilos(el.value);
    document.getElementById('kilos-deslizador').value = kilos;
    guardarBorrador('ger-r3-kilos', kilos);
    actualizarReparto(kilos);
    return;
  }
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
