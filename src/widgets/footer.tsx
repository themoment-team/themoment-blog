export function Footer() {
  return (
    <footer className="mt-auto border-border border-t">
      <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-3 px-4 py-8 sm:flex-row">
        <span className="font-bold text-fg text-sm tracking-[-0.02em]">그순간</span>
        <div className="flex items-center gap-4 text-fg-muted text-xs uppercase tracking-[0.06em]">
          <a
            href="https://github.com/themoment-team"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            더모먼트
          </a>
          <span>·</span>
          <a
            href="https://github.com/themoment-team/themoment-blog/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-fg"
          >
            MIT License
          </a>
          <span>·</span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  );
}
