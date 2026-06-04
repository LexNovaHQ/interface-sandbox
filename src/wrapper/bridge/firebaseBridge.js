import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  firebaseConfig,
  getFirebaseConfigStatus
} from "../config/firebaseConfig.js";

let firebaseInitError = null;

export function getFirebaseApp() {
  const configStatus = getFirebaseConfigStatus();
  if (!configStatus.configured) return null;

  try {
    firebaseInitError = null;
    return getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  } catch (error) {
    firebaseInitError = error;
    return null;
  }
}

export function getFirestoreDb() {
  const app = getFirebaseApp();
  if (!app) return null;

  try {
    return getFirestore(app);
  } catch (error) {
    firebaseInitError = error;
    return null;
  }
}

export function getFirestoreBridgeStatus() {
  const configStatus = getFirebaseConfigStatus();
  if (!configStatus.configured) {
    return {
      initialized: false,
      label: "Not initialized",
      firebaseConfigStatus: configStatus,
      errorLabel: null
    };
  }

  const db = getFirestoreDb();

  return {
    initialized: Boolean(db),
    label: db ? "Ready" : "Not initialized",
    firebaseConfigStatus: configStatus,
    errorLabel: firebaseInitError ? "Initialization unavailable" : null
  };
}
