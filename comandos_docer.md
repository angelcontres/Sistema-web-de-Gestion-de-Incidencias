docker compose -f docker-compose.local.yml down -v

docker exec -it sistema_laravel_prod php artisan migrate:fresh --seed

Para server virgenes
1. docker compose -f docker-compose.aws.yml up -d (Arranca todo).           
  2. Ejecutas el comando de migraciones: docker exec sistema_laravel_prod php 
  artisan migrate --force.
  3. Limpias el caché y reinicias el worker por precaución:
  docker exec sistema_laravel_worker_prod php artisan config:clear            
  docker restart sistema_laravel_worker_prod



* local: 
1. Para bajar (detener) todos los contenedores:
  
    docker compose -f docker-compose.local.yml down
  
  (Nota: Si por alguna razón quieres que también se borren las bases de datos locales para empezar desde    
  cero, puedes añadir -v al final del comando).
  
  2. Para volver a levantar los contenedores (en segundo plano):
  
    docker compose -f docker-compose.local.yml up -d
  
  3. Si hiciste cambios que requieran reconstruir las imágenes (opcional):
  
    docker compose -f docker-compose.local.yml up -d --build
