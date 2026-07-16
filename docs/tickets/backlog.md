# Análisis de Estado del Proyecto (Alcance Ajustado)

* **Porcentaje implementado (Aprox. 85%):** Sin los requerimientos de IA y MongoDB, el sistema está en una etapa avanzada. Toda la infraestructura Dockerizada relacional está lista, junto con la autenticación, seguridad RBAC, CRUD de catálogos y el motor de registro y visualización de incidencias georreferenciadas (Leaflet).
* **Porcentaje pendiente (Aprox. 15%):** El desarrollo pendiente se concentra netamente en cerrar el ciclo de vida funcional de las incidencias: asignación manual de personal, cálculo de métricas de tiempo y activación de notificaciones.
* **Módulos completos:** Despliegue con Docker, Base de Datos en PostgreSQL, Autenticación, Seguridad de roles, Visualización espacial (Mapas).
* **Módulos parcialmente implementados:** Gestión de incidencias (falta endpoint de asignación de operadores) e Historial/Seguimiento (faltan notificaciones y medición de tiempos).
* **Módulos no iniciados:** Exportación y volcado automático de base de datos (UC-12).

---

# Backlog de Tareas

[Backend] Implementar endpoint para asignación de responsables
Falta la lógica y el endpoint para que un Gestor/Administrador asigne usuarios (operadores) con roles específicos (responsable/apoyo) a una incidencia documentada en el UC-06.
Prioridad: Alta
Referencia:
docs/01_analisis/casos_uso_descripcion.md
backend/api/app/Http/Controllers/IncidenciaController.php

[Backend] Implementar motor de notificaciones
Falta la creación y envío de notificaciones (in-app o por email) ante eventos importantes como cambios de estado, asignaciones de personal y nuevos comentarios (UC-09).
Prioridad: Media
Referencia:
docs/01_analisis/casos_uso_descripcion.md
backend/api/app/Http/Controllers/IncidenciaController.php

[Backend] Calcular tiempo de resolución de incidencias
Falta la regla de negocio que calcule y almacene el tiempo total invertido cuando una incidencia transiciona de manera definitiva al estado "Resuelto" (UC-05).
Prioridad: Media
Referencia:
docs/01_analisis/casos_uso_descripcion.md
backend/api/app/Http/Controllers/IncidenciaController.php

[Pruebas] Desarrollar pruebas automatizadas de asignación y notificaciones
Faltan casos de prueba automatizados (Feature Tests) para asegurar la integridad de la asignación de responsables, tiempos calculados y envío de notificaciones.
Prioridad: Baja
Referencia:
docs/REQUERIMIENTOS.md
backend/api/tests/Feature/IncidenciaTest.php

[DevOps] Implementar herramienta de exportación de base de datos (Dump)
Falta crear un script automatizado, comando Artisan o endpoint que genere el volcado SQL de la BD para los entregables requeridos al final del proyecto (UC-12).
Prioridad: Baja
Referencia:
docs/01_analisis/casos_uso_descripcion.md
docker-compose.yml

[Fullstack] Implementar módulo de registro público (Sign Up) para ciudadanos
Crear el flujo completo para el registro de nuevos usuarios:
1. Revisar/ajustar migraciones de la tabla `users` si se requieren campos adicionales (DNI, teléfono, etc.) para ciudadanos.
2. Crear el validador `RegisterRequest` (contraseña segura, email único, etc.).
3. Implementar el método `register` en `AuthController`, asegurando que se asigne automáticamente el rol de "Ciudadano" o perfil base.
4. Exponer la ruta pública `POST /v1/register` en `api.php`.
5. Construir la pantalla (vista y controlador JS) de Sign Up en el Frontend, validando entradas y consumiendo la API de registro.
Prioridad: Alta
Referencia:
docs/01_analisis/casos_uso_descripcion.md
backend/api/routes/api.php

---

# Tareas de Arquitectura Ideal (Omitidas del alcance principal)

[Arquitectura] Implementar microservicio IA/NLP
Falta crear el servicio en Python para normalizar texto, clasificar incidencias y añadir su configuración al stack de Docker.
Prioridad: Alta
Referencia:
docs/Arquitectura-software-ideal/README.md
ia_python_nlp/

[Base de Datos] Integrar contenedor MongoDB
Falta configurar el contenedor de MongoDB en docker-compose y la respectiva conexión/driver en Laravel para persistencia híbrida.
Prioridad: Alta
Referencia:
docs/Arquitectura-software-ideal/README.md
docker-compose.yml

[Backend] Integrar creación de incidencias con servicio NLP
Falta enviar el texto de la incidencia al servicio de IA y guardar la respuesta y el texto crudo en MongoDB al registrar una incidencia.
Prioridad: Alta
Referencia:
docs/Arquitectura-software-ideal/README.md
backend/api/app/Http/Controllers/IncidenciaController.php
