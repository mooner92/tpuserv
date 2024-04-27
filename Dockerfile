# 기본 이미지 설정
FROM ubuntu:22.04.5

# 필수 패키지 설치 및 환경 구성
RUN apt-get update && apt-get install -y \
    python3\
    python3-pip \
    git \
    curl


# 변경사항 update
RUN apt update

# TF runtime install
RUN pip3 install tflite-runtime

# Pillow
RUN pip3 install Pillow


# Coral TPU 라이브러리 저장소 추가
RUN echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" > /etc/apt/sources.list.d/coral-edgetpu.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -

# 패키지 업데이트 및 Coral TPU 라이브러리 설치
RUN apt-get update && apt-get install -y libedgetpu1-std python3-pycoral

# Coral 디렉토리 생성 및 pycoral 라이브러리 클론
WORKDIR /coral
RUN git clone https://github.com/google-coral/pycoral.git

# pycoral 예제의 요구사항 설치
WORKDIR /coral/pycoral
RUN bash examples/install_requirements.sh classify_image.py

# 로컬에서 ci4.py 파일을 컨테이너 내의 해당 디렉토리로 복사
COPY ./ci4.py /coral/pycoral/examples/ci4.py

# 작업 디렉토리 설정
WORKDIR /nodeserver

# 애플리케이션 소스 복사
COPY . .

# 컨테이너 시작 시 실행할 명령어
CMD [ "node", "main.js" ]
