// files to create

// TODO: browserslist file

module.exports = jigsPackage => [
  // default jigs config file
  [
    'jigs.config.js',
`module.exports = {
  metadata: {
    baseurl: '',
    site: {
      title: 'A New Jigs Project'
    }
  },

  jigsVersion: '${jigsPackage.version}',

  dirs: {
    build: './build',
    src: './src',
    assets: './src/assets',
    css: './src/css',
    pages: './src/pages',
    layouts: './src/layouts',
    scripts: './src/scripts'
  },

  // you can customize the route rendering like this:
  // routes: {
  //   customize(url, componentPath) {
  //     // url is the route path
  //     // componentPath is the import path
  //
  //     return {
  //       url,
  //       entry: \` { path: '\${url}', component: () => import('\${componentPath}') }\`
  //     }
  //   }
  // },

  // render all pages when jigs starts in dev mode - can be time consuming
  preBuildPages: true,

  devServer: {
    // port for dev build
    port: 3000,
    // dev build host
    host: '0.0.0.0',
    // port serving up client build, utilized by the dev server, don't open this
    // in a browser
    clientPort: 9999
  },

  staticServer: {
    port: 8080,
    host: '0.0.0.0'
  },

  toc: {
    wrapper:
    \`<div class="tableOfContents">
    <h2>Table of Contents</h2>
    [[toc]]
    </div>\`,
    maxLevel: 2
  },

  rootTemplate: './src/templates/index.html'
}`
  ],
  // main CSS file
  [
    'src/css/main.css',
`@tailwind preflight;

@tailwind components;

/* components */

@tailwind utilities;`
  ],
  // page template
  [
    'src/templates/index.html',
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">

    {{{ meta.inject().title.text() }}}
    {{{ meta.inject().meta.text() }}}
    {{{ renderResourceHints() }}}
    {{{ renderStyles() }}}
  </head>

  <body>
    <!--vue-ssr-outlet-->
    {{{ renderState() }}}
    {{{ renderScripts() }}}
  </body>
</html>`
  ],
  // default page layout
  [
    'src/layouts/Basepage.vue',
`<template>
  <div class="flex flex-col min-h-screen">

    <header class="container mx-auto text-center">
      Caput!
    </header>

    <div class="flex-1 container mx-auto">
      <slot></slot>
    </div>

    <footer class="container mx-auto text-center">
      Feet!
    </footer>

  </div>
</template>

<script>
  export default {
    name: 'Basepage',
    props: [ 'title' ],
    metaInfo() {
      return {
        title: this.title
      }
    }
  }
</script>
`
  ],
  // starter webpack base config
  [
    './webpack.base.config.js',
`
// starter webpack config - edit to your heart's content

const path = require('path')
const jigsConfig = require('./jigs.config.js')

let config = {
  output: {
    // output path is the configured build directory
    path: path.resolve(jigsConfig.dirs.build),
    filename: '[name].[hash].js'
  },
  resolve: {
    alias: {
      '@Components': path.resolve(process.cwd(), jigsConfig.dirs.src, 'app', 'components'),
      '@Pages': path.resolve(process.cwd(), jigsConfig.dirs.pages),
      '@Layouts': path.resolve(process.cwd(), jigsConfig.dirs.layouts),
      '@Root': path.resolve(process.cwd())
    }
  }
}

module.exports = config`
],
  // starter webpack client config
  [
    './webpack.client.config.js',
`// starter webpack config - edit to your heart's content

const path = require('path')
const merge = require('webpack-merge')

const jigsConfig = require('./jigs.config.js')
const baseConfig = require('./webpack.base.config.js')

let config = {
  entry: {
    'app/entry-client': path.resolve(jigsConfig.dirs.src, 'app/entry-client.js'),
    'css/main': path.resolve(jigsConfig.dirs.css, 'main.css')
  }
}

module.exports = merge(baseConfig, config)`
  ],
  // starter webpack server config
  [
    './webpack.server.config.js',
`// starter webpack config - edit to your heart's content

const path = require('path')
const merge = require('webpack-merge')

const jigsConfig = require('./jigs.config.js')
const baseConfig = require('./webpack.base.config.js')

let config = {
  entry: path.resolve(jigsConfig.dirs.src, 'app/entry-server.js')
}

module.exports = merge(baseConfig, config)`
  ],
  // default jest configuration
  [
    './jest.config.js',
`
module.exports = {
  moduleFileExtensions: [
    'js',
    'json',
    'vue'
  ],
  transform: {
    '.*\\.(vue)$': 'vue-jest',
    '^.+\\.(js|jsx)?$': 'babel-jest'
  }
}`
  ],
  ...require('./app-files')
]
