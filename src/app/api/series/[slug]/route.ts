import { NextResponse } from 'next/server';
import { getSeriesBySlug, getSeriesWithPosts } from '@/entities/series';

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const s = await getSeriesBySlug(decodeURIComponent(slug));
  if (!s) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = await getSeriesWithPosts(s.id);
  return NextResponse.json(data);
}
