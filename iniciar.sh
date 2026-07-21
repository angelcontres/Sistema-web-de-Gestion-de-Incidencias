#!/bin/bash

# ==========================================
# 0. CONTROL DE SEÑALES Y LIMPIEZA AUTOMÁTICA
# ==========================================

# Función que se ejecuta automáticamente al presionar CTRL + C
limpiar_procesos() {
  echo ""
  gum style --foreground 136 "[INFO] Deteniendo servicios en segundo plano..."
  
  # Mata los trabajos hijos de este script
  kill $(jobs -p) 2>/dev/null || true
  
  # Por seguridad extra, libera los puertos por si acaso
  fuser -k 8000/tcp 8080/tcp 3000/tcp 2>/dev/null || true
  
  gum style --foreground 160 "[INFO] Todos los servicios fueron cerrados limpiamente."
  exit 0
}

# Atrapamos la señal SIGINT (CTRL + C) y SIGTERM para dirigirla a la función
trap limpiar_procesos SIGINT SIGTERM

# Limpieza silenciosa por si quedaron procesos zombis de ejecuciones anteriores
fuser -k 8000/tcp 8080/tcp 3000/tcp 2>/dev/null || true

# ==========================================
# 1. ENCABEZADO FORMAL
# ==========================================
gum style \
  --border normal \
  --border-foreground 240 \
  --padding "1 2" \
  --margin "1 0" \
  --align center \
  "SISTEMA DE GESTION DE INCIDENCIAS" \
  "Panel de control de entorno local"

# ==========================================
# 2. SELECCIÓN DE SERVICIOS
# ==========================================
echo "Seleccione los servicios que desea iniciar:"
SERVICIOS=$(gum choose --no-limit --cursor="> " \
  --selected="Laravel API (8000),WebSockets Reverb (8080),Frontend Python (3000)" \
  "Laravel API (8000)" \
  "WebSockets Reverb (8080)" \
  "Frontend Python (3000)")

if [ -z "$SERVICIOS" ]; then
  gum style --foreground 160 "[INFO] Operacion cancelada. No se seleccionaron servicios."
  exit 0
fi

# ==========================================
# 3. CONFIRMACIÓN DE EJECUCIÓN
# ==========================================
if ! gum confirm "Confirmar inicio de los servicios seleccionados?"; then
  gum style --foreground 136 "[INFO] Operacion abortada por el usuario."
  exit 0
fi

echo ""

# ==========================================
# 4. INICIALIZACIÓN EN SEGUNDO PLANO
# ==========================================
if echo "$SERVICIOS" | grep -q "Laravel API (8000)"; then
  gum spin --spinner line --title "Iniciando Laravel API en puerto 8000..." -- sleep 1
  (cd backend/api && php artisan serve) &
  gum style --foreground 70 "[OK] Laravel API: http://localhost:8000"
fi

if echo "$SERVICIOS" | grep -q "WebSockets Reverb (8080)"; then
  gum spin --spinner line --title "Iniciando servidor de WebSockets Reverb..." -- sleep 1
  (cd backend/api && php artisan reverb:start) &
  gum style --foreground 70 "[OK] Servidor Reverb activo en puerto 8080"
fi

if echo "$SERVICIOS" | grep -q "Frontend Python (3000)"; then
  gum spin --spinner line --title "Iniciando servidor HTTP de Frontend..." -- sleep 1
  if command -v python3 &> /dev/null; then
    (cd frontend && python3 -m http.server 3000) &
  else
    (cd frontend && python -m http.server 3000) &
  fi
  gum style --foreground 70 "[OK] Frontend: http://localhost:3000"
fi

echo ""
gum style --foreground 240 "Los servicios se encuentran ejecutando en segundo plano."
gum style --foreground 240 "Presione [CTRL + C] en esta terminal para detener todos los procesos."

# Mantiene el script en espera para que el trap escuche el CTRL+C
wait