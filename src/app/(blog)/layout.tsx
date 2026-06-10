import type { ReactNode } from 'react';
import { Footer } from '../_components/footer';
import { Header } from '../_components/header';

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
