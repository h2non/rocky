const sinon = require('sinon')
const expect = require('chai').expect
const passthrough = require('../lib/passthrough')

suite('passthrough', function () {
  const passes = passthrough.passes

  function restore() {
    passthrough.passes = passes
  }

  test('sequentially', function (done) {
    var delay = Date.now() - 10

    function pass(text, next) {
      var now = Date.now()
      expect(text).to.be.equal('hello')
      expect((now - delay) >= 10).to.be.true
      delay = Date.now()
      setTimeout(next, 10)
    }

    const args = [ 'hello' ]
    passthrough.passes = [ pass, pass, pass ]
    passthrough.sequentially(args, done)
  })

  test('concurrently', function (done) {
    var start = Date.now()

    function pass(text, next) {
      expect(text).to.be.equal('hello')
      setTimeout(next, 5)
    }

    const args = [ 'hello' ]
    passthrough.passes = [ pass, pass, pass ]
    passthrough.concurrently(args, function (err) {
      expect((Date.now() - start)).to.lower(12)
      restore()
      done(err)
    })
  })
})
