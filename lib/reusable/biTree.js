//
// Simple functionality for bi-directional trees (children point to parents,
// parents point to children).
//

module.exports = { }

// Makes a tree from an object of objects.
//
// Something like this:
// {
//   hasWheels: { },
//   flies: { },
//   car: { parent: 'hasWheels' },
//   scooter: { parent: 'hasWheels' },
//   italianScooter: { parent: 'scooter' },
//   ultralight: { parent: 'flies' },
// }
//
// Is transformed into:
//
// empty node
//   |- hasWheels
//      |- car
//      |- scooter
//         |- italianScooter
//   |- flies
//      |- ultralight
//
// `parentKey` is the name of the key in the objects that refers to the keys of
// the parents. So, for:
//
// {
//   one: { somestuff... },
//   two: { pater: 'one', somestuff... },
//   three: { pater: 'four, somestuff... },
//   four: { somestuff...}
// }
//
// ... `parentKey` should be 'pater' and `two` wants to be made a child of `one`
// and `three` wants to be made a child of `four`.
// `parentKey` can also be a function to get the parent's name from the object.
//
// This throws exceptions if the given tree is invalid. That is, if it has any
// cycles, no root items, or a child node references a parent that does not
// exist.
module.exports.objectToTree = (items, parentKey = 'parent') => {
  let nodes = module.exports.toNodes(items)
  // Collect all the nodes with no parents into a root object.
  let [ root, rest ] = module.exports.collectRoots(nodes, parentKey)

  // Now iterate the `rest` and build them into the tree hierarchy.
  Object.entries(rest).forEach(([ name, node]) => {
    const data = node.data
    const parentName = typeof(parentKey) === 'function' ? parentKey(node.data) : data[parentKey]

    // is the parent in the root object?
    if (root.children[parentName] !== undefined) {
      module.exports.addChild(root.children[parentName], name, node)
    // is the parent in the rest?
    } else if (rest[parentName] !== undefined) {
      module.exports.addChild(rest[parentName], name, node)
    // parent does not exist
    } else {
      throw new Error(`There is no item named "${parentName}"`)
    }
  })

  // Make sure we don't have any cycles.
  // The nifty thing about how our hierarchy-building algorithm works is that
  // all the non-root items are still in this list of the `rest`. If any cycles
  // exist, they won't be attached to the `root` node but they'll be in here.
  const cycles = module.exports.detectCycles(rest)

  // We've got cycles... through an error.
  if (cycles) {
    let err = new Error(`Found ${cycles.length} cycle${cycles.length > 1 ? 's' : ''}`)
    err.cycles = cycles
    throw err
  }

  return root
}

// Collects all the nodes with no parents into a single root.
// Returns that, and also the rest.
module.exports.collectRoots = (nodes, parentKey) => {
  let root = module.exports.makeNode(null)
  let rest = { }

  // Look for all items who don't inherit from any items. Put those in a list of
  // `roots`. Put the rest in a list of the `rest`.
  Object.entries(nodes).forEach(([ name, node]) => {
    // First, does this item specify a parent?
    const parentName = typeof(parentKey) === 'function' ? parentKey(node.data) : node.data[parentKey]

    // doesn't specify a parent, it's a root item
    if (parentName === undefined) {
      module.exports.addChild(root, name, node)
    // yes, it does specify a parent
    } else {
      rest[name] = node
    }
  })

  // make sure we have at least one root
  if (Object.keys(root.children).length < 1) {
    throw new Error(`At least one item must be a root item (must not inherit from any other items).`)
  }

  return [ root, rest ]
}

// Creates a node, with optional data, parent, and children.
module.exports.makeNode = (data, parent = null, children = { }) => {
  return {
    data,
    parent,
    children,
    inCycle: null  // TODO: would rather not have this flag here.
  }
}

// Adds a child to the given node.
module.exports.addChild = (node, name, child) => {
  node.children[name] = child
  child.parent = node
}

// converts an object of objects to an object of nodes
module.exports.toNodes = (items) =>
  Object.entries(items).reduce(
    (accum, [ k, v ]) => {
      accum[k] = module.exports.makeNode(v)
      return accum
    },
    { }
  )

// Calls a callback on every node in the tree.
// The callback is called *before* each node's children are visited.
module.exports.visitEveryChild = (tree, callback, level) => {
  if (level === undefined) {
    level = 0
  }

  Object.values(tree.children).forEach((node) => {
    callback(node, level)
    module.exports.visitEveryChild(node, callback, level + 1)
  })
}

// Detects any cycles in a flat list of nodes.
//
// NOTE: This modifies the `inCycle` flag on each node. It sets the flag to
// undetermined (null).
//
// Returns a list of cycles (each cycles is a list of nodes) if any cycles are
// found. Otherwise returns null.
module.exports.detectCycles = (nodes) => {
  // Clear all `inCycle` flags.
  Object.values(nodes).forEach(n => n.inCycle = null)

  // Look for all cycles
  const cycles = Object.values(nodes).reduce((accum, node) => {
    // We've already determined this node is in a cycle -- nothing to do.
    if (node.inCycle) {
      return accum
    }

    // Check if the node is in a cycle...
    let cycle = module.exports.detectCycle(node)
    // ...yup
    if (cycle) {
      // Add to our list of cycles
      accum.push(cycle)

      // Mark all the nodes as being in a cycle.
      cycle.forEach(n => n.inCycle = true)
    }

    return accum
  }, [ ])

  return cycles.length > 0 ? cycles : null
}

// Returns a list of nodes in a cycle, if `startingNode` is part of a cycle.
// If no cycle, returns null.
module.exports.detectCycle = (startingNode, curNode) => {
  // we haven't even started yet, kick off the recursive search...
  if (curNode === undefined) {
    let r = module.exports.detectCycle(startingNode, startingNode.parent)
    return r ? [ startingNode, ...r ] : null
  }

  // exit condition, we've didn't have a cycle and followed the hierarchy all
  // the way up to the root
  if (curNode === null) {
    return null
  }

  // exit condition, we had a cycle and followed the hierarchy around in a cycle
  if (curNode === startingNode) {
    // we don't put any nodes in here because the object was completed on the last
    // function call
    return [ ]
  }

  let r = module.exports.detectCycle(startingNode, curNode.parent)
  return r ? [ curNode, ...r ] : null
}

// module.exports.detectCycle = detectCycle
