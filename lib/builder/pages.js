
// Functionality to handle pages

// TODO: add unit tests

import path from 'path'
// import jetpack from 'fs-jetpack'
import { map, compose, curry } from 'crocks'

import { logOp } from '../logging'
import { loadResource, getPaths } from './common'

const PAGE_EXT = 'html'

// config -> [ String ]
// TODO: need to support multiple extensions
const getPagePaths = config => getPaths(config.dirs.source, PAGE_EXT)

// config -> [ page ]
// loads a flat list of pages
// TODO: maybe Pair ADT can remove the need of creating a closure here (so we
// can access `config` partway through the compose pipeline)
export const loadPages = config => compose(
  // [ String ] -> [ pages ]
  map(
    // load page
    loadResource(PAGE_EXT, config.dirs.source)
  ),
  // config -> [ String ]
  getPagePaths
)(config)

// Config -> Page -> undefined
export const writePage = curry((config, page) => {
  const pagePath = path.join(config.dirs.build, page.name)
  logOp(`Wrote -> ${pagePath}`)
})
