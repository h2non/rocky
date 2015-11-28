const Dispatcher = require('../../protocols/ws').dispatcher

module.exports = function wsHandler (rocky) {
  const dispatcher = new Dispatcher(rocky)
  return function (req, socket, head) {
    dispatcher.dispatch(req, socket, head, function (err) {
      if (err) rocky.emit('ws:error', err, req, socket, head)
    })
  }
}
