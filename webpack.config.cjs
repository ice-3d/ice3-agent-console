const path = require('node:path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = (env = {}) => ({
  entry: './src/entries/boot.ts',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'boot.[contenthash].js',
    publicPath: 'auto',
    clean: true,
  },
  resolve: {
    extensions: ['.ts', '.js'],
    extensionAlias: {
      '.js': ['.ts', '.js'],
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'esbuild-loader',
          options: { target: 'es2022' },
        },
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, 'public/index.html'),
    }),
    new webpack.DefinePlugin({
      __ICE_DEMO__: JSON.stringify(Boolean(env.demo)),
    }),
  ],
  devServer: {
    host: '127.0.0.1',
    port: 8110,
    historyApiFallback: true,
    static: [
      {
        directory: path.resolve(__dirname, 'public'),
        publicPath: '/',
      },
      {
        directory: path.resolve(
          __dirname,
          '../ice3-engine/examples/m1/assets',
        ),
        publicPath: '/assets',
      },
    ],
  },
  devtool: 'source-map',
});
