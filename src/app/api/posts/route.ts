import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { generateExcerpt } from "@/lib/markdown";
import { createPost } from "@/lib/posts";
import { findOrCreateTag } from "@/lib/tags";

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    slug,
    content,
    excerpt,
    coverImage,
    seriesId,
    seriesOrder,
    published,
    tagNames,
  } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "title, slug, content required" },
      { status: 400 },
    );
  }

  const tagIds: string[] = [];
  if (Array.isArray(tagNames)) {
    for (const name of tagNames as string[]) {
      if (name.trim()) {
        const id = await findOrCreateTag(name.trim());
        tagIds.push(id);
      }
    }
  }

  const post = await createPost({
    title,
    slug,
    content,
    excerpt: excerpt || generateExcerpt(content),
    coverImage: coverImage ?? undefined,
    authorId: session.user.id,
    seriesId: seriesId ?? undefined,
    seriesOrder: seriesOrder ?? undefined,
    published: published ?? false,
    tagIds,
  });

  return NextResponse.json({ slug: post.slug }, { status: 201 });
}
