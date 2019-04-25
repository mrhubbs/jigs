
// Base, default webpack configuration for client projects.

const path = require('path')

const glob = require('glob-all')
const Webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')

// To work with purgecss, since tailwind has colons in class names.
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:/]+/g)
  }
}

const makeConfig = mode => {
  const __DEV__ = mode === 'development'
  const __PROD__ = mode === 'production'

  let config = {
    mode: __DEV__ ? 'development' : 'production',
    devtool: 'cheap-source-map',
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
              // NOTE: this disables 'local' eslint files in directories with
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
            { loader: 'postcss-loader', options: { config: { path: path.resolve(__dirname, '../configs') } } }
          ]
        },
        // load any image assets into assets/images
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 10000,
              // relative to the output directory
              name: 'assets/images/[name].[ext]'
            }
          }
        },
        // load any image assets into assets/fonts
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 10000,
              // relative to the output directory
              name: 'assets/fonts/[name].[ext]'
            }
          }
        }
      ]
    },
    // NOTE: for electron main process. Webpack tries to mock these and gets them
    // wrong, at least in the packaged version.
    node: {
      __dirname: process.env.NODE_ENV !== 'production',
      __filename: process.env.NODE_ENV !== 'production'
    },
    target: 'electron-renderer',
    resolve: {
      // By default, the runtime-only version of Vue will be resolved. We need a
      // more complete version with the template compiler.
      // TODO: Can we use the runtime-only version when doing a full build?
      alias: {
        '@': path.join(__dirname, './src/renderer'),
        'vue$': 'vue/dist/vue.esm.js'
      }
    },
    // teach Webpack to look for loaders in /path/to/forge/node_modules instead
    // of /path/to/client-project/node_modules
    // TODO: make sure that loaders installed in client projects still work
    resolveLoader: {
      modules: [ path.join(__dirname, '..', 'node_modules') ]
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
      new VueLoaderPlugin(),

      // removes unused classes from the CSS
      // TODO: is this working?
      new PurgecssPlugin({
        // Specify the locations of any files you want to scan for class names.
        paths: glob.sync([
          // TODO: pages, layouts, etc.
          path.join(process.cwd(), 'src/**/*.js'),
          path.join(process.cwd(), 'src/**/*.ts'),
          path.join(process.cwd(), 'src/**/*.vue'),
          path.join(process.cwd(), 'src/**/*.html'),
        ]),
        extractors: [
          {
            extractor: TailwindExtractor,

            // Specify the file extensions to include when scanning for
            // class names.
            extensions: ['html', 'js', 'ts', 'vue']
          }
        ]
      })
    ]
  }

  if (__DEV__) {
    config.plugins.push(new Webpack.LoaderOptionsPlugin({
      debug: true
    }))
  }

  return config
}

module.exports = {
  makeConfig
}
