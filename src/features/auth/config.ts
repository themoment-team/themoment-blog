import 'server-only';
import '@features/auth/types';
import { users } from '@entities/user';
import { db } from '@shared/lib/db';
import { eq } from 'drizzle-orm';
import NextAuth from 'next-auth';
import { DataGSMProvider } from './provider';

// null: API 오류(기존 DB 값 보존), boolean: 실제 멤버십 결과
async function checkMomentMembership(email: string): Promise<boolean | null> {
  const apiKey = process.env.DATAGSM_API_KEY;
  if (!apiKey) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `https://openapi.datagsm.kr/v1/students?email=${encodeURIComponent(email)}`,
      {
        headers: { 'X-API-KEY': apiKey },
        signal: controller.signal,
      },
    );

    if (!res.ok) return null;

    const json = await res.json();
    const student = json?.data?.students?.[0];
    return student?.majorClub?.name === '더모먼트' && student?.majorClub?.type === 'MAJOR_CLUB';
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

const clientId = process.env.DATAGSM_CLIENT_ID;
const clientSecret = process.env.DATAGSM_CLIENT_SECRET;
if (!clientId || !clientSecret)
  throw new Error('DATAGSM_CLIENT_ID, DATAGSM_CLIENT_SECRET 환경변수가 설정되지 않았습니다');

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [DataGSMProvider({ clientId, clientSecret })],
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) return false;

      const membership = await checkMomentMembership(user.email);

      try {
        await db
          .insert(users)
          .values({
            email: user.email,
            name: user.name,
            isMomentMember: membership ?? false,
          })
          .onConflictDoUpdate({
            target: users.email,
            // API 오류(null)면 isMomentMember를 덮어쓰지 않고 기존 DB 값 보존
            set:
              membership !== null
                ? { name: user.name, isMomentMember: membership }
                : { name: user.name },
          });
      } catch (err) {
        console.error('[auth] DB upsert 실패:', err);
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const [dbUser] = await db
          .select({ id: users.id, isMomentMember: users.isMomentMember })
          .from(users)
          .where(eq(users.email, user.email))
          .limit(1);
        token.userId = dbUser?.id;
        token.isMomentMember = dbUser?.isMomentMember ?? false;
      }
      return token;
    },

    async session({ session, token }) {
      session.user.id = token.userId as string;
      session.user.isMomentMember = token.isMomentMember as boolean;
      return session;
    },
  },
});
