var _ = require('lodash')
var rocky = require('..')
var reservedKeys = ['forward', 'replay', 'target']

module.exports = function (config) {
  config = config || {}
  var proxy = rocky(config)

  var forward = config.forward
  if (forward) {
    proxy.forward(forward)
  }

  var replays = config.replay
  addReplayServers(proxy, replays)

  var routes = Object.keys(config)
  .filter(function (key) {
    return !~reservedKeys.indexOf(key)
      && _.isPlainObject(config[key])
  })
  .forEach(function (key) {
    var route = config[key]
    var method = (route.method || 'all').toLowerCase()
    var router = proxy.route(key, method)

    if (route.forward) {
      router.forward(route.forward)
    }

    var replays = route.replay
    addReplayServers(router, replays)
  })

  proxy.listen(+config.port || 3000)
}

function addReplayServers(proxy, replays) {
  if (typeof replays === 'string') {
    replays = [ replays ]
  }
  if (Array.isArray(replays)) {
    replays.forEach(function (url) {
      proxy.replay(url)
    })
  }
}
