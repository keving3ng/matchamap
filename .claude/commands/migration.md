---
description: Create a new database migration script file
args:
  - name: migration_name
    description: Name of the migration (e.g., add_cafe_hours_table)
    required: true
---

Create a new database migration script file in the `workers/migrations/` directory with the following:

1. **File naming convention**: `YYYYMMDD_HHMMSS_{{migration_name}}.sql`
   - Use current timestamp for ordering
   - Use the provided migration name in snake_case

2. **Migration template structure**:
```sql
-- Migration: {{migration_name}}
-- Created: {{current_timestamp}}
-- Description: [Brief description of what this migration does]

-- Up Migration
-- Add your schema changes here

-- Example: Creating a new table
-- CREATE TABLE IF NOT EXISTS example_table (
--   id INTEGER PRIMARY KEY AUTOINCREMENT,
--   name TEXT NOT NULL,
--   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
-- );

-- Example: Adding a column
-- ALTER TABLE cafes ADD COLUMN new_column TEXT;

-- Example: Creating an index
-- CREATE INDEX IF NOT EXISTS idx_example ON example_table(name);


-- Down Migration (for rollback)
-- Add rollback logic here

-- DROP TABLE IF EXISTS example_table;
-- ALTER TABLE cafes DROP COLUMN new_column;
```

3. **Best practices to include**:
   - Use `IF NOT EXISTS` for CREATE statements
   - Use `IF EXISTS` for DROP statements
   - Include both up and down migrations
   - Add comments explaining the purpose
   - Follow D1/SQLite syntax

4. After creating the file:
   - Show the file path
   - Remind about running: `npx wrangler d1 migrations apply matchamap-db --local` (for local testing)
   - Remind about production deploy: `npx wrangler d1 migrations apply matchamap-db --remote`

Create the migration file now with the provided name.
