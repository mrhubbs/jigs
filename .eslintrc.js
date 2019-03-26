module.exports = {
  // tell eslint this file is in the project root - don't search for
  // configurations any further up the filesystem
  root: true,
  parserOptions: {
  parser: "babel-eslint",
    ecmaVersion: 2017,
    sourceType: "module",
    ecmaFeatures: {
      modules: true
    }
  },
  env: {
    node: true,
    es6: true
  },
  extends: ["eslint:recommended", "plugin:vue/recommended"],
  rules: {
    // semicolons are not allowed
    semi: ["error", "never"],
    "no-console": ["off"],
    // require single quotes wherever possible, allow backticks
    quotes: ["error", "single", { allowTemplateLiterals: true }],
    // allow paren-less arrow functions
    "arrow-parens": ["error", "as-needed"],
    // allow async-await
    "generator-star-spacing": 0
  }
}
