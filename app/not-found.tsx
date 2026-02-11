import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="card">
      <h1 className="pageTitle">페이지를 찾을 수 없습니다</h1>
      <p style={{ marginBottom: 8 }}>주소가 잘못되었거나 페이지가 없습니다.</p>
      <p style={{ fontSize: 14, color: 'var(--color-neutral)', marginBottom: 16 }}>
        홈에서 <strong>층 선택</strong> 후 공간·이슈로 이동하세요.
      </p>
      <Link href="/" className="btnPrimary" style={{ display: 'block', textAlign: 'center' }}>
        홈(층 선택)으로
      </Link>
    </div>
  );
}
