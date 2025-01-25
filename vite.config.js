import { defineConfig } from 'vite';
import path from "path";
import { version } from './package.json';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as childProcess from "child_process";

const commitHash = childProcess.execSync("git rev-parse --short HEAD").toString();

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
        }
    },
    server: {
        host: true,
    },
    plugins: [
        nodePolyfills(),
    ]
})
