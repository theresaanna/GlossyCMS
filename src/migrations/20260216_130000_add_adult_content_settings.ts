import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "adult_content" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enable_age_verification" boolean DEFAULT false,
  	"minimum_age" numeric DEFAULT 18,
  	"redirect_url" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "adult_content" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "adult_content" CASCADE;`)
}
