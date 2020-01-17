
// Configure and export markdown renderer

// supports:
//   - strikethrough
//   - superscript
//   - subscript
//   - footnote
//   - mark
//   - insert
//   - code block highlighting
//
// we may support:
//   - table & class customize?
//   - definition list?
//   - GFM task list?
//   - *katex?
//   - emoji?

import hljs from 'highlight.js'

import { slugifyTitle } from './toc'

export default require('markdown-it')({
  html: true,
  linkify: true,
  typographer: true,
  // TODO: using highlight JS, can we include only the languages we need?
  // apply syntax highlighting to fenced code blocks
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(lang, str).value
        // eslint-disable-next-line no-empty
      } catch (__) { }
    }

    return ''  // use external default escaping
  }
})
.use(require('markdown-it-sup'))
.use(require('markdown-it-sub'))
.use(require('markdown-it-footnote'))
// ==marked==
.use(require('markdown-it-mark'))
// ++inserted++
.use(require('markdown-it-ins'))
.use(require('markdown-it-anchor'), {
  level: 1,
  // Prefix with 'h-' so the heading IDs will get that, we don't want to
  // actually use them. We want to use IDs in extra elements we add on (see
  // below).
  slugify: title => `h-${slugifyTitle(title)}`,
  permalink: true,
  permalinkBefore: true,
  permalinkSymbol: '#',
  permalinkClass: 'header-anchor',
  anchorClass: 'anchor-target',
  renderPermalink: (slug, opts, state, idx) => {
    const realSlug = slug.slice(2)

    const tokens = [
      // Actual link to click on
      Object.assign(new state.Token('link_open', 'a', 1), {
        attrs: [
          ['class', opts.permalinkClass],
          ['href', opts.permalinkHref(realSlug, state)],
          ['aria-hidden', 'true']
        ]
      }),
      Object.assign(new state.Token('html_block', '', 0), { content: opts.permalinkSymbol }),
      new state.Token('link_close', 'a', -1),
      // Hidden element with actual ID, to account for fixed header
      Object.assign(new state.Token('link_open', 'div', 1), {
        attrs: [
          ['class', opts.anchorClass],
          ['id', realSlug],
          ['aria-hidden', 'true']
        ]
      }),
      Object.assign(new state.Token('html_block', '', 0), { content: ' ' }),
      new state.Token('link_close', 'div', -1),
    ]

    state.tokens[idx + 1].children['push'](...tokens)
  }
})
