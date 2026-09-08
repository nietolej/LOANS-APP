export type ModoPago = 'unico' | 'mensual' | 'quincenal' | 'semanal'

export type EstadoPrestamo = 'activo' | 'pagado' | 'vencido' | 'cancelado'

export interface Prestamo {
  id: string
  persona: string
  monto: number
  fechaInicio: string // ISO date
  fechaFin: string // ISO date
  tasaInteres: number // % total sobre el monto, durante todo el plazo
  modoPago: ModoPago
  comisionAdmin: number // % del interés que corresponde al administrador
  estado: EstadoPrestamo
  notas?: string
  creadoEn: string
}

export interface Pago {
  id: string
  prestamoId: string
  fecha: string // ISO date
  monto: number
  notas?: string
}

export interface Configuracion {
  nombreAdmin: string
  comisionAdminDefault: number
}

export interface AppData {
  prestamos: Prestamo[]
  pagos: Pago[]
  configuracion: Configuracion
}
