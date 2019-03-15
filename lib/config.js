// Functionality to load and handle the forge configuration

const path = require('path')
const unbundledRequire = require('./reusable/unbundledRequire')

// load the forge configuration
export const load = () => {
  let config = unbundledRequire(path.resolve('./forge.config.js'))

  // TODO: validate `config` fully
  if (config.code !== undefined && config.code.entry == undefined) {
    config.code.entry = './index.js'
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
