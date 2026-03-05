#!/bin/bash
# seed-remote-db.sh: Safely seed remote Render DB from local environment
# Usage: ./seed-remote-db.sh

set -e

ENV_FILE="src/.env"
RENDER_ENV_FILE="src/.env.render"
BACKUP_FILE="src/.env.backup.$(date +%s)"

# Check for required files
if [ ! -f "$ENV_FILE" ]; then
  echo "Error: $ENV_FILE not found."
  exit 1
fi
if [ ! -f "$RENDER_ENV_FILE" ]; then
  echo "Error: $RENDER_ENV_FILE not found."
  exit 1
fi

# Backup current .env
cp "$ENV_FILE" "$BACKUP_FILE"
echo "Backed up $ENV_FILE to $BACKUP_FILE"

# Replace DB settings in .env with Render credentials
awk 'BEGIN{found=0} \
  /^DB_CONNECTION=|^DB_HOST=|^DB_PORT=|^DB_DATABASE=|^DB_USERNAME=|^DB_PASSWORD=/ {found=1} \
  {if(!found) print $0} \
  END{while((getline line < ARGV[2]) > 0) print line}' "$ENV_FILE" "$RENDER_ENV_FILE" > "$ENV_FILE.tmp"
mv "$ENV_FILE.tmp" "$ENV_FILE"
echo "Updated $ENV_FILE with Render DB credentials."

# Run migrations and seeds
cd src
php artisan migrate --force
php artisan db:seed --force
cd ..

# Restore original .env
mv "$BACKUP_FILE" "$ENV_FILE"
echo "Restored original $ENV_FILE."

echo "✅ Remote DB seeded successfully."
