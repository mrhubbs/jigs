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

  1. Move CSS processing to Webpack.

  1. Create a mechanism in prototype mode to inject file changes if dependencies change. Use this to re-process the source files if the layouts or includes change, or to re-process the CSS if the tailwind file changes.

  1. Prevent metalsmith-in-place from looking at every file - it seems to be ignoring it's pattern option.

  1. Document `forge.config.js`.
