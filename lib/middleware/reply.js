module.exports = function (code, headers, body) {
  return function (req, res) {
    res.writeHead(code, headers)
    res.write(body)
    res.end()
  }
}
