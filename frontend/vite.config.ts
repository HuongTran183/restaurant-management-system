import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    proxy: {
      // Tránh CORS khi gọi API từ browser (đặc biệt trong e2e khi chạy nhiều port).
      // Chuyển tiếp mọi request bắt đầu bằng `/api` sang backend.
      '/api': {
        target: process.env.VITE_API_PROXY_TARGET ?? 'http://127.0.0.1:18080',
        changeOrigin: true,
        configure: (proxy) => {
          // backend đang reject theo Origin (403 Invalid CORS request) nên gỡ Origin header
          // để proxy chuyển request như một request "không-CORS" (tương tự khi gọi từ server).
          proxy.on('proxyReq', (proxyReq) => {
            proxyReq.removeHeader('origin');
            proxyReq.removeHeader('Origin');
          });
        },
      },
    },
  },
  preview: {
    port: 4173,
    host: '0.0.0.0',
  },
});
