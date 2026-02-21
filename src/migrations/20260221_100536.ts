import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_provisioned_sites_status" AS ENUM('pending', 'provisioning', 'active', 'failed', 'suspended');
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

  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "provisioned_sites_id" integer;
  CREATE UNIQUE INDEX "provisioned_sites_subdomain_idx" ON "provisioned_sites" USING btree ("subdomain");
  CREATE INDEX "provisioned_sites_updated_at_idx" ON "provisioned_sites" USING btree ("updated_at");
  CREATE INDEX "provisioned_sites_created_at_idx" ON "provisioned_sites" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_provisioned_sites_fk" FOREIGN KEY ("provisioned_sites_id") REFERENCES "public"."provisioned_sites"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_provisioned_sites_id_idx" ON "payload_locked_documents_rels" USING btree ("provisioned_sites_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_provisioned_sites_fk";
  DROP INDEX IF EXISTS "payload_locked_documents_rels_provisioned_sites_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "provisioned_sites_id";
  DROP TABLE IF EXISTS "provisioned_sites" CASCADE;

  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_log_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_log_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs_log" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_log_task_slug" USING "task_slug"::"public"."enum_payload_jobs_log_task_slug";
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_jobs_task_slug";
  CREATE TYPE "public"."enum_payload_jobs_task_slug" AS ENUM('inline', 'schedulePublish');
  ALTER TABLE "payload_jobs" ALTER COLUMN "task_slug" SET DATA TYPE "public"."enum_payload_jobs_task_slug" USING "task_slug"::"public"."enum_payload_jobs_task_slug";

  DROP TYPE IF EXISTS "public"."enum_provisioned_sites_status";`)
}
