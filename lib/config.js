// Functionality to load and handle the forge configuration

const path = require('path')
const unbundledRequire = require('./reusable/unbundledRequire')

// load the forge configuration
export const load = () => {
  let config = unbundledRequire(path.resolve('./forge.config.js'))

  if (config.layouts === undefined) config.layouts = { }

  // TODO: validate `config` fully
  if (config.code !== undefined && config.code.entry == undefined) {
    config.code.entry = './index.js'
  }

  return config
}
