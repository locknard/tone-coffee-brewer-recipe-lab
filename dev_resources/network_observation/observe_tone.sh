#!/usr/bin/env bash
set -euo pipefail

ROUTER_HOST="${ROUTER_HOST:-router}"
TONE_HOST="${TONE_HOST:-192.168.1.100}"
INTERFACE="${INTERFACE:-br-lan}"
SECONDS="${SECONDS:-60}"
OUT_DIR="${OUT_DIR:-$(pwd)/dev_resources/network_observation/sessions}"

mkdir -p "$OUT_DIR"
ts="$(date +%Y%m%d-%H%M%S)"
out_file="$OUT_DIR/tone-${ts}.pcap"
remote_file="/tmp/tone-${ts}.pcap"

echo "Observing $TONE_HOST on $ROUTER_HOST:$INTERFACE for ${SECONDS}s"
echo "Output: $out_file"

ssh "$ROUTER_HOST" \
  "rm -f '$remote_file'; tcpdump -i '$INTERFACE' -nn -s0 -U -w '$remote_file' 'host $TONE_HOST' & pid=\$!; sleep '$SECONDS'; kill -INT \$pid 2>/dev/null; wait \$pid 2>/dev/null || true"

scp "$ROUTER_HOST:$remote_file" "$out_file" >/dev/null
ssh "$ROUTER_HOST" "rm -f '$remote_file'" >/dev/null

echo "$out_file"
