
import path from 'path'

import loaderUtils from 'loader-utils'

import { logDetail } from '../../logging'

// just for console output
// so slow, want to show something is happening
export default function(source, sourceMap) {
  const options = loaderUtils.getOptions(this)
  const config = options.config

  const callback = this.async()
  path
  config
  logDetail
  //
  // logDetail('--' + path.relative(config.dirs.pages, this.resourcePath))

  // don't change the source in any way
  callback(null, source, sourceMap)
}
