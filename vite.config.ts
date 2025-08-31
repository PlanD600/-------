import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
        plugins: [react()],
        base: '/', // base path
        server: {
            proxy: {
                '/api': {
                    target: 'https://api.mypland.com',
                    changeOrigin: true,
                },
                '/socket.io': {
                    target: 'wss://api.mypland.com',
                    ws: true,
                },
            },
            historyApiFallback: true, // fallback לניווט SPA
        },
        define: {
            'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
            'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
        },
        resolve: {
            alias: {
                '@': path.resolve(__dirname, '.'),
            }
        }
    };
});