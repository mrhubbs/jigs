
// Functionality to handle layouts

// TODO: add unit tests

import { gray } from 'colorette'
import { map, compose, curry } from 'crocks'
import { Left, Right } from 'crocks/Either'
import sequence from 'crocks/pointfree/sequence'

import { objectToTree, visitEveryChild } from '../reusable/biTree'
import { logFailure, logInfo } from '../logging'
import { callSomething, arrayOfObjectsToObject } from '../reusable/functional'
import { loadResource, getPaths, applyLayout } from './common'

export const LAYOUT_EXT = 'html'

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
      logFailure(`You asked the layouts command to do ${subCmd}`, { calm: false })
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

// Config -> [ String ]
const getLayoutPaths = config => getPaths(config.dirs.layouts, [ LAYOUT_EXT ])

// ForgeConfig -> String -> Layout
export const loadLayout = curry((config, layoutPath) =>
  loadResource(config.dirs.layouts, layoutPath)
  .chain(validateLayout)
)

// Config -> [ Either(a, Layout) ]
// loads a flat object of layout objects
// TODO: maybe Pair ADT can remove the need of creating a closure here (so we
// can access `config` partway through the compose pipeline)
const loadLayoutsFlat = config => compose(
  // [ Either(Error String, String) ] -> [ Either(Error String, Layout) ]
  map(
    // Either(Error String, String) -> Either(Error String, Layout)
    loadLayout(config)
  ),
  // Config -> [ String ]
  getLayoutPaths
)(config)

// { layout } -> biTree(layout)
const layoutsToTree = layouts => objectToTree(layouts, l => l.frontMatter.layout)

// { Layout } -> { Either(err, Layout (inheritance applied) }
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

// Config -> Either(Error String, biTree Layout)
export const loadLayouts = compose(
  callSomething(() => logInfo('Loaded layouts')),
  map(compose(resolveInheritance, arrayOfObjectsToObject('name'))),
  // [ Either(Error String, Layout) ] -> Either(Error String, [ Layout ])
  // TODO: would prefer to transform to Either([ Error String ], [ Layout ]), so we don't lose any errors
  sequence(Right),
  // At this point, if we have any errors we want to return them and not process
  // any further
  loadLayoutsFlat
)

// Layout -> Either(a, Layout)
// Validates a layout
function validateLayout(layout) {
  // Validate the template's entry point.
  let matches = layout.template.match(/<!-- forge-page-contents -->/g)
  if (!matches) {
    return Left(
      `Layout "${layout.name}" doesn't have an entry point for children,\n` +
      '\nshould have a tag like this: <!-- forge-page-contents -->'
    )
  } else if (matches.length > 1) {
    return Left(
      `Layout "${layout.name}" has too many entry points.\n` +
      '(The things that look like this: <!-- forge-page-contents -->)\n' +
      'Layouts may only have one or none.'
    )
  }

  return Right(layout)
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
