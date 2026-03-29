import { Request, Response } from 'express';
import { joinQueue, leaveQueue } from '../../src/controllers/queueController';
import { 
  addUserToQueue, 
  removeUserFromQueue, 
  getUserQueue, 
  getQueue 
} from '../../src/services/queueService';
import { 
  registerConnection, 
  closeConnection, 
  isActiveConnection, 
  setCleanup 
} from '../../src/sse/connectionManager';

// Mock dependencies
jest.mock('../../src/services/queueService');
jest.mock('../../src/sse/connectionManager');

const mockAddUserToQueue = addUserToQueue as jest.MockedFunction<typeof addUserToQueue>;
const mockRemoveUserFromQueue = removeUserFromQueue as jest.MockedFunction<typeof removeUserFromQueue>;
const mockGetUserQueue = getUserQueue as jest.MockedFunction<typeof getUserQueue>;
const mockGetQueue = getQueue as jest.MockedFunction<typeof getQueue>;
const mockRegisterConnection = registerConnection as jest.MockedFunction<typeof registerConnection>;
const mockCloseConnection = closeConnection as jest.MockedFunction<typeof closeConnection>;
const mockIsActiveConnection = isActiveConnection as jest.MockedFunction<typeof isActiveConnection>;
const mockSetCleanup = setCleanup as jest.MockedFunction<typeof setCleanup>;

// Mock environment variables
process.env.MATCHING_TIMEOUT_MS = '5000';

describe('Queue Controller - Core Functionality', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    mockReq = {
      body: {
        topic: 'arrays',
        difficulty: 'medium'
      },
      headers: {}
    };
    
    mockRes = {
      setHeader: jest.fn(),
      flushHeaders: jest.fn(),
      write: jest.fn(),
      end: jest.fn(),
      json: jest.fn(),
      on: jest.fn()
    };

    // Mock user from auth middleware
    (mockReq as any).user = {
      email: 'test@example.com'
    };
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('joinQueue', () => {
    it('should join queue and set up SSE connection', async () => {
      mockGetUserQueue.mockResolvedValue(null);
      mockGetQueue.mockResolvedValue(['test@example.com']);
      mockIsActiveConnection.mockReturnValue(true);

      await joinQueue(mockReq as Request, mockRes as Response);

      expect(mockGetUserQueue).toHaveBeenCalledWith('test@example.com');
      expect(mockAddUserToQueue).toHaveBeenCalledWith('test@example.com', 'queue:arrays:medium');
      expect(mockRegisterConnection).toHaveBeenCalledWith('test@example.com', mockRes);
      expect(mockSetCleanup).toHaveBeenCalledWith('test@example.com', expect.any(Function));
      
      // Check SSE headers
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'text/event-stream');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Cache-Control', 'no-cache');
      expect(mockRes.setHeader).toHaveBeenCalledWith('Connection', 'keep-alive');
      expect(mockRes.flushHeaders).toHaveBeenCalled();
    });

    it('should remove existing queue entry before joining', async () => {
      mockGetUserQueue.mockResolvedValue('queue:strings:easy');
      mockGetQueue.mockResolvedValue(['test@example.com']);
      mockIsActiveConnection.mockReturnValue(true);

      await joinQueue(mockReq as Request, mockRes as Response);

      expect(mockRemoveUserFromQueue).toHaveBeenCalledWith('test@example.com');
      expect(mockAddUserToQueue).toHaveBeenCalledWith('test@example.com', 'queue:arrays:medium');
    });

    it('should handle connection close properly', async () => {
      mockGetUserQueue.mockResolvedValue(null);
      mockGetQueue.mockResolvedValue(['test@example.com']);
      mockIsActiveConnection.mockReturnValue(true);

      await joinQueue(mockReq as Request, mockRes as Response);

      // Simulate connection close
      const closeHandler = (mockRes.on as jest.Mock).mock.calls.find(call => call[0] === 'close')[1];
      await closeHandler();

      expect(mockRemoveUserFromQueue).toHaveBeenCalledWith('test@example.com');
      expect(mockCloseConnection).toHaveBeenCalledWith('test@example.com');
      expect(mockRes.end).toHaveBeenCalled();
    });

  });

  describe('leaveQueue', () => {
    it('should leave queue and close connection', async () => {
      mockGetUserQueue.mockResolvedValue('queue:arrays:medium');

      await leaveQueue(mockReq as Request, mockRes as Response);

      expect(mockGetUserQueue).toHaveBeenCalledWith('test@example.com');
      expect(mockRemoveUserFromQueue).toHaveBeenCalledWith('test@example.com');
      expect(mockRes.json).toHaveBeenCalledWith({ message: 'Left queue' });
      expect(mockCloseConnection).toHaveBeenCalledWith('test@example.com');
    });

    it('should return message if user is not in queue', async () => {
      mockGetUserQueue.mockResolvedValue(null);

      await leaveQueue(mockReq as Request, mockRes as Response);

      expect(mockRes.json).toHaveBeenCalledWith({ message: 'User not in queue' });
      expect(mockRemoveUserFromQueue).not.toHaveBeenCalled();
      expect(mockCloseConnection).not.toHaveBeenCalled();
    });
  });
});