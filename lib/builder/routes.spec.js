
import assert from 'assert'

import { filePathToRoutePath } from './routes'

describe('builder/routes', function() {
  describe('filePathToRoutePath', function() {
    const config = {
      dirs: {
        pages: 'src/pages'
      }
    }

    it('works - extension in folder - subfolder', function() {
      assert.strictEqual(
        filePathToRoutePath(config, 'src/pages/the-page.folder/it.md'),
        '/the-page.folder/it'
      )
    })

    it('works - multi extensions - subfolder', function() {
      assert.strictEqual(
        filePathToRoutePath(config, 'src/pages/the-folder/it.md.js'),
        '/the-folder/it'
      )
    })

    it('works - leading ./ - subfolder', function() {
      assert.strictEqual(
        filePathToRoutePath(config, './src/pages/the-folder/it.md.js'),
        '/the-folder/it'
      )
    })

    it('works - leading ./ - no subfolder', function() {
      assert.strictEqual(
        filePathToRoutePath(config, './src/pages/test2.md'),
        '/test2'
      )
    })

    it('works - no leading ./ - no subfolder', function() {
      assert.strictEqual(
        filePathToRoutePath(config, 'src/pages/test2.md'),
        '/test2'
      )
    })

    it('works - no extension', function() {
      assert.strictEqual(
        filePathToRoutePath(config, 'src/pages/test2'),
        '/test2'
      )
    })
  })
})
