const sinon = require('sinon')
const expect = require('chai').expect
const retry = require('../../../lib/protocols/http/retry')

suite('retry', function () {
  test('error', function (done) {
    const spy = sinon.spy()
    const res = { }
    const opts = { retries: 3, factor: 2, minTimeout: 10 }
    const onRetry = spy

    var attempt = 0
    const task = function (done) {
      if (attempt === 3) return done()
      attempt += 1
      setTimeout(function () {
        done({ code: 'ECONNRESET' })
      }, Math.random() * 5)
    }

    const next = function (err) {
      expect(spy.calledThrice).to.be.true
      done(err)
    }

    retry(opts, res, task, next, onRetry)
  })

  test('status', function (done) {
    const spy = sinon.spy()
    const res = { }
    const opts = { retries: 3, factor: 2, minTimeout: 10 }
    const onRetry = spy

    var attempt = 0
    const task = function (done) {
      if (attempt === 3) return done()
      attempt += 1
      setTimeout(function () {
        done(null, { statusCode: 503 })
      }, Math.random() * 5)
    }

    const next = function (err) {
      expect(spy.calledThrice).to.be.true
      done(err)
    }

    retry(opts, res, task, next, onRetry)
  })
})
