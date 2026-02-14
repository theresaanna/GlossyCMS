import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_newsletter_recipients_status" AS ENUM('subscribed', 'unsubscribed');
  CREATE TYPE "public"."enum_newsletters_status" AS ENUM('draft', 'sent');

  CREATE TABLE "newsletter_recipients" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"email" varchar NOT NULL,
  	"name" varchar,
  	"status" "enum_newsletter_recipients_status" DEFAULT 'subscribed',
  	"subscribed_at" timestamp(3) with time zone,
  	"unsubscribed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "newsletters" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subject" varchar NOT NULL,
  	"content" jsonb,
  	"status" "enum_newsletters_status" DEFAULT 'draft',
  	"sent_at" timestamp(3) with time zone,
  	"recipient_count" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  CREATE TABLE "pages_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"success_message" varchar,
  	"block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_uuid" varchar,
  	"heading" varchar,
  	"description" varchar,
  	"success_message" varchar,
  	"block_name" varchar
  );

  CREATE UNIQUE INDEX "newsletter_recipients_email_idx" ON "newsletter_recipients" USING btree ("email");
  CREATE INDEX "newsletter_recipients_updated_at_idx" ON "newsletter_recipients" USING btree ("updated_at");
  CREATE INDEX "newsletter_recipients_created_at_idx" ON "newsletter_recipients" USING btree ("created_at");
  CREATE INDEX "newsletters_updated_at_idx" ON "newsletters" USING btree ("updated_at");
  CREATE INDEX "newsletters_created_at_idx" ON "newsletters" USING btree ("created_at");

  ALTER TABLE "pages_blocks_newsletter_signup" ADD CONSTRAINT "pages_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_signup" ADD CONSTRAINT "_pages_v_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;

  CREATE INDEX "pages_blocks_newsletter_signup_order_idx" ON "pages_blocks_newsletter_signup" USING btree ("_order");
  CREATE INDEX "pages_blocks_newsletter_signup_parent_id_idx" ON "pages_blocks_newsletter_signup" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_newsletter_signup_path_idx" ON "pages_blocks_newsletter_signup" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_order_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_parent_id_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_path_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_path");

  ALTER TABLE "footer" ADD COLUMN "enable_newsletter" boolean DEFAULT false;
  ALTER TABLE "footer" ADD COLUMN "newsletter_heading" varchar;
  ALTER TABLE "footer" ADD COLUMN "newsletter_description" varchar;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "enable_newsletter";
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "newsletter_heading";
  ALTER TABLE "footer" DROP COLUMN IF EXISTS "newsletter_description";

  ALTER TABLE "pages_blocks_newsletter_signup" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_newsletter_signup" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_newsletter_signup" CASCADE;
  DROP TABLE "_pages_v_blocks_newsletter_signup" CASCADE;

  ALTER TABLE "newsletter_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletters" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "newsletter_recipients" CASCADE;
  DROP TABLE "newsletters" CASCADE;

  DROP TYPE "public"."enum_newsletter_recipients_status";
  DROP TYPE "public"."enum_newsletters_status";`)
}
