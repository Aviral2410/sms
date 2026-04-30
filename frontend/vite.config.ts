import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react()],
    server: {
      host: '0.0.0.0',
      port: 3000,
      allowedHosts: ['.lvh.me', '.localtest.me', '.nip.io', '.sslip.io', 'localhost'],
      proxy: {
        '/api': {
          target: env.VITE_API_BASE_URL || 'http://localhost:8080',
          changeOrigin: true,
        },
        '/mcp-http': {
          target: env.VITE_MCP_BASE_URL || 'http://localhost:8084',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/mcp-http/, ''),
        },
      },
    },
    build: {
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) {
              return;
            }

            if (id.includes('/react/') || id.includes('/react-dom/') || id.includes('/scheduler/')) {
              return 'react-core';
            }

            if (id.includes('/react-router') || id.includes('/@remix-run/')) {
              return 'router';
            }

            if (id.includes('/framer-motion/')) {
              return 'motion';
            }

            if (id.includes('/recharts/')) {
              return 'charts';
            }

            if (id.includes('/katex/')) {
              return 'katex';
            }

            if (id.includes('/mqtt/')) {
              return 'mqtt';
            }

            if (id.includes('/lucide-react/')) {
              return 'icons';
            }

            if (id.includes('/zustand/') || id.includes('/sonner/') || id.includes('/cmdk/')) {
              return 'app-support';
            }
          },
        },
      },
    },
  };
});
