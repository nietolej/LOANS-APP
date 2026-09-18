import { useState } from 'react'
import type { Beneficiario, Liquidacion } from '../types'
import { formatoFecha, formatoMoneda } from '../lib/calculations'

interface Props {
  liquidaciones: Liquidacion[]
  gananciaAdmin: number
  gananciaPropietario: number
  onAgregar: (liquidacion: Omit<Liquidacion, 'id'>) => void
  onEliminar: (id: string) => void
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

const beneficiarioLabel: Record<Beneficiario, string> = {
  admin: 'Administrador',
  inversor: 'Inversor / Propietario',
}

export function Liquidaciones({ liquidaciones, gananciaAdmin, gananciaPropietario, onAgregar, onEliminar }: Props) {
  const [beneficiario, setBeneficiario] = useState<Beneficiario>('inversor')
  const [fecha, setFecha] = useState(hoyISO())
  const [monto, setMonto] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const liquidadoAdmin = liquidaciones
    .filter((l) => l.beneficiario === 'admin')
    .reduce((sum, l) => sum + l.monto, 0)
  const liquidadoInversor = liquidaciones
    .filter((l) => l.beneficiario === 'inversor')
    .reduce((sum, l) => sum + l.monto, 0)

  // Puede quedar negativo si se liquidó de más (adelanto) frente a lo ya devengado;
  // se muestra tal cual en vez de forzarlo a 0, para que ese adelanto sea visible.
  const pendienteAdmin = gananciaAdmin - liquidadoAdmin
  const pendienteInversor = gananciaPropietario - liquidadoInversor

  const historial = [...liquidaciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  function registrar(e: React.FormEvent) {
    e.preventDefault()
    if (!monto || Number(monto) <= 0) return setError('Ingresa un monto válido.')
    setError('')
    onAgregar({
      beneficiario,
      fecha,
      monto: Number(monto),
      notas: notas.trim() || undefined,
    })
    setMonto('')
    setNotas('')
  }

  return (
    <div>
      <h3 className="font-medium text-gray-800 mb-2">Liquidaciones (pagos reales al administrador / inversor)</h3>
      <p className="text-sm text-gray-500 mb-3">
        Lo "cobrado" arriba es interés recibido de los clientes. Aquí se registra lo que REALMENTE se le ha
        entregado a cada uno, para saber cuánto falta por liquidarle.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-amber-50 rounded-lg p-4">
          <p className="text-sm font-medium text-amber-700">Administrador</p>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-amber-700">Le corresponde (total)</span>
            <span className="font-semibold text-amber-800">{formatoMoneda(gananciaAdmin)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-amber-700">Liquidado</span>
            <span className="font-semibold text-amber-800">{formatoMoneda(liquidadoAdmin)}</span>
          </div>
          <div className="flex justify-between border-t border-amber-200 mt-1 pt-1">
            <span className="text-sm text-amber-700">Pendiente por liquidar</span>
            <span className="font-bold text-amber-900">{formatoMoneda(pendienteAdmin)}</span>
          </div>
        </div>
        <div className="bg-emerald-50 rounded-lg p-4">
          <p className="text-sm font-medium text-emerald-700">Inversor / Propietario</p>
          <div className="flex justify-between mt-2">
            <span className="text-sm text-emerald-700">Le corresponde (total)</span>
            <span className="font-semibold text-emerald-800">{formatoMoneda(gananciaPropietario)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-sm text-emerald-700">Liquidado</span>
            <span className="font-semibold text-emerald-800">{formatoMoneda(liquidadoInversor)}</span>
          </div>
          <div className="flex justify-between border-t border-emerald-200 mt-1 pt-1">
            <span className="text-sm text-emerald-700">Pendiente por liquidar</span>
            <span className="font-bold text-emerald-900">{formatoMoneda(pendienteInversor)}</span>
          </div>
        </div>
      </div>

      <form onSubmit={registrar} className="flex flex-wrap gap-2 items-end mt-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Beneficiario</label>
          <select
            className="border border-gray-300 rounded px-2 py-1.5"
            value={beneficiario}
            onChange={(e) => setBeneficiario(e.target.value as Beneficiario)}
          >
            <option value="inversor">Inversor / Propietario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Fecha</label>
          <input
            type="date"
            className="border border-gray-300 rounded px-2 py-1.5"
            value={fecha}
            onChange={(e) => setFecha(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Monto</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="border border-gray-300 rounded px-2 py-1.5 w-32"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
          />
        </div>
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Notas</label>
          <input
            className="border border-gray-300 rounded px-2 py-1.5 w-full"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Registrar liquidación
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      <div className="mt-3">
        <button
          onClick={() => setMostrarHistorial((v) => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {mostrarHistorial ? 'Ocultar' : 'Ver'} historial de liquidaciones ({historial.length})
        </button>
        {mostrarHistorial && (
          <ul className="divide-y divide-gray-100 mt-2">
            {historial.length === 0 && <p className="text-sm text-gray-500 py-2">Sin liquidaciones registradas.</p>}
            {historial.map((l) => (
              <li key={l.id} className="flex justify-between items-center py-2 text-sm">
                <div>
                  <span className="font-medium">{formatoFecha(l.fecha)}</span>
                  <span
                    className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                      l.beneficiario === 'admin' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {beneficiarioLabel[l.beneficiario]}
                  </span>
                  {l.notas && <span className="text-gray-500"> · {l.notas}</span>}
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-semibold">{formatoMoneda(l.monto)}</span>
                  <button onClick={() => onEliminar(l.id)} className="text-xs text-red-500 hover:text-red-700">
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
