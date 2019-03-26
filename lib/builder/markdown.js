
// Configure and export markdown renderer

// supports:
//   - strikethrough
//   - superscript
//   - subscript
//   - footnote
//   - mark
//   - insert
//
// we may support:
//   - code block highlighting? -- need to integrate CSS / webpack into build
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
.use(require('markdown-it-mark'))
.use(require('markdown-it-ins'))
