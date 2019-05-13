
import assert from 'assert'
import { Left, Right } from 'crocks/Either'

import { extractFrontMatter } from './common'

describe('common', function () {
  describe('extractFrontMatter', function () {
    it('works', function () {
      const fm = extractFrontMatter('---\ntitle: title\n---\nsome other\nthings')

      assert.equal(
        Right({
          frontMatter: { title: 'title' },
          template: '\n\n\nsome other\nthings'
        }).toString(),
        fm.toString()
      )
    })

    it('ignores follow-up ---', function () {
      const fm = extractFrontMatter('---\ntitle: title\n---\nsome other\nthings\n---')

      assert.equal(
        Right({
          frontMatter: { title: 'title' },
          template: '\n\n\nsome other\nthings\n---'
        }).toString(),
        fm.toString()
      )
    })

    it('requires frontMatter starting on first line', function () {
      const fm = extractFrontMatter('\n---\ntitle: title\n---\nsome other')

      assert.equal(
        Left(new Error('File has no front matter')).toString(),
        fm.toString()
      )
    })
  })
})
