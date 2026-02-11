-- Phase 10: 성능·접근성 점검 — 인덱스 재확인, N+1·select*·불필요 join 없음 확인
-- PROJECT_BASELINE 5장: FK·room_status·날짜 인덱스. select* 금지.

-- =============================================================================
-- 인덱스 재확인 (이미 Phase 0~8에서 적용된 항목 요약)
-- =============================================================================
-- FK: idx_floor_church_id, idx_room_floor_id, idx_room_status_room_id,
--     idx_church_member_church_id, idx_church_member_member_id,
--     idx_issue_room_id, idx_issue_church_id, idx_daily_cleaning_task_room_id,
--     idx_room_booking_room_id, idx_room_supply_shortage_room_id 등 적용됨.
-- room_status: idx_room_status_room_id, idx_room_status_status_date, idx_room_status_room_date.
-- 날짜: idx_room_status_status_date, idx_daily_cleaning_task_task_date,
--       idx_room_booking_start_at, idx_room_booking_room_start, idx_room_booking_end_at.
-- 추가로 필요한 복합 인덱스 없음. (한 화면 한 RPC로 N+1 없음)

-- 캐시·무효화: RPC는 서버 측 캐시 미적용. 클라이언트/CDN에서
-- rpc_room_detail, rpc_floor_room_cards 등은 TTL 1분 권장(문서화는 docs/PHASE10_완료.md).
-- 이벤트 발생 시(이슈 접수/해결, 청소 완료, 비품 등록/해제) 해당 화면 데이터 재요청으로 무효화.

COMMENT ON FUNCTION rpc_room_detail(uuid, date) IS '공간 상세. 캐시 권장 TTL 60초. 이벤트 시 재요청.';
COMMENT ON FUNCTION rpc_floor_room_cards(uuid, date) IS '층 공간 카드. 캐시 권장 TTL 60초. 이벤트 시 재요청.';
