'use client';

import { logout } from '@features/auth';
import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

interface UserMenuProps {
  name: string;
}

export function UserMenu({ name }: UserMenuProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-fg-muted text-sm transition-colors hover:text-fg"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5 shrink-0"
          aria-hidden="true"
        >
          <circle cx="12" cy="8" r="4" />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
        </svg>
        <span className="hidden max-w-[6rem] truncate sm:block">{name}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={`size-3.5 shrink-0 opacity-60 transition-transform duration-150 ${open ? '-rotate-180' : ''}`}
          aria-hidden="true"
        >
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full right-0 z-[100] mt-2 w-44 overflow-hidden rounded-lg border border-border bg-bg">
          <div className="border-border border-b px-4 py-3">
            <p className="truncate font-medium text-fg text-sm">{name}</p>
          </div>
          <Link
            href="/my"
            onClick={() => setOpen(false)}
            className="block w-full px-4 py-2.5 text-fg-muted text-sm transition-colors hover:bg-bg-subtle hover:text-fg"
          >
            내 글 목록
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="w-full px-4 py-2.5 text-left text-red-400 text-sm transition-colors hover:bg-red-500/5 hover:text-red-500"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
