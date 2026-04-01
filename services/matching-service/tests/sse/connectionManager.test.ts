import { Response } from 'express';
import { 
  registerConnection, 
  setCleanup, 
  isActiveConnection, 
  sendEvent, 
  closeConnection 
} from '../../src/sse/connectionManager';

// Mock Redis client
jest.mock('../../src/redis/redisClient', () => ({
  redisClient: {
    lRem: jest.fn(),
    lPush: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    lRange: jest.fn(),
    eval: jest.fn()
  }
}));

describe('Connection Manager', () => {
  let mockRes: Partial<Response>;
  let mockCleanup: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      write: jest.fn(),
      end: jest.fn(),
      setHeader: jest.fn(),
      flushHeaders: jest.fn()
    };
    mockCleanup = jest.fn();
  });

  describe('registerConnection', () => {
    it('should register a new connection', () => {
      registerConnection('test@example.com', mockRes as Response);

      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(true);
    });

    it('should replace existing connection and call cleanup', () => {
      const oldRes = { write: jest.fn(), end: jest.fn() } as Response;
      registerConnection('test@example.com', oldRes);
      setCleanup('test@example.com', mockCleanup);

      registerConnection('test@example.com', mockRes as Response);

      expect(mockCleanup).toHaveBeenCalled();
      expect(oldRes.end).toHaveBeenCalled();
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(true);
      expect(isActiveConnection('test@example.com', oldRes)).toBe(false);
    });

    it('should handle multiple users independently', () => {
      const user1Res = { write: jest.fn(), end: jest.fn() } as Response;
      const user2Res = { write: jest.fn(), end: jest.fn() } as Response;

      registerConnection('user1@example.com', user1Res);
      registerConnection('user2@example.com', user2Res);

      expect(isActiveConnection('user1@example.com', user1Res)).toBe(true);
      expect(isActiveConnection('user2@example.com', user2Res)).toBe(true);
      expect(isActiveConnection('user1@example.com', user2Res)).toBe(false);
    });
  });

  describe('setCleanup', () => {
    it('should set cleanup function for existing connection', () => {
      registerConnection('test@example.com', mockRes as Response);
      setCleanup('test@example.com', mockCleanup);

      expect(mockCleanup).not.toHaveBeenCalled();
    });

    it('should not set cleanup for non-existent connection', () => {
      setCleanup('test@example.com', mockCleanup);

      expect(mockCleanup).not.toHaveBeenCalled();
    });
  });

  describe('isActiveConnection', () => {
    it('should return true for active connection', () => {
      registerConnection('test@example.com', mockRes as Response);

      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(true);
    });

    it('should return false for non-existent connection', () => {
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(false);
    });

    it('should return false for replaced connection', () => {
      const oldRes = { write: jest.fn(), end: jest.fn() } as Response;
      registerConnection('test@example.com', oldRes);
      registerConnection('test@example.com', mockRes as Response);

      expect(isActiveConnection('test@example.com', oldRes)).toBe(false);
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(true);
    });

    it('should return false for different response object', () => {
      registerConnection('test@example.com', mockRes as Response);
      const differentRes = { write: jest.fn(), end: jest.fn() } as Response;

      expect(isActiveConnection('test@example.com', differentRes)).toBe(false);
    });
  });

  describe('sendEvent', () => {
    it('should send event to active connection', () => {
      registerConnection('test@example.com', mockRes as Response);
      const eventData = { type: 'TEST_EVENT', data: 'test' };

      sendEvent('test@example.com', eventData);

      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify(eventData)}\n\n`);
    });

    it('should not send event to non-existent connection', () => {
      const eventData = { type: 'TEST_EVENT', data: 'test' };

      sendEvent('test@example.com', eventData);

      expect(mockRes.write).not.toHaveBeenCalled();
    });

    it('should send event to correct user only', () => {
      const user1Res = { write: jest.fn(), end: jest.fn() } as Response;
      const user2Res = { write: jest.fn(), end: jest.fn() } as Response;
      registerConnection('user1@example.com', user1Res);
      registerConnection('user2@example.com', user2Res);

      const eventData = { type: 'TEST_EVENT', data: 'test' };
      sendEvent('user1@example.com', eventData);

      expect(user1Res.write).toHaveBeenCalledWith(`data: ${JSON.stringify(eventData)}\n\n`);
      expect(user2Res.write).not.toHaveBeenCalled();
    });
  });

  describe('closeConnection', () => {
    it('should close active connection and call cleanup', () => {
      registerConnection('test@example.com', mockRes as Response);
      setCleanup('test@example.com', mockCleanup);

      closeConnection('test@example.com');

      expect(mockCleanup).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(false);
    });

    it('should close connection without cleanup', () => {
      registerConnection('test@example.com', mockRes as Response);

      closeConnection('test@example.com');

      expect(mockCleanup).not.toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(false);
    });

    it('should handle non-existent connection gracefully', () => {
      closeConnection('test@example.com');

      expect(mockRes.end).not.toHaveBeenCalled();
      expect(mockCleanup).not.toHaveBeenCalled();
    });

    it('should remove connection from registry', () => {
      registerConnection('test@example.com', mockRes as Response);
      registerConnection('user2@example.com', { write: jest.fn(), end: jest.fn() } as Response);

      closeConnection('test@example.com');

      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(false);
      expect(isActiveConnection('user2@example.com', mockRes as Response)).toBe(false);
    });

    it('should handle multiple connections independently', () => {
      const user1Res = { write: jest.fn(), end: jest.fn() } as Response;
      const user2Res = { write: jest.fn(), end: jest.fn() } as Response;
      registerConnection('user1@example.com', user1Res);
      registerConnection('user2@example.com', user2Res);

      closeConnection('user1@example.com');

      expect(user1Res.end).toHaveBeenCalled();
      expect(user2Res.end).not.toHaveBeenCalled();
      expect(isActiveConnection('user1@example.com', user1Res)).toBe(false);
      expect(isActiveConnection('user2@example.com', user2Res)).toBe(true);
    });
  });

  describe('Connection Lifecycle', () => {
    it('should handle complete lifecycle: register -> send -> close', () => {
      registerConnection('test@example.com', mockRes as Response);
      setCleanup('test@example.com', mockCleanup);

      const eventData = { type: 'LIFECYCLE_TEST', data: 'test' };
      sendEvent('test@example.com', eventData);

      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify(eventData)}\n\n`);

      closeConnection('test@example.com');

      expect(mockCleanup).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(false);
    });

    it('should handle connection replacement gracefully', () => {
      const oldRes = { write: jest.fn(), end: jest.fn() } as Response;
      registerConnection('test@example.com', oldRes);
      setCleanup('test@example.com', mockCleanup);

      // Send event to old connection
      sendEvent('test@example.com', { type: 'OLD_CONNECTION' });
      expect(oldRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ type: 'OLD_CONNECTION' })}\n\n`);

      // Replace connection
      registerConnection('test@example.com', mockRes as Response);

      // Old connection should be cleaned up
      expect(mockCleanup).toHaveBeenCalled();
      expect(oldRes.end).toHaveBeenCalled();

      // New connection should be active
      expect(isActiveConnection('test@example.com', mockRes as Response)).toBe(true);
      expect(isActiveConnection('test@example.com', oldRes)).toBe(false);

      // Event should go to new connection
      sendEvent('test@example.com', { type: 'NEW_CONNECTION' });
      expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify({ type: 'NEW_CONNECTION' })}\n\n`);
      expect(oldRes.write).toHaveBeenCalledTimes(1); // Only the first event
    });
  });
});