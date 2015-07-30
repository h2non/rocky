const sinon = require('sinon')
const expect = require('chai').expect
const Pool = require('../lib/mwpool')

suite('middleware pool', function () {
  test('register and dispatch', function (done) {
    var spy = sinon.spy()
    var pool = new Pool

    pool.use('x', [function (a, b, next) {
      spy(a, b, next)
      setTimeout(next, 1)
    }])

    pool.use('x', [function (a, b, next) {
      spy(a, b, next)
      setTimeout(next, 1)
    }])

    pool.run('x', 1, 2, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(spy.calledTwice).to.be.true
      expect(spy.args[0].length).to.be.equal(3)
      expect(spy.args[1].length).to.be.equal(3)
      expect(spy.args[0].shift()).to.be.equal(1)
      expect(spy.args[0].shift()).to.be.equal(2)
      expect(spy.args[0].shift()).to.be.a('function')
      done()
    }
  })

  test('invalid middleware', function (done) {
    var spy = sinon.spy()
    var pool = new Pool

    pool.run('y', 1, 2, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(spy.calledOnce).to.be.false
      done()
    }
  })

  test('remove middleware', function (done) {
    var spy = sinon.spy()
    var pool = new Pool

    pool.use('x', [function error(next) {
      spy()
      next('err')
    }])
    pool.use('x', [function valid(next) {
      spy()
      next()
    }])

    pool.remove('x', 'error')
    pool.run(2, 2, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(spy.calledOnce).to.be.false
      done()
    }
  })

  test('flush stack', function (done) {
    var spy = sinon.spy()
    var pool = new Pool

    pool.use('x', [function error(next) {
      spy()
      next('err')
    }])
    pool.use('x', [function valid(next) {
      spy()
      next()
    }])

    expect(pool.stack('x')).to.have.length(2)
    pool.flush('x')
    pool.run(2, 2, assert)

    function assert(err) {
      expect(err).to.be.undefined
      expect(pool.stack('x')).to.have.length(0)
      expect(spy.args).to.have.length(0)
      done()
    }
  })
})
