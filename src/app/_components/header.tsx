import { auth } from "@features/auth/config";
import { ThemeToggle } from "@features/theme";
import Link from "next/link";
import { LoginButton } from "./login-button";
import { UserMenu } from "./user-menu";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-bg/90 backdrop-blur-sm">
      <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label="홈으로" />

        <nav className="hidden sm:flex items-center gap-6 text-sm text-fg-muted">
          <Link href="/posts" className="hover:text-fg transition-colors">
            포스트
          </Link>
          <Link href="/series" className="hover:text-fg transition-colors">
            시리즈
          </Link>
          <Link href="/about" className="hover:text-fg transition-colors">
            더모먼트
          </Link>
          {session?.user.isMomentMember && (
            <Link href="/write" className="hover:text-fg transition-colors">
              글쓰기
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? (
            <UserMenu name={session.user.name ?? "사용자"} />
          ) : (
            <LoginButton />
          )}
        </div>
      </div>
    </header>
  );
}
