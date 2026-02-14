import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  CREATE TABLE "pages_blocks_twitter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"username" varchar,
  	"title" varchar,
  	"tweet_limit" numeric DEFAULT 10,
  	"block_name" varchar
  );

  CREATE TABLE "_pages_v_blocks_twitter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"username" varchar,
  	"title" varchar,
  	"tweet_limit" numeric DEFAULT 10,
  	"_uuid" varchar,
  	"block_name" varchar
  );

  ALTER TABLE "pages_blocks_twitter" ADD CONSTRAINT "pages_blocks_twitter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_pages_v_blocks_twitter" ADD CONSTRAINT "_pages_v_blocks_twitter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_pages_v"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "pages_blocks_twitter_order_idx" ON "pages_blocks_twitter" USING btree ("_order");
  CREATE INDEX "pages_blocks_twitter_parent_id_idx" ON "pages_blocks_twitter" USING btree ("_parent_id");
  CREATE INDEX "pages_blocks_twitter_path_idx" ON "pages_blocks_twitter" USING btree ("_path");
  CREATE INDEX "_pages_v_blocks_twitter_order_idx" ON "_pages_v_blocks_twitter" USING btree ("_order");
  CREATE INDEX "_pages_v_blocks_twitter_parent_id_idx" ON "_pages_v_blocks_twitter" USING btree ("_parent_id");
  CREATE INDEX "_pages_v_blocks_twitter_path_idx" ON "_pages_v_blocks_twitter" USING btree ("_path");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
  ALTER TABLE "pages_blocks_twitter" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "_pages_v_blocks_twitter" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "pages_blocks_twitter" CASCADE;
  DROP TABLE "_pages_v_blocks_twitter" CASCADE;`)
}
