import type { AppData } from '../types'
import { formatoMoneda } from '../lib/calculations'
import { calcularStatsPorCliente } from '../lib/stats'
import { BarChart } from './Charts'

export function ClientStats({ data, onVerCliente }: { data: AppData; onVerCliente: (persona: string) => void }) {
  const clientes = calcularStatsPorCliente(data)

  if (clientes.length === 0) {
    return <p className="text-gray-500 text-sm">Aún no hay préstamos registrados.</p>
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Clientes</h2>
        <p className="text-sm text-gray-500">Estadísticas agrupadas por persona.</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="font-medium text-gray-800 mb-3">Saldo pendiente por cliente</h3>
        <BarChart
          data={clientes.map((c) => ({ label: c.persona, value: c.saldoPendiente }))}
          color="#f43f5e"
          formatValue={formatoMoneda}
        />
      </div>

      <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
            <tr>
              <th className="px-4 py-3">Cliente</th>
              <th className="px-4 py-3"># Préstamos</th>
              <th className="px-4 py-3">Capital prestado</th>
              <th className="px-4 py-3">Total pagado</th>
              <th className="px-4 py-3">Saldo pendiente</th>
              <th className="px-4 py-3">Ganancia generada</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {clientes.map((c) => (
              <tr key={c.persona} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">
                  {c.persona}
                  <div className="text-xs text-gray-500">
                    {c.activos} activo(s) · {c.vencidos} vencido(s) · {c.pagados} pagado(s)
                  </div>
                </td>
                <td className="px-4 py-3">{c.prestamos.length}</td>
                <td className="px-4 py-3">{formatoMoneda(c.capitalPrestado)}</td>
                <td className="px-4 py-3">{formatoMoneda(c.totalPagado)}</td>
                <td className="px-4 py-3">{formatoMoneda(c.saldoPendiente)}</td>
                <td className="px-4 py-3">{formatoMoneda(c.gananciaAdmin + c.gananciaPropietario)}</td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => onVerCliente(c.persona)}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Ver préstamos
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
