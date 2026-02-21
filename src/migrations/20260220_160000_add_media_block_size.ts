import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TYPE "public"."enum_pages_blocks_media_block_size" AS ENUM('small', 'medium', 'large', 'full');
    CREATE TYPE "public"."enum__pages_v_blocks_media_block_size" AS ENUM('small', 'medium', 'large', 'full');
    ALTER TABLE "pages_blocks_media_block" ADD COLUMN "size" "enum_pages_blocks_media_block_size" DEFAULT 'full';
    ALTER TABLE "_pages_v_blocks_media_block" ADD COLUMN "size" "enum__pages_v_blocks_media_block_size" DEFAULT 'full';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_media_block" DROP COLUMN IF EXISTS "size";
    ALTER TABLE "_pages_v_blocks_media_block" DROP COLUMN IF EXISTS "size";
    DROP TYPE IF EXISTS "public"."enum_pages_blocks_media_block_size";
    DROP TYPE IF EXISTS "public"."enum__pages_v_blocks_media_block_size";
  `)
}
