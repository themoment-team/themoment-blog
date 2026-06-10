import { auth } from "@features/auth/config";
import { createPost } from "@features/post-editor";
import { ALLOWED_TAGS } from "@shared/config/tags";
import { generateExcerpt } from "@shared/lib/markdown";
import { NextResponse } from "next/server";

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
    published,
    tagNames,
    seriesTitle,
    seriesOrder,
  } = body;

  if (!title || !slug || !content) {
    return NextResponse.json(
      { error: "title, slug, content required" },
      { status: 400 },
    );
  }

  const validatedTagNames = Array.isArray(tagNames)
    ? (tagNames as string[]).filter((t) =>
        (ALLOWED_TAGS as readonly string[]).includes(t),
      )
    : [];

  const post = await createPost({
    title,
    slug,
    content,
    excerpt: excerpt || generateExcerpt(content),
    coverImage: coverImage ?? undefined,
    authorId: session.user.id,
    published: published ?? false,
    tagNames: validatedTagNames,
    seriesTitle: seriesTitle ?? undefined,
    seriesOrder: typeof seriesOrder === "number" && !Number.isNaN(seriesOrder) ? seriesOrder : undefined,
  });

  return NextResponse.json({ slug: post.slug }, { status: 201 });
}
