import { useState } from 'react'
import type { Beneficiario, Liquidacion } from '../types'
import { formatoFecha, formatoMoneda } from '../lib/calculations'

interface Props {
  liquidaciones: Liquidacion[]
  // Flujo 1 (clientes → administradora): lo efectivamente recibido de los clientes.
  interesCobrado: number
  capitalCobrado: number
  comisionAdminCobrada: number // parte del interés cobrado que corresponde a la administradora
  // Parte de lo cobrado que el cliente pagó directo al inversor (no pasó por la caja de la administradora).
  directoInteres: number
  directoCapital: number
  directoComision: number // comisión de la administradora incluida en directoInteres
  onAgregar: (liquidacion: Omit<Liquidacion, 'id'>) => void
  onEliminar: (id: string) => void
}

function hoyISO() {
  return new Date().toISOString().slice(0, 10)
}

const beneficiarioLabel: Record<Beneficiario, string> = {
  admin: 'Comisión administradora',
  inversor: 'Giro al inversor',
}

function Fila({ label, valor, negrita }: { label: string; valor: number; negrita?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-sm">{label}</span>
      <span className={negrita ? 'font-bold' : 'font-semibold'}>{formatoMoneda(valor)}</span>
    </div>
  )
}

export function Liquidaciones({
  liquidaciones,
  interesCobrado,
  capitalCobrado,
  comisionAdminCobrada,
  directoInteres,
  directoCapital,
  directoComision,
  onAgregar,
  onEliminar,
}: Props) {
  const [beneficiario, setBeneficiario] = useState<Beneficiario>('inversor')
  const [fecha, setFecha] = useState(hoyISO())
  const [interes, setInteres] = useState('')
  const [capital, setCapital] = useState('')
  const [montoAdmin, setMontoAdmin] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState('')
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const giros = liquidaciones.filter((l) => l.beneficiario === 'inversor')
  const retiros = liquidaciones.filter((l) => l.beneficiario === 'admin')

  const capitalGirado = giros.reduce((sum, l) => sum + (l.capital ?? 0), 0)
  const interesGirado = giros.reduce((sum, l) => sum + (l.monto - (l.capital ?? 0)), 0)
  const comisionRetirada = retiros.reduce((sum, l) => sum + l.monto, 0)

  const interesInversorCobrado = interesCobrado - comisionAdminCobrada
  const directoTotal = directoInteres + directoCapital

  // Lo que el inversor ya tiene = giros de la administradora + lo que los clientes le pagaron directo.
  // Puede quedar negativo (adelanto, o el inversor retiene comisión de la administradora en pagos
  // directos); se muestra tal cual para que la diferencia sea visible y no se oculte con un 0.
  const debeInteresInversor = interesInversorCobrado - interesGirado - directoInteres
  const debeCapitalInversor = capitalCobrado - capitalGirado - directoCapital
  const debeAlInversor = debeInteresInversor + debeCapitalInversor
  const comisionPendiente = comisionAdminCobrada - comisionRetirada

  // Caja de la administradora: entró lo que los clientes le pagaron a ella, salió lo girado y lo retirado.
  const totalCobrado = interesCobrado + capitalCobrado
  const recibidoPorAdmin = totalCobrado - directoTotal
  const cajaAdmin = recibidoPorAdmin - interesGirado - capitalGirado - comisionRetirada

  const alertas: string[] = []
  if (cajaAdmin < -0.005) alertas.push('La caja de la administradora quedó negativa: se giró o retiró más de lo recibido.')
  if (capitalGirado - (capitalCobrado - directoCapital) > 0.005)
    alertas.push('Se ha girado más capital al inversor del que la administradora recibió.')
  if (comisionPendiente < -0.005) alertas.push('La comisión retirada supera la comisión cobrada.')

  const historial = [...liquidaciones].sort((a, b) => (a.fecha < b.fecha ? 1 : -1))

  function registrar(e: React.FormEvent) {
    e.preventDefault()
    if (beneficiario === 'admin') {
      const m = Number(montoAdmin)
      if (!m || m <= 0) return setError('Ingresa un monto válido.')
      onAgregar({ beneficiario, fecha, monto: m, ...(notas.trim() ? { notas: notas.trim() } : {}) })
    } else {
      const i = Number(interes) || 0
      const c = Number(capital) || 0
      if (i < 0 || c < 0 || i + c <= 0) return setError('Ingresa interés y/o capital a girar.')
      onAgregar({
        beneficiario,
        fecha,
        monto: i + c,
        capital: c,
        ...(notas.trim() ? { notas: notas.trim() } : {}),
      })
    }
    setError('')
    setInteres('')
    setCapital('')
    setMontoAdmin('')
    setNotas('')
  }

  return (
    <div>
      <h3 className="font-medium text-gray-800 mb-2">Flujo administradora → inversor</h3>
      <p className="text-sm text-gray-500 mb-3">
        Los clientes le pagan a la administradora, y ella reenvía al inversor (solo interés, o interés más capital).
        Cuando gira puede descontarse su comisión o pasar el interés completo y retirarla después.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-sky-50 text-sky-800 rounded-lg p-4">
          <p className="text-sm font-medium">1. Cobrado a clientes</p>
          <div className="mt-2">
            <Fila label="Interés" valor={interesCobrado} />
            <Fila label="Capital" valor={capitalCobrado} />
            <div className="border-t border-sky-200 mt-1 pt-1">
              <Fila label="Total recibido" valor={totalCobrado} negrita />
            </div>
          </div>
        </div>
        <div className="bg-emerald-50 text-emerald-800 rounded-lg p-4">
          <p className="text-sm font-medium">2. Deuda con el inversor</p>
          <div className="mt-2">
            <Fila label="Interés por girar" valor={debeInteresInversor} />
            <Fila label="Capital por girar" valor={debeCapitalInversor} />
            <div className="border-t border-emerald-200 mt-1 pt-1">
              <Fila label="Total por girar" valor={debeAlInversor} negrita />
            </div>
            <p className="text-xs opacity-70 mt-1">
              Ya recibido: {formatoMoneda(interesGirado + capitalGirado)} girado + {formatoMoneda(directoTotal)} directo
            </p>
          </div>
        </div>
        <div className="bg-amber-50 text-amber-800 rounded-lg p-4">
          <p className="text-sm font-medium">3. Comisión administradora</p>
          <div className="mt-2">
            <Fila label="Cobrada (devengada)" valor={comisionAdminCobrada} />
            <Fila label="Retirada" valor={comisionRetirada} />
            <div className="border-t border-amber-200 mt-1 pt-1">
              <Fila label="Pendiente por retirar" valor={comisionPendiente} negrita />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 bg-gray-50 rounded-lg p-4 text-sm text-gray-700 space-y-1">
        <p className="font-medium text-gray-800">Relación entre administradora e inversor</p>
        <div className="flex justify-between">
          <span>Recibido por la administradora</span>
          <span className="font-semibold">{formatoMoneda(recibidoPorAdmin)}</span>
        </div>
        <div className="flex justify-between">
          <span>Recibido directo por el inversor (pagos de clientes)</span>
          <span className="font-semibold">{formatoMoneda(directoTotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Caja de la administradora (debe coincidir con la cuenta)</span>
          <span className="font-bold">{formatoMoneda(cajaAdmin)}</span>
        </div>
        <p className="border-t border-gray-200 pt-2 text-gray-800">
          {Math.abs(debeAlInversor) < 0.005 ? (
            'Cuentas al día: la administradora no le debe nada al inversor.'
          ) : debeAlInversor > 0 ? (
            <>
              Para dejar las cuentas en cero, la <b>administradora debe transferir {formatoMoneda(debeAlInversor)} al
              inversor</b> (se queda con su comisión pendiente de {formatoMoneda(comisionPendiente)}).
            </>
          ) : (
            <>
              Para dejar las cuentas en cero, el <b>inversor debe transferir {formatoMoneda(-debeAlInversor)} a la
              administradora</b>: recibió directo más de lo que le correspondía
              {directoComision > 0 ? ` (incluye ${formatoMoneda(directoComision)} de comisión de la administradora)` : ''}.
            </>
          )}
        </p>
        <p className="text-xs text-gray-500">
          Caja = recibido por la administradora − giros al inversor − comisión retirada. Es igual a lo que se le debe
          al inversor más la comisión pendiente por retirar.
        </p>
        {alertas.map((a) => (
          <p key={a} className="text-xs text-red-600">
            ⚠ {a}
          </p>
        ))}
      </div>

      <form onSubmit={registrar} className="flex flex-wrap gap-2 items-end mt-4">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Movimiento</label>
          <select
            className="border border-gray-300 rounded px-2 py-1.5"
            value={beneficiario}
            onChange={(e) => setBeneficiario(e.target.value as Beneficiario)}
          >
            <option value="inversor">Giro al inversor</option>
            <option value="admin">Retiro de comisión (administradora)</option>
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
        {beneficiario === 'inversor' ? (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Interés girado</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="border border-gray-300 rounded px-2 py-1.5 w-32"
                value={interes}
                onChange={(e) => setInteres(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Capital girado</label>
              <input
                type="number"
                min="0"
                step="0.01"
                className="border border-gray-300 rounded px-2 py-1.5 w-32"
                value={capital}
                onChange={(e) => setCapital(e.target.value)}
                placeholder="0.00"
              />
            </div>
          </>
        ) : (
          <div>
            <label className="block text-xs text-gray-500 mb-1">Monto</label>
            <input
              type="number"
              min="0"
              step="0.01"
              className="border border-gray-300 rounded px-2 py-1.5 w-32"
              value={montoAdmin}
              onChange={(e) => setMontoAdmin(e.target.value)}
              placeholder="0.00"
            />
          </div>
        )}
        <div className="flex-1 min-w-[150px]">
          <label className="block text-xs text-gray-500 mb-1">Notas</label>
          <input
            className="border border-gray-300 rounded px-2 py-1.5 w-full"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
          />
        </div>
        <button type="submit" className="px-4 py-1.5 rounded bg-indigo-600 text-white hover:bg-indigo-700">
          Registrar
        </button>
      </form>
      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}

      <div className="mt-3">
        <button
          onClick={() => setMostrarHistorial((v) => !v)}
          className="text-sm text-indigo-600 hover:underline"
        >
          {mostrarHistorial ? 'Ocultar' : 'Ver'} historial de movimientos ({historial.length})
        </button>
        {mostrarHistorial && (
          <ul className="divide-y divide-gray-100 mt-2">
            {historial.length === 0 && <p className="text-sm text-gray-500 py-2">Sin movimientos registrados.</p>}
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
                  {l.beneficiario === 'inversor' && (
                    <span className="text-gray-500">
                      {' '}
                      · interés {formatoMoneda(l.monto - (l.capital ?? 0))}
                      {l.capital ? ` + capital ${formatoMoneda(l.capital)}` : ''}
                    </span>
                  )}
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
