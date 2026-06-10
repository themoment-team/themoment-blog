// NextAuth가 form-encoded로 전송하는 token 요청을 DataGSM이 요구하는 JSON으로 변환하는 프록시.
// client_id/client_secret은 서버 환경변수에서만 주입하고, 클라이언트가 제어 가능한 파라미터만 통과시킨다.
const ALLOWED_PARAMS = ['code', 'redirect_uri', 'grant_type'] as const;

export async function POST(request: Request) {
  const text = await request.text();
  const params = new URLSearchParams(text);

  const body: Record<string, string> = {
    client_id: process.env.DATAGSM_CLIENT_ID ?? '',
    client_secret: process.env.DATAGSM_CLIENT_SECRET ?? '',
  };
  for (const key of ALLOWED_PARAMS) {
    const val = params.get(key);
    if (val) body[key] = val;
  }

  const res = await fetch('https://oauth.authorization.datagsm.kr/v1/oauth/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data: unknown = await res.json();
  return Response.json(data, { status: res.status });
}
