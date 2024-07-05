# Dockerfile
FROM python:3.10-bullseye

# 작업 디렉토리 설정
WORKDIR /app

# 필요한 패키지 설치
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# 애플리케이션 소스 복사
COPY . .

# 환경 변수 설정
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Gunicorn 실행
#CMD ["python", "app.py"]
CMD ["gunicorn", "--timeout", "300", "-w", "4", "-b", "0.0.0.0:5001", "wsgi:app"]
