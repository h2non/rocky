exports.missingTarget = function missingTargetError(route, req, res) {
  var error = new Error('Cannot forward the request. Missing target URL for this route')
  route.proxy.emit('route:error', error, req, res)

  if (!res.headersSent) {
    res.writeHead(502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: error.message }))
  }
}

exports.middleware = function middlewareError(route, req, res) {
  route.proxy.emit('route:error', err, req, res)

  if (!res.headersSent) {
    res.writeHead(+err.code || 502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message || err }))
  }
}
