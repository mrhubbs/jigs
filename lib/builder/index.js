
// TODO: unit test much of the functionality in this file.

import { compose } from 'crocks'
import Async from 'crocks/Async'
import eitherToAsync from 'crocks/Async/eitherToAsync'

import { logInfo, logFailure, logDetail } from '../logging'
import { loadLayouts } from './layouts'
import { loadPages, createPageRenderers, writePages } from './pages'

// run a production build
export const build = config => {
  let createRenderers = Async.of(createPageRenderers(config))
  .ap(eitherToAsync(loadLayouts(config)))
  .ap(eitherToAsync(loadPages(config)))

  // TODO: unfortutunately, we get a nested Async structure
  // create the renderers
  // TODO: move into pages.js?
  createRenderers.fork(
    logFailure,  // woops, error creating the renderers
    renderers => {
      // creating renderers worked, now render
      renderers.fork(
        logFailure,  // woops, error while rendering
        // we've rendered and gotten all the pages, now write them all
        pages => {
          // write pages
          writePages(config, pages)
          .fork(
            logFailure,  // woops, error writing pages
            // all done!
            pageResults => {
              logInfo('Rendered pages')
              pageResults.forEach(
                compose(
                  logDetail,
                  msg => `✓ ${msg}`
                )
              )
            }
          )
        }
      )
    }
  )
  // that was three forks, folks
}

// run a prototyping build,
// call `initialBuildComplete` when done
export const prototype = (config, initialBuildComplete) => {
  console.log(config, initialBuildComplete)
}
