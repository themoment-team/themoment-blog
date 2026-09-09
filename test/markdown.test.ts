import assert from 'node:assert/strict';
import test from 'node:test';
import { markdownToHtml } from '../src/shared/lib/markdown.ts';

test('이미지 다음 인용문을 별도 블록으로 렌더링한다', async () => {
  const html = await markdownToHtml(
    '<img src="https://example.com/image.png" width="293" alt="이미지" />\n> 인용문',
  );

  assert.match(html, /<blockquote>/);
});
