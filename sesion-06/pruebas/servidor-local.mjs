// Servidor local para trabajar en la herramienta de la sesión 6 sin escribir en Google Sheets.
//
// Uso, desde la carpeta del repositorio:
//   node sesion-06/pruebas/servidor-local.mjs                  registro simulado
//   node sesion-06/pruebas/servidor-local.mjs --sin-registro   sin registro en línea
//   node sesion-06/pruebas/servidor-local.mjs --red            también para el celular, en la misma red
//
// El config.js del disco no cambia. El servidor entrega una copia con la dirección de una hoja simulada.
// La hoja simulada guarda las filas en memoria, con la misma lógica de apps-script/Codigo.gs.
// Las filas se borran al detener el servidor con Ctrl+C.
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const RAIZ = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const PUERTO_WEB = 8767;
const PUERTO_HOJA = 8768;
const SIN_REGISTRO = process.argv.includes('--sin-registro');
const EN_RED = process.argv.includes('--red');
const INTERFAZ = EN_RED ? '0.0.0.0' : '127.0.0.1';
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.gs': 'text/plain; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Copia de config.js con la hoja simulada. Si no logra cambiar la dirección, no entrega nada.
function configLocal(host) {
  const original = fs.readFileSync(path.join(RAIZ, 'sesion-06', 'config.js'), 'utf8');
  const patron = /URL_APPS_SCRIPT = '[^']*'/;
  if (!patron.test(original)) throw new Error('No se encontró URL_APPS_SCRIPT en config.js.');
  const url = SIN_REGISTRO ? 'PEGAR_AQUI_LA_URL_DEL_APPS_SCRIPT' : `http://${host}:${PUERTO_HOJA}/exec`;
  const copia = original.replace(patron, `URL_APPS_SCRIPT = '${url}'`);
  if (copia.includes('script.google.com')) throw new Error('La copia de config.js todavía apunta a Google.');
  return copia;
}

http.createServer((req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const pedido = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (pedido.pathname === '/sesion-06/config.js') {
    try {
      res.setHeader('Content-Type', TIPOS['.js']);
      res.end(configLocal(pedido.hostname));
    } catch (error) {
      res.statusCode = 500;
      res.end(`// ${error.message}\n`);
    }
    return;
  }
  let archivo = path.join(RAIZ, decodeURIComponent(pedido.pathname));
  if (archivo !== RAIZ && !archivo.startsWith(RAIZ + path.sep)) {
    res.statusCode = 403;
    res.end();
    return;
  }
  if (fs.existsSync(archivo) && fs.statSync(archivo).isDirectory()) archivo = path.join(archivo, 'index.html');
  if (!fs.existsSync(archivo)) {
    res.statusCode = 404;
    res.end('No encontrado');
    return;
  }
  res.setHeader('Content-Type', TIPOS[path.extname(archivo)] || 'application/octet-stream');
  fs.createReadStream(archivo).pipe(res);
}).listen(PUERTO_WEB, INTERFAZ, anunciar);

// Hoja simulada. Réplica de apps-script/Codigo.gs: una fila por envío, columnas fijas.
const CLAVE = 'dr-sesion6-2026';
const COLUMNAS = [
  'fecha_servidor', 'hora_cliente', 'clave', 'curso', 'sesion', 'actividad', 'id_estudiante', 'estudiante', 'hogar',
  'seccion', 'trimestre', 'cacao', 'huerta', 'jornal', 'oficio', 'proyecto', 'contratadas', 'libres', 'migra',
  'cosecha', 'ingresos', 'gastos', 'saldo', 'decision', 'pregunta', 'texto'
];
const hoja = [];

// Igual que en la hoja: el texto que empieza con apóstrofo se guarda sin él. Los números que llegan como texto
// quedan como texto.
function celda(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor === 'number') return Number.isFinite(valor) ? valor : '';
  return String(valor);
}

function diaBogota(fecha) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Bogota', year: 'numeric', month: '2-digit', day: '2-digit' }).format(fecha);
}

function responder(res, datos, callback) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (callback && /^[A-Za-z_$][\w$]{0,80}$/.test(callback)) {
    res.setHeader('Content-Type', 'text/javascript; charset=utf-8');
    res.end(`${callback}(${JSON.stringify(datos)});`);
    return;
  }
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(datos));
}

http.createServer((req, res) => {
  const pedido = new URL(req.url, 'http://localhost');
  const comoObjeto = (f) => Object.fromEntries(COLUMNAS.map((c, i) => [c, i === 0 ? f[0].toISOString() : f[i]]));
  if (req.method === 'GET' && pedido.pathname === '/filas') {
    responder(res, hoja.map(comoObjeto));
    return;
  }
  if (req.method === 'GET') {
    const p = Object.fromEntries(pedido.searchParams);
    const filas = hoja
      .filter((f) => !p.fecha || diaBogota(f[0]) === p.fecha)
      .map(comoObjeto)
      .filter((f) => (!p.curso || String(f.curso) === p.curso) && (!p.sesion || String(f.sesion) === p.sesion)
        && (!p.actividad || String(f.actividad) === p.actividad));
    responder(res, { ok: true, filas }, p.callback);
    return;
  }
  let cuerpo = '';
  req.on('data', (parte) => { cuerpo += parte; });
  req.on('end', () => {
    try {
      if ((req.headers['content-type'] || '').includes('application/x-www-form-urlencoded')) {
        cuerpo = new URLSearchParams(cuerpo).get('data') || '';
      }
      if (!cuerpo) {
        responder(res, { ok: false, error: 'Envío vacío o inválido.' });
        return;
      }
      const datos = JSON.parse(cuerpo);
      const lista = Array.isArray(datos.filas) ? datos.filas : [datos];
      const validas = lista.filter((f) => f && f.clave === CLAVE);
      if (!validas.length) {
        responder(res, { ok: false, error: 'Clave incorrecta.' });
        return;
      }
      const ahora = new Date();
      validas.forEach((f) => {
        hoja.push(COLUMNAS.map((c, i) => (i === 0 ? ahora : celda(f[c]))));
        console.log(`Registro simulado: ${f.seccion} · T${f.trimestre || '-'} · ${f.pregunta || '-'} · `
          + `hogar ${f.hogar} · ${f.estudiante}`);
      });
      responder(res, { ok: true, filas: validas.length });
    } catch (error) {
      responder(res, { ok: false, error: String(error) });
    }
  });
}).listen(PUERTO_HOJA, INTERFAZ);

function anunciar() {
  console.log('Herramienta de la sesión 6 en modo local. Nada se escribe en Google Sheets.');
  console.log(`Registro en línea: ${SIN_REGISTRO ? 'desactivado' : 'simulado'}.`);
  console.log(`Página de los estudiantes: http://localhost:${PUERTO_WEB}/sesion-06/`);
  console.log(`Vista del profesor:        http://localhost:${PUERTO_WEB}/sesion-06/resumen.html`);
  if (!SIN_REGISTRO) console.log(`Hoja simulada:             http://localhost:${PUERTO_HOJA}/filas`);
  if (EN_RED) {
    Object.values(os.networkInterfaces()).flat()
      .filter((d) => d && d.family === 'IPv4' && !d.internal)
      .forEach((d) => console.log(`Desde el celular:          http://${d.address}:${PUERTO_WEB}/sesion-06/`));
  }
  console.log('Detenga el servidor con Ctrl+C.');
}
