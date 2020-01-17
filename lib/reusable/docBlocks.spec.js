
import assert from 'assert'
import { Left, Right } from 'crocks/Either'

import {
  makeDocBlocks,
  writeBlock,
  writeFrontMatter,
  stringifyBlocks,
  transformBlocks,
  filterBlocks,
  getFirst
} from './docBlocks'

describe('docBlocks', function () {
  describe('makeDocBlocks', function () {
    it('works', function () {
      let docBlocks = makeDocBlocks()

      assert.deepEqual(
        docBlocks,
        { blocks: [ ], original: [ ], frontMatter: null }
      )
    })
  })

  describe('writeBlock', function () {
    it('works', function () {
      const lines = '---\ntitle: Title\n---\n'.split('\n')
      let blocks = makeDocBlocks()
      const res = writeBlock(blocks, 'unlabeled', lines)

      assert.deepEqual(
        res,
        {
          blocks: [ { label: 'unlabeled', lines } ],
          original: lines,
          frontMatter: null
        }
      )
    })
  })

  describe('writeFrontMatter', function () {
    it('works', function () {
      let blocks = makeDocBlocks()
      const res = writeFrontMatter(
        blocks,
        { layout: 'junk' },
        [ '---', 'layout: junk', '---' ]
      )

      assert.deepEqual(
        res,
        {
          blocks: [ ],
          original: [ '---', 'layout: junk', '---' ],
          frontMatter: { layout: 'junk' }
        }
      )
    })
  })

  describe('stringifyBlocks', function () {
    it('one label', function () {
      let blocks = makeDocBlocks()
      blocks = writeBlock(blocks, 'c', [ 'junk', 'funk', 'dunk' ])
      blocks = writeBlock(blocks, 'a', [ 'a', 'a', 'a' ])
      blocks = writeBlock(blocks, 'z', [ 'z', 'z', 'z' ])
      blocks = writeBlock(blocks, 'c', [ '0', '0', '0' ])
      const res = stringifyBlocks(blocks, 'c')

      assert.strictEqual(
        res,
        `junk
funk
dunk
0
0
0`
      )
    })

    it('multiple labels', function () {
      let blocks = makeDocBlocks()
      blocks = writeBlock(blocks, 'c', [ 'junk', 'funk', 'dunk' ])
      blocks = writeBlock(blocks, 'a', [ 'a', 'a', 'a' ])
      blocks = writeBlock(blocks, 'z', [ 'z', 'z', 'z' ])
      blocks = writeBlock(blocks, 'c', [ '0', '0', '0' ])
      const res = stringifyBlocks(blocks, 'c', 'z')

      assert.strictEqual(
        res,
        `junk
funk
dunk
z
z
z
0
0
0`
      )
      })
  })

  describe('transformBlocks', function () {
    it('works', function () {
      let blocks = makeDocBlocks()
      blocks = writeBlock(blocks, 'c', [ 'junk', 'funk', 'dunk' ])
      blocks = writeBlock(blocks, 'a', [ 'a', 'a', 'a' ])
      blocks = writeBlock(blocks, 'z', [ 'z', 'z', 'z' ])
      blocks = writeBlock(blocks, 'c', [ '0', '0', '0' ])
      blocks = transformBlocks(blocks, [ 'a', 'z' ], lines => lines.map(l => l  + 'DERP!'))
      const res = stringifyBlocks(blocks, 'a', 'z')

      assert.strictEqual(
        res,
        `aDERP!
aDERP!
aDERP!
zDERP!
zDERP!
zDERP!`
      )
    })
  })

  describe('filterBlocks', function () {
    it('works', function () {
      let blocks = makeDocBlocks()
      blocks = writeBlock(blocks, 'b', [ '' ])
      blocks = writeBlock(blocks, 'a', [ '' ])
      blocks = writeBlock(blocks, 'b', [ '' ])
      blocks = writeBlock(blocks, 'b', [ '' ])
      const res = filterBlocks(blocks, block => block.label !== 'b')

      assert.deepEqual(
        res,
        {
          blocks: [{
            label: 'a',
            lines: [ '' ]
          }],
          original: [ '', '', '', '' ],
          frontMatter: null
        }
      )
    })
  })

  describe('getFirst', function () {
    it('works', function () {
      let blocks = makeDocBlocks()
      blocks = writeBlock(blocks, 'a', [ 'aaaaahhh!' ])
      blocks = writeBlock(blocks, 'b', [ 'ted' ])
      blocks = writeBlock(blocks, 'b', [ 'ned' ])

      const first = getFirst(blocks, 'b')

      assert.deepEqual(
        first,
        {
          label: 'b',
          lines: [ 'ted' ]
        }
      )
    })
  })
})
