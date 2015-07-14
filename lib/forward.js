const _ = require('lodash')
const common = require('./common')
const Readable = require('stream').Readable
const errors = require('./errors')

module.exports = function forward(route, opts, req, res) {
  // Balance the request, if configured
  var balance = opts.balance
  if (balance && balance.length) {
    opts.target = permute(balance)
  }

  // Reply with an error if target server was not defined
  if (!opts.target) {
    return errors.missingTarget(route, req, res)
  }

  // Clone request object to avoid side-effects
  var forwardReq = common.cloneRequest(req, opts)

  // Run the forward middleware
  route.mw.run('forward', forwardReq, res, forwarder)

  function forwarder(err) {
    if (err) {
      route.proxy.emit('route:error', err, req, res)
      return errors.replyWithError(err, res)
    }

    var body = forwardReq.body
    if (opts.forwardOriginalBody && forwardReq._originalBody) {
      forwardReq.headers['content-length'] = forwardReq._originalBodyLength
      body = forwardReq._originalBody
    }

    // If body is already present, use it standalone stream
    if (body) {
      opts.buffer = createBodyStream(body)
    }

    // Finally forward the request
    route.proxy.web(forwardReq, res, opts, handler)
  }

  function handler(err) {
    route.proxy.emit('proxy:error', err, forwardReq, res)
    errors.replyWithError(err, res)
  }
}

function createBodyStream(body) {
  var stream = new Readable
  stream.push(body)
  stream.push(null)
  return stream
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
