import { posts, postTags } from "@entities/post";
import { getTagIdsByNames } from "@features/post-view/api";
import { db } from "@shared/lib/db";
import { eq } from "drizzle-orm";

export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  published: boolean;
  tagNames?: string[];
}) {
  const { tagNames, ...postData } = data;

  const [post] = await db
    .insert(posts)
    .values({
      ...postData,
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
  }>,
) {
  const { tagNames, ...postData } = data;

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
