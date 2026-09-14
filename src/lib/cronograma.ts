import type { ModoPago, Pago, Prestamo } from '../types'

export type EstadoCuota = 'pagada' | 'parcial' | 'pendiente' | 'vencida'

export interface Cuota {
  numero: number
  fechaInicio: string // ISO date
  fechaVencimiento: string // ISO date
  capitalBase: number // capital pendiente al iniciar el periodo
  interesEsperado: number
  interesPagado: number
  estado: EstadoCuota
}

export function hoyISO(): string {
  return new Date().toISOString().slice(0, 10)
}

function sumarPeriodo(fechaISO: string, modoPago: ModoPago): string {
  const d = new Date(fechaISO + 'T00:00:00')
  if (modoPago === 'mensual') d.setMonth(d.getMonth() + 1)
  else if (modoPago === 'quincenal') d.setDate(d.getDate() + 15)
  else d.setDate(d.getDate() + 7) // semanal
  return d.toISOString().slice(0, 10)
}

/**
 * Genera el cronograma de cuotas de interés de un préstamo abierto (recurrente).
 * El capital pendiente se recalcula con los abonos a capital registrados hasta
 * el inicio de cada periodo, y el interés esperado de cada cuota se calcula
 * sobre ese capital. Los pagos de interés se asignan a las cuotas en orden
 * cronológico (waterfall). Se generan cuotas desde fechaInicio hasta hoy, más
 * una cuota adicional (la próxima por vencer) si aún queda capital pendiente.
 */
export function generarCronograma(prestamo: Prestamo, pagos: Pago[]): Cuota[] {
  if (prestamo.modoPago === 'unico') return []

  const pagosPrestamo = pagos.filter((p) => p.prestamoId === prestamo.id)
  const abonosCapital = pagosPrestamo
    .filter((p) => p.tipo === 'capital')
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))

  let interesPagadoDisponible = pagosPrestamo
    .filter((p) => p.tipo === 'interes')
    .reduce((sum, p) => sum + p.monto, 0)

  function capitalPendienteHasta(fechaISO: string): number {
    const abonado = abonosCapital
      .filter((a) => a.fecha <= fechaISO)
      .reduce((sum, a) => sum + a.monto, 0)
    return Math.max(0, prestamo.monto - abonado)
  }

  const hoy = hoyISO()
  const cuotas: Cuota[] = []
  let fechaInicioPeriodo = prestamo.fechaInicio
  let numero = 1

  while (numero <= 1000) {
    const capitalBase = capitalPendienteHasta(fechaInicioPeriodo)
    if (capitalBase <= 0) break

    const fechaVencimiento = sumarPeriodo(fechaInicioPeriodo, prestamo.modoPago)
    const interesEsperado = capitalBase * (prestamo.tasaInteres / 100)
    const interesPagado = Math.min(interesEsperado, interesPagadoDisponible)
    interesPagadoDisponible -= interesPagado

    let estado: EstadoCuota
    if (interesEsperado <= 0 || interesPagado >= interesEsperado - 0.005) estado = 'pagada'
    else if (fechaVencimiento < hoy) estado = 'vencida'
    else if (interesPagado > 0) estado = 'parcial'
    else estado = 'pendiente'

    cuotas.push({
      numero,
      fechaInicio: fechaInicioPeriodo,
      fechaVencimiento,
      capitalBase,
      interesEsperado,
      interesPagado,
      estado,
    })

    fechaInicioPeriodo = fechaVencimiento
    numero++

    if (fechaVencimiento > hoy) break
  }

  return cuotas
}
