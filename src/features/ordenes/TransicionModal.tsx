import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Modal'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Field'
import { toast } from '@/components/ui/toast'
import { useTransicionOrden } from '@/api/queries'
import { OT_ESTADO_LABEL } from '@/domain/types'
import type { Transicion } from '@/domain/workflow'

interface Props {
  ordenId: string
  folio: string
  transicion: Transicion | null
  onCerrar: () => void
}

export function TransicionModal({ ordenId, folio, transicion, onCerrar }: Props) {
  const [nota, setNota] = useState('')
  const [tocado, setTocado] = useState(false)
  const mutar = useTransicionOrden(ordenId)

  useEffect(() => {
    if (transicion) {
      setNota('')
      setTocado(false)
    }
  }, [transicion])

  const notaFaltante = Boolean(transicion?.requiereNota) && nota.trim().length < 10

  function confirmar() {
    if (!transicion) return
    setTocado(true)
    if (notaFaltante) return

    mutar.mutate(
      { hasta: transicion.hasta, nota: nota.trim() },
      {
        onSuccess: () => {
          toast.exito(`${folio} pasó a "${OT_ESTADO_LABEL[transicion.hasta]}".`)
          onCerrar()
        },
        onError: (error) =>
          toast.error(error instanceof Error ? error.message : 'No se pudo actualizar la orden.'),
      },
    )
  }

  return (
    <Modal
      abierto={transicion !== null}
      onCerrar={onCerrar}
      titulo={transicion?.accion ?? ''}
      descripcion={
        transicion
          ? `La orden ${folio} pasará de "${OT_ESTADO_LABEL[transicion.desde]}" a "${OT_ESTADO_LABEL[transicion.hasta]}".`
          : undefined
      }
      pie={
        <>
          <Button variante="secundario" onClick={onCerrar}>
            Cancelar
          </Button>
          <Button
            variante={transicion?.intencion === 'destructiva' ? 'peligro' : 'primario'}
            cargando={mutar.isPending}
            onClick={confirmar}
          >
            {transicion?.accion}
          </Button>
        </>
      }
    >
      <Field
        etiqueta="Nota para la bitácora"
        requerido={transicion?.requiereNota}
        error={tocado && notaFaltante ? 'Escribe al menos 10 caracteres explicando el cambio.' : undefined}
        ayuda="Queda registrada con tu nombre, tu rol y la fecha. No se puede editar después."
      >
        {(id) => (
          <Textarea
            id={id}
            rows={4}
            value={nota}
            invalido={tocado && notaFaltante}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Qué se hizo, qué se acordó con el cliente, qué queda pendiente…"
          />
        )}
      </Field>
    </Modal>
  )
}
