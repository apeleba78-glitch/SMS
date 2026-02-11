# SMS 프로젝트 - 개발 환경 가이드

## 현재 시스템 상태

| 도구 | 상태 |
|------|------|
| Python 3 | ✅ 설치됨 |
| pip3 | ✅ 설치됨 |
| Git | ✅ 설치됨 |
| Node.js / npm | ❌ 미설치 |
| Homebrew | ❌ 미설치 |

---

## 1. Homebrew 설치 (macOS 패키지 매니저)

터미널에서 아래 명령어를 실행하세요. 비밀번호 입력이 필요할 수 있습니다.

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

설치 후 터미널에 표시되는 안내에 따라 PATH를 설정하세요. 예시:

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"
```

---

## 2. Node.js 설치

Homebrew 설치 후:

```bash
brew install node
```

버전 확인:

```bash
node -v   # v20.x 이상 권장
npm -v
```

---

## 3. (선택) Python 가상환경

프로젝트별로 Python 환경을 쓰려면:

```bash
python3 -m venv venv
source venv/bin/activate   # macOS/Linux
pip install --upgrade pip
```

---

## 4. 한 번에 설치하기

`setup.sh` 스크립트를 실행하면 Homebrew·Node 설치 여부를 확인하고 안내합니다.

```bash
chmod +x setup.sh
./setup.sh
```

---

## 5. 추천 에디터/IDE

- **Cursor** (현재 사용 중) – AI 지원 코드 에디터
- **VS Code** – 동일 기반, 확장 기능 풍부

---

## 문제 해결

- **Permission denied**: `chmod +x setup.sh` 후 다시 실행
- **brew: command not found**: 위 1단계 PATH 설정 후 터미널 재시작
- **Node 버전 관리**: `nvm`(Node Version Manager) 사용 시 `brew install nvm` 후 설정

필요한 프로그램이 더 있으면 알려주시면 가이드에 추가하겠습니다.

---

## 다음 단계: GitHub + Supabase + Vercel 연동

개발 환경 설치가 끝났다면 **`GITHUB_SUPABASE_VERCEL_연동가이드.md`** 를 보고  
GitHub(코드 저장) → Supabase(DB/인증) → Vercel(배포) 순서로 연동하면 됩니다.
