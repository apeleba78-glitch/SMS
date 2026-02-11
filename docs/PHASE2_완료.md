# Phase 2 완료: 공간 카드 4요소 + room_status 연동

## 완료 내용

- **room_status**: 기존 스키마 유지 (open_issue_count, clean_done_today, check_done_ratio_today, shortage_count). 추가 스키마 없음.
- **RPC**
  - `rpc_room_detail(p_room_id, p_date)`: 공간 상세 한 화면용. room + room_status(해당 날짜) 반환. 필요한 컬럼만, select * 금지.
  - `rpc_floor_room_cards(p_floor_id, p_date)`: 해당 층 공간 목록 + 4요소. 목록 화면 한 번 호출.
- **프론트**
  - 층별 공간 목록: `rpc_floor_room_cards` 1회 호출 → 카드에 청소 상태, 미해결 이슈 수, 점검 완료율, 부족 비품 수 표시. 색상은 PROJECT_BASELINE 1-3 (Neutral Gray, Green 600, Blue 600, Orange 500, Red 600)만 사용.
  - 공간 카드 클릭 → `/room/[id]`. 공간 상세는 `rpc_room_detail` 1회만 호출.

## 적용 순서

1. Supabase SQL Editor에서 `supabase/migrations/20260212000000_phase2_rpc_room_detail_and_cards.sql` 실행.
2. 로컬에서 `npm run dev` 후 층 → 공간 목록(4요소 표시) → 공간 클릭 → 상세 확인.

## 파일

- `supabase/migrations/20260212000000_phase2_rpc_room_detail_and_cards.sql` — RPC 2개
- `app/floor/[id]/page.tsx` — 층별 공간 카드(4요소), RPC 호출
- `app/room/[id]/page.tsx` — 공간 상세, rpc_room_detail 호출
- `app/globals.css` — cardBadge, cardRow (5색 뱃지)
