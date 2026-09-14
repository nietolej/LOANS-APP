import type { AppData, Pago, Prestamo } from '../types'
import { calcularResumen } from './calculations'
import { hoyISO } from './cronograma'

export interface ClienteStats {
  persona: string
  prestamos: Prestamo[]
  capitalPrestado: number
  interesEsperado: number
  totalPagado: number
  capitalPendiente: number
  interesPendiente: number
  saldoPendiente: number
  gananciaAdmin: number
  gananciaPropietario: number
  activos: number
  vencidos: number
  pagados: number
}

export function calcularStatsPorCliente(data: AppData): ClienteStats[] {
  const { prestamos, pagos } = data
  const mapa = new Map<string, ClienteStats>()

  for (const p of prestamos) {
    const r = calcularResumen(p, pagos)
    const key = p.persona.trim().toLowerCase()
    let c = mapa.get(key)
    if (!c) {
      c = {
        persona: p.persona,
        prestamos: [],
        capitalPrestado: 0,
        interesEsperado: 0,
        totalPagado: 0,
        capitalPendiente: 0,
        interesPendiente: 0,
        saldoPendiente: 0,
        gananciaAdmin: 0,
        gananciaPropietario: 0,
        activos: 0,
        vencidos: 0,
        pagados: 0,
      }
      mapa.set(key, c)
    }
    c.prestamos.push(p)
    c.capitalPrestado += p.monto
    c.interesEsperado += r.interesTotal
    c.totalPagado += r.totalPagado
    c.capitalPendiente += r.capitalPendiente
    c.interesPendiente += r.interesPendiente
    c.saldoPendiente += r.saldoPendiente
    c.gananciaAdmin += r.gananciaAdmin
    c.gananciaPropietario += r.gananciaPropietario
    if (r.vencido) c.vencidos++
    else if (r.saldoPendiente <= 0) c.pagados++
    else if (p.estado === 'activo') c.activos++
  }

  return [...mapa.values()].sort((a, b) => b.saldoPendiente - a.saldoPendiente)
}

export interface RentabilidadMes {
  mes: string // YYYY-MM
  interesRecibido: number
  gananciaAdmin: number
  gananciaPropietario: number
}

export function calcularRentabilidadMensual(data: AppData): RentabilidadMes[] {
  const { prestamos, pagos } = data
  const prestamoPorId = new Map(prestamos.map((p) => [p.id, p]))
  const mapa = new Map<string, RentabilidadMes>()

  for (const pago of pagos) {
    if (pago.tipo !== 'interes') continue
    const prestamo = prestamoPorId.get(pago.prestamoId)
    if (!prestamo) continue
    const mes = pago.fecha.slice(0, 7)
    let m = mapa.get(mes)
    if (!m) {
      m = { mes, interesRecibido: 0, gananciaAdmin: 0, gananciaPropietario: 0 }
      mapa.set(mes, m)
    }
    const comisionAdmin = pago.monto * (prestamo.comisionAdmin / 100)
    m.interesRecibido += pago.monto
    m.gananciaAdmin += comisionAdmin
    m.gananciaPropietario += pago.monto - comisionAdmin
  }

  return [...mapa.values()].sort((a, b) => (a.mes < b.mes ? -1 : 1))
}

export interface PuntoCapital {
  fecha: string
  valor: number
}

/**
 * Evolución del capital pendiente de un préstamo: parte del monto prestado y
 * baja en cada abono a capital registrado, hasta el saldo actual.
 */
export function serieCapitalPrestamo(prestamo: Prestamo, pagos: Pago[]): PuntoCapital[] {
  const abonos = pagos
    .filter((p) => p.prestamoId === prestamo.id && p.tipo === 'capital')
    .sort((a, b) => (a.fecha < b.fecha ? -1 : 1))

  const puntos: PuntoCapital[] = [{ fecha: prestamo.fechaInicio, valor: prestamo.monto }]
  let capital = prestamo.monto
  for (const abono of abonos) {
    capital = Math.max(0, capital - abono.monto)
    puntos.push({ fecha: abono.fecha, valor: capital })
  }

  const hoy = hoyISO()
  if (puntos[puntos.length - 1].fecha < hoy) {
    puntos.push({ fecha: hoy, valor: capital })
  }

  return puntos
}

/**
 * Evolución del capital pendiente total de todos los préstamos combinados,
 * muestreada en cada fecha de inicio de préstamo o abono a capital.
 */
export function serieCapitalGlobal(data: AppData): PuntoCapital[] {
  const { prestamos, pagos } = data
  const hoy = hoyISO()

  const fechas = new Set<string>()
  for (const p of prestamos) fechas.add(p.fechaInicio)
  for (const pago of pagos) if (pago.tipo === 'capital') fechas.add(pago.fecha)
  fechas.add(hoy)

  function capitalPendienteDe(prestamo: Prestamo, fecha: string): number {
    if (prestamo.fechaInicio > fecha) return 0
    const abonado = pagos
      .filter((p) => p.prestamoId === prestamo.id && p.tipo === 'capital' && p.fecha <= fecha)
      .reduce((sum, p) => sum + p.monto, 0)
    return Math.max(0, prestamo.monto - abonado)
  }

  return [...fechas].sort().map((fecha) => ({
    fecha,
    valor: prestamos.reduce((sum, p) => sum + capitalPendienteDe(p, fecha), 0),
  }))
}

export function formatoMes(mes: string): string {
  const [y, m] = mes.split('-')
  const nombres = [
    'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
  ]
  const idx = Number(m) - 1
  return `${nombres[idx] ?? m} ${y}`
}
