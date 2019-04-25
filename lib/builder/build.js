// code for HTML building - build mode

import Async from 'crocks/Async'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { identity } from 'crocks/combinators'

import { logInfo, logDetail } from '../logging'
import { loadLayouts } from './layouts'
import { loadPages, createPageRenderers, writePages } from './pages'
import { objectToArray } from '../reusable/functional'
import { deletePathIfSafe } from '../reusable/toolbox'

// ForgeConfig -> { Layout}(optional) -> [ Page ](optional) -> Async(Error String, ())
// run a production build
// builds HTML and copies assets
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

// ForgeConfig -> Async(Error String, String)
export const cleanBuild = config => {
  logInfo('Cleaning build')
  return deletePathIfSafe(config, config.dirs.build)
}
