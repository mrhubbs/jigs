module.exports = {
  plugins: [
    require('postcss-easy-import')({
      onImport: function(sources) {
        // TODO: this function doesn't seem to be getting called
        // TODO: is PostCSS watching of imported files working? And, if so, is
        // this code necessary to make it work?
        console.log('watching...', sources)
        global.watchCSS(sources)
      }
    }),
    require('postcss-simple-vars'),
    require('postcss-nested'),
    require('postcss-extend'),
    require('postcss-mixins'),
    // When including the tailwind config by filename, the tailwind plugin will
    // watch the .js file and rebuild the CSS if it changes. Nice!
    require('tailwindcss')('./tailwind.js'),
    // client project should specify browserslist config
    require('autoprefixer')(),
    require('postcss-clean')
  ]
}
