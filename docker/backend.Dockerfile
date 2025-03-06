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

# Copy Laravel application code
COPY ./backend /var/www/html

# Create css directory and ensure it exists
RUN mkdir -p /var/www/html/public/css

# Set permissions
RUN chown -R www-data:www-data /var/www/html \
    && find /var/www/html -type f -exec chmod 644 {} \; \
    && find /var/www/html -type d -exec chmod 755 {} \; \
    && chmod -R 775 /var/www/html/storage \
    && chmod -R 775 /var/www/html/bootstrap/cache \
    && chmod -R 775 /var/www/html/public/css

# Set environment variable to allow Composer to run as root
ENV COMPOSER_ALLOW_SUPERUSER=1

# Install Laravel dependencies
RUN composer install --no-dev --optimize-autoloader -d /var/www/html

# Expose the app port
EXPOSE 80