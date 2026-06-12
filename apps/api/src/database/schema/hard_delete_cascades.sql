-- Consolidated hard-delete cascades (ported from the orphaned Kysely migration
-- 001_hard_delete_cascades so migrate:prod is the single source of truth).
--
-- Ensures every user_id foreign key cascades on user deletion and removes the
-- legacy soft-delete columns. Fully idempotent.

ALTER TABLE IF EXISTS users DROP COLUMN IF EXISTS deleted_at;
ALTER TABLE IF EXISTS vault_entries DROP COLUMN IF EXISTS deleted_at;

DO $$
DECLARE
  target_table TEXT;
  fk_name TEXT;
  user_tables TEXT[] := ARRAY[
    'sessions', 'vault_entries', 'activity_logs', 'activity_records',
    'inactivity_settings', 'handover_processes', 'successors',
    'handover_events', 'checkin_tokens', 'notification_deliveries'
  ];
BEGIN
  FOREACH target_table IN ARRAY user_tables LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = target_table
    ) THEN
      -- Drop any existing foreign key on user_id (regardless of its name).
      FOR fk_name IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu
          ON kcu.constraint_name = tc.constraint_name
        WHERE tc.table_name = target_table
          AND tc.constraint_type = 'FOREIGN KEY'
          AND kcu.column_name = 'user_id'
      LOOP
        EXECUTE format('ALTER TABLE %I DROP CONSTRAINT %I', target_table, fk_name);
      END LOOP;

      -- Re-add the foreign key with ON DELETE CASCADE.
      BEGIN
        EXECUTE format(
          'ALTER TABLE %I ADD CONSTRAINT %I FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE',
          target_table,
          target_table || '_user_id_fkey'
        );
      EXCEPTION
        WHEN duplicate_object THEN NULL;
      END;
    END IF;
  END LOOP;
END $$;
