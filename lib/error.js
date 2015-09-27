exports.reply = function (err, res) {
  if (res.headersSent) return err

  var status = +err.status || 502
  var headers = { 'Content-Type': 'application/json' }
  res.writeHead(status, headers)

  var message = err.message || err
  var body = JSON.stringify({ message: message })
  res.end(body)

  return err
}
