import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media" ADD COLUMN IF NOT EXISTS "header" varchar;
    ALTER TABLE "_pages_v_blocks_social_media" ADD COLUMN IF NOT EXISTS "header" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media" DROP COLUMN IF EXISTS "header";
    ALTER TABLE "_pages_v_blocks_social_media" DROP COLUMN IF EXISTS "header";
  `)
}
