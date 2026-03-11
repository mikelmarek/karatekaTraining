#!/bin/zsh
set -euo pipefail

cd "$(dirname "$0")/.."

NODE_BIN="/Users/marekmikel/.nvm/versions/node/v20.18.1/bin/node"

if [[ ! -x "$NODE_BIN" ]]; then
	echo "Node binary nebyl nalezen na $NODE_BIN" >&2
	exit 1
fi

exec "$NODE_BIN" src/index.js
