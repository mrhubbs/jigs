const path = require('path')

// expects `dirs` to have a `build` path
let disabledPlugins = [ ]
const jigsConfig = require(path.resolve(process.cwd(), 'jigs.config.js'))
const dirs = jigsConfig.dirs

let config = {
  plugins: [
    require('postcss-easy-import')({
      onImport: function(sources) {
        // TODO: this function doesn't seem to be getting called
        // TODO: is PostCSS watching of imported files working? And, if so, is
        // this code necessary to make it work?
        console.log('watching...', sources)
        global.watchCSS(sources)
      }
    }),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-extend'),
    require('postcss-mixins'),
    // When including the tailwind config by filename, the tailwind plugin will
    // watch the .js file and rebuild the CSS if it changes. Nice!
    require('tailwindcss')('./tailwind.js'),
    // client project should specify browserslist config
    require('autoprefixer')(),
    require('postcss-clean')
  ]
}

// TODO: remove any disabled plugins

// Collect disabled ones into a list.
// This mechanism allows to flexibly disable plugins in case we need to do so in
// different build modes.
disabledPlugins = Object.keys(disabledPlugins).filter((name) => {
  return disabledPlugins[name] === false
})

config.plugins = config.plugins.filter((plugin) => {
  // console.log(plugin, disabledPlugins.includes(plugin))
  if (typeof(plugin) === 'string' && disabledPlugins.includes(plugin)) return false
  else if (typeof(plugin) == 'object') {
    let name = Object.keys(plugin)[0]
    // keep if it's not in the disabled list, if it's in then don't keep
    return !disabledPlugins.includes(name)
  }

  return true
})

module.exports = config
