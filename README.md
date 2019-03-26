# Forge

[![CircleCI](https://circleci.com/gh/mrhubbs/forge.svg?style=svg)](https://circleci.com/gh/mrhubbs/forge)

Originally inspired by [Metalsmith](http://metalsmith.io), it's a stack to build static websites.

This is tailored towards my favorite tools:

  - [Vue](https://vuejs.org) templates/layouts
  - [PostCSS](https://postcss.org) with plugins to emulate SASS + [TailwindCSS](https://tailwindcss.com)
  - [Webpack](https://webpack.js.org)
  - [markdown-it](https://github.com/markdown-it/markdown-it)

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

```shell
./build-forge && ./install-forge
```

## Terminology

**Client Project:** A project that forge is being used to develop.

## Installation

Install [nodemon](https://www.npmjs.com/package/nodemon).

Clone this repo.

TODO:

... add it to your path and make it executable.

## Configuration

Expects a file named `forge.config.js` to be in the project directory:

```javascript
module.exports = {
  metadata: {
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

  1. Get imports of Vue components working in templates / pages.
    - Just use an includes folder and auto-register all the components in them?

  1. Make it possible for templates / pages to have "live" Vue components.
    - Will plan to write them in .vue files and inject them with a component.
    ```html
    <forge-live-component bundle='do-some-cool-stuff.js' mount-to='#a-mount-point'/>
    ```

  1. Figure out how to embed source-code highlighting styles.

### Functionality

  1. Figure out how to extend the base Webpack config in forge in the project directories. Figure out *what* kinds of things should be changed and what kind of interface for changing would be *nice*.
  https://github.com/survivejs/webpack-merge

  1. Getting purgecss working: https://tailwindcss.com/docs/controlling-file-size/

  1. Tailwind error seems to break rebuild - the PostCSS tailwind plugin seems to watch the tailwind.js file, and stops watching after an error.

  1. Method for client project to specify version of forge it's compatible with.

  1. Consider how to handle forge verses client tooling. Right now I'm leaning towards installing everything (Webpack, Babel, ESlint, etc.) in forge and only installing custom plugins in the client projects. How much configuration should be client-specific? .babelrc? .eslintrc? etc...

  1. Add stylelint to PostCSS.

  1. Create a nice way to include the tailwind `tailwindcss/plugins/container` in `tailwind.js` without having to modify the file. Or, just modify the file.

  1. Document `forge.config.js`.

### Prototype Mode

  1. Run with vue-devtools.

## Electron

  1. Start an Electron app in dev mode (is using) and fix auto-reloading (it's getting disconnected from browser-sync or something. Maybe it's something to do with the browser-sync using Webpack dev as middleware. Could be misconfigured in there.).

  1. Build electron app with forge in dev mode, and it thinks it's in dev mode (tries to load localhost). Should define environment using webpack plugin.

### Testing

  1. Watch test is not working. Never re-runs.
