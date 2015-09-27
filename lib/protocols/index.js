module.exports = {
  http: {
    dispatcher: require('./http/dispatcher'),
    passthrough: require('./http/passthrough'),
    routeHandler: require('./http/route-handler')
  },
  ws: {
    dispatcher: require('./ws/dispatcher'),
    passthrough: require('./ws/passthrough')
  }
}
