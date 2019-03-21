
import jetpack from 'fs-jetpack'
import Async from 'crocks/Async'

// ForgeConfig -> String -> Async(Error String, String)
export const deletePathIfSafe = (config, thePath) => Async((reject, resolve) => {
  // is the `thePath` in the build dir?
  if (thePath.startsWith(config.dirs.build)) {
    // yup, remove
    jetpack.remove(thePath)
    resolve(thePath)
  } else {
    // no! we don't want to delete anything outside of the build dir!!!
    reject(new Error(`Invalid delete path ${thePath}. Should start with: ${config.dirs.build}.`))
  }
})
