// functionality to initialize a new project

const path = require('path')
const jetpack = require('fs-jetpack')

const forgePackage = require('../package.json')

module.exports = function () {
  // create directories
  ['src/assets', 'src/layouts', 'src/pages'].map(d => { jetpack.dir(d) })

  // write default forge config file
  jetpack.write('forge.config.js',
`module.exports = {
  metadata: {
    baseurl: '',
    site: {
      title: 'A New Forge Project'
    }
  },

  forgVersion: '${forgePackage.version}',

  dirs: {
    pages: './src/pages',
    assets: './src/assets',
    layouts: './src/layouts',
    scripts: './src/scripts',
    build: './build'
  }
}`)

  // create main CSS file
  jetpack.dir('src/css')
  jetpack.write('src/css/main.css',
`@tailwind preflight;

@tailwind components;

/* components */

@tailwind utilities;`)

  // write default page layout
  jetpack.write('layouts/basepage.ejs',
`<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- <meta name="description" content=""> -->
    <!-- NOTE: Google doesn't use the meta keywords... -->

    <!-- CSS -->
    <link rel="stylesheet" href="/css/main.css" type="text/css">

    <title><%= title %> - <%= site.title %></title>
  </head>

  <body class='relative flex flex-col min-h-screen'>

    <header class='container mx-auto'>

    </header>

    <div class='flex-1'>
      <%- contents %>
    </div>

    <footer class='container mx-auto pin-b'>

    </footer>

  </body>
</html>`)

  // create gitignore
  jetpack.append('.gitignore',
`**/*.DS_Store
build/
`)

  // create the tailwind file
  const twCli = path.join(__dirname, '../node_modules/tailwindcss/lib/cli.js')
  require('child_process').exec(`${twCli} init`)
}
