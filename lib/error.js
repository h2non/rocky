exports.reply = function (err, res) {
  if (res.headersSent) return err

  var status = +err.status || 502
  var headers = { 'Content-Type': 'application/json' }
  res.writeHead(status, headers)

  var message = err.message || err
  var body = JSON.stringify({ message: message })
  res.end(body)

  // Set methods to noop to avoid uncaught exceptions throwed by pending
  // events in the loop that cannot handle the response state properly.
  // Ideally this should be remove in the future
  res.setHeader = noop
  res.writeHead = noop
  res.write = noop
  res.end = noop

  return err
}

function noop() {}
