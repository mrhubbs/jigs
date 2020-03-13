
import path from 'path'

import { Resolved } from 'crocks/Async'
import loaderUtils from 'loader-utils'
import { curry } from 'crocks'
import LRU from 'lru-cache'
import hash from 'hash-sum'

import MarkdownIt from '../markdown'
import { parseResource, assembleSingleFileVueComponent } from '../pages'
import { getTocLines, renderToc } from '../toc'
import {
  writeBlock,
  stringifyBlocks,
  filterBlocks,
  transformBlocks
} from '../../reusable/docBlocks'
import { kebabCase, throwArgument } from '../../reusable/toolbox'
import { formatDetail, relogLine } from '../../logging'

const cache = new LRU({ max: 1000 })

// max size cache (length of items), not necessarily bytes
// TODO: is this a good size?
// const layoutCache = new LRU({ max: 1000 })

export const buildSFC = curry(function (config, resourcePath, addDependency, page) {
  let { blocks } = page

  // get the page name: filename without extension, kebab-case
  const pageName = kebabCase(
    path.basename(page.name)
    .split('.')
    .slice(0, 1)
    // doesn't do any joining, just removes the Array around the
    // string since the previous result is an array of length 1
    .join('')
  )

  // render every markdown block into HTML
  // while we are doing that, generate table-of-contents
  let headings = [ ]

  blocks = transformBlocks(
    blocks,
    [ 'md' ],
    lines => {

      // extract headings from each Markdown block, if this page should have a
      // table of contents
      if (blocks.frontMatter.toc === true) {
        headings = [ ...headings, ...getTocLines(config, page.blocks.frontMatter, lines) ]
      }

      // render the Markdown block to HTMLs
      return MarkdownIt.render(lines.join('\n')).split('\n')
    }
  )

  // put all the HTML + markdown blocks together
  let template = stringifyBlocks(blocks, 'html', 'md')
  // remove all the markdown and html blocks
  blocks = filterBlocks(blocks, ({ label }) => label !== 'html' && label !== 'md')

  // if we have a table of contents, put it at the beginning of the `template`
  if (blocks.frontMatter.toc) {
    // render the table of contents and inject into the wrapper
    const tableOfContentsHTML = config.toc.wrapper.replace(
      '[[toc]]',
      renderToc(headings)
    )

    template = tableOfContentsHTML + '\n' + template
  }

  // re-add the combined blocks as the template
  blocks = writeBlock(blocks, 'template', template.split('\n'))
  // TODO: the assembleSingleFileVueComponent should behave
  // differently depending on if we're building a Markdown component
  // or just a page. Errr. no?
  const sfc = assembleSingleFileVueComponent(config, blocks, pageName)

  return Resolved(sfc)
})

export default function(source, sourceMap) {
  // get options
  const options = loaderUtils.getOptions(this)
  // get jigs config
  const config = options.config
  // get the callback
  const callback = this.async()

  // Check if we've processed and cached this source. Since this loader is
  // chained with vue-loader, it'll get queried multiple times for the different
  // blocks (that are in a .vue file).
  const file = this.resourcePath
  const key = hash(file + source)
  const cached = cache.get(key)
  if (cached) {
    callback(null, cached, sourceMap)
    return cached
  }

  relogLine(formatDetail(path.relative(config.dirs.pages, this.resourcePath)))

  // TODO: handle caching so we don't do the same processing repeatedly
  // This is necessary because the vue-loader will cause multiple requests to be
  // made on the same file

  // TODO: wow this is messy?
  let page
  parseResource(config.dirs.pages, this.resourcePath, source)
  .bimap(
    throwArgument,
    // validate the page
    // TODO: expand and move to pages.js
    p => {
      // allow markdown components to not have a layout
      if (
        p.blocks.frontMatter.layout === undefined &&
        p.blocks.frontMatter.type !== 'markdown-component'
      ) {
        throw new Error(`Page ${this.resourcePath} doens't have a layout set`)
      }

      return p
    }
  )
  .bimap(
    callback,
    p => { page = p }
  )

  buildSFC(config, this.resourcePath, this.addDependency, page)
  .fork(
    callback,
    sfc => {
      const processedSource = `<template>${sfc.template}</template>

<script>${sfc.script}</script>`

      cache.set(key, processedSource)

      callback(
        null,
        processedSource,
        sourceMap
      )
    }
  )
}
