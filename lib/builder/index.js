
// TODO: unit test much of the functionality in this file.

import jetpack from 'fs-jetpack'
import path from 'path'
import chokidar from 'chokidar'
import Async from 'crocks/Async'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { curry } from 'crocks'

import { logHeader, logInfo, logDetail, logRawDetail, logFailure } from '../logging'
import { loadLayouts } from './layouts'
import { loadPages, createPageRenderers, writePages, renderAndWritePage, reloadPage, removePage } from './pages'
import { sourcePagePathToBuildPagePath } from './common'
import { objectToArray } from '../reusable/functional'

// ForgeConfig -> Async
// run a production build
export const build = config => {
  let createRenderers = Async.of(createPageRenderers(config))
  .ap(eitherToAsync(loadLayouts(config)))
  .ap(eitherToAsync(loadPages(config)))

  // TODO: unfortutunately, we get a nested Async structure
  // create the renderers
  // TODO: move into pages.js?
  return Async((reject, resolve) => {
    createRenderers.fork(
      reject,  // woops, error creating the renderers
      renderers => {
        // creating renderers worked, now render
        renderers.fork(
          reject,  // woops, error while rendering
          // we've rendered and gotten all the pages, now write them all
          pages => {
            // write pages
            writePages(config, objectToArray(pages))
            .fork(
              reject,  // woops, error writing pages
              // all done!
              pageResults => {
                logInfo('Rendered pages')
                pageResults.forEach(logDetail)

                resolve()
              }
            )
          }
        )
      }
    )
    // that was three forks, folks
  })
}

// ForgeConfig -> Async
// start a prototyping, watching build,
export const prototype = config => {
  return Async((reject, resolve) => {
    build(config)
    .fork(
      err => {
        logFailure(err),
        // start watching anyway
        () => {
          startWatching(config)
          resolve()
        }
      },
      () => {
        startWatching(config)
        resolve()
      }
    )
  })
}

// ForgeConfig -> ()
const startWatching = config => {
  logHeader('Initial build complete')
  // After the initial build, kick off the watching

  logHeader('Watching layouts and pages')

  // TODO: would like to get these from the initial build and not have to reload
  // them
  let layouts = loadLayouts(config)
  let pages = loadPages(config)

  // First, watch the pages
  // ignores dotfiles
  let pageWatcher = chokidar.watch(config.dirs.pages, {ignored: /(^|[/\\])\../})
  pageWatcher.on('ready', () => {
    // don't start watching until the initial scan is complete, because
    // the initial scan spits out all the files

    pageWatcher.on('add', addPage(config, layouts, pages))  // this will mutate the pages
    pageWatcher.on('change', pageChanged(config, layouts, pages))  // this will mutate the pages
    pageWatcher.on('unlink', pageRemoved(config, pages))
  })

  // Now watch the layouts
  let layoutWatcher = chokidar.watch(config.dirs.layouts, {ignored: /(^|[/\\])\../})
  layoutWatcher.on('ready', () => {
    // layout changes -> reload -> re-flatten -> find all dependent pages -> re-render all of them
    ///
  })
}

// Common to adding and changing a page
const reloadAndRerenderPage = (config, layouts, pages, resolve, filePath) => {
  // put the new page into pages
  const page = reloadPage(config, pages, filePath)

  pages.map(ps => {
    console.log(Object.keys(ps))
    return ps
  })

  let renderer = Async.of(renderAndWritePage(config))
  .ap(eitherToAsync(layouts))
  .ap(eitherToAsync(page))

  // TODO: avoid nesting...
  renderer.fork(
    logFailure,
    writer => {
      writer.fork(
        logFailure,
        p => {
          pages.map(ps => {
            console.log(Object.keys(ps))
            return ps
          })
          resolve(p)
        }
      )
    }
  )
}

// ForgeConfig -> { Layout } -> { Page } -> String -> ()
// load page -> render
const addPage = curry((config, layouts, pages, filePath) => {
  return reloadAndRerenderPage(
    config,
    layouts,
    pages,
    outPath => logRawDetail('+', outPath),
    filePath
  )
})

// ForgeConfig -> String -> ()
// reload -> re-render
const pageChanged = curry((config, layouts, pages, filePath) => {
  return reloadAndRerenderPage(
    config,
    layouts,
    pages,
    logDetail,
    filePath
  )
})

// ForgeConfig -> String -> ()
// remove from build directory
const pageRemoved = curry((config, pages, filePath) => {
  // removed a page
  // convert path to build path
  const outFilePath = sourcePagePathToBuildPagePath(config, filePath)

  // sanity-check that we are deleting something in the build directory, and not somewhere else!
  if (outFilePath.startsWith(config.dirs.build)) {
    jetpack.remove(outFilePath)
    logRawDetail('-', outFilePath)

    const name = path.relative(config.dirs.pages, filePath)

    pages.map(ps => {
      console.log(Object.keys(ps))
      return ps
    })

    removePage(pages, name)
    pages.map(ps => {
      console.log(Object.keys(ps))
      return ps
    })
  } else {
    logFailure(`Erroneously generated delete path ${outFilePath}`)
  }
})
