import { markdownToHtml } from "@shared/lib/markdown";

export async function POST(req: Request) {
  const { content } = await req.json();
  if (typeof content !== "string") {
    return Response.json(
      { error: "content must be a string" },
      { status: 400 },
    );
  }
  const html = await markdownToHtml(content);
  return Response.json({ html });
}
