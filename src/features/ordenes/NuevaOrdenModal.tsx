import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { toast } from '@/components/ui/toast'
import { useCliente, useClientesTodos, useCrearOrden } from '@/api/queries'
import { ErrorApi } from '@/api/client'
import { OT_PRIORIDADES, OT_PRIORIDAD_LABEL } from '@/domain/types'

/** Fecha de hoy en formato `yyyy-mm-dd`, para el mínimo del input date. */
function hoyISO(): string {
  const ahora = new Date()
  const offset = ahora.getTimezoneOffset() * 60_000
  return new Date(ahora.getTime() - offset).toISOString().slice(0, 10)
}

function enDias(dias: number): string {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  const offset = fecha.getTimezoneOffset() * 60_000
  return new Date(fecha.getTime() - offset).toISOString().slice(0, 10)
}

const esquema = z.object({
  clienteId: z.string().min(1, 'Selecciona un cliente.'),
  equipoId: z.string().min(1, 'Selecciona el equipo que ingresa.'),
  titulo: z
    .string()
    .trim()
    .min(8, 'Describe la falla en al menos 8 caracteres.')
    .max(90, 'Máximo 90 caracteres.'),
  descripcionFalla: z
    .string()
    .trim()
    .min(20, 'Detalla lo que reporta el cliente: al menos 20 caracteres.'),
  prioridad: z.enum(OT_PRIORIDADES),
  fechaCompromiso: z
    .string()
    .min(1, 'Indica la fecha comprometida.')
    .refine((valor) => valor >= hoyISO(), 'La fecha comprometida no puede estar en el pasado.'),
})

type Formulario = z.infer<typeof esquema>

interface Props {
  abierto: boolean
  onCerrar: () => void
}

export function NuevaOrdenModal({ abierto, onCerrar }: Props) {
  const navegar = useNavigate()
  const crear = useCrearOrden()
  const { data: clientes } = useClientesTodos()

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    setError,
    formState: { errors },
  } = useForm<Formulario>({
    resolver: zodResolver(esquema),
    defaultValues: {
      clienteId: '',
      equipoId: '',
      titulo: '',
      descripcionFalla: '',
      prioridad: 'normal',
      fechaCompromiso: enDias(14),
    },
  })

  const clienteId = watch('clienteId')
  const { data: detalleCliente, isFetching: cargandoEquipos } = useCliente(clienteId || undefined)

  // Cambiar de cliente invalida el equipo elegido: pertenecen a distintos dueños.
  useEffect(() => {
    setValue('equipoId', '')
  }, [clienteId, setValue])

  useEffect(() => {
    if (!abierto) reset()
  }, [abierto, reset])

  function enviar(datos: Formulario) {
    crear.mutate(
      { ...datos, fechaCompromiso: new Date(`${datos.fechaCompromiso}T12:00:00`).toISOString() },
      {
        onSuccess: (orden) => {
          toast.exito(`Orden ${orden.folio} creada.`)
          onCerrar()
          navegar(`/ordenes/${orden.id}`)
        },
        onError: (error) => {
          if (error instanceof ErrorApi && error.campo) {
            setError(error.campo as keyof Formulario, { message: error.message })
          } else {
            toast.error(error instanceof Error ? error.message : 'No se pudo crear la orden.')
          }
        },
      },
    )
  }

  const equipos = detalleCliente?.equipos ?? []

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo="Nueva orden de trabajo"
      descripcion="Registra el ingreso de un equipo al taller."
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button form="form-nueva-orden" type="submit" cargando={crear.isPending}>
            Crear orden
          </Button>
        </>
      }
    >
      <form id="form-nueva-orden" onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
        <Field etiqueta="Cliente" requerido error={errors.clienteId?.message}>
          {(id) => (
            <Select id={id} invalido={Boolean(errors.clienteId)} {...register('clienteId')}>
              <option value="">Selecciona un cliente…</option>
              {clientes?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.razonSocial} — {c.rut}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field
          etiqueta="Equipo"
          requerido
          error={errors.equipoId?.message}
          ayuda={
            !clienteId
              ? 'Elige primero el cliente para ver sus equipos registrados.'
              : equipos.length === 0 && !cargandoEquipos
                ? 'Este cliente no tiene equipos registrados.'
                : undefined
          }
        >
          {(id) => (
            <Select
              id={id}
              disabled={!clienteId || cargandoEquipos}
              invalido={Boolean(errors.equipoId)}
              {...register('equipoId')}
            >
              <option value="">
                {cargandoEquipos ? 'Cargando equipos…' : 'Selecciona un equipo…'}
              </option>
              {equipos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nombre} {e.marca} {e.modelo} — S/N {e.numeroSerie}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field etiqueta="Falla reportada" requerido error={errors.titulo?.message}>
          {(id) => (
            <Input
              id={id}
              placeholder="Ej.: Vibración excesiva y ruido en rodamientos"
              invalido={Boolean(errors.titulo)}
              {...register('titulo')}
            />
          )}
        </Field>

        <Field etiqueta="Detalle del reporte" requerido error={errors.descripcionFalla?.message}>
          {(id) => (
            <Textarea
              id={id}
              rows={4}
              placeholder="Qué observó el operador, desde cuándo, en qué condiciones se detiene el equipo…"
              invalido={Boolean(errors.descripcionFalla)}
              {...register('descripcionFalla')}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field etiqueta="Prioridad" error={errors.prioridad?.message}>
            {(id) => (
              <Select id={id} {...register('prioridad')}>
                {OT_PRIORIDADES.map((p) => (
                  <option key={p} value={p}>
                    {OT_PRIORIDAD_LABEL[p]}
                  </option>
                ))}
              </Select>
            )}
          </Field>

          <Field etiqueta="Fecha comprometida" requerido error={errors.fechaCompromiso?.message}>
            {(id) => (
              <Input
                id={id}
                type="date"
                min={hoyISO()}
                invalido={Boolean(errors.fechaCompromiso)}
                {...register('fechaCompromiso')}
              />
            )}
          </Field>
        </div>
      </form>
    </Modal>
  )
}
