// Facilities for selectively transforming different portions of text documents
// in different ways. TODO: would like to include a source map from the final
// document to the inital.
//
// See the unit tests for usage examples.

import { curry } from 'crocks'

// () -> Blocks
// make an initial docsBlock object
export const makeDocBlocks = () => ({
  blocks: [ ],
  original: [ ],
  // stub for frontMatter, may or may not apply
  frontMatter: null
})

// Blocks -> String -> { } -> Either(Error String, { })
// returns the block
// TODO: since we keep appending a newline after every line, we'll end up adding
// an extra line at the end of the document...
export const writeBlock = (blocks, label, lines, updateOriginal) => {
  // make sure we have the section
  blocks.blocks.push({ label,  lines })

  // maintain a line-by-line record of the original document
  if (updateOriginal !== false) {
    blocks.original = blocks.original.concat(lines)
  }

  return blocks
}

// Blocks -> { } [ String ] -> Blocks
// Writes the frontMatter to the Blocks. Front matter is optional, but if you do
// write it you must include the source lines.
export const writeFrontMatter = (blocks, fm, fmLines) => ({
  ...blocks,
  original: [ ...blocks.original, ...fmLines ],
  frontMatter: fm
})

// Blocks -> [ ] -> ([ String ] -> [ String ]) -> Blocks
// Applies the transform function `xs` to all the blocks in `labels`.
export const transformBlocks = curry((blocks, labels, xs) => {
  blocks.blocks = blocks.blocks.map(block => {
    if (!labels.includes(block.label)) {
      return block
    } else {
      return { ...block, lines: xs(block.lines)}
    }
  })

  return blocks
})

// Blocks -> String(n) -> String
// Takes the blocks and an optional series of labels to include in the
// stringification. If no labels are specified, all are included.
// we already have a complete string representation
export function stringifyBlocks(blocks) {
  // get a list of all the labels to include in the output
  const labels = Object.values(arguments).slice(1)
  const allLabels = labels.length < 1 ? true : false

  return blocks.blocks.reduce((doc, block) => {
    // append the block's lines to the result, only if the block's label is one
    // of the ones we want
    if (allLabels || labels.includes(block.label)) {
      doc = doc + block.lines.join('\n') + '\n'
    }

    return doc
  }, '').slice(0, -1)  // NOTE: will this always be correct to remove the last newline?
}

// Blocks -> ({ } -> Boolean) -> Blocks
// Remove every block that `match` returns False on
// TODO: since we've essentially cut sections out of "original", we should
// modify it. We could re-create it by stringifying the blocks, but that won't
// be correct if we've transformed the blocks. Instead need to keep track of the
// lines of each block that we've filtered out...
export const filterBlocks = curry((blocks, match) => ({
  ...blocks,
  blocks: blocks.blocks.filter(match)
}))

// Blocks -> String -> Block
// Get the first block with the given label
export const getFirst = curry((blocks, label) => {
  for (let block of blocks.blocks) {
    if (block.label === label) {
      return block
    }
  }

  return null
})
