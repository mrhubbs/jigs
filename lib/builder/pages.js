
// Functionality to handle pages

// TODO: add unit tests

import path from 'path'
import jetpack from 'fs-jetpack'
const renderer = require('vue-server-renderer').createRenderer()
import Vue from 'vue'
import MarkdownIt from './markdown'

import { map, compose, curry } from 'crocks'
import { Right } from 'crocks/Either'
import sequence from 'crocks/pointfree/sequence'
import Async from 'crocks/Async'

import { logInfo } from '../logging'
import { callSomething } from '../reusable/functional'
import { applyLayout, loadResource, getPaths } from './common'

const PAGE_EXTS = [ 'html', 'md' ]

// Config -> [ String ]
// TODO: need to support multiple extensions
const getPagePaths = config => getPaths(config.dirs.source, PAGE_EXTS)

// Config -> [ Either(Error String, Page) ]
// loads a flat list of pages
// TODO: maybe Pair ADT can remove the need of creating a closure here (so we
// can access `config` partway through the compose pipeline)
export const loadPages = config => compose(
  callSomething(() => logInfo('Loaded pages')),
  // [ Either(Error String, Page) ] -> Either(Error String, [ Page ])
  sequence(Right),
  // [ String ] -> [ Either(Error String, Page) ]
  map(
    // load page
    loadResource(config.dirs.source)
  ),
  // Config -> [ String ]
  getPagePaths
)(config)

// Config -> Page -> Async((), String)
export const writePage = curry((config, page) => Async((rej, res) => {
  const pagePath = path.join(config.dirs.build, page.name)

  // TODO: can't check the success of this...
  jetpack.write(pagePath, page.rendered)

  res(page.name)
}))

// Config -> [ Page ] -> Async((), [ String ])
export const writePages = (config, pages) => {
  return sequence(
    Async,
    pages.map(writePage(config))
  )
}

// (Config -> Layouts -> Page) -> Async(Error String, Rendered Page)
// Renders the given page and returns the resulting string.
export const renderPage = curry((config, layouts, page) => {
  // apply the layout to the page
  const theLayout = layouts[page.frontMatter.layout]
  if (!theLayout) {
    return Async(rej => {
      rej(
        new Error(`Page "${page.name}" specifies unknown layout "${page.frontMatter.layout}"`)
      )
    })
  }

  // if the page is in markdown, render markdown to html before before applying
  // the layout and rendering with Vue
  if (page.name.endsWith('md')) {
    // create a new page, don't mutate!
    page = {
      ...page,
      // replace the extension with .html
      // TODO: this will goof if `name` has no . in it
      name: page.name.replace(path.extname(page.name), '.html'),
      template: MarkdownIt.render(page.template)
    }
  }

  // Insert the page into the layout it specifies.
  const pageLaidOut = applyLayout(page, theLayout)

  // Merge the metadata from the Forge configuration into the page's front
  // matter. We'll make this available as the context of the component we're
  // going to render.
  let context = Object.assign({ }, config.metadata, pageLaidOut.frontMatter)

  // Create a new view instance to render
  let vm = createVueInstance({
    data: context,
    template: pageLaidOut.template
  })

  // render
  return Async((rej, res) => {
    // TODO: should be able to pass `context` data object as second argument,
    // but it's not being used. Instead we give the Vue instance a data object
    // above.
    // returns a Promise...
    renderer.renderToString(vm)
    // call the Async rejected method
    .catch(rej)
    // resolve the Async
    .then(rendered => res({
      ...page,
      rendered,  // String with rendered page
      template: undefined  // drop the template to conserve memory
    }))
  })
})

// Config -> Layouts -> [ Page ] -> Async(Error String, [ Rendered Page ])
export const createPageRenderers = curry((config, layouts, pages) => {
  // [ Async(Error String, Rendered Page) ]
  const renderers = map(renderPage(config, layouts), pages)

  return sequence(Async, renderers)
})

// object -> Vue Instance
const createVueInstance = opts => new Vue(opts)
