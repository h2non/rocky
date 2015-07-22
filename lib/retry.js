const retry     = require('retry')
const isFail    = require('is-fail')()

module.exports = function retrier(opts, res, task, done, onRetry) {
  var _writeHead = res.writeHead
  var _end = res.end

  res.writeHead = function () {}
  res.end = function () {}

  var op = retry.operation(opts)

  op.attempt(function () {
    task(function (err, proxyRes) {
      if (op.retry(isFail(err, proxyRes))) {
        return onRetry(err)
      }

      // Restore
      res.writeHead = _writeHead
      res.end = _end

      done(err)
    })
  })
}
