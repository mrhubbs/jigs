
// Functionality to handle layouts

// TODO: add functional tests

import path from 'path'
import jetpack from 'fs-jetpack'
import glob from 'glob-all'
import yaml from 'js-yaml'
import { gray } from 'colorette'
import { compose } from 'lodash/fp'

import { objectToTree, visitEveryChild } from '../reusable/biTree'
import { logFailure } from '../logging'

const LAYOUT_EXT = 'html'
const ENTRY_POINT = '<!-- forge-page-contents -->'

export const handleCommand = (config, cmds) => {
  const cmd = cmds[0]

  switch (cmd) {
    case 'show': {
      const layouts = layoutsToTree(loadLayoutsList(config))

      const chunk = prettyFormat(layouts)
      console.log('\n', chunk)
      break
    }

    default: {
      const subCmd = cmd === undefined || cmd === '' ? 'nothing.' : `the "${cmd}" sub command. I dunno what that is.`
      logFailure(`You asked the layouts command to do ${subCmd}`)
      break
    }
  }
}

const prettyFormat = layouts => {
  let r = ''

  visitEveryChild(layouts, (n, level) => {
    r = r + `${'   '.repeat(level)}${gray('|-')} ${n.data.name}\n`
  })

  return r
}

const loadLayoutsList = config => {
  const layoutPaths = glob.sync(path.join(config.dirs.layouts, `**/*.${LAYOUT_EXT}`))
  let layouts = layoutPaths.map(layoutPath => loadLayout(config, layoutPath))

  // collect into an object
  return layouts.reduce((accum, l) => {
      accum[l.name] = l
      return accum
    },
    { }
  )
}

// loads page or layout
function loadResource({ rootPath, resPath }) {
  let { frontMatter, template } = extractFrontMatter(jetpack.read(resPath))
  frontMatter = processFrontMatter(frontMatter)

  return {
    name: path.relative(rootPath, resPath),
    frontMatter,
    template
  }
}

// loads a layout, doesn't render it
const loadLayout = compose(
  validateLayout,
  loadResource,
  (config, resPath) => ({ rootPath: config.dirs.layouts, resPath })
)

export const loadPage = compose(
  loadResource,
  (config, resPath) => ({ rootPath: config.dirs.source, resPath })
)


// Removes front matter, if any. Returns [ front matter (Object), layout with
// front matter removed (String) ]
const extractFrontMatter = rawTemplate => {
  // TODO: is this a very slow way to extract the non-front-matter part of the
  // template?
  const match = rawTemplate.match(/^---([\S\s]*)---([\S\s]*)/m)
  // we have front matter, parse it
  const frontMatter = match ? yaml.safeLoad(match[1]) : { }
  // no front matter... oh man...
  const template = match ? match[2] : rawTemplate

  return { frontMatter, template }
}

// TODO:
// const loadPages = config => {
//
// }

// Validates a layout
function validateLayout(layout) {
  // Validate the template's entry point.
  let matches = layout.template.match(/<!-- forge-page-contents -->/g)
  if (!matches) {
    throw new Error(
      `Layout "${layout.name}" doesn't have an entry point for child layouts, should have a tag like this: <!-- forge-page-contents -->`)
  } else if (matches.length > 1) {
    throw new Error(
      `Layout "${layout.name}" has too many entry points (the things that look like this: <!-- forge-page-contents -->). Layouts may only have one or none.`)
  }

  return layout
}

const processFrontMatter = fm => {
  // Add extension to layout names specified in front matter.
  // It keeps the layouts cleaner if they don't need to have extensions.
  if (fm.layout) {
    fm.layout = `${fm.layout}.${LAYOUT_EXT}`
  }

  return fm
}

export const layoutsToTree = layouts => objectToTree(layouts, l => l.frontMatter.layout)

// Takes a layouts list and collapses them (applies the inheritance).
export const resolveInheritance = layouts => {
  // build a tree of all the layouts
  let layoutTree = layoutsToTree(layouts)

  let collapsedLayouts = { }
  // create a closure of the collapse function that's tied to our object
  const cb = node => {
    collapseLayout(node, collapsedLayouts)
  }
  // Collapse the tree into a flat object of all the layouts, with the
  // inheritance applied to the ones that inherit.
  visitEveryChild(layoutTree, cb)

  return collapsedLayouts
}

export const loadLayouts = compose(
  resolveInheritance,
  loadLayoutsList
)

// Recursive function to marge layouts into their parents - applying the
// inheritance.
const collapseLayout = (node, collect, ancestor) => {
  let layout = node.data

  // This is a base layout, it doesn't have any ancestors.
  // Nothing to collapse.
  if (!layout.frontMatter.layout) {
    collect[layout.name] = layout
    return
  }

  if (!ancestor) ancestor = node.parent

  // recurse through the node's ancestors, if any
  // make sure we have an ancestor and it's not the empty root
  if (ancestor && ancestor.data && ancestor.data.template) {
    layout = applyLayout(layout, ancestor.data)
    // now recurse into the ancestor's parent
    collapseLayout(node, collect, ancestor.parent)
  // the node has a parent and it's not the empty root
  } else {
    // the layout is fully collapsed, add to the resultant object
    collect[layout.name] = layout
  }
}

// Collapses the given layout into the given parent, merging the front matter
// and wrapping the parent layout around the child one.
// Returns a new layout.
const applyLayout = (layout, parentLayout) => {
  return {
    ...layout,
    // merge the front matter
    frontMatter: Object.assign({ }, layout.frontMatter, parentLayout.frontMatter),
    // insert the child layout into the the parent layout
    template: parentLayout.template.replace(ENTRY_POINT, layout.template)
  }
}
