#!/bin/bash
# 로컬 개발 서버 시작 (Next.js) — Mac용
cd "$(dirname "$0")"

# Mac: 터미널에서 실행할 때 Homebrew 등 PATH 로드
[ -f "$HOME/.zprofile" ] && source "$HOME/.zprofile" 2>/dev/null
[ -f "$HOME/.zshrc" ] && source "$HOME/.zshrc" 2>/dev/null
# Apple Silicon Homebrew
[ -d "/opt/homebrew/bin" ] && export PATH="/opt/homebrew/bin:$PATH"

if ! command -v npm &>/dev/null; then
  echo "오류: npm을 찾을 수 없습니다."
  echo "터미널에서 다음을 실행한 뒤 다시 시도하세요:"
  echo "  brew install node"
  exit 1
fi

if [ ! -d "node_modules" ]; then
  echo "의존성 설치 중... (npm install)"
  npm install
fi

echo ""
echo "=========================================="
echo "  로컬 서버 시작"
echo "=========================================="
echo "  브라우저에서 열 주소:"
echo "  → http://localhost:3000"
echo "  (3000이 사용 중이면 터미널에 나온 주소 사용, 예: http://localhost:3001)"
echo "  종료: Ctrl + C"
echo "=========================================="
echo ""

npm run dev
