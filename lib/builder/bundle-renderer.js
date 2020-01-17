
import { createBundleRenderer } from 'vue-server-renderer'
import { read } from 'fs-jetpack'

import logging from '../logging'


let pageTemplate = null

export const SERVER_BUNDLE_NAME = 'vue-ssr-server-bundle.json'
export const CLIENT_MANIFEST_NAME = 'vue-ssr-client-manifest.json'

export const createRenderer = (jigsConfig, serverBundle, clientManifest) => {
  // load the page template, if we haven't
  if (!pageTemplate) {
    pageTemplate = read(jigsConfig.rootTemplate)
    if (!pageTemplate) {
      logging.logError(`Could not read rootTemplate at ${jigsConfig.rootTemplate}`)
      process.exit(1)
    }
  }

  return createBundleRenderer(serverBundle, {
      runInNewContext: false,
      inject: false,
      // page template
      template: pageTemplate,
      // client build manifest (aids in asset injection / optimization)
      clientManifest: clientManifest
    }
  )
}
