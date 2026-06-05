const viteEnv = import.meta.env || {};

const FIREBASE_ENV_KEYS = Object.freeze([
  "VITE_FIREBASE_API_KEY=AIzaSyBWRHeqezVc25TaNt8-rIUQh38WaLVTCo8",
  "VITE_FIREBASE_AUTH_DOMAIN=lexnova-hq.firebaseapp.com",
  "VITE_FIREBASE_PROJECT_ID=lexnova-hq",
  "VITE_FIREBASE_STORAGE_BUCKET=lexnova-hq.firebasestorage.app",
  "VITE_FIREBASE_MESSAGING_SENDER_ID=539475214055",
  "VITE_FIREBASE_APP_ID=1:539475214055:web:4ed5eeea7bc4ac5b9b6c42",
  "VITE_FIREBASE_MEASUREMENT_ID"
]);

export const firebaseConfig = Object.freeze({
  apiKey: viteEnv.VITE_FIREBASE_API_KEY || "",
  authDomain: viteEnv.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: viteEnv.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: viteEnv.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: viteEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: viteEnv.VITE_FIREBASE_APP_ID || "",
  measurementId: viteEnv.VITE_FIREBASE_MEASUREMENT_ID || ""
});

export function getFirebaseConfigStatus() {
  const missingVariables = FIREBASE_ENV_KEYS.filter((key) => !viteEnv[key]);
  const configured = missingVariables.length === 0;

  return {
    configured,
    label: configured ? "Connected" : "Missing config",
    missingVariables,
    projectId: firebaseConfig.projectId ? "present" : "missing",
    projectIdPresent: Boolean(firebaseConfig.projectId),
    requiredVariables: [...FIREBASE_ENV_KEYS]
  };
}
