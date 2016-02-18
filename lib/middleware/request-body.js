const rawBody = require('raw-body')
const typer = require('media-typer')
const helpers = require('../helpers')
const encoding = 'utf8'

module.exports = function requestBody (middleware, filter) {
  return function (req, res, next) {
    // Ignore HTTP verbs that does not support bodies
    if (req.method === 'GET' || req.method === 'HEAD') {
      return next()
    }

    // Apply request filter, if defined
    if (filter && !helpers.filterRequest(filter, req)) {
      return next()
    }

    // If body is already present, just continue with it
    if (req.body) {
      return middleware(req, res, setBody)
    }

    const type = req.headers['content-type']
    const length = req.headers['content-length']

    const bodyParams = {
      length: length,
      encoding: getEncoding(type)
    }

    // Read the whole payload
    rawBody(req, bodyParams, getBody)

    function getBody (err, body) {
      if (err) return next(err)
      req.body = req._originalBody = body

      const bodyLength = +(length || Buffer.byteLength(body))
      if (bodyLength) req._originalBodyLength = bodyLength

      // Parse body for convenience
      if (isJSON(type)) parseJSON(req)

      middleware(req, res, setBody)
    }

    function setBody (err, body, enc) {
      if (err) return next(err)

      if (body) {
        // Expose the new body in the request
        req.headers['content-length'] = Buffer.byteLength(body)
        req.body = req._newBody = body
        req._newBodyEncoding = enc || encoding
      }

      next()
    }
  }
}

function parseJSON (req) {
  if (req.json) return
  const body = req.body || ''
  try {
    req.json = JSON.parse(body.toString())
  } catch (e) {
    req.parseError = e
  }
}

function isJSON (type) {
  return /json/i.test(type)
}

function getEncoding (type) {
  if (!type) return encoding

  const parsed = typer.parse(type)
  if (parsed) return parsed.parameters.charset || encoding

  return encoding
}
