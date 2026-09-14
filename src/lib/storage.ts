import type { AppData } from '../types'

const STORAGE_KEY = 'loans-app-data-v1'

const defaultData: AppData = {
  prestamos: [],
  pagos: [],
  configuracion: {
    nombreAdmin: 'Administrador',
    comisionAdminDefault: 25,
  },
}

export function cargarDatos(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultData
    const parsed = JSON.parse(raw)
    return {
      prestamos: parsed.prestamos ?? [],
      // Pagos registrados antes de distinguir capital/interés se tratan como
      // abono a capital, para preservar el comportamiento previo (reducían el saldo total).
      pagos: (parsed.pagos ?? []).map((p: AppData['pagos'][number]) => ({
        ...p,
        tipo: p.tipo ?? 'capital',
      })),
      configuracion: { ...defaultData.configuracion, ...parsed.configuracion },
    }
  } catch {
    return defaultData
  }
}

export function guardarDatos(data: AppData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
