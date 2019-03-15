
// Functionality common to handling pages and layouts

// TODO: add unit tests

import path from 'path'

const CLIEngine = require('eslint').CLIEngine
const eslintFormatter = require('eslint-formatter-friendly')
// TODO: make path a constant
// NOTE: __dirname will be the Webpack output directory
const eslintCli = new CLIEngine({
  configFile: path.join(__dirname, '..', 'configs', '.eslintrc.js')
})

import jetpack from 'fs-jetpack'
import glob from 'glob-all'
import yaml from 'js-yaml'
import { curry } from 'crocks'
import { Left, Right } from 'crocks/Either'

import { LAYOUT_EXT } from './layouts'

const LAYOUT_ENTRY_POINT = '<!-- forge-page-contents -->'

// String -> [ String ] -> [ String ]
export const getPaths = (rootPath, exts) => {
  let paths = exts.map(e => path.join(rootPath, `**/*.${e}`))

  return glob.sync(paths)
}

// String -> { String, String }
// Removes front matter, if any. Returns [ front matter (Object), layout with
// front matter removed (String) ]
//
// TODO: require at the least the front matter intro and outro (---, ---)
// This will help with detecting errors w/ mistyped front matter intro and outro
const extractFrontMatter = rawTemplate => {
  // TODO: is this a very slow way to extract the non-front-matter part of the
  // template?
  // const match = rawTemplate.match(/^---([\S\s]*)+?---([\S\s]*)/m)
  // we have front matter, parse it

  let frontMatter = null, template

  // TODO: unit-test and optimize algorithm, move out of this function
  if (rawTemplate.startsWith('---\n')) {
    let match
    const lines = rawTemplate.split('\n')

    // read through the rawTemplate, looking for the --- at the start of a line
    for (let i = 1; i < lines.length; i = i + 1) {
      if (lines[i] === '---') {
        // we found the end of the front matter
        match = lines.slice(1, i).join('\n')
        template = lines.slice(i + 1).join('\n')
      }
    }

    frontMatter = match ? yaml.safeLoad(match) : { }
  } else {
    // no front matter... oh man...
    // TODO: return an Error
    template = rawTemplate
  }

  return { frontMatter, template }
}

// String -> String -> Either(Error String, Layout | Page)
// loads page or layout
export const loadResource = curry((rootPath, resPath) => {
  let { frontMatter, template } = extractFrontMatter(jetpack.read(resPath))
  frontMatter = processFrontMatter(frontMatter)

  // We only lint HTML files - we don't lint markdown
  if (resPath.endsWith('html')) {
    const error = lintTemplate(resPath, template)
    if (error) return Left(error)
  }

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
    // Wrap in template tags so it looks like a Vue single-file component
    `<template>\n${template}\n</template>`,
    filePath
  )

  const output = eslintFormatter(report.results)

  // if we have any errors...
  if (output) return new Error(output)

  return null
}

// { } -> { }
const processFrontMatter = fm => {
  // Add extension to layout names specified in front matter.
  // It keeps the layouts cleaner if they don't need to have extensions.
  if (fm.layout) {
    fm.layout = `${fm.layout}.${LAYOUT_EXT}`
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

// String -> String -> String -> String
// Takes an input file path and transforms the extension, if it matches the
// given input extension.
export const transformExtension = curry((is, to, filePath) =>
  filePath.endsWith(is) ?
    filePath.slice(0, -is.length) + to :
    filePath
)

export const sourcePagePathToBuildPagePath = curry((config, filePath) => {
  const buildPath = path.join(
    config.dirs.build, path.relative(config.dirs.pages, filePath)
  )

  return transformExtension('md', 'html', buildPath)
})
