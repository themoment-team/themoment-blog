import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateExcerpt } from "@/lib/markdown";
import { deletePost, getPostBySlug, updatePost } from "@/lib/posts";
import { findOrCreateTag } from "@/lib/tags";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(post);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.author.id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const {
    title,
    content,
    excerpt,
    coverImage,
    seriesId,
    seriesOrder,
    published,
    tagNames,
  } = body;

  const tagIds: string[] | undefined = Array.isArray(tagNames)
    ? await Promise.all(
        (tagNames as string[])
          .filter(Boolean)
          .map((n) => findOrCreateTag(n.trim())),
      )
    : undefined;

  const updated = await updatePost(post.id, {
    title,
    content,
    excerpt: excerpt || (content ? generateExcerpt(content) : undefined),
    coverImage,
    seriesId,
    seriesOrder,
    published,
    tagIds,
  });

  return NextResponse.json({ slug: updated.slug });
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.author.id !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await deletePost(post.id);
  return NextResponse.json({ ok: true });
}
