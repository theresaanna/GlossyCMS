import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  ALTER TYPE "public"."enum_header_nav_items_link_type" ADD VALUE IF NOT EXISTS 'posts';
  ALTER TYPE "public"."enum_footer_nav_items_link_type" ADD VALUE IF NOT EXISTS 'posts';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  // Postgres does not support removing values from enums directly.
  // The 'posts' value will remain but be unused if this migration is rolled back.
}
