'use client';

import Link from 'next/link';

export default function Header() {
  return (
    <header className="appHeader">
      <Link href="/" className="appHeaderTitle">공간 관리</Link>
      <span className="appHeaderSub">테스트</span>
    </header>
  );
}
