# Jigs

Originally inspired by [Metalsmith](http://metalsmith.io), it's a stack to build static websites.

This is tailored towards these tools:

  - [Vue](https://vuejs.org) templates/layouts
  - [PostCSS](https://postcss.org) with plugins to emulate SASS + [TailwindCSS](https://tailwindcss.com)
  - [Webpack](https://webpack.js.org)
  - [markdown-it](https://github.com/markdown-it/markdown-it)

## Usage

Development (watch mode):

```shell
cd project-directory
jigs
# or
jigs dev
```

Building (production):

```shell
cd project-directory
jigs build
```

## Installation

```shell
./build-jigs && ./install-jigs
```

## Terminology

**Project:** A project that used Jigs as a build/development tools.

## Installation

Install [nodemon](https://www.npmjs.com/package/nodemon).

Clone this repo.

TODO:

... add it to your path and make it executable.

## Configuration

### metadata

This object is merged with the front matter of every page when the page is rendered. It's actually a 3-way merge between the page's front matter (overrides everything), the front matter inherited from the page's layout (takes 2nd priority) and the metadata (takes last priority).

#### baseurl

Optional, prefix to append to beginning of all URLs in production build in case the generated site is not directly under a domain. For example, if you upload the site to `somedomain.com/my-special-site` then `baseurl` should be `/my-special-site`

### jigsVersion

The version(s) of `jigs` the project is compatible with. Supports all the [options](https://docs.npmjs.com/files/package.json#dependencies) you can use in a `package.json`.

### Dirs

Relative paths to various source directories. These are customizable so you can name the directories whatever you want.

####

## Notes

### Prototype Mode

...

## To-Do

  1. Code errors are being logged twice?

  1. Not returning exit code in launch.js

  1. Figure out how to embed source-code highlighting styles.

  1. Consider how to handle jigs verses client tooling. Right now I'm leaning towards installing everything (Webpack, Babel, ESlint, etc.) in jigs and only installing custom plugins in the client projects. How much configuration should be client-specific? .babelrc? .eslintrc? etc...
