// Funciones puras de cálculo del taller de la sesión 6.
// La lógica es la de la función calcular de sesion-06-simulacion-referencia.html, en pesos.
// Todas calculan sin redondear. Solo las funciones de formato redondean.
import { VALORES, MIGRACION, MRA } from './datos.js';

export const ACTIVIDADES = ['cacao', 'huerta', 'jornal', 'oficio', 'proyecto', 'contratadas'];

export function repartoVacio() {
  return { cacao: 0, huerta: 0, jornal: 0, oficio: 0, proyecto: 0, contratadas: 0 };
}

function completo(reparto) {
  return { ...repartoVacio(), ...(reparto || {}) };
}

// El hogar 2 marcó la migración en el trimestre t o antes. migra es el trimestre en que se fue, o 0.
export function migrado(migra, t) {
  return migra > 0 && migra <= t;
}

export function personasDel(h, t, migra = 0) {
  return h.personas - (migrado(migra, t) ? MIGRACION.personas : 0);
}

export function fichasDel(h, t, migra = 0) {
  return h.fichas - (migrado(migra, t) ? MIGRACION.fichas : 0);
}

export function fichasPropias(reparto) {
  const d = completo(reparto);
  return d.cacao + d.huerta + d.jornal + d.oficio + d.proyecto - d.contratadas;
}

// Fichas que pide el proyecto en el trimestre t, si el hogar lo tomó.
export function fichasProyecto(t, toma, V = VALORES) {
  return toma ? (V.fichasProyecto[t] || 0) : 0;
}

// Máximo de cada control en el trimestre t.
export function maximos(h, t, reparto, toma = false, V = VALORES) {
  const d = completo(reparto);
  return {
    cacao: h.ha > 0 ? h.ha : (h.joven > 0 ? 1 : 0),
    huerta: h.huerta ? 1 : 0,
    jornal: h.jornal[t - 1],
    oficio: h.oficio,
    proyecto: fichasProyecto(t, toma, V),
    contratadas: d.cacao + d.proyecto
  };
}

// Deja el reparto dentro de los máximos. El proyecto queda fijo en lo que pide.
export function ajustarReparto(h, t, reparto, toma = false, V = VALORES) {
  const d = completo(reparto);
  d.proyecto = fichasProyecto(t, toma, V);
  const max = maximos(h, t, d, toma, V);
  for (const a of ['cacao', 'huerta', 'jornal', 'oficio']) d[a] = Math.max(0, Math.min(d[a], max[a]));
  d.contratadas = Math.max(0, Math.min(d.contratadas, d.cacao + d.proyecto));
  return d;
}

// Hogar 2. Si al irse el hijo las fichas propias pasan de las fichas del hogar, quita fichas de jornal.
export function quitarJornalSiNoCabe(h, t, reparto, migra) {
  const d = completo(reparto);
  const exceso = fichasPropias(d) - fichasDel(h, t, migra);
  if (exceso > 0) d.jornal = Math.max(0, d.jornal - exceso);
  return d;
}

// Cosecha de los trimestres 2 y 4. Una hectárea deja la cosecha completa si tuvo su ficha
// en el trimestre anterior y en este.
export function cosecha(h, t, repartoAnterior, reparto, V = VALORES) {
  if ((t !== 2 && t !== 4) || !(h.ha > 0)) return 0;
  const antes = completo(repartoAnterior);
  const ahora = completo(reparto);
  const completas = Math.min(Math.min(antes.cacao, h.ha), Math.min(ahora.cacao, h.ha));
  return completas * V.cosechaHectarea[t] + (h.ha - completas) * V.cosechaHectareaSinFicha[t];
}

// Calcula los cuatro trimestres y el resumen del año.
// repartos: lista de 4 repartos. migra: trimestre en que se fue el hijo del hogar 2, o 0.
export function calcular(h, repartos, migra = 0, V = VALORES) {
  let saldo = h.saldoInicial;
  const trimestres = [];
  for (let t = 1; t <= 4; t++) {
    const d = completo(repartos[t - 1]);
    const personas = personasDel(h, t, migra);
    const fichas = fichasDel(h, t, migra);
    const propias = fichasPropias(d);
    const libres = fichas - propias;
    const cosechaT = cosecha(h, t, t > 1 ? repartos[t - 2] : null, d, V);
    const jornalYOficio = d.jornal * V.pagoJornalPorFicha + d.oficio * h.pagoOficio;
    const remesa = h.remesa + (migra > 0 && migra < t ? V.remesaMigracion : 0);
    const subsidio = h.subsidio;
    const ingresos = cosechaT + jornalYOficio + remesa + subsidio;
    const conHuerta = d.huerta >= 1;
    const gastoHogar = personas * V.comidaPorPersonaTrimestre * (conHuerta ? 1 - V.ahorroHuerta : 1)
      + personas * V.otrosGastosPorPersonaTrimestre + h.arriendo;
    const evento = t === 1 ? h.escolares * V.gastoEscolarPorEstudiante : (t === 3 ? V.medicina : 0);
    const contratos = d.contratadas * V.costoContratoPorFicha;
    const insumos = h.joven > 0 ? V.insumosCacaoJoven : 0;
    const gastos = gastoHogar + evento + contratos + insumos;
    const saldoInicial = saldo;
    saldo = saldo + ingresos - gastos;
    trimestres.push({
      t, personas, fichas, propias, libres, cosecha: cosechaT, jornalYOficio, remesa, subsidio, ingresos,
      conHuerta, gastoHogar, evento, contratos, insumos, gastos, saldoInicial, saldo
    });
  }
  return { trimestres, ...resumenAnio(trimestres) };
}

export function resumenAnio(trimestres) {
  const ingresoFinca = trimestres.reduce((s, x) => s + x.cosecha, 0);
  const ingresoTotal = trimestres.reduce((s, x) => s + x.ingresos, 0);
  const parteFinca = ingresoTotal !== 0 ? ingresoFinca / ingresoTotal : 0;
  const parteFuera = ingresoTotal !== 0 ? 1 - parteFinca : 0;
  const libresAnio = trimestres.reduce((s, x) => s + Math.max(0, x.libres), 0);
  const saldoFinal = trimestres[trimestres.length - 1].saldo;
  return { ingresoFinca, ingresoTotal, parteFinca, parteFuera, libresAnio, saldoFinal, cubreLinea: saldoFinal >= 0 };
}

/* ---------- MRA ---------- */

// Tabla 1. Costo total y utilidad por hectárea.
export function tablaMRA(M = MRA) {
  return M.anios.map((a) => {
    const costoTotal = a.manoDeObra + a.insumos;
    return { ...a, costoTotal, utilidad: a.ventas - costoTotal };
  });
}

// Tabla 2. La hectárea en el hogar.
// abono: 0 en los años 1 y 2. queda si el trabajo es libre: 0 en el año 1, después ventas − insumos − abono.
// queda si el hogar deja de jornalear: lo anterior menos la mano de obra.
export function tablaHogar(M = MRA, V = VALORES) {
  return M.anios.map((a, i) => {
    const abono = i < 2 ? 0 : V.abonoAnual;
    const quedaLibre = i === 0 ? 0 : a.ventas - a.insumos - abono;
    return { ...a, abono, quedaLibre, quedaJornal: quedaLibre - a.manoDeObra };
  });
}

// Suma de la última columna en los años 1 a 6.
export function perdidaAnios1a6(filas = tablaHogar()) {
  return filas.slice(0, 6).reduce((s, f) => s + f.quedaJornal, 0);
}

/* ---------- Formato ---------- */

const formatoEntero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const formatoUnDecimal = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const MENOS = '−';

// Pesos completos con separador de miles de Colombia. Los negativos llevan signo menos.
export function formatoNumero(n) {
  const redondo = Math.round(n);
  if (redondo === 0) return '0';
  return (redondo < 0 ? MENOS : '') + formatoEntero.format(Math.abs(redondo));
}

export function formatoPesos(n) {
  return formatoNumero(n) + ' pesos';
}

// Recibe una fracción (0,37) y devuelve "37,0 %".
export function formatoPorcentaje(fraccion) {
  return formatoUnDecimal.format(fraccion * 100) + ' %';
}
