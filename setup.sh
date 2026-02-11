#!/bin/bash
# SMS 프로젝트 - 개발 환경 자동 설정 스크립트 (macOS)

set -e
echo "=========================================="
echo "  SMS 개발 환경 설정"
echo "=========================================="
echo ""

# 1. Homebrew 확인 및 설치
if command -v brew &> /dev/null; then
    echo "✅ Homebrew 이미 설치됨: $(brew --version | head -1)"
else
    echo "❌ Homebrew가 설치되어 있지 않습니다."
    echo ""
    echo "다음 명령어로 Homebrew를 설치한 뒤 이 스크립트를 다시 실행하세요:"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    echo ""
    echo "설치 후 PATH 설정 (Apple Silicon 예시):"
    echo '  echo '\''eval "$(/opt/homebrew/bin/brew shellenv)"'\'' >> ~/.zprofile'
    echo '  eval "$(/opt/homebrew/bin/brew shellenv)"'
    echo ""
    exit 1
fi

# 2. Node.js 확인 및 설치
if command -v node &> /dev/null; then
    echo "✅ Node.js 이미 설치됨: $(node -v)"
    echo "✅ npm: $(npm -v)"
else
    echo "📦 Node.js 설치 중..."
    brew install node
    echo "✅ Node.js 설치 완료: $(node -v)"
fi

# 3. Git 확인
if command -v git &> /dev/null; then
    echo "✅ Git: $(git --version)"
else
    echo "⚠️  Git이 없습니다. 설치: brew install git"
fi

# 4. Python 확인
if command -v python3 &> /dev/null; then
    echo "✅ Python: $(python3 --version)"
else
    echo "⚠️  Python3가 없습니다. 설치: brew install python"
fi

echo ""
echo "=========================================="
echo "  설정 완료. 개발을 시작하세요."
echo "=========================================="
