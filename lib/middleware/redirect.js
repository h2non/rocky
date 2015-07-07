module.exports = function (url) {
  return function (req, res) {
    res.writeHead(301, { Location: url })
    res.end()
  }
}
