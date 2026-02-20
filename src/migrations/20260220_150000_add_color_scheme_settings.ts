import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      ADD COLUMN "color_scheme_light" varchar DEFAULT 'default',
      ADD COLUMN "color_scheme_dark" varchar DEFAULT 'default';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "site_settings"
      DROP COLUMN IF EXISTS "color_scheme_light",
      DROP COLUMN IF EXISTS "color_scheme_dark";
  `)
}
