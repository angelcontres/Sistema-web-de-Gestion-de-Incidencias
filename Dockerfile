FROM php:8.3-fpm-alpine

# Instalar dependencias esenciales del sistema
RUN apk add --no-cache \
    bash \
    curl \
    libpng-dev \
    libzip-dev \
    zip \
    unzip

# Instalar extensiones de PHP indispensables para conectar con PostgreSQL
RUN docker-php-ext-install pdo pdo_pgsql zip

# Copiar Composer oficial de forma global
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configurar el directorio de trabajo coincidiendo con tu docker-compose.yml
WORKDIR /var/www/html

EXPOSE 9000
CMD ["php-fpm"]