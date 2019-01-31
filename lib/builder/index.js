
// TODO: unit test much of the functionality in this file.

const Vue = require('vue')
const renderer = require('vue-server-renderer').createRenderer()

const layouts = require('./layouts')

module.exports = { }

// run a production build
module.exports.build = (config) => {
  theLayouts = layouts.loadLayouts(config)
}

// run a prototyping build,
// call `initialBuildComplete` when done
module.exports.prototype = (config, initialBuildComplete) => {

}

// Renders the given page and returns the resulting string.
module.exports.renderPage = (config, layouts, page) => {
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
}
