import { defineConfig } from 'vite';
import path from "path";
import { version } from './package.json';
import { createHtmlPlugin } from 'vite-plugin-html';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig({
    define: {
        GAME_VERSION: JSON.stringify(version),
    },
    // TODO: Use pixi.min.js in prod
    // resolve: {
    //     alias: isProduction
    //         ? {
    //             'pixi.js': path.resolve(__dirname, 'node_modules/pixi.js/dist/pixi.min.js'),
    //         }
    //         : {},
    // },
    build: {
        outDir: path.resolve(__dirname, 'build'),
        terserOptions: {
            ecma: 6,
            compress: { drop_console: true },
            output: { comments: false, beautify: false },
        },
        commonjsOptions: {
            transformMixedEsModules: true,
        }
    },
    plugins: [
        // TODO: "Before you use this plugin, consider using public directory or import in JavaScript. In most cases, these will work."
        viteStaticCopy({
            targets: [
                { src: 'img/', dest: '.' },
                { src: 'style.css', dest: '.' },
            ]
        }),
        createHtmlPlugin({
            entry: './client/gui/render.js',
            template: 'index.ejs',
            minify: false,            
        }),
        nodePolyfills(),
    ]
})
