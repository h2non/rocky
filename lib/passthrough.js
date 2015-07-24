const eachSeries = require('./common').eachSeries
const passes = exports.passes = require('./passes')

exports.sequentially = function (args, done) {
  function iterator(pass, next) {
    pass.apply(null, args.concat(next))
  }

  eachSeries(passes, iterator, done)
}

exports.concurrently = function (args, done) {
  var pending = passes.length

  function finish(err, res) {
    if (err) return done(err)
    if (res && res.statusCode < 500) return done(err, res)
    if ((pending--) <= 1) done()
  }

  passes.forEach(function (pass) {
    pass.apply(null, args.concat(finish))
  })
}
