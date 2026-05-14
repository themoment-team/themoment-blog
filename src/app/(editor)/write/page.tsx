import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { MarkdownEditor } from "@/components/editor/MarkdownEditor";
import { auth } from "@/lib/auth";

export const metadata: Metadata = { title: "새 포스트" };

export default async function WritePage() {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect("/");

  return <MarkdownEditor />;
}
