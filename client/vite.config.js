import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const githubPagesBase =
  process.env.GITHUB_PAGES === 'true' && repositoryName && !repositoryName.endsWith('.github.io')
    ? `/${repositoryName}/`
    : '/';

export default defineConfig({
  base: githubPagesBase,
  plugins: [react()],
  define: {
    'process.env.IS_PREACT': JSON.stringify('true'),
    'process.env': {}
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  optimizeDeps: {
    include: ['@excalidraw/excalidraw']
  }
});
