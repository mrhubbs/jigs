
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
