-- RLS 정책: anon(비로그인)으로 앱 테스트 가능하도록 읽기/이슈 접수 허용
-- 적용 후에도 "로딩 중"이면 Supabase 대시보드 → Authentication → Policies에서 이 정책이 있는지 확인하세요.

-- 기존 RLS가 꺼져 있으면 켜기 (테이블별)
ALTER TABLE church ENABLE ROW LEVEL SECURITY;
ALTER TABLE floor ENABLE ROW LEVEL SECURITY;
ALTER TABLE room ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue ENABLE ROW LEVEL SECURITY;
ALTER TABLE issue_activity_log ENABLE ROW LEVEL SECURITY;

-- anon: 읽기 허용 (층·공간·공간상태·이슈 목록/상세용) — 이미 있으면 제거 후 재생성(재실행 대비)
DROP POLICY IF EXISTS "anon_select_church" ON church;
CREATE POLICY "anon_select_church" ON church FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_select_floor" ON floor;
CREATE POLICY "anon_select_floor" ON floor FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_select_room" ON room;
CREATE POLICY "anon_select_room" ON room FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_select_room_status" ON room_status;
CREATE POLICY "anon_select_room_status" ON room_status FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_select_issue" ON issue;
CREATE POLICY "anon_select_issue" ON issue FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "anon_select_issue_activity_log" ON issue_activity_log;
CREATE POLICY "anon_select_issue_activity_log" ON issue_activity_log FOR SELECT TO anon USING (true);

-- anon: 이슈 접수(INSERT) 허용
DROP POLICY IF EXISTS "anon_insert_issue" ON issue;
CREATE POLICY "anon_insert_issue" ON issue FOR INSERT TO anon WITH CHECK (true);

-- room_status는 트리거에서만 갱신하므로 anon UPDATE 불필요. RPC는 SECURITY DEFINER로 실행됨.
