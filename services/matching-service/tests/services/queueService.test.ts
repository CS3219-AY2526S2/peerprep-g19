import { redisClient } from '../../src/redis/redisClient';
import {
  addUserToQueue,
  removeUserFromQueue,
  removeQueueMapping,
  getUserQueue,
  getQueue,
  atomicPopPair
} from '../../src/services/queueService';

// Mock Redis client
jest.mock('../../src/redis/redisClient', () => ({
  redisClient: {
    lRem: jest.fn(),
    lPush: jest.fn(),
    set: jest.fn(),
    get: jest.fn(),
    del: jest.fn(),
    lRange: jest.fn(),
    eval: jest.fn(),
    connect: jest.fn(),
    disconnect: jest.fn()
  }
}));

describe('Queue Service', () => {
  let mockRedisClient: any;

  beforeEach(() => {
    jest.clearAllMocks();
    mockRedisClient = require('../../src/redis/redisClient').redisClient;
  });

  describe('addUserToQueue', () => {
    it('should add user to queue and set mapping', async () => {
      mockRedisClient.lRem.mockResolvedValue(1);
      mockRedisClient.lPush.mockResolvedValue(1);
      mockRedisClient.set.mockResolvedValue('OK');

      await addUserToQueue('test@example.com', 'queue:arrays:medium');

      expect(mockRedisClient.lRem).toHaveBeenCalledWith('queue:arrays:medium', 0, 'test@example.com');
      expect(mockRedisClient.lPush).toHaveBeenCalledWith('queue:arrays:medium', 'test@example.com');
      expect(mockRedisClient.set).toHaveBeenCalledWith('user:queue:test@example.com', 'queue:arrays:medium');
    });
  });

  describe('removeUserFromQueue', () => {
    it('should remove user from queue if they exist', async () => {
      mockRedisClient.get.mockResolvedValue('queue:arrays:medium');
      mockRedisClient.lRem.mockResolvedValue(1);
      mockRedisClient.del.mockResolvedValue(1);

      await removeUserFromQueue('test@example.com');

      expect(mockRedisClient.get).toHaveBeenCalledWith('user:queue:test@example.com');
      expect(mockRedisClient.lRem).toHaveBeenCalledWith('queue:arrays:medium', 0, 'test@example.com');
      expect(mockRedisClient.del).toHaveBeenCalledWith('user:queue:test@example.com');
    });

    it('should do nothing if user is not in any queue', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      await removeUserFromQueue('test@example.com');

      expect(mockRedisClient.get).toHaveBeenCalledWith('user:queue:test@example.com');
      expect(mockRedisClient.lRem).not.toHaveBeenCalled();
      expect(mockRedisClient.del).not.toHaveBeenCalled();
    });
  });

  describe('removeQueueMapping', () => {
    it('should remove queue mapping for user', async () => {
      mockRedisClient.del.mockResolvedValue(1);

      await removeQueueMapping('test@example.com');

      expect(mockRedisClient.del).toHaveBeenCalledWith('user:queue:test@example.com');
    });
  });

  describe('getUserQueue', () => {
    it('should return queue key for user', async () => {
      mockRedisClient.get.mockResolvedValue('queue:arrays:medium');

      const result = await getUserQueue('test@example.com');

      expect(mockRedisClient.get).toHaveBeenCalledWith('user:queue:test@example.com');
      expect(result).toBe('queue:arrays:medium');
    });

    it('should return null if user is not in any queue', async () => {
      mockRedisClient.get.mockResolvedValue(null);

      const result = await getUserQueue('test@example.com');

      expect(mockRedisClient.get).toHaveBeenCalledWith('user:queue:test@example.com');
      expect(result).toBeNull();
    });
  });

  describe('getQueue', () => {
    it('should return queue contents', async () => {
      mockRedisClient.lRange.mockResolvedValue(['user1@example.com', 'user2@example.com']);

      const result = await getQueue('queue:arrays:medium');

      expect(mockRedisClient.lRange).toHaveBeenCalledWith('queue:arrays:medium', 0, -1);
      expect(result).toEqual(['user1@example.com', 'user2@example.com']);
    });
  });

  describe('atomicPopPair', () => {
    it('should return null if queue has less than 2 users', async () => {
      mockRedisClient.eval.mockResolvedValue(null);

      const result = await atomicPopPair('queue:arrays:medium');

      expect(result).toBeNull();
    });

    it('should return pair of users if queue has 2 or more users', async () => {
      mockRedisClient.eval.mockResolvedValue(['user1@example.com', 'user2@example.com']);

      const result = await atomicPopPair('queue:arrays:medium');

      expect(result).toEqual(['user1@example.com', 'user2@example.com']);
    });

    it('should return null if eval returns invalid result', async () => {
      mockRedisClient.eval.mockResolvedValue([]);

      const result = await atomicPopPair('queue:arrays:medium');

      expect(result).toBeNull();
    });
  });
});