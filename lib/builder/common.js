
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

import glob from 'glob-all'
import yaml from 'js-yaml'
import { curry } from 'crocks'
import { Left, Right } from 'crocks/Either'

import { writeFrontMatter, writeBlock } from '../reusable/docBlocks'

export const LAYOUT_EXT = 'vue'
const LAYOUT_ENTRY_POINT = '<!-- jigs-page-contents -->'

// String -> [ String ] -> [ String ]
export const getPaths = (rootPath, exts) => {
  let paths = exts.map(e => path.join(rootPath, `**/*.${e}`))

  return glob.sync(paths)
}

// { } -> { }
export const processFrontMatter = frontMatter => ({
  ...frontMatter,
  layout: frontMatter.layout ? `${frontMatter.layout}.${LAYOUT_EXT}` : frontMatter.layout
})

// Blocks -> String -> Either(Error String, Blocks)
// Removes front matter, if any, from the template and splits it out.
//
// NOTE require at the least the front matter intro and outro (---, ---).
// This helps with detecting errors w/ mistyped front matter intro and outro
export const extractFrontMatter = curry((blocks, rawTemplate) => {
  // TODO: is this a very slow way to extract the non-front-matter part of the
  // template?
  // const match = rawTemplate.match(/^---([\S\s]*)+?---([\S\s]*)/m)
  // we have front matter, parse it

  // TODO: unit-test and optimize algorithm, move out of this function
  if (rawTemplate.startsWith('---\n')) {
    let fmLines = null
    let templateLines = null
    const sourceLines = rawTemplate.split('\n')

    // read through the rawTemplate, looking for the --- at the start of a line
    for (let i = 1; i < sourceLines.length; i = i + 1) {
      if (sourceLines[i] === '---') {
        // we found the end of the front matter
        fmLines = sourceLines.slice(0, i + 1)
        templateLines = sourceLines.slice(i + 1)
        break
      }
    }

    if (fmLines === null) {
      return Left(new Error('Cannot find front matter'))
    }

    let frontMatter
    try {
      frontMatter = yaml.safeLoad(fmLines.slice(1, -1).join('\n'))
      // could be undefined if the input was an empty string, make sure it's at
      // least an empty object
      frontMatter = frontMatter ? frontMatter : { }
    } catch (exc) {
      return Left(exc)
    }

    let resBlocks = writeFrontMatter(blocks, frontMatter, fmLines)
    resBlocks = writeBlock(resBlocks, 'template', templateLines)

    return Right(resBlocks)
  } else {
    // no front matter... oh man...
    // TODO: return an Error
    return Left(new Error('File has no front matter'))
  }
})

// String -> String -> null | Error String
// lint a template
// eslint-disable-next-line no-unused-vars
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

// Layout | Page -> Layout -> Layout
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
