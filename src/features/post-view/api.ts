import { likes, posts, postTags } from "@entities/post";
import { tags } from "@entities/tag";
import { users } from "@entities/user";
import { db } from "@shared/lib/db";
import { and, desc, eq, inArray, sql } from "drizzle-orm";

// ── 포스트 조회 ────────────────────────────────────────────────

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
      author: { id: users.id, name: users.name },
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
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
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
