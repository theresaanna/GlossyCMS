import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "comment_verification_tokens" (
      "id" serial PRIMARY KEY NOT NULL,
      "email" varchar NOT NULL,
      "token" varchar NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "verified" boolean DEFAULT false,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE INDEX IF NOT EXISTS "comment_verification_tokens_email_idx" ON "comment_verification_tokens" USING btree ("email");
    CREATE UNIQUE INDEX IF NOT EXISTS "comment_verification_tokens_token_idx" ON "comment_verification_tokens" USING btree ("token");
    CREATE INDEX IF NOT EXISTS "comment_verification_tokens_expires_at_idx" ON "comment_verification_tokens" USING btree ("expires_at");
    CREATE INDEX IF NOT EXISTS "comment_verification_tokens_updated_at_idx" ON "comment_verification_tokens" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "comment_verification_tokens_created_at_idx" ON "comment_verification_tokens" USING btree ("created_at");

    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "comment_verification_tokens_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_comment_verification_tokens_fk"
        FOREIGN KEY ("comment_verification_tokens_id")
        REFERENCES "public"."comment_verification_tokens"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN NULL;
    END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_comment_verification_token_idx"
      ON "payload_locked_documents_rels" USING btree ("comment_verification_tokens_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels"
      DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_comment_verification_tokens_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_comment_verification_token_idx";

    ALTER TABLE "payload_locked_documents_rels"
      DROP COLUMN IF EXISTS "comment_verification_tokens_id";

    DROP TABLE IF EXISTS "comment_verification_tokens" CASCADE;
  `)
}
