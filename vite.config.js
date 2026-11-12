import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const base = process.env.GITHUB_ACTIONS && repositoryName ? `/${repositoryName}/` : '/';
const projectRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
    base,
    plugins: [vue(), react()],
    build: {
        rollupOptions: {
            input: {
                index: resolve(projectRoot, 'index.html'),
                login: resolve(projectRoot, 'login.html'),
                registro: resolve(projectRoot, 'registro.html')
            }
        }
    }
});
