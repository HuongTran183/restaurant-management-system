import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  const frontendPort = Number(env.APP_FRONTEND_PORT ?? env.VITE_DEV_PORT ?? '15173');
  const previewPort = Number(env.APP_FRONTEND_PREVIEW_PORT ?? env.VITE_PREVIEW_PORT ?? '14173');
  const backendPort = env.APP_BACKEND_PORT ?? '18080';
  const apiProxyTarget =
    env.VITE_API_PROXY_TARGET ?? env.VITE_API_BASE_URL ?? `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [react()],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: frontendPort,
      host: '0.0.0.0',
      proxy: {
        // Host và compose đều dùng bộ port riêng của repo để giảm đụng độ với dự án khác.
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          configure: (proxy) => {
            (proxy as any).on('proxyReq', (proxyReq: any) => {
              proxyReq.removeHeader('origin');
              proxyReq.removeHeader('Origin');
            });
          },
        },
        '/ws': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
        },
      },
    },
    preview: {
      port: previewPort,
      host: '0.0.0.0',
    },
  };
});
