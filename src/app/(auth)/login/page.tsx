import type { Metadata } from 'next';
import { signIn } from '@/features/auth/config';

export const metadata: Metadata = {
  title: '로그인',
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-10">
        {/* 로고 */}
        <div className="space-y-2 text-center">
          <h1 className="font-bold text-4xl text-fg leading-[1.0] tracking-[-0.04em]">그순간</h1>
          <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">더모먼트 기술블로그</p>
        </div>

        {/* 로그인 폼 */}
        <div className="space-y-4">
          <form
            action={async () => {
              'use server';
              await signIn('datagsm', { redirectTo: '/' });
            }}
          >
            <button
              type="submit"
              className="flex h-10 w-full items-center justify-center gap-4 rounded-lg bg-fg px-3 font-medium text-bg text-sm transition-opacity duration-150 hover:opacity-80"
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <rect x="0" y="0" width="10" height="2" fill="currentColor" />
                <rect x="0" y="2" width="4" height="2" fill="currentColor" />
                <rect x="8" y="2" width="4" height="2" fill="currentColor" />
                <rect x="0" y="4" width="4" height="2" fill="currentColor" />
                <rect x="10" y="4" width="4" height="2" fill="currentColor" />
                <rect x="0" y="6" width="4" height="2" fill="currentColor" />
                <rect x="10" y="6" width="4" height="2" fill="currentColor" />
                <rect x="0" y="8" width="4" height="2" fill="currentColor" />
                <rect x="10" y="8" width="4" height="2" fill="currentColor" />
                <rect x="0" y="10" width="4" height="2" fill="currentColor" />
                <rect x="8" y="10" width="4" height="2" fill="currentColor" />
                <rect x="0" y="12" width="10" height="2" fill="currentColor" />
              </svg>
              <span>DataGSM으로 로그인</span>
            </button>
          </form>
        </div>

        <p className="text-center text-fg-muted text-xs leading-relaxed">
          광주소프트웨어마이스터고등학교 학생만 로그인할 수 있습니다.
          <br />
          더모먼트 부원은 로그인 후 글을 작성할 수 있습니다.
        </p>
      </div>
    </div>
  );
}
