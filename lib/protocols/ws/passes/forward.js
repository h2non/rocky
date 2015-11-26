const proxy = require('../proxy')
const permute = require('../../../helpers/permute')

module.exports = function (opts, req, socket, head, done) {
  var target = opts.balance || opts.target

  if (Array.isArray(target)) {
    target = permute(target)
  }

  if (!target) return done(new Error('Missing target URI'))

  proxy(opts, req, socket, head, done)
}
