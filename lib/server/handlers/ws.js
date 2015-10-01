const ws = require('../../protocols/ws')

module.exports = function wsHandler(rocky) {
  var dispatcher = new ws.dispatcher(rocky)

  return function (req, socket, head) {
    dispatcher.dispatch(req, socket, head, finalHandler)

    function finalHandler(err) {
      if (err) {
        rocky.emit('ws:error', err, req, socket, head)
      }
    }
  }
}
