'use client';

import { useState } from 'react';
import { LoginModal } from './login-modal';

export function LoginButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded border border-border px-3 py-1.5 font-medium text-fg text-sm transition-colors hover:bg-bg-subtle"
      >
        로그인
      </button>
      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
}
