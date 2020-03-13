
import assert from 'assert'
import { Right, Left } from 'crocks/Either'
import asyncToPromise from 'crocks/Async/asyncToPromise'
import { Resolved } from 'crocks/Async'

import {
  renderPage,
  parseHTMLBlock,
  parseMarkdown,
  parseResource,
  loadAndProcessResource,
  assembleSingleFileVueComponent,
  validatePage
} from './pages'
import { makeDocBlocks, writeBlock, stringifyBlocks } from '../reusable/docBlocks'

describe('pages', function () {
  describe('parseHTMLBlock', function () {
    const makeIter = list => {
      let i = 0

      return () => {
        if (i < list.length) {
          i = i + 1
          return list[i - 1]
        } else {
          return null
        }
      }
    }

    it('invalid tag', function () {
      const res = parseHTMLBlock(makeIter(['|div']))

      assert.strictEqual(res.toString(), (new Error('Invalid HTML line: |div')).toString())
    })

    it('invalid tag, not closed', function () {
      const res = parseHTMLBlock(makeIter(['<div', '</div>']))

      assert.strictEqual(res.toString(), (new Error('Found opening of new tag while searching for the closing of the tag on the line: <div')).toString())
    })

    it('multi-line', function () {
      const lines = [
        '<div>',
        '  <span>hi</span>',
        '</div>'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('multi-line kebab-case', function () {
      const lines = [
        '<some-kebab-case-component class="10" arg=="42">',
        '  <span>hi</span>',
        '</some-kebab-case-component>'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('multi-line never closed - error', function () {
      const lines = [
        '<div>',
        '  <span>hi</span>',
        '<div>',
        '',
        'blah blag'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        (new Error('The tag on the line: <div>, was never closed')).toString()
      )
    })

    it('multi-line closing mispelled - error', function () {
      const lines = [
        '<div>',
        '  <span>hi</span>',
        '</biv>',
        '',
        'blah blag'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        (new Error('The tag on the line: <div>, was never closed')).toString()
      )
    })

    it('multi-line unclosed additional', function () {
      const lines = [
        '<div> <img>',
        '  <span>hi</span>',
        '</div>'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('multi-line closed additional', function () {
      const lines = [
        '<div> <span>hi</span>',
        '  <span>hi</span>',
        '</div>'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('single-line self-closed', function () {
      const lines = [ '<div class="middle"/>' ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('single-line closed', function () {
      const lines = [ '<div class="middle"> stuff </div>' ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        lines.toString()
      )
    })

    it('multi-line nested tag on first line', function () {
      const lines = [
        '<div class="middle"> <div> stuff </div>',
        'content',
        '</div>'
      ]

      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        [ '<div class="middle"> <div> stuff </div>' ].toString(),
        // TOOD: should implement TODO in function and get this result
        // lines.toString()
      )
    })

    it('single-line unclosed - error', function () {
      const lines = [ '<img>' ]
      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        new Error('The tag on the line: <img>, was never closed').toString()
        // TODO: should support self-closing tags...
        // lines.toString()
      )
    })

    it('multi-line opening tag', function () {
      const lines = [
        '<div',
        'class="10"',
        'job="50"',
        '>',
        '</div>'
      ]

      assert.deepEqual(
        parseHTMLBlock(makeIter(lines)),
        [ '<div', 'class="10"', 'job="50"', '>', '</div>' ]
      )
    })

    it('multi-line opening tag w/ first-line attribute', function () {
      const lines = [
        '<div class="10"',
        '  job="50" >',
        '</div>'
      ]

      assert.deepEqual(
        parseHTMLBlock(makeIter(lines)),
        [ '<div class="10"', '  job="50" >', '</div>' ]
      )
    })

    it('multi-line opening tag, self-closing', function () {
      const lines = [
        '<div',
        'job="50"/>'
      ]

      assert.deepEqual(
        parseHTMLBlock(makeIter(lines)),
        [ '<div', 'job="50"/>' ]
      )
    })

    it('comment-single-line', function () {
      const lines = [ '<!-- comment -->' ]
      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        '<!-- comment -->'
      )
    })

    it('comment-single-line - leading/trailing whitespace', function () {
      const lines = [ '\t<!-- comment -->   ' ]
      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).toString(),
        '\t<!-- comment -->   '
      )
    })

    it('comment-multi-line - leading/trailing whitespace', function () {
      const lines = [ '\t<!-- comment    ', ' ..or give me death! --> \t ' ]
      assert.strictEqual(
        parseHTMLBlock(makeIter(lines)).join('\n'),
        '\t<!-- comment    \n ..or give me death! --> \t '
      )
    })
  })

  describe('parseMarkdown', function () {
    it('works', function () {
      const page = `import EasyButton from '../../components/EasyButton.vue'

# On a Dark &amp; Dangerous Night!&hellip;

&hellip;the road was very dusty.

<div>
Then something happened!
</div>

<c-scary-monster name='Gronk'/>

export const data = { key: "value" }`

      let blocks = makeDocBlocks()
      blocks = writeBlock(
        blocks,
        'template',
        page.split('\n')
      )

      parseMarkdown(blocks)
        .map(parsed => {
          assert.strictEqual(
            stringifyBlocks(parsed),
            page
          )

          return parsed
        })
        .map(r => {
          assert.deepEqual(
            r,
            {
              blocks: [{
                label: "imports",
                lines: [ "import EasyButton from '../../components/EasyButton.vue'" ]
              }, {
                label: "md",
                lines: [
                  "",
                  "# On a Dark &amp; Dangerous Night!&hellip;",
                  "",
                  "&hellip;the road was very dusty.",
                  ""
                ]
              }, {
                label: "html",
                lines: [
                  "<div>",
                  "Then something happened!",
                  "</div>"
                ]
              }, {
                label: "md",
                lines: [ "" ]
              }, {
                label: "html",
                lines: [ "<c-scary-monster name='Gronk'/>" ]
              }, {
                label: "md",
                lines: [ "" ]
              }, {
                label: 'exports',
                lines: [ "export const data = { key: \"value\" }" ]
              }],
              frontMatter: null,
              original: (page).split('\n')
            }
          )
        })
    })

    it('handles HTML error', function () {
      const result = parseMarkdown(
        writeBlock(
          makeDocBlocks(),
          'template',
          `<div>
            Then something happened!
          <div>`.split('\n')
        )
      )

      assert.strictEqual(
        result.toString(),
        Left(
          new Error('The tag on the line: <div>, was never closed')
        ).toString()
      )
    })
  })

  describe('parseResource', function () {
    it('handles html resource', function () {
      const source = '---\ntitle: Title\n---\n\n<div></div>'
      const res = parseResource(
        'src/pages',
        'src/pages/somePage.html',
        source
      )

      assert.deepEqual(
        res.toString(),
        Right({
          blocks: {
            blocks: [{
              label: 'template',
              lines: [ '', '<div></div>' ]
            }],
            original: source.split('\n'),
            frontMatter: { title: 'Title', layout: undefined }
          },
          name: 'somePage.html'
        }).toString()
      )
    })

    it('handles markdown resource', function () {
      const source = '---\ntitle: Title\n---\n\n# Heading'
      const res = parseResource(
        'src/pages',
        'src/pages/somePage.md',
        source
      )

      assert.deepEqual(
        res.toString(),
        Right({
          blocks: {
            blocks: [{
              label: 'md',
              lines: [ '', '# Heading' ]
            }],
            original: source.split('\n'),
            frontMatter: { title: 'Title', layout: undefined }
          },
          name: 'somePage.md'
        }).toString()
      )
    })

    it('markdown with multi-line code block', function () {
      const source = `---
title: Title
---

# Heading

<div> </div>

\`\`\`html
<an-xample
  of='something'
>
hi
hi
\`\`\`
`

      const res = parseResource(
        'src/pages',
        'src/pages/markdown-with-code-block.md',
        source
      )

      assert.deepEqual(
        res.toString(),
        Right({
          blocks: {
            blocks: [{
              label: 'md',
              lines: [ '', '# Heading', '' ]
            }, {
              label: 'html',
              lines: [ '<div> </div>' ]
            }, {
              label: 'md',
              lines: [
                '', '\`\`\`html', '<an-xample', "  of='something'", '>',
                'hi', 'hi', '\`\`\`', ''
              ]
            }],
            original: source.split('\n'),
            frontMatter: { title: 'Title', layout: undefined }
          },
          name: 'markdown-with-code-block.md'
        }).toString()
      )
    })

    it('markdown with multi-line code block that never ends', function () {
      const source = `---
title: Title
---

\`\`\`html
<an-xample
  of='something'
>
\`\`
`

      const res = parseResource(
        'src/pages',
        'src/pages/markdown-with-code-block.md',
        source
      )

      assert.deepEqual(
        res.toString(),
        Left(new Error(`Never found the end of a Markdown multi-line code block
file: "markdown-with-code-block.md"`)).toString()
      )
    })
  })

  describe('loadAndProcessResource', function () {
    it('non-existent file path', function () {
      assert.rejects(
        asyncToPromise(
          loadAndProcessResource('src/pages', 'src/pages/not-here.html')
        )
      )
    })

    it('basic usage', async function () {
      let result = await asyncToPromise(
        loadAndProcessResource('src/layouts', 'src/layouts/layout.html')
      )

      assert.deepEqual(
        result,
        {
          blocks: {
            blocks: [{
              label: "template",
               lines: [ "", "<div>", "  <!-- jigs-page-contents -->", "</div>" ]
             }],
             original: [ "---", "title: Title", "---", "", "<div>", "  <!-- jigs-page-contents -->", "</div>" ],
             frontMatter: { title: "Title", layout: undefined }
           },
           name: "layout.html"
        }
      )
    })
  })

//   describe('assembleSingleFileVueComponent', function () {
//     it('works', function () {
//       let blocks = makeDocBlocks()
//       blocks = writeBlock(blocks, 'imports', [ "import EasyButton from '../../components/EasyButton.vue'" ])
//       blocks = writeBlock(blocks, 'exports', [ "export const data = { key: \"value\" }" ])
//       blocks = writeBlock(blocks, 'md', [
//         '',
//         '',
//         '# On a Dark &amp; Dangerous Night!&hellip;',
//         '',
//         '&hellip;the road was very dusty.',
//         '',
//         ''
//       ])
//       blocks = writeBlock(blocks, 'html', [
//         '<div>',
//         '  Then something happened!',
//         '</div>',
//         '<c-scary-monster name=\'Gronk\'/>'
//       ])
//
//       assert.strictEqual(
//         assembleSingleFileVueComponent(blocks, 'a-sample-page'),
//         `<template>
// <h1 id=\"on-a-dark-%26-dangerous-night!%E2%80%A6\"><a class=\"header-anchor\" href=\"#on-a-dark-%26-dangerous-night!%E2%80%A6\" aria-hidden=\"true\">§</a> On a Dark &amp; Dangerous Night!…</h1>
// <p>…the road was very dusty.</p>
//
// <div>
//   Then something happened!
// </div>
// <c-scary-monster name='Gronk'/>
// </template>
//
// <script>
// import EasyButton from '../../components/EasyButton.vue'
//
// export default {
//   name: 'a-sample-page',
//   components: { EasyButton }
// }
//
// export const data = { key: \"value\" }
// </script>`
//       )
//     })
//   })

  describe('validatePage', function () {
    it('requires front matter', function () {
      const page = {
        name: 'testPage.html',
      }

      const res = validatePage(page)
      assert.strictEqual(res.toString(), Left(new Error('Page \"testPage.html\" has no front matter')).toString())
    })

    it('requires a layout in front matter', function () {
      const page = {
        name: 'testPage.html',
        frontMatter: { }
      }

      const res = validatePage(page)
      assert.strictEqual(res.toString(), Left(new Error('Page \"testPage.html\" has no layout')).toString())
    })
  })
})
