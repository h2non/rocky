const sinon = require('sinon')
const http = require('http')
const expect = require('chai').expect
const helpers = require('../lib/helpers')

suite('helpers', function () {
  test('cloneRequest', function () {
    var req = new http.IncomingMessage
    req.headers = { foo: 'bar' }
    req.rocky = { options: { foo: { bar: true }} }

    var newReq = helpers.cloneRequest(req)
    expect(newReq).to.not.be.equal(req)
    expect(newReq.rocky).to.not.be.equal(req.rocky)
    expect(newReq.headers).to.not.be.equal(req.headers)
    expect(newReq.rocky.options).to.not.be.equal(req.rocky.options)
    expect(newReq.rocky.options.foo).to.not.be.equal(req.rocky.options.foo)
    expect(newReq.__proto__).to.be.equal(req.__proto__)
  })

  test('eachSeries', function (done) {
    var spy = sinon.spy()
    var arr = [ 1, 2, 3 ]

    function iterator(value, next) {
      spy(value)
      next()
    }

    helpers.eachSeries(arr, iterator, function (err) {
      expect(err).to.be.undefined
      expect(spy.calledThrice).to.be.true
      expect(spy.args[0][0]).to.be.equal(1)
      expect(spy.args[2][0]).to.be.equal(3)
      done(err)
    })
  })
})
