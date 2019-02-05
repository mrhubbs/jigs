
// TODO: unit test much of the functionality in this file.

// const Vue = require('vue')
// const renderer = require('vue-server-renderer').createRenderer()

import { loadLayouts } from './layouts'

// run a production build
export const build = config => {
  const theLayouts = loadLayouts(config)
  return theLayouts
}

// run a prototyping build,
// call `initialBuildComplete` when done
export const prototype = (config, initialBuildComplete) => {
  console.log(config, initialBuildComplete)
}

// Renders the given page and returns the resulting string.
// export const renderPage = (config, layouts, page) => {
  // Merge the metadata from the Forge configuration into our context object.
  // let context = Object.assign({ }, config.metadata, frontMatter)
  // let vm = new Vue({
  //   data: context,
  //   template: template
  // })
  // TODO: should be able to pass `context` data object as second argument,
  // but it's not being used. Instead we give the Vue instance a data object
  // above.

  // renderer.
  // return [ layoutPath, renderer.renderToString(vm) ]
// }
