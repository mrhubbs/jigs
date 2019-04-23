// Functionality to load and handle the forge configuration

const path = require('path')

const semver = require('semver')

import { logFailure } from './logging'
const unbundledRequire = require('./reusable/unbundledRequire')

// load the forge configuration
export const load = () => {
  let config = unbundledRequire(path.resolve('./forge.config.js'))

  // TODO: validate `config` fully
  if (config.code !== undefined && config.code.entry == undefined) {
    config.code.entry = './index.js'
  }

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

  if (!config.dirs.assets) {
    logFailure('Config has no \'dirs.assets\' section')
    // TODO: don't kill process
    process.exit(1)
  }

  if (config.forgeVersion === undefined) {
    logFailure('Config does not specify the version(s) of forge the project is compatible with (need forgeVersion field)')
    // TODO: don't kill process
    process.exit(1)
  } else if (semver.valid(config.forgeVersion) === null) {
    logFailure(`Config's forgeVersion of "${config.forgeVersion}" is not a valid version`)
    // TODO: don't kill process
    process.exit(1)
  }

  // remove any leading ./ from paths, so we can do path comparison
  // TODO: is this okay?
  Object.entries(config.dirs).forEach(([ key, val ]) => {
    if (val.startsWith('./')) {
      config.dirs[key] = val.slice(2)
    }
  })

  return config
}
