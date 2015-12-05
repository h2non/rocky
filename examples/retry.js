const http = require('http')
const rocky = require('..')

const proxy = rocky()

const customRetrytrategies = [
  function invalidCodes (err, res) {
    return !err && [404, 406].indexOf(res.statusCode) !== -1
  }
]

// Enable retry logic: will be applicated for both forward/replay failed requests
proxy
  .retry({
    retries: 3, // or use Infinity
    factor: 2,
    minTimeout: 100,
    maxTimeout: 30 * 1000,
    randomize: true,
    strategies: customRetrytrategies
  })

proxy
  .forward('http://127.0.0.1:9999') // invalid, will retry
  .replay('http://127.0.0.1:9999') // invalid, will retry
  .replay('http://127.0.0.1:3001') // valid

// Subscribe to events
proxy
  .on('proxy:retry', function (err, req, res) {
    console.log('Retry forward request:', err.code)
  })
  .on('replay:retry', function (err, req, res) {
    console.log('Retry replay request:', err.code)
  })

proxy
  .get('/*')

proxy.listen(3000)

http.createServer(function (req, res) {
  setTimeout(function () {
    console.log('Replay server is reached')
    res.writeHead(204)
    res.end()
  }, 1000)
}).listen(3001)

// Test requests
http.get('http://localhost:3000', function (res) {
  console.log('Response from target server:', res.statusCode)
})
