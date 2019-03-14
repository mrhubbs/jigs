
const path = require('path')
const jetpack = require('fs-jetpack')

const Webpack = require('webpack')
const WebpackMiddleware = require('webpack-dev-middleware')
import { curry } from 'crocks'
import Async from 'crocks/Async'

const unbundledRequire = require('./reusable/unbundledRequire')
const logging = require('./logging')

// Gets the webpack config to use.
const getWebpackConfig = mode => {
  // Don't want Webpack to process the default Webpack config.
  // Webpack isn't designed for it's config file to be bundled by Webpack. You
  // can get it to work but I think it's fragile.
  const makeDefaultWebpackConfig = unbundledRequire('../configs/webpack.config.js').makeConfig
  const defaultWebpackConfig = makeDefaultWebpackConfig(mode)

  const clientWebpackConfigPath = path.join(process.cwd(), 'webpack.config.js')

  // if this project config doesn't exist, then we shouldn't load it
  if (jetpack.exists(clientWebpackConfigPath)) {
    const clientWebpackConfig = unbundledRequire(clientWebpackConfigPath)

    // Overlay the client Webpack config on the default one.
    // TODO: merge these much more intelligently.
    return Object.assign({ }, defaultWebpackConfig, clientWebpackConfig)
  } else {
    return defaultWebpackConfig
  }
}

// Determine, by the presence of a webpack config, if the project wants to use
// webpack.
export const shouldUse = () => jetpack.exists(
  path.join(
    process.cwd(),
    'webpack.config.js'
  )
)

// error handler adapted from webpack example
const errHandler = curry((reject, resolve, err, stats) => {
  if (err) {
    logging.logFailure(err.stack || err)
    if (err.details) {
      logging.logFailure(err.details, { calm: true })
    }
    reject()
    return
  }

  const info = stats.toJson()
  let success = true

  // show warnings first
  if (stats.hasWarnings()) {
    info.warnings.map(w => logging.logFailure(w, { calm: true }))
  }

  if (stats.hasErrors()) {
    info.errors.map(e => logging.logFailure(e, { calm: true }))
    success = false
  }

  if (success) {
    logging.logDetail('done')
    resolve()
    return
  }

  reject('errors or warnings')
})

// () => Async
export const build = (/* forgeConfig */) => {
  return Async((reject, resolve) => {
    logging.logInfo('building w/ webpack!')
    Webpack(
      getWebpackConfig('production')
    ).run(
      errHandler(reject, resolve)
    )
  })
}

// only use this in development mode!
export const getMiddleware = (/* forgeConfig */) => {
  const webpackConfig = getWebpackConfig('development')

  return [
    WebpackMiddleware(Webpack(webpackConfig), {
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
              info.errors.map(e => log.error(e, true))
            } else if (stats.hasWarnings()) {
              info.warnings.map(w => log.warn(w, true))
            }
          }

          let message = 'Compiled successfully.'

          if (stats.hasErrors()) {
            message = 'Failed to compile.'
          } else if (stats.hasWarnings()) {
            message = 'Compiled with warnings.'
          }
          log.info(message)
        } else {
          log.info('Compiling...')
        }
      },
      // Since we're using BrowserSync, we need to "save our work".
      // TODO: why do we have to do this even though we're incorporated into
      // browserSync as middleware?
      writeToDisk: true
    })
  ]
}
