const retry = require('retry')
const isFail = require('is-fail')

module.exports = function (opts, res, task, done, onRetry) {
  const failed = isFail(opts.strategies)

  // Overwrite response methods
  const _writeHead = res.writeHead
  const _end = res.end

  // Set methods to noop
  res.writeHead = function () {}
  res.end = function () {}

  // Create the retrier
  const op = retry.operation(opts)

  // Do the first attempt
  op.attempt(runTask)

  function runTask () {
    task(handler)
  }

  function handler (err, proxyRes) {
    if (op.retry(failed(err, proxyRes))) {
      return onRetry(err)
    }

    // Restore native methods
    res.end = _end
    res.writeHead = _writeHead
    res = null

    done(err)
  }
}
