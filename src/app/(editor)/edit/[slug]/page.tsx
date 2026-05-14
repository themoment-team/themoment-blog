import { auth } from "@features/auth/config";
import { MarkdownEditor } from "@features/post-editor";
import { getPostForEdit } from "@features/post-view";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostForEdit(decodeURIComponent(slug));
  return { title: post ? `수정: ${post.title}` : "포스트 수정" };
}

export default async function EditPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect("/");

  const { slug } = await params;
  const decodedSlug = decodeURIComponent(slug);
  const post = await getPostForEdit(decodedSlug);
  if (!post) notFound();

  if (post.authorId !== session.user.id) redirect("/");

  return (
    <MarkdownEditor
      initialTitle={post.title}
      initialContent={post.content}
      slug={decodedSlug}
    />
  );
}
