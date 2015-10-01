module.exports = function permute(arr) {
  var item = arr.shift()
  arr.push(item)
  return item
}
