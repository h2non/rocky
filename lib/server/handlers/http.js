const error = require('../../error')

module.exports = function httpHandler (rocky) {
  return function (req, res) {
    res.setHeader('Server', 'rocky')

    // Route the incoming request
    rocky.router(req, res, function (err) {
      if (err) serverError(rocky, err, req, res)
      else notFound(rocky, req, res)
    })
  }
}

function notFound (rocky, req, res) {
  const err = new Error('Route not configured: ' + req.url)
  rocky.emit('route:missing', req, res)
  error.reply(err, res)
}

function serverError (rocky, err, req, res) {
  err.status = +err.status || 500
  rocky.emit('server:error', err, req, res)
  error.reply(err, res)
}
