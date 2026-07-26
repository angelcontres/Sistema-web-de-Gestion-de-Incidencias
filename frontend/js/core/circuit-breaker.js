export class CircuitBreaker {
  constructor(maxFailures = 3, resetTimeout = 30000) {
    this.maxFailures = maxFailures;
    this.resetTimeout = resetTimeout;
    this.failures = 0;
    this.state = 'CLOSED'; // CLOSED, HALF_OPEN, OPEN
    this.nextAttempt = 0;
  }

  async fire(requestFn) {
    if (this.state === 'OPEN') {
      const now = Date.now();
      if (now >= this.nextAttempt) {
        this.state = 'HALF_OPEN';
      } else {
        const remaining = Math.ceil((this.nextAttempt - now) / 1000);
        console.error(
          `Demasiados intentos fallidos. Por favor, espere ${remaining} segundos antes de reintentar.`
        );
      }
    }

    try {
      const result = await requestFn();
      this.onSuccess();
      return result;
    } catch (err) {
      this.onFailure();
      throw err;
    }
  }

  onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  onFailure() {
    this.failures++;
    if (this.failures >= this.maxFailures) {
      this.state = 'OPEN';
      this.nextAttempt = Date.now() + this.resetTimeout;
    }
  }
}
