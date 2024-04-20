# Node.js 이미지를 베이스 이미지로 사용
FROM node:14

# 애플리케이션 디렉토리 생성
WORKDIR /usr/src/app

# 애플리케이션 의존성 파일 복사
COPY package*.json ./

# 패키지 설치
RUN npm install

# 애플리케이션 소스 복사
COPY . .

# 애플리케이션 실행 포트
EXPOSE 3000

# 애플리케이션 실행
CMD [ "node", "main.js" ]
