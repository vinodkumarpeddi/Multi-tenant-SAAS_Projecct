FROM node:20-alpine

WORKDIR /app

# Install PostgreSQL client for database init script
RUN apk add --no-cache postgresql-client

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy source code
COPY . .

# Expose port
EXPOSE 5000

# Start command
CMD ["node", "src/index.js"]
