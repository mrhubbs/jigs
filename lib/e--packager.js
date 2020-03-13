const path = require('path')
const fs = require('fs')
const jetpack = require('fs-jetpack')

const packager = require('electron-packager')

const unbundledRequire = require('./reusable/unbundledRequire')

const logging = require('./logging')
const packagerConfigPath = path.join(process.cwd(), 'e-packager.config.js')
const packagerConfig = jetpack.exists(packagerConfigPath) ? unbundledRequire(packagerConfigPath) : null

if (!packagerConfig) {
  module.exports = (/* jigsConfig */) => {
    logging.logFailure('Cannot run the Electron packager without an `e-packager.config.js` file')
  }
} else {
  module.exports = jigsConfig => {
    // create a minimal version of the package.json file
    const p = unbundledRequire(path.join(process.cwd(), 'package.json'))

    let outPgk = {
      name: p.name,
      productName: p.productName,
      version: p.version,
      main: './main.js',
      author: p.author,
      electron: p.electron
    }

    // write the file out...
    // TODO: use jetpack?
    fs.writeFileSync(
      path.join(jigsConfig.dirs.build, 'package.json'),
      JSON.stringify(outPgk, null, 2)
    )

    packager(packagerConfig, err => {
      // TODO: this callback is never called
      if (err) {
        logging.logFailure(`Could not package app: ${err}\n`)
      } else {
        logging.logSuccess(`All packaged for ${packagerConfig.platform}\n`)
      }
    })
  }
}
