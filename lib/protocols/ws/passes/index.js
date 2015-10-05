const eachConcurrently = require('../../../helpers').eachConcurrently

exports.passes = [
  require('./forward')
]

exports.concurrently = function (opts, req, socket, head, done) {
  eachConcurrently(exports.passes, function (pass, next) {
    pass(opts, req, socket, head, next)
  }, done)
}
