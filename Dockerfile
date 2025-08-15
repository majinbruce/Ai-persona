# Use Node.js 18 LTS
FROM node:18-alpine

# Install curl for health checks
RUN apk add --no-cache curl

# Set working directory
WORKDIR /app

# Copy server package files
COPY server/package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy server source code
COPY server/ .

# Expose port (Railway will set PORT env var)
EXPOSE 5000

# Let Railway handle health checks via railway.toml

# Start the application
CMD ["npm", "start"]