// ============================================================================
// BABIRYE - Database Migration Utilities
// Version: 10.0.0 | Edition: Titanium Ultra + VIP Protection
// ============================================================================

import { db } from './db';

// ============================================================================
// Interfaces
// ============================================================================

/** Column definition for SQL generation. */
export interface ColumnDef {
  name: string;
  type: string;
  nullable?: boolean;
  default?: string;
  unique?: boolean;
  primary?: boolean;
}

/** A single migration with version, name, and up/down SQL. */
export interface MigrationInterface {
  /** Migration version number (e.g., 1, 2, 3). Must be unique and sequential. */
  version: number;
  /** Human-readable migration name. */
  name: string;
  /** SQL to apply the migration (forward). */
  up: string;
  /** SQL to undo the migration (rollback). */
  down: string;
}

// ============================================================================
// Migration Table Bootstrap
// ============================================================================

const MIGRATION_TABLE_SQL = `
  CREATE TABLE IF NOT EXISTS "_schema_migrations" (
    "version"   INTEGER NOT NULL PRIMARY KEY,
    "name"      TEXT NOT NULL,
    "appliedAt" TEXT NOT NULL DEFAULT (datetime('now'))
  );
`;

/** Ensure the migration tracking table exists. */
async function ensureMigrationTable(): Promise<void> {
  await db.$executeRawUnsafe(MIGRATION_TABLE_SQL);
}

// ============================================================================
// Migration Runner
// ============================================================================

/**
 * Migration runner that registers migrations and can apply or rollback them.
 *
 * @example
 * ```ts
 * const runner = new MigrationRunner();
 * runner.register(migration001);
 * runner.register(migration002);
 * const applied = await runner.run(); // runs all pending
 * ```
 */
export class MigrationRunner {
  private migrations = new Map<number, MigrationInterface>();

  /** Register a migration. Throws if a migration with the same version exists. */
  register(migration: MigrationInterface): this {
    if (this.migrations.has(migration.version)) {
      throw new Error(`Migration version ${migration.version} ("${migration.name}") is already registered`);
    }
    this.migrations.set(migration.version, migration);
    return this;
  }

  /** Get the current highest applied migration version from the database. */
  async getCurrentVersion(): Promise<number> {
    await ensureMigrationTable();
    const row = await db.$queryRawUnsafe<Array<{ version: number }>>(
      `SELECT MAX("version") as "version" FROM "_schema_migrations"`
    );
    return row[0]?.version ?? 0;
  }

  /**
   * Run all pending (unapplied) migrations in version order.
   * Each migration is applied within a transaction.
   *
   * @returns The number of migrations applied
   */
  async run(): Promise<number> {
    await ensureMigrationTable();
    const currentVersion = await this.getCurrentVersion();

    const pending = Array.from(this.migrations.values())
      .filter((m) => m.version > currentVersion)
      .sort((a, b) => a.version - b.version);

    if (pending.length === 0) return 0;

    let applied = 0;
    for (const migration of pending) {
      await db.$transaction(async (tx) => {
        // Execute the migration SQL
        for (const statement of splitSql(migration.up)) {
          const trimmed = statement.trim();
          if (trimmed) await tx.$executeRawUnsafe(trimmed);
        }
        // Record the migration
        await tx.$executeRawUnsafe(
          `INSERT INTO "_schema_migrations" ("version", "name") VALUES (${migration.version}, '${migration.name.replace(/'/g, "''")}')`
        );
      });
      applied++;
    }

    return applied;
  }

  /**
   * Rollback the most recent applied migration.
   *
   * @returns The version that was rolled back, or 0 if nothing to rollback
   */
  async rollback(): Promise<number> {
    await ensureMigrationTable();
    const currentVersion = await this.getCurrentVersion();
    if (currentVersion === 0) return 0;

    const migration = this.migrations.get(currentVersion);
    if (!migration) {
      throw new Error(`No migration registered for version ${currentVersion} — cannot rollback`);
    }

    await db.$transaction(async (tx) => {
      for (const statement of splitSql(migration.down)) {
        const trimmed = statement.trim();
        if (trimmed) await tx.$executeRawUnsafe(trimmed);
      }
      await tx.$executeRawUnsafe(
        `DELETE FROM "_schema_migrations" WHERE "version" = ${currentVersion}`
      );
    });

    return currentVersion;
  }
}

// ============================================================================
// SQL Splitting Utility
// ============================================================================

/**
 * Split a multi-statement SQL string into individual statements.
 * Handles both semicolons and SQLite-style statements.
 */
function splitSql(sql: string): string[] {
  return sql
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && !s.startsWith('--'));
}

// ============================================================================
// Migration Factory
// ============================================================================

/**
 * Create a migration object with the given version, name, and SQL.
 *
 * @param version - Sequential version number
 * @param name - Human-readable name
 * @param upSql - SQL to apply
 * @param downSql - SQL to rollback
 * @returns MigrationInterface ready to register
 */
export function createMigration(
  version: number,
  name: string,
  upSql: string,
  downSql: string
): MigrationInterface {
  return { version, name, up: upSql, down: downSql };
}

// ============================================================================
// Pre-built Migrations
// ============================================================================

export const migration001_add_user_mfa_fields = createMigration(
  1,
  'add_user_mfa_fields',
  `ALTER TABLE "User" ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT 0;
   ALTER TABLE "User" ADD COLUMN "mfaSecret" TEXT;`,
  `-- SQLite does not support DROP COLUMN reliably
   -- Rollback would require table rebuild in production`
);

export const migration002_add_api_token_indexes = createMigration(
  2,
  'add_api_token_indexes',
  `CREATE INDEX IF NOT EXISTS "ApiToken_tokenHash_idx" ON "ApiToken" ("tokenHash");
   CREATE INDEX IF NOT EXISTS "ApiToken_userId_idx" ON "ApiToken" ("userId");`,
  `DROP INDEX IF EXISTS "ApiToken_tokenHash_idx";
   DROP INDEX IF EXISTS "ApiToken_userId_idx";`
);

export const migration003_add_sensor_anomaly_fields = createMigration(
  3,
  'add_sensor_anomaly_fields',
  `ALTER TABLE "SensorReading" ADD COLUMN "anomalyScore" REAL;
   ALTER TABLE "SensorReading" ADD COLUMN "isAnomaly" BOOLEAN NOT NULL DEFAULT 0;
   CREATE INDEX IF NOT EXISTS "SensorReading_isAnomaly_idx" ON "SensorReading" ("isAnomaly");`,
  `DROP INDEX IF EXISTS "SensorReading_isAnomaly_idx";
   -- SQLite does not support DROP COLUMN reliably`
);

export const migration004_add_potential_scenarios = createMigration(
  4,
  'add_potential_scenarios',
  `CREATE TABLE IF NOT EXISTS "Scenario" (
     "id"            TEXT NOT NULL PRIMARY KEY,
     "potentialId"   TEXT NOT NULL REFERENCES "Potential"("id") ON DELETE CASCADE,
     "name"          TEXT NOT NULL,
     "description"   TEXT NOT NULL DEFAULT '',
     "preconditions" TEXT NOT NULL DEFAULT '[]',
     "steps"         TEXT NOT NULL DEFAULT '[]',
     "expectedOutcome" TEXT,
     "riskAssessment" TEXT,
     "status"        TEXT NOT NULL DEFAULT 'draft',
     "createdAt"     TEXT NOT NULL DEFAULT (datetime('now')),
     "updatedAt"     TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX IF NOT EXISTS "Scenario_potentialId_idx" ON "Scenario" ("potentialId");
   CREATE INDEX IF NOT EXISTS "Scenario_status_idx" ON "Scenario" ("status");`,
  `DROP TABLE IF EXISTS "Scenario";`
);

export const migration005_add_vip_sos_tracking = createMigration(
  5,
  'add_vip_sos_tracking',
  `ALTER TABLE "VipWearable" ADD COLUMN "sosTriggered" BOOLEAN NOT NULL DEFAULT 0;`,
  `-- SQLite does not support DROP COLUMN reliably`
);

export const migration006_add_weapon_serial_unique = createMigration(
  6,
  'add_weapon_serial_unique',
  `-- Ensure serialNumber uniqueness constraint
   -- In SQLite, this would require table rebuild; for additive safety:
   CREATE UNIQUE INDEX IF NOT EXISTS "Weapon_serialNumber_idx" ON "Weapon" ("serialNumber") WHERE "serialNumber" IS NOT NULL;`,
  `DROP INDEX IF EXISTS "Weapon_serialNumber_idx";`
);

export const migration007_add_constitution_version_tracking = createMigration(
  7,
  'add_constitution_version_tracking',
  `CREATE TABLE IF NOT EXISTS "ConstitutionVersion" (
     "id"          TEXT NOT NULL PRIMARY KEY,
     "constitutionId" TEXT NOT NULL REFERENCES "Constitution"("id") ON DELETE CASCADE,
     "version"     TEXT NOT NULL,
     "content"     TEXT NOT NULL,
     "changeLog"   TEXT,
     "createdBy"   TEXT,
     "createdAt"   TEXT NOT NULL DEFAULT (datetime('now'))
   );
   CREATE INDEX IF NOT EXISTS "ConstitutionVersion_constitutionId_idx" ON "ConstitutionVersion" ("constitutionId");`,
  `DROP TABLE IF EXISTS "ConstitutionVersion";`
);

export const migration008_add_notification_expiration = createMigration(
  8,
  'add_notification_expiration',
  `ALTER TABLE "Notification" ADD COLUMN "expiresAt" TEXT;`,
  `-- SQLite does not support DROP COLUMN reliably`
);

export const migration009_add_sensor_reading_confidence = createMigration(
  9,
  'add_sensor_reading_confidence',
  `ALTER TABLE "SensorReading" ADD COLUMN "confidence" REAL NOT NULL DEFAULT 1.0;`,
  `-- SQLite does not support DROP COLUMN reliably`
);

export const migration010_add_offensive_risk_assessment = createMigration(
  10,
  'add_offensive_risk_assessment',
  `ALTER TABLE "OffensiveTool" ADD COLUMN "riskAssessment" TEXT;`,
  `-- SQLite does not support DROP COLUMN reliably`
);

// ============================================================================
// Convenience Functions
// ============================================================================

/** All pre-built migrations in version order. */
export const ALL_MIGRATIONS: MigrationInterface[] = [
  migration001_add_user_mfa_fields,
  migration002_add_api_token_indexes,
  migration003_add_sensor_anomaly_fields,
  migration004_add_potential_scenarios,
  migration005_add_vip_sos_tracking,
  migration006_add_weapon_serial_unique,
  migration007_add_constitution_version_tracking,
  migration008_add_notification_expiration,
  migration009_add_sensor_reading_confidence,
  migration010_add_offensive_risk_assessment,
];

/**
 * Run all pending pre-built migrations.
 * Convenience function that creates a runner, registers all migrations, and runs.
 *
 * @returns The number of migrations applied
 */
export async function runPendingMigrations(): Promise<number> {
  const runner = new MigrationRunner();
  for (const migration of ALL_MIGRATIONS) {
    runner.register(migration);
  }
  return runner.run();
}

/**
 * Get the current schema version from the database.
 *
 * @returns The highest applied migration version number
 */
export async function getMigrationVersion(): Promise<number> {
  await ensureMigrationTable();
  const runner = new MigrationRunner();
  return runner.getCurrentVersion();
}

// ============================================================================
// SQL Generation Utilities
// ============================================================================

/**
 * Generate a CREATE TABLE SQL statement from column definitions.
 *
 * @param tableName - Name of the table to create
 * @param columns - Array of column definitions
 * @returns Complete CREATE TABLE SQL statement
 *
 * @example
 * ```ts
 * const sql = createMigrationSql('MyTable', [
 *   { name: 'id', type: 'TEXT', primary: true },
 *   { name: 'name', type: 'TEXT', nullable: false },
 *   { name: 'value', type: 'INTEGER', default: '0' },
 * ]);
 * ```
 */
export function createMigrationSql(tableName: string, columns: ColumnDef[]): string {
  const colDefs = columns.map((col) => {
    const parts: string[] = [`"${col.name}"`, col.type];
    if (col.primary) parts.push('PRIMARY KEY');
    if (!col.nullable && !col.primary) parts.push('NOT NULL');
    if (col.default !== undefined) parts.push(`DEFAULT ${col.default}`);
    if (col.unique) parts.push('UNIQUE');
    return parts.join(' ');
  });

  return `CREATE TABLE IF NOT EXISTS "${tableName}" (\n  ${colDefs.join(',\n  ')}\n);`;
}

/**
 * Generate a DROP TABLE SQL statement.
 *
 * @param tableName - Name of the table to drop
 * @param ifExists - Use IF EXISTS clause (default: true)
 * @returns DROP TABLE SQL statement
 */
export function createDropSql(tableName: string, ifExists = true): string {
  return `DROP TABLE ${ifExists ? 'IF EXISTS ' : ''}"${tableName}";`;
}