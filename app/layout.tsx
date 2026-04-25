import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'OGP Redirect Tool',
  description: 'カスタムサムネイル付きの短縮URLを発行するツール',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
