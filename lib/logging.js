
const { red, green, cyan, bold, gray } = require('colorette')

export function logSuccess(msg) {
  const prefix = bold(green('✓ '))

  console.log(prefix + green(msg))
}

// opts -> {
//   calm: true | false
// }
export function logFailure(msg, opts) {
  const prefix = bold(red('✘ '))

  if (!opts) opts = { calm: true }
  if (opts.calm === undefined) opts.calm = true

  if (!opts.calm) msg = red(msg)
  console.log(prefix + msg)
}

export function logInfo(msg) {
  const prefix = bold(cyan('└ '))

  console.log(prefix + cyan(msg))
}

// log operation
export function logOp(msg) {
  const prefix = bold(gray('  - '))

  console.log(prefix + gray(msg))
}

export function logHeader(msg) {
  console.log(bold(cyan(`# ${bold(msg)}`)))
}
