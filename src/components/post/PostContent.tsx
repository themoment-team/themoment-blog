import { markdownToHtml } from "@/lib/markdown";

interface PostContentProps {
  content: string;
}

export async function PostContent({ content }: PostContentProps) {
  const html = await markdownToHtml(content);

  return (
    <div
      className="prose"
      // biome-ignore lint/security/noDangerouslySetInnerHtml: 서버사이드에서 생성한 안전한 HTML
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
