
// Base, default webpack configuration for client projects.

const path = require('path')

const glob = require('glob-all')
const Webpack = require('webpack')
const VueLoaderPlugin = require('vue-loader/lib/plugin')
const PurgecssPlugin = require('purgecss-webpack-plugin')
const CopyPlugin = require('copy-webpack-plugin')

const makeConfig = (mode, jigsConfig) => {
  const __DEV__ = mode === 'development'
  const __PROD__ = !__DEV__

  // Vue loader and configuration
  const VUE_LOADER = {
    loader: 'vue-loader',
    options: { }
  }

  // customize asset url transformation, if in the jigs config
  if (jigsConfig.vueLoader && jigsConfig.vueLoader.transformAssetUrls) {
    VUE_LOADER.options.transformAssetUrls = jigsConfig.vueLoader.transformAssetUrls
  }

  let config = {
    mode: mode,

    output: {
      publicPath: __DEV__ ? '/' : jigsConfig.metadata.baseurl + '/'
    },

    devtool: 'cheap-source-map',

    module: {
      rules: [
        {
          // Markdown pages, output .html
          test: /\.md/,
          use: [
            {
              loader: path.resolve(__dirname, '../build/jigs-page-post'),
              options: {
                config: jigsConfig
              }
            },
            // We're gonna modify the file after this loader, but we first need
            // Webpack to work all its JavaScript magic on the vue-loader
            // output. So we handle the further modifications in the jigs
            // plugin.
            // TODO: remove, just using this for debugging
            // path.resolve(__dirname, '../build/jigs-page-layout'),
            VUE_LOADER,
            {
              loader: path.resolve(__dirname, '../build/jigs-page-loader'),
              options: {
                config: jigsConfig,
                // pass Webpack environment information to the loader
                env: {
                  DEV_MODE: __DEV__,
                  PROD_MODE: __PROD__
                }
              }
            },
          ]
        },
        {
          // don't have to include .vue because the vue-loader applies this rule
          // to .vue files
          test: /\.js$/,
          exclude: [ /node_modules/, /\.md\.js$/ ],
          enforce: 'pre',
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
          exclude: [ /node_modules/, /\.md\.js$/ ],
          use: {
            loader: 'babel-loader',
            options: {
              plugins: [
                // use an absolute path to make babel include the plugin from
                // jigs's node_modules, instead of looking in the client
                // project.
                path.resolve(
                  __dirname,
                  '../node_modules/babel-plugin-transform-vue-jsx'
                ),
                path.resolve(
                  __dirname,
                  '../node_modules/babel-plugin-syntax-dynamic-import'
                )
              ]
            }
          }
        },
        {
          test: /\.vue$/,
          use: [ VUE_LOADER ]
        },
        // load image assets into assets/images
        {
          test: /\.(png|jpe?g|gif|svg)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 10000,
              // relative to the output directory
              name: 'assets/images/[name].[hash:8].[ext]'
            }
          }
        },
        // load font assets into assets/fonts
        {
          test: /\.(woff2?|eot|ttf|otf)(\?.*)?$/,
          use: {
            loader: 'url-loader',
            query: {
              limit: 10000,
              // relative to the output directory
              name: 'assets/fonts/[name].[hash:8].[ext]'
            }
          }
        },
        {
          test: /\.(yaml|yml)$/,
          use: [
            {
              loader: 'json-loader'
            },
            {
              loader: 'yaml-loader'
            }
          ]
        }
      ]
    },
    // NOTE: for electron main process. Webpack tries to mock these and gets them
    // wrong, at least in the packaged version.
    node: {
      __dirname: process.env.NODE_ENV !== 'production',
      __filename: process.env.NODE_ENV !== 'production'
    },

    resolve: {
      alias: {
        '@Jigs': path.resolve(__dirname, '..')
      },

      modules: [
        // look first in client project for installed node modules
        path.resolve(process.cwd(), 'node_modules'),
        // then look in jigs
        path.resolve(__dirname, '..', 'node_modules'),
      ]
    },
    // Teach Webpack to look for loaders in /path/to/jigs/node_modules first,
    // before looking in /path/to/client-project/node_modules
    resolveLoader: {
      modules: [
        path.join(__dirname, '..', 'node_modules'),
        path.join(process.cwd(), 'node_modules')
      ]
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

      new CopyPlugin([
        {
          from: path.join(jigsConfig.dirs.assets, 'images'),
          to: path.join(
            path.basename(jigsConfig.dirs.assets),
            'images'
          )
        }
      ])
    ]
  }

  if (__DEV__) {
    // debug loaders in dev mode
    config.plugins.push(new Webpack.LoaderOptionsPlugin({
      debug: true
    }))
  } else if (__PROD__) {
    // To work with PurgeCSS, since tailwind has colons in class names.
    class TailwindExtractor {
      static extract(content) {
        return content.match(/[A-z0-9-:/]+/g)
      }
    }

    // PurgeCSS only in production
    config.plugins.push(
      // removes unused classes from the CSS
      new PurgecssPlugin({
        // Specify the locations of any files you want to scan for class names.
        paths: glob.sync([
          // TODO: pages, layouts, etc.
          path.join(jigsConfig.dirs.src, '**/*.html'),
          path.join(jigsConfig.dirs.src, '**/*.js'),
          path.join(jigsConfig.dirs.src, '**/*.vue'),
          path.join(jigsConfig.dirs.src, '**/*.md'),
        ]),
        whitelistPatternsChildren: [
          // allow all tag styles, like h1, p, etc.
          /^[a-z0-9]+$/,
          // allow all highlight.js classes
          /^\.?hljs.*$/
        ],
        extractors: [{
          extractor: TailwindExtractor,

          // Specify the file extensions to include when scanning for
          // class names.
          extensions: ['html', 'js', 'vue', 'md']
        }]
      })
    )
  }

  return config
}

module.exports = {
  makeConfig
}
