import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import process from "node:process";

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const env = loadEnv(mode, process.cwd(), "");
  if (command === "build") {
    let api;
    try {
      api = new URL(env.VITE_API_URL);
    } catch {
      throw new Error("Preencha VITE_API_URL em .env.production com a URL HTTPS real da API.");
    }
    if (api.protocol !== "https:" || ["localhost", "127.0.0.1", "[::1]"].includes(api.hostname) || api.username || api.password || api.search || api.hash || api.pathname !== "/") {
      throw new Error("VITE_API_URL de produção deve ser uma origem HTTPS pública, sem caminho ou credenciais.");
    }
  }
  return {
    base: "/tecti/2026/gpec01/",
    plugins: [react()],
  };
});
