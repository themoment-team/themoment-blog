import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/lib/db/schema";
import { incrementViewCount } from "@/lib/posts";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const [post] = await db
    .select({ id: posts.id })
    .from(posts)
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!post) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await incrementViewCount(post.id);
  return NextResponse.json({ ok: true });
}
