import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
    plugins: [
        laravel({
            input: 'resources/js/app.jsx',
            refresh: true,
        }),
        react(),
    ],

    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
            'next/image': resolve(__dirname, 'resources/js/Providers/AlagaLink/next-image.tsx'),
        },
    },

    server: {
        host: true,
        port: 5173,
        strictPort: true,
        origin: 'http://localhost:5173',
        cors: {
            origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
            credentials: true,
        },
        hmr: {
            host: 'localhost',
            port: 5173,
        },
    },
});
