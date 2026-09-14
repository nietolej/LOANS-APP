import type { Pago, Prestamo } from '../types'
import { generarCronograma, hoyISO } from './cronograma'

export interface ResumenPrestamo {
  abierto: boolean
  interesTotal: number // interés generado hasta hoy (abierto) o total del plazo (cerrado)
  montoTotal: number // capital + interés (informativo)
  gananciaAdmin: number
  gananciaPropietario: number
  capitalPagado: number
  interesPagado: number
  capitalPendiente: number
  interesPendiente: number // interés ya vencido (o del plazo) que aún no se ha pagado
  totalPagado: number
  saldoPendiente: number
  diasRestantes: number // días hasta el (próximo) vencimiento; negativo si ya venció
  vencido: boolean
  proximoVencimiento?: string // solo préstamos abiertos: cuota impaga más antigua (vencida o no)
  // Préstamos abiertos: desglose de lo ya vencido (sin pagar) vs. la próxima cuota por vencer.
  montoVencido?: number
  fechaVencido?: string
  montoProximo?: number
  fechaProximo?: string
}

function sumaPagos(pagosPrestamo: Pago[], tipo: Pago['tipo']): number {
  return pagosPrestamo.filter((p) => p.tipo === tipo).reduce((sum, p) => sum + p.monto, 0)
}

function calcularResumenCerrado(prestamo: Prestamo, pagosPrestamo: Pago[]): ResumenPrestamo {
  const interesTotal = prestamo.monto * (prestamo.tasaInteres / 100)
  const montoTotal = prestamo.monto + interesTotal
  const gananciaAdmin = interesTotal * (prestamo.comisionAdmin / 100)
  const gananciaPropietario = interesTotal - gananciaAdmin

  const capitalPagado = sumaPagos(pagosPrestamo, 'capital')
  const interesPagado = sumaPagos(pagosPrestamo, 'interes')
  const totalPagado = capitalPagado + interesPagado

  const capitalPendiente = Math.max(0, prestamo.monto - capitalPagado)
  const interesPendiente = Math.max(0, interesTotal - interesPagado)
  const saldoPendiente = Math.max(0, montoTotal - totalPagado)

  const hoy = new Date()
  const fin = new Date(prestamo.fechaFin ?? prestamo.fechaInicio)
  const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  const vencido = diasRestantes < 0 && saldoPendiente > 0

  return {
    abierto: false,
    interesTotal,
    montoTotal,
    gananciaAdmin,
    gananciaPropietario,
    capitalPagado,
    interesPagado,
    capitalPendiente,
    interesPendiente,
    totalPagado,
    saldoPendiente,
    diasRestantes,
    vencido,
  }
}

function calcularResumenAbierto(prestamo: Prestamo, pagos: Pago[], pagosPrestamo: Pago[]): ResumenPrestamo {
  const cuotas = generarCronograma(prestamo, pagos)
  const hoy = hoyISO()

  const capitalPagado = sumaPagos(pagosPrestamo, 'capital')
  const interesPagado = sumaPagos(pagosPrestamo, 'interes')
  const capitalPendiente = Math.max(0, prestamo.monto - capitalPagado)

  const interesTotal = cuotas.reduce((sum, c) => sum + c.interesEsperado, 0)
  const interesPendiente = Math.max(0, interesTotal - interesPagado)

  const totalPagado = capitalPagado + interesPagado
  const saldoPendiente = capitalPendiente + interesPendiente
  const montoTotal = prestamo.monto + interesTotal

  const gananciaAdmin = interesTotal * (prestamo.comisionAdmin / 100)
  const gananciaPropietario = interesTotal - gananciaAdmin

  // Cuota impaga más antigua: puede estar vencida (ya pasó su fecha) o ser la próxima por venir.
  const cuotaPendiente = cuotas.find((c) => c.estado !== 'pagada')
  const vencido = capitalPendiente > 0 && cuotaPendiente?.estado === 'vencida'

  const proximoVencimiento = capitalPendiente > 0 ? cuotaPendiente?.fechaVencimiento : undefined
  const diasRestantes = proximoVencimiento
    ? Math.ceil((new Date(proximoVencimiento).getTime() - new Date(hoy).getTime()) / (1000 * 60 * 60 * 24))
    : 0

  // Desglose: cuotas ya vencidas sin pagar (suma) vs. la próxima cuota que aún no vence.
  let montoVencido: number | undefined
  let fechaVencido: string | undefined
  let montoProximo: number | undefined
  let fechaProximo: string | undefined

  if (capitalPendiente > 0) {
    const cuotasVencidas = cuotas.filter((c) => c.estado === 'vencida')
    if (cuotasVencidas.length > 0) {
      montoVencido = cuotasVencidas.reduce((sum, c) => sum + (c.interesEsperado - c.interesPagado), 0)
      fechaVencido = cuotasVencidas[0].fechaVencimiento
    }
    const cuotaFutura = cuotas.find((c) => c.fechaVencimiento > hoy)
    if (cuotaFutura) {
      montoProximo = cuotaFutura.interesEsperado - cuotaFutura.interesPagado
      fechaProximo = cuotaFutura.fechaVencimiento
    }
  }

  return {
    abierto: true,
    interesTotal,
    montoTotal,
    gananciaAdmin,
    gananciaPropietario,
    capitalPagado,
    interesPagado,
    capitalPendiente,
    interesPendiente,
    totalPagado,
    saldoPendiente,
    diasRestantes,
    vencido,
    proximoVencimiento,
    montoVencido,
    fechaVencido,
    montoProximo,
    fechaProximo,
  }
}

export function calcularResumen(prestamo: Prestamo, pagos: Pago[]): ResumenPrestamo {
  const pagosPrestamo = pagos.filter((p) => p.prestamoId === prestamo.id)
  if (prestamo.modoPago === 'unico') {
    return calcularResumenCerrado(prestamo, pagosPrestamo)
  }
  return calcularResumenAbierto(prestamo, pagos, pagosPrestamo)
}

export function formatoMoneda(valor: number): string {
  return (
    '$' +
    valor.toLocaleString('es-CO', {
      maximumFractionDigits: 2,
    })
  )
}

export function formatoFecha(iso: string): string {
  if (!iso) return ''
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y}`
}
