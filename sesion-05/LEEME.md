# Herramienta de la sesión 5. Instrucciones para el profesor

Taller "Fincas pequeñas y acceso al mercado". Desarrollo Rural 5001462, lunes 28 de septiembre de 2026.

## 1. Apps Script y URL

La herramienta usa el mismo Apps Script de la sesión 4. Escribe en la misma hoja "respuestas".

La URL está en `sesion-05/config.js`, en `URL_APPS_SCRIPT`. Es la misma URL de `URL_HOJA` en el `index.html` de la raíz.

Las filas de la sesión 5 llevan curso 5001462, sesión 5 y actividad `fincas-pequenas`.

El script escribe una fila por campo. Cada respuesta ocupa 12 filas seguidas con la misma marca temporal. La columna `pregunta` dice el campo y la columna `respuesta` dice el valor.

Campos de cada respuesta: `clave`, `sesion`, `id_estudiante`, `estudiante`, `seccion`, `ficha`, `ronda`, `pregunta`, `opcion`, `texto`, `valor` y `hora_cliente`.

Códigos del campo `pregunta`:

| Sección | Códigos |
| --- | --- |
| casos | alcanza, limita |
| productor | finca, decision, frase, ley |
| gerente | decision, frase, kilos_asociacion, costo_ley |
| evaluacion | productor, gerente, coincide, canal_final |

La decisión que sigue al evento de la ronda 2 lleva `ronda` = evento.

## 2. Cambios en el script

No hubo que cambiar el script.

Si algún día lo cambia, publique una versión nueva de la misma implementación. Así la URL no cambia.

1. En el editor de Apps Script, guarde el código.
2. Abra Implementar y escoja Gestionar implementaciones.
3. Edite la implementación activa.
4. En versión, escoja Nueva versión.
5. Pulse Implementar.

## 3. Hoja nueva

No se usó una hoja nueva.

## 4. Direcciones públicas

Página de los estudiantes: https://lataborda.github.io/panel-desarrollo-rural/sesion-05/

Vista del profesor: https://lataborda.github.io/panel-desarrollo-rural/sesion-05/resumen.html

Publique en Classroom solo la página de los estudiantes. La vista del profesor muestra nombres y respuestas. Cualquiera que tenga la dirección puede verla.

La vista del profesor se actualiza cada 20 segundos. Si no puede leer las respuestas, abra la hoja de Google Sheets.

## 5. Prueba completa antes de clase

1. Abra la página de los estudiantes en su celular.
2. Escriba el nombre "PRUEBA Profesor".
3. Responda al menos una ficha, una ronda de productor y una ronda de gerente.
4. Revise que arriba diga "Registrado".
5. Revise que las filas lleguen a la hoja "respuestas".
6. Abra la vista del profesor en el computador. Revise que muestre esas respuestas.

Si el celular pierde la señal, la página guarda las respuestas y muestra "Pendiente de envío". Las envía cuando vuelve la conexión.

Para comprobar los cálculos, abra una terminal en la carpeta `sesion-05` y escriba `node pruebas/pruebas.mjs`. Necesita Node 22 o más reciente.

## 6. Filas de prueba

1. En la hoja "respuestas", active un filtro.
2. Filtre la columna `sesion` por 5.
3. Filtre la columna `estudiante` por el nombre de prueba.
4. Borre esas filas. No borre filas de la sesión 4.
5. En el celular, use el botón "Empezar de nuevo" al final de la página.

"Empezar de nuevo" borra lo guardado en el celular. No borra nada de la hoja.
