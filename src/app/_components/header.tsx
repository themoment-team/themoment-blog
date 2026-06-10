import { auth } from '@features/auth/config';
import { ThemeToggle } from '@features/theme';
import Link from 'next/link';
import { LoginButton } from './login-button';
import { UserMenu } from './user-menu';

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-50 border-border border-b bg-bg/90 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between gap-4 px-4">
        <Link href="/" className="shrink-0" aria-label="홈으로" />

        <nav className="hidden items-center gap-6 text-fg-muted text-sm sm:flex">
          <Link href="/posts" className="transition-colors hover:text-fg">
            포스트
          </Link>
          <Link href="/series" className="transition-colors hover:text-fg">
            시리즈
          </Link>
          <Link href="/about" className="transition-colors hover:text-fg">
            더모먼트
          </Link>
          {session?.user.isMomentMember && (
            <Link href="/write" className="transition-colors hover:text-fg">
              글쓰기
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          {session ? <UserMenu name={session.user.name ?? '사용자'} /> : <LoginButton />}
        </div>
      </div>
    </header>
  );
}
