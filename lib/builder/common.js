
// Functionality common to handling pages and layouts

// TODO: add unit tests

import path from 'path'
import jetpack from 'fs-jetpack'
import glob from 'glob-all'
import yaml from 'js-yaml'
import { curry } from 'crocks'

const LAYOUT_ENTRY_POINT = '<!-- forge-page-contents -->'

// String -> String -> [ String ]
export const getPaths = (rootPath, ext) => glob.sync(
  path.join(rootPath, `**/*.${ext}`)
)

// String -> { String, String }
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

// String -> String -> layout || page
// loads page or layout
export const loadResource = curry((ext, rootPath, resPath) => {
  let { frontMatter, template } = extractFrontMatter(jetpack.read(resPath))
  frontMatter = processFrontMatter(frontMatter, ext)

  return {
    name: path.relative(rootPath, resPath),
    frontMatter,
    template
  }
})

// { } -> { }
const processFrontMatter = (fm, ext) => {
  // Add extension to layout names specified in front matter.
  // It keeps the layouts cleaner if they don't need to have extensions.
  if (fm.layout) {
    fm.layout = `${fm.layout}.${ext}`
  }

  return fm
}


// Layout || Page -> Layout -> Layout
// Collapses the given layout into the given parent, merging the front matter
// and wrapping the parent layout around the child one.
// Returns a new layout.
export const applyLayout = (layoutOrPage, parentLayout) => ({
  ...layoutOrPage,
  // merge the front matter
  frontMatter: Object.assign(
    { },
    parentLayout.frontMatter,
    layoutOrPage.frontMatter
  ),
  // insert the child layout into the the parent layout
  template: parentLayout.template.replace(
    LAYOUT_ENTRY_POINT,
    layoutOrPage.template
  )
})
