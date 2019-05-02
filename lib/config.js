// Functionality to load and handle the forge configuration

import path from 'path'

import { logFailure } from './logging'
const unbundledRequire = require('./reusable/unbundledRequire')

// load the forge configuration
export const load = () => {
  let config = unbundledRequire(path.resolve('./forge.config.js'))

  // TODO: validate `config` fully

  if (config.metadata === undefined) {
    config.metadata = { }
  }

  if (config.metadata.baseurl === undefined) {
    config.metadata.baseurl = ''
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

  if (!config.forgeVersion) {
    logFailure('Config does not specify the version(s) of forge the project is compatible with (need forgeVersion field)')
    // TODO: don't kill process
    process.exit(1)
  // TODO: we make sure that we at least have major.minor.patch - we allow all
  // sorts of range options & etc. but we don't check those are entered
  // correctly. We'll fail upstream with a more cryptic message.
  } else if (!config.forgeVersion.match(/.*[0-9]+\.[0-9]+\.[0-9].*/)) {
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
