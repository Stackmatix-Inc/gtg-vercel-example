#!/usr/bin/env bash
# Check Google tag gateway routing and geolocation through the proxy.
set -euo pipefail
base="${1:?usage: health.sh <base-url>}"
base="${base%/}"
status=0
for path in "/metrics/healthy" "/metrics/?validate_geo=healthy"; do
  body="$(curl -fsS --max-time 10 "$base$path" || true)"
  if [ "$body" = "ok" ]; then echo "ok    $path"; else echo "FAIL  $path"; status=1; fi
done
exit "$status"
