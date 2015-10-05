const sinon = require('sinon')
const expect = require('chai').expect
const passes = require('../../../lib/protocols/http/passes')

suite('passes', function () {
  const passes = passes.passes

  function restore() {
    passes.passes = passes
  }

  test('sequentially', function (done) {
    var delay = Date.now() - 10

    function pass(text, next) {
      expect(text).to.be.equal('hello')
      expect(Date.now() - delay).to.be.at.least(9)
      delay = Date.now()
      setTimeout(next, 10)
    }

    const args = [ 'hello' ]
    passes.passes = [ pass, pass, pass ]
    passes.sequentially(args, done)
  })

  test('concurrently', function (done) {
    var delay = 10
    var start = Date.now()

    function pass(text, next) {
      expect(text).to.be.equal('hello')
      setTimeout(next, delay)
    }

    const args = [ 'hello' ]
    passes.passes = [ pass, pass, pass ]
    passes.concurrently(args, function (err) {
      restore()
      expect(Date.now() - start).to.be.below(delay * 2)
      done(err)
    })
  })
})
