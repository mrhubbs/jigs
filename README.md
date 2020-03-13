🚧 **This is an experimental project in early development.** 🚧

In carpentry, a jig is a thing you make to help you make the thing you're making. One example would be a frame or clamp setup to help cut wood consistently. As such, a jig _empowers efficient craftsmanship_.

Jigs is a CLI program to build static sites, PWAs and Electron apps. It's tailored to my preferred front-end stack:

  - [Vue](https://vuejs.org)
  - [PostCSS](https://postcss.org) with plugins to behave like SASS + [TailwindCSS](https://tailwindcss.com)
  - [Webpack](https://webpack.js.org)
  - [markdown-it](https://github.com/markdown-it/markdown-it)
  - [Jest](https://jestjs.io/)

# Why?

That's a kind of a long story&hellip; Part of it is that I got sick of installing the same build tooling on my system, over-and-over, and I got sick of maintaining it in different projects, over-and-over.

Jigs is installed globally and can build a variety of projects. Simpler projects won't even need a `node_modules` folder.

I'm experimenting to see just how far I can take this. It could get sticky if some projects require different versions of dependencies than the ones built into the current version of Jigs. However, the way Jigs sets up pathing, any modules installed into a project will override those installed in Jigs.

# Installation

*Linux/Mac only, Windows support comming&hellip;*

```shell
# clone this repo to your machine
npm i --production
npm run build
./install-jigs
```

# Development

*watch mode*

```shell
cd project-directory
jigs
# or
jigs dev
```

# Building

*production mode*

```shell
cd project-directory
jigs build
```

# Project Scaffolding

```shell
cd project-directory
jigs init
```

## To-Do

  1. Code errors are being logged twice?

  1. Try MDX's vue-loader.

  1. Not returning exit code in launch.js

  1. Figure out how to embed source-code highlighting styles.

  1. Document `jigs.config.js`

  1. Document `jigs init`

  1. Document everything
