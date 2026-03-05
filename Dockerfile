FROM node:22 AS frontend

WORKDIR /app
COPY src/package.json src/package-lock.json ./
RUN npm ci
COPY src/ ./
RUN rm -f .npmrc
RUN npm run build


FROM composer:2 AS vendor

WORKDIR /app
COPY src/composer.json src/composer.lock ./
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader \
    --no-scripts


FROM php:8.3-apache

ENV PORT=80

# Install system dependencies (runtime only)
RUN apt-get update && apt-get install -y \
    curl \
    dos2unix \
    libfreetype6-dev \
    libjpeg62-turbo-dev \
    libonig-dev \
    libpq-dev \
    libpng-dev \
    libwebp-dev \
    libxml2-dev \
    unzip \
    zip \
    && apt-get autoclean \
    && rm -rf /var/lib/apt/lists/*

# Configure and install PHP extensions required by Laravel
RUN docker-php-ext-configure gd \
    --with-freetype \
    --with-jpeg \
    --with-webp

RUN docker-php-ext-install \
    bcmath \
    ctype \
    exif \
    gd \
    mbstring \
    pdo \
    pdo_mysql \
    pdo_pgsql \
    pcntl \
    sockets

# Install Composer (handy for local dev tooling; production builds can still avoid running it)
COPY --from=composer/composer:latest-bin /composer /usr/bin/composer

# Enable Apache mod_rewrite
RUN a2enmod rewrite
COPY ./_setup/web_scripts/apache.conf /etc/apache2/sites-available/000-default.conf
COPY ./_setup/web_scripts/start-prod.sh /usr/local/bin/start-prod.sh

WORKDIR /var/www/html

# Application code + dependencies
COPY src/ /var/www/html/
COPY --from=vendor /app/vendor /var/www/html/vendor
COPY --from=frontend /app/public/build /var/www/html/public/build

# Run Apache as a non-root user
RUN useradd -m laravel \
    && sed -ri 's/^export APACHE_RUN_USER=.*/export APACHE_RUN_USER=laravel/' /etc/apache2/envvars \
    && sed -ri 's/^export APACHE_RUN_GROUP=.*/export APACHE_RUN_GROUP=laravel/' /etc/apache2/envvars \
    && mkdir -p /var/run/apache2 /var/lock/apache2 \
    && chown -R laravel:laravel \
        /var/www/html \
        /var/run/apache2 \
        /var/lock/apache2 \
        /var/log/apache2

    RUN chmod +x /usr/local/bin/start-prod.sh

USER laravel

CMD ["/usr/local/bin/start-prod.sh"]
