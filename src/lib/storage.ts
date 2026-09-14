import { doc, onSnapshot, setDoc, type Unsubscribe } from 'firebase/firestore'
import type { AppData } from '../types'
import { db } from './firebase'

const STORAGE_KEY = 'loans-app-data-v1'

export const defaultData: AppData = {
  prestamos: [],
  pagos: [],
  configuracion: {
    nombreAdmin: 'Administrador',
    comisionAdminDefault: 25,
  },
}

function normalizar(parsed: Partial<AppData> | undefined): AppData {
  return {
    prestamos: parsed?.prestamos ?? [],
    // Pagos registrados antes de distinguir capital/interés se tratan como
    // abono a capital, para preservar el comportamiento previo (reducían el saldo total).
    pagos: (parsed?.pagos ?? []).map((p) => ({
      ...p,
      tipo: p.tipo ?? 'capital',
    })),
    configuracion: { ...defaultData.configuracion, ...parsed?.configuracion },
  }
}

/** Datos que hayan quedado en el localStorage de este navegador de antes de usar Firestore. */
export function leerDatosLocalesPendientes(): AppData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return normalizar(JSON.parse(raw))
  } catch {
    return null
  }
}

export function limpiarDatosLocales() {
  localStorage.removeItem(STORAGE_KEY)
}

function docPorUsuario(uid: string) {
  return doc(db, 'usuarios', uid)
}

/** Escucha los datos del usuario en tiempo real; se actualizan en todos los dispositivos. */
export function suscribirDatos(
  uid: string,
  onDatos: (data: AppData) => void,
  onError: (error: Error) => void,
): Unsubscribe {
  return onSnapshot(
    docPorUsuario(uid),
    (snap) => {
      onDatos(snap.exists() ? normalizar(snap.data() as Partial<AppData>) : defaultData)
    },
    onError,
  )
}

export async function guardarDatos(uid: string, data: AppData) {
  await setDoc(docPorUsuario(uid), data)
}

export function nuevoId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID()
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}
