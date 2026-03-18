/**
 * FIREBASE CONFIG — MilApp
 *
 * Para activar la sincronización en la nube de Pergaminos y Emily Books,
 * establece las siguientes Secrets en Replit (menú Secrets / Variables de entorno):
 *
 *   FIREBASE_API_KEY        → tu apiKey de Firebase
 *   FIREBASE_AUTH_DOMAIN    → tu authDomain (ej. mi-proyecto.firebaseapp.com)
 *   FIREBASE_PROJECT_ID     → tu projectId
 *   FIREBASE_APP_ID         → tu appId
 *
 * Mientras no estén configuradas, Pergaminos funciona en modo solo-local
 * (localStorage) sin errores, sin necesidad de internet.
 */

/* Non-destructive: preserve any runtime-injected config (e.g. from Secrets) */
window.__firebase_config = window.__firebase_config || {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

window.__app_id = window.__firebase_config.appId || window.__app_id || "milapp-local";

/* CamelCase alias for backwards compatibility */
window.__firebaseConfig = window.__firebase_config;

window.__firebaseReady = false;
