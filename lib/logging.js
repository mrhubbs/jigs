
const { red, green, cyan, bold } = require('colorette');

module.exports = { };

const checkmark = bold(green('✓ '));
const xmark = bold(red('✘ '));
const infomark = bold(cyan('| '));

module.exports.logSuccess = (msg) => {
  console.log(checkmark + green(msg));
}

module.exports.logFailure = (msg, calm) => {
  if (!calm) msg = red(msg);
  console.log(xmark + msg);
}

module.exports.logInfo = (msg) => {
  console.log(infomark + cyan(msg));
}
