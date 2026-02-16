import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media" ADD COLUMN "header" varchar;
    ALTER TABLE "_pages_v_blocks_social_media" ADD COLUMN "header" varchar;

    CREATE TABLE "pages_blocks_social_media_custom_platforms" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "label" varchar,
      "url" varchar
    );

    CREATE TABLE "_pages_v_blocks_social_media_custom_platforms" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" serial PRIMARY KEY NOT NULL,
      "label" varchar,
      "url" varchar,
      "_uuid" varchar
    );

    ALTER TABLE "pages_blocks_social_media_custom_platforms" ADD CONSTRAINT "pages_blocks_social_media_custom_platforms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages_blocks_social_media"("id") ON DELETE cascade ON UPDATE no action;
    ALTER TABLE "_pages_v_blocks_social_media_custom_platforms" ADD CONSTRAINT "_pages_v_blocks_social_media_custom_platforms_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v_blocks_social_media"("id") ON DELETE cascade ON UPDATE no action;

    CREATE INDEX "pages_blocks_social_media_custom_platforms_order_idx" ON "pages_blocks_social_media_custom_platforms" USING btree ("_order");
    CREATE INDEX "pages_blocks_social_media_custom_platforms_parent_id_idx" ON "pages_blocks_social_media_custom_platforms" USING btree ("_parent_id");
    CREATE INDEX "_pages_v_blocks_social_media_custom_platforms_order_idx" ON "_pages_v_blocks_social_media_custom_platforms" USING btree ("_order");
    CREATE INDEX "_pages_v_blocks_social_media_custom_platforms_parent_id_idx" ON "_pages_v_blocks_social_media_custom_platforms" USING btree ("_parent_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "pages_blocks_social_media_custom_platforms" DISABLE ROW LEVEL SECURITY;
    ALTER TABLE "_pages_v_blocks_social_media_custom_platforms" DISABLE ROW LEVEL SECURITY;
    DROP TABLE "pages_blocks_social_media_custom_platforms" CASCADE;
    DROP TABLE "_pages_v_blocks_social_media_custom_platforms" CASCADE;

    ALTER TABLE "pages_blocks_social_media" DROP COLUMN IF EXISTS "header";
    ALTER TABLE "_pages_v_blocks_social_media" DROP COLUMN IF EXISTS "header";
  `)
}
