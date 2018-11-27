
// Determine run mode from CLI
let mode = process.argv[2];

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

if (mode === 'build') {
  builder.build(config)

  if (webpacker.shouldUse()) {
    webpacker.build()
  }
} else if (mode === 'prototype') {
  builder.prototype(config, () => {
    browserSyncer.start(config, webpacker.middleware)
  })
} else {
  log.logFailure(`Unknown mode "${mode}"`);
  process.exit(1);
}
