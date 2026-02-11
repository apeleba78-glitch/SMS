import type { Metadata } from 'next';
import './globals.css';
import Header from './components/Header';

export const metadata: Metadata = {
  title: '공간 관리',
  description: '건물 공간 관리 시스템',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="app">
          <Header />
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
