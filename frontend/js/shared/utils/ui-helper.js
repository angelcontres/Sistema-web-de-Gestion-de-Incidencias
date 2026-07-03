/**
 * UI Helper Utilities for the Frontend Application
 */
export const UIHelper = {
  /**
   * Dynamically creates, injects, and auto-dismisses a Bootstrap 5 alert.
   * @param {HTMLElement} component - The custom element component where the alert will be shown.
   * @param {'success'|'error'} tipo - The type of the alert.
   * @param {string} mensaje - The message to display.
   */
  mostrarAlerta(component, tipo, mensaje) {
    // Find or create an alert container at the very top of the component
    let alertContainer = component.querySelector('.alert-container');
    if (!alertContainer) {
      alertContainer = document.createElement('div');
      alertContainer.className = 'alert-container w-100 mb-3';
      component.insertBefore(alertContainer, component.firstChild);
    }

    // Clear any previous alerts in this container
    alertContainer.innerHTML = '';

    // Create the Bootstrap 5 alert element
    const alertEl = document.createElement('div');
    const isSuccess = tipo === 'success';
    alertEl.className = `alert alert-${isSuccess ? 'success' : 'danger'} alert-dismissible fade show shadow-sm d-flex align-items-center gap-2 mb-0`;
    alertEl.role = 'alert';

    const icon = isSuccess ? 'bi-check-circle-fill' : 'bi-exclamation-triangle-fill';

    alertEl.innerHTML = `
      <i class="bi ${icon} fs-5"></i>
      <div class="flex-grow-1 small">${mensaje}</div>
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;

    alertContainer.appendChild(alertEl);

    // Auto-dismiss the alert after 5 seconds using Bootstrap's native close trigger
    setTimeout(() => {
      const closeBtn = alertEl.querySelector('.btn-close');
      if (closeBtn) {
        closeBtn.click();
      } else {
        alertEl.remove();
      }
    }, 5000);
  }
};
