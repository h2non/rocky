# rocky

Extensible and plugable HTTP migration library for [node.js](http://nodejs.org).

`rocky` essentially acts as a reverse HTTP proxy forwaring the traffic to one or multiple backends with optional traffic replay.

It provides an elegant and fluent programmatic API with built-in features such as connect-style middleware layer, full-featured routing, request interceptor, traffic replay and works perfectly as standalone HTTP/S server or via connect/express plugin.

**Work in progress**

## Features

- Full featured HTTP/S proxy (backed by [http-proxy](https://github.com/nodejitsu/node-http-proxy))
- Replay traffic to multiple backends
- Works as standalone HTTP/S server
- Or integrated with connect/express via middleware
- Full-featured path based routing (express based)
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

## Programmatic API

### rocky([ options ])

Creates a new rocky instance with the given options.
You can pass any of the allowed params

#### rocky#forward(url)

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
