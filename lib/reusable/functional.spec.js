
const assert = require('assert')

import { arrayOfObjectsToObject, saySome } from './functional'

describe('functional', function () {
  describe('arrayOfObjectsToObject', function () {
    it('works', function () {
      let arr = [
        { name: 10, data: 'something really bad' },
        { name: 'Billy Bob', data: '01010111' }
      ]

      assert.deepEqual(
        arrayOfObjectsToObject('name', arr),
        {
          '10': {
            data: 'something really bad',
            name: 10
          },
          'Billy Bob': {
            data: '01010111',
            name: 'Billy Bob'
          }
        }
      )
    })
  })

  describe('saySome', function () {
    it('below limit', function () {
      assert.equal(saySome(3, [1, 2]), '1, 2')
    })

    it('at limit', function () {
      assert.equal(saySome(3, [1, 2, 3]), '1, 2, 3')
    })

    it('above limit', function () {
      assert.equal(saySome(3, [1, 2, 3, 4]), '1, 2, 3 and 1 more')
    })
  })
})
