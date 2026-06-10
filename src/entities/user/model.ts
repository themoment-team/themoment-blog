import { boolean, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';
import { blog } from '@/shared/lib/db';

export const users = blog.table('tb_users', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  name: varchar('name', { length: 100 }).notNull(),
  isMomentMember: boolean('is_moment_member').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
