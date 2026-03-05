#!/usr/bin/env bash
# seed-remote-db.sh: Safely seed remote Render DB from local environment
# Usage: ./seed-remote-db.sh

set -Eeuo pipefail

ENV_FILE="src/.env"
RENDER_ENV_FILE="src/.env.render"
BACKUP_FILE="src/.env.backup.$(date +%s)"
TMP_FILE="$(mktemp)"
RESTORE_NEEDED=0

DB_KEYS=(
  DB_CONNECTION
  DB_HOST
  DB_PORT
  DB_DATABASE
  DB_USERNAME
  DB_PASSWORD
)

run_artisan_local() {
  (
    cd src
    php artisan config:clear
    php artisan migrate --force
    php artisan db:seed --force
  )
}

run_artisan_docker() {
  docker compose exec -T web bash -lc \
    "cd /var/www/html && php artisan config:clear && php artisan migrate --force && php artisan db:seed --force"
}

cleanup() {
  rm -f "$TMP_FILE"
  if [[ $RESTORE_NEEDED -eq 1 && -f "$BACKUP_FILE" ]]; then
    mv "$BACKUP_FILE" "$ENV_FILE"
    echo "Restored original $ENV_FILE after failure."
  fi
}
trap cleanup EXIT

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Error: $ENV_FILE not found."
  exit 1
fi

if [[ ! -f "$RENDER_ENV_FILE" ]]; then
  echo "Error: $RENDER_ENV_FILE not found."
  exit 1
fi

declare -A render_values=()
declare -A found_keys=()

while IFS= read -r line; do
  for key in "${DB_KEYS[@]}"; do
    if [[ "$line" == "$key="* ]]; then
      render_values["$key"]="${line#*=}"
      found_keys["$key"]=1
    fi
  done
done < "$RENDER_ENV_FILE"

for key in "${DB_KEYS[@]}"; do
  if [[ -z "${found_keys[$key]:-}" ]]; then
    echo "Error: Missing required key '$key' in $RENDER_ENV_FILE"
    exit 1
  fi
done

if [[ "${render_values[DB_HOST]}" != *.* ]]; then
  echo "Error: DB_HOST in $RENDER_ENV_FILE must be a full Render hostname (not just the service ID)."
  echo "Hint: Copy the host from Render's External Database URL."
  exit 1
fi

cp "$ENV_FILE" "$BACKUP_FILE"
RESTORE_NEEDED=1
echo "Backed up $ENV_FILE to $BACKUP_FILE"

declare -A replaced=()
while IFS= read -r line || [[ -n "$line" ]]; do
  replaced_line=0
  for key in "${DB_KEYS[@]}"; do
    if [[ "$line" == "$key="* ]]; then
      echo "$key=${render_values[$key]}" >> "$TMP_FILE"
      replaced["$key"]=1
      replaced_line=1
      break
    fi
  done

  if [[ $replaced_line -eq 0 ]]; then
    echo "$line" >> "$TMP_FILE"
  fi
done < "$ENV_FILE"

for key in "${DB_KEYS[@]}"; do
  if [[ -z "${replaced[$key]:-}" ]]; then
    echo "$key=${render_values[$key]}" >> "$TMP_FILE"
  fi
done

mv "$TMP_FILE" "$ENV_FILE"
echo "Updated $ENV_FILE with Render DB credentials."

if command -v php >/dev/null 2>&1 && php -m | grep -qi '^dom$'; then
  echo "Running Artisan locally."
  run_artisan_local
elif command -v docker >/dev/null 2>&1; then
  echo "Local PHP is missing DOM extension. Running Artisan in Docker web container."
  run_artisan_docker
else
  echo "Error: Cannot run Artisan. Install php-xml locally or run Docker web service."
  exit 1
fi

mv "$BACKUP_FILE" "$ENV_FILE"
RESTORE_NEEDED=0
echo "Restored original $ENV_FILE."
echo "Remote DB seeded successfully."
