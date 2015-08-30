module.exports = function eachSeries(arr, iterator, cb) {
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
