// Datos del taller de la sesión 6. Medios de vida rurales.
// Las cifras están en pesos de 2023.

/* ---------- Valores de la simulación ---------- */

export const VALORES = {
  comidaPorPersonaTrimestre: 500000,   // DANE, línea de pobreza extrema rural 2023, $166.677 al mes
  otrosGastosPorPersonaTrimestre: 322000, // DANE, línea de pobreza rural 2023, $274.160 al mes, menos la comida
  ahorroHuerta: 0.30,                  // Valor ilustrativo
  pagoJornalPorFicha: 1000000,         // 20 jornales a $50.000. FINAGRO, MRA cacao Piamonte, 2023
  costoContratoPorFicha: 1000000,      // Mismo valor del jornal
  cosechaHectarea: { 2: 2860000, 4: 1848000 },        // T2: 375 kg a $9.000 menos la mitad de los insumos anuales (FINAGRO, 2023). T4: 30 % menos por monilia, valor ilustrativo
  cosechaHectareaSinFicha: { 2: 1173000, 4: 667000 }, // Mitad de la producción. Valor ilustrativo
  gastoEscolarPorEstudiante: 200000,   // Trimestre 1. Valor ilustrativo
  medicina: 400000,                    // Trimestre 3. Valor ilustrativo
  remesaMigracion: 600000,             // Por trimestre. Valor ilustrativo
  insumosCacaoJoven: 116000,           // Por trimestre. Año 2 del MRA, 232.000 por hectárea al año (FINAGRO, 2023)
  fichasProyecto: { 2: 2, 3: 1, 4: 1 },
  creditoProyecto: 5175000,            // Insumos del año 1 del MRA (FINAGRO, 2023)
  abonoAnual: 398000                   // 5.175.000 en 13 cuotas, del año 3 al 15. Sin intereses
};

// Hogar 2: lo que cambia cuando el hijo se va a la ciudad.
export const MIGRACION = { personas: 1, fichas: 3 };

// Fuentes que se repiten.
export const FUENTES = {
  dane: 'DANE, pobreza monetaria, resultados 2023.',
  mra: 'FINAGRO (2023). Marco de Referencia Agroeconómico. Cacao tradicional, Piamonte, Cauca.',
  colombiaMayor: 'Portafolio, 25 de septiembre de 2024. Colombia Mayor, $80.000 al mes, valor general de 2024.'
};

/* ---------- Hogares ---------- */

// tarjeta: lista de { etiqueta, texto }. ilustrativo marca un valor ilustrativo. fuente da la fuente del dato.
export const HOGARES = [
  {
    id: 1, nombre: 'Hogar cacaotero', personas: 4, fichas: 6, ha: 3, joven: 0, escolares: 2, saldoInicial: 1000000,
    jornal: [1, 1, 1, 1], oficio: 0, pagoOficio: 0, huerta: true, remesa: 0, subsidio: 0, arriendo: 0, tierra: true, migra: false,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Padre de 46 años y madre de 43. Hija de 15 y hijo de 12, en el colegio.' },
      { etiqueta: 'Trabajan', texto: 'Padre y madre. 6 fichas por trimestre.' },
      { etiqueta: 'Tierra', texto: 'Propia. 3 hectáreas de cacao en producción. 1 hectárea de rastrojo. Huerta y gallinas.' },
      { etiqueta: 'Jornal', texto: 'Hasta 1 ficha por trimestre, en fincas vecinas.' },
      { etiqueta: 'Oficio', texto: 'No tiene.' },
      { etiqueta: 'Otros ingresos', texto: 'No tiene.' },
      { etiqueta: 'Saldo inicial', texto: '1.000.000 pesos. Lo que quedó de la cosecha de diciembre.', ilustrativo: true }
    ]
  },
  {
    id: 2, nombre: 'Hogar jornalero', personas: 4, fichas: 9, ha: 1, joven: 0, escolares: 1, saldoInicial: 0,
    jornal: [2, 2, 2, 2], oficio: 0, pagoOficio: 0, huerta: true, remesa: 0, subsidio: 0, arriendo: 0, tierra: true, migra: true,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Padre de 48 años y madre de 44. Hijo de 19, ya terminó el colegio. Hija de 9, en el colegio.' },
      { etiqueta: 'Trabajan', texto: 'Padre, madre e hijo. 9 fichas por trimestre.' },
      { etiqueta: 'Tierra', texto: 'Propia. 1 hectárea de cacao en producción. 1 hectárea de potrero. Huerta.' },
      { etiqueta: 'Jornal', texto: 'Hasta 2 fichas por trimestre, en la finca ganadera y en cosechas vecinas.' },
      { etiqueta: 'Oficio', texto: 'No tiene.' },
      { etiqueta: 'Otros ingresos', texto: 'No tiene.' },
      { etiqueta: 'Decisión propia', texto: 'El hijo puede irse a trabajar a la ciudad. El hogar pierde sus 3 fichas y deja de gastar en él. Desde el trimestre siguiente llega una remesa de 600.000 pesos.', ilustrativo: true }
    ]
  },
  {
    id: 3, nombre: 'Hogar de adultos mayores', personas: 3, fichas: 3, ha: 1, joven: 0, escolares: 1, saldoInicial: 500000,
    jornal: [0, 0, 0, 0], oficio: 0, pagoOficio: 0, huerta: true, remesa: 600000, subsidio: 240000, arriendo: 0, tierra: true, migra: false,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Abuelo de 68 años y abuela de 64. Nieto de 11, en el colegio. La hija vive en la ciudad.' },
      { etiqueta: 'Trabajan', texto: 'El abuelo tiene 2 fichas. La abuela tiene 1, porque cuida al nieto y la casa.' },
      { etiqueta: 'Tierra', texto: 'Propia. 1 hectárea de cacao en producción. 1 hectárea de rastrojo. Huerta.' },
      { etiqueta: 'Jornal', texto: 'No consigue.' },
      { etiqueta: 'Otros ingresos', texto: 'Remesa de la hija, 600.000 pesos por trimestre. Colombia Mayor del abuelo, 240.000 pesos por trimestre.', ilustrativo: true, notaIlustrativo: 'La remesa es un valor ilustrativo.', fuente: 'Portafolio, 25 de septiembre de 2024. Colombia Mayor, $80.000 al mes, valor general de 2024.' },
      { etiqueta: 'Saldo inicial', texto: '500.000 pesos.', ilustrativo: true }
    ]
  },
  {
    id: 4, nombre: 'Hogar con negocio en el pueblo', personas: 4, fichas: 6, ha: 1, joven: 0, escolares: 2, saldoInicial: 300000,
    jornal: [1, 1, 1, 1], oficio: 2, pagoOficio: 600000, huerta: true, remesa: 0, subsidio: 0, arriendo: 0, tierra: true, migra: false,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Madre de 40 años y padre de 42. Hijo de 17 e hija de 7, en el colegio.' },
      { etiqueta: 'Trabajan', texto: 'Madre y padre. 6 fichas por trimestre.' },
      { etiqueta: 'Tierra', texto: 'Propia. 1 hectárea de cacao en producción. 1 hectárea de rastrojo. Huerta.' },
      { etiqueta: 'Jornal', texto: 'Hasta 1 ficha por trimestre.' },
      { etiqueta: 'Oficio', texto: 'La madre vende comidas en el caserío los días de mercado. Hasta 2 fichas. Deja 600.000 pesos por ficha.', ilustrativo: true },
      { etiqueta: 'Saldo inicial', texto: '300.000 pesos.', ilustrativo: true }
    ]
  },
  {
    id: 5, nombre: 'Pareja joven', personas: 3, fichas: 6, ha: 0, joven: 2, escolares: 0, saldoInicial: 0,
    jornal: [1, 2, 1, 2], oficio: 1, pagoOficio: 800000, huerta: true, remesa: 0, subsidio: 0, arriendo: 0, tierra: true, migra: false,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Pareja de 27 y 24 años. Hijo de 2 años.' },
      { etiqueta: 'Trabajan', texto: 'Los dos. 6 fichas por trimestre.' },
      { etiqueta: 'Tierra', texto: 'Propia. 2 hectáreas de cacao sembradas hace un año. Todavía no producen. 1 hectárea de rastrojo. Huerta con plátano y yuca.' },
      { etiqueta: 'Cacao joven', texto: 'Pide 1 ficha por trimestre e insumos de 116.000 pesos.', fuente: 'FINAGRO (2023). MRA cacao tradicional, Piamonte, Cauca. Insumos del año 2, 232.000 pesos por hectárea al año.' },
      { etiqueta: 'Jornal', texto: 'Hasta 1 ficha en los trimestres 1 y 3. Hasta 2 en los trimestres 2 y 4.' },
      { etiqueta: 'Oficio', texto: 'Uno de los dos maneja mototaxi. 1 ficha por trimestre. Deja 800.000 pesos.', ilustrativo: true }
    ]
  },
  {
    id: 6, nombre: 'Hogar sin tierra', personas: 5, fichas: 6, ha: 0, joven: 0, escolares: 3, saldoInicial: 0,
    jornal: [2, 2, 2, 2], oficio: 1, pagoOficio: 800000, huerta: false, remesa: 0, subsidio: 0, arriendo: 300000, tierra: false, migra: false,
    tarjeta: [
      { etiqueta: 'Personas', texto: 'Padre de 39 años y madre de 35. Hijos de 14, 10 y 6, en el colegio.' },
      { etiqueta: 'Trabajan', texto: 'Padre y madre. 6 fichas por trimestre.' },
      { etiqueta: 'Tierra', texto: 'No tiene. Vive en arriendo en el caserío. No tiene huerta.' },
      { etiqueta: 'Jornal', texto: 'Hasta 2 fichas por trimestre, en cosechas y en la finca ganadera.' },
      { etiqueta: 'Oficio', texto: 'La madre hace aseo por días en casas del pueblo. 1 ficha. Deja 800.000 pesos.', ilustrativo: true },
      { etiqueta: 'Gastos', texto: 'Incluyen 300.000 pesos de arriendo por trimestre.', ilustrativo: true }
    ]
  }
];

/* ---------- Eventos ---------- */

// notas: lo que se muestra debajo del texto. tipo 'fuente' o 'ilustrativo'.
export const EVENTOS = [
  {
    t: 1, meses: 'Enero a marzo', titulo: 'Comienzo del año escolar',
    texto: 'Cada estudiante del hogar que va al colegio cuesta 200.000 pesos en útiles, uniforme y transporte. No hay cosecha.',
    notas: [{ tipo: 'ilustrativo', texto: 'El gasto escolar es un valor ilustrativo.' }]
  },
  {
    t: 2, meses: 'Abril a junio', titulo: 'Cosecha de mitad de año y visita del técnico',
    texto: 'Cada hectárea de cacao en producción deja 2.860.000 pesos. Si a una hectárea le faltó su ficha en el trimestre 1 o en este, deja 1.173.000 pesos.',
    notas: [
      { tipo: 'fuente', texto: 'FINAGRO (2023). MRA cacao tradicional, Piamonte, Cauca. 375 kilos por hectárea a 9.000 pesos, menos la mitad de los insumos del año.' },
      { tipo: 'ilustrativo', texto: 'El valor de la hectárea sin ficha, 1.173.000 pesos, es un valor ilustrativo.' }
    ],
    oferta: 'Le ofrezco sembrar una hectárea nueva de cacao. El crédito FINAGRO paga los insumos del primer año, 5.175.000 pesos. El plazo es de 15 años, con 3 de gracia. Usted pone el trabajo. Según el MRA, desde el año 7 la hectárea deja 1.931.000 pesos al año. El proyecto pide 2 fichas en este trimestre, 1 en el trimestre 3 y 1 en el trimestre 4.',
    fuenteOferta: 'FINAGRO (2023). MRA cacao tradicional, Piamonte, Cauca.'
  },
  {
    t: 3, meses: 'Julio a septiembre', titulo: 'Enfermedad en el hogar',
    texto: 'Una persona del hogar se enferma. Medicina y transporte: 400.000 pesos. No hay cosecha.',
    notas: [{ tipo: 'ilustrativo', texto: 'El gasto en medicina es un valor ilustrativo.' }]
  },
  {
    t: 4, meses: 'Octubre a diciembre', titulo: 'Lluvias y monilia',
    texto: 'La monilia ataca las mazorcas y la producción baja 30 %. Cada hectárea en producción deja 1.848.000 pesos. Si a una hectárea le faltó su ficha en el trimestre 3 o en este, deja 667.000 pesos.',
    notas: [{ tipo: 'ilustrativo', texto: 'La baja de 30 % y los valores de este trimestre son valores ilustrativos.' }]
  }
];

/* ---------- Reglas ---------- */

export const REGLAS = [
  { texto: 'Una ficha de trabajo es un mes de trabajo de una persona, unos 20 jornales.' },
  { texto: 'Cada trimestre, cada ficha va a una actividad. Cacao, huerta, jornal, oficio, proyecto o libre.' },
  { texto: 'Cada hectárea de cacao en producción pide 1 ficha por trimestre. Si le falta, en la próxima cosecha deja la mitad.' },
  { texto: 'La huerta pide 1 ficha y baja 30 % el gasto en comida.', ilustrativo: true },
  { texto: 'El jornal paga 1.000.000 pesos por ficha, hasta el máximo de la tarjeta.', fuente: 'FINAGRO (2023). MRA cacao tradicional, Piamonte, Cauca. Jornal de 50.000 pesos.' },
  { texto: 'Si faltan fichas para el cacao o el proyecto, el hogar contrata. Cada ficha contratada cuesta 1.000.000 pesos.' },
  { texto: 'La cosecha llega en los trimestres 2 y 4, ya descontados los insumos.' },
  { texto: 'Si el saldo queda negativo, el hogar queda debiendo en la tienda.' }
];

/* ---------- Glosario ---------- */

export const GLOSARIO = [
  { termino: 'Ficha de trabajo', definicion: 'Un mes de trabajo de una persona. Son unos 20 jornales.' },
  { termino: 'Jornal', definicion: 'Un día de trabajo pagado en una finca ajena.' },
  { termino: 'Oficio', definicion: 'Un trabajo fuera de la finca, en el pueblo o en el caserío.' },
  { termino: 'Remesa', definicion: 'Plata que manda un familiar que vive y trabaja en otro lugar.' },
  { termino: 'Colombia Mayor', definicion: 'Subsidio del Estado para personas mayores sin pensión.' },
  { termino: 'Saldo', definicion: 'Lo que le queda al hogar al final del trimestre. Si es negativo, el hogar queda debiendo.' },
  { termino: 'Línea de pobreza', definicion: 'El gasto mínimo por persona que usa el DANE para medir la pobreza.' },
  { termino: 'Monilia', definicion: 'Enfermedad del cacao. Pudre las mazorcas.' },
  { termino: 'FINAGRO', definicion: 'Fondo para el Financiamiento del Sector Agropecuario. Le presta a los bancos para que le presten al campo.' },
  { termino: 'MRA', definicion: 'Marco de Referencia Agroeconómico. Documento de FINAGRO con los costos y los ingresos de un cultivo por hectárea.' }
];

/* ---------- MRA de FINAGRO ---------- */

export const MRA = {
  titulo: 'Marco de Referencia Agroeconómico. Cacao tradicional en Piamonte, Cauca.',
  datos: 'FINAGRO. Documento del 20 de junio de 2023, versión 2. Sistema agroforestal con sombrío de abarco. 950 plantas por hectárea. Ciclo de 30 años. Producción desde el año 3. Jornal de $50.000. Precio en finca de $9.000 por kilo. La mano de obra es el 77 % del costo del ciclo.',
  citas: [
    '«Crédito a 15 años [...] período de gracia de tres años [...] un único desembolso en el año uno y los pagos de capital e intereses se realizan desde el año tres hasta el año 15.»',
    '«Este ejercicio no incluye los gastos administrativos y financieros, así como el costo de factores productivos como tierra y capital.»'
  ],
  enlace: 'https://finagro.com.co/sites/default/files/2024-06/220524-MRA-CacaoTradicional-Cauca-V2.pdf',
  fuente: 'FINAGRO (2023). Marco de Referencia Agroeconómico. Cacao tradicional, Piamonte, Cauca.',
  tabla1: 'Tabla 1. Costos e ingresos por hectárea según el MRA. En pesos.',
  tabla2: 'Tabla 2. La hectárea en el hogar. En pesos.',
  tabla2Antes: 'En el juego, el crédito paga los insumos del año 1, 5.175.000 pesos. Se abona en 13 cuotas de 398.000 pesos, del año 3 al año 15. La tabla no incluye intereses.',
  tabla2Despues: 'Entre el año 1 y el año 6, el hogar que deja de jornalear para trabajar la hectárea pierde {perdida} pesos. El hogar con tiempo libre recibe plata desde el año 3.',
  insumosCredito: 'Pagados con el crédito',
  // Por año del ciclo. kilos vacío si no hay producción.
  anios: [
    { anio: '1', anioHogar: '1', manoDeObra: 3670000, insumos: 5175000, kilos: null, ventas: 0, jornales: 73 },
    { anio: '2', anioHogar: '2', manoDeObra: 1970000, insumos: 232000, kilos: null, ventas: 0, jornales: 39 },
    { anio: '3', anioHogar: '3', manoDeObra: 2570000, insumos: 295000, kilos: 250, ventas: 2250000, jornales: 51 },
    { anio: '4', anioHogar: '4', manoDeObra: 3770000, insumos: 826000, kilos: 350, ventas: 3150000, jornales: 75 },
    { anio: '5', anioHogar: '5', manoDeObra: 3590000, insumos: 1099000, kilos: 450, ventas: 4050000, jornales: 72 },
    { anio: '6', anioHogar: '6', manoDeObra: 3590000, insumos: 1029000, kilos: 500, ventas: 4500000, jornales: 72 },
    { anio: '7 a 30', anioHogar: '7 en adelante', manoDeObra: 3790000, insumos: 1029000, kilos: 750, ventas: 6750000, jornales: 76 }
  ]
};

/* ---------- Textos de la interfaz ---------- */

// {n}, {nombre} y otras marcas entre llaves se reemplazan al mostrar.
export const TEXTOS = {
  secciones: ['Inicio', 'Hogar', 'Trimestre 1', 'Trimestre 2', 'Trimestre 3', 'Trimestre 4', 'Resumen del año', 'Proyecto', 'Cierre'],
  seccionesCortas: ['Inicio', 'Hogar', 'T1', 'T2', 'T3', 'T4', 'Año', 'Proyecto', 'Cierre'],
  seccionDe: 'Sección {n} de 9',
  marca: 'Desarrollo Rural · Sesión 6',
  valorIlustrativo: 'Valor ilustrativo',
  fuente: 'Fuente: {fuente}',
  pesos: '{valor} pesos',
  enPesos: 'En pesos.',
  si: 'Sí',
  no: 'No',
  errores: {
    opcion: 'Escoja una opción.',
    minimo: 'Escriba al menos 15 caracteres. Lleva {n}.',
    nombre: 'Escriba su nombre y su apellido.',
    hogar: 'Escoja el hogar que le asignó el profesor.',
    fichas: 'Faltan fichas. Quite una actividad o contrate antes de enviar.'
  },
  indicador: {
    registrado: 'Registrado',
    pendiente: 'Pendiente de envío',
    sinUrl: 'El registro en línea no está configurado'
  },
  reinicio: {
    boton: 'Empezar de nuevo',
    pregunta: '¿Borrar lo que está guardado en este celular? Las respuestas que ya llegaron a la hoja no se borran.',
    si: 'Sí, borrar',
    no: 'Cancelar'
  },
  inicio: {
    titulo: 'Taller de la sesión 6. Medios de vida rurales.',
    texto: 'En este taller usted maneja un hogar rural durante un año. Cada trimestre decide en qué trabaja cada persona del hogar. La página calcula lo que entra y lo que sale. Cada decisión queda registrada.',
    campoNombre: 'Nombre y apellido',
    campoHogar: 'Hogar que le asignó el profesor',
    boton: 'Empezar',
    seguir: 'Seguir donde iba',
    hogarElegido: 'Su hogar'
  },
  hogar: {
    titulo: 'Hogar {id}. {nombre}',
    resumen: '{personas} personas · {fichas} fichas por trimestre · {tierra}',
    tierraHa: '{ha} hectáreas de cacao',
    tierraUnaHa: '1 hectárea de cacao',
    tierraJoven: '{joven} hectáreas de cacao joven',
    sinTierra: 'Sin tierra',
    reglas: 'Reglas del juego',
    glosario: '¿Qué significa cada palabra?',
    boton: 'Ir al trimestre 1'
  },
  trimestre: {
    titulo: 'Trimestre {t}. {meses}',
    evento: 'Evento del trimestre',
    fichas: 'Fichas del hogar en este trimestre',
    fichasTexto: '{personas} personas. {fichas} fichas de trabajo.',
    copiado: 'El reparto empieza igual al del trimestre anterior. Cámbielo si quiere.',
    uso: 'Fichas propias usadas {usadas} de {total}. Libres {libres}.',
    libresAyuda: 'Las fichas libres son tiempo que nadie compró.',
    faltan: 'Faltan {n} fichas. Quite una actividad o contrate.',
    faltaUna: 'Falta 1 ficha. Quite una actividad o contrate.',
    sinFicha: '{n} hectáreas sin ficha. Esa hectárea deja la mitad en la próxima cosecha.',
    sinFichaUna: '1 hectárea sin ficha. Esa hectárea deja la mitad en la próxima cosecha.',
    cuentas: 'Cuentas del trimestre',
    filas: {
      saldoInicial: 'Saldo inicial',
      cosecha: 'Cosecha',
      jornalYOficio: 'Jornal y oficio',
      remesaYSubsidio: 'Remesa y subsidio',
      ingresos: 'Ingresos',
      gastoHogar: 'Gasto del hogar',
      gastoHogarHuerta: 'Gasto del hogar, con huerta',
      evento: 'Evento, contratos e insumos',
      gastos: 'Gastos',
      saldoFinal: 'Saldo final'
    },
    fuenteGasto: 'DANE, líneas de pobreza rural 2023. Por persona en el trimestre: 500.000 pesos de comida y 322.000 de otros gastos.',
    saldoFinal: 'Saldo final del trimestre',
    debe: 'El hogar queda debiendo en la tienda.',
    deuda: 'Deuda con el banco: 5.175.000 pesos. El crédito pagó los insumos del primer año. El primer abono es en el año 3.',
    saldos: 'Saldo de cada trimestre',
    sinEnviar: 'Sin enviar',
    frase: 'Explique su reparto en una frase',
    enviar: 'Enviar trimestre',
    registrado: 'Trimestre registrado. Espere al profesor antes de seguir.',
    siguiente: 'Siguiente trimestre',
    irResumen: 'Ir al resumen del año',
    fraseEnviada: 'Su frase'
  },
  actividades: {
    cacao: { nombre: 'Cacao', ayuda: '1 ficha por hectárea. Si una hectárea se queda sin ficha, en la próxima cosecha deja la mitad.' },
    cacaoJoven: { nombre: 'Cacao joven', ayuda: '1 ficha para las 2 hectáreas jóvenes. Todavía no producen.' },
    huerta: { nombre: 'Huerta y animales', ayuda: 'La comida que compra el hogar baja 30 %.' },
    jornal: { nombre: 'Jornal', ayuda: '1 ficha paga 1.000.000 pesos. Máximo {max}.' },
    oficio: { nombre: 'Oficio en el pueblo', ayuda: '1 ficha paga {pago} pesos. Máximo {max}.' },
    proyecto: { nombre: 'Proyecto', ayuda: 'Fichas obligatorias. No se pueden bajar.' },
    contratadas: { nombre: 'Contratadas', ayuda: 'Para el cacao o el proyecto. Cada ficha contratada cuesta 1.000.000 pesos.' },
    quitar: 'Quitar una ficha de {nombre}',
    poner: 'Poner una ficha en {nombre}',
    letra: { cacao: 'C', huerta: 'H', jornal: 'J', oficio: 'O', proyecto: 'P', libre: '' },
    leyenda: 'C cacao · H huerta · J jornal · O oficio · P proyecto · vacía libre'
  },
  tecnico: {
    titulo: 'Visita del técnico',
    pregunta: '¿Toma el proyecto?',
    toma: 'Lo tomo',
    noToma: 'No lo toma',
    noTomo: 'No lo tomo',
    porque: '¿Por qué? Una frase.',
    sinTierra: 'Su hogar no puede tomar el proyecto. No tiene tierra.',
    preguntaSinTierra: '¿Qué dice esto del crédito agropecuario?',
    pista: 'En el trimestre 1 su hogar tuvo {n} fichas libres. El proyecto pide 2 en este trimestre.',
    pistaUna: 'En el trimestre 1 su hogar tuvo 1 ficha libre. El proyecto pide 2 en este trimestre.',
    decision: 'Su decisión',
    razon: 'Su razón',
    respuesta: 'Su respuesta'
  },
  migracion: {
    casilla: 'El hijo se va a trabajar a la ciudad en este trimestre',
    ayuda: 'Desde este trimestre el hogar tiene 6 fichas y 3 personas. Desde el trimestre siguiente llega una remesa de 600.000 pesos.',
    seFue: 'El hijo se fue a la ciudad en el trimestre {t}.',
    remesa: 'Desde el trimestre {t} llega una remesa de 600.000 pesos.',
    quitoJornal: 'Se quitaron fichas de jornal para que el reparto quepa en 6 fichas.'
  },
  anio: {
    titulo: 'Resumen del año',
    intro: 'Así le fue a su hogar en el año.',
    saldos: 'Saldo de cada trimestre',
    ingresoFinca: 'Ingreso de la finca en el año',
    ingresoFincaAyuda: 'Suma de las cosechas.',
    ingresoTotal: 'Ingreso total del año',
    ingresoTotalAyuda: 'Suma de los ingresos de los cuatro trimestres.',
    parteFinca: 'Parte del ingreso que viene de la finca',
    parteFuera: 'Parte que viene de fuera de la finca',
    libres: 'Fichas libres en el año',
    cubre: '¿Cubrió la línea de pobreza?',
    saldoFinal: 'Saldo final del año',
    composicion: 'De dónde vino el ingreso',
    finca: 'Finca',
    fuera: 'Fuera de la finca',
    nota1: 'El ingreso total no incluye el ahorro de la huerta ni el crédito.',
    nota2: 'Un saldo final de 0 o más indica que el hogar cubrió la línea de pobreza rural de 2023. En 2023, el 44,0 % de las personas de centros poblados y rural disperso estaba en pobreza monetaria.',
    enviar: 'Enviar resumen',
    registrado: 'Resumen registrado.',
    siguiente: 'Ir al proyecto'
  },
  proyecto: {
    abrir: 'Abrir el documento original de FINAGRO',
    desliza: 'Deslice la tabla hacia los lados para ver todas las columnas.',
    citas: 'Lo que dice el MRA',
    grafico: 'Lo que queda cada año en las dos columnas',
    graficoAyuda: 'Barra a la derecha: queda plata. Barra a la izquierda: el hogar pierde.',
    libre: 'Queda si el trabajo es libre',
    jornal: 'Queda si el hogar deja de jornalear',
    anio: 'Año',
    suHogar: 'En el juego, su hogar tuvo {n} fichas libres en el año.',
    suHogarUna: 'En el juego, su hogar tuvo 1 ficha libre en el año.',
    tomo: 'Su hogar tomó el proyecto en el trimestre 2.',
    noTomo: 'Su hogar no tomó el proyecto en el trimestre 2.',
    noPudo: 'Su hogar no podía tomar el proyecto. No tiene tierra.',
    preguntas: 'Preguntas sobre el proyecto',
    p1: '¿Quién haría los 73 jornales del año 1? ¿Qué deja de hacer esa persona?',
    p2: '¿Qué columna se parece a su hogar?',
    p2Opciones: [
      { valor: 'libre', texto: 'Queda si el trabajo es libre' },
      { valor: 'jornal', texto: 'Queda si el hogar deja de jornalear' }
    ],
    p2Porque: '¿Por qué?',
    p3: '¿De qué vive el hogar entre el año 1 y el año 6, mientras la hectárea no deja plata?',
    p4: '¿Qué dice el MRA sobre la familia? Cuántas personas son, de qué más vive, cuánto gasta en comida.',
    p5: '¿Qué supone el MRA que no se cumple en su hogar?',
    p6: '¿Tomaría el proyecto ahora? ¿Qué le pediría cambiar al técnico?',
    enviar: 'Enviar respuestas del proyecto',
    registrado: 'Respuestas del proyecto registradas.',
    siguiente: 'Ir al cierre',
    columnas: ['Año', 'Mano de obra', 'Insumos', 'Costo total', 'Producción, kg', 'Ventas', 'Utilidad'],
    columnas2: ['Año', 'Jornales que pide', 'Ventas', 'Insumos', 'Abono', 'Queda si el trabajo es libre', 'Valor del trabajo en el MRA', 'Queda si el hogar deja de jornalear']
  },
  cierre: {
    titulo: 'Cierre',
    intro: 'Responda con lo que vio en el juego y en el MRA.',
    c1: '¿De qué vive hoy una familia rural? Responda con datos de su hogar.',
    c2: '¿Por qué los hogares rurales dejaron de vivir solo de la finca?',
    c3: '¿Qué problema tiene un proyecto agropecuario que supone que la familia vive solo de la finca?',
    enviar: 'Enviar cierre',
    final: 'Terminó el taller. Gracias.'
  },
  resumenVista: {
    cargando: 'Cargando respuestas.',
    actualizado: 'Actualizado a las {hora}. Se actualiza cada 20 segundos.',
    error: 'No se pudieron leer las respuestas. Abra la hoja de Google Sheets.',
    sinRespuestas: 'Todavía no hay respuestas para esta fecha.',
    sinDato: '—',
    pestanas: ['Trimestres', 'Proyecto', 'Año', 'MRA', 'Cierre'],
    estudiante: 'Estudiante',
    hogar: 'Hogar',
    reparto: 'Reparto del último trimestre enviado',
    repartoEn: 'T{t}: {reparto}',
    verFrases: 'Ver frases',
    ocultarFrases: 'Ocultar frases',
    frases: 'Frases de reparto',
    decision: 'Decisión',
    razon: 'Razón',
    toma: 'Lo toma',
    noToma: 'No lo toma',
    sinTierra: 'Sin tierra',
    conteo: 'Conteo',
    ingresoFinca: 'Ingreso de la finca',
    ingresoTotal: 'Ingreso total',
    parteFinca: 'Parte de la finca',
    libres: 'Fichas libres',
    cubre: '¿Cubrió la línea?',
    cubrieron: '{n} de {total} hogares cubrieron la línea de pobreza.',
    dane: 'En 2023, el 44,0 % de las personas de centros poblados y rural disperso estaba en pobreza monetaria.',
    respondieron: '{n} estudiantes respondieron.',
    respondioUno: '1 estudiante respondió.',
    migra: 'El hijo se fue en T{t}'
  }
};
