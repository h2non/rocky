exports.missingTarget = function missingTargetError(route, req, res) {
  var err = new Error('Cannot forward the request. Missing target URL for this route')
  route.proxy.emit('route:error', err, req, res)
  replyWithError(err, res)
}

exports.middleware = function middlewareError(route, err, req, res) {
  route.proxy.emit('route:error', err, req, res)
  replyWithError(err, res)
}

function replyWithError(err, res) {
  if (!res.headersSent) {
    res.writeHead(+err.code || 502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message || err }))
  }
}

exports.replyWithError = replyWithError
