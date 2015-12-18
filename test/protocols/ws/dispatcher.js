const sinon = require('sinon')
const expect = require('chai').expect
const Rocky = require('../../../lib/rocky')
const Dispatcher = require('../../../lib/protocols/ws/dispatcher')

suite('dispatcher', function () {
  test('simple dispatch', function (done) {
    const spy = sinon.spy()
    const rocky = new Rocky()
    const dispatcher = new Dispatcher(rocky)
    dispatcher.dispatchConcurrently = spy

    const req = {}
    const socket = {}
    const head = {}

    rocky.useWs(function (req, socket, head, next) {
      spy(req, socket, head)
      next()
    })

    dispatcher.dispatch(req, socket, head, spy)

    expect(spy.calledTwice).to.be.true
    expect(spy.args[0][0]).to.be.equal(req)
    expect(spy.args[0][1]).to.be.equal(socket)
    expect(spy.args[0][2]).to.be.equal(head)
    done()
  })
})
