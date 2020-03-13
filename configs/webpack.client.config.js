
// client-side default webpack configuration for projects.

const path = require('path')

const webpackMerge = require('webpack-merge')
const webpack = require('webpack')
const VueSSRClientPlugin = require('vue-server-renderer/client-plugin')
const MiniCssExtractPlugin = require('mini-css-extract-plugin')

const baseConfig = require('./webpack.base.config').makeConfig

const makeConfig = (mode, jigsConfig) => {
  const IS_PROD = mode === 'production'
  // TODO: get from jigsConfig
  const CLIENT_BUILD_PORT = jigsConfig.devServer.clientPort

  let config = {
    target: 'web',

    optimization: {
      splitChunks: {
        minSize: 20000,
        cacheGroups: {
          // TODO: put all common code that's not from `node_modules` into a bundle
          vendors: {
            chunks: 'all',
            // put everything imported from `node_modules` into a "vendor" bundle
            test: /[\\/]node_modules[\\/]/,
            name: 'scripts/vendors~node_modules',
            priority: -10
          }
        }
      },
    },

    module: {
      rules: [
        {
          test: /\.css$/,
          use: [
            IS_PROD ? MiniCssExtractPlugin.loader : 'vue-style-loader',
            {
              loader: 'css-loader'
            },
            {
              loader: 'postcss-loader',
              options: {
                config: {
                  path: path.resolve(__dirname, '../configs')
                }
              }
            }
          ],
        },
      ],
    },

    plugins: [
      new VueSSRClientPlugin(),

      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        'BUILD_ENV': JSON.stringify('client'),
      })
    ]
  }

  // inline CSS in dev
  if (!IS_PROD) {
    config = webpackMerge(config, {
      output: {
        filename: '[name].js',
        publicPath: `http://localhost:${CLIENT_BUILD_PORT}/`
      },

      plugins: [
        new webpack.HotModuleReplacementPlugin()
      ],

      devtool: 'source-map',

      devServer: {
        host: jigsConfig.devServer.host,
        port: CLIENT_BUILD_PORT,
        writeToDisk: true,
        contentBase: path.resolve(jigsConfig.dirs.build),
        publicPath: `http://localhost:${CLIENT_BUILD_PORT}/`,
        hot: true,
        inline: true,
        historyApiFallback: true,
        port: CLIENT_BUILD_PORT,
        headers: {
          'Access-Control-Allow-Origin': '*',
        },
        // TODO: make optional
        clientLogLevel: 'silent',
        noInfo: true
      },
    })
  } else {

    // TODO: does this apply?
    // filename: __DEV__ ? '[name].css' : '[name].[contenthash].css',
    // chunkFilename: __DEV__ ? '[id].css' : '[id].[contenthash].css'

    // extract CSS in prod
    config = webpackMerge(config, {
      plugins: [

        new MiniCssExtractPlugin({
          filename: '[name].[hash:8].css',
        })

      ],
    })
  }

  return webpackMerge(baseConfig(mode, jigsConfig), config)
}

module.exports = {
  makeConfig
}
