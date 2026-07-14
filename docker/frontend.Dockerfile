# Multi-stage production build for MediLink AI Frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY frontend/package*.json ./frontend/

# Install dependencies in frontend
WORKDIR /app/frontend
RUN npm ci

# Copy source files
WORKDIR /app
COPY frontend ./frontend
COPY shared ./shared

# Build Next.js application
WORKDIR /app/frontend
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV NEXT_TELEMETRY_DISABLED=1

# Copy build artifacts and dependencies
COPY --from=builder /app/frontend/.next ./frontend/.next
COPY --from=builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=builder /app/frontend/package*.json ./frontend/
COPY --from=builder /app/frontend/public ./frontend/public
COPY --from=builder /app/shared ./shared

WORKDIR /app/frontend
EXPOSE 3000

CMD ["npm", "run", "start"]
