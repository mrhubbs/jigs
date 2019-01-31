const path = require('path');
const jetpack = require('fs-jetpack');
const hljs = require('highlight.js');

const metalsmith = require('metalsmith');
const assets = require('metalsmith-assets');
const inPlace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const ignore = require('metalsmith-ignore');
const watch = require('metalsmith-watch');
const debug = require('metalsmith-debug');

const { logSuccess, logInfo, logFailure } = require('./logging');

// const postcss_config = require(path.join(__dirname, '../postcss.config.js'));

module.exports = { }

const makeBaseForge = (config) => {
  return metalsmith(process.cwd())
    .metadata(config.metadata)
    .source(config.dirs.source)
    .destination(config.dirs.build)
    .use(debug());
}

// makes a forge for everything but CSS: HTML, markdown, templates, assets, JS, etc.
const makeNonCssForge = (config, mode) => {
  let b = makeBaseForge(config)
    .clean(true)
    // plugins
    .use(assets({
      source: config.dirs.assets,
      destination: config.dirs.assets
    }))
    .use(inPlace({
      suppressNoFilesError: true,
      engineOptions: {
        pattern: ['**/*.ejs', '**/*.md'],
        // So we don't have to write relative paths to the includes
        views: [path.resolve(config.dirs.includes)],
        // options for jstransformer-markdown-it
        // enable: [ 'breaks' ]
        plugins: [
          // subscripts surrounded by ~ ~
          'markdown-it-sub',
          // suberscrips surrounded by ^ ^
          'markdown-it-sup'
        ],
        breaks: true,
        // TODO: smartypants quotes
        // apply syntax highlighting to fenced code blocks
        highlight: function (str, lang) {
          if (lang && hljs.getLanguage(lang)) {
            try {
              return hljs.highlight(lang, str).value;
            } catch (__) { }
          }

          return ''  // use external default escaping
        }
      }
    }))
    .use(layouts({
      directory: config.dirs.layouts,
      default: config.layouts.default || 'basepage.ejs',
      pattern: ['**/*.ejs', '**/*.md', '**/*.html', '*.ejs', '*.md', '*.html'],
      suppressNoFilesError: mode === 'prototype',
      engineOptions: {
        // So we don't have to write relative paths to the includes
        views: [path.resolve(config.dirs.includes)]
      }
    }));

    return b;
}

const makeCssOnlyForge = (config) => {
  // create a forge just for building CSS
  return makeBaseForge(config)
    // run after main forge, don't want to overwrite
    .clean(false)
    // .use(
      // postcss(
      //   postcss_config(
      //     config.dirs, { }
      //   )
      // )
    // )
    // Don't want to touch non-CSS
    // NOTE: we are technically telling this to ignore the CSS folder, but
    // apparently the postcss plugin ignore this plugin
    .use(
      ignore([
        '*',
      ])
    )
}

// run a production build
module.exports.build = (config) => {
  let theForge = makeNonCssForge(config, 'build')

  // build HTML + JS + assets + whatever else, but not CSS
  theForge
    .use(ignore([
      // Ignore all CSS. We'll leave that for the CSS forge.
      '**/*.css',
    ]))
    .build(function(err) {
      if (err) throw err;

      logSuccess('Built HTML + assets');

      // build CSS
      makeCssOnlyForge(config)
        .build(function(err) {
          if (err) throw err;

          logSuccess('Built CSS');
        })
    })
}

// run a prototyping build,
// call `initialBuildComplete` when done
module.exports.prototype = (config, initialBuildComplete) => {
  let theForge = makeNonCssForge(config, 'prototype')

  // add postcss, disabling the plugins that don't play well with prototyping
  // theForge
    // .use(
    //   postcss({
    //     ...postcss_config(
    //       config.dirs, {
    //         'postcss-purgecss': false,
    //         'postcss-clean': false
    //       }
    //     ),
    //     // load only the main css file; it will import the others
    //     pattern: 'main.css'
    //   })
    // );

  // set up the forge to watch
  theForge
    .use(watch({
      paths: {
        [config.dirs.source + '/**/*']: true,
        [config.dirs.assets + '/**/*']: true,
        // TODO: auto-rebuild if layouts change
        // TODO: auto-rebuild if includes change
        // Enabling this option just causes metalsmith to try to render the
        // layouts, instead of the pages that use them.
        // [config.dirs.layouts + '/**/*']: true
      }
    }))

  theForge
    .build(function(err) {
      if (err) throw err;

      logInfo('Prototyping started');

      // call back to consumer, if it wants us to
      if (initialBuildComplete) {
        initialBuildComplete();
      }
    });
}
