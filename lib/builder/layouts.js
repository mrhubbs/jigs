
// Functionality to handle layouts

// TODO: add unit tests

import { gray } from 'colorette'
import { map, reduce, compose } from 'crocks'

import { objectToTree, visitEveryChild } from '../reusable/biTree'
import { logFailure } from '../logging'
import { collect } from '../reusable/functional'
import { loadResource, getPaths, applyLayout } from './common'

const LAYOUT_EXT = 'html'

export const handleCommand = (config, cmds) => {
  const cmd = cmds[0]

  switch (cmd) {
    case 'show': {
      const layouts = layoutsToTree(loadLayoutsFlat(config))

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

// Formats a tree of layouts for printing to the console.
const prettyFormat = layouts => {
  let r = ''

  visitEveryChild(layouts, (n, level) => {
    r = r + `${'   '.repeat(level)}${gray('|-')} ${n.data.name}\n`
  })

  return r
}

// config -> [ String ]
const getLayoutPaths = config => getPaths(config.dirs.layouts, LAYOUT_EXT)

// config -> { layout }
// loads a flat object of layout objects
// TODO: maybe Pair ADT can remove the need of creating a closure here (so we
// can access `config` partway through the compose pipeline)
const loadLayoutsFlat = config => compose(
  // [ layout ] -> { layout }
  reduce(collect('name'))({}),
  // [ String ] -> [ layout ]
  map(
    // load layout
    compose(
      validateLayout,
      loadResource(LAYOUT_EXT, config.dirs.layouts)
    )
  ),
  // config -> [ String ]
  getLayoutPaths
)(config)

// { layout } -> biTree(layout)
const layoutsToTree = layouts => objectToTree(layouts, l => l.frontMatter.layout)

// { layout } -> { layout (inheritance applied) }
// Takes a layouts object and collapses them (applies the inheritance).
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

// config -> biTree(layout)
export const loadLayouts = compose(
  resolveInheritance,
  loadLayoutsFlat
)

// { layout } -> { layout }
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
    // NOTE: we're re-creating a node since we didn't mutate it when we applied
    // the layout
    collapseLayout({ ...node, data: layout }, collect, ancestor.parent)
  // the node has a parent and it's not the empty root
  } else {
    // the layout is fully collapsed, add to the resultant object
    collect[layout.name] = layout
  }
}
