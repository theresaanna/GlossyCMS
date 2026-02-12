import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_pages_blocks_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TYPE "public"."enum__pages_v_blocks_gallery_populate_by" AS ENUM('folder', 'selection');
  CREATE TYPE "public"."enum_comments_status" AS ENUM('pending', 'approved', 'spam');
  CREATE TABLE "pages_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum_pages_blocks_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"block_name" varchar
  );
  
  CREATE TABLE "pages_blocks_twitter_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"twitter_username" varchar,
  	"number_of_tweets" numeric DEFAULT 5,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_gallery" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"populate_by" "enum__pages_v_blocks_gallery_populate_by" DEFAULT 'folder',
  	"folder_id" integer,
  	"limit" numeric DEFAULT 50,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "_pages_v_blocks_twitter_feed" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"twitter_username" varchar,
  	"number_of_tweets" numeric DEFAULT 5,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "comments" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"author_name" varchar NOT NULL,
  	"author_email" varchar NOT NULL,
  	"body" varchar NOT NULL,
  	"post_id" integer NOT NULL,
  	"parent_id" integer,
  	"depth" numeric DEFAULT 0,
  	"status" "enum_comments_status" DEFAULT 'pending',
  	"ip_address" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "social_media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"twitter_bearer_token" varchar,
  	"twitter_default_username" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "pages_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN "media_id" integer;
  ALTER TABLE "posts" ADD COLUMN "enable_comments" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN "moderate_comments" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN "version_enable_comments" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN "version_moderate_comments" boolean DEFAULT true;
  ALTER TABLE "media" ADD COLUMN "original_size" numeric;
  ALTER TABLE "media" ADD COLUMN "compression_ratio" numeric;
  ALTER TABLE "media" ADD COLUMN "duration" numeric;
  ALTER TABLE "media" ADD COLUMN "video_thumbnail_u_r_l" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "comments_id" integer;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "pages_blocks_twitter_feed" ADD CONSTRAINT "pages_blocks_twitter_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_twitter_feed" ADD CONSTRAINT "_pages_v_blocks_twitter_feed_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX "pages_blocks_gallery_folder_idx" ON "pages_blocks_gallery" USING btree ("folder_id");
  CREATE INDEX "pages_blocks_twitter_feed_order_idx" ON "pages_blocks_twitter_feed" USING btree ("_order");
  CREATE INDEX "pages_blocks_twitter_feed_parent_id_idx" ON "pages_blocks_twitter_feed" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_twitter_feed_path_idx" ON "pages_blocks_twitter_feed" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_gallery_folder_idx" ON "_pages_v_blocks_gallery" USING btree ("folder_id");
  CREATE INDEX "_pages_v_blocks_twitter_feed_order_idx" ON "_pages_v_blocks_twitter_feed" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_twitter_feed_parent_id_idx" ON "_pages_v_blocks_twitter_feed" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_twitter_feed_path_idx" ON "_pages_v_blocks_twitter_feed" USING btree ("_path");
  CREATE INDEX "comments_post_idx" ON "comments" USING btree ("post_id");
  CREATE INDEX "comments_parent_idx" ON "comments" USING btree ("parent_id");
  CREATE INDEX "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX "comments_created_at_idx" ON "comments" USING btree ("created_at");
  ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "pages_blocks_twitter_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_twitter_feed" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "social_media" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "pages_blocks_twitter_feed" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_twitter_feed" CASCADE;
  DROP TABLE "comments" CASCADE;
  DROP TABLE "social_media" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_media_fk";
  
  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_media_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comments_fk";
  
  DROP INDEX "pages_rels_media_id_idx";
  DROP INDEX "_pages_v_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_comments_id_idx";
  ALTER TABLE "pages_rels" DROP COLUMN "media_id";
  ALTER TABLE "_pages_v_rels" DROP COLUMN "media_id";
  ALTER TABLE "posts" DROP COLUMN "enable_comments";
  ALTER TABLE "posts" DROP COLUMN "moderate_comments";
  ALTER TABLE "_posts_v" DROP COLUMN "version_enable_comments";
  ALTER TABLE "_posts_v" DROP COLUMN "version_moderate_comments";
  ALTER TABLE "media" DROP COLUMN "original_size";
  ALTER TABLE "media" DROP COLUMN "compression_ratio";
  ALTER TABLE "media" DROP COLUMN "duration";
  ALTER TABLE "media" DROP COLUMN "video_thumbnail_u_r_l";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "comments_id";
  DROP TYPE "public"."enum_pages_blocks_gallery_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_populate_by";
  DROP TYPE "public"."enum_comments_status";`)
}
