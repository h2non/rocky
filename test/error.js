const sinon = require('sinon')
const expect = require('chai').expect
const errors = require('../lib/error')

suite('error', function () {
  test('reply', function (done) {
    const spy = sinon.spy()
    const err = { status: 500, message: 'omg' }
    const res = { headersSent: false, end: spy, writeHead: spy }

    errors.reply(err, res)

    expect(spy.calledTwice).to.be.true
    expect(spy.args[0][0]).to.be.equal(err.status)
    expect(spy.args[0][1]).to.be.deep.equal({ 'Content-Type': 'application/json' })
    expect(spy.args[1][0]).to.be.equal('{"message":"omg"}')
    done()
  })
})
