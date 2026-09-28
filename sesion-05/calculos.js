// Funciones puras de cálculo del taller de la sesión 5.
// Todas calculan con todos los decimales. Solo las funciones de formato redondean.
import { VALORES } from './datos.js';

// Costo total de un pedido.
// proveedores: lista de { kilos, precio, atencion, revision }.
// Suma kilos × precio, la atención y la revisión de cada proveedor que entrega más de 0 kilos.
export function costoTotal(proveedores) {
  return proveedores.reduce((suma, p) => {
    if (!(p.kilos > 0)) return suma;
    return suma + p.kilos * p.precio + (p.atencion || 0) + (p.revision || 0);
  }, 0);
}

export function costoPorKilo(total, V = VALORES) {
  return total / V.pedidoSemanal;
}

export function gananciaPorKilo(costoKilo, V = VALORES) {
  return V.precioVentaSupermercado - costoKilo;
}

export function cumpleMeta(ganancia, V = VALORES) {
  return ganancia >= V.metaGananciaPorKilo;
}

// Parte del valor de la compra que va a la asociación. Es 0 si no hay compra.
export function participacionAsociacion(kilosAsociacion, precioAsociacion, kilosGrande, precioGrande) {
  const valorAsociacion = kilosAsociacion * precioAsociacion;
  const total = valorAsociacion + kilosGrande * precioGrande;
  return total > 0 ? valorAsociacion / total : 0;
}

export function cumpleLey(participacion, V = VALORES) {
  return participacion >= V.participacionMinimaLey;
}

// Precio con el que la asociación iguala el costo del grande después del evento.
export function precioIgualarGrande(V = VALORES) {
  const costoGrandeEvento = costoTotal([
    { kilos: V.pedidoSemanal, precio: V.precioGrandeEvento, atencion: V.atencionGrande }
  ]);
  return (costoGrandeEvento - V.atencionAsociacion) / V.pedidoSemanal;
}

// Lo que recibe la familia por kilo cuando vende por medio de la asociación.
export function pagoFamiliaAsociacion(precioAsociacion, V = VALORES) {
  return precioAsociacion - V.costoAsociacionPorKilo;
}

// Costo adicional por kilo de atender una finca individual de 100 kilos.
export function costoAdicionalFinca(tieneCertificado, V = VALORES) {
  const revision = tieneCertificado ? 0 : V.revisionSinCertificado;
  return (V.atencionFincaPequena + revision) / V.excedenteSemanalFinca;
}

// Ingreso semanal de la familia si vende todo al intermediario.
export function ingresoIntermediario(V = VALORES) {
  return V.excedenteSemanalFinca * V.precioIntermediario;
}

// Ingreso semanal de la familia si vende todo por medio de la asociación.
export function ingresoAsociacion(precioAsociacion, V = VALORES) {
  return V.excedenteSemanalFinca * pagoFamiliaAsociacion(precioAsociacion, V);
}

// Ronda 3 del productor: 30 kilos al contrato escolar por medio de la asociación y 70 al intermediario.
export function ingresoProductorRonda3(V = VALORES) {
  const kilosContrato = V.kilosAsociacionContratoProductor / V.numeroFincasPequenas;
  const kilosIntermediario = V.excedenteSemanalFinca - kilosContrato;
  return kilosContrato * pagoFamiliaAsociacion(V.precioAsociacion, V)
    + kilosIntermediario * V.precioIntermediario;
}

// Proveedores de cada opción del gerente.
// grande: ronda 1 y 2. fincas: ronda 1. asociacion: ronda 2 a 2.400.
// grandeEvento: grande a 2.350. asociacionIguala: asociación al precio que iguala al grande.
export function pedidoGerente(opcion, V = VALORES) {
  const pedido = V.pedidoSemanal;
  switch (opcion) {
    case 'grande':
      return [{ kilos: pedido, precio: V.precioGrande, atencion: V.atencionGrande }];
    case 'fincas':
      return Array.from({ length: V.numeroFincasPequenas }, (_, i) => ({
        kilos: pedido / V.numeroFincasPequenas,
        precio: V.precioFincaPequena,
        atencion: V.atencionFincaPequena,
        revision: i < V.fincasSinCertificado ? V.revisionSinCertificado : 0
      }));
    case 'asociacion':
      return [{ kilos: pedido, precio: V.precioAsociacion, atencion: V.atencionAsociacion }];
    case 'grandeEvento':
      return [{ kilos: pedido, precio: V.precioGrandeEvento, atencion: V.atencionGrande }];
    case 'asociacionIguala':
      return [{ kilos: pedido, precio: precioIgualarGrande(V), atencion: V.atencionAsociacion }];
    default:
      throw new Error('Opción desconocida: ' + opcion);
  }
}

export function resultadoPedido(proveedores, V = VALORES) {
  const total = costoTotal(proveedores);
  const porKilo = costoPorKilo(total, V);
  const ganancia = gananciaPorKilo(porKilo, V);
  return {
    costoTotal: total,
    costoPorKilo: porKilo,
    gananciaPorKilo: ganancia,
    cumpleMeta: cumpleMeta(ganancia, V)
  };
}

// Ronda 3 del gerente: reparto del pedido entre la asociación (2.400) y el grande (2.350).
export function repartoContrato(kilosAsociacion, V = VALORES) {
  const kilosGrande = V.pedidoSemanal - kilosAsociacion;
  const proveedores = [
    { kilos: kilosAsociacion, precio: V.precioAsociacion, atencion: V.atencionAsociacion },
    { kilos: kilosGrande, precio: V.precioGrandeEvento, atencion: V.atencionGrande }
  ];
  const participacion = participacionAsociacion(
    kilosAsociacion, V.precioAsociacion, kilosGrande, V.precioGrandeEvento
  );
  return {
    kilosAsociacion,
    kilosGrande,
    participacion,
    cumpleLey: cumpleLey(participacion, V),
    ...resultadoPedido(proveedores, V)
  };
}

// Ajusta los kilos del reparto a un múltiplo de 10 entre 0 y 600.
export function ajustarKilos(valor, V = VALORES) {
  const n = Number(valor);
  if (!Number.isFinite(n)) return 0;
  const redondo = Math.round(n / 10) * 10;
  return Math.min(V.pedidoSemanal, Math.max(0, redondo));
}

// Formato con separador de miles de Colombia.
const formatoEntero = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });
const formatoUnDecimal = new Intl.NumberFormat('es-CO', { minimumFractionDigits: 1, maximumFractionDigits: 1 });

export function formatoNumero(n) {
  return formatoEntero.format(n);
}

export function formatoPesos(n) {
  return formatoEntero.format(n) + ' pesos';
}

// Recibe una fracción (0,304) y devuelve "30,4 %".
export function formatoPorcentaje(fraccion) {
  return formatoUnDecimal.format(fraccion * 100) + ' %';
}
