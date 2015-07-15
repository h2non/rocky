const midware = require('midware')

module.exports = MiddlewarePool

function MiddlewarePool() {
  this.pool = {}
}

MiddlewarePool.prototype.use = function (name, args) {
  var pool = this.pool[name]

  if (!pool) {
    pool = this.pool[name] = midware()
  }

  if (typeof args === 'function') {
    args = [ args ]
  }

  pool.apply(null, args)
}

MiddlewarePool.prototype.run = function (name) {
  var args = [].slice.call(arguments, 1)
  var done = args[args.length - 1]

  var middleware = this.pool[name]
  if (!middleware) {
    return done()
  }

  middleware.run.apply(null, args)
}
