const sinon = require('sinon')
const expect = require('chai').expect
const Base = require('../../../lib/base')
const Dispatcher = require('../../../lib/protocols/http/dispatcher')

suite('dispatcher', function () {
  test('dispatch', function (done) {
    const spy = sinon.spy()
    const rocky = new Base()
    const route = new Base()
    const dispatcher = new Dispatcher(rocky, route)
    dispatcher.dispatchConcurrently = spy

    const req = { rocky: {} }
    const res = { headersSent: true }

    route.use(function (req, res, next) {
      spy(req, res)
      next()
    })

    dispatcher.dispatch(req, res)

    expect(spy.calledTwice).to.be.true
    expect(spy.args[0][0]).to.be.equal(req)
    expect(spy.args[0][1]).to.be.equal(res)
    expect(spy.args[1][0]).to.be.deep.equal(dispatcher.options())
    expect(spy.args[1][1]).to.be.equal(req)
    expect(spy.args[1][2]).to.be.equal(res)
    done()
  })

  test('dispatch sequentially', function (done) {
    const spy = sinon.spy()
    const rocky = new Base()
    const route = new Base()
    rocky.sequential()
    const dispatcher = new Dispatcher(rocky, route)
    dispatcher.dispatchSequentially = spy

    const req = { rocky: {} }
    const res = { headersSent: true }

    route.use(function (req, res, next) {
      spy(req, res)
      next()
    })

    dispatcher.dispatch(req, res)

    expect(spy.calledTwice).to.be.true
    expect(spy.args[0][0]).to.be.equal(req)
    expect(spy.args[0][1]).to.be.equal(res)
    expect(spy.args[1][0]).to.be.deep.equal(dispatcher.options())
    expect(spy.args[1][1]).to.be.equal(req)
    expect(spy.args[1][2]).to.be.equal(res)
    done()
  })
})
