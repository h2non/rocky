# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) ![Downloads](https://img.shields.io/npm/dm/rocky.svg)

<img align="right" height="200" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

**Pluggable**, **full featured** and **middleware-oriented** **HTTP/S proxy** with versatile hierarchical **routing** layer, **traffic interceptor and replay** to multiple backends, **built-in balancer** and [more](#features).
Built for [node.js](http://nodejs.org). Compatible with [connect](https://github.com/senchalabs/connect)/[express](http://expressjs.com).

`rocky` can be fluently used [programmatically](#programmatic-api) or via [command-line](#command-line) interface.

To get started, take a look to the [how does it works](#how-does-it-works), [basic usage](#usage), [examples](/examples) and third-party [middlewares](#third-party-middlewares)

Requires nodejs +0.12 or iojs +1.6

## Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Replay traffic to multiple backends
- Able to run as standalone HTTP/S server
- Integrable with connect/express via middleware
- Full-featured built-in router with regexp and params matching
- Hierarchial router supporting nested configurations
- Built-in middleware layer (like connect/express)
- Able to capture traffic as interceptor pattern
- Built-in support to sniff and transform bodies per request/response
- Built-in balance with a round-robin like scheduler
- Fluent, elegant and evented programmatic API
- Simple command-line interface with declarative configuration file

## When `rocky` is a good choice?

- As HTTP proxy for progressive migrations (e.g: APIs)
- As HTTP traffic interceptor transforming the request/response on-the-fly
- Replaying traffic to one or multiple backends
- As HTTP traffic interceptor, logger and/or adapter
- As standalone reverse HTTP proxy with powerful routing
- As security proxy layer with custom logic
- As extensible HTTP proxy balancer with custom logic per specific route
- As HTTP API proxy gateway
- As SSL terminator proxy
- For A/B testing
- As test intermediate servercd intercepting and generating random/fake responses
- And whatever a programmatic HTTP proxy could be useful to

## Motivation

Migrating systems if not a trivial thing, and it's even more complex if we're talking about production systems with requires high availability. Taking care about consistency and public interface contract should be a premise in most cases.

That's the main reason why `rocky` borns: it was designed to become an useful tool to assist you during a backend migration strategy. You could use it as a frontend proxy server or integrated in your existent `node.js` backend.

`rocky` will take care about HTTP routing discerning the traffic and forwarding/replaying it accordingly to your desired new backend.

You can use it as well for multiple purposes, like A/B testing and more.

## How does it works?

```
         |==============|
         |  Dark World  |
         |==============|
               ||||
         |==============|
         |  HTTP proxy  |
         |--------------|
         | Rocky Router |
         |~~~~~~~~~~~~~~|
         |  Middleware  |
         |==============|
            ||      |
  (duplex) //        \ (one-way)
          //          \
         //            \
   /----------\   /----------\    /----------\
   |  target  |   | replay 1 | -> | replay 2 | (*N)
   \----------/   \----------/    \----------/
```

## Installation

```bash
npm install rocky --save
```

For command-line interface usage, install it as global package:
```bash
npm install -g rocky
```

### Standalone binaries

- [linux-x64](https://github.com/h2non/rocky/releases/download/0.1.10/rocky-0.1.10-linux-x64.nar)
- [darwin-x64](https://github.com/h2non/rocky/releases/download/0.1.10/rocky-0.1.10-darwin-x64.nar)

Packaged using [nar](https://github.com/h2non/nar)

##### Usage

```
chmod +x rocky-0.1.6-linux-x64.nar
```

```
./rocky-0.1.6-linux-x64.nar exec --port 3000 --config rocky.toml
```

## Third-party middlewares

- [**vhost**](https://github.com/h2non/rocky-vhost) - vhost based routing for rocky
- [**version**](https://github.com/h2non/rocky-version) - HTTP API version based routing (uses [http-version](https://github.com/h2non/http-version))

## Command-line

```bash
Start rocky HTTP proxy server
Usage: rocky [options]

Options:
  --help, -h     Show help                                             [boolean]
  --config, -c   File path to TOML config file
  --port, -p     rocky HTTP server port
  --forward, -f  Default forward server URL
  --replay, -r   Define a replay server URL
  --key, -k      Path to SSL key file
  --cert, -e     Path to SSL certificate file
  --secure, -s   Enable SSL certification validation
  --balance, -b  Define server URLs to balance between, separated by commas
  --debug, -d    Enable debug mode                                     [boolean]
  -v, --version  Show version number                                   [boolean]

Examples:
  rocky -c rocky.toml \
  -f http://127.0.0.1:9000 \
  -r http://127.0.0.1
```

#### Examples

Passing the config file:
```
rocky --config rocky.toml --port 8080 --debug
```

Reading config from `stdin`:
```
cat rocky.toml | rocky --port 8080 --debug
```

Transparent `rocky.toml` file discovery in the current and higher directories:
```
rocky --port 8080
```

### Configuration

**Supported params**

- **forward** `string` - Default forward URL
- **debug** `boolean` - Enable debug mode. Default `false`
- **target** `string` - <url string to be parsed with the url module
- **replay** `array<string>` - Optional replay server URLs. Via API you should use the `replay()` method
- **balance** `array<url>` - Define the URLs to balance. Via API you should use the `balance()` method
- **forward** `string` - url string to be parsed with the url module
- **timeout** `number` - Timeout for request socket
- **proxyTimeout** `number` - Timeout for proxy request socket
- **agent** `object` - object to be passed to http(s).request. See node.js [`https`](https://nodejs.org/api/https.html#https_class_https_agent) docs
- **ssl** `object` - object to be passed to https.createServer()
  - **cert** `string` - Path to SSL certificate file
  - **key** `string` - Path to SSL key file
- **ws** `boolean` - true/false, if you want to proxy websockets
- **xfwd** `boolean` - true/false, adds x-forward headers
- **secure** `boolean` - true/false, verify SSL certificate
- **toProxy** `boolean` - true/false, explicitly specify if we are proxying to another proxy
- **prependPath** `boolean` - true/false, Default: true - specify whether you want to prepend the target's path to the proxy path
- **ignorePath** `boolean` - true/false, Default: false - specify whether you want to ignore the proxy path of the incoming request
- **localAddress** `boolean` - <Local interface string to bind for outgoing connections
- **changeOrigin** `boolean` - <true/false, Default: false - **changes** the origin of the host header to the target URL
- **auth** `boolean` - Basic authentication i.e. 'user:password' to compute an Authorization header.
- **forwardHost** `boolean` - Forward target URL host while proxying. Default `false`
- **hostRewrite** `boolean` - rewrites the location hostname on (301/302/307/308) redirects, Default: null.
- **autoRewrite** `boolean` - rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
- **protocolRewrite** `boolean` - rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.
- **forwardOriginalBody** `boolean` - Only valid for **replay** request. Forward the original body instead of the transformed one

### Configuration file

Default configuration file name: `rocky.toml`

The configuration file must be declared in [TOML](https://github.com/toml-lang/toml) language
```toml
port = 8080
forward = "http://google.com"
replay = ["http://duckduckgo.com"]

[ssl]
cert = "server.crt"
key  = "server.key"

[/users/:id]
method = "all"
forward = "http://new.server"

[/oauth]
method = "all"
forward = "http://auth.server"

[/*]
method = "GET"
forward = "http://old.server"

[/download/:file]
method = "GET"
timeout = 5000
balance = ["http://1.file.server", "http://2.file.server"]

[/photo/:name]
method = "GET"
[[replay]]
  target = "http://old.server"
  forwardHost = true
[[replay]]
  target = "http://backup.server"
```

## Programmatic API

### Usage

Example using [Express](http://expressjs.com/)
```js
var rocky = require('rocky')
var express = require('express')

// Set up the express server
var app = express()
// Set up the rocky proxy
var proxy = rocky()

// Default proxy config
proxy
  .forward('http://new.server')
  .replay('http://old.server')
  .replay('http://log.server')
  .options({ forwardHost: true })

// Configure the routes to forward/replay
proxy
  .get('/users/:id')

proxy
  .get('/download/:file')
  .balance(['http://1.file.server', 'http://2.file.server'])

// Plug in the rocky middleware
app.use(proxy.middleware())

// Old route (won't be called since it will be intercepted by rocky)
app.get('/users/:id', function () { /* ... */ })

app.listen(3000)
```

Example using the built-in HTTP server
```js
var rocky = require('rocky')

var proxy = rocky()

// Default proxy config
proxy
  .forward('http://new.server')
  .replay('http://old.server', { forwardOriginalBody: true })
  .options({ forwardHost: true })
  .on('proxy:error', function (err) {
    console.error('Error:', err)
  })
  .on('proxyReq', function (proxyReq, req, res, opts) {
    console.log('Proxy request:', req.url, 'to', opts.target)
  })
  .on('proxyRes', function (proxyRes, req, res) {
    console.log('Proxy response:', req.url, 'with status', res.statusCode)
  })

// Configure the routes to forward/replay
proxy
  .get('/users/:id')
  // Overwrite the path
  .toPath('/profile/:id')
  // Add custom headers
  .headers({
    'Authorization': 'Bearer 0123456789'
  })

proxy
  .get('/search')
  // Overwrite the forward URL for this route
  .forward('http://another.server')
  // Use a custom middleware for validation purposes
  .use(function (req, res, next) {
    if (req.headers['Autorization'] !== 'Bearer 012345678') {
      res.statusCode = 401
      return res.end()
    }
    next()
  })
  // Intercept and transform the response body before sending it to the client
  .transformResponseBody(function (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(res.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Send the new body in the request
    next(null, newBody)
  })

proxy.listen(3000)
```

For more usage case, take a look to the [examples](/examples)

### rocky([ options ])

Creates a new rocky instance with the given options.

You can pass any of the allowed params at [configuration](#configuration) level and any supported [http-proxy options](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50)

#### rocky#forward(url)
Alias: `target`

Define a default target URL to forward the request

#### rocky#replay(url, [ opts ])

Add a server URL to replay the incoming request

`opts` param provide specific replay [options](#configuration), overwritting the parent options.

#### rocky#options(options)

Define/overwrite rocky server [options](#configuration).
You can pass any of the [supported options](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50) by `http-proxy`.

#### rocky#use([ path ], ...middleware)

Use the given middleware function for **all http methods** on the given path, defaulting to the root path.

#### rocky#balance(...urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.

#### rocky#on(event, handler)

Subscribe to a proxy event.
See support events [here](#events)

#### rocky#once(event, handler)

Remove an event by its handler function.
See support events [here](#events)

#### rocky#off(event, handler)

Remove an event by its handler function.
See support events [here](#events)

#### rocky#removeAllListeners(event)

Remove all the subscribers to the given event.
See support events [here](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events)

#### rocky#middleware()
Return: `Function(req, res, next)`

Return a connect/express compatible middleware

#### rocky#requestHandler(req, res, next)

Raw HTTP request/response handler.

#### rocky#listen(port, [ host ])

Starts a HTTP proxy server in the given port

#### rocky#close([ callback ])

Close the HTTP proxy server, if exists.
A shortcut to `rocky.server.close(cb)`

#### rocky#all(path)
Return: [`Route`](#routepath)

Add a route handler for the given path for all HTTP methods

#### rocky#get(path)
Return: [`Route`](#routepath)

Configure a new route the given path with `GET` method

#### rocky#post(path)
Return: [`Route`](#routepath)

Configure a new route the given path with `POST` method

#### rocky#delete(path)
Return: [`Route`](#routepath)

Configure a new route the given path with `DELETE` method

#### rocky#put(path)
Return: [`Route`](#routepath)

Configure a new route the given path with `PUT` method

#### rocky#patch(path)
Return: [`Route`](#routepath)

Configure a new route the given path with `PATCH` method

#### rocky#head(path)
Return: `Route`

Configure a new route the given path with `HEAD` method

#### rocky#proxy

[http-proxy](https://github.com/nodejitsu/node-http-proxy) instance

#### rocky#router

HTTP [router](https://github.com/pillarjs/router#routeroptions) instance

#### rocky#server

[HTTP](https://nodejs.org/api/http.html)/[HTTPS](https://nodejs.org/api/https.html) server instance.
Only present if `listen()` was called starting the built-in server.

### Route(path)

#### route#forward(url)
Alias: `target`

Overwrite forward server for the current route.

#### route#replay(url, [ opts ])

Overwrite replay servers for the current route.

`opts` param provide specific replay [options](#configuration), overwritting the parent options.

#### route#balance(...urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.

#### route#toPath(url, [ params ])

Overwrite the request path, defining additional optional params.

#### route#headers(headers)

Define or overwrite request headers

#### route#host(host)

Overwrite the target hostname (defined as `host` header)

#### route#transformRequestBody(middleware)

**Caution**: using this middleware could generate negative performance side-effects since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads

This allows you to intercept and replace or transform the response body recieved from the client before sending it to the target.

The middleware must a function accepting the following arguments: `function(req, res, next)`
You can see an usage example [here](/examples/interceptor.js).

You **must call the `next` function**, which accepts the following arguments: `err, newBody, encoding`

The body will be exposed as raw `Buffer` or `String` on both properties `body` and `originalBody` in `http.ClientRequest`:
```js
rocky
  .post('/users')
  .transformRequestBody(function (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(req.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Set the new body
    next(null, newBody, 'utf8')
  })
```

#### route#transformResponseBody(middleware)

**Caution**: using this middleware could generate negative performance side-effects since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads

This allows you to intercept and replace or transform the response body received from the target server before sending it to the client.

The middleware must a function accepting the following arguments: `function(req, res, next)`
You can see an usage example [here](/examples/interceptor.js).

The `next` function accepts the following arguments: `err, newBody, encoding`

The body will be exposed as raw `Buffer` or `String` on both properties `body` and `originalBody` in `http.ClientResponse`:
```js
rocky
  .post('/users')
  .transformResponseBody(function (req, res, next) {
    // Get the body buffer and parse it (assuming it's a JSON)
    var body = JSON.parse(res.body.toString())

    // Compose the new body
    var newBody = JSON.stringify({ salutation: 'hello ' + body.hello })

    // Set the new body
    next(null, newBody, 'utf8')
  })
```

#### route#options(options)

Overwrite default proxy [options](#configuration) for the current route.
You can pass any supported option by [http-proxy](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50)

#### route#use(...middlewares)

Add custom middlewares to the specific route.

#### route#on(event, ...handler)

Subscribes to a specific event for the given route.
Useful to incercept the status or modify the options on-the-fly

##### Events

- **proxyReq** `opts, proxyReq, req, res` - Fired when the request forward starts
- **proxyRes** `opts, proxyRes, req, res` - Fired when the target server respond
- **proxy:error** `err, req, res` - Fired when the proxy request fails
- **route:error** `err, req, res` - Fired when cannot forward/replay the request or middleware error
- **replay:start** `params, opts, req` - Fired before a replay request starts
- **replay:error** `opts, err, req, res` - Fired when the replay request fails

For more information about events, see the [events](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) fired by `http-proxy`

#### route#once(event, ...handler)

Subscribes to a specific event for the given route, and unsubscribe after dispatched

#### route#off(event, handler)

Remove an event by its handler function in the current route

### rocky.create(config)

Create a standalone `rocky` server with the given `config` options.
See the [supported config fields](#configuration)

```js
var config = {
  'forward': 'http://google.com',
  '/search': {
    method: 'GET',
    forward: 'http://duckduckgo.com'
    replay: ['http://bing.com', 'http://yahoo.com']
  },
  '/users/:id': {
    method: 'all'
  },
  '/*': {
    method: 'all',
    forward: 'http://bing.com'
  }
}

rocky.create(config)
```

### rocky.middlewares

Expose multiple middleware [functions](/lib/middlewares.js) to plugin in different level of your proxy.

### rocky.httpProxy

Accessor for the [http-proxy](https://github.com/nodejitsu/node-http-proxy) API

### rocky.VERSION

Current rocky package semver

## License

MIT - Tomas Aparicio
