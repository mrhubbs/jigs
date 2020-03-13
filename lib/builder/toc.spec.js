
import assert from 'assert'

import {
  getTocLines,
  renderToc
} from './toc'

describe('toc', function () {
  const mockConfig = {
    toc: {
      maxLevel: 3
    }
  }

  const sampleLines = [{
    level: 1,
    href: "#heading",
    title: "Heading"
  }, {
    level: 2,
    href: "#another",
    title: "Another"
  }, {
    level: 3,
    href: "#third",
    title: "Third"
  }, {
    level: 3,
    href: "#fine",
    title: "Fine"
  }, {
    level: 1,
    href: "#again",
    title: "Again"
  }, {
    level: 1,
    href: "#again",
    title: "Again"
  }, {
    level: 1,
    href: "#again-with-that",
    title: "Again with That!"
  }, {
    level: 2,
    href: "#third",
    title: "Third"
  }]

  describe('makeToc', function () {
    it('works', function () {
      const lines = `
# Heading

whatever
aalkjsdf;kajf

## Another

### Third

junk

#### Fourth

more

### Fine

# Again

asd

adad

# Again

adsf

aalkjsdf

# Again with That!

done

## Third

last`.split('\n')

      const res = getTocLines(mockConfig, { }, lines)

      assert.deepEqual(
        res,
        sampleLines
      )
    })
  })

  describe('renderToc', function () {
    it('works - simple', function () {
      const res = renderToc(
        getTocLines(
          mockConfig,
          { },
          `# Grand!

# Mess!`.split('\n')
        )
      )

      assert.strictEqual(
        res,
        `<ul>
  <li>
    <a href='#grand'>Grand!</a>
  </li>
  <li>
    <a href='#mess'>Mess!</a>
  </li>
</ul>`
      )
    })

    it('works - more complex', function () {
      const res = renderToc(
        getTocLines(
          mockConfig,
          { },
          `# Junk

## Junk's Progeny

# Junk's Sibling

## A Generation`.split('\n')
        )
      )

      assert.strictEqual(
        res,
        `<ul>
  <li>
    <a href='#junk'>Junk</a>
    <ul>
      <li>
        <a href='#junks-progeny'>Junk's Progeny</a>
      </li>
    </ul>
  </li>
  <li>
    <a href='#junks-sibling'>Junk's Sibling</a>
    <ul>
      <li>
        <a href='#a-generation'>A Generation</a>
      </li>
    </ul>
  </li>
</ul>`
      )
    })

    it('disallows level skipping', function () {
      assert.throws(
        () => renderToc(
          getTocLines(
            mockConfig,
            { },
            `# First

### Third`.split('\n')
          )
        ),
        /is level 3, while the previous heading "First" is level 1/
      )
    })

    it('disallows non-first-level heading', function () {
      assert.throws(
        () => renderToc(
          getTocLines(
            mockConfig,
            { },
            `## First

### Third`.split('\n')
          )
        ),
        /"First" is level 2, but should be level 1/
      )
    })
  })
})
