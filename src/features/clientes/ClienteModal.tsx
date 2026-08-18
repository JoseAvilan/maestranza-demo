import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { toast } from '@/components/ui/toast'
import { useActualizarCliente, useCrearCliente } from '@/api/queries'
import { ErrorApi } from '@/api/client'
import { formatearRut, validarRut } from '@/lib/rut'
import { COMUNAS, GIROS } from '@/mocks/catalogos'
import type { Cliente } from '@/domain/types'

const esquema = z.object({
  razonSocial: z.string().trim().min(3, 'Indica la razón social.').max(80, 'Máximo 80 caracteres.'),
  // La misma regla de negocio corre también en el servidor: aquí solo adelanta el aviso.
  rut: z.string().trim().refine(validarRut, 'RUT inválido: revisa el dígito verificador.'),
  giro: z.string().trim().min(3, 'Indica el giro.'),
  contactoNombre: z.string().trim().min(3, 'Indica el nombre del contacto.'),
  contactoEmail: z.email('Correo inválido.'),
  contactoTelefono: z.string().trim().min(8, 'Indica un teléfono de contacto.'),
  direccion: z.string().trim().min(5, 'Indica la dirección.'),
  comuna: z.string().trim().min(2, 'Selecciona la comuna.'),
})

type Formulario = z.infer<typeof esquema>

const VACIO: Formulario = {
  razonSocial: '',
  rut: '',
  giro: '',
  contactoNombre: '',
  contactoEmail: '',
  contactoTelefono: '',
  direccion: '',
  comuna: '',
}

interface Props {
  abierto: boolean
  onCerrar: () => void
  /** Si viene, el formulario edita en lugar de crear. */
  cliente?: Cliente
}

export function ClienteModal({ abierto, onCerrar, cliente }: Props) {
  const crear = useCrearCliente()
  const actualizar = useActualizarCliente(cliente?.id ?? '')
  const editando = Boolean(cliente)

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    formState: { errors },
  } = useForm<Formulario>({ resolver: zodResolver(esquema), defaultValues: VACIO })

  useEffect(() => {
    if (!abierto) return
    reset(cliente ? { ...cliente } : VACIO)
  }, [abierto, cliente, reset])

  function enviar(datos: Formulario) {
    const payload = { ...datos, rut: formatearRut(datos.rut) }

    const alError = (error: unknown) => {
      if (error instanceof ErrorApi && error.campo) {
        setError(error.campo as keyof Formulario, { message: error.message })
      } else {
        toast.error(error instanceof Error ? error.message : 'No se pudo guardar el cliente.')
      }
    }

    if (cliente) {
      actualizar.mutate(payload, {
        onSuccess: () => {
          toast.exito('Cliente actualizado.')
          onCerrar()
        },
        onError: alError,
      })
    } else {
      crear.mutate(payload, {
        onSuccess: (nuevo) => {
          toast.exito(`${nuevo.razonSocial} quedó registrado.`)
          onCerrar()
        },
        onError: alError,
      })
    }
  }

  const guardando = crear.isPending || actualizar.isPending

  return (
    <Modal
      abierto={abierto}
      onCerrar={onCerrar}
      titulo={editando ? 'Editar cliente' : 'Nuevo cliente'}
      descripcion={
        editando ? 'Actualiza los datos de la empresa.' : 'Registra una empresa para poder emitir órdenes.'
      }
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button form="form-cliente" type="submit" cargando={guardando}>
            {editando ? 'Guardar cambios' : 'Crear cliente'}
          </Button>
        </>
      }
    >
      <form id="form-cliente" onSubmit={handleSubmit(enviar)} className="space-y-4" noValidate>
        <Field etiqueta="Razón social" requerido error={errors.razonSocial?.message}>
          {(id) => (
            <Input
              id={id}
              placeholder="Ej.: Metalúrgica Talcahuano SpA"
              invalido={Boolean(errors.razonSocial)}
              {...register('razonSocial')}
            />
          )}
        </Field>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            etiqueta="RUT"
            requerido
            error={errors.rut?.message}
            ayuda="Se valida el dígito verificador."
          >
            {(id) => (
              <Input
                id={id}
                placeholder="76.543.210-K"
                invalido={Boolean(errors.rut)}
                {...register('rut')}
                // Se formatea al salir del campo, no mientras se escribe.
                onBlur={(e) => {
                  const valor = e.target.value.trim()
                  if (valor) setValue('rut', formatearRut(valor), { shouldValidate: true })
                }}
              />
            )}
          </Field>

          <Field etiqueta="Giro" requerido error={errors.giro?.message}>
            {(id) => (
              <Select id={id} invalido={Boolean(errors.giro)} {...register('giro')}>
                <option value="">Selecciona un giro…</option>
                {GIROS.map((giro) => (
                  <option key={giro} value={giro}>
                    {giro}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field etiqueta="Dirección" requerido error={errors.direccion?.message}>
            {(id) => (
              <Input
                id={id}
                placeholder="Av. Jorge Alessandri 1240"
                invalido={Boolean(errors.direccion)}
                {...register('direccion')}
              />
            )}
          </Field>

          <Field etiqueta="Comuna" requerido error={errors.comuna?.message}>
            {(id) => (
              <Select id={id} invalido={Boolean(errors.comuna)} {...register('comuna')}>
                <option value="">Selecciona una comuna…</option>
                {COMUNAS.map((comuna) => (
                  <option key={comuna} value={comuna}>
                    {comuna}
                  </option>
                ))}
              </Select>
            )}
          </Field>
        </div>

        <fieldset className="space-y-4 rounded-lg border border-slate-200 p-4">
          <legend className="px-1 text-sm font-medium text-slate-700">Contacto</legend>

          <Field etiqueta="Nombre" requerido error={errors.contactoNombre?.message}>
            {(id) => (
              <Input
                id={id}
                invalido={Boolean(errors.contactoNombre)}
                {...register('contactoNombre')}
              />
            )}
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field etiqueta="Correo" requerido error={errors.contactoEmail?.message}>
              {(id) => (
                <Input
                  id={id}
                  type="email"
                  invalido={Boolean(errors.contactoEmail)}
                  {...register('contactoEmail')}
                />
              )}
            </Field>

            <Field etiqueta="Teléfono" requerido error={errors.contactoTelefono?.message}>
              {(id) => (
                <Input
                  id={id}
                  placeholder="+56 9 1234 5678"
                  invalido={Boolean(errors.contactoTelefono)}
                  {...register('contactoTelefono')}
                />
              )}
            </Field>
          </div>
        </fieldset>
      </form>
    </Modal>
  )
}
