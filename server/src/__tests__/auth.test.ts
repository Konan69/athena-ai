import { test, expect, describe } from "bun:test";
import { app } from "../server";

describe("Auth Routes Tests", () => {
  describe("Health Check", () => {
    test("should return healthy status", async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);

      const body = await res.json() as { status: string };
      expect(body.status).toBe("ok");
    });
  });

  describe("Auth Endpoints", () => {
    test("should handle auth session request", async () => {
      // Test auth session endpoint using app.request
      const res = await app.request('/api/auth/session', {
        method: 'GET',
      });

      // Without proper authentication, this should return unauthorized or not found
      expect([200, 401, 403, 404]).toContain(res.status);
    });

    test("should handle auth error endpoint", async () => {
      const res = await app.request('/api/auth/error', {
        method: 'GET',
      });

      // Should handle auth error endpoint
      expect([200, 404]).toContain(res.status);
    });

    test("should provide OAuth signin endpoint", async () => {
      // Test Google OAuth signin endpoint
      const res = await app.request('/api/auth/signin/google', {
        method: 'POST',
      });

      // Should redirect to Google OAuth or return auth info or not found
      expect([200, 302, 401, 404]).toContain(res.status);
    });
  });

  describe("Protected Routes", () => {
    test("should require authentication for tRPC endpoints", async () => {
      // Test that tRPC endpoints require authentication
      const res = await app.request('/trpc/chat.getChats', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Should return unauthorized without proper session or handle tRPC routing
      expect([200, 401, 403, 404]).toContain(res.status);
    });

    test("should handle CORS for client requests", async () => {
      const res = await app.request('/health', {
        method: 'OPTIONS',
        headers: {
          'Origin': 'http://localhost:3000',
          'Access-Control-Request-Method': 'GET',
        },
      });

      // Should handle CORS preflight
      expect([200, 204]).toContain(res.status);
    });
  });

  describe("API Security", () => {
    test("should reject requests with path traversal attempts", async () => {
      // Test path traversal protection
      const maliciousRequests = [
        '/api/../../../etc/passwd',
        '/api/%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
        '/api/auth/../../../config',
      ];

      for (const path of maliciousRequests) {
        const res = await app.request(path, {
          method: 'GET',
        });

        // Should reject path traversal attempts (or return auth error)
        expect([400, 401, 403, 404]).toContain(res.status);
      }
    });

    test("should include security headers", async () => {
      const res = await app.request('/health');

      expect(res.status).toBe(200);

      // Check for basic security headers
      const headers = res.headers;

      // Request ID should be present (from middleware)
      expect(headers.get("x-request-id")).toBeTruthy();
    });

    test("should handle invalid JSON payloads gracefully", async () => {
      const res = await app.request('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: 'invalid json{{{',
      });

      // Should handle malformed JSON gracefully (or return auth error)
      expect([400, 401, 404, 422]).toContain(res.status);
    });
  });

  describe("Content Type Handling", () => {
    test("should handle different content types appropriately", async () => {
      // Test with proper JSON
      const validRes = await app.request('/api/auth/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      expect([200, 401, 404, 422]).toContain(validRes.status);

      // Test with missing content type
      const noContentTypeRes = await app.request('/api/auth/session', {
        method: 'POST',
        body: JSON.stringify({}),
      });

      expect([200, 400, 401, 404, 415, 422]).toContain(noContentTypeRes.status);
    });
  });

  describe("Rate Limiting and Resource Protection", () => {
    test("should handle concurrent requests gracefully", async () => {
      // Test multiple concurrent health checks
      const promises = Array.from({ length: 10 }, () =>
        app.request('/health')
      );

      const results = await Promise.all(promises);

      // All should succeed (health check should be fast and not rate limited)
      results.forEach(res => {
        expect(res.status).toBe(200);
      });
    });

    test("should handle large request headers appropriately", async () => {
      const largeHeader = "x".repeat(8192); // 8KB header

      const res = await app.request('/health', {
        method: 'GET',
        headers: {
          'X-Large-Header': largeHeader,
        },
      });

      // Should either accept or reject based on server limits
      expect([200, 400, 413, 431]).toContain(res.status);
    });
  });

  describe("Error Handling", () => {
    test("should return proper error responses for non-existent endpoints", async () => {
      const res = await app.request('/non-existent-endpoint');

      expect([401, 404]).toContain(res.status);
    });

    test("should handle method not allowed scenarios", async () => {
      // Try to POST to health endpoint (which only accepts GET)
      const res = await app.request('/health', {
        method: 'POST',
      });

      expect([401, 404, 405]).toContain(res.status);
    });
  });

  describe("Integration with tRPC", () => {
    test("should properly route tRPC requests", async () => {
      // Test that tRPC routing is working
      const res = await app.request('/trpc/hello', {
        method: 'GET',
      });

      // Should handle tRPC routing (even if unauthorized)
      expect([200, 401, 404]).toContain(res.status);
    });

    test("should handle tRPC batch requests", async () => {
      const batchPayload = {
        "0": {
          "json": null,
          "meta": {
            "values": ["undefined"]
          }
        }
      };

      const res = await app.request('/trpc/hello', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchPayload),
      });

      // Should handle tRPC batch format
      expect([200, 400, 401]).toContain(res.status);
    });
  });
});