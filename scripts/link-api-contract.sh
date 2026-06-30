#!/usr/bin/env bash
# Optional: replace the vendored packages/api-contract with a symlink to crossub_web
# when developing against a local crossub_web checkout. Render/CI uses the committed
# copy in packages/api-contract — no sibling crossub_web repo required.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
SOURCE="$ROOT/../../crossub_web/packages/api-contract"
LINK="$ROOT/packages/api-contract"

if [ ! -f "$SOURCE/package.json" ]; then
  echo "→ crossub_web api-contract not found at $SOURCE (skipping local link)" >&2
  exit 0
fi

mkdir -p "$ROOT/packages"
ln -sfn "../../../crossub_web/packages/api-contract" "$LINK"
echo "→ Linked $LINK → crossub_web/packages/api-contract" >&2
