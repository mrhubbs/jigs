
// Functionality to handle layouts

// TODO: add functional tests

const path = require('path');
const jetpack = require('fs-jetpack');
const glob = require('glob-all')
const yaml = require('js-yaml')
const { gray } = require('colorette')

const { objectToTree, visitEveryChild } = require('../reusable/biTree')
const { logFailure } = require('../logging')

const LAYOUT_EXT = 'html'
const ENTRY_POINT = '<!-- forge-page-contents -->'

module.exports = { }

module.exports.handleCommand = (config, cmds) => {
  const cmd = cmds[0]

  switch (cmd) {
    case 'show':
      const layouts = module.exports.layoutsToTree(module.exports.loadLayoutsList(config))

      const chunk = module.exports.prettyFormat(layouts)
      console.log(chunk)
      break;
    default:
      const subCmd = cmd === undefined || cmd === '' ? 'nothing.' : `the "${cmd}" sub command. I dunno what that is.`
      logFailure(`You asked the layouts command to do ${subCmd}`)
  }
}

module.exports.prettyFormat = (layouts) => {
  let r = ''

  visitEveryChild(layouts, (n, level) => {
    r = r + `${'   '.repeat(level)}${gray('|-')} ${n.data.name}\n`
  })

  return r
}

module.exports.loadLayoutsList = (config) => {
  const layoutPaths = glob.sync(path.join(config.dirs.layouts, '**/*.html'))
  let layouts = layoutPaths.map((layoutPath) => loadLayout(config, layoutPath))

  // collect into an object
  return layouts.reduce((accum, l) => {
      accum[l.name] = l
      return accum
    },
    { }
  )
}

module.exports.loadLayouts = (config) => {
  return resolveInheritance(module.exports.loadLayoutsList(config))
}

// loads a layout, doesn't render it
const loadLayout = (config, layoutPath) => {
  let name = path.relative(config.dirs.layouts, layoutPath)
  let { frontMatter, template } = extractFrontMatter(jetpack.read(layoutPath))
  frontMatter = processFrontMatter(frontMatter)

  // TODO: turn into template validation function
  // Validate the template's entry point.
  let matches = template.match(/<!-- forge-page-contents -->/g)
  if (!matches) {
    throw new Error(
      `Layout "${name}" doesn't have an entry point for child layouts, should have a tag like this: <!-- forge-page-contents -->`)
  } else if (matches.length > 1) {
    throw new Error(
      `Layout "${name}" has too many entry points (the things that look like this: <!-- forge-page-contents -->). Layouts may only have one or none.`)
  }

  return {
    name,
    frontMatter,
    template
  }
}

// Removes front matter, if any. Returns [ front matter (Object), layout with
// front matter removed (String) ]
const extractFrontMatter = (rawTemplate) => {
  // TODO: is this a very slow way to extract the non-front-matter part of the
  // template?
  const match = rawTemplate.match(/^\-\-\-([\S\s]*)\-\-\-([\S\s]*)/m)
  // we have front matter, parse it
  const frontMatter = match ? yaml.safeLoad(match[1]) : { }
  // no front matter... oh man...
  const template = match ? match[2] : rawTemplate

  return { frontMatter, template }
}

const loadPages = (config) => {

}

// Loads a page from the given path.
const loadPage = (pagePath) => {
  const { frontMatter, template } = extractFrontMatter(jetpack.read(pagePath))

  return {
    name: path.relative(config.dirs.source, pagePath),
    frontMatter,
    template
  }
}

const processFrontMatter = (fm) => {
  // Add extension to layout names specified in front matter.
  // It keeps the layouts cleaner if they don't need to have extensions.
  if (fm.layout) {
    fm.layout = `${fm.layout}.${LAYOUT_EXT}`
  }

  return fm
}

module.exports.layoutsToTree = layouts => objectToTree(layouts, l => l.frontMatter.layout)

const resolveInheritance = (layouts) => {
  // build a tree of all the layouts
  let layoutTree = module.exports.layoutsToTree(layouts)

  let collapsedLayouts = { }
  // create a closure of the collapse function that's tied to our object
  const cb = (node) => {
    collapseLayout(node, collapsedLayouts)
  }
  // Collapse the tree into a flat object of all the layouts, with the
  // inheritance applied to the ones that inherit.
  visitEveryChild(layoutTree, cb)

  return collapsedLayouts
}

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
    applyLayout(layout, ancestor.data)
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
const applyLayout = (layout, parentLayout) => {
  // merge the front matter
  layout.frontMatter = Object.assign({ }, layout.frontMatter, parentLayout.frontMatter)
  // insert the child layout into the "wrap" the parent layout around the child layout
  layout.template = parentLayout.template.replace(ENTRY_POINT, layout.template)
}
