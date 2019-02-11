
// TODO: unit test much of the functionality in this file.

const renderer = require('vue-server-renderer').createRenderer()

import Vue from 'vue'
import { curry } from 'crocks'

import { loadLayouts } from './layouts'
import { loadPages, writePage } from './pages'
import { applyLayout } from './common'

// run a production build
export const build = config => {
  const pagesPromise = renderPages(
    config,
    loadLayouts(config),
    loadPages(config)
  )

  pagesPromise.then(pages => {
    console.log(pages[0])
    pages.forEach(writePage(config))
  })
}

// run a prototyping build,
// call `initialBuildComplete` when done
export const prototype = (config, initialBuildComplete) => {
  console.log(config, initialBuildComplete)
}

// Config -> Layouts -> Page -> Promise String
// Renders the given page and returns the resulting string.
export const renderPage = curry((config, layouts, page) => {
  // apply the layout to the page
  const theLayout = layouts[page.frontMatter.layout]
  if (!theLayout) {
    throw new Error(`Page ${page.name} specifies unknown layout ${page.frontMatter.layout}`)
  }
  const pageLaidOut = applyLayout(page, theLayout)

  // Merge the metadata from the Forge configuration into the page's front
  // matter. We'll make this available as the context of the component we're
  // going to render.
  let context = Object.assign({ }, config.metadata, pageLaidOut.frontMatter)

  // Create a new view instance to render
  let vm = new Vue({
    data: context,
    template: pageLaidOut.template
  })

  // render
  // TODO: should be able to pass `context` data object as second argument,
  // but it's not being used. Instead we give the Vue instance a data object
  // above.
  return renderer.renderToString(vm)
})

// Config -> Layouts -> Pages -> [ String ]
// neat how we built this function, huh?
const renderPages = (config, layouts, pages) => Promise.all(
  pages.map(
    renderPage(config, layouts)
  )
)
