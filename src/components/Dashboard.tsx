import type { AppData, Liquidacion } from '../types'
import { calcularResumen, formatoFecha, formatoMoneda } from '../lib/calculations'
import { calcularRentabilidadMensual, formatoMes, serieCapitalGlobal } from '../lib/stats'
import { BarChart, StackedBar, StepLineChart } from './Charts'
import { Liquidaciones } from './Liquidaciones'

interface Props {
  data: AppData
  onAgregarLiquidacion: (liquidacion: Omit<Liquidacion, 'id'>) => void
  onEliminarLiquidacion: (id: string) => void
}

export function Dashboard({ data, onAgregarLiquidacion, onEliminarLiquidacion }: Props) {
  const { prestamos, pagos } = data

  let capitalPrestado = 0
  let interesTotal = 0
  let totalPagado = 0
  let saldoPendiente = 0
  let activos = 0
  let vencidos = 0
  let pagadosCount = 0

  let adminCobrado = 0
  let adminPendiente = 0
  let inversorCobrado = 0
  let inversorPendiente = 0

  for (const p of prestamos) {
    const r = calcularResumen(p, pagos)
    capitalPrestado += p.monto
    interesTotal += r.interesTotal
    totalPagado += r.totalPagado
    saldoPendiente += r.saldoPendiente
    if (r.vencido) vencidos++
    else if (r.saldoPendiente <= 0) pagadosCount++
    else if (p.estado === 'activo') activos++

    const cuotaAdmin = p.comisionAdmin / 100
    adminCobrado += r.interesPagado * cuotaAdmin
    adminPendiente += r.interesPendiente * cuotaAdmin
    inversorCobrado += r.interesPagado * (1 - cuotaAdmin)
    inversorPendiente += r.interesPendiente * (1 - cuotaAdmin)
  }

  const gananciaAdmin = adminCobrado + adminPendiente
  const gananciaPropietario = inversorCobrado + inversorPendiente

  const rentabilidadMensual = calcularRentabilidadMensual(data).slice(-6)
  const curvaCapitalGlobal = serieCapitalGlobal(data)

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

      {prestamos.length > 0 && (
        <div>
          <h3 className="font-medium text-gray-800 mb-2">Conciliación de cuentas</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-amber-50 rounded-lg p-4">
              <p className="text-sm font-medium text-amber-700">Administrador</p>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-amber-700">Cobrado</span>
                <span className="font-semibold text-amber-800">{formatoMoneda(adminCobrado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-amber-700">Pendiente por cobrar</span>
                <span className="font-semibold text-amber-800">{formatoMoneda(adminPendiente)}</span>
              </div>
            </div>
            <div className="bg-emerald-50 rounded-lg p-4">
              <p className="text-sm font-medium text-emerald-700">Inversor / Propietario</p>
              <div className="flex justify-between mt-2">
                <span className="text-sm text-emerald-700">Cobrado</span>
                <span className="font-semibold text-emerald-800">{formatoMoneda(inversorCobrado)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-emerald-700">Pendiente por cobrar</span>
                <span className="font-semibold text-emerald-800">{formatoMoneda(inversorPendiente)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {prestamos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <Liquidaciones
            liquidaciones={data.liquidaciones}
            gananciaAdmin={gananciaAdmin}
            gananciaPropietario={gananciaPropietario}
            onAgregar={onAgregarLiquidacion}
            onEliminar={onEliminarLiquidacion}
          />
        </div>
      )}

      {prestamos.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="font-medium text-gray-800 mb-3">Evolución del capital pendiente (todos los préstamos)</h3>
          <StepLineChart
            points={curvaCapitalGlobal}
            color="#0ea5e9"
            formatValue={formatoMoneda}
            formatFecha={formatoFecha}
          />
        </div>
      )}

      {prestamos.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-3">Rentabilidad mensual (interés recibido)</h3>
            <BarChart
              data={rentabilidadMensual.map((m) => ({ label: formatoMes(m.mes), value: m.interesRecibido }))}
              color="#8b5cf6"
              formatValue={formatoMoneda}
              vacio="Aún no hay pagos de interés registrados."
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="font-medium text-gray-800 mb-3">Distribución de préstamos por estado</h3>
            <StackedBar
              segments={[
                { label: 'Activos', value: activos, color: '#3b82f6' },
                { label: 'Vencidos', value: vencidos, color: '#f43f5e' },
                { label: 'Pagados', value: pagadosCount, color: '#10b981' },
              ]}
            />
          </div>
        </div>
      )}
    </div>
  )
}
