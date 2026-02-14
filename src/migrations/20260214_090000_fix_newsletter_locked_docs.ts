import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "newsletter_recipients_id" integer;`)

  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "newsletters_id" integer;`)

  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_recipients_fk" FOREIGN KEY ("newsletter_recipients_id") REFERENCES "public"."newsletter_recipients"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletters_fk" FOREIGN KEY ("newsletters_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletter_recipients_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_recipients_id");`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_newsletters_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletters_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletter_recipients_fk";`)
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_newsletters_fk";`)

  await db.execute(sql`
  DROP INDEX IF EXISTS "payload_locked_documents_rels_newsletter_recipients_id_idx";`)
  await db.execute(sql`
  DROP INDEX IF EXISTS "payload_locked_documents_rels_newsletters_id_idx";`)

  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletter_recipients_id";`)
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "newsletters_id";`)
}
