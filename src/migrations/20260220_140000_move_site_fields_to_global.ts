import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // 1. Create the site_settings global table
  await db.execute(sql`
  CREATE TABLE IF NOT EXISTS "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar,
  	"header_image_id" integer,
  	"user_image_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );

  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_header_image_id_media_id_fk" FOREIGN KEY ("header_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_user_image_id_media_id_fk" FOREIGN KEY ("user_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX IF NOT EXISTS "site_settings_header_image_idx" ON "site_settings" USING btree ("header_image_id");
  CREATE INDEX IF NOT EXISTS "site_settings_user_image_idx" ON "site_settings" USING btree ("user_image_id");`)

  // 2. Migrate data from the first user (site owner) into site_settings
  await db.execute(sql`
  INSERT INTO "site_settings" ("site_title", "header_image_id", "user_image_id", "updated_at", "created_at")
  SELECT "site_title", "header_image_id", "user_image_id", NOW(), NOW()
  FROM "users"
  ORDER BY "created_at" ASC
  LIMIT 1;`)

  // 3. Drop the columns from users
  await db.execute(sql`
  DROP INDEX IF EXISTS "users_user_image_idx";
  DROP INDEX IF EXISTS "users_header_image_idx";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "site_title";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "header_image_id";
  ALTER TABLE "users" DROP COLUMN IF EXISTS "user_image_id";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // 1. Re-add columns to users
  await db.execute(sql`
  ALTER TABLE "users" ADD COLUMN "site_title" varchar;
  ALTER TABLE "users" ADD COLUMN "header_image_id" integer REFERENCES "media"("id") ON DELETE SET NULL;
  ALTER TABLE "users" ADD COLUMN "user_image_id" integer REFERENCES "media"("id") ON DELETE SET NULL;
  CREATE INDEX IF NOT EXISTS "users_header_image_idx" ON "users" USING btree ("header_image_id");
  CREATE INDEX IF NOT EXISTS "users_user_image_idx" ON "users" USING btree ("user_image_id");`)

  // 2. Copy data back to the first user
  await db.execute(sql`
  UPDATE "users"
  SET "site_title" = ss."site_title",
      "header_image_id" = ss."header_image_id",
      "user_image_id" = ss."user_image_id"
  FROM "site_settings" ss
  WHERE "users"."id" = (SELECT "id" FROM "users" ORDER BY "created_at" ASC LIMIT 1);`)

  // 3. Drop site_settings table
  await db.execute(sql`
  ALTER TABLE "site_settings" DISABLE ROW LEVEL SECURITY;
  DROP TABLE IF EXISTS "site_settings" CASCADE;`)
}
