# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) ![Downloads](https://img.shields.io/npm/dm/rocky.svg)

<img align="right" height="180" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

**Plugable** and versatile **HTTP proxy** for **traffic forward and replay**. Built for [node.js](http://nodejs.org).

`rocky` essentially [acts](#how-does-it-works) as a reverse HTTP proxy forwarding and/or replaying the traffic to one or multiple backends.
It was mainly designed to assist during a backend migration strategy, using it as your frontend server or integrated in your existent `node.js` backend.

`rocky` can be used [programmatically](#programmatic-api) or via its [command-line](#command-line) interface.

It provides built-in features such as connect-style middleware layer, full-featured path routing, request interceptor, standalone HTTP/S server or via connect/express plugin support.

**Still beta**

## Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Replay traffic to multiple backends
- Can run as standalone HTTP/S server
- Compatible with connect/express via middleware
- Full-featured router (express-like)
- Routing support based on regexp and wildcards
- Route specific traffic forward and replay
- Built-in middleware layer
- HTTP traffic interceptors via events
- Fluent and elegant API

## Installation

```bash
npm install rocky --save
```

For command-line interface usage, install it as global package:
```bash
npm install -g rocky
```

## How does it works?

```
         |==============|
         | The Internet |
         |==============|
               ||||
         |==============|
         |  HTTP server |
         |--------------|
         |     Rocky    |
         |~~~~~~~~~~~~~~|
         |  HTTP Router |
         |==============|
            ||      |
  (duplex) //        \ (one-way)
          //          \
         //            \
   /----------\   /----------\    /----------\
   |  target  |   | replay 1 | -> | replay 2 | (*N)
   \----------/   \----------/    \----------/
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
  - **hostRewrite** `boolen` rewrites the location hostname on (301/302/307/308) redirects
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

// Set up the express server
var app = express()

// Plug in the rocky middleware
app.use(proxy.middleware())

// Old route (won't be called since it will be intercepted by rocky)
app.get('/users/:id', function () { /* ... */ })
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
proxy
  .get('/search')

proxy.listen(3000)
```

For more usage case, take a look to the [examples](/examples)

### rocky([ options ])

Creates a new rocky instance with the given options.

You can pass any of the allowed params at [configuration](#configuration) level,
or take a look to the http-proxy [supported options](https://github.com/nodejitsu/node-http-proxy#options)

#### rocky#forward(url)
Alias: `target`

Define a default target URL to forward the request

#### rocky#replay(...url)

Add a server URL to replay the incoming request

#### rocky#options(options)

Define/overwrite rocky server options

#### rocky#use([ path ], ...middleware)

Use the given middleware function for all http methods on the given path, defaulting to the root path.

#### rocky#on(event, handler)

Subscribe to a proxy event. See support events [here](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events)

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

#### rocky#post(path)
Return: `Route`

#### rocky#delete(path)
Return: `Route`

#### rocky#put(path)
Return: `Route`

#### rocky#patch(path)
Return: `Route`

#### rocky#options(path)
Return: `Route`

#### rocky#proxy

[http-proxy](https://github.com/nodejitsu/node-http-proxy) instance

#### rocky#router

HTTP [router](https://github.com/pillarjs/router#routeroptions) instance

#### rocky#server

[HTTP](https://nodejs.org/api/http.html)/[HTTPS](https://nodejs.org/api/https.html) server instance.
Only present if `listen()` was called starting the built-in server.

### Route(path)

#### Route#forward(url)
Alias: `target`

Overwrite forward server for the current route.

#### Route#replay(...url)

Overwrite replay servers for the current route.

#### Route#options(options)

Overwrite default proxy [options](#configuration) for the current route.

#### Route#on(event, ...handler)

Subscribes to a specific event for the given route.
Useful to incercept the status or modify the options on-the-fly

Supported events:

- **request** `opts, req, res` - Fired when the request forward process starts
- **error:forward** `err, req, res` - Fired when the forwarded request fails
- **error:replay** `err, req, res` - Fired when the replayed request fails

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

### rocky.httpProxy

Accessor for the [http-proxy](https://github.com/nodejitsu/node-http-proxy) API

### rocky.VERSION

Current rocky package semver

## License

MIT - Tomas Aparicio
