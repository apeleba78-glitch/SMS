# Phase 1 완료: 교회 → 층 → 공간 목록 조회

## 완료 내용

- **시드 데이터**: `supabase/seed.sql` — 교회 1개, 층 3개(지하1층/1층/2층), 층별 공간(식당, 화장실, 당목실, 회의실, 작은예배실, 본예배당, 기도실 등).
- **웹앱**: Next.js(App Router) + Supabase 클라이언트.
  - **화면**: 층 목록(홈) → 층 선택 시 해당 층의 공간(Room) 목록.
  - **API**: 홈 = 층 목록 1회 호출. 공간 목록 = 해당 층 공간 1회 호출(floor name 포함).
- **디자인**: PROJECT_BASELINE 준수 — 모바일 우선(360~430px), 16px 패딩, radius 14px, 5색(Neutral/Green/Blue/Orange/Red), 카드 기반, Flat, Primary 버튼 규격.

## 실행 순서

1. Supabase에 **마이그레이션** 적용 후 **시드** 실행  
   - `supabase/migrations/20260211000000_initial_schema.sql`  
   - `supabase/seed.sql`
2. `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 설정.
3. `npm install` → `npm run dev` → 브라우저에서 층 목록 → 층 클릭 → 공간 목록 확인.

## 파일

- `app/page.tsx` — 층 목록
- `app/floor/[id]/page.tsx` — 해당 층 공간 목록(한 API 호출)
- `app/globals.css` — 디자인 토큰
- `lib/supabase.ts` — Supabase 클라이언트
- `supabase/seed.sql` — 시드 데이터
