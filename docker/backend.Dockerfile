# Multi-stage production build for MediLink AI Backend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schema first
COPY backend/package*.json ./backend/
COPY database/prisma ./database/prisma/

# Install dependencies in backend
WORKDIR /app/backend
RUN npm ci

# Copy source files
WORKDIR /app
COPY backend ./backend
COPY database ./database
COPY shared ./shared

# Generate Prisma client
WORKDIR /app/backend
RUN npm run prisma:generate

# Build TypeScript application
RUN npm run build

# Production runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Copy compiled backend and node_modules containing the generated Prisma client
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/backend/node_modules ./backend/node_modules
COPY --from=builder /app/backend/package*.json ./backend/
COPY --from=builder /app/database ./database
COPY --from=builder /app/shared ./shared

WORKDIR /app/backend
EXPOSE 5000

CMD ["node", "dist/app.js"]
