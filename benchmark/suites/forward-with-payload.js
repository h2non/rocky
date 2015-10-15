const rocky = require('../..')
const timeout = 30 * 1000

rocky({ timeout: timeout, proxyTimeout: timeout })
  .forward('http://localhost:9001')
  .listen(9000)
  .post('/*')
