import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' uses relative asset paths, so the build works at
// https://USERNAME.github.io/REPOSITORY-NAME/ without editing anything.
export default defineConfig({
  plugins: [react()],
  base: './',
})
