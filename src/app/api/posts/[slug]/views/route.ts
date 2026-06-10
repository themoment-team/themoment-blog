import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { posts } from '@/entities/post';
import { incrementViewCount } from '@/features/post-view';
import { db } from '@/shared/lib/db';

export async function POST(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);

  if (!post) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  await incrementViewCount(post.id);
  return NextResponse.json({ ok: true });
}
