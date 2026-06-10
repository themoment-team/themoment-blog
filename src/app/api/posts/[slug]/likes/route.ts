import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { posts } from '@/entities/post';
import { auth } from '@/features/auth/config';
import { addLike, getLikeCount, hasLiked, removeLike } from '@/features/post-view';
import { db } from '@/shared/lib/db';

async function resolvePostId(slug: string): Promise<string | null> {
  const [post] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
  return post?.id ?? null;
}

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const fp = searchParams.get('fp') ?? '';

  const postId = await resolvePostId(slug);
  if (!postId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const [count, liked] = await Promise.all([
    getLikeCount(postId),
    fp ? hasLiked(postId, fp) : Promise.resolve(false),
  ]);

  return NextResponse.json({ count, liked });
}

export async function POST(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const body = await req.json().catch(() => ({}));
  const fp = (body.fingerprint as string) ?? '';

  if (!fp) return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });

  const postId = await resolvePostId(slug);
  if (!postId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const session = await auth();
  const userId = session?.user.id;

  try {
    await addLike(postId, fp, userId);
    const count = await getLikeCount(postId);
    return NextResponse.json({ count, liked: true });
  } catch {
    const count = await getLikeCount(postId);
    return NextResponse.json({ count, liked: true }, { status: 409 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const { searchParams } = new URL(req.url);
  const fp = searchParams.get('fp') ?? '';

  if (!fp) return NextResponse.json({ error: 'fingerprint required' }, { status: 400 });

  const postId = await resolvePostId(slug);
  if (!postId) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  await removeLike(postId, fp);
  const count = await getLikeCount(postId);
  return NextResponse.json({ count, liked: false });
}
