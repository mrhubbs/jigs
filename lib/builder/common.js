
// Functionality common to handling pages and layouts

// TODO: add unit tests

import path from 'path'

const CLIEngine = require('eslint').CLIEngine
const eslintFormatter = require('eslint-formatter-friendly')
import { linterConfig, turnOffValidTemplateRoot, reshapeConfig } from './linter'

const linter = new CLIEngine(
  reshapeConfig(
    turnOffValidTemplateRoot(
      linterConfig
    )
  )
)

import jetpack from 'fs-jetpack'
import glob from 'glob-all'
import yaml from 'js-yaml'
import { curry, compose, map, chain, bimap, identity } from 'crocks'
import { Left, Right } from 'crocks/Either'

import { LAYOUT_EXT } from './layouts'

const LAYOUT_ENTRY_POINT = '<!-- forge-page-contents -->'

// String -> [ String ] -> [ String ]
export const getPaths = (rootPath, exts) => {
  let paths = exts.map(e => path.join(rootPath, `**/*.${e}`))

  return glob.sync(paths)
}

// String -> String -> Either(Error String, { String, String })
// Removes front matter, if any, from the template and splits it out.
//
// NOTE require at the least the front matter intro and outro (---, ---).
// This helps with detecting errors w/ mistyped front matter intro and outro
export const extractFrontMatter = curry(rawTemplate => {
  // TODO: is this a very slow way to extract the non-front-matter part of the
  // template?
  // const match = rawTemplate.match(/^---([\S\s]*)+?---([\S\s]*)/m)
  // we have front matter, parse it

  // TODO: unit-test and optimize algorithm, move out of this function
  if (rawTemplate.startsWith('---\n')) {
    let template
    let match = null
    const lines = rawTemplate.split('\n')

    // read through the rawTemplate, looking for the --- at the start of a line
    for (let i = 1; i < lines.length; i = i + 1) {
      if (lines[i] === '---') {
        // we found the end of the front matter
        match = lines.slice(1, i).join('\n')
        template =
          '\n'.repeat(i + 1) +  // add blank lines so our linter's line no. reports are accurate to the file
          lines.slice(i + 1).join('\n')

        break
      }
    }

    if (match === null) {
      return Left(new Error('Cannot find front matter'))
    }

    let frontMatter
    try {
      frontMatter = yaml.safeLoad(match)  // could be undefined
    } catch (exc) {
      return Left(exc)
    }

    return Right({
      frontMatter: frontMatter ? frontMatter : { },  // if undefined, default to empty Object
      template
    })
  } else {
    // no front matter... oh man...
    // TODO: return an Error
    return Left(new Error('File has no front matter'))
  }
})

// String -> String -> Either(Error String, Layout | Page)
// loads page or layout
export const loadResource = curry((rootPath, resPath) =>
  compose(
    bimap(
      err => `${err}\nfile: "${path.relative(rootPath, resPath)}"`,
      identity
    ),
    map(
      ({ template, frontMatter }) => ({
        name: path.relative(rootPath, resPath),
        frontMatter,
        template
      })
    ),
    chain(lintTemplate(resPath)),
    map(processFrontMatter),
    extractFrontMatter
  )(jetpack.read(resPath))
)

// String -> String -> null | Error String
// lint a template
const lintTemplate = curry((filePath, { template, frontMatter }) => {
  let toLint = template

  const report = linter.executeOnText(
    // Wrap in template tags so it looks like a Vue single-file component
    `<template>${toLint}\n</template>`,
    filePath
  )

  const output = eslintFormatter(report.results)

  // if we have any errors...
  if (output) return Left(new Error(output))

  return Right({ template, frontMatter })
})

// { String, String } -> { String, String }
const processFrontMatter = ({ template, frontMatter }) => {
  // Add extension to layout names specified in front matter.
  // It keeps the layouts cleaner if they don't need to have extensions.
  if (frontMatter.layout) {
    frontMatter.layout = `${frontMatter.layout}.${LAYOUT_EXT}`
  }

  return { template, frontMatter }
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
