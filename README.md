# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) [![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com) [![jsdoc-reference](https://img.shields.io/badge/jsdoc-reference-blue.svg)](http://jsdocs.herokuapp.com/github.com/h2non/rocky)

<img align="right" height="160" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

A multipurpose, **full-featured**, **middleware-oriented** and **hackable** **HTTP/S** and **WebSocket proxy** with powerful built-in features such as **versatile routing layer**, **traffic interceptor and replay** to multiple backends, built-in **balancer**, traffic **retry/backoff** logic, **hierarchical configuration**, among [others](#features).
Built for [node.js](http://nodejs.org)/[io.js](https://iojs.org).

**rocky** can be fluently used [programmatically](#programmatic-api) or via [command-line](#command-line) interface.
It's framework agnostic, but you can optionally plug in with [connect](https://github.com/senchalabs/connect)/[express](http://expressjs.com) apps.

To get started, take a look to [how does it work](#how-does-it-work), [basic usage](#usage), [middleware layer](#middleware-layer) and [examples](/examples).

**Note**: `retry` feature is temporary not supported in latest `node.js` versions.

## Contents

- [Features](#features)
- [When rocky can be useful?](#when-rocky-can-be-useful)
- [Installation](#installation)
- [Benchmark](#benchmark)
- [About](#about)
  - [Versions](#versions)
  - [How does it work?](#how-does-it-work)
  - [Projects using rocky](#projects-using-rocky)
- [Middleware layer](#middleware-layer)
  - [Hierarchies](#hierarchies)
  - [Types of middleware](#types-of-middleware)
  - [Middleware flow](#middleware-flow)
  - [Middleware API](#middleware-api)
  - [Third-party middleware](#third-party-middleware)
- [Command-line](#command-line)
  - [Installation](#installation-1)
  - [Usage](#usage)
  - [Examples](#examples)
  - [Configuration file](#configuration-file)
- [Programmatic API](#programmatic-api)
  - [Usage](#usage)
  - [Configuration](#configuration)
  - [Documentation](#rocky-options-)
  - [Supported events](#events)
- [Special thanks](#special-thanks)

## Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Supports WebSocket protocol proxy (replay not supported yet)
- Able to replay traffic to multiple backends (concurrently or sequentially)
- Able to intercept HTTP requests and responses and modify them on-the-fly
- Featured built-in path based router with params matching
- Built-in load balancer
- Built-in HTTP traffic retry/backoff
- Nested configuration per global/route scopes and forward/replay phases
- Hierarchial middleware layer supporting different HTTP traffic flow phases
- Easily integrable with connect/express via middleware
- Able to run as standalone HTTP/S server (no connect/express, uses `http` module)
- Compatible with most of the existent connect/express middleware
- Powerful programmatic control supporting dynamic configurations and zero-downtime
- Supports both concurrent and sequential HTTP traffic flow modes
- Small hackable core designed for extensibility
- Fluent, elegant and evented [programmatic API](#programmatic-api)
- Provides a [command-line interface](https://github.com/h2non/rocky-cli) with declarative [configuration file](#configuration-file)
- Handles properly `gzip` responses, especially when intercepting payloads

## When `rocky` can be useful?

- As intermediate proxy for service migrations (e.g: APIs)
- Replaying traffic to one or multiple backends
- As reverse proxy to forward traffic to one o multiple servers.
- As Man-in-the-Middle proxy interceptoring and transforming the request/response on-the-fly
- As intermediate HTTP proxy adapter for external services integrations
- As HTTP [API gateway](http://microservices.io/patterns/apigateway.html)
- As standard reverse HTTP proxy with dynamic routing
- As security proxy layer
- As dynamic HTTP load balancer with programmatic control
- As embedded HTTP proxy in your node.js app
- As HTTP cache or log server
- As SSL terminator proxy
- As HTTP proxy for performance testing
- As traditional forward HTTP proxy (e.g: Squid)
- For HTTP session manipulation and debugging
- For HTTP traffic recording and inspection
- For A/B testing
- For fuzz testing (see [toxy](https://github.com/h2non/toxy))
- As intermediate test server intercepting and generating random/fake responses
- And whatever a programmatic HTTP proxy can be useful to

## Installation

```bash
npm install rocky --save
```

## Benchmark

See [benchmark/README.md](https://github.com/h2non/rocky/tree/master/benchmark#results) for detailed benchmark results.

## About

### Versions

- [**0.1.x**](https://github.com/h2non/rocky/tree/v0.1.x) - First version. Initially released at `25.06.2015`. Beta
- [**0.2.x**](https://github.com/h2non/rocky/tree/v0.2.x) - Released at `07.07.2015`. Major features and stability improvements.
- [**0.3.x**](https://github.com/h2non/rocky/tree/v0.3.x) - Released at `24.07.2015`. Production-focused version.
- [**0.4.x**](https://github.com/h2non/rocky/tree/master) - Released at `02.10.2015`. Introduces WebSocket support and other minor features. Stable & actively maintained. Recommended version.

### How does it work?

```
         |==============|
         | HTTP clients |
         |==============|
               ||||
         |==============|
         |  HTTP proxy  |   ->  Via the built-in HTTP server or via connect/express
         |~~~~~~~~~~~~~~|
         | Rocky Router |   ->  The built-in featured router matches the proper route
         |~~~~~~~~~~~~~~|
         |  Middleware  |   ->  Dispatch the hierarchical middleware layer
         |==============|
            ||      |
  (duplex) //        \ (one-way)
         //            \
   /----------\   /----------\    /----------\
   |  target  |   | replay 1 | -> | replay 2 | (*N)
   \----------/   \----------/    \----------/
```

### Projects using rocky

- [toxy](https://github.com/h2non/toxy) - Hackable HTTP proxy to simulate server failures and network conditions.
- [balboa](https://github.com/h2non/balboa) - Simple, hackable HTTP forward proxy.

Open an issue or send a PR to add your project!

## Middleware layer

One of the most powerful features in `rocky` is its build-in domain specific middleware, based on `connect/express` middleware.

The middleware layer provides a simple and consistent way to augment the proxy functionality very easily, allowing you to attach third-party middleware (also known as plugins) to cover specific tasks which acts between different phases of the proxy, for instance handling incoming/outgoing traffic.

`rocky` middleware layer has the same interface as connect/express middleware, and it's mostly compatible with existent middleware (see [express](https://github.com/h2non/rocky/blob/master/examples/express.js) example).

### Hierarchies

`rocky` supports multiple middleware hierarchies:

- **global** - Dispached on every incoming request matched by the router
- **route** - Dispached only at route scope

### Types of middleware

`rocky` introduces multiple types of middleware layers based on the same interface and behavior of connect/express middleware.
This was introduced in order to achieve in a more responsive way multiple traffic flows in the specific scope
and behavior nature of a programmatic HTTP proxy with traffic replay.

Those flows are intrinsicly correlated but might be handled in a completely different way.
The goal is to allowing you to handle them accordingly, acting in the middle of those phases to augment some functionality or react to some event with better accuracy.

**Supported types of middleware**:

##### router

- **Scope**: `global`
- **Description**: Dispatched on every matched route.
- **Notation**: `.use([path], function (req, res, next))`

##### forward

- **Scope**: `global`, `route`
- **Description**: Dispached before forwarding an incoming request.
- **Notation**: `.useForward(function (req, res, next))`

##### replay

- **Scope**: `global`, `route`
- **Description**: Dispached before starting each replay request.
- **Notation**: `.useReplay(function (req, res, next))`

##### response

- **Scope**: `global`, `route`
- **Description**: Dispached on server response. Only applicable in `forward` traffic.
- **Notation**: `.useResponse(function (req, res, next))`

##### param

- **Scope**: `global`
- **Description**: Dispached on every matched param on any route.
- **Notation**: `.useParam(function (req, res, next))`

### Middleware flow

Middleware functions are always executed in FIFO order.
The following diagram represents the internal incoming request flow and how the different middleware layers are involved on it:

```
↓    ( Incoming request )   ↓
↓            |||            ↓
↓      ----------------     ↓
↓      |    Router    |     ↓ --> Match a route, dispatching its middleware if required
↓      ----------------     ↓
↓            |||            ↓
↓   ---------------------   ↓
↓   | Global middleware |   ↓ --> Dispatch on every incoming request (router, param)
↓   ---------------------   ↓
↓            |||            ↓
↓           /   \           ↓
↓         /       \         ↓
↓       /           \       ↓
↓ [ Forward ]    [ Replay ] ↓ --> Dispatch both middleware in separated flows (route forward and replay)
↓      \             /      ↓
↓       \           /       ↓
↓        \         /        ↓
↓    -------------------    ↓
↓    | HTTP dispatcher |    ↓ --> Send requests over the network (concurrently or sequentially)
↓    -------------------    ↓
```

### Middleware API

Middleware layer behavies and has the same interface as connect/express.
In other words, you can create or use middleware as you already know with the typical notation `function(req, res, next)`

As a kind of inversion of control, `rocky` exposes a tiny API in every `http.ClientRequest` passed via the middleware layer:

##### Request

- **req.rocky** `object`
  - **.options** `object` - Exposes the [configuration](#configuration) options for the current request.
  - **.proxy** `Rocky` - Exposes the rocky instance. Use only for hacking purposes!
  - **.route** `Route` - Exposes the current running route. Only available in `route` type middleware
- **req.stopReplay** `boolean` - Optional field internally checked by `rocky` to stop the request replay process.

##### Response

- **res.rocky** `object`
  - **.options** `object` - Exposes the [configuration](#configuration) options for the current request.
  - **.proxy** `Rocky` - Exposes the rocky instance. Use only for hacking purposes!
  - **.route** `Route` - Exposes the current running route. Only available in `route` type middleware

Example replacing the target server URL:
```js
rocky()
  .get('/users/:name')
  .forward('http://old.server.net')
  .use(function (req, res, next) {
    if (req.params.name === 'admin') {
      // Overwrite the target URL only for this user
      req.rocky.options.target = 'http://new.server.net'
    }
    next()
  })
```

### Third-party middleware

- [**consul**](https://github.com/h2non/rocky-consul) - Dynamic service discovery and balancing using Consul
- [**vhost**](https://github.com/h2non/rocky-vhost) - vhost based proxy routing for rocky
- [**version**](https://github.com/h2non/rocky-version) - HTTP API version based routing (uses [http-version](https://github.com/h2non/http-version))

Note that you can use any other existent middleware plug in `rocky` as part of your connect/express app.

Additionally, `rocky` provides some [built-in middleware functions](#rockymiddleware-1) that you can plug in different types of middleware.

## Command-line

### Installation

For command-line usage, you must install [`rocky-cli`](https://github.com/h2non/rocky-cli)
```
npm install -g rocky-cli
```

### Usage

```bash
Start rocky HTTP proxy server
Usage: rocky [options]

Options:
  --help, -h     Show help                                             [boolean]
  --config, -c   File path to TOML config file
  --port, -p     rocky HTTP server port
  --forward, -f  Default forward server URL
  --replay, -r   Define a replay server URL
  --route, -t    Define one or multiple routes, separated by commas
  --key, -k      Path to SSL key file
  --cert, -e     Path to SSL certificate file
  --secure, -s   Enable SSL certification validation
  --balance, -b  Define server URLs to balance between, separated by commas
  --mute, -m     Disable HTTP traffic log in stdout                    [boolean]
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
rocky --config rocky.toml --port 8080
```

Reading config from `stdin`:
```
cat rocky.toml | rocky --port 8080
```

Transparent `rocky.toml` file discovery in current and higher directories:
```
rocky --port 8080
```

Alternatively `rocky` can find the config file passing the `ROCKY_CONFIG` environment variable:
```
ROCKY_CONFIG=path/to/rocky.toml rocky --port 8080
```

Or for simple configurations you can setup a proxy without a config file, defining the routes via flag:
```
rocky --port --forward http://server --route "/download/*, /images/*, /*"
```

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

["/users/:id"]
method = "all"
forward = "http://new.server"

["/oauth"]
method = "all"
forward = "http://auth.server"

["/*"]
method = "GET"
forward = "http://old.server"

["/download/:file"]
method = "GET"
timeout = 5000
balance = ["http://1.file.server", "http://2.file.server"]

["/photo/:name"]
method = "GET"
replayAfterForward = true
[[replay]]
  target = "http://old.server"
  forwardHost = true
[[replay]]
  target = "http://backup.server"
```

## Programmatic API

### Usage

Example using [Express](http://expressjs.com)
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
  .replay('http://old.server', { replayOriginalBody: true })
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
  .toPath('/profile/:id', { id: '0123' })
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

For more usage cases, take a look to the [examples](/examples)

### Configuration

**Supported configuration params**:

- **forward** `string` - Default forward URL
- **debug** `boolean` - Enable debug mode. Default `false`
- **target** `string` - <url string to be parsed with the url module
- **replay** `array<string|object>` - Optional replay server URLs. You can use the `replay()` method to configure it
- **ws** `boolean` - Enable WebSocket proxy mode.
- **balance** `array<url>` - Define the URLs to balance. Via API you should use the `balance()` method
- **timeout** `number` - Timeout for request socket
- **proxyTimeout** `number` - Timeout for proxy request socket
- **retry** `object` - Enable retry/backoff logic for forward/replay traffic. See [allowed params](https://github.com/tim-kos/node-retry#retrytimeoutsoptions). Default: `null`
- **replayRetry** `object` - Enable retry logic for replay traffic with custom options. Default: `null`
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
- **auth** `string` - Basic authentication i.e. 'user:password' to compute an Authorization header.
- **hostRewrite** `string` - rewrites the location hostname on (301/302/307/308) redirects, Default: null.
- **autoRewrite** `boolean` - rewrites the location host/port on (301/302/307/308) redirects based on requested host/port. Default: false.
- **protocolRewrite** `string` - rewrites the location protocol on (301/302/307/308) redirects to 'http' or 'https'. Default: null.
- **forwardOriginalBody** `boolean` - Only valid for **forward** request. Forward the original body instead of the transformed one.
- **replayOriginalBody** `boolean` - Only valid for **replay** request. Forward the original body instead of the transformed one.
- **router** `object` - Specific router params
  - **strict** `boolean` - When `false` trailing slashes are optional (default: `false`)
  - **caseSensitive** `boolean` - When `true` the routing will be case sensitive. (default: `false`)
  - **mergeParams** `boolean` - When `true` any `req.params` passed to the router will be
    merged into the router's `req.params`. (default: `false`)

### rocky([ options ])

Creates a new rocky instance with the given options.

You can pass any of the allowed params at [configuration](#configuration) level and any supported [http-proxy options](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50)

#### rocky#forward(url)
Aliases: `target`, `forwardTo`

Define a default target URL to forward the request

#### rocky#replay(url, [ opts ])
Alias: `replayTo`

Add a server URL to replay the incoming request

`opts` param provide specific replay [options](#configuration), overwritting the parent options.

Note: replay feature is only valid for HTTP traffic.

#### rocky#options(options)

Define/overwrite rocky server [options](#configuration).
You can pass any of the [supported options](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50) by `http-proxy`.

#### rocky#protocol(name)

Define the proxy protocol operation mode.
Supported options are: `http`, `ws`

#### rocky#use([ path ], ...middleware)
Alias: `useIncoming`

Use the given middleware to handle **all http methods** on the given path, defaulting to the root path.

#### rocky#useParam(param, ...middleware)
Alias: `param()`

Maps the specified path parameter name to a specialized param-capturing middleware.
The middleware stack is the same as `.use()`.

Note: this middleware is only valid for HTTP traffic.

#### rocky#useReplay(...middleware)

Use a middleware for all the incoming traffic in the HTTP replay phase.
This middleware stack can be useful to differ between forward/replay traffic, applying separated flows of middleware.

Note: this middleware is only valid for HTTP traffic.

#### rocky#useForward(...middleware)

Use a middleware for all the incoming traffic only for the HTTP request forward phase.

For most cases you will only use `.use()`, but for particular modifications only for the forwarded traffic, this middleware can be useful.

Note: this middleware is only valid for HTTP traffic.

#### rocky#useResponse(...middleware)
Alias: `useOutgoing`

Use a middleware for the outgoing response traffic of the forwarded request.

This middleware stack is useful to handle intercept and modify server responses before sending it to the end client in the other side of the proxy.

Note: this middleware is only valid for HTTP traffic.

#### rocky#useWs(...middleware)

Use a WebSocket specific middleware. Middleware chain will be executed on every incoming WebSocket connection.

#### rocky#useFor(name, ...middleware)

Use a custom middleware for a specific phase. Supported phase names are: `forward`, 'replay'.

This method is used internally, however it's also public since it could be useful
for dynamic middleware configurations instead of using the shortcut methods such as: `useReplay` or `useForward`.

#### rocky#balance(...urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.

#### rocky#stopReplay()

Disable replay logic.

#### rocky#retry([ opts, filter ])

Enable and define a custom retry logic as global configuration.
See [`Route#retry`](#routeretry-opts-filter-) for details.

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

#### rocky#route(method, path, [ ...middleware ])
Return: [`Route`](#routepath)

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

#### rocky#routeAll()
Return: [`Route`](#routepath)

Route all the incoming traffic to the default target.
This is a shortcut to `rocky#all('/*')`.

**Note**: you must call this method only when you already defined other routes.

#### rocky#query([ params | parseFn ])

Parse and expose the query params in `http.IncomingMessage` object via `req.query = Object`.

Additionally you can pass an `object` with additional params to add or a middleware `function(req, res, next)` to work in details with query params.

#### rocky#headers(headers)

Add/extend custom headers to the incoming request before forward/replay it.

#### rocky#timeout(miliseconds)

Define a custom timeout for forward/replay traffic in miliseconds.

#### rocky#router

Internal [router](https://github.com/pillarjs/router#routeroptions) instance

#### rocky#server

[HTTP](https://nodejs.org/api/http.html)/[HTTPS](https://nodejs.org/api/https.html) server instance.
Only present if `listen()` was called starting the built-in server.

#### rocky#mw = MiddlewarePool

Exposes the [MiddlewarePool](#rockymiddlewarepool) instance.

### Route(path)

#### route#forward(url)
Aliases: `target`, `forwardTo`

Overwrite forward server for the current route.

#### route#replay(url, [ opts ])
Alias: `replyTo`

Overwrite replay servers for the current route.

`opts` param provide specific replay [options](#configuration), overwritting the parent options.

Note: replay feature is only valid for HTTP traffic.

#### route#balance(urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.
`urls` param must be an array of strings.

#### route#stopReplay()

Disable replay logic for the current route.

#### route#reply(status, [ headers, body ])

Shortcut method to intercept and reply the incoming request.
If used, `body` param must be a `string` or `buffer`

#### route#unregister()

Unregister the current route.
If the route if matched by the router, it will be ignored, continuing to the next route in the stack.

#### route#timeout(miliseconds)

Define a custom timeout for forward/replay traffic in miliseconds.

#### route#toPath(url, [ params ])

Overwrite the request path, defining additional optional params.

#### route#headers(headers)

Define or overwrite request headers for the current route.

#### route#query([ params | parseFn ])

Parse and expose the query params in `http.IncomingMessage` object via `req.query = Object`.

Additionally you can pass an `object` with additional params to add or a middleware `function(req, res, next)` to work in details with query params.

#### route#host(host)

Overwrite the `Host` header value when forward the request.

#### route#redirect(url)

Redirect the incoming request for the current route.

#### route#replayAfterForward([ filter ])
Alias: `sequential`

Dispatch the replay phase after the forward request ends (either with success or fail status).

Note: this will buffer all the body data. Avoid using it with large payloads

#### route#replaySequentially([ filter ])

Enable sequential replay process executed in FIFO order: if some replay request fails, the queue is empty and the process will stop

Note: this will buffer all the body data. Avoid using it with large payloads

#### route#retry([ opts, filter ])

Enable retry logic for forward traffic. See allowed options [here](https://github.com/tim-kos/node-retry#retrytimeoutsoptions).
You can also define additional retry validations passing an array of function via `strategies` field in `opts` object argument.

Note: enabling retry logic will forces buffering all the body payload. Be careful when using it with large payloads

```js
var customRetryStrategies = [
  function invalidCodes(err, res) {
    return !err && [404, 406].indexOf(res.statusCode) !== -1
  }
]

rocky()
  .get('/download/:id')
  .retry({
    retries: 3,
    factor: 2,
    minTimeout: 100,
    maxTimeout: 30 * 1000,
    randomize: true,
    strategies: customRetryStrategies
  })

rocky.forward('http://inconsistent-server')
```

#### route#bufferBody([ filter ])
Alias: `interceptBody`

Intercept and cache in a buffer the request payload data.
Body will be exposed in `req.body`.

Note: use it only for small payloads, since the whole body will be buffered in memory

#### route#transformRequest(middleware, [ filter ])
Alias: `transformRequestBody()`

This method implements a non-instrusive native `http.IncommingMessage` stream wrapper that allow you to intercept and transform the request body received from the client before sending it to the target server.

The `middleware` argument must a function which accepts the following arguments: `function(req, res, next)`
The `filter` arguments is optional and it can be a `string`, `regexp` or `function(req)` which should return `boolean` if the `request` passes the filter. The default check value by `string` or `regexp` test is the `Content-Type` header.

In the middleware function **must call the `next` function**, which accepts the following arguments: `err, newBody, encoding`
You can see an usage example [here](/examples/interceptor.js).

**Caution**: using this middleware could generate in some scenarios negative performance side-effects, since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads.

The body will be exposed as raw `Buffer` or `String` on both properties `body` and `originalBody` in `http.ClientRequest`:
```js
rocky
  .post('/users')
  .transformRequest(function (req, res, next) {
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

#### route#transformResponse(middleware, [ filter ])
Alias: `transformResponseBody()`

This method implements a non-instrusive native `http.RequestResponse` stream wrapper that allow you to intercept and transform the response body received from the target server before sending it to the client.

The `middleware` argument must a function which accepts the following arguments: `function(req, res, next)`
The `filter` arguments is optional and it can be a `string`, `regexp` or `function(res)` which should return `boolean` if the `request` passes the filter. The default check value by `string` or `regexp` test is the `Content-Type` header.

In the middleware function **must call the `next` function**, which accepts the following arguments: `err, newBody, encoding`
You can see an usage example [here](/examples/interceptor.js).

**Caution**: using this middleware could generate in some scenarios negative performance side-effects since the whole payload data will be buffered in the heap until it's finished. Don't use it if you need to handle large payloads.

The body will be exposed as raw `Buffer` or `String` on both properties `body` and `originalBody` in `http.ClientResponse`:
```js
rocky
  .post('/users')
  .transformResponse(function (req, res, next) {
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
Alias: `useIncoming`

Use a middleware for the incoming traffic for the current route for both replay/forward phases.

#### route#useReplay(...middleware)

Use a middleware for current route incoming traffic in the HTTP replay phase.
This middleware stack can be useful to differ between forward/replay traffic, applying separated flows of middleware.

#### route#useForward(...middleware)

Use a middleware for current route incoming traffic only for the HTTP request forward phase.
For most cases you will only use `.use()`, but for particular modifications only for the forwarded traffic, this middleware can be useful.

#### route#useFor(name, ...middleware)

This method is used internally, however it's also public since it could be useful
for dynamic middleware configurations instead of using the shortcut methods such as: `useReplay` or `useForward`.

#### route#on(event, ...handler)

Subscribes to a specific event for the given route.
Useful to incercept the status or modify the options on-the-fly

##### Events

- **proxyReq** `opts, proxyReq, req, res` - Fired when the request forward starts
- **proxyRes** `opts, proxyRes, req, res` - Fired when the target server respond
- **proxy:response** `req, res` - Fired when the proxy receives the response from the server
- **proxy:error** `err, req, res` - Fired when the proxy request fails
- **proxy:retry** `err, req, res` - Fired before perform a retry request attempt
- **replay:start** `params, opts, req` - Fired before a replay request starts
- **replay:error** `opts, err, req, res` - Fired when a replay request fails
- **replay:end** `params, opts, req` - Fired when a replay request ends
- **replay:stop** `params, opts, req` - Fired when a replay request process is stopped
- **replay:retry** `err, req, res` - Fired before perform a retry request attempt for replay traffic
- **server:error** `err, req, res` - Fired on server middleware error. Only available if running as standalone HTTP server
- **route:missing** `req, res` - Fired on missing route. Only available if running as standalone HTTP server

For more information about events, see the [events](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events) fired by `http-proxy`

#### route#once(event, ...handler)

Subscribes to a specific event for the given route, and unsubscribes after dispatched

#### route#off(event, handler)

Remove an event by its handler function in the current route

#### route#mw = MiddlewarePool

Exposes the [MiddlewarePool](#rockymiddlewarepool) instance used for the route scope.

### rocky.middleware

Expose the built-in internal middleware [functions](/lib/middleware).

You can reuse them as standard middleware in diferent ways, like this:
```js
rocky()
  .all('/*')
  .use(rocky.middleware.headers({
    'Authorization': 'Bearer 0123456789'
  }))
  .useReplay(rocky.middleware.host('replay.server.net'))
```

#### rocky.middleware.requestBody(middleware)

Intercept and optionally transform/replace the request body before forward it to the target server.

See [rocky#transformRequestBody](#routetransformrequestmiddleware--filter-) for more details.

#### rocky.middleware.responseBody(middleware)

Intercept and optionally transform/replace the response body from the server before send it to the client.

See [rocky#transformResponseBody](#routetransformresponsemiddleware--filter-) for more details.

#### rocky.middleware.toPath(path, [ params ])

Overrites the request URL path of the incoming request before forward/replay it.

#### rocky.middleware.headers(headers)

Add/extend custom headers to the incoming request before forward/replay it.

#### rocky.middleware.query([ query | parserFn ])

Add/extend custom query string params to the incoming request.

#### rocky.middleware.host(host)

Overwrite the `Host` header before forwarding/replaying the request. Useful for some scenarios (e.g Heroku).

#### rocky.middleware.reply(status, [ headers, body ])

Shortcut method to reply the intercepted request from the middleware, with optional `headers` and `body` data.

#### rocky.middleware.redirect(url)

Shortcut method to redirect the current request.

### rocky.Route

Accessor for the [Route](https://github.com/h2non/rocky/blob/master/lib/route.js) module

### rocky.Base

Accessor for the [Base](https://github.com/h2non/rocky/blob/master/lib/base.js) module

### rocky.protocols

Expose protocol-specific [modules](https://github.com/h2non/rocky/tree/master/lib/protocols).

### rocky.httpProxy

Accessor for the [http-proxy](https://github.com/nodejitsu/node-http-proxy) API

### rocky.MiddlewarePool

Middleware pool abstraction layer used internally by `rocky`.
See the [midware-pool](https://github.com/h2non/midware-pool) package for details.

### rocky.VERSION

Current rocky package semver

## Special Thanks

- [http-proxy](https://github.com/nodejitsu/node-http-proxy) package creators and maintainers
- [router](https://github.com/pillarjs/router) package creators and maintainers

## License

MIT - Tomas Aparicio

[![views](https://sourcegraph.com/api/repos/github.com/h2non/rocky/.counters/views.svg)](https://sourcegraph.com/github.com/h2non/rocky)
