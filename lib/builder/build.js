
import path from 'path'

import jetpack from 'fs-jetpack'
import { curry, map, compose } from 'crocks'

import {
  createRenderer,
  SERVER_BUNDLE_NAME,
  CLIENT_MANIFEST_NAME
} from './bundle-renderer'
import { logInfo, formatDetail, relogLine } from '../logging'
import { deletePathIfSafe } from '../reusable/toolbox'

// JigsConfig -> Async(Error String, String)
export const cleanBuild = jigsConfig => {
  logInfo('cleaning build')
  return deletePathIfSafe(jigsConfig, jigsConfig.dirs.buildRoot)
}

const loadServerFile = jigsConfig => compose(
  JSON.parse,
  jetpack.read,
  x => path.resolve(jigsConfig.dirs.build, x)
)

// use the bundle renderer to generate and write pages
export const generateAndWritePages = curry((jigsConfig, routes) => {
  // create a bundle renderer
  const renderer = createRenderer(
    jigsConfig,
    loadServerFile(jigsConfig)(SERVER_BUNDLE_NAME),
    loadServerFile(jigsConfig)(CLIENT_MANIFEST_NAME)
  )

  // for each page...
  map(
    ([ routePath, routeFile]) => {
      const context = { url: routePath }

      // render to html
      renderer.renderToString(context, (err, html) => {
        if (err) {
          console.error(err.message)
        } else {
          // process the filepath
          // change a filepath like foo/bar.html to foo/bar/index.html
          const spl = routeFile.split(path.sep)
          let filePath
          if (spl.length === 1) {
            filePath = spl[spl.length - 1].split('.')[0] + '.html'
          } else {
            filePath = path.join(
              spl.slice(0, -1).join(path.sep),
              spl[spl.length - 1].split('.')[0],
              'index.html'
            )
          }

          const absFilePath = path.resolve(
            jigsConfig.dirs.build,
            filePath
          )
          relogLine(formatDetail(filePath))
          // create the directory the .html file will reside in, if necessary
          if (spl.length > 1) jetpack.dir(path.dirname(absFilePath))
          // write the file
          jetpack.write(absFilePath, html)
        }
      })
    },
    routes
  )
})
