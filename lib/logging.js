
import { compose } from 'crocks'
import { red, green, cyan, bold, gray } from 'colorette'

// TODO: still figuring out the different logging options that should be
// available and the visual hierarchy

const CLEAR_LINE = '\u001b[0K'
const MOVE_LEFT = '\u001b[1000D'
const MOVE_UP = '\u001b[1A'
const RESET_LINE = MOVE_UP + MOVE_LEFT + CLEAR_LINE

export const writeWithNewline = x => {
  process.stdout.write('\n' + x)
}
export const writeWithoutNewline = x => {
  process.stdout.write('\n' + x)
}

export const formatHeader = msg =>
  bold(cyan(`|| ${msg}`))

const INFO_PREFIX = bold('>')
export const formatInfo = msg =>
  cyan(`${INFO_PREFIX} ${msg}`)

export const formatDetail = msg =>
  `  ✓ ${bold(gray(msg))}`

const SUCCESS_PREFIX = bold('✓')
export const formatSuccess = msg =>
  green(`${SUCCESS_PREFIX} ${msg}`)

const FAILURE_PREFIX = bold(red('✘'))
export function formatFailure(msg, opts) {
  if (!opts) opts = { calm: true }
  if (opts.calm === undefined) opts.calm = true

  if (!opts.calm) msg = red(msg)
  return `${FAILURE_PREFIX} ${msg}`
}

export const logInfo = compose(writeWithNewline, formatInfo)
export const logDetail = compose(writeWithNewline, formatDetail)
export const logHeader = compose(writeWithNewline, formatHeader)
export const logSuccess = compose(writeWithNewline, formatSuccess)
export const logFailure = compose(writeWithNewline, formatFailure)

export function relogLine(msg) {
  writeWithoutNewline(RESET_LINE + msg)
}

// creates a function to log with the given message, when called
export const makeLogCall = (logFunc, msg) => () => logFunc(msg)

export default {
  logHeader,
  logInfo,
  logDetail,
  logSuccess,
  logFailure,

  formatHeader,
  formatInfo,
  formatDetail,
  formatSuccess,
  formatFailure,

  makeLogCall,
  relogLine,
  writeWithNewline,
  writeWithoutNewline
}
