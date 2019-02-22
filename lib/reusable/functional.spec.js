
import { describe, it } from 'mocha'

const assert = require('assert')

import { arrayOfObjectsToObject } from './functional'

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
})
