# Testing Setup for Athena AI Server

This directory contains integration tests for the Athena AI server using Bun's native testing framework.

## Overview

The testing setup follows these principles:
- **Integration tests over unit tests** - Testing complete workflows with real tRPC procedures
- **Real database operations** - Using the provided test database URL, no mocks
- **Type-safe testing** - Leveraging tRPC and Hono's type safety in tests
- **Simple structure** - Flat test directory, no complex hierarchies

## Test Structure

```
src/__tests__/
├── setup.ts              # Database setup and test utilities
├── trpc-utils.ts          # tRPC testing utilities
├── basic.test.ts          # Basic sanity checks
├── chat.test.ts           # Chat module integration tests
├── auth.test.ts           # Auth routes using Hono testing client
├── library.test.ts        # Library module integration tests
├── organization.test.ts   # Organization module integration tests
└── README.md             # This file
```

## Configuration

### Bun Configuration (`bunfig.toml`)
```toml
[test]
timeout = 30000
preload = ["./src/__tests__/setup.ts"]

[test.env]
NODE_ENV = "test"
```

### Environment Variables
Make sure your `.env` file includes:
```env
NODE_ENV=test
TEST_DB_URL=your-test-database-url
```

## Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test src/__tests__/chat.test.ts

# Watch mode for development
bun test --watch

# Run with coverage
bun test --coverage
```

## Test Utilities

### Database Setup (`setup.ts`)
- Automatic database cleanup before each test using DELETE statements
- Utility functions for creating test data:
  - `createTestUser()`
  - `createTestOrganization()`
  - `createTestMember()`
  - `createTestLibrary()`

### tRPC Testing (`trpc-utils.ts`)
- `createTestCaller()` - Create tRPC caller with custom context
- `createCallerWithUser()` - Create caller for specific user
- `createTestTRPCContext()` - Create test context with mock auth

### Hono Testing (`auth.test.ts`)
- Uses `testClient()` from `hono/testing`
- Tests HTTP routes and middleware
- Validates security headers and CORS

## Test Categories

### 1. Chat Tests (`chat.test.ts`)
Tests for chat functionality:
- Getting chat sessions
- Creating and managing messages
- Chat permissions and authorization
- Cross-organization isolation

### 2. Library Tests (`library.test.ts`)
Tests for library management:
- Creating and retrieving library items
- File upload validation
- Organization-scoped access
- Presigned URL generation

### 3. Organization Tests (`organization.test.ts`)
Tests for organization management:
- Creating organizations
- Managing members and invitations
- Role-based access control
- Invitation acceptance workflow

### 4. Auth Tests (`auth.test.ts`)
Tests for authentication and HTTP routes:
- Health check endpoint
- Auth session handling
- OAuth signin endpoints
- Security middleware (CORS, path traversal protection)

## Key Testing Patterns

### Integration Test Pattern
```typescript
test("should complete workflow", async () => {
  // 1. Create test data
  const user = await createTestUser();
  const org = await createTestOrganization();
  await createTestMember(user.id, org.id);

  // 2. Create authenticated caller
  const caller = createCallerWithUser(user, org.id);

  // 3. Test real tRPC procedures
  const result = await caller.someModule.someAction(input);

  // 4. Verify results
  expect(result).toBeDefined();

  // 5. Verify database state
  const dbData = await testDb.select()...;
  expect(dbData).toHaveLength(1);
});
```

### Hono HTTP Test Pattern
```typescript
test("should handle HTTP request", async () => {
  const client = testClient(app);
  const res = await client.api.endpoint.$get();
  
  expect(res.status).toBe(200);
  const body = await res.json();
  expect(body).toBeDefined();
});
```

## Common Issues and Solutions

### Database Connection Issues
- Ensure TEST_DB_URL is properly configured
- Check that the test database is accessible
- Verify database schema is up to date

### Authentication Tests Failing
- Review auth middleware configuration
- Check that Better Auth is properly configured for test environment
- Verify session and user context setup in test utilities

### Type Errors
- Ensure Hono routes are defined with chained methods for proper type inference
- Check that tRPC procedures match the actual implementation
- Verify schema imports are correct

### Performance Issues
- Database cleanup between tests can be slow - consider using transactions for faster tests
- Large test suites may need optimization of database operations

## Best Practices

1. **Test real behavior** - Use actual database operations, not mocks
2. **Clean state** - Each test should start with a clean database state
3. **Meaningful assertions** - Test both the API response and database state
4. **Error scenarios** - Test both success and failure cases
5. **Authorization** - Verify permission checks work correctly
6. **Type safety** - Leverage TypeScript types in test assertions

## Future Improvements

- Add performance benchmarks for critical paths
- Implement test data factories for complex scenarios
- Add API contract tests for external integrations
- Consider adding load tests for concurrent operations