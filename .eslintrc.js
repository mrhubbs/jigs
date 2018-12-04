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
    // TODO: eslint can't find recommended config even though it's installed
    // 'recommended',
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
  }
}
