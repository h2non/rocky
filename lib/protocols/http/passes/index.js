const eachSeries = require('../../../helpers').eachSeries

exports.passes = [
  require('./forward'),
  require('./replay')
]

exports.sequentially = function (args, done) {
  function iterator (pass, next) {
    pass.apply(null, args.concat(next))
  }

  eachSeries(exports.passes, iterator, done)
}

exports.concurrently = function (args, done) {
  var pending = exports.passes.length

  function finish (err, res) {
    if (err) return done(err)
    if (res && res.statusCode < 500) return done(err, res)
    if ((pending--) <= 1) done()
  }

  exports.passes.forEach(function (pass) {
    pass.apply(null, args.concat(finish))
  })
}
