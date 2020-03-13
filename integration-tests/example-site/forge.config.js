module.exports = {
  metadata: {
    site: {
      title: 'Some Drab Title'
    }
  },
  // NOTE: this is overwritten by the container build process
  jigsVersion: '7.0.0',
  dirs: {
    build: './build',
    src: './src',
    assets: './src/assets',
    layouts: './src/layouts',
    pages: './src/pages',
    scripts: './src/scripts',
    css: './src/css'
  },

  toc: {
    wrapper:
`<div class='table-of-contents'>
  <h2>Table of Contents</h2>
  [[toc]]
</div>`
  },

  rootTemplate: './src/layouts/root.html'
}
