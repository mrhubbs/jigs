
import assert from 'assert'
import { describe, it } from 'mocha'
import Either from 'crocks/Either'

import { addPage, removePage } from './pages'

describe('pages', function () {
  describe('addPage', function () {
    it('adds', function () {
      let pages = Either({ })
      pages = addPage(pages, Either({ name: 'one' }))
      pages.map(pgs => {
        assert.deepEqual(pgs, { one: { name: 'one' } })
      })
    })
  })

  describe('removePage', function () {
    it('removes', function () {
      let pages = Either({ one: 10 })
      pages = removePage(pages, 'one')
      pages.map(pgs => {
        assert.deepEqual(pgs, { })
      })
    })
  })
})
