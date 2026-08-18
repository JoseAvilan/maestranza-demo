import { http, HttpResponse, delay } from 'msw'
import type {
  FiltroOrdenes,
  LoginRequest,
  NuevaOrdenRequest,
  Paginado,
  TransicionRequest,
} from '@/api/contracts'
import type {
  Cliente,
  Equipo,
  KpiResumen,
  OrdenTrabajo,
  OrdenTrabajoDetalle,
  OtEstado,
  OtEvento,
} from '@/domain/types'
import { OT_ESTADO_LABEL, ROLES } from '@/domain/types'
import { ESTADOS_ABIERTOS, esEstadoAbierto, puedeTransicionar } from '@/domain/workflow'
import { sinTildes } from '@/lib/format'
import { validarRut } from '@/lib/rut'
import {
  buscarCliente,
  buscarEquipo,
  buscarOrden,
  buscarUsuario,
  obtenerDb,
  persistir,
  reiniciarDb,
  siguienteFolio,
} from './db'
import { calcularTotales } from './totales'

/**
 * API REST simulada.
 *
 * MSW intercepta `fetch` a nivel de service worker, de modo que la aplicación
 * hace peticiones HTTP reales contra `/api/*` y no sabe que el backend es
 * ficticio: mismos estados de carga, mismos errores, mismo código de cliente
 * que se usaría contra un servidor de verdad. Reemplazar esto por un backend
 * real sería borrar esta carpeta y apuntar la URL base a otro sitio.
 */

const PASSWORD_DEMO = 'demo1234'

/** Latencia simulada: suficiente para que los skeletons se vean, no tanta que moleste. */
async function latencia(min = 180, max = 480): Promise<void> {
  await delay(Math.floor(Math.random() * (max - min + 1)) + min)
}

/**
 * "Modo caos": inyecta fallas en las mutaciones para mostrar el manejo de
 * errores. Apagado por defecto —un demo de portafolio que falla al azar juega
 * en contra—, se activa desde la interfaz.
 */
function caosActivo(): boolean {
  return localStorage.getItem('maestranza:caos') === '1'
}

function quizasFallar(): Response | null {
  if (caosActivo() && Math.random() < 0.25) {
    return HttpResponse.json(
      { mensaje: 'El servicio no está disponible en este momento. Intenta nuevamente.' },
      { status: 503 },
    )
  }
  return null
}

function coincide(texto: string, consulta: string): boolean {
  return sinTildes(texto.toLowerCase()).includes(sinTildes(consulta.toLowerCase()))
}

function paginar<T>(datos: T[], pagina: number, porPagina: number): Paginado<T> {
  const inicio = (pagina - 1) * porPagina
  return {
    datos: datos.slice(inicio, inicio + porPagina),
    total: datos.length,
    pagina,
    porPagina,
  }
}

/** Enriquece una OT con cliente, equipo, técnico y totales. */
function aDetalle(orden: OrdenTrabajo): OrdenTrabajoDetalle {
  const cliente = buscarCliente(orden.clienteId) as Cliente
  const equipo = buscarEquipo(orden.equipoId) as Equipo
  const tecnico = buscarUsuario(orden.tecnicoId) ?? null
  const totales = calcularTotales(orden)

  return { ...orden, cliente, equipo, tecnico, ...totales }
}

function estaAtrasada(orden: OrdenTrabajo): boolean {
  return esEstadoAbierto(orden.estado) && new Date(orden.fechaCompromiso).getTime() < Date.now()
}

function claveMes(fecha: Date): string {
  return `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
}

function calcularKpis(): KpiResumen {
  const { ordenes, usuarios } = obtenerDb()
  const ahora = new Date()

  const abiertas = ordenes.filter((o) => esEstadoAbierto(o.estado))
  const atrasadas = abiertas.filter(estaAtrasada)

  // Tiempo de ciclo: promedio de días entre recepción y cierre, últimos 90 días.
  const limiteCiclo = new Date(ahora)
  limiteCiclo.setDate(limiteCiclo.getDate() - 90)

  const cerradasRecientes = ordenes.filter(
    (o) => o.cerradaEn !== null && new Date(o.cerradaEn) >= limiteCiclo,
  )
  const sumaCiclo = cerradasRecientes.reduce((acc, o) => {
    const dias = (new Date(o.cerradaEn as string).getTime() - new Date(o.creadaEn).getTime()) / 86_400_000
    return acc + dias
  }, 0)
  const tiempoCicloDias =
    cerradasRecientes.length > 0 ? Math.round((sumaCiclo / cerradasRecientes.length) * 10) / 10 : 0

  /**
   * La venta se reconoce cuando el cliente aprueba la cotización, no al cerrar
   * la orden. Reconocer al cierre hundiría siempre el mes en curso: los
   * trabajos recientes todavía están en ejecución y su ingreso aparecería
   * meses después de haberse comprometido.
   */
  const fechaVenta = (orden: OrdenTrabajo): string | null =>
    orden.eventos.find((evento) => evento.hasta === 'aprobada')?.fecha ?? null

  const ingresosPorMes = new Map<string, number>()
  for (const orden of ordenes) {
    const fecha = fechaVenta(orden)
    if (!fecha) continue
    const clave = claveMes(new Date(fecha))
    ingresosPorMes.set(clave, (ingresosPorMes.get(clave) ?? 0) + calcularTotales(orden).total)
  }

  /**
   * Comparación mes contra mes acotada al mismo día de corte. Contrastar un mes
   * en curso contra uno completo siempre arrojaría una caída falsa: el día 17
   * el mes actual lleva poco más de la mitad de su facturación.
   */
  const diaCorte = ahora.getDate()
  const ingresosHastaDia = (anio: number, mes: number): number =>
    ordenes.reduce((acc, orden) => {
      const venta = fechaVenta(orden)
      if (!venta) return acc
      const fecha = new Date(venta)
      if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes) return acc
      if (fecha.getDate() > diaCorte) return acc
      return acc + calcularTotales(orden).total
    }, 0)

  const mesPrevio = new Date(ahora.getFullYear(), ahora.getMonth() - 1, 1)
  const ingresosMes = ingresosHastaDia(ahora.getFullYear(), ahora.getMonth())
  const ingresosPrevio = ingresosHastaDia(mesPrevio.getFullYear(), mesPrevio.getMonth())
  const variacionIngresosPct =
    ingresosPrevio > 0 ? Math.round(((ingresosMes - ingresosPrevio) / ingresosPrevio) * 100) : 0

  // Serie de 12 meses, incluyendo meses sin ingresos para no distorsionar el gráfico.
  const ingresosMensuales: KpiResumen['ingresosMensuales'] = []
  for (let i = 11; i >= 0; i--) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - i, 1)
    const clave = claveMes(fecha)
    ingresosMensuales.push({
      mes: clave,
      label: new Intl.DateTimeFormat('es-CL', { month: 'short' }).format(fecha).replace('.', ''),
      total: ingresosPorMes.get(clave) ?? 0,
    })
  }

  /**
   * Solo estados abiertos. Incluir las cerradas —que son la enorme mayoría del
   * histórico— aplastaba las otras cuatro barras hasta volverlas ilegibles, y
   * además el dato accionable es la carga viva del taller, no cuántas se han
   * cerrado desde siempre.
   */
  const porEstado = ESTADOS_ABIERTOS.map((estado) => ({
    estado,
    label: OT_ESTADO_LABEL[estado],
    cantidad: abiertas.filter((o) => o.estado === estado).length,
  }))

  const cargaTecnicos = usuarios
    .filter((u) => u.rol === ROLES.tecnico)
    .map((tecnico) => ({
      tecnicoId: tecnico.id,
      nombre: tecnico.nombre,
      abiertas: abiertas.filter((o) => o.tecnicoId === tecnico.id).length,
    }))
    .sort((a, b) => b.abiertas - a.abiertas)

  return {
    otAbiertas: abiertas.length,
    otAtrasadas: atrasadas.length,
    tiempoCicloDias,
    ingresosMes,
    variacionIngresosPct,
    porEstado,
    ingresosMensuales,
    cargaTecnicos,
  }
}

export const handlers = [
  /* ---------------------------------------------------------------- auth */

  http.post('/api/auth/login', async ({ request }) => {
    await latencia(400, 700)
    const { email, password } = (await request.json()) as LoginRequest

    const usuario = obtenerDb().usuarios.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
    )

    if (!usuario || password !== PASSWORD_DEMO) {
      return HttpResponse.json({ mensaje: 'Credenciales inválidas.' }, { status: 401 })
    }

    return HttpResponse.json({ usuario, token: `demo-${usuario.id}` })
  }),

  http.get('/api/usuarios', async () => {
    await latencia(80, 160)
    return HttpResponse.json(obtenerDb().usuarios)
  }),

  /* ------------------------------------------------------------ clientes */

  http.get('/api/clientes', async ({ request }) => {
    await latencia()
    const url = new URL(request.url)
    const q = url.searchParams.get('q') ?? ''
    const pagina = Number(url.searchParams.get('pagina') ?? '1')
    const porPagina = Number(url.searchParams.get('porPagina') ?? '10')

    let resultado = [...obtenerDb().clientes]
    if (q.trim()) {
      resultado = resultado.filter(
        (c) => coincide(c.razonSocial, q) || coincide(c.rut, q) || coincide(c.comuna, q),
      )
    }
    resultado.sort((a, b) => a.razonSocial.localeCompare(b.razonSocial, 'es'))

    return HttpResponse.json(paginar(resultado, pagina, porPagina))
  }),

  http.get('/api/clientes/:id', async ({ params }) => {
    await latencia()
    const cliente = buscarCliente(String(params.id))
    if (!cliente) return HttpResponse.json({ mensaje: 'Cliente no encontrado.' }, { status: 404 })

    const db = obtenerDb()
    const equipos = db.equipos.filter((e) => e.clienteId === cliente.id)
    const ordenes = db.ordenes
      .filter((o) => o.clienteId === cliente.id)
      .sort((a, b) => new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime())
      .map(aDetalle)

    return HttpResponse.json({ cliente, equipos, ordenes })
  }),

  http.post('/api/clientes', async ({ request }) => {
    await latencia(320, 600)
    const fallo = quizasFallar()
    if (fallo) return fallo

    const cuerpo = (await request.json()) as Omit<Cliente, 'id' | 'creadoEn'>

    if (!validarRut(cuerpo.rut)) {
      return HttpResponse.json({ mensaje: 'El RUT no es válido.', campo: 'rut' }, { status: 422 })
    }

    const db = obtenerDb()
    // Unicidad de RUT: la validación de negocio vive en el servidor, no solo en el formulario.
    if (db.clientes.some((c) => c.rut === cuerpo.rut)) {
      return HttpResponse.json(
        { mensaje: 'Ya existe un cliente con ese RUT.', campo: 'rut' },
        { status: 409 },
      )
    }

    const cliente: Cliente = {
      ...cuerpo,
      id: `cli-${db.clientes.length + 1}-${Date.now().toString(36)}`,
      creadoEn: new Date().toISOString(),
    }

    db.clientes.push(cliente)
    persistir()

    return HttpResponse.json(cliente, { status: 201 })
  }),

  http.patch('/api/clientes/:id', async ({ params, request }) => {
    await latencia(320, 600)
    const fallo = quizasFallar()
    if (fallo) return fallo

    const cliente = buscarCliente(String(params.id))
    if (!cliente) return HttpResponse.json({ mensaje: 'Cliente no encontrado.' }, { status: 404 })

    const cambios = (await request.json()) as Partial<Cliente>
    if (cambios.rut && !validarRut(cambios.rut)) {
      return HttpResponse.json({ mensaje: 'El RUT no es válido.', campo: 'rut' }, { status: 422 })
    }

    Object.assign(cliente, cambios)
    persistir()

    return HttpResponse.json(cliente)
  }),

  /* -------------------------------------------------------------- ordenes */

  http.get('/api/ordenes', async ({ request }) => {
    await latencia()
    const url = new URL(request.url)
    const filtro: FiltroOrdenes = {
      q: url.searchParams.get('q') ?? '',
      estado: (url.searchParams.get('estado') as FiltroOrdenes['estado']) ?? 'todas',
      prioridad: (url.searchParams.get('prioridad') as FiltroOrdenes['prioridad']) ?? 'todas',
      tecnicoId: url.searchParams.get('tecnicoId') ?? undefined,
      soloAtrasadas: url.searchParams.get('soloAtrasadas') === '1',
      pagina: Number(url.searchParams.get('pagina') ?? '1'),
      porPagina: Number(url.searchParams.get('porPagina') ?? '12'),
      orden: (url.searchParams.get('orden') as FiltroOrdenes['orden']) ?? 'recientes',
    }

    let resultado = obtenerDb().ordenes.map(aDetalle)

    if (filtro.estado && filtro.estado !== 'todas') {
      resultado = resultado.filter((o) => o.estado === filtro.estado)
    }
    if (filtro.prioridad && filtro.prioridad !== 'todas') {
      resultado = resultado.filter((o) => o.prioridad === filtro.prioridad)
    }
    if (filtro.tecnicoId) {
      resultado = resultado.filter((o) => o.tecnicoId === filtro.tecnicoId)
    }
    if (filtro.soloAtrasadas) {
      resultado = resultado.filter(estaAtrasada)
    }
    if (filtro.q?.trim()) {
      const q = filtro.q
      resultado = resultado.filter(
        (o) =>
          coincide(o.folio, q) ||
          coincide(o.titulo, q) ||
          coincide(o.cliente.razonSocial, q) ||
          coincide(o.equipo.nombre, q),
      )
    }

    const comparadores = {
      recientes: (a: OrdenTrabajoDetalle, b: OrdenTrabajoDetalle) =>
        new Date(b.creadaEn).getTime() - new Date(a.creadaEn).getTime(),
      compromiso: (a: OrdenTrabajoDetalle, b: OrdenTrabajoDetalle) =>
        new Date(a.fechaCompromiso).getTime() - new Date(b.fechaCompromiso).getTime(),
      monto: (a: OrdenTrabajoDetalle, b: OrdenTrabajoDetalle) => b.total - a.total,
    }
    resultado.sort(comparadores[filtro.orden ?? 'recientes'])

    return HttpResponse.json(paginar(resultado, filtro.pagina ?? 1, filtro.porPagina ?? 12))
  }),

  http.get('/api/ordenes/:id', async ({ params }) => {
    await latencia()
    const orden = buscarOrden(String(params.id))
    if (!orden) return HttpResponse.json({ mensaje: 'Orden no encontrada.' }, { status: 404 })
    return HttpResponse.json(aDetalle(orden))
  }),

  http.post('/api/ordenes', async ({ request }) => {
    await latencia(400, 750)
    const fallo = quizasFallar()
    if (fallo) return fallo

    const cuerpo = (await request.json()) as NuevaOrdenRequest
    const db = obtenerDb()

    const cliente = buscarCliente(cuerpo.clienteId)
    const equipo = buscarEquipo(cuerpo.equipoId)
    if (!cliente || !equipo) {
      return HttpResponse.json({ mensaje: 'Cliente o equipo inexistente.' }, { status: 422 })
    }
    if (equipo.clienteId !== cliente.id) {
      return HttpResponse.json(
        { mensaje: 'El equipo no pertenece al cliente indicado.', campo: 'equipoId' },
        { status: 422 },
      )
    }

    const ahora = new Date().toISOString()
    const usuarioId = request.headers.get('x-usuario-id')
    const autor = buscarUsuario(usuarioId) ?? db.usuarios[0]

    const orden: OrdenTrabajo = {
      id: `ot-${Date.now().toString(36)}`,
      folio: siguienteFolio(),
      clienteId: cliente.id,
      equipoId: equipo.id,
      tecnicoId: null,
      estado: 'recepcionada',
      prioridad: cuerpo.prioridad,
      titulo: cuerpo.titulo,
      descripcionFalla: cuerpo.descripcionFalla,
      items: [],
      fechaCompromiso: cuerpo.fechaCompromiso,
      creadaEn: ahora,
      cerradaEn: null,
      eventos: [
        {
          id: 'ev-1',
          fecha: ahora,
          autorNombre: autor?.nombre ?? 'Sistema',
          autorRol: autor?.rol ?? ROLES.recepcion,
          desde: null,
          hasta: 'recepcionada',
          nota: 'Equipo recepcionado en taller. Se levanta la orden de trabajo.',
        },
      ],
    }

    db.ordenes.push(orden)
    persistir()

    return HttpResponse.json(aDetalle(orden), { status: 201 })
  }),

  http.post('/api/ordenes/:id/transicion', async ({ params, request }) => {
    await latencia(350, 650)
    const fallo = quizasFallar()
    if (fallo) return fallo

    const orden = buscarOrden(String(params.id))
    if (!orden) return HttpResponse.json({ mensaje: 'Orden no encontrada.' }, { status: 404 })

    const { hasta, nota } = (await request.json()) as TransicionRequest
    const usuarioId = request.headers.get('x-usuario-id')
    const autor = buscarUsuario(usuarioId)

    if (!autor) {
      return HttpResponse.json({ mensaje: 'Sesión no válida.' }, { status: 401 })
    }

    // La autorización se verifica en el servidor, no solo ocultando botones.
    if (!puedeTransicionar(orden.estado, hasta, autor.rol)) {
      return HttpResponse.json(
        {
          mensaje: `Tu rol no permite pasar la orden de "${OT_ESTADO_LABEL[orden.estado]}" a "${OT_ESTADO_LABEL[hasta]}".`,
        },
        { status: 403 },
      )
    }

    const evento: OtEvento = {
      id: `ev-${orden.eventos.length + 1}`,
      fecha: new Date().toISOString(),
      autorNombre: autor.nombre,
      autorRol: autor.rol,
      desde: orden.estado,
      hasta,
      nota: nota.trim(),
    }

    orden.estado = hasta
    orden.eventos.push(evento)
    orden.cerradaEn = hasta === 'cerrada' ? evento.fecha : null

    persistir()
    return HttpResponse.json(aDetalle(orden))
  }),

  http.patch('/api/ordenes/:id', async ({ params, request }) => {
    await latencia(300, 550)
    const fallo = quizasFallar()
    if (fallo) return fallo

    const orden = buscarOrden(String(params.id))
    if (!orden) return HttpResponse.json({ mensaje: 'Orden no encontrada.' }, { status: 404 })

    const cambios = (await request.json()) as Partial<Pick<OrdenTrabajo, 'tecnicoId' | 'items' | 'prioridad' | 'fechaCompromiso'>>

    if (cambios.tecnicoId !== undefined) {
      const tecnico = buscarUsuario(cambios.tecnicoId)
      if (cambios.tecnicoId !== null && (!tecnico || tecnico.rol !== ROLES.tecnico)) {
        return HttpResponse.json(
          { mensaje: 'El usuario indicado no es un técnico.', campo: 'tecnicoId' },
          { status: 422 },
        )
      }
      orden.tecnicoId = cambios.tecnicoId
    }
    if (cambios.items) orden.items = cambios.items
    if (cambios.prioridad) orden.prioridad = cambios.prioridad
    if (cambios.fechaCompromiso) orden.fechaCompromiso = cambios.fechaCompromiso

    persistir()
    return HttpResponse.json(aDetalle(orden))
  }),

  /* ----------------------------------------------------------------- kpis */

  http.get('/api/kpis', async () => {
    await latencia(240, 520)
    return HttpResponse.json(calcularKpis())
  }),

  /* ----------------------------------------------------------------- demo */

  http.post('/api/demo/reset', async () => {
    await latencia(500, 800)
    reiniciarDb()
    return HttpResponse.json({ ok: true })
  }),
]

/** Reexportado para los tests: permite afirmar sobre el cálculo sin levantar el worker. */
export { calcularKpis }
export type { OtEstado }
