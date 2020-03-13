
const path = require('path')
const jigsConfig = require('./jigs.config.js')

// Try the environment variable, otherwise use root
const ASSET_PATH = process.env.ASSET_PATH || '/';

let config = {
  entry: {
    './scripts/main': path.resolve(jigsConfig.dirs.scripts, 'main.js'),
    './css/main': path.resolve(jigsConfig.dirs.css, 'main.css')
  },
  output: {
    publicPath: ASSET_PATH,
    path: path.resolve(jigsConfig.dirs.build),
    filename: '[name].js'
  },
  resolve: {
    alias: {
      '@components': path.resolve(jigsConfig.dirs.src, 'components')
    }
  }
}

module.exports = config
