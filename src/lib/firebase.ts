import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

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
export const db = getFirestore(app)
