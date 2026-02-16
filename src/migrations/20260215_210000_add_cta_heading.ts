import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_cta" ADD COLUMN "heading" varchar;
    ALTER TABLE "_pages_v_blocks_cta" ADD COLUMN "heading" varchar;
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_cta" DROP COLUMN IF EXISTS "heading";
    ALTER TABLE "_pages_v_blocks_cta" DROP COLUMN IF EXISTS "heading";
  `)
}
