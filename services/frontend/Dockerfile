# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Set environment variables for build (pointing to Docker service names)
ENV NEXT_PUBLIC_USER_SERVICE_URL=http://user-service:3001
ENV NEXT_PUBLIC_QUESTION_SERVICE_URL=http://question-service:8000
ENV NEXT_PUBLIC_PARTYKIT_HOST=localhost:1999

# Build the application
RUN pnpm run build

# Runtime stage
FROM node:20-alpine AS runtime

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install only production dependencies
RUN pnpm install --frozen-lockfile --prod

# Copy built application from builder
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000

CMD ["pnpm", "start"]
