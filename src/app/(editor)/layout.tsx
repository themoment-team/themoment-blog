import type { ReactNode } from 'react';

export default function EditorLayout({ children }: { children: ReactNode }) {
  return <div className="flex h-screen flex-col overflow-hidden bg-bg text-fg">{children}</div>;
}
