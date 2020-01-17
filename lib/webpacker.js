
import path from 'path'
import jetpack from 'fs-jetpack'

import Webpack from 'webpack'
import webpackMerge from 'webpack-merge'
// import VirtualModulesPlugin from 'webpack-virtual-modules'
import WebpackDevServer from 'webpack-dev-server'
import { curry } from 'crocks'
import Async from 'crocks/Async'

import unbundledRequire from './reusable/unbundledRequire'
import logging from './logging'
// import { addEntries } from './builder/jigs-build-webpack/plugin-support'

// Gets the webpack config to use.
const getWebpackConfig = (jigsConfig, buildMode, context='client') => {
  // Don't want Webpack to process the default Webpack config.
  // Webpack isn't designed for it's config file to be bundled by Webpack. You
  // can get it to work but I think it's fragile.
  const makeDefaultWebpackConfig = unbundledRequire(
    `../configs/webpack.${context}.config.js`
  ).makeConfig
  const defaultWebpackConfig = makeDefaultWebpackConfig(buildMode, jigsConfig)

  const projectsWebpackConfig = path.join(process.cwd(), `webpack.${context}.config.js`)

  // if this project config doesn't exist, then we shouldn't load it
  if (jetpack.exists(projectsWebpackConfig)) {
    const clientWebpackConfig = unbundledRequire(projectsWebpackConfig)

    // Overlay the client Webpack config on the default one.
    return webpackMerge(defaultWebpackConfig, clientWebpackConfig)
  } else {
    return defaultWebpackConfig
  }

  // let { virtualModules, pageEntries } = addEntries(jigsConfig)
  // const virtualModulesInstance = new VirtualModulesPlugin(virtualModules)
  // config.plugins.push(virtualModulesInstance)
}

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
    resolve()
    return
  }

  reject('errors or warnings')
})

const silentErrHandler = curry((reject, resolve, err, stats) => {
  if (err) {
    reject(err)
  } else if (stats.hasErrors) {
    reject()
  } else {
    resolve()
  }
})

// (jigsConfig, 'development' | 'production', 'client' | 'server') => Async
export const build = (jigsConfig, buildMode, context, shouldTalk='you may speak') => {
  return Async((reject, resolve) => {
    Webpack(
      getWebpackConfig(jigsConfig, buildMode, context)
    ).run(
      (shouldTalk === 'silent') ? silentErrHandler(reject, resolve) : errHandler(reject, resolve)
    )
  })
}

// (jigsConfig, 'development' | 'production', 'client' | 'server') => Async
export const buildWatch = (jigsConfig, buildMode, context, shouldTalk='you may speak') =>
  Async((reject, resolve) => {
    Webpack(
      getWebpackConfig(jigsConfig, buildMode, context)
    ).watch(
      {
        ignored: [ 'node_modules' ],
        aggregateTimeout: 3000
      },
      (shouldTalk === 'silent') ? silentErrHandler(reject, resolve) : errHandler(reject, resolve)
    )
  })

// (jigsConfig, 'client' | 'server') => Async
export const develop = (jigsConfig, buildMode, context) =>
  Async((reject, resolve) => {
    const host = jigsConfig.devServer.host
    const port = jigsConfig.devServer.clientPort

    const config = webpackMerge(
      getWebpackConfig(jigsConfig, buildMode, context),
      {
        watch: true,
        watchOptions: {
          ignored: [ 'node_modules' ],
          aggregateTimeout: 3000
        }
      }
    )
    const compiler = Webpack(config)
    // resolve the Async when the build completes
    compiler.hooks.done.tap('jigs-done-check', resolve)

    const server = new WebpackDevServer(
      compiler,
      config.devServer
    )

    server.listen(port, host)
  })
