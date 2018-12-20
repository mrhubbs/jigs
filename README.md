# Forge

Pre-configured [Metalsmith](http://metalsmith.io)-based stack to build static websites.

This project is [semi-configurable](#configuration). It's tailored towards my chosen stack for static site development:

  - EJS templates
  - PostCSS with plugins to emulate SASS + ...
  - ... tailwind

## Usage

Prototyping (watch mode):

```shell
cd project-directory
forge
# or
forge prototype
```

Building (production):

```shell
cd project-directory
forge build
```

## Installation

Install [nodemon](https://www.npmjs.com/package/nodemon).

Clone this repo.

Write this to a file named `forge`:

```shell
#!/bin/sh

FORGE_PATH=~/desk2/forge
# watch only the files in the project directory which should trigger forge to restart
RUN_CMD="nodemon `cat ${FORGE_PATH}/project-dir-watchlist`"

if [ "${1}" != "prototype" -a "${1}" != "" ]; then
  RUN_CMD=node
fi

${RUN_CMD} ${FORGE_PATH} "${@}"
```

... add it to your path and make it executable.

## Configuration

Expects a file named `forge.config.js` to be in the project directory:

```javascript
module.exports = {
  metadata: {
    // whatever you want to pass to metalsmith
    ...
  },
  dirs: {
    source: './src',
    assets: './assets',
    layouts: './layouts',
    includes: './includes',
    build: './build'
  }
}
```

## Notes

### Prototype Mode

...

## To-Do

  1. Build electron app with forge in dev mode, and it thinks it's in dev mode (tries to load localhost). Should define environment using webpack plugin.

  1. Start an Electron app in dev mode (is using) and fix auto-reloading (it's getting disconnected from browser-sync or something. Maybe it's something to do with the browser-sync using webpack dev as middleware. Could be misconfigured in there.).

  1. Run with vue-devtools.

  1. Add stylelint to PostCSS.

  1. Getting purgecss working: https://tailwindcss.com/docs/controlling-file-size/

  1. Tailwind error seems to break rebuild.

  1. Move the base Webpack config into forge. Figure out how to extend it in the project directories. Figure out *what* kinds of things should be changed and what kind of interface for changing would be *nice*.

  1. Create a mechanism in prototype mode to inject file changes if dependencies change. Use this to re-process the source files if the layouts or includes change, or to re-process the CSS if the tailwind file changes.

  1. Prevent metalsmith-in-place from looking at every file - it seems to be ignoring it's pattern option.

  1. Document `forge.config.js`.
