import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'

// DeviceMotion and vibration need a secure context on phones.
// `npm run dev:https` serves over HTTPS with a self-signed cert for LAN testing.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), ...(process.env.HTTPS ? [basicSsl()] : [])],
})
