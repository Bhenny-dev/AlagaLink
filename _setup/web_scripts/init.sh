#!/bin/sh
set -e

WORKDIR=/var/www/html

npm config set cache $HOME/.npm
npm config set prefix $HOME/.npm-global

# Initialize Laravel project if not already present
echo "Checking for existing Laravel project..."
if [ ! -f $WORKDIR/artisan ]; then
    echo "No existing Laravel project found. Creating new project..."
    sh /scripts/install_laravel.sh
    sh /scripts/install_laravel_breeze.sh
else
    cd $WORKDIR
    echo "Laravel project already exists. Skipping creation."
    composer install --prefer-dist --no-interaction --optimize-autoloader
    php artisan --version
fi

echo "Initialization complete."

echo "Ensuring Laravel writable directories are writable..."
cd $WORKDIR
mkdir -p \
    storage/framework/views \
    storage/framework/cache \
    storage/framework/sessions \
    storage/logs \
    bootstrap/cache

# In this repo, /var/www/html is a bind-mount from the host. The host files are often owned by
# the local user, while Apache/PHP runs as www-data inside the container. Make these directories
# writable for local dev to avoid Blade compilation errors.
chmod -R a+rwX storage bootstrap/cache || true

# If the Vite dev server isn't running, a leftover public/hot file will cause the browser to
# request assets from http://localhost:5173 and fail. Remove it so Laravel falls back to the
# compiled assets under public/build.
if [ -f "$WORKDIR/public/hot" ]; then
    echo "Removing stale Vite hot file..."
    rm -f "$WORKDIR/public/hot" || true
fi

echo "Running database migrations..."
php artisan migrate --force