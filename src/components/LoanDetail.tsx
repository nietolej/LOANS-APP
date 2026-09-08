import { useState } from 'react'
import type { Pago, Prestamo } from '../types'
import { calcularResumen, formatoFecha, formatoMoneda } from '../lib/calculations'

const modoPagoLabel: Record<Prestamo['modoPago'], string> = {
  unico: 'Pago único al vencimiento',
  mensual: 'Mensual',
  quincenal: 'Quincenal',
  semanal: 'Semanal',
}

interface Props {
  prestamo: Prestamo
  pagos: Pago[]
  onAgregarPago: (pago: Omit<Pago, 'id'>) => void
  onEliminarPago: (id: string) => void
  onCambiarEstado: (estado: Prestamo['estado']) => void
  onCerrar: () => void
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export function LoanDetail({ prestamo, pagos, onAgregarPago, onEliminarPago, onCambiarEstado, onCerrar }: Props) {
  const pagosPrestamo = pagos
    .filter((p) => p.prestamoId === prestamo.id)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  const resumen = calcularResumen(prestamo, pagos)

  const [montoPago, setMontoPago] = useState('')
  const [fechaPago, setFechaPago] = useState(hoyISO())
  const [notasPago, setNotasPago] = useState('')
  const [error, setError] = useState('')

  function registrarPago(e: React.FormEvent) {
    e.preventDefault()
    if (!montoPago || Number(montoPago) <= 0) return setError('Ingresa un monto de pago válido.')
    setError('')
    onAgregarPago({
      prestamoId: prestamo.id,
      fecha: fechaPago,
      monto: Number(montoPago),
      notas: notasPago.trim() || undefined,
    })
    setMontoPago('')
    setNotasPago('')

    if (resumen.saldoPendiente - Number(montoPago) <= 0.001 && prestamo.estado === 'activo') {
      onCambiarEstado('pagado')
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-5 space-y-5">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-semibold text-gray-800">{prestamo.persona}</h3>
          <p className="text-sm text-gray-500">
            {formatoFecha(prestamo.fechaInicio)} → {formatoFecha(prestamo.fechaFin)} ·{' '}
            {modoPagoLabel[prestamo.modoPago]}
          </p>
        </div>
        <button onClick={onCerrar} className="text-sm text-gray-500 hover:text-gray-800">
          Cerrar ✕
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Capital</p>
          <p className="font-semibold">{formatoMoneda(prestamo.monto)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Interés ({prestamo.tasaInteres}%)</p>
          <p className="font-semibold">{formatoMoneda(resumen.interesTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Total a pagar</p>
          <p className="font-semibold">{formatoMoneda(resumen.montoTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Saldo pendiente</p>
          <p className="font-semibold">{formatoMoneda(resumen.saldoPendiente)}</p>
        </div>
        <div className="bg-amber-50 rounded p-3">
          <p className="text-amber-700">Comisión admin. ({prestamo.comisionAdmin}%)</p>
          <p className="font-semibold text-amber-800">{formatoMoneda(resumen.gananciaAdmin)}</p>
        </div>
        <div className="bg-emerald-50 rounded p-3">
          <p className="text-emerald-700">Ganancia propietario</p>
          <p className="font-semibold text-emerald-800">{formatoMoneda(resumen.gananciaPropietario)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Total pagado</p>
          <p className="font-semibold">{formatoMoneda(resumen.totalPagado)}</p>
        </div>
        <div className={`rounded p-3 ${resumen.vencido ? 'bg-rose-50' : 'bg-gray-50'}`}>
          <p className={resumen.vencido ? 'text-rose-600' : 'text-gray-500'}>Estado</p>
          <p className={`font-semibold ${resumen.vencido ? 'text-rose-700' : ''}`}>
            {resumen.saldoPendiente <= 0
              ? 'Pagado'
              : resumen.vencido
                ? `Vencido (${Math.abs(resumen.diasRestantes)} días)`
                : `${resumen.diasRestantes} días restantes`}
          </p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(['activo', 'pagado', 'vencido', 'cancelado'] as const).map((estado) => (
          <button
            key={estado}
            onClick={() => onCambiarEstado(estado)}
            className={`text-xs px-3 py-1 rounded-full border ${
              prestamo.estado === estado
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-gray-300 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {estado}
          </button>
        ))}
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Registrar pago</h4>
        <form onSubmit={registrarPago} className="flex flex-wrap gap-2 items-end">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Fecha</label>
            <input
              type="date"
              className="border border-gray-300 rounded px-2 py-1.5"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-gray-300 rounded px-2 py-1.5 w-32"
              value={montoPago}
              onChange={(e) => setMontoPago(e.target.value)}
              placeholder="0.00"
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <label className="block text-xs text-gray-500 mb-1">Notas</label>
            <input
              className="border border-gray-300 rounded px-2 py-1.5 w-full"
              value={notasPago}
              onChange={(e) => setNotasPago(e.target.value)}
            />
          </div>
          <button type="submit" className="px-4 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
            Agregar
          </button>
        </form>
        {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Historial de pagos</h4>
        {pagosPrestamo.length === 0 ? (
          <p className="text-sm text-gray-500">Sin pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pagosPrestamo.map((p) => (
              <li key={p.id} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="font-medium">{formatoFecha(p.fecha)}</span>
                  {p.notas && <span className="text-gray-500"> · {p.notas}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatoMoneda(p.monto)}</span>
                  <button
                    onClick={() => onEliminarPago(p.id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
