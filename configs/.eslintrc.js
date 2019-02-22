// NOTE: not only is this a starting point for client eslint configs, it's also directly used by forge to lint a project's page templates.

module.exports = {
  // tell eslint this file is in the project root - don't search for
  // configurations any further up the filesystem
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
  extends: [
    'eslint:recommended',
    // lint .vue files!
    'plugin:vue/essential',
  ],
  rules: {
    // semicolons are not allowed
    semi: ["error", "never"],
    // require single quotes wherever possible, allow backticks
    quotes: ["error", "single", { 'allowTemplateLiterals': true }],
    // allow paren-less arrow functions
    'arrow-parens': 1,
    // allow async-await
    'generator-star-spacing': 0,
    "vue/max-attributes-per-line": ["none"],
    "vue/html-self-closing": ["error", {
        "html": {
          "normal": "never",
          "component": "always"
        }
      }
    ],
    "vue/multiline-html-element-content-newline": ["none"],
    "vue/comment-directive": ["none"]
  }
}
