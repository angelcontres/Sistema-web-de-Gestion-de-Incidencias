import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CircuitBreaker } from './circuit-breaker.js';

describe('CircuitBreaker', () => {
  let cb;

  beforeEach(() => {
    cb = new CircuitBreaker();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('constructor uses default values', () => {
    expect(cb.maxFailures).toBe(3);
    expect(cb.resetTimeout).toBe(30000);
    expect(cb.failures).toBe(0);
    expect(cb.state).toBe('CLOSED');
    expect(cb.nextAttempt).toBe(0);
  });

  it('constructor uses custom values', () => {
    const cb2 = new CircuitBreaker(5, 10000);
    expect(cb2.maxFailures).toBe(5);
    expect(cb2.resetTimeout).toBe(10000);
  });

  it('fire succeeds and transitions to CLOSED, resets failures', async () => {
    cb.failures = 2;
    const requestFn = jest.fn().mockResolvedValue('ok');
    const result = await cb.fire(requestFn);
    expect(result).toBe('ok');
    expect(cb.state).toBe('CLOSED');
    expect(cb.failures).toBe(0);
  });

  it('fire fails once — state stays CLOSED, failures incremented', async () => {
    const requestFn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(cb.fire(requestFn)).rejects.toThrow('fail');
    expect(cb.state).toBe('CLOSED');
    expect(cb.failures).toBe(1);
  });

  it('fire fails maxFailures times — state becomes OPEN, nextAttempt set', async () => {
    const requestFn = jest.fn().mockRejectedValue(new Error('fail'));
    await expect(cb.fire(requestFn)).rejects.toThrow('fail');
    expect(cb.failures).toBe(1);
    await expect(cb.fire(requestFn)).rejects.toThrow('fail');
    expect(cb.failures).toBe(2);
    await expect(cb.fire(requestFn)).rejects.toThrow('fail');
    expect(cb.failures).toBe(3);
    expect(cb.state).toBe('OPEN');
    expect(cb.nextAttempt).toBeGreaterThan(0);
  });

  it('fire when OPEN and not yet time — returns undefined, logs error', async () => {
    const now = 1000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    cb.state = 'OPEN';
    cb.nextAttempt = 50000;
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const requestFn = jest.fn();
    const result = await cb.fire(requestFn);
    expect(result).toBeUndefined();
    expect(errorSpy).toHaveBeenCalled();
    expect(requestFn).not.toHaveBeenCalled();
  });

  it('fire when OPEN and time has passed — transitions to HALF_OPEN then calls requestFn', async () => {
    const now = 60000;
    jest.spyOn(Date, 'now').mockReturnValue(now);
    cb.state = 'OPEN';
    cb.nextAttempt = 50000;
    const requestFn = jest.fn().mockResolvedValue('recovered');
    const result = await cb.fire(requestFn);
    expect(result).toBe('recovered');
    expect(cb.state).toBe('CLOSED');
    expect(cb.failures).toBe(0);
  });

  it('onSuccess resets failures and sets CLOSED', () => {
    cb.failures = 5;
    cb.state = 'OPEN';
    cb.onSuccess();
    expect(cb.failures).toBe(0);
    expect(cb.state).toBe('CLOSED');
  });

  it('onFailure increments failures and opens at threshold', () => {
    cb.onFailure();
    expect(cb.failures).toBe(1);
    expect(cb.state).toBe('CLOSED');
    cb.onFailure();
    expect(cb.failures).toBe(2);
    expect(cb.state).toBe('CLOSED');
    cb.onFailure();
    expect(cb.failures).toBe(3);
    expect(cb.state).toBe('OPEN');
    expect(cb.nextAttempt).toBeGreaterThan(0);
  });
});
