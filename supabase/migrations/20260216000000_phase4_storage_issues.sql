-- Phase 4: 이슈 이미지 저장용 Storage RLS
-- 경로: issues/{issue_id}/before.webp, issues/{issue_id}/after.webp
-- 버킷 생성: Supabase 대시보드 → Storage → New bucket → 이름 "issues", Public 체크

DROP POLICY IF EXISTS "anon_upload_issues" ON storage.objects;
CREATE POLICY "anon_upload_issues"
ON storage.objects FOR INSERT TO anon
WITH CHECK (bucket_id = 'issues');

DROP POLICY IF EXISTS "anon_read_issues" ON storage.objects;
CREATE POLICY "anon_read_issues"
ON storage.objects FOR SELECT TO anon
USING (bucket_id = 'issues');

-- 이슈 after_image_path 업데이트용 (해결 시 After 이미지 경로 저장)
DROP POLICY IF EXISTS "anon_update_issue" ON issue;
CREATE POLICY "anon_update_issue"
ON issue FOR UPDATE TO anon
USING (true)
WITH CHECK (true);
