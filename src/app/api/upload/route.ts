import { NextResponse } from 'next/server';
import { auth } from '@/features/auth/config';
import { uploadImage } from '@/shared/lib/cloudinary';

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await req.formData();
  const file = formData.get('file');

  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'file required' }, { status: 400 });
  }

  const MAX_SIZE = 10 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: '파일 크기는 10MB 이하여야 합니다' }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await uploadImage(buffer);

  return NextResponse.json({ url: result.url });
}
