const fw      = require('fw')
const midware = require('midware')

module.exports = MiddlewarePool

function MiddlewarePool() {
  this.pool = {}
}

MiddlewarePool.prototype.register = function (name) {
  var middleware = [].slice(arguments, 1)

  var pool = this.pool[name]
  if (!pool) {
    pool = this.pool[name] = midware()
  }

  pool.apply(null, middleware)
}

MiddlewarePool.prototype.run = function (name) {
  var args = [].slice(arguments, 1)
  var done = args[args.length - 1]

  var pool = this.pool[name]
  if (!pool) {
    return done()
  }

  pool.apply(null, args)
}

MiddlewarePool.prototype.runAll = function (names) {
  var args = [].slice.call(arguments, 1)
  var done = args.pop()

  fw.eachSeries(names, function (name, next) {
    var passArgs = [ name ].concat(args).concat([ next ])
    this.run.apply(this, passArgs)
  }.bind(this), done)
}
