# Stage 1: Build the Next.js application
FROM node:20.9.0-bullseye AS builder

WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy all files and build the application
COPY frontend .
RUN npm run build && npm run export

# Stage 2: Set up NGINX and Python environment
FROM python:3.10-bullseye

# Install NGINX and supervisor
RUN apt-get update && apt-get install -y nginx supervisor

# Install dependencies for Python
WORKDIR /app
COPY backend/requirements.txt requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

# Copy the built Next.js application from the previous stage
COPY --from=builder /app/out /usr/share/nginx/html

# Copy the rest of the Flask application
COPY backend .

# Copy NGINX configuration file
COPY infra/nginx.conf /etc/nginx/nginx.conf

# Copy Supervisor configuration file
COPY infra/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Expose port 80 for NGINX
EXPOSE 80

# Start Supervisor and tail Gunicorn log
CMD ["/bin/sh", "-c", "supervisord -c /etc/supervisor/conf.d/supervisord.conf"]
