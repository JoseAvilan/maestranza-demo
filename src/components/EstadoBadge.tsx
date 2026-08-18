import { Badge, type TonoBadge } from './ui/Badge'
import {
  OT_ESTADO_LABEL,
  OT_PRIORIDAD_LABEL,
  type OtEstado,
  type OtPrioridad,
} from '@/domain/types'

const TONO_ESTADO: Record<OtEstado, TonoBadge> = {
  recepcionada: 'neutro',
  cotizada: 'info',
  aprobada: 'marca',
  en_ejecucion: 'alerta',
  cerrada: 'exito',
  anulada: 'peligro',
}

export function EstadoBadge({ estado }: { estado: OtEstado }) {
  return <Badge tono={TONO_ESTADO[estado]}>{OT_ESTADO_LABEL[estado]}</Badge>
}

const TONO_PRIORIDAD: Record<OtPrioridad, TonoBadge> = {
  baja: 'neutro',
  normal: 'neutro',
  alta: 'alerta',
  critica: 'peligro',
}

export function PrioridadBadge({ prioridad }: { prioridad: OtPrioridad }) {
  // Baja y normal no se destacan: solo importa lo que exige atención.
  if (prioridad === 'baja' || prioridad === 'normal') {
    return <span className="text-sm text-slate-500">{OT_PRIORIDAD_LABEL[prioridad]}</span>
  }
  return <Badge tono={TONO_PRIORIDAD[prioridad]}>{OT_PRIORIDAD_LABEL[prioridad]}</Badge>
}
