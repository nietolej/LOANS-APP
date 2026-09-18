export type ModoPago = 'unico' | 'mensual' | 'quincenal' | 'semanal'

export type EstadoPrestamo = 'activo' | 'pagado' | 'vencido' | 'cancelado'

export interface Prestamo {
  id: string
  persona: string
  monto: number
  fechaInicio: string // ISO date
  // Solo aplica (y es obligatoria) cuando modoPago es 'unico'. Los préstamos
  // recurrentes (mensual/quincenal/semanal) son abiertos: no tienen fecha de
  // cierre fija, el vencimiento se recalcula cada periodo hasta saldar el capital.
  fechaFin?: string // ISO date
  // Si modoPago === 'unico': % total sobre el monto durante todo el plazo.
  // Si modoPago !== 'unico': % de interés por periodo sobre el capital pendiente.
  tasaInteres: number
  modoPago: ModoPago
  comisionAdmin: number // % del interés que corresponde al administrador
  estado: EstadoPrestamo
  notas?: string
  creadoEn: string
}

export type TipoPago = 'capital' | 'interes'

export interface Pago {
  id: string
  prestamoId: string
  fecha: string // ISO date
  monto: number
  tipo: TipoPago
  notas?: string
}

export type Beneficiario = 'admin' | 'inversor'

// Registro de dinero REALMENTE entregado al administrador o al inversor, separado del
// cálculo teórico de "lo que le corresponde" (gananciaAdmin/gananciaPropietario en
// calculations.ts). Es un ledger global del portafolio, no atado a un préstamo
// específico: en la práctica el admin/inversor se liquida con montos acumulados de
// varios préstamos a la vez, no préstamo por préstamo.
export interface Liquidacion {
  id: string
  beneficiario: Beneficiario
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
  liquidaciones: Liquidacion[]
  configuracion: Configuracion
}
