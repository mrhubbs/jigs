// Functionality to load and handle the forge configuration

const path = require('path');
const _ = require('lodash');

module.exports = { };

// load the forge configuration
module.exports.load = () => {
  let config = require(path.resolve('./forge.config.js'));

  if (config.layouts === undefined) config.layouts = { };

  // TODO: validate `config` fully
  if (config.code !== undefined && config.code.entry == undefined) {
    config.code.entry = './index.js'
  }

  return config;
}
