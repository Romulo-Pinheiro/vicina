import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy para a API local: evita configurar CORS em dev e mantém as
    // chamadas do frontend com o mesmo path relativo (/api/...) que será
    // usado em produção (services/ chama /api/... independente do ambiente).
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
});
