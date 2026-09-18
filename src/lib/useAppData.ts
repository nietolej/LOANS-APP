import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData, Configuracion, Liquidacion, Pago, Prestamo } from '../types'
import { defaultData, guardarDatos, nuevoId, suscribirDatos } from './storage'

export function useAppData(uid: string) {
  const [data, setData] = useState<AppData>(defaultData)
  const [cargando, setCargando] = useState(true)
  // Antes un fallo de guardarDatos solo se logueaba en consola: el estado local ya se
  // había actualizado de forma optimista (línea de abajo), así que el usuario veía el
  // cambio "aplicado" en pantalla aunque nunca se hubiera escrito en Firestore, y
  // desaparecía en el siguiente resync sin ninguna señal visible del error real.
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)
  const dataRef = useRef(data)
  useEffect(() => {
    dataRef.current = data
  }, [data])

  useEffect(() => {
    setCargando(true)
    const unsubscribe = suscribirDatos(
      uid,
      (nuevaData) => {
        setData(nuevaData)
        setCargando(false)
      },
      (error) => {
        console.error('Error al sincronizar datos:', error)
        setCargando(false)
      },
    )
    return unsubscribe
  }, [uid])

  const escribir = useCallback(
    (nuevaData: AppData) => {
      setData(nuevaData)
      setErrorGuardado(null)
      guardarDatos(uid, nuevaData).catch((error: unknown) => {
        console.error('Error al guardar:', error)
        const mensaje = error instanceof Error ? error.message : String(error)
        setErrorGuardado(
          `No se pudo guardar el último cambio en la nube: ${mensaje}. Revisa tu conexión y vuelve a intentarlo; ` +
            'si recargas la página ahora, este cambio se perderá.',
        )
      })
    },
    [uid],
  )

  const descartarErrorGuardado = useCallback(() => setErrorGuardado(null), [])

  const agregarPrestamo = useCallback(
    (prestamo: Omit<Prestamo, 'id' | 'creadoEn'>) => {
      escribir({
        ...dataRef.current,
        prestamos: [
          ...dataRef.current.prestamos,
          { ...prestamo, id: nuevoId(), creadoEn: new Date().toISOString() },
        ],
      })
    },
    [escribir],
  )

  const actualizarPrestamo = useCallback(
    (id: string, cambios: Partial<Prestamo>) => {
      escribir({
        ...dataRef.current,
        prestamos: dataRef.current.prestamos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
      })
    },
    [escribir],
  )

  const eliminarPrestamo = useCallback(
    (id: string) => {
      escribir({
        ...dataRef.current,
        prestamos: dataRef.current.prestamos.filter((p) => p.id !== id),
        pagos: dataRef.current.pagos.filter((p) => p.prestamoId !== id),
      })
    },
    [escribir],
  )

  const agregarPago = useCallback(
    (pago: Omit<Pago, 'id'>) => {
      escribir({
        ...dataRef.current,
        pagos: [...dataRef.current.pagos, { ...pago, id: nuevoId() }],
      })
    },
    [escribir],
  )

  const actualizarPago = useCallback(
    (id: string, cambios: Partial<Omit<Pago, 'id' | 'prestamoId'>>) => {
      escribir({
        ...dataRef.current,
        pagos: dataRef.current.pagos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
      })
    },
    [escribir],
  )

  const eliminarPago = useCallback(
    (id: string) => {
      escribir({
        ...dataRef.current,
        pagos: dataRef.current.pagos.filter((p) => p.id !== id),
      })
    },
    [escribir],
  )

  const agregarLiquidacion = useCallback(
    (liquidacion: Omit<Liquidacion, 'id'>) => {
      escribir({
        ...dataRef.current,
        liquidaciones: [...dataRef.current.liquidaciones, { ...liquidacion, id: nuevoId() }],
      })
    },
    [escribir],
  )

  const eliminarLiquidacion = useCallback(
    (id: string) => {
      escribir({
        ...dataRef.current,
        liquidaciones: dataRef.current.liquidaciones.filter((l) => l.id !== id),
      })
    },
    [escribir],
  )

  const actualizarConfiguracion = useCallback(
    (cambios: Partial<Configuracion>) => {
      escribir({
        ...dataRef.current,
        configuracion: { ...dataRef.current.configuracion, ...cambios },
      })
    },
    [escribir],
  )

  const aplicarComisionATodos = useCallback(
    (comisionAdmin: number) => {
      escribir({
        ...dataRef.current,
        prestamos: dataRef.current.prestamos.map((p) => ({ ...p, comisionAdmin })),
      })
    },
    [escribir],
  )

  const importarDatos = useCallback(
    (nuevaData: AppData) => {
      escribir(nuevaData)
    },
    [escribir],
  )

  return {
    data,
    cargando,
    errorGuardado,
    descartarErrorGuardado,
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    agregarPago,
    actualizarPago,
    eliminarPago,
    agregarLiquidacion,
    eliminarLiquidacion,
    actualizarConfiguracion,
    aplicarComisionATodos,
    importarDatos,
  }
}
