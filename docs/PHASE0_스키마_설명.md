# Phase 0 — DB 스키마 설명

## 실행 방법

1. **Supabase 대시보드** → SQL Editor에서  
   `supabase/migrations/20260211000000_initial_schema.sql` 내용을 붙여넣고 **Run** 실행.

2. 또는 **Supabase CLI** 사용 시:
   ```bash
   supabase db push
   ```
   (프로젝트 루트에서, `supabase` 폴더가 연결된 경우)

- `profile` 테이블은 `auth.users(id)`를 참조합니다. Supabase Auth를 사용할 때만 유효합니다. Auth 미사용 시 해당 FK를 제거하거나 `auth.users` 대신 별도 member 테이블로 대체할 수 있습니다.

---

## 생성된 구조 요약

| 구분 | 테이블/타입 | 용도 |
|------|-------------|------|
| **Enum** | `issue_status_enum` | 접수/확인/처리중/해결/반려 |
| | `cleaning_cycle_enum` | 청소 주기 (daily, twice_weekly, weekly, other) |
| | `church_role_enum` | admin, facility_lead, facility_sublead, staff, external_cleaning |
| | `issue_activity_kind_enum` | 이슈 활동 로그 종류 |
| **계층** | `church` | 교회 (timezone 포함) |
| | `floor` | 층 (church_id FK) |
| | `room` | 공간 (floor_id FK, cleaning_cycle) |
| **상태** | `room_status` | room_id + status_date 기준, open_issue_count, clean_done_today, check_done_ratio_today, shortage_count (이벤트 기반 갱신) |
| **권한** | `profile` | auth.users 연동 프로필 |
| | `church_member` | church_id + member_id + role |
| **이슈** | `issue` | room_id, status, 담당자·시간 컬럼, before/after 이미지 경로 |
| | `issue_activity_log` | 이력 전용 (issue_id, member_id, kind, content) |
| **청소** | `daily_cleaning_task` | room_id, task_date, assigned_to, completed_at, completed_by |
| **점검** | `check_template_item` | room별 점검 항목 템플릿 |
| | `daily_check_plan` | room + plan_date + template_item 완료 기록 |
| **비품** | `room_supply_shortage` | room_id, item_name, reported_at, resolved_at |
| **예약** | `room_booking` | room_id, member_id, start_at, end_at |
| **RPC** | `rpc_room_detail(room_id, date)` | 공간 상세 한 화면용 (현재 스텁, Phase 2에서 구현) |

---

## 인덱스

- 모든 FK 컬럼에 인덱스 생성됨.
- `room_status`: room_id, status_date, (room_id, status_date).
- `issue`: room_id, church_id, status, created_at.
- `daily_cleaning_task`, `daily_check_plan`, `room_booking`: room_id, 날짜/시간 컬럼.

---

## 기준선 준수 사항

- **로그/상태 분리**: `issue_activity_log`(이력), `room_status`(현재 상태), `daily_*`(할당·완료 기록).
- **실시간 계산 금지**: 집계는 `room_status` 등 사전 유지, 이벤트 기반 갱신.
- **timestamptz**: 모든 시간 컬럼 사용.
- **enum**: 상태·역할·활동 종류는 enum 사용, magic string 없음.
- **한 화면 한 API**: `rpc_room_detail(room_id, date)` 스텁 제공.

---

*Phase 0 완료. Phase 1에서 시드 데이터 및 UI 진행.*
