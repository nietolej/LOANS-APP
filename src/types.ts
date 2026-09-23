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

export type Beneficiario = 'admin' | 'inversor'

export interface Pago {
  id: string
  prestamoId: string
  fecha: string // ISO date
  monto: number
  tipo: TipoPago
  // A quién le llegó el dinero del cliente. Ausente (pagos antiguos) = 'admin', que es
  // el flujo normal: cliente → administradora → inversor. 'inversor' = el cliente le
  // pagó directo al inversor, así que ese dinero nunca pasó por la caja de la administradora.
  destino?: Beneficiario
  notas?: string
}

// Segundo flujo de dinero: el cliente le paga a la administradora (Pago) y la
// administradora reenvía al inversor. Este ledger registra los movimientos de salida
// de la caja de la administradora; es global del portafolio, no atado a un préstamo
// (se giran montos acumulados de varios préstamos a la vez).
//  - beneficiario 'inversor': giro al inversor. `monto` es el total girado; `capital`
//    es la parte que devuelve capital (el resto es interés). Sin `capital` = solo interés.
//  - beneficiario 'admin': comisión que la administradora se descuenta/retira de la caja.
export interface Liquidacion {
  id: string
  beneficiario: Beneficiario
  fecha: string // ISO date
  monto: number
  capital?: number // solo giros al inversor
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
