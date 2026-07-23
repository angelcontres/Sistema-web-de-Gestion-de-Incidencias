#!/bin/bash

# ==========================================
# 0. CONTROL DE SEÑALES Y LIMPIEZA AUTOMÁTICA
# ==========================================

# Función que se ejecuta automáticamente al presionar CTRL + C
limpiar_procesos() {
  echo ""
  gum style --foreground 136 "[INFO] Deteniendo servicios en segundo plano..."
  
  # Mata los trabajos hijos de este script
  local pids
  pids="$(jobs -p)"
  if [ -n "$pids" ]; then
    kill $pids 2>/dev/null || true
  fi
  # Por seguridad extra, libera los puertos por si acaso
  fuser -k 8001/tcp 8083/tcp 3006/tcp 2>/dev/null || true
  
  gum style --foreground 160 "[INFO] Todos los servicios fueron cerrados limpiamente."
  exit 0
}

# Atrapamos la señal SIGINT (CTRL + C) y SIGTERM para dirigirla a la función
trap limpiar_procesos SIGINT SIGTERM

# Limpieza silenciosa por si quedaron procesos zombis de ejecuciones anteriores
fuser -k 8001/tcp 8083/tcp 3006/tcp 2>/dev/null || true

# ==========================================
# 1. ENCABEZADO FORMAL
# ==========================================
if ! command -v gum &> /dev/null; then
  echo "------------------------------------------------------"
  echo "SISTEMA DE GESTION DE INCIDENCIAS"
  echo "Iniciando todos los servicios por defecto..."
  echo "(Nota: Instala 'gum' para tener menu interactivo)"
  echo "------------------------------------------------------"
  
  (cd backend/api && php artisan serve --port=8001) &
  echo "[OK] Laravel API: http://localhost:8001"
  
  (cd backend/api && php artisan reverb:start --port=8083) &
  echo "[OK] Servidor Reverb activo en puerto 8083"
  
  if command -v python3 &> /dev/null; then
    (cd frontend && python3 -m http.server 3006) &
  elif command -v python &> /dev/null; then
    (cd frontend && python -m http.server 3006) &
  else
    (cd frontend && php -S 127.0.0.1:3006 > /dev/null 2>&1) &
  fi
  echo "[OK] Frontend: http://localhost:3006"
  echo ""
  echo "Los servicios se encuentran ejecutando en segundo plano."
  echo "Presione [CTRL + C] en esta terminal para detener todos los procesos."
  wait
  exit 0
fi
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
  --selected="Laravel API (8001),WebSockets Reverb (8083),Frontend Python (3006)" \
  "Laravel API (8001)" \
  "WebSockets Reverb (8083)" \
  "Frontend Python (3006)")

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
if echo "$SERVICIOS" | grep -q "Laravel API (8001)"; then
  gum spin --spinner line --title "Iniciando Laravel API en puerto 8001..." -- sleep 1
  (cd backend/api && php artisan serve --port=8001) &
  gum style --foreground 70 "[OK] Laravel API: http://localhost:8001"
fi

if echo "$SERVICIOS" | grep -q "WebSockets Reverb (8083)"; then
  gum spin --spinner line --title "Iniciando servidor de WebSockets Reverb..." -- sleep 1
  (cd backend/api && php artisan reverb:start --port=8083) &
  gum style --foreground 70 "[OK] Servidor Reverb activo en puerto 8083"
fi

if echo "$SERVICIOS" | grep -q "Frontend Python (3006)"; then
  gum spin --spinner line --title "Iniciando servidor HTTP de Frontend..." -- sleep 1
  if command -v python3 &> /dev/null; then
    (cd frontend && python3 -m http.server 3006) &
  elif command -v python &> /dev/null; then
    (cd frontend && python -m http.server 3006) &
  else
    gum style --foreground 136 "[INFO] Python no encontrado, usando servidor de PHP..."
    (cd frontend && php -S 127.0.0.1:3006 > /dev/null 2>&1) &
  fi
  gum style --foreground 70 "[OK] Frontend: http://localhost:3006"
fi

echo ""
gum style --foreground 240 "Los servicios se encuentran ejecutando en segundo plano."
gum style --foreground 240 "Presione [CTRL + C] en esta terminal para detener todos los procesos."

# Mantiene el script en espera para que el trap escuche el CTRL+C
wait