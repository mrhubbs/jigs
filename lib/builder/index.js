
// TODO: unit test much of the functionality in this file.

import jetpack from 'fs-jetpack'
import path from 'path'
import chokidar from 'chokidar'
import Async from 'crocks/Async'
import { Resolved, Rejected } from 'crocks/Async'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { curry } from 'crocks'
import { identity } from 'crocks/combinators'

import { logHeader, logInfo, logDetail, logRawDetail, logFailure } from '../logging'
import { loadLayouts, loadLayout } from './layouts'
import { loadPages, loadPage, addPage, removePage, createPageRenderers, writePages, renderAndWritePage } from './pages'
import { sourcePagePathToBuildPagePath, applyLayout } from './common'
import { objectToArray, saySome, noop } from '../reusable/functional'

// ForgeConfig -> { Layout}(optional) -> [ Page ](optional) -> Async(Error String, ())
// run a production build
export const build = (config, layouts, pages) => {
  let createRenderers = Async.of(createPageRenderers(config))
  .ap(eitherToAsync(layouts || loadLayouts(config)))
  .ap(eitherToAsync(pages || loadPages(config)))
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
// start a prototyping, watching build
// TODO: if the build was broken, we'll start watching, but will we ever be able
// to recover? Ideally we could.
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
    // NOTE: these will mutate the context
    layoutWatcher.on('add', layoutFileAdded(config, context))
    layoutWatcher.on('change', layoutFileChanged(config, context))
    layoutWatcher.on('unlink', layoutFileRemoved(config, context))
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

// ForgeConfig -> Context -> String -> ()
// remove from build directory and pages
const pageFileRemoved = curry((config, context, filePath) => {
  // removed a page
  // convert path to build path
  const outFilePath = sourcePagePathToBuildPagePath(config, filePath)

  // sanity-check that we are deleting something in the build directory, and not somewhere else!
  deleteFileIfSafe(config, outFilePath)
  .fork(
    logFailure,
    () => {
      logRawDetail('-', path.relative(config.dirs.build, outFilePath))

      const name = path.relative(config.dirs.pages, filePath)
      context.pages = removePage(context.pages, name)
    }
  )
})

// ForgeConfig -> Context -> String -> ()
const layoutFileAdded = curry((config, context, filePath) => {
  let layoutEither = loadLayout(config, filePath)

  layoutEither
  .map(
    // TODO: want not a good functional way to pull out the value in the
    // container
    layout => {
      // apply the layout and add it to the layouts
      context.layouts = context.layouts.map(layouts => {
        // TODO: this code is too specific, but it in a function somewhere else
        // Does this layout depend on any layouts?
        const parentLayoutName = layout.frontMatter.layout
        if (parentLayoutName) {
          let parentLayout = layouts[parentLayoutName]

          if (!parentLayout) {
            logFailure(`Layout ${layout.name} depends on non-existent layout ${parentLayoutName}`)
            return
          }

          // Wrap the parent layout around the child
          layout = applyLayout(layout, parentLayout)
        }

        // layout is ready, add to the layouts
        layouts[layout.name] = layout
        logRawDetail('+', layout.name)
        return layouts
      })
    }
  )
})

// ForgeConfig -> Context -> String -> ()
// reload -> re-render
// eslint-disable-next-line no-unused-vars
const layoutFileChanged = curry((config, context, filePath) => {
  // reload ALL layouts
  context.layouts = loadLayouts(config)
  // TODO: would like to reload only the layout that changed and re-render only
  // the pages that depend on it + it's dependent layouts. That's a bit of a
  // difficult computation because we have to manage the layout inheritance.
  build(config, context.layouts, context.pages)
  .fork(
    logFailure,
    noop
  )
})

// ForgeConfig -> Context -> String -> ()
// remove from build directory and layouts,
// error if any pages depend on the layout
const layoutFileRemoved = curry((config, context, filePath) => {
  // determine the name of the layout
  const layoutName = path.relative(config.dirs.layouts, filePath)

  // TODO: the constructs here, in an attempt to be functional, feel really
  // awkward - not doing it right

  // Do any pages depend on this layout file?
  // depends :: Either(Left Error String, Right ())
  let depends = eitherToAsync(context.pages).chain(
    pages => {
      let found = Object.values(pages).reduce((sum, page) => {
          if (page.frontMatter.layout === layoutName) sum.push(page)
          return sum
        },
        [ ]
      )

      // 1+ pages use the layouts
      if (found.length > 1) {
        return Rejected(
          new Error(
            `Page(s) ${saySome(3, found.map(p => p.name))} depend(s) on the ` +
            `layout just deleted: ${layoutName}`
          )
        )
      } else {
        return Resolved()
      }
    }
  )

  depends.fork(
    logFailure,
    () => {
      logRawDetail('-', layoutName)
      // remove from the layouts
      context.layouts = removePage(context.layouts, layoutName)
    }
  )
})

// ForgeConfig -> String -> Async(String, String)
const deleteFileIfSafe = (config, filePath) => Async((reject, resolve) => {
  // is the `filePath` in the build dir?
  if (filePath.startsWith(config.dirs.build)) {
    // yup, remove`
    jetpack.remove(filePath)
    resolve(filePath)
  } else {
    // no! we don't want to delete anything outside of the build dir!!!
    reject(`Erroneously generated delete path ${filePath}`)
  }
})
