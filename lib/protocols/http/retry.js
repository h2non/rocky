const retry = require('retry')
const isFail = require('is-fail')
const once = require('../../helpers').once

module.exports = function (opts, res, task, done, onRetry) {
  const failed = isFail(opts.strategies)

  // Overwrite response methods
  const proto = Object.getPrototypeOf(res)

  // Set methods to noop
  res.writeHead = noop
  res.write = noop
  res.end = noop

  // Create the retrier
  const op = retry.operation(opts)

  // Do the first attempt
  op.attempt(runTask)

  function runTask () {
    task(once(handler))
  }

  function isFailed (err, res) {
    return failed(err, res) || err != null
  }

  function handler (err, proxyRes) {
    if (op.retry(isFailed(err, proxyRes))) {
      return onRetry(err, proxyRes)
    }

    // Restore native methods
    res.end = proto.end
    res.write = proto.write
    res.writeHead = proto.writeHead
    res = null

    done(err)
  }
}

function noop () {
  // Fake callback resolution
  const fn = [].slice.call(arguments).reduce(function (fn, arg) {
    if (typeof arg === 'function') fn = arg
    return fn
  }, null)
  if (fn) fn()
  return this
}
