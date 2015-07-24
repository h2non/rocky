const sinon = require('sinon')
const expect = require('chai').expect
const passthrough = require('../lib/passthrough')

suite('retry', function () {
  test('error', function (done) {
    const spy = sinon.spy()
    const res = { }
    const opts = { retry: 3 }
    const onRetry = spy

    var attempt = 0
    const task = function (done) {
      if (attempt === 3) done()
      attempt += 1
      setTimeout(done, Math.random() * 5)
    }

    const next = function () {

    }

    done()
  })
})
