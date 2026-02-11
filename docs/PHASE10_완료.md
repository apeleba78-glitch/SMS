# Phase 10 완료: 성능·접근성 점검

## 1. DB 점검

- **FK·room_status·날짜 인덱스**: Phase 0~8에서 적용 완료. 모든 FK 컬럼 및 `room_status(room_id, status_date)`, `daily_cleaning_task(room_id, task_date)`, `room_booking(room_id, start_at)` 등 날짜/시간 기반 인덱스 존재.
- **N+1**: 한 화면 한 RPC 원칙으로 목록·상세 각각 단일 호출. N+1 쿼리 없음.
- **select \***: 마이그레이션 내 select는 필요한 컬럼만 명시.
- **불필요 join**: RPC별로 필요한 테이블만 join.

## 2. API·캐시

- **한 화면 한 호출**: 공간 상세(`rpc_room_detail`), 층 카드(`rpc_floor_room_cards`), 오늘 청소(`rpc_today_cleaning_list`), 이슈 상세(`rpc_issue_detail`) 등 유지.
- **캐시 권장**: `rpc_room_detail`, `rpc_floor_room_cards` 등 읽기 전용 RPC는 클라이언트 또는 CDN에서 **TTL 60초** 적용 권장. 이슈 접수/해결, 청소 완료, 비품 등록/해제 등 이벤트 발생 시 해당 화면 데이터 **재요청**으로 무효화.

## 3. 프론트 접근성 (PROJECT_BASELINE 11-5)

- **포커스**: 주요 버튼(`.btnPrimary`, `.btnSecondary`), 카드 링크(`.cardLink`), `button`/`input`/`a`에 `:focus-visible` 스타일 적용 (2px outline).
- **스크린리더**: 폼 입력에 `aria-label` 적용 (부족 비품명, 예약 일시, 용도, 조회 날짜 등).
- **날짜 표시**: 현재 `toLocaleString('ko-KR')` 사용. church.timezone 연동 시 해당 타임존으로 통일 권장.

## 4. 요약

| 항목 | 상태 |
|------|------|
| FK·날짜 인덱스 | 적용됨 |
| N+1·select*·불필요 join | 점검 완료, 없음 |
| 한 화면 한 API | 준수 |
| 캐시 권장 TTL 60초 | 문서화 |
| 포커스·aria-label | 적용 |

---

v1.0, 2026-02-11
