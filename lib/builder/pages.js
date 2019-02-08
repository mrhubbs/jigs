
// Functionality to handle pages

// TODO: add functional tests

import { map, compose } from 'crocks'

import { loadResource, getPaths } from './common'

const PAGE_EXT = 'html'

// config -> [ String ]
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
