Use `001_init_schema.sql` to create the new track-first schema, then `002_legacy_fdw_migration.sql` to pull data from the old restored backup.

Recommended local flow:

1. Create two databases:
   `createdb music_old_staging`
   `createdb music_new`
2. Restore the uploaded legacy dump:
   `pg_restore --clean --if-exists --no-owner --no-privileges -d music_old_staging "/Users/paramandharia/Downloads/music project/music_db_backup"`
3. Point `DATABASE_URL` at `music_new`.
4. Apply the schema:
   `npm run db:schema`
5. Run the legacy import:
   `npm run db:legacy`

The import intentionally rejects rows without `track_id` into `migration_rejected_songs` so the new catalog stays aligned with the `track_id` primary-key design.
