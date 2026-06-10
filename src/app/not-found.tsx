import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-bg px-4">
      <div className="space-y-6 text-center">
        <p className="select-none font-bold text-[8rem] text-fg leading-[1.0] tracking-[-0.06em] opacity-10">
          404
        </p>
        <div className="-mt-8 space-y-2">
          <h1 className="font-bold text-2xl text-fg tracking-[-0.03em]">
            페이지를 찾을 수 없습니다
          </h1>
          <p className="text-fg-muted text-sm">요청하신 페이지가 존재하지 않거나 이동되었습니다.</p>
        </div>
        <Link
          href="/"
          className="inline-block rounded border border-border px-4 py-2 font-medium text-fg-muted text-sm uppercase tracking-[0.06em] transition-colors hover:border-fg hover:text-fg"
        >
          홈으로
        </Link>
      </div>
    </div>
  );
}
