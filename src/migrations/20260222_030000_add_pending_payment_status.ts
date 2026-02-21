import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_provisioned_sites_status" ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'pending';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing values from an enum type directly.
  // To reverse this, you would need to recreate the enum without 'pending_payment'
  // and update all rows. Since this is destructive, we leave it as a no-op.
}
