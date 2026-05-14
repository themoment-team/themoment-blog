import "@/types/auth";
import { eq } from "drizzle-orm";
import NextAuth from "next-auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { DataGSMProvider } from "./datagsm-provider";

async function checkMomentMembership(email: string): Promise<boolean> {
  const apiKey = process.env.DATAGSM_API_KEY;
  if (!apiKey) return false;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 3000);

  try {
    const res = await fetch(
      `https://openapi.datagsm.kr/v1/students?email=${encodeURIComponent(email)}`,
      {
        headers: { "X-API-KEY": apiKey },
        signal: controller.signal,
      },
    );

    if (!res.ok) return false;

    const json = await res.json();
    const student = json?.data?.students?.[0];
    return (
      student?.majorClub?.name === "더모먼트" &&
      student?.majorClub?.type === "MAJOR_CLUB"
    );
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    DataGSMProvider({
      clientId: process.env.DATAGSM_CLIENT_ID!,
      clientSecret: process.env.DATAGSM_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 24 * 60 * 60, // 24시간
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async signIn({ user }) {
      if (!user.email || !user.name) return false;

      const isMomentMember = await checkMomentMembership(user.email);

      try {
        await db
          .insert(users)
          .values({
            email: user.email,
            name: user.name,
            isMomentMember,
          })
          .onConflictDoUpdate({
            target: users.email,
            set: { name: user.name, isMomentMember },
          });
      } catch (err) {
        console.error("[auth] DB upsert 실패:", err);
        return false;
      }

      return true;
    },

    async jwt({ token, user }) {
      if (user?.email) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.email, user.email),
        });
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
