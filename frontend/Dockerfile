# Stage 1: Build the Next.js application
FROM node:20.9.0-bullseye

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy all files and build the application
COPY . .
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Set environment variable for production
ENV NODE_ENV production

# Start the Next.js application
CMD ["npm", "start"]
