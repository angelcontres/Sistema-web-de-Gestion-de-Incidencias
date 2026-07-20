# Progreso actual

- Sesión pausada por el usuario.
- **Nota para la próxima sesión:** La implementación de `perf_backend_laravel` (especialmente el cambio a `cursorPaginate()` y el Query Object) cambió la estructura de los JSON que devuelve la API. Esto está causando errores en el Frontend (VanillaJS), rompiendo los menús y la disposición. La próxima tarea debería enfocarse en actualizar el Frontend para que consuma correctamente el nuevo formato de la API, posiblemente empezando con la feature `perf_frontend_vanillajs`.
