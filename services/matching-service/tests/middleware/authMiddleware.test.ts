import { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../src/middleware/authMiddleware';

// Mock Firebase admin completely to avoid initialization issues
jest.mock('../../src/config/firebase', () => ({
  default: {
    apps: [],
    initializeApp: jest.fn(),
    auth: jest.fn(() => ({
      verifyIdToken: jest.fn()
    }))
  }
}));

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;
  let mockAdmin: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockReq = {
      headers: {}
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();

    // Get the mocked Firebase admin instance
    const firebaseModule = require('../../src/config/firebase');
    mockAdmin = firebaseModule.default;
  });

  describe('WITH_AUTH=false (Development Mode)', () => {
    beforeEach(() => {
      process.env.WITH_AUTH = 'false';
    });

    it('should set user from X-Dev-Email header', async () => {
      mockReq.headers = { 'x-dev-email': 'dev@example.com' };

      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).user).toEqual({
        email: 'dev@example.com',
        username: 'dev'
      });
    });

    it('should use default email when X-Dev-Email header is missing', async () => {
      mockReq.headers = {};
      await authenticate(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect((mockReq as any).user).toEqual({
        email: 'test@gmail.com',
        username: 'test'
      });
    });
  });

});