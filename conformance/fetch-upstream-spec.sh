#!/usr/bin/env bash
# Fetch TodoMVC's framework-agnostic browser spec.
#
# Fetched, not vendored: tastejs/todomvc has no root LICENSE and GitHub reports NOASSERTION, so we
# reference it rather than redistribute it. Pinning the commit keeps the control stable — a spec
# that changes between the "before" and "after" runs of a migration proves nothing.
set -euo pipefail

PIN="${TODOMVC_COMMIT:-ff43b02e59dfa604386bb382034b2cd07c2bcd8a}"
DEST="$(cd "$(dirname "$0")" && pwd)/todomvc"

if [ -d "$DEST/.git" ]; then
  echo "upstream spec already present at $DEST (pinned $PIN)"
  exit 0
fi

rm -rf "$DEST"
git clone --filter=blob:none --sparse --depth 1 -q https://github.com/tastejs/todomvc.git "$DEST"
git -C "$DEST" sparse-checkout set --skip-checks cypress tests
git -C "$DEST" fetch -q --depth 1 origin "$PIN"
git -C "$DEST" checkout -q "$PIN"
echo "fetched TodoMVC spec at $PIN -> $DEST"
