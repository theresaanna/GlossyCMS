import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   DO $$ BEGIN CREATE TYPE "public"."enum_pages_blocks_gallery_populate_by" AS ENUM('folder', 'selection'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum__pages_v_blocks_gallery_populate_by" AS ENUM('folder', 'selection'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_comments_status" AS ENUM('pending', 'approved', 'spam'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_field_type" AS ENUM('text', 'textarea', 'upload', 'richText'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_model_id" AS ENUM('Oai-text', 'dall-e', 'gpt-image-1', 'tts', 'Oai-object'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_oai_text_settings_model" AS ENUM('gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_version" AS ENUM('dall-e-3', 'dall-e-2'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_size" AS ENUM('256x256', '512x512', '1024x1024', '1792x1024', '1024x1792'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_style" AS ENUM('vivid', 'natural'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_version" AS ENUM('gpt-image-1'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_size" AS ENUM('1024x1024', '1024x1536', '1536x1024', 'auto'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_quality" AS ENUM('low', 'medium', 'high', 'auto'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_output_format" AS ENUM('png', 'jpeg', 'webp'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_background" AS ENUM('white', 'transparent'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_moderation" AS ENUM('auto', 'low'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_voice" AS ENUM('alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_model" AS ENUM('tts-1', 'tts-1-hd'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_response_format" AS ENUM('mp3', 'opus', 'aac', 'flac', 'wav', 'pcm'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN CREATE TYPE "public"."enum_plugin_ai_instructions_oai_object_settings_model" AS ENUM('gpt-5', 'gpt-5-mini', 'gpt-5-nano', 'gpt-4.1', 'gpt-4o', 'gpt-4-turbo', 'gpt-4o-mini', 'gpt-3.5-turbo'); EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE TABLE IF NOT EXISTS "pages_blocks_gallery" (
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

  CREATE TABLE IF NOT EXISTS "_pages_v_blocks_gallery" (
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

  CREATE TABLE IF NOT EXISTS "comments" (
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

  CREATE TABLE IF NOT EXISTS "plugin_ai_instructions_images" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"image_id" integer
  );

  CREATE TABLE IF NOT EXISTS "plugin_ai_instructions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"schema_path" varchar,
  	"field_type" "enum_plugin_ai_instructions_field_type" DEFAULT 'text',
  	"relation_to" varchar,
  	"model_id" "enum_plugin_ai_instructions_model_id",
  	"disabled" boolean DEFAULT false,
  	"prompt" varchar,
  	"system" varchar DEFAULT 'INSTRUCTIONS:
  You are a highly skilled and professional blog writer,
  renowned for crafting engaging and well-organized articles.
  When given a title, you meticulously create blogs that are not only
  informative and accurate but also captivating and beautifully structured.',
  	"layout" varchar DEFAULT '[paragraph] - Write a concise introduction (2-3 sentences) that outlines the main topic.
  [horizontalrule] - Insert a horizontal rule to separate the introduction from the main content.
  [list] - Create a list with 3-5 items. Each list item should contain:
     a. [heading] - A brief, descriptive heading (up to 5 words)
     b. [paragraph] - A short explanation or elaboration (1-2 sentences)
  [horizontalrule] - Insert another horizontal rule to separate the main content from the conclusion.
  [paragraph] - Compose a brief conclusion (2-3 sentences) summarizing the key points.
  [quote] - Include a relevant quote from a famous person, directly related to the topic. Format: "Quote text." - Author Name',
  	"oai_text_settings_model" "enum_plugin_ai_instructions_oai_text_settings_model" DEFAULT 'gpt-4o-mini',
  	"oai_text_settings_max_tokens" numeric DEFAULT 5000,
  	"oai_text_settings_temperature" numeric DEFAULT 0.7,
  	"oai_text_settings_extract_attachments" boolean,
  	"dalle_e_settings_version" "enum_plugin_ai_instructions_dalle_e_settings_version" DEFAULT 'dall-e-3',
  	"dalle_e_settings_size" "enum_plugin_ai_instructions_dalle_e_settings_size" DEFAULT '1024x1024',
  	"dalle_e_settings_style" "enum_plugin_ai_instructions_dalle_e_settings_style" DEFAULT 'natural',
  	"dalle_e_settings_enable_prompt_optimization" boolean,
  	"gpt_image_1_settings_version" "enum_plugin_ai_instructions_gpt_image_1_settings_version" DEFAULT 'gpt-image-1',
  	"gpt_image_1_settings_size" "enum_plugin_ai_instructions_gpt_image_1_settings_size" DEFAULT 'auto',
  	"gpt_image_1_settings_quality" "enum_plugin_ai_instructions_gpt_image_1_settings_quality" DEFAULT 'auto',
  	"gpt_image_1_settings_output_format" "enum_plugin_ai_instructions_gpt_image_1_settings_output_format" DEFAULT 'png',
  	"gpt_image_1_settings_output_compression" numeric DEFAULT 100,
  	"gpt_image_1_settings_background" "enum_plugin_ai_instructions_gpt_image_1_settings_background" DEFAULT 'white',
  	"gpt_image_1_settings_moderation" "enum_plugin_ai_instructions_gpt_image_1_settings_moderation" DEFAULT 'auto',
  	"oai_tts_settings_voice" "enum_plugin_ai_instructions_oai_tts_settings_voice" DEFAULT 'alloy',
  	"oai_tts_settings_model" "enum_plugin_ai_instructions_oai_tts_settings_model" DEFAULT 'tts-1',
  	"oai_tts_settings_response_format" "enum_plugin_ai_instructions_oai_tts_settings_response_format" DEFAULT 'mp3',
  	"oai_tts_settings_speed" numeric DEFAULT 1,
  	"oai_object_settings_model" "enum_plugin_ai_instructions_oai_object_settings_model" DEFAULT 'gpt-4o',
  	"oai_object_settings_max_tokens" numeric DEFAULT 5000,
  	"oai_object_settings_temperature" numeric DEFAULT 0.7,
  	"oai_object_settings_extract_attachments" boolean,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );

  ALTER TABLE "pages_rels" ADD COLUMN IF NOT EXISTS "media_id" integer;
  ALTER TABLE "_pages_v_rels" ADD COLUMN IF NOT EXISTS "media_id" integer;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "enable_comments" boolean DEFAULT true;
  ALTER TABLE "posts" ADD COLUMN IF NOT EXISTS "moderate_comments" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_enable_comments" boolean DEFAULT true;
  ALTER TABLE "_posts_v" ADD COLUMN IF NOT EXISTS "version_moderate_comments" boolean DEFAULT true;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "original_size" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "compression_ratio" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "duration" numeric;
  ALTER TABLE "media" ADD COLUMN IF NOT EXISTS "video_thumbnail_u_r_l" varchar;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "comments_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "plugin_ai_instructions_id" integer;
  DO $$ BEGIN ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "pages_blocks_gallery" ADD CONSTRAINT "pages_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_folder_id_payload_folders_id_fk" FOREIGN KEY ("folder_id") REFERENCES "public"."payload_folders"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_pages_v_blocks_gallery" ADD CONSTRAINT "_pages_v_blocks_gallery_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "comments" ADD CONSTRAINT "comments_post_id_posts_id_fk" FOREIGN KEY ("post_id") REFERENCES "public"."posts"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "comments" ADD CONSTRAINT "comments_parent_id_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."comments"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "plugin_ai_instructions_images" ADD CONSTRAINT "plugin_ai_instructions_images_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "plugin_ai_instructions_images" ADD CONSTRAINT "plugin_ai_instructions_images_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."plugin_ai_instructions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_order_idx" ON "pages_blocks_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_parent_id_idx" ON "pages_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_path_idx" ON "pages_blocks_gallery" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "pages_blocks_gallery_folder_idx" ON "pages_blocks_gallery" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_gallery_order_idx" ON "_pages_v_blocks_gallery" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_gallery_parent_id_idx" ON "_pages_v_blocks_gallery" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_gallery_path_idx" ON "_pages_v_blocks_gallery" USING btree ("_path");
  CREATE INDEX IF NOT EXISTS "_pages_v_blocks_gallery_folder_idx" ON "_pages_v_blocks_gallery" USING btree ("folder_id");
  CREATE INDEX IF NOT EXISTS "comments_post_idx" ON "comments" USING btree ("post_id");
  CREATE INDEX IF NOT EXISTS "comments_parent_idx" ON "comments" USING btree ("parent_id");
  CREATE INDEX IF NOT EXISTS "comments_updated_at_idx" ON "comments" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "comments_created_at_idx" ON "comments" USING btree ("created_at");
  CREATE INDEX IF NOT EXISTS "plugin_ai_instructions_images_order_idx" ON "plugin_ai_instructions_images" USING btree ("_order");
  CREATE INDEX IF NOT EXISTS "plugin_ai_instructions_images_parent_id_idx" ON "plugin_ai_instructions_images" USING btree ("_parent_id");
  CREATE INDEX IF NOT EXISTS "plugin_ai_instructions_images_image_idx" ON "plugin_ai_instructions_images" USING btree ("image_id");
  CREATE UNIQUE INDEX IF NOT EXISTS "plugin_ai_instructions_schema_path_idx" ON "plugin_ai_instructions" USING btree ("schema_path");
  CREATE INDEX IF NOT EXISTS "plugin_ai_instructions_updated_at_idx" ON "plugin_ai_instructions" USING btree ("updated_at");
  CREATE INDEX IF NOT EXISTS "plugin_ai_instructions_created_at_idx" ON "plugin_ai_instructions" USING btree ("created_at");
  DO $$ BEGIN ALTER TABLE "pages_rels" ADD CONSTRAINT "pages_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "_pages_v_rels" ADD CONSTRAINT "_pages_v_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_comments_fk" FOREIGN KEY ("comments_id") REFERENCES "public"."comments"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  DO $$ BEGIN ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_plugin_ai_instructions_fk" FOREIGN KEY ("plugin_ai_instructions_id") REFERENCES "public"."plugin_ai_instructions"("id") ON DELETE cascade ON UPDATE no action; EXCEPTION WHEN duplicate_object THEN null; END $$;
  CREATE INDEX IF NOT EXISTS "pages_rels_media_id_idx" ON "pages_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "_pages_v_rels_media_id_idx" ON "_pages_v_rels" USING btree ("media_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_comments_id_idx" ON "payload_locked_documents_rels" USING btree ("comments_id");
  CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_plugin_ai_instructions_id_idx" ON "payload_locked_documents_rels" USING btree ("plugin_ai_instructions_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "pages_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_gallery" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "comments" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plugin_ai_instructions_images" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "plugin_ai_instructions" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_gallery" CASCADE;
  DROP TABLE "_pages_v_blocks_gallery" CASCADE;
  DROP TABLE "comments" CASCADE;
  DROP TABLE "plugin_ai_instructions_images" CASCADE;
  DROP TABLE "plugin_ai_instructions" CASCADE;
  ALTER TABLE "pages_rels" DROP CONSTRAINT "pages_rels_media_fk";

  ALTER TABLE "_pages_v_rels" DROP CONSTRAINT "_pages_v_rels_media_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_comments_fk";

  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_plugin_ai_instructions_fk";

  DROP INDEX "pages_rels_media_id_idx";
  DROP INDEX "_pages_v_rels_media_id_idx";
  DROP INDEX "payload_locked_documents_rels_comments_id_idx";
  DROP INDEX "payload_locked_documents_rels_plugin_ai_instructions_id_idx";
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
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "plugin_ai_instructions_id";
  DROP TYPE "public"."enum_pages_blocks_gallery_populate_by";
  DROP TYPE "public"."enum__pages_v_blocks_gallery_populate_by";
  DROP TYPE "public"."enum_comments_status";
  DROP TYPE "public"."enum_plugin_ai_instructions_field_type";
  DROP TYPE "public"."enum_plugin_ai_instructions_model_id";
  DROP TYPE "public"."enum_plugin_ai_instructions_oai_text_settings_model";
  DROP TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_version";
  DROP TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_size";
  DROP TYPE "public"."enum_plugin_ai_instructions_dalle_e_settings_style";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_version";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_size";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_quality";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_output_format";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_background";
  DROP TYPE "public"."enum_plugin_ai_instructions_gpt_image_1_settings_moderation";
  DROP TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_voice";
  DROP TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_model";
  DROP TYPE "public"."enum_plugin_ai_instructions_oai_tts_settings_response_format";
  DROP TYPE "public"."enum_plugin_ai_instructions_oai_object_settings_model";`)
}
