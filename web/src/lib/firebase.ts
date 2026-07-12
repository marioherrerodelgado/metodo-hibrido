import { getApp, getApps, initializeApp, type FirebaseOptions } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// La configuración web de Firebase es pública por diseño (va en el bundle).
// Los valores por defecto son los del proyecto actual `elmetodohibrido`, para
// que la app arranque sin .env; se pueden sobreescribir con variables NEXT_PUBLIC_.
const firebaseConfig: FirebaseOptions = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyA9M9oB4pfovY0Lj-HdfrQxxkp5pzbEd4Q",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ??
    "elmetodohibrido.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "elmetodohibrido",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "elmetodohibrido.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "283253527108",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:283253527108:web:8a64bbf9b72fb40756e211",
};

export const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);

/** Mensajes de error de Firebase Auth traducidos al castellano. */
export function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Email o contraseña incorrectos.";
    case "auth/invalid-email":
      return "Ese email no es válido.";
    case "auth/email-already-in-use":
      return "Ya existe una cuenta con este email.";
    case "auth/weak-password":
      return "La contraseña debe tener al menos 6 caracteres.";
    case "auth/too-many-requests":
      return "Demasiados intentos. Espera unos minutos.";
    case "auth/network-request-failed":
      return "Sin conexión. Revisa tu red.";
    case "auth/popup-closed-by-user":
      return "Has cerrado la ventana antes de terminar.";
    case "auth/operation-not-allowed":
      return "Este método de acceso no está habilitado en Firebase.";
    default:
      return "No hemos podido completar la operación. Inténtalo de nuevo.";
  }
}
