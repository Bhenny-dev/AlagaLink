#!/bin/sh
set -e

if [ -z "${APP_KEY:-}" ]; then
  echo "ERROR: APP_KEY is not set. Configure it in Render Environment Variables." >&2
  exit 1
fi

echo "Running migrations..." >&2
attempt=0
until php artisan migrate --force; do
  attempt=$((attempt + 1))
  if [ "$attempt" -ge 10 ]; then
    echo "ERROR: migrations failed after retries." >&2
    exit 1
  fi
  echo "Database not ready yet; retrying in 3s..." >&2
  sleep 3
done

echo "Caching config..." >&2
php artisan config:cache

echo "Starting Apache..." >&2
exec apache2-foreground
