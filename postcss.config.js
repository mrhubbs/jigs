
const path = require('path');

// To work with purgecss, since tailwind has colons in class names.
class TailwindExtractor {
  static extract(content) {
    return content.match(/[A-z0-9-:\/]+/g);
  }
}

let tailwind = require(path.join(process.cwd(), './tailwind.js'));
tailwind.injectPlugins.forEach((plugin) => {
  tailwind.plugins.push(require(plugin.name)(plugin.option))
});
// NOTE: normally this plugin is required in `tailwind.js`, but
// tailwind isn't installed in the project directory.
// tailwind.plugins.push(require('tailwindcss/plugins/container')({ }));

// expects `dirs` to have a `build` path
module.exports = (dirs, disabledPlugins) => {
  let config = {
    plugins: [
      {
        'postcss-import': {
          onImport: function(sources) {
            global.watchCSS(sources);
          }
        }
      },
      'postcss-simple-vars',
      'postcss-extend',
      'postcss-nested',
      'postcss-mixins',
      {
        'tailwindcss': tailwind,
      },
      {
        'autoprefixer': {
          'browsers': '> 5%'
        }
      },
      {
        'postcss-purgecss': {
          content: [`${dirs.build}/*.html`, `${dirs.build}/**/*.html`],
          css: [`${dirs.build}/*.css`, `${dirs.build}/**/*.css`],
          extractors: [{
            extractor: TailwindExtractor,
            extensions: ['html', 'js']
          }]
        }
      },
      'postcss-clean'
    ]
  }

  // remove any disabled plugins

  // collect disabled ones into a list
  var disabledPlugins = Object.keys(disabledPlugins).filter((name) => {
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

  return config
}
