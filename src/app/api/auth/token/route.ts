export async function POST(request: Request) {
  const text = await request.text();
  const params = new URLSearchParams(text);
  const body: Record<string, string> = {};
  for (const [k, v] of params) body[k] = v;

  const res = await fetch(
    "https://oauth.authorization.datagsm.kr/v1/oauth/token",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );

  const data: unknown = await res.json();
  return Response.json(data, { status: res.status });
}
