import { auth } from '@/features/auth/config';
import { markdownToHtml } from '@/shared/lib/markdown';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { content } = await req.json();
  if (typeof content !== 'string') {
    return Response.json({ error: 'content must be a string' }, { status: 400 });
  }
  const html = await markdownToHtml(content);
  return Response.json({ html });
}
