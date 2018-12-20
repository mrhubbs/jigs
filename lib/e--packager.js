const path = require('path')
const fs = require('fs')

const packager = require('electron-packager')

const packagerConfig = require(path.join(process.cwd(), 'e-packager.config.js'))
const logging = require('./logging')
const forgeConfig = require(path.join(process.cwd(), 'forge.config.js'))

module.exports = () => {
  // create a minimal version of the package.json file
  const p = require(path.join(process.cwd(), 'package.json'))

  let outPgk = {
    name: p.name,
    productName: p.productName,
    version: p.version,
    main: './main.js',
    author: p.author,
    version: p.version,
    electron: p.electron
  }

  // write the file out...
  fs.writeFileSync(
    path.join(forgeConfig.dirs.build, 'package.json'),
    JSON.stringify(outPgk, null, 2)
  )

  packager(packagerConfig, (err) => {
    // TODO: this callback is never called
    if (err) {
      logging.logFailure(`Could not package app: ${err}\n`)
    } else {
      logging.logSuccess(`All packaged for ${packagerConfig.platform}\n`)
    }
  })
}
