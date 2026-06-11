import type { ReactNode } from 'react';
import { Footer } from '@/widgets/footer';
import { Header } from '@/widgets/header';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
