import type { ReactNode } from "react";

export default function EditorLayout({ children }: { children: ReactNode }) {
  return (
    <div className="h-screen flex flex-col overflow-hidden bg-bg text-fg">
      {children}
    </div>
  );
}
