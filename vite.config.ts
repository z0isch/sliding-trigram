import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwind()],
  base: "/sliding-trigram/",
  server: {
    port: 3000,
    open: true,
  },
});
