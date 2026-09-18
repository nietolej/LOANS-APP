import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { initializeFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyAkpa_YR-HAd-tqcqI3NKx7ckc3l-b7x0U',
  authDomain: 'loanapp-86b68.firebaseapp.com',
  projectId: 'loanapp-86b68',
  storageBucket: 'loanapp-86b68.firebasestorage.app',
  messagingSenderId: '303177809036',
  appId: '1:303177809036:web:7ee4cfa366b346edb30fa9',
}

export const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
// ignoreUndefinedProperties: setDoc rechaza CUALQUIER campo con valor `undefined`
// (ej. "notas: notasPago.trim() || undefined" cuando el campo queda vacío al registrar
// un pago o una liquidación) con un FirebaseError que aborta todo el guardado. Como el
// estado local ya se actualiza de forma optimista ANTES de que termine la escritura
// (ver useAppData.ts:escribir), el usuario veía el pago "agregado" en pantalla aunque
// nunca llegara a persistir en Firestore, y desaparecía en el siguiente resync. Esta
// opción hace que el SDK omita esos campos en vez de rechazar el documento completo.
export const db = initializeFirestore(app, { ignoreUndefinedProperties: true })
