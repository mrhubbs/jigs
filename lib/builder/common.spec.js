
import assert from 'assert'
import { Left, Right } from 'crocks/Either'

import { makeDocBlocks } from '../reusable/docBlocks'
import {
  extractFrontMatter,
  processResource
} from './common'

describe('common', function () {
  describe('extractFrontMatter', function () {
    it('works', function () {
      const fm = extractFrontMatter(
        makeDocBlocks(),
        '---\ntitle: title\n---\nsome other\nthings'
      )

      assert.equal(
        fm.toString(),
        Right({
          blocks: [{
            label: 'template',
            lines: [ 'some other', 'things' ]
          }],
          original: '---\ntitle: title\n---\nsome other\nthings'.split('\n'),
          frontMatter: { title: 'title' }
        }).toString()
      )
    })

    it('ignores follow-up ---', function () {
      const fm = extractFrontMatter(
        makeDocBlocks(),
        '---\ntitle: title\n---\nsome other\nthings\n---'
      )

      assert.equal(
        fm.toString(),
        Right({
          blocks: [{
            label: 'template',
            lines: [ 'some other', 'things', '---' ]
          }],
          original: '---\ntitle: title\n---\nsome other\nthings\n---'.split('\n'),
          frontMatter: { title: 'title' }
        }).toString()
      )
    })

    it('requires frontMatter starting on first line', function () {
      const fm = extractFrontMatter(
        makeDocBlocks(),
        '\n---\ntitle: title\n---\nsome other'
      )

      assert.equal(
        fm.toString(),
        Left(new Error('File has no front matter')).toString(),
      )
    })
  })

//   describe('processResource', function () {
//     it('basic use', function () {
//       const res = processResource('./src/pages', './src/pages/index.md')(`---
// title: Fine!
// ---
//
// # Heading
//
// and then...`)
//
//       assert.strictEqual(
//         res.toString(),
//         Right({
//           name: "index.md",
//           frontMatter: { title: "Fine!" },
//           template: `
//
//
//
// # Heading
//
// and then...`
//         }).toString()
//       )
//     })
//
//     it('handles error', function () {
//       const res = processResource('./src/pages', './src/pages/index.md')(`---
// title: Fine!
// --
//
// # Heading
//
// and then...`)
//
//       assert.strictEqual(
//         res.toString(),
//         Left('Error: Cannot find front matter\nfile: "./src/pages/index.md"').toString()
//       )
//     })
//   })
})
