module.exports = function eachConcurrently (arr, iterator, cb) {
  cb = cb || noop
  if (!Array.isArray(arr) || !arr.length) return cb()

  var errors = []
  var pending = arr.length

  arr.forEach(function (item) {
    iterator(item, next)
  })

  function next (err) {
    if (err) errors.push(err)
    if (!(pending--)) finish()
  }

  function finish () {
    if (errors.length) cb(errors)
    else cb()
  }

  next()
}

function noop () {}
