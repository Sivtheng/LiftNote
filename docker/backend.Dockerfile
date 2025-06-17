# Use the official PHP image with Apache (updated to 8.2)
FROM php:8.2-apache

# Set working directory
WORKDIR /var/www/html

# Install system dependencies and required PHP extensions
RUN apt-get update --fix-missing && apt-get install -y \
    apt-utils \
    libpng-dev \
    libjpeg-dev \
    libfreetype6-dev \
    libzip-dev \
    unzip \
    git \
    curl \
    libonig-dev \
    libxml2-dev \
    ca-certificates \
    && docker-php-ext-configure gd --with-freetype --with-jpeg \
    && docker-php-ext-install pdo pdo_mysql gd zip bcmath intl opcache \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Enable Apache rewrite module
RUN a2enmod rewrite

# Update Apache configuration to point to Laravel's public directory
RUN sed -i -e 's!/var/www/html!/var/www/html/public!g' /etc/apache2/sites-available/000-default.conf \
    && echo '<Directory /var/www/html/public>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>' >> /etc/apache2/apache2.conf

# Install Composer
COPY --from=composer:2.5 /usr/bin/composer /usr/bin/composer

# Set environment variable to allow Composer to run as root
ENV COMPOSER_ALLOW_SUPERUSER=1

# Create required directories
RUN mkdir -p /var/www/html/public/css \
    && mkdir -p /var/www/html/storage/certs

# Copy composer files first
COPY ./backend/composer.json ./backend/composer.lock* ./

# Install dependencies (including dev dependencies for build)
RUN composer install --no-scripts

# Copy the rest of the application
COPY ./backend .

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    && find /var/www/html -type d -exec chmod 755 {} \; \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/public/css \
    && chmod -R 775 /var/www/html/storage/certs \
    && chmod -R 775 /var/www/html/vendor

# Generate optimized autoload files and run post-install scripts
RUN composer dump-autoload --optimize \
    && php artisan package:discover --no-interaction \
    && composer install --no-dev --no-scripts --optimize-autoloader

# Update PHP configuration for SSL
RUN echo "extension=pdo_mysql.so" > /usr/local/etc/php/conf.d/docker-php-ext-pdo_mysql.ini \
    && echo "mysql.default_socket=" >> /usr/local/etc/php/conf.d/docker-php-ext-pdo_mysql.ini \
    && echo "mysqli.default_socket=" >> /usr/local/etc/php/conf.d/docker-php-ext-pdo_mysql.ini

# Expose the app port
EXPOSE 80