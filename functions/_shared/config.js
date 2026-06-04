export function getRuntimeConfig(env = {}) {
  return {
    app: "interface-sandbox",
    env: env.APP_ENV || "demo",
    phase: "wrapper-batch-1",
    backend: {
      database: "firebase-firestore",
      connected: false
    }
  };
}
