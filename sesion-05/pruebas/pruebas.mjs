// Pruebas de los cálculos del taller de la sesión 5.
// Uso, desde la carpeta sesion-05: node pruebas/pruebas.mjs
// Cada fila de la tabla de resultados esperados se comprueba con una tolerancia de 1 peso.
import assert from 'node:assert/strict';
import * as C from '../calculos.js';
import { VALORES as V } from '../datos.js';

const TOLERANCIA = 1;
const casos = [];

function caso(nombre, prueba) {
  casos.push({ nombre, prueba });
}

function cerca(real, esperado, que) {
  assert.ok(
    Math.abs(real - esperado) <= TOLERANCIA,
    `${que}: se obtuvo ${real} y se esperaba ${esperado}`
  );
}

// Porcentaje con una cifra decimal, como se muestra en pantalla.
function porcentaje(fraccion) {
  return Math.round(fraccion * 1000) / 10;
}

function pedido(opcion) {
  return C.resultadoPedido(C.pedidoGerente(opcion, V), V);
}

caso('Gerente, ronda 1, proveedor grande', () => {
  const r = pedido('grande');
  cerca(r.costoTotal, 1540000, 'Costo total');
  cerca(r.costoPorKilo, 2566.67, 'Costo por kilo');
  cerca(r.gananciaPorKilo, 933.33, 'Ganancia por kilo');
  assert.equal(r.cumpleMeta, true, 'Debe cumplir la meta');
});

caso('Gerente, ronda 1, seis fincas', () => {
  const r = pedido('fincas');
  cerca(r.costoTotal, 1940000, 'Costo total');
  cerca(r.costoPorKilo, 3233.33, 'Costo por kilo');
  cerca(r.gananciaPorKilo, 266.67, 'Ganancia por kilo');
  assert.equal(r.cumpleMeta, false, 'No debe cumplir la meta');
});

caso('Gerente, ronda 2, asociación', () => {
  const r = pedido('asociacion');
  cerca(r.costoTotal, 1500000, 'Costo total');
  cerca(r.costoPorKilo, 2500, 'Costo por kilo');
  cerca(r.gananciaPorKilo, 1000, 'Ganancia por kilo');
  assert.equal(r.cumpleMeta, true, 'Debe cumplir la meta');
});

caso('Gerente, ronda 2, grande después del evento', () => {
  const r = pedido('grandeEvento');
  cerca(r.costoTotal, 1450000, 'Costo total');
  cerca(r.costoPorKilo, 2416.67, 'Costo por kilo');
  cerca(r.gananciaPorKilo, 1083.33, 'Ganancia por kilo');
});

caso('Precio de la asociación para igualar al grande', () => {
  const precio = C.precioIgualarGrande(V);
  cerca(precio, 2316.67, 'Precio por kilo');
  cerca(C.pagoFamiliaAsociacion(precio, V), 1916.67, 'Lo que recibe la familia por kilo');
});

caso('Gerente, ronda 3, 180 kilos a la asociación', () => {
  const r = C.repartoContrato(180, V);
  assert.equal(porcentaje(r.participacion), 30.4, 'Participación');
  assert.equal(r.cumpleLey, true, 'Debe cumplir la ley');
  cerca(r.costoTotal, 1519000, 'Costo total');
  cerca(r.gananciaPorKilo, 968.33, 'Ganancia por kilo');
  assert.equal(r.cumpleMeta, true, 'Debe cumplir la meta');
});

caso('Gerente, ronda 3, 170 kilos a la asociación', () => {
  const r = C.repartoContrato(170, V);
  assert.equal(porcentaje(r.participacion), 28.8, 'Participación');
  assert.equal(r.cumpleLey, false, 'No debe cumplir la ley');
});

caso('Gerente, ronda 3, 177 kilos', () => {
  const r = C.repartoContrato(177, V);
  assert.equal(porcentaje(r.participacion), 29.9, 'Participación');
  assert.equal(r.cumpleLey, false, 'No debe cumplir la ley');
});

caso('Gerente, ronda 3, 178 kilos', () => {
  const r = C.repartoContrato(178, V);
  assert.equal(porcentaje(r.participacion), 30.1, 'Participación');
  assert.equal(r.cumpleLey, true, 'Debe cumplir la ley');
});

caso('Gerente, ronda 3, 600 kilos a la asociación', () => {
  const r = C.repartoContrato(600, V);
  assert.equal(porcentaje(r.participacion), 100, 'Participación');
  cerca(r.costoTotal, 1500000, 'Costo total');
  cerca(r.gananciaPorKilo, 1000, 'Ganancia por kilo');
});

caso('Gerente, ronda 3, 0 kilos a la asociación', () => {
  const r = C.repartoContrato(0, V);
  assert.equal(porcentaje(r.participacion), 0, 'Participación');
  assert.equal(r.cumpleLey, false, 'No debe cumplir la ley');
  cerca(r.gananciaPorKilo, 1083.33, 'Ganancia por kilo');
});

caso('Productor, ronda 1, intermediario', () => {
  cerca(C.ingresoIntermediario(V), 180000, 'Pesos por semana');
});

caso('Productor, ronda 1, costo adicional sin certificado', () => {
  cerca(C.costoAdicionalFinca(false, V), 1100, 'Sin certificado, por kilo');
  cerca(C.costoAdicionalFinca(true, V), 600, 'Con certificado, por kilo');
});

caso('Productor, ronda 2, asociación', () => {
  cerca(C.ingresoAsociacion(V.precioAsociacion, V), 200000, 'Pesos por semana');
});

caso('Productor, ronda 2, después del evento', () => {
  cerca(C.ingresoAsociacion(C.precioIgualarGrande(V), V), 191666.67, 'Pesos por semana');
});

caso('Productor, ronda 3', () => {
  cerca(C.ingresoProductorRonda3(V), 186000, 'Pesos por semana');
});

// Comprobaciones adicionales del formato y del ajuste del deslizador.
caso('Formato de Colombia para pesos y porcentajes', () => {
  assert.equal(C.formatoPesos(1540000), '1.540.000 pesos');
  assert.equal(C.formatoNumero(2566.67), '2.567');
  assert.equal(C.formatoPorcentaje(C.repartoContrato(180, V).participacion), '30,4 %');
  assert.equal(C.formatoPorcentaje(0), '0,0 %');
});

caso('Ajuste de los kilos a múltiplos de 10 entre 0 y 600', () => {
  assert.equal(C.ajustarKilos(178), 180);
  assert.equal(C.ajustarKilos(-20), 0);
  assert.equal(C.ajustarKilos(650), 600);
  assert.equal(C.ajustarKilos('abc'), 0);
});

let fallas = 0;
for (const { nombre, prueba } of casos) {
  try {
    prueba();
    console.log('✓ ' + nombre);
  } catch (error) {
    fallas += 1;
    console.log('✗ ' + nombre + '\n    ' + error.message);
  }
}
console.log(`\n${casos.length - fallas} de ${casos.length} pruebas correctas.`);
process.exitCode = fallas ? 1 : 0;
