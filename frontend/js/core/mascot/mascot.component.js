import { BaseComponent } from '../base-component.js';

export class MascotComponent extends BaseComponent {
  constructor() {
    super('js/core/mascot/mascot.component.html');
  }

  onInit() {
    this.initMouseTracking();
    this.initEasterEgg();
  }

  setPrivacyMode(active) {
    const svgContainer = this.querySelector('.animated-svg');
    if (svgContainer) {
      if (active) {
        svgContainer.classList.add('privacy-mode');
      } else {
        svgContainer.classList.remove('privacy-mode');
      }
    }
  }

  initMouseTracking() {
    const robotEyes = this.querySelector('#robot-eyes');
    if (!robotEyes) return;

    this.addEventListener('mousemove', (e) => {
      const rect = this.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 24; 
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 16;
      robotEyes.style.setProperty('--mouse-x', `${x}px`);
      robotEyes.style.setProperty('--mouse-y', `${y}px`);
    });
    
    this.addEventListener('mouseleave', () => {
      robotEyes.style.setProperty('--mouse-x', `0px`);
      robotEyes.style.setProperty('--mouse-y', `0px`);
    });
  }

  initEasterEgg() {
    const interactiveZone = this.querySelector('#robot-interactive-zone');
    const logoCircle = this.querySelector('.logo-container');
    
    if (logoCircle && interactiveZone) {
      logoCircle.addEventListener('click', () => {
        if (interactiveZone.classList.contains('radar-mode')) return;
        
        interactiveZone.classList.add('radar-mode');
        logoCircle.classList.add('spin-3d');
        
        setTimeout(() => {
          interactiveZone.classList.remove('radar-mode');
          logoCircle.classList.remove('spin-3d');
        }, 3500);
      });
    }
  }
}

customElements.define('app-mascot', MascotComponent);
