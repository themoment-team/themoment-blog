'use client';

import { loginWithDataGSM } from '@features/auth';
import { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface LoginModalProps {
  onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return createPortal(
    // biome-ignore lint/a11y/noStaticElementInteractions: backdrop click-to-close; keyboard handled via useEffect Escape listener
    // biome-ignore lint/a11y/useKeyWithClickEvents: same
    <div
      className="fixed inset-0 z-200 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation only */}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: same */}
      <div
        className="mx-4 w-full max-w-sm space-y-6 rounded-lg border border-border bg-bg p-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-bold text-2xl text-fg leading-tight tracking-display">그순간</h2>
            <p className="mt-1 text-fg-muted text-xs uppercase tracking-label">
              더모먼트 기술블로그
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted text-lg leading-none transition-colors hover:text-fg"
          >
            ✕
          </button>
        </div>

        <form action={loginWithDataGSM}>
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

        <p className="text-center text-fg-muted text-xs leading-relaxed">
          광주소프트웨어마이스터고등학교 학생만
          <br />
          로그인할 수 있습니다.
        </p>
      </div>
    </div>,
    document.body,
  );
}
