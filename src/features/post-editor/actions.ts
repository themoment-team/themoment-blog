'use server';

import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { posts } from '@/entities/post';
import { auth } from '@/features/auth/config';
import { db } from '@/shared/lib/db';
import { deletePost } from './api';

export async function deletePostAction(postId: string) {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect('/');

  const [post] = await db
    .select({ authorId: posts.authorId })
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (!post || post.authorId !== session.user.id) redirect('/');

  await deletePost(postId);
  revalidatePath('/my');
}
