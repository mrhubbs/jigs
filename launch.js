// Set up nodemon to run jigs in development mode. Offers all sorts of nice
// features, restarting it if it's config changes, if it changes, etc.

const path = require('path')

const { green, bold, red } = require('colorette')
const nodemon = require('nodemon')
const jetpack = require('fs-jetpack')

let jigsConfig
if (jetpack.exists('./jigs.config.js')) {
  jigsConfig = require(path.resolve('./jigs.config.js'))
}

// set NODE_ENV according to the JIGS_MODE
// TODO: sometimes, for an app with a back-end, "jigs build" may be used to
// build a dev site, so we shouldn't hard-code the NODE_ENV here.
if (process.env.JIGS_MODE === 'build') {
  process.env.NODE_ENV = 'production'
} else {
  process.env.NODE_ENV = 'development'
}

if (process.env.JIGS_MODE === undefined) {
  console.log(red(bold('Jigs was invoked without any JIGS_MODE env set')))
  process.exit(1)
} else if (process.env.JIGS_MODE === 'development') {
  nodemon({
    script: path.resolve(__dirname, 'build', 'index.js'),
    watch: [
      // restart jigs if any of these files in the project change...
      './jigs.config.js',
      'webpack.base.config.js',
      'webpack.client.config.js',
      'webpack.server.config.js',
      jigsConfig.rootTemplate,
      // ... or if jigs is rebuilt
      path.resolve(__dirname, 'build')
    ],
    delay: 0.1,
    env: process.env
  })

  const saySomething = thing => {
    console.log(green(bold(`[${thing}]`)))
  }

  let isRestarting = false
  nodemon.on('start', function () {
    if (!isRestarting) {
      saySomething('Jigs is starting (enter "rs" to restart at any time)')
    }
    isRestarting = false
  }).on('quit', function () {
    saySomething('Jigs has quit')
    process.exit()
  }).on('restart', function () {
    isRestarting = true
    saySomething('Jigs is restarting')
  })
} else if (process.env.JIGS_MODE === 'build') {
  const c = require('child_process')
    .spawnSync(
      'node', [
        `${path.resolve(__dirname, 'build', 'index.js')}`,
        ...process.argv.slice(2)
      ], {
        stdio: 'inherit',
        // child process inherits environment
        env: process.env
      },
      err => {
        console.log('??')
        if (err.code) {
          process.exit(err.code)
        }
      }
    )
} else {
  console.log(red(bold(`Unknown JIGS_MODE env "${process.env.JIGS_MODE}"`)))
}
