import { Kysely } from "kysely";

export async function up(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .addColumn("stripe_customer_id", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("stripe_subscription_id", "varchar(255)")
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("subscription_tier", "varchar(20)", (col) =>
      col.notNull().defaultTo("free"),
    )
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("subscription_status", "varchar(20)", (col) =>
      col.notNull().defaultTo("active"),
    )
    .execute();

  await db.schema
    .alterTable("users")
    .addColumn("subscription_ends_at", "timestamptz")
    .execute();
}

export async function down(db: Kysely<unknown>): Promise<void> {
  await db.schema
    .alterTable("users")
    .dropColumn("stripe_customer_id")
    .execute();
  await db.schema
    .alterTable("users")
    .dropColumn("stripe_subscription_id")
    .execute();
  await db.schema.alterTable("users").dropColumn("subscription_tier").execute();
  await db.schema
    .alterTable("users")
    .dropColumn("subscription_status")
    .execute();
  await db.schema
    .alterTable("users")
    .dropColumn("subscription_ends_at")
    .execute();
}
