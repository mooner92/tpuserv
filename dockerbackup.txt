# Node.js 이미지를 베이스 이미지로 사용
FROM node:21.7.2

# Python 설치
RUN apt-get update && apt-get install -y python3 python3-pip

# 애플리케이션 디렉토리 생성
WORKDIR /usr/src/app

# 애플리케이션 의존성 파일 복사
COPY package*.json ./

# 패키지 설치
RUN npm install

# 애플리케이션 소스 복사
COPY . .

# 애플리케이션 실행 포트 수정
EXPOSE 12345

# 애플리케이션 실행
CMD [ "node", "main.js" ]
