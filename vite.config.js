import { defineConfig } from 'vite';
import path from 'path';
import { version } from './package.json';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as childProcess from 'child_process';
import { viteStaticCopy } from 'vite-plugin-static-copy';

const commitHash = childProcess.execSync('git rev-parse --short HEAD').toString();

// Plugin to remove canonical link in dev mode
function removeCanonicalInDev() {
    return {
        name: 'remove-canonical-in-dev',
        configureServer(server) {
            // Disable caching for HTML in dev mode to prevent stale canonical links
            server.middlewares.use((req, res, next) => {
                if (req.url === '/' || req.url === '/index.html' || req.url?.endsWith('.html')) {
                    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
                    res.setHeader('Pragma', 'no-cache');
                    res.setHeader('Expires', '0');
                }
                next();
            });
        },
        transformIndexHtml: {
            order: 'pre',
            handler(html, ctx) {
                // Only remove canonical link in dev mode
                if (ctx.server) {
                    return html.replace(/<link[^>]+rel=["']canonical["'][^>]*>/gi, '');
                }
                return html;
            }
        }
    };
}

export default defineConfig({
    define: {
        GAME_VERSION: JSON.stringify(version),
        COMMIT_HASH: JSON.stringify(commitHash),
    },
    build: {
        outDir: path.resolve(__dirname, 'build'),
        terserOptions: {
            ecma: 6,
            compress: { drop_console: true },
            output: { comments: false, beautify: false },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        },
    },
    server: {
        host: true,
    },
    plugins: [
        removeCanonicalInDev(),
        nodePolyfills(),
        viteStaticCopy({
            targets: [
                {
                    src: 'src/config.json',
                    dest: '.',
                },
            ],
        }),
    ],
});
