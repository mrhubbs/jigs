
// Expose Node's require in a way that Webpack won't detect - so we can require
// client project configuration files at runtime without Webpack trying to
// bundle them at build time.

module.exports = require
