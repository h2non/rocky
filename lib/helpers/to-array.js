const slicer = Array.prototype.slice

module.exports = function toArray (o) {
  if (!o || !o.length) return []
  return slicer.call(o)
}
