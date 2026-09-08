import type { Pago, Prestamo } from '../types'

export interface ResumenPrestamo {
  interesTotal: number
  montoTotal: number // capital + interés
  gananciaAdmin: number
  gananciaPropietario: number
  totalPagado: number
  saldoPendiente: number
  diasRestantes: number
  vencido: boolean
}

export function calcularResumen(prestamo: Prestamo, pagos: Pago[]): ResumenPrestamo {
  const interesTotal = prestamo.monto * (prestamo.tasaInteres / 100)
  const montoTotal = prestamo.monto + interesTotal
  const gananciaAdmin = interesTotal * (prestamo.comisionAdmin / 100)
  const gananciaPropietario = interesTotal - gananciaAdmin

  const totalPagado = pagos
    .filter((p) => p.prestamoId === prestamo.id)
    .reduce((sum, p) => sum + p.monto, 0)

  const saldoPendiente = Math.max(0, montoTotal - totalPagado)

  const hoy = new Date()
  const fin = new Date(prestamo.fechaFin)
  const diasRestantes = Math.ceil((fin.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
  const vencido = diasRestantes < 0 && saldoPendiente > 0

  return {
    interesTotal,
    montoTotal,
    gananciaAdmin,
    gananciaPropietario,
    totalPagado,
    saldoPendiente,
    diasRestantes,
    vencido,
  }
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
