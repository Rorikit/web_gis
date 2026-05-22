#!/usr/bin/env sh
set -e

python manage.py migrate --noinput

if [ "${DJANGO_BOOTSTRAP_DEV_AUTH:-false}" = "true" ]; then
  python manage.py bootstrap_dev_auth
fi

if [ "$#" -gt 0 ]; then
  exec "$@"
fi

exec python manage.py runserver 0.0.0.0:8000
