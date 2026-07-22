export class MascotAnimation {
  /**
   * Initializes the interactive mascot animations.
   * @param {HTMLElement} component - The root element (web component) containing the mascot DOM.
   */
  constructor(component) {
    this.component = component;
  }

  /**
   * Binds all event listeners for the mascot's interactive features.
   */
  init() {
    this.initPrivacyMode();
    this.initMouseTracking();
    this.initEasterEgg();
  }

  initPrivacyMode() {
    const passwordInput = this.component.querySelector('#passwordInput');
    const svgContainer = this.component.querySelector('.animated-svg');

    if (passwordInput && svgContainer) {
      passwordInput.addEventListener('focus', () => {
        svgContainer.classList.add('privacy-mode');
      });
      passwordInput.addEventListener('blur', () => {
        svgContainer.classList.remove('privacy-mode');
      });
    }
  }

  initMouseTracking() {
    const robotEyes = this.component.querySelector('#robot-eyes');

    if (robotEyes) {
      this.component.addEventListener('mousemove', (e) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 24; 
        const y = (e.clientY / window.innerHeight - 0.5) * 16;
        robotEyes.style.setProperty('--mouse-x', `${x}px`);
        robotEyes.style.setProperty('--mouse-y', `${y}px`);
      });
      
      this.component.addEventListener('mouseleave', () => {
        robotEyes.style.setProperty('--mouse-x', `0px`);
        robotEyes.style.setProperty('--mouse-y', `0px`);
      });
    }
  }

  initEasterEgg() {
    const interactiveZone = this.component.querySelector('#robot-interactive-zone');
    const logoCircle = this.component.querySelector('.logo-container');
    
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
