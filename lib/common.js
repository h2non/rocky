const _ = require('lodash')

exports.cloneRequest = function cloneRequest(req, opts) {
  var cloneReq = _.clone(req)
  cloneReq.headers = _.clone(req.headers)
  cloneReq.rocky = _.clone(req.rocky)
  cloneReq.rocky.options = _.cloneDeep(opts)
  cloneReq.__proto__ = Object.getPrototypeOf(req)
  return cloneReq
}

exports.eachSeries = function (arr, iterator, cb) {
  var stack = arr.slice()
  var length = iterator.length
  cb = cb || function () {}

  function next(err) {
    if (err) return cb(err)

    var job = stack.shift()
    if (!job) return cb()

    if (length > 1) iterator(job, next)
    else next(iterator(job))
  }

  next()
}
