import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { auth } from "@/lib/auth";
import { getPostBySlug } from "@/lib/posts";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  return { title: post ? `수정: ${post.title}` : "포스트 수정" };
}

export default async function EditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect("/");

  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  if (post.author.id !== session.user.id) redirect("/");

  return (
    <MarkdownEditor
      initialTitle={post.title}
      initialContent={post.content}
      slug={slug}
    />
  );
}
