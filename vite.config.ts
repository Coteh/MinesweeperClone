import { defineConfig } from 'vite';
import path from 'path';
import { version } from './package.json';
import { nodePolyfills } from 'vite-plugin-node-polyfills';
import * as childProcess from 'child_process';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import { removeCanonicalInDev } from './plugins/remove-canonical-in-dev';
import { loadEnv } from 'vite';

const commitHash = childProcess.execSync('git rev-parse --short HEAD').toString();

export default defineConfig(({ mode }) => {
    // Load env file based on `mode` in the current working directory.
    // Set the third parameter to '' to load all env regardless of the `VITE_` prefix.
    const env = loadEnv(mode, process.cwd(), '');
    return {
        define: {
            GAME_VERSION: JSON.stringify(version),
            COMMIT_HASH: JSON.stringify(commitHash),
        },
        build: {
            outDir: path.resolve(__dirname, 'build'),
            terserOptions: {
                ecma: 2015,
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
            removeCanonicalInDev({
                environment: env.DEPLOY_ENV || '',
            }),
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
    };
});
