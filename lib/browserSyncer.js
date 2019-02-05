// BrowserSync set up

const path = require('path')
const browserSync = require('browser-sync')

// Set up Browser Sync
const startBrowserSync = (forgeConfig, middleware) => {
  const serveDir = path.join(process.cwd(), forgeConfig.dirs.build)

  browserSync({
    // TODO: are these patterns correct?
    files: [
      path.join(serveDir, '*'),
      path.join(serveDir, '**', '*'),
    ],
    cwd: serveDir,
    watchEvents: [
      'add', 'change', 'unlink', 'addDir', 'unlinkDir'
    ],
    watchOptions: {
      // TODO: why this option?
      'ignoreInitial': true
    },
    server: {
      baseDir: serveDir,
    },
    middleware: [
      ...middleware
    ],
    // don't auto-open a browser tab
    open: false
  })
}

module.exports = {
  start: startBrowserSync
}
