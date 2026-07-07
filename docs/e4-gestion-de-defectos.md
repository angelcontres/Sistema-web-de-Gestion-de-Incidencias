## Contenido Obligatorio del Reporte de Ejecución

|                                           |                                                                                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Línea Base del Ambiente**            | Fijación detallada de versiones de hardware, software e infraestructura de red (Spring Boot, Angular, PostgreSQL, contenedores Docker, etc.).      |
| **2. Bitácora e Historial de Ejecución**  | Registro formal de las ejecuciones, completando de forma rigurosa los campos: _Resultado Obtenido_ y _Estado (Aprobado/Fallido)._                  |
| **3. Depósito Documental de Evidencias**  | Compilación ordenada de capturas, logs del servidor, consolas del navegador o peticiones en Postman asociadas inequívocamente a cada ID de caso.   |
| **4. Registro de Bugs & Ciclo de Vida**   | Inventario de defectos estructurado bajo taxonomía estándar (Crítico, Alto, Medio, Bajo) detallando el flujo de re-testeo de parches.              |
| **5. Cuadro Estadístico de Cierre**       | Consolidado numérico preciso: Casos Diseñados vs. Ejecutados, Aprobados vs. Fallidos, y balance de Defectos (Corregidos/Pendientes).               |
| **6. Análisis, Trazabilidad y Lecciones** | Interpretación analítica de zonas frágiles, matriz de trazabilidad de requisitos actualizada y conclusiones predictivas sobre el nivel de calidad. |

---

# Criterios mandatorios de auditoría

| Componente Técnico        | Criterio Exigido por la Cátedra                                                                                     |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Integridad del Set**    | Prohibido omitir o eliminar casos heredados del E3 aduciendo que "la función ya sirve". Todo debe registrarse.      |
| **Evidencia Trazable**    | Cada captura o log incrustado debe plasmar el ID del caso asociado, la fecha del ensayo y el resultado explícito.   |
| **Validación del Parche** | No basta dictaminar que un bug está cerrado; debe adjuntarse la evidencia de la reejecución en la tabla de Re-test. |

---

# 📋 Lista de Verificación de Ejecución Pre-Entrega

_Valide que el documento científico de control compile los siguientes requerimientos prácticos antes del envío:_

- [ ] ¿El reporte técnico define las versiones exactas del ambiente de desarrollo y despliegue?
- [ ] ¿Se ejecutó la totalidad de los casos diseñados en el hito metodológico anterior (mínimo 25)?
- [ ] ¿Todas las evidencias adjuntas referencian su ID de caso y la fecha de ejecución?
- [ ] ¿Los defectos encontrados se encuentran inventariados bajo la nomenclatura estándar de severidad?
- [ ] ¿Se incluyeron los datos empíricos de re-testeo para los bugs que fueron remediados por desarrollo?
- [ ] ¿La matriz de trazabilidad cruzada fue actualizada reflejando los estados reales de aprobación?
