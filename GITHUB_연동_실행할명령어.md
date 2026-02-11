# GitHub 연동 - 지금 실행할 명령어

로컬 Git 초기화와 첫 커밋은 **이미 완료**된 상태입니다.

---

## 1. GitHub에서 저장소 만들기 (한 번만)

1. 브라우저에서 **https://github.com/new** 로 이동
2. **Repository name**: `sms` (또는 원하는 이름)
3. **Public** 선택
4. **"Add a README file"** 등은 체크하지 말고, 빈 저장소로 생성
5. **Create repository** 클릭

---

## 2. 아래 명령어 실행 (본인 정보로 수정)

저장소를 만든 뒤, 터미널에서 **한 줄씩** 실행하세요.

**`본인GitHub아이디`** 를 실제 GitHub 사용자명으로 바꾸세요.  
저장소 이름을 `sms`가 아닌 다른 이름으로 만들었다면 **`sms`** 부분도 바꾸세요.

```bash
cd /Users/han/Desktop/sms

git remote add origin https://github.com/본인GitHub아이디/sms.git

git branch -M main

git push -u origin main
```

예: GitHub 아이디가 `han-dev` 이라면  
`https://github.com/han-dev/sms.git`

---

## 3. 푸시 시 로그인

- **비밀번호** 대신 **Personal Access Token** 사용 가능
- GitHub: **Settings → Developer settings → Personal access tokens** 에서 토큰 생성 후, 비밀번호 입력하는 곳에 토큰 붙여넣기

---

연동이 끝나면 GitHub 페이지에서 `README.md`, `setup.sh` 등 파일이 보이면 성공입니다.
