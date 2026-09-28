// Datos del taller de la sesión 5: fichas, glosario, referencias, valores de la simulación y textos.
// Los textos de las fichas vienen del prompt de construcción.
// Las fichas 2, 3 y 5 tienen los cambios aprobados por el profesor el 27 de septiembre de 2026,
// después de revisar las lecturas (Acevedo y Martínez, 2016, pp. 89, 147, 157-160).

export const FICHAS = [
  {
    id: 'capilla',
    numero: 1,
    corto: 'La Capilla',
    nombre: 'Microfundista de La Capilla',
    lugar: 'La Capilla, Boyacá.',
    produce: 'Fríjol, frutas y hortalizas para el mercado de Bogotá.',
    tierra: 'Menos de un tercio de la UAF, que es de 8 hectáreas.',
    ingreso: 'Con lo que deja la finca, supera la línea de pobreza el 47,8 % de los hogares. Sin contar el autoconsumo, el 26,1 %.',
    fuenteDatos: 'Rodríguez y Forero (2021), tabla 8.',
    lecturas: 'Las fincas son muy pequeñas y usan muchos insumos químicos. Venden sobre todo en Bogotá y tienen buenas vías. La mayoría de quienes no superan la pobreza son microfundistas mayores de 60 años. Algunos están enfermos o tienen una discapacidad.',
    fuenteLecturas: 'Rodríguez y Forero (2021).'
  },
  {
    id: 'guaguarco',
    numero: 2,
    corto: 'Guaguarco',
    nombre: 'Guaguarco, resguardo indígena pijao',
    lugar: 'Coyaima, Tolima.',
    produce: 'Policultivo de plátano, maíz, yuca, fríjol y frutales, sobre todo para comer en casa.',
    tierra: '2,32 hectáreas en promedio. La UAF de la zona es de 34 a 44 hectáreas.',
    ingreso: 'El autoconsumo es el 65,7 % del ingreso agropecuario.',
    fuenteDatos: 'Acevedo y Martínez (2016), pp. 76-91.',
    lecturas: 'Las fincas tienen mucha menos tierra que la UAF. Producir su propia comida libera a las familias de comprarla, porque no tienen dinero suficiente para el mercado. En el 55,5 % de las fincas, lo que se gana no cubre el trabajo de la familia.',
    fuenteLecturas: 'Acevedo y Martínez (2016), pp. 76 y 86-91.'
  },
  {
    id: 'musa',
    numero: 3,
    corto: 'MUSA',
    nombre: 'Asociación de moreros MUSA',
    lugar: 'Santa Rosa de Cabal, Risaralda.',
    produce: 'Mora con buenas prácticas agrícolas. Vende a la agroindustria. Entre sus aliados comerciales hay un supermercado.',
    tierra: '6,0 hectáreas en promedio. Sin dato de UAF.',
    ingreso: 'El autoconsumo es el 34,5 % del ingreso agropecuario. Solo 1 de 11 fincas cubre el costo del trabajo de la familia.',
    fuenteDatos: 'Acevedo y Martínez (2016), pp. 147-160.',
    lecturas: 'El problema más frecuente es el precio de venta bajo, que muchas veces no cubre los costos. Las fincas dependen mucho de insumos comprados. Las empresas compradoras han devuelto toneladas de fruta por incumplir requisitos.',
    fuenteLecturas: 'Acevedo y Martínez (2016), pp. 148 y 155.'
  },
  {
    id: 'pasifueres',
    numero: 4,
    corto: 'Pasifueres',
    nombre: 'Microfundista de Pasifueres',
    lugar: 'San Benito Abad, Sucre.',
    produce: 'Arroz, pancoger, pesca y caza.',
    tierra: 'Menos de un tercio de la UAF, que es de 63 hectáreas.',
    ingreso: 'Con lo que deja la finca, supera la línea de pobreza el 10,5 % de los hogares. Sin contar el autoconsumo, el 5,3 %.',
    fuenteDatos: 'Rodríguez y Forero (2021), tabla 8.',
    lecturas: 'Es una zona de difícil acceso, con poca venta al mercado. Las parcelas son pequeñas y las inundaciones son frecuentes. Sacar la cosecha es difícil.',
    fuenteLecturas: 'Rodríguez y Forero (2021).'
  },
  {
    id: 'chocola',
    numero: 5,
    corto: 'La Chócola',
    nombre: 'Buenos Aires-La Chócola',
    lugar: 'Salamina, Caldas.',
    produce: 'Café con sombrío, sobre todo para vender.',
    tierra: '4,18 hectáreas en promedio. La UAF de la zona es de 12 a 25 hectáreas.',
    ingreso: 'Las ventas son el 71,5 % del ingreso agropecuario.',
    fuenteDatos: 'Acevedo y Martínez (2016), pp. 76-91.',
    lecturas: 'El ingreso depende del precio del café. Aun así, la comida que producen equivale a más del 25 % de su ingreso. Todas las fincas cubren el costo del trabajo de la familia.',
    fuenteLecturas: 'Acevedo y Martínez (2016), pp. 89-91.'
  },
  {
    id: 'sanmarcos',
    numero: 6,
    corto: 'San Marcos',
    nombre: 'Parcelero de San Marcos',
    lugar: 'San Marcos, Sucre.',
    produce: 'Arroz, ganado de doble propósito y pesca. Tierra entregada por el Incora entre 1989 y 2002.',
    tierra: 'Entre un tercio y dos tercios de la UAF, que es de 36 hectáreas.',
    ingreso: 'Con lo que deja la finca, supera la línea de pobreza el 69,0 % de los hogares. Sin contar el autoconsumo, el 23,8 %.',
    fuenteDatos: 'Rodríguez y Forero (2021), tabla 8.',
    lecturas: 'Quienes no superan la pobreza son sobre todo personas mayores con muchos familiares que dependen de la parcela. Algunas fincas sufrieron inundaciones graves.',
    fuenteLecturas: 'Rodríguez y Forero (2021).'
  }
];

export const GLOSARIO = [
  {
    termino: 'Salario mínimo mensual de 2014',
    definicion: '616.000 pesos.',
    fuente: 'Acevedo y Martínez (2016), tabla 4.6.'
  },
  {
    termino: 'Línea de pobreza',
    definicion: 'Ingreso mínimo que necesita un hogar para cubrir sus necesidades básicas.'
  },
  {
    termino: 'UAF',
    definicion: 'Extensión de tierra que, según el Estado, necesita una familia para vivir de su finca.'
  },
  {
    termino: 'Autoconsumo',
    definicion: 'La parte de la cosecha que la familia se come. Rodríguez y Forero la valoran a precio al consumidor.'
  }
];

export const REFERENCIAS = [
  'Acevedo Osorio, Á. y Martínez Collazos, J., comps. (2016). La agricultura familiar en Colombia. Estudios de caso desde la multifuncionalidad y su aporte a la paz.',
  'Hazell, P., Poulton, C., Wiggins, S. y Dorward, A. (2007). The Future of Small Farms for Poverty Reduction and Growth. IFPRI.',
  'Rodríguez Bernal, C. S. y Forero Álvarez, J. (2021). El impacto de los ingresos generados por la agricultura familiar en la superación de la pobreza de los campesinos colombianos. Papel Político, 26.',
  'Ley 2046 de 2020, sobre compra pública local de alimentos.'
];

// Valores de la simulación. Todos son ilustrativos.
export const VALORES = {
  excedenteSemanalFinca: 100,        // kilos
  precioIntermediario: 1800,         // pesos por kilo, de contado
  pedidoSemanal: 600,                // kilos
  precioVentaSupermercado: 3500,     // pesos por kilo
  metaGananciaPorKilo: 900,          // pesos por kilo
  plazoPagoSupermercadoDias: 45,
  precioGrande: 2500,
  atencionGrande: 40000,             // pesos por semana
  precioFincaPequena: 2300,
  atencionFincaPequena: 60000,       // pesos por semana, por finca
  revisionSinCertificado: 50000,     // pesos por semana, por finca sin certificado
  fincasSinCertificado: 4,
  numeroFincasPequenas: 6,
  precioAsociacion: 2400,
  atencionAsociacion: 60000,         // pesos por semana
  costoAsociacionPorKilo: 400,       // lo asumen las familias
  precioGrandeEvento: 2350,
  kilosAsociacionContratoProductor: 180,  // compra fija en la ronda 3 del productor
  participacionMinimaLey: 0.30
};

// Textos de la interfaz. {n}, {nombre} y otras marcas entre llaves se reemplazan al mostrar.
export const TEXTOS = {
  secciones: ['Inicio', 'Estudio de casos', 'Productor', 'Gerente de compras', 'Evaluación'],
  seccionDe: 'Sección {n} de 5',
  rondaDe: 'Ronda {n} de 3',
  valorIlustrativo: 'Valor ilustrativo',
  fuente: 'Fuente: {fuente}',
  enviar: 'Enviar respuesta',
  seguir: 'Seguir',
  errores: {
    opcion: 'Escoja una opción.',
    minimo: 'Escriba al menos 15 caracteres. Lleva {n}.',
    cual: 'Escriba cuál es la otra razón.',
    nombre: 'Escriba su nombre y su apellido.'
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
    titulo: 'Taller de la sesión 5. Fincas pequeñas y acceso al mercado.',
    texto: 'En este taller usted estudia seis fincas reales. Después decide como productor y como gerente de compras de un supermercado. Cada respuesta queda registrada.',
    campoNombre: 'Nombre y apellido',
    boton: 'Empezar'
  },
  casos: {
    titulo: 'Estudio de casos',
    fichaDe: 'Ficha {n} de 6',
    lugar: 'Lugar',
    produce: 'Qué produce',
    tierra: 'Tierra',
    ingreso: 'Dato de ingreso',
    recuadro: 'Lo que dicen las lecturas',
    queSignifica: '¿Qué significa?',
    p1: '¿Alcanza lo que deja la finca para que la familia viva?',
    p1Opciones: ['Sí', 'No', 'A unas familias sí y a otras no'],
    p1Explique: 'Explique por qué',
    p2: '¿Qué es lo que más limita a esta finca?',
    p2Opciones: ['Poca tierra', 'Precio de venta', 'Clima', 'Acceso al mercado', 'Edad o salud', 'Otra'],
    p2Cual: '¿Cuál?',
    p2Explique: 'Explique por qué escogió esa razón',
    boton: 'Enviar respuestas de esta ficha',
    enviado: 'Respuestas registradas. Espere la plenaria antes de seguir.',
    siguiente: 'Siguiente ficha',
    anterior: 'Ficha anterior',
    glosario: 'Glosario',
    referencias: 'Referencias',
    cierre: 'Terminó el estudio de casos. Siga cuando el profesor lo indique.',
    irProductor: 'Ir a Productor'
  },
  productor: {
    titulo: 'Productor',
    notaIlustrativa: 'Los precios y costos de este taller son ilustrativos. No vienen de las lecturas.',
    elegirFinca: 'Escoja la finca que le asignó el profesor.',
    botonFinca: 'Confirmar finca',
    suFinca: 'Su finca',
    consigna: 'Usted maneja esta finca. Cada semana le sobran 100 kilos de un producto fresco. Decida a quién se los vende.',
    tabla: 'Lo que recibe la familia',
    columnas: ['Canal', 'Pesos por semana', 'Cuándo le pagan'],
    filas: ['Ronda 1', 'Ronda 2', 'Ronda 2, después del evento', 'Ronda 3'],
    pendiente: 'Todavía no',
    canales: {
      intermediario: 'Intermediario',
      rechazo: 'Intermediario. El supermercado no le compró.',
      asociacion: 'Asociación',
      contrato: 'Contrato escolar e intermediario'
    },
    pagos: { contado: 'De contado', plazo: 'A 45 días' },
    botonDecision: 'Confirmar decisión',
    frase: 'Explique su decisión en una frase',
    ronda1: {
      titulo: 'Ronda 1. Venta individual',
      opciones: [
        { id: 'intermediario', etiqueta: 'Intermediario', texto: 'Vender al intermediario. Paga 1.800 pesos por kilo, de contado. No pide requisitos.' },
        { id: 'supermercado', etiqueta: 'Supermercado', texto: 'Ofrecer la cosecha al supermercado. Paga 2.300 pesos por kilo, a 45 días. Pide certificado de buenas prácticas agrícolas, documento de venta y entrega en su centro de distribución.' }
      ],
      resultado: {
        intermediario: 'La familia recibe 180.000 pesos esta semana, de contado.',
        supermercado: 'El supermercado no le compra. Atender una finca de 100 kilos sin certificado le cuesta 1.100 pesos más por kilo. Con certificado, 600 pesos más. En los dos casos, la finca le sale más cara que el proveedor grande, que le cuesta 2.567 pesos por kilo. Su cosecha se vende al intermediario: 180.000 pesos, de contado.'
      }
    },
    ronda2: {
      titulo: 'Ronda 2. Venta por medio de una asociación',
      texto: 'Su finca entró a una asociación de seis fincas. La asociación le vende al supermercado a 2.400 pesos por kilo. Descuenta 400 pesos por kilo para sus costos. La familia recibe 2.000 pesos por kilo, a 45 días. El supermercado acepta a la asociación.',
      opciones: [
        { id: 'asociacion', etiqueta: 'Asociación', texto: 'Vender por medio de la asociación: 200.000 pesos por semana, a 45 días.' },
        { id: 'intermediario', etiqueta: 'Intermediario', texto: 'Seguir con el intermediario: 180.000 pesos por semana, de contado.' }
      ],
      eventoTitulo: 'Evento de la ronda',
      evento: 'El proveedor grande bajó su precio a 2.350 pesos por kilo. Para no perder el contrato, la asociación baja su precio a unos 2.317 pesos por kilo. La familia recibe unos 1.917 pesos por kilo: 191.667 pesos por semana, a 45 días.',
      eventoOpciones: [
        { id: 'seguir', etiqueta: 'Seguir con la asociación', texto: 'Seguir con la asociación.' },
        { id: 'volver', etiqueta: 'Volver al intermediario', texto: 'Volver al intermediario.' }
      ],
      casoRealTitulo: 'Caso real',
      casoReal: 'La asociación MUSA, de Santa Rosa de Cabal, tiene como aliados comerciales a Postobón y Superinter. Las exigencias de las empresas condicionan las cuotas y los precios. Algunas empresas han devuelto toneladas de fruta por incumplir requisitos.',
      casoRealFuente: 'Acevedo y Martínez (2016), pp. 148 y 155.'
    },
    ronda3: {
      titulo: 'Ronda 3. Compra pública',
      texto: 'El supermercado ganó un contrato de alimentación escolar. Por la Ley 2046 de 2020, debe comprarles a pequeños productores al menos el 30 % del valor y pagarles contra entrega. El contrato le compra 180 kilos a la asociación. A su finca le tocan 30 kilos, pagados de contado a 2.000 pesos. Los otros 70 kilos se venden al intermediario a 1.800 pesos.',
      fuente: 'Ley 2046 de 2020.',
      resultado: 'La familia recibe 186.000 pesos esta semana, de contado.',
      pregunta: '¿Qué resolvió la ley y qué no resolvió?'
    },
    siguiente: 'Siguiente ronda',
    anterior: 'Ronda anterior',
    irGerente: 'Ir a Gerente de compras'
  },
  gerente: {
    titulo: 'Gerente de compras',
    consigna: 'Ahora usted es gerente de compras del supermercado. Debe llenar un pedido semanal de 600 kilos. El supermercado vende a 3.500 pesos por kilo. Su jefe le exige ganar al menos 900 pesos por kilo.',
    explicacion: 'Ganancia por kilo = 3.500 pesos − lo que cuesta comprar y atender a los proveedores, dividido entre 600 kilos.',
    costoTotal: 'Costo total',
    costoPorKilo: 'Costo por kilo',
    gananciaPorKilo: 'Ganancia por kilo',
    cumpleMeta: 'Cumple la meta',
    noCumpleMeta: 'No cumple la meta',
    botonDecision: 'Confirmar decisión',
    frase: 'Explique su decisión en una frase',
    ronda1: {
      titulo: 'Ronda 1. Mercado libre',
      opciones: [
        { id: 'grande', etiqueta: 'Proveedor grande', texto: 'Proveedor grande: entrega los 600 kilos a 2.500 pesos por kilo. Cumple todas las exigencias. Atenderlo cuesta 40.000 pesos por semana.' },
        { id: 'fincas', etiqueta: 'Seis fincas pequeñas', texto: 'Seis fincas pequeñas: 100 kilos cada una a 2.300 pesos por kilo. Atender cada una cuesta 60.000 pesos por semana. Cuatro no tienen certificado. Revisar cada una cuesta 50.000 pesos por semana.' }
      ]
    },
    ronda2: {
      titulo: 'Ronda 2. Asociación',
      opciones: [
        { id: 'grande', etiqueta: 'Proveedor grande', texto: 'Proveedor grande: 600 kilos a 2.500 pesos por kilo. Atenderlo cuesta 40.000 pesos por semana.' },
        { id: 'asociacion', etiqueta: 'Asociación', texto: 'Asociación de seis fincas: 600 kilos a 2.400 pesos por kilo, con certificado. Atenderla cuesta 60.000 pesos por semana.' }
      ],
      eventoTitulo: 'Evento de la ronda',
      evento: 'El proveedor grande bajó su precio a 2.350 pesos por kilo.',
      eventoOpciones: [
        { id: 'cambiar', etiqueta: 'Cambiar al proveedor grande', texto: 'Cambiar al proveedor grande.' },
        { id: 'seguir', etiqueta: 'Seguir con la asociación', texto: 'Seguir con la asociación a 2.400 pesos por kilo.' },
        { id: 'igualar', etiqueta: 'Pedirle a la asociación que iguale', texto: 'Pedirle a la asociación que iguale el precio del grande.' }
      ],
      igualar: 'La asociación baja a unos 2.317 pesos por kilo. Cada familia recibe unos 1.917 pesos por kilo.'
    },
    ronda3: {
      titulo: 'Ronda 3. Contrato de alimentación escolar',
      texto: 'El supermercado ganó un contrato de alimentación escolar. Aplica la Ley 2046 de 2020. Al menos el 30 % del valor debe comprarse a pequeños productores. El pago a ellos es contra entrega. Precios: proveedor grande 2.350 pesos por kilo; asociación 2.400 pesos por kilo.',
      fuente: 'Ley 2046 de 2020.',
      control: 'Kilos que le compra a la asociación, de 0 a 600',
      numero: 'Kilos para la asociación',
      kilosAsociacion: 'Kilos para la asociación',
      kilosGrande: 'Kilos para el proveedor grande',
      participacion: 'Porcentaje del valor que va a la asociación',
      cumpleLey: 'Cumple la ley',
      noCumpleLey: 'No cumple la ley',
      nota: 'El 30 % se mide en pesos y no en kilos.',
      boton: 'Confirmar reparto',
      reparto: '{a} kilos a la asociación y {g} kilos al proveedor grande',
      pregunta: '¿Cuánto le costó la ley al supermercado?'
    },
    siguiente: 'Siguiente ronda',
    anterior: 'Ronda anterior',
    irEvaluacion: 'Ir a Evaluación'
  },
  evaluacion: {
    titulo: 'Evaluación',
    resumen: 'Resumen de sus decisiones',
    comoProductor: 'Como productor',
    comoGerente: 'Como gerente de compras',
    columnasProductor: ['Ronda', 'Decisión', 'Lo que recibe la familia'],
    columnasGerente: ['Ronda', 'Decisión', 'Ganancia por kilo'],
    rechazo: 'Supermercado. No le compró.',
    contrato: 'Contrato escolar e intermediario',
    familiaSemana: '{pesos} por semana. {pago}.',
    gananciaMeta: '{pesos}. {meta}.',
    repartoResumen: '{reparto}. {porcentaje} del valor para la asociación. {ley}.',
    pendiente: 'Sin decisión',
    preguntas: [
      { id: 'productor', texto: 'Como productor, ¿fue buena idea venderle al supermercado? Compare lo que recibe la familia en cada ronda.' },
      { id: 'gerente', texto: 'Como gerente, ¿a quién le compró y por qué?' },
      { id: 'coincide', texto: '¿Coincide lo que le conviene a la finca con lo que le conviene al supermercado?' }
    ],
    canal: 'Canal final para su finca',
    canalOpciones: [
      'Vender al supermercado por medio de una asociación.',
      'Vender a la compra pública local.',
      'Vender en un mercado campesino.',
      'Mantener el autoconsumo y vender los excedentes en la zona.'
    ],
    porque: 'Explique por qué',
    boton: 'Enviar evaluación',
    final: 'Terminó el taller. Gracias.'
  },
  resumenVista: {
    titulo: 'Resumen de respuestas',
    cargando: 'Cargando respuestas.',
    error: 'No se pudieron leer las respuestas. Abra la hoja de Google Sheets.',
    actualizado: 'Actualizado a las {hora}. La vista se actualiza cada 20 segundos.',
    sinRespuestas: 'Todavía no hay respuestas para esta fecha.',
    respondieron: 'Respondieron {n} estudiantes.',
    respondioUno: 'Respondió 1 estudiante.',
    explicaciones: 'Explicaciones',
    alcanza: '¿Alcanza?',
    limita: '¿Qué la limita?',
    porque: 'Por qué',
    estudiante: 'Estudiante',
    finca: 'Finca',
    decision: 'Decisión',
    despuesEvento: 'Después del evento',
    familia: 'Lo que recibe la familia',
    frase: 'Frase',
    ganancia: 'Ganancia por kilo',
    meta: 'Meta',
    kilos: 'Kilos a la asociación',
    participacion: 'Participación',
    ley: 'Ley',
    si: 'Sí',
    no: 'No',
    sinDato: '—'
  }
};
