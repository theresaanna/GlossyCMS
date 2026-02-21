import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media_platforms" ADD COLUMN IF NOT EXISTS "notes" varchar;
    ALTER TABLE "_pages_v_blocks_social_media_platforms" ADD COLUMN IF NOT EXISTS "notes" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media_platforms" DROP COLUMN IF EXISTS "notes";
    ALTER TABLE "_pages_v_blocks_social_media_platforms" DROP COLUMN IF EXISTS "notes";
  `)
}
