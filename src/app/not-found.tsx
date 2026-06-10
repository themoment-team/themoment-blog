import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-bg px-4">
      <div className="text-center space-y-6">
        <p className="text-[8rem] font-bold tracking-[-0.06em] leading-[1.0] text-fg opacity-10 select-none">
          404
        </p>
        <div className="space-y-2 -mt-8">
          <h1 className="text-2xl font-bold tracking-[-0.03em] text-fg">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-sm text-fg-muted">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        </div>
        <Link
          href="/"
          className="inline-block text-sm font-medium uppercase tracking-[0.06em] text-fg-muted border border-border px-4 py-2 rounded hover:text-fg hover:border-fg transition-colors"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
