
const path = require('path')

// Determine run mode from CLI
let mode = process.argv[2];

// We have a lot of tooling installed in the forge directory's node_modules
// folder. However, unlike usual tooling, we run from a different directory (the
// project's). So we add to the NODE_PATH so we can find all the tooling.
process.env.NODE_PATH = path.resolve(path.join(__dirname, 'node_modules'))
require("module").Module._initPaths()

// initialize a new project
// (do this before anything else because we try to load a config below, and a
// new, empty project won't have a config)
if (mode === 'init') {
  require('./lib/initer')();
  process.exit(0);
}

// default to prototyping, if no mode is specified
if (mode === undefined) {
  mode = 'prototype';
}

// TODO? is this bad
if (mode === 'prototype') process.env.NODE_ENV = 'development'
if (mode === 'build') process.env.NODE_ENV = 'production'

// load the configuration
const log = require('./lib/logging');
const config = require('./lib/config').load();
// load the build / prototype functionality
const builder = require('./lib/metalsmith-builder')
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
    browserSyncer.start(config, webpacker.middleware)
  })
} else if (mode === 'pkg-e-') {
  ePackager()
} else {
  log.logFailure(`Unknown mode "${mode}"`);
  process.exit(1);
}
