const path = require('path');

module.exports = (forgeConfig) => {
  // Remember, all paths are for the **project** directory.
  // The `forgeConfig` paths are relative, so we have to make them absolute
  // to the project directory.
  return {
    context: path.resolve(process.cwd(), forgeConfig.dirs.source),
    entry: forgeConfig.code.entry,
    output: {
      path: path.join(path.resolve(process.cwd(), forgeConfig.dirs.build), 'js'),
      filename: '[name].js'
    }
  }
}
