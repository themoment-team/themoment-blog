import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/config';
import { deletePost, updatePost } from '@/features/post-editor';
import { getPostBySlug } from '@/features/post-view';
import { ALLOWED_TAGS } from '@/shared/config/tags';
import { notifyPostPublished } from '@/shared/lib/discord';
import { generateExcerpt } from '@/shared/lib/markdown';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (!post.published) {
    const session = await auth();
    if (session?.user.id !== post.author.id) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
  }

  return NextResponse.json(post);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (post.author.id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    content,
    excerpt,
    coverImage,
    published,
    tagNames,
    seriesTitle,
    seriesDescription,
    seriesOrder,
  } = body;

  const validatedTagNames = Array.isArray(tagNames)
    ? (tagNames as string[]).filter((t) => (ALLOWED_TAGS as readonly string[]).includes(t))
    : undefined;

  const updated = await updatePost(post.id, {
    title,
    content,
    excerpt: excerpt || (content ? generateExcerpt(content) : undefined),
    coverImage,
    published,
    tagNames: validatedTagNames,
    ...('seriesTitle' in body && {
      seriesTitle: seriesTitle ?? null,
      seriesDescription: seriesDescription ?? null,
      seriesOrder:
        typeof seriesOrder === 'number' && !Number.isNaN(seriesOrder) ? seriesOrder : null,
    }),
  });

  const publishedPost =
    !post.published && updated.published ? await getPostBySlug(updated.slug) : null;
  if (publishedPost) {
    await notifyPostPublished({
      title: publishedPost.title,
      slug: publishedPost.slug,
      authorName: publishedPost.author.name,
      excerpt: publishedPost.excerpt,
      coverImage: publishedPost.coverImage,
      seriesTitle: publishedPost.seriesTitle ?? undefined,
      tagNames: publishedPost.tags.map((tag) => tag.name),
    });
  }

  return NextResponse.json({ slug: updated.slug });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  if (post.author.id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  await deletePost(post.id);
  return NextResponse.json({ ok: true });
}
