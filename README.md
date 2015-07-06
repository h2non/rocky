# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) ![Downloads](https://img.shields.io/npm/dm/rocky.svg)

<img align="right" height="160" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

**Pluggable**, **full featured** and **middleware-oriented** **HTTP/S proxy** with versatile hierarchical **routing** layer, **traffic interceptor and replay** to multiple backends, **built-in balancer**, **hierarchical configuration** and [more](#features). Built for [node.js](http://nodejs.org)/[io.js](https://iojs.org). Compatible with [connect](https://github.com/senchalabs/connect)/[express](http://expressjs.com).

`rocky` can be fluently used [programmatically](#programmatic-api) or via [command-line](#command-line) interface.

To get started, take a look to the [how does it work](#how-does-it-work), [basic usage](#usage), [examples](/examples) and third-party [middleware](#third-party-middleware)

Requires node.js +0.12 or io.js +1.6

- [About](#about)
  - [Features](#features)
  - [When rocky could be useful?](#when-rocky-could-be-useful)
  - [Motivation](#motivation)
  - [Design](#design)
  - [Stability](#stability)
  - [How does it work?](#how-does-it-work)
- [Installation](#installation)
  - [Standalone binaries](#standalone-binaries)
      - [Usage](#usage)
- [Third-party middleware](#third-party-middleware)
- [Command-line](#command-line)
  - [Examples](#examples)
  - [Configuration](#configuration)
  - [Configuration file](#configuration-file)
- [Programmatic API](#programmatic-api)
  - [Usage](#usage)
  - [Documentation](#rocky-options-)
  - [Special thanks](#special-thanks)

## About

### Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Replay traffic to multiple backends
- Able to run as standalone HTTP/S server
- Easily integrable with connect/express via middleware
- Full-featured built-in router with regexp and params matching
- Hierarchial router configuration
- Hierarchial middleware layer (supports multiple hooks)
- Able to capture traffic as interceptor pattern
- Built-in traffic sniffer and transformer for request/response payloads
- Built-in load balancer
- Hierarchical configuration
- Compatible with most of the existing connect/express middleware
- Fluent, elegant and evented programmatic API
- Simple command-line interface with declarative configuration file

### When `rocky` could be useful?

- As HTTP proxy for progressive migrations (e.g: APIs)
- As HTTP traffic interceptor transforming the request/response on-the-fly
- As intermediate HTTP proxy adapter for external services
- Replaying traffic to one or multiple backend
- As standalone reverse HTTP proxy with powerful routing
- As security proxy layer with custom logic
- As extensible HTTP proxy balancer with custom logic per specific route
- As HTTP load balancer with zero-downtime
- As HTTP API proxy gateway
- As SSL terminator proxy
- For A/B testing
- As test intermediate servercd intercepting and generating random/fake responses
- And whatever a programmatic HTTP proxy could be useful to

### Motivation

Migrating systems if not a trivial thing, and it's even more complex if we're talking about production systems that require high availability. Taking care of consistency and public interface contract should be a premise in most cases.

`rocky` was initially created to become an useful tool for assisting during a backend migration strategy. However, it could be useful for many other [scenarios](#when-rocky-is-a-good-choice).

### Design

`rocky` was designed with versatility in mind, with a small core and clean codebase, and very focused on extensibility providing multiple layers of extensibility, such as middleware, which could be considered as well like a kind of hooks in some way.

so it can work as a standalone HTTP proxy or integrated in your existent `node.js` backend, powered by express/connect or a raw http server.

`rocky` will take care of HTTP routing, discerning traffic and forwarding/replaying it accordingly to your desired new backend.

### Stability

rocky is relative young but production focused package.
Version `0.1.x` was wrote during my free time in less than 10 days (mostly at night), and this versio serie could be considered in `beta` stage.

Version `0.2.x` introduces significant improvements, more consistent API and imporant features in the middleware layer. This version is more focused on stability.

### How does it work?

`rocky` could be useful in [multiple scenarios](#when-rocky-could-be-useful), but a representive general purpose and recurrent use case scenario could be the following:

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

- [linux-x64](https://github.com/h2non/rocky/releases/download/0.2.0/rocky-0.2.0-linux-x64.nar)
- [darwin-x64](https://github.com/h2non/rocky/releases/download/0.2.0/rocky-0.2.0-darwin-x64.nar)

Packaged using [nar](https://github.com/h2non/nar)

##### Usage

```
chmod +x rocky-0.2.0-linux-x64.nar
```

```
./rocky-0.2.0-linux-x64.nar exec --port 3000 --config rocky.toml
```

## Third-party middleware

- [**consul**](https://github.com/h2non/rocky-consul) - Dynamic service discovery and balancing using Consul
- [**vhost**](https://github.com/h2non/rocky-vhost) - vhost based routing for rocky
- [**version**](https://github.com/h2non/rocky-version) - HTTP API version based routing (uses [http-version](https://github.com/h2non/http-version))

Note that you can use any other existent middleware plug in `rocky` as part of your connect/express app.

Additionally, `rocky` provides some [built-in middleware](#rockymiddleware) as part of its core that you can plug in for specific needs.

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

Transparent `rocky.toml` file discovery in current and higher directories:
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
- **hostRewrite** `boolean` - rewrites the location hostname on (301/302/307/308) redirects, Default: null.
- **autoRewrite** `boolean` - rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
- **protocolRewrite** `boolean` - rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.
- **forwardOriginalBody** `boolean` - Only valid for **replay** request. Forward the original body instead of the transformed one
- **router** `object` - Specific router params
  - **strict** `boolean` - When `false` trailing slashes are optional (default: `false`)
  - **caseSensitive** `boolean` - When `true` the routing will be case sensitive. (default: `false`)
  - **mergeParams** `boolean` - When `true` any `req.params` passed to the router will be
    merged into the router's `req.params`. (default: `false`)

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

For more usage cases, take a look at the [examples](/examples)

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

#### rocky#useParam(param, ...middleware)
Alias: `param()`

Maps the specified path parameter name to a specialized param-capturing middleware.
The middleware stack is the same as `.use()`

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
Shortcut to `rocky#server.close(cb)`

#### rocky#all(path, [ ...middleware ])
Return: [`Route`](#routepath)

Add a route handler for the given path for all HTTP methods

#### rocky#get(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `GET` method

#### rocky#post(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `POST` method

#### rocky#put(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `PUT` method

#### rocky#delete(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `DELETE` method

#### rocky#patch(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `PATCH` method

#### rocky#head(path, [ ...middleware ])
Return: [`Route`](#routepath)

Configure a new route the given path with `HEAD` method

#### rocky#router

Internal [router](https://github.com/pillarjs/router#routeroptions) instance

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

#### route#balance(urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.

#### route#reply(status, [ headers, body ])

Shortcut method to intercept and reply the incoming request.
If used, `body` param must be a `string` or `buffer`

#### route#toPath(url, [ params ])

Overwrite the request path, defining additional optional params.

#### route#headers(headers)

Define or overwrite request headers

#### route#host(host)

Overwrite the `Host` header value when forward the request

#### route#transformRequestBody(middleware, [ filter ])

**Caution**: using this middleware could generate negative performance side-effects, since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads

This method allow you to intercept and transform the response body recieved from the client before sending it to the target server.

The `middleware` argument must a function accepting the following arguments: `function(req, res, next)`
The `filter` arguments is optional and it can be a `string`, `regexp` or `function(req)` which should return `boolean` if the `request` passes the filter. The default check value by `string` or `regexp` test is the `Content-Type` header.

In the middleware function **must call the `next` function**, which accepts the following arguments: `err, newBody, encoding`
You can see an usage example [here](/examples/interceptor.js).

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
  }, function (req) {
    // Custom filter
    return /application\/json/i.test(req.headers['content-type'])
  })
```

#### route#transformResponseBody(middleware, [ filter ])

**Caution**: using this middleware could generate negative performance side-effects since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads.

This method allow you to intercept and transform the response body received from the target server before sending it to the client.

The `middleware` argument must a function accepting the following arguments: `function(req, res, next)`
The `filter` arguments is optional and it can be a `string`, `regexp` or `function(res)` which should return `boolean` if the `request` passes the filter. The default check value by `string` or `regexp` test is the `Content-Type` header.

In the middleware function **must call the `next` function**, which accepts the following arguments: `err, newBody, encoding`
You can see an usage example [here](/examples/interceptor.js).

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
  }, function (res) {
    // Custom filter
    return /application\/json/i.test(res.getHeader('content-type'))
  })
```

#### route#options(options)

Overwrite default proxy [options](#configuration) for the current route.
You can pass any supported option by [http-proxy](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50)

#### route#use(...middleware)

Add custom middleware to the specific route.

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
- **server:error** `err, req, res` - Fired on server middleware error. Only available if running as standalone HTTP server
- **route:missing** `req, res` - Fired on missing route. Only available if running as standalone HTTP server

For more information about events, see the [events](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) fired by `http-proxy`

#### route#once(event, ...handler)

Subscribes to a specific event for the given route, and unsubscribes after dispatched

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

### rocky.middleware

Expose the built-in middleware [functions](/lib/middleware).

#### rocky.middleware.requestBody(middleware)

#### rocky.middleware.responseBody(middleware)

#### rocky.middleware.toPath(path, [ params ])

#### rocky.middleware.headers(headers)

#### rocky.middleware.host(host)

#### rocky.middleware.reply(status, [ headers, body ])

### rocky.httpProxy

Accessor for the [http-proxy](https://github.com/nodejitsu/node-http-proxy) API

### rocky.VERSION

Current rocky package semver

## Special Thanks

- [http-proxy](https://github.com/nodejitsu/node-http-proxy) package creators and maintainers
- [router](https://github.com/pillarjs/router) package creators and maintainers

## License

MIT - Tomas Aparicio
