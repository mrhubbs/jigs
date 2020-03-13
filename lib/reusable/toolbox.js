
import jetpack from 'fs-jetpack'
import eitherToAsync from 'crocks/Async/eitherToAsync'
import { Left, Right } from 'crocks/Either'

// JigsConfig -> String -> Either(Error String, String)
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

  if (!config.dirs.buildRoot) {
    return Left(new Error(`Given config has no 'dirs.buildRoot'`))
  }

  if (!thePath.startsWith(config.dirs.buildRoot)) {
    return Left(
      new Error(
        `Invalid out path ${thePath}. Should start with: ${config.dirs.buildRoot}.`
      )
    )
  } else {
    return Right(thePath)
  }
}

// JigsConfig -> String -> Async(Error String, String)
// TODO: this doesn't below in reusable/toolbox!
export const deletePathIfSafe = (config, thePath) =>
  eitherToAsync(
    outPathIsSafe(config, thePath)
  )
  .map(p => {
    jetpack.remove(p)
    return p
  })

// String -> String
export const kebabCase = s =>
  // For every instance of a capital letter surrounded by two lowercase letters,
  // put a dash before the capital letter. Then lowercase the entire string.
  s.replace(/([a-z])([A-Z][a-z])/, '$1-$2').replace('.', '-').toLowerCase()

// Like throwing a temper tamtrum, but less one-sided
export const throwArgument = a => { throw a }
