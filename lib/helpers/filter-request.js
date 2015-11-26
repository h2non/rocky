const isRegExp = require('./is-regexp')

module.exports = function filterRequest (filter, reqRes) {
  if (typeof filter === 'function') {
    return filter(reqRes)
  }

  const contentType = getContentType(reqRes)
  if (typeof filter === 'string') {
    filter = new RegExp(filter, 'i')
  }

  if (isRegExp(filter)) {
    return filter.test(contentType)
  }

  return false
}

function getContentType (reqRes) {
  return reqRes.getHeader
    ? reqRes.getHeader('content-type')
    : reqRes.headers['content-type']
}
