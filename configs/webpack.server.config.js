
// server-side default webpack configuration for projects.

const webpackMerge = require('webpack-merge')
const webpack = require('webpack')
const VueSSRPlugin = require('vue-server-renderer/server-plugin')
const nodeExternals = require('webpack-node-externals')

const baseConfig = require('./webpack.base.config').makeConfig

const makeConfig = (mode, jigsConfig) => {
  let config = {
    target: 'node',

    devtool: 'source-map',

    output: {
      libraryTarget: 'commonjs2'
    },

    // https://webpack.js.org/configuration/externals/#function
    // https://github.com/liady/webpack-node-externals
    // Externalize app dependencies. This makes the server build much faster
    // and generates a smaller bundle file.
    // TODO: will this mess with the vendor bundle?
    externals: [
      nodeExternals({
        // do not externalize dependencies that need to be processed by Webpack
        whitelist: /\.css|\.vue|\.md$/
      })
    ],

    module: {
      rules: [
        {
          test: /\.css$/,
          loader: 'css-loader',
          options: {
            modules: {
              localIdentName: '[local]_[hash:base64:8]',
            }
          }
        }
      ]
    },

    plugins: [
      new VueSSRPlugin(),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'BUILD_ENV': JSON.stringify('server'),
      })
    ]
  }

  return webpackMerge(baseConfig(mode, jigsConfig), config)
}

module.exports = {
  makeConfig
}
