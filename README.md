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
    baseurl: '',
    ...
  },

  forgeVersion: "4.0.0",

  dirs: {
    pages: './src/pages',
    layouts: './src/layouts',
    build: './build',
    scripts: './src/scripts'
  }
}
```

### metadata

This object is merged with the front matter of every page when the page is rendered. It's actually a 3-way merge between the page's front matter (overrides everything), the front matter inherited from the page's layout (takes 2nd priority) and the metadata (takes last priority).

#### baseurl

Optional, prefix to append to beginning of all URLs in production build in case the generated site is not directly under a domain. For example, if you upload the site to `somedomain.com/my-special-site` then `baseurl` should be `/my-special-site`

### forgeVersion

The version(s) of `forge` the project is compatible with. Supports all the [options](https://docs.npmjs.com/files/package.json#dependencies) you can use in a `package.json`.

### Dirs

Relative paths to various source directories. These are customizable so you can name the directories whatever you want.

####

## Notes

### Prototype Mode

...

## To-Do

  1. Get imports of Vue components working in templates / pages.
    - Just use an includes folder and auto-register all the components in them?

  1. Make it possible for templates / pages to have "live" Vue components.
    - Will plan to write them in .vue files and inject them with a component.
    ```html
    <forge-live-component bundle='do-some-cool-stuff.js' mount-to='#a-mount-point'/>
    ```

  1. Figure out how to embed source-code highlighting styles.

  1. Consider how to handle forge verses client tooling. Right now I'm leaning towards installing everything (Webpack, Babel, ESlint, etc.) in forge and only installing custom plugins in the client projects. How much configuration should be client-specific? .babelrc? .eslintrc? etc...
