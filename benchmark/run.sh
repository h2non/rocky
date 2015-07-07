#!/bin/bash
#
# Simple benchmark test suite for rocky
#
# You must have vegeta installed:
# go get github.com/tsenart/vegeta
#

#
# Benchmark config
#
url="http://localhost:9000" # default rocky proxy URL
rate=100                    # concurrent requests per second
duration=10s                # benchmark duration in human friendly format

#
# Overwrite from arguments, if present
#
[ ! -z $1 ] && url=$1
[ ! -z $2 ] && rate=$2
[ ! -z $3 ] && duration=$3

#
# Private variables
#
current=0
proxyPid=0
serverPid=0

if [ -z `which vegeta` ]; then
  echo "Error: vegeta binary not found. Run: go get github.com/tsenart/vegeta"
  exit 1
fi

cd `dirname $0`

targetServer() {
  node servers & > /dev/null
  serverPid=$!
}

proxyServer() {
  node suites/$1 & > /dev/null
  proxyPid=$!
}

before() {
  proxyServer $1
  targetServer
  sleep 1
}

after() {
  disown $serverPid
  disown $proxyPid
  kill -9 $serverPid
  kill -9 $proxyPid
}

getBenchmark() {
  echo "GET $url" \
  | vegeta attack \
    -duration=$duration \
    -rate=$rate \
  | vegeta report
}

postBenchmark() {
  echo "POST $url" \
  | vegeta attack \
    -duration=$duration \
    -rate=50 \
    -timeout=60s \
    -body="../test/fixtures/data.json" \
  | vegeta report
}

test() {
  before $1

  echo "# Running benchmark suite: $1"
  $2 # run test function!
  echo

  after
}

#
# Run suites
#
test "forward" getBenchmark
test "replay" getBenchmark
test "forward-payload" postBenchmark

exit $?