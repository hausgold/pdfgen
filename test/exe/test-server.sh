#!/bin/bash

# Fail fast on errors
set -eo pipefail

# Config
URL='http://localhost:3000'

# Error handler
function on_error()
{
  echo 'Failed. Abort.'
  exit 1
}
trap "on_error" ERR

echo '# Test Server'
echo '  without headers'
echo '    returns the fallback body'
curl -s "${URL}" | grep 'Test!' >/dev/null

echo '  with headers'
echo '    returns the given custom headers as body'
curl -s "${URL}" -H 'Authorization: Test Token' \
  | grep 'authorization: Test Token' >/dev/null
