import { initializeApp, getApps } from "firebase/app";
import { doc, getFirestore, serverTimestamp, setDoc } from "firebase/firestore";

const FIREBASE_ENV_KEYS = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID"
];

const MATTER_COLLECTION = "interview_os_matters";
const LOCAL_STORAGE_KEY = "legal_diligence_assembly_os_matters";

function readEnv(key) {
  return import.meta.env?.[key] || "";
}

function hasFirebaseConfig() {
  return FIREBASE_ENV_KEYS.every((key) => Boolean(readEnv(key)));
}

function getFirebaseConfig() {
  return {
    apiKey: readEnv("VITE_FIREBASE_API_KEY"),
    authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
    projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
    storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
    messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
    appId: readEnv("VITE_FIREBASE_APP_ID")
  };
}

function getFirestoreDb() {
  if (!hasFirebaseConfig()) return null;
  const app = getApps().length ? getApps()[0] : initializeApp(getFirebaseConfig());
  return getFirestore(app);
}

function slugify(value) {
  return String(value || "matter")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 54) || "matter";
}

function safeJsonClone(value) {
  return JSON.parse(JSON.stringify(value || {}));
}

export function getMatterStoreStatus() {
  const missing = FIREBASE_ENV_KEYS.filter((key) => !readEnv(key));
  return {
    firebase_enabled: missing.length === 0,
    collection: MATTER_COLLECTION,
    fallback: missing.length ? "localStorage" : null,
    missing_env: missing
  };
}

export function createMatterId({ targetProfile, runId }) {
  const company = targetProfile?.company_name || targetProfile?.company || targetProfile?.target || "review-target";
  const run = runId || targetProfile?.run_id || Date.now();
  return `${slugify(company)}-${slugify(run)}`.slice(0, 120);
}

function readLocalMatters() {
  try {
    return JSON.parse(window.localStorage.getItem(LOCAL_STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeLocalMatter(matterId, matter) {
  const existing = readLocalMatters();
  existing[matterId] = matter;
  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(existing));
}

export async function saveMatterSnapshot(input = {}) {
  const now = new Date().toISOString();
  const matterId = input.matter_id || createMatterId({
    targetProfile: input.target_profile,
    runId: input.run_id
  });

  const matter = {
    ...safeJsonClone(input),
    matter_id: matterId,
    os_name: "Legal Diligence & Assembly OS",
    updated_at: now,
    created_at: input.created_at || now
  };

  const db = getFirestoreDb();
  if (!db) {
    writeLocalMatter(matterId, matter);
    return {
      ok: true,
      mode: "localStorage",
      collection: MATTER_COLLECTION,
      matter_id: matterId,
      warning: "Firebase env config was not available at runtime, so the matter was stored locally for demo continuity."
    };
  }

  await setDoc(
    doc(db, MATTER_COLLECTION, matterId),
    {
      ...matter,
      server_updated_at: serverTimestamp()
    },
    { merge: true }
  );

  return {
    ok: true,
    mode: "firestore",
    collection: MATTER_COLLECTION,
    matter_id: matterId
  };
}
