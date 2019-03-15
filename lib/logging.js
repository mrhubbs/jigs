
import { curry } from 'crocks'
import { red, green, cyan, bold, gray } from 'colorette'

// TODO: still figuring out the different logging options that should be
// available and the visual hierarchy

export const logSuccess = msg => {
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

export function logDetail(msg) {
  console.log(`  ✓ ${bold(gray(msg))}`)
}

export function logRawDetail(prefix, msg) {
  console.log(`  ${prefix} ${bold(gray(msg))}`)
}

export function logHeader(msg) {
  console.log(bold(cyan(`# ${bold(msg)}`)))
}

export function logRaw(msg) {
  console.log(gray(`>> ${msg}`))
}

export const indentMsg = curry((indent, msg) => indent + msg)

// creates a function to log with the given message, when called
export const makeLogCall = (logFunc, msg) => () => logFunc(msg)
