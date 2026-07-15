## 🛡️ Más Allá de la Ejecución Funcional

Hasta este punto se ha verificado que el sistema funciona a nivel externo. Sin embargo, un software robusto debe estar impecablemente construido por dentro. Este entregable audita la caja negra del código fuente mediante herramientas automatizadas para diagnosticar la deuda técnica (Code Smells), la complejidad ciclomática oculta, la vigencia de dependencias y el blindaje ante brechas críticas de seguridad.

---

## 📋 Estructura Estándar del Reporte de Código (5 a 7 Páginas)

### 1. Línea Base y Toolkit de Análisis

Configuración del stack analítico (SonarQube, ESLint, Pylint, OWASP Dependency Check, Snyk, etc.) detallando su correspondencia con los lenguajes del sistema.

### 2. Radiografía de Calidad Interna & Deuda

Cuantificación automatizada de métricas de software esenciales: bugs, vulnerabilidades, densidad de líneas duplicadas y Code Smells críticos.

### 3. Diagnóstico de Mantenibilidad y Complejidad

Evaluación cualitativa justificada de la modularidad, acoplamiento, cohesión, clases Dios o métodos excesivamente largos y saturados de decisiones lógicas.

### 4. Auditoría de Seguridad OWASP Top 10

Evaluación exhaustiva de vulnerabilidades críticas en el sistema, analizando controles de acceso corporativos, fallas criptográficas, inyecciones (SQL/XSS) y configuraciones de entorno.

### 5. Gestión de Dependencias Inseguras

Inventario técnico de bibliotecas o paquetes de terceros obsoletos, sin mantenimiento comunitario activo o con vulnerabilidades (CVEs) conocidas.

### 6. Catálogo de Hallazgos y Refactorización

Matriz de remediación que asocie cada debilidad con una acción de ingeniería viable, confrontación final de cara a la norma ISO/IEC 25010 y dictamen técnico.

---

## ⚠️ Políticas Mandatorias de Auditoría

| Atributo Exigido         | Criterio de Evaluación de la Cátedra                                                                                                                                                          |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Respaldo Documental**  | Cada hallazgo, vulnerabilidad detectada o Code Smell crítico reportado debe contar estrictamente con su captura de pantalla o log del escáner técnico.                                        |
| **Rigurosidad en OWASP** | Para cada una de las categorías obligatorias analizadas, se exige detallar: ¿Existe riesgo?, Nivel del impacto, Evidencia de código y Recomendación.                                          |
| **Enfoque Proactivo**    | El foco pedagógico no mide la cantidad de errores que arroje la consola, sino la destreza analítica del equipo para interpretar la métrica y estructurar una estrategia viable de mitigación. |

---

## 📋 Lista de Verificación Interna Pre-Entrega

Asegúrese de validar meticulosamente cada control de calidad del código fuente antes de emitir la versión final de entrega:

- [ ] ¿El reporte define de forma clara y justificada la selección de herramientas de análisis automático?
- [ ] ¿Se incluyó un resumen explícito detallando el volumen neto de bugs, Code Smells y porcentaje de duplicación?
- [ ] ¿Se analizaron los componentes críticos o complejos apoyándose en las métricas de complejidad del escáner?
- [ ] ¿El mapeo frente a las categorías de OWASP Top 10 fue abordado de manera individual, profunda y con evidencias?
- [ ] ¿Cada hallazgo e inconsistencia se encuentra debidamente asociado a una propuesta real de refactorización?
- [ ] ¿Las conclusiones evalúan rigurosamente bajo la norma ISO/IEC 25010 si la arquitectura es apta para pruebas de carga?
