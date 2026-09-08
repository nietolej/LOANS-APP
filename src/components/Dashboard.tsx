import type { AppData } from '../types'
import { calcularResumen, formatoMoneda } from '../lib/calculations'

export function Dashboard({ data }: { data: AppData }) {
  const { prestamos, pagos } = data

  let capitalPrestado = 0
  let interesTotal = 0
  let gananciaAdmin = 0
  let gananciaPropietario = 0
  let totalPagado = 0
  let saldoPendiente = 0
  let activos = 0
  let vencidos = 0
  let pagadosCount = 0

  for (const p of prestamos) {
    const r = calcularResumen(p, pagos)
    capitalPrestado += p.monto
    interesTotal += r.interesTotal
    gananciaAdmin += r.gananciaAdmin
    gananciaPropietario += r.gananciaPropietario
    totalPagado += r.totalPagado
    saldoPendiente += r.saldoPendiente
    if (r.vencido) vencidos++
    else if (r.saldoPendiente <= 0) pagadosCount++
    else if (p.estado === 'activo') activos++
  }

  const tarjetas = [
    { label: 'Capital prestado', valor: formatoMoneda(capitalPrestado), color: 'bg-blue-50 text-blue-700' },
    { label: 'Interés total esperado', valor: formatoMoneda(interesTotal), color: 'bg-purple-50 text-purple-700' },
    { label: 'Ganancia del administrador', valor: formatoMoneda(gananciaAdmin), color: 'bg-amber-50 text-amber-700' },
    { label: 'Ganancia del propietario', valor: formatoMoneda(gananciaPropietario), color: 'bg-emerald-50 text-emerald-700' },
    { label: 'Total pagado (recibido)', valor: formatoMoneda(totalPagado), color: 'bg-teal-50 text-teal-700' },
    { label: 'Saldo pendiente por cobrar', valor: formatoMoneda(saldoPendiente), color: 'bg-rose-50 text-rose-700' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-gray-800">Resumen general</h2>
        <p className="text-sm text-gray-500">
          {prestamos.length} préstamo(s) · {activos} activo(s) · {vencidos} vencido(s) ·{' '}
          {pagadosCount} pagado(s)
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {tarjetas.map((t) => (
          <div key={t.label} className={`rounded-lg p-4 ${t.color}`}>
            <p className="text-sm font-medium opacity-80">{t.label}</p>
            <p className="text-2xl font-bold mt-1">{t.valor}</p>
          </div>
        ))}
      </div>

      {prestamos.length === 0 && (
        <p className="text-gray-500 text-sm">
          Aún no hay préstamos registrados. Ve a la pestaña "Préstamos" para agregar el primero.
        </p>
      )}
    </div>
  )
}
