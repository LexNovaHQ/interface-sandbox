import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import {
  firebaseConfig,
  getFirebaseConfigStatus
} from "../config/firebaseConfig.js";
import { COLLECTIONS } from "../contracts/handoffEnvelope.js";

let firebaseInitError = null;

function safeErrorMessage(error) {
  if (!error) return "";
  return error.code || error.name || "Initialization unavailable";
}

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
      firebase_app: "missing_config",
      firestore_db: "not_initialized",
      project_id_present: configStatus.projectIdPresent,
      firebaseConfigStatus: configStatus,
      error_message: ""
    };
  }

  const db = getFirestoreDb();
  const hasError = Boolean(firebaseInitError);

  return {
    initialized: Boolean(db),
    label: db ? "Ready" : "Not initialized",
    firebase_app: hasError ? "error" : "initialized",
    firestore_db: hasError ? "error" : db ? "ready" : "not_initialized",
    project_id_present: configStatus.projectIdPresent,
    firebaseConfigStatus: configStatus,
    error_message: safeErrorMessage(firebaseInitError)
  };
}

export function getFirestoreCollectionNames() {
  return [...COLLECTIONS];
}
