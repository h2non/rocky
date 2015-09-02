const _ = require('lodash')

module.exports = function cloneRequest(req, opts) {
  var cloneReq = _.clone(req)

  cloneReq.headers = _.clone(req.headers)
  cloneReq.rocky = _.clone(req.rocky)
  cloneReq.rocky.options = _.cloneDeep(opts || req.rocky.options)
  cloneReq.__proto__ = Object.getPrototypeOf(req)

  return cloneReq
}
