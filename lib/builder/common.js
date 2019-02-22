
// Functionality common to handling pages and layouts

// TODO: add unit tests

import path from 'path'

const CLIEngine = require('eslint').CLIEngine
const eslintFormatter = require('eslint-formatter-friendly')
// TODO: make path a constant
// NOTE: __dirname will be the Webpack output directory
const eslintCli = new CLIEngine({ configFile: path.join(__dirname, '../configs/.eslintrc.js') })

import jetpack from 'fs-jetpack'
import glob from 'glob-all'
import yaml from 'js-yaml'
import { curry } from 'crocks'
import { Left, Right } from 'crocks/Either'

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

// String -> String -> Either(Error String, Layout | Page)
// loads page or layout
export const loadResource = curry((ext, rootPath, resPath) => {
  let { frontMatter, template } = extractFrontMatter(jetpack.read(resPath))
  frontMatter = processFrontMatter(frontMatter, ext)

  const error = lintTemplate(resPath, template)

  if (error) return Left(error)

  return Right({
    name: path.relative(rootPath, resPath),
    frontMatter,
    template: template.replace(/^\s+|\s+$/g,'')  // strip leading and trailing whitespace
  })
})

// String -> String -> null | Error String
// lint a template
const lintTemplate = (filePath, template) => {
  const report = eslintCli.executeOnText(
    // Wrap the template so it looks like a Vue single-file component
    `<template>\n${template}\n</template>`,
    filePath
  )

  const output = eslintFormatter(report.results)

  // if we have any errors...
  if (output) return new Error(output)

  return null
}

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
