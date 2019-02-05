
const path = require('path')

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
  process.exit(0)
}

// default to prototyping, if no mode is specified
if (mode === undefined) {
  mode = 'prototype'
}

// load the configuration
const log = require('./lib/logging')
const config = require('./lib/config').load()
const builder = require('./lib/builder')
const layouts = require('./lib/builder/layouts')
const webpacker = require('./lib/webpacker')
const browserSyncer = require('./lib/browserSyncer')
const ePackager = require('./lib/e--packager')

if (mode === 'build') {
  builder.build(config)

  if (webpacker.shouldUse()) {
    webpacker.build()
  }
} else if (mode === 'prototype') {
  builder.prototype(config, () => {
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
  log.logFailure(`Unknown mode "${mode}"`)
  process.exit(1)
}
