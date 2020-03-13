
// Make a table of contents.

// Take any heading title and convert to an URL-safe sequence of characters.
// NOTE: this **seems** to match the `markdown-it-anchor` plugin - it needs to.
export const slugifyTitle = title => title
  .toLowerCase()
  .replace(/ /g, '-')
  .replace(/[^a-z0-9-_]/g, '')
  .replace(/-+/g, '-')  // can end up with multiple -- together, collapse into just one

export const getTocLines = (config, pageFrontMatter, lines) =>
  lines.reduce((accum, line) => {
    // up to the third level
    const match = line.match(new RegExp(`^#{1,${pageFrontMatter.maxTocLevel || config.toc.maxLevel}} .*`))
    if (match) {
      const split = match[0].split(' ')
      const level = split[0].length
      const title = split.slice(1).join(' ')
      accum.push({
        level,
        href: '#' + slugifyTitle(title),
        title: title
      })
    }

    return accum
  }, [ ])

// make a new node
export const makeNode = (parent, data) => {
  const newNode = {
    data,
    parent,
    children: [ ]
  }

  // add to the parent, if there is a parent
  if (parent) {
    parent.children.push(newNode)
  }

  return newNode
}

// restructure a list of headings into a hierarchical structure
const tocLinesToTree = (headings, rootNode, lastNode) => {
  // entry conditions
  if (!rootNode) {
    rootNode = makeNode(null, { level: 0 })
    // `lastNode` could be the parent, could be a sibling
    lastNode = rootNode
  }

  // exit condition
  // no more headings, all done
  if (headings.length < 1) {
    return rootNode
  }

  const heading = headings[0]

  // work condition
  let headingNode
  const lastLevel = lastNode.data.level
  if (heading.level === lastLevel) {
    // siblings
    headingNode = makeNode(lastNode.parent, heading)
  } else if (heading.level > lastLevel) {
    // `heading` is a child of `lastNode`

    // error-checking
    if (heading.level > lastLevel + 1) {
      // uh-oh, we can't skip levels, that doesn't make sense in a TOC
      if (lastNode.data.level === 0) {
        throw new Error(
          `Heading "${heading.title}" is level ${heading.level}, but should ` +
          `be level 1`
        )
      } else {
        throw new Error(
          `Heading "${heading.title}" is level ${heading.level}, while the ` +
          `previous heading "${lastNode.data.title}" is level ${lastLevel}. ` +
          `Levels must be equal or consecutive, and not skip a level.`
        )
      }
    }

    headingNode = makeNode(lastNode, heading)
  } else {
    // `heading` is a sibling of one of `lastNode`'s ancestors

    // we'll work back up the tree
    return tocLinesToTree(headings, rootNode, lastNode.parent)
  }

  // move on to the next node
  return tocLinesToTree(headings.slice(1), rootNode, headingNode)

  // TODO: would rather return a Right instance, but creating one with the root
  // node is exceeding a call stack in Crocks. Maybe Crocks has a bug and can't
  // handle the recursive structure.
}

// lifted from markdown-it-anchor
const hasProp = Object.prototype.hasOwnProperty
const uniqueSlug = (slug, slugs) => {
  let uniq = slug
  let i = 2
  while (hasProp.call(slugs, uniq)) uniq = `${slug}-${i++}`
  slugs[uniq] = true
  return uniq
}

// TODO:
const renderTocWorker = (rootNode, accum, indent, slugs) => {
  // render the node
  // start tag, plus anchor, if any

  const slug = uniqueSlug(rootNode.data.href, slugs)

  accum += `${indent}<li>\n`
  if (rootNode.data && rootNode.data.title) {
    accum += `${indent + '  '}<a href='${slug}'>${rootNode.data.title}</a>\n`
  }

  // any children?
  if (rootNode.children.length > 0) {
    // start a new unordered list to house them
    accum += `${indent + '  '}<ul>\n`
    // render all the children
    accum += rootNode.children.reduce((a, c) => renderTocWorker(c, a, indent + '    ', slugs), '')
    // close the list
    accum += `${indent + '  '}</ul>\n`
  }

  // node's end tag
  accum += `${indent}</li>\n`

  return accum
}

// takes an array of TOC lines and renders to HTML
export const renderToc = tocLines => {
  // list of all slugs for page we're generating TOC for - used to handle
  // duplicates
  const slugs = [ ]
  const rootNode = tocLinesToTree(tocLines)

  let accum = '<ul>\n'

  // render all the nodes
  accum += rootNode.children.reduce((a, c) => renderTocWorker(c, a, '  ', slugs), '')

  accum += '</ul>'

  return accum
}
