#!/usr/bin/env sh
set -e

if [ "${DJANGO_RUN_MODE:-development}" = "production" ]; then
  if [ "${DJANGO_DEBUG:-false}" != "false" ]; then
    echo "DJANGO_DEBUG must be false in production" >&2
    exit 1
  fi

  if [ "${DJANGO_BOOTSTRAP_DEV_AUTH:-false}" = "true" ]; then
    echo "DJANGO_BOOTSTRAP_DEV_AUTH must be false in production" >&2
    exit 1
  fi

  case "${POSTGRES_PASSWORD:-}" in
    ''|web_gis|replace-with-*)
      echo "POSTGRES_PASSWORD must be set to a secure value in production" >&2
      exit 1
      ;;
  esac
fi

python manage.py migrate --noinput

if [ "${DJANGO_BOOTSTRAP_DEV_AUTH:-false}" = "true" ]; then
  python manage.py bootstrap_dev_auth
fi

if [ "${DJANGO_COLLECTSTATIC:-false}" = "true" ]; then
  python manage.py collectstatic --noinput
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

if [ "${DJANGO_RUN_MODE:-development}" = "production" ]; then
  exec gunicorn config.wsgi:application \
    --bind "0.0.0.0:${BACKEND_PORT:-8000}" \
    --workers "${GUNICORN_WORKERS:-3}" \
    --threads "${GUNICORN_THREADS:-2}" \
    --timeout "${GUNICORN_TIMEOUT:-120}" \
    --access-logfile - \
    --error-logfile -
fi

exec python manage.py runserver 0.0.0.0:8000
