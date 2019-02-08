
import { curry } from 'crocks'

// [ a ] -> { a }
// function to collect list of objects into object of objects
export const collect = curry((propName, accum, item) => {
  accum[item[propName]] = item
  return accum
})
