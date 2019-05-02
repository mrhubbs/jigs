
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
  permalink: true,
  permalinkBefore: true,
  permalinkSymbol: '§'
})
.use(require('markdown-it-table-of-contents'))
