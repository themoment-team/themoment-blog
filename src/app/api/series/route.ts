import { auth } from '@features/auth/config';
import { upsertSeries } from '@features/post-editor';
import { getAllSeries } from '@features/post-view';
import { NextResponse } from 'next/server';

export async function GET() {
  const allSeries = await getAllSeries();
  return NextResponse.json(allSeries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { title } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: 'title required' }, { status: 400 });
  }

  const id = await upsertSeries(title.trim());
  return NextResponse.json({ id }, { status: 201 });
}
