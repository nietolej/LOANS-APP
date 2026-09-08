import { useState } from 'react'
import type { Pago, Prestamo } from '../types'
import { calcularResumen, formatoFecha, formatoMoneda } from '../lib/calculations'

interface Props {
  prestamos: Prestamo[]
  pagos: Pago[]
  onSeleccionar: (id: string) => void
  onEditar: (id: string) => void
  onEliminar: (id: string) => void
}

const estadoColor: Record<Prestamo['estado'], string> = {
  activo: 'bg-blue-100 text-blue-700',
  pagado: 'bg-emerald-100 text-emerald-700',
  vencido: 'bg-rose-100 text-rose-700',
  cancelado: 'bg-gray-200 text-gray-600',
}

export function LoanList({ prestamos, pagos, onSeleccionar, onEditar, onEliminar }: Props) {
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null)

  if (prestamos.length === 0) {
    return <p className="text-gray-500 text-sm">No hay préstamos registrados todavía.</p>
  }

  return (
    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
      <table className="w-full text-sm text-left">
        <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
          <tr>
            <th className="px-4 py-3">Persona</th>
            <th className="px-4 py-3">Capital</th>
            <th className="px-4 py-3">Interés %</th>
            <th className="px-4 py-3">Vence</th>
            <th className="px-4 py-3">Saldo</th>
            <th className="px-4 py-3">Estado</th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {prestamos.map((p) => {
            const r = calcularResumen(p, pagos)
            const estadoMostrado = r.saldoPendiente <= 0 ? 'pagado' : r.vencido ? 'vencido' : p.estado
            return (
              <tr key={p.id} className="hover:bg-gray-50 cursor-pointer" onClick={() => onSeleccionar(p.id)}>
                <td className="px-4 py-3 font-medium text-gray-800">{p.persona}</td>
                <td className="px-4 py-3">{formatoMoneda(p.monto)}</td>
                <td className="px-4 py-3">{p.tasaInteres}%</td>
                <td className="px-4 py-3">{formatoFecha(p.fechaFin)}</td>
                <td className="px-4 py-3">{formatoMoneda(r.saldoPendiente)}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColor[estadoMostrado]}`}>
                    {estadoMostrado}
                  </span>
                </td>
                <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {confirmandoId === p.id ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs text-gray-600">¿Eliminar?</span>
                      <button
                        onClick={() => {
                          onEliminar(p.id)
                          setConfirmandoId(null)
                        }}
                        className="text-xs font-medium text-red-600 hover:text-red-800"
                      >
                        Sí
                      </button>
                      <button
                        onClick={() => setConfirmandoId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        No
                      </button>
                    </span>
                  ) : (
                    <>
                      <button
                        onClick={() => onEditar(p.id)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 mr-3"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => setConfirmandoId(p.id)}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        Eliminar
                      </button>
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
