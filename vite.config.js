const { defineConfig } = require("vite");
const react = require("@vitejs/plugin-react");

module.exports = defineConfig({
  plugins: [react()],
  root: "frontend",
  server: {
    proxy: { "/api": "http://localhost:3000" }
  },
  build: { outDir: "dist", emptyOutDir: true }
});
