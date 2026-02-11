# Mac에서 로컬 서버 실행

**Mac에서는 `start.bat`을 쓰지 마세요.** (Windows용입니다.)

## 방법 1: 터미널에서 실행 (권장)

1. **터미널** 또는 **Cursor 하단 터미널**을 연다.
2. 프로젝트 폴더로 이동:
   ```bash
   cd /Users/han/Desktop/sms
   ```
3. 실행:
   ```bash
   ./start.sh
   ```
4. 브라우저에서 접속:
   - 터미널에 **Local: http://localhost:3000** 이 나오면 → **http://localhost:3000** 입력
   - **Port 3000 is in use, trying 3001** 이 나오면 → **http://localhost:3001** 입력  
   (주소창에 `localhost`만 쓰면 안 됩니다. **반드시 포트 번호까지** 입력하세요.)

## 방법 2: 더블클릭

1. Finder에서 `sms` 폴더를 연다.
2. **`start.command`** 파일을 더블클릭한다.
3. 터미널이 열리면서 서버가 시작된다.  
   (처음 실행 시 "실행할 수 없는 개발자로 확인된 앱"이라고 나오면: **시스템 설정 → 개인 정보 보호 및 보안**에서 허용하거나, 방법 1 사용.)

## 오류가 날 때

- **"npm을 찾을 수 없습니다"**  
  터미널에서 `brew install node` 실행 후 다시 `./start.sh`.

- **"Permission denied"**  
  터미널에서 한 번만 실행:
  ```bash
  chmod +x /Users/han/Desktop/sms/start.sh
  chmod +x /Users/han/Desktop/sms/start.command
  ```

- **`node_modules` 없음**  
  `start.sh`가 자동으로 `npm install`을 실행합니다. 네트워크가 되는지 확인하세요.

- **로딩만 되고 서버 반응이 없다**  
  브라우저 주소가 **http://localhost:3001** (또는 터미널에 나온 포트)인지 확인하세요.  
  `http://localhost` (포트 없음)로 열면 다른 서비스로 가서 앱이 안 보입니다.
