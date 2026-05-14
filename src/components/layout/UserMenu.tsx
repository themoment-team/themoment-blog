"use client";

import { useEffect, useRef, useState } from "react";
import { logout } from "@/lib/auth/actions";

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
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 text-sm text-fg-muted hover:text-fg transition-colors"
      >
        <span className="size-7 rounded-full bg-bg-subtle border border-border flex items-center justify-center text-xs font-bold text-fg shrink-0">
          {name[0]}
        </span>
        <span className="hidden sm:block max-w-[6rem] truncate">{name}</span>
        <span className="text-[10px] opacity-60">▾</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-bg border border-border rounded-lg overflow-hidden z-[100]">
          <div className="px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-fg truncate">{name}</p>
          </div>
          <form action={logout}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-bg-subtle transition-colors"
            >
              로그아웃
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
