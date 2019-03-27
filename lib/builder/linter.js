
export let linterConfig = require('../../configs/.eslintrc.js')

// Shut off valid-template-root rule, since it only applies to true Vue
// Components and we're not linting those here.
export const turnOffValidTemplateRoot = cfg => {
  cfg.rules = Object.assign(
    { },
    cfg.rules,
    { 'vue/valid-template-root': 0 }
  )
  return cfg
}

// { } -> { }
// The ESLint CLIEngine takes configuration in a slightly different format than
// the eslintrc files are written in.
// NOTE: this doesn't fully map eslintrc to the CLIEngine shape, it just supports those options present in ../../configs/.eslintrc.js
export const reshapeConfig = cfg => ({
  baseConfig: {
    extends: cfg.extends
  },
  parserOptions: cfg.parserOptions,
  envs: Object.values(cfg.env),
  rules: cfg.rules
})
