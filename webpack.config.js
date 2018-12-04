
const path = require('path')

const Webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')

const __DEV__ = process.env.NODE_ENV !== 'production'
const __PROD__ = process.env.NODE_ENV === 'production'

// Try the environment variable, otherwise use root
const ASSET_PATH = process.env.ASSET_PATH || '/';

let config = {
  mode: __DEV__ ? 'development' : 'production',
  module: {
    rules: [
      {
        test: /\.(js|vue)$/,
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
      },
      {
        test: /\.vue$/,
        use: [{
          loader: 'vue-loader',
          options: {
            extractCSS: __PROD__,
            loaders: {
              scss: 'vue-style-loader!css-loader!postcss-loader'
            }
          }
        }]
      },
      {
        test: /\.css$/,
        use: [
          'style-loader',
          { loader: 'css-loader', options: { importLoaders: 1 } },
          { loader: 'postcss-loader', options: { config: { path: path.resolve(__dirname) } } }
        ]
      }
    ]
  },
  target: 'electron-renderer',
  resolve: {
    // By default, the runtime-only version of Vue will be resolved. We need a
    // more complete version with the template compiler.
    // TODO: Can we use the runtime-only version when doing a full build?
    alias: {
      '@': path.join(__dirname, './src/scripts/renderer'),
      'vue$': 'vue/dist/vue.esm.js'
    }
  },
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
    new Webpack.NoEmitOnErrorsPlugin(),
    // the Vue plugin hooks in to make sure the <script> tags are processed
    // using any .js loaders configured in Webpack
    new VueLoaderPlugin()
  ]
}

if (__DEV__) {
  config.plugins.push(new Webpack.LoaderOptionsPlugin({
    debug: true
  }))
}

module.exports = config
