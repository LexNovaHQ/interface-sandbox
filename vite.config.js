import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { getHealthPayload, getMockPayload } from "./functions/_shared/mockData.js";

function sendJson(response, payload, status = 200) {
  response.statusCode = status;
  response.setHeader("content-type", "application/json; charset=utf-8");
  response.end(JSON.stringify(payload, null, 2));
}

function mockApiMiddleware() {
  return {
    name: "lexnova-mock-api",
    configureServer(server) {
      server.middlewares.use("/api", (request, response, next) => {
        const path = request.url.split("?")[0].replace(/^\//, "");

        if (path === "health") {
          if (request.method !== "GET") {
            sendJson(response, { ok: false, phase: "skeleton", message: "Method not allowed. Use GET." }, 405);
            return;
          }

          sendJson(response, getHealthPayload());
          return;
        }

        const endpoints = new Set([
          "diligence-url",
          "diligence-text",
          "assembly",
          "delivery",
          "maintenance"
        ]);

        if (!endpoints.has(path)) {
          next();
          return;
        }

        if (request.method !== "POST") {
          sendJson(response, { ok: false, phase: "skeleton", message: "Method not allowed. Use POST." }, 405);
          return;
        }

        sendJson(response, {
          ok: true,
          phase: "skeleton",
          message: "Mock response only. Engine logic pending.",
          data: getMockPayload(path)
        });
      });
    }
  };
}

export default defineConfig({
  plugins: [react(), mockApiMiddleware()],
  server: {
    port: 5173
  },
  build: {
    outDir: "dist"
  }
});
