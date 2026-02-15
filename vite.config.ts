
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // GitHub Pages 등 서브디렉토리 배포 대응
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
  }
});
