
import { curry } from 'crocks'

// String -> { } -> Either(err, b) -> { Either(err, b) }
// function to collect list of objects into object of objects
// TODO: how to properly fold list of Eithers into object of Eithers?
export const collect = curry((propName, accum, errorOrItem) => {
  // extract the item from the contaier
  // This is so naughty of us
  errorOrItem.map(item => { accum[item[propName]] = errorOrItem })

  return accum
})

// a -> a
// for use in compose
export const callSomething = curry((sayIt, x) => {
  sayIt(x)
  return x
})

// (a | b) -> Boolean -> [ a, b ] -> [ [ a ], [ b ] ]
// Splits a list into two sublists, based on a predicate function.
// Return values of true cause an element to go into the first list.
export const splilter = curry((pred, xs) => {
  let a = [ ],
      b = [ ]

  xs.forEach(i => {
    if (pred(i)) a.push(i)
    else b.push(i)
  })

  return [ a, b ]
})

export const isType = curry((type, x) => typeof(x) === type)

// [ o = { [propName]: somevalue } ] -> { somevalue: o }
export const arrayOfObjectsToObject = curry((propName, xs) => {
  let o = { }
  xs.forEach(x => o[x[propName]] = x)

  return o
})

// { a: b } -> [ b ]
export const objectToArray = xs => Object.values(xs)

// Integer -> [ String ] -> String
// Creates a string listing some values in the area, and ending with "and X
// more" if there are more than `limit` values.
export const saySome = (limit, xs) => {
  let additional = -(limit - xs.length)
  additional = additional > 0 ? ` and ${additional} more` : ''

  return `${xs.slice(0, limit).join(', ')}${additional}`
}

// () -> ()
// no-op, no-operation, does nothing...
export const noop = () => { }
