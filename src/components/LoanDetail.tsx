import { useState } from 'react'
import type { Pago, Prestamo } from '../types'
import { calcularResumen, formatoFecha, formatoMoneda } from '../lib/calculations'
import { generarCronograma, type EstadoCuota } from '../lib/cronograma'
import { serieCapitalPrestamo } from '../lib/stats'
import { StepLineChart } from './Charts'

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
  onActualizarPago: (id: string, cambios: Partial<Omit<Pago, 'id' | 'prestamoId'>>) => void
  onEliminarPago: (id: string) => void
  onCambiarEstado: (estado: Prestamo['estado']) => void
  onCerrar: () => void
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

const estadoCuotaLabel: Record<EstadoCuota, string> = {
  pagada: 'Pagada',
  parcial: 'Parcial',
  pendiente: 'Pendiente',
  vencida: 'Vencida',
}

const estadoCuotaColor: Record<EstadoCuota, string> = {
  pagada: 'bg-emerald-100 text-emerald-700',
  parcial: 'bg-amber-100 text-amber-700',
  pendiente: 'bg-gray-100 text-gray-600',
  vencida: 'bg-rose-100 text-rose-700',
}

export function LoanDetail({
  prestamo,
  pagos,
  onAgregarPago,
  onActualizarPago,
  onEliminarPago,
  onCambiarEstado,
  onCerrar,
}: Props) {
  const pagosPrestamo = pagos
    .filter((p) => p.prestamoId === prestamo.id)
    .sort((a, b) => (a.fecha < b.fecha ? 1 : -1))
  const resumen = calcularResumen(prestamo, pagos)
  const cuotas = generarCronograma(prestamo, pagos)
  const curvaCapital = serieCapitalPrestamo(prestamo, pagos)

  const [montoPago, setMontoPago] = useState('')
  const [tipoPago, setTipoPago] = useState<Pago['tipo']>('interes')
  const [fechaPago, setFechaPago] = useState(hoyISO())
  const [notasPago, setNotasPago] = useState('')
  const [error, setError] = useState('')

  const [editandoPagoId, setEditandoPagoId] = useState<string | null>(null)
  const [editFecha, setEditFecha] = useState('')
  const [editMonto, setEditMonto] = useState('')
  const [editTipo, setEditTipo] = useState<Pago['tipo']>('interes')
  const [editNotas, setEditNotas] = useState('')

  function iniciarEdicionPago(p: Pago) {
    setEditandoPagoId(p.id)
    setEditFecha(p.fecha)
    setEditMonto(String(p.monto))
    setEditTipo(p.tipo)
    setEditNotas(p.notas ?? '')
  }

  function guardarEdicionPago(e: React.FormEvent) {
    e.preventDefault()
    if (!editandoPagoId) return
    if (!editMonto || Number(editMonto) <= 0) return
    onActualizarPago(editandoPagoId, {
      fecha: editFecha,
      monto: Number(editMonto),
      tipo: editTipo,
      notas: editNotas.trim() || undefined,
    })
    setEditandoPagoId(null)
  }

  function registrarPago(e: React.FormEvent) {
    e.preventDefault()
    if (!montoPago || Number(montoPago) <= 0) return setError('Ingresa un monto de pago válido.')
    setError('')
    onAgregarPago({
      prestamoId: prestamo.id,
      fecha: fechaPago,
      monto: Number(montoPago),
      tipo: tipoPago,
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
            {formatoFecha(prestamo.fechaInicio)} →{' '}
            {resumen.abierto ? 'Abierto (sin fecha de cierre)' : formatoFecha(prestamo.fechaFin ?? '')} ·{' '}
            {modoPagoLabel[prestamo.modoPago]}
            {resumen.abierto && resumen.fechaVencido && (
              <> · Vencido desde {formatoFecha(resumen.fechaVencido)}</>
            )}
            {resumen.abierto && resumen.fechaProximo && (
              <> · Próximo pago: {formatoFecha(resumen.fechaProximo)}</>
            )}
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
          <p className="text-gray-500">
            {resumen.abierto ? `Interés generado (${prestamo.tasaInteres}%/periodo)` : `Interés (${prestamo.tasaInteres}%)`}
          </p>
          <p className="font-semibold">{formatoMoneda(resumen.interesTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">{resumen.abierto ? 'Total generado a hoy' : 'Total a pagar'}</p>
          <p className="font-semibold">{formatoMoneda(resumen.montoTotal)}</p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-gray-500">Saldo pendiente</p>
          <p className="font-semibold">{formatoMoneda(resumen.saldoPendiente)}</p>
        </div>
        <div className="bg-sky-50 rounded p-3">
          <p className="text-sky-700">Capital pendiente</p>
          <p className="font-semibold text-sky-800">{formatoMoneda(resumen.capitalPendiente)}</p>
        </div>
        {resumen.abierto ? (
          <>
            <div className="bg-rose-50 rounded p-3">
              <p className="text-rose-600">Interés vencido (sin pagar)</p>
              <p className="font-semibold text-rose-700">
                {resumen.montoVencido ? formatoMoneda(resumen.montoVencido) : formatoMoneda(0)}
              </p>
              {resumen.fechaVencido && (
                <p className="text-xs text-rose-500">desde {formatoFecha(resumen.fechaVencido)}</p>
              )}
            </div>
            <div className="bg-violet-50 rounded p-3">
              <p className="text-violet-700">Próximo por vencer</p>
              <p className="font-semibold text-violet-800">
                {resumen.montoProximo ? formatoMoneda(resumen.montoProximo) : formatoMoneda(0)}
              </p>
              {resumen.fechaProximo && (
                <p className="text-xs text-violet-500">el {formatoFecha(resumen.fechaProximo)}</p>
              )}
            </div>
          </>
        ) : (
          <div className="bg-violet-50 rounded p-3">
            <p className="text-violet-700">Interés pendiente</p>
            <p className="font-semibold text-violet-800">{formatoMoneda(resumen.interesPendiente)}</p>
          </div>
        )}
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
                : resumen.abierto
                  ? `Próx. vencimiento en ${resumen.diasRestantes} días`
                  : `${resumen.diasRestantes} días restantes`}
          </p>
        </div>
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Evolución del capital pendiente</h4>
        <StepLineChart
          points={curvaCapital}
          color="#0ea5e9"
          formatValue={formatoMoneda}
          formatFecha={formatoFecha}
          vacio="Se necesita al menos un abono a capital para trazar la curva."
        />
      </div>

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Conciliación de cuentas</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div className="bg-amber-50 rounded p-3">
            <p className="text-amber-700 font-medium">Administrador ({prestamo.comisionAdmin}% del interés)</p>
            <div className="flex justify-between mt-1">
              <span className="text-amber-700">Cobrado</span>
              <span className="font-semibold text-amber-800">
                {formatoMoneda(resumen.interesPagado * (prestamo.comisionAdmin / 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-amber-700">Pendiente</span>
              <span className="font-semibold text-amber-800">
                {formatoMoneda(resumen.interesPendiente * (prestamo.comisionAdmin / 100))}
              </span>
            </div>
          </div>
          <div className="bg-emerald-50 rounded p-3">
            <p className="text-emerald-700 font-medium">
              Inversor ({(100 - prestamo.comisionAdmin).toFixed(0)}% del interés)
            </p>
            <div className="flex justify-between mt-1">
              <span className="text-emerald-700">Cobrado</span>
              <span className="font-semibold text-emerald-800">
                {formatoMoneda(resumen.interesPagado * (1 - prestamo.comisionAdmin / 100))}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-700">Pendiente</span>
              <span className="font-semibold text-emerald-800">
                {formatoMoneda(resumen.interesPendiente * (1 - prestamo.comisionAdmin / 100))}
              </span>
            </div>
          </div>
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
          <div>
            <label className="block text-xs text-gray-500 mb-1">Tipo</label>
            <select
              className="border border-gray-300 rounded px-2 py-1.5"
              value={tipoPago}
              onChange={(e) => setTipoPago(e.target.value as Pago['tipo'])}
            >
              <option value="interes">Pago de interés</option>
              <option value="capital">Abono a capital</option>
            </select>
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

      {resumen.abierto && (
        <div>
          <h4 className="font-medium text-gray-800 mb-2">Cronograma de cuotas de interés</h4>
          {cuotas.length === 0 ? (
            <p className="text-sm text-gray-500">Sin cuotas generadas todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
                  <tr>
                    <th className="px-3 py-2">#</th>
                    <th className="px-3 py-2">Vencimiento</th>
                    <th className="px-3 py-2">Capital base</th>
                    <th className="px-3 py-2">Interés esperado</th>
                    <th className="px-3 py-2">Interés pagado</th>
                    <th className="px-3 py-2">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {cuotas.map((c) => (
                    <tr key={c.numero}>
                      <td className="px-3 py-2">{c.numero}</td>
                      <td className="px-3 py-2">{formatoFecha(c.fechaVencimiento)}</td>
                      <td className="px-3 py-2">{formatoMoneda(c.capitalBase)}</td>
                      <td className="px-3 py-2">{formatoMoneda(c.interesEsperado)}</td>
                      <td className="px-3 py-2">{formatoMoneda(c.interesPagado)}</td>
                      <td className="px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoCuotaColor[c.estado]}`}>
                          {estadoCuotaLabel[c.estado]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      <div>
        <h4 className="font-medium text-gray-800 mb-2">Historial de pagos</h4>
        {pagosPrestamo.length === 0 ? (
          <p className="text-sm text-gray-500">Sin pagos registrados.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {pagosPrestamo.map((p) =>
              editandoPagoId === p.id ? (
                <li key={p.id} className="py-2">
                  <form onSubmit={guardarEdicionPago} className="flex flex-wrap gap-2 items-end">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Fecha</label>
                      <input
                        type="date"
                        className="border border-gray-300 rounded px-2 py-1.5"
                        value={editFecha}
                        onChange={(e) => setEditFecha(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Monto</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="border border-gray-300 rounded px-2 py-1.5 w-28"
                        value={editMonto}
                        onChange={(e) => setEditMonto(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">Tipo</label>
                      <select
                        className="border border-gray-300 rounded px-2 py-1.5"
                        value={editTipo}
                        onChange={(e) => setEditTipo(e.target.value as Pago['tipo'])}
                      >
                        <option value="interes">Pago de interés</option>
                        <option value="capital">Abono a capital</option>
                      </select>
                    </div>
                    <div className="flex-1 min-w-[120px]">
                      <label className="block text-xs text-gray-500 mb-1">Notas</label>
                      <input
                        className="border border-gray-300 rounded px-2 py-1.5 w-full"
                        value={editNotas}
                        onChange={(e) => setEditNotas(e.target.value)}
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-3 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                    >
                      Guardar
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditandoPagoId(null)}
                      className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 hover:bg-gray-50 text-sm"
                    >
                      Cancelar
                    </button>
                  </form>
                </li>
              ) : (
                <li key={p.id} className="flex justify-between items-center py-2 text-sm">
                  <div>
                    <span className="font-medium">{formatoFecha(p.fecha)}</span>
                    <span
                      className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                        p.tipo === 'capital' ? 'bg-sky-100 text-sky-700' : 'bg-violet-100 text-violet-700'
                      }`}
                    >
                      {p.tipo === 'capital' ? 'Abono a capital' : 'Pago de interés'}
                    </span>
                    {p.notas && <span className="text-gray-500"> · {p.notas}</span>}
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold">{formatoMoneda(p.monto)}</span>
                    <button
                      onClick={() => iniciarEdicionPago(p)}
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => onEliminarPago(p.id)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              ),
            )}
          </ul>
        )}
      </div>
    </div>
  )
}
