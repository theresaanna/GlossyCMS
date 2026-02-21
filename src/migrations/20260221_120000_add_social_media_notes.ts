import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media_platforms" ADD COLUMN IF NOT EXISTS "notes" varchar;
    ALTER TABLE "_pages_v_blocks_social_media_platforms" ADD COLUMN IF NOT EXISTS "notes" varchar;
  `)

  // Backfill the notes value for the Cash App entry seeded by the home page migration
  // (which ran before this column existed)
  await db.execute(sql`
    UPDATE "pages_blocks_social_media_platforms"
    SET "notes" = 'If you like Glossy, please feel free to show your appreciation with a tip. Thank you.'
    WHERE "custom_label" = 'Cash App'
      AND "custom_url" = 'https://cash.app/$annaadorable'
      AND "notes" IS NULL
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media_platforms" DROP COLUMN IF EXISTS "notes";
    ALTER TABLE "_pages_v_blocks_social_media_platforms" DROP COLUMN IF EXISTS "notes";
  `)
}
