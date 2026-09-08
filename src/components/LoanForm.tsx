import { useState } from 'react'
import type { ModoPago, Prestamo } from '../types'

interface Props {
  comisionAdminDefault: number
  valoresIniciales?: Prestamo
  onGuardar: (prestamo: Omit<Prestamo, 'id' | 'creadoEn'>) => void
  onCancelar: () => void
}

const modosPago: { value: ModoPago; label: string }[] = [
  { value: 'unico', label: 'Pago único al vencimiento' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'semanal', label: 'Semanal' },
]

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

export function LoanForm({ comisionAdminDefault, valoresIniciales, onGuardar, onCancelar }: Props) {
  const [persona, setPersona] = useState(valoresIniciales?.persona ?? '')
  const [monto, setMonto] = useState(String(valoresIniciales?.monto ?? ''))
  const [fechaInicio, setFechaInicio] = useState(valoresIniciales?.fechaInicio ?? hoyISO())
  const [fechaFin, setFechaFin] = useState(valoresIniciales?.fechaFin ?? '')
  const [tasaInteres, setTasaInteres] = useState(String(valoresIniciales?.tasaInteres ?? ''))
  const [modoPago, setModoPago] = useState<ModoPago>(valoresIniciales?.modoPago ?? 'mensual')
  const [comisionAdmin, setComisionAdmin] = useState(
    String(valoresIniciales?.comisionAdmin ?? comisionAdminDefault),
  )
  const [notas, setNotas] = useState(valoresIniciales?.notas ?? '')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!persona.trim()) return setError('Ingresa el nombre de la persona.')
    if (!monto || Number(monto) <= 0) return setError('Ingresa un monto válido.')
    if (!fechaInicio || !fechaFin) return setError('Ingresa las fechas de inicio y fin.')
    if (fechaFin < fechaInicio) return setError('La fecha de fin debe ser posterior a la de inicio.')
    if (tasaInteres === '' || Number(tasaInteres) < 0) return setError('Ingresa un % de interés válido.')
    if (comisionAdmin === '' || Number(comisionAdmin) < 0 || Number(comisionAdmin) > 100)
      return setError('La comisión del administrador debe estar entre 0 y 100.')

    setError('')
    onGuardar({
      persona: persona.trim(),
      monto: Number(monto),
      fechaInicio,
      fechaFin,
      tasaInteres: Number(tasaInteres),
      modoPago,
      comisionAdmin: Number(comisionAdmin),
      estado: valoresIniciales?.estado ?? 'activo',
      notas: notas.trim() || undefined,
    })
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">
        {valoresIniciales ? 'Editar préstamo' : 'Nuevo préstamo'}
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Persona</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            placeholder="Nombre del deudor"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Monto prestado</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="number"
            min="0"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0.00"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de inicio</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="date"
            value={fechaInicio}
            onChange={(e) => setFechaInicio(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Fecha de vencimiento</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="date"
            value={fechaFin}
            onChange={(e) => setFechaFin(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">% Interés (total del plazo)</label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="number"
            min="0"
            step="0.01"
            value={tasaInteres}
            onChange={(e) => setTasaInteres(e.target.value)}
            placeholder="ej. 10"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Modo de pago</label>
          <select
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={modoPago}
            onChange={(e) => setModoPago(e.target.value as ModoPago)}
          >
            {modosPago.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">
            % del interés para el administrador
          </label>
          <input
            className="w-full border border-gray-300 rounded px-3 py-2"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={comisionAdmin}
            onChange={(e) => setComisionAdmin(e.target.value)}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Notas (opcional)</label>
        <textarea
          className="w-full border border-gray-300 rounded px-3 py-2"
          rows={2}
          value={notas}
          onChange={(e) => setNotas(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancelar}
          className="px-4 py-2 rounded border border-gray-300 text-gray-600 hover:bg-gray-50"
        >
          Cancelar
        </button>
        <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Guardar
        </button>
      </div>
    </form>
  )
}
