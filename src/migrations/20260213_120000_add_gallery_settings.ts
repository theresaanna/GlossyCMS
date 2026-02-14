import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "gallery_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar DEFAULT 'Gallery',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 100,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "gallery_settings" ADD CONSTRAINT "gallery_settings_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "gallery_settings_folder_idx" ON "gallery_settings" USING btree ("folder_id");

  ALTER TYPE "public"."enum_header_nav_items_link_type" ADD VALUE IF NOT EXISTS 'gallery';
  ALTER TYPE "public"."enum_footer_nav_items_link_type" ADD VALUE IF NOT EXISTS 'gallery';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "gallery_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "gallery_settings" CASCADE;`)
}
