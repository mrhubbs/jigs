// BrowserSync set up

import path from 'path'
import { bold, white } from 'colorette'
import browserSync from 'browser-sync'

import { logRaw } from './logging'

// Set up Browser Sync
export const start = (forgeConfig, middleware) => {
  const serveDir = path.join(process.cwd(), forgeConfig.dirs.build)
  const port = 3000

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
    port,
    middleware: [
      ...middleware
    ],
    // don't auto-open a browser tab
    open: false,
    logLevel: 'silent'
  })

  // TODO: get and log external access URL

  logRaw(`Prototype site at ${bold(white('http://localhost:'+port))}`)
}
