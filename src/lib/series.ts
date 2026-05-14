import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { posts, series, users } from "./db/schema";

export async function getAllSeries() {
  return db
    .select({
      id: series.id,
      name: series.name,
      slug: series.slug,
      description: series.description,
      createdAt: series.createdAt,
      postCount: sql<number>`cast(count(${posts.id}) as int)`,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(series)
    .innerJoin(users, eq(series.authorId, users.id))
    .leftJoin(posts, eq(series.id, posts.seriesId))
    .groupBy(series.id, users.id)
    .orderBy(desc(series.createdAt));
}

export async function getSeriesBySlug(slug: string) {
  const [s] = await db
    .select({
      id: series.id,
      name: series.name,
      slug: series.slug,
      description: series.description,
      createdAt: series.createdAt,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(series)
    .innerJoin(users, eq(series.authorId, users.id))
    .where(eq(series.slug, slug))
    .limit(1);

  return s ?? null;
}

export async function createSeries(data: {
  name: string;
  slug: string;
  description?: string;
  authorId: string;
}) {
  const [s] = await db.insert(series).values(data).returning();
  return s;
}
