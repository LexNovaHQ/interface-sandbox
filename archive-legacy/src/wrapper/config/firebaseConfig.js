const viteEnv = import.meta.env || {};

const REQUIRED_FIREBASE_ENV_KEYS = Object.freeze([
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
]);

const OPTIONAL_FIREBASE_ENV_KEYS = Object.freeze([
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
  const missingVariables = REQUIRED_FIREBASE_ENV_KEYS.filter((key) => !viteEnv[key]);
  const missingOptionalVariables = OPTIONAL_FIREBASE_ENV_KEYS.filter((key) => !viteEnv[key]);
  const configured = missingVariables.length === 0;

  return {
    configured,
    label: configured ? "Connected" : "Missing config",
    missingVariables,
    missingOptionalVariables,
    projectId: firebaseConfig.projectId ? "present" : "missing",
    projectIdPresent: Boolean(firebaseConfig.projectId),
    requiredVariables: [...REQUIRED_FIREBASE_ENV_KEYS],
    optionalVariables: [...OPTIONAL_FIREBASE_ENV_KEYS]
  };
}
