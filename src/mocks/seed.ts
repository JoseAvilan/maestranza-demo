import {
  ROLES,
  type Cliente,
  type Equipo,
  type OrdenTrabajo,
  type OtEstado,
  type OtEvento,
  type OtItem,
  type OtPrioridad,
  type Usuario,
} from '@/domain/types'
import { rutDesdeCuerpo } from '@/lib/rut'
import { iniciales, sinTildes } from '@/lib/format'
import {
  APELLIDOS,
  CALLES,
  COMUNAS,
  EMPRESAS_BASE,
  EQUIPOS,
  FALLAS,
  GIROS,
  NOMBRES,
  NOTAS_TRANSICION,
  REPUESTOS,
  SERVICIOS,
  SUFIJOS_EMPRESA,
  type CategoriaEquipo,
} from './catalogos'

/**
 * Generador determinista de datos semilla.
 *
 * Usa un PRNG con semilla fija (mulberry32) en lugar de `Math.random`, para que
 * el dataset sea idéntico en cada carga, en cada navegador y en los tests. Las
 * fechas sí se calculan relativas a hoy, de modo que el demo nunca se vea
 * congelado en el pasado.
 */

type Rng = () => number

function mulberry32(semilla: number): Rng {
  let a = semilla
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Entero en [min, max], ambos inclusive. */
function entero(rng: Rng, min: number, max: number): number {
  return Math.floor(rng() * (max - min + 1)) + min
}

/** Elemento al azar. El cast evita ruido de `noUncheckedIndexedAccess`: los catálogos nunca están vacíos. */
function elegir<T>(rng: Rng, lista: readonly T[]): T {
  return lista[Math.floor(rng() * lista.length)] as T
}

/** Redondea a la centena, como se cotiza en la práctica. */
function redondearPrecio(valor: number): number {
  return Math.round(valor / 100) * 100
}

function sumarDias(fecha: Date, dias: number): Date {
  const copia = new Date(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

/** Desplaza a día hábil: el taller no recepciona equipos en fin de semana. */
function aDiaHabil(fecha: Date): Date {
  const dia = fecha.getDay()
  if (dia === 0) return sumarDias(fecha, 1)
  if (dia === 6) return sumarDias(fecha, 2)
  return fecha
}

export interface DatosSemilla {
  usuarios: Usuario[]
  clientes: Cliente[]
  equipos: Equipo[]
  ordenes: OrdenTrabajo[]
}

/** Cuentas de demostración. Son fijas: el login las muestra en pantalla. */
function construirUsuarios(): Usuario[] {
  const base: Omit<Usuario, 'iniciales'>[] = [
    {
      id: 'usr-1',
      nombre: 'Rodrigo Sanhueza',
      email: 'jefe@maestranza.demo',
      rol: ROLES.jefeTaller,
    },
    { id: 'usr-2', nombre: 'Camila Vergara', email: 'recepcion@maestranza.demo', rol: ROLES.recepcion },
    { id: 'usr-3', nombre: 'Matías Riquelme', email: 'tecnico@maestranza.demo', rol: ROLES.tecnico },
    { id: 'usr-4', nombre: 'Javiera Pincheira', email: 'javiera@maestranza.demo', rol: ROLES.tecnico },
    { id: 'usr-5', nombre: 'Benjamín Cárcamo', email: 'benjamin@maestranza.demo', rol: ROLES.tecnico },
    { id: 'usr-6', nombre: 'Constanza Aravena', email: 'constanza@maestranza.demo', rol: ROLES.tecnico },
  ]

  return base.map((u) => ({ ...u, iniciales: iniciales(u.nombre) }))
}

/** Mezcla una copia de la lista (Fisher-Yates) sin tocar el original. */
function mezclar<T>(rng: Rng, lista: readonly T[]): T[] {
  const copia = [...lista]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j] as T, copia[i] as T]
  }
  return copia
}

function construirClientes(rng: Rng, cantidad: number, hoy: Date): Cliente[] {
  const clientes: Cliente[] = []

  // Cada empresa usa un nombre base distinto: repetir "Maderas Colcura" con
  // tres razones sociales diferentes delata de inmediato que son datos falsos.
  const bases = mezclar(rng, EMPRESAS_BASE).slice(0, cantidad)

  for (let i = 0; i < bases.length; i++) {
    const razon = `${bases[i]} ${elegir(rng, SUFIJOS_EMPRESA)}`

    const nombre = elegir(rng, NOMBRES)
    const apellido = elegir(rng, APELLIDOS)
    const contacto = `${nombre} ${apellido}`
    const dominio = sinTildes(razon.toLowerCase())
      .replace(/[^a-z]/g, '')
      .slice(0, 12)

    clientes.push({
      id: `cli-${i + 1}`,
      razonSocial: razon,
      rut: rutDesdeCuerpo(entero(rng, 76_000_000, 78_999_999)),
      giro: elegir(rng, GIROS),
      contactoNombre: contacto,
      contactoEmail: `${sinTildes(nombre.toLowerCase())}@${dominio}.cl`,
      contactoTelefono: `+56 9 ${entero(rng, 4000, 9999)} ${entero(rng, 1000, 9999)}`,
      direccion: `${elegir(rng, CALLES)} ${entero(rng, 120, 9800)}`,
      comuna: elegir(rng, COMUNAS),
      creadoEn: sumarDias(hoy, -entero(rng, 420, 1800)).toISOString(),
    })
  }

  return clientes
}

function construirEquipos(rng: Rng, clientes: Cliente[]): Equipo[] {
  const equipos: Equipo[] = []
  let contador = 1

  for (const cliente of clientes) {
    const cantidad = entero(rng, 1, 3)
    for (let i = 0; i < cantidad; i++) {
      const tipo = elegir(rng, EQUIPOS)
      equipos.push({
        id: `eq-${contador++}`,
        clienteId: cliente.id,
        nombre: tipo.nombre,
        marca: tipo.marca,
        modelo: elegir(rng, tipo.modelos),
        numeroSerie: `${tipo.marca.slice(0, 3).toUpperCase()}-${entero(rng, 100000, 999999)}`,
      })
    }
  }

  return equipos
}

/**
 * Fallas que tienen sentido físico para un equipo dado. Sin este filtro
 * aparecerían combinaciones que delatan datos generados al azar, como un motor
 * eléctrico con pérdida de presión hidráulica.
 */
function fallasCompatibles(nombreEquipo: string): typeof FALLAS[number][] {
  const equipo = EQUIPOS.find((e) => e.nombre === nombreEquipo)
  const categorias: readonly CategoriaEquipo[] = equipo?.categorias ?? []

  const compatibles = FALLAS.filter(
    (falla) => falla.categorias === null || falla.categorias.some((c) => categorias.includes(c)),
  )

  // Un equipo sin coincidencias siempre puede entrar por mantención preventiva.
  return compatibles.length > 0 ? compatibles : FALLAS.filter((f) => f.categorias === null)
}

function construirItems(rng: Rng, estado: OtEstado): OtItem[] {
  // Una OT recién recepcionada aún no tiene cotización: sin ítems.
  if (estado === 'recepcionada') return []

  const items: OtItem[] = []
  let contador = 1

  const cantidadServicios = entero(rng, 1, 3)
  for (let i = 0; i < cantidadServicios; i++) {
    const servicio = elegir(rng, SERVICIOS)
    items.push({
      id: `it-${contador++}`,
      descripcion: servicio.descripcion,
      cantidad: 1,
      precioUnitario: redondearPrecio(entero(rng, servicio.min, servicio.max)),
      tipo: 'servicio',
    })
  }

  const cantidadRepuestos = entero(rng, 0, 4)
  for (let i = 0; i < cantidadRepuestos; i++) {
    const repuesto = elegir(rng, REPUESTOS)
    items.push({
      id: `it-${contador++}`,
      descripcion: repuesto.descripcion,
      cantidad: entero(rng, 1, 4),
      precioUnitario: redondearPrecio(entero(rng, repuesto.min, repuesto.max)),
      tipo: 'repuesto',
    })
  }

  // Deduplica descripciones repetidas sumando cantidades.
  const porDescripcion = new Map<string, OtItem>()
  for (const item of items) {
    const previo = porDescripcion.get(item.descripcion)
    if (previo) {
      previo.cantidad += item.cantidad
    } else {
      porDescripcion.set(item.descripcion, item)
    }
  }

  return [...porDescripcion.values()]
}

/**
 * Elige el estado según la antigüedad: lo viejo está cerrado, lo reciente
 * se reparte por el flujo. Sin esto, el listado se ve claramente aleatorio.
 */
function estadoSegunAntiguedad(rng: Rng, diasAtras: number): OtEstado {
  const dado = rng()

  if (diasAtras > 75) {
    return dado < 0.93 ? 'cerrada' : 'anulada'
  }
  if (diasAtras > 40) {
    if (dado < 0.8) return 'cerrada'
    if (dado < 0.92) return 'en_ejecucion'
    return 'anulada'
  }
  if (diasAtras > 18) {
    if (dado < 0.45) return 'cerrada'
    if (dado < 0.8) return 'en_ejecucion'
    if (dado < 0.93) return 'aprobada'
    return 'anulada'
  }
  if (diasAtras > 7) {
    if (dado < 0.14) return 'cerrada'
    if (dado < 0.45) return 'en_ejecucion'
    if (dado < 0.72) return 'aprobada'
    return 'cotizada'
  }
  if (dado < 0.34) return 'recepcionada'
  if (dado < 0.68) return 'cotizada'
  if (dado < 0.88) return 'aprobada'
  return 'en_ejecucion'
}

/** Camino de estados recorrido hasta llegar al estado final. */
function caminoHasta(estado: OtEstado): OtEstado[] {
  const flujo: OtEstado[] = ['recepcionada', 'cotizada', 'aprobada', 'en_ejecucion', 'cerrada']
  if (estado === 'anulada') {
    // Se anula en un punto intermedio del flujo, no siempre al inicio.
    return ['recepcionada', 'anulada']
  }
  const indice = flujo.indexOf(estado)
  return flujo.slice(0, indice + 1)
}

function construirEventos(
  rng: Rng,
  estado: OtEstado,
  creadaEn: Date,
  usuarios: Usuario[],
  tecnico: Usuario | null,
  ahora: Date,
): { eventos: OtEvento[]; cerradaEn: string | null } {
  const camino = caminoHasta(estado)
  const jefe = usuarios.find((u) => u.rol === ROLES.jefeTaller) as Usuario
  const recepcion = usuarios.find((u) => u.rol === ROLES.recepcion) as Usuario

  /**
   * Los saltos entre hitos se calculan primero y luego se comprimen para que
   * el último quepa antes de ahora: una bitácora de auditoría no puede tener
   * entradas con fecha futura. Una OT recién ingresada que ya está en ejecución
   * simplemente avanzó rápido dentro del mismo día.
   */
  const saltos = camino.slice(1).map(() => entero(rng, 5, 96))
  const totalHoras = saltos.reduce((acc, h) => acc + h, 0)
  const horasDisponibles = Math.max(0, (ahora.getTime() - creadaEn.getTime()) / 3_600_000)
  const factor = totalHoras > horasDisponibles && totalHoras > 0 ? horasDisponibles / totalHoras : 1

  const eventos: OtEvento[] = []
  let horasAcumuladas = 0
  let fecha = creadaEn
  let anterior: OtEstado | null = null
  let cerradaEn: string | null = null

  camino.forEach((paso, indice) => {
    if (indice > 0) {
      horasAcumuladas += (saltos[indice - 1] ?? 0) * factor
      // En milisegundos, no con setHours: el factor de compresión da fracciones.
      fecha = new Date(creadaEn.getTime() + horasAcumuladas * 3_600_000)
    }

    // Quien ejecuta depende de la etapa: recepción cotiza, el técnico trabaja.
    const autor =
      paso === 'en_ejecucion' || paso === 'cerrada' ? (tecnico ?? jefe) : indice === 0 ? recepcion : elegir(rng, [jefe, recepcion])

    const notas = NOTAS_TRANSICION[paso]
    eventos.push({
      id: `ev-${indice + 1}`,
      fecha: fecha.toISOString(),
      autorNombre: autor.nombre,
      autorRol: autor.rol,
      desde: anterior,
      hasta: paso,
      nota: indice === 0 ? 'Equipo recepcionado en taller. Se levanta la orden de trabajo.' : (notas ? elegir(rng, notas) : ''),
    })

    if (paso === 'cerrada') cerradaEn = fecha.toISOString()
    anterior = paso
  })

  return { eventos, cerradaEn }
}

function construirOrdenes(
  rng: Rng,
  cantidad: number,
  clientes: Cliente[],
  equipos: Equipo[],
  usuarios: Usuario[],
  hoy: Date,
): OrdenTrabajo[] {
  const tecnicos = usuarios.filter((u) => u.rol === ROLES.tecnico)
  const prioridades: OtPrioridad[] = ['baja', 'normal', 'normal', 'normal', 'alta', 'alta', 'critica']
  const borradores: (Omit<OrdenTrabajo, 'folio'> & { creada: Date })[] = []

  for (let i = 0; i < cantidad; i++) {
    // Distribución sesgada hacia lo reciente: el taller creció en el último año.
    const diasAtras = Math.floor(Math.pow(rng(), 1.6) * 425)
    const creada = aDiaHabil(sumarDias(hoy, -diasAtras))
    creada.setHours(entero(rng, 8, 17), entero(rng, 0, 59), 0, 0)
    // El horario de taller (08:00–17:59) puede caer más tarde que la hora actual
    // si la orden es de hoy; se acota para no ingresar equipos en el futuro.
    if (creada.getTime() > hoy.getTime()) creada.setTime(hoy.getTime())

    const equipo = elegir(rng, equipos)
    const cliente = clientes.find((c) => c.id === equipo.clienteId) as Cliente
    const estado = estadoSegunAntiguedad(rng, diasAtras)
    const falla = elegir(rng, fallasCompatibles(equipo.nombre))

    // Sin técnico asignado mientras la OT no está aprobada.
    const requiereTecnico = estado === 'aprobada' || estado === 'en_ejecucion' || estado === 'cerrada'
    const tecnico = requiereTecnico ? elegir(rng, tecnicos) : null

    const { eventos, cerradaEn } = construirEventos(rng, estado, creada, usuarios, tecnico, hoy)

    borradores.push({
      id: `ot-${i + 1}`,
      clienteId: cliente.id,
      equipoId: equipo.id,
      tecnicoId: tecnico?.id ?? null,
      estado,
      prioridad: elegir(rng, prioridades),
      titulo: falla.titulo,
      descripcionFalla: falla.detalle,
      items: construirItems(rng, estado),
      fechaCompromiso: sumarDias(creada, entero(rng, 6, 32)).toISOString(),
      creadaEn: creada.toISOString(),
      cerradaEn,
      eventos,
      creada,
    })
  }

  // Folio correlativo por año, asignado en orden cronológico real.
  borradores.sort((a, b) => a.creada.getTime() - b.creada.getTime())
  const contadorPorAnio = new Map<number, number>()

  return borradores.map(({ creada, ...orden }) => {
    const anio = creada.getFullYear()
    const siguiente = (contadorPorAnio.get(anio) ?? 0) + 1
    contadorPorAnio.set(anio, siguiente)

    return {
      ...orden,
      folio: `OT-${anio}-${String(siguiente).padStart(4, '0')}`,
    }
  })
}

/** Construye el dataset completo. La semilla fija hace el resultado reproducible. */
export function generarDatos(semilla = 20260817): DatosSemilla {
  const rng = mulberry32(semilla)
  const hoy = new Date()

  const usuarios = construirUsuarios()
  const clientes = construirClientes(rng, 28, hoy)
  const equipos = construirEquipos(rng, clientes)
  const ordenes = construirOrdenes(rng, 260, clientes, equipos, usuarios, hoy)

  return { usuarios, clientes, equipos, ordenes }
}
