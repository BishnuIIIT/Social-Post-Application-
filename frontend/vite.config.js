/**
 * @file vite.config.js
 * @description Vite build configuration for the Pulse Social frontend.
 *
 * - Enables React JSX transforms via @vitejs/plugin-react
 * - Sets up CSS Modules with camelCase class name convention
 */

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [
    // Enables fast-refresh and the automatic JSX runtime
    react(),
  ],
  css: {
    modules: {
      // Use camelCase for CSS Module class names (e.g. styles.postCard)
      localsConvention: "camelCase",
    },
  },
});
