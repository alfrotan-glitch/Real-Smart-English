// vite.config.ts
// ============================================================================
// Real Smart English Studio — Vite Production Config (2025 Ready)
// Clean aliasing (@ → src), strict dev server, safe env exposure.
// ============================================================================

import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";

// ESM-safe dirname; بدون نیاز به 'path'
const __dirname = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  // فقط کلیدهای VITE_* به کلاینت می‌رسند
  const env = loadEnv(mode, process.cwd(), "VITE_");
  void env; // اگر لازم شد بعدا به define اضافه کن

  return {
    plugins: [react()],
    resolve: {
      alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url)),
      },
    },
    server: {
      host: "0.0.0.0",
      port: 5173,
      open: false,
      strictPort: true,
    },
    envPrefix: "VITE_", // پیش‌فرض هم همین است، صریح گذاشتیم برای وضوح
    define: {
      __APP_ENV__: JSON.stringify(mode),
    },
    build: {
      outDir: "dist",
      target: "esnext",
      sourcemap: false,
      emptyOutDir: true,
      rollupOptions: {
        output: {
          // یک چانک vendor ساده و قابل پیش‌بینی
          manualChunks: {
            vendor: ["react", "react-dom", "zustand"],
          },
        },
      },
    },
    optimizeDeps: {
      include: ["react", "react-dom", "zustand"],
    },
  };
});
