export const STATE_CLASSES = {
  'Pendiente': {
    badge: 'secondary',
    text: 'secondary',
    soft: 'bg-secondary-soft text-secondary border-secondary border-opacity-25'
  },
  'En Revisión': {
    badge: 'warning',
    text: 'warning',
    soft: 'bg-warning-soft text-warning border-warning border-opacity-25'
  },
  'En Proceso': {
    badge: 'info',
    text: 'info',
    soft: 'bg-info-soft text-info border-info border-opacity-25'
  },
  'Resuelto': {
    badge: 'success',
    text: 'success',
    soft: 'bg-success-soft text-success border-success border-opacity-25'
  },
  'Resuelta': {
    badge: 'success',
    text: 'success',
    soft: 'bg-success-soft text-success border-success border-opacity-25'
  },
  'Rechazado': {
    badge: 'danger',
    text: 'danger',
    soft: 'bg-danger-soft text-danger border-danger border-opacity-25'
  }
};

export function getBadgeClass(estado) {
  const nombre = (estado && typeof estado === 'object') ? estado.nombre : estado;
  return STATE_CLASSES[nombre]?.badge || 'secondary';
}

export function getTextColorClass(estado) {
  const nombre = (estado && typeof estado === 'object') ? estado.nombre : estado;
  return STATE_CLASSES[nombre]?.text || 'secondary';
}

export function getSoftClass(estado) {
  const nombre = (estado && typeof estado === 'object') ? estado.nombre : estado;
  return STATE_CLASSES[nombre]?.soft || 'bg-secondary-soft text-secondary border-secondary border-opacity-25';
}
