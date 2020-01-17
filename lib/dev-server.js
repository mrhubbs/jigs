
import path from 'path'

import express from 'express'
import chokidar from 'chokidar'
import jetpack from 'fs-jetpack'

import {
  createRenderer,
  SERVER_BUNDLE_NAME,
  CLIENT_MANIFEST_NAME
} from './builder/bundle-renderer'
import {
  writeGeneratedRoutes,
  filePathToRoutePath
} from './builder'
import logging from './logging'

let renderer = null

let pendingResponses = [ ]

export const runDevServerInWatch = (jigsConfig, startingRoutes) => {
  // TODO: To proper handle hot-reload changes (like CSS) need to restart the
  // dev server when either of these bundles changes.

  const serverBundlePath = path.resolve(jigsConfig.dirs.build, SERVER_BUNDLE_NAME)
  const clientManifestPath = path.resolve(jigsConfig.dirs.build, CLIENT_MANIFEST_NAME)

  // start the development server
  const { addRoute, removeRoute } = startDevServer(jigsConfig, serverBundlePath, clientManifestPath, startingRoutes)

  // recreate the bundler renderer if the server bundle changes
  const bundleWatcher = chokidar.watch([ serverBundlePath ])
  bundleWatcher.on('ready', () => {
    bundleWatcher.on('change', filePath => {
      logging.logInfo(`update dev server (${path.basename(filePath)})`)
      renderer = makeRenderer(jigsConfig, serverBundlePath, clientManifestPath)

      pendingResponses.forEach(res => res.json({ rendered: true }))
      pendingResponses = [ ]
    })
  })

  // regenerate the routes if a page is added or deleted
  const pageWatcher = chokidar.watch(jigsConfig.dirs.pages)
  pageWatcher.on('ready', () => {
    pageWatcher.on('add', filePath => {
      const routePath = filePathToRoutePath(jigsConfig, filePath)
      logging.logDetail(`Page added, add route: ${routePath}`)
      // add the route
      addRoute(
        routePath,
        path.relative(jigsConfig.dirs.pages, filePath)
      )
    })

    pageWatcher.on('unlink', filePath => {
      const routePath = filePathToRoutePath(jigsConfig, filePath)
      logging.logDetail(`Page deleted, remove route: ${routePath}`)
      // add the route
      removeRoute(
        routePath,
        path.relative(jigsConfig.dirs.pages, filePath)
      )
    })
  })
}

function startDevServer(
  jigsConfig,
  serverBundlePath,
  clientManifestPath,
  startingRoutes
) {
  logging.logHeader('Starting dev server')

  const server = express()
  // object of key: route, value: rendered route chunk
  // example: { '/': '{ path: "/", component: () => import(...) }' }
  const dynamicRoutes = Object.fromEntries(startingRoutes)

  const addRoute = (routePath, filePath) => {
    const route = `{ path: '${routePath}', component: () => import('@Pages/${filePath}') }`

    // add the route
    dynamicRoutes[routePath] = route
    generateAndWriteRoutes(dynamicRoutes)
  }

  const removeRoute = routePath => {
    // delete the route
    delete dynamicRoutes[routePath]
    generateAndWriteRoutes(dynamicRoutes)
  }

  function generateAndWriteRoutes() {
      const template = `
// auto-generated file: do not edit!

export default [
  ${Object.values(dynamicRoutes).join(',\n  ')}
]`

    writeGeneratedRoutes(jigsConfig, [ null, template ])
  }

  // serve static from the build directory
  // TODO: set this up if we need to serve static assets in dev mode (not via
  // webpack)
  server.use(
    `/${path.basename(jigsConfig.dirs.assets)}`,
    express.static(
      path.resolve(
        path.join(
          jigsConfig.dirs.build,
          path.basename(jigsConfig.dirs.assets)
        )
      )
    )
  )

  server.get('*', (req, res) => {
    const context = { url: req.url }

    logging.logInfo(req.url)

    getRenderer(
      jigsConfig,
      serverBundlePath,
      clientManifestPath
    ).renderToString(context, (err, html) => {
      if (err) {
        if (+err.message === 404) {
          res.status(404).end('Page not found')
        } else {
          // If the error is in the app, logging here would duplicate it.
          // If it's in server-only code, we won't see it...
          // console.log(err)
          res.status(500).end('Internal Server Error')
        }
      }

      res.end(html)
    })
  })

  server.listen(jigsConfig.devServer.port, () => {
    logging.logInfo(`Started server on http://localhost:${jigsConfig.devServer.port}`)
  })

  return {
    addRoute,
    removeRoute
  }
}

// caches the renderer
function getRenderer(jigsConfig, serverBundlePath, clientManifestPath) {
  if (!renderer) {
    renderer = makeRenderer(jigsConfig, serverBundlePath, clientManifestPath)
  }

  return renderer
}

// create a new bundle renderer, loading the bundle / manifest fresh from the
// filesystem
function makeRenderer(jigsConfig, serverBundlePath, clientManifestPath) {
  return createRenderer(
    jigsConfig,
    JSON.parse(jetpack.read(serverBundlePath)),
    JSON.parse(jetpack.read(clientManifestPath))
  )
}
