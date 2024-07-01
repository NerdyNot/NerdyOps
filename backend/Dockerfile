FROM python:3.10-bullseye

# Set the working directory
WORKDIR /app

# Install required packages
COPY requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY . .

# Set environment variables
ENV FLASK_APP=app.py
ENV FLASK_RUN_HOST=0.0.0.0

# Run Gunicorn server
CMD ["gunicorn", "--workers", "4", "--bind", "0.0.0.0:5001", "app:app"]