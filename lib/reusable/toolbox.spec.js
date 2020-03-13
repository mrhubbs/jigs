
const assert = require('assert')

import { kebabCase } from './toolbox'

describe('toolbox', function () {
  describe('kebabCase', function () {
    it('works - kebabCase', function () {
      assert.strictEqual(
        kebabCase('kebabCase'),
        'kebab-case'
      )
    })

    it('works - KebabCase', function () {
      assert.strictEqual(
        kebabCase('KebabCase'),
        'kebab-case'
      )
    })

    it('works - Kebab.Case', function () {
      assert.strictEqual(
        kebabCase('Kebab.Case'),
        'kebab-case'
      )
    })

    it('works - Keb-ab.Case', function () {
      assert.strictEqual(
        kebabCase('Keb-ab.Case'),
        'keb-ab-case'
      )
    })
  })
})
