/* @module error */

/**
 * Given an error and http.ServerResponse object, replies with the proper JSON error
 *
 * @param {Error} err
 * @param {http.ServerResponse} res
 * @method reply
 */

exports.reply = function (err, res) {
  if (res.headersSent) return err

  const status = +err.status || 502
  const headers = { 'Content-Type': 'application/json' }
  res.writeHead(status, headers)

  const message = err.message || err
  const body = JSON.stringify({ message: message })
  res.end(body)

  // Set methods to noop to avoid uncaught exceptions throwed by pending
  // events in the loop that cannot handle the response state properly.
  res.setHeader = noop
  res.writeHead = noop
  res.write = noop
  res.end = noop

  return err
}

function noop () {}
