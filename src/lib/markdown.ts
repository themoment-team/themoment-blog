import rehypeAutolinkHeadings from "rehype-autolink-headings";
import rehypeSlug from "rehype-slug";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { createHighlighter, type Highlighter } from "shiki";
import { unified } from "unified";
import { visit } from "unist-util-visit";

// Shiki 싱글톤 — Cold Start 비용 최소화
let highlighter: Highlighter | null = null;

async function getHighlighter(): Promise<Highlighter> {
  if (!highlighter) {
    highlighter = await createHighlighter({
      themes: ["github-light", "github-dark"],
      langs: [
        "typescript",
        "tsx",
        "javascript",
        "jsx",
        "python",
        "java",
        "kotlin",
        "go",
        "rust",
        "bash",
        "shell",
        "sql",
        "json",
        "yaml",
        "html",
        "css",
        "markdown",
      ],
    });
  }
  return highlighter;
}

// rehype 플러그인: Shiki로 코드 블록 하이라이팅
function rehypeShiki(hl: Highlighter) {
  return () => (tree: Parameters<typeof visit>[0]) => {
    visit(
      tree,
      "element",
      (node: {
        tagName: string;
        properties?: Record<string, unknown>;
        children?: Array<{
          type: string;
          value?: string;
          tagName?: string;
          children?: unknown[];
        }>;
      }) => {
        if (node.tagName !== "pre" || !node.children?.length) return;

        const codeEl = node.children[0];
        if (!codeEl || codeEl.type !== "element" || codeEl.tagName !== "code")
          return;

        const codeElProps = (codeEl as { properties?: Record<string, unknown> })
          .properties;
        const className = (codeElProps?.className as string[]) ?? [];
        const langClass = className.find((c) => c.startsWith("language-"));
        const lang = langClass ? langClass.replace("language-", "") : "text";

        const rawText =
          (codeEl.children as Array<{ type: string; value?: string }>)
            ?.filter((n) => n.type === "text")
            .map((n) => n.value ?? "")
            .join("") ?? "";

        try {
          const html = hl.codeToHtml(rawText, {
            lang,
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          });

          // raw HTML을 직접 노드로 교체
          Object.assign(node, { type: "raw", value: html });
        } catch {
          // 지원하지 않는 언어 → 그대로 유지
        }
      },
    );
  };
}

export async function markdownToHtml(content: string): Promise<string> {
  const hl = await getHighlighter();

  const file = await unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeSlug)
    .use(rehypeAutolinkHeadings, {
      behavior: "wrap",
      properties: { className: ["anchor-heading"] },
    })
    .use(rehypeShiki(hl))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return String(file);
}

// 마크다운에서 헤딩 목록 추출 (ToC 서버사이드 생성용)
export function extractHeadings(
  content: string,
): Array<{ depth: 1 | 2 | 3; text: string; id: string }> {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: Array<{ depth: 1 | 2 | 3; text: string; id: string }> = [];

  for (const match of content.matchAll(headingRegex)) {
    const depth = match[1].length as 1 | 2 | 3;
    const text = match[2].trim();
    const id = text
      .toLowerCase()
      .replace(/[^\w\s가-힣]/g, "")
      .replace(/\s+/g, "-");

    headings.push({ depth, text, id });
  }

  return headings;
}

// 포스트 excerpt 자동 생성 (마크다운 기호 제거)
export function generateExcerpt(content: string, maxLength = 200): string {
  return content
    .replace(/^#{1,6}\s+/gm, "")
    .replace(/[*_`~]/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\n+/g, " ")
    .trim()
    .slice(0, maxLength);
}
