// Script de la hoja de la sesión 6. Desarrollo Rural 5001462. Taller de medios de vida.
//
// Pasos de implementación:
// 1. En la hoja nueva, abra Extensiones y luego Apps Script.
// 2. Borre el contenido y pegue este archivo.
// 3. Guarde.
// 4. Abra Implementar y escoja Nueva implementación.
// 5. Tipo: Aplicación web. Ejecutar como: yo. Quién tiene acceso: cualquier usuario.
// 6. Autorice los permisos.
// 7. Copie la URL que termina en /exec y péguela en sesion-06/config.js.
//
// El script va vinculado a la hoja. Usa SpreadsheetApp.getActiveSpreadsheet().
// Así el identificador de la hoja no aparece en ningún archivo.

var CLAVE = 'dr-sesion6-2026';
var PESTANA = 'registros';
var ZONA_HORARIA = 'America/Bogota';
var COLUMNAS = [
  'fecha_servidor', 'hora_cliente', 'clave', 'curso', 'sesion', 'actividad', 'id_estudiante', 'estudiante', 'hogar',
  'seccion', 'trimestre', 'cacao', 'huerta', 'jornal', 'oficio', 'proyecto', 'contratadas', 'libres', 'migra',
  'cosecha', 'ingresos', 'gastos', 'saldo', 'decision', 'pregunta', 'texto'
];

// Recibe un envío de la página. El cuerpo es una fila o { filas: [...] }.
function doPost(e) {
  var datos = leerEnvio(e);
  if (!datos) return responder({ ok: false, error: 'Envío vacío o inválido.' });
  var lista = Array.isArray(datos.filas) ? datos.filas : [datos];
  var validas = lista.filter(function (f) { return f && f.clave === CLAVE; });
  if (!validas.length) return responder({ ok: false, error: 'Clave incorrecta.' });

  var candado = LockService.getScriptLock();
  try {
    candado.waitLock(20000);
  } catch (error) {
    return responder({ ok: false, error: 'La hoja está ocupada. Intente de nuevo.' });
  }
  try {
    var hoja = pestanaRegistros();
    var ahora = new Date();
    var valores = validas.map(function (f) {
      return COLUMNAS.map(function (c, i) { return i === 0 ? ahora : celda(f[c]); });
    });
    hoja.getRange(hoja.getLastRow() + 1, 1, valores.length, COLUMNAS.length).setValues(valores);
  } finally {
    candado.releaseLock();
  }
  return responder({ ok: true, filas: validas.length });
}

// Devuelve las filas de un curso, una sesión y una actividad. fecha (AAAA-MM-DD) es opcional.
// Con el parámetro callback responde en formato JSONP.
function doGet(e) {
  var p = (e && e.parameter) || {};
  var filas = [];
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(PESTANA);
  if (hoja && hoja.getLastRow() > 1) {
    var valores = hoja.getRange(2, 1, hoja.getLastRow() - 1, COLUMNAS.length).getValues();
    filas = valores.map(function (v) {
      var fila = {};
      COLUMNAS.forEach(function (c, i) {
        var x = v[i];
        fila[c] = esFecha(x) ? new Date(x.getTime()).toISOString() : x;
      });
      fila._dia = esFecha(v[0]) ? Utilities.formatDate(new Date(v[0].getTime()), ZONA_HORARIA, 'yyyy-MM-dd') : '';
      return fila;
    }).filter(function (f) {
      return (!p.curso || String(f.curso) === String(p.curso))
        && (!p.sesion || String(f.sesion) === String(p.sesion))
        && (!p.actividad || String(f.actividad) === String(p.actividad))
        && (!p.fecha || f._dia === p.fecha);
    }).map(function (f) {
      delete f._dia;
      return f;
    });
  }
  var cuerpo = JSON.stringify({ ok: true, filas: filas });
  if (p.callback && /^[A-Za-z_$][\w$]{0,80}$/.test(p.callback)) {
    return ContentService.createTextOutput(p.callback + '(' + cuerpo + ');')
      .setMimeType(ContentService.MimeType.JAVASCRIPT);
  }
  return ContentService.createTextOutput(cuerpo).setMimeType(ContentService.MimeType.JSON);
}

// Lee el JSON de e.postData.contents. Si no hay, lee e.parameter.data.
// El envío sin CORS llega como formulario, con el JSON en el campo data.
function leerEnvio(e) {
  if (e && e.postData && e.postData.contents && e.postData.type !== 'application/x-www-form-urlencoded') {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      // Sigue con e.parameter.data.
    }
  }
  if (e && e.parameter && e.parameter.data) {
    try {
      return JSON.parse(e.parameter.data);
    } catch (error) {
      return null;
    }
  }
  return null;
}

// Crea la pestaña con los encabezados si no existe.
function pestanaRegistros() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  var hoja = libro.getSheetByName(PESTANA);
  if (!hoja) {
    hoja = libro.insertSheet(PESTANA);
    hoja.getRange(1, 1, 1, COLUMNAS.length).setValues([COLUMNAS]).setFontWeight('bold');
    hoja.setFrozenRows(1);
  }
  return hoja;
}

// Las fechas que devuelve la hoja no siempre pasan la prueba instanceof Date. Esta sí las reconoce.
function esFecha(x) {
  return Object.prototype.toString.call(x) === '[object Date]' && !isNaN(x.getTime());
}

// Los números quedan como números. El texto lleva un apóstrofo al inicio: la hoja lo guarda como texto,
// no lo convierte en fecha ni en fórmula, y no lo devuelve al leer.
function celda(valor) {
  if (valor === undefined || valor === null || valor === '') return '';
  if (typeof valor === 'number') return isFinite(valor) ? valor : '';
  return "'" + String(valor);
}

function responder(datos) {
  return ContentService.createTextOutput(JSON.stringify(datos)).setMimeType(ContentService.MimeType.JSON);
}
