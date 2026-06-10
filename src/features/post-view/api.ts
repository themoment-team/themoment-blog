import { likes, posts, postTags } from "@entities/post";
import { series } from "@entities/series";
import { tags } from "@entities/tag";
import { users } from "@entities/user";
import { db } from "@shared/lib/db";
import { and, asc, desc, eq, inArray, isNotNull, sql } from "drizzle-orm";

export type PostSortKey = "latest" | "views" | "likes";

// ── 포스트 조회 ────────────────────────────────────────────────

export async function getPublishedPosts(
  limit = 20,
  offset = 0,
  sort: PostSortKey = "latest",
  tag?: string,
  authorId?: string,
) {
  const likeCountExpr = sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`;

  const orderExpr =
    sort === "views"
      ? desc(posts.viewCount)
      : sort === "likes"
        ? desc(likeCountExpr)
        : desc(posts.publishedAt);

  const tagSubquery = tag
    ? inArray(
        posts.id,
        db
          .select({ id: postTags.postId })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(tags.slug, tag)),
      )
    : undefined;

  const conditions = [
    eq(posts.published, true),
    ...(tagSubquery ? [tagSubquery] : []),
    ...(authorId ? [eq(posts.authorId, authorId)] : []),
  ];
  const whereClause = and(...conditions);

  const postList = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(whereClause)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  if (postList.length === 0) return [];

  const postIds = postList.map((p) => p.id);
  const allTagRows = await db
    .select({ postId: postTags.postId, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const tagsByPost = new Map<string, { name: string; slug: string }[]>();
  for (const row of allTagRows) {
    const arr = tagsByPost.get(row.postId) ?? [];
    arr.push({ name: row.name, slug: row.slug });
    tagsByPost.set(row.postId, arr);
  }

  return postList.map((p) => ({ ...p, tags: tagsByPost.get(p.id) ?? [] }));
}

export async function getDraftPosts(authorId: string) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      updatedAt: posts.updatedAt,
      createdAt: posts.createdAt,
    })
    .from(posts)
    .where(and(eq(posts.authorId, authorId), eq(posts.published, false)))
    .orderBy(desc(posts.updatedAt));
}

export async function getPostForEdit(slug: string) {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      authorId: posts.authorId,
    })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);
  return post ?? null;
}

export async function getPostBySlug(slug: string) {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      published: posts.published,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      seriesId: posts.seriesId,
      seriesOrder: posts.seriesOrder,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!post) return null;

  const postTagsData = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  return { ...post, tags: postTagsData };
}

export async function getPostsByTag(tagSlug: string, limit = 20, offset = 0) {
  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, tagSlug))
    .limit(1);

  if (!tag) return [];

  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(postTags, eq(posts.id, postTags.postId))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.published, true)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

// ── 조회수 ───────────────────────────────────────────────────────

export async function incrementViewCount(postId: string) {
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
}

// ── 좋아요 ───────────────────────────────────────────────────────

export async function getLikeCount(postId: string): Promise<number> {
  const [result] = await db
    .select({ count: sql<number>`cast(count(*) as int)` })
    .from(likes)
    .where(eq(likes.postId, postId));
  return result?.count ?? 0;
}

export async function hasLiked(
  postId: string,
  fingerprint: string,
): Promise<boolean> {
  const [like] = await db
    .select({ id: likes.id })
    .from(likes)
    .where(and(eq(likes.postId, postId), eq(likes.fingerprint, fingerprint)))
    .limit(1);
  return !!like;
}

export async function addLike(
  postId: string,
  fingerprint: string,
  userId?: string,
) {
  await db
    .insert(likes)
    .values({ postId, fingerprint, userId: userId ?? null })
    .onConflictDoNothing();
}

export async function removeLike(postId: string, fingerprint: string) {
  await db
    .delete(likes)
    .where(and(eq(likes.postId, postId), eq(likes.fingerprint, fingerprint)));
}

// ── 태그 ─────────────────────────────────────────────────────────

export async function getAllTags() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`cast(count(${postTags.postId}) as int)`,
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.id, postTags.tagId))
    .groupBy(tags.id)
    .orderBy(desc(sql`count(${postTags.postId})`));
}

export async function getTagBySlug(slug: string) {
  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
  return tag ?? null;
}

export async function getTagIdsByNames(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const rows = await db
    .select({ id: tags.id })
    .from(tags)
    .where(inArray(tags.name, names));
  return rows.map((r) => r.id);
}

// ── 시리즈 ────────────────────────────────────────────────────────

export async function getAllSeries() {
  const allSeries = await db
    .select()
    .from(series)
    .orderBy(series.createdAt);

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
  const [s] = await db
    .select()
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);
  return s ?? null;
}

export async function getSeriesWithPosts(seriesId: string) {
  const [s] = await db
    .select()
    .from(series)
    .where(eq(series.id, seriesId))
    .limit(1);
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
