import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-vercel-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "provisioned_sites" ADD COLUMN "plan" varchar DEFAULT 'basic' NOT NULL;
    ALTER TABLE "provisioned_sites" ADD COLUMN "stripe_customer_id" varchar;
    ALTER TABLE "provisioned_sites" ADD COLUMN "stripe_subscription_id" varchar;
    ALTER TABLE "provisioned_sites" ADD COLUMN "stripe_checkout_session_id" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "plan";
    ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "stripe_customer_id";
    ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "stripe_subscription_id";
    ALTER TABLE "provisioned_sites" DROP COLUMN IF EXISTS "stripe_checkout_session_id";
  `)
}
