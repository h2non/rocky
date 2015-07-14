const missingTargetError = new Error('Cannot forward the request. Missing target URL for this route')

exports.missingTarget = missingTargetError
exports.replyWithError = replyWithError

function missingTarget(route, req, res) {
  route.proxy.emit('route:error', missingTargetError, req, res)
  replyWithError(missingTargetError, res)
}

function replyWithError(err, res) {
  if (!res.headersSent) {
    res.writeHead(+err.status || 502, { 'Content-Type': 'application/json' })
    res.end(JSON.stringify({ message: err.message || err }))
  }
}
