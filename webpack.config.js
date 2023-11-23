const webpack = require('webpack');
const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const NodePolyfillPlugin = require('node-polyfill-webpack-plugin');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = (env, argv) => {
    const isProduction = argv.mode !== 'development';

    return {
        entry: './client/gui/render.js',
        mode: 'production',

        output: {
            path: path.resolve(__dirname, 'build'),
            filename: 'bundle.js',
        },

        resolve: {
            alias: isProduction
                ? {
                      'pixi.js': path.resolve(__dirname, 'node_modules/pixi.js/dist/pixi.min.js'),
                  }
                : {},
        },

        devServer: {
            compress: true,
            static: false,
            client: {
                logging: 'warn',
                overlay: {
                    errors: true,
                    warnings: false,
                },
                progress: true,
            },
            port: 1234,
            host: '0.0.0.0',
        },

        performance: { hints: false },

        devtool: !isProduction ? 'eval-source-map' : undefined,

        optimization: {
            minimize: isProduction,
            minimizer: [
                new TerserPlugin({
                    terserOptions: {
                        ecma: 6,
                        compress: { drop_console: true },
                        output: { comments: false, beautify: false },
                    },
                }),
            ],
        },

        plugins: [
            new CopyPlugin({
                patterns: [
                    { from: 'img/', to: 'img/' },
                    { from: 'style.css', to: 'style.css' },
                ],
            }),
            new HtmlWebpackPlugin({
                template: 'index.ejs',
                hash: true,
                minify: false,
            }),
            new NodePolyfillPlugin(),
            // new BundleAnalyzerPlugin(),
        ],
    };
};
