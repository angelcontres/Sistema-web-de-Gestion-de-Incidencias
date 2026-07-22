FROM php:8.4-fpm-alpine

# Instalar librerías para PostgreSQL usando el gestor 'apk' de Alpine
RUN apk update && apk add --no-cache libpq-dev \
    && docker-php-ext-install pdo pdo_pgsql pcntl

# Instalar Composer desde su imagen oficial
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]