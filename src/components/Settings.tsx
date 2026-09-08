import { useState } from 'react'
import type { Configuracion } from '../types'

interface Props {
  configuracion: Configuracion
  totalPrestamos: number
  onGuardar: (cambios: Partial<Configuracion>) => void
  onAplicarATodos: (comisionAdmin: number) => void
}

export function Settings({ configuracion, totalPrestamos, onGuardar, onAplicarATodos }: Props) {
  const [nombreAdmin, setNombreAdmin] = useState(configuracion.nombreAdmin)
  const [comisionAdminDefault, setComisionAdminDefault] = useState(String(configuracion.comisionAdminDefault))
  const [guardado, setGuardado] = useState(false)
  const [aplicado, setAplicado] = useState(false)
  const [confirmandoAplicar, setConfirmandoAplicar] = useState(false)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGuardar({
      nombreAdmin: nombreAdmin.trim() || 'Administrador',
      comisionAdminDefault: Number(comisionAdminDefault) || 0,
    })
    setGuardado(true)
    setTimeout(() => setGuardado(false), 2000)
  }

  function handleConfirmarAplicarATodos() {
    const valor = Number(comisionAdminDefault) || 0
    onAplicarATodos(valor)
    setConfirmandoAplicar(false)
    setAplicado(true)
    setTimeout(() => setAplicado(false), 2000)
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-5 space-y-4 max-w-md">
      <h3 className="text-lg font-semibold text-gray-800">Configuración</h3>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">Nombre del administrador</label>
        <input
          className="w-full border border-gray-300 rounded px-3 py-2"
          value={nombreAdmin}
          onChange={(e) => setNombreAdmin(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-600 mb-1">
          % de comisión por defecto para nuevos préstamos
        </label>
        <input
          className="w-full border border-gray-300 rounded px-3 py-2"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={comisionAdminDefault}
          onChange={(e) => setComisionAdminDefault(e.target.value)}
        />
        <p className="text-xs text-gray-500 mt-1">
          Porcentaje del interés generado en cada préstamo que corresponde a{' '}
          {nombreAdmin || 'el administrador'}. Se puede ajustar por préstamo individual.
        </p>
      </div>

      <button type="submit" className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700">
        Guardar
      </button>
      {guardado && <span className="text-sm text-emerald-600 ml-3">Guardado ✓</span>}

      {totalPrestamos > 0 && (
        <div className="pt-4 border-t border-gray-200">
          {!confirmandoAplicar ? (
            <button
              type="button"
              onClick={() => setConfirmandoAplicar(true)}
              className="px-4 py-2 rounded border border-amber-400 text-amber-700 hover:bg-amber-50 text-sm"
            >
              Aplicar este % a los {totalPrestamos} préstamo(s) existentes
            </button>
          ) : (
            <div className="bg-amber-50 border border-amber-300 rounded p-3 space-y-2">
              <p className="text-sm text-amber-800">
                Esto sobrescribirá la comisión del administrador en los {totalPrestamos} préstamo(s)
                existentes a {Number(comisionAdminDefault) || 0}%. ¿Continuar?
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleConfirmarAplicarATodos}
                  className="px-3 py-1.5 rounded bg-amber-600 text-white text-sm hover:bg-amber-700"
                >
                  Sí, aplicar a todos
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmandoAplicar(false)}
                  className="px-3 py-1.5 rounded border border-gray-300 text-gray-600 text-sm hover:bg-gray-50"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Cambiar el % de arriba no afecta préstamos ya creados. Usa este botón para
            sobrescribir la comisión en todos ellos de una sola vez.
          </p>
          {aplicado && <span className="text-sm text-emerald-600">Aplicado a todos los préstamos ✓</span>}
        </div>
      )}
    </form>
  )
}
