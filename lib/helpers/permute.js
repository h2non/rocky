module.exports = function permute (arr) {
  const item = arr.shift()
  arr.push(item)
  return item
}
