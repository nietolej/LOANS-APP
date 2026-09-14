import { useCallback, useEffect, useState } from 'react'
import type { AppData, Configuracion, Pago, Prestamo } from '../types'
import { cargarDatos, guardarDatos, nuevoId } from './storage'

export function useAppData() {
  const [data, setData] = useState<AppData>(() => cargarDatos())

  useEffect(() => {
    guardarDatos(data)
  }, [data])

  const agregarPrestamo = useCallback((prestamo: Omit<Prestamo, 'id' | 'creadoEn'>) => {
    setData((prev) => ({
      ...prev,
      prestamos: [
        ...prev.prestamos,
        { ...prestamo, id: nuevoId(), creadoEn: new Date().toISOString() },
      ],
    }))
  }, [])

  const actualizarPrestamo = useCallback((id: string, cambios: Partial<Prestamo>) => {
    setData((prev) => ({
      ...prev,
      prestamos: prev.prestamos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
    }))
  }, [])

  const eliminarPrestamo = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      prestamos: prev.prestamos.filter((p) => p.id !== id),
      pagos: prev.pagos.filter((p) => p.prestamoId !== id),
    }))
  }, [])

  const agregarPago = useCallback((pago: Omit<Pago, 'id'>) => {
    setData((prev) => ({
      ...prev,
      pagos: [...prev.pagos, { ...pago, id: nuevoId() }],
    }))
  }, [])

  const actualizarPago = useCallback((id: string, cambios: Partial<Omit<Pago, 'id' | 'prestamoId'>>) => {
    setData((prev) => ({
      ...prev,
      pagos: prev.pagos.map((p) => (p.id === id ? { ...p, ...cambios } : p)),
    }))
  }, [])

  const eliminarPago = useCallback((id: string) => {
    setData((prev) => ({
      ...prev,
      pagos: prev.pagos.filter((p) => p.id !== id),
    }))
  }, [])

  const actualizarConfiguracion = useCallback((cambios: Partial<Configuracion>) => {
    setData((prev) => ({
      ...prev,
      configuracion: { ...prev.configuracion, ...cambios },
    }))
  }, [])

  const aplicarComisionATodos = useCallback((comisionAdmin: number) => {
    setData((prev) => ({
      ...prev,
      prestamos: prev.prestamos.map((p) => ({ ...p, comisionAdmin })),
    }))
  }, [])

  return {
    data,
    agregarPrestamo,
    actualizarPrestamo,
    eliminarPrestamo,
    agregarPago,
    actualizarPago,
    eliminarPago,
    actualizarConfiguracion,
    aplicarComisionATodos,
  }
}
