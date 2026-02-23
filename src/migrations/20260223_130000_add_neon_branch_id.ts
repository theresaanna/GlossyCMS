import { MigrateUpArgs, MigrateDownArgs } from '@payloadcms/db-vercel-postgres'
import { sql } from 'drizzle-orm'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(
    sql`ALTER TABLE "provisioned_sites" ADD COLUMN IF NOT EXISTS "neon_branch_id" varchar;`,
  )
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "neon_branch_id";`)
}
