
// Functionality to handle pages

// TODO: add unit tests

import path from 'path'

import jetpack from 'fs-jetpack'
const renderer = require('vue-server-renderer').createRenderer()
import Vue from 'vue'
import MarkdownIt from './markdown'

import { map, bimap, compose, curry, chain } from 'crocks'
import { ifElse } from 'crocks/logic'
import { Left, Right } from 'crocks/Either'
import Async, { Rejected } from 'crocks/Async'

import {
  makeDocBlocks,
  writeBlock,
  filterBlocks,
  stringifyBlocks,
  getFirst
} from '../reusable/docBlocks'
import {
  applyLayout,
  extractFrontMatter,
  processFrontMatter,
  getPaths,
  transformExtension,
  LAYOUT_EXT
} from './common'

const PAGE_EXTS = [ 'html', 'md' ]

// Config -> [ String ]
// TODO: need to support multiple extensions
export const getPagePaths = config => getPaths(config.dirs.pages, PAGE_EXTS)

// Page -> Either(Error String, Page)
export const validatePage = page => {
  // We require pages to have layouts... hmm...
  if (!page.frontMatter) {
    return Left(
      new Error(`Page "${page.name}" has no front matter`)
    )
  } else if (!page.frontMatter.layout) {
    return Left(
      new Error(`Page "${page.name}" has no layout`)
    )
  }

  return Right(page)
}

// (Config -> Layouts -> Page) -> Async(Error String, Rendered Page)
// Renders the given page and returns the resulting string.
export const renderPage = curry((config, layouts, page) => {
  // apply the layout to the page

  // check if the page calls for the root layout - not allowed to do that
  // TODO: this check is not corrent
  if (
    typeof page.frontMatter.layout === 'string' &&
    page.frontMatter.layout == path.relative(config.dirs.layouts, config.rootTemplate)) {
    // can't be the root layout, since it's always applied automatically
    return Rejected(
      new Error(`Page "${page.name}" cannot have "${config.rootTemplate} as the layout`)
    )
  }
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

  // Merge the metadata from the Jigs configuration into the page's front
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

// object -> Vue Instance
const createVueInstance = opts => new Vue(opts)

const parseHTMLComment = (firstLine, getNext) => {
  const OPENING_COMMENT = /^\s*<!--/
  const CLOSING_COMMENT = /-->\s*$/

  // huh, it's a comment
  if (firstLine.match(OPENING_COMMENT)) {
    // is it a single-line comment?
    if (firstLine.match(CLOSING_COMMENT)) {
      // yes
      return [ firstLine ]
    } else {
      let result = [ firstLine ]
      for (let line = getNext(); line !== null; line = getNext()) {
        result.push(line)

        // found the end of the comment, all done!
        if (line.match(CLOSING_COMMENT)) {
          return result
        }
      }
    }
  }

  return null
}

// [ String ] -> Error String | [ String ]
// TODO: get this back to returning an either
// TODO: this should use an actual XML parser to parse line-by-line, looking for the closing of the HTML block.
export const parseHTMLBlock = getNext => {
  const firstLine = getNext()
  if (firstLine === null) {
    return new Error('No lines available to parse!')
  }

  // TODO: please rework this function! too tangled. Need an HTML parser or something else...

  const trimmedLine = firstLine.trimEnd()

  if (trimmedLine.match(/^<(template) .*>/)) {
    return [ firstLine ]
  } else if (trimmedLine.match(/^<\/(template)>/)) {
    return [ firstLine ]
  }

  const tagNameMatch = trimmedLine.match(/^\s*<([a-zA-Z0-9-]+) ?.*(\/?>)?/)

  // if we don't match the reg ex at all, then the line doesn't start with a
  // valid HTML tag
  if (!tagNameMatch) {
    // is it a comment?
    const commentRes = parseHTMLComment(firstLine, getNext)

    if (commentRes !== null) return commentRes
    else {
      // TODO: line number?
      return new Error(`Invalid HTML line: ${firstLine}`)
    }
  } else if (tagNameMatch[0].endsWith('/>')) {
    // it's a single-line, closed tag
    return [ firstLine ]
  }

  // could it be a multi-line tag?
  const firstLineMatch = firstLine.trimEnd().match(/\/?>$/)

  if (firstLineMatch) {
    // no... it's not a multi-line tag...

    // get the tag name and look for it
    const closingTag = `</${tagNameMatch[1]}>`

    // is it at the end of the line?
    // TODO: now we are not handling nested elements of the same name
    if (firstLine.trim().endsWith(closingTag)) {
      return [ firstLine ]
    } else {
      let result = [ firstLine ]

      // loop through the lines, looking for it
      for (let line = getNext(); line !== null; line = getNext()) {
        result.push(line)

        if (closingTag === line) {
          return result
        }
      }
    }
  } else {
    // it could be a multi-line tag
    // make sure to weed out any attributes from the tag name
    const closingTag = `</${tagNameMatch[1].match(/^[a-z0-9A-Z-]+/)[0]}>`

    // look for the opening tag to close
    let result = [ firstLine ]

    for (let line = getNext(); line !== null; line = getNext()) {
      result.push(line)

      if (line.match(/</)) {
        return new Error(`Found opening of new tag while searching for the closing of the tag on the line: ${firstLine}`)
      }

      // found an occurence of > or />
      if (line.match(/\/>/)) {
        return result
      } else if (line.match(/>/)) {
        break
      }
    }

    // okay, got that sorted out, now duplicate the loop above and search for the closing of the tag that spanned multiple lines...

    // loop through the lines, looking for it
    for (let line = getNext(); line !== null; line = getNext()) {
      result.push(line)

      if (closingTag === line) {
        return result
      }
    }
  }

  // TODO: line number
  return new Error(`The tag on the line: ${firstLine}, was never closed`)
}

// Blocks -> Either(Error String, { })
export const parseMarkdown = block => {
  // TODO: put in reusable
  const makeIter = list => {
    let i = 0
    return {
      getNext() {
        if (i < list.length) {
          i = i + 1
          return list[i - 1]
        } else {
          return null
        }
      },
      backUp() {
        if (i > 0) { i = i - 1 }
      }
    }
  }

  const templateBlock = getFirst(block, 'template')
  if (!templateBlock) {
    return Left(new Error('Not give an template block'))
  }
  const { getNext, backUp } = makeIter(templateBlock.lines)
  // Now remove the template block.
  // We're going to re-add it in pieces.
  // TODO: this'll screw up the original.
  block = filterBlocks(block, b => b.label !== 'template')

  // Maintains a running list of lines for a specific label
  // When the label changes, writes the block.
  // TODO: extract to common functionality in the `docBlocks` module?
  let { buildBlock, flushBlock } = (() => {
    let lastLabel = null
    let lines = [ ]

    return {
      buildBlock: curry((label, line) => {
        // moved on to a new label...
        if (lastLabel && lastLabel !== label) {
          // don't update the original
          block = writeBlock(block, lastLabel, lines, false)
          // clear the lines
          lines = [ line ]
        } else {
          // still working on the same label, just add the line
          lines.push(line)
        }

        // always update this regardless
        lastLabel = label
      }),
      flushBlock(label) {
        // don't update the original
        writeBlock(block, lastLabel, lines, false)
        lines = []
        lastLabel = label
      }
    }
  })()

  // TODO: using a tokenizer would be more extensible & efficient
  // TODO: the next step would be to piggyback on a parser that understands
  // markdown... Then we can avoid things inside Markdown containers and support
  // all the HTML options.
  for (let line = getNext(); line !== null; line = getNext()) {
    // TODO: imports and exports can only be one line...
    if (line.startsWith('import')) {
      // imports
      buildBlock('imports', line)
    } else if (line.startsWith('export')) {
      // exports
      if (line.startsWith('export default')) {
        return Left(new Error('export default clause is not allowed'))
      } else {
        buildBlock('exports', line)
      }
    } else if (line.startsWith('<')) {
      // html
      backUp()
      const hblock = parseHTMLBlock(getNext)

      if (hblock instanceof Error) { return Left(hblock) }
      else {
        map(buildBlock('html'), hblock)
      }
    } else {
      // markdown
      buildBlock('md', line)

      // markdown code block, multi-line
      // TODO: break into a separate function
      const MD_CODE_BLOCK_START = /```/
      // this is a multi line markdown code block...
      if (line.match(MD_CODE_BLOCK_START)) {
        if (line.match(/```.*```\s*$/)) {
          // oh wow, it ends on the same line, we don't have to do anything
        } else {
          // it doesn't end on the same line. We have to go looking for the end
          let found = false
          for (let cbLine = getNext(); cbLine !== null; cbLine = getNext()) {
            buildBlock('md', cbLine)

            // ah, we found the end
            if (cbLine.match(MD_CODE_BLOCK_START)) {
              found = true
              break
            }
          }

          if (!found) {
            return Left(new Error(`Never found the end of a Markdown multi-line code block`))
          }
        }
      }
    }
  }

  // the last block won't have been written yet
  flushBlock()

  return Right(block)
}


// const trace = curry((label, t) => {
//   console.log(`[${label}]`, t)
//   return t
// })

// String -> String -> String -> Either(Error String, { })
// Parses a layout or page. Requires front matter
export const parseResource = curry((rootPath, resPath, source) => compose(
  bimap(
    // add the filepath to the error, in case of error
    err => new Error(`${err.message}\nfile: "${path.relative(rootPath, resPath)}"`),
    // add the name to the resource
    blocks => ({
      blocks,
      name: path.relative(rootPath, resPath)
    })
  ),
  // if it's .html, handle that (nothing to do, will have a Blocks with front
  // matter and template)
  chain(ifElse(() => resPath.endsWith('.html'), x => Right(x), parseMarkdown)),
  map(blocks => ({
    ...blocks,
    frontMatter: processFrontMatter(blocks.frontMatter)
  })),
  // extract front matter
  extractFrontMatter(makeDocBlocks())  // source
)(source))

// String -> String -> Either(Error String, Layout | Page)
// loads page or layout from path
export const loadAndProcessResource = curry((rootPath, resPath) =>
  Async((rej, res) => {
    jetpack.readAsync(resPath)
    .then(fileSource => {
      if (fileSource === undefined) {
        rej(new Error(`Could not find file: ${resPath}`))
        return
      }

      parseResource(
        rootPath,
        resPath,
        fileSource
      )
      .bimap(rej, res)
    })
    .catch(rej)
  })
)

// Blocks -> String -> String
export const assembleSingleFileVueComponent = (config, blocks, pageName) => {

  let layoutComponent = null
  let layoutFilePath = null
  if (blocks.frontMatter.layout) {
    layoutComponent = `layout-${
      path.basename(blocks.frontMatter.layout)
      .slice(0, -(LAYOUT_EXT.length + 1))
      .toLowerCase()
    }`
    layoutFilePath = blocks.frontMatter.layout
  }

  // Every "import" line ending in /\.vue'|"( |\t)*$/
  let usedComponents = blocks.blocks.filter(block => block.label === 'imports')
  usedComponents = usedComponents.reduce((accum, block) => {
    block.lines.forEach(line => {
      if (line.match(/\.(vue|md)('|")( |\t)*$/)) {
        const componentName = line.match(/import ([A-Za-z0-9]+) .*$/)
        if (componentName) {
          accum.push(componentName[1])
        }
      }
    })

    return accum
  }, [ ])

  const wrapTags = blocks.frontMatter.type === 'markdown-component'
    ?
      [ '<div>', '</div>' ]
    :
      null

  // wrap a markdown component in div tags because it needs to have a single,
  // enclosing tag
  const template = layoutComponent
    ?
`<${layoutComponent} title="${blocks.frontMatter.title}">
${stringifyBlocks(blocks, 'template')}
</${layoutComponent}>`
    :
      `${wrapTags ? wrapTags[0] : ''}${stringifyBlocks(blocks, 'template')}${wrapTags ? wrapTags[1] : ''}`

  const layoutImport = layoutComponent
    ?
      `import LayoutComponent from '@Layouts/${layoutFilePath}'\n`
    :
      ''

  const components = layoutComponent
    ?
      `{ ${usedComponents.join(', ')}${usedComponents.length > 0 ? ',' : ''} '${layoutComponent}': LayoutComponent }`
    :
      `{ ${usedComponents.join(', ')} }`

  // NOTE: we could wrap everything in the template in a div (because Vue
  // requires just one root) and put a class on it. Or, we could not do that,
  // indirectly requiring every layout to have just one root element.
  return {
    template: template,
    script: `import JigsConfig from '@Root/jigs.config.js'

${layoutImport}${stringifyBlocks(blocks, 'imports')}

const sfcPageComponent = {
  name: '${pageName}',
  // put the components imported into the "components" key in the
  // default export.
  components: ${components},
  data() {
    return {
      ...JigsConfig.metadata,
      // the version of the config in the jigs runtime has baseurl set
      // correctly per mode
      baseurl: '${config.metadata.baseurl}'
    }
  }
}

export default sfcPageComponent

${stringifyBlocks(blocks, 'exports')}`,
    frontMatter: blocks.frontMatter
  }
}
