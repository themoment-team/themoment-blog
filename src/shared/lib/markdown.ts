import GithubSlugger from 'github-slugger';
import { fromMarkdown } from 'mdast-util-from-markdown';
import { toString as mdastToString } from 'mdast-util-to-string';
import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import rehypeSlug from 'rehype-slug';
import rehypeStringify from 'rehype-stringify';
import remarkGfm from 'remark-gfm';
import remarkParse from 'remark-parse';
import remarkRehype from 'remark-rehype';
import { createHighlighter, type Highlighter } from 'shiki';
import { unified } from 'unified';
import { visit } from 'unist-util-visit';

// Promise를 캐싱해 동시 요청 시 중복 초기화를 방지한다.
let highlighterPromise: Promise<Highlighter> | null = null;

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['github-light', 'github-dark'],
      langs: [
        'typescript',
        'tsx',
        'javascript',
        'jsx',
        'python',
        'java',
        'kotlin',
        'go',
        'rust',
        'bash',
        'shell',
        'sql',
        'json',
        'yaml',
        'html',
        'css',
        'markdown',
      ],
    });
  }
  return highlighterPromise;
}

function rehypeShiki(hl: Highlighter) {
  return () => (tree: Parameters<typeof visit>[0]) => {
    visit(
      tree,
      'element',
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
        if (node.tagName !== 'pre' || !node.children?.length) return;

        const codeEl = node.children[0];
        if (codeEl?.type !== 'element' || codeEl.tagName !== 'code') return;

        const codeElProps = (codeEl as { properties?: Record<string, unknown> }).properties;
        const className = (codeElProps?.className as string[]) ?? [];
        const langClass = className.find((c) => c.startsWith('language-'));
        const lang = langClass ? langClass.replace('language-', '') : 'text';

        const rawText =
          (codeEl.children as Array<{ type: string; value?: string }>)
            ?.filter((n) => n.type === 'text')
            .map((n) => n.value ?? '')
            .join('') ?? '';

        try {
          const html = hl.codeToHtml(rawText, {
            lang,
            themes: { light: 'github-light', dark: 'github-dark' },
            defaultColor: false,
          });
          Object.assign(node, { type: 'raw', value: html });
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
      behavior: 'wrap',
      properties: { className: ['anchor-heading'] },
    })
    .use(rehypeShiki(hl))
    .use(rehypeStringify, { allowDangerousHtml: true })
    .process(content);

  return String(file);
}

export function extractHeadings(
  content: string,
): Array<{ depth: 1 | 2 | 3; text: string; id: string }> {
  const headingRegex = /^(#{1,3})\s+(.+)$/gm;
  const headings: Array<{ depth: 1 | 2 | 3; text: string; id: string }> = [];
  // rehype-slug도 내부적으로 GithubSlugger를 사용하므로 동일한 인스턴스를 써야 ID가 일치한다.
  const slugger = new GithubSlugger();

  for (const match of content.matchAll(headingRegex)) {
    const depth = match[1].length as 1 | 2 | 3;
    const text = match[2].trim();
    const id = slugger.slug(text);
    headings.push({ depth, text, id });
  }

  return headings;
}

export function generateExcerpt(content: string, maxLength = 200): string {
  const tree = fromMarkdown(content);
  return mdastToString(tree)
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
}
