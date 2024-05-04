# 기본 이미지 설정
FROM ubuntu:20.04

# 필수 패키지 설치 및 환경 구성
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    git \
    curl

# Node.js 설치
RUN curl -fsSL https://deb.nodesource.com/setup_16.x | bash - && \
    apt-get install -y nodejs

# 기타 필요한 Python 패키지 설치
RUN pip3 install tflite-runtime Pillow

# Coral TPU 라이브러리 저장소 추가 및 설치
RUN echo "deb https://packages.cloud.google.com/apt coral-edgetpu-stable main" > /etc/apt/sources.list.d/coral-edgetpu.list \
    && curl https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add - \
    && apt-get update && apt-get install -y python3-pycoral

# 필요한 패키지 설치 전에 debconf를 사용하여 자동 선택을 설정
RUN echo 'libedgetpu1-max libedgetpu/accepted-eula boolean true' | debconf-set-selections

# 이제 패키지 설치 진행
RUN apt-get install -y libedgetpu1-max


# Coral 디렉토리 생성 및 pycoral 라이브러리 클론
WORKDIR /coral
RUN git clone https://github.com/google-coral/pycoral.git

# pycoral 예제의 요구사항 설치
WORKDIR /coral/pycoral
RUN bash examples/install_requirements.sh classify_image.py

# 로컬에서 ci4.py 파일을 컨테이너 내의 해당 디렉토리로 복사
COPY ./ci6.py /coral/pycoral/examples/ci6.py
COPY ./ci5.py /coral/pycoral/examples/ci5.py

# 애플리케이션 소스 파일 복사
WORKDIR /nodeserver
COPY . .

# 컨테이너 시작 시 실행할 명령어
CMD ["node", "main.js"]
