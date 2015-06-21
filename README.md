# rocky [![Build Status](https://api.travis-ci.org/h2non/rocky.svg?branch=master&style=flat)](https://travis-ci.org/h2non/rocky) [![Code Climate](https://codeclimate.com/github/h2non/rocky/badges/gpa.svg)](https://codeclimate.com/github/h2non/rocky) [![NPM](https://img.shields.io/npm/v/rocky.svg)](https://www.npmjs.org/package/rocky) ![Downloads](https://img.shields.io/npm/dm/rocky.svg)

<img align="right" height="180" src="http://s22.postimg.org/f0jmde7o1/rocky.jpg" />

Plugable HTTP proxy and migration library for [node.js](http://nodejs.org).

`rocky` essentially acts as a reverse HTTP proxy forwarding and/or replaying the traffic to one or multiple backends.

It provides an elegant and fluent programmatic API with built-in features such as connect-style middleware layer, full-featured routing, request interceptor, traffic replay and works perfectly as standalone HTTP/S server or via connect/express plugin.

**Note**: still beta

## Features

- Full-featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Replay traffic to multiple backends
- Works as standalone HTTP/S server
- Or integrated with connect/express via middleware
- Path based forwarding and replay
- Full-featured router (express-like)
- Routing support based on regexp and wildcards
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

## Usage

```js
To do
```

## Command-line

```bash
Start rocky HTTP proxy server
Usage: rocky [options]

Options:
  --help, -h     Show help                                             [boolean]
  --config, -c   File path to TOML config file                        [required]
  --port, -p     rocky HTTP server port
  --forward, -f  Default forward server URL
  --replay, -r   Define a replay server URL
  --debug, -d    Enable debug mode                                     [boolean]
  -v, --version  Show version number                                   [boolean]

Examples:
  rocky -c rocky.toml \
  -f http://127.0.0.1:9000 \
  -r http://127.0.0.1
```

#### Examples

```
rocky --config rocky.toml
```

### Configuration file

**Supported params**

- Default params (top level)
  - **forward** `string` - Default forward URL
  - **replay** `array<string>` - Optional replay server URLs
  - **debug** `boolean` - Enable debug mode. Default `false`
- Routes defined by path (nested)
  - **method** `string` - HTTP method for the route. Default to `all`
  - **forward** `string` - Default forward URL
  - **replay** `array<string>` - Optional replay server URLs

```toml
forward = "http://google.com/"
replay = ["http://duckduckgo.com/"]

[/test]
method = "all"

[/*]
method = "GET"
replay = ["http://local.server:3001"]
```

## Programmatic API

### rocky([ options ])

Creates a new rocky instance with the given options.
You can pass any of the allowed params

#### rocky#forward(url)
Alias: `target`

Define a default target URL to forward the request

#### rocky#replay(...url)

Add a server URL to replay the incoming request

#### rocky#use([ path ], ...middleware)

Use the given middleware function for all http methods on the given path, defaulting to the root path.

#### rocky#on(event, handler)

Subscribe to a proxy event. See support events [here](https://github.com/nodejitsu/node-http-proxy#listening-for-proxy-events)

#### rocky#middleware()

Return a connect/express compatible middleware

#### rocky#requestHandler(req, res, next)

Raw HTTP request/response handler.

#### rocky#listen(port)

Starts a HTTP proxy server in the given port

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

#### Route#replay(...url)

#### Route#on(event, ...handler)

Subscribes to a specific event for the given route.
Useful to incercept the status or modify the options on-the-fly

Supported events:

- **start** `opts, req, res` - Fired when the request forward process starts
- **forward:error** `err, req, res` - Fired when the forwarded request fails
- **forward:success** `req, res` - Fired when the forwarded request success
- **replay:error** `err, req, res` - Fired when the replayed request fails
- **replay:success** `req, res` - Fired when the replayed request success

## License

MIT - Tomas Aparicio
