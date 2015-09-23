module.exports = function eachConcurrent(arr, iterator, cb) {
  var errors = []
  var pending = arr.length

  arr.forEach(function (item) {
    iterator(item, next)
  })

  function next(err) {
    if (err) errors.push(err)
    if ((pending--) <= 1) finish()
  }

  function finish() {
    if (cb) cb(errors.length ? errors : null)
  }

  next()
}
