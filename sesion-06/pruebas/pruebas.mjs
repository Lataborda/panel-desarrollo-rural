// Pruebas de los cálculos del taller de la sesión 6.
// Uso, desde la carpeta sesion-06: node pruebas/pruebas.mjs
// Cada caso de la tabla de resultados esperados se comprueba con una tolerancia de 1 peso.
import assert from 'node:assert/strict';
import * as C from '../calculos.js';
import { HOGARES, VALORES as V } from '../datos.js';

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

const hogar = (id) => HOGARES.find((h) => h.id === id);

// Estrategia de referencia, sin proyecto y sin migración.
function referencia(id) {
  const base = {
    1: { cacao: 3, huerta: 1, jornal: 1 },
    2: { cacao: 1, huerta: 1, jornal: 2 },
    3: { cacao: 1, huerta: 1 },
    4: { cacao: 1, huerta: 1, oficio: 2, jornal: 1 },
    5: { cacao: 1, huerta: 1, oficio: 1 },
    6: { oficio: 1, jornal: 2 }
  }[id];
  return [1, 2, 3, 4].map((t) => ({
    ...C.repartoVacio(),
    ...base,
    ...(id === 5 ? { jornal: t % 2 === 1 ? 1 : 2 } : {})
  }));
}

// Con proyecto: T2 proyecto 2 (y huerta 0 si se indica), T3 y T4 proyecto 1.
function conProyecto(id, sinHuertaEnT2) {
  const r = referencia(id);
  r[1] = { ...r[1], proyecto: 2, ...(sinHuertaEnT2 ? { huerta: 0 } : {}) };
  r[2] = { ...r[2], proyecto: 1 };
  r[3] = { ...r[3], proyecto: 1 };
  return r;
}

const ESPERADOS = [
  { id: 1, saldos: [-1088000, 5804000, 3716000, 7572000], finca: 14124000, total: 18124000, parte: '77,9 %', libres: 4 },
  { id: 2, saldos: [-888000, 1284000, 196000, 1356000], finca: 4708000, total: 12708000, parte: '37,0 %', libres: 20 },
  { id: 3, saldos: [-876000, 808000, -768000, -96000], finca: 4708000, total: 8068000, parte: '58,4 %', libres: 4 },
  { id: 4, saldos: [-588000, 1784000, 896000, 2256000], finca: 4708000, total: 13508000, parte: '34,9 %', libres: 4 },
  { id: 5, saldos: [-332000, 336000, -396000, 272000], finca: 0, total: 9200000, parte: '0,0 %', libres: 6 },
  { id: 6, saldos: [-2210000, -3820000, -5830000, -7440000], finca: 0, total: 11200000, parte: '0,0 %', libres: 12 }
];

for (const e of ESPERADOS) {
  caso(`Estrategia de referencia, hogar ${e.id}`, () => {
    const r = C.calcular(hogar(e.id), referencia(e.id));
    e.saldos.forEach((s, i) => cerca(r.trimestres[i].saldo, s, `Saldo T${i + 1}`));
    cerca(r.ingresoFinca, e.finca, 'Ingreso de la finca');
    cerca(r.ingresoTotal, e.total, 'Ingreso total');
    assert.equal(C.formatoPorcentaje(r.parteFinca), e.parte, 'Parte de la finca');
    assert.equal(r.libresAnio, e.libres, 'Fichas libres');
    assert.equal(r.cubreLinea, e.saldos[3] >= 0, 'Cubre la línea');
  });
}

const CON_PROYECTO = [
  { id: 1, sinHuerta: true, saldo: 6972000 },
  { id: 2, sinHuerta: false, saldo: 1356000 },
  { id: 3, sinHuerta: true, saldo: -546000 },
  { id: 4, sinHuerta: true, saldo: 1656000 },
  { id: 5, sinHuerta: true, saldo: -178000 }
];

for (const e of CON_PROYECTO) {
  caso(`Con proyecto, hogar ${e.id}`, () => {
    const repartos = conProyecto(e.id, e.sinHuerta);
    const r = C.calcular(hogar(e.id), repartos);
    cerca(r.saldoFinal, e.saldo, 'Saldo T4');
    r.trimestres.forEach((x) => assert.ok(x.libres >= 0, `T${x.t}: faltan fichas`));
  });
}

caso('Hogar 2, el hijo se va en T2, estrategia de referencia', () => {
  const r = C.calcular(hogar(2), referencia(2), 2);
  cerca(r.saldoFinal, 4572000, 'Saldo T4');
  assert.equal(r.trimestres[0].fichas, 9, 'Fichas T1');
  assert.equal(r.trimestres[1].fichas, 6, 'Fichas T2');
  assert.equal(r.trimestres[1].remesa, 0, 'Remesa T2');
  assert.equal(r.trimestres[2].remesa, 600000, 'Remesa T3');
});

caso('Hogar 1, cacao 2 en T1 y cacao 3 en T2', () => {
  const repartos = referencia(1);
  repartos[0] = { ...repartos[0], cacao: 2 };
  const r = C.calcular(hogar(1), repartos);
  cerca(r.trimestres[1].cosecha, 6893000, 'Cosecha de T2');
});

caso('Tabla 2 del MRA, año 3', () => {
  const f = C.tablaHogar()[2];
  cerca(f.quedaLibre, 1557000, 'Queda si el trabajo es libre');
  cerca(f.quedaJornal, -1013000, 'Queda si el hogar deja de jornalear');
});

caso('Tabla 2 del MRA, año 7 en adelante', () => {
  const f = C.tablaHogar()[6];
  cerca(f.quedaLibre, 5323000, 'Queda si el trabajo es libre');
  cerca(f.quedaJornal, 1533000, 'Queda si el hogar deja de jornalear');
});

caso('Tabla 2 del MRA, pérdida de los años 1 a 6', () => {
  cerca(C.perdidaAnios1a6(), -10283000, 'Pérdida');
});

// Comprobaciones adicionales.
caso('Tabla 1 del MRA, costo total y utilidad', () => {
  const t = C.tablaMRA();
  cerca(t[0].costoTotal, 8845000, 'Costo total año 1');
  cerca(t[0].utilidad, -8845000, 'Utilidad año 1');
  cerca(t[2].utilidad, -615000, 'Utilidad año 3');
  cerca(t[6].utilidad, 1931000, 'Utilidad año 7 a 30');
});

caso('Tabla 2 del MRA, todas las filas', () => {
  const libre = [0, -232000, 1557000, 1926000, 2553000, 3073000, 5323000];
  const jornal = [-3670000, -2202000, -1013000, -1844000, -1037000, -517000, 1533000];
  C.tablaHogar().forEach((f, i) => {
    cerca(f.quedaLibre, libre[i], `Queda si el trabajo es libre, fila ${i + 1}`);
    cerca(f.quedaJornal, jornal[i], `Queda si el hogar deja de jornalear, fila ${i + 1}`);
  });
});

caso('Hogar 2, al irse el hijo se quitan fichas de jornal hasta que quepan', () => {
  const d = C.quitarJornalSiNoCabe(hogar(2), 2, { cacao: 1, huerta: 1, jornal: 2, proyecto: 2 }, 2);
  assert.equal(d.jornal, 2, 'Con 6 fichas propias cabe');
  const d2 = C.quitarJornalSiNoCabe(hogar(2), 2, { cacao: 1, huerta: 1, jornal: 2, proyecto: 2, oficio: 1 }, 2);
  assert.equal(d2.jornal, 1, 'Con 7 fichas propias se quita 1 de jornal');
});

caso('Ajuste del reparto a los máximos del trimestre', () => {
  const d = C.ajustarReparto(hogar(5), 3, { cacao: 1, huerta: 1, jornal: 2, oficio: 1, contratadas: 3 }, true);
  assert.equal(d.jornal, 1, 'Jornal máximo 1 en T3 para el hogar 5');
  assert.equal(d.proyecto, 1, 'Proyecto fijo en 1 en T3');
  assert.equal(d.contratadas, 2, 'Contratadas hasta cacao más proyecto');
});

caso('Formato de Colombia para pesos y porcentajes', () => {
  assert.equal(C.formatoPesos(2860000), '2.860.000 pesos');
  assert.equal(C.formatoNumero(-1088000), '−1.088.000');
  assert.equal(C.formatoNumero(-0.4), '0');
  assert.equal(C.formatoPorcentaje(0.37), '37,0 %');
});

caso('Gasto del hogar con huerta y sin huerta', () => {
  const r = C.calcular(hogar(1), referencia(1));
  cerca(r.trimestres[0].gastoHogar, 2688000, 'Con huerta');
  const sinHuerta = C.calcular(hogar(6), referencia(6));
  cerca(sinHuerta.trimestres[0].gastoHogar, 4410000, 'Sin huerta, con arriendo');
  cerca(V.comidaPorPersonaTrimestre * 4 * V.ahorroHuerta, 600000, 'Ahorro de la huerta, 4 personas');
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
