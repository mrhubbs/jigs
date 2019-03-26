
const path = require('path')

import { logFailure, logHeader, logSuccess, makeLogCall } from './lib/logging'

logHeader('Forge is starting up...')

// Determine run mode from CLI
let mode = process.argv[2]

// We have a lot of tooling installed in the forge directory's node_modules
// folder. However, unlike usual tooling, we run from a different directory (the
// project's). So we add to the NODE_PATH so we can find all the tooling.
process.env.NODE_PATH = path.resolve(path.join(__dirname, 'node_modules'))
require('module').Module._initPaths()

// initialize a new project
// (do this before anything else because we try to load a config below, and a
// new, empty project won't have a config)
if (mode === 'init') {
  require('./lib/initer')()
  logHeader('Done initializing new forge project')
  process.exit(0)
}

// load the configuration
const config = require('./lib/config').load()
const builder = require('./lib/builder')
const layouts = require('./lib/builder/layouts')
const webpacker = require('./lib/webpacker')
const browserSyncer = require('./lib/browserSyncer')
const ePackager = require('./lib/e--packager')

// default to prototyping, if no mode is specified
if (mode === undefined || mode === 'prototype') {
  mode = 'prototype'
}

// now, vee build! (or prototype... or something else...)
if (mode === 'build') {
  // We must build the site first. It matters because Webpack will kick off
  // PostCSS build which needs to scan generated HTML and JS, so the site has to
  // be rendered first AND PostCSS can't fully kick off until Webpack has built
  // the JS.
  // TODO: Chain the tasks instead of nesting. How do you do that functionally?
  builder.cleanBuild(config)
  .chain(() => builder.build(config))
  .fork(
    // failed
    logFailure,
    // succeeded, build with Webpack if we should
    () => {
      if (webpacker.shouldUse()) {
        webpacker.build()
        .fork(
          makeLogCall(logFailure, 'something went wrong'),
          makeLogCall(logSuccess, 'done building')
        )
      }
    }
  )
} else if (mode === 'prototype') {
  builder.prototype(config)
  .fork(
    // failed
    logFailure,
    () => {
      // start Browser Sync, either with or without Webpack running.
      if (webpacker.shouldUse()) {
        browserSyncer.start(config, webpacker.getMiddleware())
      } else {
        browserSyncer.start(config)
      }
  })
} else if (mode === 'layouts') {
  layouts.handleCommand(config, process.argv.slice(3))
} else if (mode === 'pkg-e-') {
  ePackager(config)
} else {
  logFailure(`Unknown mode "${mode}"`)
  process.exit(1)
}
