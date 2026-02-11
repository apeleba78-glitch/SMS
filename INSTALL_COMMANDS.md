# 개발 환경 설치 - 실행할 명령어

아래 순서대로 **터미널**에서 실행하세요.

---

## 1단계: Homebrew 설치

복사 후 터미널에 붙여넣기:

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

- 비밀번호 입력 요청 시 Mac 로그인 비밀번호 입력
- 설치 끝나면 화면에 나오는 **"Next steps"** 안내대로 PATH 설정

**Apple Silicon (M1/M2/M3) PATH 설정:**

```bash
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile && eval "$(/opt/homebrew/bin/brew shellenv)"
```

**Intel Mac PATH 설정:**

```bash
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile && eval "$(/usr/local/bin/brew shellenv)"
```

---

## 2단계: Node.js 설치

```bash
brew install node
```

---

## 3단계: 설치 확인

```bash
node -v
npm -v
brew -v
```

---

## 4단계: 프로젝트 설정 스크립트 다시 실행 (선택)

```bash
cd /Users/han/Desktop/sms
./setup.sh
```

---

이후 프로젝트 타입(웹/백엔드/앱 등)이 정해지면 필요한 추가 도구를 안내하겠습니다.
