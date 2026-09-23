import { useState } from 'react'
import type { AppData } from '../types'
import { formatoFecha, formatoMoneda } from '../lib/calculations'

interface Props {
  data: AppData
}

type Vista = 'admin' | 'inversor'

interface Movimiento {
  fecha: string
  concepto: string
  // Positivo suma al saldo de la vista, negativo lo reduce.
  importe: number
}

/**
 * Estado de cuenta de cada parte, movimiento a movimiento con saldo acumulado.
 *  - 'admin': caja de la administradora (entra lo que le pagan los clientes, sale lo que gira o retira).
 *  - 'inversor': lo que la administradora le debe al inversor (suma lo que le corresponde de cada
 *    cobro; resta lo que ya recibió, ya sea girado por la administradora o pagado directo por el cliente).
 */
function construirMovimientos(data: AppData, vista: Vista): Movimiento[] {
  const { prestamos, pagos, liquidaciones } = data
  const prestamoPorId = new Map(prestamos.map((p) => [p.id, p]))
  const movs: Movimiento[] = []

  for (const pago of pagos) {
    const prestamo = prestamoPorId.get(pago.prestamoId)
    if (!prestamo) continue
    const tipo = pago.tipo === 'capital' ? 'capital' : 'interés'
    const directo = pago.destino === 'inversor'

    if (vista === 'admin') {
      if (directo) continue
      movs.push({ fecha: pago.fecha, concepto: `Cobro de ${tipo} · ${prestamo.persona}`, importe: pago.monto })
    } else {
      const corresponde = pago.tipo === 'capital' ? pago.monto : pago.monto * (1 - prestamo.comisionAdmin / 100)
      movs.push({ fecha: pago.fecha, concepto: `Le corresponde de ${tipo} · ${prestamo.persona}`, importe: corresponde })
      if (directo) {
        movs.push({
          fecha: pago.fecha,
          concepto: `Recibió directo del cliente (${tipo}) · ${prestamo.persona}`,
          importe: -pago.monto,
        })
      }
    }
  }

  for (const l of liquidaciones) {
    if (l.beneficiario === 'inversor') {
      const capital = l.capital ?? 0
      const detalle = capital > 0 ? `interés ${formatoMoneda(l.monto - capital)} + capital ${formatoMoneda(capital)}` : 'solo interés'
      movs.push({ fecha: l.fecha, concepto: `Giro al inversor (${detalle})`, importe: -l.monto })
    } else if (vista === 'admin') {
      movs.push({ fecha: l.fecha, concepto: 'Retiro de comisión de la administradora', importe: -l.monto })
    }
  }

  return movs.sort((a, b) => (a.fecha < b.fecha ? -1 : a.fecha > b.fecha ? 1 : 0))
}

export function Extracto({ data }: Props) {
  const [vista, setVista] = useState<Vista>('admin')

  const movimientos = construirMovimientos(data, vista)
  let saldo = 0
  const filas = movimientos.map((m) => {
    saldo += m.importe
    return { ...m, saldo }
  })

  const titulo = vista === 'admin' ? 'Caja de la administradora' : 'Cuenta del inversor (lo que se le debe)'

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
        <h3 className="font-medium text-gray-800">Extracto de movimientos</h3>
        <div className="inline-flex rounded border border-gray-300 overflow-hidden text-sm">
          {(['admin', 'inversor'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setVista(v)}
              className={`px-3 py-1 ${vista === v ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {v === 'admin' ? 'Administradora' : 'Inversor'}
            </button>
          ))}
        </div>
      </div>
      <p className="text-sm text-gray-500 mb-2">{titulo}, con el saldo acumulado tras cada movimiento.</p>

      {filas.length === 0 ? (
        <p className="text-sm text-gray-500">Sin movimientos todavía.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-gray-200">
                <th className="py-1 pr-3 font-medium">Fecha</th>
                <th className="py-1 pr-3 font-medium">Concepto</th>
                <th className="py-1 pr-3 font-medium text-right">Importe</th>
                <th className="py-1 font-medium text-right">Saldo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filas.map((f, i) => (
                <tr key={i}>
                  <td className="py-1.5 pr-3 whitespace-nowrap">{formatoFecha(f.fecha)}</td>
                  <td className="py-1.5 pr-3">{f.concepto}</td>
                  <td className={`py-1.5 pr-3 text-right whitespace-nowrap ${f.importe < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                    {f.importe < 0 ? '−' : '+'}
                    {formatoMoneda(Math.abs(f.importe))}
                  </td>
                  <td className="py-1.5 text-right font-semibold whitespace-nowrap">{formatoMoneda(f.saldo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
