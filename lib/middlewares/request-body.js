module.exports = function transformRequestBody(middleware) {
  return function (req, res, next) {
    if (req.method === 'GET') return next()

    // Pause the stream flow
    req.pause()

    // Little low-level hack to prevent stream EOF
    var _push = req.push
    req.push = function (data, encoding) {
      if (data === null) {
        getBody()
        return true
      }
      return _push.call(req, data, encoding)
    }

    function getBody() {
      var length = req._readableState.length
      var body = req.read(length)
      req.body = req.rawBody = body
      middleware(req, res, finisher)
    }

    function finisher(err, body, encoding) {
      if (err) {
        res.statusCode = +err.status || 500
        return res.end(err.message || err)
      }

      if (body) {
        req.push = _push
        req.headers['content-length'] = body.length
        req.push(body, encoding)
        req.push(null)
        req.resume()
      }

      next()
    }
  }
}
