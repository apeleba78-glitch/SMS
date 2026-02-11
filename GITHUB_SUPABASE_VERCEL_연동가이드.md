# GitHub + Supabase + Vercel 연동 가이드

세 서비스를 연결하면 **코드 저장 → 백엔드(DB/인증) → 배포**가 한 흐름으로 이어집니다.

---

## 전체 흐름

```
[로컬 코드] → GitHub (저장/버전관리)
                    ↓
[Supabase] ← API 키로 연결 (DB, 인증, 스토리지)
                    ↓
[Vercel] ← GitHub 연동 자동 배포 (프론트/API)
```

---

## 1단계: GitHub 연동

### 1-1. GitHub에서 저장소 만들기

1. [github.com](https://github.com) 로그인
2. **New repository** (또는 **+** → **New repository**)
3. Repository name: `sms` (또는 원하는 이름)
4. **Public** 선택 후 **Create repository** 클릭

### 1-2. 로컬에서 Git 초기화 후 푸시

프로젝트 폴더(`sms`)에서 터미널 실행:

```bash
cd /Users/han/Desktop/sms

# Git 초기화 (아직 안 했다면)
git init

# 모든 파일 스테이징
git add .

# 첫 커밋
git commit -m "Initial commit: dev environment setup"

# GitHub 저장소 연결 (본인 아이디/저장소이름으로 수정)
git remote add origin https://github.com/본인아이디/sms.git

# 기본 브랜치 이름 설정 (필요한 경우)
git branch -M main

# 푸시
git push -u origin main
```

- **본인아이디/sms** 부분을 실제 GitHub 사용자명과 저장소 이름으로 바꾸세요.
- 푸시 시 GitHub 로그인 또는 Personal Access Token 입력이 필요할 수 있습니다.

---

## 2단계: Supabase 연동

### 2-1. Supabase 프로젝트 만들기

1. [supabase.com](https://supabase.com) 로그인 (GitHub으로 로그인 가능)
2. **New project** → Organization 선택 → 프로젝트 이름 입력 (예: `sms`)
3. 데이터베이스 비밀번호 설정 후 **Create new project** (생성까지 1~2분 소요)

### 2-2. API 키 확인

1. Supabase 대시보드 → 왼쪽 **Project Settings** (톱니바퀴)
2. **API** 메뉴 클릭
3. 아래 값들을 복사해 둡니다:
   - **Project URL** (예: `https://xxxxx.supabase.co`)
   - **anon public** 키 (프론트엔드에서 사용)
   - **service_role** 키 (서버/백엔드에서만 사용, 노출 금지)

### 2-3. 프로젝트에 환경 변수로 넣기

프로젝트 루트에 `.env.local` 파일을 만들고 (이 파일은 Git에 올리지 않습니다):

```env
NEXT_PUBLIC_SUPABASE_URL=https://여기에프로젝트URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_키
```

- Next.js가 아니라 다른 프레임워크면 변수 이름을 그에 맞게 바꾸면 됩니다 (예: `VITE_SUPABASE_URL`, `VUE_APP_SUPABASE_URL`).

---

## 3단계: Vercel 연동

### 3-1. Vercel에서 GitHub 연결

1. [vercel.com](https://vercel.com) 로그인 (**Continue with GitHub** 권장)
2. 대시보드에서 **Add New...** → **Project**
3. **Import Git Repository**에서 GitHub 저장소 목록이 보이면, 방금 만든 `sms` 저장소 선택

### 3-2. 프로젝트 설정

1. **Import** 클릭
2. Framework Preset: 사용할 프레임워크 선택 (Next.js, Vite, Create React App 등)
3. **Environment Variables** 섹션에서 Supabase 값 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = Supabase Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = Supabase anon key
4. **Deploy** 클릭

### 3-3. 이후 배포

- `main` 브랜치에 `git push` 할 때마다 Vercel이 자동으로 다시 배포합니다.

---

## 체크리스트

| 단계 | 내용 | 완료 |
|------|------|------|
| 1 | GitHub 저장소 생성 | ☐ |
| 2 | 로컬 `git init` → `git push` | ☐ |
| 3 | Supabase 프로젝트 생성 | ☐ |
| 4 | Supabase URL + anon key 복사 | ☐ |
| 5 | `.env.local`에 Supabase 변수 추가 | ☐ |
| 6 | Vercel 로그인 + GitHub 연동 | ☐ |
| 7 | Vercel에서 저장소 Import | ☐ |
| 8 | Vercel에 Supabase 환경 변수 등록 | ☐ |
| 9 | Deploy 후 URL 확인 | ☐ |

---

## 주의사항

- **`.env.local`**, **`.env`** 는 절대 GitHub에 올리지 마세요. (`.gitignore`에 포함되어 있어야 함)
- **service_role** 키는 Supabase 대시보드나 서버 환경에서만 사용하고, 프론트엔드 코드나 Vercel의 공개 환경 변수에는 넣지 마세요.
- 처음에는 **anon key**만 Vercel 환경 변수로 넣으면 됩니다.

이 순서대로 하면 GitHub ↔ Supabase ↔ Vercel 연동까지 한 번에 맞출 수 있습니다. 특정 단계에서 막히면 그 단계 이름과 화면을 알려주면 다음 명령/설정까지 구체적으로 적어줄 수 있습니다.
