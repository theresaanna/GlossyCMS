import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_media_block_size" AS ENUM('small', 'medium', 'large', 'full');
  CREATE TYPE "public"."enum__pages_v_blocks_media_block_size" AS ENUM('small', 'medium', 'large', 'full');
  CREATE TYPE "public"."enum_provisioned_sites_status" AS ENUM('pending', 'provisioning', 'active', 'failed', 'suspended');
  CREATE TYPE "public"."enum_site_settings_color_scheme_light" AS ENUM('default', 'eggplant', 'ocean', 'spring', 'cherry', '80s');
  CREATE TYPE "public"."enum_site_settings_color_scheme_dark" AS ENUM('default', 'eggplant', 'ocean', 'autumn', 'cherry', '80s');
  ALTER TYPE "public"."enum_payload_jobs_log_task_slug" ADD VALUE 'provision-site' BEFORE 'schedulePublish';
  ALTER TYPE "public"."enum_payload_jobs_task_slug" ADD VALUE 'provision-site' BEFORE 'schedulePublish';
  CREATE TABLE "provisioned_sites" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"subdomain" varchar NOT NULL,
  	"owner_email" varchar NOT NULL,
  	"owner_name" varchar,
  	"site_name" varchar,
  	"site_description" varchar,
  	"status" "enum_provisioned_sites_status" DEFAULT 'pending' NOT NULL,
  	"vercel_project_id" varchar,
  	"postgres_store_id" varchar,
  	"blob_store_id" varchar,
  	"provisioning_error" varchar,
  	"provisioned_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar,
  	"site_description" varchar,
  	"og_image_id" integer,
  	"header_image_id" integer,
  	"user_image_id" integer,
  	"color_scheme_light" "enum_site_settings_color_scheme_light" DEFAULT 'default',
  	"color_scheme_dark" "enum_site_settings_color_scheme_dark" DEFAULT 'default',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_blocks_media_block" ADD COLUMN "size" "enum_pages_blocks_media_block_size" DEFAULT 'full';
  ALTER TABLE "pages_blocks_social_media_platforms" ADD COLUMN "notes" varchar;
  ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "size" "enum__pages_v_blocks_media_block_size" DEFAULT 'full';
  ALTER TABLE "_pages_v_blocks_social_media_platforms" ADD COLUMN "notes" varchar;
  ALTER TABLE "search" ADD COLUMN "published_at" timestamp(3) with time zone;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "provisioned_sites_id" integer;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_og_image_id_media_id_fk" FOREIGN KEY ("og_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_header_image_id_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_user_image_id_media_id_fk" FOREIGN KEY ("user_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE UNIQUE INDEX "provisioned_sites_subdomain_idx" ON "provisioned_sites" USING btree ("subdomain");
  CREATE INDEX "provisioned_sites_updated_at_idx" ON "provisioned_sites" USING btree ("updated_at");
  CREATE INDEX "provisioned_sites_created_at_idx" ON "provisioned_sites" USING btree ("created_at");
  CREATE INDEX "site_settings_og_image_idx" ON "site_settings" USING btree ("og_image_id");
  CREATE INDEX "site_settings_header_image_idx" ON "site_settings" USING btree ("header_image_id");
  CREATE INDEX "site_settings_user_image_idx" ON "site_settings" USING btree ("user_image_id");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provisioned_sites_fk" FOREIGN KEY ("provisioned_sites_id") REFERENCES "public"."provisioned_sites"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_provisioned_sites_id_idx" ON "payload_locked_documents_rels" USING btree ("provisioned_sites_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "provisioned_sites" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "provisioned_sites" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_provisioned_sites_fk";
  
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";
  DROP INDEX "payload_locked_documents_rels_provisioned_sites_id_idx";
  ALTER TABLE "pages_blocks_media_block" DROP COLUMN "size";
  ALTER TABLE "pages_blocks_social_media_platforms" DROP COLUMN "notes";
  ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN "size";
  ALTER TABLE "_pages_v_blocks_social_media_platforms" DROP COLUMN "notes";
  ALTER TABLE "search" DROP COLUMN "published_at";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "provisioned_sites_id";
  DROP TYPE "public"."enum_pages_blocks_media_block_size";
  DROP TYPE "public"."enum__pages_v_blocks_media_block_size";
  DROP TYPE "public"."enum_provisioned_sites_status";
  DROP TYPE "public"."enum_site_settings_color_scheme_light";
  DROP TYPE "public"."enum_site_settings_color_scheme_dark";`)
}
