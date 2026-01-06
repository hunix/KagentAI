# Agentic IDE Docker Image

FROM node:22-alpine

# Set working directory
WORKDIR /app

# Install dependencies
RUN apk add --no-cache \
    git \
    curl \
    bash \
    python3 \
    make

# Copy package files
COPY package*.json ./
COPY tsconfig.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY src/ ./src/

# Compile TypeScript
RUN npm run compile

# Expose port
EXPOSE 3000 8000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000

# Start application
CMD ["npm", "start"]
