const retry = require('retry')
const isFail  = require('is-fail')

module.exports = function retrier(opts, res, task, done, onRetry) {
  var failed = isFail(opts.strategies)

  // Overwrite response methods
  var _writeHead = res.writeHead
  var _end = res.end
  res.writeHead = function () {}
  res.end = function () {}

  var op = retry.operation(opts)

  op.attempt(function () { task(handler) })

  function handler(err, proxyRes) {
    if (op.retry(failed(err, proxyRes))) {
      return onRetry(err)
    }

    // Restore native methods
    res.writeHead = _writeHead
    res.end = _end

    done(err)
  }
}
