
// Webpack configuration for the forge CLI tool.

const path = require('path')

const Webpack = require('webpack')
const nodeExternals = require('webpack-node-externals')

const __DEV__ = process.env.NODE_ENV !== 'production'
const __PROD__ = process.env.NODE_ENV === 'production'

let config = {
  mode: __DEV__ ? 'development' : 'production',
  entry: {
    index: './index.js'
  },
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, './build'),
    filename: '[name].js'
  },
  devtool: 'cheap-source-map',
  module: {
    // Ignore this file...
    noParse: /unbundledRequire/,
    rules: [
      {
        test: /\.js$/,
        enforce: 'pre',
        exclude: /node_modules/,
        use: {
          loader: 'eslint-loader',
          options: {
            emitError: true,
            failOnError: true,
            failOnWarning: true,
            // TODO: use in dev only?
            emitWarning: true,
            // speed up full build by caching linting results
            // NOTE: using the cache when doing a full build causes mess-ups
            // when editing the .eslintrc file because the rules change but the
            // old cache from the old ruleset is used
            cache: __DEV__,
            // a user-friendly eslint output formatter for the terminal
            formatter: require('eslint-formatter-friendly'),
            // TODO: for some reason eslint wasn't finding the config file
            // NOTE: this disables "local" eslint files in directories with
            // source code
            configFile: path.resolve(__dirname, '.eslintrc.js')
          }
        }
      },
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
        }
        // see .babelrc for options
      }
    ]
  },
  target: 'node',
  node: {
    __dirname: false
  },
  externals: [nodeExternals()], // in order to ignore all modules in node_modules folder
  plugins: [
    // TODO:
    //     NoErrorsPlugin
    //
    // NoErrorsPlugin prevents webpack from outputting anything into a bundle.
    // So even ESLint warnings will fail the build. No matter what error
    // settings are used for eslint-loader. So if you want to see ESLint
    // warnings in console during development using WebpackDevServer remove
    // NoErrorsPlugin from webpack config.

    // skips all emitting (outputting) when there are errors.
    new Webpack.NoEmitOnErrorsPlugin()
  ]
}

if (__DEV__) {
  config.plugins.push(new Webpack.LoaderOptionsPlugin({
    debug: true
  }))
}

module.exports = config
