const _ = require('lodash')

module.exports = function cloneRequest (req, opts) {
  const cloneReq = _.clone(req)

  // Clone headers and rocky context
  cloneReq.headers = _.clone(req.headers)
  cloneReq.rocky = _.clone(req.rocky)

  // Clone request options
  const options = _.cloneDeep(opts || req.rocky.options)

  // Balance array must be mutable for permutation
  if (options.balance) {
    options.balance = (opts || req.rocky.options).balance
  }

  // Expose options in rocky object
  cloneReq.rocky.options = options

  // Inherits original prototype chain
  Object.setPrototypeOf(cloneReq, Object.getPrototypeOf(req))

  return cloneReq
}
