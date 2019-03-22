
// Functionality to handle pages

// TODO: add unit tests

import path from 'path'
import jetpack from 'fs-jetpack'
const renderer = require('vue-server-renderer').createRenderer()
import Vue from 'vue'
import MarkdownIt from './markdown'

import { map, compose, curry, chain } from 'crocks'
import { Right, Left } from 'crocks/Either'
import sequence from 'crocks/pointfree/sequence'
import Async from 'crocks/Async'
import { Rejected } from 'crocks/Async'

import { logInfo } from '../logging'
import { callSomething, arrayOfObjectsToObject, objectToArray} from '../reusable/functional'
import { applyLayout, loadResource, getPaths, transformExtension } from './common'

const PAGE_EXTS = [ 'html', 'md' ]

// Config -> [ String ]
// TODO: need to support multiple extensions
const getPagePaths = config => getPaths(config.dirs.pages, PAGE_EXTS)

// Config -> [ Either(Error String, Page) ]
// loads a flat list of pages
// TODO: maybe Pair ADT can remove the need of creating a closure here (so we
// can access `config` partway through the compose pipeline)
export const loadPages = config => compose(
  callSomething(() => logInfo('Loaded pages')),
  // Either(Error String, [ Page ]) -> Either(Error String, { Page })
  map(arrayOfObjectsToObject('name')),
  // [ Either(Error String, Page) ] -> Either(Error String, [ Page ])
  sequence(Right),
  // [ String ] -> [ Either(Error String, Page) ]
  map(
    compose(
      // validate
      chain(validatePage),
      // load page
      loadResource(config.dirs.pages)
    )
  ),
  // Config -> [ String ]
  getPagePaths
)(config)

// ForgeConfig -> String -> Either(Error String, Page)
export const loadPage = (config, pagePath) => loadResource(config.dirs.pages, pagePath)

// Either(a, { b }) -> Either(a, { c }) -> Either(a, { b, c })
export const addPage = (pagesEither, pageEither) => pagesEither.map(
  // Get at the pages, if we can
  pages => {
    // Get at the page, if we can
    // TODO: this is not functional!?
    pageEither.map(page => {
      // Replace the page with the newly-loaded page
      pages[page.name] = page
      return page
    })

    return pages
  }
)

// Either(a, { b }) -> String -> Either(a, { })
export const removePage = (pagesEither, name) => pagesEither.map(
  pages => {
    delete pages[name]
    return pages
  }
)

// Page -> Either(Error String, Page)
const validatePage = page => {
  // We require pages to have layouts... hmm...
  if (!page.frontMatter) {
    return Left(
      new Error(`Page "${page.name}" has no frontMatter`)
    )
  } else if (!page.frontMatter.layout) {
    return Left(
      new Error(`Page "${page.name}" has no layout`)
    )
  }

  return Right(page)
}

// Config -> Page -> Async((), String)
export const writePage = curry((config, page) => Async((rej, res) => {
  const pagePath = path.join(config.dirs.build, page.name)

  // TODO: can't check the success of this...
  // TODO: is doing this non-async slowing things down?
  // especially with lots of pages...
  jetpack.write(pagePath, page.rendered)

  res(page.name)
}))

// Config -> [ Page ] -> Async((), [ String ])
export const writePages = curry((config, pages) => {
  return sequence(
    Async,
    pages.map(writePage(config))
  )
})

// (Config -> Layouts -> Page) -> Async(Error String, Rendered Page)
// Renders the given page and returns the resulting string.
export const renderPage = curry((config, layouts, page) => {
  // apply the layout to the page

  const theLayout = layouts[page.frontMatter.layout]
  if (!theLayout) {
    return Rejected(
      new Error(`Page "${page.name}" specifies unknown layout "${page.frontMatter.layout}"`)
    )
  }

  // if the page is in markdown, render markdown to html before before applying
  // the layout and rendering with Vue
  if (page.name.endsWith('md')) {
    // create a new page, don't mutate!
    page = {
      ...page,
      // replace the extension with .html
      name: transformExtension('.md', '.html', page.name),
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

export const renderAndWritePage = curry((config, layouts, page) =>
  renderPage(config, layouts, page)
  .chain(writePage(config))
)

// Config -> Layouts -> { Page } -> Async(Error String, [ Rendered Page ])
export const createPageRenderers = curry((config, layouts, pages) => {
  // [ Async(Error String, Rendered Page) ]
  const renderers = map(renderPage(config, layouts), objectToArray(pages))

  return sequence(Async, renderers)
})

// object -> Vue Instance
const createVueInstance = opts => new Vue(opts)
