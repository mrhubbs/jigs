
const assert = require('assert')

const biTree = require('./biTree')

describe('biTree', function () {
  describe('makeNode', function () {
    it('name and data', function () {
      const data = [ 'A List', 'Apart from MEE' ]
      const n = biTree.makeNode(data)

      assert.equal(n.data, data)
    })

    it('default parent', function () {
      assert.equal(biTree.makeNode(' ').parent, null)
    })

    it('passed parent', function () {
      assert.equal(biTree.makeNode(' ', 42).parent, 42)
    })

    it('default children', function () {
      assert.deepEqual(
        biTree.makeNode(' ', 42).children,
        { }
      )
    })

    it('passed children', function () {
      assert.deepEqual(
        biTree.makeNode(
          ' ',
          42,
          { 0: 1, 1: 2, 2: 3, 4: 'BLEAM!', 5: 4 }
        ).children,
        { 0: 1, 1: 2, 2: 3, 4: 'BLEAM!', 5: 4 }
      )
    })
  })

  describe('addChild', function () {
    it('should add', function () {
      let n = biTree.makeNode()
      let child = biTree.makeNode(10)

      biTree.addChild(n, 'child', child)
      assert.equal(child, n.children['child'])
      assert.equal(n.children['child'].parent, n)
    })
  })

  describe('toNodes', function () {
    const ns = biTree.toNodes({ 1: 'one', '2': 'two', 3: 'data' })

    assert.equal(ns[1].data, 'one')
    // don't care what `parent` and `children` are, as long as they are exist
    assert.ok(ns[1].parent !== undefined)
    assert.ok(ns[1].children !== undefined)

    assert.equal(ns['2'].data, 'two')
    assert.ok(ns['2'].parent !== undefined)
    assert.ok(ns['2'].children !== undefined)

    assert.equal(ns[3].data, 'data')
    assert.ok(ns[3].parent !== undefined)
    assert.ok(ns[3].children !== undefined)
  })

  describe('cycles', function () {
    let caterpilled = biTree.makeNode({ name: 'caterpilled' }),
        dragonflew = biTree.makeNode({ name: 'dragonflew' }),
        bumblebeed = biTree.makeNode({ name: 'bumblebeed' }),
        raterpillar = biTree.makeNode({ name: 'raterpillar' }),
        junkrodent = biTree.makeNode({ name: 'junkrodent' }),
        bob = biTree.makeNode({ name: 'bob' }),
        bill = biTree.makeNode({ name: 'bill' }),
        john = biTree.makeNode({ name: 'john' }),
        jim = biTree.makeNode({ name: 'jim' }),
        andrew = biTree.makeNode({ name: 'andrew' })

    let nodes = {
      caterpilled,
      dragonflew,
      bumblebeed,
      raterpillar,
      junkrodent,
      bob,
      bill,
      john,
      jim,
      andrew,
    }

    // make a cycle
    dragonflew.parent = bumblebeed
    bumblebeed.parent = dragonflew

    // make a non-cycle
    junkrodent.parent = raterpillar
    raterpillar.parent = caterpilled

    // make a larger cycle
    bob.parent = bill
    bill.parent = john
    john.parent = jim
    jim.parent = andrew
    andrew.parent = bob

    describe('detectCycle', function () {
      it('returns a cycle if there is one, cycle of two', function () {
        const cycle = biTree.detectCycle(dragonflew)

        assert.equal(cycle.length, 2)
        assert.deepEqual(cycle[0], dragonflew)
        assert.deepEqual(cycle[1], bumblebeed)
      })

      it('returns a cycle if there is one, cycle of five', function () {
        const cycle = biTree.detectCycle(john)

        assert.equal(cycle.length, 5)
        assert.deepEqual(cycle[0], john)
        assert.deepEqual(cycle[1], jim)
        assert.deepEqual(cycle[2], andrew)
        assert.deepEqual(cycle[3], bob)
        assert.deepEqual(cycle[4], bill)
      })

      it('returns empty list if no cycle', function () {
        assert.deepEqual(null, biTree.detectCycle(junkrodent))
      })
    })

    describe('detectCycles', function () {
      it('returns null if no cycles', function () {
        const cycles = biTree.detectCycles({
          caterpilled,
          raterpillar,
          junkrodent
        })

        assert.equal(cycles, null)
      })

      it('returns one cycle if one', function () {
        const cycles = biTree.detectCycles({
          dragonflew,
          bumblebeed
        })

        assert.equal(cycles.length, 1)
        assert.deepEqual(cycles[0], [ dragonflew, bumblebeed ])
      })

      it('returns two cycles if two', function () {
        const cycles = biTree.detectCycles({
          dragonflew,
          bumblebeed,
          bob,
          bill,
          john,
          jim,
          andrew
        })

        assert.equal(cycles.length, 2)
        assert.deepEqual(cycles[0], [ dragonflew, bumblebeed ])
        assert.deepEqual(cycles[1], [ bob, bill, john, jim, andrew ])
      })
    })
  })


  describe('objectToTree', function () {
    describe('collectRoots', function () {
      it('throws if no root objects', function () {
        assert.throws(() => {
            biTree.collectRoots(biTree.toNodes({
              one: { name: 1, layout: 'something' },
              two: { name: 2, layout: 'something' }
            }), 'layout')
          },
          /one item must be a root item/,
          'threw an error, but the wrong error'
        )
      })

      it('parentKey can be a function', function () {
        const [ root, rest ] = biTree.collectRoots(
          biTree.toNodes({
            one: { name: 1 },
            two: { name: 2, ancestor: 'one' }
          }), (i) => i.ancestor
        )
      })
    })

    describe('objectToTree', function () {
      it('throws for missing parent name', function () {
        assert.throws(() => {
            biTree.objectToTree({
              one: { name: 'one' },
              two: { name: 'two', parent: 'one111' }
            })
          },
          /no item named "one111"/,
        )
      })

      it('throws cycles if there are any', function () {
        let noName = { name: 'noName' },
            farFetched = { name: 'farFetched', parent: 'waaayOutThere' },
            fartherFetched = { name: 'fartherFetched', parent: 'farFetched' },
            waaayOutThere = { name: 'waaayOutThere', parent: 'fartherFetched' }

        assert.throws(() => {
            const tree = biTree.objectToTree({
              noName,
              farFetched,
              fartherFetched,
              waaayOutThere
            })
          },
          err => /Found .+ cycle/.test(err) && err.cycles && err.cycles.length === 1
        )
      })

      it('throws if no items are roots', function () {
        // we can run this test, even though we're creating a cycle, because the
        // check for roots is run before the check for cycles.
        let a = { name: 'a', parent: 'b' },
            b = { name: 'b', parent: 'a' }

        assert.throws(() => {
            const tree = biTree.objectToTree({
              a,
              b
            })
          },
          /At least one item must be a root item/
        )
      })

      it('builds tree properly', function () {
        let abraham = { },
            isaac = { parent: 'abraham' },
            ishmael = { parent: 'abraham' },
            lotsparent = { },
            other_abraham_sibling_if_any = {  },
            jacob = { parent: 'isaac' }

        const abrams_dad = biTree.objectToTree({
            abraham,
            isaac,
            ishmael,
            lotsparent,
            other_abraham_sibling_if_any,
            jacob,
          },
          'parent'
        )

        assert.equal(abrams_dad.data, null)
        assert.equal(abrams_dad.parent, null)

        // guarantee we have the top-level children
        assert.ok(abrams_dad.children['abraham'] !== undefined)
        assert.ok(abrams_dad.children['lotsparent'] !== undefined)
        assert.ok(abrams_dad.children['other_abraham_sibling_if_any'] !== undefined)

        // guarantee the other children are were they belong
        assert.ok(abrams_dad.children['abraham'].children['isaac'] !== undefined)
        assert.ok(abrams_dad.children['abraham'].children['ishmael'] !== undefined)
        assert.ok(abrams_dad.children['abraham'].children['isaac'].children['jacob'] !== undefined)
      })
    })
  })
})
