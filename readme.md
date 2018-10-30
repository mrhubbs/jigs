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

## To-do

  - Filter out .js files so Webpack processes them, but we don't get the src files copied over directly by metalsmith.


  1. Create a mechanism in prototype mode to inject file changes if dependencies change. Use this to re-process the source files if the layouts or includes change, or to re-process the CSS if the tailwind file changes.

  1. Prevent metalsmith-in-place from looking at every file - it seems to be ignoring it's pattern option.

  1. Can maybe regenerate CSS when tailwind.js changes in a smoother, faster way. Consider having nodemon ignore tailwind.js. Watch that file. When it changes clear it and the postcss config file from the cache. Re-require the postcss config file, re-create the metalsmith plugin, update the plugin in the metalsmith object, and fake a change to all CSS files so the CSS get's regenerated.

  1. Document `forge.config.js`.
