import { NextResponse } from 'next/server';
import { getAllTags } from '@/features/post-view';

export async function GET() {
  const tags = await getAllTags();
  return NextResponse.json(tags);
}
