
// TODO: unit test much of the functionality in this file.

import jetpack from 'fs-jetpack'
import path from 'path'
import chokidar from 'chokidar'
import Async from 'crocks/Async'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { curry } from 'crocks'
import { identity } from 'crocks/combinators'

import { logHeader, logInfo, logDetail, logRawDetail, logFailure } from '../logging'
import { loadLayouts } from './layouts'
import { loadPages, loadPage, addPage, createPageRenderers, writePages, renderAndWritePage, removePage } from './pages'
import { sourcePagePathToBuildPagePath } from './common'
import { objectToArray } from '../reusable/functional'

// ForgeConfig -> Async
// run a production build
export const build = config => {
  let createRenderers = Async.of(createPageRenderers(config))
  .ap(eitherToAsync(loadLayouts(config)))
  .ap(eitherToAsync(loadPages(config)))
  // We've wrapped `createPageRenderers` in an Async so we can conveniently load
  // the layouts and pages concurrently and apply them to it. However, that
  // function ultimately returns an Async. So we've got nested Asyncs. To
  // simplify running the Async we'll smish them together.
  // NOTE: normally we'd use a method called `join`. For some reason Crocks
  // doesn't have that. However, it does have chain, which, by definition,
  // performs an operation and than flattens the Monad.
  .chain(identity)

  // TODO: unfortutunately, we get a nested Async structure
  // create the renderers
  // TODO: move into pages.js?
  return Async((reject, resolve) => {
    createRenderers.fork(
      reject,  // woops, error creating the renderers or rendering
      // creating renderers worked and we rendered
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
  })
}

// ForgeConfig -> Async
// start a prototyping, watching build,
export const prototype = config =>
  Async((reject, resolve) => {
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

// ForgeConfig -> ()
const startWatching = config => {
  logHeader('Initial build complete')
  // After the initial build, kick off the watching

  logHeader('Watching layouts and pages')

  // TODO: would like to get these from the initial build and not have to reload
  // them
  let layouts = loadLayouts(config)
  let pages = loadPages(config)
  let context = { layouts, pages }

  // First, watch the pages
  // ignores dotfiles
  let pageWatcher = chokidar.watch(config.dirs.pages, {ignored: /(^|[/\\])\../})
  pageWatcher.on('ready', () => {
    // don't start watching until the initial scan is complete, because
    // the initial scan spits out all the files

    // NOTE: these will mutate the context
    pageWatcher.on('add', pageFileAdded(config, context))
    pageWatcher.on('change', pageFileChanged(config, context))
    pageWatcher.on('unlink', pageFileRemoved(config, context))
  })

  // Now watch the layouts
  let layoutWatcher = chokidar.watch(config.dirs.layouts, {ignored: /(^|[/\\])\../})
  layoutWatcher.on('ready', () => {
    // layout changes -> reload -> re-flatten -> find all dependent pages -> re-render all of them
    ///

    // NOTE: these will mutate the context
    // layoutWatcher.on('add', layoutFileAdded(config, context))
    // layoutWatcher.on('change', layoutFileChanged(config, context))
    // layoutWatcher.on('unlink', layoutFileRemoved(config, context))
  })
}

// ForgeConfig -> Context -> (String -> ()) -> String -> ()
// Common to adding and changing a page
const reloadAndRerenderPage = (config, context, logPageName, filePath) => {
  // load the new page
  let page = loadPage(config, filePath)

  // create a job to render and write the page
  let rendererAndWriter = Async.of(renderAndWritePage(config))
  .ap(eitherToAsync(context.layouts))
  .ap(eitherToAsync(page))
  .chain(identity)

  // TODO: avoid nesting...
  rendererAndWriter.fork(
    logFailure,
    p => {
      logPageName(p)
      context.pages = addPage(context.pages, page)
    }
  )
}

// ForgeConfig -> Context -> String -> ()
// load page -> render
const pageFileAdded = curry((config, context, filePath) => {
  return reloadAndRerenderPage(
    config,
    context,
    outPath => logRawDetail('+', outPath),
    filePath
  )
})

// ForgeConfig -> Context -> String -> ()
// reload -> re-render
const pageFileChanged = curry((config, context, filePath) => {
  return reloadAndRerenderPage(
    config,
    context,
    logDetail,
    filePath
  )
})

// ForgeConfig -> Either(Error String, { Pages }) -> String -> ()
// remove from build directory
const pageFileRemoved = curry((config, context, filePath) => {
  // removed a page
  // convert path to build path
  const outFilePath = sourcePagePathToBuildPagePath(config, filePath)

  // sanity-check that we are deleting something in the build directory, and not somewhere else!
  if (outFilePath.startsWith(config.dirs.build)) {
    jetpack.remove(outFilePath)
    logRawDetail('-', path.relative(config.dirs.build, outFilePath))

    const name = path.relative(config.dirs.pages, filePath)
    context.pages = removePage(context.pages, name)
  } else {
    logFailure(`Erroneously generated delete path ${outFilePath}`)
  }
})
