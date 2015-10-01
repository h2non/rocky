const sinon = require('sinon')
const http = require('http')
const expect = require('chai').expect
const helpers = require('../lib/helpers')

suite('helpers', function () {
  test('toArray', function (done) {
    expect(helpers.toArray(arguments)).to.be.deep.equal([ done ])
    expect(helpers.toArray(null)).to.be.deep.equal([])
    expect(helpers.toArray(void 0)).to.be.deep.equal([])
    expect(helpers.toArray({})).to.be.deep.equal([])
    expect(helpers.toArray(1)).to.be.deep.equal([])
    expect(helpers.toArray('foo')).to.be.deep.equal(['f', 'o', 'o'])
    done()
  })

  test('isRegExp', function () {
    expect(helpers.isRegExp(/0-9/)).to.be.true
    expect(helpers.isRegExp(new RegExp)).to.be.true
    expect(helpers.isRegExp(null)).to.be.false
    expect(helpers.isRegExp([])).to.be.false
    expect(helpers.isRegExp({})).to.be.false
    expect(helpers.isRegExp('')).to.be.false
    expect(helpers.isRegExp(123)).to.be.false
    expect(helpers.isRegExp(void 0)).to.be.false
  })

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

  test('permute', function () {
    var arr = [ 1, 2, 3 ]
    expect(arr).to.be.deep.equal([1,2,3])
    helpers.permute(arr)
    expect(arr).to.be.deep.equal([2,3,1])
    helpers.permute(arr)
    expect(arr).to.be.deep.equal([3,1,2])
    helpers.permute(arr)
    expect(arr).to.be.deep.equal([1,2,3])
  })

  test('eachSeries', function (done) {
    var spy = sinon.spy()
    var arr = [ 1, 2, 3 ]

    function iterator(value, next) {
      spy(value)
      setTimeout(next, Math.random() * 5)
    }

    helpers.eachSeries(arr, iterator, function (err) {
      expect(err).to.be.undefined
      expect(spy.calledThrice).to.be.true
      expect(spy.args[0][0]).to.be.equal(1)
      expect(spy.args[1][0]).to.be.equal(2)
      expect(spy.args[2][0]).to.be.equal(3)
      done(err)
    })
  })

  test('eachConcurrently', function (done) {
    var spy = sinon.spy()
    var arr = [ 1, 2, 3 ]

    function iterator(value, next) {
      spy(value)
      setTimeout(next, Math.random() * 5)
    }

    helpers.eachConcurrently(arr, iterator, function (err) {
      expect(err).to.be.undefined
      expect(spy.calledThrice).to.be.true
      expect(spy.args[0][0]).to.be.within(1, 3)
      expect(spy.args[2][0]).to.be.within(1, 3)
      done(err)
    })
  })
})
