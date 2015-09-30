const fs = require('fs')
const http = require('http')
const connect = require('connect')
const sinon = require('sinon')
const supertest = require('supertest')
const request = require('request')
const expect = require('chai').expect
const rocky = require('..')

const ports = { target: 9890, proxy: 9891, replay: 9892 }
const baseUrl = 'http://127.0.0.1'
const proxyUrl = baseUrl + ':' + ports.proxy
const targetUrl = baseUrl + ':' + ports.target
const replayUrl = baseUrl + ':' + ports.replay
const noop = function () {}

suite('websocket', function () {
  // to do
})
