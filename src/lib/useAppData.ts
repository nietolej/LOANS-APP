import { useCallback, useEffect, useRef, useState } from 'react'
import type { AppData, Configuracion, Pago, Prestamo } from '../types'
import { defaultData, guardarDatos, nuevoId, suscribirDatos } from './storage'

export function useAppData(uid: string) {
  const [data, setData] = useState<AppData>(defaultData)
  const [cargando, setCargando] = useState(true)
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
      guardarDatos(uid, nuevaData).catch((error) => console.error('Error al guardar:', error))
    },
    [uid],
  )

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
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    agregarPago,
    actualizarPago,
    eliminarPago,
    actualizarConfiguracion,
    aplicarComisionATodos,
    importarDatos,
  }
}
