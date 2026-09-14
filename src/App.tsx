import { useState } from 'react'
import { ClientStats } from './components/ClientStats'
import { Dashboard } from './components/Dashboard'
import { LoanDetail } from './components/LoanDetail'
import { LoanForm } from './components/LoanForm'
import { LoanList } from './components/LoanList'
import { Settings } from './components/Settings'
import { useAppData } from './lib/useAppData'
import type { Prestamo } from './types'

type Tab = 'dashboard' | 'prestamos' | 'clientes' | 'configuracion'

function App() {
  const {
    data,
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    agregarPago,
    actualizarPago,
    eliminarPago,
    actualizarConfiguracion,
    aplicarComisionATodos,
  } = useAppData()

  const [tab, setTab] = useState<Tab>('dashboard')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string | null>(null)

  const prestamoEditando = editandoId ? data.prestamos.find((p) => p.id === editandoId) : undefined
  const prestamoSeleccionado = seleccionadoId ? data.prestamos.find((p) => p.id === seleccionadoId) : undefined

  function handleGuardarPrestamo(valores: Omit<Prestamo, 'id' | 'creadoEn'>) {
    if (editandoId) {
      actualizarPrestamo(editandoId, valores)
    } else {
      agregarPrestamo(valores)
    }
    setMostrarForm(false)
    setEditandoId(null)
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dashboard', label: 'Resumen' },
    { id: 'prestamos', label: 'Préstamos' },
    { id: 'clientes', label: 'Clientes' },
    { id: 'configuracion', label: 'Configuración' },
  ]

  const prestamosFiltrados = [...data.prestamos]
    .filter((p) => !filtroPersona || p.persona === filtroPersona)
    .sort((a, b) => (a.creadoEn < b.creadoEn ? 1 : -1))

  return (
    <div className="min-h-svh bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">💰 Gestión de Préstamos</h1>
          <nav className="flex gap-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTab(t.id)
                  setMostrarForm(false)
                  setEditandoId(null)
                  setSeleccionadoId(null)
                  setFiltroPersona(null)
                }}
                className={`px-3 py-1.5 rounded-md text-sm font-medium ${
                  tab === t.id ? 'bg-indigo-600 text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {tab === 'dashboard' && <Dashboard data={data} />}

        {tab === 'prestamos' && (
          <div className="space-y-4">
            {!mostrarForm && !prestamoSeleccionado && (
              <div className="flex justify-between items-center flex-wrap gap-2">
                <div>
                  <h2 className="text-xl font-semibold text-gray-800">Préstamos</h2>
                  <p className="text-sm text-gray-500">
                    Haz clic en un préstamo para ver el detalle y registrar abonos a capital o pagos de interés.
                    {filtroPersona && (
                      <>
                        {' '}
                        · Filtrando por <span className="font-medium">{filtroPersona}</span>{' '}
                        <button onClick={() => setFiltroPersona(null)} className="text-indigo-600 hover:underline">
                          (quitar filtro)
                        </button>
                      </>
                    )}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditandoId(null)
                    setMostrarForm(true)
                  }}
                  className="px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 text-sm"
                >
                  + Nuevo préstamo
                </button>
              </div>
            )}

            {mostrarForm && (
              <LoanForm
                comisionAdminDefault={data.configuracion.comisionAdminDefault}
                valoresIniciales={prestamoEditando}
                onGuardar={handleGuardarPrestamo}
                onCancelar={() => {
                  setMostrarForm(false)
                  setEditandoId(null)
                }}
              />
            )}

            {!mostrarForm && prestamoSeleccionado && (
              <LoanDetail
                prestamo={prestamoSeleccionado}
                pagos={data.pagos}
                onAgregarPago={agregarPago}
                onActualizarPago={actualizarPago}
                onEliminarPago={eliminarPago}
                onCambiarEstado={(estado) => actualizarPrestamo(prestamoSeleccionado.id, { estado })}
                onCerrar={() => setSeleccionadoId(null)}
              />
            )}

            {!mostrarForm && !prestamoSeleccionado && (
              <LoanList
                prestamos={prestamosFiltrados}
                pagos={data.pagos}
                onSeleccionar={setSeleccionadoId}
                onEditar={(id) => {
                  setEditandoId(id)
                  setMostrarForm(true)
                }}
                onEliminar={eliminarPrestamo}
              />
            )}
          </div>
        )}

        {tab === 'clientes' && (
          <ClientStats
            data={data}
            onVerCliente={(persona) => {
              setFiltroPersona(persona)
              setTab('prestamos')
            }}
          />
        )}

        {tab === 'configuracion' && (
          <Settings
            configuracion={data.configuracion}
            totalPrestamos={data.prestamos.length}
            onGuardar={actualizarConfiguracion}
            onAplicarATodos={aplicarComisionATodos}
          />
        )}
      </main>
    </div>
  )
}

export default App
