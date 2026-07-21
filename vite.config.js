import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Source maps so production console errors show real file/line names
    // instead of minified identifiers like "r is not a function".
    sourcemap: true,
    // TEMPORARY (debugging): disable minification so the deployed bundle keeps
    // real function/component names in error messages and stack traces.
    // Re-enable (remove this line) once the bug is found.
    minify: false,
  },
})
