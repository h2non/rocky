
v0.4.15 / 2017-09-21
====================

  * fix(#113): explicitly define response status code in response middleware

v0.4.14 / 2017-09-10
====================

  * feat(version): bump version
  * fix(response): fix response middleware

v0.4.13 / 2017-02-21
====================

  * fix body-parser middleware stream issue
  * chore(travis): disable node.js stable version
  * refactor(travis): update node versions
  * fix(docs): add missing route API method
  * feat(docs): add node.js +6 note

## 0.4.11 / 18-02-2016

- fix(resposne): buffer response write chunks
- fix(response): calculate proper byte length in intercepted payloads
- feat(middleware): pre parse JSON request/response payload for convenience
