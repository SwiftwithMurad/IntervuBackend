#!/usr/bin/env bash
# Run locally after deploy: bash scripts/verify-production.sh https://intervu-backend.vercel.app
set -euo pipefail
BASE="${1:-https://intervu-backend.vercel.app}"
echo "Testing $BASE"

code=$(curl -sS -o /tmp/v-health.json -w "%{http_code}" --max-time 30 "$BASE/health")
echo "GET /health -> HTTP $code"
cat /tmp/v-health.json
echo ""

code=$(curl -sS -o /tmp/v-ready.json -w "%{http_code}" --max-time 45 "$BASE/health/ready")
echo "GET /health/ready -> HTTP $code"
cat /tmp/v-ready.json
echo ""

code=$(curl -sS -o /tmp/v-int.json -w "%{http_code}" --max-time 45 "$BASE/api/v1/interview/main-config")
echo "GET /api/v1/interview/main-config (no auth) -> HTTP $code"
cat /tmp/v-int.json
echo ""

code=$(curl -sS -o /tmp/v-login.json -w "%{http_code}" --max-time 45 -X POST "$BASE/api/v1/auth/login" \
  -H "Content-Type: application/json" -d '{"email":"a@b.com","password":"x"}')
echo "POST /api/v1/auth/login -> HTTP $code"
cat /tmp/v-login.json
echo ""

echo "Done."
