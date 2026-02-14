import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "newsletters_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"newsletter_recipients_id" integer
  );`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_rels_order_idx" ON "newsletters_rels" USING btree ("order");`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_rels_parent_idx" ON "newsletters_rels" USING btree ("parent_id");`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_rels_path_idx" ON "newsletters_rels" USING btree ("path");`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_rels_newsletter_recipients_id_idx" ON "newsletters_rels" USING btree ("newsletter_recipients_id");`)

  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "newsletters_rels" ADD CONSTRAINT "newsletters_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "newsletters_rels" ADD CONSTRAINT "newsletters_rels_newsletter_recipients_fk" FOREIGN KEY ("newsletter_recipients_id") REFERENCES "public"."newsletter_recipients"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE IF EXISTS "newsletters_rels" CASCADE;`)
}
