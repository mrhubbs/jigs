
// functionality to initialize a new project

const path = require('path')
const jetpack = require('fs-jetpack')

const jigsPackage = require('../../package.json')

const filesToWrite = require('./file-list')(jigsPackage)

module.exports = () => {
  // create directories
  [
    'src/assets/images',
    'src/css',
    'src/layouts',
    'src/pages',
    'src/app/components',
  ].map(d => jetpack.dir(d))

  // create files
  filesToWrite.forEach(([ fileName, contents ]) => {
    jetpack.write(fileName, contents)
  })

  // create gitignore
  jetpack.append('.gitignore',
`**/*.DS_Store
build/
`)

  // create the tailwind file
  const twCli = path.join(__dirname, '../node_modules/tailwindcss/lib/cli.js')
  require('child_process').exec(`${twCli} init`)

  // TODO: Fix tailwind.js file after it's written
}
