const rocky = require('../..')

rocky()
  .forward('http://localhost:9001')
  .replay('http://localhost:9002')
  .replay('http://localhost:9003')
  .listen(9000)
  .all('/*')
