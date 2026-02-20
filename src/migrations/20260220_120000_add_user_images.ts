import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "users" ADD COLUMN "header_image_id" integer REFERENCES "media"("id") ON DELETE SET NULL;
  ALTER TABLE "users" ADD COLUMN "user_image_id" integer REFERENCES "media"("id") ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS "users_header_image_idx" ON "users" USING btree ("header_image_id");
  CREATE INDEX IF NOT EXISTS "users_user_image_idx" ON "users" USING btree ("user_image_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP INDEX IF EXISTS "users_user_image_idx";
  DROP INDEX IF EXISTS "users_header_image_idx";
  ALTER TABLE "users" DROP COLUMN "user_image_id";
  ALTER TABLE "users" DROP COLUMN "header_image_id";`)
}
