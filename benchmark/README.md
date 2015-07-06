# Benchmark

Simple benchmark suite for `rocky`

## Requirements

- Go +1.3
- vegeta `go get github.com/tsenart/vegeta`

## Run it!

```
bash benchmark/run.sh
```

Supported optional arguments:
```
bash benchmark/run.sh [rocky url] [rate] [duration]
```

Example:
```
bash benchmark/run.sh http://rocky.server:8080 200 60s
```

## Suite results

Using a Macbook Pro i7 2.7 Ghz 16 GB OSX Yosemite and `node.js@0.12.6`

##### Simple forward (200 req/sec)
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

##### Forward + replay to 2 backends (200 req/sec)
```
# Running benchmark suite: replay
Requests  [total]       1000
Duration  [total, attack, wait]   9.995610711s, 9.992172904s, 3.437807ms
Latencies [mean, 50, 95, 99, max]   4.825458ms, 4.321398ms, 7.390831ms, 44.316375ms, 44.316375ms
Bytes In  [total, mean]     12000, 12.00
Bytes Out [total, mean]     0, 0.00
Success   [ratio]       100.00%
Status Codes  [code:count]      200:1000
```

##### Forward with POST payload (~250KB) (50 req/sec)
```
# Running benchmark suite: forward-payload
Requests  [total]       500
Duration  [total, attack, wait]   1m0.401897863s, 9.984355502s, 50.417542361s
Latencies [mean, 50, 95, 99, max]   125.460034ms, 4.99145ms, 10.086713ms, 1m0.001088277s, 1m0.001088277s
Bytes In  [total, mean]     6131, 12.26
Bytes Out [total, mean]     116857317, 233714.63
Success   [ratio]       97.60%
Status Codes  [code:count]      200:486  502:6
Error Set:
502 Bad Gateway
```
