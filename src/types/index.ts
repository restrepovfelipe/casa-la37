export type Rol = 'admin' | 'inquilino'

export type Profile = {
  id: string
  rol: Rol
  nombre: string | null
  created_at: string
}

export type Propietario = {
  id: string
  nombre: string
  porcentaje_real: number | null
  banco: string | null
  tipo_cuenta: string | null
  numero_cuenta: string | null
  nequi: string | null
  created_at: string
}

export type Local = {
  id: string
  numero: string
  nombre: string | null
  propietario_id: string | null
  arriendo_actual: number
  fecha_inicio_contrato: string | null
  puntos_incremento_ipc: number
  activo: boolean
  created_at: string
  propietarios?: Propietario
}

export type Inquilino = {
  id: string
  user_id: string | null
  local_id: string | null
  nombre: string
  email: string
  telefono: string | null
  activo: boolean
  created_at: string
  locales?: Local
}

export type Periodo = {
  id: string
  mes: number
  anio: number
  estado: 'borrador' | 'facturado' | 'cerrado'
  telesentinel: number
  empleada: number
  fecha_limite_pago: string | null
  created_at: string
}

export type Lectura = {
  id: string
  local_id: string
  periodo_id: string
  agua_anterior: number
  agua_actual: number
  agua_precio_unitario: number
  agua_total: number
  luz_anterior: number
  luz_actual: number
  luz_precio_unitario: number
  luz_total: number
  gas_anterior: number
  gas_actual: number
  gas_precio_unitario: number
  gas_total: number
  created_at: string
  locales?: Local
}

export type Factura = {
  id: string
  local_id: string
  periodo_id: string
  arriendo: number
  agua_total: number
  luz_total: number
  gas_total: number
  alarma_total: number
  empleada_total: number
  total_servicios: number
  total: number
  estado_servicios: 'pendiente' | 'pagado'
  estado_arriendo: 'pendiente' | 'pagado'
  fecha_pago_servicios: string | null
  fecha_pago_arriendo: string | null
  bold_link_servicios: string | null
  observaciones: string | null
  created_at: string
  locales?: Local
  periodos?: Periodo
}

export const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]
