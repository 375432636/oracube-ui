#!/usr/bin/env bash
set -euo pipefail

echo "=== Building Oracube UI ==="
cd "$(dirname "$0")/.."
npx electron-vite build

echo ""
echo "=== Running Unit Tests ==="
npx vitest run

echo ""
echo "=== Running E2E Tests ==="
npx playwright test

echo ""
echo "=== All Tests Passed ==="
