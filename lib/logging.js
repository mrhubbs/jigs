
import { curry } from 'crocks'
import { red, green, cyan, bold, gray } from 'colorette'

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
  console.log(`  ${bold(gray(msg))}`)
}

export function logHeader(msg) {
  console.log(bold(cyan(`# ${bold(msg)}`)))
}

export const indentMsg = curry((indent, msg) => indent + msg)
