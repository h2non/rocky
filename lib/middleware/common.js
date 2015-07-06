exports.filterRequest = function filterRequest(filter, reqRes) {
  if (typeof filter === 'function') {
    return filter(reqRes)
  }

  var contentType = getContentType(reqRes)
  if (typeof filter === 'string') {
    return new RegExp(filter, 'i').test(contentType)
  }

  if (isRegExp(filter)) {
    return filter.test(contentType)
  }

  return false
}

function getContentType(reqRes) {
  return reqRes.getHeader
    ? reqRes.getHeader('content-type')
    : reqRes.headers['content-type']
}

function isRegExp(o) {
  return o && Object.prototype.toString.call(o) === '[object RegExp]'
}
