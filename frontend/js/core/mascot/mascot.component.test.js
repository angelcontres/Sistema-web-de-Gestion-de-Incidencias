import { jest, describe, it, expect, beforeAll, beforeEach, afterEach } from '@jest/globals';

const MASCOT_TEMPLATE = `
  <div class="animated-svg">
    <div id="robot-eyes"></div>
    <div id="robot-interactive-zone"></div>
    <div class="logo-container"></div>
  </div>
`;

describe('MascotComponent', () => {
  let MascotComponent;

  beforeAll(async () => {
    const mod = await import('./mascot.component.js');
    MascotComponent = mod.MascotComponent;
  });

  beforeEach(() => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => MASCOT_TEMPLATE,
    });
    document.body.innerHTML = '';
  });

  afterEach(() => {
    delete global.fetch;
    jest.restoreAllMocks();
    document.body.innerHTML = '';
  });

  async function createComponent() {
    const el = document.createElement('app-mascot');
    document.body.appendChild(el);
    for (let i = 0; i < 5; i++) await new Promise(process.nextTick);
    return el;
  }

  it('se define como custom element app-mascot', () => {
    expect(customElements.get('app-mascot')).toBe(MascotComponent);
  });

  it('setPrivacyMode(true) anade clase privacy-mode a .animated-svg', async () => {
    const el = await createComponent();
    el.setPrivacyMode(true);
    expect(el.querySelector('.animated-svg').classList.contains('privacy-mode')).toBe(true);
    document.body.removeChild(el);
  });

  it('setPrivacyMode(false) elimina clase privacy-mode de .animated-svg', async () => {
    const el = await createComponent();
    el.setPrivacyMode(true);
    el.setPrivacyMode(false);
    expect(el.querySelector('.animated-svg').classList.contains('privacy-mode')).toBe(false);
    document.body.removeChild(el);
  });

  it('setPrivacyMode no hace nada si .animated-svg no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<div></div>',
    });
    const el = await createComponent();
    expect(() => el.setPrivacyMode(true)).not.toThrow();
    document.body.removeChild(el);
  });

  it('initMouseTracking responde a mousemove/mouseleave y actualiza CSS vars', async () => {
    const el = await createComponent();
    const robotEyes = el.querySelector('#robot-eyes');

    jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
      left: 0, top: 0, width: 200, height: 100, right: 200, bottom: 100,
    });

    el.dispatchEvent(new MouseEvent('mousemove', { clientX: 100, clientY: 50 }));
    expect(robotEyes.style.getPropertyValue('--mouse-x')).toBe('0px');
    expect(robotEyes.style.getPropertyValue('--mouse-y')).toBe('0px');

    el.dispatchEvent(new MouseEvent('mouseleave'));
    expect(robotEyes.style.getPropertyValue('--mouse-x')).toBe('0px');
    expect(robotEyes.style.getPropertyValue('--mouse-y')).toBe('0px');

    jest.restoreAllMocks();
    document.body.removeChild(el);
  });

  it('initMouseTracking no falla si #robot-eyes no existe', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<div class="animated-svg"></div>',
    });
    const el = await createComponent();
    expect(() => {
      el.dispatchEvent(new MouseEvent('mousemove', { clientX: 50, clientY: 50 }));
      el.dispatchEvent(new MouseEvent('mouseleave'));
    }).not.toThrow();
    document.body.removeChild(el);
  });

  it('initEasterEgg activa radar-mode y spin-3d al clickear logo y los limpia tras 3500ms', async () => {
    const el = await createComponent();
    const logo = el.querySelector('.logo-container');
    const zone = el.querySelector('#robot-interactive-zone');

    jest.useFakeTimers();
    logo.click();
    expect(zone.classList.contains('radar-mode')).toBe(true);
    expect(logo.classList.contains('spin-3d')).toBe(true);

    jest.advanceTimersByTime(3500);
    expect(zone.classList.contains('radar-mode')).toBe(false);
    expect(logo.classList.contains('spin-3d')).toBe(false);

    jest.useRealTimers();
    document.body.removeChild(el);
  });

  it('initEasterEgg previene doble disparo si ya esta en radar-mode', async () => {
    const el = await createComponent();
    const logo = el.querySelector('.logo-container');
    const zone = el.querySelector('#robot-interactive-zone');

    jest.useFakeTimers();
    logo.click();
    logo.click();

    expect(zone.classList.contains('radar-mode')).toBe(true);
    jest.advanceTimersByTime(3500);
    expect(zone.classList.contains('radar-mode')).toBe(false);

    jest.useRealTimers();
    document.body.removeChild(el);
  });

  it('initEasterEgg no hace nada si faltan elementos en el DOM', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      text: async () => '<div class="animated-svg"></div>',
    });
    const el = await createComponent();
    expect(() => el.initEasterEgg()).not.toThrow();
    document.body.removeChild(el);
  });

  it('onInit llama initMouseTracking e initEasterEgg', async () => {
    const mouseSpy = jest.spyOn(MascotComponent.prototype, 'initMouseTracking');
    const eggSpy = jest.spyOn(MascotComponent.prototype, 'initEasterEgg');

    const el = await createComponent();

    expect(mouseSpy).toHaveBeenCalled();
    expect(eggSpy).toHaveBeenCalled();

    jest.restoreAllMocks();
    document.body.removeChild(el);
  });
});
