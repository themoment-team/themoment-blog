import { and, asc, eq, isNotNull, sql } from 'drizzle-orm';
import { posts } from '@/entities/post';
import { db } from '@/shared/lib/db';
import { series } from './model';

export async function getAllSeries() {
  const allSeries = await db.select().from(series).orderBy(series.createdAt);

  if (allSeries.length === 0) return [];

  const postCounts = await db
    .select({
      seriesId: posts.seriesId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(posts)
    .where(and(eq(posts.published, true), isNotNull(posts.seriesId)))
    .groupBy(posts.seriesId);

  const countMap = new Map(postCounts.map((r) => [r.seriesId, r.count]));

  return allSeries.map((s) => ({ ...s, postCount: countMap.get(s.id) ?? 0 }));
}

export async function getSeriesBySlug(slug: string) {
  const [s] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  return s ?? null;
}

export async function getSeriesWithPosts(seriesId: string) {
  const [s] = await db.select().from(series).where(eq(series.id, seriesId)).limit(1);
  if (!s) return null;

  const seriesPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      seriesOrder: posts.seriesOrder,
    })
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), eq(posts.published, true)))
    .orderBy(asc(posts.seriesOrder), asc(posts.createdAt));

  return { ...s, posts: seriesPosts };
}

export async function getSeriesNavData(postId: string, seriesId: string) {
  const data = await getSeriesWithPosts(seriesId);
  if (!data) return null;

  const idx = data.posts.findIndex((p) => p.id === postId);
  const prevPost = idx > 0 ? data.posts[idx - 1] : null;
  const nextPost = idx !== -1 && idx < data.posts.length - 1 ? data.posts[idx + 1] : null;

  return {
    series: { id: data.id, title: data.title, slug: data.slug },
    posts: data.posts,
    currentIndex: idx,
    prevPost,
    nextPost,
  };
}
