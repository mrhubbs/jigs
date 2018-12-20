
const path = require('path');

// To work with purgecss, since tailwind has colons in class names.
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g);
  }
}

// expects `dirs` to have a `build` path
let disabledPlugins = [ ]
const forgeConfig = require(path.resolve(process.cwd(), 'forge.config.js'))
const dirs = forgeConfig.dirs

let config = {
  plugins: [
    require('postcss-easy-import')({
      onImport: function(sources) {
        // TODO: this function doesn't seem to be getting called
        console.log('watching...', sources)
        global.watchCSS(sources);
      }
    }),
    require('postcss-simple-vars'),
    require('postcss-extend'),
    require('postcss-nested'),
    require('postcss-mixins'),
    // When including the tailwind config by filename, the tailwind plugin will
    // watch the .js file and rebuild the css if it changes. Nice!
    require('tailwindcss')('./tailwind.js'),
    require('autoprefixer')({
      'browsers': '> 5%'
    }),
    // require('postcss-purgecss')({
    //   'postcss-purgecss': {
    //     content: [`${dirs.build}/*.html`, `${dirs.build}/**/*.html`],
    //     css: [`${dirs.build}/*.css`, `${dirs.build}/**/*.css`],
    //     extractors: [{
    //       extractor: TailwindExtractor,
    //       extensions: ['html', 'js']
    //     }]
    //   }
    // }),
    require('postcss-clean')
  ]
}

// TODO: remove any disabled plugins

// collect disabled ones into a list
disabledPlugins = Object.keys(disabledPlugins).filter((name) => {
  return disabledPlugins[name] === false
});

config.plugins = config.plugins.filter((plugin) => {
  // console.log(plugin, disabledPlugins.includes(plugin))
  if (typeof(plugin) === 'string' && disabledPlugins.includes(plugin)) return false
  else if (typeof(plugin) == 'object') {
    let name = Object.keys(plugin)[0];
    // keep if it's not in the disabled list, if it's in then don't keep
    return !disabledPlugins.includes(name);
  }

  return true
})


module.exports = config
