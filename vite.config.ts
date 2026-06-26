import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const root = dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    // `@` points at the project root so `@/components`, `@/lib`, … resolve the
    // same way the tsconfig path alias (`"@/*": ["./*"]`) does.
    alias: {
      '@': resolve(root),
    },
  },
})
