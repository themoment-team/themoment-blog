import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { likes, posts, postTags, series, tags, users } from "./db/schema";

export async function getPublishedPosts(limit = 20, offset = 0) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.published, true))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
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
      seriesId: posts.seriesId,
      seriesOrder: posts.seriesOrder,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      author: {
        id: users.id,
        name: users.name,
      },
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

  let seriesData = null;
  if (post.seriesId) {
    const [s] = await db
      .select()
      .from(series)
      .where(eq(series.id, post.seriesId))
      .limit(1);
    seriesData = s ?? null;
  }

  return { ...post, tags: postTagsData, series: seriesData };
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
      author: {
        id: users.id,
        name: users.name,
      },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .innerJoin(postTags, eq(posts.id, postTags.postId))
    .where(and(eq(postTags.tagId, tag.id), eq(posts.published, true)))
    .orderBy(desc(posts.publishedAt))
    .limit(limit)
    .offset(offset);
}

export async function incrementViewCount(postId: string) {
  await db
    .update(posts)
    .set({ viewCount: sql`${posts.viewCount} + 1` })
    .where(eq(posts.id, postId));
}

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

export async function getPostsBySeries(seriesId: string) {
  return db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      seriesOrder: posts.seriesOrder,
      published: posts.published,
    })
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), eq(posts.published, true)))
    .orderBy(posts.seriesOrder);
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  seriesId?: string;
  seriesOrder?: number;
  published: boolean;
  tagIds?: string[];
}) {
  const { tagIds, ...postData } = data;

  const [post] = await db
    .insert(posts)
    .values({
      ...postData,
      publishedAt: postData.published ? new Date() : null,
    })
    .returning();

  if (tagIds?.length) {
    await db
      .insert(postTags)
      .values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
  }

  return post;
}

export async function updatePost(
  postId: string,
  data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    coverImage: string;
    seriesId: string;
    seriesOrder: number;
    published: boolean;
    tagIds: string[];
  }>,
) {
  const { tagIds, ...postData } = data;

  const updateData: Record<string, unknown> = {
    ...postData,
    updatedAt: new Date(),
  };
  if (postData.published === true) {
    updateData.publishedAt = new Date();
  }

  const [post] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, postId))
    .returning();

  if (tagIds !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (tagIds.length > 0) {
      await db
        .insert(postTags)
        .values(tagIds.map((tagId) => ({ postId, tagId })));
    }
  }

  return post;
}

export async function deletePost(postId: string) {
  await db.delete(posts).where(eq(posts.id, postId));
}
