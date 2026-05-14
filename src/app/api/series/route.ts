import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createSeries, getAllSeries } from "@/lib/series";

export async function GET() {
  const data = await getAllSeries();
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, description } = body;

  if (!name?.trim()) {
    return NextResponse.json({ error: "name required" }, { status: 400 });
  }

  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const s = await createSeries({
    name: name.trim(),
    slug,
    description: description?.trim() || undefined,
    authorId: session.user.id,
  });

  return NextResponse.json(s, { status: 201 });
}
