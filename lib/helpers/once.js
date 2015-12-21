module.exports = function once (fn) {
  var called = false
  return function () {
    if (called) return
    called = true
    fn.apply(null, arguments)
  }
}
