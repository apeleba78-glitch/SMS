# Supabase 연동 가이드

아래 순서대로 하면 Supabase를 프로젝트에 연결할 수 있습니다.

---

## 1단계: Supabase 가입 및 프로젝트 생성

### 1-1. 로그인

1. **https://supabase.com** 접속
2. **Start your project** 클릭
3. **Sign in with GitHub** 로 권장 (GitHub 이미 사용 중이면 편함)

### 1-2. 새 프로젝트 만들기

1. 로그인 후 **New project** 클릭
2. **Organization**: 기본값 또는 새로 생성
3. **Name**: `sms` (또는 원하는 이름)
4. **Database Password**: **반드시 적어 두기** (나중에 DB 접속 시 필요)
5. **Region**: `Northeast Asia (Seoul)` 또는 가까운 지역
6. **Create new project** 클릭 → 1~2분 대기

---

## 2단계: API 키 확인

1. 프로젝트가 준비되면 왼쪽 아래 **⚙️ Project Settings** 클릭
2. **API** 메뉴 선택
3. 아래 두 값을 복사해 두세요:

| 항목 | 위치 | 용도 |
|------|------|------|
| **Project URL** | Configuration → Project URL | 프론트/백엔드에서 Supabase 주소 |
| **anon public** 키 | Project API keys → anon public | 프론트엔드에서 사용 (공개 가능) |

- **service_role** 키는 서버 전용·절대 프론트에 노출하지 마세요.

---

## 3단계: 프로젝트에 환경 변수 설정

### 3-1. `.env.local` 파일 만들기

프로젝트 루트(`/Users/han/Desktop/sms`)에 `.env.local` 파일을 만들고 아래를 넣습니다.  
**실제 값**은 Supabase 대시보드에서 복사한 것으로 바꾸세요.

```env
# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://여기에프로젝트URL.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=여기에_anon_public_키_붙여넣기
```

- **Next.js** 사용 시: 위 변수 그대로 사용 (NEXT_PUBLIC_ 접두사 필요)
- **Vite** 사용 시: 변수 이름을 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 로 바꾸기
- **일반 Node/React 등**: `SUPABASE_URL`, `SUPABASE_ANON_KEY` 등으로 사용 가능

### 3-2. 확인

- `.env.local`은 **Git에 올리지 마세요** (이미 `.gitignore`에 포함됨)
- 예시만 필요하면 `cp .env.example .env.local` 후 값만 채우면 됩니다.

---

## 4단계: (선택) 테이블 하나 만들기

Supabase를 바로 쓰려면 테이블이 있어야 합니다.

1. Supabase 대시보드 왼쪽 **Table Editor** 클릭
2. **New table** 클릭
3. **Name**: 예) `messages` 또는 `posts`
4. **Columns** 예시:
   - `id` (type: int8, Primary key, Identity)
   - `created_at` (type: timestamptz, default: now())
   - `content` (type: text)
5. **Save** 클릭

나중에 코드에서 이 테이블을 조회/추가할 수 있습니다.

---

## 체크리스트

| 단계 | 내용 | 완료 |
|------|------|------|
| 1 | Supabase 가입 (GitHub 로그인) | ☐ |
| 2 | New project → 이름·비밀번호·리전 설정 | ☐ |
| 3 | Project Settings → API에서 URL + anon key 복사 | ☐ |
| 4 | `.env.local` 생성 후 위 두 값 입력 | ☐ |
| 5 | (선택) Table Editor에서 테이블 생성 | ☐ |

---

## 다음 단계

- **Vercel**에 배포할 때: Vercel 프로젝트 **Settings → Environment Variables**에 같은 이름으로 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` 추가
- **코드에서 사용**: 사용할 프레임워크(Next.js, Vite 등)가 정해지면 Supabase 클라이언트 설치 및 연동 코드 예시를 추가해 드릴 수 있습니다.
