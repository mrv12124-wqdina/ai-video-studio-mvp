import './globals.css';
import './local.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AI Video Studio',
  description: 'Local-first novel video production studio'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="zh-CN"><body>{children}</body></html>;
}
