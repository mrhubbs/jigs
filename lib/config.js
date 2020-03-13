// Functionality to load and handle the jigs configuration

import path from 'path'

import jetpack from 'fs-jetpack'

import { logFailure } from './logging'
const unbundledRequire = require('./reusable/unbundledRequire')

// load the jigs configuration
// String -> { }
// `mode` should be 'development' or 'production'
export const load = mode => {
  const configPath = path.resolve('./jigs.config.js')

  if (!jetpack.exists(configPath)) {
    logFailure(`Cannot find "jigs.config.js" at path ${path.dirname(configPath)}`)
    // TODO: don't kill process
    process.exit(1)
  }

  let config = unbundledRequire(configPath)

  if (![ 'development', 'production' ].includes(mode)) {
    logFailure(`Unknown mode "${mode}"!`)
    process.exit(1)
  }

  // TODO: validate `config` fully

  // make sure we have metadata and baseurl
  if (config.metadata === undefined) {
    config.metadata = { }
  }
  if (config.metadata.baseurl === undefined) {
    config.metadata.baseurl = ''
  }
  // TODO: maybe should put this logic elsewhere? Or maybe it's neat for the
  // config to be mode-aware?
  if (mode === 'development') {
    // enforce no URL prefix in development mode
    config.metadata.baseurl = ''
  }

  if (!config.toc || !config.toc.wrapper) {
    config.toc.wrapper = '[[toc]]'
  }
  if (!config.toc || !config.toc.maxLevel) {
    config.toc.maxLevel = 3
  }

  if (!config.jigsVersion) {
    logFailure('Config does not specify the version(s) of jigs the project is compatible with (need jigsVersion field)')
    // TODO: don't kill process
    process.exit(1)
    // TODO: we make sure that we at least have major.minor.patch - we allow all
    // sorts of range options & etc. but we don't check those are entered
    // correctly. We'll fail upstream with a more cryptic message.
  } else if (!config.jigsVersion.match(/.*[0-9]+\.[0-9]+\.[0-9].*/)) {
    logFailure(`Config's jigsVersion of "${config.jigsVersion}" is not a valid version`)
    // TODO: don't kill process
    process.exit(1)
  }

  // make sure we have dirs
  if (!config.dirs) {
    logFailure('Config has no \'dirs\' section')
    // TODO: don't kill process
    process.exit(1)
  }
  if (!config.dirs.build) {
    logFailure('Config has no \'dirs.build\' section')
    // TODO: don't kill process
    process.exit(1)
  }
  if (mode === 'production') {
    config.dirs.buildRoot = config.dirs.build
    config.dirs.build = path.join(config.dirs.build, config.metadata.baseurl)
  } else {
    config.dirs.buildRoot = config.dirs.build
  }
  // TODO: check the rest of the dirs

  // make sure `rootTemplate` is valid
  if (!config.rootTemplate) {
    logFailure('Config has no \'rootTemplate\' entry')
    process.exit(1)
  } else if (!jetpack.exists(config.rootTemplate)) {
    logFailure(`rootTemplate "${config.rootTemplate}" does not exist`)
    process.exit(1)
  }

  // remove any leading ./ from paths in dirs, so we can do path comparison
  // TODO: is this okay?
  Object.entries(config.dirs).forEach(([ key, val ]) => {
    if (val.startsWith('./')) {
      config.dirs[key] = val.slice(2)
    }
  })

  return config
}
