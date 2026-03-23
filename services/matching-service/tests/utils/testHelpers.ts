import { Request, Response } from 'express';

/**
 * Creates a mock request object with optional user and body
 */
export function createMockRequest(overrides: any = {}): Partial<Request> {
  return {
    body: {},
    headers: {},
    params: {},
    query: {},
    ...overrides
  };
}

/**
 * Creates a mock response object
 */
export function createMockResponse(): Partial<Response> {
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    write: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    flushHeaders: jest.fn().mockReturnThis(),
    on: jest.fn().mockReturnThis(),
    removeListener: jest.fn().mockReturnThis()
  };
  return res;
}

/**
 * Creates a mock user object
 */
export function createMockUser(email: string = 'test@example.com') {
  return {
    email,
    username: email.split('@')[0]
  };
}

/**
 * Waits for a specified amount of time (useful for async operations)
 */
export function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Mocks console methods to reduce test noise
 */
export function mockConsole() {
  const originalConsole = { ...console };
  console.log = jest.fn();
  console.info = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  
  return () => {
    console.log = originalConsole.log;
    console.info = originalConsole.info;
    console.warn = originalConsole.warn;
    console.error = originalConsole.error;
  };
}