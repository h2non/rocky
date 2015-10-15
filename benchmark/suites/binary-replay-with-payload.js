const rocky = require('../..')
const timeout = 60 * 1000

rocky({ timeout: timeout, proxyTimeout: timeout })
  .forward('http://localhost:9001')
  .replay('http://localhost:9002')
  .replay('http://localhost:9003')
  .listen(9000)
  .post('/*')
