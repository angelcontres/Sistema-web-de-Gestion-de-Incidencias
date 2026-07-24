# Ingeniería de Software · UPSE

# ENTREGABLE 7

## Evaluación del Rendimiento y Calidad Operacional

---

| **Perspectiva de Análisis**   | **Métricas Clave de Carga**        | **Fase Final del Ciclo**          |
| ----------------------------- | ---------------------------------- | --------------------------------- |
| **Eficiencia y Concurrencia** | **Throughput, Errores y Latencia** | **Auditoría Definitiva (Cierre)** |

---

> ## ⚡ El Desafío de la Escalabilidad Operativa
>
> Un sistema puede ser funcionalmente impecable con un solo usuario activo, pero degradarse drásticamente bajo cargas concurrentes. Este hito somete al **Sistema Web de Gestión de Incidencias Georreferenciadas** a simulaciones controladas de estrés operacional. El objetivo es recopilar telemetría real sobre tiempos de respuesta, saturación de CPU/RAM y tasas de transferencia para romper cuellos de botella antes del despliegue en producción.

---

# 📋 Estructura Estándar del Reporte de Rendimiento (5 a 7 Páginas)

1. **Objetivos del Sprint de Carga**  
   Delimitación de las funcionalidades críticas expuestas a estrés (mapas, login, carga de imágenes) detallando las expectativas de usuarios simultáneos.

2. **Perfil del Entorno & Herramientas**  
   Declaración de hardware, infraestructura (Docker, VMs, Cloud) y justificación técnica de la suite de pruebas elegida (JMeter, k6, Locust, Gatling, etc.).

3. **Definición de Escenarios Operativos**  
   Modelado de las curvas de inyección de usuarios (ej. Consulta de mapas con 50 usuarios virtuales durante 2 minutos), especificando duración y metas funcionales.

4. **Telemetría de Indicadores & Gráficos**  
   Tabulación y representación gráfica de métricas operacionales: tiempos promedio/máximo/mínimo, Throughput (req/s), tasas de error y curvas de consumo de CPU/RAM.

5. **Detección de Cuellos de Botella**  
   Aislamiento y descripción de fallas de infraestructura o software: queries geoespaciales lentas, carencia de índices, renderizados costosos o bloqueos de caché.

6. **Recomendaciones, Objetivos (E1) y Dictamen**  
   Plan de remediación específico (paginación, compresión de adjuntos), contraste final con los Acuerdos de Nivel de Servicio (SLA) del Hito 1 y evaluación de viabilidad.

---

# ⚠️ Políticas Mandatorias de Auditoría Técnica

| Atributo de Control            | Criterio de Evaluación de la Cátedra                                                                                                                                                                 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Consistencia del Código**    | Las pruebas deben lanzarse exclusivamente sobre la versión del software previamente estabilizada y validada en los hitos funcionales y estáticos anteriores.                                         |
| **Evidencia Corroborada**      | Todos los resultados numéricos deben estar plenamente respaldados por capturas de pantalla, logs nativos de la consola o reportes html autogenerados por la herramienta elegida.                     |
| **Rigurosidad en el Análisis** | No basta con vaciar gráficos o tablas provistas por el framework de pruebas. Se calificará la capacidad de interpretar el comportamiento del hardware y proponer parches de infraestructura viables. |

---

# 📋 Lista de Verificación Operacional Pre-Entrega

_Asegúrese de validar meticulosamente cada indicador de rendimiento antes de compilar y remitir el reporte en formato PDF formal:_

- [ ] ¿Se definieron explícitamente los parámetros de usuarios concurrentes, volumen de peticiones y duración de cada escenario?
- [ ] ¿El reporte técnico describe a detalle la arquitectura de hardware y software del entorno bajo análisis?
- [ ] ¿Los gráficos adjuntos son legibles e ilustran las correlaciones críticas (usuarios virtuales vs. tiempos de respuesta)?
- [ ] ¿Se identificaron y describieron técnicamente las causas de los cuellos de botella (ej. latencia en consultas SQL de mapas)?
- [ ] ¿Se contrastaron los resultados numéricos frente a los objetivos de disponibilidad y latencia planteados en el Hito 1?
- [ ] ¿Las propuestas de optimización presentadas responden directamente a los problemas de recursos detectados en la prueba?
