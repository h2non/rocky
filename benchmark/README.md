# Benchmarking `rocky`

## Requirements

- Go +1.3
- vegeta - `go get github.com/tsenart/vegeta`

## Running benchmark

```
bash benchmark/run.sh
```

Supported optional arguments:
```
bash benchmark/run.sh [rocky url] [rate] [duration]
```

Example:
```
bash benchmark/run.sh http://rocky.server:8080 200 15s
```

## Results

Using a Macbook Pro i7 2.7 Ghz 16 GB OSX Yosemite and `node.js@4.2.1`

##### Simple forward (100 req/sec)
```
# Running benchmark suite: forward
Requests  [total]       1000
Duration  [total, attack, wait]   9.994724089s, 9.991463892s, 3.260197ms
Latencies [mean, 50, 95, 99, max]   3.696245ms, 3.39041ms, 7.345854ms, 41.871707ms, 41.871707ms
Bytes In  [total, mean]     12000, 12.00
Bytes Out [total, mean]     0, 0.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:1000
```

##### Forward and replay to multiple backends (100 req/sec)
```
# Running benchmark suite: replay
Requests  [total]       1000
Duration  [total, attack, wait]   9.994925269s, 9.990668119s, 4.25715ms
Latencies [mean, 50, 95, 99, max]   4.979603ms, 4.198974ms, 14.343016ms, 48.186129ms, 48.186129ms
Bytes In  [total, mean]     12000, 12.00
Bytes Out [total, mean]     0, 0.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:1000
```

##### Forward with payload (~2KB) (50 req/sec)
```
# Running benchmark suite: forward with payload
Requests  [total]       500
Duration  [total, attack, wait]   9.993976759s, 9.980336329s, 13.64043ms
Latencies [mean, 50, 95, 99, max]   24.192313ms, 16.084827ms, 95.600946ms, 145.897666ms, 145.897666ms
Bytes In  [total, mean]     6000, 12.00
Bytes Out [total, mean]     861500, 1723.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:500
Error Set:
```

##### Replay with payload (~2KB) (50 req/sec)
```
# Running benchmark suite: replay with payload
Requests  [total]       500
Duration  [total, attack, wait]   9.985169685s, 9.980843808s, 4.325877ms
Latencies [mean, 50, 95, 99, max]   4.933694ms, 4.611819ms, 8.604071ms, 41.105633ms, 41.105633ms
Bytes In  [total, mean]     6000, 12.00
Bytes Out [total, mean]     861500, 1723.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:500
```

##### Replay with payload to multiple backends (~2KB) (50 req/sec)
```
# Running benchmark suite: replay with payload
Requests  [total]       500
Duration  [total, attack, wait]   9.987592135s, 9.982661448s, 4.930687ms
Latencies [mean, 50, 95, 99, max]   7.131198ms, 5.255614ms, 29.921801ms, 118.176607ms, 118.176607ms
Bytes In  [total, mean]     6000, 12.00
Bytes Out [total, mean]     861500, 1723.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:500
```

##### Forward with large payload (~250KB) (50 req/sec)
```
# Running benchmark suite: replay with payload to multiple backends
Requests  [total]       500
Duration  [total, attack, wait]   9.982329219s, 9.978939543s, 3.389676ms
Latencies [mean, 50, 95, 99, max]   8.205879ms, 5.552973ms, 30.474587ms, 188.612597ms, 188.612597ms
Bytes In  [total, mean]     6000, 12.00
Bytes Out [total, mean]     861500, 1723.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:500
```

##### Replay with large payload (~250KB) (50 req/sec)
```
# Running benchmark suite: replay-with-payload
Requests  [total]       500
Duration  [total, attack, wait]   9.978721886s, 9.975644048s, 3.077838ms
Latencies [mean, 50, 95, 99, max]   4.595263ms, 4.008649ms, 11.35459ms, 45.080501ms, 45.080501ms
Bytes In  [total, mean]     6962, 13.92
Bytes Out [total, mean]     117091500, 234183.00
Success   [ratio]       85.20%
Status Codes  [code:count]      200:426  502:74
Error Set:
502 Bad Gateway
```

##### Replay with large payload to multiple backends (~250KB) (50 req/sec)
```
# Running benchmark suite: binary-replay-with-payload
Requests  [total]       500
Duration  [total, attack, wait]   9.983661865s, 9.979603656s, 4.058209ms
Latencies [mean, 50, 95, 99, max]   5.341988ms, 4.662403ms, 14.595361ms, 46.528611ms, 46.528611ms
Bytes In  [total, mean]     6143, 12.29
Bytes Out [total, mean]     117091500, 234183.00
Success   [ratio]       97.80%
Status Codes  [code:count]      200:489  502:11
Error Set:
502 Bad Gateway
```
