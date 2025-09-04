import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schemas";

// Test database configuration - always use local PostgreSQL
const TEST_DATABASE_URL = "postgresql://test_user:test_password@localhost:5433/athena_test";

const sql = postgres(TEST_DATABASE_URL);
export const testDb = drizzle(sql, { schema });

// Export the sql connection for cleanup operations
export { sql as testSql };