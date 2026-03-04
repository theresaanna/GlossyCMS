import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "provisioned_sites" ADD COLUMN IF NOT EXISTS "tos_accepted_at" timestamptz;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "tos_accepted_at";
  `)
}
