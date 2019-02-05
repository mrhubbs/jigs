
const { red, green, cyan, bold } = require('colorette')

const checkmark = bold(green('✓ '))
const xmark = bold(red('✘ '))
const infomark = bold(cyan('| '))

export function logSuccess(msg) {
  console.log(checkmark + green(msg))
}

export function logFailure(msg, calm) {
  if (!calm) msg = red(msg)
  console.log(xmark + msg)
}

export function logInfo(msg) {
  console.log(infomark + cyan(msg))
}
