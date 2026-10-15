import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const api = 'http://localhost:3000';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5174,
        proxy: {
            '/api': {
                target: api,
                timeout: 0,
                proxyTimeout: 0,
            },
            '^/runs/[^/]+/(images|diffs)/': api,
        },
    },
});
