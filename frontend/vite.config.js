import { fileURLToPath, URL } from 'node:url'
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import Sitemap from 'vite-plugin-sitemap'
import { createHtmlPlugin } from 'vite-plugin-html'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
    // Load env file based on the current mode
    const env = loadEnv(mode, process.cwd(), '');

    return {
        server: {
            port: 8080,
        },
        css: {
            preprocessorOptions: {
                scss: {
                    additionalData: `
            @import "@/assets/scss/_mixins.scss";
            @import "@/assets/scss/_variables.scss";
          `,
                },
            },
        },
        plugins: [
            vue(),
            createHtmlPlugin({
                minify: true,
                inject: {
                    data: {
                        name: env.VITE_APP_NAME, // Access environment variables here
                    },
                },
            }),
            Sitemap({
                hostname: 'https://meme-generator.milovanderpas.nl',
                dynamicRoutes: ['/'],
            }),
        ],
        resolve: {
            alias: {
                '~bootstrap': fileURLToPath(new URL('./node_modules/bootstrap', import.meta.url)),
                '@': fileURLToPath(new URL('./src', import.meta.url)),
                '@fonts': fileURLToPath(new URL('./src/assets/fonts', import.meta.url)),
            },
        },
        define: {
            __VUE_I18N_FULL_INSTALL__: true,
            __VUE_I18N_LEGACY_API__: false,
            'process.env': {}, // Ensure that process.env is not undefined to avoid errors in some packages
        },
    };
});
