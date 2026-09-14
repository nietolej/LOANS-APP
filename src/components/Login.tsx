import { useState } from 'react'
import { FirebaseError } from 'firebase/app'

interface Props {
  onLogin: (email: string, password: string) => Promise<void>
}

function mensajeError(codigo: string): string {
  switch (codigo) {
    case 'auth/invalid-email':
      return 'El correo no es válido.'
    case 'auth/user-not-found':
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Correo o contraseña incorrectos.'
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.'
    default:
      return 'No se pudo iniciar sesión. Intenta de nuevo.'
  }
}

export function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      await onLogin(email.trim(), password)
    } catch (err) {
      setError(err instanceof FirebaseError ? mensajeError(err.code) : 'No se pudo iniciar sesión.')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="min-h-svh bg-gray-100 flex items-center justify-center px-4">
      <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-gray-200 p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold text-gray-800">💰 Gestión de Préstamos</h1>
          <p className="text-sm text-gray-500 mt-1">Inicia sesión para continuar</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Correo</label>
          <input
            type="email"
            required
            autoFocus
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu@correo.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-600 mb-1">Contraseña</label>
          <input
            type="password"
            required
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={cargando}
          className="w-full px-4 py-2 rounded bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
        >
          {cargando ? 'Ingresando...' : 'Ingresar'}
        </button>
      </form>
    </div>
  )
}
