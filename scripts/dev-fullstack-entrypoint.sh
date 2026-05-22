#!/usr/bin/env bash
set -euo pipefail

terminate_children() {
  kill "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
  wait "${BACKEND_PID:-}" "${FRONTEND_PID:-}" 2>/dev/null || true
}

cd /workspace/backend

python manage.py migrate --noinput

if [ "${DJANGO_BOOTSTRAP_DEV_AUTH:-false}" = "true" ]; then
  python manage.py bootstrap_dev_auth
fi

python manage.py runserver 0.0.0.0:8000 &
BACKEND_PID=$!

cd /workspace

npm run dev -- --host 0.0.0.0 --port "${FRONTEND_PORT:-5173}" &
FRONTEND_PID=$!

trap terminate_children INT TERM

wait -n "$BACKEND_PID" "$FRONTEND_PID"
EXIT_CODE=$?

terminate_children

exit "$EXIT_CODE"
