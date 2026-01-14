import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import os from 'os';

// Función para obtener la IP local
function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

const LOCAL_IP = getLocalIP();
const BACKEND_PORT = process.env.BACKEND_PORT || '3000';
const BACKEND_URL = process.env.BACKEND_URL || `http://${LOCAL_IP}:${BACKEND_PORT}`;

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Permite acceso desde la red local
    port: 5173,
    allowedHosts: [
      'impure-torri-waggish.ngrok-free.dev'
    ],

    proxy: {
      '/api': {
        target: BACKEND_URL,
        changeOrigin: true,
        rewrite: (path) => path,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log(`[Proxy] ${req.method} ${req.url} -> ${BACKEND_URL}${req.url}`);
          });
        }
      }
    }
  },
  // Exponer variables de entorno para el cliente
  define: {
    __BACKEND_IP__: JSON.stringify(LOCAL_IP),
    __BACKEND_URL__: JSON.stringify(BACKEND_URL)
  }
});
