// NOTE: not only is this a starting point for client eslint configs, it's also directly used by jigs to lint a project's page templates.

const path = require('path')

module.exports = {
  // tell eslint this file is in the project root - don't search for
  // configurations any further up the filesystem
  // TODO: does this even make sense the way we're loading this for client
  // projects?
  root: true,
  parserOptions: {
    // parser is set under parserOptions instead of as a sibling with it so it
    // doesn't collide with Vue parsing
    parser: 'babel-eslint',
    ecmaFeatures: {
      modules: true
    },
  },
  env: {
    node: true,
  },
  plugins: [
    // TODO: have to install this as a package in order for ESLint to find it???
    // 'jigs'
  ],
  extends: [
    'eslint:recommended',
    // lint .vue files!
    'plugin:vue/essential',
  ],
  rules: {
    // all console.something calls
    "no-console": 0,
    // semicolons are not allowed
    semi: ["error", "never"],
    // require single quotes wherever possible, allow backticks
    quotes: ["error", "single", { 'allowTemplateLiterals': true }],
    // allow paren-less arrow functions
    'arrow-parens': 1,
    // allow async-await
    'generator-star-spacing': 0,
    // customize Vue rules to be a bit more flexible
    "vue/max-attributes-per-line": 0,
    "vue/html-self-closing": 0,
    "vue/multiline-html-element-content-newline": 0,
    "vue/comment-directive": 0
  }
}
