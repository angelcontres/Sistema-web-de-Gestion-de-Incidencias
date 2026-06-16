/**
 * Reusable Card component for Statistics
 */
export class StatsCard extends HTMLElement {
  constructor() {
    super();
  }

  static get observedAttributes() {
    return ['card-title', 'card-value', 'type'];
  }

  connectedCallback() {
    this.render();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (oldValue !== newValue) {
      this.render();
    }
  }

  render() {
    const title = this.getAttribute('card-title') || 'Métrica';
    const value = this.getAttribute('card-value') || '0';
    const type = this.getAttribute('type') || 'primary'; // primary, success, warning, danger
    
    // Set custom badge and border styling based on the type
    let badgeClass = 'bg-primary-soft';
    let textClass = 'text-primary';
    
    if (type === 'success') {
      badgeClass = 'bg-success-soft';
      textClass = 'text-success';
    } else if (type === 'warning') {
      badgeClass = 'bg-warning-soft';
      textClass = 'text-warning';
    } else if (type === 'danger') {
      badgeClass = 'bg-danger-soft';
      textClass = 'text-danger';
    }

    this.innerHTML = `
      <div class="card custom-card h-100">
        <div class="card-body p-4 d-flex flex-column justify-content-between">
          <div class="d-flex justify-content-between align-items-start mb-2">
            <h6 class="card-subtitle text-uppercase fw-bold text-muted small tracking-wide">${title}</h6>
            <span class="badge ${badgeClass} fw-bold rounded-pill px-2.5 py-1.5 fs-7">${type}</span>
          </div>
          <div class="stat-value ${textClass}">${value}</div>
        </div>
      </div>
    `;
  }
}

customElements.define('stats-card', StatsCard);
