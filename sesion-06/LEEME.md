# Herramienta del taller de la sesión 6

Taller de medios de vida rurales. Desarrollo Rural 5001462. Lunes 5 de octubre de 2026.

Cada estudiante maneja un hogar durante cuatro trimestres en su celular. La página hace los cálculos y registra cada envío en una hoja de Google Sheets. El profesor proyecta la vista de resumen.

## 1. Hoja nueva y script

La sesión 6 usa una hoja propia. No toque la hoja de las sesiones 4 y 5.

1. Cree en su cuenta una hoja de Google Sheets. Nombre sugerido: "Desarrollo Rural 5001462. Sesión 6".
2. En la hoja, abra Extensiones y luego Apps Script.
3. Borre el contenido y pegue el archivo `apps-script/Codigo.gs`.
4. Guarde.
5. Abra Implementar y escoja Nueva implementación.
6. Tipo: Aplicación web. Ejecutar como: yo. Quién tiene acceso: cualquier usuario.
7. Autorice los permisos.
8. Copie la URL que termina en `/exec`.
9. Péguela en `sesion-06/config.js`, en lugar de `PEGAR_AQUI_LA_URL_DEL_APPS_SCRIPT`.
10. Haga commit y push.

La pestaña "registros" se crea sola con el primer envío. Tiene una fila por envío.

La URL del script puede ir en el repositorio. La dirección y el identificador de la hoja no. La hoja tiene nombres de estudiantes.

Sin URL, la página funciona igual. Guarda las respuestas en el celular y muestra "El registro en línea no está configurado".

## 2. Versión nueva del script sin cambiar la URL

Si algún día cambia `Codigo.gs`:

1. Pegue el código nuevo en el editor de Apps Script y guarde.
2. Abra Implementar y escoja Administrar implementaciones.
3. Toque el lápiz de la implementación activa.
4. En Versión, escoja Nueva versión.
5. Toque Implementar.

La URL sigue igual. No hay que cambiar `config.js`.

## 3. Direcciones públicas

- Estudiantes: https://lataborda.github.io/panel-desarrollo-rural/sesion-06/
- Vista del profesor: https://lataborda.github.io/panel-desarrollo-rural/sesion-06/resumen.html

## 4. Prueba completa antes de clase

1. Abra la página de los estudiantes en el celular.
2. Escriba el nombre "PRUEBA Profesor" y escoja el hogar 1.
3. Juegue los cuatro trimestres. En el trimestre 2, tome el proyecto.
4. Envíe el resumen, las preguntas del proyecto y el cierre.
5. Arriba a la derecha debe decir "Registrado".
6. Abra la vista del profesor. Revise las cinco pestañas.
7. Toque "Empezar de nuevo" al final de la página. Juegue el hogar 6 hasta el trimestre 2.

Con la estrategia de referencia y el proyecto, el hogar 1 termina el año con 6.972.000 pesos. El hogar 6 sin proyecto termina con −7.440.000.

## 5. Borrar las filas de prueba

1. Abra la hoja y la pestaña "registros".
2. Seleccione la columna `estudiante` y abra Datos, Crear un filtro.
3. Filtre por "PRUEBA Profesor".
4. Seleccione las filas que quedan, clic derecho, Eliminar filas seleccionadas.
5. Quite el filtro.

La vista del profesor muestra por defecto solo las filas de hoy. Una prueba hecha otro día no aparece en clase, aunque quede en la hoja.

"Empezar de nuevo" borra lo guardado en el celular. No borra nada de la hoja.

## 6. Si falla la conexión en clase

La página de los estudiantes sigue funcionando sin internet. Guarda los envíos en el celular y los manda cuando vuelve la conexión. Mientras tanto dice "Pendiente de envío".

Si la vista del profesor no carga, proyecte la página de referencia, `sesion-06-simulacion-referencia.html`, en la carpeta "Material Clase 6". Siga la versión en el tablero de la guía del profesor.

## Datos de la hoja

Columnas, en orden:

`fecha_servidor, hora_cliente, clave, curso, sesion, actividad, id_estudiante, estudiante, hogar, seccion, trimestre, cacao, huerta, jornal, oficio, proyecto, contratadas, libres, migra, cosecha, ingresos, gastos, saldo, decision, pregunta, texto`

| Sección | Qué llena |
| --- | --- |
| inicio | estudiante y hogar |
| trimestre | trimestre, fichas, cosecha, ingresos, gastos, saldo y la frase del reparto en texto. migra es el trimestre en que se fue el hijo del hogar 2. En el trimestre 2, decision vale toma, no_toma o sin_tierra, y una segunda fila con pregunta proyecto_razon lleva la razón |
| resumen | ingresos es el ingreso total, cosecha el ingreso de la finca, saldo el saldo final, libres las fichas libres del año. decision vale cubre o no_cubre |
| proyecto | una fila por pregunta, de p1 a p6. En p2, decision vale libre o jornal |
| cierre | una fila por pregunta, de c1 a c3 |

Las cifras están en pesos de 2023.

## Pruebas en el computador

Para comprobar los cálculos, abra una terminal en la carpeta `sesion-06` y escriba `node pruebas/pruebas.mjs`.

Para probar la página sin tocar la hoja, use el servidor local. Simula el Apps Script y guarda las filas en memoria.

1. Abra una terminal en la carpeta del repositorio.
2. Escriba `node sesion-06/pruebas/servidor-local.mjs`.
3. Abra http://localhost:8767/sesion-06/ y http://localhost:8767/sesion-06/resumen.html.

Opciones: `--sin-registro` prueba la página sin registro en línea. `--red` abre la página también desde el celular, en la misma red Wi-Fi.
