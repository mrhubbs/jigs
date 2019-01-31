
const path = require('path')
const jetpack = require('fs-jetpack')

const Webpack = require('webpack')
const WebpackMiddleware = require('webpack-dev-middleware')

const logging = require('./logging')

const defaultWebpackConfig = require(
  path.join(
    __dirname,
    '../',
    'webpack.config.js'
  )
)

const webpackConfigPath = path.join(process.cwd(), 'webpack.config.js')
let webpackConfig

// if this project config doesn't exist, then we shouldn't load it
if (jetpack.exists(webpackConfigPath)) {
  const clientWebpackConfig = require(webpackConfigPath)

  // Overlay the client Webpack config on the default one.
  // TODO: merge these much more intelligently.
  webpackConfig = Object.assign(defaultWebpackConfig, clientWebpackConfig)
} else {
  webpackConfig = defaultWebpackConfig
}

module.exports = { }

// Determine, by the presence of a webpack config,  if the project wants to use
// webpack.
module.exports.shouldUse = () => jetpack.exists(
  path.join(
    process.cwd(),
    'webpack.config.js'
  )
)

// error handler adapted from webpack example
const errHandler = (err, stats) => {
  if (err) {
    logging.logFailure(err.stack || err);
    if (err.details) {
      logging.logFailure(err.details, true);
    }
    return;
  }

  const info = stats.toJson();

  if (stats.hasErrors()) {
    info.errors.map((e) => logging.logFailure(e, true))
  }

  if (stats.hasWarnings()) {
    info.warnings.map((w) => logging.logFailure(w, true))
  }
}

let webpackCompiler = Webpack(webpackConfig)

module.exports.build = (forgeConfig) => {
  logging.logInfo('building w/ webpack!')
  webpackCompiler.run(errHandler)
}

let middleware = [ ]

// only activate the middleware in development mode
if (process.env.NODE_ENV === 'development') {
  middleware.push(
    WebpackMiddleware(webpackCompiler, {
      publicPath: webpackConfig.output ? webpackConfig.output.publicPath : '/',
      noInfo: false,
      stats: true,
      reporter: (middlewareOptions, options) => {
        const { log, state, stats } = options

        if (state) {
          const displayStats = (middlewareOptions.stats !== false)

          if (displayStats) {
            // get a more displayable form of the stats
            const info = stats.toJson()

            if (stats.hasErrors()) {
              info.errors.map((e) => log.error(e, true))
            } else if (stats.hasWarnings()) {
              info.warnings.map((w) => log.warn(w, true))
            }
          }

          let message = 'Compiled successfully.';

          if (stats.hasErrors()) {
            message = 'Failed to compile.';
          } else if (stats.hasWarnings()) {
            message = 'Compiled with warnings.';
          }
          log.info(message);
        } else {
          log.info('Compiling...');
        }
      },
      // Since we're using BrowserSync, we need to "save our work".
      // TODO: why do we have to do this even though we're incorporated into
      // browserSync as middleware?
      writeToDisk: true
    })
  )
}

module.exports.middleware = middleware
