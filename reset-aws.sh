#!/bin/bash
# Script para limpiar y reiniciar completamente el ambiente de AWS Producción

echo "================================================="
echo " LIMPIANDO AMBIENTE DE PRODUCCIÓN (AWS) "
echo "================================================="

cd "$(dirname "$0")"

echo "[1/5] Deteniendo contenedores y destruyendo volúmenes de base de datos..."
docker compose -f docker-compose.aws.yml down -v

echo "[2/5] Eliminando fotos e imágenes residuales..."
sudo rm -rf backend/api/storage/app/public/incidencias/*
sudo rm -rf backend/api/storage/app/private/incidencias/*

echo "[3/5] Levantando contenedores desde cero..."
docker compose -f docker-compose.aws.yml up -d --build

echo "[4/5] Esperando a que el contenedor de Laravel inicie correctamente (10s)..."
sleep 10

echo "[5/5] Ejecutando migraciones y seeders de la base de datos..."
docker exec sistema_laravel_prod php artisan migrate:fresh --seed

echo "================================================="
echo " AMBIENTE DE AWS LIMPIO Y LISTO PARA PRUEBAS "
echo "================================================="
