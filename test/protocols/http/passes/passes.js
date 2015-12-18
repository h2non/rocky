const expect = require('chai').expect
const passthrough = require('../../../lib/protocols/http/passes')

suite('passes', function () {
  const passes = passthrough.passes

  function restore () {
    passthrough.passes = passes
  }

  test('sequentially', function (done) {
    var delay = Date.now() - 10

    function pass (text, next) {
      expect(text).to.be.equal('hello')
      expect(Date.now() - delay).to.be.at.least(9)
      delay = Date.now()
      setTimeout(next, 10)
    }

    const args = [ 'hello' ]
    passthrough.passes = [ pass, pass, pass ]
    passthrough.sequentially(args, done)
  })

  test('concurrently', function (done) {
    var delay = 10
    var start = Date.now()

    function pass (text, next) {
      expect(text).to.be.equal('hello')
      setTimeout(next, delay)
    }

    const args = [ 'hello' ]
    passthrough.passes = [ pass, pass, pass ]
    passthrough.concurrently(args, function (err) {
      restore()
      expect(Date.now() - start).to.be.below(delay * 2)
      done(err)
    })
  })
})
