
import path from 'path'

import semver from 'semver'
import { createServer } from 'http-server'

import { logFailure, logHeader, logInfo } from './lib/logging'
const jigsPackage = require('./package.json')

// Determine run command from CLI arguments
let runCmd = process.argv[2]
const args_and_options = process.argv.slice(2)

if (args_and_options.includes('-v') || args_and_options.includes('--version')) {
  console.log(jigsPackage.version)
  process.exit(0)
}

// initialize a new project
// (do this before anything else because we try to load a config below, and a
// new, empty project won't have a config)
if (runCmd === 'init') {
  require('./lib/initer')()
  logHeader('Done initializing new jigs project')
  process.exit(0)
}

// default to development, if no runCmd is specified
if (runCmd === undefined || runCmd === 'dev') {
  runCmd = 'development'
}

const runMode = runCmd === 'development' ? 'development' : 'production'

const Async = require('crocks/Async')

// load the configuration
const config = require('./lib/config').load(runMode)
const builder = require('./lib/builder')
const webpacker = require('./lib/webpacker')
const { runDevServerInWatch } = require('./lib/dev-server')
const ePackager = require('./lib/e--packager')

// check compatibility between jigs and the client project
if (!semver.satisfies(jigsPackage.version, config.jigsVersion)) {
  logFailure(
    `The client project ${path.basename(process.cwd())} requires version ` +
    `${config.jigsVersion} of jigs, but the jigs version is ` +
    `${jigsPackage.version}`
  )
  process.exit(1)
}

logHeader('Jigs is starting up...')

// now, vee build! (or prototype... or something else...)
if (runCmd === 'build') {
  builder.cleanBuild(config)
  // write the routes
  .chain(() =>
    Async
      .of(builder.writeGeneratedRoutes(config))
      .ap(Async.Resolved(builder.generateRoutes(config)))
  )
  // Run the client and server builds in parallel.
  .chain(routeData => {
    logHeader('Building front-end\n')
    return Async.all([
      Async.Resolved(routeData),  // pass this through
      webpacker.build(config, 'production', 'client'),
      webpacker.build(config, 'production', 'server')
    ])
  })
  .chain(([ [ routes ] ]) => {
    logHeader('Generating HTML pages\n')
    // the route template comes second, remove it
    routes = routes.map(e => [ e[0], e[2] ])
    builder.generateAndWritePages(config, routes)
    return Async.Resolved(1)
  })
  .fork(
    () => {
      logFailure('something went wrong, there should be a more helpful error message above\n')
      process.exit(1)
    },
    () => { }
  )
} else if (runCmd === 'development') {
  builder.cleanBuild(config)
  .chain(() =>
    Async
      .of(builder.writeGeneratedRoutes(config))
      .ap(
        Async.Resolved(
          // decide whether or not to start with all routes rendered
          config.preBuildPages
          ?
          builder.generateRoutes(config)
          :
          null
        )
      )
  )
  // Run the client and server builds in parallel, starting up the dev server
  // when they finish. (They are run in watch mode, so they will keep
  // running...)
  .chain(routeData => {
    logHeader('Building front-end (HMR)\n')
    return Async.all([
      Async.Resolved(routeData),  // pass this through
      webpacker.develop(config, 'development', 'client'),
      webpacker.buildWatch(config, 'development', 'server')
    ])
  })
  .fork(
    () => {
      logFailure('something went wrong, there should be a more helpful error message above\n')
      process.exit(1)
    },
    ([ routeData ]) => {
      // run webpack in dev mode for hot reloading
      // webpacker.develop(config)
      // also start up a server to handle the bundle rendering
      runDevServerInWatch(config, routeData[0])
    }
  )
} else if (runCmd === 'serve') {
  createServer({
    root: config.dirs.buildRoot
  })
  .listen(
    config.staticServer.port,
    config.staticServer.host,
    err => {
      if (err) {
        logFailure(err)
      } else {
        const host = [ '127.0.0.1', '0.0.0.0'].includes(config.staticServer.host)
        ?
        'localhost'
        :
        config.staticServer.host

        logInfo(`Serving on http://${host}:${config.staticServer.port}${config.metadata.baseurl}`)
      }
    }
  )
} else if (runCmd === 'test') {
  // run jest and exit
  require('child_process')
    .spawnSync(
      'npx', [
        'jest',
        ...process.argv.slice(2)
      ], {
        stdio: 'inherit',
        // child process inherits environment
        env: process.env
      },
      err => {
        if (err.code) {
          process.exit(err.code)
        }
      }
    )
} else if (runCmd === 'pkg-e-') {
  ePackager(config)
} else {
  logFailure(`Unknown run command "${runCmd}"`)
  process.exit(1)
}
