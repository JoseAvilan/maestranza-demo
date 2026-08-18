/**
 * Catálogos para los datos semilla. Todo el vocabulario viene del mundo real
 * de una maestranza del Biobío: nombres chilenos, comunas de la zona, equipos
 * y servicios que un taller de este tipo efectivamente factura.
 */

export const NOMBRES = [
  'Camila',
  'Matías',
  'Valentina',
  'Sebastián',
  'Francisca',
  'Ignacio',
  'Javiera',
  'Cristóbal',
  'Antonia',
  'Benjamín',
  'Constanza',
  'Rodrigo',
  'Daniela',
  'Felipe',
  'Paulina',
  'Nicolás',
  'Carolina',
  'Andrés',
  'Macarena',
  'Gonzalo',
] as const

export const APELLIDOS = [
  'González',
  'Muñoz',
  'Rojas',
  'Díaz',
  'Contreras',
  'Sepúlveda',
  'Fuentes',
  'Espinoza',
  'Valenzuela',
  'Torres',
  'Vergara',
  'Sanhueza',
  'Cárcamo',
  'Riquelme',
  'Bustos',
  'Aravena',
  'Norambuena',
  'Pincheira',
  'Alarcón',
  'Henríquez',
] as const

/** Comunas del Gran Concepción y alrededores. */
export const COMUNAS = [
  'Concepción',
  'Talcahuano',
  'Hualpén',
  'San Pedro de la Paz',
  'Chiguayante',
  'Coronel',
  'Lota',
  'Penco',
  'Tomé',
  'Los Ángeles',
  'Cabrero',
  'Nacimiento',
] as const

export const CALLES = [
  'Av. Jorge Alessandri',
  'Camino a Coronel',
  'Av. Colón',
  'Ruta 160',
  'Av. Gran Bretaña',
  'Camino Penco',
  'Av. Costanera',
  'Los Carrera',
  'Av. Pedro Aguirre Cerda',
  'Camino a Bulnes',
] as const

/** Razones sociales verosímiles: sufijo + rubro propio de la zona. */
export const EMPRESAS_BASE = [
  'Forestal Nahuelbuta',
  'Pesquera Bío Costa',
  'Áridos Andalién',
  'Metalúrgica Talcahuano',
  'Constructora Vega Sur',
  'Agrícola Los Robles',
  'Transportes Cordillera',
  'Aserradero Lircay',
  'Frigorífico Penco',
  'Astilleros del Sur',
  'Minera Carbonífera Lota',
  'Papelera Andina',
  'Cerámicas Biobío',
  'Alimentos Rucalhue',
  'Riego Tecnificado Ñuble',
  'Maderas Colcura',
  'Salmones Coliumo',
  'Envases Hualpén',
  'Textil Chiguayante',
  'Lácteos Cabrero',
  'Hormigones Coronel',
  'Grúas Talcamávida',
  'Reciclajes Andalién',
  'Packing Frutícola San Rosendo',
  'Molinos Laja',
  'Curtiembre Andalién',
  'Plásticos Talcahuano',
  'Refractarios Coronel',
  'Bodegas Refrigeradas Arauco',
  'Estructuras Metálicas Nonguén',
  'Tratamientos Térmicos Biobío',
  'Vidrios Chillán',
  'Áridos Itata',
  'Conservas Dichato',
] as const

export const SUFIJOS_EMPRESA = ['S.A.', 'SpA', 'Ltda.', 'y Cía. Ltda.'] as const

export const GIROS = [
  'Aserrío y acepilladura de madera',
  'Elaboración y conservación de pescado',
  'Extracción de arena y arcilla',
  'Fabricación de productos metálicos',
  'Construcción de edificios',
  'Cultivo de cereales',
  'Transporte de carga por carretera',
  'Fabricación de envases',
  'Elaboración de productos lácteos',
  'Servicios de apoyo a la minería',
] as const

/**
 * Categorías técnicas de un equipo. Sirven para emparejar cada equipo con
 * fallas que tengan sentido físico: una caldera no sufre erosión de impulsor
 * y un motor eléctrico no pierde presión hidráulica. Cualquiera del rubro nota
 * esas incoherencias de inmediato.
 */
export type CategoriaEquipo =
  | 'rotativo'
  | 'bombeo'
  | 'hidraulico'
  | 'electrico'
  | 'engranajes'
  | 'estructural'
  | 'termico'

/** Equipos típicos que entran a reparación en una maestranza. */
export const EQUIPOS = [
  {
    nombre: 'Bomba centrífuga',
    marca: 'KSB',
    modelos: ['Etanorm 80-200', 'Megachem 50-160'],
    categorias: ['rotativo', 'bombeo'],
  },
  {
    nombre: 'Reductor de velocidad',
    marca: 'SEW',
    modelos: ['K107 DRN132', 'R97 DRE100'],
    categorias: ['rotativo', 'engranajes'],
  },
  {
    nombre: 'Motor eléctrico trifásico',
    marca: 'WEG',
    modelos: ['W22 75HP', 'W22 40HP'],
    categorias: ['rotativo', 'electrico'],
  },
  {
    nombre: 'Compresor de tornillo',
    marca: 'Atlas Copco',
    modelos: ['GA37 VSD', 'GA22+'],
    categorias: ['rotativo', 'electrico'],
  },
  {
    nombre: 'Cinta transportadora',
    marca: 'Metso',
    modelos: ['CT-1200', 'CT-800'],
    categorias: ['rotativo', 'estructural'],
  },
  {
    nombre: 'Chancador de mandíbula',
    marca: 'Nordberg',
    modelos: ['C106', 'C96'],
    categorias: ['rotativo', 'engranajes', 'estructural'],
  },
  {
    nombre: 'Harnero vibratorio',
    marca: 'Sandvik',
    modelos: ['SC2163', 'SC1845'],
    categorias: ['rotativo', 'estructural'],
  },
  {
    nombre: 'Grúa horquilla',
    marca: 'Toyota',
    modelos: ['8FD25', '62-8FD30'],
    categorias: ['hidraulico', 'electrico', 'estructural'],
  },
  {
    nombre: 'Caldera pirotubular',
    marca: 'Bosch',
    modelos: ['UL-S 2000', 'UL-S 4000'],
    categorias: ['termico', 'estructural'],
  },
  {
    nombre: 'Prensa hidráulica',
    marca: 'Enerpac',
    modelos: ['P-392 100T', 'RC-1006'],
    categorias: ['hidraulico', 'estructural'],
  },
  {
    nombre: 'Intercambiador de calor',
    marca: 'Alfa Laval',
    modelos: ['M10-BFG', 'T20-MFG'],
    // Solo térmico: sus juntas son empaquetaduras de placa, no sellos mecánicos.
    categorias: ['termico'],
  },
  {
    nombre: 'Sinfín transportador',
    marca: 'Fabricación propia',
    modelos: ['SF-300', 'SF-450'],
    categorias: ['rotativo', 'engranajes', 'estructural'],
  },
] as const satisfies readonly {
  nombre: string
  marca: string
  modelos: readonly string[]
  categorias: readonly CategoriaEquipo[]
}[]

/**
 * Fallas frecuentes. `categorias` restringe a qué equipos puede afectar cada
 * una; `null` significa que aplica a cualquiera.
 */
export const FALLAS = [
  {
    categorias: ['rotativo'],
    titulo: 'Vibración excesiva y ruido en rodamientos',
    detalle:
      'El operador reporta vibración creciente durante las últimas dos semanas, con ruido metálico en el lado acople. Se detiene el equipo por precaución.',
  },
  {
    categorias: ['rotativo', 'bombeo', 'hidraulico'],
    titulo: 'Fuga de aceite por sello mecánico',
    detalle:
      'Pérdida de aceite visible en la base del equipo, aproximadamente 2 litros por turno. Nivel del cárter bajo el mínimo al inicio de cada jornada.',
  },
  {
    categorias: ['electrico', 'rotativo'],
    titulo: 'Sobrecalentamiento del motor',
    detalle:
      'Temperatura de carcasa sobre 90 °C en régimen normal. Protección térmica actúa de forma intermitente y detiene la línea.',
  },
  {
    categorias: ['rotativo'],
    titulo: 'Desalineación de acople',
    detalle:
      'Desgaste prematuro y asimétrico del acople elastomérico. Se sospecha asentamiento de la fundación tras el último traslado.',
  },
  {
    categorias: ['hidraulico'],
    titulo: 'Pérdida de presión hidráulica',
    detalle:
      'El sistema no alcanza la presión de trabajo especificada. El manómetro cae bajo carga y el ciclo no completa la carrera.',
  },
  {
    categorias: ['estructural'],
    titulo: 'Fisura en estructura soportante',
    detalle:
      'Inspección visual detecta fisura de unos 12 cm en el bastidor, en la zona de mayor esfuerzo. Se requiere evaluación antes de reanudar operación.',
  },
  {
    categorias: ['engranajes'],
    titulo: 'Desgaste de engranajes de reducción',
    detalle:
      'Juego angular fuera de tolerancia y presencia de limaduras en el aceite. El análisis de lubricante muestra alto contenido de hierro.',
  },
  {
    categorias: ['electrico'],
    titulo: 'Falla intermitente de arranque',
    detalle:
      'El equipo no arranca en frío y requiere varios intentos. Se descarta problema de alimentación en tablero.',
  },
  {
    categorias: ['bombeo'],
    titulo: 'Obstrucción y erosión en impulsor',
    detalle:
      'Caudal por debajo de lo nominal. Se presume erosión por sólidos en suspensión y obstrucción parcial del impulsor.',
  },
  {
    categorias: ['termico'],
    titulo: 'Incrustación y bajo rendimiento térmico',
    detalle:
      'Caída del salto térmico respecto al diseño y mayor consumo de combustible. Se presume incrustación en placas por calidad del agua de alimentación.',
  },
  {
    categorias: ['termico'],
    titulo: 'Fuga por empaquetadura de placas',
    detalle:
      'Goteo permanente en el costado del equipo bajo presión de trabajo. Se requiere desarme, reemplazo de empaquetaduras y prueba hidrostática.',
  },
  {
    categorias: null,
    titulo: 'Mantención preventiva programada',
    detalle:
      'Pauta de mantención de las 2.000 horas: cambio de lubricante, revisión de rodamientos, alineación y ajuste de tolerancias.',
  },
] as const satisfies readonly {
  categorias: readonly CategoriaEquipo[] | null
  titulo: string
  detalle: string
}[]

/** Servicios de mano de obra, con rango de precio neto en CLP. */
export const SERVICIOS = [
  { descripcion: 'Desarme, inspección y diagnóstico', min: 85_000, max: 220_000 },
  { descripcion: 'Mano de obra mecánica especializada', min: 180_000, max: 640_000 },
  { descripcion: 'Alineación láser de acople', min: 120_000, max: 260_000 },
  { descripcion: 'Balanceo dinámico de rotor', min: 160_000, max: 380_000 },
  { descripcion: 'Soldadura y recuperación de eje', min: 210_000, max: 720_000 },
  { descripcion: 'Mecanizado en torno CNC', min: 150_000, max: 540_000 },
  { descripcion: 'Análisis de vibraciones en terreno', min: 95_000, max: 240_000 },
  { descripcion: 'Traslado y montaje en planta', min: 130_000, max: 420_000 },
  { descripcion: 'Pruebas en banco y puesta en marcha', min: 110_000, max: 300_000 },
] as const

/** Repuestos, con rango de precio neto unitario en CLP. */
export const REPUESTOS = [
  { descripcion: 'Rodamiento SKF 6312-2RS1', min: 38_000, max: 96_000 },
  { descripcion: 'Sello mecánico John Crane Type 21', min: 74_000, max: 185_000 },
  { descripcion: 'Retén de eje 75x100x10 NBR', min: 8_500, max: 22_000 },
  { descripcion: 'Acople elastomérico Rotex 65', min: 92_000, max: 210_000 },
  { descripcion: 'Kit de empaquetaduras', min: 26_000, max: 68_000 },
  { descripcion: 'Correa dentada Gates 8M-1600', min: 34_000, max: 78_000 },
  { descripcion: 'Aceite Mobil SHC 630 (20 L)', min: 145_000, max: 240_000 },
  { descripcion: 'Impulsor de repuesto en bronce', min: 380_000, max: 1_250_000 },
  { descripcion: 'Piñón Z-24 acero SAE 4140', min: 165_000, max: 495_000 },
  { descripcion: 'Manguera hidráulica R2 1/2" con terminales', min: 42_000, max: 115_000 },
  { descripcion: 'Contactor Siemens 3RT2 40A', min: 58_000, max: 132_000 },
  { descripcion: 'Filtro de aire Donaldson P181050', min: 31_000, max: 74_000 },
] as const

/** Notas de bitácora por transición, para que el historial se lea humano. */
export const NOTAS_TRANSICION: Record<string, readonly string[]> = {
  cotizada: [
    'Se cotiza según diagnóstico inicial. Valores sujetos a hallazgos durante el desarme.',
    'Cotización enviada al contacto por correo. A la espera de orden de compra.',
    'Se ofrecen dos alternativas: reparación o reemplazo. El cliente evalúa internamente.',
  ],
  aprobada: [
    'Cliente aprueba por correo. Adjunta orden de compra.',
    'Aprobación telefónica confirmada por el jefe de mantención.',
    'Se aprueba solo el alcance principal. El resto queda para una segunda etapa.',
  ],
  en_ejecucion: [
    'Equipo ingresa a taller. Se inicia desarme.',
    'Se asigna el trabajo al banco 3. Repuestos disponibles en bodega.',
    'Comienza ejecución. A la espera de un repuesto importado para la etapa final.',
  ],
  cerrada: [
    'Trabajo terminado y probado en banco. Equipo despachado y recepcionado conforme.',
    'Puesta en marcha en planta sin observaciones. Se entrega informe técnico.',
    'Cierre conforme. Se recomienda repetir la pauta preventiva en 2.000 horas.',
  ],
  anulada: [
    'Cliente desiste: decide reemplazar el equipo por uno nuevo.',
    'Se anula por presupuesto no aprobado dentro del ejercicio.',
    'Anulada a solicitud del cliente. El equipo se retira sin intervención.',
  ],
}
