export function Footer() {
  return (
    <footer className="border-t border-border mt-auto">
      <div className="max-w-5xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-3">
        <span className="text-sm font-bold tracking-[-0.02em] text-fg">
          그순간
        </span>
        <div className="flex items-center gap-4 text-xs text-fg-muted uppercase tracking-[0.06em]">
          <a
            href="https://github.com/themoment-team"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition-colors"
          >
            더모먼트
          </a>
          <span>·</span>
          <a
            href="https://github.com/themoment-team/themoment-blog/blob/main/LICENSE"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-fg transition-colors"
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
