const error  = require('../../error')

module.exports = function httpHandler(rocky) {
  return function (req, res) {
    res.setHeader('Server', 'rocky')
    rocky.router(req, res, finalHandler)

    function finalHandler(err) {
      if (err) {
        return serverError(rocky, err, req, res)
      }
      notFound(rocky, req, res)
    }
  }
}

function notFound(rocky, req, res) {
  var err = new Error('Route not configured: ' + req.url)
  rocky.emit('route:missing', req, res)
  error.reply(err, res)
}

function serverError(rocky, err, req, res) {
  err.status = +err.status || 500
  rocky.emit('server:error', err, req, res)
  error.reply(err, res)
}
