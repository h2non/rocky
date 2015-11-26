const url = require('url')
const assign = require('lodash').assign

module.exports = function (query) {
  return function (req, res, next) {
    const parsedUrl = url.parse(req.url, true)

    if (!req.query) {
      req.query = parsedUrl.query
    }

    if (typeof query === 'function') {
      return query(req, res, applyQuery)
    }

    assign(req.query, query)
    applyQuery()

    function applyQuery (err) {
      if (err) return next()

      parsedUrl.search = ''
      parsedUrl.query = req.query || ''
      req.url = url.format(parsedUrl)

      next()
    }
  }
}
