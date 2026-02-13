import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "is_external_video" boolean;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "original_size" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "compression_ratio" numeric;
    ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "duration" numeric;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "media" DROP COLUMN IF EXISTS "is_external_video";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "original_size";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "compression_ratio";
    ALTER TABLE "media" DROP COLUMN IF EXISTS "duration";
  `)
}
