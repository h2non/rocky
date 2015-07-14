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

  // Run the forward middleware
  route.mw.run('forward', req, res, forwarder)

  function forwarder(err) {
    if (err) {
      return errors.middleware(route, err, req, res)
    }

    // If body is already present, use it standalone stream
    if (req.body) {
      opts.buffer = createStream(req)
    }

    // Finally forward the request
    route.proxy.web(req, res, opts, handler)
  }

  function handler(err) {
    route.proxy.emit('proxy:error', err, req, res)
    errors.replyWithError(err, res)
  }
}

function createStream(req) {
  var stream = new Readable
  stream.push(req.body)
  stream.push(null)
  return stream
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
