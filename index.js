// Run this from the project directory. E.g. the repo of the website being built.

const path = require('path');

const metalsmith = require('metalsmith');
const assets = require('metalsmith-assets');
const inPlace = require('metalsmith-in-place');
const layouts = require('metalsmith-layouts');
const ignore = require('metalsmith-ignore');
const postcss = require('metalsmith-postcss');
const watch = require('metalsmith-watch');
const debug = require('metalsmith-debug');

const browserSync = require('browser-sync');

const postcss_config = require(path.join(__dirname, 'postcss.config.js'));

// Determine run mode from CLI
let mode = process.argv[2];
if (mode !== 'build' && mode !== 'prototype') {
  mode = 'prototype';
}

const config = require(path.resolve('./forge.config.js'));
if (config.layouts === undefined) config.layouts = { };
// TODO: validate `config`

const forgeBaseForge = () => {
  return metalsmith(process.cwd())
    .metadata(config.metadata)
    .source(config.dirs.source)
    .destination(config.dirs.build)
    .use(debug());
}

// makes a forge for everything but CSS: HTML, markdown, templates, assets, etc.
const forgeNonCssForge = () => {
  return forgeBaseForge()
    .clean(true)
    // plugins
    .use(assets({
      source: config.dirs.assets,
      destination: config.dirs.assets
    }))
    .use(inPlace({
      suppressNoFilesError: mode === 'prototype',
      engineOptions: {
        pattern: '{**/*.ejs}',
        // So we don't have to write relative paths to the includes
        views: [path.resolve(config.dirs.includes)]
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
}

const forgeCssOnlyForge = () => {
  // create a forge just for building CSS
  return forgeBaseForge()
    // run after main forge, don't want to overwrite
    .clean(false)
    .use(
      postcss(
        postcss_config(
          config.dirs, { }
        )
      )
    )
    // Don't want to touch non-CSS
    // NOTE: we are technically telling this to ignore the CSS folder, but
    // apparently the postcss plugin ignore this plugin
    .use(
      ignore([
        '*',
      ])
    )
}

let theForge = forgeNonCssForge()

if (mode == 'build') {
  // building

  // build HTML + JS + assets + whatever else, but not CSS
  theForge
    .build(function(err) {
      if (err) throw err;

      console.log('Built HTML + JS + assets!');

      // build CSS
      forgeCssOnlyForge()
        .build(function(err) {
          if (err) throw err;

          console.log('Built CSS!');
        })
    })
} else if (mode == 'prototype') {
  // prototyping

  // add postcss, disabling the plugins that don't play well with prototyping
  theForge
    .use(
      postcss(
        postcss_config(
          config.dirs, {
            'postcss-purgecss': false,
            'postcss-clean': false
          }
        )
      )
    );

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

      console.log('Prototyping started!');

      // Start browser-sync once the initial build has completed
      const serveDir = path.join(process.cwd(), config.dirs.build);
      browserSync({
        files: [
          path.join(serveDir, '*'),
          path.join(serveDir, '**', '*'),
        ],
        cwd: serveDir,
        watchEvents: [
          'add', 'change', 'unlink', 'addDir', 'unlinkDir'
        ],
        watchOptions: {
          'ignoreInitial': true
        },
        server: {
          baseDir: serveDir,
        },
        open: false
      });
    });
} else {
  throw new Error(`Unrecognized mode ${mode}`);
}
