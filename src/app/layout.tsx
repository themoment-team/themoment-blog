import type { Metadata } from 'next';
import './globals.css';
import { ThemeProvider } from '@features/theme';

export const metadata: Metadata = {
  title: {
    template: '%s | 그순간',
    default: '그순간',
  },
  description: '광주소프트웨어마이스터고등학교 더모먼트 동아리 기술블로그',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'),
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col bg-bg font-sans text-fg antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
