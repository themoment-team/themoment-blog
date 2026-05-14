"use client";

import { useState } from "react";
import { LoginModal } from "./login-modal";

export function LoginButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-sm font-medium text-fg border border-border px-3 py-1.5 rounded hover:bg-bg-subtle transition-colors"
      >
        로그인
      </button>
      {open && <LoginModal onClose={() => setOpen(false)} />}
    </>
  );
}
