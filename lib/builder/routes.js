
import path from 'path'

import jetpack from 'fs-jetpack'
import { curry } from 'crocks'

import { getPaths } from './common'
import { logInfo } from '../logging'

export const writeGeneratedRoutes = curry((jigsConfig, [ routes, data ]) => {
  logInfo('writing routes')
  if (!data) {
    data = `
// auto-generated file: do not edit!

export default [

]`
  }

  jetpack.write(
    path.resolve(jigsConfig.dirs.src, 'app', 'generated-routes.js'),
    data
  )

  return [ routes, data ]
})

export const generateRoutes = jigsConfig => {
  const routes = getPaths(jigsConfig.dirs.pages, [ 'md', 'vue' ])
  .map(p => {
    let url = filePathToRoutePath(jigsConfig, p)
    const relPath = path.relative(jigsConfig.dirs.pages, p)

    if (url.endsWith('/index')) url = url.slice(0, -6)

    let componentPath = `@Pages/${relPath}`
    let entry = `{ path: '${url}', component: () => import('${componentPath}') }`
    // allow a function in the config to customize the routes
    if (jigsConfig.routes && jigsConfig.routes.customize) {
      const chunk = jigsConfig.routes.customize(url, componentPath)
      url = chunk['url']
      entry = chunk['entry']
    }

    return [
      url,
      entry,
      relPath
    ]
  })

  return [
    routes,
    `
// auto-generated file: do not edit!

export default [
  ${routes.map(r => r[1]).join(',\n  ')}
]`
  ]
}

export function filePathToRoutePath(jigsConfig, filePath) {
  // make the path relative to the pages directory
  const relPath = path.relative(jigsConfig.dirs.pages, filePath)
  // split it by the path separator
  const splitPath = relPath.split(path.sep)

  // put it pack together with no extension and a leading /
  return (
    '/' +
    splitPath.slice(0, -1).join('/') +
    ((splitPath.length > 1) ? '/' : '') +
    splitPath[splitPath.length - 1].split('.')[0]
  ).toLowerCase()
}
