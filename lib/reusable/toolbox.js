
import jetpack from 'fs-jetpack'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { Left, Right } from 'crocks/Either'

// ForgeConfig -> String -> Either(Error String, String)
// Ensures the given path is safe to use for output - meaning it's in the build
// directory and won't cause overwrites or deletes of client project files.
// TODO: this doesn't below in reusable/toolbox!
export const outPathIsSafe = (config, thePath) => {
  if (!config) {
    return Left(new Error(`Given config is empty`))
  }

  if (!config.dirs) {
    return Left(new Error(`Given config has no 'dirs'`))
  }

  if (!config.dirs.build) {
    return Left(new Error(`Given config has no 'dirs.build'`))
  }

  if (!thePath.startsWith(config.dirs.build)) {
    return Left(
      new Error(
        `Invalid out path ${thePath}. Should start with: ${config.dirs.build}.`
      )
    )
  } else {
    return Right(thePath)
  }
}

// ForgeConfig -> String -> Async(Error String, String)
// TODO: this doesn't below in reusable/toolbox!
export const deletePathIfSafe = (config, thePath) =>
  eitherToAsync(
    outPathIsSafe(config, thePath)
  )
  .map(p => {
    jetpack.remove(p)
    return p
  })
