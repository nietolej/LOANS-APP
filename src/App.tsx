import { useEffect, useRef, useState } from 'react'
import { ClientStats } from './components/ClientStats'
import { Dashboard } from './components/Dashboard'
import { Login } from './components/Login'
import { LoanDetail } from './components/LoanDetail'
import { LoanForm } from './components/LoanForm'
import { LoanList } from './components/LoanList'
import { Settings } from './components/Settings'
import { leerDatosLocalesPendientes, limpiarDatosLocales } from './lib/storage'
import { useAppData } from './lib/useAppData'
import { useAuth } from './lib/useAuth'
import type { Prestamo } from './types'

type Tab = 'dashboard' | 'prestamos' | 'clientes' | 'configuracion'

function AppContent({ uid, email, onLogout }: { uid: string; email: string; onLogout: () => void }) {
  const {
    data,
    cargando,
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    agregarPago,
    actualizarPago,
    eliminarPago,
    actualizarConfiguracion,
    aplicarComisionATodos,
    importarDatos,
  } = useAppData(uid)

  const [tab, setTab] = useState<Tab>('dashboard')
  const [mostrarForm, setMostrarForm] = useState(false)
  const [editandoId, setEditandoId] = useState<string | null>(null)
  const [seleccionadoId, setSeleccionadoId] = useState<string | null>(null)
  const [filtroPersona, setFiltroPersona] = useState<string | null>(null)

  // Migra una única vez los datos que hayan quedado en el localStorage de este
  // navegador (de antes de usar Firestore) a la cuenta recién autenticada.
  const migracionIntentada = useRef(false)
  useEffect(() => {
    if (cargando || migracionIntentada.current) return
    migracionIntentada.current = true
    if (data.prestamos.length > 0 || data.pagos.length > 0) return
    const pendientes = leerDatosLocalesPendientes()
    if (pendientes && (pendientes.prestamos.length > 0 || pendientes.pagos.length > 0)) {
      importarDatos(pendientes)
      limpiarDatosLocales()
    }
  }, [cargando, data, importarDatos])

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

  if (cargando) {
    return (
      <div className="min-h-svh bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando datos...</p>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-gray-100">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-2">
          <h1 className="text-xl font-bold text-gray-800">💰 Gestión de Préstamos</h1>
          <nav className="flex items-center gap-1 flex-wrap">
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
            <span className="text-xs text-gray-400 ml-2 hidden sm:inline">{email}</span>
            <button
              onClick={onLogout}
              className="text-xs text-gray-500 hover:text-red-600 ml-1 px-2 py-1.5"
            >
              Salir
            </button>
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

function App() {
  const { user, cargando, login, logout } = useAuth()

  if (cargando) {
    return (
      <div className="min-h-svh bg-gray-100 flex items-center justify-center">
        <p className="text-gray-500 text-sm">Cargando...</p>
      </div>
    )
  }

  if (!user) {
    return <Login onLogin={login} />
  }

  return <AppContent uid={user.uid} email={user.email ?? ''} onLogout={logout} />
}

export default App
