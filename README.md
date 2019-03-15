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

## Terminology

**Client Project:** A project that forge is being used to develop.

## Installation

Install [nodemon](https://www.npmjs.com/package/nodemon).

Clone this repo.

Write this to a file named `forge`:

```shell
#!/bin/sh

FORGE_PATH=~/desk2/forge/build/

# For prototype mode, we'll actually restart Forge if it's config file changes.
# TODO: perhaps we should implement this in Forge itself?
# It'd be cleaner and give us cleaner console output without nodemon spitting
# things out.
RUN_CMD="nodemon -w ./forge.config.js"

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
    pages: './pages',
    assets: './assets',
    layouts: './layouts',
    includes: './includes',
    build: './build',
    scripts: './build/scripts'
  }
}
```

## Notes

### Prototype Mode

...

## To-Do

### Build

  1. Importing from a subpath that doesn't exist (e.g. 'crocks/junkyard') doesn't cause a Webpack error but throws an error at runtime.

### Layouts

  1. Handle page leading newlines properly, and fill blank lines for removed front matter, so ESLint's reported line numbers are accurate.

  1. Get imports of Vue components working in templates / pages.
    - Just use an includes folder and auto-register all the components in them?

  1. Make it possible for templates / pages to have "live" Vue components.
    - Will plan to write them in .vue files and inject them with a component.
    ```html
    <forge-live-component bundle='do-some-cool-stuff.js' mount-to='#a-mount-point'/>
    ```

  1. Figure out how to embed source-code highlighting styles.

### Functionality

  1. Prototype mode

  1. Clean before build

  1. Method for client project to specify version of forge it's compatible with.

  1. Consider how to handle forge verses client tooling. Right now I'm leaning towards installing everything (Webpack, Babel, ESlint, etc.) in forge and only installing custom plugins in the client projects. How much configuration should be client-specific? .babelrc? .eslintrc? etc...

  1. Add stylelint to PostCSS.

  1. Getting purgecss working: https://tailwindcss.com/docs/controlling-file-size/

  1. Tailwind error seems to break rebuild.

  1. Figure out how to extend the base Webpack config in forge in the project directories. Figure out *what* kinds of things should be changed and what kind of interface for changing would be *nice*.

  1. Document `forge.config.js`.

### Prototype Mode

  1. Run with vue-devtools.

## Electron

  1. Start an Electron app in dev mode (is using) and fix auto-reloading (it's getting disconnected from browser-sync or something. Maybe it's something to do with the browser-sync using Webpack dev as middleware. Could be misconfigured in there.).

  1. Build electron app with forge in dev mode, and it thinks it's in dev mode (tries to load localhost). Should define environment using webpack plugin.

### Testing

  1. Watch test is not working. Never re-runs.
