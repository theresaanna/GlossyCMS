import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings" ADD COLUMN IF NOT EXISTS "favicon_id" integer;
    ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_favicon_id_media_id_fk" FOREIGN KEY ("favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
    CREATE INDEX IF NOT EXISTS "site_settings_favicon_idx" ON "site_settings" USING btree ("favicon_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP INDEX IF EXISTS "site_settings_favicon_idx";
    ALTER TABLE "site_settings" DROP CONSTRAINT IF EXISTS "site_settings_favicon_id_media_id_fk";
    ALTER TABLE "site_settings" DROP COLUMN IF EXISTS "favicon_id";
  `)
}
