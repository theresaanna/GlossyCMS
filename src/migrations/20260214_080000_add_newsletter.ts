import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_newsletter_recipients_status" AS ENUM('subscribed', 'unsubscribed');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  DO $$ BEGIN
    CREATE TYPE "public"."enum_newsletters_status" AS ENUM('draft', 'sent');
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "newsletter_recipients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"status" "enum_newsletter_recipients_status" DEFAULT 'subscribed',
  	"subscribed_at" timestamp(3) with time zone,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );`)

  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "newsletters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"content" jsonb,
  	"status" "enum_newsletters_status" DEFAULT 'draft',
  	"sent_at" timestamp(3) with time zone,
  	"recipient_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );`)

  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "pages_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"success_message" varchar,
  	"block_name" varchar
  );`)

  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"heading" varchar,
  	"description" varchar,
  	"success_message" varchar,
  	"block_name" varchar
  );`)

  await db.execute(sql`
  CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_recipients_email_idx" ON "newsletter_recipients" USING btree ("email");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletter_recipients_updated_at_idx" ON "newsletter_recipients" USING btree ("updated_at");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletter_recipients_created_at_idx" ON "newsletter_recipients" USING btree ("created_at");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_updated_at_idx" ON "newsletters" USING btree ("updated_at");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "newsletters_created_at_idx" ON "newsletters" USING btree ("created_at");`)

  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "pages_blocks_newsletter_signup" ADD CONSTRAINT "pages_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)
  await db.execute(sql`
  DO $$ BEGIN
    ALTER TABLE "_pages_v_blocks_newsletter_signup" ADD CONSTRAINT "_pages_v_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  EXCEPTION WHEN duplicate_object THEN null;
  END $$;`)

  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "pages_blocks_newsletter_signup_order_idx" ON "pages_blocks_newsletter_signup" USING btree ("_order");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "pages_blocks_newsletter_signup_parent_id_idx" ON "pages_blocks_newsletter_signup" USING btree ("_parent_id");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "pages_blocks_newsletter_signup_path_idx" ON "pages_blocks_newsletter_signup" USING btree ("_path");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_newsletter_signup_order_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_order");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_newsletter_signup_parent_id_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_parent_id");`)
  await db.execute(sql`
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_newsletter_signup_path_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_path");`)

  await db.execute(sql`
  ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "enable_newsletter" boolean DEFAULT false;`)
  await db.execute(sql`
  ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "newsletter_heading" varchar;`)
  await db.execute(sql`
  ALTER TABLE "footer" ADD COLUMN IF NOT EXISTS "newsletter_description" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "enable_newsletter";`)
  await db.execute(sql`
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "newsletter_heading";`)
  await db.execute(sql`
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "newsletter_description";`)

  await db.execute(sql`
  DROP TABLE IF EXISTS "pages_blocks_newsletter_signup" CASCADE;`)
  await db.execute(sql`
  DROP TABLE IF EXISTS "_pages_v_blocks_newsletter_signup" CASCADE;`)

  await db.execute(sql`
  DROP TABLE IF EXISTS "newsletter_recipients" CASCADE;`)
  await db.execute(sql`
  DROP TABLE IF EXISTS "newsletters" CASCADE;`)

  await db.execute(sql`
  DROP TYPE IF EXISTS "public"."enum_newsletter_recipients_status";`)
  await db.execute(sql`
  DROP TYPE IF EXISTS "public"."enum_newsletters_status";`)
}
