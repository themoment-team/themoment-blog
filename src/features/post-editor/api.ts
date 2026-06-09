import { posts, postTags } from "@entities/post";
import { series } from "@entities/series";
import { getTagIdsByNames } from "@features/post-view/api";
import { db } from "@shared/lib/db";
import { eq } from "drizzle-orm";

export async function upsertSeries(title: string): Promise<string> {
  const [existing] = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.title, title))
    .limit(1);

  if (existing) return existing.id;

  let slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  if (!slug) {
    slug = `series-${Math.random().toString(36).slice(2, 8)}`;
  }

  const [slugConflict] = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);

  if (slugConflict) {
    slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
  }

  const [created] = await db
    .insert(series)
    .values({ title, slug })
    .returning({ id: series.id });

  return created.id;
}

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  published: boolean;
  tagNames?: string[];
  seriesTitle?: string;
  seriesOrder?: number;
}) {
  const { tagNames, seriesTitle, seriesOrder, ...postData } = data;

  let seriesId: string | null = null;
  if (seriesTitle?.trim()) {
    seriesId = await upsertSeries(seriesTitle.trim());
  }

  const [post] = await db
    .insert(posts)
    .values({
      ...postData,
      seriesId,
      seriesOrder: seriesId ? (seriesOrder ?? null) : null,
      publishedAt: postData.published ? new Date() : null,
    })
    .returning();

  if (tagNames?.length) {
    const tagIds = await getTagIdsByNames(tagNames);
    if (tagIds.length > 0) {
      await db
        .insert(postTags)
        .values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
    }
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
    published: boolean;
    tagNames: string[];
    seriesTitle: string | null;
    seriesOrder: number | null;
  }>,
) {
  const { tagNames, seriesTitle, seriesOrder, ...postData } = data;

  const updateData: Record<string, unknown> = {
    ...postData,
    updatedAt: new Date(),
  };

  if ("seriesTitle" in data) {
    const trimmedSeriesTitle = seriesTitle?.trim();
    if (trimmedSeriesTitle) {
      updateData.seriesId = await upsertSeries(trimmedSeriesTitle);
      updateData.seriesOrder = seriesOrder ?? null;
    } else {
      updateData.seriesId = null;
      updateData.seriesOrder = null;
    }
  }

  if (postData.published === true) {
    updateData.publishedAt = new Date();
  }

  const [post] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, postId))
    .returning();

  if (tagNames !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (tagNames.length > 0) {
      const tagIds = await getTagIdsByNames(tagNames);
      if (tagIds.length > 0) {
        await db
          .insert(postTags)
          .values(tagIds.map((tagId) => ({ postId, tagId })));
      }
    }
  }

  return post;
}

export async function deletePost(postId: string) {
  await db.delete(posts).where(eq(posts.id, postId));
}
