# Testing Guide for Matching Service

This document explains how to run and write tests for the Matching Service.

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests with Coverage
```bash
npm run test:coverage
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

## Test Structure

The test suite is organized into the following directories:

### `/tests/services/`
- **queueService.test.ts**: Tests for Redis queue operations
- Tests queue management, user addition/removal, and atomic operations

### `/tests/middleware/`
- **authMiddleware.test.ts**: Tests for authentication middleware
- Tests both development mode (X-Dev-Email header) and production mode (JWT tokens)

### `/tests/controllers/`
- **queueController.test.ts**: Tests for queue controller endpoints
- Tests join/leave queue functionality and SSE connections

### `/tests/integration/`
- **api.test.ts**: Integration tests for API endpoints
- Tests HTTP endpoints with mocked dependencies

### `/tests/utils/`
- **testHelpers.ts**: Utility functions for creating mock objects
- Helper functions for requests, responses, and users

## Test Configuration

- **Jest**: Test runner and framework
- **Supertest**: HTTP testing for API endpoints
- **Babel**: TypeScript transformation for Jest
- **Mocking**: All external dependencies are mocked

## Writing Tests

### Unit Tests
- Test individual functions in isolation
- Mock all external dependencies
- Focus on business logic

### Integration Tests
- Test API endpoints with mocked services
- Verify HTTP responses and status codes
- Test authentication flows

### Test Helpers
Use the provided test helpers for consistent mocking:

```typescript
import { createMockRequest, createMockResponse, createMockUser } from '../utils/testHelpers';

const req = createMockRequest({ user: createMockUser() });
const res = createMockResponse();
```

## Coverage

The test suite covers:
- ✅ Queue service operations
- ✅ Authentication middleware
- ✅ Queue controller logic
- ✅ API endpoint integration
- ✅ Error handling scenarios

## Notes

- Tests use fake timers for time-dependent functionality
- Redis operations are mocked to avoid external dependencies
- Firebase authentication is mocked for testing
- Console output is suppressed during tests to reduce noise