# Vercel 연동 가이드

GitHub 저장소를 Vercel에 연결하면 푸시할 때마다 자동 배포됩니다.

---

## 1단계: Vercel 가입 및 GitHub 연결

1. **https://vercel.com** 접속
2. **Sign Up** 또는 **Continue with GitHub** 클릭
3. GitHub 계정(**apeleba78-glitch**)으로 로그인
4. **Authorize Vercel** 에서 Vercel이 GitHub 저장소에 접근하도록 허용

---

## 2단계: 프로젝트 Import

1. Vercel 대시보드에서 **Add New...** → **Project** 클릭
2. **Import Git Repository** 목록에서 **apeleba78-glitch/SMS** (또는 `SMS`) 선택
3. **Import** 클릭

---

## 2-2. Next.js 프로젝트 설정 확인

- **Framework Preset**: Next.js 로 자동 감지되어야 합니다. (프로젝트 루트에 `vercel.json` 에 `"framework": "next"` 가 있으면 명시됨)
- **Output Directory**: 비워 두세요. Next.js 는 `.next` 를 사용하므로 `public` 등으로 설정하면 배포 오류가 납니다.

---

## 3단계: 환경 변수 추가 (Supabase)

배포 설정 화면에서 **Environment Variables** 섹션으로 이동한 뒤 아래 두 개 추가:

| Name | Value |
|------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local`에 있는 Supabase Project URL (예: `https://rlddntyewljrfkohwcso.supabase.co`) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local`에 있는 anon public 키 |

- **Environment**: Production, Preview, Development 모두 체크해 두면 편합니다.
- **Add** 클릭 후 **Deploy** 진행

---

## 4단계: Deploy

1. **Deploy** 버튼 클릭
2. 빌드가 끝나면 **Visit** 또는 배포 URL(예: `https://sms-xxx.vercel.app`)로 접속 가능

---

## 5단계: 이후 배포

- **main** 브랜치에 `git push` 할 때마다 Vercel이 자동으로 다시 배포합니다.
- 배포 이력/로그: Vercel 대시보드 → 해당 프로젝트 → **Deployments**

---

## 참고: 현재 프로젝트 구조

지금 저장소에는 앱 코드(Next.js, Vite 등)가 없고 가이드·설정 파일만 있어서, 첫 배포는 **정적 사이트** 또는 **빌드 없음**으로 될 수 있습니다.  
나중에 Next.js/Vite 등으로 앱을 추가하면:

1. 해당 폴더에 `package.json` 등 추가 후 `git push`
2. Vercel에서 프로젝트 **Settings** → **General** → **Framework Preset**을 해당 프레임워크로 선택(또는 자동 감지)
3. 다시 배포

위 환경 변수는 이미 넣어 두었으므로 그대로 사용됩니다.

---

## 체크리스트

| 단계 | 내용 | 완료 |
|------|------|------|
| 1 | vercel.com 접속 → GitHub 로그인 | ☐ |
| 2 | Add New → Project → SMS 저장소 Import | ☐ |
| 3 | Environment Variables에 Supabase URL, anon key 추가 | ☐ |
| 4 | Deploy 클릭 | ☐ |
| 5 | 배포 URL 확인 | ☐ |
