# Phase 3 완료: 이슈(문제) 관리 핵심

## 완료 내용

- **생애주기**: 접수(received) → 확인(confirmed) → 처리중(in_progress) → 해결완료(resolved) 또는 반려(rejected). 반려 시 반려 사유 저장.
- **이벤트 기반 room_status**: 이슈 생성 시 `room_status.open_issue_count` +1, 해결/반려 시 -1. 트리거로 구현.
- **이슈·활동 로그 분리**: `issue` 테이블(현재 상태), `issue_activity_log`(이력 전용). 상태 변경 시 수행자·시간 자동 저장, 활동 로그 삽입.
- **API**: 이슈 목록 `rpc_issue_list(room_id)`, 이슈 상세 `rpc_issue_detail(issue_id)`(한 번 호출), 상태 변경 RPC: `rpc_issue_confirm`, `rpc_issue_progress`, `rpc_issue_resolve`, `rpc_issue_reject`.
- **프론트**: 이슈 접수 폼, 이슈 목록·상세, 상태 변경 버튼(확인, 완료 처리, 해결 완료, 취소). 버튼 문구 PROJECT_BASELINE 1-4 준수. 이미지 업로드는 Phase 4에서.

## 적용 순서

1. Supabase SQL Editor에서 `supabase/migrations/20260213000000_phase3_issue_management.sql` 실행.
2. 로컬에서 앱 실행 후: 공간 상세 → 이슈 접수 / 이슈 목록 → 접수 폼 제출 → 이슈 상세에서 확인/완료 처리/해결 완료/취소 동작 확인.

## 파일

- `supabase/migrations/20260213000000_phase3_issue_management.sql` — 트리거(church_id, room_status ±1), RPC(상태 변경·목록·상세), `issue_activity_log.member_id` nullable
- `app/room/[id]/page.tsx` — 이슈 목록/이슈 접수 링크 추가
- `app/room/[id]/issue/new/page.tsx` — 이슈 접수 폼
- `app/room/[id]/issues/page.tsx` — 공간별 이슈 목록
- `app/issue/[id]/page.tsx` — 이슈 상세 + 활동 로그 + 상태 변경 버튼
