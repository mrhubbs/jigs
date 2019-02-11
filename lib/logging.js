
const { red, green, cyan, bold, gray } = require('colorette')

export function logSuccess(msg) {
  const prefix = bold(green('✓ '))

  console.log(prefix + green(msg))
}

export function logFailure(msg, calm) {
  const prefix = bold(red('✘ '))

  if (!calm) msg = red(msg)
  console.log(prefix + msg)
}

export function logInfo(msg) {
  const prefix = bold(cyan('| '))

  console.log(prefix + cyan(msg))
}

// log operation
export function logOp(msg) {
  const prefix = bold(gray('- '))

  console.log(prefix + gray(msg))
}
