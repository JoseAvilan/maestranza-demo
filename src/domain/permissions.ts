import { ROLES, type Role } from './types'

/**
 * Permisos por rol. La UI consulta esta tabla en lugar de comparar roles
 * sueltos, así agregar un rol nuevo es un solo cambio localizado.
 */
export const PERMISOS = {
  verDashboard: 'ver_dashboard',
  verMontos: 'ver_montos',
  gestionarClientes: 'gestionar_clientes',
  crearOt: 'crear_ot',
  editarItemsOt: 'editar_items_ot',
  asignarTecnico: 'asignar_tecnico',
} as const

export type Permiso = (typeof PERMISOS)[keyof typeof PERMISOS]

const MATRIZ: Record<Role, readonly Permiso[]> = {
  [ROLES.jefeTaller]: [
    'ver_dashboard',
    'ver_montos',
    'gestionar_clientes',
    'crear_ot',
    'editar_items_ot',
    'asignar_tecnico',
  ],
  // El técnico ejecuta: ve su carga y avanza el trabajo, no negocia precios.
  [ROLES.tecnico]: [],
  [ROLES.recepcion]: ['ver_dashboard', 'ver_montos', 'gestionar_clientes', 'crear_ot', 'editar_items_ot'],
}

export function tienePermiso(rol: Role, permiso: Permiso): boolean {
  return MATRIZ[rol].includes(permiso)
}
