# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) ![Downloads](https://img.shields.io/npm/dm/rocky.svg)

<img align="right" height="180" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

**Pluggable** and **middleware-oriented** **reverse HTTP/s proxy** providing a powerful **routing** layer and features such as **traffic interceptor and replay to multiple backends, built-in balancer** and [more](#features).
Built for [node.js](http://nodejs.org). Compatible with connect/express.

It was originally designed as strategic utility for a progressive HTTP service migration, however it could be a good choice for [more purposes](#when-rocky-is-a-good-choice). It can be used [programmatically](#programmatic-api) or via [command-line](#command-line) interface.

For getting started, take a look to the [explanation](#how-does-it-works), [basic usage](#usage) and [examples](/examples)

**Still beta**

## Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Able to replay traffic to multiple backends
- Able to run as standalone HTTP/S server
- Integrable with connect/express via middleware
- Full-featured built-in router with regexp and params matching
- Forward and replay at route level with nested configuration
- Built-in middleware layer (mostly compatible with connect/express)
- Request transformer/adapter on-the-fly
- Traffic interceptor via middleware and events
- Built-in balance with a round-robin like scheduler
- Fluent, elegant and evented programmatic API
- Simple command-line interface with declarative configuration file

## When `rocky` is a good choice?

- For progressive HTTP services migrations, such APIs
- As HTTP traffic interceptor transforming the request/response on-the-fly
- Replaying traffic to one or multiple backends
- As HTTP traffic interceptor and adapter
- As standalone reverse HTTP proxy with custom routing
- As security proxy layer with custom logic
- As extensible HTTP proxy balancer with custom logic per route
- As SSL terminator proxy
- For A/B testing
- As test HTTP server intercepting and generating random/fake responses
- And whatever a programmatic HTTP proxy can be useful to

## Rationale

Migrating systems if not a trivial thing, and it's even more complex if we're talking about production systems with requires high availability. Taking care about consistency and public interface contract should be a premise in most cases.

That's the main reason why `rocky` borns: it was designed to become an useful tool to assist you during a backend migration strategy. You could use it as a frontend proxy server or integrated in your existent `node.js` backend.

`rocky` will take care about HTTP routing discerning the traffic and forwarding/replaying it accordingly to your desired new backend.

You can use it as well for testing/maintance proposals, for instance replaying your traffic from one enviroment to another ones.

## How does it works?

```
         |==============|
         | The Internet |
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

## Command-line

```bash
Start rocky HTTP proxy server
Usage: rocky [options]

Options:
  --help, -h     Show help                                     [boolean]
  --config, -c   File path to TOML config file                 [required]
  --port, -p     rocky HTTP server port
  --forward, -f  Default forward server URL
  --replay, -r   Define a replay server URL
  --key, -k      Path to SSL key file
  --cert, -e     Path to SSL certificate file
  --secure, -s   Enable SSL certification validation
  --debug, -d    Enable debug mode                             [boolean]
  -v, --version  Show version number                           [boolean]

Examples:
  rocky -c rocky.toml \
  -f http://127.0.0.1:9000 \
  -r http://127.0.0.1
```

#### Examples

```
rocky --config rocky.toml --port 8080 --debug
```

### Configuration

**Supported params**

- Default params (top level)
  - **forward** `string` - Default forward URL
  - **replay** `array<string>` - Optional replay server URLs
  - **debug** `boolean` - Enable debug mode. Default `false`
  - **secure** `boolen` - Enable SSL certificate validation. Default to `false`
  - **port** `number` - TCP port to listen. Default to `3000`
  - **xfwd** `boolean` - Enable/disable x-forward headers
  - **toProxy** `string` - Passes the absolute URL as the path (useful for proxying to proxies)
  - **forwardHost** `boolean` - Always forward the target hostname as `Host` header
  - **hostRewrite** `boolen` - Rewrites the location hostname on (301/302/307/308) redirects
  - **balance** `array<url>` - Define the URLs to balance. Default disabled
  - **agent** `https.Agent` - HTTPS agent instance. See node.js [`https`](https://nodejs.org/api/https.html#https_class_https_agent) docs
- SSL settings
  - **cert** `string` - Path to SSL certificate file
  - **key** `string` - Path to SSL key file
- Routes defined by path (nested)
  - **method** `string` - HTTP method for the route. Default to `all`
  - **forward** `string` - Default forward URL
  - **replay** `array<string>` - Optional replay server URLs

The configuration file must be in [TOML](https://github.com/toml-lang/toml) format
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
  .replay('http://old.server')
  .options({ forwardHost: true })

// Configure the routes to forward/replay
proxy
  .get('/users/:id')
  // Overwrite the path while proxying
  .toPath('/profile/:id')
proxy
  .get('/search')
  // Overwrite the forward URL for this route
  .forward('http://another.server')

proxy.listen(3000)
```

For more usage case, take a look to the [examples](/examples)

### rocky([ options ])

Creates a new rocky instance with the given options.

You can pass any of the allowed params at [configuration](#configuration) level and any supported [http-proxy options](https://github.com/nodejitsu/node-http-proxy/blob/master/lib/http-proxy.js#L33-L50)

#### rocky#forward(url)
Alias: `target`

Define a default target URL to forward the request

#### rocky#replay(...url)

Add a server URL to replay the incoming request

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

#### rocky#listen(port)

Starts a HTTP proxy server in the given port

#### rocky#close([ callback ])

Close the HTTP proxy server, if exists.
A shortcut to `rocky.server.close(cb)`

#### rocky#all(path)
Return: `Route`

Add a route handler for the given path for all HTTP methods

#### rocky#get(path)
Return: `Route`

Configure a new route the given path with `GET` method

#### rocky#post(path)
Return: `Route`

Configure a new route the given path with `POST` method

#### rocky#delete(path)
Return: `Route`

Configure a new route the given path with `DELETE` method

#### rocky#put(path)
Return: `Route`

Configure a new route the given path with `PUT` method

#### rocky#patch(path)
Return: `Route`

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

#### route#replay(...url)

Overwrite replay servers for the current route.

#### route#balance(...urls)

Define a set of URLs to balance between with a simple round-robin like scheduler.

#### route#toPath(url, [ params ])

Overwrite the request path, defining additional optional params.

#### route#headers(headers)

Define or overwrite request headers

#### route#host(host)

Overwrite the target hostname (defined as `host` header)

#### route#transformResponseBody(middleware)

Experimental response body interceptor and transformer middleware for the given route.
This allows you to change, replace or map the response body sent from the target server before sending it to the client.

The middleware must a function accepting the following arguments: `function(req, res, next)`
You can see an usage example [here](/examples/interceptor.js).

**Note**: don't use it for large binary bodies

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
- **error** `err, req, res` - Fired when the forward request fails
- **replay:proxyReq** `opts, proxyReq, req, res` - Fired when a replay request starts
- **replay:proxyRes** `opts, proxyRes, req, res` - Fired when a replay server respond
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
