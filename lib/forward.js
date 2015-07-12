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
      return errors.middleware(err, req, res)
    }
    // Finally forward the request
    route.proxy.web(req, res, opts, handler)
  }

  function handler(err) {
    route.proxy.emit('proxy:error', err, req, res)

    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ message: err.message || err }))
    }
  }
}

function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
