import { blog } from '@shared/lib/db';
import { text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const series = blog.table('tb_series', {
  id: uuid('id').primaryKey().defaultRandom(),
  title: varchar('title', { length: 500 }).notNull(),
  slug: varchar('slug', { length: 500 }).notNull().unique(),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
