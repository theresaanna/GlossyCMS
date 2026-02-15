import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TYPE "public"."enum_pages_blocks_carousel_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_carousel_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TABLE "pages_blocks_carousel_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum_pages_blocks_carousel_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_delay" numeric DEFAULT 3000,
  	"loop" boolean DEFAULT true,
  	"slides_per_view" numeric DEFAULT 1,
  	"block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_carousel_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum__pages_v_blocks_carousel_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"autoplay" boolean DEFAULT false,
  	"autoplay_delay" numeric DEFAULT 3000,
  	"loop" boolean DEFAULT true,
  	"slides_per_view" numeric DEFAULT 1,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "pages_blocks_carousel_gallery" ADD CONSTRAINT "pages_blocks_carousel_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_carousel_gallery" ADD CONSTRAINT "pages_blocks_carousel_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_gallery" ADD CONSTRAINT "_pages_v_blocks_carousel_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_carousel_gallery" ADD CONSTRAINT "_pages_v_blocks_carousel_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_carousel_gallery_order_idx" ON "pages_blocks_carousel_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_carousel_gallery_parent_id_idx" ON "pages_blocks_carousel_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_carousel_gallery_path_idx" ON "pages_blocks_carousel_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_carousel_gallery_folder_idx" ON "pages_blocks_carousel_gallery" USING btree ("folder_id");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_order_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_parent_id_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_path_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_carousel_gallery_folder_idx" ON "_pages_v_blocks_carousel_gallery" USING btree ("folder_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  DROP TABLE "pages_blocks_carousel_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_carousel_gallery" CASCADE;
  DROP TYPE "public"."enum_pages_blocks_carousel_gallery_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_carousel_gallery_populate_by";`)
}
