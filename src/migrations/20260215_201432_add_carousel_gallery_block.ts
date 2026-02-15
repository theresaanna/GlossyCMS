import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_carousel_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TYPE "public"."enum_newsletter_recipients_status" AS ENUM('subscribed', 'unsubscribed');
  CREATE TYPE "public"."enum_newsletters_status" AS ENUM('draft', 'sent');
  ALTER TYPE "public"."enum_header_nav_items_link_type" ADD VALUE 'posts';
  ALTER TYPE "public"."enum_footer_nav_items_link_type" ADD VALUE 'posts';
  CREATE TABLE "pages_blocks_carousel_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum_pages_blocks_carousel_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_delay" numeric DEFAULT 3000,
  	"loop" boolean DEFAULT true,
  	"slides_per_view" numeric DEFAULT 1,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Subscribe to our newsletter',
  	"description" varchar,
  	"success_message" varchar DEFAULT 'Thank you for subscribing!',
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_carousel_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum__pages_v_blocks_carousel_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_delay" numeric DEFAULT 3000,
  	"loop" boolean DEFAULT true,
  	"slides_per_view" numeric DEFAULT 1,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_newsletter_signup" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar DEFAULT 'Subscribe to our newsletter',
  	"description" varchar,
  	"success_message" varchar DEFAULT 'Thank you for subscribing!',
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
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
  
  CREATE TABLE "newsletters_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"newsletter_recipients_id" integer
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletter_recipients_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "newsletters_id" integer;
  ALTER TABLE "footer" ADD COLUMN "enable_newsletter" boolean DEFAULT false;
  ALTER TABLE "footer" ADD COLUMN "newsletter_heading" varchar DEFAULT 'Stay in the loop';
  ALTER TABLE "footer" ADD COLUMN "newsletter_description" varchar;
  ALTER TABLE "pages_blocks_carousel_gallery" ADD CONSTRAINT "pages_blocks_carousel_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_gallery" ADD CONSTRAINT "pages_blocks_carousel_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_newsletter_signup" ADD CONSTRAINT "pages_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_gallery" ADD CONSTRAINT "_pages_v_blocks_carousel_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_gallery" ADD CONSTRAINT "_pages_v_blocks_carousel_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_newsletter_signup" ADD CONSTRAINT "_pages_v_blocks_newsletter_signup_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "newsletters_rels" ADD CONSTRAINT "newsletters_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "newsletters_rels" ADD CONSTRAINT "newsletters_rels_newsletter_recipients_fk" FOREIGN KEY ("newsletter_recipients_id") REFERENCES "public"."newsletter_recipients"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_carousel_gallery_order_idx" ON "pages_blocks_carousel_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_gallery_parent_id_idx" ON "pages_blocks_carousel_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_gallery_path_idx" ON "pages_blocks_carousel_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel_gallery_folder_idx" ON "pages_blocks_carousel_gallery" USING btree ("folder_id");
  CREATE INDEX "pages_blocks_newsletter_signup_order_idx" ON "pages_blocks_newsletter_signup" USING btree ("_order");
  CREATE INDEX "pages_blocks_newsletter_signup_parent_id_idx" ON "pages_blocks_newsletter_signup" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_newsletter_signup_path_idx" ON "pages_blocks_newsletter_signup" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_order_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_parent_id_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_path_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_folder_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("folder_id");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_order_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_parent_id_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_newsletter_signup_path_idx" ON "_pages_v_blocks_newsletter_signup" USING btree ("_path");
  CREATE UNIQUE INDEX "newsletter_recipients_email_idx" ON "newsletter_recipients" USING btree ("email");
  CREATE INDEX "newsletter_recipients_updated_at_idx" ON "newsletter_recipients" USING btree ("updated_at");
  CREATE INDEX "newsletter_recipients_created_at_idx" ON "newsletter_recipients" USING btree ("created_at");
  CREATE INDEX "newsletters_updated_at_idx" ON "newsletters" USING btree ("updated_at");
  CREATE INDEX "newsletters_created_at_idx" ON "newsletters" USING btree ("created_at");
  CREATE INDEX "newsletters_rels_order_idx" ON "newsletters_rels" USING btree ("order");
  CREATE INDEX "newsletters_rels_parent_idx" ON "newsletters_rels" USING btree ("parent_id");
  CREATE INDEX "newsletters_rels_path_idx" ON "newsletters_rels" USING btree ("path");
  CREATE INDEX "newsletters_rels_newsletter_recipients_id_idx" ON "newsletters_rels" USING btree ("newsletter_recipients_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletter_recipients_fk" FOREIGN KEY ("newsletter_recipients_id") REFERENCES "public"."newsletter_recipients"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_newsletters_fk" FOREIGN KEY ("newsletters_id") REFERENCES "public"."newsletters"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_newsletter_recipients_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletter_recipients_id");
  CREATE INDEX "payload_locked_documents_rels_newsletters_id_idx" ON "payload_locked_documents_rels" USING btree ("newsletters_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_carousel_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_newsletter_signup" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_carousel_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_newsletter_signup" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletter_recipients" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletters" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "newsletters_rels" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_carousel_gallery" CASCADE;
  DROP TABLE "pages_blocks_newsletter_signup" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_newsletter_signup" CASCADE;
  DROP TABLE "newsletter_recipients" CASCADE;
  DROP TABLE "newsletters" CASCADE;
  DROP TABLE "newsletters_rels" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletter_recipients_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_newsletters_fk";
  
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference'::text;
  DROP TYPE "public"."enum_header_nav_items_link_type";
  CREATE TYPE "public"."enum_header_nav_items_link_type" AS ENUM('reference', 'custom', 'gallery');
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference'::"public"."enum_header_nav_items_link_type";
  ALTER TABLE "header_nav_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_header_nav_items_link_type" USING "link_type"::"public"."enum_header_nav_items_link_type";
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DATA TYPE text;
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference'::text;
  DROP TYPE "public"."enum_footer_nav_items_link_type";
  CREATE TYPE "public"."enum_footer_nav_items_link_type" AS ENUM('reference', 'custom', 'gallery');
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DEFAULT 'reference'::"public"."enum_footer_nav_items_link_type";
  ALTER TABLE "footer_nav_items" ALTER COLUMN "link_type" SET DATA TYPE "public"."enum_footer_nav_items_link_type" USING "link_type"::"public"."enum_footer_nav_items_link_type";
  DROP INDEX "payload_locked_documents_rels_newsletter_recipients_id_idx";
  DROP INDEX "payload_locked_documents_rels_newsletters_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletter_recipients_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "newsletters_id";
  ALTER TABLE "footer" DROP COLUMN "enable_newsletter";
  ALTER TABLE "footer" DROP COLUMN "newsletter_heading";
  ALTER TABLE "footer" DROP COLUMN "newsletter_description";
  DROP TYPE "public"."enum_pages_blocks_carousel_gallery_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_gallery_populate_by";
  DROP TYPE "public"."enum_newsletter_recipients_status";
  DROP TYPE "public"."enum_newsletters_status";`)
}
