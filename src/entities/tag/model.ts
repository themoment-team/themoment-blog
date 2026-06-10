import { uuid, varchar } from 'drizzle-orm/pg-core';
import { blog } from '@/shared/lib/db';

export const tags = blog.table('tb_tags', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
});

export type Tag = typeof tags.$inferSelect;
export type NewTag = typeof tags.$inferInsert;
